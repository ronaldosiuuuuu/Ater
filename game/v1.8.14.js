"use strict";
/* ════════════════ 1.8.14 화면 다듬기 · 함께 하기 무작위 표시 · 익명 통계 · 편의 ════════════════ */

/* ── 1. 창 머리를 하나로: 왼쪽 정렬 글씨였던 창(멈춤 · 조합 · 카드 · 대전표)을 다른 창처럼 가운데 머리로 ── */
{ const H=[['pause','PAUSE'],['build','CUSTOM'],['forge','CARD FORGE'],['bench','BENCH']];
  for(const [id,en] of H){ const w=document.querySelector('#'+id+' .wrap'); if(!w) continue; const t=w.querySelector(':scope>p.title'),s=w.querySelector(':scope>p.sub'); if(!t) continue;
    const box=document.createElement('div'); box.innerHTML=head(en,esc(t.textContent),s?esc(s.textContent):''); const hd=box.firstElementChild; hd.style.gridColumn='1 / -1';
    t.replaceWith(hd); if(s) s.remove(); }
  /* 스킬 보기 창: 칭호는 작은 머리, 이름은 큰 제목 */
  const st=document.createElement('style'); st.textContent=
   '#info #i-ttl{text-align:center;font-size:11px;letter-spacing:.3em;color:var(--gold);margin:10px 0 0}#info #i-title{text-align:center;font-size:30px;margin:4px 0 2px}#info #i-sub{text-align:center;margin-bottom:6px}'
  /* ── 2. 닫기는 모두 어두운 단추로(금색은 주요 행동에만) ── */
  +'.go.shut{background:var(--panel);color:var(--ink);border:1px solid var(--line);box-shadow:none;font-weight:600;letter-spacing:0;min-height:48px;text-shadow:none}'
  /* ── 5. 창 안 단추 줄은 늘 화면 아래쪽에(내용이 짧아도) ── */
  +'.overlay:not(#sel):not(#pause)>.wrap{min-height:100%;display:flex;flex-direction:column}.overlay:not(#sel):not(#pause)>.wrap>.dock{margin-top:auto}'
  /* ── 3. 알림은 작게, 단추 줄 바로 위에 ── */
  +'#toast{font-size:12.5px;padding:7px 12px;max-width:min(420px,86vw);line-height:1.45;white-space:pre-line;text-align:center}'
  /* 글자 크기(설정) */
  +'body.uiS #sel .main,body.uiS .overlay:not(#sel)>.wrap{zoom:.92}body.uiL #sel .main,body.uiL .overlay:not(#sel)>.wrap{zoom:1.12}'
  +'#res .re2{margin-top:8px}';
  document.head.appendChild(st);
  const SHUT=/^(닫기|닫 기|그만둔다|나중에)$/;
  const mark=root=>{ (root.querySelectorAll?root:document).querySelectorAll('.overlay .dock button.go').forEach(b=>{ if(SHUT.test(b.textContent.trim())) b.classList.add('shut'); }); };
  mark(document); new MutationObserver(ms=>{ for(const m of ms) for(const n of m.addedNodes) if(n.nodeType===1&&(n.matches('.overlay')||n.querySelector&&n.querySelector('.dock'))) mark(n.parentNode||document); }).observe(document.body,{childList:true,subtree:true}); }

/* ── 3. 알림이 잇달아 오면 한 칸에 합친다(앞 것이 떠 있는 동안 두 줄까지) ── */
{ let lastT=0,lastS=''; const t0=toast; toast=function(t,ms){ const n=performance.now(),el=$('toast');
    if(el&&el.classList.contains('on')&&n-lastT<1600&&lastS&&t&&t!==lastS&&!lastS.includes('\n')){ lastS=lastS+'\n'+t; lastT=n; return t0(lastS,Math.max(ms||2200,2600)); }
    lastT=n; lastS=t||''; place(); return t0(t,ms); };
  /* 알림 자리: 맨 위에 보이는 창의 단추 줄 바로 위(없으면 원래 자리) */
  const place=()=>{ const el=$('toast'); if(!el) return; el.style.bottom=''; if(running) return; let best=null;
    for(const d of document.querySelectorAll('.overlay:not([hidden]) .dock')){ const r=d.getBoundingClientRect(); if(r.height>0&&r.top<innerHeight&&r.bottom>0) best=r; }
    if(best) el.style.bottom=Math.max(16,Math.round(innerHeight-best.top+8))+'px'; };
  const t1=toast; toast=function(t,ms){ const r=t1(t,ms); place(); return r; }; }

/* ── 함께 하기: 다른 사람이 「무작위」로 골랐으면 방 목록 · 준비 칸 · 알림 · 판 시작 편성에 「무작위」로 ── */
if(typeof CAPS!=='undefined') CAPS.rnd=6;
onMsg('host',{pre(pid,d){ if(d&&d.t==='rnd'&&NET.host){ const p=NET.players.find(x=>x.pid===pid); if(p){ const v=d.v===true; if(!!p.rnd!==v){ p.rnd=v; lobbyOut(); } } return true; } }});
{ let sent=null; onMsg('client',{post(d){ if(!d||d.t!=='lobby'||!NET.client||!NET.tx) return; const mine=NET.players.find(p=>p.pid===NET.pid); const v=!!sel.meRnd;
    if(mine&&!!mine.rnd!==v&&sent!==v){ sent=v; NET.tx.send({t:'rnd',v}); setTimeout(()=>{ sent=null; },1500); } }}); }
const rndP=p=>!!(p&&(p.host&&NET.host?sel.meRnd:(p.pid===NET.pid&&NET.client?sel.meRnd:p.rnd)));
const rndFix=root=>{ if(!(NET.host||NET.client)) return;
  root.querySelectorAll('.rchip[data-pid]').forEach(b=>{ const id=b.dataset.pid,p=NET.players.find(x=>(x.pid||'host')===id); const sp=b.querySelector('span'); if(p&&sp&&rndP(p)){ const k=p.re&&CH[p.key+'_r']?p.key+'_r':p.key,nm=pName(k); if(sp.textContent.startsWith(nm)) sp.textContent='무작위'+sp.textContent.slice(nm.length).replace(/ ★$/,''); } }); };
{ const rd14=roomDraw; roomDraw=function(){ const r=rd14.apply(this,arguments); try{ const el=$('roomb'); if(el){ rndFix(el); el.__h=null; } }catch(x){} return r; }; }
{ const dn14=drawNet; drawNet=function(){ const r=dn14.apply(this,arguments); try{ $('n-list').querySelectorAll('.pl').forEach((el,i)=>{ const p=NET.players[i],sp=el.querySelector('span'); if(p&&sp&&rndP(p)) sp.textContent='무작위'; }); }catch(x){} return r; }; }
{ const rf14=roomDiff; roomDiff=function(){ const t1=toast; toast=function(s,ms){ for(const p of NET.players) if(rndP(p)&&p.name){ const k=p.re&&CH[p.key+'_r']?p.key+'_r':p.key; s=String(s).split(p.name+' → '+pName(k)).join(p.name+' → 무작위').split(p.name+' → '+pName(p.key)).join(p.name+' → 무작위'); } return t1(s,ms); };
    try{ return rf14.apply(this,arguments); }finally{ toast=t1; } }; }
{ const ds14=drawSel; drawSel=function(){ const r=ds14.apply(this,arguments); try{ const f=$('slot-foe'); if(f&&f.classList.contains('humanfoe')){ const L=NET.players.filter(p=>p.team===1); f.querySelector('b').textContent=L.map(p=>rndP(p)?'무작위':pName(p.key)).join(' · '); } }catch(x){} return r; }; }

/* ── 익명 통계: 접속 · 판 수와 화면 오류만 보낸다(이름 · 기기 고유값 · IP를 남기지 않는다). 설정에서 끌 수 있다 ── */
const STAT_URL='https://ater-stats.ronaldosiuuuuu.workers.dev';
const statOn=()=>OPT.stat!==0&&/^https:$/.test(location.protocol)&&location.hostname==='ronaldosiuuuuu.github.io'&&!navigator.webdriver;
function statSend(o){ if(!statOn()) return; try{ const b=JSON.stringify(Object.assign({ver:VER,dev:document.body.classList.contains('pc')?'pc':'m'},o)); fetch(STAT_URL,{method:'POST',body:b,headers:{'Content-Type':'application/json'},keepalive:true,credentials:'omit',referrerPolicy:'no-referrer'}).catch(()=>{}); }catch(x){} }
SETTINGS.push({k:'stat',name:'익명 통계 보내기',opts:[[1,'켬'],[0,'끔']],note:'접속 · 판 수와 화면 오류 내용만 보낸다(이름 · 기기 정보 · 기록은 보내지 않는다). 게임을 고치는 데 쓴다.',apply:()=>{}});
if(OPT.stat===undefined) OPT.stat=1;
try{ const d=JSON.parse(localStorage.getItem('aether1')||'null'); if(d&&d.OPT&&(d.OPT.stat===0||d.OPT.stat===1)) OPT.stat=d.OPT.stat; }catch(x){}
setTimeout(()=>statSend({t:'hit',k:'v'}),3000);
{ let was=false; setInterval(()=>{ if(running&&!was){ was=true; if(!NET.client) statSend({t:'hit',k:NET.host?'mp':'m'}); } else if(!running) was=false; },1000); }
{ const seen=new Set(); let n=0; const rep=(msg,src,line)=>{ msg=String(msg||'').slice(0,200); const s=String(src||'').split('/').pop().split('?')[0].slice(0,60),k=msg+s+line; if(!msg||seen.has(k)||++n>5) return; seen.add(k); statSend({t:'err',msg,src:s,line:+line||0}); };
  addEventListener('error',e=>{ if(e&&e.message) rep(e.message,e.filename,e.lineno); });
  addEventListener('unhandledrejection',e=>{ const r=e&&e.reason; rep('(약속 실패) '+(r&&r.message||r),r&&r.stack&&(String(r.stack).match(/\/([\w.-]+\.js)/)||[])[1],0); }); }

/* ── 편의: 글자 크기 · 같은 상대로 다시 ── */
SETTINGS.push({k:'uiz',name:'글자 크기(메뉴)',opts:[['s','작게'],['m','보통'],['l','크게']],note:'메뉴와 창의 글자 · 단추 크기를 바꾼다. 싸움 화면은 그대로다.',apply:()=>uizSet()});
function uizSet(){ document.body.classList.toggle('uiS',OPT.uiz==='s'); document.body.classList.toggle('uiL',OPT.uiz==='l'); }
if(OPT.uiz===undefined) OPT.uiz='m';
try{ const d=JSON.parse(localStorage.getItem('aether1')||'null'); if(d&&d.OPT&&['s','m','l'].includes(d.OPT.uiz)) OPT.uiz=d.OPT.uiz; }catch(x){}
uizSet(); try{ drawOpts(); }catch(x){}
/* 무작위로 정한 판이 끝나면 결과 창에 「같은 상대로 다시」: 방금 나온 캐릭터 그대로 한 판 더 */
{ const b=document.createElement('button'); b.type='button'; b.className='ghost re2'; b.id='again2'; b.textContent='같은 상대로 다시'; b.hidden=true;
  const dock=document.querySelector('#res .dock'); if(dock) dock.insertBefore(b,$('back'));
  b.addEventListener('click',()=>{ const m=sel.meRnd,f=sel.foeRnd; sel.meRnd=false; sel.foeRnd=false; try{ launch(); }finally{ sel.meRnd=m; sel.foeRnd=f; } });
  setInterval(()=>{ const r=$('res'); if(!r||r.hidden) return; b.hidden=!(!NET.client&&!KEEP&&!NET.host&&(sel.meRnd||sel.foeRnd)); },400); }
