"use strict";
/* 2024~2025년 카드 무기의 스킬 묶음. 수치는 카드 그대로이고, 카드에 없어 정한 것은 각 묶음의 note에 적었다.
   · e.r에 두는 값은 모두 묶음 key로 시작한다(다른 캐릭터에 섞여 들어가므로). 적에게 쌓는 표식도 t.wk_… 이름으로 적 몸에 둔다.
   · 재사용 대기시간이 있는 스킬은 ult 칸에 두지 않는다(ult 칸은 한 판에 한 번뿐이라서). (X) 궁극기만 ult 칸. */
const wkSlot=(e,name)=>{ for(const s in e.c.skills) if(e.c.skills[s].name===name) return s; return null; };
const wkCd=(e,name,fn)=>{ const s=wkSlot(e,name); if(s) e.cd[s]=Math.max(0,fn(e.cd[s]||0)); };
const wkNear=(e,r,ok)=>foes(e).filter(t=>dist(e,t)<=r+R&&(!ok||ok(t))).sort((a,b)=>dist(e,a)-dist(e,b))[0];
const wkAmp=o=>!!(o&&o.amp);
const wkInt=(a,b)=>a+Math.floor(Math.random()*(b-a+1));

/* ── 2024-01-30 [무기스킬 : 방패] ── */
defKit('wk_parry',{name:'방패',kind:'무기',tier:null,atk:0,init(e){ e.r.wk_parry_t=0; },
  modTake(e,src,amt){ if(e.r.wk_parry_t>now&&src!==e&&amt>0){ e.r.wk_parry_t=0; say(e,'방어','#cfd6ff'); const a0=e.aim; if(src&&!src.dead&&(src.x!==e.x||src.y!==e.y)) e.aim=norm(src.x-e.x,src.y-e.y); S.line(e,3,16,'패링',{stun:1,knock:0,v:'punch'}); e.aim=a0; return 0; } return amt; },
  skills:{ n1:{name:'패링',kind:'무기스킬',cd:30,r:3.5,ai:(e,d)=>d<=3.5,cast(e){ add(e,'slow',.5,.9,{self:true}); e.r.wk_parry_t=now+.5; }} },
  note:"'다음으로 받는 피해 1회 방어'는 둔화가 걸린 0.5초 안에 들어온 피해로 읽었다. 방어에 성공하면 때린 쪽을 향해 휘두른다."});

/* ── 2024-01-30 거울 방패 ── */
const wkMirror=(e,force)=>{ if(!force&&e.r.wk_mirror_cd>now) return; e.r.wk_mirror_cd=now+10; const n=S.circle(e,4,6,'반사경',{knock:0,v:'nova'}).length,v=Math.min(24,8*Math.max(1,n)); shield(e,v,2); e.r.wk_mirror_sh+=v; };
defKit('wk_mirror',{name:'거울 방패',kind:'무기',tier:null,atk:0,init(e){ Object.assign(e.r,{wk_mirror_cd:0,wk_mirror_sh:0,wk_mirror_emp:0,wk_mirror_dash:0,wk_mirror_ext:false,wk_mirror_u:0,wk_mirror_ua:0,wk_mirror_in:false}); },
  hud:e=>'반사경 보호막 '+e.r.wk_mirror_sh+'/40',
  onHurt(e,src,amt,l,o){ if(src===e||e.r.wk_mirror_in||wkAmp(o)) return; if(e.r.wk_mirror_dash>now) e.r.wk_mirror_ext=true; if(e.r.wk_mirror_u>now) e.r.wk_mirror_cd=0; e.r.wk_mirror_in=true; try{ wkMirror(e); } finally { e.r.wk_mirror_in=false; } },
  tick(e,dt){ if(e.r.wk_mirror_u>now){ e.r.wk_mirror_ua+=dt; if(e.r.wk_mirror_ua>=1){ e.r.wk_mirror_ua-=1; if(e.sh.length){ e.sh=[]; say(e,'보호막 파괴','#c98a8a'); } } } },
  skills:{
   n1:{name:'유광',kind:'일반',cd:8,r:3.5,cast(e){ const E=e.r.wk_mirror_emp>now; if(E){ e.r.wk_mirror_emp=0; wkCd(e,'유광',c=>c*.5); } const r=3.5+(E?1:0),p={x:e.x,y:e.y},got=new Set(); S.circle(e,r,12,'유광',{pull:1,v:'spin'});
      zone(e,{x:p.x,y:p.y,r:r+.5,dur:2,every:.25,label:'유리 파편',tick:(z,inn)=>inn.forEach(t=>{ if(got.has(t)||Math.hypot(t.x-p.x,t.y-p.y)<r-1) return; got.add(t); damage(e,t,6,'유광 (파편)'); if(E) add(t,'root',1,0,{by:e}); })}); }},
   n2:{name:'영롱',kind:'일반',cd:11,r:5,cast(e){ const E=e.r.wk_mirror_emp>now; if(E){ e.r.wk_mirror_emp=0; wkCd(e,'영롱',c=>c*.5); add(e,'resist',.5,.2,{self:true}); } const p0={x:e.x,y:e.y},dir={x:e.aim.x,y:e.aim.y}; e.r.wk_mirror_ext=false; e.r.wk_mirror_dash=now+4/24+.02;
      const fin=()=>{ e.r.wk_mirror_dash=0; S.seg(e,p0,{x:e.x,y:e.y},1.6,18,'영롱',{knock:2,v:'punch'}); if(E) wkMirror(e,true); };
      S.leap(e,dir,4,24,()=>{ if(e.r.wk_mirror_ext){ e.r.wk_mirror_ext=false; S.leap(e,dir,2,24,fin,true); } else fin(); },true); }},
   aw:{name:'만화경',kind:'각성',cd:30,r:6,cast(e){ e.r.wk_mirror_emp=now+3; proc(e,'만화경','다음 일반 스킬 강화'); }},
   ult:{name:'경화수월',kind:'궁극기',cd:0,r:6,can:e=>e.r.wk_mirror_sh>=40,need:'반사경 보호막 40',cast(e){ add(e,'resist',4,.15,{self:true}); e.r.wk_mirror_u=now+4; e.r.wk_mirror_ua=0; }}
  },note:"반사경 보호막은 맞은 적 한 명 8, 두 명 16, 셋부터 24로 잡았다. 유리 파편은 휘두른 원의 바깥 1칸 띠에 남고 한 적에게 한 번만 닿는다. 영롱의 강화(저항 20%)는 돌진하는 0.5초 동안."});

/* ── 2024-02-07 [무기스킬 : 쌍검] · 2024-01-30 [무기스킬 : 창] ── */
defKit('wk_dual',{name:'쌍검',kind:'무기',tier:null,atk:0,
  skills:{ n1:{name:'쾌도난마',kind:'무기스킬',cd:30,r:6,cast(e){ S.leap(e,e.aim,4,22,()=>{ S.focus(e,.5); after(.5,()=>{ if(e.dead) return; for(let i=0;i<5;i++) after(i*.1,()=>{ if(!e.dead) S.arc(e,3,6,'쾌도난마',{knock:0,v:'cut'}); }); }); }); }} },
  note:'30 피해를 다섯 번에 나눠 6씩 준다.'});
defKit('wk_spear',{name:'창',kind:'무기',tier:null,atk:0,
  skills:{ n1:{name:'란나찰',kind:'무기스킬',cd:30,r:5,cast(e){ S.line(e,5,24,'란나찰',{slow:[.3,.5],v:'stab'}); }} }, note:''});

/* ── 2024-02-07 잔영의 칼날 ── */
const wkPlant=(e,t,n)=>{ if(t.dead) return; t.wk_shadow_n=Math.min(4,(t.wk_shadow_n||0)+n); if(t.wk_shadow_n>=4) add(t,'glow',30); };
defKit('wk_shadow',{name:'잔영의 칼날',kind:'무기',tier:null,atk:0,init(e){ Object.assign(e.r,{wk_shadow_max:0,wk_shadow_mh:0,wk_shadow_c:0,wk_shadow_u:0}); },
  hud:e=>'최대 멸영 '+e.r.wk_shadow_max+'/3'+(e.r.wk_shadow_mh>now?' · 몽환포영 '+e.r.wk_shadow_c:''),
  tick(e){ if(e.r.wk_shadow_c>0&&e.r.wk_shadow_mh<=now){ e.r.wk_shadow_c=0; wkCd(e,'몽환포영',()=>39); } },
  skills:{
   n1:{name:'잔영',kind:'일반',cd:6,r:5,cast(e){ S.line(e,5,10,'잔영',{v:'stab',post:t=>wkPlant(e,t,1)}); }},
   n2:{name:'멸영',kind:'일반',cd:18,r:11,cast(e){ S.proj(e,e.aim,{speed:30,range:12,dmg:16,label:'멸영',v:'wave',o:{knock:2,post:t=>{ const n=t.wk_shadow_n||0; if(n>0){ t.wk_shadow_n=0; rm(t,'glow'); damage(e,t,t.max*.01*n,'영검'); if(n>=4){ e.r.wk_shadow_max++; wkCd(e,'잔영',()=>0); after(0,()=>wkCd(e,'멸영',()=>0)); add(e,'haste',2,.2); proc(e,'영검','일반 스킬 초기화'); } }
        if(e.r.wk_shadow_u>now&&!t.dead){ damage(e,t,t.max*.04,'영검난무'); add(t,'root',1,0,{by:e}); } }}}); }},
   aw:{name:'몽환포영',kind:'각성',cd:45,r:8,ai:(e,d)=>e.r.wk_shadow_c>0?d<=9:d<=8,cast(e){ if(!(e.r.wk_shadow_c>0&&e.r.wk_shadow_mh>now)){ e.r.wk_shadow_mh=now+6; e.r.wk_shadow_c=4; wkCd(e,'몽환포영',()=>.4); proc(e,'몽환포영','돌진 4회'); return; }
      const last=e.r.wk_shadow_c===1,d=last?8:4,p0={x:e.x,y:e.y}; e.r.wk_shadow_c--; wkCd(e,'몽환포영',()=>last?45-(6-Math.max(0,e.r.wk_shadow_mh-now)):.4); if(last) e.r.wk_shadow_mh=0;
      S.leap(e,e.aim,d,30,()=>S.seg(e,p0,{x:e.x,y:e.y},1.4,last?24:12,'몽환포영',{knock:0,v:'cut',post:t=>wkPlant(e,t,last?4:1)}),true); }},
   ult:{name:'영검난무',kind:'궁극기',cd:0,r:10,can:e=>e.r.wk_shadow_max>=3,need:'최대 피해 멸영 3회',cast(e){ e.r.wk_shadow_u=now+5; S.proj(e,e.aim,{speed:34,range:12,dmg:0,label:'영검난무',v:'wave',o:{root:1,knock:0}}); after(.35,()=>{ if(!e.dead) S.arc(e,5,36,'영검난무',{knock:0,v:'cut',post:t=>wkPlant(e,t,4)}); }); }}
  },note:"'웅크릴 시 돌진'은 몽환포영 단추를 다시 누르는 것으로 바꿨다(6초 안에 네 번, 마지막은 8칸·24 피해). 멸영의 사거리 12칸·밀치기 2칸, 영검난무 검기의 사거리 12칸은 카드에 없어 정했다. '발광'은 표시만 한다."});

/* ── 2024-01-30 결전의 창 ── */
const wkDuel=(e,t)=>t.wk_duel_m>now&&t.wk_duel_by===e;
const wkDuelHit=(e,t)=>{ if(wkDuel(e,t)) e.r.wk_duel_h++; };
defKit('wk_duel',{name:'결전의 창',kind:'무기',tier:null,atk:0,init(e){ Object.assign(e.r,{wk_duel_arm:false,wk_duel_alt:0,wk_duel_h:0}); },
  hud:e=>'결전 적중 '+e.r.wk_duel_h+'/12',
  onCast(e,s){ if(s!=='crouch'&&s!=='b') e.r.wk_duel_arm=true; },
  basicBonus(e,t){ if(!e.r.wk_duel_arm||t.dead) return; e.r.wk_duel_arm=false; const up=e.r.wk_duel_alt++%2===0; damage(e,t,up?9:12,'결전',{amp:true}); if(up) air(t,1); else down(t); if(wkDuel(e,t)) wkCd(e,'격동',c=>c-2); },
  skills:{
   n1:{name:'격동',kind:'일반',cd:8,r:5.5,cast(e){ S.leap(e,e.aim,2,22,()=>S.line(e,4,14,'격동',{v:'stab',post:t=>{ wkDuelHit(e,t); t.wk_duel_m=now+4; t.wk_duel_by=e; }}),true); }},
   n2:{name:'연격창',kind:'일반',cd:12,r:4,cast(e){ const again=S.circle(e,4,16,'연격창',{knock:1,v:'spin',post:t=>wkDuelHit(e,t)}).find(t=>!t.dead&&wkDuel(e,t)); if(!again) return;
      after(.3,()=>{ if(e.dead||again.dead) return; const d=dist(e,again); S.leap(e,norm(again.x-e.x,again.y-e.y),Math.min(4,Math.max(0,d-1.5)),24,()=>{ S.circle(e,4,16,'연격창',{knock:1,v:'spin',post:t=>wkDuelHit(e,t)}); again.wk_duel_m=0; },true); }); }},
   aw:{name:'일점 돌파',kind:'각성',cd:30,r:9,cast(e){ S.focus(e,.5); after(.5,()=>{ if(e.dead) return; const p0={x:e.x,y:e.y}; S.leap(e,e.aim,9,30,()=>S.seg(e,p0,{x:e.x,y:e.y},1.6,55,'일점 돌파',{knock:0,v:'stab',post:t=>{ wkDuelHit(e,t); down(t); }}),true); }); }},
   ult:{name:'난전 격파',kind:'궁극기',cd:0,r:7,can:e=>e.r.wk_duel_h>=12,need:'결전 중인 적에게 스킬 적중 12회',cast(e){ S.focus(e,1); after(1,()=>{ if(e.dead) return; const hit=S.line(e,7,24,'난전 격파',{stun:1,knock:0,v:'stab'}); after(.4,()=>{ if(e.dead) return; ring(e,5,'난전 격파','spin'); hit.forEach(t=>{ if(!t.dead) strike(e,t,36,'난전 격파',{knock:2,air:2}); }); }); }); }}
  },note:"패시브 '결전'의 추가타는 올려치기(9, 1칸 띄움)와 내려치기(12, 추락)를 번갈아 낸다. 연격창의 밀치기는 1칸, 난전 격파의 밀치기는 2칸으로 잡았다. 궁극기 조건은 '결전' 표식이 있는 적에게 이 무기 스킬이 맞은 횟수로 센다."});

/* ── 석화를 다루는 두 검: 과타노차의 염영검 · 석영의 번제 ── */
function wkStone(K,o){ const F=K+'_f',FB=K+'_fb',S1=K+'_s',G1=K+'_g',P=K+'_p',c1=K+'_c1',c2=K+'_c2',c3=K+'_c3',acc=K+'_a';
  const pet=(e,t)=>{ if(t.dead) return; t[P]=now+1; add(t,'stun',1,0,{by:e}); add(t,'vuln',1,.2,{by:e}); say(t,'석화','#c9b28a'); };
  const unpet=t=>{ t[P]=0; rm(t,'stun'); };
  const stack=(e,t,k,n)=>{ if(t.dead) return; t[k]=Math.min(100,(t[k]||0)+n); if(t[k]>=100){ if(k===S1&&e.r[c1]<=now){ t[k]=0; pet(e,t); e.r[c1]=now+66; } else if(k===G1&&e.r[c3]<=now){ t[k]=0; pet(e,t); if(o.third2) e.r[c2]=0; e.r[c3]=now+66; } } };
  return {pet,unpet,stack,isPet:t=>t[P]>now,
   init(e){ e.r[c1]=0; e.r[c2]=0; e.r[c3]=0; e.r[acc]=0; },
   onDeal(e,t,amt,l,ox){ if(wkAmp(ox)||t.dead||t===e) return; t[F]=now+3; t[FB]=e;
     if(t[P]>now&&e.r[c2]<=now&&(!o.low||e.hp<=e.max*.4)){ unpet(t); const d=o.low?t.hp*.09:(t.max-t.hp)*.09; e.r[c2]=now+66; e.r[c1]=0; if(d>0){ damage(e,t,d,o.n2,{amp:true}); heal(e,d); } proc(e,o.n2,'석화 해제'); } },
   tick(e,dt){ e.r[acc]+=dt; if(e.r[acc]<1) return; e.r[acc]-=1; for(const t of foes(e)){ if(t.dead) continue;
       if(t[F]>now&&t[FB]===e){ damage(e,t,o.fire(t),'화기',{amp:true}); stack(e,t,S1,wkInt(1,3)); }
       if(!t.dead&&dist(e,t)<=6+R){ damage(e,t,1,o.n3,{amp:true}); stack(e,t,G1,wkInt(1,3)); } } }}; }
const wkG=wkStone('wk_guata',{fire:t=>t.hp*.005,n2:'제 2의식 : 멸각의 번제',n3:'제 3의식 : 공포의 추출',third2:true});
defKit('wk_guata',{name:'과타노차의 염영검(炎影劍)',kind:'무기',tier:6,atk:24,init:wkG.init,onDeal:wkG.onDeal,tick:wkG.tick,
  skills:{
   n1:{name:'화산의 숨결',kind:'일반',cd:18,r:6,cast(e){ for(let i=0;i<4;i++) after(i*.12,()=>{ if(!e.dead) S.arc(e,6,5,'화산의 숨결',{half:60,knock:0,v:'flame',el:'fire',post:t=>{ wkG.stack(e,t,'wk_guata_s',5); wkG.stack(e,t,'wk_guata_g',5); }}); }); }},
   aw:{name:'포식의 전염',kind:'각성',cd:45,r:8,can:e=>!!wkNear(e,8,wkG.isPet),need:'석화된 적 (8칸)',cast(e){ const t=wkNear(e,8,wkG.isPet); if(!t) return; const d=dist(e,t);
      S.leap(e,norm(t.x-e.x,t.y-e.y),Math.max(0,d-1),30,()=>{ if(e.dead) return; if(!t.dead){ strike(e,t,25,'포식의 전염',{knock:0}); wkG.unpet(t); } const p={x:t.x,y:t.y};
        zone(e,{x:p.x,y:p.y,r:7,dur:4.05,every:1,label:'전염되는 공포',tick:(z,inn)=>inn.forEach(x=>{ damage(e,x,5,'포식의 전염 (공포)'); wkG.stack(e,x,'wk_guata_s',10); wkG.stack(e,x,'wk_guata_g',10); })}); },true); }}
  },note:"같은 날(2025-08-31) 판이 둘인데 '무기' 채널 판을 옮겼다(화산의 숨결 20 피해를 네 번에 5씩, 맞을 때마다 석편·괴기 5). '석화'는 1초 기절 + 받는 피해 20% 증가로 만들었다. 세 의식의 재사용 대기시간(66초)이 돌고 있으면 석편·괴기는 100에서 멈춘다."});
const wkQ=wkStone('wk_quartz',{fire:()=>1,n2:'활활 타오르는',n3:'산 위의 공포',low:true});
defKit('wk_quartz',{name:'석영의 번제 - 불꽃의 검',kind:'무기',tier:6,atk:22,init:wkQ.init,onDeal:wkQ.onDeal,tick:wkQ.tick,skills:{},
  note:"가장 수치가 높은 판(공격 피해 +22, < 6 / 7 >)이다. 카드에 패시브 셋만 있고 누르는 스킬은 없다. '석화'는 1초 기절 + 받는 피해 20% 증가."});

/* ── 2025-08-31 붉게 물든 피안의 낫 ── */
const wkPian=(t,n)=>{ if(!t.dead) t.wk_pian_n=(t.wk_pian_n||0)+n; };
const wkPianH=t=>t.wk_pian_h>now;
defKit('wk_pian',{name:'붉게 물든 피안의 낫',kind:'무기',tier:5,atk:16,init(e){},
  onDeal(e,t,amt,l,o){ if(wkAmp(o)||t.dead||t===e) return; wkPian(t,1); damage(e,t,t.wk_pian_n*.1,'피안화',{amp:true}); },
  skills:{
   n1:{name:'일그러짐',kind:'기본기',cd:3,r:5,cast(e){ S.circle(e,5,6,'일그러짐',{knock:0,v:'spin',post:t=>{ wkPian(t,2); if(wkPianH(t)) wkCd(e,'일그러짐',c=>c-1); }}); }},
   n2:{name:'흐드러지다',kind:'일반',cd:12,r:7,cast(e){ S.leap(e,e.aim,3,22,()=>S.line(e,5,12,'흐드러지다',{v:'cut',post:t=>{ wkPian(t,4); t.wk_pian_h=now+3; say(t,'흐트러짐','#ff7d8c'); }})); }},
   aw:{name:'강의 너머',kind:'일반',cd:18,r:5,cast(e){ const post=t=>{ wkPian(t,5); if(wkPianH(t)) t.wk_pian_h+=3; }; S.circle(e,5,12,'강의 너머',{stun:.3,knock:0,v:'spin',post}); after(.3,()=>{ if(e.dead) return; S.blink(e,e.aim,6); S.circle(e,6,18,'강의 너머',{stun:.4,knock:0,v:'spin',post}); }); }},
   x1:{name:'만개한 저주',kind:'각성',cd:30,r:8,cast(e){ const t0=wkNear(e,4+7),at=t0&&dist(e,t0)<=4+R?{x:t0.x,y:t0.y}:{x:e.x+e.aim.x*4,y:e.y+e.aim.y*4}; let reset=false;
      for(let i=0;i<5;i++) after(i*.12,()=>{ if(e.dead) return; S.circle(e,7,t=>(t.wk_pian_n||0)*.05,'만개한 저주',{knock:0,zfree:true,v:'nova'},at).forEach(t=>{ if(wkPianH(t)) reset=true; }); });
      after(.75,()=>{ if(e.dead) return; foes(e).forEach(t=>{ if(!t.dead&&Math.hypot(t.x-at.x,t.y-at.y)<=7+R&&t.hp<(t.wk_pian_n||0)){ say(t,'처형','#ff7d8c'); damage(e,t,t.hp+t.sh.reduce((a,s)=>a+s.v,0)+1,'만개한 저주 (처형)',{fixed:true}); } }); if(reset) for(const n of ['일그러짐','흐드러지다','강의 너머']) wkCd(e,n,()=>0); }); }}
  },note:"'피안화'는 적마다 따로 쌓이고 상한이 없다. 패시브의 추가 피해는 이 무기를 든 사람의 모든 타격에 붙는다. 경직(0.3·0.4초)은 그만큼의 기절로 넣었다. 만개한 저주는 4칸 안의 가장 가까운 적 자리(없으면 4칸 앞)에 핀다."});

/* ── 2025-09-01 선택받지 못한 자의 창 ── */
const wkRoll=(e,a,b)=>{ if(e.r.wk_arten_st===1&&e.r.wk_arten_u>now) return b; if(e.r.wk_arten_st===2&&e.r.wk_arten_u>now) return a; const v=wkInt(a,b); if(e.r.wk_arten_roll===0) e.r.wk_arten_roll=v===a?-1:v===b?1:2; return v; };
const wkArten=e=>{ const r=e.r.wk_arten_roll; e.r.wk_arten_roll=0; if(e.dead||(e.r.wk_arten_st===1&&e.r.wk_arten_u>now)) return;
  if(r===-1){ e.r.wk_arten_bad++; proc(e,'아르텐의 저주','대실패 · 불운 '+e.r.wk_arten_bad); fx.push({k:'circle',x:e.x,y:e.y,r:1.5,t0:now,team:e.team,lab:'대실패',src:e,v:'nova'}); damage(e,e,wkInt(8,16),'아르텐의 저주',{fixed:true}); e.x-=e.aim.x*2; e.y-=e.aim.y*2; clamp(e);
    if(e.r.wk_arten_bad>=7&&!e.dead){ msg([[short(e)+' ','#ff7d8c'],['불운이 일곱 번 겹쳤다','#fff6d6']],e.team,true); damage(e,e,e.hp+e.sh.reduce((a,s)=>a+s.v,0)+1,'아르텐의 저주',{fixed:true}); } }
  else if(r===1){ e.r.wk_arten_good++; proc(e,'아르텐의 저주','대성공 · 행운 '+e.r.wk_arten_good); for(const k in e.cd) if(k!=='b') e.cd[k]=Math.max(0,e.cd[k]-3); if(e.r.wk_arten_good===7) proc(e,'???','행운이 일곱 번 겹쳤다'); } };
defKit('wk_arten',{name:'선택받지 못한 자의 창',kind:'무기',tier:5,atk:16,init(e){ Object.assign(e.r,{wk_arten_good:0,wk_arten_bad:0,wk_arten_roll:0,wk_arten_st:0,wk_arten_u:0}); },
  hud:e=>'행운 '+e.r.wk_arten_good+' · 불운 '+e.r.wk_arten_bad+(e.r.wk_arten_u>now?(e.r.wk_arten_st===1?' · 거짓 용사':' · 여신의 저주'):''),
  skills:{
   n1:{name:'잡아돌리기',kind:'기본기',cd:3,r:5,cast(e){ e.r.wk_arten_roll=0; const v=wkRoll(e,10,18); S.circle(e,5,v,'잡아돌리기',{knock:0,v:'spin'}); wkArten(e); }},
   n2:{name:'짓눌러치기',kind:'일반',cd:13,r:6,cast(e){ e.r.wk_arten_roll=0; const v=wkRoll(e,12,24); S.leap(e,e.aim,3,22,()=>{ S.circle(e,3,v,'짓눌러치기',{v:'quake'},{x:e.x+e.aim.x*2,y:e.y+e.aim.y*2}); wkArten(e); }); }},
   aw:{name:'바늘찌르기',kind:'일반',cd:16,r:5,cast(e){ e.r.wk_arten_roll=0; const L=[]; for(let i=0;i<7;i++) L.push(wkRoll(e,2,5)); L.forEach((v,i)=>after(i*.1,()=>{ if(!e.dead) S.line(e,5,v,'바늘찌르기',{knock:0,v:'stab'}); })); after(.75,()=>wkArten(e)); }},
   x1:{name:'아르테데인 - 강제 시동',kind:'각성',cd:30,r:8,cast(e){ const n=wkInt(1,6),g=e.r.wk_arten_good,b=e.r.wk_arten_bad; if(g===b){ proc(e,'아르테데인','주사위 '+n+' · 아무 일도 없다'); return; } e.r.wk_arten_st=g>b?1:2; e.r.wk_arten_u=now+n; if(b>g) add(e,'slow',n,.5,{self:true}); proc(e,'아르테데인',(g>b?'거짓 용사 ':'여신의 저주 ')+n+'초'); }}
  },note:"'대실패·대성공'은 스킬 한 번에 한 번만 따진다(그 스킬에서 처음 굴린 수가 최저면 대실패, 최고면 대성공). 대실패의 밀려남은 2칸. '거짓 용사'·'여신의 저주'로 수치가 고정된 동안에는 굴린 것이 아니므로 대성공·대실패가 나지 않는다. 행운 7의 '???'는 카드에 내용이 없어 알림만 뜬다. 불운 7은 그 자리에서 쓰러진다. 강제 시동에서 행운과 불운이 같으면 아무 일도 없다."});

/* ── 2025-08-31 힘을 잃은 레비아탄 ── */
const WK_LEVI=['푸른 비','냉혈의 전장','망령된 검'];
defKit('wk_levi',{name:'힘을 잃은 레비아탄',kind:'무기',tier:4,atk:20,init(e){ Object.assign(e.r,{wk_levi_j:0,wk_levi_free:0,wk_levi_b:0,wk_levi_g:0}); },
  hud:e=>'질투 '+e.r.wk_levi_j+'/15'+(e.r.wk_levi_free>0?' · 다음 행동 초기화':''),
  onDeal(e,t,amt,l,o){ if(wkAmp(o)||t===e) return; if(e.r.wk_levi_g>now) heal(e,1,true); if(++e.r.wk_levi_j>=15){ e.r.wk_levi_j=0; e.r.wk_levi_free=now+.0001; proc(e,'질투의 마수','다음 행동 초기화'); } },
  onCast(e,s){ const k=e.c.skills[s]; /* 질투가 찬 바로 그 시전은 건너뛰고, 그다음 이 무기 스킬부터 */ if(e.r.wk_levi_free>0&&e.r.wk_levi_free<now&&k&&WK_LEVI.includes(k.name)){ e.r.wk_levi_free=0; e.cd[s]=0; } },
  skills:{
   n1:{name:'푸른 비',kind:'기본기',cd:3,r:6,cast(e){ if(++e.r.wk_levi_b%3===0) S.circle(e,6,21,'푸른 비 (충격파)',{slow:[.15,1],knock:0,v:'quake',el:'water'}); else S.arc(e,6,14,'푸른 비',{knock:0,v:'cut',el:'water'}); }},
   n2:{name:'냉혈의 전장',kind:'일반',cd:12,r:7,cast(e){ const p0={x:e.x,y:e.y}; S.leap(e,e.aim,7,26,()=>{ const p1={x:e.x,y:e.y}; S.seg(e,p0,p1,1.8,10,'냉혈의 전장',{knock:0,v:'stab',el:'ice',pre:t=>{ t.wk_levi_sl=!!has(t,'slow'); },post:t=>{ if(t.wk_levi_sl) add(t,'root',.5,0,{by:e}); else add(t,'slow',1,.3,{by:e}); }}); S.seg(e,p0,p1,1.8,10,'냉혈의 전장',{knock:0,v:'stab',el:'ice'}); },true); }},
   aw:{name:'망령된 검',kind:'영웅',cd:24,r:9,cast(e){ e.r.wk_levi_g=now+12; const cnt=new Map(); zone(e,{x:e.x,y:e.y,r:10,dur:12.05,every:1,chase:e,speed:99,label:'구천',tick:(z,inn)=>inn.forEach(t=>{ damage(e,t,3,'망령된 검'); const n=(cnt.get(t)||0)+1; cnt.set(t,n); if(n%2===0) add(t,'slow',1,.15,{by:e}); })}); }}
  },note:"'레비아탄의 다음 행동'은 이 무기의 스킬로 읽었다(질투 15가 차면 다음에 쓰는 이 무기 스킬의 대기시간이 바로 0이 된다). 냉혈의 전장은 20 피해를 두 번에 10씩 준다. 구천은 시전자를 따라다닌다. 앞선 형태인 '부러진 레비아탄'(공격 피해 +18)은 같은 무기의 옛 판이라 따로 만들지 않았다."});

/* ── 2025-09-01 봉인된 겨울의 마검 - 윈터러 ── */
defKit('wk_winter',{name:'봉인된 겨울의 마검 - 윈터러',kind:'무기',tier:5,atk:24,init(e){},
  modTake:(e,src,amt)=>src!==e&&e.hp<=e.max*.3?amt*.8:amt,
  skills:{
   n1:{name:'서리 칼날',kind:'기본기',cd:3,r:5,cast(e){ if(e.hp<=e.max*.3) wkCd(e,'서리 칼날',c=>c-.5); let rooted=false; S.arc(e,5,12,'서리 칼날',{knock:0,v:'cut',el:'ice',pre:t=>{ if(has(t,'root')) rooted=true; },slow:[.15,1]}); if(rooted) after(.5,()=>{ if(!e.dead) S.arc(e,6,18,'서리 칼날 (서리 참격)',{knock:0,v:'cut',el:'ice'}); }); }},
   n2:{name:'눈사태',kind:'일반',cd:12,r:5,cast(e){ const p={x:e.x,y:e.y}; S.circle(e,5,14,'눈사태',{slow:[.3,1],knock:0,v:'spin',el:'ice'}); after(1,()=>{ if(e.dead) return; S.circle(e,5,18,'눈사태',{knock:0,v:'nova',el:'ice',pre:t=>{ t.wk_winter_sl=!!has(t,'slow'); },post:t=>{ if(t.wk_winter_sl){ rm(t,'slow'); add(t,'root',.5,0,{by:e}); } }},p); }); }},
   aw:{name:'눈꽃 서리',kind:'각성',cd:36,r:8,cast(e){ ring(e,8,'눈꽃 서리','nova','ice'); foes(e).forEach(t=>{ if(!t.dead&&dist(e,t)<=8+R) add(t,'root',3,0,{by:e}); }); }}
  },note:"< 5 / 8 > 판(봉인된 상태)이다. '겨울의 심장'의 대기시간 감소는 체력 30% 이하에서 서리 칼날을 쓸 때마다 0.5초 줄이는 것으로 넣었다."});

/* ── 2025-08-29 갈라진 하늘의 섬광 ── */
defKit('wk_flash',{name:'갈라진 하늘의 섬광',kind:'무기',tier:1,grade:'고화',atk:15,
  skills:{ n1:{name:'섬광',kind:'일반',cd:18,r:6.5,cast(e){ const dir={x:e.aim.x,y:e.aim.y}; S.leap(e,{x:-dir.x,y:-dir.y},1,16,()=>after(.2,()=>{ if(e.dead||!canAct(e)) return; const p0={x:e.x,y:e.y}; S.leap(e,dir,7,40,()=>S.seg(e,p0,{x:e.x,y:e.y},1,15,'섬광',{blind:1,knock:0,v:'cut',el:'holy'}),true); })); }} },
  note:"카드의 보상 줄에 '#빛 #고화'라고 적혀 있어 등급을 고화로 뒀다(단계는 < 1 / 2 >). '1초 안에 좌클릭 시 돌진'은 뒤로 뛴 뒤 0.2초 만에 저절로 돌진하게 했다. 두 번째 스킬 칸은 카드에서 잠겨 있어 없다."});

/* ── 2025-08-30 철혈검 - 제국(帝國) ── */
const WK_IRON=['철혈검','검명 - 僞','제국의 피'];
defKit('wk_iron',{name:'철혈검 - 제국(帝國)',kind:'무기',tier:null,atk:24,init(e){ Object.assign(e.r,{wk_iron_sim:0,wk_iron_h:-9,wk_iron_cd:0,wk_iron_re:0}); },
  hud:e=>'심검 '+e.r.wk_iron_sim+'/5',
  onHurt(e,src){ if(src!==e) e.r.wk_iron_h=now; },
  onDeal(e,t,amt,l,o){ const nm=WK_IRON.find(n=>String(l).startsWith(n)); if(wkAmp(o)||t===e||!nm) return; if(now-e.r.wk_iron_h<=.25&&e.r.wk_iron_cd<=now){ e.r.wk_iron_cd=now+8; e.r.wk_iron_sim=Math.min(5,e.r.wk_iron_sim+1); wkCd(e,nm,c=>c*.5); proc(e,'간파 - 僞','심검 '+e.r.wk_iron_sim); } },
  skills:{
   n1:{name:'철혈검',kind:'기본기',cd:3,r:4,cast(e){ if(e.r.wk_iron_re>now){ e.r.wk_iron_re=0; S.circle(e,4,10,'철혈검',{knock:0,v:'spin'}); after(.25,()=>{ if(!e.dead) S.line(e,4,12,'철혈검',{knock:0,v:'cut'}); }); } else { e.r.wk_iron_re=now+6; S.arc(e,4,8,'철혈검',{knock:0,v:'cut'}); } }},
   n2:{name:'검명 - 僞',kind:'일반',cd:14,r:6,cast(e){ const p0=S.blink(e,e.aim,6); S.seg(e,p0,{x:e.x,y:e.y},1.4,24,'검명 - 僞',{knock:0,v:'cut'}); }},
   aw:{name:'제국의 피',kind:'각성',cd:45,r:7,cast(e){ const n=e.r.wk_iron_sim; e.r.wk_iron_sim=0; S.focus(e,.5); after(.5,()=>{ if(e.dead) return; S.leap(e,e.aim,3,24,()=>{ const hit=S.arc(e,5,30,'제국의 피',{silence:1,knock:0,v:'cut'}); if(n>0) after(1,()=>{ if(e.dead) return; hit.forEach(t=>{ for(let i=0;i<n;i++) if(!t.dead) damage(e,t,5,'제국의 피 (심검)'); }); }); },true); }); }}
  },note:"카드에 단계 표기가 없다. 기본기 '철혈검'의 재시전은 첫 휘두르기 뒤 6초 안에 다시 쓰는 것으로 잡았다. '간파'는 맞은 지 0.25초 안에 이 무기 스킬로 때렸을 때만 선다(8초마다 한 번)."});

/* ── 2025-08-31 엑스칼리버 ── */
const wkOpen=e=>e.r.wk_excal_o>now;
defKit('wk_excal',{name:'엑스칼리버',kind:'무기',tier:5,atk:24,init(e){ Object.assign(e.r,{wk_excal_o:0,wk_excal_hurt:0,wk_excal_hit:0,wk_excal_f:0,wk_excal_a:0,wk_excal_in:false}); },
  hud:e=>wkOpen(e)?'성검 개방 '+Math.ceil(e.r.wk_excal_o-now)+'s':'',
  speedMod:e=>wkOpen(e)?1.2:1,
  tick(e,dt){ if(!wkOpen(e)) return; e.r.wk_excal_a+=dt; if(e.r.wk_excal_a>=1){ e.r.wk_excal_a-=1; heal(e,3,true); } },
  onHurt(e,src,amt,l,o){ if(src===e||wkAmp(o)) return; if(++e.r.wk_excal_hurt%3===0) shield(e,8,1); if(e.r.wk_excal_f>now&&src&&!src.dead) damage(e,src,3,'광염',{amp:true}); },
  onDeal(e,t,amt,l,o){ if(wkAmp(o)||t===e||!wkOpen(e)||e.r.wk_excal_in) return; if(++e.r.wk_excal_hit%3===0){ e.r.wk_excal_in=true; try{ fx.push({k:'circle',x:e.x,y:e.y,r:6,t0:now,team:e.team,lab:'성휘',src:e,v:'nova',el:'holy'}); foes(e).forEach(x=>{ if(!x.dead&&dist(e,x)<=6+R) damage(e,x,10,'성휘',{amp:true}); }); } finally { e.r.wk_excal_in=false; } } },
  onKill(e){ if(!wkOpen(e)) return; const v=(e.max-e.hp)*.3/8; for(let i=1;i<=8;i++) after(i,()=>{ if(!e.dead) heal(e,v,true); }); },
  skills:{
   n1:{name:'십자검',kind:'기본기',cd:3,r:5,cast(e){ if(wkOpen(e)) S.arc(e,6,20,'십자검',{knock:0,v:'cut',el:'holy'}); else for(let i=0;i<2;i++) after(i*.15,()=>{ if(!e.dead) S.arc(e,5,7,'십자검',{knock:0,v:'cut'}); }); }},
   n2:{name:'광염',kind:'일반',cd:9,r:6,ai:(e,d)=>d<=6,cast(e){ if(wkOpen(e)) S.circle(e,6,25,'광염',{knock:2,v:'nova',el:'holy'}); else { add(e,'resist',3,.1,{self:true}); e.r.wk_excal_f=now+3; } }},
   aw:{name:'성검 개방',kind:'초월',cd:60,r:10,cast(e){ e.r.wk_excal_o=now+20; e.r.wk_excal_a=0; proc(e,'성검 개방','20초'); }}
  },note:"< 5+ / 7+ > 판이다. 십자검은 14 피해를 두 번에 7씩 준다. 광염(성검 개방)의 밀치기는 2칸. 신화 스킬 '엑스칼리버'는 카드에서 봉인되어 있어 넣지 않았다. 패시브 '성휘'의 처치 회복은 처치한 순간 잃은 체력의 30%를 8초에 나눠 준다."});

/* ── 2025-09-02 부서진 흉악의 잔재 ── */
defKit('wk_hyung',{name:'부서진 흉악의 잔재',kind:'무기',tier:null,grade:'공설',atk:12,
  skills:{ n1:{name:'흉참',kind:'일반',cd:18,r:7,cast(e){ S.leap(e,e.aim,3,22,()=>S.arc(e,5,20,'흉참',{blind:.5,v:'cut'})); }} }, note:"카드에 '공설급'이라고 적혀 있다."});

/* 카드 원문 */
Object.assign(CARDTEXT,{
 "wk_parry": "[무기스킬 : 방패] '패링' (30s)\n0.5 초간 기동력이 90% 감소하며 다음으로 받는 피해를 1 회 방어한다.\n방어 성공시, 방패를 휘둘러 명중한 적에게 16 피해를 주고 1 초간 기절시킨다.\n#둔화 #무효화 #조건부 #직선 피해_3칸 #CC기 #기절",
 "wk_mirror": "[ 거울 방패 ]\n@방어형\n\n#누구에게나 스스로의 내면 속 비밀이 존재한다.\n#오로지 순수하거나 악의에 삼켜졌을지라도.\n#거울은 자신을 향하고 실수를 되돌아보도록 과거를 비춘다.\n#허나 방패의 주인은 어떤 진실이 기다릴지라도 외면하지 않았다고 한다.\n\n[패시브] '반사경' (10s)\n피격시 주변 적에게 6 피해를 준다.\n이후 2 초간 보호막을 8~24 얻는다.\n#해당 스킬은 타격한 적의 수가 많을수록 보호막 획득량이 증가한다.\n#피격시 #원형 범위 피해_4칸 #보호막\n\n[일반] '유광' (8s)\n방패를 원형으로 휘둘러 12 피해를 주고 약간 당긴다.\n이후 범위 끝에 2 초간 유리 파편이 남아 닿은 적에게 6 피해를 준다.\n#원형 범위 피해_3.5칸 #끌당_1칸\n\n[일반] '영롱' (11s)\n전방으로 돌진해 부딪힌 적에게 18 피해를 주고 밀어낸다.\n돌진 도중 피격시 돌진 거리가 2 칸 증가한다.\n#돌진_4칸 #밀치기_2칸 #피격시 #거리증가\n\n[각성] '만화경' (30s)\n3 초간 다음으로 시전하는 일반 스킬이 강화된다.\n강화된 스킬은 시전시 재사용 대기시간이 50% 감소한다.\n'유광' : 범위 1 칸 증가, 유리 파편 닿은 적 1 초 속박.\n'영롱' : 돌진 도중 저항 20% 증가, 시전 이후 '반사경' 강제 발동.\n#강화형 #재사용_대기시간 #범위증가 #속박 #받피감 #강제발동\n\n[궁극기] '경화수월' (X)\n조건부 = '반사경' 으로 획득한 보호막 40 이상일 시 시전 가능.\n4 초간 저항이 15% 증가한다.\n이때 피격시마다 '반사경' 의 재사용 대기시간을 초기화한다.\n대신, 1 초 마다 자신의 보호막이 강제로 파괴된다.\n#받피감 #피격시마다 #재사용_대기시간 #보호막_파괴",
 "wk_dual": "[무기스킬 : 쌍검] '쾌도난마' (30s)\n전방으로 짧게 도약한 뒤 0.5 초간 정신을 집중한다.\n이후 검을 쉴 틈 없이 휘둘러 전방의 적에게 30 피해를 준다.\n#도약_4칸 #정신집중 #부채꼴 범위 피해_3칸_5타",
 "wk_spear": "[무기스킬 : 창] '란나찰' (30s)\n직선 방향에 기본 창술의 삼원을 담은 창을 휘두른다.\n명중한 적에게 24 피해를 주고 0.5 초간 기동력을 30% 감소시킨다.\n#직선 피해_5칸 #둔화",
 "wk_shadow": "[ 잔영의 칼날 ]\n@공격형\n\n#영검이란, 그림자를 갈라 적을 베는 회피불능의 검격.\n#허나, 이조차 본질을 베어내는 검에는 달하지 못하였다니.\n#감히 질문하건대, 지고의 검격이란 과연 실재하는 것인가?\n#그러해야만 한다. 이 검이 그것을 위한 우리의 증명이 되리라.\n\n[패시브] '영검'\n'영검' 이 네 개 심어진 적은 지속적인 발광 상태가 된다.\n이때, '멸영' 적중 시 모든 일반 스킬의 재사용 대기시간을 초기화한다.\n이후 2 초간 기동력이 20% 증가한다.\n#스택형 #발광 #재사용_대기시간 #버프 #이속\n\n[일반] '잔영' (6s)\n그림자의 검을 내질러 정면의 적에게 10 피해를 준다.\n명중한 적에게 '영검' 을 하나 심어둔다. ( 최대 4 )\n#직선 피해_5칸 #스택형\n\n[일반] '멸영' (18s)\n검풍을 날려 명중한 적에게 16 피해를 주고 밀어낸다.\n이후 적에게 심긴 모든 '영검' 을 터트려 최대 체력의 1~4% 피해를 준다.\n#투사체_1타_1발 #밀치기 #스택소모 #최체비\n\n[각성] '몽환포영' (45s)\n6 초간 '몽환포영' 상태가 되며, 웅크릴 시 돌진한다. ( 최대 4 )\n이때 돌진 방향의 적에게 12 피해를 주며 '영검' 을 심는다.\n마지막 돌진은 거리 및 피해가 2 배가 되며 '영검' 을 최대까지 심는다.\n#키입력 #돌진_4칸 #직선 피해_4칸 #스택형\n\n[궁극기] '영검난무' (X)\n조건부 = 최대 피해 '멸영' 적중 회수 3 회 이상일 시 시전 가능.\n그림자를 가르는 검기를 날려 명중한 적을 1 초간 속박시킨다.\n이후 그림자의 검을 휘둘러 적에게 36 피해를 주고 '영검' 을 최대까지 심는다.\n5 초간 '멸영' 적중 시마다, 최대 체력의 4% 추가 피해를 주고 1 초간 속박시킨다.\n#투사체_1발 #CC기 #속박 #부채꼴 범위 피해_5칸 #스택형 #최체비 #추가피해",
 "wk_duel": "[ 결전의 창 ]\n@공격형\n\n#과거 대륙의 십걸이자 창의 대가, 바론이 사용했던 단창.\n#고작 나무를 깎아만든 자루에 평범한 철을 두들겨 만든 공산품이다.\n#하지만 그 창은 주인과 함께 무기 사용의 정점에까지 다다랐고,\n#단순히 쌓아올림에 함께 한 것만으로 하나의 전설이 되었다.\n\n[패시브] '결전'\n스킬 시전 시, 다음 기본 공격에 이하의 효과를 추가한다.\n1 : 창으로 적을 올려쳐 9 피해를 주고 약간 띄운다.\n2 : 창으로 적을 내리쳐 12 피해를 주고 약간 내린다.\n'결전' 한 적에게 적중시 '격동' 의 재사용 대기시간을 2 초 감소한다.\n#기본 공격_강화 #직선 피해_4.5칸 #에어본 #다운 #재사용_대기시간\n\n[일반] '격동' (8s)\n매우 짧게 전진하며 직선 방향으로 창을 내질러 14 피해를 준다.\n이후 4 초간 해당 적과 '결전' 하게 된다.\n#돌진_2칸 #직선 피해_4칸\n\n[일반] '연격창' (12s)\n창을 한 바퀴 회전시켜 16 피해를 주고 약간 밀어낸다.\n'결전' 하는 적에게 적중시 짧게 전진하며 해당 스킬을 재시전한다.\n이후 해당 적의 '결전' 을 해제한다.\n#원형 범위 피해_4칸 #조건부 #돌진_4칸 #재시전\n\n[각성] '일점 돌파' (30s)\n0.5 초간 정신을 집중한 뒤 창을 쥐고 직선 방향으로 돌격한다.\n이후 경로선상의 모든 적에게 55 피해를 주고 추락시킨다.\n#정신집중 #돌진_9칸 #경로선상 피해_1타 #다운\n\n[궁극기] '난전 격파' (X)\n조건부 = '결전' 하는 적에게 스킬 적중 횟수 12 회 이상일 시 시전 가능.\n1 초간 정신을 집중한 뒤 직선 방향으로 창을 내질러 24 피해를 주고 1 초간 기절시킨다.\n이후 창을 크게 회전시켜 명중했던 적들에게 36 피해를 주고 밀어내며 약간 띄운다.\n#정신집중 #직선 피해_7칸 #CC기 #기절 #원형 범위 피해_5칸 #밀치기 #에어본_2칸",
 "wk_guata": "'과타노차의 염영검(炎影劍)' / 공격 피해 +24 #이계 #외차원 #멸각 #마수-파멸\n≪ 300(600) ≫ < 6 >\n\n#화산의 정점에서 군림하는, 외차원의 마신 그 자체를 담은 검.\n#일곱 의식 중 여섯이 완성되어, 이제는 현실을 침식하는 공포를 내뿜는다.\n\n#칼날을 마주하지 않아도 좋다. 그저 존재하는 것만으로 제물은 굳어갈지니,\n#마지막 의식이 끝나는 날, 세상은 거대한 석상이 되어 포식되리라.\n\n패시브 '제 1의식 : 석화의 조리' (66s)\n적 타격시 해당 적에게 3 초간 '화기' 를 부여한다.\n'화기' 에 의해 적의 '석편' 이 100 이상이 될 시 모든 '석편' 을 제거한다.\n이후 해당 적을 1 초간 '석화' 시키며 해당 스킬의 재사용 대기시간을 적용한다.\n'화기' : 매 초마다 현재 체력의 0.5% 피해를 주고 '석편' 을 1~3 부여한다.\n'석화' : 효과 지속중 모든 행동이 금지되며 받는 모든 피해가 20% 증가한다.\n#스택형 #현체비 #조건부 #스택제거 #CC기 #석화 #받피증\n\n패시브 '제 2의식 : 멸각의 번제' (66s)\n'석화' 상태인 적 타격시 멸각의 불길을 일으켜 '석화' 를 즉시 해제시키며 잃은 체력의 9% 피해를 준다.\n이후 해당 피해만큼 체력을 회복하며 '제 1의식 : 석화의 조리' 의 재사용 대기시간을 초기화한다.\n#잃체비 #회복 #재사용_대기시간\n\n패시브 '제 3의식 : 공포의 추출' (66s)\n매 초마다 주변 적에게 '괴기' 를 1~3 부여하며 1 피해를 준다.\n'괴기' 가 100 이상이 될 시 모든 '괴기' 를 제거하고 해당 적을 1 초간 '석화' 시킨다.\n이후 '제 2의식 : 멸각의 번제' 의 재사용 대기시간을 초기화하며 이 스킬의 재사용 대기시간을 적용한다.\n'석화' : 효과 지속중 모든 행동이 금지되며 받는 모든 피해가 20% 증가한다.\n#스택형 #원형 범위 피해_6칸_1타 #조건부 #스택제거 #재사용_대기시간 #CC기 #석화 #받피증\n\n(Right) 일반 스킬 '화산의 숨결' (18s)\n전방에 석영 불꽃 숨결을 내뿜어 명중한 적에게 20 피해를 준다.\n이후 명중한 모든 적에게 적중시마다 '석편' 및 '괴기' 를 5 부여한다.\n#부채꼴 범위 피해_6칸_4타(120º) #스택부여\n\n(Shift+Left) 각성 스킬 '포식의 전염' (45s)\n'석화' 상태인 적에게 시전할 수 있다.\n대상에게 돌진하며 25 피해를 주고 '석화' 를 즉시 해제시킨다.\n이후 해당 위치에 4 초간 전염되는 공포를 퍼트려 범위 내의 적에게 매 초마다 5 피해를 준다.\n전염되는 공포로 피해를 줄 때마다 '석편' 및 '괴기' 를 10 부여한다.\n#지정형_8칸_1타 #돌진_8칸 #원형 범위 피해_7칸_1타x4 #스택부여",
 "wk_quartz": "'석영의 번제 - 불꽃의 검' / 공격 피해 +22 #이계 #외차원 #멸각 #마수-파멸\n\n#외차원의 마수ㅡ 화산의 마신이자 궁전의 조리사이기도 한 그의 불꽃.\n#살아있는 모든 것을 굳혀 녹여먹으며, 제물의 의식은 마지막 순간까지 또렷하다.\n\n≪ 300(600) ≫ < 6 / 7 >\n\n패시브 '굳은 불꽃' (66s)\n적 타격시 해당 적에게 3 초간 '화기' 를 부여한다.\n'화기' 에 의해 적의 '석편' 이 100 이상이 될 시 모든 '석편' 을 제거한다.\n이후 해당 적을 1 초간 '석화' 시키며 해당 스킬의 재사용 대기시간을 적용한다.\n'화기' : 매 초마다 1 피해를 주고 '석편' 을 1~3 부여한다.\n'석화' : 효과 지속중 모든 행동이 금지되며 받는 모든 피해가 20% 증가한다.\n#스택형 #지속피해 #조건부 #스택제거 #CC기 #석화 #받피증\n\n패시브 '활활 타오르는' (66s)\n체력이 40% 이하일 시, '석화' 상태인 적 타격시 발동한다.\n멸각의 불길을 일으켜 '석화' 를 즉시 해제시키며 현재 체력의 9% 피해를 준다.\n이후 해당 피해만큼 체력을 회복하며 '굳은 불꽃' 의 재사용 대기시간을 초기화한다.\n#조건부 #상태해제 #현체비 #회복 #재사용_대기시간\n\n패시브 '산 위의 공포' (66s)\n매 초마다 주변 적에게 '괴기' 를 1~3 부여하며 1 피해를 준다.\n'괴기' 가 100 이상이 될 시 모든 '괴기' 를 제거한다.\n이후 해당 적을 1 초간 '석화' 시키며 해당 스킬의 재사용 대기시간을 적용한다.\n'석화' : 효과 지속중 모든 행동이 금지되며 받는 모든 피해가 20% 증가한다.\n#스택형 #원형 범위 피해_6칸_1타 #조건부 #스택제거 #CC기 #석화 #받피증",
 "wk_pian": "'붉게 물든 피안의 낫' / 공격 피해 +16\n< 5+ >\n\n패시브 '피안화'\n적 타격시 '피안화' 를 1 쌓고 '피안화' 의 10% 만큼 추가 피해를 준다.\n#스택형 #추가피해\n\n(Left) 기본기 '일그러짐' (3s)\n낫을 사선으로 한 바퀴 휘둘러 명중한 적에게 6 피해를 준다.\n이후 해당 적에게 '피안화' 를 추가로 2 쌓는다.\n'흐트러짐' 상태의 적 타격시마다 해당 스킬의 재사용 대기시간이 1 초 감소한다.\n#원형 범위 피해_5칸_1타 #스택부여 #조건부 #재사용_대기시간\n\n(Right) 일반 스킬 '흐드러지다' (12s)\n전방으로 짧게 도약하며 낫을 세로로 한 바퀴 휘둘러 명중한 적에게 12 피해를 준다.\n이후 '피안화' 를 추가로 4 쌓고 해당 적에게 3 초간 지속되는 '흐트러짐' 상태를 부여한다.\n#도약_3칸 #직선 피해_5칸_1타 #스택부여 #상태부여 #재사용_대기시간\n\n(Shift+Left) 일반 스킬 '강의 너머' (18s)\n낫을 한 바퀴 휘둘러 주변의 적에게 12 피해를 주고 짧게 경직시킨다.\n이후 전방으로 순간이동하며 다시 한 번 낫을 한 바퀴 휘둘러 18 피해를 주고 경직시킨다.\n적중시마다 '피안화' 를 추가로 5 쌓고 '흐트러짐' 상태일 경우 추가로 '흐트러짐' 을 3 초 부여한다.\n#원형 범위 피해_5칸_1타 #경직_0.3초 #순간이동_6칸 #원형 범위 피해_6칸_1타 #경직_0.4초 #스택부여 #상태부여\n\n(Shift+Right) 각성 스킬 '만개한 저주' (30s)\n지면에 낫을 내리쳐 붉은 피안화를 피워내 명중한 적에게 '피안화' 의 5% 피해를 5 번 준다.\n이후 적의 남은 체력이 '피안화' 보다 낮을 시 해당 적을 처형한다.\n적이 '흐트러짐' 상태일 경우 '붉게 물든 피안의 낫' 의 기본기 및 일반 스킬의 재사용 대기시간을 초기화한다.\n#지정형_4칸 #원형 범위 피해_7칸_5타 #스택비례피해 #조건부 #처형 #재사용_대기시간",
 "wk_arten": "'선택받지 못한 자의 창' / 공격 피해 +16\n< 5+ >\n\n#세상에 만연한 마족들의 권세는 사람들의 눈에 보이지 않는다.\n#정체를 숨긴 채 암약하는 마신의 그림자에 잠긴 여신은 침묵하고,\n\n#모든 사악이 서서히 이 땅의 영혼들에게 스며들 때 홀로 일어선 자.\n#선택받지 못한 자가 이미 죽어버린 여신의 무기를 쥐고 세상에 외쳤다.\n\n패시브 '아르텐의 저주'\n확률형으로 결정되는 수치가 최저치 및 최고치일 시 이하의 효과를 시전한다.\n'대실패' : 스킬 시전 후 창이 폭발하며 8~16 피해를 받고 뒤로 밀려나간다. 이후 '불운' 을 1 얻는다.\n'대성공' : 스킬 시전 후 창이 반짝이며 모든 스킬의 재사용 대기시간이 3 초 감소하고 '행운' 을 1 얻는다.\n전투중 '행운' 이 7이 될시 '???', 또한 '불운' 이 7이 될 시 폭발하며 모든 체력을 잃고 사망한다.\n#확률형 #지정형_1타 #밀치기 #재사용_대기시간 #스택형 #잃체비_회복 #원형 범위 기절_10칸 #가속 #보호막 #효과변경 #즉사\n\n(Left) 기본기 '잡아돌리기' (3s)\n좌클릭시 창을 잡고 회전시켜 명중한 적에게 10~18 피해를 준다.\n#키입력 #원형 범위 피해_5칸_1타 #확률형\n\n(Right) 일반 스킬 '짓눌러치기' (13s)\n바라보는 방향으로 짧게 도약한 뒤, 창대를 잡고 내리쳐 12~24 피해를 준다.\n#도약_3칸 #지정형_2칸 #원형 범위 피해_3칸_1타 #확률형\n\n(Shift+Left) 일반 스킬 '바늘찌르기' (16s)\n전방으로 창을 마구 내질러 2~5 피해를 7 번 준다.\n#직선 피해_5칸_7타 #확률형\n\n(Shift+Right) 각성 스킬 '아르테데인 - 강제 시동' (30s)\n주사위를 던져 1~6 까지의 숫자를 뽑아 이하의 효과의 지속시간으로 적용한다.\n이때 '행운' 이 더 높을 시 '거짓 용사', '불운' 이 더 높을 시 '여신의 저주' 를 적용한다.\n'거짓 용사' : '아르텐의 저주' 가 비활성화되며, 모든 스킬의 피해량이 '최대치' 로 고정된다.\n'여신의 저주' : 모든 스킬의 피해량이 '최소치' 로 고정되며, 효과 지속중 50% 둔화한다.\n#확률형 #조건부 #수치변동 #둔화",
 "wk_levi": "'힘을 잃은 레비아탄' / 공격 피해 +20 #마검 #마수\n≪ 100 ≫ < 4 / 6+ >\n\n패시브 '(약화된) 질투의 마수'\n적 타격시마다 '질투' 를 하나 얻는다. ( 최대 15 )\n최대치일 시 모든 '질투' 를 소모하며 '레비아탄' 의 다음 행동의 재사용 대기시간을 초기화한다.\n#스택형 #조건부 #소모성 #재사용_대기시간\n\n(Left) 기본기 '푸른 비' (3s)\n푸른 기운을 검신에 휘감아 전방으로 휘둘러 명중한 적에게 14 피해를 준다.\n세 번째 공격시마다 검을 내리쳐 충격파를 일으키고 21 피해를 주며 1 초간 15% 둔화시킨다.\n#부채꼴 범위 피해_6칸_1타 #조건부 #원형 범위 피해_6칸_1타 #둔화\n\n(Right) 일반 스킬 '냉혈의 전장' (12s)\n전방으로 돌진하며 얼어붙은 창들을 쏟아지게 해 경로선상의 적에게 20 피해를 준다.\n이후 명중한 적을 1 초간 30% 둔화시키며 이미 둔화 상태일 경우 대신 0.5 초간 속박시킨다.\n#돌진_7칸 #경로선상 피해_2타 #둔화 #조건부 #CC기 #속박\n\n(Shift+Left) 영웅 스킬 '망령된 검' (24s)\n저승의 한기를 뿜어내며 12 초간 주위를 '구천' 으로 만든다.\n'구천' 내의 적은 매 초마다 3 피해를 받고 2 회 적중시마다 1 초간 15% 둔화한다.\n'구천' : 효과 지속중 '레비아탄' 으로 적에게 피해를 줄 때마다 체력을 1 회복한다.\n#원형 범위 피해_10칸_1타x12 #조건부 #둔화 #회복",
 "wk_winter": "'봉인된 겨울의 마검 - 윈터러' / 공격 피해 +24\n≪ 210 ≫ < 5 / 8 >\n\n패시브 '겨울의 심장'\n체력이 30% 이하일 시 받는 모든 피해가 20% 감소한다.\n효과 지속 중 '서리 칼날' 의 재사용 대기시간이 0.5 초 감소한다.\n#조건부 #받피감 #재사용_대기시간\n\n기본기 '서리 칼날' (3s)\n검을 휘둘러 전방의 적에게 12 피해를 주고 1 초간 15% 둔화시킨다.\n속박된 적에게 적중할 시 0.5 초후 서리 참격을 일으켜 전방의 적에게 18 피해를 준다.\n#부채꼴 범위 피해_5칸_1타 #둔화 #조건부 #속박 #부채꼴 범위 피해_6칸_1타\n\n일반 스킬 '눈사태' (12s)\n원형으로 가벼이 검을 휘둘러 주변 적에게 14 피해를 주고 1 초간 30% 둔화시킨다.\n1 초뒤 해당 위치에서 눈사태가 퍼져나가며 명중한 적에게 18 피해를 준다.\n눈사태 적중 시 해당 적이 둔화 상태였다면 이를 해제하고 0.5 초간 속박시킨다.\n#원형 범위 피해_5칸_1타 #둔화 #원형 범위 피해_5칸_1타 #조건부 #속박\n\n각성 스킬 '눈꽃 서리' (36s)\n눈꽃을 피우고 서리를 흩날리며 주변 적을 3 초간 속박시킨다.\n#원형 범위_8칸 #CC기 #속박",
 "wk_flash": "'갈라진 하늘의 섬광' / 공격 피해 +15\n< 1 / 2 >\n#하늘은 스스로 무너져내리기를 선택했고, 빛의 아이는 별바다를 질주한다.\n#작디 작은 마당의 주인이 되어 영원토록 신들의 정원을 항해하리라.\n\n(Right) 일반 스킬 '섬광' (18s)\n\n후방으로 매우 짧게 도약하며 1 초 이내에 해당 무기로 좌클릭시 매우 빠르게 돌진한다.\n이때 경로선상의 적에게 15 피해를 주고 1 초간 실명시킨다.\n#도약(뒤)_1칸 #돌진_7칸 #경로선상 피해_1칸_1타 #실명\n\n(Shift+Right) ''\n#가중치 50을 사용해 개방할 수 있다.\n#특수 개방 조건 : 신성, 빛, 기예, 파멸, 멸각...",
 "wk_iron": "'철혈검 - 제국(帝國)' / 공격 피해 +24 #기예 #의지-악의 #살의 #검술-극의 #마검-후천\n\n패시브 '간파 - 僞' (8s)\n\n피격 후 0.25 초 내에 '철혈검' 으로 적 타격시 '심검' 을 하나 쌓는다. ( 최대 5 )\n이후 해당 행동의 재사용 대기시간을 50% 감소시킨다.\n#조건부 #스택형 #재사용_대기시간\n\n(Left) 기본기 '철혈검' (3s)\n\n검을 사선으로 휘둘러 8 피해를 준다.\n재시전 시 검을 원형으로 휘둘러 10 피해를 준 뒤 적을 내려베어 12 피해를 준다.\n#부채꼴 범위 피해_4칸_1타 #원형 범위 피해_4칸_1타 #직선 피해_4칸_1타\n\n(Right) 일반 스킬 '검명 - 僞' (14s)\n\n바라보는 방향으로 순간이동하며 검을 휘둘러 적에게 24 피해를 준다.\n#순간이동_6칸 #경로선상 피해_1타\n\n(Shift+Right) 각성 스킬 '제국의 피' (45s)\n\n'심검' 을 모두 소모하며 0.5 초간 정신을 집중한다.\n짧게 돌진하며 검을 크게 휘둘러 30 피해를 준다.\n이후 명중한 적을 1 초간 침묵시키며 효과 종료시 적을 베어넘겨 5 x '심검' 의 피해를 준다.\n#소모성 #정신집중 #돌진_3칸 #부채꼴 범위 피해_5칸_1타 #CC기 #침묵 #지정형_n타",
 "wk_excal": "'엑스칼리버' / 공격 피해 +24\n≪ 175+ ≫ < 5+ / 7+ >\n\n패시브 '수호'\n3 회 피격시마다, 성검의 빛이 몸을 휘감아 1 초간 8 보호막을 얻는다.\n#피격시 #보호막\n\n패시브 '성휘'\n'성검 개방' 상태 중 효과를 발휘한다.\n3 회 타격시마다 빛을 일으켜 주변 적에게 10 피해를 준다.\n적을 처치할 시, 8 초에 걸쳐 잃은 체력의 30% 를 회복한다.\n#타격시 #원형 범위 피해_6칸_1타 #조건부 #잃체회\n\n(Left) 기본기 '십자검' (3s)\n검을 두 번 휘둘러 전방의 적에게 14 피해를 준다.\n'성검 개방' : 바라보는 방향으로 빛의 참격을 휘둘러 20 피해를 준다.\n#부채꼴 범위 피해_5칸_2타 #부채꼴 범위 피해_6칸_1타\n\n(Right) 일반 스킬 '광염' (9s)\n타오르는 빛을 감아 3 초간 저항이 10% 증가한다.\n효과 지속중, 자신을 공격하는 적에게 3 피해를 준다.\n'성검 개방' : 빛을 불태워 주변 적에게 25 피해를 주고 밀어낸다.\n#받피감 #반사피해 #원형 범위 피해_6칸 #밀치기\n\n(Shift+Shift) 초월 스킬 '성검 개방' (60s)\n성검에 깃들어 있는 미약한 별의 편린을 개방시킨다.\n20 초간 '성검 개방' 상태가 되며 일반 스킬이 변경된다.\n'성검 개방' : 20% 가속 및 매 초마다 체력 3 회복.\n#가속 #회복 #효과변경\n\n(Shift+Right) 신화 스킬 '엑스칼리버' (90s)\n'해당 스킬은 성도 : 흑운, 위업 재현 : 신화 충돌, 혼돈ㆍ이계ㆍ외차원에 의해 봉인되어 있다.'",
 "wk_hyung": "공설급 '부서진 흉악의 잔재' / 공격 피해 +12\n\n(Right) 일반 스킬 '흉참' (18s)\n\n전방으로 짧게 도약하며 무기를 휘둘러 명중한 적에게 20 피해를 주고 0.5 초간 실명시킨다.\n#도약_3칸 #부채꼴 범위 피해_5칸_1타 #실명|"
});
