# Landenvergelijking

De nieuwe vijflandenvergelijking voor bestuurskosten, onderwijs, gezondheid, demografie en kostenevolutie staat beschreven in [COMPLETE_COUNTRY_COMPARISON.md](COMPLETE_COUNTRY_COMPARISON.md). Hieronder staat het bestaande vierlandenreferentieoverzicht met de eigen bronperiode.

Routes: `/vergelijk` en `/belgie#landenvergelijking`.

De sectie gebruikt een gecontroleerde momentopname met België, Frankrijk, Spanje
en Nederland. De gegevens komen uit het onderzoek van 30 oktober 2026.
Binnen elke indicator gelden dezelfde eenheid, definitie en hetzelfde jaar voor
alle landen. Jaren verschillen tussen indicatoren; combineer ze niet tot één
rangschikking of totaalscore.

## Data en bronnen

- `src/data/reference/country-comparison-snapshot.json` bevat de waarden,
  brondefinities en de oorspronkelijke Eurostat- en OESO-responses.
- `src/data/reference/country-comparison.ts` legt de Nederlandstalige definities,
  bronlinks en voorlopige statussen vast.
- De vergelijking heeft geen database of live netwerkverzoek nodig. De bestaande
  schuldvergelijking blijft een afzonderlijke weergave van geïmporteerde data.

| Onderwerp | Jaar | Bron |
| --- | --- | --- |
| Totale belastingen en verplichte sociale bijdragen / bbp | 2024, voorlopig | OESO Revenue Statistics 2025, tabel 1.1 |
| Belastingdruk op arbeid / totale werkgeverskosten | 2025 | OESO Taxing Wages 2026, tabel 1.1 |
| Overheidswerkgelegenheid / alle werkenden | 2023 | OESO Government at a Glance 2025, EMPG, PT_EMP, S13 |
| Onderwijs en defensie, euro en % bbp | 2024 | Eurostat gov_10a_exp, S13, TE, GF09 / GF02 |
| Overheidsinkomsten, uitgaven en saldo / bbp | 2024 | Eurostat gov_10a_main, S13, TR / TE / B9 |

Links naar de exacte publicaties en queries staan in de momentopname.
België, Frankrijk en Spanje hebben voorlopige Eurostat-waarden voor onderwijs en
defensie. Nederland heeft daar geen bronmarkering; dat betekent niet automatisch
dat een cijfer nooit meer herzien zal worden.

De belastingdruk op arbeid omvat werkgeversbijdragen en betreft een alleenstaande
zonder kinderen met 100% van het eigen nationale gemiddelde loon. Dit is geen
inhoudingspercentage op een brutoloon en geen berekening voor een gelijk eurolonenbedrag.
De totale OESO-belastinginkomsten zijn niet uitwisselbaar met de ruimere Eurostat-
overheidsinkomsten of de Eurostat-belastingmaatstaf met toegerekende sociale bijdragen.

Overheidswerkgelegenheid betreft de hele overheid, niet uitsluitend statutairen.
Zelfstandigen tellen mee in de totale werkgelegenheid in de noemer. Publiek
gefinancierde diensten met een private werkgever kunnen buiten S13 vallen.
Deze maatstaf is daarom geen zelfstandige indicator van efficiëntie.

## Bijwerken

Werk de momentopname handmatig bij met een bronresponse of een exacte tabelverwijzing.
Controleer jaar, sector, eenheid, landcode en voorlopige status. Werk bij een
jaarwissel ook de veldnamen, indicatorbeschrijvingen, controledatum, UI en tests bij.
De bronreconciliatietests bewaken landtoewijzing, eenheden, COFOG-indeling en de
werkgelegenheidsnoemer.

Partijfinanciering en rechtstreeks betaalde NAVO-bijdragen blijven buiten de
landenvergelijking totdat voor alle landen eenzelfde afbakening is onderbouwd.
De bestaande Belgische NAVO-budgetraming is geen werkelijke jaarbetaling.
