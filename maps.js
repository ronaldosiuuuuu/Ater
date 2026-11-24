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
/* 지금은 다섯 맵만 둔다. 발판(pad)·상자(crate)·문(gate)은 엔진에 그대로 있어, 아래에 적기만 하면 다시 쓸 수 있다. */
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
  feats:[{t:'storm',x:15,y:21,r0:27,r1:6,start:20,dur:50,dmg:8}]}
};
