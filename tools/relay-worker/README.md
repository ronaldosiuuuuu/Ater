# 중계 서버 열쇠를 숨기는 방법 (Cloudflare)

지금 `relay.json`에는 Metered API Key가 그대로 있다. 저장소가 공개라서 누구나 그 열쇠로 무료 몫을 쓸 수 있다.
이 폴더의 Worker를 한 번 올려 두면, 게임은 Worker 주소에만 묻고 열쇠는 Cloudflare 안에만 남는다. 받은 접속 정보는 6시간 뒤 저절로 못 쓰게 된다.

## 한 번만 하면 되는 것

1. Cloudflare에 가입한다(무료).
2. 대시보드 → **Realtime** → **TURN Server** → **Create** 로 TURN 열쇠를 만든다. 나오는 **Turn Token ID** 와 **API Token** 을 적어 둔다.
3. 대시보드 → **Workers & Pages** → **Create** → **Worker** 를 만들고, 편집 화면에 `worker.js` 내용을 붙여 넣고 **Deploy**.
   (명령줄을 쓴다면 이 폴더에서 `npx wrangler deploy`)
4. Worker → **Settings → Variables and Secrets** 에 비밀값 둘을 넣는다.
   - `TURN_KEY_ID` = 2번의 Turn Token ID
   - `TURN_KEY_API_TOKEN` = 2번의 API Token
5. Worker 주소(예: `https://ater-turn.아이디.workers.dev`)를 저장소의 `relay.json`에 적는다.

```json
{"url":"https://ater-turn.아이디.workers.dev"}
```

6. 다 되면 Metered 대시보드에서 예전 credential을 지운다(공개됐던 열쇠를 끊는다).

## 확인

- 게임의 **함께** 탭에 "이 사이트에 중계 서버가 마련돼 있다"가 뜨면 된 것이다.
- 다른 주소(예: 직접 만든 시험 사이트)에서도 쓰려면 `worker.js` 맨 위 `ALLOW`에 그 주소를 더한다.
- 무료 몫과 값은 Cloudflare Realtime 요금 안내에서 확인한다.
