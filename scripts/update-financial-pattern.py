#!/usr/bin/env python3
"""Refresh financial evidence atomically; historical forecasts and ageing scenarios need manual review."""
import json,urllib.request,urllib.parse,datetime,concurrent.futures
from pathlib import Path
countries=['BE','FR','NL','DE','ES']
items=['TR','TE','B9','D41PAY','D1PAY','P2','P51G','OP5ANP','D3PAY','D62_D632PAY','D7PAY','D9PAY','D4PAY','D29PAY','D5PAY','D2REC','D5REC','D61REC','D91REC','P11_P12_P131','D4REC','D7REC','D9REC','D39REC','D41REC','D42REC','D45REC','D7REC_S212','D9REC_S212','D3REC_S212','D51A_C1REC','D51B_C2REC']
taxes=['D211','D214A','D2122C','D214C','D214D','D29A','D59A','D91A','D51A_C1','D51B_C2','D611','D613','D612']
queries={
 'main':('gov_10a_main',{'sector':'S13','unit':['MIO_EUR','PC_GDP'],'na_item':items,'sinceTimePeriod':'2015'}),
 'social':('gov_10a_exp',{'sector':'S13','unit':['MIO_EUR','PC_GDP'],'na_item':'TE','cofog99':['GF10']+['GF100'+str(i) for i in range(1,10)],'sinceTimePeriod':'2015'}),
 'tax':('gov_10a_taxag',{'sector':'S13','unit':['MIO_EUR','PC_GDP'],'na_item':taxes,'sinceTimePeriod':'2015'}),
 'debt':('gov_10dd_edpt1',{'sector':'S13','unit':['MIO_EUR','PC_GDP'],'na_item':['B9','GD'],'sinceTimePeriod':'2014'}),
 'gdp':('gov_10dd_edpt1',{'sector':'S1','unit':'MIO_EUR','na_item':'B1GQ','sinceTimePeriod':'2014'}),
 'population':('demo_gind',{'indic_de':'AVG','sinceTimePeriod':'2015'}),
 'inflation':('prc_hicp_aind',{'unit':'INX_A_AVG','coicop':'CP00','sinceTimePeriod':'2015'}),
 'guarantees':('gov_cl_guar',{'sector':'S13','na_item':'FGT','unit':['MIO_NAC','PC_GDP'],'sinceTimePeriod':'2022'}),
}
def get(item):
 key,(dataset,params)=item
 url='https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/'+dataset+'?'+urllib.parse.urlencode({'lang':'EN','geo':countries,**params},doseq=True)
 with urllib.request.urlopen(url,timeout=90) as r:d=json.load(r)
 if not d.get('value') or any(x==0 for x in d['size']): raise RuntimeError('Empty '+key)
 out={'dataset':dataset,'url':url,'retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'data':d}

 print(key,d['updated'],d['size'],len(d['value']))
 return key,out
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:sources=dict(pool.map(get,queries.items()))
p=Path(__file__).resolve().parents[1]/'src/data/reference/financial-pattern-snapshot.json'
temporary=p.with_suffix('.json.tmp')
temporary.write_text(json.dumps({'reviewedAt':datetime.datetime.now(datetime.timezone.utc).date().isoformat(),'sources':sources},ensure_ascii=False,indent=2)+'\n')
temporary.replace(p)
print('Saved',p.stat().st_size,'bytes')
