# Trimly — TODO & diario di bordo

> Web app per ritagliare immagini: forma libera, proporzioni standard, quadrato arrotondato e cerchio con esterno trasparente.
> Tutto avviene nel browser: le immagini non lasciano mai il dispositivo.

Questo file è la guida del progetto e insieme il suo diario di viaggio. Dentro trovi:

1. **Decisioni prese**: cosa abbiamo concordato e perché.
2. **Piano di lavoro**: tutte le task, dalla progettazione alla pubblicazione, con lo stato di ciascuna.
3. **Diario di bordo**: cosa è successo davvero a ogni task, con test eseguiti, errori ("scivoloni") e come sono stati risolti, oppure no.

**Legenda stati:** `[ ]` da fare · `[~]` in corso · `[x]` completata · `[!]` completata con problemi aperti · `[-]` scartata

---

## 1. Decisioni prese

### Requisiti concordati con te (24/09/2026)

| Tema | Decisione |
|---|---|
| Nome | **Trimly** |
| Tipo di app | Web app a pagina singola (SPA), statica, pubblicabile su hosting gratuito |
| Lingue | Italiano + inglese, scelta automatica in base al browser, con selettore |
| Tema | Chiaro/scuro automatico (segue il dispositivo), con pulsante per cambiarlo |
| Forme | Rettangolo libero · proporzioni standard · quadrato arrotondato · cerchio |
| Cerchio / arrotondato | Esterno trasparente di default; sfondo a colore e bordo regolabile opzionali |
| Strumenti | Rotazione di 90° e raddrizzamento fine (±45°) · specchia orizzontale/verticale · dimensione finale in pixel |
| Esclusi | Ellisse, forme decorative, più immagini alla volta |
| Dispositivi | Computer e smartphone allo stesso livello (mouse, tastiera, touch, pizzico per zoom) |
| Offline | App installabile (PWA), funziona anche senza internet dopo la prima visita |
| Pubblicazione | Scelgo io l'hosting e ti lascio una guida passo-passo non tecnica |
| Versioni | Un "punto di ripristino" git locale dopo ogni task superata; nulla viene pubblicato senza chiedertelo |

### Scelte tecniche (decise da me, come richiesto)

| Cosa | Scelta | Perché |
|---|---|---|
| Linguaggio / framework | TypeScript + React | Diffusissimi e robusti; TypeScript trova molti errori prima ancora di eseguire |
| Build | Vite | Veloce; produce una cartella di file statici pronta da pubblicare |
| Motore di ritaglio | Scritto da zero (geometria pura + canvas) | Controllo totale su rotazione, cerchio, touch e trasparenza |
| Stile | CSS con "design tokens" (variabili colore) | Leggero; tema chiaro/scuro gestito in modo pulito |
| Icone / font | Lucide · Inter (incluso nell'app, quindi funziona offline) | Look pulito e coerente |
| Formati letti | JPG, PNG, WebP, GIF, BMP, AVIF, SVG, ICO nativi; **HEIC/HEIF** (foto iPhone) e **TIFF** con decoder caricati solo quando servono | Copre i formati più comuni senza appesantire l'app |
| Formati salvati | PNG (trasparenza), JPG, WebP (se il browser lo supporta) | Standard universali |
| Offline / installazione | Service worker + manifest (vite-plugin-pwa) | PWA standard |
| Test | Vitest (logica), Playwright (browser veri: Chromium, WebKit/Safari, Firefox, mobile) | Verificano sia la matematica sia l'uso reale |
| Hosting (proposta) | Netlify (anche "trascina la cartella") oppure Cloudflare Pages / GitHub Pages | Gratuiti, HTTPS incluso, nessun server da gestire |

### Modello geometrico (promemoria per lo sviluppo)
- Il "mondo" ha l'origine al centro dell'immagine; l'immagine è trasformata con `mondo = R(θ) · S · u`, dove θ = rotazione a scatti di 90° + raddrizzamento, S = specchiatura e u = pixel rispetto al centro.
- Il riquadro di ritaglio è **sempre allineato agli assi** nel mondo; le unità del mondo sono pixel dell'immagine originale.
- Vincolo: i 4 angoli del ritaglio devono stare dentro l'immagine ruotata. Il test si fa riportando ogni punto nelle coordinate immagine: |u| ≤ W/2 e |v| ≤ H/2.
- Specchiare "a schermo" equivale a θ → −θ e a invertire il flag di specchiatura; il ritaglio si specchia di conseguenza.

---

## 2. Piano di lavoro

### Fase 0 — Progettazione
- [x] **T0.1** Raccolta requisiti (domande e risposte) → sezione 1
- [x] **T0.2** Scelte tecniche, architettura e modello geometrico → sezione 1
- [x] **T0.3** Design UI/UX: struttura delle schermate (vuota, editor desktop, editor mobile), design tokens, micro-interazioni

### Fase 1 — Impostazione progetto
- [x] **T1.1** Scaffold Vite + React + TypeScript, ESLint, `.gitignore`, git init, script npm
- [x] **T1.2** Infrastruttura test: Vitest + Playwright, generatore di immagini di prova (JPG/PNG/HEIC/TIFF/EXIF ruotato…), smoke test

### Fase 2 — Fondamenta dell'interfaccia
- [x] **T2.1** Design system: tokens CSS, tema chiaro/scuro + interruttore, font Inter, componenti base (bottone, segmented control, slider, chip, toast)
- [x] **T2.2** Traduzioni it/en con rilevamento automatico e selettore (test: nessuna chiave mancante)
- [x] **T2.3** Shell dell'app: header, area di lavoro, pannello laterale (desktop) / pannello a schede (mobile)

### Fase 3 — Caricamento immagini
- [x] **T3.1** Caricamento: scelta file, trascinamento (con overlay), incolla dagli appunti, immagine di esempio; errori chiari
- [x] **T3.2** Decodifica formati nativi + riconoscimento formato dai byte + orientamento EXIF + SVG senza dimensioni
- [x] **T3.3** Decoder HEIC/HEIF e TIFF caricati on-demand
- [x] **T3.4** Protezione per immagini enormi (limiti canvas su iPhone, ecc.)

### Fase 4 — Motore di ritaglio (logica pura)
- [x] **T4.1** Modulo geometria: contenimento, sposta, ridimensiona (libero/proporzionato), massimo rettangolo inscritto, rotazione 90°, specchia, raddrizza + test unitari
- [x] **T4.2** Stato dell'editor (reducer) + annulla/ripeti + test unitari

### Fase 5 — Editor interattivo
- [ ] **T5.1** Stage: immagine trasformata, adattamento allo spazio, zoom (rotella, pizzico, pulsanti), spostamento vista
- [ ] **T5.2** Riquadro di ritaglio: sposta e ridimensiona con maniglie, oscuramento esterno, griglia dei terzi, dimensioni in px, tastiera
- [ ] **T5.3** Forme: rettangolo, arrotondato (con slider), cerchio
- [ ] **T5.4** Proporzioni: libera, originale, 1:1, 4:5, 3:2, 16:9…, inversione verticale/orizzontale, personalizzata
- [ ] **T5.5** Rotazione 90°, raddrizzamento, specchia, sempre rispettando i vincoli

### Fase 6 — Esportazione
- [ ] **T6.1** Motore di rendering: ritaglio + trasformazioni + maschera forma + sfondo + bordo + ridimensionamento di qualità
- [ ] **T6.2** Impostazioni di uscita: formato (scelta automatica intelligente), qualità, dimensione in pixel, peso stimato del file
- [ ] **T6.3** Scarica · copia negli appunti · condividi (smartphone)
- [ ] **T6.4** Anteprima dal vivo del risultato (con scacchiera per la trasparenza)

### Fase 7 — PWA e rifiniture
- [ ] **T7.1** PWA: manifest, icone, service worker, test offline
- [ ] **T7.2** Accessibilità: tastiera, focus, etichette ARIA, contrasti, riduzione animazioni
- [ ] **T7.3** Rifinitura mobile: gesti, safe area iPhone, pannello a schede
- [ ] **T7.4** Rifinitura visiva: transizioni, stati vuoti, messaggi, scorciatoie

### Fase 8 — Qualità
- [ ] **T8.1** Suite end-to-end completa su Chromium, WebKit (Safari), Firefox e viewport mobile
- [ ] **T8.2** Verifica visiva manuale (screenshot desktop/mobile, chiaro/scuro, it/en)
- [ ] **T8.3** Prestazioni: peso del bundle, immagini grandi, fluidità del trascinamento

### Fase 9 — Pubblicazione
- [ ] **T9.1** Build di produzione + configurazione hosting (header di sicurezza e cache)
- [ ] **T9.2** SEO e condivisione: meta tag, immagine di anteprima social, favicon
- [ ] **T9.3** `DEPLOY.md`: guida alla pubblicazione passo-passo per non tecnici
- [ ] **T9.4** `README.md`

### Fase 10 — Chiusura
- [ ] **T10.1** Revisione finale, riepilogo e retrospettiva nel diario

---

## 3. Diario di bordo

> Una voce per ogni task, in ordine cronologico. Ogni voce riporta: **cosa è stato fatto**, **test eseguiti ed esito**, **scivoloni** (errori, ripensamenti, bug) e il loro stato: ✅ risolto / ⚠️ aperto.

### 24/09/2026 — T0.1 Raccolta requisiti ✅
- Tre giri di domande a scelta multipla: lingua, forme, strumenti, cerchio, hosting, nome, dispositivi, offline, tema, versioni.
- Per il nome mi hai chiesto una decina di proposte in inglese: ne ho presentate 10 e hai scelto **Trimly**.
- Scivoloni: nessuno.

### 24/09/2026 — T0.2 Scelte tecniche ✅
- Verificato l'ambiente: Node 24 e npm 11 già installati sul Mac. La cartella del progetto era vuota.
- Controllate le versioni aggiornate delle librerie. Sono più recenti di quanto mi aspettassi (Vite 8, TypeScript 7, Vitest 5): farò attenzione a eventuali cambi di configurazione.
- Scelto di scrivere il motore di ritaglio da zero invece di usare una libreria. Nessuna libreria gestisce bene insieme forma libera, cerchio, raddrizzamento con vincoli e touch.
- Scivoloni: nessuno.

### 24/09/2026 — T0.3 Design UI/UX ✅
- Scritto `docs/DESIGN.md` con i principi, i wireframe delle 3 schermate (vuota, editor desktop, editor mobile), la tabella dei gesti e i design tokens chiaro/scuro.
- Aggiunta rispetto alle richieste: un pulsante **"Prova con un esempio"** nella schermata vuota, per provare l'app senza avere una foto a portata di mano.
- Scivoloni: nessuno.

### 24/09/2026 — T1.1 Scaffold del progetto ✅
- Creati `package.json`, le configurazioni di TypeScript, Vite ed ESLint, `.gitignore`, `index.html`, il primo favicon e l'avvio React. Inizializzato git.
- **Test:** controllo tipi ✅ · lint ✅ · build ✅ (219 kB, 68 kB compressi) · pagina aperta nel browser integrato, mostra "Trimly" ✅
- **Scivolone:** avevo installato TypeScript 7 (l'ultima versione), ma lo strumento di lint (typescript-eslint) supporta solo fino alla 6.0. ✅ Risolto fissando TypeScript a `~6.0.3`, trovato controllando le dipendenze *prima* di scrivere codice.

### 24/09/2026 — T1.2 Infrastruttura di test ✅
- **Vitest** per i test della logica e **Playwright** per i test nei browser veri, su 4 profili: Chrome desktop, Safari desktop (WebKit), Android (Pixel 7) e iPhone 15.
- I test end-to-end girano sulla **build di produzione**, non su quella di sviluppo, così verifichiamo esattamente ciò che verrà pubblicato.
- Nuovo script `npm run fixtures` (`scripts/make-fixtures.mjs`). Genera le immagini di prova: un motivo 400×300 a 4 quadranti colorati (rosso, verde, blu, giallo) in PNG, JPG, HEIC, TIFF, BMP, GIF, AVIF, WebP e ICO. In più: un PNG con trasparenza, un JPG con rotazione EXIF, due SVG (con e senza dimensioni), un file corrotto e un file che non è un'immagine. I colori dei quadranti permettono ai test di controllare posizione, rotazione e specchiature.
- **Test:** unitari 1/1 ✅ · e2e 4/4 ✅ (l'app si apre su tutti e 4 i profili) · verifica manuale dei formati nel browser integrato: JPG, PNG, WebP, GIF, BMP, AVIF, ICO e SVG si aprono nativamente; il JPG con EXIF viene raddrizzato correttamente (400×300, colori giusti).
- **Scivolone:** dopo aver iniettato l'orientamento EXIF, `sips` (lo strumento immagini di macOS) diceva "nessun orientamento" e sembrava che il file fosse sbagliato. ✅ Non lo era: i byte sono conformi e il browser applica correttamente la rotazione. È solo `sips` che non legge quel campo in questo caso.
- **Nota:** come previsto, Chromium non apre da solo **HEIC** e **TIFF**. Conferma che servono i decoder aggiuntivi (T3.3).

### 24/09/2026 — T2.1 Design system ✅
- `src/styles/tokens.css`: colori, raggi, ombre e font del tema chiaro. Quelli del tema scuro si applicano se il sistema è scuro (a meno che tu non abbia forzato il chiaro) oppure se forzi lo scuro.
- Uno script minuscolo in `index.html` applica il tema salvato *prima* che la pagina si disegni, così non c'è il "lampo" di colore sbagliato all'avvio.
- Logica del pulsante tema (`src/lib/theme.ts`): inverte il tema visibile. Se il risultato coincide con quello del dispositivo, l'app torna a seguire il dispositivo, così non resti "bloccato" su una scelta manuale.
- Componenti base: Button, IconButton, Segmented (con frecce da tastiera), Chip, Slider (doppio clic o Esc per azzerare), Swatches (colori + selettore libero), NumberField (conferma con Invio), Toast.
- Pagina "galleria" solo per lo sviluppo (`/?gallery`), per controllare a colpo d'occhio tutti i componenti.
- **Test:** tipi ✅ · lint ✅ · unitari 3/3 ✅ (logica del tema) · verifica visiva nel browser integrato, tema scuro e chiaro ✅
- **Scivolone:** i messaggi toast risultavano invisibili (opacità 0) nel browser integrato. ✅ Non è un bug dell'app: il pannello del browser era nascosto, e i browser mettono in pausa le animazioni delle pagine non visibili. Il toast c'è ed è posizionato correttamente; lo verificheranno anche i test automatici.

### 24/09/2026 — T2.2 Traduzioni it/en ✅
- Dizionari `src/i18n/en.ts` e `src/i18n/it.ts` con tutti i testi dell'app già previsti (~100 voci): pannelli, errori, suggerimenti, etichette per l'accessibilità.
- **Garanzia strutturale:** il dizionario italiano è "tipizzato" su quello inglese, quindi se manca una traduzione il progetto non compila nemmeno.
- Lingua scelta in automatico dalle preferenze del browser: vince la prima lingua supportata nell'ordine di preferenza, altrimenti inglese. La scelta manuale viene ricordata. Aggiornati anche `lang`, titolo e descrizione della pagina.
- Il selettore IT/EN va nell'header (T2.3).
- **Test:** unitari 12/12 ✅. Stesse chiavi in entrambe le lingue, nessun testo vuoto, stessi segnaposto (es. `{name}`), rilevamento lingua, sostituzione dei segnaposto.
- **Scivolone (piccolo):** gli apostrofi erano misti, un po' dritti (') e un po' tipografici (’). ✅ Uniformati a ’ in entrambe le lingue.

### 24/09/2026 — T2.3 Shell dell'app ✅
- **Header:** logo (clic = ricomincia), "Nuova immagine", selettore IT/EN, pulsante tema, più uno spazio per un'azione extra (su mobile ci andrà "Scarica").
- **Schermata iniziale:** scheda centrale con il pulsante principale, suggerimenti per trascinare o incollare (il suggerimento ⌘V si nasconde sui dispositivi touch), le tre caratteristiche chiave, i formati supportati, la nota sulla privacy e "Prova con un'immagine di esempio". Mostra ⌘ su Mac/iPhone e Ctrl su Windows.
- **Layout dell'editor** (`EditorLayout`): su desktop (≥ 900 px) l'area immagine è a sinistra e il pannello laterale a destra, con "Scarica" sempre in fondo. Su mobile l'area immagine sta in alto, sotto c'è il pannello dello strumento scelto e in fondo la barra a schede (Forma · Ruota · Esporta).
- **Test:** tipi ✅ · lint ✅ · unitari 12/12 ✅ · **e2e 16/16 ✅** su Chrome, Safari, Android e iPhone. Coprono la lingua rilevata dal browser, il cambio lingua che resta dopo il ricaricamento, il tema che segue il sistema, il toggle senza "lampo" al ricaricamento, il ritorno automatico a "segui il sistema" e le azioni della schermata iniziale. Screenshot desktop e mobile controllati nel browser integrato.
- **Scivolone (piccolo):** il suggerimento diceva "oppure trascinala qui · oppure incollala con ⌘V", con due "oppure" di fila. ✅ Accorciato in "⌘V per incollare".
- ⚠️ **Aperto:** su telefono l'header è piuttosto pieno (logo + IT/EN + tema + Scarica). Su schermi molto stretti (320 px) potrebbe non starci. Da rifinire nella T7.3.

### 24/09/2026 — T3.1 Caricamento ✅
- Quattro modi per aprire un'immagine: pulsante (selettore file), **trascinamento** in qualsiasi punto della finestra (con overlay "Rilascia per aprire"), **incolla** (⌘V / Ctrl+V, ignorato mentre scrivi in un campo di testo) e **immagine di esempio**. L'esempio è un paesaggio vettoriale disegnato da me (`src/assets/sample.svg`), quindi niente problemi di licenza.
- Se arrivano più file si apre il primo che sembra un'immagine, con un avviso. Se durante un caricamento lento ne parte un altro, vince l'ultimo e il precedente viene scartato e liberato dalla memoria.
- Messaggi d'errore chiari per: file che non è un'immagine, file danneggiato, file vuoto, formato non supportato dal browser, decoder non scaricabile offline.
- "Nuova immagine" nell'header sostituisce l'immagine; il logo riporta alla schermata iniziale.

### 24/09/2026 — T3.2 Decodifica formati nativi ✅
- Il formato si riconosce **dai byte**, non dall'estensione (`src/lib/formats.ts`). Un JPG rinominato in .png si apre comunque, e un .txt rinominato in .jpg viene rifiutato con il messaggio giusto.
- L'orientamento EXIF delle foto viene applicato: una foto verticale scattata col telefono non appare "coricata".
- **SVG:** si legge la dimensione (width/height in px, pt, cm, mm, in… oppure viewBox) e si disegna a 2048 px sul lato lungo, perché un vettoriale non ha una dimensione in pixel propria.
- GIF, PNG, WebP e AVIF animati vengono "congelati" al primo fotogramma, così quello che vedi è sempre quello che scarichi.
- Trasparenza rilevata realmente (non solo dal formato), su una copia piccola dell'immagine. Servirà a scegliere in automatico PNG come formato di uscita.
- Per fluidità, l'app prepara una copia ridotta (max 2560 px) da mostrare a schermo; l'originale resta intatto per l'esportazione.

### 24/09/2026 — T3.3 Decoder HEIC e TIFF ✅
- **HEIC** (foto iPhone): Safari li apre da solo; negli altri browser si scarica al volo `heic-to`, nella variante "csp" che non usa `eval` ed è compatibile con header di sicurezza severi. **TIFF:** `utif2`, stesso meccanismo.
- Verificato nel build: il bundle principale è di 262 kB. Il decoder HEIC (3 MB) e quello TIFF (105 kB) sono file separati, scaricati **solo** se apri quei formati.

### 24/09/2026 — T3.4 Immagini enormi ✅
- `src/lib/limits.ts`: su iPhone e iPad un canvas non può superare 16,7 megapixel (oltre, l'immagine esce **bianca** senza errori). Su desktop il limite di sicurezza è 64 MP. Le immagini più grandi vengono ridotte al caricamento, mantenendo le proporzioni e mostrando un avviso.
- La riduzione è "a gradini" (dimezzamenti successivi) per una qualità migliore rispetto a un'unica riduzione brusca.

**Test della Fase 3:** unitari 39/39 ✅ (riconoscimento formati su file veri, lettura delle dimensioni SVG, limiti) · **e2e 104/104 ✅** su 4 browser. Per ogni formato si verifica che dimensione, orientamento e **colori dei 4 quadranti** siano quelli attesi. Coperti anche errori, trascinamento, incolla, più file insieme, esempio, sostituzione e ritorno all'inizio, e la foto da 18,75 MP (ridotta su iPhone, intera su desktop).

**Scivoloni della Fase 3:**
- ✅ Un carattere invisibile (BOM) era finito letteralmente dentro il codice al posto della sua sequenza di escape, e il lint l'ha segnalato. Rimosso: il decodificatore di testo lo elimina già da solo.
- ✅ Il build segnalava un file "troppo grande" (>500 kB): è il decoder HEIC, caricato solo su richiesta. Soglia alzata con un commento che spiega il motivo.
- ✅ Errore di tipi con TypeScript 6 sul buffer dei pixel TIFF. Risolto con un cast, senza copiare i dati.
- ℹ️ Le 4 task della Fase 3 sono finite in un unico punto di ripristino, perché il codice di caricamento, decodifica e limiti è intrecciato e l'ho testato come un blocco unico.
- ⚠️ **Aperto (minore):** i TIFF con un orientamento salvato nei metadati (raro, tipico di alcuni scanner) non vengono ruotati automaticamente negli altri browser. Safari li gestisce da solo.

### 24/09/2026 — T4.1 Motore geometrico ✅
- `src/lib/geometry.ts`: funzioni pure, senza interfaccia, per contenimento nell'immagine ruotata, spostamento (con "scivolamento" lungo i bordi se trascini in diagonale contro un lato), ridimensionamento libero o a proporzioni bloccate (maniglie d'angolo e di lato, dimensione minima, nessun "ribaltamento"), rettangolo più grande possibile per una proporzione, rotazione di 90°, specchiatura e adattamento durante il raddrizzamento.
- **Scelte di UX codificate nella matematica:**
  - Cambiando proporzione si mantiene l'**inquadratura**: stesso centro e stessa "quota" del ritaglio massimo. Un ritaglio a tutta immagine resta a tutta immagine (1:1 → 16:9 → 9:16 → 16:9 senza rimpicciolirsi); un ritaglio piccolo sul viso resta sul viso.
  - Se un ritaglio non ci sta più, prima si **sposta** verso il centro e solo se serve si **rimpicciolisce**.
  - Seni e coseni sono esatti a 0°/90°/180°/270°, così il ritaglio può appoggiarsi esattamente ai bordi.
- **Test:** 26 test unitari mirati ✅ più uno **stress test temporaneo di 52.500 operazioni casuali**: 5 semi × 7 angoli, inclusi 44,99° e −0,01°, × 3 proporzioni su un'immagine da 12 MP. Nessun ritaglio è mai uscito dall'immagine e le proporzioni non sono mai cambiate ✅
- **Scivoloni:**
  - ✅ Con la prima tolleranza (1 milionesimo di px) i ritagli potevano sforare il bordo di quella quantità. Invisibile, ma impreciso: tolleranza ridotta.
  - ✅ **Bug vero**, trovato dal test casuale: un ritaglio appoggiato al bordo di un'immagine inclinata, ricalcolato, si spostava di 3×10⁻¹⁵ px e finiva "fuori". Risolto con due tolleranze: la ricerca mira *strettamente dentro*, la validazione accetta un margine un po' più largo. In più c'è una rete di sicurezza: se un risultato non è valido si tiene il ritaglio precedente.
  - ✅ Per il debug ho lanciato Vitest con la radice del disco come cartella base, e ha iniziato a scandire tutto il filesystem. L'ho fermato e ho rifatto il debug dentro il progetto, con un file temporaneo poi cancellato.

### 24/09/2026 — T4.2 Stato dell'editor e annulla/ripeti ✅
- `src/state/editor.ts`: un unico "reducer" descrive tutte le modifiche possibili: forma, proporzione (preset, originale, personalizzata, inversione), rotazione, specchiatura, raddrizzamento, arrotondamento, sfondo, bordo, ripristino.
- **Annulla/ripeti intelligente:** un trascinamento intero o un movimento dello slider vale **un solo passo** di annullamento, non centinaia; le interazioni che non cambiano nulla non vengono registrate; la cronologia tiene al massimo 100 passi e anche "Ripristina" si può annullare.
- **Raddrizzamento reversibile:** l'app ricorda il ritaglio prima di iniziare a raddrizzare, così tornando a 0° torna esattamente com'era.
- "Arrotondato" parte come **quadrato** (come avevi chiesto: "quadrato arrotondato"), a meno che tu non abbia già scelto un'altra proporzione. Il cerchio è sempre 1:1.
- Ruotando di 90° anche la proporzione ruota (16:9 → 9:16), così il ritaglio copre sempre la stessa porzione di foto.
- **Test:** 19 test unitari ✅ (84 in totale nel progetto) · tipi ✅ · lint ✅
- Scivoloni: nessuno.
