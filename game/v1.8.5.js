"use strict";
/* ════════════════ 1.8.5 저장 지키기 ════════════════
   1) 브라우저에 '이 기록은 지우지 말라'고 부탁한다(navigator.storage.persist).
      크롬 · 사파리는 묻지 않고 알아서 정하고, 파이어폭스는 한 번 묻는다. 그래서 처음 화면을 누른 때에 한 번만 부탁한다.
   2) 저장을 파일로 내보내고, 파일에서 가져온다. 글 형식(AETHER1:)은 예전 「저장 내보내기」와 같아서 서로 바꿔 쓸 수 있다.
   3) 마지막으로 내보낸 날을 기록 화면에 보이고, 한 번도 안 했거나 14일이 지났으면 하루 한 번 알린다. */
{ const LAST='aetherExportAt', ASKED='aetherPersistAsked', NAG='aetherExportNag', DAY=864e5;
  const ls={ get:k=>{ try{ return localStorage.getItem(k); }catch(x){ return null; } }, set:(k,v)=>{ try{ localStorage.setItem(k,String(v)); }catch(x){} } };

  /* 1) 지우지 말라고 부탁하기 */
  const askKeep=async()=>{ try{ const s=navigator.storage; if(!s||!s.persist) return; if(await s.persisted()) return; if(ls.get(ASKED)) return; ls.set(ASKED,Date.now()); await s.persist(); }catch(x){} };
  document.addEventListener('pointerdown',askKeep,{once:true,capture:true});

  /* 2) 파일로 내보내기 · 가져오기. 글 내보내기와 같은 함수(saveText · saveLoad, game/meta.js)를 써서 같은 칸만 담고 같은 검사를 거친다 */
  const code=()=>saveText(),apply=v=>saveLoad(v);
  const stamp=()=>{ ls.set(LAST,Date.now()); };
  const name=()=>{ const d=new Date(),p=n=>String(n).padStart(2,'0'); return '에테르-저장-'+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'.txt'; };
  const saveFile=()=>{ try{ const b=new Blob([code()],{type:'text/plain'}),u=URL.createObjectURL(b),a=document.createElement('a'); a.href=u; a.download=name(); document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(u),4000); stamp(); toast('파일로 내보냈다 · 휴대폰은 「다운로드」나 「파일」 앱에 있다',3600); drawRec(); }catch(x){ toast('파일로 내보내지 못했다. 「저장 내보내기」로 글을 복사해 둔다',3600); } };
  const loadFile=()=>{ const i=document.createElement('input'); i.type='file'; i.accept='.txt,text/plain'; i.onchange=async()=>{ const f=i.files&&i.files[0]; if(!f) return; try{ apply(await f.text()); toast('가져왔다 · 다시 연다'); setTimeout(()=>location.reload(),900); }catch(x){ toast('이 파일은 에테르 저장이 아니다. 내보낸 파일을 그대로 골랐는지 본다',3600); } }; i.click(); };

  document.addEventListener('click',e=>{ const t=e.target.closest&&e.target.closest('#sv-file,#sv-load,#sv-copy'); if(!t) return;
    if(t.id==='sv-file') saveFile(); else if(t.id==='sv-load') loadFile(); else stamp(); /* 글을 복사해 간 것도 내보낸 것으로 친다 */ });

  const ago=()=>{ const t=+ls.get(LAST)||0; if(!t) return null; return Math.floor((Date.now()-t)/DAY); };
  const dr=drawRec; drawRec=function(){ dr(); const inn=$('sv-in'); if(!inn||$('sv-file')) return; const d=ago(),old=d===null||d>=14;
    inn.closest('.row').insertAdjacentHTML('afterend','<div class="row" style="margin-top:8px"><button type="button" id="sv-file">파일로 저장</button><button type="button" id="sv-load">파일 불러오기</button></div><p class="note" style="color:'+(old?'var(--gold)':'var(--muted)')+'">'+(d===null?'아직 한 번도 내보내지 않았다.':d===0?'오늘 내보냈다.':'마지막으로 내보낸 지 '+d+'일 지났다.')+'</p>'); };

  /* 3) 오래 안 내보냈으면 하루 한 번 알린다. 몇 판 해 본 사람에게만(처음 들어온 사람에게는 띄우지 않는다) */
  setTimeout(()=>{ try{ const played=(PF.w||0)+(PF.l||0); if(played<10) return; const d=ago(); if(d!==null&&d<14) return; const today=new Date().toDateString(); if(ls.get(NAG)===today) return; if(typeof running!=='undefined'&&running) return; ls.set(NAG,today);
    toast(d===null?'기록은 이 기기에만 있다 · 기록 탭 맨 아래에서 저장을 내보내 둔다':'저장을 내보낸 지 '+d+'일 지났다 · 기록 탭 맨 아래에서 내보내 둔다',4200); }catch(x){} },6000);
}

/* ════════════════ 1.8.5 태그매치가 멈추지 않게 ════════════════
   방장(혼자 할 때는 나): 한 편의 캐릭터가 모두 쓰러졌는데 판이 안 끝났으면 바로 끝낸다.
     싸우던 캐릭터가 쓰러진 뒤 2.5초가 지나도 다음 캐릭터가 안 들어오면 다시 들여보내고, 그래도 안 되면 판을 끝낸다.
   손님: 한 편이 모두 쓰러진 것이 보이는데 4초가 지나도 방장에게서 끝 소식이 없으면 스스로 결과를 띄운다. */
{ const since=[0,0];
  on('step',()=>{ if(typeof TG==='undefined'||!TG||over||NET.client||!running) return;
    for(const tm of [0,1]){ const all=tagAll(tm); if(!all.length) continue; const alive=all.filter(o=>!o.dead);
      if(!alive.length){ const w=tagAct(1-tm)||tagAll(1-tm).find(o=>!o.dead)||ents.find(o=>o.team!==tm); if(w){ finish(w); return; } continue; }
      const a=tagAct(tm); if(a&&!a.dead){ since[tm]=0; continue; }
      if(!since[tm]){ since[tm]=now; continue; } if(now-since[tm]<2.5) continue; since[tm]=now;
      const L=[tagNext(tm)].concat(TG.bench[tm].filter(o=>!o.dead)).filter(Boolean); let ok=false; for(const nx of L){ if(tagSwap(tm,nx,true)){ ok=true; break; } }
      if(!ok){ const w=tagAct(1-tm)||ents.find(o=>o.team!==tm&&!o.dead); if(w) finish(w); return; } } });
  on('begin',()=>{ since[0]=since[1]=0; });
  setInterval(()=>{ try{ if(!NET.client||!NET.playing||over||!NET.tg||!running) { NET.tgEnd=0; return; } const t=NET.tg;
      const gone=[0,1].find(tm=>t.ad&&t.ad[tm]&&Array.isArray(t.b&&t.b[tm])&&t.b[tm].every(x=>Array.isArray(x)&&x[4]));
      if(gone===undefined){ NET.tgEnd=0; return; } if(!NET.tgEnd){ NET.tgEnd=performance.now(); return; } if(performance.now()-NET.tgEnd<4000) return;
      NET.tgEnd=0; const w=ents.find(o=>o.teamRaw===1-gone&&!o.dead)||ents.find(o=>o.teamRaw===1-gone)||null; over={winner:w,t:now}; NET.playing=false; showResult(); }catch(x){} },1000); }

/* ════════════════ 1.8.5 판이 끝났다는 소식을 손님에게 꼭 전한다 ════════════════
   화면 상태 메시지는 클 수 있어서(큰 메시지는 PeerJS가 보내지 않는다) 끝 소식을 아주 작은 메시지로 따로 두 번 보낸다.
   손님은 방장의 판이 끝났다고 들었는데(살아 있는지 묻는 답에 실려 온다) 3초가 지나도 결과가 안 떴으면 스스로 띄운다 */
on('end',w=>{ if(!NET.host||!NET.tx) return; const m={t:'ov',w:w&&w.id?w.id:0,wt:w?w.team:-1,at:r2(now)}; sendAll(m); setTimeout(()=>{ if(NET.host&&NET.tx) sendAll(m); },1000); });
{ const showEnd=(w,t)=>{ if(!NET.client||!NET.playing||over) return; over={winner:w,t:t}; setTimeout(()=>{ if(NET.client&&over&&NET.playing){ NET.playing=false; showResult(); } },900); };
  const guess=()=>{ const t=NET.tg; if(t&&t.ad&&Array.isArray(t.b)){ const gone=[0,1].find(tm=>t.ad[tm]&&Array.isArray(t.b[tm])&&t.b[tm].every(x=>Array.isArray(x)&&x[4])); if(gone!==undefined) return ents.find(o=>o.teamRaw===1-gone&&!o.dead)||ents.find(o=>o.teamRaw===1-gone)||null; } return null; };
  onMsg('client',{pre(d){
    if(d&&d.t==='ov'&&typeof d==='object'){ const id=+d.w||0; showEnd(id&&NET.em.get(id)||(d.wt===0||d.wt===1?ents.find(o=>o.teamRaw===d.wt):null)||null,Number.isFinite(+d.at)?+d.at:now); return true; }
    if(d&&d.t==='pg'&&NET.client){ if(NET.playing&&d.lv===0&&!over){ NET.lvOff=NET.lvOff||performance.now(); if(performance.now()-NET.lvOff>3000){ NET.lvOff=0; showEnd((d.ow&&NET.em.get(+d.ow))||(d.owt===0||d.owt===1?ents.find(o=>o.teamRaw===d.owt):null)||guess(),now); } } else NET.lvOff=0; } }}); }
