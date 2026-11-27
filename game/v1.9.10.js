"use strict";
/* ════════════════ 1.9.10 등반 밸런스 · 등급 딱지 · 시너지 바탕 ════════════════
   숫자는 모두 game/core.js의 등반 수치표 TWB에 있다. 이 파일은 그 숫자를 판에 거는 일과 화면만 한다.
   · 상대 보정: 판이 시작될 때 모든 상대(보스 · 무리 · 함께 등반의 상대 포함)와, 싸우는 중에 불려 나온 졸개(summon)에 twFoeStat(층)을 건다.
     체력은 곱하고, 주는 피해는 기본 공격(basic)과 그 밖의 피해(스킬)를 나눠 곱한다.
   · 판 승리 코인의 실력 배율은 컴퓨터 실력 구간과 따로 TWB.pay.diff를 쓴다(1.9.9 그대로).
   · 등급 딱지: gBadge(등급) · pGrade(권능 단계)는 game/core.js. 여기는 모양(CSS)과 함께 등반 손님 화면에 다시 그리는 일.
   · 꼬리표 · 시너지: 권능 · 장비 효과 글에서 꼬리표를 붙이고(TAGRULE · TAGX), 시너지(SYN)를 꼬리표 개수로 켠다.
   모양 이름은 다른 화면과 겹치지 않게 모두 tw- 로 시작한다. */

/* ── 모양: 등급 딱지 · 단계 · 꼬리표 ── */
{ const st=document.createElement('style'); st.textContent=
   '.tw-gb{display:inline-block;font-family:inherit;font-size:11px;font-weight:700;line-height:1.55;padding:0 7px;margin-right:5px;border-radius:999px;color:var(--gc);border:1px solid var(--gc);background:rgba(255,255,255,.05);vertical-align:1px;letter-spacing:.02em;white-space:nowrap}'
  +'@supports (background:color-mix(in srgb,red 10%,transparent)){.tw-gb{background:color-mix(in srgb,var(--gc) 18%,transparent)}}'
  +'.tw-lv{font-size:11px;color:var(--muted);font-weight:400;margin-left:2px}'
  +'.tw-tgs{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}.tw-tg{display:inline-block;font-size:11px;line-height:1.6;padding:0 7px;border-radius:6px;border:1px solid var(--line);color:var(--muted);white-space:nowrap}';
  document.head.appendChild(st); }

/* ── 상대 보정(TWB.stat) ── 방장 · 혼자만 건다(손님 화면은 방장 판을 그대로 받는다). 한 몸에 한 번만(_twS) */
const twOn=()=>!NET.client&&typeof TW!=='undefined'&&TW&&TW.on;
function twBuff(e,S){ if(e._twS) return; e._twS=1; e.max=Math.round(e.max*S.hp); e.hp=Math.round(e.hp*S.hp);
  const c=e.c,md=c.modDeal; e.c=Object.assign({},c,{modDeal:(x,t,a,l,o)=>(md?md(x,t,a,l,o):a)*(o&&o.basic?S.basic:S.skill)});
  if(e.base0) e.base0=Object.assign({},e.base0,{c:e.c,max:e.max}); }   /* 다시 서는 몸(v1.3-1.5의 base0)도 보정된 몸으로 */
on('begin',()=>{ if(!twOn()) return; const S=twFoeStat(TW.floor); if(S.hp===1&&S.skill===1&&S.basic===1) return;
  for(const e of ents) if(e.team===1&&!e.dead) twBuff(e,S); });
/* 싸우는 중에 불려 나온 졸개도 같은 보정을 받는다 */
{ const su=summon; summon=function(){ const had=new Set(ents),r=su.apply(this,arguments);
    try{ if(twOn()&&running){ const S=twFoeStat(TW.floor); for(const m of ents) if(!had.has(m)&&m.team===1) twBuff(m,S); } }catch(x){}
    return r; }; }

/* ── 판 승리 코인의 실력 배율(TWB.pay.diff) ── 코인을 셀 때와 손님에게 판 시작을 알릴 때만 diff를 잠깐 바꾼다.
   손님은 방장이 'start'에 싣는 diff를 코인 계산에만 쓴다(net.js NET.hdiff). 컴퓨터 실력 · 임무 · 업적은 진짜 diff를 본다 */
{ const payD=()=>TW.next&&TW.next.elite?2:twBand(TWB.pay.diff,TW.floor),
    withPay=f=>function(){ if(!twOn()) return f.apply(this,arguments); const d0=diff; diff=payD(); try{ return f.apply(this,arguments); }finally{ diff=d0; } };
  earn=withPay(earn); NET.start=withPay(NET.start); reseat=withPay(reseat); }

/* ── 꼬리표 ──
   권능 · 장비의 효과 글 한 줄마다 아래 규칙을 맞춰 본다(re에 맞고 not에 안 맞으면 붙는다). 글로 안 잡히는 것은 TAGX에 손으로 적는다.
   장비 설명의 '무기 스킬: …' 줄은 「스킬」만, '카드 단계 …' 줄은 꼬리표를 붙이지 않는다(스킬 이름 · 카드 수치로 잘못 붙지 않게) */
const TAGS=['공격','방어','회복','속도','재사용','기본 공격','스킬','제어','저항','반격','처치','위기','선공','마무리'];
const TAGRULE=[
  {t:'공격',re:/주는 (모든 )?피해|추가 피해|배 피해|기본 공격 \+\d|기본 공격 피해 \d|스킬 피해 \d|타격 ?시마다 \d+ ?'?고정 피해|적이 받는 (모든 )?피해/},
  {t:'방어',re:/받는 (모든 )?피해|보호막|최대 체력 \+|피한다|회피|무적|무효화한다|버틴다/,not:/적이 받는/},
  {t:'회복',re:/회복|흡혈/,not:/회복 효과를 무효/},
  {t:'속도',re:/이동 ?속도|기동력/},
  {t:'재사용',re:/재사용 대기시간|쿨타임/},
  {t:'기본 공격',re:/기본 공격/},
  {t:'스킬',re:/스킬 피해|스킬 시전|활성 권능/},
  {t:'제어',re:/기절|둔화|실명|쇠약|저주|밀쳐|밀어내|속박|침묵/,not:/받는|해제/},
  {t:'저항',re:/상태이상|실명, 둔화|해제/,not:/지속시간이 \d+% 증가/},
  {t:'반격',re:/공격자에게|되돌린다/},
  {t:'처치',re:/처치/},
  {t:'위기',re:/내 체력이|체력이 \d+% 이하일|잃은 체력/},
  {t:'선공',re:/전투 시작|체력 \d+% 이상인 적/},
  {t:'마무리',re:/체력 \d+% 이하인 적/}];
const TAGX={};   /* 손으로 고치는 꼬리표: { 권능 id 또는 '@장비 id': ['공격','속도'] } — 적으면 자동 꼬리표 대신 이것을 쓴다 */
const tagCache=new Map();
function twTags(id){ if(typeof id!=='string'||!hasK(POWERS,id)) return []; if(tagCache.has(id)) return tagCache.get(id); let L;
  if(hasK(TAGX,id)) L=TAGX[id].slice();
  else { const P=POWERS[id],G=id[0]==='@'&&hasK(GEAR,id.slice(1))?GEAR[id.slice(1)]:null,txt=[P&&P.text,G&&G.note].filter(x=>typeof x==='string').join('\n'),s=new Set();
    for(const line of txt.split('\n')){ if(/^\s*무기 스킬/.test(line)){ s.add('스킬'); continue; } if(/^\s*카드/.test(line)) continue;
      for(const r of TAGRULE) if(r.re.test(line)&&!(r.not&&r.not.test(line))) s.add(r.t); }
    L=TAGS.filter(t=>s.has(t)); }
  tagCache.set(id,L); return L; }
const twTagChips=id=>{ const L=twTags(id); return L.length?'<div class="tw-tgs">'+L.map(t=>'<span class="tw-tg">'+esc(t)+'</span>').join('')+'</div>':''; };
const tagCount=ids=>{ const n={}; for(const id of ids) for(const t of twTags(id)) n[t]=(n[t]||0)+1; return n; };

/* ── 시너지 ──
   더하는 법(다음 패치): synAdd({ id:'iron', name:'강철 의지', need:{방어:3}, text:'방어 꼬리표 3개 · 받는 피해 10% 감소',
     apply(e,ids){ const c=e.c,mt=c.modTake; e.c=Object.assign({},c,{modTake:(x,s,a,l,o)=>(mt?mt(x,s,a,l,o):a)*.9}); } });
   need: 꼬리표마다 필요한 개수(모두 채우면 켜진다). when(ids,n): 더 복잡한 조건(골라서). apply: 등반 판이 시작될 때 우리 편 캐릭터마다 한 번(방장 기기에서).
   apply 뒤에 다시 서는 몸(base0)도 새 몸으로 바꿔 두므로, 보스 층에서 쓰러졌다 다시 서도 시너지가 남는다 */
const SYN=[];
function synAdd(s){ if(s&&s.id&&!SYN.some(x=>x.id===s.id)) SYN.push(s); }
function synOn(ids){ const n=tagCount(ids); return SYN.filter(s=>Object.keys(s.need||{}).every(t=>(n[t]||0)>=s.need[t])&&(!s.when||s.when(ids,n))); }
on('begin',()=>{ if(!twOn()||!SYN.length) return; const ids=twIds(),L=synOn(ids); if(!L.length) return;
  for(const e of ents){ if(e.team!==0||e.dead||!(e===me||e.net)) continue; for(const s of L){ try{ if(s.apply) s.apply(e,ids); }catch(x){ console.error('시너지 '+s.id,x); } }
    if(e.base0) e.base0=Object.assign({},e.base0,{c:e.c,max:e.max,atk:e.atk}); }
  msg([['시너지 ','#e3c377'],[L.map(s=>s.name).join(' · '),'#fff6d6']],0,true); });
/* 보유 권능 및 장비 창의 꼬리표 · 시너지 칸 */
function synHtml(ids){ const n=tagCount(ids),keys=TAGS.filter(t=>n[t]),L=synOn(ids);
  return '<h2>꼬리표 · 시너지</h2>'+(keys.length?'<div class="tw-tgs">'+keys.map(t=>'<span class="tw-tg">'+esc(t)+' '+n[t]+'</span>').join('')+'</div>':'<p class="note">아직 꼬리표가 없다.</p>')
    +'<p class="note">'+(SYN.length?(L.length?'켜진 시너지: '+L.map(s=>esc(s.name)+' · '+esc(s.text||'')).join(' / '):'켜진 시너지가 없다.'):'시너지는 다음 업데이트에서 추가된다.')+'</p>'; }

/* ── 함께 등반 손님 화면: 방장이 고를 칸은 글만 받으므로 앞의 등급 이름을 딱지로 다시 그린다 ── */
{ const ci10=coopInfo; coopInfo=function(d){ const r=ci10.apply(this,arguments);
    try{ document.querySelectorAll('#tw-body .bcard > b').forEach(b=>{ if(b.querySelector('.tw-gb')) return; const m=/^((?:증표 \d+|팔림) · )?(공설|고화|설화|서사|전설|신화) (.+)$/.exec(b.textContent); if(m) b.innerHTML=esc(m[1]||'')+gBadge(m[2])+' '+esc(m[3]); }); }catch(x){}
    return r; }; }
