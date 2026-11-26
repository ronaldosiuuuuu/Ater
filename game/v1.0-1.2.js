"use strict";
/* 1.0.0 ~ 1.2.2: 재림 · 파편 · 닉네임 · 패치 내역(PATCH) · 가방 · 보상 */
/* ════════════════ 1.0.0 ════════════════ */
/* ── 재림 캐릭터의 몸: 원래 캐릭터보다 체력 +50, 기본 공격 +2 ── */
for(const k of Object.keys(CH)){ const c=CH[k]; if(!c.re||!CH[c.base]) continue; const b=CH[c.base]; if(c.hp===b.hp) c.hp=b.hp+50; if(c.atk===b.atk) c.atk=b.atk+2; }

/* ── 뽑기: 캐릭터 대신 파편이 3~5개 나온다. 파편 10개가 모이면 캐릭터가 되고, 이미 가진 캐릭터라면 '중복' 하나가 된다(재림에 쓴다).
   확률은 고화 60 · 서사 30 · 전설 10. 신화와 히든은 나오지 않는다. ── */
PF.shard=PF.shard||{}; PF.dup=PF.dup||{};
const SHARDN=10, RDUP={고화:3,서사:2,전설:1,히든:0,신화:0};
pullOne=function(minIdx){ PF.pity=(PF.pity||0)+1; const force=PF.pity>=PITY?2:(minIdx||0),L=GRATE.slice(Math.min(force,GRATE.length-1)); let tot=L.reduce((a,x)=>a+x[1],0),x=Math.random()*tot,g=L[L.length-1][0]; for(const q of L){ if((x-=q[1])<0){ g=q[0]; break; } }
  const pool=gachaPool(g),k=pool[Math.floor(Math.random()*pool.length)]; if(!k) return null;
  /* 처음 나온 캐릭터는 파편 없이 바로 준다. 이미 가진 캐릭터면 파편 3~5개(10개가 모이면 중복 하나) */
  if(!PF.own[k]){ PF.own[k]=Date.now(); if(g==='전설') PF.pity=0; mission('pull',1); PF.cnt.pull++; return {k,g,n:0,got:'new',have:PF.shard[k]||0,first:true}; }
  const n=3+Math.floor(Math.random()*3); PF.shard[k]=(PF.shard[k]||0)+n; let got='';
  while(PF.shard[k]>=SHARDN){ PF.shard[k]-=SHARDN; if(!PF.own[k]){ PF.own[k]=Date.now(); got='new'; } else { PF.dup[k]=(PF.dup[k]||0)+1; if(!got) got='dup'; } }
  if(g==='전설') PF.pity=0; mission('pull',1); PF.cnt.pull++; return {k,g,n,got,have:PF.shard[k]||0}; };
gachaShow=function(res,done){ const el=$('tw-body'); let fin=false; const end=()=>{ if(fin) return; fin=true; done(); };
  el.innerHTML=head('GACHA','뽑기','눌러서 넘긴다')+'<div class="gst'+(res.length===1?' one':'')+'">'+res.map(r=>{ const c=CH[r.k]; return '<div class="gc'+(r.got==='new'||r.g==='전설'?' hi':'')+'" style="--gc:'+GCOL[r.g]+'"><div class="bk"></div><div class="ft"><b>'+esc(c.name.split(', ')[1])+'</b><small>'+r.g+(r.direct?'':r.first?' · 첫 획득':' · 파편 ×'+r.n)+'</small><em>'+(r.got==='new'?'캐릭터 획득!':r.got==='dup'?'중복 +1':r.have+' / '+SHARDN)+'</em></div></div>'; }).join('')+'</div><div class="dock"><button class="go" id="ga-skip" type="button">넘기기</button></div>';
  $('tower').hidden=false; $('tower').scrollTop=0; [...el.querySelectorAll('.gc')].forEach((c,i)=>setTimeout(()=>{ if(fin) return; c.classList.add('on'); const r=res[i]; if(r.got==='new'){ sfx('ult'); buzz(80); } else sfx('ui'); },350+i*(res.length>1?260:0)));
  setTimeout(()=>{ const b=$('ga-skip'); if(b&&!fin) b.textContent='결과 보기'; },350+res.length*260+200); el.querySelector('#ga-skip').onclick=end; };
const reNeed=k=>{ const c=CH[k],w=(PF.ch[k]||{}).w||0,d=PF.dup[k]||0,nd=RDUP[c.grade]||0,st=RECOST[c.grade]||50; return {w,d,nd,st,ok:w>=REWIN&&d>=nd&&PF.star>=st}; };
lockWhy=function(k){ const b=baseKey(k); if(!PF.own[b]) return '가방 탭의 뽑기에서 처음 나오면 바로 얻는다'; if(CH[k].re){ const n=reNeed(b); return '재림: '+REWIN+'승('+n.w+') · 중복 '+n.nd+'('+n.d+') · 별무리 '+n.st+' — 가방 → 재림 · 완성에서 연다'; } return ''; };
/* gachaScreen: 뒤의 판에서 다시 통째로 바꿨다(지운 옛 대입) */
document.addEventListener('click',e=>{ const t=e.target.closest('[data-re2]'); if(!t) return; const k=t.dataset.re2,n=reNeed(k); if(!n.ok) return toast('조건이 모자라다'); PF.star-=n.st; PF.dup[k]=(PF.dup[k]||0)-n.nd; PF.re[k]=Date.now(); pfSave(); sfx('win'); toast(CH[k+'_r'].name+' · 재림했다',3600); achCheck({}); drawSel(); gachaScreen(); });

/* ── 닉네임 ── */
const nickOf=()=>{ let v=''; try{ v=localStorage.getItem('aetherName')||''; }catch(x){} return cleanName(v||($('n-name')&&$('n-name').value)||'')||'나'; };
/* ── 패치 내역: 새 판을 내보낼 때 맨 위에 한 덩이를 더한다 ── */
const PATCH=[
 ['1.9.9','2026-11',['[신규] 모험 등반 화면과 싸우는 중 멈춤 창에 「보유 권능 및 장비」 버튼이 추가되었습니다. 지금 가진 권능 · 장비의 효과, 재사용 대기시간, 붙는 스킬과 단련 · 연마 횟수를 한눈에 볼 수 있습니다(함께 등반 포함).','[버그 수정] 모험 등반 층 화면에서 기본 효과 안내가 권능 목록 끝에 붙어 보이던 현상이 수정되었습니다.']],
 ['1.9.8','2026-11',['[신규] 모험 등반에 기본 효과가 추가되었습니다. 적을 쓰러뜨리면 쓰러뜨린 캐릭터가 잃은 체력의 10%를 회복합니다(함께 등반 포함).','[밸런스] 모험 등반에서 층마다 적이 강해지는 폭이 3% → 2%로 하향되었습니다(10층 +27% → +18%, 20층 +57% → +38%).']],
 ['1.9.7','2026-11',['[이벤트] 새 보상 코드가 추가되었습니다. 입력하면 코인 40,000개를 받을 수 있습니다.']],
 ['1.9.6','2026-11',['[신규] 새 캐릭터 「염세의 진룡, 이그릴」(전설 · 전사)이 추가되었습니다. 뽑기에서 만날 수 있습니다.','[신규] 이그릴의 「역린」은 5번 칸 단추(PC는 우클릭)로 쓰며, 다음 기본 공격이 타오르는 참격으로 바뀝니다.']],
 ['1.9.5','2026-11',['[밸런스] 등반: 층이 오를 때마다 모든 상대의 체력 · 공격력 · 주는 피해가 3%씩 더 늘어납니다(10층 +27%, 20층 +57%).','[밸런스] 등반: 「단련」의 최대 체력 증가량이 80 → 50으로 하향되었습니다.','[밸런스] 등반 중 에이의 패시브 「고취」 회복 효율이 50% 하향되었습니다.','[버그 수정] 함께 오르는 등반에서 손님에게 무기 · 권능 스킬 단추가 생기지 않던 현상이 수정되었습니다.','[버그 수정] 함께 하는 레이드에서 손님 화면의 레이드 보스가 플레이어 크기로 보이던 현상이 수정되었습니다.']],
 ['1.9.4','2026-11',['[버그 수정] 함께 하기에서 손님이 이기면 손님 화면이 멈추며 튕기던 현상이 수정되었습니다.','[개선] 함께 하기 방에 있는 동안에는 새 판을 받아도 게임이 저절로 다시 열리지 않습니다(방을 나간 뒤 바뀝니다).']],
 ['1.9.3','2026-11',['[버그 수정] 컴퓨터가 조작하는 파스테른이 「괴리」를 상향된 6칸 거리에서 쓰지 않던 현상이 수정되었습니다.']],
 ['1.9.2','2026-11',['[밸런스] 맥스: 「검격」 재사용 대기시간이 1초 → 0.5초로 상향되었습니다.']],
 ['1.9.1','2026-11',['[버그 수정] 컴퓨터가 조작하는 맥스가 검격을 쓰지 않던 현상이 수정되었습니다.']],
 ['1.9.0','2026-11',['[밸런스] 컴퓨터 실력별 보상 배율이 상향되었습니다: 쉬움 0.5 → 0.6배, 보통 0.75 → 0.8배 (어려움 1배 그대로).','[밸런스] 판 보상이 조정되었습니다: 승리 250~500 → 250~400 코인, 패배 150~350 → 200~350 코인.','[밸런스] 이야기 클리어 보상이 상향되었습니다: 장 첫 승리 · ★★ 달성 각 500 → 750 코인, 이야기 완주 1,500 → 2,500 코인 (전체 19,500 → 30,000 코인).','[밸런스] 레이드 승리 보상이 조정되었습니다: 코인 300 · 500 · 700 · 1,200 · 1,500, 별무리의 흔적 0 · 0~1 · 1 · 2 · 3 (소란 → 위신).','[밸런스] 등반 층 코인 보상이 상향되었습니다: 40 + 층×15 → 50 + 층×25.','[밸런스] 계정 레벨 업 보상이 상향되었습니다: 400 + 레벨×50 → 500 + 레벨×100 코인.','[밸런스] 매일 임무 보상이 300~700 → 250~500 코인으로 하향되는 대신, 모든 매일 임무가 별무리의 흔적 1개를 줍니다.','[밸런스] 매주 임무 보상이 2,000~3,000 → 1,500~2,500 코인으로 하향되었습니다.','[밸런스] 오늘의 도전 코인 보상이 600 → 500으로 하향되었습니다.','[개선] 맥스: 기본 공격 단추가 「검격」이 되었습니다. 누르고 있으면 1초마다 원형 베기 · 두 번 베기를 번갈아 냅니다.','[밸런스] 파스테른: 「괴리」가 지정형 6칸 · 직선 피해 6칸으로, 「시간의 끝」이 원형 범위 피해 4칸으로 상향되었습니다.']],
 ['1.8.15','2026-11',['[안정성] 쓰이지 않던 옛 뽑기 값과 없어진 「골라서 데려오기」 흔적을 정리했습니다. 게임 내용은 그대로입니다.']],
 ['1.8.14','2026-11',['[개선] 창 머리와 닫기 단추 모양이 통일되었습니다. 닫기는 어두운 단추, 금색 단추는 주요 행동에만 쓰입니다.','[개선] 창 안의 단추 줄이 늘 화면 아래쪽에 놓이고, 알림이 작아지며 잇달아 오면 한 칸에 모여 뜹니다.','[개선] 판 시작 편성 표시가 체력 막대를 가리지 않게 아래로 옮겨졌습니다.','[개선] 함께 하기에서 무작위로 고른 사람은 방 목록 · 준비 칸 · 편성 표시에 「무작위」로 표시됩니다.','[신규] 설정에 「글자 크기(메뉴)」가 추가되었습니다.','[신규] 무작위로 정한 판이 끝나면 결과 창에서 「같은 상대로 다시」를 할 수 있습니다.','[안정성] 게임을 고치는 데 쓰려고 접속 · 판 수와 화면 오류 내용을 익명으로 모읍니다(이름 · 기기 정보 · 기록은 모으지 않습니다). 설정 「익명 통계 보내기」에서 끌 수 있습니다.']],
 ['1.8.13','2026-11',['[신규] 판이 시작될 때 이번 판 편성(우리 편 · 상대 편)이 화면 위쪽에 잠깐 표시됩니다. 무작위로 정해진 캐릭터에는 「무작위」 표시가 붙습니다.','[개선] 함께 하기에서는 판마다 편성이 표시되어 서로 어떤 캐릭터로 싸우는지 바로 알 수 있습니다.']],
 ['1.8.12','2026-11',['[개선] 내 캐릭터 · 상대를 무작위로 고르면 이름 대신 「무작위」로 표시됩니다. 혼자 할 때는 판을 시작할 때마다 새로 정해집니다.']],
 ['1.8.11','2026-11',['[개선] 연습 · 함께 하기에서도 캐릭터를 고를 때 가진 캐릭터만 보입니다. 함께 하기에서 다른 사람이 고른 캐릭터는 그대로 보입니다.','[개선] 패치 노트를 새로 정리했습니다.']],
 ['1.8.10','2026-11',['[버그 수정] 자유 대전에서 상대 · 팀원을 고를 때 아직 얻지 않은 캐릭터까지 목록에 보이던 현상이 수정되었습니다. 이제 가진 캐릭터만 보입니다(연습 · 함께 하기는 그대로).']],
];
function patchScreen(){ const d=document.createElement('div'); d.className='overlay'; d.style.zIndex=44; d.id='patchv'; d.innerHTML='<div class="wrap">'+head('PATCH NOTES','버전 '+VER,'바뀐 것')+PATCH.slice(0,4).map(p=>'<h2>'+p[0]+' <small style="color:var(--muted);font-weight:400">'+p[1]+'</small></h2>'+p[2].map(l=>'<p class="note" style="margin:6px 0">'+esc(l)+'</p>').join('')).join('')+'<div class="dock"><button class="go" id="pv-ok" type="button">확인</button></div></div>'; document.body.appendChild(d); d.querySelector('#pv-ok').onclick=()=>d.remove(); }
function nickScreen(done){ const d=document.createElement('div'); d.className='overlay'; d.id='nickv'; d.style.zIndex=46; d.innerHTML='<div class="wrap">'+head('WELCOME','닉네임을 정한다','싸움 중 내 캐릭터 위에 뜨고, 친구와 함께 할 때 보인다')+'<div class="row"><input type="text" id="nk-in" maxlength="8" placeholder="닉네임 (8자까지)" autocomplete="off" style="flex:1;height:52px;font-size:17px;text-align:center"></div><p class="note">한 번 정하면 바꿀 수 없다. 2~8자로 신중히 정한다.</p><div class="dock"><button class="go" id="nk-ok" type="button">정했다</button></div></div>'; document.body.appendChild(d);
  const inp=d.querySelector('#nk-in'),ok=()=>{ const v=cleanName(inp.value).slice(0,8); if(v.length<2) return toast('닉네임은 2자 이상'); try{ localStorage.setItem('aetherName',v); }catch(x){} if($('n-name')) $('n-name').value=v; d.remove(); toast(v+' · 반갑다'); done&&done(); }; d.querySelector('#nk-ok').onclick=ok; inp.addEventListener('keydown',e=>{ if(e.key==='Enter') ok(); e.stopPropagation(); }); setTimeout(()=>inp.focus(),300); }
/* 들어올 때: (제목 화면) → 닉네임이 없으면 정하기 → 버전과 패치 내역 */
{ const room=/[?&]room=/.test(location.search),flow=()=>{ let has=false; try{ has=!!localStorage.getItem('aetherName'); }catch(x){} if(!has) nickScreen(room?null:patchScreen); else if(!room) patchScreen(); };
  if(!navigator.webdriver&&!/[?&]bc\b/.test(location.search)){ if(document.getElementById('title')){ const iv=setInterval(()=>{ if(!document.getElementById('title')){ clearInterval(iv); flow(); } },200); } else flow(); } }

/* ── 캐릭터 아래 막대: 정신 집중(캐스팅)이 차는 모습과, 그 캐릭터만의 자원(n/m) ── */
on('step',()=>{ for(const e of ents){ if(e.chant>now){ if(!e._c1||Math.abs(e._c1-e.chant)>.02){ e._c0=now; e._c1=e.chant; } } else e._c1=0; } });
on('draw:world',()=>{ if(!me) return; g.save(); g.textAlign='center'; g.lineJoin='round';
  const bar=(x,y,w,f,col,lab,txt)=>{ g.globalAlpha=.85; g.fillStyle='rgba(6,9,23,.85)'; g.fillRect(x-w/2-.03,y-.03,w+.06,.2); g.fillStyle=col; g.fillRect(x-w/2,y,w*Math.max(0,Math.min(1,f)),.14); if(lab){ g.globalAlpha=1; g.font='700 .26px "Gothic A1",sans-serif'; g.lineWidth=.06; g.strokeStyle='rgba(6,9,23,.9)'; g.strokeText(lab+(txt?' '+txt:''),x,y+.44); g.fillStyle='#e9ecff'; g.fillText(lab+(txt?' '+txt:''),x,y+.44); } };
  for(const e of ents){ if(e.dead) continue; const st=has(e,'stealth'); if(st&&e.team!==me.team) continue; let y=e.y+(e.rad||R)+.34; const fo=e.st.find(q=>q.k==='focus'&&q.until>now); let c1=NET.client?e.chant:e._c1,c0=NET.client?(e._n0||(e._n0=now)):e._c0; if(NET.client&&!(e.chant>now)) e._n0=0; if(fo&&fo.d0>0&&!(c1>now)){ c1=fo.until; c0=fo.until-fo.d0; }
    if(c1>now&&c1>c0){ bar(e.x,y,1.5,(now-c0)/(c1-c0),e.team===me.team?'#fff3cf':'#ff9aa5','집중',(c1-now).toFixed(1)+'s'); y+=.62; }
    if(e===me){ const Rz=RES[e.key]; if(!(Rz&&(Rz.p||Rz.gz))){ let h=''; try{ h=String(e.c.hud(e)||''); }catch(x){} const m=h.match(/([^·\d\/]{1,10}?)\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/); if(m&&+m[3]>1){ const f=+m[2]/+m[3]; bar(e.x,y,1.5,f,f>=1?'#e3c377':'#7fe9ff',m[1].trim(),m[2]+'/'+m[3]); } } } }
  g.restore(); });

/* 화면을 옮길 때도 빌려 쓴 설정이 남아 있지 않게 한다. 뒤로 가기로 조작키·패치 창을 닫는다 */
{ const gp2=goPage; goPage=function(p){ keepFix(); gp2(p); }; const bs0=backStep; backStep=function(){ const k=document.getElementById('keysv')||document.getElementById('patchv'); if(k){ k.remove(); return true; } return bs0(); }; }

/* ── 기록 화면: 업적은 단추를 눌러 따로 띄우고, 보상 코드 칸은 맨 아래로 ── */
function achScreen(){ /* 뒤의 판에서 통째로 바꿨다. 이 몸통은 쓰지 않는다 */ }
{ const dr2=drawRec; drawRec=function(){ dr2(); const el=$('rec'); if(!el) return;
    const h=[...el.querySelectorAll('h2')].find(x=>/^업적/.test(x.textContent)); if(h){ let n=h.nextElementSibling; while(n&&n.classList.contains('pl')){ const nx=n.nextElementSibling; n.remove(); n=nx; } const got=ACH.filter(a=>PF.ach[a[0]]).length; h.textContent='업적'; h.insertAdjacentHTML('afterend','<button type="button" class="tool" id="ach-open" style="width:100%"><b>업적 '+got+' / '+ACH.length+'</b><small>눌러서 모두 본다 · 달성하면 코인과 별무리의 흔적을 받는다</small><div class="mbar" style="margin-top:8px"><i style="width:'+Math.round(100*got/ACH.length)+'%;background:var(--gold)"></i></div></button>'); }
    const ci=$('code-in'); if(ci){ const row=ci.closest('.row'),hh=row.previousElementSibling,nt=row.nextElementSibling&&row.nextElementSibling.id==='code-note'?row.nextElementSibling:null; el.appendChild(hh); el.appendChild(row); if(nt) el.appendChild(nt); } };
  document.addEventListener('click',e=>{ if(e.target.closest('#ach-open')) achScreen(); });
  const bs1=backStep; backStep=function(){ const k=document.getElementById('achv'); if(k){ k.remove(); return true; } return bs1(); }; }

/* ════════════════ 1.2.0 ════════════════ */
/* ── 보상 코드: 원문은 코드에 두지 않는다. 아래 1.8.3 블록의 CODEH(암호화한 값)만 본다 ── */

PF.codes=PF.codes||{};
/* 모두 열기 단추는 없앴다. 예전에 단추로 열어 둔 것은 뽑기 방식으로 돌린다(보상 코드로 연 것만 남는다) */
if(PF.open&&!PF.palace){ PF.open=false; pfSave(); }




/* ── 가방 탭: 뽑기 · 파편 · 재림 · 숙련 · 데려오기를 한곳에 ── */
function giveShard(k,n){ PF.shard=PF.shard||{}; PF.dup=PF.dup||{}; PF.shard[k]=(PF.shard[k]||0)+n; let got=''; while(PF.shard[k]>=SHARDN){ PF.shard[k]-=SHARDN; if(PF.own[k]){ PF.dup[k]=(PF.dup[k]||0)+1; got=' (중복 +1)'; } else { PF.own[k]=Date.now(); got=' (캐릭터 획득)'; } } return CH[k].name.split(', ')[1]+' 파편 +'+n+got; }
function drawBag(){ /* 뒤의 판에서 통째로 바꿨다. 이 몸통은 쓰지 않는다 */ }
/* 뽑기 화면은 이제 결과만 띄운다. 결과가 없으면 가방 탭으로 간다 */
{ gachaScreen=function(res){ if(res) res.forEach(r=>{ if(r.n===undefined){ r.n=0; r.got='new'; r.have=0; r.direct=true; } }); if(res&&res.length&&!res.shown){ res.shown=true; return gachaShow(res,()=>gachaScreen(res)); }
    drawBag(); if(!res||!res.length){ $('tower').hidden=true; if(page!=='bag') goPage('bag'); return; }
    let h=head('GACHA','나온 파편','코인 '+PF.coin.toLocaleString()+' · 별무리의 흔적 '+PF.star)+res.map(r=>{ const c=CH[r.k]; return '<div class="pl" style="border-left-color:'+GCOL[r.g]+'"><b>'+esc(c.name.split(', ')[1])+' <small style="color:'+GCOL[r.g]+'">'+r.g+' '+c.cls+'</small></b><span style="color:var(--muted)">'+(r.direct?'별무리로 데려옴 · ':r.first?'첫 획득 · ':'파편 +'+r.n+' · ')+(r.got==='new'?'<b style="color:var(--gold)">캐릭터 획득</b>':r.got==='dup'?'<b style="color:var(--ok)">중복 +1</b>':r.have+' / '+SHARDN)+'</span></div>'; }).join('');
    h+='<div class="row" style="margin-top:12px"><button type="button" data-pull="1"'+(PF.coin<PULL?' style="opacity:.5"':'')+'>1번 더<small style="display:block;font-size:10.5px;opacity:.75">코인 '+PULL.toLocaleString()+'</small></button><button type="button" data-pull="10"'+(PF.coin<PULL10?' style="opacity:.5"':'')+'>10번 더<small style="display:block;font-size:10.5px;opacity:.75">코인 '+PULL10.toLocaleString()+'</small></button></div><div class="dock"><button class="go" id="tw-out" type="button">가방으로</button></div>';
    $('tw-body').innerHTML=h; $('tower').hidden=false; $('tower').scrollTop=0; if(page!=='bag') goPage('bag'); };
  const gp3=goPage; goPage=function(p){ gp3(p); if(p==='bag') drawBag(); };
  document.addEventListener('click',e=>{ if(e.target.closest('#tw-out')) setTimeout(drawBag,0); });
  /* 기록 화면에서는 모두 열기 단추 · 보유 · 숙련을 뺀다(가방 탭으로 옮겼다) */
  const dr3=drawRec; drawRec=function(){ dr3(); const el=$('rec'); if(!el) return; const b=$('rec-open'); if(b){ const n=b.nextElementSibling; if(n&&n.classList.contains('note')) n.remove(); b.remove(); }
    for(const t of ['보유','숙련']){ const hh=[...el.querySelectorAll('h2')].find(x=>x.textContent===t); if(!hh) continue; let n=hh.nextElementSibling; while(n&&n.tagName!=='H2'&&n.id!=='ach-open'){ const nx=n.nextElementSibling; n.remove(); n=nx; } hh.remove(); }
    el.insertAdjacentHTML('beforeend','<p class="sub" style="margin-top:10px">뽑기 · 파편 · 재림 · 숙련은 아래 \'가방\' 탭에 있다.</p>'); }; }

/* ── 이야기: 정해진 캐릭터 대신 지금 고른 내 캐릭터로 싸운다(임시) ── */
{ const sg0=spGo; spGo=function(m){ if(m&&m.kind==='story'){ const k=kOf('me'); if(CH[k]&&!CH[k].mon&&!locked(k)) m=Object.assign({},m,{cfg:Object.assign({},m.cfg,{me:k,meR:false})}); } return sg0(m); };
  const ss0=storyScreen; storyScreen=function(si,ci){ ss0(si,ci); const el=$('tw-body'),k=kOf('me'); el.querySelectorAll('.sub').forEach(p=>{ if(/정해진 캐릭터로 싸운다/.test(p.textContent)) p.textContent='이야기는 지금 고른 내 캐릭터로 싸운다(임시). 글은 노션 \'맥스 세계관 정리본 (정사)\'에서 옮겼다.'; });
    if(si!=null&&ci!=null){ const d=el.querySelector('.dock'); if(d) d.insertAdjacentHTML('beforebegin','<p class="sub">내 캐릭터 · '+esc(CH[k].name)+' (글 속의 주인공 자리에 선다)</p><p class="note">'+payTxt.story(STORY[si],ci)+'</p>'); } }; }

/* ── 보상: 판마다 받는 기본 코인에 더해, 레이드 · 등반 · 이야기 · 오늘의 도전은 따로 얹어 준다 ── */
const RAIDPAY={coin:[300,500,700,1200,1500],star:[0,.5,1,2,3],fcoin:[600,1000,1800,3000,5000],fstar:[1,2,3,5,8],fshard:[1,2,3,4,5]};   /* 난이도(소란~위신)별 · f = 첫 처치 */
const TWPAY={coin:f=>50+f*25,boss:f=>f>=20?2:1,mcoin:f=>f*150,mstar:f=>f/5};                                                        /* 층마다 · 보스 층 별무리 · 5층 단위 첫 돌파 */
const STPAY={first:[750,2],two:[750,2],again:100,all:[2500,5]}, DYPAY=[500,2];
const payTxt={ raid:k=>{ const t=tierOf(k),f=!(PF.rf||{})[k]; return '이기면 코인 +'+RAIDPAY.coin[t]+(RAIDPAY.star[t]?' · 별무리 '+(RAIDPAY.star[t]<1?'0~1':'+'+RAIDPAY.star[t]):'')+(t>=2?' · 가끔 파편':'')+(f?'\n첫 처치: 코인 +'+RAIDPAY.fcoin[t].toLocaleString()+' · 별무리 +'+RAIDPAY.fstar[t]+' · 서사 이상 파편 '+RAIDPAY.fshard[t]+'개':'\n첫 처치 보상은 이미 받았다'); },
  story:(s,ci)=>{ const was=(PF.story[s.id]||[])[ci]||0; return '보상 · '+(was?'':'첫 승리 코인 +'+STPAY.first[0]+' · 별무리 +'+STPAY.first[1]+' / ')+(was<2?'★★ 코인 +'+STPAY.two[0]+' · 별무리 +'+STPAY.two[1]+' / ':'다시 이기면 코인 +'+STPAY.again+' / ')+'이야기를 끝까지 넘기면 코인 +'+STPAY.all[0].toLocaleString()+' · 별무리 +'+STPAY.all[1]; },
  tower:()=>'보상 · 층을 넘을 때마다 코인(1층 '+TWPAY.coin(1)+' → 20층 '+TWPAY.coin(20)+'), 보스 · 마왕 층은 별무리 +1(20층부터 +2). 5 · 10 · 15…층을 처음 넘으면 코인 층×150 · 별무리 층÷5.' };
{ const en0=earn; earn=function(win){ const g=en0(win); let c=0,s=0; const N=[];
    try{ if(TW&&TW.on){ if(win){ const f=TW.floor,n=TW.next||{}; c+=TWPAY.coin(f); if(n.boss||n.lord) s+=TWPAY.boss(f); if(f%5===0&&f>PF.tw.best){ c+=TWPAY.mcoin(f); s+=TWPAY.mstar(f); N.push(f+'층 첫 돌파'); } } }
      else if(SPM&&SPM.kind==='story'){ if(win){ const S0=STORY[SPM.si],ch=S0.ch[SPM.ci],a=PF.story[S0.id]||[],was=a[SPM.ci]||0,st=goalOk(ch.goal)?2:1; if(!was){ c+=STPAY.first[0]; s+=STPAY.first[1]; N.push('첫 승리'); } if(st===2&&was<2){ c+=STPAY.two[0]; s+=STPAY.two[1]; N.push('★★'); } if(was>=st) c+=STPAY.again; if(!was&&S0.ch.every((_,j)=>j===SPM.ci||(a[j]||0)>0)){ c+=STPAY.all[0]; s+=STPAY.all[1]; N.push('이야기 완주'); } } }
      else if(SPM&&SPM.kind==='daily'){ if(win&&PF.dpay!==today()){ PF.dpay=today(); c+=DYPAY[0]; s+=DYPAY[1]; N.push('오늘의 도전'); } }
      else if(mode===6&&win&&ents.some(o=>o.c&&o.c.mon)){ const k=ents.find(o=>o.c&&o.c.mon).key,t=tierOf(k),pool=()=>{ const L=gachaPool(t>=3&&Math.random()<.3?'전설':'서사'); return L[Math.floor(Math.random()*L.length)]; }; c+=RAIDPAY.coin[t]; { const v=RAIDPAY.star[t]; s+=v>=1?v:(Math.random()<v?1:0); } PF.rf=PF.rf||{};
        if(!PF.rf[k]){ PF.rf[k]=Date.now(); c+=RAIDPAY.fcoin[t]; s+=RAIDPAY.fstar[t]; N.push('첫 처치'); const q=pool(); if(q) N.push(giveShard(q,RAIDPAY.fshard[t])); } else if(t>=2&&Math.random()<.35){ const q=pool(); if(q) N.push(giveShard(q,1)); } }
    }catch(x){}
    PF.coin+=c; PF.star+=s; g.c+=c; g.st+=s; g.note=N.join(' · '); return g; };
  /* 보상 표를 고르는 화면에 적어 둔다 */
  const dm0=drawMon; drawMon=function(){ dm0(); let p=$('monpay'); if(!p){ p=document.createElement('p'); p.className='note'; p.id='monpay'; p.style.whiteSpace='pre-line'; const m=$('mon'); m.parentNode.insertBefore(p,m.nextSibling); } p.textContent=CH[OPT.mon]&&tierOf(OPT.mon)===monTab?CH[OPT.mon].name.split(', ')[1]+' · '+payTxt.raid(OPT.mon):''; };
  const th0=towerHome; towerHome=function(){ th0(); const d=$('tw-body').querySelector('.dock'); if(d) d.insertAdjacentHTML('beforebegin','<p class="note">'+payTxt.tower()+' 층마다 맵이 바뀐다.</p>'); }; }

/* ── 등반: 층마다 맵을 무작위로 고른다. 보스 층은 좁은 맵을 뺀다 ── */
{ let pick=null; const tg0=towerGo; towerGo=function(){ if(TW&&!TW.on&&TW.next){ const n=TW.next; if(!n.map||!MAPS[n.map]){ const L=Object.keys(MAPS).filter(k=>!(n.boss||n.lord)||!['duel','canyon','storm'].includes(k)); n.map=L[Math.floor(Math.random()*L.length)]; twStore(); } pick=n.map; } try{ tg0(); } finally { pick=null; } };
  const su0=setup; setup=function(x){ su0(x); if(pick&&!x.map&&MAPS[pick]) OPT.map=pick; }; }

/* ── 업적: 유형별로 나눠 본다 ── */
ACH.push(['rt3','군주 사냥','군주 난이도의 보스를 쓰러뜨린다',()=>Object.keys(PF.mon).some(k=>PF.mon[k]>0&&CH[k]&&tierOf(k)===3)],['rt4','위신 사냥','위신 난이도의 보스를 쓰러뜨린다',()=>Object.keys(PF.mon).some(k=>PF.mon[k]>0&&CH[k]&&tierOf(k)===4)]); ACHPAY.rt3=[3000,10]; ACHPAY.rt4=[6000,20];
const ACAT=[['전투',null],['수집 · 숙련',/^(v\d+|m3|built|g\d+|gmyth|gleg\d*|pu\d+|re\d+|c\d0.+|allcls)$/],['레이드',/^(golem|hydra|korhen|b\d+|ball|rw\d+|rt\d)$/],['등반',/^(t\d+|tf\d+|tr\d+|co\d+)$/],['이야기 · 도전',/^(st1|stmax|stall|d1|d7|dw\d+|ds\d+|ss\d+)$/],['함께 · 계정',/^(mw\d+|ms\d+|lv\d+)$/]];
const acat=id=>{ for(let i=1;i<ACAT.length;i++) if(ACAT[i][1].test(id)) return i; return 0; };
achScreen=function(){ const old=document.getElementById('achv'); if(old) old.remove(); const d=document.createElement('div'); d.className='overlay'; d.id='achv'; d.style.zIndex=9; let tab=achScreen.tab||'all',cat=achScreen.cat==null?-1:achScreen.cat;
  const row=a=>{ const ok=!!PF.ach[a[0]],pay=achPay(a[0]); return '<div class="pl" style="border-left-color:'+(ok?'var(--gold)':'var(--line)')+';opacity:'+(ok?1:.62)+'"><b>'+(ok?'◆ ':'◇ ')+esc(a[1])+'</b><span style="color:var(--muted)">'+esc(a[2])+'</span><span style="color:'+(ok?'var(--muted)':'var(--gold)')+';font-size:11.5px;flex-basis:100%">'+(ok?'받음 · ':'보상 · ')+'코인 '+pay[0].toLocaleString()+' · 별무리 '+pay[1]+'</span></div>'; };
  const render=()=>{ const got=ACH.filter(a=>PF.ach[a[0]]).length,inC=i=>ACH.filter(a=>acat(a[0])===i),st=a=>tab==='all'||(tab==='done')===!!PF.ach[a[0]]; let body='';
    for(let i=0;i<ACAT.length;i++){ if(cat>=0&&cat!==i) continue; const L=inC(i).filter(st),A0=inC(i); if(!L.length&&cat<0) continue; body+='<h2>'+ACAT[i][0]+' <small style="color:var(--muted);font-weight:400">'+A0.filter(a=>PF.ach[a[0]]).length+' / '+A0.length+'</small></h2>'+(L.length?L.map(row).join(''):'<p class="sub">여기에는 아직 없다.</p>'); }
    d.innerHTML='<div class="wrap">'+head('ACHIEVEMENTS','업적',got+' / '+ACH.length+' 달성')+'<div class="row" id="ach-cat" style="flex-wrap:wrap"><button type="button" data-c="-1" aria-pressed="'+(cat<0)+'">모두</button>'+ACAT.map((c,i)=>'<button type="button" data-c="'+i+'" aria-pressed="'+(cat===i)+'">'+c[0]+'<small style="display:block;font-size:10.5px;opacity:.75">'+inC(i).filter(a=>PF.ach[a[0]]).length+' / '+inC(i).length+'</small></button>').join('')+'</div>'
     +'<div class="row" id="ach-tab" style="margin-top:8px"><button type="button" data-t="all" aria-pressed="'+(tab==='all')+'">전체</button><button type="button" data-t="todo" aria-pressed="'+(tab==='todo')+'">남은 것 '+(ACH.length-got)+'</button><button type="button" data-t="done" aria-pressed="'+(tab==='done')+'">달성 '+got+'</button></div><div style="margin-top:4px">'+(body||'<p class="sub">여기에는 아직 없다.</p>')+'</div><div class="dock"><button class="go" id="ach-out" type="button">닫기</button></div></div>';
    d.querySelector('#ach-out').onclick=()=>d.remove(); d.querySelector('#ach-tab').onclick=e=>{ const b=e.target.closest('button'); if(!b) return; tab=achScreen.tab=b.dataset.t; render(); d.scrollTop=0; }; d.querySelector('#ach-cat').onclick=e=>{ const b=e.target.closest('button'); if(!b) return; cat=achScreen.cat=+b.dataset.c; render(); d.scrollTop=0; }; };
  render(); document.body.appendChild(d); };
achCheck({}); hubCard();

/* ════════════════ 1.2.2 화면 정리 ════════════════ */
{ const gp4=goPage; goPage=function(p){ gp4(p); $('sel').dataset.pg=page; }; $('sel').dataset.pg=page; }
/* ── 가방: 위에는 보유와 뽑기만. 나머지는 칸을 눌러 창으로 본다 ── */
const bagData=()=>{ const base=Object.keys(CH).filter(k=>!CH[k].re&&!CH[k].built&&!CH[k].custom),own=base.filter(k=>PF.own[k]);
  return {base,own,S:Object.keys(PF.shard||{}).filter(k=>CH[k]&&PF.shard[k]>0).sort((a,b)=>PF.shard[b]-PF.shard[a]),D:Object.keys(PF.dup||{}).filter(k=>CH[k]&&PF.dup[k]>0),
   R:own.filter(k=>CH[k+'_r']&&!PF.re[k]).sort((a,b)=>(reNeed(b).ok-reNeed(a).ok)||(((PF.ch[b]||{}).w||0)+(PF.dup[b]||0)*5)-(((PF.ch[a]||{}).w||0)+(PF.dup[a]||0)*5)),L:Object.entries(PF.ch).filter(x=>CH[x[0]]).sort((a,b)=>b[1].w-a[1].w)}; };
drawBag=function(){ const el=$('bag'); if(!el) return; const B=bagData(),t=(id,name,sub,n)=>'<button type="button" class="tool" data-bag="'+id+'">'+(n?'<i>'+n+'</i>':'')+'<b>'+name+'</b><small>'+sub+'</small></button>';
  el.innerHTML='<div class="wal"><div><b>'+PF.coin.toLocaleString()+'</b><small>코인</small></div><div><b>'+PF.star+'</b><small>별무리의 흔적</small></div><div><b>'+B.own.length+' / '+B.base.length+'</b><small>캐릭터</small></div></div>'
   +(PF.open?'<p class="note">모든 캐릭터가 열려 있다(보상 코드) · 같은 코드를 다시 적으면 원래대로 돌아간다.</p>':'')
   +'<h2>뽑기</h2><div class="pullrow"><button type="button" data-pull="1"'+(PF.coin<PULL?' class="low"':'')+'><b>1번 뽑기</b><small>코인 '+PULL.toLocaleString()+'</small></button><button type="button" data-pull="10"'+(PF.coin<PULL10?' class="low"':'')+'><b>10번 뽑기</b><small>코인 '+PULL10.toLocaleString()+' · 서사 이상 보장</small></button></div>'
   +'<p class="sub" style="margin:8px 2px 0">처음 나온 캐릭터는 바로 얻는다 · 가진 캐릭터는 파편 3~5개 · 전설 파편 보장까지 '+Math.max(0,PITY-(PF.pity||0))+'번</p>'
   +'<h2>가방</h2><div class="bagg">'+t('sh','파편',B.S.length?B.S.length+'명의 파편을 모으는 중':'아직 없다',B.S.filter(k=>PF.shard[k]>=SHARDN-2).length?'곧 '+B.S.filter(k=>PF.shard[k]>=SHARDN-2).length:'')
   +t('re','재림 · 완성',(B.R.length||doneList().length)?'조건을 보고 재림하거나 완성한다':'아직 대상이 없다',(B.R.filter(k=>reNeed(k).ok).length+doneList().filter(k=>reNeed(k).ok).length)?'가능 '+(B.R.filter(k=>reNeed(k).ok).length+doneList().filter(k=>reNeed(k).ok).length):'')
   +t('ms','숙련',B.L.length?B.L.length+'명으로 싸웠다':'아직 기록이 없다')+t('get','별무리 뽑기','등급을 골라 그 등급 캐릭터 하나')
   +t('dup','중복 캐릭터',B.D.length?B.D.reduce((a,k)=>a+PF.dup[k],0)+'개 · 재림에 쓴다':'아직 없다')+t('rate','확률 · 규칙','뽑기가 어떻게 되는지')+'</div>'; };
function bagPop(kind){ const old=document.getElementById('bagv'); if(old) old.remove(); const d=document.createElement('div'); d.className='overlay'; d.id='bagv'; d.dataset.kind=kind; d.style.zIndex=9;
  const B=bagData(),nm=k=>esc(CH[k].name.split(', ')[1]),pb=(v,m,col)=>'<div class="mbar"><i style="width:'+Math.min(100,Math.round(100*v/m))+'%;background:'+(col||'var(--aether)')+'"></i></div>'; let h='';
  if(kind==='sh'){ const f=bagPop.f||'all',L=B.S.filter(k=>f==='all'||(f==='own')===!!PF.own[k]); h=head('SHARDS','파편 가방',B.S.length+'명 · 가진 캐릭터의 파편 '+SHARDN+'개는 중복 하나가 된다')+'<div class="row" id="sh-f"><button type="button" data-f="all" aria-pressed="'+(f==='all')+'">전체 '+B.S.length+'</button><button type="button" data-f="new" aria-pressed="'+(f==='new')+'">없는 캐릭터</button><button type="button" data-f="own" aria-pressed="'+(f==='own')+'">가진 캐릭터</button></div>'
     +(L.length?'<div class="shg" style="margin-top:10px">'+L.map(k=>{ const c=CH[k]; return '<div class="shc" style="border-top-color:'+GCOL[c.grade]+'"><span class="n">'+PF.shard[k]+' / '+SHARDN+'</span><b>'+nm(k)+'</b><small>'+c.grade+' '+c.cls+(PF.own[k]?' · 가짐':'')+'</small>'+pb(PF.shard[k],SHARDN,GCOL[c.grade])+'</div>'; }).join('')+'</div>':'<p class="sub" style="margin-top:12px">여기에는 아직 없다. 파편은 이미 가진 캐릭터를 뽑았을 때와 레이드에서 나온다.</p>')+'<p class="note" style="margin-top:12px">가진 캐릭터의 파편 '+SHARDN+'개는 \'중복\' 하나가 되어 재림에 쓰인다.</p>'; }
  else if(kind==='re'){ h=head('RETURN','재림','체력 +50 · 기본 공격 +2')+'<p class="note">원래 캐릭터로 '+REWIN+'승 이상 + 중복 캐릭터(고화 3 · 서사 2 · 전설 1) + 별무리의 흔적.</p>'+(B.R.length?B.R.map(k=>{ const c=CH[k],n=reNeed(k),ck=(a,b)=>'<span style="color:'+(a>=b?'var(--ok)':'var(--muted)')+'">'; return '<div class="pl" style="border-left-color:'+GCOL[c.grade]+'"><b>'+nm(k)+' <small style="color:var(--muted)">'+esc(CH[k+'_r'].name.split(', ')[0])+'</small></b>'+(n.ok?'<button type="button" data-re2="'+k+'" style="height:34px;border:1px solid var(--gold);border-radius:8px;background:var(--panel);color:var(--gold);padding:0 12px;font-weight:700">재림</button>':'')+'<div style="flex-basis:100%;font-size:12px">'+ck(n.w,REWIN)+'승 '+n.w+'/'+REWIN+'</span> · '+ck(n.d,n.nd)+'중복 '+n.d+'/'+n.nd+'</span> · '+ck(PF.star,n.st)+'별무리 '+n.st+'</span></div></div>'; }).join(''):'<p class="sub">재림할 수 있는 캐릭터가 아직 없다.</p>'); }
  else if(kind==='ms'){ h=head('MASTERY','숙련','★ 1승 · ★★ 5승 · ★★★ 15승')+(B.L.length?B.L.map(([k,c])=>{ const nx=c.w>=15?0:c.w>=5?15:c.w>=1?5:1; return '<div class="pl"><b>'+nm(k)+mastery(k)+'</b><span style="color:var(--muted)">'+c.w+'승 '+c.l+'패'+(nx?' · 다음 ★까지 '+(nx-c.w)+'승':' · 숙련 끝')+'</span>'+(nx?pb(c.w,nx,'var(--gold)'):'')+'</div>'; }).join(''):'<p class="sub">아직 싸운 기록이 없다. 싸울수록 캐릭터마다 별이 쌓인다(★ 1승 · ★★ 5승 · ★★★ 15승).</p>'); }
  else if(kind==='get'){ h=head('STAR DRAW','별무리 뽑기','별무리의 흔적 '+PF.star+'개')+'<p class="note">별무리의 흔적을 내고 고른 등급의 캐릭터 하나를 얻는다. 누가 나올지는 정할 수 없고, 아직 없는 캐릭터만 나온다.</p>'+SGG.map(g=>{ const all=gachaPool(g),hv=all.filter(k=>PF.own[k]).length,left=all.length-hv,ok=left>0&&PF.star>=SDRAW[g]; return '<div class="pl" style="border-left-color:'+GCOL[g]+'"><b>'+g+' <small style="color:var(--muted)">'+hv+' / '+all.length+'</small></b><span style="color:var(--muted)">'+(left?'별무리 '+SDRAW[g]:'모두 가졌다')+'</span>'+(left?'<button type="button" data-sg="'+g+'" style="height:36px;border:1px solid '+(ok?'var(--gold)':'var(--line)')+';border-radius:8px;background:var(--panel);color:'+(ok?'var(--gold)':'var(--muted)')+';padding:0 12px;font-weight:700">뽑기</button>':'')+'</div>'; }).join(''); }
  else if(kind==='dup'){ h=head('DUPLICATES','중복 캐릭터','재림에 쓴다')+(B.D.length?B.D.map(k=>'<div class="pl" style="border-left-color:'+GCOL[CH[k].grade]+'"><b>'+nm(k)+' <small style="color:var(--muted)">'+CH[k].grade+' '+CH[k].cls+'</small></b><span style="color:var(--muted)">중복 '+PF.dup[k]+' / 재림에 '+(RDUP[CH[k].grade]||0)+'</span></div>').join(''):'<p class="sub">아직 없다. 가진 캐릭터의 파편 '+SHARDN+'개가 모이면 중복 하나가 된다.</p>'); }
  else { h=head('RULES','확률 · 규칙','뽑기가 어떻게 되는지')+GRATE.map(g=>'<div class="pl" style="border-left-color:'+GCOL[g[0]]+'"><b>'+g[0]+'</b><span style="color:var(--muted)">'+g[1]+'%</span></div>').join('')+'<p class="note" style="white-space:pre-line">신화 · 히든은 뽑기에서 나오지 않는다.\n처음 나온 캐릭터는 그 자리에서 바로 얻는다.\n이미 가진 캐릭터가 나오면 파편이 3~5개 나온다. 파편 '+SHARDN+'개는 \'중복\' 하나가 되고, 재림 · 완성에 쓴다.\n'+PITY+'번 안에 전설 파편이 한 번은 나온다(지금 '+Math.max(0,PITY-(PF.pity||0))+'번 남음).\n10번 뽑기는 서사 이상이 하나는 나온다.</p>'; }
  d.innerHTML='<div class="wrap">'+h+'<div class="dock"><button class="go" id="bag-out" type="button">닫기</button></div></div>'; document.body.appendChild(d); }
document.addEventListener('click',e=>{ const t=e.target.closest('[data-bag],#bag-out,#sh-f button,#bagv [data-re2]'); if(!t) return; const v=document.getElementById('bagv');
  if(t.dataset.bag) return bagPop(t.dataset.bag); if(t.id==='bag-out'){ v&&v.remove(); return drawBag(); } if(t.dataset.f){ bagPop.f=t.dataset.f; return bagPop('sh'); }
  if(t.dataset.re2) setTimeout(()=>{ if(document.getElementById('bagv')) bagPop('re'); },30); });
{ const bs2=backStep; backStep=function(){ const k=document.getElementById('bagv'); if(k){ k.remove(); return true; } return bs2(); }; }
drawBag();

