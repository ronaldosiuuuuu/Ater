# 에테르(Ater) 작업 안내

빌드 없는 순수 JavaScript + Canvas 2D 게임. `index.html`이 스크립트를 차례로 읽는다(클래식 스크립트, 모두 전역을 나눠 쓴다). 순서가 곧 동작이다.

## 파일 구조

- `index.html`: 화면 뼈대와 스타일, 스크립트 읽는 순서
- `engine.js`: 엔진(경기장 · 캐릭터 · 스킬 · 판 진행 · 고르는 화면). 1.8.3까지 `index.html` 안에 있던 것
- `cardtext*.js`, `chars.js`, `seosa*.js`, `jeon*.js`, `sinhwa.js`, `rebirth.js`: 카드 원문과 캐릭터
- `brain*.js`: 컴퓨터 조작, `kits.js` · `wkits*.js` · `pkits.js` · `build.js`: 스킬 꾸러미
- `net.js`: 함께 하기(PeerJS · 방장 기기에서 판이 돈다)
- `game/`: 게임다운 겉옷(등반 · 뽑기 · 임무 · 업적 · 태그매치 …). 판(버전)마다 앞의 함수를 감싸 고치는 덩어리로 쌓여 있다.
  - `hoisted.js`: 앞 파일이 뒤 파일의 함수를 부르는 경우 그 함수만 모아 먼저 읽는다
  - `core.js` → `meta.js` → `v1.0-1.2.js` → `v1.3-1.5.js` → `v1.6-1.7.0.js` → `v1.7.1-1.8.3.js` → `v1.8.4.js`
- `sw.js`: 서비스 워커(오프라인 · 새 판 받기)
- `tools/smoke.py`: 자동 점검

## 새 판을 낼 때

1. 고친 내용은 새 덩어리 파일 `game/vX.Y.Z.js`에 쓰거나 해당 파일에서 고친다. 새 파일은 `index.html`의 `game/` 스크립트 줄 맨 뒤에 넣는다.
2. 새 파일에서 정의한 함수를 앞 파일이 읽는 즉시(파일을 읽는 동안) 부르면 안 된다. 그래야 하면 그 함수를 `game/hoisted.js`로 옮긴다.
3. 판 번호: `game/core.js`의 `VER`, `net.js`의 `APPV`(함께 하기에서 같은 판인지 보는 숫자), `game/v1.0-1.2.js`의 `PATCH` 맨 위, `CHANGELOG.md`, `README.md` 배지, `sw.js`의 `V`.
4. 파일을 더하거나 빼면 `sw.js`의 `FILES`도 고친다.
5. 점검: `python tools/smoke.py`. 동작을 바꾸지 않는 정리라면 `--chars 133`의 지문이 그대로여야 한다.

## 말투

화면 글과 주석은 지금처럼 쉬운 우리말 평서체(…한다)로 쓴다.
