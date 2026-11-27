"use strict";
/* 카드로 캐릭터 만들기. 카드 원문을 붙여 넣으면 꼬리표(#원형 범위 피해_3칸 …)와 문장의 숫자를 읽어 스킬 초안을 만들고, 바로 시험장에 넣는다.
   parseCard(글)  카드를 덩이(패시브·스킬)로 나눈다. 길잡이(guide.js)도 이걸 쓴다.
   specOf(덩이)   덩이에서 모양·피해·효과를 뽑아 '명세'로 만든다. 못 읽은 것은 warn에 남긴다.
   runSpec(e,명세) 명세대로 스킬을 쓴다.   codeOf(…) 같은 내용을 chars.js에 붙일 수 있는 글로 적는다.
   자동으로 되는 것은 '무엇을 어디에 얼마나'까지다. 패시브, 조건부 효과, 스택은 손으로 넣어야 한다. */
const FKIND={'패시브':'패시브','일반 스킬':'일반','각성 스킬':'각성','초월 스킬':'초월','영웅 스킬':'각성','신화 스킬':'신화','기원':'기원','궁극 스킬':'궁극'};
function parseCard(txt){ const out={title:'',name:'',grade:'',cls:'',hp:0,atk:0,intro:[],blocks:[]}; let cur=null;
  for(const raw of String(txt||'').replace(/\r/g,'').split('\n')){ const l=raw.trim(); if(!l) continue; let m;
    if(!out.name&&(m=l.match(/^\[\s*(.+?)\s*\]/))){ const a=m[1].split(/,\s*/); out.title=a.length>1?a.slice(0,-1).join(', '):''; out.name=a[a.length-1]; continue; }
    if(!cur&&(m=l.match(/HP\s*:\s*(\d+)/))){ out.hp=+m[1]; const a=l.match(/ATK\s*:\s*(\d+)/); if(a) out.atk=+a[1]; continue; }
    if(!cur&&l[0]==='@'){ for(const gd of ['고화','서사','전설','히든','신화']) if(l.includes('@'+gd)) out.grade=gd; for(const c in CLASSES) if(l.includes('@'+c)) out.cls=c; continue; }
    if((m=l.match(/^[\[(>\s]*(패시브|일반 스킬|각성 스킬|초월 스킬|영웅 스킬|신화 스킬|기원|스타\s?시커\s*\/\s*궁극 스킬|궁극 스킬)[\])]?\s*'([^']*)'\s*(?:\(\s*([^)]*?)\s*\))?/))){ const kd=/궁극/.test(m[1])?'궁극':FKIND[m[1]],c=(m[3]||'').match(/([\d.]+)\s*s/);
      cur={kind:kd,name:m[2].trim()||'이름 없음',cd:c?+c[1]:0,lines:[],tags:[],cond:''}; out.blocks.push(cur); continue; }
    if(!cur){ if(l[0]==='#') out.intro.push(l.slice(1).trim()); continue; }
    if(/^조건부\s*=/.test(l)){ cur.cond=l.replace(/^조건부\s*=\s*/,'').trim(); continue; }
    if(l[0]==='#'){ if(/^#[^\s#].*(다|요)\.?$/.test(l)&&l.split('#').length===2) cur.lines.push(l.slice(1)); else cur.tags.push(...l.split('#').map(x=>x.trim()).filter(Boolean)); continue; }
    cur.lines.push(l.replace(/^[-·>]\s*/,'')); }
  return out; }
function specOf(b){ const T=b.lines.join(' '),sp={name:b.name,kind:b.kind,cd:b.cd,shapes:[],fx:{},ok:[],warn:[]},num=(re,d)=>{ const m=T.match(re); return m?+m[1]:d; };
  const D=[...T.matchAll(/([\d.]+)\s*(?:만큼의\s*|의\s*)?(?:'?고정\s*'?)?피해/g)].map(m=>+m[1]); const known=new Set();
  for(const tg of b.tags){ let m,hit=true;
    if((m=tg.match(/^부채꼴 범위 피해_([\d.]+)칸(?:_(\d+)타)?/))) sp.shapes.push({t:'arc',r:+m[1],hits:+m[2]||1});
    else if((m=tg.match(/^원형 범위 피해_([\d.]+)(?:~[\d.]+)?칸(?:x\d+)?(?:_(\d+)타)?/))) sp.shapes.push({t:'circle',r:+m[1],hits:+m[2]||1});
    else if((m=tg.match(/^직선(?: 거리| 범위)? ?피해_([\d.]+)칸(?:_(\d+)(?:~\d+)?타)?/))) sp.shapes.push({t:'line',r:+m[1],hits:+m[2]||1});
    else if(/^경로선상 피해/.test(tg)){ m=tg.match(/_(\d+)타/); sp.shapes.push({t:'path',r:0,hits:m?+m[1]:1}); }
    else if((m=tg.match(/^(중력)?투사체(?:_(\d+)타)?(?:_(\d+)발)?/))){ const m2=tg.match(/(\d+)발/); sp.shapes.push({t:'proj',r:14,n:m2?+m2[1]:1,hits:1,grav:!!m[1]}); }
    else if((m=tg.match(/^지정형(?:_([\d.]+)칸)?/))) sp.target=+m[1]||8;
    else if((m=tg.match(/^비거리_([\d.]+)칸/))) sp.range=+m[1];
    else if((m=tg.match(/^도약(?:\([^)]*\))?_([\d.]+)칸/))) sp.move={t:'leap',d:+m[1]};
    else if((m=tg.match(/^돌진(?:\([^)]*\))?_([\d.]+)칸/))) sp.move={t:'dash',d:+m[1]};
    else if((m=tg.match(/^순간이동(?:_([\d.]+)칸)?/))) sp.move={t:'blink',d:+m[1]||4};
    else if((m=tg.match(/^(?:백스텝|후퇴)(?:_([\d.]+)칸)?/))) sp.back=+m[1]||3;
    else if((m=tg.match(/^에어본(?:_([\d.]+)칸)?/))) sp.fx.air=+m[1]||2;
    else if((m=tg.match(/^밀치기(?:_([\d.]+)칸)?/))) sp.fx.knock=+m[1]||1.5;
    else if((m=tg.match(/^끌당(?:_([\d.]+)칸)?/))) sp.fx.pull=+m[1]||2;
    else if(/^기절/.test(tg)) sp.fx.stun=num(/([\d.]+)\s*초간[^.]{0,12}기절/,1);
    else if(/^침묵/.test(tg)) sp.fx.silence=num(/([\d.]+)\s*초간[^.]{0,12}침묵/,1);
    else if(/^속박/.test(tg)) sp.fx.root=num(/([\d.]+)\s*초간[^.]{0,12}속박/,1);
    else if(/^실명/.test(tg)) sp.fx.blind=num(/([\d.]+)\s*초간[^.]{0,12}실명/,2);
    else if(/^무장 ?해제/.test(tg)) sp.fx.disarm=num(/([\d.]+)\s*초간[^.]{0,14}무장/,2);
    else if(/^둔화/.test(tg)) sp.fx.slow=[num(/기동력[을이]?\s*([\d.]+)%\s*(?:만큼\s*)?감소/,30)/100,num(/([\d.]+)\s*초간[^.]{0,20}기동력/,2)];
    else if(/^정신 ?집중/.test(tg)) sp.focus=num(/([\d.]+)\s*초간\s*정신을?\s*집중/,1);
    else if(/^보호막/.test(tg)) sp.shield=[num(/([\d.]+)\s*(?:의\s*)?보호막/,20),num(/([\d.]+)\s*초간\s*[\d.]*\s*(?:의\s*)?보호막/,3)];
    else if(/^회복/.test(tg)){ const v=num(/체력을\s*([\d.]+)\s*(?:만큼\s*)?회복/,0); if(v) sp.heal=v; else hit=false; }
    else if(/^(이속|가속)/.test(tg)) sp.haste=[num(/기동력이\s*([\d.]+)%\s*(?:만큼\s*)?증가/,20)/100,num(/([\d.]+)\s*초간/,4)];
    else if(/^(받피감|저항)/.test(tg)){ const v=num(/저항이\s*([\d.]+)%\s*(?:만큼\s*)?증가/,0); if(v) sp.resist=[v/100,num(/([\d.]+)\s*초간/,4)]; else hit=false; }
    else if(/^소모성/.test(tg)){ const v=num(/체력을\s*([\d.]+)\s*(?:만큼\s*)?소모/,0); if(v) sp.pay=v; else hit=false; }
    else if(/^(CC기|버프|디버프|조건부|키입력|재사용_?대기시간|스택형|게이지형|효과강화|강화형?|추가피해|지속피해|고정피해|DOT|타격시|피격시|처치시|시전시)/.test(tg)){ if(/^(조건부|키입력|재사용|스택형|게이지형|효과강화|강화|추가피해|지속피해|DOT|타격시|피격시|처치시|시전시)/.test(tg)) sp.warn.push('#'+tg+' — 손으로 넣어야 한다'); }
    else hit=false; if(!hit) sp.warn.push('#'+tg+' — 읽지 못한 꼬리표'); }
  /* 피해를 모양에 나눈다: 적힌 차례대로, 모자라면 마지막 숫자를 다시 쓴다. _N타는 적힌 피해를 N번에 나눈다 */
  const dmgSh=sp.shapes; dmgSh.forEach((h,i)=>{ h.dmg=D.length?D[Math.min(i,D.length-1)]:0; }); if(D.length>dmgSh.length&&dmgSh.length) sp.warn.push('피해 숫자가 '+D.length+'개인데 모양은 '+dmgSh.length+'개다 — 앞에서부터 '+dmgSh.length+'개만 썼다'); if(!dmgSh.length&&D.length) sp.warn.push('피해 '+D.join('·')+'가 적혀 있지만 범위 꼬리표가 없어 넣지 못했다');
  if(/조건|경우|시마다|때마다|중첩|쌓/.test(T)) sp.warn.push('조건·스택이 든 문장이 있다 — 기본 효과만 넣었다');
  const rg=dmgSh.map(h=>h.t==='proj'?(sp.range||12):h.r||0); sp.r=Math.max(2.5,(sp.move?sp.move.d:0)+Math.max(0,...rg),sp.target||0); if(!dmgSh.length) sp.r=6;
  sp.ok=dmgSh.map(h=>({arc:'부채꼴',circle:'원형',line:'직선',path:'경로선상',proj:'투사체'}[h.t])+(h.r?' '+h.r+'칸':'')+' '+h.dmg+' 피해'+(h.hits>1?' ('+h.hits+'타)':'')+(h.n>1?' ('+h.n+'발)':'')).concat(sp.move?[({leap:'도약',dash:'돌진',blink:'순간이동'}[sp.move.t])+' '+sp.move.d+'칸']:[],sp.focus?['정신 집중 '+sp.focus+'초']:[],Object.keys(sp.fx).map(k=>(SNAME[k]||({air:'에어본',knock:'밀치기',pull:'끌어당김'}[k]||k))+' '+[].concat(sp.fx[k]).join('/')),sp.shield?['보호막 '+sp.shield[0]+' ('+sp.shield[1]+'초)']:[],sp.heal?['회복 '+sp.heal]:[],sp.haste?['기동력 +'+Math.round(sp.haste[0]*100)+'%']:[],sp.resist?['저항 +'+Math.round(sp.resist[0]*100)+'%']:[],sp.pay?['체력 '+sp.pay+' 소모']:[],sp.back?['뒤로 '+sp.back+'칸']:[]);
  return sp; }
function runSpec(e,sp){ const run=()=>{ if(e.dead) return; if(sp.pay) pay(e,sp.pay); if(sp.heal) heal(e,sp.heal); if(sp.shield) shield(e,sp.shield[0],sp.shield[1]); if(sp.haste) add(e,'haste',sp.haste[1],sp.haste[0]); if(sp.resist) add(e,'resist',sp.resist[1],sp.resist[0]);
    const p0={x:e.x,y:e.y},N=sp.shapes.length,atk=()=>{ sp.shapes.forEach((h,i)=>{ const o=i===N-1?Object.assign({},sp.fx):{},n=h.hits||1,per=h.dmg/n; for(let j=0;j<n;j++) after(i*.18+j*.1,()=>{ if(e.dead) return;
          if(h.t==='arc') S.arc(e,h.r,per,sp.name,o); else if(h.t==='line') S.line(e,h.r,per,sp.name,o); else if(h.t==='circle') S.circle(e,h.r,per,sp.name,o,sp.target&&!sp.move?spot(e,sp.target,Math.min(sp.target,4)):undefined);
          else if(h.t==='path') S.seg(e,p0,{x:e.x,y:e.y},1.6,per,sp.name,o); else { const c=h.n||1,a0=Math.atan2(e.aim.y,e.aim.x); for(let q=0;q<c;q++){ const a=a0+(q-(c-1)/2)*.14; S.proj(e,c>1?{x:Math.cos(a),y:Math.sin(a)}:e.aim,{speed:h.grav?17:28,range:sp.range||(h.grav?10:14),grav:h.grav?2:0,dmg:per/c,label:sp.name,o}); } } }); });
        if(sp.back) after(.05+N*.18,()=>{ if(!e.dead) S.leap(e,{x:-e.aim.x,y:-e.aim.y},sp.back,20,null,true); }); };
    if(sp.move){ if(sp.move.t==='blink'){ S.blink(e,moveDir(e),sp.move.d); atk(); } else S.leap(e,moveDir(e),sp.move.d,24,atk,sp.move.t==='dash'); } else atk(); };
  if(sp.focus){ S.focus(e,sp.focus); after(sp.focus,run); } else run(); }
function codeOf(card,specs){ const q=x=>JSON.stringify(x),fo=o=>'{'+Object.keys(o).map(k=>k+':'+q(o[k])).join(',')+'}';
  const one=(slot,sp)=>{ const L=[]; if(sp.pay) L.push('pay(e,'+sp.pay+');'); if(sp.heal) L.push('heal(e,'+sp.heal+');'); if(sp.shield) L.push('shield(e,'+sp.shield[0]+','+sp.shield[1]+');'); if(sp.haste) L.push("add(e,'haste',"+sp.haste[1]+','+sp.haste[0]+');'); if(sp.resist) L.push("add(e,'resist',"+sp.resist[1]+','+sp.resist[0]+');');
      const A=sp.shapes.map((h,i)=>{ const o=i===sp.shapes.length-1?fo(sp.fx):'{}',per=+(h.dmg/(h.hits||1)).toFixed(2),nm=q(sp.name); return h.t==='arc'?'S.arc(e,'+h.r+','+per+','+nm+','+o+');':h.t==='line'?'S.line(e,'+h.r+','+per+','+nm+','+o+');':h.t==='circle'?'S.circle(e,'+h.r+','+per+','+nm+','+o+(sp.target&&!sp.move?',spot(e,'+sp.target+','+Math.min(sp.target,4)+')':'')+');':h.t==='path'?'S.seg(e,p0,{x:e.x,y:e.y},1.6,'+per+','+nm+','+o+');':'S.proj(e,e.aim,{speed:'+(h.grav?17:28)+',range:'+(sp.range||(h.grav?10:14))+',dmg:'+per+',label:'+nm+',o:'+o+'});'; }).join(' ');
      let body=sp.move?(sp.move.t==='blink'?'const p0={x:e.x,y:e.y}; S.blink(e,moveDir(e),'+sp.move.d+'); '+A:'const p0={x:e.x,y:e.y}; S.leap(e,moveDir(e),'+sp.move.d+',24,()=>{ '+A+' }'+(sp.move.t==='dash'?',true':'')+');'):A; body=L.join(' ')+(L.length?' ':'')+body;
      if(sp.focus) body='S.focus(e,'+sp.focus+'); after('+sp.focus+',()=>{ if(e.dead) return; '+body+' });';
      return '   '+slot+':{name:'+q(sp.name)+(sp.kind!=='일반'&&slot!=='ult'?',kind:'+q(sp.kind):'')+',cd:'+sp.cd+',r:'+sp.r+(slot==='ult'?",can:e=>e.r.sk>=12,need:'스킬 적중 12회'":'')+',cast(e){ '+body+' }}'+(sp.warn.length?'   /* 손볼 것: '+sp.warn.join(' / ')+' */':''); };
  return 'KEY:{name:'+q((card.title?card.title+', ':'')+card.name)+',cls:'+q(card.cls)+',grade:'+q(card.grade)+',range:'+(specs.some(x=>x[1].shapes.some(h=>h.t==='proj'))?7:2.4)+',\n  init:e=>{e.r={sk:0}}, hud:e=>\'스킬 적중 \'+e.r.sk, onSkillHit(e){ e.r.sk++; },\n  skills:{\n'+specs.map(x=>one(x[0],x[1])).join(',\n')+'\n  }},'; }
/* 카드 한 장을 캐릭터로: 덩이를 칸에 앉히고 CH에 올린다 */
function forgeBuild(txt){ const card=parseCard(txt),res={card,specs:[],pass:[],err:''}; if(!card.name){ res.err="맨 위에 [ 칭호, 이름 ] 줄이 있어야 한다."; return res; } if(!card.cls){ card.cls='전사'; res.pass.push('직업(@전사 등)이 없어 전사로 잡았다.'); } if(!card.grade) card.grade='고화';
  const free=['n1','n2'],xs2=['x1','x2','x3','x4'],used={}; const seat=k=>{ let s=null; if(k==='일반') s=free.shift()||(!used.aw?'aw':xs2.shift()); else if(k==='궁극') s=used.ult?xs2.shift():'ult'; else if(k==='각성'||k==='초월') s=!used.aw?'aw':xs2.shift(); else s=xs2.shift(); if(s) used[s]=1; return s; };
  for(const b of card.blocks){ if(b.kind==='패시브'){ res.pass.push("패시브 '"+b.name+"' — 자동으로 넣지 못한다: "+b.lines.join(' ')); continue; } const sp=specOf(b),s=seat(b.kind); if(!s){ res.pass.push("'"+b.name+"' — 칸이 모자라 넣지 못했다."); continue; } if(b.cond) sp.warn.push('조건: '+b.cond+' — 시험장에서는 스킬 적중 12회로 대신한다'); if(!sp.cd&&s!=='ult') sp.cd=b.kind==='일반'?8:30; res.specs.push([s,sp]); }
  if(!res.specs.length) res.err='스킬 덩이(일반 스킬 \'이름\' (8s) …)를 하나도 찾지 못했다.'; return res; }
const noTag=v=>String(v==null?'':v).replace(/[<>&"'`]/g,'').trim();   /* 손으로 적은 이름은 화면에 넣기 전에 다듬는다 */
function forgeAdd(txt,res){ res=res||forgeBuild(txt); if(res.err) return null; if(!hasK(CLASSES,res.card.cls)) return null; res.card.name=noTag(res.card.name).slice(0,30)||'이름 없음'; res.card.title=noTag(res.card.title).slice(0,30); res.card.grade=noTag(res.card.grade).slice(0,8)||'초안'; for(const x of res.specs){ x[1].name=noTag(x[1].name).slice(0,40)||'스킬'; if(x[1].kind) x[1].kind=noTag(x[1].kind).slice(0,8); } const card=res.card,key='c_'+[...card.name].map(c=>c.charCodeAt(0).toString(36)).join('').slice(0,18),b=CLASSES[card.cls],skills={};
  for(const [s,sp] of res.specs) skills[s]=Object.assign({name:sp.name,cd:sp.cd,r:sp.r,cast(e){ runSpec(e,sp); }},sp.kind!=='일반'&&s!=='ult'?{kind:sp.kind}:{},s==='ult'?{can:e=>e.r.sk>=12,need:'스킬 적중 12회'}:{});
  const ranged=res.specs.some(x=>x[1].shapes.some(h=>h.t==='proj')),warn=res.specs.flatMap(x=>x[1].warn.map(w=>"'"+x[1].name+"': "+w)).concat(res.pass);
  CH[key]={name:(card.title?card.title+', ':'초안, ')+card.name,cls:card.cls,grade:card.grade,range:ranged?7:2.4,custom:true,key,hp:card.hp||b.hp,atk:card.atk||b.atk,col:'hsl('+(HUES[card.cls][0]+Math.floor(Math.random()*(HUES[card.cls][1]-HUES[card.cls][0])))+',80%,64%)',
    init:e=>{e.r={sk:0}}, hud:e=>'초안 · 스킬 적중 '+e.r.sk, onSkillHit(e){ e.r.sk++; }, skills, note:('카드에서 자동으로 만든 초안이다. '+(warn.length?'손봐야 할 것 — '+warn.join(' · '):'읽지 못한 것은 없다.')).replace(/[<>&]/g,'')};
  CARDTEXT[key]=txt; LOOK[key]={el:'steel',w:{전사:'sword',수호자:'mace',마법사:'wand',암살자:'dagger',지원가:'ringstaff',척후병:'bow'}[card.cls]||'sword',hair:'#b9c3ea',acc:[]}; return key; }
/* ───── 화면 ───── */
{ let last=null; const load=()=>{ try{ const L=JSON.parse(localStorage.getItem('aetherForge')||'[]'); return Array.isArray(L)?L:[]; }catch(x){ return []; } },store=L=>{ try{ localStorage.setItem('aetherForge',JSON.stringify(L)); }catch(x){} };
  const list=()=>{ const ks=Object.keys(CH).filter(k=>CH[k].custom); $('f-list').innerHTML=ks.length?ks.map(k=>'<div class="pl"><b>'+esc(CH[k].name)+'</b><span style="color:var(--muted)">'+CH[k].grade+' '+CH[k].cls+'</span><button type="button" data-u="'+k+'" style="height:34px;border:1px solid var(--line);border-radius:8px;background:var(--panel);padding:0 10px">쓰기</button><button type="button" data-d="'+k+'" style="height:34px;border:1px solid var(--line);border-radius:8px;background:var(--panel);padding:0 10px">지우기</button></div>').join(''):'<p class="sub">아직 만든 것이 없다.</p>'; };
  const show=res=>{ last=res; if(res.err){ $('f-out').innerHTML='<p class="note" style="border-color:var(--foe)">'+esc(res.err)+'</p>'; $('f-add').disabled=true; $('f-code').textContent=''; return; } const c=res.card;
    $('f-out').innerHTML='<p class="title" style="font-size:20px">'+esc((c.title?c.title+', ':'')+c.name)+'</p><p class="sub">'+c.grade+' · '+c.cls+(c.hp?' · HP '+c.hp:'')+'</p>'+res.specs.map(x=>{ const sp=x[1],bn={n1:'일반 ①',n2:'일반 ②',aw:'각성 칸',ult:'궁극 칸'}[x[0]]||(+x[0][1]+4)+'번 칸'; return '<h2>'+bn+' · '+esc(sp.name)+(sp.cd?' ('+sp.cd+'s)':'')+'</h2>'+(sp.ok.length?'<p class="note" style="border-color:var(--ok)">읽은 것: '+esc(sp.ok.join(' · '))+'</p>':'<p class="note" style="border-color:var(--foe)">읽어 낸 효과가 없다. 꼬리표(#원형 범위 피해_3칸 등)를 확인한다.</p>')+sp.warn.map(w=>'<p class="note" style="border-color:var(--warn)">'+esc(w)+'</p>').join(''); }).join('')+(res.pass.length?'<h2>자동으로 못 넣은 것</h2>'+res.pass.map(w=>'<p class="note" style="border-color:var(--warn)">'+esc(w)+'</p>').join(''):'');
    $('f-add').disabled=false; $('f-code').textContent=codeOf(c,res.specs); };
  $('forgeb').onclick=()=>{ list(); $('forge').hidden=false; $('forge').scrollTop=0; }; $('f-close').onclick=()=>{ $('forge').hidden=true; };
  $('f-ex').onclick=()=>{ $('f-text').value=CARDTEXT.ei; show(forgeBuild($('f-text').value)); };
  $('f-parse').onclick=()=>show(forgeBuild($('f-text').value));
  $('f-add').onclick=()=>{ const txt=$('f-text').value; if(typeof forgeBuild==='function'){ const r=forgeBuild(txt); if(r&&!r.err) last=r; } if(!last||last.err) return; const key=forgeAdd(txt,last); if(!key) return; const L=load().filter(t=>parseCard(t).name!==last.card.name); L.push(txt); store(L); list(); sel.me=key; sel.meR=false; slot='me'; tab=CH[key].cls; drawSel(); save(); toast(CH[key].name.split(', ')[1]+' · 시험장에 넣고 내 캐릭터로 골랐다'); };
  $('f-list').onclick=e=>{ const u=e.target.closest('[data-u]'),d=e.target.closest('[data-d]'); if(u){ sel.me=u.dataset.u; sel.meR=false; tab=CH[sel.me].cls; drawSel(); save(); toast('내 캐릭터로 골랐다'); } if(d){ const k=d.dataset.d,nm=CH[k].name.split(', ')[1]; store(load().filter(t=>parseCard(t).name!==nm)); delete CH[k]; delete CARDTEXT[k]; if(sel.me===k) sel.me='ross'; if(sel.foe===k) sel.foe='ei'; for(const gk of ['al','fo']) sel[gk]=sel[gk].map(x=>x===k?null:x); list(); drawSel(); save(); } };
  $('f-copy').onclick=async()=>{ try{ await navigator.clipboard.writeText($('f-code').textContent); toast('코드를 복사했다'); }catch(x){ toast('복사하지 못했다. 길게 눌러 직접 고른다'); } };
  /* 저장해 둔 초안을 다시 올린다 */
  for(const t of load()){ try{ forgeAdd(t); }catch(x){} } if(Object.keys(CH).some(k=>CH[k].custom)){ try{ const d=SAVE1; if(d&&d.sel){ if(CH[d.sel.me]&&CH[d.sel.me].custom) sel.me=d.sel.me; if(CH[d.sel.foe]&&CH[d.sel.foe].custom) sel.foe=d.sel.foe; } }catch(x){} drawSel(); } }
