#!/usr/bin/env python3
"""Refresh recent Eurostat evidence; VAT rates, NATO and car rules need manual review."""
import datetime
import json
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COUNTRIES = ['BE', 'FR', 'NL', 'DE', 'ES']
QUERIES = {
    'vat': ('gov_10a_taxag', {'sector': 'S13', 'na_item': 'D211', 'unit': ['MIO_EUR', 'PC_GDP'], 'sinceTimePeriod': '2024'}),
    'unemployment': ('une_rt_m', {'sex': 'T', 'age': 'TOTAL', 's_adj': 'SA', 'unit': 'PC_ACT', 'sinceTimePeriod': '2026-01'}),
    'transport': ('env_ac_tax', {'tax': 'TRA', 'unit': ['MIO_EUR', 'PC_GDP'], 'sinceTimePeriod': '2024'}),
    'population': ('demo_gind', {'indic_de': 'AVG', 'sinceTimePeriod': '2024'}),
}


def fetch(item):
    key, (dataset, filters) = item
    params = {'geo': COUNTRIES, 'lang': 'EN', **filters}
    url = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/' + dataset + '?' + urllib.parse.urlencode(params, doseq=True)
    with urllib.request.urlopen(url, timeout=60) as response:
        data = json.load(response)
    if not data.get('value') or any(size == 0 for size in data['size']):
        raise RuntimeError('Empty response: ' + key)
    print(key, len(data['value']), 'observations; updated', data.get('updated'))
    return key, {'dataset': dataset, 'url': url, 'retrievedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'data': data}


if __name__ == '__main__':
    with ThreadPoolExecutor(max_workers=4) as pool:
        sources = dict(pool.map(fetch, QUERIES.items()))
    target = ROOT / 'src/data/reference/recent-statistics-snapshot.json'
    temporary = target.with_suffix('.json.tmp')
    temporary.write_text(json.dumps({'reviewedAt': datetime.date.today().isoformat(), 'sources': sources}, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(target)
    print('Review common periods, definitions and source flags; run tests before publishing.')
