"use strict";
/* ════════════════ 1.9.11 버그 손질 ════════════════
   · 등반 결과는 판이 끝나는 순간에 확정해 저장한다(twSettle, game/core.js). 0.9초 사이에 앱을 닫아도 층 · 패배가 그대로 남는다
   · 「신화를 품다」 업적은 신화 캐릭터를 얻는 길이 생길 때까지 목록에서 숨긴다(이미 받은 사람에게는 그대로 보인다)
   · 「기록 모두 지우기」는 닉네임을 적어야 지워지는 확인 창을 거친다. 보상 코드를 쓴 기록만 남긴다
   · 게임 창을 둘 열었을 때 오래된 창이 새 진행을 덮어쓰지 않는다(다른 창이 저장하면 이 창은 다시 불러온다)
   · 친구 초대 창은 뒤로 가기 · Esc로 닫힌다 */

/* ── 등반 결과 확정: 'end'는 판 보상(earn) · 넘은 층 세기 뒤에 돈다(이 파일이 맨 나중에 등록) ── */
on('end',w=>{ if(NET.client||typeof TW==='undefined'||!TW||!TW.on||!w) return; try{ twSettle(w); }catch(x){ console.error('등반 결과 확정',x); } });

/* ── 「신화를 품다」 숨기기 ── */
{ const i=ACH.findIndex(a=>a[0]==='gmyth'); if(i>=0&&!(PF.ach&&PF.ach.gmyth)) ACH.splice(i,1); }

/* ── 기록 모두 지우기: 확인 창 ── */
function resetAsk(){ const old=$('resetv'); if(old) old.remove(); let nm=''; try{ nm=String(localStorage.getItem('aetherName')||'').trim(); }catch(x){} const want=nm||'모두 지우기';
  const v=document.createElement('div'); v.className='overlay'; v.id='resetv'; v.style.zIndex=58;
  v.innerHTML='<div class="wrap">'+head('RESET','기록 모두 지우기','되돌릴 수 없다')
   +'<div class="bcard" style="border:2px solid var(--foe);border-left-width:6px;background:rgba(255,125,140,.08)"><b style="color:var(--foe);font-size:17px">정말로 모든 기록을 지운다</b>'
   +'<p class="note" style="color:var(--ink)">코인 · 별무리 · 가진 캐릭터 · 계정 레벨 · 임무 · 업적 · 파편 · 중복 · 재림 · 완성 · 뽑기 천장 · 이야기 · 오늘의 도전 · 등반(하던 등반 포함)이 모두 처음으로 돌아간다.\n보상 코드를 쓴 기록만 남는다. 이미 쓴 코드는 다시 받을 수 없다.</p></div>'
   +'<p class="sub" id="reset-who" style="margin-top:14px"></p>'
   +'<input id="reset-name" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="24" aria-label="확인 글" style="width:100%;font:inherit;font-size:17px;padding:12px 14px;border-radius:10px;border:2px solid var(--foe);background:var(--deep);color:var(--ink);margin:6px 0 4px">'
   +'<p class="note" id="reset-hint"></p>'
   +'<div class="dock"><button class="go" id="reset-go" type="button" disabled style="background:var(--foe);color:#fff;border-color:var(--foe)">모두 지우기</button><button class="go shut" id="reset-no" type="button">그만둔다</button></div></div>';
  document.body.appendChild(v);
  $('reset-who').textContent=nm?'확인: 내 닉네임 「'+nm+'」을 똑같이 적는다':'확인: 「모두 지우기」를 똑같이 적는다';
  const inp=$('reset-name'),go=$('reset-go'),hint=$('reset-hint');
  inp.addEventListener('input',()=>{ const ok=inp.value.trim()===want; go.disabled=!ok; hint.textContent=inp.value&&!ok?'아직 맞지 않는다':''; });
  $('reset-no').addEventListener('click',()=>v.remove());
  go.addEventListener('click',()=>{ if(inp.value.trim()!==want) return; resetAll(); });
  setTimeout(()=>{ try{ inp.focus(); }catch(x){} },50); }
function resetAll(){ const own={}; for(const k of (typeof START!=='undefined'?START:['ei','vira'])) own[k]=1;
  const fresh={own,coin:1500,star:0,codes:PF.codes&&typeof PF.codes==='object'?PF.codes:{}}; if(PF.tut) fresh.tut=PF.tut;
  PFLOCK=true; TW=null;   /* 이 뒤로는 이 창이 옛 기록을 다시 쓰지 않는다 */
  try{ localStorage.setItem('aetherProfile',JSON.stringify(fresh)); localStorage.removeItem('aetherTower'); }catch(x){}
  const v=$('resetv'); if(v) v.remove(); toast('기록을 모두 지웠다 · 다시 연다',2400); setTimeout(()=>location.reload(),900); }

/* ── 게임 창 둘: 다른 창이 기록을 저장하면 이 창은 저장을 멈추고 다시 불러온다(싸우는 중이면 판이 끝난 뒤) ──
   함께 하기 방 안(같은 기기에서 방장 · 손님 시험)과 ?bc 시험 모드에서는 하지 않는다 */
{ const bc=/[?&]bc\b/.test(location.search); let stale=false;
  const again=()=>{ toast('다른 창에서 진행이 바뀌어 다시 불러온다',2400); setTimeout(()=>location.reload(),1200); };
  addEventListener('storage',e=>{ if(bc||stale||(e.key!=='aetherProfile'&&e.key!=='aetherTower')) return; if(typeof NET!=='undefined'&&(NET.host||NET.client)) return;
    stale=true; PFLOCK=true; if(!running) again(); });
  on('end',()=>{ if(stale) setTimeout(again,1500); }); }

/* ── 뒤로 가기 · Esc: 기록 지우기 확인 창 · 친구 초대 창도 닫힌다 ── */
{ const bs11=backStep; backStep=function(){ for(const id of ['resetv','invv']){ const v=document.getElementById(id); if(v){ v.remove(); return true; } } return bs11.apply(this,arguments); }; }
