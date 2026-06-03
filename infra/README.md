# AWS Infrastructure Setup — CA Fashion CRM

Step-by-step guide to deploy the CRM on AWS ECS Fargate with ALB, Auto Scaling, and RDS PostgreSQL.

> **Region**: `eu-west-2` (London). Replace with your region throughout.
> **Prerequisites**: AWS CLI v2 configured, Docker installed locally.

---

## 1. Create ECR Repository

```bash
aws ecr create-repository \
  --repository-name ca-fashion-crm \
  --region eu-west-2 \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES256
```

## 2. Create VPC & Networking

```bash
# Create VPC
VPC_ID=$(aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=ca-fashion-vpc}]' \
  --query 'Vpc.VpcId' --output text)

aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-support
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-hostnames

# Create Internet Gateway
IGW_ID=$(aws ec2 create-internet-gateway \
  --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=ca-fashion-igw}]' \
  --query 'InternetGateway.InternetGatewayId' --output text)
aws ec2 attach-internet-gateway --internet-gateway-id $IGW_ID --vpc-id $VPC_ID

# Create Subnets
PUB_A=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.1.0/24 \
  --availability-zone eu-west-2a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=ca-fashion-public-a}]' \
  --query 'Subnet.SubnetId' --output text)

PUB_B=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.2.0/24 \
  --availability-zone eu-west-2b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=ca-fashion-public-b}]' \
  --query 'Subnet.SubnetId' --output text)

APP_A=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.10.0/24 \
  --availability-zone eu-west-2a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=ca-fashion-app-a}]' \
  --query 'Subnet.SubnetId' --output text)

APP_B=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.20.0/24 \
  --availability-zone eu-west-2b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=ca-fashion-app-b}]' \
  --query 'Subnet.SubnetId' --output text)

DB_A=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.11.0/24 \
  --availability-zone eu-west-2a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=ca-fashion-db-a}]' \
  --query 'Subnet.SubnetId' --output text)

DB_B=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.12.0/24 \
  --availability-zone eu-west-2b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=ca-fashion-db-b}]' \
  --query 'Subnet.SubnetId' --output text)

# Enable public IP on public subnets
aws ec2 modify-subnet-attribute --subnet-id $PUB_A --map-public-ip-on-launch
aws ec2 modify-subnet-attribute --subnet-id $PUB_B --map-public-ip-on-launch

# Elastic IP + NAT Gateway (for private subnet outbound)
EIP_ID=$(aws ec2 allocate-address --domain vpc --query 'AllocationId' --output text)
NAT_ID=$(aws ec2 create-nat-gateway --subnet-id $PUB_A --allocation-id $EIP_ID \
  --tag-specifications 'ResourceType=natgateway,Tags=[{Key=Name,Value=ca-fashion-nat}]' \
  --query 'NatGateway.NatGatewayId' --output text)

# Wait for NAT gateway to become available
aws ec2 wait nat-gateway-available --nat-gateway-ids $NAT_ID

# Public route table
PUB_RT=$(aws ec2 create-route-table --vpc-id $VPC_ID \
  --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=ca-fashion-public-rt}]' \
  --query 'RouteTable.RouteTableId' --output text)
aws ec2 create-route --route-table-id $PUB_RT --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID
aws ec2 associate-route-table --route-table-id $PUB_RT --subnet-id $PUB_A
aws ec2 associate-route-table --route-table-id $PUB_RT --subnet-id $PUB_B

# Private route table
PRIV_RT=$(aws ec2 create-route-table --vpc-id $VPC_ID \
  --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=ca-fashion-private-rt}]' \
  --query 'RouteTable.RouteTableId' --output text)
aws ec2 create-route --route-table-id $PRIV_RT --destination-cidr-block 0.0.0.0/0 --nat-gateway-id $NAT_ID
aws ec2 associate-route-table --route-table-id $PRIV_RT --subnet-id $APP_A
aws ec2 associate-route-table --route-table-id $PRIV_RT --subnet-id $APP_B
aws ec2 associate-route-table --route-table-id $PRIV_RT --subnet-id $DB_A
aws ec2 associate-route-table --route-table-id $PRIV_RT --subnet-id $DB_B
```

## 3. Create Security Groups

```bash
# ALB security group
SG_ALB=$(aws ec2 create-security-group --vpc-id $VPC_ID \
  --group-name sg-alb --description "ALB - public HTTPS" \
  --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $SG_ALB --protocol tcp --port 443 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SG_ALB --protocol tcp --port 80 --cidr 0.0.0.0/0

# ECS security group
SG_ECS=$(aws ec2 create-security-group --vpc-id $VPC_ID \
  --group-name sg-ecs --description "ECS tasks - from ALB only" \
  --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $SG_ECS \
  --protocol tcp --port 3000 --source-group $SG_ALB

# RDS security group
SG_RDS=$(aws ec2 create-security-group --vpc-id $VPC_ID \
  --group-name sg-rds --description "RDS - from ECS only" \
  --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $SG_RDS \
  --protocol tcp --port 5432 --source-group $SG_ECS
```

## 4. Create RDS PostgreSQL

```bash
# DB subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name ca-fashion-db-subnets \
  --db-subnet-group-description "Private subnets for CRM database" \
  --subnet-ids $DB_A $DB_B

# Create the database
aws rds create-db-instance \
  --db-instance-identifier ca-fashion-crm \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 16 \
  --master-username cafashion \
  --master-user-password '<STRONG_PASSWORD_HERE>' \
  --allocated-storage 20 \
  --storage-type gp3 \
  --db-name cafashion_crm \
  --vpc-security-group-ids $SG_RDS \
  --db-subnet-group-name ca-fashion-db-subnets \
  --multi-az \
  --backup-retention-period 7 \
  --storage-encrypted \
  --no-publicly-accessible

# Wait for RDS to become available (takes ~5-10 minutes)
aws rds wait db-instance-available --db-instance-identifier ca-fashion-crm

# Get the endpoint
aws rds describe-db-instances --db-instance-identifier ca-fashion-crm \
  --query 'DBInstances[0].Endpoint.Address' --output text
```

## 5. Store Database URL in Secrets Manager

```bash
RDS_HOST=$(aws rds describe-db-instances --db-instance-identifier ca-fashion-crm \
  --query 'DBInstances[0].Endpoint.Address' --output text)

aws secretsmanager create-secret \
  --name ca-fashion/database-url \
  --secret-string "postgresql://cafashion:<PASSWORD>@${RDS_HOST}:5432/cafashion_crm"
```

## 6. Create CloudWatch Log Group

```bash
aws logs create-log-group --log-group-name /ecs/ca-fashion-crm --region eu-west-2
aws logs put-retention-policy --log-group-name /ecs/ca-fashion-crm --retention-in-days 30
```

## 7. Create ECS Cluster

```bash
aws ecs create-cluster --cluster-name ca-fashion-cluster \
  --capacity-providers FARGATE FARGATE_SPOT \
  --default-capacity-provider-strategy \
    capacityProvider=FARGATE,weight=1,base=1 \
    capacityProvider=FARGATE_SPOT,weight=3
```

## 8. Create ALB & Target Group

```bash
# Create ALB
ALB_ARN=$(aws elbv2 create-load-balancer \
  --name ca-fashion-alb \
  --subnets $PUB_A $PUB_B \
  --security-groups $SG_ALB \
  --scheme internet-facing \
  --type application \
  --query 'LoadBalancers[0].LoadBalancerArn' --output text)

# Create target group (IP type for Fargate awsvpc mode)
TG_ARN=$(aws elbv2 create-target-group \
  --name ca-fashion-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id $VPC_ID \
  --target-type ip \
  --health-check-path /api/health \
  --health-check-interval-seconds 30 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --query 'TargetGroups[0].TargetGroupArn' --output text)

# HTTPS listener (requires ACM certificate)
# First, request a certificate:
#   aws acm request-certificate --domain-name crm.cafashion.co.uk --validation-method DNS
# Then create the listener:
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTPS --port 443 \
  --certificates CertificateArn=<YOUR_ACM_CERT_ARN> \
  --default-actions Type=forward,TargetGroupArn=$TG_ARN

# HTTP → HTTPS redirect
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP --port 80 \
  --default-actions Type=redirect,RedirectConfig='{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}'
```

## 9. Create IAM Roles for ECS

```bash
# Task execution role (pull images, read secrets, write logs)
aws iam create-role --role-name ecsTaskExecutionRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ecs-tasks.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Allow reading the database secret
aws iam put-role-policy --role-name ecsTaskExecutionRole \
  --policy-name SecretsAccess \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": "arn:aws:secretsmanager:eu-west-2:*:secret:ca-fashion/*"
    }]
  }'

# Task role (what the running container can do — keep minimal)
aws iam create-role --role-name ecsTaskRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ecs-tasks.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'
```

## 10. Register Task Definition & Create Service

```bash
# Edit infra/task-definition.json — replace ACCOUNT_ID with your AWS account ID
# Then register it:
aws ecs register-task-definition --cli-input-json file://infra/task-definition.json

# Create the service
aws ecs create-service \
  --cluster ca-fashion-cluster \
  --service-name ca-fashion-service \
  --task-definition ca-fashion-crm \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$APP_A,$APP_B],securityGroups=[$SG_ECS],assignPublicIp=DISABLED}" \
  --load-balancers "targetGroupArn=$TG_ARN,containerName=ca-fashion-app,containerPort=3000" \
  --deployment-configuration "maximumPercent=200,minimumHealthyPercent=100" \
  --enable-execute-command
```

## 11. Configure Auto Scaling

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/ca-fashion-cluster/ca-fashion-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 1 \
  --max-capacity 4

# CPU-based scaling policy
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/ca-fashion-cluster/ca-fashion-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name ca-fashion-cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleOutCooldown": 60,
    "ScaleInCooldown": 300
  }'
```

## 12. Seed the Database

```bash
# Run the seed script against RDS (from a machine that can reach the DB, or use ECS exec):
aws ecs execute-command --cluster ca-fashion-cluster \
  --task <TASK_ID> --container ca-fashion-app \
  --interactive --command "node lib/seed.js"
```

## 13. Verify

```bash
# Get ALB DNS name
aws elbv2 describe-load-balancers --names ca-fashion-alb \
  --query 'LoadBalancers[0].DNSName' --output text

# Test health endpoint
curl https://<ALB_DNS>/api/health
# Expected: {"status":"healthy","db":"connected","timestamp":"..."}

# Point your domain DNS to the ALB, then visit:
# https://crm.cafashion.co.uk
```
