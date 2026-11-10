#!/usr/bin/env python3
"""Refresh the fixed 2019–2024 Eurostat snapshot atomically. PISA needs manual review."""
import json,urllib.request,urllib.parse,datetime
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
root=Path(__file__).resolve().parents[1]
target=root/'src/data/reference/complete-country-comparison-snapshot.json'
base='https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/'
countries=['BE','FR','NL','DE','ES']
queries={
 'spending':('gov_10a_exp',{'unit':['MIO_EUR','PC_GDP'],'sector':['S13'],'cofog99':['GF0101','TOTAL','GF07','GF09'],'na_item':['TE','D1'],'sinceTimePeriod':['2019'],'untilTimePeriod':['2024']}),
 'population':('demo_gind',{'indic_de':['AVG','JAN'],'sinceTimePeriod':['2019'],'untilTimePeriod':['2025']}),
 'hicp':('prc_hicp_aind',{'unit':['INX_A_AVG'],'coicop':['CP00'],'sinceTimePeriod':['2019'],'untilTimePeriod':['2024']}),
 'ppp':('prc_ppp_ind',{'na_item':['PPP_EU27_2020'],'ppp_cat':['GDP'],'time':['2024']}),
 'age':('demo_pjanind',{'indic_de':['PC_Y65_MAX'],'time':['2024']}),
 'employment':('lfsi_emp_a',{'indic_em':['EMP_LFS'],'sex':['T'],'age':['Y20-64'],'unit':['PC_POP'],'time':['2024']}),
 'care':('sdg_03_60',{'sex':['T'],'time':['2024']}),
 'density':('demo_r_d3dens',{'time':['2024']}),
 'life':('demo_mlexpec',{'sex':['T'],'age':['Y_LT1'],'time':['2024']}),
}
def get(item):
 key,(dataset,filters)=item
 params=[('lang','EN')]+[('geo',g) for g in countries]+[(k,v)for k,vs in filters.items()for v in vs]
 url=base+dataset+'?'+urllib.parse.urlencode(params)
 try:
  with urllib.request.urlopen(url,timeout=60) as r:d=json.load(r)
  output={'dataset':dataset,'url':url,'retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'data':d}
  if not d.get('value'): raise RuntimeError('No observations for '+key)
  print(key, d.get('size'),'observations',len(d.get('value',{})))
  return key,output
 except urllib.error.HTTPError as e: raise RuntimeError(f'{key}: HTTP {e.code}') from e
with ThreadPoolExecutor(max_workers=4)as ex: sources=dict(ex.map(get,queries.items()))
snapshot=json.loads(target.read_text())
snapshot['sources']=sources
snapshot['reviewedAt']=datetime.datetime.now(datetime.timezone.utc).date().isoformat()
replacement=target.with_suffix('.json.tmp')
replacement.write_text(json.dumps(snapshot,ensure_ascii=False,indent=2)+'\n')
replacement.replace(target)
print('Updated complete comparison. Run source-reconciliation tests before publishing.')
