const { CloudWatchLogsClient, GetLogEventsCommand } = require("@aws-sdk/client-cloudwatch-logs");

async function fetchLogs() {
  const client = new CloudWatchLogsClient({ region: "us-east-1" });
  const command = new GetLogEventsCommand({
    logGroupName: "/ecs/ca-fashion-crm",
    logStreamName: "ecs/ca-fashion-app/88b6986b4c294d25a935f6bec1d727fc", // Replace with latest task ID if needed
    startFromHead: true
  });
  try {
    const response = await client.send(command);
    response.events.forEach(event => console.log(event.message));
  } catch (error) {
    console.error("Error fetching logs:", error.message);
  }
}
fetchLogs();
