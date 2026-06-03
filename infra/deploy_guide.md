# CA Fashion CRM — Ipidan Ignasigacha AWS Deploy Qo'llanmasi

Ushbu qo'llanma Next.js ilovangizni **Docker** yordamida konteynerlash, lokal test qilish, **AWS** bulutli infratuzilmasini sozlash (ECS, RDS, ALB, Auto Scaling) va **GitHub Actions** orqali avtomatik CI/CD pipeline-ni yo'lga qo'yishni bosqichma-bosqich tushuntiradi.

---

## 1-Qism. Lokal muhitni tayyorlash va Docker test

Loyihani AWS-ga yuklashdan oldin uni o'z kompyuteringizda Docker yordamida tekshirib olishingiz shart.

### 1. Dasturlarni o'rnatish
Agar hali o'rnatmagan bo'lsangiz, quyidagi rasmiy linklardan dasturlarni yuklab olib o'rnating:
*   [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows uchun WSL 2 yoqilgan bo'lishi kerak).
*   [AWS CLI v2](https://aws.amazon.com/cli/) (AWS resurslarini terminal orqali boshqarish uchun).
*   [Git](https://git-scm.com/) (Kodni GitHub-ga yuklash uchun).

### 2. Node.js kutubxonalarini lokal o'rnatish
PowerShell terminalini ochib loyiha papkasiga o'ting va quyidagi buyruqni bering (`npm` o'rniga `npm.cmd` ishlatiladi, chunki script execution xavfsizlik cheklovi bor):
```powershell
npm.cmd install
```
Bu buyruq eskirgan SQLite kutubxonalarini o'chirib, yangi PostgreSQL ulanishi uchun kerakli `pg` kutubxonasini o'rnatadi.

### 3. Docker Compose yordamida lokal test qilish
1. Kompyuteringizda **Docker Desktop** dasturini ishga tushiring.
2. Terminalda loyiha papkasida bo'la turib quyidagi buyruqni bering:
   ```powershell
   docker-compose up --build
   ```
3. Docker loyihangizni yig'adi, PostgreSQL bazasini yuklaydi, jadval (schema) va boshlang'ich ma'lumotlarni (`seed.js` orqali) avtomatik yozadi.
4. Brauzerda [http://localhost:3000](http://localhost:3000) manziliga kiring. Barcha dashboard grafiklari, Bento layout va ma'lumotlar to'liq ko'rinishi kerak.
5. Tekshirib bo'lgach, terminalda `Ctrl + C` tugmalarini bosing va konteynerlarni to'xtatish uchun yozing:
   ```powershell
   docker-compose down
   ```

---

## 2-Qism. AWS Console & CLI orqali Infratuzilman Sazlash

Infratuzilma London regionida (`eu-west-2`) quriladi. Terminalda AWS CLI-ni sozlash uchun:
```powershell
aws configure
```
Sizdan quyidagi ma'lumotlar so'raladi:
*   `AWS Access Key ID`: *AWS IAM foydalanuvchining ID kaliti*
*   `AWS Secret Access Key`: *AWS IAM foydalanuvchining maxfiy kaliti*
*   `Default region name`: `eu-west-2`
*   `Default output format`: `json`

---

### 1. AWS ECR (Konteynerlar ombori) yaratish
Loyiha Docker image faylini AWS-da saqlash uchun quyidagi buyruqni terminalda ishga tushiring:
```powershell
aws ecr create-repository `
  --repository-name ca-fashion-crm `
  --region eu-west-2 `
  --image-scanning-configuration scanOnPush=true `
  --encryption-configuration encryptionType=AES256
```

---

### 2. Tarmoq (VPC, Subnets va NAT Gateway) yaratish

Tizim xavfsiz va to'g'ri ishlashi uchun bizga 1 ta VPC, 2 ta Public Subnet (Load Balancer uchun), 2 ta Private Application Subnet (ECS uchun) va 2 ta Private Database Subnet (RDS uchun) kerak bo'ladi.

Buni oson qilish uchun quyidagi PowerShell buyruqlaridan foydalaning:

```powershell
# 1. VPC yaratish
$VPC_ID = aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=ca-fashion-vpc}]' --query 'Vpc.VpcId' --output text

# DNS-larni yoqish
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-support
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-hostnames

# 2. Internet Gateway yaratish va VPC ga ulash
$IGW_ID = aws ec2 create-internet-gateway --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=ca-fashion-igw}]' --query 'InternetGateway.InternetGatewayId' --output text
aws ec2 attach-internet-gateway --internet-gateway-id $IGW_ID --vpc-id $VPC_ID

# 3. Subnet-larni yaratish
# Public Subnets (ALB uchun)
$PUB_A = aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.1.0/24 --availability-zone eu-west-2a --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=ca-fashion-public-a}]' --query 'Subnet.SubnetId' --output text
$PUB_B = aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.2.0/24 --availability-zone eu-west-2b --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=ca-fashion-public-b}]' --query 'Subnet.SubnetId' --output text

# Private App Subnets (ECS vazifalari uchun)
$APP_A = aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.10.0/24 --availability-zone eu-west-2a --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=ca-fashion-app-a}]' --query 'Subnet.SubnetId' --output text
$APP_B = aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.20.0/24 --availability-zone eu-west-2b --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=ca-fashion-app-b}]' --query 'Subnet.SubnetId' --output text

# Private DB Subnets (RDS PostgreSQL uchun)
$DB_A = aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.11.0/24 --availability-zone eu-west-2a --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=ca-fashion-db-a}]' --query 'Subnet.SubnetId' --output text
$DB_B = aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.12.0/24 --availability-zone eu-west-2b --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=ca-fashion-db-b}]' --query 'Subnet.SubnetId' --output text

# Public IP berishni yoqish (Faqat Public subnetlar uchun)
aws ec2 modify-subnet-attribute --subnet-id $PUB_A --map-public-ip-on-launch
aws ec2 modify-subnet-attribute --subnet-id $PUB_B --map-public-ip-on-launch

# 4. Elastic IP va NAT Gateway yaratish (Private subnet-dagi ECS internetga chiqa olishi uchun)
$EIP_ID = aws ec2 allocate-address --domain vpc --query 'AllocationId' --output text
$NAT_ID = aws ec2 create-nat-gateway --subnet-id $PUB_A --allocation-id $EIP_ID --tag-specifications 'ResourceType=natgateway,Tags=[{Key=Name,Value=ca-fashion-nat}]' --query 'NatGateway.NatGatewayId' --output text

# NAT Gateway tayyor bo'lishini kutish (3-5 daqiqa oladi)
aws ec2 wait nat-gateway-available --nat-gateway-ids $NAT_ID

# 5. Route Table-larni yaratish va sozlash
# Public Route Table (Internet Gateway-ga yo'naltirilgan)
$PUB_RT = aws ec2 create-route-table --vpc-id $VPC_ID --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=ca-fashion-public-rt}]' --query 'RouteTable.RouteTableId' --output text
aws ec2 create-route --route-table-id $PUB_RT --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID
aws ec2 associate-route-table --route-table-id $PUB_RT --subnet-id $PUB_A
aws ec2 associate-route-table --route-table-id $PUB_RT --subnet-id $PUB_B

# Private Route Table (NAT Gateway-ga yo'naltirilgan)
$PRIV_RT = aws ec2 create-route-table --vpc-id $VPC_ID --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=ca-fashion-private-rt}]' --query 'RouteTable.RouteTableId' --output text
aws ec2 create-route --route-table-id $PRIV_RT --destination-cidr-block 0.0.0.0/0 --nat-gateway-id $NAT_ID
aws ec2 associate-route-table --route-table-id $PRIV_RT --subnet-id $APP_A
aws ec2 associate-route-table --route-table-id $PRIV_RT --subnet-id $APP_B
aws ec2 associate-route-table --route-table-id $PRIV_RT --subnet-id $DB_A
aws ec2 associate-route-table --route-table-id $PRIV_RT --subnet-id $DB_B
```

---

### 3. Security Groups (Xavfsizlik Guruhlari) yaratish

Trafik faqat belgilangan yo'llar bilan o'tishi kerak: **Internet -> ALB -> ECS -> RDS**.

```powershell
# 1. ALB uchun Security Group (Tashqi dunyodan HTTP va HTTPS qabul qiladi)
$SG_ALB = aws ec2 create-security-group --vpc-id $VPC_ID --group-name sg-alb --description "ALB - public HTTP/HTTPS" --query 'GroupId' --output text
aws ec2 authorize-security-group-ingress --group-id $SG_ALB --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SG_ALB --protocol tcp --port 443 --cidr 0.0.0.0/0

# 2. ECS uchun Security Group (Faqat ALBdan 3000-portga trafik qabul qiladi)
$SG_ECS = aws ec2 create-security-group --vpc-id $VPC_ID --group-name sg-ecs --description "ECS tasks - from ALB only" --query 'GroupId' --output text
aws ec2 authorize-security-group-ingress --group-id $SG_ECS --protocol tcp --port 3000 --source-group $SG_ALB

# 3. RDS PostgreSQL uchun Security Group (Faqat ECS-dan 5432-portga ulanish qabul qiladi)
$SG_RDS = aws ec2 create-security-group --vpc-id $VPC_ID --group-name sg-rds --description "RDS - from ECS only" --query 'GroupId' --output text
aws ec2 authorize-security-group-ingress --group-id $SG_RDS --protocol tcp --port 5432 --source-group $SG_ECS
```

---

### 4. RDS PostgreSQL Ma'lumotlar bazasini yaratish

1. Avval ma'lumotlar bazasi guruhini (Subnet group) yaratamiz:
   ```powershell
   aws rds create-db-subnet-group `
     --db-subnet-group-name ca-fashion-db-subnets `
     --db-subnet-group-description "Private subnets for CRM database" `
     --subnet-ids $DB_A $DB_B
   ```

2. Ma'lumotlar bazasini yaratish (Parol o'rniga kuchli parol yozing, masalan `MySuperSecurePass123!`):
   ```powershell
   aws rds create-db-instance `
     --db-instance-identifier ca-fashion-crm `
     --db-instance-class db.t3.micro `
     --engine postgres `
     --engine-version 16 `
     --master-username cafashion `
     --master-user-password 'KUCHLI_PAROL_SHU_YERGA' `
     --allocated-storage 20 `
     --storage-type gp3 `
     --db-name cafashion_crm `
     --vpc-security-group-ids $SG_RDS `
     --db-subnet-group-name ca-fashion-db-subnets `
     --backup-retention-period 7 `
     --storage-encrypted `
     --no-publicly-accessible
   ```
   *Eslatma: Baza yaratilishi uchun 5-10 daqiqa vaqt ketadi.*

3. Baza holatini tekshirish va uning Endpoint (ulanish manzili)ni olish:
   ```powershell
   aws rds wait db-instance-available --db-instance-identifier ca-fashion-crm
   
   $RDS_HOST = aws rds describe-db-instances --db-instance-identifier ca-fashion-crm --query 'DBInstances[0].Endpoint.Address' --output text
   Write-Host "Sizning RDS Hostingiz: $RDS_HOST"
   ```

---

### 5. Secrets Manager-ga ulanish parolini yozish
Xavfsizlik nuqtai nazaridan ma'lumotlar bazasi URL manzili kod ichida ochiq yozilmaydi, balki AWS Secrets Manager-da saqlanadi. 

Quyidagi buyruqda `<PAROL>` o'rniga RDS yaratishda yozgan parolingizni yozib, buyruqni ishga tushiring:
```powershell
aws secretsmanager create-secret `
  --name ca-fashion/database-url `
  --secret-string "postgresql://cafashion:PAROL_SHU_YERGA@${RDS_HOST}:5432/cafashion_crm"
```

---

### 6. CloudWatch Log Group yaratish
ECS loglarini saqlash uchun log-gruppani yarating:
```powershell
aws logs create-log-group --log-group-name /ecs/ca-fashion-crm --region eu-west-2
aws logs put-retention-policy --log-group-name /ecs/ca-fashion-crm --retention-in-days 30
```

---

### 7. ECS Cluster Yaratish
Fargate va Fargate Spot (arzonroq serverlar) bilan ishlaydigan klaster yaratamiz:
```powershell
aws ecs create-cluster --cluster-name ca-fashion-cluster `
  --capacity-providers FARGATE FARGATE_SPOT `
  --default-capacity-provider-strategy `
    capacityProvider=FARGATE,weight=1,base=1 `
    capacityProvider=FARGATE_SPOT,weight=3
```

---

### 8. Load Balancer (ALB) va Target Group Yaratish
Trafikni ECS-dagi konteynerlarga to'g'ri taqsimlash uchun Load Balancer sozlaymiz:

```powershell
# Target Group yaratish (Fargate uchun IP turida bo'lishi shart)
$TG_ARN = aws elbv2 create-target-group --name ca-fashion-tg --protocol HTTP --port 3000 --vpc-id $VPC_ID --target-type ip --health-check-path /api/health --health-check-interval-seconds 30 --healthy-threshold-count 2 --unhealthy-threshold-count 3 --query 'TargetGroups[0].TargetGroupArn' --output text

# ALB yaratish
$ALB_ARN = aws elbv2 create-load-balancer --name ca-fashion-alb --subnets $PUB_A $PUB_B --security-groups $SG_ALB --scheme internet-facing --type application --query 'LoadBalancers[0].LoadBalancerArn' --output text
```

> **HTTP vs HTTPS sozlamasi:**
> Agar hozircha shaxsiy domen va SSL sertifikat bo'lmasa, faqat oddiy HTTP (port 80) orqali ALB ni sozlang:
> ```powershell
> aws elbv2 create-listener --load-balancer-arn $ALB_ARN --protocol HTTP --port 80 --default-actions Type=forward,TargetGroupArn=$TG_ARN
> ```

---

### 9. ECS uchun IAM Rollarini yaratish
ECS konteynerlari AWS ECR-dan rasm yuklashi, log yozishi va Secrets Manager-dan ma'lumot o'qishi uchun maxsus ruxsatnomalar kerak.

1. **ECS Task Execution Role** yaratish:
   ```powershell
   # Role-ni yaratish
   aws iam create-role --role-name ecsTaskExecutionRole --assume-role-policy-document '{
       "Version": "2012-10-17",
       "Statement": [{
         "Effect": "Allow",
         "Principal": {"Service": "ecs-tasks.amazonaws.com"},
         "Action": "sts:AssumeRole"
       }]
     }'
   
   # Standart ECS ruxsatnomasini ulash
   aws iam attach-role-policy --role-name ecsTaskExecutionRole --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
   
   # Secrets Manager-dan o'qish ruxsatnomasini ulash
   aws iam put-role-policy --role-name ecsTaskExecutionRole --policy-name SecretsAccess --policy-document '{
       "Version": "2012-10-17",
       "Statement": [{
         "Effect": "Allow",
         "Action": ["secretsmanager:GetSecretValue"],
         "Resource": "arn:aws:secretsmanager:eu-west-2:*:secret:ca-fashion/*"
       }]
     }'
   ```

2. **ECS Task Role** (konteyner ichidagi dastur uchun) yaratish:
   ```powershell
   aws iam create-role --role-name ecsTaskRole --assume-role-policy-document '{
       "Version": "2012-10-17",
       "Statement": [{
         "Effect": "Allow",
         "Principal": {"Service": "ecs-tasks.amazonaws.com"},
         "Action": "sts:AssumeRole"
       }]
     }'
   ```

---

### 10. Task Definition-ni sozlash va ECS Service yaratish

1. Avval AWS account raqamingizni aniqlang:
   ```powershell
   aws sts get-caller-identity --query "Account" --output text
   ```
2. Loyiha papkangizdagi `infra/task-definition.json` faylini oching. Undagi barcha `ACCOUNT_ID` yozuvlarini yuqorida chiqqan 12 xonali AWS Account raqamingizga almashtiring va faylni saqlang.

3. Task-definition-ni AWS-da ro'yxatdan o'tkazing:
   ```powershell
   aws ecs register-task-definition --cli-input-json file://infra/task-definition.json
   ```

4. **ECS Service**ni ishga tushiring (Konteynerlarni tarmoqqa bog'lash va ALB-ga ulash):
   ```powershell
   aws ecs create-service `
     --cluster ca-fashion-cluster `
     --service-name ca-fashion-service `
     --task-definition ca-fashion-crm `
     --desired-count 2 `
     --launch-type FARGATE `
     --network-configuration "awsvpcConfiguration={subnets=[$APP_A,$APP_B],securityGroups=[$SG_ECS],assignPublicIp=DISABLED}" `
     --load-balancers "targetGroupArn=$TG_ARN,containerName=ca-fashion-app,containerPort=3000" `
     --deployment-configuration "maximumPercent=200,minimumHealthyPercent=100" `
     --enable-execute-command
   ```

---

### 11. Auto Scaling-ni sozlash
Trafik oshganda serverlar soni avtomatik ko'payib, kamayganda qisqarishi uchun Auto Scaling-ni ulaymiz (1 tadan 4 tagacha konteyner):

```powershell
# Scalable Target-ni ro'yxatdan o'tkazish
aws application-autoscaling register-scalable-target `
  --service-namespace ecs `
  --resource-id service/ca-fashion-cluster/ca-fashion-service `
  --scalable-dimension ecs:service:DesiredCount `
  --min-capacity 1 `
  --max-capacity 4

# CPU utilzatsiyasi 70% dan oshsa avtomatik ko'payadigan qilish
aws application-autoscaling put-scaling-policy `
  --service-namespace ecs `
  --resource-id service/ca-fashion-cluster/ca-fashion-service `
  --scalable-dimension ecs:service:DesiredCount `
  --policy-name ca-fashion-cpu-scaling `
  --policy-type TargetTrackingScaling `
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleOutCooldown": 60,
    "ScaleInCooldown": 300
  }'
```

---

## 3-Qism. GitHub Secrets & CI/CD Pipeline

Endi biz loyihaning har safar `main` branchiga push bo'lganda avtomatik sinovdan o'tib, ECR-ga rasm yozib, ECS-ga deploy bo'lishini (CI/CD) sozlaymiz.

### 1. GitHub Repository yaratish
1. [GitHub sayti](https://github.com/)ga kiring.
2. Yangi repozitoriya yarating (masalan, `ca-fashion-crm`).

### 2. GitHub Secrets sozlash
GitHub-dagi repozitoriyangiz sahifasiga kirib, quyidagi yo'l bilan Secrets bo'limiga o'ting:
**Settings** (sozlamalar tishi) -> **Secrets and variables** (chap menyuda) -> **Actions**.

O'ng tarafdagi **"New repository secret"** tugmasini bosib, quyidagi 5 ta secret-ni birma-bir kiriting:

| Secret Nomi | Qiymati (Nimani kiritasiz) |
| :--- | :--- |
| `AWS_ACCESS_KEY_ID` | Sizning AWS IAM Access Key ID-ingiz |
| `AWS_SECRET_ACCESS_KEY` | Sizning AWS IAM Secret Access Key-ingiz |
| `AWS_REGION` | `eu-west-2` |
| `AWS_ACCOUNT_ID` | 12 xonali AWS Account raqamingiz |
| `DATABASE_URL` | RDS PostgreSQL ulanish stringi. Masalan: `postgresql://cafashion:PAROL@RDS_HOST:5432/cafashion_crm` |

---

## 4-Qism. Kodni push qilish va Deploy qilish

Hamma narsa tayyor. Endi lokal kodimizni GitHub-ga yuklaymiz, shunda GitHub Actions avtomatik ravishda birinchi deploy-ni amalga oshiradi.

1. Loyiha papkasida terminalni oching va quyidagi buyruqlarni ketma-ket bering:
   ```powershell
   git init
   git add .
   git commit -m "Initial commit with AWS ECS Fargate & GitHub Actions Setup"
   git branch -M main
   
   # GitHub repozitoriyangiz linkini qo'shing (o'zingiznikiga o'zgartiring):
   git remote add origin https://github.com/FOYDALANUVCHI_NOMI/ca-fashion-crm.git
   
   # Kodni push qiling:
   git push -u origin main
   ```

2. GitHub-da repozitoriyangiz sahifasiga o'ting va **Actions** tabini bosing. Siz u yerda avtomatik ravishda pipeline ishga tushganini ko'rasiz.

---

## 5-Qism. Tekshirish va Baza to'ldirish (Seeding)

Deploy tugagach, Load Balancer-ning tashqi manzilini aniqlang:
```powershell
aws elbv2 describe-load-balancers --names ca-fashion-alb --query 'LoadBalancers[0].DNSName' --output text
```
Sizga Load Balancer DNS manzili (masalan, `ca-fashion-alb-123456789.eu-west-2.elb.amazonaws.com`) beriladi. Ushbu manzilni brauzerga kiritsangiz bo'ladi.

### ECS-ga ma'lumotlarni yozish (Seeding)
Ma'lumotlar bazasini birinchi marta boshlang'ich ma'lumotlar bilan to'ldirish uchun:

1. Avval ishlayotgan ECS task ID-sini topamiz:
   ```powershell
   aws ecs list-tasks --cluster ca-fashion-cluster --service-name ca-fashion-service --query "taskArns[0]" --output text
   ```
   *(Bu sizga `arn:aws:ecs:eu-west-2:ACCOUNT_ID:task/ca-fashion-cluster/abc123xyz...` shaklida javob qaytaradi. Oxiridagi `abc123xyz...` qismi bu **TASK_ID** bo'ladi).*

2. Konteyner ichida seed buyrug'ini bajaramiz:
   ```powershell
   aws ecs execute-command --cluster ca-fashion-cluster --task TASK_ID --container ca-fashion-app --interactive --command "node lib/seed.js"
   ```
   *(Eslatma: Ushbu buyruq ishlashi uchun kompyuteringizda AWS CLI uchun `session-manager-plugin` o'rnatilgan bo'lishi kerak. Muqobil ravishda, deploy-dan oldin yoki pipeline ichida ham bazani seed qilish mumkin).*
