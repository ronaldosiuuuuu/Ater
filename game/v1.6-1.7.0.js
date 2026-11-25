"use strict";
/* 1.6.0 ~ 1.7.0: 함께 태그매치 · 첫 판 안내 · 방 정보 */
/* ════════════════ 1.6.0 태그매치를 친구와 함께 ════════════════
   캐릭터마다 주인이 있다: 'host'(방장 · 혼자 할 때의 나) · 손님 pid · 'ai'(컴퓨터).
   한 편에 사람이 한 명이면 그 사람이 셋을 다 몰고, 여럿이면 한 명씩 맡는다(남는 칸은 그 편의 첫 사람 몫).
   교대는 싸우는 캐릭터의 주인이 원하는 캐릭터로 바꾸거나, 대기 중인 캐릭터의 주인이 자기 캐릭터를 들여보낸다(교대 대기시간은 편마다 하나).
   방장이 교대 상태를 상태 묶음(tg)에 실어 보내고, 손님은 교대 요청('tag')을 보낸다. */
const tagAct=tm=>ents.find(o=>o.team===tm&&o.tagOn);
function tagOwn(o){ if(!o) return 'ai'; if(o.net) return o.net.pid; return o.tagOwner||'ai'; }
/* tagHuman() → game/hoisted.js */
function tagMay(who,tm,o){ return tagOwn(tagAct(tm))===who||tagOwn(o)===who; }
/* tagNext() → game/hoisted.js */
/* 주인 정하기: 혼자 할 때는 우리 편이 내 것, 상대 편은 컴퓨터. 함께일 때는 아래 자리 배치에서 정한 대로 */
on('begin',()=>{ if(!TG) return; const solo=!(NET.host&&NET.players.length>1); for(const tm of [0,1]) for(const o of tagAll(tm)){ if(o.tagOwner) continue; o.tagOwner=o.net?o.net.pid:solo&&tm===0?'host':(!solo&&o===me?'host':'ai'); } tagUi(); });
/* 자리 배치(방장): 태그매치에서는 편마다 세 칸을 사람에게 나눠 준다 */
{ const as0=NET.afterSpawn; NET.afterSpawn=function(){ if(!(mode===7&&!practice)) return as0(); if(me&&NET.players.length>1) me.pname=NET.name(); for(const p of others()) p.eid=0;
    for(const tm of [0,1]){ const L=ents.filter(o=>o.team===tm).sort((a,b)=>(a.slot||0)-(b.slot||0)),hum=NET.players.filter(p=>p.team===tm); if(!hum.length) continue;
      const hasHost=hum.some(p=>p.host),gs=hum.filter(p=>!p.host),own=[]; if(hasHost){ own[0]='host'; gs.slice(0,2).forEach((g,i)=>own[i+1]=g.pid); } else if(gs.length===1) own.push(gs[0].pid,gs[0].pid,gs[0].pid); else gs.slice(0,3).forEach((g,i)=>own[i]=g.pid);
      const cap=hasHost?'host':gs[0].pid; for(let i=0;i<L.length;i++) if(!own[i]) own[i]=cap;
      L.forEach((o,i)=>{ const w=own[i]; if(w==='host'){ o.tagOwner='host'; return; } const p=NET.players.find(q=>q.pid===w); if(!p) return; const nth=own.slice(0,i).filter(x=>x===w).length;
        let key=nth===0?(p.re&&CH[p.key+'_r']?p.key+'_r':p.key):(p.tag||[])[nth-1]; if(!key||!CH[key]||!(okKey(key)||CH[key].re&&okKey(CH[key].base))) key=o.key;
        const n=mk(key,tm,o.x,o.y); n.slot=o.slot; n.busy=o.busy; n.net={pid:p.pid,mv:{x:0,y:0},held:{},aim:null}; n.pname=p.name; n.tagOwner=p.pid; ents[ents.indexOf(o)]=n; if(o===foe) foe=n; if(o===me) me=n; if(nth===0) p.eid=n.id; }); } }; }
/* 방장이 손님에게 보내는 교대 상태 */
function tagNet(){ if(!TG) return undefined; const one=o=>[o.id,o.key,Math.round(o.hp),o.max,o.dead?1:0,tagOwn(o)];
  return {a:[0,1].map(tm=>{ const a=tagAct(tm); return a?a.id:0; }),ao:[0,1].map(tm=>tagOwn(tagAct(tm))),b:[TG.bench[0].map(one),TG.bench[1].map(one)],w:[tagWhy(0),tagWhy(1)],ad:[0,1].map(tm=>{ const a=tagAct(tm); return !a||a.dead?1:0; }),k:TG.kills.slice(),p:[0,1].map(tm=>TG.pick[tm]&&!TG.pick[tm].dead?TG.pick[tm].id:0)}; }
/* 교대 요청 처리(방장): 자격 · 대기시간을 보고 바꾼다. 싸우던 캐릭터가 쓰러진 1초 사이면 '다음에 나설 캐릭터'로 정해 둔다 */
function tagAsk(who,id){ if(!TG||over) return ''; let tm=-1,o=null; for(const t of [0,1]){ const x=TG.bench[t].find(q=>q.id===id); if(x){ tm=t; o=x; } } if(!o||o.dead) return '';
  if(!tagMay(who,tm,o)) return '그 캐릭터는 다른 사람 몫이다'; const cur=tagAct(tm); if(!cur||cur.dead){ TG.pick[tm]=o; return '다음에 나설 캐릭터 · '+short(o); } const w=tagWhy(tm); if(w) return '지금은 교대할 수 없다 · '+w; tagSwap(tm,o); return ''; }
{ const hm4=hostMsg; hostMsg=function(pid,d){ if(d&&NET.host&&d.t==='tag'){ const r=tagAsk(pid,+d.id); if(r&&NET.tx) NET.tx.send(pid,{t:'note',text:r}); return; } if(d&&NET.host&&d.t==='pick'){ const p=NET.players.find(x=>x.pid===pid); if(p) p.tag=(Array.isArray(d.tag)?d.tag:[]).filter(k=>okKey(k)).slice(0,2); } return hm4(pid,d); };
  /* 들어온 캐릭터는 다음 상태 묶음에서 모든 정보를 보낸다(손님 화면에 바로 보이게) */
  const ts1=tagSwap; tagSwap=function(tm,nx,forced){ const r=ts1(tm,nx,forced); if(r&&NET.known) NET.known.delete(nx.id); return r; };
  /* 끊긴 손님의 대기 캐릭터는 컴퓨터가 맡고, 다시 들어오면 돌려준다 */
  const hg0=hostGone; hostGone=function(pid){ const p=NET.players.find(x=>x.pid===pid&&!x.host); const act=TG?ents.filter(o=>o.net&&o.net.pid===pid):[]; hg0(pid); act.forEach(o=>{ if(o.tagOwner) o.tagOwner='ai'; }); if(p) tagRelease(pid,p.tok||('~'+pid)); };
  const rs0=reseat; reseat=function(p){ let got=0; if(TG) for(const tm of [0,1]) for(const o of TG.bench[tm]) if(o.left&&p.tok&&o.left===p.tok&&!o.net){ o.net={pid:p.pid,mv:{x:0,y:0},held:{},aim:null}; o.pname=p.name; o.left=null; o.tagOwner=p.pid; got=got||o.id; }
    const had=p.eid; rs0(p); if(TG&&got&&p.eid===had){ p.eid=got; NET.known=new Set(); NET.n=0; NET.mSig=''; const mapKey=Object.keys(MAPS).find(k=>MAPS[k]===MAP)||'basic',o=tagAll(0).concat(tagAll(1)).find(x=>x.id===got); NET.tx.send(p.pid,{t:'start',mode,teamN,map:mapKey,land:LAND,W,H,you:got,team:o?o.team:(p.team===0?0:1),cap:CAPGOAL,diff,mon:''}); toast((p.name||'손님')+' 다시 들어왔다'); } }; }
/* 손님: 받은 교대 상태로 '지금 내가 모는 캐릭터'를 정하고, 아니면 기다린다 */
{ const ap1=apply; apply=function(S){ if(S&&S.tg){ NET.tg=S.tg; const raw=NET.flip?1:0,a=S.tg.a[raw]; NET.you=a&&S.tg.ao[raw]===NET.pid?a:0; } else if(S) NET.tg=null; const prev=me; ap1(S); if(NET.tg&&me&&(!prev||me.id!==prev.id)&&!NET.first) uiBegin(); tagUi(); }; }
/* 교대 칸(방장 · 손님 · 혼자 모두) */
function tagView(){ if(TG&&!NET.client){ const one=o=>({id:o.id,name:short(o),hp:o.hp,max:o.max,dead:!!o.dead,own:tagOwn(o)}); const a0=tagAct(0); return {mine:TG.bench[0].map(one),foes:TG.bench[1].map(one),why:tagWhy(0),aOwn:tagOwn(a0),who:'host',pick:TG.pick[0]&&TG.pick[0].id,wait:!!(me&&(me.net||me.tagOwner&&me.tagOwner!=='host')),adead:!a0||a0.dead}; }
  if(NET.client&&NET.tg){ const t=NET.tg,raw=NET.flip?1:0,one=x=>({id:+x[0]||0,name:hasK(CH,x[1])?CH[x[1]].name.split(', ').pop():String(x[1]||''),hp:+x[2]||0,max:+x[3]||1,dead:!!x[4],own:String(x[5]||'')}),arr=v=>Array.isArray(v)?v.filter(Array.isArray).slice(0,6):[]; return {mine:arr(t.b&&t.b[raw]).map(one),foes:arr(t.b&&t.b[1-raw]).map(one),why:String(t.w&&t.w[raw]||''),aOwn:String(t.ao&&t.ao[raw]||''),who:NET.pid,pick:t.p&&+t.p[raw]||0,wait:!NET.you,adead:!!(t.ad&&t.ad[raw])}; } return null; }
tagUi=function(){ let el=document.getElementById('tagbar'); const V=(running||over)?tagView():null; document.body.classList.toggle('tagwait',!!V&&V.wait&&!over&&!NET.spect); if(!V){ if(el) el.hidden=true; return; }
  if(!el){ el=document.createElement('div'); el.id='tagbar'; document.body.appendChild(el); } el.hidden=!!over; const pc=matchMedia('(pointer:fine)').matches;
  let qi=0; const h=(V.wait?'<span class="tgw">동료 차례</span>':'')+V.mine.map((o,i)=>{ const may=V.aOwn===V.who||o.own===V.who,f=Math.max(0,o.hp/o.max),why=V.adead?'':V.why,st=o.dead?'쓰러짐':V.pick===o.id?'다음':!may?'동료 몫':V.adead?'다음에 나서기':(why||'교대'),key=may&&!o.dead?(qi++?'E':'Q'):''; return '<button type="button" data-tid="'+(+o.id||0)+'"'+(o.dead||!may||why&&V.pick!==o.id?' class="off"':'')+'><b>'+(pc&&key?key+' · ':'')+esc(o.name)+' <small>'+esc(st)+'</small></b><i><u style="width:'+Math.round(f*100)+'%"></u></i></button>'; }).join('')
   +'<span class="tgf">'+V.foes.map(o=>'<em'+(o.dead?' class="off"':'')+'>'+esc(o.name)+' '+(o.dead?'✕':Math.round(o.hp/o.max*100)+'%')+'</em>').join('')+'</span>';
  if(el.__h!==h){ el.__h=h; el.innerHTML=h; } };
{ const st=document.createElement('style'); st.textContent='body.tagwait #btns,body.tagwait #stick{visibility:hidden}#tagbar .tgw{align-self:center;font:700 11px var(--body);color:#fff3cf;background:rgba(40,30,6,.82);border:1px solid var(--gold);border-radius:9px;padding:3px 7px;white-space:nowrap}'; document.head.appendChild(st);
  const ask=id=>{ if(NET.client){ if(NET.tx) NET.tx.send({t:'tag',id}); sfx('ui'); return; } const r=tagAsk('host',id); if(r) toast(r,1600); };
  window.addEventListener('click',e=>{ const b=e.target.closest('#tagbar [data-tid]'); if(!b) return; e.stopImmediatePropagation(); if(!running||over||paused) return; ask(+b.dataset.tid); },true);
  window.addEventListener('keydown',e=>{ if(e.code!=='KeyQ'&&e.code!=='KeyE') return; const V=running&&!over&&!paused?tagView():null; if(!V) return; const a=document.activeElement; if(a&&/INPUT|TEXTAREA/.test(a.tagName)) return; e.stopImmediatePropagation(); const may=V.mine.filter(o=>(V.aOwn===V.who||o.own===V.who)&&!o.dead),o=may[e.code==='KeyQ'?0:1]; if(o&&!o.dead) ask(o.id); },true); }
/* 손님의 보상: 쓰러뜨린 캐릭터 수만큼(방장이 보낸 수로 센다) */
{ const en3=earn; earn=function(win){ if(!(NET.client&&mode===7&&NET.tg)) return en3(win); const g=en3(win); PF.coin-=g.c; PF.star-=g.st; const m=DIFFPAY[typeof NET.hdiff==='number'?NET.hdiff:diff]||1,k=Math.max(0,Math.min(6,Math.floor(+(Array.isArray(NET.tg.k)?NET.tg.k[NET.flip?1:0]:0))||0)); g.c=Math.round(k*TAG.pay*m); g.st=k>=3?1:0; PF.coin+=g.c; PF.star+=g.st; g.note='캐릭터 '+k+'명 쓰러뜨림'; return g; }; }
/* 손님: 방장이 태그매치를 고르면 내 쪽도 3대3으로 맞춰 '우리 팀' 칸 둘을 고를 수 있게 한다(방을 나가면 원래대로) */
{ const cm2=clientMsg; clientMsg=function(d){ cm2(d); if(!d||d.t!=='lobby'||!NET.client) return; NET.hm=d.hm;
    if(d.hm===7&&!(mode===7&&!practice)){ if(!NET.gkeep) NET.gkeep={mode,teamN,practice}; NET.tagSync=true; practice=false; mode=7; teamN=3; try{ modeNote(); drawSel(); }catch(x){} toast('방장이 태그매치를 골랐다 · 캐릭터 탭에서 우리 팀 칸 둘도 고른다',4200); NET.pick(); }
    else if(d.hm!==7&&NET.tagSync){ NET.tagSync=false; const k=NET.gkeep; if(k){ mode=k.mode; teamN=k.teamN; practice=k.practice; try{ modeNote(); drawSel(); }catch(x){} } } };
  const pc0=pickCh; pickCh=function(k){ const r=pc0(k); if((NET.client||NET.host)&&typeof slot==='string'&&slot.slice(0,2)==='al') NET.pick(); return r; };
  /* 모인 사람 명단에 태그 캐릭터 셋을 보여 준다 */
  const dn3=drawNet; drawNet=function(){ dn3(); const tg=NET.host?mode===7&&!practice:NET.client&&NET.hm===7; if(!tg||!(NET.host||NET.client)) return; $('n-list').querySelectorAll('.pl').forEach((el,i)=>{ const p=NET.players[i]; if(!p) return; const L=(p.host&&NET.host?[sel.al[0],sel.al[1]]:(p.tag||[])).filter(k=>k&&CH[k]); const sp=el.querySelectorAll('span')[0]; if(sp&&!sp.dataset.tg){ sp.dataset.tg=1; sp.insertAdjacentHTML('beforeend',' <small style="color:var(--muted)">+ '+(L.length?L.map(k=>CH[k].name.split(', ')[1]).join(' + '):'칸 비움(가진 캐릭터 무작위)')+'</small>'); } }); }; }

/* ════════════════ 1.6.0 첫 판 안내 ════════════════
   에이로 샌드백(비라)을 상대하며 움직이기 → 기본 공격 → 스킬 → 점프 → 궁극기 → 멈춤을 한 단계씩 해 본다.
   단계마다 해당 단추가 빛난다. 처음 끝내면 코인 1,000. 언제든 그만둘 수 있고, 설정 → 도구에서 다시 할 수 있다. */
const TUT={on:false};
const tutPC=()=>matchMedia('(pointer:fine)').matches;
const TSTEP=[
 {t:'움직이기',d:()=>tutPC()?'W · A · S · D로 이리저리 움직여 본다.':'화면 '+(OPT.lefty?'오른쪽':'왼쪽')+' 아래를 누르고 밀면 그쪽으로 걷는다. 이리저리 움직여 본다.',hi:'#stick',ok:()=>TUT.mv>=6},
 {t:'기본 공격',d:()=>tutPC()?'샌드백 가까이 가서 왼쪽 클릭(또는 J)으로 세 번 친다.':'샌드백 가까이 가서 「기본 공격」 단추로 세 번 친다. 누르고 있으면 계속 친다.',hi:'.sk[data-s="b"]',ok:()=>TUT.hits>=3},
 {t:'스킬',d:()=>'스킬 단추를 하나 써 본다. 단추의 숫자는 다시 쓰기까지 기다리는 초다.'+(tutPC()?' (1 · 2 · 3, 마우스로 조준)':' 단추를 누른 채 밀면 쓸 방향을 정한다.'),hi:'.sk[data-s="n1"]',ok:()=>TUT.sk},
 {t:'점프',d:()=>(tutPC()?'Space로':'「점프」 단추로')+' 뛰어 본다. 땅을 타고 오는 공격은 뛰어서 피할 수 있다.',hi:'.sk[data-s="jump"]',ok:()=>TUT.jp},
 {t:'궁극기',d:()=>'궁극기는 단추 아래 적힌 조건을 채워야 쓸 수 있고, 발밑의 금색 고리가 차면 준비된 것이다. 지금은 조건 없이 한 번 써 본다.'+(tutPC()?' (4)':''),hi:'.sk[data-s="ult"]',ok:()=>TUT.ult,enter:()=>{ pFree=true; $('p-free').textContent='궁극기 조건 무시: 켬'; }},
 {t:'멈춤',d:()=>(document.body.classList.contains('land')?'위쪽 가운데':'오른쪽 위')+' ≡ 단추'+(tutPC()?'(또는 Esc)':'')+'로 언제든 멈추고 내 · 상대 스킬 원문을 볼 수 있다. 한 번 열었다가 「계속」으로 돌아온다.',hi:'#menu',ok:()=>TUT.menu&&$('pause').hidden}
];
function tutStart(){ if(NET.host||NET.client) return toast('친구와 함께 하는 중에는 할 수 없다'); if(running||TUT.on||TUT.active||(typeof starting!=='undefined'&&starting)) return;
  keepSet(); TUT.keep={sandHp,sandInf,sandAct}; setMode(0); sel.me='ei'; sel.meR=false; sel.foe='vira'; sel.foeR=false; sandInf=true; sandAct=0; OPT.map='basic';
  Object.assign(TUT,{on:true,active:true,i:0,real:0,paid:false,mv:0,hits:0,sk:false,jp:false,ult:false,menu:false,menuOpen:false,lx:null,ly:null,doneT:0}); $('tower').hidden=true; launch(); }
function tutEnd(){ TUT.on=false; const c=document.getElementById('coach'); if(c) c.remove(); document.querySelectorAll('.coach-hi').forEach(x=>x.classList.remove('coach-hi')); }
/* 빌려 온 설정(방식 · 캐릭터 · 맵 · 샌드백)을 되돌린다. 방식 단추 · 연습 칸 · 싸우기 단추 글자까지 */
function tutRestore(){ if(!TUT.active) return; TUT.active=false; if(TUT.keep){ sandHp=TUT.keep.sandHp; sandInf=TUT.keep.sandInf; sandAct=TUT.keep.sandAct; TUT.keep=null; } keepBack(); try{ setMode(practice?0:mode); $('sinf').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.v===(sandInf?1:0))); $('sact').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.v===sandAct)); drawSel(); }catch(x){} }
function tutDraw(){ let el=document.getElementById('coach'); if(!TUT.on||!running){ if(el) el.remove(); return; } if(!el){ el=document.createElement('div'); el.id='coach'; document.body.appendChild(el);
    el.addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; e.stopPropagation(); if(b.dataset.c==='skip'){ tutNext(); } else if(b.dataset.c==='quit'||b.dataset.c==='done'){ tutQuit(); } else if(b.dataset.c==='more'){ tutEnd(); toast('계속 연습한다 · ≡ 단추의 그만두기로 끝낸다',3000); } }); }
  document.querySelectorAll('.coach-hi').forEach(x=>x.classList.remove('coach-hi'));
  if(TUT.i>=TSTEP.length){ const h='<b>다 해 봤다!</b><p>이제 대전 화면에서 「싸우기」를 누르면 컴퓨터와 겨룬다. 3대3 태그매치(셋이서 교대), 레이드(보스), 등반(층 오르기), 이야기도 있다.'+(TUT.paid?' <em>코인 +1,000</em>':PF.tut?'':' <em style="color:var(--muted)">(건너뛰지 않고 넷 이상 해내면 코인 +1,000)</em>')+'</p><div><button type="button" data-c="done" class="cg">끝내기</button><button type="button" data-c="more">계속 연습</button></div>'; if(el.__h!==h){ el.__h=h; el.innerHTML=h; } return; }
  const S=TSTEP[TUT.i],hi=document.querySelector(S.hi); if(hi) hi.classList.add('coach-hi');
  const h='<small>첫 판 안내 · '+(TUT.i+1)+' / '+TSTEP.length+'</small><b>'+S.t+'</b><p>'+S.d()+'</p><div><button type="button" data-c="skip">건너뛰기</button><button type="button" data-c="quit">그만두기</button></div>'; if(el.__h!==h){ el.__h=h; el.innerHTML=h; } }
function tutNext(){ TUT.i++; sfx('win'); if(TUT.i<TSTEP.length&&TSTEP[TUT.i].enter) TSTEP[TUT.i].enter(); if(TUT.i>=TSTEP.length&&!PF.tut&&TUT.real>=4){ PF.tut=Date.now(); PF.coin+=1000; TUT.paid=true; pfSave(); } tutDraw(); }
function tutQuit(){ const wasRun=running; tutEnd(); if(wasRun&&!over){ $('pause').hidden=true; paused=false; over={winner:null,t:now}; showResult(); } else tutRestore(); }
on('begin',()=>{ if(!TUT.on) return; if(typeof GD!=='undefined') GD.on=false; if(foe){ foe.x=Math.max(1.5,me.x-3.2); foe.y=me.y; clamp(foe); } TUT.lx=me.x; TUT.ly=me.y; tutDraw(); });
on('hit',(s,t,amt,label,o)=>{ if(TUT.on&&s===me&&o&&o.basic) TUT.hits++; });
on('cast',(e,slot)=>{ if(!TUT.on||e!==me) return; if(slot==='ult') TUT.ult=true; else if(['n1','n2','aw','x1','x2','x3','x4'].includes(slot)) TUT.sk=true; });
on('step',()=>{ if(!TUT.on||!me) return; if(Math.hypot(stick.x,stick.y)>.2&&TUT.lx!=null) TUT.mv+=Math.hypot(me.x-TUT.lx,me.y-TUT.ly); TUT.lx=me.x; TUT.ly=me.y; 
  if(TUT.i<TSTEP.length&&TSTEP[TUT.i].ok()){ TUT.real++; tutNext(); } TUT.uT=(TUT.uT||0)-1; if(TUT.uT<=0){ TUT.uT=10; tutDraw(); } });
document.addEventListener('click',e=>{ if(TUT.on&&e.target.closest('#menu')&&TSTEP[TUT.i]&&TSTEP[TUT.i].t==='멈춤') TUT.menu=true; },true);
/* 멈춤 화면에서 「계속」으로 돌아오면 멈춤 단계가 끝난다 */
document.addEventListener('click',e=>{ if(TUT.on&&e.target.closest('#p-resume')&&TUT.menu&&TUT.i<TSTEP.length&&TSTEP[TUT.i].t==='멈춤') setTimeout(()=>{ if(TUT.on&&TSTEP[TUT.i]&&TSTEP[TUT.i].ok()){ TUT.real++; tutNext(); } },50); });
{ const sr10=showResult; showResult=function(){ const was=TUT.active; if(TUT.on) tutEnd(); const r=sr10(); if(was){ tutRestore(); $('res').hidden=true; $('sel').hidden=false; goPage('play'); hubCard(); } return r; }; }
{ const st=document.createElement('style'); st.textContent='body.land #coach{left:auto;right:max(12px,env(safe-area-inset-right));transform:none;width:min(42vw,330px);padding:8px 10px}body.land #coach b{font-size:14.5px}body.land #coach p{font-size:12px}'
   +'#coach{position:fixed;left:50%;transform:translateX(-50%);z-index:4;width:min(92vw,420px);padding:10px 12px 9px;border:1px solid var(--gold);border-radius:6px 16px 6px 16px;background:rgba(10,15,36,.94);box-shadow:0 0 30px rgba(227,195,119,.2);color:var(--ink)}'
   +'#coach small{display:block;font:700 10.5px var(--mono);letter-spacing:.12em;color:var(--gold)}#coach b{display:block;font:700 16px var(--display);margin:2px 0 3px}#coach p{margin:0;font-size:13px;line-height:1.5;color:#d5dbf5}#coach p em{font-style:normal;color:var(--gold);font-weight:700}'
   +'#coach div{display:flex;gap:6px;justify-content:flex-end;margin-top:8px}#coach button{border:1px solid var(--line);border-radius:8px;background:var(--panel);color:var(--ink);font:600 12.5px var(--body);padding:6px 12px;min-height:34px}#coach button.cg{border-color:var(--gold);background:linear-gradient(180deg,#f0d696,var(--gold));color:#1b1404;font-weight:800}'
   +'.coach-hi{outline:3px solid #ffd36b!important;outline-offset:3px;animation:coachp 1s ease-in-out infinite}@keyframes coachp{50%{outline-color:rgba(255,211,107,.25)}}'
   +'.hub .tut{display:flex;align-items:center;gap:10px;width:100%;margin:0 0 10px;padding:10px 12px;border:1px solid var(--gold);border-radius:10px;background:linear-gradient(90deg,rgba(227,195,119,.18),rgba(227,195,119,.04));color:var(--ink);font:inherit;text-align:left}.hub .tut b{font:700 14.5px var(--display);color:#fff3cf}.hub .tut small{color:var(--muted);font-size:11.5px;display:block}.hub .tut i{margin-left:auto;font-style:normal;color:var(--gold);font-size:18px}';
  document.head.appendChild(st);
  /* 들어가는 곳: 모험 칸 맨 위(처음 끝낼 때까지) · 첫 방문 안내 화면 · 설정 → 도구 */
  const hc2=hubCard; hubCard=function(){ hc2(); const el=$('twcard'); if(!el||PF.tut||(PF.w+PF.l)>=5) return; const h=el.querySelector('.hubh'); if(h&&!el.querySelector('#hub-tut')) h.insertAdjacentHTML('afterend','<button type="button" class="tut" id="hub-tut"><span><b>처음이라면 · 첫 판 안내</b><small>1분 · 조작을 한 판 안에서 하나씩 해 본다 · 코인 1,000</small></span><i>▶</i></button>'); }; hubCard();
  const wd=$('w-close'); if(wd){ wd.className='ghost'; wd.textContent='나중에'; wd.insertAdjacentHTML('beforebegin','<button class="go" id="w-tut" type="button">첫 판 안내로 시작 (1분)</button>'); }
  const tl=$('tools'); if(tl){ const b=document.createElement('button'); b.className='tool'; b.id='tutb'; b.type='button'; b.innerHTML='<b>첫 판 안내</b><small>조작을 한 판 안에서 배운다</small>'; tl.insertBefore(b,tl.firstChild); }
  document.addEventListener('click',e=>{ const t=e.target.closest('#hub-tut,#w-tut,#tutb'); if(!t) return; if(t.id==='w-tut'){ $('welcome').hidden=true; try{ localStorage.setItem('aetherSeen','1'); }catch(x){} } tutStart(); }); }

/* ════════════════ 1.7.0 함께 하기를 편하게 ════════════════
   ① 모든 탭에 방 정보 띠: 방 코드 · 방장이 정한 판 · 준비 수 · 편마다 사람(이름 · 고른 캐릭터 · 태그 셋 · 준비)
   ② 대전 탭의 '함께 하는 방' 칸: 방장이 정한 판 · 채팅(빠른 문구) · 방장의 빠른 동작. 방에 있는 동안은 쓸 수 없는 모험 칸을 숨긴다
   ③ 손님의 큰 단추 = 준비. 방장은 아직 준비 안 한 사람이 있으면 한 번 더 눌러 시작. 결과 화면의 '다시'도 같다
   ④ 들어옴 · 나감 · 캐릭터 · 편 · 준비가 바뀌면 알린다. 모두 준비되면 방장에게 알린다
   ⑤ 싸움 중 빠른 채팅 단추 · 방 코드 눌러 복사 · 다른 사람이 고른 캐릭터 표시 · 방장은 사람을 눌러 편을 바꾼다 */
const inRoom=()=>!!(NET.host||NET.client)&&NET.players.length>0;
const myP=()=>NET.players.find(p=>NET.host?p.host:p.pid===NET.pid);
const pName=k=>CH[k]?CH[k].name.split(', ').pop():'';
/* roomHS() → game/hoisted.js */
const RQ=['ㄱㄱ','잠깐만','한 판 더?','좋은 판!','캐릭터 바꿀게','준비됐다'];
NET.chatLog=[];
function chatSend(text){ const t=cleanText(text,80); if(!t||!NET.tx) return; if(NET.host){ const m={t:'chat',name:NET.name(),team:0,text:t,pid:'host'}; sendAll(m); chatShow(m); } else NET.tx.send({t:'chat',text:t}); }
function readyToggle(){ if(!NET.client||!NET.tx) return; const mine=myP(),on=!(mine&&mine.ready); if(mine) mine.ready=on; NET.tx.send({t:'rdy',on}); sfx('ui'); drawNet(); }
/* 방 정보 띠 */
function roomDraw(){ let el=document.getElementById('roomb'); const on=inRoom()&&!running; document.body.classList.toggle('inroom',on); document.body.classList.toggle('guest',on&&!!NET.client);
  if(!el){ const vs=document.querySelector('#sel .main .vs'); if(!vs) return; el=document.createElement('div'); el.id='roomb'; vs.insertAdjacentElement('afterend',el); el.addEventListener('click',roomClick); }
  el.hidden=!on; if(!on) return; const mine=myP(),my=mine?mine.team:0,hs=NET.host?roomHS():(NET.hs||{}),tagOn=NET.host?(mode===7&&!practice):NET.hm===7,[r,n]=readyN();
  const chip=p=>{ const k=p.re&&CH[p.key+'_r']?p.key+'_r':p.key,tl=(p.host&&NET.host?[sel.al[0],sel.al[1]]:(p.tag||[])).filter(x=>x&&CH[x]); return '<button type="button" class="rchip'+(p===mine?' me':'')+(p.host||p.ready?' ok':'')+'" data-pid="'+esc(p.pid||'host')+'"><b>'+(p.host?'♛ ':'')+esc(p.name||'손님')+(p===mine?' · 나':'')+'</b><span>'+esc(pName(k))+(p.done&&p.done===p.key&&!p.re?' ★':'')+(tagOn?' + '+(tl.length?tl.map(pName).join(' + '):'무작위 둘'):'')+'</span><i>'+(p.host?'방장':p.ready?'✔ 준비':'준비 중')+'</i></button>'; };
  const row=t=>{ const L=NET.players.filter(p=>p.team===t),cpu=hs.m===6?(t===my?'':'보스'+(hs.mon?' · '+esc(hs.mon):'')):'컴퓨터'; return '<div class="rrow2'+(t!==my?' foe':'')+'"><em>'+(t===my?'우리 편':'상대 편')+'</em>'+(L.length?L.map(chip).join(''):'')+(!L.length&&cpu?'<span class="rcpu">'+cpu+'</span>':'')+'</div>'; };
  const h='<div class="rhd"><b>방 '+esc(NET.code||'')+'</b><span>'+esc(hs.sum||'')+'</span><span class="rr">'+(n?'준비 '+r+'/'+n:'혼자 있다 · 초대 링크로 부른다')+'</span></div>'+row(my)+row(1-my);
  if(el.__h!==h){ el.__h=h; el.innerHTML=h; } roomCard(); }
function roomClick(e){ const b=e.target.closest('.rchip'); if(!b) return; const pid=b.dataset.pid,mine=myP(),p=NET.players.find(q=>(q.pid||'host')===pid); if(!p) return;
  if(p===mine){ slot='me'; goPage('chars'); return; }
  if(NET.host&&!p.host){ p.team=p.team?0:1; p.prevTeam=null; lobbyOut(); toast((p.name||'손님')+' → '+(p.team?'상대 편':'방장 편'),1800); sfx('ui'); return; }
  toast(NET.host?'방장은 자기 편을 바꿀 수 없다':'캐릭터와 편은 그 사람(편은 방장)이 고른다',1800); }
/* 대전 탭의 '함께 하는 방' 칸 */
function roomCard(){ const sec=document.querySelector('section[data-page="play"]'); if(!sec) return; let el=document.getElementById('roomc'); const on=inRoom()&&!running;
  if(!el){ el=document.createElement('div'); el.id='roomc'; el.className='bcard'; const tw=$('twcard'); (tw||sec.firstChild).insertAdjacentElement('beforebegin',el);
    el.addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; if(b.dataset.rq!==undefined){ chatSend(RQ[+b.dataset.rq]); return; } if(b.id==='rc-go'){ const i=$('rc-in'); chatSend(i.value); i.value=''; return; }
      const qa=b.dataset.qa; if(!qa||!NET.host) return; if(qa==='invite'){ const sh=$('n-share'); if(sh) sh.click(); return; } if(qa==='raid') $('n-qraid').click(); else if(qa==='tower') $('n-qtower').click(); else if(qa==='split'){ NET.players.forEach((p,i)=>{ p.team=i%2; p.prevTeam=null; }); roomFitN(Math.ceil(NET.players.length/2)); lobbyOut(); toast('편을 고루 나눴다',1600); } else if(qa==='same'){ NET.players.forEach(p=>{ p.team=0; p.prevTeam=null; }); roomFitN(NET.players.length); lobbyOut(); toast('모두 같은 편 · 컴퓨터와 겨룬다',1800); } });
    el.addEventListener('keydown',e=>{ if(e.key==='Enter'&&e.target.id==='rc-in'){ e.preventDefault(); chatSend(e.target.value); e.target.value=''; } }); }
  el.hidden=!on; if(!on) return; const hs=NET.host?roomHS():(NET.hs||{}),log=NET.chatLog.slice(-4),mine=myP();
  const h='<div class="rch"><b>함께 하는 방</b><span>'+(NET.host?'방식 · 맵은 아래에서 내가 고른다':'방장이 정한 판')+'</span></div><p class="rsum">'+esc(hs.sum||'')+'</p>'
   +(NET.host&&NET.players.length<2?'<div class="row rqa"><button type="button" data-qa="invite" class="go" style="min-height:44px;font-size:15px;letter-spacing:.1em">초대 링크 보내기</button></div>':'')
   +(NET.host?'<div class="row rqa"><button type="button" data-qa="split">편 고루 나누기</button><button type="button" data-qa="same">모두 같은 편</button><button type="button" data-qa="raid">함께 레이드</button><button type="button" data-qa="tower">함께 등반</button></div>':'<p class="note" style="margin:6px 0 0">아래 「준비하기」를 누르면 방장 화면에 ✔가 뜬다. 캐릭터는 캐릭터 탭에서 바꾼다.</p>')
   +'<div class="rlog">'+(log.length?log.map(m=>'<div><b style="color:rgb('+TC[mine&&m.team!==mine.team?1:0]+')">'+esc(m.name||'')+'</b> '+esc(m.text)+'</div>').join(''):'<div class="none">채팅이 여기에 뜬다</div>')+'</div>'
   +'<div class="rqk">'+RQ.map((t,i)=>'<button type="button" data-rq="'+i+'">'+t+'</button>').join('')+'</div>'
   +'<div class="row rin"><input id="rc-in" type="text" maxlength="80" placeholder="채팅 · Enter로 보낸다" autocomplete="off"><button type="button" id="rc-go">보내기</button></div>';
  /* 입력 중이면 칸을 다시 그리지 않는다(쓰던 글이 지워지지 않게) */ const typing=document.activeElement&&document.activeElement.id==='rc-in';
  if(el.__h!==h&&!typing){ const v=$('rc-in')?$('rc-in').value:''; el.__h=h; el.innerHTML=h; if(v) $('rc-in').value=v; } else if(typing&&el.__h!==h){ const lg=el.querySelector('.rlog'),tmp=document.createElement('div'); tmp.innerHTML=h; const nl=tmp.querySelector('.rlog'); if(lg&&nl) lg.innerHTML=nl.innerHTML; } }
/* 채팅: 대기실에서는 '함께 하는 방' 칸에, 싸우는 중에는 왼쪽 아래에 뜬다 */
{ const cs0=window.chatShow; window.chatShow=m=>{ if(!m||!m.text) return; NET.chatLog.push({name:m.name,text:String(m.text).slice(0,80),team:m.team}); if(NET.chatLog.length>30) NET.chatLog.shift(); if(running) cs0(m); else { roomCard(); if(page!=='play'){ toast('💬 '+(m.name||'')+': '+String(m.text).slice(0,40),2400); } sfx('ui'); } }; }
/* 알림: 대기실 명단이 바뀌면(들어옴 · 나감 · 캐릭터 · 편 · 준비) */
function roomDiff(){ const cur=new Map(NET.players.map(p=>[p.pid||'host',{name:p.name||'손님',key:p.key,team:p.team,ready:!!p.ready}])),prev=roomDiff.prev,mine=myP(),me0=mine?(mine.pid||'host'):''; roomDiff.prev=cur; const fresh=roomDiff.code!==NET.code; roomDiff.code=NET.code; if(!prev||fresh||!prev.size||running) return; const out=[]; { const a=prev.get(me0),b=cur.get(me0); if(a&&b&&a.team!==b.team) out.push('내 편이 바뀌었다 → '+(b.team===0?'방장 편':'상대 편')); }
  for(const [id,p] of cur){ if(id===me0) continue; const q=prev.get(id); if(!q){ out.push(p.name+' 들어왔다'); continue; } if(q.key!==p.key) out.push(p.name+' → '+pName(p.key)); if(q.team!==p.team) out.push(p.name+' → '+(mine&&p.team===mine.team?'우리 편':'상대 편')); if(!q.ready&&p.ready&&!NET.host) out.push(p.name+' 준비 완료'); }
  for(const [id,q] of prev) if(!cur.has(id)&&id!==me0) out.push(q.name+' 나갔다');
  if(out.length){ toast(out.join(' · '),2600); sfx('ui'); } }
{ const dn4=drawNet; drawNet=function(){ dn4(); const on=NET.host||NET.client; if(!on){ roomDiff.prev=null; roomDraw(); return; } roomDiff(); roomDraw();
    /* 큰 단추 · 결과 화면 단추 이름 */ if(!running){ const mine=myP(),[r,n]=readyN(); if(NET.client){ $('start').textContent=mine&&mine.ready?'✔ 준비 완료':'준비하기'; $('netbar').textContent+=mine&&mine.ready?' · 방장이 시작하면 함께 들어간다':' · 준비하기를 눌러 알린다'; $('again').textContent=mine&&mine.ready?'✔ 준비 완료':'한 판 더 · 준비'; } else if(NET.host&&n){ $('again').textContent='다시 · 준비 '+r+'/'+n; } }
    /* 함께 탭 명단: 방장은 사람을 눌러 편을 바꾼다 */ if(NET.host){ const L=$('n-list'); if(L&&!L.dataset.rt){ L.dataset.rt=1; L.addEventListener('click',e=>{ const row=e.target.closest('.pl'); if(!row||!NET.host) return; const i=[...L.querySelectorAll('.pl')].indexOf(row),p=NET.players[i]; if(!p||p.host) return; p.team=p.team?0:1; p.prevTeam=null; lobbyOut(); toast((p.name||'손님')+' → '+(p.team?'상대 편':'방장 편'),1800); }); } if(L&&!$('n-lhint')) L.insertAdjacentHTML('afterend','<p class="note" id="n-lhint" style="margin-top:4px">방장은 사람을 눌러 편을 바꾼다. 내보내기는 두 번 누른다.</p>'); } }; }
/* 손님: 방장이 정한 판 정보를 받는다 */
{ const cm3=clientMsg; clientMsg=function(d){ if(d&&d.t==='lobby') NET.hs=d.hs||NET.hs; const r=cm3(d); if(d&&d.t==='lobby'&&NET.client) try{ drawSum(); }catch(x){} return r; }; }
/* 방장: 방식 · 맵 · 실력을 바꾸면 손님에게 바로 알린다 */
{ const sv2=save; save=function(){ const r=sv2(); if(NET.host&&NET.tx&&!running){ clearTimeout(save.t); save.t=setTimeout(()=>{ try{ lobbyOut(); }catch(x){} },150); } return r; }; }
/* 모두 준비되면 방장에게 알린다 */
{ const hm5=hostMsg; hostMsg=function(pid,d){ const r=hm5(pid,d); if(d&&d.t==='rdy'&&NET.host&&!running){ const [a,n]=readyN(); if(n&&a===n) setTimeout(()=>{ toast('모두 준비됐다 · 싸우기를 누른다',2800); sfx('win'); },300); } return r; }; }
/* 큰 단추: 손님 = 준비, 방장 = 아직 준비 안 한 사람이 있으면 한 번 더 눌러 시작 */
{ let arm=0; const confirmStart=()=>{ const [r,n]=readyN(); if(n&&r<n&&performance.now()>arm){ arm=performance.now()+2600; toast('아직 준비 안 한 사람이 있다 ('+r+'/'+n+') · 한 번 더 누르면 시작',2600); return false; } arm=0; return true; };
  const st0=$('start').onclick; $('start').onclick=function(e){ if(NET.client&&inRoom()){ readyToggle(); return; } if(NET.host&&inRoom()&&!practice&&!confirmStart()) return; return st0.call(this,e); };
  const ag0=$('again').onclick; $('again').onclick=function(e){ if(NET.client&&inRoom()){ readyToggle(); return; } if(NET.host&&inRoom()&&!confirmStart()) return; return ag0.call(this,e); }; }
/* 방장 화면의 '상대' 칸: 상대 편에 사람이 있으면 그 사람의 캐릭터를 보여 준다(누르면 안내) */
{ const ds2=drawSel; drawSel=function(){ ds2(); const f=$('slot-foe'); if(!f) return; f.classList.remove('humanfoe'); { const em=f.querySelector('em'); if(em&&em.textContent==='상대 편 · 사람') em.textContent='상대'; } if(NET.host&&inRoom()&&mode!==6){ const L=NET.players.filter(p=>p.team===1); if(L.length&&f.querySelector('b')){ f.classList.add('humanfoe'); f.querySelector('em').textContent='상대 편 · 사람'; f.querySelector('b').textContent=L.map(p=>pName(p.key)).join(' · '); f.querySelector('span').textContent=L.map(p=>p.name||'손님').join(' · '); } }
    /* 다른 사람이 고른 캐릭터에 이름표 */ if(inRoom()){ const mine=myP(); for(const p of NET.players){ if(p===mine||!p.key) continue; document.querySelectorAll('#list .ch button.pick[data-k="'+CSS.escape(String(p.key))+'"] .ttl').forEach(t=>{ if(!t.querySelector('.rpick')) t.insertAdjacentHTML('beforeend','<span class="rpick">'+esc(p.name||'손님')+'</span>'); }); } } };
  document.addEventListener('click',e=>{ if(!e.target.closest('#slot-foe')||!$('slot-foe').classList.contains('humanfoe')) return; e.stopImmediatePropagation(); e.preventDefault(); toast('상대 편은 그 사람이 직접 고른다',1800); },true); }
/* 방 코드를 누르면 복사 */
{ const c=$('n-code'); if(c){ c.style.cursor='pointer'; c.title='눌러서 복사'; c.addEventListener('click',()=>{ const t=NET.code; if(!t) return; try{ navigator.clipboard.writeText(t).then(()=>toast('방 코드 '+t+' 복사했다',1600),()=>toast('방 코드 · '+t,2000)); }catch(x){ toast('방 코드 · '+t,2000); } }); } }
/* 싸우는 중 빠른 채팅(휴대폰 · PC 모두) */
{ const b=document.createElement('button'); b.id='qcb'; b.type='button'; b.textContent='💬'; b.setAttribute('aria-label','빠른 채팅'); document.body.appendChild(b); const pop=document.createElement('div'); pop.id='qcp'; pop.hidden=true; pop.innerHTML=RQ.map((t,i)=>'<button type="button" data-q="'+i+'">'+t+'</button>').join(''); document.body.appendChild(pop);
  b.addEventListener('click',e=>{ e.stopPropagation(); pop.hidden=!pop.hidden; }); pop.addEventListener('click',e=>{ const q=e.target.closest('[data-q]'); if(!q) return; e.stopPropagation(); chatSend(RQ[+q.dataset.q]); pop.hidden=true; });
  document.addEventListener('pointerdown',e=>{ if(!pop.hidden&&!e.target.closest('#qcp,#qcb')) pop.hidden=true; },true);
  setInterval(()=>{ const on=running&&!over&&inRoom(); b.style.display=on?'block':'none'; if(!on) pop.hidden=true; },300); }
{ const st=document.createElement('style'); st.textContent=[
  '#roomb{margin:8px 0 4px;padding:8px 10px;border:1px solid var(--line);border-radius:12px;background:rgba(6,9,23,.55)}#roomb[hidden]{display:none}',
  '#roomb .rhd{display:flex;gap:8px;align-items:baseline;flex-wrap:wrap;font-size:12px;color:var(--muted)}#roomb .rhd b{color:var(--gold);font:700 12.5px var(--mono);letter-spacing:.08em}#roomb .rhd .rr{margin-left:auto;color:var(--ok);font-weight:700}',
  '#roomb .rrow2{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:6px}#roomb .rrow2 em{font-style:normal;font:700 11px var(--body);color:#8fe9ff;min-width:42px}#roomb .rrow2.foe em{color:#ff9aa5}',
  '.rchip{display:flex;flex-direction:column;align-items:flex-start;gap:1px;padding:4px 9px;border:1px solid var(--line);border-left:3px solid #8fe9ff;border-radius:3px 10px 10px 3px;background:var(--panel);color:var(--ink);font:inherit;min-height:42px;max-width:100%;text-align:left}.foe .rchip{border-left-color:#ff7d8c}',
  '.rchip.me{box-shadow:0 0 0 1px var(--aether) inset}.rchip b{font:700 12.5px var(--body)}.rchip span{font-size:11.5px;color:#cfd6ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:62vw}.rchip i{font-style:normal;font-size:10.5px;color:var(--muted)}.rchip.ok i{color:var(--ok)}',
  '.rcpu{font-size:12px;color:var(--muted);padding:6px 10px;border:1px dashed var(--line);border-radius:8px}',
  'body.land.inroom .main{grid-template-rows:auto auto 1fr}body.land #roomb{grid-column:1 / -1;grid-row:2;margin:0 12px 6px}body.land.inroom .pages{grid-row:3}body.land.inroom.guest #roomb{grid-column:1;grid-row:1;margin:8px 8px 6px 12px}body.land.inroom.guest .main{grid-template-rows:auto 1fr}body.land.inroom.guest .pages{grid-row:2}'
  +'body.land #roomb{padding:6px 8px}body.land #roomb .rrow2{margin-top:4px}body.land .rchip{min-height:36px;flex-direction:row;align-items:baseline;gap:6px}',
  'body.inroom #twcard{display:none}body.inroom.guest #sel .vs{display:none}body.inroom.guest details.acc,body.inroom.guest #freeh{display:none}',
  '#roomc{margin-top:14px}#roomc[hidden]{display:none}#roomc .rch{display:flex;align-items:baseline;gap:8px}#roomc .rch b{font:700 15px var(--display)}#roomc .rch span{font-size:12px;color:var(--muted)}#roomc .rsum{margin:6px 0 0;font:700 14px var(--body);color:#fff3cf}',
  '#roomc .rqa{margin-top:8px;flex-wrap:wrap}#roomc .rqa button{flex:1 1 40%}',
  '#roomc .rlog{margin-top:10px;padding:6px 8px;border:1px solid var(--line);border-radius:8px;background:rgba(6,9,23,.5);font-size:13px;line-height:1.5;min-height:34px;max-height:96px;overflow:auto}#roomc .rlog .none{color:var(--muted);font-size:12px}#roomc .rlog b{margin-right:4px}',
  '#roomc .rqk{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}#roomc .rqk button{border:1px solid var(--line);border-radius:16px;background:var(--panel);color:var(--ink);font:600 12.5px var(--body);padding:6px 12px;min-height:34px}',
  '#roomc .rin{margin-top:8px;flex-wrap:nowrap}#roomc .rin input{flex:1 1 0;min-width:0;min-height:40px}#roomc .rin button{flex:none;padding:0 14px}',
  '.rpick{margin-left:6px;font:700 10.5px var(--body);color:#1b1404;background:#e3c377;border-radius:8px;padding:1px 6px}',
  '#slot-foe.humanfoe{border-style:dashed}',
  '#qcb{position:fixed;display:none;top:calc(8px + env(safe-area-inset-top));right:calc(max(8px,calc((100vw - 520px)/2 + 8px)) + 52px);z-index:3;width:44px;height:44px;border:1px solid var(--line);border-radius:10px;background:var(--panel);font-size:18px}',
  'body.pc #qcb{right:calc(max(8px,calc((100vw - 1180px)/2 + 8px)) + 52px)}body.land #qcb{right:auto;left:calc(50% + 28px);top:calc(5px + env(safe-area-inset-top));background:rgba(23,32,71,.8)}',
  '#qcp{position:fixed;z-index:6;top:calc(58px + env(safe-area-inset-top));right:max(8px,calc((100vw - 520px)/2 + 8px));display:flex;flex-direction:column;gap:4px;padding:6px;border:1px solid var(--line);border-radius:10px;background:rgba(10,15,36,.96)}#qcp[hidden]{display:none}body.pc #qcp{right:max(8px,calc((100vw - 1180px)/2 + 8px))}body.land #qcp{right:auto;left:calc(50% - 40px);top:calc(54px + env(safe-area-inset-top))}',
  '#qcp button{border:1px solid var(--line);border-radius:8px;background:var(--panel);color:var(--ink);font:600 13px var(--body);padding:7px 14px;min-height:36px;text-align:left}'
 ].join(''); document.head.appendChild(st); }
/* 방에서 나가면 띠 · 칸을 정리하고, 탭을 옮길 때마다 새로 그린다 */
{ const gp5=goPage; goPage=function(p){ gp5(p); roomDraw(); }; roomDraw(); }

/* 결과 화면이 뜰 때도 '다시' 단추에 준비 상태를 붙인다 */
{ const sr11=showResult; showResult=function(){ const r=sr11(); if(inRoom()) setTimeout(()=>{ if(!running) drawNet(); },0); return r; }; }
/* 손님 아래쪽 요약 줄은 방장이 정한 판으로 */
{ const dsm=drawSum; drawSum=function(){ dsm(); if(NET.client&&inRoom()&&NET.hs&&NET.hs.sum){ const el=$('sumline'); if(el) el.textContent='방장이 정한 판 · '+NET.hs.sum; } }; }
/* 싸움 중 빠른 채팅 단추 자리만큼 체력 줄을 비켜 준다 */
setInterval(()=>{ const q=document.getElementById('qcb'); document.body.classList.toggle('qchat',!!q&&q.style.display==='block'); },300);
{ const st=document.createElement('style'); st.textContent='body.qchat:not(.land) #hud{padding-right:106px}body.land.qchat #hud{column-gap:104px}body.land.qchat #menu{margin-left:-48px}body.land.qchat #qcb{left:calc(50% + 4px)}'; document.head.appendChild(st); }
/* 방에서 나가면 채팅 기록 · 방 정보를 비운다 */
{ const nl2=netLeave; netLeave=function(q){ const r=nl2(q); NET.chatLog=[]; NET.hs=null; NET.hm=0; roomDiff.prev=null; roomDraw(); try{ drawSum(); hubCard(); }catch(x){} return r; }; }

