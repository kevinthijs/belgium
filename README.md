# Belgische Staatsrekening

Een overzicht van Belgische overheidsinkomsten, uitgaven en overheidsschuld, met vergelijkingen tussen Europese landen. De site vermeldt per indicator het bronjaar, de definitie en eventuele voorlopige status.

Website: https://belgie.dakkofferverhuur.be

## Inhoud

- Belgische inkomsten, uitgaven, schuld en verschillende overheidsniveaus.
- Belastingen, overheidspersoneel en burgemeesters in verhouding tot inwoners en oppervlakte.
- Bestuurs- en personeelskosten, onderwijs, gezondheid en demografische context voor België, Frankrijk, Nederland, Duitsland en Spanje.
- Kostenevolutie met inflatiecorrectie en een afzonderlijke koopkrachtbenadering.
- Interactieve landenkaart met zeven onderwerpen, percentages, procentpunten en relatieve verschillen tussen landen.

De bronnen omvatten Eurostat, de OESO, Statbel en de Nationale Bank van België. Een deel van de site gebruikt geïmporteerde PostgreSQL-data; de landenvergelijkingen gebruiken gecontroleerde bronmomentopnamen. Er wordt geen productiedatabase meegeleverd.

## Lokaal ontwikkelen

Gebruik een afzonderlijke ontwikkelomgeving met Node.js (de Docker-build gebruikt Node 26), npm en PostgreSQL.

```bash
npm ci
cp .env.example .env
# Stel DATABASE_URL en de beheergegevens in voor je eigen ontwikkelomgeving.
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
```

De seed maakt referentiedimensies aan, geen financiële observaties. Gebruik de gedocumenteerde imports voor financiële gegevens; zonder imports blijven databaseafhankelijke onderdelen leeg. De gecontroleerde landenvergelijking is beschikbaar op `/vergelijk`.

## Controles

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Bijdragerichtlijnen: [AGENTS.md](AGENTS.md). Bronnen en afbakeningen: [landenvergelijking](docs/COUNTRY_COMPARISON.md), [bestuurskosten en context](docs/COMPLETE_COUNTRY_COMPARISON.md), [interactieve kaart](docs/COUNTRY_EXPLORER.md) en [consolidatie](docs/CONSOLIDATION.md).

## Productie

De productieomgeving draait op Netcup onder `/docker/stacks/websites/belgium`. Lees de [beheer- en migratienotities](docs/migration-netcup-20261109.md) voordat je publiceert. Start de oude stack uit `docker-compose.source.yml` niet op de productieserver.

Lokale geheimen, databaseback-ups, dependencies en gegenereerde buildbestanden horen niet in deze repository.
