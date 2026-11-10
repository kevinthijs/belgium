# Belgium op Netcup

De Belgische Staatsrekening is op 9 november 2026 verhuisd naar `nc-prod-01` (`62.83.77.192`), onder `/docker/stacks/websites/belgium`.

De productie-URL is `https://belgie.dakkofferverhuur.be`.

## Beheer

Voer op Netcup uit:

```bash
cd /docker/stacks/websites/belgium
docker compose ps
docker compose logs --tail 50 web db
docker compose up -d --no-build
```

De actieve applicatie-image is `convoy-belgium:map-motion-20261110-v2`. De interactieve landenkaart en procentuele verschillen zijn op 10 november 2026 toegevoegd; zie [de kaartdocumentatie](COUNTRY_EXPLORER.md). De eerdere webimage `convoy-belgium:complete-comparison-20261109` is behouden voor terugval. De uitgebreide landenvergelijking en burgemeestersectie zijn op 9 november 2026 gepubliceerd; zie [de publicatienotities](COMPLETE_COUNTRY_COMPARISON.md). De eerdere verfijnde webimage is behouden als `convoy-belgium:polish-20261109`. De oorspronkelijke bronbuild na de migratie is behouden als `convoy-belgium:source-20261109`. Beide zijn op Netcup gebouwd vanuit de broncode en het bestaande lockbestand. Zie [de polish-notities](polish-20261109.md) voor de laatste wijziging. De oudere productie-image bevatte `/vergelijk` nog niet; de nieuwe build bevat deze pagina wel. De database gebruikt `convoy-belgium-postgres:migrated-20261109`. De oorspronkelijke applicatie-image is als `convoy-belgium:migrated-20261109` behouden voor terugval.

De oorspronkelijke bronbestanden zijn meegenomen. `node_modules`, `.next` en `.memsearch` zijn niet als losse mappen gekopieerd; de applicatie-image bevat de runtime en build. Gebruik voor het starten van de vastgelegde productieversie `--no-build`.

De oorspronkelijke Compose-configuratie staat in `docker-compose.source.yml`. De actieve configuratie is `docker-compose.yml`, met projectnaam `websites-belgium`.

De PostgreSQL-data staat in volume `websites-belgium_pgdata`. De database heeft geen publieke hostpoort en gebruikt een eigen intern netwerk. Het nieuwe databasewachtwoord staat samen met de bestaande beheerinstellingen in `.env` (modus 600). De beheerlogin is behouden.

De webapp luistert lokaal op `127.0.0.1:3140`. Caddy bereikt de applicatie als `websites-belgium:3000` via `websites-belgium_proxy`. De aansluiting van Caddy staat blijvend in `/docker/stacks/caddy/compose.yaml`, met `gw_priority: -1` om de bestaande standaardgateway te behouden.

## Back-ups en controles

Op beide servers staat `/docker/backups/belgium-netcup-20261109`. De map bevat het projectarchief, een PostgreSQL-dump, de overgenomen Docker-images en een SHA-256-manifest. Op Netcup staan ook de tabeltellingen na herstel en `verification.json` met de HTTP- en authenticatiecontroles.

Alle 23 publieke databasetabellen zijn na herstel vergeleken, inclusief 23.647 observaties en 46.764 ongemapte bronwaarden. Alle aantallen waren gelijk. Ook de architectuur en filesystemlagen van de oorspronkelijke overgenomen images zijn vergeleken. De bronbuild slaagde inclusief lint- en typecontroles. De hoofdpagina, `/belgie`, `/vergelijk` en de beheerlogin zijn gecontroleerd; beheer zonder inloggegevens geeft HTTP 401.

De oude containers `belgium-staatsrekening-web` en `belgium-staatsrekening-db` blijven gestopt met herstartbeleid `no`. Start de lokale stack niet: daarmee zou een tweede omgeving met verouderde data ontstaan.

Voor dit domein is een specifiek DNS A-record naar Netcup toegevoegd. Het wildcardrecord voor andere domeinen is behouden. De oude Caddy-route stuurt Belgium-verkeer door naar Netcup, zodat clients met oude DNS-cache de applicatie blijven bereiken.

## Terugzetten

Neem bij terugzetten eerst een actuele consistente dump van de Netcup-database. De migratiedump bevat alleen de gegevens van het migratiemoment. Zet pas na een gecontroleerd herstel de oude applicatie, Caddy-route en DNS terug.

De oorspronkelijke DNS-situatie en het aangemaakte record zijn lokaal vastgelegd in `dns.before.json` en `dns.created.json`. `python3 /docker/backups/belgium-netcup-20261109/dns.py rollback` verwijdert uitsluitend het aangemaakte DNS-record; het herstelt geen applicatie of data. De oorspronkelijke Caddy-bestanden zijn eveneens in de back-upmap bewaard.
