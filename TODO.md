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
- [ ] **T1.2** Infrastruttura test: Vitest + Playwright, generatore di immagini di prova (JPG/PNG/HEIC/TIFF/EXIF ruotato…), smoke test

### Fase 2 — Fondamenta dell'interfaccia
- [ ] **T2.1** Design system: tokens CSS, tema chiaro/scuro + interruttore, font Inter, componenti base (bottone, segmented control, slider, chip, toast)
- [ ] **T2.2** Traduzioni it/en con rilevamento automatico e selettore (test: nessuna chiave mancante)
- [ ] **T2.3** Shell dell'app: header, area di lavoro, pannello laterale (desktop) / pannello a schede (mobile)

### Fase 3 — Caricamento immagini
- [ ] **T3.1** Caricamento: scelta file, trascinamento (con overlay), incolla dagli appunti, immagine di esempio; errori chiari
- [ ] **T3.2** Decodifica formati nativi + riconoscimento formato dai byte + orientamento EXIF + SVG senza dimensioni
- [ ] **T3.3** Decoder HEIC/HEIF e TIFF caricati on-demand
- [ ] **T3.4** Protezione per immagini enormi (limiti canvas su iPhone, ecc.)

### Fase 4 — Motore di ritaglio (logica pura)
- [ ] **T4.1** Modulo geometria: contenimento, sposta, ridimensiona (libero/proporzionato), massimo rettangolo inscritto, rotazione 90°, specchia, raddrizza + test unitari
- [ ] **T4.2** Stato dell'editor (reducer) + annulla/ripeti + test unitari

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
