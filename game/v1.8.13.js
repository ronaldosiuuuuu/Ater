"use strict";
/* ════════════════ 1.8.13 판을 시작할 때 무작위로 나온 캐릭터를 보여 준다 ════════════════
   혼자 · 함께 하기 · 모든 모드에서, 판이 시작되면 위쪽에 이번 판 편성을 잠깐 띄운다(싸움은 멈추지 않는다).
   혼자 할 때는 무작위가 하나라도 있을 때만, 함께 하기에서는 늘 띄운다(누가 무엇을 골랐는지 서로 보이게).
   무작위로 정해진 칸에는 「무작위」 표시를 단다(내 기기가 아는 것만: 내 캐릭터 · 혼자 할 때의 상대 · 빈 칸). */
{ const st=document.createElement('style'); st.textContent='#revealv{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 54px);transform:translateX(-50%);z-index:60;pointer-events:none;background:rgba(9,13,28,.92);border:1px solid var(--gold);border-radius:14px;padding:10px 16px;min-width:min(360px,calc(100vw - 32px));max-width:calc(100vw - 32px);color:var(--ink);box-shadow:0 8px 30px rgba(0,0,0,.45);transition:opacity .4s}#revealv h4{margin:0 0 6px;font-size:12px;letter-spacing:.2em;color:var(--gold);text-align:center}#revealv .rv{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:start}#revealv .vs{color:var(--gold);font-weight:700;align-self:center}#revealv .sd{display:flex;flex-direction:column;gap:3px;min-width:0}#revealv .sd.r{text-align:right}#revealv .nm{font-weight:700;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#revealv .nm.mine{color:#7fe9ff}#revealv .rb{display:inline-block;font-size:10px;font-weight:600;color:var(--gold);border:1px solid var(--gold);border-radius:6px;padding:0 5px;margin:0 4px;vertical-align:2px}#revealv .lb{font-size:11px;color:var(--muted)}'; document.head.appendChild(st); }
let RV={was:false,plan:null,t:0};
/* 판을 열기 직전에 「무엇이 무작위였는지」 적어 둔다(시작 뒤에는 무작위 표시가 이미 풀려 있을 수 있어서) */
{ const la13=launch; launch=function(){ const N=typeof TN==='function'?TN():1;
    RV.plan={me:!!sel.meRnd,foe:!!sel.foeRnd&&!RAID(),al:Array.from({length:Math.max(0,N-1)},(_,i)=>!(sel.al&&sel.al[i])),fo:Array.from({length:Math.max(0,N-1)},(_,i)=>!(sel.fo&&sel.fo[i])),at:Date.now()};
    return la13.apply(this,arguments); }; }
function revealShow(){ if(!running||!me) return; const old=$('revealv'); if(old) old.remove();
  const multi=!!(NET.host||NET.client), P=RV.plan&&Date.now()-RV.plan.at<15000?RV.plan:null;
  const tagOn=typeof TG!=='undefined'&&TG&&typeof tagAll==='function';
  const side=t=>tagOn?tagAll(t).filter(Boolean):ents.filter(o=>o.team===t&&CH[o.key]&&!o.summoned&&!o.mob&&o.hp>0);
  const myT=me.team, A=side(myT), B=side(1-myT); if(!A.length||!B.length) return;
  /* 무작위 표시: 내 캐릭터(손님은 내가 누른 무작위), 혼자 할 때 상대, 비워 둔 팀 칸 */
  const rnd=new Set(); if(sel.meRnd||P&&P.me) rnd.add(me);
  if(!multi&&P){ if(P.foe&&foe) rnd.add(foe); const mark=(L,flags,skip)=>{ let i=0; for(const o of L){ if(o===skip) continue; if(flags[i]) rnd.add(o); i++; } }; mark(A,P.al||[],me); mark(B,P.fo||[],foe); }
  if(!multi&&!rnd.size) return;
  const nm=o=>{ const c=CH[o.key]||{}; const n=(c.name||'').split(', ')[1]||c.name||'?'; return '<div class="nm'+(o===me?' mine':'')+'">'+(rnd.has(o)?'<span class="rb">무작위</span>':'')+esc(n)+'</div>'+(multi&&o.pname?'<div class="lb">'+esc(o.pname)+'</div>':''); };
  const d=document.createElement('div'); d.id='revealv'; d.setAttribute('role','status');
  d.innerHTML='<h4>이번 판</h4><div class="rv"><div class="sd">'+A.map(nm).join('')+'</div><div class="vs">VS</div><div class="sd r">'+B.map(nm).join('')+'</div></div>';
  document.body.appendChild(d); setTimeout(()=>{ d.style.opacity='0'; },2600); setTimeout(()=>d.remove(),3100); }
/* 판이 막 시작됐는지 살핀다(혼자 · 방장 · 손님 모두) */
setInterval(()=>{ try{ if(running&&!RV.was){ RV.was=true; setTimeout(revealShow,NET.client?700:250); } else if(!running&&RV.was){ RV.was=false; const v=$('revealv'); if(v) v.remove(); } }catch(x){} },150);
