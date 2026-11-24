"use strict";
/* 전설급 추가 1: 전사 5 · 수호자 3. '경직'은 0.3초 기절로 넣었다. */
const STAG=.3, diag=(a,s)=>{ const c=Math.SQRT1_2; return {x:(a.x+s*a.y)*c,y:(a.y-s*a.x)*c}; };
Object.assign(CH,{
rano:{name:'경박한 취룡, 라노',cls:'전사',grade:'전설',range:2.6,
  init:e=>{e.r={dr:0,acc:0,man:false,macc:0,ev:0,free:false,rise:0,st:0}}, hud:e=>'취기 '+e.r.dr+'/8'+(e.r.man?' · 만취':'')+' · 회피 '+e.r.ev+'/8',
  ok:e=>!e.r.man||e.r.free,
  tick(e,dt){ if(e.r.man){ e.r.macc+=dt; if(e.r.macc>=1){ e.r.macc-=1; if(--e.r.dr<=0){ e.r.dr=0; e.r.man=false; e.r.free=false; } } } else { e.r.acc+=dt; if(e.r.acc>=4){ e.r.acc-=4; e.r.dr=Math.min(8,e.r.dr+2); if(e.r.dr>=8){ e.r.man=true; e.r.macc=0; proc(e,'만취','스킬 봉인 · 공격 +5'); } } } },
  basicBonus(e,t){ if(e.r.man) damage(e,t,5,'만취'); },
  onDeal(e,t,amt,label,o){ if(e.r.rise>now&&o&&!o.amp&&!t.dead) damage(e,t,amt*.08,'기상 (증폭)',{amp:true}); },
  modTake(e,src,amt,label,o){ if(src===e) return amt; if(e.r.st>now){ e.r.st=0; const ph=PH,b=o&&o.basic; say(e,'접목','#7fe3b5'); proc(e,'접목',ph?'투사체 받아치기':b?'기본 공격 받아치기':'스킬 받아치기');
      after(.02,()=>{ if(e.dead) return; e.busy=0; rm(e,'focus'); if(ph) S.leap(e,e.aim,Math.min(8,Math.max(0,dist(e,src)-1.2)),26,()=>S.arc(e,4,16,'접목 (도약)'),true); else if(b) S.circle(e,3,12,'접목 (내리찍기)',{stun:1,v:'quake'}); else S.arc(e,4,20,'접목 (휘두르기)',{knock:2}); }); return 0; }
    if(e.r.man&&Math.random()<.1){ e.r.ev++; say(e,'회피','#ffd27a'); return 0; } return amt; },
  skills:{
   n1:{name:'타구',cd:12,r:5,can:e=>CH.rano.ok(e),need:'만취 아님',cast(e){ S.line(e,5,18,'타구',{air:1,vuln:[.1,3]}); }},
   n2:{name:'접목',cd:18,ai:(e,d)=>d<=5,can:e=>CH.rano.ok(e),need:'만취 아님',cast(e){ e.r.st=now+1.5; S.focus(e,1.5); }},
   aw:{name:'항룡십팔장',cd:45,r:8,can:e=>CH.rano.ok(e),need:'만취 아님',cast(e){ S.focus(e,2); after(2,()=>{ if(e.dead) return; e.r.rise=now+8; add(e,'haste',8,.08); add(e,'resist',8,.08); for(let i=0;i<8;i++) after(i,()=>{ if(e.dead) return; heal(e,8); S.circle(e,8,3,'항룡십팔장',{air:i?0:3,v:'vortex'}); }); }); }},
   ult:{name:'취할 수 없는 날',cd:0,r:99,can:e=>e.r.ev>=8,need:'만취 중 회피 8회',cast(e){ for(let i=1;i<=10;i++) after(i,()=>heal(e,5)); e.r.dr=8; e.r.man=true; e.r.macc=0; e.r.free=true; }}
  },note:'접목은 1.5초 자세를 잡고, 그동안 맞은 첫 공격을 무효로 하고 받아친다(기본 공격·스킬·투사체에 따라 다름). 항룡십팔장은 8초 동안 매초 3 피해(합 24)이고 첫 타에 띄운다.'},
hwi:{name:'극동의 검사, 휘',cls:'전사',grade:'전설',range:2.5,
  init:e=>{e.r={on:false,acc:0,lost:0,nd:0}}, hud:e=>(e.r.on?'발검 · ':'')+'발검으로 잃은 체력 '+Math.floor(e.r.lost)+'/400',
  tick(e,dt){ if(!e.r.on) return; e.r.acc+=dt; if(e.r.acc>=1){ e.r.acc-=1; if(e.r.nd<=now&&e.free<=now){ const v=Math.min(20,e.hp-1); e.hp-=v; e.r.lost+=v; if(v>0) say(e,'-'+v,'#c98a8a'); } } },
  basicBonus(e,t){ if(e.r.on) damage(e,t,t.hp*.08,'단명 (현체비)'); },
  skills:{
   crouch:{name:'발검',cd:.4,ai:(e,d)=>e.r.on?(e.hp<e.max*.3||d>9):(d<=4&&e.hp>e.max*.5),cast(e){ if(e.r.on){ e.r.on=false; e.cd.crouch=10; } else { e.r.on=true; e.r.acc=0; } }},
   n1:{name:'일섬',cd:8,r:8,cast(e){ const E=e.r.on; S.line(e,8,E?32:16,'일섬',E?{pull:1}:{knock:1.5}); }},
   n2:{name:'검극',cd:14,r:5,cast(e){ const E=e.r.on; S.arc(e,5,24,'검극',{stun:STAG,pre:t=>{ if(E){ t.sh=[]; t.st=t.st.filter(s=>s.k!=='resist'); } }}); }},
   aw:{name:'만검 기행',kind:'초월',cd:60,r:14,cast(e){ const E=e.r.on; S.focus(e,1); after(1,()=>{ if(!e.dead) S.line(e,40,lerp(100,1,e.hp/e.max)*(E?2:1),'만검 기행',{stun:STAG,v:'beam'}); }); }},
   ult:{name:'회광반조',cd:0,r:99,can:e=>e.r.lost>=400,need:'발검으로 잃은 체력 400',cast(e){ S.focus(e,3); for(const k in e.cd) if(k!=='ult') e.cd[k]=0; after(3,()=>{ if(e.dead) return; add(e,'slow',5,.5,{self:true}); e.r.nd=now+5; }); }}
  },note:'발검은 웅크리기 단추로 켜고 끈다. 끌 때부터 10초를 센다. 만검 기행은 체력이 가득이면 1, 바닥이면 100 피해.'},
biwol:{name:'어검주, 비월',cls:'전사',grade:'전설',range:2.4,
  init:e=>{e.r={d:0,bh:0,sang:0,hits:0,ut:0,sw:0}}, hud:e=>'도예 '+e.r.d+(e.r.sang>now?' · 상예':'')+' · 강화 적중 '+e.r.hits+'/16'+(e.r.ut>now?' · 어검 '+e.r.sw:''),
  use(e,n){ if(e.r.sang>now||e.r.d<n) return false; e.r.d-=n; return true; },
  onCast(e,s){ if(s==='crouch') return; if(e.r.d<10) e.r.d++; e.cd.aw=Math.max(0,e.cd.aw-4); },
  onBasic(e,hit){ if(hit.length&&++e.r.bh%3===0&&e.r.d<14) e.r.d++; },
  onDeal(e,t,amt,label,o){ if(e.r.ut>now&&e.r.sw>0&&o&&!o.amp&&!t.dead&&(o.basic||o.skill)){ damage(e,t,e.r.sw,'어검',{amp:true}); for(const k in e.cd) if(k!=='b') e.cd[k]=Math.max(0,e.cd[k]-e.r.sw); } },
  skills:{
   crouch:{name:'상예',cd:3,ai:()=>false,cast(e){ e.r.sang=now+1; }},
   n1:{name:'섬퇴',cd:5,r:3.5,cast(e){ if(CH.biwol.use(e,3)){ let lp=false; for(let i=0;i<3;i++) after(i*.12,()=>{ if(e.dead) return; e.swingT=now; if(S.arc(e,4,4,'섬퇴 (도예)').length){ e.r.hits++; if(!lp){ lp=true; S.leap(e,e.aim,3,20,null,true); } } }); } else S.line(e,3,6,'섬퇴',{air:1}); }},
   n2:{name:'비점',cd:6,r:3.2,cast(e){ if(CH.biwol.use(e,4)){ if(S.circle(e,2,9,'비점 (도예)',{v:'quake'}).length) e.r.hits++; for(let i=1;i<=2;i++) after(i*.15,()=>{ if(!e.dead&&S.arc(e,3,9,'비점 (도예)').length) e.r.hits++; }); } else S.line(e,3.5,8,'비점',{knock:.7}); }},
   aw:{name:'섬수 낙침',cd:30,ai:(e,d)=>d>2&&d<=7,cast(e){ const go2=()=>S.leap(e,moveDir(e),4,22,()=>{ S.circle(e,4,16,'섬수 낙침',{v:'spin'}); if(CH.biwol.use(e,6)){ e.r.hits++; after(.25,()=>{ if(!e.dead) go2(); }); } },true); go2(); }},
   ult:{name:'어검술',cd:0,r:5,can:e=>e.r.hits>=16&&e.r.d>0,need:'도예 강화 적중 16회 + 도예',cast(e){ e.r.sw=e.r.d; e.r.d=0; e.r.ut=now+6; }}
  },note:'상예(웅크리기 단추)는 1초 동안 도예를 쓰지 않고 기본 효과로 쓴다. 어검술 중에는 타격마다 어검 수만큼 피해를 주고, 그 수만큼(초) 모든 재사용 대기시간이 준다.'},
trion:{name:'연격성, 트리온',cls:'전사',grade:'전설',range:2.2,
  init:e=>{e.r={c:0,cr:0,hw:0,ut:0}; e.atk=0;}, hud:e=>'콤보 '+e.r.c+'/47'+(e.r.hw>now?' · 활수':''),
  tick(e){ e.atk=e.r.ut>now?32:Math.max(.01,e.r.c); if(e.r.ut&&e.r.ut<=now){ e.r.ut=0; add(e,'weak',10,1,{self:true}); add(e,'slow',10,.2,{self:true}); } },
  basicBonus(e,t){ e.cd.n1=Math.max(0,e.cd.n1-1); e.cd.n2=Math.max(0,e.cd.n2-1); if(e.r.ut>now) return; if(e.r.c>=16) knock(t,e,.7); if(e.r.hw>now) e.r.c=Math.min(47,e.r.c+1);
    if(e.r.c>=47&&e.cd.aw<=0){ e.r.c=0; e.cd.aw=45; pay(e,e.max*.33); msg([['트리온 >> ','rgb('+TC[e.team]+')'],['(각성) : ','#97a1cf'],['폭류 폭쇄','#ffffff'],[' (45s)','#8088ad']],e.team);
      for(let i=0;i<2;i++) after(i*.2,()=>{ if(!e.dead) S.circle(e,6,20,'폭류 폭쇄',{pull:1.5,v:'vortex'}); }); for(let i=0;i<2;i++) after(.5+i*.2,()=>{ if(!e.dead) S.circle(e,4,39.5,'폭류 폭쇄 (나선)',{knock:i?3:0,v:'spin'}); }); add(e,'weak',15,1,{self:true}); add(e,'slow',15,.2,{self:true}); } },
  skills:{
   crouch:{name:'웅크리기',cd:.3,ai:()=>false,cast(e){ e.r.cr=now+1; }},
   n1:{name:'유수',cd:3,ai:(e,d)=>d<=6,can:e=>inFight(e),need:'전투 중',cast(e){ e.r.c=Math.min(47,e.r.c+1); const R2=e.r.cr>now; S.leap(e,diag(e.aim,R2?-1:1),R2?2:1,18,null,true); if(e.r.c>=24){ add(e,'haste',1,.1); add(e,'resist',1,.1); } }},
   n2:{name:'활수',cd:7,ai:(e,d)=>d<=5,can:e=>inFight(e),need:'전투 중',cast(e){ e.r.hw=now+4; const m=e.r.c>=32?2:1; for(let i=1;i<=4;i++) after(i,()=>heal(e,2*m)); }},
   aw:{name:'폭류 폭쇄',cd:45,can:()=>false,need:'콤보 47에서 기본 공격',ai:()=>false,cast(){}},
   ult:{name:'시대의 흐름',cd:0,r:5,can:e=>e.r.c===46,need:'콤보 정확히 46',cast(e){ e.r.c=0; e.r.ut=now+9; add(e,'silence',9,0,{self:true}); add(e,'haste',9,.2); add(e,'resist',9,.2); }}
  },note:'기본 공격 피해가 콤보 수치다(콤보 0이면 피해 없음). 유수는 웅크리기 단추를 누른 뒤 1초 안에 쓰면 오른쪽 대각선으로 2칸 간다. 폭류 폭쇄는 단추가 아니라 콤보 47에서 기본 공격이 맞으면 나간다.'},
ur:{name:'돌아온 번개, 우르',cls:'전사',grade:'전설',range:2.3,
  init:e=>{e.r={nb:0,ch:0,st:0,sn:0,fin:false}}, hud:e=>'축전 타격 '+e.r.ch+'/36'+(e.r.st>now?' · 우레 '+e.r.sn+'/9':'')+(e.r.fin?' · 일격 준비':''),
  onCast(e,s){ add(e,'haste',1,.2); },
  onBasic(e,hit){ if(hit.length&&e.r.st>now&&!e.r.fin&&++e.r.sn>=9){ e.r.fin=true; proc(e,'우레 폭풍','다음 기본 공격 강화'); } },
  basicBonus(e,t){ if(e.r.nb>now){ e.r.nb=0; air(t,1); add(t,'slow',1,.1,{by:e}); e.cd.n2=Math.max(0,e.cd.n2-2); }
    if(e.r.fin){ e.r.fin=false; e.r.sn=0; e.r.st=0; damage(e,t,30,'우레 폭풍'); if(t.dead) return; add(t,'silence',1,0,{by:e}); add(t,'stun',1,0,{by:e}); for(let i=0;i<6;i++) after(.1+i*.1,()=>{ if(!e.dead&&!t.dead){ strike(e,t,40/6,'우레 폭풍 (벼락)'); if(i===5) near(e,t); } }); } },
  skills:{
   n1:{name:'벽력',cd:3,r:4,cast(e){ S.leap(e,moveDir(e),1,18,null,true); e.r.nb=now+1.5; }},
   n2:{name:'축전',cd:15,r:3.2,cast(e){ for(let i=1;i<=6;i++) after(i*.5,()=>{ if(!e.dead) e.r.ch+=S.circle(e,3,6,'축전',{v:'bolt'}).length; }); }},
   aw:{name:'우레 폭풍',cd:45,ai:(e,d)=>d>2&&d<=9,cast(e){ S.leap(e,moveDir(e),8,26); add(e,'haste',5,.2); e.r.st=now+5; e.r.sn=0; e.r.fin=false; }},
   ult:{name:'섬전의 벼락',cd:0,r:13,can:e=>e.r.ch>=36,need:'축전 타격 36회',cast(e){ S.focus(e,1); after(1,()=>{ if(e.dead) return; const p0={x:e.x,y:e.y}; add(e,'resist',.6,.5); S.leap(e,e.aim,14,30,()=>S.seg(e,p0,{x:e.x,y:e.y},4,40,'섬전의 벼락',{stun:1,v:'beam'}),true); }); }}
  },note:'우레 폭풍은 5초 안에 기본 공격을 9번 맞히면 열 번째 기본 공격이 강화된다. 뒤따르는 40 피해는 6타로 나눠 들어간다.'},
leus:{name:'판테온의 벽, 레우스',cls:'수호자',grade:'전설',range:2.4,
  init:e=>{e.r={acc:0,nb:0,gd:0,pae:0,sh:0}}, hud:e=>'빛의 방패 명중 '+e.r.sh+'/7'+(e.r.gd>now?' · 방어':'')+(e.r.pae>now?' · 패용':''),
  light(e){ if(heal(e,(e.max-e.hp)*.03)>0) proc(e,'광휘','잃은 체력 3%'); },
  rush(e){ e.r.gd=0; e.st=e.st.filter(s=>!s.gd); S.leap(e,e.aim,4,24,()=>{ if(S.circle(e,1.8,40,'빛의 방패',{stun:1,v:'burst'}).length) e.r.sh++; },true); },
  spear(e){ e.r.pae=0; e.st=e.st.filter(s=>!s.pae); S.line(e,5,48,'성소의 수호자',{v:'thrust'}); for(let i=0;i<5;i++) after(i*.15,()=>{ if(!e.dead) CH.leus.light(e); }); },
  tick(e,dt){ e.r.acc+=dt; if(e.r.acc>=6){ e.r.acc-=6; CH.leus.light(e); } if(e.r.gd&&e.r.gd<=now) CH.leus.rush(e); if(e.r.pae&&e.r.pae<=now) CH.leus.spear(e); },
  basicBonus(e,t){ if(e.r.nb>now){ e.r.nb=0; add(t,'stun',.5,0,{by:e}); } },
  skills:{
   crouch:{name:'해제',cd:.3,can:e=>e.r.gd>now||e.r.pae>now,need:'방어·패용 중',ai:(e,d)=>d<=4.5,cast(e){ if(e.r.pae>now) CH.leus.spear(e); else CH.leus.rush(e); }},
   n1:{name:'무력',cd:8,r:3.5,cast(e){ e.r.nb=now+2; }},
   n2:{name:'빛의 방패',cd:16,r:6,cast(e){ e.r.gd=now+3; add(e,'resist',3,.5,{gd:true}); add(e,'slow',3,.8,{self:true,gd:true}); }},
   aw:{name:'시련의 벽',cd:45,ai:e=>e.hp<e.max*.6&&hurtNow(e),cast(e){ add(e,'invuln',4); after(4,()=>{ if(!e.dead){ e.cd.n1=0; e.cd.n2=0; } }); }},
   ult:{name:'성소의 수호자',cd:0,r:6,can:e=>e.r.sh>=7,need:'빛의 방패 명중 7회',cast(e){ e.r.pae=now+5; add(e,'resist',5,.33,{pae:true}); add(e,'slow',5,.5,{self:true,pae:true}); }}
  },note:'방어·패용은 웅크리기 단추로 미리 풀 수 있고, 시간이 다 돼도 돌진(창 찌르기)이 나간다.'},
helga:{name:'부족의 대전사, 헬가',cls:'수호자',grade:'전설',range:2.3,
  init:e=>{e.r={rg:0,acc:0}}, hud:e=>'분노 '+Math.floor(e.r.rg)+'/100',
  tick(e,dt){ e.r.rg=Math.max(0,Math.min(100,e.r.rg+(inFight(e)?5:-5)*dt)); if(e.r.rg>=100){ e.r.acc+=dt; if(e.r.acc>=1){ e.r.acc-=1; heal(e,2,true); } } },
  modTake:(e,src,amt)=>e.r.rg>=100&&src!==e?amt*.9:amt,
  take(e){ if(e.r.rg>=50){ e.r.rg-=50; return true; } return false; },
  skills:{
   n1:{name:'투사',cd:8,r:3.2,cast(e){ if(CH.helga.take(e)) S.circle(e,4,16,'투사 (분노)',{knock:1.5,v:'spin',post:t=>add(t,'weak',2,1,{by:e})}); else S.arc(e,3,10,'투사',{knock:.7}); }},
   n2:{name:'맹위',cd:14,ai:(e,d)=>d>2&&d<=7,cast(e){ const E=CH.helga.take(e); S.leap(e,moveDir(e),4,22,()=>{ for(let i=0;i<(E?3:2);i++) after(i*.15,()=>{ if(!e.dead) S.circle(e,E?4:3,9,E?'맹위 (분노)':'맹위',{v:'spin',post:t=>{ if(E){ rm(t,'vuln'); add(t,'vuln',3,[.1,.15,.2][i],{by:e}); } }}); }); },true); }},
   aw:{name:'적색 분노',cd:30,r:5,cast(e){ e.r.rg=100; for(let i=1;i<=5;i++) after(i,()=>heal(e,6)); add(e,'haste',5,.2); S.circle(e,5,0,'적색 분노',{v:'shout',post:t=>add(t,'weak',3,1,{by:e})}); }},
   ult:{name:'분노의 일격',cd:0,r:6,can:e=>e.r.rg>=100,need:'분노 100',cast(e){ e.r.rg=0; S.focus(e,.5); after(.5,()=>{ if(e.dead) return; const t=tgt(e,7); hop(e,6); if(t) S.leap(e,norm(t.x-e.x,t.y-e.y),Math.max(0,dist(e,t)-.8),14,null,true); after(airtime(6),()=>{ if(!e.dead) S.circle(e,1.5,60,'분노의 일격',{zfree:true,v:'quake',pre:t2=>{ if(has(t2,'weak')) add(t2,'stun',2,0,{by:e}); },post:t2=>add(t2,'weak',5,1,{by:e})}); }); }); }}
  },note:'적색 분노의 기동력 증가는 5초로 잡았다(카드에 없음). 분노의 일격은 7칸 안의 적 위로 뛰어올라 내리찍는다(범위 1.5칸).'},
blossom:{name:'시대의 용사, 블로섬',cls:'수호자',grade:'전설',range:2.6,
  init:e=>{e.r={hy:0,zn:null,aw:false,mu:0,acd:0}}, hud:e=>(CH.blossom.hy(e)?'향화 · ':'')+(CH.blossom.gd(e)?'화원 · ':'')+(e.r.mu>now?'무화':'앵화'),
  gd:e=>{ const z=e.r.zn; return !!z&&z.until>now&&Math.hypot(e.x-z.x,e.y-z.y)<=z.r; },
  hy:e=>e.r.hy>now||CH.blossom.gd(e),
  aeng(e){ const G2=CH.blossom.gd(e),n=G2?4:2; e.swingT=now; swingSnd(e); for(let i=0;i<n;i++) after(i*.14,()=>{ if(e.dead) return; const h=S.circle(e,4,8,'앵화',{v:'spin',el:'dream'}).length; if(h) heal(e,2.5*(G2?2:1)*h,true); }); },
  tick(e,dt){ if(e.r.acd>0) e.r.acd-=dt; },
  speedMod:e=>CH.blossom.gd(e)?1.2:1,
  modTake(e,src,amt){ if(src===e) return amt; if(e.r.mu>now&&Math.random()<.5){ say(e,'무효','#ff9fd6'); return 0; } return CH.blossom.hy(e)?amt*.8:amt; },
  altBasic(e){ if(!CH.blossom.hy(e)||e.r.mu>now) return false; if(e.cd.b>0) return true; e.cd.b=1; CH.blossom.aeng(e); return true; },
  skills:{
   crouch:{name:'앵화 (무화)',cd:1,can:e=>e.r.mu>now,need:'무화 중',ai:(e,d)=>d<=4.5,cast(e){ CH.blossom.aeng(e); }},
   n1:{name:'향화',cd:12,r:5,can:e=>e.r.mu<=now,need:'무화 아님',cast(e){ e.r.hy=now+4; }},
   n2:{name:'반향',cd:14,ai:(e,d)=>d>2.5&&d<=7.5,can:e=>e.r.mu<=now,need:'무화 아님',cast(e){ const p0=S.blink(e,e.aimMan>now?e.aim:moveDir(e),7); S.seg(e,p0,{x:e.x,y:e.y},1.4,16,'반향',{slow:[.3,1],v:'dash',el:'dream'}); if(CH.blossom.hy(e)) after(.15,()=>{ if(!e.dead) S.circle(e,3,16,'반향 (충격파)',{v:'bloom',el:'dream'}); }); }},
   aw:{name:'약속의 꽃',kind:'초월',cd:60,r:8,cast(e){ pay(e,e.hp*.5); S.focus(e,3); add(e,'resist',3,.5); after(3,()=>{ if(e.dead) return; e.r.aw=true; e.r.zn=zone(e,{x:e.x,y:e.y,r:10,dur:12,label:'화원',good:true}); }); }},
   ult:{name:'벚꽃의 용사',cd:0,r:99,can:e=>e.r.aw&&e.hp<=90,need:'약속의 꽃 뒤 체력 90 이하',cast(e){ S.focus(e,3); add(e,'invuln',3); after(3,()=>{ if(!e.dead) e.r.mu=now+9; }); }}
  },note:"향화 중에는 기본기 단추가 앵화(1초)다. 무화 9초 동안은 일반 스킬 대신 웅크리기 단추로 앵화를 쓴다. 반향의 '지정한 위치'는 조준(또는 이동) 방향 7칸으로 넣었다."}
});
