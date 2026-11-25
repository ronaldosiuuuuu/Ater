"use strict";
/* 1.3.0 ~ 1.5.3: 준비 표시 · 완성 · 3대3 태그매치 · 함께 하기 · 화면 손질 */
/* ════════════════ 1.3.0 함께 하기: 준비 표시 · 함께 등반에서 고를 것 추천 ════════════════ */
/* ── 준비: 들어온 사람이 '준비'를 누르면 방장 명단에 ✔가 뜬다. 판이 시작되면 모두 풀린다 ── */
lobbyOut=function(){ const h=NET.players[0]; if(h){ h.name=NET.name(); h.key=okKey(sel.me)?sel.me:'ei'; h.re=!!(sel.meR&&CH[sel.me+'_r']); } const L=NET.players.map(p=>({pid:p.pid,name:p.name,key:p.key,re:p.re,team:p.team,host:!!p.host,ready:!!p.ready,done:p.done||'',tag:p.host?[sel.al[0],sel.al[1]].filter(k=>k&&okKey(k)):(p.tag||[])})); for(const p of others()) NET.tx.send(p.pid,{t:'lobby',players:L,code:NET.code,you:p.pid,hm:practice?0:mode,hs:roomHS()}); drawNet(); };
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
/* canDone() → game/hoisted.js */
/* isDone() → game/hoisted.js */
/* doneList() → game/hoisted.js */
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
on('begin',()=>{ if(NET.client||!isTag()){ TG=null; tagUi(); return; } TG={bench:[[],[]],last:[-99,-99],cd:[0,0],kills:[0,0],pick:[null,null]};
  for(const tm of [0,1]){ const L=ents.filter(o=>o.team===tm).sort((a,b)=>(a.slot||0)-(b.slot||0)); L.forEach((o,i)=>{ if(i===0){ o.tagOn=true; return; } o.tagOn=false; TG.bench[tm].push(o); }); }
  ents=ents.filter(o=>o.tagOn); msg([['3대3 태그매치 ','#e3c377'],['언제든 교대할 수 있다 · 재사용 대기시간 '+TAG.cd+'초','#fff6d6']],0,true); tagUi(); });
/* 누가 쓰러지면: 대기가 남았으면 1초 뒤 다음 캐릭터가 들어오고, 없으면 진다 */
{ const kl0=kill; kill=function(src,t){ if(!isTag()||!TG) return kl0(src,t);
    if(src.team===t.team){ const k=ents.find(o=>o.team!==t.team&&!o.dead)||ents.find(o=>o.team!==t.team); if(k) src=k; }
    fire('kill',src,t); if(src.c.onKill&&!src.dead) src.c.onKill(src,t); score[src.team]++; TG.kills[src.team]++;
    const left=TG.bench[t.team].filter(o=>!o.dead); msg(short(src)+'(이)가 '+short(t)+'(을)를 쓰러뜨렸다 · '+(t.team?'상대':'우리')+' 남은 캐릭터 '+left.length,src.team,true);
    if(!left.length){ finish(src); return; }
    after(TAG.next,()=>{ if(over||!TG) return; const cur=ents.find(o=>o.team===t.team&&o.tagOn); if(cur&&!cur.dead) return; const nx=tagNext(t.team); TG.pick[t.team]=null; if(nx) tagSwap(t.team,nx,true); }); }; }
on('hit',(s,t,amt)=>{ if(!TG||!(amt>0)||s===t) return; TG.last[s.team]=now; TG.last[t.team]=now; });
/* 대기 중인 캐릭터의 재사용 대기시간은 계속 돈다 · 컴퓨터 편은 위험하면 교대한다 */
on('step',dt=>{ if(!TG) return; for(const tm of [0,1]) for(const o of TG.bench[tm]){ if(o.dead) continue; for(const k in o.cd) if(o.cd[k]>0) o.cd[k]=Math.max(0,o.cd[k]-dt); }
  TG.aiT=(TG.aiT||0)-dt; if(TG.aiT<=0){ TG.aiT=.5; for(const tm of [0,1]){ if(tagHuman(tm)) continue; const cur=ents.find(o=>o.team===tm&&o.tagOn); if(cur&&!cur.dead&&!tagWhy(tm)){ const best=TG.bench[tm].filter(o=>!o.dead).sort((a,b)=>b.hp/b.max-a.hp/a.max)[0]; if(best&&cur.hp/cur.max<.4&&best.hp/best.max>cur.hp/cur.max+.25) tagSwap(tm,best); } } }
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
{ let prevN=null,lastT=false; window.tagPrevReset=()=>{ prevN=null; }; const mn0=modeNote; modeNote=function(){ const tg=mode===7&&!practice; if(tg){ if(!lastT) prevN=teamN; teamN=3; } else if(lastT&&prevN!=null){ teamN=prevN; prevN=null; } lastT=tg; mn0(); $('size').style.display=mode===7&&!practice?'none':'';
    if(mode===7&&!practice){ $('size').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',+x.dataset.n===3)); $('modenote').textContent='캐릭터 셋을 고른다(내 캐릭터 + 우리 팀 칸 둘). 경기장에는 한 명씩 나서고, 싸우는 중에도 대기 중인 캐릭터와 교대할 수 있다(재사용 대기시간 '+TAG.cd+'초, PC는 Q · E). 들어온 캐릭터는 1초 동안 피해를 받지 않고 스킬도 쓸 수 없다. 대기하는 캐릭터는 체력과 궁극기 조건을 그대로 지닌다. 셋이 모두 쓰러진 편이 진다. 보상은 쓰러뜨린 캐릭터 하나에 코인 '+TAG.pay+'. 우리 팀 칸은 가진 캐릭터만 고를 수 있고, 비워 두면 가진 캐릭터 가운데 무작위. 친구와 함께: 편마다 사람이 한 명이면 그 사람이 셋을 다 몰고, 여럿이면 한 명씩 나눠 맡는다(남는 칸은 그 편의 첫 사람).'; } };
  const sm0=setMode; setMode=function(m){ sm0(m); };
  
  modeNote(); }
/* 보상: 쓰러뜨린 캐릭터 수만큼 */
{ const en1=earn; earn=function(win){ const g=en1(win); if(!(mode===7&&!practice&&TG)||TW&&TW.on||SPM) return g; PF.coin-=g.c; PF.star-=g.st; const m=DIFFPAY[diff]==null?1:DIFFPAY[diff],k=TG.kills[0]; g.c=Math.round(k*TAG.pay*m); g.st=k>=3?1:0; PF.coin+=g.c; PF.star+=g.st; g.note='캐릭터 '+k+'명 쓰러뜨림'; return g; }; }

/* ════════════════ 1.5.1 함께 하기 손질 ════════════════ */
/* 그만두기: 방장이 그만두면 마지막 상태와 '메뉴 닫힘'을 보낸다. 손님이 그만두면 조작을 멈추고 방장에게 알려 컴퓨터가 이어 받는다 */
function netQuit(){ try{ if(NET.host&&NET.live){ snap(); NET.live=false; sendAll({t:'pz',who:'host',host:true,name:NET.name(),on:false}); }
    if(NET.client&&NET.tx){ NET.tx.send({t:'in',mv:[0,0],hb:false,aim:0}); NET.tx.send({t:'pz',on:false}); NET.tx.send({t:'quit'}); NET.playing=false; } }catch(x){} }
{ const hm3=hostMsg; hostMsg=function(pid,d){ const p=NET.players.find(x=>x.pid===pid); if(p) p.seen=performance.now();
    if(d&&NET.host&&d.t==='in'){ const e=ents.find(o=>o.net&&o.net.pid===pid); if(e) e.net.tt=performance.now(); }
    if(d&&NET.host&&d.t==='quit'){ const e=ents.find(o=>o.net&&o.net.pid===pid); if(p&&NET.live){ if(e){ e.net=null; e.left=p.name; e.pname=null; if(e.tagOwner) e.tagOwner='ai'; } if(typeof tagRelease==='function') tagRelease(pid,p.name); toast((p.name||'손님')+' 그만뒀다 · 컴퓨터가 대신 움직인다',2600); } return; }
    /* 같은 이름으로 다시 들어왔는데 예전 연결이 아직 안 닫혔으면(2초 넘게 소식 없음) 예전 것을 먼저 내보내 자리를 넘긴다 */
    if(d&&NET.host&&d.t==='hello'&&NET.live&&!p){ const nm=String(d.name||'손님').slice(0,13),old=NET.players.find(x=>!x.host&&x.pid!==pid&&x.name===nm&&performance.now()-(x.seen||0)>2000); if(old) hostGone(old.pid); }
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
    const land=document.body.classList.contains('land'),co=document.getElementById('coach'); if(co&&land) co.style.top=(Math.max(hr.bottom,0)+6)+'px'; /* 가로 화면의 첫 판 안내 칸은 오른쪽 위에 따로 둔다(가운데의 내 캐릭터를 가리지 않게) */
    for(const el of [document.getElementById('pzs'),document.getElementById('dcb'),document.getElementById('tagbar'),land?null:co]){ if(!el) continue; if(el.id==='pzs'&&!el.children.length) continue; if(!vis(el)) continue; el.style.top=y+'px'; y+=el.offsetHeight+5; }
    tst.classList.add('ingame'); tst.style.top=y+'px'; tst.style.bottom='auto'; if(onT) y+=tst.offsetHeight+5;
    HUDY=y>hr.bottom+8?(y-cvr.top)/cell+.55:0;
    /* 기록 줄이 내려갈 수 있는 끝: 가로 화면은 왼쪽 아래 이동 스틱 위까지, 세로 화면은 아래 점수 줄 위까지 */ let lim=VH-2.1; for(const el of [$('stick'),$('btns')]){ const r=el.getBoundingClientRect(); if(r.width&&r.left<innerWidth*.4&&r.top>cvr.top&&r.top<cvr.bottom) lim=Math.min(lim,(r.top-cvr.top)/cell-.35); } HUDLIM=lim; return; }
  HUDY=0; tst.style.top='auto';
  /* 맨 위에 떠 있는 창을 찾아 그 아래 단추 줄 위에 띄운다 */
  const L=['#title','#nickv','#patchv','#keysv','#achv','#bagv','#welcome','#info','#bench','#build','#forge','#tower','#res','#pause','#sel'].map(q=>document.querySelector(q)).filter(vis); const top=L[0]; let bot=16;
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
    const sb=typeof TUT!=='undefined'&&TUT.active&&TUT.keep?{sandHp,sandInf,sandAct}:null; if(sb){ sandHp=TUT.keep.sandHp; sandInf=TUT.keep.sandInf; sandAct=TUT.keep.sandAct; } /* 첫 판 안내로 바꾼 샌드백 설정도 저장에는 원래 값으로 */
    put(k); try{ return sv0(); } finally { put(cur); if(sb){ sandHp=sb.sandHp; sandInf=sb.sandInf; sandAct=sb.sandAct; } try{ drawSum(); }catch(x){} } }; }
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
  'body.land .overlay:not(#sel) .dock{display:flex;flex-wrap:wrap;gap:8px;align-items:stretch}body.land .overlay:not(#sel) .dock>button{flex:1 1 150px;width:auto;margin:0;min-height:44px}body.land .overlay:not(#sel) .dock>.go{flex:2 1 220px}',
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
{ const bk1=$('back').onclick; $('back').onclick=function(ev){ const m=showResult.last; const r=bk1.call(this,ev); if(!m&&!NET.client&&!(TW&&TW.on)&&$('tower').hidden) goPage('chars'); return r; }; }
/* 레이드 결과 화면의 상대 칸은 보스로(가장 가까운 잡몹이 아니라) */
{ const fn0=finish; finish=function(w){ if(!over&&mode===6&&!practice){ const bz=ents.find(o=>o.c&&o.c.mon); if(bz) foe=bz; } return fn0(w); }; }
/* 뽑기 연출: 카드 쪽을 누르면 한 번에 모두 뒤집고, 한 번 더 누르면 결과로 */
{ const gs1=gachaShow; gachaShow=function(res,done){ const r=gs1(res,done); const g0=$('tw-body').querySelector('.gst'); if(g0) g0.addEventListener('click',()=>{ const cs=[...g0.querySelectorAll('.gc')]; if(cs.some(c=>!c.classList.contains('on'))) cs.forEach(c=>c.classList.add('on')); else { const b=$('ga-skip'); if(b) b.click(); } }); return r; }; }

