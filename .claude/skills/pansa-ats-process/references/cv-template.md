# Curriculum Vitae — sjabloon

**Documentcode:** PGC-HR-F-0503-05 · **Datum:** 5 januari 2026 (print 2026-01-04)
**Bedrijf:** Commercial Contracting Company H. Pansa & Sons N.V. · K.K.F. Dossier no. 30028

Bronbestand: `hr new/5. Curriculum Vitae hps RGM 2026.docx`

Gestandaardiseerd, tweetalig (EN/NL) CV-sjabloon voor plaatsing bij RGM, ingevuld door of namens de
kandidaat. Het procesdocument noemt het het "CV & RGM communication template"; het CV wordt
**wekelijks** bijgehouden en meegestuurd bij het clientinterview.

## Personal information / persoonsgegevens

- Last name / familienaam, first names / voornamen
- **Job title, project, department** (de plaatsing — niet de sollicitatiefunctie)
- ID number, gender/geslacht, date of birth/geboortedatum, birth place/geboorteplaats
- Address/adres, residence/woonplaats, district
- Nationality/nationaliteit
- Category driving license / categorie rijbewijs
- Date police clearance / datum goedgedrag
- **Familielid werkzaam bij RGM** (Family member working at RGM): ja/nee — indien ja: relatie met
  familielid + naam familielid. *(Eerdere versie: "Pansa Group/HPS"; nu RGM — belangenverstrengelings-
  check richting de klant.)* Datamodel: `candidates.related_to_staff_member` (+ `_details`).

## Education and training

Tabel: opleidingsniveau, schooltype, studierichting. Het sjabloon bevat voorbeeldwaarden die de
Surinaamse onderwijsniveaus tonen — gebruik deze als keuzelijst/hint:

| Niveau | Schooltype (voorbeelden) |
|---|---|
| Universiteit | ADEK e.d. |
| HBO | PTC of UNASAT e.d. |
| MBO | IMEAO, NATIN of AMTO e.d. |
| VOS | VWO of HAVO |
| LBO | SATS, LBGO, LTS, LBO C / B / A e.d. |
| VOJ | MULO A of MULO B |
| GLO | |
| Training certificaat | bv. Welding training 3G & 4G; Microsoft training (Word, Excel, PowerPoint) |

## Professional experience / werkervaring

Tabel: werkperiode, bedrijfsnaam, functie, werkzaamheden.

## Personal competencies (karakter/werkattitudes) · Language skills (taalvaardigheid)

Vrije tekst.

## District Brokopondo — Local Community of Interest (COI)

> **Nieuw t.o.v. de eerdere ATS-referentie.** Dit blok bestaat omdat RGM per contractor bijhoudt of
> iemand tot de lokale *Community of Interest* behoort (district Brokopondo / Klein Saramacca-
> gebied). Het is rapportage-relevant voor de klant — behandel het als gestructureerde data, niet als
> vrije tekst.

Vier vragen, elk **Ja/Nee** en bij "Ja" **welk gebied**:

1. Ben je geboren in het district Brokopondo of het Klein Saramacca gebied?
2. Ben je getrouwd of woon je samen met iemand uit dat gebied?
3. Zijn jouw ouder(s) geboren in dat gebied?
4. **Community of Interest (COI) Resident** — woon je in dat gebied? (naast de gebieden ook
   "Other (…)" met vrije tekst)

Gebieden (keuzelijst, identiek bij alle vier vragen):
**Balingsoela · Brownsweg · Klaaskreek · Kwakoegron · Marshallkreek · Nieuw Koffiekamp · Nieuw
Lombe · Baling · Bilawatra · Misalibi · Nieuw Jacobkondre**

Daarnaast: *Name traditional authority — Name / Title & Village* ("van toepassing als de sollicitant
afkomstig is van het District Brokopondo") = `candidates.traditional_authority` + `origin_village`.

Datamodel: `candidates.community_of_interest` (jsonb) — zie `drizzle/schema.ts` (`CommunityOfInterest`).

## Ondertekening

Handtekening HR + handtekening werknemer, plaats/datum ("Aldus naar waarheid ingevuld").
