#!/usr/bin/env python3
"""Optional live reference availability audit. HTTP success does not verify content."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import json
import urllib.request
DATA=json.loads((Path(__file__).resolve().parents[1]/'data/courses.json').read_text())
urls=sorted({source['url'] for source in [*DATA.get('sources',[]),*DATA['officialSources']] if source.get('url')})
def check(url):
    try:
        with urllib.request.urlopen(url,timeout=20) as response:
            response.read(4096)
            return url,response.status,None
    except Exception as error:return url,None,str(error)
failures=[]
for url,status,error in ThreadPoolExecutor(max_workers=4).map(check,urls):
    print(f'{status if status else "FAILED"}: {url}'+(f' — {error}' if error else ''))
    if error:failures.append(url)
print(f'{len(urls)-len(failures)}/{len(urls)} destinations reachable. Availability is not factual verification.')
if failures:raise SystemExit(1)
