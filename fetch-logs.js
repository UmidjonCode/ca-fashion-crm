const { execSync } = require('child_process');
try {
  // 1. Get latest log stream name
  const streamsJson = execSync('aws logs describe-log-streams --log-group-name /ecs/ca-fashion-crm --order-by LastEventTime --descending --limit 1 --output json', {
    encoding: 'utf-8',
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
  });
  const streams = JSON.parse(streamsJson);
  if (!streams.logStreams || streams.logStreams.length === 0) {
    console.log("No log streams found");
    process.exit(0);
  }
  const latestStream = streams.logStreams[0].logStreamName;
  console.log(`Latest Stream Name: ${latestStream}`);

  // 2. Fetch logs
  const result = execSync(`aws logs get-log-events --log-group-name /ecs/ca-fashion-crm --log-stream-name "${latestStream}" --output json`, {
    encoding: 'utf-8',
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
  });
  // Clean special characters like triangles that crash windows cmd charmap
  const sanitized = result.replace(/[\u25b2\u25bc]/g, '^');
  const events = JSON.parse(sanitized);
  events.events.forEach(e => console.log(e.message));
} catch (e) {
  console.error("Error fetching logs:", e.message);
}
