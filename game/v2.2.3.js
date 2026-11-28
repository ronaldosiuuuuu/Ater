"use strict";
/* ════════════════ 2.2.3 화면 방향 고정 손질 ════════════════
   설정에서 「가로 고정 · 세로 고정」을 골라도 화면이 돌아가던 것을 고친다. 방향 고정은 브라우저가 전체 화면일 때만 들으므로:
   · 전체 화면이 풀리면(뒤로 가기 · 다른 앱 · 알림 창) 고정도 같이 풀린다 → 다음에 화면을 누를 때 다시 건다.
   · 함께 하기 손님은 판을 시작하는 단추를 누르지 않아 고정이 걸린 적이 없었다 → 화면을 누를 때 건다.
   · 펜이 있는 휴대폰(갤럭시 울트라 등)은 「정밀한 포인터」로 잡혀 휴대폰이 아닌 것으로 보일 수 있다 → 손가락 입력이 되는 기기면 휴대폰으로 본다.
   · 브라우저가 고정을 지원하지 않으면(아이폰 등) 한 번 알려 준다. */
const oriTouch=()=>(navigator.maxTouchPoints|0)>0||!FINE;
const oriWant=()=>OPT.ori==='land'?'landscape':OPT.ori==='port'?'portrait':'';
const oriNow=()=>{ const so=screen.orientation; if(so&&typeof so.type==='string') return so.type.startsWith('landscape')?'landscape':'portrait'; return innerWidth>innerHeight?'landscape':'portrait'; };
let oriLocked='',oriBusy=false,oriTold=false,oriT=0;
goOri=async function(){ if(!oriTouch()||oriBusy) return; oriBusy=true;
  try{ const d=document.documentElement,so=screen.orientation,want=oriWant();
    if((OPT.full||want)&&!document.fullscreenElement&&d.requestFullscreen){ try{ await d.requestFullscreen({navigationUI:'hide'}); }catch(x){} }
    if(!want){ if(so&&so.unlock){ try{ so.unlock(); }catch(x){} } oriLocked=''; return; }
    if(!so||!so.lock){ if(!oriTold){ oriTold=true; toast('이 브라우저는 화면 방향 고정을 지원하지 않는다 · 기기의 자동 회전을 꺼 둔다',4200); } return; }
    try{ await so.lock(want); oriLocked=want; const wl=want==='landscape'; for(let i=0;i<12&&(innerWidth>innerHeight)!==wl;i++) await new Promise(r=>setTimeout(r,50)); }
    catch(x){ oriLocked=''; if(!oriTold&&document.fullscreenElement){ oriTold=true; toast('화면 방향을 고정하지 못했다 · 기기의 자동 회전을 꺼 둔다',4200); } }
  } finally { oriBusy=false; } };
/* 전체 화면이 풀리면 고정도 풀린 것으로 본다 */
document.addEventListener('fullscreenchange',()=>{ if(!document.fullscreenElement) oriLocked=''; });
/* 화면을 누를 때: 고정을 골랐는데 풀려 있거나 방향이 다르면 다시 건다(글을 적는 중에는 건드리지 않는다) */
document.addEventListener('pointerup',e=>{ const want=oriWant(); if(!want||!oriTouch()||e.pointerType==='mouse') return; const a=document.activeElement; if(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
  const t=performance.now(); if(t-oriT<1500) return; if(document.fullscreenElement&&oriLocked===want&&oriNow()===want) return; oriT=t; goOri(); },true);
