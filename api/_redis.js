// Tiny Upstash Redis REST client, so the functions need no npm packages.
// Vercel's Upstash integration sets KV_REST_API_URL / KV_REST_API_TOKEN;
// a database connected straight from Upstash sets the UPSTASH_REDIS_REST_* names.
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

function configured() {
  return Boolean(URL_ && TOKEN);
}

// Runs several commands in one request and returns their results in order.
async function pipeline(commands) {
  const r = await fetch(URL_.replace(/\/$/, '') + '/pipeline', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  });
  if (!r.ok) throw new Error('Redis responded ' + r.status);
  const out = await r.json();
  return out.map(x => {
    if (x.error) throw new Error(x.error);
    return x.result;
  });
}

module.exports = { configured, pipeline };
