"use strict";
/* 2023년 카드 가운데 빠져 있던 12명: 듀크 · 알비온 · 울펜하임 · 키비 · 비비 · 테오르 · 스타트 + 히든 아몬 · 알론소 · 라사 · 천갈 · 나가토.
   수치는 카드 원문(cardtext6.js) 그대로. 카드에 없어 정한 것은 note에 적었다.
   웅크리고 '있는 동안'이 필요한 캐릭터는 웅크리기 칸이 hold:true다(단추를 누르고 있으면 계속 웅크린다). */
const crouching=e=>e.r.cr>now;
const XCROUCH=o=>Object.assign({name:'웅크리기',cd:.2,hold:true,ai:()=>false,cast(e){ e.r.cr=now+(e===me?.4:1); }},o||{});
const healOver=(e,total,dur)=>{ const n=Math.max(1,Math.round(dur)); for(let i=1;i<=n;i++) after(i,()=>heal(e,total/n)); };
const ring=(e,r,lab,v,el,at)=>fx.push({k:'circle',x:(at||e).x,y:(at||e).y,r,t0:now,team:e.team,lab,src:e,v,el});
/* 포물선으로 던지는 것이 떨어질 거리: 사거리 안에 적이 있으면 그 적까지, 없으면 사거리 끝 */
const lob=(e,max)=>{ const t=tgt(e,max); return t?Math.max(2,dist(e,t)):max; };
const inMap=p=>({x:Math.max(1,Math.min(W-1,p.x)),y:Math.max(1,Math.min(H-1,p.y))});

/* ───── 아몬의 여섯 낱말과 발현 21가지 ───── */
const WORDS=['아노','메라','호너','티시','새티','이든'],WKEY={b:'아노',n2:'메라',crouch:'호너',jump:'티시',aw:'새티',ult:'이든'};
const burn=(e,t,total,dur)=>{ if(!t.dead) dot(e,t,total,dur,'불태움'); };
const slash2=(e,each,o)=>S.leap(e,moveDir(e),4,22,()=>{ S.arc(e,4,each,o.lab,{v:'slash',el:o.el,knock:0}); after(.12,()=>{ if(!e.dead) S.arc(e,4,each,o.lab,{v:'slash',el:o.el,post:o.post}); }); });
const MAN={
 '아노+아노':['프로미넌스',e=>S.line(e,7,15,'프로미넌스',{v:'beam',el:'fire',post:t=>burn(e,t,12,4)})],
 '아노+메라':['과열된 증기',e=>zone(e,{x:e.x,y:e.y,r:5,dur:5.05,every:1,label:'과열된 증기',tick:(z,inn)=>inn.forEach(t=>damage(e,t,8,'과열된 증기'))})],
 '아노+호너':['열풍 검격',e=>slash2(e,9,{lab:'열풍 검격',el:'fire',post:t=>burn(e,t,9,3)})],
 '아노+티시':['용암 갑주',e=>{ shield(e,18,3); e.r.armor={until:now+3,fire:true,name:'용암 갑주'}; }],
 '아노+새티':['영원의 불꽃',e=>{ healOver(e,15,5); e.r.nb=true; }],
 '아노+이든':['복수의 불꽃',e=>{ pay(e,20); ring(e,6,'복수의 불꽃','nova','fire'); foes(e).forEach(t=>{ if(dist(e,t)<=6+R) dot(e,t,45,9,'복수의 불꽃'); }); }],
 '메라+메라':['급속 냉각',e=>S.line(e,7,22,'급속 냉각',{root:.5,v:'beam',el:'ice'})],
 '메라+호너':['차가운 폭풍',e=>slash2(e,8,{lab:'차가운 폭풍',el:'ice',post:t=>add(t,'slow',3,.2,{by:e})})],
 '메라+티시':['혹한 갑주',e=>{ shield(e,18,3); e.r.armor={until:now+3,fire:false,name:'혹한 갑주'}; }],
 '메라+새티':['피어난 눈꽃',e=>{ healOver(e,15,5); ring(e,5,'피어난 눈꽃','nova','ice'); foes(e).forEach(t=>{ if(dist(e,t)<=5+R) add(t,'slow',5,.1,{by:e}); }); }],
 '메라+이든':['서리 심장',e=>{ pay(e,20); S.circle(e,6,36,'서리 심장',{root:1,v:'nova',el:'ice'}); }],
 '호너+호너':['바람 걸음',e=>{ const hopHit=()=>{ if(!e.dead) S.circle(e,3,8,'바람 걸음',{knock:1.5,v:'vortex',el:'wind'}); }; S.leap(e,moveDir(e),4,24,()=>{ hopHit(); S.leap(e,moveDir(e),4,24,hopHit); }); }],
 '호너+티시':['사막의 바람',e=>{ add(e,'haste',4,.2); add(e,'resist',4,.2); }],
 '호너+새티':['산들바람의 춤',e=>{ S.leap(e,{x:-e.aim.x,y:-e.aim.y},7,24); healOver(e,16,4); }],
 '호너+이든':['검은 용오름',e=>{ pay(e,20); for(let i=0;i<5;i++) after(i*.15,()=>{ if(!e.dead) S.circle(e,6,8,'검은 용오름',{air:i?0:1.5,knock:0,v:'vortex',el:'shadow'}); }); }],
 '이든+이든':['칠흑빛 영혼',e=>{ pay(e,40); S.line(e,5,70,'칠흑빛 영혼',{v:'scythe',el:'shadow'}); }],
 '새티+새티':['인도하는 빛',e=>{ heal(e,25); S.line(e,7,0,'인도하는 빛',{silence:1,knock:0,v:'beam',el:'holy'}); }],
 '새티+이든':['혼돈의 빛',e=>{ pay(e,20); mates(e,6).forEach(a=>heal(a,15)); S.circle(e,6,15,'혼돈의 빛',{v:'nova',el:'holy'}); }],
 '티시+티시':['암석화',e=>add(e,'resist',2,.8)],
 '티시+새티':['자연의 은총',e=>{ healOver(e,15,5); add(e,'resist',5,.1); }],
 '티시+이든':['괴리된 땅',e=>{ pay(e,20); S.circle(e,6,30,'괴리된 땅',{stun:1,v:'quake',el:'earth'}); }]
};

Object.assign(CH,{
/* ───────── 서사 ───────── */
duke:{name:'미덕의 영웅, 듀크',cls:'수호자',grade:'서사',range:2.4,
  init:e=>{e.r={mi:0,gd:0,abs:0,cr:0}}, hud:e=>'미덕 '+Math.floor(e.r.mi)+(e.r.gd>now?' · 수호자':'')+' · 막은 피해 '+Math.floor(e.r.abs)+'/500',
  tick(e,dt){ if(crouching(e)) e.r.mi=Math.min(100,e.r.mi+10*dt*(e.r.gd>now?2:1)); },
  spend(e){ const m=e.r.mi; e.r.mi=0; if(m>=2) shield(e,Math.round(m/2),4); return m; },
  onStatus(e,k,t){ if(e.r.mi>=100){ e.r.mi=0; proc(e,'미덕','상태이상 해제'); return 0; } return t; },
  onShield(e,v){ e.r.abs+=v; },
  modTake(e,src,amt){ return src!==e&&e.r.gd>now&&e.sh.length?amt*.9:amt; },
  onCast(e,s){ if(e.r.gd>now&&s!=='crouch') mates(e,4).forEach(a=>heal(a,10)); },
  skills:{
   n1:{name:'제압',cd:8,r:3,cast(e){ CH.duke.spend(e); add(e,'slow',2,.2,{self:true}); for(let i=1;i<=4;i++) after(i*.5,()=>{ if(!e.dead) S.circle(e,3,5,'제압',{knock:0,v:'spin'}); }); }},
   n2:{name:'출수',cd:10,r:3.5,cast(e){ CH.duke.spend(e); const t=tgt(e,3.5); if(t){ ring(e,1,'출수','punch',null,t); strike(e,t,18,'출수',{air:3,knock:0}); } S.leap(e,t?norm(e.x-t.x,e.y-t.y):{x:-e.aim.x,y:-e.aim.y},3,18,null,true); }},
   aw:{name:'친절의 부',cd:30,r:5,cast(e){ e.r.gd=now+6; e.r.mi=100; }},
   ult:{name:'나눔의 선',cd:0,r:6,can:e=>e.r.abs>=500,need:'보호막으로 막은 피해 500',cast(e){ const m=CH.duke.spend(e),g=e.r.gd>now; for(let i=1;i<=5;i++) after(i,()=>{ if(e.dead) return; ring(e,6,'나눔의 선','nova','holy'); mates(e,6).forEach(a=>{ heal(a,m/5); if(g&&m>=10) shield(a,Math.round(m/10),3); }); }); }},
   crouch:XCROUCH()
  },note:"웅크리기 단추를 누르고 있는 동안 미덕이 쌓인다. 미덕으로 얻는 보호막은 지속 시간이 카드에 없어 4초로 잡았다. 아군 대상 효과는 1대1에서는 자신에게 든다."},
wolfen:{name:'가열찬 투지, 울펜하임',cls:'암살자',grade:'서사',range:2.3,
  init:e=>{e.r={cy:0,oh:0}}, hud:e=>e.r.oh>now?'과열':'실린더 '+e.r.cy+'/3',
  tick(e){ if(e.r.oh>now) for(const k of ['n1','n2','aw']) e.cd[k]=8; },
  onCast(e,s){ if(e.r.cy>=3){ e.r.oh=now+5; proc(e,'실린더','과열 5초'); after(5,()=>{ if(e.dead) return; e.r.cy=0; add(e,'silence',4,0,{self:true}); }); } else e.r.cy++; },
  basicBonus(e,t){ if(e.r.oh>now) damage(e,t,t.max*.03,'과열'); },
  skills:{
   n1:{name:'폭진',cd:14,r:8,ai:(e,d)=>d>2.5&&d<=9,cast(e){ add(e,'slow',4,.25,{self:true}); after(4,()=>{ if(!e.dead) S.leap(e,moveDir(e),8,24,()=>S.circle(e,2,25,'폭진',{stun:.5,v:'blast',el:'fire'})); }); }},
   n2:{name:'추맹',cd:16,r:3,cast(e){ add(e,'vuln',4,.1,{self:true}); after(4,()=>{ if(e.dead) return; hop(e,3); S.circle(e,3,30,'추맹',{air:5,knock:0,v:'punch',pre:t=>{ if(has(t,'stun')) add(t,'silence',1,0,{by:e}); }}); }); }},
   aw:{name:'버닝 차지',cd:30,r:8,cast(e){ add(e,'glow',6,0,{self:true}); after(6,()=>{ if(e.dead) return; S.line(e,8,t=>aired(t)?45:30,'버닝 차지',{v:'beam',el:'fire'}); S.leap(e,{x:-e.aim.x,y:-e.aim.y},3,20,null,true); }); }}
  },note:"궁극 스킬 카드가 없다. 폭진과 추맹은 4초(둔화·받피증이 걸린 시간), 버닝 차지는 6초(발광 시간)를 기다린 뒤에 나간다. 기다리는 동안 움직이고 다른 행동을 할 수 있고, 나갈 때의 방향은 그 순간 바라보는 쪽이다. 과열이 끝나면 스킬 대기시간이 8초에서 다시 흐른다."},
teor:{name:'움직이는 땅, 테오르',cls:'지원가',grade:'서사',range:7,
  init:e=>{e.r={gd:0,gT:0,taken:0}}, hud:e=>'격동 '+e.r.gd+'/2 · 받은 피해 '+Math.floor(e.r.taken)+'/350',
  onHurt(e,src,amt){ if(src===e) return; e.r.taken+=amt; if(e.r.gT<=now){ e.r.gT=now+16; shield(e,24,8); e.r.gd=Math.min(2,e.r.gd+1); proc(e,'격동','보호막 24'); } },
  skills:{
   n1:{name:'석주',cd:8,r:11,cast(e){ S.proj(e,e.aim,{speed:22,range:12,dmg:16,label:'석주',v:'shard',o:{knock:2,slow:[.4,1]}}); }},
   n2:{name:'진각',cd:18,r:5,cast(e){ S.circle(e,5,0,'진각',{air:1.5,knock:0,v:'quake',el:'earth',post:t=>add(t,'weak',4,2,{by:e})}); }},
   aw:{name:'지각 변동',cd:30,r:5,ai:e=>hurtNow(e)&&e.hp<e.max*.6,cast(e){ S.focus(e,1); after(1,()=>{ if(e.dead) return; const x=e.x,y=e.y; wall(e,x,y-4.5,9,1,5); wall(e,x,y+4.5,9,1,5); wall(e,x-4.5,y,1,9,5); wall(e,x+4.5,y,1,9,5); add(e,'resist',5,.2); }); }},
   ult:{name:'대지 진각',cd:0,r:9,can:e=>e.r.taken>=350,need:'받은 피해 350',cast(e){ S.focus(e,3); after(3,()=>{ if(e.dead) return; for(let i=0;i<3;i++) after(i*.12,()=>ring(e,2+i*3.5,'대지 진각','quake','earth')); S.circle(e,9,30,'대지 진각',{air:3,disarm:4,knock:0,zfree:true,v:'quake',el:'earth'}); }); }},
   crouch:{name:'벽 세우기',cd:.5,can:e=>e.r.gd>0,need:'격동',ai:e=>hurtNow(e),cast(e){ e.r.gd--; const p=front(e,1.6),hz=Math.abs(e.aim.x)>Math.abs(e.aim.y); wall(e,p.x,p.y,hz?1:3,hz?3:1,8); }}
  },note:"격동의 벽(2x3)은 바라보는 쪽 1.6칸 앞에 가로 3칸으로 선다. 지각 변동의 벽은 자신을 가운데 둔 9x9칸 테두리다. 강화된 쇠약은 쇠약의 두 배(기본 공격 -8, 스킬 -4)로 잡았다."},

/* ───────── 전설 ───────── */
albion:{name:'풍뢰의 진룡, 알비온',cls:'암살자',grade:'전설',range:2.4,
  init:e=>{e.r={yl:0,acc:0,nm:0,up:0,dr:0,dacc:0,pr:0,ph:0,org:null,uid:0}}, hud:e=>'역린 '+e.r.yl+'/12 · 뇌명 '+e.r.nm,
  zap(e,t){ if(e.r.pr>now&&!t.dead){ add(t,'stun',.25,0,{by:e}); air(t,1); } },
  dragon(e,full,keep){ const n=full?12:e.r.yl; if(!keep) e.r.yl=0; if(n<=0) return; proc(e,'진룡','피해 '+n*3); ring(e,4,'진룡','nova','wind');
    for(let i=0;i<3;i++) after(i*.1,()=>{ if(e.dead) return; foes(e).forEach(t=>{ if(dist(e,t)<=4+R&&damage(e,t,n,'진룡',{amp:true})){ heal(e,n/2,true); CH.albion.zap(e,t); } }); }); },
  onDeal(e,t,amt,label,o){ if(o&&o.amp) return; e.r.yl=Math.min(12,e.r.yl+1); if(e.r.pr>now&&++e.r.ph>=6){ e.r.ph=0; CH.albion.dragon(e,false,true); } },
  onSkillHit(e,t){ CH.albion.zap(e,t); },
  onStatus(e,k,t){ return e.r.pr>now&&k==='slow'?0:t; },
  tick(e,dt){ e.r.acc+=dt; if(e.r.acc>=12){ e.r.acc-=12; CH.albion.dragon(e); } if(e.r.dr>now){ e.r.dacc+=dt; if(e.r.dacc>=1){ e.r.dacc-=1; CH.albion.dragon(e,true,true); } } },
  land(e){ e.r.up=0; e.z=0; e.vz=0; e.x=e.r.org.x; e.y=e.r.org.y; S.circle(e,8,24,'백룡 강림',{silence:2,air:4,knock:0,zfree:true,v:'quake',el:'wind'}); add(e,'haste',5,.2); e.r.dr=now+5; e.r.dacc=0; },
  skills:{
   n1:{name:'삭풍',cd:7,r:5,can:e=>!(e.r.up>now),cast(e){ S.focus(e,.5); after(.5,()=>{ if(e.dead) return; const p0={x:e.x,y:e.y},p1={x:e.x+e.aim.x*5,y:e.y+e.aim.y*5}; for(let i=0;i<10;i++) after(i*.2,()=>{ if(!e.dead) S.seg(e,p0,p1,1.6,2,'삭풍',{knock:0,v:'windcut',el:'wind'}); }); }); }},
   n2:{name:'뇌명',cd:4,r:4,can:e=>e.r.nm>=1&&!(e.r.up>now),need:'뇌명 1',cast(e){ e.r.nm--; S.blink(e,moveDir(e),3); S.circle(e,1,8,'뇌명',{silence:.5,knock:0,v:'bolt'}); }},
   aw:{name:'백룡 강림',kind:'초월',cd:60,r:7,can:e=>!(e.r.up>now),cast(e){ e.r.up=now+3; e.r.org={x:e.x,y:e.y}; e.vz=G*1.5; e.launched=false; const id=++e.r.uid; after(3,()=>{ if(!e.dead&&e.r.uid===id&&e.r.up>0) CH.albion.land(e); }); }},
   ult:{name:'풍뇌이검룡',cd:0,r:8,can:e=>e.r.yl>=12&&e.r.up>now,need:'역린 12 + 백룡 강림 직후',cast(e){ e.r.up=0; e.z=0; e.vz=0; e.r.pr=now+7; e.r.ph=0; add(e,'resist',7,.2); rm(e,'slow'); }},
   crouch:{name:'뇌명 충전',cd:.3,can:e=>e.r.yl>=4&&e.r.nm<2,need:'역린 4',cast(e){ e.r.yl-=4; e.r.nm++; }}
  },note:"진룡은 세 번에 나눠 '역린 x 3'을 준다. 백룡 강림은 3초 동안 높이 떠 있다가 날아오른 자리로 떨어진다(떠 있는 동안 궁극 스킬로만 끊을 수 있다). 풍뇌룡의 '기동력 변동 무효'는 둔화를 받지 않는 것으로 처리했다."},
kivi:{name:'전쟁의 효시, 키비',cls:'암살자',grade:'전설',range:1.4,
  init:e=>{e.r={cr:0,nx:new Map(),cn:new Map(),wire:null,wT:0,gan:0,sa:0}}, hud:e=>'절단 '+Math.max(0,...e.r.cn.values())+'/7'+(e.r.wire&&e.r.wire.until>now?' · 와이어':'')+(e.r.gan>now?' · 간계':''),
  altBasic:e=>crouching(e),
  tick(e){ if(!crouching(e)) return; for(const t of foes(e)) if(dist(e,t)<=1.5&&Math.abs(t.z-e.z)<1.5&&(e.r.nx.get(t)||0)<=now){ e.r.nx.set(t,now+1); e.r.cn.set(t,(e.r.cn.get(t)||0)+1); ring(e,1,'절단','spin'); damage(e,t,30,'절단',{skill:true}); } },
  modTake(e,src,amt){ if(src!==e&&e.r.gan>now&&amt>0){ e.r.gan=0; say(e,'간계','#ffe9a0'); after(.02,()=>CH.kivi.counter(e)); return 0; } return amt; },
  counter(e){ if(e.dead) return; const p0={x:e.x,y:e.y}; S.blink(e,e.aim,8); const hit=S.seg(e,p0,{x:e.x,y:e.y},1.6,25,'간계',{air:2,knock:0,v:'cut'}); if(e.r.wT>now&&!e.ultUsed&&hit.some(t=>!t.dead&&(e.r.cn.get(t)||0)>=7)){ e.ultUsed=true; proc(e,'금살 귀천무','자동 시전'); CH.kivi.skills.ult.cast(e); } },
  dashTo(e){ const w=e.r.wire; e.r.wire=null; const L=Math.hypot(w.x-e.x,w.y-e.y); if(L<.3) return; if(e.r.sa>now) S.seg(e,{x:e.x,y:e.y},w,1.6,15,'사살 추섬',{slow:[.2,2],knock:0,v:'cut'}); S.leap(e,norm(w.x-e.x,w.y-e.y),L,34,null,true); },
  skills:{
   n1:{name:'연결',cd:12,r:11,cast(e){ e.r.wT=now+4; S.proj(e,e.aim,{speed:34,range:12,dmg:0,label:'연결',nohit:true,v:'chain',touch:()=>{ e.cd.n1=Math.max(0,e.cd.n1-5); },onEnd:p=>{ if(!e.dead) e.r.wire=Object.assign(inMap(p),{until:now+2}); }}); }},
   n2:{name:'간계',cd:16,r:8,ai:e=>hurtNow(e)||incoming(e),cast(e){ e.r.gan=now+2; }},
   aw:{name:'사살 추섬',cd:30,r:10,cast(e){ add(e,'haste',5,.25); e.cd.n1=0; e.cd.n2=0; e.r.sa=now+5; }},
   ult:{name:'금살 귀천무',cd:0,r:18,can:()=>false,need:'자동 시전: 절단 7회 맞힌 적에게 연결 중 간계 적중',ai:()=>false,cast(e){ e.busy=now+2.3; for(let i=0;i<22;i++) after(i*.1,()=>{ if(!e.dead){ e.z=3; e.vz=0; } });
        for(let i=0;i<4;i++) after(.25+i*.42,()=>{ if(e.dead) return; const a=Math.random()*6.283; S.proj(e,{x:Math.cos(a),y:Math.sin(a)},{speed:36,range:6,dmg:0,nohit:true,ghost:true,pierce:true,label:'금살 귀천무',v:'chain',onEnd:p=>{ if(!e.dead){ const q=inMap(p); e.x=q.x; e.y=q.y; } }}); });
        after(2.25,()=>{ if(e.dead) return; e.z=0; e.vz=0; const t=tgt(e,22); if(!t) return; near(e,t,1.1); ring(e,1.4,'금살 귀천무','cut',null,t); strike(e,t,40,'금살 귀천무',{knock:0}); if(!t.dead&&t.hp<=t.max*.2) damage(e,t,t.hp+999,'금살 귀천무 (처형)',FIX); }); }},
   crouch:XCROUCH({cast(e){ e.r.cr=now+(e===me?.4:1); if(e.r.wire&&e.r.wire.until>now&&!e.dash) CH.kivi.dashTo(e); }})
  },note:"웅크리기 단추를 누르고 있는 동안 절단이 든다(맞닿은 거리 1.5칸). 연결의 와이어는 날아가다 멈춘 자리(끝·벽·적)에 걸리고, 2초 안에 웅크리면 그 자리로 간다. 와이어가 적에게 닿으면 '적중'으로 쳐서 대기시간이 준다. 금살 귀천무는 카드 그대로 단추로는 못 쓰고, 연결을 쓴 뒤 4초 안에 간계가 '절단 7회 맞힌 적'에게 맞으면 저절로 나간다. 금색 와이어는 22칸 안의 가장 가까운 적에게 맞는 것으로 처리했다."},
vivi:{name:'화려한 광기, 비비',cls:'척후병',grade:'전설',range:8,
  init:e=>{e.r={fuel:0,bomb:null,hits:0}}, hud:e=>'연료 '+e.r.fuel+'/2 · 적중 '+e.r.hits+'/18',
  onSkillHit(e,t,label){ e.r.fuel=Math.min(2,e.r.fuel+1); if(label==='유탄'){ e.r.hits++; e.cd.aw=Math.max(0,e.cd.aw-3); } if(label==='폭탄') e.r.hits++; },
  boom(e){ const b=e.r.bomb; if(!b) return; e.r.bomb=null; b.z.until=now; if(!e.dead) S.circle(e,3,40,'폭탄',{stun:1,zfree:true,v:'blast',el:'fire'},{x:b.x,y:b.y,z:0}); },
  skills:{
   n1:{name:'유탄',cd:8,r:9,cast(e){ S.proj(e,e.aim,{speed:17,range:lob(e,10),grav:2.5,dmg:0,label:'유탄',nohit:true,v:'orb',onEnd:p=>{ if(e.dead) return; S.circle(e,2,30,'유탄',{knock:1.5,air:1,zfree:true,v:'blast',el:'fire'},{x:p.x,y:p.y,z:0}); const b=e.r.bomb; if(b&&Math.hypot(b.x-p.x,b.y-p.y)<=2.6) CH.vivi.boom(e); }}); }},
   n2:{name:'폭탄',cd:14,r:7.5,ai:(e,d)=>d>2.5&&d<=8,cast(e){ S.proj(e,e.aim,{speed:14,range:lob(e,7),grav:2,dmg:0,label:'폭탄 (투척)',nohit:true,pierce:true,v:'orb',onEnd:p=>{ if(e.dead) return; const q=inMap(p),z=zone(e,{x:q.x,y:q.y,r:.8,dur:3.2,label:'폭탄'}),b=e.r.bomb={x:q.x,y:q.y,z}; after(3,()=>{ if(e.r.bomb===b) CH.vivi.boom(e); }); }}); }},
   aw:{name:'궤도 폭격',cd:45,r:15,cast(e){ S.proj(e,e.aim,{speed:44,range:16,dmg:0,label:'궤도 폭격 (조준)',nohit:true,v:'tracer',onEnd:p=>{ if(e.dead) return; const q=inMap(p); zone(e,{x:q.x,y:q.y,r:8,dur:3,label:'폭격 예고'});
        after(3,()=>{ if(e.dead) return; zone(e,{x:q.x,y:q.y,r:8,dur:3.05,every:1,label:'궤도 폭격',tick:(z,inn)=>{ ring(e,8,'궤도 폭격','blast','fire',q); inn.forEach(t=>{ add(t,'slow',1.1,.25,{by:e}); damage(e,t,18,'궤도 폭격'); }); }}); }); }}); }},
   ult:{name:'비비 미사일',cd:0,r:16,can:e=>e.r.hits>=18,need:'유탄·폭탄 적중 18회',cast(e){ S.focus(e,1); after(1,()=>{ if(e.dead) return; S.proj(e,e.aim,{speed:9,range:lob(e,18),grav:1.5,big:true,dmg:0,label:'비비 미사일',nohit:true,v:'bigarrow',onEnd:p=>{ if(!e.dead) S.circle(e,4,t=>50+100*Math.max(0,Math.min(1,(1-t.hp/t.max)/.8)),'비비 미사일',{zfree:true,knock:2,v:'blast',el:'fire'},{x:p.x,y:p.y,z:0}); }}); }); }},
   crouch:{name:'제트팩',cd:4,can:e=>e.z>.3&&e.r.fuel>0,need:'공중 + 연료',cast(e){ e.r.fuel--; e.vz=Math.max(e.vz,Math.sqrt(2*G*1)); S.leap(e,moveDir(e),2,18,null,true); puff(e.x,e.y,'fire',8,3); }}
  },note:"유탄·폭탄·미사일은 포물선으로 날아가 떨어진 자리에서 터진다. 사거리(유탄 10칸, 폭탄 7칸, 미사일 18칸, 궤도 폭격 조준 16칸)는 카드에 없어 정했고, 그 안에 적이 있으면 가장 가까운 적의 자리에 떨어진다. 제트팩의 4초는 도약의 대기시간으로 읽었다. 비비 미사일은 체력이 가득이면 50, 20% 이하면 150 피해다."},
start:{name:'강철의 요새, 스타트',cls:'수호자',grade:'전설',range:2.4,
  init:e=>{e.r={du:100,light:false,iron:false}}, hud:e=>(e.r.iron?'철갑':e.r.light?'경갑':'중갑')+' · 내구성 '+e.r.du,
  speedMod:e=>e.r.iron?.6:e.r.light?1:.8,
  modTake(e,src,amt){ if(src===e||amt<=0) return amt; if(e.r.iron) return amt*.5; if(e.r.light) return amt; amt=Math.max(0,amt*.75-2); e.r.du=Math.max(0,e.r.du-5); if(e.r.du<=0){ e.r.light=true; proc(e,'중갑','내구성 소진 · 경갑'); } return amt; },
  onCast(e,s){ if(e.r.iron&&(s==='n1'||s==='n2')) e.cd[s]/=2; },
  skills:{
   n1:{name:'의지',cd:8,r:4,cast(e){ const L=e.r.light,f=()=>{ if(!e.dead) S.leap(e,moveDir(e),2,16,()=>S.arc(e,3,L?18:12,'의지',{stun:L?.5:1,v:'slash'})); }; if(L) f(); else { S.focus(e,1); after(1,f); } }},
   n2:{name:'수호자',cd:12,r:4,cast(e){ const L=e.r.light,f=()=>{ if(e.dead) return; shield(e,L?12:24,3); S.circle(e,4,L?16:0,'수호자',{stun:1.25,knock:0,v:'shout'}); }; if(L) f(); else { S.focus(e,1); after(1,f); } }},
   aw:{name:'강철의 길',cd:30,r:5,cast(e){ S.focus(e,2); after(2,()=>{ if(e.dead) return; shield(e,60,5); e.r.du=100; S.circle(e,5,0,'강철의 길',{stun:1,knock:0,v:'shout'}); if(e.r.light) after(5,()=>{ if(e.dead) return; const d=e.r.du; e.r.du=0; S.arc(e,6,d,'강철의 길 (대검)',{v:'slash'}); }); }); }},
   ult:{name:'무뎌진 의념',cd:0,r:7,can:e=>e.r.light&&!e.r.iron&&e.hp<=180,need:'경갑 + 체력 180 이하',cast(e){ add(e,'slow',3,.8,{self:true}); for(let i=1;i<=6;i++) after(i*.5,()=>{ if(!e.dead) S.circle(e,7,12,'무뎌진 의념',{knock:0,v:'quake'}); });
        after(3.1,()=>{ if(e.dead) return; S.circle(e,7,20,'무뎌진 의념',{air:3,stun:1.5,knock:0,v:'burst'}); e.r.light=false; e.r.iron=true; proc(e,'무뎌진 의념','철갑'); }); }}
  },note:"중갑: 저항 25% · 기동력 -20%, 맞을 때마다 피해 -2와 내구성 -5. 철갑은 그 수치의 두 배(저항 50% · 기동력 -40%)에 일반 스킬 대기시간 절반으로 읽었다. 경갑에서는 내구성이 줄지 않는다."},

/* ───────── 히든 ───────── */
amon:{name:'언령사, 아몬',cls:'마법사',grade:'히든',range:6,
  init:e=>{e.r={rec:false,buf:[],sv:[],cap:2,n:0,god:0,armor:null,nb:false,lw:-9}}, hud:e=>(e.r.rec?'기록 중(기본기=아노 · 점프=티시): ':'저장: ')+((e.r.rec?e.r.buf:e.r.sv).join('·')||'없음')+' · 발현 '+e.r.n+'/6',
  intercept(e,slot){ if(!e.r.rec) return false; if(slot==='n1'){ if(now-e.r.lw>=.3) CH.amon.endRec(e); return true; } const w=WKEY[slot]; if(!w||now-e.r.lw<.3) return true; e.r.lw=now; e.r.buf.push(w); say(e,w,'#ffe9a0'); if(e===me) sfx('ui'); if(e.r.buf.length>=e.r.cap) CH.amon.endRec(e); return true; },
  endRec(e){ e.r.rec=false; rm(e,'root'); const b=e.r.buf; e.r.buf=[]; if(b.length>=2){ e.r.sv=b.slice(0,b.length-b.length%2); if(e.r.cap>2) e.r.cap=2; proc(e,'바벨',e.r.sv.join(' · ')); } e.cd.n1=e.r.god>now?1:2; },
  manifest(e,a,b){ const f=MAN[[a,b].sort((x,y)=>WORDS.indexOf(x)-WORDS.indexOf(y)).join('+')]; if(f){ proc(e,'발현',f[0]); f[1](e); } },
  onCast(e,s){ if(e.r.god>now&&(s==='n1'||s==='n2')) e.cd[s]/=2; },
  onHurt(e,src,amt,label,o){ const a=e.r.armor; if(a&&a.until>now&&src!==e&&!src.dead&&!(o&&o.amp)){ damage(e,src,6,a.name,{amp:true}); if(!src.dead){ if(a.fire) dot(e,src,6,3,'불태움'); else add(src,'slow',2,.4,{by:e}); } } },
  onDeal(e,t,amt,label,o){ if(e.r.nb&&!(o&&o.amp)&&!t.dead){ e.r.nb=false; burn(e,t,9,3); } },
  skills:{
   n1:{name:'기록',cd:2,r:99,ai:()=>false,cast(e){ e.r.rec=true; e.r.buf=[]; e.r.lw=now; add(e,'root',60,0,{self:true}); }},
   n2:{name:'발현',cd:3,r:6,can:e=>!e.r.rec&&e.r.sv.length>=2,need:'언어 둘 · 기록 중엔 메라',cast(e){ const sv=e.r.sv.slice(); if(e.r.god<=now) e.r.sv=[]; e.r.n++; for(let i=0;i+1<sv.length;i+=2) after(i*.2,()=>{ if(!e.dead) CH.amon.manifest(e,sv[i],sv[i+1]); }); }},
   aw:{name:'신의 언어',cd:30,r:8,can:e=>!e.r.rec&&e.r.sv.length>=2,need:'언어 둘 · 기록 중엔 새티',cast(e){ e.r.god=now+7; }},
   ult:{name:'잊혀진 문장',cd:0,r:99,can:e=>!e.r.rec&&e.r.n>=6,need:'발현 6회 · 기록 중엔 이든',cast(e){ e.r.cap=6; }},
   crouch:{name:'호너',kind:'언어',cd:.3,can:()=>false,need:'기록 중에만',ai:()=>false,cast(){}}
  },note:"기록을 누르면 움직이지 못하고, 이때 누르는 단추가 낱말이 된다: 기본기=아노, 발현 칸=메라, 웅크리기=호너, 점프=티시, 신의 언어 칸=새티, 궁극 칸=이든(카드의 좌클릭·우클릭·쉬프트·점프·스왑·드랍 자리). 기록을 다시 누르거나 칸이 다 차면 저장된다. 잊혀진 문장 뒤 여섯 낱말을 저장하면 앞에서부터 둘씩 묶어 세 번 발현한다. 혼돈의 빛이 적에게 주는 피해는 카드에 수치가 없어 15로 잡았다. 웅크리기 칸은 기록 중에만 쓰인다."},
alonso:{name:'풍차의 기사, 알론소',cls:'수호자',grade:'히든',range:2.6,
  init:e=>{e.r={horse:0,ideal:false,kT:-1,lost:0,star:false,rng:0}}, hud:e=>(e.r.star?'별 헤는 기사 · ':e.r.lost>now?'상실 · ':e.r.ideal?'이상 · ':'')+(e.r.horse>0?'말 '+Math.ceil(e.r.horse):'말 없음'),
  on:e=>e.r.horse>0&&!(e.r.lost>now),
  speedMod:e=>e.r.ideal&&!(e.r.lost>now)?1.25:1,
  modTake(e,src,amt){ if(src===e||amt<=0) return amt; if(e.r.star) return 0; if(e.r.lost>now) return amt; if(e.r.rng>now&&PH) amt*=.5; if(e.r.horse>0){ amt*=.8; if(!e.r.ideal){ e.r.horse-=amt; if(e.r.horse<=0){ e.r.horse=0; say(e,'말이 쓰러짐','#f0b458'); } } } return amt; },
  onHurt(e,src,amt,label,o){ if(e.r.star&&o&&o.fixed) heal(e,30); },
  skills:{
   n1:{name:'마상창',cd:6,r:5,cast(e){ if(CH.alonso.on(e)){ const p0={x:e.x,y:e.y}; S.leap(e,e.aim,4,24,()=>S.seg(e,p0,{x:e.x,y:e.y},1.8,14,'마상창',{air:1.5,knock:0,v:'thrust'}),true); } else S.line(e,5,8,'마상창',{v:'thrust'}); }},
   n2:{name:'고점',cd:9,r:3,cast(e){ S.circle(e,3,14,'고점',{air:1,knock:0,v:'quake'}); if(CH.alonso.on(e)) e.r.rng=now+2; }},
   aw:{name:'기사도 정신',kind:'기원',cd:300,r:99,can:e=>!(e.r.lost>now),ai:(e,d)=>d>12&&e.hp>e.max*.8,cast(e){ e.r.kT=now; S.focus(e,25); add(e,'glow',25,0,{self:true}); after(25,()=>{ if(e.dead) return; e.r.ideal=true; proc(e,'기사도 정신','이상'); S.leap(e,{x:e.aim.x,y:e.aim.y},30,6,null,true); for(let i=1;i<=5;i++) after(i,()=>{ if(!e.dead) S.circle(e,5,16,'기사도 정신',{v:'spin'}); }); }); }},
   ult:{name:'별 헤는 기사',cd:0,r:99,can:e=>e.r.kT>=0&&now-e.r.kT>=30&&!e.r.star,need:'기사도 정신 30초 뒤',cast(e){ e.r.lost=now+30; e.hp=Math.min(e.max,20); proc(e,'별 헤는 기사','상실 30초');
        after(30,()=>{ if(e.dead) return; S.focus(e,50); add(e,'glow',50,0,{self:true}); after(50,()=>{ if(!e.dead){ e.r.star=true; proc(e,'별 헤는 기사','고정 피해 말고는 받지 않는다'); } }); }); }},
   crouch:{name:'신념',kind:'패시브',cd:15,ai:e=>e.r.horse<=0,cast(e){ e.r.horse=30; say(e,'말 소환','#ffe9a0'); }}
  },note:"말은 따로 서 있는 대상이 아니라 탄 채로 다룬다: 알론소가 받는 피해만큼 말의 체력(30)이 줄고, 0이 되면 내린다. 기사도 정신의 선언(25초)과 별 헤는 기사의 상실(30초)·진언(50초)은 카드 그대로의 시간이다. 선언·진언의 '발각'은 발광으로 처리했다. 돌진은 5초에 걸쳐 30칸을 가며 매초 주변에 16 피해를 준다."},
rasa:{name:'괴력난신, 라사',cls:'전사',grade:'히든',range:2.6,
  init:e=>{e.r={pw:0,pT:0,cr:0,kw:0,uw:0,uc:0}}, hud:e=>'힘 '+Math.floor(e.r.pw)+' · 극 강타 피해 '+Math.floor(e.dealt['극, 강타.']||0)+'/1000',
  altBasic:()=>true,
  modTake:(e,src,amt)=>src===e?amt:amt*.9,
  tick(e,dt){ if(crouching(e)){ e.r.pw=Math.min(100,e.r.pw+25*dt); e.r.pT=now+3; } else if(e.r.pw>0&&e.r.pT<=now) e.r.pw=0; },
  onKill(e){ if(e.r.kw>now){ e.r.pw=100; e.r.pT=now+3; } if(e.r.uw>now) heal(e,e.r.uc*2); },
  skills:{
   n1:{name:'기합',cd:2,r:5,can:e=>e.r.pw>=50,need:'힘 50',ai:()=>false,cast(e){ e.r.pw-=50; ring(e,5,'기합','shout'); foes(e).forEach(t=>{ if(dist(e,t)<=5+R) add(t,'slow',1,.3,{by:e}); }); }},
   n2:{name:'질주',cd:2,r:8,can:e=>e.r.pw>=50,need:'힘 50',ai:()=>false,cast(e){ e.r.pw-=50; add(e,'haste',1,.3); }},
   aw:{name:'극, 강타.',cd:3,r:4,ai:(e,d)=>d<=4.2&&e.r.pw>=80,cast(e){ S.focus(e,.33); after(.33,()=>{ if(e.dead) return; const p=Math.floor(e.r.pw); e.r.pw=0; e.r.kw=now+.4; S.arc(e,4,p,'극, 강타.',{v:'quake'}); }); }},
   ult:{name:'진 - 강타',cd:0,r:6,can:e=>(e.dealt['극, 강타.']||0)>=1000,need:'극 강타 피해 1000',cast(e){ const c=Math.floor(e.hp*.5); e.r.uc=c; pay(e,c); S.focus(e,1); after(1,()=>{ if(e.dead) return; const p=Math.floor(e.r.pw); e.r.pw=0; e.r.uw=now+.4; S.arc(e,6,p*2,'진 - 강타',{v:'quake'}); }); }},
   crouch:XCROUCH({name:'힘 모으기',ai:e=>e.r.pw<100})
  },note:"기본 공격이 없다. 웅크리기 단추를 누르고 있으면 4초에 걸쳐 힘이 100까지 모이고, 손을 뗀 뒤 3초가 지나면 사라진다. 극, 강타.와 진 - 강타는 휘두를 때 모인 힘을 다 쓰는 것으로 잡았다."},
cheongal:{name:'대종사, 천갈',cls:'척후병',grade:'히든',range:9,
  init:e=>{e.r={st:0,px:e.x,py:e.y,gs:0,gm:0,cost:1,ch:null,fix:0}}, hud:e=>(e.r.st>=3?'부동심 · ':'')+'공선 '+e.r.gs+' · 결무 '+e.r.gm+' (다음 소모 '+e.r.cost+')',
  bd:e=>e.r.st>=3,
  tick(e,dt){ if(Math.hypot(e.x-e.r.px,e.y-e.r.py)>.02) e.r.st=0; else e.r.st+=dt; e.r.px=e.x; e.r.py=e.y; if(e.r.fix>now) e.hp=Math.min(e.max,10); },
  onCast(e){ e.r.st=0; },
  modTake(e,src,amt){ return e.r.fix>now&&src!==e?0:amt; },
  onHurt(e,src){ const c=e.r.ch; if(!c||c.until<=now||src===e) return; e.r.ch=null; e.busy=now; rm(e,'focus'); say(e,'집중이 끊김','#f0b458'); if(c.k==='gs') S.leap(e,{x:-e.aim.x,y:-e.aim.y},5,22); else { e.r.gs=3; e.r.gm=3; e.r.cost=c.cost; e.cd.aw=0; } },
  skills:{
   n1:{name:'공선',cd:6,r:99,can:e=>CH.cheongal.bd(e)&&e.r.gs<3,need:'부동심',cast(e){ const c=e.r.ch={k:'gs',until:now+2}; S.focus(e,2); after(2,()=>{ if(e.dead||e.r.ch!==c) return; e.r.ch=null; e.r.gs=Math.min(3,e.r.gs+1); say(e,'공선 '+e.r.gs,'#ffe9a0'); }); }},
   n2:{name:'결무',cd:6,r:99,can:e=>CH.cheongal.bd(e)&&e.r.gs>=e.r.cost&&e.r.gm<3,need:'부동심 + 공선',cast(e){ e.r.gs-=e.r.cost; e.r.cost=Math.min(3,e.r.cost+1); S.focus(e,3); after(3,()=>{ if(e.dead) return; e.r.gm=Math.min(3,e.r.gm+1); say(e,'결무 '+e.r.gm,'#ffe9a0'); }); }},
   aw:{name:'신념의 화살',kind:'신화',cd:90,r:40,can:e=>CH.cheongal.bd(e)&&e.r.gs>=3&&e.r.gm>=3,need:'부동심 + 공선 3 + 결무 3',cast(e){ const c=e.r.ch={k:'ar',until:now+5,cost:e.r.cost}; e.r.gs-=3; e.r.gm-=3; e.r.cost=1; S.focus(e,5);
        after(5,()=>{ if(e.dead||e.r.ch!==c) return; e.r.ch=null; const p0={x:e.x,y:e.y},p1={x:p0.x+e.aim.x*50,y:p0.y+e.aim.y*50}; fx.push({k:'seg',x0:p0.x,y0:p0.y,x1:p1.x,y1:p1.y,w:.5,t0:now,dur:3,team:e.team,lab:'신념의 화살 (궤적)',src:e});
          after(3,()=>{ if(e.dead) return; S.seg(e,p0,p1,1.4,0,'신념의 화살',{zfree:true,knock:0,silence:9,v:'rail',post:t=>{ if(t.c.mon) return; const old=t.hp; t.hp=Math.min(t.hp,10); say(t,'체력 10','#d7a6ff'); after(9,()=>{ if(!t.dead) t.hp=Math.min(t.max,Math.max(1,old-(10-t.hp))); }); }});
            const mine=e.hp; e.hp=Math.min(e.max,10); e.r.fix=now+3; after(3,()=>{ if(!e.dead) e.hp=mine; }); }); }); }}
  },note:"3초 동안 제자리에 서 있어야 부동심이 서고, 스킬을 쓰면 다시 3초를 서 있어야 한다. 신념의 화살에 맞은 적은 9초 동안 체력이 10이 되고, 9초 뒤에는 그 사이 받은 피해만 빼고 돌아온다. 자신의 체력은 3초 동안 10에 묶여 피해를 받지 않고, 그 뒤 원래대로 돌아온다. 집중이 끊기면 신념의 화살 대기시간도 돌려준다."},
nagato:{name:'최후의 닌자, 나가토',cls:'암살자',grade:'히든',range:5,
  init:e=>{e.r={img:null,pT:0,ins:null,ph:0}}, hud:e=>'둔갑술 피해 '+Math.floor(e.dealt['둔갑술']||0)+'/80'+(e.r.ph?' · 환영 '+e.r.ph:'')+(e.r.ins?' · 즉살 '+e.r.ins.n:''),
  SLOT:{'수리검':'n1','급참':'n2','인술 즉살':'aw','풍마수리검':'aw'},
  onCast(e,s){ if(s==='crouch') return; if(e.r.img) e.r.img.z.until=now; const z=zone(e,{x:e.x,y:e.y,r:.6,dur:4,label:'잔상',good:true}); e.r.img={x:e.x,y:e.y,until:now+4,z}; },
  onSkillHit(e,t,label){ const s=CH.nagato.SLOT[label]; if(s) e.cd[s]=Math.max(0,e.cd[s]-1); if(e.r.ph>0&&!t.dead) damage(e,t,2*e.r.ph,'환영',{amp:true}); },
  onDeal(e,t,amt,label,o){ const i=e.r.ins; if(i&&i.t===t&&i.until>now&&!(o&&o.amp)) i.n+=3; },
  modTake(e,src,amt){ if(src!==e&&amt>0&&e.r.ph>0&&Math.random()<e.r.ph*.2){ e.r.ph--; say(e,'환영 회피','#ffe9a0'); return 0; } return amt; },
  mark(e,t){ const a=Math.floor(Math.random()*4)*Math.PI/2; puff(e.x,e.y,'shadow',8,3); e.x=t.x+Math.cos(a)*2; e.y=t.y+Math.sin(a)*2; clamp(e); add(e,'stealth',3,0,{self:true}); const i=e.r.ins={t,until:now+3,n:0};
    after(3,()=>{ if(e.dead||e.r.ins!==i) return; S.focus(e,.5); after(.5,()=>{ if(e.dead) return; e.r.ins=null; if(!t.dead) e.aim=norm(t.x-e.x,t.y-e.y); const hit=S.line(e,12,24,'풍마수리검',{knock:0,v:'disc',post:x=>{ if(i.n>0) damage(e,x,(x.max-x.hp)*i.n/100,'즉살',{amp:true}); }}),h=hit.find(x=>!x.dead); if(h){ const n=norm(h.x-e.x,h.y-e.y); e.x=h.x+n.x*1.2; e.y=h.y+n.y*1.2; clamp(e); } }); }); },
  skills:{
   n1:{name:'수리검',cd:2,r:8,cast(e){ S.proj(e,e.aim,{speed:30,range:8,dmg:8,label:'수리검',v:'knife'}); }},
   n2:{name:'급참',cd:8,r:5,cast(e){ S.focus(e,.5); after(.5,()=>{ if(e.dead) return; const p0={x:e.x,y:e.y}; S.leap(e,e.aim,5,28,()=>{ for(let i=0;i<4;i++) S.seg(e,p0,{x:e.x,y:e.y},1.6,6,'급참',{knock:0,v:'cut'}); },true); }); }},
   aw:{name:'인술 즉살',cd:45,r:10,cast(e){ S.proj(e,e.aim,{speed:30,range:10,dmg:12,label:'인술 즉살',v:'knife',o:{post:t=>CH.nagato.mark(e,t)}}); }},
   ult:{name:'환영 분신',cd:0,r:99,can:e=>(e.dealt['둔갑술']||0)>=80,need:'둔갑술 피해 80',cast(e){ S.focus(e,1); after(1,()=>{ if(e.dead) return; e.r.ph=4; for(let i=0;i<4;i++){ const a=Math.random()*6.283,d=2+Math.random()*6; puff(e.x+Math.cos(a)*d,e.y+Math.sin(a)*d,'shadow',10,3); } proc(e,'환영 분신','환영 4'); }); }},
   crouch:{name:'둔갑술',kind:'패시브',cd:.3,can:e=>e.r.pT<=now&&!!e.r.img&&e.r.img.until>now,need:'잔상 (12초마다)',ai:e=>hurtNow(e),cast(e){ const im=e.r.img; e.r.img=null; im.z.until=now; e.r.pT=now+12; for(let i=0;i<3;i++) S.circle(e,3,4,'둔갑술',{knock:0,v:'spin'}); puff(e.x,e.y,'shadow',10,3); e.x=im.x; e.y=im.y; clamp(e); }}
  },note:"2026년 6월 카드다. 스킬을 쓴 자리에 잔상이 4초 남고, 웅크리면 주변을 세 번 베고(합 12) 잔상으로 간다. 환영은 따로 서 있는 대상으로 만들지 않고 수로만 센다: 환영 하나당 20%로 피해를 피하고, 피할 때마다 환영이 하나 사라진다. 인술 즉살의 수리검 사거리(10칸)와 옮겨 가는 거리(2칸)는 카드에 없어 정했다."}
});
for(const k of ['duke','wolfen','teor','albion','kivi','vivi','start','amon','alonso','rasa','cheongal','nagato']){ const c=CH[k],b=CLASSES[c.cls]; c.hp=b.hp; c.atk=b.atk; c.key=k; }

/* ───── 겉모습 · 상태 줄 · 궁극기 고리 ───── */
Object.assign(LOOK,{
 duke:{el:'royal',w:'mace',hair:'#c9b48a',acc:['pauldrons','cape'],cape:'#7a5a2a'}, wolfen:{el:'steam',w:'fists',hair:'#5a3a2a',acc:['goggles','scarf'],scarf:'#b0482a'},
 teor:{el:'earth',w:'ringstaff',hair:'#8a6a4a',acc:['robe','hood'],hood:'#4a3a2a'}, albion:{el:'wind',w:'saber',hair:'#f4f6ff',acc:['horns','cape'],cape:'#e8eef8',bl:'#bfe8ff'},
 kivi:{el:'iron',w:'dagger',hair:'#2a2a33',acc:['mask','scarf'],scarf:'#e3c377'}, vivi:{el:'fire',w:'shotgun',hair:'#ff8fc2',acc:['goggles','ribbon'],ribbon:'#ffd36b'},
 start:{el:'iron',w:'greatsword',hair:'#9aa3b5',acc:['pauldrons','plume'],plume:'#5a78c8',metal:'#aab4c8'}, amon:{el:'arcane',w:'wand',hair:'#e8e0c8',acc:['robe','hood'],hood:'#3a2f5a'},
 alonso:{el:'holy',w:'spear',hair:'#b9a27a',acc:['pauldrons','plume','cape'],cape:'#c8d4f0',plume:'#e3c377'}, rasa:{el:'beast',w:'club',hair:'#3a2a22',acc:['bandana','fur'],bandana:'#b0302a'},
 cheongal:{el:'hunt',w:'greatbow',hair:'#e6e6e6',acc:['hat','quiver'],hat:'#3a3a44'}, nagato:{el:'shadow',w:'dagger',hair:'#1a1a22',acc:['mask','scarf','ponytail'],scarf:'#b0202a'}
});
Object.assign(AURA,{
 duke(e,by){ if(crouching(e)) ringAt(e.x,e.y,.8,'#e3c377',2,[.14,.1]); if(e.r.gd>now) ringAt(e.x,e.y,.95,'#ffe9a0',3); },
 wolfen(e,by){ if(e.r.oh>now){ emit(e,by,'fire',.8,.9); ringAt(e.x,e.y,.85,'#ff7a3c',3); } },
 albion(e,by){ if(e.r.pr>now){ emit(e,by,'wind',.8,1.1); ringAt(e.x,e.y,.95,'#bfe8ff',3); } if(e.r.dr>now) ringAt(e.x,e.y,1.1,'#ffffff',2,[.2,.12]); },
 kivi(e,by){ if(crouching(e)) ringAt(e.x,e.y,1,'#e3c377',2.5); if(e.r.gan>now) ringAt(e.x,e.y,.85,'#ffffff',2,[.16,.12]); const w=e.r.wire; if(w&&w.until>now){ g.strokeStyle='rgba(227,195,119,.8)'; g.lineWidth=1.5/cell; g.beginPath(); g.moveTo(e.x,by); g.lineTo(w.x,w.y); g.stroke(); g.beginPath(); g.arc(w.x,w.y,.18,0,7); g.stroke(); } },
 start(e,by){ if(e.r.iron) ringAt(e.x,e.y,.95,'#cfd8ea',4); else if(!e.r.light) ringAt(e.x,e.y,.9,'#8a94aa',2.5); },
 amon(e,by){ if(e.r.rec) ringAt(e.x,e.y,.9,'#ffe9a0',2.5,[.14,.1]); if(e.r.god>now) emit(e,by,'arcane',.6,1); },
 alonso(e,by){ if(e.r.horse>0){ ringAt(e.x,e.y,1,'#c9a05a',3); g.fillStyle='#2a3566'; g.fillRect(e.x-.5,e.y+.72,1,.08); g.fillStyle='#c9a05a'; g.fillRect(e.x-.5,e.y+.72,Math.min(1,e.r.horse/30),.08); } if(e.r.star) emit(e,by,'holy',.7,1.1); },
 rasa(e,by){ if(e.r.pw>0){ ringAt(e.x,e.y,.6+e.r.pw/200,'#ff9d5c',2+e.r.pw/40); if(crouching(e)) emit(e,by,'beast',.5,.9); } },
 cheongal(e,by){ if(e.r.st>=3) ringAt(e.x,e.y,.9,'#e6e6e6',2,[.2,.14]); },
 nagato(e,by){ for(let i=0;i<e.r.ph;i++){ const a=now*1.4+i*1.571; g.fillStyle='rgba(120,90,160,.55)'; g.beginPath(); g.arc(e.x+Math.cos(a)*1.1,by+Math.sin(a)*.7,.2,0,7); g.fill(); } const i2=e.r.ins; if(i2&&i2.until>now) markOn(i2.t,'#b0202a','인술'); }
});
Object.assign(STATES,{
 duke:e=>[e.r.gd>now&&['수호자',until(e.r.gd)],crouching(e)&&['웅크림']], wolfen:e=>[e.r.oh>now&&['과열',until(e.r.oh)]], teor:e=>[],
 albion:e=>[e.r.up>now&&['백룡 강림',until(e.r.up)],e.r.pr>now&&['풍뇌룡',until(e.r.pr)]], kivi:e=>[crouching(e)&&['웅크림'],e.r.gan>now&&['간계',until(e.r.gan)],e.r.sa>now&&['사살 추섬',until(e.r.sa)]],
 vivi:e=>[], start:e=>[e.r.iron&&['철갑'],e.r.light&&!e.r.iron&&['경갑']], amon:e=>[e.r.rec&&['기록'],e.r.god>now&&['신의 언어',until(e.r.god)],e.r.cap>2&&['잊혀진 문장']],
 alonso:e=>[e.r.star&&['별 헤는 기사'],e.r.lost>now&&['상실',until(e.r.lost)],e.r.ideal&&['이상']], rasa:e=>[crouching(e)&&['힘 모으는 중']], cheongal:e=>[e.r.st>=3&&['부동심'],e.r.fix>now&&['체력 고정',until(e.r.fix)]],
 nagato:e=>[e.r.ph>0&&['환영 '+e.r.ph]]
});
Object.assign(RES,{ duke:{u:e=>e.r.abs/500}, teor:{u:e=>e.r.taken/350}, albion:{u:e=>e.r.yl/12}, kivi:{u:e=>Math.max(0,...e.r.cn.values())/7}, vivi:{u:e=>e.r.hits/18}, start:{u:e=>e.r.light?1:1-e.r.du/100},
 amon:{u:e=>e.r.n/6}, rasa:{u:e=>(e.dealt['극, 강타.']||0)/1000}, nagato:{u:e=>(e.dealt['둔갑술']||0)/80} });

/* ───── 컴퓨터 운용법 ───── */
Object.assign(BRAIN,{
 duke(e,t,d){ e.ai.want=2.2; if(go(e,'ult')) return true; if(e.r.mi<60&&d>4.5&&go(e,'crouch')) return true; if(d<=5&&go(e,'aw')) return true; if(d<=3.5&&go(e,'n2')) return true; if(d<=3.2&&go(e,'n1')) return true; },
 wolfen(e,t,d){ e.ai.want=2; /* 스킬이 4~6초 뒤에 나가므로 미리 걸어 두고 붙어서 싸운다 */ if(e.r.oh>now) return; if(d<=10&&go(e,'n1')) return true; if(d<=6&&go(e,'n2')) return true; if(d<=9&&go(e,'aw')) return true; },
 teor(e,t,d){ e.ai.want=6; if(d<=9&&go(e,'ult')) return true; if(hot(e)&&d<5&&go(e,'crouch')) return true; if(hot(e)&&e.hp<e.max*.5&&go(e,'aw')) return true; if(d<=5&&go(e,'n2')) return true; if(d<=12&&go(e,'n1')) return true; },
 albion(e,t,d){ e.ai.want=2.2; if(go(e,'ult')) return true; if(e.r.up>now) return; if(go(e,'crouch')) return true; if(d<=7&&go(e,'aw')) return true; if(d<=5&&go(e,'n1')) return true; if(d<=4&&go(e,'n2')) return true; },
 kivi(e,t,d){ e.ai.want=1; if(d<=18&&go(e,'ult')) return true; if((d<=2.2||(e.r.wire&&e.r.wire.until>now))&&go(e,'crouch')) return true; if(d<=10&&go(e,'aw')) return true; if(hot(e)&&go(e,'n2')) return true; if(d>3.5&&d<=12&&go(e,'n1')) return true; },
 vivi(e,t,d){ e.ai.want=8; if(d<=16&&go(e,'ult')) return true; if(d<=15&&go(e,'aw')) return true; if(d>2.5&&d<=8&&go(e,'n2')) return true; if(d<=10&&go(e,'n1')) return true; if(hot(e)&&go(e,'crouch')) return true; },
 start(e,t,d){ e.ai.want=2; if(d<=7&&go(e,'ult')) return true; if(d<=5&&go(e,'aw')) return true; if(d<=4&&go(e,'n2')) return true; if(d<=4.5&&go(e,'n1')) return true; },
 amon(e,t,d){ e.ai.want=5; if(e.r.rec){ const pl=e.ai.plan||['b','b']; cast(e,pl[Math.min(pl.length-1,e.r.buf.length)]); return true; } if(go(e,'ult')) return true; if(d<=7&&go(e,'aw')) return true; if(d<=6.5&&go(e,'n2')) return true;
   if(e.r.sv.length<2&&e.cd.n1<=0){ const P=e.hp<e.max*.45?[['aw','aw'],['jump','aw']]:[['b','b'],['n2','n2'],['n2','ult'],['jump','ult'],['ult','ult'],['b','ult'],['crouch','ult']],p=P[Math.floor(Math.random()*P.length)]; e.ai.plan=e.r.cap>2?p.concat(p,p):p; if(cast(e,'n1')) return true; } },
 alonso(e,t,d){ e.ai.want=2.4; if(e.r.horse<=0&&go(e,'crouch')) return true; if(go(e,'ult')) return true; if(d<=5&&go(e,'n1')) return true; if(d<=3.2&&go(e,'n2')) return true; if(d>13&&e.hp>e.max*.85&&e.r.kT<0&&go(e,'aw')) return true; },
 rasa(e,t,d){ e.ai.want=e.r.pw>=85?2.4:7; /* 힘이 모일 때까지는 물러나 모으고, 다 모이면 들어간다 */ if(e.r.pw>=100&&d<=5.5&&go(e,'ult')) return true; if(e.r.pw>=90&&d<=4.2&&go(e,'aw')) return true; if(e.r.pw<100&&go(e,'crouch')) return true; },
 cheongal(e,t,d){ e.ai.want=9; e.ai.still=d>3.5; if(d<=40&&go(e,'aw')) return true; if(go(e,'n2')) return true; if(go(e,'n1')) return true; },
 nagato(e,t,d){ e.ai.want=4; if(go(e,'ult')) return true; if(d<=10&&go(e,'aw')) return true; if(hot(e)&&go(e,'crouch')) return true; if(d<=5.5&&go(e,'n2')) return true; if(d<=8&&go(e,'n1')) return true; }
});
