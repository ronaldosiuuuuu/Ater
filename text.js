"use strict";
/* 스킬 글자 다시 짜기: 단추 · 싸움 중 글자 · 카드 설명.
   종류마다 색이 하나씩 있고(KCOL), 세 군데가 같은 색을 쓴다. 색·크기를 바꾸려면 여기와 index.html의 '.sk' 묶음만 보면 된다. */
const KCOL={일반:'#7fe9ff',각성:'#b48cff',궁극:'#e3c377',초월:'#ff7d8c',신화:'#ff7d8c',권능:'#ffb86b',무기:'#8fd0a0',기본기:'#8fd0a0',패시브:'#97a1cf',웅크리기:'#97a1cf',스킬:'#7fe9ff'};
const kindOf=(k,slot)=>{ const t=String((k&&k.kind)||KIND[slot]||'일반'); for(const key of ['궁극','Ultimate','초월','신화','각성','Awaken','권능','기본기','기본 공격','무기','패시브','Passive','웅크리기','집중']) if(t.indexOf(key)>=0) return ({Ultimate:'궁극',Awaken:'각성','기본 공격':'기본기',Passive:'패시브',집중:'각성'})[key]||key; return slot==='ult'?'궁극':slot==='aw'?'각성':'일반'; };
const kcol=(k,slot)=>KCOL[kindOf(k,slot)]||KCOL.일반;
/* ── 단추 ── */
function skLabel(b,s){ if(s==='b'){ b.style.setProperty('--kc',KCOL.기본기); return '<i class="tg">기본</i><b class="nm l2">'+esc(me.c.basicName||'기본 공격')+'</b><small class="kind">'+esc(me.c.basicSub||'ATK '+(+me.atk||0))+'</small><span class="cd"></span>'; }
  if(s==='jump'){ b.style.setProperty('--kc','#97a1cf'); return '<i class="tg">이동</i><b class="nm l2">점프</b><small class="kind">1.25칸</small><span class="cd"></span>'; }
  const k=me.c.skills[s]; if(!k) return null; const kd=kindOf(k,s),n=k.name.replace(/\s+/g,' '),L=[...n].length; b.style.setProperty('--kc',KCOL[kd]||KCOL.일반);
  return '<i class="tg">'+kd+'</i><b class="nm l'+(L<=4?1:L<=7?2:L<=10?3:4)+'">'+esc(n)+'</b><small class="kind">'+(k.cd>=1?k.cd+'s':s==='ult'?'한 번':'')+'</small><small class="need">'+esc(k.need||'')+'</small><span class="cd"></span>'; }
/* 재사용 대기시간이 도는 모양(단추를 시계처럼 쓸어 간다) */
on('step',()=>{ if(!me||typeof SKB==='undefined'||(skLabel.n=(skLabel.n||0)+1)%3) return; SKB.forEach(b=>{ const s=b.dataset.s,k=me.c.skills[s],cd=me.cd[s]||0,full=s==='b'?CFG.atkInt:k?(k.cd||1):1,p=cd>0?Math.max(0,Math.min(1,cd/Math.max(full,cd))):0; if(b._p===undefined||Math.abs(b._p-p)>=.02||(p===0&&b._p!==0)){ b._p=p; b.style.setProperty('--p',p.toFixed(3)); } }); });
/* ── 싸움 중 글자(숫자가 아닌 것): 【상태】는 큰 금빛 글씨, 짧은 낱말(기절·회피…)은 알약 모양 ── */
function drawSay(f){ const t=(now-f.t0)/.9,a=1-t*t,y=f.y-t*.9; g.globalAlpha=a; g.lineJoin='round';
  if(f.txt[0]==='【'){ const name=f.txt.slice(1,-1),pop=1+.35*Math.max(0,1-(now-f.t0)/.12); g.font='800 '+(.5*pop).toFixed(2)+'px "Hahmlet","Nanum Myeongjo",serif'; const w=g.measureText(name).width; g.fillStyle='rgba(20,14,4,.72)'; g.beginPath(); g.roundRect(f.x-w/2-.28,y-.5,w+.56,.68,.12); g.fill(); g.fillStyle='#e3c377'; g.fillRect(f.x-w/2-.28,y+.14,w+.56,.04); g.fillStyle='#fff3cf'; g.fillText(name,f.x,y); return; }
  g.font=(f.big?'800 .6':'700 .42')+'px "Gothic A1",sans-serif'; const w=g.measureText(f.txt).width; if(!f.big){ g.fillStyle='rgba(6,9,23,.78)'; g.beginPath(); g.roundRect(f.x-w/2-.2,y-.4,w+.4,.54,.27); g.fill(); g.strokeStyle=f.col; g.globalAlpha=a*.6; g.lineWidth=.03; g.stroke(); g.globalAlpha=a; } else { g.lineWidth=.08; g.strokeStyle='rgba(6,9,23,.9)'; g.strokeText(f.txt,f.x,y); }
  g.fillStyle=f.col; g.fillText(f.txt,f.x,y); }
/* ── 카드 설명 글: 줄의 종류를 보고 꾸민다 ── */
function fmtCard(txt){ const num=s=>s.replace(/(\d[\d,.]*\s?%?)(\s?(?:고정 )?피해)/g,'<b class="cn dmg">$1</b>$2').replace(/(\d[\d,.]*\s?%?)(\s?(?:만큼 )?(?:회복|보호막))/g,'<b class="cn heal">$1</b>$2').replace(/(\d[\d,.]*)(\s?(?:초|칸|회|타|번|%|단계|중첩))/g,'<b class="cn">$1</b>$2').replace(/'[^'<]{1,24}'/g,m=>'<span class="cq">'+m+'</span>');
  return (txt||'').split('\n').map(l=>{ const e=esc(l),t=l.trim(); if(!t) return '';
    if(/^#/.test(t)){ return (t.match(/#/g)||[]).length>=2||t.indexOf('_')>=0?'<span class="ctags">'+t.split(/\s+(?=#)/).map(x=>'<i>'+esc(x.replace(/^#/,''))+'</i>').join('')+'</span>':'<span class="cflav">'+e+'</span>'; }
    if(/^@/.test(t)) return '<span class="cat">'+e+'</span>';
    if(/^\[.*\]$/.test(t)||/^'\s.*\s'$/.test(t)||/^> [^']/.test(t)) return '<span class="ctitle">'+esc(t.replace(/^\[\s*|\s*\]$|^>\s*/g,''))+'</span>';
    if(/^HP\s*:/.test(t)) return '<span class="cstat">'+e+'</span>';
    if(/^"/.test(t)) return '<span class="cquote">'+e+'</span>';
    const m=t.match(/^(\([^)]*\)\s*)?(>{1,3}\s*)?(?:\[[^\]]*\]\s*)?((?:일반|각성|궁극|초월|신화|기본기|기본 공격|패시브|권능|무기|기원|집중|의식|지속)[^'\-]{0,14})?'([^']+)'\s*((?:\([^)]*\)\s*){0,2})(?:[<＜≪].*)?(?:\/.*)?$/);
    if(m&&(m[1]||m[2]||m[3])){ const head=(m[3]||'')+(m[5]||''),kd=/궁극|Ultimate|>>>/.test(t)?'궁극':/초월|신화/.test(head)?'초월':/각성|Awaken/.test(head)?'각성':/권능/.test(head)?'권능':/패시브|Passive/.test(head)?'패시브':/무기|기본기|기본 공격/.test(head)?'무기':'일반',cd=(t.match(/\((\d+(?:\.\d+)?s|X|-)\)/)||[])[1];
      return '<span class="cskill" style="--kc:'+KCOL[kd]+'"><i>'+kd+'</i><b>'+esc(m[4])+'</b>'+(cd?'<em>'+(cd==='X'?'한 번':cd==='-'?'상시':cd)+'</em>':'')+'</span>'; }
    if(/^조건부/.test(t)||/^> 시전 조건/.test(t)) return '<span class="ccond">'+num(e)+'</span>';
    return '<span class="cline">'+num(e)+'</span>'; }).join('\n'); }
