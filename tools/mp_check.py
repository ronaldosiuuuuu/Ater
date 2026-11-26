"""에테르 함께 하기 자동 점검.

한 브라우저 안에서 방장 화면과 손님 화면을 띄워(같은 브라우저 탭끼리 잇는 시험 방식 ?bc, 인터넷 없이) 다음을 본다.
  1. 손님이 방에 들어오고 채팅이 오간다
  2. 1대1 판이 시작되고, 끝나면 양쪽 모두 결과가 뜬다
  3. 태그매치에서 손님 편이 이기면 손님 화면에도 「승리」가 뜬다
  4. 방장이 손님을 내보내면 손님은 방에서 나가고, 같은 자리 표로는 다시 못 들어온다
  5. 친구 초대: 방장이 친구로 등록한 손님에게 초대를 보내면 손님 화면에 초대가 뜬다
그리고 그동안 화면에 스크립트 오류가 없어야 한다.

쓰는 법(저장소 맨 위에서): python tools/mp_check.py
"""
import os, sys

from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from smoke import serve, launch  # noqa: E402

INIT = """(()=>{ try{ localStorage.setItem('aetherWipe','1.8.0'); localStorage.setItem('aetherSeen','1');
  if(!localStorage.getItem('aetherProfile')) localStorage.setItem('aetherProfile',JSON.stringify({open:true,palace:1,tut:1})); }catch(e){} })();"""


def main():
    srv = serve()
    base = f"http://127.0.0.1:{srv.server_address[1]}/index.html"
    errors, ok = [], []
    def check(name, cond, extra=''):
        (ok if cond else errors).append(name + ('' if cond else ' — ' + str(extra)))
    with sync_playwright() as p:
        br = launch(p)
        ctx = br.new_context(service_workers='block', viewport={'width': 1100, 'height': 760})
        ctx.add_init_script(INIT)
        pages = []
        def page(q, name):
            pg = ctx.new_page()
            pg.on('pageerror', lambda e, n=name: errors.append(f'{n} 스크립트 오류: {e}'))
            pg.on('console', lambda m, n=name: m.type == 'error' and 'vibrate' not in m.text and 'Failed to load resource' not in m.text and errors.append(f'{n} 콘솔: {m.text[:200]}'))
            pg.goto(base + q)
            pg.wait_for_timeout(1300)
            pg.evaluate("n=>{ try{ localStorage.setItem('aetherName',n); }catch(e){} if(document.getElementById('n-name')) document.getElementById('n-name').value=n; }", name)
            pages.append(pg)
            return pg
        def until(pg, js, ms=8000):
            for _ in range(ms // 200):
                if pg.evaluate(js):
                    return True
                pg.wait_for_timeout(200)
            return False
        H = page('?bc', '방장')
        H.evaluate("()=>{ PF.open=true; sel.me='ross'; $('n-host').click(); }")
        check('방 만들기', until(H, '()=>NET.host&&!!NET.code'))
        code = H.evaluate('()=>NET.code')
        G = page('?bc&room=' + code, '손님')
        G.evaluate("()=>{ PF.open=true; $('n-join').click(); }")
        check('손님이 들어온다', until(G, '()=>NET.client&&NET.players.length>1'))
        G.evaluate("()=>{ slot='me'; pickCh('ei'); }")
        H.wait_for_timeout(600)
        G.evaluate("()=>chatSend('안녕')")
        check('채팅이 방장에게 간다', until(H, "()=>NET.chatLog.some(m=>m.text==='안녕')"))
        # 1대1
        H.evaluate("()=>{ setMode(1); teamN=1; save(); }")
        H.wait_for_timeout(500)
        H.evaluate("()=>{ $('start').click(); $('start').click(); }")
        check('1대1 시작', until(H, '()=>running&&NET.live') and until(G, '()=>running&&NET.playing'))
        H.evaluate("()=>{ const g=ents.find(o=>o.net); if(g) damage(me,g,99999,'시험'); }")
        check('1대1 끝 · 방장 결과', until(H, "()=>!!over&&!$('res').hidden"))
        check('1대1 끝 · 손님 결과', until(G, "()=>!!over&&!$('res').hidden"))
        # 태그매치: 손님(상대 편)이 이긴다
        for pg in (H, G):
            pg.evaluate("()=>{ $('res').hidden=true; $('sel').hidden=false; }")
        H.evaluate("()=>{ setMode(7); sel.al=['alpi','vira']; save(); }")
        H.wait_for_timeout(700)
        H.evaluate("()=>{ $('start').click(); $('start').click(); }")
        check('태그매치 시작', until(H, '()=>running&&!!TG') and until(G, '()=>running&&NET.playing'))
        for _ in range(4):
            H.evaluate("()=>{ const a=tagAct(0); if(!a||a.dead) return; a.tagInv=0; damage(tagAct(1),a,99999,'시험'); }")
            H.wait_for_timeout(1700)
        check('태그매치 · 손님 화면에 승리', until(G, "()=>!!over&&!$('res').hidden&&$('r-title').textContent==='승리'"),
              G.evaluate("()=>[!!over,$('r-title').textContent]"))
        for pg in (H, G):
            pg.evaluate("()=>{ $('res').hidden=true; $('sel').hidden=false; goPage('net'); }")
        # 친구 초대(있는 판만): 손님은 방을 나가 있고, 방장이 초대하면 손님 화면에 초대가 뜨고 「들어가기」로 다시 들어온다
        # (같은 브라우저 안이라 저장소를 함께 쓰므로, 손님에게 따로 친구 코드를 준다)
        if H.evaluate("()=>typeof friendAdd==='function'"):
            G.evaluate("()=>{ netLeave(); frStop(); FRD.id='GUESTABCDE'; frStart(); }")
            G.wait_for_timeout(600)
            H.evaluate("c=>friendAdd(c,'손님')", 'GUESTABCDE')
            G.evaluate("c=>friendAdd(c,'방장')", H.evaluate('()=>myFriendCode()'))
            H.evaluate("c=>friendInvite(c)", 'GUESTABCDE')
            check('친구 초대가 손님에게 뜬다', until(G, "()=>!!document.getElementById('invv')"))
            G.evaluate("()=>{ const b=document.getElementById('inv-ok'); if(b) b.click(); }")
            check('초대로 다시 들어온다', until(G, '()=>NET.client&&NET.players.length>1'))
            H.evaluate("()=>friendInvite('ABCDEFGHJK')")
            G.evaluate("()=>{ const v=document.getElementById('invv'); if(v) v.remove(); }")
        # 내보내기
        gp = G.evaluate('()=>NET.pid')
        H.evaluate("()=>drawNet()")
        H.evaluate("pid=>{ const b=document.querySelector('#n-list .kick[data-kick=\"'+pid+'\"]'); if(b){ b.click(); b.click(); } }", gp)
        check('내보내기', until(G, "()=>!NET.client"))
        G.evaluate("()=>$('n-join').click()")
        G.wait_for_timeout(1800)
        check('내보낸 사람은 다시 못 들어온다', not G.evaluate('()=>NET.client'))
        br.close()
    srv.shutdown()
    for x in ok:
        print('✓', x)
    if errors:
        print('\n실패:')
        for e in errors[:30]:
            print(' -', e)
        sys.exit(1)
    print('통과')


if __name__ == '__main__':
    main()
