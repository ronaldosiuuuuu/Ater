"use strict";
/* ════════════════ 2.0 등반: 시너지 · 겹침 상한 · 스킬 고르기 ════════════════
   숫자(상대 보정 · 회복 · 상인 값 · 상한)는 game/core.js의 TWB에 있다. 이 파일은 시너지와, 그 숫자를 판에 거는 일을 한다.
   · 시너지 30개(SYDEF): 소속 10 · 힘 10 · 성향 10. 캐릭터(TWSYN) · 권능 · 장비가 시너지 하나에 1점씩 준다. 점수가 단계(tiers)에 닿으면 켜진다.
     권능 · 장비의 성향 시너지는 1.9.10의 꼬리표(twTags)에서, 장비의 소속 · 힘은 GSY 표에서 온다.
   · 효과는 판이 시작될 때 등반하는 사람(나 · 함께 등반 손님)마다 한 겹(synLayer)으로 건다. 등반 밖 대전에는 아무것도 걸리지 않는다.
   · 겹침 상한(TWB.cap): 받는 피해 감소 · 회피 · 반사 · 흡혈. 반사 · 가시는 한 번 맞을 때 한 번으로 합친다. 죽음을 버티는 효과는 싸움마다 한 번.
   · 체력 비례 피해(이름에 체비)는 층이 오를수록 상대가 덜 받는다(TWB.pct). 50층부터 상대는 상태이상을 짧게 받는다(TWB.cc).
   · 스킬 고르기: 무기 · 권능 · 시너지가 주는 스킬 가운데 빈 단추에 올릴 것을 고른다(TW.sk). 손님에게는 'twsk'로 알린다.
   · 고친 것: 번개 색이 없어 그릴 때 오류가 나던 스킬, 등반에서 무기 · 권능 상태 줄이 안 보이던 것, 무기 · 권능 카드 원문 보기 */

if(typeof EL!=='undefined'&&!EL.thunder) EL.thunder=['#ffe66b','#ffffff','spark'];

/* ── 시너지 표 ── tiers: 단계 점수, tx: 단계마다 효과 글 */
const SYDEF=[
 ['제국','소속',[2,4],['최대 체력 +8% · 주는 피해 +4%','스킬 「제국의 깃발」: 6초간 깃발 둘레 4칸의 나와 아군이 받는 피해 -15% (재사용 20초)']],
 ['소모라','소속',[2,3,4],['적을 쓰러뜨릴 때마다 증표 +1','상인 값 -15%','층을 넘을 때마다 가진 증표의 10%만큼 이자(최대 +10)']],
 ['판테온','소속',[2,4],['받는 피해 -6%','스킬 「신벽」: 3초간 둘레 3칸의 나와 아군이 받는 피해 -50% (재사용 15초)']],
 ['마탑','소속',[2,4,6,8],['스킬 피해 +8%','스킬 피해 +16%','스킬 피해 +26% · 스킬 3번째마다 마력 구체(기본 공격의 150%)','스킬 피해 +40% · 마력 구체가 2번째마다']],
 ['부족','소속',[2,3],['최대 체력 +60','전투 시작 8초간 이동속도 +15% · 주는 피해 +10%']],
 ['용족','소속',[2,3,4],['내 체력 50% 이하일 때 주는 피해 +10%','체력이 처음 50% 아래로 떨어지면 「용의 각성」 8초: 받는 피해 -30%','각성 중 기본 공격이 앞 3칸에 숨결(기본 공격의 50%)']],
 ['극동','소속',[2,4],['기본 공격이 6% 확률로 1.5배','기본 공격이 15% 확률로 2배 · 치명타마다 스킬 재사용 0.3초 감소']],
 ['기사단','소속',[2,4,6,8],['받는 보호막 +20%','10초마다 보호막(최대 체력 6%)','보호막이 있는 동안 주는 피해 +15%','보호막을 얻을 때마다 둘레 3칸에 그 보호막만큼 피해']],
 ['명계','소속',[2,4],['쓰러뜨린 자리에 망령이 4초간 남아 가까운 적을 친다(초당 기본 공격의 30%)','망령 8초 · 초당 60% · 동시에 둘']],
 ['바다','소속',[2,4],['기본 공격 4번째마다 물결(적을 2칸 밀침)','물결에 기본 공격의 80% 피해 + 2초 둔화']],
 ['서리','힘',[2,4,6,8],['타격마다 냉기 1(최대 5 · 하나당 이동속도 -6%)','냉기 5면 1초 빙결','빙결된 적에게 주는 피해 +30%','빙결된 적이 쓰러지면 둘레 4칸 적에게 냉기 5']],
 ['화염','힘',[2,4,6,8],['타격마다 화상 3초(초당 기본 공격의 10%)','화상 초당 20%','화상 초당 35% · 화상 입은 적이 쓰러지면 3칸 폭발(기본 공격의 100%)','화상 초당 60% · 폭발이 화상을 다시 건다']],
 ['뇌전','힘',[2,4],['기본 공격 6번째마다 번개가 셋에게 튄다(기본 공격의 50%)','4번째마다 + 스킬 「낙뢰」: 앞 5칸 자리 3칸에 기본 공격의 200% (재사용 12초)']],
 ['질풍','힘',[2,4,6,8],['이동속도 +6%','이동속도 +12%','이동속도 +18% · 움직이는 동안 받는 피해 -10%','이동속도 +25% · 움직이는 동안 받는 피해 -20%']],
 ['성좌','힘',[3,5],['싸움마다 별자리 축복 하나(피해 · 방어 · 회복 · 속도 가운데 +10%)','축복 둘 · 효과 1.5배']],
 ['심연','힘',[2,4],['매 초 최대 체력의 0.3%를 잃는 대신 주는 피해 +12%','매 초 0.6%를 잃고 주는 피해 +25% · 준 피해의 5% 회복']],
 ['자연','힘',[2,4],['매 초 최대 체력의 0.6% 회복','스킬 「세계수 묘목」: 8초간 둘레 4칸의 나와 아군이 매 초 최대 체력의 3% 회복 (재사용 25초)']],
 ['강철','힘',[2,4,6,8],['기본 공격 피해 +10%','전투 시작 때 포탑 하나(초당 기본 공격의 20%)','포탑 둘','포탑 셋 · 내 기본 공격을 따라 쏜다']],
 ['혈','힘',[2,4],['준 피해의 3% 회복','준 피해의 7% 회복 · 넘친 회복은 다음 공격에 피해로 더한다(최대 체력의 10%까지)']],
 ['성광','힘',[2,4],['받는 회복 +20% · 받는 상태이상 지속 -20%','10초마다 가장 다친 아군의 상태이상을 풀고 최대 체력의 8% 회복']],
 ['맹공','성향',[2,4,6,8],['주는 피해 +5%','주는 피해 +10%','주는 피해 +18% · 쓰러뜨리면 4초간 「광폭」(이동속도 +20% · 피해 +10%)','주는 피해 +28% · 광폭 8초']],
 ['철벽','성향',[2,4,6,8],['받는 피해 -5%','받는 피해 -10%','받는 피해 -16% · 10초마다 첫 피격 무효','받는 피해 -24% · 6초마다 첫 피격 무효']],
 ['생명','성향',[2,4],['매 초 최대 체력의 0.5% 회복','매 초 1% 회복 · 체력이 가득 찬 뒤 회복은 보호막으로(최대 체력의 20%까지)']],
 ['연마','성향',[2,4,6,8],['재사용 대기시간 6% 빨리','12% 빨리','20% 빨리 · 스킬을 쓰면 다음 기본 공격 +50%','30% 빨리 · 다음 기본 공격 +100%']],
 ['연격','성향',[2,4,6,8],['기본 공격 4번째마다 기본 공격의 40% 추가 피해','80% 추가 피해','150% 추가 피해','3번째마다 200% 추가 피해']],
 ['사냥','성향',[2,4],['체력 30% 이하인 적에게 주는 피해 +12%','+28% · 쓰러뜨리면 잃은 체력의 8% 더 회복']],
 ['역경','성향',[2,4],['내 체력 35% 이하일 때 받는 피해 -10%','-20% · 싸움마다 한 번 체력 1로 버티고 2초 무적']],
 ['선봉','성향',[2,4],['전투 시작 6초간 주는 피해 +12%','+30% · 처음 맞힌 적을 1초 기절']],
 ['응징','성향',[2,4],['받은 피해의 5%를 되돌린다','12%를 되돌린다 · 되돌린 피해의 30%만큼 회복']],
 ['속박','성향',[2,4],['내가 거는 상태이상 지속 +20%','지속 +40% · 상태이상에 걸린 적에게 주는 피해 +15%']]
];
const SY={}; for(const [name,group,tiers,tx] of SYDEF) SY[name]={name,group,tiers,tx};
const SYN_NAMES=SYDEF.map(x=>x[0]);
const syTier=(name,n)=>{ const T=SY[name].tiers; let t=0; for(const v of T) if(n>=v) t++; return t; };
const syNext=(name,n)=>SY[name].tiers.find(v=>v>n)||0;

/* ── 캐릭터 시너지(하나마다 1점) ── 고화 1~2 · 서사 2~3 · 전설 3 · 신화 · 히든 3~4 */
const TWSYN={};
{ const T='castor:화염,맹공 castor_r:화염,맹공 ei:기사단,역경 mente:기사단,연격 guillaume:부족,역경 harmund:서리,맹공 harmund_r:서리,속박 manannan:제국,응징,연격 manannan_r:제국,응징,맹공 simon:기사단,속박,철벽 ginan:기사단,성광 ginan_r:기사단,성광 janet:제국,철벽 kerker:부족,철벽 ross:기사단,철벽 ross_r:기사단,역경 milio:기사단,선봉,철벽 plaus:자연 plaus_r:자연,생명 epoch:강철,마탑 vira:마탑,연마 margrita:화염,심연 john:소모라,질풍 kur:부족,사냥 valtma:사냥,선봉 clover:소모라,속박 cornwall:기사단,성광 eclia:성광,생명 breck:심연,속박 breck_r:심연,속박 vega:자연,성광 merilda:서리,사냥 mimosa:명계,바다 mimosa_r:명계,바다 ford:강철,선봉 tommy:소모라,연격 shale:강철,사냥 nertina:질풍,선봉,연격 nertina_r:질풍,사냥,연격 roven:자연,연격,맹공 roven_r:자연,연격,생명 baron:제국,연격,연마 baron_r:제국,연격,맹공 licros:부족,역경,맹공 euclein:바다,연격 euclein_r:바다,연격,맹공 aktion:부족,철벽,응징 hamel:심연,철벽,역경 hamel_r:심연,철벽,응징 dantalion:강철,철벽,역경 dantalion_r:강철,철벽,응징 verderin:심연,혈,철벽 gardnant:철벽,역경,생명 salomon:마탑,연마,속박 salomon_r:마탑,성좌,연마 barsa:화염,마탑,맹공 barsa_r:화염,마탑,속박 pluto:명계,심연,마탑 piana:마탑,성광 piana_r:마탑,성광,생명 bunt:소모라,마탑 bunt_r:소모라,마탑,성좌 roland:뇌전,마탑,연마 licht:제국,마탑,속박 stern:소모라,사냥,혈 stern_r:소모라,사냥,선봉 mor:심연,사냥 mor_r:심연,성좌,사냥 tyrfing:혈,심연,맹공 tyrfing_r:혈,심연,사냥 rias:혈,사냥,연격 fomal:바다,소모라,생명 fomal_r:바다,소모라,속박 sonia:마탑,성광 margaret:화염,성광,생명 nevia:질풍,성광,속박 wayne:소모라,사냥 rtien:심연,속박,생명 irenio:제국,속박,사냥 irenio_r:제국,속박,선봉 petra:강철,속박 libra:성좌,연마 rano:용족,응징,연격 rano_r:용족,응징,맹공 hwi:극동,선봉,연마 biwol:극동,연격,연마 trion:성좌,연격,맹공 ur:뇌전,선봉,사냥 ur_r:뇌전,선봉,맹공 leus:판테온,철벽,성광 leus_r:판테온,철벽,성좌 helga:부족,역경,맹공 blossom:기사단,자연,철벽 stella:성좌,성광,생명 evangeline:마탑,연마,맹공 venil:서리,화염,마탑 venil_r:서리,마탑,속박 pastern:심연,마탑,속박 rotia:자연,심연,마탑 yuri:제국,맹공,사냥 yuri_r:제국,맹공,선봉 alpi:질풍,사냥,연격 alpi_r:질풍,뇌전,사냥 ain:극동,연격,사냥 arwen:성좌,질풍,사냥 dioris:질풍,선봉,연마 largen:극동,사냥,역경 ganaan:소모라,사냥,선봉 reitia:성광,성좌,생명 reitia_r:성광,질풍,생명 notis:강철,마탑,연마 mars:부족,맹공,선봉 mars_r:판테온,맹공,선봉 melt:강철,화염,철벽 melt_r:강철,화염,역경 max:연격,맹공,연마 max_r:심연,혈,맹공 girl:심연,속박,철벽,응징 girl_r:성좌,질풍,마탑,속박 arthur:기사단,성광,선봉 arthur_r:기사단,성광,역경,화염 duke:기사단,철벽,응징 wolfen:부족,역경,연격 teor:자연,철벽,속박 albion:용족,뇌전,질풍 kivi:부족,선봉,사냥 vivi:화염,강철,연격 start:강철,철벽,응징 amon:마탑,속박,연마 alonso:기사단,선봉,질풍 rasa:부족,맹공,역경 cheongal:극동,철벽,연마 nagato:극동,사냥,질풍 igril:용족,화염,맹공';
  for(const w of T.split(' ')){ const [k,v]=w.split(':'); TWSYN[k]=v.split(',').filter(n=>SY[n]); } }
const charSyn=k=>hasK(TWSYN,k)?TWSYN[k]:[];

/* ── 장비의 소속 · 힘(장비 번호 → 시너지) ── 범위는 [첫 번호, 끝 번호, 시너지] */
const GSY={};
{ const R=[[22,27,'기사단'],[28,33,'극동'],[34,39,'혈'],[40,41,'부족'],[42,43,'질풍'],[44,45,'뇌전'],[46,49,'마탑'],[50,50,'성좌'],[51,51,'마탑'],[52,57,'부족'],[58,61,'강철'],[62,62,'용족'],[63,63,'강철'],[64,69,'판테온'],[70,70,'자연'],[71,75,'강철'],[76,79,'성광'],[80,80,'자연'],[81,81,'성광'],[84,87,'심연'],[88,93,'제국'],[94,99,'질풍'],[100,105,'제국'],[106,109,'마탑'],[110,110,'성좌'],[111,111,'마탑'],[112,115,'부족'],[116,117,'명계'],[118,118,'혈'],[119,120,'부족'],[121,121,'혈'],[122,123,'화염'],[124,124,'자연'],[125,129,'서리'],[130,134,'심연'],[135,135,'명계'],[136,139,'제국'],[140,140,'용족'],[141,141,'제국'],[142,147,'강철'],[148,151,'부족'],[152,152,'질풍'],[153,153,'성좌'],[154,159,'마탑'],[160,165,'성광'],[166,171,'기사단'],[172,177,'부족'],[178,183,'강철'],[184,187,'소모라'],[188,188,'성좌'],[189,189,'소모라'],
   [0,1,'부족'],[2,2,'심연'],[3,3,'강철'],[4,4,'화염'],[5,5,'자연'],[6,6,'바다'],[7,7,'심연'],[8,8,'부족'],[9,9,'제국'],[10,10,'심연'],[11,11,'바다'],[12,12,'기사단'],[13,14,'극동'],[15,15,'뇌전'],[16,16,'기사단'],[17,17,'심연'],[18,19,'화염'],[20,20,'성좌'],[21,21,'명계'],[190,190,'판테온'],[191,191,'기사단'],[192,192,'제국'],[193,193,'뇌전'],[194,194,'서리'],[195,195,'명계'],[196,196,'화염'],[197,197,'제국'],[198,198,'극동'],[199,199,'제국'],[200,200,'극동'],[201,202,'판테온']];
  for(const [a,b,s] of R) for(let i=a;i<=b;i++) GSY['g'+i]=s; }
/* 꼬리표 → 성향(드문 것부터). 권능 하나는 둘까지, 8단계 이상만 셋까지 센다. 장비는 소속 · 힘 하나 + 성향 하나 */
const TAG2SY=[['반격','응징'],['제어','속박'],['처치','사냥'],['마무리','사냥'],['위기','역경'],['저항','역경'],['선공','선봉'],['재사용','연마'],['속도','질풍'],['회복','생명'],['스킬','마탑'],['기본 공격','연격'],['방어','철벽'],['공격','맹공']];
const syCache=new Map();
function synOf(id){ if(typeof id!=='string'||!hasK(POWERS,id)) return []; if(syCache.has(id)) return syCache.get(id); const P=POWERS[id],L=[];
  if(Array.isArray(P.syn)) for(const n of P.syn) if(SY[n]&&!L.includes(n)) L.push(n);
  const gear=id[0]==='@'; if(gear&&hasK(GSY,id.slice(1))) L.push(GSY[id.slice(1)]);
  if(!P.syn){ const tg=twTags(id).filter(t=>t!=='스킬'||!(gear||P.kit)),cap=gear?L.length+1:((P.lv|0)>=8?3:2); for(const [t,s] of TAG2SY){ if(L.length>=cap) break; if(tg.includes(t)&&!L.includes(s)) L.push(s); } }
  syCache.set(id,L); return L; }
/* 점수: 캐릭터 + 자유 표식 + 권능 · 장비 */
function synCount(ids,key,free){ const n={}; for(const s of charSyn(key)) n[s]=(n[s]||0)+1; if(free&&SY[free]) n[free]=(n[free]||0)+1; for(const id of ids||[]) for(const s of synOf(id)) n[s]=(n[s]||0)+1;
  if(typeof prismFix==='function') prismFix(n,ids); return n; }
/* 단계. 「두 갈래 길」: 2단계 이상이 둘 이상이면 그 시너지들은 한 단계 위(가장 높은 단계까지) */
const synTiers=(n,ids)=>{ const t={}; for(const k in n){ const v=syTier(k,n[k]); if(v) t[k]=v; } if(ids&&ids.includes('n:두 갈래 길')){ const hi=Object.keys(t).filter(k=>t[k]>=2); if(hi.length>=2) for(const k of hi) t[k]=Math.min(SY[k].tiers.length,t[k]+1); } return t; };
const twFree=()=>TW&&CH[TW.key]&&CH[TW.key].grade==='고화'&&SY[TW.free]?TW.free:null;
const twCount=()=>synCount(twIds(),TW.key,twFree());

/* ── 시너지가 주는 스킬(빈 단추에 붙는다) ── 고르는 화면 · 조합 화면에 안 보이게 CH에 숨겨 둔다 */
function syKit(key,name,sk){ sk.kit=key; sk.kind='시너지'; Object.defineProperty(CH,key,{value:{key,kit:true,kname:name,name:'시너지, '+name,cls:'시너지',grade:'시너지',hp:500,atk:20,range:2.6,hud:()=>'',init(){},skills:{n1:sk}},enumerable:false,configurable:true});
  if(typeof LOOK!=='undefined'&&!LOOK[key]) LOOK[key]={el:'steel',w:'sword',hair:'#9aa3b5',acc:[]};
  CARDTEXT[key]="시너지 스킬 '"+sk.name+"' ("+sk.cd+"s)\n"+sk.txt; }
const SYSK={제국:['sy_flag',2],판테온:['sy_wall',2],뇌전:['sy_bolt',2],자연:['sy_tree',2]};   /* 시너지 → [스킬 꾸러미, 필요한 단계] */
const twMates=e=>ents.filter(o=>o.team===e.team&&!o.dead);
syKit('sy_flag','제국의 깃발',{name:'제국의 깃발',cd:20,r:6,txt:'깃발을 꽂는다. 6초간 둘레 4칸의 나와 아군이 받는 피해 15% 감소.',ai:(e,d)=>d<=6,cast(e){ zone(e,{x:e.x,y:e.y,r:4,dur:6,every:.25,good:true,label:'제국의 깃발',tick:z=>{ for(const a of twMates(e)) if(Math.hypot(a.x-z.x,a.y-z.y)<=z.r+.5){ const s=a.st.find(q=>q.k==='resist'&&q.sy==='flag'); if(s) s.until=now+.5; else add(a,'resist',.5,.15,{self:true,sy:'flag',end:()=>{}}); } }}); proc(e,'제국의 깃발','6초'); }});
syKit('sy_wall','신벽',{name:'신벽',cd:15,r:6,txt:'3초간 둘레 3칸의 나와 아군이 받는 피해 50% 감소.',ai:(e,d)=>d<=5&&e.hp<e.max*.8,cast(e){ zone(e,{x:e.x,y:e.y,r:3,dur:3,every:.2,good:true,chase:e,speed:99,label:'신벽',tick:z=>{ for(const a of twMates(e)) if(Math.hypot(a.x-z.x,a.y-z.y)<=z.r+.5){ const s=a.st.find(q=>q.k==='resist'&&q.sy==='wall'); if(s) s.until=now+.4; else add(a,'resist',.4,.5,{self:true,sy:'wall',end:()=>{}}); } }}); proc(e,'신벽','3초'); }});
syKit('sy_bolt','낙뢰',{name:'낙뢰',cd:12,r:8,txt:'앞 5칸 자리의 둘레 3칸에 기본 공격의 200% 피해.',cast(e){ const at={x:e.x+e.aim.x*5,y:e.y+e.aim.y*5}; S.circle(e,3,e.atk*2,'낙뢰',{knock:0,v:'bolt',el:'thunder'},at); }});
syKit('sy_tree','세계수 묘목',{name:'세계수 묘목',cd:25,r:99,txt:'묘목을 심는다. 8초간 둘레 4칸의 나와 아군이 매 초 최대 체력의 3% 회복.',ai:e=>e.hp<e.max*.7,cast(e){ zone(e,{x:e.x,y:e.y,r:4,dur:8,every:1,good:true,label:'세계수 묘목',tick:z=>{ for(const a of twMates(e)) if(Math.hypot(a.x-z.x,a.y-z.y)<=z.r+.5) heal(a,a.max*.03,true); }}); proc(e,'세계수 묘목','8초'); }});

/* ── 등반에서 싸우는 사람 · 층 ── */
const twLive=()=>typeof TW!=='undefined'&&TW&&TW.on&&!NET.client&&running;
const twMen=()=>ents.filter(e=>e.team===0&&(e===me||e.net));
const tOf=(e,n)=>(e._sy&&e._sy[n])|0;

/* ── 한 번 맞을 때 반사 · 가시는 모았다가 한 번에 · 체력 비례 피해는 층에 따라 덜 받는다 ── */
const pctRes=f=>f<TWB.pct.from?0:Math.min(TWB.pct.max,TWB.pct.base+TWB.pct.per10*Math.floor((f-TWB.pct.from)/10));
{ const d0=damage; damage=function(src,t,amt,label,o){
    if(src&&src._rfC&&o&&o.amp&&(label==='가시'||label==='되돌림')){ src._rfC.push([amt,label]); return false; }
    if(src&&t&&src!==t&&t.team===1&&!(o&&o._st)&&typeof label==='string'&&/체비/.test(label)&&!/\(고정\)$/.test(label)&&twLive()){ amt*=1-pctRes(TW.floor); if(t.boss||t.c.mon) amt=Math.min(amt,t.max*TWB.pct.bossCap); }
    return d0.call(this,src,t,amt,label,o); }; }
/* 회복: 흡혈 상한(권능이 타격에 붙여 주는 회복만) · 넘친 회복(생명 · 혈) */
{ const h0=heal; heal=function(e,amt,quiet){ if(e&&e._inDeal&&e._lk<1) amt*=e._lk; const full=e&&e._sy&&!e.dead&&(tOf(e,'생명')>=2||tOf(e,'혈')>=2||e._ovSh),b=full?e.hp:0,r=h0.call(this,e,amt,quiet);
    if(full&&amt>0&&e.hp>=e.max-.01&&!has(e,'noheal')&&!has(e,'curse')){ const over=Math.max(0,amt-(e.hp-b)); if(over>0){
        if(tOf(e,'생명')>=2||e._ovSh){ let s=e.sh.find(q=>q.syL); if(!s||s.v<=0){ s={v:0,until:now+9999,syL:true}; e.sh.push(s); } s.v=Math.min(e.max*.2,s.v+over); }
        if(tOf(e,'혈')>=2) e._ov=Math.min(e.max*.1,(e._ov||0)+over); } }
    return r; }; }
/* 보호막: 기사단 */
{ const s0=shield; shield=function(e,v,t){ const k=e&&e._sy?tOf(e,'기사단'):0; if(k>=1) v=Math.round(v*1.2); const r=s0.call(this,e,v,t);
    if(k>=4&&!e._shP){ e._shP=true; try{ for(const f of foes(e)) if(dist(e,f)<=3.5) damage(e,f,v,'기사단',{amp:true}); }finally{ e._shP=false; } } return r; }; }
/* 상태이상: 속박(내가 거는 것은 길게) */
{ const a0=add; const keep=Object.keys(a0); add=function(e,k,t,v,extra){ const by=extra&&extra.by; if(by&&by._sy&&by!==e&&by.team!==e.team&&DEBUFFS.includes(k)){ const q=tOf(by,'속박'); if(q) t*=q>=2?1.4:1.2; } return a0.call(this,e,k,t,v,extra); };
  for(const p of keep) add[p]=a0[p]; Object.defineProperty(add,'lock',{get(){ return a0.lock; },set(v){ a0.lock=v; }}); }

/* ── 한 사람에게 거는 겹 ── c0: 권능 · 장비까지 얹힌 몸 */
function synLayer(e,ids){ const c0=e.c,n=Object.assign({},c0),base=CH[e.key]||{},cap=TWB.cap;
  /* 권능 · 장비 수치에서 겹침 상한에 쓸 합계 */
  let dg=1,tk=1,lk=0; for(const id of ids){ const m=POWERS[id]&&POWERS[id].mods; if(!m) continue; if(m.dodge) dg*=1-m.dodge/100; if(m.take) tk*=1-m.take/100; if(m.leech) lk+=m.leech; }
  e._dg=1-dg; e._tk=1-tk; e._lk=lk>cap.leech?cap.leech/lk:1; e._cnt={b:0,sea:0,bolt:0,cast:0}; e._sec=0; e._t10=0; e._blk=0; e._ov=0;
  const T=k=>tOf(e,k),V=(k,a)=>a[T(k)-1]||0;
  n.modDeal=(x,t,a,l,o)=>{ if(c0.modDeal) a=c0.modDeal(x,t,a,l,o); if(!(a>0)||x===t) return a; o=o||{}; let m=1;
    if(T('제국')) m*=1.04; if(T('마탑')&&!o.basic&&!o.amp) m*=1+V('마탑',[.08,.16,.26,.40]); if(T('부족')>=2&&now<=8) m*=1.1; if(T('용족')&&x.hp<=x.max*.5) m*=1.1;
    if(T('극동')&&o.basic&&!o.amp&&Math.random()<(T('극동')>=2?.15:.06)){ m*=T('극동')>=2?2:1.5; say(x,'치명','#ffd36b'); if(T('극동')>=2) for(const k in x.cd) if(k!=='b'&&x.cd[k]>0) x.cd[k]=Math.max(0,x.cd[k]-.3); }
    if(T('기사단')>=3&&x.sh.some(s=>s.v>0)) m*=1.15; if(T('서리')>=3&&t._frz>now) m*=1.3; if(T('심연')) m*=T('심연')>=2?1.25:1.12; if(T('강철')&&o.basic) m*=1.1;
    if(T('맹공')) m*=1+V('맹공',[.05,.10,.18,.28]); if(x._fr>now) m*=1.1;
    if(T('연마')>=3&&o.basic&&!o.amp&&x._nb){ x._nb=false; m*=T('연마')>=4?2:1.5; }
    if(T('사냥')&&t.hp<=t.max*.3) m*=T('사냥')>=2?1.28:1.12; if(T('선봉')&&now<=6) m*=T('선봉')>=2?1.3:1.12;
    if(T('속박')>=2&&t.st.some(s=>DEBUFFS.includes(s.k))) m*=1.15; if(x._bl&&x._bl.deal) m*=1+x._bl.deal;
    return a*m; };
  n.modTake=(x,src,a,l,o)=>{ let v=c0.modTake?c0.modTake(x,src,a,l,o):a; if(src===x||!(a>0)) return v;
    /* 회피 상한: 권능 · 장비의 회피가 상한을 넘으면 넘는 만큼은 맞은 것으로 친다 */
    if(!(v>0)&&x._dg>cap.dodge&&Math.random()>cap.dodge/x._dg) v=a*(1-Math.min(cap.take,x._tk));
    if(!(v>0)) return v; let m=1;
    if(T('판테온')) m*=.94; if(T('철벽')) m*=1-V('철벽',[.05,.10,.16,.24]); if(T('역경')&&x.hp<=x.max*.35) m*=T('역경')>=2?.8:.9;
    if(T('질풍')>=3&&Math.hypot(x.mv.x,x.mv.y)>.1) m*=T('질풍')>=4?.8:.9; if(x._dr>now) m*=.7; if(x._bl&&x._bl.take) m*=1-x._bl.take;
    v*=m; v=Math.max(v,a*(1-cap.take)*(base.modTake?.6:1));   /* 받는 피해 감소 상한(제 패시브로 줄이는 캐릭터는 조금 더 준다) */
    if(T('철벽')>=3&&!(o&&o.amp)&&x._blk<=now){ x._blk=now+(T('철벽')>=4?6:10); say(x,'막음','#cfd6ff'); return 0; }
    return v; };
  n.speedMod=x=>(c0.speedMod?c0.speedMod(x):1)*(1+V('질풍',[.06,.12,.18,.25]))*(x._bl&&x._bl.speed?1+x._bl.speed:1);
  n.modHeal=(x,a)=>{ if(c0.modHeal) a=c0.modHeal(x,a); return T('성광')?a*1.2:a; };
  n.onStatus=(x,k,t)=>{ if(c0.onStatus) t=c0.onStatus(x,k,t); if(!(t>0)) return 0; return T('성광')?t*.8:t; };
  n.onDeal=(x,t,a,l,o)=>{ if(c0.onDeal){ x._inDeal=true; try{ c0.onDeal(x,t,a,l,o); }finally{ x._inDeal=false; } } if((o&&o.amp)||x===t) return;
    if(T('혈')&&a>0) heal(x,a*(T('혈')>=2?.07:.03),true); if(T('심연')>=2&&a>0) heal(x,a*.05,true);
    if(t.dead) return;
    if(T('혈')>=2&&x._ov>0){ const v=x._ov; x._ov=0; damage(x,t,v,'넘친 피',{amp:true}); if(t.dead) return; }
    if(T('서리')){ const c=(t._cold&&t._cold.until>now?t._cold.n:0)+1; t._cold={n:Math.min(5,c),until:now+3}; const s=t.st.find(q=>q.k==='slow'&&q.sy==='cold'); if(s){ s.v=.06*t._cold.n; s.until=now+3; } else add(t,'slow',3,.06*t._cold.n,{by:x,sy:'cold',end:()=>{}});
      if(T('서리')>=2&&t._cold.n>=5&&!(t._frzCd>now)){ t._cold.n=0; t._frzCd=now+5; t._frz=now+1; add(t,'stun',1,0,{by:x}); say(t,'빙결','#8fdcff'); } }
    if(T('화염')) t._burn={until:now+3,by:x,k:V('화염',[.1,.2,.35,.6]),acc:(t._burn&&t._burn.until>now?t._burn.acc:0)};
    if(T('선봉')>=2&&!x._vs){ x._vs=true; add(t,'stun',1,0,{by:x}); }
    if(T('강철')>=4&&o&&o.basic) for(const z of zones) if(z.syTur===x) turFire(z,t); };
  n.onHurt=(x,src,a,l,o)=>{ if((o&&o.amp)||!src||src===x){ if(c0.onHurt) c0.onHurt(x,src,a,l,o); return; }
    x._rfC=[]; try{ if(c0.onHurt) c0.onHurt(x,src,a,l,o); }finally{ var L=x._rfC; x._rfC=null; }
    let th=0,rf=0; for(const [v,lab] of L){ if(lab==='가시') th+=v; else rf+=v; } if(T('응징')) rf+=a*(T('응징')>=2?.12:.05); if(x._vow) rf*=2; rf=Math.min(rf,a*cap.reflect*(x._vow?2:1));
    if(th+rf>0&&!src.dead&&!x.dead){ damage(x,src,th+rf,'되돌림',{fixed:true,amp:true}); if(T('응징')>=2&&rf>0) heal(x,rf*.3,true); } };
  n.onKill=(x,t)=>{ if(c0.onKill) c0.onKill(x,t); if(!t||t.team===x.team) return;
    if(T('소모라')&&TW&&x===me){ TW.gold++; say(x,'증표 +1','#e3c377'); }
    if(T('명계')){ const two=T('명계')>=2,mine=zones.filter(z=>z.syWr===x); if(mine.length>=(two?2:1)) mine[0].until=now; zone(x,{x:t.x,y:t.y,r:1.2,dur:two?8:4,every:.5,label:'망령',syWr:x,tick:z=>{ const f=foes(x)[0]; if(!f) return; const d=norm(f.x-z.x,f.y-z.y),gap=Math.hypot(f.x-z.x,f.y-z.y); if(gap>1.2){ z.x+=d.x*Math.min(gap,3); z.y+=d.y*Math.min(gap,3); } if(Math.hypot(f.x-z.x,f.y-z.y)<=2) damage(x,f,x.atk*(two?.3:.15),'망령',{amp:true}); }}); }
    if(T('맹공')>=3){ const d=T('맹공')>=4?8:4; x._fr=now+d; add(x,'haste',d,.2,{self:true}); proc(x,'광폭',d+'초'); }
    if(T('사냥')>=2) heal(x,(x.max-x.hp)*.08);
    if(T('화염')>=3&&t._burn){ const again=T('화염')>=4; for(const f of foes(x)) if(Math.hypot(f.x-t.x,f.y-t.y)<=3.5){ damage(x,f,x.atk,'화염 폭발',{amp:true}); if(again&&!f.dead) f._burn={until:now+3,by:x,k:.6,acc:0}; } fx.push({k:'circle',x:t.x,y:t.y,r:3,t0:now,team:x.team,lab:'화염 폭발',src:x,v:'nova',el:'fire'}); }
    if(T('서리')>=4&&t._frzCd>now-2) for(const f of foes(x)) if(Math.hypot(f.x-t.x,f.y-t.y)<=4.5){ f._cold={n:5,until:now+3}; add(f,'slow',3,.3,{by:x,sy:'cold',end:()=>{}}); } };
  n.basicBonus=(x,t)=>{ if(c0.basicBonus) c0.basicBonus(x,t); if(!t||t.dead) return; const C=x._cnt;
    if(T('연격')){ const every=T('연격')>=4?3:4; if(++C.b>=every){ C.b=0; damage(x,t,x.atk*V('연격',[.4,.8,1.5,2]),'연격',{amp:true}); if(t.dead) return; } }
    if(T('바다')&&++C.sea>=4){ C.sea=0; knock(t,x,2); if(T('바다')>=2){ damage(x,t,x.atk*.8,'물결',{amp:true}); if(!t.dead) add(t,'slow',2,.3,{by:x}); } say(t,'물결','#8fd0ff'); if(t.dead) return; }
    if(T('뇌전')&&++C.bolt>=(T('뇌전')>=2?4:6)){ C.bolt=0; const L=foes(x).filter(f=>Math.hypot(f.x-t.x,f.y-t.y)<=6).slice(0,3); for(const f of L){ fx.push({k:'seg',x0:x.x,y0:x.y,x1:f.x,y1:f.y,w:.5,t0:now,team:x.team,lab:'번개',src:x,v:'bolt',el:'thunder'}); damage(x,f,x.atk*.5,'번개',{amp:true}); } }
    if(T('용족')>=3&&x._dr>now&&!x._brT){ x._brT=true; try{ S.arc(x,3,x.atk*.5,'용의 숨결',{knock:0,v:'flame',el:'fire'}); }finally{ x._brT=false; } } };
  n.onCast=(x,s)=>{ if(c0.onCast) c0.onCast(x,s); if(s==='b'||s==='crouch'||s==='jump') return; if(T('연마')>=3) x._nb=true;
    if(T('마탑')>=3&&++x._cnt.cast>=(T('마탑')>=4?2:3)){ x._cnt.cast=0; const f=foes(x)[0]; if(f){ fx.push({k:'seg',x0:x.x,y0:x.y,x1:f.x,y1:f.y,w:.6,t0:now,team:x.team,lab:'마력 구체',src:x,v:'tracer',el:'arcane'}); damage(x,f,x.atk*1.5,'마력 구체',{amp:true}); } } };
  n.onFatal=(x,src)=>{ const b=base.onFatal; if(b&&b(x,src)) return true;
    if(!x._ls&&c0.onFatal&&c0.onFatal(x,src)){ x._ls=true; return true; }   /* 권능 · 장비의 버티기는 싸움마다 한 번 */
    if(T('역경')>=2&&!x._ad){ x._ad=true; x.hp=1; add(x,'invuln',2,0,{self:true}); proc(x,'역경','체력 1로 버팀'); return true; } return false; };
  n.tick=(x,dt)=>{ if(c0.tick) c0.tick(x,dt); if(x.dead) return;
    if(T('연마')){ const k=V('연마',[.06,.12,.2,.3]); for(const s in x.cd) if(s!=='b'&&x.cd[s]>0) x.cd[s]=Math.max(0,x.cd[s]-dt*k); }
    if(T('용족')>=2&&!x._drU&&x.hp<=x.max*.5){ x._drU=true; x._dr=now+8; proc(x,'용의 각성','8초'); }
    if(x._dream){ for(const k of ['pk_star_hope','pk_star_despair','pk_star_grief']){ const cur=+x.r[k]||0,pv=x._dream[k]||0; if(cur>pv&&cur<100) x.r[k]=Math.min(100,cur+(cur-pv)*.5); x._dream[k]=+x.r[k]||0; } }
    x._sec+=dt; if(x._sec<1) return; x._sec-=1; x._t10++;
    let rg=0; if(T('자연')) rg+=.006; if(T('생명')) rg+=T('생명')>=2?.01:.005; if(x._bl&&x._bl.regen) rg+=x._bl.regen; if(rg>0) heal(x,x.max*rg,true);
    if(T('심연')&&x.hp>1) x.hp=Math.max(1,x.hp-x.max*(T('심연')>=2?.006:.003));
    if(x._t10%10===0){ if(T('기사단')>=2) shield(x,Math.round(x.max*.06),10);
      if(T('성광')>=2){ const a=twMates(x).sort((p,q)=>p.hp/p.max-q.hp/q.max)[0]; if(a){ a.st=a.st.filter(s=>!DEBUFFS.includes(s.k)); heal(a,a.max*.08); } } } };
  /* 상태 줄: 캐릭터 + 무기 · 권능 꾸러미 + 시너지 */
  n.hud=x=>{ const L=[]; try{ const b=c0.hud?c0.hud(x):''; if(b) L.push(b); }catch(z){} for(const id of ids){ const k=POWERS[id]&&POWERS[id].kit; if(k&&CH[k]&&CH[k].hud){ try{ const s=CH[k].hud(x); if(s) L.push(s); }catch(z){} } }
    if(x._dr>now) L.push('용의 각성'); if(x._fr>now) L.push('광폭'); if(x._ov>0) L.push('넘친 피 '+Math.round(x._ov)); return L.join(' · '); };
  e.c=n; }
/* 포탑(강철): 제자리에서 가까운 적을 쏜다 */
function turFire(z,t){ const x=z.owner; t=t||foes(x).find(f=>Math.hypot(f.x-z.x,f.y-z.y)<=9); if(!t||t.dead) return; fx.push({k:'seg',x0:z.x,y0:z.y,x1:t.x,y1:t.y,w:.3,t0:now,team:x.team,lab:'포탑',src:x,v:'tracer',el:'steel'}); damage(x,t,x.atk*.2,'포탑',{amp:true}); }
/* 화상은 판 전체에서 한 번에 센다 */
on('step',dt=>{ if(!twLive()) return; for(const t of ents){ const b=t._burn; if(!b||t.dead) continue; if(b.until<=now||!b.by||b.by.dead){ t._burn=null; continue; } b.acc+=dt; if(b.acc>=1){ b.acc-=1; damage(b.by,t,b.by.atk*b.k,'화상',{amp:true}); } } });

/* ── 빈 단추에 올릴 스킬 ── 무기 → 권능 → 시너지 순서. TW.sk(이름)에 적힌 것이 먼저 */
function twSkCands(key,ids,tiers){ const own=new Set(Object.values((CH[key]||{}).skills||{}).map(s=>s&&s.name)),L=[],seen=new Set();
  const push=(k)=>{ const c=CH[k]; if(!c||!c.skills) return; for(const sl in c.skills){ const sk=c.skills[sl]; if(!sk||own.has(sk.name)||seen.has(sk.name)) continue; seen.add(sk.name); L.push({name:sk.name,kit:k,sl,sk}); } };
  for(const id of ids.slice().sort((a,b)=>(b[0]==='@')-(a[0]==='@'))){ const k=POWERS[id]&&POWERS[id].kit; if(k&&id[0]!=='#') push(k); }
  for(const s in SYSK) if((tiers[s]|0)>=SYSK[s][1]) push(SYSK[s][0]); return L; }
function twSkPick(key,ids,tiers){ const free=['x1','x2','x3','x4'].filter(x=>!((CH[key]||{}).skills||{})[x]),C=twSkCands(key,ids,tiers),want=(TW&&Array.isArray(TW.sk)?TW.sk:[]),off=(TW&&Array.isArray(TW.skOff)?TW.skOff:[]),out=[];
  const ord=C.filter(c=>want.includes(c.name)).sort((a,b)=>want.indexOf(a.name)-want.indexOf(b.name)).concat(C.filter(c=>!want.includes(c.name)&&!off.includes(c.name)));
  for(const c of ord){ const f=free.shift(); if(!f) break; out.push([c.kit,c.sl,f]); } return out; }
/* 손님: 방장이 알려 준 대로 단추를 채운다 */
{ const kf=kitFill; kitFill=function(skills,ids){ if(NET.client&&NET.kit&&Array.isArray(NET.twSk)){ for(const [k,sl,to] of NET.twSk){ const sk=CH[k]&&CH[k].skills&&CH[k].skills[sl]; if(sk&&!skills[to]) skills[to]=sk; } return; } return kf.apply(this,arguments); }; }
onMsg('client',{post(d){ if(!d||!NET.client) return; if(d.t==='twsk'){ NET.twSk=d.sk; NET.kitC=null; } else if(d.t==='tw') NET.twSk=null; }});
{ const rs=reseat; reseat=function(p){ const r=rs.apply(this,arguments); try{ const e=p&&ents.find(o=>o.id===p.eid); if(e&&e._twsk&&twLive()) NET.tx.send(p.pid,{t:'twsk',sk:e._twsk}); }catch(x){} return r; }; }

/* ── 판 시작: 시너지 · 상한 · 스킬 · 상대 손질 ── (core · meta · v1.9.10의 시작 처리 뒤에 돈다) */
const BLESS=[['deal','피해'],['take','방어'],['regen','회복'],['speed','속도']];
on('begin',()=>{ if(!twOn()) return; const ids=twIds(),f=TW.floor,nx=TW.next||{},names=[];
  for(const e of twMen()){ const cnt=synCount(ids,e.key,e===me?twFree():null),tiers=synTiers(cnt,ids); e._sy=tiers; synLayer(e,ids);
    /* 최대 체력: 비율을 지켜 늘린다(판이 끝날 때 twSettle에서 되돌린다) */
    { const m0=e.max; let m=m0; if(tiers['부족']) m+=60; if(tiers['제국']) m*=1.08; m=Math.round(m); if(m!==m0){ e._hpK=m/m0; e.hp=Math.max(1,e.hp*e._hpK); e.max=m; } }
    if((tiers['부족']|0)>=2) add(e,'haste',8,.15,{self:true});
    if(tiers['성좌']){ const two=tiers['성좌']>=2,k=two?1.5:1,pool=BLESS.slice().sort(()=>Math.random()-.5).slice(0,two?2:1); e._bl={}; for(const [b] of pool) e._bl[b]=(b==='regen'?.01:.1)*k; if(e===me) msg([['별자리 축복 ','#e3c377'],[pool.map(p=>p[1]).join(' · '),'#fff6d6']],0,true); }
    if((tiers['강철']|0)>=2){ const nT=tiers['강철']-1; for(let i=0;i<nT;i++){ const a=i*2.1+1; zone(e,{x:e.x+Math.cos(a)*2,y:e.y+Math.sin(a)*2,r:.8,dur:99999,every:1,label:'포탑',syTur:e,tick:z=>turFire(z)}); } }
    if(ids.includes('Kpk_star')&&ids.includes('@g20')){ e._dream={}; if(e===me) names.push('몽환'); }
    /* 스킬 단추 */
    { const base=(CH[e.key]||{}).skills||{},sk=Object.assign({},e.c.skills); for(const x of ['x1','x2','x3','x4']) if(!base[x]) delete sk[x]; const L=twSkPick(e.key,ids,tiers); for(const [k,sl,to] of L) sk[to]=CH[k].skills[sl]; e.c.skills=sk; e._twsk=L; if(e.net){ try{ NET.tx.send(e.net.pid,{t:'twsk',sk:L}); }catch(x){} } }
    if(e===me) for(const k of SYN_NAMES) if(tiers[k]) names.push(k+' '+tiers[k]); }
  try{ if(typeof uiBegin==='function') uiBegin(); }catch(x){}
  if(names.length) msg([['시너지 ','#e3c377'],[names.join(' · '),'#fff6d6']],0,true);
  /* 상대: 50층부터 상태이상을 짧게 받는다 · 30층부터 정예는 강화 하나 */
  const cc=twBand(TWB.cc,f); if(cc<1) for(const t of ents) if(t.team===1){ const c=t.c,os=c.onStatus; t.c=Object.assign({},c,{onStatus:(x,k,d)=>{ if(os) d=os(x,k,d); return d>0?d*cc:0; }}); if(t.base0) t.base0=Object.assign({},t.base0,{c:t.c}); }
  if(nx.elite&&nx.aff&&foe&&!foe.dead){ const c=foe.c,A=nx.aff;
    if(A==='가시'){ const oh=c.onHurt; foe.c=Object.assign({},c,{onHurt:(x,src,a,l,o)=>{ if(oh) oh(x,src,a,l,o); if(src&&src!==x&&!src.dead&&!(o&&o.amp)&&a>0) damage(x,src,a*.1,'정예의 가시',{fixed:true,amp:true}); }}); }
    else if(A==='흡혈'){ const od=c.onDeal; foe.c=Object.assign({},c,{onDeal:(x,t,a,l,o)=>{ if(od) od(x,t,a,l,o); if(!(o&&o.amp)&&a>0) heal(x,a*.15,true); }}); }
    else if(A==='신속') add(foe,'haste',9999,.25,{self:true});
    else if(A==='방벽'){ const ot=c.tick; let acc=8; foe.c=Object.assign({},c,{tick:(x,dt)=>{ if(ot) ot(x,dt); acc+=dt; if(acc>=10){ acc-=10; shield(x,Math.round(x.max*.1),10); } }}); }
    if(foe.base0) foe.base0=Object.assign({},foe.base0,{c:foe.c}); msg([['정예 강화 ','#ff7d8c'],[A,'#fff6d6']],1,true); } });
/* 판이 끝날 때: 늘린 최대 체력을 비율대로 되돌린 뒤 결과를 확정한다 · 소모라 이자 */
{ const st=twSettle; twSettle=function(w){ if(TW&&TW.on&&!TW.fin){ for(const e of ents) if(e._hpK){ e.hp=Math.max(e.dead?0:1,e.hp/e._hpK); e.max=Math.round(e.max/e._hpK); e._hpK=0; }
      if(w&&w.team===0&&me&&tOf(me,'소모라')>=3){ const g=Math.min(10,Math.floor(TW.gold*.1)); if(g>0) TW.gold+=g; } }
    return st.apply(this,arguments); }; }
/* 상인: 소모라 2단계는 값이 싸다 · 정예 강화는 길을 고를 때 정해 둔다 */
{ const tp=towerPath; towerPath=function(i){ const r=tp.apply(this,arguments); try{ if(TW&&TW.shop&&!TW.shopCut&&syTier('소모라',twCount()['소모라']|0)>=2){ TW.shopCut=1; for(const it of TW.shop) it.price=Math.max(1,Math.round(it.price*.85)); twStore(); towerScreen(); } if(TW&&!TW.shop) delete TW.shopCut; }catch(x){} return r; }; }
const AFFIX={가시:'받은 피해의 10%를 되돌린다',흡혈:'준 피해의 15%를 회복한다',신속:'기동력 +25%',방벽:'10초마다 최대 체력 10% 보호막'};
function twAffix(){ if(!TW) return; const n=TW.next; if(n&&n.elite&&TW.floor>=TWB.affixFrom&&!hasK(AFFIX,n.aff)){ n.aff=rnd(Object.keys(AFFIX)); twStore(); } }

/* ── 저장해 둔 등반을 읽을 때 새 칸 다듬기 ── */
function twFix20(){ if(!TW) return; if(!SY[TW.free]) delete TW.free; for(const k of ['sk','skOff']) TW[k]=(Array.isArray(TW[k])?TW[k]:[]).filter(x=>typeof x==='string').map(x=>x.slice(0,40)).slice(0,40);
  const b=TW.bought&&typeof TW.bought==='object'?TW.bought:{}; TW.bought={train:Math.max(0,Math.min(999,b.train|0)),hone:Math.max(0,Math.min(999,b.hone|0))}; if(TW.next&&TW.next.aff&&!hasK(AFFIX,TW.next.aff)) delete TW.next.aff; }

/* ── 화면 ── */
{ const st=document.createElement('style'); st.textContent=
   '.sy-row{display:flex;flex-wrap:wrap;gap:5px;margin:2px 0 8px}.sy-c{font:inherit;font-size:12px;line-height:1.7;padding:0 9px;border-radius:999px;border:1px solid var(--line);color:var(--muted);background:transparent;white-space:nowrap}'
  +'.sy-c.on{color:var(--ink);border-color:var(--gold);background:rgba(227,195,119,.14)}.sy-c b{color:var(--gold);font-weight:700}.sy-note{font-size:12px;color:var(--gold);margin:6px 0 0;white-space:pre-line}'
  +'.sy-g{font-size:12px;letter-spacing:.12em;color:var(--gold);margin:14px 0 4px}.sy-t{display:block;font-size:13px;color:var(--muted);white-space:pre-line}.sy-t.on{color:var(--ink)}'
  +'.sy-btns{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 8px}.sy-btns .ghost{flex:1 1 140px}.sy-pick{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:6px;margin:8px 0}'
  +'.sy-ct{white-space:pre-wrap;font-size:13px;line-height:1.6;color:var(--ink);margin:6px 0 0}details.sy-d{margin:6px 0}details.sy-d summary{cursor:pointer;color:var(--gold);font-size:13px}';
  document.head.appendChild(st); }
const syChip=(k,n)=>{ const t=syTier(k,n),nx=syNext(k,n); return '<span class="sy-c'+(t?' on':'')+'">'+esc(k)+' <b>'+n+'</b>'+(nx?'/'+nx:'')+(t?' · '+t+'단계':'')+'</span>'; };
const syRow=n=>{ const ks=SYN_NAMES.filter(k=>n[k]).sort((a,b)=>(syTier(b,n[b])-syTier(a,n[a]))||(n[b]-n[a])); return ks.length?'<div class="sy-row">'+ks.map(k=>syChip(k,n[k])).join('')+'</div>':''; };
/* 보유 권능 및 장비 창의 시너지 칸(1.9.10의 꼬리표 칸을 갈아 끼운다) */
synHtml=function(ids,key,free){ if(key===undefined){ if(NET.client){ if(running&&me) key=me.key; } else if(typeof TW!=='undefined'&&TW){ key=TW.key; free=twFree(); } } const n=synCount(ids,key,free); let h='<h2>시너지</h2>'; const ks=SYN_NAMES.filter(k=>n[k]);
  if(!ks.length) return h+'<p class="note">아직 모은 시너지가 없다. 캐릭터 · 권능 · 장비가 시너지 하나에 1점씩 준다.</p>';
  h+=syRow(n); for(const g of ['소속','힘','성향']){ const L=ks.filter(k=>SY[k].group===g); if(!L.length) continue; h+='<p class="sy-g">'+g+'</p>';
    for(const k of L){ const t=syTier(k,n[k]); h+='<div class="bcard" style="border-left-color:'+(t?'var(--gold)':'var(--line)')+'"><b>'+esc(k)+' '+n[k]+'점'+(t?' · '+t+'단계':'')+'</b>'+SY[k].tiers.map((v,i)=>'<span class="sy-t'+(i<t?' on':'')+'">'+v+'점: '+esc(SY[k].tx[i])+'</span>').join('')+'</div>'; } }
  return h+'<p class="note">같은 시너지는 가장 높은 단계까지의 효과가 모두 든다. 등반에서만 걸린다.</p>'; };
/* 권능 · 장비 하나의 시너지 이름표(game/v1.9.10.js의 꼬리표 칸을 갈아 끼운다) */
twTagChips=function(id){ const L=synOf(id); return L.length?'<div class="tw-tgs">'+L.map(t=>'<span class="tw-tg">'+esc(t)+'</span>').join('')+'</div>':''; };
/* 보유 창: 무기 · 권능 카드 원문 */
{ const ih=twInvHtml; twInvHtml=function(){ let h=ih.apply(this,arguments); try{ const D=twInvData(); if(D){ const ks=[]; for(const id of D.ids){ const k=POWERS[id]&&POWERS[id].kit; if(k&&CARDTEXT[k]&&!ks.includes(k)) ks.push(k); } if(ks.length) h+='<h2>스킬 설명</h2>'+ks.map(k=>'<details class="sy-d"><summary>'+esc(CH[k].kname||k)+'</summary><p class="sy-ct">'+esc(CARDTEXT[k])+'</p></details>').join(''); } }catch(x){} return h; }; }
/* 작은 창 하나(자유 표식 · 스킬 고르기 · 카드 원문) */
const syWin=(()=>{ const el=document.createElement('div'); el.className='overlay'; el.id='sywin'; el.hidden=true; el.style.zIndex='10';
  el.innerHTML='<div class="wrap"><div id="sywin-b"></div><div class="dock"><button class="go shut" id="sywin-x" type="button">닫기</button></div></div>'; document.body.appendChild(el);
  return { open(h){ $('sywin-b').innerHTML=h; el.hidden=false; el.scrollTop=0; }, close(){ el.hidden=true; }, get on(){ return !el.hidden; } }; })();
{ const bs=backStep; backStep=function(){ if(syWin.on){ syWin.close(); return true; } return bs.apply(this,arguments); }; }
function syFreeWin(){ const cur=TW.free; syWin.open(head('TOWER','자유 표식','고화 캐릭터는 원하는 시너지에 1점을 더 받는다')+'<p class="note">1층을 넘기 전까지 바꿀 수 있다.</p>'+['소속','힘','성향'].map(g=>'<p class="sy-g">'+g+'</p><div class="sy-pick">'+SYN_NAMES.filter(k=>SY[k].group===g).map(k=>'<button type="button" class="ghost" data-syfree="'+esc(k)+'"'+(k===cur?' style="border-color:var(--gold);color:var(--gold)"':'')+'>'+esc(k)+'</button>').join('')+'</div>').join('')); }
function sySkWin(){ const tiers=synTiers(twCount(),twIds()),C=twSkCands(TW.key,twIds(),tiers),free=twKitFree(TW.key),on=twSkPick(TW.key,twIds(),tiers).map(x=>CH[x[0]].skills[x[1]].name);
  syWin.open(head('TOWER','스킬 고르기','빈 단추 '+free+'칸에 올릴 스킬')+(free?'<p class="note">누르면 올리거나 내린다. 숫자는 단추 순서다. 다 차 있으면 먼저 하나를 내린다.</p>':'<p class="note">이 캐릭터는 빈 스킬 칸이 없어 무기 · 권능 · 시너지 스킬이 붙지 않는다.</p>')
   +C.map(c=>{ const i=on.indexOf(c.name); return card('data-sysk="'+esc(c.name)+'"',(i>=0?'<span class="tw-gb" style="--gc:var(--gold)">'+(i+1)+'</span> ':'')+esc(c.name)+' <small class="tw-lv">'+esc(CH[c.kit].kname||'')+(c.sk.cd?' · '+c.sk.cd+'초':'')+'</small>',esc(c.sk.txt||c.sk.need||(c.sk.kind||'')),i>=0?'var(--gold)':'var(--line)'); }).join('')); }
document.addEventListener('click',e=>{ if(e.target.closest('#sywin-x')) return syWin.close(); if(NET.client||typeof TW==='undefined'||!TW) { const c=e.target.closest('[data-syct]'); if(c&&CARDTEXT[c.dataset.syct]) syWin.open(head('TOWER','스킬 설명','')+'<p class="sy-ct">'+esc(CARDTEXT[c.dataset.syct])+'</p>'); return; }
  if(e.target.closest('#sy-free')) return syFreeWin(); if(e.target.closest('#sy-sk')) return sySkWin();
  const ct=e.target.closest('[data-syct]'); if(ct&&hasK(CARDTEXT,ct.dataset.syct)) return syWin.open(head('TOWER','스킬 설명',esc((CH[ct.dataset.syct]||{}).kname||''))+'<p class="sy-ct">'+esc(CARDTEXT[ct.dataset.syct])+'</p>');
  const f=e.target.closest('[data-syfree]'); if(f&&SY[f.dataset.syfree]&&!TW.on&&TW.floor===1&&CH[TW.key].grade==='고화'){ TW.free=f.dataset.syfree; twStore(); syWin.close(); towerScreen(); return; }
  const s=e.target.closest('[data-sysk]'); if(s&&!TW.on){ const nm=s.dataset.sysk,tiers=synTiers(twCount(),twIds()),free=twKitFree(TW.key); let L=twSkPick(TW.key,twIds(),tiers).map(x=>CH[x[0]].skills[x[1]].name);
    const off=new Set(TW.skOff||[]); if(L.includes(nm)){ L=L.filter(x=>x!==nm); off.add(nm); } else if(L.length<free){ L.push(nm); off.delete(nm); } else return toast('먼저 하나를 내린다'); TW.sk=L; TW.skOff=[...off]; twStore(); sySkWin(); } });
/* 등반 화면: 시너지 줄 · 단추 · 보상 칸의 시너지 안내 · 카드 원문 단추 · 정예 강화 */
{ const ts=towerScreen; towerScreen=function(lost){ if(!lost&&TW){ twFix20(); twAffix(); } const r=ts.apply(this,arguments);
    try{ if(lost||!TW) return r; const body=$('tw-body'),n=twCount(),anchor=$('tw-inv')||body.querySelector(':scope>p.sub'); if(!anchor||$('sy-line')) return r;
      const tiers=synTiers(n,twIds()),cands=twSkCands(TW.key,twIds(),tiers),needFree=CH[TW.key].grade==='고화'&&TW.floor===1;
      let h='<div id="sy-line">'+syRow(n)+'<div class="sy-btns">'+(needFree?'<button class="ghost" id="sy-free" type="button">자유 표식'+(twFree()?': '+esc(TW.free):' 고르기')+'</button>':'')+(cands.length?'<button class="ghost" id="sy-sk" type="button">스킬 고르기 ('+Math.min(cands.length,twKitFree(TW.key))+'/'+cands.length+')</button>':'')+'</div></div>';
      anchor.insertAdjacentHTML('afterend',h);
      /* 보상 · 상인 칸: 이것을 얻으면 바뀌는 시너지 */
      const L=TW.rew||TW.shop; if(L) body.querySelectorAll('[data-rw],[data-buy]').forEach(b=>{ const it=L[+(b.dataset.rw!=null?b.dataset.rw:b.dataset.buy)]; if(!it||it.t==='boon') return; const id=it.t==='gear'?'@'+it.id:it.id,ids=twIds().slice();
        if(it.t==='gear'){ const old=TW.gear[GEAR[it.id].slot]; if(old){ const j=ids.indexOf('@'+old); if(j>=0) ids.splice(j,1); } } ids.push(id); const n2=synCount(ids,TW.key,twFree()),parts=[];
        for(const k of SYN_NAMES){ const a=n[k]|0,c=n2[k]|0; if(a===c) continue; const t1=syTier(k,a),t2=syTier(k,c); parts.push(k+' '+a+'→'+c+(t2>t1?' ★'+t2+'단계':t2<t1?' (단계 내려감)':'')); }
        if(parts.length){ const p=document.createElement('p'); p.className='sy-note'; p.textContent='시너지: '+parts.join(' · '); b.appendChild(p); if(parts.some(x=>x.includes('★'))) b.style.boxShadow='0 0 0 1px var(--gold) inset'; }
        const k=POWERS[id]&&POWERS[id].kit; if(k&&CARDTEXT[k]){ const q=document.createElement('button'); q.type='button'; q.className='ghost'; q.dataset.syct=k; q.textContent='「'+(CH[k].kname||'')+'」 스킬 설명'; q.style.cssText='width:100%;margin:-4px 0 10px;font-size:13px'; b.insertAdjacentElement('afterend',q); } });
      /* 정예 강화 안내 */
      const nx=TW.next; if(nx&&nx.elite&&nx.aff&&$('tw-go')){ const p=[...body.querySelectorAll('.note')].find(x=>x.textContent.includes('지면 등반이 끝난다')); if(p) p.appendChild(document.createTextNode(' 정예 강화 「'+nx.aff+'」: '+AFFIX[nx.aff]+'.')); }
    }catch(x){ console.error('등반 화면 시너지',x); } return r; }; }
