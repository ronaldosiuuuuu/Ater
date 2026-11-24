"use strict";
/* 전설급 추가 3: 척후병 4 · 지원가 4 + 전설급 공통(겉모습·진행·상태). */
const CROUCH={name:'웅크리기',cd:.3,ai:()=>false,cast(e){ e.r.cr=now+1.2; }};
const slowFall=e=>{ if(e.vz<-2.5) e.vz=-2.5; };
Object.assign(CH,{
arwen:{name:'고요한 밤빛, 아르웬',cls:'척후병',grade:'전설',range:9,
  init:e=>{e.r={ar:0,acc:0,fs:0,awT:-99,exec:false,judge:false}}, hud:e=>'강탄 '+e.r.ar+'/2'+(e.r.fs>0&&now-e.r.awT<=6?' · 무료 저격 '+e.r.fs:'')+(e.r.judge?' · 심판':''),
  speedMod:()=>.8,
  tick(e,dt){ e.r.acc+=dt; if(e.r.acc>=12){ e.r.acc-=12; if(e.r.ar<2){ e.r.ar++; proc(e,'은밀','강탄 +1'); } } },
  onCast(e,s){ add(e,'stealth',2); },
  onKill(e){ if(now-e.r.awT<=6) e.r.exec=true; },
  snipe(e){ const J=e.r.judge; e.r.judge=false; const fire=()=>{ if(!e.dead) S.proj(e,e.aim,{speed:34,range:18,dmg:t=>50+(J?t.max*.16:0),label:J?'저격 (심판)':'저격',big:true,o:{knock:1}}); }; if(J) fire(); else { S.focus(e,1); after(1,fire); } },
  skills:{
   crouch:{name:'고요한 빛 저격',cd:1.2,can:e=>e.r.fs>0&&now-e.r.awT<=6,need:'고요한 빛 중',ai:(e,d)=>d<=16,cast(e){ e.r.fs--; CH.arwen.snipe(e); }},
   n1:{name:'저격',cd:4,r:16,can:e=>e.r.ar>=1,need:'강탄 1',cast(e){ e.r.ar--; CH.arwen.snipe(e); }},
   n2:{name:'투망',cd:18,ai:(e,d)=>d<6,cast(e){ S.focus(e,.5); after(.5,()=>{ if(e.dead) return; S.proj(e,e.aim,{speed:22,range:10,dmg:0,label:'투망',big:true,nohit:true,touch:t=>add(t,'root',1,0,{by:e})}); S.leap(e,{x:-e.aim.x,y:-e.aim.y},5,22); }); }},
   aw:{name:'고요한 빛',cd:45,r:9,cast(e){ fx.push({k:'circle',x:e.x,y:e.y,r:9,t0:now,team:e.team,lab:'고요한 빛',src:e,v:'nova'}); add(e,'blind',6,0,{self:true}); foes(e).forEach(t=>{ if(dist(e,t)<=9+R) add(t,'blind',6,0,{by:e}); }); const t=tgt(e,99); if(t) add(t,'glow',6,0,{by:e}); e.r.fs=3; e.r.awT=now; }},
   ult:{name:'심판의 빛',cd:0,r:99,can:e=>e.r.exec,need:'고요한 빛 뒤 6초 안에 처치',cast(e){ e.r.exec=false; add(e,'haste',3,.3); e.r.judge=true; }}
  },note:'강탄 0발로 시작해 12초마다 하나 얻는다. 고요한 빛은 자신도 6초 실명한다. 심판의 빛은 처치가 있어야 해서 5판 3선승에서만 쓸 수 있다.'},
dioris:{name:'건너뛰는 자, 디오리',cls:'척후병',grade:'전설',range:3,
  init:e=>{e.r={pcd:0,ls:null,lt:-9,aw:0,im:0,n:0,rel:0,uc:0}}, hud:e=>(e.r.im>now?'몰입 · ':'')+(e.r.rel>now?'해제 · ':'')+'몰입 중 시전 '+e.r.n+'/12',
  tick(e,dt){ if(e.r.pcd>0) e.r.pcd-=dt; },
  gun(e,len,dmg,label){ e.shotT=now; shotSnd(e); S.line(e,len,dmg,label,{v:'tracer',el:'powder',post:t=>{ if(e.r.rel>now&&Math.random()<.5&&!t.dead) damage(e,t,4,'해제 (총)'); }}); },
  dag:e=>({post:t=>{ if(e.r.rel>now){ rm(t,'vuln'); add(t,'vuln',2,.1,{by:e}); } }}),
  onCast(e,s){ if(s==='ult') return; if(e.r.im>now){ e.r.n++; for(const k in e.cd) if(k!=='b') e.cd[k]=Math.max(0,e.cd[k]-1); }
    if(e.r.ls&&e.r.ls!==s&&now-e.r.lt<=1.5&&e.r.pcd<=0){ e.r.pcd=2; proc(e,'교대','총 9 · -2초'); const p=e.r.ls; after(.12,()=>{ if(!e.dead) CH.dioris.gun(e,6,9,'교대'); }); e.cd[p]=Math.max(0,e.cd[p]-2); } e.r.ls=s; e.r.lt=now; },
  skills:{
   crouch:{name:'난사·쇄도',cd:.4,can:e=>e.r.uc>now||e.r.aw>now,need:'각성·궁극 뒤 3초 안',ai:(e,d)=>d<=4,cast(e){ if(e.r.uc>now){ e.r.uc=0; for(let i=0;i<4;i++) after(i*.1,()=>{ if(e.dead) return; if(i&1) CH.dioris.gun(e,5,10,'난염 쇄도'); else S.line(e,5,10,'난염 쇄도',CH.dioris.dag(e)); }); }
        else { e.r.aw=0; e.r.im=now+10; for(let i=0;i<3;i++) after(i*.12,()=>{ if(!e.dead) S.circle(e,4,10,'섬광 난사',{v:'burst',el:'powder',post:t=>{ if(e.r.rel>now&&Math.random()<.5&&!t.dead) damage(e,t,4,'해제 (총)'); }}); }); } }},
   n1:{name:'무쌍',cd:4,r:3,cast(e){ e.swingT=now; if(S.arc(e,3,7,'무쌍',CH.dioris.dag(e)).length) after(1,()=>{ if(!e.dead) CH.dioris.gun(e,5,11,'무쌍 (총)'); }); }},
   n2:{name:'발탄',cd:9,ai:(e,d)=>d<=6,cast(e){ const d=moveDir(e); for(let i=0;i<3;i++) after(i*.2,()=>{ if(e.dead) return; S.leap(e,d,2,22,()=>{ if(S.circle(e,2,8,'발탄',Object.assign({v:'spin'},CH.dioris.dag(e))).length) e.cd.n2=Math.max(0,e.cd.n2-2); },true); }); }},
   aw:{name:'섬광 난사',cd:45,r:6,cast(e){ add(e,'haste',2,.2); add(e,'stealth',2); e.r.aw=now+3; }},
   ult:{name:'난염 쇄도',cd:0,r:6,can:e=>e.r.n>=12,need:'몰입 중 스킬 12회',cast(e){ S.focus(e,.5); after(.5,()=>{ if(!e.dead){ e.r.rel=now+12; e.r.uc=now+3; } }); }}
  },note:'섬광 난사·난염 쇄도는 쓴 뒤 3초 안에 웅크리기 단추를 눌러야 공격이 나간다. 단검 공격은 무쌍·발탄·쇄도의 칼질, 총 공격은 교대·무쌍의 뒤따르는 발포·난사·쇄도의 발포로 나눴다.'},
largen:{name:'업을 끊는 검, 라르겐',cls:'척후병',grade:'전설',range:6,
  init:e=>{e.r={es:0,sh:false,acc:0,hit:0,ult:false}}, hud:e=>'영속 '+e.r.es+'/'+(e.r.ult?60:30)+(e.r.sh?' · 납도':''),
  speedMod:e=>e.r.ult?1:.8,
  tick(e,dt){ chgTick(e); if(e.r.sh){ e.r.acc+=dt; if(e.r.acc>=.5){ e.r.acc-=.5; e.r.es=Math.min(e.r.ult?60:30,e.r.es+(e.r.ult?2:1)); } } },
  modTake:(e,src,amt)=>e.r.es>=15&&src!==e?amt*.9:amt,
  onHurt(e,src){ if(e.r.sh&&src!==e&&++e.r.hit>=2){ e.r.sh=false; say(e,'납도 풀림','#c98a8a'); } },
  onSkillHit(e){ if(e.r.es>=15) heal(e,10); },
  skills:{
   crouch:RELEASE,
   n1:{name:'납도',cd:.5,ai:(e,d)=>!e.r.sh&&d>4,cast(e){ if(e.r.sh){ e.r.sh=false; e.cd.n1=5; } else { e.r.sh=true; e.r.acc=0; e.r.hit=0; } }},
   n2:{name:'발도',cd:6,ai:(e,d)=>e.r.es>=Math.min(24,d+2)||(d<5&&e.r.es>=6),can:e=>e.r.sh&&e.r.es>=1,need:'납도 중 + 영속',cast(e){ const n=e.r.es; e.r.es=0; e.r.sh=false; e.cd.n1=5; if(e.r.ult) e.cd.n2=3; let got=false; S.line(e,n,n*2,'발도',{knock:1,v:'windcut',post:()=>{ if(!got){ got=true; e.r.es=Math.floor(n/2); } if(e.r.ult) heal(e,n*2*.3); }}); }},
   aw:{name:'단공철참',cd:30,r:8,cast(e){ charge(e,e.r.ult?2.5:5,e.r.ult?0:.75,f=>{ const k=1+Math.round(5*f),p=spot(e,9,4); for(let i=0;i<k;i++) after(i*.14,()=>{ if(!e.dead) S.circle(e,3,10,'단공철참',{v:'spin',post:()=>{ e.r.es=Math.min(e.r.ult?60:30,e.r.es+5); }},p); }); }); }},
   ult:{name:'단업의 검',cd:0,r:99,can:e=>e.hp<=100,need:'체력 100 이하',cast(e){ e.r.ult=true; }}
  },note:'납도는 한 번 누르면 영속을 쌓기 시작하고 다시 누르면 풀린다. 발도의 사거리는 영속 1당 1칸, 피해는 영속 1당 2로 잡았다(카드에는 "비례"만 있다).'},
ganaan:{name:'소모라의 왕, 가나안',cls:'척후병',grade:'전설',range:6.5,
  init:e=>{e.r={sin:0,cr:0,cold:false,dark:false,king:0}}, hud:e=>'죄악 '+e.r.sin+'/100'+(e.r.king>now?' · 죄악의 왕':'')+(e.r.cold?' · 냉혈':'')+(e.r.dark?' · 암광':''),
  chk(e){ e.r.sin=Math.max(0,Math.min(100,e.r.sin)); if(e.r.sin>=100){ e.r.sin=0; add(e,'silence',3,0,{self:true}); proc(e,'원죄','죄악 초기화 · 침묵 3초'); } },
  onHurt(e,src){ if(e.r.king>now&&src!==e){ e.r.sin=Math.max(0,e.r.sin-10); add(e,'haste',1,.2); } },
  altBasic(e){ if(e.cd.b>0) return true; const K=e.r.king>now; e.shotT=now; shotSnd(e); if(e.r.cr>now){ e.cd.b=K?.25:.5; e.hp=Math.max(1,e.hp-9); say(e,'-9','#c98a8a'); e.r.sin-=5; CH.ganaan.chk(e); return true; }
    const t=tgt(e,6.5); if(!t) return true; e.cd.b=K?.25:.5; fx.push({k:'seg',x0:e.x,y0:e.y,x1:t.x,y1:t.y,w:.5,t0:now,team:e.team,lab:'원죄',src:e,v:'tracer'}); const c=e.r.cold,d=e.r.dark; e.r.cold=false; e.r.dark=false;
    strike(e,t,9+(d?12:0),'원죄',{basic:true,blind:d?1:0,knock:0,post:x=>{ if(c){ add(x,'slow',3,.2,{by:e}); dot(e,x,18,3,'냉혈'); } }}); if(K) heal(e,3,true); e.r.sin+=5; CH.ganaan.chk(e); return true; },
  skills:{
   crouch:CROUCH,
   n1:{name:'냉혈',cd:6,ai:(e,d)=>d<=8&&e.r.sin<=55,cast(e){ e.r.sin+=40; e.r.cold=true; CH.ganaan.chk(e); }},
   n2:{name:'암광',cd:8,ai:(e,d)=>d<=8,cast(e){ e.r.sin-=20; e.r.dark=true; CH.ganaan.chk(e); }},
   aw:{name:'죄악의 왕',cd:45,ai:(e,d)=>d<=9,can:e=>e.r.sin===0,need:'죄악 0',cast(e){ e.r.king=now+12; }},
   ult:{name:'인세의 지옥',cd:0,r:5,can:e=>e.r.sin>=95,need:'죄악 95 이상',cast(e){ S.focus(e,2); after(2,()=>{ if(e.dead) return; e.r.sin=0; S.circle(e,5,30,'인세의 지옥',{v:'burst',post:t=>{ add(t,'slow',3,.66,{by:e}); add(t,'dealdown',3,.66,{by:e}); }}); for(const k in e.cd) if(k!=='ult') e.cd[k]=0; heal(e,30); }); }}
  },note:'기본기 단추가 총이다(6.5칸 안의 적, 0.5초. 시험장 조정 2026-11: 카드의 8칸에서 줄였다). 웅크리기 단추를 누른 뒤 1.2초 안에 쏘면 자신을 쏴 체력 9와 죄악 5를 잃는다.'},
reitia:{name:'아득한 소망, 레이티아',cls:'지원가',grade:'전설',range:6,
  init:e=>{e.r={pcd:0,g:0,ryu:0,sky:0,skz:0,sacc:0}}, hud:e=>'중력 제어 '+e.r.g+'/21'+(e.r.ryu>now?' · 류운':'')+(e.r.sky>now?' · 극천':''),
  nak(e,t,d){ rm(t,'nakun'); add(t,'nakun',d,0,{by:e}); add(t,'slow',d,.2,{by:e}); e.r.g++; },
  tick(e,dt){ if(e.r.pcd>0) e.r.pcd-=dt; ents.forEach(x=>{ if(!x.dead&&has(x,'nakun')) slowFall(x); }); if(e.r.ryu>now) slowFall(e);
    if(e.r.sky>now){ if(e.z>=e.r.skz||e.vz<=0){ e.z=Math.max(e.z,e.r.skz); e.vz=0; } e.r.sacc+=dt; if(e.r.sacc>=1){ e.r.sacc-=1; const t=tgt(e,99); for(let i=0;i<2;i++){ const a=Math.random()*6.283; S.proj(e,{x:Math.cos(a),y:Math.sin(a)},{speed:8,range:40,life:3,home:t,dmg:4,z:t?t.z:0,label:'새털구름',o:{post:x=>{ if(x.z>0){ x.z=Math.max(0,x.z-1); e.r.g++; } }}}); } } } },
  onCast(e,s){ if(e.r.pcd>0||s==='crouch') return; e.r.pcd=12; proc(e,'서락','뭉게구름'); const p=spot(e,9,4),got=new Set(); zone(e,{x:p.x,y:p.y,r:3,dur:2,every:.2,label:'뭉게구름',tick:(z,inn)=>inn.forEach(t=>{ if(!got.has(t)){ got.add(t); CH.reitia.nak(e,t,2); } })}); },
  skills:{
   n1:{name:'부운',cd:8,r:9,cast(e){ const p=spot(e,9,4); fx.push({k:'circle',x:p.x,y:p.y,r:2,t0:now,team:e.team,dur:.5,lab:'부운',src:e}); after(.5,()=>{ if(!e.dead) S.circle(e,2,25,'부운',{air:3,v:'geyser',post:()=>e.r.g++},p); }); }},
   n2:{name:'천류',cd:16,ai:(e,d)=>d<4,cast(e){ S.blink(e,moveDir(e),5); e.r.ryu=now+4; add(e,'jumpup',4,2,{self:true}); }},
   aw:{name:'창공 회류',cd:45,r:9,cast(e){ const p=spot(e,9,4); let k=0; zone(e,{x:p.x,y:p.y,r:1,dur:5.05,every:1,label:'창공 회류',tick:(z,inn)=>{ k++; z.r=Math.min(5,k); foes(e).filter(t=>Math.hypot(t.x-z.x,t.y-z.y)<=z.r+R).forEach(t=>{ strike(e,t,23-3*k,'창공 회류'); add(t,'nojump',1,0,{by:e}); e.r.g++; if(k>=5){ air(t,5); e.r.g++; } }); }}); }},
   ult:{name:'천명지위성',cd:0,r:6,can:e=>e.r.g>=21,need:'중력 제어 21회',cast(e){ fx.push({k:'circle',x:e.x,y:e.y,r:6,t0:now,team:e.team,lab:'천명지위성',src:e,v:'geyser'}); foes(e).forEach(t=>{ if(dist(e,t)<=6+R){ air(t,5); CH.reitia.nak(e,t,5); } }); hop(e,5); e.r.skz=4.6; e.r.sky=now+7.6; e.r.sacc=0; }}
  },note:"낙운·류운의 '천천히 하강'은 떨어지는 속도를 초당 2.5칸으로 묶었다. 극천 7초 동안 레이티아는 5칸 높이에 떠 있어 근접 공격이 닿지 않는다. 구름·회류는 9칸 안의 적이 선 자리에 생긴다."},
notis:{name:'금속 연구가, 노티스',cls:'지원가',grade:'전설',range:6,
  init:e=>{e.r={pcd:0,cr:0,n:0}}, hud:e=>'자력 '+(e.r.pcd>0?e.r.pcd.toFixed(0)+'s':'준비')+' · 적중 '+e.r.n+'/18',
  tick(e,dt){ if(e.r.pcd>0) e.r.pcd-=dt; },
  onSkillHit(e,t){ if(e.r.pcd>0||t.dead) return; e.r.pcd=12; const pull=e.r.cr>now; proc(e,'자력',pull?'끌어들임':'밀어냄'); knock(t,e,pull?-2.5:2.5); },
  skills:{
   crouch:CROUCH,
   n1:{name:'자탄',cd:6,r:11,cast(e){ S.proj(e,e.aim,{speed:24,range:13,dmg:12,label:'자탄',o:{post:t=>{ e.r.n++; rm(t,'attach'); add(t,'attach',8,0,{by:e}); }}}); }},
   n2:{name:'자기장',cd:12,r:9,cast(e){ S.circle(e,3,t=>has(t,'attach')?20:0,'자기장',{slow:[.2,2],v:'hex',zfree:true,post:t=>{ e.r.n++; if(has(t,'attach')) air(t,1); }},spot(e,9,4)); }},
   aw:{name:'금속 결합',cd:30,r:12,can:e=>foes(e).some(t=>has(t,'attach')),need:'부착된 적',cast(e){ const p=Object.assign(front(e,3),{z:0}); foes(e).forEach(t=>{ if(has(t,'attach')){ rm(t,'attach'); puff(t.x,t.y,'iron',8,4); t.x=p.x; t.y=p.y; clamp(t); } }); S.circle(e,2,30,'금속 결합',{root:.5,v:'burst',zfree:true},p); }},
   ult:{name:'중력석개론',cd:0,r:11,can:e=>e.r.n>=18,need:'자탄·자기장 적중 18회',cast(e){ hop(e,.8); const got=new Set(); for(let i=0;i<5;i++) after(i*.3,()=>{ if(!e.dead) S.proj(e,e.aim,{speed:24,range:13,dmg:0,label:'자탄',nohit:true,touch:t=>got.add(t)}); });
        after(1.9,()=>{ if(e.dead) return; got.forEach(t=>{ if(t.dead) return; air(t,10); after(airtime(10)*.5,()=>{ if(e.dead||t.dead) return; down(t); strike(e,t,50,'중력석개론',{stun:1}); fx.push({k:'circle',x:t.x,y:t.y,r:2,t0:now,team:e.team,lab:'중력석개론',src:e,v:'quake'}); }); }); }); }}
  },note:'자력은 12초에 한 번 스킬이 맞은 적을 2.5칸 밀어낸다. 웅크리기 단추를 누른 뒤 1.2초 안이면 끌어들인다. 금속 결합은 3칸 앞으로 끌어온다.'},
mars:{name:'전투의 대가, 마르스',cls:'지원가',grade:'전설',range:2.6,
  init:e=>{e.r={ch:false,gd:false,bow:0,bn:0,hits:0}}, hud:e=>(e.r.ch?'사슬 · ':'')+(e.r.gd?'반탄 · ':'')+'스킬 적중 '+e.r.hits+'/16',
  onCast(e,s){ if(s!=='crouch') e.r.ch=true; },
  onSkillHit(e){ e.r.hits++; },
  tick(e){ if(e.r.bow&&e.r.bow<=now){ e.r.bow=0; const d=moveDir(e); S.leap(e,d,4,26,()=>S.leap(e,d,4,26)); } },
  altBasic(e){ if(!e.r.ch) return false; if(e.cd.b>0) return true; e.cd.b=CFG.atkInt; e.r.ch=false; e.swingT=now; swingSnd(e); S.arc(e,5,18,'사슬',{basic:true,pull:.7,v:'claw',el:'iron'}); return true; },
  modTake(e,src,amt){ if(src!==e&&e.r.gd){ e.r.gd=false; say(e,'반탄','#cfd8ea'); return amt*(PH?.25:.5); } return amt; },
  skills:{
   crouch:{name:'원호 사격',cd:.35,can:e=>e.r.bow>now&&e.r.bn<5,need:'활 겨누는 중',ai:(e,d)=>d<=13,cast(e){ e.r.bn++; S.proj(e,e.aim,{speed:28,range:14,dmg:8,label:'원호 사격',o:{knock:1},v:'arrow'}); }},
   n1:{name:'비검',cd:8,ai:(e,d)=>d>2&&d<=7,can:e=>e.r.bow<=now,need:'활 겨누는 중 아님',cast(e){ S.leap(e,moveDir(e),4,22,()=>S.line(e,3,20,'비검',{air:2,slow:[.25,1]}),true); }},
   n2:{name:'반탄',cd:10,ai:e=>hurtNow(e)||incoming(e),can:e=>e.r.bow<=now,need:'활 겨누는 중 아님',cast(e){ e.r.gd=true; }},
   aw:{name:'원호 사격',cd:30,r:12,cast(e){ e.r.bow=now+3; e.r.bn=0; }},
   ult:{name:'전투 속행',cd:0,ai:e=>true,can:e=>e.r.hits>=16&&e.hp<=200&&e.r.bow<=now,need:'스킬 적중 16회 + 체력 200 이하',cast(e){ S.leap(e,moveDir(e),6,22); after(1,()=>{ if(!e.dead) cleanse(e); }); for(let i=1;i<=10;i++) after(i,()=>heal(e,6)); }}
  },note:'원호 사격은 3초 동안 웅크리기 단추로 화살을 쏜다(최대 5발). 반탄은 다음 공격 한 번을 막는다(투사체 25%, 그 밖은 50%만 받음).'},
melt:{name:'완고한 야장, 멜트',cls:'지원가',grade:'전설',range:2.4,
  init:e=>{e.r={ys:0,pcd:0,n:0,arm:0}}, hud:e=>'열상 '+e.r.ys+'/2 ('+(e.r.pcd>0?e.r.pcd.toFixed(0)+'s':'준비')+') · 발동 '+e.r.n+'/8',
  tick(e,dt){ if(e.r.pcd>0) e.r.pcd-=dt; },
  onCast(e,s){ if(s!=='crouch'&&e.r.ys<2) e.r.ys++; },
  onDeal(e,t,amt,label,o){ if(e.r.arm>now&&o&&!o.amp&&!t.dead) damage(e,t,amt*.1,'무장 (증폭)',{amp:true}); },
  basicBonus(e,t){ if(e.r.ys<=0||e.r.pcd>0) return; e.r.ys--; e.r.pcd=8; e.r.n++; proc(e,'열상','최대 체력 5%'); damage(e,t,t.max*.05,'열상 (최체비)'); add(t,'slow',2,.2,{by:e}); },
  skills:{
   n1:{name:'단조',cd:8,r:4,can:e=>!!tgt(e,4),need:'4칸 안의 적',cast(e){ const t=tgt(e,4),sl=has(t,'slow'); e.swingT=now; fx.push({k:'circle',x:t.x,y:t.y,r:1,t0:now,team:e.team,lab:'단조',src:e,v:'quake'}); strike(e,t,15,'단조'); if(sl&&!t.dead){ rm(t,'slow'); add(t,'stun',.5,0,{by:e}); } }},
   n2:{name:'시제품',cd:12,ai:(e,d)=>d<=5,cast(e){ shield(e,18,3); }},
   aw:{name:'열망의 검',cd:45,r:6,cast(e){ S.focus(e,1); after(1,()=>{ if(!e.dead) S.arc(e,6,40,'열망의 검',{vuln:[.25,5],v:'scythe',el:'forge'}); }); }},
   ult:{name:'공방의 열기',cd:0,r:6,can:e=>e.r.n>=8,need:'열상 발동 8회',cast(e){ shield(e,30,9); add(e,'resist',9,.1); e.r.arm=now+9; }}
  },note:'시제품을 던져 줄 아군이 없어 늘 자신이 입는다. 열상은 8초에 한 번 나간다.'}
});

for(const k in CH){ const c=CH[k],b=CLASSES[c.cls]; c.hp=b.hp; c.atk=b.atk; c.key=k; }
Object.assign(LOOK,{
 rano:{el:'beast',w:'spear',hair:'#c98f4a',acc:['ponytail','scarf'],scarf:'#7fdc7a',tip:'#8a5a2b'}, hwi:{el:'mind',w:'saber',hair:'#1a1a22',acc:['ponytail','cape'],cape:'#2a2a3a'},
 biwol:{el:'steel',w:'saber',hair:'#3a3a4a',acc:['bandana','cape'],band:'#6fa2ff',cape:'#20305a'}, trion:{el:'water',w:'fists',hair:'#4fb6ff',acc:['bandana'],band:'#ffffff'},
 ur:{el:'powder',w:'greatsword',hair:'#ffe27a',acc:['cape','pauldrons'],cape:'#3a3a6a',bl:'#fff3d6'}, leus:{el:'holy',w:'banner',hair:'#f3ead0',acc:['halo','pauldrons','cape'],cape:'#f5f1e3',shield:'#ffe9a0',metal:'#e9e2c6'},
 helga:{el:'blood',w:'axe',hair:'#c0392b',acc:['fur','horns','paint']}, blossom:{el:'dream',w:'spear',hair:'#ffb3dd',acc:['cape','ribbon'],cape:'#ffd6ec',tip:'#fff0fa'},
 stella:{el:'arcane',w:'ringstaff',hair:'#f0e3ff',acc:['veil','halo','robe']}, evangeline:{el:'arcane',w:'wand',hair:'#e3c377',acc:['crown','hat','robe'],hat:'#3a1f6a'},
 venil:{el:'ice',w:'leafstaff',hair:'#bfeeff',acc:['hood','robe'],hood:'#5a8ab8'}, pastern:{el:'mind',w:'wand',hair:'#8a8f99',acc:['mask','robe']},
 rotia:{el:'curse',w:'dagger2',hair:'#5a3a6a',acc:['ribbon','scarf'],scarf:'#a6e04f'}, yuri:{el:'blue',w:'saber',hair:'#1a1a22',acc:['ponytail','scarf'],scarf:'#5aa8ff',bl:'#cfe4ff',gd:'#5aa8ff'},
 alpi:{el:'wind',w:'dagger2',hair:'#a8f0d0',acc:['scarf','ears'],scarf:'#f2fff8'}, ain:{el:'shadow',w:'saber',hair:'#2a2740',acc:['hood','cape'],hood:'#2a2740',cape:'#1a1830',bl:'#c9c2ff'},
 arwen:{el:'snow',w:'rifle',hair:'#20203a',acc:['hood','cape'],hood:'#20203a',cape:'#14142a'}, dioris:{el:'powder',w:'revolver',hair:'#c98f4a',acc:['scarf','goggles'],scarf:'#ff7a3c'},
 largen:{el:'mind',w:'saber',hair:'#6b6f7a',acc:['cowboy','cape'],cape:'#3a3a3a'}, ganaan:{el:'hell',w:'revolver',hair:'#14141f',acc:['crown','cape'],cape:'#3a0f14'},
 reitia:{el:'snow',w:'ringstaff',hair:'#cfe4ff',acc:['halo','robe']}, notis:{el:'iron',w:'wrench',hair:'#8a6a3a',acc:['goggles','pack']},
 mars:{el:'iron',w:'sword',hair:'#8a1f1f',acc:['plume','pauldrons'],plume:'#c0392b',sh:true,shield:'#b9b1a3',metal:'#b9b1a3'}, melt:{el:'forge',w:'mace',nosh:true,hair:'#3a2a1a',acc:['apron','pauldrons'],metal:'#8a6a4a'}
});
Object.assign(RES,{
 rano:{u:e=>e.r.ev/8,p:e=>[e.r.dr,8,e.r.man?'#ff7a3c':'#ffd9a0']}, hwi:{u:e=>e.r.lost/400}, biwol:{u:e=>e.r.hits/16,p:e=>[e.r.ut>now?e.r.sw:e.r.d,14,e.r.ut>now?'#fff6d6':'#cfd8ea']},
 trion:{u:e=>e.r.c===46?1:e.r.c/46*.95,gz:e=>[e.r.c/47,'#4fb6ff']}, ur:{u:e=>e.r.ch/36,p:e=>e.r.st>now?[Math.min(9,e.r.sn),9,'#ffe27a']:null}, leus:{u:e=>e.r.sh/7},
 helga:{u:e=>e.r.rg/100,gz:e=>[e.r.rg/100,'#d8324a']}, blossom:{u:e=>e.r.aw?Math.min(1,90/Math.max(90,e.hp)):0}, stella:{u:e=>e.r.ok?1:e.r.chain/7,p:e=>[e.r.st,7,'#f0e3ff']},
 evangeline:{u:e=>e.r.n/20}, venil:{u:e=>(e.r.n>=1?.5:0)+(e.r.awHit?.5:0)}, pastern:{u:e=>e.r.rs/9}, rotia:{u:e=>e.r.ah/40,gz:e=>[e.r.go/100,'#a6e04f']}, yuri:{u:e=>e.r.n/100},
 alpi:{u:e=>e.r.n/50}, ain:{u:e=>e.r.mx/4,p:e=>e.r.mh>now?[4-e.r.md,4,'#c9c2ff']:null}, arwen:{u:e=>e.r.exec?1:0,p:e=>[e.r.ar,2,'#dcefff']}, dioris:{u:e=>e.r.n/12},
 largen:{u:e=>Math.min(1,100/Math.max(100,e.hp)),gz:e=>[e.r.es/(e.r.ult?60:30),'#f3e7c0']}, ganaan:{u:e=>e.r.sin/95,gz:e=>[e.r.sin/100,'#ff5a2a']}, reitia:{u:e=>e.r.g/21},
 notis:{u:e=>e.r.n/18}, mars:{u:e=>Math.min(1,e.r.hits/16)*(e.hp<=200?1:.9),p:e=>e.r.bow>now?[5-e.r.bn,5,'#b9b1a3']:null}, melt:{u:e=>e.r.n/8,p:e=>[e.r.ys,2,'#ffb066']}
});
Object.assign(AURA,{
 rano(e,by){ if(e.r.man) emit(e,by,'beast',.5); if(e.r.st>now) ringAt(e.x,e.y,.8,'#7fe3b5',3.5); if(e.r.rise>now) ringAt(e.x,e.y,.95,'#ffd9a0',2,[.2,.14]); },
 hwi(e,by){ if(e.r.on){ emit(e,by,'blood',.5); ringAt(e.x,e.y,.75,'#d8324a',3); } }, biwol(e,by){ if(e.r.sang>now) ringAt(e.x,e.y,.75,'#6fa2ff',3); if(e.r.ut>now) for(let i=0;i<e.r.sw;i++){ const a=now*3+i*6.283/e.r.sw; g.strokeStyle='#e8eef8'; g.lineWidth=2.5/cell; g.beginPath(); g.moveTo(e.x+Math.cos(a)*.9,by+Math.sin(a)*.9); g.lineTo(e.x+Math.cos(a)*1.4,by+Math.sin(a)*1.4); g.stroke(); } },
 trion(e,by){ if(e.r.hw>now) emit(e,by,'water',.5); if(e.r.ut>now) ringAt(e.x,e.y,.8,'#4fb6ff',3.5); }, ur(e,by){ if(e.r.nb>now||e.r.fin) ringAt(e.x,e.y,.75,'#ffe27a',3); if(e.r.st>now) emit(e,by,'powder',.5); },
 leus(e,by){ if(e.r.gd>now||e.r.pae>now){ g.strokeStyle='#ffe9a0'; g.lineWidth=5/cell; const a=Math.atan2(e.aim.y,e.aim.x); g.beginPath(); g.arc(e.x,by,.95,a-1.1,a+1.1); g.stroke(); } if(has(e,'invuln')) AURA.cornwall(e,by); },
 helga(e,by){ if(e.r.rg>=50) emit(e,by,'blood',e.r.rg/200); if(e.r.rg>=100) ringAt(e.x,e.y,.8,'#d8324a',3.5); }, blossom(e,by){ if(CH.blossom.hy(e)) emit(e,by,'dream',.5); if(e.r.mu>now) ringAt(e.x,e.y,.85,'#ff9fd6',3.5); if(has(e,'invuln')) AURA.cornwall(e,by); },
 stella(e,by){ for(let i=0;i<e.r.st;i++){ const a=now*1.5+i*.898; g.fillStyle='#f0e3ff'; g.shadowColor='#b58cff'; g.shadowBlur=8; g.beginPath(); g.arc(e.x+Math.cos(a)*.95,by-.3+Math.sin(a)*.5,.07,0,7); g.fill(); g.shadowBlur=0; } },
 evangeline(e,by){ const c={염성:'#ff7a3c',수결:'#4fb6ff','공진 폭렬':'#a8f0d0'}[e.r.nx]; if(c) ringAt(e.x,e.y,.75,c,3); if(has(e,'invuln')) AURA.cornwall(e,by); }, venil(e,by){ if(has(e,'invuln')) AURA.cornwall(e,by); foes(e).forEach(t=>{ if(has(t,'vapor')&&Math.random()<.3) puff(t.x,t.y-t.z*.45,'ice',1,1,.5); }); },
 pastern(e,by){ if(e.r.pcd<=0) ringAt(e.x,e.y,.7,'rgba(243,231,192,.6)',1.5,[.1,.16]); foes(e).forEach(t=>{ if(has(t,'paradox')) markOn(t,'#f3e7c0','역설'); }); }, rotia(e,by){ foes(e).forEach(t=>{ if(has(t,'venom')&&Math.random()<.4) puff(t.x,t.y-t.z*.45,'curse',1,1,.5); }); },
 yuri(e,by){ if(e.r.ck) ringAt(e.x,e.y,.75,'#5aa8ff',3); if(e.r.ut>now) emit(e,by,'blue',.7); }, alpi(e,by){ if(e.r.tw) emit(e,by,'wind',.3); if(e.r.ut>now) ringAt(e.x,e.y,.8,'#7fdc7a',3); },
 ain(e,by){ if(e.r.mh>now) emit(e,by,'shadow',.5); foes(e).forEach(t=>{ const n=CH.ain.n(e,t),y=t.y-t.z*.45; for(let i=0;i<n;i++){ const a=i*1.571+.785; g.strokeStyle='#c9c2ff'; g.lineWidth=2.5/cell; g.beginPath(); g.moveTo(t.x+Math.cos(a)*.5,y+Math.sin(a)*.5); g.lineTo(t.x+Math.cos(a)*1,y+Math.sin(a)*1); g.stroke(); } }); },
 arwen(e,by){ if(e.r.judge) ringAt(e.x,e.y,.8,'#ffffff',3.5); }, dioris(e,by){ if(e.r.im>now) emit(e,by,'powder',.4); if(e.r.uc>now||e.r.aw>now) ringAt(e.x,e.y,.8,'#ffd27a',3,[.2,.12]); },
 largen(e,by){ chgRing(e,by); if(e.r.sh){ const f=e.r.es/(e.r.ult?60:30); ringAt(e.x,e.y,.7+f*.5,'#f3e7c0',2+f*2); } }, ganaan(e,by){ if(e.r.king>now){ emit(e,by,'hell',.5); ringAt(e.x,e.y,.8,'#ff5a2a',3); } if(e.r.cr>now) ringAt(e.x,e.y,.95,'#c98a8a',2,[.16,.12]); },
 reitia(e,by){ if(e.r.ryu>now||e.r.sky>now) emit(e,by,'snow',.5); }, notis(e,by){ if(e.r.cr>now) ringAt(e.x,e.y,.95,'#b9b1a3',2,[.16,.12]); foes(e).forEach(t=>{ if(has(t,'attach')) markOn(t,'#b9b1a3','부착'); }); },
 mars(e,by){ if(e.r.ch) ringAt(e.x,e.y,.75,'#b9b1a3',3); if(e.r.gd){ g.strokeStyle='#cfd8ea'; g.lineWidth=5/cell; const a=Math.atan2(e.aim.y,e.aim.x); g.beginPath(); g.arc(e.x,by,.95,a-1,a+1); g.stroke(); } if(e.r.bow>now) ringAt(e.x,e.y,.9,'#ffe2a8',2,[.2,.12]); },
 melt(e,by){ if(e.r.ys>0&&e.r.pcd<=0) emit(e,by,'forge',.25*e.r.ys); if(e.r.arm>now) ringAt(e.x,e.y,.8,'#ffb066',3); }
});
Object.assign(STATES,{
 rano:e=>[e.r.man&&['만취'],e.r.st>now&&['접목',until(e.r.st)],e.r.rise>now&&['기상',until(e.r.rise)]], hwi:e=>[e.r.on&&['발검'],e.r.nd>now&&['회광반조',until(e.r.nd)]],
 biwol:e=>[e.r.sang>now&&['상예',until(e.r.sang)],e.r.ut>now&&['어검술',until(e.r.ut)]], trion:e=>[e.r.hw>now&&['활수',until(e.r.hw)],e.r.ut>now&&['시대의 흐름',until(e.r.ut)]],
 ur:e=>[e.r.nb>now&&['벽력',until(e.r.nb)],e.r.st>now&&['우레 폭풍',until(e.r.st)],e.r.fin&&['일격 준비']], leus:e=>[e.r.nb>now&&['무력',until(e.r.nb)],e.r.gd>now&&['방어',until(e.r.gd)],e.r.pae>now&&['패용',until(e.r.pae)]],
 helga:e=>[e.r.rg>=100&&['분노 최대']], blossom:e=>[CH.blossom.hy(e)&&['향화'],CH.blossom.gd(e)&&['화원'],e.r.mu>now&&['무화',until(e.r.mu)]], stella:e=>[], evangeline:e=>[e.r.nx&&['조화경: '+e.r.nx]],
 venil:e=>[], pastern:e=>[], rotia:e=>[], yuri:e=>[e.r.ck&&['창천검'],e.r.sn>now&&['초감각',until(e.r.sn)],e.r.ut>now&&['창천반선',until(e.r.ut)]], alpi:e=>[e.r.ut>now&&['가련한 바람',until(e.r.ut)]],
 ain:e=>[e.r.mh>now&&['몽환포영',until(e.r.mh)],e.r.ut>now&&['영검난무',until(e.r.ut)]], arwen:e=>[e.r.judge&&['심판의 빛']], dioris:e=>[e.r.im>now&&['몰입',until(e.r.im)],e.r.rel>now&&['해제',until(e.r.rel)]],
 largen:e=>[e.r.sh&&['납도'],e.chg&&['차징'],e.r.ult&&['단업의 검']], ganaan:e=>[e.r.king>now&&['죄악의 왕',until(e.r.king)],e.r.cr>now&&['웅크림',until(e.r.cr)]],
 reitia:e=>[e.r.ryu>now&&['류운',until(e.r.ryu)],e.r.sky>now&&['극천',until(e.r.sky)]], notis:e=>[e.r.cr>now&&['웅크림',until(e.r.cr)]], mars:e=>[e.r.ch&&['사슬'],e.r.gd&&['반탄'],e.r.bow>now&&['원호 사격',until(e.r.bow)]],
 melt:e=>[e.r.arm>now&&['무장',until(e.r.arm)]]
});
Object.assign(STY,{
 rano:{'타구':'cut','접목 (내리찍기)':'quake'}, hwi:{'일섬':'windcut','검극':'slash'}, biwol:{'섬퇴':'cut','비점':'thrust'}, ur:{'축전':'bolt'}, helga:{'투사':'slash'},
 stella:{'혜성':'shard'}, evangeline:{'수결':'orb'}, venil:{'기화':'orb'}, pastern:{'괴리':'cut'}, rotia:{'암기':'knife','갈사비접':'knife'}, alpi:{'회오리':'orb'}, ain:{'멸영':'shard','영검난무':'shard'},
 arwen:{'저격':'bullet','저격 (심판)':'bullet','투망':'orb'}, largen:{'발도':'windcut'}, notis:{'자탄':'shard'}, mars:{'비검':'cut'}, reitia:{'새털구름':'orb'}, yuri:{'창천검':'scythe','천선검':'slash'}
});
