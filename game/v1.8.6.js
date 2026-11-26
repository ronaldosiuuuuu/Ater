"use strict";
/* ════════════════ 1.8.6 무작위는 가진 캐릭터만 ════════════════
   자유 대전(혼자 하고, 연습이 아니고, 등반 · 이야기 · 오늘의 도전 · 첫 판 안내 같은 콘텐츠가 아닐 때)에서는
   무작위로 정해지는 모든 캐릭터(상대 무작위 단추 · 우리 편 · 상대 편의 빈 칸 · 태그매치의 내 두 칸)를 가진 캐릭터 가운데서 고른다.
   한 편 안에서는 겹치지 않게 고르므로, 빈 칸을 채울 만큼 가진 캐릭터가 없으면 판을 열지 않고 알린다.
   멀티(함께 하기)는 그대로 모든 캐릭터에서 나온다. */
function freePlay(){ return !practice&&!NET.host&&!NET.client&&!KEEP&&!(typeof TUT!=='undefined'&&(TUT.on||TUT.active)); }
function ownedKeys(){ const myth=OPT.rg.split(',').includes('신화'); return Object.keys(CH).filter(k=>{ const c=CH[k]; return !c.re&&!c.mon&&!c.mob&&!c.kit&&!c.built&&!c.custom&&(c.cls!=='신화'||myth)&&!locked(k); }); }
/* 빈 칸을 채우기에 모자란 편이 있으면 {편, 필요, 가진 수}를 돌려준다 */
function randShort(){ if(!freePlay()) return null; const own=ownedKeys(),tag=typeof isTag==='function'&&isTag();
  for(const tm of [0,1]){ const n=tag?3:sideN(tm); if(n<=1) continue; const list=tm?sel.fo:sel.al,taken=new Set([tm?sel.foe:sel.me]); let need=0;
    for(let i=1;i<n;i++){ const k=list[i-1]; if(k&&CH[k]&&!CH[k].re&&!taken.has(k)&&(!(tag&&tm===0)||!locked(k))) taken.add(k); else need++; }
    if(!need) continue; const have=own.filter(k=>!taken.has(k)).length; if(have<need) return {tm,need,have}; }
  return null; }
{ const la6=launch; launch=function(){ const s=randShort(); if(s){ sfx('ui'); toast('가진 캐릭터가 모자라 이 판을 열 수 없다 · '+(s.tm?'상대':'우리')+' 편 빈 칸 '+s.need+'개에 쓸 수 있는 캐릭터 '+s.have+'명 · 칸을 직접 고르거나 인원을 줄이거나 뽑기로 더 얻는다',5200); return; } return la6.apply(this,arguments); }; }
/* 상대 무작위 단추: 자유 대전이면 가진 캐릭터에서 */
{ const r0=$('rand').onclick; $('rand').onclick=function(){ if(!freePlay()) return r0.apply(this,arguments); const k=ownedKeys().filter(x=>x!==sel.me); if(!k.length) return toast('상대로 고를 수 있는 가진 캐릭터가 없다',2600); sel.foeR=false; sel.foe=k[Math.floor(Math.random()*k.length)]; tab=CH[sel.foe].cls; slot='foe'; drawSel(); save(); toast('상대 · '+CH[sel.foe].name.split(', ')[1]); }; }
