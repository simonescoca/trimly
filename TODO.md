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
- [x] **T5.1** Stage: immagine trasformata, adattamento allo spazio, zoom (rotella, pizzico, pulsanti), spostamento vista
- [x] **T5.2** Riquadro di ritaglio: sposta e ridimensiona con maniglie, oscuramento esterno, griglia dei terzi, dimensioni in px, tastiera
- [x] **T5.3** Forme: rettangolo, arrotondato (con slider), cerchio
- [x] **T5.4** Proporzioni: libera, originale, 1:1, 4:5, 3:2, 16:9…, inversione verticale/orizzontale, personalizzata
- [x] **T5.5** Rotazione 90°, raddrizzamento, specchia, sempre rispettando i vincoli

### Fase 6 — Esportazione
- [x] **T6.1** Motore di rendering: ritaglio + trasformazioni + maschera forma + sfondo + bordo + ridimensionamento di qualità
- [x] **T6.2** Impostazioni di uscita: formato (scelta automatica intelligente), qualità, dimensione in pixel, peso stimato del file
- [x] **T6.3** Scarica · copia negli appunti · condividi (smartphone)
- [x] **T6.4** Anteprima dal vivo del risultato (con scacchiera per la trasparenza)

### Fase 7 — PWA e rifiniture
- [x] **T7.1** PWA: manifest, icone, service worker, test offline
- [x] **T7.2** Accessibilità: tastiera, focus, etichette ARIA, contrasti, riduzione animazioni
- [x] **T7.3** Rifinitura mobile: gesti, safe area iPhone, pannello a schede
- [x] **T7.4** Rifinitura visiva: transizioni, stati vuoti, messaggi, scorciatoie

### Fase 8 — Qualità
- [x] **T8.1** Suite end-to-end completa su Chromium, WebKit (Safari), Firefox e viewport mobile
- [x] **T8.2** Verifica visiva manuale (screenshot desktop/mobile, chiaro/scuro, it/en)
- [x] **T8.3** Prestazioni: peso del bundle, immagini grandi, fluidità del trascinamento

### Fase 9 — Pubblicazione
- [x] **T9.1** Build di produzione + configurazione hosting (header di sicurezza e cache)
- [x] **T9.2** SEO e condivisione: meta tag, immagine di anteprima social, favicon
- [x] **T9.3** `DEPLOY.md`: guida alla pubblicazione passo-passo per non tecnici
- [x] **T9.4** `README.md`

### Fase 10 — Chiusura
- [x] **T10.1** Revisione finale, riepilogo e retrospettiva nel diario

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
- ~~⚠️ **Aperto:** su telefono l'header è piuttosto pieno (logo + IT/EN + tema + Scarica). Su schermi molto stretti (320 px) potrebbe non starci. Da rifinire nella T7.3.~~ ✅ Risolto nella Fase 6 (vedi sotto).

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

### 24/09/2026 — Fase 5: editor interattivo (T5.1 → T5.5) ✅
**T5.1 Stage.** L'immagine è disegnata su un canvas con la **stessa funzione** che userà l'esportazione (`src/lib/render.ts`), così lo schermo mostra esattamente quello che scaricherai. Zoom con rotella o pizzico del trackpad (centrato sul puntatore), **pizzico a due dita** su telefono, pulsanti +/−, "adatta allo schermo" e tasti `+` `−` `0`. Da ingrandita la vista si trascina, ma non si può "perdere" l'immagine fuori dallo schermo. A zoom basso lo schermo usa la copia ridotta (fluida); ingrandendo passa da solo all'originale in piena risoluzione.

**T5.2 Riquadro di ritaglio.** Si sposta trascinandolo o con le frecce (⇧ per passi da 10), e si ridimensiona con 4 maniglie d'angolo a "L" più 4 barrette sui lati. Le aree toccabili sono di 44 px su touch e 28 px con il mouse. L'esterno è oscurato, e durante il trascinamento compaiono la griglia dei terzi e un'etichetta con le dimensioni in pixel. Un trascinamento intero vale un solo passo di annullamento.

**T5.3 Forme.** Rettangolo, arrotondato (con slider "Arrotondamento") e cerchio. Il cerchio ha 4 pomelli *sul* cerchio, a 45°: il trascinamento viene amplificato di ~1,17× così il pomello resta sotto il dito. Scegliendo cerchio o arrotondato compare il pannello "Sfondo e bordo", con l'anteprima del bordo direttamente sul riquadro.

**T5.4 Proporzioni.** Libera, Originale, 1:1, 5:4, 4:3, 3:2, 16:9. Il pulsante di inversione le trasforma in 4:5, 3:4, 2:3, 9:16, e su "Libera" gira il riquadro. "Personalizzata" accetta anche decimali con la virgola (es. 3,5 : 4,5 per le fototessere).

**T5.5 Ruota e specchia.** Pulsanti Sinistra, Destra, Orizzontale e Verticale, più lo slider "Raddrizza" (±45°, passi di 0,1°; doppio clic o Esc per tornare a 0).

**Scorciatoie:** ⌘/Ctrl+Z annulla, ⇧⌘Z / Ctrl+Y ripete.

**Test:** unitari 90/90 ✅ (5 nuovi per la vista) · **e2e 156/156 ✅** (+52 per l'editor, 4 esclusi di proposito). I test coprono: ridimensionamento da angolo e da lato, spostamento con blocco ai bordi, frecce, cerchio, arrotondato, preset, inversione e proporzione personalizzata "3,5 : 4,5". Per rotazione e specchiatura si controllano i **colori dei quadranti** sullo schermo. E ancora: raddrizzamento con ritorno esatto al ritaglio originale, annulla/ripeti da pulsanti e tastiera, ripristina, zoom con rotella e pulsanti, pizzico simulato a due dita, schede su telefono. Controlli visivi nel browser integrato su desktop e mobile.

**Scivoloni della Fase 5:**
- ✅ **Pagina bianca** durante lo sviluppo dopo aver modificato i testi: il ricaricamento a caldo ricreava il "contesto" delle traduzioni e i componenti già montati perdevano il collegamento. Nella versione pubblicata non poteva succedere, ma l'ho risolto alla radice separando il contesto dal provider (`src/i18n/context.ts`).
- ✅ Da qui è emersa una lacuna: **mancava una rete di sicurezza**. Aggiunto un `ErrorBoundary`: se qualcosa si rompe, invece della pagina bianca compare "Ops, qualcosa si è inceppato" con il pulsante Ricarica.
- ✅ Le etichette "Specchia in orizzontale/verticale" andavano su 3 righe nei pulsanti. Ora il testo visibile è breve (Orizzontale/Verticale) e il nome completo resta come suggerimento e per gli screen reader.
- ✅ Su telefono, scegliendo il cerchio il pannello in basso si accorciava, l'area immagine si allungava e l'immagine "saltava". Pannello ad altezza fissa.
- ✅ Su telefono la riga delle proporzioni spingeva fuori schermo il pulsante di inversione: nelle griglie CSS gli elementi non si restringono sotto il loro contenuto. Risolto con `min-width: 0`, e aggiunta una sfumatura a destra che fa capire che la riga scorre.
- ✅ Un mio test sulla vista aveva un'aspettativa sbagliata: il lato che limita era l'altezza, non la larghezza. Corretto il test, il codice era giusto.
- ℹ️ Nel browser integrato, quando il pannello è nascosto, screenshot e transizioni CSS restano "congelati" e più di una volta hanno mostrato uno stato vecchio. Ho imparato a verificare lo stato reale con JavaScript prima di trarre conclusioni.

### 24/09/2026 — Fase 6: esportazione (T6.1 → T6.4) ✅
**T6.1 Motore di rendering** (`src/lib/export.ts`). Ritaglio, rotazione e specchiature; poi la maschera della forma (cerchio o arrotondato); poi lo sfondo colorato, se scelto, e infine il bordo, disegnato *all'interno* del bordo della forma e concentrico anche negli angoli arrotondati. Quando l'immagine va rimpicciolita molto, si disegna prima più grande e poi si riduce a gradini, per un risultato più nitido. I bordi del cerchio sono antialiasati, senza scalettature.

**T6.2 Impostazioni.**
- **Formato consigliato automatico:** PNG se c'è trasparenza (cerchio o arrotondato senza sfondo, oppure un PNG trasparente); JPG per le foto; PNG per la grafica (loghi, screenshot, icone); WebP se l'originale era WebP. Finché non scegli tu, il consiglio segue le modifiche (es. passando al cerchio diventa PNG).
- WebP compare solo se il browser sa davvero crearlo: Safari, ad esempio, lo "finge" restituendo un PNG.
- Qualità regolabile per JPG e WebP. Dimensione "Originale" oppure "Personalizzata", con larghezza e altezza collegate e misure rapide 512 / 1080 / 2048 sul lato lungo.
- Avvisi chiari: ingrandimento oltre l'originale, JPG senza trasparenza (le parti trasparenti diventano bianche), limite del dispositivo.
- **Peso del file stimato** ("≈ 548 KB"), calcolato quando smetti di trascinare. Il file così preparato viene riusato quando premi Scarica, che quindi è istantaneo.

**T6.3 Azioni.** **Scarica** (nome file: `nomeoriginale-cropped.png`), **Copia immagine** negli appunti e **Condividi**, che su telefono apre il menu di sistema e ad esempio su iPhone permette "Salva immagine" nelle Foto. Copia e Condividi compaiono solo dove il browser li supporta davvero. Su telefono "Scarica" sta nell'header, sempre a portata di pollice.

**T6.4 Anteprima dal vivo.** Miniatura del risultato esatto, su scacchiera per vedere la trasparenza, con dimensioni, formato e peso.

**Test:** unitari 98/98 ✅ · **e2e 197/197 ✅** (7 esclusi di proposito). I nuovi test **scaricano davvero il file** e lo decodificano, poi controllano dimensioni e pixel:
- immagine intera identica, con i bordi pienamente opachi;
- cerchio con angoli trasparenti (alfa 0) e centro opaco coi colori giusti;
- cerchio su sfondo bianco in JPG, con bordo nero di 30 px nel punto previsto;
- angoli trasparenti dell'arrotondato;
- rotazione + specchiatura nel file;
- **ritaglio raddrizzato senza angoli vuoti**;
- dimensione personalizzata 100×75 e misura rapida 1080, con avviso di ingrandimento;
- anteprima corretta, JPG di default per le foto, copia negli appunti (su Chrome).

**Scivoloni della Fase 6:**
- ✅ Il mio helper di test confrontava 4 canali (RGBA) con 3 attesi (RGB), quindi falliva anche con colori identici: "atteso 255,0,0, ottenuto 255,0,0,255". Bug del test, non dell'app.
- ✅ **Regressione vera, scovata dai test:** aggiungendo l'anteprima in cima ai pannelli, su telefono la prima scheda era diventata "Esporta" invece di "Forma", perché l'ordine delle schede seguiva quello dei pannelli. Ora l'ordine delle schede è esplicito.
- ✅ **Chiuso il problema aperto nella T2.3:** a 320 px il pulsante "Scarica" usciva dallo schermo di 34 px. Su telefoni stretti, quando c'è "Scarica", si mostra solo il logo senza la scritta. Aggiunto un test che verifica che a 320 px non sbordi nulla.
- ✅ La prima correzione non funzionava: i CSS Modules avevano "rinominato" anche l'ID dello slot (`#header-slot` → `#_header-slot_eygry_1`). Risolto con `:global(...)`. L'ho capito leggendo le regole CSS effettive nel browser.
- ✅ Il lint ha bloccato uno `setState` dentro un effetto, che causa render a cascata: lo slot dell'header ora si legge all'avvio dell'editor.

### 24/09/2026 — T7.1 PWA (installabile + offline) ✅
- Icone generate dal logo (`npm run icons`): 64/192/512 px, "maskable" per Android (fondo pieno, perché il sistema ritaglia la forma da sé), apple-touch-icon per iPhone (fondo pieno, altrimenti iOS riempirebbe di nero gli angoli trasparenti) e favicon.ico. Le ho guardate una per una.
- Manifest: nome, colori, modalità "standalone" (si apre come un'app, senza barra del browser). Con l'app installata su computer (Chrome/Edge) si può fare **"Apri con → Trimly"** su un'immagine (`file_handlers` + `launchQueue`).
- Service worker che memorizza **tutta l'app, decoder HEIC compreso** (3,57 MB in totale). Dopo la prima visita funziona senza internet, anche con le foto dell'iPhone. Gli aggiornamenti futuri si installano da soli.
- **Test:** e2e 6/6 ✅ (2 esclusi di proposito). Manifest e tutte le icone raggiungibili su 4 browser. Su Chrome desktop e Android: **si spegne la rete, si ricarica la pagina, l'app si apre e decodifica un HEIC** prendendo il decoder dalla cache offline.
- Verificato che la pagina "galleria" di sviluppo non finisce nella versione pubblicabile.
- **Scivoloni:** nessuno.
- ℹ️ Idea per il futuro, non richiesta: su Android si potrebbe aggiungere "Condividi → Trimly" dalla Galleria (Web Share Target), ma servirebbe un service worker scritto a mano.

### 24/09/2026 — T7.2 Accessibilità ✅
- Aggiunto **axe** (lo standard di fatto per le verifiche automatiche WCAG) ai test end-to-end. Controlla schermata iniziale ed editor, in **tema chiaro e scuro**, su desktop e su **ogni scheda** mobile, anche con gli avvisi dell'esportazione visibili. Criteri: WCAG 2.0, 2.1 e 2.2, livelli A e AA.
- **Problemi trovati e corretti:**
  - **Contrasto insufficiente** del grigio più chiaro (`--text-3`), usato per suggerimenti e titoli delle sezioni: era sotto 4,5:1. Ora #6F6F7A nel tema chiaro e #8E8E99 in quello scuro, entrambi sopra la soglia AA. Aggiornato anche `docs/DESIGN.md`.
  - **Controllo interattivo annidato:** il pallino "scegli un colore" era un "radio" con dentro un campo colore, e gli screen reader lo annunciano in modo confuso. Ora il controllo è solo il campo colore nativo, con la sua etichetta; il cerchio intorno è solo grafica.
- **Nuovo:** ridimensionamento **da tastiera** con Alt + frecce (⇧ per passi da 10), l'alternativa alle maniglie per chi non usa mouse o touch. Annunciato nell'etichetta del riquadro.
- Già presenti dalle fasi precedenti: tutti i pulsanti-icona hanno un nome leggibile, il focus è visibile, i messaggi sono annunciati (`aria-live`), le schede usano `tablist`/`tab`, gli slider sono veri slider, le animazioni si spengono con "riduci movimento" e c'è l'attributo `lang` della pagina.
- **Test:** unitari 98/98 ✅ · e2e accessibilità 8/8 ✅ · e2e editor con il nuovo test Alt + frecce ✅ (su tutti e 4 i browser).
- **Scivolone (mio, nel test):** su telefono il pulsante "Colore" sta nella scheda "Stile", e il test lo cercava senza aprirla, andando in timeout. Corretto il test.

### 24/09/2026 — T7.3 Rifinitura mobile ✅
- **"Nuova immagine" su telefono:** sotto i 520 px diventa un pulsante "+" compatto invece di sparire. Per fargli spazio, nell'editor sotto i 400 px il selettore IT/EN si nasconde (resta nella schermata iniziale).
- **Niente zoom involontario su iPhone:** Safari ingrandisce la pagina quando tocchi un campo con testo sotto i 16 px. Sui dispositivi touch ora i campi sono a 16 px.
- **Niente ritardo del doppio tocco** sui pulsanti (`touch-action: manipulation`).
- **Telefono in orizzontale:** con il layout a schede l'area immagine sarebbe stata alta circa 95 px. Ora in orizzontale si usa il pannello laterale, più stretto (272 px), e l'immagine ha più di 300 px di altezza.
- **Notch in orizzontale:** header, barra delle schede e pannello rispettano i margini di sicurezza laterali.
- **Test:** unitari 98/98 ✅ · e2e **223 ✅** (17 esclusi di proposito). Nuovi test:
  - a 320 px c'è il "+" e "Scarica" è visibile senza sbordare;
  - telefono in orizzontale (844×390): pannello laterale, niente schede, immagine alta più di 300 px, niente scroll orizzontale;
  - la barra non copre la maniglia in basso.

**Scivoloni:**
- ✅ **Difetto trovato guardando lo screenshot in orizzontale (e presente anche su desktop):** la barra flottante annulla/zoom copriva la maniglia centrale in basso quando la foto occupa tutta l'altezza (es. foto verticali). Ora l'immagine si inquadra nello spazio *sopra* la barra. Ho aggiunto un test e verificato che **fallisce con il codice vecchio** e passa con quello nuovo, quindi il test protegge davvero da questo errore.
- ✅ Dopo lo spostamento dell'inquadratura, l'helper che nei test campiona i colori "attorno al centro del canvas" non era più allineato. Ora usa il centro del riquadro di ritaglio.

### 24/09/2026 — T7.4 Rifinitura visiva ✅
- Se apri un'altra immagine mentre sei nell'editor, compare in alto una pillola "Apertura dell'immagine…" / "Conversione immagine HEIC…". Prima non si vedeva nulla finché il caricamento non finiva.
- Nella schermata iniziale **tutta la scheda** è cliccabile, non solo il pulsante: un bersaglio grande, facile anche col pollice.
- I suggerimenti dei pulsanti mostrano le scorciatoie, es. "Annulla (⌘Z)" su Mac e "Annulla (Ctrl+Z)" su Windows.
- Leggera dissolvenza all'apertura dell'editor (disattivata con "riduci movimento").
- Controllo visivo completo in tema scuro, schermata iniziale ed editor con cerchio su sfondo bianco: tutto leggibile e coerente.
- **Test:** unitari 98/98 ✅ · e2e 223 ✅ (17 esclusi di proposito). *(Nella T7.3 avevo scritto per errore 224: corretto.)*
- **Scivoloni:** nessuno.

### 24/09/2026 — T8.1 Suite completa su 5 browser ✅
- Aggiunto **Firefox**. Ora ogni test gira su Chrome, Safari (WebKit), Firefox, Android (Pixel 7) e iPhone 15.
- **Risultato: 275 superati, 25 esclusi di proposito, 0 falliti.** Gli esclusi sono casi che hanno senso solo in certi ambienti: rotella del mouse su telefono, schede su desktop, permessi degli appunti solo su Chrome desktop, test offline solo su Chromium, audit di accessibilità eseguito su Chromium, incolla simulato in Firefox.
- **Scivoloni emersi con Firefox:**
  - ✅ Un test trascinava il mouse fino a 2000 px, **fuori dalla finestra**. Firefox non riporta i movimenti oltre il bordo, a differenza di Chrome e Safari, quindi il riquadro si fermava prima. Era un test irrealistico, non un bug: ora il trascinamento arriva all'angolo dell'area immagine.
  - ⚠️ **Parzialmente verificato:** in Firefox un "incolla" simulato da script arriva **senza file**, perché Firefox protegge gli appunti. Quindi l'incolla (⌘V) non è testato automaticamente su Firefox. L'app usa lo standard supportato da Firefox e ho aggiunto una via di riserva (`clipboardData.files`). Va comunque provato a mano: ⌘V con un'immagine copiata, in Firefox.

### 24/09/2026 — T8.2 Verifica visiva ✅
- Guardate con screenshot tutte le combinazioni principali: desktop chiaro e scuro; telefono verticale a 375 e 320 px; telefono orizzontale; italiano e inglese; tutte e tre le forme; schede Forma, Stile, Ruota, Esporta.
- **Difetto trovato solo guardando (nessun test lo copriva):** ✅ su telefono **l'anteprima era tagliata in basso**. Il riquadro è alto 132 px, ma l'anteprima veniva disegnata sempre a 160 px con misure fisse. Ora si adatta al riquadro mantenendo le proporzioni. Aggiunto un test che verifica che l'anteprima stia tutta nel riquadro, su tutti i browser.

### 24/09/2026 — T8.3 Prestazioni ✅
- Nuovo test di prestazioni (`e2e/perf.spec.ts`) con la foto da 18,75 MP (5000×3750). Tetti volutamente larghi, pensati per scoprire peggioramenti e non per misurare la velocità del computer.

| Operazione | Chrome | Safari | Tetto |
|---|---|---|---|
| Apertura | 138 ms | 155 ms | < 3 s |
| Trascinamento del ritaglio (per movimento) | 16,6 ms* | 3,9 ms | < 40 ms |
| Raddrizzamento (per passo, ridisegna tutto) | 7,1 ms | 6,4 ms | < 80 ms |
| Esportazione JPG | 99 ms | 126 ms | < 5 s |

\* Chrome sincronizza ogni movimento con lo schermo: 16,6 ms corrispondono a 60 fotogrammi al secondo, cioè fluido.

- Perché è veloce: spostare il ritaglio muove solo un riquadro HTML e l'immagine **non** viene ridisegnata; a schermo si usa la copia ridotta; il file da scaricare è già pronto dalla stima del peso.
- **Peso dell'app:** codice principale 301 kB (≈97 kB compressi, quasi tutto React). Decoder HEIC (3 MB) e TIFF (105 kB) si scaricano solo se servono. Dalla cache offline ho **tolto le varianti del font per cirillico, greco e vietnamita**, inutili in italiano e inglese: da 30 a 25 file (3.570 → 3.490 KB).
- **Test finale Fase 8:** unitari 98/98 ✅ · **e2e 277 superati, 28 esclusi di proposito, 0 falliti**, su 5 browser.
- **Scivoloni:** solo l'anteprima tagliata descritta sopra (T8.2), già risolta.

### 24/09/2026 — T9.1 Build di produzione e configurazione hosting ✅
- `npm run build` produce la cartella **`dist/`**, pronta da pubblicare.
- **Header di sicurezza** (`hosting.config.ts`, scritti in `dist/_headers`, un file che Netlify e Cloudflare Pages leggono da soli):
  - **Content Security Policy severa:** il browser esegue solo codice che arriva dal sito stesso. Niente script esterni, niente `eval` (è ammesso solo WebAssembly, per il decoder HEIC), niente stili "inline", nessun inserimento del sito in altre pagine (anti-clickjacking);
  - più `nosniff`, `no-referrer` e il blocco di fotocamera, microfono e geolocalizzazione, che l'app non usa.
- **Cache:** i file con nome "firmato" (`/assets/*`) restano in cache un anno; pagina, service worker e manifest si ricontrollano sempre, così gli aggiornamenti arrivano subito.
- La **stessa configurazione vale per l'anteprima locale**: tutti i test girano con le regole del sito pubblicato.
- `netlify.toml` (per la pubblicazione collegata a GitHub) e `robots.txt`.
- Per rispettare la CSP, lo script del tema è passato da "inline" a file (`public/theme-init.js`).
- **Test:** nuovo test di sicurezza su 5 browser. Percorso completo (esempio, cerchio, HEIC con WebAssembly, TIFF, download) registrando **ogni violazione della CSP: zero**. Suite completa due volte di fila: **282 superati, 28 esclusi di proposito, 0 falliti**.

**Scivoloni:**
- ✅ Avevo messo `'unsafe-inline'` per gli stili "per sicurezza"; ho provato a toglierlo, i test sono passati, e la policy è ora più severa.
- ✅ **Timeout casuali su Firefox** (30 s, su test sempre diversi, perfino il caricamento della pagina) comparsi con i nuovi header. Causa: l'header `Cross-Origin-Opener-Policy`, che su Firefox fa cambiare processo alla pagina e confonde lo strumento di test. L'ho **rimosso**: per questa app il beneficio era minimo, perché non apre finestre verso altri siti e non gestisce dati sensibili. Firefox è tornato stabile e più veloce (20 s invece di 40–47 s).
- ✅ **Test instabile** sull'anteprima: leggeva i pixel prima che l'anteprima si ridisegnasse al fotogramma successivo. Ora attende. Verificato con 60 ripetizioni consecutive, tutte superate.
- ✅ Vite avvisava di un import senza estensione nel file di configurazione: corretto.

### 24/09/2026 — T9.2 SEO e anteprima social ✅
- **Immagine di anteprima** per quando qualcuno condivide il link (WhatsApp, Telegram, social, email): `public/og-image.jpg`, 1200×630, generata da `npm run og-image` con logo, slogan, tre "pillole" (Private · Free · Works offline) e il paesaggio di esempio ritagliato a cerchio e a quadrato arrotondato.
- Meta tag Open Graph e Twitter, `robots.txt`, e un messaggio `<noscript>` in italiano e inglese.
- **Indirizzo completo automatico:** i social vogliono l'URL intero dell'immagine. Durante il build si usa l'indirizzo del sito se è noto: su Netlify arriva da solo, altrimenti si imposta `SITE_URL`. Verificato: con l'indirizzo compaiono anche `canonical` e `og:url`; senza, restano i percorsi relativi.
- **Test:** nuovo test su 5 browser. Controlla i meta tag e che l'immagine sia raggiungibile, sia un JPG e pesi **meno di 300 KB**.
- **Scivoloni:**
  - ✅ La prima versione dell'immagine era un PNG da **412 KB**, oltre i ~300 KB oltre cui WhatsApp tende a non mostrare l'anteprima. Rifatta in JPG: **65 KB**, senza differenze visibili.
  - ✅ Il lint non riconosceva `document` nello script dell'immagine: è codice eseguito dentro il browser. Dichiarato con un commento.

### 24/09/2026 — T9.3 Guida alla pubblicazione ✅
- `DEPLOY.md`, in italiano e senza gergo:
  - **Strada A:** trascina la cartella `dist` su Netlify Drop, 10 minuti;
  - **Strada B:** GitHub + Netlify, con aggiornamenti automatici;
  - alternative (Cloudflare Pages, GitHub Pages) e dominio personalizzato;
  - checklist dopo la pubblicazione: installazione su iPhone e Android, prova offline, anteprima su WhatsApp, incolla su Firefox da provare a mano;
  - tabella "se qualcosa non va" e promemoria dei comandi.
- **Licenze:** controllando le librerie ho scoperto che il decoder HEIC (`heic-to` / libheif) è **LGPL-3.0**. Chi ridistribuisce il programma deve includere l'avviso di licenza e indicare dove trovare il codice sorgente. Ora il sito pubblica `third-party-licenses.txt`, generato da `npm run licenses` e rigenerato a ogni build, con le licenze di tutto il codice che arriva nel browser. Nella schermata iniziale c'è un piccolo link **"Licenze open source"**. Il decoder resta un file separato e non modificato, come richiede la LGPL. *(Non sono un avvocato: per un uso commerciale importante conviene un parere legale.)*

### 24/09/2026 — T9.4 README ✅
- `README.md` in inglese, con un riassunto anche in italiano: cosa fa l'app, avvio rapido, comandi, come funziona dentro (motore geometrico, stato, rendering condiviso, decodifica), struttura delle cartelle, licenze.
- **Test finale Fase 9:** unitari 98/98 ✅ · **e2e 292 superati, 28 esclusi di proposito, 0 falliti** (5 browser). In più c'è il test sul link alle licenze.
- **Scivolone (nella guida):** avevo scritto che il decoder HEIC si scarica "la prima volta che apri un HEIC". In realtà il service worker lo scarica in background **alla prima visita**. Frase corretta.

### 24/09/2026 — T10.1 Revisione finale e retrospettiva ✅
**Ultimi controlli**
- `npm audit`: **0 vulnerabilità** note, né nelle librerie dell'app né in quelle di sviluppo.
- Nuovo test di regressione "**una sessione intera senza errori**": esempio → cerchio → rotazione → raddrizzamento → cambio immagine (HEIC) a metà modifica → ritorno all'inizio → di nuovo esempio → download. Fallisce se compare anche un solo errore in console. Superato su tutti e 5 i browser.
- **Verifica finale:** unitari **98/98** ✅ · end-to-end **297 superati, 28 esclusi di proposito, 0 falliti** su Chrome, Safari, Firefox, Android e iPhone.

**Il progetto in numeri**
| | |
|---|---|
| Punti di ripristino (commit git) | 21 |
| Codice dell'app | ~3.600 righe TypeScript + ~1.600 righe CSS |
| Test | ~750 righe unitari + ~900 righe end-to-end |
| Peso per chi visita | 97 kB compressi di codice principale (+ decoder HEIC/TIFF solo se servono) |
| Browser verificati automaticamente | 5 (Chrome, Safari, Firefox, Android, iPhone) |

**Retrospettiva: cosa ha funzionato**
- Scrivere il **motore geometrico come matematica pura**, testata a parte (incluse 52.500 operazioni casuali), ha reso l'interfaccia facile: i bug geometrici sono stati trovati prima di arrivare a schermo.
- Una **sola funzione di disegno** per schermo ed esportazione: quello che vedi è davvero quello che scarichi. I test lo verificano **decodificando i file scaricati pixel per pixel**.
- **Immagini di prova "parlanti"** (4 quadranti colorati): ogni errore di rotazione, specchiatura o orientamento EXIF diventa un colore sbagliato, facile da individuare.
- I test hanno scovato **regressioni vere** che a occhio mi sarebbero sfuggite: la prima scheda sbagliata su telefono, la barra che copriva una maniglia, l'anteprima tagliata, i blocchi su Firefox.

**Retrospettiva: cosa migliorerei**
- Alcuni problemi di layout mobile li ho trovati solo guardando gli screenshot. Avrei dovuto scrivere prima i test "niente sborda / niente si sovrappone".
- Due volte ho scritto test con aspettative sbagliate (una misura, un conteggio nel diario). Li ho corretti e segnalati, ma serve più attenzione.

**⚠️ Punti aperti (onestamente)**
1. **Dispositivi fisici:** tutti i test su telefono usano *emulatori* di Android e iPhone. Dopo la pubblicazione conviene una prova su un iPhone e un Android veri, soprattutto con foto HEIC scattate dal telefono, foto da 48 MP e il pulsante **Condividi**. Quest'ultimo richiede il menu di sistema e non è testabile in automatico.
2. **Incolla (⌘V) su Firefox:** non verificabile in automatico (vedi T8.1); da provare a mano.
3. **TIFF con orientamento nei metadati** (raro): ruotato correttamente solo in Safari.
4. **Licenza LGPL del decoder HEIC:** gestita secondo la prassi (file separato e non modificato, avviso, link al sorgente). Per un uso commerciale importante conviene un parere legale.

**💡 Idee per il futuro (non richieste)**
- "Condividi → Trimly" dalla Galleria su Android (Web Share Target).
- Elaborazione di più immagini alla volta ed ellisse (escluse di comune accordo all'inizio).
- Altre lingue: la struttura delle traduzioni è pronta.

---

## ✅ Sviluppo concluso — 24/09/2026
Tutte le 35 task del piano sono completate. Il prossimo passo è la pubblicazione: segui **`DEPLOY.md`**.
