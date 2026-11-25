"use strict";
/* ════════════════ 1.8.4 저장 지키기 ════════════════
   1) 브라우저에 '이 기록은 지우지 말라'고 부탁한다(navigator.storage.persist).
      크롬 · 사파리는 묻지 않고 알아서 정하고, 파이어폭스는 한 번 묻는다. 그래서 처음 화면을 누른 때에 한 번만 부탁한다.
   2) 저장을 파일로 내보내고, 파일에서 가져온다. 글 형식(AETHER1:)은 예전 「저장 내보내기」와 같아서 서로 바꿔 쓸 수 있다.
   3) 마지막으로 내보낸 날을 기록 화면에 보이고, 한 번도 안 했거나 14일이 지났으면 하루 한 번 알린다. */
{ const LAST='aetherExportAt', ASKED='aetherPersistAsked', NAG='aetherExportNag', DAY=864e5;
  const ls={ get:k=>{ try{ return localStorage.getItem(k); }catch(x){ return null; } }, set:(k,v)=>{ try{ localStorage.setItem(k,String(v)); }catch(x){} } };

  /* 1) 지우지 말라고 부탁하기 */
  const askKeep=async()=>{ try{ const s=navigator.storage; if(!s||!s.persist) return; if(await s.persisted()) return; if(ls.get(ASKED)) return; ls.set(ASKED,Date.now()); await s.persist(); }catch(x){} };
  document.addEventListener('pointerdown',askKeep,{once:true,capture:true});

  /* 2) 파일로 내보내기 · 가져오기. 예전 글 내보내기와 같은 열쇠만 담는다(중계 · 차례 · 이 블록의 표시용 열쇠는 뺀다) */
  const skip=new Set(['aetherTurn','aetherRelay',LAST,ASKED,NAG]);
  const code=()=>{ const o={}; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(/^aether/.test(k)&&!skip.has(k)) o[k]=localStorage.getItem(k); } return 'AETHER1:'+btoa(unescape(encodeURIComponent(JSON.stringify(o)))); };
  const apply=v=>{ v=String(v||'').trim(); if(!/^AETHER1:/.test(v)) throw 0; const o=JSON.parse(decodeURIComponent(escape(atob(v.slice(8))))); if(!o||typeof o!=='object'||!o.aetherProfile) throw 0; for(const k in o) if(/^aether/.test(k)&&!skip.has(k)) localStorage.setItem(k,String(o[k])); };
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
