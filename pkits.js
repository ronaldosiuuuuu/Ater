"use strict";
/* 카드의 활성 권능을 키트로 옮긴 것. 수치는 카드 그대로이고, 카드에 없어 정한 것은 각 키트의 note에 적었다.
   여러 판이 있는 카드는 가장 늦은 판을 따랐다(神聖 - 힘 = < 6+ / 8+ >, 神聖 - 영웅 = 2번째 판 < 6 / 8+ >).
   e.r에 두는 값은 모두 키트 key로 시작한다. 키트는 다른 캐릭터에게 스킬·패시브로 섞여 들어가기 때문이다.
   '경직'은 시험장에 따로 없어 기절로 처리했다. */
{
const near=(e,r)=>foes(e).filter(t=>dist(e,t)<=r+(t.rad||R));
const strip=t=>{ if(t.dead) return; rm(t,'resist'); t.sh=[]; };                       /* 받는 피해 감소·보호막·저항 제거 */
const cdCut=(e,test,pct)=>{ for(const s in e.c.skills){ const k=e.c.skills[s]; if(k&&test(k)&&e.cd[s]>0) e.cd[s]*=1-pct; } };
const missing=t=>Math.max(0,t.max-t.hp);

/* ───────── 神聖 - 힘 ───────── */
const F='pk_force';
const feat=e=>e.r.pk_force_n||0;
const fUse=e=>{ if(feat(e)>=5){ e.r.pk_force_n=0; e.r.pk_force_a=0; } };                 /* 위업이 최대치면 시전 때 모두 소모 */
defKit(F,{name:'神聖 - 힘',kind:'권능',tier:6,col:'#e8b04a',
  init(e){ e.r.pk_force_n=0; e.r.pk_force_a=0; },
  hud:e=>'위업 '+feat(e)+'/5',
  tick(e,dt){ if(feat(e)>=5) return; e.r.pk_force_a=(e.r.pk_force_a||0)+dt; if(e.r.pk_force_a>=8){ e.r.pk_force_a-=8; e.r.pk_force_n=feat(e)+1; if(e.r.pk_force_n===3||e.r.pk_force_n===5) proc(e,'위업 재현','제약 해제 '+(e.r.pk_force_n===3?'1':'2')); } },
  skills:{
   n1:{name:'황소를 잡은 손아귀',kind:'권능',cd:12,r:5,cast(e){ const n=feat(e),a=n>=3,b=n>=5; fUse(e); const p0={x:e.x,y:e.y},dir={x:e.aim.x,y:e.aim.y};
      S.leap(e,dir,a?8:4,26,()=>{ const hit=S.seg(e,p0,{x:e.x,y:e.y},1.6,a?40:20,'황소를 잡은 손아귀',{knock:a?0:1.5,v:'punch'});
        if(b) hit.forEach(t=>{ if(t.dead) return; if(!t.c.heavy){ t.x=e.x+dir.x*1.2; t.y=e.y+dir.y*1.2; clamp(t); } strike(e,t,30,'황소를 잡은 손아귀 (제약-사자)',{stun:1.5,knock:0}); }); },true); }},
   n2:{name:'염소와 맞선 다리',kind:'권능',cd:12,r:5,cast(e){ const n=feat(e),a=n>=3,b=n>=5; fUse(e);
      S.leap(e,e.aim,4,20,()=>{ S.circle(e,a?6:4,a?37.5:25,'염소와 맞선 다리',{knock:0,v:'quake',air:a?3:0,post:t=>{ if(b) after(a?.6:.05,()=>{ if(e.dead||t.dead) return; strike(e,t,x=>x.max*.05,'염소와 맞선 다리 (제약-염소)',{root:.5,knock:0}); t.vz=Math.min(t.vz||0,-12); }); }}); }); }},
   aw:{name:'사자를 꺾은 주먹',kind:'권능',cd:16,r:4,cast(e){ const n=feat(e),a=n>=3,b=n>=5; fUse(e); const hits=6+(a?4:0)+(b?6:0),got=new Map(); S.focus(e,hits*.09);
      for(let i=0;i<hits;i++) after(i*.09,()=>{ if(e.dead) return; S.line(e,4,5,'사자를 꺾은 주먹',{knock:0,v:'punch',post:t=>{ got.set(t,(got.get(t)||0)+1); if(a) heal(e,3,true); if(b) add(t,'slow',2,.15,{by:e,end:()=>{}}); }}); });
      after(hits*.09+.05,()=>{ if(e.dead) return; got.forEach((c,t)=>{ if(c>=10&&!t.dead) knock(t,e,4); }); }); }},
   ult:{name:'양을 제압한 손끝',kind:'권능',cd:16,r:4,cast(e){ const n=feat(e),a=n>=3,b=n>=5; fUse(e);
      S.line(e,4,35,'양을 제압한 손끝',{knock:0,v:'stab',pre:t=>{ if(a) strip(t); },post:t=>{ if(!b) return; strike(e,t,x=>(x.max-x.hp)*.08,'양을 제압한 손끝 (제약-양)',{knock:0}); if(!t.dead&&t.hp<=t.max*.05&&!t.boss&&!t.c.mon){ say(t,'처형','#ff5a6e'); damage(e,t,t.hp+t.sh.reduce((s,x)=>s+x.v,0)+1,'양을 제압한 손끝 (처형)',{fixed:true}); } }}); }}
  },
  note:"2026년 6월 카드 < 6+ / 8+ > 판이다. 위업은 8초마다 1(최대 5). 각 권능에 적힌 두 제약 가운데 앞의 것은 위업 3 이상, 뒤의 것은 위업 5에서 풀린다고 읽었다. 위업이 5일 때 권능을 쓰면 두 제약이 모두 적용된 뒤 위업이 0이 된다. '붙잡아 끌고가며'는 돌진이 끝난 자리 앞으로 옮겨 놓는 것으로, '추락'은 띄운 적을 바로 떨어뜨리는 것으로 처리했다. 사자를 꺾은 주먹은 한 번에 5 피해(6회 30)이고 늘어난 횟수도 5씩이다. 밀치기는 짧게 1.5칸·크게 4칸, 띄우기는 3칸, 중첩 둔화는 2초로 정했다. 처형은 보스에게 듣지 않는다."});

/* ───────── 神聖 - 영웅 ───────── */
const H='pk_hero';
const hOn=e=>!(e.r.pk_hero_off>now);
defKit(H,{name:'神聖 - 영웅',kind:'권능',tier:6,col:'#ffd36b',
  init(e){ e.r.pk_hero_a=0; e.r.pk_hero_off=0; e.r.pk_hero_up=0; e.r.pk_hero_n=0; e.r.pk_hero_lion=0; e.r.pk_hero_cc=0; e.r.pk_hero_air=false; e.r.pk_hero_hit=false; },
  hud:e=>hOn(e)?(e.r.pk_hero_lion>now?'불굴 '+Math.ceil(e.r.pk_hero_lion-now)+'s':'神聖 - 영웅'):'비활성 '+Math.ceil(e.r.pk_hero_off-now)+'s',
  tick(e,dt){ if(!hOn(e)) return; e.r.pk_hero_a=(e.r.pk_hero_a||0)+dt; if(e.r.pk_hero_a>=1){ e.r.pk_hero_a-=1; heal(e,2,true); } if(e.r.pk_hero_up<=now) e.r.pk_hero_n=0; },
  modHeal:(e,amt)=>hOn(e)?amt*1.2:amt,
  modDeal:(e,t,amt)=>hOn(e)&&e.r.pk_hero_up>now?amt*(1+.02*e.r.pk_hero_n):amt,
  modTake(e,src,amt){ if(src===e||!hOn(e)) return amt; amt=Math.max(0,amt-2); if(e.r.pk_hero_lion>now) amt*=.8; return amt; },
  onStatus(e,k,t){ if(hOn(e)&&e.r.pk_hero_lion>now&&e.r.pk_hero_cc>0){ e.r.pk_hero_cc--; proc(e,'사자자리의 불굴','상태이상 무효'); return 0; } return t; },
  onHurt(e,src){ if(src!==e&&e.r.pk_hero_air) e.r.pk_hero_hit=true; },
  onDeal(e,t,amt,l,o){ if((o&&o.amp)||t.dead||!hOn(e)) return;
    { const s=t.st.find(q=>q.k==='vuln'&&q.pkh===e); if(s){ s.v=Math.min(.1,s.v+.02); s.until=now+3; } else add(t,'vuln',3,.02,{by:e,pkh:e,end:()=>{}}); }
    if(has(t,'pk_hero_mark')){ e.r.pk_hero_n=Math.min(5,(e.r.pk_hero_up>now?e.r.pk_hero_n:0)+1); e.r.pk_hero_up=now+3; }
    { const s=Object.keys(e.c.skills).find(q=>e.c.skills[q].name==='황소자리의 신위'); if(s&&e.cd[s]>0&&l!=='황소자리의 신위') damage(e,t,4,'섬전',{amp:true}); } },
  skills:{
   n1:{name:'양자리의 투쟁',kind:'권능',cd:15,r:5,can:hOn,need:'神聖 - 영웅 활성',cast(e){ SNAME.pk_hero_mark='표식'; S.arc(e,5,20,'양자리의 투쟁',{v:'punch',post:t=>add(t,'pk_hero_mark',6,0,{by:e})}); }},
   n2:{name:'염소자리의 등반',kind:'권능',cd:30,r:6,can:hOn,need:'神聖 - 영웅 활성',cast(e){ const bonus=Math.min(30,Math.floor(now/30)*15); e.r.pk_hero_air=true; e.r.pk_hero_hit=false;
      S.leap(e,e.aim,5,18,()=>{ e.r.pk_hero_air=false; const st=e.r.pk_hero_hit; if(st){ const t=near(e,6).sort((a,b)=>dist(e,a)-dist(e,b))[0]; if(t){ e.x=t.x-e.aim.x*.9; e.y=t.y-e.aim.y*.9; clamp(e); } } S.circle(e,3,30+bonus,'염소자리의 등반',{knock:0,zfree:true,v:'quake',stun:st?1:0}); }); e.vz=Math.sqrt(2*G*2.2); }},
   aw:{name:'황소자리의 신위',kind:'권능',cd:45,r:6,can:hOn,need:'神聖 - 영웅 활성',cast(e){ S.focus(e,.45); for(let i=0;i<4;i++) after(i*.12,()=>{ if(e.dead) return; S.arc(e,6,10,'황소자리의 신위',{knock:0,v:'bolt',el:'thunder',silence:i===3?2:0}); }); after(.5,()=>{ e.r.pk_hero_off=now+10; }); }},
   ult:{name:'사자자리의 불굴',kind:'권능',cd:60,r:8,can:hOn,need:'神聖 - 영웅 활성',cast(e){ fx.push({k:'circle',x:e.x,y:e.y,r:10,t0:now,team:e.team,lab:'사자자리의 불굴',src:e,v:'nova'}); near(e,10).forEach(t=>knock(t,e,4)); e.r.pk_hero_lion=now+5; e.r.pk_hero_cc=2; SNAME.pk_hero_awe='위압';
      zone(e,{x:e.x,y:e.y,r:6,dur:5,every:.25,chase:e,speed:99,label:'위압',tick:(z,inn)=>inn.forEach(t=>{ if(!has(t,'pk_hero_awe')){ add(t,'pk_hero_awe',.4,0,{by:e}); } else has(t,'pk_hero_awe').until=now+.4; { const nj=t.st.find(q=>q.k==='nojump'&&q.pkh===e); if(nj) nj.until=now+.4; else add(t,'nojump',.4,0,{by:e,pkh:e,self:true}); } const sl=t.st.find(q=>q.k==='slow'&&q.pkh===e); if(sl) sl.until=now+.4; else add(t,'slow',.4,.15,{by:e,pkh:e,end:()=>{}}); const dd=t.st.find(q=>q.k==='dealdown'&&q.pkh===e); if(dd) dd.until=now+.4; else add(t,'dealdown',.4,.15,{by:e,pkh:e,end:()=>{}}); })});
      after(5,()=>{ e.r.pk_hero_off=now+15; }); }}
  },
  note:"2026년 6월 카드 2번째 판 < 6 / 8+ >이다. '2 단계 이하의 무기/권능을 무시한다'와 '神聖 권능의 수에 따른 강화', '신성·권능을 제외한'이라는 단서는 시험장에 그 구분이 없어 빠졌다(받는 피해 2 감소는 모든 피해에 듣는다). 비활성화 중에는 패시브·섬전·피해 감소가 모두 꺼지고 이 권능의 스킬도 쓸 수 없다. 염소자리의 등반은 전투 30초마다 +15(최대 +30)이고, 떠 있는 동안 맞으면 6칸 안의 가장 가까운 적 앞으로 내려찍으며 1초 기절시킨다(강습 범위 6칸은 정했다). 황소자리의 신위는 4타에 10씩이고 침묵은 마지막 타에 건다. 섬전은 황소자리의 신위 자체의 타격에는 붙지 않는다. 사자자리의 불굴의 밀치기는 4칸으로 정했고, 위압은 6칸 원이 5초 동안 나를 따라다닌다."});

/* ───────── 神聖 - 정복 ───────── */
const C='pk_conq';
const cOn=e=>e.r.pk_conq_t>now;
const cNeed={can:cOn,need:"'정복' 상태"};
defKit(C,{name:'神聖 - 정복',kind:'권능',tier:7,col:'#5aa0ff',
  init(e){ e.r.pk_conq_n=0; e.r.pk_conq_t=0; e.r.pk_conq_z=null; },
  hud:e=>cOn(e)?'정복 '+Math.ceil(e.r.pk_conq_t-now)+'s':'패도 '+(e.r.pk_conq_n||0)+'/10',
  tick(e){ if(e.r.pk_conq_t&&e.r.pk_conq_t<=now){ e.r.pk_conq_t=0; e.r.pk_conq_n=0; cdCut(e,k=>k.kit===C||CONQ.has(k.name),.1); } },
  modDeal:(e,t,amt)=>amt*(1+.01*(e.r.pk_conq_n||0)),
  speedMod:e=>1+.01*(e.r.pk_conq_n||0),
  modTake(e,src,amt){ const z=e.r.pk_conq_z; return src!==e&&z&&z.until>now&&Math.hypot(e.x-z.x,e.y-z.y)<=z.r?amt*.7:amt; },
  onStatus(e,k,t){ const z=e.r.pk_conq_z; return (k==='root'||k==='stun')&&z&&z.until>now&&Math.hypot(e.x-z.x,e.y-z.y)<=z.r?0:t; },
  onDeal(e,t,amt,l,o){ if(o&&o.amp) return; if(cOn(e)){ if(!t.dead) damage(e,t,2,'정복',{amp:true}); heal(e,2,true); } else { e.r.pk_conq_n=Math.min(10,(e.r.pk_conq_n||0)+1); if(e.r.pk_conq_n>=10){ e.r.pk_conq_t=now+5; proc(e,'정복','5초'); } } },
  onKill(e,t){ const z=e.r.pk_conq_z; if(z&&z.until>now&&Math.hypot(t.x-z.x,t.y-z.y)<=z.r+R){ heal(e,e.max*.25); for(const s in e.c.skills) if(e.c.skills[s].name==='세계에 아로새기는 자') e.cd[s]=0; proc(e,'신역 - 정복','체력 25% 회복'); } },
  skills:{
   n1:Object.assign({name:'일기소탕',kind:'권능',cd:15,r:5,cast(e){ S.line(e,5,30,'일기소탕',{knock:4,v:'wave'}); }},cNeed),
   n2:Object.assign({name:'천하질주',kind:'권능',cd:30,r:10,cast(e){ const p0={x:e.x,y:e.y}; S.leap(e,e.aim,10,34,()=>S.seg(e,p0,{x:e.x,y:e.y},1.8,40,'천하질주',{stun:1,knock:0,v:'flame',el:'fire'}),true); }},cNeed),
   aw:Object.assign({name:'천동지괴',kind:'권능',cd:60,r:10,cast(e){ S.focus(e,.7); [[8,30,2],[10,20,1.5],[12,20,1]].forEach((w,i)=>after(i*.3,()=>{ if(e.dead) return; S.arc(e,w[0],w[1],'천동지괴',{half:65,stun:w[2],knock:0,v:'quake'}); })); }},cNeed),
   ult:Object.assign({name:'정복의 신위',kind:'권능',cd:90,r:8,cast(e){ const hit=S.circle(e,8,50,'정복의 신위',{stun:1.5,knock:0,v:'nova'}); strip0(hit); for(let i=1;i<=6;i++) after(i,()=>{ if(!e.dead) strip0(hit); }); }},cNeed),
   x1:Object.assign({name:'세계에 아로새기는 자',kind:'권능',cd:180,r:12,cast(e){ e.r.pk_conq_z=zone(e,{x:e.x,y:e.y,r:12,dur:12.05,every:2,label:'신역 - 정복',tick:(z,inn)=>inn.forEach(t=>{ damage(e,t,15,'세계에 아로새기는 자'); if(!t.dead) knock(t,z,-2); })}); proc(e,'신역 - 정복','12초'); }},cNeed)
  },
  note:"2026년 10월 카드 < 7 >이다. 권능 스킬은 모두 '정복' 상태(패도 10 → 5초)에서만 쓸 수 있다. '정복'이 끝나면 패도를 모두 잃고 이 권능 스킬들의 남은 재사용 대기시간이 10% 줄어든다. 경직은 기절로 처리했다(정복의 신위의 '이미 경직이면 기절'은 그래서 따로 차이가 없다). 일기소탕의 '크게 밀어낸다'는 4칸, 신역의 끌어당김은 2칸, 천동지괴의 세 충격파는 0.3초 간격으로 정했다. 신역은 펼친 자리에 12초 남는다."});
const CONQ=new Set(['일기소탕','천하질주','천동지괴','정복의 신위','세계에 아로새기는 자']);
function strip0(L){ L.forEach(strip); }

/* ───────── 천변만화의 별 ───────── */
const ST='pk_star';
const sAdd=(e,k,n,roll)=>{ const f='pk_star_'+k; e.r[f]=Math.min(100,(e.r[f]||0)+n); if(roll&&Math.random()<.33) e.r.pk_star_grief=Math.min(100,(e.r.pk_star_grief||0)+1); };
const sHas=e=>e.r&&e.r.pk_star_hope!==undefined;
const sEnh=e=>{ const on=!!e.r.pk_star_enh; if(on){ e.r.pk_star_enh=false; e.r.pk_star_hope=e.r.pk_star_despair=e.r.pk_star_grief=0; } return on; };
on('cast',(e,slot)=>{ if(slot==='b'||slot==='jump') return; for(const o of ents){ if(o.dead||!sHas(o)) continue; if(o===e||o.team!==e.team) sAdd(o,'despair',1,true); } });
defKit(ST,{name:'천변만화의 별',kind:'권능',tier:8,col:'#c9a0ff',
  init(e){ e.r.pk_star_hope=0; e.r.pk_star_despair=0; e.r.pk_star_grief=0; e.r.pk_star_king=0; e.r.pk_star_goblin=0; e.r.pk_star_shot=0; e.r.pk_star_enh=false; e.r.pk_star_a=0; e.r.pk_star_b=0; e.r.pk_star_ke=false; e.r.pk_star_ge=false; e.r.pk_star_se=false; e.r.pk_star_cnt=0; e.r.pk_star_arm=false; e.r.pk_star_bul=0; },
  hud:e=>'희망 '+e.r.pk_star_hope+' · 절망 '+e.r.pk_star_despair+' · 비탄 '+e.r.pk_star_grief+(e.r.pk_star_king>now?' · 몽환의 왕':'')+(e.r.pk_star_goblin>now?' · 이매망량의 왕':'')+(e.r.pk_star_shot>now?' · 마탄의 사수':''),
  tick(e,dt){ e.r.pk_star_a+=dt; if(e.r.pk_star_a>=1){ e.r.pk_star_a-=1; sAdd(e,'grief',1); } e.r.pk_star_b+=dt; if(e.r.pk_star_b>=5){ e.r.pk_star_b-=5; if(e.r.pk_star_hope>=50) heal(e,5,true); if(e.r.pk_star_despair>=50&&e.hp>1) e.hp=Math.max(1,e.hp-5); } },
  speedMod:e=>e.r.pk_star_goblin>now?1.1:1,
  modTake(e,src,amt,l,o){ if(src!==e&&e.r.pk_star_king>now&&!(o&&o.fixed)&&Math.random()<(e.r.pk_star_ke?.12:.05)){ say(e,'회피','#ffe9a0'); return 0; } return amt; },
  onHurt(e,src){ if(src!==e) sAdd(e,'hope',1,true); },
  onCast(e,s){ if(s==='b'||s==='jump'||s==='crouch') return; if(e.r.pk_star_shot>now&&(e.r.pk_star_se||e.r.pk_star_arm)){ e.r.pk_star_arm=false; e.r.pk_star_bul=now+2.5; } },
  onDeal(e,t,amt,l,o){ if(o&&o.amp) return; sAdd(e,'hope',1,true);
    if(e.r.pk_star_goblin>now&&e.r.pk_star_ge&&amt>0) heal(e,amt*.1,true);
    if(e.r.pk_star_shot>now){ if(e.r.pk_star_bul>now&&!(o&&o.basic)&&!t.dead) damage(e,t,missing(t)*(e.r.pk_star_se?.06:.04),'마탄',{amp:true}); if(++e.r.pk_star_cnt>=4){ e.r.pk_star_cnt=0; e.r.pk_star_arm=true; } } },
  skills:{
   n1:{name:'호접지몽',kind:'신화 스킬',cd:90,r:99,cast(e){ e.r.pk_star_hope=e.r.pk_star_despair=e.r.pk_star_grief=100; e.r.pk_star_enh=true; proc(e,'호접지몽','다음 꿈 강화'); }},
   n2:{name:'불완전한 꿈',kind:'각성 스킬',cd:45,r:8,can:e=>e.r.pk_star_hope>=100,need:'희망 100',cast(e){ e.r.pk_star_hope=0; const E=sEnh(e); e.r.pk_star_king=now+20; e.r.pk_star_ke=E; shield(e,E?100:20,20); if(E) S.circle(e,10,25,'불완전한 꿈',{stun:1,knock:0,v:'nova'}); proc(e,'몽환의 왕','20초'); }},
   aw:{name:'불필요한 꿈',kind:'각성 스킬',cd:45,r:6,can:e=>e.r.pk_star_despair>=100,need:'절망 100',cast(e){ e.r.pk_star_despair=0; const E=sEnh(e); e.r.pk_star_goblin=now+20; e.r.pk_star_ge=E; proc(e,'이매망량의 왕','20초'); const p0={x:e.x,y:e.y};
      S.leap(e,e.aim,E?6:3,22,()=>{ if(!E) return; const h0=foes(e).map(t=>[t,t.hp]); S.seg(e,p0,{x:e.x,y:e.y},1.8,50,'불필요한 꿈',{knock:0,v:'cut',post:t=>{ if(!t.c.heavy){ t.x=e.x-e.aim.x*1.2; t.y=e.y-e.aim.y*1.2; clamp(t); } }}); let sum=0; h0.forEach(([t,h])=>{ sum+=Math.max(0,h-Math.max(0,t.hp)); }); if(sum>0) heal(e,sum); }); }},
   ult:{name:'무의미한 꿈',kind:'각성 스킬',cd:45,r:6,can:e=>e.r.pk_star_grief>=100,need:'비탄 100',cast(e){ e.r.pk_star_grief=0; const E=sEnh(e); e.r.pk_star_shot=now+20; e.r.pk_star_se=E; e.r.pk_star_cnt=0; e.r.pk_star_arm=false; e.r.pk_star_bul=0; proc(e,'마탄의 사수','20초'); S.leap(e,e.aim,3,22); }},
   x1:{name:'깨어진 환상',kind:'초월 스킬',cd:60,r:9,can:e=>e.r.pk_star_king>now||e.r.pk_star_goblin>now||e.r.pk_star_shot>now,need:'몽환의 왕 · 이매망량의 왕 · 마탄의 사수 가운데 하나',cast(e){ const k=e.r.pk_star_king>now,g=e.r.pk_star_goblin>now,s=e.r.pk_star_shot>now; e.r.pk_star_king=e.r.pk_star_goblin=e.r.pk_star_shot=0; e.r.pk_star_bul=0; e.r.pk_star_arm=false;
      const hit=S.circle(e,9,50,'깨어진 환상',{knock:0,v:'nova',silence:g?2:0});
      if(k){ sAdd(e,'despair',20); sAdd(e,'grief',20); add(e,'invuln',1); } if(g){ sAdd(e,'hope',20); sAdd(e,'grief',20); } if(s){ sAdd(e,'hope',20); sAdd(e,'despair',20); hit.forEach(t=>{ if(!t.dead) damage(e,t,missing(t)*.13,'깨어진 환상 (마탄)',{amp:true}); }); }
      cdCut(e,q=>q.kit&&CH[q.kit]&&CH[q.kit].kname==='여섯 세계의 자리',.1); }}
  },
  note:"2026년 4월 카드 < 8 / 9 >이다. 기원 '헛된 꿈'(미몽의 군주로 우화)은 빠졌다. '절망'은 나와 적이 스킬·권능을 쓸 때마다 1(기본 공격·점프는 세지 않는다), '희망'은 타격·피격마다 1, '비탄'은 매초 1이고 희망·절망을 얻을 때마다 33%로 1 더 얻는다. 호접지몽으로 강화된 꿈을 쓰면 그때 세 수치를 모두 잃는다. 불완전한 꿈의 보호막은 20초 동안 남는다. 강화된 불필요한 꿈의 끌어당김은 도약이 끝난 내 뒤로 옮겨 놓는 것으로 처리했다. 마탄은 4회 적중 뒤 다음에 쓰는 스킬 하나(2.5초 안의 적중)에 실리고, 강화 중에는 모든 스킬에 실린다. 깨어진 환상은 그때 켜져 있던 상태를 모두 풀고 각각의 효과를 준다. '여섯 세계의 자리'의 재사용 대기시간 10% 감소는 그 무기의 스킬을 함께 갖고 있을 때만 듣는다. 대전표(자동 대전)에서는 적의 시전으로 얻는 절망이 세어지지 않는다."});

/* ───────── 역설 - 전지무능 ───────── */
const P='pk_paradox';
defKit(P,{name:'역설 - 전지무능',kind:'권능',tier:6,col:'#f3e7c0',
  init(e){ e.r.pk_paradox_still=0; },
  hud:e=>e.r.pk_paradox_still>=3?'시전 가능':'가만히 '+Math.min(3,e.r.pk_paradox_still||0).toFixed(1)+'/3s',
  tick(e,dt){ if(e.mv.x||e.mv.y||e.dash) e.r.pk_paradox_still=0; else e.r.pk_paradox_still=(e.r.pk_paradox_still||0)+dt; },
  skills:{
   n1:{name:'역설 - 전지무능',kind:'권능',cd:180,r:10,can:e=>e.r.pk_paradox_still>=3,need:'3초간 움직이지 않음',cast(e){ S.focus(e,1.5); after(1.5,()=>{ if(e.dead) return; proc(e,'역설의 경계','5초');
      zone(e,{x:e.x,y:e.y,r:10,dur:5,every:.25,label:'역설의 경계',tick:(z,inn)=>inn.forEach(t=>{ const s=has(t,'silence'); if(s&&s.pkp===e) s.until=now+.4; else add(t,'silence',.4,0,{by:e,pkp:e,self:true}); })}); }); }}
  },
  note:"2026년 3월 카드 < 6 >이다. 시험장에는 남의 권능 시전을 가로채 되쏘는 장치가 없어, '5단계 이하 권능을 취소하고 70% 위력으로 되쓴다'는 줄은 옮기지 못했다. 대신 경계(10칸, 5초) 안의 적은 스킬을 쓸 수 없다(침묵). 기본 공격은 된다. 경계의 침묵은 상태이상 지속 감소의 영향을 받지 않는다. 경계는 펼친 자리에 남는다."});

/* ───────── 질풍보 (준족지체 번외) ───────── */
defKit('pk_gale',{name:'질풍보',kind:'권능',tier:4,col:'#9fe6c0',
  skills:{ n1:{name:'질풍보',kind:'일반 스킬',cd:8,r:6,ai:(e,d)=>d>3.5&&d<8,cast(e){ S.leap(e,moveDir(e),4,26); }} },
  note:"2026년 9월 '준족지체' 카드의 번외 조건으로 얻는 일반 스킬이다. 바라보는 방향(움직이고 있으면 움직이는 방향)으로 4칸 도약한다."});

/* ───────── 신체 강화 1단계 - 개혈 ───────── */
defKit('pk_body1',{name:'신체 강화 (1단계 - 개혈)',kind:'권능',tier:1,col:'#ff9aa5',
  init(e){ e.r.pk_body1_t=0; },
  speedMod:e=>e.r.pk_body1_t>now?1.1:1,
  modDeal:(e,t,amt)=>e.r.pk_body1_t>now?amt*1.05:amt,
  skills:{ n1:{name:'신체 강화',kind:'권능',cd:60,r:6,ai:(e,d)=>d<=6&&e.hp>e.max*.3,cast(e){ pay(e,Math.round(e.hp*.08)); e.r.pk_body1_t=now+3; proc(e,'개혈','3초'); }} },
  note:"2026년 9월 카드 2번째 판 < 1 / 5 >의 '1 단계 - 개혈'이다. 현재 체력의 8%를 소모하고 3초간 이동속도 10%, 주는 모든 피해 5% 증가."});

/* 키트의 스킬마다 어느 키트 것인지 적어 둔다(재사용 대기시간을 묶어서 줄일 때 쓴다) */
for(const k of [F,H,C,ST,P,'pk_gale','pk_body1']){ for(const s in CH[k].skills) CH[k].skills[s].kit=k; }

Object.assign(CARDTEXT,{
 pk_force:"권능 '神聖 - 힘' < 6+ / 8+ >\n\n(Passive) '위업 재현' (-)\n전투 중 8 초마다 '위업' 을 1 쌓는다. (최대 5)\n'위업' 보유량이 3/5 이상일 때마다 각각 제약을 해제한다.\n권능 시전 시 '위업' 이 최대치일 시 이를 모두 소모한다.\n#스택형 #강제소모\n\n(Left) 권능 '황소를 잡은 손아귀' (12s)\n주먹을 내지르며 전방으로 돌진해 20 피해를 주고 적을 짧게 밀어낸다.\n'제약-양' : 돌진 거리 및 피해량이 100% 증가하며 더 이상 적을 밀어내지 않는다.\n'제약-사자' : 명중한 적들을 붙잡아 끌고가며 30 피해를 주고 1.5초간 기절시킨다.\n#경로선상 피해_1타 #돌진_4칸 #효과강화 #그랩_지속 #기절\n\n(Right) 권능 '염소와 맞선 다리' (12s)\n전방으로 도약한 뒤 하강하며 지면을 내리찍어 25 피해를 준다.\n'제약-황소' : 범위 및 피해량이 50% 증가하며 적중 시 해당 적을 띄운다.\n'제약-염소' : 이후 최대 체력의 5% 피해를 주며 추락시키고 0.5 초간 속박시킨다.\n#도약_4칸 #낙하_강 #원형 범위 피해_4칸_1타 #효과강화 #최체비 #추락_강 #속박\n\n(Shift+Left) 권능 '사자를 꺾은 주먹' (16s)\n전방으로 연격을 퍼부어 6 회에 걸쳐 30 피해를 준다.\n연격 종료 후 적이 10 회 이상 피격당했을 시 적을 크게 밀어낸다.\n'제약-염소' : 연격 횟수 4 증가, 적중시마다 자신의 체력을 3 회복한다.\n'제약-사자' : 연격 횟수 6 증가, 적중시마다 적에게 중첩되는 둔화를 15% 적용한다.\n#직선 피해_4칸_6타 #효과강화 #회복 #둔화_중첩 #밀치기_강\n\n(Shift+Right) 권능 '양을 제압한 손끝' (16s)\n전방으로 수도를 내질러 명중한 적에게 35 피해를 준다.\n'제약-사자' : 적중시 해당 적의 받는 피해 감소 및 보호막, 저항 효과를 제거한다.\n'제약-양' : 추가로 잃은 체력의 8% 피해를 주며 체력이 5% 이하일 시 처형한다.\n#직선 피해_4칸_1타 #버프제거 #잃체비 #처형",
 pk_hero:"권능 '神聖 - 영웅' < 6 / 8+ >\n\n'神聖' 권능의 수에 따라 이하의 모든 효과가 강화된다.\n\n(Passive) 권능 '뱀주인자리의 불사' (-)\n2 단계 이하의 모든 무기/권능에 대한 피해 및 그 효과를 무시한다.\n매 초마다 체력을 2 회복하며 영구적으로 받는 회복 효과가 20% 증가한다.\n적 타격시마다 3 초간 적이 받는 모든 피해를 2% 증가시킨다. (최대 10%)\n#피해/효과무시 #회복 #받회증 #받피증\n\n(Left) 권능 '양자리의 투쟁' (15s)\n주먹을 내리쳐 전방에 20 피해를 주고 명중한 적에게 6 초간 '표식' 을 남긴다.\n'표식' 이 부여된 적 타격시마다 3 초간 자신이 주는 모든 피해가 2% 상승한다. (최대 10%)\n#부채꼴 범위 피해_5칸_1타 #조건부 #주피증\n\n(Right) 권능 '염소자리의 등반' (30s)\n지면을 박차고 도약한 뒤 착지 시점에 전방을 내리찍어 30 피해를 준다.\n전투 시간 30 초 경과시 해당 권능의 피해량이 15 증가한다. (최대 +30)\n체공 중 피격될 시, 범위 내의 적에게 강습하여 추가로 1 초간 기절시킨다.\n#도약(위)_5칸 #원형 범위 피해_3칸_1타 #조건부_피해증가 #조건부_순간이동 #기절\n\n(Shift+Left) 권능 '황소자리의 신위' (45s)\n재사용 대기시간 중 적 타격시마다 '섬전' 이 일며 4 추가 피해를 준다.\n시전시 전방을 타격하며 퍼져나가는 벼락을 일으켜 40 피해를 주고 2 초간 침묵시킨다.\n스킬 시전 후 10 초간 권능 '神聖 - 영웅' 의 모든 효과를 비활성화한다.\n#조건부_추가피해 #부채꼴 범위 피해_6칸_4타 #비활성화\n\n(Shift+Right) 권능 '사자자리의 불굴' (60s)\n신성, 권능을 제외한 받는 모든 피해가 영구적으로 2 감소한다.\n시전시 주변 적을 강하게 밀어내고 5 초간 권능을 휘감아 주변 적을 '위압' 한다.\n지속 중 받는 모든 피해가 20% 감소하며 상태이상 적용 시 2 회에 한해 무효화한다.\n스킬 효과 종료 후 15 초간 권능 '神聖 - 영웅' 의 모든 효과를 비활성화한다.\n'위압' : 이동 속도 및 주는 모든 피해가 15% 감소하며 점프가 불가능하다.\n#원형 범위 밀치기_10칸 #원형 범위 효과_6칸 #받피감 #CC무효화 #비활성화 #둔화 #주피감",
 pk_conq:"권능 '神聖 - 정복' < 7 >\n\n(Passive) '정복' (-)\n적 타격시마다 '패도' 를 1 쌓는다. (최대 10)\n'패도' 가 최대치에 달할 시, 5 초간 '정복' 상태에 진입한다.\n'정복' 종료 시 '패도' 를 모두 소모하고 해당 권능의 모든 재사용 대기시간을 10% 감소시킨다.\n'패도' : 주는 모든 피해 및 이동 속도가 1% 증가한다. (최대 10%)\n'정복' : 적 타격시마다 2 추가 피해를 주고 자신의 체력을 2 회복한다.\n#스택형 #주피증 #조건부 #추가피해_1타 #회복 #재사용_대기시간\n\n(Left) 권능 '일기소탕' (15s)\n'정복' 상태일 때만 시전할 수 있다.\n거센 압력을 전방으로 내질러 명중한 적에게 30 피해를 주고 크게 밀어낸다.\n#조건부 #직선 범위 피해_5칸_1타 #밀치기_강\n\n(Right) 권능 '천하질주' (30s)\n'정복' 상태일 때만 시전할 수 있다.\n푸른 불꽃을 휘감아 전방으로 돌격하며 경로상의 적에게 40 피해를 입히고 1 초간 기절시킨다.\n#조건부 #돌진_10칸 #경로선상 피해_1타 #기절 #CC기\n\n(Shift+Left) 권능 '천동지괴' (60s)\n'정복' 상태일 때만 시전할 수 있다.\n지면을 강하게 타격하며 전방으로 세 차례 퍼져나가는 충격파를 일으킨다.\n충격파에 명중한 적에게 각각 30/20/20 피해를 주고 2/1.5/1 초간 경직시킨다.\n#조건부 #부채꼴 범위 피해(130)_8/10/12칸_1타x3회 #거리비례_경직\n\n(Shift+Right) 권능 '정복의 신위' (90s)\n'정복' 상태일 때만 시전할 수 있다.\n압력을 방출해 주변 적에게 50 피해를 주고 1.5 초간 경직시킨다. (이미 경직 상태였다면 기절시킨다.)\n이후 6 초간 매 초마다 해당 적의 받는 피해 감소 및 보호막, 저항 효과를 지속적으로 무력화한다.\n#조건부 #원형 범위 피해_8칸_1타 #경직 #기절 #효과무력화\n\n(Shift+Shift) 권능 '세계에 아로새기는 자' (180s)\n'정복' 상태일 때만 시전할 수 있다.\n지면에 대검을 내리꽂으며 12 초간 지속되는 '신역 - 정복' 을 전개한다.\n이후 '신역 - 정복' 내의 적에게 2 초마다 15 피해를 주고 중심을 향해 끌어당긴다.\n영역 지속 중 적이 사망할 시 최대 체력의 25%를 회복하고 이 권능의 재사용 대기시간을 초기화한다.\n'신역 - 정복' : 범위 내 시전자는 받는 모든 피해가 30% 감소하며 속박 및 기절에 면역 상태가 된다.\n#조건부 #원형 범위 효과_12칸 #원형 범위 피해_12칸_1타x6회 #끌당_중 #최체회 #재사용_대기시간 #받피감 #면역",
 pk_star:"권능 '천변만화의 별' < 8 / 9 >\n\n패시브 '가능성'\n적 타격/피격시마다 '희망' 을 1 얻는다. (최대 100)\n적 및 자신이 기본기/스킬/권능 시전시마다 '절망' 을 1 얻는다. (최대 100)\n매 초마다 '비탄' 을 1 얻는다. (최대 100)\n'희망' 이 50 이상일 시, 5 초마다 체력을 5 회복한다.\n'절망' 이 50 이상일 시, 5 초마다 체력을 5 소모한다.\n'희망/절망' 획득 시마다 33% 확률로 '비탄' 을 1 얻는다.\n#스택형 #체력회복 #조건부 #체력감소\n\n(Left) 신화 스킬 '호접지몽' (90s)\n'희망/절망/비탄' 을 100 얻는다.\n다음으로 시전하는 '불완전한 꿈/불필요한 꿈/무의미한 꿈' 이 강화된다.\n해당 스킬 시전 후 '희망/절망/비탄' 을 모두 잃는다.\n#스택충전 #강화 #스택소모\n\n(Right) 각성 스킬 '불완전한 꿈' (45s)\n'희망' 이 최대치일 시 이를 모두 소모한다.\n이후 20 초간 '몽환의 왕' 상태가 되며 20 보호막을 얻는다.\n'몽환의 왕' : 효과 지속중 피격시 5% 확률로 이를 회피한다.\n'강화(호접지몽)' : 보호막이 80 증가하며 주변 적에게 25 피해를 입히고 1 초간 기절시킨다.\n                 또한 효과 지속 중 회피 확률이 12% 로 증가한다.\n#조건부 #소모성 #회피 #원형 범위 피해_10칸_1타 #기절 #효과강화\n\n(Shift+Left) 각성 스킬 '불필요한 꿈' (45s)\n'절망' 이 최대치일 시 이를 모두 소모한다.\n이후 20 초간 '이매망량의 왕' 상태가 되며 전방으로 짧게 도약한다.\n'이매망량의 왕' : 효과 지속중 영구적으로 이동속도가 10% 증가한다.\n'강화(호접지몽)' : 도약거리가 2 배 증가하며 경로상의 적을 끌어당기고 50 피해를 입힌다.\n                 해당 효과로 준 피해만큼 즉시 체력을 회복한다.\n                 지속 중 기본기/스킬 시 주는 피해량의 10% 만큼 체력을 흡수한다.\n#조건부 #소모성 #도약_3칸 #가속 #효과강화 #끌당_1타 #흡혈\n\n(Shift+Right) 각성 스킬 '무의미한 꿈' (45s)\n'비탄' 이 최대치일 시 이를 모두 소모한다.\n이후 20 초간 '마탄의 사수' 상태가 되며 전방으로 짧게 도약한다.\n'마탄의 사수' : 기본기/스킬/권능 4 회 적중시마다 다음 스킬에 '마탄' 을 적용한다.\n'마탄' : 적중 시마다 대상이 잃은 체력의 4% 만큼의 추가 피해를 준다.\n'강화(호접지몽)' : 시전 후 사용하는 모든 스킬에 강제적으로 '마탄' 을 적용한다.\n                 지속 중 '마탄' 의 잃은 체력 비례 피해량이 6% 로 증가한다.\n#조건부 #소모성 #잃체비_추가피해_1타\n\n(Shift+Shift) 초월 스킬 '깨어진 환상' (60s)\n'몽환의 왕/이매망량의 왕/마탄의 사수' 상태일 시 시전할 수 있다.\n해당 상태를 즉시 해제하고 각 상태에 맞는 색의 파동을 일으켜 주변 적에게 50 피해를 준다.\n파동 발산시 추가로 해제했던 상태에 따라 이하의 효과를 적용한다.\n'몽환의 왕' : '절망/비탄' 을 각각 20 얻고, 시전자는 1 초간 '강림' 한다.\n'이매망량의 왕' : '희망/비탄' 을 각각 20 얻고, 주변 적을 2 초간 침묵시킨다.\n'마탄의 사수' : '희망/절망' 을 각각 20 얻고, 잃은 체력의 13% 추가 피해를 준다.\n이후 '여섯 세계의 자리' 의 모든 스킬의 재사용 대기시간을 10% 감소시킨다.\n'강림' : 효과 지속 중 고정 피해를 제외한 모든 피해를 받지 않는다.\n#조건부 #상태해제 #원형 범위 피해_9칸_1타 #스택회복 #무적 #침묵 #잃체비_1타 #재사용_대기시간\n\n(Shift+F) 기원 '헛된 꿈' (-)\n조건부 = '몽환의 왕' 상태일 시 시전 가능하다.\n'미몽의 군주' 로 우화한다. '헛된 것들의 장례' 를 사용할 수 있다.",
 pk_paradox:"권능 '역설 - 전지무능' (180s) ＜6＞\n> 시전 조건 - 전투 중 3 초간 움직이지 않았을 경우 시전 가능.\n1.5초간 정신을 집중하며 원형 범위 10칸 내에 5초간 지속되는 '역설의 경계' 를 펼친다.\n경계 내에서 5단계 이하의 권능이 시전될 시 이를 즉시 취소하고 '역설 : (권능명)' 을 얻는다.\n'역설 : (권능명)' 을 소모하여 취소된 권능을 70%의 위력으로 조건을 무시하고 즉시 시전한다.",
 pk_gale:"권능 '준족지체' < 4 >\n\n최종 이동속도가 12% 증가한다.\n\n@@번외 조건『질풍보』\n- 20 회 이상 승리할 것.\n- 위 조건 충족 후, 15,000 코인과 별무리의 흔적 20 개를 소모하여 습득.\n\n(Shift+Shift) 일반 스킬 '질풍보' (8s)\n바라보는 방향으로 빠르게 도약한다.\n#도약_4칸",
 pk_body1:"권능 '신체 강화' < 1 / 5 > (60s)\n\n'1 단계 - 개혈'\n현재 체력의 8% 를 소모한다.\n이후 3 초간 이동속도가 10%, 주는 모든 피해가 5% 증가한다.\n#현체비 #가속 #주피증"
});
}
