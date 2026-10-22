# Arbeidsovereenkomst voor bepaalde tijd (ZIJIN-RGM)

**Documentcode:** PGC-HR-F-0513-05 · **Datum:** 5 januari 2026

Bronbestand: `hr new/8. Arbeidsovereenkomst voor bepaalde tijd hps ZiJin RGM 2026.docx`

Het contract tussen **Commercial Contracting Company H. Pansa and Sons N.V.** (werkgever, vertegenwoordigd
door de directeur, de heer Pansa Maurino) en de medewerker, **tewerkgesteld bij ZIJIN-RGM**
(de klant heet in het contract "ZIJIN-RGM", niet meer alleen "RGM").
De volledige artikeltekst staat in `src/constants/employment-contract-text.ts` (exacte kopie van de
Word-tekst met invulplaatsen) en wordt geprint via `/admin/applications/[id]/contract`.

## Invulvelden (Word-template → ATS-bron)

| Invulplaats | ATS-bron |
|---|---|
| Naam, voornaam | `candidates.last_name`, `first_name` |
| Geboren op / te (district) | `candidates.date_of_birth` / `birth_place` |
| I.D. no. | `candidates.id_number` |
| Wonende aan (adres, woonplaats) | `candidates.address`, `residence` |
| Functie, **level**, afdeling | `applications.position_applied`, `employment_contracts.job_level`, `department` |
| Duur, "te rekenen van … eindigende op …" | `employment_contracts.start_date` / `end_date` |
| Uurloon **in USD** | `employment_contracts.hourly_wage` |
| Ondertekening | Werkgever: de heer Pansa Maurino MBA, Directeur; werknemer: naam + voornaam |

## Artikelen (samenvatting — kerngetallen die in de app voorkomen)

1. Functie en taken — tewerkgesteld bij ZIJIN-RGM; houdt zich aan reglementen van werkgever én ZIJIN-RGM
2. **Duur en proeftijd** — *zes (6) maanden*, verlenging schriftelijk; proeftijd *twee (2) maanden*
   zonder opzegging
3. Salaris — uurloon in **USD**, berekend tegen de **wisselkoers van ZIJIN-RGM**, uitbetaald in **SRD**
   op de laatste dag van elke maand, per bankoverschrijving
4. Beëindiging — o.a. wederzijdse opzegging min. 1 maand; einde project; van rechtswege
5. Werktijden — **ma–vr 08.00–16.00**; overwerk **150%**, zondag **200%**, feestdagen **300%**
6. Vakantieverlof en -uitkering (uitkering = verlofdagen / 2 × uurloon)
7. PBA (persoonlijke beveiligingsattributen)
8. Medische voorzieningen en verzekeringen (basiszorg, Surinaamse Ongevallen Regeling)
9. Pensioen (wet Algemeen Pensioen)
10. Medische keuring (kosten voor de werknemer)
11. Drugs- en alcoholtest (weigeren = dringende reden)
12. Non-concurrentiebeding — 3 jaar, straal 40 km, boete SRD 20.000 per dag
13. Geheimhoudingsbeding — boete SRD 35.000
14. Nevenfuncties · 15. Arbeidsongeschiktheid · 16. Her- en bijscholing (kosten voor de werkgever;
    terugbetaling bij voortijdig vertrek; kosten indiensttreding voor de werknemer als het
    dienstverband **korter dan 4 maanden** duurt) · 17. Andere bepalingen (HPS personeelsgids &
    RGM-gedragscode maken deel uit van de overeenkomst; werknemer tekent voor ontvangst) ·
    18. Toepasselijk recht: Surinaams recht

## Let op — spanning met het stadia-model

Het procesdocument (PGC-HR-PR-0501-05) beschrijft de contractreeks **proeftijd 2 mnd → 4 mnd →
verlenging 6 mnd → verlenging 12 mnd**, maar het contractsjabloon zelf zegt: **duur 6 maanden met 2
maanden proeftijd**. Deze twee zijn niet 1-op-1 te rijmen (de ATS-enum `contract_stage` volgt het
procesdocument). De printpagina vult de datums in uit het contractrecord maar laat de
proeftijd-zin in artikel 2 staan zoals in het sjabloon. **Open vraag aan HR**: welke tekst hoort bij
welk stadium? Niet zelf invullen of aanpassen.
