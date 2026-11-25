"use strict";
/* 서사급 추가 3: 지원가 6 · 척후병 3. 아군에게 주는 효과는 1대1이라 대상이 자신이 된다(각 note에 적음). */
const leftOf=a=>({x:a.y,y:-a.x}), rightOf=a=>({x:-a.y,y:a.x});
const inFog=e=>zones.some(z=>z.fog&&z.until>now&&Math.hypot(e.x-z.x,e.y-z.y)<=z.r);

Object.assign(CH,{
fomal:{name:'부둣가의 왕, 포말',cls:'지원가',grade:'서사',range:2.6,
  init:e=>{e.r={fish:0,ok:0,boost:false,sw:0}}, hud:e=>'물고기 '+e.r.fish+' · 낚시 '+e.r.ok+'/5',
  onSkillHit(e){ if(e.r.fish<3){ e.r.fish++; proc(e,'월척','물고기 +1'); } },
  altBasic:e=>e.r.sw>now,
  skills:{
   crouch:{name:'물고기 나눔',cd:.4,can:e=>e.r.fish>0,need:'물고기',ai:e=>e.hp<e.max-12,cast(e){ e.r.fish--; heal(e,e.r.boost?15:10); add(e,'haste',1,.2); }},
   n1:{name:'헤엄',cd:9,r:5,cast(e){ const d={x:e.aim.x,y:e.aim.y},got=new Set(); e.r.sw=now+.45; add(e,'resist',.45,.5); e.busy=now+.42;
        for(let i=0;i<5;i++) after(i*.08,()=>{ if(e.dead) return; const p0=S.blink(e,d,1); puff(p0.x,p0.y,'water',3,2); foes(e).forEach(t=>{ if(!got.has(t)&&dist(e,t)<=1.1+R&&zok(e,t)){ got.add(t); strike(e,t,15,'헤엄',{air:1.5}); } }); }); }},
   n2:{name:'낚시',cd:16,r:10,cast(e){ S.focus(e,.5); after(.5,()=>{ if(!e.dead) S.proj(e,e.aim,{speed:22,range:11,dmg:25,label:'낚시',o:{post:t=>{ e.r.ok++; near(t,e,1.2); say(t,'끌당','#f0b458'); }}}); }); }},
   aw:{name:'향유 고래',cd:30,r:3,can:e=>e.r.fish>=1,need:'물고기 1',cast(e){ e.r.fish--; const p={x:e.x,y:e.y,z:0}; fx.push({k:'circle',x:p.x,y:p.y,r:3,t0:now,team:e.team,dur:3,lab:'향유 고래',src:e}); after(3,()=>{ if(!e.dead) S.circle(e,3,40,'향유 고래',{air:4,v:'geyser'},p); }); }},
   ult:{name:'오병이어',cd:0,r:99,can:e=>e.r.ok>=5,need:'낚시 성공 5회',cast(e){ e.r.fish+=5; e.r.boost=true; }}
  },note:'물고기는 나눠 줄 아군이 없어 웅크리기 단추로 자신이 먹는다(체력 10, 기동력 20% 1초).'},
sonia:{name:'진리의 흔적, 소니아',cls:'지원가',grade:'서사',range:4,
  init:e=>{e.r={i:0,acc:0,stir:0,lock:0,all:0,free:false,awN:0,pk:0,pkv:0}}, hud:e=>'시약 '+(e.r.all>now?'모든 색':['파랑','분홍','초록'][e.r.i])+(e.r.lock>now?' (고정 x2)':'')+' · 솥 '+e.r.awN+'/3',
  cols:e=>e.r.all>now?[0,1,2]:[e.r.i], m:e=>e.r.lock>now?2:1,
  tick(e,dt){ if(e.r.lock<=now&&e.r.stir<=now){ e.r.acc+=dt; if(e.r.acc>=10){ e.r.acc-=10; e.r.i=(e.r.i+1)%3; proc(e,'시약',['파랑','분홍','초록'][e.r.i]); } }
    if(e.r.stir&&e.r.stir<=now){ e.r.stir=0; e.r.lock=now+5; e.r.free=true; } },
  onCast(e,s){ if((s==='n1'||s==='n2')&&e.r.free){ e.r.free=false; e.cd[s]=0; } },
  onDeal(e,t,amt,label,o){ if(e.r.pk>now&&o&&!o.amp&&!t.dead) damage(e,t,amt*e.r.pkv,'분홍 시약 (증폭)',{amp:true}); },
  skills:{
   crouch:{name:'시약 바꾸기',cd:.3,can:e=>e.r.stir>now,need:'연금의 솥 중',ai:()=>false,cast(e){ e.r.i=(e.r.i+1)%3; }},
   n1:{name:'투척',cd:6,ai:(e,d)=>d<=9,cast(e){ const m=CH.sonia.m(e),c=CH.sonia.cols(e); S.proj(e,{x:0,y:-1},{speed:9,range:.6,dmg:0,label:'투척',nohit:true,el:['water','dream','nature'][c[0]]}); fx.push({k:'circle',x:e.x,y:e.y,r:2,t0:now,team:e.team,lab:'투척',src:e,el:['water','dream','nature'][c[0]]});
        if(c.includes(0)) add(e,'haste',2,.1*m); if(c.includes(1)){ e.r.pk=now+2; e.r.pkv=.05*m; } if(c.includes(2)) for(let i=1;i<=2;i++) after(i,()=>heal(e,e.max*.015*m)); }},
   n2:{name:'분사',cd:9,r:5,cast(e){ const m=CH.sonia.m(e),c=CH.sonia.cols(e); S.arc(e,5,18,'분사',{knock:1,v:'blast',el:['water','dream','nature'][c[0]],post:t=>{ if(c.includes(0)) add(t,'slow',2,.1*m,{by:e}); if(c.includes(1)) add(t,'dealdown',2,.05*m,{by:e}); if(c.includes(2)) dot(e,t,t.max*.03*m,2,'초록 시약'); }}); }},
   aw:{name:'연금의 솥',cd:30,r:7,cast(e){ e.r.awN++; e.r.stir=now+3; add(e,'resist',3,.2); }},
   ult:{name:'궁극의 시약',cd:0,r:8,can:e=>e.r.awN>=3,need:'연금의 솥 3회',cast(e){ add(e,'resist',5,.3); after(5,()=>{ if(e.dead) return; heal(e,50); e.r.all=now+12; }); }}
  },note:'투척은 맞혀 줄 아군이 없어 자신에게 바로 적용한다. 연금의 솥을 젓는 3초 동안 웅크리기 단추로 색을 바꾼다.'},
margaret:{name:'반짝이는 불꽃, 마가렛',cls:'지원가',grade:'서사',range:5,
  init:e=>{e.r={life:0,healed:0,bl:0,orbs:[],ou:0,th:new Map()}}, hud:e=>'회복 '+Math.floor(e.r.healed)+'/120'+(e.r.life>now?' · 생명의 불':''),
  hl(e,m){ const v=5*(m||1)*(e.r.bl>now?2:1); e.r.healed+=v; heal(e,v); },
  onDeal(e,t,amt,label,o){ if(t.dead||(o&&o.amp)) return; if(!has(t,'ember')&&(e.r.life>now||Math.random()<.3)){ add(t,'ember',4,0,{by:e}); e.r.th.set(t,t.hp/t.max); proc(e,'화흔','4초'); }
    if(e.r.life>now&&has(t,'ember')){ const was=e.r.th.get(t)||1,cur=t.hp/t.max; e.r.th.set(t,cur); for(const k of [.75,.5,.25]) if(was>=k&&cur<k){ fx.push({k:'circle',x:t.x,y:t.y,r:4,t0:now,team:e.team,lab:'화흔 폭발',src:e,v:'burst'}); damage(e,t,12,'화흔 (폭발)',{amp:true}); CH.margaret.hl(e,3); } } },
  onSkillHit(e,t){ if(has(t,'ember')) CH.margaret.hl(e); },
  modTake(e,src,amt,label,o){ const em=src!==e&&has(src,'ember'); if(em&&!em.used&&o&&o.skill){ em.used=true; return amt-10; } return amt; },
  tick(e,dt){ if(e.r.ou<=now){ e.r.orbs=[]; return; } e.r.orbs=e.r.orbs.filter(o=>o.n>0); for(const o of e.r.orbs){ o.a+=dt*2.6; o.cd-=dt; const x=e.x+Math.cos(o.a)*3,y=e.y+Math.sin(o.a)*3; o.x=x; o.y=y; if(o.cd<=0) for(const t of foes(e)) if(Math.hypot(t.x-x,t.y-y)<=R+.4){ o.cd=.4; o.n--; strike(e,t,4,'번영'); break; } } },
  skills:{
   n1:{name:'홍화',cd:8,r:7,cast(e){ const p=spot(e,7,3),D=e.r.life>now?6:3; let z=zone(e,{x:p.x,y:p.y,r:1,dur:D,every:.1,label:'홍화',tick:(zz,inn)=>{ if(inn.length){ zz.until=now; for(let i=0;i<2;i++) after(i*.15,()=>{ if(!e.dead) S.circle(e,3,5,'홍화',{v:'bloom'},{x:zz.x,y:zz.y,z:0}); }); } else if(Math.hypot(e.x-zz.x,e.y-zz.y)<=1&&now-zz.born>.4){ zz.until=now; add(e,'haste',2,.25); } }}); z.born=now; }},
   n2:{name:'번영',cd:12,r:5,cast(e){ e.r.ou=now+(e.r.life>now?8:4); e.r.orbs=[0,1,2].map(i=>({a:i*2.094,n:2,cd:0,x:e.x,y:e.y})); }},
   aw:{name:'생명의 불',cd:45,r:7,cast(e){ e.r.life=now+7; }},
   ult:{name:'불꽃의 개화',cd:0,r:6,can:e=>e.r.healed>=120,need:'화흔 회복 120',cast(e){ const p=spot(e,6,4),hp=new Map(),acc=new Map(); e.r.bl=now+5; zone(e,{x:p.x,y:p.y,r:4,dur:5,every:.1,label:'불꽃의 개화',tick:(z,inn)=>inn.forEach(t=>{ const was=hp.get(t); hp.set(t,t.hp); if(was===undefined||was<=t.hp) return; let a=(acc.get(t)||0)+(was-t.hp); while(a>=30){ a-=30; damage(e,t,8,'불꽃의 개화',{amp:true}); } acc.set(t,a); })}); }}
  },note:'홍화는 7칸 안의 적이 선 자리(없으면 3칸 앞)에 핀다. 번영의 화염꽃은 자신의 3칸 둘레를 돈다. 화흔의 회복은 자신에게만 든다.'},
nevia:{name:'평정의 피리, 네비아',cls:'지원가',grade:'서사',range:3.2,
  init:e=>{e.r={q:[],last:0,orbs:[],made:0,plus:0,prev:['dmg','cd','heal']}}, hud:e=>'구슬 효과 '+e.r.q.length+'/3 · 생성 '+e.r.made+'/10'+(e.r.plus?' · 다음 스킬 +'+e.r.plus:''),
  put(e,k){ e.r.q.push(k); e.r.last=now; if(e.r.q.length>=3){ CH.nevia.orb(e,e.r.q,2.2); e.r.prev=e.r.q; e.r.q=[]; e.r.made++; proc(e,'음색','소리 구슬 생성'); } },
  orb(e,fx2,d){ const a=Math.random()*6.283; e.r.orbs.push({x:Math.max(1,Math.min(W-1,e.x+Math.cos(a)*d)),y:Math.max(1,Math.min(H-1,e.y+Math.sin(a)*d)),fx:fx2.slice(),until:now+15,born:now}); },
  take(e,o){ for(const k of o.fx){ if(k==='dmg') e.r.plus+=12; else if(k==='cd'){ for(const s in e.cd) if(s!=='b') e.cd[s]=Math.max(0,e.cd[s]-2); } else heal(e,(e.max-e.hp)*.15); } say(e,'소리 구슬','#6ff2e0'); sfx('heal'); },
  tick(e){ e.r.orbs=e.r.orbs.filter(o=>{ if(o.until<=now) return false; if(now-o.born>.3&&Math.hypot(e.x-o.x,e.y-o.y)<=.9){ CH.nevia.take(e,o); return false; } return true; }); },
  onSkillHit(e,t){ if(e.r.plus>0&&!t.dead){ const p=e.r.plus; e.r.plus=0; damage(e,t,p,'소리 구슬 (추가 피해)'); } },
  skills:{
   crouch:{name:'효과 제거',cd:.3,can:e=>e.r.q.length>0&&now-e.r.last<=2,need:'부여 뒤 2초 안',ai:()=>false,cast(e){ e.r.q.pop(); }},
   n1:{name:'연주',cd:10,r:4,cast(e){ S.arc(e,4,12,'연주',{air:1,v:'shout'}); CH.nevia.put(e,'dmg'); }},
   n2:{name:'격려',cd:16,ai:(e,d)=>d<=8,cast(e){ CH.nevia.put(e,'cd'); }},
   aw:{name:'선율의 길',cd:45,r:9,cast(e){ S.line(e,9,0,'선율의 길',{disarm:2,v:'whip'}); for(let i=1;i<=5;i++) after(i,()=>{ if(e.dead) return; heal(e,6); if(i===5) CH.nevia.put(e,'heal'); }); }},
   ult:{name:'풍요의 서곡',cd:0,r:8,can:e=>e.r.made>=10,need:'소리 구슬 10회',cast(e){ S.focus(e,1); after(1,()=>{ if(e.dead) return; add(e,'haste',3,.4); CH.nevia.orb(e,e.r.prev,2); CH.nevia.orb(e,e.r.prev,3); }); }}
  },note:'소리 구슬은 자신의 2칸 둘레에 생기고 자신이 밟아 효과를 받는다. 격려는 옮겨 갈 아군이 없어 구슬 효과만 부여한다. 풍요의 서곡은 마지막으로 만든 구슬과 같은 구슬 둘을 부른다.'},
wayne:{name:'사설 탐정가, 웨인',cls:'지원가',grade:'서사',range:5,
  init:e=>{e.r={pcd:0,dt:0,who:null,ok:0,mark:null}}, hud:e=>(e.r.dt>now?'추리 · ':'')+'추리 성공 '+e.r.ok+'/7',
  tick(e,dt){ if(e.r.pcd>0) e.r.pcd-=dt; },
  onHurt(e,src){ if(src!==e&&e.r.pcd<=0){ e.r.pcd=12; e.r.dt=now+5; e.r.who=src; proc(e,'추리','5초'); } },
  onDeal(e,t,amt,label,o){ if(t.dead) return; if(e.r.dt>now&&e.r.who===t&&!has(t,'glow')){ add(t,'glow',3,0,{by:e}); e.r.ok++; } const m=e.r.mark; if(m&&m.t===t&&label!=='탐색') m.v=Math.min(18,m.v+(has(t,'glow')?6:3)); },
  skills:{
   n1:{name:'탐색',cd:9,r:6,can:e=>!!tgt(e,6),need:'6칸 안의 적',cast(e){ const t=tgt(e,6),m={t,v:0}; e.r.mark=m; fx.push({k:'circle',x:t.x,y:t.y,r:1,t0:now,team:e.team,dur:3,lab:'탐색',src:e,fol:t,v:'judge'}); after(3,()=>{ if(e.r.mark===m) e.r.mark=null; if(!e.dead&&!t.dead) strike(e,t,6+m.v,'탐색'); }); }},
   n2:{name:'심의',cd:16,r:4,cast(e){ for(let i=1;i<=4;i++) after(i,()=>{ if(e.dead) return; fx.push({k:'circle',x:e.x,y:e.y,r:4,t0:now,team:e.team,lab:'심의',src:e,v:'shout'}); foes(e).forEach(t=>{ if(dist(e,t)<=4+R) knock(t,e,.7); }); if(i===4) shield(e,12,3); }); const s=e.st.findIndex(x=>x.k==='slow'&&!x.self); if(s>=0){ e.st.splice(s,1); say(e,'해제','#7fe3b5'); } }},
   aw:{name:'진실의 눈',cd:30,r:9,can:e=>foes(e).some(t=>has(t,'glow')&&dist(e,t)<=9+R),need:'발광한 적 (9칸)',cast(e){ const t=foes(e).find(x=>has(x,'glow')&&dist(e,x)<=9+R); say(t,'각성 '+(t.cd.aw>0?t.cd.aw.toFixed(0)+'s':'준비됨'),'#fff3b0'); if(t.cd.aw<=0) add(t,'silence',3,0,{by:e}); }},
   ult:{name:'불가사의 규명',cd:0,r:11,can:e=>e.r.ok>=7&&!!tgt(e,11),need:'추리 성공 7회',cast(e){ const t=tgt(e,11); if(!t) return; const k=t.c.skills.ult,open=k&&!t.ultUsed&&(!k.can||k.can(t)); say(t,open?'조건 충족':'조건 불충족','#fff3b0'); if(!open) add(t,'nonormal',5,0,{by:e,onCast:(who,slot)=>(slot==='n1'||slot==='n2')?'deny':false}); }}
  },note:"'추리'는 시야 밖 아군이 맞을 때 켜지는 효과라 1대1에서는 자신이 맞을 때 켜지게 했다. 탐색의 피해 축적도 자신의 공격으로 쌓인다."},
rtien:{name:'슬픔의 안개, 르티엔',cls:'지원가',grade:'서사',range:2.4,
  init:e=>{e.r={bt:0,n:0,city:false}}, hud:e=>'비통 '+e.r.bt+'/2 · 비애 '+e.r.n+'/9'+(e.r.city?' · 안개의 도시':''),
  onCast(e,s){ if(s!=='crouch'&&e.r.bt<2) e.r.bt++; },
  basicBonus(e,t){ if(has(t,'blind')){ e.r.n++; proc(e,'비애','+6 · 도약'); S.leap(e,e.aim,3,20,null,true); damage(e,t,6,'비애'); } if(e.r.bt>0&&!t.dead){ e.r.bt--; e.r.n++; add(t,'silence',.5,0,{by:e}); add(e,'stealth',1); } },
  modTake(e,src,amt){ if(e.r.city&&src!==e&&inFog(e)&&Math.random()<.35){ say(e,'회피','#dcefff'); return 0; } return amt; },
  skills:{
   n1:{name:'연무',cd:13,r:5,cast(e){ S.circle(e,5,0,'연무',{blind:3,v:'nova',post:t=>add(t,'nojump',3,0,{by:e})}); }},
   n2:{name:'취연',cd:18,r:10,cast(e){ S.proj(e,e.aim,{speed:20,range:12,dmg:16,label:'취연',big:true,o:{post:t=>{ zone(e,{x:t.x,y:t.y,r:4,dur:4,every:.25,label:'안개',fog:true,tick:(z,inn)=>{ inn.forEach(x=>add(x,'slow',.35,.3,{by:e})); if(Math.hypot(e.x-z.x,e.y-z.y)<=z.r) add(e,'slow',.35,.3,{self:true}); }}); }}}); }},
   aw:{name:'용병 연가',cd:45,r:7,cast(e){ add(e,'stealth',9); zone(e,{x:e.x,y:e.y,r:7,dur:9,every:1,label:'안개',fog:true,tick:()=>{ e.cd.n1=Math.max(0,e.cd.n1-2); e.cd.n2=Math.max(0,e.cd.n2-2); }}); }},
   ult:{name:'안개의 도시',cd:0,r:6,can:e=>e.r.n>=9,need:'비애 9회',cast(e){ S.circle(e,6,25,'안개의 도시',{blind:3,v:'nova'}); e.r.city=true; }}
  },note:"연무의 '도약 취소'는 점프 불가 3초로 넣었다. 안개의 도시 뒤에는 자신의 안개(취연·용병 연가) 안에서 35% 확률로 피해를 피한다."},
irenio:{name:'권약의 재판관, 이레니오',cls:'척후병',grade:'서사',range:6,
  init:e=>{e.r={am:0,h:0,ak:0,pan:0,panK:0,exec:false,rush:0,l1:-99}}, hud:e=>'탄환 '+e.r.am+'/6'+(e.r.ak>now?' · 악일':'')+(e.r.pan>now?' · 판가름':''),
  shoot(e,n){ const A=e.r.ak>now; for(let i=0;i<n*(A?2:1);i++) after(i*.1,()=>{ if(!e.dead) S.proj(e,e.aim,{speed:30,range:14,dmg:12+(A?5:0),label:'권약',o:{amp:true,post:t=>{ if(e.r.execB>now&&!t.dead&&t.hp<=t.max*.1) damage(e,t,t.hp+t.sh.reduce((s,x)=>s+x.v,0),'사형 선고 (처형)',{fixed:true,amp:true}); }}}); }); },
  onDeal(e,t,amt,label,o){ if(o&&o.amp&&label!=='권약') return; if(++e.r.h%3===0&&e.r.am<6){ e.r.am=Math.min(6,e.r.am+2); proc(e,'권약','탄환 +2'); if(e.r.rush>now) after(.05,()=>{ if(!e.dead) S.circle(e,3,18,'선일',{knock:1.5}); }); } },
  onKill(e){ if(e.r.pan>now||e.r.panK>now) e.r.exec=true; },
  onCast(e,s){ if(s!=='n1'&&s!=='n2') return; const c=e.r.ak>now?2:1; if(e.r.am>=c){ e.r.am-=c; e.x-=e.aim.x; e.y-=e.aim.y; clamp(e); CH.irenio.shoot(e,1); } },
  skills:{
   n1:{name:'선일',cd:4,r:3,cast(e){ S.circle(e,3,18,'선일',{knock:1.5}); if(now-e.r.l1<=8) CH.irenio.shoot(e,1); e.r.l1=now; }},
   n2:{name:'악일',cd:14,r:8,can:e=>e.r.am>=2,need:'탄환 2',cast(e){ e.r.ak=now+3; }},
   aw:{name:'사형 선고',cd:45,r:8,can:e=>e.r.am>=(e.r.ak>now?6:3),need:'탄환 3',cast(e){ e.r.am-=e.r.ak>now?6:3; S.leap(e,moveDir(e),4,22); e.r.pan=now+7; }},
   crouch:{name:'판가름',cd:.5,can:e=>e.r.pan>now,need:'판가름 중',ai:(e,d)=>d<=6,cast(e){ e.r.pan=0; e.r.panK=now+2; e.r.execB=now+1.5; S.line(e,6,0,'사형 선고',{air:3,v:'windcut'}); after(.2,()=>{ if(!e.dead) CH.irenio.shoot(e,3); }); }},
   ult:{name:'즉결 심판',cd:0,r:10,can:e=>e.r.exec&&e.r.pan>now,need:'판가름 중 처치 + 판가름',cast(e){ e.r.pan=0; S.leap(e,moveDir(e),4,22); e.r.am=6; e.r.rush=now+5; }}
  },note:"탄환 0발로 시작한다. 선일의 '재시전'은 8초 안에 다시 쓴 것으로 읽어 탄환 한 발을 덤으로 쏜다. 판가름 사격의 탄환은 체력 10% 이하인 적을 처형한다. 즉결 심판은 처치가 있어야 해서 5판 3선승에서만 쓸 수 있다."},
petra:{name:'공진의 함정사, 페트라',cls:'척후병',grade:'서사',range:7,
  init:e=>{e.r={tr:0,acc:0,put:[],streak:0,ok:false}}, hud:e=>'함정 '+e.r.tr+'/8 · 설치 '+e.r.put.filter(z=>z.until>now).length+'/4 · 연속 명중 '+e.r.streak+'/3',
  tick(e,dt){ e.r.acc+=dt; if(e.r.acc>=12){ e.r.acc-=12; if(e.r.tr<8){ e.r.tr++; proc(e,'공진 장치','함정 +1'); } } e.r.put=e.r.put.filter(z=>z.until>now); },
  boom(e,z,gain){ if(z.until<=now&&!z.live) return; z.live=false; z.until=now; let hit=false; const o={slow:[.4,.5],v:'beam',post:t=>{ hit=true; const g=has(t,'goal'); if(g&&g.by===e&&++g.n>=2){ g.n=0; add(t,'root',1,0,{by:e}); } }};
    const got=new Set(),o2=Object.assign({},o,{pre:t=>got.add(t)}); S.seg(e,{x:z.x-4,y:z.y},{x:z.x+4,y:z.y},1.4,20,'유사 영역',o2).length; foes(e).forEach(t=>{ if(!got.has(t)&&Math.abs(t.x-z.x)<=.7+R&&Math.abs(t.y-z.y)<=4+R) { got.add(t); strike(e,t,20,'유사 영역',o); } }); fx.push({k:'seg',x0:z.x,y0:z.y-4,x1:z.x,y1:z.y+4,w:1.4,t0:now,team:e.team,lab:'유사 영역',src:e,v:'beam'});
    if(got.size){ e.r.streak++; if(e.r.streak>=3) e.r.ok=true; if(gain&&e.r.tr<8) e.r.tr++; } else e.r.streak=0;
    e.r.put.forEach(o3=>{ if(o3!==z&&o3.until>now&&(Math.abs(o3.x-z.x)<=4&&Math.abs(o3.y-z.y)<=.7||Math.abs(o3.y-z.y)<=4&&Math.abs(o3.x-z.x)<=.7)){ o3.live=true; after(1,()=>{ if(!e.dead) CH.petra.boom(e,o3,gain); }); } }); },
  skills:{
   n1:{name:'유사 영역',cd:4,r:8,can:e=>e.r.tr>=1,need:'함정 1',cast(e){ e.r.tr--; S.focus(e,1); after(1,()=>{ if(e.dead) return; const t=tgt(e,8),d=t?Math.min(7,dist(e,t)+1.2):5; S.proj(e,e.aim,{speed:16,range:d,dmg:0,label:'함정',nohit:true,pierce:true,grav:1.2,big:true,onEnd:p=>{ const live=e.r.put.filter(z=>z.until>now); if(live.length>=4) live[0].until=now;
          const z=zone(e,{x:p.x,y:p.y,r:.8,dur:60,every:.1,label:'함정',tick:(zz,inn)=>{ if(inn.length&&now-zz.born>.3) CH.petra.boom(e,zz); }}); z.born=now; e.r.put.push(z); }}); }); }},
   n2:{name:'위험 목표',cd:15,r:11,cast(e){ S.proj(e,e.aim,{speed:26,range:13,dmg:16,label:'위험 목표',o:{post:t=>{ rm(t,'goal'); add(t,'goal',5,0,{by:e,n:0}); add(e,'haste',3,.2); add(e,'jumpup',3,0,{self:true}); }}}); }},
   aw:{name:'원격 제어',cd:30,ai:e=>foes(e).some(t=>e.r.put.some(z=>z.until>now&&(Math.abs(t.x-z.x)<=4&&Math.abs(t.y-z.y)<=1||Math.abs(t.y-z.y)<=4&&Math.abs(t.x-z.x)<=1))),can:e=>e.r.put.some(z=>z.until>now),need:'설치한 함정',cast(e){ e.r.put.filter(z=>z.until>now).sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y)).slice(0,2).forEach(z=>CH.petra.boom(e,z,true)); }},
   ult:{name:'공명 진폭',cd:0,r:8,can:e=>e.r.ok,need:'함정 연속 명중 3회',cast(e){ const zs=[]; const all=()=>zs.forEach(z=>{ if(z.until>now){ z.until=now; S.circle(e,2,25,'공명 진폭',{stun:1,v:'burst'},{x:z.x,y:z.y,z:0}); } });
        for(let i=0;i<4;i++){ const a=Math.random()*6.283,d=1.5+Math.random()*4.5,z=zone(e,{x:Math.max(1,Math.min(W-1,e.x+Math.cos(a)*d)),y:Math.max(1,Math.min(H-1,e.y+Math.sin(a)*d)),r:.9,dur:30,every:.1,label:'공명',tick:(zz,inn)=>{ if(inn.length&&now-born>.4) all(); }}); zs.push(z); } const born=now; }}
  },note:'함정 0개로 시작해 12초마다 하나 얻는다. 함정은 십자(가로·세로 4칸씩)로 터진다. 점프력 50% 증가는 3초간 점프 높이 1.5배.'},
libra:{name:'대칭주의자, 리브라',cls:'척후병',grade:'서사',range:7,
  init:e=>{e.r={pcd:0,lt:-9,ld:null,hb:0,hw:0,dbl:0}}, hud:e=>'흑건 '+e.r.hb+'/30 · 백건 '+e.r.hw+'/30',
  tick(e,dt){ if(e.r.pcd>0) e.r.pcd-=dt; },
  mark(e,d){ e.r.lt=now; e.r.ld=d; },
  gun(e,side){ const d=side<0?leftOf(e.aim):rightOf(e.aim),m=e.r.dbl>now?2:1; CH.libra.mark(e,d); S.leap(e,d,3*m,22); after(.75,()=>{ if(!e.dead) S.proj(e,e.aim,{speed:30,range:14,dmg:8,label:side<0?'흑건':'백건',el:side<0?'shadow':'steel',o:{post:()=>{ if(side<0) e.r.hb++; else e.r.hw++; }}}); }); },
  skills:{
   crouch:{name:'대칭',cd:.2,can:e=>e.r.pcd<=0&&now-e.r.lt<=.5&&!!e.r.ld,need:'스킬 뒤 0.5초 안',ai:()=>Math.random()<.5,cast(e){ e.r.pcd=2; const d=e.r.ld; e.r.ld=null; e.dash=null; S.leap(e,{x:-d.x,y:-d.y},2*(e.r.dbl>now?2:1),22); for(const k in e.cd) if(k!=='b') e.cd[k]=Math.max(0,e.cd[k]-1); proc(e,'대칭','재사용 -1초'); }},
   n1:{name:'흑건',cd:2,r:13,cast(e){ e.cd.n2=Math.max(e.cd.n2,1); CH.libra.gun(e,-1); }},
   n2:{name:'백건',cd:2,r:13,cast(e){ e.cd.n1=Math.max(e.cd.n1,1); CH.libra.gun(e,1); }},
   aw:{name:'흑백연가',cd:30,r:12,cast(e){ const d={x:e.aim.x,y:e.aim.y}; CH.libra.mark(e,d); e.r.dbl=now+3; add(e,'slow',3,.99,{self:true}); for(let i=0;i<15;i++) after(i*.2,()=>{ if(!e.dead) S.proj(e,d,{speed:30,range:14,dmg:4,label:'흑백연가',el:i&1?'steel':'shadow'}); }); }},
   ult:{name:'이상과 진실',cd:0,r:10,can:e=>e.r.hb>=30&&e.r.hw>=30,need:'흑건·백건 적중 각 30회',cast(e){ const f={x:e.aim.x,y:e.aim.y},L=leftOf(f),Rr=rightOf(f),b={x:-f.x,y:-f.y},sh=(d,dmg,el)=>S.proj(e,d,{speed:30,range:16,dmg,label:'이상과 진실',el,big:true});
        S.leap(e,L,5,26); after(1,()=>{ if(e.dead) return; sh(Rr,30,'shadow'); S.leap(e,Rr,10,30); after(1,()=>{ if(e.dead) return; sh(L,30,'steel'); S.leap(e,f,8,28); after(1,()=>{ if(e.dead) return; sh(b,30,'shadow'); sh(b,30,'steel'); }); }); }); }}
  },note:'왼쪽·오른쪽은 조준 방향을 기준으로 한다. 대칭은 스킬 뒤 0.5초 안에 웅크리기 단추. 흑백연가 중에는 흑건·백건·대칭의 도약 거리가 두 배다.'}
});

/* ───── 서사급 추가분 공통: 기본 수치·겉모습·궁극기 진행·상태 ───── */
for(const k in CH){ const c=CH[k],b=CLASSES[c.cls]; c.hp=b.hp; c.atk=b.atk; c.key=k; }
Object.assign(LOOK,{
 roven:{el:'nature',w:'greatsword',hair:'#9fd67a',acc:['cape'],cape:'#f3f6ee',bl:'#c9f0b0'}, baron:{el:'steel',w:'spear',hair:'#6a5a4a',acc:['bandana'],band:'#c0392b'},
 licros:{el:'blood',w:'axe',hair:'#8a1f1f',acc:['fur','paint']}, euclein:{el:'water',w:'saber',hair:'#3a6fc9',acc:['cape','ponytail'],cape:'#1f4f9a',bl:'#9fd4ff',gd:'#4fb6ff'},
 aktion:{el:'earth',w:'mace',nosh:true,hair:'#6b4a2a',acc:['fur','pauldrons'],metal:'#8a7a5a'}, hamel:{el:'justice',w:'sword',hair:'#e9e2c6',acc:['pauldrons','cape'],cape:'#e9e2c6',shield:'#d9d2b6',sh:true,metal:'#d9d2b6'},
 dantalion:{el:'iron',w:'spear',hair:'#7c828f',acc:['pauldrons','plume'],plume:'#4a4f5c',metal:'#7c828f',tip:'#c9d0dc'}, verderin:{el:'blood',w:'shotgun',hair:'#3a0f14',acc:['hood','pauldrons'],hood:'#5a0f1a',metal:'#6a1a22'},
 gardnant:{el:'earth',w:'greatsword',hair:'#8a8f99',acc:['pauldrons'],metal:'#9aa3b5',bl:'#b9b1a3'},
 salomon:{el:'arcane',w:'ringstaff',hair:'#e8e2f5',acc:['crown','robe']}, barsa:{el:'fire',w:'wand',hair:'#ff7a3c',acc:['hat','robe'],hat:'#8a1f14'},
 pluto:{el:'shadow',w:'scythes',hair:'#20202e',acc:['hood','robe'],hood:'#14141f'}, piana:{el:'dream',w:'saber',hair:'#ffd6ec',acc:['ponytail','ribbon'],bl:'#ffe6f3',gd:'#ff9fd6'},
 bunt:{el:'arcane',w:'wand',hair:'#2a2a3a',acc:['cowboy','scarf'],scarf:'#b58cff'}, roland:{el:'powder',w:'spear',hair:'#ffe27a',acc:['goggles','robe'],tip:'#fff3d6'},
 licht:{el:'royal',w:'ringstaff',hair:'#f1e3a0',acc:['crown','cape','robe'],cape:'#7a1420'},
 stern:{el:'hunt',w:'saber',hair:'#3a3f33',acc:['scarf','pack'],scarf:'#c9e06a'}, mor:{el:'shadow',w:'dagger2',hair:'#14141f',acc:['hood','cape'],hood:'#14141f',cape:'#1a1a2a'},
 tyrfing:{el:'blood',w:'greatsword',hair:'#1f1014',acc:['hood','scarf'],hood:'#2a0a10',scarf:'#d8324a',bl:'#d8324a'}, rias:{el:'blood',w:'dagger2',hair:'#e8e2e2',acc:['mask']},
 fomal:{el:'water',w:'spear',hair:'#3a8ac9',acc:['cowboy'],tip:'#c9ecff'}, sonia:{el:'dream',w:'wand',hair:'#b6f08a',acc:['goggles','robe','pack']},
 margaret:{el:'fire',w:'leafstaff',hair:'#ffb347',acc:['sprout','robe']}, nevia:{el:'spirit',w:'wand',hair:'#e0fffb',acc:['veil','robe']},
 wayne:{el:'mind',w:'revolver',hair:'#6b5a4a',acc:['cowboy','cape'],cape:'#6b5a4a'}, rtien:{el:'snow',w:'saber',hair:'#b9c6d6',acc:['hood','scarf'],hood:'#9aa7ba',scarf:'#dcefff'},
 irenio:{el:'justice',w:'revolver',hair:'#2a2a3a',acc:['cape','crown'],cape:'#20202e'}, petra:{el:'steam',w:'crossbow',hair:'#c98f4a',acc:['goggles','pack']},
 libra:{el:'steel',w:'revolver',hair:'#ffffff',acc:['jester']}
});
Object.assign(RES,{
 roven:{u:e=>e.r.cnt/10,p:e=>[e.r.b,10,'#f3f6ee'],gz:e=>[e.r.n/10,'#7fdc7a']}, baron:{u:e=>e.r.awN?0:e.r.cnt/24}, licros:{u:e=>e.r.big/10,p:e=>e.r.gs?[e.r.gs/4,4,'#d8324a']:null},
 euclein:{u:e=>e.r.h/40}, aktion:{u:e=>e.r.cc/24}, hamel:{u:e=>e.r.cl/12}, dantalion:{u:e=>e.r.brk/20}, verderin:{u:e=>e.r.used/888,gz:e=>[e.r.am/100,'#d8324a']},
 gardnant:{u:e=>e.r.cd/200}, salomon:{u:e=>(Math.min(1,e.r.plus/10)+Math.min(1,e.r.bt/30))/2,gz:e=>[e.r.mp/100,'#b58cff']}, barsa:{u:e=>e.r.n/44},
 pluto:{u:e=>foes(e).some(t=>has(t,'hades'))?1:0}, piana:{u:e=>e.r.sa/120,gz:e=>[e.r.sa/200,'#ff9fd6']}, bunt:{u:e=>e.r.n/6}, roland:{u:e=>e.r.oc>now?e.r.el/100:0,gz:e=>[e.r.el/100,'#ffe27a']},
 licht:{u:e=>(Math.min(1,e.r.rb/16)+Math.min(1,e.r.nul/4))/2}, stern:{u:e=>e.r.odT/60,p:e=>[e.r.cap,5,'#c9e06a']}, mor:{u:e=>e.r.n/24,gz:e=>[e.r.sh/100,'#8a7bd6']},
 tyrfing:{u:e=>e.r.spent/300}, rias:{u:e=>e.r.bl/180}, fomal:{u:e=>e.r.ok/5,p:e=>[e.r.fish,Math.max(3,e.r.fish),'#4fb6ff']}, sonia:{u:e=>e.r.awN/3,p:e=>[1,1,['#4fb6ff','#ff9fd6','#7fdc7a'][e.r.i]]},
 margaret:{u:e=>e.r.healed/120}, nevia:{u:e=>e.r.made/10,p:e=>[e.r.q.length,3,'#6ff2e0']}, wayne:{u:e=>e.r.ok/7}, rtien:{u:e=>e.r.n/9,p:e=>[e.r.bt,2,'#dcefff']},
 irenio:{u:e=>e.r.exec?1:0,p:e=>[e.r.am,6,'#ffd98a']}, petra:{u:e=>e.r.ok?1:e.r.streak/3,p:e=>[e.r.tr,8,'#ffb15e']}, libra:{u:e=>(Math.min(30,e.r.hb)+Math.min(30,e.r.hw))/60}
});
const chgRing=(e,by)=>{ if(!e.chg) return; const f=Math.min(1,(now-e.chg.t0)/e.chg.max); g.strokeStyle=f>=1?'#fff6d6':'#f0b458'; g.lineWidth=4/cell; g.beginPath(); g.arc(e.x,by,.82,-1.571,-1.571+6.283*f); g.stroke(); emit(e,by,'earth',.3); };
Object.assign(AURA,{
 roven(e,by){ if(e.r.aw>now) emit(e,by,'nature',.4); if(e.r.next) ringAt(e.x,e.y,.72,'#f3f6ee',3); }, baron(e,by){ if(e.r.ek>now) ringAt(e.x,e.y,.72,'#cfd8ea',3); },
 licros(e,by){ if(e.r.rage>now){ emit(e,by,'blood',.5); ringAt(e.x,e.y,.75,'#d8324a',3); } if(e.r.dance>now) emit(e,by,'fire',.4); if(e.r.pa>now||e.r.gsR||e.r.dEnd>now) ringAt(e.x,e.y,.9,'#ff9a9a',2,[.2,.14]); },
 euclein(e,by){ foes(e).forEach(t=>{ if(CH.euclein.sg(e,t)){ g.strokeStyle='rgba(79,182,255,.6)'; g.lineWidth=2/cell; g.beginPath(); g.arc(t.x,t.y+.06,.7,now*3,now*3+2); g.stroke(); g.beginPath(); g.arc(t.x,t.y+.06,.7,now*3+3.14,now*3+5.14); g.stroke(); } }); },
 aktion(e,by){ chgRing(e,by); }, gardnant(e,by){ chgRing(e,by); if(e.r.inst) ringAt(e.x,e.y,.9,'#fff6d6',2.5,[.16,.12]); },
 hamel(e,by){ if(e.r.pcd<=0) ringAt(e.x,e.y,.7,'rgba(255,217,138,.6)',1.5,[.1,.16]); }, dantalion(e,by){ if(e.r.wt>now) ringAt(e.x,e.y,.75,'#b9b1a3',3); },
 verderin(e,by){ if(e.r.on) emit(e,by,'blood',.5); if(CH.verderin.tam(e)) ringAt(e.x,e.y,.8,'#d8324a',3); },
 salomon(e,by){ if(has(e,'invuln')) AURA.cornwall(e,by); }, barsa(e,by){ if(e.r.pcd<=0) emit(e,by,'fire',.2); },
 pluto(e,by){ if(e.r.gh>now){ emit(e,by,'shadow',.5); ringAt(e.x,e.y,.75,'#8a7bd6',2.5); } foes(e).forEach(t=>{ if(has(t,'hades')) markOn(t,'#c9c2ff','명부'); }); },
 piana(e,by){ if(e.r.bloom>now){ emit(e,by,'dream',.6); ringAt(e.x,e.y,.8,'#ff9fd6',3); } }, bunt(e,by){ if(e.r.pcd<=0) emit(e,by,'arcane',.2); },
 roland(e,by){ if(e.r.el>=40) emit(e,by,'powder',e.r.el/160); if(e.r.oc>now||e.r.sky>now) ringAt(e.x,e.y,.8,'#ffe27a',3.5); },
 licht(e,by){ if(e.r.still) ringAt(e.x,e.y,6,'rgba(111,162,255,.35)',1.5,[.3,.3]); foes(e).forEach(t=>{ if(has(t,'rebel')) markOn(t,'#6fa2ff','불령'); }); },
 stern(e,by){ if(e.r.od>now) emit(e,by,'hunt',.4); if(e.r.ab>now) ringAt(e.x,e.y,.8,'#c9e06a',3); }, mor(e,by){ if(e.r.veil>now||e.r.dark>now) emit(e,by,'shadow',.6,1.2); },
 tyrfing(e,by){ if(e.r.sk) ringAt(e.x,e.y,.72,'#d8324a',2.5); if(e.r.er>now) emit(e,by,'blood',.6,1.2); },
 rias(e,by){ if(e.r.ut>now){ emit(e,by,'blood',.6); ringAt(e.x,e.y,.8,'#d8324a',3); } foes(e).forEach(t=>{ if(has(t,'wound')&&Math.random()<.3) puff(t.x,t.y-t.z*.45,'blood',1,1,.5); }); },
 fomal(e,by){ if(e.r.sw>now) emit(e,by,'water',.9,1); }, sonia(e,by){ if(e.r.stir>now) emit(e,by,['water','dream','nature'][e.r.i],.6); if(e.r.lock>now||e.r.all>now) ringAt(e.x,e.y,.8,['#4fb6ff','#ff9fd6','#7fdc7a'][e.r.i],3); },
 margaret(e,by){ if(e.r.life>now) emit(e,by,'fire',.5); if(e.r.ou>now) for(const o of e.r.orbs){ if(o.n<=0) continue; g.fillStyle=o.n>1?'#ffd36b':'#ff7a3c'; g.shadowColor='#ff7a3c'; g.shadowBlur=10; g.beginPath(); g.arc(o.x,o.y,.22,0,7); g.fill(); g.shadowBlur=0; }
   foes(e).forEach(t=>{ if(has(t,'ember')&&Math.random()<.4) puff(t.x,t.y-t.z*.45,'fire',1,1,.5); }); },
 nevia(e,by){ for(const o of e.r.orbs){ const q=.5+.5*Math.sin(now*5); g.fillStyle='rgba(111,242,224,'+(.5+.3*q)+')'; g.strokeStyle='#e0fffb'; g.lineWidth=2/cell; g.shadowColor='#6ff2e0'; g.shadowBlur=10; g.beginPath(); g.arc(o.x,o.y,.3+.04*q,0,7); g.fill(); g.stroke(); g.shadowBlur=0; } },
 wayne(e,by){ if(e.r.dt>now) ringAt(e.x,e.y,.75,'#f3e7c0',3); }, rtien(e,by){ if(e.r.bt>0) emit(e,by,'snow',.2*e.r.bt); },
 irenio(e,by){ if(e.r.pan>now){ ringAt(e.x,e.y,.8,'#ffd98a',3.5); emit(e,by,'justice',.4); } if(e.r.ak>now) ringAt(e.x,e.y,.95,'#ff7d8c',2,[.2,.14]); },
 petra(e,by){ foes(e).forEach(t=>{ const gl=has(t,'goal'); if(gl&&gl.by===e) markOn(t,'#ffb15e','목표'); }); }, libra(e,by){ if(e.r.dbl>now) ringAt(e.x,e.y,.8,'#ffffff',3); }
});
Object.assign(STATES,{
 roven:e=>[e.r.aw>now&&['녹세 백검',until(e.r.aw)],e.r.next&&['다음 공격 +10']], baron:e=>[e.r.ek>now&&['연격창',until(e.r.ek)]],
 licros:e=>[e.r.pa>now&&['파쇄',until(e.r.pa)],e.r.rage>now&&['격노',until(e.r.rage)],e.r.gsR&&['격살 '+e.r.gs],e.r.dance>now&&['광란의 춤',until(e.r.dance)],e.r.ut>now&&['투쟁격화',until(e.r.ut)]],
 euclein:e=>[], aktion:e=>[e.chg&&['차징'],e.r.half&&['다음 피해 절반']], hamel:e=>[], dantalion:e=>[e.r.wt>now&&['철벽',until(e.r.wt)],e.r.army>now&&['철군',until(e.r.army)]],
 verderin:e=>[e.r.on&&['혈사'],CH.verderin.tam(e)&&['탐식',e.r.perm?undefined:until(e.r.tam)]], gardnant:e=>[e.chg&&['차징'],e.r.inst&&['즉시 차징'],e.r.bt>now&&['무퇴',until(e.r.bt)],e.r.sk&&['스킬 피해 -15']],
 salomon:e=>[e.r.zn&&['마나 번']], barsa:e=>[], pluto:e=>[e.r.gh>now&&['망령',until(e.r.gh)]], piana:e=>[e.r.bloom>now&&['화무십일홍',until(e.r.bloom)]], bunt:e=>[],
 roland:e=>[e.r.oc>now&&['과전류',until(e.r.oc)],e.r.sky>now&&['천뇌',until(e.r.sky)]], licht:e=>[e.r.still&&['권위']],
 stern:e=>[e.r.od>now&&['에스툼 중독',until(e.r.od)],e.r.ab>now&&['오남용',until(e.r.ab)]], mor:e=>[e.r.on&&['그림자'],e.r.veil>now&&['흑막',until(e.r.veil)],e.r.dark>now&&['암약',until(e.r.dark)]],
 tyrfing:e=>[e.r.er>now&&['침식',until(e.r.er)]], rias:e=>[e.r.ut>now&&['암혈 살귀',until(e.r.ut)]], fomal:e=>[e.r.sw>now&&['헤엄']],
 sonia:e=>[e.r.stir>now&&['연금의 솥',until(e.r.stir)],e.r.lock>now&&['시약 고정',until(e.r.lock)],e.r.all>now&&['궁극의 시약',until(e.r.all)]],
 margaret:e=>[e.r.life>now&&['생명의 불',until(e.r.life)],e.r.ou>now&&['번영',until(e.r.ou)]], nevia:e=>[e.r.plus>0&&['다음 스킬 +'+e.r.plus]], wayne:e=>[e.r.dt>now&&['추리',until(e.r.dt)]],
 rtien:e=>[e.r.city&&['안개의 도시']], irenio:e=>[e.r.ak>now&&['악일',until(e.r.ak)],e.r.pan>now&&['판가름',until(e.r.pan)],e.r.rush>now&&['즉결 심판',until(e.r.rush)]],
 petra:e=>[], libra:e=>[e.r.dbl>now&&['흑백연가',until(e.r.dbl)]]
});
Object.assign(STY,{
 roven:{'연대녹':'cut','연대녹 (대백검)':'spin','대백신':'thrust','대백신 (대백검)':'quake','녹세 백검 (대백검)':'spin','녹세 백검 (대녹검)':'cut','이검동화':'spin'},
 baron:{'창섬':'thrust','차륜':'spin','일점 돌파':'dash','난전 격파':'thrust','연격창 (올려치기)':'thrust','연격창 (내려치기)':'cut'},
 euclein:{'용솟음 (내려베기)':'cut'}, aktion:{'강타':'cut'}, dantalion:{'격철':'thrust'}, gardnant:{'무퇴':'cut','피형참극':'slash'},
 salomon:{'볼트':'orb'}, barsa:{'작열의 꽃':'leaf'}, pluto:{'사멸':'skull'}, bunt:{'발판':'knife','멋진 등장 (금)':'knife','멋진 등장 (은)':'knife'}, roland:{'뇌창':'bigarrow'}, licht:{'계약':'chain'},
 stern:{'삼연격':'slash'}, mor:{'그림자 밟기':'skull'}, rias:{'톱날':'disc'}, fomal:{'낚시':'chain'}, sonia:{'투척':'orb'}, rtien:{'취연':'orb'},
 irenio:{'권약':'bullet','선일':'shout'}, petra:{'함정':'robot','위험 목표':'bullet'}, libra:{'흑건':'bullet','백건':'bullet','흑백연가':'bullet','이상과 진실':'bullet'}, verderin:{'혈사':'tracer'}
});
