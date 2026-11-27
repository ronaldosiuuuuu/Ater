"use strict";
/* 1.8.4: 보안 점검 · 방장이 보낸 것을 손님 쪽에서 다시 거르기 · 방장의 내보내기 */
/* ════════════════ 1.8.4 보안: 방장이 보낸 것을 손님 쪽에서 한 번 더 살핀다 ════════════════
   이상한 꼴의 메시지는 버리고, 이름 · 글은 다듬고, 캐릭터 · 맵 이름은 정말 있는 것만 받는다. 맨 바깥에서 먼저 거른다 */
{ const pidOk=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,64}$/.test(v),num=(v,a,b,f)=>{ v=+v; return Number.isFinite(v)?Math.min(b,Math.max(a,v)):f; },arr=(v,n)=>Array.isArray(v)?v.slice(0,n):[];
  const colOk=v=>typeof v==='string'&&/^(#[0-9a-f]{3,8}|rgba?\([\d.,\s%]+\)|var\(--[\w-]+\))$/i.test(v)?v:'';
  const fix={
    lobby(d){ d.players=arr(d.players,12).filter(p=>p&&typeof p==='object'&&pidOk(p.pid)).map(p=>({pid:p.pid,name:cleanName(p.name)||'손님',key:okKey(p.key)?p.key:'ei',re:!!p.re,team:p.team===1?1:0,host:!!p.host,ready:!!p.ready,done:okKey(p.done)?p.done:'',tag:arr(p.tag,2).filter(okKey),fc:typeof p.fc==='string'&&/^[A-HJ-NP-Z2-9]{10}$/.test(p.fc)?p.fc:'',rnd:p.rnd===true}));
      d.code=typeof d.code==='string'&&/^[A-Z0-9]{4,6}$/.test(d.code)?d.code:NET.code; d.you=pidOk(d.you)?d.you:NET.pid; d.hm=num(d.hm,0,9,0)|0;
      if(typeof d.tok==='string'&&/^[A-Za-z0-9]{8,32}$/.test(d.tok)){ NET.tok=d.tok; try{ sessionStorage.setItem('aetherTok',(d.code||NET.code)+':'+d.tok); }catch(x){} } else delete d.tok;
      const hs=d.hs&&typeof d.hs==='object'?d.hs:null; d.hs=hs?{sum:cleanText(hs.sum,200),m:num(hs.m,0,9,0)|0,n:num(hs.n,1,6,1)|0,mon:cleanText(hs.mon,40)}:undefined; },
    start(d){ d.mode=num(d.mode,0,9,1)|0; d.teamN=num(d.teamN,1,6,1)|0; if(!hasK(MAPS,d.map)) d.map='basic'; d.team=d.team===1?1:0; if('diff' in d) d.diff=num(d.diff,0,9,1); if('mon' in d) d.mon=(okKey(d.mon)||hasK(CH,d.mon)&&CH[d.mon].mon)?d.mon:''; if('cap' in d) d.cap=num(d.cap,1,99999,100); if('kit' in d) if('kit' in d) d.kit=arr(d.kit,160).filter(id=>typeof id==='string'&&hasK(POWERS,id)); },
    s(d){ for(const k of ['e','p','f','z','w','fl','ft']) d[k]=Array.isArray(d[k])?d[k].filter(x=>x&&typeof x==='object'):[]; d.n=num(d.n,0,1e7,0);
      for(const k of ['sc','cp']) d[k]=Array.isArray(d[k])?[num(d[k][0],0,1e6,0),num(d[k][1],0,1e6,0)]:[0,0]; d.ch=Array.isArray(d.ch)?[num(d.ch[0],0,1e7,0),cleanText(d.ch[1],40)]:[0,''];
      /* 1.9.11 태그매치 상태: 정해진 꼴(편마다 두 칸)만 남긴다 */ if('tg' in d){ const t=d.tg; if(!t||typeof t!=='object'||Array.isArray(t)) delete d.tg; else { const two=(v,f)=>{ const a=Array.isArray(v)?v:[]; return [f(a[0]),f(a[1])]; },n0=v=>num(v,0,1e9,0)|0;
        d.tg={a:two(t.a,n0),ao:two(t.ao,v=>pidOk(v)||v==='host'||v==='ai'?v:''),b:two(t.b,v=>arr(v,8).filter(Array.isArray).map(x=>[n0(x[0]),hasK(CH,x[1])?x[1]:'',num(x[2],0,1e7,0),num(x[3],1,1e7,1),!!x[4],cleanText(x[5],64)])),w:two(t.w,v=>cleanText(v,80)),p:two(t.p,n0),ad:two(t.ad,v=>!!v),k:two(t.k,v=>num(v,0,99,0)|0)}; } } },
    chat(d){ d.name=cleanName(d.name)||'손님'; d.text=cleanText(d.text,80); d.team=d.team===1?1:0; d.pid=pidOk(d.pid)?d.pid:''; },
    pz(d){ d.name=cleanName(d.name); d.who=pidOk(d.who)?d.who:'host'; d.on=!!d.on; d.host=!!d.host; },
    bye(d){ d.why=cleanText(d.why,140); },
    note(d){ d.text=cleanText(d.text,60); },
    pg(d){ d.ts=num(d.ts,-1e12,1e12,0); },
    tw(d){ d.end=cleanText(d.end,140); d.floor=num(d.floor,0,9999,0)|0; d.what=cleanText(d.what,200); d.best=num(d.best,0,9999,0)|0; d.pw=arr(d.pw,60).map(x=>cleanText(x,40)); d.gear=arr(d.gear,6).map(x=>cleanText(x,40)); d.sig=cleanText(d.sig,2000); d.ids=arr(d.ids,160).filter(id=>typeof id==='string'&&hasK(POWERS,id)); d.hpB=num(d.hpB,0,1e5,0)|0; d.atkB=num(d.atkB,0,1e4,0)|0; d.train=num(d.train,0,999,0)|0;
      d.ch=arr(d.ch,10).filter(c=>c&&typeof c==='object').map(c=>({a:['rw','path','buy'].includes(c.a)?c.a:'rw',t:cleanText(c.t,80),p:String(c.p==null?'':c.p).slice(0,500),col:colOk(c.col),dis:!!c.dis}));
      d.votes=arr(d.votes,12).filter(Array.isArray).map(v=>[num(v[0],0,9,0)|0,cleanName(v[1])||'손님',pidOk(v[2])?v[2]:'']); } };
  onMsg('client',{pre(d){ if(!d||typeof d!=='object'||Array.isArray(d)||typeof d.t!=='string') return true; const f=hasK(fix,d.t)?fix[d.t]:null; if(f){ try{ f(d); }catch(x){ return true; } } }}); }
/* 방장: 함께 탭 명단에서 사람을 내보낸다(두 번 눌러야 한다). 내보낸 사람은 그 자리 표로 이 방에 다시 들어오지 못한다 */
{ const st=document.createElement('style'); st.textContent='#n-list .pl .kick{margin-left:auto;height:30px;min-height:30px;padding:0 10px;border:1px solid var(--foe);border-radius:8px;background:transparent;color:var(--foe);font-size:12px;flex:0 0 auto}'; document.head.appendChild(st);
  const dnK=drawNet; drawNet=function(){ dnK(); if(!NET.host) return; const L=$('n-list'); if(!L) return; L.querySelectorAll('.pl').forEach((el,i)=>{ const p=NET.players[i]; if(!p||p.host||el.querySelector('.kick')) return; el.insertAdjacentHTML('beforeend','<button type="button" class="kick" data-kick="'+esc(p.pid)+'">내보내기</button>'); }); };
  let armed={pid:'',t:0}; document.addEventListener('click',e=>{ const b=e.target&&e.target.closest&&e.target.closest('#n-list .kick'); if(!b) return; e.stopPropagation(); e.preventDefault(); if(!NET.host) return;
    const pid=b.dataset.kick,p=NET.players.find(x=>x.pid===pid&&!x.host); if(!p) return; const t=performance.now();
    if(armed.pid!==pid||t-armed.t>2600){ armed={pid,t}; toast('한 번 더 누르면 '+(p.name||'손님')+' 님을 내보낸다',2400); return; } armed={pid:'',t:0};
    NET.ban=NET.ban||new Set(); if(p.tok) NET.ban.add(p.tok); try{ NET.tx.send(pid,{t:'bye',why:'방장이 내보냈다',final:1}); }catch(x){} setTimeout(()=>hostGone(pid),250); toast((p.name||'손님')+' 님을 내보냈다',2200); },true); }
