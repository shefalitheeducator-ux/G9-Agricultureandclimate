// POST /api/save — the student app sends a learner's progress here.
const { configured, pipeline } = require('./_redis');

const MAX_BYTES = 300000;
const ID = /^[a-z0-9]{12,40}$/;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST' });
  }
  if (!configured()) return res.status(503).json({ error: 'Storage is not set up yet' });

  let body = req.body;
  if (typeof body === 'string') {
    if (body.length > MAX_BYTES) return res.status(413).json({ error: 'Too large' });
    try { body = JSON.parse(body); } catch (e) { return res.status(400).json({ error: 'Bad JSON' }); }
  }
  const id = body && String(body.id || '');
  const state = body && body.state;
  if (!ID.test(id) || !state || typeof state !== 'object' || state.v !== 1) {
    return res.status(400).json({ error: 'Bad progress data' });
  }

  const record = JSON.stringify({
    id,
    name: String(state.name || '').trim().slice(0, 40),
    cls: String(state.cls || '').trim().slice(0, 20),
    updated: new Date().toISOString(),
    state,
  });
  if (record.length > MAX_BYTES) return res.status(413).json({ error: 'Too large' });

  try {
    await pipeline([['SET', 'learner:' + id, record], ['SADD', 'learners', id]]);
  } catch (e) {
    console.error(e);
    return res.status(502).json({ error: 'Could not save' });
  }
  res.status(204).end();
};
