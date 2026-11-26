"use strict";
/* ════════════════ 1.8.11 연습 · 함께 하기에서도 가진 캐릭터만 ════════════════
   고르는 목록은 어디서든(연습 · 함께 하기 · 모든 칸) 가진 캐릭터만 보인다(engine.js drawSel의 hid). 「모든 캐릭터 열기」 코드를 쓰면 모두 보인다.
   함께 하기에서 다른 사람이 고른 캐릭터는 내가 안 가졌어도 그대로 보이고 쓰인다(그 사람 칸에 뜬다).
   무작위 단추도 가진 캐릭터 안에서 고른다. 등반 · 이야기 같은 콘텐츠가 정해 주는 캐릭터는 그대로다. */
lockNote=function(tab,qq){ if(PF.open) return ''; const L=Object.values(CH).filter(c=>!c.re&&(qq?c.name.includes(qq):c.cls===tab)&&locked(c.key)); if(!L.length) return '';
  return '<p class="note" style="margin-top:10px">아직 가지지 않은 캐릭터 '+L.length+'명은 보이지 않는다. 아래 가방 탭의 뽑기에서 코인으로 데려온다(처음 나오면 바로 얻는다).</p>'; };
const pick11=()=>!KEEP&&!NET.client&&!(typeof TUT!=='undefined'&&(TUT.on||TUT.active));
{ const pc11=pickCh; pickCh=function(k){ if(CH[k]&&locked(k)) return toast('아직 가지지 않은 캐릭터다 · '+lockWhy(k),2600); return pc11.apply(this,arguments); }; }
{ const rb11=$('reb').onclick; $('reb').onclick=function(){ const b=typeof slot==='string'&&(slot==='me'||slot==='foe')?sel[slot]:null; if(b&&!sel[slot+'R']&&CH[b+'_r']&&locked(b+'_r')) return toast('재림이 아직 닫혀 있다 · '+lockWhy(b+'_r'),3600); return rb11.apply(this,arguments); }; }
/* 무작위 단추: 연습 · 함께 하기에서도 가진 캐릭터 안에서 */
{ const rm11=$('randme').onclick; $('randme').onclick=function(){ const p=practice; practice=false; try{ return rm11.apply(this,arguments); }finally{ practice=p; } }; }
{ const rf11=$('rand').onclick; $('rand').onclick=function(){ if(freePlay()||!pick11()) return rf11.apply(this,arguments); const k=ownedKeys().filter(x=>x!==sel.me); if(!k.length) return toast('상대로 고를 수 있는 가진 캐릭터가 없다',2600); sel.foeR=false; sel.foe=k[Math.floor(Math.random()*k.length)]; tab=CH[sel.foe].cls; slot='foe'; drawSel(); save(); toast('상대 · '+CH[sel.foe].name.split(', ')[1]); }; }
/* 예전에 골라 둔 칸이 안 가진 캐릭터면: 연습 · 방장일 때도 판을 열기 전에 바꾼다(손님은 방장이 정한 대로) */
lockedPicksFix=function(){ if(!pick11()||PF.open) return false; let ch=false;
  if(sel.foe&&CH[sel.foe]&&!CH[sel.foe].mon&&locked(sel.foe)){ const k=ownedKeys().filter(x=>x!==sel.me); if(k.length){ sel.foe=k[Math.floor(Math.random()*k.length)]; sel.foeR=false; ch=true; } }
  if(sel.me&&CH[sel.me]&&locked(sel.me)){ const k=ownedKeys().filter(x=>x!==sel.foe); if(k.length){ sel.me=k[0]; sel.meR=false; ch=true; } }
  for(const g of ['al','fo']) (sel[g]||[]).forEach((k,i)=>{ if(k&&CH[k]&&locked(k)){ sel[g][i]=null; ch=true; } });
  if(ch){ try{ save(); drawSel(); }catch(x){} } return ch; };
try{ lockedPicksFix(); drawSel(); }catch(x){}
