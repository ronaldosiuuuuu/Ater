"use strict";
/* ════════════════ 1.9.5 등반 손질 ════════════════
   · 층마다 모든 상대(보스 · 무리 포함)의 체력 · 공격력 · 주는 피해가 2%씩 늘어난다(1층 기준, 10층이면 +18% · 1.9.8에서 3%→2%). 다른 층 배율 위에 얹는다.
   · 단련: 최대 체력 +80 → +50 (game/core.js의 BOONS · gain)
   · 등반 중 에이의 패시브(고취) 회복이 절반이다. */
const twFoeMul=f=>1+.02*Math.max(0,(f|0)-1);
on('begin',()=>{ if(NET.client||typeof TW==='undefined'||!TW||!TW.on) return; const M=twFoeMul(TW.floor); if(M<=1) return;
  for(const e of ents){ if(e.team!==1||e.dead) continue; e.max=Math.round(e.max*M); e.hp=Math.round(e.hp*M); e.atk=Math.round((e.atk||0)*M);
    const c=e.c,md=c.modDeal; e.c=Object.assign({},c,{modDeal:(x,t,a,l,o)=>(md?md(x,t,a,l,o):a)*M}); } });
{ const t0=CH.ei.tick,k0=CH.ei.onKill,tw=()=>typeof TW!=='undefined'&&TW&&TW.on;
  CH.ei.tick=function(e,dt){ if(!tw()) return t0.call(this,e,dt); if(e.hp<=e.max/2){ e.r.acc+=dt; if(e.r.acc>=1){ e.r.acc-=1; e.r.healed+=heal(e,.5,true); } } };
  CH.ei.onKill=function(e,t){ if(!tw()) return k0.call(this,e,t); e.r.healed+=heal(e,(e.max-e.hp)*.1); }; }
