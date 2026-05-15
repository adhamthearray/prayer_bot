export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = request.headers.authorization || '';
  const expectedHeader = `Bearer ${process.env.RELAY_TOKEN}`;

  if (!process.env.RELAY_TOKEN || authHeader !== expectedHeader) {
    return response.status(401).json({ error: 'Unauthorized' });
  }

  const topic = request.body?.topic || process.env.NTFY_TOPIC;
  const title = request.body?.title || 'Prayer Reminder';
  const message = request.body?.message;

  if (!topic || !message) {
    return response.status(400).json({ error: 'Missing topic or message' });
  }

  const ntfyResponse = await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
    method: 'POST',
    body: message,
    headers: {
      Title: title,
      Priority: 'default',
      Tags: 'pray',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });

  const ntfyBody = await ntfyResponse.text();

  return response.status(ntfyResponse.ok ? 200 : 502).json({
    ok: ntfyResponse.ok,
    status: ntfyResponse.status,
    body: ntfyBody,
  });
}
