"use strict";
/* 컴퓨터끼리 대전표. 화면을 그리지 않고 엔진만 빠르게 돌려, 캐릭터별 승률과 상대별 전적을 잰다.
   조건: 시험장 맵 · 1대1 단판 · 양쪽 모두 어려움 실력. 90초 안에 안 끝나면 비김(반 승).
   콘솔에서 Bench.run(['ross','ei',…],2) 로 직접 돌릴 수도 있다. */
const Bench={ keys:[],n:2,res:null,running:false,stop:false,sort:'rate',dir:-1,pick:null, DT:1/40, LIMIT:90,
 pools:{ '전체':k=>true, '재림 빼고':k=>!CH[k].re, '고화':k=>!CH[k].re&&CH[k].grade==='고화', '서사':k=>!CH[k].re&&CH[k].grade==='서사', '전설':k=>!CH[k].re&&CH[k].grade==='전설', '히든':k=>!CH[k].re&&CH[k].grade==='히든', '재림만':k=>!!CH[k].re }, pool:'고화',
 /* 한 판을 준비한다 */
 setup(a,b){ now=0; projs=[]; fx=[]; floats=[]; zones=[]; walls=[]; Q=[]; parts=[]; msgs=[]; procs=[]; dlog=[]; over=null; score=[0,0]; chaosUntil=0; banner=null; mini=null; LAND=false; mapSet();
   const p=home(0,6),q=home(1,6); me=mk(a,0,p.x,p.y); foe=mk(b,1,q.x,q.y); ents=[me,foe]; me.slot=foe.slot=0; me.busy=foe.busy=.5; stick.x=stick.y=0; for(const k in held) held[k]=false; },
 /* 한 걸음. 내 칸도 컴퓨터가 움직인다 */
 tick(){ if(!me.dead){ think(me,this.DT); steer(me); stick.x=me.mv.x; stick.y=me.mv.y; } step(this.DT); if(parts.length>60) parts.length=0; },
 /* 판이 끝났으면 0(a 승)·1(b 승)·.5(비김), 아니면 null */
 verdict(){ if(over) return over.winner?(over.winner.team===0?0:1):.5; if(now>=this.LIMIT) return .5; return null; },
 async run(keys,n,onProg){ if(this.running) return; this.running=true; this.stop=false; const sv={practice,mode,teamN,diff,map:OPT.map,muted}; practice=false; mode=1; teamN=1; diff=2; OPT.map='basic'; benching=true;
   const K=keys.slice(),N=K.length,R={keys:K,n,w:K.map(()=>new Float32Array(N)),g:K.map(()=>new Uint16Array(N)),t:K.map(()=>0),done:0,total:N*(N-1)/2*n,at:Date.now()}; this.res=R;
   try{ let slice=performance.now(); for(let i=0;i<N&&!this.stop;i++) for(let j=i+1;j<N&&!this.stop;j++) for(let r=0;r<n&&!this.stop;r++){ const sw=r%2===1,a=sw?j:i,b=sw?i:j; this.setup(K[a],K[b]); let v=null;
        while(v===null){ this.tick(); v=this.verdict(); if(performance.now()-slice>40){ await new Promise(z=>setTimeout(z,0)); slice=performance.now(); if(this.stop) break; } }
        if(v===null) break; R.w[a][b]+=1-v; R.w[b][a]+=v; R.g[a][b]++; R.g[b][a]++; R.t[a]+=now; R.t[b]+=now; R.done++; if(onProg&&R.done%10===0) onProg(R); } }
   finally { benching=false; over=null; ents=[]; me=null; foe=null; practice=sv.practice; mode=sv.mode; teamN=sv.teamN; diff=sv.diff; OPT.map=sv.map; this.running=false; if(onProg) onProg(R); }
   return R; },
 /* 캐릭터별 합계 줄 */
 rows(R){ return R.keys.map((k,i)=>{ let w=0,g2=0; for(let j=0;j<R.keys.length;j++){ w+=R.w[i][j]; g2+=R.g[i][j]; } const c=CH[k]; return {k,i,name:c.name.split(', ')[1]+(c.re?' (재림)':''),grade:c.re?'재림':c.grade,cls:c.cls,w,g:g2,rate:g2?w/g2:0,time:g2?R.t[i]/g2:0}; }); },
 csv(R){ const rows=this.rows(R).sort((a,b)=>b.rate-a.rate); let s='이름,등급,직업,판,승(비김 0.5),승률,평균 시간(초)\n'+rows.map(r=>[r.name,r.grade,r.cls,r.g,r.w,(r.rate*100).toFixed(1),r.time.toFixed(1)].join(',')).join('\n');
   s+='\n\n상대별 승률(가로줄이 세로줄을 이긴 비율 %)\n,'+R.keys.map(k=>CH[k].name.split(', ')[1]+(CH[k].re?'(재림)':'')).join(',')+'\n'+R.keys.map((k,i)=>CH[k].name.split(', ')[1]+(CH[k].re?'(재림)':'')+','+R.keys.map((_,j)=>i===j||!R.g[i][j]?'':(100*R.w[i][j]/R.g[i][j]).toFixed(0)).join(',')).join('\n'); return s; }
};
/* ───── 화면 ───── */
{ const stat=R=>{ $('b-stat').textContent=!R?'아직 돌리지 않았다.':(Bench.running?'돌리는 중 · ':'')+R.done+' / '+R.total+'판 ('+Math.round(100*R.done/Math.max(1,R.total))+'%) · '+R.keys.length+'명 · 짝마다 '+R.n+'판'+(Bench.running?'':R.done<R.total?' · 멈춤':' · 끝'); };
  const table=()=>{ const R=Bench.res; if(!R||!R.done){ $('b-tbl').innerHTML=''; $('b-pick').textContent=''; return; } const rows=Bench.rows(R),s=Bench.sort; rows.sort((a,b)=>(typeof a[s]==='string'?a[s].localeCompare(b[s]):a[s]-b[s])*Bench.dir);
    const H=[['name','이름'],['grade','등급'],['rate','승률'],['w','승'],['g','판'],['time','평균 초']];
    $('b-tbl').innerHTML='<tr>'+H.map(h=>'<th data-s="'+h[0]+'">'+h[1]+(s===h[0]?(Bench.dir<0?' ▼':' ▲'):'')+'</th>').join('')+'</tr>'+rows.map(r=>'<tr data-k="'+r.k+'"'+(Bench.pick===r.k?' class="on"':'')+'><td><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:'+CH[r.k].col+';margin-right:6px"></i>'+r.name+'</td><td>'+r.grade+' '+r.cls+'</td><td>'+(r.rate*100).toFixed(1)+'%</td><td>'+r.w+'</td><td>'+r.g+'</td><td>'+r.time.toFixed(1)+'</td></tr>').join('');
    const pi=R.keys.indexOf(Bench.pick); if(pi<0){ $('b-pick').textContent='줄을 누르면 그 캐릭터가 잘 잡는 상대와 못 잡는 상대가 나온다. 머리줄을 누르면 그 기준으로 줄을 세운다.'; return; }
    const vs=R.keys.map((k,j)=>({n:CH[k].name.split(', ')[1]+(CH[k].re?'(재림)':''),r:R.g[pi][j]?R.w[pi][j]/R.g[pi][j]:null})).filter((x,j)=>j!==pi&&x.r!==null).sort((a,b)=>b.r-a.r),f=x=>x.n+' '+Math.round(x.r*100)+'%';
    $('b-pick').textContent=CH[Bench.pick].name+' — 잘 잡는 상대: '+vs.slice(0,5).map(f).join(', ')+' / 못 잡는 상대: '+vs.slice(-5).reverse().map(f).join(', '); };
  const pools=()=>{ $('b-pool').innerHTML=Object.keys(Bench.pools).map(k=>{ const c=Object.keys(CH).filter(Bench.pools[k]).length; return '<button type="button" data-v="'+k+'" aria-pressed="'+(Bench.pool===k)+'">'+k+' '+c+'명</button>'; }).join(''); };
  let lastDraw=0; const prog=R=>{ stat(R); const t=performance.now(); if(!Bench.running||t-lastDraw>1500){ lastDraw=t; table(); } if(!Bench.running){ $('b-run').textContent='시작'; try{ localStorage.setItem('aetherBench',JSON.stringify({keys:R.keys,n:R.n,done:R.done,total:R.total,t:R.t,w:R.w.map(a=>Array.from(a)),g:R.g.map(a=>Array.from(a))})); }catch(x){} } };
  $('benchb').onclick=()=>{ bgmStop(); pools(); stat(Bench.res); table(); $('bench').hidden=false; $('bench').scrollTop=0; };
  $('b-close').onclick=()=>{ if(Bench.running) Bench.stop=true; $('bench').hidden=true; };
  $('b-pool').onclick=e=>{ const b=e.target.closest('button'); if(!b||Bench.running) return; Bench.pool=b.dataset.v; pools(); };
  $('b-n').onclick=e=>{ const b=e.target.closest('button'); if(!b||Bench.running) return; Bench.n=+b.dataset.v; $('b-n').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b)); };
  $('b-run').onclick=()=>{ if(Bench.running){ Bench.stop=true; return; } const keys=Object.keys(CH).filter(Bench.pools[Bench.pool]); Bench.pick=null; $('b-run').textContent='멈춤'; Bench.run(keys,Bench.n,prog); };
  $('b-tbl').onclick=e=>{ const h=e.target.closest('th'); if(h){ if(Bench.sort===h.dataset.s) Bench.dir=-Bench.dir; else { Bench.sort=h.dataset.s; Bench.dir=h.dataset.s==='name'||h.dataset.s==='grade'?1:-1; } table(); return; } const r=e.target.closest('tr[data-k]'); if(r){ Bench.pick=Bench.pick===r.dataset.k?null:r.dataset.k; table(); } };
  $('b-csv').onclick=()=>{ const R=Bench.res; if(!R||!R.done) return; const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob(['﻿'+Bench.csv(R)],{type:'text/csv'})); a.download='aether-대전표.csv'; document.body.appendChild(a); a.click(); a.remove(); };
  try{ const d=JSON.parse(localStorage.getItem('aetherBench')||'null'); if(d&&d.keys.every(k=>CH[k])) Bench.res={keys:d.keys,n:d.n,done:d.done,total:d.total,t:d.t,w:d.w.map(a=>Float32Array.from(a)),g:d.g.map(a=>Uint16Array.from(a)),at:0}; }catch(x){} }
