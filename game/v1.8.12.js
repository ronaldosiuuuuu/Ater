"use strict";
/* ════════════════ 1.8.12 무작위로 고르면 이름을 가린다 ════════════════
   「내 캐릭터 무작위」 「상대 무작위」를 누르면 위 카드와 목록에 이름 대신 「무작위」가 뜬다.
   혼자 할 때는 판을 열 때마다 새로 뽑는다(누가 나올지 싸울 때 안다). 목록에서 직접 고르면 무작위가 풀린다.
   함께 하기 손님은 누른 그때 정해지고(방장에게 바로 알려야 하므로), 화면에만 「무작위」로 뜬다. */
/* 무작위 상태는 따로 기억한다(aetherRnd · 저장 내보내기에 함께 실린다) */
const rndSave=()=>{ try{ localStorage.setItem('aetherRnd',JSON.stringify({me:!!sel.meRnd,foe:!!sel.foeRnd})); }catch(x){} };
try{ const d=JSON.parse(localStorage.getItem('aetherRnd')||'null'); if(d&&typeof d==='object'){ sel.meRnd=d.me===true; sel.foeRnd=d.foe===true; } }catch(x){}
if(typeof SAVEKEYS!=='undefined'&&!SAVEKEYS.includes('aetherRnd')) SAVEKEYS.push('aetherRnd');
{ const RN={me:'randme',foe:'rand'},prev={},muted=f=>{ const t=toast; toast=function(){}; try{ return f(); }finally{ toast=t; } };
  for(const w of ['me','foe']){ const b=$(RN[w]); prev[w]=b.onclick;
    b.onclick=function(){ const was=sel[w],tb=tab; muted(()=>prev[w].call(b)); tab=tb; if(sel[w]!==was||CH[sel[w]]){ sel[w+'Rnd']=true; rndSave(); slot=w; drawSel(); save(); toast((w==='me'?'내 캐릭터':'상대')+' · 무작위 · 싸울 때 정해진다',1800); } }; }
  const pc12=pickCh; pickCh=function(k){ const w=slot==='me'||slot==='foe'?slot:null,was=w&&sel[w]; const r=pc12.apply(this,arguments); if(w&&(sel[w]!==was||sel[w]===k)) { const had=sel[w+'Rnd']; sel[w+'Rnd']=false; rndSave(); if(had) drawSel(); } return r; };
  const ds12=drawSel; drawSel=function(){ ds12.apply(this,arguments); for(const w of ['me','foe']){ if(!sel[w+'Rnd']) continue; if(w==='foe'&&RAID()) continue;
      const c=$('slot-'+w); if(c){ c.querySelector('b').textContent='무작위'; c.querySelector('span').textContent='싸울 때 정해진다'; }
      document.querySelectorAll('#list .ch.'+w).forEach(e=>{ e.classList.remove(w); const t=e.querySelector(w==='me'?'.tagme':'.tagfoe'); if(t) t.remove(); }); } };
  const la12=launch; launch=function(){ if(!NET.client&&!KEEP&&!(typeof TUT!=='undefined'&&(TUT.on||TUT.active))){
      for(const w of ['me','foe']) if(sel[w+'Rnd']&&!(w==='foe'&&RAID())) muted(()=>prev[w].call($(RN[w]))); }
    return la12.apply(this,arguments); };
  try{ drawSel(); }catch(x){} }
