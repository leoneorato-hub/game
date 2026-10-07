# PATCHWORK ETERNITY
### *Survivors of the Stitched Multiverse*

> **Game Design Document — v0.1 (Concept)**
> Genere: Action Roguelike / Reverse Bullet Hell (auto-battler) · Piattaforme target: PC (Steam Deck verified), Switch · Engine: Godot 4.3+
> Run standard: 30 minuti · Giocatori: 1 (co-op locale 2–4 come obiettivo post-lancio)

> ⚠️ *Nota legale: concept fan-made. Una produzione reale richiede licenze da Team Cherry, Arsi "Hakita" Patala / New Blood Interactive, Supergiant Games, Maddy Makes Games / Extremely OK Games, Motion Twin / Evil Empire, The Game Kitchen, Re-Logic ed Edmund McMillen / Nicalis.*

---

## Indice

0. [Visione e Premessa Narrativa](#0-visione-e-premessa-narrativa)
1. [Meccaniche Base](#1-meccaniche-base)
2. [Direzione Artistica](#2-direzione-artistica)
3. [Roster, Armi e Sinergie](#3-roster-armi-e-sinergie)
4. [Livelli](#4-livelli)
5. [Interfaccia Utente](#5-interfaccia-utente)
6. [Meta-progressione](#6-meta-progressione)
7. [Architettura Tecnica](#7-architettura-tecnica)
8. [Script di Base](#8-script-di-base)

---

## 0. Visione e Premessa Narrativa

### Pitch in una frase
*Otto eroi indie, ognuno prigioniero del proprio ciclo di morte e rinascita, vengono strappati dai loro mondi e cuciti insieme in un multiverso-patchwork da un'entità che colleziona i "finali" dei videogiochi.*

### Il tema: il Ciclo
Tutti i protagonisti scelti condividono un tratto: **conoscono la morte e il tentativo successivo.** Il Cavaliere lascia la sua Ombra, Zagreus risale dallo Stige, Madeline muore mille volte sulla montagna, il Prigioniero si rigenera nella cella, il Penitente risorge al Inginocchiatoio, il Terrariano rinasce al punto di spawn, Isaac rientra nel seminterrato, V1 viene riattivato in un Inferno pieno. Il roguelike *è* la loro natura: il gioco lo rende esplicito.

### L'antagonista: **La Cucitrice**
Un'entità senza volto, alta e sottile, fatta di aghi d'argento e ditali, il cui corpo è un manichino da sarto ricoperto di ritagli di mondi. Raccoglie i mondi che "finiscono" — Hallownest infetta, l'Inferno senza sangue, la Montagna Celeste, l'Isola del Prigioniero corrosa dal Malessere, Cvstodia sotto il Miracolo, il mondo del Terrariano dopo il Signore della Luna — e li ricuce in un'unica coperta infinita, il **Patchwork**. Il suo scopo: un ciclo perfetto in cui nessuno vinca mai, e nessuno smetta mai di provarci.

**Registro linguistico della Cucitrice:** parla in seconda persona, sempre al presente, con metafore sartoriali, frasi spezzate da pause come punti di cucitura. Mai urla.

> *«Un altro orlo sfilacciato… Vieni. Ti rammendo io. Ogni volta che cadi, il punto si fa più stretto. Ogni volta che ti rialzi… il disegno diventa più bello.»*

---

## 1. Meccaniche Base

### 1.1 Core Loop (in run)
1. **Muoviti** (unico input obbligatorio: stick/WASD). Le armi attaccano da sole.
2. **Uccidi** → i nemici rilasciano **Frammenti di Trama** (esperienza). Ogni personaggio vede i frammenti con l'aspetto della propria valuta d'origine (vedi *Risonanza Visiva*, §2.4).
3. **Sali di livello** → scegli 1 tra 3 opzioni (arma nuova, potenziamento, passivo).
4. **Evolvi**: arma al livello massimo + catalizzatore corretto + apertura di uno **Strappo** (forziere élite) = **Ricucitura** (evoluzione).
5. **Sopravvivi 30 minuti**. Al minuto 30 arriva **IL CONTINUE** (vedi §1.7).

### 1.2 Input
| Azione | Tastiera | Pad | Note |
|---|---|---|---|
| Movimento | WASD | Stick sx | Unico input richiesto |
| Abilità Natia | Spazio | A / ✕ | Opzionale, specifica per personaggio (Scatto di V1, Focus manuale del Cavaliere, Fiaschetta del Prigioniero…) |
| Mappa delle Trame | Tab | Select | Vista sinergie, mette in pausa |
| Pausa | Esc | Start | |

Tutte le abilità natie hanno un'**opzione "Auto"** nelle impostazioni per restare fedeli alla filosofia "one-stick".

### 1.3 Statistiche Globali
| Statistica | Effetto | Icona (pixel 8×8) |
|---|---|---|
| **Vita** | PV massimi (o equivalente del personaggio: Maschere, Cuori…) | Cuore cucito |
| **Armatura** | Riduzione piatta del danno subito | Ditale |
| **Rigenerazione** | PV/secondo (non applicabile a V1) | Goccia |
| **Velocità** | Movimento | Rocchetto che gira |
| **Potenza** | Danno % | Ago |
| **Area** | Dimensione colpi | Cerchio di stoffa |
| **Ritmo** | Riduzione tempo di ricarica | Spoletta |
| **Durata** | Durata effetti | Clessidra di filo |
| **Quantità** | Proiettili extra | Spilli |
| **Magnetismo** | Raggio di raccolta | Calamita a forbice |
| **Fortuna** | Qualità drop / opzioni rare | Bottone dorato |
| **Crescita** | Esperienza % | Gomitolo |
| **Nodo** | Difficoltà (più nemici, più ricompense) — equivalente della "Maledizione" | Nodo nero |

> **Eccezioni di fedeltà:** Isaac sostituisce la scheda con le **6 statistiche originali** (Danno, Lacrime, Gittata, Velocità del colpo, Velocità, Fortuna). Il Prigioniero scala con i **colori delle Pergamene** (Brutalità/Tattica/Sopravvivenza). Il Terrariano scala con il **tier di minerale**.

### 1.4 Slot e Kit Natio
Per rispettare l'identità dei personaggi, **le armi non sono condivise**: ognuno possiede un **Kit Natio** (≈6–8 armi del proprio universo). Ciò che è condiviso sono i **Passivi Universali** e le rare **Reliquie del Multiverso** (oggetti "trapiantati" da un altro mondo, che sbloccano i *Duetti*, §3.10).

| Default | 6 armi + 6 passivi |
|---|---|
| Il Cavaliere | 6 armi + **Tacche Amuleto** (5 iniziali → max 11, può andare in *Sovraccarico*) |
| Zagreus | 1 Arma Infernale + **5 slot Dono** (Attacco, Speciale, Lancio, Scatto, Richiamo) + 6 passivi |
| Il Prigioniero | 4 armi (2 primarie + 2 abilità, come l'originale) + **3 Mutazioni** + Pergamene illimitate |
| Il Penitente | 6 armi + **Rosario** (8 grani) |
| Isaac | **1 sola arma: le Lacrime**. Oggetti passivi **illimitati** + 1 oggetto attivo |
| Altri | 6 + 6 |

### 1.5 Esperienza, Level-Up e Ritmo
- Curva XP: `xp_richiesta(n) = 5 + 10·n + 0.6·n²` (livelli 1–20), poi crescita lineare +45/livello.
- Il level-up **non mette in pausa bruscamente**: il tempo rallenta al 10% per 0,25 s mentre i pannelli "scivolano" in scena, poi pausa completa (vedi §5.3).
- **Reroll / Scarta / Salta** disponibili via meta-progressione.

### 1.6 Pickup a terra
| Pickup | Effetto |
|---|---|
| **Gomitolo** | Attira tutti i Frammenti dello schermo |
| **Pasticcino di Pezza** | Cura il 30% (V1 **non può raccoglierlo**: il sangue è l'unico carburante) |
| **Ditale d'Oro** | Monete meta (Filo) |
| **Forbici** | Danno a tutti i nemici a schermo |
| **Strappo** (forziere) | Drop da élite/boss, garantisce potenziamenti o Ricucitura |
| **Strappo Maledetto** | Ricompensa tripla + *Maledizione* (eredità Dead Cells): muori in un colpo finché non uccidi 10 nemici. Più frequente con il Prigioniero |
| **Fragola** | Non fa nulla. Assolutamente nulla. Viene contata nelle statistiche di fine run. (Omaggio fedele a Celeste) |

### 1.7 Timer, Ondate e IL CONTINUE
- Ogni stage è diviso in **6 Atti da 5 minuti**. Ogni atto introduce un nuovo tipo di nemico base, a 2:30 di ogni atto arriva un'**Élite**, a fine atto 3 arriva il **Mid-Boss**, al minuto 25 il **Boss di Stage**.
- **Minuto 30 — IL CONTINUE.** Lo schermo si desatura, la musica si interrompe, e al centro appare un gigantesco numero in pixel-art: **`10`**. È un'entità. Il numero insegue il giocatore scalando verso il basso (`9… 8… 7…`), istantaneamente letale al contatto. A `0` lo schermo mostra **"GAME OVER"** in tutti gli otto font originali sovrapposti. Ucciderlo (possibile solo con build estreme) sblocca il finale segreto.

### 1.8 Difficoltà: i Nodi
Ogni **Nodo** (0–5) aggiunge: +15% HP nemici, +1 élite per atto, nemici più rapidi, ricompense +20% Filo. Per il Prigioniero i Nodi sono rinominati **Cellule del Boss** (fedeltà a Dead Cells), per Zagreus il livello di Nodo è mostrato come **Calore** del Patto di Punizione.

### 1.9 Modalità Assistenza
Omaggio diretto a Celeste: velocità di gioco (50–100%), invincibilità, danno ×2. Disponibile per tutti, sempre, senza sbloccare nulla. Le run in Assistenza sono marcate con una piccola piuma sullo scudo di fine run, mai penalizzate.

---

## 2. Direzione Artistica

### 2.1 Il problema
Otto universi con linguaggi visivi incompatibili: l'illustrazione a mano monocromatica di Hollow Knight, il low-poly PSX di Ultrakill, il disegno pittorico di Hades, la pixel-art minimale di Celeste, la pixel-art animata da modelli 3D di Dead Cells, la pixel-art gotica di Blasphemous, gli sprite a blocchi di Terraria, la grafica "cartonata" di Isaac.

### 2.2 La soluzione: **"La Regola della Cucitura"**
L'identità visiva del gioco è il **patchwork**: invece di forzare un unico stile, lo dichiariamo. Ogni elemento rispetta 5 regole condivise che lo rendono parte della stessa coperta:

1. **Griglia comune:** personaggi 32×32 px, nemici base 16–24 px, élite 48 px, boss 96–192 px. Risoluzione interna 640×360, scalata pixel-perfect.
2. **Contorno d'inchiostro:** ogni sprite ha un outline di 1 px nel colore `#1A1220` (viola-nero "inchiostro di sarta"). È il collante che amalgama gli stili.
3. **Luce unica:** luce chiave sempre dall'alto-sinistra, 3 toni per materiale + 1 highlight. Gli stili d'origine sopravvivono nella *palette*, non nell'illuminazione.
4. **Palette per Toppa:** ogni universo conserva una sotto-palette di 12 colori (es. Hallownest: blu-grigi e bianco osso; Hades: rossi, ori e verdi Stige; Blasphemous: ocra, cremisi, oro liturgico). Le palette si mescolano solo **lungo le cuciture**.
5. **Cuciture visibili:** dove due materiali d'universi diversi si incontrano (pavimenti, mura, persino gli sprite dei boss "ricuciti") appare una linea tratteggiata di punti di filo che pulsa leggermente. È la firma visiva del gioco.

### 2.3 Post-processing
- Dithering ordinato (Bayer 4×4) solo sulle ombre, per uniformare i gradienti di Hades/Hollow Knight.
- Leggera aberrazione cromatica sulle cuciture quando un boss è in campo.
- **Opacità effetti alleati** regolabile (0–100%): con 400 nemici e 60 proiettili la leggibilità viene prima di tutto.

### 2.4 Risonanza Visiva (XP diegetica)
I Frammenti di Trama assumono la forma della valuta d'origine del personaggio:

| Personaggio | Forma degli XP | Suono di raccolta |
|---|---|---|
| Il Cavaliere | Geo | *tink* metallico di Hallownest |
| V1 | Gocce di sangue (solo estetica: gli XP non curano) | schizzo idraulico |
| Zagreus | Oscurità (cristalli viola) | eco del Tartaro |
| Madeline | Frammenti di Cristallo Cuore | campanellino di Celeste |
| Il Prigioniero | Cellule blu | *slurp* bio |
| Il Penitente | Lacrime d'Espiazione | goccia in un calice |
| Il Terrariano | Monete di rame/argento/oro/platino (cambiano col valore) | *clink* di Terraria |
| Isaac | Penny | moneta che rimbalza |

### 2.5 Aspetto dei personaggi (fedeltà ai design originali)
| Personaggio | Silhouette e tratti distintivi da preservare in 32 px |
|---|---|
| **Il Cavaliere** | Minuscolo; guscio-maschera bianco con due corna, due occhi neri senza pupilla, corpo di Vuoto, mantello grigio. Aculeo sottile quasi quanto lui |
| **V1** | Macchina antropomorfa blu-acciaio, braccio Feedbacker blu ben visibile, "ali" dissipatrici sul dorso; una sola luce nel volto |
| **Zagreus** | Occhi eterocromi (uno rosso, uno verde), corona d'alloro nera, piedi che ardono a ogni passo, cappa rossa, Stygius in mano |
| **Madeline** | Capelli rossi come indicatore di stato: **rossi** = scatto pronto, **azzurri** = scatto speso, **rosa** = doppio scatto |
| **Il Prigioniero** | Corpo senza testa con una massa fiammeggiante di cellule al posto del capo; postura sciolta, quasi beffarda |
| **Il Penitente** | Elmo metallico a capirote cinto di spine, armatura penitenziale, Mea Culpa dalla guardia di spine contorte |
| **Il Terrariano** | **Personalizzabile** come nell'originale: editor di capelli, pelle, abiti (con preset "Guida-compatibile") |
| **Isaac** | Bambino nudo, calvo, occhi enormi gonfi di lacrime; ogni oggetto raccolto **cambia il suo sprite** (cappelli, corna, ferite) come nell'originale |

---

## 3. Roster, Armi e Sinergie

> **Principio di Traduzione Fedele.** Per ogni personaggio rispondiamo a tre domande: *(1) qual è la risorsa che governa il suo combattimento? (2) come si cura? (3) come cresce?* Le meccaniche auto-battler sono progettate per conservare queste tre risposte.

---

### 3.1 IL CAVALIERE — *Hollow Knight*

> *Muto. Un recipiente nato dal Vuoto, che non dovrebbe avere né voce né volontà. Eppure continua ad avanzare.*

| | |
|---|---|
| **Risorsa** | **Anima** (vaso da 99, incantesimi e Focus costano 33) |
| **Cura** | **Focus**: spende Anima stando fermo |
| **Crescita** | Aculeo (livelli di affilatura), Incantesimi, **Amuleti con Tacche** |
| **Vita** | **5 Maschere**. Ogni colpo nemico toglie 1 Maschera (2 dai nemici pesanti), seguito da ~1,3 s di invulnerabilità |
| **Abilità Natia** | Focus manuale (tenere premuto) |
| **Sblocco** | Disponibile dall'inizio |

**Arma iniziale — L'Aculeo**
Fendente orizzontale/verticale verso il nemico più vicino, **vincolato alle 4 direzioni cardinali** (come nell'originale). Ogni nemico colpito: **+11 Anima** (massimo 3 nemici conteggiati per fendente, per evitare abusi in folla). Rinculo: il Cavaliere viene spinto leggermente indietro a ogni colpo, i nemici subiscono knockback.

| Livello | Nome (fedele all'Aculeaio) | Danno | Note |
|---|---|---|---|
| 1 | Aculeo Vecchio | 5 | Cooldown 0,41 s |
| 3 | Aculeo Affilato | 9 | |
| 5 | Aculeo Canalizzato | 13 | |
| 7 | Aculeo Spiralato | 17 | |
| 8 | — | — | Pronto per la Ricucitura |

**Kit Natio**
| Arma | Comportamento auto | Costo |
|---|---|---|
| **Spirito Vendicativo** | Proiettile spettrale perforante (15 dmg), lanciato verso il gruppo più denso | 33 Anima |
| **Discesa Desolata** | Il Cavaliere si solleva e piomba al suolo: onda d'urto circolare | 33 Anima |
| **Spiriti Urlanti** | Esplosione di spiriti in un cono sopra/attorno a sé | 33 Anima |
| **Fendente Ciclone** | Arte dell'Aculeo: rotazione multipla quando ≥ 8 nemici sono nel raggio | Cooldown |
| **Grande Fendente** | Arte dell'Aculeo: colpo caricato frontale, danno ×2,5 | Cooldown |
| **Fendente Scattante** | Arte dell'Aculeo: scatto-fendente attraverso una fila di nemici | Cooldown |

**Priorità dell'Anima** (impostazione in pausa, fedele al dilemma originale): `Focus prima` / `Incantesimi prima` / `Bilanciata`. Il Focus si attiva solo se il Cavaliere è fermo da 0,5 s e non è stato colpito: il giocatore decide *quando* rischiare.

**Amuleti (Passivi a Tacche)**
Il Cavaliere non ha 6 slot passivi: ha **Tacche** (5 iniziali, max 11). Se equipaggia oltre il limite entra in **Sovraccarico**: subisce danno doppio, esattamente come nell'originale.

| Amuleto | Tacche | Effetto |
|---|---|---|
| Accalappia-Anime | 2 | +3 Anima per colpo |
| Pietra dello Sciamano | 3 | Incantesimi +33% danno e dimensione |
| Fendente Rapido | 3 | Cooldown Aculeo 0,41 → 0,25 s |
| Marchio d'Orgoglio | 3 | Portata Aculeo +40% |
| Forza Indistruttibile | 3 | Danno Aculeo +50% |
| Focus Rapido | 3 | Focus più veloce del 33% |
| Canto delle Larve | 1 | Guadagna Anima quando subisci danno |
| Elegia della Larvamosca | 3 | A Maschere piene l'Aculeo spara fasci |
| Furia del Caduto | 2 | Con 1 Maschera: Aculeo +75% danno |
| Grembo Luminoso | 2 | Consuma Anima per generare piccoli esploratori-kamikaze |
| Canto delle Tessitrici | 2 | Evoca tre piccole Tessitrici che attaccano |
| Stemma del Difensore | 1 | Nube tossica attorno al Cavaliere |
| Ombra Affilata / Maestro dello Scatto | 2 / 2 | Bonus allo scatto e all'evasione |

**Sinergie originali conservate**
- *Elegia della Larvamosca + Furia del Caduto* → i fasci diventano rossi e potenziati.
- *Canto delle Tessitrici + Canto delle Larve* → le Tessitrici generano Anima a ogni colpo.
- *Grembo Luminoso + Stemma del Difensore* → i piccoli esploratori esplodono in nubi tossiche.

**Ricuciture (Evoluzioni)**
| Base | Catalizzatore | Evoluzione |
|---|---|---|
| Aculeo Lv 8 | Passivo *Minerale Pallido* | **Aculeo Puro** — 21 dmg, i fendenti lasciano scie di luce pallida |
| Spirito Vendicativo Lv 8 | Pietra dello Sciamano | **Anima d'Ombra** — 30 dmg, proiettile di Vuoto più grande |
| Discesa Desolata Lv 8 | Passivo *Cuore di Cristallo* | **Oscurità Discendente** — doppia onda di Vuoto |
| Spiriti Urlanti Lv 8 | Passivo *Mantello d'Ombra* | **Grido dell'Abisso** — tentacoli d'ombra dal cielo |
| *Ultima:* tutte e 3 le Arti dell'Aculeo + Aculeo Puro | *Cuore del Vuoto* (drop del Boss Finale) | **Signore delle Ombre** — il Cavaliere si dissolve nel Vuoto per 8 s, tentacoli automatici in tutte le direzioni |

**L'Ombra (persistenza meta).** Se il Cavaliere muore, nella run successiva con lui appare la sua **Ombra** nel primo stage. Ucciderla restituisce il 50% del Filo perso. Fino a quel momento, il vaso d'Anima è limitato a 66 — come una Maschera incrinata.

**Voce.** Non parla. Solo un piccolo *«Hm!»* allo scatto e un respiro trattenuto al Focus. Il silenzio *è* la sua caratterizzazione.

---

### 3.2 V1 — *ULTRAKILL*

> `MANKIND IS DEAD.` `BLOOD IS FUEL.` `HELL IS FULL.`

| | |
|---|---|
| **Risorsa** | **Stile** (D → C → B → A → S → SS → SSS → ULTRAKILL) |
| **Cura** | **Solo sangue**: i nemici uccisi entro 3 m schizzano sangue che cura. Nessuna rigenerazione, nessun Pasticcino di Pezza |
| **Crescita** | Armi con varianti, bracci, monete |
| **Vita** | 100 PV + **Danno Duro**: una parte di ogni danno diventa "non curabile" per alcuni secondi |
| **Abilità Natia** | **Scatto** (3 barre di stamina), con invulnerabilità |
| **Sblocco** | Raggiungi il rango **S** di Stile in qualsiasi run |

**Arma iniziale — Revolver Perforante**
Colpo hitscan automatico al nemico più vicino ogni 0,4 s. Ogni 3 s carica un **colpo perforante** che attraversa tutta la linea.

**Stile e Freschezza (fedeltà al sistema originale)**
- Lo Stile sale con uccisioni, uccisioni multiple, uccisioni "in volo", parry. Moltiplica gli XP raccolti (fino a ×2 a rango ULTRAKILL).
- **Freschezza**: ogni arma che uccide troppo di seguito diventa "Stantia" e dà meno Stile. Il gioco premia build variegate, esattamente come nell'originale.
- Essere colpiti fa crollare lo Stile.

**Kit Natio**
| Arma | Comportamento auto |
|---|---|
| **Moneta** | V1 lancia una moneta in aria; qualsiasi colpo hitscan che la colpisce **rimbalza** sul punto debole del nemico più vicino (Ricoshot) |
| **Shotgun — Core Eject** | Rosa di pallettoni frontale + ogni 4 s un nucleo esplosivo lanciato a parabola |
| **Nailgun — Attractor** | Raffica di chiodi; periodicamente pianta un magnete che attira i chiodi in orbita |
| **Railcannon — Elettrico** | Raggio perforante che attraversa lo schermo. Cooldown lungo (16 s) |
| **Lanciarazzi — Freezeframe** | Razzi esplosivi; ogni 10 s congela tutti i razzi in volo per 2 s, poi li rilascia insieme |
| **Feedbacker** | Parry automatico: i proiettili nemici a contatto vengono respinti con danno ×2 e **curano V1, azzerando il Danno Duro**. Cooldown 6 s |
| **Knuckleblaster** | Pugno con onda d'urto quando ≥ 5 nemici sono a distanza di mischia |
| **Whiplash** | Rampino che trascina l'élite più vicino addosso a V1 |

**Sinergie**
- *Whiplash + Sangue è Carburante* → il nemico trascinato esplode in sangue all'impatto: la cura più efficiente del gioco, al prezzo di portarsi i nemici addosso.
- *Moneta + Revolver/Railcannon* → ogni colpo hitscan sceglie automaticamente se passare per una moneta: catene fino a 4 rimbalzi.
- *Lanciarazzi + Shotgun Core Eject* → i nuclei colpiti da un razzo detonano con area ×2.

**Ricuciture**
| Base | Catalizzatore | Evoluzione |
|---|---|---|
| Revolver Lv 8 | Moneta | **Marksman Ricoshot** — 4 monete in aria costanti, catene infinite di rimbalzi |
| Railcannon Lv 8 | Moneta | **Railcoin** — il raggio si divide su tutte le monete, poi su tutti i punti deboli a schermo |
| Lanciarazzi Lv 8 | *Passivo Overclock* | **S.R.S. Cannon** — palla di cannone rimbalzante, cavalcabile da V1 (bonus velocità) |
| Nailgun Lv 8 | *Passivo Overheat* | **Sawblade Launcher** — lame circolari che rimbalzano sui bordi |

**Voce.** Nessuna. Solo testo di sistema in maiuscolo a terminale, freddo, quasi ironico nella sua neutralità:
> `NUOVO OBIETTIVO RILEVATO.` · `SANGUE INSUFFICIENTE. AVVICINARSI.` · `STILE: ULTRAKILL.`

---

### 3.3 ZAGREUS — *Hades*

> *«Padre, scusa il disturbo, sto solo uscendo. Di nuovo. Non aspettarmi alzato.»*

| | |
|---|---|
| **Risorsa** | **Doni degli Olimpi** + Cristalli di Sangue (munizioni del Lancio) |
| **Cura** | Raro (Fontane nello stage, Doni di Demetra/Dioniso specifici) — come nell'originale, la cura è scarsa |
| **Crescita** | 1 Arma Infernale + 5 slot Dono + Ricordi (passivi) |
| **Vita** | 50 PV + **2 Sfide alla Morte** (rinasce col 50% PV) |
| **Abilità Natia** | Scatto (con Scatto-Colpo) |
| **Sblocco** | Muori 5 volte con qualsiasi personaggio («Ehi, anche loro escono dal Tartaro ogni volta») |

**Arma iniziale — scelta tra le Armi Infernali** (come all'Armeria della Casa di Ade)
| Arma | Auto-attacco | Speciale auto |
|---|---|---|
| **Stygius** (default) | Combo a 3 colpi frontale ad arco | **Nova Smash**: onda circolare ogni 4 s |
| **Varatha** | Affondo lungo in linea | Lancio della lancia che ritorna |
| **Aegis** | Colpo a scudo con knockback | Lancio rimbalzante dello scudo |
| **Coronacht** | Freccia caricata al più lontano | Ventaglio di frecce |
| **Pugni di Malphon** | Raffica rapidissima corpo a corpo | Montante con area |
| **Exagryph** | Raffica automatica | Granata |

**Lancio: il Cristallo di Sangue.** 3 cariche. Il Cristallo resta conficcato nel nemico e va **recuperato** passandoci sopra quando cade (o torna da solo dopo 15 s) — gestione delle munizioni fedele all'originale.

**I Doni sostituiscono le armi.** Al level-up, Zagreus riceve spesso un **Incontro Olimpico**: tre Doni di un singolo dio, ognuno destinato a uno slot.

| Divinità | Stato applicato | Esempio Attacco | Esempio Lancio |
|---|---|---|---|
| Zeus | Fulmini a catena | *Colpo Fulminante* | *Lancio Elettrico* |
| Poseidone | Knockback, danno contro i muri | *Colpo della Tempesta* | *Lancio delle Maree* |
| Atena | Deviazione dei proiettili | *Colpo Divino* | *Lancio Fantasma* |
| Ares | **Rovina** (danno ritardato) | *Maledizione dell'Agonia* | *Lame Lacerate* |
| Afrodite | **Debolezza** | *Colpo Spezzacuori* | *Lancio del Desiderio* |
| Artemide | Critici | *Colpo Letale* | *Lancio Sottile* |
| Dioniso | **Sbornia** (danno nel tempo) | *Colpo Ebbro* | *Lancio Festoso* |
| Demetra | **Gelo** (rallentamento) | *Colpo Gelido* | *Lancio Glaciale* |
| Ermes | Nessuno stato: velocità e frequenza | — | *Ritorno Rapido* |

**Sinergie = Doni Duo** (fedeli ai duo dell'originale)
- *Zeus + Poseidone* → **Tempesta Marina**: i nemici spinti vengono colpiti da fulmini.
- *Ares + Atena* → **Fine Misericordiosa**: la deviazione attiva istantaneamente la Rovina.
- *Ares + Afrodite* → **Maledizione del Desiderio**: la Rovina si ripete sui nemici indeboliti.
- *Zeus + Artemide* → **Parafulmine**: i Cristalli piantati attirano fulmini.
- *Dioniso + Demetra* → **Vino Ghiacciato**: il Lancio crea nubi gelide e inebrianti.
- *Ares + Artemide* → **Lame da Caccia**: le Lame Lacerate cercano i nemici.

**Ricordi (passivi)**: *Vecchio Collare Chiodato* (Cerbero, +PV), *Dente Fortunato* (Skelly, una Sfida alla Morte extra), *Bracciale dei Mirmidoni* (Achille, meno danno frontale, più alle spalle), *Scialle Nero* (Nyx), *Rosa Rossa*… Ogni Ricordo ha 3 ranghi che salgono uccidendo nemici.

**Ricucitura**
| Base | Catalizzatore | Evoluzione |
|---|---|---|
| Stygius Lv 8 | *Oscurità* (passivo cumulativo) | **Aspetto di Artù** — Stygius diventa Excalibur: colpi più lenti e devastanti, **Aura Santa** che rallenta i nemici e riduce il danno subito |
| Qualsiasi Arma Lv 8 | Doni Leggendari di 2 dei | **Chiamata Completa** — invocazione del dio dominante ogni 30 s |

**Voce.** Arguto, sarcastico ma affettuoso, battute rapide e autoironia; tenerezza improvvisa quando nomina la madre.
> *«Bel posto. Un po' cucito male, ma ho visto di peggio. Ho visto Asfodelo.»*
> *«Cucitrice, giusto? Mio padre ti adorerebbe. Anche lui ama tenere la gente dove non vuole stare.»*

---

### 3.4 MADELINE — *Celeste*

> *«Ok. Ok. Respira. Sono solo… quattrocento cose che vogliono uccidermi. Ce la posso fare.»*

Madeline **non è una guerriera**. Il suo kit traduce il movimento di Celeste in danno, e la sua storia — l'ansia, la parte di sé che la sabota, l'accettazione — in meccaniche.

| | |
|---|---|
| **Risorsa** | **Scatto** (si ricarica toccando terra dopo il cooldown, o istantaneamente con i Cristalli Scatto verdi) |
| **Cura** | Nessuna cura di PV: Madeline **non ha PV**. Ha la barra **Ansia** |
| **Crescita** | Elementi della Montagna (Piume, Bolle, Kevin…) |
| **Abilità Natia** | Scatto manuale in 8 direzioni (opzionale: Auto) |
| **Sblocco** | Raccogli 50 Fragole totali (che non servono a nulla… tranne a questo) |

**Ansia invece della Vita.** Ogni colpo subito riempie la barra **Ansia** (viola, con la sagoma di Badeline che si allunga). L'Ansia scende lentamente se Madeline non viene colpita. A 100%:
**Attacco di Panico** → lo schermo si scurisce e appare il **minigioco della Piuma** (fedele al capitolo della funivia con Theo): mantieni una piuma dentro un riquadro respirando a ritmo. Riuscita = Ansia al 40% e 2 s di invulnerabilità. Fallimento = fine della run.

**Arma iniziale — Scatto**
Ogni 2,5 s Madeline scatta **nella direzione in cui si sta muovendo**, attraversando i nemici e infliggendo danno lungo la traiettoria, con invulnerabilità durante lo scatto. I capelli diventano **azzurri** finché lo scatto non si ricarica. I nemici uccisi rilasciano a volte un **Cristallo Scatto** verde che ricarica all'istante.

**Kit Natio**
| Arma | Comportamento auto |
|---|---|
| **Badeline — "Una Parte di Me"** | Un'ombra speculare che **ripercorre il percorso esatto di Madeline con 1,5 s di ritardo**, danneggiando tutto ciò che tocca (fedele all'inseguimento del Vecchio Sito) |
| **Piuma Dorata** | Ogni 20 s: 3 s di volo libero, velocità ×1,6, immunità ai pericoli del terreno |
| **Bolla Booster** | Madeline viene avvolta in una bolla rossa che la lancia in linea retta come un proiettile |
| **Blocchi Kevin** | Blocchi di pietra dal volto arrabbiato che caricano in linea retta quando Madeline scatta verso di loro |
| **Nucleo Caldo/Freddo** | Aura che alterna ogni 5 s **fuoco** (danno) e **ghiaccio** (rallentamento), come l'interruttore del capitolo Nucleo |
| **Furia di Oshiro** | Il fantasma albergatore carica rabbiosamente in linea retta verso il gruppo più denso |
| **Selfie di Theo** | Flash fotografico che stordisce i nemici in un cono |

**Sinergie**
- *Badeline + Scatto* → l'ombra ripete anche gli scatti, con lo stesso danno.
- *Piuma Dorata + Nucleo* → durante il volo l'aura raddoppia di raggio.
- *Blocchi Kevin + Bolla Booster* → la bolla che urta un Kevin lo fa partire con danno ×3.

**Ricuciture**
| Base | Catalizzatore | Evoluzione |
|---|---|---|
| Scatto Lv 8 | *Cuore di Cristallo* | **Doppio Scatto** — capelli **rosa**, due scatti consecutivi, il secondo esplode in cristalli |
| Badeline Lv 8 | *Accettazione* (passivo che si ottiene superando un Attacco di Panico) | **Insieme** — Badeline afferra Madeline e la **lancia in aria**: atterraggio con onda d'urto a tutto schermo ogni 15 s. L'Ansia ora **aumenta il danno** invece di minacciare la run |

> Il design di *Accettazione* è il cuore narrativo del personaggio: non si "sconfigge" la propria ansia, la si integra.

**Fragola Dorata (sfida):** se Madeline inizia la run raccogliendo la Fragola Dorata, un solo colpo termina la run. Ricompensa: solo prestigio. Come nell'originale.

**Voce.** Madeline: frasi brevi, autoironiche, auto-incoraggianti, che si incrinano sotto pressione.
**Badeline:** tagliente, sprezzante, poi — dopo l'Accettazione — complice.
> **Badeline:** *«Guardati. Mezzo multiverso e tu ancora a contare i respiri.»*
> **Madeline:** *«Sì. E sai cosa? Funziona.»*
> **Badeline (post-Accettazione):** *«…Va bene. Andiamo. Ma questa volta il salto lo decido io.»*

---

### 3.5 IL PRIGIONIERO — *Dead Cells*

> *Una massa di cellule senza nome che possiede un cadavere decapitato. Non parla. Ma ha un'opinione su tutto.*

| | |
|---|---|
| **Risorsa** | **Pergamene del Potere** (Brutalità · Tattica · Sopravvivenza) |
| **Cura** | **Fiaschetta** (1 carica, +1 per boss ucciso; si ricarica alle *Fontane* dello stage). Mutazioni di cura |
| **Crescita** | Colore delle armi × colore delle pergamene |
| **Vita** | 100 PV; la Sopravvivenza aumenta i PV |
| **Abilità Natia** | Rotolata (invulnerabile) / Bevi la Fiaschetta |
| **Sblocco** | Apri uno *Strappo Maledetto* e sopravvivi alla Maledizione |

**Pergamene.** Circa 1 level-up su 3 offre la **scelta di una Pergamena** a 3 colori (fedele all'originale). Ogni armamento ha un colore: le armi rosse scalano con Brutalità, viola con Tattica, verdi con Sopravvivenza. Il Prigioniero ha meno slot (2 armi + 2 abilità + 3 mutazioni) ma Pergamene **illimitate**: la build si definisce col colore, non con il numero di armi.

**Arma iniziale — Spada Arrugginita** (Brutalità) + scelta tra **Arco del Principiante** o **Scudo di Legno** (come all'uscita della cella).
Combo a 3 colpi; il terzo è sempre critico.

**Kit Natio**
| Arma/Abilità | Colore | Comportamento auto |
|---|---|---|
| Lama Bilanciata | 🔴 | Danno crescente per ogni colpo consecutivo, si azzera se si viene colpiti |
| Frusta Elettrica | 🟣 | Frustata lunga, scarica elettrica tra nemici vicini |
| Arco di Ghiaccio | 🟣 | Congela il primo nemico colpito |
| Doppia Balestromatica | 🟣 | Torretta piazzata che spara al più vicino |
| Granata Incendiaria | 🔴 | Area di fuoco |
| Tagliola per Lupi | 🟢 | Trappola che immobilizza |
| **Runa dell'Homunculus** | — | **La testa (la massa di cellule) si stacca, vola sul nemico e lo morde**, poi torna |

**Mutazioni (3 slot)**: *Combo* (danno dopo uccisione rapida), *Necromanzia* (cura per uccisione), *Vendetta* (danno dopo essere colpito), *Adrenalina*, *Istinto Assassino*, *Tranquillità*, *Iniziativa*…

**Sinergie**
- *Lama Bilanciata + Combo* → il bonus della Lama non si azzera finché Combo è attiva.
- *Frusta Elettrica + Arco di Ghiaccio* → i nemici congelati colpiti dall'elettricità **frantumano** (danno ad area).
- *Torrette + Tattica* → ogni 3 Pergamene viola, +1 torretta simultanea.

**Ricuciture**
| Base | Catalizzatore | Evoluzione |
|---|---|---|
| Spada Arrugginita Lv 8 | Mutazione *Combo* | **Lama del Re** — combo infinita, ogni terzo colpo genera una lama spettrale |
| Runa dell'Homunculus Lv 8 | Mutazione *Necromanzia* | **Testa Vorace** — la testa resta fuori e divora più nemici, curando a ogni morso |
| Doppia Balestromatica Lv 8 | 10 Pergamene di Tattica | **Arsenale del Collezionista** — 4 torrette coordinate che sparano a raffica |

**Morte.** Il corpo crolla; la massa di cellule scivola via in un tubo. Lo schermo di Game Over mostra la cella di partenza: **fedeltà al loop originale**.

**Voce.** Muto, ma *espressivo*: gesti, scrollate di spalle, saluto militare irriverente. Il testo traduce la sua mimica:
> *[Il Prigioniero indica la Cucitrice. Poi indica il proprio collo vuoto. Poi fa spallucce.]*
> *[Il Prigioniero si inchina profondamente. È palesemente sarcastico.]*

---

### 3.6 IL PENITENTE — *Blasphemous*

> *«Penitente… il Miracolo ti ha condotto in terre che non conoscono il suo nome. Ma il dolore, figliolo, il dolore parla ogni lingua.»* — Deogracias

| | |
|---|---|
| **Risorsa** | **Fervore** (si guadagna colpendo, si spende in **Preghiere**) |
| **Cura** | **Fiaschette di Bile** (2 base, ricarica agli **Inginocchiatoi** nello stage) |
| **Crescita** | Mea Culpa, Preghiere, **Rosario** (8 grani), **Cuori della Mea Culpa** |
| **Vita** | 120 PV, Armatura alta, velocità bassa |
| **Abilità Natia** | Bevi Bile / Parata manuale |
| **Sblocco** | Sopravvivi 15 minuti senza curarti |

**Arma iniziale — Mea Culpa**
Ampio fendente a 2 colpi ad arco. **Esecuzioni:** quando un élite viene stordito, il Penitente esegue automaticamente un'**esecuzione** (0,6 s, totalmente invulnerabile, animazione cruenta fedele all'originale) che concede molto Fervore e Lacrime d'Espiazione.

**Preghiere (auto-cast a Fervore pieno, una per slot)**
| Preghiera | Effetto |
|---|---|
| **Verdiales della Borgata Abbandonata** | Due onde di energia che corrono sul terreno in direzioni opposte |
| **Taranto a mia Sorella** | Fulmini che cadono sui nemici in sequenza |
| **Debla delle Luci** | Colonne di luce divina attorno al Penitente |
| **Tiento ai tuoi Capelli di Spine** | Riduzione massiccia del danno subito per alcuni secondi |
| **Alborada del Guardiano Senza Nome** | Evoca un guardiano spettrale che colpisce al suo posto |

**Rosario (passivi, 8 grani)**: Grano di Cera Rossa (+PV), Grano di Cera Blu (+Fervore), grani di difesa elementale, grani che potenziano le esecuzioni…

**La Colpa.** Il Penitente ha **1 resurrezione**: alla morte si rialza, ma lascia un **Frammento di Colpa** sul punto in cui è caduto. Finché non torna a raccoglierlo (di solito in mezzo all'orda che l'ha ucciso), il Fervore guadagnato è ridotto del 30%. Penitenza fedele all'originale.

**Sinergie**
- *Tiento + Mea Culpa* → durante la protezione le esecuzioni non hanno cooldown.
- *Taranto + Debla* → i fulmini cadono dentro le colonne di luce, raddoppiando.
- *Verdiales + Alborada* → il guardiano scaglia anche lui le onde.

**Ricuciture**
| Base | Catalizzatore | Evoluzione |
|---|---|---|
| Mea Culpa Lv 8 | *Cuore Fumante d'Incenso* | **Mea Culpa Ardente** — ogni fendente incendia, le esecuzioni esplodono in fiamme sacre |
| 3 Preghiere Lv max | 8 grani nel Rosario | **Il Miracolo** — per 10 s tutte le Preghiere si lanciano senza costo |

**Voce.** **Il Penitente non parla mai.** Mai. Ogni testo che lo riguarda viene da **Deogracias**, narratore dal linguaggio arcaico e liturgico, solenne, quasi da salmo:
> *«Ecco, pellegrino: un sarto senza volto cuce insieme i peccati di mondi interi. Che strano Miracolo è mai questo, che non chiede preghiere… ma punti di cucito?»*

---

### 3.7 IL TERRARIANO — *Terraria*

> **La Guida:** *«Ehi! Sei nuovo da queste parti? Sopravvivere qui non è difficile: basta raccogliere materiali, costruire armi migliori e… non morire. La notte, soprattutto.»*

| | |
|---|---|
| **Risorsa** | **Minerali** (tier) + **Mana** (stelle) |
| **Cura** | Pozioni curative (cooldown come la *Malattia da Pozione* dell'originale) e Cristalli di Vita |
| **Crescita** | **Crafting** al Banco da Lavoro |
| **Vita** | 100 PV (5 cuori da 20), mana 20 |
| **Abilità Natia** | **Costruisci**: piazza un muro di blocchi che blocca i nemici |
| **Sblocco** | Sopravvivi a un evento *Luna di Sangue* (§4, evento casuale) |

**Arma iniziale — Spada Corta di Rame**
Affondo rapido e corto verso il nemico più vicino. Umile. Fedele.

**Sistema di Tier (fedeltà alla progressione).** Invece dei normali livelli 1–8, ogni arma del Terrariano sale di **tier di minerale**, cambiando colore e sprite:
`Rame → Ferro → Argento → Oro → Demonite/Cremisite → Pietra Infernale → Cobalto → Mithril → Adamantio → Consacrato → Clorofite → Luminite`

I livelli offrono a volte **Minerali** invece di armi: si accumulano e vengono spesi automaticamente al **Banco da Lavoro** (pop-up rapido) per salire di tier.

**Kit Natio**
| Arma | Comportamento auto |
|---|---|
| Boomerang Incantato | Va e torna, perfora |
| **Furia Stellare** | Stelle che cadono dal cielo sui nemici |
| **Spada Incantata** | Fendente che spara un raggio |
| Dardo d'Acqua | Proiettile magico che rimbalza (costa mana) |
| Minishark | Mitragliatrice ad altissima cadenza |
| **Apicoltore** | Spada che genera api a ogni colpo |
| Bastone del Diavoletto | Evoca un diavoletto che spara palle di fuoco |
| Yo-yo | Orbita attorno al cursore del bersaglio più vicino |
| **Piccone di Rame** | Scava le **vene di minerale** dello stage (solo il Terrariano può farlo) |

**Sinergie**
- *Furia Stellare + Fiore di Mana* → le stelle ricaricano mana.
- *Apicoltore + Bastone del Diavoletto* → le api incendiate dal diavoletto esplodono.
- *Muro di Blocchi + Minishark* → i nemici bloccati dal muro subiscono +30% danno ("caccia dal bunker").

**Ricucitura — l'unico sistema a fusione multipla del gioco**
| Base | Catalizzatore | Evoluzione |
|---|---|---|
| Spada Incantata tier Consacrato | *Spada dell'Eroe Spezzata* (drop élite) | **Lama Terra** — raggio verde che perfora tutto |
| **Spada Corta di Rame + Furia Stellare + Apicoltore + Lama Terra** (tutte al max) | *Frammento di Luminite* | **ZENITH** — tutte e 4 le armi si fondono in **un solo slot** (liberandone 3!). Lame spettrali di tutte le spade fuse orbitano e trafiggono i nemici a schermo |

> La fusione rispecchia la ricetta originale dello Zenith (che nel gioco base richiede anche Meowmere, Ira Stellare, Influx Waver, Lama del Cavaliere senza Testa, Seedler): nelle run da 30 minuti la ricetta viene "accorciata" alle armi del Kit Natio, ma l'idea — *la spada definitiva nasce dalla prima spada che hai impugnato* — resta intatta.

**Eventi (solo per il Terrariano, casuali):** *Luna di Sangue* (nemici aggressivi, +XP), *Esercito dei Goblin*, *Eclissi Solare*.

**Voce.** Il Terrariano non parla. La **Guida** commenta con tono da tutorial, pratico e un po' ingenuamente ottimista:
> *«Se ti senti sopraffatto, prova a costruire un muro! O una casa. Le case risolvono quasi tutto.»*

---

### 3.8 ISAAC — *The Binding of Isaac*

> *Isaac e sua madre vivevano da soli in una piccola casa sulla collina…*

| | |
|---|---|
| **Risorsa** | **Le Lacrime** (un'unica arma, modificata da ogni oggetto) |
| **Cura** | Cuori rossi raccolti a terra |
| **Crescita** | **Oggetti passivi illimitati**, Trasformazioni, Patti col Diavolo/Angelo |
| **Vita** | **3 Cuori Rossi** (6 mezzi cuori) + Cuori Anima / Cuori Neri |
| **Abilità Natia** | **Oggetto Attivo** (si ricarica con le uccisioni) |
| **Sblocco** | Muori 10 volte (*«Isaac conosce bene questa sensazione.»*) |

**Arma unica — Le Lacrime**
Fedeltà assoluta: Isaac **spara solo nelle 4 direzioni cardinali**. L'auto-mira sceglie la direzione cardinale più allineata col nemico più vicino; le lacrime ereditano parte del movimento di Isaac (come nell'originale). Statistiche iniziali: Danno 3,5 · Lacrime 2,73/s · Gittata 6,5 · Velocità 1,0.

**Ogni level-up è un piedistallo.** Gli oggetti appaiono su piedistalli con nome e **frase di presentazione originale**, e cambiano lo sprite di Isaac:
| Oggetto | Frase | Effetto sulle Lacrime |
|---|---|---|
| La Cipolla Triste | *"Tears up"* | Cadenza ↑ |
| Brimstone | *"Blood laser barrage"* | Le lacrime diventano un laser di sangue a carica |
| Coltello della Mamma | *"Stab stab stab"* | Coltello lanciato e richiamato |
| Il Cucchiaio Piegato | *"Psychic shot"* | Lacrime a ricerca |
| Polifemo | *"Mega tears"* | Lacrime giganti, danno ↑↑, cadenza ↓ |
| L'Occhio Interiore | *"Triple shot"* | 3 lacrime |
| Testa del Grillo | *"DMG up"* | Danno ↑ |
| Tech X | — | Anello laser caricato |
| Ipecac | — | Lacrime esplosive avvelenate |

**Sinergie = le combinazioni emergenti di Isaac** (calcolate sistemicamente, non scriptate):
- *Brimstone + Cucchiaio Piegato* → laser che curva verso i nemici.
- *Brimstone + L'Occhio Interiore* → tre laser.
- *Brimstone + Tech X* → anello di Brimstone.
- *Polifemo + L'Occhio Interiore* → tre lacrime giganti.

**Evoluzioni = Trasformazioni.** Raccogliere 3 oggetti di una serie trasforma Isaac:
- **Guppy** (3 oggetti del gatto Guppy) → volo + una mosca blu a ogni lacrima che colpisce.
- **Signore delle Mosche** (3 oggetti-mosca) → volo + mosche orbitali.
- **Serafino** (3 oggetti angelici) → volo + bonus Lacrime.
- **Leviatano** (3 oggetti demoniaci) → volo + 2 Cuori Neri.

**Pillole.** Pickup casuali con effetto sconosciuto finché non vengono usate la prima volta (*Salute Su*, *Gittata Giù*, *Brutto Viaggio*, *Le Ho Trovate*, *Pubertà*…). L'identificazione persiste nella run.

**Oggetto Attivo:** di base vuoto; sbloccando il **D6** in meta-progressione, Isaac lo ha sempre: **riroll delle opzioni di level-up** (fedele: il D6 ritira i piedistalli).

**Stanza del Diavolo / dell'Angelo.** Dopo un boss, se Isaac non ha subito danno, un portale offre oggetti a pagamento in **contenitori cardiaci**.

**Voce.** Isaac non dialoga: **singhiozza**. Sussulti, tirate di naso, un gemito quando viene colpito. Le uniche "parole" sono la narrazione a vignette tra uno stage e l'altro, con il tono da favola nera dell'introduzione originale:
> *«…e Isaac scivolò ancora più giù, in un posto dove persino il pavimento era cucito di pezze di altri incubi.»*

---

### 3.9 Passivi Universali
Disponibili per tutti (eccetto dove indicato), ognuno disegnato come una "toppa" cucita con l'icona dell'universo da cui proviene:

| Passivo | Effetto | Origine estetica |
|---|---|---|
| **Frammento di Maschera** | +Vita | Hollow Knight |
| **Cristallo di Vita** | +20 Vita (il Terrariano lo vede come +1 cuore) | Terraria |
| **Ditale della Cucitrice** | +Armatura | Originale |
| **Specchio della Notte** | +Potenza | Hades |
| **Pergamena Frammentata** | +Area | Dead Cells |
| **Spoletta Rapida** | +Ritmo | Originale |
| **Clessidra di Filo** | +Durata | Originale |
| **Grano Benedetto** | +Fortuna | Blasphemous |
| **Moneta Consumata** | +Magnetismo | ULTRAKILL |
| **Cristallo Cuore** | +Crescita | Celeste |
| **Pillola Bianca** | +Velocità | Isaac |

### 3.10 Duetti del Multiverso (Sinergie cross-universo)
Le **Reliquie del Multiverso** sono oggetti rari trovati solo negli Strappi d'oro. Combinati con un'arma specifica di un personaggio, creano un **Duetto**: sinergie tra universi giustificate dalla lore.

| Personaggio + Arma | Reliquia (universo) | Duetto | Giustificazione tematica |
|---|---|---|---|
| Madeline · Badeline | *Mantello d'Ombra* (HK) | **"L'Ombra che Accetta"** — Badeline diventa di Vuoto e assorbe i proiettili | Due "ombre" del sé: il Vuoto rifiuta, Madeline accoglie |
| Isaac · Lacrime | *Lacrime d'Espiazione* (Blasphemous) | **"Lacrime Penitenti"** — ogni lacrima che uccide lascia una pozza che cura | Due mondi di colpa religiosa e pianto |
| V1 · Feedbacker | *Bile* (Blasphemous) | **"Sangue Miracoloso"** — i parry curano anche gli alleati in co-op e infiammano | Il sangue come sacramento in entrambi i mondi |
| Zagreus · Sfida alla Morte | *Runa dell'Homunculus* (Dead Cells) | **"Due Teste è Meglio"** — alla rinascita, una testa-spettro combatte al suo fianco | Due eroi che "escono dalla prigione" ogni volta |
| Il Cavaliere · Aculeo | *Cristallo di Vita* (Terraria) | **"Aculeo di Terra"** — ogni 5ª Maschera recuperata, l'Aculeo spara un raggio verde | La spada che cresce con chi la impugna |
| Il Terrariano · Muro di Blocchi | *Kevin* (Celeste) | **"Kevin da Costruzione"** — i blocchi piazzati si arrabbiano e caricano | Blocchi che vivono di vita propria |

In **co-op**, i Duetti si attivano anche quando due giocatori diversi possiedono le parti complementari: un filo dorato visibile li collega a schermo.

---

## 4. Livelli

> Tutti gli stage sono **originali**, nati dalla logica del Patchwork: luoghi che non esistono in nessuno degli otto giochi, ma che potrebbero esistere solo *tra* di essi.

### Struttura comune
- **Durata:** 30 minuti, 6 Atti.
- **Elementi del Patchwork:** ogni stage contiene **Toppe Ospiti** — piccole zone (≈ 1 schermo) prese dagli universi del roster (una pozza dello Stige, un altare di Cvstodia, un'arena di Hallownest) che cambiano a ogni run e ospitano un pickup o un Inginocchiatoio/Fontana/Banco da Lavoro.

---

### 4.1 STAGE 1 — **IL TELAIO DEI MONDI**
*«Qui la Cucitrice tesse. Ogni filo è una strada. Ogni strada finisce in un nodo.»*

**Ambientazione.** Un telaio colossale sospeso nel nulla. Il pavimento è un **tessuto infinito** formato da toppe di mondi diversi: lastre azzurre di Hallownest, mattonelle rosse della Casa di Ade, neve di Celeste, erba a blocchi di Terraria — tutte unite da cuciture pulsanti. Sopra, nel cielo, si muovono le **navette** del telaio, grandi come cattedrali.

**Estetica.** Palette calda di ocra e cremisi spenti, filo d'oro come luce principale. In lontananza (parallasse) si vedono gli ordini del telaio: migliaia di fili verticali che salgono nel buio.

**Layout.**
- **Mappa a banda infinita orizzontale** (scorre all'infinito in orizzontale, limitata in verticale da due "cimose" — bordi di tessuto invalicabili).
- **Corsie della Navetta:** 4 corsie orizzontali. Ogni 45 s un filo si tende e si illumina di bianco (telegrafo, 2 s), poi una navetta attraversa la corsia: danno enorme a giocatore *e nemici*. Usarle per sterminare orde è la prima lezione di "ambiente come arma".
- **Strappi nel tessuto:** buchi che si aprono casualmente; i nemici base che ci cadono muoiono, il giocatore viene "ricucito" altrove con 1 danno.
- **Rocchetti** distruttibili che contengono pickup.

**Nemici**
| Tipo | Nome | Comportamento |
|---|---|---|
| Base | **Falenine di Lanugine** | Sciame veloce e fragile, si muove a stormi sinusoidali |
| Base | **Bambole di Pezza** | Lente, robuste; alla morte si scuciono in 2 mini-bambole |
| Base | **Spilli Erranti** | Si piantano nel terreno e diventano ostacoli finché non vengono distrutti |
| Base | **Echi Ricuciti** | Nemici iconici degli otto mondi "rifatti in stoffa" (un Guscio di Hallownest con i bottoni come occhi, un Filth di ULTRAKILL in feltro, un Gaper di Isaac imbottito…) |
| Élite | **Il Rammendatore** | Gigante dalle braccia ad ago. **Cuce insieme** i nemici vicini creando **Chimere di Toppe** (fusione di 3–5 nemici in una sola entità con i PV sommati e gli attacchi di tutti). Ucciderlo prima che cucia è prioritario |
| Mid-Boss | **Il Ditale Corazzato** | Un ditale gigante che rotola e rimbalza sulle cimose |

**BOSS — MADRE SPOLA, LA TESSITRICE DEI FINALI**
Una creatura di legno e fili, metà ragno e metà telaio, con un volto di porcellana incrinata e otto braccia-navetta.

**Meccanica unica — "Lo Sfilacciamento":**
1. **Ancoraggio:** Madre Spola è legata all'arena da **4 fili maestri** fissati a 4 Rocchetti-Ancora. Finché anche un solo filo è intatto, rigenera il 2% PV/s. I Rocchetti si danneggiano solo con colpi diretti — il giocatore deve allontanarsi da lei per abbatterli.
2. **Ricucitura dell'Arena:** a ogni 25% PV perso, cuce un **anello di tessuto** attorno all'arena, restringendo lo spazio giocabile. I Rocchetti distrutti fanno *ricadere* gli anelli.
3. **Lo Sfilacciamento:** ogni 40 s afferra con un filo **l'ultima arma ottenuta dal giocatore** e la disattiva (l'icona nella HUD si sfila letteralmente). L'arma è racchiusa in un **Gomitolo** che rotola per l'arena: recuperarlo la restituisce subito, altrimenti torna dopo 15 s.

> Insegna al giocatore a guardare la propria HUD e ad adattare la build in tempo reale.

---

### 4.2 STAGE 2 — **CAPOLINEA ETERNO**
*«Prossima fermata: la stessa. Si prega di non scendere. Non c'è un fuori.»*

**Ambientazione.** Una stazione della metropolitana sotterranea che si ripete all'infinito. Mattonelle bianche sporche, neon tremolanti, tabelloni che mostrano destinazioni impossibili ("HALLOWNEST — RITARDO: 10.000 ANNI", "INFERNO, CERCHIO 7 — SOPPRESSO", "CIMA DEL MONTE CELESTE — BINARIO 2"). Un orologio gigante senza lancette domina ogni banchina.

**Estetica.** Palette fredda: verdi ospedalieri, blu elettrico, giallo segnaletica. Luci neon che proiettano coni sul pavimento. Graffiti con riferimenti agli otto mondi.

**Layout.**
- **Mappa toroidale**: uscire da un lato riporta dall'altro (in entrambe le direzioni). Il giocatore se ne accorge solo dopo qualche minuto, vedendo lo *stesso* graffito.
- **5 banchine orizzontali** separate da **4 binari**. Il giocatore attraversa i binari liberamente.
- **Treni:** ogni binario ha un orario. Un treno annunciato da un *din-don* e dalle luci rosse sul binario (3 s) lo attraversa: elimina tutto.
- **Tornelli**: strettoie tra banchine che creano colli di bottiglia sfruttabili.
- **Scale mobili**: zone che spingono il giocatore in una direzione (ottime per fuggire, pericolose se invertite).
- **Tabellone Orari:** un elemento della HUD (vedi §5) mostra **quale binario verrà attraversato** nei prossimi 30 s.

**Nemici**
| Tipo | Nome | Comportamento |
|---|---|---|
| Base | **Pendolari Svuotati** | Silhouette in cappotto con valigetta, avanzano a ondate compatte agli "orari di punta" (ogni 3 minuti, densità ×3) |
| Base | **Biglietti Obliterati** | Sciami di biglietti di carta che volano in linea retta, attraversando i binari |
| Base | **Controllori** | Scudo frontale (un tornello portatile): bloccano i proiettili dal davanti. Contro Isaac e V1 costringono a riposizionarsi |
| Base | **Valigie Mimiche** | Ferme fino all'avvicinarsi del giocatore, poi mordono |
| Élite | **Il Macchinista Fantasma** | Arriva a bordo di un treno-fantasma fuori orario. Scende e "**chiama la fermata**": per 6 s tutti i nemici a schermo si teletrasportano sulla banchina del giocatore |
| Mid-Boss | **La Voce degli Annunci** | Un altoparlante gigante: i suoi annunci vocali generano onde sonore lungo le banchine |

**BOSS — IL CAPOSTAZIONE DELL'ULTIMA CORSA**
Un uomo altissimo in uniforme, con un fischietto d'ottone e un orologio da taschino al posto del volto. Ogni suo passo è il ticchettio di un secondo.

**Meccanica unica — "Il Deragliamento":**
1. Il Capostazione è **invulnerabile al danno normale** (subisce solo il 10%).
2. Ogni 20 s fischia e **riscrive l'orario**: il Tabellone in HUD mostra il binario e il conto alla rovescia del prossimo treno.
3. Il Capostazione **insegue il giocatore** caricando in linea retta. Il giocatore deve **attirarlo sul binario giusto nel momento esatto** in cui passa il treno: l'impatto infligge il **25% della vita massima** e lo stordisce per 5 s (danno pieno durante lo stordimento).
4. A metà vita, il Capostazione **inverte il senso di marcia dei treni** e due binari si attivano insieme.

> Combina lettura della HUD, posizionamento e "bait" del boss: un puzzle di movimento dentro un bullet hell.

---

### 4.3 STAGE 3 — **IL POZZO DELLE CAMPANE CAPOVOLTE**
*«Ogni rintocco ti porta più giù. Nessuno ha mai sentito l'ultimo.»*

**Ambientazione.** Un'immensa torre campanaria sprofondata **a testa in giù** in un abisso. Il giocatore percorre terrazze ad anello concentriche che scendono a spirale verso un fondo invisibile. Campane rovesciate, grandi come case, pendono ovunque come stalattiti.

**Estetica.** Bronzo ossidato verde-rame, pietra grigia, candele votive. Più si scende, più la palette si desatura verso il nero e il blu del Vuoto. È lo stage dove le estetiche di Hollow Knight e Blasphemous si toccano di più: sacro, decaduto, silenzioso.

**Layout — verticalità a gradoni.**
- La mappa è composta da **5 anelli concentrici** (5 "piani"), ciascuno più stretto e buio del precedente.
- **Il Rintocco:** ogni 5 minuti suona la Grande Campana. Il piano attuale crolla dopo un conto alla rovescia di 10 s e il giocatore **scende all'anello inferiore** (transizione verticale con parallasse). Gli anelli inferiori sono più piccoli: l'arena si stringe col tempo.
- **Onde di Risonanza:** ogni 60 s un'onda d'urto circolare parte dal centro. Il giocatore deve stare su una **Runa del Silenzio** (zone sicure luminose sul pavimento) o subire danno. I nemici colpiti vengono storditi: tempismo = opportunità.
- **Corde delle Campane:** colonne con corde che, se il giocatore ci passa accanto, fanno suonare una campana locale (stordimento ad area).

**Nemici**
| Tipo | Nome | Comportamento |
|---|---|---|
| Base | **Batacchi** | Pendoli di metallo che oscillano in linee fisse: ostacoli mobili che colpiscono anche i nemici |
| Base | **Coristi Muti** | Monaci incappucciati senza bocca. Creano **Zone di Silenzio** in cui le armi del giocatore **non sparano** |
| Base | **Campanari Gobbi** | Saltano da un anello all'altro, attaccano dall'alto (ombra a terra come telegrafo) |
| Base | **Ceri Votivi** | Esplodono in cera bollente che rallenta |
| Élite | **La Badessa del Rintocco** | Avvolta in un velo di bronzo. Suona una campanella che **inverte i controlli di movimento** per 3 s nell'area attorno a sé |
| Mid-Boss | **Il Campanaro Senza Lingua** | Lotta con una corda gigantesca: oscilla una campana come un mazzafrusto |

**BOSS — IL GRANDE BRONZO AFONO**
Una campana colossale, senza batacchio, sospesa al centro dell'ultimo anello. Al suo interno pulsa un cuore di cera. È *muta*: ha perso la voce, e vuole la tua.

**Meccanica unica — "La Risonanza":**
1. Ogni danno inflitto al Bronzo **riempie la sua Barra di Risonanza** (visibile sotto la barra vita).
2. A Risonanza piena, il Bronzo **rintocca**: danno letale su tutto l'anello, nemici compresi.
3. L'unico riparo è **sotto la campana stessa**: prima del rintocco, il Bronzo **si abbassa al suolo** (3 s di avviso). Il giocatore deve infilarsi sotto il bordo prima che tocchi terra.
4. **Dentro la campana**: arena chiusa, buia, con il **cuore di cera esposto** e un'orda di Coristi Muti. È l'unico momento in cui il cuore subisce danno pieno. Dopo 12 s la campana si risolleva.
5. Fase finale: la campana si spacca e il cuore di cera fugge sugli anelli, facendo suonare tutte le campane minori.

> Ribalta il genere: invece di fuggire dal pericolo, il giocatore deve **entrare nella trappola** al momento giusto.

---

### 4.4 STAGE SEGRETO — **TITOLI DI CODA**
*Sbloccato uccidendo IL CONTINUE.*

**Ambientazione.** Un vuoto nero dove scorrono, enormi, i **titoli di coda** del Patchwork. Le lettere dei nomi sono piattaforme e ostacoli; il testo scorre dal basso verso l'alto e il giocatore deve restare nell'inquadratura.

**Nemici:** **Refusi** (lettere sbagliate che si staccano dai nomi e attaccano), **Asterischi** (si moltiplicano), **Note a Piè di Pagina** (ti inseguono dal basso).

**BOSS FINALE — LA CUCITRICE.**
**Meccanica unica — "Il Campionario":** la Cucitrice possiede **i manichini degli altri sette personaggi del roster** (quelli non scelti dal giocatore) e a ogni fase ne indossa uno, usando la **loro arma iniziale e la loro evoluzione** contro il giocatore (l'Aculeo, la Moneta, lo Stygius, Badeline…). Il giocatore deve riconoscere il kit e reagire di conseguenza. All'ultima fase indossa il **manichino del personaggio del giocatore stesso**.

> *«Sai cosa c'è di più bello di un finale? …Che si può sempre scucire, e ricominciare.»*

---

## 5. Interfaccia Utente

### 5.1 Filosofia UX: "Il Banco del Sarto"
Tutta la UI è costruita come **toppe di stoffa cucite sullo schermo**, ma con disciplina moderna:
- **Centro dello schermo sempre libero**: niente UI in un raggio di 140 px dal personaggio.
- **Massimo 4 "isole" di HUD**, una per angolo, ciascuna con una sola funzione.
- **Font:** due font pixel originali — uno *serif-cucito* per titoli (glifi con piccoli punti di filo), uno sans pixel 8 px ad alta leggibilità per i numeri.
- **Bordo cucito**: ogni pannello ha bordi di 2 px con un tratteggio animato (il "filo" scorre lentamente, 1 px ogni 0,5 s): la UI sembra viva senza distrarre.
- **Bordi adattivi al personaggio**: la cornice cambia materiale secondo il personaggio (pergamena dorata per Zagreus, metallo ammaccato per V1, ferro battuto liturgico per il Penitente, pergamena strappata con macchie per Isaac…).

### 5.2 HUD in-game

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │  ← A: Filo dell'Esperienza
│ [Lv 14]                     ◎ 17:42                       ☠ 3.412  ◈ 128  │  ← B: Spoletta-timer · C: contatori
│                                                                          │
│                                                     ┌───────────────┐    │
│                                                     │ BINARIO 3 ▸ 12s│    │  ← E: Pannello Contesto (per stage)
│                                                     └───────────────┘    │
│                                                                          │
│                                   (○)                                     │  ← centro libero
│                                                                          │
│   ╭─────╮                                                                │
│  ╱ ⚔  ✦ ╲         ← F: Anello del Telaio (armi)                          │
│ │ ✧ ☻ ⚡ │                                                                │
│  ╲ ❄  ✺ ╱                                                                │
│   ╰─────╯  ♥♥♥♡♡  ◐◐◐  [STILE: A]   ← G: Risorse native                  │
│  ▣▣▣▣▣▣  ← H: Striscia passivi (toppe)                                   │
└──────────────────────────────────────────────────────────────────────────┘
```

**A — Il Filo dell'Esperienza (in alto, a tutta larghezza).**
Non una barra piena: un **filo** sottile su cui scorre un **ago** che "cuce" punti mano a mano che si raccolgono XP. I punti cuciti restano visibili. Quando l'ago arriva in fondo, il filo si tende, vibra e **si spezza in un lampo** → level-up.

**B — La Spoletta (timer, in alto al centro).**
Un rocchetto che si **svuota** con il passare dei minuti. 6 tacche per i 6 Atti. A 25:00 il filo diventa rosso; a 29:50 il rocchetto è vuoto e la "**10**" del CONTINUE è già visibile in filigrana.

**C — Contatori (in alto a destra).** Uccisioni, valuta meta (Filo), Fragole (solo se Madeline… o se il giocatore è uno che le raccoglie lo stesso).

**E — Pannello Contesto (destra, appare solo quando serve).**
Mostra l'informazione ambientale dello stage: corsia della prossima navetta (Telaio), **Tabellone Orari** (Capolinea), **conto alla rovescia del Rintocco** e posizione delle Rune del Silenzio (Pozzo). Si ritrae quando non è rilevante.

**F — L'Anello del Telaio (in basso a sinistra) — il cuore della UI.**
Le armi equipaggiate sono disposte **ad anello attorno al ritratto** del personaggio, come gli aghi su un puntaspilli.
- Ogni icona arma ha un **arco di ricarica** che si riempie attorno all'icona (lettura immediata dei cooldown).
- **Pip di livello**: 8 piccoli punti di cucitura sotto ogni icona; al livello max diventano dorati.
- **Le sinergie sono fili visibili**: due armi in sinergia sono collegate al centro dell'anello da un **filo colorato**.
  - Filo **sottile e grigio** = sinergia potenziale (manca un pezzo).
  - Filo **colorato e pulsante** = sinergia attiva.
  - Filo **dorato e teso, con scintille** = **Ricucitura pronta** (manca solo lo Strappo).
- Accessibilità: i fili hanno anche **trame diverse** (continuo, tratteggiato, a zig-zag) per i daltonici.

**G — Risorse Native (accanto all'Anello).** È qui che la UI rispetta ogni personaggio:
| Personaggio | Visualizzazione |
|---|---|
| Il Cavaliere | Maschere bianche + **Vaso dell'Anima** circolare che si riempie di bianco lattiginoso (con i 3 terzi segnati) |
| V1 | Barra PV con il **Danno Duro** in rosso scuro tratteggiato + 3 barre stamina + **Contatore di Stile** a destra con il rango che "pulsa" e oscilla quando decade |
| Zagreus | Barra PV rossa + teschi delle **Sfide alla Morte** + 3 Cristalli di Sangue (grigi quando conficcati in un nemico) |
| Madeline | **Ciocca di capelli** che cambia colore (rosso/azzurro/rosa) + barra **Ansia** viola con la sagoma di Badeline che si allunga |
| Il Prigioniero | Barra PV + **Fiaschetta** + tre gemme colorate col numero di Pergamene |
| Il Penitente | Barra PV + barra **Fervore** blu + Fiaschette di Bile + (se presente) icona della **Colpa** con freccia direzionale |
| Il Terrariano | 5 cuori + stelle di mana + **icona del tier attuale** (lingotto) |
| Isaac | Riga di cuori (rossi/anima/neri) + **oggetto attivo** con barra di carica a tacche + 6 statistiche in miniatura sul bordo sinistro (come nell'originale) |

**H — Striscia dei Passivi.** Toppe quadrate cucite in fila. Il Cavaliere mostra invece le **Tacche** (cerchi pieni/vuoti) e un bordo rosso in caso di Sovraccarico.

**Feedback nel mondo (non solo HUD):**
- **Indicatori fuori schermo** per élite e boss: piccole frecce cucite sul bordo dello schermo con l'icona del nemico.
- I **numeri di danno** sono disattivati di default (rumore visivo con 400 nemici) e attivabili; in alternativa i critici mostrano un piccolo "**✂**".
- **Vignetta cucita**: quando la vita è bassa, i bordi dello schermo vengono "cuciti" verso l'interno con punti rossi.

### 5.3 Il Menu di Level-Up — "Il Tavolo delle Toppe"

**Transizione.** Il filo dell'XP si spezza → tempo al 10% per 0,25 s → lo schermo di gioco si **sfoca e desatura** ma resta visibile (il giocatore vede ancora la situazione) → 3 **Toppe** (carte) scivolano dal basso come pezze appoggiate su un tavolo.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         ✦  LIVELLO 15  ✦                                 │
│                                                                          │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌───────────┐  │
│  │ [ICONA 32px] │   │ [ICONA 32px] │   │ [ICONA 32px] │   │ MAPPA     │  │
│  │ SPIRITO      │   │ PIETRA DELLO │   │ FENDENTE     │   │ DELLE     │  │
│  │ VENDICATIVO  │   │ SCIAMANO  ◆3 │   │ CICLONE      │   │ TRAME     │  │
│  │ ●●●●●○○○ → 6 │   │ NUOVO        │   │ NUOVO        │   │   ⚔──✧    │  │
│  │ +1 proiettile│   │ Incantesimi  │   │ Rotazione... │   │   │  ╲    │  │
│  │              │   │ +33%         │   │              │   │   ☻   ✦   │  │
│  │ ⟿ Aculeo     │   │ ⟿ Spirito V. │   │              │   │ (anteprima│  │
│  │              │   │ ★ RICUCITURA │   │              │   │  live)    │  │
│  └──────[1]─────┘   └──────[2]─────┘   └──────[3]─────┘   └───────────┘  │
│                                                                          │
│      [R] Ritira ×2        [B] Bandisci ×1        [S] Salta (+Filo)       │
└──────────────────────────────────────────────────────────────────────────┘
```

**Anatomia di una Toppa:**
1. **Icona** grande, con la cornice del colore della rarità (cotone → lino → seta → broccato d'oro).
2. **Nome** e **pip di livello** (attuali pieni, il prossimo lampeggia).
3. **Una sola riga** di effetto: solo ciò che cambia ("+1 proiettile"), non l'intero tooltip. Il dettaglio completo appare tenendo premuto il tasto.
4. **Riga Sinergia (⟿)**: elenca con mini-icone le armi già possedute con cui questa scelta fa sinergia.
5. **Badge ★ RICUCITURA** se la scelta completa i requisiti di un'evoluzione.

**Mappa delle Trame (pannello destro)** — mentre il giocatore scorre tra le toppe, il pannello mostra **in tempo reale come cambierebbe il grafo delle sue sinergie**: i nuovi fili appaiono tratteggiati e pulsanti. È la risposta alla domanda "cosa mi conviene?" senza leggere un wiki.

**Reskin per personaggio (fedeltà):**
| Personaggio | Il level-up diventa… |
|---|---|
| Il Cavaliere | Gli amuleti mostrano il **costo in Tacche**; avviso rosso di Sovraccarico |
| Zagreus | **Incontro Olimpico**: il ritratto del dio appare a sinistra con una sua battuta; le toppe hanno la cornice del dio e mostrano lo **slot** (Attacco/Speciale/Lancio/Scatto/Richiamo). I Duo hanno doppia cornice |
| Il Prigioniero | Una volta su tre: **scelta della Pergamena** (3 grandi rotoli colorati) |
| Isaac | Le opzioni sono **piedistalli di pietra**; il nome e la frase dell'oggetto appaiono in alto in stile originale dopo la scelta; il **D6** sostituisce il pulsante di Ritiro |
| Il Penitente | Le toppe sono **ex-voto** appesi a un altare |
| Il Terrariano | Le scelte di minerale aprono un mini-pannello del **Banco da Lavoro** |

### 5.4 Feedback dei Potenziamenti
| Evento | Feedback visivo | Audio | Durata |
|---|---|---|---|
| **Scelta di un potenziamento** | La toppa vola verso l'Anello del Telaio, **un ago la cuce nello slot** con 3 punti rapidi; flash del colore dell'universo ai bordi dello schermo | 3 *tic* di cucitura + jingle dell'universo d'origine | 0,4 s |
| **Nuova sinergia attiva** | Un filo colorato **si tende** tra le due icone nell'Anello; le due armi a schermo emettono un'aura del colore del filo per 2 s | Accordo di due note | 0,6 s |
| **Ricucitura pronta** | Il filo diventa dorato e teso; il prossimo Strappo a schermo ha un bagliore dorato visibile da fuori schermo | Campanella | Continuo |
| **Ricucitura (evoluzione)** | **Momento cinematico** (1,2 s, gioco in pausa): le due icone vengono **strappate**, i brandelli orbitano attorno al personaggio, la Cucitrice le **ricuce** in un'unica icona; scoppio di coriandoli di stoffa e onda d'urto che respinge i nemici | Strappo di stoffa + coro + tema del personaggio | 1,2 s |
| **Trasformazione (Isaac)** | Nome della trasformazione a tutto schermo nel font originale ("GUPPY!") | Fanfara | 1 s |
| **Rango di Stile (V1)** | Il rango sbatte sullo schermo a destra con screen-shake leggero | Annuncio vocale sintetico | 0,5 s |

### 5.5 Mappa delle Trame (schermata di pausa)
Una vista a tutto schermo: il **grafo completo** di armi, passivi e reliquie possedute come nodi-toppa, collegati da fili. Selezionando un nodo:
- si evidenziano tutte le sue connessioni;
- appare il "**ricettario**" di ciò che manca per ogni Ricucitura possibile;
- le sinergie scoperte in run precedenti sono mostrate per nome, quelle mai viste come "**???**" con un filo grigio (scoperta come ricompensa).

### 5.6 Menu Principale — "La Bottega della Cucitrice"
**Concept diegetico.** Il menu è la bottega in pixel-art della Cucitrice, vista dall'alto: un grande tavolo da lavoro illuminato da una lampada a olio.

- **Selezione personaggio:** sul tavolo ci sono **8 manichini di stoffa**. Spostando il cursore, il manichino selezionato **si anima**, la stoffa si strappa e rivela lo sprite completo del personaggio con una breve animazione idle fedele all'originale (il Cavaliere si sistema il mantello, Zagreus fa roteare la spada, Madeline si sistema i capelli, Isaac tira su col naso…). La musica sfuma nel tema del suo universo.
- **Voci di menu come rocchetti** appesi a un portarocchetti sul bordo destro: **Gioca · Campionario** (codex/bestiario/sinergie scoperte) **· Merceria** (meta-progressione) **· Opzioni · Esci**. Il rocchetto selezionato gira e srotola un filo che indica la voce.
- **Selezione stage:** una **coperta-mappa** che si srotola: ogni stage è una toppa, quelle non sbloccate sono ancora solo tracciate col gesso.
- **UX:** tutto navigabile da pad con al massimo 2 pressioni per iniziare una run ("Ricomincia con lo stesso personaggio" sempre in evidenza dopo un Game Over).

### 5.7 Schermata di Fine Run — "Il Rendiconto"
Una lunga striscia di stoffa che si srotola mostrando: tempo, uccisioni, danni per arma (barre ricamate), sinergie attivate, Fragole raccolte (inutilmente), e la **frase finale** del personaggio nel suo registro:
- Zagreus: *«Beh, almeno il panorama era nuovo.»*
- Madeline: *«…Di nuovo. Ok. Una volta ancora.»*
- V1: `RIATTIVAZIONE IN CORSO.`
- Deogracias (per il Penitente): *«Anche la caduta è preghiera, se ci si rialza.»*
- La Guida (per il Terrariano): *«Hai provato a costruire una casa?»*

---

## 6. Meta-progressione

**La Merceria.** Si spende il **Filo** (valuta meta) per:
- Potenziamenti permanenti alle statistiche globali (stile Specchio della Notte).
- Sbloccare Ritira / Bandisci / Salta.
- Sbloccare armi nel Kit Natio di ciascun personaggio (ogni personaggio ha 2–3 armi da sbloccare con sfide fedeli: es. *Ricoshot di V1* sbloccato uccidendo 3 nemici con un singolo colpo rimbalzato).
- Nuove Armi Infernali per Zagreus, il D6 per Isaac, nuovi Grani per il Penitente.
- **Campionario:** collezione di nemici, armi, sinergie e Duetti scoperti.

---

## 7. Architettura Tecnica

**Engine:** Godot 4.3+ (GDScript per gameplay, C++/GDExtension opzionale per i sistemi caldi).

**Performance target:** 60 FPS con **600 nemici + 300 proiettili** su Steam Deck.

| Sistema | Soluzione |
|---|---|
| Query spaziali (nemico più vicino, nemici in raggio) | **Spatial hash grid** ricostruita ogni frame fisico (O(n)), query in O(k) sulle celle vicine — vedi `EnemyTracker` |
| Rendering nemici | `MultiMeshInstance2D` per nemici base (un draw call per tipo), nodi completi solo per élite/boss |
| Movimento nemici base | Seek diretto + separazione via griglia (niente `move_and_slide` per i nemici base in produzione); **flow field** sugli stage con ostacoli (Capolinea, Pozzo) |
| Proiettili | Pool di oggetti, collisioni via griglia invece che via `Area2D` |
| Danno e status | Componente `HitBus` centralizzato: tutte le armi chiamano `take_hit()`, gli status (Rovina, Gelo, Sbornia…) sono timer in array paralleli |
| Dati | Armi, evoluzioni e sinergie come `Resource` (`.tres`): i designer bilanciano senza toccare codice |
| Sinergie | Grafo dichiarativo: ogni `SynergyResource` elenca i tag richiesti; la Mappa delle Trame lo legge direttamente |

---

## 8. Script di Base

Lo script di riferimento è implementato in **GDScript (Godot 4)** per **Il Cavaliere**, perché la sua arma natia condensa i tre pilastri del design: tracciamento del bersaglio, attivazione automatica e **risorsa che governa il combattimento** (l'Anima).

File in `godot/`:
| File | Ruolo |
|---|---|
| `scripts/core/enemy_tracker.gd` | **Autoload** — registro dei nemici con spatial hash grid: `get_nearest()`, `get_in_radius()`, `get_densest_direction()` |
| `scripts/core/enemy.gd` | Nemico base: insegue il giocatore, si registra/deregistra nel tracker, riceve colpi e knockback |
| `scripts/characters/knight/knight.gd` | Il Cavaliere: movimento, Maschere, invulnerabilità post-colpo, rinculo |
| `scripts/characters/knight/knight_nail.gd` | **L'Aculeo**: fendente automatico a 4 direzioni, guadagno di Anima, auto-cast di Spirito Vendicativo, Focus automatico con *Priorità dell'Anima* |
| `scripts/characters/knight/vengeful_spirit.gd` | Proiettile perforante dello Spirito Vendicativo |
| `scripts/debug/test_arena.gd` | Arena di prova autosufficiente (nessun asset richiesto): genera ondate di nemici e disegna tutto con primitive |

Aprire `godot/project.godot` con Godot 4.3+ e premere **F5**: la scena `test_arena.tscn` avvia il prototipo (WASD per muoversi).

---

## 9. Alfa 0.1 (web)

La prima build giocabile vive in `web/`: HTML5 canvas a 640×360 con scaling pixel-perfect e nessuna dipendenza.

| Area | Stato nell'alfa |
|---|---|
| Durata run | Ridotta: élite a 1:30, 3:00 e 4:30, boss a 6:00, IL CONTINUE a 10:00 (il design finale resta di 30 minuti) |
| Roster | 8/8 personaggi con risorsa, abilità natia, kit di 3–6 armi, passivi propri, sinergie ed evoluzioni |
| Stage | 3/3 stage con pericoli (navette e strappi; treni e ora di punta; rintocchi e onde di risonanza), élite e boss. Lo stage segreto *Titoli di Coda* non è ancora presente |
| UI | Filo dell'esperienza, Anello del Telaio con fili delle sinergie, risorse native per personaggio, pannello di contesto, Tavolo delle Toppe con Mappa delle Trame, pausa, rendiconto |
| Rimandati | Meta-progressione (Merceria), Duetti del Multiverso, co-op, musica |

Gli sprite sono pixel-art originale definita in codice (`web/js/sprites.js`) e ricevono in automatico il contorno d'inchiostro della Regola della Cucitura.


---

## 10. Alfa 0.2: risposte alle critiche

### Il gioco ha un obiettivo finale?
Sì. La modalità **Storia (La Scala dei Finali)** ha un inizio e una fine: Prologo (il Telaio), 8 capitoli, uno per ogni gioco del roster, e il Finale contro **la Cucitrice**. Ogni capitolo si chiude con il boss finale "vero" di quel gioco. Battere la Cucitrice mostra il finale scritto per il personaggio scelto. I capitoli completati restano segnati e i finali sono 8, uno per eroe.

### Qual è il game loop?
- **Loop della run (5–8 minuti):** muoviti → le armi colpiscono → raccogli i frammenti → scegli un potenziamento. Ogni minuto circa arriva un **evento**. Al minuto 2:30 c'è il **mini-boss** del mondo, poi l'ambiente cambia. Al minuto 5:00 arriva il **boss finale**, preceduto da un dialogo.
- **Loop della meta:** ogni run, vinta o persa, dà **Filo**. Il Filo si spende nella **Merceria di Sor Ditale** in potenziamenti permanenti. Si prova il capitolo successivo o un altro eroe, con cui cambiano dialoghi e finale.

### Eventi durante la run
| Evento | Cosa chiede | Il prezzo |
|---|---|---|
| **Rammendo** | Restare 10 s dentro un cerchio | Mentre ci sei arrivano più nemici |
| **Il Rocchetto d'Oro** | Portare un oggetto da A all'altare B | Mentre lo porti sei più lento del 25% e le armi rallentano; 3 colpi e cade |
| **Un volto noto** | Raggiungere un altro eroe del roster | Nessuno: dialogo tra i due personaggi e un dono a scelta |
| **Taglia** | Prendere un nemico d'oro che scappa | 25 secondi di tempo |

### Oggetti con un "trucco" che si combinano
Sono le **Reliquie del Multiverso** (bordo dorato), che non occupano slot. Ago Infilato cuce due nemici e il danno passa dall'uno all'altro. Bottone Esplosivo fa esplodere i nemici uccisi. Specchio Incrinato fa rimbalzare i proiettili. Lacrima Gelata fa congelare i critici. Patto della Cucitrice dà più danno ma nemici più veloci. Ditale del Collezionista aumenta il danno in base ai frammenti raccolti.
Si combinano in tre **Duetti**: *Cucito Esplosivo*, *Schegge di Ghiaccio* e *Avidità Cucita*.

### Personalità
- Ogni personaggio ha la sua **voce sintetizzata a bip**, con timbro e altezza propri. I muti restano muti e le loro azioni compaiono tra parentesi quadre.
- Ci sono incontri scritti tra coppie di eroi (Cavaliere e Penitente: un lunghissimo silenzio "ottima conversazione"), un mercante con le battute (**Sor Ditale**), frasi a rotazione sul titolo e uno **scontrino della merceria** come schermata finale.
- **Nota onesta:** l'anima di un gioco viene dalle scelte di chi lo fa. Questa alfa è uno strumento per provare le idee. La direzione artistica definitiva, l'umorismo e i difetti "voluti" dovrebbero venire dall'autore.

### Altre modifiche
- **Grafica:** sprite più grandi e ombreggiati con camminata a 3 fotogrammi, luci dinamiche, particelle d'ambiente per ogni mondo, cambio d'atmosfera a metà run, armi visibili in mano (V1 cambia arma con l'animazione "SWITCH"; il Terrariano usa l'oggetto sopra la testa come in Terraria), i capelli di Madeline che ondeggiano, schede col titolo dei boss.
- **Bilanciamento:** eroi indeboliti (danno base −10%, curva dell'esperienza più ripida) e nemici indeboliti (danno −20%, vita che cresce più lentamente). Il raggio di raccolta passa da 40 a 50 px.

## 11. Alfa 0.3 — Note di rilascio

- **Nuovo stile grafico** (`web/js/pix.js`): rasterizzatore con rampe di 5 toni con hue-shift, luce dall'alto a sinistra, ombre di contatto, selective outline e materiali emissivi. Lo stile si ispira alla reference di V1 fornita.
- **Sprite ridisegnati**:
  - 8 eroi con animazioni di respiro, battito di ciglia, camminata a 4 frame e frame di danno (`art_heroes.js`);
  - 49 tra nemici e mini-boss, con 2 frame ciascuno;
  - 9 boss, con frame propri per la fase 2 (`art_world.js`).
- **Fix dell'XP**: le gemme attratte non orbitano più attorno al personaggio. L'homing ora è diretto, senza inerzia, e la raccolta è garantita.
- **Armi visibili e animate** (`art_fx.js`):
  - sprite dedicati per ogni arma;
  - swing con easing e afterimage, scie a mezzaluna e scintille sugli impatti;
  - V1 punta l'arma attiva, con rinculo, flash della bocca da fuoco e bossoli espulsi.
- **Sfondi**: tile dipinte proceduralmente (ciottoli, mattoni, marmo, greco, neve, erba, sabbia, vuoto), oggetti di scena dipinti, raggi di luce e vignettatura.
- **HUD**:
  - barre con gradiente, scia del danno e riflesso;
  - badge del livello e targa del timer;
  - barra boss ornata;
  - slot armi a medaglione con cooldown a torta;
  - ritratto circolare.
- **Voice line variabili** (`voices3.js`):
  - pool alternativi senza ripetizioni consecutive per selezione, saluti, intro e sconfitta dei boss, incontri e finali;
  - battute contestuali in gioco (level-up, HP basso, evoluzione, boss, evento, inattività).

## 12. Alfa 0.4 — Co-op, modalità, Ultimate e Merceria

### 12.1 Flusso dei menu
`INIZIA` → **Singolo** o **Co-op locale (2–4)** → **Storia** o **Endless** (più le Toppe classiche) → scelta dell'eroe (singolo) o lobby (co-op) → capitolo / mondo di partenza.

### 12.2 Co-op locale (fino a 4)
- **Dispositivi:** Tastiera A (WASD), Tastiera B (frecce), Tastiera C (IJKL), Tastierino numerico, Gamepad 1–4. Nella lobby si entra premendo il tasto abilità del proprio dispositivo.
- **Architettura:** ogni giocatore ha uno *slot* con il proprio stato (`p`, `char`, armi, passivi, statistiche…). Quando è il suo turno di aggiornarsi, di subire danno o di essere disegnato, lo slot viene caricato in `G` (`usePl`/`withPl` in `js/coop.js`), quindi tutte le armi e abilità esistenti funzionano senza modifiche.
- **Nemici:** inseguono il giocatore vivo più vicino. Telegrafi, proiettili e contatti colpiscono chiunque ci sia dentro.
- **Esperienza:** condivisa. A ogni livello sceglie un giocatore alla volta e il titolo dice chi.
- **Gemme:** in co-op prendono a caso la valuta di uno dei giocatori. Le raccoglie chi le attira.
- **A terra:** il giocatore resta come sagoma. Un compagno che gli sta vicino 2,5 s lo rianima al 40%. Se cadono tutti, la run finisce. Battere un boss rialza tutti.
- **Schermo condiviso:** la telecamera inquadra il riquadro che contiene tutti, e i giocatori non possono allontanarsi oltre lo schermo.
- **Scalatura:** con *n* giocatori i nemici hanno +55% vita per ogni giocatore oltre il primo e ne nascono +35%; i boss hanno +60% vita per giocatore aggiuntivo.

### 12.3 Storia: 20 minuti per capitolo

| Minuto | Evento |
|---|---|
| 0–5 | Nemici del mondo, eventi ogni ~60 s, orde dal 2:30 |
| 5:00 | Mini-boss del mondo |
| 7:00 | Iniziano gli **intrusi** da un altro mondo |
| 10:00 | Mini-boss intruso; l'ambiente cambia (seconda atmosfera) |
| 12:00 | Arrivano nemici **rinforzati** (più grandi, ×3,2 vita, ×4 esperienza) |
| 15:00 | Mini-boss del mondo rinforzato (+50% vita) |
| 17:30 | Avviso «Il boss si avvicina» |
| 18:00 | **Boss finale** |
| 22:00 | Il Continue, se il boss è ancora vivo |

### 12.4 Endless: il Telaio Infinito
- I mondi si susseguono in ordine casuale, con i Titoli di Coda ogni 9. In ogni mondo il mini-boss arriva al 2:30 e il boss al 5:00.
- Ogni mondo successivo aumenta la difficoltà: `G.nodes` cresce di 1, quindi +22% vita e +10% danno dei nemici, e +35% vita dei boss.
- **Storia dell'Endless:** ogni boss battuto sblocca una delle 12 *Memorie del Telaio*, che si possono rileggere nella Merceria. Raccontano chi era la Cucitrice: una sarta che non voleva lasciar finire le storie. Spiegano anche perché il Telaio non si ferma e cosa succede quando gli eroi vincono. L'Endless ha così una ragione narrativa: ogni vittoria allenta un filo.
- Si salvano i record: punto massimo raggiunto e tempo.

### 12.5 Esperienza
- **Curva:** come in Vampire Survivors. Si parte da 5 XP; il fabbisogno cresce di 10 per livello fino al 20, di 13 fino al 40, poi di 16.
- **Regolazione sul livello:** un livello atteso per minuto (`4 + 0.072·t − 0.0000165·t²`, circa 25 al 5' e 66 al 20') modula il valore dei frammenti tra ×0,45 e ×1,8. Chi è indietro recupera e chi è molto avanti rallenta.
- **Valore dei frammenti:** il valore base del nemico × (1 + t/420).
- **Frammenti a 4 grandezze:** piccolo, medio, grande e raro, nella valuta di ogni eroe: Geo, sangue, Oscurità, cristalli, Cellule, Lacrime, monete Terraria (rame/argento/oro/platino), centesimi di Isaac.

### 12.6 Oggetti in gioco
- **Distruttibili:** uno per mondo (lanterna di lucciole, urna del Tartaro, vaso di Terraria…). Si rompono come le candele di VS e lasciano cibo, Filo, frammenti o un oggetto speciale.
- **Oggetti speciali:**
  - Rosario delle Lacrime: uccide i nemici a schermo.
  - Clessidra di Crono: congela tutto per 6 s.
  - Bomba.
  - Calamita da Sarta.
  - Borsa e Sacco di Filo.
  - Sfera dell'Ultimate: +35% di carica.
  - Ago d'Oro: +1 rianimazione.
- **Orde:** dal 2:30 circa ogni 90 s arriva un accerchiamento oppure una carica (mandria che attraversa lo schermo).

### 12.7 Ultimate (si comprano nella Merceria)
Si caricano uccidendo, infliggendo e subendo danno; si usano con **E** (pad **Y**). Ognuna ha un cut-in a tutto schermo.

| Eroe | Ultimate | Mossa originale |
|---|---|---|
| Cavaliere | Urlo dell'Abisso | Abyss Shriek |
| V1 | Railcannon Elettrico | Electric Railcannon |
| Zagreus | Chiamata dell'Olimpo (cambia con il dio) | Chiamate divine di Hades |
| Madeline | Spinta di Badeline | Badeline boost, Capitolo 6 |
| Prigioniero | Runa dell'Omuncolo | Homunculus Rune |
| Penitente | Mattutino del Guardiano | Aubade of the Nameless Guardian |
| Terrariano | Ultimo Prisma | Last Prism |
| Isaac | Mega Laser | Mega Blast |

### 12.8 Merceria in stile Vampire Survivors
- **15 potenziamenti con più livelli:**

  | Gruppo | Potenziamenti |
  |---|---|
  | Offesa | Danno, Ricarica, Area, Durata |
  | Difesa | Armatura, Vita, Rigenerazione, Rianimazione |
  | Movimento e raccolta | Velocità, Magnetismo |
  | Progressione | Fortuna, Crescita, Avidità, Maledizione, Ritira |

- **Prezzo:** `base × (livello+1) × (1 + 10% per ogni acquisto già fatto)`. Il pulsante «Rimborsa tutto» restituisce il Filo speso.
- **Schede:** Potenziamenti · Ultimate · Memorie del Telaio.

### 12.9 HUD
- **In alto a sinistra:** le file separate **ARMI** e **SUPPORTO**.
  - Armi: pallini di livello; cornice d'oro al massimo; bordo pulsante quando la Ricucitura è pronta; ricarica come velatura che scende.
  - Supporto: passivi, amuleti e reliquie.
- **In basso a sinistra:** il ritratto, con l'anello dell'Ultimate e il badge del tasto.
- **Level-up:** le carte sono etichettate «ARMA» (oro) o «SUPPORTO» (verde acqua), coerenti con l'HUD.
- **Co-op:** un pannello compatto per giocatore con il suo colore, l'etichetta P1–P4 sopra ogni eroe e l'anello colorato ai piedi.

### 12.10 Arte dell'Alfa 0.4
- **Eroi dai riferimenti forniti:** Cavaliere, Madeline (con le varianti dei capelli blu e rosa e con Badeline), Isaac, Prigioniero e Penitente sono stati ricalcati a risoluzione nativa dalle immagini di riferimento dell'utente, poi puliti e animati:
  - respiro;
  - battito di ciglia;
  - camminata a 4 fotogrammi;
  - fotogramma di danno.
  
  Il Prigioniero ha una fiamma alternata, una versione senza testa e la testa-Omuncolo separata. Badeline ha i capelli fluttuanti e non ha lo zaino.
- **Zagreus e il Terrariano:** ridisegnati nello stesso stile. Zagreus ha i piedi in fiamme animati.
- **Metadati `HERO_META`:** la mano e la testa di ogni eroe. L'arma impugnata, gli accessori di Isaac e la luce della fiamma del Prigioniero si agganciano lì.
- **Boss:** ridisegnati con due fotogrammi di idle e un aspetto di seconda fase. Sono Hollow Knight, Gabriele, Ade, Mano del Re, Escribar, Signore della Luna (con le mani sugli stessi punti delle hitbox), Mamma, l'occhio di Mamma e la Cucitrice.
- **Mini-boss:** ridisegnati il Falso Cavaliere, lo Swordsmachine, Megera, il signor Oshiro, Ten Piedad, l'Occhio di Cthulhu, Monstro e il Concierge.
- **Oggetti e icone:**
  - frammenti a 4 grandezze per ogni valuta;
  - 8 oggetti speciali;
  - 9 oggetti distruttibili con fiamma animata;
  - icone delle 8 Ultimate;
  - 18 icone dei potenziamenti della Merceria.
- **Metodo:** per ogni foglio un artista ha disegnato e un direttore artistico indipendente ha confrontato il risultato con i riferimenti e con le descrizioni ufficiali, poi l'ha corretto.

## 13. Alfa 0.5 — Boss a fasi, bilanciamento e nuove icone

### 13.1 Bilanciamento delle armi
- **Mischia più generosa:** portata e arco più ampi per Aculeo, Stygius, Spada Arrugginita, Mea Culpa e Spada Corta. La curva di danno dell'Aculeo sale con i livelli.
- **Madeline:** lo Scatto mira da solo al nemico vicino (anche da ferma) e all'arrivo esplode in un piccolo impatto.
- **Isaac:** le lacrime hanno una leggera ricerca del bersaglio, così non mancano più chi sta in diagonale.
- **Discesa Desolata:** il suo danno ora è attribuito correttamente e costa di più. Prima era una fonte "nascosta" da ~320 DPS.
- **Armi deboli rinforzate:** Theo, Badeline, Minishark e Apicoltore.
- **Armi "da folla" contro i boss:** incantesimi del Cavaliere, preghiere del Penitente e rotazioni contano un boss, un mini-boss o un punto debole come una piccola folla. I Verdiales si orientano verso il nemico più temibile.
- **Banco di prova:** uno script misura i DPS di ogni personaggio contro un'orda e contro un bersaglio singolo, con l'arma iniziale e con il kit completo.

### 13.2 Cura di V1
Il sangue non cura più all'istante. Riempie una **riserva** (massimo 30, barra «SANGUE» nell'HUD) che si converte in vita al massimo a 10 PV al secondo, e solo dai nemici vicini. Il Danno Duro resta un tetto. Il cibo diventa «sangue rappreso» che va nella riserva.

### 13.3 Oggetti a terra
- I drop casuali dai nemici sono al massimo **uno ogni 25 s**.
- Gli oggetti distruttibili compaiono più di rado (al massimo 4, uno ogni 7 s) e lasciano più spesso frammenti che oggetti.
- I pickup lampeggiano e poi spariscono dopo un po'.

### 13.4 Boss a fasi
Ogni boss di fine capitolo ha **tre fasi** (soglie al 66% e al 33% di vita); ogni mini-boss ne ha **due** (al 50%).

**Il cambio di fase:**
- il boss diventa invulnerabile per un istante e respinge chi è vicino;
- spariscono i proiettili nemici e i nemici comuni attorno;
- il boss pronuncia la sua battuta;
- compare il titolo «FASE n DI 3» con il nome della fase (per i mini-boss, un banner).

Ogni fase ha la sua aura, il suo ritmo e il suo repertorio di attacchi. Un colpo enorme non può far saltare una fase: la vita si ferma alla soglia.

**Nuovi mattoni degli attacchi** (tutti telegrafati):
- **Bersagli e minacce sul campo:**
  - muri di proiettili con un varco segnato in oro;
  - anelli di lame che si chiudono sul giocatore, con un varco;
  - onde d'urto ad anello con varchi;
  - pozze ostili che restano a terra (fuoco, sangue, luce, Infezione, polvere, luna).
- **Attacchi del boss:**
  - **Purificazione:** lo schermo diventa rosso tranne alcuni cerchi sicuri, uno vicino a ogni giocatore;
  - fasci multipli che ruotano;
  - parata con contrattacco circolare;
  - scudo frontale da aggirare.
- **Alleati e bersagli secondari del boss:**
  - **punti deboli:** il boss è protetto finché non li distruggi;
  - riflessi e servitori con un proprio copione;
  - **inseguitrici** che ripercorrono il tuo stesso percorso;
  - le porte della Mamma, con occhio che spara e mano che afferra.
- **Arena che si stringe.**

| Boss | Fase 1 | Fase 2 | Fase 3 |
|---|---|---|---|
| Il Cavaliere Cavo | **Il Vaso Puro**: combo d'Aculeo, parata | **Le Catene si Spezzano**: spine d'Infezione, pozze, Concentrazione ad area | **La Luce Radiosa**: si trafigge (vulnerabile), muri di spade di luce, tre fasci rotanti |
| Gabriele | **Giudice dell'Inferno**: combo in tre tempi, lance incrociate | **Spade dello Spirito**: anello di spade, giavellotto che esplode | **Apostata dell'Odio** (aspetto rosso): croce di fasci mentre insegue, muri di lance, doppio anello |
| Ade | **Signore dei Morti**: lancia rotante, anime che inseguono | **Le Urne del Tartaro**: tre urne gli girano intorno e lo proteggono; agguati invisibili | **L'Ira del Padre**: bidente che incendia il suolo, triplo agguato, anello di teschi |
| Badeline | **Riflesso**: raffiche e laser | **Specchi**: tre riflessi che sparano laser (solo una è vera), fuoco incrociato | **Il Picco**: inseguitrici sul tuo percorso, stella di laser, anello di cristalli |
| La Mano del Re | **Guardiano del Trono**: scudo frontale (colpiscilo alle spalle), carica | **Per il Re!**: bombe incendiarie, lancia di fuoco, scudo che spara fiamme | **L'Ultimo Giuramento**: triplo schianto con onde d'urto, cerchio di fuoco con varco, muri di fiamme |
| Escribar | **L'Ultimo dei Supremi**: pioggia di luce, sangue | **Penitenza**: purificazione con cerchi di luce, croce di luce rotante | **La Mostruosità Santa** (forma rossa): corona di spine, raggio enorme, muri di sangue |
| Il Signore della Luna | **Il Risveglio**: tre occhi da distruggere (mani e fronte) prima di poter colpire il corpo | **Il Cuore Esposto**: Veri Occhi di Cthulhu in orbita, raggio della morte dal petto | **Il Signore della Luna**: due raggi opposti rotanti, spirali di dardi, pioggia lunare |
| La Mamma | **La Mamma**: pestoni, porte con occhio e mano che afferra (occhio e mano si possono colpire) | **ISAAC!**: tre pestoni con chiazze di sangue, tutte e quattro le porte | **Il Cuore della Mamma**: il cuore batte e lancia onde d'urto, sangue, pozze |
| La Cucitrice | **La Sarta**: maschere dei boss, cuciture che attraversano lo schermo | **Il Telaio**: l'arena si restringe, fili d'oro rotanti, maschere di Signore della Luna, Escribar e Gabriele | **L'Ultimo Filo**: due maschere alla volta, «tutti i finali insieme» |

| Mini-boss | Fase 1 | Fase 2 |
|---|---|---|
| Falso Cavaliere | La Mazza | Il Verme nella Corazza: tre salti, onda d'urto, si espone |
| Spadacchina | Spadacchina | Furia: spada-boomerang doppia, trottola |
| Megera | La Frusta | Le Sorelle Furie: arrivano Aletto (carica) e Tisifone (frusta a distanza) |
| Signor Oshiro | Il Signor Oshiro | L'Albergo è Chiuso: quattro cariche che lasciano polvere |
| Il Portinaio | Il Portinaio | Aura Infuocata: aura che brucia, doppio schianto con onde |
| Ten Piedad | Ten Piedad | Senza Pietà: onde d'urto, croce di spine |
| Occhio di Cthulhu | L'Occhio | La Bocca: l'iride diventa una bocca, cinque cariche |
| Monstro | Monstro | Monstro Infuriato: saltelli a catena, pioggia di lacrime |

### 13.5 Leggibilità degli scontri
- **Mira delle armi:** le armi danno una priorità morbida a boss, mini-boss e punti deboli. Ignorano i bersagli invulnerabili o nascosti.
- **Orda:** durante un boss l'orda si dirada al 15%, durante un mini-boss al 55%.
- **Lampeggio dei boss:** colpiti, lampeggiano al massimo 4 volte al secondo, così restano leggibili sotto il fuoco continuo.
- **Barra del boss:**
  - mostra le tacche delle soglie e «FASE n/3 · nome»;
  - indica lo stato: protetto, scudo alzato, parata, vulnerabile;
  - anche i mini-boss hanno la loro barra;
  - una Mamma nascosta parla con una nuvoletta sotto la barra.
- **Telegrafi:** quelli di un boss si annullano se muore o cambia fase.
- **Danni:** il contatto con i boss e gli attacchi medi restano sotto la soglia del «colpo pesante». Solo pestoni, purificazioni e attacchi ad area molto telegrafati tolgono 2 maschere o 2 cuori.

### 13.6 Icone e oggetti
- **Icone:** ogni arma, evoluzione, oggetto, amuleto, dono degli dèi, pergamena e reliquia ha un'icona 16×16 disegnata a mano (file `art5_icons_*.js`), nello stile del gioco d'origine. Le icone compaiono:
  - nelle carte del level-up;
  - nell'HUD;
  - nella Mappa delle Trame;
  - nella scena della Ricucitura.
- **Slot dell'HUD:** gli slot di supporto sono grandi come quelli delle armi, così le icone restano nitide.
- **Spada Corta:** la lama si colora del minerale del suo livello.
- **Cibo a terra:** cambia con il mondo:
  - bozzolo di Linfa Vitale;
  - fiala di sangue;
  - melagrana;
  - cioccolata calda;
  - pollo arrosto;
  - Fiasca di Bile;
  - pozione di cura;
  - cuore;
  - pasticcino di pezza.
