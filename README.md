# Patchwork Eternity

*Survivors of the Stitched Multiverse*: concept di un Action Roguelike / Reverse Bullet Hell in stile Vampire Survivors, con un crossover di protagonisti indie.

- 📜 **Game Design Document:** [`docs/GDD.md`](docs/GDD.md)
- 🎮 **Prototipo Godot 4.3+:** [`godot/`](godot/). Contiene il tracciamento dei nemici (spatial hash) e l'Aculeo automatico del Cavaliere, con Anima, Spirito Vendicativo e Focus.

Per avviare il prototipo, apri `godot/project.godot` con Godot 4.3+ e premi F5. Ti muovi con WASD o con le frecce, R riavvia dopo il Game Over.

## Alfa giocabile (web)

La cartella [`web/`](web/) contiene l'alfa 0.4. Gira direttamente nel browser, senza dipendenze: basta aprire `web/index.html` tramite un server locale (per esempio `python3 -m http.server` lanciato dentro `web/`).

**Modalità**
- **Singolo** o **Co-op locale fino a 4 giocatori** sullo stesso schermo, con tastiera divisa (WASD, frecce, IJKL, tastierino) e fino a 4 gamepad.
- **Storia**: 9 capitoli da 20 minuti. In ogni capitolo arrivano mini-boss, intrusi da altri mondi, orde e il boss finale del gioco di origine.
- **Endless (il Telaio Infinito)**: i mondi si susseguono senza fine. Ogni boss sblocca una delle 12 Memorie che raccontano la storia della Cucitrice.

**Contenuti**
- 8 personaggi con kit, risorsa e abilità fedeli al gioco d'origine, evoluzioni (Ricuciture) e un'**Ultimate** ciascuno, da comprare in negozio.
- **Merceria** in stile Vampire Survivors: 15 potenziamenti a livelli, rimborso completo, scheda Ultimate e archivio delle Memorie.
- Frammenti d'esperienza a 4 grandezze nella valuta di ogni eroe. La curva XP segue quella di VS ed è regolata sul livello atteso per il minuto della run.
- Oggetti distruttibili per ogni mondo e oggetti speciali: Rosario, Clessidra, Bomba, Calamita, Borse di Filo, Sfera dell'Ultimate, Ago d'Oro.
- HUD con file separate **ARMI** e **SUPPORTO**, ritratto con l'anello dell'Ultimate e pannelli per giocatore in co-op.
- Comandi da tastiera, gamepad e touch, più la Modalità Assistenza.
