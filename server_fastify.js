const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
require('dotenv').config();

const token = process.env.GQL_ACCESS_TOKEN;
const port = 3001;

// Register CORS
fastify.register(cors, { 
  // put your options here
});

fastify.register(require('@fastify/formbody'));

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
  `;
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify({
      query: body
    }),
    headers: {
      "Content-type": "application/json",
      'Authorization': `Bearer ${token}`,
    }
  });
  
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
  `;
  const res2 = await fetch(url, {
    method: "POST",
    body: JSON.stringify({
      query: body2
    }),
    headers: {
      "Content-type": "application/json",
      'Authorization': `Bearer ${token}`,
    }
  });

  const data = await res.json();
  const data2 = await res2.json();

  return [...data.data.reportData.report.events.data, ...data2.data.reportData.report.events.data];
}

// Define an API route
fastify.get('/', async (request, reply) => {
  reply.send('Hello, world!');
});

fastify.post('/fflogs-events', async (request, reply) => {
  const { code, fightId, actorId, startTime, endTime } = request.body;
  try {
    const events = await getFflogsEventsGql(code, fightId, actorId, startTime, endTime);
    reply.send(events);
  } catch (error) {
    reply.status(500).send({ error: 'Failed to get events' });
  }
});

// Start the server
fastify.listen({ port }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`Backend server is running at ${address}`);
});
