"use strict";
/* 1.0.0 ~ 1.2.2: 재림 · 파편 · 닉네임 · 패치 내역(PATCH) · 가방 · 보상 */
/* ════════════════ 1.0.0 ════════════════ */
/* ── 재림 캐릭터의 몸: 원래 캐릭터보다 체력 +50, 기본 공격 +2 ── */
for(const k of Object.keys(CH)){ const c=CH[k]; if(!c.re||!CH[c.base]) continue; const b=CH[c.base]; if(c.hp===b.hp) c.hp=b.hp+50; if(c.atk===b.atk) c.atk=b.atk+2; }

/* ── 뽑기: 캐릭터 대신 파편이 3~5개 나온다. 파편 10개가 모이면 캐릭터가 되고, 이미 가진 캐릭터라면 '중복' 하나가 된다(재림에 쓴다).
   확률은 고화 60 · 서사 30 · 전설 10. 신화와 히든은 나오지 않는다. ── */
PF.shard=PF.shard||{}; PF.dup=PF.dup||{};
GRATE.length=0; GRATE.push(['고화',75],['서사',22],['전설',3]);
const SHARDN=10, RDUP={고화:3,서사:2,전설:1,히든:0,신화:0};
pullOne=function(minIdx){ PF.pity=(PF.pity||0)+1; const force=PF.pity>=PITY?2:(minIdx||0),L=GRATE.slice(Math.min(force,GRATE.length-1)); let tot=L.reduce((a,x)=>a+x[1],0),x=Math.random()*tot,g=L[L.length-1][0]; for(const q of L){ if((x-=q[1])<0){ g=q[0]; break; } }
  const pool=gachaPool(g),k=pool[Math.floor(Math.random()*pool.length)]; if(!k) return null;
  /* 처음 나온 캐릭터는 파편 없이 바로 준다. 이미 가진 캐릭터면 파편 3~5개(10개가 모이면 중복 하나) */
  if(!PF.own[k]){ PF.own[k]=Date.now(); if(g==='전설') PF.pity=0; mission('pull',1); PF.cnt.pull++; return {k,g,n:0,got:'new',have:PF.shard[k]||0,first:true}; }
  const n=3+Math.floor(Math.random()*3); PF.shard[k]=(PF.shard[k]||0)+n; let got='';
  while(PF.shard[k]>=SHARDN){ PF.shard[k]-=SHARDN; if(!PF.own[k]){ PF.own[k]=Date.now(); got='new'; } else { PF.dup[k]=(PF.dup[k]||0)+1; if(!got) got='dup'; } }
  if(g==='전설') PF.pity=0; mission('pull',1); PF.cnt.pull++; return {k,g,n,got,have:PF.shard[k]||0}; };
gachaShow=function(res,done){ const el=$('tw-body'); let fin=false; const end=()=>{ if(fin) return; fin=true; done(); };
  el.innerHTML=head('GACHA','뽑기','눌러서 넘긴다')+'<div class="gst'+(res.length===1?' one':'')+'">'+res.map(r=>{ const c=CH[r.k]; return '<div class="gc'+(r.got==='new'||r.g==='전설'?' hi':'')+'" style="--gc:'+GCOL[r.g]+'"><div class="bk"></div><div class="ft"><b>'+esc(c.name.split(', ')[1])+'</b><small>'+r.g+(r.direct?'':r.first?' · 첫 획득':' · 파편 ×'+r.n)+'</small><em>'+(r.got==='new'?'캐릭터 획득!':r.got==='dup'?'중복 +1':r.have+' / '+SHARDN)+'</em></div></div>'; }).join('')+'</div><div class="dock"><button class="go" id="ga-skip" type="button">넘기기</button></div>';
  $('tower').hidden=false; $('tower').scrollTop=0; [...el.querySelectorAll('.gc')].forEach((c,i)=>setTimeout(()=>{ if(fin) return; c.classList.add('on'); const r=res[i]; if(r.got==='new'){ sfx('ult'); buzz(80); } else sfx('ui'); },350+i*(res.length>1?260:0)));
  setTimeout(()=>{ const b=$('ga-skip'); if(b&&!fin) b.textContent='결과 보기'; },350+res.length*260+200); el.querySelector('#ga-skip').onclick=end; };
const reNeed=k=>{ const c=CH[k],w=(PF.ch[k]||{}).w||0,d=PF.dup[k]||0,nd=RDUP[c.grade]||0,st=RECOST[c.grade]||50; return {w,d,nd,st,ok:w>=REWIN&&d>=nd&&PF.star>=st}; };
lockWhy=function(k){ const b=baseKey(k); if(!PF.own[b]) return '가방 탭의 뽑기에서 처음 나오면 바로 얻는다'; if(CH[k].re){ const n=reNeed(b); return '재림: '+REWIN+'승('+n.w+') · 중복 '+n.nd+'('+n.d+') · 별무리 '+n.st+' — 가방 → 재림 · 완성에서 연다'; } return ''; };
/* gachaScreen: 뒤의 판에서 다시 통째로 바꿨다(지운 옛 대입) */
document.addEventListener('click',e=>{ const t=e.target.closest('[data-re2]'); if(!t) return; const k=t.dataset.re2,n=reNeed(k); if(!n.ok) return toast('조건이 모자라다'); PF.star-=n.st; PF.dup[k]=(PF.dup[k]||0)-n.nd; PF.re[k]=Date.now(); pfSave(); sfx('win'); toast(CH[k+'_r'].name+' · 재림했다',3600); achCheck({}); drawSel(); gachaScreen(); });

/* ── 닉네임 ── */
const nickOf=()=>{ let v=''; try{ v=localStorage.getItem('aetherName')||''; }catch(x){} return cleanName(v||($('n-name')&&$('n-name').value)||'')||'나'; };
/* ── 패치 내역: 새 판을 내보낼 때 맨 위에 한 덩이를 더한다 ── */
const PATCH=[
 ['1.8.8','2026-11',['중계 서버 열쇠를 사이트와 저장소에서 뺐다. 중계 서버 접속 정보는 따로 둔 작은 서버(Cloudflare Worker)에서 받는다. 하는 법은 그대로다.']],
 ['1.8.7','2026-11',['친구: 「함께」 탭에 내 친구 코드 · 친구 목록 · 최근 함께한 사람이 생겼다. 같은 방에 있었던 사람은 저절로 남고, 「친구로」를 누르면 친구가 된다.','바로 초대: 방에 있을 때 친구 옆 「초대」를 누르면, 게임을 켜 둔 친구 화면에 초대가 뜨고 눌러서 바로 들어온다. 친구로 등록한 사람의 초대만 받고, 초대는 중계 서버로만 오간다. 설정 「친구 초대 받기」로 끌 수 있다.','무작위로 채울 가진 캐릭터가 모자라면, 싸우기를 누르기 전에 고르는 화면에서 이유와 방법(칸 직접 고르기 · 인원 줄이기 · 뽑기)을 미리 알려 준다.','안쪽 정리: 함께 하기 메시지 처리를 한 곳으로 모으고, 쓰지 않는 옛 코드를 걷어 냈다. 싸움 결과는 그대로다.','대기실에서 뜬 「방장이 태그매치를 골랐다」 알림이 싸움 화면까지 남던 것을 고쳤다.']],
 ['1.8.6','2026-11',['자유 대전(혼자 · 연습 아님 · 등반 · 이야기 같은 콘텐츠 아님)에서 무작위로 정해지는 캐릭터는 모두 가진 캐릭터 가운데서 나온다: 상대 무작위 단추, 팀전 · 레이드의 우리 편 · 상대 편 빈 칸, 태그매치의 내 두 칸과 상대 셋.','빈 칸을 채울 만큼 가진 캐릭터가 없으면 판을 열지 않고 알린다(칸을 직접 고르거나 인원을 줄이면 된다). 함께 하기는 예전처럼 모든 캐릭터에서 나온다.','중계 서버 열쇠를 사이트에 두지 않는 방법(Worker)이 지금 쓰는 Metered 열쇠도 그대로 숨길 수 있게 했다.']],
 ['1.8.5','2026-11',['기록이 사라지지 않게: 브라우저에 기록을 지우지 말라고 부탁한다(처음 화면을 누를 때 한 번).','저장을 파일로 내보내고 파일에서 가져올 수 있다(기록 탭 맨 아래). 마지막으로 내보낸 날을 보여 주고, 오래되면 하루 한 번 알린다.','안쪽 정리: 코드 파일을 나눴다. 게임 내용은 그대로다. 올릴 때마다 자동 점검이 돈다.','중계 서버 열쇠를 화면 쪽에 두지 않는 방법(Worker 주소)도 쓸 수 있게 했다.','태그매치에서 판이 끝났는데 손님 화면에서는 끝나지 않던 것을 고쳤다. 끝 소식을 작게 따로 보내고, 화면 상태가 너무 크면 꾸밈을 덜어 보낸다. 쓰러진 뒤 다음 캐릭터가 안 들어와 판이 멈추는 일도 막았다.','컴퓨터인데 전투 화면이 휴대폰 조작(스틱 · 큰 단추)으로 뜨던 것을 고쳤다(좁은 창 · 메신저 안 브라우저로 열었을 때). 창 크기가 바뀌면 방 · 싸움 중에도 그 자리에서 맞추고, 설정 「화면 방식(자동 · 컴퓨터 · 휴대폰)」으로 고정할 수 있다.','무작위로 채우는 우리 편 칸(팀전 · 레이드 · 태그매치)은 가진 캐릭터 가운데서 고른다. 모자라면 가진 캐릭터를 겹쳐 쓴다. 상대 편은 그대로 모든 캐릭터에서 나온다.','손님이 상대 편일 때 기록 줄의 「상대 · 우리」(교대 · 남은 캐릭터)가 거꾸로 나오던 것을 고쳤다.']],
 ['1.8.4','2026-11',['보상 코드를 모두 새것으로 바꿨다. 예전 코드는 더는 듣지 않는다.','중계 서버를 적는 칸을 없앴다. 서로 직접 닿지 못하면 사이트에 마련된 중계 서버를 저절로 거친다.','초대 링크를 열면 바로 잇지 않고, 「들어가기」를 눌러야 들어간다.','방 코드가 여섯 자로 길어졌다(남이 어림짐작으로 들어오기 어렵게).','방장은 함께 탭 명단에서 사람을 내보낼 수 있다(두 번 누른다).','끊겼다 다시 들어올 때는 방장이 준 자리 표가 맞아야 제 캐릭터를 돌려받는다. 이름만 같아서는 안 된다. 같은 방에 같은 이름이 둘이면 뒤에 번호가 붙는다.','보안 점검: 함께 하기에서 오가는 이름 · 채팅 · 방 정보 · 고른 캐릭터 · 조작 값을 양쪽에서 한 번 더 살핀다. 너무 잦은 메시지는 버린다.','보안 점검: 화면에 글을 넣는 곳을 손봤고, 페이지에 보안 정책(CSP)을 달아 끼워 넣은 스크립트가 돌지 않게 했다.','저장 가져오기는 이 게임의 기록만, 꼴이 맞는 것만 받는다.']],
 ['1.8.3','2026-11',['보상 코드 처리 방식을 정리했다.','저작권 표시를 바꿨다.']],
 ['1.8.2','2026-11',['새 보상 코드 추가.']],
 ['1.8.1','2026-11',['레이드 보스가 받는 체력 비례(%) 피해: 소란 · 집결 50% · 결속 · 군주 25% · 위신 12.5%만 들어간다. 스킬 안의 체력 비례분과 따로 계산되는 최체비 · 잃체비 · 현체비 피해 모두 해당.']],
 ['1.8.0','2026-11',['모든 플레이 기록을 한 번 초기화했다(코인 · 캐릭터 · 전적 · 업적 · 등반 · 이야기 · 닉네임). 조합 캐릭터와 화면 · 소리 설정은 남는다.','뽑기 확률: 고화 75 · 서사 22 · 전설 3.','닉네임은 처음 한 번 정하면 바꿀 수 없다.']],
 ['1.7.2','2026-11',['별무리의 흔적으로 원하는 캐릭터를 골라 데려오던 것을 없앴다.','대신 「별무리 뽑기」: 등급을 고르면 그 등급에서 아직 없는 캐릭터 하나가 무작위로 나온다. 값은 고화 30 · 서사 90 · 전설 240(예전 5 · 15 · 40). 가방 → 별무리 뽑기.']],
 ['1.7.1','2026-11',['채팅을 보기 편하게: 함께 하는 동안 큰 단추 바로 위에 채팅 줄(최신 메시지 · 안 읽은 수)이 늘 보이고, 누르면 채팅 창(말풍선 기록 · 빠른 문구 · 입력)이 열린다. 결과 화면이나 가방 · 기록 · 설정 탭에서 온 채팅은 알림으로도 뜬다. 싸우는 중 💬에 「직접 쓰기」 추가.','함께 하기 손질: 태그매치에서 그만둔 손님의 대기 캐릭터가 멈춰 서던 것, 방장 마우스가 손님 캐릭터의 조준을 움직이던 것, 방장 전적이 손님 캐릭터로 세지던 것, 함께 레이드를 누르면 인원이 줄던 것, 바꾼 편이 판 시작 때 되돌아가던 것, 판이 시작돼도 손님의 가방 · 업적 창이 화면을 가리던 것, PC Q · E 표시가 실제와 다르던 것, 레이드에서 손님이 상대 편으로 보이던 것을 고쳤다. 교대 요청이 거절되면 손님에게 까닭을 알린다.','첫 판 안내 손질: 끝낸 뒤 방식이 연습으로 남던 것, 「계속 연습」이 기록에 남는 판이 되던 것, 샌드백 설정이 저장되던 것, 두 번 눌러 시작하면 설정을 잃던 것, 안내 칸이 샌드백을 가리던 것을 고쳤다. 보상은 건너뛰지 않고 넷 이상 해내야 받는다. 왼손 배치 · 가로 화면 안내 글을 맞췄다.','그 밖: 오늘의 도전 보상을 그날 첫 승리에 준다. 레이드 승리에 1대1 평가(S)가 붙지 않는다. 첫 화면에서 뒤로 · Esc가 숨은 안내를 닫지 않는다. 옛 저장에서 잠긴 캐릭터가 골라져 있던 것, 싸우기를 누른 직후 다른 단추가 눌리던 것을 막았다.']],
 ['1.7.0','2026-11',['함께 하기를 편하게: 방에 있는 동안 모든 탭 위쪽에 방 정보 띠가 뜬다(방 코드 · 방장이 정한 판 · 준비 수 · 편마다 사람과 고른 캐릭터 · 태그 셋). 내 칸을 누르면 캐릭터 탭으로, 방장은 다른 사람을 눌러 편을 바꾼다.','대전 탭에 「함께 하는 방」 칸: 방장이 정한 판, 채팅(빠른 문구 · 입력), 방장의 빠른 동작(편 고루 나누기 · 모두 같은 편 · 함께 레이드 · 함께 등반 · 초대 링크). 방에 있는 동안 쓸 수 없는 모험 칸은 숨기고, 손님에게는 자기 방식 설정 대신 방장이 정한 판을 보여 준다.','손님의 큰 단추가 「준비하기」가 됐다. 방장은 아직 준비 안 한 사람이 있으면 한 번 더 눌러야 시작한다. 결과 화면의 「다시」도 같다. 모두 준비되면 방장에게 알린다.','들어옴 · 나감 · 캐릭터 · 편 · 준비가 바뀌면 알림이 뜬다. 다른 사람이 고른 캐릭터에는 캐릭터 목록에 이름표가 붙고, 방장 화면의 상대 칸에는 상대 편 사람의 캐릭터가 뜬다.','싸우는 중에도 💬 단추로 빠른 채팅(휴대폰 · PC). 방 코드를 누르면 복사된다.','가로 화면 고르기 화면의 큰 단추가 지나치게 길어지던 것을 고쳤다.']],
 ['1.6.0','2026-11',['태그매치를 친구와 함께 할 수 있다. 방장이 방식에서 태그매치를 고르면 손님도 캐릭터 탭에서 우리 팀 칸 둘을 더 고른다.','편마다 사람이 한 명이면 그 사람이 셋을 다 몰고, 여럿이면 한 명씩 나눠 맡는다(남는 칸은 그 편의 첫 사람). 같은 편이 되어 컴퓨터와 겨루는 협동 태그도 된다.','교대: 싸우는 캐릭터의 주인은 원하는 캐릭터로 바꾸고, 대기 중인 캐릭터의 주인은 자기 캐릭터를 들여보낸다. 교대 대기시간은 편마다 하나. 동료 차례에는 「동료 차례」가 뜨고 조작 단추가 숨는다.','손님이 끊기면 그 캐릭터는 컴퓨터가 맡고, 다시 들어오면 돌려받는다. 손님도 쓰러뜨린 캐릭터 수만큼 코인을 받는다.','첫 판 안내: 에이로 샌드백을 상대하며 움직이기 → 기본 공격 → 스킬 → 점프 → 궁극기 → 멈춤을 하나씩 해 본다(1분). 처음 끝내면 코인 1,000. 첫 방문 화면 · 대전 화면의 모험 칸 · 설정 → 도구에서 시작한다.']],
 ['1.5.3','2026-11',['태그매치: 물러난 캐릭터가 남은 지속 피해로 쓰러져 지던 것, 물러난 캐릭터의 장판 · 연속 스킬이 계속 싸우던 것, 쓰러진 사이 고른 캐릭터가 교대 대기시간을 쓰던 것을 고쳤다. 1대1 업적 · S 평가가 붙지 않게 했다. 대기 중인 우리 팀 캐릭터에도 완성이 붙는다.','다시 서는 캐릭터(등반 보스 층 부활 · 킬 선취 · 점령전 · 연습)가 등반 권능 · 장비 · 완성 효과를 잃던 것을 고쳤다. 등반에서 완성 체력이 최대 체력에 제대로 들어간다.','업적 경험치로 레벨이 올라도 레벨 보상을 준다. 여럿이 하는 레이드에서 보스 처치가 가끔 안 세지던 것, 쓰러진 채 이겨도 기사회생이 붙던 것, 등반 · 이야기 중 설정을 바꾸면 빌린 캐릭터 · 방식이 저장되던 것을 고쳤다.','화면: 가로 화면 메뉴에서 알림이 화면 밖에 뜨던 것, 좁은 휴대폰에서 스킬 이름이 잘리던 것(이제 133명 모두 들어간다), 가로 화면 창의 아래 단추가 화면 절반을 덮던 것을 고쳤다. 교대 단추를 낮게, 싸움 중 알림을 한 줄로 했다.','왼손 배치에서 단추 묶음도 거울처럼 놓는다(기본 공격이 바깥쪽). 노치 · 홈 막대(안전 영역)를 피한다. 좁은 화면의 캐릭터 찾기 줄 · 뽑기 결과(네 칸)를 정리했다.','PC: Esc로 창을 닫고 멈춤을 푼다. 겹친 창은 맨 위부터 닫는다. 소리 · 음악 끄기가 다음에도 그대로다. 뽑기 연출은 카드를 누르면 한 번에 넘어간다.']],
 ['1.5.2','2026-11',['최적화: 효과음 잡음 버퍼를 돌려 쓰고, 캐릭터 이름표를 미리 그려 둔 그림으로 붙여 싸움 중 그리기 부담을 줄였다.','옛 휴대폰(iOS 15 등)에서 떠오르는 글자 상자를 그리다 싸움이 멈출 수 있던 것을 막았다.','함께 하기: 자리가 모자란 손님은 그 판을 관전한다(조작 단추를 숨기고 코인 · 전적은 세지 않는다).','잠긴 캐릭터 안내 문구를 지금 방식(뽑기에서 처음 나오면 바로 얻는다)에 맞췄다.']],
 ['1.5.1','2026-11',['태그매치: 교대 재사용 대기시간 15초 → 45초, 대신 싸우는 중에도 교대할 수 있다.','겹침 정리: 싸우는 중 알림 · 교대 단추 · 데스카운트 · 메뉴 알림을 체력 줄 아래에 차례로 쌓고, 왼쪽 기록 줄은 그 아래에서 화면에 들어갈 만큼만 보인다. 고르는 화면과 창에서는 알림이 아래 단추 위에 뜬다. 레이드 · 대돌격 아래쪽 안내 글이 이름표와 겹치던 것을 뺐다.','함께 하기 손질: 방장이 그만두면 손님 화면이 멈춘 채 남던 것, 손님이 그만두기를 한 번만 눌러도 화면이 멈추던 것, 그만둔 손님의 캐릭터를 컴퓨터가 이어 받지 않던 것을 고쳤다.','쓰러진 채 끊긴 손님이 다시 들어와도 자리를 못 찾던 것, 다시 이을 때 빌린 캐릭터가 바뀌던 것, 메뉴 알림이 계속 남던 것을 고쳤다.','손님이 탭을 내리면 그 캐릭터가 마지막 방향으로 계속 걷던 것을 멈추게 했다.','레이드 전리품 · 손님 코인 배수가 방장 기준을 따르게 했다. 함께 레이드 · 등반 뒤 다른 방식으로 싸우면 원래 편으로 돌아간다.']],
 ['1.5.0','2026-11',['새 방식 「3대3 태그매치」: 캐릭터 셋을 골라 한 명씩 싸운다. 5초 동안 싸우지 않으면 교대(재사용 대기시간 15초, 들어온 캐릭터는 1초 무적 · 스킬 못 씀). 셋이 모두 쓰러진 편이 진다. 보상은 쓰러뜨린 캐릭터 수만큼.','시작 화면 문구를 바꾸고 저작권 표시를 넣었다.']],
 ['1.4.0','2026-11',['뽑기: 처음 나온 캐릭터는 파편 없이 바로 얻는다. 이미 가진 캐릭터가 나오면 파편 3~5개.','새 시스템 「완성」: 재림이 없는 캐릭터(신화 · 히든 제외)는 재림과 같은 값(15승 + 중복 + 별무리의 흔적)을 내고 완성할 수 있다. 완성하면 체력 +50 · 기본 공격 +2 · 모든 스킬 재사용 대기시간 10% 감소. 가방 → 재림 · 완성.']],
 ['1.3.0','2026-11',['함께 하기: 들어온 사람이 「준비」를 누르면 방장 명단에 ✔ 준비 완료가 뜨고, 방장의 싸우기 단추에 준비한 사람 수가 나온다. 판이 시작되면 준비는 풀린다.','함께 등반: 방장이 고르는 보상 · 길 · 상점 물건이 모두의 화면에 보이고, 하나를 「추천」할 수 있다. 방장 화면의 그 칸에 누가 추천했는지 뜬다.']],
 ['1.2.3','2026-11',['뽑기 한 번에 나오는 파편이 1~3개에서 3~5개로 늘었다.','함께 하기에서 방장이 아닌 사람 화면에 집중(시전) 막대가 안 보이던 것을 고쳤다.']],
 ['1.2.2','2026-11',['달리기 배율을 1.3배에서 1.2배로 낮췄다.','가방 탭을 다시 짰다: 보유 · 뽑기를 맨 위에 두고, 파편 · 재림 · 숙련 · 데려오기 · 중복 · 확률은 칸을 눌러 창으로 본다.','가방 · 기록 · 설정 탭에서는 나/상대 칸과 싸우기 단추를 숨겨 화면을 넓게 쓴다.','멈춤 메뉴의 단추를 두 줄로 묶고, 그만두기를 따로 눈에 띄게 했다.','대전 화면의 「뽑기」 칸 이름을 「가방」으로 바꿨다.']],
 ['1.2.1','2026-11',['달리기: 바라보는 쪽으로(60도 안쪽) 걸으면 걸음이 1.3배 빨라진다. 마인크래프트의 달리기처럼 앞으로 갈 때만이고, 옆걸음 · 뒷걸음은 그대로다. 보스 몬스터는 빼고 모두에게 적용된다.','잡몹 소환 공통 규칙: 살아 있는 소환 잡몹은 넷까지. 꽉 차 있으면 보스는 소환을 쉬고 나머지 스킬이 30% 빨리 돈다.','소환된 잡몹의 체력을 30% 낮췄다.','보스 이름: 해적 선장 포워트 · 유사의 군주.']],
 ['1.2.0','2026-11',['새 탭 「가방」: 뽑기 · 파편 가방 · 중복 캐릭터 · 재림 · 숙련 · 골라서 데려오기를 한곳에 모았다.','「모두 열기」 단추를 없앴다. 이제 뽑기 방식이 기본이다.','보상 코드는 셋이다. 기록 화면 맨 아래에 적는다.','맵 여덟 개 추가: 무너진 유적 · 오아시스 · 바람골 · 가시 정원 · 차원문 회랑 · 대투기장 · 수렁 늪지 · 협곡. 등반은 층마다 맵이 바뀐다.','이야기는 (임시로) 지금 고른 내 캐릭터로 싸운다.','보상 정리: 레이드는 난이도별 코인 · 별무리와 첫 처치 보상(파편 포함), 등반은 층마다 코인과 5층 단위 첫 돌파 보상, 이야기는 첫 승리 · ★★ · 완주 보상, 오늘의 도전은 그날 첫 승리 보상.','업적을 유형별(전투 · 수집 · 레이드 · 등반 · 이야기 · 함께)로 나눠 본다. 군주 · 위신 사냥 업적 추가.','문서 보스의 「미친척 모드」를 「광폭화 모드」로 바꾸고, 보스 이름과 기술 이름을 새로 지었다.']],
 ['1.1.0','2026-11',['구글 문서 「보스 문서」의 보스 여덟이 레이드에 들어왔다. 결속: 우르사온 · 드리아드 · 미노타우로스 / 군주: 진흙 거인 · 박준형 · 여왕 개미 / 위신: 숭배받는 신 · 모래 왕.','새 보스는 체력이 절반 아래로 내려가면 「미친척 모드」가 되어 패턴이 강해진다.','비어 있던 레이드 난이도 군주 · 위신에 보스가 생겼다(데스카운트 3).','문서에 수치가 없어 체력 · 피해 · 범위 · 대기시간은 시험장에서 정했다. 보스 설명에 정한 것을 적어 두었다.','등반의 보스 차례 뒤쪽에 새 보스가 이어진다.']],
 ['1.0.2','2026-11',['기록 화면의 업적을 단추로 묶었다. 누르면 창으로 뜨고, 전체 · 남은 것 · 달성으로 나눠 볼 수 있다.','보상 코드 칸을 기록 화면 맨 아래로 내렸다.']],
 ['1.0.1','2026-11',['레이드에서 아직 보스가 없는 난이도(군주 · 위신)를 고르면 다른 난이도의 보스와 싸우게 되던 것을 막았다.','별무리로 데려온 캐릭터의 결과 창에 "파편 +undefined"가 뜨던 것을 고쳤다.','조작키 창을 연 뒤 상대 스킬 보기 창이 가려지던 것을 고쳤다.','이야기 · 도전 · 등반 도중 화면이 닫히면 빌려 쓴 캐릭터가 내 칸에 남던 것을 막았다.','데스카운트가 혼자 하는 레이드와 들어온 사람 화면에도 보인다.','함께 할 때 방장의 닉네임이 다른 사람 화면에도 뜬다. 초대 링크로 들어올 때는 패치 창을 띄우지 않는다.','방 만들기 · 들어가기가 망 문제로 한 번에 안 붙으면 두 번까지 알아서 다시 해 본다.']],
 ['1.0.0','2026-11',['뽑기가 파편 방식으로 바뀌었다. 한 번에 파편 1~3개, 10개를 모으면 캐릭터. 확률은 고화 60 · 서사 30 · 전설 10 (신화 · 히든은 나오지 않는다).','재림 조건: 원래 캐릭터로 15승 + 중복 캐릭터(고화 3 · 서사 2 · 전설 1) + 별무리의 흔적. 재림 캐릭터는 체력 +50, 기본 공격 +2.','레이드에 난이도가 생겼다: 소란 · 집결 · 결속 · 군주 · 위신. 데스카운트는 1 · 2 · 2 · 3 · 3이고 편 전체가 나눠 쓴다.','처음 들어오면 닉네임을 정한다. 싸움 중 체력 줄 위에 닉네임과 (캐릭터명)이 뜬다.','정신 집중(캐스팅)과 고유 자원이 캐릭터 아래에 막대로 보인다.','가나안의 기본 공격이 좁은 부채꼴(6.5칸)이 되었다. 메릴다의 선회 8칸, 사냥개는 느려지고 5초 뒤 사라진다.']]
];
function patchScreen(){ const d=document.createElement('div'); d.className='overlay'; d.style.zIndex=44; d.id='patchv'; d.innerHTML='<div class="wrap">'+head('PATCH NOTES','버전 '+VER,'바뀐 것')+PATCH.slice(0,4).map(p=>'<h2>'+p[0]+' <small style="color:var(--muted);font-weight:400">'+p[1]+'</small></h2>'+p[2].map(l=>'<p class="note" style="margin:6px 0">'+esc(l)+'</p>').join('')).join('')+'<div class="dock"><button class="go" id="pv-ok" type="button">확인</button></div></div>'; document.body.appendChild(d); d.querySelector('#pv-ok').onclick=()=>d.remove(); }
function nickScreen(done){ const d=document.createElement('div'); d.className='overlay'; d.id='nickv'; d.style.zIndex=46; d.innerHTML='<div class="wrap">'+head('WELCOME','닉네임을 정한다','싸움 중 내 캐릭터 위에 뜨고, 친구와 함께 할 때 보인다')+'<div class="row"><input type="text" id="nk-in" maxlength="8" placeholder="닉네임 (8자까지)" autocomplete="off" style="flex:1;height:52px;font-size:17px;text-align:center"></div><p class="note">한 번 정하면 바꿀 수 없다. 2~8자로 신중히 정한다.</p><div class="dock"><button class="go" id="nk-ok" type="button">정했다</button></div></div>'; document.body.appendChild(d);
  const inp=d.querySelector('#nk-in'),ok=()=>{ const v=cleanName(inp.value).slice(0,8); if(v.length<2) return toast('닉네임은 2자 이상'); try{ localStorage.setItem('aetherName',v); }catch(x){} if($('n-name')) $('n-name').value=v; d.remove(); toast(v+' · 반갑다'); done&&done(); }; d.querySelector('#nk-ok').onclick=ok; inp.addEventListener('keydown',e=>{ if(e.key==='Enter') ok(); e.stopPropagation(); }); setTimeout(()=>inp.focus(),300); }
/* 들어올 때: (제목 화면) → 닉네임이 없으면 정하기 → 버전과 패치 내역 */
{ const room=/[?&]room=/.test(location.search),flow=()=>{ let has=false; try{ has=!!localStorage.getItem('aetherName'); }catch(x){} if(!has) nickScreen(room?null:patchScreen); else if(!room) patchScreen(); };
  if(!navigator.webdriver&&!/[?&]bc\b/.test(location.search)){ if(document.getElementById('title')){ const iv=setInterval(()=>{ if(!document.getElementById('title')){ clearInterval(iv); flow(); } },200); } else flow(); } }

/* ── 캐릭터 아래 막대: 정신 집중(캐스팅)이 차는 모습과, 그 캐릭터만의 자원(n/m) ── */
on('step',()=>{ for(const e of ents){ if(e.chant>now){ if(!e._c1||Math.abs(e._c1-e.chant)>.02){ e._c0=now; e._c1=e.chant; } } else e._c1=0; } });
on('draw:world',()=>{ if(!me) return; g.save(); g.textAlign='center'; g.lineJoin='round';
  const bar=(x,y,w,f,col,lab,txt)=>{ g.globalAlpha=.85; g.fillStyle='rgba(6,9,23,.85)'; g.fillRect(x-w/2-.03,y-.03,w+.06,.2); g.fillStyle=col; g.fillRect(x-w/2,y,w*Math.max(0,Math.min(1,f)),.14); if(lab){ g.globalAlpha=1; g.font='700 .26px "Gothic A1",sans-serif'; g.lineWidth=.06; g.strokeStyle='rgba(6,9,23,.9)'; g.strokeText(lab+(txt?' '+txt:''),x,y+.44); g.fillStyle='#e9ecff'; g.fillText(lab+(txt?' '+txt:''),x,y+.44); } };
  for(const e of ents){ if(e.dead) continue; const st=has(e,'stealth'); if(st&&e.team!==me.team) continue; let y=e.y+(e.rad||R)+.34; const fo=e.st.find(q=>q.k==='focus'&&q.until>now); let c1=NET.client?e.chant:e._c1,c0=NET.client?(e._n0||(e._n0=now)):e._c0; if(NET.client&&!(e.chant>now)) e._n0=0; if(fo&&fo.d0>0&&!(c1>now)){ c1=fo.until; c0=fo.until-fo.d0; }
    if(c1>now&&c1>c0){ bar(e.x,y,1.5,(now-c0)/(c1-c0),e.team===me.team?'#fff3cf':'#ff9aa5','집중',(c1-now).toFixed(1)+'s'); y+=.62; }
    if(e===me){ const Rz=RES[e.key]; if(!(Rz&&(Rz.p||Rz.gz))){ let h=''; try{ h=String(e.c.hud(e)||''); }catch(x){} const m=h.match(/([^·\d\/]{1,10}?)\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/); if(m&&+m[3]>1){ const f=+m[2]/+m[3]; bar(e.x,y,1.5,f,f>=1?'#e3c377':'#7fe9ff',m[1].trim(),m[2]+'/'+m[3]); } } } }
  g.restore(); });

/* 화면을 옮길 때도 빌려 쓴 설정이 남아 있지 않게 한다. 뒤로 가기로 조작키·패치 창을 닫는다 */
{ const gp2=goPage; goPage=function(p){ keepFix(); gp2(p); }; const bs0=backStep; backStep=function(){ const k=document.getElementById('keysv')||document.getElementById('patchv'); if(k){ k.remove(); return true; } return bs0(); }; }

/* ── 기록 화면: 업적은 단추를 눌러 따로 띄우고, 보상 코드 칸은 맨 아래로 ── */
function achScreen(){ /* 뒤의 판에서 통째로 바꿨다. 이 몸통은 쓰지 않는다 */ }
{ const dr2=drawRec; drawRec=function(){ dr2(); const el=$('rec'); if(!el) return;
    const h=[...el.querySelectorAll('h2')].find(x=>/^업적/.test(x.textContent)); if(h){ let n=h.nextElementSibling; while(n&&n.classList.contains('pl')){ const nx=n.nextElementSibling; n.remove(); n=nx; } const got=ACH.filter(a=>PF.ach[a[0]]).length; h.textContent='업적'; h.insertAdjacentHTML('afterend','<button type="button" class="tool" id="ach-open" style="width:100%"><b>업적 '+got+' / '+ACH.length+'</b><small>눌러서 모두 본다 · 달성하면 코인과 별무리의 흔적을 받는다</small><div class="mbar" style="margin-top:8px"><i style="width:'+Math.round(100*got/ACH.length)+'%;background:var(--gold)"></i></div></button>'); }
    const ci=$('code-in'); if(ci){ const row=ci.closest('.row'),hh=row.previousElementSibling,nt=row.nextElementSibling&&row.nextElementSibling.id==='code-note'?row.nextElementSibling:null; el.appendChild(hh); el.appendChild(row); if(nt) el.appendChild(nt); } };
  document.addEventListener('click',e=>{ if(e.target.closest('#ach-open')) achScreen(); });
  const bs1=backStep; backStep=function(){ const k=document.getElementById('achv'); if(k){ k.remove(); return true; } return bs1(); }; }

/* ════════════════ 1.2.0 ════════════════ */
/* ── 보상 코드: 원문은 코드에 두지 않는다. 아래 1.8.3 블록의 CODEH(암호화한 값)만 본다 ── */

PF.codes=PF.codes||{};
/* 모두 열기 단추는 없앴다. 예전에 단추로 열어 둔 것은 뽑기 방식으로 돌린다(보상 코드로 연 것만 남는다) */
if(PF.open&&!PF.palace){ PF.open=false; pfSave(); }




/* ── 가방 탭: 뽑기 · 파편 · 재림 · 숙련 · 데려오기를 한곳에 ── */
function giveShard(k,n){ PF.shard=PF.shard||{}; PF.dup=PF.dup||{}; PF.shard[k]=(PF.shard[k]||0)+n; let got=''; while(PF.shard[k]>=SHARDN){ PF.shard[k]-=SHARDN; if(PF.own[k]){ PF.dup[k]=(PF.dup[k]||0)+1; got=' (중복 +1)'; } else { PF.own[k]=Date.now(); got=' (캐릭터 획득)'; } } return CH[k].name.split(', ')[1]+' 파편 +'+n+got; }
function drawBag(){ /* 뒤의 판에서 통째로 바꿨다. 이 몸통은 쓰지 않는다 */ }
/* 뽑기 화면은 이제 결과만 띄운다. 결과가 없으면 가방 탭으로 간다 */
{ gachaScreen=function(res){ if(res) res.forEach(r=>{ if(r.n===undefined){ r.n=0; r.got='new'; r.have=0; r.direct=true; } }); if(res&&res.length&&!res.shown){ res.shown=true; return gachaShow(res,()=>gachaScreen(res)); }
    drawBag(); if(!res||!res.length){ $('tower').hidden=true; if(page!=='bag') goPage('bag'); return; }
    let h=head('GACHA','나온 파편','코인 '+PF.coin.toLocaleString()+' · 별무리의 흔적 '+PF.star)+res.map(r=>{ const c=CH[r.k]; return '<div class="pl" style="border-left-color:'+GCOL[r.g]+'"><b>'+esc(c.name.split(', ')[1])+' <small style="color:'+GCOL[r.g]+'">'+r.g+' '+c.cls+'</small></b><span style="color:var(--muted)">'+(r.direct?'별무리로 데려옴 · ':r.first?'첫 획득 · ':'파편 +'+r.n+' · ')+(r.got==='new'?'<b style="color:var(--gold)">캐릭터 획득</b>':r.got==='dup'?'<b style="color:var(--ok)">중복 +1</b>':r.have+' / '+SHARDN)+'</span></div>'; }).join('');
    h+='<div class="row" style="margin-top:12px"><button type="button" data-pull="1"'+(PF.coin<PULL?' style="opacity:.5"':'')+'>1번 더<small style="display:block;font-size:10.5px;opacity:.75">코인 '+PULL.toLocaleString()+'</small></button><button type="button" data-pull="10"'+(PF.coin<PULL10?' style="opacity:.5"':'')+'>10번 더<small style="display:block;font-size:10.5px;opacity:.75">코인 '+PULL10.toLocaleString()+'</small></button></div><div class="dock"><button class="go" id="tw-out" type="button">가방으로</button></div>';
    $('tw-body').innerHTML=h; $('tower').hidden=false; $('tower').scrollTop=0; if(page!=='bag') goPage('bag'); };
  const gp3=goPage; goPage=function(p){ gp3(p); if(p==='bag') drawBag(); };
  document.addEventListener('click',e=>{ if(e.target.closest('#tw-out,[data-get]')) setTimeout(drawBag,0); });
  /* 기록 화면에서는 모두 열기 단추 · 보유 · 숙련을 뺀다(가방 탭으로 옮겼다) */
  const dr3=drawRec; drawRec=function(){ dr3(); const el=$('rec'); if(!el) return; const b=$('rec-open'); if(b){ const n=b.nextElementSibling; if(n&&n.classList.contains('note')) n.remove(); b.remove(); }
    for(const t of ['보유','숙련']){ const hh=[...el.querySelectorAll('h2')].find(x=>x.textContent===t); if(!hh) continue; let n=hh.nextElementSibling; while(n&&n.tagName!=='H2'&&n.id!=='ach-open'){ const nx=n.nextElementSibling; n.remove(); n=nx; } hh.remove(); }
    el.insertAdjacentHTML('beforeend','<p class="sub" style="margin-top:10px">뽑기 · 파편 · 재림 · 숙련은 아래 \'가방\' 탭에 있다.</p>'); }; }

/* ── 이야기: 정해진 캐릭터 대신 지금 고른 내 캐릭터로 싸운다(임시) ── */
{ const sg0=spGo; spGo=function(m){ if(m&&m.kind==='story'){ const k=kOf('me'); if(CH[k]&&!CH[k].mon&&!locked(k)) m=Object.assign({},m,{cfg:Object.assign({},m.cfg,{me:k,meR:false})}); } return sg0(m); };
  const ss0=storyScreen; storyScreen=function(si,ci){ ss0(si,ci); const el=$('tw-body'),k=kOf('me'); el.querySelectorAll('.sub').forEach(p=>{ if(/정해진 캐릭터로 싸운다/.test(p.textContent)) p.textContent='이야기는 지금 고른 내 캐릭터로 싸운다(임시). 글은 노션 \'맥스 세계관 정리본 (정사)\'에서 옮겼다.'; });
    if(si!=null&&ci!=null){ const d=el.querySelector('.dock'); if(d) d.insertAdjacentHTML('beforebegin','<p class="sub">내 캐릭터 · '+esc(CH[k].name)+' (글 속의 주인공 자리에 선다)</p><p class="note">'+payTxt.story(STORY[si],ci)+'</p>'); } }; }

/* ── 보상: 판마다 받는 기본 코인에 더해, 레이드 · 등반 · 이야기 · 오늘의 도전은 따로 얹어 준다 ── */
const RAIDPAY={coin:[200,400,700,1100,1600],star:[0,1,1,2,3],fcoin:[600,1000,1800,3000,5000],fstar:[1,2,3,5,8],fshard:[1,2,3,4,5]};   /* 난이도(소란~위신)별 · f = 첫 처치 */
const TWPAY={coin:f=>40+f*15,boss:f=>f>=20?2:1,mcoin:f=>f*150,mstar:f=>f/5};                                                        /* 층마다 · 보스 층 별무리 · 5층 단위 첫 돌파 */
const STPAY={first:[500,2],two:[500,2],again:100,all:[1500,5]}, DYPAY=[600,2];
const payTxt={ raid:k=>{ const t=tierOf(k),f=!(PF.rf||{})[k]; return '이기면 코인 +'+RAIDPAY.coin[t]+(RAIDPAY.star[t]?' · 별무리 +'+RAIDPAY.star[t]:'')+(t>=2?' · 가끔 파편':'')+(f?'\n첫 처치: 코인 +'+RAIDPAY.fcoin[t].toLocaleString()+' · 별무리 +'+RAIDPAY.fstar[t]+' · 서사 이상 파편 '+RAIDPAY.fshard[t]+'개':'\n첫 처치 보상은 이미 받았다'); },
  story:(s,ci)=>{ const was=(PF.story[s.id]||[])[ci]||0; return '보상 · '+(was?'':'첫 승리 코인 +'+STPAY.first[0]+' · 별무리 +'+STPAY.first[1]+' / ')+(was<2?'★★ 코인 +'+STPAY.two[0]+' · 별무리 +'+STPAY.two[1]+' / ':'다시 이기면 코인 +'+STPAY.again+' / ')+'이야기를 끝까지 넘기면 코인 +'+STPAY.all[0].toLocaleString()+' · 별무리 +'+STPAY.all[1]; },
  tower:()=>'보상 · 층을 넘을 때마다 코인(1층 '+TWPAY.coin(1)+' → 20층 '+TWPAY.coin(20)+'), 보스 · 마왕 층은 별무리 +1(20층부터 +2). 5 · 10 · 15…층을 처음 넘으면 코인 층×150 · 별무리 층÷5.' };
{ const en0=earn; earn=function(win){ const g=en0(win); let c=0,s=0; const N=[];
    try{ if(TW&&TW.on){ if(win){ const f=TW.floor,n=TW.next||{}; c+=TWPAY.coin(f); if(n.boss||n.lord) s+=TWPAY.boss(f); if(f%5===0&&f>PF.tw.best){ c+=TWPAY.mcoin(f); s+=TWPAY.mstar(f); N.push(f+'층 첫 돌파'); } } }
      else if(SPM&&SPM.kind==='story'){ if(win){ const S0=STORY[SPM.si],ch=S0.ch[SPM.ci],a=PF.story[S0.id]||[],was=a[SPM.ci]||0,st=goalOk(ch.goal)?2:1; if(!was){ c+=STPAY.first[0]; s+=STPAY.first[1]; N.push('첫 승리'); } if(st===2&&was<2){ c+=STPAY.two[0]; s+=STPAY.two[1]; N.push('★★'); } if(was>=st) c+=STPAY.again; if(!was&&S0.ch.every((_,j)=>j===SPM.ci||(a[j]||0)>0)){ c+=STPAY.all[0]; s+=STPAY.all[1]; N.push('이야기 완주'); } } }
      else if(SPM&&SPM.kind==='daily'){ if(win&&PF.dpay!==today()){ PF.dpay=today(); c+=DYPAY[0]; s+=DYPAY[1]; N.push('오늘의 도전'); } }
      else if(mode===6&&win&&ents.some(o=>o.c&&o.c.mon)){ const k=ents.find(o=>o.c&&o.c.mon).key,t=tierOf(k),pool=()=>{ const L=gachaPool(t>=3&&Math.random()<.3?'전설':'서사'); return L[Math.floor(Math.random()*L.length)]; }; c+=RAIDPAY.coin[t]; s+=RAIDPAY.star[t]; PF.rf=PF.rf||{};
        if(!PF.rf[k]){ PF.rf[k]=Date.now(); c+=RAIDPAY.fcoin[t]; s+=RAIDPAY.fstar[t]; N.push('첫 처치'); const q=pool(); if(q) N.push(giveShard(q,RAIDPAY.fshard[t])); } else if(t>=2&&Math.random()<.35){ const q=pool(); if(q) N.push(giveShard(q,1)); } }
    }catch(x){}
    PF.coin+=c; PF.star+=s; g.c+=c; g.st+=s; g.note=N.join(' · '); return g; };
  /* 보상 표를 고르는 화면에 적어 둔다 */
  const dm0=drawMon; drawMon=function(){ dm0(); let p=$('monpay'); if(!p){ p=document.createElement('p'); p.className='note'; p.id='monpay'; p.style.whiteSpace='pre-line'; const m=$('mon'); m.parentNode.insertBefore(p,m.nextSibling); } p.textContent=CH[OPT.mon]&&tierOf(OPT.mon)===monTab?CH[OPT.mon].name.split(', ')[1]+' · '+payTxt.raid(OPT.mon):''; };
  const th0=towerHome; towerHome=function(){ th0(); const d=$('tw-body').querySelector('.dock'); if(d) d.insertAdjacentHTML('beforebegin','<p class="note">'+payTxt.tower()+' 층마다 맵이 바뀐다.</p>'); }; }

/* ── 등반: 층마다 맵을 무작위로 고른다. 보스 층은 좁은 맵을 뺀다 ── */
{ let pick=null; const tg0=towerGo; towerGo=function(){ if(TW&&!TW.on&&TW.next){ const n=TW.next; if(!n.map||!MAPS[n.map]){ const L=Object.keys(MAPS).filter(k=>!(n.boss||n.lord)||!['duel','canyon','storm'].includes(k)); n.map=L[Math.floor(Math.random()*L.length)]; twStore(); } pick=n.map; } try{ tg0(); } finally { pick=null; } };
  const su0=setup; setup=function(x){ su0(x); if(pick&&!x.map&&MAPS[pick]) OPT.map=pick; }; }

/* ── 업적: 유형별로 나눠 본다 ── */
ACH.push(['rt3','군주 사냥','군주 난이도의 보스를 쓰러뜨린다',()=>Object.keys(PF.mon).some(k=>PF.mon[k]>0&&CH[k]&&tierOf(k)===3)],['rt4','위신 사냥','위신 난이도의 보스를 쓰러뜨린다',()=>Object.keys(PF.mon).some(k=>PF.mon[k]>0&&CH[k]&&tierOf(k)===4)]); ACHPAY.rt3=[3000,10]; ACHPAY.rt4=[6000,20];
const ACAT=[['전투',null],['수집 · 숙련',/^(v\d+|m3|built|g\d+|gmyth|gleg\d*|pu\d+|re\d+|c\d0.+|allcls)$/],['레이드',/^(golem|hydra|korhen|b\d+|ball|rw\d+|rt\d)$/],['등반',/^(t\d+|tf\d+|tr\d+|co\d+)$/],['이야기 · 도전',/^(st1|stmax|stall|d1|d7|dw\d+|ds\d+|ss\d+)$/],['함께 · 계정',/^(mw\d+|ms\d+|lv\d+)$/]];
const acat=id=>{ for(let i=1;i<ACAT.length;i++) if(ACAT[i][1].test(id)) return i; return 0; };
achScreen=function(){ const old=document.getElementById('achv'); if(old) old.remove(); const d=document.createElement('div'); d.className='overlay'; d.id='achv'; d.style.zIndex=9; let tab=achScreen.tab||'all',cat=achScreen.cat==null?-1:achScreen.cat;
  const row=a=>{ const ok=!!PF.ach[a[0]],pay=achPay(a[0]); return '<div class="pl" style="border-left-color:'+(ok?'var(--gold)':'var(--line)')+';opacity:'+(ok?1:.62)+'"><b>'+(ok?'◆ ':'◇ ')+esc(a[1])+'</b><span style="color:var(--muted)">'+esc(a[2])+'</span><span style="color:'+(ok?'var(--muted)':'var(--gold)')+';font-size:11.5px;flex-basis:100%">'+(ok?'받음 · ':'보상 · ')+'코인 '+pay[0].toLocaleString()+' · 별무리 '+pay[1]+'</span></div>'; };
  const render=()=>{ const got=ACH.filter(a=>PF.ach[a[0]]).length,inC=i=>ACH.filter(a=>acat(a[0])===i),st=a=>tab==='all'||(tab==='done')===!!PF.ach[a[0]]; let body='';
    for(let i=0;i<ACAT.length;i++){ if(cat>=0&&cat!==i) continue; const L=inC(i).filter(st),A0=inC(i); if(!L.length&&cat<0) continue; body+='<h2>'+ACAT[i][0]+' <small style="color:var(--muted);font-weight:400">'+A0.filter(a=>PF.ach[a[0]]).length+' / '+A0.length+'</small></h2>'+(L.length?L.map(row).join(''):'<p class="sub">여기에는 아직 없다.</p>'); }
    d.innerHTML='<div class="wrap">'+head('ACHIEVEMENTS','업적',got+' / '+ACH.length+' 달성')+'<div class="row" id="ach-cat" style="flex-wrap:wrap"><button type="button" data-c="-1" aria-pressed="'+(cat<0)+'">모두</button>'+ACAT.map((c,i)=>'<button type="button" data-c="'+i+'" aria-pressed="'+(cat===i)+'">'+c[0]+'<small style="display:block;font-size:10.5px;opacity:.75">'+inC(i).filter(a=>PF.ach[a[0]]).length+' / '+inC(i).length+'</small></button>').join('')+'</div>'
     +'<div class="row" id="ach-tab" style="margin-top:8px"><button type="button" data-t="all" aria-pressed="'+(tab==='all')+'">전체</button><button type="button" data-t="todo" aria-pressed="'+(tab==='todo')+'">남은 것 '+(ACH.length-got)+'</button><button type="button" data-t="done" aria-pressed="'+(tab==='done')+'">달성 '+got+'</button></div><div style="margin-top:4px">'+(body||'<p class="sub">여기에는 아직 없다.</p>')+'</div><div class="dock"><button class="go" id="ach-out" type="button">닫기</button></div></div>';
    d.querySelector('#ach-out').onclick=()=>d.remove(); d.querySelector('#ach-tab').onclick=e=>{ const b=e.target.closest('button'); if(!b) return; tab=achScreen.tab=b.dataset.t; render(); d.scrollTop=0; }; d.querySelector('#ach-cat').onclick=e=>{ const b=e.target.closest('button'); if(!b) return; cat=achScreen.cat=+b.dataset.c; render(); d.scrollTop=0; }; };
  render(); document.body.appendChild(d); };
achCheck({}); hubCard();

/* ════════════════ 1.2.2 화면 정리 ════════════════ */
{ const gp4=goPage; goPage=function(p){ gp4(p); $('sel').dataset.pg=page; }; $('sel').dataset.pg=page; }
/* ── 가방: 위에는 보유와 뽑기만. 나머지는 칸을 눌러 창으로 본다 ── */
const bagData=()=>{ const base=Object.keys(CH).filter(k=>!CH[k].re&&!CH[k].built&&!CH[k].custom),own=base.filter(k=>PF.own[k]);
  return {base,own,S:Object.keys(PF.shard||{}).filter(k=>CH[k]&&PF.shard[k]>0).sort((a,b)=>PF.shard[b]-PF.shard[a]),D:Object.keys(PF.dup||{}).filter(k=>CH[k]&&PF.dup[k]>0),
   R:own.filter(k=>CH[k+'_r']&&!PF.re[k]).sort((a,b)=>(reNeed(b).ok-reNeed(a).ok)||(((PF.ch[b]||{}).w||0)+(PF.dup[b]||0)*5)-(((PF.ch[a]||{}).w||0)+(PF.dup[a]||0)*5)),L:Object.entries(PF.ch).filter(x=>CH[x[0]]).sort((a,b)=>b[1].w-a[1].w)}; };
drawBag=function(){ const el=$('bag'); if(!el) return; const B=bagData(),t=(id,name,sub,n)=>'<button type="button" class="tool" data-bag="'+id+'">'+(n?'<i>'+n+'</i>':'')+'<b>'+name+'</b><small>'+sub+'</small></button>';
  el.innerHTML='<div class="wal"><div><b>'+PF.coin.toLocaleString()+'</b><small>코인</small></div><div><b>'+PF.star+'</b><small>별무리의 흔적</small></div><div><b>'+B.own.length+' / '+B.base.length+'</b><small>캐릭터</small></div></div>'
   +(PF.open?'<p class="note">모든 캐릭터가 열려 있다(보상 코드) · 같은 코드를 다시 적으면 원래대로 돌아간다.</p>':'')
   +'<h2>뽑기</h2><div class="pullrow"><button type="button" data-pull="1"'+(PF.coin<PULL?' class="low"':'')+'><b>1번 뽑기</b><small>코인 '+PULL.toLocaleString()+'</small></button><button type="button" data-pull="10"'+(PF.coin<PULL10?' class="low"':'')+'><b>10번 뽑기</b><small>코인 '+PULL10.toLocaleString()+' · 서사 이상 보장</small></button></div>'
   +'<p class="sub" style="margin:8px 2px 0">처음 나온 캐릭터는 바로 얻는다 · 가진 캐릭터는 파편 3~5개 · 전설 파편 보장까지 '+Math.max(0,PITY-(PF.pity||0))+'번</p>'
   +'<h2>가방</h2><div class="bagg">'+t('sh','파편',B.S.length?B.S.length+'명의 파편을 모으는 중':'아직 없다',B.S.filter(k=>PF.shard[k]>=SHARDN-2).length?'곧 '+B.S.filter(k=>PF.shard[k]>=SHARDN-2).length:'')
   +t('re','재림 · 완성',(B.R.length||doneList().length)?'조건을 보고 재림하거나 완성한다':'아직 대상이 없다',(B.R.filter(k=>reNeed(k).ok).length+doneList().filter(k=>reNeed(k).ok).length)?'가능 '+(B.R.filter(k=>reNeed(k).ok).length+doneList().filter(k=>reNeed(k).ok).length):'')
   +t('ms','숙련',B.L.length?B.L.length+'명으로 싸웠다':'아직 기록이 없다')+t('get','별무리 뽑기','등급을 골라 그 등급 캐릭터 하나')
   +t('dup','중복 캐릭터',B.D.length?B.D.reduce((a,k)=>a+PF.dup[k],0)+'개 · 재림에 쓴다':'아직 없다')+t('rate','확률 · 규칙','뽑기가 어떻게 되는지')+'</div>'; };
function bagPop(kind){ const old=document.getElementById('bagv'); if(old) old.remove(); const d=document.createElement('div'); d.className='overlay'; d.id='bagv'; d.dataset.kind=kind; d.style.zIndex=9;
  const B=bagData(),nm=k=>esc(CH[k].name.split(', ')[1]),pb=(v,m,col)=>'<div class="mbar"><i style="width:'+Math.min(100,Math.round(100*v/m))+'%;background:'+(col||'var(--aether)')+'"></i></div>'; let h='';
  if(kind==='sh'){ const f=bagPop.f||'all',L=B.S.filter(k=>f==='all'||(f==='own')===!!PF.own[k]); h=head('SHARDS','파편 가방',B.S.length+'명 · 가진 캐릭터의 파편 '+SHARDN+'개는 중복 하나가 된다')+'<div class="row" id="sh-f"><button type="button" data-f="all" aria-pressed="'+(f==='all')+'">전체 '+B.S.length+'</button><button type="button" data-f="new" aria-pressed="'+(f==='new')+'">없는 캐릭터</button><button type="button" data-f="own" aria-pressed="'+(f==='own')+'">가진 캐릭터</button></div>'
     +(L.length?'<div class="shg" style="margin-top:10px">'+L.map(k=>{ const c=CH[k]; return '<div class="shc" style="border-top-color:'+GCOL[c.grade]+'"><span class="n">'+PF.shard[k]+' / '+SHARDN+'</span><b>'+nm(k)+'</b><small>'+c.grade+' '+c.cls+(PF.own[k]?' · 가짐':'')+'</small>'+pb(PF.shard[k],SHARDN,GCOL[c.grade])+'</div>'; }).join('')+'</div>':'<p class="sub" style="margin-top:12px">여기에는 아직 없다. 파편은 이미 가진 캐릭터를 뽑았을 때와 레이드에서 나온다.</p>')+'<p class="note" style="margin-top:12px">가진 캐릭터의 파편 '+SHARDN+'개는 \'중복\' 하나가 되어 재림에 쓰인다.</p>'; }
  else if(kind==='re'){ h=head('RETURN','재림','체력 +50 · 기본 공격 +2')+'<p class="note">원래 캐릭터로 '+REWIN+'승 이상 + 중복 캐릭터(고화 3 · 서사 2 · 전설 1) + 별무리의 흔적.</p>'+(B.R.length?B.R.map(k=>{ const c=CH[k],n=reNeed(k),ck=(a,b)=>'<span style="color:'+(a>=b?'var(--ok)':'var(--muted)')+'">'; return '<div class="pl" style="border-left-color:'+GCOL[c.grade]+'"><b>'+nm(k)+' <small style="color:var(--muted)">'+esc(CH[k+'_r'].name.split(', ')[0])+'</small></b>'+(n.ok?'<button type="button" data-re2="'+k+'" style="height:34px;border:1px solid var(--gold);border-radius:8px;background:var(--panel);color:var(--gold);padding:0 12px;font-weight:700">재림</button>':'')+'<div style="flex-basis:100%;font-size:12px">'+ck(n.w,REWIN)+'승 '+n.w+'/'+REWIN+'</span> · '+ck(n.d,n.nd)+'중복 '+n.d+'/'+n.nd+'</span> · '+ck(PF.star,n.st)+'별무리 '+n.st+'</span></div></div>'; }).join(''):'<p class="sub">재림할 수 있는 캐릭터가 아직 없다.</p>'); }
  else if(kind==='ms'){ h=head('MASTERY','숙련','★ 1승 · ★★ 5승 · ★★★ 15승')+(B.L.length?B.L.map(([k,c])=>{ const nx=c.w>=15?0:c.w>=5?15:c.w>=1?5:1; return '<div class="pl"><b>'+nm(k)+mastery(k)+'</b><span style="color:var(--muted)">'+c.w+'승 '+c.l+'패'+(nx?' · 다음 ★까지 '+(nx-c.w)+'승':' · 숙련 끝')+'</span>'+(nx?pb(c.w,nx,'var(--gold)'):'')+'</div>'; }).join(''):'<p class="sub">아직 싸운 기록이 없다.</p>'); }
  else if(kind==='get'){ h=head('STAR DRAW','별무리 뽑기','별무리의 흔적 '+PF.star+'개')+'<p class="note">별무리의 흔적을 내고 고른 등급의 캐릭터 하나를 얻는다. 누가 나올지는 정할 수 없고, 아직 없는 캐릭터만 나온다.</p>'+SGG.map(g=>{ const all=gachaPool(g),hv=all.filter(k=>PF.own[k]).length,left=all.length-hv,ok=left>0&&PF.star>=SDRAW[g]; return '<div class="pl" style="border-left-color:'+GCOL[g]+'"><b>'+g+' <small style="color:var(--muted)">'+hv+' / '+all.length+'</small></b><span style="color:var(--muted)">'+(left?'별무리 '+SDRAW[g]:'모두 가졌다')+'</span>'+(left?'<button type="button" data-sg="'+g+'" style="height:36px;border:1px solid '+(ok?'var(--gold)':'var(--line)')+';border-radius:8px;background:var(--panel);color:'+(ok?'var(--gold)':'var(--muted)')+';padding:0 12px;font-weight:700">뽑기</button>':'')+'</div>'; }).join(''); }
  else if(kind==='dup'){ h=head('DUPLICATES','중복 캐릭터','재림에 쓴다')+(B.D.length?B.D.map(k=>'<div class="pl" style="border-left-color:'+GCOL[CH[k].grade]+'"><b>'+nm(k)+' <small style="color:var(--muted)">'+CH[k].grade+' '+CH[k].cls+'</small></b><span style="color:var(--muted)">중복 '+PF.dup[k]+' / 재림에 '+(RDUP[CH[k].grade]||0)+'</span></div>').join(''):'<p class="sub">아직 없다. 가진 캐릭터의 파편 '+SHARDN+'개가 모이면 중복 하나가 된다.</p>'); }
  else { h=head('RULES','확률 · 규칙','뽑기가 어떻게 되는지')+GRATE.map(g=>'<div class="pl" style="border-left-color:'+GCOL[g[0]]+'"><b>'+g[0]+'</b><span style="color:var(--muted)">'+g[1]+'%</span></div>').join('')+'<p class="note" style="white-space:pre-line">신화 · 히든은 뽑기에서 나오지 않는다.\n처음 나온 캐릭터는 그 자리에서 바로 얻는다.\n이미 가진 캐릭터가 나오면 파편이 3~5개 나온다. 파편 '+SHARDN+'개는 \'중복\' 하나가 되고, 재림 · 완성에 쓴다.\n'+PITY+'번 안에 전설 파편이 한 번은 나온다(지금 '+Math.max(0,PITY-(PF.pity||0))+'번 남음).\n10번 뽑기는 서사 이상이 하나는 나온다.</p>'; }
  d.innerHTML='<div class="wrap">'+h+'<div class="dock"><button class="go" id="bag-out" type="button">닫기</button></div></div>'; document.body.appendChild(d); }
document.addEventListener('click',e=>{ const t=e.target.closest('[data-bag],#bag-out,#sh-f button,#bagv [data-sb],#bagv [data-re2]'); if(!t) return; const v=document.getElementById('bagv');
  if(t.dataset.bag) return bagPop(t.dataset.bag); if(t.id==='bag-out'){ v&&v.remove(); return drawBag(); } if(t.dataset.f){ bagPop.f=t.dataset.f; return bagPop('sh'); }
  if(t.dataset.sb){ v&&v.remove(); return; } if(t.dataset.re2) setTimeout(()=>{ if(document.getElementById('bagv')) bagPop('re'); },30); });
{ const bs2=backStep; backStep=function(){ const k=document.getElementById('bagv'); if(k){ k.remove(); return true; } return bs2(); }; }
drawBag();

