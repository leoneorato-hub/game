'use strict';
// =============================================================================
// STORIA, VOCI E DIALOGHI (Alfa 2)
// Le "voci" sono suoni sintetizzati a ogni lettera, diversi per ogni
// personaggio (timbro, altezza, ritmo), come nei giochi che fanno parlare il
// testo. I personaggi muti non producono suoni: le loro azioni sono tra [ ].
// =============================================================================

const VOICES = {
  knight: { name: 'Il Cavaliere', col: '#f4f1e8', wave: null, spr: 'knight' },
  v1: { name: 'V1', col: '#7ec8ff', wave: 'square', f: 520, v: 0, step: 1, spr: 'v1' },
  zagreus: { name: 'Zagreus', col: '#ff6a5a', wave: 'triangle', f: 210, v: 60, spr: 'zagreus' },
  madeline: { name: 'Madeline', col: '#ff8a9a', wave: 'sine', f: 430, v: 90, spr: 'madeline' },
  prisoner: { name: 'Il Prigioniero', col: '#57d6c8', wave: null, spr: 'prisoner' },
  penitent: { name: 'Il Penitente', col: '#e2c46a', wave: null, spr: 'penitent' },
  terrarian: { name: 'Il Terrariano', col: '#7aff9a', wave: null, spr: 'terrarian' },
  isaac: { name: 'Isaac', col: '#bfe4ff', wave: 'sine', f: 620, v: 140, spr: 'isaac' },
  guide: { name: 'La Guida', col: '#c9e08a', wave: 'triangle', f: 330, v: 50, spr: 'terrarian' },
  deogracias: { name: 'Deogracias', col: '#e2c46a', wave: 'sine', f: 170, v: 20, step: 3, spr: 'p_candles' },
  radiance: { name: 'Eco della Radianza', col: '#ffd27a', wave: 'sine', f: 880, v: 220, step: 3, boss: 'hollowknight' },
  gabriel: { name: 'Gabriele', col: '#ffe680', wave: 'sawtooth', f: 250, v: 30, boss: 'gabriel' },
  hades: { name: 'Ade', col: '#ff4a3a', wave: 'sawtooth', f: 105, v: 20, step: 3, boss: 'hades' },
  badeline: { name: 'Badeline', col: '#c96aff', wave: 'sine', f: 300, v: 90, boss: 'badelineboss' },
  hand: { name: 'La Mano del Re', col: '#ffb03a', wave: 'square', f: 130, v: 20, step: 3, boss: 'handofking' },
  escribar: { name: 'Escribar', col: '#fff2b0', wave: 'sine', f: 150, v: 10, step: 3, boss: 'escribar' },
  moonlord: { name: 'Il Signore della Luna', col: '#7ff0e0', wave: 'sawtooth', f: 60, v: 10, step: 3, boss: 'moonlord' },
  system: { name: '', col: '#b080ff', wave: 'square', f: 660, v: 0, step: 2, spr: 'p_crystal' },
  mom: { name: 'La Mamma', col: '#ff5a6a', wave: 'triangle', f: 230, v: 70, boss: 'mom' },
  cucitrice: { name: 'La Cucitrice', col: '#e2b04a', wave: 'sine', f: 700, v: 30, step: 3, boss: 'cucitrice' },
  narratore: { name: 'Il Narratore', col: '#efe6d2', wave: 'triangle', f: 260, v: 30, step: 2, spr: 'p_candles' },
  ditale: { name: 'Sor Ditale', col: '#e2b04a', wave: 'square', f: 360, v: 80, spr: 'ditale' },
  boss: { wave: 'square', f: 200, v: 40 },
  grunt: { wave: 'sawtooth', f: 90, v: 20 },
  robot: { wave: 'square', f: 440, v: 0 },
  fury: { wave: 'sawtooth', f: 330, v: 60 },
  oshiro: { wave: 'triangle', f: 380, v: 120 },
};

// Un "bip" di voce
function blip(vid, ch, i) {
  const v = VOICES[vid];
  if (!AC || !v || !v.wave || SET.vol <= 0) return;
  if (!/[a-zà-ù0-9]/i.test(ch)) return;
  const now = AC.currentTime;
  const o = AC.createOscillator(), g = AC.createGain();
  const code = ch.toLowerCase().charCodeAt(0);
  o.type = v.wave;
  o.frequency.setValueAtTime(v.f + ((code * 37 + i * 13) % 100) / 100 * v.v, now);
  g.gain.setValueAtTime(0.045 * SET.vol, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
  o.connect(g); g.connect(AC.destination);
  o.start(now); o.stop(now + 0.07);
}
function voiceBlips(vid, text, max = 12) {
  const clean = text.replace(/\[[^\]]*\]/g, '');
  let n = 0;
  for (let i = 0; i < clean.length && n < max; i += 2) { const ch = clean[i]; if (/\w/.test(ch)) { setTimeout(() => blip(vid, ch, i), n * 55); n++; } }
}

// --- Battute ------------------------------------------------------------------------
const CHAR_VS = {
  knight: [['knight', '[Il Cavaliere sguaina l\'Aculeo. Non ha bisogno di parole.]']],
  v1: [['v1', '> OBIETTIVO: {boss}. PROTOCOLLO: ELIMINAZIONE.']],
  zagreus: [['zagreus', 'Ho affrontato mio padre più volte di quante tu possa contare. Fatti sotto.']],
  madeline: [['madeline', 'Ok. Respira. È solo un\'altra montagna. …Una montagna molto arrabbiata.']],
  prisoner: [['prisoner', '[Fa roteare la spada. Poi indica {boss} e gira il pollice verso il basso.]']],
  penitent: [['penitent', '[Il Penitente stringe la Mea Culpa.]'], ['deogracias', 'Il Penitente non conosce paura, {boss}. Solo penitenza.']],
  terrarian: [['guide', 'Ok! Ricorda: punta ai punti deboli. …Tutto è un punto debole, se colpisci abbastanza!']],
  isaac: [['isaac', '*singhiozza* …p-perché sono tutti così grandi?']],
};
const CHAR_ARRIVE = {
  knight: ['[Il Cavaliere scuote la polvere dal mantello e si guarda intorno.]', '[Un altro regno. Il Cavaliere avanza.]'],
  v1: ['> AMBIENTE SCONOSCIUTO. SANGUE RILEVATO: SÌ. PROCEDERE.', '> NUOVO STRATO. OSTILI IN AVVICINAMENTO.'],
  zagreus: ['Bene, bene. Nuovo arredamento. Qualcuno ha decisamente buon gusto per il macabro.', 'Ancora un\'uscita che non porta da nessuna parte. Adoro.'],
  madeline: ['Ok… nuovo posto, nuove cose che vogliono uccidermi. Normale amministrazione.', 'Un passo alla volta, Madeline. Un passo alla volta.'],
  prisoner: ['[Il Prigioniero annusa l\'aria. Non ha il naso. Lo fa lo stesso.]', '[Si stiracchia. Le cellule scricchiolano.]'],
  penitent: ['[Il Penitente si inginocchia, prega in silenzio, si rialza.]'],
  terrarian: ['[Il Terrariano estrae il piccone e colpisce il terreno, per abitudine.]'],
  isaac: ['*tira su col naso* …dove sono?', '…m-mamma?'],
};
const HOME_ARRIVE = {
  knight: [['cucitrice', 'Ti riconosci, piccolo recipiente? Le tue strade, la tua pioggia, la tua Infezione. Ho cucito tutto, con cura.'], ['knight', '[Il Cavaliere tocca la pietra. È fredda come la ricordava.]']],
  v1: [['cucitrice', 'L\'Inferno ti accoglie di nuovo, macchina. Qualcuno, qui, ti sta aspettando.'], ['v1', '> FIRMA ANGELICA RILEVATA. ARMI: CARICHE.']],
  zagreus: [['cucitrice', 'Bentornato a casa, principe. Ho lasciato la porta aperta. Per una volta.'], ['zagreus', 'Casa. Meraviglioso. Proprio dove volevo NON tornare.']],
  madeline: [['cucitrice', 'La tua montagna, Madeline. E qualcuno che conosci molto bene.'], ['madeline', '…Lo sento. Lei è qui.']],
  prisoner: [['cucitrice', 'L\'Isola. Le celle. Il Re. Non ti stanchi mai di questo giro, vero?'], ['prisoner', '[Fa spallucce. No, non si stanca mai.]']],
  penitent: [['deogracias', 'Penitente… Cvstodia. Anche ricucita, la riconosco. Il Miracolo ci osserva.']],
  terrarian: [['guide', 'Siamo a casa! Beh, una versione cucita di casa. Spero tu abbia portato abbastanza torce.']],
  isaac: [['narratore', 'Isaac tornò nel seminterrato. Era più grande di come lo ricordava. O forse era lui più piccolo.'], ['isaac', '*singhiozza*']],
};
const CHAPTER_INTRO = {
  telaio: 'Benvenuto nella mia coperta, {nome}. Ogni toppa è un mondo che è finito. Vediamo quanto resisti, prima di diventarne una.',
  hallownest: 'Un regno di insetti, sepolto sotto una luce malata. Il primo filo è sempre il più fragile.',
  inferno: 'Strato dopo strato, l\'Inferno si è svuotato. Ma un angelo è rimasto a giudicare.',
  tartaro: 'La Casa di Ade non ha uscite. L\'ho cucita lo stesso, per vedere chi ci prova.',
  celeste: 'Una montagna che mostra a ognuno la parte di sé che vorrebbe dimenticare.',
  deadcells: 'Un\'isola corrosa dal Malessere, dove anche la morte è solo un\'altra partenza.',
  cvstodia: 'Una terra sotto il peso di un Miracolo che punisce. Il dolore qui è una lingua.',
  terraria: 'Un mondo da scavare, costruire, difendere. E sopra, una luna che guarda.',
  basement: 'Una casa sulla collina. Un seminterrato. Una madre che sente le voci.',
  finale: 'Tutti i fili portano qui, {nome}. Dietro la coperta. Dove finiscono i titoli di coda.',
  capolinea: 'Prossima fermata: la stessa.',
  pozzo: 'Ogni rintocco ti porta più giù.',
};

const BOSS_TALK = {
  hollowknight: {
    home: [['cucitrice', 'Guarda, piccolo recipiente. Il fratello che ha fallito. Ho cucito anche lui.'], ['knight', '[Il Cavaliere stringe l\'Aculeo. Riconosce la forma: lo stesso Vuoto, la stessa maschera.]'], ['radiance', '…luce… …lascia entrare… la luce…'], ['knight', '…']],
    other: [['radiance', '…una mente nuova… …così luminosa… …lasciami entrare…']],
    defeat: [['radiance', '…no… …la luce… si spegne…']],
  },
  gabriel: {
    home: [['gabriel', 'Macchina, torna indietro ora. Gli strati di questo luogo non sono fatti per la tua specie.'], ['v1', '> MINACCIA ANGELICA RILEVATA. SANGUE: ABBONDANTE.'], ['gabriel', 'Allora preparati, perché LA TUA FINE È GIUNTA!']],
    other: [['gabriel', 'Un\'altra creatura fuori dal suo strato. Il Paradiso non tollera intrusi, {nome}.'], ['__vs'], ['gabriel', 'PREPARATI!']],
    defeat: [['gabriel', 'Impossibile… sconfitto da… questo? …Non finisce qui.']],
  },
  hades: {
    home: [['hades', 'Zagreus. Ancora a giocare all\'eroe, e in un mondo che nemmeno ti appartiene.'], ['zagreus', 'Padre! Anche tu ricucito? Ti dona, il patchwork. Molto… alla moda.'], ['hades', 'Basta. Ti riporterò a casa. In un modo o nell\'altro.']],
    other: [['hades', 'Un intruso nel mio regno. Ogni anima che entra qui… non ne esce, {nome}.'], ['__vs']],
    defeat: [['hades', 'Va\', dunque. Ma ricorda: tutti, prima o poi, tornano da me.']],
  },
  badelineboss: {
    home: [['badeline', 'Davvero pensavi di lasciarmi indietro? Io sono la parte di te che sa che non ce la farai.'], ['madeline', 'Lo so che hai paura. Ho paura anch\'io.'], ['badeline', 'Allora fermati!'], ['madeline', 'No. Ma possiamo salire insieme.']],
    other: [['badeline', 'Oh, un\'altra vittima della montagna. Lascia che ti mostri chi sei davvero, {nome}.'], ['__vs']],
    defeat: [['badeline', '…Va bene. Va bene. Forse… possiamo provarci insieme.']],
  },
  handofking: {
    home: [['hand', 'Tu. Il mucchio di cellule che non resta mai morto.'], ['prisoner', '[Si scrocchia le cellule del collo. Poi fa cenno: vieni avanti.]'], ['hand', 'Il Re ha ordinato che nessuno lasci quest\'isola. Tantomeno tu.']],
    other: [['hand', 'Fermati, {nome}. Oltre questa sala c\'è solo il Re. E il Re non riceve visite.'], ['__vs']],
    defeat: [['hand', 'Il Re… deve… sapere…']],
  },
  escribar: {
    home: [['deogracias', 'Eccolo, Penitente. Escribar, l\'ultimo dei Supremi, sul trono del Miracolo.'], ['escribar', 'Il Miracolo ti ha concesso molto, Penitente. Ora ti chiede tutto.'], ['penitent', '[Il Penitente solleva la Mea Culpa. Non dice nulla. Non ha mai detto nulla.]'], ['deogracias', 'Così sia.']],
    other: [['escribar', 'Chi porta un peccato non suo, porterà anche la sua penitenza, {nome}.'], ['__vs']],
    defeat: [['escribar', 'La Colpa… ricade… su di te…']],
  },
  moonlord: {
    home: [['system', 'Senti vibrazioni provenire da sotto la terra…'], ['guide', 'Ehm. Questo è decisamente oltre il mio manuale. Ma tu li hai sconfitti tutti, giusto? Giusto?!'], ['terrarian', '[Il Terrariano posa un blocco di terra. Poi un altro. Poi impugna la spada.]'], ['system', 'Il Signore della Luna si è risvegliato!']],
    other: [['system', 'Ti senti osservato…'], ['__vs'], ['system', 'Il Signore della Luna si è risvegliato!']],
    defeat: [['system', 'Il Signore della Luna è stato sconfitto!']],
  },
  mom: {
    home: [['narratore', 'E la Mamma udì una voce dal cielo…'], ['mom', 'Isaac! La tua anima è macchiata dal peccato. Devo salvarti!'], ['isaac', '*singhiozza* M-mamma, no…'], ['mom', 'ISAAC! VIENI QUI!']],
    other: [['mom', 'Tu non sei Isaac. …Ma anche tu hai bisogno di essere salvato, vero, {nome}?'], ['__vs']],
    defeat: [['mom', 'Isaac…?']],
  },
  cucitrice: {
    other: [['cucitrice', '{nome}. Il tuo filo si è allungato abbastanza. È ora di fare l\'orlo.'], ['__final'], ['cucitrice', 'Senza di me la tua storia finirebbe. Io la faccio ricominciare. Per sempre. Non è un dono?']],
    defeat: [['cucitrice', '…Allora vai. Scuciti pure. Ma ricorda: ogni finale… è solo un punto di cucitura.']],
  },
  spola: {
    other: [['cucitrice', 'Prima lezione, {nome}: le mie creature non si rompono. Si rammendano.'], ['__vs']],
    defeat: [['cucitrice', 'Hai strappato la mia Madre Spola. Interessante. Proseguiamo.']],
  },
};
const CHAR_FINAL = {
  knight: [['knight', '[Il Cavaliere solleva l\'Aculeo. Nessun filo può trattenere il Vuoto.]']],
  v1: [['v1', '> RILEVATO: ORIGINE DEL CICLO. AZIONE: INTERROMPERE IL CICLO.']],
  zagreus: [['zagreus', 'Ho passato la vita a scappare da un posto da cui non si esce. Indovina? Ci riesco sempre.']],
  madeline: [['madeline', 'Hai ragione, cadrò ancora. Ma sarò io a decidere quando smettere di provarci.']],
  prisoner: [['prisoner', '[Il Prigioniero si toglie… la testa. La lancia in aria. La riprende. Ha sempre voluto farlo davanti a qualcuno.]']],
  penitent: [['deogracias', 'Questa è l\'ultima penitenza, Cucitrice. E lui non si è mai tirato indietro.']],
  terrarian: [['guide', 'Abbiamo battuto il Signore della Luna. Una sarta non ci fa paura! …Vero?']],
  isaac: [['isaac', '…n-non voglio più ricominciare. Voglio… andare a casa.']],
};
const ENDINGS = {
  knight: [['narratore', 'Il Cavaliere tornò nel buio da cui era venuto. Questa volta, nessuno lo seguì. Il silenzio, per una volta, fu pace.']],
  v1: [['v1', '> CICLO INTERROTTO. SANGUE RESIDUO: SUFFICIENTE PER IL RITORNO.'], ['v1', '> L\'UMANITÀ È MORTA. IL SANGUE È CARBURANTE. L\'INFERNO È… LIBERO.']],
  zagreus: [['zagreus', 'Fuori. Davvero fuori. …Mamma sarà orgogliosa. Papà farà finta di no.']],
  madeline: [['madeline', 'Ce l\'ho fatta. Ce l\'abbiamo fatta.'], ['badeline', '…Sì. Insieme.']],
  prisoner: [['prisoner', '[Il Prigioniero si siede sul bordo della coperta scucita. Poi, senza motivo, ricomincia a correre.]']],
  penitent: [['deogracias', 'Il Penitente depose la Mea Culpa. Per la prima volta, il Miracolo tacque.']],
  terrarian: [['guide', 'Sai qual è la prima cosa che dovremmo fare, ora? …Costruire una casa.']],
  isaac: [['narratore', 'E Isaac, per una volta, smise di piangere. Fuori dalla coperta c\'era il sole.']],
};

// --- Incontri tra personaggi ----------------------------------------------------------
const ENCOUNTER_PAIRS = {
  'zagreus|isaac': [['isaac', '*tira su col naso*'], ['zagreus', 'Ehi, ehi. Niente lacrime. Anch\'io ho un genitore… complicato. Credimi.'], ['isaac', '…davvero?'], ['zagreus', 'Davvero. Il mio ha un cane a tre teste. E non me lo fa nemmeno accarezzare.'], ['isaac', '…tieni. L\'ho trovato in cantina.']],
  'knight|penitent': [['penitent', '[Il Penitente china il capo.]'], ['knight', '[Il Cavaliere china il capo.]'], ['narratore', 'Restarono in silenzio per un tempo lunghissimo. È stata un\'ottima conversazione.'], ['penitent', '[Il Penitente gli porge qualcosa.]']],
  'madeline|prisoner': [['madeline', 'Ehm… stai… bene? Hai la testa in fiamme.'], ['prisoner', '[Pollice in su. La fiamma ha un sussulto di orgoglio.]'], ['madeline', 'Ok. Rispetto.'], ['prisoner', '[Le lancia qualcosa senza guardare. Lei lo prende al volo.]']],
  'v1|terrarian': [['guide', 'Oh! Un robot! Sai che con abbastanza rame e un\'incudine potremmo…'], ['v1', '> RICHIESTA RIFIUTATA. RICHIESTA ALTERNATIVA: SANGUE.'], ['guide', '…Ho delle pozioni. Rosse. Vanno bene?'], ['v1', '> ACCETTABILE.']],
  'zagreus|madeline': [['zagreus', 'Una scalatrice! Anch\'io scalo, sai: decine di camere, con un padre arrabbiato in cima.'], ['madeline', 'Io ho fatto una montagna intera. Con una me stessa cattiva che mi inseguiva.'], ['zagreus', '…Ok, hai vinto tu. Tieni, te lo sei meritato.']],
  'isaac|madeline': [['madeline', 'Ehi… piccolo. Anche tu hai paura? …Respira con me. Dentro… fuori.'], ['isaac', '*tira su col naso* …ok.'], ['madeline', 'Tieni. È una fragola. Non serve a nulla, ma fa sentire meglio.']],
  'penitent|zagreus': [['zagreus', 'Bell\'elmo. Molto… appuntito. Parli poco, eh?'], ['deogracias', 'Il Penitente ha fatto voto di silenzio, principe.'], ['zagreus', 'Rispettabile. Mio padre pagherebbe per vedermi fare lo stesso.']],
  'prisoner|v1': [['v1', '> ANALISI: ORGANICO. TESTA: ASSENTE. CLASSIFICAZIONE: CONFUSA.'], ['prisoner', '[Indica la propria fiamma. Poi indica V1. Poi fa il gesto del «parliamo di te, piuttosto».]'], ['v1', '> PUNTO VALIDO. TRASFERIMENTO RISORSE.']],
  'terrarian|knight': [['guide', 'Che creaturina! Sai, potresti costruirti una casa. Con un tavolo. E una sedia. E una…'], ['knight', '[Il Cavaliere ti fissa. Il silenzio dura molto. Poi ti porge qualcosa, forse per farti smettere.]']],
  'knight|isaac': [['isaac', '*singhiozza*'], ['knight', '[Il Cavaliere si siede accanto a lui. Non dice nulla. Non serve.]'], ['isaac', '…grazie.']],
  'madeline|zagreus': [['madeline', 'Ciao! Scusa, stai… prendendo fuoco? I tuoi piedi.'], ['zagreus', 'Ah, quello. Questione di famiglia. Non scotta, giuro. …Quasi.'], ['madeline', 'Ok. Tutti abbiamo qualcosa.']],
  'v1|knight': [['v1', '> ENTITÀ: PICCOLA. MINACCIA: INDETERMINATA.'], ['knight', '[Il Cavaliere inclina la testa. V1 inclina la testa. Comunicazione stabilita.]']],
};
const NPC_GREET = {
  knight: [['knight', '[Il Cavaliere ti osserva con i suoi occhi vuoti. Poi apre il mantello: ti sta offrendo qualcosa.]']],
  v1: [['v1', '> UNITÀ ALLEATA RILEVATA: {nome}. TRASFERIMENTO RISORSE IN CORSO.']],
  zagreus: [['zagreus', '{nome}! Anche tu intrappolato in questa coperta cosmica? Tieni, ho rubato qualcosa dalla cucina di papà.']],
  madeline: [['madeline', 'Oh! Ciao, {nome}. Scusa, sto… prendendo fiato. Vuoi una mano? Ho trovato delle cose sulla strada.']],
  prisoner: [['prisoner', '[Il Prigioniero ti vede, fa un saluto militare esagerato e ti lancia qualcosa senza guardare.]']],
  penitent: [['penitent', '[Il Penitente tende la mano.]'], ['deogracias', 'Non parla, {nome}, ma il suo dono è sincero.']],
  terrarian: [['guide', 'Ciao, {nome}! Il mio amico qui ha trovato roba utile scavando. Scegli pure!']],
  isaac: [['isaac', '*singhiozza* …ehm… vuoi… questo? L\'ho trovato in cantina.']],
};
const CHAR_REPLY = {
  knight: [['knight', '[Il Cavaliere annuisce.]']],
  v1: [['v1', '> RINGRAZIAMENTI: GENERATI.']],
  zagreus: [['zagreus', 'Molto gentile. Ti devo un favore. O una bevuta allo Stige.']],
  madeline: [['madeline', 'Grazie… davvero. Ne avevo bisogno.']],
  prisoner: [['prisoner', '[Inchino teatrale. Le cellule scintillano.]']],
  penitent: [['deogracias', 'Il Penitente accetta, e ringrazia col silenzio.']],
  terrarian: [['guide', 'Il mio amico ringrazia! Ora, se solo costruisse una casa…']],
  isaac: [['isaac', '…g-grazie.']],
};
// Battute di selezione personaggio
const CHAR_SELECT = {
  knight: [['knight', '[Il Cavaliere inclina la testa.]']],
  v1: [['v1', '> L\'UMANITÀ È MORTA. IL SANGUE È CARBURANTE. L\'INFERNO È PIENO.']],
  zagreus: [['zagreus', 'Padre, scusa il disturbo, sto solo uscendo. Di nuovo. Non aspettarmi alzato.']],
  madeline: [['madeline', 'Ok. Respira. Ce la posso fare.']],
  prisoner: [['prisoner', '[Si indica il collo vuoto. Poi fa spallucce.]']],
  penitent: [['deogracias', 'Il dolore, figliolo, parla ogni lingua.']],
  terrarian: [['guide', 'Hai provato a costruire una casa? Le case risolvono quasi tutto.']],
  isaac: [['isaac', '*singhiozza*']],
};

function fillVars(text, extra = {}) {
  return text.replace(/\{nome\}/g, G ? G.char.name : '').replace(/\{boss\}/g, extra.boss || '');
}
function expand(lines, extra) {
  const out = [];
  for (const l of lines) {
    if (l[0] === '__vs') out.push(...CHAR_VS[G.char.id].map(x => [x[0], fillVars(x[1], extra)]));
    else if (l[0] === '__final') out.push(...CHAR_FINAL[G.char.id]);
    else out.push([l[0], fillVars(l[1], extra)]);
  }
  return out;
}
function bossIntroLines(bossId) {
  const T = BOSS_TALK[bossId];
  if (!T) return [];
  const def = BOSSES[bossId];
  const home = T.home && def && def.home === G.char.id;
  return expand(home ? T.home : T.other, { boss: ETYPES[bossId].name });
}
function encounterLines(player, npc) {
  const pair = ENCOUNTER_PAIRS[player + '|' + npc];
  if (pair) return expand(pair);
  return expand([...NPC_GREET[npc], ...CHAR_REPLY[player]]);
}

// --- Dialoghi (sovrimpressione DOM) ----------------------------------------------------
const DLG = { lines: [], i: 0, shown: 0, text: '', onDone: null, prevMode: 'play', acc: 0 };
function startDialog(lines, onDone) {
  if (!lines || !lines.length) { onDone && onDone(); return; }
  DLG.lines = lines; DLG.i = 0; DLG.onDone = onDone; DLG.prevMode = MODE;
  MODE = 'dialog';
  document.getElementById('dlg').hidden = false;
  showLine();
}
function showLine() {
  const [who, text] = DLG.lines[DLG.i];
  const v = VOICES[who] || VOICES.narratore;
  DLG.text = text; DLG.shown = 0; DLG.acc = 0; DLG.who = who;
  const box = document.getElementById('dlg');
  box.style.setProperty('--vc', v.col);
  const isPlayer = G && who === G.char.id || (G && ((G.char.id === 'penitent' && who === 'deogracias') || (G.char.id === 'terrarian' && who === 'guide')));
  box.classList.toggle('right', !isPlayer);
  document.getElementById('dlg-name').textContent = v.name || '';
  document.getElementById('dlg-text').textContent = '';
  document.getElementById('dlg-text').classList.toggle('action', /^\[.*\]$/.test(text.trim()));
  drawPortrait(document.getElementById('dlg-portrait'), who);
}
function drawPortrait(cnv, who) {
  const v = VOICES[who] || {};
  const c = cnv.getContext('2d');
  c.imageSmoothingEnabled = false;
  c.clearRect(0, 0, cnv.width, cnv.height);
  c.fillStyle = '#1a1220'; c.fillRect(0, 0, cnv.width, cnv.height);
  if (v.boss && BOSSES[v.boss]) {
    const sx = camX, sy = camY;
    camX = 0; camY = 0;
    // Alfa 4: il boss entra tutto nel riquadro (gli sprite nuovi sono più alti)
    const bs = SPR['B_' + v.boss + '_0'];
    const k = bs ? Math.min(1.6, (cnv.height - 6) / bs.h, (cnv.width - 4) / bs.w) : 1.6;
    c.save(); c.scale(k, k);
    const fake = { x: 0, y: 0, r: BOSSES[v.boss].r, t: 0, flash: 0, face: -1, def: BOSSES[v.boss], p2: false, vx: 0, vy: 0 };
    try { BOSSES[v.boss].draw(c, fake, cnv.width / (2 * k), bs ? (cnv.height - 3) / k - BOSSES[v.boss].r : cnv.height / 2.6 + 6); } catch (e) { /* ritratto non disponibile */ }
    c.restore();
    camX = sx; camY = sy;
  } else if (who === 'v1' && typeof V1REF !== 'undefined' && V1REF.complete && V1REF.naturalWidth) {
    const k = Math.min(cnv.width / V1REF.naturalWidth, cnv.height / V1REF.naturalHeight) * 1.3;
    c.drawImage(V1REF, Math.round(cnv.width / 2 - V1REF.naturalWidth * k / 2), Math.round(cnv.height * 0.12), V1REF.naturalWidth * k, V1REF.naturalHeight * k);
  } else if (v.spr && SPR[v.spr]) {
    const s = SPR[v.spr];
    const sc = Math.floor(Math.min(cnv.width / s.w, cnv.height / s.h) * 0.8);
    c.drawImage(s.img, Math.round(cnv.width / 2 - s.w * sc / 2), Math.round(cnv.height / 2 - s.h * sc / 2), s.w * sc, s.h * sc);
  }
}
function updateDialog(dt) {
  if (DLG.shown < DLG.text.length) {
    DLG.acc += dt * 55;
    while (DLG.acc >= 1 && DLG.shown < DLG.text.length) {
      DLG.acc -= 1;
      const ch = DLG.text[DLG.shown];
      DLG.shown++;
      const v = VOICES[DLG.who];
      if (v && v.wave && DLG.shown % (v.step || 2) === 0 && !inBrackets(DLG.text, DLG.shown)) blip(DLG.who, ch, DLG.shown);
    }
    document.getElementById('dlg-text').textContent = DLG.text.slice(0, DLG.shown);
  }
}
function inBrackets(t, i) { const a = t.lastIndexOf('[', i), b = t.lastIndexOf(']', i - 1); return a > b; }
function advanceDialog() {
  if (MODE !== 'dialog') return;
  if (DLG.shown < DLG.text.length) { DLG.shown = DLG.text.length; document.getElementById('dlg-text').textContent = DLG.text; return; }
  DLG.i++;
  if (DLG.i >= DLG.lines.length) return endDialog();
  showLine();
}
function endDialog() {
  document.getElementById('dlg').hidden = true;
  MODE = G && !G.over ? 'play' : DLG.prevMode === 'dialog' ? 'menu' : DLG.prevMode;
  if (!G) MODE = 'menu';
  const cb = DLG.onDone; DLG.onDone = null;
  cb && cb();
}

// =============================================================================
// META: il Filo e la Merceria di Sor Ditale
// =============================================================================
const META = { thread: 0, up: {}, beaten: {}, storyDone: {} };
try { Object.assign(META, JSON.parse(localStorage.getItem('pe_meta') || '{}')); } catch (e) { /* storage non disponibile */ }
try { const old = +(localStorage.getItem('pe_thread') || 0); if (old && !META.migrated) { META.thread += old; META.migrated = true; } } catch (e) { /* ignora */ }
function saveMeta() { try { localStorage.setItem('pe_meta', JSON.stringify(META)); } catch (e) { /* ignora */ } }

const SHOP = [
  { id: 'hp', name: 'Imbottitura Extra', line: '+5% Vita (o +1 Maschera/Cuore ogni 2 livelli)', icon: ['heart', '#e0303a', '#5a1e24'], max: 5, base: 40 },
  { id: 'might', name: 'Ago Affilato', line: '+4% danno', icon: ['sword', '#c9ced8', '#6b7085'], max: 5, base: 50 },
  { id: 'magnet', name: 'Calamita da Sarta', line: '+15% raggio di raccolta', icon: ['magnet', '#e2b04a', '#8a5a2a'], max: 3, base: 30 },
  { id: 'speed', name: 'Scarpe Rattoppate', line: '+3% velocità', icon: ['feather', '#5fb3ff', '#22305a'], max: 3, base: 40 },
  { id: 'growth', name: 'Gomitolo della Crescita', line: '+5% esperienza', icon: ['crystal', '#ff9ad9', '#4aa0ff'], max: 3, base: 45 },
  { id: 'reroll', name: 'Forbici di Riserva', line: '+1 Ritira per run', icon: ['knife', '#efe6d2', '#8e2b3a'], max: 2, base: 60 },
  { id: 'luck', name: 'Bottone Fortunato', line: '+6% fortuna', icon: ['coin', '#ffd23f', '#8a5a2a'], max: 3, base: 35 },
];
const shopCost = (it, lvl) => Math.round(it.base * Math.pow(lvl + 1, 1.6));
const DITALE_QUIPS = [
  'Benvenuto alla Merceria! Qui si rattoppa tutto, tranne i cuori spezzati. Per quelli c\'è il Monte Celeste.',
  'Filo in cambio di miracoli. Beh, di piccoli miracoli. Di miracoli di sartoria.',
  'Un consiglio gratis: le fragole non servono a nulla. Un consiglio a pagamento: comprale lo stesso.',
  'Ho venduto un ago al Cavaliere, una volta. Mi ha guardato per dieci minuti. Ottimo cliente.',
  'Prezzi fissi! Niente sconti, niente resi, niente strappi.',
  'La Cucitrice? Mia cugina. Alla lontana. Molto alla lontana. Non ditele niente.',
];
const SPLASHES = [
  'Ora con il 30% di cuciture in più!', 'Non lavare a 90°!', 'Fatto a mano (più o meno)', 'Contiene tracce di Geo', 'Le fragole non servono a nulla',
  'Taglia unica!', 'Uno strappo alla regola', 'Filo e ago e via!', 'Anche le macchine piangono (sangue)', 'Isaac approva *singhiozzando*', 'Rammendo garantito!',
];
const TIPS = [
  'Consiglio di Sor Ditale: il cerchio rosso che si chiude è un attacco. Esci dal cerchio.',
  'Consiglio della Guida: un muro di blocchi ferma quasi tutto. Quasi.',
  'Consiglio di Deogracias: anche la caduta è preghiera, se ci si rialza.',
  'Consiglio di Zagreus: se un dio ti offre due doni, prendi quello che fa più male. Agli altri.',
  'Consiglio di V1: > RIMANERE IN MOVIMENTO. RIMANERE IN VITA.',
  'Consiglio di Madeline: quando l\'ansia sale, respira. Davvero. Funziona anche nel gioco.',
];
