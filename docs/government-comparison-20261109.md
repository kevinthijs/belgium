# Overheid en burgemeesters: België en Frankrijk

De broncode voegt de volledige vergelijking toe aan `/vergelijk#overheid-en-burgemeesters` en het Belgische dossier. De startpagina toont een samenvatting met een directe link. De paginanavigatie in het dossier verwijst naar de nieuwe sectie.

De personeelcijfers gebruiken het bestaande OESO-referentieoverzicht voor 2023: België 18,33% en Frankrijk 20,74% van alle werkenden. Het verschil van 2,41 procentpunt is onderscheiden van het relatieve verschil van circa 13%. Inwoners zijn niet de noemer.

De gemeentelijke vergelijking gebruikt 1 januari 2025: 565 Belgische en 34.875 Franse gemeenten, met één gewone burgemeesterpost per gemeente. Inwoners, oppervlakte, posten per 100.000 inwoners, percentage van de bevolking, inwoners per post en posten per 1.000 km² zijn zichtbaar. Verhoudingen worden uit de referentiewaarden berekend. De Franse bevolking is een voorlopige raming uit januari 2025; de Franse oppervlakte is afgerond en de verhouding per km² indicatief. De afbakening, berekeningen en bronlinks staan bij de vergelijking. Het is geen live telling van personen in functie en geen vergelijking van bestuurskosten.

## Publicatie

Deze uitbreiding is op 9 november 2026 live gepubliceerd, samen met de vijflandenvergelijking, onder `convoy-belgium:complete-comparison-20261109`. De eerdere blokkade kwam doordat de sessie het inmiddels bestaande Docker-groepslidmaatschap nog niet gebruikte. Publicatie werkte met `sg docker`, zonder sudo. Zie [de volledige publicatienotities](COMPLETE_COUNTRY_COMPARISON.md).

Voer met Docker-toegang vanuit deze projectmap uit:

```bash
bash scripts/deploy-government-comparison.sh
```

Het script bouwt nu `convoy-belgium:complete-comparison-20261109`, inclusief de later toegevoegde [vijflandenvergelijking](COMPLETE_COUNTRY_COMPARISON.md), bewaart de huidige Compose-configuratie en vervangt uitsluitend de webservice. Bij een mislukte HTTP-controle herstelt het de vorige configuratie en webimage. De database wordt niet aangepast.

De bronbestanden vóór deze uitbreiding staan voor de huidige werksessie in `/tmp/belgium-government-before/src`. Build-, browser- en detectorrapporten staan onder `/tmp/belgium-government-*`.

## Validatie

- Productiebuild, TypeScript-controle en ESLint geslaagd.
- Vijf gerichte tests geslaagd: bronreconciliatie, juiste noemers, percentages, procentpunten en relatieve verhoudingen.
- Browsercontrole op 320, 390, 768 en 1440 pixels: alle verwachte cijfers aanwezig, geen browserfouten of horizontale overflow; mobiele tabel gebruikt de volledige beschikbare breedte.
- Bronvermeldingen open- en dichtgeklapt; desktop- en mobiele screenshots visueel beoordeeld.
- Impeccable-detector zonder bevindingen; publicatiescript gecontroleerd met `bash -n` en daarna succesvol uitgevoerd.
