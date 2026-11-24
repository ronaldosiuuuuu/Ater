"use strict";
/* 무기·권능의 스킬 묶음(키트). 카드의 무기 스킬·활성 권능을 여기 규칙대로 적으면
   · 조합 캐릭터의 '기존 스킬 가져오기'에 무기/권능 묶음으로 나오고(패시브도 함께 따라온다)
   · 같은 이름의 장비·권능을 등반에서 얻으면 빈 단추에 스킬이 붙는다.
   defKit(key,{ name, kind:'무기'|'권능', tier:카드 단계(숫자), atk:무기 피해량, init, tick, onDeal, …(캐릭터와 같은 훅), skills:{n1,n2,aw,ult,x1…}, note })
   주의: 다른 캐릭터의 e.r에 섞여 들어가므로, e.r에 두는 값은 반드시 키트 key로 시작하는 이름을 쓴다(예: e.r.wlev_stack). init도 그 값만 만든다. */
const KITS=[];
function defKit(key,o){ Object.defineProperty(CH,key,{value:Object.assign({key,kit:true,cls:o.kind,grade:o.kind,hp:500,atk:20,range:2.6,hud:()=>''},o,{name:o.kind+', '+o.name,kname:o.name,init:e=>{ e.r=e.r||{}; if(o.init) o.init(e); }}),enumerable:false,configurable:true}); KITS.push(key); for(const sl in o.skills) o.skills[sl].kit=key; if(!LOOK[key]) LOOK[key]={el:'steel',w:'sword',hair:'#9aa3b5',acc:[]}; }
