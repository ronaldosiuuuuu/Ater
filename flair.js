"use strict";
/* 싸움 중 꾸밈 한 겹 더. 엔진은 건드리지 않고, 생긴 범위 표시(fx)·투사체·시전·타격을 보고 그 위에 빛을 얹는다.
   · 범위가 터질 때: 번지는 충격 고리, 가운데서 퍼지는 빛, 가장자리에서 튀는 불티, 바닥에 잠깐 남는 자국
   · 부채꼴: 휘두른 끝을 따라가는 흰 칼빛 / 직선: 빛줄기 심 / 투사체: 빛무리
   · 각성·궁극 시전: 발밑 문양(궁극은 빛기둥까지) / 큰 타격: 주변이 한 번 밝아진다
   · 보스의 캐스팅 범위: 시간이 찰수록 안쪽이 차오른다
   설정의 '타격 이펙트'를 끄면 모두 꺼지고, 그림 품질이 낮으면 가벼운 것만 그린다. */
const FL={dec:[],sp:[],li:[],ru:[],seen:new WeakSet()};
on('begin',()=>{ FL.dec.length=FL.sp.length=FL.li.length=FL.ru.length=0; });
const flEl=e=>{ const E=e&&typeof EL!=='undefined'&&EL[(LOOK[e.key]||{}).el]; return E||null; };
const flCol=f=>flEl(f.src||f.owner)||[f.col||'rgb('+TC[f.team||0]+')','#ffffff'];
const flSpark=(x,y,a,E,v)=>{ if(FL.sp.length>(PC?260:110)||(!PC&&Math.random()<.4)) return; const s=(v||5)*(.4+Math.random()*.9); FL.sp.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,t0:now,dur:.28+Math.random()*.3,c:Math.random()<.35?E[1]:E[0],w:.05+Math.random()*.06}); };
on('step',()=>{ if(!OPT.imp) return; const low=noGlow();
  for(const f of fx){ if(FL.seen.has(f)) continue; FL.seen.add(f); if(f.thin||f.team===undefined||(f.dur||0)>.9) continue; const E=flCol(f);
    if(f.k==='circle'){ if(!low){ const n=Math.min(20,6+(f.r*2|0)); for(let i=0;i<n;i++){ const a=Math.random()*6.283; flSpark(f.x+Math.cos(a)*f.r*.92,f.y+Math.sin(a)*f.r*.92,a,E,4+f.r*.5); } } if(f.r>=1.8&&FL.dec.length<26) FL.dec.push({k:'c',x:f.x,y:f.y,r:f.r,c:E[0],t0:now+.12,dur:1.5,rot:Math.random()*6.283}); if(FL.li.length<14) FL.li.push({x:f.x,y:f.y,r:f.r*1.5+1,c:E[0],t0:now,dur:.32}); }
    else if(f.k==='arc'){ if(!low){ const n=Math.min(12,4+(f.r*1.5|0)); for(let i=0;i<n;i++){ const a=f.a-f.half+Math.random()*2*f.half; flSpark(f.x+Math.cos(a)*f.r*.95,f.y+Math.sin(a)*f.r*.95,a,E,4+f.r*.4); } } if(FL.dec.length<26) FL.dec.push({k:'a',x:f.x,y:f.y,r:f.r,a:f.a,half:f.half,c:E[0],t0:now+.1,dur:.9}); if(FL.li.length<14) FL.li.push({x:f.x+Math.cos(f.a)*f.r*.6,y:f.y+Math.sin(f.a)*f.r*.6,r:f.r+1,c:E[0],t0:now,dur:.26}); }
    else if(f.k==='seg'&&f.x1!==undefined){ if(!low){ const L=Math.hypot(f.x1-f.x0,f.y1-f.y0),n=Math.min(14,4+(L|0)),an=Math.atan2(f.y1-f.y0,f.x1-f.x0); for(let i=0;i<n;i++){ const t=Math.random(); flSpark(f.x0+(f.x1-f.x0)*t,f.y0+(f.y1-f.y0)*t,an+(Math.random()<.5?1.5708:-1.5708)+(Math.random()-.5)*.8,E,3.5); } } } } });
on('cast',(e,slot)=>{ if(!OPT.imp||!e||(slot!=='ult'&&slot!=='aw'&&slot[0]!=='x')) return; const E=flEl(e)||[e.c.col||'#7fe9ff','#ffffff']; if(FL.ru.length<8) FL.ru.push({e,c:slot==='ult'?'#e3c377':E[0],c2:E[1],t0:now,dur:slot==='ult'?1.2:.75,ult:slot==='ult'}); });
on('hit',(src,t,amt)=>{ if(!OPT.imp||noGlow()||amt<40||FL.li.length>=14) return; const E=flEl(src)||['#ffffff','#ffffff']; FL.li.push({x:t.x,y:t.y-t.z*.45,r:1.6+Math.min(3,amt/60),c:E[0],t0:now,dur:.22}); });
on('draw:world',()=>{ if(!OPT.imp||!me) return; const low=noGlow(); g.save();
  /* 바닥 자국(보통 겹침) */
  for(let i=FL.dec.length-1;i>=0;i--){ const d=FL.dec[i],q=(now-d.t0)/d.dur; if(q>=1){ FL.dec.splice(i,1); continue; } if(q<0) continue; const a=(1-q)*(1-q);
    if(d.k==='c'){ g.globalAlpha=.16*a; g.fillStyle='#000'; g.beginPath(); g.arc(d.x,d.y,d.r*.96,0,7); g.fill(); g.globalAlpha=.4*a; g.strokeStyle=d.c; g.lineWidth=.05; g.beginPath(); g.arc(d.x,d.y,d.r*.96,0,7); g.stroke(); if(!low){ g.lineWidth=.04; g.beginPath(); for(let j=0;j<7;j++){ const an=d.rot+j*.9,r0=d.r*(.25+.1*(j%3)),r1=d.r*(.7+.08*((j*5)%4)); g.moveTo(d.x+Math.cos(an)*r0,d.y+Math.sin(an)*r0); g.lineTo(d.x+Math.cos(an+.12)*r1,d.y+Math.sin(an+.12)*r1); } g.stroke(); } }
    else { g.globalAlpha=.3*a; g.strokeStyle=d.c; g.lineWidth=.1*a+.03; g.beginPath(); g.arc(d.x,d.y,d.r*.93,d.a-d.half,d.a+d.half); g.stroke(); } }
  /* 보스 캐스팅처럼 오래 떠 있는 범위: 시간이 찰수록 안쪽이 차오른다 */
  for(const f of fx){ if(f.k!=='circle'||!(f.dur>.9)||f.team===undefined) continue; const q=Math.min(1,(now-f.t0)/f.dur),c='rgb('+TC[f.team]+')'; g.globalAlpha=.1+.1*q; g.fillStyle=c; g.beginPath(); g.arc(f.x,f.y,f.r*q,0,7); g.fill(); g.globalAlpha=.55; g.strokeStyle=c; g.lineWidth=.05; g.beginPath(); g.arc(f.x,f.y,f.r*q,0,7); g.stroke(); if(q>.75){ g.globalAlpha=.35*(.5+.5*Math.sin(now*28)); g.lineWidth=.12; g.beginPath(); g.arc(f.x,f.y,f.r,0,7); g.stroke(); } }
  g.globalCompositeOperation='lighter'; g.globalAlpha=1;
  /* 주변을 밝히는 빛 */
  if(!low) for(let i=FL.li.length-1;i>=0;i--){ const l=FL.li[i],q=(now-l.t0)/l.dur; if(q>=1){ FL.li.splice(i,1); continue; } const gr=g.createRadialGradient(l.x,l.y,0,l.x,l.y,l.r); gr.addColorStop(0,l.c); gr.addColorStop(1,'rgba(0,0,0,0)'); g.globalAlpha=.22*(1-q); g.fillStyle=gr; g.beginPath(); g.arc(l.x,l.y,l.r,0,7); g.fill(); } else FL.li.length=0;
  /* 터지는 범위: 충격 고리 · 칼빛 · 빛줄기 */
  for(const f of fx){ if(f.thin||f.team===undefined||(f.dur||0)>.9) continue; const D=f.dur||.28,q=(now-f.t0)/D; if(q<0||q>=1) continue; const E=flCol(f),a=1-q,e2=1-(1-q)*(1-q);
    if(f.k==='circle'){ g.globalAlpha=.75*a; g.strokeStyle=E[0]; g.lineWidth=.16*a+.03; g.beginPath(); g.arc(f.x,f.y,f.r*(.55+.6*e2),0,7); g.stroke(); g.globalAlpha=.6*a; g.strokeStyle='#ffffff'; g.lineWidth=.05; g.beginPath(); g.arc(f.x,f.y,f.r*(.35+.75*e2),0,7); g.stroke();
      if(!low){ const gr=g.createRadialGradient(f.x,f.y,0,f.x,f.y,f.r); gr.addColorStop(0,E[1]); gr.addColorStop(.45,E[0]); gr.addColorStop(1,'rgba(0,0,0,0)'); g.globalAlpha=.3*a*a; g.fillStyle=gr; g.beginPath(); g.arc(f.x,f.y,f.r,0,7); g.fill(); } }
    else if(f.k==='arc'){ const p=Math.min(1,q*2.2),lead=f.a-f.half+2*f.half*p; g.lineCap='round'; g.globalAlpha=.85*a; g.strokeStyle=E[0]; g.lineWidth=.22*a+.04; g.beginPath(); g.arc(f.x,f.y,f.r*.97,Math.max(f.a-f.half,lead-.9),lead); g.stroke(); g.globalAlpha=.9*a; g.strokeStyle='#ffffff'; g.lineWidth=.08; g.beginPath(); g.arc(f.x,f.y,f.r*.97,Math.max(f.a-f.half,lead-.45),lead); g.stroke();
      if(!low){ g.globalAlpha=.5*a; g.strokeStyle=E[1]; g.lineWidth=.06; g.beginPath(); g.arc(f.x,f.y,f.r*(1+.18*e2),f.a-f.half,f.a+f.half); g.stroke(); } g.lineCap='butt'; }
    else if(f.k==='seg'&&f.x1!==undefined){ g.lineCap='round'; g.globalAlpha=.55*a; g.strokeStyle=E[0]; g.lineWidth=(f.w||1)*.5*a+.05; g.beginPath(); g.moveTo(f.x0,f.y0); g.lineTo(f.x1,f.y1); g.stroke(); g.globalAlpha=.9*a; g.strokeStyle='#ffffff'; g.lineWidth=.09*a+.02; g.beginPath(); g.moveTo(f.x0,f.y0); g.lineTo(f.x1,f.y1); g.stroke(); g.lineCap='butt'; } }
  /* 투사체 빛무리 */
  if(!low&&(PC||projs.length<=14)) for(const p of projs){ if(p.nohit&&!p.big) continue; const E=flEl(p.owner)||[p.owner.c.col,'#fff'],py=p.y-(p.z||0)*.45,r=p.big?1.1:.62; const gr=g.createRadialGradient(p.x,py,0,p.x,py,r); gr.addColorStop(0,E[1]); gr.addColorStop(.35,E[0]); gr.addColorStop(1,'rgba(0,0,0,0)'); g.globalAlpha=.5; g.fillStyle=gr; g.beginPath(); g.arc(p.x,py,r,0,7); g.fill(); }
  /* 시전 문양 */
  for(let i=FL.ru.length-1;i>=0;i--){ const r=FL.ru[i],q=(now-r.t0)/r.dur; if(q>=1||r.e.dead){ FL.ru.splice(i,1); continue; } const a=Math.sin(Math.PI*Math.min(1,q*1.15)),x=r.e.x,y=r.e.y+.15,R=(r.ult?2.3:1.5)*(.6+.4*Math.min(1,q*3)),rot=now*2.2;
    g.save(); g.translate(x,y); g.scale(1,.46); g.globalAlpha=.75*a; g.strokeStyle=r.c; g.lineWidth=.07; g.beginPath(); g.arc(0,0,R,0,7); g.stroke(); g.lineWidth=.04; g.beginPath(); g.arc(0,0,R*.72,0,7); g.stroke(); g.beginPath(); const n=r.ult?8:6; for(let j=0;j<n;j++){ const an=rot+j*6.283/n; g.moveTo(Math.cos(an)*R*.72,Math.sin(an)*R*.72); g.lineTo(Math.cos(an+6.283/n*2)*R*.72,Math.sin(an+6.283/n*2)*R*.72); } g.stroke(); g.restore();
    if(r.ult&&!low){ const gr=g.createLinearGradient(x,y,x,y-6); gr.addColorStop(0,r.c); gr.addColorStop(1,'rgba(0,0,0,0)'); g.globalAlpha=.45*a; g.fillStyle=gr; const w=1.3*a+.2; g.fillRect(x-w/2,y-6,w,6); g.globalAlpha=.5*a; g.fillStyle='#ffffff'; g.fillRect(x-w*.12,y-6,w*.24,6); } }
  /* 불티 */
  g.lineCap='round'; for(let i=FL.sp.length-1;i>=0;i--){ const s=FL.sp[i],t=now-s.t0,q=t/s.dur; if(q>=1){ FL.sp.splice(i,1); continue; } const k=t*(1-q*.5),x=s.x+s.vx*k,y=s.y+s.vy*k-.6*q*q; g.globalAlpha=1-q; g.strokeStyle=s.c; g.lineWidth=s.w*(1-q*.6); g.beginPath(); g.moveTo(x,y); g.lineTo(x-s.vx*.035,y-s.vy*.035); g.stroke(); } g.lineCap='butt';
  g.restore(); });
