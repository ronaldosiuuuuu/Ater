"use strict";
/* 구글 문서 '보스 문서'의 보스 여덟. 문서에는 패턴의 생김새만 있고 수치(체력·피해·범위·대기시간)가 없다.
   그래서 여기 있는 숫자는 모두 시험장에서 정한 값이다. 문서에 숫자가 있는 것(체력 50% 미친척, 지진파 3번, 늪 4초 즉사, 수컷 개미 2마리,
   세 번 할퀴기와 추가 2회, 시간 조작 5초·대기시간 60초, 왕홀 3발·5발, 사암 기둥 2~3개, 당구 돌 3개)은 문서 그대로 옮겼다.
   기술 이름은 몇 개를 바꿨다(각 보스의 note에 적었다). 보스를 고치려면 아래 defMon 덩이의 숫자를 바꾸면 된다. */
/* 미친척 모드: 체력이 절반 아래로 내려가면 한 번 켜진다. quick이면 대기시간이 35% 빨리 돈다 */
function dbTick(e,dt,quick){ if(!e.r.mad&&e.hp<=e.max*.5){ e.r.mad=true; msg([['⚠ '+e.c.name.replace(/^.*, /,'')+' ','#ff7d8c'],['미친척 모드','#fff6d6']],e.team,true); puff(e.x,e.y,'blood',26,7); if(e.c.onMad) e.c.onMad(e); }
  if(e.r.mad&&quick) for(const k in e.cd) if(k!=='b'&&e.cd[k]>0) e.cd[k]=Math.max(0,e.cd[k]-dt*.35); }
/* 예고: 보스가 멈추지 않고 자리에 범위만 먼저 보인다 */
function dbWarn(e,x,y,r,T,label,fn){ x=Math.max(1,Math.min(W-1,x)); y=Math.max(1,Math.min(H-1,y)); zone(e,{x,y,r,dur:T,label}); fx.push({k:'circle',x,y,r,t0:now,dur:T,team:e.team,lab:label,src:e}); after(T,()=>{ if(!e.dead&&!over) fn({x,y,z:0}); }); }
const dbLow=e=>foes(e).slice().sort((a,b)=>a.hp-b.hp)[0], dbFar=e=>foes(e).slice().sort((a,b)=>dist(e,b)-dist(e,a))[0], dbNear=e=>foes(e).slice().sort((a,b)=>dist(e,a)-dist(e,b))[0], dbAny=e=>{ const L=foes(e); return L[Math.floor(Math.random()*L.length)]; };
const dbFace=(e,t)=>{ if(t) e.aim=norm(t.x-e.x,t.y-e.y); };
const dbGo=(e,p)=>{ puff(e.x,e.y,'earth',12,4); e.x=p.x; e.y=p.y; clamp(e); puff(e.x,e.y,'earth',14,5); };
const DB=[];  /* [key, 시험장 맞춤 체력, 난이도(2 결속 · 3 군주 · 4 위신), 문서의 레벨] */
function defDoc(key,hp,tier,lv,o,look,brain){ o.init=o.init||(e=>{e.r={}}); const i0=o.init; o.init=e=>{ i0(e); e.r.mad=false; }; const q=o.quick; if(!o.tick) o.tick=(e,dt)=>dbTick(e,dt,q);
  o.note='구글 문서 「보스 문서」의 보스다(문서의 레벨 '+lv+'). 문서에 수치가 없어 체력·피해·범위·대기시간은 시험장에서 정했다. 시험장 맞춤 체력 '+hp+'(한 사람 몫). '+(o.note||'');
  o.made=true; defMon(key,o); MONS.push(key); MONHP[key]={fit:hp,card:hp}; MONTIER[key]=tier; LOOK[key]=look; BRAIN[key]=brain; DB.push(key);
  CH[key].hud=e=>(e.r.mad?'미친척 · ':'')+(e.busy>now?'시전 중 · ':'')+Object.entries(CH[key].skills).filter(x=>x[0]!=='n1').map(x=>x[1].name+' '+Math.ceil(e.cd[x[0]])+'s').join(' · ');
  CARDTEXT[key]="' "+o.name.replace(/^.*, /,'')+" '\n(보스 문서 · 수치는 시험장에서 정함)\n레벨 : "+lv+' / HP : '+hp+' (한 사람 몫)\n체력 50% 아래에서 미친척 모드\n\n'+Object.values(o.skills).map(s=>"'"+s.name+"' ("+s.cd+'s)'+(s.txt?' · '+s.txt:'')).join('\n'); }

/* ───── 1. 우르사온 (결속) ───── */
defDoc('d_ursaon',2000,2,30,{name:'보스, 우르사온',col:'#8a5a3a',rad:1.5,speedMod:e=>e.r.mad?1.05:.9,
  skills:{
   n1:{name:'할퀴기',kind:'기본 공격',cd:3.5,r:4,txt:'미친척: 패악질(마구 할퀸 뒤 내려찍어 충격파)',cast(e){ if(!e.r.mad){ S.arc(e,4,45,'할퀴기',{knock:1,v:'claw'}); return; }
      e.cd.n1=5; S.focus(e,1.7); for(let i=0;i<4;i++) after(i*.2,()=>{ if(!e.dead&&!over) S.arc(e,4,14,'패악질',{knock:0,v:'claw'}); }); after(.9,()=>{ if(e.dead||over) return; dbWarn(e,e.x,e.y,5,.7,'패악질',()=>S.circle(e,5,80,'패악질',{air:1.5,knock:2,zfree:true,v:'quake',el:'earth'})); }); }},
   n2:{name:'밥상 뒤집기',kind:'집중 마법',cd:11,r:8,txt:'돌진한 뒤 붙잡아 뒤로 넘긴다',cast(e){ S.focus(e,.6); const d=e.aim; after(.6,()=>{ if(e.dead||over) return; S.leap(e,d,7,24,()=>{ foes(e).filter(t=>dist(e,t)<=3.2+(t.rad||R)).forEach(t=>{ strike(e,t,70,'밥상 뒤집기',{knock:0}); if(!t.dead&&!t.c.heavy){ t.x=e.x-d.x*3.5; t.y=e.y-d.y*3.5; clamp(t); air(t,2); } }); fx.push({k:'circle',x:e.x,y:e.y,r:3.2,t0:now,team:e.team,ring:true,lab:'밥상 뒤집기',src:e}); },true); }); }},
   aw:{name:'무게추',kind:'집중 마법',cd:14,r:12,txt:'뛰어올라 뭉갠다 · 미친척: 절반 확률로 이어서 다시',cast(e){ const go=n=>{ const t=dbNear(e); if(!t||e.dead||over) return; const at={x:t.x,y:t.y}; monCast(e,1.1,4,'무게추',()=>{ dbGo(e,at); S.circle(e,4,110,'무게추',{knock:2,stun:.4,zfree:true,v:'quake',el:'earth'}); if(e.r.mad&&n<2&&Math.random()<.5) after(.3,()=>go(n+1)); },at); }; go(0); }},
   x1:{name:'그라하하',kind:'집중 마법',cd:22,r:12,txt:'함성. 보스 곁 4.5칸 안은 안전하다 · 미친척: 종유석이 떨어진다',cast(e){ fx.push({k:'circle',x:e.x,y:e.y,r:4.5,t0:now,dur:2,team:1-e.team,lab:'안전',src:e,fol:e}); msg([['⚠ 그라하하 ','#ff7d8c'],['보스 곁으로 붙어라','#fff6d6']],e.team,true);
      monCast(e,2,12,'그라하하',()=>{ fx.push({k:'circle',x:e.x,y:e.y,r:12,t0:now,team:e.team,ring:true,lab:'그라하하',src:e,v:'nova'}); foes(e).filter(t=>{ const d=dist(e,t); return d>4.5+e.rad&&d<=12+R; }).forEach(t=>strike(e,t,130,'그라하하',{slow:[.3,2],knock:0}));
        if(e.r.mad) foes(e).forEach(t=>{ for(let i=0;i<3;i++) after(i*.5,()=>{ if(t.dead||e.dead||over) return; dbWarn(e,t.x+(Math.random()-.5)*3,t.y+(Math.random()-.5)*3,2.4,1.2,'종유석',p=>S.circle(e,2.4,70,'종유석',{stun:.5,knock:0,v:'quake',el:'earth'},p)); }); }); }); }},
   x2:{name:'당구',kind:'집중 마법',cd:18,r:16,txt:'굴러온 바위를 받아 넘겨 터뜨린다 · 미친척: 돌 3개',cast(e){ const n=e.r.mad?3:1,d=e.aim; S.focus(e,n*1.4+.4); for(let i=0;i<n;i++) after(i*1.4,()=>{ if(e.dead||over) return; const p0={x:Math.max(1,Math.min(W-1,e.x+d.x*14)),y:Math.max(1,Math.min(H-1,e.y+d.y*14))},L=Math.hypot(p0.x-e.x,p0.y-e.y); if(L<2) return; const b=norm(e.x-p0.x,e.y-p0.y);
        S.proj(e,b,{x:p0.x,y:p0.y,sx:p0.x,sy:p0.y,speed:14,range:L-1.5,dmg:50,label:'굴러오는 바위',big:true,pierce:true,v:'orb',onEnd:()=>{ const t=dbAny(e); if(!t||e.dead||over) return; dbWarn(e,t.x,t.y,3.5,.9,'당구',p=>S.circle(e,3.5,110,'당구',{knock:2,v:'nova',el:'earth'},p)); }}); }); }}
  },note:"'패악질'은 미친척 모드의 할퀴기다. '그라하하'는 문서대로 보스 가까이(4.5칸 안)에 있으면 맞지 않는다. '당구'의 바위는 보스 앞 14칸에서 굴러온다. 문서의 '/ Q'와 당구의 박준형 언급은 뜻을 알 수 없어 빼 두었다."},
 {el:'earth',w:'claws',hair:'#5a3a22',acc:['horns']},
 (e,t,d)=>{ e.ai.want=2.6; if(d<=11&&go(e,'x1')) return true; if(d<=15&&go(e,'x2')) return true; if(d<=12&&d>3&&go(e,'aw')) return true; if(d<=8&&go(e,'n2')) return true; if(d<=4+t.rad+.4&&go(e,'n1')) return true; });

/* ───── 2. 드리아드 (결속) ───── */
defDoc('d_dryad',2200,2,60,{name:'보스, 드리아드',col:'#5fae5a',rad:1.4,range:8,quick:true,speedMod:()=>.55,
  skills:{
   n1:{name:'나뭇잎',kind:'기본 공격',cd:2.5,r:14,cast(e){ S.proj(e,e.aim,{speed:20,range:15,dmg:30,label:'나뭇잎',v:'stake'}); }},
   n2:{name:'잎보라',kind:'기본 공격',cd:8,r:13,txt:'나뭇잎 5장 · 미친척: 9장 + 둔화',cast(e){ const n=e.r.mad?9:5,a0=Math.atan2(e.aim.y,e.aim.x); for(let i=0;i<n;i++){ const a=a0+(i-(n-1)/2)*.16; S.proj(e,{x:Math.cos(a),y:Math.sin(a)},{speed:18,range:14,dmg:e.r.mad?26:24,label:'잎보라',v:'stake',o:e.r.mad?{slow:[.35,2]}:null}); } }},
   aw:{name:'크아악',kind:'기본 공격',cd:9,r:4,txt:'가까운 적을 뿌리로 멀리 밀친다 · 미친척: 뿌리 고리 추가 피해',cast(e){ S.circle(e,4.5,50,'크아악',{knock:8,zfree:true,v:'spin',el:'nature'}); if(e.r.mad) dbWarn(e,e.x,e.y,8.5,.9,'뿌리 고리',()=>{ fx.push({k:'circle',x:e.x,y:e.y,r:8.5,t0:now,team:e.team,ring:true,lab:'뿌리 고리',src:e}); foes(e).filter(t=>dist(e,t)>4.5&&dist(e,t)<=8.5+R).forEach(t=>strike(e,t,70,'뿌리 고리',{knock:0})); }); }},
   x1:{name:'응애',kind:'집중 마법',cd:24,r:30,txt:'따라와서 터지는 애기 묘목 3 · 미친척: 5',cast(e){ const n=e.r.mad?5:3; S.focus(e,.8); for(let i=0;i<n;i++) after(.3+i*.35,()=>{ if(e.dead||over) return; const t=dbAny(e); if(!t) return; const a=Math.random()*6.283; S.proj(e,{x:Math.cos(a),y:Math.sin(a)},{speed:5.2,range:60,life:7,home:t,dmg:0,nohit:true,big:true,label:'애기 묘목',v:'orb',onEnd:p=>{ if(!e.dead) S.circle(e,2.6,60,'묘목 폭발',{knock:1,v:'nova',el:'nature'},{x:p.x,y:p.y,z:0}); }}); }); }},
   x2:{name:'두더지잡기',kind:'집중 마법',cd:16,r:30,txt:'무작위 자리에 뿌리가 솟아 발을 묶는다 · 미친척: 더 빠르고 길게',cast(e){ const m=e.r.mad,L=foes(e); if(!L.length) return; for(let i=0;i<(m?9:6);i++) after(i*.25,()=>{ const t=L[i%L.length]; if(e.dead||over||t.dead) return; const a=Math.random()*6.283,d=i<L.length?0:Math.random()*4; dbWarn(e,t.x+Math.cos(a)*d,t.y+Math.sin(a)*d,2,m?.7:1.1,'두더지잡기',p=>S.circle(e,2,55,'두더지잡기',{root:m?2.2:1.2,knock:0,v:'stake',el:'nature'},p)); }); }},
   x3:{name:'구아아악',kind:'의식/집중 마법',cd:45,r:30,txt:'6초 동안 움직이는 뿌리가 발을 묶는다 · 미친척: 끝날 때 묶여 있으면 체력이 1이 된다',cast(e){ const m=e.r.mad; msg([['⚠ 구아아악 ','#ff7d8c'],[m?'6초 뒤 묶여 있으면 생명을 빼앗긴다':'움직이는 뿌리를 피해라','#fff6d6']],e.team,true); S.focus(e,1.2);
      for(let i=0;i<5;i++){ const a=i*1.2566; zone(e,{x:Math.max(2,Math.min(W-2,e.x+Math.cos(a)*7)),y:Math.max(2,Math.min(H-2,e.y+Math.sin(a)*7)),r:2.4,dur:6,every:.5,chase:dbAny(e),speed:3.6,label:'뿌리',tick:(z,inn)=>{ inn.forEach(t=>{ damage(e,t,12,'구아아악'); add(t,'root',.7,0,{by:e}); }); if(!z.chase||z.chase.dead||Math.random()<.15) z.chase=dbAny(e); }}); }
      if(m) after(6,()=>{ if(e.dead||over) return; foes(e).filter(t=>has(t,'root')).forEach(t=>{ const take=Math.max(0,t.hp-1); if(take>0){ t.hp=1; say(t,'생명 갈취','#8fe36b'); heal(e,take*.5); } }); }); }}
  },note:"'나뭇잎 날리기'는 '잎보라'로 이름을 바꿨다. '구아아악'의 미친척 판은 문서의 '체력·마나 1로 고정'을 6초가 끝나는 순간 뿌리에 묶여 있는 적의 체력을 1로 만드는 것으로 옮겼다(이 게임에는 마나가 없다). 빼앗은 체력의 절반만큼 보스가 회복한다. 애기 묘목은 따라오다 닿으면(또는 7초 뒤) 터진다."},
 {el:'nature',w:'ringstaff',hair:'#2f6a2a',acc:['horns']},
 (e,t,d)=>{ e.ai.want=7; if(go(e,'x3')) return true; if(go(e,'x1')) return true; if(go(e,'x2')) return true; if(d<=4.2+t.rad&&go(e,'aw')) return true; if(d<=12&&go(e,'n2')) return true; if(d<=14&&go(e,'n1')) return true; });

/* ───── 3. 미노타우로스 (결속) ───── */
defDoc('d_mino',2400,2,100,{name:'보스, 미노타우로스',col:'#a0522d',rad:1.6,quick:true,speedMod:()=>.95,
  onKill(e,t){ if(e.r.mad&&e.r.combo===t&&e.r.comboT>now){ heal(e,e.max*.08); proc(e,'연속 강타','쓰러뜨려 회복'); } if(e.r.maze>now){ heal(e,e.max*.1); proc(e,'다이달로스의 미궁','미궁의 죽음으로 회복'); } },
  skills:{
   n1:{name:'펀치',kind:'기본 공격',cd:3,r:4,cast(e){ S.arc(e,4,50,'펀치',{knock:1,v:'punch'}); }},
   n2:{name:'범퍼카',kind:'집중 마법',cd:14,r:14,txt:'물러났다가 벽까지 돌진, 부딪히면 충격파 · 미친척: 충격파에 큰 둔화',cast(e){ const d=e.aim; S.focus(e,1); S.leap(e,{x:-d.x,y:-d.y},3,14,null,true); after(.9,()=>{ if(e.dead||over) return; let L=40; if(d.x>.01) L=Math.min(L,(W-1.5-e.x)/d.x); if(d.x<-.01) L=Math.min(L,(1.5-e.x)/d.x); if(d.y>.01) L=Math.min(L,(H-1.5-e.y)/d.y); if(d.y<-.01) L=Math.min(L,(1.5-e.y)/d.y); L=Math.max(1,L); const p0={x:e.x,y:e.y}; e.busy=now+L/30+.3;
        S.leap(e,d,L,30,()=>{ S.seg(e,p0,{x:e.x,y:e.y},2.8,80,'범퍼카',{knock:3,v:'punch'}); S.circle(e,6,70,'범퍼카 충격파',{knock:2,zfree:true,v:'quake',el:'earth',slow:e.r.mad?[.6,3]:null}); },true); }); }},
   aw:{name:'광우병',kind:'집중 마법',cd:16,r:9,txt:'포효로 끌어당긴 뒤 휘둘러 밀친다 · 미친척: 밀쳐진 적 기절',cast(e){ monCast(e,1.2,9,'광우병',()=>{ foes(e).filter(t=>dist(e,t)<=9+R).forEach(t=>knock(t,e,-Math.max(0,dist(e,t)-2.5))); S.focus(e,.6); after(.5,()=>{ if(!e.dead&&!over) S.circle(e,5,90,'광우병',{knock:7,stun:e.r.mad?1.2:0,zfree:true,v:'spin'}); }); }); }},
   x1:{name:'연속 강타',kind:'집중 마법',cd:18,r:30,txt:'체력이 가장 낮은 적에게 달려가 다섯 번 친다 · 미친척: 그 적이 쓰러지면 회복',cast(e){ const t=dbLow(e); if(!t) return; dbFace(e,t); e.r.combo=t; e.r.comboT=now+4; const d=Math.max(0,dist(e,t)-2.6); e.busy=now+d/26+1.3;
      S.leap(e,e.aim,d,26,()=>{ for(let i=0;i<5;i++) after(i*.2,()=>{ if(e.dead||over) return; if(!t.dead) dbFace(e,t); S.arc(e,4,22,'연속 강타',{knock:0,v:'punch'}); }); },true); }},
   x2:{name:'지진파',kind:'집중 마법',cd:22,r:30,txt:'충격파 3번. 점프하지 않으면 큰 피해 · 미친척: 기절',cast(e){ S.focus(e,3.4); msg([['⚠ 지진파 ','#ff7d8c'],['점프로 세 번 넘어라','#fff6d6']],e.team,true); for(let i=0;i<3;i++){ after(i*1.1,()=>{ if(!e.dead&&!over) fx.push({k:'circle',x:e.x,y:e.y,r:16,t0:now,dur:1,team:e.team,lab:'지진파 — 점프',src:e}); });
        after(i*1.1+1,()=>{ if(e.dead||over) return; fx.push({k:'circle',x:e.x,y:e.y,r:16,t0:now,team:e.team,ring:true,lab:'지진파',src:e,v:'quake',el:'earth'}); foes(e).filter(t=>dist(e,t)<=16+R&&(t.z||0)<.3).forEach(t=>strike(e,t,95,'지진파',{knock:0,stun:e.r.mad?.8:0})); }); } }},
   x3:{name:'미궁 탐사',kind:'의식/집중 마법',cd:60,r:30,can:e=>e.r.mad||foes(e).length>=2,need:'적 둘 이상',txt:'한 명만 빼고 가둔다. 남은 한 명이 쓰러지면 갇힌 모두가 쓰러진다 · 미친척: 다이달로스의 미궁(모두 가두고 지속 피해)',cast(e){ SNAME.dmaze='미궁'; const L=foes(e);
      if(e.r.mad){ e.r.maze=now+6; msg([['⚠ 다이달로스의 미궁 ','#ff7d8c'],['6초 동안 버텨라','#fff6d6']],e.team,true); L.forEach(t=>{ add(t,'dmaze',6,0,{by:e}); add(t,'slow',6,.5,{by:e}); for(let i=1;i<=6;i++) after(i,()=>{ if(!t.dead&&!e.dead&&!over) damage(e,t,18,'다이달로스의 미궁'); }); }); return; }
      const free=L[Math.floor(Math.random()*L.length)],cage=L.filter(t=>t!==free); e.r.free=free; e.r.cage=cage; e.r.cageT=now+6; msg([['⚠ 미궁 탐사 ','#ff7d8c'],[short(free)+'만 남았다. 쓰러지면 모두 쓰러진다','#fff6d6']],e.team,true); cage.forEach(t=>{ add(t,'dmaze',6,0,{by:e}); add(t,'root',6,0,{by:e}); add(t,'silence',6,0,{by:e}); }); }}
  },
  tick(e,dt){ dbTick(e,dt,true); if(e.r.cageT>now&&e.r.free&&e.r.free.dead&&!e.r.free.cageDone){ e.r.free.cageDone=true; e.r.cageT=0; (e.r.cage||[]).forEach(t=>{ if(!t.dead) damage(e,t,99999,'미궁',{fixed:true}); }); } },
  note:"'미궁 탐사'는 지형을 만들 수 없어 이렇게 줄였다: 갇힌 사람은 6초 동안 움직이지도 스킬을 쓰지도 못하고, 그동안 남은 한 명이 쓰러지면 갇힌 모두가 쓰러진다. 혼자 싸울 때는 미친척 전에는 쓰지 않는다. '다이달로스의 미궁'은 6초 동안 모두가 느려지고 매초 피해를 받으며, 그동안 누가 쓰러질 때마다 보스가 체력을 10% 회복한다. '지진파'는 땅에 붙어 있는 적만 맞는다."},
 {el:'earth',w:'fists',hair:'#5a2a12',acc:['horns','pauldrons']},
 (e,t,d)=>{ e.ai.want=2.6; if(go(e,'x3')) return true; if(d<=14&&go(e,'x2')) return true; if(go(e,'x1')) return true; if(d<=8&&go(e,'aw')) return true; if(d>5&&d<=14&&go(e,'n2')) return true; if(d<=4+t.rad+.4&&go(e,'n1')) return true; });

/* ───── 4. 거인 (군주) ───── */
defDoc('d_giant',2900,3,140,{name:'보스, 진흙 거인',col:'#7a6a4a',rad:2,speedMod:e=>(e.r.mad?.9:.7)*(e.r.mad&&e.r.dry>now?1.5:1),
  init:e=>{e.r={dive:0,dry:0,th:0}},
  modTake(e,src,amt){ if(e.r.dive>now) return 0; return e.r.dry>now?amt*.5:amt; },
  onHurt(e,src,amt){ if(e.r.mad&&e.r.dry>now&&src&&src!==e&&!src.dead&&e.r.th<=now){ e.r.th=now+.5; damage(e,src,35,'미쳐버린 진흙'); e.ai&&(e.ai.tg=src); } },
  skills:{
   n1:{name:'펀치',kind:'기본 공격',cd:3.5,r:5,txt:'밀치고 둔화 · 미친척: 큰 피해 + 속박',cast(e){ if(e.r.mad) S.arc(e,5,95,'펀치',{knock:1,root:1,v:'punch',el:'earth'}); else S.arc(e,5,60,'펀치',{knock:3,slow:[.3,2],v:'punch',el:'earth'}); }},
   n2:{name:'내려치기',kind:'집중 마법',cd:10,r:6,txt:'밀치고 띄운다 · 미친척: 더 크게',cast(e){ const m=e.r.mad; monCast(e,1.2,m?7.5:6,'내려치기',()=>S.circle(e,m?7.5:6,m?140:100,'내려치기',{knock:3,air:m?3:2,zfree:true,v:'quake',el:'earth'})); }},
   aw:{name:'진흙 늪',kind:'집중 마법',cd:16,r:14,txt:'지속 피해와 둔화 · 미친척: 넓어지고, 4초 넘게 있으면 즉사',cast(e){ const t=dbAny(e); if(!t) return; const m=e.r.mad,inT=new Map(); if(m) msg([['⚠ 진흙 늪 ','#ff7d8c'],['4초 넘게 있으면 삼켜진다','#fff6d6']],e.team,true); S.focus(e,.6);
      zone(e,{x:t.x,y:t.y,r:m?7:5,dur:8,every:.5,label:'진흙 늪',tick:(z,inn)=>{ for(const k of [...inT.keys()]) if(!inn.includes(k)) inT.delete(k); inn.forEach(x=>{ damage(e,x,12,'진흙 늪'); add(x,'slow',.7,.5,{by:e}); const n=(inT.get(x)||0)+1; inT.set(x,n); if(m){ if(n>=8){ say(x,'삼켜졌다','#ff7d8c'); damage(e,x,99999,'진흙 늪',{fixed:true}); } else if(n>=4) say(x,'삼켜지기까지 '+((8-n)/2).toFixed(1),'#ffd36b'); } }); }}); }},
   x1:{name:'진흙 잠수',kind:'집중 마법',cd:15,r:30,txt:'땅속으로 들어가 체력이 가장 적은 적 밑에서 튀어나온다 · 미친척: 큰 피해 + 속박',cast(e){ const t=dbLow(e); if(!t) return; S.focus(e,1.7); e.r.dive=now+1.6; say(e,'잠수','#c9b58a'); puff(e.x,e.y,'earth',20,5);
      after(.6,()=>{ if(e.dead||over) return; const q=t.dead?dbLow(e):t; if(!q){ e.r.dive=0; return; } dbWarn(e,q.x,q.y,4,1,'진흙 잠수',p=>{ dbGo(e,p); e.r.dive=0; S.circle(e,4,e.r.mad?160:110,'진흙 잠수',{air:2,root:e.r.mad?1.5:0,knock:0,zfree:true,v:'quake',el:'earth'}); }); }); }},
   x2:{name:'메마른 진흙',kind:'지속 마법',cd:28,r:30,txt:'6초 동안 받는 피해 절반, 주변 지속 피해 · 미친척: 때린 적이 큰 피해를 받고 보스가 쫓아온다',cast(e){ e.r.dry=now+6; proc(e,e.r.mad?'미쳐버린 진흙':'메마른 진흙','받는 피해 절반'); if(e.r.mad) msg([['⚠ 미쳐버린 진흙 ','#ff7d8c'],['6초 동안 때리면 되돌아온다','#fff6d6']],e.team,true); zone(e,{x:e.x,y:e.y,r:5,dur:6,every:1,chase:e,speed:99,label:e.r.mad?'미쳐버린 진흙':'메마른 진흙',tick:(z,inn)=>inn.forEach(t=>damage(e,t,20,'메마른 진흙'))}); }}
  },note:"문서의 '거인'이다(패턴이 모두 진흙이라 이름에 '진흙'을 붙였다). '진흙 잠수' 동안에는 피해를 받지 않는다. '미쳐버린 진흙'은 6초 동안 보스를 때린 적이 0.5초에 한 번 35 피해를 돌려받고, 보스가 빨라진다."},
 {el:'earth',w:'fists',hair:'#4a3a22',acc:['pauldrons']},
 (e,t,d)=>{ e.ai.want=3; if(go(e,'x2')) return true; if(go(e,'x1')) return true; if(d<=13&&go(e,'aw')) return true; if(d<=6&&go(e,'n2')) return true; if(d<=5+t.rad+.4&&go(e,'n1')) return true; });

/* ───── 5. 박준형 (군주) ───── */
defDoc('d_park',2800,3,160,{name:'보스, 박준형',col:'#c8a04a',rad:1,speedMod:()=>1.05,
  skills:{
   n1:{name:'칼질',kind:'기본 공격',cd:2.5,r:3.5,txt:'화약을 묻힌다(6초) · 미친척: 큰 피해 + 밀치기',cast(e){ SNAME.powder='화약'; const m=e.r.mad; S.arc(e,3.5,m?75:45,'칼질',{knock:m?3:0,v:'cut',post:t=>add(t,'powder',6,0,{by:e})}); }},
   n2:{name:'대포',kind:'집중 마법',cd:9,r:18,txt:'좌우의 원숭이가 대포를 쏜다. 화약이 묻은 적은 더 크게 맞는다 · 미친척: 세 번 연달아',cast(e){ const n=e.r.mad?3:1,d=e.aim,px={x:-d.y,y:d.x}; S.focus(e,.5+n*.45); for(let k=0;k<n;k++) after(.4+k*.45,()=>{ if(e.dead||over) return; for(const s of [-1,1]){ const p0={x:Math.max(1,Math.min(W-1,e.x+px.x*4*s)),y:Math.max(1,Math.min(H-1,e.y+px.y*4*s))},t=dbAny(e); if(!t) continue; const b=norm(t.x-p0.x,t.y-p0.y); puff(p0.x,p0.y,'fire',8,4);
          S.proj(e,b,{x:p0.x,y:p0.y,sx:p0.x,sy:p0.y,speed:19,range:22,dmg:x=>has(x,'powder')?120:55,label:'대포',big:true,v:'orb',o:{post:x=>{ if(has(x,'powder')){ rm(x,'powder'); say(x,'화약 폭발','#ffb347'); puff(x.x,x.y,'fire',16,6); } }}}); } }); }},
   aw:{name:'동료 소환',kind:'집중 마법',cd:28,r:30,txt:'산적 2 · 미친척: 인맥 찬스(산적 두목까지)',cast(e){ S.focus(e,.6); if(e.r.mad){ proc(e,'인맥 찬스','동료가 몰려온다'); summon(e,'m_chief',1); summon(e,'m_bandit',3); } else summon(e,'m_bandit',2); }},
   x1:{name:'점프 찍기',kind:'집중 마법',cd:11,r:12,txt:'뛰어올라 찍는다 · 미친척: 스카이 콩콩(세 번 연달아 + 둔화)',cast(e){ const m=e.r.mad,go=n=>{ const t=n?dbAny(e):dbNear(e); if(!t||e.dead||over) return; const at={x:t.x,y:t.y}; monCast(e,m?.7:.9,3.5,m?'스카이 콩콩':'점프 찍기',()=>{ dbGo(e,at); S.circle(e,3.5,m?80:90,m?'스카이 콩콩':'점프 찍기',{air:1.5,knock:1,slow:m?[.4,2]:null,zfree:true,v:'quake'}); if(m&&n<2) after(.15,()=>go(n+1)); },at); }; go(0); }}
  },note:"화약은 6초 동안 남고, 대포에 맞으면 터지며 사라진다(대포 55 → 화약이 묻어 있으면 120). 원숭이는 보스 좌우 4칸 자리에서 쏘는 것으로만 옮겼다(따로 때릴 수는 없다). '동료 소환'은 시험장의 산적을 부른다. 보스 편은 한꺼번에 다섯까지다."},
 {el:'fire',w:'sword',hair:'#3a2a1a',acc:['cape'],cape:'#7a1f1f'},
 (e,t,d)=>{ e.ai.want=2.4; if(go(e,'aw')) return true; if(d<=17&&go(e,'n2')) return true; if(d<=12&&d>2.5&&go(e,'x1')) return true; if(d<=3.5+t.rad+.4&&go(e,'n1')) return true; });

/* ───── 6. 여왕 개미 (군주) ───── */
defDoc('d_antqueen',3100,3,'???',{name:'보스, 여왕 개미',col:'#8a3a2a',rad:1.5,range:8,speedMod:()=>.85,
  init:e=>{e.r={dive:0}}, modTake(e,src,amt){ return e.r.dive>now?0:amt; },
  skills:{
   n1:{name:'독침',kind:'기본 공격',cd:2.8,r:14,txt:'멀리 쏘고 둔화 · 미친척: 위력 증가',cast(e){ S.proj(e,e.aim,{speed:21,range:15,dmg:e.r.mad?60:40,label:'독침',v:'stake',o:{slow:[.3,1.5]}}); }},
   n2:{name:'독침 난사',kind:'집중 마법',cd:9,r:12,can:e=>e.r.mad,need:'미친척 모드',txt:'사방으로 독침 12발',cast(e){ S.focus(e,.5); after(.4,()=>{ if(e.dead||over) return; const a0=Math.random()*6.283; for(let i=0;i<12;i++){ const a=a0+i*.5236; S.proj(e,{x:Math.cos(a),y:Math.sin(a)},{speed:16,range:14,dmg:45,label:'독침 난사',v:'stake',o:{slow:[.3,1.5]}}); } }); }},
   aw:{name:'숨바꼭질',kind:'집중 마법',cd:16,r:30,txt:'땅속으로 숨어 세 번 적 위로 떨어진다 · 미친척: 수컷 개미 2마리가 함께 떨어진다',cast(e){ const m=e.r.mad; e.r.dive=now+3.9; S.focus(e,4); say(e,'숨었다','#c9b58a'); puff(e.x,e.y,'earth',20,5);
      for(let i=0;i<3;i++) after(.3+i*1.2,()=>{ if(e.dead||over) return; const t=dbAny(e); if(!t) return; dbWarn(e,t.x,t.y,3.5,.9,'숨바꼭질',p=>{ dbGo(e,p); S.circle(e,3.5,85,'숨바꼭질',{knock:2,zfree:true,v:'quake',el:'earth'}); });
        if(m) for(let k=0;k<2;k++){ const q=dbAny(e); if(q) dbWarn(e,q.x+(Math.random()-.5)*7,q.y+(Math.random()-.5)*7,2.6,.9,'수컷 개미',p=>S.circle(e,2.6,70,'수컷 개미',{knock:1,v:'quake',el:'earth'},p)); } }); after(3.9,()=>{ e.r.dive=0; }); }},
   x1:{name:'개미귀신 소환',kind:'집중 마법',cd:20,r:30,txt:'구멍 셋에서 개미귀신이 튀어나온다 · 미친척: 더 자주',cast(e){ const m=e.r.mad; S.focus(e,.6); for(let i=0;i<3;i++){ const t=dbAny(e); if(!t) return; const a=Math.random()*6.283,d=1+Math.random()*3; zone(e,{x:Math.max(2,Math.min(W-2,t.x+Math.cos(a)*d)),y:Math.max(2,Math.min(H-2,t.y+Math.sin(a)*d)),r:2.6,dur:10,every:m?1.5:2.5,label:'개미귀신 구멍',tick:(z,inn)=>{ fx.push({k:'circle',x:z.x,y:z.y,r:2.6,t0:now,team:e.team,ring:true,lab:'개미귀신',src:e}); inn.forEach(x=>{ damage(e,x,55,'개미귀신'); add(x,'root',.6,0,{by:e}); }); }}); } }},
   x2:{name:'개미떼 소환',kind:'집중 마법',cd:24,r:30,txt:'8초 동안 돌아다니는 개미떼 4 · 미친척: 유령 개미떼(7무리, 더 빠르고 아프다)',cast(e){ const m=e.r.mad; S.focus(e,.6); for(let i=0;i<(m?7:4);i++){ const a=Math.random()*6.283; zone(e,{x:Math.max(2,Math.min(W-2,e.x+Math.cos(a)*5)),y:Math.max(2,Math.min(H-2,e.y+Math.sin(a)*5)),r:1.7,dur:8,every:.5,chase:dbAny(e),speed:m?5:3.4,label:m?'유령 개미떼':'개미떼',tick:(z,inn)=>{ inn.forEach(x=>damage(e,x,m?20:14,m?'유령 개미떼':'개미떼')); if(!z.chase||z.chase.dead||Math.random()<.2) z.chase=dbAny(e); }}); } }}
  },note:"'숨바꼭질' 동안(약 4초)에는 피해를 받지 않는다. 수컷 개미는 문서대로 때릴 수 없고 패턴이 끝나면 사라지므로, 떨어지는 자리의 피해로만 옮겼다. 개미귀신 구멍은 10초 동안 남고 2.5초(미친척 1.5초)마다 튀어나온다. '독침 난사'는 미친척 모드에서만 쓴다."},
 {el:'earth',w:'claws',hair:'#4a1a12',acc:['horns','tail']},
 (e,t,d)=>{ e.ai.want=7; if(go(e,'aw')) return true; if(go(e,'x1')) return true; if(go(e,'x2')) return true; if(d<=11&&go(e,'n2')) return true; if(d<=14&&go(e,'n1')) return true; });

/* ───── 7. 숭배받는 신 (위신) ───── */
defDoc('d_god',3600,4,'???',{name:'보스, 숭배받는 신',col:'#d8c890',rad:1.3,quick:true,speedMod:()=>1,
  init:e=>{e.r={rit:0,rec:0,cof:null,cofT:0}},
  modTake(e,src,amt,label,o){ if(e.r.cofT>now&&e.r.cof&&!e.r.cof.dead&&src&&src!==e&&amt>0){ const t=e.r.cof; damage(e,t,amt*.6,'관의 대가',{fixed:true}); return amt*.4; } return amt; },
  onHurt(e,src,amt){ if(e.r.rit>now) e.r.rec+=amt; },
  skills:{
   n1:{name:'손톱',kind:'기본 공격',cd:2.5,r:4,cast(e){ S.arc(e,4,55,'손톱',{knock:0,v:'claw'}); }},
   n2:{name:'관짝행',kind:'집중 마법',cd:16,r:15,txt:'붕대에 맞으면 관에 갇혀 지속 피해 · 미친척: 보스가 받는 피해의 60%를 관 속의 적이 받는다',cast(e){ SNAME.coffin='관'; S.focus(e,.5); const d=e.aim; after(.45,()=>{ if(e.dead||over) return; S.proj(e,d,{speed:20,range:16,dmg:30,label:'관짝행',big:true,v:'stake',o:{post:t=>{ const T=e.r.mad?4:2.5; add(t,'coffin',T,0,{by:e}); add(t,'stun',T,0,{by:e}); dot(e,t,e.r.mad?80:60,T,'관짝행'); if(e.r.mad){ e.r.cof=t; e.r.cofT=now+T; msg([['⚠ 관짝행 ','#ff7d8c'],['보스를 때리면 '+short(t)+'이(가) 대신 맞는다','#fff6d6']],e.team,true); } }}}); }); }},
   aw:{name:'기이한 눈',kind:'집중 마법',cd:15,r:11,txt:'잠시 뒤 앞쪽의 모든 적을 기절시킨다 · 미친척: 미쳐버린 눈(기절이 길고 빨리 뜬다)',cast(e){ const m=e.r.mad,T=m?.9:1.6,a=Math.atan2(e.aim.y,e.aim.x); S.focus(e,T+.1); fx.push({k:'arc',x:e.x,y:e.y,a,r:11,half:Math.PI/3,t0:now,dur:T,team:e.team,lab:(m?'미쳐버린 눈':'기이한 눈')+' — 뒤로 돌아라',src:e}); after(T,()=>{ if(!e.dead&&!over) S.arc(e,11,90,m?'미쳐버린 눈':'기이한 눈',{stun:m?2.5:1.2,knock:0,zfree:true,v:'nova',el:'arcane'}); }); }},
   x1:{name:'세 번 할퀴기',kind:'집중 마법',cd:13,r:30,txt:'가장 먼 적에게 순간이동해 세 번 할퀴고 띄운다 · 미친척: 연속 할퀴기(두 번 더 되풀이)',cast(e){ const m=e.r.mad,N=m?3:1; S.focus(e,N*1.05); for(let k=0;k<N;k++) after(k*1.05,()=>{ if(e.dead||over) return; const t=dbFar(e); if(!t) return; const b=norm(t.x-e.x,t.y-e.y); dbGo(e,{x:t.x-b.x*2.2,y:t.y-b.y*2.2}); dbFace(e,t);
        for(let i=0;i<3;i++) after(.25+i*.22,()=>{ if(e.dead||over) return; if(!t.dead) dbFace(e,t); S.arc(e,4,m?45:35,m?'연속 할퀴기':'세 번 할퀴기',{knock:0,air:i===2?3:0,v:'claw'}); }); }); }},
   x2:{name:'돌진',kind:'집중 마법',cd:11,r:11,txt:'모래를 기어 들이받는다 · 미친척: 유사 돌진(폭이 넓어진다)',cast(e){ const m=e.r.mad,d=e.aim,p0={x:e.x,y:e.y}; S.focus(e,.9); fx.push({k:'seg',x0:e.x,y0:e.y,x1:e.x+d.x*10,y1:e.y+d.y*10,w:m?4.4:2.2,t0:now,dur:.55,team:e.team,lab:m?'유사 돌진':'돌진',src:e}); after(.55,()=>{ if(e.dead||over) return; S.leap(e,d,10,28,()=>S.seg(e,p0,{x:e.x,y:e.y},m?4.4:2.2,85,m?'유사 돌진':'돌진',{knock:3,v:'punch',el:'earth'}),true); }); }},
   x3:{name:'시간 조작',kind:'의식/집중 마법',cd:40,r:9,txt:'5초 의식 동안 받은 피해를 모아 9칸 안에 되돌린다 · 미친척: 시간 왜곡(맞으면 스킬 하나의 대기시간이 60초)',cast(e){ const m=e.r.mad; e.r.rit=now+5; e.r.rec=0; msg([['⚠ '+(m?'시간 왜곡':'시간 조작')+' ','#ff7d8c'],['5초 동안 때린 만큼 되돌아온다. 9칸 밖으로','#fff6d6']],e.team,true);
      monCast(e,5,9,m?'시간 왜곡':'시간 조작',()=>{ e.r.rit=0; const D=Math.min(350,40+e.r.rec*.5); S.circle(e,9,D,m?'시간 왜곡':'시간 조작',{knock:0,zfree:true,v:'nova',el:'arcane',post:t=>{ if(!m) return; const ks=['n1','n2','aw','x1','x2'].filter(k=>t.c.skills&&t.c.skills[k]); if(ks.length){ const k=ks[Math.floor(Math.random()*ks.length)]; t.cd[k]=60; say(t,t.c.skills[k].name+' 60초','#b48cff'); } }}); }); }}
  },note:"'관짝행'은 관에 갇힌 동안 기절로 옮겼다(2.5초, 미친척 4초). 미친척 판은 그동안 보스가 받는 피해의 60%를 관 속의 적이 대신 받는다. '기이한 눈'은 보스 앞쪽 부채꼴(120도, 11칸)이다. '시간 조작'의 반사 피해는 40 + 의식 5초 동안 보스가 받은 피해의 절반(최대 350)으로 정했다."},
 {el:'arcane',w:'claws',hair:'#8a7a4a',acc:['cape'],cape:'#c9b58a'},
 (e,t,d)=>{ e.ai.want=2.6; if(d<=8&&go(e,'x3')) return true; if(go(e,'x1')) return true; if(d<=10&&go(e,'aw')) return true; if(d<=14&&go(e,'n2')) return true; if(d<=10&&d>3&&go(e,'x2')) return true; if(d<=4+t.rad+.4&&go(e,'n1')) return true; });

/* ───── 8. 모래 왕 (위신) ───── */
defDoc('d_sandking',4000,4,'???',{name:'보스, 모래 왕',col:'#e0c06a',rad:1.5,range:10,speedMod:()=>.6,
  onMad(e){ msg([['옥좌가 내려간다 ','#e0c06a'],['보스 둘레가 유사로 바뀐다','#fff6d6']],e.team,true); dbGo(e,{x:W/2,y:H/2}); zone(e,{x:e.x,y:e.y,r:6.5,dur:9999,every:1,chase:e,speed:99,label:'유사',tick:(z,inn)=>inn.forEach(t=>{ damage(e,t,8,'유사'); add(t,'slow',1.2,.35,{by:e}); })}); },
  skills:{
   n1:{name:'왕홀',kind:'기본 공격',cd:5,r:16,txt:'따라가는 빛 3발, 둔화 · 미친척: 제왕홀(5발 + 실명)',cast(e){ const m=e.r.mad,n=m?5:3,a0=Math.atan2(e.aim.y,e.aim.x),t=dbNear(e); for(let i=0;i<n;i++){ const a=a0+(i-(n-1)/2)*.5; S.proj(e,{x:Math.cos(a),y:Math.sin(a)},{speed:9,range:60,life:4,home:m?dbAny(e):t,dmg:40,label:m?'제왕홀':'왕홀',v:'orb',o:{slow:[.3,2],blind:m?1:0}}); } }},
   n2:{name:'근위병',kind:'집중 마법',cd:14,r:14,txt:'병사가 진격해 밀치고, 멈춘 자리를 6초 동안 막는다 · 미친척: 근위돌격병(빠르고 세고 넓다)',cast(e){ const m=e.r.mad; S.focus(e,.6); S.proj(e,e.aim,{speed:m?17:12,range:14,dmg:m?95:70,label:m?'근위돌격병':'근위병',big:true,pierce:true,v:'stake',o:{knock:3},onEnd:p=>{ if(e.dead||over) return; const r=m?3.6:2.5; zone(e,{x:Math.max(1,Math.min(W-1,p.x)),y:Math.max(1,Math.min(H-1,p.y)),r,dur:6,every:.5,label:'봉쇄',tick:(z,inn)=>inn.forEach(t=>{ damage(e,t,15,'봉쇄'); knock(t,z,1.3); })}); }}); }},
   aw:{name:'유사 파도',kind:'의식/집중 마법',cd:30,r:30,txt:'사암 기둥이 솟고(밑에 있으면 큰 피해) 잠시 뒤 파도가 인다. 기둥 뒤에 숨으면 맞지 않는다 · 미친척: 기둥 2개, 파도가 빨리 온다',cast(e){ const m=e.r.mad,T=m?2.6:3.8,P=[],n=m?2:3; msg([['⚠ 유사 파도 ','#ff7d8c'],['사암 기둥 뒤에 숨어라','#fff6d6']],e.team,true); S.focus(e,T+1.3);
      for(let i=0;i<n;i++){ const a=Math.random()*6.283,d=5+Math.random()*4,x=Math.max(2,Math.min(W-2,e.x+Math.cos(a)*d)),y=Math.max(2,Math.min(H-2,e.y+Math.sin(a)*d)); dbWarn(e,x,y,1.8,1.2,'주상절리',p=>{ S.circle(e,1.8,150,'주상절리',{air:2,knock:0,v:'quake',el:'earth'},p); P.push(p); zone(e,{x:p.x,y:p.y,r:1.2,dur:T+.2,label:'사암 기둥'}); }); }
      after(1.2+T,()=>{ if(e.dead||over) return; fx.push({k:'circle',x:e.x,y:e.y,r:30,t0:now,dur:.5,team:e.team,ring:true,lab:'유사 파도',src:e,v:'nova',el:'earth'}); foes(e).forEach(t=>{ const D=dist(e,t)||1,safe=P.some(p=>{ const u=((p.x-e.x)*(t.x-e.x)+(p.y-e.y)*(t.y-e.y))/(D*D); return u>0&&u<1&&Math.hypot(p.x-(e.x+u*(t.x-e.x)),p.y-(e.y+u*(t.y-e.y)))<=1.7; }); if(safe){ say(t,'기둥 뒤','#8fe9ff'); return; } strike(e,t,130,'유사 파도',{knock:9}); }); }); }},
   x1:{name:'원거리병',kind:'집중 마법',cd:26,r:30,txt:'활 병사 2 · 미친척: 3',cast(e){ S.focus(e,.5); summon(e,'m_archer',e.r.mad?3:2); }},
   x2:{name:'암살병사',kind:'집중 마법',cd:12,r:30,txt:'적의 등 뒤에 나타나 잠시 뒤 기습한다(피할 수 있다) · 미친척: 진짜 암살자(준비가 짧고 아프다)',cast(e){ const m=e.r.mad; foes(e).slice(0,3).forEach(t=>dbWarn(e,t.x-t.aim.x*1.2,t.y-t.aim.y*1.2,2.3,m?.8:1.3,m?'진짜 암살자':'암살병사',p=>S.circle(e,2.3,m?120:80,m?'진짜 암살자':'암살병사',{knock:0,v:'cut'},p))); }},
   x3:{name:'포위섬멸진',kind:'의식/집중 마법',cd:45,r:30,can:e=>e.r.mad,need:'미친척 모드',txt:'사방에 병사가 나타난다(쓰러뜨릴 수 있다)',cast(e){ const t=dbAny(e); if(!t) return; S.focus(e,.8); msg([['⚠ 포위섬멸진 ','#ff7d8c'],['병사에게 둘러싸였다','#fff6d6']],e.team,true); summon({team:e.team,x:t.x,y:t.y},'m_skel',4); }}
  },note:"'주상절리'와 '유사 파도'는 한 패턴으로 묶었다: 사암 기둥이 먼저 솟고(밑에 있으면 150 피해), 3.8초(미친척 2.6초) 뒤 파도가 온다. 보스와 나 사이에 기둥이 있으면 맞지 않는다. '근위병'의 지형 봉쇄는 6초 동안 들어오는 적을 밀어내며 피해를 주는 자리로 옮겼다. 미친척 모드의 '지형 변동'은 보스가 한가운데로 옮겨 앉고 둘레 6.5칸이 유사(둔화·약한 지속 피해)로 바뀌는 것으로 정했다. '포위섬멸진'은 미친척 모드에서만 쓴다. 병사는 시험장의 해골 병사·해골 궁수를 쓴다."},
 {el:'earth',w:'ringstaff',hair:'#b08a2a',acc:['cape','pauldrons'],cape:'#7a5a1a'},
 (e,t,d)=>{ e.ai.want=8; if(go(e,'x3')) return true; if(go(e,'aw')) return true; if(go(e,'x1')) return true; if(go(e,'x2')) return true; if(d<=13&&go(e,'n2')) return true; if(d<=16&&go(e,'n1')) return true; });

/* 등반의 보스 차례 맨 뒤에 잇는다 */
if(typeof TBOSS!=='undefined') TBOSS.push(...DB);
if(typeof modeNote==='function'){ modeNote(); drawSum(); drawSel(); }
