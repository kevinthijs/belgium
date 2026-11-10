# Onderwijs, partijfinanciering, NAVO en defensie

De sectie `/belgie#bestedingen` toont een handmatig gecontroleerd referentieoverzicht
voor **2024**, los van de automatische importreeksen. De homepage en de sectienavigatie
verwijzen hiernaar. Data en bronlinks staan in `src/data/reference/spending-topics.ts`.

## Bronwaarden

Gecontroleerd op 26 oktober 2026:

| Onderwerp | Bedrag EUR | Afbakening / status |
| --- | ---: | --- |
| Onderwijs | 39.283.600.000 | Eurostat gov_10a_exp, GF09, S13, TE, MIO_EUR; voorlopig (`p`) |
| Partijfinanciering | 83.700.000 | Gerapporteerde directe subsidies; analyse partijrekeningen door KU Leuven, aangehaald door De Standaard |
| Defensie | 7.946.400.000 | Eurostat gov_10a_exp, GF02, S13, TE, MIO_EUR; voorlopig (`p`) |

Eurostat-payloads (update 21 oktober 2026), waarden in **miljoen euro**:

- [Onderwijs](https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/gov_10a_exp?geo=BE&sector=S13&unit=MIO_EUR&na_item=TE&cofog99=GF09&time=2024)
- [Defensie](https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/gov_10a_exp?geo=BE&sector=S13&unit=MIO_EUR&na_item=TE&cofog99=GF02&time=2024)

Partijfinanciering is geen afzonderlijke categorie in de huidige COFOG-import.
De samenvattende publicatie en de oorspronkelijke financiële verslagen van de Kamer
zijn per onderwerp gelinkt. Het bedrag omvat geen totale politieke werkingskost,
geen ledenbijdragen en geen indirecte inkomsten zoals bijdragen van mandatarissen.

## Indicatieve NAVO-berekening

De [NAVO-budgetten voor 2024](https://www.nato.int/cps/en/natohq/news_221440.htm)
bedragen €438,1 miljoen (burgerlijk), €2,03 miljard (militair) en een plafond van
€1,3 miljard voor het NATO Security Investment Programme.

De [Belgische verdeelsleutel](https://www.nato.int/content/dam/nato/legacy-wcm/media_pdf/2024/7/pdf/cost-share-2024.pdf)
van 2,0447% geldt vanaf **7 maart 2024** na de toetreding van Zweden.

De code berekent met Decimal: `(438.100.000 + 2.030.000.000 + 1.300.000.000) × 2,0447 / 100`.
Dit levert €77.046.340,70, compact getoond als circa €77,0 miljoen.
Het is **geen vastgestelde Belgische betaling**: een deel van het budget is een
investeringsplafond, de verdeelsleutel dekt niet het volledige kalenderjaar en
werkelijke uitgaven en overige bijdragen kunnen afwijken. Presenteer dit daarom
uitsluitend als indicatieve budgetraming en nooit als officieel betaald bedrag.

## Bijwerken

1. Kies een gemeenschappelijk jaar waarvoor alle onderwerpen onderbouwd kunnen worden.
2. Controleer Eurostat-bronwaarden, eenheden, sector en voorlopige status.
3. Controleer partijsubsidies aan de hand van de rekeningen en de gepubliceerde analyse;
   verwar directe subsidies niet met alle inkomsten of de totale kost van politiek.
4. Geef voor NAVO de voorkeur aan een geverifieerde Belgische jaarbetaling. Als alleen
   een budgetbenadering beschikbaar is, behoud het ramingslabel en actualiseer de
   budgetten, verdeelsleutel, ingangsdatum en uitleg samen.
5. Werk referentiejaar, controledatum, waarden, bronlinks, statussen en deze documentatie bij.

Tel deze onderwerpen niet op en voeg ze niet als extra categorieën toe aan de
COFOG- of €100-verdeling: de afbakeningen overlappen en hebben verschillende kaders.
De geïmporteerde Eurostat-reeks blijft de hoofdbron voor actuele onderwijs- en
defensiehistoriek; dit overzicht claimt geen automatische actualisering.
