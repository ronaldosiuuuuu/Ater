"use strict";
/* 캐릭터 자료. 수치는 카드 원문 그대로. 엔진이 아는 낱말(S.arc, S.circle, S.line, S.proj, add, air, knock …)로만 적는다.
   note = 시험장에서 카드와 다르게(또는 풀이해서) 처리한 것. 스킬 보기 화면에 그대로 나온다. */
const CLASSES={전사:{hp:500,atk:20},수호자:{hp:600,atk:16},마법사:{hp:400,atk:14},암살자:{hp:400,atk:24},지원가:{hp:500,atk:16},척후병:{hp:450,atk:18}};
const inFight=e=>now-e.lastFight<5;
const aired=t=>t.z>0.3;
const front=(e,d)=>({x:e.x+e.aim.x*d,y:e.y+e.aim.y*d});
const tgt=(e,r)=>foes(e).filter(t=>dist(e,t)<=r+(t.rad||R)).sort((a,b)=>dist(e,a)-dist(e,b))[0];
const near=(e,t,d)=>{const n=norm(e.x-t.x,e.y-t.y); e.x=t.x+n.x*(d||1.1); e.y=t.y+n.y*(d||1.1); clamp(e);};
const hop=(e,h)=>{ if(e.z<0.05) e.vz=Math.sqrt(2*G*h); };

const CH={
/* ───────── 전사 ───────── */
castor:{name:'흉성의 잔향, 카스토르',cls:'전사',grade:'고화',range:2.4,
  init:e=>{e.r={airs:0}}, hud:e=>(e.hp<=e.max/2?'열혈 · ':'')+'에어본 '+e.r.airs+'/16',
  emp:e=>e.hp<=e.max/2, cnt(e){ if(CH.castor.emp(e)) e.r.airs++; },
  skills:{
   n1:{name:'분화',cd:8,r:3,cast(e){ const E=CH.castor.emp(e); hop(e,3); S.line(e,3,15,'분화',{air:2,post:t=>{CH.castor.cnt(e); if(E) near(e,t);}}); }},
   n2:{name:'화천',cd:12,r:5,cast(e){ const E=CH.castor.emp(e); S.leap(e,moveDir(e),3,18,()=>S.circle(e,3,20,'화천',E?{air:4,post:()=>{CH.castor.cnt(e); hop(e,4);}}:null),true); }},
   aw:{name:'홍성화추',cd:30,r:6,cast(e){ const E=CH.castor.emp(e); hop(e,4); S.leap(e,moveDir(e),5,12,()=>S.circle(e,4,E?50:30,'홍성화추',{air:3,stun:E?1:0,post:()=>CH.castor.cnt(e)}),true); }},
   ult:{name:'적향혈창',cd:0,r:7,can:e=>CH.castor.emp(e)&&e.r.airs>=16,need:'열혈 + 에어본 16회',cast(e){ const E=CH.castor.emp(e); S.leap(e,moveDir(e),3,20,()=>{ S.line(e,6,t=>35+(t.hp>e.hp?15:0),'적향혈창'); if(E) after(.25,()=>{ if(!e.dead) S.circle(e,4,25,'적향혈창 (강화)',{stun:.5}); }); }); }}
  },note:'홍성화추의 돌진 거리는 카드에 없어 5칸으로 잡았다.'},
ei:{name:'견습 기사, 에이',cls:'전사',grade:'고화',range:2.4,
  init:e=>{e.r={healed:0,acc:0}}, hud:e=>'고취 회복 '+Math.floor(e.r.healed)+'/200',
  tick(e,dt){ if(e.hp<=e.max/2){ e.r.acc+=dt; if(e.r.acc>=1){ e.r.acc-=1; e.r.healed+=heal(e,1,true); } } },
  onKill(e){ e.r.healed+=heal(e,(e.max-e.hp)*.2); },
  skills:{
   n1:{name:'가로베기',cd:7,r:4,cast(e){ S.arc(e,4,12,'가로베기',{knock:.7}); }},
   n2:{name:'세로베기',cd:9,r:4,cast(e){ S.line(e,4,15,'세로베기',{air:2}); }},
   aw:{name:'기수 검식',kind:'일반',cd:25,r:4,cast(e){ S.circle(e,4,16,'기수 검식'); after(.25,()=>{ if(!e.dead) S.line(e,4,16,'기수 검식'); }); }},
   ult:{name:'기사의 검',cd:0,r:5,can:e=>e.r.healed>=200,need:'고취 회복 200',cast(e){ S.arc(e,5,28,'기사의 검',{knock:1.5}); after(.2,()=>{ if(!e.dead) S.leap(e,e.aim,5,22,()=>S.line(e,5,28,'기사의 검',{air:6})); }); }}
  },note:'고취의 처치 회복은 5판 3선승에서만 쓰인다.'},
mente:{name:'공검사, 멘테',cls:'전사',grade:'고화',range:2.4,
  init:e=>{e.r={tae:0,proc:0,awT:0}}, hud:e=>(e.r.tae>now?'태도 · ':'')+'발동 '+e.r.proc+'/30',
  onCast(e,s){ if(s==='n1'||s==='n2') e.r.tae=now+1; },
  basicBonus(e,t){ if(e.r.tae>now){ e.r.proc++; proc(e,'태도','추가 피해 4'); damage(e,t,4,'태도'); air(t,.5); if(e.r.awT>now){ e.cd.n1=Math.max(0,e.cd.n1-1); e.cd.n2=Math.max(0,e.cd.n2-1); } } },
  skills:{
   n1:{name:'직검',cd:5,r:3.5,cast(e){ S.leap(e,moveDir(e),1,16,()=>S.circle(e,3,8,'직검'),true); }},
   n2:{name:'세검',cd:6,r:4,cast(e){ S.leap(e,moveDir(e),2,16,()=>S.circle(e,3,10,'세검',{air:2})); }},
   aw:{name:'실력 발휘',cd:30,r:4,cast(e){ add(e,'resist',5,.1); e.r.awT=now+5; }},
   ult:{name:'공검 전사',cd:0,r:5,can:e=>e.r.proc>=30,need:'태도 30회',cast(e){ S.circle(e,5,40,'공검 전사',{knock:2}); add(e,'haste',8,.2); e.r.tae=now+8; }}
  }},
guillaume:{name:'광전사, 기욤',cls:'전사',grade:'고화',range:2.4,
  init:e=>{e.r={nb:0}}, hud:e=>'기본 공격 +'+Math.floor((1-e.hp/e.max)*10),
  basicBonus(e,t){ const b=Math.floor((1-e.hp/e.max)*10); if(b>0) damage(e,t,b,'광전사'); if(e.r.nb>now){ e.r.nb=0; damage(e,t,25,'완력'); } },
  skills:{
   n1:{name:'부척',cd:8,r:10,cast(e){ pay(e,20); S.proj(e,e.aim,{speed:20,range:12,dmg:t=>t.hp*.05+10,label:'부척',o:{post:()=>heal(e,30)}}); }},
   n2:{name:'완력',cd:12,r:3,cast(e){ for(let i=1;i<=4;i++) after(i,()=>{ if(!e.dead) pay(e,6); }); e.r.nb=now+4; }},
   aw:{name:'광맹 질주',cd:30,r:6,cast(e){ if(e.hp>e.max/2) pay(e,50); const x=e.hp<=e.max/2?.3:.1; add(e,'haste',5,x); add(e,'resist',5,x); }},
   ult:{name:'최후의 광란',cd:0,r:99,can:e=>e.hp<=24,need:'체력 24 이하',cast(e){ add(e,'resist',3,.9); e.free=now+3; }}
  }},
harmund:{name:'순백의 빙검, 하르문드',cls:'전사',grade:'고화',range:2.4,
  init:e=>{e.r={pcd:0,snow:0,ok:false}}, hud:e=>(e.r.snow>now?'설화 · ':'')+'빙설 '+(e.r.pcd>0?e.r.pcd.toFixed(0)+'s':'준비'),
  tick(e,dt){ if(e.r.pcd>0) e.r.pcd-=dt; },
  onDeal(e,t,amt,label,o){ if(t.dead) return; const fr=has(t,'freeze'); if(fr&&o&&o.cold) add(t,'weak',1,1);
    if(e.r.pcd<=0&&(o&&(o.basic||o.skill))&&t.st.some(s=>['slow','root','silence','stun','weak','freeze'].includes(s.k))){ e.r.pcd=10; proc(e,'빙설','빙결'); if(fr) e.r.ok=true; add(t,'weak',1,1); add(t,'freeze',1,0,{end:()=>damage(e,t,10,'빙결',{cold:true})}); } },
  skills:{
   n1:{name:'백설',cd:9,r:3,cast(e){ S.arc(e,3,12,'백설'); after(.2,()=>{ if(!e.dead) S.circle(e,3,12,'백설 (냉기)',{cold:true}); }); if(e.r.snow>now) add(e,'haste',2,.2); }},
   n2:{name:'서리검',cd:12,r:8,can:e=>!!tgt(e,8),need:'8칸 안의 적',cast(e){ const t=tgt(e,8),p={x:t.x,y:t.y,z:0},E=e.r.snow>now; fx.push({k:'circle',x:p.x,y:p.y,r:2.5,t0:now,team:e.team,dur:.5});
        after(.45,()=>{ if(e.dead) return; S.circle(e,2.5,18,'서리검',{cold:true,post:t2=>{ if(Math.hypot(t2.x-p.x,t2.y-p.y)<=1){ add(t2,'root',1); damage(e,t2,10,'서리검 (정중앙)',{cold:true}); } if(E) e.r.pcd=0; }},p); }); }},
   aw:{name:'백색 설국',cd:30,r:8,cast(e){ e.r.snow=now+3; add(e,'stealth',3); const t=tgt(e,99); zone(e,{x:e.x,y:e.y,r:2,dur:3,every:1,chase:t,speed:4.5,label:'설국',tick:(z,inn)=>inn.forEach(x=>{ damage(e,x,15,'백색 설국',{cold:true}); add(x,'silence',1); })}); }},
   ult:{name:'빙극 설경',kind:'궁극',cd:0,r:5,can:e=>e.r.ok,need:'빙결된 적에게 빙설',cast(e){ const hit=S.arc(e,6,25,'빙극 설경',{cold:true,slow:[.3,1]}); after(.4,()=>{ if(e.dead) return; const t=hit[0]||tgt(e,6); const p=t?{x:t.x,y:t.y,z:0}:front(e,3); S.circle(e,3,40,'빙극 설경 (빙하검)',{root:.5,post:x=>{ if(has(x,'freeze')) add(x,'weak',2,2); }},p); }); }}
  },note:'서리검은 8칸 안의 적이 선 자리에 0.45초 뒤 떨어진다. 설국은 초당 4.5칸으로 적을 따라간다. 쇠약은 기본 공격 -4, 스킬 -2(크게는 두 배).'},
manannan:{name:'제국의 검, 마나난',cls:'전사',grade:'서사',range:2.4,
  init:e=>{e.r={sim:0,step:0,gp:null}}, hud:e=>'심검 '+e.r.sim+'/20',
  ganpa(e,slot){ e.r.sim++; e.cd[slot]=0; e.r.gp=null; proc(e,'간파','심검 '+e.r.sim); },
  onCast(e,slot){ if(slot==='n1'||slot==='n2') e.r.gp={slot,t:now,hurt:0}; },
  onHurt(e){ const g=e.r.gp; if(!g) return; if(g.slot==='n2'&&now-g.t<=0.5) CH.manannan.ganpa(e,'n2'); else if(g.slot==='n1'&&now-g.t<=3) g.hurt=now; },
  onBasic(e){ const g=e.r.gp; if(g&&g.slot==='n1'&&g.hurt&&now-g.hurt<=0.3) CH.manannan.ganpa(e,'n1'); },
  skills:{
   n1:{name:'제식 검술',cd:4,r:3,cast(e){ const k=e.r.step++%3; if(k===0) S.arc(e,3,8,'제식 검술'); else if(k===1) S.circle(e,3,10,'제식 검술'); else S.line(e,3,14,'제식 검술'); }},
   n2:{name:'검명',cd:12,ai:(e,d)=>d>3&&d<=7,cast(e){ const dir=moveDir(e),p0=S.blink(e,dir,6); S.seg(e,p0,{x:e.x,y:e.y},1.4,18,'검명'); }},
   aw:{name:'검의 대가',cd:45,r:4,cast(e){ S.arc(e,4,30,'검의 대가').forEach(t=>{ if(t.dead) return; near(e,t); add(t,'silence',1,0,{end:()=>damage(e,t,3*e.r.sim,'검의 대가 (3 x 심검)')}); }); }},
   ult:{name:'심상의 검',cd:0,r:4,can:e=>e.r.sim>=20,need:'심검 20',cast(e){ e.r.sim=0; S.focus(e,1); for(let i=0;i<9;i++) after(1+i*0.1,()=>{ if(!e.dead) S.line(e,4,10,'심상의 검'); }); }}
  },note:"'간파'(제식 검술)는 시전 뒤 3초 안에 맞고, 맞은 뒤 0.3초 안에 기본 공격하면 발동으로 읽었다. 3초는 카드에 없다."},
simon:{name:'맨손 기사님, 시먼',cls:'전사',grade:'서사',range:1.8,
  init:e=>{e.r={c1:0,c2:0,emp:false}}, hud:e=>'되치기 '+e.r.c1+' · 메치기 '+e.r.c2+(e.r.emp?' · 강화':''),
  held(e){ return foes(e).find(t=>{const g=has(t,'grab'); return g&&g.by===e;}); },
  onBasicTry(e){ e.cd.crouch=Math.max(0,e.cd.crouch-2); },
  skills:{
   crouch:{name:'붙들기',cd:9,r:2,cast(e){ const hit=S.line(e,2,0,'붙들기'); if(hit[0]){ add(hit[0],'grab',1,0,{by:e}); proc(e,'붙들기','붙잡음'); } }},
   n1:{name:'되치기',cd:8,r:99,can:e=>!!CH.simon.held(e),need:'붙잡았을 때',cast(e){ const t=CH.simon.held(e); if(!t) return; e.r.c1++; e.swingT=now; e.swingN=(e.swingN||0)+1; strike(e,t,24,'되치기',{air:1});
        if(e.r.emp){ e.r.emp=false; after(.3,()=>{ if(e.dead||t.dead) return; near(t,e,1); for(let i=0;i<5;i++) after(i*0.1,()=>{ if(!t.dead){ e.swingT=now; e.swingN=(e.swingN||0)+1; strike(e,t,6.4,'되치기 강화',i===4?{knock:3}:null); } }); }); } }},
   n2:{name:'메치기',cd:13,r:99,can:e=>!!CH.simon.held(e),need:'붙잡았을 때',cast(e){ const t=CH.simon.held(e); if(!t) return; const m=e.r.emp?2:1; e.r.emp=false; e.r.c2++; strike(e,t,28*m,m>1?'메치기 강화':'메치기',{stun:.75*m}); }},
   aw:{name:'거인의 힘',cd:30,ai:(e,d)=>d<=3&&(e.cd.n1>0||e.cd.n2>0),cast(e){ e.cd.n1=0; e.cd.n2=0; e.r.emp=true; say(e,'강화','#7fe3b5'); }},
   ult:{name:'뒤집어치기',cd:0,r:99,can:e=>e.r.c1>=6&&e.r.c2>=6&&!!CH.simon.held(e),need:'각 6회 + 붙잡음',cast(e){ const t=CH.simon.held(e); if(!t) return; air(t,7); const at=airtime(7); e.busy=now+at; near(e,t,.9); e.vz=Math.sqrt(2*G*6);
        after(at,()=>{ if(!e.dead) S.circle(e,4,70,'뒤집어치기',{stun:1},{x:t.x,y:t.y,z:0}); }); }}
  },note:'붙들기는 웅크리기 단추. 붙잡힌 적은 1초 동안 못 움직인다.'},
/* ───────── 수호자 ───────── */
ginan:{name:'엘리아의 성기사, 기난',cls:'수호자',grade:'고화',range:2.4,
  init:e=>{e.r={zn:null,scd:0,t:0,forced:0,hb:0}}, hud:e=>(CH.ginan.inn(e)?'성역 안 · ':'')+'지속 '+Math.floor(e.r.t)+'/30초',
  inn:e=>e.r.forced>now||(e.r.zn&&e.r.zn.until>now&&Math.hypot(e.x-e.r.zn.x,e.y-e.r.zn.y)<=5),
  tick(e,dt){ if(e.r.scd>0) e.r.scd-=dt; if(e.r.zn&&e.r.zn.until>now&&Math.hypot(e.x-e.r.zn.x,e.y-e.r.zn.y)<=5&&inFight(e)) e.r.t+=dt; },
  onHurt(e){ if(e.r.scd<=0){ e.r.scd=9; proc(e,'성역','3초 전개'); e.r.zn=zone(e,{x:e.x,y:e.y,r:5,dur:3,every:.25,label:'성역',tick:(z,inn)=>inn.forEach(t=>add(t,'slow',.35,.2))}); } },
  basicBonus(e){ if(e.r.hb>now){ e.r.hb=0; heal(e,8); } },
  skills:{
   n1:{name:'심판',cd:7,r:4,can:e=>!!tgt(e,4),need:'4칸 안의 적',cast(e){ const t=tgt(e,4); near(t,e,1.1); say(t,'끌당','#f0b458'); if(CH.ginan.inn(e)) e.r.hb=now+3; }},
   n2:{name:'가호',cd:9,r:3.5,cast(e){ shield(e,20,2); if(CH.ginan.inn(e)) S.circle(e,3,0,'가호',{root:.5}); }},
   aw:{name:'신성 충격',cd:30,r:5,cast(e){ const was=CH.ginan.inn(e); add(e,'resist',4,.2); e.r.forced=now+4; if(was) S.circle(e,5,0,'신성 충격',{air:3,stun:.75}); }},
   ult:{name:'성자의 역장',cd:0,r:5,can:e=>e.r.t>=30,need:'성역 안 전투 30초',cast(e){ shield(e,30,5); zone(e,{x:e.x,y:e.y,r:5,dur:5,every:1,label:'역장',tick:(z,inn)=>inn.forEach(t=>{ air(t,1); knock(t,z,1); })}); }}
  },note:'성역은 맞을 때 9초에 한 번 그 자리에 3초 펼쳐진다. 역장의 아군 기동력 증가는 1대1이라 빠진다.'},
janet:{name:'왕국의 위상, 자넷',cls:'수호자',grade:'고화',range:2.4,
  init:e=>{e.r={red:0,x2:0}}, hud:e=>'경감 '+Math.floor(e.r.red)+'/50',
  faced:(e,t)=>{const f=has(t,'face'); return f&&f.by===e;},
  onDeal(e,t){ if(!t.dead){ if(!has(t,'face')) proc(e,'대면','5초'); rm(t,'face'); add(t,'face',5,0,{by:e}); } },
  modTake(e,src,amt){ if(src!==e&&CH.janet.faced(e,src)){ const c=Math.min(amt,e.r.x2>now?2:1); e.r.red+=c; return amt-c; } return amt; },
  skills:{
   n1:{name:'깃창',cd:9,r:4,cast(e){ const f=foes(e).filter(t=>CH.janet.faced(e,t)); S.line(e,4,15,'깃창',{post:t=>{ if(f.includes(t)){ air(t,1); S.leap(e,e.aim,3,18); } }}); }},
   n2:{name:'호전성',cd:12,r:4,cast(e){ const a=foes(e).filter(t=>dist(e,t)<=4+R); fx.push({k:'circle',x:e.x,y:e.y,r:4,t0:now,team:e.team,lab:'호전성',src:e}); if(a.length) shield(e,10*a.length,3); a.forEach(t=>{ if(CH.janet.faced(e,t)) add(t,'slow',2,.2); }); }},
   aw:{name:'결투 개시',cd:30,r:6,can:e=>foes(e).some(t=>CH.janet.faced(e,t)&&dist(e,t)<=6),need:'대면한 적 (6칸)',cast(e){ const t=foes(e).find(t=>CH.janet.faced(e,t)); S.leap(e,norm(t.x-e.x,t.y-e.y),Math.max(0,dist(e,t)-1.1),22,()=>{ if(!t.dead) strike(e,t,30,'결투 개시',{disarm:1}); }); }},
   ult:{name:'왕국의 명예',cd:0,r:6,can:e=>e.r.red>=50,need:'대면 경감 50',cast(e){ shield(e,80,6); e.r.x2=now+6; add(e,'weak',6,1); }}
  },note:'결투 개시의 "다른 적 공격 무시"는 1대1이라 빠진다.'},
kerker:{name:'원시의 고동, 커커',cls:'수호자',grade:'고화',range:2.4,
  init:e=>{e.r={st:null,n:0,proc:0,ut:0}}, hud:e=>(e.r.st||'태세 없음')+' · 발동 '+e.r.proc+'/30',
  onCast(e,s){ const m={n1:'멧돼지',n2:'원숭이',aw:'고대 짐승'}[s]; if(m){ e.r.st=m; e.r.n=0; } },
  onBasic(e,hit){ if(!hit.length||!e.r.st) return; const m=e.r.ut>now?2:1; e.r.n++;
    if(e.r.st==='멧돼지'&&e.r.n%3===0){ e.r.proc++; proc(e,'태세','멧돼지 회복'); for(let i=1;i<=2;i++) after(i,()=>heal(e,2*m)); }
    if(e.r.st==='원숭이'&&e.r.n%2===0){ e.r.proc++; proc(e,'태세','원숭이 +6'); hit.forEach(t=>{ damage(e,t,6*m,'태세 (원숭이)'); knock(t,e,1); }); }
    if(e.r.st==='고대 짐승'){ e.r.proc++; proc(e,'태세','고대 짐승 -1초'); e.cd.aw=Math.max(0,e.cd.aw-1*m); } },
  skills:{
   n1:{name:'멧돼지',cd:7,ai:e=>e.hp<e.max,cast(e){ for(let i=1;i<=4;i++) after(i,()=>heal(e,2)); }},
   n2:{name:'원숭이',cd:7,r:8,cast(e){ add(e,'haste',2,.2); }},
   aw:{name:'고대 짐승',cd:30,r:4,cast(e){ add(e,'slow',5,.25); shield(e,50,5); }},
   ult:{name:'원시의 힘',cd:0,r:6,can:e=>e.r.proc>=30,need:'태세 30회',cast(e){ add(e,'resist',10,.2); e.r.ut=now+10; }}
  },note:'고대 짐승의 보호막 지속은 카드에 없어 5초(둔화와 같은 시간)로 잡았다.'},
ross:{name:'사명의 기사, 로스',cls:'수호자',grade:'고화',range:2.4,
  init:e=>{e.r={acc:0,adv:0,exec:false,rival:null,rivalT:0}}, hud:e=>(e.r.adv>now?'진격 · ':'')+'무훈',
  tick(e,dt){ e.r.acc+=dt; if(e.r.acc>=5){ e.r.acc-=5; if(heal(e,5)>0) proc(e,'무훈','체력 +5'); } },
  basicBonus(e,t){ if(e.r.adv>now){ e.r.adv=0; damage(e,t,16,'진격 (추가 피해)'); } },
  onHurt(e,src){ if(e.r.rivalT>now&&src===e.r.rival) e.cd.aw=Math.max(0,e.cd.aw-1); },
  skills:{
   n1:{name:'진격',cd:8,r:3.5,cast(e){ shield(e,8,2); e.r.adv=now+3; }},
   n2:{name:'기수식',cd:12,ai:(e,d)=>d<=4&&Math.random()<.5,cast(e){ shield(e,20,1); add(e,'resist',1,.2); }},
   aw:{name:'정의 집행',cd:30,r:4,can:e=>!!tgt(e,4),need:'4칸 안의 적',cast(e){ const t=tgt(e,4); fx.push({k:'circle',x:t.x,y:t.y,r:1,t0:now,team:e.team,dur:1.5,lab:'정의 집행',src:e,fol:t}); say(t,'정의 집행','#f0b458');
        after(1.5,()=>{ if(e.dead||t.dead) return; damage(e,t,30,'정의 집행'); if(t.dead){ e.r.exec=true; return; } damage(e,t,(t.max-t.hp)*.2,'정의 집행 (잃체비)'); }); }},
   ult:{name:'사명의 부름',cd:0,r:10,can:e=>e.r.exec,need:'정의 집행 처치',cast(e){ e.r.exec=false; const t=tgt(e,10); if(t){ e.r.rival=t; e.r.rivalT=now+12; say(t,'숙적','#f0b458'); } }}
  },note:'무훈의 "전투 중"은 판 내내로 봤다. 사명의 부름은 정의 집행으로 처치해야 열려서 5판 3선승에서만 쓸 수 있다.'},
milio:{name:'조용한 긍지, 밀리오',cls:'수호자',grade:'전설',range:2.4,
  init:e=>{e.r={inst:0}}, hud:e=>'본능 '+e.r.inst+'/24',
  onSkillHit(e,t){ if(!t.dead&&!has(t,'gap')) add(t,'gap',1); },
  onBasic(e,hit){ for(const t of hit){ const g=has(t,'gap'); if(!g) continue; proc(e,'본능','보호막 4'); shield(e,4,1); e.r.inst++; if(g.v!=='perm') rm(t,'gap'); knock(t,e,-0.7); } },
  skills:{
   n1:{name:'격세',cd:8,r:3,cast(e){ const p={x:e.x,y:e.y,z:0}; S.circle(e,3,8,'격세',{slow:[.2,1]}); after(1,()=>{ if(!e.dead) S.circle(e,3,t=>t.max*0.03,'격세 (폭발)',null,p); }); }},
   n2:{name:'판명',cd:14,r:8,cast(e){ const t0=now,o={pre:t=>{ if(has(t,'gap')) add(t,'stun',.5); }};
        S.proj(e,e.aim,{speed:16,range:8,dmg:12,label:'판명',pierce:true,o,big:true,onEnd:p=>after(Math.max(0,1-(now-t0)),()=>{ if(e.dead) return; const d=Math.hypot(e.x-p.x,e.y-p.y); if(d<.3) return; const n=norm(e.x-p.x,e.y-p.y);
          projs.push({x:p.x,y:p.y,z:p.z,vx:n.x*16,vy:n.y*16,left:d,owner:e,hit:new Set(),dmg:12,label:'판명 (돌아옴)',pierce:true,o,big:true}); })}); }},
   aw:{name:'기선 제압',cd:30,r:5,cast(e){ S.focus(e,1); const cnt=new Map(); after(1,()=>{ if(e.dead) return; const dir=moveDir(e); e.dash={vx:dir.x*5,vy:dir.y*5,until:now+3};
        for(let i=1;i<=6;i++) after(i*0.5,()=>{ if(e.dead) return; S.circle(e,3,6,'기선 제압',{slow:[.5,1]}).forEach(t=>{ add(t,'nojump',1); cnt.set(t,(cnt.get(t)||0)+1); }); if(i===6) cnt.forEach((n,t)=>{ if(n>=4) add(t,'stun',1); }); }); }); }},
   ult:{name:'긍지의 길',cd:0,r:99,can:e=>e.r.inst>=24,need:'본능 24회',cast(e){ e.r.inst=0; S.focus(e,3); after(3,()=>{ if(e.dead) return; add(e,'haste',9,.2); e.cd.n1=0; e.cd.n2=0; fx.push({k:'circle',x:e.x,y:e.y,r:15,t0:now,team:e.team});
        foes(e).forEach(t=>{ if(dist(e,t)<=15+R){ rm(t,'gap'); add(t,'gap',9,'perm'); } }); }); }}
  },note:'기선 제압의 돌진은 초당 5칸으로 3초(1칸x15). 긍지의 길의 기동력 증가는 9초로 잡았다.'},
/* ───────── 마법사 ───────── */
plaus:{name:'세계수의 묘목, 플라우스',cls:'마법사',grade:'고화',range:8,
  init:e=>{e.r={ji:0,form:false,ft:0,sp:0,acc:0}}, hud:e=>'지력 '+Math.floor(e.r.ji)+(e.r.form?' · 자연체':'')+' · 정령 '+e.r.sp+'/12',
  speedMod:e=>e.r.form?.3:1, modTake:(e,src,amt)=>e.r.form?amt*.9:amt,
  tick(e,dt){ if(e.r.form){ e.r.ji=Math.min(100,e.r.ji+5*dt); e.r.ft+=dt; e.r.acc+=dt; if(e.r.acc>=1){ e.r.acc-=1; heal(e,.5,true); } } },
  skills:{
   crouch:{name:'자연체',cd:.3,ai:(e,d)=>e.r.form?(e.r.ji>=90||d<4):(e.r.ji<25&&d>5),cast(e){ e.r.form=!e.r.form; }},
   n1:{name:'나뭇잎',cd:4,r:12,can:e=>e.r.ji>=25,need:'지력 25',cast(e){ e.r.ji-=25; S.proj(e,e.aim,{speed:20,range:14,dmg:20,label:'나뭇잎',o:{knock:1,post:t=>add(t,'spirit',4)}}); }},
   n2:{name:'뿌리',cd:8,r:10,can:e=>e.r.ji>=40&&e.z<.05,need:'지력 40 · 지상',cast(e){ e.r.ji-=40; S.proj(e,e.aim,{speed:16,range:12,z:0,dmg:30,label:'뿌리',big:true,o:{knock:1,post:t=>{ if(has(t,'spirit')){ e.r.sp++; damage(e,t,10,'뿌리 (정령)'); add(t,'root',1); } }}}); }},
   aw:{name:'자연의 힘',cd:30,r:9,can:e=>e.r.ji>=20&&e.z<.05,need:'지력 · 지상',cast(e){ const u=e.r.ji; e.r.ji=0; S.focus(e,.5); after(.5,()=>{ if(e.dead) return; S.circle(e,3,0,'자연의 힘',{root:1}); S.line(e,10,t=>{ const sp=has(t,'spirit'); if(sp) e.r.sp++; return u/2*(sp?2:1); },'자연의 힘 (레이저)'); }); }},
   ult:{name:'생명의 샘',cd:0,r:6,can:e=>e.r.ft>=90&&e.r.sp>=12&&e.r.ji>=10&&e.z<.05,need:'자연체 90초 + 정령 12회',cast(e){ const u=e.r.ji; e.r.ji=0; S.focus(e,2); after(2,()=>{ if(e.dead) return; zone(e,{x:e.x,y:e.y,r:6,dur:u/10,every:1,label:'생명의 샘',tick:(z,inn)=>{ heal(e,6); inn.forEach(t=>{ const sp=has(t,'spirit'); damage(e,t,sp?10:5,'생명의 샘'); add(t,'dealdown',1,sp?.2:.1); }); }}); }); }}
  },note:'자연체는 웅크리기 단추로 켜고 끈다. 켜 둔 동안 이동이 30%로 준다(마인크래프트 웅크리기 속도). 자연의 힘은 지력 20부터 쓰게 했다.'},
epoch:{name:'기계공학자, 에포크',cls:'마법사',grade:'고화',range:7,
  init:e=>{e.r={casts:0,emp:false}}, hud:e=>(inFight(e)?'증명':'실험')+' · 시전 '+e.r.casts+'/12'+(e.r.emp?' · 강화':''),
  tick(e,dt){ if(!inFight(e)) for(const k in e.cd) if(k!=='b'&&e.cd[k]>0) e.cd[k]=Math.max(0,e.cd[k]-dt); },
  modTake:(e,src,amt)=>inFight(e)?amt:amt*1.25,
  onCast(e,s){ if(s!=='crouch') e.r.casts++; },
  onSkillHit(e){ if(inFight(e)){ proc(e,'스팀펑크','증명 -2초'); for(const k of ['n1','n2','aw']) e.cd[k]=Math.max(0,e.cd[k]-2); } },
  bomb(e,p){ fx.push({k:'circle',x:p.x,y:p.y,r:.5,t0:now,team:e.team,dur:3}); after(3,()=>{ if(!e.dead) S.circle(e,2.5,30,'폭약',{knock:2},p); }); },
  skills:{
   n1:{name:'엔진',cd:7,r:10,cast(e){ const E=e.r.emp; e.r.emp=false; const p={x:e.x,y:e.y},a={x:e.aim.x,y:e.aim.y}; fx.push({k:'circle',x:p.x,y:p.y,r:.6,t0:now,team:e.team,dur:2});
        after(2,()=>{ if(!e.dead) S.seg(e,p,{x:p.x+a.x*12,y:p.y+a.y*12},E?3:1.4,25,'엔진',E?{stun:1}:null); }); }},
   n2:{name:'폭약',cd:8,r:7,cast(e){ const E=e.r.emp; e.r.emp=false; const t=tgt(e,99),d=Math.min(5,t?dist(e,t):5),a=e.aim; CH.epoch.bomb(e,{x:e.x+a.x*d,y:e.y+a.y*d,z:0});
        if(E){ [[-a.y,a.x],[a.y,-a.x],[-a.x,-a.y]].forEach(v=>CH.epoch.bomb(e,{x:e.x+v[0]*3,y:e.y+v[1]*3,z:0})); S.leap(e,moveDir(e),7); } }},
   aw:{name:'기계혁명',cd:30,r:10,cast(e){ e.r.emp=true; }},
   ult:{name:'자동화 공정',cd:0,r:12,can:e=>e.r.casts>=12&&inFight(e),need:'시전 12회 + 증명',cast(e){ add(e,'slow',3,.5); add(e,'vuln',3,.5); after(3,()=>{ for(let i=0;i<8;i++) after(i*.2,()=>{ if(e.dead) return; const t=tgt(e,99); const a=i*Math.PI/4;
          S.proj(e,{x:Math.cos(a),y:Math.sin(a)},{speed:6.5,range:26,home:t,dmg:0,label:'로봇',big:true,nohit:true,life:4,onEnd:p=>S.circle(e,1.5,12,'자동화 공정',{air:1},{x:p.x,y:p.y,z:0})}); }); }); }}
  },note:'폭약은 최대 5칸 앞(적이 더 가까우면 적이 선 자리)에 던진다. 로봇은 초당 6.5칸으로 적을 따라가다 4초 뒤(또는 닿으면) 터진다. 전투 중 = 5초 안에 피해를 주고받음.'},
vira:{name:'마탑 엘리트, 비라',cls:'마법사',grade:'고화',range:7,steady:true,
  init:e=>{e.r={hits:0,lv:false}}, hud:e=>'적중 '+e.r.hits+'/50',
  onSkillHit(e){ e.r.hits++; },
  skills:{
   n1:{name:'매직 볼트',cd:6,r:10,cast(e){ S.chant(e,1); after(1,()=>{ if(e.dead) return; const L=e.r.lv; e.r.lv=false; const t=tgt(e,99),p=t?{x:t.x,y:t.y,z:0}:front(e,4); S.circle(e,L?3:2,L?60:20,L?'레벨 업 (볼트)':'매직 볼트',L?{stun:1}:null,p); }); }},
   n2:{name:'매직 샤드',cd:8,r:10,cast(e){ S.chant(e,1.5); after(1.5,()=>{ if(e.dead) return; const L=e.r.lv; e.r.lv=false; const a0=Math.atan2(e.aim.y,e.aim.x); for(let i=-2;i<=2;i++){ const a=a0+i*.12; S.proj(e,{x:Math.cos(a),y:Math.sin(a)},{speed:22,range:14,dmg:L?14:5,label:L?'레벨 업 (샤드)':'매직 샤드',o:{knock:L?.8:.3}}); } }); }},
   aw:{name:'매직 펌프',kind:'일반',cd:25,r:5,cast(e){ S.chant(e,2); after(2,()=>{ if(e.dead) return; const L=e.r.lv; e.r.lv=false; S.circle(e,5,L?80:35,L?'레벨 업 (펌프)':'매직 펌프',{air:L?6:3}); }); }},
   ult:{name:'레벨 업',cd:0,r:99,whileChant:true,can:e=>e.r.hits>=50&&e.chant>now,need:'적중 50회 + 영창 중',cast(e){ e.r.lv=true; say(e,'레벨 업','#7fe3b5'); }}
  },note:'병렬 영창: 정신 집중 중에도 걸을 수 있고, 그동안 둔화와 기동력 증감을 받지 않는다. 볼트는 영창이 끝날 때 적이 선 자리에 떨어진다. 샤드는 5발이 5씩(합 25).'},
/* ───────── 암살자 ───────── */
margrita:{name:'증오의 번제, 마그리타',cls:'암살자',grade:'고화',range:3,
  init:e=>{e.r={am:4,ra:0,nk:0,ut:0,bd:0,last:null}}, hud:e=>'탄환 '+e.r.am+(e.r.nk>now?' (나락)':'')+' · 멸화 피해 '+Math.floor(e.r.bd)+'/400',
  tick(e){ if(e.r.am<=0&&e.r.ra&&now>=e.r.ra){ e.r.am=4; e.r.ra=0; } },
  onDeal(e,t,amt){ if(has(t,'scorch')) e.r.bd+=amt; },
  altBasic(e){ if(e.cd.b>0) return true; if(e.r.am<=0) return true; const U=e.r.ut>now,N=e.r.nk>now; e.cd.b=U?.25:.5; e.r.am--; e.shotT=now; shotSnd(e);
    const hit=S.arc(e,U?8:4,(N?45:25)*(U?2:1),N?'나락의 탄환':'원념',{half:25,basic:true}); if(hit[0]) e.r.last=hit[0];
    if(e.r.am<=0){ proc(e,'원념','4초 장전'); if(U&&e.r.last&&!e.r.last.dead){ const t=e.r.last; damage(e,t,t.hp*.15,'신진화멸 (현체비)'); } e.r.nk=0; e.r.ut=0; e.r.ra=now+4; } return true; },
  skills:{
   n1:{name:'열원',cd:12,r:3.5,cast(e){ e.r.am=4; e.r.ra=0; e.r.nk=0; add(e,'haste',3,.2); for(let i=1;i<=3;i++) after(i,()=>{ if(!e.dead) S.circle(e,3,8,'열원',{post:t=>add(t,'scorch',2)}); }); }},
   n2:{name:'쇄염',cd:16,ai:(e,d)=>d>3&&d<=9,cast(e){ let got=false; S.proj(e,e.aim,{speed:26,range:8,dmg:0,label:'쇄염',nohit:true,touch:t=>{ got=true; S.leap(e,norm(t.x-e.x,t.y-e.y),Math.max(0,dist(e,t)-1),24,()=>{ if(!t.dead) strike(e,t,20,'쇄염'); },true); },onEnd:()=>{ if(!got&&!e.dead) S.leap(e,e.aim,4,24,null,true); }}); }},
   aw:{name:'폭렬 화구',cd:45,r:4,cast(e){ S.arc(e,4,t=>t.hp*.05,'폭렬 화구 (현체비)',{post:t=>add(t,'scorch',5)}); after(.18,()=>{ if(!e.dead) S.arc(e,4,t=>t.hp*.05,'폭렬 화구 (현체비)'); }); e.r.am=4; e.r.ra=0; e.r.nk=now+6; }},
   ult:{name:'신진화멸',cd:0,r:8,can:e=>e.r.bd>=400,need:'멸화 피해 400',cast(e){ e.r.am=8; e.r.ra=0; e.r.ut=now+5; }}
  },note:'기본기 단추가 산탄총이다(0.5초). 멸화에 걸린 쪽은 화면 위아래가 타오른다. 폭렬 화구는 2타가 현재 체력 5%씩이다.'},
john:{name:'좀도둑, 존',cls:'암살자',grade:'고화',range:2.4,
  init:e=>{e.r={streak:0,rat:0,steal:false,hand:0}}, hud:e=>(has(e,'stealth')?'은신 · ':'')+'기습 연속 '+e.r.streak+'/3',
  altBasic(e){ if(!has(e,'stealth')) return false; if(e.cd.b>0) return true; e.cd.b=CFG.atkInt; const R2=e.r.rat>now; S.focus(e,R2?.5:1);
    after(R2?.5:1,()=>{ if(e.dead) return; rm(e,'stealth'); e.swingT=now; const st=e.r.steal; e.r.steal=false; const hit=S.line(e,3,48,'기습',st?{slow:[.5,4],post:t=>{ for(const k in t.cd) if(k!=='b') t.cd[k]+=6; }}:null);
      if(hit.length&&R2) e.r.streak++; else if(!hit.length) e.r.streak=0; }); return true; },
  skills:{
   n1:{name:'손짓',cd:10,r:7,cast(e){ add(e,'stealth',2); add(e,'slow',2,.7); e.r.hand=now+2; }},
   crouch:{name:'후퇴',cd:.5,can:e=>e.r.hand>now&&!!has(e,'stealth'),need:'손짓 은신 중',ai:()=>false,cast(e){ rm(e,'stealth'); rm(e,'slow'); e.r.hand=0; S.leap(e,{x:-e.aim.x,y:-e.aim.y},4); }},
   n2:{name:'도주',cd:18,r:8,cast(e){ add(e,'stealth',2); S.leap(e,moveDir(e),7); }},
   aw:{name:'시궁창 쥐',cd:30,r:8,cast(e){ add(e,'stealth',5); e.r.rat=now+5; }},
   ult:{name:'도둑질',cd:0,r:8,can:e=>e.r.streak>=3,need:'쥐 상태 기습 3연속',cast(e){ add(e,'stealth',2,'abs'); e.r.steal=true; }}
  },note:'은신 중에는 상대의 조준이 따라오지 않고, 화면에서 흐리게 보인다. 은신 중 기본기 단추가 기습(1초 집중 뒤 48 피해)이다.'},
kur:{name:'분방한 늑대, 쿠르',cls:'암살자',grade:'고화',range:2.4,
  init:e=>{e.r={pcd:0,kill:false}}, hud:e=>'낭고 '+(e.r.pcd>0?e.r.pcd.toFixed(0)+'s':'준비'),
  tick(e,dt){ if(e.r.pcd>0) e.r.pcd-=dt; },
  onDeal(e,t,amt,label,o){ if(o&&(o.basic||o.skill)&&aired(t)) e.r.pcd=Math.max(0,e.r.pcd-2); },
  basicBonus(e,t){ if(e.r.pcd<=0){ e.r.pcd=8; proc(e,'낭고','+8 · 밀침'); damage(e,t,8,'낭고'); knock(t,e,.7); } },
  skills:{
   n1:{name:'낭랑',cd:10,r:3,cast(e){ for(let i=0;i<4;i++) after(i*.08,()=>{ if(!e.dead){ e.swingT=now; S.arc(e,3,5,'낭랑'); } }); }},
   n2:{name:'낭파',cd:14,r:5,cast(e){ S.line(e,5,24,'낭파',{slow:[.2,2]}); }},
   aw:{name:'낭아 질주',cd:30,r:4,cast(e){ const up=foes(e).filter(aired); const hit=S.arc(e,4,20,'낭아 질주'); hop(e,3); if(hit.some(t=>up.includes(t))) after(.25,()=>{ if(e.dead) return; S.arc(e,5,40,'낭아 질주 (공중)',{zfree:true}).forEach(t=>{ if(t.dead) e.r.kill=true; }); }); }},
   ult:{name:'낭고 풍랑',cd:0,r:6,can:e=>e.r.kill,need:'낭아 질주 처치',cast(e){ S.focus(e,1); after(1,()=>{ for(let i=0;i<9;i++) after(i*.1,()=>{ if(e.dead) return; const d=moveDir(e); e.x+=d.x; e.y+=d.y; clamp(e); S.circle(e,3,5,'낭고 풍랑'); if(i===8) S.arc(e,6,40,'낭고 풍랑'); }); }); }}
  },note:'낭고 풍랑은 낭아 질주로 처치해야 열려서 5판 3선승에서만 쓸 수 있다.'},
valtma:{name:'종족 사냥꾼, 발트마',cls:'암살자',grade:'고화',range:2.4,
  init:e=>{e.r={cnt:0,emp:false,used:false,bn:0,bt:0,up:0,hitAny:false,seen:{}}}, hud:e=>(e.r.emp?'강화 준비':'동태 '+e.r.cnt+'/3')+' · 직업 '+CH.valtma.need(e).filter(c=>e.r.seen[c]).length+'/'+CH.valtma.need(e).length,
  /* 사냥감 포착의 조건: 이 판의 상대 편에 있는 직업군 모두에게 한 번 이상 피해 */
  need:e=>[...new Set(ents.filter(o=>o.team!==e.team).map(o=>o.c.cls))], ok:e=>{ const L=CH.valtma.need(e); return L.length>0&&L.every(c=>e.r.seen[c]); },
  onCast(e,s){ if(!['n1','n2','aw'].includes(s)) return; if(e.r.used){ e.r.used=false; e.r.emp=false; e.cd[s]=0; } else if(++e.r.cnt>=3){ e.r.cnt=0; e.r.emp=true; proc(e,'동태','다음 스킬 강화'); } },
  take(e){ if(e.r.emp){ e.r.used=true; return true; } return false; },
  onDeal(e,t){ e.r.hitAny=true; e.r.seen[t.c.cls]=true; },
  onKill(e,t){ if(e.r.prey===t&&e.r.preyT>now) for(const k in e.cd) e.cd[k]=0; },
  basicBonus(e,t){ if(e.r.bt>now){ e.r.bt=0; damage(e,t,e.r.bn,'포승'); } if(e.r.up>now) damage(e,t,4,'사냥 본능'); },
  skills:{
   n1:{name:'포승',cd:9,r:4,can:e=>!!tgt(e,e.r.emp?7:4),need:'4칸 안의 적',cast(e){ const E=CH.valtma.take(e),t=tgt(e,E?7:4); near(e,t); e.r.bn=E?24:12; e.r.bt=now+2; }},
   n2:{name:'기세',cd:9,r:3,cast(e){ const E=CH.valtma.take(e); S.circle(e,3,8,'기세',E?{knock:2,stun:1}:{slow:[.33,1]}); }},
   aw:{name:'사냥 본능',cd:30,r:6,cast(e){ const E=CH.valtma.take(e); add(e,'haste',6,E?.4:.2); e.r.up=now+6; if(E) add(e,'stealth',2); }},
   ult:{name:'사냥감 포착',cd:0,r:5,can:e=>CH.valtma.ok(e)&&!!tgt(e,5),need:'상대 직업군 모두에게 피해 + 5칸 안',cast(e){ const t=tgt(e,5); add(t,'vuln',6,.3); add(t,'slow',6,.3); e.r.prey=t; e.r.preyT=now+6; say(t,'사냥감','#f0b458'); }}
  },note:'사냥감 포착의 조건(모든 직업군에게 피해)은 "이 판의 상대 편에 있는 직업군 모두에게 한 번 이상 피해"로 읽었다. 1대1에서는 상대 한 명을 맞히면 채워진다. 컴퓨터는 상대 체력이 절반 아래일 때만 쓴다.'},
clover:{name:'적청의 광대, 클로버',cls:'암살자',grade:'고화',range:2.4,
  init:e=>{e.r={last:null,lt:0,cnt:0}}, hud:e=>(e.r.lt>now?e.r.last+' · ':'')+'띄움·추락 '+e.r.cnt+'/30',
  onCast(e,s){ const m={n1:'바갈타크',n2:'타흘룸',aw:'적청 회회'}[s]; if(m){ e.r.last=m; e.r.lt=now+3; } },
  up(e,t,h){ air(t,h); e.r.cnt++; }, dn(e,t){ if(down(t)) e.r.cnt++; },
  basicBonus(e,t){ if(e.r.lt<=now) return; const m=e.r.last; const l0=e.r.lt; if(m==='바갈타크'&&aired(t)){ e.r.lt=0; damage(e,t,6,'높낮이'); CH.clover.dn(e,t); } else if(m==='타흘룸'&&!aired(t)){ e.r.lt=0; damage(e,t,6,'높낮이'); CH.clover.up(e,t,1); } else if(m==='적청 회회'){ e.r.lt=0; damage(e,t,11,'높낮이'); knock(t,e,1.5); } if(l0&&!e.r.lt) proc(e,'높낮이',m); },
  skills:{
   n1:{name:'바갈타크',cd:8,r:4,ai:(e,d)=>d<=4,cast(e){ S.arc(e,4,8,'바갈타크',{zfree:true,post:t=>{ if(aired(t)){ CH.clover.dn(e,t); damage(e,t,8,'바갈타크 (추락)'); } }}); }},
   n2:{name:'타흘룸',cd:8,r:4,cast(e){ S.arc(e,4,8,'타흘룸',{post:t=>{ if(!aired(t)){ CH.clover.up(e,t,2); damage(e,t,8,'타흘룸 (띄움)'); } }}); }},
   aw:{name:'적청 회회',cd:30,r:5,cast(e){ S.circle(e,5,24,'적청 회회',{post:t=>CH.clover.up(e,t,3)}); after(1.5,()=>{ if(!e.dead) S.circle(e,5,24,'적청 회회',{zfree:true,el:'blue',post:t=>CH.clover.dn(e,t)}); }); }},
   ult:{name:'목 떨구기',cd:0,r:4,can:e=>e.r.cnt>=30,need:'띄움·추락 30회',cast(e){ const hit=S.line(e,4,36,'목 떨구기',{post:t=>CH.clover.up(e,t,9)}); e.vz=Math.sqrt(2*G*9); after(airtime(9)/2,()=>{ if(e.dead) return; S.line(e,4,36,'목 떨구기',{zfree:true,el:'blue',post:t=>CH.clover.dn(e,t)}); }); }}
  },note:'낫 스킬은 떠 있는 적도 맞히도록 높이 제한을 풀었다(추락시키는 스킬이라).'},
/* ───────── 지원가 ───────── */
cornwall:{name:'성검사의 후예, 콘월',cls:'지원가',grade:'고화',range:2.4,
  init:e=>{e.r={acc:0}}, hud:()=>'기사 없음 (1대1)',
  tick(e,dt){ e.r.acc+=dt; if(e.r.acc>=6){ e.r.acc-=6; if(heal(e,4)>0) proc(e,'성검','체력 +4'); } },
  skills:{
   n1:{name:'맹세',cd:9,r:5,cast(e){ add(e,'resist',3,.1); }},
   n2:{name:'광휘',cd:12,r:4,cast(e){ S.circle(e,4,24,'광휘',{blind:1,knock:.7}); }},
   aw:{name:'빛의 잔재',cd:30,ai:(e,d)=>d<=4&&e.hp<e.max*.6,cast(e){ add(e,'invuln',1.5); }},
   ult:{name:'성검의 환상',cd:0,r:12,can:()=>false,need:'기사의 공격 30회',cast(e){ S.focus(e,3); after(3,()=>{ if(!e.dead) S.line(e,12,60,'성검의 환상',{silence:3}); }); }}
  },note:"'기사'로 서임할 아군이 없다. 6초마다 4 회복은 자신에게만 들어가고, 맹세의 주는 피해 증가와 궁극기 조건(기사의 공격 30회)은 1대1에서 채울 수 없다."},
eclia:{name:'순례의 역사, 에클리아',cls:'지원가',grade:'고화',range:2.4,
  init:e=>{e.r={lost:0,proc:0,big:false,ign:0,gt:0,gn:0}}, hud:e=>'희생 '+e.r.proc+'/7'+(e.r.big?' · 대의':''),
  modTake(e,src,amt){ if(e.r.ign>0){ e.r.ign--; say(e,'무시','#cfd6ff'); return 0; } return e.r.big?amt*1.25:amt; },
  onHurt(e,src,amt){ e.r.lost+=amt; while(e.r.lost>=e.max*.15){ e.r.lost-=e.max*.15; e.r.proc++; proc(e,'희생',e.r.proc+'회'); } if(e.r.gt>now&&e.r.gn<4){ e.r.gn++; heal(e,3); } },
  skills:{
   n1:{name:'간언',cd:12,r:4,cast(e){ shield(e,16,3); e.r.gt=now+3; e.r.gn=0; }},
   n2:{name:'선언',cd:15,r:8,cast(e){ add(e,'haste',4,.2); }},
   aw:{name:'순신성탄',cd:1,ai:e=>!e.r.big?e.hp>e.max*.7:e.hp<e.max*.45,cast(e){ if(!e.r.big){ pay(e,50); e.r.big=true; say(e,'대의','#f0b458'); } else { e.r.big=false; heal(e,(e.max-e.hp)*.2); e.cd.aw=30; } }},
   ult:{name:'순례의 고리',cd:0,ai:e=>e.hp<e.max*.3,can:e=>e.r.proc>=7,need:'희생 7회',cast(e){ e.hp=1; e.r.ign=3; }}
  },note:'아군에게 주는 효과(희생의 회복, 선언의 추가 피해, 대의의 저항, 고리의 회복)는 1대1이라 모두 빈다. 순신성탄은 한 번 누르면 대의, 다시 누르면 끝나며 그때부터 30초를 센다.'},
breck:{name:'섬뜩한 부두술, 브렉',cls:'지원가',grade:'고화',range:7,
  init:e=>{e.r={ju:0,amp:false,cc:0,alt:0}}, hud:e=>'주술 '+Math.floor(e.r.ju)+(e.r.amp?' · 증폭':'')+' · 상태이상 '+Math.floor(e.r.cc)+'/60초',
  tick(e,dt){ if(inFight(e)) e.r.ju=Math.min(80,e.r.ju+2*dt*(e.r.alt>now?1.5:1)); if(e.r.amp){ e.r.ju-=3*dt; if(e.r.ju<=0){ e.r.ju=0; e.r.amp=false; } }
    foes(e).forEach(t=>{ const s=has(t,'sick'); if(s){ s.v=(e.r.amp&&dist(e,t)<=7+R)?2:1; } if(t.st.some(x=>x.by===e)) e.r.cc+=dt; }); },
  skills:{
   crouch:{name:'부두술',cd:.3,ai:e=>!e.r.amp&&e.r.ju>40&&foes(e).some(t=>has(t,'sick')),cast(e){ e.r.amp=!e.r.amp; }},
   n1:{name:'저주인형',cd:9,r:8,can:e=>!!tgt(e,8),need:'8칸 안의 적',cast(e){ const t=tgt(e,8); S.circle(e,2,10,'저주인형',{post:x=>{ if(has(x,'sick')&&e.r.ju>=8){ e.r.ju-=8; add(x,'blind',1.5,0,{by:e}); } }},{x:t.x,y:t.y,z:0}); }},
   n2:{name:'의식용 칼',cd:12,r:11,can:e=>e.r.ju>=10,need:'주술 10',cast(e){ e.r.ju-=10; for(let i=0;i<2;i++) after(i*.12,()=>{ if(!e.dead) S.proj(e,e.aim,{speed:22,range:14,dmg:7,label:'의식용 칼',o:{post:t=>{ rm(t,'sick'); add(t,'sick',5,1,{by:e}); }}}); }); }},
   aw:{name:'강령 의식',cd:45,r:11,cast(e){ S.proj(e,e.aim,{speed:18,range:14,dmg:0,label:'강령 의식',big:true,nohit:true,touch:t=>{ rm(t,'sick'); add(t,'sick',10,1,{by:e}); for(let i=0;i<10;i++) after(i,()=>{ if(e.dead||t.dead||e.r.ju<4) return; e.r.ju-=4; add(t,'slow',1.05,Math.min(.9,.2+.05*i),{by:e}); }); }}); }},
   ult:{name:'타락의 제단',cd:0,r:6,can:e=>e.r.cc>=60,need:'상태이상 부여 60초',cast(e){ S.focus(e,2); after(2,()=>{ if(e.dead) return; e.r.alt=now+8; zone(e,{x:e.x,y:e.y,r:6,dur:8,label:'타락의 제단',altar:true}); }); }}
  },note:'병세는 걸린 적이 체력을 회복할 때 3(증폭 중 6) 피해를 준다. 병세에 걸린 쪽은 화면이 울렁인다(증폭 중에는 두 배). 강령 의식은 주술이 4 밑으로 떨어지면 둔화가 끊긴다.'},
vega:{name:'정령의 말예, 베가',cls:'지원가',grade:'고화',range:2.6,
  init:e=>{e.r={bind:new Map(),form:0,mist:0}}, hud:e=>(e.r.form>now?'정령체 · ':'')+(e.r.mist>now?'연무 중':'정령 결속'),
  onDeal(e,t,amt,label,o){ if(t.dead||!(o&&(o.basic||o.skill))) return; if(t.st.some(s=>['slow','vuln','root','silence','stun','weak','blind'].includes(s.k))&&(e.r.bind.get(t)||0)<=now){ e.r.bind.set(t,now+10); add(t,'root',1); proc(e,'정령 결속','속박 1초'); } },
  skills:{
   n1:{name:'섬연',cd:7,r:4,cast(e){ for(let i=0;i<2;i++) after(i*.12,()=>{ if(e.dead) return; const o={vuln:[.1,2]}; if(e.r.form>now) S.circle(e,4,10,'섬연',o); else S.line(e,4,10,'섬연',o); }); }},
   n2:{name:'정령체',cd:9,r:4,cast(e){ add(e,'resist',3,.35); add(e,'slow',3,.6); e.r.form=now+3; }},
   aw:{name:'정령 연무',cd:45,r:6,cast(e){ e.r.mist=now+5; const c=new Map(); zone(e,{x:e.x,y:e.y,r:7,dur:5,every:1,label:'정령 연무',tick:(z,inn)=>inn.forEach(t=>{ damage(e,t,12,'정령 연무',{skill:true}); const n=(c.get(t)||0)+1; c.set(t,n); if(n===3) add(t,'root',1); })}); }},
   ult:{name:'정령 놀음',cd:0,r:99,can:e=>e.r.mist>now,need:'정령 연무 중',cast(e){ zone(e,{x:e.x,y:e.y,r:5,dur:6,every:1,label:'정령 놀음',good:true,tick:z=>{ if(Math.hypot(e.x-z.x,e.y-z.y)<=5){ e.st=e.st.filter(s=>!['slow','root','silence','stun','weak','blind','vuln','sick','scorch','grab'].includes(s.k)||s.self); heal(e,8); } }}); }}
  },note:'정령체의 자기 둔화는 정령 놀음으로도 풀린다.'},
/* ───────── 척후병 ───────── */
merilda:{name:'설원의 사냥꾼, 메릴다',cls:'척후병',grade:'고화',range:8,
  init:e=>{e.r={acc:0,hits:0,night:0}}, hud:e=>'포착 적중 '+e.r.hits+'/16',
  tick(e,dt){ e.r.acc+=dt; if(e.r.acc>=10){ e.r.acc-=10; const t=tgt(e,14); if(t){ add(t,'spot',3,0,{by:e}); proc(e,'탐색','포착 3초'); } } },
  onDeal(e,t){ if(has(t,'spot')&&!has(e,'stealth')){ add(e,'haste',1,.2); add(e,'stealth',1); } },
  onSkillHit(e,t){ if(has(t,'spot')) e.r.hits++; if(e.r.night>now&&has(t,'slow')) damage(e,t,10,'새하얀 밤'); },
  skills:{
   n1:{name:'발사',cd:3,r:10,cast(e){ S.line(e,10,18,'발사'); }},
   n2:{name:'선회',cd:16,ai:(e,d)=>d<4,cast(e){ S.leap(e,moveDir(e),8,26); }},
   aw:{name:'사냥 시간',cd:45,r:14,cast(e){ const t=tgt(e,99); for(let i=-1;i<=1;i++){ const a=Math.atan2(e.aim.y,e.aim.x)+i*.9; S.proj(e,{x:Math.cos(a),y:Math.sin(a)},{speed:4.5,range:60,life:5,home:t,dmg:20,label:'사냥개',big:true,o:{root:1,post:x=>{ rm(x,'spot'); add(x,'spot',12,0,{by:e}); }}}); } }},
   ult:{name:'새하얀 밤',cd:0,r:8,can:e=>e.r.hits>=16,need:'포착 적중 16회',cast(e){ S.focus(e,1); after(1,()=>{ if(e.dead) return; e.r.night=now+8; zone(e,{x:e.x,y:e.y,r:8,dur:8,every:.25,label:'설원',tick:(z,inn)=>inn.forEach(t=>add(t,'slow',.35,has(t,'spot')?.4:.2))}); }); }}
  },note:'탐색은 14칸 안의 가장 가까운 적을 잡는다. 시험장 조정(2026-11): 선회의 도약을 11칸에서 8칸으로 줄였고, 사냥개는 초당 4.5칸(전의 절반)으로 5초 동안 쫓다가 사라진다.'},
mimosa:{name:'황천의 제해, 미모사',cls:'척후병',grade:'고화',range:9,
  init:e=>{e.r={u:0,awN:0,awT:0,gu:0,gt:0}}, hud:e=>'우천 '+e.r.u+'/18'+(e.r.awT>now?' · 창해 '+e.r.awN:''),
  onSkillHit(e,t){ if(dist(e,t)>=6){ e.r.u++; proc(e,'우천','+4 · 밀침'); if(e.r.gt>now) e.r.gu++; damage(e,t,4,'우천'); knock(t,e,1); if(e.r.u%3===0) add(t,'slow',1,.44); } },
  skills:{
   n1:{name:'창해',cd:7,r:13,cast(e){ const F=e.r.awT>now&&e.r.awN>0; if(F){ e.r.awN--; e.cd.n1=.25; } S.focus(e,.5); after(.5,()=>{ if(!e.dead) S.proj(e,e.aim,{speed:24,range:18,dmg:8,label:'창해',pierce:F,ghost:F,o:{post:t=>after(2,()=>{ if(!e.dead&&!t.dead) damage(e,t,8,'창해 (2초 뒤)'); })}}); }); }},
   n2:{name:'바다벽',cd:16,ai:(e,d)=>d<5,cast(e){ const p=front(e,3); wall(e,p.x,p.y,Math.abs(e.aim.x)>Math.abs(e.aim.y)?1:5,Math.abs(e.aim.x)>Math.abs(e.aim.y)?5:1,8); }},
   aw:{name:'황천의 비',cd:30,r:8,cast(e){ fx.push({k:'circle',x:e.x,y:e.y,r:8,t0:now,team:e.team,dur:.9,lab:'황천의 비',src:e}); foes(e).forEach(t=>{ if(dist(e,t)<=8+R){ add(t,'blind',4); add(t,'glow',4); } }); e.r.awT=now+4; e.r.awN=4; e.cd.n1=0; }},
   ult:{name:'사풍세우',cd:0,r:12,can:e=>e.r.u>=18&&!!tgt(e,14),need:'우천 18회',cast(e){ const t=tgt(e,14); add(t,'glow',6); e.r.gt=now+6; e.r.gu=0; after(6,()=>{ if(e.dead||t.dead) return; damage(e,t,24,'사풍세우'); const n=Math.min(16,e.r.gu*2); for(let i=0;i<n;i++) after(.1+i*.08,()=>{ if(!t.dead) damage(e,t,16/n,'사풍세우 (추가)'); }); }); }}
  },note:'바다벽은 3칸 앞에 가로 5칸, 두께 1칸으로 세운다(카드의 4칸은 높이). 걸음과 투사체를 막는다. 궁극기 조건의 "시야 밖"은 뺐다(우천 18회). 발광은 표시만 한다.'},
ford:{name:'공성 병기, 포드',cls:'척후병',grade:'고화',range:9,
  init:e=>{e.r={wp:false,wd:0}}, hud:e=>(e.r.wp?'병기 · ':'')+'병기 피해 '+Math.floor(e.r.wd)+'/350',
  speedMod:e=>e.r.wp?.4:1,
  off(e){ if(!e.r.wp) return; e.r.wp=false; e.cd.crouch=11; proc(e,'인간 병기','해제 폭발'); S.circle(e,3,13,'인간 병기',{knock:3}); },
  onHurt(e){ CH.ford.off(e); },
  onDeal(e,t,amt){ if(e.r.wp) e.r.wd+=amt; },
  onSkillHit(e,t,label){ if(e.r.wp&&label!=='인간 병기') damage(e,t,5,'병기 (추가 피해)'); },
  skills:{
   crouch:{name:'인간 병기',cd:.5,ai:(e,d)=>!e.r.wp&&d>7,cast(e){ if(e.r.wp) CH.ford.off(e); else e.r.wp=true; }},
   n1:{name:'공성 화살',cd:9,r:13,cast(e){ const W2=e.r.wp; for(let i=0;i<2;i++) after(i*.15,()=>{ if(!e.dead) S.proj(e,e.aim,{dmg:9,label:'공성 화살',o:{knock:1,root:W2?1:0}}); }); }},
   n2:{name:'폭발 화살',cd:14,r:13,cast(e){ S.proj(e,e.aim,{dmg:20,label:'폭발 화살',o:{air:1,pre:t=>{ fx.push({k:'circle',x:t.x,y:t.y,r:1,t0:now,team:e.team,lab:'폭발 화살',src:e}); if(t.sh.length) dot(e,t,12,3,'폭발 화살 (지속)'); }}}); }},
   aw:{name:'표적 신호',cd:30,r:13,cast(e){ S.proj(e,e.aim,{dmg:40,label:'표적 신호',o:{post:t=>add(t,'pmark',3)}}); }},
   ult:{name:'섬멸 개시',cd:0,r:13,can:e=>e.r.wd>=350,need:'병기 피해 350',cast(e){ S.proj(e,e.aim,{dmg:26,label:'섬멸 개시',big:true,o:{slow:[.3,1],post:t=>{ const p={x:t.x,y:t.y,z:0}; after(.5,()=>{ for(let i=0;i<6;i++) after(i*.07,()=>{ if(!e.dead) S.circle(e,1.5,9,'섬멸 개시 (화살비)',null,p); }); }); }}}); }}
  },note:'병기는 웅크리기 단추로 켜고 끈다. 공성 화살은 두 발이 9씩(합 18). 표적은 투사체에 맞을 때마다 0.2초 기절.'},
tommy:{name:'서부의 반항아, 토미',cls:'척후병',grade:'고화',range:8,
  init:e=>{e.r={am:0,hits:0}}, hud:e=>'탄환 '+e.r.am+'/6 · 적중 '+e.r.hits+'/54',
  onSkillHit(e){ e.r.hits++; if(e.cd.crouch>0) proc(e,'롤링','-2초'); e.cd.crouch=Math.max(0,e.cd.crouch-2); },
  skills:{
   crouch:{name:'롤링',cd:6,ai:e=>e.r.am<6,cast(e){ S.leap(e,moveDir(e),2); e.r.am=Math.min(6,e.r.am+1); }},
   n1:{name:'리볼버',cd:2,r:13,can:e=>e.r.am>=1,need:'탄환 1',cast(e){ e.r.am--; S.proj(e,e.aim,{dmg:14,label:'리볼버'}); }},
   n2:{name:'트리플',cd:12,r:13,can:e=>e.r.am>=1,need:'탄환 1',cast(e){ e.r.am--; for(let i=0;i<3;i++) after(i*.1,()=>{ if(!e.dead) S.proj(e,e.aim,{dmg:6,label:'트리플',o:{knock:.4}}); }); }},
   aw:{name:'불렛 타임',cd:30,r:8,cast(e){ e.r.am=Math.min(6,e.r.am+3); add(e,'haste',3,.2); fx.push({k:'circle',x:e.x,y:e.y,r:5,t0:now,team:e.team}); foes(e).forEach(t=>{ if(dist(e,t)<=5+R) add(t,'slow',3,.2); }); }},
   ult:{name:'스피드스터',cd:0,r:12,can:e=>e.r.hits>=54&&e.r.am>=1,need:'적중 54회 + 탄환',cast(e){ S.focus(e,3); after(3,()=>{ const n=e.r.am; e.r.am=0; for(let i=0;i<n;i++) after(i*.08,()=>{ if(e.dead) return; S.arc(e,12,14,'스피드스터',{half:45,zfree:true}); }); }); }}
  },note:'탄환 0발로 시작한다(카드에 시작 수가 없음). 트리플은 탄환 하나로 세 발이 6씩(합 18).'},
shale:{name:'꿈꾸는 소녀, 샬레',cls:'척후병',grade:'고화',range:8,
  init:e=>{e.r={last:null,prac:null,re:0,any:null,bok:null}}, hud:e=>(e.r.bok?'복기: '+CH.shale.skills[e.r.bok].name:e.r.prac?'연습: '+CH.shale.skills[e.r.prac].name:'연습 없음')+' · 재시전 '+e.r.re+'/20',
  onCast(e,s){ if(s==='n1'||s==='n2') e.r.last=s; if(s==='n1'||s==='n2'||s==='aw') e.r.any=s; },
  skills:{
   crouch:{name:'액션',cd:.4,can:e=>!!(e.r.bok||e.r.prac||e.r.last),need:'일반 스킬 먼저',ai:e=>!!(e.r.prac||e.r.bok)||Math.random()<.3,cast(e){
        if(e.r.bok){ const s=e.r.bok; e.r.bok=null; e.cd.crouch=14; CH.shale.skills[s].cast(e); return; }
        if(!e.r.prac){ e.r.prac=e.r.last; proc(e,'액션','연습'); return; } const s=e.r.prac; e.r.prac=null; e.r.re++; e.cd.crouch=6; CH.shale.skills[s].cast(e); }},
   n1:{name:'석궁',cd:4,r:11,cast(e){ S.proj(e,e.aim,{speed:22,range:13,dmg:15,label:'석궁',grav:1,o:{knock:.4}}); }},
   n2:{name:'높이 뛰기',cd:7,ai:(e,d)=>d<4,cast(e){ if(e.z<.05) e.vz=Math.sqrt(2*G*3); else S.leap(e,moveDir(e),2); }},
   aw:{name:'말뚝 석궁',cd:30,r:11,cast(e){ S.proj(e,e.aim,{speed:22,range:13,dmg:35,label:'말뚝 석궁',big:true,grav:1.1,onEnd:p=>{ const q={x:p.x,y:p.y,z:0}; fx.push({k:'circle',x:q.x,y:q.y,r:.5,t0:now,team:e.team,dur:3}); after(3,()=>{ if(!e.dead) S.circle(e,3,0,'말뚝 석궁',{root:1},q); }); }}); }},
   ult:{name:'멀티 액션',cd:0,r:99,can:e=>e.r.re>=20&&!!e.r.any,need:'액션 재시전 20회',cast(e){ e.r.bok=e.r.any; say(e,'복기','#7fe3b5'); }}
  },note:'스왑 키 대신 웅크리기 단추가 액션이다. 한 번 누르면 연습, 다시 누르면 재시전하고 6초를 센다. 멀티 액션을 쓰면 다음 액션이 마지막 스킬(각성 포함)을 복기한다. 석궁은 포물선으로 날아가 사거리 끝에서 땅에 떨어진다(높이 1칸).'},
nertina:{name:'아카데미 수석, 네르티나',cls:'척후병',grade:'서사',range:9,
  init:e=>{e.r={ar:0,acc:0,hits:0,acro:0,steps:0,stepT:0}}, hud:e=>'화살 '+e.r.ar+(e.r.acro>now?' · 곡예':'')+(e.r.stepT>now?' · 순보 '+e.r.steps:''),
  tick(e,dt){ e.r.acc+=dt; if(e.r.acc>=3){ e.r.acc-=3; e.r.ar=Math.min(10,e.r.ar+1); } },
  onSkillHit(e){ if(++e.r.hits%2===0){ e.r.ar=Math.min(10,e.r.ar+1); proc(e,'화살집','화살 +1'); } },
  skills:{
   n1:{name:'궁사',cd:1.5,r:14,can:e=>e.r.ar>=1,need:'화살 1',cast(e){ e.r.ar--; S.proj(e,e.aim,{dmg:18,label:'궁사'}); }},
   n2:{name:'속사',cd:7,can:e=>e.r.ar>=3,need:'화살 3',ai:(e,d)=>d<=5||(d<=12&&Math.random()<.3),cast(e){ e.r.ar-=3; S.leap(e,moveDir(e),5,22,()=>{ for(let i=0;i<2;i++) after(i*0.12,()=>{ if(!e.dead) S.proj(e,e.aim,{dmg:15,label:'속사',o:{knock:1}}); }); }); }},
   aw:{name:'곡예사',cd:45,r:99,can:e=>e.r.ar===10,need:'화살 10',cast(e){ add(e,'haste',6,.2); e.r.acro=now+6; }},
   ult:{name:'가벼운 걸음',cd:0,r:99,can:e=>e.r.ar===0,need:'화살 0',cast(e){ add(e,'haste',9,.1); e.r.steps=5; e.r.stepT=now+9; after(9,()=>{ if(!e.dead) e.r.ar=Math.min(10,e.r.ar+5); }); }},
   crouch:{name:'웅크리기',cd:0.3,can:e=>(e.r.acro>now&&e.r.ar>0)||(e.r.stepT>now&&e.r.steps>0),need:'곡예·순보 중',ai:(e,d)=>e.r.acro>now?d<=14:d<=4,cast(e){
        if(e.r.acro>now&&e.r.ar>0){ e.r.ar--; S.proj(e,e.aim,{dmg:15,label:'곡예사'}); e.x-=e.aim.x; e.y-=e.aim.y; clamp(e); } else { e.r.steps--; S.leap(e,moveDir(e),3); } }}
  },note:'화살 0개로 시작한다(카드에 시작 수가 없음). 곡예·순보는 웅크리기 단추.'}
};
for(const k in CH){ const c=CH[k],b=CLASSES[c.cls]; c.hp=b.hp; c.atk=b.atk; c.key=k; }

/* 카드에 이름이 있는 상태. [이름, 남은 초(없으면 생략)] */
const until=x=>Math.max(0,x-now);
const STATES={
 castor:e=>e.hp<=e.max/2?[['열혈']]:[], ei:e=>e.hp<=e.max/2?[['고취']]:[],
 mente:e=>[e.r.tae>now&&['태도',until(e.r.tae)],e.r.awT>now&&['실력 발휘',until(e.r.awT)]],
 guillaume:e=>[e.r.nb>now&&['완력',until(e.r.nb)],e.free>now&&['최후의 광란',until(e.free)]],
 harmund:e=>[e.r.snow>now&&['설화',until(e.r.snow)]],
 manannan:e=>[e.r.gp&&['간파 노림']], simon:e=>[e.r.emp&&['거인의 힘']],
 ginan:e=>[e.r.zn&&e.r.zn.until>now&&['성역',until(e.r.zn.until)],e.r.forced>now&&['신성 충격',until(e.r.forced)]],
 janet:e=>[e.r.x2>now&&['왕국의 명예',until(e.r.x2)]],
 kerker:e=>[e.r.st&&['태세: '+e.r.st],e.r.ut>now&&['원시의 힘',until(e.r.ut)]],
 ross:e=>[e.r.adv>now&&['진격',until(e.r.adv)],e.r.rivalT>now&&['숙적 지정',until(e.r.rivalT)]],
 plaus:e=>[e.r.form&&['자연체']], epoch:e=>[[inFight(e)?'증명':'실험'],e.r.emp&&['기계혁명']],
 vira:e=>[e.chant>now&&['병렬 영창',until(e.chant)],e.r.lv&&['레벨 업']],
 margrita:e=>[e.r.nk>now&&['나락의 탄환',until(e.r.nk)],e.r.ut>now&&['신진화멸',until(e.r.ut)],e.r.am<=0&&e.r.ra&&['장전',until(e.r.ra)]],
 john:e=>[has(e,'stealth')&&['은신',until(has(e,'stealth').until)],e.r.rat>now&&['시궁창 쥐',until(e.r.rat)],e.r.steal&&['도둑질']],
 valtma:e=>[e.r.emp&&['동태 강화'],e.r.up>now&&['사냥 본능',until(e.r.up)],e.r.bt>now&&['포승',until(e.r.bt)]],
 clover:e=>[e.r.lt>now&&['높낮이: '+e.r.last,until(e.r.lt)]],
 cornwall:e=>[has(e,'invuln')&&['강림',until(has(e,'invuln').until)]],
 eclia:e=>[e.r.big&&['대의'],e.r.gt>now&&['간언',until(e.r.gt)],e.r.ign>0&&['순례의 고리 '+e.r.ign+'회']],
 breck:e=>[e.r.amp&&['부두술 증폭'],e.r.alt>now&&['타락의 제단',until(e.r.alt)]],
 vega:e=>[e.r.form>now&&['정령체',until(e.r.form)],e.r.mist>now&&['정령 연무',until(e.r.mist)]],
 merilda:e=>[has(e,'stealth')&&['은신',until(has(e,'stealth').until)],e.r.night>now&&['새하얀 밤',until(e.r.night)]],
 mimosa:e=>[e.r.awT>now&&['황천의 비',until(e.r.awT)],e.r.gt>now&&['사풍세우',until(e.r.gt)]],
 ford:e=>[e.r.wp&&['병기']], shale:e=>[e.r.bok&&['복기'],e.r.prac&&!e.r.bok&&['연습']],
 nertina:e=>[e.r.acro>now&&['곡예',until(e.r.acro)],e.r.stepT>now&&['순보 '+e.r.steps,until(e.r.stepT)]],
 kur:e=>[e.r.kill&&['낭고 풍랑 준비']], milio:e=>[], tommy:e=>[]
};
const BUFFS={haste:'기동력↑',resist:'저항↑',slow:'둔화',weak:'쇠약',vuln:'받피증',dealdown:'주피감',invuln:'무적'};
