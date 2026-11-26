"use strict";
/* ════════════════ 1.9.8 등반 손질 ════════════════
   · 등반 기본 효과: 적을 쓰러뜨린 캐릭터가 자기 잃은 체력의 10%를 회복한다(함께 등반하는 손님도 · 에이 패시브와 따로 얹힌다)
   · 층마다 강해지는 폭 3% → 2% (game/v1.9.5.js의 twFoeMul) */
on('kill',(src,t)=>{ if(NET.client||typeof TW==='undefined'||!TW||!TW.on||!src||!t||src===t) return;
  if(src.team!==0||t.team===0||src.dead) return; const amt=(src.max-src.hp)*.1; if(amt>0) heal(src,amt); });
{ const ts8=towerScreen; towerScreen=function(lost){ const r=ts8.apply(this,arguments);
    try{ if(!lost){ const n=[...document.querySelectorAll('#tw-body .note')].find(x=>x.textContent.includes('지면 등반이 끝난다')); if(n&&$('tw-go')&&!n.dataset.kh){ n.dataset.kh=1; n.appendChild(document.createTextNode(' 기본 효과: 적을 쓰러뜨리면 잃은 체력의 10%를 회복한다.')); } } }catch(x){}
    return r; }; }
