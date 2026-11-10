# Volledige overheidsrekening

De sectie `#geldstromen` op `/vergelijk` en `/belgie` verbindt inkomsten, economische uitgaven, sociale bescherming, rente, investeringen en schuld voor België, Frankrijk, Nederland, Duitsland en Spanje. De startpagina verwijst ernaar. De kaart toont ook sociale bescherming, rentelasten en vaste investeringen als aandeel van het bbp.

## Bronnen en perioden

De momentopname van 10 november 2026 bewaart 6.170 officiële Eurostat-observaties met query-URL, update, ophaaltijdstip, dimensies en bronmarkeringen:

| Onderdeel | Reeks | Afbakening |
| --- | --- | --- |
| Overheidsrekening en economische posten | `gov_10a_main` | S13, 2015–2025, MIO_EUR/PC_GDP |
| Sociale bescherming | `gov_10a_exp` | S13, TE, GF10 en GF1001–GF1009, 2015–2024 |
| Belastingdetails | `gov_10a_taxag` | S13, geselecteerde ESA-posten, 2015–2025 |
| Schuld en officiële saldi | `gov_10dd_edpt1` | S13, GD/B9, 2014–2025 |
| Bbp voor eigen afgeleide percentages | `gov_10dd_edpt1` | **S1**, B1GQ, MIO_EUR; niet S13 |
| Gemiddelde bevolking | `demo_gind` | AVG, zelfde jaar als bedragen |
| Inflatie | `prc_hicp_aind` | CP00, INX_A_AVG, 2015–2025 |
| Garanties | `gov_cl_guar` | S13, FGT, 2024 als laatste gemeenschappelijke jaar |

`financial-pattern-snapshot.json` bevat de ruwe reacties. `financial-pattern.ts` zoekt elke dimensie expliciet op. Ontbrekende waarden blijven ontbrekend; ook een lege toekomstige periode is geen nul. De sociale weergave schakelt zichtbaar naar een beschikbaar jaar. Alle vijf landen gebruiken binnen dezelfde vergelijking hetzelfde jaar.

## Sluitende bedragen en verschillende doorsneden

De rekenregel gebruikt **berekend saldo = TR − TE**. Het officiële B9 blijft afzonderlijk bewaard. Het verschil `(TR − TE) − B9` staat als statistische saldoaansluiting in de tabel en bij een afwijking ook in de tekst. Voor België in 2025: TR €315.402.600.000, TE €348.825.500.000, berekend saldo −€33.422.900.000, gerapporteerd B9 −€33.423.100.000; aansluiting +€200.000. Geen bronwaarde wordt aangepast om dit te verbergen.

Inkomsten worden verdeeld in D2, D5, D61, D91, verkopen/eigen productie/diensten, vermogensinkomen, lopende overdrachten, kapitaaloverdrachten zonder D91 en ontvangen overige productiesubsidies. De economische uitgavenverdeling bevat lonen, aankopen, sociale uitkeringen en aangekochte verstrekkingen, rente, vaste investeringen, overige niet-financiële activa, subsidies, overdrachten en andere bronposten. Een resterend verschil blijft zichtbaar als statistische aansluiting. Voor Belgische economische uitgaven 2025 is dit −€4 miljoen. Alleen numerieke ruis kleiner dan één eurocent wordt op nul gezet.

De economische en functionele COFOG-weergave zijn twee doorsneden van dezelfde uitgaven. GF1002 en GF1003 omvatten veel pensioenuitgaven, maar vormen geen volledige telling van alle pensioenregelingen. Sociale bescherming is niet hetzelfde als alle gezondheidszorg of alle sociale verstrekkingen. Hoofdgroepen, belastingdetails, EU-deelposten en niet-fiscale details mogen niet worden opgeteld.

Primair saldo = B9 + D41PAY. P51G zijn bruto vaste investeringen vóór afschrijving, geen investeringssubsidies of alle investeringen van publieke marktbedrijven. Aandelen van inkomstenposten gebruiken TR als noemer, uitgavenposten TE. Andere keuzen tonen totale euro’s, euro per inwoner of eigen percentages met het officiële bbp van hetzelfde jaar.

De historie omvat 2015–2025 en kan hoofdindicatoren, belastingdetails, sociale categorieën en economische posten tonen. Detailreeksen kunnen eerder eindigen. HICP-correctie gebruikt de verhouding index 2015/index bronjaar; bbp-aandelen worden niet nogmaals gedefleerd. HICP is een brede consumentenprijsindex, geen prijsindex voor overheidsdiensten.

## Raming, schuld en risico’s

`financial-outlook-snapshot.json` bewaart afzonderlijke historische verwachtingen, bronbestanden, SHA-256 en vindplaatsen:

- **EC Autumn Forecast 2024**, publicatie 15 november 2024, voorspelde saldo- en schuldratio’s voor 2025. PDF-pagina’s BE 99, FR 111, NL 127, DE 101, ES 109. De huidige officiële realisaties worden ernaast gezet. Dit zijn EC-ramingen, geen vastgestelde nationale begrotingen of uniforme meting van regeringsbeloften. Bbp-herzieningen beïnvloeden verschillen.
- **Ageing Report 2024**, publicatie 18 april 2024, basisscenario voor 2022–2070, tabellen II.1.64, II.1.107, II.1.114 en II.1.135 uit `cross-country_tables`. De interface noemt dit expliciet een historisch scenario, geen actuele voorspelling; latere hervormingen kunnen afwijken. De recente Belgische Planbureau-studie 2026 is apart gelinkt en wordt niet met de andere landen gemengd.

Schuldbrug: schuld vorig jaareinde + (−B9) + overige aanpassingen = schuld huidig jaareinde. De aanpassingspost is een berekend residu, geen bewezen uitsplitsing van oorzaken. Leningen en aflossingen zijn financiering. Alle genormaliseerde brugposten gebruiken dezelfde huidige jaarnoemer, zodat de identiteit behouden blijft.

Garanties zijn afzonderlijke mogelijke verplichtingen, niet extra Maastrichtschuld. Hun nationale munteenheid is voor deze vijf landen euro. Garanties, scenario-uitgaven en schuld worden niet opgeteld.

## Onderhoud en controles

```bash
python3 scripts/update-financial-pattern.py
node scripts/extract-ageing-reference.mjs official-ageing-tables.xlsx
npm test -- src/data/reference/__tests__/financial-pattern.test.ts
npm run typecheck
npm run lint
npm run build
```

Het statistiekscript vervangt pas na succesvolle downloads de momentopname. De scenario-extractor controleert tabeltitels, landen en jaren. Publicatiegegevens, beleidsscenario’s en de historische najaarsraming vereisen menselijke bronbeoordeling; een nieuwe prognose mag geen oude verwachting overschrijven alsof zij destijds bekend was.

Tests controleren alle landen en jaren, expliciete aansluitingen, primaire saldi, noemers, sociale deelposten, schuldbruggen inclusief overschotten, inflatie en ontbrekende data. Browsercontrole omvat zeven weergaven, landen en jaren, drie eenheden, historische detailreeksen, prijsbasis, garanties, scenario’s en kaartonderwerpen op desktop en mobiel.

Op 320 pixels worden ook de bestaande kaarten voor de schuldverdeling binnen hun gridkolom gehouden (`min-w-0`), zodat de dossierpagina zelf niet horizontaal overloopt. Tabellen behouden hun eigen horizontale schuifruimte.

## Publicatie en validatie

Gepubliceerd op 10 november 2026 met image `convoy-belgium:financial-pattern-20261110-v2`. De volledige testset (204 tests), lint, typecontrole en productiebuild slagen. De zeven weergaven, drie eenheden, land- en jaarselectie, historische details, prijsbasis, scenario’s en drie nieuwe kaartonderwerpen zijn interactief gecontroleerd op 320, 390, 768 en 1440 pixels. Publieke interactiecontrole op 1440 en 390 pixels vond geen browserfouten of pagina-overflow. Na de kleine correctie aan de bestaande schuldverdeling zijn `/`, `/vergelijk` en `/belgie` op alle vier breedtes opnieuw gecontroleerd: HTTP 200, geen browserfouten en geen horizontale pagina-overflow. Web en database zijn gezond; de database is niet gewijzigd.

Vorige Compose-configuratie, bronbestanden en controlerapporten: `/docker/backups/belgium-government-20261110T122317Z`. De eerdere images zijn behouden voor terugval. Grote oorspronkelijke PDF- en Excel-bronnen staan in de back-upmap; de repository bewaart hun relevante waarden, vindplaatsen en SHA-256.
