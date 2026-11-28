"use strict";
/* 등반 · 이야기 · 오늘의 도전 · 판 끝 · 기록 · 설정 · 시작 화면 정리 */
/* 게임다운 겉옷. 여기 규칙(층 구성 · 보상 · 해금 조건 · 장의 조건)은 카드가 아니라 시험장에서 정한 것이다.
   1) 등반: 한 캐릭터로 층을 오른다. 이기면 보상을 고르고 다음 길(평범 · 정예 · 저주 · 쉼터 · 상인)을 고른다. 5층마다 보스 몬스터와 마왕이 번갈아 나온다.
   2) 이야기: 정리본에 적힌 싸움을 장으로 묶었다. 장을 더하려면 STORY에 한 덩이(cfg = 누가 누구와 어떤 방식으로, goal = 별 둘 조건, src = 정리본 문장).
   3) 오늘의 도전: 날짜로 정해지는 1대1 한 판.
   4) 보유와 뽑기: 에이·비라로 시작해 코인으로 뽑는다(PULL · GRATE · 별무리 뽑기). 기록 화면에서 모두 열 수 있다.
   5) 기록: 승패, 숙련, 업적(ACH에 한 줄). 이 기기에만 남는다(aetherProfile).
   6) 평가: 1대1에서 이기면 남은 체력으로 S·A·B·C. */
/* 판 표기: 대규모 . 중규모 . 마이너(밸런스 · 버그). 고쳐 내보낼 때 여기와 PATCH(맨 아래), sw.js의 V, net.js의 APPV를 함께 올린다 */
const VER='2.2.1';
const PF=(()=>{ let d; try{ d=JSON.parse(localStorage.getItem('aetherProfile')||'null'); }catch(x){} d=d||{}; return Object.assign({w:0,l:0,streak:0,ch:{},ach:{},tw:{best:0,key:'',runs:0},mon:{},story:{},daily:{},dstreak:0,dwin:0,open:false,beat:{},own:{},re:{},coin:1500,star:0},d); })();
/* 1.8.4 저장된 기록의 꼴을 맞춘다: 숫자 칸은 숫자로, 표 칸은 표로(가져온 저장 글에 엉뚱한 값이 섞여 있어도 화면이 깨지지 않게) */
{ const N=v=>{ v=+v; return Number.isFinite(v)?Math.min(1e9,Math.max(0,v)):0; },O=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{},NM=o=>{ o=O(o); for(const k of Object.keys(o)) o[k]=N(o[k]); return o; };
  for(const k of ['w','l','streak','dstreak','dwin','coin','star','xp','pity']) if(k in PF) PF[k]=N(PF[k]);
  for(const k of ['shard','dup','mon']) if(k in PF) PF[k]=NM(PF[k]); if(PF.shard) for(const k of Object.keys(PF.shard)) PF.shard[k]=Math.min(PF.shard[k],1e4);
  /* 1.9.11 임무 목록: 꼴이 깨졌으면 다시 뽑게 지운다 */ if('ms' in PF){ const M=O(PF.ms),ok=L=>Array.isArray(L)&&L.every(m=>m&&typeof m==='object'&&!Array.isArray(m)); for(const [l,d] of [['dl','d'],['wl','w']]) if(l in M&&!ok(M[l])){ delete M[l]; delete M[d]; } for(const l of ['dl','wl']) if(Array.isArray(M[l])) M[l].forEach(m=>{ for(const k of ['p','n','coin','star']) m[k]=N(m[k]); for(const k of ['t','txt','cls']) if(k in m) m[k]=String(m[k]).slice(0,80); m.c=!!m.c; }); PF.ms=M; }
  /* cnt 안의 cls(직업별 승리 수)는 표다. 숫자로 덮으면 손님 승리 때 멈췄다(1.9.4) */
  if('cnt' in PF){ const c=O(PF.cnt); for(const k of Object.keys(c)) c[k]=k==='cls'?NM(c[k]):N(c[k]); PF.cnt=c; }
  for(const k of ['own','re','ach','achPaid','codes','done','rf','beat','daily','ms']) if(k in PF) PF[k]=O(PF[k]);
  PF.ch=O(PF.ch); for(const k of Object.keys(PF.ch)){ const c=PF.ch[k]; if(!c||typeof c!=='object'){ delete PF.ch[k]; continue; } c.w=N(c.w); c.l=N(c.l); }
  PF.tw=O(PF.tw); PF.tw.best=N(PF.tw.best); PF.tw.runs=N(PF.tw.runs); PF.tw.key=typeof PF.tw.key==='string'?PF.tw.key:'';
  PF.story=O(PF.story); for(const k of Object.keys(PF.story)){ if(Array.isArray(PF.story[k])) PF.story[k]=PF.story[k].map(N); else delete PF.story[k]; }
  if(PF.daily.rank!==undefined&&!['S','A','B','C',''].includes(PF.daily.rank)) PF.daily.rank='';
  if(PF.daily.d!==undefined&&typeof PF.daily.d!=='string') PF.daily.d='';
  for(const k of ['open','palace']) if(k in PF) PF[k]=k==='open'?!!PF[k]:(PF[k]?1:0); }
for(const k of ['ei','vira']) PF.own[k]=PF.own[k]||1;
/* 1.9.11: 기록을 지우는 중이거나 다른 창이 더 새 진행을 저장했으면 이 창은 저장하지 않는다(game/v1.9.11.js) */
let PFLOCK=false;
const pfSave=()=>{ if(PFLOCK) return; for(const k of ['coin','star']) if(!Number.isFinite(PF[k])||PF[k]<0) PF[k]=0; try{ localStorage.setItem('aetherProfile',JSON.stringify(PF)); }catch(x){} };   /* 코인 · 별무리가 수가 아니거나 0보다 작으면 0으로 */
const baseKey=k=>CH[k]&&CH[k].re?CH[k].base:k;
const stars=k=>{ const w=(PF.ch[k]||{}).w||0; return w>=15?3:w>=5?2:w>=1?1:0; };
function mastery(k){ const n=stars(k); return n?' <span style="color:#e3c377;letter-spacing:1px" title="숙련">'+'★'.repeat(n)+'</span>':''; }
const rankOf=()=>{ const p=me.hp/me.max; return p>=.7?'S':p>=.4?'A':p>=.15?'B':'C'; };
const ACH=[
 ['first','첫 승리','한 번 이긴다',()=>PF.w>=1],['w10','열 번의 승리','10승',()=>PF.w>=10],['w50','백전노장','50승',()=>PF.w>=50],
 ['st3','연승','3연승',()=>PF.streak>=3],['st7','파죽지세','7연승',()=>PF.streak>=7],
 ['clean','완승','1대1에서 체력 90% 이상을 남기고 이긴다',x=>x.win&&x.solo&&me.hp>=me.max*.9],['edge','기사회생','체력 10% 아래로 이긴다',x=>x.win&&!me.dead&&me.hp<=me.max*.1],['fast','속전속결','1대1을 10초 안에 끝낸다',x=>x.win&&x.solo&&over.t<=10],
 ['hard','강적','어려움 난이도 1대1에서 이긴다',x=>x.win&&x.solo&&diff===2],['myth','신살','신화가 아닌 캐릭터로 신화를 1대1에서 이긴다',x=>x.win&&x.solo&&foe.c.grade==='신화'&&me.c.grade!=='신화'],
 ['v10','두루 쓰는 손','서로 다른 캐릭터 10명으로 이긴다',()=>Object.values(PF.ch).filter(c=>c.w>0).length>=10],['v40','만물상','서로 다른 캐릭터 40명으로 이긴다',()=>Object.values(PF.ch).filter(c=>c.w>0).length>=40],
 ['m3','손에 익은 무기','한 캐릭터로 15승 (★★★)',()=>Object.values(PF.ch).some(c=>c.w>=15)],['built','내가 만든 영웅','조합 캐릭터로 이긴다',x=>x.win&&me.c.built],
 ['golem','골렘 사냥','골렘을 쓰러뜨린다',()=>PF.mon.golem>0],['hydra','히드라 사냥','히드라를 쓰러뜨린다',()=>PF.mon.hydra>0],
 ['g10','작은 모임','캐릭터 10명을 가진다',()=>Object.keys(PF.own).length>=10],['g50','큰 모임','캐릭터 50명을 가진다',()=>Object.keys(PF.own).length>=50],['gmyth','신화를 품다','신화 캐릭터를 가진다',()=>Object.keys(PF.own).some(k=>CH[k]&&CH[k].grade==='신화')],
 ['korhen','학살자를 멈추다','코르헨을 쓰러뜨린다',()=>PF.mon.korhen>0],['st1','첫 장','이야기 한 장을 넘긴다',()=>Object.values(PF.story).some(a=>a.some(x=>x>0))],['stmax','첫 번째 용사','맥스 이야기를 끝까지 본다',()=>(PF.story.max||[]).filter(x=>x>0).length>=5],['stall','빠짐없이','이야기의 별을 모두 모은다',()=>STORY.every(s=>s.ch.every((_,j)=>((PF.story[s.id]||[])[j]||0)>=2))],
 ['d1','오늘의 승리','오늘의 도전을 이긴다',()=>PF.dwin>=1],['d7','이레','오늘의 도전을 이레 내리 이긴다',()=>PF.dstreak>=7],
 ['t5','다섯 층','등반 5층을 넘는다',()=>PF.tw.best>=5],['t10','열 층','등반 10층을 넘는다',()=>PF.tw.best>=10],['t15','꼭대기','등반 15층을 넘는다',()=>PF.tw.best>=15],['t25','구름 위','등반 25층을 넘는다',()=>PF.tw.best>=25]
];
function achCheck(x){ const got=[]; for(const a of ACH){ if(PF.ach[a[0]]) continue; let ok=false; try{ ok=a[3](x||{}); }catch(e){} if(ok){ PF.ach[a[0]]=Date.now(); got.push(a[1]); } } if(got.length){ pfSave(); setTimeout(()=>toast('업적 달성 · '+got.join(' · '),3600),1200); } }
const openSet=()=>Object.keys(CH).filter(k=>!CH[k].re&&!locked(k));
on('end',w=>{ if(practice||!w||NET.client) return; const was=new Set(openSet()); setTimeout(()=>{ const nw=openSet().filter(k=>!was.has(k)); if(nw.length&&0) toast('새로 열린 캐릭터 · '+nw.slice(0,4).map(k=>CH[k].name.split(', ')[1]).join(' · ')+(nw.length>4?' 외 '+(nw.length-4)+'명':''),4200); },2600); const win=w.team===0,k=baseKey((typeof tagHostChar==='function'?tagHostChar():me).key),solo=ents.length===2&&!RAID()&&!(mode===7&&!practice),c=PF.ch[k]||(PF.ch[k]={w:0,l:0});
  { const g=earn(win); showResult.gain=g; setTimeout(()=>toast('코인 +'+g.c+(g.st?' · 별무리의 흔적 +'+g.st:'')+(g.note?' · '+g.note:''),2600),200); }
  if(win){ PF.w++; PF.streak++; c.w++; const bz=ents.find(o=>o.c&&o.c.mon); if(bz) PF.mon[bz.key]=(PF.mon[bz.key]||0)+1; } else { PF.l++; PF.streak=0; c.l++; } pfSave(); achCheck({win,solo}); });

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
/* 빌려 쓴 설정이 싸움 없이 남아 있으면(도중에 화면이 닫힌 경우) 되돌린다 */
function keepFix(){ if(KEEP&&!running&&!(TW&&TW.on)&&!SPM&&!(typeof TUT!=='undefined'&&(TUT.on||TUT.active))) keepBack(); }
function setup(x){ keepSet(); practice=false; mode=x.mode||1; teamN=x.teamN||1; diff=x.diff==null?1:x.diff; const c=CH[x.me]; sel.me=c.re?c.base:x.me; sel.meR=!!c.re||!!x.meR; if(x.mon){ OPT.mon=x.mon; OPT.monhp='fit'; } else { const f=CH[x.foe]; sel.foe=f.re?f.base:x.foe; sel.foeR=!!f.re||!!x.foeR; }
  sel.al=[0,1,2,3].map(j=>(x.al||[])[j]||null); sel.fo=[0,1,2,3].map(j=>(x.fo||[])[j]||null); if(x.raid) OPT.raid=x.raid; OPT.myth=x.myth?1:0; if(x.map&&MAPS[x.map]) OPT.map=x.map; }

/* ───── 해금: 처음에는 고화만. 이기고 오르면 윗등급이 열린다. 연습과 상대·팀원 칸은 언제나 모두 열려 있다 ───── */
/* ───── 보유와 뽑기 ─────
   처음부터 가진 캐릭터는 에이와 비라 둘. 나머지는 코인으로 뽑는다. 가지지 않은 캐릭터는 내 캐릭터 칸에 보이지 않는다(상대·팀원 칸, 연습, 이야기, 오늘의 도전은 모두 열려 있다).
   코인과 별무리의 흔적을 버는 양은 기획 그대로다('균형' 채널): 이기면 250~400 코인, 지면 200~350 코인(1.9.0), 40% 확률로 별무리의 흔적 1개. 컴퓨터 실력 배율 쉬움 0.6 · 보통 0.8 · 어려움 1.
   시험장에서는 한 판을 기준으로 준다(이기면 처치 몫, 지면 사망 몫). 뽑기 값·확률·겹쳤을 때의 보상·별무리 교환 값은 기획에 없어 시험장에서 정했다. */
const START=['ei','vira'], PULL=1500, PULL10=13500;
const GRATE=[['고화',75],['서사',22],['전설',3]];   /* 한 번 뽑을 때 등급이 나올 확률(%). 히든 · 신화는 뽑기에서 나오지 않는다 */
const REWIN=15, RECOST={고화:20,서사:30,전설:50,히든:80,신화:120};   /* 재림 · 완성: 원래 캐릭터로 15승 + 별무리의 흔적(중복 수는 v1.0-1.2.js의 RDUP) */
const DIFFPAY=[.6,.8,1];                                                            /* 컴퓨터 실력에 따른 코인 배수(쉬움 · 보통 · 어려움) */
const gachaPool=g=>Object.keys(CH).filter(k=>{ const c=CH[k]; return !c.re&&!c.built&&!c.custom&&!c.mon&&!c.mob&&!c.kit&&c.grade===g; });
const owned=k=>!!PF.own[baseKey(k)];
function locked(k){ const c0=CH[k]; if(!c0||PF.open) return false; const b=baseKey(k),c=CH[b]; if(!c||c.built||c.custom||c.mon||c.mob||c.kit) return false; if(!PF.own[b]) return true; return !!c0.re&&!PF.re[b]; }
function lockWhy(k){ /* 뒤의 판에서 통째로 바꿨다. 이 몸통은 쓰지 않는다 */ }
function lockNote(tab,qq){ if(slot!=='me'||practice||PF.open) return ''; const L=Object.values(CH).filter(c=>!c.re&&(qq?c.name.includes(qq):c.cls===tab)&&locked(c.key)); if(!L.length) return '';
  return '<p class="note" style="margin-top:10px">아직 가지지 않은 캐릭터 '+L.length+'명은 보이지 않는다. 아래 가방 탭의 뽑기에서 코인으로 데려온다(처음 나오면 바로 얻는다).\n상대 칸과 연습에서는 모두 보인다.</p>'; }
function earn(win){ const r=(a,b)=>a+Math.floor(Math.random()*(b-a+1)),m=DIFFPAY[diff]==null?1:DIFFPAY[diff],c=Math.round((win?r(250,400):r(200,350))*m),st=Math.random()<.4?1:0; PF.coin+=c; PF.star+=st; return {c,st}; }
function pullOne(minIdx){ /* 뒤의 판에서 통째로 바꿨다. 이 몸통은 쓰지 않는다 */ }
function pulls(n){ const cost=n===10?PULL10:PULL*n; if(PF.coin<cost) return toast('코인이 모자라다 · '+(cost-PF.coin).toLocaleString()+' 더 필요하다'),null; PF.coin-=cost; const L=[]; for(let i=0;i<n;i++){ const sure=n===10&&i===9&&!L.some(r=>r.g!=='고화'); L.push(pullOne(sure?1:0)); } pfSave(); achCheck({}); return L.filter(Boolean); }
function gachaScreen(res){ /* 뒤의 판에서 통째로 바꿨다. 이 몸통은 쓰지 않는다 */ }
{ const pc0=pickCh; pickCh=function(k){ if(slot==='me'&&!practice&&locked(k)) return toast('아직 가지지 않았다 · '+lockWhy(k)+' (연습에서는 쓸 수 있다)',3000); pc0(k); };
  const la0=launch; launch=function(){ keepFix(); if(NET.host&&!KEEP&&typeof okKey==='function'&&!okKey(sel.me)) return toast('만든 캐릭터는 함께에서 쓸 수 없다 · 다른 캐릭터를 고른다',3000); if(!KEEP&&!practice&&!NET.client&&locked(kOf('me'))) return toast('내 캐릭터가 아직 잠겨 있다 · '+lockWhy(kOf('me')),3000); return la0(); }; $('start').onclick=()=>launch(); }

/* ───── 등반 ─────
   길: 싸움 층을 넘을 때마다 다음 길을 고른다. 평범한 길 · 험한 길(정예) · 저주받은 길(불리한 조건, 권능 보상이 둘) · 무리의 길 · 쉼터 · 상인.
   5층마다 보스: 몬스터와 마왕(15층마다, 전설 · 신화 캐릭터)이 번갈아 나온다.

   ════ 등반 수치표 TWB (1.9.10) ════
   등반 밸런스 숫자는 모두 이 표에 있다. 밸런스를 고칠 때는 이 표만 바꾼다(밸런스 판도 이 표를 읽는다).
   층(f)은 1부터 센다. [이 층까지, 값] 꼴의 목록은 위에서부터 처음 맞는 줄을 쓴다.
   상대 보정(stat)은 game/v1.9.10.js에서 판이 시작될 때 건다. 꼬리표 · 시너지도 game/v1.9.10.js에 있다. */
const TWB={
  diff:[[2,0],[5,1],[Infinity,2]],                                     /* 컴퓨터 실력: 0 쉬움 · 1 보통 · 2 어려움 (정예는 늘 어려움) */
  foe:{1:['고화'],2:['고화'],3:['고화'],4:['서사'],6:['서사'],7:['서사'],8:['서사','전설'],9:['서사','전설']},   /* 1~10층 상대 등급(5 · 10층은 보스) */
  foeHigh:['전설','신화'],                                             /* 11층부터 상대 등급 */
  lord:[[15,['전설']],[Infinity,['전설','신화']]],                      /* 마왕(15 · 30 · 45…층) 등급 */
  stat:{                                                               /* 상대 능력치 보정(퍼센트). 1층을 0으로 두고 더해 간다. 스킬 = 기본 공격이 아닌 모든 피해 */
    per:[[5,{hp:2.5,skill:2.5}],[15,{hp:4,skill:3.5}],[39,{hp:11,skill:5.5}],[79,{hp:11,skill:8}],[Infinity,{hp:11,skill:11}]],   /* 층마다(2층부터): 5층까지 · 6층부터 · 16층부터 · 40층부터 · 80층부터(2.2에서 더 올렸다) */
    every5:{hp:4,basic:[[15,6],[20,10],[49,18],[Infinity,30]]},         /* 5층마다 더: 체력 4% · 기본 공격(5~15층 6% · 20층 10% · 25층부터 18% · 50층부터 30%, 2.2) */
    every10:{hp:7.5,skill:2.5} },                                       /* 10층마다 더 */
  elite:{hp:1.8,dmg:1.3}, lordHp:3.5, bossPer20:.6,                       /* 길 배율: 정예 체력 · 주는 피해, 마왕 체력, 보스는 20층마다 체력 +60% */
  curse:{frail:1.25,swift:.25},                                         /* 저주: 깨진 갑옷(받는 피해 ×) · 쫓기는 길(상대 기동력 +) */
  pwCap:[[3,3],[6,5],[10,7],[Infinity,9]],                              /* 보상 · 상인 권능의 가장 높은 단계 */
  gearStep:3,                                                           /* 장비 기준 등급: 3층마다 한 등급(공설 → 신화). 좋은 길(보스 · 마왕 · 저주) 보상과 상인 하나는 한 등급 위 */
  gradeW:[5,3,2,1],                                                     /* 등급 확률 비중: 기준 등급 · 한 등급 아래 · 두 등급 아래 · 그 아래 모두. 기준보다 높은 등급은 안 나온다 */
  pay:{coin:[50,25],low:[10,.8],boss:[[19,1],[Infinity,2]],mcoin:150,mstar:5,     /* 층 코인 50+층×25 · 1~10층 ×0.8 · 보스/마왕 층 별무리 · 5층마다 처음 넘으면 코인 층×150(1~10층 ×0.8) · 별무리 층÷5 */
    diff:[[2,0],[5,1],[Infinity,2]]},                                  /* 판 승리 코인의 실력 배율 구간(1.9.9 그대로: 1~2층 쉬움 · 3~5층 보통 · 6층부터 어려움, 정예는 어려움). 컴퓨터 실력 구간(diff)과 따로 본다 */
  gold:{win:10,s:5,hard:10,horde:5,big:20},                            /* 증표: 이김 · S 등급 · 정예/저주 · 무리 · 보스/마왕 */
  heal:{win:.3,winBy:[[49,.2],[99,.12],[Infinity,.06]],kill:.08,killHorde:.04,rest:.5,restCut:.85},   /* 2.0: 층을 넘는 회복은 50층부터 20% · 100층부터 10%(winBy), 무리 판 처치 회복은 5%(killHorde) */
  pct:{from:10,base:.2,per10:.1,max:.8,bossCap:.04}, cc:[[49,1],[79,.8],[Infinity,.6]], cap:{take:.5,dodge:.3,reflect:.4,leech:10}, affixFrom:20,   /* 2.0: 체력 비례 피해 저항 · 상대가 받는 상태이상 지속 배율 · 겹침 상한 · 정예 강화가 붙는 층 */                            /* 회복: 층을 넘으면 최대 체력의 · 적을 쓰러뜨리면 잃은 체력의 · 쉼터는 최대 체력의 · 체력이 이만큼 넘으면 보상에 휴식이 안 나온다 */
  shop:{pw:[20,5],gear:[20,10],train:25,hone:25,rest:20,up:10,hi:1.5},   /* 2.0: 단련 · 연마는 살 때마다 +up, 7단계 이상 권능 · 전설 이상 장비는 ×hi */              /* 상인 값(증표): 권능 20+5×단계 · 장비 20+10×등급(공설 0 ~ 신화 5) · 단련 · 연마 · 휴식 */
  boon:{train:50,hone:1},                                               /* 단련 최대 체력 · 연마 기본 공격 */
  path:{hard:.5,side:.65,rest:.5,restGold:20},                         /* 길: 험한 길이 정예일 확률(아니면 저주) · 쉼터/상인 길이 하나 더 나올 확률 · 그중 쉼터일 확률(증표가 이보다 적으면 늘 쉼터) */
  horde:{n:[[3,2],[9,3],[Infinity,4]],step:3},                         /* 무리: 마리 수(이 층까지) · 적 세기가 한 단계 오르는 층 간격 */
  cardAtk:.5                                                            /* 카드에서 온 무기의 기본 공격 증가는 등반에서 이만큼만 든다 */
};
const twBand=(L,f)=>{ for(const r of L) if(f<=r[0]) return r[1]; return L[L.length-1][1]; };
const twDiff=f=>twBand(TWB.diff,f), lvCap=f=>twBand(TWB.pwCap,f);
/* 상대 보정 배율 {hp, skill, basic} */
function twFoeStat(f){ f=Math.max(1,f|0); const S=TWB.stat; let hp=0,skill=0,basic=0;
  for(let k=2;k<=f;k++){ const b=twBand(S.per,k); hp+=b.hp; skill+=b.skill; }
  for(let k=5;k<=f;k+=5){ hp+=S.every5.hp; basic+=twBand(S.every5.basic,k); }
  for(let k=10;k<=f;k+=10){ hp+=S.every10.hp; skill+=S.every10.skill; }
  return {hp:1+hp/100,skill:1+skill/100,basic:1+basic/100}; }
const twPct=x=>{ const v=Math.round((x-1)*1000)/10; return (v%1?v.toFixed(1):String(v))+'%'; };
const twStatTxt=f=>{ const S=twFoeStat(f),L=[]; if(S.hp>1) L.push('상대 체력 +'+twPct(S.hp)); if(S.skill>1) L.push('스킬 피해 +'+twPct(S.skill)); if(S.basic>1) L.push('기본 공격 +'+twPct(S.basic)); return L.join(' · '); };
/* 등급: 장비는 GEAR의 grade(공설~신화). 권능은 단계를 비율대로 바꾼다(1~2 공설 · 3 고화 · 4~5 설화 · 6 서사 · 7~8 전설 · 9 신화) */
const PGI=[0,0,0,1,2,2,3,4,4,5], pGi=lv=>PGI[Math.max(1,Math.min(9,lv|0))], pGrade=lv=>GGR[pGi(lv)];
const gBadge=g=>'<span class="tw-gb" style="--gc:'+(GGC[g]||'var(--muted)')+'">'+esc(g)+'</span>';
const BOONS={train:{name:'단련',text:'최대 체력 +'+TWB.boon.train+', 그만큼 회복한다.',price:TWB.shop.train},hone:{name:'연마',text:'기본 공격 +'+TWB.boon.hone+'.',price:TWB.shop.hone},rest:{name:'휴식',text:'체력을 모두 회복한다.',price:TWB.shop.rest}};
const CURSES={frail:{name:'깨진 갑옷',text:'이 층에서는 받는 피해가 '+Math.round((TWB.curse.frail-1)*100)+'% 는다.'},swift:{name:'쫓기는 길',text:'이 층의 상대는 기동력이 '+Math.round(TWB.curse.swift*100)+'% 높다.'},dry:{name:'마른 샘',text:'이 층은 이겨도 체력이 돌아오지 않는다.'}};
const TPOW=()=>Object.keys(POWERS).filter(id=>!POWERS[id].active&&!POWERS[id].gear);
const twIds=()=>TW.pw.concat(gearIds(TW.gear));
/* 등반에서 기본 공격에 더해지는 양: 카드 무기의 무기 피해량은 TWB.cardAtk만 든다(평타만으로 다 되는 것을 막는다) */
const twAtk=()=>{ let a=TW.atkB; for(const id of twIds()){ const m=POWERS[id]&&POWERS[id].mods; if(m&&m.atk) a+=id[0]==='@'&&GEAR[id.slice(1)].src==='카드'?Math.round(m.atk*TWB.cardAtk):m.atk; } return a; };
/* 등급 가중 뽑기: 기준 등급 T 이하에서 등급을 먼저 고르고(TWB.gradeW 비중) 그 등급 안에서 고르게 n개(겹치지 않게) */
function twPickG(items,gOf,T,n){ const pool=items.slice(),out=[];
  while(out.length<n){ const by=new Map(); for(const x of pool){ const g=gOf(x); if(g>=0&&g<=T){ if(!by.has(g)) by.set(g,[]); by.get(g).push(x); } }
    if(!by.size) break; const gs=[...by.keys()],W=gs.map(g=>TWB.gradeW[Math.min(T-g,TWB.gradeW.length-1)]); let r=Math.random()*W.reduce((a,b)=>a+b,0),i=0; while(i<gs.length-1&&r>=W[i]){ r-=W[i]; i++; }
    const L=by.get(gs[i]),x=L[Math.floor(Math.random()*L.length)]; out.push(x); pool.splice(pool.indexOf(x),1); }
  return out; }
const twGearT=(f,up)=>Math.max(0,Math.min(5,Math.floor((Math.max(1,f)-1)/TWB.gearStep)+(up?1:0)));
function rollGear(f,up,skip){ const own=TW&&TW.gear?Object.values(TW.gear):[],L=Object.values(GEAR).filter(x=>!own.includes(x.id)&&!(skip&&skip.includes(x.id))),p=twPickG(L,x=>x.gi,twGearT(f,up),1)[0]; return p?p.id:null; }
function rollPw(f,n){ const cap=lvCap(f),L=TPOW().filter(id=>!TW.pw.includes(id)&&POWERS[id].lv<=cap); return twPickG(L,id=>pGi(POWERS[id].lv),pGi(cap),n); }
let TW=null;
const twLoad=()=>{ try{ const d=JSON.parse(localStorage.getItem('aetherTower')||'null'); if(!d||typeof d!=='object'||!hasK(CH,d.key)||(d.next&&(typeof d.next!=='object'||!hasK(CH,d.next.k)))) return null;
  /* 숫자 칸은 숫자로, 글 칸은 글로. 체력이 비어 있으면(null = 가득) 그대로 둔다(1.9.10: 0으로 바뀌어 1로 시작하던 것을 고쳤다) */ const N=v=>Number.isFinite(+v)?+v:0; for(const k of ['floor','gold','rewN','hpB','atkB','t','best0']) if(k in d) d[k]=N(d[k]); d.hp=d.hp==null||!(N(d.hp)>0)?null:N(d.hp);   /* 1.9.9에서 0으로 저장된 것(살아 있는 등반의 체력은 늘 1 이상)도 가득으로 */
  for(const m of ['php','pmax']){ const p=d[m]&&typeof d[m]==='object'?d[m]:{},q={}; for(const k of Object.keys(p)) if(Number.isFinite(+p[k])&&+p[k]>0) q[k]=+p[k]; d[m]=q; } if(d.rank!==undefined&&!['S','A','B','C',''].includes(d.rank)) d.rank='';
  d.pw=(Array.isArray(d.pw)?d.pw:[]).filter(id=>typeof id==='string'&&hasK(POWERS,id)); d.picks=(Array.isArray(d.picks)?d.picks:[]).map(x=>String(x).slice(0,60)); if(d.gear&&typeof d.gear!=='object') d.gear={};
  if(Array.isArray(d.shop)) d.shop=d.shop.filter(x=>x&&typeof x==='object').map(x=>Object.assign(x,{price:N(x.price)})); else if(d.shop) d.shop=null;
  delete d.fin; delete d.lostView; return Object.assign({gold:0,rewN:0,gear:{}},d,{on:false}); }catch(x){ return null; } };
const twStore=()=>{ try{ if(TW) localStorage.setItem('aetherTower',JSON.stringify(TW)); else localStorage.removeItem('aetherTower'); }catch(x){} };
const isBoss=f=>f%5===0, twMax=()=>CH[TW.key].hp+TW.hpB+statOf(twIds()).hp+(typeof isDone==='function'&&isDone(TW.key)&&canDone(TW.key)?50:0), rnd=a=>a[Math.floor(Math.random()*a.length)];
function twPool(gr){ return Object.keys(CH).filter(k=>{ const c=CH[k]; return !c.re&&!c.built&&!c.custom&&!c.mon&&gr.includes(c.grade)&&k!==TW.key&&k!==(TW.last||''); }); }
/* 상대 등급: 정예(up)는 두 층 위 등급. 그 층이 보스 층이면 제 층 등급 */
const twFoeGr=f=>f>10?TWB.foeHigh:(TWB.foe[f]||null);
function towerFoe(f,up){ if(isBoss(f)){ const i=f/5,B=typeof TBOSS!=='undefined'?TBOSS:MONS; if(i%3!==0) return {t:'fight',k:B[(i-Math.floor(i/3)-1)%B.length],boss:true}; return {t:'fight',k:rnd(twPool(twBand(TWB.lord,f)))||'max',lord:true}; }
  const gr=twFoeGr(f+(up?2:0))||twFoeGr(f)||TWB.foeHigh; return {t:'fight',k:rnd(twPool(gr))||'ei'}; }
/* 무리: 시험장에서 만든 적(foes.js) 여럿. 층이 높을수록 강한 적이 더 많이 나온다 */
function towerHorde(f){ if(typeof MOBS==='undefined') return null; const T=Math.min(5,1+Math.floor((f-1)/TWB.horde.step)),pool=MOBS.filter(m=>m[2]<=T&&m[2]>=T-1).map(m=>m[0]),n=twBand(TWB.horde.n,f),L=[]; for(let i=0;i<n;i++) L.push(rnd(pool)); return {t:'fight',k:L[0],horde:L.slice(1)}; }
function genFork(){ const f=TW.floor; if(isBoss(f)){ TW.next=towerFoe(f); TW.fork=null; return; } const L=[towerFoe(f)]; const hard=Math.random()<TWB.path.hard?Object.assign(towerFoe(f,true),{elite:true}):Object.assign(towerFoe(f),{curse:rnd(Object.keys(CURSES))}); L.push(hard); { const hd=towerHorde(f); if(hd) L.push(hd); }
  if(!TW.rested&&Math.random()<TWB.path.side) L.push({t:Math.random()<TWB.path.rest||TW.gold<TWB.path.restGold?'rest':'shop'}); TW.fork=L; TW.next=null; }
function towerStart(resume){ if(NET.client) return toast('함께 오르는 등반은 방장이 시작한다'); if(NET.host&&NET.players.length>5) return toast('함께 등반은 5명까지 할 수 있다 · 지금 방에 '+NET.players.length+'명',3200); if(!resume){ const k=kOf('me'); if(CH[k].mon) return; if(CH[k].custom||CH[k].built) return toast('조합 · 카드로 만든 캐릭터로는 등반할 수 없다',3000); if(locked(k)) return toast('내 캐릭터가 아직 잠겨 있다 · '+lockWhy(k),3000); TW={best0:PF.tw.best,key:k,floor:1,pw:[],hpB:0,atkB:0,hp:null,t:0,last:'',picks:[],gold:0,rewN:0,gear:{},php:{}}; TW.next=towerFoe(1); PF.tw.runs++; pfSave(); twStore(); } else { TW=twLoad(); if(TW&&!PF.open&&locked(TW.key)&&!(typeof NET!=='undefined'&&(NET.host||NET.client)&&NET.temp&&NET.temp.includes(TW.key))){ const k=TW.key; TW=null; return toast('이 등반의 캐릭터를 지금은 쓸 수 없다 · '+lockWhy(k),3200); } } if(!TW) return; towerScreen(); }
function towerGo(){ if(!TW||TW.on||!TW.next) return; if(NET.host&&NET.players.length>5) return toast('함께 등반은 5명까지 할 수 있다 · 지금 방에 '+NET.players.length+'명',3200); const n=TW.next,N=coopN(); if(N>1){ NET.players.forEach(p=>{ p.team=0; }); lobbyOut(); }
  setup({me:TW.key,foe:n.boss?null:n.k,mon:n.boss?n.k:null,mode:n.boss?6:1,teamN:N,fo:N>1&&!n.boss?Array.from({length:N-1},()=>towerFoe(TW.floor).k):[],diff:n.elite?2:twDiff(TW.floor)}); TW.on=true; $('tower').hidden=true; launch(); }
on('begin',()=>{ if(!TW||!TW.on) return; const f=TW.floor,n=TW.next; { const ids=twIds(); me.c=empower(me.c,ids,twAtk()); } me.atk=me.c.atk; me.r=me.r||{}; me.r._w={}; for(const id of twIds()){ const P=me.r._w[id]={cdT:0}; if(POWERS[id].init) POWERS[id].init(P); } kitInit(me,twIds()); uiBegin();
  me.max=twMax(); me.hp=Math.max(1,Math.min(me.max,TW.hp==null?me.max:TW.hp));
  /* 길 배율(보스 · 마왕 · 정예 · 저주). 층마다 세지는 보정은 game/v1.9.10.js가 모든 상대에게 건다 */
  if(n.boss){ const m=1+TWB.bossPer20*(Math.ceil(f/20)-1); foe.max=foe.hp=Math.round(foe.max*m); } else { foe.max=foe.hp=Math.round(foe.c.hp*(n.lord?TWB.lordHp:1)*(n.elite?TWB.elite.hp:1)); if(n.lord) foe.boss=true; }
  if(n.horde) n.horde.forEach((k,i)=>{ const a=(i+1)*2.1,m=mk(k,1,foe.x+Math.cos(a)*2.6,foe.y+Math.sin(a)*2.6); clamp(m); m.slot=i+1; m.busy=1.5; m.max=m.hp=Math.round(m.c.hp); ents.push(m); });
  if(n.elite){ const c=foe.c,md=c.modDeal; foe.c=Object.assign({},c,{modDeal:(e,t,a,l,o)=>(md?md(e,t,a,l,o):a)*TWB.elite.dmg}); }
  if(n.curse==='frail'){ const c=me.c,mt=c.modTake; me.c=Object.assign({},c,{modTake:(e,src,a,l,o)=>(mt?mt(e,src,a,l,o):a)*(src===e?1:TWB.curse.frail)}); }
  if(n.curse==='swift') add(foe,'haste',9999,TWB.curse.swift,{self:true});
  msg([['등반 '+f+'층 ','#e3c377'],[(n.boss?'보스 ':n.lord?'마왕 ':n.elite?'정예 ':n.curse?'저주 · ':n.horde?'무리 '+(n.horde.length+1)+' · ':'')+short(foe),'#fff6d6'],[' · 체력 '+Math.round(foe.max*twFoeStat(f).hp),'#97a1cf']],1,true); });
/* 층을 넘은 보상 셋: 권능(보스 · 마왕 · 저주 층은 둘) + 장비(그때는 한 등급 위) + 단련 · 연마 · 휴식으로 채운다. 권능 · 장비는 등급 가중 뽑기 */
function rollRewards(allPw){ const f=TW.floor-1,L=rollPw(f,allPw?2:1).map(id=>({t:'pw',id})); { const g=rollGear(f,allPw); if(g) L.push({t:'gear',id:g}); }
  for(const b of ['train','hone','rest'].sort(()=>Math.random()-.5)){ if(L.length>=3) break; if(b==='rest'&&(TW.hp==null||TW.hp>=twMax()*TWB.heal.restCut)) continue; L.push({t:'boon',id:b}); } while(L.length<3) L.push({t:'boon',id:'train'}); return L; }
/* TW.hp가 null이면 가득 찬 것이다(최대 체력이 늘어도 가득). 함께 등반 손님 체력(TW.php)도 똑같이 늘린다(1.9.10: 전에는 방장만 회복했다) */
const twPhp=fn=>{ if(TW.php) for(const k of Object.keys(TW.php)) if(TW.php[k]!=null) TW.php[k]=fn(TW.php[k],(TW.pmax||{})[k]||twMax()); };
function gain(r){ if(r.t==='gear'){ const G=GEAR[r.id],old=TW.hp==null?null:twMax(),s0=statOf(twIds()).hp; TW.gear[G.slot]=r.id; const up=Math.max(0,statOf(twIds()).hp-s0); if(old!=null) TW.hp=Math.max(1,Math.min(twMax(),TW.hp+Math.max(0,twMax()-old))); twPhp(h=>h+up); TW.picks.push(G.name); return; }
  if(r.t==='pw') TW.pw.push(r.id); else if(r.id==='train'){ TW.hpB+=TWB.boon.train; if(TW.hp!=null) TW.hp+=TWB.boon.train; twPhp(h=>h+TWB.boon.train); } else if(r.id==='hone') TW.atkB+=TWB.boon.hone; else { TW.hp=twMax(); TW.php={}; } TW.picks.push(r.t==='pw'?POWERS[r.id].name:BOONS[r.id].name); }
function towerTake(r){ gain(r); TW.rewN--; if(TW.rewN>0) TW.rew=rollRewards(TW.rewPw); else { TW.rew=null; genFork(); } twStore(); towerScreen(); }
function towerPath(i){ const n=TW.fork[i]; if(!n) return; if(n.t==='fight'){ TW.next=n; TW.fork=null; } else if(n.t==='rest'){ if(TW.hp!=null) TW.hp=Math.min(twMax(),TW.hp+Math.round(twMax()*TWB.heal.rest)); twPhp((h,m)=>h+Math.round(m*TWB.heal.rest));   /* 넘친 것은 다음 판 시작 때 최대 체력으로 깎인다(game/meta.js) */ TW.rested=true; TW.picks.push('쉼터'); genFork(); toast('쉼터에서 체력을 '+Math.round(TWB.heal.rest*100)+'% 되찾았다'); }
  /* 상인: 권능 둘 · 장비 둘(하나는 한 등급 위) · 단련 · 연마 · 휴식. 권능 · 장비는 보상과 같은 등급 가중 뽑기 */
  else { TW.rested=true; const P=rollPw(TW.floor,2),g1=rollGear(TW.floor,true),g2=rollGear(TW.floor,false,g1?[g1]:[]),S=TWB.shop;
    TW.shop=P.map(id=>({t:'pw',id,price:Math.round((S.pw[0]+POWERS[id].lv*S.pw[1])*(POWERS[id].lv>=7?S.hi:1))})).concat([g1,g2].filter(Boolean).map(id=>({t:'gear',id,price:Math.round((S.gear[0]+GEAR[id].gi*S.gear[1])*(GEAR[id].gi>=4?S.hi:1))})),['train','hone','rest'].map(id=>({t:'boon',id,price:BOONS[id].price+(id==='rest'?0:S.up*((TW.bought||{})[id]|0))}))); TW.fork=null; } twStore(); towerScreen(); }
function towerBuy(i){ const it=TW.shop[i]; if(!it||it.sold) return; if(TW.gold<it.price) return toast('증표가 모자라다'); TW.gold-=it.price; it.sold=true; if(it.t==='boon'&&it.id!=='rest'){ TW.bought=TW.bought||{}; TW.bought[it.id]=(TW.bought[it.id]|0)+1; } gain(it); twStore(); towerScreen(); }
/* 가진 권능 · 장비 두 줄(등급 딱지). ids는 twIds() 꼴(장비는 '@' + 장비 id). 함께 등반 손님 화면도 쓴다 */
const twOwned=(ids,pre)=>{ pre=pre||''; const pw=ids.filter(id=>id[0]!=='@'&&POWERS[id]),gr=ids.filter(id=>id[0]==='@'&&GEAR[id.slice(1)]).map(id=>GEAR[id.slice(1)]);
  return (pw.length?'<p class="note">'+pre+'권능: '+pw.map(id=>gBadge(pGrade(POWERS[id].lv))+esc(POWERS[id].name)).join(' · ')+'</p>':'')+(gr.length?'<p class="note">'+pre+'장비: '+['w','a','t'].map(sl=>gr.find(g=>g.slot===sl)).filter(Boolean).map(g=>gBadge(g.grade)+GSLOT[g.slot]+' '+esc(g.name)).join(' · ')+'</p>':''); };
const twLine=()=>'<p class="sub">'+esc(CH[TW.key].name)+' · 체력 '+Math.ceil(TW.hp==null?twMax():TW.hp)+' / '+twMax()+' · 기본 공격 '+(CH[TW.key].atk+twAtk())+' · 증표 '+TW.gold+'</p>'+twOwned(twIds());
const head=(small,h1,p)=>'<header class="brand" style="padding-top:10px"><small>'+small+'</small><h1 style="font-size:34px">'+h1+'</h1><p>'+p+'</p><div class="rule"><i></i></div></header>';
const card=(attr,title,body,col)=>'<button type="button" class="bcard" '+attr+' style="display:block;width:100%;text-align:left;color:var(--ink);font:inherit;border-left-color:'+(col||'var(--gold)')+'"><b>'+title+'</b><p class="note">'+body+'</p></button>';
/* 보상 · 상인 칸 제목: 등급 딱지 + 이름. 딱지 뒤의 빈칸은 함께 등반 손님 화면(글만 받는다)에서 딱지를 다시 그릴 때 쓴다 */
const rwTitle=r=>r.t==='gear'?gBadge(GEAR[r.id].grade)+' '+GSLOT[GEAR[r.id].slot]+' · '+esc(GEAR[r.id].name):r.t==='pw'?gBadge(pGrade(POWERS[r.id].lv))+' 권능 · '+esc(POWERS[r.id].name)+' <small class="tw-lv">'+POWERS[r.id].lv+'단계</small>':esc(BOONS[r.id].name);
/* 1.9.11: 빈 스킬 칸(5~8번)이 없는 캐릭터에게는 무기 · 권능 스킬이 붙지 않는다고 알린다 */
const twKitFree=k=>['x1','x2','x3','x4'].filter(s=>!((CH[k]||{}).skills||{})[s]).length;
const twKitNote=id=>POWERS[id]&&POWERS[id].kit&&TW&&twKitFree(TW.key)===0?'\n이 캐릭터는 빈 스킬 칸이 없어 스킬이 붙지 않는다.':'';
const rwBody=r=>{ if(r.t==='gear'){ const G=GEAR[r.id],cur=GEAR[TW.gear[G.slot]]; return esc(POWERS['@'+r.id].text)+(G.note?'\n'+esc(G.note):'')+twKitNote('@'+r.id)+(cur?'\n지금 낀 '+esc(cur.name)+' ('+cur.grade+')과 바뀐다.':''); } const d=r.t==='pw'?POWERS[r.id]:BOONS[r.id]; return esc(d.text)+(d.cd?'\n재사용 대기시간 '+d.cd+'초':'')+(r.t==='pw'?twKitNote(r.id):''); };
const rwCol=r=>r.t==='gear'?GGC[GEAR[r.id].grade]:r.t==='pw'?GGC[pGrade(POWERS[r.id].lv)]:'var(--aether)';
const foeLine=n=>{ const c=CH[n.k]; if(n.horde){ const cnt={}; [n.k].concat(n.horde).forEach(k=>{ const nm=CH[k].name.split(', ')[1]; cnt[nm]=(cnt[nm]||0)+1; }); return '적 무리 · '+Object.keys(cnt).map(k=>esc(k)+(cnt[k]>1?' ×'+cnt[k]:'')).join(', '); } return (n.boss?'보스 몬스터 · ':n.lord?'마왕 · ':c.grade+' '+c.cls+' · ')+esc(c.name); };
function towerScreen(lost){ const el=$('tw-body'); let h='';
  if(lost){ const top=lost.floor-1; h=head('TOWER',lost.floor+'층에서 쓰러졌다','넘은 층 '+top+' · 가장 높이 '+PF.tw.best+'층'+(lost.rec?' · 새 기록':''))+'<p class="sub">'+esc(CH[lost.key].name)+' · 걸린 시간 '+Math.round(lost.t)+'초</p>'+(lost.picks.length?'<p class="note">얻은 것: '+lost.picks.map(esc).join(' · ')+'</p>':'')+'<div class="dock"><button class="go" id="tw-again" type="button">다시 오른다</button><button class="ghost" id="tw-out" type="button">나가기</button></div>'; }
  else if(TW.rew){ h=head('TOWER · '+(TW.rank||''),(TW.floor-1)+'층 돌파','보상을 하나 고른다'+(TW.rewN>1?' (앞으로 '+TW.rewN+'번)':''))+twLine()+TW.rew.map((r,i)=>card('data-rw="'+i+'"',rwTitle(r),rwBody(r),rwCol(r))).join(''); }
  else if(TW.shop){ h=head('TOWER','상인','증표 '+TW.gold+'개로 산다')+twLine()+TW.shop.map((it,i)=>card('data-buy="'+i+'"'+(it.sold?' disabled':''),(it.sold?'팔림 · ':'증표 '+it.price+' · ')+rwTitle(it),rwBody(it),it.sold?'var(--line)':rwCol(it))).join('')+'<div class="dock"><button class="go" id="tw-shopout" type="button">떠난다</button></div>'; }
  else if(TW.fork){ h=head('TOWER',TW.floor+'층으로 가는 길','길을 하나 고른다')+twLine()+TW.fork.map((n,i)=>n.t==='rest'?card('data-path="'+i+'"','쉼터','싸우지 않고 체력을 '+Math.round(TWB.heal.rest*100)+'% 되찾는다. 그 뒤 다시 길을 고른다.','var(--ok)'):n.t==='shop'?card('data-path="'+i+'"','상인','증표로 권능 · 장비 · 단련을 산다. 그 뒤 다시 길을 고른다.','var(--ok)'):n.elite?card('data-path="'+i+'"','험한 길 · 정예',foeLine(n)+'\n상대 체력 ×'+TWB.elite.hp+', 주는 피해 +'+Math.round((TWB.elite.dmg-1)*100)+'%, 난이도 어려움. 이기면 보상을 두 번 고르고 증표를 더 받는다.','var(--foe)'):n.curse?card('data-path="'+i+'"','저주받은 길 · '+CURSES[n.curse].name,foeLine(n)+'\n'+CURSES[n.curse].text+' 이기면 권능 보상이 둘 나오고(장비는 한 등급 위) 증표를 더 받는다.','#b48cff'):n.horde?card('data-path="'+i+'"','무리의 길',foeLine(n)+'\n약한 적 여럿과 한꺼번에 싸운다. 모두 쓰러뜨려야 한다.','#8fd0a0'):card('data-path="'+i+'"','평범한 길',foeLine(n),'var(--aether)')).join(''); }
  else { const n=TW.next,c=CH[n.k]; h=head('TOWER',TW.floor+'층',foeLine(n))+twLine()+'<p class="note">'+(n.boss?'5분 안에 쓰러뜨려야 한다. ':n.lord?'마왕은 체력이 '+TWB.lordHp+'배다. ':'')+(n.elite?'정예: 체력 ×'+TWB.elite.hp+', 주는 피해 +'+Math.round((TWB.elite.dmg-1)*100)+'%. ':'')+(n.curse?CURSES[n.curse].name+': '+CURSES[n.curse].text+' ':'')+'난이도 '+['쉬움','보통','어려움'][n.elite?2:twDiff(TW.floor)]+(twStatTxt(TW.floor)?' · '+twStatTxt(TW.floor):'')+'. 지면 등반이 끝난다.</p><div class="dock"><button class="go" id="tw-go" type="button">올라간다</button><button class="ghost" id="tw-info" type="button">상대 스킬 보기</button><button class="ghost" id="tw-out" type="button">쉬었다 가기 (저장됨)</button></div>'; }
  el.innerHTML=h; $('tower').hidden=false; $('tower').scrollTop=0; }
/* 1.9.11: 등반 결과는 판이 끝나는 순간(game/v1.9.11.js의 'end')에 twSettle로 확정해 저장한다. 0.9초 뒤의 towerEnd는 화면만 그린다
   (예전에는 그 사이에 앱을 닫으면 코인만 받고 층은 그대로 남았다). twSettle은 한 판에 한 번만 돈다(TW.fin) */
function twSettle(w){ if(!TW||!TW.on||TW.fin) return; TW.t+=over?over.t:0; const n=TW.next;
  if(w.team===0){ TW.rank=rankOf(); const mx=me.max; TW.hp=Math.max(1,me.hp); if(n.curse!=='dry') TW.hp=Math.min(mx,TW.hp+Math.round(mx*twBand(TWB.heal.winBy,TW.floor))); TW.last=n.k; const f=TW.floor,big=n.boss||n.lord,G=TWB.gold; TW.gold+=G.win+(TW.rank==='S'?G.s:0)+(n.elite||n.curse?G.hard:0)+(n.horde?G.horde:0)+(big?G.big:0); if(f>PF.tw.best){ PF.tw.best=f; PF.tw.key=TW.key; } pfSave(); achCheck({});
    TW.floor++; TW.rested=false; TW.next=null; TW.rewPw=!!(big||n.curse); TW.rewN=n.elite?2:1; TW.rew=rollRewards(TW.rewPw); twStore(); TW.fin='win'; }
  else { TW.lostView=Object.assign({},TW,{rec:TW.floor-1>0&&TW.floor-1>(TW.best0==null?PF.tw.best-1:TW.best0)}); try{ localStorage.removeItem('aetherTower'); }catch(x){} TW.fin='lose'; } }
function towerEnd(w){ twSettle(w); const fin=TW.fin; delete TW.fin;
  if(fin==='win'){ sfx('win'); TW.on=false; keepBack(); twStore(); $('sel').hidden=false; over=null; towerScreen(); }
  else { sfx('lose'); const lost=TW.lostView; delete lost.lostView; delete lost.fin; TW=null; keepBack(); twStore(); $('sel').hidden=false; over=null; towerScreen(lost); } }

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
  const L=Object.keys(CH).filter(k=>!CH[k].re&&!CH[k].built&&!CH[k].custom&&!CH[k].mon&&CH[k].grade!=='히든').sort(),mk0=L[Math.floor(r()*L.length)]; let fk=mk0; while(fk===mk0) fk=L[Math.floor(r()*L.length)]; const maps=Object.keys(MAPS); return {me:mk0,foe:fk,map:maps[Math.floor(r()*maps.length)],mode:1,diff:2}; }
function dailyScreen(){ const d=today(),x=dailyOf(d),rec=PF.daily.d===d?PF.daily:null,a=CH[x.me],b=CH[x.foe];
  $('tw-body').innerHTML=head('DAILY · '+d,'오늘의 도전',esc(a.name)+' 대 '+esc(b.name))+'<p class="note">나는 '+esc(a.name.split(', ')[1])+' ('+a.grade+' '+a.cls+'), 상대는 '+esc(b.name.split(', ')[1])+' ('+b.grade+' '+b.cls+'). 맵 '+MAPS[x.map].name+', 난이도 어려움, 1대1 단판.\n날마다 모두 같은 조합이 나온다. 그날 첫 판만 기록에 남고, 그 뒤로는 몇 번이든 다시 해 볼 수 있다.</p>'+(rec?'<div class="pl"><b>오늘 기록 · '+(rec.win?'승리 '+rec.rank:'패배')+'</b><span style="color:var(--muted)">'+rec.t.toFixed(1)+'초</span></div>':'')+'<p class="sub">이어서 이긴 날 '+PF.dstreak+'일 · 지금까지 '+PF.dwin+'번 이겼다</p><div class="dock"><button class="go" id="dy-go" type="button">'+(rec?'다시 해 본다 (기록 안 됨)':'도전한다')+'</button><button class="ghost" id="dy-me" type="button">내 스킬 보기</button><button class="ghost" id="dy-foe" type="button">상대 스킬 보기</button><button class="ghost" id="tw-out" type="button">닫기</button></div>'; $('tower').hidden=false; $('tower').scrollTop=0; }

/* ───── 싸움이 끝났을 때 ───── */
let SPM=null;      /* 지금 하는 이야기·도전 판 */
function spGo(m){ if(NET.host||NET.client) return toast('친구와 함께 중에는 할 수 없다'); SPM=m; setup(m.cfg); $('tower').hidden=true; launch(); }
{ const sr0=showResult; showResult=function(){ if(TW&&TW.on){ if(!over) return; running=false; wakeOff(); $('menu').style.display='none'; if(!over.winner){ const f=TW.floor; TW.on=false; keepBack(); $('sel').hidden=false; over=null; toast('등반은 '+f+'층에서 멈춰 있다. 이어서 오를 수 있다'); return; } return towerEnd(over.winner); }
    if(!over) return; const win=!!over.winner&&over.winner.team===0,solo=ents.length===2&&!(mode===7&&!practice)&&!RAID(),m=SPM; sr0();
    if(win&&!practice&&solo) $('r-small').textContent='VICTORY · '+rankOf();
    if(showResult.gain&&over.winner&&!practice){ const g=showResult.gain; $('r-sub').textContent='코인 +'+g.c+(g.st?' · 별무리 +'+g.st:'')+(g.note?' · '+g.note:'')+' · '+$('r-sub').textContent; } showResult.gain=null;
    if(m){ let line='';
      if(m.kind==='story'){ const s=STORY[m.si],c=s.ch[m.ci]; if(win){ const st=goalOk(c.goal)?2:1,a=PF.story[s.id]||(PF.story[s.id]=[]); a[m.ci]=Math.max(a[m.ci]||0,st); pfSave(); achCheck({}); line=(m.ci+1)+'장 '+'★'.repeat(st)+(st<2?' · ★★ 조건: '+goalTxt(c.goal):''); } else if(over.winner) line=(m.ci+1)+'장 · 다시 겨뤄 볼 수 있다'; }
      else if(m.kind==='daily'&&over.winner){ const d=today(); if(PF.daily.d!==d){ const y=new Date(Date.now()-864e5),yd=y.getFullYear()+'-'+String(y.getMonth()+1).padStart(2,'0')+'-'+String(y.getDate()).padStart(2,'0'); PF.dstreak=win?(PF.daily.d===yd&&PF.daily.win?PF.dstreak+1:1):0; if(win) PF.dwin++; PF.daily={d,win,rank:win?rankOf():'',t:over.t}; pfSave(); achCheck({}); line='오늘의 도전 · 기록에 남았다'; } else line='오늘의 도전 · 이미 기록이 있어 이번 판은 남지 않는다'; }
      if(line) $('r-sub').textContent=line+' · '+$('r-sub').textContent; SPM=null; keepBack(); showResult.last=over.winner?m:null; $('back').textContent=m.kind==='story'?'이야기로 돌아가기':'돌아가기'; } else { showResult.last=null; $('back').textContent='캐릭터 바꾸기'; } };
  /* 결과 화면의 '다시'·'돌아가기'는 이야기·도전 판이었으면 그 판으로 잇는다 */
  $('again').onclick=()=>{ const m=showResult.last; if(m){ $('res').hidden=true; $('sel').hidden=false; spGo(m); } else launch(); };
  const bk0=$('back').onclick; $('back').onclick=()=>{ const m=showResult.last; bk0(); if(m&&m.kind==='story') storyScreen(m.si); else if(m) dailyScreen(); }; }

/* ───── 대전 화면의 모험 칸 ───── */
function hubCard(){ const el=$('twcard'); if(!el) return; const s=twLoad(),d=PF.daily.d===today(),st=STORY.reduce((a,x)=>a+x.ch.reduce((b,_,j)=>b+stStar(x,j),0),0),sm=STORY.reduce((a,x)=>a+x.ch.length*2,0);
  el.innerHTML='<b style="font:600 15px var(--display)">모험</b> <small style="color:var(--muted)">코인 '+PF.coin.toLocaleString()+' · 별무리 '+PF.star+'</small><div class="row" style="margin-top:8px"><button type="button" id="hub-ga">뽑기<small style="display:block;font-size:10.5px;opacity:.75">캐릭터 '+Object.keys(CH).filter(k=>!CH[k].re&&PF.own[k]).length+'명</small></button><button type="button" id="hub-tw">등반<small style="display:block;font-size:10.5px;opacity:.75">'+(s?'이어서 '+s.floor+'층':'최고 '+PF.tw.best+'층')+'</small></button><button type="button" id="hub-st">이야기<small style="display:block;font-size:10.5px;opacity:.75">★ '+st+' / '+sm+'</small></button><button type="button" id="hub-dy">오늘의 도전<small style="display:block;font-size:10.5px;opacity:.75">'+(d?(PF.daily.win?'이겼다 '+PF.daily.rank:'졌다'):'아직 안 했다')+'</small></button></div>'; }
function towerHome(){ const s=twLoad(); $('tw-body').innerHTML=head('TOWER','등반','가장 높이 '+PF.tw.best+'층'+(CH[PF.tw.key]?' · '+CH[PF.tw.key].name.split(', ')[1]:''))+'<p class="note">지금 고른 내 캐릭터('+esc(CH[kOf('me')].name)+')로 층을 오른다. 이길 때마다 보상을 고르고, 다음 길을 고른다. 체력은 이어지고 이기면 최대 체력의 '+Math.round(TWB.heal.winBy[0][1]*100)+'%(50층부터 '+Math.round(TWB.heal.winBy[1][1]*100)+'% · 100층부터 '+Math.round(TWB.heal.winBy[2][1]*100)+'%)를, 적을 쓰러뜨리면 잃은 체력의 '+Math.round(TWB.heal.kill*100)+'%를 되찾는다. 5층마다 보스 몬스터와 마왕이 번갈아 나온다. 지면 끝난다.</p><div class="dock">'+(s?'<button class="go" id="tw-res" type="button">이어서 · '+s.floor+'층 ('+CH[s.key].name.split(', ')[1]+')</button>':'')+'<button class="'+(s?'ghost':'go')+'" id="tw-new" type="button">'+(s?'새로 오르기 (하던 등반은 지워진다)':'오르기 시작')+'</button><button class="ghost" id="tw-out" type="button">닫기</button></div>'; $('tower').hidden=false; $('tower').scrollTop=0; }
document.addEventListener('click',e=>{ const t=e.target.closest('[data-re],#hub-ga,#ga-back,[data-pull],[data-i2],#hub-tw,#hub-st,#hub-dy,#tw-new,#tw-res,#tw-go,#tw-out,#tw-again,#tw-info,#tw-shopout,#st-back,#dy-go,#dy-me,#dy-foe,[data-rw],[data-path],[data-buy],[data-st],[data-sc],[data-sgo]'); if(!t||t.disabled) return; const D=t.dataset;
  if(D.re){ const cost=RECOST[CH[D.re].grade]; if(PF.star<cost) return toast('별무리의 흔적이 모자라다'); PF.star-=cost; PF.re[D.re]=Date.now(); pfSave(); sfx('win'); toast(CH[D.re+'_r'].name+' · 재림을 열었다',3000); drawSel(); return gachaScreen(); }
  if(t.id==='hub-ga'||t.id==='ga-back') return gachaScreen(); if(D.pull){ const r=pulls(+D.pull); if(r){ sfx('win'); gachaScreen(r); drawSel(); } return; } if(D.i2) return info(D.i2);
  if(t.id==='hub-tw') towerHome(); else if(t.id==='hub-st'||t.id==='st-back') storyScreen(); else if(t.id==='hub-dy') dailyScreen();
  else if(t.id==='tw-new'||t.id==='tw-again') towerStart(false); else if(t.id==='tw-res') towerStart(true); else if(t.id==='tw-go') towerGo(); else if(t.id==='tw-out'){ $('tower').hidden=true; hubCard(); } else if(t.id==='tw-info') info(TW.next.k);
  else if(t.id==='tw-shopout'){ TW.shop=null; genFork(); twStore(); towerScreen(); } else if(D.rw&&TW&&TW.rew) towerTake(TW.rew[+D.rw]); else if(D.path&&TW&&TW.fork) towerPath(+D.path); else if(D.buy&&TW&&TW.shop) towerBuy(+D.buy);
  else if(D.st) storyScreen(+D.st); else if(D.sc){ const [a,b]=D.sc.split(',').map(Number); storyScreen(a,b); } else if(D.sgo){ const [a,b]=D.sgo.split(',').map(Number); spGo({kind:'story',si:a,ci:b,cfg:STORY[a].ch[b].cfg}); }
  else if(t.id==='dy-go') spGo({kind:'daily',cfg:dailyOf(today())}); else if(t.id==='dy-me') info(dailyOf(today()).me); else if(t.id==='dy-foe') info(dailyOf(today()).foe); });

/* ───── 기록 화면 ───── */
function drawRec(){ const el=$('rec'); if(!el) return; const tot=PF.w+PF.l,L=Object.entries(PF.ch).filter(x=>CH[x[0]]).sort((a,b)=>b[1].w-a[1].w).slice(0,8),got=ACH.filter(a=>PF.ach[a[0]]).length;
  el.innerHTML='<h2>전적</h2><div class="pl"><b>'+PF.w+'승 '+PF.l+'패</b><span style="color:var(--muted)">'+(tot?'승률 '+Math.round(PF.w/tot*100)+'% · ':'')+'연승 '+PF.streak+'</span></div><div class="pl"><b>등반 최고 '+PF.tw.best+'층</b><span style="color:var(--muted)">'+(CH[PF.tw.key]?CH[PF.tw.key].name.split(', ')[1]+' · ':'')+PF.tw.runs+'번 올랐다</span></div>'
   +'<div class="pl"><b>이야기 ★ '+STORY.reduce((a,x)=>a+x.ch.reduce((b,_,j)=>b+stStar(x,j),0),0)+' / '+STORY.reduce((a,x)=>a+x.ch.length*2,0)+'</b><span style="color:var(--muted)">오늘의 도전 '+PF.dwin+'승 · 내리 '+PF.dstreak+'일</span></div>'
   +'<h2>보유</h2><div class="pl"><b>코인 '+PF.coin.toLocaleString()+'</b><span style="color:var(--muted)">별무리의 흔적 '+PF.star+'</span></div><div class="pl"><b>캐릭터 '+Object.keys(CH).filter(k=>!CH[k].re&&PF.own[k]).length+' / '+Object.keys(CH).filter(k=>!CH[k].re&&!CH[k].built&&!CH[k].custom).length+'</b><span style="color:var(--muted)">재림: '+REWIN+'승 + 별무리의 흔적</span></div>'+'<button class="ghost" id="rec-open" type="button">'+(PF.open?'모두 열어 둠 · 눌러서 뽑기 방식으로':'뽑기 방식 · 눌러서 모두 열기')+'</button><p class="note">가지지 않은 캐릭터는 내 캐릭터 칸에서 보이지 않는다. 연습, 상대·팀원 칸, 이야기, 오늘의 도전, 조합 캐릭터는 언제나 열려 있다.</p>'
   +'<h2>숙련</h2>'+(L.length?L.map(([k,c])=>'<div class="pl"><b>'+esc(CH[k].name.split(', ')[1])+mastery(k)+'</b><span style="color:var(--muted)">'+c.w+'승 '+c.l+'패</span></div>').join('')+'<p class="note">★ 1승 · ★★ 5승 · ★★★ 15승. 캐릭터 고르는 칸에도 뜬다.</p>':'<p class="sub">아직 싸운 기록이 없다.</p>')
   +'<h2>업적 '+got+' / '+ACH.length+'</h2>'+ACH.map(a=>'<div class="pl" style="border-left-color:'+(PF.ach[a[0]]?'var(--gold)':'var(--line)')+';opacity:'+(PF.ach[a[0]]?1:.55)+'"><b>'+(PF.ach[a[0]]?'◆ ':'◇ ')+a[1]+'</b><span style="color:var(--muted)">'+a[2]+'</span></div>').join('')
   +'<button class="ghost" id="rec-reset" type="button" style="margin-top:14px">기록 모두 지우기</button>'; }
{ document.addEventListener('click',e=>{ if(e.target.closest('#rec-reset')) resetAsk(); });   /* 1.9.11: 닉네임을 적어야 지워지는 확인 창(game/v1.9.11.js) */
  const gp0=goPage; goPage=function(p){ gp0(p); if(p==='rec') drawRec(); if(p==='play') hubCard(); if(p==='chars') drawSel(); }; }
hubCard();

/* ───── 설정 화면 정리: 만들기·도구를 맨 위로, 설정은 묶음으로 접어 둔다 ───── */
{ const GROUPS=[['화면',['ori','full','q','cap','fps']],['조작',['ui','lefty','fst','guide']],['전투 표시',['tele','log','nums','edge','imp','shake','stop']],['소리 · 진동',['els','vib']]],openG=new Set(['화면']);
  drawOpts=function(){ const one=s=>'<h2>'+s.name+'</h2><div class="row" data-o="'+s.k+'">'+s.opts.map(o=>'<button type="button" data-v="'+o[0]+'" aria-pressed="'+(String(OPT[s.k])===String(o[0]))+'">'+o[1]+'</button>').join('')+'</div>'+(s.note?'<p class="note">'+s.note+'</p>':''),used=new Set(GROUPS.flatMap(g=>g[1])),rest=SETTINGS.filter(s=>!used.has(s.k));
    const h=GROUPS.concat(rest.length?[['그 밖',rest.map(s=>s.k)]]:[]).map(g=>'<details class="opt og" data-g="'+g[0]+'"'+(openG.has(g[0])?' open':'')+'><summary>'+g[0]+' <small style="color:var(--muted);font-weight:400">'+g[1].map(k=>(SETTINGS.find(s=>s.k===k)||{}).name).filter(Boolean).slice(0,3).join(' · ')+(g[1].length>3?' …':'')+'</small></summary>'+g[1].map(k=>SETTINGS.find(s=>s.k===k)).filter(Boolean).map(one).join('')+'</details>').join('');
    document.querySelectorAll('.optbox').forEach(b=>b.innerHTML=h); };
  document.addEventListener('toggle',e=>{ const d=e.target; if(d.classList&&d.classList.contains('og')){ if(d.open) openG.add(d.dataset.g); else openG.delete(d.dataset.g); } },true);
  const sec=document.querySelector('section[data-page="opts"]'); if(sec){ const box=document.createElement('div'); box.innerHTML='<h2>만들기 · 도구</h2><div class="tools" id="tools"></div><p class="sub" style="margin-top:8px">버전 '+VER+'</p><h2>설정</h2>'; const first=sec.firstElementChild; sec.insertBefore(box,first); if(first&&first.tagName==='H2') first.remove();
    const lab={buildb:['조합 캐릭터','스킬 · 권능 · 장비'],forgeb:['카드로 만들기','카드 글 → 캐릭터 초안'],benchb:['대전표','컴퓨터끼리 승률'],helpb:['도움말','조작과 규칙'],instb:['앱으로 설치','홈 화면에 추가']}; for(const id in lab){ const b=$(id); if(!b) continue; b.className='tool'; b.innerHTML='<b>'+lab[id][0]+'</b><small>'+lab[id][1]+'</small>'; $('tools').appendChild(b); } }
  drawOpts(); }

/* 가지지 않은 캐릭터가 내 칸에 남아 있으면 에이로 돌린다 */
if(!PF.open&&locked(kOf('me'))){ sel.me='ei'; sel.meR=false; drawSel(); }

/* 재림 켜기: 내 칸에서는 열어 둔 재림만 켤 수 있다 */
{ const rb0=$('reb').onclick; $('reb').onclick=()=>{ if(slot==='me'&&!practice&&!sel.meR&&CH[sel.me+'_r']&&locked(sel.me+'_r')) return toast('재림이 아직 닫혀 있다 · '+lockWhy(sel.me+'_r'),3600); rb0(); }; }

/* ───── 스킬 단추 그림: 스킬이 하는 일을 보고(부채꼴 · 원형 · 직선 · 투사체 · 이동 · 보호 · 회복 · 강화) 단추에 그림을 깐다. 색은 캐릭터의 속성 색 ───── */
const SKICO={
 arc:'<path d="M12 21 L3.5 8.5 A12 12 0 0 1 20.5 8.5 Z" fill="currentColor" opacity=".55"/><path d="M5 10.5 A9.5 9.5 0 0 1 19 10.5" fill="none" stroke="currentColor" stroke-width="1.6"/>',
 circle:'<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="5.2" fill="currentColor" opacity=".5"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/>',
 line:'<path d="M4 20 L17 7" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/><path d="M13 5 L20 4 L19 11 Z" fill="currentColor"/>',
 proj:'<circle cx="16.5" cy="7.5" r="4" fill="currentColor"/><path d="M13 11 L4 20 M10 9.5 L3 14 M14.5 14 L9 21" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>',
 dash:'<path d="M4 6 L10 12 L4 18 M10 6 L16 12 L10 18 M16 6 L22 12 L16 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
 shield:'<path d="M12 3 L20 6 V12 C20 17 16.5 20 12 21.5 C7.5 20 4 17 4 12 V6 Z" fill="currentColor" opacity=".5" stroke="currentColor" stroke-width="1.4"/>',
 heal:'<path d="M9.5 4 H14.5 V9.5 H20 V14.5 H14.5 V20 H9.5 V14.5 H4 V9.5 H9.5 Z" fill="currentColor" opacity=".7"/>',
 buff:'<path d="M12 3 L18 10 H14.5 V15 H9.5 V10 H6 Z M9.5 17 H14.5 V19 H9.5 Z M9.5 20.5 H14.5 V22 H9.5 Z" fill="currentColor" opacity=".75"/>',
 spark:'<path d="M12 2.5 L14 10 L21.5 12 L14 14 L12 21.5 L10 14 L2.5 12 L10 10 Z" fill="currentColor" opacity=".7"/>'
};
function skillIcon(k){ if(k.ico&&SKICO[k.ico]) return k.ico; let s=''; try{ s=String(k.cast)+(k.icoSrc||''); }catch(x){} const has=q=>s.indexOf(q)>=0;
  const t=has('S.proj')?'proj':has('S.arc')?'arc':has('S.circle')||has('ring(')||has('zone(')?'circle':has('S.line')||has('S.seg')?'line':has('S.leap')||has('S.blink')||has('hop(')?'dash':has('shield(')?'shield':has('heal(')?'heal':has("'haste'")||has("'resist'")||has('proc(')?'buff':'spark'; k.ico=t; return t; }
{ const ub0=uiBegin; uiBegin=function(){ ub0(); const el=(LOOK[me.key]||LOOK[baseKey(me.key)]||{}).el,col=(typeof EL!=='undefined'&&EL[el]?EL[el][0]:'#7fe9ff');
    document.querySelectorAll('.sk').forEach(b=>{ const s=b.dataset.s,k=me.c.skills[s]; if(typeof skLabel==='function'){ const h=skLabel(b,s); if(h) b.innerHTML=h; } let t=s==='b'?'arc':s==='jump'?'dash':k?skillIcon(k):null; if(!t) return; b.insertAdjacentHTML('afterbegin','<svg class="ic'+(s==='ult'?' u':'')+'" viewBox="0 0 24 24" style="color:'+(typeof kcol==='function'&&k?kcol(k,s):s==='ult'?'#e3c377':col)+'" aria-hidden="true">'+SKICO[t]+'</svg>'); }); }; }

/* ───── 시작 화면 정리: 모험은 큰 칸 넷, 자유 대전의 방식·맵·실력은 한 줄씩 접어 두고 누르면 펼친다 ───── */
{ const sec=document.querySelector('section[data-page="play"]');
  if(sec){ const hs=[...sec.querySelectorAll(':scope > h2')]; hs.forEach(h=>h.remove()); const br=sec.querySelector(':scope > .brand'); if(br) br.remove();
    const acc=(id,label,ids)=>{ const d=document.createElement('details'); d.className='acc'; d.id=id; d.innerHTML='<summary><span>'+label+'</span><b></b><i>›</i></summary><div class="accb"></div>'; for(const q of ids){ const el=q[0]==='.'?sec.querySelector(':scope > '+q):$(q); if(el) d.lastChild.appendChild(el); } return d; };
    const t=document.createElement('h2'); t.textContent='자유 대전'; t.id='freeh'; sec.appendChild(t);
    const A=[acc('acc-mode','방식',['size','mode','raid','monrow','modenote','popt']),acc('acc-map','맵',['maps','.mapbox']),acc('acc-diff','컴퓨터 실력',['diff'])]; A.forEach(d=>sec.appendChild(d));
    A.forEach(d=>d.addEventListener('toggle',()=>{ if(d.open){ A.forEach(o=>{ if(o!==d) o.open=false; }); if(d.id==='acc-map'&&typeof drawMaps==='function') drawMaps(); setTimeout(()=>d.scrollIntoView({block:'nearest',behavior:'smooth'}),60); } }));
    const sum=()=>{ const T=practice?1:teamN,m=practice?'연습':mode===6?'레이드 '+T+'명'+(CH[OPT.mon]?' · '+CH[OPT.mon].name.split(', ')[1]:''):mode===5?'대돌격 · '+(OPT.raid==='boss'?'내가 마왕':'내가 용사'):mode===7?'3대3 태그매치':T+'대'+T+' · '+(mode===4?'점령전':mode===3?(T>1?3*T+'킬 선취':'5판 3선승'):(T>1?'섬멸전':'단판'));
      $('acc-mode').querySelector('summary b').textContent=m; $('acc-map').querySelector('summary b').textContent=OPT.map==='random'?'무작위':(MAPS[OPT.map]||MAPS.basic).name; $('acc-diff').querySelector('summary b').textContent=['쉬움','보통','어려움'][diff]||''; $('acc-diff').style.display=practice?'none':''; };
    const ds0=drawSum; drawSum=function(){ ds0(); try{ sum(); }catch(x){} }; sum(); } }
/* 모험 칸: 큰 칸 넷 */
hubCard=function(){ const el=$('twcard'); if(!el) return; const s=twLoad(),d=PF.daily.d===today(),st=STORY.reduce((a,x)=>a+x.ch.reduce((b,_,j)=>b+stStar(x,j),0),0),sm=STORY.reduce((a,x)=>a+x.ch.length*2,0),own=Object.keys(CH).filter(k=>!CH[k].re&&PF.own[k]).length;
  el.className='hub'; el.removeAttribute('style'); el.innerHTML='<div class="hubh"><b>모험</b><span>코인 '+PF.coin.toLocaleString()+' · 별무리 '+PF.star+'</span></div><div class="hubg">'
   +'<button type="button" class="tool" id="hub-tw"><em>▲</em><b>등반</b><small>'+(s?'이어서 '+s.floor+'층':'최고 '+PF.tw.best+'층')+'</small></button>'
   +'<button type="button" class="tool" id="hub-st"><em>✦</em><b>이야기</b><small>★ '+st+' / '+sm+'</small></button>'
   +'<button type="button" class="tool" id="hub-dy"><em>☀</em><b>오늘의 도전</b><small>'+(d?(PF.daily.win?'이겼다 '+PF.daily.rank:'졌다'):'아직 안 했다')+'</small></button>'
   +'<button type="button" class="tool" id="hub-ga"><em>◈</em><b>가방</b><small>캐릭터 '+own+'명'+(PF.coin>=PULL?' · 뽑을 수 있다':'')+'</small></button></div>'; };
hubCard();

