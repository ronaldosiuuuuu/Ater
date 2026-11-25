"use strict";
/* 적(몹)과 보스. 여기 있는 것은 모두 시험장에서 만든 것이다(카드에 없다). 이름·수치를 고치거나 지워도 된다.
   적을 더하려면 MOBS에 한 줄, 보스를 더하려면 BOSSES에 한 줄. 스킬은 forge.js의 명세 꼴을 줄여 적는다:
   [이름, 대기시간, 모양, 범위, 피해, {더할 것}]  모양: arc 부채꼴 · circle 원형 · line 직선 · proj 투사체 · spot 적의 자리 원형 · none
   더할 것: hits 타수, n 발 수, move:['leap'|'dash'|'blink',칸], focus 초, tele 초(보스: 범위가 먼저 보인다), fx:{stun,root,silence,blind,slow:[비율,초],air,knock,pull},
           shield:[양,초], heal, haste:[비율,초], resist:[비율,초], reach 지정 거리, summon:[적 key, 수] */
const mkSpec=(q)=>{ const [name,cd,shape,r,dmg,x={}]=q,sp={name,cd,shapes:[],fx:x.fx||{},ok:[],warn:[]}; if(shape!=='none'){ const t=shape==='spot'?'circle':shape; sp.shapes.push({t:x.move&&x.move[0]==='dash'&&shape==='line'?'path':t,r,hits:x.hits||1,dmg,n:x.n||1}); if(shape==='spot') sp.target=x.reach||8; if(t==='proj') sp.range=r; }
  if(x.move) sp.move={t:x.move[0],d:x.move[1]}; for(const k of ['focus','shield','heal','haste','resist']) if(x[k]) sp[k]=x[k]; sp.r=Math.max(2.5,(x.move?x.move[1]:0)+(shape==='none'?4:shape==='spot'?(x.reach||8):r)); sp.x=x; return sp; };
/* 잡몹 소환의 공통 규칙: 한 편에 살아 있는 소환 잡몹은 SUMCAP마리까지. 소환된 잡몹은 체력이 SUMHP배. 꽉 차 있으면 소환 스킬은 쉬고, 보스의 나머지 스킬이 SUMRUSH만큼 빨리 돈다 */
const SUMCAP=4,SUMHP=.7,SUMRUSH=.3;
const sumN=e=>ents.filter(o=>o.team===e.team&&!o.dead&&o.summoned).length, sumFull=e=>sumN(e)>=SUMCAP;
function summon(e,key,n){ if(e.id) e.sumBoss=true; for(let i=0;i<n;i++){ if(sumFull(e)||ents.filter(o=>o.team===e.team&&!o.dead).length>=SUMCAP+1) return; const a=Math.random()*6.283,m=mk(key,e.team,e.x+Math.cos(a)*3,e.y+Math.sin(a)*3); clamp(m); m.slot=ents.filter(o=>o.team===e.team).length; m.busy=now+.8; m.summoned=true; m.max=m.hp=Math.round(m.max*SUMHP); ents.push(m); puff(m.x,m.y,'shadow',10,3); } }
on('step',dt=>{ for(const e of ents){ if(!e.sumBoss||e.dead||!sumFull(e)) continue; for(const k in e.cd){ if(k==='b'||e.cd[k]<=0) continue; const sk=e.c.skills[k]; if(sk&&sk.sum) continue; e.cd[k]=Math.max(0,e.cd[k]-dt*SUMRUSH); } } });
const SLOTS=['n1','n2','aw','x1','x2'];
const foeSkills=(L,boss)=>{ const S0={}; L.forEach((q,i)=>{ const sp=mkSpec(q),x=sp.x; S0[SLOTS[i]]={sum:!!x.summon,can:x.summon?(e=>!sumFull(e)):undefined,need:x.summon?'잡몹 자리':undefined,name:sp.name,kind:boss?(x.tele?'집중 마법':'기본 공격'):'스킬',cd:sp.cd,r:sp.r,cast(e){ const go=()=>{ if(x.summon) summon(e,x.summon[0],x.summon[1]); if(sp.shapes.length||sp.shield||sp.heal||sp.haste||sp.resist||sp.move) runSpec(e,sp); };
      if(x.tele){ const h=sp.shapes[0],t=sp.target?foes(e).sort((a,b)=>dist(e,a)-dist(e,b))[0]:null; monCast(e,x.tele,h?h.r:4,sp.name,go,t&&dist(e,t)<=sp.target+4?{x:t.x,y:t.y}:null); } else go(); }}; }); return S0; };
/* 적: [key, 이름, 강함(1~5), 체력, 공격, 걸음 배수, 색, 무기 그림, [스킬…]] */
const MOBS=[
 ['m_dog','들개',1,250,12,1.15,'#a98b6b','claws',[['물어뜯기',4,'arc',2.5,18]]],
 ['m_gob','고블린 척후',1,300,14,1,'#7fae5a','dagger',[['돌팔매',3,'proj',10,10]]],
 ['m_skel','해골 병사',1,350,16,.95,'#d8d4c4','sword',[['내려치기',5,'line',3,25]]],
 ['m_toad','늪 두꺼비',1,320,10,.9,'#5f8f4a','claws',[['혀',5,'proj',8,12,{fx:{pull:2}}],['독침',8,'circle',3,15]]],
 ['m_bandit','산적',1,380,18,1,'#8a6a4a','sword',[['기습',6,'line',4,22,{move:['dash',4]}]]],
 ['m_bat','박쥐 떼',1,220,10,1.3,'#6a5a8a','claws',[['초음파',7,'circle',4,12,{fx:{silence:.5}}]]],
 ['m_wolf','굶주린 늑대',2,400,18,1.2,'#8f8f9a','claws',[['덮치기',5,'circle',2.5,28,{move:['leap',4]}],['울부짖기',10,'none',0,0,{haste:[.3,3]}]]],
 ['m_shaman','고블린 주술사',2,350,12,1,'#6fae8a','wand',[['저주탄',4,'proj',11,22,{fx:{slow:[.3,2]}}],['주술 치유',12,'none',0,0,{heal:40}]]],
 ['m_archer','해골 궁수',2,330,14,1,'#cfcab4','bow',[['화살',2.5,'proj',13,20],['연사',8,'proj',13,30,{n:3}]]],
 ['m_chief','산적 두목',2,520,22,1,'#a0703a','mace',[['내려찍기',7,'arc',3.5,35,{fx:{stun:.5}}],['돌진',8,'line',5,30,{move:['dash',5]}]]],
 ['m_statue','석상 파수꾼',2,650,20,.8,'#9aa0a8','mace',[['지진',8,'circle',4,35,{fx:{air:2}}],['돌 방패',12,'none',0,0,{shield:[60,4]}]]],
 ['m_lizard','불도마뱀',2,420,16,1,'#e0703a','claws',[['화염 숨',6,'arc',5,32,{hits:4}],['불씨',5,'proj',10,18]]],
 ['m_spider','서리 거미',3,480,18,1.05,'#9fd0e6','claws',[['거미줄',6,'proj',10,15,{fx:{root:1}}],['물기',4,'arc',2.5,30,{fx:{slow:[.3,2]}}]]],
 ['m_wraith','망령',3,400,20,1.05,'#8a7ab8','dagger',[['넘어오기',6,'circle',3,30,{move:['blink',5]}],['흡수',8,'line',6,25,{heal:25}]]],
 ['m_fknight','타락한 기사',3,700,26,.95,'#5a4a6a','sword',[['가르기',5,'arc',4,40],['돌격',9,'line',6,35,{move:['dash',6],fx:{knock:2}}],['방어 태세',14,'none',0,0,{resist:[.3,4]}]]],
 ['m_priest','암흑 사제',3,480,14,1,'#4a3a5a','ringstaff',[['암흑구',3,'proj',12,30],['입막음',10,'spot',3,20,{fx:{silence:1}}],['어둠의 기도',14,'none',0,0,{heal:60}]]],
 ['m_ogre','오우거',3,900,30,.85,'#8a9a5a','mace',[['휘두르기',6,'arc',4.5,50,{fx:{knock:3}}],['발구르기',12,'circle',5,40,{fx:{stun:.7}}]]],
 ['m_viper','독사',3,380,16,1.1,'#4a8a3a','dagger',[['독니',4,'arc',2.5,30,{hits:3}],['급습',8,'circle',2,25,{move:['leap',5],fx:{root:.5}}]]],
 ['m_wyvern','와이번',4,850,28,1.05,'#b85a3a','claws',[['급강하',8,'circle',3.5,55,{move:['leap',7],fx:{air:2}}],['화염탄',4,'proj',12,35],['날갯짓',10,'circle',6,20,{fx:{knock:4}}]]],
 ['m_assassin','복면 자객',4,520,26,1.2,'#3a3a4a','dagger',[['그림자 걸음',6,'arc',3,45,{move:['blink',6]}],['표창',4,'proj',11,36,{n:3}],['연막',12,'circle',4,10,{fx:{blind:1.5}}]]],
 ['m_mage','전투 마법사',4,560,16,1,'#5a7ad8','wand',[['화염구',3.5,'proj',13,40],['얼음 창',7,'line',10,35,{fx:{slow:[.4,2]}}],['마력 방벽',14,'none',0,0,{shield:[80,5]}],['폭발',12,'spot',4,60,{focus:1}]]],
 ['m_igolem','강철 골렘',4,1100,30,.75,'#7a8a9a','fists',[['강타',6,'arc',4,55,{fx:{stun:.6}}],['충격파',10,'circle',6,45,{focus:.8,fx:{knock:3}}]]],
 ['m_bknight','흑기사',5,1000,34,1,'#2a2a3a','sword',[['참격',4.5,'arc',4.5,60],['흑마 돌진',8,'line',7,50,{move:['dash',7],fx:{stun:.8}}],['검은 불꽃',10,'circle',6,60,{hits:3}],['불굴',16,'none',0,0,{shield:[120,6],resist:[.2,6]}]]],
 ['m_lich','리치',5,800,22,.95,'#7ae0c8','ringstaff',[['죽음의 화살',3,'proj',14,55],['서리 고리',9,'circle',6,50,{fx:{root:1.2}}],['영혼 흡수',8,'line',9,45,{heal:45}],['뼈 감옥',14,'spot',3,30,{focus:.8,fx:{stun:1}}]]],
 ['m_dragoon','용아병',5,1100,32,1,'#c8a85a','spear',[['창 찌르기',4,'line',5,50],['회전 베기',8,'circle',4,60,{hits:3}],['도약 찍기',9,'circle',3,45,{move:['leap',6],fx:{air:2}}]]]
];
for(const [key,name,tier,hp,atk,spd,col,w,L] of MOBS){ Object.defineProperty(CH,key,{value:{key,mob:true,tier,name:'적, '+name,cls:'적',grade:'적',hp,atk,range:L.some(q=>q[2]==='proj'&&q[3]>=10)?6:2.4,col,init:e=>{e.r={}},hud:()=>'',speedMod:()=>spd,skills:foeSkills(L),note:'시험장에서 만든 적이다. 카드에 없다.'},enumerable:false,configurable:true});
  LOOK[key]={el:'steel',w,hair:col,acc:[]}; CARDTEXT[key]='[ 적, '+name+' ]\nHP : '+hp+' / ATK : '+atk+'\n(시험장 제작)\n\n'+L.map(q=>"스킬 '"+q[0]+"' ("+q[1]+'s)').join('\n'); }
/* 보스: [key, 이름, 한 사람 몫 체력, 몸 크기, 걸음 배수, 색, 무기 그림, [스킬…]] */
const BOSSES=[
 ['b_gobking','고블린 왕',850,1,.9,'#6fae3a','mace',[['왕의 철퇴',5,'arc',4,60,{fx:{knock:2}}],['부하 부르기',25,'none',0,0,{summon:['m_gob',2]}],['광란',30,'none',0,0,{haste:[.4,6]}]]],
 ['b_skull','해골 군주',1000,1.1,.85,'#e0dcc8','sword',[['큰 낫',5,'arc',5,60],['뼈 폭풍',20,'circle',7,90,{tele:2}],['일으키기',30,'none',0,0,{summon:['m_skel',2]}],['죽음의 창',8,'proj',14,60]]],
 ['b_swamp','늪의 여왕',1000,1.2,.8,'#4a8a5a','claws',[['촉수 채찍',5,'line',8,70,{tele:1.2,fx:{root:1}}],['독 포자',14,'spot',4,60,{tele:1.5,reach:10}],['두꺼비 떼',30,'none',0,0,{summon:['m_toad',2]}]]],
 ['b_fgiant','화염 거인',1250,1.6,.75,'#e0562a','fists',[['용암 주먹',5,'arc',6,110,{tele:1.5,fx:{knock:4}}],['분화',30,'circle',9,140,{tele:3}],['화염탄',8,'proj',14,75,{n:3}]]],
 ['b_shadow','그림자 군주',1100,1,1,'#3a2a5a','dagger',[['그림자 넘기',7,'circle',4,90,{move:['blink',8]}],['그림자 칼날',9,'proj',13,100,{n:5}],['칠흑',25,'circle',8,100,{tele:2.5,fx:{silence:2}}]]],
 ['b_paladin','타락한 성기사',1150,1,.9,'#c8b06a','mace',[['심판',9,'line',10,100,{tele:1.2,fx:{stun:1}}],['돌격',10,'line',8,80,{move:['dash',8]}],['거짓 성역',35,'none',0,0,{heal:150,shield:[150,8]}],['내려찍기',5,'arc',4.5,70]]],
 ['b_storm','폭풍 정령',1100,1.2,1.05,'#8ad0ff','wand',[['낙뢰',5,'spot',3,80,{tele:1,reach:12}],['돌풍',14,'circle',8,40,{fx:{knock:6}}],['번개 사슬',9,'proj',14,90,{n:3}]]],
 ['b_fdragon','서리 용',1350,1.8,.8,'#9fd8f0','claws',[['냉기 숨결',10,'arc',10,150,{tele:2,hits:5,fx:{slow:[.4,3]}}],['꼬리 후리기',14,'circle',7,120,{tele:1.5,fx:{knock:5}}],['얼음 창',6,'proj',15,70]]],
 ['b_eye','심연의 눈',1300,1.5,.7,'#b04ad8','wand',[['응시',12,'line',16,140,{tele:2}],['공허 폭발',9,'spot',6,100,{tele:1.5,reach:12}],['침묵의 파동',22,'circle',9,50,{tele:1.5,fx:{silence:2.5}}]]],
 ['b_guardian','고대 수호자',1550,1.9,.7,'#b8a070','fists',[['땅 울림',22,'circle',10,160,{tele:3}],['빛줄기',10,'line',14,120,{tele:1.5}],['고대 방벽',40,'none',0,0,{shield:[300,10]}],['짓누르기',5,'arc',5,80,{fx:{knock:3}}]]]
,
 /* 아래는 구글 시트(바코드RPG 기획 · '가횟 0'의 Monsters)에 이름과 체력이 있는 보스·정예다. 시트에는 스킬이 없어 스킬은 시험장에서 만들었다. 아홉째 칸 = 시트의 체력 */
 ['s_urkan','우르칸',900,1.3,.9,'#8a6a4a','claws',[['할퀴기',4,'arc',4,55],['덮치기',9,'circle',4,80,{move:['leap',6],fx:{stun:.6}}],['포효',20,'circle',8,30,{tele:1.2,fx:{slow:[.4,3]}}]],24000],
 ['s_lion','사자',700,1,1.15,'#d8a84a','claws',[['물어뜯기',3.5,'arc',3,45],['도약',7,'circle',3,60,{move:['leap',7]}],['사자후',18,'circle',7,20,{fx:{silence:1.5}}]],4600],
 ['s_behemoth','베히모스',1500,2,.7,'#5a7a4a','fists',[['짓밟기',6,'circle',6,110,{tele:1.2,fx:{air:2}}],['돌진',12,'line',10,120,{tele:1,move:['dash',10],fx:{knock:4}}],['대지 가르기',24,'line',14,160,{tele:2.2}],['뿔 치받기',5,'arc',5,80,{fx:{knock:3}}]],120000],
 ['s_centaur','켄타우르스',950,1.2,1.2,'#a07a5a','spear',[['창 찌르기',4,'line',6,60],['질주',8,'line',9,80,{move:['dash',9],fx:{knock:2}}],['화살비',14,'spot',5,70,{tele:1.3,reach:12}]],32000],
 ['s_scorpion','스콜피온',1400,1.6,.9,'#c8a04a','claws',[['집게',4,'arc',4.5,70,{fx:{root:.6}}],['독침',7,'proj',13,90,{fx:{slow:[.4,3]}}],['모래 폭풍',22,'circle',9,90,{tele:2,hits:3,fx:{blind:2}}],['파고들기',15,'circle',4,100,{move:['blink',8],fx:{air:2}}]],480000],
 ['s_cactus','기형선인장',1100,1.4,.5,'#5fae5a','fists',[['가시 발사',3,'proj',14,60,{n:5}],['가시 폭발',12,'circle',7,110,{tele:1.5}],['뿌리 뻗기',10,'spot',3,50,{tele:1,reach:12,fx:{root:1.5}}]],250000],
 ['s_sphinx','스핑크스',1600,1.7,.8,'#e0c06a','wand',[['수수께끼',16,'circle',9,60,{tele:2,fx:{silence:2.5}}],['석화의 눈',12,'line',14,120,{tele:1.5,fx:{stun:1.2}}],['모래 기둥',7,'spot',3.5,90,{tele:1,reach:12,fx:{air:3}}],['앞발 내려치기',5,'arc',5,80]],720000],
 ['s_pyrite','파이라이트',1200,1.3,.85,'#d8c85a','mace',[['황철 강타',5,'arc',4.5,80,{fx:{stun:.5}}],['파편 사격',6,'proj',13,75,{n:3}],['광맥 폭발',18,'circle',8,130,{tele:2}],['금속 외피',30,'none',0,0,{shield:[200,8],resist:[.2,8]}]],40635],
 ['s_dynamis','듀나미스',1900,1.8,.8,'#b08ad8','wand',[['힘의 파동',6,'circle',7,90,{fx:{knock:4}}],['중력 붕괴',20,'spot',6,150,{tele:2,reach:12,fx:{pull:4}}],['유적의 빛',10,'line',16,130,{tele:1.5}],['모래 병사',35,'none',0,0,{summon:['m_skel',3]}],['궤멸',45,'circle',11,200,{tele:3.5}]],406350]
];
for(const [key,name,hp,rad,spd,col,w,L,sheet] of BOSSES){ defMon(key,{name:'보스, '+name,col,rad,made:true,range:L.some(q=>q[2]==='proj')?7:2.6,speedMod:()=>spd,skills:foeSkills(L,true),note:'시험장에서 만든 보스다. 카드에 없다. 체력 '+hp+'(한 사람 몫).'}); MONS.push(key); MONHP[key]={fit:hp,card:sheet||hp}; if(sheet) CH[key].note='구글 시트에 이름과 체력('+sheet.toLocaleString()+')이 있는 보스다. 시트에 스킬이 없어 스킬은 시험장에서 만들었다. 시험장 맞춤 체력 '+hp+'(한 사람 몫).';
  CH[key].hud=e=>(e.busy>now?'시전 중 · ':'')+Object.entries(CH[key].skills).slice(1).map(x=>x[1].name+' '+Math.ceil(e.cd[x[0]])+'s').join(' · '); LOOK[key]={el:'arcane',w,hair:col,acc:['horns']};
  BRAIN[key]=(e,t,d)=>{ e.ai.want=CH[key].range>3?5:2.4; for(const s of ['x2','x1','aw','n2','n1']){ const k=CH[key].skills[s]; if(k&&d<=k.r+(t.rad||0)+.5&&go(e,s)) return true; } };
  CARDTEXT[key]="' "+name+" '\n(시험장 제작 보스)\nHP : "+hp+' (한 사람 몫)\n\n'+L.map(q=>"'"+q[0]+"' ("+q[1]+'s)'+(q[5]&&q[5].tele?' · 캐스팅 '+q[5].tele+'초':'')+(q[4]?' · '+q[4]+' 피해':'')).join('\n'); }
/* 등반에서 보스가 나오는 순서(약한 것부터) */
const TBOSS=['s_lion','korhen','s_urkan','b_gobking','s_centaur','golem','b_skull','b_swamp','s_cactus','s_pyrite','ggolem','b_fgiant','b_shadow','s_scorpion','b_paladin','b_storm','s_behemoth','hydra','s_sphinx','b_fdragon','b_eye','s_dynamis','b_guardian'];

/* 저장해 둔 보스가 여기서 만든 보스였다면, 이제 화면을 다시 맞춘다 */
modeNote(); drawSum(); drawSel();
