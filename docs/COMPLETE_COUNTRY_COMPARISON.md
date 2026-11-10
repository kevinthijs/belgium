# Bestuurskosten, resultaten en context vergelijken

De uitbreiding staat in `/vergelijk` en het Belgische dossier. De startpagina verwijst naar de uitgebreide vergelijking. Elk nieuw onderdeel vergelijkt België, Frankrijk, Nederland, Duitsland en Spanje. De bestaande belastingvergelijking en de burgemeestervergelijking blijven hun afzonderlijke bronperiode en landendekking vermelden.

## Bestuurskosten

De hoofdcategorie is Eurostat `gov_10a_exp`, COFOG `GF0101`, sector `S13`, totale uitgaven `TE`, referentiejaar 2024. Dit omvat uitvoerende en wetgevende organen, financiële en fiscale zaken en buitenlandse zaken. Het is niet de volledige functie Algemene overheidsdiensten en ook geen afzonderlijke telling van politieke vergoedingen, kabinetten of burgemeesters.

Het keuzemenu biedt daarnaast:

- Personeelskosten binnen dezelfde bestuurspost: `GF0101`, `D1`.
- Personeelskosten volledige overheid: `TOTAL`, `D1`.
- Onderwijsuitgaven: `GF09`, `TE`.
- Overheidsuitgaven gezondheidszorg: `GF07`, `TE`.

Personeelskosten zijn onderdelen van ruimere uitgaven; categorieën mogen niet worden opgeteld. D1 omvat beloning van werknemers en werkgeversbijdragen, inclusief toegerekende sociale bijdragen. Organisatieverschillen tussen publiek en privaat beïnvloeden de vergelijking.

We tonen totale eurobedragen, euro per inwoner, een PPS-benadering en officiële percentages van het bbp. Euro per inwoner gebruikt voor elk jaar de gemiddelde bevolking uit `demo_gind`, `AVG`. De koopkrachtbenadering deelt door `prc_ppp_ind`, `PPP_EU27_2020`, categorie `GDP`, 2024. Dit is een brede prijsniveaucorrectie, geen specifieke deflator voor de prijzen van bestuur of publieke diensten. PPS is geen eurobedrag.

## Resultaten en demografie

Onderwijs toont afgeronde PISA-scores uit de gemeenschappelijke ronde 2022 voor wiskunde, lezen en wetenschappen. De OESO-waarschuwing over de Nederlandse steekproef is zichtbaar. Scores hebben onzekerheidsmarges en betreffen 15-jarige leerlingen; kosten uit 2024 zijn geen oorzakelijke verklaring voor scores uit 2022.

Zorgtoegang komt uit Eurostat `sdg_03_60`: zelfgerapporteerde onvervulde medische behoefte door kosten, afstand of wachtlijsten, als aandeel van de bevolking van 16 jaar en ouder. Levensverwachting komt uit `demo_mlexpec`, totaal, bij geboorte. Dit zijn gedeeltelijke uitkomsten die door meer worden beïnvloed dan de overheidsuitgaven.

Demografische context gebruikt gemiddelde bevolking, aandeel 65-plussers, werkzaamheid bij 20–64-jarigen en bevolkingsdichtheid. Bronmarkeringen voor voorlopige cijfers, afwijkende definities en reeksbreuken worden overgenomen. Gemiddelde Eurostat-bevolking kan door definities, peildata en herzieningen verschillen van de oudere nationale cijfers in de burgemeestervergelijking. We mengen die noemers niet binnen één berekening.

## Tijd en inflatie

De bestuurskosten per inwoner worden voor 2019–2024 getoond als index 2019 = 100. Het keuzemenu schakelt tussen lopende euro’s en een HICP-correctie naar consumentenprijzen van 2019. Elke reeks gebruikt de gemiddelde bevolking van hetzelfde jaar. HICP is een benadering: de consumptiemand verschilt van de inputprijzen van bestuur. PPP vergelijkt landen in één jaar; HICP vergelijkt prijzen binnen een land doorheen de tijd. Deze twee correcties zijn niet uitwisselbaar.

## Bronbewaring en bijwerken

`src/data/reference/complete-country-comparison-snapshot.json` bewaart 610 officiële Eurostat-observaties, de query-URLs, update- en ophaaltijdstippen en het PISA-referentieoverzicht. De berekeningen zoeken dimensiecodes op; ontbrekende waarden blijven ontbrekend.

De vaste Eurostat-momentopname bijwerken:

```bash
python3 scripts/update-context-comparison.py
npm test -- src/data/reference/__tests__/complete-country-comparison.test.ts
npm run build
```

Het updatescript haalt alle bronnen op voordat het bestand atomair wordt vervangen. PISA, referentiejaar en de gekozen periode vereisen een handmatige beoordeling. Verander die niet uitsluitend in de brondata: werk ook definities, UI en tests bij.

## Validatie en publicatie

TypeScript, ESLint, productiebuild en tien gerichte bron- en rekentests zijn geslaagd. Browsercontrole op 320, 390, 768 en 1440 pixels controleert alle vijf kostencategorieën, drie eenheden, beide trendmodi, bronverwijzingen, browserfouten en horizontale pagina-overflow. Tabellen kunnen bewust binnen hun eigen regio horizontaal worden geschoven. Desktop- en mobiele weergave zijn visueel beoordeeld. De Impeccable-detector had geen bevindingen.

Gepubliceerd op 9 november 2026 onder image `convoy-belgium:complete-comparison-20261109`, samen met de eerder voorbereide burgemeestervergelijking. De startpagina, `/vergelijk` en `/belgie` zijn via de publieke HTTPS-URL gecontroleerd (HTTP 200 en nieuwe secties aanwezig). De interactieve productiecontrole op 1440 en 390 pixels vond geen browserfouten of pagina-overflow; kosten- en trendknoppen werken. Web en database zijn gezond.

Back-up van de vorige Compose-configuratie en publicatie-/browserrapporten: `/docker/backups/belgium-government-20261109T221202Z`. Vorige webimage: `convoy-belgium:polish-20261109`.

Publiceren met bestaande Docker-groepsrechten:

```bash
bash scripts/deploy-government-comparison.sh
```

Als het account al lid is van `docker`, maar de huidige sessie nog oude groepen gebruikt, kan de bestaande groep voor één proces worden geladen:

```bash
sg docker -c 'bash scripts/deploy-government-comparison.sh'
```

Dit was de oorzaak van de eerdere blokkade: `id` toonde alleen `kevin` en `sudo`, terwijl `getent group docker` het account al wel vermeldde. Publicatie lukte na het laden van de bestaande groep, zonder `sudo` of wijziging van systeemrechten.

Het script bewaart de huidige Compose-configuratie, vervangt uitsluitend de webservice en herstelt de vorige webimage als de HTTP-controles mislukken.
