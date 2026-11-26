"use strict";
/* 재림·신화의 컴퓨터 운용법. 규칙은 brain.js와 같다. */
const hot=e=>hurtNow(e)||incoming(e);
Object.assign(BRAIN,{
 castor_r(e,t,d){ e.ai.want=e.hp<=e.max/2?1.8:2.3; if(d>3&&d<=8&&go(e,'aw')) return true; if(d<=4.5&&go(e,'n2')) return true; if(d<=3.2&&go(e,'n1')) return true; },
 mimosa_r(e,t,d){ e.ai.want=9; if(d<=20&&go(e,'aw')) return true; if(d<4.5&&go(e,'n2')) return true; if(d<=(e.r.awT>now?30:13)&&go(e,'n1')) return true; },
 plaus_r(e,t,d){ e.ai.want=7; if(!e.r.form&&go(e,'crouch')) return true; if(d<=5&&e.r.ji>=70&&go(e,'aw')) return true; if(d<=4&&go(e,'n2')) return true; if(d<=12&&go(e,'n1')) return true; },
 ginan_r(e,t,d){ e.ai.want=1.8; const z=e.r.zn; e.ai.anchor=(z&&z.until>now&&e.r.div<=now)?{x:z.x,y:z.y,r:4}:null; if(d<=5&&go(e,'aw')) return true; if(d>1.8&&d<=5&&go(e,'n1')) return true; if(d<=4&&go(e,'n2')) return true; },
 ross_r(e,t,d){ e.ai.want=2.2; if(d<=4&&t.hp<t.max*.8&&go(e,'aw')) return true; if(hot(e)&&d<=6&&go(e,'n2')) return true; if(d<=3.6&&go(e,'n1')) return true; },
 harmund_r(e,t,d){ e.ai.want=2.3; if(e.r.snow>now){ if(d<=8&&go(e,'n2')) return true; if(d<=3&&go(e,'n1')) return true; } if(d<=8&&go(e,'n2')) return true; if(d<=6&&go(e,'aw')) return true; if(d<=3&&go(e,'n1')) return true; },
 breck_r(e,t,d){ e.ai.want=7; const sick=has(t,'sick'); if(e.r.amp!==(!!sick&&e.r.ju>30&&d<=7)&&go(e,'crouch')) return true; if(d<=11&&!sick&&go(e,'n2')) return true; if(d<=11&&go(e,'aw')) return true; if(d<=8&&go(e,'n1')) return true; },
 manannan_r(e,t,d){ e.ai.want=2.3; if(d<=10&&(e.r.sim>=5||t.hp<t.max*.3)&&go(e,'aw')) return true; if(d>2.5&&d<=6&&go(e,'n2')) return true; if(d<=3&&go(e,'n1')) return true; },
 nertina_r(e,t,d){ e.ai.want=9; if(e.r.sg>now){ if(d<=14&&go(e,'crouch')) return true; return; } if(go(e,'aw')) return true; if(d<=5.5&&go(e,'n2')) return true; if(e.cd.aw<=0&&e.r.ar>=8&&d>5) return; if(d<=14&&go(e,'n1')) return true; },
 roven_r(e,t,d){ e.ai.want=2.2; if(d<=4&&go(e,'aw')) return true; if(e.r.b===10&&e.r.n===10&&e.cd.aw<=0) return true; if(d<=5&&go(e,'n2')) return true; if(d<=4.5&&go(e,'n1')) return true; },
 baron_r(e,t,d){ e.ai.want=2.4; if(e.r.nx&&d<=4.3){ basic(e); return true; } if(d<=4&&go(e,'n2')) return true; if(d<=5&&go(e,'n1')) return true; if(d>2&&d<=10&&go(e,'aw')) return true; },
 euclein_r(e,t,d){ e.ai.want=2.3; if(d>2.5&&d<=6.5&&go(e,'n2')) return true; if(d<=4&&go(e,'n1')) return true; if(d<=5&&go(e,'aw')) return true; },
 hamel_r(e,t,d){ e.ai.want=2.3; if((dbf(e)||e.hp<e.max*.7)&&go(e,'n1')) return true; if(d<=4&&go(e,'n2')) return true; if(d<=6&&go(e,'aw')) return true; },
 dantalion_r(e,t,d){ e.ai.want=2.4; if(d<=4.5&&go(e,'aw')) return true; if(hurtNow(e)&&d<=5&&go(e,'n2')) return true; if(d<=4&&go(e,'n1')) return true; },
 salomon_r(e,t,d){ e.ai.want=6.5; if(e.r.zn&&e.r.mp<15&&go(e,'crouch')) return true; if(!e.r.zn&&e.r.mp>=60&&d<=6&&go(e,'aw')) return true; if(d<=5&&go(e,'n2')) return true; if(d<=12&&(e.cd.aw>2||e.r.zn||e.r.mp>=85)&&go(e,'n1')) return true; },
 barsa_r(e,t,d){ e.ai.want=7; if(d<3.5&&go(e,'n2')) return true; if(d<=11&&go(e,'aw')) return true; if(d<=9&&go(e,'n1')) return true; },
 fomal_r(e,t,d){ e.ai.want=2.6; if(e.hp<e.max-14&&go(e,'crouch')) return true; if(d>3&&d<=10&&go(e,'n2')) return true; if(d<=3&&e.r.ok>=3&&go(e,'aw')) return true; if(d<=6&&go(e,'n1')) return true; },
 stern_r(e,t,d){ e.ai.want=2.2; if(e.r.cap>=3&&d<=6&&go(e,'aw')) return true; if(d<=3&&go(e,'n2')) return true; if(d>2.2&&d<=4&&(e.r.cap>=2||e.cd.aw>8)&&go(e,'n1')) return true; },
 tyrfing_r(e,t,d){ e.ai.want=2.1; if(d<=6&&e.hp>e.max*.5&&go(e,'aw')) return true; if(d>3&&d<=7&&e.hp>70&&go(e,'n2')) return true; if(d<=5&&go(e,'n1')) return true; },
 mor_r(e,t,d){ e.ai.want=1.8; if(d<=10&&go(e,'aw')) return true; if(d<=15&&go(e,'n2')) return true; if(!e.r.on&&(e.r.sh>=70||e.r.veil>now)&&d<=12&&go(e,'n1')) return true; if(e.r.on&&d>13&&go(e,'n1')) return true; },
 irenio_r(e,t,d){ e.ai.want=3.5; if(e.r.pan>now&&d<=7&&go(e,'crouch')) return true; if(e.r.am>=3&&d<=8&&go(e,'aw')) return true; if(d<=8&&e.r.am>=2&&go(e,'n2')) return true; if((d<=3.6||now-e.r.l1<=6)&&go(e,'n1')) return true; },
 piana_r(e,t,d){ e.ai.want=2.2; if(d<=4&&e.r.sa>=100&&go(e,'aw')) return true; if(e.hp>e.max*.75&&e.r.sa<240&&go(e,'n2')) return true; if(e.r.sa<300&&go(e,'n1')) return true; },
 bunt_r(e,t,d){ e.ai.want=7; if(d>5&&d<=8.5&&go(e,'n2')) return true; if(d<=11&&go(e,'n1')) return true; if(d>4&&d<=10&&go(e,'aw')) return true; },
 reitia_r(e,t,d){ e.ai.want=6.5; if(d<=9&&go(e,'aw')) return true; if(d<=9&&go(e,'n1')) return true; if(d<4&&go(e,'n2')) return true; },
 mars_r(e,t,d){ e.ai.want=2.4; if(e.r.god>now&&d>5&&d<=13&&go(e,'crouch')) return true; if(e.r.ts>0&&d<=5.3){ basic(e); return true; } if(hot(e)&&go(e,'n2')) return true; if(d>2&&d<=8&&go(e,'n1')) return true; if(d<=12&&go(e,'aw')) return true; },
 ur_r(e,t,d){ e.ai.want=2; if(d>2&&d<=10&&go(e,'aw')) return true; if(d>2&&d<=6.5&&go(e,'n2')) return true; if(d<=3.5&&e.r.nb<=now&&go(e,'n1')) return true; },
 alpi_r(e,t,d){ e.ai.want=2.2; if(d<=3&&(has(t,'whirl')||e.cd.n1>4)&&go(e,'aw')) return true; if(d<=4&&go(e,'n1')) return true; if(d>3&&d<=7&&go(e,'n2')) return true; },
 melt_r(e,t,d){ e.ai.want=2.2; if(d<=7&&go(e,'aw')) return true; if(d<=4&&go(e,'n1')) return true; if(d<=5&&hurtNow(e)&&go(e,'n2')) return true; },
 yuri_r(e,t,d){ e.ai.want=2; if(now-e.r.ckT<=.2&&d<=5&&go(e,'n1')) return true; if(e.r.ck&&d<=3.2){ basic(e); return true; } if(d<=5&&go(e,'aw')) return true; if(d<=5&&go(e,'n1')) return true; if(d<=4&&go(e,'n2')) return true; },
 venil_r(e,t,d){ e.ai.want=4.8; if(d<=7&&go(e,'aw')) return true; if(d<=10&&go(e,'n2')) return true; if(d<=6&&(has(t,'vapor')||e.cd.n2>4)&&go(e,'n1')) return true; },
 rano_r(e,t,d){ e.ai.want=2.4; if(hot(e)&&d<=6&&go(e,'n2')) return true; if(d<=6&&go(e,'aw')) return true; if(d<=5&&go(e,'n1')) return true; },
 leus_r(e,t,d){ e.ai.want=2.3; if(e.r.gd>now&&d<=4.5&&go(e,'crouch')) return true; if(e.hp<e.max*.6&&hurtNow(e)&&go(e,'aw')) return true; if(d<=7&&go(e,'n2')) return true; if(d<=3.5&&go(e,'n1')) return true; },
 max(e,t,d){ e.ai.want=2.2; if(d<=8&&go(e,'x4')) return true; if(hot(e)&&d<=6&&go(e,'crouch')) return true; if(e.r.god>now){ if(d<=14&&(e.r.god-now<5||t.hp<=60)&&go(e,'x1')) return true; } else { if(d<=6&&go(e,'aw')) return true; if(e.cd.aw>4&&e.hp>260&&d<=10&&go(e,'x2')) return true; }
   if(d<=10&&e.hp>e.max*.6&&go(e,'x3')) return true; if(d>3.5&&d<=7.5&&go(e,'n2')) return true; if(d<=4.2) basic(e); return true; },   /* 1.9.0: 검격은 기본 공격 단추로 옮겼다 */
 girl(e,t,d){ e.ai.want=5; if(e.hp>e.max*.35&&t.hp<t.max*.8&&go(e,'x1')) return true; if(d<=9&&go(e,'aw')) return true; if(d<=7&&go(e,'n2')) return true; if(d<=10&&go(e,'n1')) return true; },
 arthur(e,t,d){ e.ai.want=2.3; const op=e.r.open>now; if(d<=10&&go(e,'x2')) return true; if(d<=14&&go(e,'x1')) return true; if(!op&&e.r.king<=now&&d<=8&&go(e,'aw')) return true; if(op?d<=4:hurtNow(e)&&d<=5){ if(go(e,'n2')) return true; } if(d<=(op?13:4)&&go(e,'n1')) return true; },
 girl_r(e,t,d){ e.ai.want=7; if(e.cd.x1<=0&&e.hp>e.max*.5&&go(e,'x1')) return true; if(d<=9&&go(e,'aw')) return true; if(d<=15&&go(e,'n2')) return true; if(d<=10&&go(e,'n1')) return true; },
 max_r(e,t,d){ e.ai.want=2.3; if(go(e,'x4')) return true; if(e.r.tr>=2&&d<=14&&go(e,'x3')) return true; if(d<=5&&go(e,'x1')) return true; if(e.r.jip>0&&e.hp>300&&d<=6&&go(e,'x2')) return true; if(d<=8&&go(e,'aw')) return true; if(d>4&&d<=9&&go(e,'n2')) return true; if(d<=Math.min(8,3+e.r.tr)&&go(e,'n1')) return true; }
});
BRAIN.arthur_r=BRAIN.arthur;
