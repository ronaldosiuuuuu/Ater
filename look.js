"use strict";
/* 겉모습: 캐릭터별 몸·무기·고유 자원·상태 표시.
   카드에 적힌 것(창, 도끼, 산탄총, 두 낫, 양손 방패 …)은 그대로 따랐고, 머리색·옷·장식처럼 카드에 없는 것은 Claude가 정했다. */
const EL={ fire:['#ff7a3c','#ffd36b','ember'], forge:['#ffb066','#fff0d0','spark'], ice:['#8fdcff','#eafaff','shard'], steel:['#cfd8ea','#ffffff','spark'],
  blood:['#d8324a','#ff9a9a','drop'], mind:['#f3e7c0','#ffffff','streak'], earth:['#c79a5b','#f1d9a7','rock'], holy:['#ffe9a0','#ffffff','mote'],
  royal:['#6fa2ff','#dfe9ff','spark'], beast:['#c8843c','#ffd9a0','rock'], justice:['#ffd98a','#ffffff','spark'], iron:['#b9b1a3','#ffe2a8','spark'],
  nature:['#7fdc7a','#d6ffb0','leaf'], steam:['#ffb15e','#e8e8e8','smoke'], arcane:['#b58cff','#f0e3ff','star'], hell:['#ff5a2a','#ffb347','ember'],
  shadow:['#8a7bd6','#c9c2ff','smoke'], wind:['#a8f0d0','#f2fff8','streak'], hunt:['#c9e06a','#f3ffd0','streak'], red:['#ff5468','#ffc2c9','streak'],
  blue:['#5aa8ff','#cfe4ff','streak'], curse:['#a6e04f','#c79bff','bubble'], spirit:['#6ff2e0','#e0fffb','mote'], snow:['#dcefff','#ffffff','flake'],
  water:['#4fb6ff','#c9ecff','drop'], powder:['#ffd27a','#fff3d6','spark'], dream:['#ff9fd6','#fff0fa','star'] };
const SKIN='#f0d2b0',INK='#070b1c',WOOD='#8a5a2b',IRON='#aeb7c9';
const LOOK={
 castor:{el:'fire',w:'spear',hair:'#b3261e',acc:['cape'],cape:'#7a1414',tip:'#ff9a4a'},
 ei:{el:'steel',w:'sword',hair:'#c98f4a',acc:['bandana'],band:'#3d6fd1'},
 mente:{el:'forge',w:'greatsword',hair:'#e07a3a',acc:['ponytail','apron'],bl:'#d9c7b0'},
 guillaume:{el:'blood',w:'axe',hair:'#5a3a22',acc:['horns','fur']},
 harmund:{el:'ice',w:'sword',hair:'#eaf6ff',acc:['cape'],cape:'#3b6ea8',bl:'#bfeeff',gd:'#8fdcff'},
 manannan:{el:'mind',w:'saber',hair:'#2b2b3a',acc:['cape','plume'],cape:'#1c2550',plume:'#e3c377'},
 simon:{el:'earth',w:'fists',hair:'#8a5a2b',acc:['pauldrons'],metal:'#9aa3b5'},
 ginan:{el:'holy',w:'mace',hair:'#efe7c8',acc:['halo','pauldrons'],shield:'#f3ead0',metal:'#e9e2c6'},
 janet:{el:'royal',w:'banner',hair:'#d9d9e6',acc:['cape','pauldrons'],cape:'#2c4fb0',shield:'#3b62c9',metal:'#c9d3e6'},
 kerker:{el:'beast',w:'club',hair:'#3a2a1a',acc:['fur','paint']},
 ross:{el:'justice',w:'sword',hair:'#c9d3e6',acc:['plume','pauldrons'],plume:'#c0392b',shield:'#dfe6f3',metal:'#c9d3e6',sh:true},
 milio:{el:'iron',w:'shield2',hair:'#6b7a99',acc:['pauldrons'],shield:'#9aa7c2',metal:'#8793ad'},
 plaus:{el:'nature',w:'leafstaff',hair:'#8fd36a',acc:['sprout','robe']},
 epoch:{el:'steam',w:'wrench',hair:'#c9b28a',acc:['goggles','pack']},
 vira:{el:'arcane',w:'wand',hair:'#f2d28a',acc:['hat','robe'],hat:'#5b3fa8'},
 margrita:{el:'hell',w:'shotgun',hair:'#2a1a1a',acc:['hood','scarf'],hood:'#4a1010',scarf:'#ff5a2a'},
 john:{el:'shadow',w:'dagger',hair:'#4a4460',acc:['hood'],hood:'#2a2740'},
 kur:{el:'wind',w:'claws',hair:'#aab3c5',acc:['ears','tail']},
 valtma:{el:'hunt',w:'dagger2',hair:'#3d4a2a',acc:['hood','scarf'],hood:'#33452a',scarf:'#c9e06a'},
 clover:{el:'red',w:'scythes',hair:'#ffffff',acc:['jester']},
 cornwall:{el:'holy',w:'holysword',hair:'#f1e3a0',acc:['cape','crown'],cape:'#f5f1e3',gd:'#e3c377',bl:'#fff6d0'},
 eclia:{el:'holy',w:'ringstaff',hair:'#f3efe6',acc:['veil','robe']},
 breck:{el:'curse',w:'doll',hair:'#efe9dc',acc:['mask','robe']},
 vega:{el:'spirit',w:'spirit',hair:'#9ff2e6',acc:['ponytail','robe']},
 merilda:{el:'snow',w:'crossbow',hair:'#dfe9f5',acc:['hood','cape'],hood:'#eef4fb',cape:'#cfdcec'},
 mimosa:{el:'water',w:'rifle',hair:'#2f5fa8',acc:['ponytail','scarf'],scarf:'#4fb6ff'},
 ford:{el:'iron',w:'greatbow',hair:'#8a8f99',acc:['pauldrons'],metal:'#7c828f'},
 tommy:{el:'powder',w:'revolver',hair:'#7a4a22',acc:['cowboy','scarf'],scarf:'#c0392b'},
 shale:{el:'dream',w:'crossbow',hair:'#ffb3dd',acc:['ribbon']},
 nertina:{el:'wind',w:'bow',hair:'#e6c36a',acc:['quiver','ponytail']}
};
const elOf=e=>EL[(LOOK[e.key]||{}).el||'steel'];

/* ───── 입자 ───── */
function puff(x,y,el,n,spd,life){ const E=typeof el==='string'?EL[el]:el; if(!E||parts.length>260) return; for(let i=0;i<n;i++){ const a=Math.random()*6.283,v=(spd||3)*(.3+Math.random()); parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,t0:now,life:(life||.45)*(.7+Math.random()*.6),col:E[i&1],sh:E[2],rot:a}); } }
function drawPart(pt,a){ const dt=now-pt.t0,k=1-a*.5; let x=pt.x+pt.vx*dt*k,y=pt.y+pt.vy*dt*k; g.fillStyle=g.strokeStyle=pt.col;
  switch(pt.sh){
   case 'ember': y-=dt*1.6; g.beginPath(); g.arc(x,y,.07*(1-a*.6),0,7); g.fill(); break;
   case 'mote': y-=dt*.9; g.beginPath(); g.arc(x,y,.055,0,7); g.fill(); break;
   case 'bubble': y-=dt*1.2; g.lineWidth=.03; g.beginPath(); g.arc(x,y,.06+a*.06,0,7); g.stroke(); break;
   case 'drop': y+=dt*dt*5; g.beginPath(); g.arc(x,y,.06,0,7); g.fill(); break;
   case 'rock': y+=dt*dt*6; g.fillRect(x-.06,y-.06,.12,.12); break;
   case 'smoke': g.globalAlpha*=.5; g.beginPath(); g.arc(x,y-dt*.8,.08+a*.22,0,7); g.fill(); break;
   case 'spark': case 'streak': { const L=pt.sh==='spark'?.16:.34,n=Math.hypot(pt.vx,pt.vy)||1; g.lineWidth=pt.sh==='spark'?.045:.035; g.beginPath(); g.moveTo(x,y); g.lineTo(x-pt.vx/n*L,y-pt.vy/n*L); g.stroke(); break; }
   case 'shard': { const r=.1*(1-a*.5); g.save(); g.translate(x,y); g.rotate(pt.rot+dt*4); g.beginPath(); g.moveTo(r*1.6,0); g.lineTo(0,r*.6); g.lineTo(-r*1.6,0); g.lineTo(0,-r*.6); g.closePath(); g.fill(); g.restore(); break; }
   case 'leaf': g.save(); g.translate(x,y+dt*.5); g.rotate(pt.rot+dt*5); g.beginPath(); g.ellipse(0,0,.11,.05,0,0,7); g.fill(); g.restore(); break;
   case 'star': { const r=.1*(1-a*.4); g.save(); g.translate(x,y); g.rotate(pt.rot+dt*3); g.beginPath(); for(let i=0;i<8;i++){ const q=i*Math.PI/4,rr=i&1?r*.35:r; g.lineTo(Math.cos(q)*rr,Math.sin(q)*rr); } g.closePath(); g.fill(); g.restore(); break; }
   case 'flake': y+=dt*.8; g.lineWidth=.03; g.beginPath(); g.moveTo(x-.07,y); g.lineTo(x+.07,y); g.moveTo(x,y-.07); g.lineTo(x,y+.07); g.stroke(); break;
   default: g.fillRect(x-.06,y-.06,.13,.13); } }
function hitFx(src,t,amt){ const big=amt>=25; puff(t.x,t.y-t.z*.45,elOf(src),big?9:4,big?6:3.5); }

/* ───── 궁극기 진행·자원 ───── */
const RES={
 castor:{u:e=>e.r.airs/16*(e.hp<=e.max/2?1:.92)}, ei:{u:e=>e.r.healed/200}, mente:{u:e=>e.r.proc/30}, guillaume:{u:e=>24/Math.max(24,e.hp)},
 harmund:{u:e=>e.r.ok?1:0}, manannan:{u:e=>e.r.sim/20}, simon:{u:e=>(Math.min(6,e.r.c1)+Math.min(6,e.r.c2))/12}, ginan:{u:e=>e.r.t/30},
 janet:{u:e=>e.r.red/50}, kerker:{u:e=>e.r.proc/30}, ross:{u:e=>e.r.exec?1:0}, milio:{u:e=>e.r.inst/24},
 plaus:{u:e=>(Math.min(1,e.r.ft/90)+Math.min(1,e.r.sp/12))/2,gz:e=>[e.r.ji/100,'#7fdc7a']}, epoch:{u:e=>e.r.casts/12}, vira:{u:e=>e.r.hits/50},
 margrita:{u:e=>e.r.bd/400,p:e=>[e.r.am,e.r.ut>now?8:4,e.r.nk>now?'#ff5a2a':'#ffd27a']}, john:{u:e=>e.r.streak/3}, kur:{u:e=>e.r.kill?1:0},
 valtma:{u:e=>e.r.hitAny?1:0,p:e=>e.r.emp?[3,3,'#f3ffd0']:[e.r.cnt,3,'#c9e06a']}, clover:{u:e=>e.r.cnt/30}, cornwall:{u:()=>0},
 eclia:{u:e=>e.r.proc/7,p:e=>e.r.ign>0?[e.r.ign,3,'#ffe9a0']:null}, breck:{u:e=>e.r.cc/60,gz:e=>[e.r.ju/80,e.r.amp?'#c79bff':'#a6e04f']}, vega:{u:e=>e.r.mist>now?1:0},
 merilda:{u:e=>e.r.hits/16}, mimosa:{u:e=>e.r.u/18,p:e=>e.r.awT>now?[e.r.awN,4,'#4fb6ff']:null}, ford:{u:e=>e.r.wd/350},
 tommy:{u:e=>e.r.hits/54,p:e=>[e.r.am,6,'#ffd27a']}, shale:{u:e=>e.r.re/20}, nertina:{u:e=>e.r.ar===0?1:0,p:e=>e.r.stepT>now?[e.r.steps,5,'#f2fff8']:[e.r.ar,10,'#a8f0d0']}
};
function drawRes(e){ const Rz=RES[e.key]; if(!Rz) return; const cx=e.x,cy=e.y+.06;
  if(Rz.u&&!e.ultUsed){ const u=Math.max(0,Math.min(1,Rz.u(e))); if(u>0){ const full=u>=1&&(!e.c.skills.ult.can||e.c.skills.ult.can(e)); g.strokeStyle=full?'#fff6d6':'#e3c377'; g.lineWidth=(full?3.2:2)/cell; if(full){ g.shadowColor='#e3c377'; g.shadowBlur=8+6*Math.sin(now*8); }
      g.beginPath(); g.ellipse(cx,cy,R*1.3,R*.82,0,-Math.PI/2,-Math.PI/2+6.283*u); g.stroke(); g.shadowBlur=0; } }
  if(Rz.gz){ const [f,col]=Rz.gz(e); if(f>0){ g.strokeStyle=col; g.lineWidth=2.4/cell; g.beginPath(); g.ellipse(cx,cy,R*1.52,R*.98,0,Math.PI/2-2.6*Math.min(1,f),Math.PI/2+2.6*Math.min(1,f)); g.stroke(); } }
  if(Rz.p){ const p=Rz.p(e); if(p){ const [n,max,col]=p,back=Math.atan2(-e.aim.y,-e.aim.x),sp=Math.min(.26,2.4/max); for(let i=0;i<max;i++){ const a=back+(i-(max-1)/2)*sp,x=e.x+Math.cos(a)*.92,y=e.y+.06+Math.sin(a)*.66;
        g.beginPath(); g.arc(x,y,.075,0,7); if(i<n){ g.fillStyle=col; g.fill(); } else { g.strokeStyle='#3a4788'; g.lineWidth=1.2/cell; g.stroke(); } } } } }

/* ───── 캐릭터 고유 상태(몸 주변) ───── */
const emit=(e,by,el,rate,r)=>{ if(Math.random()<rate) puff(e.x+(Math.random()-.5)*(r||.7),by+(Math.random()-.5)*(r||.7),el,1,1.2,.6); };
const ringAt=(x,y,r,col,w,dash)=>{ g.strokeStyle=col; g.lineWidth=(w||2)/cell; if(dash) g.setLineDash(dash); g.beginPath(); g.ellipse(x,y+.06,r,r*.62,0,0,7); g.stroke(); if(dash) g.setLineDash([]); };
function markOn(t,col,txt){ if(!t||t.dead) return; const y=t.y-t.z*.45,a=now*2.2; g.strokeStyle=col; g.lineWidth=2/cell; g.beginPath(); g.arc(t.x,y,.78,0,7); g.stroke(); g.beginPath(); for(let i=0;i<4;i++){ const q=a+i*Math.PI/2; g.moveTo(t.x+Math.cos(q)*.6,y+Math.sin(q)*.6); g.lineTo(t.x+Math.cos(q)*1,y+Math.sin(q)*1); } g.stroke();
  if(txt){ g.font='700 .36px "Gothic A1",sans-serif'; g.textAlign='center'; g.fillStyle=col; g.fillText(txt,t.x,y-1.05); } }
const AURA={
 castor(e,by){ if(e.hp<=e.max/2){ emit(e,by,'fire',.45,.9); ringAt(e.x,e.y,.7,'rgba(255,122,60,.7)',2.5); } },
 ei(e,by){ if(e.hp<=e.max/2) emit(e,by,'holy',.12); },
 mente(e,by){ if(e.r.tae>now) emit(e,by,'forge',.4); if(e.r.awT>now) ringAt(e.x,e.y,.72,'rgba(255,176,102,.7)',2,[.18,.14]); },
 guillaume(e,by){ const m=1-e.hp/e.max; if(m>.1) emit(e,by,'blood',m*.5); if(e.r.nb>now) ringAt(e.x,e.y,.7,'#d8324a',3); if(e.free>now) ringAt(e.x,e.y,.9,'#ff9a9a',4); },
 harmund(e,by){ if(e.r.snow>now) emit(e,by,'snow',.6,1.6); if(e.r.pcd<=0) ringAt(e.x,e.y,.68,'rgba(143,220,255,.55)',1.5,[.1,.16]); },
 manannan(e,by){ if(e.r.gp){ const q=(now*3)%1; ringAt(e.x,e.y,.6+q*.35,'rgba(243,231,192,'+(1-q)+')',2); } },
 simon(e,by){ if(e.r.emp){ emit(e,by,'earth',.35); ringAt(e.x,e.y,.75,'#f1d9a7',3); } },
 ginan(e,by){ if(e.r.forced>now) emit(e,by,'holy',.5,1.1); },
 janet(e,by){ if(e.r.x2>now) ringAt(e.x,e.y,.8,'#6fa2ff',3.5); },
 kerker(e,by){ const c={멧돼지:'#d07a5a',원숭이:'#ffd36b','고대 짐승':'#b08cff'}[e.r.st]; if(c){ ringAt(e.x,e.y,.72,c,2.5,[.3,.12]); if(e.r.ut>now) ringAt(e.x,e.y,.9,c,2); } },
 ross(e,by){ if(e.r.adv>now) emit(e,by,'justice',.35); if(e.r.rivalT>now) markOn(e.r.rival,'#ffd98a','숙적'); },
 plaus(e,by){ if(e.r.form){ g.strokeStyle='#5aa85a'; g.lineWidth=2.5/cell; g.beginPath(); for(let i=0;i<6;i++){ const a=i*1.047+.3; g.moveTo(e.x+Math.cos(a)*.35,e.y+.06+Math.sin(a)*.22); g.quadraticCurveTo(e.x+Math.cos(a+.4)*.7,e.y+.06+Math.sin(a+.4)*.44,e.x+Math.cos(a)*1.05,e.y+.06+Math.sin(a)*.66); } g.stroke(); emit(e,by,'nature',.25,1.2); } },
 epoch(e,by){ if(e.r.emp) emit(e,by,'steam',.5); const a=now*(inFight(e)?5:1.5),x=e.x-e.aim.x*.55,y=by-e.aim.y*.55; g.strokeStyle=inFight(e)?'#ffb15e':'#8a8f99'; g.lineWidth=2/cell; g.beginPath(); for(let i=0;i<6;i++){ const q=a+i*1.047; g.moveTo(x+Math.cos(q)*.1,y+Math.sin(q)*.1); g.lineTo(x+Math.cos(q)*.2,y+Math.sin(q)*.2); } g.stroke(); },
 vira(e,by){ if(e.r.lv) emit(e,by,'arcane',.6,1.2); },
 margrita(e,by){ if(e.r.nk>now||e.r.ut>now) emit(e,by,'hell',.5); if(e.r.ut>now) ringAt(e.x,e.y,.8,'#ff5a2a',3); },
 john(e,by){ if(e.r.steal) emit(e,by,'shadow',.4); },
 kur(e,by){ if(e.r.pcd<=0) emit(e,by,'wind',.18); },
 valtma(e,by){ if(e.r.emp){ emit(e,by,'hunt',.4); ringAt(e.x,e.y,.72,'#c9e06a',2.5); } if(e.r.preyT>now) markOn(e.r.prey,'#c9e06a','사냥감'); },
 clover(e,by){ if(e.r.lt>now){ const c=e.r.last==='바갈타크'?'#5aa8ff':e.r.last==='타흘룸'?'#ff5468':'#d79bff'; ringAt(e.x,e.y,.7,c,2.5); } },
 cornwall(e,by){ if(has(e,'invuln')){ g.fillStyle='rgba(255,233,160,.25)'; g.strokeStyle='#fff6d6'; g.lineWidth=3/cell; g.beginPath(); g.arc(e.x,by,.85,0,7); g.fill(); g.stroke(); } },
 eclia(e,by){ if(e.r.big){ ringAt(e.x,e.y,.85+.05*Math.sin(now*5),'#ffe9a0',3); emit(e,by,'holy',.3); } },
 breck(e,by){ if(e.r.amp){ ringAt(e.x,e.y,7,'rgba(166,224,79,.45)',1.5,[.3,.3]); emit(e,by,'curse',.4); } },
 vega(e,by){ if(e.r.form>now){ emit(e,by,'spirit',.5,1.1); ringAt(e.x,e.y,.8,'rgba(111,242,224,.8)',3); } },
 merilda(e,by){},
 mimosa(e,by){ if(e.r.awT>now) emit(e,by,'water',.5,1.2); },
 ford(e,by){ if(e.r.wp){ g.fillStyle='rgba(124,130,143,.55)'; g.strokeStyle='#ffe2a8'; g.lineWidth=2/cell; g.beginPath(); for(let i=0;i<4;i++){ const a=i*1.571+.785; g.moveTo(e.x,e.y+.06); g.lineTo(e.x+Math.cos(a)*1.05,e.y+.06+Math.sin(a)*.66); } g.stroke(); g.fillRect(e.x-.5,e.y-.26,1,.64); g.strokeRect(e.x-.5,e.y-.26,1,.64); } },
 tommy(e,by){}, shale(e,by){ if(e.r.bok||e.r.prac) emit(e,by,'dream',.3); }, milio(e,by){},
 nertina(e,by){ if(e.r.acro>now||e.r.stepT>now) emit(e,by,'wind',.5,1.1); }
};

/* ───── 걸린 상태를 몸 위에 그린다 ───── */
function drawStatus(e,by,rr){ for(const s of e.st){ const x=e.x;
    switch(s.k){
     case 'stun': g.fillStyle='#ffe27a'; for(let i=0;i<3;i++){ const a=now*5+i*2.094,sx=x+Math.cos(a)*.42,sy=by-rr-.12+Math.sin(a)*.14; g.beginPath(); for(let j=0;j<8;j++){ const q=j*Math.PI/4,r2=j&1?.04:.1; g.lineTo(sx+Math.cos(q)*r2,sy+Math.sin(q)*r2); } g.fill(); } break;
     case 'root': g.strokeStyle=s.by?elOf(s.by)[0]:'#7fdc7a'; g.lineWidth=2.5/cell; g.beginPath(); for(let i=0;i<5;i++){ const a=i*1.257+.4; g.moveTo(x+Math.cos(a)*.75,e.y+.06+Math.sin(a)*.46); g.quadraticCurveTo(x+Math.cos(a+.6)*.5,e.y+.06+Math.sin(a+.6)*.3,x+Math.cos(a)*.22,e.y-.05+Math.sin(a)*.14); } g.stroke(); break;
     case 'slow': g.strokeStyle='#7fb7ff'; g.lineWidth=2/cell; g.beginPath(); for(let i=-1;i<=1;i++){ const sx=x+i*.3,sy=e.y+.5+((now*1.2+i*.3)%1)*.2; g.moveTo(sx-.09,sy-.08); g.lineTo(sx,sy); g.lineTo(sx+.09,sy-.08); } g.stroke(); break;
     case 'silence': g.strokeStyle='#d7a6ff'; g.lineWidth=2.5/cell; g.beginPath(); g.arc(x+rr+.2,by-rr,.16,0,7); g.moveTo(x+rr+.09,by-rr-.11); g.lineTo(x+rr+.31,by-rr+.11); g.stroke(); break;
     case 'freeze': g.fillStyle='rgba(143,220,255,.35)'; g.strokeStyle='#eafaff'; g.lineWidth=2/cell; g.beginPath(); for(let i=0;i<6;i++){ const a=i*1.047+.52; g.lineTo(x+Math.cos(a)*(rr+.22),by+Math.sin(a)*(rr+.22)); } g.closePath(); g.fill(); g.stroke(); break;
     case 'scorch': if(Math.random()<.5) puff(x+(Math.random()-.5)*.7,by+(Math.random()-.5)*.5,'hell',1,1,.5); break;
     case 'sick': if(Math.random()<.35) puff(x+(Math.random()-.5)*.7,by+(Math.random()-.5)*.5,'curse',1,.8,.7); break;
     case 'spirit': { const a=now*4; g.fillStyle='#d6ffb0'; g.shadowColor='#7fdc7a'; g.shadowBlur=8; g.beginPath(); g.arc(x+Math.cos(a)*.7,by+Math.sin(a)*.45,.1,0,7); g.fill(); g.shadowBlur=0; break; }
     case 'spot': { g.strokeStyle='#ffffff'; g.lineWidth=1.6/cell; const a=-now*1.5; g.beginPath(); g.arc(x,by,rr+.3,a,a+1.2); g.stroke(); g.beginPath(); g.arc(x,by,rr+.3,a+3.14,a+4.34); g.stroke(); g.beginPath(); g.moveTo(x-rr-.5,by); g.lineTo(x-rr-.15,by); g.moveTo(x+rr+.15,by); g.lineTo(x+rr+.5,by); g.stroke(); break; }
     case 'gap': g.strokeStyle=s.v==='perm'?'#fff6d6':'#ffe2a8'; g.lineWidth=2.5/cell; g.beginPath(); g.moveTo(x-.12,by-rr-.34); g.lineTo(x+.06,by-rr-.2); g.lineTo(x-.06,by-rr-.1); g.lineTo(x+.12,by-rr+.06); g.stroke(); break;
     case 'face': if(s.by&&!s.by.dead){ g.strokeStyle='rgba(111,162,255,.45)'; g.lineWidth=1.5/cell; g.setLineDash([.2,.2]); g.beginPath(); g.moveTo(x,by); g.lineTo(s.by.x,s.by.y-s.by.z*.45); g.stroke(); g.setLineDash([]); } break;
     case 'pmark': g.strokeStyle='#ff6a5a'; g.lineWidth=1.8/cell; for(const r2 of [.3,.62]){ g.beginPath(); g.arc(x,by,rr+r2-.3,0,7); g.stroke(); } break;
     case 'grab': if(s.by&&!s.by.dead){ g.strokeStyle='#f1d9a7'; g.lineWidth=4/cell; g.beginPath(); g.moveTo(s.by.x,s.by.y-s.by.z*.45); g.lineTo(x,by); g.stroke(); } break;
     case 'vuln': g.fillStyle='#ff9ad5'; g.beginPath(); g.moveTo(x-rr-.34,by-.14); g.lineTo(x-rr-.14,by-.14); g.lineTo(x-rr-.24,by+.06); g.closePath(); g.fill(); break;
     case 'disarm': g.strokeStyle='#ff7d8c'; g.lineWidth=3/cell; g.beginPath(); g.moveTo(x-.3,by-.3); g.lineTo(x+.3,by+.3); g.moveTo(x+.3,by-.3); g.lineTo(x-.3,by+.3); g.stroke(); break;
    } } }

/* ───── 무기 ───── */
function drawWeapon(e,L,el,sw,cq,rc){ const c1=el[0],c2=el[1],act=sw<1,u=act?sw:0,ez=u*u*(3-2*u),lit=cq<1,rk=rc<1?Math.sin(Math.PI*rc)*.14:0;
  const hand=(x,y,col)=>{ g.shadowBlur=0; g.fillStyle=col||SKIN; g.strokeStyle=INK; g.lineWidth=.035; g.beginPath(); g.arc(x,y,.09,0,7); g.fill(); g.stroke(); };
  const bar=(x0,x1,w,col)=>{ g.strokeStyle=col; g.lineWidth=w; g.beginPath(); g.moveTo(x0,0); g.lineTo(x1,0); g.stroke(); };
  const blade=(len,w,col)=>{ g.fillStyle=col; g.strokeStyle=INK; g.lineWidth=.03; g.beginPath(); g.moveTo(.1,-w/2); g.lineTo(len-w*1.2,-w/2); g.lineTo(len,0); g.lineTo(len-w*1.2,w/2); g.lineTo(.1,w/2); g.closePath(); g.fill(); g.stroke(); };
  const guard=(w,col)=>{ g.strokeStyle=col||'#c9a04a'; g.lineWidth=.07; g.beginPath(); g.moveTo(.1,-w); g.lineTo(.1,w); g.stroke(); };
  const glowOn=()=>{ if(lit){ g.shadowColor=c1; g.shadowBlur=14; } };
  const swing=(fn,rest,side)=>{ const sy=side||1; g.save(); if(act){ g.translate(.2,.1*sy); g.rotate((1.25-2.4*ez)*sy); } else { g.translate(.14,.4*sy); g.rotate((rest===undefined?.32:rest)*sy); } glowOn(); fn(); g.restore(); hand(act?.2:.14,(act?.1:.4)*sy); };
  const thrust=(fn)=>{ const d=act?Math.sin(Math.PI*u)*.55:0; g.save(); g.translate(.14+d,.36); glowOn(); fn(); g.restore(); hand(.14+d,.36); hand(.34+d,.3); };
  const aimed=(fn,y)=>{ g.save(); g.translate(.2-rk,y===undefined?.2:y); if(act) g.rotate(-.5*Math.sin(Math.PI*u)); glowOn(); fn(); g.restore(); };
  const shieldL=(col)=>{ g.shadowBlur=0; g.strokeStyle=INK; g.lineWidth=.2; g.beginPath(); g.arc(.02,-.3,.36,-1.35,.45); g.stroke(); g.strokeStyle=col||IRON; g.lineWidth=.14; g.beginPath(); g.arc(.02,-.3,.36,-1.3,.4); g.stroke(); g.strokeStyle=c1; g.lineWidth=.04; g.beginPath(); g.arc(.02,-.3,.36,-.75,-.15); g.stroke(); };
  switch(L.w){
   case 'sword': case 'holysword': case 'saber': { const len=L.w==='saber'?1.12:L.w==='holysword'?1.05:.95,w=L.w==='saber'?.08:.11; if(L.sh||L.shield) shieldL(L.shield); else hand(.14,-.4);
       swing(()=>{ if(L.w==='holysword'||e.key==='harmund'){ g.shadowColor=c1; g.shadowBlur=10; } blade(len,w,L.bl||'#e8eef8'); g.shadowBlur=0; guard(L.w==='holysword'?.2:.14,L.gd); }); break; }
   case 'greatsword': hand(.3,.2); swing(()=>{ blade(1.42,.24,L.bl||'#d9dfeb'); g.strokeStyle=c1; g.lineWidth=.04; g.beginPath(); g.moveTo(.25,0); g.lineTo(1.1,0); g.stroke(); guard(.22,'#6b5a4a'); },.55); break;
   case 'spear': thrust(()=>{ bar(-.55,1.12,.07,WOOD); g.fillStyle=L.tip||'#e8eef8'; g.strokeStyle=INK; g.lineWidth=.03; g.beginPath(); g.moveTo(1.05,-.1); g.lineTo(1.48,0); g.lineTo(1.05,.1); g.closePath(); g.fill(); g.stroke(); }); break;
   case 'banner': shieldL(L.shield); thrust(()=>{ bar(-.5,1.1,.07,'#d9d9e6'); g.fillStyle='#e8eef8'; g.strokeStyle=INK; g.lineWidth=.03; g.beginPath(); g.moveTo(1.05,-.09); g.lineTo(1.42,0); g.lineTo(1.05,.09); g.closePath(); g.fill(); g.stroke();
       const wv=Math.sin(now*7)*.06; g.fillStyle='#2c4fb0'; g.beginPath(); g.moveTo(.95,.04); g.lineTo(.5,.36+wv); g.lineTo(.62,.2); g.lineTo(.4,.1+wv); g.lineTo(.55,.04); g.closePath(); g.fill(); g.stroke(); }); break;
   case 'axe': hand(.14,-.4); swing(()=>{ bar(0,.88,.08,WOOD); g.fillStyle='#c9d0dc'; g.strokeStyle=INK; g.lineWidth=.03; g.beginPath(); g.moveTo(.62,-.04); g.quadraticCurveTo(.7,-.42,1,-.36); g.quadraticCurveTo(.86,-.1,1,.12); g.quadraticCurveTo(.78,.1,.62,.04); g.closePath(); g.fill(); g.stroke(); },.5); break;
   case 'club': hand(.14,-.4); swing(()=>{ g.fillStyle='#7a4f2a'; g.strokeStyle=INK; g.lineWidth=.035; g.beginPath(); g.moveTo(0,-.05); g.lineTo(.95,-.17); g.quadraticCurveTo(1.12,0,.95,.17); g.lineTo(0,.05); g.closePath(); g.fill(); g.stroke(); g.fillStyle='#e9dcc0'; for(const p of [[.7,-.2],[.85,.2],[1.02,-.08]]){ g.beginPath(); g.arc(p[0],p[1],.05,0,7); g.fill(); } },.5); break;
   case 'mace': if(L.nosh) hand(.14,-.4); else shieldL(L.shield); swing(()=>{ bar(0,.62,.07,'#c9b98a'); g.fillStyle='#f3ead0'; g.strokeStyle=INK; g.lineWidth=.03; g.beginPath(); for(let i=0;i<12;i++){ const a=i*.5236,r2=i&1?.11:.19; g.lineTo(.72+Math.cos(a)*r2,Math.sin(a)*r2); } g.closePath(); g.fill(); g.stroke(); }); break;
   case 'fists': { const p=act?Math.sin(Math.PI*u)*.42:0,alt=(e.swingN||0)&1; for(const sy of [1,-1]){ const fwd=(sy===1)!==!!alt?p:0; g.fillStyle=lit?c2:'#b9a182'; g.strokeStyle=INK; g.lineWidth=.04; if(lit){ g.shadowColor=c1; g.shadowBlur=12; } g.beginPath(); g.arc(.26+fwd,.36*sy,.15,0,7); g.fill(); g.stroke(); g.shadowBlur=0; } break; }
   case 'shield2': { const p=act?Math.sin(Math.PI*u)*.3:0; for(const sy of [1,-1]){ g.save(); g.translate(p,0); g.strokeStyle=INK; g.lineWidth=.22; g.beginPath(); g.arc(.04,.28*sy,.4,sy>0?-.5:-1.25,sy>0?1.25:.5); g.stroke(); g.strokeStyle=L.shield; g.lineWidth=.16; g.beginPath(); g.arc(.04,.28*sy,.4,sy>0?-.45:-1.2,sy>0?1.2:.45); g.stroke(); g.strokeStyle=lit?c2:c1; g.lineWidth=.04; g.beginPath(); g.arc(.04,.28*sy,.4,sy>0?.1:-.7,sy>0?.7:-.1); g.stroke(); g.restore(); } break; }
   case 'leafstaff': case 'ringstaff': hand(.14,-.4); swing(()=>{ bar(-.3,.98,.07,L.w==='leafstaff'?'#6b4a2a':'#d9cfae'); g.shadowColor=c1; g.shadowBlur=lit?16:7;
       if(L.w==='leafstaff'){ g.fillStyle='#7fdc7a'; g.strokeStyle=INK; g.lineWidth=.03; for(const a of [-.6,.6]){ g.save(); g.translate(1,0); g.rotate(a); g.beginPath(); g.ellipse(.14,0,.19,.08,0,0,7); g.fill(); g.stroke(); g.restore(); } }
       else { g.strokeStyle='#e3c377'; g.lineWidth=.06; g.beginPath(); g.arc(1.1,0,.17,0,7); g.stroke(); } g.shadowBlur=0; },.15); break;
   case 'wand': hand(.14,-.4); swing(()=>{ bar(0,.52,.055,'#3a2a5a'); g.fillStyle=c2; g.shadowColor=c1; g.shadowBlur=lit?18:9; g.beginPath(); for(let i=0;i<8;i++){ const a=i*Math.PI/4+now*2,r2=i&1?.06:.15; g.lineTo(.6+Math.cos(a)*r2,Math.sin(a)*r2); } g.closePath(); g.fill(); g.shadowBlur=0; },.1); break;
   case 'wrench': hand(.14,-.4); swing(()=>{ bar(0,.66,.08,'#9aa3b5'); g.strokeStyle='#c9d0dc'; g.lineWidth=.09; g.beginPath(); g.arc(.78,0,.14,.7,5.58); g.stroke(); }); break;
   case 'shotgun': aimed(()=>{ bar(-.22,.12,.13,'#5a3a22'); g.strokeStyle=INK; g.lineWidth=.19; g.beginPath(); g.moveTo(.1,0); g.lineTo(.98,0); g.stroke(); g.strokeStyle=(e.r&&(e.r.nk>now||e.r.ut>now))?'#ff8a4a':'#4a4f5c'; g.lineWidth=.06; g.beginPath(); g.moveTo(.1,-.045); g.lineTo(.98,-.045); g.moveTo(.1,.045); g.lineTo(.98,.045); g.stroke(); if(rc<.35){ g.fillStyle=c2; g.beginPath(); g.arc(1.08,0,.2*(1-rc/.35),0,7); g.fill(); } }); hand(.14,.24); hand(.56-rk,.16); break;
   case 'rifle': aimed(()=>{ bar(-.28,.1,.11,'#3a4a6a'); bar(.1,1.2,.06,'#9fc6ee'); g.fillStyle=c1; g.fillRect(.3,-.1,.2,.06); if(rc<.35){ g.fillStyle=c2; g.beginPath(); g.arc(1.26,0,.16*(1-rc/.35),0,7); g.fill(); } }); hand(.14,.24); hand(.6-rk,.17); break;
   case 'revolver': hand(.14,-.4); aimed(()=>{ bar(.02,.46,.075,'#c9d0dc'); g.fillStyle='#8a8f99'; g.strokeStyle=INK; g.lineWidth=.03; g.beginPath(); g.arc(.12,0,.1,0,7); g.fill(); g.stroke(); if(rc<.35){ g.fillStyle=c2; g.beginPath(); g.arc(.56,0,.17*(1-rc/.35),0,7); g.fill(); } },.3); hand(.2-rk,.3); break;
   case 'bow': case 'greatbow': { const big=L.w==='greatbow',rr2=big?.56:.44,pull=rc<1?0:(big?.2:.16); g.save(); g.translate(.2,0); glowOn(); g.strokeStyle=big?'#6b6f7a':'#8a5a2b'; g.lineWidth=big?.1:.07; g.beginPath(); g.arc(.02,0,rr2,-1.2,1.2); g.stroke();
       const ex=.02+Math.cos(1.2)*rr2,ey=Math.sin(1.2)*rr2; g.strokeStyle='#eef1ff'; g.lineWidth=.025; g.beginPath(); g.moveTo(ex,-ey); g.lineTo(ex-pull,0); g.lineTo(ex,ey); g.stroke();
       const has1=e.key!=='nertina'||e.r.ar>0; if(has1&&rc>=1){ g.strokeStyle=c2; g.lineWidth=big?.06:.04; g.beginPath(); g.moveTo(ex-pull,0); g.lineTo(rr2+.3,0); g.stroke(); } g.restore(); hand(.2+rr2,0); hand(.2+ex-pull,0); break; }
   case 'crossbow': aimed(()=>{ bar(-.2,.72,.09,WOOD); g.strokeStyle='#c9d0dc'; g.lineWidth=.06; g.beginPath(); g.moveTo(.5,-.34); g.quadraticCurveTo(.78,0,.5,.34); g.stroke(); g.strokeStyle='#eef1ff'; g.lineWidth=.02; g.beginPath(); g.moveTo(.5,-.34); g.lineTo(.3,0); g.lineTo(.5,.34); g.stroke(); if(rc>=1){ g.strokeStyle=c2; g.lineWidth=.045; g.beginPath(); g.moveTo(.3,0); g.lineTo(.86,0); g.stroke(); } },.16); hand(.14,.2); hand(.5-rk,.12); break;
   case 'dagger': hand(.14,-.4); swing(()=>{ blade(.52,.09,'#d9dfeb'); guard(.09,'#4a4460'); },.2); break;
   case 'dagger2': swing(()=>{ blade(.5,.09,'#d9dfeb'); guard(.09,'#33452a'); },.2,1); g.save(); g.translate(.14,-.4); g.rotate(-.2); blade(.5,.09,'#d9dfeb'); g.restore(); hand(.14,-.4); break;
   case 'claws': { const p=act?Math.sin(Math.PI*u)*.3:0; for(const sy of [1,-1]){ g.strokeStyle=lit?c2:'#e8eef8'; g.lineWidth=.045; if(lit){ g.shadowColor=c1; g.shadowBlur=10; } g.beginPath(); for(let i=-1;i<=1;i++){ g.moveTo(.26+(sy>0?p:0),.36*sy+i*.07); g.lineTo(.62+(sy>0?p:0),.36*sy+i*.11-.05*sy); } g.stroke(); g.shadowBlur=0; hand(.22+(sy>0?p:0),.36*sy,'#aab3c5'); } break; }
   case 'scythes': { const sc=(col)=>{ bar(0,.82,.06,'#2a2740'); g.fillStyle=col; g.strokeStyle=INK; g.lineWidth=.03; g.beginPath(); g.moveTo(.78,.04); g.quadraticCurveTo(.98,-.3,.5,-.52); g.quadraticCurveTo(.8,-.26,.7,.04); g.closePath(); g.fill(); g.stroke(); };
       const spin=lit?cq*6.283:0; g.save(); g.translate(.14,-.4); g.rotate(-.35-spin); g.scale(1,-1); if(lit){ g.shadowColor='#5aa8ff'; g.shadowBlur=12; } sc('#5aa8ff'); g.restore(); hand(.14,-.4);
       g.save(); if(act){ g.translate(.2,.1); g.rotate(1.25-2.4*ez); } else { g.translate(.14,.4); g.rotate(.35+spin); } if(lit){ g.shadowColor='#ff5468'; g.shadowBlur=12; } sc('#ff5468'); g.restore(); hand(act?.2:.14,act?.1:.4); break; }
   case 'doll': { g.save(); g.translate(.24,-.42); g.rotate(Math.sin(now*3)*.2); g.fillStyle='#b99a6a'; g.strokeStyle=INK; g.lineWidth=.03; g.fillRect(-.07,-.02,.14,.2); g.strokeRect(-.07,-.02,.14,.2); g.beginPath(); g.arc(0,-.1,.1,0,7); g.fill(); g.stroke(); g.strokeStyle=c1; g.lineWidth=.025; g.beginPath(); g.moveTo(-.05,-.13); g.lineTo(-.01,-.08); g.moveTo(-.01,-.13); g.lineTo(-.05,-.08); g.moveTo(.02,-.13); g.lineTo(.06,-.08); g.moveTo(.06,-.13); g.lineTo(.02,-.08); g.stroke(); g.restore(); hand(.14,-.4);
       swing(()=>{ blade(.46,.08,'#cfe0b0'); guard(.08,'#5a3a6a'); },.2); break; }
   case 'spirit': { const p=act?Math.sin(Math.PI*u)*.7:0,ox=.34+p,oy=.46*(1-(act?ez:0))+Math.sin(now*4)*.04; g.strokeStyle=c1; g.lineWidth=.05; g.globalAlpha*=.7; g.beginPath(); g.moveTo(ox,oy); g.quadraticCurveTo(ox-.3,oy+.2+Math.sin(now*6)*.08,ox-.6,oy+.05); g.stroke(); g.globalAlpha/=.7; g.fillStyle=c2; g.shadowColor=c1; g.shadowBlur=lit?18:10; g.beginPath(); g.arc(ox,oy,.14,0,7); g.fill(); g.shadowBlur=0; hand(.14,.4); hand(.14,-.4); break; }
  } g.shadowBlur=0; }

/* ───── 몸 ───── */
function drawBody(e,by,rr,col){ const L=LOOK[e.key]||{el:'steel',w:'sword',hair:'#999',acc:[]},el=EL[L.el],c=e.c.col,A=g.globalAlpha,th=Math.atan2(e.aim.y,e.aim.x),fl=e.flash&&now-e.flash<.09,acc=L.acc||[];
  g.strokeStyle=col; g.lineWidth=2.5/cell; g.beginPath(); g.ellipse(e.x,e.y+.06,R*1.08,R*.66,0,0,7); g.stroke();
  drawRes(e); if(AURA[e.key]) AURA[e.key](e,by); g.globalAlpha=A;
  if(has(e,'focus')){ g.strokeStyle=el[0]; g.lineWidth=2.5/cell; g.setLineDash([.22,.14]); g.lineDashOffset=-now*1.5; g.beginPath(); g.ellipse(e.x,e.y+.06,R*1.7,R*1.05,0,0,7); g.stroke(); g.setLineDash([]); g.lineDashOffset=0; }
  g.save(); g.translate(e.x,by); g.rotate(th); let s=rr/R; const rat=e.key==='john'&&e.r.rat>now; if(rat) s*=.62; g.scale(s,s); g.lineJoin='round'; g.lineCap='round';
  const sw=e.swingT!==undefined?(now-e.swingT)/.22:9,cq=e.castFx?(now-e.castFx.t0)/.42:9,rc=e.shotT!==undefined?(now-e.shotT)/.2:9,wv=Math.sin(now*6+e.team*2)*.05,line=()=>{ g.strokeStyle=INK; g.lineWidth=.04; };
  if(acc.includes('fur')){ g.fillStyle='#5a4028'; line(); g.beginPath(); for(let i=0;i<14;i++){ const a=i*.449,r2=i&1?.5:.62; g.lineTo(-.1+Math.cos(a)*r2*.7,Math.sin(a)*r2); } g.closePath(); g.fill(); g.stroke(); }
  if(acc.includes('cape')){ g.fillStyle=L.cape||c; line(); g.beginPath(); g.moveTo(-.06,-.4); g.lineTo(-.6,-.32+wv); g.lineTo(-.78,wv*2); g.lineTo(-.6,.32+wv); g.lineTo(-.06,.4); g.closePath(); g.fill(); g.stroke(); }
  if(acc.includes('robe')){ g.fillStyle=c; line(); g.globalAlpha=A*.75; g.beginPath(); g.ellipse(-.16,0,.4,.5,0,0,7); g.fill(); g.stroke(); g.globalAlpha=A; }
  if(acc.includes('tail')||rat){ g.strokeStyle=rat?'#c9a0a0':'#aab3c5'; g.lineWidth=rat?.05:.13; g.beginPath(); g.moveTo(-.2,0); g.quadraticCurveTo(-.55,.25+wv*3,-.85,wv*4); g.stroke(); }
  if(acc.includes('scarf')){ g.strokeStyle=L.scarf||c; g.lineWidth=.1; g.beginPath(); g.moveTo(-.1,.16); g.quadraticCurveTo(-.45,.3+wv*3,-.75,.12+wv*5); g.stroke(); }
  if(acc.includes('quiver')){ g.save(); g.translate(-.3,-.2); g.rotate(.5); g.fillStyle='#6b4a2a'; line(); g.fillRect(-.2,-.08,.4,.16); g.strokeRect(-.2,-.08,.4,.16); g.fillStyle='#f2fff8'; for(let i=0;i<Math.min(4,(e.r&&e.r.ar)||0);i++) g.fillRect(-.3,-.06+i*.04,.1,.025); g.restore(); }
  if(acc.includes('pack')){ g.fillStyle='#8a6a3a'; line(); g.fillRect(-.48,-.24,.3,.48); g.strokeRect(-.48,-.24,.3,.48); g.strokeStyle='#c9d0dc'; g.lineWidth=.06; g.beginPath(); g.moveTo(-.44,-.12); g.lineTo(-.6,-.12); g.stroke(); }
  g.fillStyle=fl?'#ffffff':c; line(); g.lineWidth=.05; g.beginPath(); g.ellipse(-.03,0,.24,.45,0,0,7); g.fill(); g.stroke();
  if(acc.includes('apron')){ g.fillStyle='#5a4a3a'; g.fillRect(.02,-.22,.14,.44); }
  if(acc.includes('paint')){ g.strokeStyle='#ffd9a0'; g.lineWidth=.05; g.beginPath(); g.moveTo(-.1,-.3); g.lineTo(.1,-.22); g.moveTo(-.1,.3); g.lineTo(.1,.22); g.stroke(); }
  if(acc.includes('pauldrons')){ g.fillStyle=fl?'#ffffff':(L.metal||'#c9d3e6'); line(); for(const sy of [-1,1]){ g.beginPath(); g.arc(-.03,.4*sy,.18,0,7); g.fill(); g.stroke(); } }
  drawWeapon(e,L,el,sw,cq,rc);
  /* 머리 */
  const hx=.05; g.lineWidth=.045; g.strokeStyle=INK;
  if(acc.includes('ponytail')){ g.strokeStyle=L.hair; g.lineWidth=.12; g.beginPath(); g.moveTo(hx-.18,0); g.quadraticCurveTo(-.4,wv*3,-.58,wv*5); g.stroke(); g.strokeStyle=INK; g.lineWidth=.045; }
  if(acc.includes('hood')||acc.includes('veil')){ g.fillStyle=L.hood||L.hair; g.beginPath(); g.arc(hx-.03,0,.3,0,7); g.fill(); g.stroke(); g.fillStyle=SKIN; g.beginPath(); g.arc(hx+.08,0,.17,-1.1,1.1); g.fill(); }
  else { g.fillStyle=L.hair; g.beginPath(); g.arc(hx,0,.25,0,7); g.fill(); g.stroke(); g.fillStyle=SKIN; g.beginPath(); g.arc(hx+.07,0,.16,-1.2,1.2); g.fill(); }
  if(acc.includes('mask')){ g.fillStyle='#efe9dc'; g.beginPath(); g.arc(hx+.05,0,.2,0,7); g.fill(); g.stroke(); g.fillStyle=INK; g.beginPath(); g.arc(hx+.14,-.08,.045,0,7); g.arc(hx+.14,.08,.045,0,7); g.fill(); }
  if(acc.includes('jester')){ g.fillStyle='#ff5468'; g.beginPath(); g.arc(hx,0,.25,0,3.1416); g.fill(); g.fillStyle='#5aa8ff'; g.beginPath(); g.arc(hx,0,.25,3.1416,6.2832); g.fill(); g.strokeStyle=INK; g.beginPath(); g.arc(hx,0,.25,0,7); g.stroke(); g.fillStyle='#ffe27a'; for(const sy of [-1,1]){ g.beginPath(); g.arc(hx-.22,.24*sy+wv,.06,0,7); g.fill(); } g.fillStyle='#ffffff'; g.beginPath(); g.arc(hx+.09,0,.13,-1.2,1.2); g.fill(); }
  if(acc.includes('hat')){ g.fillStyle=L.hat; g.beginPath(); g.arc(hx,0,.36,0,7); g.fill(); g.stroke(); g.beginPath(); g.moveTo(hx+.12,-.2); g.lineTo(hx-.52,.06+wv); g.lineTo(hx+.12,.2); g.closePath(); g.fill(); g.stroke(); g.strokeStyle='#f2d28a'; g.lineWidth=.04; g.beginPath(); g.arc(hx,0,.22,0,7); g.stroke(); }
  if(acc.includes('cowboy')){ g.fillStyle='#8a5a2b'; g.beginPath(); g.ellipse(hx,0,.4,.34,0,0,7); g.fill(); g.stroke(); g.fillStyle='#6b4420'; g.beginPath(); g.arc(hx-.02,0,.18,0,7); g.fill(); g.stroke(); }
  if(acc.includes('halo')){ g.strokeStyle='#ffe9a0'; g.lineWidth=.05; g.shadowColor='#ffe9a0'; g.shadowBlur=8; g.beginPath(); g.arc(hx,0,.34,0,7); g.stroke(); g.shadowBlur=0; }
  if(acc.includes('crown')){ g.fillStyle='#e3c377'; for(const a of [2.2,3.14,4.08]){ g.beginPath(); g.arc(hx+Math.cos(a)*.2,Math.sin(a)*.2,.05,0,7); g.fill(); } }
  if(acc.includes('plume')){ g.strokeStyle=L.plume||'#c0392b'; g.lineWidth=.1; g.beginPath(); g.moveTo(hx+.12,0); g.quadraticCurveTo(hx-.2,wv*2,hx-.46,wv*4); g.stroke(); }
  if(acc.includes('horns')){ g.strokeStyle='#e9dcc0'; g.lineWidth=.07; for(const sy of [-1,1]){ g.beginPath(); g.moveTo(hx,.2*sy); g.quadraticCurveTo(hx+.1,.42*sy,hx+.3,.36*sy); g.stroke(); } }
  if(acc.includes('ears')){ g.fillStyle=L.hair; g.strokeStyle=INK; g.lineWidth=.035; for(const sy of [-1,1]){ g.beginPath(); g.moveTo(hx-.12,.14*sy); g.lineTo(hx-.02,.38*sy); g.lineTo(hx+.12,.18*sy); g.closePath(); g.fill(); g.stroke(); } }
  if(acc.includes('bandana')){ g.strokeStyle=L.band; g.lineWidth=.07; g.beginPath(); g.arc(hx,0,.25,1.3,5); g.stroke(); }
  if(acc.includes('goggles')){ g.strokeStyle='#ffb15e'; g.lineWidth=.07; g.beginPath(); g.arc(hx,0,.25,-.9,.9); g.stroke(); }
  if(acc.includes('sprout')){ g.fillStyle='#b6f08a'; g.strokeStyle=INK; g.lineWidth=.03; for(const a of [-.7,.7]){ g.save(); g.translate(hx-.05,0); g.rotate(a+3.14); g.beginPath(); g.ellipse(.16,0,.15,.07,0,0,7); g.fill(); g.stroke(); g.restore(); } }
  if(acc.includes('ribbon')){ g.fillStyle='#ff6fb8'; g.strokeStyle=INK; g.lineWidth=.03; for(const sy of [-1,1]){ g.beginPath(); g.moveTo(hx-.18,0); g.lineTo(hx-.36,.22*sy); g.lineTo(hx-.4,.04*sy); g.closePath(); g.fill(); g.stroke(); } }
  if(fl){ g.fillStyle='rgba(255,255,255,.75)'; g.beginPath(); g.arc(hx,0,.27,0,7); g.fill(); }
  g.restore(); g.globalAlpha=A; drawStatus(e,by,rr); g.globalAlpha=A; }

/* ───── 내 화면에 걸리는 상태(멸화·병세) ───── */
function screenFx(){ const sc=has(me,'scorch')||has(me,'ember'),sk=has(me,'sick');
  if(sc){ const f=.35+.25*Math.sin(now*9)+.15*Math.sin(now*23); for(const side of [0,1]){ const gr=g.createLinearGradient(0,side?VH:0,0,side?VH-3.2:3.2); gr.addColorStop(0,'rgba(255,90,42,'+f+')'); gr.addColorStop(1,'rgba(255,90,42,0)'); g.fillStyle=gr; g.fillRect(0,side?VH-3.2:0,VW,3.2); }
    g.fillStyle='rgba(255,179,71,'+(.5*f)+')'; for(let i=0;i<9;i++){ const x=(i*1.7+now*2.3*(i%2?1:-1))%VW,h=1+Math.abs(Math.sin(now*6+i))*1.6; g.beginPath(); g.moveTo((x+VW)%VW-.5,VH); g.lineTo((x+VW)%VW,VH-h); g.lineTo((x+VW)%VW+.5,VH); g.fill(); } }
  if(sk){ g.fillStyle='rgba(120,200,60,'+(.1+.06*Math.sin(now*4))*(sk.v||1)+')'; g.fillRect(0,0,VW,VH); } }
const wobble=()=>{ const sk=me&&(has(me,'sick')||has(me,'dizzy')); return sk?{x:Math.sin(now*3.1)*.18*(sk.v||1),y:Math.cos(now*2.3)*.14*(sk.v||1)}:null; };
