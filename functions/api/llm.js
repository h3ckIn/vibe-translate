// Cloudflare Pages Functions - LLM 代理
// 解决前端直接调用 LLM API 的 CORS 跨域问题
export async function onRequestPost({ request }) {
  try {
    const body = await request.json();
    const { url, key, payload } = body;

    if (!url || !key) {
      return new Response(
        JSON.stringify({ error: 'Missing url or key' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.text();
    return new Response(data, {
      status: res.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || 'Proxy error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
