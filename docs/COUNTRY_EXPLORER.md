# Interactieve landenkaart

De sectie `#landenkaart` staat op `/vergelijk` en `/belgie`; de startpagina verwijst ernaar. Bezoekers kiezen een onderwerp, referentieland, eenheid en vergelijkingsland. De kaart vergelijkt België, Frankrijk, Nederland, Duitsland en Spanje.

## Cijfers en noemers

De oorspronkelijke zeven onderwerpen gebruiken uitsluitend de bestaande gecontroleerde momentopname uit `complete-country-comparison-snapshot.json`, jaar 2024: bestuurskosten, overheidspersoneelskosten, onderwijsuitgaven, zorguitgaven, werkzaamheid, aandeel 65-plussers en onvervulde medische behoefte. Bronmarkeringen en definities blijven zichtbaar. Werkzaamheid meet alle werkenden, niet alleen overheidspersoneel.

Financiële onderwerpen ondersteunen % van bbp, euro per inwoner en PPS per inwoner. PPS gebruikt de bestaande brede bbp-koopkrachtcorrectie. Bevolkingsaandelen behouden hun eigen noemer, onafhankelijk van de financiële eenheidskeuze.

`compareCountryValues` berekent het absolute verschil en `(waarde − referentie) / |referentie| × 100`. Bij aandelen wordt het absolute verschil uitgedrukt in **procentpunten**. Bijvoorbeeld: Frankrijk 1,5% tegenover België 2% geeft −0,5 procentpunt en −25% relatief. Een andere referentie verandert het relatieve percentage. Ontbrekende waarden blijven ontbrekend; een nulreferentie geeft geen berekenbaar relatief percentage.

De kleuren tonen waarden of relatieve verschillen, geen kwaliteitsrangschikking. De startpaginavergelijking toont eveneens procentpunten en relatieve verschillen, met behoud van haar eigen bronjaren.

## Geografische bron

`europe-country-map.json` bevat echte Natural Earth 1:50m-grenzen, een Mercatorprojectie, bron-URL en SHA-256. Natural Earth is publiek domein; de interface vermeldt de bron. De kaartuitsnede toont Europees grondgebied. Statistieken volgen de nationale afbakening van hun bron, inclusief eventuele overzeese gebieden.

Opnieuw genereren:

```bash
python3 scripts/generate-europe-map.py
# Of met een lokaal bronbestand:
python3 scripts/generate-europe-map.py --input countries.geojson
```

## Bediening en beweging

Landen zijn via de kaart, Enter/spatie en afzonderlijke landknoppen selecteerbaar. Labels tonen de waarden ook zonder kleurherkenning. Selectieomtrek, kaartkleuren en vergelijkingsbalken hebben korte overgangen; `prefers-reduced-motion` schakelt animatie uit en verkort overgangen.

Controleer berekeningen en geografische dekking met `npm test`; controleer de productiebuild met `npm run build`. Browsercontrole omvat 320, 390, 768 en 1440 pixels, land- en onderwerpkeuze, referentiewisseling, eenheden, toetsenbord, bronnen, minder beweging en pagina-overflow.

Publiceren: `sg docker -c 'bash scripts/deploy-government-comparison.sh'`. Het script bouwt `convoy-belgium:map-motion-20261110-v2`, bewaart de vorige configuratie en vervangt alleen de webservice, met automatische terugval als de HTTP-controles mislukken.

## Publicatie en controles

Op 10 november 2026 gepubliceerd met image `convoy-belgium:map-motion-20261110-v2`. De 189 tests en de productiebuild inclusief lint- en typecontrole slagen. Browsercontrole op de vier genoemde breedtes bevestigt alle onderwerpen en eenheden, referentiewisseling, toetsenbordbediening, bronlinks en minder beweging, zonder browserfouten of horizontale pagina-overflow. Lichte en donkere weergave zijn visueel beoordeeld.

Vorige configuratie: `/docker/backups/belgium-government-20261110T080337Z/docker-compose.before.yml`. De database is niet gewijzigd. De publieke startpagina, `/vergelijk` en `/belgie` geven HTTP 200. Interactieve productiecontrole op 1440 en 390 pixels bevestigt werkende kaart- en startpaginakeuzes, zonder browserfouten of pagina-overflow. De mobiele dossiernavigatie blijft binnen de paginabreedte. Web en database zijn gezond. De validatierapporten staan in dezelfde back-upmap.

De vier latere onderwerpen (btw-opbrengst, werkloosheid, transportbelastingen en NAVO-verdeelsleutel) volgen hun eigen gemeenschappelijke periode. Het bronjaar op de kaart verandert mee. Zie [recente belastingen en arbeidsmarkt](RECENT_COUNTRY_COMPARISON.md) voor bronnen, actuele perioden en afbakeningen.
