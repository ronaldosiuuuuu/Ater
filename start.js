/* 홈 화면 앱(PWA): https(또는 localhost)로 열었을 때만 서비스 워커를 건다. 파일을 그냥 연 경우에는 아무 일도 하지 않는다. */
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)) addEventListener('load',()=>{ navigator.serviceWorker.register('sw.js').catch(()=>{}); });
{ let ask=null; const b=document.getElementById('instb');
  const alone=()=>matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches||navigator.standalone===true,web=/^https?:$/.test(location.protocol),ios=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  b.hidden=alone();
  addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); ask=e; b.hidden=false; });
  b.onclick=async()=>{ if(ask){ ask.prompt(); try{ await ask.userChoice; }catch(x){} ask=null; return; }
    toast(!web?'파일로 바로 연 상태에서는 앱으로 깔 수 없다. 폴더의 배포.md대로 인터넷 주소에 올린 뒤 그 주소에서 누른다':ios?'아이폰·아이패드: 사파리 아래의 공유 단추 → 홈 화면에 추가':'브라우저 메뉴(⋮) → 앱 설치 또는 홈 화면에 추가',6000); };
  addEventListener('appinstalled',()=>{ b.hidden=true; toast('홈 화면에 깔았다.'); });
  /* 새 판이 받아지면: 싸우는 중이 아니면 바로 다시 열고, 싸우는 중이면 끝난 뒤에 알린다 */
  if('serviceWorker' in navigator&&web){ let had=!!navigator.serviceWorker.controller; navigator.serviceWorker.addEventListener('controllerchange',()=>{ if(!had){ had=true; return; } if(!running) location.reload(); else toast('새 판을 받았다 · 이 판이 끝나고 다시 열면 바뀐다',5000); });
    document.addEventListener('visibilitychange',()=>{ if(!document.hidden) navigator.serviceWorker.getRegistration().then(r=>{ if(r) r.update(); }).catch(()=>{}); }); } }
