"use strict";
/* 친구와 함께 — 방 만들기(P2P).
   · 방장 기기가 싸움을 돌린다(엔진 그대로). 들어온 사람은 조작만 보내고, 방장이 1초에 15번 보내는 화면 상태를 받아 그린다.
   · 연결: PeerJS(peerjs.min.js, WebRTC). 방 코드가 곧 방장의 주소다. 주소 뒤에 ?bc 를 붙여 열면 같은 브라우저의 탭끼리 붙는다(시험용, 인터넷 없이).
   · 엔진 쪽 자리: index.html의 NET.afterSpawn(사람이 모는 캐릭터 꽂기) · NET.start · NET.cast · NET.frame · step의 e.net 입력.
   주고받는 말 — 들어온 쪽→방장: hello · pick · in(이동·기본기 누름·조준) · cast · bye / 방장→들어온 쪽: lobby · start · s(화면 상태) · bye */
Object.assign(NET,{ bc:/[?&]bc\b/.test(location.search), code:'', pid:'', tx:null, players:[], em:new Map(), you:0, flip:false, playing:false, live:false, acc:0, n:0, lastIn:0, lastC:{}, ev:{h:[],k:[],c:[]}, orig:null, HZ:12 });
const r2=v=>Math.round(v*100)/100, tf=t=>NET.flip?1-t:t;
const isEnt=v=>!!(v&&typeof v==='object'&&v.c&&v.st&&v.id);
/* 보낼 수 있는 꼴로: 숫자·글자·참거짓만 남기고, 캐릭터를 가리키는 칸은 '@이름': 번호로 바꾼다 */
function plain(o){ const r={}; for(const k in o){ const v=o[k],t=typeof v; if(t==='number'){ if(isFinite(v)) r[k]=r2(v); } else if(t==='string'||t==='boolean') r[k]=v; else if(isEnt(v)) r['@'+k]=v.id; } return r; }
function unplain(o){ for(const k in o) if(k[0]==='@'){ o[k.slice(1)]=NET.em.get(o[k])||null; delete o[k]; } if(o.team!==undefined) o.team=tf(o.team); return o; }
function ser(v,d){ if(v===null||v===undefined) return undefined; const t=typeof v; if(t==='number') return isFinite(v)?r2(v):undefined; if(t==='string'||t==='boolean') return v; if(t!=='object'||d>2||v instanceof Map||v instanceof Set||isEnt(v)||v.owner) return undefined;
  if(Array.isArray(v)) return v.length>12?undefined:v.map(x=>{ const y=ser(x,d+1); return y===undefined?null:y; }); const o={}; let n=0; for(const k in v){ if(++n>28) break; const y=ser(v[k],d+1); if(y!==undefined) o[k]=y; } return o; }
const loadPeer=()=>new Promise((ok,no)=>{ if(window.Peer) return ok(); const s=document.createElement('script'); s.src='peerjs.min.js'; s.onload=()=>window.Peer?ok():no(new Error('PeerJS')); s.onerror=()=>no(new Error('peerjs.min.js를 못 읽음')); document.head.appendChild(s); });
const ROOM=c=>'aether-room-'+c;
/* 서로 같은 판이어야 화면이 맞는다. 파일을 고쳐 내보낼 때 sw.js의 V와 함께 올린다 */
const APPV=27;
/* Metered(무료 몫이 있는 중계 서비스)의 주소 묶음. 아이디·비밀번호만 적으면 이 주소가 들어간다 */
const METERED='turn:standard.relay.metered.ca:80, turn:standard.relay.metered.ca:80?transport=tcp, turn:standard.relay.metered.ca:443, turns:standard.relay.metered.ca:443?transport=tcp';
/* 길 찾기(STUN)는 여러 곳에 묻는다. 통신사 데이터끼리처럼 직접 길이 안 뚫리는 경우에는 중계 서버(TURN)가 있어야 하고, '함께' 화면에서 적어 넣을 수 있다 */
/* 중계 서버를 아이디·비밀번호 없이 쓰기: Metered의 '앱 이름'과 'API Key'만 있으면, 이을 때마다 그쪽에서 접속 정보를 받아 온다.
   API Key는 화면 쪽에 두어도 되는 열쇠다(접속 정보만 받아 올 수 있고, 계정은 건드리지 못한다. 대시보드에서 언제든 지우면 끝난다).
   둘을 두는 곳: 이 기기(함께 화면에서 적는다) → 초대 링크(#r=) → 사이트의 relay.json(있으면 모두에게 기본값) */
const relayGet=()=>{ try{ const r=JSON.parse(localStorage.getItem('aetherRelay')||'null'); if(r&&r.app&&r.key) return r; }catch(x){} return NET.siteRelay||null; };
function relayIce(){ const r=relayGet(); if(!r){ NET.ice=null; return Promise.resolve(); } if(NET.ice&&NET.iceFor===r.app+r.key&&performance.now()-NET.iceAt<6e5) return Promise.resolve();
  const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),6000); return fetch('https://'+encodeURIComponent(r.app)+'.metered.live/api/v1/turn/credentials?apiKey='+encodeURIComponent(r.key),{signal:ctl.signal}).then(q=>q.ok?q.json():Promise.reject(new Error(q.status))).then(L=>{ if(Array.isArray(L)&&L.length){ NET.ice=L; NET.iceFor=r.app+r.key; NET.iceAt=performance.now(); } }).catch(x=>{ NET.ice=null; netStat('중계 서버 정보를 받지 못했다 ('+(x&&x.message||'')+') · 직접 연결로 해 본다'); }).finally(()=>clearTimeout(to)); }
function ICE(){ if(NET.ice) return {config:{iceServers:NET.ice.concat([{urls:'stun:stun.l.google.com:19302'}])},debug:0}; const L=[{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302','stun:stun2.l.google.com:19302']},{urls:'stun:stun.cloudflare.com:3478'}]; try{ const t=JSON.parse(localStorage.getItem('aetherTurn')||'null'); if(t&&t.url) L.push({urls:t.url.split(/[\s,]+/).filter(Boolean),username:t.user||'',credential:t.pass||''}); }catch(x){} return {config:{iceServers:L},debug:0}; }
/* 이어진 길이 직접인지 중계인지 */
function linkKind(c,cb){ try{ c.peerConnection.getStats().then(st=>{ let pair=null; st.forEach(r=>{ if(r.type==='transport'&&r.selectedCandidatePairId) pair=st.get(r.selectedCandidatePairId); }); if(!pair) st.forEach(r=>{ if(r.type==='candidate-pair'&&r.state==='succeeded'&&(r.nominated||r.selected)) pair=pair||r; }); const loc=pair&&st.get(pair.localCandidateId); cb(loc?(loc.candidateType==='relay'?'중계':'직접'):''); }).catch(()=>cb('')); }catch(x){ cb(''); } }

/* ───────── 방장 ───────── */
function hostOpen(code){ return new Promise((ok,no)=>{
  if(NET.bc){ const ch=new BroadcastChannel(ROOM(code)); ch.onmessage=ev=>{ const m=ev.data; if(m&&m.to==='host') hostMsg(m.from,m.d); }; NET.tx={send:(pid,d)=>ch.postMessage({to:pid,d}),close:()=>ch.close()}; return ok(); }
  Promise.all([loadPeer(),relayIce()]).then(()=>{ const peer=new Peer(ROOM(code),ICE()),conns=new Map(); let done=false;
    peer.on('open',()=>{ done=true; NET.tx={send:(pid,d)=>{ const c=conns.get(pid); if(c&&c.open){ try{ c.send(d); }catch(x){} } },close:()=>{ try{ peer.destroy(); }catch(x){} }}; ok(); });
    peer.on('connection',c=>{ c.on('open',()=>conns.set(c.peer,c)); c.on('data',d=>hostMsg(c.peer,d)); c.on('close',()=>{ conns.delete(c.peer); hostGone(c.peer); }); c.on('error',()=>{ conns.delete(c.peer); hostGone(c.peer); }); });
    peer.on('disconnected',()=>{ try{ peer.reconnect(); }catch(x){} });
    peer.on('error',e=>{ if(!done) no(e); else netStat('연결 오류: '+(e.type||e.message)); }); }).catch(no); }); }
const others=()=>NET.players.filter(p=>!p.host);
function sendAll(d){ if(NET.tx) for(const p of others()) NET.tx.send(p.pid,d); }
function lobbyOut(){ const h=NET.players[0]; if(h){ h.name=NET.name(); h.key=okKey(sel.me)?sel.me:'ei'; h.re=!!(sel.meR&&CH[sel.me+'_r']); } const L=NET.players.map(p=>({pid:p.pid,name:p.name,key:p.key,re:p.re,team:p.team,host:!!p.host})); for(const p of others()) NET.tx.send(p.pid,{t:'lobby',players:L,code:NET.code,you:p.pid}); drawNet(); }
function hostMsg(pid,d){ if(!NET.host||!d) return; let p=NET.players.find(x=>x.pid===pid);
  if(d.t==='pg'){ NET.tx.send(pid,{t:'pg',ts:d.ts}); return; }
  if(d.t==='chat'){ if(p&&typeof d.text==='string'){ const m={t:'chat',name:p.name||'손님',team:p.team,text:d.text.slice(0,80)}; sendAll(m); chatShow(m); } return; }
  if(d.t==='hello'){ if(d.v!==APPV) return NET.tx.send(pid,{t:'bye',why:'서로 판이 다르다 (방장 v'+APPV+', 나 v'+(d.v||'?')+'). 둘 다 새로고침한 뒤 다시 들어온다',final:1}); if(!p){ if(NET.players.length>=10) return NET.tx.send(pid,{t:'bye',why:'방이 가득 찼다'}); p={pid,name:'',key:'ei',re:false,team:others().length%2?0:1}; NET.players.push(p); } p.name=String(d.name||'손님').slice(0,8); if(okKey(d.key)){ p.key=d.key; p.re=!!d.re; } lobbyOut(); if(NET.live) reseat(p); return; }
  if(!p) return;
  if(d.t==='pick'){ if(okKey(d.key)){ p.key=d.key; p.re=!!d.re; } if(d.team===0||d.team===1) p.team=d.team; if(d.name) p.name=String(d.name).slice(0,8); lobbyOut(); }
  else if(d.t==='bye') hostGone(pid);
  else if(d.t==='in'||d.t==='cast'){ const e=ents.find(o=>o.net&&o.net.pid===pid); if(!e||!NET.live) return;
    if(d.t==='in'){ const m=d.mv||[0,0],L=Math.hypot(m[0],m[1])||0; e.net.mv=L>1?{x:m[0]/L,y:m[1]/L}:{x:+m[0]||0,y:+m[1]||0}; e.net.held.b=!!d.hb; e.net.aim=d.aim?norm(+d.aim[0]||0,+d.aim[1]||0):null; }
    else if(!e.dead&&!over&&typeof d.s==='string'){ if(d.aim&&canAct(e)){ e.aim=norm(+d.aim[0]||0,+d.aim[1]||0); e.aimLock=now+1; e.aimMan=now+.12; } cast(e,d.s); } } }
/* 양쪽에 모두 있는 캐릭터만 고를 수 있다(조합·카드로 만든 캐릭터, 보스, 적은 안 된다) */
const okKey=k=>!!CH[k]&&!CH[k].re&&!CH[k].built&&!CH[k].custom&&!CH[k].mon&&!CH[k].mob&&!CH[k].kit;
function hostGone(pid){ const i=NET.players.findIndex(x=>x.pid===pid&&!x.host); if(i<0) return; const p=NET.players[i]; NET.players.splice(i,1); for(const e of ents) if(e.net&&e.net.pid===pid){ e.net=null; e.left=p.name; e.pname=null; } if(NET.host){ lobbyOut(); if(NET.live) toast((p.name||'손님')+' 연결이 끊겼다 · 컴퓨터가 대신 움직인다'); } }
/* 싸우는 도중 끊겼다 다시 들어온 사람은 제 캐릭터를 돌려받는다 */
function reseat(p){ const e=ents.find(o=>o.left&&o.left===p.name&&!o.net); if(!e) return; e.net={pid:p.pid,mv:{x:0,y:0},held:{},aim:null}; e.pname=p.name; e.left=null; p.eid=e.id; NET.known=new Set(); NET.n=0; NET.mSig=''; const mapKey=Object.keys(MAPS).find(k=>MAPS[k]===MAP)||'basic'; NET.tx.send(p.pid,{t:'start',mode,teamN,map:mapKey,land:LAND,W,H,you:e.id,team:e.team,cap:CAPGOAL}); toast((p.name||'손님')+' 다시 들어왔다'); }
/* 판을 만든 직후: 들어온 사람들을 자기 편의 컴퓨터 자리에 꽂는다(상대 편은 '상대' 칸부터). 자리가 없으면 다른 편, 그래도 없으면 구경 */
NET.afterSpawn=()=>{ for(const p of others()){ p.eid=0; const seat=tm=>ents.filter(o=>o.team===tm&&o!==me&&!o.net&&!o.c.mon).sort((a,b)=>(a.slot||0)-(b.slot||0))[0],o=seat(p.team)||seat(1-p.team); if(!o) continue;
    const key=p.re&&CH[p.key+'_r']?p.key+'_r':p.key,n=mk(key,o.team,o.x,o.y); n.slot=o.slot; n.busy=o.busy; n.net={pid:p.pid,mv:{x:0,y:0},held:{},aim:null}; n.pname=p.name; ents[ents.indexOf(o)]=n; if(o===foe) foe=n; p.eid=n.id; } };
NET.start=()=>{ NET.live=others().length>0; NET.acc=0; NET.n=0; NET.known=new Set(); NET.mSig=''; for(const f of floats) f._s=0; NET.ev={h:[],k:[],c:[]}; if(!NET.live) return; const mapKey=Object.keys(MAPS).find(k=>MAPS[k]===MAP)||'basic';
  for(const p of others()){ const e=ents.find(o=>o.id===p.eid); NET.tx.send(p.pid,{t:'start',mode,teamN,map:mapKey,land:LAND,W,H,you:p.eid||0,team:e?e.team:1,cap:CAPGOAL}); } snap(); };
/* 보내는 양 줄이기: 자리·체력처럼 늘 바뀌는 것만 매번 보내고, 이름·최대 체력·상태 줄처럼 잘 안 바뀌는 것은 세 번에 한 번만 보낸다.
   피해 숫자·기록 줄은 새로 생긴 것만 보낸다. 5대5에서 손님 한 명당 초당 93KB쯤 나가던 것이 3분의 1쯤으로 준다 */
function entS(e,full,mid){ const o={id:e.id,key:e.key,team:e.team,x:r2(e.x),y:r2(e.y),z:r2(e.z),hp:r2(e.hp),max:e.max,atk:e.atk,dead:!!e.dead,aim:[r2(e.aim.x),r2(e.aim.y)],busy:r2(e.busy),chant:r2(e.chant),slot:e.slot||0,
    st:e.st.map(s=>({k:s.k,until:r2(s.until),v:typeof s.v==='number'||typeof s.v==='string'?s.v:undefined})),sh:e.sh.map(s=>({v:r2(s.v),until:r2(s.until)})),cd:{}};
  for(const k in e.cd) if(e.cd[k]>0) o.cd[k]=r2(e.cd[k]); if(e.dash) o.dash=[r2(e.dash.vx),r2(e.dash.vy),r2(e.dash.until)]; if(e.castFx) o.cf=[r2(e.castFx.t0),e.castFx.ult?1:0]; if(e.flash!==undefined) o.fl=r2(e.flash); if(e.swingT!==undefined){ o.sw=r2(e.swingT); o.sn=e.swingN||0; } if(e.shotT!==undefined) o.so=r2(e.shotT);
  if(e.ultUsed) o.uu=1; if(e.boss) o.boss=1; if(e.launched) o.la=1; if(e.sand) o.sand=1; if(e.tag) o.tag=[e.tag.n,r2(e.tag.t0)]; if(e.pname) o.pn=e.pname;
  if(mid) try{ o.r=ser(e.r,0); o.hud=e.c.hud(e); o.sl=stateList(e); const cn={}; for(const s in e.c.skills){ const k=e.c.skills[s]; if(k.can) cn[s]=!!k.can(e); } o.can=cn; }catch(x){}
  if(full){ o.dealt={}; for(const k in e.dealt) o.dealt[k]=Math.round(e.dealt[k]); } if(!mid){ for(const k of ['key','team','max','atk','slot','uu','boss','sand','pn','cd']) delete o[k]; } return o; }
function snap(){ if(!NET.live||!NET.tx) return; const full=NET.n++%15===0||!!over,mid=full||NET.n%4===0,ev=NET.ev; NET.ev={h:[],k:[],c:[]}; const K=NET.known||(NET.known=new Set());
  const nf=floats.filter(f=>!f._s),fl=nf.map(plain); nf.forEach(f=>{ f._s=1; }); const ms=msgs.length+':'+(msgs.length?msgs[msgs.length-1].t0:0)+':'+procs.length+':'+(procs.length?procs[procs.length-1].t0:0),chg=full||ms!==NET.mSig; NET.mSig=ms;
  sendAll({t:'s',n:r2(now),e:ents.map(e=>{ const m2=mid||!K.has(e.id); K.add(e.id); return entS(e,full,m2); }),p:projs.map(plain),f:fx.map(plain),z:zones.filter(z=>!z.hid).map(plain),w:walls.map(plain),fl,m:chg?msgs:undefined,pr:chg?procs:undefined,sc:score,cp:cap,ft:feats.map(plain),ch:[r2(chaosUntil),chaosName],ov:over?{w:over.winner?over.winner.id:0,t:r2(over.t)}:0,ev}); }
on('step',dt=>{ if(!NET.live) return; NET.acc+=dt; if(NET.acc>=1/NET.HZ){ NET.acc=0; snap(); } });
on('end',()=>{ if(NET.live){ snap(); NET.live=false; } });
on('hit',(s,t,amt,label,o)=>{ if(NET.live&&NET.ev.h.length<80) NET.ev.h.push([s.id,t.id,r2(amt),label,(o&&o.basic?1:0)|(o&&o.skill?2:0)|(o&&o.fixed?4:0)|(PH?8:0)]); });
on('kill',(s,t)=>{ if(NET.live) NET.ev.k.push([s.id,t.id]); });
on('cast',(e,slot)=>{ if(NET.live) NET.ev.c.push([e.id,slot]); });

/* ───────── 들어온 쪽 ───────── */
function joinOpen(code){ return new Promise((ok,no)=>{
  if(NET.bc){ const pid='p'+Math.random().toString(36).slice(2,8),ch=new BroadcastChannel(ROOM(code)); ch.onmessage=ev=>{ const m=ev.data; if(m&&m.to===pid) clientMsg(m.d); }; NET.pid=pid; NET.tx={send:d=>ch.postMessage({to:'host',from:pid,d}),close:()=>ch.close()}; return ok(); }
  Promise.all([loadPeer(),relayIce()]).then(()=>{ const peer=new Peer(ICE()); let done=false; const fail=e=>{ if(!done){ done=true; try{ peer.destroy(); }catch(x){} no(e); } },to=setTimeout(()=>fail(new Error('방을 찾지 못했다')),15000);
    peer.on('open',id=>{ NET.pid=id; const c=peer.connect(ROOM(code),{reliable:true,serialization:'json'});
      c.on('open',()=>{ clearTimeout(to); done=true; NET.tx={send:d=>{ if(c.open){ try{ c.send(d); }catch(x){} } },close:()=>{ try{ peer.destroy(); }catch(x){} }}; setTimeout(()=>linkKind(c,k=>{ NET.kind=k; drawNet(); }),1500); ok(); });
      c.on('data',clientMsg); c.on('close',()=>{ if(NET.tx) clientLost('방장과 연결이 끊겼다',true); }); c.on('error',()=>{ if(NET.tx) clientLost('연결 오류',true); }); });
    peer.on('error',e=>{ clearTimeout(to); if(!done) fail(new Error(e.type==='peer-unavailable'?'그 코드의 방이 없다':(e.type||e.message))); }); }).catch(no); }); }
function clientMsg(d){ if(!NET.client||!d) return; NET.seen=performance.now(); if(d.t==='pg'){ NET.rtt=Math.round(performance.now()-d.ts); if(!NET.playing) drawNet(); return; } if(d.t==='bye'&&d.final){ NET.retry=9; } if(d.t==='lobby'){ NET.players=d.players; NET.code=d.code; drawNet(); } else if(d.t==='start') clientStart(d); else if(d.t==='s'){ if(NET.playing) apply(d); } else if(d.t==='chat'){ chatShow(d); } else if(d.t==='tw'){ if(typeof coopInfo==='function') coopInfo(d); } else if(d.t==='bye') clientLost(d.why||'방이 닫혔다'); }
/* 들어가기(다시 잇기 포함) */
async function joinFlow(code,again){ netStat(again?'다시 잇는 중…':'들어가는 중…'); try{ NET.client=true; await joinOpen(code); NET.code=code; patchClient(); NET.seen=performance.now(); NET.tx.send({t:'hello',v:APPV,name:NET.name(),key:okKey(sel.me)?sel.me:'ei',re:!!(sel.meR&&CH[sel.me+'_r'])}); if(!okKey(sel.me)) toast('만든 캐릭터는 함께에서 쓸 수 없어 에이로 들어갔다. 캐릭터를 다시 고른다',3600); netStat(again?'다시 이어졌다.':'들어왔다. 고르는 화면에서 캐릭터를 고르고 방장을 기다린다.'); if(!again) NET.retry=0; drawNet(); return true; }catch(x){ NET.client=false; NET.tx=null; netStat((again?'다시 잇지 못했다: ':'들어가지 못했다: ')+((x&&x.message)||'알 수 없음')+(/ice|negotiation|찾지/i.test((x&&x.message)||'')?' · 두 기기가 서로 직접 닿지 못하는 것일 수 있다. 같은 와이파이에서 해 보거나 아래 중계 서버를 적는다':'')); drawNet(); return false; } }
function clientLost(why,canRetry){ if(!NET.client) return; if(canRetry&&(NET.retry||0)<2&&NET.code){ const code=NET.code; NET.retry=(NET.retry||0)+1; const was=running; netLeave(true); if(was){ running=false; $('menu').style.display='none'; $('sel').hidden=false; drawSel(); goPage('net'); } joinFlow(code,true); return; } netLeave(true); netStat(why); if(running){ running=false; $('menu').style.display='none'; } $('res').hidden=true; $('pause').hidden=true; $('sel').hidden=false; drawSel(); goPage('net'); }
/* 받은 상태로 그리려면 캐릭터의 셈(상태 줄·단추 조건·겉 꾸밈)이 방장 쪽 값에 기대야 한다. 들어가 있는 동안만 바꿔 끼우고, 나가면 되돌린다 */
function patchClient(){ if(NET.orig) return; const O=NET.orig={stateList,hud:{},can:[],aura:{},res:{}}; stateList=e=>e.slS||[];
  for(const k in CH){ const c=CH[k]; O.hud[k]=c.hud; c.hud=e=>e.hudS!==undefined?e.hudS:''; for(const s in c.skills){ const sk=c.skills[s]; if(sk.can){ O.can.push([sk,sk.can]); sk.can=e=>!e.canS||e.canS[s]!==false; } } }
  for(const k in AURA){ const f=AURA[k]; O.aura[k]=f; AURA[k]=(e,by)=>{ try{ f(e,by); }catch(x){} }; }
  for(const k in RES){ const R0=RES[k]; O.res[k]=R0; const W={}; for(const m in R0){ const f=R0[m]; W[m]=typeof f==='function'?e=>{ try{ return f(e); }catch(x){ return 0; } }:f; } RES[k]=W; } }
function unpatchClient(){ const O=NET.orig; if(!O) return; NET.orig=null; stateList=O.stateList; for(const k in O.hud) CH[k].hud=O.hud[k]; for(const [sk,f] of O.can) sk.can=f; for(const k in O.aura) AURA[k]=O.aura[k]; for(const k in O.res) RES[k]=O.res[k]; }
function clientStart(d){ floats=[]; practice=false; mode=d.mode; teamN=d.teamN; LAND=!!d.land; MAP=MAPS[d.map]||MAPS.basic; W=d.W; H=d.H; NET.you=d.you; NET.flip=d.team===1; NET.em.clear(); NET.first=true; NET.playing=true;
  loop.err=null; bgmStop(); chaosUntil=0; banner=null; mini=null; parts=[]; shake=0; procs=[]; msgs=[]; projs=[]; fx=[]; floats=[]; zones=[]; walls=[]; feats=[]; Q=[]; ents=[]; over=null; paused=false; score=[0,0]; cap=[0,0]; now=0; draw.k=9; me=null; foe=null;
  $('info').hidden=true; $('pause').hidden=true; netStat(''); }
function apply(S){ const E=NET.em,seen=new Set(); now=S.n; const list=[];
  for(const s of S.e){ let e=E.get(s.id); if(s.key===undefined){ if(!e) continue; s.key=e.key; s.team=e.teamRaw; s.max=e.max; s.atk=e.atk; s.slot=e.slot; s.uu=e.ultUsed; s.boss=e.boss; s.sand=e.sand; s.pn=e.pname; s.r=e.r; s.hud=e.hudS; s.sl=e.slS; s.can=e.canS; } const fresh=!e||e.key!==s.key; if(fresh){ e={id:s.id,x:s.x,y:s.y,mv:{x:0,y:0},ai:{},dealt:{},r:{},cd:{}}; E.set(s.id,e); } seen.add(s.id);
    e.key=s.key; e.c=CH[s.key]||CH.ei; e.teamRaw=s.team; e.team=tf(s.team); e.tx=s.x; e.ty=s.y; if(Math.hypot(e.x-s.x,e.y-s.y)>3){ e.x=s.x; e.y=s.y; } e.z=s.z; e.vz=0; e.hp=s.hp; e.max=s.max; e.atk=s.atk; e.dead=s.dead; e.aim={x:s.aim[0],y:s.aim[1]}; e.busy=s.busy; e.chant=s.chant; e.slot=s.slot; e.st=s.st; e.sh=s.sh;
    if(s.cd||!e.cd||!('b' in e.cd)){ e.cd={b:0,n1:0,n2:0,aw:0,ult:0,crouch:0,x1:0,x2:0,x3:0,x4:0}; Object.assign(e.cd,s.cd||{}); } e.dash=s.dash?{vx:s.dash[0],vy:s.dash[1],until:s.dash[2]}:null; e.castFx=s.cf?{t0:s.cf[0],ult:!!s.cf[1]}:null; e.flash=Math.max(e.flash||-9,s.fl===undefined?-9:s.fl); e.swingT=s.sw; e.swingN=s.sn; e.shotT=s.so;
    e.ultUsed=!!s.uu; e.boss=!!s.boss; e.launched=!!s.la; e.sand=!!s.sand; e.tag=s.tag?{n:s.tag[0],t0:s.tag[1]}:null; e.pname=s.pn||null; e.r=s.r||{}; e.hudS=s.hud||''; e.slS=s.sl||[]; e.canS=s.can||null; if(s.dealt) e.dealt=s.dealt; list.push(e); }
  for(const id of [...E.keys()]) if(!seen.has(id)) E.delete(id);
  ents=list; me=E.get(NET.you)||list.find(e=>e.team===0)||list[0]; pickFoe();
  projs=S.p.map(unplain).filter(p=>p.owner); for(const p of projs) p.hit=new Set(); fx=S.f.map(unplain); zones=S.z.map(unplain).filter(z=>z.owner); walls=S.w.map(unplain);
  floats=floats.filter(f=>now-f.t0<.9).concat(S.fl.map(f=>{ unplain(f); if(f.kd&&f.own) f.col=(f.own.team===0?HURTCOL:NUMCOL)[f.kd]; return f; }));
  const sw=c=>!NET.flip?c:c==='rgb('+TC[0]+')'?'rgb('+TC[1]+')':c==='rgb('+TC[1]+')'?'rgb('+TC[0]+')':c; if(S.m) msgs=S.m.map(m=>({seg:m.seg.map(x=>[x[0],sw(x[1])]),team:tf(m.team),big:m.big,t0:m.t0})); if(S.pr) procs=S.pr.map(q=>Object.assign({},q,{team:tf(q.team)}));
  score=NET.flip?[S.sc[1],S.sc[0]]:S.sc.slice(); cap=NET.flip?[S.cp[1],S.cp[0]]:S.cp.slice(); feats=S.ft.map(f=>{ if(f.t==='cap'&&NET.flip&&(f.own===0||f.own===1)) f.own=1-f.own; f.solid=!!(FEAT[f.t]&&FEAT[f.t].solid); return f; }); chaosUntil=S.ch[0]; chaosName=S.ch[1];
  if(NET.first&&me){ NET.first=false; OPT.raid=me.boss?'boss':'hero'; uiBegin(); $('sel').hidden=true; $('res').hidden=true; $('menu').style.display='block'; if(!running){ running=true; fit(); fire('begin'); last=performance.now(); requestAnimationFrame(loop); } else { fit(); fire('begin'); } }
  /* 방장 쪽에서 일어난 일을 여기서도 한 번씩 울린다: 타격 이펙트·소리·진동 */
  const ev=S.ev; if(ev&&me){ for(const h of ev.h){ const s=E.get(h[0]),t=E.get(h[1]); if(!s||!t) continue; const f=h[4]; hitFx(s,t,h[2]); if(s===me||t===me||ents.length<=2) sfx('hit',h[2]>=25); if(h[2]>=25){ shake=Math.max(shake,.28); if(t===me) buzz(30); } PH=!!(f&8); try{ fire('hit',s,t,h[2],h[3],{basic:!!(f&1),skill:!!(f&2),fixed:!!(f&4)}); } finally { PH=false; } }
    for(const k of ev.k){ const s=E.get(k[0]),t=E.get(k[1]); if(!t) continue; burst(t.x,t.y,36,'rgb('+TC[t.team]+')',9); shake=.6; sfx('kill'); buzz(120); if(s) fire('kill',s,t); }
    for(const c of ev.c){ const e=E.get(c[0]); if(!e) continue; const k=e.c.skills[c[1]]; if(!k) continue; if(c[1]==='ult'){ sfx('ult'); burst(e.x,e.y,40,'#e3c377',8); if(e===me){ banner={who:e.c.name,skill:k.name,team:e.team,t0:performance.now(),e}; shake=.4; } else mini={who:short(e),skill:k.name,team:e.team,t0:performance.now()}; } else if(k.cd>=1) castSnd(e,c[1]); fire('cast',e,c[1],k); } }
  if(S.ov&&!over){ over={winner:E.get(S.ov.w)||null,t:S.ov.t}; setTimeout(()=>{ if(NET.client&&over){ NET.playing=false; showResult(); } },900); } }
function pickFoe(){ if(!me) return; const L=ents.filter(o=>o.team!==me.team); const f=L.filter(o=>!o.dead).sort((a,b)=>dist(me,a)-dist(me,b))[0]||L[0]||me; if(f!==foe){ foe=f; const el=$('hb-foe').querySelector('.nm'); if(el) el.textContent=foe.c.name; } }
/* 받은 상태 사이사이를 부드럽게 잇고, 내 조작을 보낸다 */
NET.frame=dt=>{ if(!me) return; now+=dt; const k=Math.min(1,dt*16); for(const e of ents){ if(e.tx!==undefined){ e.x+=(e.tx-e.x)*k; e.y+=(e.ty-e.y)*k; } for(const c in e.cd) if(e.cd[c]>0) e.cd[c]=Math.max(0,e.cd[c]-dt); }   /* 대기시간은 받은 값 사이를 여기서 센다 */ for(const p of projs){ p.x+=p.vx*dt; p.y+=p.vy*dt; }
  if(mAim&&!me.dead) mouseAim(); const t=performance.now(); if(t-NET.lastIn>33&&NET.tx){ NET.lastIn=t; NET.tx.send({t:'in',mv:[r2(stick.x),r2(stick.y)],hb:!!held.b&&!paused,aim:mAim?[r2(me.aim.x),r2(me.aim.y)]:0}); }
  if(!paused&&!over) for(const s in held) if(held[s]&&s!=='b') NET.cast(s); };
NET.cast=slot=>{ if(!NET.tx||!me||over) return; const t=performance.now(); if(t-(NET.lastC[slot]||0)<90) return; NET.lastC[slot]=t; NET.tx.send({t:'cast',s:slot,aim:(me.aimMan>now||mAim)?[r2(me.aim.x),r2(me.aim.y)]:0}); };
NET.wait=()=>{ toast('방장이 싸우기를 누르면 함께 시작한다.'); };
NET.pick=()=>{ if(NET.host&&NET.tx) lobbyOut(); else if(NET.client&&NET.tx){ const me0=NET.players.find(p=>p.pid===NET.pid); if(!okKey(sel.me)) return toast('만든 캐릭터는 함께에서 쓸 수 없다'); NET.tx.send({t:'pick',key:sel.me,re:!!(sel.meR&&CH[sel.me+'_r']),name:NET.name(),team:me0?me0.team:undefined}); } };
NET.name=()=>($('n-name').value||'').trim().slice(0,8)||(NET.host?'방장':'손님');

/* ───────── 화면 ───────── */
function netStat(t){ $('n-stat').textContent=t||''; $('n-stat').style.display=t?'block':'none'; if(t&&(page!=='net'||$('sel').hidden)) toast(t,2800); }
function drawNet(){ const on=NET.host||NET.client; $('nav').querySelector('[data-p="net"]').classList.toggle('dot',on); $('n-off').hidden=on; $('n-on').hidden=!on; const bar=$('netbar'); bar.hidden=!on; $('start').textContent=NET.client?'방장을 기다리는 중':(practice?'연습 시작':'싸우기'); $('again').textContent=NET.client?'방장을 기다리는 중':'다시'; if(!on) return;
  $('n-role').textContent=NET.host?'내가 방장 · 이 코드를 알려 준다':'들어온 방'; $('n-code').textContent=NET.code; bar.textContent='방 '+NET.code+' · '+NET.players.length+'명'+(NET.host?' · 내가 방장':'')+(NET.client&&NET.rtt?' · '+NET.rtt+'ms':'')+(NET.client&&NET.kind?' · '+NET.kind:'');
  const mine=NET.players.find(p=>NET.host?p.host:p.pid===NET.pid); $('n-team').style.display=NET.host?'none':'flex'; $('n-team').previousElementSibling.style.display=NET.host?'none':'block'; $('n-team').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',!!mine&&+b.dataset.v===mine.team));
  $('n-list').innerHTML=NET.players.map(p=>{ const c=CH[p.re&&CH[p.key+'_r']?p.key+'_r':p.key]||CH.ei; return '<div class="pl t'+p.team+'"><b>'+esc(p.name||'손님')+(p.host?' (방장)':'')+(p===mine?' · 나':'')+'</b><span>'+c.name.split(', ')[1]+(c.re?' 재림':'')+'</span><span style="color:var(--muted)">'+(p.team?'상대 편':'방장 편')+'</span></div>'; }).join(''); }
function netLeave(quiet){ if(NET.tx){ if(!quiet){ try{ if(NET.host) sendAll({t:'bye',why:'방장이 방을 닫았다'}); else NET.tx.send({t:'bye'}); }catch(x){} } const tx=NET.tx; NET.tx=null; setTimeout(()=>{ try{ tx.close(); }catch(x){} },150); }
  for(const e of ents) if(e&&e.net){ e.net=null; } unpatchClient(); NET.host=false; NET.client=false; NET.live=false; NET.playing=false; NET.players=[]; NET.code=''; NET.flip=false; drawNet(); }
{ const CODE=()=>{ const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s=''; for(let i=0;i<4;i++) s+=A[Math.floor(Math.random()*A.length)]; return s; };
  try{ $('n-name').value=localStorage.getItem('aetherName')||''; }catch(x){} $('n-name').addEventListener('change',()=>{ try{ localStorage.setItem('aetherName',$('n-name').value); }catch(x){} NET.pick(); });
  $('n-host').onclick=async()=>{ if(NET.host||NET.client) return; netStat('방을 여는 중…'); for(let i=0;i<3;i++){ const code=CODE(); try{ await hostOpen(code); NET.host=true; NET.code=code; NET.players=[{pid:'host',host:true,team:0,name:NET.name(),key:sel.me,re:false}]; if(practice) setMode(1); netStat('방을 열었다. 코드를 알려 주고, 다 모이면 고르는 화면에서 싸우기를 누른다.'); lobbyOut(); return; }catch(x){ if(!(x&&x.type==='unavailable-id')){ netStat('방을 열지 못했다: '+((x&&(x.type||x.message))||'알 수 없음')); return; } } } netStat('방 코드를 얻지 못했다. 다시 눌러 본다.'); };
  $('n-join').onclick=async()=>{ if(NET.host||NET.client) return; const code=($('n-join-code').value||'').trim().toUpperCase(); if(code.length<4) return netStat('방 코드를 적는다.'); netStat('들어가는 중…');
    NET.retry=0; joinFlow(code,false); };
  $('n-leave').onclick=()=>{ const cl=NET.client; netLeave(); netStat('방에서 나왔다.'); if(cl&&running){ running=false; $('menu').style.display='none'; $('sel').hidden=false; drawSel(); } };
  $('n-team').onclick=e=>{ const b=e.target.closest('button'); if(!b||!NET.client) return; const me0=NET.players.find(p=>p.pid===NET.pid); if(me0) me0.team=+b.dataset.v; NET.pick(); };
  /* 캐릭터를 바꾸면(저장될 때마다) 방에도 알린다 */
  const save0=save; save=function(){ if(!(NET.client&&NET.playing)) save0(); if(NET.host||NET.client) NET.pick(); };
  const sm0=setMode; setMode=function(m){ if(NET.client) return; if(NET.host&&m===0){ netStat('방을 열어 둔 동안에는 연습을 할 수 없다.'); return; } sm0(m); if(NET.host||NET.client) drawNet(); };
  $('p-quit').addEventListener('click',()=>{ if(NET.client) NET.playing=false; });
  addEventListener('pagehide',()=>{ if(NET.tx) netLeave(); });
  /* 살아 있는지 2초마다 묻는다. 8초 동안 아무 소식이 없으면 알리고, 15초면 끊긴 것으로 보고 다시 잇는다 */
  setInterval(()=>{ if(!NET.client||!NET.tx) return; NET.tx.send({t:'pg',ts:performance.now()}); const q=performance.now()-(NET.seen||0); if(q>15000) clientLost('방장에게서 소식이 없다',true); else if(q>8000) netStat('연결이 불안정하다 · 방장 기기의 화면이 꺼졌거나 다른 앱으로 넘어갔을 수 있다'); },2000);
  /* 방장 화면이 가려지면 싸움이 멈춘다(브라우저가 그리기를 멈춘다). 돌아오면 알린다 */
  document.addEventListener('visibilitychange',()=>{ if(NET.host&&NET.live&&!document.hidden) toast('돌아왔다 · 화면이 가려진 동안 싸움이 멈춰 있었다',3000); });
  /* 초대 링크: 주소 뒤에 ?room=코드. 받은 사람은 열기만 하면 들어간다 */
  const web=/^https?:$/.test(location.protocol),turnHash=()=>{ try{ const r=JSON.parse(localStorage.getItem('aetherRelay')||'null'); if(r&&r.app&&r.key) return '#r='+encodeURIComponent(r.app)+'~'+encodeURIComponent(r.key); const t=localStorage.getItem('aetherTurn'); return t?'#t='+btoa(unescape(encodeURIComponent(t))):''; }catch(x){ return ''; } },link=()=>location.origin+location.pathname+'?room='+NET.code+turnHash();   /* 중계 서버를 적어 두었다면 링크에 실어 보낸다(받는 사람은 적을 필요가 없다) */
  { const m=/[#&]r=([^~&]+)~([^&]+)/.exec(location.hash); if(m){ try{ localStorage.setItem('aetherRelay',JSON.stringify({app:decodeURIComponent(m[1]),key:decodeURIComponent(m[2])})); setTimeout(()=>toast('초대 링크에 든 중계 서버 열쇠를 적어 두었다'),1500); }catch(x){} } }
  fetch('relay.json',{cache:'no-cache'}).then(q=>q.ok?q.json():null).then(r=>{ if(r&&r.app&&r.key){ NET.siteRelay={app:String(r.app),key:String(r.key)}; relayShow(); } }).catch(()=>{});
  const relayShow=()=>{ const r=relayGet(); $('n-relay-stat').textContent=r?(r===NET.siteRelay?'이 사이트에 중계 서버가 마련돼 있다. 아무것도 적지 않아도 된다.':'중계 서버 열쇠를 적어 두었다 ('+r.app+').'):'중계 서버 없음 · 직접 연결만 쓴다.'; };
  try{ const r=JSON.parse(localStorage.getItem('aetherRelay')||'null')||{}; $('n-relay-app').value=r.app||''; $('n-relay-key').value=r.key||''; }catch(x){} relayShow();
  for(const id of ['n-relay-app','n-relay-key']) $(id).addEventListener('change',()=>{ try{ const app=$('n-relay-app').value.trim().replace(/^https?:\/\//,'').replace(/\.metered\.live.*$/,''),key=$('n-relay-key').value.trim(); $('n-relay-app').value=app; if(app&&key){ localStorage.setItem('aetherRelay',JSON.stringify({app,key})); NET.ice=null; relayIce().then(()=>toast(NET.ice?'중계 서버 확인됨 · 다음 연결부터 쓴다':'열쇠를 적어 두었지만 확인하지 못했다. 앱 이름과 API Key를 다시 본다',3600)); } else if(!app&&!key){ localStorage.removeItem('aetherRelay'); NET.ice=null; toast('중계 서버 열쇠를 지웠다'); } relayShow(); }catch(x){} });
  { const m=/[#&]t=([A-Za-z0-9+/=]+)/.exec(location.hash); if(m){ try{ const t=JSON.parse(decodeURIComponent(escape(atob(m[1])))); if(t&&t.url){ localStorage.setItem('aetherTurn',JSON.stringify({url:String(t.url),user:String(t.user||''),pass:String(t.pass||'')})); setTimeout(()=>toast('초대 링크에 든 중계 서버를 적어 두었다'),1500); } }catch(x){} } }
  $('n-share').onclick=async()=>{ if(!NET.code) return; const text=web?link():NET.code; try{ if(web&&navigator.share){ await navigator.share({title:'에테르',text:'에테르 방 '+NET.code,url:link()}); return; } }catch(x){ if(x&&x.name==='AbortError') return; } try{ await navigator.clipboard.writeText(text); toast(web?'초대 링크를 복사했다':'방 코드를 복사했다'); }catch(x){ toast('방 코드 '+NET.code+' 를 직접 알려 준다'); } };
  { const m=/[?&]room=([A-Za-z0-9]{4,6})/.exec(location.search); if(m){ $('n-join-code').value=m[1].toUpperCase(); try{ history.replaceState(null,'',location.pathname); }catch(x){} setTimeout(()=>{ goPage('net'); if(!NET.host&&!NET.client) $('n-join').click(); },600); } }
  /* 중계 서버(TURN) 적어 두기 */
  try{ const t=JSON.parse(localStorage.getItem('aetherTurn')||'null')||{}; $('n-turn-url').value=t.url||''; $('n-turn-user').value=t.user||''; $('n-turn-pass').value=t.pass||''; }catch(x){}
  for(const id of ['n-turn-url','n-turn-user','n-turn-pass']) $(id).addEventListener('change',()=>{ try{ let url=$('n-turn-url').value.trim(); if(!url&&$('n-turn-user').value.trim()&&$('n-turn-pass').value){ url=METERED; $('n-turn-url').value=url; } if(url) localStorage.setItem('aetherTurn',JSON.stringify({url,user:$('n-turn-user').value.trim(),pass:$('n-turn-pass').value})); else localStorage.removeItem('aetherTurn'); toast(url?'중계 서버를 적어 두었다 · 다음 연결부터 쓴다':'중계 서버를 지웠다'); }catch(x){} });
  $('n-turn-fill').onclick=()=>{ $('n-turn-url').value=METERED; $('n-turn-url').dispatchEvent(new Event('change')); };
  if(!web) $('n-web').hidden=false;
  netStat(''); }

/* ───────── 채팅 (컴퓨터에서 T로 열고 Enter로 보낸다. 받는 것은 어느 기기에서나 보인다) ───────── */
{ const st=document.createElement('style'); st.textContent='#chat{position:fixed;left:12px;bottom:calc(96px + env(safe-area-inset-bottom));z-index:40;width:min(420px,70vw);pointer-events:none;display:flex;flex-direction:column;gap:3px}'
   +'#chat .cl{align-self:flex-start;max-width:100%;padding:4px 9px;border-radius:8px;background:rgba(6,9,23,.78);font:500 13px/1.35 var(--body);color:#eef1ff;overflow-wrap:anywhere;transition:opacity .4s}#chat .cl b{font-weight:800;margin-right:6px}#chat .cl.old{opacity:0}'
   +'#chat input{pointer-events:auto;height:36px;border:1px solid var(--aether);border-radius:8px;background:rgba(6,9,23,.92);color:var(--ink);font:14px var(--body);padding:0 10px;user-select:text;-webkit-user-select:text;outline:none;margin-top:4px}#chat input[hidden]{display:none}#chat .hint{font:11px var(--body);color:var(--muted);padding-left:2px}';
  document.head.appendChild(st); const box=document.createElement('div'); box.id='chat'; box.innerHTML='<div id="chat-log"></div><input id="chat-in" type="text" maxlength="80" placeholder="Enter 보내기 · Esc 닫기" autocomplete="off" hidden>'; document.body.appendChild(box);
  const inp=box.querySelector('#chat-in'),log=box.querySelector('#chat-log'); log.style.cssText='display:flex;flex-direction:column;gap:3px';
  window.chatShow=m=>{ if(!m||!m.text) return; const mine=NET.players.find(p=>NET.host?p.host:p.pid===NET.pid),same=mine?m.team===mine.team:m.team===0,el=document.createElement('div'); el.className='cl'; const b=document.createElement('b'); b.textContent=String(m.name||'').slice(0,8); b.style.color='rgb('+TC[same?0:1]+')'; el.appendChild(b); el.appendChild(document.createTextNode(String(m.text).slice(0,80))); log.appendChild(el); while(log.children.length>6) log.firstChild.remove(); setTimeout(()=>el.classList.add('old'),7000); setTimeout(()=>el.remove(),7500); };
  const close=()=>{ inp.value=''; inp.hidden=true; inp.blur(); },send=()=>{ const t=inp.value.trim(); close(); if(!t||!NET.tx) return; if(NET.host){ const m={t:'chat',name:NET.name(),team:0,text:t.slice(0,80)}; sendAll(m); chatShow(m); } else NET.tx.send({t:'chat',text:t.slice(0,80)}); };
  addEventListener('keydown',e=>{ if(document.activeElement===inp){ e.stopPropagation(); if(e.key==='Enter'){ e.preventDefault(); send(); } else if(e.key==='Escape'){ e.preventDefault(); close(); } return; }
    if(e.code!=='KeyT'||e.ctrlKey||e.metaKey||e.altKey||!matchMedia('(pointer:fine)').matches) return; const a=document.activeElement; if(a&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA'||a.tagName==='SELECT')) return; if(!(NET.host||NET.client)){ if(running) toast('채팅은 친구와 함께 할 때 쓴다'); return; } e.preventDefault(); e.stopPropagation(); inp.hidden=false; inp.focus(); },true);
  addEventListener('keyup',e=>{ if(document.activeElement===inp) e.stopPropagation(); },true); inp.addEventListener('blur',()=>{ if(!inp.hidden) close(); }); }
