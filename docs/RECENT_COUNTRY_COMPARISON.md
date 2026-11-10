# Btw, werkloosheid, NAVO en autobelastingen

De sectie `#actuele-vergelijking` op `/vergelijk` en `/belgie` vergelijkt België, Frankrijk, Nederland, Duitsland en Spanje. De startpagina verwijst ernaar. De landenkaart bevat dezelfde vier aanvullende onderwerpen en toont voor ieder onderwerp zijn eigen periode.

## Periode en bron

Gecontroleerd op 10 november 2026:

| Onderwerp | Gemeenschappelijke periode | Bron en afbakening |
| --- | --- | --- |
| Btw-opbrengst | 2025 | Eurostat `gov_10a_taxag`, `D211`, `S13`, `MIO_EUR` en `PC_GDP` |
| Btw-tarieven | Controle november 2026 | EU Your Europe; belangrijkste nationale tarieven, geen volledige lijst uitzonderingen |
| Werkloosheid | September 2026 | Eurostat `une_rt_m`, `SA`, `TOTAL`, `T`, `PC_ACT` |
| Transportbelastingen | 2024 | Eurostat `env_ac_tax`, `TRA`, `MIO_EUR` en `PC_GDP` |
| Bevolking | Zelfde jaar als opbrengst | Eurostat `demo_gind`, `AVG` |
| Gemeenschappelijke NAVO-budgetten | 2026 | NAVO Funding NATO, bijgewerkt 8 april 2026; verdeelsleutel geldig 2026–2027 |
| Autoregels | Controle november 2026 | Nationale en regionale overheden, per land gelinkt in de interface |

`recent-statistics-snapshot.json` bewaart 85 officiële observaties met query-URL, bronupdate, ophaaltijdstip en bronmarkeringen. De code kiest de laatste periode met waarden voor alle vijf landen en gevraagde eenheden. Oktober 2026 staat al in de werkloosheidsdimensie, maar bevat geen waarnemingen; de vergelijking kiest daarom september. Ontbrekende data blijven ontbrekend.

## Berekeningen en grenzen

Btw-opbrengsten omvatten alle tarieven samen volgens de nationale rekeningen. Dit is geen uitsplitsing van netto-opbrengst per tarief; aangifteroosters met omzet per tarief zijn daarvoor onvoldoende. Voor België is de totale opbrengst €39.796.600.000 in 2025. De rekenhulp voor aankopen gebruikt `netto = inclusief / (1 + tarief / 100)`. Bij €121 inclusief 21% is de btw €21, oftewel 17,36% van de bruto prijs. Nultarief en vrijstelling zijn verschillende regelingen.

Werkloosheid heeft de beroepsbevolking als noemer en gebruikt de ILO-definitie, met seizoencorrectie. Het is niet het complement van werkzaamheid bij 20–64-jarigen. De septembercijfers zijn BE 6,0%, FR 8,5%, NL 4,0%, DE 4,1% en ES 10,3%.

De NAVO-rekenbasis is €528.200.000 burgerlijk budget, €2.420.000.000 militair budget en €2.200.000.000 investeringsplafond: samen €5.148.200.000. De nationale aandelen zijn BE 2,0716%, FR 10,1023%, NL 3,5014%, DE 14,9039% en ES 5,7782%. Voor België geeft dit €106.650.111,20. Dit zijn **indicatieve budgetramingen, geen vastgestelde betalingen**. Het investeringsplafond kan afwijken van de werkelijke uitvoering. De bredere door NAVO genoemde €5,3 miljard is niet de som van deze drie afzonderlijk gepubliceerde bedragen. Nationale defensie-uitgaven en vrijwillige bijdragen worden niet opgeteld bij deze raming.

Transportbelastingen zijn ruimer dan personenauto’s en omvatten ook bepaalde belastingen op ander vervoer. Btw en brandstofaccijnzen zijn uitgesloten. Per inwoner is een normalisatie met de gemiddelde bevolking van hetzelfde jaar, geen gemiddelde factuur per automobilist. Een concrete autofactuur hangt onder meer af van voertuig, CO₂, brandstof, massa, inschrijvingsdatum, woonplaats en gebruik. Daarom staan actuele regels en officiële rekenhulpen naast de opbrengsten, zonder één fictief nationaal autotarief.

Verschillen tussen aandelen verschijnen in procentpunten én relatieve percentages. Bronafrondingen blijven van toepassing. Voorlopige bevolking of opbrengsten markeren ook de afgeleide bedragen per inwoner.

## Bijwerken en valideren

```bash
python3 scripts/update-recent-comparison.py
npm test -- src/data/reference/__tests__/recent-country-comparison.test.ts
npm run typecheck
npm run lint
npm run build
```

Het script vervangt de statistische momentopname pas nadat alle bronnen succesvol zijn opgehaald. Tarieven, NAVO-budgetten en autoregels vereisen een afzonderlijke handmatige broncontrole in `recent-country-comparison.ts`; hun controledatum wordt apart bewaard. Controleer perioden, definities en bronmarkeringen na elke update en pas de vastgelegde controletests aan na bronbeoordeling.

Browsercontrole omvat de vier onderwerpen, eenheden, referentielanden, btw-rekenhulp inclusief lege invoer, autoregels voor vijf landen, nieuwe kaartonderwerpen en minder beweging op 320, 390, 768 en 1440 pixels. Tabellen schuiven binnen hun eigen regio; de pagina zelf mag niet horizontaal overlopen.

## Publicatie

Gepubliceerd op 10 november 2026 met image `convoy-belgium:recent-taxes-20261110`. De volledige testset (196 tests), lint, typecontrole en productiebuild slagen. De publieke startpagina, `/vergelijk` en `/belgie` geven HTTP 200. Productiecontrole op 1440 en 390 pixels bevestigt de vier onderwerpen, btw-rekenhulp, referentiewisseling, autoregels, nieuwe kaartonderwerpen en minder beweging, zonder browserfouten of pagina-overflow. Web en database zijn gezond.

De vorige image `convoy-belgium:map-motion-20261110-v2` is behouden. Vorige Compose-configuratie en validatierapporten: `/docker/backups/belgium-government-20261110T104042Z`. De database is niet gewijzigd.

Het publicatiescript vergelijkt image-tags als volledige regels, zodat bijvoorbeeld `-v2` niet met een kortere tag wordt verward. Normaal bouwt het script de release opnieuw. Alleen om een reeds gebouwde en gecontroleerde release te hergebruiken kan `BELGIUM_SKIP_BUILD=1` worden ingesteld; de image moet dan lokaal bestaan. Terugval en HTTP-controles blijven actief.
