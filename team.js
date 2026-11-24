"use strict";
/* 다인전에서 아군에게 주는 효과를 카드대로. 1대1에서는 아군이 없으므로 대상이 자신뿐이다. */
const mates=(e,r,p)=>ents.filter(o=>o.team===e.team&&!o.dead&&Math.hypot(o.x-(p||e).x,o.y-(p||e).y)<=r+R);
const weakest=(e,r)=>mates(e,r).sort((a,b)=>a.hp/a.max-b.hp/b.max)[0]||e;
const nearAlly=(e,r)=>allies(e).filter(a=>dist(e,a)<=r+R).sort((a,b)=>dist(e,a)-dist(e,b))[0];
const watch=(x,fn,dur)=>{ (x.ws=x.ws||[]).push({fn,until:now+dur}); };
const ampBuff=(x,rate,dur,tag)=>watch(x,(s,t,amt,label,o)=>{ if(!(o&&o.amp)&&!t.dead) damage(s,t,amt*rate,tag,{amp:true}); },dur);

/* 콘월: 기사 서임 */
{ const C=CH.cornwall; C.init=e=>{e.r={acc:0,kn:null,cnt:0,oath:0,ot:null}}; C.hud=e=>(e.r.kn&&!e.r.kn.dead?'기사: '+short(e.r.kn)+' · 공격 '+e.r.cnt+'/30':'기사 없음');
  C.tick=(e,dt)=>{ e.r.acc+=dt; if(e.r.acc>=6){ e.r.acc-=6; if(heal(e,4)>0) proc(e,'성검','체력 +4'); const k=e.r.kn; if(k&&!k.dead) heal(k,4); } };
  C.skills.crouch={name:'서임',cd:1,can:e=>allies(e).length>0,need:'아군',ai:e=>!e.r.kn||e.r.kn.dead,cast(e){ const a=nearAlly(e,99); if(!a) return; e.r.kn=a; say(a,'기사','#ffe9a0'); proc(e,'성검',short(a)+' 서임');
      if(!a._cw){ a._cw=true; watch(a,(s,t,amt,l,o)=>{ if(e.dead||e.r.kn!==s||(o&&o.amp)) return; e.r.cnt++; if(e.r.oath>now&&e.r.ot===t&&!t.dead) damage(s,t,amt*.1,'맹세',{amp:true}); },1e9); } }};
  C.skills.n1.cast=e=>{ add(e,'resist',3,.1); const k=e.r.kn; if(k&&!k.dead){ add(k,'resist',3,.1); e.r.ot=foes(k)[0]||null; e.r.oath=now+3; if(e.r.ot) say(e.r.ot,'맹세','#ffe9a0'); } };
  C.skills.aw.cast=e=>{ add(e,'invuln',1.5); const k=e.r.kn; if(k&&!k.dead) add(k,'invuln',1.5); };
  C.skills.ult.can=e=>e.r.cnt>=30; C.note='웅크리기 단추로 가장 가까운 아군을 기사로 서임한다. 1대1에서는 서임할 아군이 없어 기사 관련 효과와 궁극기를 쓸 수 없다.';
  const b=BRAIN.cornwall; BRAIN.cornwall=(e,t,d)=>go(e,'crouch')||b(e,t,d); RES.cornwall={u:e=>e.r.cnt/30}; }
/* 에클리아 */
{ const C=CH.eclia;
  C.modTake=(e,src,amt)=>{ if(e.r.ign>0){ e.r.ign--; say(e,'무시','#cfd6ff'); allies(e).forEach(a=>{ if(dist(e,a)<=5+R) heal(a,amt); }); return 0; } return e.r.big?amt*1.25:amt; };
  C.onHurt=(e,src,amt)=>{ e.r.lost+=amt; while(e.r.lost>=e.max*.15){ e.r.lost-=e.max*.15; e.r.proc++; proc(e,'희생',e.r.proc+'회'); allies(e).forEach(a=>{ if(dist(e,a)<=5+R) heal(a,12); }); } if(e.r.gt>now&&e.r.gn<4){ e.r.gn++; heal(e,3); } };
  C.tick=e=>{ if(e.r.big) allies(e).forEach(a=>{ if(dist(e,a)<=4+R){ a.st=a.st.filter(s=>!s.dae); add(a,'resist',.4,.15,{dae:true}); } }); };
  C.skills.n1.cast=e=>{ mates(e,3.5).forEach(a=>shield(a,16,3)); e.r.gt=now+3; e.r.gn=0; };
  C.skills.n2.cast=e=>{ mates(e,4).forEach(a=>{ add(a,'haste',4,.2); if(a!==e){ let n=5; watch(a,(s,t,amt,l,o)=>{ if(n>0&&!(o&&o.amp)&&!t.dead){ n--; damage(s,t,5,'선언',{amp:true}); } },4); } }); };
  C.note='다인전에서는 희생·간언·선언·대의·고리가 주변 아군에게 든다. 순신성탄은 한 번 누르면 대의, 다시 누르면 끝나며 그때부터 30초를 센다.'; }
/* 베가 · 기난 · 자넷 · 발트마 · 플루토 · 로스 */
CH.vega.skills.ult.cast=e=>{ zone(e,{x:e.x,y:e.y,r:5,dur:6,every:1,label:'정령 놀음',good:true,tick:z=>mates(e,5,z).forEach(a=>{ a.st=a.st.filter(s=>!DEBUFFS.includes(s.k)||s.self); heal(a,8); })}); };
CH.ginan.skills.ult.cast=e=>{ shield(e,30,5); zone(e,{x:e.x,y:e.y,r:5,dur:5,every:1,label:'역장',tick:(z,inn)=>{ inn.forEach(t=>{ air(t,1); knock(t,z,1); }); mates(e,5,z).forEach(a=>{ if(a!==e) add(a,'haste',1.1,.2); }); }}); };
{ const C=CH.janet,m0=C.modTake,c0=C.skills.aw.cast; C.modTake=(e,src,amt,l,o)=>{ if(src!==e&&e.r.im>now&&src!==e.r.it){ say(e,'무시','#6fa2ff'); return 0; } return m0(e,src,amt,l,o); };
  C.skills.aw.cast=e=>{ const t=foes(e).find(x=>CH.janet.faced(e,x)); c0(e); e.r.it=t; e.r.im=now+3.3; }; C.note='결투 개시 뒤 3초 동안 그 적이 아닌 적의 공격은 무시한다.'; }
{ const C=CH.valtma; C.onDeal=(e,t)=>{ e.r.hitAny=true; (e.r.cls=e.r.cls||new Set()).add(t.c.cls); };
  /* 카드 그대로: 여섯 직업군 모두에게 한 번 이상 피해 */ C.ALL=['전사','수호자','마법사','암살자','지원가','척후병']; C.need=()=>C.ALL; C.ok=e=>!!e.r.cls&&C.ALL.every(c=>e.r.cls.has(c)); C.hud=e=>(e.r.emp?'강화 준비':'동태 '+e.r.cnt+'/3')+' · 직업군 '+(e.r.cls?C.ALL.filter(c=>e.r.cls.has(c)).length:0)+'/6';
  C.skills.ult.can=e=>C.ok(e)&&!!tgt(e,5); C.skills.ult.need='여섯 직업군 모두에게 피해'; C.note='사냥감 포착은 카드 그대로 여섯 직업군(전사·수호자·마법사·암살자·지원가·척후병) 모두에게 한 번 이상 피해를 줘야 열린다. 그래서 상대 편에 여섯 직업군이 다 있는 판에서만 쓸 수 있다.'; }
/* 카드 그대로: '명부'에 걸린 적 2명 이상 */ CH.pluto.skills.ult.can=e=>foes(e).filter(t=>has(t,'hades')).length>=2; CH.pluto.skills.ult.need="'명부'에 걸린 적 2명";
CH.ross.skills.ult.cast=e=>{ e.r.exec=false; const t=foes(e).filter(x=>dist(e,x)<=10+R).sort((a,b)=>a.hp/a.max-b.hp/b.max)[0]; if(t){ e.r.rival=t; e.r.rivalT=now+12; say(t,'숙적','#f0b458'); } };
/* 포말 · 소니아 · 마가렛 · 네비아 · 웨인 · 멜트 */
CH.fomal.skills.crouch.cast=e=>{ e.r.fish--; const a=weakest(e,6); heal(a,e.r.boost?15:10); add(a,'haste',1,.2); if(a!==e) say(a,'물고기','#4fb6ff'); };
CH.fomal.note='물고기는 6칸 안에서 체력 비율이 가장 낮은 아군(없으면 자신)에게 준다.';
CH.sonia.skills.n1.cast=e=>{ const m=CH.sonia.m(e),c=CH.sonia.cols(e),tg=weakest(e,8),el=['water','dream','nature'][c[0]]; if(tg!==e) S.proj(e,norm(tg.x-e.x,tg.y-e.y),{speed:20,range:Math.max(.5,dist(e,tg)),dmg:0,label:'투척',nohit:true,el});
  after(tg===e?0:dist(e,tg)/20,()=>{ const p={x:tg.x,y:tg.y}; fx.push({k:'circle',x:p.x,y:p.y,r:2,t0:now,team:e.team,lab:'투척',src:e,el}); mates(e,2,p).forEach(a=>{ if(c.includes(0)) add(a,'haste',2,.1*m); if(c.includes(1)) ampBuff(a,.05*m,2,'분홍 시약 (증폭)'); if(c.includes(2)) for(let i=1;i<=2;i++) after(i,()=>heal(a,a.max*.015*m)); }); }); };
CH.sonia.onDeal=undefined; CH.sonia.note='투척은 8칸 안에서 체력 비율이 가장 낮은 아군(없으면 자신)에게 던지고, 떨어진 자리 2칸 안의 아군 모두에게 든다.';
{ const C=CH.margaret; C.hl=(e,m)=>{ const v=5*(m||1)*(e.r.bl>now?2:1); mates(e,5).forEach(a=>{ e.r.healed+=heal(a,v); }); };
  const t0=C.tick; C.tick=(e,dt)=>{ const c=e.r.oc&&!e.r.oc.dead?e.r.oc:e; if(c===e) return t0(e,dt); const x=e.x,y=e.y; e.x=c.x; e.y=c.y; t0(e,dt); e.x=x; e.y=y; };
  const n2=C.skills.n2.cast; C.skills.n2.cast=e=>{ const a=nearAlly(e,5); e.r.oc=a||null; n2(e); }; C.note='번영은 5칸 안의 가장 가까운 아군(없으면 자신) 둘레를 돈다. 화흔의 회복은 5칸 안의 아군 모두에게 든다.'; }
{ const C=CH.nevia; C.take=(e,o,who)=>{ who=who||e; for(const k of o.fx){ if(k==='dmg'){ if(who===e) e.r.plus+=12; else { let n=1; watch(who,(s,t,amt,l,ob)=>{ if(n>0&&ob&&ob.skill&&!ob.amp&&!t.dead){ n--; damage(s,t,12,'소리 구슬 (추가 피해)',{amp:true}); } },15); } } else if(k==='cd'){ for(const s in who.cd) if(s!=='b') who.cd[s]=Math.max(0,who.cd[s]-2); } else heal(who,(who.max-who.hp)*.15); } say(who,'소리 구슬','#6ff2e0'); sfx('heal'); };
  C.tick=e=>{ e.r.orbs=e.r.orbs.filter(o=>{ if(o.until<=now) return false; if(now-o.born<=.3) return true; const w=mates(e,.4,o)[0]; if(w){ C.take(e,o,w); return false; } return true; }); };
  C.skills.n2.cast=e=>{ const a=nearAlly(e,5); if(a){ puff(e.x,e.y,'spirit',8,3); e.x=a.x-a.aim.x*1.1; e.y=a.y-a.aim.y*1.1; clamp(e); } CH.nevia.put(e,'cd'); };
  C.skills.aw.cast=e=>{ S.line(e,9,0,'선율의 길',{disarm:2,v:'whip'}); for(let i=1;i<=5;i++) after(i,()=>{ if(e.dead) return; mates(e,5).forEach(a=>heal(a,6)); if(i===5) CH.nevia.put(e,'heal'); }); };
  C.skills.ult.cast=e=>{ S.focus(e,1); after(1,()=>{ if(e.dead) return; mates(e,5).forEach(a=>add(a,'haste',3,.4)); CH.nevia.orb(e,e.r.prev,2); CH.nevia.orb(e,e.r.prev,3); }); };
  C.note='소리 구슬은 아군 누구나 밟아 효과를 받는다. 격려는 5칸 안의 가장 가까운 아군 곁으로 옮겨 간다(없으면 구슬 효과만).'; }
{ const C=CH.wayne,h0=C.onHurt; C.onHurt=(e,src)=>{ if(!allies(e).length) h0(e,src); };
  const t0=C.tick; C.tick=(e,dt)=>{ t0(e,dt); allies(e).forEach(a=>{ if(a._wy===e) return; a._wy=e; (a.hs=a.hs||[]).push((v,src)=>{ if(!e.dead&&src.team!==e.team&&e.r.pcd<=0&&dist(e,v)<=5+R){ e.r.pcd=12; e.r.dt=now+5; e.r.who=src; proc(e,'추리','5초'); } });
      watch(a,(s,t)=>{ const m=e.r.mark; if(m&&m.t===t) m.v=Math.min(18,m.v+(has(t,'glow')?6:3)); },1e9); }); };
  C.skills.n2.cast=e=>{ for(let i=1;i<=4;i++) after(i,()=>{ if(e.dead) return; fx.push({k:'circle',x:e.x,y:e.y,r:4,t0:now,team:e.team,lab:'심의',src:e,v:'shout'}); foes(e).forEach(t=>{ if(dist(e,t)<=4+R) knock(t,e,.7); }); if(i===4) mates(e,4).forEach(a=>shield(a,12,3)); });
    mates(e,4).forEach(a=>{ const s=a.st.findIndex(x=>x.k==='slow'&&!x.self); if(s>=0){ a.st.splice(s,1); say(a,'해제','#7fe3b5'); } }); };
  C.note="다인전에서 '추리'는 5칸 안의 아군이 맞을 때 켜지고, 탐색의 피해는 아군의 공격으로도 쌓인다. 1대1에서는 자신이 맞을 때 켜진다."; }
{ const C=CH.melt; C.skills.crouch=CROUCH; const i0=C.init; C.init=e=>{ i0(e); e.r.cr=0; };
  C.skills.n2.cast=e=>{ const a=e.r.cr>now&&nearAlly(e,8); if(a){ S.proj(e,norm(a.x-e.x,a.y-e.y),{speed:18,range:Math.max(.5,dist(e,a)),dmg:0,label:'시제품',nohit:true,grav:1,big:true}); after(dist(e,a)/18,()=>{ if(!a.dead) shield(a,18,3); }); } else shield(e,18,3); };
  C.skills.ult.cast=e=>{ e.r.arm=now+9; mates(e,5).forEach(a=>{ shield(a,30,9); add(a,'resist',9,.1); if(a!==e) ampBuff(a,.1,9,'무장 (증폭)'); }); };
  C.note='웅크리기 단추를 누른 뒤 1.2초 안에 시제품을 쓰면 8칸 안의 가장 가까운 아군에게 던진다. 공방의 열기는 5칸 안의 아군 모두를 무장시킨다.'; }
