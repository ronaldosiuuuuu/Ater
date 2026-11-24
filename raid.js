"use strict";
/* 레이드의 보스 몬스터. 2025-08-10 대마투연무의 보스 카드 세 장을 옮겼다(스킬 수치는 카드 그대로).
   보스는 CH에 올리되 목록·무작위·대전표에는 안 나오게 숨겨 둔다(defMon). 보스를 더하려면 defMon 한 덩이와 MONCARD·LOOT에 한 줄씩.
   카드에 없어 정한 것: 몸 크기, 걸음, 밀치기_강의 칸 수, 독늪이 떨어지는 거리, 시험장 맞춤 체력, 보스가 밀리지 않고 상태이상이 절반만 가는 것. */
const RAIDT=300;
const MONS=['korhen','golem','ggolem','hydra'];
/* fit = 시험장 맞춤 체력(한 사람 몫, 인원수만큼 곱한다) · card = 카드의 체력 */
const MONHP={korhen:{fit:1000,card:1000},golem:{fit:1200,card:5000},ggolem:{fit:1600,card:100000},hydra:{fit:2400,card:200000}};
const monHp=k=>OPT.monhp==='card'?MONHP[k].card:MONHP[k].fit*Math.max(1,practice?1:teamN);
function defMon(key,o){ Object.defineProperty(CH,key,{value:Object.assign({key,mon:true,heavy:true,cls:'보스',grade:'보스',hp:1000,atk:0,range:2.6,altBasic:()=>true,init:e=>{e.r={}},hud:e=>e.busy>now?'시전 중':'',onStatus:(e,k,t)=>t*.5},o),enumerable:false,configurable:true}); }
/* 캐스팅: T초 동안 멈춰 서고 맞을 범위가 먼저 보인다. 끝나면 fn */
function monCast(e,T,r,label,fn,at){ S.focus(e,T); const p=at||e; zone(e,{x:p.x,y:p.y,r,dur:T,label:label+' '+T+'초',chase:at?null:e,speed:99}); fx.push({k:'circle',x:p.x,y:p.y,r,t0:now,dur:T,team:e.team,lab:label,src:e,fol:at?null:e}); after(T,()=>{ if(!e.dead&&!over) fn(); }); }
/* 맹독: 2초 동안 매초 잃은 체력의 1% */
function venom(e,t){ if(t.dead) return; SNAME.mvenom='맹독'; add(t,'mvenom',2,0,{by:e}); for(let i=1;i<=2;i++) after(i,()=>{ if(!t.dead&&!e.dead) damage(e,t,Math.max(1,(t.max-t.hp)*.01),'맹독',{amp:true}); }); }
defMon('golem',{name:'보스 몬스터, 마석 골렘',col:'#b48cff',rad:1,speedMod:()=>.8,
  skills:{ n1:{name:'후리기',kind:'기본 공격',cd:5,r:3,cast(e){ S.arc(e,3,50,'후리기',{knock:2,v:'punch',el:'arcane'}); }} },
  note:'체력 5,000(카드). 밀치기는 2칸으로 잡았다.'});
defMon('ggolem',{name:'보스 몬스터, 초 거대 마석 골렘',col:'#c9a0ff',rad:1.7,speedMod:()=>.7,
  skills:{
   n1:{name:'크게 후리기',kind:'기본 공격',cd:5,r:5,cast(e){ S.arc(e,5,50,'크게 후리기',{knock:4,v:'punch',el:'arcane'}); }},
   n2:{name:'마석 가시',kind:'집중 마법',cd:30,r:10,cast(e){ monCast(e,3,10,'마석 가시',()=>S.circle(e,10,150,'마석 가시',{knock:0,zfree:true,v:'quake',el:'arcane'})); }},
   aw:{name:'마석 용융',kind:'집중/지속 마법',cd:90,r:8,cast(e){ const cnt=new Map(); monCast(e,5,8,'마석 용융',()=>{ for(let i=0;i<9;i++) after(i,()=>{ if(e.dead||over) return; S.circle(e,8,30,'마석 용융',{knock:0,zfree:true,v:'nova',el:'arcane',post:t=>{ const n=(cnt.get(t)||0)+1; cnt.set(t,n); if(n%3===0) add(t,'silence',1,0,{by:e}); }}); }); }); }}
  },note:'체력 100,000(카드). 밀치기_강은 4칸으로 잡았다. 마석 용융은 캐스팅 5초 뒤 9초 동안 매초 파장이 인다.'});
defMon('hydra',{name:'레이드 보스, 여덟 머리의 뱀',col:'#8fe36b',rad:1.9,range:7,speedMod:()=>.75,
  skills:{
   n1:{name:'맹독침',kind:'기본 공격',cd:4,r:14,cast(e){ S.proj(e,e.aim,{speed:22,range:16,dmg:20,label:'맹독침',v:'stake',o:{post:t=>venom(e,t)}}); }},
   n2:{name:'꼬리 휘두르기',kind:'집중 마법',cd:20,r:9,cast(e){ monCast(e,2,9,'꼬리 휘두르기',()=>S.circle(e,9,180,'꼬리 휘두르기',{knock:5,zfree:true,v:'spin',el:'nature'})); }},
   aw:{name:'독늪의 우두머리',kind:'집중 마법',cd:60,r:16,cast(e){ S.focus(e,3); after(3,()=>{ if(e.dead||over) return; for(let i=0;i<6;i++){ const a=Math.random()*6.283,d=4+Math.random()*10; S.proj(e,{x:Math.cos(a),y:Math.sin(a)},{speed:13,range:d,grav:3,dmg:0,nohit:true,pierce:true,ghost:true,big:true,label:'독늪의 우두머리',v:'orb',onEnd:p=>{ if(e.dead||over) return; const q={x:Math.max(1,Math.min(W-1,p.x)),y:Math.max(1,Math.min(H-1,p.y))}; zone(e,{x:q.x,y:q.y,r:6,dur:5.05,every:.5,label:'독늪',tick:(z,inn)=>inn.forEach(t=>{ damage(e,t,10,'독늪'); venom(e,t); })}); }}); } }); }},
   x1:{name:'여덟 머리의 뱀',kind:'의식/집중 마법',cd:90,r:30,can:e=>foes(e).some(t=>has(t,'mvenom')),need:'맹독에 걸린 적',cast(e){ S.focus(e,1.5); after(1.5,()=>{ if(e.dead||over) return; msg([['⚠ 여덟 머리의 뱀 ','#ff7d8c'],['5초 뒤 맹독에 걸린 모두를 문다','#fff6d6']],e.team,true); e.r.bite=now+5;
        after(5,()=>{ if(e.dead||over) return; const L=foes(e).filter(t=>has(t,'mvenom')&&dist(e,t)<=30+R); L.forEach(t=>{ fx.push({k:'circle',x:t.x,y:t.y,r:1.4,t0:now,team:e.team,lab:'여덟 머리의 뱀',src:e,v:'skull'}); damage(e,t,350,'여덟 머리의 뱀'); heal(e,(e.max-e.hp)*.03); }); }); }); }}
  },note:'체력 200,000(카드). 독늪은 4~14칸 안의 무작위 자리 여섯 곳에 떨어진다. 밀치기_강은 5칸으로 잡았다. 여덟 머리의 뱀은 예고 5초가 끝나는 순간 맹독에 걸려 있는 적만 문다.'});
/* 코르헨: 2023-09-16 보스 카드. 수치가 그때 기준이라 지금 캐릭터들에게는 쉬운 보스다(카드에도 '쉬운 난이도'라고 적혀 있다) */
const khHeal=(e,t,n)=>{ if(t.dead||e.dead) return; const m=e.r.ult?2:1; heal(t,n*m); e.r.yu+=m; };
const khBleed=(e,t,d)=>{ if(t.dead) return; SNAME.hbleed='출혈'; add(t,'hbleed',d,0,{by:e}); };
defMon('korhen',{name:'상처 학살자, 코르헨',col:'#c0392b',range:2.6,
  init:e=>{e.r={yu:0,spent:0,lost:0,pT:0,ult:false}},
  onHurt(e,src,amt){ e.r.lost+=amt; while(e.r.lost>=16){ e.r.lost-=16; if(!e.r.ult&&e.r.yu>=4&&e.r.pT<=now){ e.r.yu-=3; e.r.spent+=3; e.r.pT=now+8; shield(e,8,2); proc(e,'유혈','보호막 8'); } } },
  skills:{
   n1:{name:'상처 베기',kind:'Active',cd:8,r:4,cast(e){ S.line(e,4,5,'상처 베기',{knock:0,v:'cut',post:t=>khBleed(e,t,2)}); }},
   n2:{name:'절단',kind:'Active',cd:8,r:5,cast(e){ const p0={x:e.x,y:e.y}; S.leap(e,e.aim,5,26,()=>S.seg(e,p0,{x:e.x,y:e.y},1.6,7,'절단',{knock:0,v:'cut',post:t=>{ const was=has(t,'hbleed'); khBleed(e,t,3); if(was) khHeal(e,t,1); }}),true); }},
   aw:{name:'피투성이',kind:'Active',cd:15,r:6,cast(e){ const t=foes(e).filter(x=>dist(e,x)<=6+R).sort((a,b)=>dist(e,a)-dist(e,b))[0]; if(!t){ heal(e,3*(e.r.ult?2:1)); return; } for(let i=0;i<3;i++) after(i*.15,()=>khHeal(e,t,1)); knock(t,e,-2); }},
   x1:{name:'상처 베기 (각성)',kind:'Active-Awaken',cd:30,r:3,can:e=>foes(e).some(t=>dist(e,t)<=3+R),need:'3칸 안의 적',cast(e){ const t=foes(e).filter(x=>dist(e,x)<=3+R).sort((a,b)=>dist(e,a)-dist(e,b))[0]; if(!t) return; const big=e.r.ult&&e.r.yu>=30;
      if(big){ const n=e.r.yu; S.line(e,4,n,'심장 살해검',{knock:0,v:'cut',post:x=>khBleed(e,x,9999)}); return; }
      strike(e,t,10,'상처 베기 (각성)',{root:.5,knock:0}); S.focus(e,2); add(e,'resist',2,.15,{self:true}); for(let i=0;i<4;i++) after(.5*(i+1),()=>{ if(e.dead||over) return; S.arc(e,4,2,'상처 베기 (각성)',{knock:0,v:'cut'}); if(i===3){ const n=e.r.yu; e.r.yu=0; e.r.spent+=n; if(n>0&&!t.dead){ heal(t,n*(e.r.ult?2:1)); } } }); }},
   ult:{name:'심장 살해검',kind:'Ultimate',cd:60,r:99,can:e=>e.r.spent>=20&&!e.r.ult,need:'유혈 20 이상 소모',cast(e){ e.r.ult=true; proc(e,'심장 살해검','회복량·유혈 2배'); }}
  },note:"2023년 9월 보스 카드다. 체력 1,000(카드). '체력 16 소모 시'는 잃은 체력 16마다로 읽었다. 각성 '상처 베기'의 휘두르기 8 피해는 네 번에 나눠 2씩 준다. 궁극기의 '심장 뚫기'는 각성 '상처 베기'로 보았고, 영구 출혈은 그 판이 끝날 때까지다. 피투성이로 자신을 회복하는 양은 카드에 없어 3으로 정했다. 끌어당김은 2칸."});
for(const k of MONS){ CH[k].hud=e=>(k==='korhen'?'유혈 '+e.r.yu+' · ':'')+(e.busy>now?'시전 중 · ':'')+Object.entries(CH[k].skills).filter(x=>x[0]!=='n1').map(x=>x[1].name+' '+Math.ceil(e.cd[x[0]])+'s').join(' · '); }
Object.assign(LOOK,{ korhen:{el:'blood',w:'sword',hair:'#5a1a1a',acc:['cape'],cape:'#3a0d0d'}, golem:{el:'arcane',w:'fists',hair:'#6a4fb0',acc:['horns']}, ggolem:{el:'arcane',w:'fists',hair:'#8a6fd0',acc:['horns','pauldrons']}, hydra:{el:'nature',w:'claws',hair:'#2f6a2a',acc:['horns','tail']} });
Object.assign(AURA,{ ggolem(e,by){ if(e.busy>now) emit(e,by,'arcane',.9,2.2); },
  hydra(e,by){ for(let i=0;i<8;i++){ const a=now*.7+i*.785,r=e.rad+.5+.15*Math.sin(now*3+i); g.fillStyle='#3f8a36'; g.strokeStyle='#14140f'; g.lineWidth=1.5/cell; g.beginPath(); g.arc(e.x+Math.cos(a)*r,by+Math.sin(a)*r*.7,.34,0,7); g.fill(); g.stroke(); g.fillStyle='#ffd36b'; g.beginPath(); g.arc(e.x+Math.cos(a)*(r+.12),by+Math.sin(a)*(r+.12)*.7,.08,0,7); g.fill(); }
    if(e.r.bite>now) foes(e).forEach(t=>{ if(has(t,'mvenom')) markOn(t,'#ff5a6e','물린다 '+Math.ceil(e.r.bite-now)); }); } });
Object.assign(BRAIN,{
 korhen(e,t,d){ e.ai.want=2.2; if(go(e,'ult')) return true; if(d<=3&&go(e,'x1')) return true; if(d<=5&&go(e,'n2')) return true; if(d<=4&&go(e,'n1')) return true; if(d<=6&&go(e,'aw')) return true; },
 golem(e,t,d){ e.ai.want=2.2; if(d<=3+t.rad+.6&&go(e,'n1')) return true; },
 ggolem(e,t,d){ e.ai.want=3; if(d<=8&&go(e,'aw')) return true; if(d<=9&&go(e,'n2')) return true; if(d<=5.5&&go(e,'n1')) return true; },
 hydra(e,t,d){ e.ai.want=6; if(go(e,'x1')) return true; if(go(e,'aw')) return true; if(d<=8.5&&go(e,'n2')) return true; if(d<=15&&go(e,'n1')) return true; }
});
/* 시간이 다 되면 보스가 이긴다 */
on('step',()=>{ if(mode===6&&!practice&&!over&&now>=RAIDT){ const bz=ents.find(o=>o.c.mon); if(bz){ msg('시간이 다 됐다',1,true); finish(bz); } } });
/* 카드 원문 */
Object.assign(CARDTEXT,{
 korhen:"> 코르헨, 상처 학살자\n@초보자 추천 @쉬운 난이도\n\nHP : 1000\n\n#피가 낭자한 검과 함께 시체를 짓밟고 나아가는 남자가 있다.\n#그는 그저 앞만 보고 걸어가며 막아서는 모든 것을 베어내고서.\n#이름 모를 이름만 중얼거리며 천천히 죽음에 다가간다.\n\n\" 으흐흐- 짓밟은 생명들이 내 목을 죄어오는구나. \"\n\n> '유혈' (Passive) (8s)\n- 적의 체력을 회복시킬 시 '유혈' 을 1 쌓는다.\n- 체력 16 소모 시 '유혈' 이 4 이상 있을 경우 아래 효과가 발동한다.\n- '유혈' 을 3 소모해 2 초간 보호막을 8 얻는다.\n\n> '상처 베기' (Active) (8s)\n- 톱날검을 내질러 5 피해를 주고 2 초간 '출혈' 시킨다.\n'출혈' : 체력 회복 시마다 2 피해를 받는다.\n#직선 피해_4칸 #출혈\n\n> '절단' (Active) (8s)\n- 톱날검을 들고 앞으로 돌진해 7 피해를 주고 3 초간 '출혈' 시킨다.\n- 타격한 적이 이미 '출혈' 중일 시 체력을 1 회복시킨다.\n#돌진(고정)_5칸 #경로선상피해_5칸 #조건부_회복\n\n> '피투성이' (Active) (15s)\n- 지정한 적의 체력을 1 x 3 회복시키고 약간 당긴다.\n- 만약 사거리 내에 적이 없을 시 자신의 체력을 회복한다.\n#지정형_6칸 #회복 #끌당_2칸\n\n> '상처 베기' (Active-Awaken) (30s)\n- 바라보는 적의 심장을 꿰뚫어 10 피해를 주고 0.5 초간 속박시킨다.\n- 이후 톱날검을 2 초간 마구잡이로 휘둘러 8 피해를 준다.\n- 마지막 일격은 '유혈' 을 모두 소모해 적의 체력을 1 x '소모한 유혈' 회복시킨다.\n- 톱날검을 휘두르는 도중 정신을 집중하고 저항이 15% 증가한다.\n#지정형_3칸 #속박 #부채꼴피해_4칸_4타 #회복 #정신집중 #저항\n\n>>> '심장 살해검' (Ultimate) (60s)\n조건부 = 유혈 20 이상 소모 시 시전 가능.\n- 모든 스킬의 회복량이 2 배로 증가하고 '유혈' 을 2 배로 얻는다.\n- 대신 더이상 '유혈' 의 보호막 효과가 발동하지 않는다.\n- '유혈' 이 30 이상인 상태에서 '심장 뚫기' 시전 시 아래 효과가 발동한다.\n- 붉은 검으로 적을 내려베어 '유혈' 만큼 피해를 주고 영구적으로 '출혈' 시킨다.\n#해당 스킬의 효과는 적 처치 시 초기화된다.\n#영구지속 #효과증가 #스택증가 #패시브무효 #직선 피해_4칸 #출혈",
 golem:"' 마석 골렘 '\nHP : 5,000\n\n#태초의 회랑, 잔혹한 역극 등의 멸지에 쌓여있는 마석.\n#세상에 퍼져있는 마력을 자연스레 흡수해 태어난 괴물이며 잡으면 돈이 된다.\n\n기본 공격 '후리기' (5s)\n전방으로 팔을 후려 명중한 적에게 50 피해를 주고 밀어낸다.\n#부채꼴 범위 피해_3칸_1타 #밀치기\n\n@처치 보상\n\n- 부서진 마석 파편 (100%)\n- 부서진 마석 파편 (50%)\n- 부서진 마석 파편 (25%)",
 ggolem:"' 초 거대 마석 골렘 '\n#보스 몬스터 ( 재림 소요시간 : 30분 )\nHP : 100,000\n\n#마석 골렘들은 자연계의 마력을 끊임없이 흡수하며 한 세기가 지나기 전 자괴한다.\n#허나 자괴하기 전 마석을 포식한 골렘은 몸이 용융하며 다음 존재로의 탈각을 준비한다.\n\n기본 공격 '크게 후리기' (5s)\n전방으로 팔을 후려 명중한 적에게 50 피해를 주고 크게 밀어낸다.\n#부채꼴 범위 피해_5칸_1타 #밀치기_강 #물리\n\n집중 마법 '마석 가시' (30s)\n3 초간 캐스팅을 실시한다.\n이후 사방에 마석으로 이루어진 가시를 일으켜 명중한 적에게 150 피해를 준다.\n#원형 범위 피해_10칸_1타 #물리\n\n집중/지속 마법 '마석 용융' (90s)\n5 초간 캐스팅을 실시한다.\n이후 스스로의 몸을 용융시키며 9 초간 매 초마다 마력 파장을 일으킨다.\n마력 파장에 명중한 적에게 30 피해를 주며 3 회 적중시마다 1 초간 '침묵' 시킨다.\n'침묵' : 효과 지속 중 마법의 사용이 제한된다. #캐스팅 중인 마법의 경우 취소되지 않는다.\n#원형 범위 피해_8칸_1타x9 #조건부 #CC기 #침묵\n\n@처치 보상\n\n- 부서진 마석 파편 x 20 (100%)\n- 부서진 마석 파편 x 10 (75%)\n- 부서진 마석 파편 x 5 (50%)\n\n- 엇나간 마석 형판 x 1 (75%)\n- 엇나간 마석 형판 x 1 (25%)\n\n@물욕 보상\n\n- 원초석 파편 x 1 (10%)\n- 원초석 x 1 (1%)\n\n- '마석 마법 (SR)' (0.1%)",
 hydra:"' 여덟 머리의 뱀 '\n#레이드 보스 몬스터 ( 재림 소요시간 : 4시간 )\nHP : 200,000\n\n#대기에 축적된 마나와 지성을 갖춘 생명체를 포식하며 죄악을 쌓아올린 마수.\n#그 악업의 끝이 우리의 왕에게 닿기 전에ㅡ 반드시 처리해야 할 골칫거리.\n\n기본 공격 '맹독침' (4s)\n가장 가까운 대상에게 독침을 쏘아 명중할 시 20 피해를 주고 2 초간 '맹독' 을 부여한다.\n'맹독' : 매 초마다 잃은 체력의 1% 만큼 독 속성 피해를 받는다.\n#투사체_1발_1타 #맹독 #DOT #잃체비 #독\n\n집중 마법 '꼬리 휘두르기' (20s)\n2 초간 캐스팅을 실시한다.\n이후 거대한 꼬리를 휘둘러 명중한 모든 적에게 180 피해를 주고 강하게 밀어낸다.\n#원형 범위 피해_9칸_1타 #밀치기_강 #물리\n\n집중 마법 '독늪의 우두머리' (60s)\n3 초간 캐스팅을 실시한다.\n이후 무작위하게 떨어지는 맹독을 여섯 발 쏘아 명중한 지점에 5 초간 독늪을 형성한다.\n독늪에 위치한 적에게 0.5 초마다 10 피해를 주고 2 초간 '맹독' 을 부여한다.\n'맹독' : 매 초마다 잃은 체력의 1% 만큼 독 속성 피해를 받는다.\n#중력투사체_6발 #원형 범위 피해_6칸 #맹독 #DOT #잃체비 #독\n\n의식/집중 마법 '여덟 머리의 뱀' (90s)\n'맹독' 상태인 적이 있을 시 1.5 초간 캐스팅을 실시한다.\n이후 5 초뒤 '맹독' 상태의 모든 적을 물어뜯어 350 피해를 주고 적 한 명당 잃은 체력의 3%를 회복한다.\n#원형 범위_30칸 #조건부 #지정형_1타 #잃체회\n\n@처치 보상\n\n- 엇나간 마석 형판 x 2 (100%)\n- 엇나간 마석 형판 x 1 (50%)\n- 엇나간 마석 형판 x 1 (25%)\n- 엇나간 마석 형판 x 1 (10%)\n\n- 원초석 파편 x 1 (100%)\n- 원초석 파편 x 1 (50%)\n- 원초석 파편 x 1 (10%)\n\n@물욕 보상\n\n- SR 등급 룬 조각 (10%)\n- SR 등급 유물 조각 (10%)\n\n- 원초석 x 1 (5%)\n\n- '독 마법 (SR)' (1%)"});
/* 전리품: 카드의 '@처치 보상'·'@물욕 보상' 줄을 읽어 확률대로 굴린다 */
function lootHtml(win){ if(!win) return ''; const bag={},rare=[]; let sec='';
  for(const l of (CARDTEXT[OPT.mon]||'').split('\n')){ if(/^@처치 보상/.test(l)) sec='n'; else if(/^@물욕 보상/.test(l)) sec='r'; else if(sec){ const m=l.match(/^-\s*(.+?)\s*(?:x\s*(\d+)\s*)?\(([\d.]+)%\)\s*$/); if(m&&Math.random()*100<+m[3]){ const nm=m[1].trim(),n=+m[2]||1; bag[nm]=(bag[nm]||0)+n; if(sec==='r') rare.push(nm); } } }
  const ks=Object.keys(bag); return '<h2>전리품</h2>'+(ks.length?ks.map(k=>'<div class="pl'+(rare.includes(k)?' t1':'')+'"><b>'+esc(k)+'</b><span>x '+bag[k]+'</span>'+(rare.includes(k)?'<span style="color:var(--gold)">물욕 보상</span>':'')+'</div>').join(''):'<p class="sub">아무것도 나오지 않았다.</p>')+'<p class="sub">카드의 보상 확률대로 굴린 결과다. 이 기기에 쌓이지는 않는다.</p>'; }
/* 고르는 화면의 보스 줄 */
/* 레이드 난이도: 소란 < 집결 < 결속 < 군주 < 위신. 데스카운트는 1 · 2 · 2 · 3 · 3 (편 전체가 나눠 쓴다).
   군주·위신의 보스는 docboss.js(구글 문서 '보스 문서')에 있다. 보스를 더하면 MONTIER에 한 줄 */
const RTIER=['소란','집결','결속','군주','위신'],RDC=[1,2,2,3,3],RTCOL=['#8fd0a0','#7ec8ff','#b48cff','#ffb86b','#ff7d8c'];
const MONTIER={korhen:0,s_lion:0,golem:0,s_urkan:0,b_gobking:0,s_centaur:0,
 ggolem:1,b_skull:1,b_swamp:1,s_cactus:1,s_pyrite:1,b_shadow:1,b_fgiant:1,b_paladin:1,b_storm:1,s_scorpion:1,
 hydra:2,s_behemoth:2,s_sphinx:2,b_fdragon:2,b_eye:2,s_dynamis:2,b_guardian:2};
const tierOf=k=>MONTIER[k]===undefined?1:MONTIER[k], dcOf=k=>RDC[tierOf(k)];
let raidDC=2, monTab=-1;
on('begin',()=>{ if(mode===6&&!practice){ raidDC=dcOf(OPT.mon); msg([['난이도 '+RTIER[tierOf(OPT.mon)],RTCOL[tierOf(OPT.mon)]],[' · 데스카운트 '+raidDC,'#eef1ff']],1,true); } });
function drawMon(){ if(!CH[OPT.mon]||!CH[OPT.mon].mon) OPT.mon='golem'; if(monTab<0) monTab=tierOf(OPT.mon); let tr=$('montier'); if(!tr){ tr=document.createElement('div'); tr.className='row'; tr.id='montier'; tr.style.marginTop='8px'; $('mon').parentNode.insertBefore(tr,$('mon')); tr.onclick=e=>{ const b=e.target.closest('button'); if(!b) return; if(!MONS.some(k=>tierOf(k)===+b.dataset.t)) return toast(RTIER[+b.dataset.t]+' 난이도의 보스는 아직 없다'); monTab=+b.dataset.t; const L=MONS.filter(k=>tierOf(k)===monTab); if(L.length&&tierOf(OPT.mon)!==monTab){ OPT.mon=L[0]; save(); } drawMon(); drawSel(); }; }
  tr.innerHTML=RTIER.map((n,i)=>'<button type="button" data-t="'+i+'" aria-pressed="'+(monTab===i)+'" style="min-width:56px'+(MONS.some(k=>tierOf(k)===i)?'':';opacity:.4')+'"><span style="color:'+(monTab===i?'inherit':RTCOL[i])+'">'+n+'</span><small style="display:block;font-size:10.5px;opacity:.75">'+(MONS.some(k=>tierOf(k)===i)?'데스카운트 '+RDC[i]:'준비 중')+'</small></button>').join('');
  const ML=MONS.filter(k=>tierOf(k)===monTab); if(!ML.length){ $('mon').innerHTML='<p class="sub" style="margin:6px 2px">이 난이도의 보스는 아직 없다.</p>'; $('monhp').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===OPT.monhp)); return; }
  $('mon').innerHTML=ML.map(k=>'<button type="button" data-k="'+k+'" aria-pressed="'+(OPT.mon===k)+'">'+CH[k].name.split(', ')[1]+'<small style="display:block;font-size:10.5px;opacity:.75">체력 '+monHp(k).toLocaleString()+'</small></button>').join(''); $('monhp').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===OPT.monhp)); }
$('mon').onclick=e=>{ const b=e.target.closest('button'); if(!b) return; OPT.mon=b.dataset.k; drawMon(); drawSel(); save(); };
$('monhp').onclick=e=>{ const b=e.target.closest('button'); if(!b) return; OPT.monhp=b.dataset.v; drawMon(); save(); };

/* 저장해 둔 방식이 레이드였다면, 이 파일이 다 읽힌 지금 화면을 다시 맞춘다 */
modeNote(); drawSum();

/* 데스카운트를 화면 위에 늘 보여 준다(혼자 할 때도) */
{ const el=document.createElement('div'); el.id='dcb'; el.style.cssText='position:fixed;left:50%;top:calc(58px + env(safe-area-inset-top));transform:translateX(-50%);z-index:4;pointer-events:none;padding:4px 12px;border:1px solid var(--line);border-radius:20px;background:rgba(6,9,23,.82);font:700 12.5px var(--body);color:#eef1ff;display:none;white-space:nowrap'; document.body.appendChild(el); let last='';
  setInterval(()=>{ const bz=running&&!over&&mode===6&&!practice&&ents.find(e=>e.c&&e.c.mon),t=bz?RTIER[tierOf(bz.key)]+' · 데스카운트 '+raidDC:''; if(t){ const hb=$('hud').getBoundingClientRect(); el.style.top=Math.round(hb.bottom+8)+'px'; } if(t!==last){ last=t; el.textContent=t; el.style.display=t?'block':'none'; el.style.borderColor=bz&&raidDC<=0?'var(--foe)':'var(--line)'; } },250); }
