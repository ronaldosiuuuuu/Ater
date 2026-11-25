/* 에테르 중계 서버(TURN) 접속 정보 발급기 · Cloudflare Workers
   - 게임 화면은 이 주소에 묻기만 한다. Cloudflare TURN 열쇠는 여기(Worker 비밀값)에만 있고 화면 쪽에 드러나지 않는다.
   - 내주는 접속 정보는 TTL(기본 6시간) 뒤 저절로 못 쓰게 된다. 새어 나가도 오래 쓰이지 못한다.
   - ALLOW에 적은 주소(게임 사이트)에서 온 요청만 받는다.
   비밀값(대시보드 Settings → Variables 또는 `wrangler secret put`):
     TURN_KEY_ID        Cloudflare Realtime → TURN Server → 열쇠의 ID
     TURN_KEY_API_TOKEN 같은 곳의 API Token */
const ALLOW = ['https://ronaldosiuuuuu.github.io', 'http://localhost:8000', 'http://127.0.0.1:8000'];
const TTL = 6 * 3600;

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const ok = ALLOW.includes(origin);
    const cors = {
      'Access-Control-Allow-Origin': ok ? origin : ALLOW[0],
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Vary': 'Origin',
    };
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (!ok) return new Response('forbidden', { status: 403, headers: cors });
    if (!env.TURN_KEY_ID || !env.TURN_KEY_API_TOKEN) return new Response('not configured', { status: 500, headers: cors });

    const r = await fetch(
      'https://rtc.live.cloudflare.com/v1/turn/keys/' + env.TURN_KEY_ID + '/credentials/generate-ice-servers',
      {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + env.TURN_KEY_API_TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ttl: TTL }),
      },
    );
    if (!r.ok) return new Response('upstream ' + r.status, { status: 502, headers: cors });
    const body = await r.text(); /* { "iceServers": [ … ] } 그대로 넘긴다 */
    return new Response(body, {
      headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  },
};
