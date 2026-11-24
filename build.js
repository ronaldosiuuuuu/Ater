"use strict";
/* 조합 캐릭터: 스킬 네 칸(직접 만들기 · 기존 스킬 가져오기) + 권능 3칸 + 특전 2칸.
   권능·특전은 2026년 카드 가운데 시험장에서 통하는 것만 골라 카드 수치 그대로 넣었다(코인·별무리·계통 보정처럼 여기 없는 체계에 기대는 것은 뺐다).
   권능을 더하려면 POWERS에 한 덩이: text = 카드 문장, 그리고 끼어들 자리(modTake · modDeal · modHeal · speed · onStatus · onDeal · onHurt · onKill · onFatal · basic · onCast · tick · init · active).
   끼어드는 함수는 마지막 인자로 그 권능의 기억(P)을 받는다. P.cdT = 다시 쓸 수 있는 시각. */
const POWERS={
 geumgang:{name:'금강지체',tier:'4',text:'받는 모든 피해량이 8% 감소한다.',modTake:(e,src,amt)=>amt*.92},
 junjok:{name:'준족지체',tier:'4',text:'최종 이동속도가 12% 증가한다.',speed:()=>1.12},
 paewang:{name:'패왕의 그릇',tier:'5',cd:120,text:'주는 모든 피해량이 10% 증가한다.\n권능/무기 스킬 시전 후 기본 공격시 해당 적을 1 초간 기절시킨다.',modDeal:(e,t,amt)=>amt*1.1,onCast(e,s,P){ if(s!=='crouch') P.arm=true; },basic(e,t,P){ if(P.arm&&P.cdT<=now){ P.arm=false; P.cdT=now+120; add(t,'stun',1,0,{by:e}); proc(e,'패왕의 그릇','기절 1초'); } }},
 younghon:{name:'영혼의 그릇',tier:'5',cd:180,text:'죽음에 이르는 피해를 받았을 시 해당 피해를 1 회에 한해 무효화한다.',modTake(e,src,amt,l,o,P){ P.h0=e.hp; return amt; },onFatal(e,src,P){ if(P.cdT>now) return false; P.cdT=now+180; e.hp=Math.max(1,P.h0||1); proc(e,'영혼의 그릇','죽음에 이르는 피해 무효'); return true; }},
 gunju:{name:'군주의 그릇',tier:'5',cd:150,text:'영구적으로 모든 상태이상의 지속시간이 10% 감소한다.\n5 단계 이하의 권능/무기를 통한 고위 상태이상 피격시 해당 효과를 즉시 해제한다.',onStatus(e,k,t,P){ if(['stun','silence','root'].includes(k)&&P.cdT<=now){ P.cdT=now+150; proc(e,'군주의 그릇',(SNAME[k]||k)+' 해제'); return 0; } return t*.9; }},
 hero:{name:'(僞)영웅의 기상',tier:'5',cd:300,text:'피격시 1 초간 \'무적\' 상태에 돌입한다.\n적 타격/피격시마다 해당 권능의 재사용 대기시간이 1 초 감소한다.',onHurt(e,src,amt,l,o,P){ if(src===e) return; if(P.cdT<=now){ P.cdT=now+300; add(e,'invuln',1); proc(e,'(僞)영웅의 기상','무적 1초'); } else P.cdT-=1; },onDeal(e,t,amt,l,o,P){ if(!(o&&o.amp)) P.cdT-=1; }},
 sinsal:{name:'(僞)신살의 편린',tier:'5-',text:'적 타격시마다 1 \'고정 피해\' 를 준다.',onDeal(e,t,amt,l,o){ if(!(o&&o.amp)&&!t.dead) damage(e,t,1,'(僞)신살의 편린',{fixed:true,amp:true}); }},
 dream:{name:'작은 꿈결',tier:'2',text:'적 타격 시 3% 확률로 대상을 0.8 초간 실명시킨다.\n자신에게 시전되는 \'일반\' 등급 스킬의 피해를 5% 확률로 회피한다.\n회피 성공 시, 가장 짧은 재사용 대기시간을 가진 스킬의 쿨타임이 1 초 감소한다.',onDeal(e,t,amt,l,o){ if(!(o&&o.amp)&&!t.dead&&Math.random()<.03) add(t,'blind',.8,0,{by:e}); },modTake(e,src,amt,l,o){ if(src!==e&&o&&o.skill&&Math.random()<.05){ say(e,'회피','#ffe9a0'); const k=Object.keys(e.cd).filter(x=>x!=='b'&&e.cd[x]>0).sort((a,b)=>e.cd[a]-e.cd[b])[0]; if(k) e.cd[k]=Math.max(0,e.cd[k]-1); return 0; } return amt; }},
 oath:{name:'부서진 맹약',tier:'2',text:'매 초마다 체력이 2 감소한다.\n모든 상태이상의 지속시간이 15% 증가한다.\n적 처치(사망) 시 체력을 8 만큼 회복한다.\n체력이 20% 이하일 때, 받는 모든 피해량이 5% 감소한다.',tick(e,dt,P){ P.a=(P.a||0)+dt; if(P.a>=1){ P.a-=1; if(e.hp>1) e.hp=Math.max(1,e.hp-2); } },onStatus:(e,k,t)=>t*1.15,onKill(e){ heal(e,8); },modTake:(e,src,amt)=>e.hp<=e.max*.2?amt*.95:amt},
 combo:{name:'연격성',tier:'5',text:'기본 공격 시 \'콤보\' 를 1 쌓는다. (최대 47)\n축적된 \'콤보\' 5 당 기본 공격에 1 의 추가 피해를 입힌다. (최대 9)\n\'콤보\' 가 16 이상일 시 기본 공격이 적을 아주 짧게 밀쳐낸다.\n\'콤보\' 가 24 이상일 시 이동속도가 10% 증가한다.\n전투 시작 후, 15 초 경과 시 \'콤보\' 를 모두 소모하며 모든 스킬의 재사용 대기시간이 5 초 감소한다.',init(P){ P.n=0; P.t=0; },basic(e,t,P){ P.n=Math.min(47,P.n+1); const b=Math.min(9,Math.floor(P.n/5)); if(b>0) damage(e,t,b,'연격성',{amp:true}); if(P.n>=16&&!t.dead) knock(t,e,.3); },speed:(e,P)=>P.n>=24?1.1:1,tick(e,dt,P){ P.t+=dt; if(P.t>=15){ P.t=0; P.n=0; for(const k in e.cd) if(k!=='b') e.cd[k]=Math.max(0,e.cd[k]-5); proc(e,'연격성','대기시간 -5초'); } },hud:P=>'콤보 '+P.n},
 body:{name:'천상의 몸',tier:'5',text:'신체에 영향을 주는 일부 상태이상의 지속시간이 20% 감소한다.\n#지속시간 감소의 경우 자신이 받는 실명, 둔화, 기절, 쇠약 효과에 대해 적용한다.',onStatus:(e,k,t)=>['blind','slow','stun','weak'].includes(k)?t*.8:t},
 sinche:{name:'신체 강화',tier:'3 / 8',cd:60,text:'3 초간 이동속도 및 주는 피해량이 12% 증가한다.\n효과 지속중 최대 체력이 25% 감소하며, 효과 종료시 감소량만큼 체력을 회복한다.',active(e,P){ const cut=Math.round(e.max*.25); P.on=now+3; e.max-=cut; e.hp=Math.min(e.hp,e.max); proc(e,'신체 강화','3초'); after(3,()=>{ if(e.dead) return; e.max+=cut; heal(e,cut); }); },speed:(e,P)=>P.on>now?1.12:1,modDeal:(e,t,amt,l,o,P)=>P.on>now?amt*1.12:amt},
 igye:{name:'이계의 축복',tier:'5',cd:666,text:'체력이 50% 이하일 때 피격시 원형 범위 10 칸 이내의 적을 밀어내며 6 초간 \'저주\' 한다.\n\'저주\' : 효과 지속중 모든 회복 효과를 무효로 하며 회복량만큼의 피해를 준다.',onHurt(e,src,amt,l,o,P){ if(src===e||e.hp>e.max*.5||P.cdT>now) return; P.cdT=now+666; SNAME.curse='저주'; fx.push({k:'circle',x:e.x,y:e.y,r:10,t0:now,team:e.team,lab:'이계의 축복',src:e,v:'nova',el:'curse'}); foes(e).forEach(t=>{ if(dist(e,t)<=10+R){ knock(t,e,3); add(t,'curse',6,0,{by:e}); } }); proc(e,'이계의 축복','저주 6초'); }},
 serpent:{name:'뱀주인자리의 불사',tier:'6+',text:'매 초마다 체력을 2 회복하며 영구적으로 받는 회복 효과가 25% 증가한다.\n적 타격시마다 3 초간 적이 받는 모든 피해를 2% 증가시킨다. (최대 10%)',tick(e,dt,P){ P.a=(P.a||0)+dt; if(P.a>=1){ P.a-=1; heal(e,2,true); } },modHeal:(e,amt)=>amt*1.25,onDeal(e,t,amt,l,o){ if((o&&o.amp)||t.dead) return; const s=t.st.find(q=>q.k==='vuln'&&q.oph===e); if(s){ s.v=Math.min(.1,s.v+.02); s.until=now+3; } else add(t,'vuln',3,.02,{by:e,oph:e,end:()=>{}}); }},
 conquest:{name:'정복',tier:'7',text:'적 타격시마다 \'패도\' 를 1 쌓는다. (최대 10)\n\'패도\' 가 최대치에 달할 시, 5 초간 \'정복\' 상태에 진입한다.\n\'패도\' : 주는 모든 피해 및 이동 속도가 1% 증가한다. (최대 10%)\n\'정복\' : 적 타격시마다 2 추가 피해를 주고 자신의 체력을 2 회복한다.',init(P){ P.n=0; P.cq=0; },onDeal(e,t,amt,l,o,P){ if(o&&o.amp) return; if(P.cq>now){ if(!t.dead) damage(e,t,2,'정복',{amp:true}); heal(e,2,true); } else if(++P.n>=10){ P.n=10; P.cq=now+5; proc(e,'정복','5초'); } },tick(e,dt,P){ if(P.cq&&P.cq<=now){ P.cq=0; P.n=0; } },modDeal:(e,t,amt,l,o,P)=>amt*(1+P.n*.01),speed:(e,P)=>1+P.n*.01,hud:P=>P.cq>now?'정복':'패도 '+P.n}
};
/* 특전: 능력치를 올리거나(hp·atk), 권능을 칸 밖에서 하나 더 준다(grant = 정해진 권능, pick = 그 가운데 고름) */
const PERKS={
 limit:{name:'한계 해방',text:'영구적으로 최대 체력 100 증가.',hp:100},
 club:{name:'이방인과 몽둥이',text:"'몽둥이' / 무기 피해량 +10",atk:10},
 elixir:{name:'엘릭시르 바나힐',text:"'5개의 권능(체질)' 중 하나를 선택하여 얻는다. (시험장: 금강지체 · 준족지체)",pick:['geumgang','junjok']},
 rebirth:{name:'환골탈태',text:"'10개의 권능(체질+그릇)' 중 하나를 습득한다. (시험장: 금강지체 · 준족지체 · 패왕 · 영혼 · 군주의 그릇)",pick:['geumgang','junjok','paewang','younghon','gunju']},
 heroism:{name:'만들어진 영웅주의',text:"권능 '(僞)영웅의 기상' 을 습득한다.",grant:'hero'},
 blessing:{name:'이계의 축복',text:"권능 '이계의 축복' 을 습득한다.",grant:'igye'},
 tome:{name:'낡은 비전서',text:"권능 '신체강화' 를 습득하고, 즉시 해당 권능을 3단계까지 강화한다.",grant:'sinche'}
};
/* ───── 수치 묶음(mods)으로 만드는 권능·장비 ─────
   카드에 있는 권능은 위 POWERS에 손으로 옮겼다. 아래는 시험장에서 만든 것들로, 효과를 수치 묶음 하나로 적으면 설명 글과 동작이 함께 나온다.
   hp · atk 능력치 / deal 주는 피해% / basicP 기본 공격 피해% / skill 스킬 피해% / take 받는 피해 감소% / speed 이동속도% / heal 받는 회복% / regen 초당 회복
   leech 준 피해의 %만큼 회복 / thorns 맞을 때 되돌리는 고정 피해 / crit [확률,배수] 기본 공격 치명 / fixed 타격마다 고정 피해 / onhit [상태,확률,초,값]
   ten 상태이상 지속 감소% / cdr 재사용 대기시간이 %만큼 빨리 돈다 / barrier 시작 보호막 / exec 체력 30% 아래 적에게 피해% / first 체력 90% 위 적에게 피해%
   brave 내 체력 35% 아래일 때 주는 피해% / guard 내 체력 35% 아래일 때 받는 피해 감소% / killheal 처치 시 회복 / dodge 피해를 피할 확률% */
const MODTXT={hp:v=>'최대 체력 +'+v,atk:v=>'기본 공격 +'+v,deal:v=>'주는 모든 피해 '+v+'% 증가',basicP:v=>'기본 공격 피해 '+v+'% 증가',skill:v=>'스킬 피해 '+v+'% 증가',take:v=>'받는 모든 피해 '+v+'% 감소',speed:v=>'이동속도 '+v+'% 증가',heal:v=>'받는 회복 효과 '+v+'% 증가',regen:v=>'매 초 체력 '+v+' 회복',
 leech:v=>'준 피해의 '+v+'%만큼 체력 회복',thorns:v=>'피격 시 공격자에게 '+v+' 고정 피해',crit:v=>'기본 공격이 '+Math.round(v[0]*100)+'% 확률로 '+v[1]+'배 피해',fixed:v=>'적 타격 시마다 '+v+' 고정 피해',onhit:v=>'적 타격 시 '+Math.round(v[1]*100)+'% 확률로 '+v[2]+'초간 '+({blind:'실명',slow:Math.round((v[3]||0)*100)+'% 둔화',stun:'기절',weak:'쇠약',silence:'침묵',root:'속박'}[v[0]]||v[0]),
 ten:v=>'받는 상태이상 지속시간 '+v+'% 감소',cdr:v=>'모든 재사용 대기시간이 '+v+'% 빨리 돈다',barrier:v=>'전투 시작 시 보호막 '+v,exec:v=>'체력 30% 이하인 적에게 주는 피해 '+v+'% 증가',first:v=>'체력 90% 이상인 적에게 주는 피해 '+v+'% 증가',brave:v=>'내 체력이 35% 이하일 때 주는 피해 '+v+'% 증가',guard:v=>'내 체력이 35% 이하일 때 받는 피해 '+v+'% 감소',killheal:v=>'적 처치 시 체력 '+v+' 회복',dodge:v=>'받는 피해를 '+v+'% 확률로 피한다',
 killhaste:v=>'적 처치 시 '+v[1]+'초간 이동속도 '+v[0]+'% 증가',castshield:v=>'스킬 시전 시 2초간 보호막 '+v,starthaste:v=>'전투 시작 후 '+v[1]+'초간 이동속도 '+v[0]+'% 증가',lowregen:v=>'내 체력이 35% 이하일 때 매 초 체력 '+v+' 회복',basiccd:v=>'기본 공격 적중 시 스킬 재사용 대기시간 '+v+'초 감소',reflect:v=>'받은 피해의 '+v+'%를 공격자에게 고정 피해로 되돌린다',nth:v=>'기본 공격 '+v[0]+'번째마다 '+v[1]+' 추가 피해',laststand:v=>'전투 중 한 번, 죽음에 이르는 피해를 받으면 체력 '+v+'(으)로 버틴다',rage:v=>'잃은 체력 10%마다 주는 피해 '+v+'% 증가',opener:v=>'전투 시작 후 5초간 주는 피해 '+v+'% 증가'};
const modText=m=>Object.keys(m).map(k=>MODTXT[k](m[k])+'.').join('\n');
function modHooks(m){ const H={mods:m,text:modText(m)};
  if(m.deal||m.basicP||m.skill||m.crit||m.exec||m.first||m.brave||m.rage||m.opener) H.modDeal=(e,t,a,l,o)=>{ o=o||{}; if(m.deal) a*=1+m.deal/100; if(m.rage) a*=1+m.rage/100*Math.floor((1-e.hp/e.max)*10); if(m.opener&&now<=5) a*=1+m.opener/100; if(o.basic&&m.basicP) a*=1+m.basicP/100; if(!o.basic&&!o.amp&&m.skill) a*=1+m.skill/100; if(m.exec&&t.hp<=t.max*.3) a*=1+m.exec/100; if(m.first&&t.hp>=t.max*.9) a*=1+m.first/100; if(m.brave&&e.hp<=e.max*.35) a*=1+m.brave/100; if(o.basic&&m.crit&&Math.random()<m.crit[0]){ a*=m.crit[1]; say(e,'치명','#ffd36b'); } return a; };
  if(m.take||m.guard||m.dodge) H.modTake=(e,src,a)=>{ if(src===e) return a; if(m.dodge&&Math.random()<m.dodge/100){ say(e,'회피','#ffe9a0'); return 0; } if(m.take) a*=1-m.take/100; if(m.guard&&e.hp<=e.max*.35) a*=1-m.guard/100; return a; };
  if(m.speed||m.killhaste||m.starthaste) H.speed=(e,P)=>(1+(m.speed||0)/100)*(m.killhaste&&P&&P.kh>now?1+m.killhaste[0]/100:1)*(m.starthaste&&now<=m.starthaste[1]?1+m.starthaste[0]/100:1); if(m.heal) H.modHeal=(e,a)=>a*(1+m.heal/100); if(m.ten) H.onStatus=(e,k,t)=>t*(1-m.ten/100); if(m.killheal||m.killhaste) H.onKill=(e,t,P)=>{ if(m.killheal) heal(e,m.killheal); if(m.killhaste&&P) P.kh=now+m.killhaste[1]; };
  if(m.castshield) H.onCast=(e,sl)=>{ if(sl!=='crouch'&&sl!=='b') shield(e,m.castshield,2); };
  if(m.basiccd||m.nth) H.basic=(e,t,P)=>{ if(m.basiccd) for(const k in e.cd) if(k!=='b'&&e.cd[k]>0) e.cd[k]=Math.max(0,e.cd[k]-m.basiccd); if(m.nth){ P.nn=(P.nn||0)+1; if(P.nn>=m.nth[0]){ P.nn=0; damage(e,t,m.nth[1],'추가 피해',{amp:true}); } } };
  if(m.laststand) H.onFatal=(e,src,P)=>{ if(P.ls) return false; P.ls=1; e.hp=m.laststand; proc(e,'버티기','체력 '+m.laststand); return true; };
  if(m.regen||m.cdr||m.barrier||m.lowregen) H.tick=(e,dt,P)=>{ if(m.lowregen&&e.hp<=e.max*.35){ P.lr=(P.lr||0)+dt; if(P.lr>=1){ P.lr-=1; heal(e,m.lowregen,true); } } if(m.barrier&&!P.b){ P.b=1; shield(e,m.barrier,600); } if(m.cdr) for(const k in e.cd) if(k!=='b'&&e.cd[k]>0) e.cd[k]=Math.max(0,e.cd[k]-dt*m.cdr/100); if(m.regen){ P.a=(P.a||0)+dt; if(P.a>=1){ P.a-=1; heal(e,m.regen,true); } } };
  if(m.leech||m.fixed||m.onhit) H.onDeal=(e,t,a,l,o)=>{ if(o&&o.amp) return; if(m.leech&&a>0) heal(e,a*m.leech/100,true); if(t.dead) return; if(m.fixed) damage(e,t,m.fixed,'고정 피해',{fixed:true,amp:true}); if(m.onhit&&Math.random()<m.onhit[1]) add(t,m.onhit[0],m.onhit[2],m.onhit[3]||0,{by:e}); };
  if(m.thorns||m.reflect) H.onHurt=(e,src,a,l,o)=>{ if(src&&src!==e&&!src.dead&&!(o&&o.amp)){ if(m.thorns) damage(e,src,m.thorns,'가시',{fixed:true,amp:true}); if(m.reflect&&a>0&&!src.dead) damage(e,src,Math.max(1,a*m.reflect/100),'되돌림',{fixed:true,amp:true}); } };
  return H; }
/* 카드 권능의 단계(카드의 < n >) */
{ const LV={dream:2,oath:2,sinche:3,geumgang:4,junjok:4,paewang:5,younghon:5,gunju:5,hero:5,sinsal:5,combo:5,body:5,igye:5,serpent:6,conquest:7}; for(const k in LV){ POWERS[k].lv=LV[k]; POWERS[k].src='카드'; } }
/* 시험장에서 만든 권능: [이름, 단계, 수치 묶음] */
[['잔걸음',1,{speed:4}],['굳은살',1,{take:3}],['야무진 손',1,{atk:2}],['든든한 밥심',1,{hp:30}],['숨 고르기',1,{regen:1}],['잽',1,{basicP:5}],
 ['날랜 발',2,{speed:6}],['두꺼운 가죽',2,{take:5}],['피 냄새',2,{leech:3}],['가시 돋친 몸',2,{thorns:1}],['집념',2,{ten:10}],['매서운 눈',2,{crit:[.1,1.5]}],['마른 장작',2,{hp:50}],
 ['무거운 주먹',3,{basicP:12}],['맑은 정신',3,{cdr:6}],['굶주림',3,{killheal:20}],['선제',3,{first:15}],['버티기',3,{guard:15}],['흙먼지',3,{onhit:['blind',.05,.8]}],['손에 익은 기술',3,{skill:6}],
 ['강건',4,{hp:90}],['예기',4,{atk:5}],['흡혈',4,{leech:6}],['재생',4,{regen:3}],['결정타',4,{exec:15}],['서리 손',4,{onhit:['slow',.15,1.5,.2]}],['요령',4,{dodge:5}],['얇은 장막',4,{barrier:40}],
 ['투지',5,{brave:20}],['철벽',5,{take:10}],['바람길',5,{speed:9,cdr:4}],['숙련',5,{skill:10}],['맹독 손',5,{fixed:2}],['쇄도',5,{cdr:10}],['전투 감각',5,{crit:[.15,1.6]}],['힘줄',5,{onhit:['weak',.1,2]}],
 ['거인의 심장',6,{hp:160,regen:2}],['파쇄',6,{deal:12}],['꺾이지 않음',6,{ten:25,guard:15}],['가시 갑주',6,{thorns:3,take:5}],['마비 손',6,{onhit:['stun',.04,.6]}],['깊은 숨',6,{heal:30,regen:2}],
 ['피의 갈증',7,{leech:10,brave:15}],['신속',7,{speed:15,cdr:8}],['학살',7,{exec:30}],['수호',7,{barrier:80,take:8}],['명경',7,{skill:16,cdr:6}],
 ['단단한 육신',8,{hp:250,take:10}],['멸격',8,{deal:18,crit:[.15,1.75]}],['시간 가르기',8,{cdr:20}],['그림자 걸음',8,{dodge:12,speed:10}],
 ['첫걸음',1,{starthaste:[15,5]}],['마른 수건',1,{lowregen:2}],['빈틈 찌르기',1,{opener:6}],['손버릇',2,{nth:[4,6]}],['튕겨내기',2,{reflect:4}],['몸풀기',2,{starthaste:[25,6]}],['숨 돌리기',2,{castshield:6}],
 ['기세',3,{killhaste:[20,4]}],['연타',3,{basiccd:.15}],['오기',3,{rage:1.5}],['선수',3,{opener:12}],['끈질김',3,{lowregen:5}],['덧대기',3,{castshield:12}],
 ['세 번째 일격',4,{nth:[3,12]}],['맞받아치기',4,{reflect:8}],['독기',4,{rage:2.5}],['마지막 한 걸음',4,{laststand:30}],['사냥 본능',4,{killhaste:[30,5],killheal:15}],['빠른 손',4,{basiccd:.25}],
 ['거울 가죽',5,{reflect:12,take:4}],['기선 제압',5,{opener:20,starthaste:[20,5]}],['주문 갑옷',5,{castshield:20}],['울분',5,{rage:3.5}],['끝없는 연타',5,{basiccd:.3,basicP:8}],['칠전팔기',5,{laststand:80,lowregen:4}],
 ['폭풍 전야',6,{opener:30,cdr:8}],['피 끓음',6,{rage:4,leech:4}],['무거운 넷째',6,{nth:[4,35]}],['철의 장막',6,{castshield:30,take:6}],['추격자',6,{killhaste:[40,6],exec:15}],
 ['되갚음',7,{reflect:18,thorns:3}],['광전사',7,{rage:5,speed:8}],['불사조',7,{laststand:200}],['폭주',7,{basiccd:.4,speed:10}],
 ['분노의 화신',8,{rage:6,deal:8}],['거울 성벽',8,{reflect:25,take:10}],['번개 손',8,{basiccd:.5,basicP:15}],
 ['전장의 지배자',9,{opener:40,deal:15,killhaste:[50,6]}],['두 번째 삶',9,{laststand:400,lowregen:10,guard:20}],
 ['일당백',9,{deal:20,speed:10,take:10}],['마르지 않는 샘',9,{regen:6,hp:200,heal:30}],['끝장',9,{exec:40,first:25,fixed:3}]
].forEach((x,i,A)=>{ /* 번호는 한 번 정하면 바꾸지 않는다(저장해 둔 조합·등반이 가리킨다). 처음 51개와 맨 끝 셋은 옛 번호, 나머지는 이름으로 */ const id=i<51?'m'+i:i>=A.length-3?'m'+(51+i-(A.length-3)):'m:'+x[0]; POWERS[id]=Object.assign(modHooks(x[2]),{name:x[0],lv:x[1],tier:String(x[1]),src:'시험장'}); });
/* ───── 장비: 무기 · 방어구 · 장신구 한 칸씩. 등급은 공설 < 고화 < 설화 < 서사 < 전설 < 신화 ─────
   카드 무기는 '무기 피해량'만 옮겼다(카드의 무기 스킬은 아직 없다). 카드 단계 1~2 = 공설, 3 = 고화, 4 = 설화, 5 = 서사, 6~7 = 전설, 8~ = 신화로 놓았다. */
const GGR=['공설','고화','설화','서사','전설','신화'],GGC={공설:'#9aa3b5',고화:'#8fd0a0',설화:'#7ec8ff',서사:'#b48cff',전설:'#ffb86b',신화:'#ff7d8c'},GSLOT={w:'무기',a:'방어구',t:'장신구'};
const GEAR={};
{ const add=(slot,g,name,mods,src,note)=>{ const id='g'+Object.keys(GEAR).length; GEAR[id]={id,slot,grade:GGR[g],gi:g,name,mods,src:src||'시험장',note}; POWERS['@'+id]=Object.assign(modHooks(mods),{name,gear:true,lv:0,tier:GGR[g]}); };
  /* 카드 무기: [이름, 카드 단계, 무기 피해량] */
  [['가죽 권갑',1,3],['몽둥이',1,10],['부서진 흉악의 잔재',1,12],['무거운 녹슨 철판',2,14],['레바테인',3,13],['정원의 마른 가지',3,11],['심해를 꿰맨 척추',3,12],['귀퉁이 상실',3,14],['신수 곤봉',4,16],['패왕의 검창',4,16],['흑색의 장검',4,14],['힘을 잃은 레비아탄',4,20],
   ['결의의 세검',5,15],['광랑풍혈천하도',5,16],['파율의 권갑',5,12],['비밀',5,16],['프리드웬',5,12],['선택받지 못한 자의 창',5,16],['대검 : 화혼제',6,10],['과타노차의 염영검(炎影劍)',6,24],['여섯 세계의 자리',8,28],['헛된 것들의 장례',8,32]
  ].forEach(x=>add('w',x[1]<=2?0:x[1]===3?1:x[1]===4?2:x[1]===5?3:x[1]<=7?4:5,x[0],{atk:x[2]},'카드','카드 단계 '+x[1]+' · 무기 피해량 +'+x[2]));
  /* 시험장 장비: 종류마다 여섯 등급. 수치는 등급 순서대로 */
  const S=(slot,names,fn)=>names.forEach((n,g)=>add(slot,g,n,fn(g)));
  S('w',['낡은 철검','병사의 장검','은빛 장검','기사의 명검','명장의 대검','새벽을 가르는 검'],g=>({atk:[4,7,10,13,18,26][g]}));
  S('w',['이 빠진 단검','사냥꾼의 단도','달빛 비수','자객의 송곳니','그림자 송곳','밤을 꿰는 바늘'],g=>({atk:[2,4,6,8,11,16][g],crit:[[.08,.1,.12,.15,.18,.22][g],[1.5,1.5,1.6,1.7,1.8,2][g]]}));
  S('w',['녹슨 낫','도살자의 칼','붉은 톱날','피 마시는 창','갈증의 마창','마르지 않는 핏빛'],g=>({atk:[2,4,6,8,11,16][g],leech:[2,3,5,7,9,12][g]}));
  S('w',['나무 곤봉','싸움꾼의 권갑','바람 가르는 쌍검','질풍의 세검','번개 깃든 창','천둥을 쥔 손'],g=>({atk:[2,4,6,8,11,16][g],cdr:[3,5,7,10,13,18][g]}));
  S('w',['견습생의 지팡이','떡갈나무 지팡이','푸른 수정 지팡이','현자의 지팡이','별을 읽는 지팡이','하늘을 받친 기둥'],g=>({atk:[1,2,3,4,6,8][g],skill:[4,7,10,14,18,25][g]}));
  S('w',['돌도끼','벌목꾼의 도끼','전투 도끼','처형인의 도끼','거인의 도끼','산을 쪼갠 날'],g=>({atk:[3,5,8,10,14,20][g],exec:[6,10,14,18,24,32][g]}));
  S('a',['해진 누비옷','가죽 갑옷','사슬 갑옷','강철 판금','용비늘 갑옷','산을 두른 갑주'],g=>({hp:[30,60,100,150,210,300][g]}));
  S('a',['나무 방패','철테 방패','은빛 흉갑','수호자의 방패','성벽의 대방패','무너지지 않는 벽'],g=>({hp:[15,30,50,75,105,150][g],take:[3,5,7,9,12,16][g]}));
  S('a',['가시 덩굴 조끼','못 박힌 갑옷','칼날 갑옷','고슴도치 판금','앙갚음의 갑주','천 개의 가시'],g=>({hp:[15,30,50,75,105,150][g],thorns:[1,1,2,3,4,6][g]}));
  S('a',['약초 주머니 옷','순례자의 겉옷','샘물 깃든 로브','치유사의 예복','생명의 나무껍질','꺼지지 않는 숨결'],g=>({hp:[15,30,50,75,105,150][g],regen:[1,1,2,3,4,6][g]}));
  S('a',['얇은 망토','나그네의 망토','안개 망토','그림자 망토','밤의 장막','아무도 보지 못한 옷'],g=>({hp:[10,20,35,50,70,100][g],dodge:[3,4,6,8,10,14][g]}));
  S('a',['금 간 투구','가죽 투구','철 투구','기사의 투구','사자 갈기 투구','꺾인 적 없는 투구'],g=>({hp:[15,30,50,75,105,150][g],barrier:[15,25,40,60,85,120][g]}));
  S('t',['닳은 가죽 장화','여행자의 장화','바람 깃털','준마의 편자','질풍의 발찌','바람보다 빠른 것'],g=>({speed:[3,5,7,9,12,16][g]}));
  S('t',['구리 반지','맹세의 반지','굳은 의지의 목걸이','불굴의 문장','금빛 인장','꺾이지 않는 마음'],g=>({ten:[6,10,14,18,24,32][g],guard:[5,8,11,14,18,25][g]}));
  S('t',['금 간 수정','견습 마법사의 구슬','푸른 마력석','현자의 돋보기','별빛 담은 구슬','끝없는 샘의 조각'],g=>({skill:[3,5,7,10,13,18][g],cdr:[2,4,6,8,10,14][g]}));
  S('t',['짐승 이빨 목걸이','사냥꾼의 부적','매의 눈','추적자의 나침반','처형인의 두건','마지막을 보는 눈'],g=>({first:[5,8,11,14,18,25][g],killheal:[10,15,25,35,50,80][g]}));
  S('t',['붉은 실 팔찌','싸움꾼의 붕대','투사의 띠','피 묻은 훈장','불타는 심장','꺼지지 않는 불씨'],g=>({brave:[8,12,16,20,26,35][g],leech:[1,2,3,4,5,7][g]}));
  S('t',['흙 묻은 부적','서리 조각','얼음 눈물','겨울의 숨','만년설의 핵','녹지 않는 겨울'],g=>({onhit:['slow',[.08,.1,.12,.15,.18,.22][g],1.5,[.15,.15,.2,.2,.25,.3][g]]}));
  S('t',['독 묻은 바늘','전갈 꼬리','독사의 이빨','검은 독주머니','맹독의 심장','스며드는 죽음'],g=>({fixed:[1,1,2,2,3,4][g]}));
  S('w',['부러진 창','보병의 창','미늘창','근위대의 창','용 잡는 창','하늘을 꿴 창'],g=>({atk:[3,5,8,10,14,20][g],first:[6,10,14,18,24,32][g]}));
  S('w',['쇠사슬 추','가시 철퇴','전투 망치','분쇄자의 망치','지진의 망치','땅을 깨운 망치'],g=>({atk:[3,5,8,10,14,20][g],nth:[4,[6,10,15,22,30,45][g]]}));
  S('w',['새총','사냥 활','합성궁','명사수의 활','바람을 쏘는 활','별을 떨어뜨린 활'],g=>({atk:[2,4,6,8,11,16][g],opener:[8,12,16,20,26,35][g]}));
  S('a',['거울 조각 옷','반사 흉갑','은거울 갑옷','되비추는 판금','수정 갑주','만 개의 거울'],g=>({hp:[15,30,50,75,105,150][g],reflect:[3,5,7,10,13,18][g]}));
  S('a',['낡은 수도복','수련자의 도복','명상가의 법의','대주교의 제의','하늘빛 법의','닳지 않는 기도'],g=>({hp:[15,30,50,75,105,150][g],castshield:[5,8,12,18,24,35][g]}));
  S('a',['닳은 붕대','전사의 복대','노병의 흉터 갑옷','불굴의 갑주','죽음을 넘긴 갑옷','끝내 서 있는 자'],g=>({hp:[15,30,50,75,105,150][g],laststand:[15,30,50,80,120,200][g]}));
  S('t',['싸구려 술병','용기의 술잔','분노의 뿔잔','광전사의 뿔피리','전쟁의 북','꺼지지 않는 분노'],g=>({rage:[1,1.5,2,3,4,5.5][g]}));
  S('t',['낡은 모래시계','은 모래시계','째깍이는 회중시계','시계공의 걸작','멈춘 시간의 조각','거꾸로 흐르는 모래'],g=>({basiccd:[.08,.12,.16,.22,.3,.4][g]}));
  S('t',['토끼 발','네잎 풀','행운의 동전','도박사의 주사위','별똥별 조각','운명을 비튼 실'],g=>({dodge:[2,3,4,6,8,11][g],crit:[[.04,.06,.08,.1,.12,.16][g],1.5]}));
  /* 키트 연결: 무기 키트는 같은 이름의 장비에, 권능 키트는 고를 수 있는 권능으로. 훅(패시브)을 그대로 얹는다 */
  const adapt=(key,W)=>{ const c=CH[key]; for(const h of ['tick','modTake','modDeal','modHeal','onStatus','onDeal','onHurt','onKill','onFatal','onCast']) if(c[h]) W[h]=c[h]; if(c.speedMod) W.speed=e=>c.speedMod(e); if(c.basicBonus) W.basic=(e,t)=>c.basicBonus(e,t); if(o0(c)) W.hud=(P,e)=>c.hud(e); W.kit=key; return W; },o0=c=>c.hud&&String(c.hud)!=="()=>''";
  const seenKit=new Set();   /* 같은 이름의 무기가 두 판이면 늦게 읽힌 판(새 카드)만 쓴다 */
  for(const key of (typeof KITS!=='undefined'?KITS.slice().reverse():[])){ const c=CH[key]; if(seenKit.has(c.kind+c.kname)){ c.old=true; continue; } seenKit.add(c.kind+c.kname); const names=Object.values(c.skills).map(x=>x.name).join(' · ');
    if(c.kind==='권능'){ const lv=Math.max(1,Math.min(9,Math.round(c.tier||5))); POWERS['K'+key]=adapt(key,{name:c.kname,lv,tier:String(lv),src:'카드',text:'활성 권능 · 스킬: '+names+'\n스킬이 빈 단추(최대 넷)에 붙고 패시브가 함께 온다.'}); }
    else { let G=Object.values(GEAR).find(x=>x.name===c.kname); if(!G){ const t=c.tier,g=c.grade&&GGR.includes(c.grade)?GGR.indexOf(c.grade):t==null?2:t<=2?0:t===3?1:t===4?2:t===5?3:t<=7?4:5; add('w',g,c.kname,{atk:c.atk||0},'카드',(t==null?'카드에 단계가 없어 설화로 놓았다':'카드 단계 '+t)+' · 무기 피해량 +'+(c.atk||0)); G=Object.values(GEAR).find(x=>x.name===c.kname); }
      adapt(key,POWERS['@'+G.id]); G.kit=key; G.note=(G.note?G.note+'\n':'')+'무기 스킬: '+names; }
    POWERS['#'+key]=adapt(key,{name:c.kname,gear:true,lv:0,tier:c.kind,text:''}); }
}
/* 키트의 스킬을 빈 단추(x1~x4)에 채운다. 넷이 넘으면 남는 스킬은 빠진다(조합 캐릭터에서는 스킬 칸에 직접 가져올 수 있다) */
function kitFill(skills,ids){ const free=['x1','x2','x3','x4'].filter(x=>!skills[x]); for(const id of ids.slice().sort((a,b)=>(b[0]==='@')-(a[0]==='@'))){   /* 무기 스킬이 먼저, 권능 스킬이 그다음 */ const k=POWERS[id]&&POWERS[id].kit; if(!k||id[0]==='#') continue; for(const sl in CH[k].skills){ const sk=CH[k].skills[sl]; if(Object.values(skills).some(x=>x===sk||x.name===sk.name)) continue; const f=free.shift(); if(!f) return; skills[f]=sk; } } }
const kitInit=(e,ids)=>{ for(const id of ids){ const k=POWERS[id]&&POWERS[id].kit; if(k){ try{ CH[k].init(e); }catch(x){} } } };
const gearIds=G=>['w','a','t'].map(s=>G&&GEAR[G[s]]?'@'+G[s]:null).filter(Boolean);
const statOf=ids=>{ let hp=0,atk=0; for(const id of ids){ const m=POWERS[id]&&POWERS[id].mods; if(m){ hp+=m.hp||0; atk+=m.atk||0; } } return {hp,atk}; };
const BSLOTS=[['n1','일반 ①'],['n2','일반 ②'],['aw','각성'],['ult','궁극']];
const blank=()=>({id:'b'+Date.now().toString(36),title:'',name:'',cls:'전사',hp:500,atk:20,hue:20,slots:{},powers:['','',''],perks:[{id:''},{id:''}],gear:{w:'',a:'',t:''}});
const powersOf=B=>{ const L=B.powers.filter(x=>POWERS[x]); for(const p of B.perks){ const K=PERKS[p.id]; if(!K) continue; const g=K.grant||(K.pick&&K.pick.includes(p.pick)?p.pick:K.pick?K.pick[0]:null); if(g) L.push(g); } return [...new Set(L)]; };
/* 직접 만든 칸 → forge.js의 명세 꼴 */
function makeSpec(S,slot){ const n=k=>+S[k]||0,sp={name:S.name||'이름 없는 스킬',kind:{n1:'일반',n2:'일반',aw:'각성',ult:'궁극'}[slot],cd:slot==='ult'?0:Math.max(.3,n('cd')||8),shapes:[],fx:{},ok:[],warn:[]};
  if(S.shape&&S.shape!=='none'){ const t=S.shape==='spot'?'circle':S.shape; sp.shapes.push({t,r:n('r')||(t==='proj'?12:3),hits:Math.max(1,n('hits')||1),dmg:n('dmg'),n:1}); if(S.shape==='spot') sp.target=n('reach')||8; if(t==='proj') sp.range=n('r')||12; }
  if(S.move&&S.move!=='none') sp.move={t:S.move,d:n('md')||4}; if(n('focus')) sp.focus=n('focus');
  const v=n('ev'),d=n('ed')||2; if(S.eff==='stun') sp.fx.stun=v||1; else if(S.eff==='silence') sp.fx.silence=v||1; else if(S.eff==='root') sp.fx.root=v||1; else if(S.eff==='slow') sp.fx.slow=[Math.min(.99,(v||30)/100),d]; else if(S.eff==='air') sp.fx.air=v||2; else if(S.eff==='knock') sp.fx.knock=v||2; else if(S.eff==='pull') sp.fx.pull=v||2;
  if(n('shield')) sp.shield=[n('shield'),n('sdur')||3]; if(n('heal')) sp.heal=n('heal'); if(n('haste')) sp.haste=[n('haste')/100,n('bdur')||4]; if(n('resist')) sp.resist=[n('resist')/100,n('bdur')||4]; if(n('pay')) sp.pay=n('pay');
  sp.r=Math.max(2.5,(sp.move?sp.move.d:0)+(sp.shapes[0]?(sp.shapes[0].t==='proj'?(sp.range||12):sp.shapes[0].r):0),sp.target||0); if(!sp.shapes.length) sp.r=6; return sp; }
const specLine=sp=>{ const h=sp.shapes[0],L=[]; if(sp.pay) L.push('체력을 '+sp.pay+' 소모한다.'); if(sp.focus) L.push(sp.focus+' 초간 정신을 집중한다.'); if(sp.move) L.push(({leap:'도약',dash:'돌진',blink:'순간이동'}[sp.move.t])+' '+sp.move.d+'칸.'); if(h) L.push(({arc:'부채꼴',circle:sp.target?'지정한 자리의 원형':'원형',line:'직선',proj:'투사체'}[h.t])+' '+(h.t==='proj'?(sp.range||12):h.r)+'칸에 '+h.dmg+' 피해'+(h.hits>1?' ('+h.hits+'타)':'')+'를 준다.'); for(const k in sp.fx){ const v=sp.fx[k]; L.push(k==='slow'?v[1]+' 초간 '+Math.round(v[0]*100)+'% 둔화.':['air','knock','pull'].includes(k)?({air:'에어본',knock:'밀치기',pull:'끌어당김'}[k])+' '+v+'칸.':v+' 초간 '+(SNAME[k]||k)+'.'); } if(sp.shield) L.push(sp.shield[1]+' 초간 '+sp.shield[0]+' 보호막.'); if(sp.heal) L.push('체력을 '+sp.heal+' 회복한다.'); if(sp.haste) L.push(sp.haste[1]+' 초간 기동력 '+Math.round(sp.haste[0]*100)+'% 증가.'); if(sp.resist) L.push(sp.resist[1]+' 초간 저항 '+Math.round(sp.resist[0]*100)+'% 증가.'); return L; };
function buildChar(B){ const key='b_'+B.id,pw=powersOf(B).concat(gearIds(B.gear)),srcs=new Set(),skills={},card=[];
  let hp=+B.hp||500,atk=+B.atk||0; for(const p of B.perks){ const K=PERKS[p.id]; if(K){ hp+=K.hp||0; atk+=K.atk||0; } } { const st=statOf(pw); hp+=st.hp; atk+=st.atk; }
  card.push('[ '+(B.title||'조합')+', '+(B.name||'이름 없음')+' ]','HP : '+hp+' / ATK : '+atk,'@조합 @'+B.cls,'');
  for(const [s,lab] of BSLOTS){ const S=B.slots[s]; if(!S||!S.mode||S.mode==='none') continue;
    if(S.mode==='copy'&&CH[S.from]&&CH[S.from].skills[S.fs]){ const k0=CH[S.from].skills[S.fs],k=Object.assign({},k0),c0=k0.cast; srcs.add(S.from); k.cast=e=>{ try{ c0.call(k0,e); }catch(x){ say(e,'조건이 맞지 않는다','#f0b458'); e.cd[s]=Math.min(e.cd[s]||0,1); } }; if(S.free){ delete k.can; delete k.need; } if(s==='ult'){ k.cd=0; } else if(!(k.cd>0)||(S.fs==='ult')) k.cd=S.fs==='ult'?60:k.cd||8; skills[s]=k;
      card.push(lab+" 스킬 '"+k.name+"' ("+(s==='ult'?'X':k.cd+'s')+')','- '+CH[S.from].name.split(', ')[1]+'의 '+(BTN[S.fs]||S.fs)+' 스킬을 가져왔다.'+(S.free?' 조건 무시.':k0.need?' 조건: '+k0.need:''),''); }
    else if(S.mode==='make'){ const sp=makeSpec(S,s),need=+S.need||0; skills[s]=Object.assign({name:sp.name,cd:sp.cd,r:sp.r,cast(e){ runSpec(e,sp); }},s==='ult'&&need?{can:e=>e.r._sk>=need,need:'스킬 적중 '+need+'회'}:{});
      card.push(lab+" 스킬 '"+sp.name+"' ("+(s==='ult'?'X':sp.cd+'s')+')'); if(s==='ult'&&need) card.push('조건부 = 스킬 적중 '+need+' 회 이상일 시 시전 가능.'); specLine(sp).forEach(l=>card.push('- '+l)); card.push(''); } }
  for(const sK of srcs){ if(CH[sK].kit&&!pw.some(id=>POWERS[id].kit===sK)) pw.push('#'+sK); } kitFill(skills,pw);
  const act=pw.filter(id=>POWERS[id].active); if(act.length){ const id=act[0],W=POWERS[id]; skills.crouch={name:W.name,kind:'권능',cd:W.cd||30,ai:(e,d)=>d<=6,cast(e){ W.active(e,e.r._w[id]); }}; }
  for(const id of pw){ const W=POWERS[id]; if(id[0]==='#') continue; card.push((W.gear?GSLOT[GEAR[id.slice(1)].slot]+" '":"권능 '")+W.name+"'"+(W.cd?' ('+W.cd+'s)':'')+' < '+W.tier+' >'); W.text.split('\n').forEach(l=>card.push(l)); card.push(''); }
  for(const p of B.perks){ const K=PERKS[p.id]; if(K) card.push("특전 '"+K.name+"'",K.text,''); }
  const each=(h,fn)=>{ for(const id of pw){ const W=POWERS[id]; if(W[h]) fn(W,id); } },chain=(h,e,v,args)=>{ for(const id of pw){ const W=POWERS[id]; if(W[h]) v=W[h](...args(v),e.r._w[id]); } return v; };
  const c={name:(B.title||'조합')+', '+(B.name||'이름 없음'),cls:B.cls,grade:'조합',custom:true,built:true,key,hp,atk,range:Object.values(skills).some(k=>k.r>=7)?6:2.4,col:'hsl('+(+B.hue||0)+',82%,64%)',
    init:e=>{ const r={_sk:0,_w:{}}; for(const sK of srcs){ if(CH[sK].kit) continue; try{ const f=Object.create(e); f.r={}; CH[sK].init(f); Object.assign(r,f.r); }catch(x){} } r._sk=0; r._w={}; for(const id of pw){ const P=r._w[id]={cdT:0}; if(POWERS[id].init) POWERS[id].init(P); } e.r=r; kitInit(e,pw); },
    hud:e=>pw.map(id=>POWERS[id].hud?POWERS[id].hud(e.r._w[id],e):(POWERS[id].cd&&e.r._w[id].cdT>now?POWERS[id].name+' '+Math.ceil(e.r._w[id].cdT-now)+'s':'')).filter(Boolean).join(' · ')||'조합',
    onSkillHit(e){ e.r._sk++; },
    tick(e,dt){ each('tick',(W,id)=>W.tick(e,dt,e.r._w[id])); },
    modTake:(e,src,amt,l,o)=>chain('modTake',e,amt,v=>[e,src,v,l,o]),
    modDeal:(e,t,amt,l,o)=>chain('modDeal',e,amt,v=>[e,t,v,l,o]),
    modHeal:(e,amt)=>chain('modHeal',e,amt,v=>[e,v]),
    speedMod:e=>{ let m=1; each('speed',(W,id)=>{ m*=W.speed(e,e.r._w[id]); }); return m; },
    onStatus:(e,k,t)=>{ for(const id of pw){ const W=POWERS[id]; if(W.onStatus){ t=W.onStatus(e,k,t,e.r._w[id]); if(t<=0) return 0; } } return t; },
    onDeal(e,t,amt,l,o){ each('onDeal',(W,id)=>W.onDeal(e,t,amt,l,o,e.r._w[id])); },
    onHurt(e,src,amt,l,o){ each('onHurt',(W,id)=>W.onHurt(e,src,amt,l,o,e.r._w[id])); },
    onKill(e,t){ each('onKill',(W,id)=>W.onKill(e,t,e.r._w[id])); },
    onFatal(e,src){ for(const id of pw){ const W=POWERS[id]; if(W.onFatal&&W.onFatal(e,src,e.r._w[id])) return true; } return false; },
    basicBonus(e,t){ each('basic',(W,id)=>{ if(!t.dead) W.basic(e,t,e.r._w[id]); }); },
    onCast(e,s){ each('onCast',(W,id)=>W.onCast(e,s,e.r._w[id])); },
    skills, note:'조합 캐릭터다. '+(srcs.size?'가져온 스킬은 원래 캐릭터의 패시브가 따라오지 않아, 조건이나 강화가 원래와 다르게 움직일 수 있다. ':'')+'권능·특전은 2026년 카드의 수치 그대로다(영혼의 그릇의 보상 판정처럼 시험장에 없는 줄은 빠졌다).'};
  CH[key]=c; CARDTEXT[key]=card.join('\n'); LOOK[key]={el:'steel',w:{전사:'sword',수호자:'mace',마법사:'wand',암살자:'dagger',지원가:'ringstaff',척후병:'bow'}[B.cls]||'sword',hair:'hsl('+(+B.hue||0)+',60%,70%)',acc:pw.length?['cape']:[],cape:'hsl('+(+B.hue||0)+',50%,30%)'}; return key; }
/* ───── 화면 ───── */
{ let B=blank(); const load=()=>{ try{ return JSON.parse(localStorage.getItem('aetherBuilds')||'[]'); }catch(x){ return []; } },store=L=>{ try{ localStorage.setItem('aetherBuilds',JSON.stringify(L)); }catch(x){} };
  const opt=(v,t,cur)=>'<option value="'+v+'"'+(String(cur)===String(v)?' selected':'')+'>'+t+'</option>',inp=(path,lab,val,type,cls)=>'<label'+(cls?' class="'+cls+'"':'')+'>'+lab+'<input data-p="'+path+'" type="'+(type||'number')+'" value="'+esc(String(val===undefined||val===null?'':val))+'"'+(type==='text'?' maxlength="14"':' step="any" inputmode="decimal"')+'></label>';
  const chars=()=>['무기','권능'].map(kd=>'<optgroup label="'+kd+' 스킬">'+(typeof KITS!=='undefined'?KITS:[]).filter(k=>CH[k].kind===kd&&!CH[k].old&&Object.keys(CH[k].skills).length).map(k=>'<option value="'+k+'">'+CH[k].kname+'</option>').join('')+'</optgroup>').join('')+ORDER.map(c=>'<optgroup label="'+c+'">'+Object.values(CH).filter(x=>x.cls===c&&!x.built).sort((a,b)=>a.name.split(', ')[1].localeCompare(b.name.split(', ')[1])).map(x=>'<option value="'+x.key+'">'+x.name.split(', ')[1]+(x.re?' (재림)':'')+'</option>').join('')+'</optgroup>').join('');
  function draw(){ const b=CLASSES[B.cls]; let h='<h2>이름과 몸</h2><div class="bf">'+inp('title','칭호',B.title,'text','w2')+inp('name','이름',B.name,'text','w2')+'<label>직업<select data-p="cls">'+Object.keys(CLASSES).map(c=>opt(c,c,B.cls)).join('')+'</select></label>'+inp('hp','체력',B.hp)+inp('atk','기본 공격',B.atk)+'<label class="w2">색 <input data-p="hue" type="range" min="0" max="359" value="'+B.hue+'" style="accent-color:hsl('+B.hue+',82%,64%)"></label></div><h2>스킬</h2>';
    for(const [s,lab] of BSLOTS){ const S=B.slots[s]||(B.slots[s]={mode:'none'}); h+='<div class="bcard"><b>'+lab+'</b><div class="bf"><label class="w2">채우는 법<select data-p="slots.'+s+'.mode">'+opt('none','비움',S.mode)+opt('make','직접 만들기',S.mode)+opt('copy','기존 스킬 가져오기',S.mode)+'</select></label>';
      if(S.mode==='make'){ h+=inp('slots.'+s+'.name','스킬 이름',S.name||'','text','w2')+(s==='ult'?inp('slots.'+s+'.need','조건: 스킬 적중 N회 (0=없음)',S.need||0,'number','w2'):inp('slots.'+s+'.cd','대기시간(초)',S.cd||8))+'<label>모양<select data-p="slots.'+s+'.shape">'+[['none','없음'],['arc','부채꼴'],['circle','원형(내 둘레)'],['spot','원형(적의 자리)'],['line','직선'],['proj','투사체']].map(o=>opt(o[0],o[1],S.shape||'none')).join('')+'</select></label>'+inp('slots.'+s+'.r','범위·사거리(칸)',S.r||3)+inp('slots.'+s+'.dmg','피해',S.dmg||0)+inp('slots.'+s+'.hits','타수',S.hits||1)+(S.shape==='spot'?inp('slots.'+s+'.reach','지정 거리(칸)',S.reach||8):'')
          +'<label>이동<select data-p="slots.'+s+'.move">'+[['none','없음'],['leap','도약'],['dash','돌진'],['blink','순간이동']].map(o=>opt(o[0],o[1],S.move||'none')).join('')+'</select></label>'+(S.move&&S.move!=='none'?inp('slots.'+s+'.md','이동 거리(칸)',S.md||4):'')+inp('slots.'+s+'.focus','정신 집중(초)',S.focus||0)
          +'<label>상태이상<select data-p="slots.'+s+'.eff">'+[['none','없음'],['stun','기절(초)'],['silence','침묵(초)'],['root','속박(초)'],['slow','둔화(%)'],['air','에어본(칸)'],['knock','밀치기(칸)'],['pull','끌어당김(칸)']].map(o=>opt(o[0],o[1],S.eff||'none')).join('')+'</select></label>'+(S.eff&&S.eff!=='none'?inp('slots.'+s+'.ev','값',S.ev||1)+(S.eff==='slow'?inp('slots.'+s+'.ed','둔화 시간(초)',S.ed||2):''):'')
          +inp('slots.'+s+'.shield','보호막',S.shield||0)+inp('slots.'+s+'.heal','회복',S.heal||0)+inp('slots.'+s+'.haste','기동력 +%',S.haste||0)+inp('slots.'+s+'.resist','저항 +%',S.resist||0)+inp('slots.'+s+'.pay','체력 소모',S.pay||0); }
      else if(S.mode==='copy'){ if(!CH[S.from]) S.from='ross'; const sk=CH[S.from].skills; if(!sk[S.fs]) S.fs=Object.keys(sk)[0]; h+='<label class="w2">캐릭터<select data-p="slots.'+s+'.from">'+chars().replace('value="'+S.from+'"','value="'+S.from+'" selected')+'</select></label><label class="w2">스킬<select data-p="slots.'+s+'.fs">'+Object.keys(sk).map(k=>opt(k,(BTN[k]||k)+' · '+sk[k].name+(sk[k].need?' ('+sk[k].need+')':''),S.fs)).join('')+'</select></label><label class="w2">조건<select data-p="slots.'+s+'.free">'+opt('','원래 조건대로',S.free?'1':'')+opt('1','조건 무시',S.free?'1':'')+'</select></label>'; }
      h+='</div>'+(S.mode==='make'?'<p class="note">'+esc(specLine(makeSpec(S,s)).join(' ')||'아직 아무 효과도 없다.')+'</p>':'')+'</div>'; }
    h+='<h2>권능 (3칸)</h2>'+B.powers.map((id,i)=>'<div class="bcard"><div class="bf"><label class="w2">권능 '+(i+1)+'<select data-p="powers.'+i+'">'+opt('','없음',id)+[1,2,3,4,5,6,7,8,9].map(lv=>'<optgroup label="'+lv+'단계">'+Object.keys(POWERS).filter(k=>!POWERS[k].gear&&POWERS[k].lv===lv).map(k=>opt(k,POWERS[k].name+(POWERS[k].src==='카드'?' (카드)':''),id)).join('')+'</optgroup>').join('')+'</select></label></div>'+(POWERS[id]?'<p class="note">'+POWERS[id].lv+'단계 · '+(POWERS[id].src==='카드'?'카드':'시험장 제작')+'\n'+esc(POWERS[id].text)+(POWERS[id].cd?'\n재사용 대기시간 '+POWERS[id].cd+'초':'')+(POWERS[id].active?'\n웅크리기 칸으로 쓴다.':'')+'</p>':'')+'</div>').join('');
    B.gear=B.gear||{w:'',a:'',t:''}; h+='<h2>장비 (무기 · 방어구 · 장신구)</h2>'+['w','a','t'].map(sl=>{ const cur=GEAR[B.gear[sl]]; return '<div class="bcard"'+(cur?' style="border-left-color:'+GGC[cur.grade]+'"':'')+'><div class="bf"><label class="w2">'+GSLOT[sl]+'<select data-p="gear.'+sl+'">'+opt('','없음',B.gear[sl])+GGR.map(gr=>'<optgroup label="'+gr+'">'+Object.values(GEAR).filter(x=>x.slot===sl&&x.grade===gr).map(x=>opt(x.id,x.name+(x.src==='카드'?' (카드)':''),B.gear[sl])).join('')+'</optgroup>').join('')+'</select></label></div>'+(cur?'<p class="note">'+cur.grade+' · '+esc(POWERS['@'+cur.id].text)+(cur.note?'\n'+esc(cur.note):'')+'</p>':'')+'</div>'; }).join('');
    h+='<h2>특전 (2칸)</h2>'+B.perks.map((p,i)=>{ const K=PERKS[p.id]; return '<div class="bcard"><div class="bf"><label class="w2">특전 '+(i+1)+'<select data-p="perks.'+i+'.id">'+opt('','없음',p.id)+Object.keys(PERKS).map(k=>opt(k,PERKS[k].name,p.id)).join('')+'</select></label>'+(K&&K.pick?'<label class="w2">고를 권능<select data-p="perks.'+i+'.pick">'+K.pick.map(k=>opt(k,POWERS[k].name,p.pick||K.pick[0])).join('')+'</select></label>':'')+'</div>'+(K?'<p class="note">'+esc(K.text)+'</p>':'')+'</div>'; }).join('');
    $('bd-form').innerHTML=h; }
  const list=()=>{ const L=load(); $('bd-list').innerHTML=L.length?L.map(x=>'<div class="pl"><b>'+esc((x.title||'조합')+', '+(x.name||'이름 없음'))+'</b><span style="color:var(--muted)">'+x.cls+'</span><button type="button" data-e="'+x.id+'" style="height:34px;border:1px solid var(--line);border-radius:8px;background:var(--panel);padding:0 10px">고치기</button><button type="button" data-u="'+x.id+'" style="height:34px;border:1px solid var(--line);border-radius:8px;background:var(--panel);padding:0 10px">쓰기</button><button type="button" data-d="'+x.id+'" style="height:34px;border:1px solid var(--line);border-radius:8px;background:var(--panel);padding:0 10px">지우기</button></div>').join(''):'<p class="sub">아직 만든 것이 없다.</p>'; };
  const setp=(path,v)=>{ const a=path.split('.'); let o=B; for(let i=0;i<a.length-1;i++) o=o[a[i]]; const k=a[a.length-1]; o[k]=(k==='free')?!!v:v; };
  $('bd-form').addEventListener('change',e=>{ const el=e.target,p=el.dataset.p; if(!p) return; setp(p,el.type==='number'||el.type==='range'?+el.value:el.value); if(p==='cls'){ B.hp=CLASSES[B.cls].hp; B.atk=CLASSES[B.cls].atk; } const y=$('build').scrollTop; draw(); $('build').scrollTop=y; });
  $('buildb').onclick=()=>{ draw(); list(); $('build').hidden=false; $('build').scrollTop=0; }; $('bd-close').onclick=()=>{ $('build').hidden=true; };
  $('bd-new').onclick=()=>{ B=blank(); draw(); $('build').scrollTop=0; toast('새 조합을 시작한다'); };
  $('bd-save').onclick=()=>{ if(!B.name.trim()) return toast('이름을 적는다'); if(!BSLOTS.some(x=>B.slots[x[0]]&&B.slots[x[0]].mode&&B.slots[x[0]].mode!=='none')) return toast('스킬을 한 칸 이상 채운다'); const key=buildChar(B),L=load().filter(x=>x.id!==B.id); L.push(JSON.parse(JSON.stringify(B))); store(L); list(); sel.me=key; sel.meR=false; slot='me'; tab=B.cls; drawSel(); save(); toast(B.name+' · 시험장에 넣고 내 캐릭터로 골랐다'); };
  $('bd-list').onclick=e=>{ const ed=e.target.closest('[data-e]'),u=e.target.closest('[data-u]'),d=e.target.closest('[data-d]'),L=load(); if(ed){ const x=L.find(q=>q.id===ed.dataset.e); if(x){ B=JSON.parse(JSON.stringify(x)); draw(); $('build').scrollTop=0; } } if(u&&CH['b_'+u.dataset.u]){ sel.me='b_'+u.dataset.u; sel.meR=false; tab=CH[sel.me].cls; drawSel(); save(); toast('내 캐릭터로 골랐다'); }
    if(d){ const k='b_'+d.dataset.d; store(L.filter(q=>q.id!==d.dataset.d)); delete CH[k]; delete CARDTEXT[k]; if(sel.me===k) sel.me='ross'; if(sel.foe===k) sel.foe='ei'; for(const gk of ['al','fo']) sel[gk]=sel[gk].map(x=>x===k?null:x); list(); drawSel(); save(); } };
  for(const x of load()){ try{ buildChar(x); }catch(err){ console.error(err); } }
  if(Object.keys(CH).some(k=>CH[k].built)){ try{ const d=JSON.parse(localStorage.getItem('aetherBuildSel')||'null'); if(d){ if(CH[d.me]&&CH[d.me].built){ sel.me=d.me; sel.meR=false; } if(CH[d.foe]&&CH[d.foe].built){ sel.foe=d.foe; sel.foeR=false; } } }catch(x){} drawSel(); }
  /* 조합 캐릭터는 엔진이 켜질 때 아직 없어서 고른 것이 풀린다. 그래서 따로 적어 두었다가 위에서 되살린다 */
  const save0=save; save=function(){ save0(); try{ const b=k=>CH[k]&&CH[k].built?k:null; localStorage.setItem('aetherBuildSel',JSON.stringify({me:b(sel.me),foe:b(sel.foe)})); }catch(x){} }; }
