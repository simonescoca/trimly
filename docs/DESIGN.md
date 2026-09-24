# Trimly — Design UI/UX

## Principi
1. **Un'azione principale per schermata.** Prima: "Scegli un'immagine". Dopo: "Scarica".
2. **Default intelligenti.** Si apre con il ritaglio già impostato. Il formato di uscita si sceglie da solo: PNG se c'è trasparenza, altrimenti quello dell'originale.
3. **Quello che vedi è quello che scarichi.** L'anteprima dal vivo mostra il risultato esatto, trasparenza compresa (scacchiera).
4. **Niente gergo.** "Raddrizza", "Arrotondamento", "Sfondo", "Bordo". Mai "canvas", "alpha" o "aspect ratio".
5. **Tutto è reversibile.** Annulla/ripeti, doppio clic su uno slider per azzerarlo, "Ripristina".

## Schermate

### 1. Vuota (nessuna immagine)
```
┌──────────────────────────────────────────────────────────┐
│ ◧ Trimly                                   IT/EN   ☀/☾   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│               ┌──────────────────────────┐               │
│               │         [icona]          │               │
│               │  Ritaglia qualsiasi      │               │
│               │  immagine, in un attimo  │               │
│               │                          │               │
│               │   [ Scegli un'immagine ] │               │
│               │ o trascinala qui · ⌘V    │               │
│               └──────────────────────────┘               │
│      Forma libera · Proporzioni · Cerchio trasparente    │
│          JPG PNG WebP HEIC GIF AVIF TIFF BMP SVG         │
│   🔒 Le immagini restano sul tuo dispositivo · Prova ▸   │
└──────────────────────────────────────────────────────────┘
```
Trascinando un file in qualsiasi punto della finestra compare un overlay a tutto schermo: "Rilascia per aprire".

### 2. Editor — desktop (≥ 900 px)
```
┌──────────────────────────────────────────────┬───────────────┐
│ ◧ Trimly           [+ Nuova]    IT/EN  ☀/☾   │               │
├──────────────────────────────────────────────┤  Anteprima    │
│                                              │  ┌───────┐    │
│      ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░           │  │  (•)  │    │
│      ░░░┌──────────────┐░░░░░░░░░           │  └───────┘    │
│      ░░░│   immagine   │░░░░░░░░░           │  1080×1080 px │
│      ░░░│   (ritaglio) │░░░░░░░░░           │───────────────│
│      ░░░└──────────────┘░░░░░░░░░           │  Forma        │
│      ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░           │  [▭][▢][◯]    │
│                                              │  Proporzioni  │
│   ( ↶ ↷ │ − 100% + ⤢ │ Ripristina )          │  Sfondo/Bordo │
│                                              │  Ruota        │
│                                              │  Esporta      │
│                                              │ [  Scarica  ] │
└──────────────────────────────────────────────┴───────────────┘
```

### 3. Editor — mobile (< 900 px)
```
┌─────────────────────────┐
│ ◧ Trimly   ☾  [Scarica] │
├─────────────────────────┤
│                         │
│      area immagine      │
│   (pizzica per zoom)    │
│                         │
│   ( ↶ ↷  − + ⤢ )        │
├─────────────────────────┤
│  pannello strumento     │
│  (chip scorrevoli…)     │
├─────────────────────────┤
│ Forma  Ruota  Esporta   │
└─────────────────────────┘
```

## Interazioni
| Gesto | Effetto |
|---|---|
| Trascina dentro il ritaglio | Sposta il ritaglio |
| Trascina una maniglia | Ridimensiona (a proporzioni bloccate se impostate) |
| Trascina fuori dal ritaglio | Sposta la vista (se ingrandita) |
| Rotella / pizzico trackpad / pizzico touch | Zoom centrato sul puntatore |
| Frecce (ritaglio selezionato) | Sposta di 1 px sullo schermo; con ⇧ di 10 |
| ⌘/Ctrl+Z · ⇧⌘Z / Ctrl+Y | Annulla · Ripeti |
| ⌘/Ctrl+V | Incolla un'immagine |
| Doppio clic su uno slider | Lo azzera al valore predefinito |

Durante il trascinamento compaiono la griglia dei terzi e un'etichetta con le dimensioni in pixel.

## Design tokens
| Token | Chiaro | Scuro |
|---|---|---|
| `--bg` | #F6F6F8 | #0D0D10 |
| `--surface` | #FFFFFF | #16161A |
| `--surface-2` | #F0F0F3 | #1E1E23 |
| `--border` | #E4E4E9 | #2A2A31 |
| `--text` | #17171C | #F3F3F5 |
| `--text-2` | #55555F | #A3A3AE |
| `--text-3` | #6F6F7A | #8E8E99 |
| `--accent` | #5B4CF0 | #8C80FF |
| `--accent-contrast` | #FFFFFF | #0D0D10 |
| `--stage` | #E9E9EE | #08080A |

Raggi 8/12/16 px · ombre morbide a due livelli · font Inter (variabile) · transizioni 150–200 ms, disattivate con `prefers-reduced-motion`.
