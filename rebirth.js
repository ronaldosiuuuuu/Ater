"use strict";
/* 재림 카드. 키는 '원래 키_r'. 재림 카드에는 궁극기가 없다. 겉모습은 원래 캐릭터 것을 쓴다. */
function RB(base,o){ const b=CH[base]; CH[base+'_r']=Object.assign({cls:b.cls,grade:b.grade,range:b.range,re:true,base},o); LOOK[base+'_r']=Object.assign({},LOOK[base]); const c=CH[base+'_r'],cl=CLASSES[c.cls]; c.hp=cl.hp; c.atk=cl.atk; c.key=base+'_r'; }
const stat3=['slow','root','silence','stun','weak','freeze','blind','vuln'];

RB('castor',{name:'멸화의 잔향, 카스토르',
  init:e=>{e.r={nb:0}}, hud:e=>(e.hp<=e.max/2?'열광(강화) · ':'')+(e.r.nb>now?'다음 기본 공격 +6':'열광'),
  onSkillHit(e){ e.r.nb=now+3; }, basicBonus(e,t){ if(e.r.nb>now){ e.r.nb=0; damage(e,t,6,'열광'); } },
  skills:{
   n1:{name:'대분화',cd:8,r:3.2,cast(e){ const E=e.hp<=e.max/2; S.arc(e,3,10,'대분화',{el:'fire'}); after(.18,()=>{ if(e.dead) return; hop(e,4); S.line(e,3,10,'대분화 (올려베기)',{air:3,v:'thrust',el:'fire',post:t=>{ if(E){ near(e,t); after(.35,()=>{ if(!e.dead&&!t.dead&&down(t)) damage(e,t,0.01,'대분화 (내리꽂기)'); e.z=0; e.vz=0; }); } }}); }); }},
   n2:{name:'화천격',cd:12,r:4.5,cast(e){ const E=e.hp<=e.max/2; S.circle(e,3,12,'화천격',{v:'spin',el:'fire'}); after(.2,()=>{ if(!e.dead) S.leap(e,moveDir(e),2,18,()=>S.circle(e,3,16,'화천격 (도약)',{v:'spin',el:'fire',air:E?4:0,post:()=>{ if(E) hop(e,4); }}),true); }); }},
   aw:{name:'멸성화추',cd:45,r:8,cast(e){ const E=e.hp<=e.max/2,p=spot(e,8,4); fx.push({k:'circle',x:p.x,y:p.y,r:5,t0:now,team:e.team,dur:.5,lab:'멸성화추',src:e}); after(.5,()=>{ if(e.dead) return; e.x=p.x; e.y=p.y; clamp(e); S.circle(e,5,35,'멸성화추',{stun:1,v:'blade',el:'fire'}); if(E) after(.3,()=>{ if(!e.dead) S.circle(e,5,30,'멸성화추 (강화)',{air:4,v:'spin',el:'hell'}); }); }); }}
  },note:'멸성화추는 8칸 안의 적이 선 자리(없으면 4칸 앞)에 0.5초 뒤 내리꽂힌다.'});
RB('mimosa',{name:'황천의 해연, 미모사',
  init:e=>{e.r={n:0,bn:0,awT:0,awN:0}}, hud:e=>'극우 '+e.r.n+(e.r.awT>now?' · 탄우 '+e.r.awN:'')+(e.r.bn>now?' · 실명탄':''),
  onSkillHit(e,t,label){ if(label==='극우'||t.dead) return; const d=dist(e,t); e.r.n++; damage(e,t,4*d/12,'극우'); if(e.r.n%3===0) add(t,'slow',1,.44,{by:e}); },
  skills:{
   n1:{name:'벽해',cd:8,r:13,cast(e){ const F=e.r.awT>now&&e.r.awN>0; if(F){ e.r.awN--; e.cd.n1=.25; } const B=e.r.bn>now; if(B) e.r.bn=0; S.focus(e,.4); after(.4,()=>{ if(!e.dead) S.proj(e,e.aim,{speed:24,range:F?36:18,dmg:8,label:'벽해',pierce:F,ghost:F,o:{knock:.5,blind:B?2:0,post:t=>dot(e,t,8,2,'벽해 (지속)')}}); }); }},
   n2:{name:'심해벽',cd:16,ai:(e,d)=>d<5,cast(e){ const p=front(e,3),h=Math.abs(e.aim.x)>Math.abs(e.aim.y); wall(e,p.x,p.y,h?1:7,h?7:1,8); e.r.bn=now+4; }},
   aw:{name:'황천 탄우',cd:45,r:20,cast(e){ const t=foes(e).filter(x=>dist(e,x)<=20).sort((a,b)=>dist(e,b)-dist(e,a))[0]; if(t) add(t,'glow',8,0,{by:e}); e.r.awT=now+8; e.r.awN=6; e.cd.n1=0; }}
  },note:'극우는 거리 12칸당 4 피해(가까우면 그만큼 적다)이고, 세 번째마다 둔화가 붙는다.'});
RB('plaus',{name:'개벽의 세계수, 플라우스',
  init:e=>{e.r={ji:0,form:false,acc:0}}, hud:e=>'지력 '+Math.floor(e.r.ji)+(e.r.form?' · 맥동':''),
  speedMod:e=>e.r.form?1.25:1,
  tick(e,dt){ if(e.r.form){ e.r.ji=Math.min(100,e.r.ji+10*dt); e.r.acc+=dt; if(e.r.acc>=1){ e.r.acc-=1; heal(e,1.5,true); } } },
  skills:{
   crouch:{name:'맥동',cd:.3,ai:e=>!e.r.form,cast(e){ e.r.form=!e.r.form; }},
   n1:{name:'정령수',cd:3,r:12,can:e=>e.r.ji>=30,need:'지력 30',cast(e){ e.r.ji-=30; S.proj(e,e.aim,{speed:20,range:14,dmg:15,label:'정령수',v:'leaf',o:{air:1,post:t=>{ rm(t,'spirit'); add(t,'spirit',3); }}}); }},
   n2:{name:'지맥',cd:7,r:4,can:e=>e.r.ji>=40&&e.z<.05,need:'지력 40 · 지상',cast(e){ e.r.ji-=40; S.circle(e,4,25,'지맥',{v:'quake',post:t=>{ if(has(t,'spirit')){ damage(e,t,8,'지맥 (정령)'); add(t,'root',1,0,{by:e}); } }}); }},
   aw:{name:'세계 지탱',cd:45,r:5,can:e=>e.r.ji>=20&&e.z<.05,need:'지력 · 지상',cast(e){ const u=e.r.ji; e.r.ji=0; S.focus(e,1); after(1,()=>{ if(e.dead) return; const hit=S.circle(e,5,0,'세계 지탱',{air:3,root:1,v:'bloom'}); after(.5,()=>hit.forEach(t=>{ if(!e.dead&&!t.dead) S.circle(e,3,x=>u/2*(has(x,'spirit')?2:1),'세계 지탱 (나무 창)',{v:'blade',zfree:true},{x:t.x,y:t.y,z:0}); })); }); }}
  },note:'맥동은 웅크리기 단추로 켜고 끈다(켜 둔 동안 기동력 25% 증가).'});
RB('ginan',{name:'엘리아의 성주, 기난',
  init:e=>{e.r={zn:null,scd:0,mk:0,hb:0,div:0}}, hud:e=>'성흔 '+e.r.mk+'/5'+(CH.ginan_r.inn(e)?' · 성역 안':'')+(e.r.div>now?' · 신격화':''),
  inn:e=>!!e.r.zn&&e.r.zn.until>now&&Math.hypot(e.x-e.r.zn.x,e.y-e.r.zn.y)<=5,
  open(e,dur,chase){ if(e.r.zn) e.r.zn.until=now; e.r.zn=zone(e,{x:e.x,y:e.y,r:5,dur,every:.25,label:'성역',chase:chase?e:null,speed:99,tick:(z,inn)=>inn.forEach(t=>add(t,'slow',.35,.25,{by:e}))}); },
  tick(e,dt){ if(e.r.scd>0) e.r.scd-=dt; if(e.r.div&&e.r.div<=now){ e.r.div=0; const n=e.r.mk; e.r.mk=0; if(n>0) S.circle(e,5,0,'신조의 성가',{root:n/2,v:'burst'}); } },
  modTake:(e,src,amt)=>src!==e&&CH.ginan_r.inn(e)?amt*.9:amt,
  onHurt(e,src,amt,label,o){ if(o&&o.basic&&e.r.scd<=0){ e.r.scd=9; e.r.mk=Math.min(5,e.r.mk+1); proc(e,'성군','성흔 +1 · 성역'); if(e.r.div<=now) CH.ginan_r.open(e,4); } },
  basicBonus(e){ if(e.r.hb>now){ e.r.hb=0; heal(e,10); } },
  skills:{
   n1:{name:'집행',cd:7,r:5,can:e=>!!tgt(e,5),need:'5칸 안의 적',cast(e){ const t=tgt(e,5); near(t,e,1.1); say(t,'끌당','#f0b458'); e.r.hb=now+3; if(CH.ginan_r.inn(e)&&e.r.mk>0){ e.r.mk--; e.r.zn.until+=2; } }},
   n2:{name:'성호',cd:9,r:4,cast(e){ shield(e,24,2); S.circle(e,4,0,'성호',{root:.5,v:'nova'}); if(CH.ginan_r.inn(e)&&e.r.mk>0&&e.r.div<=now){ e.r.mk--; const left=e.r.zn.until-now; CH.ginan_r.open(e,left); } }},
   aw:{name:'신조의 성가',cd:45,r:5,cast(e){ const was=CH.ginan_r.inn(e); e.r.mk=5; e.r.div=now+6; add(e,'resist',6,.2); CH.ginan_r.open(e,6,true); if(was) S.circle(e,5,0,'신조의 성가',{air:2,stun:1,v:'burst'}); }}
  },note:'신격화 6초 동안은 성역이 자신을 따라다닌다. 끝날 때 남은 성흔의 절반(초)만큼 주변 적을 속박한다.'});
RB('ross',{name:'숙명의 기사, 로스',
  init:e=>{e.r={acc:0,adv:0}}, hud:e=>(e.r.adv>now?'진의 · ':'')+'무훈시',
  tick(e,dt){ if(!(inFight(e)||e.hp<=e.max*.3)) return; e.r.acc+=dt; if(e.r.acc>=5){ e.r.acc-=5; if(heal(e,5)>0) proc(e,'무훈시','체력 +5'); } },
  basicBonus(e,t){ if(e.r.adv>now){ e.r.adv=0; damage(e,t,12,'진의 (추가 피해)'); } },
  skills:{
   n1:{name:'진의',cd:10,r:3.5,cast(e){ shield(e,12,3); add(e,'haste',3,.1); e.r.adv=now+3; }},
   n2:{name:'기례',cd:10,ai:(e,d)=>d<=4&&hurtNow(e),cast(e){ shield(e,16,1); add(e,'resist',1,.2); }},
   aw:{name:'질서 정의',cd:45,r:4,cast(e){ const p=spot(e,4,3); fx.push({k:'circle',x:p.x,y:p.y,r:1,t0:now,team:e.team,dur:1.5,lab:'정의 집행',src:e,v:'judge'}); after(1.5,()=>{ if(!e.dead) S.circle(e,1,45,'질서 정의',{zfree:true,post:t=>damage(e,t,(t.max-t.hp)*.3,'질서 정의 (잃체비)')},p); }); }}
  },note:'질서 정의는 4칸 안의 적이 선 자리에 검을 꽂고, 1.5초 뒤 그 자리(반지름 1칸)에 있는 적만 맞는다.'});
RB('harmund',{name:'빙계의 백검, 하르문드',
  init:e=>{e.r={pcd:0,snow:0}}, hud:e=>(e.r.snow>now?'설백 · ':'')+'빙계 '+(e.r.pcd>0?e.r.pcd.toFixed(0)+'s':'준비'),
  tick(e,dt){ if(e.r.pcd>0) e.r.pcd-=dt; },
  onDeal(e,t,amt,label,o){ if(t.dead||(o&&o.amp)) return; if(o&&o.cold&&has(t,'bg')) damage(e,t,amt*.5,'빙계 (냉기 증폭)',{amp:true});
    if(e.r.pcd<=0&&o&&(o.basic||o.skill)&&t.st.some(s=>stat3.includes(s.k))){ e.r.pcd=12; proc(e,'빙계','쇠약 2초'); add(t,'weak',2,1,{by:e}); add(t,'bg',2,0,{by:e,end:()=>damage(e,t,5,'빙계',{amp:true})}); } },
  skills:{
   n1:{name:'백설화',cd:8,r:3,cast(e){ S.arc(e,3,6,'백설화'); S.arc(e,3,6,'백설화 (냉기)',{cold:true}); after(.2,()=>{ if(!e.dead) S.circle(e,3,12,'백설화 (냉기)',{cold:true,v:'nova'}); }); if(e.r.snow>now){ add(e,'haste',2,.2); add(e,'resist',2,.2); } }},
   n2:{name:'빙하추',cd:14,r:8,can:e=>!!tgt(e,8),need:'8칸 안의 적',cast(e){ const t=tgt(e,8),p={x:t.x,y:t.y,z:0},E=e.r.snow>now; fx.push({k:'circle',x:p.x,y:p.y,r:2.5,t0:now,team:e.team,dur:.5,lab:'빙하추',src:e}); after(.45,()=>{ if(!e.dead) S.circle(e,2.5,15,'빙하추',{v:'blade',post:x=>{ if(Math.hypot(x.x-p.x,x.y-p.y)<=1){ add(x,'root',1,0,{by:e}); damage(e,x,15,'빙하추 (정중앙)',{cold:true,skill:true}); } if(E) e.r.pcd=0; }},p); }); }},
   aw:{name:'백빙 화계',cd:45,r:8,cast(e){ e.r.snow=now+5; add(e,'stealth',5); zone(e,{x:e.x,y:e.y,r:2,dur:5,every:1,chase:tgt(e,99),speed:4.5,label:'빙화',tick:(z,inn)=>inn.forEach(x=>{ damage(e,x,15,'백빙 화계',{cold:true,skill:true}); add(x,'silence',1,0,{by:e}); })}); }}
  },note:'빙하추는 8칸 안의 적이 선 자리에 0.45초 뒤 떨어진다. 빙화는 초당 4.5칸으로 적을 따라간다.'});
RB('breck',{name:'역병의 주술사, 브렉',range:7,
  init:e=>{e.r={ju:0,amp:false}}, hud:e=>'주술 '+Math.floor(e.r.ju)+(e.r.amp?' · 증폭':''),
  tick(e,dt){ if(inFight(e)) e.r.ju=Math.min(100,e.r.ju+2*dt); if(e.r.amp){ e.r.ju-=3*dt; if(e.r.ju<=0){ e.r.ju=0; e.r.amp=false; } } foes(e).forEach(t=>{ const s=has(t,'sick'); if(s) s.v=(e.r.amp&&dist(e,t)<=7+R)?2:1; }); },
  sick(e,t,d){ rm(t,'sick'); add(t,'sick',d,1,{by:e}); },
  skills:{
   crouch:{name:'역병술',cd:.3,ai:e=>!e.r.amp&&e.r.ju>40&&foes(e).some(t=>has(t,'sick')),cast(e){ e.r.amp=!e.r.amp; }},
   n1:{name:'부패인형',cd:8,r:8,can:e=>!!tgt(e,8),need:'8칸 안의 적',cast(e){ const t=tgt(e,8); S.circle(e,2,10,'부패인형',{v:'hex',post:x=>{ if(has(x,'sick')&&e.r.ju>=6){ e.r.ju-=6; add(x,'blind',2,0,{by:e}); dot(e,x,2,2,'위더'); } }},{x:t.x,y:t.y,z:0}); }},
   n2:{name:'예속용 칼',cd:12,r:11,can:e=>e.r.ju>=10,need:'주술 10',cast(e){ e.r.ju-=10; for(let i=0;i<3;i++) after(i*.12,()=>{ if(!e.dead) S.proj(e,e.aim,{speed:22,range:14,dmg:6,label:'예속용 칼',v:'knife',o:{post:t=>CH.breck_r.sick(e,t,5)}}); }); }},
   aw:{name:'사백사병',kind:'초월',cd:60,r:11,cast(e){ S.proj(e,e.aim,{speed:18,range:14,dmg:0,label:'사백사병',big:true,nohit:true,v:'skull',touch:t=>{ for(let i=0;i<10;i++) after(i,()=>{ if(e.dead||t.dead||e.r.ju<4) return; e.r.ju-=4; add(t,'slow',1.05,Math.min(.8,.3+.05*i),{by:e});
          if(i%3===2) foes(e).forEach(x=>{ if(Math.hypot(x.x-t.x,x.y-t.y)<=3+R){ add(x,'weak',3,1,{by:e}); CH.breck_r.sick(e,x,3); } }); }); }}); }}
  },note:"'위더'는 2초 동안 초당 1 피해, '극심한 피로'는 쇠약 3초로 넣었다. 사백사병은 주술이 4 밑으로 떨어지면 끊긴다."});

/* ───── 서사 재림 1 ───── */
RB('manannan',{name:'제살검제, 마나난',
  init:e=>{e.r={sim:0}; zone(e,{x:e.x,y:e.y,r:7,dur:1e9,chase:e,speed:99,hid:true,onCast:(z,who,slot)=>{ if(who.team!==e.team&&!who.dead){ rm(who,'gz'); add(who,'gz',.5,0,{by:e}); } }}); }, hud:e=>'심검 '+e.r.sim,
  gz:(e,t)=>{ const s=has(t,'gz'); return !!s&&s.by===e; },
  onDeal(e,t,amt,label,o){ const s=has(t,'gz'); if(!s||s.by!==e||s.used||(o&&o.amp)) return; s.used=true; e.r.sim++; proc(e,'관조','심검 '+e.r.sim); const k=label.startsWith('제왕검')?'n1':label.startsWith('암검')?'n2':label.startsWith('인살')?'aw':null; if(k) e.cd[k]*=.5; },
  skills:{
   n1:{name:'제왕검',cd:8,r:3,cast(e){ const G2=foes(e).filter(t=>CH.manannan_r.gz(e,t)); S.arc(e,3,8,'제왕검'); after(.15,()=>{ if(!e.dead) S.circle(e,3,10,'제왕검',{v:'spin'}); }); if(G2.length) after(.3,()=>{ if(!e.dead) S.line(e,3,14,'제왕검 (관조)',{v:'cut'}); }); }},
   n2:{name:'암검',cd:12,ai:(e,d)=>d>2.5&&d<=6,cast(e){ const G2=foes(e).filter(t=>CH.manannan_r.gz(e,t)),dir=moveDir(e),p0=S.blink(e,dir,4),hit=S.seg(e,p0,{x:e.x,y:e.y},1.4,12,'암검',{v:'dash'}); if(hit.some(t=>G2.includes(t))) after(.15,()=>{ if(e.dead) return; const p1=S.blink(e,dir,6); S.seg(e,p1,{x:e.x,y:e.y},1.4,18,'암검 (관조)',{v:'dash'}); }); }},
   aw:{name:'인살의 검',cd:45,r:9,can:e=>!!tgt(e,10),need:'10칸 안의 적',cast(e){ const t=tgt(e,10); S.leap(e,norm(t.x-e.x,t.y-e.y),Math.min(8,Math.max(0,dist(e,t)-1.5)),30,()=>{ if(t.dead) return; air(t,7); after(.3,()=>{ if(e.dead||t.dead) return; near(e,t); e.z=t.z; e.vz=t.vz;
        add(t,'silence',1.25,0,{by:e,end:()=>{ if(e.dead||t.dead) return; const n=e.r.sim; damage(e,t,6*n,'인살의 검 (6 x 심검)',{skill:true}); if(n>=5&&!t.dead) damage(e,t,20,'인살의 검 (마무리)',{skill:true}); if(n>=10) e.cd.aw=Math.max(0,e.cd.aw-15); if(n>=20){ e.r.sim=0; if(!t.dead&&t.hp<=t.max*.2) damage(e,t,t.hp+999,'인살의 검 (처형)',{fixed:true,amp:true}); } }}); }); },true); }}
  },note:'7칸 안의 적이 스킬을 쓰면 0.5초 동안 관조한다. 관조 한 번에 심검은 한 번만 쌓인다.'});
RB('nertina',{name:'신궁, 네르티나',
  init:e=>{e.r={ar:0,acc:0,sg:0,ys:0}}, hud:e=>'화살 '+e.r.ar+'/12'+(e.r.sg>now?' · 신궁 · 영사 '+e.r.ys:''),
  tick(e,dt){ e.r.acc+=dt; if(e.r.acc>=3){ e.r.acc-=3; e.r.ar=Math.min(12,e.r.ar+1); } if(e.r.sg&&e.r.sg<=now){ e.r.sg=0; const n=e.r.ys; e.r.ys=0; for(let i=0;i<n;i++) after(i*.07,()=>{ if(!e.dead){ const a=Math.atan2(e.aim.y,e.aim.x)+(Math.random()-.5)*.3; S.proj(e,{x:Math.cos(a),y:Math.sin(a)},{dmg:5,label:'궁신 탄영 (난사)',v:'arrow'}); } }); } },
  onSkillHit(e,t){ if(has(t,'nmk')) e.r.ar=Math.min(12,e.r.ar+1); rm(t,'nmk'); add(t,'nmk',2,0,{by:e}); },
  skills:{
   n1:{name:'일사',cd:1.5,r:14,can:e=>e.r.ar>=1,need:'화살 1',cast(e){ e.r.ar--; S.proj(e,e.aim,{dmg:t=>14+(has(t,'nmk')?8:0),label:'일사',v:'arrow'}); }},
   n2:{name:'섬사',cd:6,ai:(e,d)=>d<=6,can:e=>e.r.ar>=3,need:'화살 3',cast(e){ e.r.ar-=3; S.leap(e,moveDir(e),6,22,()=>{ for(let i=0;i<3;i++) after(i*.1,()=>{ if(!e.dead) S.proj(e,e.aim,{dmg:9,label:'섬사',v:'arrow',o:{knock:.7,pre:t=>{ if(has(t,'nmk')) add(t,'slow',1,.25,{by:e}); }}}); }); }); }},
   aw:{name:'궁신 탄영',kind:'초월',cd:60,r:99,can:e=>e.r.ar===12,need:'화살 12',cast(e){ add(e,'haste',6,.2); e.r.sg=now+6; e.r.ys=0; }},
   crouch:{name:'신궁 사격',cd:.3,can:e=>e.r.sg>now&&e.r.ar>0,need:'신궁 중',ai:(e,d)=>d<=14,cast(e){ e.r.ar--; S.proj(e,e.aim,{dmg:10,label:'궁신 탄영',v:'arrow',o:{pre:t=>{ if(has(t,'nmk')&&e.r.ys<20) e.r.ys++; }}}); e.x-=e.aim.x; e.y-=e.aim.y; clamp(e); }}
  },note:'화살 0개로 시작한다. 신궁 중 사격은 웅크리기 단추.'});
RB('roven',{name:'백록의 연화검, 로벤',
  init:e=>{e.r={b:0,n:0,aw:0,lastHit:null}}, hud:e=>'백연 '+e.r.b+' · 녹궁 '+e.r.n,
  onBasic(e,hit){ if(hit.length) e.r.b=Math.min(20,e.r.b+2); }, onSkillHit(e){ e.r.n=Math.min(20,e.r.n+6); },
  skills:{
   n1:{name:'녹명조',cd:4,r:4.5,can:e=>e.r.b>=5,need:'백연 5',cast(e){ if(e.r.b!==10) e.r.b-=5; S.leap(e,moveDir(e),2,18,()=>S.line(e,4,7,'녹명조',{el:'nature',v:'cut'}),true); after(1.1,()=>{ if(!e.dead) S.circle(e,3,10,'녹명조 (백의검)',{el:'steel',v:'spin'}); }); }},
   n2:{name:'백도각',cd:8,r:5,can:e=>e.r.n>=10,need:'녹궁 10',cast(e){ if(e.r.n!==10) e.r.n-=10; S.arc(e,4,14,'백도각',{el:'nature'}); S.leap(e,e.aim,3,20,()=>{ hop(e,3); after(airtime(3),()=>{ if(!e.dead) S.circle(e,4,18,'백도각 (백의검)',{el:'steel',v:'quake',zfree:true}); }); },true); }},
   aw:{name:'연록 백화검',kind:'초월',cd:60,r:4,can:e=>e.r.b===10&&e.r.n===10,need:'백연 10 · 녹궁 10',cast(e){ e.r.b=0; e.r.n=0; e.r.aw=now+10; const st=[false,false];
        for(let i=1;i<=10;i++) after(i,()=>{ if(e.dead) return; const w=i&1,h=w?S.circle(e,4,10,'연록 백화검 (백의검)',{el:'steel',v:'spin'}):S.line(e,4,10,'연록 백화검 (녹초검)',{el:'nature',v:'cut'}); if(h.length&&st[w]){ st[w]=false; h.forEach(t=>{ if(!t.dead) damage(e,t,10,'연록 백화검 (추가 피해)'); }); S.leap(e,e.aim,4,22,null,true); proc(e,'연록 백화검','+10 · 돌진'); } else st[w]=h.length>0; }); }}
  },note:"백연이나 녹궁이 정확히 10이면 그 자원을 쓰지 않는다. '같은 색 연속 2번 타격'은 같은 색 검의 차례가 두 번 잇달아 맞은 것으로 읽었다."});
RB('baron',{name:'격동하는 창, 바론',
  init:e=>{e.r={nx:false,duel:null,dt:0}}, hud:e=>(e.r.nx?'연격섬 준비':'연격섬'),
  dl:(e,t)=>e.r.duel===t&&e.r.dt>now,
  onCast(e,s){ if(s!=='crouch') e.r.nx=true; },
  altBasic(e){ if(!e.r.nx) return false; if(e.cd.b>0) return true; e.cd.b=CFG.atkInt; e.r.nx=false; e.swingT=now; swingSnd(e); let cut=false; const dd=t=>{ if(!cut&&CH.baron_r.dl(e,t)){ cut=true; e.cd.n1=Math.max(0,e.cd.n1-2); } };
    S.line(e,4,9,'연격섬 (올려치기)',{basic:true,air:1,v:'thrust',post:dd}); after(.28,()=>{ if(!e.dead){ e.swingT=now; S.line(e,4,12,'연격섬 (내려치기)',{basic:true,zfree:true,v:'cut',post:t=>{ down(t); dd(t); }}); } }); return true; },
  skills:{
   n1:{name:'격섬',cd:9,r:5,cast(e){ for(let i=0;i<2;i++) after(i*.12,()=>{ if(!e.dead) S.line(e,5,7,'격섬',{v:'thrust',post:t=>{ e.r.duel=t; e.r.dt=now+4; }}); }); }},
   n2:{name:'차륜',cd:12,r:4,cast(e){ let mv=null; S.circle(e,4,14,'차륜',{v:'spin',post:t=>{ if(CH.baron_r.dl(e,t)) mv=t; }}); after(.2,()=>{ if(e.dead) return; if(mv&&!mv.dead) near(e,mv); S.circle(e,4,14,'차륜 (재회전)',{knock:1.5,v:'spin'}); }); }},
   aw:{name:'천공 돌파',cd:45,ai:(e,d)=>d>2&&d<=10,cast(e){ const p0={x:e.x,y:e.y}; S.leap(e,e.aim,6,26,()=>{ S.seg(e,p0,{x:e.x,y:e.y},1.4,30,'천공 돌파',{v:'thrust'}); S.focus(e,.5); after(.5,()=>{ if(e.dead) return; const p1=S.blink(e,e.aim,10); S.seg(e,p1,{x:e.x,y:e.y},1.4,40,'천공 돌파 (관통)',{zfree:true,v:'dash',post:t=>down(t)}); }); },true); }}
  },note:'스킬을 쓴 뒤 다음 기본기 단추가 연격섬(올려치기 9, 잠시 뒤 내려치기 12)이다.'});
RB('euclein',{name:'파도검제, 유클라인',
  init:e=>{e.r={}}, hud:()=>'격파랑',
  tick(e){ const t=foes(e).filter(x=>dist(e,x)<=10)[0]; foes(e).forEach(x=>{ const s=has(x,'surge'); if(s&&s.by===e&&x!==t) rm(x,'surge'); }); if(t){ rm(t,'surge'); add(t,'surge',.4,0,{by:e}); } },
  sg:(e,t)=>{ const s=has(t,'surge'); return !!s&&s.by===e; },
  modTake(e,src,amt){ return src!==e&&!CH.euclein_r.sg(e,src)?amt*.75:amt; },
  onSkillHit(e,t,label){ if(label!=='격파랑'&&CH.euclein_r.sg(e,t)) after(1,()=>{ if(!e.dead) S.circle(e,5,12,'격파랑',{v:'geyser',post:x=>add(x,'weak',2,1,{by:e})}); }); },
  skills:{
   n1:{name:'파검세',cd:8,r:4,cast(e){ const p={x:e.x,y:e.y,z:0}; S.circle(e,4,8,'파검세',{v:'spin'}); after(.75,()=>{ if(!e.dead) S.circle(e,4,10,'파검세 (파도)',{v:'geyser',post:t=>{ if(CH.euclein_r.sg(e,t)) add(t,'silence',.5,0,{by:e}); }},p); }); }},
   n2:{name:'파도잡이',cd:12,ai:(e,d)=>d>2.5&&d<=6.5,cast(e){ const p0={x:e.x,y:e.y}; S.leap(e,moveDir(e),6,24,()=>{ const p1={x:e.x,y:e.y}; S.seg(e,p0,p1,1.4,10,'파도잡이',{v:'dash'}); after(.75,()=>{ if(!e.dead) S.seg(e,p0,p1,1.8,11,'파도잡이 (파도)',{v:'beam',post:t=>{ if(CH.euclein_r.sg(e,t)) e.cd.n1=0; }}); }); },true); }},
   aw:{name:'망망 대해',cd:45,r:5,cast(e){ hop(e,4); S.circle(e,5,15,'망망 대해',{v:'geyser',post:t=>{ if(!CH.euclein_r.sg(e,t)){ knock(t,e,3); add(t,'silence',1,0,{by:e}); } }}); after(1,()=>{ if(!e.dead) S.circle(e,7,25,'망망 대해 (파랑)',{zfree:true,v:'vortex',post:t=>{ if(CH.euclein_r.sg(e,t)){ near(t,e,1.2); shield(e,40,5); } }}); }); }}
  },note:'격파랑은 10칸 안의 가장 가까운 적 하나에게 붙는다.'});
RB('hamel',{name:'마의 대적자, 하멜',
  init:e=>{e.r={pcd:0}}, hud:e=>'마력저항 '+(e.r.pcd>0?e.r.pcd.toFixed(0)+'s':'준비'),
  tick(e,dt){ if(e.r.pcd>0) e.r.pcd-=dt; },
  onHurt(e,src,amt,label,o){ if(!(o&&o.skill)) return; if(e.r.pcd<=0){ e.r.pcd=12; proc(e,'마력저항','보호막 20'); shield(e,20,3); } else e.r.pcd=Math.max(0,e.r.pcd-1); },
  skills:{
   n1:{name:'성화',cd:8,ai:(e,d)=>e.st.some(s=>DEBUFFS.includes(s.k)&&!s.self)||e.hp<e.max*.7,cast(e){ S.leap(e,moveDir(e),3,20); after(.5,()=>{ if(e.dead) return; cleanse(e); heal(e,(e.max-e.hp)*.08); }); }},
   n2:{name:'멸마',cd:12,r:4,cast(e){ if(e.sh.length) heal(e,20); else shield(e,20,2); S.circle(e,4,0,'멸마',{silence:2,v:'hex'}); }},
   aw:{name:'마력 배제',kind:'초월',cd:60,r:7,cast(e){ const p={x:e.x,y:e.y,z:0},born=now; for(let i=0;i<3;i++) after(i*.15,()=>{ if(!e.dead) S.circle(e,7,10,'마력 배제',{v:'blade'},p); }); zone(e,{x:p.x,y:p.y,r:7,dur:10,label:'멸지',onCast:(z,who)=>{ if(now-born<.6) return; damage(e,who,15,'마력 배제 (멸지)',{fixed:true}); for(const k in who.cd) if(k!=='b'&&k!=='crouch') who.cd[k]+=2; say(who,'멸지','#d7a6ff'); }}); }}
  },note:"멸마의 침묵 범위는 카드에 없어 4칸으로 잡았다. '멸지' 안에서는 하멜 자신도 스킬을 쓰면 15 피해를 받는다."});
RB('dantalion',{name:'불휘의 철극, 단탈리온',
  init:e=>{e.r={ft:0,pcd:0,pn:0,wt:0,wn:0,aw:0,army:0}}, hud:e=>'불휘 '+e.r.pn+'/4'+(e.r.army>now?' · 철진':''),
  army(e){ e.r.army=now+6; proc(e,'격진 철성','철진 6초'); let n=0; zone(e,{x:e.x,y:e.y,r:4,dur:6,every:.25,chase:e,speed:99,label:'철진',tick:(z,inn)=>{ n++; inn.forEach(t=>{ add(t,'slow',.35,.2,{by:e}); if(n%4===0) add(t,'stun',.3,0,{by:e}); }); }}); },
  tick(e,dt){ if(e.r.pcd>0){ e.r.pcd-=dt; return; } e.r.ft=inFight(e)?e.r.ft+dt:0; if(e.r.ft>=4){ e.r.ft=0; const big=++e.r.pn>=4; proc(e,'불휘',big?'끌어당김':'당김 · 보호막 12'); fx.push({k:'circle',x:e.x,y:e.y,r:5,t0:now,team:e.team,lab:'불휘',src:e,v:'vortex'}); foes(e).forEach(t=>{ if(dist(e,t)<=5+R){ if(big) near(t,e,1.1); else knock(t,e,-1); } }); shield(e,12,2); if(big){ e.r.pn=0; e.r.pcd=30; } } },
  modTake(e,src,amt){ if(src!==e&&e.r.aw>now&&e.sh.length&&amt>=e.sh.reduce((s,x)=>s+x.v,0)){ e.r.aw=0; e.sh=[]; say(e,'무시','#cfd8ea'); CH.dantalion_r.army(e); return 0; } return amt; },
  onHurt(e){ if(e.r.wt>now&&e.r.wn<4){ e.r.wn++; shield(e,6,1); } },
  skills:{
   n1:{name:'격철',cd:7,r:4,cast(e){ S.line(e,4,14,'격철',{root:.6,v:'thrust'}); }},
   n2:{name:'갑철',cd:14,ai:(e,d)=>d<=5&&hurtNow(e),cast(e){ add(e,'resist',3,.15); e.r.wt=now+3; e.r.wn=0; }},
   aw:{name:'격진 철성',cd:45,r:4.5,cast(e){ shield(e,40,4); e.r.aw=now+4; }}
  },note:'격진 철성은 4초 안에 보호막이 깨질 만큼의 피해를 받으면 그 피해를 통째로 무시하고 철진에 들어간다.'});
RB('salomon',{name:'깨닫게 된 자, 살로몬',
  init:e=>{e.r={mp:0,plus:0,zn:null,zt:0}}, hud:e=>'마나 '+Math.floor(e.r.mp)+' (+'+(5+e.r.plus)+'/초)',
  tick(e,dt){ e.r.mp=Math.min(100,e.r.mp+(5+e.r.plus)*dt); const z=e.r.zn; if(z&&z.until>now){ e.r.mp-=20*dt; z.r=Math.min(8,5+(now-e.r.zt)); z.x=e.x; z.y=e.y; if(e.r.mp<=0){ e.r.mp=0; z.until=now; e.r.zn=null; } } else e.r.zn=null; },
  onSkillHit(e){ if(e.r.plus>=15) e.r.mp=Math.min(100,e.r.mp+5); else e.r.plus++; },
  skills:{
   n1:{name:'아크',cd:3,r:12,can:e=>e.r.mp>=35,need:'마나 35',cast(e){ e.r.mp-=35; for(let i=0;i<2;i++) after(i*.12,()=>{ if(!e.dead) S.proj(e,e.aim,{speed:24,range:14,dmg:9,label:'아크',v:'orb'}); }); }},
   n2:{name:'호라이즌',cd:6,r:5,can:e=>e.r.mp>=80,need:'마나 80',cast(e){ e.r.mp-=80; for(let i=0;i<2;i++) after(i*.15,()=>{ if(!e.dead) S.arc(e,5,16,'호라이즌',{knock:i?2:0,v:'blast'}); }); }},
   aw:{name:'진리의 문',cd:45,r:6,can:e=>e.r.mp>=20,need:'마나 20',cast(e){ S.focus(e,1.5); after(1.5,()=>{ if(e.dead) return; e.r.zt=now; e.r.zn=zone(e,{x:e.x,y:e.y,r:5,dur:99,every:1,label:'마나 소멸',tick:(z,inn)=>inn.forEach(t=>strike(e,t,12,'진리의 문',{slow:[.3,1.1]}))}); }); }},
   crouch:{name:'마나 소멸 종료',cd:.3,can:e=>!!e.r.zn,need:'마나 소멸 중',ai:e=>e.r.mp<15,cast(e){ if(e.r.zn){ e.r.zn.until=now; e.r.zn=null; } }}
  },note:'마나 0으로 시작한다. 마나 소멸은 자신을 따라다니며 3초에 걸쳐 5칸에서 8칸으로 넓어진다. 웅크리기 단추로 끈다.'});
RB('barsa',{name:'폭정의 마녀, 바르사',
  init:e=>{e.r={hm:0,buff:false}}, hud:e=>'허망 '+e.r.hm+'/5'+(e.r.buff?' · 회화':''),
  onSkillHit(e,t,label){ if(label==='회화'||label==='제물'||t.dead) return; if(has(t,'offer')) damage(e,t,2,'제물',{amp:true}); if(e.r.buff){ e.r.buff=false; dot(e,t,6,2,'회화'); } if(++e.r.hm>=5){ e.r.hm=0; e.r.buff=true; proc(e,'회화','다음 스킬에 지속 피해'); } },
  skills:{
   n1:{name:'번제',cd:8,r:9,cast(e){ S.focus(e,.5); after(.5,()=>{ if(e.dead) return; const p=spot(e,9,4); for(let i=0;i<4;i++) after(i*.12,()=>{ if(!e.dead) S.circle(e,3,4,'번제',{v:'burst',post:()=>add(e,'haste',1,.1)},p); }); }); }},
   n2:{name:'맹화',cd:16,ai:(e,d)=>d<3.5||(d>5&&d<=9),cast(e){ const p0={x:e.x,y:e.y}; S.leap(e,moveDir(e),8,28,()=>{ const p1={x:e.x,y:e.y}; for(let i=0;i<3;i++) after(i*.07,()=>{ if(!e.dead) S.seg(e,p0,p1,1.4,10,'맹화',{v:'beam',post:t=>{ rm(t,'offer'); add(t,'offer',8,0,{by:e}); }}); }); },true); }},
   aw:{name:'원망의 꽃',cd:45,r:11,cast(e){ S.proj(e,e.aim,{speed:16,range:12,dmg:0,label:'작열의 꽃',big:true,nohit:true,v:'leaf',onEnd:p=>{ zone(e,{x:p.x,y:p.y,r:6,dur:5,every:.33,label:'원망의 꽃',tick:(z,inn)=>inn.forEach(t=>{ strike(e,t,5,'원망의 꽃'); if(has(t,'offer')&&e.r.hm<5) e.r.hm++; })}); }}); }}
  },note:'번제는 9칸 안의 적이 선 자리에 4타(4씩)로 떨어진다. 맹화는 3타(10씩).'});

/* ───── 서사 재림 2 · 전설 재림 1 ───── */
RB('fomal',{name:'바다의 왕, 포말',
  init:e=>{e.r={ok:0,ch:0,acc:0,sw:0}}, hud:e=>'해옥 '+e.r.ok+'/6 · 해일 '+e.r.ch+'/2',
  tick(e,dt){ if(e.r.ch<2){ e.r.acc+=dt; if(e.r.acc>=9){ e.r.acc-=9; e.r.ch++; } } },
  onSkillHit(e){ if(e.r.ok<6) e.r.ok++; }, altBasic:e=>e.r.sw>now,
  skills:{
   crouch:{name:'해옥 나눔',cd:.4,can:e=>e.r.ok>0,need:'해옥',ai:e=>e.hp<e.max-12,cast(e){ e.r.ok--; const a=weakest(e,6); for(let i=1;i<=3;i++) after(i,()=>heal(a,3)); add(a,'haste',3,.1); }},
   n1:{name:'해일',cd:2,r:6,can:e=>e.r.ch>=1||e.r.ok>=3,need:'해일 충전 또는 해옥 3',cast(e){ if(e.r.ch>=1) e.r.ch--; else e.r.ok-=3; const d={x:e.aim.x,y:e.aim.y},n=new Map(); e.r.sw=now+.55; add(e,'resist',.55,.7); e.busy=now+.52;
        for(let i=0;i<6;i++) after(i*.08,()=>{ if(e.dead) return; const p0=S.blink(e,d,1); puff(p0.x,p0.y,'water',3,2); foes(e).forEach(t=>{ const k=n.get(t)||0; if(k<2&&dist(e,t)<=1.2+R&&zok(e,t)){ n.set(t,k+1); strike(e,t,10,'해일',{air:k?0:1}); } }); }); }},
   n2:{name:'강태공',cd:15,r:10,cast(e){ S.focus(e,1); after(1,()=>{ if(e.dead) return; const a0=Math.atan2(e.aim.y,e.aim.x); for(const da of [-.14,.14]) S.proj(e,{x:Math.cos(a0+da),y:Math.sin(a0+da)},{speed:22,range:11,dmg:20,label:'강태공',v:'chain',o:{post:t=>{ near(t,e,1.2); say(t,'끌당','#f0b458'); }}}); }); }},
   aw:{name:'해룡 강림',cd:45,r:4,can:e=>e.r.ok>=1,need:'해옥',cast(e){ const n=e.r.ok; e.r.ok=0; const p={x:e.x,y:e.y,z:0}; fx.push({k:'circle',x:p.x,y:p.y,r:4,t0:now,team:e.team,dur:3,lab:'향유 고래',src:e}); for(let i=0;i<n;i++) after(3+i*.2,()=>{ if(!e.dead) S.circle(e,4,12,'해룡 강림',{air:i?0:2,v:'geyser',zfree:true},p); }); }}
  },note:'해옥은 6칸 안에서 체력 비율이 가장 낮은 아군(없으면 자신)에게 준다. 해일은 지나가며 같은 적을 두 번까지 친다(10씩).'});
RB('stern',{name:'소모라의 주인, 스테른',
  init:e=>{e.r={cap:0,acc:0,od:0}}, hud:e=>'결정 '+e.r.cap+'/5'+(e.r.od>now?' · 재각성':''),
  gain(e){ if(e.r.cap<5){ e.r.cap++; add(e,'haste',1,.1); add(e,'dizzy',1,0,{self:true}); } },
  tick(e,dt){ e.r.acc+=dt; if(e.r.acc>=8){ e.r.acc-=8; CH.stern_r.gain(e); } },
  onCast(e,s){ if((s==='n1'||s==='n2')&&e.r.od>now) e.cd[s]*=.5; },
  skills:{
   n1:{name:'초속검',cd:1,ai:(e,d)=>d>2.2&&d<=4,can:e=>e.r.cap>=1,need:'결정 1',cast(e){ e.r.cap--; const p0=S.blink(e,moveDir(e),3); S.seg(e,p0,{x:e.x,y:e.y},1.4,15,'초속검',{v:'dash'}); }},
   n2:{name:'사연무',cd:9,r:3,cast(e){ for(let i=0;i<4;i++) after(i*.14,()=>{ if(e.dead) return; e.swingT=now; if(S.arc(e,3,10,'사연무').length&&(i===0||i===3)) CH.stern_r.gain(e); }); }},
   aw:{name:'치사 복용',cd:45,r:6,can:e=>e.r.cap>=1,need:'결정',cast(e){ const t=e.r.cap*5; e.r.cap=0; e.r.od=now+t; add(e,'haste',t,.3); add(e,'resist',t,.2); }}
  },note:'결정 0개로 시작한다. 결정을 얻을 때마다 1초 동안 화면이 울렁인다. 사연무의 범위는 3칸으로 잡았다.'});
RB('tyrfing',{name:'적멸의 마검, 티르빙',
  init:e=>{e.r={bn:0,sk:false,zn:null}}, hud:e=>(e.r.zn&&e.r.zn.until>now?'적멸지 · ':'')+'적멸',
  onCast(e,s){ if(s!=='crouch') e.r.sk=true; },
  basicBonus(e,t){ e.r.bn++; const z=e.r.zn,inz=!!z&&z.until>now&&Math.hypot(e.x-z.x,e.y-z.y)<=z.r; if(!(e.r.sk||e.r.bn%2===0||inz)) return; e.r.sk=false; S.leap(e,e.aim,2,18,null,true); damage(e,t,8,'적멸',{skill:true}); if(z&&z.until>now&&Math.hypot(t.x-z.x,t.y-z.y)<=z.r) heal(e,10); },
  skills:{
   n1:{name:'적광',cd:6,r:5,cast(e){ add(e,'haste',2,.2); after(2,()=>{ if(!e.dead) S.circle(e,4,6,'적광',{v:'burst'}); }); }},
   n2:{name:'혈겁',cd:8,ai:(e,d)=>d>3&&d<=7&&e.hp>60,cast(e){ pay(e,20); S.leap(e,moveDir(e),5,22); add(e,'resist',2,.2); }},
   aw:{name:'적색 명멸',cd:45,ai:(e,d)=>d<=6&&e.hp>e.max*.5,cast(e){ pay(e,60); fx.push({k:'circle',x:e.x,y:e.y,r:1.5,t0:now,team:e.team,lab:'적멸 마검',src:e,v:'blade'}); e.r.zn=zone(e,{x:e.x,y:e.y,r:7,dur:10,every:.25,label:'적멸지',tick:(z,inn)=>inn.forEach(t=>{ add(t,'slow',.35,.2,{by:e}); rm(t,'vuln'); add(t,'vuln',.35,.2,{by:e}); })}); }}
  },note:'적멸지 안에서는 기본 공격마다 적멸이 나간다.'});
RB('mor',{name:'밤하늘 군주, 모르',
  init:e=>{e.r={sh:0,on:false,veil:0}}, hud:e=>'밤하늘 '+Math.floor(e.r.sh)+(e.r.on?' · 검은 밤':'')+(e.r.veil>now?' · 야천':''),
  off(e){ if(e.r.on){ e.r.on=false; rm(e,'stealth'); e.st=e.st.filter(s=>!s.night); } },
  tick(e,dt){ e.r.sh=Math.min(100,e.r.sh+10*dt); if(e.r.on){ if(e.r.veil<=now) e.r.sh-=20*dt; if(e.r.sh<=0){ e.r.sh=0; CH.mor_r.off(e); } else if(!has(e,'stealth')) add(e,'stealth',9999); } if(e.r.veil&&e.r.veil<=now){ e.r.veil=0; S.leap(e,e.aim,12,30); } },
  onDeal(e,t,amt,label,o){ if(!o||o.amp||t.dead||!(o.basic||o.skill)||!behind(e,t)) return; proc(e,'밤하늘','후방 추가 피해'); e.r.sh=Math.min(100,e.r.sh+5); damage(e,t,10*(e.r.veil>now?2:1),'밤하늘',{amp:true}); },
  skills:{
   n1:{name:'밤하늘 장막',cd:2,ai:(e,d)=>e.r.on?d>11:(e.r.sh>=60||e.r.veil>now)&&d<=12,can:e=>e.r.on||e.r.sh>=5||e.r.veil>now,need:'밤하늘 5',cast(e){ if(e.r.on){ CH.mor_r.off(e); return; } if(e.r.veil<=now) e.r.sh-=5; e.r.on=true; add(e,'stealth',9999); add(e,'haste',9999,.1,{night:true}); }},
   n2:{name:'밤하늘 궤적',cd:4,r:15,can:e=>e.r.sh>=40||e.r.veil>now,need:'밤하늘 40',cast(e){ if(e.r.veil<=now) e.r.sh-=40; if(e.r.on) e.cd.n2=2; const hit=S.line(e,16,0,'밤하늘 궤적',{v:'tracer'}); const t=hit.sort((a,b)=>dist(e,a)-dist(e,b))[0]; if(t){ puff(e.x,e.y,'shadow',8,3); e.x=t.x-t.aim.x*1.1; e.y=t.y-t.aim.y*1.1; clamp(e); add(t,'flank',.7,0,{by:e}); } }},
   aw:{name:'밤하늘 군주',kind:'초월',cd:60,r:10,cast(e){ e.r.veil=now+10; add(e,'haste',10,.25); }}
  },note:'후방 판정은 숨어서 등 뒤로 돌았을 때와 밤하늘 궤적 직후 0.7초에 난다. 야천이 끝나면 조준 방향으로 12칸 도약한다.'});
RB('irenio',{name:'맹약의 대재판관, 이레니오',
  init:e=>{e.r={am:0,h:0,ak:0,pan:0,spent:0,l1:-99}}, hud:e=>'탄환 '+e.r.am+'/6'+(e.r.ak>now?' · 악도':'')+(e.r.pan>now?' · 판결':''),
  load(e){ if(e.r.am<6){ e.r.am=Math.min(6,e.r.am+2); proc(e,'맹약','탄환 +2'); } },
  bullet(e,dir,home,exec){ const A=e.r.ak>now; S.proj(e,dir,{speed:30,range:16,dmg:16+(A?8:0),label:'맹약',v:'bullet',home,z:home?home.z:e.z,o:{air:A?.5:0,post:t=>{ if(exec&&!t.dead&&t.hp<t.max*.15){ damage(e,t,t.hp+999,'징멸 선고 (처형)',{fixed:true,amp:true}); if(t.dead) foes(e).filter(aired).forEach(x=>CH.irenio_r.bullet(e,norm(x.x-e.x,x.y-e.y),x,true)); } }}}); },
  shoot(e,n){ for(let i=0;i<n*(e.r.ak>now?2:1);i++) after(i*.1,()=>{ if(!e.dead) CH.irenio_r.bullet(e,e.aim); }); },
  onDeal(e,t,amt,label,o){ if(o&&o.amp) return; if(++e.r.h%3===0) CH.irenio_r.load(e); },
  onCast(e,s){ if(s!=='n1'&&s!=='n2') return; if(e.r.am>=1){ e.r.am--; e.x-=e.aim.x; e.y-=e.aim.y; clamp(e); CH.irenio_r.shoot(e,1); } },
  skills:{
   n1:{name:'선도',cd:3,r:3.5,cast(e){ if(now-e.r.l1<=6){ e.r.l1=-99; CH.irenio_r.load(e); fx.push({k:'circle',x:e.x,y:e.y,r:3.5,t0:now,team:e.team,lab:'선일',src:e,v:'shout'}); } else { e.r.l1=now; S.circle(e,3.5,18,'선도',{knock:1.5,v:'shout'}); } }},
   n2:{name:'악도',cd:14,r:8,cast(e){ e.r.ak=now+4; }},
   aw:{name:'징멸 선고',kind:'초월',cd:60,r:8,can:e=>e.r.am>=1,need:'탄환',cast(e){ e.r.spent=e.r.am; e.r.am=0; S.leap(e,moveDir(e),5,22); e.r.pan=now+9; }},
   crouch:{name:'판결',cd:.5,can:e=>e.r.pan>now,need:'판결 중',ai:(e,d)=>d<=7,cast(e){ e.r.pan=0; S.line(e,7,0,'징멸 선고',{air:5,v:'windcut'}); const n=e.r.spent; e.r.spent=0; for(let i=0;i<n;i++) after(.25+i*.12,()=>{ if(e.dead) return; const a=foes(e).filter(aired); const t=a[Math.floor(Math.random()*a.length)]; if(t) CH.irenio_r.bullet(e,norm(t.x-e.x,t.y-e.y),t,true); }); }}
  },note:"탄환 0발로 시작한다. 선도의 '재시전'은 6초 안에 다시 쓴 것으로 읽어, 피해 대신 탄환 2발을 장전한다. 판결 사격은 떠 있는 적만 겨눈다."});
RB('piana',{name:'만개한 고결, 피아나',
  init:e=>{e.r={sa:0,acc:0}}, hud:e=>'성화 '+e.r.sa+'/300',
  tick(e,dt){ if(!inFight(e)){ e.r.acc+=dt; if(e.r.acc>=1){ e.r.acc-=1; heal(e,10,true); } } },
  onKill(e){ e.cd.aw=0; e.r.sa=Math.min(300,e.r.sa+50); },
  skills:{
   n1:{name:'도화',cd:6,ai:e=>e.r.sa<300,cast(e){ add(e,'haste',3,.1); after(3,()=>{ if(!e.dead){ e.r.sa=Math.min(300,e.r.sa+20); say(e,'성화 +20','#ff9fd6'); } }); }},
   n2:{name:'천광',cd:9,ai:e=>e.hp>e.max*.75&&e.r.sa<240,cast(e){ pay(e,100); e.r.sa=Math.min(300,e.r.sa+60); e.cd.n1=0; }},
   aw:{name:'화무일성제',kind:'초월',cd:89.9,ai:(e,d)=>d<=4&&e.r.sa>=80,can:e=>e.r.sa>0,need:'성화',cast(e){ const n=e.r.sa; e.r.sa=0; add(e,'haste',3,.5); add(e,'resist',3,.5); zone(e,{x:e.x,y:e.y,r:3,dur:n*.1+.05,every:.1,chase:e,speed:99,label:'꽃',tick:(z,inn)=>inn.forEach(t=>{ if(strike(e,t,2,'화무일성제')) heal(e,1,true); })}); }}
  },note:'꽃은 자신을 따라다니며 0.1초마다 2 피해를 성화만큼 되풀이한다(간격은 카드에 없다).'});
RB('bunt',{name:'즐기는 자, 번트',
  init:e=>{e.r={pcd:0,stk:0}}, hud:e=>'리셔플 '+(e.r.pcd>0?e.r.pcd.toFixed(0)+'s':'준비')+' · 다음 스태커 '+(e.r.stk%4+1)+'장',
  tick(e,dt){ if(e.r.pcd>0) e.r.pcd-=dt; },
  onDeal(e,t){ if(e.r.pcd>0||t.dead) return; e.r.pcd=14; proc(e,'리셔플','자리 바꿈'); const x=e.x,y=e.y; puff(e.x,e.y,'arcane',8,4); puff(t.x,t.y,'arcane',8,4); e.x=t.x; e.y=t.y; t.x=x; t.y=y; add(t,'silence',1,0,{by:e}); for(const k in e.cd) if(k!=='b') e.cd[k]*=.8; },
  skills:{
   n1:{name:'스태커',cd:7,r:11,cast(e){ const n=e.r.stk%4+1; e.r.stk++; for(let i=0;i<n;i++) after(i*.1,()=>{ if(!e.dead) S.proj(e,e.aim,{speed:22,range:13,dmg:9,label:'스태커',v:'knife',o:{air:1,knock:1,post:()=>{ e.r.pcd=Math.max(0,e.r.pcd-1); }}}); }); }},
   n2:{name:'트랩',cd:14,ai:(e,d)=>d>5&&d<=8.5,cast(e){ const p=front(e,7); zone(e,{x:p.x,y:p.y,r:.9,dur:4,every:.1,label:'트랩',tick:(z,inn)=>{ if(inn.length){ z.until=now; inn.forEach(t=>{ add(t,'stun',1.5,0,{by:e}); air(t,1.5); add(t,'nakun',1.5,0,{by:e}); }); } }}); }},
   aw:{name:'무대 장악',cd:45,r:10,cast(e){ const d={x:e.aim.x,y:e.aim.y}; for(let i=0;i<5;i++) after(i*.18,()=>{ if(e.dead) return; if(i%2===0) S.proj(e,d,{speed:24,range:12,dmg:0,label:'멋진 등장 (금)',nohit:true,el:'holy',onEnd:p=>S.circle(e,3,20,'무대 장악',{knock:1.5,v:'burst',el:'holy'},{x:p.x,y:p.y,z:0})}); else S.proj(e,d,{speed:9,range:12,dmg:0,label:'멋진 등장 (은)',nohit:true,el:'steel',onEnd:p=>{ if(!e.dead){ puff(e.x,e.y,'arcane',8,4); e.x=p.x; e.y=p.y; clamp(e); } }}); }); }}
  },note:'스태커는 쓸 때마다 1·2·3·4장으로 늘고 4장 뒤 다시 1장이다. 트랩의 "서서히 떠오름"은 1.5칸 띄우고 천천히 내려오게 했다.'});
RB('reitia',{name:'드높은 하늘, 레이티아',
  init:e=>{e.r={pcd:0,ch:2,acc:0,fl:0}}, hud:e=>'나운 '+(e.r.pcd>0?e.r.pcd.toFixed(0)+'s':'준비')+' · 야천 '+e.r.ch+'/2',
  tick(e,dt){ if(e.r.pcd>0) e.r.pcd-=dt; if(e.r.ch<2){ e.r.acc+=dt; if(e.r.acc>=15){ e.r.acc-=15; e.r.ch++; } } ents.forEach(x=>{ if(!x.dead&&has(x,'nakun')) slowFall(x); }); if(e.r.fl>now) slowFall(e); },
  onCast(e,s){ if(e.r.pcd>0||s==='crouch') return; e.r.pcd=12; proc(e,'나운','16 피해 · 둔화'); S.circle(e,3,16,'나운',{slow:[.2,2],v:'nova',zfree:true,post:t=>{ rm(t,'nakun'); add(t,'nakun',3,0,{by:e}); }},spot(e,9,4)); },
  skills:{
   n1:{name:'성운',cd:8,r:9,cast(e){ S.circle(e,2,30,'성운',{air:3,knock:1,v:'geyser',zfree:true},spot(e,9,4)); }},
   n2:{name:'야천',cd:.5,ai:(e,d)=>d<4,can:e=>e.r.ch>=1,need:'야천 충전',cast(e){ e.r.ch--; S.blink(e,moveDir(e),4); add(e,'jumpup',2,1.5,{self:true}); e.r.fl=now+4; }},
   aw:{name:'별하늘 부름',kind:'초월',cd:60,r:9,cast(e){ const p=spot(e,9,4); let k=0; const lift=(z,st)=>foes(e).filter(t=>Math.hypot(t.x-z.x,t.y-z.y)<=z.r+R).forEach(t=>{ air(t,5); add(t,'stun',st,0,{by:e}); }); const z=zone(e,{x:p.x,y:p.y,r:5,dur:5.05,every:1,label:'별하늘',tick:(zz,inn)=>{ k++; inn.forEach(t=>{ strike(e,t,6+4*k,'별하늘 부름'); add(t,'nojump',2,0,{by:e}); }); zz.r=Math.max(3,5-k*.5); if(k>=5) lift(zz,.5); }}); lift(z,.25); }}
  },note:'야천은 15초마다 하나씩, 둘까지 충전된다. 별하늘은 매초 10·14·18·22·26 피해를 주며 5칸에서 3칸으로 줄어든다.'});

/* ───── 전설 재림 2 ───── */
RB('mars',{name:'투신, 마르스',
  init:e=>{e.r={mj:0,ts:0,h:0,gd:0,god:0,bn:0}}, hud:e=>'무제 '+e.r.mj+'/3 · 투성 '+e.r.ts+'/3'+(e.r.god>now?' · 투신':''),
  m:e=>e.r.god>now?1.5:1,
  tick(e){ if(e.r.god&&e.r.god<=now){ e.r.god=0; const d=moveDir(e); S.leap(e,d,3,26,()=>S.leap(e,d,3,26,()=>S.leap(e,d,3,26))); } },
  onCast(e,s){ if(s!=='crouch'&&e.r.ts<3) e.r.ts++; },
  onDeal(e,t,amt,label,o){ if(o&&o.amp) return; if(++e.r.h>=(e.r.god>now?2:3)){ e.r.h=0; if(e.r.mj<3) e.r.mj++; } },
  altBasic(e){ if(e.r.ts<=0) return false; if(e.cd.b>0) return true; e.cd.b=CFG.atkInt; e.r.ts--; e.swingT=now; swingSnd(e); S.line(e,5,14*CH.mars_r.m(e),'무투 (사슬)',{basic:true,pull:.7,v:'whip',el:'iron'}); return true; },
  modTake(e,src,amt){ if(src!==e&&e.r.gd>now){ const m=e.r.gdm; e.r.gd=0; say(e,'반석','#cfd8ea'); return amt*(1-m); } return amt; },
  skills:{
   crouch:{name:'투신 사격',cd:.35,can:e=>e.r.god>now&&e.r.bn<4,need:'투신 중',ai:(e,d)=>d<=13,cast(e){ e.r.bn++; S.proj(e,e.aim,{speed:28,range:14,dmg:9,label:'투신의 길',v:'arrow',o:{knock:1}}); }},
   n1:{name:'비뢰',cd:3,ai:(e,d)=>d>2&&d<=8,can:e=>e.r.mj>=1,need:'무제 1',cast(e){ e.r.mj--; const m=CH.mars_r.m(e); S.leap(e,moveDir(e),5,24,()=>S.line(e,3,16*m,'비뢰',{air:1.5,slow:[.2*m,1],v:'cut'}),true); }},
   n2:{name:'반석',cd:4,ai:e=>hurtNow(e)||incoming(e),can:e=>e.r.mj>=1,need:'무제 1',cast(e){ e.r.mj--; e.r.gd=now+2; e.r.gdm=.3*CH.mars_r.m(e); }},
   aw:{name:'투신의 길',cd:45,r:12,cast(e){ e.r.god=now+7; e.r.bn=0; add(e,'haste',7,.2); }}
  },note:'투성이 있으면 기본기 단추가 사슬(14, 투신 중 21)이다. 투신 중 화살은 웅크리기 단추(9 피해, 최대 4발).'});
RB('ur',{name:'찬란한 위상, 우르',
  init:e=>{e.r={off:0,nb:0,st:0,sn:0,fin:false}}, hud:e=>(e.r.off>now?'다짐 꺼짐 · ':'다짐 · ')+(e.r.st>now?'청풍 '+e.r.sn+'/12':e.r.fin?'일격 준비':''),
  speedMod:e=>e.r.off>now?1:1.2,
  onCast(e){ e.r.off=now+2; },
  onDeal(e,t,amt,label,o){ if(o&&o.amp||!(o&&(o.basic||o.skill))) return; if(e.r.st>now&&!e.r.fin&&++e.r.sn>=12){ e.r.fin=true; e.r.finT=now+3; proc(e,'청풍 명월','다음 기본 공격 강화'); } },
  basicBonus(e,t){ if(e.r.nb>now){ e.r.nb=0; air(t,1); add(t,'slow',1,.3,{by:e}); }
    if(e.r.fin&&e.r.armed){ e.r.fin=false; e.r.armed=false; e.r.st=0; damage(e,t,50,'청풍 명월',{amp:true}); if(t.dead) return; add(t,'silence',1,0,{by:e}); after(.25,()=>{ if(e.dead||t.dead) return; damage(e,t,50,'청풍 명월 (일격)',{amp:true}); add(t,'stun',1,0,{by:e}); near(e,t); }); } },
  onBasic(e){ if(e.r.fin) e.r.armed=true; },
  skills:{
   n1:{name:'벽천',cd:4,r:3.5,cast(e){ S.leap(e,moveDir(e),1,18,()=>S.circle(e,3,8,'벽천',{v:'spin',post:()=>{ e.cd.n2=Math.max(0,e.cd.n2-3); }}),true); e.r.nb=now+1.2; }},
   n2:{name:'섬전',cd:12,ai:(e,d)=>d>2&&d<=6.5,cast(e){ S.leap(e,moveDir(e),3,22,()=>S.circle(e,4,15,'섬전',{knock:1,v:'bolt'}),true); }},
   aw:{name:'청풍 명월',kind:'초월',cd:60,ai:(e,d)=>d>2&&d<=10,cast(e){ const p0={x:e.x,y:e.y}; S.leap(e,e.aimMan>now?e.aim:moveDir(e),10,30,()=>S.seg(e,p0,{x:e.x,y:e.y},1.6,30,'청풍 명월 (돌진)',{v:'beam'}),true); e.r.st=now+5.4; e.r.sn=0; e.r.fin=false; e.r.armed=false; }}
  },note:'청풍 명월은 돌진 뒤 5초 안에 공격·스킬을 12번 맞히면, 그다음 기본 공격이 50 추가 피해·침묵, 이어서 50 피해·기절을 준다.'});
RB('alpi',{name:'폭풍의 청랑, 알피',
  init:e=>{e.r={n:0,tw:false}}, hud:e=>'청랑 '+(e.r.n%10)+'/10'+(e.r.tw?' · 회오리 준비':''),
  onDeal(e,t,amt,label,o){ if(o&&o.amp||t.dead||Math.random()>=.4) return; e.r.n++; damage(e,t,3,'청랑',{amp:true}); for(const k in e.cd) if(k!=='b') e.cd[k]=Math.max(0,e.cd[k]-1); if(e.r.n%10===0){ proc(e,'청랑','폭풍'); for(let i=0;i<10;i++) after(i*.05,()=>{ if(!e.dead){ fx.push({k:'circle',x:e.x,y:e.y,r:4,t0:now,team:e.team,lab:'청랑',src:e,v:'vortex'}); foes(e).forEach(x=>{ if(dist(e,x)<=4+R){ damage(e,x,3,'청랑 (폭풍)',{amp:true}); if(i===9) knock(x,e,1.5); } }); } }); } },
  skills:{
   n1:{name:'선풍',cd:7,r:4,cast(e){ const tw=e.r.tw; e.r.tw=false; for(let i=0;i<3;i++) after(i*.1,()=>{ if(!e.dead&&S.circle(e,4,4,'선풍',{knock:i===2?.7:0,v:'vortex'}).length) e.r.tw=true; }); if(tw) for(let i=0;i<2;i++) after(i*.08,()=>{ if(!e.dead) S.proj(e,e.aim,{speed:16,range:10,dmg:3,label:'회오리',big:true,v:'orb',o:{air:i?0:1,post:t=>{ rm(t,'whirl'); add(t,'whirl',2,0,{by:e}); }}}); }); }},
   n2:{name:'참철',cd:11,ai:(e,d)=>d>3&&d<=7,cast(e){ S.leap(e,moveDir(e),6,24,()=>{ if(S.circle(e,4,8,'참철',{v:'spin'}).length) e.cd.n2=Math.max(0,e.cd.n2-4); after(.12,()=>{ if(!e.dead) S.circle(e,4,8,'참철',{knock:1,v:'spin'}); }); }); }},
   aw:{name:'풍랑의 별',cd:45,r:3,cast(e){ const w=foes(e).filter(t=>has(t,'whirl')&&dist(e,t)<=3+R); let any=false; for(let i=0;i<3;i++) after(i*.1,()=>{ if(e.dead) return; if(S.circle(e,3,5,'풍랑의 별',{zfree:true,v:'vortex',post:t=>{ if(i===2&&!w.includes(t)) knock(t,e,1); }}).length&&!any){ any=true; e.cd.n1=0; e.cd.n2=0; } });
        w.forEach(t=>{ add(t,'slow',3,.75,{by:e}); for(let i=0;i<8;i++) after(.3+i*.06,()=>{ if(!e.dead&&!t.dead) strike(e,t,4,'풍랑의 별 (회오리)'); }); after(.8,()=>{ if(!e.dead&&!t.dead){ e.x=t.x-t.aim.x*1.1; e.y=t.y-t.aim.y*1.1; clamp(e); } }); }); }}
  },note:'청랑이 열 번 발동할 때마다 4칸 폭풍(3씩 10타)이 인다.'});
RB('melt',{name:'영웅의 의지, 멜트',
  init:e=>{e.r={ys:0,ch:2,acc:0,cr:0}}, hud:e=>'열망 '+e.r.ys+'/2 · 드높음 '+e.r.ch+'/2',
  tick(e,dt){ if(e.r.ch<2){ e.r.acc+=dt; if(e.r.acc>=10){ e.r.acc-=10; e.r.ch++; } } },
  onCast(e,s){ if(s!=='crouch'&&e.r.ys<2) e.r.ys++; },
  basicBonus(e,t){ if(e.r.ys<=0) return; e.r.ys--; proc(e,'열망','최대 체력 6%'); damage(e,t,t.max*.06,'열망 (최체비)'); add(t,'slow',3,.2,{by:e}); },
  skills:{
   crouch:CROUCH,
   n1:{name:'단야',cd:8,r:4,cast(e){ e.swingT=now; S.line(e,4,16,'단야',{air:1,v:'cut',pre:t=>{ if(has(t,'slow')){ rm(t,'slow'); add(t,'stun',.5,0,{by:e}); } }}); }},
   n2:{name:'드높음',cd:2,ai:(e,d)=>d<=5&&hurtNow(e),can:e=>e.r.ch>=1,need:'드높음 충전',cast(e){ e.r.ch--; const a=e.r.cr>now&&nearAlly(e,8); if(a){ S.proj(e,norm(a.x-e.x,a.y-e.y),{speed:18,range:Math.max(.5,dist(e,a)),dmg:0,label:'시제품',nohit:true,big:true}); after(dist(e,a)/18,()=>{ if(!a.dead) shield(a,20,2); }); } else shield(e,20,2); }},
   aw:{name:'용병의 검',kind:'초월',cd:60,r:7,cast(e){ S.focus(e,2); after(2,()=>{ if(!e.dead) S.arc(e,7,50,'용병의 검',{vuln:[.35,5],v:'scythe',el:'blood',pre:t=>{ t.sh=[]; t.st=t.st.filter(s=>!['haste','resist','stealth'].includes(s.k)||s.self); }}); }); }}
  },note:"용병의 검은 맞은 적의 보호막과 기동력·저항 증가, 은신을 지운다(무적은 남는다). 캐릭터 고유 상태는 지우지 못한다."});
RB('yuri',{name:'천라의 패도, 유리',
  init:e=>{e.r={ck:false,ckT:-9}}, hud:e=>(e.r.ck?'창천 준비':'창천'),
  onCast(e,s){ if(s!=='crouch') e.r.ck=true; },
  altBasic(e){ if(!e.r.ck) return false; if(e.cd.b>0) return true; e.cd.b=CFG.atkInt; e.r.ck=false; e.r.ckT=now; e.swingT=now; swingSnd(e); if(S.arc(e,3,30,'창천',{basic:true,stun:STAG,v:'scythe',el:'blue'}).length) e.cd.aw=Math.max(0,e.cd.aw-1); return true; },
  skills:{
   n1:{name:'천라',cd:4,r:5,cast(e){ const fast=now-e.r.ckT<=.2; S.circle(e,5,10,'천라',fast?{pull:.7,v:'spin',el:'steel'}:{v:'spin',el:'steel'}); if(fast){ e.cd.n1=0; proc(e,'천라','초기화'); } }},
   n2:{name:'반천',cd:5,ai:(e,d)=>d<=4,can:e=>inFight(e),need:'전투 중',cast(e){ add(e,'haste',1,.2); add(e,'resist',1,.2); }},
   aw:{name:'패휘의 검',cd:45,r:5,cast(e){ S.line(e,5,25,'패휘의 검',{v:'slash',el:'blue'}); after(.15,()=>{ if(!e.dead) S.line(e,5,25,'패휘의 검',{knock:1.5,v:'slash',el:'steel'}); }); }}
  },note:'창천을 휘두르고 0.2초 안에 천라를 누르면 천라의 대기시간이 초기화된다. 창천의 범위는 3칸으로 잡았다.'});
RB('venil',{name:'극한의 빙제, 베닐',
  init:e=>{e.r={pcd:0}}, hud:e=>'빙환 '+(e.r.pcd>0?e.r.pcd.toFixed(0)+'s':'준비'),
  tick(e,dt){ if(e.r.pcd>0) e.r.pcd-=dt; else if(e.hp<=e.max*.33){ e.r.pcd=120; proc(e,'빙환','강림 3초'); add(e,'invuln',3); S.circle(e,5,0,'빙환',{stun:1,v:'nova'}); after(3,()=>heal(e,60)); } },
  skills:{
   n1:{name:'극한',cd:7,r:6,can:e=>!!tgt(e,6),need:'6칸 안의 적',cast(e){ const t=tgt(e,6),v=has(t,'vapor'); fx.push({k:'circle',x:t.x,y:t.y,r:1,t0:now,team:e.team,lab:'냉각',src:e,v:'nova'}); strike(e,t,v?50:25,v?'극한 (기화)':'극한',{slow:v?[.5,2]:[.25,1]}); }},
   n2:{name:'한파',cd:11,r:10,cast(e){ S.proj(e,e.aim,{speed:20,range:12,dmg:35,label:'한파',big:true,v:'orb',o:{stun:.5,post:t=>{ rm(t,'vapor'); add(t,'vapor',8,0,{by:e}); }}}); }},
   aw:{name:'서리 달빛',kind:'초월',cd:60,r:8,cast(e){ S.focus(e,2); after(2,()=>{ if(e.dead) return; if(S.circle(e,8,60,'서리 달빛',{stun:3,v:'burst'}).length){ e.cd.n1=0; e.cd.n2=0; e.r.pcd=0; } }); }}
  },note:"카드의 '기화가 명중한 적'은 이 카드의 한파에 맞은 적(8초)으로 읽었다."});
RB('rano',{name:'깨어난 잠룡, 라노',
  init:e=>{e.r={x2:0,st:0,god:0}}, hud:e=>(e.r.x2>now?'오성 x2 · ':'오성 · ')+(e.r.god>now?'강신':''),
  onCast(e,s){ if(s!=='crouch') e.r.x2=now+3; },
  basicBonus(e,t){ damage(e,t,e.r.x2>now?4:2,'오성'); },
  onDeal(e,t,amt,label,o){ if(e.r.god>now&&o&&!o.amp&&!t.dead) damage(e,t,amt*.36,'강신 (증폭)',{amp:true}); },
  modTake(e,src,amt){ if(src===e) return amt; if(e.r.st>now){ e.r.st=0; say(e,'탈력','#7fe3b5'); after(.02,()=>{ if(e.dead) return; e.busy=0; rm(e,'focus'); S.circle(e,3,8,'탈력 (내리찍기)',{stun:1,v:'quake'}); after(.25,()=>{ if(e.dead) return; S.arc(e,4,16,'탈력 (휘두르기)',{knock:1.5}); after(.25,()=>{ if(!e.dead) S.leap(e,e.aim,4,24,()=>S.arc(e,4,12,'탈력 (도약)'),true); }); }); }); return 0; }
    if(Math.random()<(e.r.x2>now?.2:.1)){ say(e,'회피','#ffd27a'); return 0; } return amt; },
  skills:{
   n1:{name:'격타',cd:8,r:5,cast(e){ S.line(e,5,15,'격타',{air:1,vuln:[.1,3],v:'cut'}); }},
   n2:{name:'탈력',cd:15,ai:(e,d)=>d<=5&&(hurtNow(e)||incoming(e)),cast(e){ e.r.st=now+1; S.focus(e,1); }},
   aw:{name:'삼십육천강',kind:'초월',cd:60,r:6,cast(e){ S.focus(e,3); after(3,()=>{ if(e.dead) return; e.r.god=now+3; add(e,'haste',3,.36); add(e,'resist',3,.36); for(let i=0;i<3;i++) after(i+1,()=>heal(e,12)); for(let i=0;i<6;i++) after(i*.5,()=>{ if(!e.dead) S.circle(e,6,11,'삼십육천강',{air:i?0:3,v:'vortex'}); }); }); }}
  },note:'탈력은 1초 자세 중 맞으면 무효로 하고 세 번 이어 친다. 삼십육천강의 66 피해는 강신 3초 동안 6타(11씩)로 나뉜다.'});
RB('leus',{name:'판테온의 별, 레우스',
  init:e=>{e.r={acc:0,nb:0,gd:0}}, hud:e=>(e.r.gd>now?'혜성 · ':'')+'광륜',
  light(e){ if(heal(e,(e.max-e.hp)*.04)>0) proc(e,'광륜','잃은 체력 4%'); },
  rush(e){ e.r.gd=0; e.st=e.st.filter(s=>!s.gd); S.leap(e,e.aim,4,24,()=>S.circle(e,1.8,30,'빛의 혜성',{stun:1,v:'burst'}),true); },
  tick(e,dt){ e.r.acc+=dt; if(e.r.acc>=8){ e.r.acc-=8; CH.leus_r.light(e); } if(e.r.gd&&e.r.gd<=now) CH.leus_r.rush(e); },
  basicBonus(e,t){ if(e.r.nb>now){ e.r.nb=0; add(t,'disarm',1,0,{by:e}); } },
  skills:{
   crouch:{name:'해제',cd:.3,can:e=>e.r.gd>now,need:'혜성 중',ai:(e,d)=>d<=4.5,cast(e){ CH.leus_r.rush(e); }},
   n1:{name:'무궁',cd:7,r:3.5,cast(e){ e.r.nb=now+2; }},
   n2:{name:'빛의 혜성',cd:15,r:7,cast(e){ e.r.gd=now+3; add(e,'resist',3,.3,{gd:true}); add(e,'haste',3,.2,{gd:true}); }},
   aw:{name:'시련의 별',kind:'초월',cd:60,ai:e=>e.hp<e.max*.6&&hurtNow(e),cast(e){ add(e,'invuln',5); for(let i=1;i<=5;i++) after(i,()=>{ if(e.dead) return; CH.leus_r.light(e); if(i===5){ e.cd.n1*=.5; e.cd.n2*=.5; } }); }}
  },note:'혜성은 웅크리기 단추로 미리 풀 수 있고, 3초가 다 돼도 돌진이 나간다.'});
