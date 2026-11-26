"""에테르 겹 지도.

게임은 판(버전)마다 앞의 함수를 감싸 고치며 쌓여 왔다(`const f0=fn; fn=function(){ ... f0() ... }`).
이 도구는 index.html이 읽는 순서대로 스크립트를 훑어,
  1. 함수마다 몇 겹으로 감싸였는지(감싼 곳 · 통째로 바꾼 곳),
  2. 통째로 바뀌어 다시는 불리지 않는 옛 정의,
  3. 감싸기 전의 옛 함수를 단추나 이벤트에 그대로 묶어 둔 곳(감싼 고침이 듣지 않는다)
을 찾아 docs/겹지도.md로 적는다. 정규식으로 훑는 것이라 대강의 지도다.

쓰는 법(저장소 맨 위에서): python tools/layers.py
"""
import os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def scripts():
    html = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    return [s for s in re.findall(r'<script src="([^"]+)"', html) if s != 'peerjs.min.js']


def main():
    files = scripts()
    defs = {}      # 이름 → [(파일, 줄)]  function 선언
    layers = {}    # 이름 → [(파일, 줄, 'wrap'|'replace')]
    binds = []     # (파일, 줄, 이름, 글)  옛 함수를 값으로 묶은 곳
    for f in files:
        path = os.path.join(ROOT, f)
        if not os.path.exists(path):
            continue
        lines = open(path, encoding='utf-8').read().split('\n')
        for i, line in enumerate(lines, 1):
            for m in re.finditer(r'(?<![\w.$])function ([A-Za-z_$][\w$]*)\s*\(', line):
                defs.setdefault(m.group(1), []).append((f, i))
            for m in re.finditer(r'(?<![\w.$])(?:window\.)?([A-Za-z_$][\w$]*)\s*=\s*(?:function\b|\([^()]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)', line):
                name = m.group(1)
                if name in ('const', 'let', 'var'):
                    continue
                before = line[:m.start()]
                stmt = re.split(r'[;{}]', before)[-1]
                if re.match(r'\s*(?:const|let|var)\b', stmt):
                    continue  # const x=…, y=()=>… 처럼 새 이름(지역)을 만드는 것이다
                cap = re.search(r'[=,]\s*(?:window\.)?' + re.escape(name) + r'\s*[;,]', line[max(0, m.start() - 400):m.start()])
                layers.setdefault(name, []).append((f, i, 'wrap' if cap else 'replace'))
            for m in re.finditer(r"\.(?:onclick|oninput|onchange|onkeydown)\s*=\s*([A-Za-z_$][\w$]*)\s*;|addEventListener\('[a-z]+',\s*([A-Za-z_$][\w$]*)\s*[,)]", line):
                name = m.group(1) or m.group(2)
                binds.append((f, i, name, line.strip()[:120]))
    names = {n for n in layers if n in defs or len(layers[n]) > 1}
    rows = sorted(((n, layers[n]) for n in names), key=lambda x: -len(x[1]))
    out = ['# 겹 지도', '', '`python tools/layers.py`로 다시 만든다. 정규식으로 훑은 대강의 지도다.', '',
           '## 함수마다 겹', '', '| 함수 | 겹 | 처음 정의 | 감싼 곳(→) · 통째로 바꾼 곳(⟳) |', '|---|---|---|---|']
    for n, L in rows:
        if len(L) < 2:
            continue
        d = defs.get(n, [('?', 0)])[0]
        out.append('| `%s` | %d | %s:%d | %s |' % (n, len(L), d[0], d[1], ' '.join(('→' if k == 'wrap' else '⟳') + '%s:%d' % (f, i) for f, i, k in L)))
    out += ['', '## 통째로 바뀐 옛 정의 (뒤에 바꾼 것이 앞의 것을 부르지 않는다)', '']
    dead = 0
    for n, L in rows:
        reps = [x for x in L if x[2] == 'replace']
        if reps and n in defs:
            f0, l0 = defs[n][0]
            src = open(os.path.join(ROOT, f0), encoding='utf-8').read().split('\n')[l0 - 1]
            gone = '이 몸통은 쓰지 않는다' in src
            out.append('- `%s`: 처음 정의 %s:%d%s → 통째로 바꿈 %s' % (n, f0, l0, ' (몸통 비움)' if gone else '', ', '.join('%s:%d' % (f, i) for f, i, _ in reps)))
            dead += 0 if gone else 1
    if not dead:
        out.append('- 없음')
    out += ['', '## 옛 함수를 값으로 묶은 곳 (그 뒤에 감싼 고침이 이 자리에는 듣지 않는다)', '']
    order = {f: k for k, f in enumerate(files)}
    hit = 0
    for f, i, n, txt in binds:
        later = [x for x in layers.get(n, []) if (order.get(x[0], -1), x[1]) > (order.get(f, -1), i)]
        if later:
            out.append('- %s:%d `%s` — 뒤에서 %d번 감쌈 · `%s`' % (f, i, n, len(later), txt.replace('|', '\\|')))
            hit += 1
    if not hit:
        out.append('- 없음')
    os.makedirs(os.path.join(ROOT, 'docs'), exist_ok=True)
    open(os.path.join(ROOT, 'docs', '겹지도.md'), 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    many = [(n, len(L)) for n, L in rows if len(L) >= 5]
    print('겹 5 이상:', ', '.join('%s %d' % x for x in many) or '없음')
    print('아직 몸통이 남은 옛 정의:', dead, '· 옛 함수를 묶은 곳:', hit)


if __name__ == '__main__':
    main()
