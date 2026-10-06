'use strict';
// =============================================================================
// VOCI VARIE (Alfa 3) — ogni categoria ha più alternative; vary() non ripete
// mai la stessa due volte di fila. Più battute "bark" in combattimento.
// =============================================================================

const _lastPick = {};
function vary(key, list) {
  if (!list || !list.length) return null;
  if (list.length === 1) return list[0];
  let i;
  do { i = Math.floor(Math.random() * list.length); } while (i === _lastPick[key]);
  _lastPick[key] = i;
  return list[i];
}

const SELECT_ALT = {
  knight: [['knight', '[Il Cavaliere inclina la testa.]'], ['knight', '[Il Cavaliere stringe l\'Aculeo e aspetta.]'], ['knight', '[Un piccolo «Hm!». Pronto.]'], ['knight', '[Il mantello ondeggia. Il Vuoto non ha fretta.]']],
  v1: [['v1', '> L\'UMANITÀ È MORTA. IL SANGUE È CARBURANTE. L\'INFERNO È PIENO.'], ['v1', '> SISTEMI ONLINE. RISERVA DI SANGUE: INSUFFICIENTE.'], ['v1', '> UNITÀ V1 PRONTA. OBIETTIVO: TUTTO.'], ['v1', '> MOVIMENTO = VITA. INIZIARE.']],
  zagreus: [['zagreus', 'Padre, scusa il disturbo, sto solo uscendo. Di nuovo. Non aspettarmi alzato.'], ['zagreus', 'Un multiverso intero da attraversare? Bene. Ho tempo. Ho sempre tempo.'], ['zagreus', 'Pronto quando lo sei tu. Cioè adesso. Andiamo.'], ['zagreus', 'Achille direbbe: «Concentrati». Io dico: «Divertiti, ma concentrati».']],
  madeline: [['madeline', 'Ok. Respira. Ce la posso fare.'], ['madeline', 'Un passo alla volta. Anche se i passi sono… tanti.'], ['madeline', 'Sono io a scegliere quando smettere di provarci. E non è oggi.'], ['madeline', 'Ho scalato una montagna. Posso affrontare una coperta. Credo.']],
  prisoner: [['prisoner', '[Si indica il collo vuoto. Poi fa spallucce.]'], ['prisoner', '[Fa roteare la spada e si mette in posa. Nessuno applaude. La rifà.]'], ['prisoner', '[La fiamma sulla testa si ravviva: è pronto.]'], ['prisoner', '[Saluto militare. Esagerato. Volutamente.]']],
  penitent: [['deogracias', 'Il dolore, figliolo, parla ogni lingua.'], ['deogracias', 'Il Penitente si alza. Il suo voto non conosce riposo.'], ['deogracias', 'Che il Miracolo guidi i tuoi passi. O almeno la tua spada.'], ['penitent', '[Il Penitente china il capirote. Poi lo rialza.]']],
  terrarian: [['guide', 'Hai provato a costruire una casa? Le case risolvono quasi tutto.'], ['guide', 'Consiglio del giorno: le torce. Mai troppe torce.'], ['guide', 'Ricorda: di notte escono gli zombie. Qui è sempre notte, quindi… sempre zombie.'], ['guide', 'Il mio amico non parla molto, ma scava benissimo.']],
  isaac: [['isaac', '*singhiozza*'], ['isaac', '*tira su col naso* …va bene. Vado.'], ['isaac', '…ho paura. Ma vado lo stesso.'], ['isaac', '*si asciuga le lacrime con il braccio*']],
};

const VS_ALT = {
  knight: [[['knight', '[Il Cavaliere sguaina l\'Aculeo. Non ha bisogno di parole.]']], [['knight', '[Il Cavaliere fa un passo avanti. Il Vuoto dentro di lui non trema.]']], [['knight', '[Un piccolo «Hm!». La sfida è accettata.]']]],
  v1: [[['v1', '> OBIETTIVO: {boss}. PROTOCOLLO: ELIMINAZIONE.']], [['v1', '> ANALISI DI {boss} COMPLETATA. VERDETTO: SANGUINA.']], [['v1', '> STILE RICHIESTO: ULTRAKILL. INIZIARE.']]],
  zagreus: [[['zagreus', 'Ho affrontato mio padre più volte di quante tu possa contare. Fatti sotto.']], [['zagreus', 'Sai, di solito a questo punto c\'è un discorso. Facciamola breve.']], [['zagreus', 'Bello. Grosso. Arrabbiato. Mi ricorda qualcuno.']]],
  madeline: [[['madeline', 'Ok. Respira. È solo un\'altra montagna. …Una montagna molto arrabbiata.']], [['madeline', 'Ho paura. Va bene avere paura. Si sale lo stesso.']], [['madeline', 'Non ti lascerò decidere chi sono.']]],
  prisoner: [[['prisoner', '[Fa roteare la spada. Poi indica {boss} e gira il pollice verso il basso.]']], [['prisoner', '[Si sistema la sciarpa. Lo fa con calma. Troppa calma.]']], [['prisoner', '[Mima uno sbadiglio. Poi carica.]']]],
  penitent: [[['penitent', '[Il Penitente stringe la Mea Culpa.]'], ['deogracias', 'Il Penitente non conosce paura, {boss}. Solo penitenza.']], [['deogracias', 'Anche tu porti una colpa, {boss}. Il Penitente è venuto a riscuoterla.']]],
  terrarian: [[['guide', 'Ok! Ricorda: punta ai punti deboli. …Tutto è un punto debole, se colpisci abbastanza!']], [['guide', 'Ha più vita di quanto mi piaccia. Prova con un muro. No, aspetta, colpiscilo!']], [['guide', 'Questo non era nel manuale. Improvvisiamo!']]],
  isaac: [[['isaac', '*singhiozza* …p-perché sono tutti così grandi?']], [['isaac', '…n-non piangerò. Ok, forse un po\'.']], [['isaac', '*stringe i pugni* …vai via!']]],
};

const REPLY_ALT = {
  knight: [[['knight', '[Il Cavaliere annuisce.]']], [['knight', '[Il Cavaliere accetta il dono con un inchino minuscolo.]']]],
  v1: [[['v1', '> RINGRAZIAMENTI: GENERATI.']], [['v1', '> RISORSA ACQUISITA. GRATITUDINE: 1 UNITÀ.']]],
  zagreus: [[['zagreus', 'Molto gentile. Ti devo un favore. O una bevuta allo Stige.']], [['zagreus', 'Grazie! Se passi dalla Casa di Ade, chiedi di me. Non di mio padre.']], [['zagreus', 'Questo mi tornerà utile. Lo sento.']]],
  madeline: [[['madeline', 'Grazie… davvero. Ne avevo bisogno.']], [['madeline', 'Oh! Non dovevi. …Ma lo prendo. Grazie!']], [['madeline', 'Sei gentile. È strano sentirselo dire qui dentro, eh?']]],
  prisoner: [[['prisoner', '[Inchino teatrale. Le cellule scintillano.]']], [['prisoner', '[Pollice in su. Poi due pollici. Poi si accorge di avere solo due pollici.]']]],
  penitent: [[['deogracias', 'Il Penitente accetta, e ringrazia col silenzio.']], [['penitent', '[Il Penitente porta la mano al petto.]']]],
  terrarian: [[['guide', 'Il mio amico ringrazia! Ora, se solo costruisse una casa…']], [['guide', 'Grazie! Lo metteremo in un forziere. Il forziere numero quarantadue.']]],
  isaac: [[['isaac', '…g-grazie.']], [['isaac', '*sorride per un secondo* …grazie.']]],
};

const GREET_ALT = {
  knight: [[['knight', '[Il Cavaliere ti osserva con i suoi occhi vuoti. Poi apre il mantello: ti sta offrendo qualcosa.]']], [['knight', '[Il Cavaliere inclina la testa, poi posa qualcosa a terra davanti a te.]']]],
  v1: [[['v1', '> UNITÀ ALLEATA RILEVATA: {nome}. TRASFERIMENTO RISORSE IN CORSO.']], [['v1', '> {nome}: NON OSTILE. CONDIVISIONE BOTTINO AUTORIZZATA.']]],
  zagreus: [[['zagreus', '{nome}! Anche tu intrappolato in questa coperta cosmica? Tieni, ho rubato qualcosa dalla cucina di papà.']], [['zagreus', 'Un volto amico! Sai quanto è raro, qui sotto? Prendi, offre la casa.']]],
  madeline: [[['madeline', 'Oh! Ciao, {nome}. Scusa, sto… prendendo fiato. Vuoi una mano? Ho trovato delle cose sulla strada.']], [['madeline', 'Ehi, {nome}! Anche tu ti sei perso? Tieni, a me non serve più.']]],
  prisoner: [[['prisoner', '[Il Prigioniero ti vede, fa un saluto militare esagerato e ti lancia qualcosa senza guardare.]']], [['prisoner', '[Ti indica, indica un sacco, ti indica di nuovo. Il sacco è per te.]']]],
  penitent: [[['penitent', '[Il Penitente tende la mano.]'], ['deogracias', 'Non parla, {nome}, ma il suo dono è sincero.']], [['deogracias', 'Il Penitente ha trovato qualcosa, {nome}. Lo affida a te.']]],
  terrarian: [[['guide', 'Ciao, {nome}! Il mio amico qui ha trovato roba utile scavando. Scegli pure!']], [['guide', 'Benvenuto, {nome}! Abbiamo un\'offerta speciale: tutto gratis. Solo oggi.']]],
  isaac: [[['isaac', '*singhiozza* …ehm… vuoi… questo? L\'ho trovato in cantina.']], [['isaac', '…t-tieni. Io ne ho un altro. Credo.']]],
};

const BOSS_ALT = {
  hollowknight: { other: [[['radiance', '…una mente nuova… …così luminosa… …lasciami entrare…']], [['radiance', '…sogna… …sogna con me… …la luce è calda…']]], defeat: [[['radiance', '…no… …la luce… si spegne…']], [['radiance', '…ricorderò… …ogni mente… ricorda…']]] },
  gabriel: {
    home: [[['gabriel', 'Macchina, torna indietro ora. Gli strati di questo palazzo non sono per quelli come te. Torna indietro, o andrai contro la volontà di Dio.'], ['v1', '> MINACCIA ANGELICA RILEVATA. SANGUE: ABBONDANTE.'], ['gabriel', 'Allora preparati, perché LA TUA FINE È GIUNTA!']],
      [['gabriel', 'Ancora tu, macchina. Ti ho già detto di tornare indietro.'], ['v1', '> RICHIESTA IGNORATA.'], ['gabriel', 'Allora sarà il Giudizio a parlare per me!']]],
    other: [[['gabriel', 'Un\'altra creatura fuori dal suo strato. Il Paradiso non tollera intrusi, {nome}.'], ['__vs'], ['gabriel', 'PREPARATI!']], [['gabriel', 'Chi osa varcare il mio cerchio? Inginocchiati, {nome}, e forse sarò clemente.'], ['__vs'], ['gabriel', 'Così sia. GIUDIZIO!']]],
    defeat: [[['gabriel', 'Impossibile… sconfitto da… questo? …Non finisce qui.']], [['gabriel', 'Ah… libero, finalmente… No. Non ancora.']]],
  },
  hades: {
    home: [[['hades', 'Zagreus. Ancora a giocare all\'eroe, e in un mondo che nemmeno ti appartiene.'], ['zagreus', 'Padre! Anche tu ricucito? Ti dona, il patchwork. Molto… alla moda.'], ['hades', 'Basta, ragazzo. Ti riporterò a casa. In un modo o nell\'altro.']],
      [['hades', 'Ragazzo. Credevi che una sarta potesse tenerti lontano dai tuoi doveri?'], ['zagreus', 'Credevo che almeno qui non avresti avuto scartoffie.'], ['hades', 'Le scartoffie mi seguono ovunque. Come te.']]],
    other: [[['hades', 'Un intruso nel mio regno. Ogni anima che entra qui… non ne esce, {nome}.'], ['__vs']], [['hades', 'Il tuo nome non è nei miei registri, {nome}. Rimedieremo.'], ['__vs']]],
    defeat: [[['hades', 'Va\', dunque. Ma ricorda: tutti, prima o poi, tornano da me.']], [['hades', '…Tsk. Il Tartaro ti aspetta comunque.']]],
  },
  badelineboss: {
    other: [[['badeline', 'Oh, un\'altra vittima della montagna. Lascia che ti mostri chi sei davvero, {nome}.'], ['__vs']], [['badeline', 'Pensi di essere coraggioso, {nome}? Io so cosa pensi alle tre di notte.'], ['__vs']]],
    defeat: [[['badeline', '…Va bene. Va bene. Forse… possiamo provarci insieme.']], [['badeline', '…Hai vinto. Stavolta. Non dimenticarti di me.']]],
  },
  handofking: { other: [[['hand', 'Fermati, {nome}. Oltre questa sala c\'è solo il Re. E il Re non riceve visite.'], ['__vs']], [['hand', 'Un altro avventuriero. La sala del trono è piena di quelli come te. Sotto terra.'], ['__vs']]], defeat: [[['hand', 'Il Re… deve… sapere…']], [['hand', 'Ho fallito… mio Re…']]] },
  escribar: { other: [[['escribar', 'Chi porta un peccato non suo, porterà anche la sua penitenza, {nome}.'], ['__vs']], [['escribar', 'Il Miracolo vede tutto, {nome}. Anche il tuo arrivo.'], ['__vs']]], defeat: [[['escribar', 'La Colpa… ricade… su di te…']], [['escribar', 'Il Miracolo… mi abbandona…']]] },
  moonlord: { other: [[['system', 'Ti senti osservato…'], ['__vs'], ['system', 'Il Signore della Luna si è risvegliato!']], [['system', 'Un destino imminente si avvicina…'], ['__vs'], ['system', 'Il Signore della Luna si è risvegliato!']]], defeat: [[['system', 'Il Signore della Luna è stato sconfitto!']]] },
  mom: { other: [[['mom', 'Tu non sei Isaac. …Ma anche tu hai bisogno di essere salvato, vero, {nome}?'], ['__vs']], [['mom', 'Chi c\'è nel mio seminterrato?! ISAAC, hai portato degli amici?!'], ['__vs']]], defeat: [[['mom', 'Isaac…?']], [['mom', 'Isaac… scusa…']]] },
  cucitrice: { defeat: [[['cucitrice', '…Allora vai. Scuciti pure. Ma ricorda: ogni finale… è solo un punto di cucitura.']], [['cucitrice', 'Strappata… da una mia toppa. Che ironia. Che bel disegno.']]] },
};

const BARKS = {
  knight: { lvl: ['[Hm!]', '[L\'Aculeo brilla.]', '[…]'], low: ['[Il guscio si incrina.]', '[Respira. Focus.]'], evo: ['[L\'Aculeo vibra di luce pallida.]'], boss: ['[Il Cavaliere rinfodera l\'Aculeo.]'], event: ['[Hm?]'], idle: ['[Il Cavaliere si sistema il mantello.]', '[…]'] },
  v1: { lvl: ['> AGGIORNAMENTO INSTALLATO.', '> POTENZA AUMENTATA.', '> NUOVI PARAMETRI.'], low: ['> DANNI CRITICI. SERVE SANGUE.', '> INTEGRITÀ BASSA.'], evo: ['> ARMA OTTIMIZZATA.'], boss: ['> MINACCIA NEUTRALIZZATA.', '> STILE: ULTRAKILL.'], event: ['> OBIETTIVO SECONDARIO.'], idle: ['> SCANSIONE IN CORSO…', '> IN ATTESA DI SANGUE.'] },
  zagreus: { lvl: ['Ah, questo sì che mi piace!', 'Grazie, Olimpo!', 'Mi sento… divino.'], low: ['Ahia. Ok, questo fa male.', 'Non ancora, Thanatos!'], evo: ['Questa lama canta!'], boss: ['Un altro per la collezione.', 'Ecco fatto. Prossimo!'], event: ['Oh? Cos\'è questo?'], idle: ['Bel posto. Un po\' affollato.', 'Mi manca Cerbero.'] },
  madeline: { lvl: ['Ehi, sto migliorando!', 'Ok, questo aiuta!', 'Ce la sto facendo!'], low: ['No no no… respira.', 'Ok… calma. Calma!'], evo: ['Due scatti! Wow!'], boss: ['L\'ho fatto. Davvero!', 'Sì! Prossima vetta!'], event: ['Cos\'è quello?'], idle: ['…questo posto mi mette ansia.', 'Fragole? Non ne vedo.'] },
  prisoner: { lvl: ['[Flette i bicipiti.]', '[Annuisce compiaciuto.]'], low: ['[Le cellule tremolano.]', '[Cerca la fiaschetta.]'], evo: ['[Bacia la lama. Si scotta.]'], boss: ['[Inchino. Sarcastico.]'], event: ['[Indica qualcosa.]'], idle: ['[Si gratta la fiamma.]'] },
  penitent: { lvl: ['[Il Penitente stringe il rosario.]', '[Un lampo di Fervore.]'], low: ['[Sangue sull\'armatura.]'], evo: ['[La Mea Culpa arde.]'], boss: ['[Il Penitente si inginocchia.]'], event: ['[Il Penitente si volta.]'], idle: ['[Silenzio.]'] },
  terrarian: { lvl: ['[Il Terrariano sorride.]', '[Equipaggia qualcosa di nuovo.]'], low: ['[Beve una pozione. Non succede niente. Era vuota.]'], evo: ['[ZENITH!]'], boss: ['[Fa un balletto di vittoria.]'], event: ['[Prende il piccone.]'], idle: ['[Scava per noia.]'] },
  isaac: { lvl: ['…ooh!', '*smette di piangere per un secondo*'], low: ['*singhiozza forte*', 'M-mamma…'], evo: ['…wow.'], boss: ['…ce l\'ho fatta?', '*sniff* …sì!'], event: ['…cos\'è?'], idle: ['*tira su col naso*'] },
};
const BARK_VOICE = { penitent: 'deogracias', terrarian: 'guide' };
function bark(kind) {
  if (!G || !G.char) return;
  const id = G.char.id, list = BARKS[id]?.[kind];
  if (!list) return;
  const text = vary('bark' + id + kind, list);
  G.bark = { text, t: 2.4, max: 2.4, col: (VOICES[id] || {}).col || '#efe6d2' };
  if (!/^\[.*\]$/.test(text)) voiceBlips(BARK_VOICE[id] || id, text, 10);
}

const END_ALT = {
  knight: { win: ['[Il Cavaliere rinfodera l\'Aculeo.]', '[Un piccolo «Hm!» soddisfatto.]'], lose: ['[La maschera si incrina. Da qualche parte, un\'Ombra aspetta.]', '[Il Vuoto torna al Vuoto. Per ora.]'] },
  v1: { win: ['> MISSIONE COMPLETATA. SANGUE RACCOLTO: SUFFICIENTE.', '> STRATO PULITO. PROSSIMO STRATO.'], lose: ['> UNITÀ DISTRUTTA. RIATTIVAZIONE IN CORSO.', '> ERRORE CRITICO. RIPROVARE.'] },
  zagreus: { win: ['Beh. Il panorama era nuovo, almeno. Papà sarà furioso.', 'E anche questa è fatta. Qualcuno ha visto Cerbero?'], lose: ['Di nuovo lo Stige. Ciao, Ipno. No, non voglio parlarne.', 'Ahi. Ok. Di nuovo. Come sempre.'] },
  madeline: { win: ['…L\'ho fatto. L\'ho fatto davvero!', 'Una vetta in più. Badeline sarebbe… fiera? Forse.'], lose: ['…Di nuovo. Ok. Una volta ancora.', 'Cadere fa parte della salita. Riprovo.'] },
  prisoner: { win: ['[Il Prigioniero si inchina. È palesemente sarcastico.]', '[Pollice in su verso il cielo. Il cielo non risponde.]'], lose: ['[Le cellule scivolano via in un tubo. Si ricomincia.]', '[Di nuovo in cella. Fa spallucce.]'] },
  penitent: { win: ['«Anche questa terra cucita ha conosciuto la tua penitenza.» Deogracias', '«Il Miracolo ha visto. E ha taciuto.» Deogracias'], lose: ['«Anche la caduta è preghiera, se ci si rialza.» Deogracias', '«La Colpa pesa, Penitente. Rialzati.» Deogracias'] },
  terrarian: { win: ['La Guida: «Fantastico! Ora che ne dici di costruire una casa qui?»', 'La Guida: «Che vittoria! Hai raccolto tutto il bottino?»'], lose: ['La Guida: «Hai provato a costruire una casa? Le case risolvono quasi tutto.»', 'La Guida: «Sei rinato al punto di spawn. Succede ai migliori.»'] },
  isaac: { win: ['…e Isaac, per una volta, smise di piangere.', '*sniff* …ce l\'ho fatta.'], lose: ['*singhiozza*', '…di nuovo il seminterrato.'] },
};

// --- Collegamento con il resto del gioco -------------------------------------------------
for (const id of Object.keys(SELECT_ALT)) CHAR_SELECT[id] = [SELECT_ALT[id][0]];
const _expand = expand;
expand = function (lines, extra) {
  const out = [];
  for (const l of lines) {
    if (l[0] === '__vs') out.push(...vary('vs' + G.char.id, VS_ALT[G.char.id]).map(x => [x[0], fillVars(x[1], extra)]));
    else out.push(..._expand([l], extra));
  }
  return out;
};
bossIntroLines = function (bossId) {
  const T = BOSS_TALK[bossId], A = BOSS_ALT[bossId] || {};
  if (!T) return [];
  const def = BOSSES[bossId];
  const home = T.home && def && def.home === G.char.id;
  const set = home ? vary('h' + bossId, A.home || [T.home]) : vary('o' + bossId, A.other || [T.other]);
  return expand(set, { boss: ETYPES[bossId].name });
};
function bossDefeatLines(bossId) {
  const T = BOSS_TALK[bossId], A = BOSS_ALT[bossId] || {};
  if (!T || !T.defeat) return [];
  if (bossId === 'badelineboss' && G.char.id === 'madeline') return expand(T.defeat);
  return expand(vary('d' + bossId, A.defeat || [T.defeat]));
}
encounterLines = function (player, npc) {
  const pair = ENCOUNTER_PAIRS[player + '|' + npc];
  if (pair) return expand(pair);
  return expand([...vary('g' + npc, GREET_ALT[npc]), ...vary('r' + player, REPLY_ALT[player])]);
};
