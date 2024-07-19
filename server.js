const express = require('express');
const cors = require('cors');
require('dotenv').config()

const token = process.env.GQL_ACCESS_TOKEN;

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

async function getFflogsEventsGql(report, fight, source, start, end) {
	const url = 'https://www.fflogs.com/api/v2/user';
	const body = `
	query q {
		reportData {
			report(code: "${report}") {
				events(fightIDs: [${fight}], sourceID: ${source}) {
					data
					nextPageTimestamp
				}
			}
		}
	}
	`
	const res = await fetch(url, {
		method: "POST",
		body: JSON.stringify({
			query: body
		}),
		headers: {
			"Content-type": "application/json",
			'Authorization': `Bearer ${token}`,
		}
	})
	
	const body2 = `
	query q {
		reportData {
			report(code: "${report}") {
				events(fightIDs: [${fight}], filterExpression: "type=\\"targetabilityupdate\\"") {
					data
					nextPageTimestamp
				}
			}
		}
	}
	`
	const res2 = await fetch(url, {
		method: "POST",
		body: JSON.stringify({
			query: body2
		}),
		headers: {
			"Content-type": "application/json",
			'Authorization': `Bearer ${token}`,
		}
	})

	const data = await res.json();
	const data2 = await res2.json();

	return [...data.data.reportData.report.events.data, ...data2.data.reportData.report.events.data]
}

// Define an API route
app.post('/fflogs-events', async (req, res) => {
  const { code, fightId, actorId, startTime, endTime } = req.body;
  try {
    const events = await getFflogsEventsGql(code, fightId, actorId, startTime, endTime);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get events' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Backend server is running at http://localhost:${port}`);
});
