"use strict";
/* 친구와 함께 — 방 만들기(P2P).
   · 방장 기기가 싸움을 돌린다(엔진 그대로). 들어온 사람은 조작만 보내고, 방장이 1초에 15번 보내는 화면 상태를 받아 그린다.
   · 연결: PeerJS(peerjs.min.js, WebRTC). 방 코드가 곧 방장의 주소다. 주소 뒤에 ?bc 를 붙여 열면 같은 브라우저의 탭끼리 붙는다(시험용, 인터넷 없이).
   · 엔진 쪽 자리: index.html의 NET.afterSpawn(사람이 모는 캐릭터 꽂기) · NET.start · NET.cast · NET.frame · step의 e.net 입력.
   주고받는 말 — 들어온 쪽→방장: hello · pick · in(이동·기본기 누름·조준) · cast · bye / 방장→들어온 쪽: lobby · start · s(화면 상태) · bye */
Object.assign(NET,{ bc:/[?&]bc\b/.test(location.search)&&(location.protocol==='file:'||/^(localhost|127\.0\.0\.1)$/.test(location.hostname)), code:'', pid:'', tx:null, players:[], em:new Map(), you:0, flip:false, playing:false, live:false, acc:0, n:0, lastIn:0, lastC:{}, ev:{h:[],k:[],c:[]}, orig:null, HZ:12 });
const r2=v=>Math.round(v*100)/100, tf=t=>NET.flip?1-t:t;
const isEnt=v=>!!(v&&typeof v==='object'&&v.c&&v.st&&v.id);
/* 보낼 수 있는 꼴로: 숫자·글자·참거짓만 남기고, 캐릭터를 가리키는 칸은 '@이름': 번호로 바꾼다 */
function plain(o){ const r={}; for(const k in o){ const v=o[k],t=typeof v; if(t==='number'){ if(isFinite(v)) r[k]=r2(v); } else if(t==='string'||t==='boolean') r[k]=v; else if(isEnt(v)) r['@'+k]=v.id; } return r; }
function unplain(o){ for(const k in o) if(k[0]==='@'){ o[k.slice(1)]=NET.em.get(o[k])||null; delete o[k]; } if(o.team!==undefined) o.team=tf(o.team); return o; }
function ser(v,d){ if(v===null||v===undefined) return undefined; const t=typeof v; if(t==='number') return isFinite(v)?r2(v):undefined; if(t==='string'||t==='boolean') return v; if(t!=='object'||d>2||v instanceof Map||v instanceof Set||isEnt(v)||v.owner) return undefined;
  if(Array.isArray(v)) return v.length>12?undefined:v.map(x=>{ const y=ser(x,d+1); return y===undefined?null:y; }); const o={}; let n=0; for(const k in v){ if(++n>28) break; const y=ser(v[k],d+1); if(y!==undefined) o[k]=y; } return o; }
/* 남이 보낸 이름 · 채팅 글을 다듬는다: 보이지 않는 글자 · 방향을 뒤집는 글자 · 빈칸처럼 보이는 한글 채움 글자를 빼고, 길이를 자른다.
   이름에서는 꺾쇠(<>)도 뺀다. 화면에 넣을 때는 따로 esc()나 textContent를 쓴다 */
const BADCH=/[\u0000-\u001f\u007f-\u009f\u00ad\u034f\u061c\u115f\u1160\u17b4\u17b5\u180e\u200b-\u200f\u2028-\u202e\u2060-\u206f\u3164\ufe00-\ufe0f\ufeff\uffa0\ufff0-\ufffb]/g;
function cleanText(v,max){ let s=String(v==null?'':v).replace(/[\t\n\r]+/g,' '); try{ s=s.normalize('NFC').replace(/[\p{Cc}\p{Cf}\p{Co}\p{Cn}]/gu,'').replace(/(\p{M}{2})\p{M}+/gu,'$1'); }catch(x){} return s.replace(BADCH,'').replace(/\s+/g,' ').trim().slice(0,max||80); }
function cleanName(v){ return cleanText(String(v==null?'':v).replace(/[<>♛]/g,''),13); }
/* 자리 표(토큰): 방장이 사람마다 하나씩 주고, 그 사람에게만 알려 준다. 끊겼다 다시 들어올 때 이것이 맞아야 제 자리를 돌려받는다 */
function newTok(){ const A='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789',r=new Uint8Array(16); try{ crypto.getRandomValues(r); }catch(x){ for(let i=0;i<16;i++) r[i]=Math.random()*256; } let s=''; for(let i=0;i<16;i++) s+=A[r[i]%A.length]; return s; }
function tokOf(code){ try{ const v=sessionStorage.getItem('aetherTok')||'',i=v.indexOf(':'); return i>0&&v.slice(0,i)===code?v.slice(i+1):''; }catch(x){ return ''; } }
/* 같은 방에 같은 이름이 둘이면 뒤에 번호를 붙인다(남을 흉내 내지 못하게) */
function uniqName(n,p){ const used=new Set(NET.players.filter(x=>x!==p).map(x=>x.name)); if(NET.host) used.add(NET.name()); if(!used.has(n)) return n; for(let i=2;i<30;i++){ const s=' '+i,v=n.slice(0,13-s.length)+s; if(!used.has(v)) return v; } return n; }
const loadPeer=()=>new Promise((ok,no)=>{ if(window.Peer) return ok(); const s=document.createElement('script'); s.src='peerjs.min.js'; s.onload=()=>window.Peer?ok():no(new Error('PeerJS')); s.onerror=()=>no(new Error('peerjs.min.js를 못 읽음')); document.head.appendChild(s); });
const ROOM=c=>'aether-room-'+c;
/* 서로 같은 판이어야 화면이 맞는다. 파일을 고쳐 내보낼 때 sw.js의 V와 함께 올린다 */
const APPV=1813;
/* 길 찾기(STUN)는 여러 곳에 묻는다. 직접 길이 안 뚫리면 relay.json에 적힌 곳에서 중계 서버(TURN) 접속 정보를 받아 거친다. relay.json이 없으면 직접 연결만 쓴다 */
let relayP=null;
const relayGet=()=>relayP||(relayP=fetch('relay.json',{cache:'no-cache',credentials:'same-origin'}).then(q=>q.ok?q.json():null).then(r=>(r&&typeof r.url==='string'&&/^https:\/\/[A-Za-z0-9.-]+(\/[^\s]*)?$/.test(r.url)&&r.url.length<300)?{url:r.url}:null).catch(()=>null).then(r=>{ if(!r) relayP=null; return r; }));
const iceOk=s=>!!(s&&typeof s==='object'&&[].concat(s.urls).every(u=>typeof u==='string'&&/^(stun|turns?):[^\s]{3,200}$/.test(u))&&(s.username===undefined||typeof s.username==='string')&&(s.credential===undefined||typeof s.credential==='string'));
function relayIce(quiet){ return relayGet().then(r=>{ if(!r){ NET.ice=null; return; } if(NET.ice&&performance.now()-NET.iceAt<6e5) return;
  const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),6000); return fetch(r.url,{signal:ctl.signal,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'}).then(q=>q.ok?q.json():Promise.reject(new Error(q.status))).then(L=>{ if(L&&!Array.isArray(L)) L=[].concat(L.iceServers||[]); const ok=Array.isArray(L)?L.filter(iceOk).slice(0,8):[]; if(ok.length){ NET.ice=ok.map(s=>({urls:s.urls,username:s.username,credential:s.credential})); NET.iceAt=performance.now(); } }).catch(x=>{ NET.ice=null; if(!quiet) netStat('중계 서버 정보를 받지 못했다 · 직접 연결로 해 본다'); }).finally(()=>clearTimeout(to)); }); }
function ICE(){ if(NET.ice) return {config:{iceServers:NET.ice.concat([{urls:'stun:stun.l.google.com:19302'}])},debug:0}; return {config:{iceServers:[{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302','stun:stun2.l.google.com:19302']},{urls:'stun:stun.cloudflare.com:3478'}]},debug:0}; }
/* 이어진 길이 직접인지 중계인지 */
function linkKind(c,cb){ try{ c.peerConnection.getStats().then(st=>{ let pair=null; st.forEach(r=>{ if(r.type==='transport'&&r.selectedCandidatePairId) pair=st.get(r.selectedCandidatePairId); }); if(!pair) st.forEach(r=>{ if(r.type==='candidate-pair'&&r.state==='succeeded'&&(r.nominated||r.selected)) pair=pair||r; }); const loc=pair&&st.get(pair.localCandidateId); cb(loc?(loc.candidateType==='relay'?'중계':'직접'):''); }).catch(()=>cb('')); }catch(x){ cb(''); } }

/* ───────── 방장 ───────── */
/* 들어온 사람이 보낸 것: 꼴이 맞는 것만 받고, 한 사람이 1초에 보낼 수 있는 메시지 수를 묶는다(넘치면 버린다).
   계속 퍼부으면 false를 돌려 연결을 끊게 한다. 방 인원보다 많은 연결은 받지 않는다 */
const HOSTLIM=new Map(),CAPS={hello:2,bye:2,quit:2,pick:8,rdy:6,pdone:4,twv:6,pz:8,tag:8,chat:4};
const pidOkH=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{6,64}$/.test(v)&&!(v in Object.prototype);
function hostIn(pid,d){ if(!pidOkH(pid)) return; const t=performance.now(); let L=HOSTLIM.get(pid); if(!L){ if(HOSTLIM.size>64) for(const k of [...HOSTLIM.keys()]) if(!NET.players.some(p=>p.pid===k)) HOSTLIM.delete(k); L={t:0,n:0,bad:0,k:{},late:{}}; HOSTLIM.set(pid,L); }
  if(t-L.t>1000){ L.t=t; L.n=0; L.k={}; } if(++L.n>120){ return ++L.bad>1200?false:undefined; }
  if(!d||typeof d!=='object'||Array.isArray(d)||typeof d.t!=='string'||d.t.length>8) return;
  /* 종류마다 1초에 받는 수를 따로 묶는다. 고르기 · 준비는 넘치면 마지막 것만 조금 뒤에 받는다 */
  if(hasK(CAPS,d.t)&&(L.k[d.t]=(L.k[d.t]||0)+1)>CAPS[d.t]){ if(d.t==='pick'||d.t==='rdy'||d.t==='pdone'){ const was=L.late[d.t]; L.late[d.t]=d; if(!was) setTimeout(()=>{ const x=L.late[d.t]; L.late[d.t]=null; if(x&&NET.host) try{ hostMsg(pid,x); }catch(e){} },Math.max(50,1020-(t-L.t))); } return; }
  try{ hostMsg(pid,d); }catch(x){ console.error('받은 메시지를 처리하지 못했다',d.t,x&&x.message); } }
function hostOpen(code){ return new Promise((ok,no)=>{
  if(NET.bc){ const ch=new BroadcastChannel(ROOM(code)); ch.onmessage=ev=>{ const m=ev.data; if(m&&m.to==='host'&&typeof m.from==='string') hostIn(m.from,m.d); }; NET.tx={send:(pid,d)=>ch.postMessage({to:pid,d}),close:()=>ch.close()}; return ok(); }
  Promise.all([loadPeer(),relayIce()]).then(()=>{ const peer=new Peer(ROOM(code),ICE()),conns=new Map(),all=new Set(); let done=false;
    peer.on('open',()=>{ done=true; NET.tx={send:(pid,d)=>{ const c=conns.get(pid); if(c&&c.open){ try{ c.send(d); }catch(x){} } },close:()=>{ try{ peer.destroy(); }catch(x){} }}; NET.drop=pid=>{ const c=conns.get(pid); if(c) try{ c.close(); }catch(x){} }; ok(); });
    /* 들어오는 연결 검사: 주소(id) 꼴 · 같은 주소로 이미 이어진 연결 · 주고받는 방식(json) · 연결 수(12). 8초 안에 인사(hello)가 없으면 끊는다.
       메시지는 그 주소의 '지금 연결'에서 온 것만 받는다(같은 주소를 가로챈 두 번째 연결은 막힌다) */
    peer.on('connection',c=>{ const id=c.peer; if(!pidOkH(id)||!/^[A-Za-z0-9-]+$/.test(id)||c.serialization!=='json'||all.size>=12||[...all].some(x=>x.peer===id)){ try{ c.close(); }catch(x){} return; }
      all.add(c); const t0=setTimeout(()=>{ if(!NET.players.some(p=>p.pid===id)) try{ c.close(); }catch(x){} },8000);
      c.on('open',()=>conns.set(id,c)); c.on('data',d=>{ if(conns.get(id)!==c) return; if(hostIn(id,d)===false) try{ c.close(); }catch(x){} });
      const gone=()=>{ clearTimeout(t0); all.delete(c); if(conns.get(id)===c){ conns.delete(id); hostGone(id); } };
      c.on('close',gone); c.on('error',e=>{ if(e&&/message-too-big|not-open-yet/.test(e.type||'')) return; gone(); }); });
    peer.on('disconnected',()=>{ try{ peer.reconnect(); }catch(x){} });
    peer.on('error',e=>{ if(!done) no(e); else netStat('연결 오류: '+(e.type||e.message)); }); }).catch(no); }); }
const others=()=>NET.players.filter(p=>!p.host);
function sendAll(d){ if(NET.tx) for(const p of others()) NET.tx.send(p.pid,d); }
function lobbyOut(){ /* 뒤의 판에서 통째로 바꿨다. 이 몸통은 쓰지 않는다 */ }
/* ───────── 메시지 처리기 모음 ─────────
   예전에는 판(버전)마다 hostMsg · clientMsg를 한 겹씩 감쌌다. 이제는 판 파일마다 onMsg로 등록하고 여기서 차례로 돌린다.
   순서는 예전 감싸기와 같다: 앞 처리(pre)는 나중에 등록한 것부터 돌고, true를 돌려주면 거기서 멈춘다(안쪽 처리 · 기본 처리를 건너뛴다).
   뒤 처리(post)는 멈춘 자리보다 바깥(나중 등록)인 것만, 먼저 등록한 것부터 돈다. 멈추지 않았으면 기본 처리 뒤에 모두 돈다 */
const MSGL={host:[],client:[]};
function onMsg(side,h){ MSGL[side].push(h); }
function runMsg(L,base,a,b){ let k=L.length-1; for(;k>=0;k--){ const f=L[k].pre; if(f&&f(a,b)===true) break; } if(k<0) base(a,b); for(let j=k+1;j<L.length;j++){ const f=L[j].post; if(f) f(a,b); } }
function hostMsg(pid,d){ runMsg(MSGL.host,hostBase,pid,d); }
function clientMsg(d){ runMsg(MSGL.client,clientBase,d); }
/* 방장의 기본 처리: 들어온 사람이 보낸 것 */
function hostBase(pid,d){ if(!NET.host||!d) return; let p=NET.players.find(x=>x.pid===pid);
  if(d.t==='pg'){ const ow=!NET.live&&over&&over.winner?over.winner:null; NET.tx.send(pid,{t:'pg',ts:d.ts,lv:NET.live?1:0,ow:ow?ow.id:0,owt:ow?ow.team:-1}); return; }
  if(d.t==='pz'){ if(p){ const m={t:'pz',who:pid,name:p.name||'손님',on:!!d.on}; for(const q of others()) if(q.pid!==pid) NET.tx.send(q.pid,m); pzShow(m); } return; }
  if(d.t==='chat'){ const t=performance.now(),text=cleanText(d.text,80); if(p&&text&&!(t-(p.chatT||0)<600)){ p.chatT=t; const m={t:'chat',name:p.name||'손님',team:p.team,text,pid}; sendAll(m); chatShow(m); } return; }   /* 채팅은 0.6초에 한 번까지 */
  if(d.t==='hello'){ const bye=(why)=>{ NET.tx.send(pid,{t:'bye',why,final:1}); setTimeout(()=>{ if(NET.drop) NET.drop(pid); },400); };
    if(d.v!==APPV) return bye('서로 판이 다르다 (방장 v'+APPV+', 나 v'+(+d.v||'?')+'). 둘 다 새로고침한 뒤 다시 들어온다');
    const tk=typeof d.tok==='string'&&/^[A-Za-z0-9]{8,32}$/.test(d.tok)?d.tok:''; if(tk&&NET.ban&&NET.ban.has(tk)) return bye('방장이 내보낸 방이다');
    if(!p){ if(NET.players.length>=10) return bye('방이 가득 찼다'); p={pid,name:'',key:'ei',re:false,team:others().length%2?0:1,tok:tk||newTok()}; NET.players.push(p); }
    p.name=uniqName(cleanName(d.name)||'손님',p); if(okKey(d.key)){ p.key=d.key; p.re=!!d.re; } lobbyOut(); if(NET.live) reseat(p); return; }
  if(!p) return;
  if(d.t==='pick'){ if(okKey(d.key)){ p.key=d.key; p.re=!!d.re; } if(d.team===0||d.team===1) p.team=d.team; if(d.name) p.name=uniqName(cleanName(d.name)||p.name||'손님',p); lobbyOut(); }
  else if(d.t==='bye') hostGone(pid);
  else if(d.t==='in'||d.t==='cast'){ const e=ents.find(o=>o.net&&o.net.pid===pid); if(!e||!NET.live) return;
    const f1=v=>{ v=+v; return Number.isFinite(v)?Math.max(-1,Math.min(1,v)):0; },vec=a=>Array.isArray(a)?[f1(a[0]),f1(a[1])]:null,dir=a=>a&&Math.hypot(a[0],a[1])>.05?norm(a[0],a[1]):null;   /* 조준 · 이동 값은 -1~1의 유한한 수만 */
    if(d.t==='in'){ const m=vec(d.mv)||[0,0],L=Math.hypot(m[0],m[1]); e.net.mv=L>1?{x:m[0]/L,y:m[1]/L}:{x:m[0],y:m[1]}; e.net.held.b=!!d.hb; e.net.aim=dir(vec(d.aim)); }
    else if(!e.dead&&!over&&typeof d.s==='string'&&/^(b|jump|n1|n2|aw|ult|crouch|x[1-4])$/.test(d.s)){ const a=dir(vec(d.aim)); if(a&&canAct(e)){ e.aim=a; e.aimLock=now+1; e.aimMan=now+.12; } NET.castNet=true; try{ cast(e,d.s); } finally { NET.castNet=false; } } } }
/* 양쪽에 모두 있는 캐릭터만 고를 수 있다(조합·카드로 만든 캐릭터, 보스, 적은 안 된다) */
const okKey=k=>typeof k==='string'&&hasK(CH,k)&&!CH[k].re&&!CH[k].built&&!CH[k].custom&&!CH[k].mon&&!CH[k].mob&&!CH[k].kit;
function hostGone(pid){ const i=NET.players.findIndex(x=>x.pid===pid&&!x.host); if(i<0) return; const p=NET.players[i]; NET.players.splice(i,1); for(const e of ents) if(e.net&&e.net.pid===pid){ e.net=null; e.left=p.tok||('~'+pid); e.pname=null; } if(NET.drop) NET.drop(pid);
  /* 같은 자리 표로 먼저 다시 들어와 기다리던 사람이 있으면, 이 자리를 바로 넘긴다 */ if(NET.live&&p.tok){ const twin=NET.players.find(x=>x.tok===p.tok&&x.pid!==pid&&!x.host&&!ents.some(o=>o.net&&o.net.pid===x.pid)); if(twin) setTimeout(()=>{ if(NET.players.includes(twin)) reseat(twin); },0); }
  if(NET.host){ lobbyOut(); if(NET.live) toast((p.name||'손님')+' 연결이 끊겼다 · 컴퓨터가 대신 움직인다'); } }
/* 싸우는 도중 끊겼다 다시 들어온 사람은 제 캐릭터를 돌려받는다 */
function reseat(p){ const e=ents.find(o=>o.left&&p.tok&&o.left===p.tok&&!o.net); if(!e) return; e.net={pid:p.pid,mv:{x:0,y:0},held:{},aim:null}; e.pname=p.name; e.left=null; p.eid=e.id; NET.known=new Set(); NET.n=0; NET.mSig=''; const mapKey=Object.keys(MAPS).find(k=>MAPS[k]===MAP)||'basic'; NET.tx.send(p.pid,{t:'start',mode,teamN,map:mapKey,land:LAND,W,H,you:e.id,team:e.team,cap:CAPGOAL,diff,mon:mode===6?OPT.mon:''}); toast((p.name||'손님')+' 다시 들어왔다'); }
/* 판을 만든 직후: 들어온 사람들을 자기 편의 컴퓨터 자리에 꽂는다(상대 편은 '상대' 칸부터). 자리가 없으면 다른 편, 그래도 없으면 구경 */
NET.afterSpawn=()=>{ if(me&&NET.players.length>1) me.pname=NET.name(); for(const p of others()){ p.eid=0; const seat=tm=>ents.filter(o=>o.team===tm&&o!==me&&!o.net&&!o.c.mon).sort((a,b)=>(a.slot||0)-(b.slot||0))[0],o=seat(p.team)||seat(1-p.team); if(!o) continue;
    const key=p.re&&CH[p.key+'_r']?p.key+'_r':p.key,n=mk(key,o.team,o.x,o.y); n.slot=o.slot; n.busy=o.busy; n.net={pid:p.pid,mv:{x:0,y:0},held:{},aim:null}; n.pname=p.name; ents[ents.indexOf(o)]=n; if(o===foe) foe=n; p.eid=n.id; } };
NET.start=()=>{ NET.live=others().length>0; NET.acc=0; NET.n=0; NET.known=new Set(); NET.mSig=''; for(const f of floats) f._s=0; NET.ev={h:[],k:[],c:[]}; if(!NET.live) return; const mapKey=Object.keys(MAPS).find(k=>MAPS[k]===MAP)||'basic';
  for(const p of others()){ const e=ents.find(o=>o.id===p.eid); NET.tx.send(p.pid,{t:'start',mode,teamN,map:mapKey,land:LAND,W,H,you:p.eid||0,team:e?e.team:(p.team===0?0:1),cap:CAPGOAL,diff,mon:mode===6?OPT.mon:''}); } snap(); };
/* 보내는 양 줄이기: 자리·체력처럼 늘 바뀌는 것만 매번 보내고, 이름·최대 체력·상태 줄처럼 잘 안 바뀌는 것은 세 번에 한 번만 보낸다.
   피해 숫자·기록 줄은 새로 생긴 것만 보낸다. 5대5에서 손님 한 명당 초당 93KB쯤 나가던 것이 3분의 1쯤으로 준다 */
function entS(e,full,mid){ const o={id:e.id,key:e.key,team:e.team,x:r2(e.x),y:r2(e.y),z:r2(e.z),hp:r2(e.hp),max:e.max,atk:e.atk,dead:!!e.dead,aim:[r2(e.aim.x),r2(e.aim.y)],busy:r2(e.busy),chant:r2(e.chant),slot:e.slot||0,
    st:e.st.map(s=>({k:s.k,until:r2(s.until),v:typeof s.v==='number'||typeof s.v==='string'?s.v:undefined,d0:typeof s.d0==='number'?r2(s.d0):undefined})),sh:e.sh.map(s=>({v:r2(s.v),until:r2(s.until)})),cd:{}};
  for(const k in e.cd) if(e.cd[k]>0) o.cd[k]=r2(e.cd[k]); if(e.dash) o.dash=[r2(e.dash.vx),r2(e.dash.vy),r2(e.dash.until)]; if(e.castFx) o.cf=[r2(e.castFx.t0),e.castFx.ult?1:0]; if(e.flash!==undefined) o.fl=r2(e.flash); if(e.swingT!==undefined){ o.sw=r2(e.swingT); o.sn=e.swingN||0; } if(e.shotT!==undefined) o.so=r2(e.shotT);
  if(e.ultUsed) o.uu=1; if(e.boss) o.boss=1; if(e.launched) o.la=1; if(e.sand) o.sand=1; if(e.tag) o.tag=[e.tag.n,r2(e.tag.t0)]; if(e.pname) o.pn=e.pname;
  if(mid) try{ o.r=ser(e.r,0); o.hud=e.c.hud(e); o.sl=stateList(e); const cn={}; for(const s in e.c.skills){ const k=e.c.skills[s]; if(k.can) cn[s]=!!k.can(e); } o.can=cn; }catch(x){}
  if(full){ o.dealt={}; for(const k in e.dealt) o.dealt[k]=Math.round(e.dealt[k]); } if(!mid){ for(const k of ['key','team','max','atk','slot','uu','boss','sand','pn','cd']) delete o[k]; } return o; }
function snap(){ if(!NET.live||!NET.tx) return; const full=NET.n++%15===0||!!over,mid=full||NET.n%4===0,ev=NET.ev; NET.ev={h:[],k:[],c:[]}; const K=NET.known||(NET.known=new Set());
  const nf=floats.filter(f=>!f._s),fl=nf.map(plain); nf.forEach(f=>{ f._s=1; }); const ms=msgs.length+':'+(msgs.length?msgs[msgs.length-1].t0:0)+':'+procs.length+':'+(procs.length?procs[procs.length-1].t0:0),chg=full||ms!==NET.mSig; NET.mSig=ms;
  sendAll(fitS({t:'s',n:r2(now),e:ents.map(e=>{ const m2=mid||!K.has(e.id); K.add(e.id); return entS(e,full,m2); }),p:projs.map(plain),f:fx.map(plain),z:zones.filter(z=>!z.hid).map(plain),w:walls.map(plain),fl,m:chg?msgs:undefined,pr:chg?procs:undefined,sc:score,cp:cap,dc:mode===6&&typeof raidDC==='number'?raidDC:undefined,ft:feats.map(plain),ch:[r2(chaosUntil),chaosName],ov:over?{w:over.winner?over.winner.id:0,t:r2(over.t)}:0,ev,tg:typeof tagNet==='function'?tagNet():undefined})); }
/* PeerJS는 한 메시지가 16,300바이트(UTF-8)를 넘으면 오류만 내고 보내지 않는다. 넘을 것 같으면 꾸밈(떠다니는 숫자 · 효과 · 기록)부터 덜어 낸다 */
const ENC=typeof TextEncoder!=='undefined'?new TextEncoder():null;
function fitS(S){ if(!ENC) return S; const sz=()=>ENC.encode(JSON.stringify(S)).byteLength,LIM=15000; if(JSON.stringify(S).length*3<LIM||sz()<LIM) return S;
  for(const k of ['fl','pr','f','m']){ if(S[k]===undefined) continue; if(k==='m'||k==='pr'){ S[k]=undefined; NET.mSig=''; } else S[k]=[]; if(sz()<LIM) return S; }
  for(const k of ['p','z','w']){ if(Array.isArray(S[k])&&S[k].length>6){ S[k]=S[k].slice(0,6); if(sz()<LIM) return S; } }
  if(Array.isArray(S.e)) for(const e of S.e) if(e&&e.dealt&&!S.ov) delete e.dealt; return S; }
on('step',dt=>{ if(!NET.live) return; NET.acc+=dt; if(NET.acc>=1/NET.HZ){ NET.acc=0; snap(); } });
on('end',()=>{ if(NET.live){ snap(); NET.live=false; } });
on('hit',(s,t,amt,label,o)=>{ if(NET.live&&NET.ev.h.length<80) NET.ev.h.push([s.id,t.id,r2(amt),label,(o&&o.basic?1:0)|(o&&o.skill?2:0)|(o&&o.fixed?4:0)|(PH?8:0)]); });
on('kill',(s,t)=>{ if(NET.live) NET.ev.k.push([s.id,t.id]); });
on('cast',(e,slot)=>{ if(NET.live) NET.ev.c.push([e.id,slot]); });

/* ───────── 들어온 쪽 ───────── */
function joinOpen(code){ return new Promise((ok,no)=>{
  if(NET.bc){ const pid='p'+Math.random().toString(36).slice(2,10).padEnd(8,'0'),ch=new BroadcastChannel(ROOM(code)); ch.onmessage=ev=>{ const m=ev.data; if(m&&m.to===pid) clientMsg(m.d); }; NET.pid=pid; NET.tx={send:d=>ch.postMessage({to:'host',from:pid,d}),close:()=>ch.close()}; return ok(); }
  Promise.all([loadPeer(),relayIce()]).then(()=>{ const peer=new Peer(ICE()); let done=false; const fail=e=>{ if(!done){ done=true; try{ peer.destroy(); }catch(x){} no(e); } },to=setTimeout(()=>fail(new Error('방을 찾지 못했다')),15000);
    peer.on('open',id=>{ NET.pid=id; const c=peer.connect(ROOM(code),{reliable:true,serialization:'json'});
      c.on('open',()=>{ clearTimeout(to); done=true; NET.tx={send:d=>{ if(c.open){ try{ c.send(d); }catch(x){} } },close:()=>{ try{ peer.destroy(); }catch(x){} }}; setTimeout(()=>linkKind(c,k=>{ NET.kind=k; drawNet(); }),1500); ok(); });
      c.on('data',d=>{ try{ clientMsg(d); }catch(x){ console.error('방장 메시지를 처리하지 못했다',d&&d.t,x&&x.message); } }); c.on('close',()=>{ if(NET.tx) clientLost('방장과 연결이 끊겼다',true); }); c.on('error',e=>{ if(e&&/message-too-big|not-open-yet/.test(e.type||'')) return; if(NET.tx) clientLost('연결 오류',true); }); });
    peer.on('error',e=>{ clearTimeout(to); if(!done) fail(new Error(e.type==='peer-unavailable'?'그 코드의 방이 없다':(e.type||e.message))); }); }).catch(no); }); }
/* 손님의 기본 처리: 방장이 보낸 것 */
function clientBase(d){ if(!NET.client||!d) return; NET.seen=performance.now(); if(d.t==='pg'){ NET.rtt=Math.round(performance.now()-d.ts); if(!NET.playing) drawNet(); return; } if(d.t==='bye'&&d.final){ NET.retry=9; } if(d.t==='lobby'){ NET.players=d.players; NET.code=d.code; drawNet(); } else if(d.t==='start') clientStart(d); else if(d.t==='s'){ if(NET.playing) apply(d); } else if(d.t==='pz'){ pzShow(d); } else if(d.t==='chat'){ chatShow(d); } else if(d.t==='tw'){ if(typeof coopInfo==='function') coopInfo(d); } else if(d.t==='bye') clientLost(d.why||'방이 닫혔다'); }
/* 들어가기(다시 잇기 포함) */
/* 이어 주는 서버(PeerJS)가 가끔 한 번에 안 붙는다. 망 쪽 오류면 두 번까지 조용히 다시 해 본다 */
const netFlaky=x=>/network|server-error|socket|disconnected|찾지 못했다|Lost connection/i.test(String((x&&(x.type||x.message))||''));
async function joinFlow(code,again,tries){ netStat(again?'다시 잇는 중…':tries?'다시 들어가 보는 중… ('+(tries+1)+'번째)':'들어가는 중…'); try{ NET.client=true; await joinOpen(code); NET.code=code; patchClient(); NET.seen=performance.now(); NET.tx.send({t:'hello',v:APPV,name:NET.name(),key:okKey(sel.me)?sel.me:'ei',re:!!(sel.meR&&CH[sel.me+'_r']),tok:tokOf(code)}); if(!okKey(sel.me)) toast('만든 캐릭터는 함께에서 쓸 수 없어 에이로 들어갔다. 캐릭터를 다시 고른다',3600); netStat(again?'다시 이어졌다.':'들어왔다. 고르는 화면에서 캐릭터를 고르고 방장을 기다린다.'); if(!again) NET.retry=0; drawNet(); return true; }catch(x){ NET.client=false; NET.tx=null; if(netFlaky(x)&&(tries||0)<2){ await new Promise(r=>setTimeout(r,900)); return joinFlow(code,again,(tries||0)+1); } netStat((again?'다시 잇지 못했다: ':'들어가지 못했다: ')+((x&&x.message)||'알 수 없음')+(/ice|negotiation|찾지/i.test((x&&x.message)||'')?' · 두 기기가 서로 직접 닿지 못하는 것일 수 있다. 같은 와이파이에서 해 보거나 아래 중계 서버를 적는다':'')); drawNet(); return false; } }
function clientLost(why,canRetry){ if(!NET.client) return; if(canRetry&&(NET.retry||0)<2&&NET.code){ const code=NET.code; NET.retry=(NET.retry||0)+1; const was=running,tmp=NET.temp,sm=sel.me,smR=sel.meR; netLeave(true); NET.temp=tmp; sel.me=sm; sel.meR=smR; if(was){ running=false; $('menu').style.display='none'; $('sel').hidden=false; drawSel(); goPage('net'); } joinFlow(code,true); return; } netLeave(true); netStat(why); if(running){ running=false; $('menu').style.display='none'; } $('res').hidden=true; $('pause').hidden=true; $('sel').hidden=false; drawSel(); goPage('net'); }
/* 받은 상태로 그리려면 캐릭터의 셈(상태 줄·단추 조건·겉 꾸밈)이 방장 쪽 값에 기대야 한다. 들어가 있는 동안만 바꿔 끼우고, 나가면 되돌린다 */
function patchClient(){ if(NET.orig) return; const O=NET.orig={stateList,hud:{},can:[],aura:{},res:{}}; stateList=e=>e.slS||[];
  for(const k in CH){ const c=CH[k]; O.hud[k]=c.hud; c.hud=e=>e.hudS!==undefined?e.hudS:''; for(const s in c.skills){ const sk=c.skills[s]; if(sk.can){ O.can.push([sk,sk.can]); sk.can=e=>!e.canS||e.canS[s]!==false; } } }
  for(const k in AURA){ const f=AURA[k]; O.aura[k]=f; AURA[k]=(e,by)=>{ try{ f(e,by); }catch(x){} }; }
  for(const k in RES){ const R0=RES[k]; O.res[k]=R0; const W={}; for(const m in R0){ const f=R0[m]; W[m]=typeof f==='function'?e=>{ try{ return f(e); }catch(x){ return 0; } }:f; } RES[k]=W; } }
function unpatchClient(){ const O=NET.orig; if(!O) return; NET.orig=null; stateList=O.stateList; for(const k in O.hud) CH[k].hud=O.hud[k]; for(const [sk,f] of O.can) sk.can=f; for(const k in O.aura) AURA[k]=O.aura[k]; for(const k in O.res) RES[k]=O.res[k]; }
function clientStart(d){ floats=[]; practice=false; mode=d.mode; teamN=d.teamN; LAND=!!d.land; MAP=hasK(MAPS,d.map)?MAPS[d.map]:MAPS.basic; W=Math.min(200,Math.max(8,+d.W||(LAND?MAP.h:MAP.w)||26)); H=Math.min(200,Math.max(8,+d.H||(LAND?MAP.w:MAP.h)||38)); NET.you=d.you; NET.flip=d.team===1; NET.em.clear(); NET.first=true; NET.playing=true;
  loop.err=null; bgmStop(); chaosUntil=0; banner=null; mini=null; parts=[]; shake=0; procs=[]; msgs=[]; projs=[]; fx=[]; floats=[]; zones=[]; walls=[]; feats=[]; Q=[]; ents=[]; over=null; paused=false; score=[0,0]; cap=[0,0]; now=0; draw.k=9; me=null; foe=null;
  $('info').hidden=true; $('pause').hidden=true; netStat(''); if(window.pzReset) pzReset(); if(typeof d.diff==='number') NET.hdiff=d.diff; NET.hmon=d.mon||''; }
/* 방장 쪽 말로 적힌 기록(우리 · 상대)을 내 쪽 말로 뒤집는다(내가 상대 편일 때) */
const PVW=[['상대 팀','우리 팀'],['상대 남은 캐릭터','우리 남은 캐릭터'],['상대 교대 · ','교대 · ']];
function pv(s){ s=String(s==null?'':s); if(!NET.flip) return s; for(const [a,b] of PVW){ if(s===a){ return b; } if(s===b){ return a; } } return s.replace(/상대 팀|우리 팀|상대 남은 캐릭터|우리 남은 캐릭터/g,x=>{ for(const [a,b] of PVW){ if(x===a) return b; if(x===b) return a; } return x; }); }
function apply(S){ const E=NET.em,seen=new Set(); now=S.n; const list=[];
  const N=v=>Number.isFinite(+v)?+v:0;
  for(const s of S.e){ if(!s||typeof s!=='object') continue; if(s.key!==undefined&&!hasK(CH,s.key)) s.key='ei'; for(const k of ['x','y','z','hp','max','atk','slot','team']) if(k in s) s[k]=N(s[k]); if(s.key!==undefined) s.aim=Array.isArray(s.aim)?[N(s.aim[0]),N(s.aim[1])]:[0,0]; if('st' in s&&!Array.isArray(s.st)) s.st=[]; if('sh' in s&&!Array.isArray(s.sh)) s.sh=[]; if('pn' in s) s.pn=s.pn?cleanName(s.pn):null; let e=E.get(s.id); if(s.key===undefined){ if(!e) continue; s.key=e.key; s.team=e.teamRaw; s.max=e.max; s.atk=e.atk; s.slot=e.slot; s.uu=e.ultUsed; s.boss=e.boss; s.sand=e.sand; s.pn=e.pname; s.r=e.r; s.hud=e.hudS; s.sl=e.slS; s.can=e.canS; } const fresh=!e||e.key!==s.key; if(fresh){ e={id:s.id,x:s.x,y:s.y,mv:{x:0,y:0},ai:{},dealt:{},r:{},cd:{}}; E.set(s.id,e); } seen.add(s.id);
    e.key=s.key; e.c=hasK(CH,s.key)?CH[s.key]:CH.ei; e.teamRaw=s.team; e.team=tf(s.team); e.tx=s.x; e.ty=s.y; if(Math.hypot(e.x-s.x,e.y-s.y)>3){ e.x=s.x; e.y=s.y; } e.z=s.z; e.vz=0; e.hp=s.hp; e.max=s.max; e.atk=s.atk; e.dead=s.dead; e.aim={x:s.aim[0],y:s.aim[1]}; e.busy=s.busy; e.chant=s.chant; e.slot=s.slot; e.st=s.st; e.sh=s.sh;
    if(s.cd||!e.cd||!('b' in e.cd)){ e.cd={b:0,n1:0,n2:0,aw:0,ult:0,crouch:0,x1:0,x2:0,x3:0,x4:0}; Object.assign(e.cd,s.cd||{}); } e.dash=s.dash?{vx:s.dash[0],vy:s.dash[1],until:s.dash[2]}:null; e.castFx=s.cf?{t0:s.cf[0],ult:!!s.cf[1]}:null; e.flash=Math.max(e.flash||-9,s.fl===undefined?-9:s.fl); e.swingT=s.sw; e.swingN=s.sn; e.shotT=s.so;
    e.ultUsed=!!s.uu; e.boss=!!s.boss; e.launched=!!s.la; e.sand=!!s.sand; e.tag=s.tag?{n:s.tag[0],t0:s.tag[1]}:null; e.pname=s.pn||null; e.r=s.r||{}; e.hudS=s.hud||''; e.slS=s.sl||[]; e.canS=s.can||null; if(s.dealt) e.dealt=s.dealt; list.push(e); }
  for(const id of [...E.keys()]) if(!seen.has(id)) E.delete(id);
  ents=list; me=E.get(NET.you)||list.find(e=>e.team===0)||list[0]; pickFoe();
  projs=S.p.map(unplain).filter(p=>p.owner); for(const p of projs) p.hit=new Set(); fx=S.f.map(unplain); zones=S.z.map(unplain).filter(z=>z.owner); walls=S.w.map(unplain);
  floats=floats.filter(f=>now-f.t0<.9).concat(S.fl.map(f=>{ unplain(f); if(f.kd&&f.own) f.col=(f.own.team===0?HURTCOL:NUMCOL)[f.kd]; return f; }));
  const sw=c=>!NET.flip?c:c==='rgb('+TC[0]+')'?'rgb('+TC[1]+')':c==='rgb('+TC[1]+')'?'rgb('+TC[0]+')':c; if(S.m) msgs=S.m.map(m=>({seg:m.seg.map(x=>[pv(x[0]),sw(x[1])]),team:tf(m.team),big:m.big,t0:m.t0})); if(S.pr) procs=S.pr.map(q=>Object.assign({},q,{team:tf(q.team)}));
  if(S.dc!==undefined&&typeof raidDC==='number') raidDC=S.dc; score=NET.flip?[S.sc[1],S.sc[0]]:S.sc.slice(); cap=NET.flip?[S.cp[1],S.cp[0]]:S.cp.slice(); feats=S.ft.map(f=>{ if(f.t==='cap'&&NET.flip&&(f.own===0||f.own===1)) f.own=1-f.own; f.solid=!!(FEAT[f.t]&&FEAT[f.t].solid); return f; }); chaosUntil=S.ch[0]; chaosName=S.ch[1];
  if(NET.first&&me){ NET.first=false; OPT.raid=me.boss?'boss':'hero'; uiBegin(); $('sel').hidden=true; $('res').hidden=true; $('menu').style.display='block'; if(!running){ running=true; fit(); fire('begin'); last=performance.now(); requestAnimationFrame(loop); } else { fit(); fire('begin'); } }
  /* 방장 쪽에서 일어난 일을 여기서도 한 번씩 울린다: 타격 이펙트·소리·진동 */
  const ev=S.ev; if(ev&&me){ for(const h of ev.h){ const s=E.get(h[0]),t=E.get(h[1]); if(!s||!t) continue; const f=h[4]; hitFx(s,t,h[2]); if(s===me||t===me||ents.length<=2) sfx('hit',h[2]>=25); if(h[2]>=25){ shake=Math.max(shake,.28); if(t===me) buzz(30); } PH=!!(f&8); try{ fire('hit',s,t,h[2],h[3],{basic:!!(f&1),skill:!!(f&2),fixed:!!(f&4)}); } finally { PH=false; } }
    for(const k of ev.k){ const s=E.get(k[0]),t=E.get(k[1]); if(!t) continue; burst(t.x,t.y,36,'rgb('+TC[t.team]+')',9); shake=.6; sfx('kill'); buzz(120); if(s) fire('kill',s,t); }
    for(const c of ev.c){ const e=E.get(c[0]); if(!e) continue; const k=e.c.skills[c[1]]; if(!k) continue; if(c[1]==='ult'){ sfx('ult'); burst(e.x,e.y,40,'#e3c377',8); if(e===me){ banner={who:e.c.name,skill:k.name,team:e.team,t0:performance.now(),e}; shake=.4; } else mini={who:short(e),skill:k.name,team:e.team,t0:performance.now()}; } else if(k.cd>=1) castSnd(e,c[1]); fire('cast',e,c[1],k); } }
  if(S.ov&&!over){ over={winner:E.get(S.ov.w)||null,t:S.ov.t}; setTimeout(()=>{ if(NET.client&&over){ NET.playing=false; showResult(); } },900); } }
function pickFoe(){ if(!me) return; const L=ents.filter(o=>o.team!==me.team); const f=L.filter(o=>!o.dead).sort((a,b)=>dist(me,a)-dist(me,b))[0]||L[0]||me; if(f!==foe){ foe=f; const el=$('hb-foe').querySelector('.nm'); if(el) el.textContent=foe.c.name; } }
/* 받은 상태 사이사이를 부드럽게 잇고, 내 조작을 보낸다 */
NET.frame=dt=>{ if(!me) return; if(NET.hp) dt=0;   /* 방장이 메뉴를 연 동안에는 이쪽 시계도 세운다 */ now+=dt; const k=Math.min(1,(dt||.016)*16); for(const e of ents){ if(e.tx!==undefined){ e.x+=(e.tx-e.x)*k; e.y+=(e.ty-e.y)*k; } for(const c in e.cd) if(e.cd[c]>0) e.cd[c]=Math.max(0,e.cd[c]-dt); }   /* 대기시간은 받은 값 사이를 여기서 센다 */ for(const p of projs){ p.x+=p.vx*dt; p.y+=p.vy*dt; }
  if(mAim&&!me.dead) mouseAim(); const t=performance.now(); if(t-NET.lastIn>33&&NET.tx){ NET.lastIn=t; NET.tx.send({t:'in',mv:[r2(stick.x),r2(stick.y)],hb:!!held.b&&!paused,aim:mAim?[r2(me.aim.x),r2(me.aim.y)]:0}); }
  if(!paused&&!over) for(const s in held) if(held[s]&&s!=='b') NET.cast(s); };
NET.cast=slot=>{ if(!NET.tx||!me||over) return; const t=performance.now(); if(t-(NET.lastC[slot]||0)<90) return; NET.lastC[slot]=t; NET.tx.send({t:'cast',s:slot,aim:(me.aimMan>now||mAim)?[r2(me.aim.x),r2(me.aim.y)]:0}); };
NET.wait=()=>{ toast('방장이 싸우기를 누르면 함께 시작한다.'); };
NET.pick=()=>{ if(NET.host&&NET.tx) lobbyOut(); else if(NET.client&&NET.tx){ const me0=NET.players.find(p=>p.pid===NET.pid); if(!okKey(sel.me)) return toast('만든 캐릭터는 함께에서 쓸 수 없다'); NET.tx.send({t:'pick',key:sel.me,re:!!(sel.meR&&CH[sel.me+'_r']),name:NET.name(),team:me0?me0.team:undefined,tag:[sel.al[0],sel.al[1]].filter(k=>k&&okKey(k))}); } };
NET.name=()=>cleanName($('n-name').value)||(NET.host?'방장':'손님');

/* ───────── 화면 ───────── */
function netStat(t){ $('n-stat').textContent=t||''; $('n-stat').style.display=t?'block':'none'; if(t&&(page!=='net'||$('sel').hidden)) toast(t,2800); }
function drawNet(){ const on=NET.host||NET.client; $('nav').querySelector('[data-p="net"]').classList.toggle('dot',on); $('n-off').hidden=on; $('n-on').hidden=!on; const bar=$('netbar'); bar.hidden=!on; $('start').textContent=NET.client?'방장을 기다리는 중':(practice?'연습 시작':'싸우기'); $('again').textContent=NET.client?'방장을 기다리는 중':'다시'; if(!on) return;
  $('n-role').textContent=NET.host?'내가 방장 · 이 코드를 알려 준다':'들어온 방'; $('n-code').textContent=NET.code; bar.textContent='방 '+NET.code+' · '+NET.players.length+'명'+(NET.host?' · 내가 방장':'')+(NET.client&&NET.rtt?' · '+NET.rtt+'ms':'')+(NET.client&&NET.kind?' · '+NET.kind:'');
  const mine=NET.players.find(p=>NET.host?p.host:p.pid===NET.pid); $('n-team').style.display=NET.host?'none':'flex'; $('n-team').previousElementSibling.style.display=NET.host?'none':'block'; $('n-team').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',!!mine&&+b.dataset.v===mine.team));
  $('n-list').innerHTML=NET.players.map(p=>{ const c=CH[p.re&&CH[p.key+'_r']?p.key+'_r':p.key]||CH.ei; return '<div class="pl t'+(p.team?1:0)+'"><b>'+esc(p.name||'손님')+(p.host?' (방장)':'')+(p===mine?' · 나':'')+'</b><span>'+c.name.split(', ')[1]+(c.re?' 재림':'')+'</span><span style="color:var(--muted)">'+(p.team?'상대 편':'방장 편')+'</span></div>'; }).join(''); }
function netLeave(quiet){ if(NET.tx){ if(!quiet){ try{ if(NET.host) sendAll({t:'bye',why:'방장이 방을 닫았다'}); else NET.tx.send({t:'bye'}); }catch(x){} } const tx=NET.tx; NET.tx=null; setTimeout(()=>{ try{ tx.close(); }catch(x){} },150); }
  for(const e of ents) if(e&&e.net){ e.net=null; } unpatchClient(); NET.host=false; NET.client=false; NET.live=false; NET.playing=false; NET.players=[]; NET.code=''; NET.flip=false; drawNet(); }
{ /* 방 코드: 헷갈리는 글자(0 O 1 I)를 뺀 32자 가운데 여섯 자. 남이 어림짐작으로 들어오기 어렵게 암호용 난수를 쓴다 */
  const CODE=()=>{ const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',r=new Uint8Array(6); try{ crypto.getRandomValues(r); }catch(x){ for(let i=0;i<6;i++) r[i]=Math.random()*256; } let s=''; for(let i=0;i<6;i++) s+=A[r[i]&31]; return s; };
  try{ $('n-name').value=localStorage.getItem('aetherName')||''; }catch(x){} $('n-name').addEventListener('change',()=>{ try{ localStorage.setItem('aetherName',cleanName($('n-name').value)); }catch(x){} NET.pick(); });
  $('n-host').onclick=async()=>{ if(NET.host||NET.client) return; NET.ban=new Set(); netStat('방을 여는 중…'); for(let i=0;i<3;i++){ const code=CODE(); try{ await hostOpen(code); NET.host=true; NET.code=code; NET.players=[{pid:'host',host:true,team:0,name:NET.name(),key:sel.me,re:false}]; if(practice) setMode(1); netStat('방을 열었다. 코드를 알려 주고, 다 모이면 고르는 화면에서 싸우기를 누른다.'); lobbyOut(); return; }catch(x){ if(netFlaky(x)&&i<2){ await new Promise(r=>setTimeout(r,900)); continue; } if(!(x&&x.type==='unavailable-id')){ netStat('방을 열지 못했다: '+((x&&(x.type||x.message))||'알 수 없음')); return; } } } netStat('방 코드를 얻지 못했다. 다시 눌러 본다.'); };
  $('n-join').onclick=async()=>{ if(NET.host||NET.client) return; const code=($('n-join-code').value||'').trim().toUpperCase(); if(code.length<4) return netStat('방 코드를 적는다.'); if(!/^[A-Z0-9]{4,6}$/.test(code)) return netStat('방 코드는 영문 · 숫자 4~6자다.'); netStat('들어가는 중…');
    NET.retry=0; joinFlow(code,false); };
  $('n-leave').onclick=()=>{ const cl=NET.client; netLeave(); netStat('방에서 나왔다.'); if(cl&&running){ running=false; $('menu').style.display='none'; $('sel').hidden=false; drawSel(); } };
  $('n-team').onclick=e=>{ const b=e.target.closest('button'); if(!b||!NET.client) return; const me0=NET.players.find(p=>p.pid===NET.pid); if(me0) me0.team=+b.dataset.v; NET.pick(); };
  /* 캐릭터를 바꾸면(저장될 때마다) 방에도 알린다 */
  const save0=save; save=function(){ if(!(NET.client&&NET.playing)) save0(); if(NET.host||NET.client) NET.pick(); };
  const sm0=setMode; setMode=function(m){ if(NET.client) return; if(NET.host&&m===0){ netStat('방을 열어 둔 동안에는 연습을 할 수 없다.'); return; } sm0(m); if(NET.host||NET.client) drawNet(); };
  addEventListener('pagehide',()=>{ if(NET.tx) netLeave(); });
  /* 살아 있는지 2초마다 묻는다. 8초 동안 아무 소식이 없으면 알리고, 15초면 끊긴 것으로 보고 다시 잇는다 */
  setInterval(()=>{ if(!NET.client||!NET.tx) return; NET.tx.send({t:'pg',ts:performance.now()}); const q=performance.now()-(NET.seen||0); if(q>15000) clientLost('방장에게서 소식이 없다',true); else if(q>8000) netStat('연결이 불안정하다 · 방장 기기의 화면이 꺼졌거나 다른 앱으로 넘어갔을 수 있다'); },2000);
  /* 방장 화면이 가려지면 싸움이 멈춘다(브라우저가 그리기를 멈춘다). 돌아오면 알린다 */
  document.addEventListener('visibilitychange',()=>{ if(NET.host&&NET.live&&!document.hidden) toast('돌아왔다 · 화면이 가려진 동안 싸움이 멈춰 있었다',3000); });
  /* 초대 링크: 주소 뒤에 ?room=코드. 받은 사람은 열기만 하면 들어간다 */
  const web=/^https?:$/.test(location.protocol),link=()=>location.origin+location.pathname+'?room='+NET.code;
  /* 예전 판에서 적어 둔 중계 서버 정보는 지운다(이제 사이트의 relay.json만 쓴다). 주소 뒤의 #r= · #t= 도 읽지 않고 지운다 */
  try{ localStorage.removeItem('aetherRelay'); localStorage.removeItem('aetherTurn'); }catch(x){}
  if(/[#&][rt]=/.test(location.hash)) try{ history.replaceState(null,'',location.pathname+location.search); }catch(x){}
  relayGet();
  $('n-share').onclick=async()=>{ if(!NET.code) return; const text=web?link():NET.code; try{ if(web&&navigator.share){ await navigator.share({title:'에테르',text:'에테르 방 '+NET.code,url:link()}); return; } }catch(x){ if(x&&x.name==='AbortError') return; } try{ await navigator.clipboard.writeText(text); toast(web?'초대 링크를 복사했다':'방 코드를 복사했다'); }catch(x){ toast('방 코드 '+NET.code+' 를 직접 알려 준다'); } };
  { const m=/[?&]room=([A-Za-z0-9]{4,6})/.exec(location.search); if(m){ $('n-join-code').value=m[1].toUpperCase(); try{ history.replaceState(null,'',location.pathname); }catch(x){} setTimeout(()=>{ goPage('net'); if(!NET.host&&!NET.client){ netStat('초대받은 방 '+m[1].toUpperCase()+' · 「들어가기」를 누르면 들어간다.'); toast('초대받은 방이다 · 「들어가기」를 누른다',3200); try{ $('n-join').focus(); }catch(x){} } },600); } }   /* 링크를 연 것만으로는 잇지 않는다(모르는 방에 저절로 붙지 않게) */
  if(!web) $('n-web').hidden=false;
  netStat(''); }

/* ───────── 채팅 (컴퓨터에서 T로 열고 Enter로 보낸다. 받는 것은 어느 기기에서나 보인다) ───────── */
{ const st=document.createElement('style'); st.textContent='#chat{position:fixed;left:12px;bottom:calc(96px + env(safe-area-inset-bottom));z-index:40;width:min(420px,70vw);pointer-events:none;display:flex;flex-direction:column;gap:3px}'
   +'#chat .cl{align-self:flex-start;max-width:100%;padding:4px 9px;border-radius:8px;background:rgba(6,9,23,.78);font:500 13px/1.35 var(--body);color:#eef1ff;overflow-wrap:anywhere;transition:opacity .4s}#chat .cl b{font-weight:800;margin-right:6px}#chat .cl.old{opacity:0}'
   +'#chat input{pointer-events:auto;height:36px;border:1px solid var(--aether);border-radius:8px;background:rgba(6,9,23,.92);color:var(--ink);font:14px var(--body);padding:0 10px;user-select:text;-webkit-user-select:text;outline:none;margin-top:4px}#chat input[hidden]{display:none}#chat .hint{font:11px var(--body);color:var(--muted);padding-left:2px}';
  document.head.appendChild(st); const box=document.createElement('div'); box.id='chat'; box.innerHTML='<div id="chat-log"></div><input id="chat-in" type="text" maxlength="80" placeholder="Enter 보내기 · Esc 닫기" autocomplete="off" hidden>'; document.body.appendChild(box);
  const inp=box.querySelector('#chat-in'),log=box.querySelector('#chat-log'); log.style.cssText='display:flex;flex-direction:column;gap:3px';
  const hist=[],line=(m,keep)=>{ const mine=NET.players.find(p=>NET.host?p.host:p.pid===NET.pid),same=mine?m.team===mine.team:m.team===0,el=document.createElement('div'); el.className='cl'+(keep?' keep':''); const b=document.createElement('b'); b.textContent=String(m.name||'').slice(0,13); b.style.color='rgb('+TC[same?0:1]+')'; el.appendChild(b); el.appendChild(document.createTextNode(String(m.text).slice(0,80))); return el; };
  /* 입력창을 열면 지난 채팅 열 줄이 다시 보인다 */
  const showHist=on=>{ log.querySelectorAll('.keep').forEach(x=>x.remove()); if(on){ log.querySelectorAll('.cl').forEach(x=>x.remove()); hist.forEach(m=>log.appendChild(line(m,true))); if(!hist.length){ const h=document.createElement('div'); h.className='cl keep'; h.style.color='var(--muted)'; h.textContent='아직 채팅이 없다'; log.appendChild(h); } } };
  window.chatShow=m=>{ if(!m||!m.text) return; hist.push(m); if(hist.length>10) hist.shift(); if(!inp.hidden){ showHist(true); return; } const mine=NET.players.find(p=>NET.host?p.host:p.pid===NET.pid),same=mine?m.team===mine.team:m.team===0,el=document.createElement('div'); el.className='cl'; const b=document.createElement('b'); b.textContent=String(m.name||'').slice(0,13); b.style.color='rgb('+TC[same?0:1]+')'; el.appendChild(b); el.appendChild(document.createTextNode(String(m.text).slice(0,80))); log.appendChild(el); while(log.children.length>6) log.firstChild.remove(); setTimeout(()=>el.classList.add('old'),7000); setTimeout(()=>el.remove(),7500); };
  const close=()=>{ inp.value=''; inp.hidden=true; inp.blur(); showHist(false); },send=()=>{ const t=cleanText(inp.value,80); close(); if(!t||!NET.tx) return; if(NET.host){ const m={t:'chat',name:NET.name(),team:0,text:t.slice(0,80),pid:'host'}; sendAll(m); chatShow(m); } else NET.tx.send({t:'chat',text:t.slice(0,80)}); };
  addEventListener('keydown',e=>{ if(document.activeElement===inp){ e.stopPropagation(); if(e.key==='Enter'){ e.preventDefault(); send(); } else if(e.key==='Escape'){ e.preventDefault(); close(); } return; }
    if(e.code!=='KeyT'||e.ctrlKey||e.metaKey||e.altKey||!matchMedia('(pointer:fine)').matches) return; const a=document.activeElement; if(a&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA'||a.tagName==='SELECT')) return; if(!(NET.host||NET.client)){ if(running) toast('채팅은 친구와 함께 할 때 쓴다'); return; } e.preventDefault(); e.stopPropagation(); inp.hidden=false; showHist(true); inp.focus(); },true);
  addEventListener('keyup',e=>{ if(document.activeElement===inp) e.stopPropagation(); },true); inp.addEventListener('blur',()=>{ if(!inp.hidden) close(); }); }

/* ───────── 누가 메뉴를 열었는지 알리기 ─────────
   방장이 메뉴를 열면 싸움이 실제로 멈추므로 모두의 화면 가운데에 크게 알린다. 손님이 열면 싸움은 계속되고, 위쪽에 작게 알린다. */
{ const st=document.createElement('style'); st.textContent='#pzb{position:fixed;inset:0;z-index:30;pointer-events:none;display:none;align-items:center;justify-content:center;background:rgba(5,7,15,.55)}#pzb.on{display:flex}'
   +'#pzb div{padding:18px 26px;border:1px solid var(--gold);border-radius:6px 18px 6px 18px;background:rgba(10,15,36,.94);text-align:center;box-shadow:0 0 40px rgba(227,195,119,.25)}#pzb b{display:block;font:700 19px/1.3 var(--display);color:#fff3cf}#pzb span{display:block;margin-top:6px;font:13px var(--body);color:var(--muted)}#pzb i{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--gold);margin-right:8px;animation:tlblink 1.2s ease-in-out infinite}'
   +'#pzs{position:fixed;left:50%;top:calc(64px + env(safe-area-inset-top));transform:translateX(-50%);z-index:30;pointer-events:none;display:flex;flex-direction:column;gap:4px;align-items:center}#pzs div{padding:5px 12px;border:1px solid var(--line);border-radius:20px;background:rgba(6,9,23,.85);font:600 12.5px var(--body);color:#d5dbf5;white-space:nowrap}';
  document.head.appendChild(st); const big=document.createElement('div'); big.id='pzb'; big.innerHTML='<div><b></b><span>잠시 멈춤 · 곧 이어진다</span></div>'; const small=document.createElement('div'); small.id='pzs'; document.body.appendChild(big); document.body.appendChild(small);
  const open=new Map(); const draw=()=>{ const on=(NET.host||NET.client)&&running&&!over; const h=on&&[...open.values()].find(x=>x.host); NET.hp=!!h&&NET.client; big.classList.toggle('on',!!h); if(h) big.querySelector('b').innerHTML='<i></i>'+esc(h.name)+'(이)가 메뉴를 확인 중입니다'; small.innerHTML=on?[...open.values()].filter(x=>!x.host).map(x=>'<div>'+esc(x.name)+'(이)가 메뉴를 확인 중</div>').join(''):''; };
  window.pzReset=()=>{ open.clear(); NET.hp=false; draw(); };
  window.pzShow=m=>{ if(!m) return; const k=m.who||'host'; if(m.on) open.set(k,{name:String(m.name||'').slice(0,13),host:!!m.host}); else open.delete(k); draw(); };
  let was=false; setInterval(()=>{ const on=(NET.host||NET.client)&&running&&!over; if(!on){ if(open.size){ open.clear(); draw(); } if(was&&NET.tx){ try{ if(NET.host) sendAll({t:'pz',who:'host',host:true,name:NET.name(),on:false}); else NET.tx.send({t:'pz',on:false}); }catch(x){} } was=false; return; } { let ch=false; for(const k of [...open.keys()]) if(k!=='host'&&!NET.players.some(p=>p.pid===k)){ open.delete(k); ch=true; } if(ch) draw(); } const now2=!$('pause').hidden; if(now2===was) return; was=now2; if(!NET.tx) return;
    if(NET.host) sendAll({t:'pz',who:'host',host:true,name:NET.name(),on:now2}); else NET.tx.send({t:'pz',on:now2}); },200); }
