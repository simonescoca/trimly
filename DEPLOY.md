# Come pubblicare Trimly

> ✅ **Già pubblicato:** https://trimly-crop.netlify.app · codice: https://github.com/simonescoca/trimly
>
> **Aggiornamenti automatici (attivi dal 24/09/2026):** il progetto Netlify `trimly-crop` è collegato al repository GitHub. **Ogni `git push` sul ramo `main` ricostruisce e ripubblica il sito da solo**, in circa 20 secondi. Non serve più trascinare cartelle.
>
> **Crediti Netlify (piano gratuito: 300 al mese):** ogni pubblicazione costa **15 crediti**, e anche il traffico ne consuma un po'. Per risparmiarli:
> - `netlify.toml` salta il build quando un push tocca solo documenti (`*.md`, `docs/`), test (`e2e/`, `*.test.ts`) o impostazioni dell'editor. Quei push sono gratis;
> - conviene raggruppare più modifiche in un solo push;
> - `npm run e2e:live` verifica il sito online solo su Chrome, perché una corsa su 5 browser consuma circa 10 crediti di traffico.
>
> Il badge "Powered by Netlify" è **disattivato** nelle impostazioni del progetto: il suo script viene bloccato dalla nostra policy di sicurezza e generava errori.

Trimly è un sito "statico": una cartella di file, senza server né database da gestire. Per metterlo online serve solo un servizio di hosting gratuito. Ti consiglio **Netlify**: è gratis, ha HTTPS incluso ed è il più semplice.

Tempo necessario: **10 minuti** la prima volta, **1 minuto** per gli aggiornamenti.

---

## Passo 0 — Prepara la cartella da pubblicare

Apri il Terminale nella cartella del progetto (`img_cropping`) ed esegui questi comandi. Il primo serve solo la prima volta, perché scarica le librerie:

```bash
npm install
```

```bash
npm run build
```

Alla fine trovi una nuova cartella **`dist`** dentro il progetto. **È questa la cartella da pubblicare**, non l'intero progetto.

> In alternativa puoi chiedere a Claude: "prepara la cartella dist di Trimly".

---

## Strada A — Trascina e rilascia (la più semplice)

1. Vai su **https://app.netlify.com/drop**.
2. Crea un account gratuito, con email oppure con Google o GitHub. **Serve**: senza account il sito viene cancellato dopo poco.
3. **Trascina la cartella `dist`** nel riquadro della pagina.
4. In pochi secondi il sito è online, con un indirizzo casuale del tipo `https://jolly-cake-123abc.netlify.app`.
5. Per scegliere un nome più bello: **Site configuration → Change site name** e scrivi ad esempio `trimly`. L'indirizzo diventa `https://trimly.netlify.app`, se è libero.

### Un ritocco per le anteprime su WhatsApp e social
Quando qualcuno condivide il link, i social vogliono l'indirizzo completo dell'immagine di anteprima. Con la Strada A, dopo aver scelto il nome, rifai il build indicando l'indirizzo e ripubblica. Sostituisci l'indirizzo con il tuo:

```bash
SITE_URL=https://trimly.netlify.app npm run build
```

Poi vai in **Deploys** e trascina di nuovo la cartella `dist` (vedi "Aggiornare il sito").

### Aggiornare il sito (Strada A)
1. `npm run build` (con `SITE_URL=…` davanti, come sopra).
2. Su Netlify apri il sito → **Deploys** → trascina la nuova cartella `dist` nel riquadro in fondo alla pagina.

---

## Strada B — Aggiornamenti automatici con GitHub (consigliata a lungo termine)

Con questa strada, ogni volta che il codice cambia, Netlify ricostruisce e ripubblica il sito da solo. L'indirizzo per le anteprime social viene impostato automaticamente.

1. Crea un account gratuito su **https://github.com** e un nuovo repository chiamato `trimly` (può essere privato).
2. Carica il progetto nel repository. Il progetto ha già tutta la cronologia delle versioni salvata con git: puoi chiedere a Claude "carica Trimly sul mio repository GitHub" e dargli l'indirizzo del repository.
3. Su Netlify: **Add new site → Import an existing project → GitHub** → scegli `trimly`.
4. Le impostazioni si compilano da sole grazie al file `netlify.toml` (comando `npm run build`, cartella `dist`). Premi **Deploy**.
5. Cambia il nome del sito come al punto 5 della Strada A.

---

## Alternative equivalenti

- **Cloudflare Pages** (https://pages.cloudflare.com): "Create a project → Direct Upload", poi trascini la cartella `dist`. Legge lo stesso file di sicurezza `_headers`.
- **GitHub Pages**: funziona, ma non supporta gli header di sicurezza del file `_headers`. L'app va lo stesso, solo meno protetta.

---

## Un dominio tutto tuo (facoltativo)

Se vuoi un indirizzo come `www.trimly.it`:
1. Compra il dominio da un registrar (circa 10–15 € l'anno, es. Namecheap, Aruba, Register.it). Controlla prima che il nome sia libero.
2. Su Netlify: **Domain management → Add a domain** e segui le istruzioni per il DNS. Sono pochi valori da copiare nel pannello del registrar.
3. Il certificato HTTPS (il lucchetto) arriva da solo in qualche minuto.
4. Rifai il build con il nuovo indirizzo (`SITE_URL=https://www.trimly.it npm run build`) se usi la Strada A.

---

## Controlli dopo la pubblicazione (5 minuti)

- [ ] Apri il sito dal computer e prova "Prova con un'immagine di esempio" → Cerchio → Scarica.
- [ ] Apri il sito dal telefono e prova con una foto vera.
- [ ] **Installa l'app** sul telefono:
  - **iPhone:** apri il sito in Safari → tasto Condividi → **Aggiungi alla schermata Home**;
  - **Android:** apri il sito in Chrome → menu ⋮ → **Installa app**.
- [ ] Metti il telefono in modalità aereo e riapri l'app: deve funzionare lo stesso.
- [ ] Incolla il link in una chat WhatsApp con te stesso: deve comparire l'anteprima con il logo.
- [ ] Solo su Firefox (non verificato dai test automatici): copia un'immagine e premi ⌘V / Ctrl+V nella pagina.

---

## Se qualcosa non va

| Problema | Soluzione |
|---|---|
| Pagina bianca o "Page not found" | Probabilmente hai trascinato l'intero progetto invece della sola cartella **`dist`**. |
| Dopo un aggiornamento vedo ancora la versione vecchia | È il funzionamento offline: la nuova versione si scarica in background. Chiudi e riapri la pagina. |
| L'anteprima su WhatsApp non compare | Rifai il build con `SITE_URL=…` (Strada A). WhatsApp ricorda le anteprime per un po', quindi prova con un link nuovo, ad esempio aggiungendo `?v=2` in fondo. |
| Le foto HEIC non si aprono offline | Alla prima visita l'app scarica in background tutto ciò che serve offline, decoder HEIC compreso (circa 750 KB compressi). Resta connesso qualche secondo prima di andare offline. |

---

## Per lo sviluppo (promemoria tecnico)

| Comando | A cosa serve |
|---|---|
| `npm run dev` | Avvia l'app in locale su http://localhost:5173 |
| `npm run check` | Controllo dei tipi, lint e test unitari |
| `npm run e2e` | Test end-to-end su 5 browser (la prima volta: `npx playwright install`) |
| `npm run build` | Crea la cartella `dist` da pubblicare |
| `npm run preview` | Mostra la cartella `dist` in locale, con gli stessi header di sicurezza del sito |
| `npm run fixtures` · `npm run icons` · `npm run og-image` · `npm run licenses` | Rigenerano immagini di prova, icone, immagine social e file delle licenze |
