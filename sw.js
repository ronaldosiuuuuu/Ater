/* 에테르 서비스 워커: 홈 화면 앱으로 깔고, 인터넷이 없어도 돌게 한다.
   - 앱 파일: 저장해 둔 것을 바로 쓰고, 뒤에서 새 것을 받아 둔다. 판(V)이 올라가면 화면이 알아서 새 판으로 다시 열린다.
   - 글꼴(구글): 한 번 받은 것은 저장해 두고 계속 쓴다.
   파일을 더하거나 빼면 FILES를 고치고 V의 숫자를 올린다. */
const V='aether-1.9.6';
const FILES=['./','boot.js','engine.js','start.js','bench.js','build.js','kits.js','wkits1.js','wkits2.js','pkits.js','foes.js','docboss.js','game/hoisted.js','game/core.js','game/meta.js','game/v1.0-1.2.js','game/v1.3-1.5.js','game/v1.6-1.7.0.js','game/v1.7.1-1.8.3.js','game/v1.8.4.js','game/v1.8.5.js','game/v1.8.6.js','game/v1.8.7.js','game/v1.8.10.js','game/v1.8.11.js','game/v1.8.12.js','game/v1.8.13.js','game/v1.8.14.js','game/v1.9.5.js','story2.js','raid.js','lore.js','forge.js','guide.js','net.js','peerjs.min.js','extra.js','igril.js','cardtext6.js','brain.js','brain2.js','brain3.js','cardtext.js','cardtext2.js','cardtext3.js','cardtext4.js','cardtext5.js','chars.js','feel.js','text.js','flair.js','fxs.js','icons/apple-180.png','icons/icon-192.png','icons/icon-512.png','icons/maskable-512.png','index.html','relay.json','배포.md','jeon1.js','jeon2.js','jeon3.js','look.js','manifest.json','maps.js','rebirth.js','seosa1.js','seosa2.js','seosa3.js','sinhwa.js','team.js'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(V).then(c=>c.addAll(FILES.map(f=>new Request(f,{cache:'reload'})))).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V&&k!=='aether-fonts').map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
const timeout=(p,ms)=>new Promise((ok,no)=>{ const t=setTimeout(()=>no(new Error('timeout')),ms); p.then(r=>{ clearTimeout(t); ok(r); },x=>{ clearTimeout(t); no(x); }); });
self.addEventListener('fetch',e=>{ const q=e.request; if(q.method!=='GET') return; const u=new URL(q.url);
  if(u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com'){ e.respondWith(caches.open('aether-fonts').then(c=>c.match(q).then(hit=>hit||fetch(q).then(r=>{ if(r.ok||r.type==='opaque') c.put(q,r.clone()); return r; })))); return; }
  if(u.origin!==location.origin) return;
  /* 앱 파일: 저장해 둔 것을 바로 내주고(느린 망에서도 곧장 뜬다), 뒤에서 새 것을 받아 바꿔 둔다 → 다음에 열 때 새 것.
     판(V)이 올라가면 새 워커가 통째로 다시 받아 깔리고, 화면이 알아서 다시 열린다. 저장해 둔 것이 없을 때만 망을 기다린다 */
  /* 저장은 주소 뒤의 ?… 를 떼고 한 칸에만 한다(방 코드마다 쌓이지 않게). 같은 곳에서 온 온전한 응답만 저장한다 */
  const key=u.search?new Request(u.origin+u.pathname):q;
  e.respondWith(caches.open(V).then(c=>c.match(q,{ignoreSearch:true}).then(hit=>{ const net=fetch(q,{cache:'no-cache'}).then(r=>{ if(r.ok&&r.type==='basic') c.put(key,r.clone()); return r; }); if(hit){ net.catch(()=>{}); return hit; } return timeout(net,8000).catch(()=>c.match('./index.html')); }))); });
