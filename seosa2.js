"use strict";
/* 서사급 추가 2: 마법사 7 · 암살자 4. */
const spot=(e,r,d)=>{ const t=tgt(e,r); return t?{x:t.x,y:t.y,z:0}:Object.assign(front(e,d),{z:0}); };
const behind=(e,t)=>{ const f=has(t,'flank'); if(f&&f.by===e) return true; const n=norm(e.x-t.x,e.y-t.y); return n.x*t.aim.x+n.y*t.aim.y<-.25; };
const amp=(e,t,amt,label,o,rate,tag)=>{ if(o&&o.skill&&!o.amp&&!t.dead) damage(e,t,amt*rate,tag,{amp:true}); };

Object.assign(CH,{
salomon:{name:'지혜의 군주, 살로몬',cls:'마법사',grade:'서사',range:8,
  init:e=>{e.r={mp:0,plus:0,acc:0,zn:null,bt:0,ut:0,un:0}}, hud:e=>'마나 '+Math.floor(e.r.mp)+' (+'+(5+e.r.plus)+'/초) · 번 '+Math.floor(e.r.bt)+'/30초',
  tick(e,dt){ e.r.mp=Math.min(100,e.r.mp+(5+e.r.plus)*dt); const z=e.r.zn; if(z&&z.until>now){ e.r.bt+=dt; e.r.mp-=15*dt; if(e.r.mp<=0){ e.r.mp=0; z.until=now; e.r.zn=null; } } else e.r.zn=null; },
  onSkillHit(e){ e.r.plus=Math.min(10,e.r.plus+1); },
  skills:{
   n1:{name:'볼트',cd:2,r:12,can:e=>e.r.mp>=30,need:'마나 30',cast(e){ e.r.mp-=30; S.proj(e,e.aim,{speed:24,range:14,dmg:20,label:'볼트'}); }},
   n2:{name:'거스트',cd:5,r:4,can:e=>e.r.mp>=60,need:'마나 60',cast(e){ e.r.mp-=60; S.arc(e,4,30,'거스트',{knock:2,v:'blast',el:'wind'}); }},
   aw:{name:'마나의 왕',cd:30,r:9,can:e=>e.r.mp>=15,need:'마나 15',cast(e){ S.focus(e,1); after(1,()=>{ if(e.dead) return; const p=spot(e,9,5); e.r.zn=zone(e,{x:p.x,y:p.y,r:5,dur:99,every:.5,label:'마나 번',tick:(z,inn)=>inn.forEach(t=>{ strike(e,t,5,'마나의 왕',{slow:[.2,.6]}); })}); }); }},
   crouch:{name:'마나 번 종료',cd:.3,can:e=>!!e.r.zn,need:'마나 번 중',ai:e=>e.r.mp<12,cast(e){ if(e.r.zn){ e.r.zn.until=now; e.r.zn=null; } }},
   ult:{name:'만능의 비원',cd:0,r:5,can:e=>e.r.plus>=10&&e.r.bt>=30,need:'축적량 최대 + 마나 번 30초',cast(e){ e.r.mp=0; e.r.plus=0; e.r.un=0; add(e,'invuln',3); add(e,'root',3,0,{self:true}); for(let i=1;i<=6;i++) after(i*.5,()=>{ if(e.dead) return; e.r.un+=S.circle(e,5,10,'만능의 비원',{v:'nova'}).length; if(i===6) heal(e,e.r.un*5); }); }}
  },note:'마나 0으로 시작한다. 마나 번은 9칸 안의 적이 선 자리(없으면 5칸 앞)에 깔리고, 웅크리기 단추로 끈다.'},
barsa:{name:'날뛰는 불꽃, 바르사',cls:'마법사',grade:'서사',range:7,
  init:e=>{e.r={pcd:0,n:0}}, hud:e=>'방화광 '+e.r.n+'/44 · '+(e.r.pcd>0?e.r.pcd.toFixed(0)+'s':'준비'),
  tick(e,dt){ if(e.r.pcd>0) e.r.pcd-=dt; },
  onSkillHit(e,t,label){ if(label!=='방화광'&&e.r.pcd<=0&&!t.dead){ e.r.pcd=7; e.r.n++; proc(e,'방화광','3초간 6'); dot(e,t,6,3,'방화광'); after(3,()=>{ if(!e.dead) add(e,'haste',1,.1); }); } },
  rs(e){ e.r.pcd=0; },
  skills:{
   n1:{name:'발화',cd:9,r:9,cast(e){ S.focus(e,.5); after(.5,()=>{ if(e.dead) return; const p=spot(e,9,4); for(let i=0;i<4;i++) after(i*.12,()=>{ if(!e.dead) S.circle(e,3,5,'발화',{v:'burst',post:()=>CH.barsa.rs(e)},p); }); }); }},
   n2:{name:'염화',cd:15,ai:(e,d)=>d<3.5||(d>5&&d<=7),cast(e){ const p0=S.blink(e,moveDir(e),6),p1={x:e.x,y:e.y}; for(let i=0;i<3;i++) after(i*.08,()=>{ if(!e.dead) S.seg(e,p0,p1,1.4,10,'염화',{v:'beam',post:()=>CH.barsa.rs(e)}); }); }},
   aw:{name:'작열의 꽃',cd:30,r:11,cast(e){ S.proj(e,e.aim,{speed:16,range:12,dmg:0,label:'작열의 꽃',big:true,nohit:true,onEnd:p=>{ zone(e,{x:p.x,y:p.y,r:5,dur:3,every:.33,label:'작열의 꽃',tick:(z,inn)=>inn.forEach(t=>strike(e,t,3,'작열의 꽃',{post:()=>CH.barsa.rs(e)}))}); }}); }},
   ult:{name:'죽음의 불꽃',cd:0,r:6,can:e=>e.r.n>=44,need:'방화광 44회',cast(e){ S.focus(e,1); after(1,()=>{ if(e.dead) return; S.circle(e,6,0,'죽음의 불꽃',{v:'nova',post:t=>{ add(t,'vuln',4,.12,{by:e}); add(t,'pyre',4,0,{by:e}); for(let i=1;i<=12;i++) after(i*.33,()=>{ if(!e.dead&&!t.dead) strike(e,t,4,'화형',{post:()=>CH.barsa.rs(e)}); }); }}); }); }}
  },note:'발화는 9칸 안의 적이 선 자리에 4타(5씩)로 떨어진다. 염화는 3타(10씩). 작열의 꽃은 날아가다 닿은 곳이나 12칸 끝에서 피어난다.'},
pluto:{name:'명계의 왕자, 플루토',cls:'마법사',grade:'서사',range:6,
  init:e=>{e.r={pcd:0,gh:0}}, hud:e=>(e.r.gh>now?'망령 · ':'')+'명왕 '+(e.r.pcd>0?e.r.pcd.toFixed(0)+'s':'준비'),
  tick(e,dt){ if(e.r.pcd>0) e.r.pcd-=dt; },
  onCast(e,s){ if(e.r.pcd<=0){ e.r.pcd=10; e.r.gh=now+4; add(e,'haste',4,.1); proc(e,'명왕','망령 4초'); } },
  modTake(e,src,amt,label,o){ if(e.r.gh<=now||src===e) return amt; if(o&&o.basic&&Math.random()<.5){ say(e,'회피','#c9c2ff'); return 0; } return o&&o.skill?amt*1.25:amt; },
  onDeal(e,t,amt,label,o){ if(!o||!o.skill||o.amp||t.dead) return; const r=(e.r.gh>now?.25:0)+(has(t,'hades')?.5:0); if(r>0) damage(e,t,amt*r,e.r.gh>now?'망령·명부 (증폭)':'명부 (증폭)',{amp:true}); },
  skills:{
   n1:{name:'사멸',cd:6,r:9,cast(e){ let done=false; const arrive=p=>{ if(done||e.dead) return; done=true; e.x=p.x; e.y=p.y; clamp(e); S.circle(e,3,20,'사멸',{v:'nova'}); }; S.proj(e,e.aim,{speed:6,range:9,life:1.5,dmg:0,label:'사멸',big:true,nohit:true,pierce:true,onEnd:arrive}); }},
   n2:{name:'빙접',cd:8,r:4,cast(e){ S.circle(e,4,30,'빙접',{slow:[.2,2],v:'burst',el:'ice'}); }},
   aw:{name:'피안의 길',cd:30,r:9,cast(e){ S.focus(e,1); after(1,()=>{ if(!e.dead) S.line(e,9,40,'피안의 길',{silence:1,v:'beam',el:'blood',post:t=>{ if(t.hp<=t.max*.25){ add(t,'hades',9999,0,{by:e}); say(t,'명부','#c9c2ff'); } }}); }); }},
   ult:{name:'추수하는 자',cd:0,r:5,can:e=>foes(e).some(t=>has(t,'hades')),need:'명부에 걸린 적',cast(e){ S.focus(e,1.5); after(1.5,()=>{ if(!e.dead) S.arc(e,5,t=>has(t,'hades')?100:50,'추수하는 자',{v:'scythe',post:t=>add(t,'silence',has(t,'hades')?4:2,0,{by:e})}); }); }}
  },note:"사멸의 투사체는 1.5초 동안 9칸을 날아가고, 그 자리로 옮겨 가 터진다. 궁극기는 카드 그대로 '명부'에 걸린 적이 둘 이상일 때만 쓸 수 있어, 1대1에서는 쓸 수 없다. 명부는 그 판(목숨)이 끝날 때까지 남는다."},
piana:{name:'고결한 아집, 피아나',cls:'마법사',grade:'서사',range:2.4,
  init:e=>{e.r={sa:0,acc:0,bloom:0,n:0}}, hud:e=>'사력 '+e.r.sa+'/200'+(e.r.bloom>now?' · 화무십일홍':''),
  tick(e,dt){ if(!inFight(e)){ e.r.acc+=dt; if(e.r.acc>=1){ e.r.acc-=1; heal(e,5,true); } } if(e.r.bloom&&e.r.bloom<=now) e.r.bloom=0; },
  onKill(e){ e.cd.aw*=.5; for(let i=1;i<=8;i++) after(i,()=>heal(e,e.max*.025)); },
  basicBonus(e,t){ if(e.r.bloom<=now) return; e.r.bloom=0; const n=e.r.n,p={x:t.x,y:t.y,z:0}; add(t,'silence',1,0,{by:e}); add(t,'slow',1,.8,{by:e}); proc(e,'화무십일홍','꽃 '+n+'회'); zone(e,{x:p.x,y:p.y,r:1.5,dur:n*.1+.05,every:.1,label:'꽃',tick:(z,inn)=>inn.forEach(x=>strike(e,x,3,'화무십일홍'))}); },
  skills:{
   n1:{name:'일도',cd:8,ai:e=>e.hp>e.max*.6&&e.r.sa<200,cast(e){ pay(e,40); add(e,'haste',4,.1); after(4,()=>{ if(!e.dead){ e.r.sa=Math.min(200,e.r.sa+20); say(e,'사력 +20','#ff9fd6'); } }); }},
   n2:{name:'만천',cd:12,ai:e=>e.hp>e.max*.7&&e.r.sa<200,cast(e){ pay(e,50); e.r.sa=Math.min(200,e.r.sa+25); e.cd.n1=0; }},
   aw:{name:'화무십일홍',cd:59.9,ai:(e,d)=>d<=5&&e.r.sa>=40,can:e=>e.r.sa>0,need:'사력',cast(e){ e.r.n=e.r.sa; e.r.sa=0; e.r.bloom=now+3; add(e,'haste',3,.3); }},
   ult:{name:'인무천일호',cd:0,ai:e=>e.hp<e.max*.45,can:e=>e.r.sa>=120,need:'사력 120',cast(e){ e.r.sa=0; for(let i=1;i<=4;i++) after(i,()=>heal(e,e.max*.125)); }}
  },note:'꽃은 맞은 자리에 반지름 1.5칸으로 피고, 0.1초마다 3 피해를 사력만큼 되풀이한다(간격은 카드에 없다). 꽃 밖으로 나가면 더 맞지 않는다.'},
bunt:{name:'도박사, 번트',cls:'마법사',grade:'서사',range:7,
  init:e=>{e.r={pcd:0,n:0}}, hud:e=>'셔플 '+e.r.n+'/6 · '+(e.r.pcd>0?e.r.pcd.toFixed(0)+'s':'준비'),
  tick(e,dt){ if(e.r.pcd>0) e.r.pcd-=dt; },
  onDeal(e,t){ if(e.r.pcd>0||t.dead) return; e.r.pcd=16; e.r.n++; proc(e,'셔플','자리 바꿈'); const x=e.x,y=e.y; puff(e.x,e.y,'arcane',8,4); puff(t.x,t.y,'arcane',8,4); e.x=t.x; e.y=t.y; t.x=x; t.y=y; add(t,'blind',1,0,{by:e}); for(const k in e.cd) if(k!=='b') e.cd[k]=Math.max(0,e.cd[k]-3); },
  skills:{
   n1:{name:'발판',cd:8,r:11,cast(e){ S.proj(e,e.aim,{speed:22,range:13,dmg:16,label:'발판',o:{air:1,knock:1}}); }},
   n2:{name:'밑장',cd:12,ai:(e,d)=>d>4.5&&d<=7.5,cast(e){ const p=Object.assign(front(e,6),{z:0}); fx.push({k:'circle',x:p.x,y:p.y,r:1.5,t0:now,team:e.team,dur:2,lab:'밑장',src:e}); after(2,()=>{ if(!e.dead) S.circle(e,1.5,24,'밑장',{stun:1,v:'burst'},p); }); }},
   aw:{name:'멋진 등장',cd:30,r:10,cast(e){ S.proj(e,e.aim,{speed:24,range:12,dmg:0,label:'멋진 등장 (금)',nohit:true,el:'holy',onEnd:p=>S.circle(e,4,30,'멋진 등장',{knock:2,v:'burst',el:'holy'},{x:p.x,y:p.y,z:0})});
        S.proj(e,e.aim,{speed:9,range:12,dmg:0,label:'멋진 등장 (은)',nohit:true,el:'steel',onEnd:p=>{ if(!e.dead){ puff(e.x,e.y,'arcane',8,4); e.x=p.x; e.y=p.y; clamp(e); } }}); }},
   ult:{name:'게임 스타트',cd:0,r:5,can:e=>e.r.n>=6&&!!tgt(e,5),need:'셔플 6회 + 5칸 안의 적',cast(e){ const t=tgt(e,5); if(!t) return; for(const x of [e,t]){ add(x,'invuln',2); add(x,'stun',2,0,{self:true}); } say(e,'착석','#f0b458');
        after(2,()=>{ if(e.dead) return; if(Math.random()<.5){ say(e,'성공','#7fe3b5'); heal(e,50); for(const k in e.cd) e.cd[k]=0; } else { say(e,'실패','#ff7d8c'); S.circle(e,2,0,'게임 스타트',{v:'burst'}); damage(e,e,50,'게임 스타트 (실패)',{fixed:true}); add(e,'stun',1); } }); }}
  },note:'셔플은 16초에 한 번, 피해를 준 순간 상대와 자리를 바꾼다. 멋진 등장의 금색 카드는 닿은 곳(또는 12칸 끝)에서 반지름 4칸으로 터진다. 착석 중에는 둘 다 움직이지 못하고 피해를 받지 않는다.'},
roland:{name:'전광의 천재, 롤랑',cls:'마법사',grade:'서사',range:7,
  init:e=>{e.r={el:0,acc:0,oc:0,oacc:0,sky:0}}, hud:e=>'전광 '+Math.floor(e.r.el)+(e.r.oc>now?' · 과전류':'')+(e.r.sky>now?' · 천뇌':''),
  gain(e,n){ e.r.el=Math.min(100,e.r.el+n); },
  speedMod:e=>1+Math.min(.3,Math.floor(e.r.el/10)*.03),
  tick(e,dt){ if(e.r.sky>now) e.r.el=100; else if(e.r.sky){ e.r.sky=0; e.hp=1; say(e,'체력 1','#c98a8a'); }
    const dr=Math.min(5,Math.floor(e.r.el/20)); if(dr>0){ e.r.acc+=dt; if(e.r.acc>=1){ e.r.acc-=1; e.hp=Math.max(1,e.hp-dr); } }
    if(e.r.oc>now){ e.r.oacc+=dt; if(e.r.oacc>=1){ e.r.oacc-=1; e.hp=Math.max(1,e.hp-3); } }
    if(e.r.el>=80) for(const k in e.cd) if(k!=='b'&&e.cd[k]>0) e.cd[k]=Math.max(0,e.cd[k]-dt); },
  onHurt(e,src,amt,label,o){ if(src!==e) CH.roland.gain(e,o&&o.basic?4:8); },
  onDeal(e,t,amt,label,o){ if(e.r.sky>now&&o&&!o.amp&&!t.dead) damage(e,t,amt*.3,'천뇌 (증폭)',{amp:true}); },
  skills:{
   n1:{name:'뇌창',cd:5,r:11,cast(e){ S.proj(e,e.aim,{speed:26,range:13,dmg:18,label:'뇌창',o:{post:t=>{ CH.roland.gain(e,4); if(e.r.el>=40){ damage(e,t,6,'뇌창 (전광 40)'); add(t,'stun',.5,0,{by:e}); } }}}); }},
   n2:{name:'화뢰',cd:8,ai:(e,d)=>d<3.5||(e.r.el>=60&&d<=7),cast(e){ const E=e.r.el>=60,p0={x:e.x,y:e.y}; S.leap(e,moveDir(e),E?7:3,24,()=>{ if(E) S.seg(e,p0,{x:e.x,y:e.y},1.6,24,'화뢰',{stun:1,v:'beam'}); }); }},
   aw:{name:'번개 불꽃',cd:45,r:9,can:e=>e.r.el>=100,need:'전광 100',cast(e){ e.r.el=0; const p=spot(e,9,5); fx.push({k:'circle',x:p.x,y:p.y,r:7,t0:now,team:e.team,lab:'번개 불꽃',src:e,v:'bolt'});
        foes(e).forEach(t=>{ const d=Math.hypot(t.x-p.x,t.y-p.y); if(d>7+R) return; const f=Math.max(0,Math.min(1,1-(d-1)/6)); strike(e,t,lerp(15,70,f),'번개 불꽃',{stun:lerp(.1,2,f)}); }); e.r.oc=now+5; add(e,'haste',5,.3); }},
   ult:{name:'낙천의 빛',cd:0,r:99,can:e=>e.r.oc>now&&e.r.el>=100,need:'과전류 중 전광 100',cast(e){ e.r.sky=now+10; e.r.el=100; for(const k in e.cd) e.cd[k]=0; }}
  },note:'전광은 맞을 때 쌓인다(기본 공격 4, 스킬 8). 번개 불꽃은 9칸 안의 적이 선 자리에 떨어지고, 중심 1칸 안이면 70 피해·2초 기절, 7칸 끝이면 15 피해·0.1초 기절이다.'},
licht:{name:'제국의 황제, 리히트',cls:'마법사',grade:'서사',range:6,
  init:e=>{e.r={still:false,rb:0,nul:0}}, hud:e=>(e.r.still?'권위 · ':'')+'불령 '+e.r.rb+'/16 · 무효화 '+e.r.nul+'/4',
  tick(e){ e.r.still=!(e.mv.x||e.mv.y)&&!e.dash&&!has(e,'stun'); if(e.r.still) foes(e).forEach(t=>{ if(dist(e,t)>6+R) return; const w=has(t,'weak'); rm(t,'awe'); add(t,'awe',.3,0,{by:e}); add(t,'slow',.3,w?.4:.2,{by:e,awe:true}); if(w&&!has(t,'blind')) add(t,'blind',.4,0,{by:e}); }); },
  law(e,p){ fx.push({k:'circle',x:p.x,y:p.y,r:3,t0:now,team:e.team,dur:1,lab:'율법',src:e}); after(1,()=>{ if(e.dead) return; const got=new Set(); zone(e,{x:p.x,y:p.y,r:3,dur:3,every:.1,label:'율법',tick:(z,inn)=>inn.forEach(t=>{ if(got.has(t)||!(t.mv.x||t.mv.y||t.dash)) return; got.add(t); e.r.rb++; add(t,'rebel',6,0,{by:e}); add(t,'root',.5,0,{by:e}); say(t,'불령','#f0b458'); })}); }); },
  skills:{
   n1:{name:'계약',cd:5,r:11,cast(e){ S.proj(e,e.aim,{speed:24,range:13,dmg:15,label:'계약',o:{knock:.7,post:t=>{ if(has(t,'rebel')){ damage(e,t,8,'계약 (불령)'); add(t,'weak',2,1,{by:e}); } }}}); }},
   n2:{name:'율법',cd:14,r:9,cast(e){ const st=e.r.still; CH.licht.law(e,spot(e,9,4)); if(st) after(.5,()=>{ if(!e.dead) CH.licht.law(e,spot(e,9,4)); }); }},
   aw:{name:'원초 자아',cd:30,r:6,cast(e){ fx.push({k:'circle',x:e.x,y:e.y,r:6,t0:now,team:e.team,lab:'원초 자아',src:e,v:'shout'}); foes(e).forEach(t=>{ if(dist(e,t)<=6+R) add(t,'nullify',1,0,{by:e,onCast:(who,slot)=>{ if(slot==='crouch') return false; e.r.nul++; e.cd.aw=Math.max(0,e.cd.aw-5); say(who,'무효','#d7a6ff'); proc(e,'원초 자아','스킬 무효'); return true; }}); }); }},
   ult:{name:'제국의 주인',cd:0,r:6,can:e=>e.r.rb>=16&&e.r.nul>=4,need:'불령 16회 + 무효화 4회',cast(e){ fx.push({k:'circle',x:e.x,y:e.y,r:6,t0:now,team:e.team,lab:'제국의 주인',src:e,v:'shout'});
        foes(e).forEach(t=>{ if(dist(e,t)>6+R) return; add(t,'slow',4,.9,{by:e}); add(t,'chains',4,0,{by:e,onCast:(who,slot,kind)=>{ if(e.dead) return false; const k={일반:[16,.7,0],각성:[32,1.5,0],초월:[48,3,0],궁극:[80,0,1]}[kind]; if(k) strike(e,who,k[0],'제국의 주인 ('+kind+')',{knock:k[1],silence:k[2]}); return false; }}); }); }}
  },note:"율법은 9칸 안의 적이 선 자리에 1초 뒤 선다. 법칙 안에서 움직이면 한 번 불령·속박된다. 제국의 주인은 이 시험장에 있는 일반·각성·궁극 스킬에만 반응한다."},
stern:{name:'소모라의 번견, 스테른',cls:'암살자',grade:'서사',range:2.4,
  init:e=>{e.r={cap:0,acc:0,od:0,odT:0,ab:0,abAcc:0}}, hud:e=>'캡슐 '+e.r.cap+'/5'+(e.r.od>now?' · 중독':'')+' · 복용 '+Math.floor(e.r.odT)+'/60초',
  dash(e){ const p0=S.blink(e,moveDir(e),4); S.seg(e,p0,{x:e.x,y:e.y},1.4,15,'가속검',{v:'dash'}); },
  tick(e,dt){ const A=e.r.ab>now; if(!A){ e.r.acc+=dt; if(e.r.acc>=9){ e.r.acc-=9; if(e.r.cap<5){ e.r.cap++; proc(e,'에스툼 캡슐','+1'); } } } else { e.r.abAcc+=dt; if(e.r.abAcc>=2){ e.r.abAcc-=2; if(canAct(e)) CH.stern.dash(e); } }
    if(e.r.od>now) e.r.odT+=dt; },
  onCast(e,s){ if(s==='n1'||s==='n2'){ if(e.r.od>now) e.cd[s]*=.67; if(s==='n2'&&e.r.ab>now) e.cd[s]*=.5; } },
  onDeal(e,t,amt,label,o){ if(e.r.ab>now&&o&&!o.amp&&!t.dead) damage(e,t,amt*.1,'오남용 (증폭)',{amp:true}); },
  skills:{
   n1:{name:'가속검',cd:2,ai:(e,d)=>d>2.5&&d<=5,can:e=>e.r.cap>=1,need:'캡슐 1',cast(e){ e.r.cap--; CH.stern.dash(e); }},
   n2:{name:'삼연격',cd:8,r:3,cast(e){ const h=e.r.ab>now?6:12; for(let i=0;i<3;i++) after(i*.15,()=>{ if(e.dead) return; e.swingT=now; const hit=S.arc(e,3,h,'삼연격'); if(i===2&&hit.length&&e.r.ab<=now&&e.r.cap<5){ e.r.cap++; proc(e,'삼연격','캡슐 +1'); } }); }},
   aw:{name:'과다 복용',cd:30,r:6,can:e=>e.r.cap>=1,need:'캡슐',cast(e){ const t=e.r.cap*4; e.r.cap=0; e.r.od=now+t; add(e,'haste',t,.2); add(e,'resist',t,.1); }},
   ult:{name:'에스툼',cd:0,r:6,can:e=>e.r.odT>=60,need:'과다 복용 60초',cast(e){ e.r.ab=now+12; e.r.abAcc=0; add(e,'haste',12,.2); add(e,'dizzy',12,0,{self:true}); }}
  },note:'캡슐 0개로 시작한다. 삼연격의 범위는 카드에 없어 3칸으로 잡았다. 오남용 중에는 자기 화면이 울렁인다.'},
mor:{name:'짙어진 어둠, 모르',cls:'암살자',grade:'서사',range:2.2,
  init:e=>{e.r={sh:0,on:false,veil:0,dark:0,n:0}}, hud:e=>'그림자 '+Math.floor(e.r.sh)+(e.r.on?' · 숨음':'')+' · 망토 '+e.r.n+'/24',
  off(e){ if(e.r.on){ e.r.on=false; rm(e,'stealth'); } },
  tick(e,dt){ e.r.sh=Math.min(100,e.r.sh+10*dt*(e.r.dark>now?1.5:1)); if(e.r.on){ if(e.r.veil<=now) e.r.sh-=20*dt; if(e.r.sh<=0){ e.r.sh=0; CH.mor.off(e); } else if(!has(e,'stealth')) add(e,'stealth',9999); }
    if(e.r.veil&&e.r.veil<=now){ e.r.veil=0; e.r.sh=0; CH.mor.off(e); S.leap(e,moveDir(e),8); } },
  onDeal(e,t,amt,label,o){ if(!o||o.amp||t.dead||!(o.basic||o.skill)||!behind(e,t)) return; e.r.n++; proc(e,'그림자 망토','후방 추가 피해'); damage(e,t,9*(1+(e.r.veil>now?1:0)+(e.r.dark>now?1:0)),'그림자 망토',{amp:true}); },
  skills:{
   n1:{name:'그림자 숨기',cd:2,ai:(e,d)=>e.r.on?d>9:(e.r.sh>=60||e.r.veil>now)&&d<=10,can:e=>e.r.on||e.r.sh>=5||e.r.veil>now,need:'그림자 5',cast(e){ if(e.r.on){ CH.mor.off(e); return; } if(e.r.veil<=now) e.r.sh-=5; e.r.on=true; add(e,'stealth',9999); }},
   n2:{name:'그림자 밟기',cd:4,r:10,can:e=>e.r.sh>=40||e.r.veil>now,need:'그림자 40',cast(e){ if(e.r.veil<=now) e.r.sh-=40; if(e.r.on) e.cd.n2=2; S.proj(e,e.aim,{speed:24,range:11,dmg:0,label:'그림자 밟기',nohit:true,touch:t=>{ puff(e.x,e.y,'shadow',8,3); e.x=t.x-t.aim.x*1.1; e.y=t.y-t.aim.y*1.1; clamp(e); add(t,'flank',.7,0,{by:e}); }}); }},
   aw:{name:'밤의 장막',cd:45,r:9,cast(e){ e.r.veil=now+7; add(e,'haste',7,.2); }},
   ult:{name:'전야제',cd:0,r:9,can:e=>e.r.n>=24,need:'그림자 망토 24회',cast(e){ S.focus(e,1); after(1,()=>{ if(e.dead) return; S.circle(e,9,0,'전야제',{blind:7,v:'nova'}); e.r.sh=100; e.r.dark=now+7; }); }}
  },note:'상대는 늘 이쪽을 바라보므로, 후방 판정은 숨어 있는 동안 등 뒤로 돌아갔을 때와 그림자 밟기로 뒤에 선 직후 0.7초에 난다. 그림자 숨기는 다시 누르면 풀린다.'},
tyrfing:{name:'검붉은 파멸, 티르빙',cls:'암살자',grade:'서사',range:2.3,
  init:e=>{e.r={bn:0,sk:false,spent:0,zn:null,er:0}}, hud:e=>(e.r.er>now?'침식 · ':'')+'소모한 체력 '+Math.floor(e.r.spent)+'/300',
  m:e=>e.r.er>now?1.5:1,
  cost(e,n){ if(e.r.er>now) n+=20; if(n>0){ pay(e,n); e.r.spent+=n; } },
  onCast(e,s){ if(s!=='crouch') e.r.sk=true; },
  basicBonus(e,t){ e.r.bn++; if(!(e.r.sk||e.r.bn%3===0)) return; e.r.sk=false; proc(e,'혈검','+12 · 도약'); S.leap(e,e.aim,2,18,null,true); damage(e,t,12,'혈검',{skill:true}); const z=e.r.zn; if(z&&z.until>now&&Math.hypot(t.x-z.x,t.y-z.y)<=z.r) heal(e,12*CH.tyrfing.m(e)); },
  skills:{
   n1:{name:'광화',cd:8,r:5,cast(e){ const m=CH.tyrfing.m(e); CH.tyrfing.cost(e,0); add(e,'haste',3,.2*m); after(3,()=>{ if(!e.dead) S.circle(e,3,16*m,'광화',{v:'burst'}); }); }},
   n2:{name:'혈투',cd:14,ai:(e,d)=>d>3.5&&d<=8&&e.hp>60,cast(e){ const m=CH.tyrfing.m(e); CH.tyrfing.cost(e,20); S.leap(e,moveDir(e),6*m,22); add(e,'resist',4,.2*m); }},
   aw:{name:'적멸 마검',cd:30,ai:(e,d)=>d<=7&&e.hp>e.max*.6,cast(e){ const m=CH.tyrfing.m(e); CH.tyrfing.cost(e,80); const p=spot(e,7,5); fx.push({k:'circle',x:p.x,y:p.y,r:1.5,t0:now,team:e.team,lab:'적멸 마검',src:e,v:'blade'});
        e.r.zn=zone(e,{x:p.x,y:p.y,r:7,dur:10,every:.25,label:'혈계',tick:(z,inn)=>inn.forEach(t=>{ add(t,'slow',.35,.2*m,{by:e}); rm(t,'vuln'); add(t,'vuln',.35,.1*m,{by:e}); })}); }},
   ult:{name:'침식화',cd:0,r:7,can:e=>e.r.spent>=300,need:'스킬로 소모한 체력 300',cast(e){ e.r.er=now+9; zone(e,{x:e.x,y:e.y,r:7,dur:9,every:1,label:'침식',tick:(z,inn)=>inn.forEach(t=>{ damage(e,t,4,'침식'); add(t,'healcut',1.1,0,{by:e}); })}); }}
  },note:'적멸 마검은 7칸 안의 적이 선 자리에 떨어진다. 침식 중에는 모든 스킬이 체력 20을 더 쓰고 수치가 1.5배가 된다.'},
rias:{name:'피의 살인마, 리아스',cls:'암살자',grade:'서사',range:2.2,
  init:e=>{e.r={bl:0,ut:0,un:0}}, hud:e=>'출혈 피해 '+Math.floor(e.r.bl)+'/180'+(e.r.ut>now?' · 살귀 '+e.r.un:''),
  bleed(e,t,total,dur){ dot(e,t,total,dur,'출혈'); },
  onBasic(e,hit){ hit.forEach(t=>{ rm(t,'wound'); add(t,'wound',3,0,{by:e}); }); },
  basicBonus(e,t){ if(e.r.ut>now){ e.r.un++; damage(e,t,4,'암혈 살귀 (추가 피해)'); } },
  onDeal(e,t,amt,label){ if(label==='출혈'){ e.r.bl+=amt; heal(e,amt,true); } },
  tick(e){ if(e.r.ut&&e.r.ut<=now){ e.r.ut=0; heal(e,e.r.un*5); for(let i=0;i<5;i++) after(i*.12,()=>{ if(!e.dead) S.circle(e,5,4,'암혈 살귀 (피바람)',{air:i?0:1,knock:i?0:1.5,v:'vortex',post:t=>{ if(has(t,'wound')) CH.rias.bleed(e,t,15,5); }}); }); } },
  skills:{
   n1:{name:'혈우',cd:8,r:3,can:e=>foes(e).some(t=>has(t,'wound')&&dist(e,t)<=3+R),need:'상처 입은 적 (3칸)',cast(e){ const t=foes(e).find(x=>has(x,'wound')&&dist(e,x)<=3+R); if(!t) return; for(let i=0;i<4;i++) after(i*.08,()=>{ if(!e.dead&&!t.dead){ e.swingT=now; strike(e,t,4,'혈우'); } }); after(.35,()=>{ if(e.dead||t.dead) return; CH.rias.bleed(e,t,12,3); after(3,()=>{ if(!e.dead) add(e,'haste',1,.2); }); }); }},
   n2:{name:'톱날',cd:12,r:10,cast(e){ S.proj(e,e.aim,{speed:22,range:12,dmg:14,label:'톱날',o:{pre:t=>{ if(has(t,'wound')) CH.rias.bleed(e,t,16,4); }}}); }},
   aw:{name:'살육의 밤',cd:30,ai:(e,d)=>d>2&&d<=7&&e.hp>120,cast(e){ pay(e,70); S.leap(e,moveDir(e),6,22,()=>{ let first=true; for(let i=0;i<8;i++) after(i*.07,()=>{ if(!e.dead) S.circle(e,3,5,'살육의 밤',{v:'spin',post:t=>{ if(first){ first=false; add(t,'noheal',5,0,{by:e}); if(has(t,'wound')) CH.rias.bleed(e,t,30,3); } }}); }); }); }},
   ult:{name:'암혈 살귀',cd:0,r:4,ai:(e,d)=>d<=4&&e.hp>150,can:e=>e.r.bl>=180,need:'출혈 피해 180',cast(e){ pay(e,100); e.r.ut=now+6; e.r.un=0; }}
  },note:'출혈로 준 피해만큼 회복한다. 암혈 살귀의 피바람은 5타가 4씩(합 20)이고 첫 타에 띄우며 밀친다.'}
});
