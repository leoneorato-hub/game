# Patchwork Eternity

*Survivors of the Stitched Multiverse*: concept di un Action Roguelike / Reverse Bullet Hell in stile Vampire Survivors, con un crossover di protagonisti indie.

- 📜 **Game Design Document:** [`docs/GDD.md`](docs/GDD.md)
- 🎮 **Prototipo Godot 4.3+:** [`godot/`](godot/). Contiene il tracciamento dei nemici (spatial hash) e l'Aculeo automatico del Cavaliere, con Anima, Spirito Vendicativo e Focus.

Per avviare il prototipo, apri `godot/project.godot` con Godot 4.3+ e premi F5. Ti muovi con WASD o con le frecce, R riavvia dopo il Game Over.

## Alfa giocabile (web)

La cartella [`web/`](web/) contiene l'alfa 0.1, che gira direttamente nel browser senza dipendenze. Basta aprire `web/index.html` tramite un server locale, per esempio `python3 -m http.server` lanciato dentro `web/`.

- 8 personaggi, ognuno con il proprio kit, una risorsa, un'abilità e le evoluzioni (Ricuciture)
- 3 stage originali con pericoli ambientali, un élite e un boss dalla meccanica unica
- HUD "Banco del Sarto", menu di level-up con la Mappa delle Trame, pausa e rendiconto di fine run
- Comandi da tastiera, gamepad e touch, più la Modalità Assistenza

