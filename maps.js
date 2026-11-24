"use strict";
/* 맵 자료. 맵을 더하려면 MAPS에 한 덩이만 적으면 고르는 화면에 저절로 나온다.

   좌표는 모두 '세로 경기장' 기준이다: 가로 w칸 · 세로 h칸, 나는 아래쪽·상대는 위쪽에서 시작한다.
   가로 화면에서는 엔진이 통째로 눕힌다(내가 왼쪽). 그래서 맵은 세로 기준으로 한 번만 적는다.

   name   고르는 화면에 뜨는 이름
   desc   한 줄 설명
   w, h   크기(칸). 시험장 기본은 26×38
   spawn  가운데에서 시작 자리까지의 거리(칸). 안 적으면 6
   rings  바닥에 그리는 가운데 고리 반지름들
   theme  바닥(floor)·모눈(grid)·점(dot)·테두리(edge)·고리(ring) 색
   feats  맵에 놓는 것들. 종류(t)는 index.html의 FEAT에 있다:
            {t:'pillar',x,y,r}            기둥. 걸음과 투사체를 막는다(3칸 넘게 뜨면 넘어간다). 범위 스킬은 못 막는다.
            {t:'pad',kind,x,y,r}          발판. kind는 PADS에 있다: haste(바람길) · mire(수렁) · spring(샘) · thorn(가시밭)
            {t:'crate',x,y,r,hp}          상자. 기둥처럼 막지만 피해를 hp만큼 받으면 부서진다(안 적으면 60)
            {t:'gate',x,y,x2,y2,r}        문 한 쌍. 밟으면 맞은편으로 옮겨진다(같은 사람은 3초 뒤에 다시)
            {t:'storm',x,y,r0,r1,start,dur,dmg}  폭풍. start초부터 dur초 동안 안전한 원이 r0→r1로 줄고, 밖에서는 1초마다 체력 dmg
   시작 자리(가운데에서 위아래로 spawn칸, 다인전은 좌우 ±2.6·±5.2칸) 위에는 아무것도 놓지 않는다. */
/* 처음 다섯 맵에 1.2.0에서 여덟을 더했다. */
const MAPS={
basic:{name:'시험장',desc:'아무것도 없는 기본 경기장. 카드 수치를 재기에 가장 깨끗하다.',w:26,h:38,rings:[5,9],
  theme:{floor:'#0d1330',grid:'#18204a',dot:'#3a4788',edge:'#e3c377',ring:'227,195,119'},feats:[]},
duel:{name:'결투장',desc:'좁다. 도망칠 곳이 없어 근접 캐릭터가 편하다.',w:18,h:26,rings:[4,7],
  theme:{floor:'#1a0f1c',grid:'#2c1a30',dot:'#6b3a5c',edge:'#ff9aa5',ring:'255,154,165'},feats:[]},
plain:{name:'대평원',desc:'넓다. 서로 멀리서 시작해, 사거리가 긴 캐릭터가 편하다.',w:34,h:50,spawn:10,rings:[6,12],
  theme:{floor:'#0c1a1c',grid:'#16302f',dot:'#2f6a5f',edge:'#9fe6c0',ring:'159,230,192'},feats:[]},
pillars:{name:'기둥 숲',desc:'기둥이 걸음과 투사체를 막는다. 범위 스킬은 기둥 너머로도 닿는다.',w:26,h:38,rings:[5,9],
  theme:{floor:'#0f1426',grid:'#1b2340',dot:'#3d4a78',edge:'#c9b28a',ring:'201,178,138'},
  feats:[{t:'pillar',x:13,y:19,r:1.5},{t:'pillar',x:6.5,y:15,r:1.2},{t:'pillar',x:19.5,y:15,r:1.2},{t:'pillar',x:6.5,y:23,r:1.2},{t:'pillar',x:19.5,y:23,r:1.2},
         {t:'pillar',x:13,y:7,r:1},{t:'pillar',x:13,y:31,r:1}]},
storm:{name:'폭풍의 눈',desc:'20초 뒤부터 폭풍이 조여 온다. 원 밖에서는 체력이 깎여, 끝내 가운데에서 맞붙는다.',w:30,h:42,spawn:8,rings:[6],
  theme:{floor:'#0f0f22',grid:'#1c1c3c',dot:'#4c4690',edge:'#c9a0ff',ring:'201,160,255'},
  feats:[{t:'storm',x:15,y:21,r0:27,r1:6,start:20,dur:50,dmg:8}]},
/* 아래 여덟은 1.2.0에서 더한 맵이다 */
ruins:{name:'무너진 유적',desc:'부서지는 상자와 기둥이 뒤섞여 있다. 상자는 맞으면 부서져 길이 열린다.',w:28,h:40,spawn:7,rings:[5,10],
  theme:{floor:'#17130f',grid:'#2a2219',dot:'#6b5a3a',edge:'#d8b06a',ring:'216,176,106'},
  feats:[{t:'pillar',x:8,y:20,r:1.3},{t:'pillar',x:20,y:20,r:1.3},{t:'crate',x:14,y:20,r:1.2,hp:90},{t:'crate',x:11,y:16,r:1},{t:'crate',x:17,y:16,r:1},{t:'crate',x:11,y:24,r:1},{t:'crate',x:17,y:24,r:1},
         {t:'crate',x:4.5,y:13,r:1},{t:'crate',x:23.5,y:13,r:1},{t:'crate',x:4.5,y:27,r:1},{t:'crate',x:23.5,y:27,r:1},{t:'pillar',x:14,y:6,r:1},{t:'pillar',x:14,y:34,r:1}]},
oasis:{name:'오아시스',desc:'가운데 샘에 서 있으면 체력이 찬다. 샘을 두른 수렁에서는 걸음이 느려진다.',w:28,h:40,spawn:8,rings:[4,9],
  theme:{floor:'#1a160c',grid:'#2e2814',dot:'#7a6a2e',edge:'#7fe3b5',ring:'127,227,181'},
  feats:[{t:'pad',kind:'spring',x:14,y:20,r:3},{t:'pad',kind:'mire',x:7,y:20,r:2.6},{t:'pad',kind:'mire',x:21,y:20,r:2.6},{t:'pad',kind:'mire',x:14,y:14.5,r:2},{t:'pad',kind:'mire',x:14,y:25.5,r:2},
         {t:'pillar',x:6,y:9,r:1},{t:'pillar',x:22,y:9,r:1},{t:'pillar',x:6,y:31,r:1},{t:'pillar',x:22,y:31,r:1}]},
wind:{name:'바람골',desc:'양옆의 바람길을 타면 빨라진다. 가운데 기둥 줄이 투사체를 막는다.',w:26,h:44,spawn:9,rings:[5],
  theme:{floor:'#0b1620',grid:'#142838',dot:'#2f6a8a',edge:'#8fe9ff',ring:'143,233,255'},
  feats:[{t:'pad',kind:'haste',x:4,y:14,r:2.6},{t:'pad',kind:'haste',x:4,y:22,r:2.6},{t:'pad',kind:'haste',x:4,y:30,r:2.6},{t:'pad',kind:'haste',x:22,y:14,r:2.6},{t:'pad',kind:'haste',x:22,y:22,r:2.6},{t:'pad',kind:'haste',x:22,y:30,r:2.6},
         {t:'pillar',x:13,y:22,r:1.4},{t:'pillar',x:9.5,y:17,r:.9},{t:'pillar',x:16.5,y:17,r:.9},{t:'pillar',x:9.5,y:27,r:.9},{t:'pillar',x:16.5,y:27,r:.9}]},
thorns:{name:'가시 정원',desc:'가시밭을 밟으면 1초마다 체력이 깎인다. 가운데 길은 좁다.',w:26,h:38,rings:[4],
  theme:{floor:'#1c0f14',grid:'#301a22',dot:'#7a3a4a',edge:'#ff7d8c',ring:'255,125,140'},
  feats:[{t:'pad',kind:'thorn',x:5,y:19,r:3.2},{t:'pad',kind:'thorn',x:21,y:19,r:3.2},{t:'pad',kind:'thorn',x:6,y:8,r:2.4},{t:'pad',kind:'thorn',x:20,y:8,r:2.4},{t:'pad',kind:'thorn',x:6,y:30,r:2.4},{t:'pad',kind:'thorn',x:20,y:30,r:2.4},
         {t:'pillar',x:10.5,y:19,r:1},{t:'pillar',x:15.5,y:19,r:1},{t:'pad',kind:'spring',x:13,y:19,r:1.4}]},
gates:{name:'차원문 회랑',desc:'문을 밟으면 짝이 되는 문으로 옮겨진다. 쫓거나 달아나는 길이 된다.',w:26,h:40,spawn:7,rings:[5,9],
  theme:{floor:'#120f24',grid:'#201a3e',dot:'#5a4a9a',edge:'#b48cff',ring:'180,140,255'},
  feats:[{t:'gate',x:3.5,y:8,x2:22.5,y2:32,r:1.4},{t:'gate',x:22.5,y:8,x2:3.5,y2:32,r:1.4},{t:'gate',x:3.5,y:20,x2:22.5,y2:20,r:1.4},
         {t:'pillar',x:13,y:20,r:1.6},{t:'pillar',x:8,y:14,r:1},{t:'pillar',x:18,y:14,r:1},{t:'pillar',x:8,y:26,r:1},{t:'pillar',x:18,y:26,r:1}]},
colosseum:{name:'대투기장',desc:'넓고 둥글게 트인 싸움터. 네 귀퉁이 기둥 말고는 숨을 곳이 없다.',w:32,h:36,spawn:8,rings:[6,11,15],
  theme:{floor:'#1a1410',grid:'#2c231a',dot:'#7a5f3a',edge:'#f0c36a',ring:'240,195,106'},
  feats:[{t:'pillar',x:5,y:6,r:1.6},{t:'pillar',x:27,y:6,r:1.6},{t:'pillar',x:5,y:30,r:1.6},{t:'pillar',x:27,y:30,r:1.6},{t:'pad',kind:'haste',x:5,y:18,r:2},{t:'pad',kind:'haste',x:27,y:18,r:2}]},
swamp:{name:'수렁 늪지',desc:'곳곳이 수렁이라 걸음이 느려진다. 마른 땅과 작은 샘을 먼저 차지해야 한다.',w:28,h:40,spawn:8,rings:[5],
  theme:{floor:'#0f160c',grid:'#1c2a16',dot:'#4a6a2e',edge:'#a0b46e',ring:'160,180,110'},
  feats:[{t:'pad',kind:'mire',x:14,y:20,r:3.4},{t:'pad',kind:'mire',x:5.5,y:14,r:3},{t:'pad',kind:'mire',x:22.5,y:14,r:3},{t:'pad',kind:'mire',x:5.5,y:26,r:3},{t:'pad',kind:'mire',x:22.5,y:26,r:3},
         {t:'pad',kind:'mire',x:14,y:6,r:2.2},{t:'pad',kind:'mire',x:14,y:34,r:2.2},{t:'pad',kind:'spring',x:4,y:20,r:1.6},{t:'pad',kind:'spring',x:24,y:20,r:1.6}]},
canyon:{name:'협곡',desc:'좁고 길다. 옆으로 피할 자리가 없어 직선 스킬과 투사체가 무섭다.',w:16,h:46,spawn:10,rings:[4],
  theme:{floor:'#1c120c',grid:'#301f14',dot:'#8a5a3a',edge:'#e09a6a',ring:'224,154,106'},
  feats:[{t:'pillar',x:3,y:23,r:1.2},{t:'pillar',x:13,y:23,r:1.2},{t:'crate',x:8,y:23,r:1.1,hp:80},{t:'pillar',x:2.5,y:10,r:.9},{t:'pillar',x:13.5,y:10,r:.9},{t:'pillar',x:2.5,y:36,r:.9},{t:'pillar',x:13.5,y:36,r:.9}]}
};
