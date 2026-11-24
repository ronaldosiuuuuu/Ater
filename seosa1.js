"use strict";
/* 서사급 추가 1: 전사 4 · 수호자 5. 수치는 카드 원문 그대로. */
const DEBUFFS=['slow','root','silence','stun','weak','blind','vuln','sick','scorch','dealdown','disarm','nojump','grab','freeze'];
function cleanse(e){ const n=e.st.length; e.st=e.st.filter(s=>!DEBUFFS.includes(s.k)||s.self); const c=n-e.st.length; if(c>0) say(e,'해제','#7fe3b5'); return c; }
/* 차징: 시간이 다 차거나 웅크리면 풀린다. fn(채운 비율 0~1, 끝까지 채웠는가) */
function charge(e,max,slow,fn){ e.chg={t0:now,max,fn}; if(slow) add(e,'slow',max,slow,{self:true,chg:true}); if(e.c.onCharge) e.c.onCharge(e); }
function release(e){ const c=e.chg; if(!c) return; e.chg=null; e.st=e.st.filter(s=>!s.chg); const f=Math.max(0,Math.min(1,(now-c.t0)/c.max)); c.fn(f,f>=.999); }
const chgTick=e=>{ if(e.chg&&now-e.chg.t0>=e.chg.max) release(e); };
const RELEASE={name:'차징 해제',cd:.2,can:e=>!!e.chg,need:'차징 중',ai:()=>false,cast:release};
const lerp=(a,b,f)=>a+(b-a)*f;

Object.assign(CH,{
roven:{name:'연둣빛 대검, 로벤',cls:'전사',grade:'서사',range:2.4,
  init:e=>{e.r={b:0,n:0,aw:0,wh:0,next:false,cnt:0}}, hud:e=>'백연 '+e.r.b+' · 녹궁 '+e.r.n+' · 동화 '+e.r.cnt+'/10',
  onBasic(e,hit){ if(hit.length) e.r.b=Math.min(10,e.r.b+1); },
  onSkillHit(e){ e.r.n=Math.min(10,e.r.n+3); },
  basicBonus(e,t){ if(e.r.next){ e.r.next=false; damage(e,t,10,'녹세 백검 (추가 피해)'); S.leap(e,e.aim,3,20,null,true); } },
  skills:{
   n1:{name:'연대녹',cd:6,r:4.5,can:e=>e.r.b>=3,need:'백연 3',cast(e){ e.r.b-=3; S.leap(e,moveDir(e),2,18,()=>S.line(e,4,6,'연대녹',{el:'nature'}),true); after(1.1,()=>{ if(!e.dead) S.circle(e,3,8,'연대녹 (대백검)',{el:'steel'}); }); }},
   n2:{name:'대백신',cd:9,r:6,can:e=>e.r.n>=8,need:'녹궁 8',cast(e){ e.r.n-=8; S.leap(e,moveDir(e),3,20,()=>{ S.line(e,5,12,'대백신',{el:'nature'}); hop(e,3); after(airtime(3),()=>{ if(!e.dead) S.circle(e,4,16,'대백신 (대백검)',{el:'steel',zfree:true}); }); },true); }},
   aw:{name:'녹세 백검',cd:45,r:4,can:e=>e.r.b===5&&e.r.n===5,need:'백연 5 · 녹궁 5',cast(e){ e.r.b=0; e.r.n=0; e.r.aw=now+8; e.r.wh=0;
        for(let i=1;i<=8;i++) after(i,()=>{ if(e.dead) return; if(i&1){ const h=S.circle(e,4,10,'녹세 백검 (대백검)',{el:'steel'}); if(h.length){ if(++e.r.wh>=2){ e.r.wh=0; e.r.next=true; e.r.cnt++; proc(e,'녹세 백검','다음 공격 +10'); } } else e.r.wh=0; } else S.line(e,4,10,'녹세 백검 (대녹검)',{el:'nature'}); }); }},
   ult:{name:'이검동화',cd:0,r:4,can:e=>e.r.cnt>=10,need:'대백검 연속 2회 효과 10번',cast(e){ add(e,'slow',2,.6,{self:true}); add(e,'resist',2,.2); for(let i=0;i<4;i++) after(i*.5,()=>{ if(!e.dead) S.circle(e,4,12,'이검동화',{el:'steel'}); }); }}
  },note:"녹세 백검은 홀수 초에 대백검(원형), 짝수 초에 대녹검(직선)을 휘두른다. '연속으로 대백검 2번 타격'은 대백검 차례가 두 번 잇달아 맞은 것으로 읽었다."},
baron:{name:'두드리는 창, 바론',cls:'전사',grade:'서사',range:2.6,
  init:e=>{e.r={ek:0,step:0,cnt:0,awN:0,duel:null,dt:0}}, hud:e=>(e.r.ek>now?'연격창 · ':'')+'연격 '+e.r.cnt+'/24'+(e.r.awN?' · 돌파 '+e.r.awN:''),
  onCast(e,s){ if(s!=='crouch') e.r.ek=now+1; },
  altBasic(e){ if(e.r.ek<=now) return false; if(e.cd.b>0) return true; e.cd.b=CFG.atkInt; e.swingT=now; swingSnd(e); e.r.cnt++; const up=(e.r.step++&1)===0;
    if(up) S.line(e,4,18,'연격창 (올려치기)',{basic:true,air:1}); else S.line(e,4,24,'연격창 (내려치기)',{basic:true,zfree:true,post:t=>down(t)}); proc(e,'연격창',up?'올려치기':'내려치기'); return true; },
  skills:{
   n1:{name:'창섬',cd:8,r:5,cast(e){ S.line(e,5,12,'창섬',{post:t=>{ e.r.duel=t; e.r.dt=now+3; say(t,'결투','#f0b458'); }}); }},
   n2:{name:'차륜',cd:12,r:4,cast(e){ S.circle(e,4,18,'차륜',{post:t=>{ if(e.r.duel===t&&e.r.dt>now) near(e,t); }}); }},
   aw:{name:'일점 돌파',cd:30,ai:(e,d)=>d>3&&d<=9,cast(e){ e.r.awN++; S.focus(e,.5); after(.5,()=>{ if(e.dead) return; const p0=S.blink(e,e.aim,9); S.seg(e,p0,{x:e.x,y:e.y},1.4,45,'일점 돌파',{zfree:true,post:t=>down(t)}); }); }},
   ult:{name:'난전 격파',cd:0,r:7,can:e=>e.r.cnt>=24&&e.r.awN===0,need:'연격창 24회 · 일점 돌파 0회',cast(e){ S.focus(e,1); after(1,()=>{ if(e.dead) return; const hit=S.line(e,7,26,'난전 격파'); after(.3,()=>{ if(e.dead) return; fx.push({k:'circle',x:e.x,y:e.y,r:5,t0:now,team:e.team,lab:'차륜',src:e}); hit.forEach(t=>{ if(!t.dead) strike(e,t,24,'난전 격파 (회전)',{knock:2,air:2}); }); }); }); }}
  },note:'연격창은 스킬을 쓴 뒤 1초 동안 기본기 단추가 올려치기(18)·내려치기(24)로 바뀐다.'},
licros:{name:'투쟁의 광인, 리크로스',cls:'전사',grade:'서사',range:2.2,
  init:e=>{e.r={pa:0,rage:0,gs:0,gsR:false,dance:0,dEnd:0,big:0,ut:0,ub:30,lust:0}}, hud:e=>(e.r.rage>now?'격노 · ':'')+'격살 '+e.r.gs+' · 40 넘김 '+e.r.big+'/10',
  tick(e){ if(e.r.pa&&e.r.pa<=now){ e.r.pa=0; add(e,'haste',2,.2); } if(e.r.rage&&e.r.rage<=now){ e.r.rage=0; if(e.r.gs>0) e.r.gsR=true; } if(e.r.dance&&e.r.dance<=now){ e.r.dance=0; e.r.dEnd=now+3; } },
  modTake:(e,src,amt,label,o)=>(e.r.rage>now&&o&&o.basic)?amt-2:amt,
  onKill(e){ e.r.lust=now+4; const t=foes(e).filter(x=>dist(e,x)<=5).sort((a,b)=>a.hp-b.hp)[0]; if(t) knock(t,e,-2); },
  basicBonus(e,t){ let x=0,fin=false; if(e.r.pa>now){ x+=10; e.r.pa=0; add(e,'haste',2,.2); }
    if(e.r.rage>now) e.r.gs=Math.min(16,e.r.gs+4); else if(e.r.gsR){ x+=e.r.gs; e.r.gs=0; e.r.gsR=false; }
    if(e.r.dance>now){ x+=6; hop(e,.5); S.leap(e,e.aim,1,14,null,true); } else if(e.r.dEnd>now){ x+=18; e.r.dEnd=0; fin=true; }
    if(e.r.ut>now&&has(t,'silence')){ x+=e.r.ub; e.r.ub=Math.max(0,e.r.ub-6); }
    if(e.r.lust>now) heal(e,8); if(x>0) damage(e,t,x,'투쟁 (추가 피해)'); if(e.atk+x>40){ e.r.big++; proc(e,'투쟁','40 넘김 '+e.r.big); } if(fin&&e.atk+x>60&&!t.dead) air(t,10); },
  skills:{
   n1:{name:'파쇄',cd:8,r:3.5,cast(e){ e.r.pa=now+3; }},
   n2:{name:'격노',cd:12,r:3.5,cast(e){ e.r.rage=now+3; e.r.gs=0; e.r.gsR=false; }},
   aw:{name:'광란의 춤',cd:30,r:3.5,cast(e){ e.r.dance=now+4; }},
   ult:{name:'투쟁격화',cd:0,r:5,can:e=>e.r.big>=10,need:'기본 공격 40 넘김 10회',cast(e){ S.circle(e,5,0,'투쟁격화',{silence:4,v:'shout'}); e.r.ut=now+4; e.r.ub=30; }}
  },note:'기본 공격 피해 = 공격력 20 + 그 한 번에 붙은 추가 피해의 합으로 셌다. 투쟁심(처치 뒤 끌어당김·회복)은 5판 3선승에서만 쓰인다.'},
euclein:{name:'파도검, 유클라인',cls:'전사',grade:'서사',range:2.4,
  init:e=>{e.r={h:0}}, hud:e=>'격랑에게 피격 '+e.r.h+'/40',
  tick(e){ const t=foes(e).filter(x=>dist(e,x)<=10).sort((a,b)=>dist(e,a)-dist(e,b))[0]; if(t){ rm(t,'surge'); add(t,'surge',.4,0,{by:e}); } },
  sg:(e,t)=>{ const s=has(t,'surge'); return !!s&&s.by===e; },
  modTake(e,src,amt){ return src!==e&&!CH.euclein.sg(e,src)?amt*.8:amt; },
  onHurt(e,src){ if(CH.euclein.sg(e,src)) e.r.h++; },
  skills:{
   n1:{name:'파검',cd:8,r:4,cast(e){ const p={x:e.x,y:e.y,z:0}; S.circle(e,4,8,'파검',{v:'spin'}); after(1,()=>{ if(!e.dead) S.circle(e,4,12,'파검 (파도)',{v:'geyser',post:t=>{ if(CH.euclein.sg(e,t)) add(t,'weak',2,1,{by:e}); }},p); }); }},
   n2:{name:'숙명',cd:16,ai:(e,d)=>d>2.5&&d<=7.5,cast(e){ const p0={x:e.x,y:e.y}; S.leap(e,moveDir(e),7,24,()=>{ const p1={x:e.x,y:e.y}; S.seg(e,p0,p1,1.4,14,'숙명',{v:'dash'}); after(1,()=>{ if(!e.dead) S.seg(e,p0,p1,1.8,16,'숙명 (파도)',{v:'beam',post:t=>{ if(CH.euclein.sg(e,t)){ e.cd.n1=0; proc(e,'격랑','파검 초기화'); } }}); }); },true); }},
   aw:{name:'용솟음',cd:30,r:5,cast(e){ hop(e,4); S.circle(e,5,18,'용솟음',{v:'geyser',post:t=>{ if(!CH.euclein.sg(e,t)) knock(t,e,4); }}); after(1,()=>{ if(!e.dead) S.line(e,5,22,'용솟음 (내려베기)',{zfree:true,post:t=>{ if(CH.euclein.sg(e,t)) shield(e,20,2); }}); }); }},
   ult:{name:'파도가 부서지는 곳',cd:0,r:7,can:e=>e.r.h>=40,need:'격랑에게 피격 40회',cast(e){ S.focus(e,3); add(e,'resist',3,.5); for(let i=1;i<=6;i++) after(i*.5,()=>{ if(!e.dead) S.circle(e,7,10,'파도가 부서지는 곳',{v:'vortex',pull:1}); }); }}
  },note:'1대1이라 10칸 안의 상대가 늘 격랑이다. 10칸 밖에서 맞으면 받는 피해가 20% 준다.'},
aktion:{name:'부족의 울타리, 악티온',cls:'수호자',grade:'서사',range:2.3,
  init:e=>{e.r={jt:-9,cc:0,us:0,half:false}}, hud:e=>(e.chg?'차징 · ':'')+'CC 적중 '+e.r.cc+'/24',
  tick(e){ chgTick(e); if(e.r.us){ if(now>=e.r.us) e.r.us=0; else if(!e.sh.length){ e.r.us=0; e.r.half=true; proc(e,'울타리의 뜻','다음 피해 절반'); } } },
  modTake(e,src,amt){ if(src===e) return amt; if(e.r.half){ e.r.half=false; amt*=.5; } if(!inFight(e)){ proc(e,'대처','피해 75% 감소'); add(e,'resist',1,.2); return amt*.25; } return amt; },
  skills:{
   crouch:RELEASE,
   n1:{name:'강타',cd:8,r:3,cast(e){ if(now-e.r.jt<=1){ e.z=0; e.vz=0; e.dash=null; S.circle(e,3,24,'강타 (추락)',{stun:.75,v:'quake',post:()=>e.r.cc++}); } else S.line(e,3,12,'강타'); }},
   n2:{name:'널뛰기',cd:12,ai:(e,d)=>d>3&&d<=8,cast(e){ shield(e,20,4); e.r.jt=now+6/22; hop(e,1.5); S.leap(e,moveDir(e),6,22,()=>{ e.r.jt=now; },true); }},
   aw:{name:'지면 강타',cd:45,r:8,cast(e){ charge(e,3,.8,f=>{ S.line(e,lerp(3,9,f),lerp(20,50,f),'지면 강타',{stun:lerp(.5,1.5,f),air:lerp(1,3,f),v:'windcut',el:'earth',post:()=>e.r.cc++}); }); }},
   ult:{name:'울타리의 뜻',cd:0,r:6,can:e=>e.r.cc>=24,need:'CC기 적중 24회',cast(e){ S.focus(e,1.5); after(1.5,()=>{ if(e.dead) return; shield(e,100,3); e.r.us=now+3; }); }}
  },note:'차징은 웅크리기 단추로 미리 풀 수 있다. 널뛰기 도중과 착지 뒤 1초 안에 강타를 누르면 추락 강타가 된다.'},
hamel:{name:'마의 대척점, 하멜',cls:'수호자',grade:'서사',range:2.4,
  init:e=>{e.r={pcd:0,cl:0}}, hud:e=>'정화 해제 '+e.r.cl+'/12 · 마법저항 '+(e.r.pcd>0?e.r.pcd.toFixed(0)+'s':'준비'),
  tick(e,dt){ if(e.r.pcd>0) e.r.pcd-=dt; },
  onHurt(e,src,amt,label,o){ if(o&&o.skill&&e.r.pcd<=0){ e.r.pcd=12; proc(e,'마법저항','보호막 20'); shield(e,20,2); } },
  skills:{
   n1:{name:'정화',cd:9,ai:(e,d)=>e.st.some(s=>DEBUFFS.includes(s.k)&&!s.self)||(d>3&&d<=6),cast(e){ S.leap(e,moveDir(e),3,20); after(.5,()=>{ if(!e.dead&&cleanse(e)) e.r.cl++; }); }},
   n2:{name:'봉마',cd:14,r:4,cast(e){ if(e.sh.length) heal(e,24); else shield(e,24,3); S.circle(e,4,0,'봉마',{v:'hex',post:t=>add(t,'weak',3,1,{by:e})}); }},
   aw:{name:'마력 봉인',cd:45,r:6,cast(e){ const born=now; zone(e,{x:e.x,y:e.y,r:6,dur:8,label:'금지',onCast:(z,who)=>{ if(now-born<.05) return; damage(e,who,16,'마력 봉인',{fixed:true}); for(const k in who.cd) if(k!=='b'&&k!=='crouch') who.cd[k]+=1; say(who,'금지','#d7a6ff'); }}); }},
   ult:{name:'마의 배척',cd:0,ai:e=>e.st.some(s=>DEBUFFS.includes(s.k)&&!s.self),can:e=>e.r.cl>=12,need:'정화로 해제 12회',cast(e){ for(let i=1;i<=8;i++) after(i,()=>{ if(!e.dead) cleanse(e); }); }}
  },note:"봉마의 쇠약 범위는 카드에 없어 4칸으로 잡았다. '금지' 안에서는 하멜 자신도 스킬을 쓰면 16 피해를 받는다(카드의 '플레이어')."},
dantalion:{name:'불굴의 강철, 단탈리온',cls:'수호자',grade:'서사',range:2.6,
  init:e=>{e.r={ft:0,pcd:0,wt:0,wn:0,aw:0,army:0,shN:0,brk:0}}, hud:e=>'보호막 파괴 '+e.r.brk+'/20'+(e.r.army>now?' · 철군':''),
  tick(e,dt){ if(e.r.pcd>0) e.r.pcd-=dt; e.r.ft=inFight(e)?e.r.ft+dt:0;
    if(e.r.ft>=15&&e.r.pcd<=0){ e.r.pcd=30; e.r.ft=0; proc(e,'불굴','끌어당김 · 보호막 24'); fx.push({k:'circle',x:e.x,y:e.y,r:5,t0:now,team:e.team,lab:'불굴',src:e,v:'vortex'}); foes(e).forEach(t=>{ if(dist(e,t)<=5+R) near(t,e,1.1); }); shield(e,24,3); }
    if(e.r.aw&&(now>=e.r.aw||!e.sh.length)){ e.r.aw=0; e.r.army=now+5; proc(e,'결전 철위','철군 5초'); let n=0; zone(e,{x:e.x,y:e.y,r:4,dur:5,every:.25,chase:e,speed:99,label:'철군',tick:(z,inn)=>{ n++; inn.forEach(t=>{ add(t,'slow',.35,.2,{by:e}); if(n%4===0) add(t,'stun',.2,0,{by:e}); }); }}); }
    e.r.shN=e.sh.length; },
  onHurt(e){ const n=e.sh.length; if(n<e.r.shN) e.r.brk+=e.r.shN-n; e.r.shN=n; if(e.r.wt>now&&e.r.wn<3){ e.r.wn++; shield(e,6,1); e.r.shN=e.sh.length; } },
  skills:{
   n1:{name:'격철',cd:8,r:4,cast(e){ S.line(e,4,14,'격철',{root:.5}); }},
   n2:{name:'철벽',cd:14,r:4,cast(e){ add(e,'resist',3,.1); e.r.wt=now+3; e.r.wn=0; }},
   aw:{name:'결전 철위',cd:30,r:4.5,cast(e){ shield(e,30,5); e.r.shN=e.sh.length; e.r.aw=now+5; }},
   ult:{name:'불훼의 격창',cd:0,r:4,can:e=>e.r.brk>=20,need:'보호막 파괴 20회',cast(e){ S.focus(e,1); shield(e,40,5); e.r.shN=e.sh.length; after(1,()=>{ if(!e.dead) S.circle(e,4,35,'불훼의 격창',{pull:1,v:'blade'}); }); }}
  },note:'불훼의 격창 보호막의 지속은 카드에 없어 5초로 잡았다. 보호막이 피해로 깨질 때만 파괴로 센다(시간이 다 돼 사라진 것은 세지 않는다).'},
verderin:{name:'악마의 광신도, 베르데린',cls:'수호자',grade:'서사',range:4,
  init:e=>{e.r={am:0,lost:0,hit:0,on:false,acc:0,hacc:0,tam:0,th:0,used:0,perm:false}}, hud:e=>'혈탄 '+e.r.am+(e.r.on?' · 혈사':'')+' · 소모 '+e.r.used+'/888',
  gain(e,amt){ e.r.lost+=amt; while(e.r.lost>=5){ e.r.lost-=5; e.r.am=Math.min(100,e.r.am+5); } },
  tam:e=>e.r.perm||e.r.tam>now,
  onHurt(e,src,amt){ CH.verderin.gain(e,amt); },
  speedMod:e=>(e.r.on&&!CH.verderin.tam(e))?.7:1, modTake:(e,src,amt)=>e.r.on?amt*.75:amt,
  altBasic:e=>e.r.on,
  tick(e,dt){ if(e.r.tam&&e.r.tam<=now&&!e.r.perm){ e.r.tam=0; heal(e,e.r.th/2); e.r.th=0; }
    if(!e.r.on) return; e.r.hacc+=dt; if(e.r.hacc>=4){ e.r.hacc-=4; heal(e,2,true); } e.r.acc+=dt; if(e.r.acc<1) return; e.r.acc-=1; const T=CH.verderin.tam(e),n=T?8:4;
    if(e.r.am<n){ if(T){ if(e.free<=now){ e.hp=Math.max(1,e.hp-10); say(e,'-10','#c98a8a'); CH.verderin.gain(e,10); } e.r.am+=10; } else { e.r.on=false; e.cd.n1=6; say(e,'혈탄 부족','#c98a8a'); return; } }
    e.r.am-=n; e.r.used+=n; e.shotT=now; shotSnd(e); const hit=S.line(e,5,n,'혈사',{v:'tracer'}); if(hit.length){ e.r.hit+=n; if(T) e.r.th+=n; while(e.r.hit>=24){ e.r.hit-=24; proc(e,'광신','체력 +8'); heal(e,8); } } },
  skills:{
   n1:{name:'혈사',cd:.5,ai:(e,d)=>e.r.on?(d>7&&!e.r.perm):(d<=5.5&&e.r.am>=12),cast(e){ if(e.r.on){ if(e.r.perm) return; e.r.on=false; e.cd.n1=6; } else { e.r.on=true; e.r.acc=.6; e.r.hacc=0; } }},
   n2:{name:'혈전',cd:8,ai:(e,d)=>d>4&&d<=9,cast(e){ pay(e,10); CH.verderin.gain(e,10); S.leap(e,moveDir(e),4,22); shield(e,20,2); }},
   aw:{name:'피의 탐식',cd:45,ai:(e,d)=>e.r.on&&d<=5.5,cast(e){ e.r.tam=now+6; e.r.th=0; }},
   ult:{name:'식탐의 제물',cd:0,r:99,can:e=>e.r.used>=888,need:'혈탄 소모 888발',cast(e){ heal(e,444); e.r.am=100; e.r.perm=true; e.r.on=true; add(e,'dealdown',99999,.88,{self:true}); }}
  },note:'혈사는 한 번 누르면 켜지고 다시 누르면 꺼지며, 꺼질 때부터 6초를 센다. 1초마다 혈탄 4발(탐식 중 8발)을 한 번에 쏘아 발당 1 피해. 혈탄 0발로 시작한다.'},
gardnant:{name:'고된 감내자, 가드넌트',cls:'수호자',grade:'서사',range:2.4,
  init:e=>{e.r={pcd:0,inst:false,bt:0,sk:false,ut:0,cd:0}}, hud:e=>(e.chg?'차징 '+Math.round(Math.min(1,(now-e.chg.t0)/e.chg.max)*100)+'% · ':'')+(e.r.inst?'즉시 차징 · ':'')+'차징 중 피해 '+Math.floor(e.r.cd)+'/200',
  tick(e,dt){ if(e.r.pcd>0) e.r.pcd-=dt; chgTick(e); },
  onCharge(e){ e.r.elig=false; if(e.r.pcd<=0){ e.r.pcd=16; e.r.elig=true; add(e,'resist',4,.15); proc(e,'감내','저항 15%'); } },
  go(e,max,slow,normal,fn){ const done=(f,full)=>{ if(full&&e.r.elig&&!e.r.inst){ e.r.inst=true; proc(e,'감내','다음 일반 스킬 즉시 최대'); } e.r.elig=false; fn(f,full); }; if(normal&&e.r.inst){ e.r.inst=false; fn(1,true); } else charge(e,max,slow,done); },
  modTake(e,src,amt,label,o){ if(src===e) return amt; if(e.r.bt>now&&o&&o.basic) amt-=4; if(e.r.sk&&o&&o.skill){ e.r.sk=false; amt-=15; } if(e.r.ut>now) amt*=.67; return amt; },
  onHurt(e,src,amt){ if(e.chg) e.r.cd+=amt; },
  skills:{
   crouch:RELEASE,
   n1:{name:'무퇴',cd:8,r:4,cast(e){ CH.gardnant.go(e,2,.6,true,(f,full)=>{ S.line(e,lerp(3,5,f),lerp(8,18,f),'무퇴',{air:2}); if(full) e.r.bt=now+3; }); }},
   n2:{name:'인력',cd:12,r:5,cast(e){ CH.gardnant.go(e,3,.6,true,(f,full)=>{ const r=lerp(2,5,f); fx.push({k:'circle',x:e.x,y:e.y,r,t0:now,team:e.team,lab:'인력',src:e,v:'vortex'}); foes(e).forEach(t=>{ if(dist(e,t)<=r+R) near(t,e,1.1); }); shield(e,lerp(12,24,f),2); if(full) e.r.sk=true; }); }},
   aw:{name:'역동의 검',cd:30,r:6,cast(e){ S.focus(e,2); CH.gardnant.go(e,2,0,false,(f,full)=>{ S.line(e,lerp(5,7,f),lerp(12,30,f),'역동의 검',{pull:lerp(1,3,f),air:2,v:'windcut'}); if(full) add(e,'resist',3,.2); }); }},
   ult:{name:'피형참극',cd:0,r:6,can:e=>e.r.cd>=200,need:'차징 중 받은 피해 200',cast(e){ e.r.ut=now+10; CH.gardnant.go(e,10,.4,false,(f,full)=>{ e.r.ut=0; S.arc(e,lerp(1,6,f),lerp(10,40,f),'피형참극',{post:t=>{ if(full) add(t,'dealdown',5,.1,{by:e}); }}); }); }}
  },note:'차징은 웅크리기 단추로 미리 풀 수 있다(역동의 검은 정신집중이라 끝까지 간다). 인력의 "다음 스킬 피해 15 감소"는 다음 한 번에만 든다.'}
});
