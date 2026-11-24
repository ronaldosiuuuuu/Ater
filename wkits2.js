"use strict";
/* 2026년 카드 무기의 스킬 묶음. 수치는 카드 그대로이고, 카드에 없어 정한 것은 각 키트의 note에 적었다.
   단추 자리는 카드 순서대로 n1 · n2 · aw · x1 · x2 … 이다. 'ult' 자리는 한 판에 한 번만 눌리는 칸이라 쓰지 않았다(초월·신화 스킬도 재사용 대기시간이 있다).
   키트는 다른 캐릭터에게 스킬로 섞여 들어가므로, 자기 스킬의 대기시간은 이름으로 칸을 찾아 고친다(wk2Cd). */
const wk2Slot=(e,name)=>Object.keys(e.c.skills).find(k=>e.c.skills[k].name===name);
const wk2Cd=(e,name,fn)=>{ const s=wk2Slot(e,name); if(s) e.cd[s]=Math.max(0,fn(e.cd[s]||0)); };
const wk2Near=(e,r)=>foes(e).filter(t=>dist(e,t)<=r+(t.rad||R)).sort((a,b)=>dist(e,a)-dist(e,b))[0];
/* 돌진: d칸을 달린 뒤 지나온 길 위의 적을 친다. end(맞은 적들) */
const wk2Dash=(e,d,spd,w,dmg,label,o,end)=>{ const p0={x:e.x,y:e.y}; S.leap(e,e.aim,d,spd||26,()=>{ if(e.dead) return; const hit=dmg==null?[]:S.seg(e,p0,{x:e.x,y:e.y},w||1.6,dmg,label,o); if(end) end(hit,p0); },true); };
const wk2N=v=>typeof v==='number'&&isFinite(v);

/* ── 여섯 세계의 자리 < 8 > ── */
defKit('wk2_six',{name:'여섯 세계의 자리',kind:'무기',tier:8,atk:28,
  init(e){ e.r.wk2_six_n=0; e.r.wk2_six_acc=0; e.r.wk2_six_road=false; e.r.wk2_six_used=0; e.r.wk2_six_ever=null; },
  hud:e=>'세계의 파편 '+e.r.wk2_six_n+(e.r.wk2_six_road?' · 육도':' · 윤회'),
  tick(e,dt){ e.r.wk2_six_acc+=dt; if(e.r.wk2_six_acc>=4){ e.r.wk2_six_acc-=4; e.r.wk2_six_n=Math.min(6,e.r.wk2_six_n+1); }
    /* 꿈에 사로잡힌 자: 영원으로 만든 상태가 풀리면 이 무기의 대기시간을 모두 되돌린다 */
    const k=e.r.wk2_six_ever; if(k&&!(e.r[k]>now)){ e.r.wk2_six_ever=null; for(const n of CH.wk2_six.names) wk2Cd(e,n,()=>0); proc(e,'꿈에 사로잡힌 자','대기시간 초기화'); } },
  modDeal:(e,t,amt)=>amt*(1+.02*(e.r.wk2_six_n||0)),
  modTake:(e,src,amt)=>src===e?amt:amt*(1-.02*(e.r.wk2_six_n||0)),
  /* 육도 상태에서 좌/우클릭: 파편 하나를 쓰고 희망/절망을 5 얻는다(천변만화의 별이 있을 때) */
  road(e,key){ if(!e.r.wk2_six_road||e.r.wk2_six_n<1) return; e.r.wk2_six_n--; e.r.wk2_six_used++; if(wk2N(e.r[key])) e.r[key]=Math.min(100,e.r[key]+5); },
  names:['여섯 세계의 궤적','여섯 하늘의 바람','여섯 대지의 상흔','여섯 별의 의례','여섯 사람의 기원'],
  skills:{
   n1:{name:'여섯 세계의 궤적',kind:'기본기',cd:1,r:4,cast(e){ CH.wk2_six.road(e,'pk_star_hope'); S.line(e,4,12,'여섯 세계의 궤적',{knock:0,v:'cut'}); }},
   n2:{name:'여섯 하늘의 바람',kind:'일반',cd:8,r:5,cast(e){ CH.wk2_six.road(e,'pk_star_despair'); S.arc(e,5,15,'여섯 하늘의 바람',{knock:2,v:'cut'}); }},
   aw:{name:'여섯 대지의 상흔',kind:'각성',cd:35,r:6,cast(e){ S.line(e,6,28,'여섯 대지의 상흔',{slow:[.4,2],knock:0,v:'quake'}); }},
   x1:{name:'여섯 별의 의례',kind:'초월',cd:65,r:10,ai:(e,d)=>d<=10&&e.hp<e.max*.7,cast(e){ const tot=(e.max-e.hp)*.2; for(let i=1;i<=3;i++) after(i,()=>{ if(!e.dead) heal(e,tot/3); }); fx.push({k:'circle',x:e.x,y:e.y,r:10,t0:now,team:e.team,lab:'여섯 별의 의례',src:e,v:'nova'}); foes(e).forEach(t=>{ if(dist(e,t)<=10+(t.rad||R)) add(t,'slow',5,.5,{by:e}); }); }},
   x2:{name:'여섯 사람의 기원',kind:'신화',cd:180,r:7,cast(e){ S.circle(e,7,60,'여섯 사람의 기원',{stun:1.5,knock:0,v:'quake'}); }},
   x3:{name:'육도 / 윤회',kind:'패시브',cd:.5,r:99,ai:()=>false,cast(e){ if(!e.r.wk2_six_road){ e.r.wk2_six_road=true; e.r.wk2_six_used=0; proc(e,'여섯 세계','육도'); } else { e.r.wk2_six_road=false; const n=e.r.wk2_six_used; e.r.wk2_six_used=0; if(n>0) heal(e,n*5); proc(e,'여섯 세계','윤회 · 체력 '+n*5); } }},
   x4:{name:'꿈에 사로잡힌 자',kind:'기원',cd:1,r:99,can:e=>['pk_star_king','pk_star_goblin','pk_star_shot'].some(k=>e.r[k]>now)&&!e.r.wk2_six_ever,need:'몽환의 왕 / 이매망량의 왕 / 마탄의 사수 상태',cast(e){ const k=['pk_star_king','pk_star_goblin','pk_star_shot'].find(q=>e.r[q]>now); if(!k) return; e.r[k]=Infinity; e.r.wk2_six_ever=k; proc(e,'꿈에 사로잡힌 자','영원'); }}
  },note:"2026년 6월 카드다. 각 스킬의 \"'몽환의 왕/이매망량의 왕/마탄의 사수' 상태일 시 별도의 효과로 변경\"은 카드에 바뀐 효과가 적혀 있지 않아 넣지 못했다. F 키(육도/윤회)는 단추 하나로 놓았다: 육도일 때 궤적(좌)은 희망, 바람(우)은 절망을 5 얻는다(권능 '천변만화의 별'이 없으면 파편만 쓴다). 밀어내는 거리는 2칸으로 정했다. 의례의 회복은 시전할 때 잃은 체력의 20%를 세 번에 나눠 준다."});
CARDTEXT.wk2_six="무기 '여섯 세계의 자리' < 8 > / 무기 피해량 +28\n\n(Passive) '여섯 세계' (-)\n4 초마다 '세계의 파편' 을 1 개 수복한다. (최대 6개)\n수복된 '세계의 파편' 1 개당 주는 모든 피해가 2%, 받는 모든 피해가 2% 감소한다. (최대 12%)\nF 키 입력시 '육도' 상태로 전환하며 좌/우클릭시 '세계의 파편' 을 소모하고 '희망/절망' 을 5 얻는다.\n재입력시 '윤회' 상태로 전환하며 해당 효과로 소모한 '세계의 파편' x 5 만큼 체력을 회복한다.\n\n(Left) 기본기 '여섯 세계의 궤적' (1s)\n대검을 내질러 전방의 적에게 12 피해를 준다.\n#직선 범위 피해_4칸_1타 #조건부 #효과변경\n\n(Right) 일반 스킬 '여섯 하늘의 바람' (8s)\n검은 참격을 날려 전방의 적에게 15 피해를 주고 밀어낸다.\n#부채꼴 범위 피해_5칸_1타\n\n(Shift+Left) 각성 스킬 '여섯 대지의 상흔' (35s)\n대검을 내려치며 균열을 일으켜 전방의 적들에게 28 피해를 주고 2 초간 40% 둔화시킨다.\n#직선 피해_6칸_1타 #둔화\n\n(Shift+Right) 초월 스킬 '여섯 별의 의례' (65s)\n대검을 꽂아 3 초에 걸쳐 잃은 체력의 20%를 회복하며, 5 초간 주변 적의 이동 속도를 50% 감소시킨다.\n#잃체회 #원형 범위 효과_10칸 #둔화\n\n(Shift+Shift) 신화 스킬 '여섯 사람의 기원' (180s)\n대검을 크게 쥐고 지면을 찍어내려 주변 적에게 60 피해를 입히고 1.5 초간 기절시킨다.\n#원형 범위 피해_7칸_1타 #CC기\n\n(Shift+F) 기원 '꿈에 사로잡힌 자' (-)\n조건부 = '몽환의 왕/이매망량의 왕/마탄의 사수' 상태일 시 시전 가능하다.\n현재 유지중인 상태의 지속 시간을 영원으로 한다.\n만약 해당 상태가 해제되었을 시, 해당 무기의 모든 재사용 대기시간을 초기화한다.\n\n각 스킬: '몽환의 왕/이매망량의 왕/마탄의 사수' 상태일 시 별도의 효과로 변경한다.";

/* ── 헛된 것들의 장례 < 8 > ── */
defKit('wk2_funeral',{name:'헛된 것들의 장례',kind:'무기',tier:8,atk:32,
  init(e){ e.r.wk2_funeral_bt=0; e.r.wk2_funeral_ms=0; },
  hud:e=>e.r.wk2_funeral_ms>now?'멸세 '+Math.ceil(e.r.wk2_funeral_ms-now)+'s':'몽묘',
  modTake:(e,src,amt)=>src===e?amt:amt*(e.r.wk2_funeral_bt>now?.8:.9),
  touch(e){ e.r.wk2_funeral_bt=now+1; },
  /* 멸세: 멸세에 걸린 적이 6번 맞을 때마다 1초 무장해제 */
  onDeal(e,t,amt,l,o){ if(o&&o.amp) return; if(t.wk2_funeral_ms>now){ t.wk2_funeral_mh=(t.wk2_funeral_mh||0)+1; if(t.wk2_funeral_mh%6===0) add(t,'disarm',1,0,{by:e}); } },
  skills:{
   n1:{name:'백광의 검',kind:'기본기',cd:1.5,r:5,cast(e){ CH.wk2_funeral.touch(e); S.arc(e,5,18,'백광의 검',{knock:0,v:'cut',post:t=>{ t.wk2_funeral_h=(t.wk2_funeral_h||0)+1; if(t.wk2_funeral_h%4===0){ add(t,'silence',1,0,{by:e}); add(t,'blind',1,0,{by:e}); } }}); }},
   n2:{name:'몽환',kind:'일반',cd:8,r:6,ai:(e,d)=>d>5,cast(e){ CH.wk2_funeral.touch(e); S.blink(e,moveDir(e),5); add(e,'blind',1,0,{self:true}); }},
   aw:{name:'천상 추격섬',kind:'각성',cd:45,r:10,cast(e){ CH.wk2_funeral.touch(e); let i=0; const go=()=>{ if(e.dead||over) return; wk2Dash(e,4,30,1.6,15,'천상 추격섬',{air:1,knock:0,v:'cut'},hit=>{ if(hit.length) wk2Cd(e,'천상 추격섬',v=>v-10*hit.length); if(++i<3) after(.08,go); }); }; go(); }},
   x1:{name:'신비 살육창',kind:'초월',cd:60,r:6,cast(e){ CH.wk2_funeral.touch(e); S.arc(e,6,14,'신비 살육창',{knock:0,v:'cut',post:t=>{ t.wk2_funeral_goat=now+1; say(t,'희생양','#ff7d8c'); }}); after(.4,()=>{ if(e.dead||over) return; S.line(e,8,t=>16+(t.wk2_funeral_goat>now?t.max*.08:0),'신비 살육창',{knock:0,v:'stake'}); }); }},
   x2:{name:'만빙의 갑주',kind:'신화',cd:90,r:7,cast(e){ CH.wk2_funeral.touch(e); add(e,'resist',5,.5); add(e,'haste',5,.2); after(5,()=>{ if(e.dead||over) return; S.circle(e,7,25,'만빙의 갑주',{stun:2,knock:0,v:'nova'}); shield(e,100,5); for(let i=1;i<=5;i++) after(i,()=>{ if(e.dead||over) return; S.circle(e,10,5,'만빙의 갑주',{knock:0,v:'nova',post:t=>add(t,'weak',1,1,{by:e})}); }); }); }},
   x3:{name:'세계를 불사르는 멸겁',kind:'기원',cd:360,r:32,cast(e){ CH.wk2_funeral.touch(e); pay(e,Math.round(e.max*.3)); e.r.wk2_funeral_ms=now+18; SNAME.wk2_ms='멸세'; fx.push({k:'circle',x:e.x,y:e.y,r:32,t0:now,team:e.team,lab:'세계를 불사르는 멸겁',src:e,v:'nova'}); const L=foes(e).filter(t=>dist(e,t)<=32+(t.rad||R)); L.forEach(t=>{ t.wk2_funeral_ms=now+18; t.wk2_funeral_mh=0; add(t,'wk2_ms',18,0,{by:e}); });
      for(let i=1;i<=18;i++) after(i,()=>{ if(e.dead||over) return; L.forEach(t=>{ if(!t.dead&&t.wk2_funeral_ms>now-.01) damage(e,t,t.hp*.05,'멸세',{amp:true}); }); }); }}
  },note:"2026년 6월 카드다. 패시브 '몽묘'의 받는 피해 10% 감소는 기본기·스킬을 쓴 뒤 1초 동안 20%가 된다. 만빙의 갑주가 끝난 뒤 매초 주는 피해의 범위는 10칸으로 읽었다(카드 표기 #원형 범위 피해_10칸). 멸세는 시전 순간 32칸 안에 있던 적에게 18초 걸리고, 멸세 자체의 지속 피해는 '6회 피격'에 세지 않는다. 신비 살육창의 두 번째 찌르기는 0.4초 뒤다."});
CARDTEXT.wk2_funeral="무기 '헛된 것들의 장례' < 8 > / 무기 피해량 +32\n\n(Passive) '몽묘' (-)\n받는 모든 피해가 영구적으로 10% 감소한다.\n기본기/스킬 시전시 1 초간 해당 효과가 2 배로 증가한다.\n\n(Left) 기본기 '백광의 검' (1.5s)\n대검을 거칠게 내질러 전방의 적에게 18 피해를 준다.\n4 회 적중시마다 해당 적은 1 초간 침묵, 실명 상태에 빠진다.\n#부채꼴 범위 피해_5칸_1타\n\n(Right) 일반 스킬 '몽환' (8s)\n바라보는 방향으로 순간이동하고 1 초간 실명한다.\n#순간이동_5칸 #실명\n\n(Shift+Left) 각성 스킬 '천상 추격섬' (45s)\n바라보는 방향으로 빠르게 세 차례 도약한다.\n이때마다 경로상의 적에게 15 피해를 주고 약간 띄운다.\n적중시마다 해당 스킬의 재사용 대기시간이 10s 감소한다.\n#도약_4칸x3 #경로선상 피해_1타x3 #에어본_1칸\n\n(Shift+Right) 초월 스킬 '신비 살육창' (60s)\n검붉은 창이 전방을 휘두르며 적들을 관통한다.\n명중한 적에게 14 피해를 주고 1 초간 '희생양' 으로 만든다.\n이후 검붉은 창을 내질러 명중한 적에게 16 피해를 준다.\n'희생양' 에게는 최대 체력의 8% 만큼 추가 피해를 준다.\n#부채꼴 범위 피해_6칸_1타 #직선 피해_8칸_1타 #조건부 #최체비\n\n(Shift+Shift) 신화 스킬 '만빙의 갑주' (90s)\n5 초간 받는 모든 피해가 50% 감소하며 이동속도가 20% 증가한다.\n효과 종료 시, 주변 적에게 25 피해를 주고 2 초간 기절시킨다.\n이후 5 초간 100 보호막을 얻고 매 초마다 주변 적에게 5 피해를 주며 쇠약시킨다.\n#원형 범위 피해_7칸 #CC기 #보호막 #원형 범위 피해_10칸 #쇠약\n\n(Shift+F) 기원 '세계를 불사르는 멸겁' (360s)\n최대 체력의 30% 를 소모하며 멸겁의 태도로 세계를 불살라 18 초간 '멸세' 를 적용한다.\n적이 '멸세' 에서 6 회 피격될 때마다, 1 초간 무장해제를 적용한다.\n'멸세' : 매 초마다 현재 체력의 5% 만큼 피해를 받는다.\n#소모성 #원형 범위 피해_32칸 #현체비 #지속피해 #무장해제";

/* ── 신수 곤봉 < 4 > ── */
defKit('wk2_club',{name:'신수 곤봉',kind:'무기',tier:4,atk:16,
  init(e){ e.r.wk2_club_emp=false; },
  hud:e=>e.r.wk2_club_emp?'강격 강화':'',
  /* 권능자: 권능 스킬을 쓰면 강격이 돌아오고 다음 강격이 강화된다 */
  onCast(e,slot){ const k=e.c.skills[slot]; if(k&&/권능/.test(k.kind||'')){ e.r.wk2_club_emp=true; wk2Cd(e,'강격',()=>0); } },
  skills:{
   n1:{name:'강격',kind:'기본기',cd:1.5,r:4,cast(e){ if(e.r.wk2_club_emp){ e.r.wk2_club_emp=false; const hit=S.arc(e,4,16,'강격',{knock:0,stun:.3,v:'punch'}); if(hit.length) for(const s in e.c.skills) if(/권능/.test(e.c.skills[s].kind||'')) e.cd[s]=Math.max(0,(e.cd[s]||0)-1); } else S.arc(e,4,8,'강격',{knock:1,v:'punch'}); }},
   n2:{name:'파원격',kind:'일반',cd:12,r:5,cast(e){ S.arc(e,5,20,'파원격',{knock:0,v:'quake',post:t=>{ add(t,'nojump',2,0,{by:e}); add(t,'slow',2,.3,{by:e}); }}); }},
   aw:{name:'포효',kind:'영웅',cd:18,r:5,cast(e){ const hit=S.circle(e,5,24,'포효',{knock:2,v:'shout'}); /* 권능 키트(pkits.js)의 값: 힘의 위업 pk_force_n, 영웅의 비활성 끝 시각 pk_hero_off. 그 권능이 없으면 아무 일도 없다 */ if(typeof e.r.pk_force_n==='number'&&e.r.pk_force_n<5){ e.r.pk_force_n++; proc(e,'포효','위업 '+e.r.pk_force_n); } if(hit&&hit.length&&e.r.pk_hero_off>now) e.r.pk_hero_off=Math.max(now,e.r.pk_hero_off-3); }}
  },note:"2026년 6월 카드다. '神聖' 계통 권능 시전은 종류가 '권능'인 스킬을 쓴 것으로 본다. 강화 강격의 경직은 0.3초 기절로 놓았다. 포효의 '위업 1 쌓기'는 권능 '神聖 - 힘'을 함께 가졌을 때, \"'神聖 - 영웅' 비활성화 시간 3초 감소\"는 '神聖 - 영웅'을 함께 가졌고 포효가 적에게 맞았을 때 듣는다(그 권능이 없으면 아무 일도 없다). 밀치기는 강격 1칸, 포효 2칸으로 정했다."});
CARDTEXT.wk2_club="무기 '신수 곤봉' < 4 > / 무기 피해량 +16\n\n(Passive) '권능자' (-)\n'神聖' 계통 권능 시전 시 '강격' 의 재사용 대기시간이 초기화된다.\n이후 다음으로 시전하는 '강격' 이 강화된다.\n강화 '강격' 적중 시 '神聖' 계통 권능의 재사용 대기시간을 1 초 감소시킨다.\n\n(Left) 기본기 '강격' (1.5s)\n곤봉을 가로로 휘둘러 전방의 적에게 8 피해를 주고 짧게 밀어낸다.\n'강화' : 피해량이 2 배로 증가하며 적을 밀치는 대신 경직시킨다.\n#부채꼴 범위 피해_4칸_1타 #밀치기_약 #경직_약\n\n(Right) 일반 스킬 '파원격' (12s)\n곤봉으로 지면을 내리찍어 전방의 적에게 20 피해를 준다.\n이후 명중한 적에게 2 초간 '불구' 상태를 적용한다.\n'불구' : 지속 중 점프가 불가능하며, 이동속도가 30% 감소한다.\n#부채꼴 범위 피해_5칸_1타 #행동제한 #둔화\n\n(Shift+Left) 영웅 스킬 '포효' (18s)\n거센 포효를 내질러 주변 적에게 24 피해를 주고 밀쳐낸다.\n이후 '위업' 을 1 쌓고 적이 명중했을 시 이하의 효과를 적용한다.\n권능 '神聖 - 영웅' 이 비활성화라면 해당 시간을 3 초 감소시킨다.\n#원형 범위 피해_5칸_1타 #밀치기";

/* ── 급조된 신을 죽이는 것 < 4- > (무기/권능) ── */
defKit('wk2_nail',{name:'급조된 신을 죽이는 것',kind:'무기',tier:4,atk:0,
  init(e){},
  /* 상대가 지닌 '神' 계통 권능의 수: 조합·등반 권능(뱀주인자리의 불사 = 神聖 - 영웅, 정복 = 神聖 - 정복)과 이름에 神이 든 권능 키트 */
  gods(t){ let n=0; const w=t.r&&t.r._w; if(w){ if(w.serpent) n++; if(w.conquest) n++; } if(typeof KITS!=='undefined') for(const k of KITS){ const c=CH[k]; if(!c||c.cls!=='권능'||!/神/.test(c.kname||'')) continue; const nm=Object.values(c.skills).map(s=>s.name); if(t.c.key===k||Object.values(t.c.skills).some(s=>nm.includes(s.name))) n++; } return n; },
  skills:{
   n1:{name:'일신 부정',kind:'권능',cd:60,r:12,cast(e){ S.proj(e,e.aim,{speed:30,range:12,dmg:60,label:'일신 부정',v:'stake',o:{post:t=>{ const n=CH.wk2_nail.gods(t); if(n>0){ SNAME.curse='저주'; add(t,'curse',n*2,0,{by:e}); } }}}); }}
  },note:"2026년 6월 카드다. 무기 피해량이 카드에 없어 0으로 두었다. 검은 못의 사거리(12칸)와 빠르기는 카드에 없어 정했다. 상대의 '神' 계통 권능 수는 조합·등반 권능 가운데 '뱀주인자리의 불사'(神聖 - 영웅)·'정복'(神聖 - 정복)과, 이름에 神이 든 권능 묶음의 스킬을 가졌는지로 센다."});
CARDTEXT.wk2_nail="무기/권능 '급조된 신을 죽이는 것' < 4- >\n\n(Right) 권능 '일신 부정' (60s)\n전방으로 검은 못을 내던져 명중한 적에게 60 피해를 준다.\n해당 적이 '神' 계통의 권능을 보유중이라면, 그 수 x 2 초간 '저주' 한다.\n'저주' : 받는 모든 치유 효과가 동일한 위력의 피해로 전환되어 적용된다.\n#투사체_1발_1타 #조건부 #저주";

/* ── 무거운 녹슨 철판 < 2 / 6+ > ── */
defKit('wk2_plate',{name:'무거운 녹슨 철판',kind:'무기',tier:2,atk:14,
  init(e){},
  skills:{ n1:{name:'짓이기기',kind:'일반',cd:7,r:3,cast(e){ S.seg(e,{x:e.x,y:e.y},{x:e.x+e.aim.x*3,y:e.y+e.aim.y*3},2,12,'짓이기기',{knock:.5,v:'quake'}); }} },
  note:"2026년 6월 카드다. 사각형 3x2칸은 앞으로 3칸, 너비 2칸으로 놓았다. 아주 짧은 밀치기는 0.5칸."});
CARDTEXT.wk2_plate="무기 '무거운 녹슨 철판' < 2 / 6+ > / 무기 피해량 +14\n\n(Left) 일반 스킬 '짓이기기' (7s)\n정면을 내려쳐 12 피해를 주고 아주 짧게 밀쳐낸다.\n#사각형 범위 피해_3x2칸_1타 #밀치기_약\n\n상점가 : 8,500 코인";

/* ── 레바테인 < 3 / 7+ > ── */
defKit('wk2_laev',{name:'레바테인',kind:'무기',tier:3,atk:13,
  init(e){},
  skills:{
   n1:{name:'서툰 연소',kind:'기본기',cd:3,r:4,cast(e){ S.line(e,4,14,'서툰 연소',{knock:0,v:'cut',el:'fire'}); }},
   n2:{name:'작열하는 성취',kind:'일반',cd:15,r:6,cast(e){ S.arc(e,6,20,'작열하는 성취',{v:'cut',el:'fire',post:t=>{ SNAME.wk2_burn='발화'; add(t,'wk2_burn',4,0,{by:e}); add(t,'slow',4,.1,{by:e}); for(let i=1;i<=4;i++) after(i,()=>{ if(!t.dead&&!e.dead) damage(e,t,3,'발화',{amp:true}); }); }}); }}
  },note:"2026년 6월 카드다. 발화는 4초 동안 매초 3 피해(합 12)와 10% 둔화다."});
CARDTEXT.wk2_laev="무기 '레바테인' < 3 / 7+ > / 무기 피해량 +13\n\n(Left) 기본기 '서툰 연소' (3s)\n검을 크게 휘둘러 전방에 14 피해를 준다.\n#직선 피해_4칸\n\n(Right) 일반 스킬 '작열하는 성취' (15s)\n상상 속의 승리를 재현하며 검집에서 검을 강하게 뽑아내 전방을 휩쓴다.\n명중한 적에게 즉시 20 피해를 주고 4 초간 '발화' 상태로 만든다.\n'발화' : 매 초마다 3 의 피해를 입으며, 이동 속도가 10% 감소한다.\n#부채꼴 범위 피해_6칸 #지속피해 #둔화";

/* ── 대검 : 화혼제 < 6 > ── */
defKit('wk2_hwahon',{name:'대검 : 화혼제',kind:'무기',tier:6,atk:10,
  init(e){ e.r.wk2_hwahon_e=0; e.r.wk2_hwahon_acc=0; e.r.wk2_hwahon_g=0; e.r.wk2_hwahon_f=0; e.r.wk2_hwahon_L=[]; },
  hud:e=>'불씨 '+e.r.wk2_hwahon_e+(e.r.wk2_hwahon_e>=100?' · 잔불':e.r.wk2_hwahon_e>=70?' · 맹화':e.r.wk2_hwahon_e>=40?' · 열기':''),
  ember(e,n){ e.r.wk2_hwahon_e=Math.min(100,e.r.wk2_hwahon_e+n); },
  onDeal(e,t,amt,l,o){ if(l==='잔열'||l==='멸화') return; if(o&&o.amp) return; CH.wk2_hwahon.ember(e,1); if(e.r.wk2_hwahon_e>=100&&!t.dead){ t.wk2_hwahon_j=(t.wk2_hwahon_j||0)+1; if(!e.r.wk2_hwahon_L.includes(t)) e.r.wk2_hwahon_L.push(t); } },
  onHurt(e,src,amt,l,o){ if(src===e||l==='멸화') return; CH.wk2_hwahon.ember(e,1); if(e.r.wk2_hwahon_g>now){ CH.wk2_hwahon.ember(e,1); heal(e,1,true); } },
  modTake:(e,src,amt)=>e.r.wk2_hwahon_f>now?amt*.4:amt,
  speedMod:e=>e.r.wk2_hwahon_f>now?.4:1,
  tick(e,dt){ e.r.wk2_hwahon_acc+=dt; if(e.r.wk2_hwahon_acc<1) return; e.r.wk2_hwahon_acc-=1; if(e.r.wk2_hwahon_e>=70) heal(e,1,true);
    e.r.wk2_hwahon_L=e.r.wk2_hwahon_L.filter(t=>!t.dead&&t.wk2_hwahon_j>0); for(const t of e.r.wk2_hwahon_L) damage(e,t,t.wk2_hwahon_j,'잔열',{amp:true}); },
  skills:{
   n1:{name:'참격',kind:'기본기',cd:3,r:5,cast(e){ if(e.r.wk2_hwahon_e>=70) wk2Cd(e,'참격',v=>v-2); const hot=e.r.wk2_hwahon_e>=40; S.arc(e,5,6,'참격',{knock:1,v:'cut',el:'fire',post:t=>{ if(hot) for(let i=1;i<=3;i++) after(i,()=>{ if(!t.dead&&!e.dead) damage(e,t,2,'참격 (열기)'); }); }}); }},
   n2:{name:'방염',kind:'일반',cd:9,r:5,ai:e=>hurtNow(e),cast(e){ const hot=e.r.wk2_hwahon_e>=40; e.r.wk2_hwahon_g=now+2; add(e,'resist',2,.3); add(e,'slow',2,hot?.15:.3,{self:true}); if(hot) shield(e,20,2); }},
   aw:{name:'둔검',kind:'일반',cd:18,r:5,cast(e){ const hot=e.r.wk2_hwahon_e>=40,p={x:e.x+e.aim.x*2,y:e.y+e.aim.y*2}; S.circle(e,4,18,'둔검',{knock:2,v:'quake',el:'fire'},p); if(hot) after(.3,()=>{ if(e.dead||over) return; S.circle(e,4,12,'둔검 (열기)',{knock:4,v:'nova',el:'fire'},p); }); }},
   x1:{name:'맹렬격화',kind:'각성',cd:45,r:7,can:e=>e.r.wk2_hwahon_e>=70,need:'맹화 / 잔불 (불씨 70)',cast(e){ wk2Dash(e,5,26,1.8,null,'',null,(h,p0)=>{ for(let i=0;i<5;i++) S.seg(e,p0,{x:e.x,y:e.y},1.8,4,'맹렬격화',{knock:i===4?2:0,v:'cut',el:'fire'}); after(.25,()=>{ if(e.dead||over) return; for(let i=0;i<5;i++) S.circle(e,5,6,'맹렬격화',{knock:0,stun:i===4?.5:0,v:'quake',el:'fire'}); }); }); }},
   x2:{name:'화혼제',kind:'초월',cd:90,r:9,can:e=>e.r.wk2_hwahon_e>=100,need:'잔불 (불씨 100)',cast(e){ e.r.wk2_hwahon_f=now+10; proc(e,'화혼제','멸화 10초');
      for(let i=0;i<30;i++) after(i*.33,()=>{ if(e.dead||over) return; const r=Math.max(1,10-Math.floor(i*.33)); if(i%3===0) fx.push({k:'circle',x:e.x,y:e.y,r,t0:now,team:e.team,lab:'멸화',src:e,v:'nova',el:'fire'}); foes(e).forEach(t=>{ if(dist(e,t)<=r+(t.rad||R)) damage(e,t,1,'멸화',{amp:true}); }); e.hp=Math.max(1,e.hp-1); });
      after(10,()=>{ if(e.dead) return; e.r.wk2_hwahon_e=0; for(const t of e.r.wk2_hwahon_L) t.wk2_hwahon_j=0; e.r.wk2_hwahon_L=[]; }); }}
  },note:"2026년 6월 카드다. 불씨는 타격·피격 한 번에 1씩 얻는다(카드에 양이 없다). 맹화의 \"'참격' 의 재사용 대기시간이 2 초 감소\"는 참격을 쓸 때 대기시간이 2초 줄어 1초가 되는 것으로 읽었다. 잔열은 맞힌 적에게 쌓이고 매초 그 수만큼 피해를 준다. 맹렬격화의 다운은 따로 없고 0.5초 기절만 준다. 돌진 20은 4x5타, 내리꽂기 30은 6x5타로 나눴다. 화혼제의 멸화는 0.33초마다 1 피해를 30번 주고(시전자는 체력 1 아래로 내려가지 않는다), 끝나면 불씨와 적에게 쌓인 잔열이 모두 사라진다. 방염의 보호막 20은 2초 동안이다. 밀치기는 참격 1칸, 둔검 2칸(열기 4칸)으로 정했다."});
CARDTEXT.wk2_hwahon="무기 '대검 : 화혼제' < 6 > / 무기 피해량 +10\n\n(Passive) '불씨' (-)\n적 타격/피격시마다 '불씨' 를 획득한다. (최대 100)\n이때 '불씨' 가 40/70/100 이상일 경우 '열기/맹화/잔불' 상태에 돌입한다.\n'열기' : 기본기를 포함한 모든 스킬 시전시 '열기' 효과를 적용한다.\n'맹화' : 매 초마다 체력을 1 회복하며 '참격' 의 재사용 대기시간이 2 초 감소한다.\n'잔불' : '잔열' 을 제외한 방법으로 적 타격시마다 '잔열' 을 1 쌓는다.\n'잔열' : 매 초마다 '잔열' 만큼 피해를 준다. 해당 효과로는 '불씨' 를 획득할 수 없다.\n\n(Left) 기본기 '참격' (3s)\n대검을 휘둘러 전방의 적에게 6 피해를 주고 짧게 밀어낸다.\n'열기' : 타오르는 대검이 적에게 3 초에 걸쳐 6 추가 피해를 준다.\n#부채꼴 범위 피해_5칸_1타 #밀치기_약 #추가피해_3타\n\n(Right) 일반 스킬 '방염' (9s)\n대검을 빗겨들며 2 초간 받는 모든 피해 및 이동속도가 30% 감소한다.\n효과 지속중 피격시마다 추가로 '불씨' 를 획득하며 체력을 1 회복한다.\n'열기' : 추가로 20 보호막을 획득하며 이동속도 감소량을 15%로 조정한다.\n\n(Shift+Left) 일반 스킬 '둔검' (18s)\n대검을 내리쳐 전방의 적에게 18 피해를 주고 밀어낸다.\n'열기' : 타오르는 지면에서 불길을 일으켜 12 추가 피해를 주고 크게 밀어낸다.\n#지정형_2칸 #원형 범위 피해_4칸_2타 #밀치기\n\n(Shift+Right) 각성 스킬 '맹렬격화' (45s)\n'맹화/잔불' 상태일 시 시전할 수 있다.\n불씨를 피워올리며 돌진해 경로선상의 적에게 20 피해를 주고 밀어낸다.\n이후 대검을 내리꽂으며 30 피해를 주고 다운시키며 0.5 초간 기절시킨다.\n#돌진_5칸 #경로선상 피해_5타 #원형 범위 피해_5칸_5타 #다운 #기절\n\n(Shift+Shift) 초월 스킬 '화혼제' (90s)\n'잔불' 상태일 시 시전할 수 있다.\n영혼을 불태우며 10 초간 '멸화' 를 펼치고, 매 초마다 '멸화' 의 범위가 1 칸 감소한다.\n효과 지속중 자신은 받는 모든 피해 및 이동속도가 60% 감소한다.\n'멸화' 종료 시 모든 '불씨' 가 사라지며 자신에게 쌓인 '잔열' 을 0 으로 한다.\n'멸화' : 시전자를 포함하여 범위 내 모든 엔티티에 0.33초마다 1 피해를 준다.\n#원형 범위 피해_10~1칸_3x9타";

/* ── 파율의 권갑 < 5+ > ── */
defKit('wk2_payul',{name:'파율의 권갑',kind:'무기',tier:5,atk:12,
  init(e){ e.r.wk2_payul_h=0; e.r.wk2_payul_ht=0; e.r.wk2_payul_bf=0; e.r.wk2_payul_lb=0; },
  hud:e=>e.r.wk2_payul_lb>now?'한계 돌파 '+Math.ceil(e.r.wk2_payul_lb-now)+'s':e.r.wk2_payul_ht>now?'허공답보':'',
  /* 달인의 투지: 다섯 번 때릴 때마다 충격파 */
  onDeal(e,t,amt,l,o){ if((o&&o.amp)||l==='달인의 투지') return; if(++e.r.wk2_payul_h>=5){ e.r.wk2_payul_h=0; const hit=foes(e).filter(x=>{ const dx=x.x-e.x,dy=x.y-e.y,u=dx*e.aim.x+dy*e.aim.y; return u>=-.5&&u<=4+(x.rad||R)&&Math.abs(dx*e.aim.y-dy*e.aim.x)<=.7+(x.rad||R); }); fx.push({k:'seg',x0:e.x,y0:e.y,x1:e.x+e.aim.x*4,y1:e.y+e.aim.y*4,w:1.4,t0:now,team:e.team,lab:'달인의 투지',src:e}); hit.forEach(x=>damage(e,x,6,'달인의 투지',{amp:true})); } },
  modDeal:(e,t,amt,l,o)=>e.r.wk2_payul_bf>now&&!(o&&(o.basic||o.amp))?amt*1.2:amt,
  modTake:(e,src,amt)=>e.r.wk2_payul_lb>now&&src!==e?amt*.8:amt,
  speedMod:e=>e.r.wk2_payul_lb>now?1.4:1,
  /* 허공답보 뒤 3초 안에 쓴 스킬 하나의 피해 +20% */
  step(e){ const h=e.r.wk2_payul_ht>now; if(h){ e.r.wk2_payul_ht=0; e.r.wk2_payul_bf=now+1.6; } return h; },
  skills:{
   n1:{name:'연환격',kind:'기본기',cd:.5,r:4,cast(e){ const h=CH.wk2_payul.step(e); S.line(e,4,3,'연환격',{knock:0,v:'punch'}); after(.12,()=>{ if(e.dead||over) return; S.line(e,4,3,'연환격',{knock:0,v:'punch'}); if(h) wk2Dash(e,2,26,1.4,null,'',null,()=>S.circle(e,4,10,'연환격',{knock:0,v:'punch'})); }); }},
   n2:{name:'질풍천붕추',kind:'일반',cd:15,r:3,can:e=>!!wk2Near(e,3),need:'3칸 안의 적',cast(e){ CH.wk2_payul.step(e); const t=wk2Near(e,3); if(!t) return; strike(e,t,12,'질풍천붕추',{knock:0,air:4}); e.vz=Math.max(e.vz,Math.sqrt(2*G*4)); after(.9,()=>{ if(e.dead||over) return; S.circle(e,5,18,'질풍천붕추',{air:4,knock:0,zfree:true,v:'quake'}); }); }},
   aw:{name:'포착뇌격',kind:'일반',cd:18,r:4,cast(e){ CH.wk2_payul.step(e); const hit=S.arc(e,4,10,'포착뇌격',{knock:0,v:'punch'}); const t=hit.filter(x=>!x.dead)[0]; if(!t) return; const up=t.z>.3; if(!t.c.heavy){ t.x=e.x+e.aim.x*1.2; t.y=e.y+e.aim.y*1.2; clamp(t); } after(.2,()=>{ if(e.dead||t.dead||over) return; strike(e,t,12,'포착뇌격',{stun:1,knock:0}); if(up) after(.3,()=>{ if(e.dead||t.dead||over) return; strike(e,t,18,'포착뇌격',{stun:1,knock:0}); }); }); }},
   x1:{name:'진공풍압격',kind:'각성',cd:30,r:5,cast(e){ CH.wk2_payul.step(e); for(let i=0;i<6;i++) after(i*.12,()=>{ if(e.dead||over) return; S.circle(e,5,25/6,'진공풍압격',{pull:.6,v:'spin'}); }); after(.8,()=>{ if(e.dead||over) return; wk2Dash(e,5,28,1.8,30,'진공풍압격',{knock:4,v:'punch'}); }); }},
   x2:{name:'무극 : 혼신의 일격',kind:'초월',cd:60,r:8,cast(e){ CH.wk2_payul.step(e); if(!(e.r.wk2_payul_lb>now)){ e.r.wk2_payul_lb=now+10; wk2Cd(e,'무극 : 혼신의 일격',()=>1); proc(e,'무극 : 혼신의 일격','한계 돌파 10초'); return; }
      S.focus(e,1); after(1,()=>{ if(e.dead||over) return; let n=0; for(let i=0;i<4;i++) n+=S.arc(e,8,20,'무극 : 혼신의 일격',{knock:0,stun:i===3?3:0,v:'punch'}).length; if(!n) add(e,'stun',3,0,{self:true}); }); }},
   x3:{name:'허공답보',kind:'패시브',cd:3,r:99,ai:()=>false,cast(e){ S.blink(e,{x:-e.aim.x,y:-e.aim.y},2); e.r.wk2_payul_ht=now+3; }}
  },note:"2026년 6월 카드다. '허공답보'(공중에서 점프 연속 입력)는 단추 하나로 놓았다: 뒤로 2칸 옮기고, 3초 안에 쓰는 스킬 하나의 피해가 20% 는다. 따로 도는 대기시간은 카드에 없어 3초로 정했고, 공중이 아니어도 쓸 수 있다. 연환격 6 피해는 3x2타. 질풍천붕추는 가장 가까운 적을 잡고 0.9초 뒤 내려찍는다. 포착뇌격은 맞은 적 하나를 앞으로 끌어온다. 진공풍압격의 25 피해는 6타로 나눴다. 무극은 한 번 누르면 한계 돌파 10초가 켜지고(1초 뒤 다시 누를 수 있다) 그 안에 다시 누르면 일격이 나간다. 80 피해는 20x4타, 강한 밀치기는 4칸."});
CARDTEXT.wk2_payul="무기 '파율의 권갑' < 5+ > / 무기 피해량 +12\n\n(Passive) '달인의 투지' (-)\n적 5 회 타격시마다 전방으로 적을 관통하는 충격파를 쏘아내 6 피해를 준다.\n'허공답보' : 공중에서 점프 키 연속 입력 시 후방으로 짧게 이동하고 별개의 재사용 대기시간을 적용한다.\n'허공답보' 시전 후 3초 내에 스킬 시전시 해당 스킬의 기본 피해가 20% 증가한다.\n#직선 피해_4칸_1타 #도약(뒤)_2칸\n\n(Left) 기본기 '연환격' (0.5s)\n두 주먹을 빠르게 내질러 6 피해를 준다.\n'허공답보' 후 시전 시, 추가로 짧게 돌진하며 10 피해를 준다.\n#직선 피해_4칸_2타 #돌진_2칸 #원형 범위 피해_4칸_1타\n\n(Right) 일반 스킬 '질풍천붕추' (15s)\n바라보는 적을 붙잡아 위로 도약하며 12 피해를 준다.\n이후 지면으로 급하강하여 내려찍으며 주변에 18 피해를 입히고 띄운다.\n#지정 피해_3칸_1타 #도약(위)_4칸 #원형 범위 피해_5칸_1타 #에어본_4칸\n\n(Shift+Left) 일반 스킬 '포착뇌격' (18s)\n전방의 적을 자신에게 끌어당기며 10 피해를 준다.\n이후 끌려온 적을 타격해 12 피해를 주고 1 초간 기절시킨다.\n끌어당겨진 적이 공중이었을 시, 기절시킨 상대를 들었다 찍어 18 피해를 주고 추가로 1 초간 기절시킨다.\n#부채꼴 범위 피해_4칸_1타 #끌어당기기 #기절\n\n(Shift+Right) 각성 스킬 '진공풍압격' (30s)\n거센 풍압을 일으켜 적들을 자신에게 끌어모으며 총 25 피해를 준다.\n이후 전방으로 돌진하며 경로선상의 적에게 30 피해를 입히고 강하게 밀어낸다.\n#원형 범위 피해_5칸_6타 #끌당(약) #돌진_5칸 #밀치기_강\n\n(Shift+Shift) 초월 스킬 '무극 : 혼신의 일격' (60s)\n시전 시 10 초간 '한계 돌파' 에 돌입한다.\n'한계 돌파' 중 스킬 재시전 시, 1 초간 정신을 집중한 뒤 전방의 적에게 80 피해를 주고 3 초간 기절시킨다.\n스킬이 빗나갔을 시, 시전자는 3 초간 기절 상태에 빠진다.\n'한계 돌파' : 효과 지속 중 받는 모든 피해가 20% 감소하고 이동속도가 40% 증가한다.\n#부채꼴 범위 피해_8칸_4타 #기절 #자체기절";

/* ── 비밀 < 5+ > ── */
defKit('wk2_secret',{name:'비밀',kind:'무기',tier:5,atk:16,
  init(e){ e.r.wk2_secret_pw=0; e.r.wk2_secret_eng=false; e.r.wk2_secret_mana=0; e.r.wk2_secret_acc=0; e.r.wk2_secret_still=0; e.r.wk2_secret_fix=0; e.r.wk2_secret_g=0; e.r.wk2_secret_gh=0; },
  hud:e=>'전력 '+Math.floor(e.r.wk2_secret_pw)+(e.r.wk2_secret_eng?' · 아광 엔진':'')+' · 마나 '+e.r.wk2_secret_mana,
  speedMod:e=>e.r.wk2_secret_eng?1.2:1,
  tick(e,dt){ const r=e.r; if(e.mv.x||e.mv.y) r.wk2_secret_still=0; else r.wk2_secret_still+=dt; r.wk2_secret_acc+=dt; if(r.wk2_secret_acc<1) return; r.wk2_secret_acc-=1;
    if(r.wk2_secret_fix>now){ r.wk2_secret_pw=0; return; } r.wk2_secret_pw=Math.min(300,r.wk2_secret_pw+10+(r.wk2_secret_still>=3?20:0)); if(r.wk2_secret_eng){ r.wk2_secret_pw-=20; if(r.wk2_secret_pw<=0){ r.wk2_secret_pw=0; r.wk2_secret_eng=false; proc(e,'아광 엔진','꺼짐'); } } },
  onHurt(e,src,amt,l,o){ if(src===e) return; const r=e.r; r.wk2_secret_still=0; if(r.wk2_secret_g>now&&r.wk2_secret_pw>=10){ r.wk2_secret_pw-=10; shield(e,r.wk2_secret_eng?8:4,r.wk2_secret_eng?2:1); if(++r.wk2_secret_gh%3===0) r.wk2_secret_mana=Math.min(3,r.wk2_secret_mana+1); } },
  skills:{
   n1:{name:'슬래셔',kind:'기본기',cd:2,r:4,cast(e){ const eng=e.r.wk2_secret_eng,sq=(len,dmg,o)=>S.seg(e,{x:e.x,y:e.y},{x:e.x+e.aim.x*len,y:e.y+e.aim.y*len},2,dmg,'슬래셔',o); sq(4,8,{knock:0,v:'cut'}); if(eng) after(.2,()=>{ if(e.dead||over) return; sq(5,12,{knock:0,stun:.15,v:'cut',el:'thunder'}); }); }},
   n2:{name:'임펄스 가드',kind:'일반',cd:1,r:6,hold:true,can:e=>e.r.wk2_secret_pw>=10,need:'전력 10',ai:e=>hurtNow(e),cast(e){ e.r.wk2_secret_pw-=10; e.r.wk2_secret_g=now+1; }},
   aw:{name:'스핀 다이브',kind:'일반',cd:12,r:5,cast(e){ const eng=e.r.wk2_secret_eng; if(e.r.wk2_secret_mana>0){ e.r.wk2_secret_mana--; wk2Cd(e,'스핀 다이브',()=>0); } wk2Dash(e,4,26,1.6,null,'',null,()=>S.circle(e,4,16,'스핀 다이브',{knock:0,v:'spin',post:t=>{ if(eng) dot(e,t,16,4,'스핀 다이브 (잔류)'); }})); }},
   x1:{name:'댄싱 와이어',kind:'각성',cd:30,r:9,cast(e){ const m=e.r.wk2_secret_mana,slash=()=>{ S.circle(e,4,25,'댄싱 와이어',{knock:0,v:'spin'}); for(let i=1;i<=m;i++) after(i*.25,()=>{ if(e.dead||over) return; S.circle(e,4,15,'댄싱 와이어',{knock:0,v:'spin'}); }); }; let got=false;
      S.proj(e,e.aim,{speed:40,range:9,dmg:0,label:'댄싱 와이어',v:'tracer',o:{post:t=>{ got=true; add(t,'stun',.5+.25*m,0,{by:e}); if(e.dead) return; e.x=t.x-e.aim.x*1.2; e.y=t.y-e.aim.y*1.2; clamp(e); slash(); }},onEnd:p=>{ if(got||e.dead||over) return; e.x=p.x; e.y=p.y; clamp(e); slash(); }}); }},
   x2:{name:'망운 절명',kind:'각성',cd:50,r:6,can:e=>e.r.wk2_secret_eng,need:'아광 엔진',cast(e){ e.r.wk2_secret_eng=false; e.r.wk2_secret_pw=0; e.r.wk2_secret_fix=now+5; S.circle(e,6,0,'망운 절명',{stun:1,knock:0,v:'nova',el:'thunder'}); for(let i=0;i<7;i++) after(.3+i*.1,()=>{ if(e.dead||over) return; S.circle(e,6,10,'망운 절명',{knock:0,v:'cut'}); }); }},
   x3:{name:'아광 엔진',kind:'패시브',cd:.5,r:99,ai:e=>!e.r.wk2_secret_eng&&e.r.wk2_secret_pw>=100,cast(e){ if(e.r.wk2_secret_eng) e.r.wk2_secret_eng=false; else if(e.r.wk2_secret_pw>=20&&!(e.r.wk2_secret_fix>now)) e.r.wk2_secret_eng=true; proc(e,'아광 엔진',e.r.wk2_secret_eng?'켜짐':'꺼짐'); }}
  },note:"2026년 6월 카드다. Q 키(아광 엔진)는 단추 하나로 놓았다. 임펄스 가드는 누르고 있는 단추로, 한 번에 전력 10을 쓰고 1초 동안 켜진다. 가드 중에 기본기·스킬을 못 쓰는 제한은 넣지 않았다. 슬래셔의 사각 범위는 너비 2칸. 댄싱 와이어는 맞으면 그 적 앞으로, 빗나가면 9칸 끝으로 옮겨 가 벤다. 마나는 스핀 다이브만 소모한다. 망운 절명의 70 피해는 10x7타."});
CARDTEXT.wk2_secret="무기 '비밀' < 5+ > / 무기 피해량 +16\n\n(Passive) '기신의 역작' (-)\n매 초마다 '전력' 을 10 충전한다. (최대 300)\n3 초간 움직이지 않았을 시, 피격되기 전까지 전력 충전량이 +20 증가한다.\nQ 키를 입력하여 언제든 '아광 엔진' 상태를 켜고 끌 수 있다.\n'아광 엔진' : 매 초마다 '전력' 을 20 소모하며, 이동 속도가 20% 증가하고 모든 스킬을 강화한다.\n\n(Left) 기본기 '슬래셔' (2s)\n태도를 가볍게 휘둘러 전방의 적에게 8 피해를 준다.\n'아광 엔진' : 이후 푸른 전격이 일며 12 피해를 주고 적들에게 매우 짧은 경직을 부여한다.\n#사각 범위 피해_4칸_1타 #사각 범위 피해_5칸_1타 #경직_약\n\n(Right) 일반 스킬 '임펄스 가드' (-)\n우클릭 중 매 초마다 '전력' 을 10 소모하며 1 초간 '임펄스 가드' 를 얻는다.\n효과 지속중 피격시마다 '전력' 을 10 소모하며 1 초간 지속되는 4 보호막을 얻는다.\n'아광 엔진' : 보호막의 효과 및 지속시간을 2 배로 하며 '임펄스 가드' 중 기본기 및 스킬 시전이 가능하다.\n'임펄스 가드' : 기본기 및 스킬 사용이 불가능하며 3 회 피격시마다 '마나' 를 1 쌓는다. (최대 3)\n\n(Shift+Left) 일반 스킬 '스핀 다이브' (12s)\n전방으로 회전하며 돌진해 경로상의 적들을 원형으로 베어 16 피해를 준다.\n'마나' 보유 시, 마나를 1 소모하여 이 스킬의 재사용 대기시간을 즉시 초기화한다.\n'아광 엔진' : 명중한 적에게 잔류를 남겨 4 초에 걸쳐 16 피해를 준다.\n#돌진_4칸 #원형 범위 피해_4칸_1타\n\n(Shift+Right) 각성 스킬 '댄싱 와이어' (30s)\n전방으로 전자기 와이어를 사출해 명중 지점으로 순간이동한 뒤 주변을 베어 25 피해를 준다.\n이후 보유한 '마나' 수만큼 연속으로 주변을 베어넘겨 15~45 피해를 준다.\n적이 와이어에 명중 시 시전자의 보유 '마나' 에 비례해 0.5~1.25 초간 기절시킨다.\n#직선투사체_9칸_1발 #순간이동 #원형 범위 피해_4칸\n\n(Shift+Shift) 각성 스킬 '망운 절명' (50s)\n'아광 엔진' 중 시전할 수 있다.\n시전 시 '아광 엔진' 을 해제하며 5 초간 '전력' 을 0 으로 고정한다.\n동시에 사방으로 과전류를 방전시키며 주변 적을 와이어로 구속해 1 초간 기절시킨다.\n이후 기절한 적들을 향해 중앙 지점에서 연속으로 교차하여 베어 넘기며 70 피해를 준다.\n#원형 범위 기절_6칸 #원형 범위 피해_6칸_7타";

/* ── 패왕의 검창 < 4 > ── */
defKit('wk2_spear',{name:'패왕의 검창',kind:'무기',tier:4,atk:16,
  init(e){ e.r.wk2_spear_emp=false; },
  hud:e=>e.r.wk2_spear_emp?'베어가르기 강화':'',
  skills:{
   n1:{name:'베어가르기',kind:'기본기',cd:1,r:4,cast(e){ if(!e.r.wk2_spear_emp){ S.arc(e,4,8,'베어가르기',{knock:0,v:'cut'}); return; } e.r.wk2_spear_emp=false; wk2Dash(e,1,24,1.4,null,'',null,()=>S.arc(e,4,13,'베어가르기',{knock:0,v:'cut',post:t=>{ SNAME.wk2_rup='파열'; add(t,'wk2_rup',1,0,{by:e}); add(t,'slow',1,.15,{by:e}); add(t,'dealdown',1,.15,{by:e}); }})); }},
   n2:{name:'잠룡 추격',kind:'일반',cd:14,r:6,cast(e){ e.r.wk2_spear_emp=true; S.leap(e,e.aim,5,24,()=>{ if(e.dead) return; const hit=S.circle(e,3,18,'잠룡 추격',{air:2,knock:0,v:'stake'}); if(hit.length) after(.5,()=>{ if(e.dead||over) return; S.circle(e,4,12,'잠룡 추격',{stun:.5,knock:0,zfree:true,v:'stake'}); }); }); }},
   aw:{name:'패왕의 포효',kind:'영웅',cd:22,r:5,cast(e){ e.r.wk2_spear_emp=true; S.circle(e,5,24,'패왕의 포효',{stun:1,knock:0,v:'shout'}); }}
  },note:"2026년 9월 카드(2번째 판)다. 강화 베어가르기는 1칸 돌진한 뒤 13 피해를 주고 1초 '파열'(이동속도·주는 피해 15% 감소)을 건다. 잠룡 추격의 에어본은 2칸으로 정했다. 각성 조건(코인·별무리)은 시험장에 없어 뺐다."});
CARDTEXT.wk2_spear="무기 '패왕의 검창' < 4 > / 무기 피해량 +16\n\n(Passive) '패도' (-)\n스킬 시전 후 다음 '베어가르기' 가 '강화' 되며 명중한 적을 1 초간 '파열' 시킨다.\n'파열' : 효과 지속중 대상의 이동속도 및 주는 피해량이 15% 감소한다.\n\n(Left) 기본기 '베어가르기' (1s)\n전방으로 검을 휘둘러 8 피해를 준다.\n'강화' : 전방으로 매우 짧게 돌진하며 이때 주는 피해량이 5 증가한다.\n#부채꼴 범위 피해_4칸_1타 #돌진_1칸 #피해증가\n\n(Right) 일반 스킬 '잠룡 추격' (14s)\n전방으로 도약하며 창을 내리꽂아 18 피해를 주고 적을 공중으로 띄운다.\n명중 시 제자리에서 다시 창을 꽂아 12 피해를 주고 대상을 0.5 초간 기절시킨다.\n#도약_5칸 #원형 범위 피해_3칸_1타 #에어본 #원형 범위 피해_4칸_1타 #기절\n\n(Shift+Left) 영웅 스킬 '패왕의 포효' (22s)\n세상을 향해 거센 포효를 내질러 범위 내 적에게 24 피해를 입히고 1 초간 기절시킨다.\n#원형 범위 피해_5칸_1타 #기절";

/* ── 흑색의 장검 < 4 > ── */
defKit('wk2_black',{name:'흑색의 장검',kind:'무기',tier:4,atk:14,
  init(e){ e.r.wk2_black_n=0; e.r.wk2_black_acc=0; e.r.wk2_black_sa=false; },
  hud:e=>'흑린 '+e.r.wk2_black_n+(e.r.wk2_black_sa?' · 사성':''),
  gain(e,n){ e.r.wk2_black_n=Math.min(44,e.r.wk2_black_n+n); },
  tick(e,dt){ e.r.wk2_black_acc+=dt; if(e.r.wk2_black_acc>=1){ e.r.wk2_black_acc-=1; CH.wk2_black.gain(e,1); } },
  onDeal(e,t,amt,l,o){ if(!(o&&o.amp)) CH.wk2_black.gain(e,1); },
  skills:{
   n1:{name:'흑참',kind:'기본기',cd:1,r:4,cast(e){ S.arc(e,4,12,'흑참',{knock:0,v:'cut',post:()=>CH.wk2_black.gain(e,1)}); }},
   n2:{name:'흑월참',kind:'일반',cd:12,r:5,cast(e){ const sa=e.r.wk2_black_sa; e.r.wk2_black_sa=false; S.arc(e,5,16,'흑월참',{knock:1,v:'cut'}); if(sa) after(.25,()=>{ if(e.dead||over) return; S.arc(e,8,24,'흑월참 (사성)',{silence:.5,knock:0,v:'cut'}); }); }},
   aw:{name:'흑린 삭월',kind:'영웅',cd:24,r:4,cast(e){ const sa=e.r.wk2_black_sa; e.r.wk2_black_sa=false; const five=(fn)=>{ for(let i=0;i<5;i++) after(i*.1,()=>{ if(!e.dead&&!over) fn(i); }); };
      if(!sa){ five(()=>S.circle(e,4,6,'흑린 삭월',{knock:0,v:'spin'})); return; }
      wk2Dash(e,5,28,1.6,20,'흑린 삭월 (사성)',{silence:.5,knock:0,v:'cut'},hit=>{ const t=hit.filter(x=>!x.dead)[0]; if(!t) return; const d=norm(t.x-e.x,t.y-e.y); e.x=t.x+d.x*1.2; e.y=t.y+d.y*1.2; clamp(e); e.aim={x:-d.x,y:-d.y}; five(i=>{ if(!t.dead) strike(e,t,6,'흑린 삭월 (사성)',{knock:0,silence:i===4?.5:0}); }); }); }},
   x1:{name:'사성',kind:'패시브',cd:1,r:99,can:e=>e.r.wk2_black_n>=44&&!e.r.wk2_black_sa,need:'흑린 44',cast(e){ e.r.wk2_black_n=0; e.r.wk2_black_sa=true; proc(e,'흑린사성','사성'); }}
  },note:"2026년 9월 카드다. Shift 두 번 입력('사성')은 단추 하나로 놓았다. 흑린 삭월의 30 피해는 6x5타. 사성 흑월참의 검기는 0.25초 뒤 8칸 부채꼴이다. 사성 흑린 삭월은 돌진에 맞은 적 하나의 뒤로 옮겨 가 다섯 번 벤다."});
CARDTEXT.wk2_black="무기 '흑색의 장검' < 4 > / 무기 피해량 +14\n\n(Passive) 권능 '흑린사성' (-)\n매 초마다 '흑린' 을 얻고, 적 타격시마다 추가로 하나 얻는다. (최대 44)\n'흑린' 이 최대치일 시 Shift를 2 번 입력해 '흑린' 을 모두 소모하고 '사성' 에 돌입한다.\n\n(Left) 기본기 '흑참' (1s)\n장검을 휘둘러 12 피해를 주고 적중 시 '흑린' 을 얻는다.\n#부채꼴 범위 피해_4칸_1타 #게이지충전\n\n(Right) 일반 스킬 '흑월참' (12s)\n전방으로 장검을 크게 휘둘러 16 피해를 주고 짧게 밀어낸다.\n'사성' 일 시 '사성' 을 해제하며 이하 효과를 시전한다.\n이후 전방으로 퍼져나가는 검기를 날려 명중한 적에게 24 피해를 주고 0.5 초간 침묵시킨다.\n#부채꼴 범위 피해_5칸_1타 #밀치기_약 #부채꼴 범위 피해_1~8칸_1타 #침묵\n\n(Shift+Left) 영웅 스킬 '흑린 삭월' (24s)\n장검을 빠르게 다섯 차례 휘둘러 주변 적에게 30 피해를 준다.\n'사성' 일 시 '사성' 을 해제하며 이하 효과로 변경된다.\n전방으로 돌진하며 명중한 적에게 20 피해를 주고 0.5 초간 침묵시킨다.\n적중 시 뒤로 순간이동하며 장검을 다섯 차례 휘둘러 30 피해를 주고 추가로 0.5 초간 침묵시킨다.\n#원형 범위 피해_4칸_5타 #돌진_5칸 #경로선상 피해_1타 #순간이동 #침묵 #지정형_5타";

/* ── 정원의 마른 가지 < 3 / 4 > ── */
defKit('wk2_twig',{name:'정원의 마른 가지',kind:'무기',tier:3,atk:11,
  init(e){},
  skills:{
   n1:{name:'휘두르기',kind:'기본기',cd:1.2,r:4,cast(e){ S.arc(e,4,9,'휘두르기',{knock:.5,v:'cut',el:'nature'}); }},
   n2:{name:'가시 덤불',kind:'일반',cd:12,r:5,cast(e){ S.arc(e,5,15,'가시 덤불',{root:.5,knock:0,v:'stake',el:'nature'}); }},
   aw:{name:'공간 접기',kind:'일반',cd:15,r:6,ai:(e,d)=>d>5,cast(e){ S.blink(e,moveDir(e),5); }}
  },note:"2026년 9월 카드(2번째 판)다. 휘두르기의 약한 밀치기는 0.5칸."});
CARDTEXT.wk2_twig="무기 '정원의 마른 가지' < 3 / 4 > / 무기 피해량 +11\n\n(Left) 기본기 '휘두르기' (1.2s)\n가지를 휘둘러 전방의 적에게 9 피해를 준다.\n#부채꼴 범위 피해_4칸_1타 #밀치기_약 #기본공격\n\n(Right) 일반 스킬 '가시 덤불' (12s)\n전방으로 가시를 치솟게 하며 15 피해를 입히고 적을 0.5 초간 속박시킨다.\n#부채꼴 범위 피해_5칸_1타 #CC기 #속박\n\n(Shift+Shift) 일반 스킬 '공간 접기' (15s)\n전방으로 5 칸 순간이동한다.\n#순간이동_5칸";

/* ── 힘을 잃은 레비아탄 < 4 / 6 > ── */
defKit('wk2_levi',{name:'힘을 잃은 레비아탄',kind:'무기',tier:4,atk:20,
  init(e){ e.r.wk2_levi_j=0; e.r.wk2_levi_free=false; e.r.wk2_levi_c=0; e.r.wk2_levi_gu=0; },
  hud:e=>'질투 '+e.r.wk2_levi_j+(e.r.wk2_levi_free?' · 다음 행동 초기화':''),
  names:['푸른 비','냉혈의 전장','망령된 검'],
  onDeal(e,t,amt,l,o){ if(o&&o.amp) return; if(!CH.wk2_levi.names.some(n=>(l||'').startsWith(n))&&l!=='구천') return; if(e.r.wk2_levi_gu>now) heal(e,1,true); if(l==='구천') return; if(++e.r.wk2_levi_j>=15){ e.r.wk2_levi_j=0; e.r.wk2_levi_free=true; } },
  /* 질투가 다 찼으면 이 행동의 대기시간을 되돌린다 */
  act(e,name){ if(e.r.wk2_levi_free){ e.r.wk2_levi_free=false; wk2Cd(e,name,()=>0); } },
  skills:{
   n1:{name:'푸른 비',kind:'기본기',cd:3,r:6,cast(e){ CH.wk2_levi.act(e,'푸른 비'); if(++e.r.wk2_levi_c%3===0) S.circle(e,6,21,'푸른 비',{slow:[.15,1],knock:0,v:'quake',el:'ice'}); else S.arc(e,6,14,'푸른 비',{knock:0,v:'cut',el:'ice'}); }},
   n2:{name:'냉혈의 전장',kind:'일반',cd:12,r:7,cast(e){ CH.wk2_levi.act(e,'냉혈의 전장'); wk2Dash(e,7,28,1.8,null,'',null,(h,p0)=>{ const seen=new Set(); for(let i=0;i<2;i++) S.seg(e,p0,{x:e.x,y:e.y},1.8,10,'냉혈의 전장',{knock:0,v:'stake',el:'ice',post:t=>{ if(seen.has(t)) return; seen.add(t); if(has(t,'slow')) add(t,'root',.5,0,{by:e}); else add(t,'slow',1,.3,{by:e}); }}); }); }},
   aw:{name:'망령된 검',kind:'영웅',cd:24,r:9,cast(e){ CH.wk2_levi.act(e,'망령된 검'); e.r.wk2_levi_gu=now+12; const cnt=new Map(); zone(e,{x:e.x,y:e.y,r:10,dur:12.05,every:1,label:'구천',tick:(z,inn)=>inn.forEach(t=>{ damage(e,t,3,'구천'); const n=(cnt.get(t)||0)+1; cnt.set(t,n); if(n%2===0) add(t,'slow',1,.15,{by:e}); })}); }}
  },note:"2026년 9월 카드다. '질투'는 이 무기의 스킬이 적을 때릴 때만 쌓이고(구천의 지속 피해는 세지 않는다), 15가 되면 다음에 쓰는 이 무기 스킬의 대기시간이 바로 돌아온다. 냉혈의 전장의 20 피해는 10x2타. 구천은 시전한 자리에 12초 남는 반지름 10칸의 장이고, 그동안 이 무기로 피해를 줄 때마다 체력 1을 회복한다."});
CARDTEXT.wk2_levi="무기 '힘을 잃은 레비아탄' < 4 / 6 > / 무기 피해량 +20\n\n패시브 '(약화된) 질투의 마수'\n적 타격시마다 '질투' 를 하나 얻는다. ( 최대 15 )\n최대치일 시 모든 '질투' 를 소모하며 '레비아탄' 의 다음 행동의 재사용 대기시간을 초기화한다.\n\n(Left) 기본기 '푸른 비' (3s)\n푸른 기운을 검신에 휘감아 전방으로 휘둘러 명중한 적에게 14 피해를 준다.\n세 번째 공격시마다 검을 내리쳐 충격파를 일으키고 21 피해를 주며 1 초간 15% 둔화시킨다.\n#부채꼴 범위 피해_6칸_1타 #원형 범위 피해_6칸_1타 #둔화\n\n(Right) 일반 스킬 '냉혈의 전장' (12s)\n전방으로 돌진하며 얼어붙은 창들을 쏟아지게 해 경로선상의 적에게 20 피해를 준다.\n이후 명중한 적을 1 초간 30% 둔화시키며 이미 둔화 상태일 경우 대신 0.5 초간 속박시킨다.\n#돌진_7칸 #경로선상 피해_2타 #둔화 #속박\n\n(Shift+Left) 영웅 스킬 '망령된 검' (24s)\n저승의 한기를 뿜어내며 12 초간 주위를 '구천' 으로 만든다.\n'구천' 내의 적은 매 초마다 3 피해를 받고 2 회 적중시마다 1 초간 15% 둔화한다.\n'구천' : 효과 지속중 '레비아탄' 으로 적에게 피해를 줄 때마다 체력을 1 회복한다.\n#원형 범위 피해_10칸_1타x12 #둔화 #회복";

/* ── 심해를 꿰맨 척추 < 3 > ── */
defKit('wk2_spine',{name:'심해를 꿰맨 척추',kind:'무기',tier:3,atk:12,
  init(e){},
  skills:{
   n1:{name:'비선형적 타격',kind:'기본기',cd:2,r:5,cast(e){ S.arc(e,5,8,'비선형적 타격',{pull:1,v:'cut'}); }},
   n2:{name:'해갈의 가시',kind:'일반',cd:12,r:10,cast(e){ S.proj(e,e.aim,{speed:30,range:10,dmg:18,label:'해갈의 가시',v:'stake',o:{post:t=>{ add(t,'nojump',1,0,{by:e}); if(!t.c.heavy&&!e.dead){ t.x=e.x+e.aim.x*1.5; t.y=e.y+e.aim.y*1.5; clamp(t); } }}}); }}
  },note:"2026년 9월 카드('별빛이 닿지 않는 해구'의 1번 무기)다. 짧은 끌어당김은 1칸, 가시의 사거리는 10칸으로 정했다. 가시에 맞은 적은 시전자 바로 앞(1.5칸)으로 끌려온다."});
CARDTEXT.wk2_spine="무기 '심해를 꿰맨 척추' < 3 > / 무기 피해량 +12\n\n(Left) 기본기 '비선형적 타격' (2s)\n검을 전방으로 휘둘러 8 피해를 주고 짧게 끌어당긴다.\n#부채꼴 범위 피해_5칸_1타 #끌당_약\n\n(Right) 일반 스킬 '해갈의 가시' (12s)\n전방으로 척추의 가시를 쏘아내어 18 피해를 주며 자신 앞으로 끌어당긴다.\n명중한 적은 1 초간 점프가 불가능해진다.\n#직선투사체_1발_1타 #끌당 #점프불가\n\n상점가 : 24,000 코인 + 별무리의 흔적 30 개";

/* ── 귀퉁이 상실 < 3 > ── */
defKit('wk2_corner',{name:'귀퉁이 상실',kind:'무기',tier:3,atk:14,
  init(e){},
  /* 작은 상실: 때릴 때마다 그 적에게 '상실'이 쌓이고, 8이 찬 적을 때리면 모두 쓰고 0.5초 실명 */
  onDeal(e,t,amt,l,o){ if((o&&o.amp)||t.dead) return; if((t.wk2_corner_n||0)>=8){ t.wk2_corner_n=0; add(t,'blind',.5,0,{by:e}); } else t.wk2_corner_n=(t.wk2_corner_n||0)+1; },
  skills:{
   n1:{name:'짓무른 시야',kind:'영웅',cd:21,r:5,cast(e){ S.circle(e,5,26,'짓무른 시야',{knock:0,v:'quake',post:t=>{ add(t,'slow',2,.45,{by:e}); t.wk2_corner_n=8; }}); }}
  },note:"2026년 9월 카드('별빛이 닿지 않는 해구'의 2번 무기)다. '상실'은 맞는 적마다 따로 쌓인다. 짓무른 시야는 시전자 둘레 5칸이다."});
CARDTEXT.wk2_corner="무기 '귀퉁이 상실' < 3 > / 무기 피해량 +14\n\n(Passive) '작은 상실' (-)\n적 타격시마다 '상실' 을 누적시킨다. (최대 8)\n'상실' 이 최대치인 적 타격시 '상실' 을 모두 소모하고 해당 적을 0.5 초간 실명시킨다.\n\n(Right) 영웅 스킬 '짓무른 시야' (21s)\n지면을 내리찍어 짓무른 균열을 일으켜 명중한 적에게 26 피해를 준다.\n이후 해당 적은 2 초간 45% 둔화되며 즉시 '상실' 을 최대치까지 누적시킨다.\n#원형 범위 피해_5칸_1타 #둔화\n\n상점가 : 24,000 코인 + 별무리의 흔적 30 개";
