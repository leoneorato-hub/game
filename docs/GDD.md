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

