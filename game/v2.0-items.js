"use strict";
/* ════════════════ 2.0 등반: 새 권능 · 시너지 문장 · 소속 인장 · 세트 장비 · 물약 · 고유 시너지 ════════════════
   시너지 뼈대는 game/v2.0.js. 여기는 그 위에 얹는 것들이다. 번호(id)는 한 번 정하면 바꾸지 않는다(저장해 둔 등반이 가리킨다).
   · 새 권능: POWERS['n:이름']. syn에 시너지를 직접 적는다. 층을 넘으며 자라는 것은 TW.grow에 센다.
   · 시너지 문장: POWERS['sg:시너지'] 30개(그 시너지 1점 + 주는 피해 2%).
   · 장비: 소속 인장 10개(장신구) · 세트 장비 2벌(조각 셋씩). GEAR 번호는 g203부터 차례로.
   · 물약: 주머니 두 칸(TW.pot). 보상 · 상인에서 얻고, 싸우는 중 물약 단추(PC는 F · G)로 쓴다. 횟수는 등반 한 판 기준, 쉼터에서 1회씩 되찾는다.
   · 고유 시너지: 신화 · 히든 캐릭터 11명(UNIQ). 그 캐릭터로 등반하면 늘 켜진다. */

const twGrow=(id,e)=>{ const B=typeof TW!=='undefined'&&TW?(e?twBagOf(e):TW):null; return (B&&B.grow&&+B.grow[id])||0; };
const twGrowAdd=(id,v,max,e)=>{ if(typeof TW==='undefined'||!TW||NET.client) return 0; const B=e?twBagOf(e):TW; if(!B) return 0; B.grow=B.grow||{}; const a=+B.grow[id]||0,b=Math.min(max,a+v); B.grow[id]=b; return b-a; };
const moving=e=>Math.hypot(e.mv.x,e.mv.y)>.1;

/* ── 새 권능 28개 ── [번호, 이름, 단계, 시너지, 수치(modHooks) 또는 null, 글(수치가 없을 때), 끼어들 자리] */
{ const N=(id,name,lv,syn,mods,text,hooks)=>{ const base=mods?modHooks(mods):{}; POWERS['n:'+id]=Object.assign(base,hooks||{},{name,lv,tier:String(lv),src:'2.0',syn,text:[base.text,text].filter(Boolean).join('\n')}); };
  N('굳은 주먹','굳은 주먹',1,['연격'],{atk:1});
  N('이슬','이슬',1,['생명'],{regen:1});
  N('기습','기습',2,['선봉'],{starthaste:[20,3]});
  N('칼날 바람','칼날 바람',3,['맹공','질풍'],null,'움직이는 동안 주는 피해 8% 증가.',{modDeal:(e,t,a)=>moving(e)?a*1.08:a});
  N('무쇠 비늘','무쇠 비늘',3,['철벽'],{take:6},'3번 맞을 때마다 보호막 10.',{onHurt(e,src,a,l,o,P){ if(src===e||(o&&o.amp)) return; P.n=(P.n||0)+1; if(P.n>=3){ P.n=0; shield(e,10,6); } }});
  N('마력 회로','마력 회로',3,['마탑'],{skill:7});
  N('가시 덩굴','가시 덩굴',3,['응징'],{thorns:2});
  N('불굴','불굴',3,['역경'],{lowregen:3});
  N('바람 신발','바람 신발',4,['질풍'],{speed:8},'3초 동안 멈추지 않으면 다음 기본 공격 피해 20% 증가.',{tick(e,dt,P){ P.mv=moving(e)?(P.mv||0)+dt:0; if(P.mv>=3) P.rdy=true; },modDeal(e,t,a,l,o,P){ if(o&&o.basic&&!o.amp&&P&&P.rdy){ P.rdy=false; P.mv=0; return a*1.2; } return a; }});
  N('사슬','사슬',4,['속박'],{onhit:['slow',.08,1,.3]});
  N('모래시계','모래시계',5,['연마'],null,'스킬을 쓸 때마다 다른 스킬의 재사용 대기시간 0.3초 감소.',{onCast(e,s){ if(s==='b'||s==='crouch'||s==='jump') return; for(const k in e.cd) if(k!=='b'&&k!==s&&e.cd[k]>0) e.cd[k]=Math.max(0,e.cd[k]-.3); }});
  N('사냥감 표식','사냥감 표식',5,['사냥'],null,'체력 비율이 가장 낮은 적에게 주는 피해 12% 증가.',{modDeal(e,t,a){ const L=foes(e); if(L.length<2) return a*1.12; return L.every(f=>f===t||f.hp/f.max>=t.hp/t.max)?a*1.12:a; }});
  N('피의 맹세','피의 맹세',6,['맹공'],null,'층을 넘을 때마다 주는 피해 1% 증가. (최대 15%)',{modDeal:(e,t,a)=>a*(1+twGrow('n:피의 맹세',e)/100)});
  N('천 번의 단련','천 번의 단련',6,['연격'],null,'기본 공격 100번마다 기본 공격 피해 +1. (최대 +10)',{basic(e,t,P){ P.n=(P.n||0)+1; if(P.n>=100){ P.n=0; if(twGrowAdd('n:천 번의 단련',1,10,e)) say(e,'단련 +1','#e3c377'); } },modDeal:(e,t,a,l,o)=>o&&o.basic&&!o.amp?a+twGrow('n:천 번의 단련',e):a});
  N('포식','포식',6,['사냥','생명'],null,'적을 쓰러뜨릴 때마다 체력 5 회복, 다음 층부터 최대 체력 +5. (최대 +100)',{onKill(e,t){ heal(e,5,true); if(typeof TW!=='undefined'&&TW&&!NET.client&&twGrowAdd('n:포식',5,100,e)){ const B=twBagOf(e); if(B) B.hpB=(B.hpB|0)+5; } }});
  N('잔상','잔상',6,['질풍','응징'],null,'받는 피해를 8% 확률로 피하고, 피하면 공격자에게 기본 공격의 50% 고정 피해.',{mods:{dodge:8},modTake(e,src,a,l,o){ if(src===e||!(a>0)||(o&&o.amp)||Math.random()>=.08) return a; say(e,'잔상','#ffe9a0'); if(!src.dead) damage(e,src,e.atk*.5,'잔상',{fixed:true,amp:true}); return 0; }});
  N('첫 일격','첫 일격',6,['선봉'],null,'싸움의 첫 스킬 피해가 2배가 된다.',{modDeal(e,t,a,l,o,P){ if(o&&(o.basic||o.amp)) return a; if(P&&!P.used){ P.used=now; } return P&&now-P.used<.6?a*2:a; }});
  N('요새','요새',7,['철벽'],null,'3초 동안 가만히 서 있으면 받는 피해 25% 감소. (움직이면 풀린다)',{tick(e,dt,P){ P.st=moving(e)?0:(P.st||0)+dt; },modTake:(e,src,a,l,o,P)=>src!==e&&P&&P.st>=3?a*.75:a});
  N('생명의 나무','생명의 나무',7,['생명','철벽'],null,'체력이 가득 찬 뒤의 회복은 보호막이 된다. (최대 체력의 20%까지)',{tick(e){ e._ovSh=true; }});
  N('시간 도둑','시간 도둑',7,['연마','사냥'],null,'적을 쓰러뜨리면 모든 재사용 대기시간 1초 감소.',{onKill(e){ for(const k in e.cd) if(k!=='b'&&e.cd[k]>0) e.cd[k]=Math.max(0,e.cd[k]-1); }});
  N('복수의 서약','복수의 서약',7,['응징','역경'],null,'내 체력이 50% 이하일 때 되돌리는 피해가 2배가 된다.',{tick(e){ e._vow=e.hp<=e.max*.5; }});
  N('배수진','배수진',7,['역경','맹공'],{rage:4},'받는 회복 효과 30% 감소.',{modHeal:(e,a)=>a*.7});
  N('프리즘','프리즘',8,[],null,'점수가 가장 높은 시너지에 1점을 더한다.');
  N('천벌','천벌',9,['속박','맹공'],null,'기절한 적에게 주는 피해 40% 증가.',{modDeal:(e,t,a)=>has(t,'stun')?a*1.4:a});
  N('두 갈래 길','두 갈래 길',9,[],null,'2단계 이상인 시너지가 둘 이상이면 그 시너지들이 한 단계 위 효과를 낸다.'); }
/* 스킬이 붙는 새 권능 둘 */
{ const K=(key,pid,name,lv,syn,sk)=>{ sk.kit=key; sk.kind='권능'; Object.defineProperty(CH,key,{value:{key,kit:true,kname:name,name:'권능, '+name,cls:'권능',grade:'권능',hp:500,atk:20,range:2.6,hud:()=>'',init(){},skills:{n1:sk}},enumerable:false,configurable:true}); if(typeof LOOK!=='undefined'&&!LOOK[key]) LOOK[key]={el:'steel',w:'sword',hair:'#9aa3b5',acc:[]};
    CARDTEXT[key]="권능 '"+name+"' ("+sk.cd+"s)\n"+sk.txt; POWERS['n:'+pid]={name,lv,tier:String(lv),src:'2.0',syn,kit:key,text:'활성 권능 · 스킬: '+name+'\n'+sk.txt}; };
  K('pk2_cry','전장의 함성','전장의 함성',6,['맹공','선봉'],{name:'전장의 함성',cd:20,r:6,txt:'6초간 나와 둘레 6칸 아군의 주는 피해 15% 증가.',ai:(e,d)=>d<=6,cast(e){ for(const a of twMates(e)) if(dist(a,e)<=6.5) a._cry=now+6; fx.push({k:'circle',x:e.x,y:e.y,r:6,t0:now,team:e.team,lab:'전장의 함성',src:e,v:'shout'}); proc(e,'전장의 함성','6초'); }});
  K('pk2_rewind','역류','역류',8,['연마'],{name:'역류',cd:45,r:99,txt:'다른 모든 스킬의 재사용 대기시간을 초기화한다.',ai:e=>Object.keys(e.cd).filter(k=>k!=='b'&&e.cd[k]>3).length>=2,cast(e){ const mine=Object.keys(e.c.skills).find(s=>e.c.skills[s]&&e.c.skills[s].name==='역류'); for(const k in e.cd) if(k!==mine&&k!=='b') e.cd[k]=0; proc(e,'역류','재사용 초기화'); }}); }
/* 시너지 문장 30개 */
for(const k of SYN_NAMES) POWERS['sg:'+k]=Object.assign(modHooks({deal:2}),{name:k+'의 문장',lv:4,tier:'4',src:'2.0',syn:[k],text:'「'+k+'」 시너지 1점.\n주는 모든 피해 2% 증가.'});
/* 프리즘: 가장 높은 시너지에 +1 */
function prismFix(n,ids){ if(!ids||!ids.includes('n:프리즘')) return; let best=null; for(const k of SYN_NAMES) if(n[k]&&(!best||n[k]>n[best])) best=k; if(best) n[best]++; }

/* ── 장비: 소속 인장 · 세트 ── */
const TWSET={폭풍:{name:'폭풍 기사',t2:'이동속도 +8%',t3:'6초마다 다음 기본 공격이 번개가 되어 둘레 3칸에 기본 공격의 100% 피해'},고목:{name:'고목의 수호',t2:'받는 회복 +15%',t3:'체력이 처음 30% 아래로 떨어지면 5초간 매 초 최대 체력의 4% 회복'}};
{ const G=(slot,g,name,mods,syn,extra,set)=>{ const id='g'+Object.keys(GEAR).length; GEAR[id]={id,slot,grade:GGR[g],gi:g,name,mods,src:'2.0',note:extra||undefined,set}; POWERS['@'+id]=Object.assign(modHooks(mods),{name,gear:true,lv:0,tier:GGR[g],syn}); return id; };
  for(const [nm,sy,m] of [['제국의 훈장','제국',{hp:30}],['소모라의 금화','소모라',{hp:10}],['판테온의 파편','판테온',{take:2}],['마탑의 패','마탑',{skill:3}],['부족의 뼈 목걸이','부족',{hp:40}],['용의 비늘','용족',{brave:4}],['극동의 매듭','극동',{basicP:3}],['기사단 문장','기사단',{barrier:20}],['명계의 등불','명계',{killheal:5}],['조개껍질 부적','바다',{speed:3}]])
    G('t',2,nm,m,[sy],'「'+sy+'」 시너지 1점'+(sy==='소모라'?' · 얻을 때 증표 +5':''));
  const S=(set,g,parts,syn)=>parts.forEach(([slot,nm,m])=>G(slot,g,nm,m,syn,TWSET[set].name+' 세트 · 2개: '+TWSET[set].t2+' · 3개: '+TWSET[set].t3,set));
  S('폭풍',4,[['w','폭풍 창',{atk:5,basicP:6}],['a','폭풍 갑옷',{hp:180}],['t','폭풍 깃',{speed:8,cdr:6}]],['뇌전','질풍']);
  S('고목',3,[['w','고목 지팡이',{atk:2,skill:12}],['a','고목 껍질',{hp:130,take:8}],['t','고목 씨앗',{regen:3,heal:15}]],['자연','철벽']); }
const twSetN=()=>{ const n={}; if(typeof TW!=='undefined'&&TW&&TW.gear) for(const s of ['w','a','t']){ const g=GEAR[TW.gear[s]]; if(g&&g.set) n[g.set]=(n[g.set]||0)+1; } return n; };
/* 세트를 하나 가지면 남은 조각이 보상 · 상인에 더 자주 나온다 */
{ const rg=rollGear; rollGear=function(f,up,skip){ try{ const n=twSetN(),own=Object.values(TW.gear||{}); for(const set in n){ if(n[set]>=3||Math.random()>.3) continue; const L=Object.values(GEAR).filter(g=>g.set===set&&!own.includes(g.id)&&!(skip&&skip.includes(g.id))&&g.gi<=twGearT(f,true)+1); if(L.length) return rnd(L).id; } }catch(x){} return rg.apply(this,arguments); }; }

/* ── 물약 ── [번호, 이름, 등급(0 공설~), 횟수, 글] */
const POT={};
for(const [id,name,g,n,text] of [['heal','회복 물약',0,2,'체력 20% 회복'],['rage','분노의 물약',1,1,'6초간 주는 피해 15% 증가'],['iron','철피 물약',1,1,'5초간 받는 피해 20% 감소'],['wind','바람 물약',1,2,'5초간 이동속도 25% 증가'],['pure','정화수',2,1,'상태이상을 모두 풀고 1.5초간 걸리지 않는다'],['fire','화염병',2,2,'앞 4칸 자리의 둘레 3칸에 기본 공격의 150% 피해 + 2초 화상'],['heal2','큰 회복 물약',3,1,'체력 40% 회복'],['time','시간 물약',4,1,'모든 스킬의 남은 재사용 대기시간 절반'],['feather','부활의 깃털',4,1,'쓰러지면 저절로 체력 30%로 일어난다(단추로 쓰지 않는다)']])
  { POT['pot:'+id]={id:'pot:'+id,name,g,n,text}; BOONS['pot:'+id]={name:'물약 · '+name,text:text+'.\n등반 한 판에 '+n+'번. 쉼터에서 1번씩 되찾는다. 주머니(두 칸)가 가득이면 둘째 칸과 바뀐다.',price:15+g*8,pot:true}; }
const twPots=()=>(typeof TW!=='undefined'&&TW&&Array.isArray(TW.pot)?TW.pot:[]);
function potFix(){ if(typeof TW==='undefined'||!TW) return; TW.pot=(Array.isArray(TW.pot)?TW.pot:[]).filter(p=>p&&typeof p==='object'&&hasK(POT,p.id)).slice(0,2).map(p=>({id:p.id,max:Math.max(1,Math.min(9,p.max|0)),n:Math.max(0,Math.min(9,p.n|0))})); for(const p of TW.pot) p.n=Math.min(p.n,p.max);
  const g=TW.grow&&typeof TW.grow==='object'?TW.grow:{},q={}; for(const k of Object.keys(g)) if(hasK(POWERS,k)&&Number.isFinite(+g[k])) q[k]=Math.max(0,Math.min(100,+g[k])); TW.grow=q; }
{ const gn=gain; gain=function(r){ if(r&&r.t==='boon'&&hasK(POT,r.id)){ const P=POT[r.id]; TW.pot=twPots(); const cur=TW.pot.find(p=>p.id===r.id); if(cur){ cur.max=Math.min(9,cur.max+P.n); cur.n=Math.min(cur.max,cur.n+P.n); } else { const it={id:r.id,n:P.n,max:P.n}; if(TW.pot.length>=2) TW.pot[1]=it; else TW.pot.push(it); } TW.picks.push(P.name); return; }
    const r0=gn.apply(this,arguments); try{ if(r&&r.t==='gear'&&GEAR[r.id]&&GEAR[r.id].name==='소모라의 금화') TW.gold+=5; }catch(x){} return r0; }; }
const potRoll=f=>{ const T=twGearT(f,true),L=Object.values(POT).filter(p=>p.g<=T); return L.length?rnd(L).id:null; };
/* 보상: 단련 · 연마 · 휴식 자리 하나가 가끔 물약이 된다 */
{ const rr=rollRewards; rollRewards=function(){ const L=rr.apply(this,arguments); try{ if(Math.random()<.3){ const i=L.findIndex(x=>x.t==='boon'),p=potRoll(TW.floor-1); if(i>=0&&p) L[i]={t:'boon',id:p}; } }catch(x){} return L; }; }
/* 상인: 물약 둘을 더 판다 · 쉼터: 물약을 1번씩 되찾는다 */
{ const tp=towerPath; towerPath=function(i){ const n=TW&&TW.fork&&TW.fork[i],r=tp.apply(this,arguments); try{ if(n&&n.t==='shop'&&TW.shop&&!TW.shop.some(x=>hasK(POT,x.id))){ const a=potRoll(TW.floor),b=potRoll(TW.floor),cut=TW.shopCut?.85:1; for(const id of [...new Set([a,b].filter(Boolean))]) TW.shop.push({t:'boon',id,price:Math.max(1,Math.round(BOONS[id].price*cut))}); twStore(); towerScreen(); }
      if(n&&n.t==='rest'){ for(const p of twPots()) p.n=Math.min(p.max,p.n+1); twStore(); towerScreen(); } }catch(x){} return r; }; }
/* 쓰기 */
/* 2.1: 물약은 쓴 사람에게만 든다. 손님은 방장에게 알려서 쓴다(u = 쓰는 사람) */
function potUse(i,u){ if(NET.client){ if(NET.twFight&&running&&NET.tx&&!u) NET.tx.send({t:'twc',a:'pot',i:i|0}); return; } u=u||me; const mine=u===me,tell=m=>{ if(mine) toast(m); }; if(!twLive()||over||!u||u.dead) return; const B=twBagOf(u),p=((B&&B.pot)||[])[i]; if(!p||p.n<=0) return tell('물약이 없다'); const P=POT[p.id]; if(p.id==='pot:feather') return tell('부활의 깃털은 쓰러질 때 저절로 쓰인다'); if(u._potCd>now) return; u._potCd=now+1; p.n--; const men=[u];
  for(const e of men){ switch(p.id){ case 'pot:heal': heal(e,e.max*.2); break; case 'pot:heal2': heal(e,e.max*.4); break; case 'pot:rage': e._potD=now+6; break; case 'pot:iron': add(e,'resist',5,.2,{self:true}); break; case 'pot:wind': add(e,'haste',5,.25,{self:true}); break;
      case 'pot:pure': e.st=e.st.filter(s=>!DEBUFFS.includes(s.k)); e._imm=now+1.5; break; case 'pot:time': for(const k in e.cd) if(k!=='b'&&e.cd[k]>0) e.cd[k]/=2; break; } }
  if(p.id==='pot:fire'){ const at={x:u.x+u.aim.x*4,y:u.y+u.aim.y*4}; S.circle(u,3,u.atk*1.5,'화염병',{knock:0,v:'flame',el:'fire',post:t=>{ if(!t.dead) t._burn={until:now+2,by:u,k:.5,acc:0}; }},at); }
  proc(u,P.name,P.text); twStore(); potBtn(); if(!mine&&typeof coTell==='function') coTell(u); }
/* 단추: 싸우는 화면 왼쪽 위(누르면 첫 칸, 길게 누르면 둘째 칸). PC는 F · G */
const potEl=(()=>{ const b=document.createElement('button'); b.type='button'; b.id='potb'; b.hidden=true; b.style.cssText='position:fixed;left:max(10px,env(safe-area-inset-left));top:calc(env(safe-area-inset-top,0px) + 96px);z-index:6;font:600 12px var(--body);line-height:1.35;color:var(--ink);background:rgba(10,14,32,.82);border:1px solid var(--gold);border-radius:12px;padding:7px 10px;text-align:left;white-space:pre-line;touch-action:manipulation'; document.body.appendChild(b);
  let t=0,long=false; const down=e=>{ long=false; clearTimeout(t); t=setTimeout(()=>{ long=true; potUse(1); },450); },up=e=>{ clearTimeout(t); if(!long) potUse(0); e.preventDefault(); };
  b.addEventListener('pointerdown',down); b.addEventListener('pointerup',up); b.addEventListener('pointerleave',()=>clearTimeout(t)); b.addEventListener('contextmenu',e=>e.preventDefault()); return b; })();
function potBtn(){ const L=NET.client?((NET.twMe&&NET.twMe.pot)||[]):twPots(),show=(NET.client?!!NET.twFight&&running:twLive())&&!over&&L.length>0; potEl.hidden=!show; if(!show) return; const pc=document.body.classList.contains('pc'); potEl.textContent=L.map((p,i)=>(pc?'FG'[i]+' ':i?'길게 ':'')+POT[p.id].name+' ×'+p.n).join('\n'); }
on('begin',()=>{ potFix(); potBtn(); }); on('end',()=>{ potEl.hidden=true; });
addEventListener('keydown',e=>{ if(e.repeat||!running||(e.code!=='KeyF'&&e.code!=='KeyG')) return; const a=document.activeElement; if(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return; potUse(e.code==='KeyF'?0:1); });
{ let acc=0; on('step',dt=>{ acc+=dt; if(acc>=.5){ acc=0; if(!potEl.hidden||twLive()||(NET.client&&NET.twFight&&running)) potBtn(); } }); }

/* ── 고유 시너지(신화 · 히든) ── 그 캐릭터로 등반하면 늘 켜진다 */
const UNIQ={
 max:['위대한 하나','적을 쓰러뜨리면 3초간 재사용 대기시간이 20% 빨리 돌고 기본 공격 피해 10% 증가'],
 max_r:['잃어 가는 자','매 초 둘레 3칸의 적에게 기본 공격의 15% 피해'],
 girl:['불가해','10초마다 가까운 적 하나에게 무작위 상태이상 1초(둔화 · 실명 · 쇠약 · 기절)'],
 girl_r:['궁창','15초마다 재사용 대기시간이 가장 많이 남은 스킬 하나를 바로 쓸 수 있다'],
 arthur:['성검 개방','스킬을 쓰면 3초간 받는 피해 15% 감소'],
 arthur_r:['여명','체력이 처음 30% 아래로 떨어지면 체력 20% 회복 + 4초간 주는 피해 25% 증가'],
 amon:['언령','스킬 피해 15% 증가'],
 alonso:['풍차 돌격','이동속도 15% 증가 · 받는 피해 10% 감소'],
 rasa:['천근','주는 피해 12% 증가'],
 cheongal:['부동심','2초 동안 가만히 서 있으면 받는 피해 20% 감소'],
 nagato:['잔상','스킬을 쓰면 2초간 이동속도 30% 증가 · 다음 공격 피해 30% 증가']};

/* ── 판 시작: 얹는 겹(물약 · 세트 · 고유 시너지 · 새 권능의 깃발) ── game/v2.0.js의 겹 위에 한 겹 더 */
on('begin',()=>{ if(!twOn()) return;
  for(const e of twMen()) twAs(e,()=>{ const ids=twIds(),setN=twSetN(),c0=e.c,n=Object.assign({},c0),U=hasK(UNIQ,e.key)?e.key:null,st={sec:0,t:0,still:0,bolt:0};
    if(U&&e===me) msg([['고유 시너지 ','#e3c377'],[UNIQ[U][0],'#fff6d6']],0,true);
    n.modDeal=(x,t,a,l,o)=>{ if(c0.modDeal) a=c0.modDeal(x,t,a,l,o); if(!(a>0)||x===t) return a; o=o||{}; let m=1; if(x._potD>now) m*=1.15; if(x._cry>now) m*=1.15;
      if(U==='max'&&x._uq>now&&o.basic) m*=1.1; if(U==='arthur_r'&&x._uq>now) m*=1.25; if(U==='amon'&&!o.basic&&!o.amp) m*=1.15; if(U==='rasa') m*=1.12; if(U==='nagato'&&x._uqN&&!o.amp){ x._uqN=false; m*=1.3; } return a*m; };
    n.modTake=(x,src,a,l,o)=>{ let v=c0.modTake?c0.modTake(x,src,a,l,o):a; if(src===x||!(v>0)) return v; if(U==='arthur'&&x._uq>now) v*=.85; if(U==='alonso') v*=.9; if(U==='cheongal'&&st.still>=2) v*=.8; return v; };
    n.speedMod=x=>(c0.speedMod?c0.speedMod(x):1)*((setN['폭풍']|0)>=2?1.08:1)*(U==='alonso'?1.15:1);
    n.modHeal=(x,a)=>{ if(c0.modHeal) a=c0.modHeal(x,a); return (setN['고목']|0)>=2?a*1.15:a; };
    n.onStatus=(x,k,t)=>{ if(x._imm>now) return 0; return c0.onStatus?c0.onStatus(x,k,t):t; };
    n.onKill=(x,t)=>{ if(c0.onKill) c0.onKill(x,t); if(U==='max'&&t&&t.team!==x.team) x._uq=now+3; };
    n.onCast=(x,s)=>{ if(c0.onCast) c0.onCast(x,s); if(s==='b'||s==='crouch'||s==='jump') return; if(U==='arthur') x._uq=now+3; if(U==='nagato'){ add(x,'haste',2,.3,{self:true}); x._uqN=true; } };
    n.basicBonus=(x,t)=>{ if(c0.basicBonus) c0.basicBonus(x,t); if((setN['폭풍']|0)>=3&&st.bolt>=6&&t&&!t.dead){ st.bolt=0; fx.push({k:'circle',x:t.x,y:t.y,r:3,t0:now,team:x.team,lab:'폭풍',src:x,v:'bolt',el:'thunder'}); for(const f of foes(x)) if(Math.hypot(f.x-t.x,f.y-t.y)<=3.5) damage(x,f,x.atk,'폭풍',{amp:true}); } };
    n.onFatal=(x,src)=>{ if(c0.onFatal&&c0.onFatal(x,src)) return true; const B=twBagOf(x),p=((B&&B.pot)||[]).find(q=>q.id==='pot:feather'&&q.n>0); if(p){ p.n--; x.hp=Math.round(x.max*.3); add(x,'invuln',1,0,{self:true}); proc(x,'부활의 깃털','체력 30%'); twStore(); if(x!==me&&typeof coTell==='function') coTell(x); return true; } return false; };
    n.tick=(x,dt)=>{ if(c0.tick) c0.tick(x,dt); if(x.dead) return; st.bolt+=dt; st.still=moving(x)?0:st.still+dt;
      if(U==='max'&&x._uq>now) for(const s in x.cd) if(s!=='b'&&x.cd[s]>0) x.cd[s]=Math.max(0,x.cd[s]-dt*.2);
      if(U==='arthur_r'&&!st.dawn&&x.hp<=x.max*.3){ st.dawn=true; heal(x,x.max*.2); x._uq=now+4; proc(x,'여명','4초'); }
      if((setN['고목']|0)>=3&&!st.wood&&x.hp<=x.max*.3){ st.wood=now+5; proc(x,'고목의 수호','5초'); }
      st.sec+=dt; if(st.sec<1) return; st.sec-=1; st.t++;
      if(st.wood>now) heal(x,x.max*.04,true);
      if(U==='max_r') for(const f of foes(x)) if(dist(x,f)<=3.5) damage(x,f,x.atk*.15,'잃어 가는 자',{amp:true});
      if(U==='girl'&&st.t%10===0){ const f=foes(x)[0]; if(f&&dist(x,f)<=9){ const k=rnd(['slow','blind','weak','stun']); add(f,k,1,k==='slow'?.3:0,{by:x}); proc(x,'불가해',SNAME[k]||k); } }
      if(U==='girl_r'&&st.t%15===0){ let best=null; for(const s in x.cd) if(s!=='b'&&s!=='crouch'&&x.c.skills[s]&&x.cd[s]>0&&(!best||x.cd[s]>x.cd[best])) best=s; if(best){ x.cd[best]=0; proc(x,'궁창',x.c.skills[best].name); } } };
    { const h0=c0.hud; n.hud=x=>{ let s=''; try{ s=h0?h0(x):''; }catch(z){} const L=s?[s]:[]; if(x._potD>now) L.push('분노'); if(x._cry>now) L.push('함성'); return L.join(' · '); }; }
    e.c=n; });
  /* 다시 서는 몸(보스 층 데스카운트)도 시너지 · 세트 · 고유 시너지가 얹힌 몸으로 */
  for(const e of twMen()) if(e.base0) e.base0=Object.assign({},e.base0,{c:e.c,max:e.max,atk:e.atk}); });
/* 다시 설 때: 그 사람의 권능으로 다시 채우고, 싸움 동안의 표시(시너지 단계 · 한 번뿐인 효과를 이미 썼는지)를 이어 받는다 */
{ const or=onRespawn; onRespawn=function(n,t){ const r=or.apply(this,arguments); try{ if(twOn()&&n&&t&&n.team===0&&(t===me||n.net)){ for(const k of Object.keys(t)) if(k[0]==='_'&&!['_rfC','_inDeal','_burn','_cold','_frz','_frzCd','_potD','_cry','_imm','_dr','_fr'].includes(k)) n[k]=t[k];
        twAs(n,()=>{ const ids=twIds(); n.r=n.r||{}; n.r._w={}; for(const id of ids){ const P=n.r._w[id]={cdT:0}; if(POWERS[id]&&POWERS[id].init) POWERS[id].init(P); } try{ kitInit(n,ids); }catch(x){} }); } }catch(x){ console.error('다시 서기',x); } return r; }; }
/* 피의 맹세: 층을 넘으면 자란다 */
{ const st=twSettle; twSettle=function(w){ const live=TW&&TW.on&&!TW.fin,r=st.apply(this,arguments); try{ if(live&&TW&&TW.fin==='win'&&TW.pw.includes('n:피의 맹세')){ twGrowAdd('n:피의 맹세',1,15); twStore(); } }catch(x){} return r; }; }

/* ── 화면: 물약 주머니 · 세트 · 고유 시너지 ── */
{ const ts=towerScreen; towerScreen=function(lost){ if(!lost&&TW) potFix(); const r=ts.apply(this,arguments);
    try{ if(lost||!TW||$('sy-extra')) return r; const at=$('sy-line')||$('tw-inv'); if(!at) return r; const L=[],P=twPots(),sn=twSetN();
      if(hasK(UNIQ,TW.key)) L.push('고유 시너지 「'+UNIQ[TW.key][0]+'」: '+UNIQ[TW.key][1]);
      for(const s in sn) L.push(TWSET[s].name+' '+sn[s]+'/3'+(sn[s]>=2?' · '+TWSET[s].t2:'')+(sn[s]>=3?' · '+TWSET[s].t3:''));
      if(P.length) L.push('물약: '+P.map(p=>POT[p.id].name+' '+p.n+'/'+p.max).join(' · '));
      if(L.length){ const d=document.createElement('p'); d.className='note'; d.id='sy-extra'; d.textContent=L.join('\n'); d.style.whiteSpace='pre-line'; at.insertAdjacentElement('afterend',d); }
    }catch(x){ console.error('등반 화면 물약',x); } return r; }; }
{ const ih=twInvHtml; twInvHtml=function(){ let h=ih.apply(this,arguments); try{ if(!NET.client&&TW){ const P=twPots(),sn=twSetN(); let x='';
        if(hasK(UNIQ,TW.key)) x+='<h2>고유 시너지</h2><div class="bcard"><b>'+esc(UNIQ[TW.key][0])+'</b><p class="note">'+esc(UNIQ[TW.key][1])+'</p></div>';
        if(Object.keys(sn).length) x+='<h2>세트</h2>'+Object.keys(sn).map(s=>'<div class="bcard" style="border-left-color:'+(sn[s]>=2?'var(--gold)':'var(--line)')+'"><b>'+esc(TWSET[s].name)+' '+sn[s]+'/3</b><span class="sy-t'+(sn[s]>=2?' on':'')+'">2개: '+esc(TWSET[s].t2)+'</span><span class="sy-t'+(sn[s]>=3?' on':'')+'">3개: '+esc(TWSET[s].t3)+'</span></div>').join('');
        x+='<h2>물약 주머니 <small style="font-size:13px;color:var(--muted)">'+P.length+' / 2칸</small></h2>'+(P.length?P.map((p,i)=>'<div class="bcard"><b>'+esc(POT[p.id].name)+' · '+p.n+' / '+p.max+'번</b><p class="note">'+esc(POT[p.id].text)+'.\n'+(p.id==='pot:feather'?'쓰러질 때 저절로 쓰인다.':(i?'물약 단추를 길게 누른다(PC는 G).':'물약 단추를 누른다(PC는 F).'))+'</p></div>').join(''):'<p class="note">아직 물약이 없다. 보상 · 상인에서 얻는다.</p>');
        h+=x; } }catch(x){} return h; }; }
