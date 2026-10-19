// Tiny Upstash Redis REST client, so the functions need no npm packages.
// Vercel's Upstash integration sets <PREFIX>_REST_API_URL / <PREFIX>_REST_API_TOKEN (KV_ by default,
// or whatever custom prefix was chosen); a database connected straight from Upstash sets UPSTASH_REDIS_REST_*.
const env = process.env;
const prefix = ['KV'].concat(Object.keys(env).filter(k => /_REST_API_URL$/.test(k)).map(k => k.slice(0, -'_REST_API_URL'.length)))
  .find(p => env[p + '_REST_API_URL'] && env[p + '_REST_API_TOKEN']);
const URL_ = prefix ? env[prefix + '_REST_API_URL'] : env.UPSTASH_REDIS_REST_URL;
const TOKEN = prefix ? env[prefix + '_REST_API_TOKEN'] : env.UPSTASH_REDIS_REST_TOKEN;

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
