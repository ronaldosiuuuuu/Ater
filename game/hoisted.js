"use strict";
/* 먼저 읽히는 함수들. 한 파일(game.js)이던 때는 함수 선언이 파일 어디에 있든 처음부터 쓸 수 있었다.
   여러 파일로 나눈 뒤에도 앞 파일이 뒤 파일의 함수를 부를 수 있도록, 그런 함수만 여기로 모았다. 원래 자리는 각 줄의 [원래: …]에 적었다. */
/* [원래: game/meta.js] */ function coopN(){ return NET.host&&NET.players.length>1?Math.min(5,NET.players.length):1; }
/* [원래: game/v1.3-1.5.js] */ function doneList(){ return Object.keys(CH).filter(k=>PF.own[k]&&canDone(k)&&!isDone(k)).sort((a,b)=>(reNeed(b).ok-reNeed(a).ok)||(((PF.ch[b]||{}).w||0)+(PF.dup[b]||0)*5)-(((PF.ch[a]||{}).w||0)+(PF.dup[a]||0)*5)); }
/* [원래: game/v1.3-1.5.js] */ function isDone(k){ return !!(PF.done&&PF.done[k]); }
/* [원래: game/v1.3-1.5.js] */ function canDone(k){ const c=CH[k]; return !!c&&!c.re&&!CH[k+'_r']&&!['신화','히든'].includes(c.grade)&&!c.built&&!c.custom&&!c.mon&&!c.mob&&!c.kit; }
/* [원래: game/v1.6-1.7.0.js] */ function roomHS(){ return {sum:($('sumline')&&$('sumline').textContent)||'',m:practice?0:mode,n:teamN,mon:mode===6&&CH[OPT.mon]?pName(OPT.mon):''}; }
/* [원래: game/v1.6-1.7.0.js] */ function tagNext(tm){ const L=TG.bench[tm].filter(o=>!o.dead),p=TG.pick&&TG.pick[tm]; if(p&&!p.dead&&L.includes(p)) return p; return tagHuman(tm)?L[0]:L.sort((a,b)=>b.hp/b.max-a.hp/a.max)[0]; }
/* [원래: game/v1.6-1.7.0.js] */ function tagHuman(tm){ return !!TG&&tagAll(tm).some(o=>tagOwn(o)!=='ai'); }
/* [원래: game/v1.7.1-1.8.3.js] */ function tagHostChar(){ if(!TG||!me||!(me.net||me.tagOwner&&me.tagOwner!=='host')) return me; return tagAll(0).find(o=>tagOwn(o)==='host')||me; }
/* [원래: game/v1.7.1-1.8.3.js] */ function tagRelease(pid,name){ if(!TG) return; for(const tm of [0,1]) for(const o of TG.bench[tm]) if(o.net&&o.net.pid===pid){ o.net=null; o.left=name; o.pname=null; o.tagOwner='ai'; } }
/* [원래: game/v1.7.1-1.8.3.js] */ function roomFitN(n){ if(mode===7||mode===6||mode===5||practice) return; if(teamN>=n) return; teamN=[1,2,3,5].find(x=>x>=n)||5; $('size').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',+x.dataset.n===teamN)); modeNote(); save(); }
