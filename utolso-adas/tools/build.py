#!/usr/bin/env python3
"""Az utolsó adás – build.
1) assets/imgdata.js: a fotók base64-ben (file:// megnyitáshoz, ahol a böngésző
   máskülönben nem engedi a WebGL-nek a képek feldolgozását)
2) dist/Az-utolso-adas.html: egyetlen, önálló fájl (dupla kattintással indítható)
"""
import base64, json, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

imgs = {}
for fn in sorted(os.listdir('assets/img')):
    if fn.endswith('.jpg'):
        imgs[fn[:-4]] = 'data:image/jpeg;base64,' + base64.b64encode(open('assets/img/' + fn, 'rb').read()).decode()
with open('assets/imgdata.js', 'w') as f:
    f.write('// Automatikusan generált fájl (tools/build.py) – a fotók beágyazva.\nwindow.IMGDATA = ' + json.dumps(imgs) + ';\n')

html = open('index.html', encoding='utf-8').read()
css = open('style.css', encoding='utf-8').read()
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>\n' + css + '\n</style>')
def inline(m):
    src = m.group(1)
    code = open(src, encoding='utf-8').read().replace('</script', '<\\/script')
    return '<script>\n/* ' + src + ' */\n' + code + '\n</script>'
html = re.sub(r'<script src="([^"]+)"></script>', inline, html)
os.makedirs('dist', exist_ok=True)
out = 'dist/Az-utolso-adas.html'
open(out, 'w', encoding='utf-8').write(html)
# claude.ai Artifact változat: a közzététel saját vázba csomagol, ezért csak a tartalom kell
head = re.search(r'<head>(.*?)</head>', html, re.S).group(1)
body = re.search(r'<body>(.*?)</body>', html, re.S).group(1)
head = re.sub(r'<meta charset="utf-8">\s*|<meta name="viewport"[^>]*>\s*', '', head)
title = re.search(r'<title>.*?</title>', head).group(0)
head = head.replace(title, '')
open('dist/artifact.html', 'w', encoding='utf-8').write(title + '\n' + head.strip() + '\n' + body.strip() + '\n')
print('dist/artifact.html', os.path.getsize('dist/artifact.html') // 1024, 'KB')
print('assets/imgdata.js', os.path.getsize('assets/imgdata.js') // 1024, 'KB')
print(out, os.path.getsize(out) // 1024, 'KB')
