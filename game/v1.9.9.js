"use strict";
/* ════════════════ 1.9.9 등반 · 보유 권능 및 장비 ════════════════
   등반 화면(층 · 길 · 보상 · 상인 · 함께 등반 손님 화면)과 싸우는 중 멈춤 창에 「보유 권능 및 장비」 단추를 단다.
   창에는 지금 가진 권능(단계 · 효과 · 재사용 대기시간 · 붙는 스킬)과 장비(칸 · 등급 · 효과 · 무기 스킬), 단련 · 연마 횟수, 체력 · 기본 공격을 보여 준다.
   함께 등반 손님은 방장이 보내는 등반 소식(tw)에 실린 목록(ids)으로 본다(손님 쪽 거르기는 game/v1.8.4.js의 fix.tw). */

/* 방장: 등반 소식에 가진 것의 목록을 함께 싣는다 */
{ const cs9=coopSend; coopSend=function(){ const sa=sendAll; sendAll=function(m){ if(m&&m.t==='tw'&&TW){ m.ids=twIds(); m.hpB=TW.hpB|0; m.atkB=TW.atkB|0; m.train=(TW.picks||[]).filter(x=>x===BOONS.train.name).length; } return sa.apply(this,arguments); };
    try{ return cs9.apply(this,arguments); }finally{ sendAll=sa; } }; }
/* 손님: 받은 목록을 기억한다. 판이 시작될 때 등반 판인지(무기 · 권능 목록이 실려 왔는지)도 기억한다 */
onMsg('client',{pre(d){ if(!d||!NET.client) return; if(d.t==='tw'){ NET.twInv=d.end?null:{ids:d.ids||[],hpB:d.hpB|0,atkB:d.atkB|0,train:d.train|0}; } else if(d.t==='start'){ NET.twFight=Array.isArray(d.kit); } }});

const twInvData=()=>{ if(NET.client){ const I=NET.twInv; return I?{ids:I.ids,atkB:I.atkB,train:I.train,hpB:I.hpB,key:me&&running?me.key:null}:null; }
  if(!TW) return null; return {ids:twIds(),atkB:TW.atkB|0,hpB:TW.hpB|0,train:(TW.picks||[]).filter(x=>x===BOONS.train.name).length,key:TW.key}; };
function twInvHtml(){ const D=twInvData(); if(!D) return '<p class="note">등반 중이 아니다.</p>';
  const pw=D.ids.filter(id=>id[0]!=='@'&&POWERS[id]),gr=D.ids.filter(id=>id[0]==='@'&&GEAR[id.slice(1)]).map(id=>id.slice(1));
  const skills=k=>{ const c=k&&CH[k]; return c&&c.skills?Object.values(c.skills).map(s=>s&&s.name).filter(Boolean):[]; };
  const box=(title,body,col,id)=>'<div class="bcard" style="border-left-color:'+(col||'var(--gold)')+'"><b>'+title+'</b><p class="note">'+body+'</p>'+(id?twTagChips(id):'')+'</div>';
  /* 체력 · 기본 공격 줄 */
  let hp='',atk='';
  if(running&&me&&!me.dead){ hp='체력 '+Math.ceil(me.hp)+' / '+me.max; atk='기본 공격 '+Math.round(me.atk); }
  else if(!NET.client&&TW){ hp='체력 '+Math.ceil(TW.hp==null?twMax():TW.hp)+' / '+twMax(); atk='기본 공격 '+(CH[TW.key].atk+twAtk()); }
  const line=[hp,atk,'단련 '+D.train+'번 (최대 체력 +'+D.hpB+')','연마 '+D.atkB+'번 (기본 공격 +'+D.atkB+')'].filter(Boolean).join(' · ');
  let h='<p class="sub">'+esc(line)+'</p>';
  h+='<h2>권능 <small style="font-size:13px;color:var(--muted)">'+pw.length+'개</small></h2>';
  h+=pw.length?pw.map(id=>{ const P=POWERS[id],sk=skills(P.kit),g=pGrade(P.lv); return box(gBadge(g)+' 권능 · '+esc(P.name)+' <small class="lvs">'+(P.lv|0)+'단계</small>',esc(P.text)+(P.cd?'\n재사용 대기시간 '+P.cd+'초':'')+(sk.length?'\n붙는 스킬: '+sk.map(esc).join(' · '):''),GGC[g],id); }).join(''):'<p class="note">아직 가진 권능이 없다. 층을 넘으면 보상으로 고를 수 있다.</p>';
  h+='<h2>장비 <small style="font-size:13px;color:var(--muted)">'+gr.length+' / 3칸</small></h2>';
  h+=['w','a','t'].map(sl=>{ const g=gr.map(x=>GEAR[x]).find(G=>G.slot===sl); if(!g) return box(esc(GSLOT[sl])+' · 비어 있음','아직 끼지 않았다.','var(--line)');
    const P=POWERS['@'+g.id]||{},card=g.src==='카드'&&P.mods&&P.mods.atk; return box(gBadge(g.grade)+' '+esc(GSLOT[sl])+' · '+esc(g.name),esc(P.text||'')+(g.note?'\n'+esc(g.note):'')+(card?'\n등반에서는 기본 공격 증가가 절반만 든다(+'+Math.round(P.mods.atk*.5)+').':''),GGC[g.grade],'@'+g.id); }).join('');
  h+=synHtml(D.ids)+'<p class="note">기본 효과: 적을 쓰러뜨리면 잃은 체력의 '+Math.round(TWB.heal.kill*100)+'%를 회복한다.'+(NET.client?' 함께 등반에서는 방장이 고른 권능 · 장비 · 단련이 모두에게 똑같이 든다.':'')+'</p>';
  return h; }
/* 창: 등반 창 · 멈춤 창 위에 뜬다 */
const twInv=(()=>{ const el=document.createElement('div'); el.className='overlay'; el.id='twinv'; el.hidden=true; el.style.zIndex='9';
  el.innerHTML='<div class="wrap"><div id="twinv-b"></div><div class="dock"><button class="go shut" id="twinv-x" type="button">닫기</button></div></div>'; document.body.appendChild(el);
  $('twinv-x').addEventListener('click',()=>{ el.hidden=true; });
  return { open(){ $('twinv-b').innerHTML=head('TOWER','보유 권능 및 장비','등반에서 지금 가진 것')+twInvHtml(); el.hidden=false; el.scrollTop=0; }, close(){ el.hidden=true; }, get on(){ return !el.hidden; } }; })();
/* 뒤로 가기(휴대폰 · Esc)로 닫힌다 */
{ const bs9=backStep; backStep=function(){ if(twInv.on){ twInv.close(); return true; } return bs9.apply(this,arguments); }; }

const INVB='<button class="ghost" id="tw-inv" type="button" style="width:100%;margin:2px 0 8px">보유 권능 및 장비</button>';
/* 방장 · 혼자: 등반 화면(진 화면 빼고)에서 위쪽 한 줄 바로 밑에 */
{ const ts9=towerScreen; towerScreen=function(lost){ const r=ts9.apply(this,arguments); try{ if(!lost&&TW&&!$('tw-inv')){ const s=$('tw-body').querySelector(':scope>p.sub'); if(s) s.insertAdjacentHTML('afterend',INVB); } }catch(x){} return r; }; }
/* 함께 등반 손님 화면 */
{ const ci9=coopInfo; coopInfo=function(d){ const r=ci9.apply(this,arguments); try{ if(!d.end&&!$('tw-inv')){ const hd=$('tw-body').querySelector('header.brand'); if(hd) hd.insertAdjacentHTML('afterend',INVB); } }catch(x){} return r; }; }
document.addEventListener('click',e=>{ if(e.target.closest('#tw-inv,#p-twinv')) twInv.open(); });
/* 멈춤 창: 등반 판일 때만 보인다 */
{ const pf=$('p-foe'); if(pf){ const b=document.createElement('button'); b.className='ghost'; b.id='p-twinv'; b.type='button'; b.textContent='보유 권능 및 장비'; b.hidden=true; pf.insertAdjacentElement('afterend',b);
    const upd=()=>{ b.hidden=!(running&&(NET.client?(NET.twFight&&NET.twInv):(typeof TW!=='undefined'&&TW&&TW.on))); };
    new MutationObserver(upd).observe($('pause'),{attributes:true,attributeFilter:['hidden']}); upd(); } }
