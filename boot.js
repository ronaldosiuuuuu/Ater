/* 1.8.0 기록 초기화: 브라우저마다 한 번. 진행 기록 · 닉네임은 지우고, 조합 캐릭터 · 화면 · 소리 설정은 남긴다 */
(function(){ try{ if(localStorage.getItem('aetherWipe')!=='1.8.0'){ ['aetherProfile','aetherTower','aetherGuide','aetherName','aetherSeen'].forEach(function(k){ localStorage.removeItem(k); });
  var d=JSON.parse(localStorage.getItem('aether1')||'null'); if(d&&d.sel){ d.sel.me='ei'; d.sel.meR=false; d.sel.foe='vira'; d.sel.al=[null,null,null,null]; d.recent=[]; localStorage.setItem('aether1',JSON.stringify(d)); }
  localStorage.setItem('aetherWipe','1.8.0'); } }catch(x){} })();
