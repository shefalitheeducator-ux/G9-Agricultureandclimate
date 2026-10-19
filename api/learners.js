// GET /api/learners — every learner's progress, for the teacher page.
// DELETE /api/learners?id=... — removes one learner (e.g. a test entry).
// Both need the x-teacher-password header to match the TEACHER_PASSWORD setting.
const crypto = require('crypto');
const { configured, pipeline } = require('./_redis');

function samePassword(given, expected) {
  const a = crypto.createHash('sha256').update(given).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const expected = process.env.TEACHER_PASSWORD;
  if (!expected) return res.status(503).json({ error: 'TEACHER_PASSWORD is not set in Vercel yet' });
  if (!configured()) return res.status(503).json({ error: 'Storage is not set up yet' });
  if (!samePassword(String(req.headers['x-teacher-password'] || ''), expected)) {
    return res.status(401).json({ error: 'Wrong password' });
  }

  try {
    if (req.method === 'GET') {
      const [ids] = await pipeline([['SMEMBERS', 'learners']]);
      if (!ids.length) return res.status(200).json({ learners: [] });
      const [rows] = await pipeline([['MGET', ...ids.map(id => 'learner:' + id)]]);
      const learners = rows.filter(Boolean).map(r => JSON.parse(r));
      return res.status(200).json({ learners });
    }
    if (req.method === 'DELETE') {
      const id = String(req.query.id || '');
      if (!/^[a-z0-9]{12,40}$/.test(id)) return res.status(400).json({ error: 'Bad id' });
      await pipeline([['DEL', 'learner:' + id], ['SREM', 'learners', id]]);
      return res.status(204).end();
    }
  } catch (e) {
    console.error(e);
    return res.status(502).json({ error: 'Could not reach storage' });
  }
  res.setHeader('Allow', 'GET, DELETE');
  res.status(405).json({ error: 'Use GET or DELETE' });
};
