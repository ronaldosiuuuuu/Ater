"use strict";
/* 게임다운 겉옷. 여기 규칙(층 구성 · 보상 · 해금 조건 · 장의 조건)은 카드가 아니라 시험장에서 정한 것이다.
   1) 등반: 한 캐릭터로 층을 오른다. 이기면 보상을 고르고 다음 길(평범 · 정예 · 저주 · 쉼터 · 상인)을 고른다. 5층마다 보스 몬스터와 마왕이 번갈아 나온다.
   2) 이야기: 정리본에 적힌 싸움을 장으로 묶었다. 장을 더하려면 STORY에 한 덩이(cfg = 누가 누구와 어떤 방식으로, goal = 별 둘 조건, src = 정리본 문장).
   3) 오늘의 도전: 날짜로 정해지는 1대1 한 판.
   4) 보유와 뽑기: 에이·비라로 시작해 코인으로 뽑는다(PULL · GRATE · DUP · SBUY). 기록 화면에서 모두 열 수 있다.
   5) 기록: 승패, 숙련, 업적(ACH에 한 줄). 이 기기에만 남는다(aetherProfile).
   6) 평가: 1대1에서 이기면 남은 체력으로 S·A·B·C. */
/* 판 표기: 대규모 . 중규모 . 마이너(밸런스 · 버그). 고쳐 내보낼 때 여기와 PATCH(맨 아래), sw.js의 V, net.js의 APPV를 함께 올린다 */
const VER='1.5.3';
const PF=(()=>{ let d; try{ d=JSON.parse(localStorage.getItem('aetherProfile')||'null'); }catch(x){} d=d||{}; return Object.assign({w:0,l:0,streak:0,ch:{},ach:{},tw:{best:0,key:'',runs:0},mon:{},story:{},daily:{},dstreak:0,dwin:0,open:false,beat:{},own:{},re:{},coin:1500,star:0},d); })();
for(const k of ['ei','vira']) PF.own[k]=PF.own[k]||1;
const pfSave=()=>{ try{ localStorage.setItem('aetherProfile',JSON.stringify(PF)); }catch(x){} };
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
on('end',w=>{ if(practice||!w||NET.client) return; const was=new Set(openSet()); setTimeout(()=>{ const nw=openSet().filter(k=>!was.has(k)); if(nw.length&&0) toast('새로 열린 캐릭터 · '+nw.slice(0,4).map(k=>CH[k].name.split(', ')[1]).join(' · ')+(nw.length>4?' 외 '+(nw.length-4)+'명':''),4200); },2600); const win=w.team===0,k=baseKey(me.key),solo=ents.length===2&&!RAID()&&!(mode===7&&!practice),c=PF.ch[k]||(PF.ch[k]={w:0,l:0});
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
function keepFix(){ if(KEEP&&!running&&!(TW&&TW.on)&&!SPM) keepBack(); }
function setup(x){ keepSet(); practice=false; mode=x.mode||1; teamN=x.teamN||1; diff=x.diff==null?1:x.diff; const c=CH[x.me]; sel.me=c.re?c.base:x.me; sel.meR=!!c.re||!!x.meR; if(x.mon){ OPT.mon=x.mon; OPT.monhp='fit'; } else { const f=CH[x.foe]; sel.foe=f.re?f.base:x.foe; sel.foeR=!!f.re||!!x.foeR; }
  sel.al=[0,1,2,3].map(j=>(x.al||[])[j]||null); sel.fo=[0,1,2,3].map(j=>(x.fo||[])[j]||null); if(x.raid) OPT.raid=x.raid; OPT.myth=x.myth?1:0; if(x.map&&MAPS[x.map]) OPT.map=x.map; }

/* ───── 해금: 처음에는 고화만. 이기고 오르면 윗등급이 열린다. 연습과 상대·팀원 칸은 언제나 모두 열려 있다 ───── */
/* ───── 보유와 뽑기 ─────
   처음부터 가진 캐릭터는 에이와 비라 둘. 나머지는 코인으로 뽑는다. 가지지 않은 캐릭터는 내 캐릭터 칸에 보이지 않는다(상대·팀원 칸, 연습, 이야기, 오늘의 도전은 모두 열려 있다).
   코인과 별무리의 흔적을 버는 양은 기획 그대로다('균형' 채널): 적 처치 시 250~500 코인, 적에게 사망했을 시 150~350 코인, 40% 확률로 별무리의 흔적 1개.
   시험장에서는 한 판을 기준으로 준다(이기면 처치 몫, 지면 사망 몫). 뽑기 값·확률·겹쳤을 때의 보상·별무리 교환 값은 기획에 없어 시험장에서 정했다. */
const START=['ei','vira'], PULL=1500, PULL10=13500;
const GRATE=[['고화',70],['서사',23.5],['전설',6.4],['신화',.1]];   /* 히든은 뽑기 · 모험 어디에도 나오지 않는다 */             /* 한 번 뽑을 때 등급이 나올 확률(%) */
const DUP={고화:1,서사:3,전설:8,히든:15,신화:30};                                       /* 이미 가진 캐릭터가 나오면 받는 별무리의 흔적 */
const SBUY={고화:5,서사:15,전설:40,히든:80,신화:150};                                   /* 별무리의 흔적으로 골라서 데려오는 값 */
const REWIN=15, RECOST={고화:20,서사:30,전설:50,히든:80,신화:120};   /* 재림: 원래 캐릭터로 50승 + 별무리의 흔적 */
const REWIN_OLD=5;                                                                       /* 재림: 원래 캐릭터로 5승 */
const DIFFPAY=[.5,.75,1];                                                            /* 컴퓨터 실력에 따른 코인 배수(쉬움 · 보통 · 어려움) */
const gachaPool=g=>Object.keys(CH).filter(k=>{ const c=CH[k]; return !c.re&&!c.built&&!c.custom&&!c.mon&&!c.mob&&!c.kit&&c.grade===g; });
const owned=k=>!!PF.own[baseKey(k)];
function locked(k){ const c0=CH[k]; if(!c0||PF.open) return false; const b=baseKey(k),c=CH[b]; if(!c||c.built||c.custom||c.mon||c.mob||c.kit) return false; if(!PF.own[b]) return true; return !!c0.re&&!PF.re[b]; }
function lockWhy(k){ const b=baseKey(k); return !PF.own[b]?'뽑기로 얻는다':CH[k].re?'원래 캐릭터로 '+REWIN+'승 뒤, 뽑기 화면에서 별무리의 흔적 '+RECOST[CH[b].grade]+'개로 연다':''; }
function lockNote(tab,qq){ if(slot!=='me'||practice||PF.open) return ''; const L=Object.values(CH).filter(c=>!c.re&&(qq?c.name.includes(qq):c.cls===tab)&&locked(c.key)); if(!L.length) return '';
  return '<p class="note" style="margin-top:10px">아직 가지지 않은 캐릭터 '+L.length+'명은 보이지 않는다. 아래 가방 탭의 뽑기에서 코인으로 데려온다(처음 나오면 바로 얻는다).\n상대 칸과 연습에서는 모두 보인다.</p>'; }
function earn(win){ const r=(a,b)=>a+Math.floor(Math.random()*(b-a+1)),m=DIFFPAY[diff]==null?1:DIFFPAY[diff],c=Math.round((win?r(250,500):r(150,350))*m),st=Math.random()<.4?1:0; PF.coin+=c; PF.star+=st; return {c,st}; }
function pullOne(minIdx){ let L=GRATE.slice(minIdx||0),tot=L.reduce((a,x)=>a+x[1],0),x=Math.random()*tot,g=L[L.length-1][0]; for(const q of L){ if((x-=q[1])<0){ g=q[0]; break; } } const pool=gachaPool(g),k=pool[Math.floor(Math.random()*pool.length)]; if(!k) return null; const dup=!!PF.own[k]; if(dup) PF.star+=DUP[g]; else PF.own[k]=Date.now(); return {k,g,dup}; }
function pulls(n){ const cost=n===10?PULL10:PULL*n; if(PF.coin<cost) return toast('코인이 모자라다 · '+(cost-PF.coin).toLocaleString()+' 더 필요하다'),null; PF.coin-=cost; const L=[]; for(let i=0;i<n;i++){ const sure=n===10&&i===9&&!L.some(r=>r.g!=='고화'); L.push(pullOne(sure?1:0)); } pfSave(); achCheck({}); return L.filter(Boolean); }
function gachaScreen(res){ const all=GRATE.map(g=>gachaPool(g[0])),have=all.map(L=>L.filter(k=>PF.own[k]).length);
  let h=head('GACHA','뽑기','코인 '+PF.coin.toLocaleString()+' · 별무리의 흔적 '+PF.star);
  if(res) h+='<h2>나온 캐릭터</h2>'+res.map(r=>{ const c=CH[r.k]; return '<div class="pl" style="border-left-color:'+GCOL[r.g]+'"><b>'+esc(c.name.split(', ')[1])+' <small style="color:'+GCOL[r.g]+'">'+r.g+' '+c.cls+'</small></b><span style="color:var(--muted)">'+(r.dup?'이미 있다 · 별무리 +'+DUP[r.g]:'<b style="color:var(--gold)">새로 얻었다</b>')+'</span></div>'; }).join('');
  h+='<div class="row" style="margin-top:12px"><button type="button" data-pull="1"'+(PF.coin<PULL?' style="opacity:.5"':'')+'>1번 뽑기<small style="display:block;font-size:10.5px;opacity:.75">코인 '+PULL.toLocaleString()+'</small></button><button type="button" data-pull="10"'+(PF.coin<PULL10?' style="opacity:.5"':'')+'>10번 뽑기<small style="display:block;font-size:10.5px;opacity:.75">코인 '+PULL10.toLocaleString()+' · 서사 이상 하나 보장</small></button></div>';
  h+='<p class="note" style="white-space:pre-line">확률: '+GRATE.map(g=>g[0]+' '+g[1]+'%').join(' · ')+'\n이미 가진 캐릭터가 나오면 별무리의 흔적으로 바뀐다 ('+Object.keys(DUP).map(g=>g+' '+DUP[g]).join(' · ')+').\n코인은 싸워서 번다: 이기면 250~500, 져도 150~350 (컴퓨터 실력 쉬움 ×0.5 · 보통 ×0.75). 한 판마다 40% 확률로 별무리의 흔적 1개.</p>';
  h+='<h2>가진 캐릭터</h2>'+GRATE.map((g,i)=>'<div class="pl" style="border-left-color:'+GCOL[g[0]]+'"><b>'+g[0]+' '+have[i]+' / '+all[i].length+'</b><span style="color:var(--muted)">골라서 데려오기 · 별무리 '+SBUY[g[0]]+'</span>'+(have[i]<all[i].length?'<button type="button" data-sb="'+g[0]+'" style="height:34px;border:1px solid var(--line);border-radius:8px;background:var(--panel);padding:0 10px">고르기</button>':'')+'</div>').join('');
  { const R=Object.keys(CH).filter(k=>!CH[k].re&&PF.own[k]&&CH[k+'_r']&&!PF.re[k]).sort((a,b)=>((PF.ch[b]||{}).w||0)-((PF.ch[a]||{}).w||0)); if(R.length) h+='<h2>재림</h2><p class="note">원래 캐릭터로 '+REWIN+'승을 채운 뒤 별무리의 흔적으로 연다.</p>'+R.slice(0,12).map(k=>{ const w=(PF.ch[k]||{}).w||0,c=CH[k],cost=RECOST[c.grade],ok=w>=REWIN; return '<div class="pl" style="border-left-color:'+GCOL[c.grade]+'"><b>'+esc(c.name.split(', ')[1])+' <small style="color:var(--muted)">'+esc(CH[k+'_r'].name.split(', ')[0])+'</small></b><span style="color:var(--muted)">'+Math.min(w,REWIN)+' / '+REWIN+'승 · 별무리 '+cost+'</span>'+(ok?'<button type="button" data-re="'+k+'" style="height:34px;border:1px solid var(--line);border-radius:8px;background:var(--panel);padding:0 10px'+(PF.star<cost?';opacity:.5':'')+'">연다</button>':'')+'</div>'; }).join('')+(R.length>12?'<p class="sub">승수가 많은 순으로 12명만 보인다.</p>':''); }
  h+='<div class="dock"><button class="ghost" id="tw-out" type="button">닫기</button></div>'; $('tw-body').innerHTML=h; $('tower').hidden=false; if(res) $('tower').scrollTop=0; }
function starScreen(g){ const L=gachaPool(g).filter(k=>!PF.own[k]).sort((a,b)=>CH[a].cls.localeCompare(CH[b].cls)||CH[a].name.localeCompare(CH[b].name));
  $('tw-body').innerHTML=head('GACHA',g+' 골라서 데려오기','별무리의 흔적 '+SBUY[g]+'개 · 지금 '+PF.star+'개')+L.map(k=>{ const c=CH[k]; return '<div class="pl" style="border-left-color:'+GCOL[g]+'"><b>'+esc(c.name.split(', ')[1])+' <small style="color:var(--muted)">'+c.cls+' · '+esc(c.name.split(', ')[0])+'</small></b><button type="button" data-i2="'+k+'" style="height:34px;border:1px solid var(--line);border-radius:8px;background:var(--panel);padding:0 10px">스킬</button><button type="button" data-get="'+k+'" style="height:34px;border:1px solid var(--line);border-radius:8px;background:var(--panel);padding:0 10px'+(PF.star<SBUY[g]?';opacity:.5':'')+'">데려온다</button></div>'; }).join('')+'<div class="dock"><button class="ghost" id="ga-back" type="button">뽑기로 돌아가기</button></div>'; $('tower').hidden=false; $('tower').scrollTop=0; }
{ const pc0=pickCh; pickCh=function(k){ if(slot==='me'&&!practice&&locked(k)) return toast('아직 가지지 않았다 · '+lockWhy(k)+' (연습에서는 쓸 수 있다)',3000); pc0(k); };
  const la0=launch; launch=function(){ keepFix(); if(NET.host&&!KEEP&&typeof okKey==='function'&&!okKey(sel.me)) return toast('만든 캐릭터는 함께에서 쓸 수 없다 · 다른 캐릭터를 고른다',3000); if(!KEEP&&!practice&&!NET.client&&locked(kOf('me'))) return toast('내 캐릭터가 아직 잠겨 있다 · '+lockWhy(kOf('me')),3000); return la0(); }; $('start').onclick=()=>launch(); }

/* ───── 등반 ─────
   길: 싸움 층을 넘을 때마다 다음 길을 고른다. 평범한 길 · 험한 길(정예: 체력 ×1.6, 피해 +20%, 보상 둘) · 저주받은 길(불리한 조건, 보상은 권능만) · 쉼터 · 상인.
   5층마다 보스: 몬스터(코르헨 → 골렘 → 거대 골렘 → 히드라)와 마왕(히든·신화 캐릭터, 체력 3배)이 번갈아 나온다. */
const TIER=[['고화'],['고화','서사'],['서사'],['서사','전설'],null,['전설'],['전설'],['전설'],['전설','신화'],null];
const BOONS={train:{name:'단련',text:'최대 체력 +80, 그만큼 회복한다.',price:25},hone:{name:'연마',text:'기본 공격 +1.',price:25},rest:{name:'휴식',text:'체력을 모두 회복한다.',price:20}};
const CURSES={frail:{name:'깨진 갑옷',text:'이 층에서는 받는 피해가 25% 는다.'},swift:{name:'쫓기는 길',text:'이 층의 상대는 기동력이 25% 높다.'},dry:{name:'마른 샘',text:'이 층은 이겨도 체력이 돌아오지 않는다.'}};
const TPOW=()=>Object.keys(POWERS).filter(id=>!POWERS[id].active&&!POWERS[id].gear);
const lvCap=f=>f<=3?3:f<=6?5:f<=10?7:9;      /* 층이 높을수록 높은 단계의 권능이 나온다 */
const twIds=()=>TW.pw.concat(gearIds(TW.gear));
/* 등반에서 기본 공격에 더해지는 양: 카드 무기의 무기 피해량은 절반만 든다(평타만으로 다 되는 것을 막는다) */
const twAtk=()=>{ let a=TW.atkB; for(const id of twIds()){ const m=POWERS[id]&&POWERS[id].mods; if(m&&m.atk) a+=id[0]==='@'&&GEAR[id.slice(1)].src==='카드'?Math.round(m.atk*.5):m.atk; } return a; };
function rollGear(f,up){ const g=Math.max(0,Math.min(5,Math.floor((f-1)/3)+(up?1:0)-(Math.random()<.35?1:0))),L=Object.values(GEAR).filter(x=>x.gi===g&&!(TW.gear&&Object.values(TW.gear).includes(x.id))); return L.length?rnd(L).id:null; }
let TW=null;
const twLoad=()=>{ try{ const d=JSON.parse(localStorage.getItem('aetherTower')||'null'); return d&&CH[d.key]&&(!d.next||CH[d.next.k])?Object.assign({gold:0,rewN:0,gear:{}},d,{on:false}):null; }catch(x){ return null; } };
const twStore=()=>{ try{ if(TW) localStorage.setItem('aetherTower',JSON.stringify(TW)); else localStorage.removeItem('aetherTower'); }catch(x){} };
const isBoss=f=>f%5===0, twMax=()=>CH[TW.key].hp+TW.hpB+statOf(twIds()).hp+(typeof isDone==='function'&&isDone(TW.key)&&canDone(TW.key)?50:0), rnd=a=>a[Math.floor(Math.random()*a.length)];
function twPool(gr){ return Object.keys(CH).filter(k=>{ const c=CH[k]; return !c.re&&!c.built&&!c.custom&&!c.mon&&gr.includes(c.grade)&&k!==TW.key&&k!==(TW.last||''); }); }
function towerFoe(f,up){ if(isBoss(f)){ const i=f/5,B=typeof TBOSS!=='undefined'?TBOSS:MONS; if(i%3!==0) return {t:'fight',k:B[(i-Math.floor(i/3)-1)%B.length],boss:true}; return {t:'fight',k:rnd(twPool(f<=15?['전설']:['전설','신화']))||'max',lord:true}; }
  const gr=f+(up?2:0)<=10?TIER[f-1+(up?2:0)]||TIER[f-1]:['전설','신화']; return {t:'fight',k:rnd(twPool(gr))||'ei'}; }
/* 무리: 시험장에서 만든 적(foes.js) 여럿. 층이 높을수록 강한 적이 더 많이 나온다 */
function towerHorde(f){ if(typeof MOBS==='undefined') return null; const T=Math.min(5,1+Math.floor((f-1)/3)),pool=MOBS.filter(m=>m[2]<=T&&m[2]>=T-1).map(m=>m[0]),n=f<4?2:f<10?3:4,L=[]; for(let i=0;i<n;i++) L.push(rnd(pool)); return {t:'fight',k:L[0],horde:L.slice(1)}; }
const twScale=f=>f>10?1+.12*(f-10):1;      /* 10층 위: 상대 체력이 층마다 12%씩 는다 */
const twDiff=f=>f<=2?0:f<=5?1:2;
function genFork(){ const f=TW.floor; if(isBoss(f)){ TW.next=towerFoe(f); TW.fork=null; return; } const L=[towerFoe(f)]; const hard=Math.random()<.5?Object.assign(towerFoe(f,true),{elite:true}):Object.assign(towerFoe(f),{curse:rnd(Object.keys(CURSES))}); L.push(hard); { const hd=towerHorde(f); if(hd) L.push(hd); }
  if(!TW.rested&&Math.random()<.65) L.push({t:Math.random()<.5||TW.gold<20?'rest':'shop'}); TW.fork=L; TW.next=null; }
function towerStart(resume){ if(NET.client) return toast('함께 오르는 등반은 방장이 시작한다'); if(!resume){ const k=kOf('me'); if(CH[k].mon) return; if(locked(k)) return toast('내 캐릭터가 아직 잠겨 있다 · '+lockWhy(k),3000); TW={key:k,floor:1,pw:[],hpB:0,atkB:0,hp:null,t:0,last:'',picks:[],gold:0,rewN:0,gear:{},php:{}}; TW.next=towerFoe(1); PF.tw.runs++; pfSave(); twStore(); } else TW=twLoad(); if(!TW) return; towerScreen(); }
function towerGo(){ if(!TW||TW.on||!TW.next) return; const n=TW.next,N=coopN(); if(N>1){ NET.players.forEach(p=>{ p.team=0; }); lobbyOut(); }
  setup({me:TW.key,foe:n.boss?null:n.k,mon:n.boss?n.k:null,mode:n.boss?6:1,teamN:N,fo:N>1&&!n.boss?Array.from({length:N-1},()=>towerFoe(TW.floor).k):[],diff:n.elite?2:twDiff(TW.floor)}); TW.on=true; $('tower').hidden=true; launch(); }
on('begin',()=>{ if(!TW||!TW.on) return; const f=TW.floor,n=TW.next; { const ids=twIds(); me.c=empower(me.c,ids,twAtk()); } me.atk=me.c.atk; me.r=me.r||{}; me.r._w={}; for(const id of twIds()){ const P=me.r._w[id]={cdT:0}; if(POWERS[id].init) POWERS[id].init(P); } kitInit(me,twIds()); uiBegin();
  me.max=twMax(); me.hp=Math.max(1,Math.min(me.max,TW.hp==null?me.max:TW.hp));
  if(n.boss){ const m=1+.6*(Math.ceil(f/20)-1); foe.max=foe.hp=Math.round(foe.max*m); } else { foe.max=foe.hp=Math.round(foe.c.hp*twScale(f)*(n.lord?3:1)*(n.elite?1.6:1)); if(n.lord) foe.boss=true; }
  if(n.horde) n.horde.forEach((k,i)=>{ const a=(i+1)*2.1,m=mk(k,1,foe.x+Math.cos(a)*2.6,foe.y+Math.sin(a)*2.6); clamp(m); m.slot=i+1; m.busy=1.5; m.max=m.hp=Math.round(m.c.hp*twScale(f)); ents.push(m); });
  if(n.elite){ const c=foe.c,md=c.modDeal; foe.c=Object.assign({},c,{modDeal:(e,t,a,l,o)=>(md?md(e,t,a,l,o):a)*1.2}); }
  if(n.curse==='frail'){ const c=me.c,mt=c.modTake; me.c=Object.assign({},c,{modTake:(e,src,a,l,o)=>mt(e,src,a,l,o)*(src===e?1:1.25)}); }
  if(n.curse==='swift') add(foe,'haste',9999,.25,{self:true});
  msg([['등반 '+f+'층 ','#e3c377'],[(n.boss?'보스 ':n.lord?'마왕 ':n.elite?'정예 ':n.curse?'저주 · ':n.horde?'무리 '+(n.horde.length+1)+' · ':'')+short(foe),'#fff6d6'],[' · 체력 '+foe.max,'#97a1cf']],1,true); });
function rollRewards(allPw){ const f=TW.floor-1,cap=lvCap(f),left=TPOW().filter(id=>!TW.pw.includes(id)&&POWERS[id].lv<=cap&&POWERS[id].lv>=cap-4).sort(()=>Math.random()-.5),L=[]; const np=allPw?2:1; left.slice(0,np).forEach(id=>L.push({t:'pw',id})); { const g=rollGear(f,allPw); if(g) L.push({t:'gear',id:g}); }
  for(const b of ['train','hone','rest'].sort(()=>Math.random()-.5)){ if(L.length>=3) break; if(b==='rest'&&TW.hp>=twMax()*.85) continue; L.push({t:'boon',id:b}); } while(L.length<3) L.push({t:'boon',id:'train'}); return L; }
function gain(r){ if(r.t==='gear'){ const G=GEAR[r.id],old=TW.hp==null?null:twMax(); TW.gear[G.slot]=r.id; if(old!=null) TW.hp=Math.max(1,Math.min(twMax(),TW.hp+Math.max(0,twMax()-old))); TW.picks.push(G.name); return; } if(r.t==='pw') TW.pw.push(r.id); else if(r.id==='train'){ TW.hpB+=80; TW.hp+=80; } else if(r.id==='hone') TW.atkB+=1; else TW.hp=twMax(); TW.picks.push(r.t==='pw'?POWERS[r.id].name:BOONS[r.id].name); }
function towerTake(r){ gain(r); TW.rewN--; if(TW.rewN>0) TW.rew=rollRewards(TW.rewPw); else { TW.rew=null; genFork(); } twStore(); towerScreen(); }
function towerPath(i){ const n=TW.fork[i]; if(!n) return; if(n.t==='fight'){ TW.next=n; TW.fork=null; } else if(n.t==='rest'){ TW.hp=Math.min(twMax(),TW.hp+Math.round(twMax()*.5)); TW.rested=true; TW.picks.push('쉼터'); genFork(); toast('쉼터에서 체력을 절반 되찾았다'); }
  else { TW.rested=true; const cap=lvCap(TW.floor),left=TPOW().filter(id=>!TW.pw.includes(id)&&POWERS[id].lv<=cap).sort(()=>Math.random()-.5).slice(0,2),gs=[rollGear(TW.floor,true),rollGear(TW.floor)].filter((x,i,a)=>x&&a.indexOf(x)===i); TW.shop=left.map(id=>({t:'pw',id,price:20+POWERS[id].lv*5})).concat(gs.map(id=>({t:'gear',id,price:20+GEAR[id].gi*10})),['train','hone','rest'].map(id=>({t:'boon',id,price:BOONS[id].price}))); TW.fork=null; } twStore(); towerScreen(); }
function towerBuy(i){ const it=TW.shop[i]; if(!it||it.sold) return; if(TW.gold<it.price) return toast('증표가 모자라다'); TW.gold-=it.price; it.sold=true; gain(it); twStore(); towerScreen(); }
const twLine=()=>'<p class="sub">'+esc(CH[TW.key].name)+' · 체력 '+Math.ceil(TW.hp==null?twMax():TW.hp)+' / '+twMax()+' · 기본 공격 '+(CH[TW.key].atk+twAtk())+' · 증표 '+TW.gold+'</p>'+(TW.pw.length?'<p class="note">권능: '+TW.pw.map(id=>POWERS[id].name+' '+POWERS[id].lv).join(' · ')+'</p>':'')+(gearIds(TW.gear).length?'<p class="note">장비: '+['w','a','t'].filter(sl=>GEAR[TW.gear[sl]]).map(sl=>GSLOT[sl]+' '+GEAR[TW.gear[sl]].name+' ('+GEAR[TW.gear[sl]].grade+')').join(' · ')+'</p>':'');
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
  const L=Object.keys(CH).filter(k=>!CH[k].re&&!CH[k].built&&!CH[k].custom&&!CH[k].mon&&CH[k].grade!=='히든').sort(),mk0=L[Math.floor(r()*L.length)]; let fk=mk0; while(fk===mk0) fk=L[Math.floor(r()*L.length)]; const maps=Object.keys(MAPS); return {me:mk0,foe:fk,map:maps[Math.floor(r()*maps.length)],mode:1,diff:2}; }
function dailyScreen(){ const d=today(),x=dailyOf(d),rec=PF.daily.d===d?PF.daily:null,a=CH[x.me],b=CH[x.foe];
  $('tw-body').innerHTML=head('DAILY · '+d,'오늘의 도전',esc(a.name)+' 대 '+esc(b.name))+'<p class="note">나는 '+esc(a.name.split(', ')[1])+' ('+a.grade+' '+a.cls+'), 상대는 '+esc(b.name.split(', ')[1])+' ('+b.grade+' '+b.cls+'). 맵 '+MAPS[x.map].name+', 난이도 어려움, 1대1 단판.\n날마다 모두 같은 조합이 나온다. 그날 첫 판만 기록에 남고, 그 뒤로는 몇 번이든 다시 해 볼 수 있다.</p>'+(rec?'<div class="pl"><b>오늘 기록 · '+(rec.win?'승리 '+rec.rank:'패배')+'</b><span style="color:var(--muted)">'+rec.t.toFixed(1)+'초</span></div>':'')+'<p class="sub">이어서 이긴 날 '+PF.dstreak+'일 · 지금까지 '+PF.dwin+'번 이겼다</p><div class="dock"><button class="go" id="dy-go" type="button">'+(rec?'다시 해 본다 (기록 안 됨)':'도전한다')+'</button><button class="ghost" id="dy-me" type="button">내 스킬 보기</button><button class="ghost" id="dy-foe" type="button">상대 스킬 보기</button><button class="ghost" id="tw-out" type="button">닫기</button></div>'; $('tower').hidden=false; $('tower').scrollTop=0; }

/* ───── 싸움이 끝났을 때 ───── */
let SPM=null;      /* 지금 하는 이야기·도전 판 */
function spGo(m){ if(NET.host||NET.client) return toast('친구와 함께 중에는 할 수 없다'); SPM=m; setup(m.cfg); $('tower').hidden=true; launch(); }
{ const sr0=showResult; showResult=function(){ if(TW&&TW.on){ if(!over) return; running=false; wakeOff(); $('menu').style.display='none'; if(!over.winner){ const f=TW.floor; TW.on=false; keepBack(); $('sel').hidden=false; over=null; toast('등반은 '+f+'층에서 멈춰 있다. 이어서 오를 수 있다'); return; } return towerEnd(over.winner); }
    if(!over) return; const win=!!over.winner&&over.winner.team===0,solo=ents.length===2&&!(mode===7&&!practice),m=SPM; sr0();
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
function towerHome(){ const s=twLoad(); $('tw-body').innerHTML=head('TOWER','등반','가장 높이 '+PF.tw.best+'층'+(CH[PF.tw.key]?' · '+CH[PF.tw.key].name.split(', ')[1]:''))+'<p class="note">지금 고른 내 캐릭터('+esc(CH[kOf('me')].name)+')로 층을 오른다. 이길 때마다 보상을 고르고, 다음 길을 고른다. 체력은 이어지고 이기면 최대 체력의 30%를 되찾는다. 5층마다 보스 몬스터와 마왕이 번갈아 나온다. 지면 끝난다.</p><div class="dock">'+(s?'<button class="go" id="tw-res" type="button">이어서 · '+s.floor+'층 ('+CH[s.key].name.split(', ')[1]+')</button>':'')+'<button class="'+(s?'ghost':'go')+'" id="tw-new" type="button">'+(s?'새로 오르기 (하던 등반은 지워진다)':'오르기 시작')+'</button><button class="ghost" id="tw-out" type="button">닫기</button></div>'; $('tower').hidden=false; $('tower').scrollTop=0; }
document.addEventListener('click',e=>{ const t=e.target.closest('[data-re],#hub-ga,#ga-back,[data-pull],[data-sb],[data-get],[data-i2],#hub-tw,#hub-st,#hub-dy,#tw-new,#tw-res,#tw-go,#tw-out,#tw-again,#tw-info,#tw-shopout,#st-back,#dy-go,#dy-me,#dy-foe,[data-rw],[data-path],[data-buy],[data-st],[data-sc],[data-sgo]'); if(!t||t.disabled) return; const D=t.dataset;
  if(D.re){ const cost=RECOST[CH[D.re].grade]; if(PF.star<cost) return toast('별무리의 흔적이 모자라다'); PF.star-=cost; PF.re[D.re]=Date.now(); pfSave(); sfx('win'); toast(CH[D.re+'_r'].name+' · 재림을 열었다',3000); drawSel(); return gachaScreen(); }
  if(t.id==='hub-ga'||t.id==='ga-back') return gachaScreen(); if(D.pull){ const r=pulls(+D.pull); if(r){ sfx('win'); gachaScreen(r); drawSel(); } return; } if(D.sb) return starScreen(D.sb); if(D.i2) return info(D.i2);
  if(D.get){ const g=CH[D.get].grade; if(PF.star<SBUY[g]) return toast('별무리의 흔적이 모자라다'); PF.star-=SBUY[g]; PF.own[D.get]=Date.now(); pfSave(); sfx('win'); toast(CH[D.get].name.split(', ')[1]+' · 데려왔다'); drawSel(); return gachaScreen([{k:D.get,g,dup:false}]); }
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
{ let armed=0; document.addEventListener('click',e=>{ if(!e.target.closest('#rec-reset')) return; const t=performance.now(); if(t-armed>2600){ armed=t; toast('한 번 더 누르면 기록을 모두 지운다'); return; } armed=0; Object.assign(PF,{w:0,l:0,streak:0,ch:{},ach:{},tw:{best:0,key:'',runs:0},mon:{},story:{},daily:{},dstreak:0,dwin:0,beat:{},own:{ei:1,vira:1},re:{},coin:1500,star:0}); pfSave(); drawRec(); hubCard(); drawSel(); });
  document.addEventListener('click',e=>{ if(!e.target.closest('#rec-open')) return; PF.open=!PF.open; pfSave(); drawRec(); drawSel(); });
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

/* ═════ 뽑기 연출과 천장 ═════
   천장: 전설 이상이 PITY번 안에 안 나오면 다음 한 번은 전설 이상이 나온다(시험장에서 정한 값). */
const PITY=60;
{ const po0=pullOne; pullOne=function(minIdx){ PF.pity=(PF.pity||0)+1; const r=po0(PF.pity>=PITY?Math.max(minIdx||0,2):minIdx); if(r&&GORD[r.g]>=2) PF.pity=0; mission('pull',1); return r; };
  const st=document.createElement('style'); st.textContent='.gst{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:14px 0;perspective:900px}.gst.one{grid-template-columns:minmax(0,180px);justify-content:center}'
   +'.gc{position:relative;aspect-ratio:3/4;transform-style:preserve-3d;transition:transform .55s cubic-bezier(.2,.8,.2,1);transform:rotateY(180deg)}.gc.on{transform:rotateY(0)}'
   +'.gc>div{position:absolute;inset:0;border-radius:10px;backface-visibility:hidden;-webkit-backface-visibility:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:4px;overflow:hidden}'
   +'.gc .bk{transform:rotateY(180deg);border:1px solid var(--line);background:repeating-linear-gradient(45deg,#141b40 0 8px,#101633 8px 16px)}.gc .bk::after{content:"◈";color:var(--gold);font-size:22px;opacity:.7}'
   +'.gc .ft{border:1.5px solid var(--gc);background:radial-gradient(circle at 50% 30%,color-mix(in srgb,var(--gc) 38%,transparent),var(--deep) 75%);box-shadow:0 0 18px -4px var(--gc)}'
   +'.gc .ft b{font:800 13px/1.2 var(--body);color:#fff;word-break:keep-all;overflow-wrap:anywhere}.gc .ft small{font:700 10px var(--body);color:var(--gc);margin-top:3px}.gc .ft em{font-style:normal;font-size:9.5px;color:var(--muted);margin-top:2px}'
   +'.gc.hi.on .ft{animation:gcglow 1.2s ease-in-out infinite}@keyframes gcglow{50%{box-shadow:0 0 34px 2px var(--gc)}}.gst.one .gc .ft b{font-size:20px}.gst.one .gc .ft small{font-size:13px}'
   +'body.land .gst{grid-template-columns:repeat(10,1fr)}body.land .gst.one{grid-template-columns:minmax(0,130px)}'
   +'.msbar{display:flex;align-items:center;gap:8px;width:100%;margin-top:8px;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--panel);color:var(--ink);font:inherit;text-align:left}.msbar b{flex:1;font:600 13.5px var(--body)}.msbar span{color:var(--muted);font-size:12px}.msbar.new{border-color:var(--gold)}.msbar.new span{color:var(--gold);font-weight:700}'
   +'.mbar{height:5px;border-radius:3px;background:rgba(255,255,255,.08);overflow:hidden;flex-basis:100%}.mbar i{display:block;height:100%;background:var(--aether)}';
  document.head.appendChild(st);
  const gs0=gachaScreen; gachaScreen=function(res){ if(res&&res.length&&!res.shown){ res.shown=true; return gachaShow(res,()=>gachaScreen(res)); } gs0(res); const p=$('tw-body').querySelector('.brand p'); if(p) p.textContent+=' · 전설 이상 보장까지 '+Math.max(0,PITY-(PF.pity||0))+'번'; }; }
function gachaShow(res,done){ const el=$('tw-body'); let fin=false; const end=()=>{ if(fin) return; fin=true; done(); };
  el.innerHTML=head('GACHA','뽑기','눌러서 넘긴다')+'<div class="gst'+(res.length===1?' one':'')+'">'+res.map(r=>{ const c=CH[r.k]; return '<div class="gc'+(GORD[r.g]>=2?' hi':'')+'" style="--gc:'+GCOL[r.g]+'"><div class="bk"></div><div class="ft"><b>'+esc(c.name.split(', ')[1])+'</b><small>'+r.g+' · '+c.cls+'</small><em>'+(r.dup?'이미 있다':'새로 얻었다')+'</em></div></div>'; }).join('')+'</div><div class="dock"><button class="go" id="ga-skip" type="button">넘기기</button></div>';
  $('tower').hidden=false; $('tower').scrollTop=0; const cards=[...el.querySelectorAll('.gc')]; cards.forEach((c,i)=>setTimeout(()=>{ if(fin) return; c.classList.add('on'); const r=res[i]; if(GORD[r.g]>=2){ sfx('ult'); buzz&&buzz(60); } else sfx('ui'); },350+i*(res.length>1?260:0)));
  const total=350+res.length*260+1400; setTimeout(()=>{ const b=$('ga-skip'); if(b&&!fin) b.textContent='결과 보기'; },total-1200); el.querySelector('#ga-skip').onclick=end; }

/* ═════ 임무: 날마다 셋, 주마다 셋. 채우면 코인과 별무리의 흔적을 받는다(값은 시험장에서 정했다) ═════ */
const MS_D=[['win','이긴다',[2,3],500,0],['hard','컴퓨터 실력 어려움에서 이긴다',[1,2],600,0],['dmg','준 피해를 모은다',[3000,5000],500,0],['tower','등반에서 층을 넘는다',[3,5],700,1],['daily','오늘의 도전을 한다',[1],500,0],['pull','뽑기를 한다',[1],300,0],['cls','{c}(으)로 이긴다',[1,2],600,0],['raid','레이드 보스를 쓰러뜨린다',[1],700,1],['play','판을 끝까지 한다',[4,6],400,0]];
const MS_W=[['win','이긴다',[20],3000,5],['tower','등반에서 층을 넘는다',[15],3000,5],['uniq','서로 다른 캐릭터로 이긴다',[5],2500,4],['dmg','준 피해를 모은다',[40000],2500,3],['raid','레이드 보스를 쓰러뜨린다',[5],3000,5],['pull','뽑기를 한다',[10],2000,3]];
const weekKey=()=>{ const d=new Date(),t=new Date(d.getFullYear(),d.getMonth(),d.getDate()-((d.getDay()+6)%7)); return t.getFullYear()+'-'+(t.getMonth()+1)+'-'+t.getDate(); };
function msRoll(){ const M=PF.ms||(PF.ms={}),mk=(pool,seed,n)=>{ let h=2166136261; for(const ch of seed) h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0; const r=()=>{ h=Math.imul(h^(h>>>15),2246822507)>>>0; h=Math.imul(h^(h>>>13),3266489909)>>>0; return ((h^=h>>>16)>>>0)/4294967296; },L=pool.slice(),out=[]; while(out.length<n&&L.length){ const q=L.splice(Math.floor(r()*L.length),1)[0],g=q[2][Math.floor(r()*q[2].length)],cls=ORDER[Math.floor(r()*6)]; out.push({t:q[0],txt:q[1].replace('{c}',cls),n:g,p:0,coin:q[3],star:q[4],cls:q[0]==='cls'?cls:undefined,u:q[0]==='uniq'?[]:undefined}); } return out; };
  let ch=false; if(M.d!==today()){ M.d=today(); M.dl=mk(MS_D,'d'+today(),3); ch=true; } if(M.w!==weekKey()){ M.w=weekKey(); M.wl=mk(MS_W,'w'+weekKey(),3); ch=true; } if(ch) pfSave(); return M; }
function mission(ev,n,meta){ const M=msRoll(); let ch=false; for(const m of M.dl.concat(M.wl)){ if(m.p>=m.n||m.t!==ev) continue; if(ev==='cls'&&m.cls!==meta) continue; if(ev==='uniq'){ if(m.u.includes(meta)) continue; m.u.push(meta); } const was=m.p; m.p=Math.min(m.n,m.p+n); ch=true; if(m.p>=m.n&&was<m.n) setTimeout(()=>toast('임무 완료 · '+m.txt,3000),3400); } if(ch) pfSave(); }
on('end',w=>{ if(practice||!w||NET.client) return; const win=w.team===0; mission('play',1); mission('dmg',Math.round(Object.values(me.dealt).reduce((a,b)=>a+b,0))); if(win){ mission('win',1); if(diff===2) mission('hard',1); mission('cls',1,me.c.cls); mission('uniq',1,baseKey(me.key)); if(ents.some(o=>o.c&&o.c.mon)) mission('raid',1); } if(SPM&&SPM.kind==='daily') mission('daily',1); });
function missionScreen(){ const M=msRoll(),row=(m,i,k)=>'<div class="pl" style="border-left-color:'+(m.c?'var(--line)':m.p>=m.n?'var(--gold)':'var(--aether)')+';opacity:'+(m.c?.5:1)+'"><b>'+esc(m.txt)+' <small style="color:var(--muted)">'+m.p.toLocaleString()+' / '+m.n.toLocaleString()+'</small></b><span style="color:var(--muted)">코인 '+m.coin.toLocaleString()+(m.star?' · 별무리 '+m.star:'')+'</span>'+(m.c?'<span>받음</span>':m.p>=m.n?'<button type="button" data-mc="'+k+i+'" style="height:34px;border:1px solid var(--gold);border-radius:8px;background:var(--panel);color:var(--gold);padding:0 12px;font-weight:700">받기</button>':'')+'<div class="mbar"><i style="width:'+Math.round(100*m.p/m.n)+'%"></i></div></div>';
  $('tw-body').innerHTML=head('MISSION','임무','코인 '+PF.coin.toLocaleString()+' · 별무리의 흔적 '+PF.star)+'<h2>오늘</h2>'+M.dl.map((m,i)=>row(m,i,'d')).join('')+'<h2>이번 주</h2>'+M.wl.map((m,i)=>row(m,i,'w')).join('')+'<p class="note">오늘 임무는 자정에, 이번 주 임무는 월요일에 바뀐다. 연습은 세지 않는다.</p><div class="dock"><button class="ghost" id="tw-out" type="button">닫기</button></div>'; $('tower').hidden=false; }
document.addEventListener('click',e=>{ const t=e.target.closest('#hub-ms,[data-mc]'); if(!t) return; if(t.id==='hub-ms') return missionScreen(); const M=msRoll(),m=(t.dataset.mc[0]==='d'?M.dl:M.wl)[+t.dataset.mc.slice(1)]; if(!m||m.c||m.p<m.n) return; m.c=1; PF.coin+=m.coin; PF.star+=m.star||0; pfSave(); sfx('win'); toast('코인 +'+m.coin.toLocaleString()+(m.star?' · 별무리 +'+m.star:'')); missionScreen(); hubCard(); });
{ const hc0=hubCard; hubCard=function(){ hc0(); const el=$('twcard'); if(!el) return; const M=msRoll(),all=M.dl.concat(M.wl),rdy=all.filter(m=>m.p>=m.n&&!m.c).length; el.insertAdjacentHTML('beforeend','<button type="button" class="msbar'+(rdy?' new':'')+'" id="hub-ms"><b>임무</b><span>'+(rdy?'받을 보상 '+rdy+'개':'오늘 '+M.dl.filter(m=>m.p>=m.n).length+'/3 · 이번 주 '+M.wl.filter(m=>m.p>=m.n).length+'/3')+'</span></button>'); }; hubCard(); }

/* ═════ 함께 오르는 등반 ═════
   방장이 방을 연 채 등반을 시작하면, 방에 있는 사람들이 모두 같은 편으로 함께 오른다. 층마다 사람 수만큼 상대도 는다(보스는 체력이 는다).
   보상과 길은 방장이 고르고, 고른 권능·장비·단련은 모두에게 똑같이 든다. 체력은 사람마다 따로 이어진다. 모두 쓰러지면 끝난다.
   들어온 사람 화면에는 무기·권능의 추가 스킬 단추가 붙지 않는다(패시브와 수치는 든다). */
function coopN(){ return NET.host&&NET.players.length>1?Math.min(5,NET.players.length):1; }
on('begin',()=>{ if(NET.client){ $('tower').hidden=true; return; } if(!TW||!TW.on||coopN()<2) return; const f=TW.floor,n=TW.next,ids=twIds(); TW.php=TW.php||{};
  for(const e of ents){ if(e.team!==0||!e.net) continue; const pid=e.net.pid; e.c=empower(e.c,ids,twAtk()); e.atk=e.c.atk; e.r=e.r||{}; e.r._w={}; for(const id of ids){ const P=e.r._w[id]={cdT:0}; if(POWERS[id].init) POWERS[id].init(P); } kitInit(e,ids); e.max=CH[e.key].hp+TW.hpB+statOf(ids).hp; e.hp=Math.max(1,Math.min(e.max,TW.php[pid]==null?e.max:TW.php[pid])); if(n.curse==='frail'){ const c=e.c,mt=c.modTake; e.c=Object.assign({},c,{modTake:(x,src,a,l,o)=>mt(x,src,a,l,o)*(src===x?1:1.25)}); } }
  for(const e of ents){ if(e.team!==1||e===foe||e.c.mon) continue; if(!e.c.mob||!n.horde) e.max=e.hp=Math.round(e.c.hp*twScale(f)*(n.elite?1.6:1)); } });
{ const te0=towerEnd; towerEnd=function(w){ const win=w.team===0,n=TW.next,co=coopN()>1; if(co){ TW.php=TW.php||{}; for(const e of ents){ if(e.team!==0||!e.net) continue; const hp=e.dead?1:Math.max(1,e.hp); TW.php[e.net.pid]=n.curse==='dry'?hp:Math.min(e.max,hp+Math.round(e.max*.3)); } } te0(w); if(win) mission('tower',1); if(co) coopSend(win?null:'모두 쓰러져 등반이 끝났다'); };
  const ts0=towerScreen; towerScreen=function(lost){ ts0(lost); if(!lost&&coopN()>1) coopSend(); }; }
function coopSend(end){ if(!NET.host||!NET.tx||coopN()<2) return; const T=TW; sendAll({t:'tw',end:end||'',floor:T?T.floor:0,what:T?(T.rew?'방장이 보상을 고르는 중':T.shop?'방장이 상인과 거래하는 중':T.fork?'방장이 길을 고르는 중':T.next?'다음 상대 · '+foeLine(T.next):''):'',pw:T?T.pw.map(id=>POWERS[id].name+' '+POWERS[id].lv):[],gear:T?['w','a','t'].filter(s=>GEAR[T.gear[s]]).map(s=>GEAR[T.gear[s]].name):[],best:PF.tw.best}); }
function coopInfo(d){ $('res').hidden=true; $('tw-body').innerHTML=d.end?head('TOWER','함께 오르는 등반',esc(d.end))+'<div class="dock"><button class="ghost" id="tw-out" type="button">닫기</button></div>':head('TOWER · 함께','등반 '+d.floor+'층',d.what)+(d.pw.length?'<p class="note">모두에게 든 권능: '+d.pw.map(esc).join(' · ')+'</p>':'')+(d.gear.length?'<p class="note">모두에게 든 장비: '+d.gear.map(esc).join(' · ')+'</p>':'')+'<p class="sub">길과 보상은 방장이 고른다. 방장이 올라가면 함께 시작한다.</p>'; $('tower').hidden=false; $('sel').hidden=false; }
/* 들어온 쪽도 판이 끝나면 코인을 받는다(이기면 처치 몫, 지면 사망 몫) */
{ const sr1=showResult; showResult=function(){ if(NET.client&&over&&over.winner&&me&&!over.paid){ over.paid=true; const g=earn(over.winner.team===me.team); pfSave(); sr1(); $('r-sub').textContent='코인 +'+g.c+(g.st?' · 별무리 +'+g.st:'')+(g.note?' · '+g.note:'')+' · '+$('r-sub').textContent; hubCard(); return; } sr1(); }; }

/* ═════ 계정 레벨 · 업적 보상 ═════ (값은 시험장에서 정했다)
   경험치: 이기면 100, 지면 40, 업적 하나에 80. 레벨 L에서 다음 레벨까지 150+50×L.
   레벨이 오르면 코인 400+50×레벨, 다섯 레벨마다 별무리의 흔적 5. 업적은 달성하는 순간 보상이 들어온다. */
const xpNeed=L=>150+50*L;
function lvInfo(){ let L=1,x=PF.xp||0; while(x>=xpNeed(L)){ x-=xpNeed(L); L++; } return {lv:L,cur:x,need:xpNeed(L)}; }
function gainXp(n){ const a=lvInfo().lv; PF.xp=(PF.xp||0)+n; const b=lvInfo().lv; if(b>a){ let c=0,s=0; for(let L=a+1;L<=b;L++){ c+=400+50*L; if(L%5===0) s+=5; } PF.coin+=c; PF.star+=s; setTimeout(()=>{ sfx('win'); toast('레벨 '+b+' · 코인 +'+c.toLocaleString()+(s?' · 별무리 +'+s:''),4200); },4600); } pfSave(); }
const ACHPAY={w50:[2000,8],st7:[1000,3],v10:[800,2],v40:[2500,10],m3:[1000,3],myth:[1000,3],hydra:[1000,3],t10:[1200,4],t15:[2000,6],t25:[3000,10],stmax:[1500,5],stall:[3000,10],d7:[2000,6],g50:[2500,8],gmyth:[1500,5]};
const achPay=id=>ACHPAY[id]||[400,1];
function achSettle(quiet){ PF.achPaid=PF.achPaid||{}; let c=0,s=0,n=0; for(const a of ACH){ if(PF.ach[a[0]]&&!PF.achPaid[a[0]]){ PF.achPaid[a[0]]=1; const p=achPay(a[0]); c+=p[0]; s+=p[1]; n++; } } if(!n) return; PF.coin+=c; PF.star+=s; gainXp(80*n); pfSave(); if(!quiet) setTimeout(()=>toast('업적 보상 · 코인 +'+c.toLocaleString()+' · 별무리 +'+s,3600),2400); else setTimeout(()=>toast('지금까지 이룬 업적 '+n+'개의 보상 · 코인 +'+c.toLocaleString()+' · 별무리 +'+s,4200),1500); }
{ const ac0=achCheck; achCheck=function(x){ ac0(x); achSettle(false); }; achSettle(true);
  on('end',w=>{ if(practice||!w||NET.client) return; gainXp(w.team===0?100:40); });
  const sr2=showResult; showResult=function(){ if(NET.client&&over&&over.winner&&me&&!over.xp){ over.xp=true; gainXp(over.winner.team===me.team?100:40); } sr2(); };
  const hc1=hubCard; hubCard=function(){ hc1(); const el=$('twcard'); if(!el) return; const h=el.querySelector('.hubh'),L=lvInfo(); if(h) h.insertAdjacentHTML('afterend','<div class="lvbar"><b>Lv '+L.lv+'</b><div><i style="width:'+Math.round(100*L.cur/L.need)+'%"></i></div><span>'+L.cur+' / '+L.need+'</span></div>'); }; hubCard();
  const dr0=drawRec; drawRec=function(){ dr0(); const el=$('rec'); if(!el) return; const L=lvInfo(); el.insertAdjacentHTML('afterbegin','<h2>계정</h2><div class="pl"><b>레벨 '+L.lv+'</b><span style="color:var(--muted)">다음 레벨까지 '+(L.need-L.cur)+'</span><div class="mbar"><i style="width:'+Math.round(100*L.cur/L.need)+'%"></i></div></div>');
    el.querySelectorAll('.pl').forEach(p=>{ const b=p.querySelector('b'); if(!b) return; const a=ACH.find(q=>b.textContent.replace(/^[◆◇] /,'')===q[1]); if(a){ const pay=achPay(a[0]); p.insertAdjacentHTML('beforeend','<span style="color:'+(PF.ach[a[0]]?'var(--muted)':'var(--gold)')+';font-size:11.5px;flex-basis:100%">'+(PF.ach[a[0]]?'받음 · ':'보상 · ')+'코인 '+pay[0].toLocaleString()+' · 별무리 '+pay[1]+'</span>'); } });
    const rs=$('rec-reset'); if(rs) rs.insertAdjacentHTML('beforebegin','<h2>저장</h2><p class="note">기록·코인·캐릭터·조합은 이 기기의 브라우저에만 있다. 기기를 바꾸거나 브라우저 자료를 지우기 전에 내보내 둔다.</p><div class="row"><button type="button" id="sv-out">저장 내보내기</button><button type="button" id="sv-in">저장 가져오기</button></div>'); }; }
/* 저장 내보내기 · 가져오기: 이 앱이 브라우저에 적어 둔 것을 한 덩어리 글로 만든다 */
document.addEventListener('click',async e=>{ const t=e.target.closest('#sv-out,#sv-in,#sv-apply,#sv-copy'); if(!t) return;
  if(t.id==='sv-out'){ const o={}; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(/^aether/.test(k)&&k!=='aetherTurn'&&k!=='aetherRelay') o[k]=localStorage.getItem(k); } const code='AETHER1:'+btoa(unescape(encodeURIComponent(JSON.stringify(o))));
    $('tw-body').innerHTML=head('SAVE','저장 내보내기','아래 글을 통째로 복사해 보관한다')+'<textarea id="sv-text" readonly style="width:100%;height:180px;border:1px solid var(--line);border-radius:10px;background:var(--deep);color:var(--muted);font:11px var(--mono);padding:10px;user-select:text;-webkit-user-select:text;touch-action:auto">'+code+'</textarea><div class="dock"><button class="go" id="sv-copy" type="button">복사</button><button class="ghost" id="tw-out" type="button">닫기</button></div>'; $('tower').hidden=false; }
  else if(t.id==='sv-copy'){ const v=$('sv-text').value; try{ await navigator.clipboard.writeText(v); toast('복사했다 · 메모장이나 메신저의 나에게 보내기에 붙여 둔다',3600); }catch(x){ $('sv-text').select(); toast('글을 길게 눌러 직접 복사한다'); } }
  else if(t.id==='sv-in'){ $('tw-body').innerHTML=head('SAVE','저장 가져오기','내보낸 글을 붙여 넣는다')+'<textarea id="sv-text" placeholder="AETHER1:…" style="width:100%;height:180px;border:1px solid var(--line);border-radius:10px;background:var(--deep);color:var(--ink);font:11px var(--mono);padding:10px;user-select:text;-webkit-user-select:text;touch-action:auto"></textarea><p class="note">지금 이 기기에 있는 기록은 가져온 것으로 바뀐다.</p><div class="dock"><button class="go" id="sv-apply" type="button">가져온다</button><button class="ghost" id="tw-out" type="button">닫기</button></div>'; $('tower').hidden=false; }
  else if(t.id==='sv-apply'){ try{ const v=$('sv-text').value.trim(); if(!/^AETHER1:/.test(v)) throw 0; const o=JSON.parse(decodeURIComponent(escape(atob(v.slice(8))))); if(!o||typeof o!=='object'||!o.aetherProfile) throw 0; for(const k in o) if(/^aether/.test(k)) localStorage.setItem(k,String(o[k])); toast('가져왔다 · 다시 연다'); setTimeout(()=>location.reload(),900); }catch(x){ toast('글이 맞지 않는다. 내보낸 글을 처음부터 끝까지 붙였는지 본다',3600); } } });

/* ═════ 함께 할 때의 임시 캐릭터 ═════
   방에 있는 동안, 가지지 않은 캐릭터 가운데 셋을 무작위로 빌려 쓴다. 전설·히든·신화는 빼고 고른다.
   그 아래 등급을 모두 가졌다면 전설 가운데 셋을 빌린다. 방을 나가면 사라진다. */
function tempRoll(){ const un=g=>gachaPool(g).filter(k=>!PF.own[k]); let pool=un('고화').concat(un('서사')); if(!pool.length) pool=un('전설'); return pool.sort(()=>Math.random()-.5).slice(0,3); }
{ const lk0=locked; locked=function(k){ if((NET.host||NET.client)&&NET.temp&&NET.temp.includes(baseKey(k))&&!(CH[k]&&CH[k].re)) return false; return lk0(k); };
  const dn0=drawNet; drawNet=function(){ const on=NET.host||NET.client; if(on&&!NET.temp){ NET.temp=PF.open?[]:tempRoll(); if(NET.temp.length){ toast('이번 방에서 빌려 쓰는 캐릭터 · '+NET.temp.map(k=>CH[k].name.split(', ')[1]).join(' · '),4600); drawSel(); } } else if(!on&&NET.temp&&!NET.relink){ NET.temp=null; if(!PF.open&&lk0(kOf('me'))){ sel.me='ei'; sel.meR=false; save(); } drawSel(); } dn0();
    const el=$('n-list'); if(on&&el&&NET.temp&&NET.temp.length) el.insertAdjacentHTML('afterend','<p class="note" id="n-temp">이번 방에서 빌려 쓰는 캐릭터: '+NET.temp.map(k=>CH[k].name.split(', ')[1]+' ('+CH[k].grade+' '+CH[k].cls+')').join(' · ')+'\n캐릭터 화면에서 고를 수 있다. 방을 나가면 사라진다.</p>'); const old=document.querySelectorAll('#n-temp'); if(old.length>1||(!on&&old.length)) old.forEach((x,i)=>{ if(!on||i<old.length-1) x.remove(); }); };
  const ln0=lockNote; lockNote=function(tab,qq){ const base=ln0(tab,qq); return (NET.host||NET.client)&&NET.temp&&NET.temp.length&&slot==='me'?'<p class="note" style="margin-top:10px;border-left-color:var(--ok)">이번 방에서 빌려 쓰는 캐릭터: '+NET.temp.map(k=>CH[k].name.split(', ')[1]).join(' · ')+'</p>'+base:base; }; }

/* ═════ 시작 화면 ═════ */
{ const st=document.createElement('style'); st.textContent='#title{position:fixed;inset:0;z-index:50;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:radial-gradient(ellipse at 50% 38%,#16205a 0%,#0a0f24 55%,#05070f 100%);overflow:hidden;transition:opacity .5s ease,transform .5s ease;padding:24px;text-align:center}'
   +'#title.out{opacity:0;transform:scale(1.06);pointer-events:none}#title canvas{position:absolute;inset:0;width:100%;height:100%}'
   +'#title .tl{position:relative;font:800 clamp(52px,16vw,120px)/1 var(--display);letter-spacing:.12em;text-indent:.12em;color:#fff3cf;text-shadow:0 0 30px rgba(227,195,119,.55),0 0 80px rgba(127,233,255,.35);animation:tlin 1.2s cubic-bezier(.2,.8,.2,1) both}'
   +'#title .en{position:relative;font:600 13px/1 var(--body);letter-spacing:.7em;text-indent:.7em;color:var(--gold);animation:tlin 1.2s .15s cubic-bezier(.2,.8,.2,1) both}'
   +'#title .sb{position:relative;color:var(--muted);font-size:13.5px;margin-top:4px;animation:tlin 1.2s .3s both}#title .rl{position:relative;width:min(280px,60vw);height:1px;background:linear-gradient(90deg,transparent,var(--gold),transparent);margin:10px 0}'
   +'#title .pf{position:relative;display:flex;gap:10px;flex-wrap:wrap;justify-content:center;font:600 12.5px var(--body);color:#c9d2ff;animation:tlin 1.2s .45s both}#title .pf span{border:1px solid var(--line);border-radius:20px;padding:5px 12px;background:rgba(10,15,36,.6)}'
   +'#title .go2{position:relative;margin-top:26px;font:700 15px var(--body);letter-spacing:.3em;text-indent:.3em;color:#fff;animation:tlblink 1.6s ease-in-out infinite}#title .vr{position:absolute;bottom:calc(12px + env(safe-area-inset-bottom));left:0;right:0;color:#5c6594;font:11px var(--mono)}'
   +'@keyframes tlin{from{opacity:0;transform:translateY(14px)}}@keyframes tlblink{50%{opacity:.35}}'
   +'.lvbar{display:flex;align-items:center;gap:8px;margin:-2px 2px 10px}.lvbar b{font:800 12.5px var(--mono);color:var(--gold);flex:none}.lvbar div{flex:1;height:5px;border-radius:3px;background:rgba(255,255,255,.08);overflow:hidden}.lvbar i{display:block;height:100%;background:linear-gradient(90deg,var(--gold),#fff3cf)}.lvbar span{font:11px var(--mono);color:var(--muted);flex:none}';
  document.head.appendChild(st);
  if(!/[?&]room=/.test(location.search)&&!/[?&]bc\b/.test(location.search)&&!navigator.webdriver){   /* 초대 링크로 들어올 때와 자동 시험에서는 건너뛴다 */ const L=lvInfo(),own=Object.keys(CH).filter(k=>!CH[k].re&&PF.own[k]).length,sv=twLoad(),el=document.createElement('div'); el.id='title';
    el.innerHTML='<canvas></canvas><div class="en">AETHER</div><div class="tl">에테르</div><div class="rl"></div><div class="sb">오래도록 꿈꿔온 여정의 시작.</div><div class="pf"><span>Lv '+L.lv+'</span><span>캐릭터 '+own+'명</span><span>'+PF.w+'승</span>'+(sv?'<span>등반 '+sv.floor+'층 진행 중</span>':'')+'</div><div class="go2">'+(matchMedia('(pointer:fine)').matches?'눌러서 시작':'화면을 눌러 시작')+'</div><div class="vr">v'+VER+'<br>© 2026 ronaldosiuuuuu. All rights reserved.</div>';
    document.body.appendChild(el); const cv=el.querySelector('canvas'),c=cv.getContext('2d'); let run=true,S=[]; const rz=()=>{ cv.width=innerWidth; cv.height=innerHeight; S=Array.from({length:Math.min(110,Math.round(innerWidth*innerHeight/9000))},()=>({x:Math.random()*cv.width,y:Math.random()*cv.height,r:Math.random()*1.4+.3,v:Math.random()*.25+.05,p:Math.random()*6.28})); }; rz(); addEventListener('resize',rz);
    const tick=t=>{ if(!run) return; c.clearRect(0,0,cv.width,cv.height); for(const s of S){ s.y-=s.v; if(s.y<-4){ s.y=cv.height+4; s.x=Math.random()*cv.width; } c.globalAlpha=.35+.45*Math.sin(t/900+s.p); c.fillStyle=s.r>1.2?'#e3c377':'#9fe9ff'; c.beginPath(); c.arc(s.x,s.y,s.r,0,7); c.fill(); } requestAnimationFrame(tick); }; requestAnimationFrame(tick);
    const go=()=>{ if(el.classList.contains('out')) return; el.classList.add('out'); try{ if(typeof audioOn==='function') audioOn(); sfx('ui'); }catch(x){} setTimeout(()=>{ run=false; el.remove(); removeEventListener('resize',rz); },560); }; el.addEventListener('pointerup',go); addEventListener('keydown',function kd(e){ if(e.key==='Enter'||e.key===' '){ go(); removeEventListener('keydown',kd); } }); } }

/* 내 캐릭터 무작위: 가진 캐릭터(와 방에서 빌린 캐릭터) 안에서만 고른다. 연습에서는 모두 나온다 */
$('randme').onclick=()=>{ let k=randPool(new Set([sel.foe])); if(!practice){ const mine=k.filter(x=>!locked(x)); k=mine.length?mine:Object.keys(CH).filter(x=>!CH[x].re&&!locked(x)); } if(!k.length) return; if(k.length>1) k=k.filter(x=>x!==sel.me); sel.meR=false; sel.me=k[Math.floor(Math.random()*k.length)]; tab=CH[sel.me].cls; slot='me'; drawSel(); save(); toast('내 캐릭터 · '+CH[sel.me].name.split(', ')[1]); };

/* ═════ 조작키 모아 보기 ═════ 멈춤 메뉴와 설정의 도구에서 연다 */
function keysScreen(){ const pc=matchMedia('(pointer:fine)').matches,row=(k,d)=>'<div style="display:flex;gap:12px;align-items:baseline;padding:9px 0;border-bottom:1px solid var(--line)"><b style="flex:0 0 38%;font:700 13px/1.4 var(--body);color:var(--gold);word-break:keep-all">'+k+'</b><span style="flex:1;min-width:0;font:400 13.5px/1.5 var(--body);color:#d5dbf5;text-align:left;word-break:keep-all">'+d+'</span></div>',tb=L=>'<div>'+L.map(x=>row(x[0],x[1])).join('')+'</div>';
  const K=[['W A S D · 방향키','이동'],['마우스','조준 (스킬과 기본 공격이 마우스 쪽으로 나간다)'],['좌클릭 · J','기본 공격 (누르고 있으면 이어서 친다)'],['1 · 2','일반 스킬 ① ②'],['3','각성 스킬'],['4','궁극기'],['5 · 6 · 7 · 8','추가 스킬 (무기 · 권능 · 일부 캐릭터)'],['Shift','웅크리기 (캐릭터에 따라 전용 스킬)'],['Space','점프'],['Esc','멈춤 메뉴'],['T','채팅 열기 (친구와 함께 할 때) · Enter 보내기 · Esc 닫기'],['숫자패드 1~4','스킬 ①②③④와 같다']];
  const M=[['왼쪽 화면','누른 자리가 이동 스틱이 된다 (설정에서 제자리 스틱으로 바꿀 수 있다)'],['스킬 단추','누르면 가장 가까운 적 쪽으로 나간다'],['스킬 단추를 누른 채 끌기','끄는 방향으로 조준해서 쓴다 (손을 떼면 나간다)'],['기본 공격 단추','누르고 있으면 이어서 친다. 끌면 그 방향으로 친다'],['점프 · 웅크리기','오른쪽 위 단추'],['≡','멈춤 메뉴 (스킬 보기 · 그만두기)'],['뒤로 가기','열린 창을 닫는다']];
  const old=document.getElementById('keysv'); if(old) old.remove(); const d=document.createElement('div'); d.className='overlay'; d.id='keysv'; d.style.zIndex=9; d.innerHTML='<div class="wrap">'+head('CONTROLS','조작',pc?'지금은 컴퓨터로 보고 있다':'지금은 휴대폰으로 보고 있다')+(pc?'<h2>컴퓨터 (자판 · 마우스)</h2>'+tb(K)+'<h2>휴대폰 (터치)</h2>'+tb(M):'<h2>휴대폰 (터치)</h2>'+tb(M)+'<h2>컴퓨터 (자판 · 마우스)</h2>'+tb(K))+'<p class="note" style="white-space:pre-line">· 스킬 단추 색: 일반 하늘색 · 각성 보라 · 궁극 금색 · 권능 주황 · 무기 연두.\n· 궁극기는 한 판에 한 번이고, 조건을 채우면 단추가 금빛으로 뛴다.\n· 단추 크기와 왼손 배치는 설정 → 조작에서 바꾼다.</p><div class="dock"><button class="go" id="kv-out" type="button">닫기</button></div></div>'; document.body.appendChild(d); d.querySelector('#kv-out').onclick=()=>d.remove(); }
{ const pr=$('p-me'); if(pr){ const b=document.createElement('button'); b.className='ghost'; b.id='p-keys'; b.type='button'; b.textContent='조작키 보기'; pr.parentNode.insertBefore(b,pr); }
  const tl=$('tools'); if(tl){ const b=document.createElement('button'); b.className='tool'; b.id='keysb'; b.type='button'; b.innerHTML='<b>조작키</b><small>자판 · 터치 조작 모아 보기</small>'; tl.insertBefore(b,tl.children[3]||null); }
  document.addEventListener('click',e=>{ if(e.target.closest('#p-keys,#keysb')) keysScreen(); }); }

/* ═════ 둘이서(여럿이서) 함께: 레이드와 등반을 방 화면에서 바로 고른다 ═════ */
{ const dn1=drawNet; drawNet=function(){ dn1(); const q=$('n-quick'); if(q) q.hidden=!NET.host; };
  document.addEventListener('click',e=>{ const t=e.target.closest('#n-qraid,#n-qtower'); if(!t||!NET.host) return; const n=NET.players.length;
    if(t.id==='n-qraid'){ NET.players.forEach(p=>{ p.team=0; }); teamN=[1,2,3,5].find(x=>x>=n)||5; $('size').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',+x.dataset.n===teamN)); setMode(6); lobbyOut(); goPage('play'); const a=$('acc-mode'); if(a) a.open=true; toast('함께 레이드 '+n+'명 · 보스를 고르고 싸우기를 누른다'+(teamN>n?' (빈 자리는 컴퓨터가 채운다)':''),4200); }
    else { goPage('play'); towerHome(); toast(n>1?n+'명이 함께 오른다 · 오르기 시작을 누른다':'지금은 혼자다. 친구가 들어온 뒤 시작하면 함께 오른다',3600); } }); }

/* ═════ 업적 더하기 ═════ 세는 것(PF.cnt)을 늘리고, 업적을 한꺼번에 얹는다. 보상은 achPay의 규칙대로 달성 순간 들어온다 */
PF.cnt=Object.assign({play:0,pull:0,claim:0,mw:0,raidw:0,sr:0,dmg:0,coop:0,cls:{},maxhit:0,flawless:0,tfloor:0,hardw:0,lose:0},PF.cnt||{});
{ const C=PF.cnt,clsN=c=>C.cls[c]||0,ownN=()=>Object.keys(PF.own).filter(k=>CH[k]&&!CH[k].re).length,stars=()=>STORY.reduce((a,x)=>a+x.ch.reduce((b,_,j)=>b+stStar(x,j),0),0),bossN=()=>Object.keys(PF.mon).filter(k=>PF.mon[k]>0).length;
  const A=(id,name,desc,fn,coin,star)=>{ if(ACH.some(a=>a[0]===id)) return; ACH.push([id,name,desc,fn]); ACHPAY[id]=[coin,star]; };
  A('w100','백 번의 승리','100승',()=>PF.w>=100,3000,10); A('w200','이백 승','200승',()=>PF.w>=200,5000,15); A('w500','전설의 투사','500승',()=>PF.w>=500,10000,30);
  A('st10','열 번 내리','10연승',()=>PF.streak>=10,2000,6); A('st15','멈추지 않는다','15연승',()=>PF.streak>=15,4000,12);
  A('p50','단골','50판을 끝까지 한다',()=>C.play>=50,800,2); A('p200','개근','200판을 끝까지 한다',()=>C.play>=200,2500,8); A('p500','붙박이','500판을 끝까지 한다',()=>C.play>=500,6000,20);
  A('l10','져도 일어난다','10번 진다',()=>PF.l>=10,500,2); A('hw10','어려움 숙련','어려움에서 10승',()=>C.hardw>=10,1500,5); A('hw50','어려움 정복','어려움에서 50승',()=>C.hardw>=50,5000,15);
  A('sr10','깔끔한 손','S 평가 10번',()=>C.sr>=10,1500,5); A('sr50','완벽주의','S 평가 50번',()=>C.sr>=50,5000,15); A('fl5','무결','체력을 하나도 잃지 않고 5번 이긴다',()=>C.flawless>=5,2500,8);
  A('d100k','십만','준 피해 합계 100,000',()=>C.dmg>=1e5,1000,3); A('d1m','백만','준 피해 합계 1,000,000',()=>C.dmg>=1e6,5000,15); A('hit200','한 방','한 번에 200 이상 피해',()=>C.maxhit>=200,1000,3); A('hit500','일격필살','한 번에 500 이상 피해',()=>C.maxhit>=500,3000,10);
  for(const [c,nm] of [['전사','칼잡이'],['수호자','방패잡이'],['마법사','주문꾼'],['암살자','그림자'],['지원가','버팀목'],['척후병','길잡이']]){ A('c10'+c,nm,c+'(으)로 10승',()=>clsN(c)>=10,1000,3); A('c50'+c,nm+' 달인',c+'(으)로 50승',()=>clsN(c)>=50,4000,12); }
  A('allcls','두루두루','여섯 직업 모두로 이긴다',()=>['전사','수호자','마법사','암살자','지원가','척후병'].every(c=>clsN(c)>=1),1500,5);
  A('g20','모임 스물','캐릭터 20명을 가진다',()=>ownN()>=20,1200,4); A('g30','모임 서른','캐릭터 30명을 가진다',()=>ownN()>=30,2000,6); A('g70','대가족','캐릭터 70명을 가진다',()=>ownN()>=70,5000,15); A('gleg','전설을 품다','전설 캐릭터를 가진다',()=>Object.keys(PF.own).some(k=>CH[k]&&CH[k].grade==='전설'),1000,3); A('gleg5','전설 다섯','전설 캐릭터 5명을 가진다',()=>Object.keys(PF.own).filter(k=>CH[k]&&CH[k].grade==='전설').length>=5,3000,10);
  A('pu10','첫 열 번','뽑기 10번',()=>C.pull>=10,500,2); A('pu50','손맛','뽑기 50번',()=>C.pull>=50,1500,5); A('pu200','중독','뽑기 200번',()=>C.pull>=200,5000,15);
  A('re1','다시 온 자','재림을 하나 연다',()=>Object.keys(PF.re||{}).length>=1,2000,6); A('re5','재림 다섯','재림을 다섯 연다',()=>Object.keys(PF.re||{}).length>=5,6000,20);
  A('t20','스무 층','등반 20층을 넘는다',()=>PF.tw.best>=20,2500,8); A('t30','서른 층','등반 30층을 넘는다',()=>PF.tw.best>=30,4000,12); A('t40','마흔 층','등반 40층을 넘는다',()=>PF.tw.best>=40,6000,18); A('t50','쉰 층','등반 50층을 넘는다',()=>PF.tw.best>=50,10000,30);
  A('tf50','오르고 또 오르고','등반에서 넘은 층 합계 50',()=>C.tfloor>=50,1500,5); A('tf300','산을 사는 사람','등반에서 넘은 층 합계 300',()=>C.tfloor>=300,6000,18); A('tr10','열 번의 등반','등반을 10번 시작한다',()=>PF.tw.runs>=10,800,2);
  A('b3','사냥꾼','서로 다른 보스 셋을 쓰러뜨린다',()=>bossN()>=3,1500,5); A('b10','보스 사냥꾼','서로 다른 보스 열을 쓰러뜨린다',()=>bossN()>=10,4000,12); A('ball','도감 완성','모든 보스를 쓰러뜨린다',()=>typeof MONS!=='undefined'&&MONS.every(k=>PF.mon[k]>0),10000,30); A('rw10','레이드 열 번','레이드 10승',()=>C.raidw>=10,2000,6); A('rw50','레이드 쉰 번','레이드 50승',()=>C.raidw>=50,6000,18);
  A('mw1','함께 첫 승','친구와 함께 한 판에서 이긴다',()=>C.mw>=1,800,3); A('mw10','단짝','친구와 함께 10승',()=>C.mw>=10,2500,8); A('mw50','전우','친구와 함께 50승',()=>C.mw>=50,7000,20); A('co5','둘이서 다섯 층','함께 오르는 등반에서 5층을 넘는다',()=>C.coop>=5,1500,5); A('co15','둘이서 열다섯 층','함께 오르는 등반에서 15층을 넘는다',()=>C.coop>=15,5000,15);
  A('ms10','성실','임무 보상 10번 받기',()=>C.claim>=10,1000,3); A('ms50','근면','임무 보상 50번 받기',()=>C.claim>=50,4000,12); A('dw3','사흘','오늘의 도전 3승',()=>PF.dwin>=3,800,3); A('dw15','보름','오늘의 도전 15승',()=>PF.dwin>=15,3000,10); A('ds14','두 이레','오늘의 도전을 14일 내리 이긴다',()=>PF.dstreak>=14,5000,15);
  A('ss10','이야기꾼','이야기 별 10개',()=>stars()>=10,1500,5); A('ss20','기록자','이야기 별 20개',()=>stars()>=20,3000,10); A('lv5','다섯 걸음','계정 레벨 5',()=>lvInfo().lv>=5,500,2); A('lv10','열 걸음','계정 레벨 10',()=>lvInfo().lv>=10,1500,5); A('lv20','스무 걸음','계정 레벨 20',()=>lvInfo().lv>=20,4000,12); A('lv30','서른 걸음','계정 레벨 30',()=>lvInfo().lv>=30,8000,25);
  on('hit',(s,t,amt)=>{ if(s===me&&!practice&&amt>C.maxhit) C.maxhit=Math.round(amt); });
  on('end',w=>{ if(practice||!w) return; const win=me&&w.team===me.team; C.play++; C.dmg+=Math.round(Object.values(me.dealt||{}).reduce((a,b)=>a+b,0)); if(win){ C.cls[me.c.cls]=(C.cls[me.c.cls]||0)+1; if(diff===2) C.hardw++; const tg=mode===7&&!practice; if(ents.length===2&&!tg&&me.hp>=me.max*.7) C.sr++; if(!tg&&me.hp>=me.max) C.flawless++; if(ents.some(o=>o.c&&o.c.mon)&&!(TW&&TW.on)) C.raidw++; if(NET.host&&NET.players.length>1) C.mw++; if(TW&&TW.on){ C.tfloor++; if(coopN()>1) C.coop=Math.max(C.coop,TW.floor); } } pfSave(); setTimeout(()=>achCheck({}),50); });
  const po1=pullOne; pullOne=function(m){ const r=po1(m); C.pull++; return r; };
  document.addEventListener('click',e=>{ if(e.target.closest('[data-mc]')){ C.claim++; pfSave(); setTimeout(()=>achCheck({}),100); } },true);
  const sr3=showResult; showResult=function(){ if(NET.client&&over&&over.winner&&me&&!over.cnt){ over.cnt=true; C.play++; if(over.winner.team===me.team){ C.mw++; C.cls[me.c.cls]=(C.cls[me.c.cls]||0)+1; PF.w++; } else PF.l++; pfSave(); setTimeout(()=>achCheck({}),50); } sr3(); };
  achCheck({}); }

/* ═════ 보상 코드 ═════ 기록 화면의 코드 칸에 적는다. 한 번만 듣는다 */
const CODES={'(지운 코드)':{coin:15000}};
function redeem(v){ const k=String(v||'').replace(/\s+/g,''),c=CODES[k]; if(!c) return false; PF.codes=PF.codes||{}; if(PF.codes[k]){ toast('이미 쓴 코드다'); return true; } PF.codes[k]=Date.now(); PF.coin+=c.coin||0; PF.star+=c.star||0; pfSave(); sfx('win'); toast('코드 보상 · 코인 +'+(c.coin||0).toLocaleString()+(c.star?' · 별무리 +'+c.star:''),4200); hubCard(); return true; }
{ const dr1=drawRec; drawRec=function(){ dr1(); const rs=$('rec-reset'); if(rs&&!$('code-in')) rs.insertAdjacentHTML('beforebegin','<h2>보상 코드</h2><div class="row"><input type="text" id="code-in" placeholder="코드를 적는다" autocomplete="off" style="flex:2"><button type="button" id="code-go">받기</button></div>'); };
  document.addEventListener('click',e=>{ if(!e.target.closest('#code-go')) return; const el=$('code-in'); if(!el) return; if(!el.value.trim()) return toast('코드를 적는다'); if(redeem(el.value)){ el.value=''; drawRec(); } else toast('없는 코드다'); });
  document.addEventListener('keydown',e=>{ if(e.key==='Enter'&&e.target&&e.target.id==='code-in'){ const b=$('code-go'); if(b) b.click(); } });
  const q=$('q'); if(q) q.addEventListener('input',()=>{ if(CODES[q.value.replace(/\s+/g,'')]&&redeem(q.value)){ q.value=''; drawSel(); } }); }

/* ════════════════ 1.0.0 ════════════════ */
/* ── 재림 캐릭터의 몸: 원래 캐릭터보다 체력 +50, 기본 공격 +2 ── */
for(const k of Object.keys(CH)){ const c=CH[k]; if(!c.re||!CH[c.base]) continue; const b=CH[c.base]; if(c.hp===b.hp) c.hp=b.hp+50; if(c.atk===b.atk) c.atk=b.atk+2; }

/* ── 뽑기: 캐릭터 대신 파편이 3~5개 나온다. 파편 10개가 모이면 캐릭터가 되고, 이미 가진 캐릭터라면 '중복' 하나가 된다(재림에 쓴다).
   확률은 고화 60 · 서사 30 · 전설 10. 신화와 히든은 나오지 않는다. ── */
PF.shard=PF.shard||{}; PF.dup=PF.dup||{};
GRATE.length=0; GRATE.push(['고화',60],['서사',30],['전설',10]);
const SHARDN=10, RDUP={고화:3,서사:2,전설:1,히든:0,신화:0};
pullOne=function(minIdx){ PF.pity=(PF.pity||0)+1; const force=PF.pity>=PITY?2:(minIdx||0),L=GRATE.slice(Math.min(force,GRATE.length-1)); let tot=L.reduce((a,x)=>a+x[1],0),x=Math.random()*tot,g=L[L.length-1][0]; for(const q of L){ if((x-=q[1])<0){ g=q[0]; break; } }
  const pool=gachaPool(g),k=pool[Math.floor(Math.random()*pool.length)]; if(!k) return null;
  /* 처음 나온 캐릭터는 파편 없이 바로 준다. 이미 가진 캐릭터면 파편 3~5개(10개가 모이면 중복 하나) */
  if(!PF.own[k]){ PF.own[k]=Date.now(); if(g==='전설') PF.pity=0; mission('pull',1); PF.cnt.pull++; return {k,g,n:0,got:'new',have:PF.shard[k]||0,first:true}; }
  const n=3+Math.floor(Math.random()*3); PF.shard[k]=(PF.shard[k]||0)+n; let got='';
  while(PF.shard[k]>=SHARDN){ PF.shard[k]-=SHARDN; if(!PF.own[k]){ PF.own[k]=Date.now(); got='new'; } else { PF.dup[k]=(PF.dup[k]||0)+1; if(!got) got='dup'; } }
  if(g==='전설') PF.pity=0; mission('pull',1); PF.cnt.pull++; return {k,g,n,got,have:PF.shard[k]||0}; };
gachaShow=function(res,done){ const el=$('tw-body'); let fin=false; const end=()=>{ if(fin) return; fin=true; done(); };
  el.innerHTML=head('GACHA','뽑기','눌러서 넘긴다')+'<div class="gst'+(res.length===1?' one':'')+'">'+res.map(r=>{ const c=CH[r.k]; return '<div class="gc'+(r.got==='new'||r.g==='전설'?' hi':'')+'" style="--gc:'+GCOL[r.g]+'"><div class="bk"></div><div class="ft"><b>'+esc(c.name.split(', ')[1])+'</b><small>'+r.g+(r.direct?'':r.first?' · 첫 획득':' · 파편 ×'+r.n)+'</small><em>'+(r.got==='new'?'캐릭터 획득!':r.got==='dup'?'중복 +1':r.have+' / '+SHARDN)+'</em></div></div>'; }).join('')+'</div><div class="dock"><button class="go" id="ga-skip" type="button">넘기기</button></div>';
  $('tower').hidden=false; $('tower').scrollTop=0; [...el.querySelectorAll('.gc')].forEach((c,i)=>setTimeout(()=>{ if(fin) return; c.classList.add('on'); const r=res[i]; if(r.got==='new'){ sfx('ult'); buzz(80); } else sfx('ui'); },350+i*(res.length>1?260:0)));
  setTimeout(()=>{ const b=$('ga-skip'); if(b&&!fin) b.textContent='결과 보기'; },350+res.length*260+200); el.querySelector('#ga-skip').onclick=end; };
const reNeed=k=>{ const c=CH[k],w=(PF.ch[k]||{}).w||0,d=PF.dup[k]||0,nd=RDUP[c.grade]||0,st=RECOST[c.grade]||50; return {w,d,nd,st,ok:w>=REWIN&&d>=nd&&PF.star>=st}; };
lockWhy=function(k){ const b=baseKey(k); if(!PF.own[b]) return '가방 탭의 뽑기에서 처음 나오면 바로 얻는다'; if(CH[k].re){ const n=reNeed(b); return '재림: '+REWIN+'승('+n.w+') · 중복 '+n.nd+'('+n.d+') · 별무리 '+n.st+' — 가방 → 재림 · 완성에서 연다'; } return ''; };
gachaScreen=function(res){ if(res) res.forEach(r=>{ if(r.n===undefined){ r.n=0; r.got='new'; r.have=0; r.direct=true; } }); if(res&&res.length&&!res.shown){ res.shown=true; return gachaShow(res,()=>gachaScreen(res)); }
  const pb=(v,m,col)=>'<div class="mbar"><i style="width:'+Math.min(100,Math.round(100*v/m))+'%;background:'+(col||'var(--aether)')+'"></i></div>';
  let h=head('GACHA','뽑기','코인 '+PF.coin.toLocaleString()+' · 별무리의 흔적 '+PF.star+' · 전설 파편 보장까지 '+Math.max(0,PITY-(PF.pity||0))+'번');
  if(res) h+='<h2>나온 파편</h2>'+res.map(r=>{ const c=CH[r.k]; return '<div class="pl" style="border-left-color:'+GCOL[r.g]+'"><b>'+esc(c.name.split(', ')[1])+' <small style="color:'+GCOL[r.g]+'">'+r.g+' '+c.cls+'</small></b><span style="color:var(--muted)">'+(r.direct?'별무리로 데려옴 · ':r.first?'첫 획득 · ':'파편 +'+r.n+' · ')+(r.got==='new'?'<b style="color:var(--gold)">캐릭터 획득</b>':r.got==='dup'?'<b style="color:var(--ok)">중복 +1</b>':r.have+' / '+SHARDN)+'</span></div>'; }).join('');
  h+='<div class="row" style="margin-top:12px"><button type="button" data-pull="1"'+(PF.coin<PULL?' style="opacity:.5"':'')+'>1번 뽑기<small style="display:block;font-size:10.5px;opacity:.75">코인 '+PULL.toLocaleString()+'</small></button><button type="button" data-pull="10"'+(PF.coin<PULL10?' style="opacity:.5"':'')+'>10번 뽑기<small style="display:block;font-size:10.5px;opacity:.75">코인 '+PULL10.toLocaleString()+' · 서사 이상 하나 보장</small></button></div>';
  h+='<p class="note" style="white-space:pre-line">처음 나온 캐릭터는 그 자리에서 바로 얻는다.\n이미 가진 캐릭터가 나오면 파편이 3~5개 나온다. 파편 '+SHARDN+'개는 \'중복\' 하나가 되고, 재림에 쓴다.\n확률: '+GRATE.map(g=>g[0]+' '+g[1]+'%').join(' · ')+' (신화 · 히든은 나오지 않는다)</p>';
  const S=Object.keys(PF.shard).filter(k=>CH[k]&&PF.shard[k]>0).sort((a,b)=>PF.shard[b]-PF.shard[a]); if(S.length) h+='<h2>모으는 중인 파편</h2>'+S.slice(0,30).map(k=>{ const c=CH[k]; return '<div class="pl" style="border-left-color:'+GCOL[c.grade]+'"><b>'+esc(c.name.split(', ')[1])+' <small style="color:var(--muted)">'+c.grade+' '+c.cls+(PF.own[k]?' · 가짐':'')+'</small></b><span style="color:var(--muted)">'+PF.shard[k]+' / '+SHARDN+'</span>'+pb(PF.shard[k],SHARDN,GCOL[c.grade])+'</div>'; }).join('')+(S.length>30?'<p class="sub">많이 모은 순으로 30명만 보인다.</p>':'');
  const R=Object.keys(CH).filter(k=>!CH[k].re&&PF.own[k]&&CH[k+'_r']&&!PF.re[k]).sort((a,b)=>(reNeed(b).ok-reNeed(a).ok)||(((PF.ch[b]||{}).w||0)+(PF.dup[b]||0)*5)-(((PF.ch[a]||{}).w||0)+(PF.dup[a]||0)*5));
  if(R.length) h+='<h2>재림</h2><p class="note">원래 캐릭터로 '+REWIN+'승 이상 + 중복 캐릭터(고화 3 · 서사 2 · 전설 1) + 별무리의 흔적. 재림 캐릭터는 체력 +50, 기본 공격 +2.</p>'+R.slice(0,12).map(k=>{ const c=CH[k],n=reNeed(k),ck=(a,b)=>'<span style="color:'+(a>=b?'var(--ok)':'var(--muted)')+'">'; return '<div class="pl" style="border-left-color:'+GCOL[c.grade]+'"><b>'+esc(c.name.split(', ')[1])+' <small style="color:var(--muted)">'+esc(CH[k+'_r'].name.split(', ')[0])+'</small></b>'+(n.ok?'<button type="button" data-re2="'+k+'" style="height:34px;border:1px solid var(--gold);border-radius:8px;background:var(--panel);color:var(--gold);padding:0 12px;font-weight:700">재림</button>':'')+'<div style="flex-basis:100%;font-size:12px">'+ck(n.w,REWIN)+'승 '+n.w+'/'+REWIN+'</span> · '+ck(n.d,n.nd)+'중복 '+n.d+'/'+n.nd+'</span> · '+ck(PF.star,n.st)+'별무리 '+n.st+'</span></div></div>'; }).join('')+(R.length>12?'<p class="sub">조건에 가까운 순으로 12명만 보인다.</p>':'');
  const GG=['고화','서사','전설','신화'],all=GG.map(g=>gachaPool(g)); h+='<h2>가진 캐릭터</h2>'+GG.map((g,i)=>{ const hv=all[i].filter(k=>PF.own[k]).length; return '<div class="pl" style="border-left-color:'+GCOL[g]+'"><b>'+g+' '+hv+' / '+all[i].length+'</b><span style="color:var(--muted)">골라서 데려오기 · 별무리 '+SBUY[g]+'</span>'+(hv<all[i].length?'<button type="button" data-sb="'+g+'" style="height:34px;border:1px solid var(--line);border-radius:8px;background:var(--panel);padding:0 10px">고르기</button>':'')+'</div>'; }).join('');
  h+='<div class="dock"><button class="ghost" id="tw-out" type="button">닫기</button></div>'; $('tw-body').innerHTML=h; $('tower').hidden=false; if(res) $('tower').scrollTop=0; };
document.addEventListener('click',e=>{ const t=e.target.closest('[data-re2]'); if(!t) return; const k=t.dataset.re2,n=reNeed(k); if(!n.ok) return toast('조건이 모자라다'); PF.star-=n.st; PF.dup[k]=(PF.dup[k]||0)-n.nd; PF.re[k]=Date.now(); pfSave(); sfx('win'); toast(CH[k+'_r'].name+' · 재림했다',3600); achCheck({}); drawSel(); gachaScreen(); });

/* ── 닉네임 ── */
const nickOf=()=>{ let v=''; try{ v=localStorage.getItem('aetherName')||''; }catch(x){} return (v||($('n-name')&&$('n-name').value)||'').trim().slice(0,8)||'나'; };
/* ── 패치 내역: 새 판을 내보낼 때 맨 위에 한 덩이를 더한다 ── */
const PATCH=[
 ['1.5.3','2026-11',['태그매치: 물러난 캐릭터가 남은 지속 피해로 쓰러져 지던 것, 물러난 캐릭터의 장판 · 연속 스킬이 계속 싸우던 것, 쓰러진 사이 고른 캐릭터가 교대 대기시간을 쓰던 것을 고쳤다. 1대1 업적 · S 평가가 붙지 않게 했다. 대기 중인 우리 팀 캐릭터에도 완성이 붙는다.','다시 서는 캐릭터(등반 보스 층 부활 · 킬 선취 · 점령전 · 연습)가 등반 권능 · 장비 · 완성 효과를 잃던 것을 고쳤다. 등반에서 완성 체력이 최대 체력에 제대로 들어간다.','업적 경험치로 레벨이 올라도 레벨 보상을 준다. 여럿이 하는 레이드에서 보스 처치가 가끔 안 세지던 것, 쓰러진 채 이겨도 기사회생이 붙던 것, 등반 · 이야기 중 설정을 바꾸면 빌린 캐릭터 · 방식이 저장되던 것을 고쳤다.','화면: 가로 화면 메뉴에서 알림이 화면 밖에 뜨던 것, 좁은 휴대폰에서 스킬 이름이 잘리던 것(이제 133명 모두 들어간다), 가로 화면 창의 아래 단추가 화면 절반을 덮던 것을 고쳤다. 교대 단추를 낮게, 싸움 중 알림을 한 줄로 했다.','왼손 배치에서 단추 묶음도 거울처럼 놓는다(기본 공격이 바깥쪽). 노치 · 홈 막대(안전 영역)를 피한다. 좁은 화면의 캐릭터 찾기 줄 · 뽑기 결과(네 칸)를 정리했다.','PC: Esc로 창을 닫고 멈춤을 푼다. 겹친 창은 맨 위부터 닫는다. 소리 · 음악 끄기가 다음에도 그대로다. 뽑기 연출은 카드를 누르면 한 번에 넘어간다.']],
 ['1.5.2','2026-11',['최적화: 효과음 잡음 버퍼를 돌려 쓰고, 캐릭터 이름표를 미리 그려 둔 그림으로 붙여 싸움 중 그리기 부담을 줄였다.','옛 휴대폰(iOS 15 등)에서 떠오르는 글자 상자를 그리다 싸움이 멈출 수 있던 것을 막았다.','함께 하기: 자리가 모자란 손님은 그 판을 관전한다(조작 단추를 숨기고 코인 · 전적은 세지 않는다).','잠긴 캐릭터 안내 문구를 지금 방식(뽑기에서 처음 나오면 바로 얻는다)에 맞췄다.']],
 ['1.5.1','2026-11',['태그매치: 교대 재사용 대기시간 15초 → 45초, 대신 싸우는 중에도 교대할 수 있다.','겹침 정리: 싸우는 중 알림 · 교대 단추 · 데스카운트 · 메뉴 알림을 체력 줄 아래에 차례로 쌓고, 왼쪽 기록 줄은 그 아래에서 화면에 들어갈 만큼만 보인다. 고르는 화면과 창에서는 알림이 아래 단추 위에 뜬다. 레이드 · 대돌격 아래쪽 안내 글이 이름표와 겹치던 것을 뺐다.','함께 하기 손질: 방장이 그만두면 손님 화면이 멈춘 채 남던 것, 손님이 그만두기를 한 번만 눌러도 화면이 멈추던 것, 그만둔 손님의 캐릭터를 컴퓨터가 이어 받지 않던 것을 고쳤다.','쓰러진 채 끊긴 손님이 다시 들어와도 자리를 못 찾던 것, 다시 이을 때 빌린 캐릭터가 바뀌던 것, 메뉴 알림이 계속 남던 것을 고쳤다.','손님이 탭을 내리면 그 캐릭터가 마지막 방향으로 계속 걷던 것을 멈추게 했다.','레이드 전리품 · 손님 코인 배수가 방장 기준을 따르게 했다. 함께 레이드 · 등반 뒤 다른 방식으로 싸우면 원래 편으로 돌아간다.']],
 ['1.5.0','2026-11',['새 방식 「3대3 태그매치」: 캐릭터 셋을 골라 한 명씩 싸운다. 5초 동안 싸우지 않으면 교대(재사용 대기시간 15초, 들어온 캐릭터는 1초 무적 · 스킬 못 씀). 셋이 모두 쓰러진 편이 진다. 보상은 쓰러뜨린 캐릭터 수만큼.','시작 화면 문구를 바꾸고 저작권 표시를 넣었다.']],
 ['1.4.0','2026-11',['뽑기: 처음 나온 캐릭터는 파편 없이 바로 얻는다. 이미 가진 캐릭터가 나오면 파편 3~5개.','새 시스템 「완성」: 재림이 없는 캐릭터(신화 · 히든 제외)는 재림과 같은 값(15승 + 중복 + 별무리의 흔적)을 내고 완성할 수 있다. 완성하면 체력 +50 · 기본 공격 +2 · 모든 스킬 재사용 대기시간 10% 감소. 가방 → 재림 · 완성.']],
 ['1.3.0','2026-11',['함께 하기: 들어온 사람이 「준비」를 누르면 방장 명단에 ✔ 준비 완료가 뜨고, 방장의 싸우기 단추에 준비한 사람 수가 나온다. 판이 시작되면 준비는 풀린다.','함께 등반: 방장이 고르는 보상 · 길 · 상점 물건이 모두의 화면에 보이고, 하나를 「추천」할 수 있다. 방장 화면의 그 칸에 누가 추천했는지 뜬다.']],
 ['1.2.3','2026-11',['뽑기 한 번에 나오는 파편이 1~3개에서 3~5개로 늘었다.','함께 하기에서 방장이 아닌 사람 화면에 집중(시전) 막대가 안 보이던 것을 고쳤다.']],
 ['1.2.2','2026-11',['달리기 배율을 1.3배에서 1.2배로 낮췄다.','가방 탭을 다시 짰다: 보유 · 뽑기를 맨 위에 두고, 파편 · 재림 · 숙련 · 데려오기 · 중복 · 확률은 칸을 눌러 창으로 본다.','가방 · 기록 · 설정 탭에서는 나/상대 칸과 싸우기 단추를 숨겨 화면을 넓게 쓴다.','멈춤 메뉴의 단추를 두 줄로 묶고, 그만두기를 따로 눈에 띄게 했다.','대전 화면의 「뽑기」 칸 이름을 「가방」으로 바꿨다.']],
 ['1.2.1','2026-11',['달리기: 바라보는 쪽으로(60도 안쪽) 걸으면 걸음이 1.3배 빨라진다. 마인크래프트의 달리기처럼 앞으로 갈 때만이고, 옆걸음 · 뒷걸음은 그대로다. 보스 몬스터는 빼고 모두에게 적용된다.','잡몹 소환 공통 규칙: 살아 있는 소환 잡몹은 넷까지. 꽉 차 있으면 보스는 소환을 쉬고 나머지 스킬이 30% 빨리 돈다.','소환된 잡몹의 체력을 30% 낮췄다.','보스 이름: 해적 선장 포워트 · 유사의 군주.']],
 ['1.2.0','2026-11',['새 탭 「가방」: 뽑기 · 파편 가방 · 중복 캐릭터 · 재림 · 숙련 · 골라서 데려오기를 한곳에 모았다.','「모두 열기」 단추를 없앴다. 이제 뽑기 방식이 기본이다.','보상 코드는 셋이다. 기록 화면 맨 아래에 적는다.','맵 여덟 개 추가: 무너진 유적 · 오아시스 · 바람골 · 가시 정원 · 차원문 회랑 · 대투기장 · 수렁 늪지 · 협곡. 등반은 층마다 맵이 바뀐다.','이야기는 (임시로) 지금 고른 내 캐릭터로 싸운다.','보상 정리: 레이드는 난이도별 코인 · 별무리와 첫 처치 보상(파편 포함), 등반은 층마다 코인과 5층 단위 첫 돌파 보상, 이야기는 첫 승리 · ★★ · 완주 보상, 오늘의 도전은 그날 첫 승리 보상.','업적을 유형별(전투 · 수집 · 레이드 · 등반 · 이야기 · 함께)로 나눠 본다. 군주 · 위신 사냥 업적 추가.','문서 보스의 「미친척 모드」를 「광폭화 모드」로 바꾸고, 보스 이름과 기술 이름을 새로 지었다.']],
 ['1.1.0','2026-11',['구글 문서 「보스 문서」의 보스 여덟이 레이드에 들어왔다. 결속: 우르사온 · 드리아드 · 미노타우로스 / 군주: 진흙 거인 · 박준형 · 여왕 개미 / 위신: 숭배받는 신 · 모래 왕.','새 보스는 체력이 절반 아래로 내려가면 「미친척 모드」가 되어 패턴이 강해진다.','비어 있던 레이드 난이도 군주 · 위신에 보스가 생겼다(데스카운트 3).','문서에 수치가 없어 체력 · 피해 · 범위 · 대기시간은 시험장에서 정했다. 보스 설명에 정한 것을 적어 두었다.','등반의 보스 차례 뒤쪽에 새 보스가 이어진다.']],
 ['1.0.2','2026-11',['기록 화면의 업적을 단추로 묶었다. 누르면 창으로 뜨고, 전체 · 남은 것 · 달성으로 나눠 볼 수 있다.','보상 코드 칸을 기록 화면 맨 아래로 내렸다.']],
 ['1.0.1','2026-11',['레이드에서 아직 보스가 없는 난이도(군주 · 위신)를 고르면 다른 난이도의 보스와 싸우게 되던 것을 막았다.','별무리로 데려온 캐릭터의 결과 창에 "파편 +undefined"가 뜨던 것을 고쳤다.','조작키 창을 연 뒤 상대 스킬 보기 창이 가려지던 것을 고쳤다.','이야기 · 도전 · 등반 도중 화면이 닫히면 빌려 쓴 캐릭터가 내 칸에 남던 것을 막았다.','데스카운트가 혼자 하는 레이드와 들어온 사람 화면에도 보인다.','함께 할 때 방장의 닉네임이 다른 사람 화면에도 뜬다. 초대 링크로 들어올 때는 패치 창을 띄우지 않는다.','방 만들기 · 들어가기가 망 문제로 한 번에 안 붙으면 두 번까지 알아서 다시 해 본다.']],
 ['1.0.0','2026-11',['뽑기가 파편 방식으로 바뀌었다. 한 번에 파편 1~3개, 10개를 모으면 캐릭터. 확률은 고화 60 · 서사 30 · 전설 10 (신화 · 히든은 나오지 않는다).','재림 조건: 원래 캐릭터로 15승 + 중복 캐릭터(고화 3 · 서사 2 · 전설 1) + 별무리의 흔적. 재림 캐릭터는 체력 +50, 기본 공격 +2.','레이드에 난이도가 생겼다: 소란 · 집결 · 결속 · 군주 · 위신. 데스카운트는 1 · 2 · 2 · 3 · 3이고 편 전체가 나눠 쓴다.','처음 들어오면 닉네임을 정한다. 싸움 중 체력 줄 위에 닉네임과 (캐릭터명)이 뜬다.','정신 집중(캐스팅)과 고유 자원이 캐릭터 아래에 막대로 보인다.','가나안의 기본 공격이 좁은 부채꼴(6.5칸)이 되었다. 메릴다의 선회 8칸, 사냥개는 느려지고 5초 뒤 사라진다.']]
];
function patchScreen(){ const d=document.createElement('div'); d.className='overlay'; d.style.zIndex=44; d.id='patchv'; d.innerHTML='<div class="wrap">'+head('PATCH NOTES','버전 '+VER,'바뀐 것')+PATCH.slice(0,4).map(p=>'<h2>'+p[0]+' <small style="color:var(--muted);font-weight:400">'+p[1]+'</small></h2>'+p[2].map(l=>'<p class="note" style="margin:6px 0">'+esc(l)+'</p>').join('')).join('')+'<div class="dock"><button class="go" id="pv-ok" type="button">확인</button></div></div>'; document.body.appendChild(d); d.querySelector('#pv-ok').onclick=()=>d.remove(); }
function nickScreen(done){ const d=document.createElement('div'); d.className='overlay'; d.style.zIndex=46; d.innerHTML='<div class="wrap">'+head('WELCOME','닉네임을 정한다','싸움 중 내 캐릭터 위에 뜨고, 친구와 함께 할 때 보인다')+'<div class="row"><input type="text" id="nk-in" maxlength="8" placeholder="닉네임 (8자까지)" autocomplete="off" style="flex:1;height:52px;font-size:17px;text-align:center"></div><p class="note">나중에 \'함께\' 화면의 내 이름 칸에서 바꿀 수 있다.</p><div class="dock"><button class="go" id="nk-ok" type="button">정했다</button></div></div>'; document.body.appendChild(d);
  const inp=d.querySelector('#nk-in'),ok=()=>{ const v=inp.value.trim().slice(0,8); if(!v) return toast('닉네임을 적는다'); try{ localStorage.setItem('aetherName',v); }catch(x){} if($('n-name')) $('n-name').value=v; d.remove(); toast(v+' · 반갑다'); done&&done(); }; d.querySelector('#nk-ok').onclick=ok; inp.addEventListener('keydown',e=>{ if(e.key==='Enter') ok(); e.stopPropagation(); }); setTimeout(()=>inp.focus(),300); }
/* 들어올 때: (제목 화면) → 닉네임이 없으면 정하기 → 버전과 패치 내역 */
{ const room=/[?&]room=/.test(location.search),flow=()=>{ let has=false; try{ has=!!localStorage.getItem('aetherName'); }catch(x){} if(!has) nickScreen(room?null:patchScreen); else if(!room) patchScreen(); };
  if(!navigator.webdriver&&!/[?&]bc\b/.test(location.search)){ if(document.getElementById('title')){ const iv=setInterval(()=>{ if(!document.getElementById('title')){ clearInterval(iv); flow(); } },200); } else flow(); } }

/* ── 캐릭터 아래 막대: 정신 집중(캐스팅)이 차는 모습과, 그 캐릭터만의 자원(n/m) ── */
on('step',()=>{ for(const e of ents){ if(e.chant>now){ if(!e._c1||Math.abs(e._c1-e.chant)>.02){ e._c0=now; e._c1=e.chant; } } else e._c1=0; } });
on('draw:world',()=>{ if(!me) return; g.save(); g.textAlign='center'; g.lineJoin='round';
  const bar=(x,y,w,f,col,lab,txt)=>{ g.globalAlpha=.85; g.fillStyle='rgba(6,9,23,.85)'; g.fillRect(x-w/2-.03,y-.03,w+.06,.2); g.fillStyle=col; g.fillRect(x-w/2,y,w*Math.max(0,Math.min(1,f)),.14); if(lab){ g.globalAlpha=1; g.font='700 .26px "Gothic A1",sans-serif'; g.lineWidth=.06; g.strokeStyle='rgba(6,9,23,.9)'; g.strokeText(lab+(txt?' '+txt:''),x,y+.44); g.fillStyle='#e9ecff'; g.fillText(lab+(txt?' '+txt:''),x,y+.44); } };
  for(const e of ents){ if(e.dead) continue; const st=has(e,'stealth'); if(st&&e.team!==me.team) continue; let y=e.y+(e.rad||R)+.34; const fo=e.st.find(q=>q.k==='focus'&&q.until>now); let c1=NET.client?e.chant:e._c1,c0=NET.client?(e._n0||(e._n0=now)):e._c0; if(NET.client&&!(e.chant>now)) e._n0=0; if(fo&&fo.d0>0&&!(c1>now)){ c1=fo.until; c0=fo.until-fo.d0; }
    if(c1>now&&c1>c0){ bar(e.x,y,1.5,(now-c0)/(c1-c0),e.team===me.team?'#fff3cf':'#ff9aa5','집중',(c1-now).toFixed(1)+'s'); y+=.62; }
    if(e===me){ const Rz=RES[e.key]; if(!(Rz&&(Rz.p||Rz.gz))){ let h=''; try{ h=String(e.c.hud(e)||''); }catch(x){} const m=h.match(/([^·\d\/]{1,10}?)\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/); if(m&&+m[3]>1){ const f=+m[2]/+m[3]; bar(e.x,y,1.5,f,f>=1?'#e3c377':'#7fe9ff',m[1].trim(),m[2]+'/'+m[3]); } } } }
  g.restore(); });

/* 화면을 옮길 때도 빌려 쓴 설정이 남아 있지 않게 한다. 뒤로 가기로 조작키·패치 창을 닫는다 */
{ const gp2=goPage; goPage=function(p){ keepFix(); gp2(p); }; const bs0=backStep; backStep=function(){ const k=document.getElementById('keysv')||document.getElementById('patchv'); if(k){ k.remove(); return true; } return bs0(); }; }

/* ── 기록 화면: 업적은 단추를 눌러 따로 띄우고, 보상 코드 칸은 맨 아래로 ── */
function achScreen(){ const old=document.getElementById('achv'); if(old) old.remove(); const got=ACH.filter(a=>PF.ach[a[0]]).length,d=document.createElement('div'); d.className='overlay'; d.id='achv'; d.style.zIndex=9; let tab=achScreen.tab||'all';
  const render=()=>{ const L=ACH.filter(a=>tab==='all'||(tab==='done')===!!PF.ach[a[0]]); d.innerHTML='<div class="wrap">'+head('ACHIEVEMENTS','업적',got+' / '+ACH.length+' 달성')+'<div class="row" id="ach-tab"><button type="button" data-t="all" aria-pressed="'+(tab==='all')+'">전체 '+ACH.length+'</button><button type="button" data-t="todo" aria-pressed="'+(tab==='todo')+'">남은 것 '+(ACH.length-got)+'</button><button type="button" data-t="done" aria-pressed="'+(tab==='done')+'">달성 '+got+'</button></div><div style="margin-top:10px">'
     +(L.length?L.map(a=>{ const ok=!!PF.ach[a[0]],pay=achPay(a[0]); return '<div class="pl" style="border-left-color:'+(ok?'var(--gold)':'var(--line)')+';opacity:'+(ok?1:.62)+'"><b>'+(ok?'◆ ':'◇ ')+esc(a[1])+'</b><span style="color:var(--muted)">'+esc(a[2])+'</span><span style="color:'+(ok?'var(--muted)':'var(--gold)')+';font-size:11.5px;flex-basis:100%">'+(ok?'받음 · ':'보상 · ')+'코인 '+pay[0].toLocaleString()+' · 별무리 '+pay[1]+'</span></div>'; }).join(''):'<p class="sub">여기에는 아직 없다.</p>')+'</div><div class="dock"><button class="go" id="ach-out" type="button">닫기</button></div></div>';
    d.querySelector('#ach-out').onclick=()=>d.remove(); d.querySelector('#ach-tab').onclick=e=>{ const b=e.target.closest('button'); if(!b) return; tab=achScreen.tab=b.dataset.t; render(); d.scrollTop=0; }; };
  render(); document.body.appendChild(d); }
{ const dr2=drawRec; drawRec=function(){ dr2(); const el=$('rec'); if(!el) return;
    const h=[...el.querySelectorAll('h2')].find(x=>/^업적/.test(x.textContent)); if(h){ let n=h.nextElementSibling; while(n&&n.classList.contains('pl')){ const nx=n.nextElementSibling; n.remove(); n=nx; } const got=ACH.filter(a=>PF.ach[a[0]]).length; h.textContent='업적'; h.insertAdjacentHTML('afterend','<button type="button" class="tool" id="ach-open" style="width:100%"><b>업적 '+got+' / '+ACH.length+'</b><small>눌러서 모두 본다 · 달성하면 코인과 별무리의 흔적을 받는다</small><div class="mbar" style="margin-top:8px"><i style="width:'+Math.round(100*got/ACH.length)+'%;background:var(--gold)"></i></div></button>'); }
    const ci=$('code-in'); if(ci){ const row=ci.closest('.row'),hh=row.previousElementSibling; el.appendChild(hh); el.appendChild(row); } };
  document.addEventListener('click',e=>{ if(e.target.closest('#ach-open')) achScreen(); });
  const bs1=backStep; backStep=function(){ const k=document.getElementById('achv'); if(k){ k.remove(); return true; } return bs1(); }; }

/* ════════════════ 1.2.0 ════════════════ */
/* ── 보상 코드 셋: (지운 코드)(코인 15000) · 일곱 별의 화신(별무리 40) · 만마의 궁전(모두 열기 켬/끔). 띄어쓰기는 없어도 된다 ── */
delete CODES['(지운 코드)']; Object.assign(CODES,{'(지운 코드)':{coin:15000},'(지운 코드)':{star:40},'만마의궁전':{palace:1}});
PF.codes=PF.codes||{}; if(PF.codes['(지운 코드)']&&!PF.codes['(지운 코드)']){ PF.codes['(지운 코드)']=PF.codes['(지운 코드)']; delete PF.codes['(지운 코드)']; }
/* 모두 열기 단추는 없앴다. 예전에 단추로 열어 둔 것은 뽑기 방식으로 돌린다(만마의 궁전으로 연 것만 남는다) */
if(PF.open&&!PF.palace){ PF.open=false; pfSave(); }
{ const rd0=redeem; redeem=function(v){ const k=String(v||'').replace(/\s+/g,''); if(k!=='만마의궁전') return rd0(v);
    PF.open=!PF.open; PF.palace=PF.open?1:0; pfSave(); sfx('win'); toast(PF.open?'만마의 궁전 · 모든 캐릭터가 열렸다 (한 번 더 적으면 닫힌다)':'만마의 궁전 · 닫혔다. 다시 뽑기 방식이다',4200);
    if(!PF.open&&locked(kOf('me'))){ sel.me='ei'; sel.meR=false; } drawSel(); hubCard(); if(typeof drawBag==='function') drawBag(); return true; }; }

/* ── 가방 탭: 뽑기 · 파편 · 재림 · 숙련 · 데려오기를 한곳에 ── */
function giveShard(k,n){ PF.shard=PF.shard||{}; PF.dup=PF.dup||{}; PF.shard[k]=(PF.shard[k]||0)+n; let got=''; while(PF.shard[k]>=SHARDN){ PF.shard[k]-=SHARDN; if(PF.own[k]){ PF.dup[k]=(PF.dup[k]||0)+1; got=' (중복 +1)'; } else { PF.own[k]=Date.now(); got=' (캐릭터 획득)'; } } return CH[k].name.split(', ')[1]+' 파편 +'+n+got; }
function drawBag(){ const el=$('bag'); if(!el) return; const pb=(v,m,col)=>'<div class="mbar"><i style="width:'+Math.min(100,Math.round(100*v/m))+'%;background:'+(col||'var(--aether)')+'"></i></div>',nm=k=>esc(CH[k].name.split(', ')[1]);
  const base=Object.keys(CH).filter(k=>!CH[k].re&&!CH[k].built&&!CH[k].custom),own=base.filter(k=>PF.own[k]);
  let h='<h2>보유</h2><div class="pl"><b>코인 '+PF.coin.toLocaleString()+'</b><span style="color:var(--muted)">별무리의 흔적 '+PF.star+'</span></div><div class="pl"><b>캐릭터 '+own.length+' / '+base.length+'</b><span style="color:var(--muted)">재림 '+Object.keys(PF.re||{}).length+'명</span></div>'+(PF.open?'<p class="note">만마의 궁전이 열려 있다. 지금은 모든 캐릭터를 쓸 수 있다.</p>':'');
  h+='<h2>뽑기</h2><div class="row"><button type="button" data-pull="1"'+(PF.coin<PULL?' style="opacity:.5"':'')+'>1번 뽑기<small style="display:block;font-size:10.5px;opacity:.75">코인 '+PULL.toLocaleString()+'</small></button><button type="button" data-pull="10"'+(PF.coin<PULL10?' style="opacity:.5"':'')+'>10번 뽑기<small style="display:block;font-size:10.5px;opacity:.75">코인 '+PULL10.toLocaleString()+' · 서사 이상 하나 보장</small></button></div>';
  h+='<p class="note" style="white-space:pre-line">처음 나온 캐릭터는 그 자리에서 바로 얻는다.\n이미 가진 캐릭터가 나오면 파편이 3~5개 나온다. 파편 '+SHARDN+'개는 \'중복\' 하나가 되고, 재림에 쓴다.\n확률: '+GRATE.map(g=>g[0]+' '+g[1]+'%').join(' · ')+' (신화 · 히든은 나오지 않는다) · 전설 파편 보장까지 '+Math.max(0,PITY-(PF.pity||0))+'번</p>';
  const S=Object.keys(PF.shard||{}).filter(k=>CH[k]&&PF.shard[k]>0).sort((a,b)=>PF.shard[b]-PF.shard[a]),D=Object.keys(PF.dup||{}).filter(k=>CH[k]&&PF.dup[k]>0);
  h+='<h2>파편 가방</h2>'+(S.length?S.slice(0,60).map(k=>{ const c=CH[k]; return '<div class="pl" style="border-left-color:'+GCOL[c.grade]+'"><b>'+nm(k)+' <small style="color:var(--muted)">'+c.grade+' '+c.cls+(PF.own[k]?' · 가짐':'')+'</small></b><span style="color:var(--muted)">'+PF.shard[k]+' / '+SHARDN+'</span>'+pb(PF.shard[k],SHARDN,GCOL[c.grade])+'</div>'; }).join('')+(S.length>60?'<p class="sub">많이 모은 순으로 60명만 보인다.</p>':''):'<p class="sub">아직 모은 파편이 없다. 뽑기와 레이드 첫 처치에서 나온다.</p>');
  if(D.length) h+='<h2>중복 캐릭터</h2>'+D.map(k=>'<div class="pl" style="border-left-color:'+GCOL[CH[k].grade]+'"><b>'+nm(k)+'</b><span style="color:var(--muted)">중복 '+PF.dup[k]+' · 재림에 쓴다</span></div>').join('');
  const R=own.filter(k=>CH[k+'_r']&&!PF.re[k]).sort((a,b)=>(reNeed(b).ok-reNeed(a).ok)||(((PF.ch[b]||{}).w||0)+(PF.dup[b]||0)*5)-(((PF.ch[a]||{}).w||0)+(PF.dup[a]||0)*5));
  h+='<h2>재림</h2><p class="note">원래 캐릭터로 '+REWIN+'승 이상 + 중복 캐릭터(고화 3 · 서사 2 · 전설 1) + 별무리의 흔적. 재림 캐릭터는 체력 +50, 기본 공격 +2.</p>'+(R.length?R.slice(0,12).map(k=>{ const c=CH[k],n=reNeed(k),ck=(a,b)=>'<span style="color:'+(a>=b?'var(--ok)':'var(--muted)')+'">'; return '<div class="pl" style="border-left-color:'+GCOL[c.grade]+'"><b>'+nm(k)+' <small style="color:var(--muted)">'+esc(CH[k+'_r'].name.split(', ')[0])+'</small></b>'+(n.ok?'<button type="button" data-re2="'+k+'" style="height:34px;border:1px solid var(--gold);border-radius:8px;background:var(--panel);color:var(--gold);padding:0 12px;font-weight:700">재림</button>':'')+'<div style="flex-basis:100%;font-size:12px">'+ck(n.w,REWIN)+'승 '+n.w+'/'+REWIN+'</span> · '+ck(n.d,n.nd)+'중복 '+n.d+'/'+n.nd+'</span> · '+ck(PF.star,n.st)+'별무리 '+n.st+'</span></div></div>'; }).join('')+(R.length>12?'<p class="sub">조건에 가까운 순으로 12명만 보인다.</p>':''):'<p class="sub">재림할 수 있는 캐릭터가 아직 없다.</p>');
  const L=Object.entries(PF.ch).filter(x=>CH[x[0]]).sort((a,b)=>b[1].w-a[1].w);
  h+='<h2>숙련</h2>'+(L.length?L.slice(0,20).map(([k,c])=>{ const nx=c.w>=15?0:c.w>=5?15:c.w>=1?5:1; return '<div class="pl"><b>'+nm(k)+mastery(k)+'</b><span style="color:var(--muted)">'+c.w+'승 '+c.l+'패'+(nx?' · 다음 ★까지 '+(nx-c.w)+'승':' · 숙련 끝')+'</span>'+(nx?pb(c.w,nx,'var(--gold)'):'')+'</div>'; }).join('')+'<p class="note">★ 1승 · ★★ 5승 · ★★★ 15승. 캐릭터 고르는 칸에도 뜬다.'+(L.length>20?' 많이 이긴 순으로 20명만 보인다.':'')+'</p>':'<p class="sub">아직 싸운 기록이 없다.</p>');
  const GG=['고화','서사','전설','신화'],all=GG.map(g=>gachaPool(g)); h+='<h2>골라서 데려오기</h2>'+GG.map((g,i)=>{ const hv=all[i].filter(k=>PF.own[k]).length; return '<div class="pl" style="border-left-color:'+GCOL[g]+'"><b>'+g+' '+hv+' / '+all[i].length+'</b><span style="color:var(--muted)">별무리의 흔적 '+SBUY[g]+'</span>'+(hv<all[i].length?'<button type="button" data-sb="'+g+'" style="height:34px;border:1px solid var(--line);border-radius:8px;background:var(--panel);padding:0 10px">고르기</button>':'')+'</div>'; }).join('');
  el.innerHTML=h; }
/* 뽑기 화면은 이제 결과만 띄운다. 결과가 없으면 가방 탭으로 간다 */
{ gachaScreen=function(res){ if(res) res.forEach(r=>{ if(r.n===undefined){ r.n=0; r.got='new'; r.have=0; r.direct=true; } }); if(res&&res.length&&!res.shown){ res.shown=true; return gachaShow(res,()=>gachaScreen(res)); }
    drawBag(); if(!res||!res.length){ $('tower').hidden=true; if(page!=='bag') goPage('bag'); return; }
    let h=head('GACHA','나온 파편','코인 '+PF.coin.toLocaleString()+' · 별무리의 흔적 '+PF.star)+res.map(r=>{ const c=CH[r.k]; return '<div class="pl" style="border-left-color:'+GCOL[r.g]+'"><b>'+esc(c.name.split(', ')[1])+' <small style="color:'+GCOL[r.g]+'">'+r.g+' '+c.cls+'</small></b><span style="color:var(--muted)">'+(r.direct?'별무리로 데려옴 · ':r.first?'첫 획득 · ':'파편 +'+r.n+' · ')+(r.got==='new'?'<b style="color:var(--gold)">캐릭터 획득</b>':r.got==='dup'?'<b style="color:var(--ok)">중복 +1</b>':r.have+' / '+SHARDN)+'</span></div>'; }).join('');
    h+='<div class="row" style="margin-top:12px"><button type="button" data-pull="1"'+(PF.coin<PULL?' style="opacity:.5"':'')+'>1번 더<small style="display:block;font-size:10.5px;opacity:.75">코인 '+PULL.toLocaleString()+'</small></button><button type="button" data-pull="10"'+(PF.coin<PULL10?' style="opacity:.5"':'')+'>10번 더<small style="display:block;font-size:10.5px;opacity:.75">코인 '+PULL10.toLocaleString()+'</small></button></div><div class="dock"><button class="go" id="tw-out" type="button">가방으로</button></div>';
    $('tw-body').innerHTML=h; $('tower').hidden=false; $('tower').scrollTop=0; if(page!=='bag') goPage('bag'); };
  const gp3=goPage; goPage=function(p){ gp3(p); if(p==='bag') drawBag(); };
  document.addEventListener('click',e=>{ if(e.target.closest('#tw-out,[data-get]')) setTimeout(drawBag,0); });
  /* 기록 화면에서는 모두 열기 단추 · 보유 · 숙련을 뺀다(가방 탭으로 옮겼다) */
  const dr3=drawRec; drawRec=function(){ dr3(); const el=$('rec'); if(!el) return; const b=$('rec-open'); if(b){ const n=b.nextElementSibling; if(n&&n.classList.contains('note')) n.remove(); b.remove(); }
    for(const t of ['보유','숙련']){ const hh=[...el.querySelectorAll('h2')].find(x=>x.textContent===t); if(!hh) continue; let n=hh.nextElementSibling; while(n&&n.tagName!=='H2'&&n.id!=='ach-open'){ const nx=n.nextElementSibling; n.remove(); n=nx; } hh.remove(); }
    el.insertAdjacentHTML('beforeend','<p class="sub" style="margin-top:10px">뽑기 · 파편 · 재림 · 숙련은 아래 \'가방\' 탭에 있다.</p>'); }; }

/* ── 이야기: 정해진 캐릭터 대신 지금 고른 내 캐릭터로 싸운다(임시) ── */
{ const sg0=spGo; spGo=function(m){ if(m&&m.kind==='story'){ const k=kOf('me'); if(CH[k]&&!CH[k].mon&&!locked(k)) m=Object.assign({},m,{cfg:Object.assign({},m.cfg,{me:k,meR:false})}); } return sg0(m); };
  const ss0=storyScreen; storyScreen=function(si,ci){ ss0(si,ci); const el=$('tw-body'),k=kOf('me'); el.querySelectorAll('.sub').forEach(p=>{ if(/정해진 캐릭터로 싸운다/.test(p.textContent)) p.textContent='이야기는 지금 고른 내 캐릭터로 싸운다(임시). 글은 노션 \'맥스 세계관 정리본 (정사)\'에서 옮겼다.'; });
    if(si!=null&&ci!=null){ const d=el.querySelector('.dock'); if(d) d.insertAdjacentHTML('beforebegin','<p class="sub">내 캐릭터 · '+esc(CH[k].name)+' (글 속의 주인공 자리에 선다)</p><p class="note">'+payTxt.story(STORY[si],ci)+'</p>'); } }; }

/* ── 보상: 판마다 받는 기본 코인에 더해, 레이드 · 등반 · 이야기 · 오늘의 도전은 따로 얹어 준다 ── */
const RAIDPAY={coin:[200,400,700,1100,1600],star:[0,1,1,2,3],fcoin:[600,1000,1800,3000,5000],fstar:[1,2,3,5,8],fshard:[1,2,3,4,5]};   /* 난이도(소란~위신)별 · f = 첫 처치 */
const TWPAY={coin:f=>40+f*15,boss:f=>f>=20?2:1,mcoin:f=>f*150,mstar:f=>f/5};                                                        /* 층마다 · 보스 층 별무리 · 5층 단위 첫 돌파 */
const STPAY={first:[500,2],two:[500,2],again:100,all:[1500,5]}, DYPAY=[600,2];
const payTxt={ raid:k=>{ const t=tierOf(k),f=!(PF.rf||{})[k]; return '이기면 코인 +'+RAIDPAY.coin[t]+(RAIDPAY.star[t]?' · 별무리 +'+RAIDPAY.star[t]:'')+(t>=2?' · 가끔 파편':'')+(f?'\n첫 처치: 코인 +'+RAIDPAY.fcoin[t].toLocaleString()+' · 별무리 +'+RAIDPAY.fstar[t]+' · 서사 이상 파편 '+RAIDPAY.fshard[t]+'개':'\n첫 처치 보상은 이미 받았다'); },
  story:(s,ci)=>{ const was=(PF.story[s.id]||[])[ci]||0; return '보상 · '+(was?'':'첫 승리 코인 +'+STPAY.first[0]+' · 별무리 +'+STPAY.first[1]+' / ')+(was<2?'★★ 코인 +'+STPAY.two[0]+' · 별무리 +'+STPAY.two[1]+' / ':'다시 이기면 코인 +'+STPAY.again+' / ')+'이야기를 끝까지 넘기면 코인 +'+STPAY.all[0].toLocaleString()+' · 별무리 +'+STPAY.all[1]; },
  tower:()=>'보상 · 층을 넘을 때마다 코인(1층 '+TWPAY.coin(1)+' → 20층 '+TWPAY.coin(20)+'), 보스 · 마왕 층은 별무리 +1(20층부터 +2). 5 · 10 · 15…층을 처음 넘으면 코인 층×150 · 별무리 층÷5.' };
{ const en0=earn; earn=function(win){ const g=en0(win); let c=0,s=0; const N=[];
    try{ if(TW&&TW.on){ if(win){ const f=TW.floor,n=TW.next||{}; c+=TWPAY.coin(f); if(n.boss||n.lord) s+=TWPAY.boss(f); if(f%5===0&&f>PF.tw.best){ c+=TWPAY.mcoin(f); s+=TWPAY.mstar(f); N.push(f+'층 첫 돌파'); } } }
      else if(SPM&&SPM.kind==='story'){ if(win){ const S0=STORY[SPM.si],ch=S0.ch[SPM.ci],a=PF.story[S0.id]||[],was=a[SPM.ci]||0,st=goalOk(ch.goal)?2:1; if(!was){ c+=STPAY.first[0]; s+=STPAY.first[1]; N.push('첫 승리'); } if(st===2&&was<2){ c+=STPAY.two[0]; s+=STPAY.two[1]; N.push('★★'); } if(was>=st) c+=STPAY.again; if(!was&&S0.ch.every((_,j)=>j===SPM.ci||(a[j]||0)>0)){ c+=STPAY.all[0]; s+=STPAY.all[1]; N.push('이야기 완주'); } } }
      else if(SPM&&SPM.kind==='daily'){ if(win&&PF.daily.d!==today()){ c+=DYPAY[0]; s+=DYPAY[1]; N.push('오늘의 도전'); } }
      else if(mode===6&&win&&ents.some(o=>o.c&&o.c.mon)){ const k=ents.find(o=>o.c&&o.c.mon).key,t=tierOf(k),pool=()=>{ const L=gachaPool(t>=3&&Math.random()<.3?'전설':'서사'); return L[Math.floor(Math.random()*L.length)]; }; c+=RAIDPAY.coin[t]; s+=RAIDPAY.star[t]; PF.rf=PF.rf||{};
        if(!PF.rf[k]){ PF.rf[k]=Date.now(); c+=RAIDPAY.fcoin[t]; s+=RAIDPAY.fstar[t]; N.push('첫 처치'); const q=pool(); if(q) N.push(giveShard(q,RAIDPAY.fshard[t])); } else if(t>=2&&Math.random()<.35){ const q=pool(); if(q) N.push(giveShard(q,1)); } }
    }catch(x){}
    PF.coin+=c; PF.star+=s; g.c+=c; g.st+=s; g.note=N.join(' · '); return g; };
  /* 보상 표를 고르는 화면에 적어 둔다 */
  const dm0=drawMon; drawMon=function(){ dm0(); let p=$('monpay'); if(!p){ p=document.createElement('p'); p.className='note'; p.id='monpay'; p.style.whiteSpace='pre-line'; const m=$('mon'); m.parentNode.insertBefore(p,m.nextSibling); } p.textContent=CH[OPT.mon]&&tierOf(OPT.mon)===monTab?CH[OPT.mon].name.split(', ')[1]+' · '+payTxt.raid(OPT.mon):''; };
  const th0=towerHome; towerHome=function(){ th0(); const d=$('tw-body').querySelector('.dock'); if(d) d.insertAdjacentHTML('beforebegin','<p class="note">'+payTxt.tower()+' 층마다 맵이 바뀐다.</p>'); }; }

/* ── 등반: 층마다 맵을 무작위로 고른다. 보스 층은 좁은 맵을 뺀다 ── */
{ let pick=null; const tg0=towerGo; towerGo=function(){ if(TW&&!TW.on&&TW.next){ const n=TW.next; if(!n.map||!MAPS[n.map]){ const L=Object.keys(MAPS).filter(k=>!(n.boss||n.lord)||!['duel','canyon','storm'].includes(k)); n.map=L[Math.floor(Math.random()*L.length)]; twStore(); } pick=n.map; } try{ tg0(); } finally { pick=null; } };
  const su0=setup; setup=function(x){ su0(x); if(pick&&!x.map&&MAPS[pick]) OPT.map=pick; }; }

/* ── 업적: 유형별로 나눠 본다 ── */
ACH.push(['rt3','군주 사냥','군주 난이도의 보스를 쓰러뜨린다',()=>Object.keys(PF.mon).some(k=>PF.mon[k]>0&&CH[k]&&tierOf(k)===3)],['rt4','위신 사냥','위신 난이도의 보스를 쓰러뜨린다',()=>Object.keys(PF.mon).some(k=>PF.mon[k]>0&&CH[k]&&tierOf(k)===4)]); ACHPAY.rt3=[3000,10]; ACHPAY.rt4=[6000,20];
const ACAT=[['전투',null],['수집 · 숙련',/^(v\d+|m3|built|g\d+|gmyth|gleg\d*|pu\d+|re\d+|c\d0.+|allcls)$/],['레이드',/^(golem|hydra|korhen|b\d+|ball|rw\d+|rt\d)$/],['등반',/^(t\d+|tf\d+|tr\d+|co\d+)$/],['이야기 · 도전',/^(st1|stmax|stall|d1|d7|dw\d+|ds\d+|ss\d+)$/],['함께 · 계정',/^(mw\d+|ms\d+|lv\d+)$/]];
const acat=id=>{ for(let i=1;i<ACAT.length;i++) if(ACAT[i][1].test(id)) return i; return 0; };
achScreen=function(){ const old=document.getElementById('achv'); if(old) old.remove(); const d=document.createElement('div'); d.className='overlay'; d.id='achv'; d.style.zIndex=9; let tab=achScreen.tab||'all',cat=achScreen.cat==null?-1:achScreen.cat;
  const row=a=>{ const ok=!!PF.ach[a[0]],pay=achPay(a[0]); return '<div class="pl" style="border-left-color:'+(ok?'var(--gold)':'var(--line)')+';opacity:'+(ok?1:.62)+'"><b>'+(ok?'◆ ':'◇ ')+esc(a[1])+'</b><span style="color:var(--muted)">'+esc(a[2])+'</span><span style="color:'+(ok?'var(--muted)':'var(--gold)')+';font-size:11.5px;flex-basis:100%">'+(ok?'받음 · ':'보상 · ')+'코인 '+pay[0].toLocaleString()+' · 별무리 '+pay[1]+'</span></div>'; };
  const render=()=>{ const got=ACH.filter(a=>PF.ach[a[0]]).length,inC=i=>ACH.filter(a=>acat(a[0])===i),st=a=>tab==='all'||(tab==='done')===!!PF.ach[a[0]]; let body='';
    for(let i=0;i<ACAT.length;i++){ if(cat>=0&&cat!==i) continue; const L=inC(i).filter(st),A0=inC(i); if(!L.length&&cat<0) continue; body+='<h2>'+ACAT[i][0]+' <small style="color:var(--muted);font-weight:400">'+A0.filter(a=>PF.ach[a[0]]).length+' / '+A0.length+'</small></h2>'+(L.length?L.map(row).join(''):'<p class="sub">여기에는 아직 없다.</p>'); }
    d.innerHTML='<div class="wrap">'+head('ACHIEVEMENTS','업적',got+' / '+ACH.length+' 달성')+'<div class="row" id="ach-cat" style="flex-wrap:wrap"><button type="button" data-c="-1" aria-pressed="'+(cat<0)+'">모두</button>'+ACAT.map((c,i)=>'<button type="button" data-c="'+i+'" aria-pressed="'+(cat===i)+'">'+c[0]+'<small style="display:block;font-size:10.5px;opacity:.75">'+inC(i).filter(a=>PF.ach[a[0]]).length+' / '+inC(i).length+'</small></button>').join('')+'</div>'
     +'<div class="row" id="ach-tab" style="margin-top:8px"><button type="button" data-t="all" aria-pressed="'+(tab==='all')+'">전체</button><button type="button" data-t="todo" aria-pressed="'+(tab==='todo')+'">남은 것 '+(ACH.length-got)+'</button><button type="button" data-t="done" aria-pressed="'+(tab==='done')+'">달성 '+got+'</button></div><div style="margin-top:4px">'+(body||'<p class="sub">여기에는 아직 없다.</p>')+'</div><div class="dock"><button class="go" id="ach-out" type="button">닫기</button></div></div>';
    d.querySelector('#ach-out').onclick=()=>d.remove(); d.querySelector('#ach-tab').onclick=e=>{ const b=e.target.closest('button'); if(!b) return; tab=achScreen.tab=b.dataset.t; render(); d.scrollTop=0; }; d.querySelector('#ach-cat').onclick=e=>{ const b=e.target.closest('button'); if(!b) return; cat=achScreen.cat=+b.dataset.c; render(); d.scrollTop=0; }; };
  render(); document.body.appendChild(d); };
achCheck({}); hubCard();

/* ════════════════ 1.2.2 화면 정리 ════════════════ */
{ const gp4=goPage; goPage=function(p){ gp4(p); $('sel').dataset.pg=page; }; $('sel').dataset.pg=page; }
/* ── 가방: 위에는 보유와 뽑기만. 나머지는 칸을 눌러 창으로 본다 ── */
const bagData=()=>{ const base=Object.keys(CH).filter(k=>!CH[k].re&&!CH[k].built&&!CH[k].custom),own=base.filter(k=>PF.own[k]);
  return {base,own,S:Object.keys(PF.shard||{}).filter(k=>CH[k]&&PF.shard[k]>0).sort((a,b)=>PF.shard[b]-PF.shard[a]),D:Object.keys(PF.dup||{}).filter(k=>CH[k]&&PF.dup[k]>0),
   R:own.filter(k=>CH[k+'_r']&&!PF.re[k]).sort((a,b)=>(reNeed(b).ok-reNeed(a).ok)||(((PF.ch[b]||{}).w||0)+(PF.dup[b]||0)*5)-(((PF.ch[a]||{}).w||0)+(PF.dup[a]||0)*5)),L:Object.entries(PF.ch).filter(x=>CH[x[0]]).sort((a,b)=>b[1].w-a[1].w)}; };
drawBag=function(){ const el=$('bag'); if(!el) return; const B=bagData(),t=(id,name,sub,n)=>'<button type="button" class="tool" data-bag="'+id+'">'+(n?'<i>'+n+'</i>':'')+'<b>'+name+'</b><small>'+sub+'</small></button>';
  el.innerHTML='<div class="wal"><div><b>'+PF.coin.toLocaleString()+'</b><small>코인</small></div><div><b>'+PF.star+'</b><small>별무리의 흔적</small></div><div><b>'+B.own.length+' / '+B.base.length+'</b><small>캐릭터</small></div></div>'
   +(PF.open?'<p class="note">만마의 궁전이 열려 있다. 지금은 모든 캐릭터를 쓸 수 있다.</p>':'')
   +'<h2>뽑기</h2><div class="pullrow"><button type="button" data-pull="1"'+(PF.coin<PULL?' class="low"':'')+'><b>1번 뽑기</b><small>코인 '+PULL.toLocaleString()+'</small></button><button type="button" data-pull="10"'+(PF.coin<PULL10?' class="low"':'')+'><b>10번 뽑기</b><small>코인 '+PULL10.toLocaleString()+' · 서사 이상 보장</small></button></div>'
   +'<p class="sub" style="margin:8px 2px 0">처음 나온 캐릭터는 바로 얻는다 · 가진 캐릭터는 파편 3~5개 · 전설 파편 보장까지 '+Math.max(0,PITY-(PF.pity||0))+'번</p>'
   +'<h2>가방</h2><div class="bagg">'+t('sh','파편',B.S.length?B.S.length+'명의 파편을 모으는 중':'아직 없다',B.S.filter(k=>PF.shard[k]>=SHARDN-2).length?'곧 '+B.S.filter(k=>PF.shard[k]>=SHARDN-2).length:'')
   +t('re','재림 · 완성',(B.R.length||doneList().length)?'조건을 보고 재림하거나 완성한다':'아직 대상이 없다',(B.R.filter(k=>reNeed(k).ok).length+doneList().filter(k=>reNeed(k).ok).length)?'가능 '+(B.R.filter(k=>reNeed(k).ok).length+doneList().filter(k=>reNeed(k).ok).length):'')
   +t('ms','숙련',B.L.length?B.L.length+'명으로 싸웠다':'아직 기록이 없다')+t('get','데려오기','별무리의 흔적으로 골라서')
   +t('dup','중복 캐릭터',B.D.length?B.D.reduce((a,k)=>a+PF.dup[k],0)+'개 · 재림에 쓴다':'아직 없다')+t('rate','확률 · 규칙','뽑기가 어떻게 되는지')+'</div>'; };
function bagPop(kind){ const old=document.getElementById('bagv'); if(old) old.remove(); const d=document.createElement('div'); d.className='overlay'; d.id='bagv'; d.dataset.kind=kind; d.style.zIndex=9;
  const B=bagData(),nm=k=>esc(CH[k].name.split(', ')[1]),pb=(v,m,col)=>'<div class="mbar"><i style="width:'+Math.min(100,Math.round(100*v/m))+'%;background:'+(col||'var(--aether)')+'"></i></div>'; let h='';
  if(kind==='sh'){ const f=bagPop.f||'all',L=B.S.filter(k=>f==='all'||(f==='own')===!!PF.own[k]); h=head('SHARDS','파편 가방',B.S.length+'명 · 가진 캐릭터의 파편 '+SHARDN+'개는 중복 하나가 된다')+'<div class="row" id="sh-f"><button type="button" data-f="all" aria-pressed="'+(f==='all')+'">전체 '+B.S.length+'</button><button type="button" data-f="new" aria-pressed="'+(f==='new')+'">없는 캐릭터</button><button type="button" data-f="own" aria-pressed="'+(f==='own')+'">가진 캐릭터</button></div>'
     +(L.length?'<div class="shg" style="margin-top:10px">'+L.map(k=>{ const c=CH[k]; return '<div class="shc" style="border-top-color:'+GCOL[c.grade]+'"><span class="n">'+PF.shard[k]+' / '+SHARDN+'</span><b>'+nm(k)+'</b><small>'+c.grade+' '+c.cls+(PF.own[k]?' · 가짐':'')+'</small>'+pb(PF.shard[k],SHARDN,GCOL[c.grade])+'</div>'; }).join('')+'</div>':'<p class="sub" style="margin-top:12px">여기에는 아직 없다. 파편은 이미 가진 캐릭터를 뽑았을 때와 레이드에서 나온다.</p>')+'<p class="note" style="margin-top:12px">가진 캐릭터의 파편 '+SHARDN+'개는 \'중복\' 하나가 되어 재림에 쓰인다.</p>'; }
  else if(kind==='re'){ h=head('RETURN','재림','체력 +50 · 기본 공격 +2')+'<p class="note">원래 캐릭터로 '+REWIN+'승 이상 + 중복 캐릭터(고화 3 · 서사 2 · 전설 1) + 별무리의 흔적.</p>'+(B.R.length?B.R.map(k=>{ const c=CH[k],n=reNeed(k),ck=(a,b)=>'<span style="color:'+(a>=b?'var(--ok)':'var(--muted)')+'">'; return '<div class="pl" style="border-left-color:'+GCOL[c.grade]+'"><b>'+nm(k)+' <small style="color:var(--muted)">'+esc(CH[k+'_r'].name.split(', ')[0])+'</small></b>'+(n.ok?'<button type="button" data-re2="'+k+'" style="height:34px;border:1px solid var(--gold);border-radius:8px;background:var(--panel);color:var(--gold);padding:0 12px;font-weight:700">재림</button>':'')+'<div style="flex-basis:100%;font-size:12px">'+ck(n.w,REWIN)+'승 '+n.w+'/'+REWIN+'</span> · '+ck(n.d,n.nd)+'중복 '+n.d+'/'+n.nd+'</span> · '+ck(PF.star,n.st)+'별무리 '+n.st+'</span></div></div>'; }).join(''):'<p class="sub">재림할 수 있는 캐릭터가 아직 없다.</p>'); }
  else if(kind==='ms'){ h=head('MASTERY','숙련','★ 1승 · ★★ 5승 · ★★★ 15승')+(B.L.length?B.L.map(([k,c])=>{ const nx=c.w>=15?0:c.w>=5?15:c.w>=1?5:1; return '<div class="pl"><b>'+nm(k)+mastery(k)+'</b><span style="color:var(--muted)">'+c.w+'승 '+c.l+'패'+(nx?' · 다음 ★까지 '+(nx-c.w)+'승':' · 숙련 끝')+'</span>'+(nx?pb(c.w,nx,'var(--gold)'):'')+'</div>'; }).join(''):'<p class="sub">아직 싸운 기록이 없다.</p>'); }
  else if(kind==='get'){ const GG=['고화','서사','전설','신화']; h=head('INVITE','골라서 데려오기','별무리의 흔적 '+PF.star)+GG.map(g=>{ const all=gachaPool(g),hv=all.filter(k=>PF.own[k]).length; return '<div class="pl" style="border-left-color:'+GCOL[g]+'"><b>'+g+' '+hv+' / '+all.length+'</b><span style="color:var(--muted)">별무리의 흔적 '+SBUY[g]+'</span>'+(hv<all.length?'<button type="button" data-sb="'+g+'" style="height:34px;border:1px solid var(--line);border-radius:8px;background:var(--panel);padding:0 10px">고르기</button>':'')+'</div>'; }).join(''); }
  else if(kind==='dup'){ h=head('DUPLICATES','중복 캐릭터','재림에 쓴다')+(B.D.length?B.D.map(k=>'<div class="pl" style="border-left-color:'+GCOL[CH[k].grade]+'"><b>'+nm(k)+' <small style="color:var(--muted)">'+CH[k].grade+' '+CH[k].cls+'</small></b><span style="color:var(--muted)">중복 '+PF.dup[k]+' / 재림에 '+(RDUP[CH[k].grade]||0)+'</span></div>').join(''):'<p class="sub">아직 없다. 가진 캐릭터의 파편 '+SHARDN+'개가 모이면 중복 하나가 된다.</p>'); }
  else { h=head('RULES','확률 · 규칙','뽑기가 어떻게 되는지')+GRATE.map(g=>'<div class="pl" style="border-left-color:'+GCOL[g[0]]+'"><b>'+g[0]+'</b><span style="color:var(--muted)">'+g[1]+'%</span></div>').join('')+'<p class="note" style="white-space:pre-line">신화 · 히든은 뽑기에서 나오지 않는다.\n처음 나온 캐릭터는 그 자리에서 바로 얻는다.\n이미 가진 캐릭터가 나오면 파편이 3~5개 나온다. 파편 '+SHARDN+'개는 \'중복\' 하나가 되고, 재림 · 완성에 쓴다.\n'+PITY+'번 안에 전설 파편이 한 번은 나온다(지금 '+Math.max(0,PITY-(PF.pity||0))+'번 남음).\n10번 뽑기는 서사 이상이 하나는 나온다.</p>'; }
  d.innerHTML='<div class="wrap">'+h+'<div class="dock"><button class="go" id="bag-out" type="button">닫기</button></div></div>'; document.body.appendChild(d); }
document.addEventListener('click',e=>{ const t=e.target.closest('[data-bag],#bag-out,#sh-f button,#bagv [data-sb],#bagv [data-re2]'); if(!t) return; const v=document.getElementById('bagv');
  if(t.dataset.bag) return bagPop(t.dataset.bag); if(t.id==='bag-out'){ v&&v.remove(); return drawBag(); } if(t.dataset.f){ bagPop.f=t.dataset.f; return bagPop('sh'); }
  if(t.dataset.sb){ v&&v.remove(); return; } if(t.dataset.re2) setTimeout(()=>{ if(document.getElementById('bagv')) bagPop('re'); },30); });
{ const bs2=backStep; backStep=function(){ const k=document.getElementById('bagv'); if(k){ k.remove(); return true; } return bs2(); }; }
drawBag();

/* ════════════════ 1.3.0 함께 하기: 준비 표시 · 함께 등반에서 고를 것 추천 ════════════════ */
/* ── 준비: 들어온 사람이 '준비'를 누르면 방장 명단에 ✔가 뜬다. 판이 시작되면 모두 풀린다 ── */
lobbyOut=function(){ const h=NET.players[0]; if(h){ h.name=NET.name(); h.key=okKey(sel.me)?sel.me:'ei'; h.re=!!(sel.meR&&CH[sel.me+'_r']); } const L=NET.players.map(p=>({pid:p.pid,name:p.name,key:p.key,re:p.re,team:p.team,host:!!p.host,ready:!!p.ready,done:p.done||''})); for(const p of others()) NET.tx.send(p.pid,{t:'lobby',players:L,code:NET.code,you:p.pid}); drawNet(); };
const readyN=()=>{ const L=NET.players.filter(p=>!p.host); return [L.filter(p=>p.ready).length,L.length]; };
{ const dn1=drawNet; drawNet=function(){ dn1(); const on=NET.host||NET.client; let rb=$('n-ready'); if(!rb){ const lst=$('n-list'); lst.insertAdjacentHTML('beforebegin','<div class="row" id="n-rdyrow"><button type="button" id="n-ready">준비</button></div>'); rb=$('n-ready'); }
    $('n-rdyrow').style.display=on&&NET.client?'flex':'none'; const mine=NET.players.find(p=>p.pid===NET.pid); rb.setAttribute('aria-pressed',!!(mine&&mine.ready)); rb.textContent=mine&&mine.ready?'✔ 준비 완료 · 눌러서 풀기':'준비';
    if(!on) return; $('n-list').querySelectorAll('.pl').forEach((el,i)=>{ const p=NET.players[i]; if(!p||p.host) return; el.insertAdjacentHTML('beforeend','<span style="flex-basis:100%;font-size:12px;font-weight:700;color:'+(p.ready?'var(--ok)':'var(--muted)')+'">'+(p.ready?'✔ 준비 완료':'준비 안 함')+'</span>'); if(p.ready) el.style.borderLeftColor='var(--ok)'; });
    if(NET.host&&!running){ const [r,n]=readyN(); if(n){ $('start').textContent='싸우기 · 준비 '+r+' / '+n; $('netbar').textContent+=' · 준비 '+r+'/'+n; } } };
  document.addEventListener('click',e=>{ if(!e.target.closest('#n-ready')||!NET.client||!NET.tx) return; const mine=NET.players.find(p=>p.pid===NET.pid),on=!(mine&&mine.ready); if(mine) mine.ready=on; NET.tx.send({t:'rdy',on}); sfx('ui'); drawNet(); });
  on('begin',()=>{ if(NET.host&&NET.players.some(p=>p.ready)){ NET.players.forEach(p=>{ p.ready=false; }); setTimeout(lobbyOut,0); } }); }

/* ── 함께 등반: 방장이 고르는 보상 · 길 · 상점을 모두가 보고, 하나를 '추천'할 수 있다. 방장 화면에 누가 무엇을 추천했는지 뜬다 ── */
const TV={sig:'',v:{}};   /* 지금 고르는 것의 표시 · pid → 추천한 칸 번호 */
const tvName=pid=>{ const p=NET.players.find(x=>x.pid===pid); return p?(p.name||'손님'):'손님'; };
function tvChoices(){ return [...$('tw-body').querySelectorAll('.bcard[data-rw],.bcard[data-path],.bcard[data-buy]')].map(b=>({a:b.dataset.rw!==undefined?'rw':b.dataset.path!==undefined?'path':'buy',t:b.querySelector('b')?b.querySelector('b').innerHTML:'',p:b.querySelector('p')?b.querySelector('p').textContent:'',col:b.style.borderLeftColor||'',dis:!!b.disabled})); }
function tvBadges(){ if(!NET.host) return; const cards=[...$('tw-body').querySelectorAll('.bcard[data-rw],.bcard[data-path],.bcard[data-buy]')]; cards.forEach((b,i)=>{ const o=b.querySelector('.tvb'); if(o) o.remove(); const who=Object.keys(TV.v).filter(k=>TV.v[k]===i).map(tvName); if(who.length) b.insertAdjacentHTML('beforeend','<span class="tvb" style="display:inline-block;margin-top:6px;padding:2px 8px;border-radius:9px;background:var(--gold);color:var(--night);font-size:11.5px;font-weight:700">추천 · '+who.map(esc).join(', ')+'</span>'); }); }
{ const cs0=coopSend; coopSend=function(end){ if(!NET.host||!NET.tx||coopN()<2) return; const ch=end||!TW?[]:tvChoices(),sig=(TW?TW.floor:0)+'|'+ch.map(c=>c.a+c.t).join('|'); if(sig!==TV.sig){ TV.sig=sig; TV.v={}; } tvBadges();
    const T=TW; sendAll({t:'tw',end:end||'',floor:T?T.floor:0,what:T?(T.rew?'방장이 보상을 고르는 중':T.shop?'방장이 상인과 거래하는 중':T.fork?'방장이 길을 고르는 중':T.next?'다음 상대 · '+foeLine(T.next):''):'',pw:T?T.pw.map(id=>POWERS[id].name+' '+POWERS[id].lv):[],gear:T?['w','a','t'].filter(s=>GEAR[T.gear[s]]).map(s=>GEAR[T.gear[s]].name):[],best:PF.tw.best,ch,sig,votes:Object.keys(TV.v).map(k=>[TV.v[k],tvName(k),k])}); };
  const hm1=hostMsg; hostMsg=function(pid,d){ if(d&&NET.host&&(d.t==='rdy'||d.t==='twv')){ const p=NET.players.find(x=>x.pid===pid); if(!p) return;
      if(d.t==='rdy'){ p.ready=!!d.on; if(p.ready) toast((p.name||'손님')+' · 준비 완료',1800); lobbyOut(); return; }
      if(d.sig!==TV.sig||!(d.i>=0)) return; if(TV.v[pid]===d.i) delete TV.v[pid]; else { TV.v[pid]=d.i; const c=tvChoices()[d.i]; toast((p.name||'손님')+' 추천 · '+(c?(()=>{ const d=document.createElement('div'); d.innerHTML=c.t; return d.textContent; })():''),2200); } coopSend(); return; }
    return hm1(pid,d); };
  const ci0=coopInfo; coopInfo=function(d){ ci0(d); if(d.end||!d.ch||!d.ch.length) return; coopInfo.last=d; const mineV=(d.votes.find(v=>v[2]===NET.pid)||[])[0];
    const html='<h2>방장이 고를 것 · 하나를 추천할 수 있다</h2>'+d.ch.map((c,i)=>{ const who=d.votes.filter(v=>v[0]===i).map(v=>v[1]); return '<div class="bcard" style="display:block;width:100%;text-align:left;color:var(--ink);border-left-color:'+(c.col||'var(--gold)')+(c.dis?';opacity:.45':'')+'"><b>'+c.t+'</b><p class="note" style="white-space:pre-line">'+esc(c.p)+'</p>'+(who.length?'<span style="display:inline-block;margin:4px 0;padding:2px 8px;border-radius:9px;background:var(--gold);color:var(--night);font-size:11.5px;font-weight:700">추천 · '+who.map(esc).join(', ')+'</span>':'')+(c.dis?'':'<div class="row" style="margin-top:6px"><button type="button" data-tv="'+i+'" aria-pressed="'+(mineV===i)+'">'+(mineV===i?'✔ 내가 추천함 · 눌러서 풀기':'이것을 추천')+'</button></div>')+'</div>'; }).join('');
    const sub=$('tw-body').querySelector('.sub:last-of-type'); if(sub) sub.insertAdjacentHTML('beforebegin',html); else $('tw-body').insertAdjacentHTML('beforeend',html); };
  document.addEventListener('click',e=>{ const b=e.target.closest('[data-tv]'); if(!b||!NET.client||!NET.tx||!coopInfo.last) return; NET.tx.send({t:'twv',i:+b.dataset.tv,sig:coopInfo.last.sig}); sfx('ui'); b.disabled=true; b.textContent='보내는 중…'; }); }

/* ════════════════ 1.4.0 완성 ════════════════
   재림이 없는 캐릭터(신화 · 히든 제외)는 재림과 같은 값(15승 + 중복 + 별무리의 흔적)을 내고 '완성'할 수 있다.
   완성한 캐릭터: 체력 +50 · 기본 공격 +2 · 모든 스킬 재사용 대기시간 10% 감소(기본 공격 제외). */
PF.done=PF.done||{};
function canDone(k){ const c=CH[k]; return !!c&&!c.re&&!CH[k+'_r']&&!['신화','히든'].includes(c.grade)&&!c.built&&!c.custom&&!c.mon&&!c.mob&&!c.kit; }
function isDone(k){ return !!(PF.done&&PF.done[k]); }
function doneList(){ return Object.keys(CH).filter(k=>PF.own[k]&&canDone(k)&&!isDone(k)).sort((a,b)=>(reNeed(b).ok-reNeed(a).ok)||(((PF.ch[b]||{}).w||0)+(PF.dup[b]||0)*5)-(((PF.ch[a]||{}).w||0)+(PF.dup[a]||0)*5)); }
const DONEHP=50,DONEATK=2,DONECD=.9;
/* 판이 시작될 때 완성한 캐릭터의 몸을 올린다. 방장(또는 혼자)이 셈하고, 들어온 사람은 방장이 보낸 값을 받는다 */
on('begin',()=>{ if(NET.client) return; for(const e of ents){ let want=false,keep=null;
    if(e===me){ want=e.key===sel.me&&!sel.meR&&isDone(e.key)&&canDone(e.key); if(want&&TW&&TW.on){ e.done=true; e.atk+=DONEATK; continue; } /* 등반은 최대 체력(twMax)에 이미 들어 있다 */ }
    else if(mode===7&&!practice&&e.team===0&&!e.net){ want=isDone(e.key)&&canDone(e.key); }
    else if(e.net){ const p=NET.players.find(q=>q.pid===e.net.pid); want=!!(p&&p.done&&p.done===e.key&&canDone(e.key)); if(TW&&TW.on&&TW.php&&TW.php[e.net.pid]!=null) keep=TW.php[e.net.pid]; }
    if(!want) continue; e.done=true; e.max+=DONEHP; e.hp=keep==null?e.hp+DONEHP:Math.max(1,Math.min(e.max,keep)); e.atk+=DONEATK; } });
on('cast',(e,slot)=>{ if(e.done&&slot!=='b'&&slot!=='crouch'&&e.cd[slot]>0) e.cd[slot]*=DONECD; });
/* 들어온 사람: 고른 캐릭터가 완성인지 방장에게 알린다 */
{ const pk0=NET.pick; NET.pick=function(){ pk0(); if(NET.client&&NET.tx) NET.tx.send({t:'pdone',key:!sel.meR&&isDone(sel.me)?sel.me:''}); };
  const cm0=clientMsg; clientMsg=function(d){ cm0(d); if(d&&d.t==='lobby'&&NET.client&&NET.tx){ const k=!sel.meR&&isDone(sel.me)?sel.me:'',mine=(d.players||[]).find(p=>p.pid===NET.pid); if(mine&&(mine.done||'')!==k&&mine.key===sel.me) NET.tx.send({t:'pdone',key:k}); } };
  const hm2=hostMsg; hostMsg=function(pid,d){ if(d&&d.t==='pdone'&&NET.host){ const p=NET.players.find(x=>x.pid===pid); if(p){ p.done=okKey(d.key)&&canDone(d.key)?d.key:''; lobbyOut(); } return; } return hm2(pid,d); };
  const lo0=lobbyOut; lobbyOut=function(){ const h=NET.players[0]; if(h&&h.host) h.done=!sel.meR&&isDone(sel.me)?sel.me:''; lo0(); };
  const dn2=drawNet; drawNet=function(){ dn2(); if(!(NET.host||NET.client)) return; $('n-list').querySelectorAll('.pl').forEach((el,i)=>{ const p=NET.players[i]; if(p&&p.done&&p.done===p.key&&!p.re){ const sp=el.querySelectorAll('span')[0]; if(sp) sp.insertAdjacentHTML('beforeend',' <b style="color:var(--gold);font-size:11.5px">완성</b>'); } }); }; }
/* 재림 · 완성 창 */
{ const bp0=bagPop; bagPop=function(kind){ bp0(kind); if(kind!=='re') return; const d=document.getElementById('bagv'); if(!d) return; const w=d.querySelector('.wrap'),dock=w.querySelector('.dock'),nm=k=>esc(CH[k].name.split(', ')[1]),L=doneList(),D=Object.keys(PF.done).filter(k=>CH[k]);
    const hh=w.querySelector('.brand h1, header h1'); if(hh) hh.textContent='재림 · 완성';
    let h='<h2>완성</h2><p class="note">재림이 없는 캐릭터(신화 · 히든 제외)는 재림과 같은 값을 내고 완성할 수 있다.\n완성: 체력 +'+DONEHP+' · 기본 공격 +'+DONEATK+' · 모든 스킬 재사용 대기시간 10% 감소.</p>'
     +(L.length?L.map(k=>{ const c=CH[k],n=reNeed(k),ck=(a,b)=>'<span style="color:'+(a>=b?'var(--ok)':'var(--muted)')+'">'; return '<div class="pl" style="border-left-color:'+GCOL[c.grade]+'"><b>'+nm(k)+' <small style="color:var(--muted)">'+c.grade+' '+c.cls+'</small></b>'+(n.ok?'<button type="button" data-dn="'+k+'" style="height:34px;border:1px solid var(--gold);border-radius:8px;background:var(--panel);color:var(--gold);padding:0 12px;font-weight:700">완성</button>':'')+'<div style="flex-basis:100%;font-size:12px">'+ck(n.w,REWIN)+'승 '+n.w+'/'+REWIN+'</span> · '+ck(n.d,n.nd)+'중복 '+n.d+'/'+n.nd+'</span> · '+ck(PF.star,n.st)+'별무리 '+n.st+'</span></div></div>'; }).join(''):'<p class="sub">완성할 수 있는 캐릭터가 아직 없다.</p>')
     +(D.length?'<h2>완성한 캐릭터 '+D.length+'</h2><p class="sub" style="white-space:normal">'+D.map(nm).join(' · ')+'</p>':'');
    w.querySelectorAll('.note')[0].insertAdjacentHTML('beforebegin','<h2>재림</h2>'); dock.insertAdjacentHTML('beforebegin',h); w.querySelectorAll('.note').forEach(x=>x.style.whiteSpace='pre-line'); };
  document.addEventListener('click',e=>{ const t=e.target.closest('[data-dn]'); if(!t) return; const k=t.dataset.dn,n=reNeed(k); if(!canDone(k)||isDone(k)) return; if(!n.ok) return toast('조건이 모자라다'); PF.star-=n.st; PF.dup[k]=(PF.dup[k]||0)-n.nd; PF.done[k]=Date.now(); pfSave(); sfx('win'); toast(CH[k].name+' · 완성했다',3600); achCheck({}); drawSel(); if(NET.client||NET.host) NET.pick(); bagPop('re'); }); }
/* 고른 캐릭터 칸 · 캐릭터 목록에 '완성' 표시 */
{ const ds0=drawSel; drawSel=function(){ ds0(); const sp=$('slot-me')&&$('slot-me').querySelector('span'); if(sp&&!sel.meR&&isDone(sel.me)&&!/완성/.test(sp.textContent)) sp.insertAdjacentHTML('beforeend',' · <b style="color:var(--gold)">완성</b>'); }; drawSel(); }

/* ════════════════ 1.5.0 3대3 태그매치 ════════════════
   양쪽이 캐릭터 셋을 고른다(나 · 우리 팀 칸 둘 / 상대 · 상대 팀 칸 둘). 경기장에는 한 명씩만 서고, 나머지 둘은 대기한다.
   싸우는 중에도 교대할 수 있다(재사용 대기시간 45초). 들어온 캐릭터는 1초 동안 피해 · 상태이상을 받지 않고 스킬도 쓸 수 없다.
   대기하는 캐릭터는 체력 · 궁극기 조건 · 쌓은 자원을 그대로 지니고, 재사용 대기시간은 계속 돈다.
   한 명이 쓰러지면 1초 뒤 다음 캐릭터가 자동으로 들어온다. 셋이 모두 쓰러진 편이 진다. 보상은 쓰러뜨린 캐릭터 수만큼. */
const TAG={idle:0,cd:45,inv:1,next:1,pay:200};   /* idle: 교대하려면 싸우지 않고 있어야 하는 초(0 = 전투 중에도 교대) · cd: 교대 재사용 대기시간 */
let TG=null;   /* {bench:[[],[]], last:[0,0], cd:[0,0], kills:[0,0]} */
const isTag=()=>mode===7&&!practice;
const tagAll=tm=>TG?[ents.find(o=>o.team===tm&&o.tagOn)].filter(Boolean).concat(TG.bench[tm]):[];
const tagWhy=tm=>{ if(!TG) return '없음'; const L=TG.bench[tm].filter(o=>!o.dead); if(!L.length) return '대기 없음'; if(now<TG.cd[tm]) return Math.ceil(TG.cd[tm]-now)+'초'; if(TAG.idle>0){ const idle=now-TG.last[tm]; if(idle<TAG.idle) return '전투 중 '+Math.ceil(TAG.idle-idle); } return ''; };
function tagSwap(tm,nx,forced){ if(!TG||over) return false; const cur=ents.find(o=>o.team===tm&&o.tagOn); if(!nx||nx.dead) return false; if(!forced&&tagWhy(tm)) return false;
  const i=TG.bench[tm].indexOf(nx); if(i<0) return false; TG.bench[tm].splice(i,1);
  const at=cur||{x:home(tm,MAP.spawn||6).x,y:home(tm,MAP.spawn||6).y,aim:{x:0,y:tm?1:-1}}; nx.x=at.x; nx.y=at.y; nx.z=0; nx.vz=0; nx.dash=null; nx.mv={x:0,y:0}; nx.aim={x:at.aim.x,y:at.aim.y}; nx.launched=false; nx.tagOn=true; nx.busy=Math.max(nx.busy||0,now);
  nx.tagInv=now+TAG.inv; add(nx,'silence',TAG.inv,0,{self:true}); 
  if(cur){ cur.tagOn=false; const j=ents.indexOf(cur); ents[j]=nx; if(!cur.dead) TG.bench[tm].push(cur); else TG.bench[tm].push(cur); } else ents.push(nx);
  if(cur===me||(!cur&&tm===0)) me=nx; if(cur===foe||(!cur&&tm===1)) foe=nx; if(!forced) TG.cd[tm]=now+TAG.cd;
  burst(nx.x,nx.y,22,'rgb('+TC[tm]+')',6); sfx('respawn'); msg([[tm?'상대 교대 · ':'교대 · ',tm?'#ff9aa5':'#8fe9ff'],[short(nx),'#fff6d6']],tm,true); uiBegin(); tagUi(); return true; }
/* 들어온 1초 동안은 피해와 상태이상을 받지 않는다 */
{ const dm0=damage; damage=function(src,t,amt,label,o){ if(t&&t.tagInv>now&&src!==t){ if(!t._invT||now-t._invT>.4){ t._invT=now; say(t,'교대 무적','#cfd6ff'); } return false; } return dm0(src,t,amt,label,o); };
  const ef0=effects; effects=function(e,t,o){ if(t&&t.tagInv>now) return; return ef0(e,t,o); };
  const kn0=knock; knock=function(t,from,d){ if(t&&t.tagInv>now) return; return kn0(t,from,d); };
  const ai0=air; air=function(t,h){ if(t&&t.tagInv>now) return; return ai0(t,h); };
  const ad0=add; add=function(e,k,t,v,extra){ if(e&&e.tagInv>now&&!(extra&&extra.self)&&DEBUFFS.includes(k)) return; return ad0(e,k,t,v,extra); }; }
/* 판 시작: begin이 3대3으로 세운 캐릭터 가운데 한 명씩만 남기고 나머지는 대기로 뺀다 */
{ const bg0=begin; begin=function(){ if(!isTag()) { TG=null; return bg0(); } teamN=3;
    /* 내 쪽 두 칸은 가진 캐릭터로 채운다(모자라면 아무나) */ const keep=sel.al.slice(),own=k=>CH[k]&&!CH[k].re&&!CH[k].mon&&!CH[k].mob&&!CH[k].built&&!CH[k].custom&&!CH[k].kit&&CH[k].grade!=='히든'&&!locked(k),used=new Set([sel.me]);
    for(let i=0;i<2;i++){ const k=sel.al[i]; if(k&&own(k)&&!used.has(k)){ used.add(k); continue; } sel.al[i]=null; } let pool=Object.keys(CH).filter(k=>own(k)&&!used.has(k)).sort(()=>Math.random()-.5);
    for(let i=0;i<2;i++) if(!sel.al[i]){ const k=pool.pop(); if(k){ sel.al[i]=k; used.add(k); } }
    try{ bg0(); } finally { sel.al=keep; } }; }
on('begin',()=>{ if(!isTag()){ TG=null; tagUi(); return; } TG={bench:[[],[]],last:[-99,-99],cd:[0,0],kills:[0,0]};
  for(const tm of [0,1]){ const L=ents.filter(o=>o.team===tm).sort((a,b)=>(a.slot||0)-(b.slot||0)); L.forEach((o,i)=>{ if(i===0){ o.tagOn=true; return; } o.tagOn=false; TG.bench[tm].push(o); }); }
  ents=ents.filter(o=>o.tagOn); msg([['3대3 태그매치 ','#e3c377'],['언제든 교대할 수 있다 · 재사용 대기시간 '+TAG.cd+'초','#fff6d6']],0,true); tagUi(); });
/* 누가 쓰러지면: 대기가 남았으면 1초 뒤 다음 캐릭터가 들어오고, 없으면 진다 */
{ const kl0=kill; kill=function(src,t){ if(!isTag()||!TG) return kl0(src,t);
    if(src.team===t.team){ const k=ents.find(o=>o.team!==t.team&&!o.dead)||ents.find(o=>o.team!==t.team); if(k) src=k; }
    fire('kill',src,t); if(src.c.onKill&&!src.dead) src.c.onKill(src,t); score[src.team]++; TG.kills[src.team]++;
    const left=TG.bench[t.team].filter(o=>!o.dead); msg(short(src)+'(이)가 '+short(t)+'(을)를 쓰러뜨렸다 · '+(t.team?'상대':'우리')+' 남은 캐릭터 '+left.length,src.team,true);
    if(!left.length){ finish(src); return; }
    after(TAG.next,()=>{ if(over||!TG) return; const cur=ents.find(o=>o.team===t.team&&o.tagOn); if(cur&&!cur.dead) return; const nx=t.team===0?(TG.pick0&&!TG.pick0.dead&&TG.bench[0].includes(TG.pick0)?TG.pick0:TG.bench[0].filter(o=>!o.dead)[0]):TG.bench[1].filter(o=>!o.dead).sort((a,b)=>b.hp/b.max-a.hp/a.max)[0]; TG.pick0=null; if(nx) tagSwap(t.team,nx,true); }); }; }
on('hit',(s,t,amt)=>{ if(!TG||!(amt>0)||s===t) return; TG.last[s.team]=now; TG.last[t.team]=now; });
/* 대기 중인 캐릭터의 재사용 대기시간은 계속 돈다 · 컴퓨터 편은 위험하면 교대한다 */
on('step',dt=>{ if(!TG) return; for(const tm of [0,1]) for(const o of TG.bench[tm]){ if(o.dead) continue; for(const k in o.cd) if(o.cd[k]>0) o.cd[k]=Math.max(0,o.cd[k]-dt); }
  TG.aiT=(TG.aiT||0)-dt; if(TG.aiT<=0){ TG.aiT=.5; const cur=ents.find(o=>o.team===1&&o.tagOn); if(cur&&!cur.dead&&!tagWhy(1)){ const best=TG.bench[1].filter(o=>!o.dead).sort((a,b)=>b.hp/b.max-a.hp/a.max)[0]; if(best&&cur.hp/cur.max<.4&&best.hp/best.max>cur.hp/cur.max+.25) tagSwap(1,best); } }
  TG.uiT=(TG.uiT||0)-dt; if(TG.uiT<=0){ TG.uiT=.2; tagUi(); } });
on('end',()=>{ setTimeout(tagUi,0); });
/* 교대 단추: 화면 위쪽 가운데. PC는 Q · E */
function tagUi(){ let el=document.getElementById('tagbar'); if(!TG||!running&&!over){ if(el) el.hidden=true; return; } if(!el){ el=document.createElement('div'); el.id='tagbar'; document.body.appendChild(el); el.onclick=e=>{ const b=e.target.closest('[data-tg]'); if(!b||!TG) return; const o=TG.bench[0][+b.dataset.tg]; if(!o) return; if(o.dead) return; const w=tagWhy(0); if(w){ toast('지금은 교대할 수 없다 · '+w,1400); return; } tagSwap(0,o); }; }
  el.hidden=!!over; const w=tagWhy(0),pc=matchMedia('(pointer:fine)').matches;
  el.innerHTML=TG.bench[0].map((o,i)=>{ const f=Math.max(0,o.hp/o.max); return '<button type="button" data-tg="'+i+'"'+(o.dead||w?' class="off"':'')+'><b>'+(pc?(i?'E':'Q')+' · ':'')+esc(short(o))+'</b><i><u style="width:'+Math.round(f*100)+'%"></u></i><small>'+(o.dead?'쓰러짐':w||'교대')+'</small></button>'; }).join('')
   +'<span class="tgf">'+TG.bench[1].map(o=>'<em'+(o.dead?' class="off"':'')+'>'+esc(short(o))+' '+(o.dead?'✕':Math.round(o.hp/o.max*100)+'%')+'</em>').join('')+'</span>'; }
{ const st=document.createElement('style'); st.textContent='#tagbar{position:fixed;left:50%;transform:translateX(-50%);top:calc(96px + env(safe-area-inset-top));z-index:3;display:flex;gap:6px;align-items:flex-start;pointer-events:auto}#tagbar[hidden]{display:none}'
   +'#tagbar button{width:96px;border:1px solid var(--aether);border-radius:10px;background:rgba(10,14,34,.82);color:var(--ink);padding:5px 6px;font:inherit;text-align:left}#tagbar button.off{border-color:var(--line);opacity:.55}'
   +'#tagbar b{display:block;font:700 11.5px var(--body);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#tagbar i{display:block;height:4px;background:#2a3566;border-radius:2px;margin:3px 0}#tagbar u{display:block;height:100%;background:#7fe9ff;border-radius:2px}#tagbar small{font-size:10.5px;color:var(--muted)}'
   +'#tagbar .tgf{display:flex;flex-direction:column;gap:2px;margin-left:4px}#tagbar em{font-style:normal;font-size:10.5px;color:#ff9aa5;background:rgba(10,14,34,.82);border-radius:6px;padding:2px 6px;white-space:nowrap}#tagbar em.off{opacity:.45}'
   +'body.land #tagbar{top:calc(58px + env(safe-area-inset-top))}'; document.head.appendChild(st);
  document.addEventListener('keydown',e=>{ if(!TG||!running||over||paused) return; const a=document.activeElement; if(a&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA')) return; const i=e.code==='KeyQ'?0:e.code==='KeyE'?1:-1; if(i<0) return; const o=TG.bench[0][i]; if(!o||o.dead) return; const w=tagWhy(0); if(w){ toast('지금은 교대할 수 없다 · '+w,1400); return; } tagSwap(0,o); }); }
/* 고르는 화면: 태그매치는 3대3 고정, 함께 하기에서는 못 한다 */
{ let prevN=null; const mn0=modeNote; modeNote=function(){ if(mode===7&&!practice){ if(teamN!==3){ prevN=teamN; teamN=3; } } else if(prevN!=null&&teamN===3){ teamN=prevN; prevN=null; } mn0(); $('size').style.display=mode===7&&!practice?'none':'';
    if(mode===7&&!practice){ $('size').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',+x.dataset.n===3)); $('modenote').textContent='캐릭터 셋을 고른다(내 캐릭터 + 우리 팀 칸 둘). 경기장에는 한 명씩 나서고, 싸우는 중에도 대기 중인 캐릭터와 교대할 수 있다(재사용 대기시간 '+TAG.cd+'초, PC는 Q · E). 들어온 캐릭터는 1초 동안 피해를 받지 않고 스킬도 쓸 수 없다. 대기하는 캐릭터는 체력과 궁극기 조건을 그대로 지닌다. 셋이 모두 쓰러진 편이 진다. 보상은 쓰러뜨린 캐릭터 하나에 코인 '+TAG.pay+'. 우리 팀 칸은 가진 캐릭터만 고를 수 있고, 비워 두면 가진 캐릭터 가운데 무작위.'; } };
  const sm0=setMode; setMode=function(m){ if(m===7&&(NET.host||NET.client)&&NET.players.length>1) return toast('태그매치는 아직 혼자(컴퓨터와)만 할 수 있다'); sm0(m); };
  const la0=launch; launch=function(){ if(mode===7&&!practice&&(NET.host||NET.client)&&NET.players.length>1) return toast('태그매치는 아직 혼자(컴퓨터와)만 할 수 있다'); return la0(); };
  modeNote(); }
/* 보상: 쓰러뜨린 캐릭터 수만큼 */
{ const en1=earn; earn=function(win){ const g=en1(win); if(!(mode===7&&!practice&&TG)||TW&&TW.on||SPM) return g; PF.coin-=g.c; PF.star-=g.st; const m=DIFFPAY[diff]==null?1:DIFFPAY[diff],k=TG.kills[0]; g.c=Math.round(k*TAG.pay*m); g.st=k>=3?1:0; PF.coin+=g.c; PF.star+=g.st; g.note='캐릭터 '+k+'명 쓰러뜨림'; return g; }; }

/* ════════════════ 1.5.1 함께 하기 손질 ════════════════ */
/* 그만두기: 방장이 그만두면 마지막 상태와 '메뉴 닫힘'을 보낸다. 손님이 그만두면 조작을 멈추고 방장에게 알려 컴퓨터가 이어 받는다 */
function netQuit(){ try{ if(NET.host&&NET.live){ snap(); NET.live=false; sendAll({t:'pz',who:'host',host:true,name:NET.name(),on:false}); }
    if(NET.client&&NET.tx){ NET.tx.send({t:'in',mv:[0,0],hb:false,aim:0}); NET.tx.send({t:'pz',on:false}); NET.tx.send({t:'quit'}); NET.playing=false; } }catch(x){} }
{ const hm3=hostMsg; hostMsg=function(pid,d){ const p=NET.players.find(x=>x.pid===pid); if(p) p.seen=performance.now();
    if(d&&NET.host&&d.t==='in'){ const e=ents.find(o=>o.net&&o.net.pid===pid); if(e) e.net.tt=performance.now(); }
    if(d&&NET.host&&d.t==='quit'){ const e=ents.find(o=>o.net&&o.net.pid===pid); if(e&&p&&NET.live){ e.net=null; e.left=p.name; e.pname=null; toast((p.name||'손님')+' 그만뒀다 · 컴퓨터가 대신 움직인다',2600); } return; }
    /* 같은 이름으로 다시 들어왔는데 예전 연결이 아직 안 닫혔으면(2초 넘게 소식 없음) 예전 것을 먼저 내보내 자리를 넘긴다 */
    if(d&&NET.host&&d.t==='hello'&&NET.live&&!p){ const nm=String(d.name||'손님').slice(0,8),old=NET.players.find(x=>!x.host&&x.pid!==pid&&x.name===nm&&performance.now()-(x.seen||0)>2000); if(old) hostGone(old.pid); }
    return hm3(pid,d); };
  /* 손님 조작이 0.6초 넘게 안 오면(탭을 내렸거나 끊김) 멈춰 세운다 */
  on('step',()=>{ if(!NET.host) return; const t=performance.now(); for(const e of ents) if(e.net&&e.net.tt&&t-e.net.tt>600){ e.net.mv={x:0,y:0}; e.net.held={}; } });
  document.addEventListener('visibilitychange',()=>{ if(document.hidden&&NET.client&&NET.tx&&NET.playing){ try{ NET.tx.send({t:'in',mv:[0,0],hb:false,aim:0}); }catch(x){} } });
  /* 손님의 코인 배수는 방장의 컴퓨터 실력을 따른다 */
  const en2=earn; earn=function(win){ if(!NET.client||typeof NET.hdiff!=='number') return en2(win); const d0=diff; diff=NET.hdiff; try{ return en2(win); } finally { diff=d0; } };
  /* 함께 레이드 · 함께 등반으로 모두 같은 편이 된 뒤, 다른 방식으로 싸우면 예전 편으로 되돌린다 */
  document.addEventListener('click',e=>{ if(!NET.host||!e.target.closest('#n-qraid,#n-qtower')) return; NET.players.forEach(p=>{ if(p.prevTeam==null) p.prevTeam=p.team; }); },true);
  const la1=launch; launch=function(){ if(NET.host&&mode!==6&&!(TW&&TW.on)&&NET.players.some(p=>p.prevTeam!=null)){ NET.players.forEach(p=>{ if(p.prevTeam!=null){ p.team=p.prevTeam; p.prevTeam=null; } }); lobbyOut(); } return la1(); };
  /* 손님 쪽 설정(방식 · 인원)은 방을 나가면 원래대로 */
  const cs0=clientStart; clientStart=function(d){ if(!NET.gkeep) NET.gkeep={mode,teamN,practice}; return cs0(d); };
  const nl0=netLeave; netLeave=function(q){ const k=NET.gkeep; NET.gkeep=null; nl0(q); if(k){ practice=k.practice; mode=k.mode; teamN=k.teamN; try{ modeNote(); drawSel(); }catch(x){} } }; }

/* 다시 잇는 동안에는 빌린 캐릭터와 고른 캐릭터를 그대로 둔다 */
{ const cl0=clientLost; clientLost=function(why,canRetry){ NET.relink=!!(canRetry&&(NET.retry||0)<2&&NET.code); return cl0(why,canRetry); };
  const cm1=clientMsg; clientMsg=function(d){ if(d&&(d.t==='lobby'||d.t==='start')) NET.relink=false; return cm1(d); };
  const jf0=joinFlow; joinFlow=async function(code,again,tries){ try{ return await jf0(code,again,tries); } finally { if(!NET.client) NET.relink=false; } }; }

/* ════════════════ 1.5.1 화면 배치: 겹침 막기 ════════════════
   싸우는 중: 체력 줄 바로 아래 가운데에 [메뉴 알림 → 데스카운트 → 교대 단추 → 알림(토스트)] 차례로 쌓고, 왼쪽 기록 줄은 그 아래에서 시작한다.
   고르는 화면 · 창: 알림은 그 화면의 아래 단추(싸우기 · 닫기) 바로 위에 뜬다. */
let HUDY=0,HUDLIM=0;
function layoutTop(){ const tst=$('toast'),onT=tst.classList.contains('on'),game=$('sel').hidden&&running||$('sel').hidden&&!!over&&$('res').hidden;
  const vis=el=>{ if(!el||el.hidden) return false; const s=getComputedStyle(el); return s.display!=='none'&&s.visibility!=='hidden'&&el.offsetHeight>0; };
  if(game&&!vis($('pause'))){ const hr=$('hud').getBoundingClientRect(); let y=Math.max(hr.bottom,0)+6; const cvr=cv.getBoundingClientRect();
    for(const el of [document.getElementById('pzs'),document.getElementById('dcb'),document.getElementById('tagbar')]){ if(!el) continue; if(el.id==='pzs'&&!el.children.length) continue; if(!vis(el)) continue; el.style.top=y+'px'; y+=el.offsetHeight+5; }
    tst.classList.add('ingame'); tst.style.top=y+'px'; tst.style.bottom='auto'; if(onT) y+=tst.offsetHeight+5;
    HUDY=y>hr.bottom+8?(y-cvr.top)/cell+.55:0;
    /* 기록 줄이 내려갈 수 있는 끝: 가로 화면은 왼쪽 아래 이동 스틱 위까지, 세로 화면은 아래 점수 줄 위까지 */ let lim=VH-2.1; for(const el of [$('stick'),$('btns')]){ const r=el.getBoundingClientRect(); if(r.width&&r.left<innerWidth*.4&&r.top>cvr.top&&r.top<cvr.bottom) lim=Math.min(lim,(r.top-cvr.top)/cell-.35); } HUDLIM=lim; return; }
  HUDY=0; tst.style.top='auto';
  /* 맨 위에 떠 있는 창을 찾아 그 아래 단추 줄 위에 띄운다 */
  const L=['#title','#patchv','#keysv','#achv','#bagv','#info','#tower','#res','#pause','#sel'].map(q=>document.querySelector(q)).filter(vis); const top=L[0]; let bot=16;
  if(top){ const docks=[...top.querySelectorAll('.dock')].filter(d=>vis(d)&&d.getBoundingClientRect().top<innerHeight&&d.getBoundingClientRect().bottom>0); const d=docks[docks.length-1];
    const dr=d&&d.getBoundingClientRect(); if(d&&dr.top>innerHeight*.5&&(dr.bottom>=innerHeight-24||top.id==='sel')) bot=innerHeight-dr.top+8; else if(top.id==='sel'){ const nv=$('nav').getBoundingClientRect(); if(!document.body.classList.contains('land')&&nv.top>innerHeight/2) bot=innerHeight-nv.top+8; } }
  tst.classList.remove('ingame'); tst.style.bottom=bot>16?Math.round(bot)+'px':'calc(16px + env(safe-area-inset-bottom))'; }
setInterval(layoutTop,150); addEventListener('resize',layoutTop);
{ const t0=toast; toast=function(t,ms){ t0(t,ms); layoutTop(); }; }

/* 옛 휴대폰(iOS 15 · 옛 크롬)에는 둥근 사각형 그리기(roundRect)가 없다. 없으면 직접 만든다 */
if(typeof CanvasRenderingContext2D!=='undefined'&&!CanvasRenderingContext2D.prototype.roundRect){ CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h,r){ r=Math.max(0,Math.min(typeof r==='number'?r:(Array.isArray(r)?r[0]||0:0),Math.abs(w)/2,Math.abs(h)/2)); this.moveTo(x+r,y); this.lineTo(x+w-r,y); this.quadraticCurveTo(x+w,y,x+w,y+r); this.lineTo(x+w,y+h-r); this.quadraticCurveTo(x+w,y+h,x+w-r,y+h); this.lineTo(x+r,y+h); this.quadraticCurveTo(x,y+h,x,y+h-r); this.lineTo(x,y+r); this.quadraticCurveTo(x,y,x+r,y); this.closePath(); return this; }; }

/* 함께 하기: 자리가 모자라 캐릭터를 못 받은 손님은 그 판을 관전한다(조작 단추를 숨기고, 코인 · 전적 · 경험치는 세지 않는다) */
{ const st=document.createElement('style'); st.textContent='body.spect #btns,body.spect #stick,body.spect #tagbar{visibility:hidden}'; document.head.appendChild(st);
  const cs1=clientStart; clientStart=function(d){ const r=cs1(d); NET.spect=!d.you; document.body.classList.toggle('spect',NET.spect); if(NET.spect) setTimeout(()=>toast('자리가 모자라 이번 판은 관전한다',3200),300); return r; };
  const nl1=netLeave; netLeave=function(q){ NET.spect=false; document.body.classList.remove('spect'); return nl1(q); };
  const sr9=showResult; showResult=function(){ if(NET.client&&NET.spect&&over){ over.paid=over.cnt=over.xp=true; } return sr9(); }; }

/* ════════════════ 1.5.3 버그 손질 ════════════════ */
/* 다시 서는 캐릭터(레이드 부활 · 킬 선취 · 점령전 · 연습)는 판 처음의 몸을 이어 받는다: 등반 권능 · 장비 · 완성. 판이 시작될 때(맨 마지막) 기록해 둔다 */
on('begin',()=>{ for(const e of ents) e.base0={c:e.c,max:e.max,atk:e.atk,done:!!e.done}; if(typeof TG!=='undefined'&&TG) for(const tm of [0,1]) for(const o of TG.bench[tm]) if(!o.base0) o.base0={c:o.c,max:o.max,atk:o.atk,done:!!o.done}; });
function onRespawn(n,t){ const b=t.base0; if(!b) return; n.base0=b; n.c=b.c; n.max=n.hp=b.max; n.atk=b.atk; if(b.done) n.done=true;
  if(TW&&TW.on&&n.team===0&&(t===me||n.net)){ const ids=twIds(); n.r=n.r||{}; n.r._w={}; for(const id of ids){ const P=n.r._w[id]={cdT:0}; if(POWERS[id]&&POWERS[id].init) POWERS[id].init(P); } try{ kitInit(n,ids); }catch(x){} } }
/* 6. 등반 · 이야기 · 오늘의 도전 중에 설정을 바꿔도, 저장에는 빌려 온 캐릭터 · 방식이 아니라 원래 설정이 남는다 */
{ const sv0=save; save=function(){ if(!KEEP) return sv0(); const k=KEEP,cur={practice,mode,teamN,diff,me:sel.me,meR:sel.meR,foe:sel.foe,foeR:sel.foeR,al:sel.al,fo:sel.fo,mon:OPT.mon,monhp:OPT.monhp,raid:OPT.raid,myth:OPT.myth,map:OPT.map};
    const put=x=>{ practice=x.practice; mode=x.mode; teamN=x.teamN; diff=x.diff; sel.me=x.me; sel.meR=x.meR; sel.foe=x.foe; sel.foeR=x.foeR; sel.al=x.al; sel.fo=x.fo; OPT.mon=x.mon; OPT.monhp=x.monhp; OPT.raid=x.raid; OPT.myth=x.myth; OPT.map=x.map; };
    put(k); try{ return sv0(); } finally { put(cur); try{ drawSum(); }catch(x){} } }; }
/* 1 · 10. 태그매치: 대기 중인 캐릭터는 맞지도 않고, 남은 스킬 · 장판 · 투사체로 싸우지도 않는다 */
{ const live=()=>typeof TG!=='undefined'&&!!TG,off=e=>!!e&&e.tagOn===false;
  const dm1=damage; damage=function(src,t,amt,label,o){ if(live()&&(off(t)||off(src))) return false; return dm1(src,t,amt,label,o); };
  const ef1=effects; effects=function(e,t,o){ if(live()&&(off(t)||off(e))) return; return ef1(e,t,o); };
  const kn1=knock; knock=function(t,from,d){ if(live()&&off(t)) return; return kn1(t,from,d); };
  const ai1=air; air=function(t,h){ if(live()&&off(t)) return; return ai1(t,h); };
  const hl1=heal; heal=function(e,amt,quiet){ if(live()&&off(e)) return 0; return hl1(e,amt,quiet); };
  const ad1=add; add=function(e,k,t,v,extra){ if(live()&&(off(e)||extra&&off(extra.by))) return; return ad1(e,k,t,v,extra); };
  /* 물러나는 캐릭터의 장판 · 투사체는 걷어 낸다 */
  const ts0=tagSwap; tagSwap=function(tm,nx,forced){ const cur=ents.find(o=>o.team===tm&&o.tagOn); const r=ts0(tm,nx,forced); if(r&&cur){ zones=zones.filter(z=>z.owner!==cur); projs=projs.filter(p=>p.owner!==cur); } return r; };
  /* 쓰러진 사람 말고 살아 있는 캐릭터가 하나라도 있으면 지지 않는다 */
  const kl1=kill; kill=function(src,t){ if(!(mode===7&&!practice)||!live()) return kl1(src,t); if(off(t)){ t.dead=true; return; }
    if(src.team===t.team){ const k=ents.find(o=>o.team!==t.team&&!o.dead)||ents.find(o=>o.team!==t.team); if(k) src=k; }
    const left=TG.bench[t.team].filter(o=>!o.dead&&o!==t); if(left.length) return kl1(src,t);
    fire('kill',src,t); if(src.c.onKill&&!src.dead) src.c.onKill(src,t); score[src.team]++; TG.kills[src.team]++; msg(short(src)+'(이)가 '+short(t)+'(을)를 쓰러뜨렸다 · '+(t.team?'상대':'우리')+' 남은 캐릭터 0',src.team,true); finish(src); };
  /* 12. 내 캐릭터가 쓰러진 1초 사이에 고르면 '다음에 나설 캐릭터'로만 정한다(교대 대기시간을 쓰지 않는다) */
  const pick=i=>{ if(!live()||!running||over||paused) return; const o=TG.bench[0][i]; if(!o||o.dead) return; const cur=ents.find(x=>x.team===0&&x.tagOn); if(cur&&cur.dead){ TG.pick0=o; toast('다음에 나설 캐릭터 · '+short(o),1400); tagUi(); return; } const w=tagWhy(0); if(w){ toast('지금은 교대할 수 없다 · '+w,1400); return; } tagSwap(0,o); };
  document.addEventListener('click',e=>{ const b=e.target.closest('#tagbar [data-tg]'); if(!b) return; e.stopImmediatePropagation(); pick(+b.dataset.tg); },true);
  document.addEventListener('keydown',e=>{ if(!live()||!running||over||paused) return; const a=document.activeElement; if(a&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA')) return; const i=e.code==='KeyQ'?0:e.code==='KeyE'?1:-1; if(i<0) return; e.stopImmediatePropagation(); pick(i); },true); }

/* ════════════════ 1.5.3 화면 · 조작 손질 (휴대폰 · 태블릿 · PC) ════════════════ */
{ const st=document.createElement('style'); st.textContent=[
  /* 싸우는 중 알림은 한 줄로 짧게 */
  '#toast.ingame{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:min(86vw,520px);padding:6px 12px;font-size:12.5px}',
  /* 교대 단추: 낮은 칩 모양(32px 안팎) */
  '#tagbar button{width:auto;min-width:92px;max-width:132px;padding:4px 8px 5px}#tagbar b{display:flex;gap:6px;align-items:baseline;justify-content:space-between}#tagbar b small{font-weight:600}#tagbar i{margin:3px 0 0}',
  '#tagbar .tgf{flex-direction:row;flex-wrap:wrap;max-width:120px}#tagbar em{font-size:10px;padding:1px 5px}',
  /* 왼손 배치: 단추 묶음도 거울처럼(기본 공격이 바깥쪽) */
  'body.lefty #btns{direction:rtl}body.lefty #btns>*{direction:ltr}',
  /* 세로 화면: 스틱 칸이 화면 폭의 30%를 넘지 않게, 조작 크기를 키우면 함께 커지게 */
  'body:not(.land):not(.pc) #pad{grid-template-columns:clamp(92px,calc(128px*var(--ui)),30vw) 1fr}body.lefty:not(.land):not(.pc) #pad{grid-template-columns:1fr clamp(92px,calc(128px*var(--ui)),30vw)}',
  /* 노치 · 홈 막대(안전 영역) */
  '#hud{padding-top:calc(7px + env(safe-area-inset-top))}body.land #hud{padding-top:calc(5px + env(safe-area-inset-top))}',
  '#menu{top:calc(8px + env(safe-area-inset-top));width:44px;height:44px;font-size:17px;right:max(8px,calc((100vw - 520px)/2 + 8px))}body.pc #menu{right:max(8px,calc((100vw - 1180px)/2 + 8px))}body.land #menu{top:calc(5px + env(safe-area-inset-top));margin-left:-22px;right:auto}',
  'body:not(.land):not(.pc) #pad{padding-bottom:calc(10px + env(safe-area-inset-bottom));height:calc(196px*var(--ui) + env(safe-area-inset-bottom))}body.xs:not(.land):not(.pc) #pad{height:calc(268px*var(--ui) + env(safe-area-inset-bottom))}',
  '.overlay .wrap{padding-top:calc(16px + env(safe-area-inset-top))}.overlay .dock{padding-bottom:calc(12px + env(safe-area-inset-bottom))}.shell{padding-top:env(safe-area-inset-top)}',
  /* 가로 화면의 창: 아래 단추들을 한 줄로 나란히(세로로 쌓이면 화면 절반을 덮는다) */
  'body.land .overlay .dock{display:flex;flex-wrap:wrap;gap:8px;align-items:stretch}body.land .overlay .dock>button{flex:1 1 150px;width:auto;margin:0;min-height:44px}body.land .overlay .dock>.go{flex:2 1 220px}',
  /* 좁은 세로 화면의 캐릭터 고르기: 찾기 줄을 한 줄로 */
  '@media (max-width:420px){.crow{flex-wrap:nowrap;gap:6px}.crow #q{flex:1 1 0;min-width:0}.crow button{flex:none;max-width:28vw;padding:0 8px;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}}',
  /* 좁은 화면의 뽑기 결과: 네 칸씩 */
  '@media (max-width:400px){.gst{grid-template-columns:repeat(4,1fr)}}.gst .gc .ft em{word-break:keep-all}',
  /* 만들기 창의 이름 칸이 납작해지지 않게 */
  '#build input[type="text"],#build input:not([type]){min-height:40px}',
  /* 창 제목이 늦게 뜨던 것을 빠르게 */
  '@media (prefers-reduced-motion:no-preference){.overlay .brand h1{animation-duration:.45s}}'
 ].join(''); document.head.appendChild(st); }
/* 교대 단추 모양: 이름과 상태를 한 줄에 */
{ const tu0=tagUi; tagUi=function(){ tu0(); const el=document.getElementById('tagbar'); if(!el||el.hidden||!TG) return; el.querySelectorAll('button[data-tg]').forEach(b=>{ const sm=b.querySelector('small'),bb=b.querySelector('b'); if(sm&&bb&&sm.parentNode!==bb) bb.appendChild(sm); }); }; }
/* 스킬 단추 글자가 단추에 다 들어가게: 넘치면 글자를 줄이고, 그래도 넘치면 두 줄로 */
function fitSk(){ document.querySelectorAll('#btns .sk .nm').forEach(el=>{ el.style.fontSize=''; el.style.whiteSpace=''; el.style.display=''; if(!el.clientWidth) return; let fs=parseFloat(getComputedStyle(el).fontSize),i=0; const over=()=>el.scrollWidth>el.clientWidth+1||el.scrollHeight>el.clientHeight+2;
    while(over()&&i<7){ fs*=.92; el.style.fontSize=fs.toFixed(1)+'px'; i++; } if(over()&&el.classList.contains('l1')){ el.style.whiteSpace='normal'; el.style.display='-webkit-box'; } });
  document.querySelectorAll('#btns .sk .need').forEach(el=>{ el.style.fontSize=''; if(!el.clientWidth) return; let fs=parseFloat(getComputedStyle(el).fontSize),i=0; while(el.scrollWidth>el.clientWidth+1&&i<4){ fs*=.9; el.style.fontSize=fs.toFixed(1)+'px'; i++; } }); }
{ const ub0=uiBegin; uiBegin=function(){ const r=ub0(); requestAnimationFrame(fitSk); return r; }; addEventListener('resize',()=>requestAnimationFrame(fitSk)); try{ document.fonts&&document.fonts.addEventListener('loadingdone',()=>fitSk()); }catch(x){}
  /* 자판으로 싸우는 PC에서 Tab이 숨은 스킬 단추를 돌지 않게 */
  document.querySelectorAll('#btns .sk').forEach(b=>b.setAttribute('tabindex','-1')); }
/* PC: Esc = 뒤로(창 닫기 · 멈춤 풀기 · 멈추기). 맨 위에 뜬 창부터 닫는다 */
{ const bs3=backStep; backStep=function(){ if(!$('info').hidden&&!['keysv','patchv','achv','bagv','title'].some(id=>document.getElementById(id))){ $('info').hidden=true; return true; } return bs3(); };
  addEventListener('keydown',e=>{ if(e.key!=='Escape'||e.repeat) return; const a=document.activeElement; if(a&&/INPUT|TEXTAREA|SELECT/.test(a.tagName)) return; if(backStep()){ e.preventDefault(); e.stopImmediatePropagation(); } },true); }
/* 소리 · 음악 끄기는 다음에 켤 때도 그대로 */
{ try{ const v=JSON.parse(localStorage.getItem('aetherSound')||'{}'); if(v.m){ muted=true; $('p-mute').textContent='소리 켜기'; } if(v.b){ bgmOff=true; $('bgmb').textContent='음악 켜기'; } }catch(x){}
  const keep=()=>{ try{ localStorage.setItem('aetherSound',JSON.stringify({m:muted?1:0,b:bgmOff?1:0})); }catch(x){} }; $('p-mute').addEventListener('click',()=>setTimeout(keep,0)); $('bgmb').addEventListener('click',()=>setTimeout(keep,0)); }
/* 결과 화면 '캐릭터 바꾸기'는 캐릭터 탭으로 */
{ const bk1=$('back').onclick; $('back').onclick=function(ev){ const m=showResult.last; const r=bk1.call(this,ev); if(!m&&!NET.client&&!(TW)&&$('tower').hidden) goPage('chars'); return r; }; }
/* 레이드 결과 화면의 상대 칸은 보스로(가장 가까운 잡몹이 아니라) */
{ const fn0=finish; finish=function(w){ if(!over&&mode===6&&!practice){ const bz=ents.find(o=>o.c&&o.c.mon); if(bz) foe=bz; } return fn0(w); }; }
/* 뽑기 연출: 카드 쪽을 누르면 한 번에 모두 뒤집고, 한 번 더 누르면 결과로 */
{ const gs1=gachaShow; gachaShow=function(res,done){ const r=gs1(res,done); const g0=$('tw-body').querySelector('.gst'); if(g0) g0.addEventListener('click',()=>{ const cs=[...g0.querySelectorAll('.gc')]; if(cs.some(c=>!c.classList.contains('on'))) cs.forEach(c=>c.classList.add('on')); else { const b=$('ga-skip'); if(b) b.click(); } }); return r; }; }
