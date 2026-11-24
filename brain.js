"use strict";
/* 컴퓨터의 캐릭터별 운용법. 보통·어려움에서만 쓴다(쉬움은 사거리만 보고 누른다).
   BRAIN[key](e,t,d): e=자신, t=상대, d=거리. 스킬을 썼으면 true. e.ai.want = 유지하려는 거리. */
const rdy=(e,s)=>{ const k=e.c.skills[s]; return !!k&&e.cd[s]<=0&&!(s==='ult'&&e.ultUsed)&&(!k.can||k.can(e)); };
const go=(e,s)=>rdy(e,s)&&cast(e,s)!==false;
const hurtNow=e=>e.flash!==undefined&&now-e.flash<.5;
const incoming=e=>projs.some(p=>p.owner.team!==e.team&&Math.hypot(p.x-e.x,p.y-e.y)<3.5&&(p.vx*(e.x-p.x)+p.vy*(e.y-p.y))>0);
const BRAIN={
 castor(e,t,d){ const E=e.hp<=e.max/2; e.ai.want=E?1.8:2.4; if(d<=6&&go(e,'ult')) return true;
   if(d>3&&d<=8&&go(e,'aw')) return true; if(d>2.6&&d<=5.5&&go(e,'n2')) return true; if(d<=3&&go(e,'n1')) return true; if(d<=3.2&&e.cd.n1>3&&go(e,'n2')) return true; if(d<=4&&e.cd.n1>3&&e.cd.n2>3&&go(e,'aw')) return true; },
 ei(e,t,d){ e.ai.want=2.3; if(d<=5&&go(e,'ult')) return true; if(d<=4&&go(e,'n2')) return true; if(d<=4&&go(e,'aw')) return true; if(d<=4&&(e.hp<e.max*.5||e.cd.n2>4)&&go(e,'n1')) return true; },
 mente(e,t,d){ e.ai.want=2.2; if(d<=5&&go(e,'ult')) return true; if(d<=3.5&&go(e,'aw')) return true; if(e.r.tae>now&&d<=CFG.reach+R) return; if(d<=4.5&&go(e,'n2')) return true; if(d<=3.8&&go(e,'n1')) return true; },
 guillaume(e,t,d){ e.ai.want=2.2; if(go(e,'ult')) return true; if(e.hp<=e.max/2&&d<=6&&go(e,'aw')) return true; if(e.hp>e.max*.85&&d<=4&&go(e,'aw')) return true;
   if(d<=10&&(e.hp>30||e.free>now)&&go(e,'n1')) return true; if(d<=3.5&&(e.hp>70||e.free>now)&&go(e,'n2')) return true; },
 harmund(e,t,d){ e.ai.want=2.3; if(d<=5&&go(e,'ult')) return true; const snow=e.r.snow>now; if(snow){ if(d<=8&&go(e,'n2')) return true; if(d<=3&&go(e,'n1')) return true; }
   if(d<=8&&go(e,'n2')) return true; if(d<=6&&go(e,'aw')) return true; if(d<=3&&go(e,'n1')) return true; },
 manannan(e,t,d){ e.ai.want=2.3; if(d<=4&&go(e,'ult')) return true; if(diff===2&&incoming(e)&&go(e,'n2')) return true; if(d<=4&&go(e,'aw')) return true; if(d>3.2&&d<=7&&go(e,'n2')) return true; if(d<=3&&go(e,'n1')) return true; },
 simon(e,t,d){ e.ai.want=1.4; const h=CH.simon.held(e); if(h){ if(go(e,'ult')) return true; if(go(e,'n1')) return true; if(go(e,'n2')) return true; return; }
   if(e.cd.n1>3&&e.cd.n2>3&&d<=4&&go(e,'aw')) return true; if(d<=2.2&&(e.cd.n1<=.6||e.cd.n2<=.6)&&go(e,'crouch')) return true; },
 ginan(e,t,d){ const inn=CH.ginan.inn(e),z=e.r.zn; e.ai.want=1.8; e.ai.anchor=(z&&z.until>now)?{x:z.x,y:z.y,r:4}:null; if(d<=5&&go(e,'ult')) return true;
   if(inn){ if(d<=5&&go(e,'aw')) return true; if(d>1.8&&d<=4&&go(e,'n1')) return true; if(d<=3&&go(e,'n2')) return true; }
   else { if(d<=3.5&&hurtNow(e)&&go(e,'n2')) return true; if(d>2.2&&d<=4&&go(e,'n1')) return true; if(e.hp<e.max*.4&&d<=4&&go(e,'aw')) return true; } },
 janet(e,t,d){ e.ai.want=2.2; const f=CH.janet.faced(e,t); if(e.hp<e.max*.7&&d<=6&&go(e,'ult')) return true; if(f&&d<=6&&go(e,'aw')) return true; if(d<=4&&go(e,'n1')) return true; if(d<=4&&go(e,'n2')) return true; },
 kerker(e,t,d){ e.ai.want=2.1; if(d<=5&&go(e,'ult')) return true; if(d<=3.5&&e.hp<e.max*.8&&go(e,'aw')) return true; if(e.r.st==='고대 짐승'&&e.sh.length) return;
   if(e.hp<e.max*.5){ if(go(e,'n1')) return true; } else if(d<=7&&(e.r.st!=='원숭이'||d>3.5)&&go(e,'n2')) return true; if(e.hp<e.max-12&&e.r.st!=='원숭이'&&go(e,'n1')) return true; },
 ross(e,t,d){ e.ai.want=2.2; if(d<=10&&go(e,'ult')) return true; if(d<=4&&t.hp<t.max*.8&&go(e,'aw')) return true; if((hurtNow(e)||incoming(e))&&d<=6&&go(e,'n2')) return true; if(d<=3.6&&go(e,'n1')) return true; if(d<=4&&e.cd.n1>4&&go(e,'aw')) return true; },
 milio(e,t,d){ e.ai.want=2.2; const gp=has(t,'gap'); if(d<=12&&go(e,'ult')) return true; if(gp&&d<=CFG.reach+R&&e.cd.b<=.1) return; if(gp&&d<=8&&go(e,'n2')) return true; if(d<=3&&go(e,'n1')) return true; if(d>2&&d<=5&&go(e,'aw')) return true; if(d>3.2&&d<=8&&go(e,'n2')) return true; },
 plaus(e,t,d){ e.ai.want=8.5; const sp=has(t,'spirit'); if(d<=6&&go(e,'ult')) return true;
   if(e.r.form&&(d<4.2||e.r.ji>=95)&&go(e,'crouch')) return true; if(!e.r.form&&d>5.5&&e.r.ji<65&&go(e,'crouch')) return true;
   if(sp&&d<=9&&e.r.ji>=50&&go(e,'aw')) return true; if(sp&&d<=10&&go(e,'n2')) return true; if(d<=12&&e.r.ji>=(e.cd.aw<=1?90:e.cd.n2<=1?65:25)&&go(e,'n1')) return true; if(d<=3.5&&go(e,'n2')) return true; },
 epoch(e,t,d){ e.ai.want=7; if(d>5&&go(e,'ult')) return true; if(d<3.2&&rdy(e,'n2')){ if(!e.r.emp&&go(e,'aw')) return true; if(go(e,'n2')) return true; }
   if(d<=10&&rdy(e,'n1')){ if(!e.r.emp&&rdy(e,'aw')&&d>4&&go(e,'aw')) return true; if(go(e,'n1')) return true; } if(d<=6.5&&go(e,'n2')) return true; },
 vira(e,t,d){ e.ai.want=7.5; if(go(e,'ult')) return true; if(e.chant>now) return; if(d<=5&&go(e,'aw')) return true; if(d<=10&&d>3&&go(e,'n2')) return true; if(d<=10&&go(e,'n1')) return true; },
 margrita(e,t,d){ const U=e.r.ut>now; e.ai.want=U?5:2.8; if(d<=8&&go(e,'ult')) return true; if(d>4.2&&d<=8.5&&go(e,'n2')) return true; if(d<=4&&go(e,'aw')) return true; if(e.r.am<=0&&d<=6&&go(e,'n1')) return true; if(d<=3&&e.r.am<=1&&go(e,'n1')) return true;
   if(d<=(U?8:4)+R) basic(e); return true; },
 john(e,t,d){ const st=has(e,'stealth'); if(st){ e.ai.want=1.6; if(d<=2.8){ basic(e); return true; } if(go(e,'ult')) return true; return true; }
   e.ai.want=2.4; if(e.busy>now) return true; if(d<=9&&go(e,'aw')) return true; if(d>3.5&&d<=9&&go(e,'n2')) return true; if(d<=3.5&&go(e,'n1')) return true; },
 kur(e,t,d){ e.ai.want=2; if(d<=6&&go(e,'ult')) return true; if(aired(t)&&d<=4&&go(e,'aw')) return true; if(d<=3&&go(e,'n1')) return true; if(d>2.5&&d<=5&&go(e,'n2')) return true; if(d<=3.5&&e.cd.n1>4&&e.cd.n2>4&&go(e,'aw')) return true; },
 valtma(e,t,d){ e.ai.want=2; /* 사냥감 포착은 마무리용: 상대 체력이 절반 아래일 때만 */ if(d<=5&&t.hp<=t.max*.5&&go(e,'ult')) return true; if(e.r.emp){ if(d<=3&&go(e,'n2')) return true; if(d>3&&d<=7&&go(e,'n1')) return true; if(d<=6&&go(e,'aw')) return true; return; }
   if(d>2.4&&d<=4&&go(e,'n1')) return true; if(d<=3&&go(e,'n2')) return true; if(d<=6&&go(e,'aw')) return true; if(d<=2.4&&e.cd.n2>3&&go(e,'n1')) return true; },
 clover(e,t,d){ e.ai.want=2.2; if(d<=4&&go(e,'ult')) return true; if(d<=5&&go(e,'aw')) return true; if(aired(t)){ if(d<=4&&go(e,'n1')) return true; } else if(d<=4&&go(e,'n2')) return true; },
 cornwall(e,t,d){ e.ai.want=2.3; if(d<=12&&go(e,'ult')) return true; if(e.hp<e.max*.6&&(hurtNow(e)||incoming(e))&&go(e,'aw')) return true; if(d<=4&&go(e,'n2')) return true; if(d<=5&&hurtNow(e)&&go(e,'n1')) return true; },
 eclia(e,t,d){ e.ai.want=2.3; if(e.hp<=45&&go(e,'ult')) return true; if(e.r.big){ if(go(e,'aw')) return true; } else if(e.hp<e.max*.4&&e.hp>70&&go(e,'aw')) return true;
   if(d<=4.5&&hurtNow(e)&&go(e,'n1')) return true; if(d>4&&d<=9&&go(e,'n2')) return true; },
 breck(e,t,d){ e.ai.want=7; const sick=has(t,'sick'); if(d>4&&d<=6&&go(e,'ult')) return true; if(e.r.amp!==(!!sick&&e.r.ju>30&&d<=7)&&go(e,'crouch')) return true;
   if(d<=11&&!sick&&go(e,'n2')) return true; if(d<=11&&go(e,'aw')) return true; if(d<=8&&go(e,'n1')) return true; if(d<=11&&go(e,'n2')) return true; },
 vega(e,t,d){ e.ai.want=2.4; if(e.r.mist>now&&(e.hp<e.max*.75||e.st.some(s=>['slow','root','silence','stun','weak','blind'].includes(s.k)&&!s.self))&&go(e,'ult')) return true;
   if(d<=6&&go(e,'aw')) return true; if(d<=3.2&&hurtNow(e)&&go(e,'n2')) return true; if(d<=4&&go(e,'n1')) return true; },
 merilda(e,t,d){ e.ai.want=8.5; if(d<=8&&go(e,'ult')) return true; if(d<=14&&go(e,'aw')) return true; if(d<4&&go(e,'n2')) return true; if(d<=10&&go(e,'n1')) return true; },
 mimosa(e,t,d){ e.ai.want=9; if(d<=14&&go(e,'ult')) return true; if(d<=8&&go(e,'aw')) return true; if(d<4.5&&go(e,'n2')) return true; if(d<=13&&(d>=6||e.cd.n2>2)&&go(e,'n1')) return true; },
 ford(e,t,d){ e.ai.want=9.5; if(d<=3&&go(e,'crouch')) return true; if(!e.r.wp&&d>7&&go(e,'crouch')) return true; if(d<=13&&go(e,'ult')) return true; if(d<=13&&go(e,'aw')) return true;
   if(d<=13&&(has(t,'pmark')||e.cd.aw>3)&&go(e,'n1')) return true; if(d<=13&&go(e,'n2')) return true; },
 tommy(e,t,d){ e.ai.want=8; if(e.r.am>=4&&d<=12&&go(e,'ult')) return true; if(e.r.am<=3&&d<=9&&go(e,'aw')) return true; if(e.r.am<6&&go(e,'crouch')) return true; if(d<=13&&go(e,'n2')) return true; if(d<=13&&go(e,'n1')) return true; },
 shale(e,t,d){ e.ai.want=8; if(go(e,'ult')) return true; if(d<=11&&go(e,'aw')) return true; if(d<3.5&&go(e,'n2')) return true; if(d<=11&&(e.r.prac||e.r.bok)&&go(e,'crouch')) return true; if(d<=11&&go(e,'n1')) return true; if(!e.r.prac&&e.r.last==='n1'&&go(e,'crouch')) return true; },
 nertina(e,t,d){ e.ai.want=9; if(e.r.acro>now){ if(d<=14&&go(e,'crouch')) return true; return; } if(e.r.stepT>now){ if(d<=4.5&&go(e,'crouch')) return true; return; }
   if(d<6&&go(e,'ult')) return true; if(go(e,'aw')) return true; if(d<=5&&go(e,'n2')) return true; if(e.cd.aw<=0&&e.r.ar>=5&&d>5) return; if(d<=14&&go(e,'n1')) return true; }
};
