const { execSync } = require('child_process');
try {
  const result = execSync('aws logs get-log-events --log-group-name /ecs/ca-fashion-crm --log-stream-name ecs/ca-fashion-app/649c42d1303d4881bb1c79bc5128aa16 --output json', { encoding: 'utf-8' });
  console.log(result.replace(/\u25b2/g, '^'));
} catch (e) {
  console.error("Error fetching logs", e.message);
}
