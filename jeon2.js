"use strict";
/* 전설급 추가 2: 마법사 5 · 암살자 3. */
Object.assign(CH,{
stella:{name:'별의 대사제, 스텔라',cls:'마법사',grade:'전설',range:7,
  init:e=>{e.r={st:0,chain:0,ok:false}}, hud:e=>'별빛 '+e.r.st+'/7 · 위대한 별 연속 '+e.r.chain+'/7',
  onSkillHit(e,t,label){ if((label==='혜성'||label==='은하수')&&e.r.st<7) e.r.st++; },
  star(e,t){ const p={x:t.x,y:t.y,z:0}; S.circle(e,1.5,12,'별무리',{knock:1,v:'bolt',zfree:true},p); },
  altBasic(e){ if(e.r.st<=0) return false; if(e.cd.b>0) return true; const t=tgt(e,10); if(!t) return false; e.cd.b=CFG.atkInt; e.r.st--; e.shotT=now; shotSnd(e); CH.stella.star(e,t); return true; },
  skills:{
   n1:{name:'혜성',cd:12,r:11,cast(e){ S.focus(e,1); for(let i=0;i<5;i++) after(1+i*.2,()=>{ if(!e.dead) S.proj(e,e.aim,{speed:24,range:13,dmg:5,label:'혜성'}); }); }},
   n2:{name:'은하수',cd:14,r:4,cast(e){ S.circle(e,4,15,'은하수',{knock:.7,v:'vortex',post:t=>{ air(t,.6); add(t,'stun',.5,0,{by:e}); }}); after(.3,()=>{ if(!e.dead) S.circle(e,4,15,'은하수',{knock:.7,v:'vortex',zfree:true}); }); }},
   aw:{name:'위대한 별',kind:'초월',cd:60,r:9,cast(e){ S.focus(e,3); add(e,'resist',3,.2); e.r.chain=0; after(3,()=>{ if(e.dead) return; e.vz=Math.sqrt(2*G*3); for(let i=0;i<7;i++) after(i*.42,()=>{ if(e.dead) return; if(e.z>1.5) e.vz=Math.max(e.vz,2); const p=spot(e,10,5); fx.push({k:'circle',x:p.x,y:p.y,r:2,t0:now,team:e.team,dur:.5,lab:'위대한 별',src:e});
          after(.5,()=>{ if(e.dead) return; const h=S.circle(e,2,20,'위대한 별',{v:'bolt',zfree:true,post:t=>{ if(e.r.st>0&&!t.dead){ e.r.st--; damage(e,t,12,'별무리'); knock(t,e,1); } }},p); if(h.length){ if(++e.r.chain>=7) e.r.ok=true; } else e.r.chain=0; }); }); }); }},
   ult:{name:'영웅의 자리',cd:0,r:9,can:e=>e.r.ok,need:'위대한 별 7연속 적중',cast(e){ add(e,'resist',3,.5); e.vz=Math.sqrt(2*G*4); for(let i=1;i<=7;i++) after(i*.4,()=>{ if(!e.dead){ if(e.r.st<7) e.r.st++; if(e.z>1.5) e.vz=Math.max(e.vz,2.5); } });
        after(3,()=>{ if(e.dead) return; const p=spot(e,10,5); fx.push({k:'circle',x:p.x,y:p.y,r:5,t0:now,team:e.team,dur:1.5,lab:'영웅의 자리',src:e}); after(1.5,()=>{ if(e.dead) return; S.circle(e,5,70,'영웅의 자리',{silence:3,v:'burst',zfree:true},p); for(let i=1;i<=7;i++) after(i*.28,()=>{ if(e.r.st<7) e.r.st++; }); }); }); }}
  },note:'별빛이 있으면 기본기 단추가 별 떨구기다(10칸 안의 적이 선 자리, 12 피해). 위대한 별은 0.42초마다 적이 선 자리를 겨누고 0.5초 뒤 떨어진다.'},
evangeline:{name:'마법의 여제, 에반젤린',cls:'마법사',grade:'전설',range:6.5,
  init:e=>{e.r={nx:null,n:0}}, hud:e=>(e.r.nx?'조화경: '+e.r.nx+' · ':'')+'조화경 적중 '+e.r.n+'/20',
  onCast(e,s){ const m={n1:'염성',n2:'수결',aw:'공진 폭렬'}[s]; if(m) e.r.nx=m; },
  altBasic(e){ if(!e.r.nx) return false; if(e.cd.b>0) return true; const t=tgt(e,8),p=t?{x:t.x,y:t.y,z:0}:Object.assign(front(e,3),{z:0}),m=e.r.nx; e.r.nx=null; e.cd.b=CFG.atkInt; e.swingT=now; shotSnd(e);
    const o={염성:{disarm:.5,v:'geyser',el:'fire'},수결:{slow:[.4,1],v:'rain',el:'water'},'공진 폭렬':{stun:1,v:'vortex',el:'wind'}}[m]; if(S.circle(e,2.5,{염성:16,수결:10,'공진 폭렬':24}[m],'조화경 ('+m+')',Object.assign({zfree:true},o),p).length) e.r.n++; return true; },
  skills:{
   n1:{name:'염성',cd:8,r:8,cast(e){ add(e,'slow',.5,.2,{self:true}); after(.5,()=>{ if(!e.dead) S.circle(e,3,14,'염성',{knock:1.5,v:'bolt',el:'fire'},spot(e,9,4)); }); }},
   n2:{name:'수결',cd:8,r:9,cast(e){ add(e,'slow',.5,.2,{self:true}); after(.5,()=>{ if(!e.dead) S.proj(e,e.aim,{speed:9,range:12,dmg:20,label:'수결',big:true,el:'water',o:{silence:.5}}); }); }},
   aw:{name:'공진 폭렬',cd:30,r:5,cast(e){ S.focus(e,1); add(e,'invuln',1); after(1,()=>{ if(!e.dead) S.circle(e,5,40,'공진 폭렬',{air:4,v:'burst',el:'wind'}); }); }},
   ult:{name:'삼원소 융합',cd:0,r:6,can:e=>e.r.n>=20,need:'조화경 적중 20회',cast(e){ add(e,'slow',3,.8,{self:true}); const cdn=()=>{ for(const k in e.cd) if(k!=='b') e.cd[k]=Math.max(0,e.cd[k]-2); };
        [[5,16,'fire'],[6,24,'water'],[7,30,'wind']].forEach((a,i)=>after(3+i*.4,()=>{ if(!e.dead) S.circle(e,a[0],a[1],'삼원소 융합',{v:'hex',el:a[2],post:cdn}); })); for(let i=0;i<4;i++) after(4.4+i*.15,()=>{ if(!e.dead) S.circle(e,8,20,'삼원소 융합 (대마법진)',{knock:i===3?3:0,v:'burst',post:cdn}); }); }}
  },note:'스킬을 쓴 뒤 다음 기본기 단추가 조화경이다(8칸 안의 적이 선 자리, 반지름 2.5칸). 염성은 9칸 안의 적이 선 자리에 떨어진다.'},
venil:{name:'차가운 열정, 베닐',cls:'마법사',grade:'전설',range:6,
  init:e=>{e.r={pcd:0,n:0,awHit:false}}, hud:e=>'환생 '+(e.r.pcd>0?e.r.pcd.toFixed(0)+'s':'준비')+' ('+e.r.n+'회)'+(e.r.awHit?' · 동토 적중':''),
  tick(e,dt){ if(e.r.pcd>0) e.r.pcd-=dt; else if(e.hp<=e.max*.3){ e.r.pcd=120; e.r.n++; proc(e,'환생','강림 3초'); add(e,'invuln',3); add(e,'stun',3,0,{self:true}); after(3,()=>heal(e,100)); } },
  skills:{
   n1:{name:'냉각',cd:8,r:5,can:e=>!!tgt(e,5),need:'5칸 안의 적',cast(e){ const t=tgt(e,5),v=has(t,'vapor'); fx.push({k:'circle',x:t.x,y:t.y,r:1,t0:now,team:e.team,lab:'냉각',src:e,v:'nova'}); strike(e,t,v?50:25,v?'냉각 (기화)':'냉각'); }},
   n2:{name:'기화',cd:12,r:10,cast(e){ S.proj(e,e.aim,{speed:20,range:12,dmg:30,label:'기화',big:true,o:{stun:.5,post:t=>{ rm(t,'vapor'); add(t,'vapor',8,0,{by:e}); }}}); }},
   aw:{name:'영구 동토',cd:30,r:5,cast(e){ S.focus(e,1); after(1,()=>{ if(e.dead) return; if(S.circle(e,5,40,'영구 동토',{slow:[.45,2],v:'burst'}).length){ e.cd.n1=0; e.cd.n2=0; e.r.awHit=true; } }); }},
   ult:{name:'냉기의 화신',cd:0,r:8,can:e=>e.r.n>=1&&e.r.awHit,need:'환생 1회 + 영구 동토 적중',cast(e){ e.r.awHit=false; const p0={x:e.x,y:e.y}; S.leap(e,e.aim,7,26,()=>{ S.seg(e,p0,{x:e.x,y:e.y},4,30,'냉기의 화신',{slow:[.99,3],v:'beam'}); after(.15,()=>{ if(!e.dead) S.circle(e,5,50,'냉기의 화신 (서리)',{stun:1,v:'burst'}); }); },true); }}
  },note:"'기화가 명중한 적'은 맞은 뒤 8초 동안으로 잡았다(카드에 시간이 없음). 환생 중에는 움직이지 못한다."},
pastern:{name:'시사계의 허물, 파스테른',cls:'마법사',grade:'전설',range:3.2,
  init:e=>{e.r={pcd:0,rs:0,echo:false}}, hud:e=>'평행 '+(e.r.pcd>0?e.r.pcd.toFixed(0)+'s':'준비')+' · 초기화 '+e.r.rs+'/9',
  tick(e,dt){ if(e.r.pcd>0) e.r.pcd-=dt; },
  onCast(e,s){ if(s==='crouch'||s==='ult'||e.r.pcd>0) return; e.r.pcd=8; proc(e,'평행','1초 뒤 재시전'); after(1,()=>{ if(!e.dead&&canAct(e)){ say(e,e.c.skills[s].name,'#b58cff'); e.c.skills[s].cast(e); } }); },
  modTake(e,src,amt){ if(src!==e&&e.r.pcd<=0&&has(src,'paradox')){ e.r.pcd=8; proc(e,'평행','피해 무시'); return 0; } return amt; },
  skills:{
   n1:{name:'괴리',cd:8,r:3,cast(e){ S.line(e,3,t=>has(t,'root')?30:15,'괴리',{post:t=>{ if(!has(t,'root')){ rm(t,'paradox'); add(t,'paradox',2,0,{by:e}); } }}); }},
   n2:{name:'관측',cd:12,r:4,cast(e){ S.circle(e,4,20,'관측',{v:'vortex',post:t=>{ if(has(t,'paradox')){ rm(t,'paradox'); add(t,'root',1,0,{by:e}); } else knock(t,e,1.5); }}); }},
   aw:{name:'시간의 끝',cd:30,r:5,cast(e){ const p=spot(e,5,3); fx.push({k:'circle',x:p.x,y:p.y,r:2,t0:now,team:e.team,dur:1,lab:'시간의 끝',src:e}); after(1,()=>{ if(e.dead) return; if(S.circle(e,2,25,'시간의 끝',{v:'hex',post:t=>{ rm(t,'paradox'); add(t,'paradox',4,0,{by:e}); }},p).length){ const c=['n1','n2'].filter(k=>e.cd[k]>0),k=c[Math.floor(Math.random()*c.length)]; if(k) e.cd[k]=0; e.r.rs++; } }); }},
   ult:{name:'시간의 신',cd:0,r:10,can:e=>e.r.rs>=9,need:'재사용 초기화 9회',cast(e){ fx.push({k:'circle',x:e.x,y:e.y,r:10,t0:now,team:e.team,lab:'시간의 신',src:e,v:'shout'}); foes(e).forEach(t=>{ const d=dist(e,t); if(d<=10+R) add(t,'stun',lerp(.5,3,Math.min(1,d/10)),0,{by:e}); }); for(const k in e.cd) e.cd[k]=0; }}
  },note:'평행은 8초에 한 번, 스킬을 쓰면 1초 뒤 같은 스킬이 한 번 더 나가거나, 역설 상태인 적의 공격 한 번을 무시한다(먼저 온 쪽에 쓰인다).'},
rotia:{name:'메마른 나비, 로티아',cls:'마법사',grade:'전설',range:6.5,
  init:e=>{e.r={pcd:0,go:0,ah:0}}, hud:e=>'고독 '+Math.floor(e.r.go)+'/100 · 화우 적중 '+e.r.ah+'/40',
  tick(e,dt){ if(e.r.pcd>0) e.r.pcd-=dt; },
  onSkillHit(e,t){ if(e.r.pcd>0||t.dead) return; e.r.pcd=1; add(t,'venom',4,0,{by:e}); dot(e,t,4,4,'독접'); },
  onDeal(e,t,amt,label){ if(label==='독접') e.r.go=Math.min(100,e.r.go+amt); },
  skills:{
   n1:{name:'암기',cd:2,r:11,cast(e){ S.proj(e,e.aim,{speed:26,range:13,dmg:t=>has(t,'venom')?8:4,label:'암기'}); }},
   n2:{name:'독살',cd:9,r:5,cast(e){ S.circle(e,5,6,'독살',{knock:1,v:'nova',pre:t=>{ if(has(t,'venom')) add(t,'stun',.5,0,{by:e}); }}); }},
   aw:{name:'만천화우',cd:45,r:10,ai:(e,d)=>d<=10&&e.r.go>=60,cast(e){ const n=e.r.go; e.r.go=0; S.focus(e,3); after(3,()=>{ if(e.dead) return; zone(e,{x:e.x,y:e.y,r:11,dur:n/10,every:.25,label:'만천화우',tick:(z,inn)=>inn.forEach(t=>{ strike(e,t,2,'만천화우',{slow:[.1,.35]}); e.r.ah++; e.r.pcd=Math.max(0,e.r.pcd-.5); })}); }); }},
   ult:{name:'갈사비접',cd:0,r:10,can:e=>e.r.ah>=40,need:'만천화우 적중 40회',cast(e){ S.focus(e,1); after(1,()=>{ if(e.dead) return; const a0=Math.atan2(e.aim.y,e.aim.x); S.leap(e,{x:-e.aim.x,y:-e.aim.y},3,20,null,true); for(let i=0;i<30;i++) after(i*.05,()=>{ if(e.dead) return; const a=a0+(Math.random()-.5)*.5; S.proj(e,{x:Math.cos(a),y:Math.sin(a)},{speed:28,range:13,dmg:t=>has(t,'venom')?10:5,label:'갈사비접',o:{post:t=>add(t,'weak',2,1,{by:e})}}); }); }); }}
  },note:'독접은 1초에 한 번 붙고, 붙을 때마다 4초 동안 초당 1 피해를 따로 준다(중첩).'},
yuri:{name:'가련한 패도, 유리',cls:'암살자',grade:'전설',range:2.3,
  init:e=>{e.r={ck:false,ckT:-9,n:0,sn:0,ut:0}}, hud:e=>(e.r.ck?'창천검 · ':'')+'천선검 효과 '+e.r.n+'/100',
  onCast(e,s){ if(s==='crouch') return; e.r.ck=true; if(e.r.ut>now&&(s==='n1'||s==='n2')) e.cd[s]=.25; },
  altBasic(e){ if(!e.r.ck) return false; if(e.cd.b>0) return true; e.cd.b=CFG.atkInt; e.r.ck=false; e.r.ckT=now; e.swingT=now; swingSnd(e); S.arc(e,3,26,'창천검',{basic:true,knock:.7,el:'blue'}); return true; },
  modTake(e,src,amt){ if(src!==e&&e.r.sn>now){ e.r.sn=0; return amt*.75; } return amt; },
  skills:{
   n1:{name:'천선검',cd:4,r:3,cast(e){ const fast=now-e.r.ckT<=.25; e.swingT=now; S.arc(e,3,14,'천선검',fast?{pull:.7,el:'steel'}:{el:'steel'}); if(fast){ e.cd.n1=.25; e.r.n++; proc(e,'천선검','연계 '+e.r.n); } }},
   n2:{name:'반천검',cd:5,ai:(e,d)=>d<=4,can:e=>inFight(e),need:'전투 중',cast(e){ add(e,'haste',1,.1); e.r.sn=now+1; }},
   aw:{name:'극동의 검',cd:30,r:4,cast(e){ S.line(e,4,40,'극동의 검',{knock:1,v:'slash'}); }},
   ult:{name:'창천반선',cd:0,r:4,can:e=>e.r.n>=100,need:'천선검 효과 100회',cast(e){ e.r.ut=now+3; e.cd.n1=Math.min(e.cd.n1,.25); e.cd.n2=Math.min(e.cd.n2,.25); }}
  },note:'스킬을 쓴 뒤 다음 기본기 단추가 창천검(26)이다. 창천검을 휘두르고 0.25초 안에 천선검을 누르면 천선검의 대기시간이 0.25초가 된다. 범위는 카드에 없어 3칸으로 잡았다.'},
alpi:{name:'느긋한 바람, 알피',cls:'암살자',grade:'전설',range:2.4,
  init:e=>{e.r={n:0,tw:false,ut:0}}, hud:e=>'풍랑 '+e.r.n+'/50'+(e.r.tw?' · 회오리 준비':''),
  onDeal(e,t,amt,label,o){ if(o&&o.amp||t.dead||Math.random()>=.5) return; e.r.n++; e.cd.aw=Math.max(0,e.cd.aw-2); damage(e,t,4,'풍랑',{amp:true}); },
  onCast(e,s){ if(e.r.ut<=now||s==='crouch'||s==='ult') return; const p={x:e.x,y:e.y,z:0},d={n1:[4,12],n2:[3.5,14],aw:[3,10]}[s]; if(d) after(.5,()=>{ if(!e.dead) S.circle(e,d[0],d[1],e.c.skills[s].name+' (녹옥의 흐름)',{v:'vortex',el:'nature'},p); }); },
  skills:{
   n1:{name:'서풍',cd:8,r:4,cast(e){ const tw=e.r.tw; e.r.tw=false; if(S.circle(e,4,12,'서풍',{knock:.7,v:'vortex'}).length) e.r.tw=true; if(tw) S.proj(e,e.aim,{speed:16,range:10,dmg:8,label:'회오리',big:true,o:{air:1.5,post:t=>add(t,'whirl',2,0,{by:e})}}); }},
   n2:{name:'북풍',cd:12,ai:(e,d)=>d>3&&d<=8,cast(e){ S.leap(e,moveDir(e),7,24,()=>{ if(S.circle(e,3.5,14,'북풍',{knock:1,v:'spin'}).length) e.cd.n2=Math.max(0,e.cd.n2-5); }); }},
   aw:{name:'대기 순환',cd:30,r:3,cast(e){ const hit=S.circle(e,3,10,'대기 순환',{zfree:true,v:'vortex',post:t=>{ if(!has(t,'whirl')) knock(t,e,1); }}); if(hit.length) e.cd.n1=0; hit.forEach(t=>{ if(t.dead||!has(t,'whirl')) return; add(t,'slow',3,.6,{by:e}); for(let i=0;i<5;i++) after(i*.08,()=>{ if(!e.dead&&!t.dead) strike(e,t,5,'대기 순환 (회오리)'); }); after(.42,()=>{ if(!e.dead&&!t.dead){ e.x=t.x-t.aim.x*1.1; e.y=t.y-t.aim.y*1.1; clamp(e); } }); }); }},
   ult:{name:'가련한 바람',cd:0,r:6,can:e=>e.r.n>=50,need:'풍랑 50회',cast(e){ e.r.ut=now+4; add(e,'haste',4,.2); }}
  },note:'가련한 바람 중에는 스킬을 쓴 자리에서 0.5초 뒤 같은 범위·피해만 한 번 더 들어간다.'},
ain:{name:'잔영의 검사, 아인',cls:'암살자',grade:'전설',range:2.6,
  init:e=>{e.r={mx:0,mh:0,md:0,ut:0}}, hud:e=>'최대 멸영 '+e.r.mx+'/4'+(e.r.mh>now?' · 몽환포영 '+(4-e.r.md):''),
  n:(e,t)=>{ const s=has(t,'yg'); return s&&s.by===e?s.n:0; },
  plant(e,t,k){ if(t.dead) return; let s=has(t,'yg'); if(!s||s.by!==e) s=add(t,'yg',99999,0,{by:e,n:0}); s.n=Math.min(4,s.n+k); if(s.n>=4&&!has(t,'glow')) add(t,'glow',99999,0,{by:e,yg:true}); },
  dash(e){ const last=++e.r.md>=4,p0={x:e.x,y:e.y}; S.leap(e,moveDir(e),last?8:4,26,()=>S.seg(e,p0,{x:e.x,y:e.y},1.4,last?24:12,'몽환포영',{v:'dash',post:t=>CH.ain.plant(e,t,last?4:1)}),true); if(last) e.r.mh=0; },
  skills:{
   crouch:{name:'몽환포영 돌진',cd:.45,can:e=>e.r.mh>now&&e.r.md<4,need:'몽환포영 중',ai:(e,d)=>d<=6,cast(e){ CH.ain.dash(e); }},
   n1:{name:'잔영',cd:6,r:5,cast(e){ S.line(e,5,10,'잔영',{v:'thrust',post:t=>CH.ain.plant(e,t,1)}); }},
   n2:{name:'멸영',cd:18,r:10,cast(e){ S.proj(e,e.aim,{speed:24,range:12,dmg:16,label:'멸영',big:true,o:{knock:1.5,post:t=>{ const n=CH.ain.n(e,t); rm(t,'yg'); t.st=t.st.filter(s=>!s.yg); if(n>0) damage(e,t,t.max*.01*n,'영검 (최체비)');
        if(n>=4){ e.r.mx++; e.cd.n1=0; e.cd.n2=0; add(e,'haste',1,.3); proc(e,'영검','일반 스킬 초기화'); } if(e.r.ut>now&&!t.dead){ damage(e,t,t.max*.04,'영검난무 (최체비)'); add(t,'root',1,0,{by:e}); } }}}); }},
   aw:{name:'몽환포영',cd:45,r:8,cast(e){ e.r.mh=now+6; e.r.md=0; }},
   ult:{name:'영검난무',cd:0,r:9,can:e=>e.r.mx>=4,need:'영검 4개 멸영 4회',cast(e){ e.r.ut=now+5; S.proj(e,e.aim,{speed:26,range:11,dmg:0,label:'영검난무',big:true,nohit:true,touch:t=>{ add(t,'root',1,0,{by:e}); after(.2,()=>{ if(e.dead) return; near(e,t,1.6); S.arc(e,5,36,'영검난무',{post:x=>CH.ain.plant(e,x,4)}); }); }}); }}
  },note:'영검은 터트릴 때까지 남는다. 몽환포영의 돌진은 웅크리기 단추(이동 방향).'}
});
