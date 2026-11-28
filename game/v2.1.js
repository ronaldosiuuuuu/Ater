"use strict";
/* ════════════════ 2.1 함께 등반: 사람마다 따로 고른다 ════════════════
   2.0까지는 방장이 고른 권능 · 장비 · 단련이 모두에게 똑같이 들었다. 2.1부터는 사람마다 자기 주머니가 있다.
   · 주머니(TW.co[자리 표]): 권능 · 장비 · 단련 · 연마 · 증표 · 물약 · 자유 표식 · 스킬 순서 · 자라는 권능 · 내 보상 · 내 상인.
     방장 것은 예전처럼 TW에 그대로 있다. 길(평범 · 험한 · 무리 · 쉼터 · 상인)은 방장이 고른다.
   · coWith(자리, 캐릭터, fn): 그 사람의 주머니를 TW 자리에 잠깐 바꿔 놓고 fn을 돈다. 그래서 혼자 등반의 셈(보상 뽑기 · 얻기 · 시너지)을 그대로 쓴다.
     이 안에서는 저장(twStore) · 화면(towerScreen)을 부르지 않는다.
   · 손님 화면: 방장이 'twme'로 내 주머니를 보내 주면 손님 기기가 제 자료로 그린다. 손님이 고르면 'twc'로 알리고, 방장이 살핀 뒤 적용한다.
     ('twme'는 손님 쪽 game/v1.8.4.js의 fix가, 'twc'는 아래 coAct가 거른다)
   · 편의: 보상 다시 뽑기(증표 1 · 층마다 한 번) · 내 시너지가 붙은 권능이 더 자주 나온다 · 누가 아직 고르는 중인지 보이고 방장은 기다리지 않고 올라갈 수 있다 · 함께하는 사람의 시너지가 보인다. */

const coOn=()=>!!(NET.host&&typeof TW!=='undefined'&&TW&&coopN()>1);
const coSeatP=p=>p.tok||('~'+p.pid);
const coKeyP=p=>p.re&&hasK(CH,p.key+'_r')?p.key+'_r':(hasK(CH,p.key)?p.key:'ei');
const coGuests=()=>NET.host?others():[];
const BAGK=['pw','gear','hpB','atkB','gold','pot','free','sk','skOff','bought','grow','rew','rewN','rewPw','shop','shopCut','picks','rr'];
const coNew=()=>({pw:[],gear:{},hpB:0,atkB:0,gold:0,pot:[],sk:[],skOff:[],bought:{},grow:{},rew:null,rewN:0,rewPw:false,shop:null,picks:[],rr:0});
function coBag(seat){ if(typeof coFixOnce==='function') coFixOnce(); if(!TW.co||typeof TW.co!=='object') TW.co={}; if(!hasK(TW.co,seat)) TW.co[seat]=coNew(); return TW.co[seat]; }
let BAGON=null;
function coWith(seat,key,fn){ if(BAGON) return fn(); const B=coBag(seat),S={},k0=TW.key,h0=TW.hp; TW.php=TW.php||{};
  for(const k of BAGK){ S[k]=TW[k]; TW[k]=B[k]; } TW.key=hasK(CH,key)?key:k0; TW.hp=TW.php[seat]==null?null:TW.php[seat]; BAGON=seat;
  try{ return fn(B); } finally{ for(const k of BAGK){ B[k]=TW[k]; if(S[k]===undefined) delete TW[k]; else TW[k]=S[k]; } if(TW.hp==null) delete TW.php[seat]; else TW.php[seat]=TW.hp; TW.hp=h0; TW.key=k0; BAGON=null; } }
twBagOf=e=>(e&&e!==me&&(e.net||e.left)&&NET.host&&typeof TW!=='undefined'&&TW)?coBag(twSeat(e)):TW;
twAs=(e,fn)=>(e&&e!==me&&e.net&&NET.host&&typeof TW!=='undefined'&&TW)?coWith(twSeat(e),e.key,fn):fn();
const coPending=()=>coGuests().filter(p=>coBag(coSeatP(p)).rew).map(p=>p.name||'손님');

/* ── 얻기: 함께 등반에서는 남의 체력을 건드리지 않는다(예전에는 방장의 단련 · 휴식이 모두에게 들었다) ── */
{ const g0=gain; gain=function(r){ if(!(typeof TW!=='undefined'&&TW&&NET.host&&coopN()>1)) return g0.apply(this,arguments);
    if(BAGON&&r&&r.t==='boon'&&r.id==='rest'){ TW.hp=twMax(); TW.picks.push(BOONS.rest.name); return; }
    const keep=Object.assign({},TW.php||{}),out=g0.apply(this,arguments); TW.php=keep; return out; }; }

/* ── 내 시너지가 붙은 권능이 더 자주 나온다(가장 높은 두 시너지 · 약 1.5배). 장비 칸은 그대로 무작위 ── */
{ const rp=rollPw; rollPw=function(f,n){ const L=rp.apply(this,arguments); try{ const c=twCount(),top=SYN_NAMES.filter(k=>c[k]).sort((a,b)=>c[b]-c[a]).slice(0,2);
      if(top.length) for(let i=0;i<L.length;i++){ if(synOf(L[i]).some(s=>top.includes(s))||Math.random()>=.5) continue; const alt=rp.call(this,f,1)[0]; if(alt&&!L.includes(alt)&&synOf(alt).some(s=>top.includes(s))) L[i]=alt; } }catch(x){} return L; }; }
/* 보상 다시 뽑기 */
const coReroll=()=>{ if(!TW.rew||TW.rr||(TW.gold|0)<1) return false; TW.gold--; TW.rr=1; TW.rew=rollRewards(TW.rewPw); return true; };

/* ── 층을 넘으면: 손님마다 증표 · 보상 ── */
{ const st=twSettle; twSettle=function(w){ const live=typeof TW!=='undefined'&&TW&&TW.on&&!TW.fin,n=live?TW.next:null,r=st.apply(this,arguments);
    try{ if(live&&TW&&TW.fin==='win'){ TW.rr=0; if(coOn()&&n){ const G=TWB.gold,big=n.boss||n.lord,g=G.win+(TW.rank==='S'?G.s:0)+(n.elite||n.curse?G.hard:0)+(n.horde?G.horde:0)+(big?G.big:0);
          for(const p of coGuests()) coWith(coSeatP(p),coKeyP(p),()=>{ { const ge=ents.find(o=>o.net&&o.net.pid===p.pid); TW.gold=(TW.gold|0)+g+(ge&&ge._gold|0); if(ge) ge._gold=0; } if(somT()>=3) TW.gold+=Math.min(10,Math.floor(TW.gold*.1)); TW.rr=0; TW.rewPw=!!(big||n.curse); TW.rewN=n.elite?2:1; TW.rew=rollRewards(TW.rewPw); if(TW.pw.includes('n:피의 맹세')) twGrowAdd('n:피의 맹세',1,15); });
          twStore(); } } }catch(x){ console.error('함께 등반 보상',x); } return r; }; }

/* ── 상인 · 쉼터: 손님마다 자기 상인, 물약 되찾기 ── */
function coShop(){ const P=rollPw(TW.floor,2),g1=rollGear(TW.floor,true),g2=rollGear(TW.floor,false,g1?[g1]:[]),S=TWB.shop,cut=somT()>=2?.85:1,pr=v=>Math.max(1,Math.round(v*cut));
  const L=P.map(id=>({t:'pw',id,price:pr((S.pw[0]+POWERS[id].lv*S.pw[1])*(POWERS[id].lv>=7?S.hi:1))})).concat([g1,g2].filter(Boolean).map(id=>({t:'gear',id,price:pr((S.gear[0]+GEAR[id].gi*S.gear[1])*(GEAR[id].gi>=4?S.hi:1))})),['train','hone','rest'].map(id=>({t:'boon',id,price:pr(BOONS[id].price+(id==='rest'?0:S.up*((TW.bought||{})[id]|0)))})));
  for(const id of [...new Set([potRoll(TW.floor),potRoll(TW.floor)].filter(Boolean))]) L.push({t:'boon',id,price:pr(BOONS[id].price)}); return L; }
{ const tp=towerPath; towerPath=function(i){ const n=typeof TW!=='undefined'&&TW&&TW.fork&&TW.fork[i],r=tp.apply(this,arguments);
    try{ if(n&&coOn()){ if(n.t==='shop'&&TW.shop) for(const p of coGuests()) coWith(coSeatP(p),coKeyP(p),()=>{ TW.shop=coShop(); });
        if(n.t==='rest') for(const p of coGuests()){ const B=coBag(coSeatP(p)); for(const q of (B.pot||[])) q.n=Math.min(q.max,q.n+1); }
        twStore(); coTellAll(); } }catch(x){ console.error('함께 등반 상인',x); } return r; }; }

/* ── 손님에게 알리기 ── */
const coTop=(n,ids)=>{ const t=synTiers(n,ids); return SYN_NAMES.filter(k=>t[k]).sort((a,b)=>t[b]-t[a]).slice(0,4).map(k=>k+' '+t[k]).join(' · '); };
function coTeam(){ const L=[]; try{ L.push(((NET.players.find(q=>q.host)||{}).name||'방장')+': '+(coTop(twCount(),twIds())||'시너지 없음')); for(const p of coGuests()) coWith(coSeatP(p),coKeyP(p),()=>{ L.push((p.name||'손님')+': '+(coTop(twCount(),twIds())||'시너지 없음')); }); }catch(x){} return L.slice(0,6).map(s=>s.slice(0,80)); }
function coState(p){ const seat=coSeatP(p),key=coKeyP(p),B=coBag(seat); let max=0; coWith(seat,key,()=>{ max=twMax(); }); const hp=TW.php&&TW.php[seat]!=null?TW.php[seat]:max,it=r=>({t:r.t,id:r.id});
  return {t:'twme',floor:TW.floor|0,key,on:TW.on?1:0,pw:B.pw.slice(0,160),gear:Object.assign({},B.gear),hpB:B.hpB|0,atkB:B.atkB|0,gold:B.gold|0,pot:(B.pot||[]).map(q=>({id:q.id,n:q.n|0,max:q.max|0})),free:B.free||'',sk:(B.sk||[]).slice(0,40),skOff:(B.skOff||[]).slice(0,40),
    rew:B.rew?B.rew.map(it):null,rewN:B.rewN|0,rr:B.rr?1:0,shop:B.shop?B.shop.map(x=>({t:x.t,id:x.id,price:x.price|0,sold:x.sold?1:0})):null,hp:Math.round(hp),max:Math.round(max),train:(B.picks||[]).filter(x=>x===BOONS.train.name).length,grow:Object.assign({},B.grow||{}),wait:coPending().slice(0,6),team:coTeam()}; }
function coTell(x){ try{ if(!NET.host||!NET.tx||typeof TW==='undefined'||!TW) return; const p=x&&x.pid?x:(x&&x.net?NET.players.find(q=>q.pid===x.net.pid):null); if(p&&!p.host) NET.tx.send(p.pid,coState(p)); }catch(e){ console.error('함께 등반 알리기',e); } }
function coTellAll(){ if(coOn()) for(const p of coGuests()) coTell(p); }
{ const cs=coopSend; coopSend=function(end){ const r=cs.apply(this,arguments); if(!end) coTellAll(); return r; }; }
{ const rs=reseat; reseat=function(p){ const r=rs.apply(this,arguments); try{ if(coOn()) coTell(p); }catch(x){} return r; }; }

/* ── 손님이 보낸 것(방장이 살핀다) ── a: rw 보상 · rr 다시 뽑기 · buy 사기 · free 자유 표식 · sk 스킬 순서 · pot 물약 */
function coAct(pid,d){ const p=NET.players.find(x=>x.pid===pid); if(!p||p.host||!coOn()) return; const a=typeof d.a==='string'?d.a:'',i=Math.max(0,Math.min(40,d.i|0)),strs=v=>(Array.isArray(v)?v:[]).filter(x=>typeof x==='string').map(x=>x.slice(0,40)).slice(0,40);
  if(a==='pot'){ if(TW.on&&running){ const e=ents.find(o=>o.net&&o.net.pid===pid); if(e) potUse(i===1?1:0,e); } return; }
  if(TW.on||!['rw','rr','buy','free','sk'].includes(a)) return;
  coWith(coSeatP(p),coKeyP(p),()=>{
    if(a==='rw'){ const r=TW.rew&&TW.rew[i]; if(r){ gain(r); TW.rewN--; TW.rew=TW.rewN>0?rollRewards(TW.rewPw):null; } }
    else if(a==='rr') coReroll();
    else if(a==='buy'){ const it=TW.shop&&TW.shop[i]; if(it&&!it.sold&&(TW.gold|0)>=it.price){ TW.gold-=it.price; it.sold=true; if(it.t==='boon'&&(it.id==='train'||it.id==='hone')){ TW.bought=TW.bought||{}; TW.bought[it.id]=(TW.bought[it.id]|0)+1; } gain(it); } }
    else if(a==='free'){ if(TW.floor===1&&CH[TW.key].grade==='고화'&&typeof d.s==='string'&&hasK(SY,d.s)) TW.free=d.s; }
    else if(a==='sk'){ TW.sk=strs(d.sk); TW.skOff=strs(d.off); } });
  twStore(); coTell(p); if(a==='rw'&&!$('tower').hidden&&!running) towerScreen(); }
onMsg('host',{pre(pid,d){ if(!d||d.t!=='twc') return; try{ coAct(pid,d); }catch(x){ console.error('함께 등반 손님 고르기',x); } return true; }});

/* ── 방장: 손님이 아직 고르는 중이면 기다린다(기다리지 않고 올라갈 수도 있다) ── */
{ const tg=towerGo; towerGo=function(force){ if(typeof TW!=='undefined'&&TW&&!TW.on&&TW.next&&coOn()&&force!==true){ const L=coPending(); if(L.length){ toast(L.join(' · ')+' 아직 보상을 고르는 중이다',2600); return; } } return tg.call(this); }; }
function coForce(){ if(!coOn()) return; for(const p of coGuests()) coWith(coSeatP(p),coKeyP(p),()=>{ let g=0; while(TW.rew&&g++<4){ gain(TW.rew[0]); TW.rewN--; TW.rew=TW.rewN>0?rollRewards(TW.rewPw):null; } }); twStore(); coTellAll(); towerGo(true); }

/* ── 저장해 둔 함께 등반 주머니 다듬기 ── */
function coFix(){ if(typeof TW==='undefined'||!TW) return; const src=TW.co&&typeof TW.co==='object'&&!Array.isArray(TW.co)?TW.co:{},out={},N=(v,a,b)=>{ v=+v; return Number.isFinite(v)?Math.max(a,Math.min(b,v)):a; },strs=v=>(Array.isArray(v)?v:[]).filter(x=>typeof x==='string').map(x=>x.slice(0,40)).slice(0,40);
  const okIt=x=>x&&typeof x==='object'&&((x.t==='pw'&&hasK(POWERS,x.id)&&!POWERS[x.id].gear)||(x.t==='gear'&&hasK(GEAR,x.id))||(x.t==='boon'&&hasK(BOONS,x.id)));
  for(const seat of Object.keys(src).slice(0,12)){ const b=src[seat]; if(typeof seat!=='string'||seat.length>40||!b||typeof b!=='object') continue; const B=coNew();
    B.pw=(Array.isArray(b.pw)?b.pw:[]).filter(id=>typeof id==='string'&&hasK(POWERS,id)&&!POWERS[id].gear).slice(0,160); const g=b.gear&&typeof b.gear==='object'?b.gear:{}; for(const s of ['w','a','t']) if(hasK(GEAR,g[s])&&GEAR[g[s]].slot===s) B.gear[s]=g[s];
    B.hpB=N(b.hpB,0,1e5)|0; B.atkB=N(b.atkB,0,1e4)|0; B.gold=N(b.gold,0,1e6)|0; B.pot=(Array.isArray(b.pot)?b.pot:[]).filter(q=>q&&typeof q==='object'&&hasK(POT,q.id)).slice(0,2).map(q=>({id:q.id,max:N(q.max,1,9)|0,n:Math.min(N(q.n,0,9)|0,N(q.max,1,9)|0)}));
    if(hasK(SY,b.free)) B.free=b.free; B.sk=strs(b.sk); B.skOff=strs(b.skOff); const bt=b.bought&&typeof b.bought==='object'?b.bought:{}; B.bought={train:N(bt.train,0,999)|0,hone:N(bt.hone,0,999)|0};
    const gr=b.grow&&typeof b.grow==='object'?b.grow:{}; for(const k of Object.keys(gr)) if(hasK(POWERS,k)) B.grow[k]=N(gr[k],0,100);
    B.rew=Array.isArray(b.rew)&&b.rew.length&&b.rew.every(okIt)?b.rew.slice(0,6).map(x=>({t:x.t,id:x.id})):null; B.rewN=B.rew?Math.max(1,N(b.rewN,0,3)|0):0; B.rewPw=!!b.rewPw; B.rr=b.rr?1:0;
    B.shop=Array.isArray(b.shop)&&b.shop.every(okIt)?b.shop.slice(0,12).map(x=>({t:x.t,id:x.id,price:N(x.price,1,1e5)|0,sold:!!x.sold})):null; B.picks=strs(b.picks).concat(); out[seat]=B; }
  TW.co=out; TW.rr=TW.rr?1:0; }
/* 등반 하나마다 한 번, 화면을 그리기 전에 다듬는다(이어 하기로 읽은 저장이 망가져 있어도 멈추지 않게) */
let coFixedFor=null; const coFixOnce=()=>{ if(typeof TW!=='undefined'&&TW&&coFixedFor!==TW){ coFixedFor=TW; try{ coFix(); }catch(x){ TW.co={}; } } };

/* ── 방장 화면: 다시 뽑기 · 함께하는 사람 · 기다리는 사람 ── */
{ const ts=towerScreen; towerScreen=function(lost){ coFixOnce(); if(!lost&&typeof TW!=='undefined'&&TW&&coOn()&&!TW.shop){ for(const k in (TW.co||{})) if(TW.co[k].shop){ TW.co[k].shop=null; TW.co[k].shopCut=0; } }
    const r=ts.apply(this,arguments);
    try{ if(lost||typeof TW==='undefined'||!TW||$('co-host')) return r; const body=$('tw-body'),at=$('sy-extra')||$('sy-line')||$('tw-inv'); if(!at) return r; let h='';
      if(TW.rew&&!TW.rr&&(TW.gold|0)>=1) h+='<button class="ghost" id="tw-rr" type="button" style="width:100%;margin:0 0 8px">보상 다시 뽑기 (증표 1 · 층마다 한 번)</button>';
      if(coOn()){ const P=coPending(); h+='<p class="note" style="white-space:pre-line">함께하는 사람\n'+coTeam().map(esc).join('\n')+(P.length?'\n아직 보상을 고르는 중: '+P.map(esc).join(' · '):'')+'</p>'; if(P.length&&$('tw-go')) h+='<button class="ghost" id="co-force" type="button" style="width:100%;margin:0 0 8px">기다리지 않고 올라간다(남은 보상은 첫 칸으로)</button>'; }
      if(h) at.insertAdjacentHTML('afterend','<div id="co-host">'+h+'</div>');
    }catch(x){ console.error('등반 화면 함께',x); } return r; }; }
document.addEventListener('click',e=>{ if(NET.client||typeof TW==='undefined'||!TW||TW.on) return; if(e.target.closest('#tw-rr')){ if(coReroll()){ twStore(); towerScreen(); } } else if(e.target.closest('#co-force')) coForce(); });

/* ════════ 손님 쪽 ════════ */
const coFake=()=>{ const d=NET.twMe; return {key:d.key,floor:d.floor,pw:d.pw,gear:d.gear,hpB:d.hpB,atkB:d.atkB,gold:d.gold,pot:d.pot,free:d.free||undefined,sk:d.sk,skOff:d.skOff,rew:d.rew,rewN:d.rewN,shop:d.shop,hp:d.hp,php:{},picks:[],grow:d.grow||{},bought:{},rr:d.rr,on:false}; };
/* 손님 기기에서 내 주머니를 TW 자리에 놓고 그린다(저장은 하지 않는다) */
function coAsMe(fn){ if(!NET.client||!NET.twMe) return; const k=TW; TW=coFake(); try{ return fn(); } finally{ TW=k; } }
function coDelta(it){ const id=it.t==='gear'?'@'+it.id:it.id,ids=twIds().slice(),n=twCount(); if(it.t==='gear'){ const old=TW.gear[GEAR[it.id].slot]; if(old){ const j=ids.indexOf('@'+old); if(j>=0) ids.splice(j,1); } } ids.push(id); const n2=synCount(ids,TW.key,twFree()),parts=[];
  for(const k of SYN_NAMES){ const a=n[k]|0,c=n2[k]|0; if(a===c) continue; const t1=syTier(k,a),t2=syTier(k,c); parts.push(k+' '+a+'→'+c+(t2>t1?' ★'+t2+'단계':t2<t1?' (단계 내려감)':'')); } return parts; }
function coMine(){ const old=$('co-mine'); if(old) old.remove(); if(!NET.client||!NET.twMe||running) return; const d=NET.twMe,body=$('tw-body'); if(!body||!body.querySelector('header.brand')) return;
  coAsMe(()=>{ const n=twCount(),tiers=synTiers(n,twIds()),cands=twSkCands(TW.key,twIds(),tiers),needFree=CH[TW.key].grade==='고화'&&d.floor===1,ex=[];
    const cardX=(attr,it,pre)=>{ const parts=it.t==='boon'?[]:coDelta(it),id=it.t==='gear'?'@'+it.id:it.id,k=it.t!=='boon'&&POWERS[id]&&POWERS[id].kit; return card(attr+(parts.some(x=>x.includes('★'))?' data-star="1"':''),(pre||'')+rwTitle(it),rwBody(it)+(parts.length?'\n시너지: '+esc(parts.join(' · ')):''),it.sold?'var(--line)':rwCol(it))+(k&&CARDTEXT[k]?'<button type="button" class="ghost" data-syct="'+esc(k)+'" style="width:100%;margin:-4px 0 10px;font-size:13px">「'+esc(CH[k].kname||'')+'」 스킬 설명</button>':''); };
    if(hasK(UNIQ,TW.key)) ex.push('고유 시너지 「'+UNIQ[TW.key][0]+'」: '+UNIQ[TW.key][1]); const sn=twSetN(); for(const s in sn) ex.push(TWSET[s].name+' '+sn[s]+'/3'); if(d.pot.length) ex.push('물약: '+d.pot.map(q=>POT[q.id].name+' '+q.n+'/'+q.max).join(' · '));
    let h='<div id="co-mine"><h2>내 것</h2><p class="sub">'+esc(CH[TW.key].name)+' · 체력 '+d.hp+' / '+d.max+' · 기본 공격 '+(CH[TW.key].atk+twAtk())+' · 증표 '+d.gold+'</p>'+twOwned(twIds())+syRow(n)
      +'<div class="sy-btns">'+(needFree?'<button class="ghost" id="sy-free" type="button">자유 표식'+(twFree()?': '+esc(TW.free):' 고르기')+'</button>':'')+(cands.length?'<button class="ghost" id="sy-sk" type="button">스킬 고르기 ('+Math.min(cands.length,twKitFree(TW.key))+'/'+cands.length+')</button>':'')+'</div>'
      +(ex.length?'<p class="note" style="white-space:pre-line">'+esc(ex.join('\n'))+'</p>':'');
    if(d.rew){ h+='<h2>내 보상을 하나 고른다'+(d.rewN>1?' <small style="font-size:13px;color:var(--muted)">앞으로 '+d.rewN+'번</small>':'')+'</h2>'+(!d.rr&&d.gold>=1?'<button class="ghost" id="co-rr" type="button" style="width:100%;margin:0 0 8px">보상 다시 뽑기 (증표 1 · 층마다 한 번)</button>':'')+d.rew.map((r,i)=>cardX('data-crw="'+i+'"',r)).join(''); }
    else if(d.shop){ h+='<h2>내 상인 <small style="font-size:13px;color:var(--muted)">증표 '+d.gold+'개</small></h2>'+d.shop.map((it,i)=>cardX('data-cbuy="'+i+'"'+(it.sold||d.gold<it.price?' disabled':''),it,it.sold?'팔림 · ':'증표 '+it.price+' · ')).join('')+'<p class="note">방장이 상인을 떠나면 닫힌다.</p>'; }
    else h+='<p class="note">'+(d.wait.length?'고르기를 마쳤다. 아직 고르는 중: '+d.wait.map(esc).join(' · '):'고르기를 마쳤다. 방장이 올라가면 함께 시작한다.')+'</p>';
    h+='<p class="note" style="white-space:pre-line">함께하는 사람\n'+d.team.map(esc).join('\n')+'</p></div>'; body.insertAdjacentHTML('beforeend',h);
    body.querySelectorAll('#co-mine [data-star]').forEach(b=>{ b.style.boxShadow='0 0 0 1px var(--gold) inset'; }); }); }
onMsg('client',{post(d){ if(!d||!NET.client) return; if(d.t==='twme'){ NET.twMe=d; NET.twInv={ids:d.pw.concat(gearIds(d.gear)),hpB:d.hpB,atkB:d.atkB,train:d.train}; if(!running&&!$('tower').hidden) coMine(); try{ potBtn(); }catch(x){} if(syWin.on&&$('sywin-b').querySelector('[data-sysk]')) coAsMe(sySkWin); } else if(d.t==='tw'&&d.end) NET.twMe=null; else if(d.t==='start'&&!Array.isArray(d.kit)){ NET.twSk=null; NET.twMe=null; } }});
{ const cl=clientLost; clientLost=function(){ NET.twSk=null; NET.twMe=null; return cl.apply(this,arguments); }; }
{ const ci=coopInfo; coopInfo=function(d){ const r=ci.apply(this,arguments); try{ if(d&&!d.end){ const body=$('tw-body'); body.querySelectorAll(':scope>p.note').forEach(x=>x.remove()); /* 보상 · 상인은 저마다 고르므로 방장 것을 추천하는 칸은 길을 고를 때만 둔다 */ if(/보상|상인/.test(String(d.what||''))) body.querySelectorAll(':scope>h2,:scope>.bcard').forEach(x=>x.remove()); const s=body.querySelector(':scope>p.sub'); if(s) s.textContent='길은 방장이 고른다. 보상 · 상인은 저마다 따로 고른다.'; coMine(); } }catch(x){ console.error('함께 등반 손님 화면',x); } return r; }; }
/* 보유 창 · 시너지 칸: 손님은 자기 것으로 */
{ const sh=synHtml; synHtml=function(ids,key,free){ if(key===undefined&&NET.client&&NET.twMe) return sh.call(this,ids,NET.twMe.key,NET.twMe.free||null); return sh.apply(this,arguments); }; }
/* 손님이 누른 것 */
document.addEventListener('click',e=>{ if(!NET.client||!NET.twMe||!NET.tx||running) return; const t=e.target.closest('[data-crw],[data-cbuy],#co-rr,#co-mine #sy-free,#co-mine #sy-sk,#sywin [data-syfree],#sywin [data-sysk]'); if(!t||t.disabled) return; const D=t.dataset,send=m=>NET.tx.send(Object.assign({t:'twc'},m)),lock=()=>document.querySelectorAll('#co-mine [data-crw],#co-mine [data-cbuy],#co-rr').forEach(b=>{ b.disabled=true; });
  if(D.crw!=null){ send({a:'rw',i:+D.crw}); lock(); } else if(D.cbuy!=null){ send({a:'buy',i:+D.cbuy}); lock(); } else if(t.id==='co-rr'){ send({a:'rr'}); lock(); }
  else if(t.id==='sy-free') coAsMe(syFreeWin); else if(t.id==='sy-sk') coAsMe(sySkWin);
  else if(D.syfree){ send({a:'free',s:D.syfree}); syWin.close(); }
  else if(D.sysk){ coAsMe(()=>{ const nm=D.sysk,tiers=synTiers(twCount(),twIds()),free=twKitFree(TW.key); let L=twSkPick(TW.key,twIds(),tiers).map(x=>CH[x[0]].skills[x[1]].name); const off=new Set(TW.skOff||[]);
      if(L.includes(nm)){ L=L.filter(x=>x!==nm); off.add(nm); } else if(L.length<free){ L.push(nm); off.delete(nm); } else return toast('먼저 하나를 내린다'); NET.twMe.sk=L; NET.twMe.skOff=[...off]; send({a:'sk',sk:L,off:[...off]}); }); coAsMe(sySkWin); } });
