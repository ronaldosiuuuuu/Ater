"use strict";
/* 1.7.1 ~ : 버그 손질 · 채팅 · 별무리 뽑기 · 닉네임 · 보상 코드 해시 */
/* ════════════════ 1.7.1 버그 손질 ════════════════ */
/* 첫 판 안내의 점프 단계는 실제 점프로만 넘어간다(몸이 뜨는 스킬로는 넘어가지 않는다) */
{ const jp0=jump; jump=function(e){ const z0=e.z,r=jp0(e); if(TUT.on&&e===me&&e.vz>0&&z0<=.01) TUT.jp=true; return r; }; }
/* 처음 켰을 때의 시작 화면 · 닉네임 창에서는 뒤로(Esc · 안드로이드 뒤로)가 아래에 숨은 첫 방문 안내를 닫지 않는다 */
{ const bs4=backStep; backStep=function(){ if(document.getElementById('title')||document.getElementById('nickv')) return true; return bs4(); }; }
/* 옛 저장('모두 열기'를 켜 둔 채)에서 잠긴 캐릭터가 골라져 있으면 에이로 */
if(!PF.open&&typeof locked==='function'&&CH[kOf('me')]&&locked(kOf('me'))){ sel.me='ei'; sel.meR=false; try{ save(); drawSel(); }catch(x){} }
/* 싸우기를 누르고 화면 방향 · 전체 화면을 기다리는 사이(최대 1.5초)에 다른 단추가 눌리지 않게 */
{ const la2=launch; launch=function(){ document.body.classList.add('starting'); let r; try{ r=la2(); } finally { Promise.resolve(r).finally(()=>document.body.classList.remove('starting')); } return r; };
  const st=document.createElement('style'); st.textContent='body.starting #sel,body.starting #tower,body.starting #res{pointer-events:none}@media (max-width:340px){.hubg{grid-template-columns:1fr}}'; document.head.appendChild(st); }
/* 뽑기: 눌러서 한꺼번에 뒤집은 뒤에는 남은 카드 소리 · 진동을 내지 않는다 */
{ let quietT=0; const sf0=sfx; sfx=function(k,a){ if(performance.now()<quietT&&(k==='ui'||k==='ult')) return; return sf0(k,a); }; const bz0=buzz; buzz=function(ms){ if(performance.now()<quietT) return; return bz0(ms); };
  document.addEventListener('click',e=>{ const g0=e.target.closest('.gst'); if(!g0) return; const n=g0.querySelectorAll('.gc').length; quietT=performance.now()+350+n*260+200; },true); }

/* ════ 1.7.1 함께 하기 손질 ════ */
/* 편 인원(1 · 2 · 3 · 5대)이 사람 수보다 적으면 맞춰 늘린다(태그 · 레이드 · 대돌격은 그대로) */
/* roomFitN() → game/hoisted.js */
/* 손님(그만두기 · 끊김)의 대기 캐릭터는 컴퓨터가 맡는다 */
/* tagRelease() → game/hoisted.js */
/* 방장의 전적은 방장이 맡은 캐릭터로(태그에서 손님 캐릭터가 싸우던 중에 끝나도) */
/* tagHostChar() → game/hoisted.js */
/* 함께 레이드 · 등반 단추는 태그 인원 되돌리기를 하지 않는다 */
document.addEventListener('click',e=>{ if(e.target.closest('#n-qraid,#n-qtower')&&window.tagPrevReset) tagPrevReset(); },true);
/* 손님이 스스로 편을 바꾸면 '함께 레이드 전 편' 기억을 지운다 */
{ onMsg('host',{pre(pid,d){ if(d&&NET.host&&d.t==='pick'&&(d.team===0||d.team===1)){ const p=NET.players.find(x=>x.pid===pid); if(p&&p.team!==d.team) p.prevTeam=null; } }}); }
/* 손님: 방장이 보낸 짧은 안내 · 다시 이어지면 재접속 횟수를 되돌린다 · 판이 시작되면 열려 있던 창을 닫는다 */
{ onMsg('client',{pre(d){ if(d&&d.t==='note'&&NET.client){ toast(String(d.text||'').slice(0,60),1800); return true; } if(d&&d.t==='lobby') NET.retry=0; }});
  const cs2=clientStart; clientStart=function(d){ ['bagv','achv','keysv','patchv','chatv'].forEach(id=>{ const x=document.getElementById(id); if(x) x.remove(); }); $('tower').hidden=true; return cs2(d); }; }
/* 레이드는 사람 모두가 한 편이다: 방 정보 띠에서도 한 편으로 보이고, 방장 '상대' 칸은 보스 그대로 */
{ const rd0=roomDraw; roomDraw=function(){ const hs=NET.host?roomHS():(NET.hs||{}); if(hs.m===6&&inRoom()){ const keep=NET.players.map(p=>p.team); NET.players.forEach(p=>{ p.team=0; }); try{ rd0(); } finally { NET.players.forEach((p,i)=>{ p.team=keep[i]; }); } } else rd0();
    /* 방장 '상대' 칸 · 다른 사람이 고른 캐릭터 이름표를 바로 고친다 */ if(!running) foeSlotFix(); }; }
function foeSlotFix(){ const sig=(NET.host||NET.client?'1':'0')+mode+'|'+NET.players.map(p=>(p.pid||'h')+p.team+p.key).join(','); if(sig===foeSlotFix.sig) return; foeSlotFix.sig=sig; drawSel(); }
{ const ds3=drawSel; drawSel=function(){ ds3(); const f=$('slot-foe'); if(f&&f.classList.contains('humanfoe')&&!(NET.host&&inRoom()&&mode!==6&&NET.players.some(p=>p.team===1))){ f.classList.remove('humanfoe'); } }; }
/* 방장이 아니면 '방장은 사람을 눌러 편을 바꾼다' 안내를 치운다 */
{ const dn5=drawNet; drawNet=function(){ dn5(); const h=document.getElementById('n-lhint'); if(h&&!NET.host) h.remove(); }; }
/* 채팅 입력: 한글 조합 중 Enter는 보내지 않는다 */
document.addEventListener('keydown',e=>{ if(e.key==='Enter'&&e.isComposing&&e.target&&/rc-in|chat-in|cv-in/.test(e.target.id||'')) e.stopImmediatePropagation(); },true);
/* ════ 1.7.1 채팅을 보기 편하게(휴대폰 중심) ════
   · 고르는 화면: 큰 단추 바로 위에 채팅 줄(최신 메시지 · 안 읽은 수). 누르면 채팅 창(기록 · 빠른 문구 · 입력)
   · 채팅 줄이 안 보이는 탭(가방 · 기록 · 설정)이나 결과 화면에서는 알림 · 말풍선으로도 띄운다 */
NET.unread=0;
function chatBar(){ const dock=document.querySelector('#sel .main>.dock'); if(!dock) return; let el=document.getElementById('cbar'); const on=inRoom()&&!running;
  if(!el){ el=document.createElement('button'); el.type='button'; el.id='cbar'; dock.insertBefore(el,dock.firstChild); el.addEventListener('click',()=>chatSheet(true)); }
  el.hidden=!on; if(!on) return; const m=NET.chatLog[NET.chatLog.length-1],mine=myP(),col=x=>'rgb('+TC[mine&&x.team!==mine.team?1:0]+')';
  const h='<span class="ci">💬</span><span class="ct">'+(m?'<b style="color:'+col(m)+'">'+esc(m.name||'')+'</b> '+esc(m.text):'<em>채팅 · 눌러서 연다</em>')+'</span>'+(NET.unread?'<i class="cn">'+Math.min(99,NET.unread)+'</i>':'<i class="cg">열기</i>');
  if(el.__h!==h){ el.__h=h; el.innerHTML=h; } el.classList.toggle('new',!!NET.unread); }
function chatSheet(open){ let d=document.getElementById('chatv'); if(open===false){ if(d) d.remove(); return; }
  if(!d){ if(!open) return; d=document.createElement('div'); d.className='overlay'; d.id='chatv'; d.style.zIndex=12; document.body.appendChild(d);
    d.innerHTML='<div class="wrap cvw"><div class="cvh"><b>채팅</b><span id="cv-sub"></span><button type="button" id="cv-x" aria-label="닫기">✕</button></div><div class="cvl" id="cv-log"></div><div class="cvq">'+RQ.map((t,i)=>'<button type="button" data-cq="'+i+'">'+t+'</button>').join('')+'</div><div class="cvi"><input id="cv-in" type="text" maxlength="80" placeholder="하고 싶은 말 · Enter로 보낸다" autocomplete="off" enterkeyhint="send"><button type="button" id="cv-go">보내기</button></div></div>';
    d.addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; if(b.id==='cv-x'){ chatSheet(false); return; } if(b.dataset.cq!==undefined){ chatSend(RQ[+b.dataset.cq]); return; } if(b.id==='cv-go'){ const i=$('cv-in'); chatSend(i.value); i.value=''; i.focus(); } });
    d.addEventListener('keydown',e=>{ if(e.key==='Enter'&&e.target.id==='cv-in'&&!e.isComposing){ e.preventDefault(); chatSend(e.target.value); e.target.value=''; } });
    if(matchMedia('(pointer:fine)').matches) setTimeout(()=>{ const i=$('cv-in'); if(i) i.focus(); },50); }
  NET.unread=0; const mine=myP(),L=document.getElementById('cv-log'); $('cv-sub').textContent=inRoom()?'방 '+(NET.code||'')+' · '+NET.players.length+'명':'';
  L.innerHTML=NET.chatLog.length?NET.chatLog.map(m=>{ const my=mine&&m.name===mine.name&&m.mine; return '<div class="cm'+(m.mine?' me':'')+'"><b style="color:rgb('+TC[mine&&m.team!==mine.team?1:0]+')">'+esc(m.name||'')+'</b><span>'+esc(m.text)+'</span></div>'; }).join(''):'<p class="sub">아직 채팅이 없다. 아래 빠른 문구를 눌러 본다.</p>'; L.scrollTop=L.scrollHeight; chatBar(); }
{ const cs1=window.chatShow; window.chatShow=m=>{ if(!m||!m.text) return; const mine=myP(),isMe=m.pid?m.pid===(NET.host?'host':NET.pid):!!mine&&m.name===(NET.host?NET.name():mine.name);   /* 내 말인지는 이름이 아니라 보낸 사람 주소로 본다 */ const before=NET.chatLog.length; cs1(m); const last=NET.chatLog[NET.chatLog.length-1]; if(last&&NET.chatLog.length>=before) last.mine=isMe;
    const sheet=document.getElementById('chatv'); if(sheet) chatSheet(true); else if(!isMe) NET.unread++;
    /* 싸움 중 말고도 고르는 화면이 가려진 때(결과 화면 등)는 왼쪽 아래 말풍선, 채팅 줄이 안 보이는 탭에서는 알림 */
    if(!running&&$('sel').hidden&&!sheet&&!isMe){ toast('💬 '+(m.name||'')+': '+String(m.text).slice(0,40),2600); }
    else if(!running&&!sheet&&!isMe&&['bag','rec','opts'].includes(page)) toast('💬 '+(m.name||'')+': '+String(m.text).slice(0,40),2600);
    chatBar(); }; }
{ const rd1=roomDraw; roomDraw=function(){ rd1(); chatBar(); if(!inRoom()) chatSheet(false); }; }
{ const bs5=backStep; backStep=function(){ if(document.getElementById('chatv')){ chatSheet(false); return true; } return bs5(); }; }
/* 싸움 중 빠른 채팅에 '직접 쓰기' */
{ const pop=document.getElementById('qcp'); if(pop){ pop.insertAdjacentHTML('beforeend','<button type="button" data-q="w">✏ 직접 쓰기</button>'); pop.addEventListener('click',e=>{ const q=e.target.closest('[data-q="w"]'); if(!q) return; e.stopPropagation(); pop.hidden=true; chatSheet(true); },true); } }
{ const st=document.createElement('style'); st.textContent=[
  '#roomc .rlog,#roomc .rqk,#roomc .rin{display:none}',
  '#cbar{display:flex;align-items:center;gap:8px;width:100%;min-height:40px;margin:0 0 6px;padding:6px 10px;border:1px solid var(--line);border-radius:10px;background:rgba(6,9,23,.75);color:var(--ink);font:inherit;text-align:left}#cbar[hidden]{display:none}',
  '#cbar .ci{flex:none;font-size:16px}#cbar .ct{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:13.5px}#cbar .ct em{font-style:normal;color:var(--muted)}#cbar .ct b{margin-right:4px}',
  '#cbar .cn{flex:none;font:800 11.5px var(--mono);color:#1b1404;background:var(--gold);border-radius:10px;padding:2px 8px;font-style:normal}#cbar .cg{flex:none;font-style:normal;font-size:12px;color:var(--aether)}#cbar.new{border-color:var(--gold);box-shadow:0 0 12px rgba(227,195,119,.35)}',
  'body.land #cbar{min-height:34px;padding:4px 8px;margin-bottom:4px}body.land #cbar .ct{font-size:12px}',
  '#chatv .cvw{display:flex;flex-direction:column;height:100%;max-height:100%;box-sizing:border-box;padding-bottom:calc(10px + env(safe-area-inset-bottom))}',
  '#chatv .cvh{display:flex;align-items:center;gap:8px;flex:none}#chatv .cvh b{font:700 18px var(--display)}#chatv .cvh span{color:var(--muted);font-size:12px}#chatv .cvh button{margin-left:auto;width:44px;height:44px;border:1px solid var(--line);border-radius:10px;background:var(--panel);color:var(--ink);font-size:16px}',
  '#chatv .cvl{flex:1;min-height:120px;overflow:auto;margin:10px 0;padding:8px;border:1px solid var(--line);border-radius:10px;background:rgba(6,9,23,.6);display:flex;flex-direction:column;gap:6px}',
  '#chatv .cm{align-self:flex-start;max-width:85%;padding:6px 10px;border-radius:4px 12px 12px 12px;background:var(--panel);font-size:14.5px;line-height:1.45;overflow-wrap:anywhere}#chatv .cm b{display:block;font-size:11.5px;margin-bottom:1px}#chatv .cm.me{align-self:flex-end;border-radius:12px 4px 12px 12px;background:#1d3a5c}',
  '#chatv .cvq{flex:none;display:flex;flex-wrap:wrap;gap:6px}#chatv .cvq button{border:1px solid var(--line);border-radius:16px;background:var(--panel);color:var(--ink);font:600 13px var(--body);padding:7px 12px;min-height:38px}',
  '#chatv .cvi{flex:none;display:flex;gap:8px;margin-top:8px}#chatv .cvi input{flex:1;min-width:0;height:46px;border:1px solid var(--aether);border-radius:10px;background:rgba(6,9,23,.9);color:var(--ink);font:15px var(--body);padding:0 12px}#chatv .cvi button{flex:none;padding:0 16px;border:1px solid var(--gold);border-radius:10px;background:linear-gradient(180deg,#f0d696,var(--gold));color:#1b1404;font-weight:800}'
 ].join(''); document.head.appendChild(st); }

/* ════ 1.7.2 별무리 뽑기 ════ 원하는 캐릭터를 골라 데려오던 것을 없애고, 값을 크게 올려 '그 등급 캐릭터 하나(무작위 · 아직 없는 것)'를 얻는다 */
const SGG=['고화','서사','전설'],SDRAW={고화:30,서사:90,전설:240};
document.addEventListener('click',e=>{ const b=e.target.closest('[data-sg]'); if(!b) return; e.stopImmediatePropagation();
  const g=b.dataset.sg,L=gachaPool(g).filter(k=>!PF.own[k]); if(!L.length) return toast(g+' 캐릭터는 모두 가졌다'); if(PF.star<SDRAW[g]) return toast('별무리의 흔적이 모자라다 ('+PF.star+' / '+SDRAW[g]+')');
  const k=L[Math.floor(Math.random()*L.length)]; PF.star-=SDRAW[g]; PF.own[k]=Date.now(); pfSave(); sfx('win'); const v=document.getElementById('bagv'); if(v) v.remove(); drawSel(); gachaScreen([{k,g,dup:false}]); },true);

/* ════ 1.8.0 닉네임 고정 ════ 처음 한 번 정하면 바꿀 수 없다(함께 탭의 이름 칸은 읽기만) */
{ const lock=()=>{ let v=''; try{ v=localStorage.getItem('aetherName')||''; }catch(x){} const i=$('n-name'); if(!i) return; if(v){ i.value=v; i.readOnly=true; i.title='닉네임은 바꿀 수 없다'; i.classList.add('locked'); } };
  lock(); $('n-name').addEventListener('change',()=>setTimeout(lock,0)); document.addEventListener('click',e=>{ if(e.target.id==='n-name'&&e.target.readOnly) toast('닉네임은 한 번 정하면 바꿀 수 없다',1800); });
  new MutationObserver(lock).observe(document.body,{childList:true}); /* 닉네임 창이 닫히면 바로 잠근다 */
  const st=document.createElement('style'); st.textContent='#n-name.locked{opacity:.75;cursor:not-allowed}'; document.head.appendChild(st); }

/* ════ 1.8.2 닉네임 다시 정하기(보상 코드로 연다, 2~13자). 새 이름을 정해야 코드가 쓰인 것으로 친다 ════ */
function renameScreen(){ const old=document.getElementById('renv'); if(old) old.remove(); const d=document.createElement('div'); d.className='overlay'; d.id='renv'; d.style.zIndex=46; const cur=nickOf();
  d.innerHTML='<div class="wrap">'+head('RENAME','닉네임 다시 정하기','지금 · '+esc(cur))+'<div class="row"><input type="text" id="rn-in" maxlength="13" placeholder="새 닉네임 (2~13자)" autocomplete="off" style="flex:1;height:52px;font-size:17px;text-align:center"></div><p class="note">닉네임을 딱 한 번 다시 정할 수 있다. 최대 13자. 정하고 나면 이 코드로는 다시 바꿀 수 없다.</p><div class="dock"><button class="go" id="rn-ok" type="button">이 이름으로 바꾼다</button><button class="ghost" id="rn-no" type="button">그만둔다</button></div></div>';
  document.body.appendChild(d); const inp=d.querySelector('#rn-in');
  d.querySelector('#rn-no').onclick=()=>d.remove();
  d.querySelector('#rn-ok').onclick=()=>{ const v=cleanName(inp.value); if(v.length<2) return toast('닉네임은 2자 이상'); if(v===cur) return toast('지금 이름과 같다'); try{ localStorage.setItem('aetherName',v); }catch(x){} PF.codes=PF.codes||{}; PF.codes[CODE_RENAME]=Date.now(); pfSave(); const n=$('n-name'); if(n){ n.value=v; n.readOnly=true; } if(NET.client||NET.host) try{ NET.pick(); }catch(x){} d.remove(); sfx('win'); toast('닉네임을 바꿨다 · '+v,3000); };
  inp.addEventListener('keydown',e=>{ if(e.key==='Enter'&&!e.isComposing) d.querySelector('#rn-ok').click(); }); setTimeout(()=>inp.focus(),50); }
{
  const bs6=backStep; backStep=function(){ const r=document.getElementById('renv'); if(r){ r.remove(); return true; } return bs6(); }; }

/* ════════════════ 보상 코드: 원문 없이 암호화한 값(SHA-256 앞 24자리)만 둔다. 코드를 바꿀 때는 CODEH만 고친다 ════════════════ */
function sha256(str){ const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  const b=Array.from(new TextEncoder().encode(str)),l=b.length*8; b.push(0x80); while(b.length%64!==56) b.push(0); for(let i=7;i>=0;i--) b.push(i>3?0:(l>>>(i*8))&255);
  let H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]; const r=(x,n)=>(x>>>n)|(x<<(32-n)),w=new Array(64);
  for(let o=0;o<b.length;o+=64){ for(let i=0;i<16;i++) w[i]=(b[o+i*4]<<24|b[o+i*4+1]<<16|b[o+i*4+2]<<8|b[o+i*4+3])>>>0; for(let i=16;i<64;i++){ const s0=r(w[i-15],7)^r(w[i-15],18)^(w[i-15]>>>3),s1=r(w[i-2],17)^r(w[i-2],19)^(w[i-2]>>>10); w[i]=(w[i-16]+s0+w[i-7]+s1)>>>0; }
    let [a,bb,c,d,e,f,g2,h]=H; for(let i=0;i<64;i++){ const t1=(h+(r(e,6)^r(e,11)^r(e,25))+((e&f)^(~e&g2))+K[i]+w[i])>>>0,t2=((r(a,2)^r(a,13)^r(a,22))+((a&bb)^(a&c)^(bb&c)))>>>0; h=g2; g2=f; f=e; e=(d+t1)>>>0; d=c; c=bb; bb=a; a=(t1+t2)>>>0; }
    H=H.map((x,i)=>(x+[a,bb,c,d,e,f,g2,h][i])>>>0); } return H.map(x=>x.toString(16).padStart(8,'0')).join(''); }
const codeKey=v=>sha256('aether|'+String(v||'').replace(/\s+/g,'')).slice(0,24);
const CODEH={'d6aad6d07073a1053e5792ce':{coin:13500},'deb6c2a784a77949da9bbf89':{coin:40000},'5ead639f3fb3c46e3149490d':{star:40},'1a65523c58f35a12abbc1da2':{rename:1},'b311b59e8c65142c24e4115d':{palace:1}},CODE_RENAME='1a65523c58f35a12abbc1da2';
/* 1.8.4 보상 코드를 모두 새로 바꿨다. 예전 코드를 쓴 기록은 지운다(새 코드와 겹치지 않는다) */
{ PF.codes=PF.codes||{}; let ch=false; for(const k of Object.keys(PF.codes)){ if(CODEH[k]) continue; delete PF.codes[k]; ch=true; } if(ch) pfSave(); }
redeem=function(v){ const h=codeKey(v),c=CODEH[h]; if(!c) return false; PF.codes=PF.codes||{};
  if(c.palace){ PF.open=!PF.open; PF.palace=PF.open?1:0; pfSave(); sfx('win'); toast(PF.open?'모든 캐릭터를 열었다 · 같은 코드를 다시 적으면 원래대로 돌아간다':'원래대로 돌아왔다 · 가진 캐릭터만 쓴다',4200); if(!PF.open&&locked(kOf('me'))){ sel.me='ei'; sel.meR=false; } drawSel(); hubCard(); if(typeof drawBag==='function') drawBag(); return true; }
  if(PF.codes[h]){ toast(c.rename?'이미 이 코드로 닉네임을 다시 정했다':'이미 받은 보상이다'); return true; }
  if(c.rename){ renameScreen(); return true; }
  PF.codes[h]=Date.now(); PF.coin+=c.coin||0; PF.star+=c.star||0; pfSave(); sfx('win'); toast('코드 보상 · '+(c.coin?'코인 '+c.coin.toLocaleString()+'개':'')+(c.coin&&c.star?' · ':'')+(c.star?'별무리의 흔적 '+c.star+'개':''),4200); hubCard(); return true; };
{ const q=$('q'); if(q) q.addEventListener('input',()=>{ if(CODEH[codeKey(q.value)]&&redeem(q.value)){ q.value=''; drawSel(); } }); }
