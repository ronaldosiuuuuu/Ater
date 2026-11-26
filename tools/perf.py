"""에테르 성능 측정.

1. 프레임: CPU를 4배 느리게 해(휴대폰 비슷하게) 5대5 판을 20초 돌리며 장면 시간을 잰다(평균 장면 수 · 느린 5% 장면 · 가장 느린 장면).
2. 함께 하기 메시지: 방장 · 손님(같은 브라우저 탭끼리 잇는 시험 방식)으로 5대5를 15초 돌리며 화면 상태 메시지 크기를 잰다.
   PeerJS는 16,300바이트가 넘는 메시지를 보내지 않는다. 게임은 15,000바이트에 가까우면 꾸밈부터 덜어 낸다.
결과는 docs/성능.md 맨 위에 한 줄씩 쌓인다. 기기와 때에 따라 숫자가 흔들리므로 큰 흐름만 본다.

쓰는 법(저장소 맨 위에서): python tools/perf.py
"""
import datetime, os, sys

from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from smoke import serve, launch, ROOT  # noqa: E402

INIT = """(()=>{ try{ localStorage.setItem('aetherWipe','1.8.0'); localStorage.setItem('aetherSeen','1'); localStorage.setItem('aetherName','시험');
  localStorage.setItem('aetherProfile',JSON.stringify({open:true,palace:1,tut:1})); }catch(e){} })();"""


def main():
    srv = serve()
    base = f"http://127.0.0.1:{srv.server_address[1]}/index.html"
    with sync_playwright() as p:
        br = launch(p)
        # 1) 프레임
        ctx = br.new_context(service_workers='block', viewport={'width': 412, 'height': 860}, device_scale_factor=2, has_touch=True, is_mobile=True)
        ctx.add_init_script(INIT)
        pg = ctx.new_page()
        cdp = ctx.new_cdp_session(pg)
        pg.goto(base)
        pg.wait_for_timeout(1500)
        cdp.send('Emulation.setCPUThrottlingRate', {'rate': 4})
        fr = pg.evaluate("""async()=>{ setMode(1); teamN=5; diff=2; launch(); await new Promise(r=>setTimeout(r,2500));
            const T=[]; let last=performance.now(),run=true; const f=t=>{ T.push(t-last); last=t; if(run) requestAnimationFrame(f); }; requestAnimationFrame(f);
            const end=performance.now()+20000; while(performance.now()<end){ await new Promise(r=>setTimeout(r,500)); if(over){ $('res').hidden=true; launch(); } }
            run=false; const s=T.slice(10).sort((a,b)=>a-b),avg=s.reduce((a,b)=>a+b,0)/s.length; return {fps:1000/avg,p95:s[Math.floor(s.length*.95)],worst:s[s.length-1],n:s.length,ver:VER}; }""")
        cdp.send('Emulation.setCPUThrottlingRate', {'rate': 1})
        ctx.close()
        # 2) 함께 하기 메시지 크기
        ctx = br.new_context(service_workers='block', viewport={'width': 1100, 'height': 760})
        ctx.add_init_script(INIT)
        H = ctx.new_page()
        H.goto(base + '?bc')
        H.wait_for_timeout(1300)
        H.evaluate("()=>{ $('n-host').click(); }")
        H.wait_for_timeout(1500)
        code = H.evaluate('()=>NET.code')
        G = ctx.new_page()
        G.goto(base + '?bc&room=' + code)
        G.wait_for_timeout(1300)
        G.evaluate("()=>$('n-join').click()")
        G.wait_for_timeout(2000)
        net = H.evaluate("""async()=>{ setMode(1); teamN=5; diff=2; save(); await new Promise(r=>setTimeout(r,600));
            const enc=new TextEncoder(),S=[]; const s0=NET.tx.send; NET.tx.send=(pid,d)=>{ if(d&&d.t==='s') S.push(enc.encode(JSON.stringify(d)).byteLength); return s0(pid,d); };
            $('start').click(); $('start').click(); await new Promise(r=>setTimeout(r,15000)); NET.tx.send=s0;
            S.sort((a,b)=>a-b); return {n:S.length,avg:S.reduce((a,b)=>a+b,0)/Math.max(1,S.length),p95:S[Math.floor(S.length*.95)]||0,max:S[S.length-1]||0}; }""")
        br.close()
    srv.shutdown()
    line = '| %s | %s | %.0f | %.0fms | %.0fms | %d | %d | %d |' % (datetime.date.today().isoformat(), fr['ver'], fr['fps'], fr['p95'], fr['worst'], round(net['avg']), net['p95'], net['max'])
    path = os.path.join(ROOT, 'docs', '성능.md')
    head = ['# 성능 기록', '', '`python tools/perf.py`로 한 줄씩 더한다. 프레임은 CPU를 4배 느리게 한 휴대폰 크기 화면의 5대5(20초), 메시지는 함께 하기 5대5(15초)의 화면 상태 크기(바이트)다. 메시지 한도는 16,300바이트.', '',
            '| 날짜 | 판 | 평균 장면 수 | 느린 5% 장면 | 가장 느린 장면 | 메시지 평균 | 메시지 95% | 메시지 최대 |', '|---|---|---|---|---|---|---|---|']
    old = []
    if os.path.exists(path):
        old = [x for x in open(path, encoding='utf-8').read().split('\n') if x.startswith('| 20')]
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, 'w', encoding='utf-8').write('\n'.join(head + [line] + old[:29]) + '\n')
    print('장면: 평균 %.0f장/초 · 느린 5%% %.0fms · 가장 느림 %.0fms (CPU 4배 느리게)' % (fr['fps'], fr['p95'], fr['worst']))
    print('메시지: 평균 %d · 95%% %d · 최대 %d 바이트 (한도 16,300)' % (round(net['avg']), net['p95'], net['max']))
    if net['max'] >= 16300:
        print('경고: 한도를 넘은 메시지가 있다')
        sys.exit(1)


if __name__ == '__main__':
    main()
