"use strict";
/* ════════════════ 1.8.7 친구 · 최근 함께한 사람 · 바로 초대 ════════════════
   서버 없이 기기끼리 한다.
   · 친구 코드: 기기마다 10자 코드가 하나 생긴다(저장 내보내기에 함께 실린다). 방에 들어가면 서로의 코드를 주고받는다.
   · 최근 함께한 사람: 같은 방에 있었던 사람이 저절로 남는다(12명). 「친구로」를 누르면 친구가 된다.
   · 바로 초대: 게임을 켜 둔 동안 내 친구 코드로 초대를 기다린다. 방에 있는 사람이 친구에게 「초대」를 누르면 그 친구 화면에 초대가 뜬다.
     친구로 등록한 사람의 초대만 받는다. 초대는 중계 서버로만 오간다(모르는 사람이 내 코드로 접속해도 내 IP가 드러나지 않게). 중계 서버가 없으면 이 기능은 쉰다.
   · 설정 「친구 초대 받기」로 끌 수 있다. */
const FRA='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',FRID=c=>'aether-fr-'+c,frOk=c=>typeof c==='string'&&/^[A-HJ-NP-Z2-9]{10}$/.test(c);
const FR={peer:null,bc:null,last:{},on:false};
/* 저장: aetherFriends = {id, list:[{c,n,at}], recent:[{c,n,at}]} */
function frLoad(){ let d=null; try{ d=JSON.parse(localStorage.getItem('aetherFriends')||'null'); }catch(x){} d=d&&typeof d==='object'&&!Array.isArray(d)?d:{};
  const L=v=>(Array.isArray(v)?v:[]).filter(x=>x&&frOk(x.c)).map(x=>({c:x.c,n:cleanName(x.n)||'친구',at:+x.at||0}));
  if(!frOk(d.id)){ const r=new Uint8Array(10); try{ crypto.getRandomValues(r); }catch(x){ for(let i=0;i<10;i++) r[i]=Math.random()*256; } d.id=[...r].map(b=>FRA[b&31]).join(''); }
  return {id:d.id,list:L(d.list).slice(0,50),recent:L(d.recent).slice(0,12)}; }
let FRD=frLoad(); function frSave(){ try{ localStorage.setItem('aetherFriends',JSON.stringify(FRD)); }catch(x){} }
frSave(); if(typeof SAVEKEYS!=='undefined'&&!SAVEKEYS.includes('aetherFriends')) SAVEKEYS.push('aetherFriends');
function myFriendCode(){ return FRD.id; }
const frShow=c=>c.slice(0,5)+'-'+c.slice(5);
function frIs(c){ return FRD.list.some(x=>x.c===c); }
function friendAdd(c,n){ c=String(c||'').toUpperCase().replace(/[^A-Z0-9]/g,''); if(!frOk(c)) return toast('친구 코드는 영문 · 숫자 10자다',2200),false; if(c===FRD.id) return toast('내 코드다',1600),false;
  const was=FRD.list.find(x=>x.c===c),r=FRD.recent.find(x=>x.c===c); if(was){ if(n) was.n=cleanName(n)||was.n; } else FRD.list.unshift({c,n:cleanName(n)||(r&&r.n)||'친구',at:Date.now()}); FRD.list=FRD.list.slice(0,50); frSave(); frDraw(); return true; }
function friendDel(c){ FRD.list=FRD.list.filter(x=>x.c!==c); frSave(); frDraw(); }
function frSeen(c,n){ if(!frOk(c)||c===FRD.id) return; n=cleanName(n)||'손님'; FRD.recent=[{c,n,at:Date.now()}].concat(FRD.recent.filter(x=>x.c!==c)).slice(0,12); const f=FRD.list.find(x=>x.c===c); if(f) f.n=n; frSave(); }

/* 방에서 친구 코드를 주고받는다: 손님은 처음 받은 명단에 답해 자기 코드를 보내고(fc), 방장은 명단(lobby)에 사람마다 코드를 싣는다(game/v1.3-1.5.js) */
if(typeof CAPS!=='undefined') CAPS.fc=2;
onMsg('host',{pre(pid,d){ if(d&&d.t==='fc'&&NET.host){ const p=NET.players.find(x=>x.pid===pid); if(p&&frOk(d.fc)&&d.fc!==FRD.id&&!NET.players.some(x=>x!==p&&x.fc===d.fc)){ p.fc=d.fc; frSeen(d.fc,p.name); lobbyOut(); } return true; } }});
onMsg('client',{post(d){ if(!d||d.t!=='lobby'||!NET.client) return; const mine=NET.players.find(p=>p.pid===NET.pid); if(mine&&mine.fc!==FRD.id&&NET.tx&&!FR.sent){ FR.sent=true; NET.tx.send({t:'fc',fc:FRD.id}); }
  for(const p of NET.players) if(p.pid!==NET.pid&&p.fc) frSeen(p.fc,p.name); if(document.querySelector('section[data-page="net"]:not([hidden])')) frDraw(); }});
{ const nl=netLeave; netLeave=function(q){ FR.sent=false; return nl(q); }; }

/* 초대를 기다리는 자리(내 친구 코드). 중계 서버로만 잇는다. 같은 브라우저 탭끼리 잇는 시험 방식(?bc)에서는 BroadcastChannel로 대신한다 */
function frStart(){ if(FR.on||OPT.frOn===0) return; const web=/^https?:$/.test(location.protocol); if(!web) return;
  if(navigator.webdriver&&!NET.bc) return;   /* 자동 시험 브라우저에서는 켜지 않는다(PeerJS를 불러오며 시험용 고정 난수를 써 버려 대전표 지문이 흔들린다) */
  FR.on=true;
  if(NET.bc){ FR.bc=new BroadcastChannel(FRID(FRD.id)); FR.bc.onmessage=ev=>frGot(ev.data,ev.data&&ev.data.fc); return; }
  Promise.all([loadPeer(),relayIce(true)]).then(()=>{ if(!FR.on) return; if(!NET.ice){ FR.on=false; return; } /* 중계 서버가 없으면 쉰다(내 IP를 지키려고) */
    const peer=new Peer(FRID(FRD.id),{config:{iceServers:NET.ice,iceTransportPolicy:'relay'},debug:0}); FR.peer=peer;
    peer.on('connection',c=>{ const t=setTimeout(()=>{ try{ c.close(); }catch(x){} },10000); c.on('data',d=>{ const from=typeof c.peer==='string'&&c.peer.startsWith('aether-fr-')?c.peer.slice(10):''; frGot(d,from); clearTimeout(t); setTimeout(()=>{ try{ c.close(); }catch(x){} },500); }); });
    peer.on('error',()=>{}); peer.on('disconnected',()=>{ try{ if(FR.on) peer.reconnect(); }catch(x){} }); }).catch(()=>{ FR.on=false; }); }
function frStop(){ FR.on=false; try{ if(FR.peer) FR.peer.destroy(); }catch(x){} FR.peer=null; try{ if(FR.bc) FR.bc.close(); }catch(x){} FR.bc=null; }
/* 받은 초대: 친구가 보낸 것이고, 보낸 자리(주소)와 코드가 맞을 때만 띄운다. 같은 사람은 10초에 한 번 */
function frGot(d,from){ if(!d||typeof d!=='object'||d.t!=='inv') return; const c=String(d.fc||''),room=String(d.room||'');
  if(!frOk(c)||c!==from||!frIs(c)||!/^[A-Z0-9]{4,6}$/.test(room)) return; const t=performance.now(); if(FR.last[c]!==undefined&&t-FR.last[c]<10000) return; FR.last[c]=t;
  const f=FRD.list.find(x=>x.c===c),who=cleanName(d.name)||(f&&f.n)||'친구';
  if(running||NET.code===room) return toast(who+' 님이 함께 하자고 한다 · 방 '+room,3200);
  const old=document.getElementById('invv'); if(old) old.remove(); const v=document.createElement('div'); v.className='overlay'; v.id='invv'; v.style.zIndex=48;
  v.innerHTML='<div class="wrap">'+head('INVITE','함께 하자','')+'<p class="note" style="font-size:15px"><b>'+esc(who)+'</b> 님이 방 <b>'+esc(room)+'</b>으로 부른다.</p><div class="dock"><button class="go" id="inv-ok" type="button">들어가기</button><button class="ghost" id="inv-no" type="button">나중에</button></div></div>';
  document.body.appendChild(v); sfx('win');
  v.querySelector('#inv-no').onclick=()=>v.remove();
  v.querySelector('#inv-ok').onclick=()=>{ v.remove(); if(NET.host||NET.client){ try{ netLeave(); }catch(x){} } goPage('net'); $('n-join-code').value=room; setTimeout(()=>$('n-join').click(),150); }; }
/* 친구에게 지금 있는 방으로 초대를 보낸다 */
function friendInvite(c){ if(!(NET.host||NET.client)||!NET.code) return toast('먼저 방을 만들거나 방에 들어간다',2200); if(!frIs(c)) return;
  const f=FRD.list.find(x=>x.c===c),msg={t:'inv',room:NET.code,fc:FRD.id,name:NET.name()};
  if(NET.bc){ const ch=new BroadcastChannel(FRID(c)); ch.postMessage(msg); setTimeout(()=>ch.close(),500); toast((f?f.n:'친구')+' 님에게 초대를 보냈다',2000); return; }
  if(!FR.peer||FR.peer.destroyed) return toast('초대를 보내려면 중계 서버가 있어야 한다 · 초대 링크를 대신 보낸다',3200);
  const conn=FR.peer.connect(FRID(c),{reliable:true,serialization:'json'}); let done=false;
  const t=setTimeout(()=>{ if(!done){ done=true; try{ conn.close(); }catch(x){} toast((f?f.n:'친구')+' 님은 지금 게임을 켜 두지 않은 것 같다 · 초대 링크를 보낸다',3200); } },9000);
  conn.on('open',()=>{ conn.send(msg); done=true; clearTimeout(t); toast((f?f.n:'친구')+' 님에게 초대를 보냈다',2000); setTimeout(()=>{ try{ conn.close(); }catch(x){} },1500); });
  conn.on('error',()=>{ if(!done){ done=true; clearTimeout(t); toast((f?f.n:'친구')+' 님은 지금 게임을 켜 두지 않았다 · 초대 링크를 보낸다',3200); } }); }

/* 함께 탭: 친구 칸 */
function frDraw(){ const sec=document.querySelector('section[data-page="net"]'); if(!sec) return; let box=$('frbox'); if(!box){ box=document.createElement('div'); box.id='frbox'; const note=[...sec.children].filter(x=>x.matches('p.note')).pop(); sec.insertBefore(box,note||null); }
  const inRm=!!((NET.host||NET.client)&&NET.code),row=(x,btns)=>'<div class="pl"><b>'+esc(x.n)+'</b><span style="color:var(--muted);font-size:12px">'+frShow(x.c)+'</span>'+btns+'</div>';
  const B=(attr,txt,dis)=>'<button type="button" class="frb" '+attr+(dis?' disabled':'')+'>'+txt+'</button>';
  const rec=FRD.recent.filter(x=>!frIs(x.c));
  box.innerHTML='<h2>친구</h2><div class="row" style="align-items:center"><span class="note" style="flex:1;margin:0;min-width:0">내 친구 코드 <b class="frc">'+frShow(FRD.id)+'</b></span><button type="button" id="fr-copy">복사</button></div>'
   +'<div class="row"><input type="text" id="fr-in" maxlength="11" placeholder="친구 코드 (XXXXX-XXXXX)" autocomplete="off" autocapitalize="characters"><button type="button" id="fr-add">더하기</button></div>'
   +(FRD.list.length?FRD.list.map(x=>row(x,B('data-inv="'+x.c+'"','초대',!inRm)+B('data-del="'+x.c+'"','지우기'))).join(''):'<p class="note">아직 친구가 없다. 같은 방에 있었던 사람은 아래 「최근 함께한 사람」에 남는다.</p>')
   +(rec.length?'<h2>최근 함께한 사람</h2>'+rec.map(x=>row(x,B('data-fadd="'+x.c+'"','친구로'))).join(''):'')
   +'<p class="note">친구가 게임을 켜 두고 있으면 「초대」로 지금 방에 바로 부른다. 친구로 등록한 사람의 초대만 받는다. 설정의 「친구 초대 받기」로 끌 수 있다.</p>'; }
{ const st=document.createElement('style'); st.textContent='#frbox .pl{flex-wrap:wrap;gap:6px}#frbox .frb{height:32px;min-height:32px;padding:0 12px;border:1px solid var(--line);border-radius:8px;background:var(--panel);font-size:12.5px;flex:0 0 auto}#frbox .frb:first-of-type{margin-left:auto}#frbox .frb:disabled{opacity:.45}#frbox #fr-copy{flex:0 0 auto;padding:0 16px}#frbox .frc{white-space:nowrap;letter-spacing:.08em}'; document.head.appendChild(st);
  document.addEventListener('click',e=>{ const t=e.target; if(!t||!t.closest) return; const box=t.closest('#frbox'); if(!box) return;
    if(t.id==='fr-copy'){ const v=frShow(FRD.id); (navigator.clipboard?navigator.clipboard.writeText(v):Promise.reject()).then(()=>toast('친구 코드를 복사했다 · '+v,2000),()=>toast('친구 코드 '+v,3000)); return; }
    if(t.id==='fr-add'){ const i=$('fr-in'); if(friendAdd(i.value)){ i.value=''; toast('친구로 더했다',1600); } return; }
    const b=t.closest('[data-inv],[data-del],[data-fadd]'); if(!b) return;
    if(b.dataset.inv) friendInvite(b.dataset.inv); else if(b.dataset.del){ if(b.dataset.armed){ friendDel(b.dataset.del); } else { b.dataset.armed=1; b.textContent='한 번 더'; setTimeout(()=>{ if(b.isConnected){ delete b.dataset.armed; b.textContent='지우기'; } },2400); } }
    else if(b.dataset.fadd){ if(friendAdd(b.dataset.fadd)) toast('친구로 더했다',1600); } });
  /* 감싸지 않고 다시 그린다: 처음에 한 번, 그리고 함께 탭이 보일 때 방 상태나 목록이 바뀌면 */
  let sig=''; frDraw(); setInterval(()=>{ try{ const sec=document.querySelector('section[data-page="net"]'); if(!sec||sec.hidden) return; const k=(!!((NET.host||NET.client)&&NET.code))+':'+FRD.list.length+':'+FRD.recent.map(x=>x.c).join(''); if(k!==sig){ sig=k; frDraw(); } }catch(x){} },700); }
/* 설정: 친구 초대 받기 */
SETTINGS.push({k:'frOn',name:'친구 초대 받기',opts:[[1,'켬'],[0,'끔']],note:'켜 두면 게임을 연 동안 친구의 초대를 기다린다(중계 서버로만 오간다). 끄면 초대가 오지 않는다.',apply:()=>{ if(OPT.frOn) frStart(); else frStop(); }});
if(OPT.frOn===undefined) OPT.frOn=1;
try{ const d=SAVE1; if(d&&d.OPT&&(d.OPT.frOn===0||d.OPT.frOn===1)) OPT.frOn=d.OPT.frOn; }catch(x){}
try{ drawOpts(); }catch(x){}
setTimeout(frStart,1500);

/* ════════════════ 1.8.7 무작위 제한 안내 ════════════════
   지금 설정으로는 빈 칸을 가진 캐릭터로 채울 수 없으면, 싸우기를 누르기 전에 고르는 화면의 싸우기 단추 위에 미리 알린다 */
{ const st=document.createElement('style'); st.textContent='#shortv{margin:6px 0 8px;padding:9px 12px;border:1px solid var(--gold);border-radius:10px;background:rgba(227,195,119,.08);font-size:13px;line-height:1.45;color:var(--ink)}#shortv b{color:var(--gold)}#shortv .row{margin-top:6px}#shortv button{height:34px;min-height:34px;font-size:13px}'; document.head.appendChild(st);
  let sig='';
  setInterval(()=>{ try{ const sel=$('sel'),dock=document.querySelector('#sel .main>.dock'); if(!sel||sel.hidden||!dock||running) return; const s=typeof randShort==='function'?randShort():null,k=s?s.tm+':'+s.need+':'+s.have:'';
      let el=$('shortv'); if(k===sig&&(!!el===!!s)) return; sig=k; if(!s){ if(el) el.remove(); return; }
      if(!el){ el=document.createElement('div'); el.id='shortv'; dock.parentNode.insertBefore(el,dock); }
      el.innerHTML='<b>지금 설정으로는 시작할 수 없다</b> · '+(s.tm?'상대':'우리')+' 편 빈 칸 '+s.need+'개를 무작위로 채울 가진 캐릭터가 '+s.have+'명뿐이다.<br>칸을 직접 고르거나, 인원을 줄이거나, 뽑기로 캐릭터를 더 얻는다.<div class="row"><button type="button" id="short-bag">가방 · 뽑기</button><button type="button" id="short-1">1대1로</button></div>'; }catch(x){} },700);
  document.addEventListener('click',e=>{ const t=e.target; if(!t||!t.id) return; if(t.id==='short-bag') goPage('bag'); else if(t.id==='short-1'){ setMode(1); teamN=1; try{ $('size').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',+x.dataset.n===1)); modeNote(); drawSel(); drawSum(); }catch(x){} save(); } }); }
