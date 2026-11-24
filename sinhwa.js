"use strict";
/* 신화급: 위대한 하나 맥스 · 혼돈 소녀 · 전란의 휘광 아서 + 재림(아르트랑 맥스 · 여명의 훼광 아서).
   스킬이 많아 5~8번 칸(x1~x4)을 쓴다. 신화 스킬은 재사용 대기시간이 있어 여러 번 쓸 수 있다. */
CLASSES['신화']={hp:550,atk:18};
const FIX={fixed:true,amp:true};
let chaosUntil=0,chaosName='혼돈 세계';
Object.assign(CH,{
max:{name:'위대한 하나, 맥스',cls:'신화',grade:'신화',range:2.6,
  init:e=>{e.r={step:0,par:0,god:0,fate:null,ft:0}}, hud:e=>(e.hp<=e.max/2?'재림(강화) · ':'재림 · ')+(e.r.god>now?'신살자 · ':'')+(e.r.ft>now?'운명':''),
  altBasic:()=>true,
  speedMod:e=>e.hp<=e.max/2?1.25:1,
  fixHalf:e=>e.r.god>now,
  onStatus(e,k,t){ add(e,'haste',1,.3,{self:true}); return e.hp>=e.max/2?t*.5:t; },
  modTake(e,src,amt){ if(src===e) return amt; if(e.r.par>now){ e.r.par=0; say(e,'흘려내기','#7fe3b5'); after(.02,()=>{ if(e.dead) return; S.arc(e,4,20,'흘려내기',{v:'slash'}); S.leap(e,{x:-e.aim.x,y:-e.aim.y},4,22,null,true); }); return 0; }
    if(e.r.ft>now&&e.r.fate===src) amt*=1.5; return e.hp<=e.max/2?amt*.75:amt; },
  onDeal(e,t,amt,label,o){ if(e.r.ft>now&&e.r.fate===t&&!(o&&o.amp)&&!t.dead) damage(e,t,amt*.5,'운명 (증폭)',{amp:true}); },
  onKill(e,t){ if(e.r.fate===t&&e.r.ft>now){ e.r.ft=0; rm(e,'noheal'); for(let i=1;i<=5;i++) after(i,()=>heal(e,e.max*.04)); } },
  onCast(e,s){ if(e.r.god>now&&(s==='n2'||s==='crouch')) e.cd[s]*=.5; },
  skills:{
   n1:{name:'검격',cd:1,r:4,cast(e){ const h=()=>heal(e,2,true); e.swingT=now; if(e.r.step++%2===0) S.circle(e,4,14,'검격',{v:'spin',post:h}); else for(let i=0;i<2;i++) after(i*.12,()=>{ if(!e.dead) S.arc(e,4,9,'검격',{post:h}); }); }},
   n2:{name:'구르기',cd:5,ai:(e,d)=>d>3&&d<=7,cast(e){ S.leap(e,moveDir(e),3,22); shield(e,4,1); }},
   crouch:{name:'흘려내기',kind:'일반',cd:10,ai:(e,d)=>d<=5&&(hurtNow(e)||incoming(e)),cast(e){ e.r.par=now+1; }},
   aw:{name:'신살자',cd:30,r:6,cast(e){ e.r.god=now+12; }},
   x1:{name:'신살의 검',kind:'초월',cd:60,r:14,can:e=>e.r.god>now,need:'신살자 중',cast(e){ e.r.god=0; const p0={x:e.x,y:e.y},p1={x:e.x+e.aim.x*20,y:e.y+e.aim.y*20}; fx.push({k:'seg',x0:p0.x,y0:p0.y,x1:p1.x,y1:p1.y,w:1.6,t0:now,team:e.team,dur:1,lab:'신살의 검',src:e,v:'beam',el:'blood'});
        after(1,()=>{ if(!e.dead) S.seg(e,p0,p1,1.6,0,'신살의 검',{zfree:true,v:'beam',el:'blood',post:t=>{ damage(e,t,50,'신살의 검 (고정 피해)',FIX); if(t.c.unknowable) add(t,'nullpass',30,0,{by:e}); }}); }); }},
   x2:{name:'절망의 검',kind:'신화',cd:90,r:10,can:e=>e.r.god<=now,need:'신살자 아님',cast(e){ pay(e,80); S.proj(e,e.aim,{speed:22,range:11,dmg:0,label:'절망의 검',big:true,nohit:true,v:'skull',onEnd:p=>{ const q={x:p.x,y:p.y,z:0}; fx.push({k:'circle',x:q.x,y:q.y,r:4,t0:now,team:e.team,dur:1,lab:'절망의 검',src:e});
        after(1,()=>{ if(!e.dead) S.circle(e,4,0,'절망의 검',{zfree:true,v:'nova',el:'shadow',post:t=>{ say(t,'절망','#c9c2ff'); add(t,'despair',10,0,{by:e,end:()=>{ if(!t.dead) damage(e,t,(t.max-t.hp)*.25,'절망',FIX); }}); }},q); }); }}); }},
   x3:{name:'운명의 실',kind:'신화',cd:120,r:10,can:e=>!!tgt(e,10),need:'10칸 안의 적',cast(e){ const t=tgt(e,10); e.r.fate=t; e.r.ft=now+30; add(e,'noheal',30,0,{self:true}); add(t,'noheal',30,0,{by:e}); add(t,'fate',30,0,{by:e}); say(t,'운명','#f0b458'); }},
   x4:{name:'시간 조작',kind:'신화',cd:180,r:99,cast(e){ ents.forEach(o=>{ if(o!==e&&!o.dead) add(o,'stun',3,0,{by:e}); }); for(const k in e.cd) if(k!=='x4') e.cd[k]=0; }}
  },note:"기본 공격이 없다. 흘려내기는 웅크리기 칸이다. 신살자 중에는 주는 피해의 절반이 고정 피해(저항·보호막·무적·피해 감소 무시)로 들어간다. 운명으로 엮이면 둘 다 30초 동안 회복할 수 없고 서로 주는 피해가 50% 는다."},
girl:{name:'혼돈, 소녀',cls:'신화',grade:'신화',range:6,unknowable:true,
  init:e=>{e.r={acc:0,world:0}}, hud:e=>(has(e,'nullpass')?'불가해 무력화 · ':'불가해 · ')+(e.r.world>now?'혼돈 세계':'무질서'),
  modTake(e,src,amt,label,o){ if(src===e) return amt; if(!has(e,'nullpass')) amt*=.5; return e.r.world>now?amt*.5:amt; },
  tick(e,dt){ e.r.acc+=dt; if(e.r.acc>=(e.r.world>now?9*.34:9)){ e.r.acc=0; const a=Math.random()*6.283,d=Math.random()*2; puff(e.x,e.y,'shadow',8,3); e.x+=Math.cos(a)*d; e.y+=Math.sin(a)*d; clamp(e); const c=['n1','n2','aw'].filter(k=>e.cd[k]>0),k=c[Math.floor(Math.random()*c.length)]; if(k) e.cd[k]=0; proc(e,'무질서','순간이동'); } },
  skills:{
   n1:{name:'암흑',cd:4,r:10,cast(e){ S.proj(e,e.aim,{speed:22,range:11,dmg:0,label:'암흑',big:true,nohit:true,pierce:false,v:'skull',touch:()=>{},onEnd:p=>S.circle(e,3,18,'암흑',{slow:[.4,1],v:'nova',zfree:true},{x:p.x,y:p.y,z:0})}); }},
   n2:{name:'무아',cd:5,r:7,cast(e){ S.line(e,7,22,'무아',{silence:1,knock:2,v:'beam'}); }},
   aw:{name:'병리',kind:'일반',cd:6,r:9,cast(e){ S.circle(e,2,26,'병리',{stun:1,air:2,v:'hex',zfree:true},spot(e,9,4)); }},
   x1:{name:'혼돈 세계',kind:'신화',cd:180,r:99,cast(e){ e.r.world=now+60; chaosUntil=now+60; chaosName='혼돈 세계'; add(e,'resist',60,.5); ents.forEach(o=>{ if(!o.dead) add(o,'slow',60,.2,{by:e,self:o===e}); });
        for(let i=1;i<=60;i++) after(i,()=>{ if(e.dead){ chaosUntil=0; return; } ents.forEach(o=>{ if(o.dead) return; damage(e,o,2,'붕괴',{amp:true}); if(!o.dead&&o.hp<=o.max*.1) damage(e,o,o.hp+999,'붕괴 (사망)',FIX); }); }); }}
  },note:"불가해: 고정 피해가 아닌 모든 피해를 절반만 받는다. 병리는 9칸 안의 적이 선 자리에 일어난다. 혼돈 세계 60초 동안은 소녀 자신을 포함한 모두가 붕괴된다(기동력 20% 감소, 매초 2 피해, 체력 10% 이하면 사망). 재림 카드는 '궁창의 혼재, 아에르'다."},
arthur:{name:'전란의 휘광, 아서',cls:'신화',grade:'신화',range:2.5,
  init:e=>{e.r={hn:0,dn:0,open:0,king:0,holy:0,rf:0}}, hud:e=>(e.r.king>now?'왕의 귀환 · ':e.r.open>now?'성검 개방 · ':'')+'신성 '+e.r.holy,
  P:{sh:10,nova:[4,10],openHaste:.2},
  speedMod:e=>e.r.open>now?1+CH[e.key].P.openHaste:1,
  tick(e,dt){ if(e.r.open>now){ e.r.acc=(e.r.acc||0)+dt; if(e.r.acc>=1){ e.r.acc-=1; heal(e,3,true); } } },
  guard(e){ const P=CH[e.key].P; if(P.dodge){ e.r.dg=now+1; proc(e,'거짓 성검','다음 피해 회피'); } else { shield(e,P.sh,1); proc(e,'수호','보호막 '+P.sh); } },
  modTake(e,src,amt){ if(src!==e&&e.r.dg>now){ e.r.dg=0; say(e,'회피','#ffe9a0'); return 0; } return amt; },
  onHurt(e,src,amt,label,o){ if(src===e) return; if(e.r.open>now||e.r.king>now) e.r.holy++; if(e.r.rf>now&&!(o&&o.amp)){ const P=CH[e.key].P; if(P.rfHeal) heal(e,2,true); else if(!src.dead) damage(e,src,2,'광염 (반사)',{amp:true}); }
    if(e.r.king>now||++e.r.hn>=3){ e.r.hn=0; CH[e.key].guard(e); } },
  onDeal(e,t,amt,label,o){ if(o&&o.amp) return; const act=e.r.open>now||e.r.king>now; if(!act) return; e.r.holy++; if(e.r.king>now||++e.r.dn>=3){ e.r.dn=0; const P=CH[e.key].P; fx.push({k:'circle',x:e.x,y:e.y,r:P.nova[0],t0:now,team:e.team,lab:'성휘',src:e,v:'nova'}); foes(e).forEach(x=>{ if(dist(e,x)<=P.nova[0]+R) damage(e,x,P.nova[1],'성휘',{amp:true}); }); } },
  onKill(e){ if(e.r.open>now||e.r.king>now) for(let i=1;i<=8;i++) after(i,()=>heal(e,(e.max-e.hp)*.3/8)); },
  skills:{
   n1:{name:'십자검',cd:6,r:4,cast(e){ if(e.r.open>now) S.proj(e,e.aim,{speed:26,range:14,dmg:20,label:'십자검 (검기)',big:true,v:'shard'}); else for(let i=0;i<2;i++) after(i*.12,()=>{ if(!e.dead){ e.swingT=now; S.line(e,4,6,'십자검',{v:'cut'}); } }); }},
   n2:{name:'광염',cd:9,r:4,cast(e){ if(e.r.open>now) S.circle(e,4,25,'광염 (개방)',{knock:1.5,v:'burst'}); else { add(e,'resist',3,.1); e.r.rf=now+3; } }},
   aw:{name:'성검 개방',kind:'초월',cd:60,r:8,cast(e){ e.r.open=now+20; }},
   x1:{name:'엑스칼리버',kind:'신화',cd:90,r:14,can:e=>e.r.holy>=30&&e.r.open>now,need:'신성 30 + 성검 개방',cast(e){ e.r.holy=0; S.focus(e,3); after(3,()=>{ if(e.dead) return; S.line(e,45,100,'엑스칼리버',{silence:5,zfree:true,v:'beam'}); e.r.king=now+15; }); }}
  },note:'성검 개방 중에는 십자검이 검기(20), 광염이 폭발(25)로 바뀐다. 왕의 귀환 15초 동안은 수호와 성휘가 맞고 때릴 때마다 발동한다.'}
});
/* 재림 */
CH.arthur_r=Object.assign({},CH.arthur,{name:'여명의 훼광, 아서',re:true,base:'arthur',P:{dodge:true,nova:[5,18],openHaste:.25,rfHeal:true},
  hud:e=>(e.r.king>now?'왕의 귀환 · ':e.r.open>now?'성검 현현 · ':'')+'신성 '+e.r.holy,
  onKill(e){ if(e.r.open>now||e.r.king>now) for(let i=1;i<=6;i++) after(i,()=>heal(e,e.max*.05)); },
  skills:{
   n1:{name:'십차성',cd:6,r:4,cast(e){ if(e.r.open>now) for(let i=0;i<2;i++) after(i*.1,()=>{ if(!e.dead) S.proj(e,e.aim,{speed:26,range:14,dmg:12,label:'십차성 (검기)',big:true,v:'shard',el:'snow'}); }); else for(let i=0;i<2;i++) after(i*.12,()=>{ if(!e.dead){ e.swingT=now; S.line(e,4,9,'십차성',{v:'cut'}); } }); }},
   n2:{name:'염광성',cd:9,r:5,cast(e){ if(e.r.open>now) S.circle(e,5,30,'염광성 (현현)',{stun:1,v:'burst'}); else { add(e,'resist',3,.2); e.r.rf=now+3; } }},
   aw:{name:'성검 현현',kind:'초월',cd:75,r:8,cast(e){ e.r.open=now+25; }},
   x1:{name:'엑스칼리버',kind:'신화',cd:105,r:14,can:e=>e.r.holy>=20&&e.r.open>now,need:'신성 20 + 성검 현현',cast(e){ e.r.holy=0; S.focus(e,2); after(2,()=>{ if(e.dead) return; S.line(e,45,120,'엑스칼리버',{silence:6,zfree:true,v:'beam'}); e.r.king=now+35; }); }},
   x2:{name:'성검의 군주',kind:'신화',cd:180,r:10,can:e=>e.r.king>now,need:'왕의 귀환 중',cast(e){ const st=new Map(),a0=Math.atan2(e.aim.y,e.aim.x),d={x:e.aim.x,y:e.aim.y};
        for(let i=0;i<12;i++) after(i*.06,()=>{ if(e.dead) return; const a=a0+(i-5.5)*.07; S.proj(e,{x:Math.cos(a),y:Math.sin(a)},{speed:28,range:14,dmg:0,label:'성검의 군주',nohit:true,v:'shard',touch:t=>st.set(t,(st.get(t)||0)+1)}); });
        after(1.1,()=>{ if(e.dead) return; fx.push({k:'circle',x:e.x,y:e.y,r:8,t0:now,team:e.team,lab:'성검의 군주',src:e,v:'shout'}); foes(e).forEach(t=>{ const n=st.get(t)||0; if(n>0&&dist(e,t)<=8+R) add(t,'stun',lerp(1,12,(n-1)/11),0,{by:e}); });
          for(let i=0;i<4;i++) after(.3+i*.2,()=>{ if(e.dead) return; const p1={x:e.x+d.x*45,y:e.y+d.y*45}; S.seg(e,{x:e.x,y:e.y},p1,1.8,t=>lerp(10,40,Math.max(0,((st.get(t)||1)-1))/11),'성검의 군주 (참격)',{zfree:true,v:'beam',post:t=>{ if(i===3) add(t,'silence',lerp(1,4,Math.max(0,((st.get(t)||1)-1))/11),0,{by:e}); }}); }); }); }}
  },note:"2023년 6월 재림 카드 기준이다(같은 해 10월의 다른 양식 판은 쓰지 않았다). 성검의 군주는 성검 12발 중 맞은 수(성휘)에 비례해 기절 1~12초, 참격 네 번 합계 40~160 피해, 침묵 1~4초다."});
CH.max_r={name:'아르트랑, 맥스',cls:'신화',grade:'신화',range:2.6,re:true,base:'max',
  init:e=>{e.r={jip:5,tr:0,acc:0,defy:0,off:false,form:null,ft:0,hc:0,facc:0,dealt:0,taken:0}}, hud:e=>'집념 '+e.r.jip+' · 초월 '+e.r.tr+(e.r.ft>now?' · '+e.r.form:'')+(e.r.off?' · 구원':''),
  T:e=>e.r.tr,
  onStatus(e,k,t){ return e.r.off?t:t*2; },
  tick(e,dt){ if(!e.r.off&&e.r.defy<=now){ e.r.acc+=dt; if(e.r.acc>=1){ e.r.acc-=1; e.hp-=6; if(e.hp<=0){ e.hp=0; if(!CH.max_r.onFatal(e)) damage(e,e,1,'맹약과 저주',FIX); } } }
    if(e.r.ft>now&&e.r.form==='혼돈'){ e.r.facc+=dt; if(e.r.facc>=1){ e.r.facc-=1; const c=Object.keys(e.cd).filter(k=>k!=='b'&&e.cd[k]>0),k=c[Math.floor(Math.random()*c.length)]; if(k) e.cd[k]=Math.max(0,e.cd[k]-2); } } },
  onFatal(e){ if(e.r.defy>now||e.r.safe>now){ e.hp=e.r.defy>now?1:Math.max(1,e.r.rv||1); return true; } /* 거역 중·부활 직후에는 처형도 고정 피해도 통하지 않는다 */ if(e.r.off||e.r.jip<=0) return false; e.r.jip--; e.r.tr++; e.r.defy=now+3; e.hp=1; add(e,'invuln',3); proc(e,'초월의 집념','죽음을 거역 · 초월 '+e.r.tr); e.r.safe=now+4; after(3,()=>{ if(!e.dead){ e.hp=e.r.rv=Math.max(1,e.max-e.r.tr*100); e.r.safe=now+1; say(e,'부활','#ffe9a0'); } }); return true; },
  onKill(e){ if(e.r.off) return; e.r.jip++; e.r.tr=Math.max(0,e.r.tr-1); },
  onHurt(e,src,amt){ if(src!==e) e.r.taken+=amt; },
  modTake(e,src,amt){ if(src!==e&&e.r.ft>now&&e.r.form==='넘어선 자'&&Math.random()<.25){ say(e,'회피','#ffe9a0'); return 0; } return amt; },
  onDeal(e,t,amt,label,o){ if(o&&o.amp) return; e.r.dealt++; if(e.r.ft<=now||t.dead) return; if(e.r.form==='일곱 별'&&++e.r.hc>=7){ e.r.hc=0; add(t,'stun',1,0,{by:e}); } if(e.r.form==='신살자') damage(e,t,4,'신살자 (고정 피해)',FIX); },
  skills:{
   n1:{name:'신성검',kind:'신화',cd:3,r:3,cast(e){ const T=e.r.tr,r=Math.min(8,3+T); for(let i=0;i<3;i++) after(i*.12,()=>{ if(e.dead) return; e.swingT=now; S.circle(e,r,3+T,'신성검',{v:'spin',el:'holy',post:()=>heal(e,3+T,true)}); }); }},
   n2:{name:'별하늘 넘기',kind:'신화',cd:4,ai:(e,d)=>d>3&&d<=8,cast(e){ rm(e,'slow'); S.leap(e,moveDir(e),5,24); e.cd.n2=Math.max(.3,4-e.r.tr*.5); }},
   aw:{name:'위상의 그릇',kind:'기원',cd:30,r:8,cast(e){ S.focus(e,1.5); after(1.5,()=>{ if(e.dead) return; e.r.form=['일곱 별','넘어선 자','혼돈','신살자'][Math.floor(Math.random()*4)]; e.r.ft=now+15; e.r.hc=0; say(e,e.r.form,'#ffe9a0'); proc(e,'위상의 그릇',e.r.form); if(e.r.form==='넘어선 자') add(e,'haste',15,.2); }); }},
   x1:{name:'종언의 검광',kind:'신화',cd:60,r:5,cast(e){ S.arc(e,6,t=>t.max*.05,'종언의 검광',{v:'slash',el:'holy'}); for(let i=0;i<4;i++) after(.2+i*.12,()=>{ if(!e.dead) S.arc(e,4,0,'종언의 검광',{v:'slash',el:'blood',post:t=>damage(e,t,10,'종언의 검광 (고정 피해)',FIX)}); }); after(.8,()=>{ if(!e.dead) S.line(e,4,e.r.tr*20,'종언의 검광 (내려치기)',{v:'cut'}); }); }},
   x2:{name:'고결한 자',kind:'신화',cd:90,r:6,cast(e){ const sp=e.hp-1; e.hp=1; S.focus(e,1); after(1,()=>{ if(!e.dead) S.circle(e,6,sp/3,'고결한 자',{silence:3,v:'burst',el:'blood'}); }); }},
   x3:{name:'무량 세계',kind:'신화',cd:180,r:14,cast(e){ S.focus(e,5); add(e,'invuln',5); after(5,()=>{ if(e.dead) return; const hit=S.circle(e,18,0,'무량 세계',{stun:3,v:'shout',zfree:true}); for(let i=0;i<5;i++) after(.3+i*.2,()=>hit.forEach(t=>{ if(!e.dead&&!t.dead){ fx.push({k:'circle',x:t.x,y:t.y,r:1.2,t0:now,team:e.team,lab:'무량 세계',src:e,v:'blade',el:'holy'}); damage(e,t,e.r.tr*4,'무량 세계 (고정 피해)',FIX); } })); after(1.6,()=>{ if(!e.dead) S.line(e,10,e.r.tr*e.r.dealt,'무량 세계 (일격)',{zfree:true,v:'beam',el:'holy'}); }); }); }},
   x4:{name:'구원하는 자',kind:'기원',cd:99999,r:99,can:e=>!e.r.off&&e.r.jip===0&&e.r.tr>=5,need:'집념 0 + 초월 5',cast(e){ e.r.tr-=5; e.r.off=true; e.hp=e.max; for(const k in e.cd) if(k!=='x4') e.cd[k]=0; /* 범위는 맵 전체 */ const dmg=e.r.taken; fx.push({k:'circle',x:e.x,y:e.y,r:Math.hypot(W,H),t0:now,dur:.6,team:e.team,lab:'구원하는 자',src:e,v:'nova',el:'holy'}); foes(e).forEach(t=>{ fx.push({k:'circle',x:t.x,y:t.y,r:1.6,t0:now,team:e.team,lab:'구원하는 자',src:e,v:'blade',el:'holy'}); damage(e,t,dmg,'구원하는 자 (고정 피해)',FIX); }); }}
  },note:"@전설 @재림 카드다(체력 600, 공격력 20). 매초 체력 6을 잃고, 체력이 0이 되면 집념(처음 5)을 하나 써서 3초 뒤 '최대 체력 - 초월 x 100'으로 되살아난다. 죽음을 거역하는 3초와 되살아난 직후 1초 동안에는 처형(붕괴·망아·금살 귀천무 등)과 고정 피해로도 쓰러지지 않고 집념도 더 쓰지 않는다. 위상의 그릇은 네 힘 중 하나가 무작위로 온다. 구원하는 자는 맵 전체의 적에게 든다."};
/* 소녀의 재림. 2023-03-12 카드(@전설 @재림, 체력 600 · 공격력 20). 이름 없는 기원은 시험장에서 '바탕'이라 부른다. */
CH.girl_r={name:'궁창의 혼재, 아에르',cls:'신화',grade:'신화',range:7,re:true,base:'girl',unknowable:true,
  init:e=>{e.r={acc:0,world:0}}, hud:e=>'불가변성 · '+(e.r.world>now?'바탕':'형이상학'),
  /* 불가변성: 고정 피해가 아니면 무엇이든 3으로 바꿔 받는다(바탕에서는 2 줄어 1). 저항은 그 뒤에 따로 든다. */
  modTake(e,src,amt){ return amt>0?(e.r.world>now?1:3):amt; },
  /* 형이상학: 매초 25%로 1~5칸 순간이동(바탕에서는 자리를 옮기지 않는다) + 무작위 일반 스킬 대기시간 초기화 + 기원 대기시간 -100초 */
  tick(e,dt){ e.r.acc+=dt; if(e.r.acc<1) return; e.r.acc-=1; if(Math.random()>=.25) return;
    if(e.r.world<=now){ const a=Math.random()*6.283,d=1+Math.random()*4; puff(e.x,e.y,'spirit',8,3); e.x+=Math.cos(a)*d; e.y+=Math.sin(a)*d; clamp(e); puff(e.x,e.y,'spirit',8,3); }
    const c=['n1','n2','aw'].filter(k=>e.cd[k]>0),k=c[Math.floor(Math.random()*c.length)]; if(k) e.cd[k]=0; e.cd.x1=Math.max(0,e.cd.x1-100); proc(e,'형이상학',e.r.world>now?'대기시간 초기화':'순간이동'); },
  skills:{
   n1:{name:'청정',cd:5,r:10,cast(e){ S.proj(e,e.aim,{speed:22,range:11,dmg:0,label:'청정',big:true,nohit:true,pierce:false,v:'orb',touch:()=>{},onEnd:p=>S.circle(e,3,18,'청정',{slow:[.75,1],v:'nova',el:'spirit',zfree:true},{x:p.x,y:p.y,z:0})}); }},
   n2:{name:'관념',cd:6,r:15,cast(e){ S.line(e,16,24,'관념',{silence:1,knock:0,v:'beam',el:'spirit',post:t=>{ knock(t,e,-2); after(.25,()=>{ if(!t.dead&&!e.dead) knock(t,e,3); }); }}); }},
   aw:{name:'추상',kind:'일반',cd:7,r:9,cast(e){ const p=spot(e,9,4); fx.push({k:'circle',x:p.x,y:p.y,r:4,t0:now,dur:.5,team:e.team,lab:'추상',src:e,v:'hex',el:'spirit'}); after(.5,()=>{ if(!e.dead) S.circle(e,4,30,'추상',{stun:1,air:4,knock:0,v:'burst',el:'spirit',zfree:true},p); }); }},
   x1:{name:'바탕',kind:'기원',cd:3600,r:99,cast(e){ const id=e.r.wid=(e.r.wid||0)+1; if(e.r.wz) e.r.wz.until=now; /* 다시 펼치면 앞의 바탕은 접는다 */ e.r.world=now+600; chaosUntil=e.r.world; chaosName='바탕';
        const z=zone(e,{x:W/2,y:H/2,r:99,dur:600,hid:true,onCast:(zz,who,slot)=>{ const k=who.c.skills[slot]; if(who===e||!k||(k.kind||KIND[slot])!=='기원'||e.r.world<=now) return; e.r.world-=60; chaosUntil=e.r.world; zz.until=e.r.world; proc(e,'바탕','지속시간 -10%'); }}); e.r.wz=z;
        for(let i=1;i<=600;i++) after(i,()=>{ if(e.r.wid!==id) return; if(e.dead){ if(chaosName==='바탕') chaosUntil=0; return; } if(e.r.world<=now) return; ents.forEach(o=>{ if(o.dead) return; add(o,'nojump',1.1,0,{by:e,self:o===e}); damage(e,o,5,'망아',{amp:true}); if(!o.dead&&o.hp<=o.max*.1) damage(e,o,o.hp+999,'망아 (사망)',FIX); }); }); }}
  },note:"@전설 @재림 카드다(체력 600, 공격력 20). 불가변성은 자기가 일으킨 망아 피해에도 든다(매초 3, 바탕에서는 1). 청정의 투사체 사거리(11칸), 추상의 지정 거리(9칸)와 '잠시 후'(0.5초), 관념의 끌고 미는 거리(2칸 끌고 0.25초 뒤 3칸 밀기)는 카드에 없어 정했다. 이름 없는 기원은 '바탕'이라 불렀다: 600초 동안 아에르를 포함한 모두가 망아(점프 불가, 매초 5 피해, 체력 10% 이하면 사망)에 들고, 다른 사람이 기원 스킬을 쓸 때마다 60초 줄어든다. 형이상학은 바탕에서도 대기시간 초기화는 한다."};
for(const k of ['max','girl','arthur','arthur_r','max_r','girl_r']){ const c=CH[k]; c.key=k; c.hp=550; c.atk=18; }
CH.max.atk=0; CH.girl_r.hp=600; CH.girl_r.atk=20; CH.max_r.hp=600; CH.max_r.atk=20; CH.arthur_r.hp=600; CH.arthur_r.atk=20;
Object.assign(LOOK,{ max:{el:'blood',w:'saber',hair:'#1a1a22',acc:['cape','scarf'],cape:'#14141f',scarf:'#d8324a',bl:'#e8eef8'}, girl:{el:'shadow',w:'spirit',hair:'#f3f0ff',acc:['veil','robe'],hood:'#14141f'},
 arthur:{el:'holy',w:'holysword',hair:'#f1e3a0',acc:['cape','crown','pauldrons'],cape:'#2c4fb0',gd:'#e3c377',bl:'#fff6d0',metal:'#e9e2c6'} });
LOOK.arthur_r=Object.assign({},LOOK.arthur,{el:'snow',cape:'#e8f4ff',bl:'#eafaff'}); LOOK.max_r=Object.assign({},LOOK.max,{el:'holy',cape:'#f5f1e3',scarf:'#e3c377',bl:'#fff6d0'}); LOOK.girl_r=Object.assign({},LOOK.girl,{el:'spirit',hair:'#e9fbff',hood:'#0d2a4a'});
Object.assign(AURA,{
 max(e,by){ if(e.r.god>now){ emit(e,by,'blood',.6); ringAt(e.x,e.y,.8,'#d8324a',3); } if(e.r.par>now) ringAt(e.x,e.y,.95,'#7fe3b5',3); if(e.r.ft>now&&e.r.fate&&!e.r.fate.dead){ g.strokeStyle='rgba(240,180,88,.7)'; g.lineWidth=2/cell; g.beginPath(); g.moveTo(e.x,by); g.lineTo(e.r.fate.x,e.r.fate.y-e.r.fate.z*.45); g.stroke(); } foes(e).forEach(t=>{ if(has(t,'despair')) markOn(t,'#c9c2ff','절망'); }); },
 girl(e,by){ emit(e,by,'shadow',.3); },
 arthur(e,by){ if(e.r.open>now) emit(e,by,'holy',.5); if(e.r.king>now) ringAt(e.x,e.y,.9,'#ffe9a0',4); if(e.r.dg>now) ringAt(e.x,e.y,1.05,'#ffffff',2,[.16,.12]); },
 max_r(e,by){ if(e.r.defy>now){ emit(e,by,'holy',.9,1.2); ringAt(e.x,e.y,.95,'#ffe9a0',4); } if(e.r.ft>now) ringAt(e.x,e.y,.8,'#e3c377',2.5,[.2,.12]); }
}); AURA.arthur_r=AURA.arthur; AURA.girl_r=(e,by)=>{ emit(e,by,'spirit',.35); if(e.r.world>now) ringAt(e.x,e.y,.9,'#bfefff',3,[.2,.14]); };
Object.assign(STATES,{ max:e=>[e.r.god>now&&['신살자',until(e.r.god)],e.r.par>now&&['흘려내기',until(e.r.par)],e.r.ft>now&&['운명',until(e.r.ft)]], girl:e=>[e.r.world>now&&['혼돈 세계',until(e.r.world)]],
 arthur:e=>[e.r.open>now&&['성검 개방',until(e.r.open)],e.r.king>now&&['왕의 귀환',until(e.r.king)],e.r.rf>now&&['광염',until(e.r.rf)]], max_r:e=>[e.r.defy>now&&['죽음을 거역',until(e.r.defy)],e.r.ft>now&&[e.r.form,until(e.r.ft)]] });
STATES.girl_r=e=>[e.r.world>now&&['바탕',until(e.r.world)]];
STATES.arthur_r=e=>[e.r.open>now&&['성검 현현',until(e.r.open)],e.r.king>now&&['왕의 귀환',until(e.r.king)],e.r.rf>now&&['염광성',until(e.r.rf)]];
