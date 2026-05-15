export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    const authHeader = request.headers.get('Authorization') || '';
    const expectedHeader = `Bearer ${env.RELAY_TOKEN}`;

    if (!env.RELAY_TOKEN || authHeader !== expectedHeader) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    let payload;

    try {
      payload = await request.json();
    } catch (error) {
      return jsonResponse({ error: 'Invalid JSON' }, 400);
    }

    const topic = payload.topic || env.NTFY_TOPIC;
    const title = payload.title || 'Prayer Reminder';
    const message = payload.message;

    if (!topic || !message) {
      return jsonResponse({ error: 'Missing topic or message' }, 400);
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

    return jsonResponse(
      {
        ok: ntfyResponse.ok,
        status: ntfyResponse.status,
        body: ntfyBody,
      },
      ntfyResponse.ok ? 200 : 502
    );
  },
};

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}
