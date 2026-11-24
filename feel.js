"use strict";
/* 타격감과 가시성. 엔진을 고치지 않고 훅(on)만으로 붙인 덧붙임 파일의 본보기다.
   이 파일을 index.html에서 빼도 게임은 그대로 돈다. 새 덧붙임 파일도 이렇게 만들어 index.html 맨 아래에 한 줄 더하면 된다. */
let hurtT=-9,hurtA=0,lastStop=0;
on('begin',()=>{ hurtT=-9; hurtA=0; });

/* 타격 멈칫 · 작은 흔들림 · 피격 번쩍임: 내가 주거나 받은 피해에만 */
on('hit',(src,t,amt)=>{ const mine=src===me&&t!==me,meHit=t===me&&src!==me; if(!mine&&!meHit) return;
  if(meHit){ hurtT=now; hurtA=Math.min(1,.3+amt/40); }
  if(OPT.stop&&amt>=14){ const n=performance.now(); if(n-lastStop>170){ lastStop=n; stopUntil=n+Math.min(95,26+amt*1.3); } }
  if(amt>=12&&amt<25) shake=Math.max(shake,.08+amt/220); });

/* 쓰러뜨리거나 쓰러질 때 잠깐 느려진다 */
on('kill',(src,t)=>{ if(practice) return; if(src===me||t===me) slowUntil=Math.max(slowUntil,performance.now()+(TN()>1?260:520)); });

/* 스킬 윤곽선: 실제로 맞는 범위를 편 색의 또렷한 선으로 덧그린다. 상대 투사체에는 붉은 고리를 두른다. */
on('draw:world',()=>{ if(!OPT.tele||!me) return; g.lineJoin='round';
  for(const f of fx){ if(f.thin||f.team===undefined) continue; const foeFx=f.team!==me.team; if(!foeFx&&OPT.tele<2) continue; const D=f.dur||.28,q=(now-f.t0)/D; if(q>=1) continue;
    g.globalAlpha=(foeFx?.95:.6)*(1-q*q); g.strokeStyle=foeFx?'#ff5a6e':'#8fe9ff'; g.lineWidth=(foeFx?3:2)/cell; g.beginPath();
    if(f.k==='arc'){ g.moveTo(f.x,f.y); g.arc(f.x,f.y,f.r,f.a-f.half,f.a+f.half); g.closePath(); }
    else if(f.k==='circle') g.arc(f.x,f.y,f.r,0,7);
    else if(f.k==='seg'){ const n=norm(f.x1-f.x0,f.y1-f.y0),px=-n.y*f.w/2,py=n.x*f.w/2; g.moveTo(f.x0+px,f.y0+py); g.lineTo(f.x1+px,f.y1+py); g.lineTo(f.x1-px,f.y1-py); g.lineTo(f.x0-px,f.y0-py); g.closePath(); }
    else continue; g.stroke(); }
  g.globalAlpha=.9; g.strokeStyle='#ff5a6e'; g.lineWidth=2/cell;
  for(const p of projs){ if(p.owner.team===me.team) continue; g.beginPath(); g.arc(p.x,p.y-(p.z||0)*.45,p.big?.75:.45,0,7); g.stroke(); }
  g.globalAlpha=1; });

/* 화면 가장자리: 맞으면 붉게 번쩍, 체력 25% 아래면 붉게 뛴다. 초당 장면 수 표시. */
on('draw:screen',()=>{
  if(OPT.edge&&me&&!me.dead&&!over){ let a=0; const h=(now-hurtT)/.35; if(h<1) a=hurtA*(1-h)*.45; if(me.hp<me.max*.25&&me.max<1e9) a=Math.max(a,.2+.1*Math.sin(now*7));
    if(a>.01){ const cx=VW/2,cy=VH/2,gr=g.createRadialGradient(cx,cy,Math.min(VW,VH)*.42,cx,cy,Math.hypot(VW,VH)*.56); gr.addColorStop(0,'rgba(255,50,70,0)'); gr.addColorStop(1,'rgba(255,50,70,'+a.toFixed(3)+')'); g.fillStyle=gr; g.fillRect(0,0,VW,VH); } }
  if(OPT.fps){ g.font='600 .36px ui-monospace,Menlo,monospace'; g.textAlign='left'; g.fillStyle='rgba(6,9,23,.7)'; const t=Math.round(1000/fpsA)+' fps · x'+dpr.toFixed(2)+' · '+cv.width+'×'+cv.height,w=g.measureText(t).width,y=TOPC+.45; g.fillRect(VW/2-w/2-.15,y-.36,w+.3,.5); g.fillStyle='#7fe3b5'; g.fillText(t,VW/2-w/2,y); } });

/* ───── 소리: 속성 타격음 · 상대 궁극기 경고 ───── */
/* 캐릭터의 속성(look.js의 el)을 일곱 갈래로 묶어, 내가 주고받는 타격에 한 겹 더 얹는다. 속성을 더하면 ELFAM에 한 낱말만 적는다. */
const ELFAM={fire:'fire',forge:'fire',hell:'fire',red:'fire',steam:'fire', ice:'ice',snow:'ice',blue:'ice', steel:'steel',iron:'steel',royal:'steel',justice:'steel',hunt:'steel',
  blood:'dark',curse:'dark',shadow:'dark', holy:'light',spirit:'light',mind:'light',arcane:'light', earth:'earth',beast:'earth',nature:'earth', wind:'wind'};
const ELHIT={
 fire:b=>{ noise(b?.22:.12,b?.1:.06,b?700:1100,.6); tone(b?150:210,b?.2:.1,'sawtooth',b?.06:.035,70); },
 ice:b=>{ tone(b?1500:2100,.07,'sine',.05,b?2400:3000); tone(b?2250:3150,.05,'sine',.03,null,.03); noise(.05,.05,6500,3); },
 steel:b=>{ tone(b?880:1320,b?.16:.08,'square',.03,b?700:1100); noise(.04,.07,4200,4); },
 dark:b=>{ tone(b?90:130,b?.3:.16,'sawtooth',.07,45); noise(.1,.05,300,.8); },
 light:b=>{ tone(b?784:1047,.14,'sine',.06); tone(b?1175:1568,.18,'sine',.045,null,.05); },
 earth:b=>{ noise(b?.2:.1,b?.16:.09,b?180:260,.5); tone(b?70:95,.16,'triangle',.1,40); },
 wind:b=>{ noise(b?.24:.14,.07,b?1800:2600,.35); tone(500,.12,'sine',.025,1100); }
};
let elT=0,warnT=-9;
on('begin',()=>{ warnT=-9; });
on('hit',(src,t,amt)=>{ if(!OPT.els||muted||!AC) return; if(src!==me&&t!==me) return; const n=performance.now(); if(n-elT<70) return; elT=n;
  const f=ELFAM[(LOOK[src.key]||{}).el]||'steel'; try{ ELHIT[f](amt>=25); }catch(x){} });
/* 상대가 궁극기를 쓰면 경보가 울리고 화면 위아래가 붉게 깜빡인다 */
on('cast',(e,slot)=>{ if(!me||e.team===me.team||(slot!=='ult'&&!(slot[0]==='x'))) return; if(slot==='ult'){ warnT=now; if(OPT.els){ for(let i=0;i<3;i++){ tone(988,.11,'square',.07,740,i*.16); } tone(110,.5,'sawtooth',.06,55); } buzz([30,40,30]); }
  else if(OPT.els){ tone(740,.1,'square',.05,520); tone(740,.1,'square',.05,520,.14); } });
on('draw:screen',()=>{ const q=(now-warnT)/1.1; if(q<0||q>=1) return; const a=(1-q)*(.35+.25*Math.sin(now*22)); g.fillStyle='rgba(255,60,80,'+a.toFixed(3)+')'; g.fillRect(0,0,VW,.22); g.fillRect(0,VH-.22,VW,.22);
  g.font='800 .5px "Gothic A1",sans-serif'; g.textAlign='center'; g.globalAlpha=Math.min(1,(1-q)*2); g.fillStyle='#ff7d8c'; g.fillText('⚠ 상대 궁극기',VW/2,TOPC+1.75); g.globalAlpha=1; });

/* ───── 타격 이펙트: 맞는 자리 · 투사체 꼬리 · 스킬 번쩍임 · 착지 먼지 · 쓰러짐 ───── */
/* 기존 스킬 연출(fxs.js) 위에 한 겹 얹는다. 밝은 것끼리 겹치면 더 밝아지게(lighter) 그린다. */
const imps=[];
on('begin',()=>{ imps.length=0; });
on('hit',(src,t,amt,label,o)=>{ if(!OPT.imp||imps.length>70) return; const n=src===t?{x:0,y:-1}:norm(t.x-src.x,t.y-src.y),E=EL[(LOOK[src.key]||{}).el||'steel']||EL.steel,k=PH?'shot':o&&o.basic?'basic':o&&o.skill?'skill':'tick',big=amt>=25;
  imps.push({k,x:t.x-n.x*.15,y:t.y-t.z*.45-n.y*.15,a:Math.atan2(n.y,n.x),c:E[0],c2:E[1],t0:now,big,rot:(Math.random()-.5)*1.1,dur:k==='tick'?.16:big?.32:.2}); });
on('kill',(src,t)=>{ if(OPT.imp) imps.push({k:'death',x:t.x,y:t.y,c:'rgb('+TC[t.team]+')',c2:'#ffffff',t0:now,dur:.7}); });
on('step',()=>{ if(!OPT.imp) return; for(const e of ents){ const pz=e._pz||0; if(pz>.5&&e.z===0&&!e.dead&&imps.length<70) imps.push({k:'land',x:e.x,y:e.y+.1,t0:now,dur:.35,r:Math.min(1.3,.5+pz*.2)}); e._pz=e.z; } });
function streak(x,y,a,len,w,col,al){ g.save(); g.translate(x,y); g.rotate(a); g.globalAlpha=al; g.fillStyle=col; g.beginPath(); g.moveTo(-len/2,0); g.quadraticCurveTo(0,-w,len/2,0); g.quadraticCurveTo(0,w,-len/2,0); g.fill(); g.restore(); }
function fxPath(f){ g.beginPath(); if(f.k==='arc'){ g.moveTo(f.x,f.y); g.arc(f.x,f.y,f.r,f.a-f.half,f.a+f.half); g.closePath(); return true; } if(f.k==='circle'){ g.arc(f.x,f.y,f.r,0,7); return true; }
  if(f.k==='seg'){ const n=norm(f.x1-f.x0,f.y1-f.y0),px=-n.y*f.w/2,py=n.x*f.w/2; g.moveTo(f.x0+px,f.y0+py); g.lineTo(f.x1+px,f.y1+py); g.lineTo(f.x1-px,f.y1-py); g.lineTo(f.x0-px,f.y0-py); g.closePath(); return true; } return false; }
on('draw:world',()=>{ if(!OPT.imp||!me) return; const low=noGlow(); g.save(); g.globalCompositeOperation='lighter';
  /* 스킬이 터지는 순간, 맞는 범위 전체가 한 번 번쩍인다 */
  if(!low) for(const f of fx){ if(f.thin||f.team===undefined) continue; const q=(now-f.t0)/.08; if(q>=1||q<0) continue; g.globalAlpha=.2*(1-q); g.fillStyle=f.col||'#ffffff'; if(fxPath(f)) g.fill(); }
  /* 투사체 꼬리 */
  if(!low) for(const p of projs){ const sp=Math.hypot(p.vx,p.vy)||1,L=Math.min(1.8,sp*.055)*(p.big?1.4:1),ux=p.vx/sp,uy=p.vy/sp,py=p.y-(p.z||0)*.45; g.strokeStyle=p.owner.c.col; g.lineCap='round';
    for(let i=0;i<3;i++){ g.globalAlpha=.34-.1*i; g.lineWidth=(p.big?.22:.13)*(1-i*.28); g.beginPath(); g.moveTo(p.x-ux*L*i/3,py-uy*L*i/3); g.lineTo(p.x-ux*L*(i+1)/3,py-uy*L*(i+1)/3); g.stroke(); } }
  /* 맞는 자리 */
  for(let i=imps.length-1;i>=0;i--){ const m=imps[i],q=(now-m.t0)/m.dur; if(q>=1||q<0){ imps.splice(i,1); continue; } const a=1-q,e2=1-(1-q)*(1-q);
    if(m.k==='basic'){ const L=(m.big?1.7:1.15)*(.5+.5*e2); streak(m.x,m.y,m.a+1.5708+m.rot,L,.09,m.c,a); streak(m.x,m.y,m.a+1.5708+m.rot,L*.7,.035,'#ffffff',a); }
    else if(m.k==='skill'){ const L=(m.big?2.1:1.4)*(.45+.55*e2); streak(m.x,m.y,m.a+.9+m.rot*.4,L,.11,m.c,a); streak(m.x,m.y,m.a-.9+m.rot*.4,L*.85,.09,m.c2,a*.9); streak(m.x,m.y,m.a+.9+m.rot*.4,L*.6,.04,'#ffffff',a); }
    else if(m.k==='shot'){ for(let j=0;j<5;j++){ const an=m.a+3.1416+(j-2)*.42+m.rot*.2,d=(.25+.75*e2)*(m.big?1.3:.85); streak(m.x+Math.cos(an)*d*.55,m.y+Math.sin(an)*d*.55,an,d*.8,.05,j&1?m.c2:m.c,a); } g.globalAlpha=a*.9; g.fillStyle='#ffffff'; g.beginPath(); g.arc(m.x,m.y,.16*a,0,7); g.fill(); }
    else if(m.k==='tick'){ g.globalAlpha=a*.8; g.fillStyle=m.c; g.save(); g.translate(m.x,m.y); g.rotate(.785); const k=.1+.1*e2; g.fillRect(-k,-k,k*2,k*2); g.restore(); }
    else if(m.k==='land'){ g.globalAlpha=a*.5; g.strokeStyle='#c9cfee'; g.lineWidth=.06; g.beginPath(); g.ellipse(m.x,m.y,m.r*(.4+.6*e2),m.r*(.4+.6*e2)*.42,0,0,7); g.stroke(); }
    else if(m.k==='death'){ g.globalAlpha=a*.85; g.strokeStyle=m.c; g.lineWidth=.14*a+.03; g.beginPath(); g.arc(m.x,m.y,.4+3*e2,0,7); g.stroke(); g.globalAlpha=a*.5; g.strokeStyle='#ffffff'; g.lineWidth=.05; g.beginPath(); g.arc(m.x,m.y,.2+2.1*e2,0,7); g.stroke();
      const gr=g.createLinearGradient(m.x,m.y,m.x,m.y-4.5); gr.addColorStop(0,m.c); gr.addColorStop(1,'rgba(255,255,255,0)'); g.globalAlpha=a*a*.7; g.fillStyle=gr; const w=.55*a+.08; g.fillRect(m.x-w/2,m.y-4.5,w,4.5); }
    if(m.big&&(m.k==='basic'||m.k==='skill'||m.k==='shot')){ g.globalAlpha=a*.8; g.strokeStyle=m.c2; g.lineWidth=.1*a+.02; g.beginPath(); g.arc(m.x,m.y,.3+1.3*e2,0,7); g.stroke(); for(let j=0;j<8;j++){ const an=j*.785+m.rot,r0=.5+1.1*e2; streak(m.x+Math.cos(an)*r0,m.y+Math.sin(an)*r0,an,.5*a+.1,.035,'#ffffff',a*.8); } } }
  g.restore(); g.globalAlpha=1; });
