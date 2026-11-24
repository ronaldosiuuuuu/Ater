"use strict";
/* 이야기 장 더하기. 정리본에 '싸운다 · 꺾는다 · 진다 · 합공을 받는다'로 적힌 대목만 넣었고, 사이 글(src)은 정리본 문장 그대로다.
   두 쪽 모두 카드가 있는 싸움만 만들 수 있다(리나 · 비아누스 · 이루 · 울란 · 레테 · 몬트 · 사공 셋은 카드가 없다).
   묶음을 더하려면 STORY.push 한 덩이. cfg.solo = 숫자: 나 혼자서 상대 그 수와 싸운다(섬멸전으로 판을 만든 뒤 남는 자리를 비운다). */
{ const REUNION='투쟁의 세계에서 무한의 군주가 맥스를 되살려 불러내고, 맥스는 카스토르·우르·레우스·알비온·스텔라·아서 등과 다시 만나 싸운다.';
  STORY.push({id:'reunion',name:'무한관 · 재회',sub:'외전 · 되살아난 맥스가 옛 얼굴들과 다시 만나 싸운다',ch:[
   {name:'흉성의 잔향',cfg:{me:'max',foe:'castor',mode:1,diff:1,map:'basic'},goal:['hp',.6],src:REUNION,how:'1대1 · 맥스 대 카스토르'},
   {name:'백룡',cfg:{me:'max',foe:'albion',mode:1,diff:1,map:'plain'},goal:['hp',.5],src:REUNION,how:'1대1 · 맥스 대 알비온, 대평원'},
   {name:'별의 대사제',cfg:{me:'max',foe:'stella',mode:1,diff:2,map:'pillars'},goal:['time',75],src:REUNION,how:'1대1 · 맥스 대 스텔라, 기둥 숲'},
   {name:'돌아온 번개',cfg:{me:'max',foe:'ur',mode:1,diff:2,map:'storm'},goal:['hp',.4],src:REUNION,how:'1대1 · 맥스 대 우르, 폭풍의 눈'},
   {name:'대가들의 합공',cfg:{me:'max',foe:'blossom',fo:['rano'],mode:1,teamN:3,solo:2,diff:1,map:'duel'},goal:['time',90],src:'파블라 무술제 경기장에 난입한 맥스가 대가 블로섬·라노의 합공을 받은 싸움. 맥스는 봉술사를 주먹으로 연타하고 창술사의 단창을 쳐냈다.',how:'1대2 · 맥스 혼자서 블로섬·라노와, 결투장'},
   {name:'마도왕',cfg:{me:'salomon',foe:'hamel',mode:1,diff:1,map:'basic'},goal:['hp',.4],src:'살로몬(마도왕)이 하멜을 꺾는 것도, 하르문드가 냉기의 화신 베닐에게 지는 것도 외전의 일이다 — 살로몬은 맥스의 시대에 이미 죽은 사람이다.',how:'1대1 · 살로몬 대 하멜'},
   {name:'냉기의 화신',cfg:{me:'venil',foe:'harmund',mode:1,diff:2,map:'plain'},goal:['time',60],src:'살로몬(마도왕)이 하멜을 꺾는 것도, 하르문드가 냉기의 화신 베닐에게 지는 것도 외전의 일이다.',how:'1대1 · 베닐 대 하르문드, 대평원'}]});
  /* 혼자서 여럿과: 섬멸전으로 만든 판에서 내 편 컴퓨터와 남는 상대를 뺀다 */
  on('begin',()=>{ if(typeof SPM==='undefined'||!SPM||SPM.kind!=='story'||!SPM.cfg||!SPM.cfg.solo) return; let keep=SPM.cfg.solo; const want=[SPM.cfg.foe].concat(SPM.cfg.fo||[]);
    ents=ents.filter(e=>e===me||(e.team===1&&want.includes(e.key)&&keep-->0)); ents.forEach((e,i)=>{ if(e.team===1) e.slot=i-1; }); foe=ents.find(e=>e.team===1)||foe; }); }
