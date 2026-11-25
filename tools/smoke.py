"""에테르 자동 점검.

브라우저(크롬)를 화면 없이 띄워 게임을 열고 다음을 본다.
  1. 여는 동안 스크립트 오류가 없는지
  2. 핵심 전역(CH · PF · Bench · game 루프)이 살아 있는지
  3. 컴퓨터끼리 대전표(Bench)를 정해진 난수로 돌려, 판이 모두 끝나는지
  4. 결과 요약(승패 표의 지문)을 찍는다. 코드를 정리만 했다면 지문이 그대로여야 한다.

쓰는 법 (저장소 맨 위에서):
  pip install playwright && python -m playwright install chromium
  python tools/smoke.py                 # 기본: 캐릭터 10명, 짝마다 1판
  python tools/smoke.py --chars 20 --n 2
  python tools/smoke.py --expect 3f2a…  # 지문이 다르면 실패로 끝난다
"""
import argparse, functools, hashlib, http.server, json, os, sys, threading

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Math.random을 정해진 수열로 바꾼다(같은 코드면 같은 결과가 나온다)
SEED_JS = """
(()=>{ let s=0x2545F491>>>0; Math.random=function(){ s^=s<<13; s>>>=0; s^=s>>>17; s^=s<<5; s>>>=0; return s/4294967296; }; })();
"""


def serve():
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    h = functools.partial(Quiet, directory=ROOT)
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


def launch(p):
    try:
        return p.chromium.launch()
    except Exception:
        return p.chromium.launch(channel="chrome")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--chars", type=int, default=10)
    ap.add_argument("--n", type=int, default=1)
    ap.add_argument("--expect", default="")
    a = ap.parse_args()

    srv = serve()
    url = f"http://127.0.0.1:{srv.server_address[1]}/index.html"
    errors = []
    with sync_playwright() as p:
        br = launch(p)
        ctx = br.new_context(service_workers="block", viewport={"width": 1280, "height": 720})
        ctx.add_init_script(SEED_JS)
        pg = ctx.new_page()
        pg.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
        pg.on("console", lambda m: m.type == "error" and errors.append(f"console: {m.text}"))
        pg.goto(url, wait_until="load")
        pg.wait_for_timeout(1500)

        alive = pg.evaluate("""()=>({
            CH: typeof CH==='object' && Object.keys(CH).length,
            PF: typeof PF==='object' && !!PF,
            Bench: typeof Bench==='object',
            step: typeof step==='function',
        })""")
        print("전역:", json.dumps(alive, ensure_ascii=False))
        if not all(alive.values()):
            errors.append("핵심 전역이 없다")

        res = pg.evaluate(
            """async ([n,c])=>{ const ks=Object.keys(CH).sort(); const pick=[]; const step=Math.max(1,Math.floor(ks.length/c));
                 for(let i=0;i<ks.length&&pick.length<c;i+=step) pick.push(ks[i]);
                 const R=await Bench.run(pick,n); return {keys:R.keys,done:R.done,total:R.total,
                   w:R.w.map(r=>Array.from(r)), t:R.t.map(x=>Math.round(x*1000)/1000)}; }""",
            [a.n, a.chars],
        )
        print(f"대전표: {res['done']} / {res['total']}판 · 캐릭터 {len(res['keys'])}명")
        if res["done"] != res["total"]:
            errors.append("대전표가 끝까지 돌지 않았다")

        # 저장을 파일로 내보냈다가 기록을 바꾸고, 파일에서 가져와 되돌아오는지 본다
        if pg.evaluate("()=>{ drawRec(); return !!document.getElementById('sv-file'); }"):
            coin = pg.evaluate("()=>{ PF.coin=4321; pfSave(); return PF.coin; }")
            with pg.expect_download() as dl:
                pg.evaluate("()=>document.getElementById('sv-file').click()")
            path = dl.value.path()
            text = open(path, encoding="utf8").read()
            ok = text.startswith("AETHER1:")
            pg.evaluate("()=>{ PF.coin=1; pfSave(); }")
            with pg.expect_file_chooser() as fc:
                pg.evaluate("()=>document.getElementById('sv-load').click()")
            with pg.expect_navigation():
                fc.value.set_files(path)
            pg.wait_for_timeout(800)
            back = pg.evaluate("()=>PF.coin")
            print(f"저장 파일: 형식 {'맞음' if ok else '틀림'} · 코인 {coin} → 1 → 가져온 뒤 {back}")
            if not ok or back != coin:
                errors.append("저장 파일 내보내기 · 가져오기가 맞지 않는다")
        else:
            print("저장 파일: 이 판에는 없다(건너뜀)")
        br.close()
    srv.shutdown()

    fp = hashlib.sha256(json.dumps(res, sort_keys=True).encode()).hexdigest()[:16]
    print("지문:", fp)
    if a.expect and a.expect != fp:
        errors.append(f"지문이 다르다 (기대 {a.expect})")
    if errors:
        print("\n실패:")
        for e in errors[:30]:
            print(" -", e)
        sys.exit(1)
    print("통과")


if __name__ == "__main__":
    main()
