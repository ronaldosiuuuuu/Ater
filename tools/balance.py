"""에테르 밸런스 보고.

컴퓨터끼리 대전표(Bench)를 정해진 난수로 돌려, 캐릭터마다 승률을 docs/밸런스.md로 적는다.
승률이 아주 높거나(65% 이상) 아주 낮은(35% 이하) 캐릭터에 표시를 달고, 등급 · 직업별 평균도 적는다.
같은 코드면 같은 결과가 나오므로, 손보기 전과 뒤를 비교할 수 있다.

쓰는 법(저장소 맨 위에서):
  pip install playwright && python -m playwright install chromium
  python tools/balance.py                # 재림 빼고 모두, 짝마다 1판 (오래 걸린다)
  python tools/balance.py --pool 고화 --n 2
"""
import argparse, datetime, json, os, sys

from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from smoke import SEED_JS, serve, launch, ROOT  # noqa: E402

HI, LO = 0.65, 0.35


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--pool', default='재림 빼고', help="전체 · '재림 빼고' · 고화 · 서사 · 전설 · 히든 · 재림만")
    ap.add_argument('--n', type=int, default=1, help='짝마다 판 수')
    a = ap.parse_args()
    srv = serve()
    url = f"http://127.0.0.1:{srv.server_address[1]}/index.html"
    with sync_playwright() as p:
        br = launch(p)
        ctx = br.new_context(service_workers='block', viewport={'width': 1280, 'height': 720})
        ctx.add_init_script(SEED_JS)
        pg = ctx.new_page()
        pg.goto(url, wait_until='load')
        pg.wait_for_timeout(1500)
        pg.set_default_timeout(0)
        res = pg.evaluate("""async ([pool,n])=>{ const keys=Object.keys(CH).filter(Bench.pools[pool]).sort(); const R=await Bench.run(keys,n);
            return {ver:VER,done:R.done,total:R.total,rows:Bench.rows(R).map(r=>({name:r.name,grade:r.grade,cls:r.cls,w:r.w,g:r.g,rate:r.rate,time:r.time}))}; }""", [a.pool, a.n])
        br.close()
    srv.shutdown()
    rows = sorted(res['rows'], key=lambda r: -r['rate'])
    pct = lambda r: round(r['rate'] * 100)  # 표에 보이는 숫자로 표시를 정한다(35%인데 한쪽만 표시되는 일이 없게)
    hi = [r['name'] for r in rows if pct(r) >= HI * 100]
    lo = [r['name'] for r in rows if pct(r) <= LO * 100]
    def avg(key):
        d = {}
        for r in rows:
            d.setdefault(r[key], []).append(r['rate'])
        return sorted(((k, sum(v) / len(v), len(v)) for k, v in d.items()), key=lambda x: -x[1])
    today = datetime.date.today().isoformat()
    out = ['# 밸런스 보고', '',
           f"판 {res['ver']} · {today} · 무리 「{a.pool}」 · 짝마다 {a.n}판 · {res['done']} / {res['total']}판 · 정해진 난수",
           '', '`python tools/balance.py`로 다시 만든다. 컴퓨터끼리 1대1로 싸운 결과라 사람이 할 때와는 다를 수 있다.', '',
           f'⚠ 높음: 승률 {int(HI*100)}% 이상 · ⚠ 낮음: {int(LO*100)}% 이하', '',
           f'표시: 높음 {len(hi)}명 · 낮음 {len(lo)}명 (모두 {len(rows)}명)', '',
           '## 등급별 평균', '', '| 등급 | 평균 승률 | 캐릭터 수 |', '|---|---|---|']
    out += ['| %s | %d%% | %d |' % (k, round(v * 100), n) for k, v, n in avg('grade')]
    out += ['', '## 직업별 평균', '', '| 직업 | 평균 승률 | 캐릭터 수 |', '|---|---|---|']
    out += ['| %s | %d%% | %d |' % (k, round(v * 100), n) for k, v, n in avg('cls')]
    out += ['', '## 캐릭터', '', '| 순위 | 캐릭터 | 등급 | 직업 | 승률 | 판 | 평균 판 시간 | 표시 |', '|---|---|---|---|---|---|---|---|']
    for i, r in enumerate(rows, 1):
        flag = '⚠ 높음' if r['name'] in hi else '⚠ 낮음' if r['name'] in lo else ''
        out.append('| %d | %s | %s | %s | %d%% | %d | %.1f초 | %s |' % (i, r['name'], r['grade'], r['cls'], pct(r), r['g'], r['time'], flag))
    os.makedirs(os.path.join(ROOT, 'docs'), exist_ok=True)
    open(os.path.join(ROOT, 'docs', '밸런스.md'), 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    print(f"대전표 {res['done']} / {res['total']}판 · 캐릭터 {len(rows)}명")
    print('높음:', ', '.join(hi) or '없음')
    print('낮음:', ', '.join(lo) or '없음')
    print('적었다: docs/밸런스.md')


if __name__ == '__main__':
    main()
