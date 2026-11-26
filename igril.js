/* ════════════════ 염세의 진룡, 이그릴 (전설 · 전사) · 1.9.6 ════════════════
   · 역린: 최대 5. 위검 반격 · 염린 무효화 · 염세 안의 타격으로 쌓인다.
   · 「역린」 단추(5번 칸 · PC는 우클릭도): 역린 1을 써서 다음 기본 공격을 타오르는 참격(4칸 부채꼴 20 · 염상 3초)으로 바꾼다.
   · 웅크리기: 역린 1을 써서 바라보는 쪽으로 5칸 빠르게 전진한다.
   · 염상: 매 초 2 피해를 받고 이그릴에게서 짧게 밀려난다(이그릴 쪽에서 센다).
   · 열도 일합: 높이 뛰어 1초 집중한 뒤(염왕 중에는 집중 없이) 적 쪽으로 떨어져 원형 2칸 4타 합 30 + 역린당 10.
     맞은 적은 하던 행동이 끊기고 1초 침묵한다. 염상인 적이 맞으면 궁극 「염세 전역」 단추가 켜진다. */
CARDTEXT.igril="[ 염세의 진룡, 이그릴 ]\n@전설 @전사\n\n#난이도 (A) / #파괴력 (A) / #생존력 (B+)\n#기동력 (A) / #제어력 (C+) / #만족감 (A)\n\n#진룡의 피는 흐르는 자연이 깃들어 있는 근원의 산물.\n#켜켜이 쌓여진 신성의 용을 세상이 일컫기를 진룡이라 하니,\n#신화시대에 태어난 시조이자 시대를 멸하는 끝의 진룡.\n#이치를 불태우는 적색, 심연조차 짓누르던 그 이름은 이그릴.\n\n패시브 '진룡(염)'\n- '역린' 이 있을 시, 우클릭으로 이를 소모하고 다음 기본 공격을 이하와 같이 변경한다.\n- 바라보는 방향으로 타오르는 참격을 휘둘러 20 피해를 주고 3 초간 '염상' 을 부여한다.\n- 웅크릴 시 '역린' 을 즉시 소모하며 바라보는 방향으로 빠르게 전진한다.\n'염상' : 효과 지속중 매 초마다 2 피해를 받고 짧게 밀려난다.\n#스택형 #소모성 #부채꼴 범위 피해_4칸_1타 #돌진_5칸\n\n일반 스킬 '위검' (12s)\n- 도를 크게 휘둘러 명중한 적에게 8 피해를 주고 2 초간 '염상' 을 부여한다.\n- 이후 0.5 초간 자세를 취하며 받는 피해가 80% 감소한다.\n- 효과 지속중 피격시 '역린' 을 쌓고, 다시 한 번 도를 휘둘러 12 피해를 주고 약간 띄운다. \n'염상' : 효과 지속중 매 초마다 2 피해를 받고 짧게 밀려난다.\n#부채꼴 범위 피해_4칸_1타 #받피감 #조건부 #부채꼴 범위 피해_4칸_1타 #에어본_3칸\n\n일반 스킬 '염린' (16s)\n- 바라보는 방향으로 짧게 전진한 뒤 1 초간 자세를 취하며 다음 피격시의 피해를 무효화한다.\n- 무효화 성공시 '역린' 을 쌓고, 도를 휘둘러 주변 적에게 20 피해를 준다.\n- 이후 해당 스킬의 재사용 대기시간이 12 초 감소한다.\n#돌진_3칸 #조건부 #무효화 #원형 범위 피해_3칸_2타 #재사용_대기시간\n\n각성 스킬 '열도 일합' (45s)\n- 위로 크게 도약한 뒤, 1 초간 자세를 취하며 정신을 집중한다.\n- 이후 직선 방향으로 매우 빠르게 추락하며 착지지점의 적을 베어갈라 30 피해를 준다.\n- '역린' 이 있을 시 이를 모두 소모하고 소모한 역린당 10 추가 피해를 준다.\n- 이때 명중한 적의 모든 행동을 종료시키며 1 초간 침묵시킨다.\n#도약(위)_12칸 #정신집중 #하강_최대 #원형 범위 피해_2칸_4타 #조건부 #추가피해 #침묵\n\n스타 시커 / 궁극 스킬 '염세 전역' (X)\n조건부 = '염상' 상태의 적에게 '열도 일합' 적중 시 시전.\n- 멸사의 화염을 발해 주변 적에게 20 피해를 주고 10 초간 주변을 '염세' 로 만든다.\n- '염세' 내에서 '염상' 상태인 적을 타격할 시 4 추가 피해를 주며 '역린' 을 하나 쌓는다.\n- 효과 종료 후 멸사의 화염을 근원으로 되돌리며 6 초간 '염왕' 상태에 돌입한다.\n'염세' : 내부의 적은 기동력 20% 감소 및 매 초마다 3 피해를 받는다.\n'염왕' : 기동력이 20% 증가하며 효과 중 '열도 일합' 의 정신 집중이 사라진다. \n#원형 범위 피해_10칸 #추가피해 #스택충전 #기동력 #정신집중 삭제";
CH.igril={name:'염세의 진룡, 이그릴',cls:'전사',grade:'전설',range:2.4,rclick:true,
  init:e=>{e.r={yl:0,nx:false,burn:new Map(),bacc:0,st:0,stHit:false,nul:0,up:0,ultOk:false,zone:0,zc:null,ywang:0,uid:0}},
  hud:e=>'역린 '+e.r.yl+'/5'+(e.r.nx?' · 참격 준비':'')+(e.r.zone>now?' · 염세':'')+(e.r.ywang>now?' · 염왕':'')+(e.r.ultOk&&!e.ultUsed?' · 염세 전역 준비':''),
  gain(e,n){ const b=e.r.yl; e.r.yl=Math.min(5,e.r.yl+(n||1)); if(e.r.yl>b) say(e,'역린 '+e.r.yl,'#ff7a4a'); },
  burning:(e,t)=>(e.r.burn.get(t)||0)>now,
  burn(e,t,d){ if(!t||t.dead) return; e.r.burn.set(t,Math.max(e.r.burn.get(t)||0,now+d)); say(t,'염상','#ff8a4a'); },
  tick(e,dt){ e.r.bacc+=dt; if(e.r.bacc>=1){ e.r.bacc-=1; for(const [t,u] of e.r.burn){ if(t.dead||u<=now){ e.r.burn.delete(t); continue; } damage(e,t,2,'염상',{amp:true}); if(!t.dead) knock(t,e,.4); } } },
  modTake(e,src,amt){ if(src===e) return amt;
    if(e.r.nul>now){ e.r.nul=0; say(e,'무효화','#ffd27a'); CH.igril.gain(e); after(.02,()=>{ if(e.dead) return; for(let i=0;i<2;i++) after(i*.12,()=>{ if(!e.dead) S.circle(e,3,10,'염린',{v:'spin',el:'fire'}); }); e.cd.n2=Math.max(0,e.cd.n2-12); }); return 0; }
    if(e.r.st>now){ if(!e.r.stHit){ e.r.stHit=true; CH.igril.gain(e); after(.02,()=>{ if(!e.dead) S.arc(e,4,12,'위검',{air:3,v:'slash',el:'fire'}); }); } return amt*.2; }
    return amt; },
  onDeal(e,t,amt,label,o){ if(o&&o.amp) return; if(e.r.zone>now&&e.r.zc&&!t.dead&&Math.hypot(t.x-e.r.zc.x,t.y-e.r.zc.y)<=10+(t.rad||R)&&CH.igril.burning(e,t)){ damage(e,t,4,'염세',{amp:true}); CH.igril.gain(e); } },
  speedMod:e=>e.r.ywang>now?1.2:1,
  /* 역린을 쓴 다음 기본 공격: 타오르는 참격 */
  altBasic(e){ if(!e.r.nx) return false; if(e.cd.b>0) return true; e.cd.b=CFG.atkInt; e.r.nx=false; e.swingT=now; swingSnd(e); S.arc(e,4,20,'진룡(염)',{basic:true,v:'slash',el:'fire',post:t=>CH.igril.burn(e,t,3)}); return true; },
  dive(e,id){ if(e.dead||e.r.uid!==id) return; const t=tgt(e,8),p=t?{x:t.x,y:t.y}:{x:e.x+e.aim.x*4,y:e.y+e.aim.y*4}; e.x=p.x; e.y=p.y; clamp(e); e.z=0; e.vz=0; e.r.up=0; shake=Math.max(shake,.25);
    const n=e.r.yl; e.r.yl=0; const per=(30+n*10)/4; let ok=false;
    for(let i=0;i<4;i++) after(i*.08,()=>{ if(e.dead) return; S.circle(e,2,per,'열도 일합',{zfree:true,v:'quake',el:'fire',post:x=>{ if(i===0){ if(CH.igril.burning(e,x)) ok=true; x.chant=0; x.busy=Math.min(x.busy||0,now); if(x.dash) x.dash=null; add(x,'silence',1,0,{by:e}); } }}); if(i===0&&ok&&!e.ultUsed){ e.r.ultOk=true; proc(e,'염세 전역','시전 가능'); } }); },
  skills:{
   n1:{name:'위검',cd:12,r:4,cast(e){ S.arc(e,4,8,'위검',{v:'slash',el:'fire',post:t=>CH.igril.burn(e,t,2)}); e.r.st=now+.5; e.r.stHit=false; }},
   n2:{name:'염린',cd:16,r:5,cast(e){ S.leap(e,e.aim,3,24,()=>{ e.r.nul=now+1; },true); }},
   aw:{name:'열도 일합',cd:45,r:8,can:e=>!(e.r.up>now),cast(e){ const id=++e.r.uid,w=e.r.ywang>now?.15:1; e.r.up=now+w+.3; e.vz=Math.sqrt(2*G*4); e.launched=false; if(w>=1) S.focus(e,1); after(w,()=>CH.igril.dive(e,id)); }},
   ult:{name:'염세 전역',cd:0,r:6,can:e=>e.r.ultOk,need:'염상인 적에게 열도 일합 적중',cast(e){ e.r.ultOk=false; S.circle(e,10,20,'염세 전역',{v:'nova',el:'fire'}); e.r.zone=now+10; e.r.zc={x:e.x,y:e.y};
     zone(e,{x:e.x,y:e.y,r:10,dur:10,every:1,label:'염세',tick:(z,inn)=>inn.forEach(t=>{ damage(e,t,3,'염세',{amp:true}); add(t,'slow',1.05,.2,{by:e}); })});
     after(10,()=>{ if(e.dead) return; e.r.ywang=now+6; add(e,'haste',6,.2,{self:true}); proc(e,'염왕','6초'); }); }},
   x1:{name:'역린',kind:'패시브',cd:.3,can:e=>e.r.yl>=1&&!e.r.nx,need:'역린 1',cast(e){ e.r.yl--; e.r.nx=true; say(e,'참격 준비','#ff7a4a'); }},
   crouch:{name:'진룡 돌진',kind:'패시브',cd:.3,can:e=>e.r.yl>=1,need:'역린 1',cast(e){ e.r.yl--; S.leap(e,e.aim,5,32,null,true); }}
  },note:"역린은 최대 5개다. 「역린」 단추(5번 칸, PC는 우클릭도)로 다음 기본 공격을 타오르는 참격으로 바꾼다. 염상은 이그릴 쪽에서 매 초 2 피해와 짧은 밀어내기로 센다. 열도 일합은 4번에 나눠 합 30 + 역린당 10이고, 8칸 안의 적에게 떨어진다(없으면 앞 4칸). 위검 자세(0.5초) 중에는 받는 피해가 80% 줄고, 처음 맞을 때 한 번 반격한다."};
{ const c=CH.igril,b=CLASSES[c.cls]; c.hp=b.hp; c.atk=b.atk; c.key='igril'; }
Object.assign(LOOK,{ igril:{el:'fire',w:'saber',hair:'#7a1a14',acc:['horns','cape'],cape:'#a8261c',bl:'#ff9a5a'} });
Object.assign(RES,{ igril:{u:e=>e.r.ultOk?1:Math.min(.9,e.r.yl/5*.5+(e.r.burn&&[...e.r.burn.values()].some(u=>u>now)?.4:0))} });
/* 컴퓨터 조작 */
BRAIN.igril=(e,t,d)=>{ e.ai.want=2.2; if(d<=8&&go(e,'ult')) return true; if(d<=8&&go(e,'aw')) return true;
  if(hurtNow(e)&&d<=3&&go(e,'n2')) return true; if(d<=4&&go(e,'n1')) return true; if(d>4&&d<=7&&e.r.yl>=2&&go(e,'crouch')) return true;
  if(d<=4&&!e.r.nx&&e.r.yl>=1&&go(e,'x1')) return true; if(d<=6&&go(e,'n2')) return true; };
/* PC: 우클릭으로 「역린」 */
document.addEventListener('pointerdown',ev=>{ if(ev.pointerType!=='mouse'||ev.button!==2) return; try{ if(!running||paused||!me||me.dead||!me.c||!me.c.rclick||!me.c.skills.x1) return; if(typeof mAim!=='undefined'&&mAim){ mouseAim(); me.aimMan=now+.12; } cast(me,'x1'); }catch(x){} });
