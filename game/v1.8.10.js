"use strict";
/* ════════════════ 1.8.10 상대 · 팀원 칸도 가진 캐릭터만 ════════════════
   자유 대전(game/v1.8.6.js의 freePlay)에서는 상대 칸 · 팀원 칸을 고를 때도 아직 얻지 않은 캐릭터를 목록에 보이지 않는다(engine.js drawSel의 hid).
   연습 · 함께 하기 · 콘텐츠는 그대로다. 예전에 골라 둔 것이 아직 얻지 않은 캐릭터면 판을 열 때 가진 캐릭터로 바꾼다. */
{ const pc10=pickCh; pickCh=function(k){ if(slot!=='me'&&freePlay()&&CH[k]&&locked(k)) return toast('아직 가지지 않은 캐릭터다 · '+lockWhy(k),2600); return pc10.apply(this,arguments); }; }
function lockedPicksFix(){ if(!freePlay()) return false; let ch=false;
  if(sel.foe&&CH[sel.foe]&&!CH[sel.foe].mon&&locked(sel.foe)){ const k=ownedKeys().filter(x=>x!==sel.me); if(k.length){ sel.foe=k[Math.floor(Math.random()*k.length)]; sel.foeR=false; ch=true; } }
  for(const g of ['al','fo']) (sel[g]||[]).forEach((k,i)=>{ if(k&&CH[k]&&locked(k)){ sel[g][i]=null; ch=true; } });
  if(ch){ try{ save(); drawSel(); }catch(x){} } return ch; }
{ const la10=launch; launch=function(){ if(lockedPicksFix()) toast('아직 가지지 않은 캐릭터를 골라 둔 칸이 있어 가진 캐릭터로 바꿨다',2600); return la10.apply(this,arguments); }; }
try{ lockedPicksFix(); }catch(x){}
