"use strict";
/* 길잡이. ① 스킬 보기 화면 맨 위의 '처음 잡는다면' 요약 ② 연습에서 할 일 목록 ③ 처음 켰을 때의 조작법.
   캐릭터마다 손으로 쓴 글이 아니라 카드 원문(parseCard)과 스킬 자료에서 뽑는다. 그래서 새 캐릭터를 더해도 저절로 따라온다. */
const BTN={n1:'일반 ①',n2:'일반 ②',aw:'각성 칸',ult:'궁극 칸',crouch:'웅크리기',x1:'5번 칸',x2:'6번 칸',x3:'7번 칸',x4:'8번 칸',b:'기본기'};
function guideHtml(key){ const c=CH[key],card=parseCard(CARDTEXT[key]||''),P=card.blocks.filter(b=>b.kind==='패시브'||b.kind==='기원'&&!Object.values(c.skills).some(k=>k.name===b.name)),L=[];
  for(const b of P.slice(0,3)) L.push('<b>'+esc(b.kind)+" '"+esc(b.name)+"'</b> — "+esc(b.lines.slice(0,2).join(' ')));
  const u=c.skills.ult; if(u) L.push('<b>궁극기 '+esc(u.name)+'</b> — '+esc(u.need?'조건: '+u.need:'조건 없음')+'. 발밑의 금색 고리가 다 차면 쓸 수 있고, 한 판에 한 번이다.');
  const cr=c.skills.crouch; if(cr) L.push('<b>웅크리기 칸</b> — '+esc(cr.name)+(cr.hold?' (누르고 있는 동안)':'')+(cr.need?' · '+esc(cr.need):''));
  if(c.altBasic) L.push('<b>기본기</b> — 이 캐릭터는 기본 공격이 카드대로 바뀐다(또는 없다).');
  return L.length?'<h2>처음 잡는다면</h2>'+L.map(x=>'<p class="note">'+x+'</p>').join(''):''; }
/* 연습의 할 일 목록 */
const GD={on:false,tasks:[],doneT:0,key:''};
const gdDone=()=>{ try{ return JSON.parse(localStorage.getItem('aetherGuide')||'[]'); }catch(x){ return []; } };
on('begin',()=>{ GD.on=false; if(!practice||!OPT.guide||NET.client||!me) return; const bk=me.c.re?me.c.base:me.key; if(OPT.guide===1&&gdDone().includes(me.key)) return; GD.key=me.key; GD.doneT=0; const T=[]; { /* 1.9.11: 알아보기만 한다(재사용 대기 중이면 모든 altBasic이 공격 없이 true를 돌려준다) */ const cb=me.cd.b; me.cd.b=1; let alt=false; try{ alt=!!(me.c.altBasic&&me.c.altBasic(me)===true); }finally{ me.cd.b=cb; } if(!(alt&&!me.c.skills.b)) T.push({id:'b',t:'기본 공격 맞히기'}); }
  for(const s of ['n1','n2','aw','crouch','x1','x2','x3','x4']){ const k=me.c.skills[s]; if(!k||(s==='crouch'&&k.name==='호너')) continue; T.push({id:s,t:BTN[s]+' · '+k.name+(k.need?' ('+k.need+')':'')}); }
  if(me.c.skills.ult) T.push({id:'ult',t:'궁극 · '+me.c.skills.ult.name+(me.c.skills.ult.need?' ('+me.c.skills.ult.need+')':'')}); GD.tasks=T; GD.on=T.length>0; });
function gdMark(id){ if(!GD.on) return; const t=GD.tasks.find(x=>x.id===id&&!x.ok); if(!t) return; t.ok=now; if(GD.tasks.every(x=>x.ok)){ GD.doneT=now; try{ const L=gdDone(); if(!L.includes(GD.key)){ L.push(GD.key); localStorage.setItem('aetherGuide',JSON.stringify(L.slice(-300))); } }catch(x){} toast('길잡이를 다 마쳤다',2600); } }
on('cast',(e,slot)=>{ if(e===me) gdMark(slot); });
on('hit',(s,t,amt,label,o)=>{ if(s===me&&t!==me&&o&&o.basic) gdMark('b'); });
on('draw:screen',()=>{ if(!GD.on||!practice||!me) return; if(GD.doneT&&now-GD.doneT>3){ GD.on=false; return; } const T=GD.tasks,lh=.5,w=Math.min(7.6,VW*.56),x=VW-w-.25,y0=TOPC+2.55,nx=T.find(q=>!q.ok); g.fillStyle='rgba(6,9,23,.74)'; g.fillRect(x,y0,w,.72+T.length*lh);
  g.textAlign='left'; g.font='700 .36px "Gothic A1",sans-serif'; g.fillStyle='#e3c377'; g.fillText('길잡이 · 하나씩 해 본다',x+.2,y0+.46);
  T.forEach((q,i)=>{ const y=y0+.95+i*lh; g.font=(q===nx?'700':'500')+' .34px "Gothic A1",sans-serif'; g.fillStyle=q.ok?'#7fe3b5':q===nx?'#ffffff':'#97a1cf'; let s=(q.ok?'✔ ':q===nx?'▶ ':'○ ')+q.t; while(g.measureText(s).width>w-.35&&s.length>6) s=s.slice(0,-2)+'…'; g.fillText(s,x+.2,y); });
  if(nx&&nx.id==='ult'){ g.font='500 .3px "Gothic A1",sans-serif'; g.fillStyle='#f0b458'; g.fillText('≡ 메뉴 → 궁극기 조건 무시를 켜면 바로 써 볼 수 있다',x+.2,y0+1+T.length*lh); } });
/* 처음 켰을 때: 조작법 한 장 */
{ const open=()=>{ $('welcome').hidden=false; $('welcome').scrollTop=0; }; $('w-close').onclick=()=>{ $('welcome').hidden=true; try{ localStorage.setItem('aetherSeen','1'); }catch(x){} }; $('helpb').onclick=open;
  let seen=true; try{ seen=!!localStorage.getItem('aetherSeen')||!!localStorage.getItem('aether1'); }catch(x){} if(!seen) open(); }
