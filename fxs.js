"use strict";
/* 스킬 연출: 스킬 이름(피해 표의 이름)마다 모양과 속성을 정한다. '모양:속성'. 속성을 비우면 캐릭터의 속성.
   피해 범위(부채꼴·원·직선)는 엔진 것 그대로이고, 여기서는 그 위에 그리는 그림만 바꾼다. */
const STY={
 castor:{'분화':'thrust','화천':'spin','홍성화추':'burst','적향혈창':'thrust:blood','적향혈창 (강화)':'spin:hell'},
 ei:{'가로베기':'slash','세로베기':'cut','기수 검식':{circle:'spin',seg:'cut'},'기사의 검':{arc:'slash:justice',seg:'cut:justice'}},
 mente:{'직검':'spin','세검':'quake','공검 전사':'spin'},
 guillaume:{'부척':'axe'},
 harmund:{'백설':'slash','백설 (냉기)':'nova','서리검':'blade','서리검 (정중앙)':'nova','빙극 설경':'slash','빙극 설경 (빙하검)':'blade'},
 manannan:{'제식 검술':{arc:'slash',circle:'spin',seg:'cut'},'검명':'dash','검의 대가':'slash','심상의 검':'cut'},
 simon:{'붙들기':'grab','뒤집어치기':'quake'},
 ginan:{'가호':'nova','신성 충격':'burst'},
 janet:{'깃창':'thrust','호전성':'shout'},
 ross:{'정의 집행':'judge'},
 milio:{'격세':'quake','격세 (폭발)':'burst','판명':'disc','판명 (돌아옴)':'disc','기선 제압':'spin'},
 plaus:{'나뭇잎':'leaf','뿌리':'root','자연의 힘':{circle:'bloom',seg:'beam'}},
 epoch:{'엔진':'rail','폭약':'burst:hell','로봇':'robot','자동화 공정':'burst'},
 vira:{'매직 볼트':'bolt','레벨 업 (볼트)':'bolt','매직 샤드':'shard','레벨 업 (샤드)':'shard','매직 펌프':'geyser','레벨 업 (펌프)':'geyser'},
 margrita:{'원념':'spray','나락의 탄환':'blast','열원':'nova','쇄염':'chain','폭렬 화구':'blast'},
 john:{'기습':'cut'},
 kur:{'낭랑':'claw','낭파':'windcut','낭아 질주':'claw','낭고 풍랑':{circle:'spin',arc:'claw'}},
 valtma:{'기세':'shout'},
 clover:{'바갈타크':'scythe:blue','타흘룸':'scythe:red','적청 회회':'spin:red','목 떨구기':'cut:red'},
 cornwall:{'광휘':'nova','성검의 환상':'beam'},
 breck:{'저주인형':'hex','의식용 칼':'knife','강령 의식':'skull'},
 vega:{'섬연':{seg:'whip',circle:'vortex'}},
 merilda:{'발사':'tracer','사냥개':'dog'},
 mimosa:{'창해':'bullet','황천의 비':'rain'},
 ford:{'공성 화살':'arrow','폭발 화살':{proj:'arrow:hell',circle:'burst:hell'},'표적 신호':'arrow:red','섬멸 개시':'bigarrow','섬멸 개시 (화살비)':'rain','인간 병기':'burst'},
 tommy:{'리볼버':'bullet','트리플':'bullet','스피드스터':'fan'},
 shale:{'석궁':'bolt','말뚝 석궁':{proj:'stake',circle:'quake'}},
 nertina:{'궁사':'arrow','속사':'arrow','곡예사':'arrow'}
};
const BASIC_V={claws:'claw',scythes:'scythe',fists:'punch',shield2:'punch'};
function styOf(f,kind){ if(f.sty!==undefined) return f.sty; const e=f.src||f.owner; let v=f.v||null,el=f.el||null,lab=f.lab||f.label;
  if(e&&lab){ const T=STY[e.key]; let s=T&&(T[lab]||T[lab.replace(/ \(.*\)$/,'')]); if(s&&typeof s==='object') s=s[kind]; if(s){ const p=s.split(':'); v=v||p[0]||null; el=el||p[1]||null; } }
  if(e&&f.thin&&!v) v=BASIC_V[(LOOK[e.key]||{}).w]||null;
  el=el||(e&&LOOK[e.key]&&LOOK[e.key].el); return f.sty=el?{v,c1:EL[el][0],c2:EL[el][1],el}:null; }
const ease=q=>1-(1-q)*(1-q);
const hsh=i=>{ const x=Math.sin(i*127.1)*43758.5453; return x-Math.floor(x); };

function drawFx(f){ const st=styOf(f,f.k==='seg'?'seg':f.k); if(!st) return false; if(f.fol&&!f.fol.dead){ f.x=f.fol.x; f.y=f.fol.y; }
  const D=f.dur||.28,q=Math.min(1,(now-f.t0)/D),a=1-q,{v,c1,c2}=st,tc='rgba('+TC[f.team]+','; g.lineCap='round'; g.lineJoin='round';
  if(f.k==='arc'){ const a0=f.a-f.half,a1=f.a+f.half,p=Math.min(1,q*2.4),r=f.r,thin=f.thin;
    if(!thin){ g.fillStyle=c1; g.globalAlpha=.1*Math.max(.3,a); g.beginPath(); g.moveTo(f.x,f.y); g.arc(f.x,f.y,r,a0,a1); g.closePath(); g.fill(); g.globalAlpha=1; g.strokeStyle=tc+.4*a+')'; g.lineWidth=1.5/cell; g.stroke(); }
    switch(v){
     case 'claw': for(let i=0;i<3;i++){ const pi=Math.max(0,Math.min(1,q*3-i*.25)),rr=r*(.55+i*.2); g.strokeStyle=c1; g.globalAlpha=a; g.lineWidth=r*(thin?.05:.08); g.beginPath(); g.arc(f.x,f.y,rr,a0+.1*i,a0+.1*i+(a1-a0)*pi); g.stroke(); g.strokeStyle=c2; g.lineWidth=r*.025; g.stroke(); } break;
     case 'scythe': { const N=14,am=a0+(a1-a0)*p; g.fillStyle=c1; g.globalAlpha=.85*a; g.beginPath(); for(let i=0;i<=N;i++){ const t=a0+(am-a0)*i/N; g.lineTo(f.x+Math.cos(t)*r,f.y+Math.sin(t)*r); } for(let i=N;i>=0;i--){ const t=a0+(am-a0)*i/N,ri=r*(1-(thin?.16:.3)*Math.sin(Math.PI*i/N)); g.lineTo(f.x+Math.cos(t)*ri,f.y+Math.sin(t)*ri); } g.closePath(); g.fill(); g.strokeStyle=c2; g.lineWidth=2/cell; g.stroke(); break; }
     case 'spray': case 'fan': { const n=v==='fan'?5:9; g.globalAlpha=a; for(let i=0;i<n;i++){ const t=a0+(a1-a0)*(i+.5)/n+(hsh(i+f.t0)-.5)*.08,r0=r*Math.min(.9,q*1.1),r1=r*Math.min(1,.25+q*1.6); g.strokeStyle=i&1?c1:c2; g.lineWidth=(v==='fan'?2:3)/cell; g.beginPath(); g.moveTo(f.x+Math.cos(t)*r0,f.y+Math.sin(t)*r0); g.lineTo(f.x+Math.cos(t)*r1,f.y+Math.sin(t)*r1); g.stroke(); }
       if(q<.4){ g.fillStyle=c2; g.globalAlpha=1-q/.4; g.beginPath(); g.arc(f.x+Math.cos(f.a)*.9,f.y+Math.sin(f.a)*.9,.34,0,7); g.fill(); } break; }
     case 'blast': { const rr=r*ease(Math.min(1,q*1.8)),gr=g.createRadialGradient(f.x,f.y,0,f.x,f.y,rr); gr.addColorStop(0,c2); gr.addColorStop(.6,c1); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.globalAlpha=.9*a; g.beginPath(); g.moveTo(f.x,f.y); g.arc(f.x,f.y,rr,a0,a1); g.closePath(); g.fill(); if(Math.random()<.8) puff(f.x+Math.cos(f.a)*rr*.7,f.y+Math.sin(f.a)*rr*.7,st.el,1,3); break; }
     case 'punch': { const d=CFG.reach*.3+ease(Math.min(1,q*2))*.5,x=f.x+Math.cos(f.a)*d,y=f.y+Math.sin(f.a)*d; g.strokeStyle=c1; g.globalAlpha=a; g.lineWidth=3/cell; for(const k of [.2,.34]){ g.beginPath(); g.arc(x,y,k+q*.3,f.a-1,f.a+1); g.stroke(); } break; }
     default: { const rr=r*(thin?.8:.9),wid=r*(thin?.07:.2)*(.35+a*.65); g.strokeStyle=c1; g.globalAlpha=(thin?.7:.85)*a; g.lineWidth=wid; g.beginPath(); g.arc(f.x,f.y,rr,a0,a0+(a1-a0)*p); g.stroke(); g.strokeStyle=c2; g.lineWidth=wid*.3; g.globalAlpha=a; g.beginPath(); g.arc(f.x,f.y,rr+wid*.25,a0+(a1-a0)*Math.max(0,p-.5),a0+(a1-a0)*p); g.stroke(); } }
    g.globalAlpha=1; return true; }
  if(f.k==='circle'){ const r=f.r,x=f.x,y=f.y;
    g.fillStyle=c1; g.globalAlpha=(f.dur?.07:.1)*Math.max(.4,a); g.beginPath(); g.arc(x,y,r,0,7); g.fill(); g.globalAlpha=1; g.strokeStyle=tc+(f.dur?.7:.45*Math.max(.3,a))+')'; g.lineWidth=1.5/cell; g.stroke();
    switch(v){
     case 'spin': { const rot=q*6.283*1.1; for(let i=0;i<2;i++){ const b=rot+i*3.1416; g.strokeStyle=c1; g.globalAlpha=.85*a; g.lineWidth=r*.16*(.4+a*.6); g.beginPath(); g.arc(x,y,r*.88,b,b+1.7); g.stroke(); g.strokeStyle=c2; g.lineWidth=r*.04; g.globalAlpha=a; g.beginPath(); g.arc(x,y,r*.93,b+.9,b+1.7); g.stroke(); } break; }
     case 'burst': case 'geyser': { const rr=r*ease(Math.min(1,q*1.7)),N=v==='geyser'?16:10; g.fillStyle=c2; g.globalAlpha=.45*a; g.beginPath(); for(let i=0;i<N*2;i++){ const t=i*Math.PI/N+f.t0,ri=i&1?rr*.55:rr*(.85+hsh(i+f.t0)*.2); g.lineTo(x+Math.cos(t)*ri,y+Math.sin(t)*ri); } g.closePath(); g.fill(); g.strokeStyle=c1; g.globalAlpha=a; g.lineWidth=3/cell; g.stroke();
       if(v==='geyser'){ g.strokeStyle=c2; g.lineWidth=2.5/cell; for(let i=0;i<7;i++){ const t=i*.9+f.t0,d=r*(.2+hsh(i)*.7),h=q*3.5*(1-q)*4; g.beginPath(); g.moveTo(x+Math.cos(t)*d,y+Math.sin(t)*d*.9); g.lineTo(x+Math.cos(t)*d,y+Math.sin(t)*d*.9-h); g.stroke(); } } break; }
     case 'quake': { const rr=r*Math.min(1,q*1.8); g.strokeStyle=c1; g.globalAlpha=a; g.lineWidth=4/cell; g.beginPath(); g.arc(x,y,rr,0,7); g.stroke(); g.strokeStyle=c2; g.lineWidth=2.5/cell; for(let i=0;i<7;i++){ const t=i*.898+f.t0*3; g.beginPath(); g.moveTo(x,y); let px=x,py=y; for(let k=1;k<=3;k++){ const d=rr*k/3,tt=t+(hsh(i*3+k)-.5)*.5; px=x+Math.cos(tt)*d; py=y+Math.sin(tt)*d; g.lineTo(px,py); } g.stroke(); } break; }
     case 'nova': { const rr=r*(.35+.65*ease(q)),gr=g.createRadialGradient(x,y,0,x,y,rr); gr.addColorStop(0,c2); gr.addColorStop(.55,c1); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.globalAlpha=.8*a; g.beginPath(); g.arc(x,y,rr,0,7); g.fill(); break; }
     case 'bolt': { if(q<.6){ g.strokeStyle=c2; g.shadowColor=c1; g.shadowBlur=16; g.globalAlpha=1-q/.6; g.lineWidth=(r>2.5?7:4)/cell; g.beginPath(); let px=x,py=y; g.moveTo(px,py); for(let k=1;k<=7;k++){ px=x+(hsh(k+f.t0*9)-.5)*1.1; py=y-k*1.1; g.lineTo(px,py); } g.stroke(); g.shadowBlur=0; } g.strokeStyle=c1; g.globalAlpha=a; g.lineWidth=4/cell; g.beginPath(); g.arc(x,y,r*Math.min(1,q*1.8),0,7); g.stroke(); break; }
     case 'blade': { const fall=Math.min(1,q/.35),top=y-(1-fall)*5,L=r*.9; g.fillStyle=c2; g.strokeStyle=c1; g.shadowColor=c1; g.shadowBlur=12; g.globalAlpha=Math.min(1,a*1.6); g.lineWidth=2/cell; g.beginPath(); g.moveTo(x,top+.25); g.lineTo(x+.24,top-.3); g.lineTo(x+.2,top-L-1.2); g.lineTo(x,top-L-1.6); g.lineTo(x-.2,top-L-1.2); g.lineTo(x-.24,top-.3); g.closePath(); g.fill(); g.stroke(); g.shadowBlur=0;
       if(fall>=1){ g.globalAlpha=a; g.lineWidth=3.5/cell; g.beginPath(); g.arc(x,y,r*Math.min(1,(q-.35)*2.6),0,7); g.stroke(); } break; }
     case 'rain': { g.strokeStyle=c2; g.lineWidth=2.5/cell; for(let i=0;i<10;i++){ const t=hsh(i+f.t0)*6.283,d=r*Math.sqrt(hsh(i*7+f.t0)),ph=(q*1.6+hsh(i)*.6)%1,px=x+Math.cos(t)*d,py=y+Math.sin(t)*d; g.globalAlpha=a*(1-ph); g.beginPath(); g.moveTo(px+.2,py-(1-ph)*2.4-.5); g.lineTo(px,py-(1-ph)*2.4); g.stroke(); if(ph>.85){ g.beginPath(); g.arc(px,py,.14,0,7); g.stroke(); } } break; }
     case 'bloom': { const rr=r*ease(q); g.fillStyle=c1; g.strokeStyle=c2; g.lineWidth=1.5/cell; g.globalAlpha=.6*a; for(let i=0;i<8;i++){ const t=i*.785+q; g.save(); g.translate(x+Math.cos(t)*rr*.6,y+Math.sin(t)*rr*.6); g.rotate(t); g.beginPath(); g.ellipse(0,0,rr*.36,rr*.15,0,0,7); g.fill(); g.stroke(); g.restore(); } break; }
     case 'vortex': { g.strokeStyle=c1; g.lineWidth=3/cell; g.globalAlpha=a; for(let i=0;i<3;i++){ g.beginPath(); for(let k=0;k<=16;k++){ const t=i*2.094+q*5+k*.2,d=r*k/16; g.lineTo(x+Math.cos(t)*d,y+Math.sin(t)*d); } g.stroke(); } break; }
     case 'hex': { g.strokeStyle=c2; g.lineWidth=2.5/cell; g.globalAlpha=a; for(let i=0;i<2;i++){ g.beginPath(); for(let k=0;k<3;k++){ const t=k*2.094+i*1.047+q; g.lineTo(x+Math.cos(t)*r*.9,y+Math.sin(t)*r*.9); } g.closePath(); g.stroke(); } g.strokeStyle=c1; g.beginPath(); g.arc(x,y,r*(.5+.5*q),0,7); g.stroke(); break; }
     case 'shout': g.strokeStyle=c1; g.lineWidth=3/cell; for(let i=0;i<3;i++){ const u=(q+i*.22)%1; g.globalAlpha=(1-u)*a*1.2; g.beginPath(); g.arc(x,y,r*u,0,7); g.stroke(); } break;
     case 'judge': { const rr=r*(2.6-1.6*q); g.strokeStyle=c1; g.lineWidth=2.5/cell; g.globalAlpha=.4+.6*q; g.beginPath(); g.arc(x,y,rr,0,7); g.stroke(); const top=y-6*(1-q*q)-.3; g.fillStyle=c2; g.shadowColor=c1; g.shadowBlur=14; g.beginPath(); g.moveTo(x,top+.3); g.lineTo(x+.16,top-.2); g.lineTo(x+.16,top-1.5); g.lineTo(x+.42,top-1.5); g.lineTo(x+.42,top-1.72); g.lineTo(x+.12,top-1.72); g.lineTo(x+.1,top-2.2); g.lineTo(x-.1,top-2.2); g.lineTo(x-.12,top-1.72); g.lineTo(x-.42,top-1.72); g.lineTo(x-.42,top-1.5); g.lineTo(x-.16,top-1.5); g.lineTo(x-.16,top-.2); g.closePath(); g.fill(); g.shadowBlur=0; break; }
     default: if(!f.dur){ g.strokeStyle=c1; g.globalAlpha=a; g.lineWidth=4/cell; g.beginPath(); g.arc(x,y,r*Math.min(1,q*1.7),0,7); g.stroke(); g.strokeStyle=c2; g.lineWidth=1.5/cell; g.beginPath(); g.arc(x,y,r*Math.min(1,q*1.7)*.86,0,7); g.stroke(); }
              else { g.strokeStyle=c1; g.globalAlpha=.5+.4*Math.sin(now*12); g.lineWidth=2/cell; g.beginPath(); g.arc(x,y,Math.max(.1,r*(1-q)),0,7); g.stroke(); } }
    g.globalAlpha=1; return true; }
  /* 직선 */
  { const dx=f.x1-f.x0,dy=f.y1-f.y0,L=Math.hypot(dx,dy)||1,nx=dx/L,ny=dy/L,px=-ny,py=nx,w=f.w,p=Math.min(1,q*3);
    g.fillStyle=c1; g.globalAlpha=.08*Math.max(.3,a); g.beginPath(); g.moveTo(f.x0+px*w/2,f.y0+py*w/2); g.lineTo(f.x1+px*w/2,f.y1+py*w/2); g.lineTo(f.x1-px*w/2,f.y1-py*w/2); g.lineTo(f.x0-px*w/2,f.y0-py*w/2); g.closePath(); g.fill(); g.globalAlpha=1; g.strokeStyle=tc+.35*a+')'; g.lineWidth=1.2/cell; g.stroke();
    const ex=f.x0+dx*p,ey=f.y0+dy*p;
    switch(v){
     case 'thrust': g.fillStyle=c1; g.globalAlpha=.85*a; g.beginPath(); g.moveTo(f.x0+px*w*.3,f.y0+py*w*.3); g.lineTo(ex,ey); g.lineTo(f.x0-px*w*.3,f.y0-py*w*.3); g.closePath(); g.fill(); g.strokeStyle=c2; g.globalAlpha=a; g.lineWidth=3/cell; g.beginPath(); g.moveTo(f.x0,f.y0); g.lineTo(ex,ey); g.stroke(); break;
     case 'beam': g.strokeStyle=c1; g.globalAlpha=.55*a; g.lineWidth=w*(1-q*.4); g.shadowColor=c1; g.shadowBlur=18; g.beginPath(); g.moveTo(f.x0,f.y0); g.lineTo(f.x1,f.y1); g.stroke(); g.shadowBlur=0; g.strokeStyle=c2; g.globalAlpha=a; g.lineWidth=w*.3; g.beginPath(); g.moveTo(f.x0,f.y0); g.lineTo(f.x1,f.y1); g.stroke(); break;
     case 'tracer': g.strokeStyle=c2; g.globalAlpha=a; g.lineWidth=2.5/cell; g.beginPath(); g.moveTo(f.x0+dx*Math.max(0,p-.6),f.y0+dy*Math.max(0,p-.6)); g.lineTo(ex,ey); g.stroke(); g.strokeStyle=c1; g.globalAlpha=.3*a; g.lineWidth=5/cell; g.beginPath(); g.moveTo(f.x0,f.y0); g.lineTo(f.x1,f.y1); g.stroke(); break;
     case 'rail': { const bx=f.x0+dx*ease(q),by=f.y0+dy*ease(q); g.strokeStyle=c2; g.globalAlpha=.5*a; g.lineWidth=w*.5; g.beginPath(); g.moveTo(f.x0,f.y0); g.lineTo(bx,by); g.stroke(); g.save(); g.translate(bx,by); g.rotate(Math.atan2(dy,dx)); g.globalAlpha=Math.min(1,a*2); g.fillStyle='#8a6a3a'; g.strokeStyle=c1; g.lineWidth=2.5/cell; g.fillRect(-.45,-w*.3,.9,w*.6); g.strokeRect(-.45,-w*.3,.9,w*.6); g.fillStyle=c1; g.fillRect(.25,-w*.2,.2,w*.4); g.restore(); if(Math.random()<.7) puff(bx,by,'steam',1,2); break; }
     case 'dash': g.strokeStyle=c1; g.globalAlpha=.6*a; g.lineWidth=3/cell; g.beginPath(); g.moveTo(f.x0,f.y0); g.lineTo(f.x1,f.y1); g.stroke(); g.strokeStyle=c2; g.globalAlpha=a; g.lineWidth=2.5/cell; for(let i=1;i<=4;i++){ const u=i/5,cx=f.x0+dx*u,cy=f.y0+dy*u,s=(i&1?1:-1),h=.7*Math.min(1,q*4); g.beginPath(); g.moveTo(cx-nx*.3*s+px*h,cy-ny*.3*s+py*h); g.lineTo(cx+nx*.3*s-px*h,cy+ny*.3*s-py*h); g.stroke(); } break;
     case 'grab': g.strokeStyle=c1; g.globalAlpha=a; g.lineWidth=4/cell; g.beginPath(); g.moveTo(f.x0,f.y0); g.lineTo(ex,ey); g.stroke(); g.lineWidth=3/cell; g.beginPath(); g.arc(ex,ey,.36,Math.atan2(dy,dx)-2,Math.atan2(dy,dx)+2); g.stroke(); break;
     case 'whip': g.strokeStyle=c1; g.globalAlpha=a; g.lineWidth=4/cell; g.beginPath(); for(let k=0;k<=18;k++){ const u=p*k/18,s=Math.sin(u*9+now*18)*.32*(1-u*.4); g.lineTo(f.x0+dx*u+px*s,f.y0+dy*u+py*s); } g.stroke(); g.strokeStyle=c2; g.lineWidth=1.5/cell; g.stroke(); break;
     case 'windcut': g.strokeStyle=c1; g.lineWidth=2.5/cell; for(const s of [-.3,0,.3]){ g.globalAlpha=a*(s?.6:1); g.beginPath(); g.moveTo(f.x0+dx*Math.max(0,p-.5)+px*s,f.y0+dy*Math.max(0,p-.5)+py*s); g.lineTo(ex+px*s,ey+py*s); g.stroke(); } g.strokeStyle=c2; g.globalAlpha=a; g.lineWidth=4/cell; g.beginPath(); g.arc(ex-nx*.5,ey-ny*.5,.6,Math.atan2(dy,dx)-.9,Math.atan2(dy,dx)+.9); g.stroke(); break;
     default: { const wd=w*.26*(.3+a*.7),o=(hsh(f.t0*31)-.5)*w*.5; g.strokeStyle=c1; g.globalAlpha=.85*a; g.lineWidth=wd; g.beginPath(); g.moveTo(f.x0+px*o,f.y0+py*o); g.lineTo(ex-px*o,ey-py*o); g.stroke(); g.strokeStyle=c2; g.globalAlpha=a; g.lineWidth=wd*.3; g.beginPath(); g.moveTo(f.x0+dx*Math.max(0,p-.45)+px*o,f.y0+dy*Math.max(0,p-.45)+py*o); g.lineTo(ex-px*o,ey-py*o); g.stroke(); } }
    g.globalAlpha=1; return true; } }

/* ───── 투사체 ───── */
function drawProj(p){ const st=styOf(p,'proj')||{v:null,c1:p.owner.c.col,c2:'#fff',el:'steel'},{c1,c2}=st,py=p.y-(p.z||0)*.45,a=Math.atan2(p.vy,p.vx),big=p.big?1.5:1; let v=st.v;
  if(!v){ const cl=p.owner.c.cls; v=cl==='척후병'?'arrow':(cl==='마법사'||cl==='지원가')?'orb':'shard'; }
  g.lineCap='round'; g.lineJoin='round';
  if(v==='root'){ g.strokeStyle='#6b4a2a'; g.lineWidth=5/cell; g.beginPath(); const dx=p.x-p.sx,dy=p.y-p.sy,L=Math.hypot(dx,dy)||1,N=Math.max(2,Math.floor(L*2)); for(let k=0;k<=N;k++){ const u=k/N,s=(k&1?1:-1)*.16*(k<N?1:0); g.lineTo(p.sx+dx*u-dy/L*s,p.sy+dy*u+dx/L*s); } g.stroke(); g.strokeStyle=c1; g.lineWidth=2/cell; g.stroke(); g.fillStyle=c2; g.beginPath(); g.arc(p.x,p.y,.2,0,7); g.fill(); if(Math.random()<.5) puff(p.x,p.y,'nature',1,2); return; }
  if(v==='chain'){ const o=p.owner; g.strokeStyle='#4a4f5c'; g.lineWidth=4/cell; g.setLineDash([.16,.1]); g.beginPath(); g.moveTo(o.x,o.y-o.z*.45); g.lineTo(p.x,py); g.stroke(); g.setLineDash([]); g.strokeStyle=c1; g.lineWidth=1.5/cell; g.beginPath(); g.moveTo(o.x,o.y-o.z*.45); g.lineTo(p.x,py); g.stroke(); }
  if(Math.random()<(p.big?.6:.3)) puff(p.x-Math.cos(a)*.3,py-Math.sin(a)*.3,st.el,1,1,.35);
  if(p.z>0.4){ g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(p.x,p.y,.16,.09,0,0,7); g.fill(); }
  g.save(); g.translate(p.x,py); g.rotate(a); g.scale(big,big); g.shadowColor=c1; g.shadowBlur=10; g.fillStyle=c2; g.strokeStyle=c1; g.lineWidth=.04;
  switch(v){
   case 'arrow': case 'bigarrow': case 'bolt': case 'stake': { const L=v==='bigarrow'?1.5:v==='arrow'?.95:v==='stake'?.8:.6,w=v==='stake'?.11:v==='bigarrow'?.08:.045; g.strokeStyle=v==='stake'?'#8a5a2b':c2; g.lineWidth=w; g.beginPath(); g.moveTo(-L*.6,0); g.lineTo(L*.3,0); g.stroke(); g.fillStyle=c1; g.beginPath(); g.moveTo(L*.5,0); g.lineTo(L*.22,w*2.2+.04); g.lineTo(L*.22,-w*2.2-.04); g.closePath(); g.fill();
       if(v!=='stake'){ g.strokeStyle=c1; g.lineWidth=.03; g.beginPath(); g.moveTo(-L*.6,0); g.lineTo(-L*.72,.09); g.moveTo(-L*.6,0); g.lineTo(-L*.72,-.09); g.stroke(); } break; }
   case 'bullet': g.strokeStyle=c1; g.globalAlpha=.6; g.lineWidth=.07; g.beginPath(); g.moveTo(-1.3,0); g.lineTo(0,0); g.stroke(); g.globalAlpha=1; g.fillStyle=c2; g.beginPath(); g.arc(0,0,.1,0,7); g.fill(); break;
   case 'axe': g.rotate(now*16); g.strokeStyle='#8a5a2b'; g.lineWidth=.07; g.beginPath(); g.moveTo(-.3,0); g.lineTo(.3,0); g.stroke(); g.fillStyle='#d9dfeb'; g.strokeStyle=c1; g.lineWidth=.04; g.beginPath(); g.moveTo(.12,-.03); g.quadraticCurveTo(.2,-.36,.44,-.3); g.quadraticCurveTo(.34,-.06,.44,.14); g.quadraticCurveTo(.24,.1,.12,.03); g.closePath(); g.fill(); g.stroke(); break;
   case 'leaf': g.rotate(Math.sin(now*14)*.6); g.fillStyle=c1; g.strokeStyle=c2; g.beginPath(); g.ellipse(0,0,.3,.12,0,0,7); g.fill(); g.stroke(); g.beginPath(); g.moveTo(-.3,0); g.lineTo(.3,0); g.stroke(); break;
   case 'shard': g.beginPath(); g.moveTo(.36,0); g.lineTo(0,.11); g.lineTo(-.3,0); g.lineTo(0,-.11); g.closePath(); g.fill(); g.stroke(); break;
   case 'knife': g.rotate(now*9); g.fillStyle='#cfe0b0'; g.beginPath(); g.moveTo(.34,0); g.lineTo(0,.07); g.lineTo(0,-.07); g.closePath(); g.fill(); g.stroke(); g.strokeStyle='#5a3a6a'; g.lineWidth=.07; g.beginPath(); g.moveTo(-.2,0); g.lineTo(0,0); g.stroke(); break;
   case 'disc': g.rotate(now*12); g.fillStyle='#9aa7c2'; g.strokeStyle=c2; g.lineWidth=.05; g.beginPath(); g.arc(0,0,.36,0,7); g.fill(); g.stroke(); g.strokeStyle=c1; g.beginPath(); g.moveTo(-.36,0); g.lineTo(.36,0); g.moveTo(0,-.36); g.lineTo(0,.36); g.stroke(); g.fillStyle=c2; g.beginPath(); g.arc(0,0,.1,0,7); g.fill(); break;
   case 'dog': { const b=Math.sin(now*22)*.04; g.fillStyle='#eef4fb'; g.strokeStyle='#8fa6c2'; g.lineWidth=.035; g.beginPath(); g.ellipse(-.05,b,.26,.13,0,0,7); g.fill(); g.stroke(); g.beginPath(); g.arc(.24,b,.12,0,7); g.fill(); g.stroke(); g.beginPath(); g.moveTo(.2,b-.1); g.lineTo(.26,b-.24); g.lineTo(.32,b-.08); g.moveTo(.2,b+.1); g.lineTo(.26,b+.24); g.lineTo(.32,b+.08); g.stroke(); g.beginPath(); g.moveTo(-.3,b); g.lineTo(-.46,b+.08*Math.sin(now*30)); g.stroke(); break; }
   case 'robot': g.rotate(-a); g.fillStyle='#8a6a3a'; g.strokeStyle=c1; g.lineWidth=.045; g.fillRect(-.2,-.18,.4,.36); g.strokeRect(-.2,-.18,.4,.36); g.beginPath(); g.moveTo(0,-.18); g.lineTo(0,-.34); g.stroke(); g.fillStyle=(now*6|0)&1?'#ff5a2a':c2; g.beginPath(); g.arc(0,-.36,.05,0,7); g.fill(); g.fillStyle=c2; g.fillRect(-.12,-.06,.08,.08); g.fillRect(.04,-.06,.08,.08); break;
   case 'skull': g.rotate(-a); g.fillStyle=c1; g.strokeStyle=c2; g.beginPath(); g.arc(0,0,.26,0,7); g.fill(); g.stroke(); g.fillStyle=INK; g.beginPath(); g.arc(-.09,-.03,.065,0,7); g.arc(.09,-.03,.065,0,7); g.fill(); g.fillRect(-.07,.1,.14,.05); break;
   case 'chain': g.fillStyle=c1; g.beginPath(); g.moveTo(.3,0); g.lineTo(-.05,.16); g.lineTo(.05,0); g.lineTo(-.05,-.16); g.closePath(); g.fill(); break;
   default: g.fillStyle=c1; g.strokeStyle=c2; g.beginPath(); g.arc(0,0,.2,0,7); g.fill(); g.stroke(); g.beginPath(); g.arc(0,0,.32,now*9%6.28,now*9%6.28+2.2); g.stroke(); }
  g.restore(); g.shadowBlur=0; g.globalAlpha=1; }

/* ───── 장판·벽 ───── */
function zoneFx(z){ const E=elOf(z.owner); g.strokeStyle=E[0]; g.globalAlpha=.5; g.lineWidth=1.5/cell; g.beginPath(); g.arc(z.x,z.y,z.r*.94,now*.6,now*.6+5.2); g.stroke(); g.globalAlpha=1;
  if(Math.random()<Math.min(.9,z.r*.09)){ const a=Math.random()*6.283,d=Math.sqrt(Math.random())*z.r; puff(z.x+Math.cos(a)*d,z.y+Math.sin(a)*d,E,1,.8,.8); }
  if(z.label==='성역'||z.label==='역장'){ g.strokeStyle='rgba(255,233,160,.35)'; g.lineWidth=2/cell; g.beginPath(); g.moveTo(z.x-z.r*.7,z.y); g.lineTo(z.x+z.r*.7,z.y); g.moveTo(z.x,z.y-z.r*.7); g.lineTo(z.x,z.y+z.r*.7); g.stroke(); } }
function wallFx(w){ g.strokeStyle='rgba(201,236,255,.8)'; g.lineWidth=2/cell; const horiz=(w.x1-w.x0)>(w.y1-w.y0);
  for(let k=0;k<3;k++){ g.beginPath(); if(horiz){ const y=w.y0+(k+.5)*(w.y1-w.y0)/3; for(let x=w.x0;x<=w.x1+.01;x+=.25) g.lineTo(x,y+Math.sin(x*4+now*6+k)*.07); } else { const x=w.x0+(k+.5)*(w.x1-w.x0)/3; for(let y=w.y0;y<=w.y1+.01;y+=.25) g.lineTo(x+Math.sin(y*4+now*6+k)*.07,y); } g.stroke(); }
  if(Math.random()<.4) puff(w.x0+Math.random()*(w.x1-w.x0),w.y0+Math.random()*(w.y1-w.y0),'water',1,1,.5); }

/* ───── 소리: 속성마다 다른 음색 ───── */
const SND={
 fire:m=>{ noise(.22,.1,600*m,.6); tone(200*m,.2,'sawtooth',.06,90*m); }, hell:m=>{ noise(.28,.13,420*m,.5); tone(130*m,.26,'sawtooth',.08,55*m); },
 forge:m=>{ noise(.07,.12,3400,3); tone(700*m,.12,'triangle',.07,350*m); }, steel:m=>{ noise(.1,.1,3000*m,2.5); tone(520*m,.12,'triangle',.06,260*m); },
 iron:m=>{ noise(.12,.12,1800*m,1.5); tone(150*m,.14,'square',.05,110*m); }, justice:m=>{ tone(392*m,.12,'square',.05); tone(523*m,.18,'square',.05,null,.09); },
 royal:m=>{ tone(330*m,.1,'square',.05); tone(440*m,.16,'square',.05,null,.08); }, blood:m=>{ noise(.16,.1,300*m,.6); tone(140*m,.2,'sawtooth',.07,70*m); },
 mind:m=>{ tone(880*m,.12,'sine',.07); tone(1320*m,.2,'sine',.06,null,.07); }, earth:m=>{ noise(.18,.14,180,.5); tone(90*m,.2,'triangle',.12,45); },
 beast:m=>{ noise(.2,.12,240,.5); tone(110*m,.24,'sawtooth',.07,60*m); }, holy:m=>{ [660,990,1320].forEach((f,i)=>tone(f*m,.3,'sine',.05,null,i*.04)); },
 nature:m=>{ noise(.14,.05,2600,.8); tone(520*m,.18,'sine',.07,780*m); }, steam:m=>{ noise(.3,.09,1300,.7); tone(110*m,.1,'square',.05); },
 arcane:m=>{ tone(990*m,.22,'sine',.07,1980*m); tone(495*m,.22,'sine',.05); }, shadow:m=>{ noise(.16,.04,5200,.6); tone(300*m,.2,'sine',.05,150*m); },
 wind:m=>{ noise(.2,.09,4200*m,.5); tone(600*m,.12,'sine',.03,1200*m); }, hunt:m=>{ noise(.12,.08,3600,.8); tone(260*m,.14,'triangle',.06,180*m); },
 red:m=>{ noise(.12,.08,3200,1); tone(700*m,.16,'triangle',.07,350*m); }, blue:m=>{ noise(.12,.08,3200,1); tone(350*m,.16,'triangle',.07,700*m); },
 curse:m=>{ tone(180*m,.3,'square',.04,150*m); tone(233*m,.3,'sine',.05,220*m); }, spirit:m=>{ tone(784*m,.16,'sine',.06,1175*m); tone(1568*m,.2,'sine',.03,null,.08); },
 ice:m=>{ tone(1400*m,.1,'sine',.06,2100*m); tone(1870*m,.16,'triangle',.04,null,.06); noise(.08,.05,6000,2); }, snow:m=>{ noise(.14,.06,6000,1); tone(1200*m,.12,'sine',.04); },
 water:m=>{ tone(500*m,.18,'sine',.08,250*m); noise(.12,.05,900,.8); }, powder:m=>{ noise(.06,.2,2000,.8); tone(200*m,.1,'square',.07,80); }, dream:m=>{ [880,1108,1318].forEach((f,i)=>tone(f*m,.16,'sine',.05,null,i*.06)); }
};
function castSnd(e,slot){ const el=(LOOK[e.key]||{}).el,f=SND[el]; if(!f){ sfx('cast',e.c.cls); return; } const t=performance.now(); if(lastS.cast&&t-lastS.cast<55) return; lastS.cast=t; const m={n1:1,n2:1.19,aw:.75,crouch:1.5}[slot]||1; f(m); if(slot==='aw') tone(98,.4,'sine',.07,65); }
function shotSnd(e){ const t=performance.now(); if(lastS.shot&&t-lastS.shot<55) return; lastS.shot=t; const w=(LOOK[e.key]||{}).w;
  if(w==='bow'||w==='greatbow'||w==='crossbow'){ noise(.05,.07,5200,2.5); tone(w==='greatbow'?260:420,.1,'triangle',.07,w==='greatbow'?130:210); }
  else if(w==='revolver'||w==='rifle'||w==='shotgun'){ noise(.07,w==='shotgun'?.24:.16,w==='rifle'?2600:1800,.7); tone(w==='shotgun'?120:220,.1,'square',.08,60); }
  else if(w==='axe'||w==='shield2'){ noise(.16,.08,1500,.6); }
  else { tone(900,.1,'sine',.05,1500); noise(.05,.04,4200,2); } }
function swingSnd(e){ const w=(LOOK[e.key]||{}).w; if(w==='greatsword'||w==='axe'||w==='club'||w==='mace') noise(.14,.09,1200,.9); else if(w==='fists'||w==='shield2'){ noise(.06,.1,500,.8); } else if(w==='claws'||w==='dagger'||w==='dagger2') noise(.06,.06,4600,1.6); else noise(.09,.07,2600,1.2); }
