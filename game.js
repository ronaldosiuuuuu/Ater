"use strict";
/* 게임다운 겉옷. 여기 규칙(층 구성 · 보상 · 해금 조건 · 장의 조건)은 카드가 아니라 시험장에서 정한 것이다.
   1) 등반: 한 캐릭터로 층을 오른다. 이기면 보상을 고르고 다음 길(평범 · 정예 · 저주 · 쉼터 · 상인)을 고른다. 5층마다 보스 몬스터와 마왕이 번갈아 나온다.
   2) 이야기: 정리본에 적힌 싸움을 장으로 묶었다. 장을 더하려면 STORY에 한 덩이(cfg = 누가 누구와 어떤 방식으로, goal = 별 둘 조건, src = 정리본 문장).
   3) 오늘의 도전: 날짜로 정해지는 1대1 한 판.
   4) 해금: 내 캐릭터 칸의 등급이 승수·등반 층으로 열린다(NEEDS). 기록 화면에서 모두 열 수 있다.
   5) 기록: 승패, 숙련, 업적(ACH에 한 줄). 이 기기에만 남는다(aetherProfile).
   6) 평가: 1대1에서 이기면 남은 체력으로 S·A·B·C. */
const PF=(()=>{ let d; try{ d=JSON.parse(localStorage.getItem('aetherProfile')||'null'); }catch(x){} d=d||{}; return Object.assign({w:0,l:0,streak:0,ch:{},ach:{},tw:{best:0,key:'',runs:0},mon:{},story:{},daily:{},dstreak:0,dwin:0,open:false,beat:{}},d); })();
const pfSave=()=>{ try{ localStorage.setItem('aetherProfile',JSON.stringify(PF)); }catch(x){} };
const baseKey=k=>CH[k]&&CH[k].re?CH[k].base:k;
const stars=k=>{ const w=(PF.ch[k]||{}).w||0; return w>=15?3:w>=5?2:w>=1?1:0; };
function mastery(k){ const n=stars(k); return n?' <span style="color:#e3c377;letter-spacing:1px" title="숙련">'+'★'.repeat(n)+'</span>':''; }
const rankOf=()=>{ const p=me.hp/me.max; return p>=.7?'S':p>=.4?'A':p>=.15?'B':'C'; };
const ACH=[
 ['first','첫 승리','한 번 이긴다',()=>PF.w>=1],['w10','열 번의 승리','10승',()=>PF.w>=10],['w50','백전노장','50승',()=>PF.w>=50],
 ['st3','연승','3연승',()=>PF.streak>=3],['st7','파죽지세','7연승',()=>PF.streak>=7],
 ['clean','완승','1대1에서 체력 90% 이상을 남기고 이긴다',x=>x.win&&x.solo&&me.hp>=me.max*.9],['edge','기사회생','체력 10% 아래로 이긴다',x=>x.win&&me.hp<=me.max*.1],['fast','속전속결','1대1을 10초 안에 끝낸다',x=>x.win&&x.solo&&over.t<=10],
 ['hard','강적','어려움 난이도 1대1에서 이긴다',x=>x.win&&x.solo&&diff===2],['myth','신살','신화가 아닌 캐릭터로 신화를 1대1에서 이긴다',x=>x.win&&x.solo&&foe.c.grade==='신화'&&me.c.grade!=='신화'],
 ['v10','두루 쓰는 손','서로 다른 캐릭터 10명으로 이긴다',()=>Object.values(PF.ch).filter(c=>c.w>0).length>=10],['v40','만물상','서로 다른 캐릭터 40명으로 이긴다',()=>Object.values(PF.ch).filter(c=>c.w>0).length>=40],
 ['m3','손에 익은 무기','한 캐릭터로 15승 (★★★)',()=>Object.values(PF.ch).some(c=>c.w>=15)],['built','내가 만든 영웅','조합 캐릭터로 이긴다',x=>x.win&&me.c.built],
 ['golem','골렘 사냥','골렘을 쓰러뜨린다',()=>PF.mon.golem>0],['hydra','히드라 사냥','히드라를 쓰러뜨린다',()=>PF.mon.hydra>0],
 ['korhen','학살자를 멈추다','코르헨을 쓰러뜨린다',()=>PF.mon.korhen>0],['st1','첫 장','이야기 한 장을 넘긴다',()=>Object.values(PF.story).some(a=>a.some(x=>x>0))],['stmax','첫 번째 용사','맥스 이야기를 끝까지 본다',()=>(PF.story.max||[]).filter(x=>x>0).length>=5],['stall','빠짐없이','이야기의 별을 모두 모은다',()=>STORY.every(s=>s.ch.every((_,j)=>((PF.story[s.id]||[])[j]||0)>=2))],
 ['d1','오늘의 승리','오늘의 도전을 이긴다',()=>PF.dwin>=1],['d7','이레','오늘의 도전을 이레 내리 이긴다',()=>PF.dstreak>=7],
 ['t5','다섯 층','등반 5층을 넘는다',()=>PF.tw.best>=5],['t10','열 층','등반 10층을 넘는다',()=>PF.tw.best>=10],['t15','꼭대기','등반 15층을 넘는다',()=>PF.tw.best>=15],['t25','구름 위','등반 25층을 넘는다',()=>PF.tw.best>=25]
];
function achCheck(x){ const got=[]; for(const a of ACH){ if(PF.ach[a[0]]) continue; let ok=false; try{ ok=a[3](x||{}); }catch(e){} if(ok){ PF.ach[a[0]]=Date.now(); got.push(a[1]); } } if(got.length){ pfSave(); setTimeout(()=>toast('업적 달성 · '+got.join(' · '),3600),1200); } }
const openSet=()=>Object.keys(CH).filter(k=>!CH[k].re&&!locked(k));
on('end',w=>{ if(practice||!w||NET.client) return; const was=new Set(openSet()); setTimeout(()=>{ const nw=openSet().filter(k=>!was.has(k)); if(nw.length) toast('새로 열린 캐릭터 · '+nw.slice(0,4).map(k=>CH[k].name.split(', ')[1]).join(' · ')+(nw.length>4?' 외 '+(nw.length-4)+'명':''),4200); },2600); const win=w.team===0,k=baseKey(me.key),solo=ents.length===2&&!RAID(),c=PF.ch[k]||(PF.ch[k]={w:0,l:0});
  if(win){ ents.forEach(o=>{ if(o.team===1&&CH[o.key]&&!o.c.mon&&!o.c.mob) PF.beat[baseKey(o.key)]=1; }); PF.w++; PF.streak++; c.w++; if(foe.c.mon) PF.mon[foe.key]=(PF.mon[foe.key]||0)+1; } else { PF.l++; PF.streak=0; c.l++; } pfSave(); achCheck({win,solo}); });

/* ───── 권능을 아무 캐릭터에게나 얹기(등반 보상) ───── */
function empower(c,pw,atkB){ const W=id=>POWERS[id],each=(h,fn)=>{ for(const id of pw) if(W(id)[h]) fn(W(id),id); },n=Object.assign({},c); n.atk=c.atk+(atkB||0);
  n.tick=(e,dt)=>{ if(c.tick) c.tick(e,dt); each('tick',(P,id)=>P.tick(e,dt,e.r._w[id])); };
  n.modTake=(e,src,amt,l,o)=>{ if(c.modTake) amt=c.modTake(e,src,amt,l,o); each('modTake',(P,id)=>{ amt=P.modTake(e,src,amt,l,o,e.r._w[id]); }); return amt; };
  n.modDeal=(e,t,amt,l,o)=>{ if(c.modDeal) amt=c.modDeal(e,t,amt,l,o); each('modDeal',(P,id)=>{ amt=P.modDeal(e,t,amt,l,o,e.r._w[id]); }); return amt; };
  n.modHeal=(e,amt)=>{ if(c.modHeal) amt=c.modHeal(e,amt); each('modHeal',(P,id)=>{ amt=P.modHeal(e,amt,e.r._w[id]); }); return amt; };
  n.speedMod=e=>{ let m=c.speedMod?c.speedMod(e):1; each('speed',(P,id)=>{ m*=P.speed(e,e.r._w[id]); }); return m; };
  n.onStatus=(e,k,t)=>{ if(c.onStatus) t=c.onStatus(e,k,t); for(const id of pw){ if(!(t>0)) return 0; if(W(id).onStatus) t=W(id).onStatus(e,k,t,e.r._w[id]); } return t; };
  n.onDeal=(e,t,amt,l,o)=>{ if(c.onDeal) c.onDeal(e,t,amt,l,o); each('onDeal',(P,id)=>P.onDeal(e,t,amt,l,o,e.r._w[id])); };
  n.onHurt=(e,src,amt,l,o)=>{ if(c.onHurt) c.onHurt(e,src,amt,l,o); each('onHurt',(P,id)=>P.onHurt(e,src,amt,l,o,e.r._w[id])); };
  n.onKill=(e,t)=>{ if(c.onKill) c.onKill(e,t); each('onKill',(P,id)=>P.onKill(e,t,e.r._w[id])); };
  n.onFatal=(e,src)=>{ if(c.onFatal&&c.onFatal(e,src)) return true; for(const id of pw) if(W(id).onFatal&&W(id).onFatal(e,src,e.r._w[id])) return true; return false; };
  n.basicBonus=(e,t)=>{ if(c.basicBonus) c.basicBonus(e,t); each('basic',(P,id)=>{ if(!t.dead) P.basic(e,t,e.r._w[id]); }); };
  n.onCast=(e,s)=>{ if(c.onCast) c.onCast(e,s); each('onCast',(P,id)=>P.onCast(e,s,e.r._w[id])); };
  n.skills=Object.assign({},c.skills); kitFill(n.skills,pw);
  return n; }

/* ───── 빌려 쓰기: 등반·이야기·오늘의 도전은 고르는 화면의 설정을 잠깐 바꿔 싸우고, 끝나면 되돌린다 ───── */
let KEEP=null;
function keepSet(){ if(KEEP) return; KEEP={practice,mode,teamN,diff,me:sel.me,meR:sel.meR,foe:sel.foe,foeR:sel.foeR,al:sel.al.slice(),fo:sel.fo.slice(),mon:OPT.mon,monhp:OPT.monhp,raid:OPT.raid,myth:OPT.myth,map:OPT.map}; }
function keepBack(){ if(!KEEP) return; const k=KEEP; KEEP=null; practice=k.practice; mode=k.mode; teamN=k.teamN; diff=k.diff; sel.me=k.me; sel.meR=k.meR; sel.foe=k.foe; sel.foeR=k.foeR; sel.al=k.al; sel.fo=k.fo; OPT.mon=k.mon; OPT.monhp=k.monhp; OPT.raid=k.raid; OPT.myth=k.myth; OPT.map=k.map; drawSel(); modeNote(); hubCard(); }
function setup(x){ keepSet(); practice=false; mode=x.mode||1; teamN=x.teamN||1; diff=x.diff==null?1:x.diff; const c=CH[x.me]; sel.me=c.re?c.base:x.me; sel.meR=!!c.re||!!x.meR; if(x.mon){ OPT.mon=x.mon; OPT.monhp='fit'; } else { const f=CH[x.foe]; sel.foe=f.re?f.base:x.foe; sel.foeR=!!f.re||!!x.foeR; }
  sel.al=[0,1,2,3].map(j=>(x.al||[])[j]||null); sel.fo=[0,1,2,3].map(j=>(x.fo||[])[j]||null); if(x.raid) OPT.raid=x.raid; OPT.myth=x.myth?1:0; if(x.map&&MAPS[x.map]) OPT.map=x.map; }

/* ───── 해금: 처음에는 고화만. 이기고 오르면 윗등급이 열린다. 연습과 상대·팀원 칸은 언제나 모두 열려 있다 ───── */
const NEEDS={서사:[3,0],전설:[10,5],히든:[25,10],신화:[50,15]};      /* [승수, 등반 층] 둘 중 하나만 채우면 된다 */
const MEET={전설:1,히든:1,신화:1};                                     /* 이 등급은 그 캐릭터를 상대로 한 번 이겨야 한다 */
const REWIN=5;                                                       /* 재림: 원래 캐릭터로 5승 */
const gradeOpen=g=>!NEEDS[g]||PF.open||PF.w>=NEEDS[g][0]||(NEEDS[g][1]&&PF.tw.best>=NEEDS[g][1]);
function locked(k){ const c0=CH[k]; if(!c0||PF.open) return false; const b=baseKey(k),c=CH[b]; if(!c||c.built||c.custom||c.mon||c.mob||c.kit) return false; if(!gradeOpen(c.grade)) return true; if(MEET[c.grade]&&!PF.beat[b]) return true; return !!c0.re&&((PF.ch[b]||{}).w||0)<REWIN; }
function lockWhy(k){ const b=baseKey(k),c=CH[b],n=NEEDS[c.grade],L=[]; if(n&&!gradeOpen(c.grade)) L.push(n[0]+'승'+(n[1]?' 또는 등반 '+n[1]+'층':'')); if(MEET[c.grade]&&!PF.beat[b]) L.push('상대로 만나 한 번 이기기'); if(CH[k].re&&((PF.ch[b]||{}).w||0)<REWIN) L.push('원래 캐릭터로 '+REWIN+'승'); return L.join(' · '); }
/* 고르는 화면 아래에 뜨는 한 줄: 아직 안 보이는 캐릭터가 몇인지, 어떻게 여는지 */
function lockNote(tab,qq){ if(slot!=='me'||practice||PF.open) return ''; const L=Object.values(CH).filter(c=>!c.re&&(qq?c.name.includes(qq):c.cls===tab)&&locked(c.key)); if(!L.length) return ''; const g={}; L.forEach(c=>g[c.grade]=(g[c.grade]||0)+1);
  return '<p class="note" style="margin-top:10px">아직 보이지 않는 캐릭터 '+L.length+'명 ('+Object.keys(g).map(k=>k+' '+g[k]).join(' · ')+')\n'+Object.keys(g).map(k=>k+': '+NEEDS[k][0]+'승'+(NEEDS[k][1]?' 또는 등반 '+NEEDS[k][1]+'층':'')+(MEET[k]?', 그리고 그 캐릭터를 상대로 한 번 이기기':'')).join('\n')+'\n상대 칸과 연습에서는 모두 보인다.</p>'; }
{ const pc0=pickCh; pickCh=function(k){ if(slot==='me'&&!practice&&locked(k)) return toast(CH[k].grade+' 등급은 아직 잠겨 있다 · '+lockWhy(k)+' (연습에서는 쓸 수 있다)',3000); pc0(k); };
  const la0=launch; launch=function(){ if(NET.host&&!KEEP&&typeof okKey==='function'&&!okKey(sel.me)) return toast('만든 캐릭터는 함께에서 쓸 수 없다 · 다른 캐릭터를 고른다',3000); if(!KEEP&&!practice&&!NET.client&&locked(kOf('me'))) return toast('내 캐릭터가 아직 잠겨 있다 · '+lockWhy(kOf('me')),3000); return la0(); }; $('start').onclick=()=>launch(); }

/* ───── 등반 ─────
   길: 싸움 층을 넘을 때마다 다음 길을 고른다. 평범한 길 · 험한 길(정예: 체력 ×1.6, 피해 +20%, 보상 둘) · 저주받은 길(불리한 조건, 보상은 권능만) · 쉼터 · 상인.
   5층마다 보스: 몬스터(코르헨 → 골렘 → 거대 골렘 → 히드라)와 마왕(히든·신화 캐릭터, 체력 3배)이 번갈아 나온다. */
const TIER=[['고화'],['고화','서사'],['서사'],['서사','전설'],null,['전설'],['전설','히든'],['히든'],['히든','신화'],null];
const BOONS={train:{name:'단련',text:'최대 체력 +80, 그만큼 회복한다.',price:25},hone:{name:'연마',text:'기본 공격 +4.',price:25},rest:{name:'휴식',text:'체력을 모두 회복한다.',price:20}};
const CURSES={frail:{name:'깨진 갑옷',text:'이 층에서는 받는 피해가 25% 는다.'},swift:{name:'쫓기는 길',text:'이 층의 상대는 기동력이 25% 높다.'},dry:{name:'마른 샘',text:'이 층은 이겨도 체력이 돌아오지 않는다.'}};
const TPOW=()=>Object.keys(POWERS).filter(id=>!POWERS[id].active&&!POWERS[id].gear);
const lvCap=f=>f<=3?3:f<=6?5:f<=10?7:9;      /* 층이 높을수록 높은 단계의 권능이 나온다 */
const twIds=()=>TW.pw.concat(gearIds(TW.gear));
function rollGear(f,up){ const g=Math.max(0,Math.min(5,Math.floor((f-1)/3)+(up?1:0)-(Math.random()<.35?1:0))),L=Object.values(GEAR).filter(x=>x.gi===g&&!(TW.gear&&Object.values(TW.gear).includes(x.id))); return L.length?rnd(L).id:null; }
let TW=null;
const twLoad=()=>{ try{ const d=JSON.parse(localStorage.getItem('aetherTower')||'null'); return d&&CH[d.key]&&(!d.next||CH[d.next.k])?Object.assign({gold:0,rewN:0,gear:{}},d,{on:false}):null; }catch(x){ return null; } };
const twStore=()=>{ try{ if(TW) localStorage.setItem('aetherTower',JSON.stringify(TW)); else localStorage.removeItem('aetherTower'); }catch(x){} };
const isBoss=f=>f%5===0, twMax=()=>CH[TW.key].hp+TW.hpB+statOf(twIds()).hp, rnd=a=>a[Math.floor(Math.random()*a.length)];
function twPool(gr){ return Object.keys(CH).filter(k=>{ const c=CH[k]; return !c.re&&!c.built&&!c.custom&&!c.mon&&gr.includes(c.grade)&&k!==TW.key&&k!==(TW.last||''); }); }
function towerFoe(f,up){ if(isBoss(f)){ const i=f/5,B=typeof TBOSS!=='undefined'?TBOSS:MONS; if(i%3!==0) return {t:'fight',k:B[(i-Math.floor(i/3)-1)%B.length],boss:true}; return {t:'fight',k:rnd(twPool(f<=15?['히든']:['히든','신화']))||'max',lord:true}; }
  const gr=f+(up?2:0)<=10?TIER[f-1+(up?2:0)]||TIER[f-1]:['히든','신화']; return {t:'fight',k:rnd(twPool(gr))||'ei'}; }
/* 무리: 시험장에서 만든 적(foes.js) 여럿. 층이 높을수록 강한 적이 더 많이 나온다 */
function towerHorde(f){ if(typeof MOBS==='undefined') return null; const T=Math.min(5,1+Math.floor((f-1)/3)),pool=MOBS.filter(m=>m[2]<=T&&m[2]>=T-1).map(m=>m[0]),n=f<4?2:f<10?3:4,L=[]; for(let i=0;i<n;i++) L.push(rnd(pool)); return {t:'fight',k:L[0],horde:L.slice(1)}; }
const twScale=f=>f>10?1+.12*(f-10):1;      /* 10층 위: 상대 체력이 층마다 12%씩 는다 */
const twDiff=f=>f<=2?0:f<=5?1:2;
function genFork(){ const f=TW.floor; if(isBoss(f)){ TW.next=towerFoe(f); TW.fork=null; return; } const L=[towerFoe(f)]; const hard=Math.random()<.5?Object.assign(towerFoe(f,true),{elite:true}):Object.assign(towerFoe(f),{curse:rnd(Object.keys(CURSES))}); L.push(hard); { const hd=towerHorde(f); if(hd) L.push(hd); }
  if(!TW.rested&&Math.random()<.65) L.push({t:Math.random()<.5||TW.gold<20?'rest':'shop'}); TW.fork=L; TW.next=null; }
function towerStart(resume){ if(NET.host||NET.client) return toast('친구와 함께 중에는 등반할 수 없다'); if(!resume){ const k=kOf('me'); if(CH[k].mon) return; if(locked(k)) return toast('내 캐릭터가 아직 잠겨 있다 · '+lockWhy(k),3000); TW={key:k,floor:1,pw:[],hpB:0,atkB:0,hp:null,t:0,last:'',picks:[],gold:0,rewN:0,gear:{}}; TW.next=towerFoe(1); PF.tw.runs++; pfSave(); twStore(); } else TW=twLoad(); if(!TW) return; towerScreen(); }
function towerGo(){ if(!TW||TW.on||!TW.next) return; const n=TW.next; setup({me:TW.key,foe:n.boss?null:n.k,mon:n.boss?n.k:null,mode:n.boss?6:1,diff:n.elite?2:twDiff(TW.floor)}); TW.on=true; $('tower').hidden=true; launch(); }
on('begin',()=>{ if(!TW||!TW.on) return; const f=TW.floor,n=TW.next; { const ids=twIds(); me.c=empower(me.c,ids,TW.atkB+statOf(ids).atk); } me.atk=me.c.atk; me.r=me.r||{}; me.r._w={}; for(const id of twIds()){ const P=me.r._w[id]={cdT:0}; if(POWERS[id].init) POWERS[id].init(P); } kitInit(me,twIds()); uiBegin();
  me.max=twMax(); me.hp=Math.max(1,Math.min(me.max,TW.hp==null?me.max:TW.hp));
  if(n.boss){ const m=1+.6*(Math.ceil(f/20)-1); foe.max=foe.hp=Math.round(foe.max*m); } else { foe.max=foe.hp=Math.round(foe.c.hp*twScale(f)*(n.lord?3:1)*(n.elite?1.6:1)); if(n.lord) foe.boss=true; }
  if(n.horde) n.horde.forEach((k,i)=>{ const a=(i+1)*2.1,m=mk(k,1,foe.x+Math.cos(a)*2.6,foe.y+Math.sin(a)*2.6); clamp(m); m.slot=i+1; m.busy=1.5; m.max=m.hp=Math.round(m.c.hp*twScale(f)); ents.push(m); });
  if(n.elite){ const c=foe.c,md=c.modDeal; foe.c=Object.assign({},c,{modDeal:(e,t,a,l,o)=>(md?md(e,t,a,l,o):a)*1.2}); }
  if(n.curse==='frail'){ const c=me.c,mt=c.modTake; me.c=Object.assign({},c,{modTake:(e,src,a,l,o)=>mt(e,src,a,l,o)*(src===e?1:1.25)}); }
  if(n.curse==='swift') add(foe,'haste',9999,.25,{self:true});
  msg([['등반 '+f+'층 ','#e3c377'],[(n.boss?'보스 ':n.lord?'마왕 ':n.elite?'정예 ':n.curse?'저주 · ':n.horde?'무리 '+(n.horde.length+1)+' · ':'')+short(foe),'#fff6d6'],[' · 체력 '+foe.max,'#97a1cf']],1,true); });
function rollRewards(allPw){ const f=TW.floor-1,cap=lvCap(f),left=TPOW().filter(id=>!TW.pw.includes(id)&&POWERS[id].lv<=cap&&POWERS[id].lv>=cap-4).sort(()=>Math.random()-.5),L=[]; const np=allPw?2:1; left.slice(0,np).forEach(id=>L.push({t:'pw',id})); { const g=rollGear(f,allPw); if(g) L.push({t:'gear',id:g}); }
  for(const b of ['train','hone','rest'].sort(()=>Math.random()-.5)){ if(L.length>=3) break; if(b==='rest'&&TW.hp>=twMax()*.85) continue; L.push({t:'boon',id:b}); } while(L.length<3) L.push({t:'boon',id:'train'}); return L; }
function gain(r){ if(r.t==='gear'){ const G=GEAR[r.id],old=TW.hp==null?null:twMax(); TW.gear[G.slot]=r.id; if(old!=null) TW.hp=Math.max(1,Math.min(twMax(),TW.hp+Math.max(0,twMax()-old))); TW.picks.push(G.name); return; } if(r.t==='pw') TW.pw.push(r.id); else if(r.id==='train'){ TW.hpB+=80; TW.hp+=80; } else if(r.id==='hone') TW.atkB+=4; else TW.hp=twMax(); TW.picks.push(r.t==='pw'?POWERS[r.id].name:BOONS[r.id].name); }
function towerTake(r){ gain(r); TW.rewN--; if(TW.rewN>0) TW.rew=rollRewards(TW.rewPw); else { TW.rew=null; genFork(); } twStore(); towerScreen(); }
function towerPath(i){ const n=TW.fork[i]; if(!n) return; if(n.t==='fight'){ TW.next=n; TW.fork=null; } else if(n.t==='rest'){ TW.hp=Math.min(twMax(),TW.hp+Math.round(twMax()*.5)); TW.rested=true; TW.picks.push('쉼터'); genFork(); toast('쉼터에서 체력을 절반 되찾았다'); }
  else { TW.rested=true; const cap=lvCap(TW.floor),left=TPOW().filter(id=>!TW.pw.includes(id)&&POWERS[id].lv<=cap).sort(()=>Math.random()-.5).slice(0,2),gs=[rollGear(TW.floor,true),rollGear(TW.floor)].filter((x,i,a)=>x&&a.indexOf(x)===i); TW.shop=left.map(id=>({t:'pw',id,price:20+POWERS[id].lv*5})).concat(gs.map(id=>({t:'gear',id,price:20+GEAR[id].gi*10})),['train','hone','rest'].map(id=>({t:'boon',id,price:BOONS[id].price}))); TW.fork=null; } twStore(); towerScreen(); }
function towerBuy(i){ const it=TW.shop[i]; if(!it||it.sold) return; if(TW.gold<it.price) return toast('증표가 모자라다'); TW.gold-=it.price; it.sold=true; gain(it); twStore(); towerScreen(); }
const twLine=()=>'<p class="sub">'+esc(CH[TW.key].name)+' · 체력 '+Math.ceil(TW.hp==null?twMax():TW.hp)+' / '+twMax()+' · 기본 공격 '+(CH[TW.key].atk+TW.atkB)+' · 증표 '+TW.gold+'</p>'+(TW.pw.length?'<p class="note">권능: '+TW.pw.map(id=>POWERS[id].name+' '+POWERS[id].lv).join(' · ')+'</p>':'')+(gearIds(TW.gear).length?'<p class="note">장비: '+['w','a','t'].filter(sl=>GEAR[TW.gear[sl]]).map(sl=>GSLOT[sl]+' '+GEAR[TW.gear[sl]].name+' ('+GEAR[TW.gear[sl]].grade+')').join(' · ')+'</p>':'');
const head=(small,h1,p)=>'<header class="brand" style="padding-top:10px"><small>'+small+'</small><h1 style="font-size:34px">'+h1+'</h1><p>'+p+'</p><div class="rule"><i></i></div></header>';
const card=(attr,title,body,col)=>'<button type="button" class="bcard" '+attr+' style="display:block;width:100%;text-align:left;color:var(--ink);font:inherit;border-left-color:'+(col||'var(--gold)')+'"><b>'+title+'</b><p class="note">'+body+'</p></button>';
const rwTitle=r=>r.t==='gear'?GSLOT[GEAR[r.id].slot]+' · '+esc(GEAR[r.id].name)+' <'+GEAR[r.id].grade+'>':r.t==='pw'?'권능 · '+esc(POWERS[r.id].name)+' <'+POWERS[r.id].lv+'단계>':esc(BOONS[r.id].name);
const rwBody=r=>{ if(r.t==='gear'){ const G=GEAR[r.id],cur=GEAR[TW.gear[G.slot]]; return esc(POWERS['@'+r.id].text)+(G.note?'\n'+esc(G.note):'')+(cur?'\n지금 낀 '+esc(cur.name)+' ('+cur.grade+')과 바뀐다.':''); } const d=r.t==='pw'?POWERS[r.id]:BOONS[r.id]; return esc(d.text)+(d.cd?'\n재사용 대기시간 '+d.cd+'초':''); };
const rwCol=r=>r.t==='gear'?GGC[GEAR[r.id].grade]:r.t==='pw'?'var(--gold)':'var(--aether)';
const foeLine=n=>{ const c=CH[n.k]; if(n.horde){ const cnt={}; [n.k].concat(n.horde).forEach(k=>{ const nm=CH[k].name.split(', ')[1]; cnt[nm]=(cnt[nm]||0)+1; }); return '적 무리 · '+Object.keys(cnt).map(k=>esc(k)+(cnt[k]>1?' ×'+cnt[k]:'')).join(', '); } return (n.boss?'보스 몬스터 · ':n.lord?'마왕 · ':c.grade+' '+c.cls+' · ')+esc(c.name); };
function towerScreen(lost){ const el=$('tw-body'); let h='';
  if(lost){ const top=lost.floor-1; h=head('TOWER',lost.floor+'층에서 쓰러졌다','넘은 층 '+top+' · 가장 높이 '+PF.tw.best+'층'+(lost.rec?' · 새 기록':''))+'<p class="sub">'+esc(CH[lost.key].name)+' · 걸린 시간 '+Math.round(lost.t)+'초</p>'+(lost.picks.length?'<p class="note">얻은 것: '+lost.picks.map(esc).join(' · ')+'</p>':'')+'<div class="dock"><button class="go" id="tw-again" type="button">다시 오른다</button><button class="ghost" id="tw-out" type="button">나가기</button></div>'; }
  else if(TW.rew){ h=head('TOWER · '+(TW.rank||''),(TW.floor-1)+'층 돌파','보상을 하나 고른다'+(TW.rewN>1?' (앞으로 '+TW.rewN+'번)':''))+twLine()+TW.rew.map((r,i)=>card('data-rw="'+i+'"',rwTitle(r),rwBody(r),rwCol(r))).join(''); }
  else if(TW.shop){ h=head('TOWER','상인','증표 '+TW.gold+'개로 산다')+twLine()+TW.shop.map((it,i)=>card('data-buy="'+i+'"'+(it.sold?' disabled':''),(it.sold?'팔림 · ':'증표 '+it.price+' · ')+rwTitle(it),rwBody(it),it.sold?'var(--line)':rwCol(it))).join('')+'<div class="dock"><button class="go" id="tw-shopout" type="button">떠난다</button></div>'; }
  else if(TW.fork){ h=head('TOWER',TW.floor+'층으로 가는 길','길을 하나 고른다')+twLine()+TW.fork.map((n,i)=>n.t==='rest'?card('data-path="'+i+'"','쉼터','싸우지 않고 체력을 절반 되찾는다. 그 뒤 다시 길을 고른다.','var(--ok)'):n.t==='shop'?card('data-path="'+i+'"','상인','증표로 권능이나 단련을 산다. 그 뒤 다시 길을 고른다.','var(--ok)'):n.elite?card('data-path="'+i+'"','험한 길 · 정예',foeLine(n)+'\n상대 체력 ×1.6, 주는 피해 +20%, 난이도 어려움. 이기면 보상을 두 번 고르고 증표를 더 받는다.','var(--foe)'):n.curse?card('data-path="'+i+'"','저주받은 길 · '+CURSES[n.curse].name,foeLine(n)+'\n'+CURSES[n.curse].text+' 이기면 보상이 권능으로만 나오고 증표를 더 받는다.','#b48cff'):n.horde?card('data-path="'+i+'"','무리의 길',foeLine(n)+'\n약한 적 여럿과 한꺼번에 싸운다. 모두 쓰러뜨려야 한다.','#8fd0a0'):card('data-path="'+i+'"','평범한 길',foeLine(n),'var(--aether)')).join(''); }
  else { const n=TW.next,c=CH[n.k]; h=head('TOWER',TW.floor+'층',foeLine(n))+twLine()+'<p class="note">'+(n.boss?'5분 안에 쓰러뜨려야 한다. ':n.lord?'마왕은 체력이 3배다. ':'')+(n.elite?'정예: 체력 ×1.6, 주는 피해 +20%. ':'')+(n.curse?CURSES[n.curse].name+': '+CURSES[n.curse].text+' ':'')+'난이도 '+['쉬움','보통','어려움'][n.elite?2:twDiff(TW.floor)]+(twScale(TW.floor)>1?' · 상대 체력 ×'+twScale(TW.floor).toFixed(2):'')+'. 지면 등반이 끝난다.</p><div class="dock"><button class="go" id="tw-go" type="button">올라간다</button><button class="ghost" id="tw-info" type="button">상대 스킬 보기</button><button class="ghost" id="tw-out" type="button">쉬었다 가기 (저장됨)</button></div>'; }
  el.innerHTML=h; $('tower').hidden=false; $('tower').scrollTop=0; }
function towerEnd(w){ TW.t+=over.t; const n=TW.next;
  if(w.team===0){ sfx('win'); TW.rank=rankOf(); const mx=me.max; TW.hp=Math.max(1,me.hp); if(n.curse!=='dry') TW.hp=Math.min(mx,TW.hp+Math.round(mx*.3)); TW.last=n.k; const f=TW.floor,big=n.boss||n.lord; TW.gold+=10+(TW.rank==='S'?5:0)+(n.elite||n.curse?10:0)+(n.horde?5:0)+(big?20:0); if(f>PF.tw.best){ PF.tw.best=f; PF.tw.key=TW.key; } pfSave(); achCheck({});
    TW.floor++; TW.rested=false; TW.next=null; TW.rewPw=!!(big||n.curse); TW.rewN=n.elite?2:1; TW.rew=rollRewards(TW.rewPw); TW.on=false; keepBack(); twStore(); $('sel').hidden=false; over=null; towerScreen(); }
  else { sfx('lose'); const lost=Object.assign({},TW,{rec:TW.floor-1>0&&TW.floor-1>=PF.tw.best}); TW=null; keepBack(); twStore(); $('sel').hidden=false; over=null; towerScreen(lost); } }

/* ───── 이야기: 정리본에 적힌 싸움을 차례로 겨룬다. 사이의 글은 정리본 문장을 옮긴 것이다 ───── */
const STORY=[
 {id:'max',name:'첫 번째 용사',sub:'맥스 이야기 · 격동의 시대에서 잊혀진 시대까지',ch:[
  {name:'제국 사공',cfg:{me:'max',foe:'euclein',mode:1,diff:1,map:'basic'},goal:['hp',.5],src:'열일곱에 1년의 전장이 시작되고 세 나라 순회(브리튼 왕국 → 공국 → 제국)와 겹친다. 맥스 용병단이 제국 사공과 무색의 악마가 된 황제를 꺾고 전쟁을 막는다. 사공 넷 가운데 유클라인만 제국에 남았다.',how:'1대1 · 맥스 대 유클라인'},
  {name:'제국 전쟁',cfg:{me:'max',al:['evangeline','start','albion'],foe:'licht',mode:5,raid:'hero',diff:1,map:'plain',myth:true},goal:['time',120],src:'황제 리히트는 처음엔 대륙을 하나로 묶어 세계의 필연적 파멸을 막으려 했으나, 무색의 악마가 된 뒤에는 예비된 멸망을 기다리지 않고 스스로 먼저 멸망시키기로 마음을 바꾸었다.',how:'대돌격 · 맥스와 에반젤린·스타트·알비온이 마왕 자리의 황제 리히트와 싸운다'},
  {name:'맥스 대 용병단',cfg:{me:'max',foe:'evangeline',fo:['start','albion','stella'],mode:5,raid:'boss',diff:1,map:'basic',myth:true},goal:['time',150],src:'파스테른 — 맥스만을 적대하는 세계가 무한에 가깝게 반복되는 루프(42만 3217번). 스텔라가 죽은 상황에서 맥스가 스타트·에반젤린에게 원흉으로 몰려 공격받는 장면이 수없이 반복된다.',how:'대돌격 · 마왕 자리의 맥스 혼자서 에반젤린·스타트·알비온·스텔라와 싸운다'},
  {name:'시사계의 루프',cfg:{me:'max',foe:'pastern',mode:1,diff:2,map:'storm'},goal:['hp',.4],src:'혼신의 맹약을 어길 때마다 부서졌다 이어지기를 반복한 의지가 신성 \'비상\'을 깨우고, 일검의 경지로 무한히 베어 시간의 신을 처치한다.',how:'1대1 · 맥스 대 파스테른, 폭풍의 눈'},
  {name:'붉은 아이와 어머니',cfg:{me:'max_r',foe:'girl_r',mode:1,diff:2,map:'plain'},goal:['hp',.3],src:'붉은 아이야. 오직 너만이 나에게 대적할 수 있을 것이다. (아에르 카드 소개문)',how:'1대1 · 아르트랑 맥스 대 아에르, 대평원'}]},
 {id:'muhan',name:'무한관',sub:'외전 · 투쟁의 시대',ch:[
  {name:'무술제 결승',cfg:{me:'blossom',foe:'rano',mode:1,diff:1,map:'duel'},goal:['hp',.5],src:'파블라 왕국 제9대 무술제. 결정전 승자가 나이트 배너렛이 된다. 블로섬·라노의 결승.',how:'1대1 · 블로섬 대 라노, 결투장'},
  {name:'레우스전',cfg:{me:'max',foe:'leus',mode:1,diff:2,map:'duel'},goal:['time',60],src:'맥스가 열두 대가·대륙의 십걸·아서와 겨루는 장면, 파블라 무술제, 레우스전은 모두 외전이다.',how:'1대1 · 맥스 대 레우스, 결투장'},
  {name:'붉은 투기와 황금빛',cfg:{me:'max',foe:'arthur',mode:1,diff:2,map:'basic'},goal:['hp',.3],src:'맥스와 아서의 비등한 대결. 붉은 투기와 황금빛이 맞서 세상의 절반은 금빛 별의 밤하늘, 절반은 적색 심상 세계가 되었다.',how:'1대1 · 맥스 대 아서'}]}
];
const goalTxt=g=>g[0]==='hp'?'체력 '+Math.round(g[1]*100)+'% 이상 남기고 이긴다':g[1]+'초 안에 이긴다';
const goalOk=g=>g[0]==='hp'?me.hp>=me.max*g[1]:over.t<=g[1];
const stStar=(s,i)=>(PF.story[s.id]||[])[i]||0, stOpen=(s,i)=>i===0||stStar(s,i-1)>0;
function storyScreen(si,ci){ const el=$('tw-body'); let h='';
  if(si==null){ h=head('STORY','이야기','정리본에 적힌 싸움을 차례로 겨룬다')+STORY.map((s,i)=>card('data-st="'+i+'"',esc(s.name)+' <span style="color:#e3c377">'+s.ch.reduce((a,_,j)=>a+stStar(s,j),0)+' / '+s.ch.length*2+' ★</span>',esc(s.sub))).join('')+'<p class="sub">이야기에서는 등급이 잠겨 있어도 정해진 캐릭터로 싸운다. 글은 노션 \'맥스 세계관 정리본 (정사)\'에서 옮겼다.</p><div class="dock"><button class="ghost" id="tw-out" type="button">닫기</button></div>'; }
  else if(ci==null){ const s=STORY[si]; h=head('STORY',esc(s.name),esc(s.sub))+s.ch.map((c,j)=>card('data-sc="'+si+','+j+'"'+(stOpen(s,j)?'':' disabled style="opacity:.45"'),(j+1)+'장 · '+esc(c.name)+' <span style="color:#e3c377">'+'★'.repeat(stStar(s,j))+'</span>',stOpen(s,j)?esc(c.how):'앞 장을 이기면 열린다',stOpen(s,j)?'var(--gold)':'var(--line)')).join('')+'<div class="dock"><button class="ghost" id="st-back" type="button">이야기 목록</button></div>'; }
  else { const s=STORY[si],c=s.ch[ci]; h=head('STORY · '+esc(s.name),(ci+1)+'장 · '+esc(c.name),esc(c.how))+'<p class="note" style="font-size:14px;line-height:1.75">'+esc(c.src)+'</p><p class="sub">★ 이긴다 · ★★ '+goalTxt(c.goal)+'</p><div class="dock"><button class="go" data-sgo="'+si+','+ci+'" type="button">싸운다</button><button class="ghost" data-st="'+si+'" type="button">돌아가기</button></div>'; }
  el.innerHTML=h; $('tower').hidden=false; $('tower').scrollTop=0; }

/* ───── 오늘의 도전: 날짜로 정해지는 한 판. 그날 첫 판만 기록에 남는다 ───── */
const today=()=>{ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
function dailyOf(day){ let h=2166136261; for(const ch of day) h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0; const r=()=>{ h=Math.imul(h^(h>>>15),2246822507)>>>0; h=Math.imul(h^(h>>>13),3266489909)>>>0; return ((h^=h>>>16)>>>0)/4294967296; };
  const L=Object.keys(CH).filter(k=>!CH[k].re&&!CH[k].built&&!CH[k].custom&&!CH[k].mon).sort(),mk0=L[Math.floor(r()*L.length)]; let fk=mk0; while(fk===mk0) fk=L[Math.floor(r()*L.length)]; const maps=Object.keys(MAPS); return {me:mk0,foe:fk,map:maps[Math.floor(r()*maps.length)],mode:1,diff:2}; }
function dailyScreen(){ const d=today(),x=dailyOf(d),rec=PF.daily.d===d?PF.daily:null,a=CH[x.me],b=CH[x.foe];
  $('tw-body').innerHTML=head('DAILY · '+d,'오늘의 도전',esc(a.name)+' 대 '+esc(b.name))+'<p class="note">나는 '+esc(a.name.split(', ')[1])+' ('+a.grade+' '+a.cls+'), 상대는 '+esc(b.name.split(', ')[1])+' ('+b.grade+' '+b.cls+'). 맵 '+MAPS[x.map].name+', 난이도 어려움, 1대1 단판.\n날마다 모두 같은 조합이 나온다. 그날 첫 판만 기록에 남고, 그 뒤로는 몇 번이든 다시 해 볼 수 있다.</p>'+(rec?'<div class="pl"><b>오늘 기록 · '+(rec.win?'승리 '+rec.rank:'패배')+'</b><span style="color:var(--muted)">'+rec.t.toFixed(1)+'초</span></div>':'')+'<p class="sub">이어서 이긴 날 '+PF.dstreak+'일 · 지금까지 '+PF.dwin+'번 이겼다</p><div class="dock"><button class="go" id="dy-go" type="button">'+(rec?'다시 해 본다 (기록 안 됨)':'도전한다')+'</button><button class="ghost" id="dy-me" type="button">내 스킬 보기</button><button class="ghost" id="dy-foe" type="button">상대 스킬 보기</button><button class="ghost" id="tw-out" type="button">닫기</button></div>'; $('tower').hidden=false; $('tower').scrollTop=0; }

/* ───── 싸움이 끝났을 때 ───── */
let SPM=null;      /* 지금 하는 이야기·도전 판 */
function spGo(m){ if(NET.host||NET.client) return toast('친구와 함께 중에는 할 수 없다'); SPM=m; setup(m.cfg); $('tower').hidden=true; launch(); }
{ const sr0=showResult; showResult=function(){ if(TW&&TW.on){ if(!over) return; running=false; wakeOff(); $('menu').style.display='none'; if(!over.winner){ const f=TW.floor; TW.on=false; keepBack(); $('sel').hidden=false; over=null; toast('등반은 '+f+'층에서 멈춰 있다. 이어서 오를 수 있다'); return; } return towerEnd(over.winner); }
    if(!over) return; const win=!!over.winner&&over.winner.team===0,solo=ents.length===2,m=SPM; sr0();
    if(win&&!practice&&solo) $('r-small').textContent='VICTORY · '+rankOf();
    if(m){ let line='';
      if(m.kind==='story'){ const s=STORY[m.si],c=s.ch[m.ci]; if(win){ const st=goalOk(c.goal)?2:1,a=PF.story[s.id]||(PF.story[s.id]=[]); a[m.ci]=Math.max(a[m.ci]||0,st); pfSave(); achCheck({}); line=(m.ci+1)+'장 '+'★'.repeat(st)+(st<2?' · ★★ 조건: '+goalTxt(c.goal):''); } else if(over.winner) line=(m.ci+1)+'장 · 다시 겨뤄 볼 수 있다'; }
      else if(m.kind==='daily'&&over.winner){ const d=today(); if(PF.daily.d!==d){ const y=new Date(Date.now()-864e5),yd=y.getFullYear()+'-'+String(y.getMonth()+1).padStart(2,'0')+'-'+String(y.getDate()).padStart(2,'0'); PF.dstreak=win?(PF.daily.d===yd&&PF.daily.win?PF.dstreak+1:1):0; if(win) PF.dwin++; PF.daily={d,win,rank:win?rankOf():'',t:over.t}; pfSave(); achCheck({}); line='오늘의 도전 · 기록에 남았다'; } else line='오늘의 도전 · 이미 기록이 있어 이번 판은 남지 않는다'; }
      if(line) $('r-sub').textContent=line+' · '+$('r-sub').textContent; SPM=null; keepBack(); showResult.last=over.winner?m:null; $('back').textContent=m.kind==='story'?'이야기로 돌아가기':'돌아가기'; } else { showResult.last=null; $('back').textContent='캐릭터 바꾸기'; } };
  /* 결과 화면의 '다시'·'돌아가기'는 이야기·도전 판이었으면 그 판으로 잇는다 */
  $('again').onclick=()=>{ const m=showResult.last; if(m){ $('res').hidden=true; $('sel').hidden=false; spGo(m); } else launch(); };
  const bk0=$('back').onclick; $('back').onclick=()=>{ const m=showResult.last; bk0(); if(m&&m.kind==='story') storyScreen(m.si); else if(m) dailyScreen(); }; }

/* ───── 대전 화면의 모험 칸 ───── */
function hubCard(){ const el=$('twcard'); if(!el) return; const s=twLoad(),d=PF.daily.d===today(),st=STORY.reduce((a,x)=>a+x.ch.reduce((b,_,j)=>b+stStar(x,j),0),0),sm=STORY.reduce((a,x)=>a+x.ch.length*2,0);
  el.innerHTML='<b style="font:600 15px var(--display)">모험</b><div class="row" style="margin-top:8px"><button type="button" id="hub-tw">등반<small style="display:block;font-size:10.5px;opacity:.75">'+(s?'이어서 '+s.floor+'층':'최고 '+PF.tw.best+'층')+'</small></button><button type="button" id="hub-st">이야기<small style="display:block;font-size:10.5px;opacity:.75">★ '+st+' / '+sm+'</small></button><button type="button" id="hub-dy">오늘의 도전<small style="display:block;font-size:10.5px;opacity:.75">'+(d?(PF.daily.win?'이겼다 '+PF.daily.rank:'졌다'):'아직 안 했다')+'</small></button></div>'; }
function towerHome(){ const s=twLoad(); $('tw-body').innerHTML=head('TOWER','등반','가장 높이 '+PF.tw.best+'층'+(CH[PF.tw.key]?' · '+CH[PF.tw.key].name.split(', ')[1]:''))+'<p class="note">지금 고른 내 캐릭터('+esc(CH[kOf('me')].name)+')로 층을 오른다. 이길 때마다 보상을 고르고, 다음 길을 고른다. 체력은 이어지고 이기면 최대 체력의 30%를 되찾는다. 5층마다 보스 몬스터와 마왕이 번갈아 나온다. 지면 끝난다.</p><div class="dock">'+(s?'<button class="go" id="tw-res" type="button">이어서 · '+s.floor+'층 ('+CH[s.key].name.split(', ')[1]+')</button>':'')+'<button class="'+(s?'ghost':'go')+'" id="tw-new" type="button">'+(s?'새로 오르기 (하던 등반은 지워진다)':'오르기 시작')+'</button><button class="ghost" id="tw-out" type="button">닫기</button></div>'; $('tower').hidden=false; $('tower').scrollTop=0; }
document.addEventListener('click',e=>{ const t=e.target.closest('#hub-tw,#hub-st,#hub-dy,#tw-new,#tw-res,#tw-go,#tw-out,#tw-again,#tw-info,#tw-shopout,#st-back,#dy-go,#dy-me,#dy-foe,[data-rw],[data-path],[data-buy],[data-st],[data-sc],[data-sgo]'); if(!t||t.disabled) return; const D=t.dataset;
  if(t.id==='hub-tw') towerHome(); else if(t.id==='hub-st'||t.id==='st-back') storyScreen(); else if(t.id==='hub-dy') dailyScreen();
  else if(t.id==='tw-new'||t.id==='tw-again') towerStart(false); else if(t.id==='tw-res') towerStart(true); else if(t.id==='tw-go') towerGo(); else if(t.id==='tw-out'){ $('tower').hidden=true; hubCard(); } else if(t.id==='tw-info') info(TW.next.k);
  else if(t.id==='tw-shopout'){ TW.shop=null; genFork(); twStore(); towerScreen(); } else if(D.rw&&TW&&TW.rew) towerTake(TW.rew[+D.rw]); else if(D.path&&TW&&TW.fork) towerPath(+D.path); else if(D.buy&&TW&&TW.shop) towerBuy(+D.buy);
  else if(D.st) storyScreen(+D.st); else if(D.sc){ const [a,b]=D.sc.split(',').map(Number); storyScreen(a,b); } else if(D.sgo){ const [a,b]=D.sgo.split(',').map(Number); spGo({kind:'story',si:a,ci:b,cfg:STORY[a].ch[b].cfg}); }
  else if(t.id==='dy-go') spGo({kind:'daily',cfg:dailyOf(today())}); else if(t.id==='dy-me') info(dailyOf(today()).me); else if(t.id==='dy-foe') info(dailyOf(today()).foe); });

/* ───── 기록 화면 ───── */
function drawRec(){ const el=$('rec'); if(!el) return; const tot=PF.w+PF.l,L=Object.entries(PF.ch).filter(x=>CH[x[0]]).sort((a,b)=>b[1].w-a[1].w).slice(0,8),got=ACH.filter(a=>PF.ach[a[0]]).length;
  el.innerHTML='<h2>전적</h2><div class="pl"><b>'+PF.w+'승 '+PF.l+'패</b><span style="color:var(--muted)">'+(tot?'승률 '+Math.round(PF.w/tot*100)+'% · ':'')+'연승 '+PF.streak+'</span></div><div class="pl"><b>등반 최고 '+PF.tw.best+'층</b><span style="color:var(--muted)">'+(CH[PF.tw.key]?CH[PF.tw.key].name.split(', ')[1]+' · ':'')+PF.tw.runs+'번 올랐다</span></div>'
   +'<div class="pl"><b>이야기 ★ '+STORY.reduce((a,x)=>a+x.ch.reduce((b,_,j)=>b+stStar(x,j),0),0)+' / '+STORY.reduce((a,x)=>a+x.ch.length*2,0)+'</b><span style="color:var(--muted)">오늘의 도전 '+PF.dwin+'승 · 내리 '+PF.dstreak+'일</span></div>'
   +'<h2>해금</h2>'+Object.keys(NEEDS).map(g=>{ const all=Object.values(CH).filter(c=>!c.re&&c.grade===g),op=all.filter(c=>!locked(c.key)).length; return '<div class="pl" style="opacity:'+(gradeOpen(g)?1:.55)+'"><b>'+(gradeOpen(g)?'◆ ':'◇ ')+g+' '+op+' / '+all.length+'</b><span style="color:var(--muted)">'+NEEDS[g][0]+'승'+(NEEDS[g][1]?' 또는 등반 '+NEEDS[g][1]+'층':'')+(MEET[g]?' + 상대로 이기기':'')+'</span></div>'; }).join('')+'<div class="pl"><b>재림</b><span style="color:var(--muted)">원래 캐릭터로 '+REWIN+'승</span></div>'+'<button class="ghost" id="rec-open" type="button">'+(PF.open?'모두 열어 둠 · 눌러서 해금 방식으로':'해금 방식 · 눌러서 모두 열기')+'</button><p class="note">조건을 못 채운 캐릭터는 내 캐릭터 칸에서 보이지 않는다. 연습, 상대·팀원 칸, 이야기, 오늘의 도전, 조합 캐릭터는 언제나 열려 있다.</p>'
   +'<h2>숙련</h2>'+(L.length?L.map(([k,c])=>'<div class="pl"><b>'+esc(CH[k].name.split(', ')[1])+mastery(k)+'</b><span style="color:var(--muted)">'+c.w+'승 '+c.l+'패</span></div>').join('')+'<p class="note">★ 1승 · ★★ 5승 · ★★★ 15승. 캐릭터 고르는 칸에도 뜬다.</p>':'<p class="sub">아직 싸운 기록이 없다.</p>')
   +'<h2>업적 '+got+' / '+ACH.length+'</h2>'+ACH.map(a=>'<div class="pl" style="border-left-color:'+(PF.ach[a[0]]?'var(--gold)':'var(--line)')+';opacity:'+(PF.ach[a[0]]?1:.55)+'"><b>'+(PF.ach[a[0]]?'◆ ':'◇ ')+a[1]+'</b><span style="color:var(--muted)">'+a[2]+'</span></div>').join('')
   +'<button class="ghost" id="rec-reset" type="button" style="margin-top:14px">기록 모두 지우기</button>'; }
{ let armed=0; document.addEventListener('click',e=>{ if(!e.target.closest('#rec-reset')) return; const t=performance.now(); if(t-armed>2600){ armed=t; toast('한 번 더 누르면 기록을 모두 지운다'); return; } armed=0; Object.assign(PF,{w:0,l:0,streak:0,ch:{},ach:{},tw:{best:0,key:'',runs:0},mon:{},story:{},daily:{},dstreak:0,dwin:0,beat:{}}); pfSave(); drawRec(); hubCard(); drawSel(); });
  document.addEventListener('click',e=>{ if(!e.target.closest('#rec-open')) return; PF.open=!PF.open; pfSave(); drawRec(); drawSel(); });
  const gp0=goPage; goPage=function(p){ gp0(p); if(p==='rec') drawRec(); if(p==='play') hubCard(); if(p==='chars') drawSel(); }; }
hubCard();

/* ───── 설정 화면 정리: 만들기·도구를 맨 위로, 설정은 묶음으로 접어 둔다 ───── */
{ const GROUPS=[['화면',['ori','full','q','fps']],['조작',['ui','lefty','fst','guide']],['전투 표시',['tele','log','nums','edge','imp','shake','stop']],['소리 · 진동',['els','vib']]],openG=new Set(['화면']);
  drawOpts=function(){ const one=s=>'<h2>'+s.name+'</h2><div class="row" data-o="'+s.k+'">'+s.opts.map(o=>'<button type="button" data-v="'+o[0]+'" aria-pressed="'+(String(OPT[s.k])===String(o[0]))+'">'+o[1]+'</button>').join('')+'</div>'+(s.note?'<p class="note">'+s.note+'</p>':''),used=new Set(GROUPS.flatMap(g=>g[1])),rest=SETTINGS.filter(s=>!used.has(s.k));
    const h=GROUPS.concat(rest.length?[['그 밖',rest.map(s=>s.k)]]:[]).map(g=>'<details class="opt og" data-g="'+g[0]+'"'+(openG.has(g[0])?' open':'')+'><summary>'+g[0]+' <small style="color:var(--muted);font-weight:400">'+g[1].map(k=>(SETTINGS.find(s=>s.k===k)||{}).name).filter(Boolean).slice(0,3).join(' · ')+(g[1].length>3?' …':'')+'</small></summary>'+g[1].map(k=>SETTINGS.find(s=>s.k===k)).filter(Boolean).map(one).join('')+'</details>').join('');
    document.querySelectorAll('.optbox').forEach(b=>b.innerHTML=h); };
  document.addEventListener('toggle',e=>{ const d=e.target; if(d.classList&&d.classList.contains('og')){ if(d.open) openG.add(d.dataset.g); else openG.delete(d.dataset.g); } },true);
  const sec=document.querySelector('section[data-page="opts"]'); if(sec){ const box=document.createElement('div'); box.innerHTML='<h2>만들기 · 도구</h2><div class="tools" id="tools"></div><p class="sub" style="margin-top:8px">판 v'+(typeof APPV!=='undefined'?APPV:'')+'</p><h2>설정</h2>'; const first=sec.firstElementChild; sec.insertBefore(box,first); if(first&&first.tagName==='H2') first.remove();
    const lab={buildb:['조합 캐릭터','스킬 · 권능 · 장비'],forgeb:['카드로 만들기','카드 글 → 캐릭터 초안'],benchb:['대전표','컴퓨터끼리 승률'],helpb:['도움말','조작과 규칙'],instb:['앱으로 설치','홈 화면에 추가']}; for(const id in lab){ const b=$(id); if(!b) continue; b.className='tool'; b.innerHTML='<b>'+lab[id][0]+'</b><small>'+lab[id][1]+'</small>'; $('tools').appendChild(b); } }
  drawOpts(); }
