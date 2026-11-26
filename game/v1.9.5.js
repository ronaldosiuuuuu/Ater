"use strict";
/* ════════════════ 1.9.5 등반 손질 ════════════════
   · (1.9.10에서 지움) 층마다 강해지던 보정 → game/core.js 등반 수치표 TWB.stat
   · 단련: 최대 체력 +80 → +50 (game/core.js의 BOONS · gain)
   · 등반 중 에이의 패시브(고취) 회복이 절반이다. */
{ const t0=CH.ei.tick,k0=CH.ei.onKill,tw=()=>typeof TW!=='undefined'&&TW&&TW.on;
  CH.ei.tick=function(e,dt){ if(!tw()) return t0.call(this,e,dt); if(e.hp<=e.max/2){ e.r.acc+=dt; if(e.r.acc>=1){ e.r.acc-=1; e.r.healed+=heal(e,.5,true); } } };
  CH.ei.onKill=function(e,t){ if(!tw()) return k0.call(this,e,t); e.r.healed+=heal(e,(e.max-e.hp)*.1); }; }
