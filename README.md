# Decumulo

Calcolatore del decumulo per lavoratori dipendenti privati, più le pagine che ne spiegano le
regole. **Online su [decumulo.it](https://decumulo.it) dal 1° agosto 2026.**

---

## Prima di toccare qualsiasi cosa

```
node verifica.mjs
```

Costruisce e passa tutti i controlli in ordine di costo, fermandosi al primo che fallisce.
**Deve essere verde prima e dopo ogni modifica.** Se serve il dettaglio di un singolo passo, si
lancia da solo:

| comando | cosa fa |
|---|---|
| `node build.mjs` | `sorgenti/` + `regole.mjs` → `sito/` |
| `node test.mjs` | 354 controlli sul motore, letto da `sito/index.html` |
| `node verifiche/come-parla.mjs` | esegue il calcolatore su trentotto scenari e legge le frasi che scrive: 474 controlli sul testo, e confronta le cifre dei riquadri con quelle del piano |
| `node verifiche/valori-ostili.mjs` | duemila moduli con valori impossibili: non deve rompersi né dire assurdità |
| `node verifiche/tavole-dei-fondi.mjs` | tiene la curva dei coefficienti dentro le tavole vere |
| `node verifiche/riscontri-esterni.mjs` | le nostre cifre contro numeri pubblicati da altri: l'unico controllo che può vedere un'**omissione** |
| `node verifiche/casi-esterni.mjs` | i venti casi sulle discontinuità della legge, e il confronto col progetto esemplificativo COVIP di un fondo |
| `node verifiche/seconda-implementazione.mjs` | confronta il motore con uno riscritto dalle regole, su 64 casi |
| `node verifiche/coppie.mjs` | 25 coppie × 12 basi + 11 sulle funzioni: due piani che cambiano per **una cosa sola**, e il verso è dichiarato prima di lanciare |
| `node verifiche/invarianti.mjs` | 4.000 piani casuali **seminati** + le funzioni di legge ai punti esatti. `SEME=<n>` per cambiare popolazione |
| `node verifiche/il-punto-piu-alto.mjs` | l'unico che **non crede all'elenco dei punti notevoli**: spazzola il cursore a passo 0,1 su 40 piani e pretende che la ricerca rapida valga quanto la forza bruta. Nel percorso caldo la spazzolata è impraticabile — settecento giri di motore per persona — qui costa un secondo |
| `node verifiche/schermi.mjs` | che nessuna griglia esca dallo schermo di un telefono |
| `node verifiche/coerenza.mjs` | che le pagine dicano quello che il conto fa |
| `node verifiche/esempi.mjs` | i numeri d'esempio delle pagine (`ESEMPIO`, `ESEMPIO_TFR`) **ricalcolati col motore vero**: erano l'unica seconda implementazione senza rete |
| `node verifiche/consenso.mjs` | che il tag di misurazione non parta senza consenso |
| `node verifiche/anteprime.mjs` | la scheda che si vede condividendo il link, e le briciole dichiarate |
| `node verifiche/scarica.mjs` | il piano portato via: che il foglio di calcolo sia un file valido e dica quello che si vede |
| `node verifiche/scadenze.mjs` | se i parametri sono ancora quelli correnti, e se la prosa al futuro sull'erogazione frazionata è ancora al futuro |

Fuori dalla catena perché **non afferma niente**: stampa un rapporto da leggere.

```
node studio.mjs     le domande di sostanza fatte al motore — coppia o soli, fondo o
                    investimenti, quanto pesa davvero il comparto, quando morde il tetto.
                    Da rilanciare a ogni cambio dei parametri: se una risposta si sposta,
                    o è cambiata la legge o è cambiato qualcosa che non doveva.
                    In testa al file ci sono le DUE TRAPPOLE DI LETTURA in cui sono
                    caduto scrivendolo, ed è la parte che vale più dei numeri
```

Fuori dalla catena, perché apre Chrome e va lanciato quando si tocca il layout o si aggiunge
una casella:

```
node verifiche/a-schermo.mjs     undici pagine (dieci più il 404) × quattro larghezze, e il
                                calcolatore in cinque assetti del modulo: niente sborda, ogni
                                campo ha un nome, la stampa contiene il
                                dettaglio anno per anno. E il CONSENSO provato cliccando davvero:
                                è l'unico posto dove si può vedere che il tag non parte prima

node verifiche/occhi.mjs        i ritagli in verifiche/scatti/, DA GUARDARE con gli occhi: il
                                modulo dei contributi, la nota sulla quota del datore (una frase
                                a tutta riga in una griglia a gruppi di tre: si guarda che non
                                sfalsi le celle sotto), il riquadro del TFR con le sue due
                                caselle nuove, le ipotesi (griglia `auto-fit`: una casella in
                                più può cambiare il numero di colonne), il risultato, il
                                cursore portato sotto quello che si versa, e i due pezzi a
                                390 px. Afferma una cosa sola, che la console sia pulita

node verifiche/senza-scatti.mjs  prende ogni cursore, lo trascina avanti e indietro due volte e
                                misura quanto si sposta la pagina sotto le dita. Da lanciare
                                quando si tocca la prosa intorno ai cursori — quella che REAGISCE
                                a dove sta il cursore — perché è lì che il difetto nasce
```

**I tre si dividono il lavoro, e la divisione va tenuta.** `a-schermo.mjs` **misura la pagina
ferma** e dà un verdetto; `occhi.mjs` **guarda** e non afferma quasi niente; `senza-scatti.mjs`
**misura la pagina mentre la si usa**, che è l'unica cosa che richiede di pilotare il browser e
per cui prende da `occhi.mjs` il modo di aprirlo. Servono perché esiste una classe di difetti che
nessuna misura statica vede — non sbordano, la pagina resta larga uguale, le frasi sono giuste.
Il giorno che `occhi.mjs` è stato scritto ne ha trovati due in dieci minuti: «niente: 0 €»
spezzato fra la cifra e il simbolo, e il riquadro dei contributi che su un telefono era **l'unico
del modulo a non impilarsi**, perché un `grid-column:1/3` gli fabbricava una colonna che non
c'era. `senza-scatti.mjs` ne ha misurato uno che durava da mesi: **188 px di sussulti in un solo
trascinamento**. Tutti e tre con `a-schermo.mjs` verde.

`sito/` **non si modifica a mano**: si rigenera. Oltre alle pagine il build scrive `sitemap.xml`
e `robots.txt`, e mette in ogni testa i metadati per le anteprime — **ricavandoli dal titolo,
dalla descrizione e dal canonical che la pagina già dichiara**, così non possono divergere. La
favicon è disegnata dentro `build.mjs` e va in linea: **senza consenso il sito non chiede un file
a nessuno**, che è la promessa scritta in `privacy.html`.

## Pubblicare

Dieci pagine, un 404, e i file di servizio che il build riscrive da sé (`sitemap.xml`,
`robots.txt`, `CNAME`, `BingSiteAuth.xml`, la favicon e le due immagini). Il sito è
statico: non c'è un server da mantenere, e `sito/` si può servire da qualunque parte.

**Pubblica GitHub, e solo se i controlli passano.** `.github/workflows/pubblica.yml` esegue
`node verifica.mjs` a ogni push su `main` e carica su GitHub Pages soltanto quando è tutto verde:
se un controllo fallisce, **online resta la versione buona**. `sito/` non sta nel repository
(`.gitignore`), proprio perché non possa finire online una cartella costruita a mano che i
controlli non hanno visto.

**E i controlli girano anche senza push.** La guardia delle scadenze scatta solo se qualcuno la
lancia: un repository fermo per mesi attraverserebbe il 1° gennaio senza che nessuno la eserciti,
e il sito resterebbe online con le cifre dell'anno prima. `.github/workflows/controllo.yml`
esegue `node verifica.mjs` **una volta a settimana**, senza pubblicare niente: se un passo
fallisce, GitHub lo scrive per posta. Un limite da sapere: su un repository pubblico GitHub
**sospende i lavori a orario dopo 60 giorni senza attività**, avvisando prima per posta —
quell'avviso va trattato come un controllo fallito, e si riattiva dal pannello Actions.

**Il dominio non si riscrive**: sta nei `canonical` delle pagine, e da lì il build ricava
`robots.txt` e il file `CNAME` che serve a GitHub per rispondere su `decumulo.it`.

Il DNS del dominio porta ai quattro indirizzi di GitHub Pages (`185.199.108-111.153`) più un
`CNAME` per `www`. Il certificato è di Let's Encrypt, emesso e rinnovato da GitHub, e
**Enforce HTTPS** è attivo. Chi tocca il DNS deve sapere che quei quattro record A vanno tutti
e quattro: uno solo funziona finché quel nodo risponde.

**Senza consenso non parte nulla verso l'esterno**: nessuna risorsa da domini terzi, nessun
cookie. Con il consenso si attiva Google Analytics, ed è l'unica eccezione. Vedi la sezione
*La misurazione delle visite*.

---

## Le tre regole del progetto

**1. Ogni cifra di legge sta solo in `regole.mjs`.** Il build la porta nel motore
(`//@@REGOLE@@` → costanti JS) e nel testo (`{{tetto}}`, `{{soglia}}`, `{{irpef2}}` → cifre in
italiano). Anche i numeri degli esempi e le tabelle delle pagine sono generati
(`ESEMPIO`, `<!--@@TABELLA_SOGLIE@@-->`, `<!--@@TABELLA_REGOLE@@-->`). Il build segnala le cifre
scritte a mano che assomigliano a costanti.

**Ogni costante porta anche il proprio formato (`come:`), e un formato che non viene raggiunto è
peggio di uno mancante** — perché ne vince un altro e la riga sembra scritta apposta. `mostra()`
si dirama prima su «il valore è una lista?»: `cumulo` stava sul ramo degli scalari pur avendo una
lista, e finiva in quello delle aliquote (**«25% fino a 3 €»**, dove il 3 sono volte il
trattamento minimo); `anni` esisteva solo per le curve, e su un numero solo cadeva in fondo, dove
tutto ciò che supera 1 diventa euro (**«Durata minima dell'erogazione frazionata: 5 €»**). Due
righe pubbliche e assurde con tutti i controlli verdi: **nessun controllo legge la tabella dei
parametri**, e si guarda a occhio dopo averla toccata. C'è anche `punti`, perché «0,30 punti» e
«0,3%» non sono la stessa cosa e l'errore era già stato fatto una volta.

**2. Le fonti si dichiarano sempre, e sono tre.** Nelle pagine ogni affermazione porta la sua
marca: `legge` (con l'articolo), `CCNL` (varia per settore), `stima` (nostra approssimazione).
Mescolarle è il difetto più grave possibile qui.

**2-bis. Il verdetto non poggia su una traiettoria sola.** Sotto il giudizio di sostenibilità
c'è la **prova di tenuta**: gli stessi dati con i primi `PROVA_ANNI` esercizi a rendimento reale
nullo. Nel decumulo conta la sequenza dei rendimenti, non la media, e su un piano stretto la
prova rovescia il verdetto. È una perturbazione sola e dichiarata, non una nuvola di scenari:
quella richiederebbe una distribuzione che il sito non può citare. Per costruzione **non può
migliorare un piano** (`Math.min(0, …)`, non zero secco: con rendimenti reali negativi azzerarli
sarebbe un regalo), e c'è un'invariante che lo impone sui 4.000 piani casuali.

**2-ter. Quello che dipende dal MODULO si applica prima di quello che dipende dal CONTO.**
`calc()` esce presto quando i dati non bastano per un verdetto. Tutto ciò che sta dopo quel
`return` non viene scritto, e se lì dentro finisce roba che dipende solo dalle caselle, il modulo
smette di rispondere per la mancanza di un campo che con quella roba non c'entra. È successo due
volte: la seconda colonna restava visibile con «una persona» selezionato, e i valori ricavati
sotto le caselle (contributi in euro, quanto resta del tetto, TFR) tacevano finché non si
scriveva la decorrenza. **Come si verifica un riordino dentro `calc()`**: impronta di tutto quello
che la pagina scrive su una dozzina di scenari, prima e dopo, confrontata riga per riga. Zero
valori cambiati e zero persi; quelli nuovi sono il guadagno.

**2-quater. Gli «e se» sono secondi giri del motore, non piani diversi.** Ce ne sono due: la
**prova di tenuta** (i primi esercizi a rendimento nullo) e lo **scenario del superstite** (uno
dei due viene a mancare, alla speranza di vita ISTAT). Nessuno dei due tocca il verdetto, che
continua a rispondere a «quanto dura se tutto va come previsto». Si aggiungono a `s` come
`s.prova` e `s.manca`, e la seconda implementazione li rifà dalle regole come tutto il resto.

**LA METRICA DELLO SCENARIO È STATA SCELTA MISURANDO, e la prima era sbagliata.** Col patrimonio
finale lo scenario diceva sistematicamente che chi resta sta *meglio*: la spesa scende al 60-67%
e quel risparmio domina la perdita di reddito. Vero nel modello, grottesco da pubblicare, e
risposta a una domanda che nessuno si fa. Si confrontano invece **due discese**: quella delle
entrate ricorrenti di chi resta e quella della spesa. La soglia con cui confrontarsi non è una
nostra stima, sono le due scale di equivalenza pubbliche.

**2-quinquies. Una casella lasciata vuota vale zero, e uno zero è una risposta.** Il verdetto si
dà solo quando è stata compilata **ogni casella da cui dipende**: patrimonio e spesa, più nascita,
decorrenza, retribuzione e trattamento per ciascuno (sei con una persona, dieci con due). Prima
ne bastavano tre, e chi si fermava lì riceveva un verdetto pieno calcolato **senza patrimonio e
senza entrate**: «non sostenibile, il patrimonio si esaurisce nell'anno in corso». Lo scostamento
andava sempre nella direzione più allarmante, perché le entrate mancanti valgono zero e la spesa
no. La frase che promette quante caselle servono **la scrive `calc()` dallo stesso elenco che la
guardia controlla**: promessa e guardia scritte in due punti erano la causa, non il sintomo.
Vuoto e zero restano distinti (`patrimonioVuoto`, `stipVuoto`, `pensVuoto`, `annoPensVuoto`):
chi non ha patrimonio, o non versa, scrive **0** e il conto lo prende alla lettera.

**2-septies. Il calcolatore legge i numeri come si scrivono in italiano, e gli anni solo quando
sono finiti di scrivere.** Sono due difetti della stessa famiglia — *la pagina risponde a
qualcosa di diverso da quello che hai scritto* — e tutti e due sono stati segnalati da lui usando
il sito, non da un controllo.

- **La virgola.** Le caselle erano `type="number"`, che per specifica ammette come separatore
  decimale solo il punto: `1,5` non veniva letto male, **non veniva letto affatto** — il browser
  restituisce stringa vuota al codice, che quindi non può nemmeno accorgersene e ripiega su zero.
  E funzionava o no secondo la lingua del **browser**, non della pagina: un difetto che colpisce
  un sottoinsieme imprevedibile di chi passa non lo segnala nessuno. Il segnaposto delle
  percentuali, intanto, diceva `es. 1,2`. **Il caso peggiore era però l'altro**: `2.500` è un
  numero valido e vale **due virgola cinque**, quindi una spesa scritta come si scrive in italiano
  rendeva il piano sostenibile per finta. Ora le caselle sono `type="text"` con `inputmode`, e la
  conversione la fa `numero()`: virgola = decimale sempre; punto seguito da tre cifre = migliaia
  (`2.500` → 2500), negli altri casi decimale (`2.5` → 2,5); con tutti e due, l'ultimo è il
  decimale. Le migliaia non cominciano da zero, quindi `0.500` è mezzo.
  **Si perdono le frecce su/giù e la validazione `min`/`max` nativa — che non stavamo usando**:
  il taglio vero è `numFra()`, e gli attributi sono stati tolti perché lasciarli avrebbe fatto
  credere che fossero loro a tenere il valore in riga.
  *Lo stile non può più distinguere le caselle con `type=text`*: le cifre vanno a destra e i
  nomi a sinistra, e il criterio è `input:not([inputmode])`. C'è un controllo in `schermi.mjs`.
- **Gli anni.** Per arrivare a `2079` si passa da `2`, `20`, `207`: numeri leciti che il taglio
  agli estremi trasformava in un'altra risposta. La decorrenza finiva a 1900 — «già in pensione»,
  col paragrafo di chi ha già riscosso tutto — l'erogazione anticipata finiva sull'anno in corso e
  faceva partire il fondo a rate, l'ultimo anno di lavoro cancellava sedici anni di reddito.
  **Quattro cifre o la casella vale come non compilata**, che è uno stato che la pagina già sa
  gestire. La regola assorbe il vecchio caso dello zero: per un anno lo zero non è una risposta
  diversa, è un tasto premuto a metà.

**2-sexies. Chi è già in pensione usa la pagina come chiunque altro.** Una decorrenza già
trascorsa è un dato, non un errore: prima la guardia pretendeva un anno futuro e rispondeva
«serve la decorrenza del trattamento» a chi l'aveva scritta. Su un sito che si chiama *decumulo*
era chiuso fuori proprio chi è in decumulo. Per quelle persone (`x.giaInPens`, decorrenza
**strettamente** anteriore all'anno in corso) il piano non ha esercizi di attività, e **il fondo
pensione esce dal modello**: `leggi()` azzera `x.fondo` e conserva `x.fondoScritto`. Non è un
dettaglio di comodo — `annoIncasso` è `max(annoPens, ANNO0)`, quindi senza quell'azzeramento il
montante verrebbe riscosso *nell'anno in corso*, cioè una seconda volta, dato che quel capitale
sta già dentro «patrimonio investito»; e col coefficiente dell'età alla decorrenza, non di adesso.
Chi non l'ha ancora riscosso è un **limite dichiarato**, non un conto sbagliato. **La decorrenza
nell'anno in corso non è questo caso**: lì la riscossione cade dentro il piano, all'età giusta.
Quando *nessuno* ha esercizi di attività (`s.tuttoInPens`) spariscono anche le righe del lavoro e
del fondo (classe `senza-lavoro` sul body, come `solo-uno`) e la seconda spesa: caselle
disattivate che si portano dietro le proprie istruzioni sono peggio dell'assenza.

**2-octies. La spesa abitativa vive fuori dai due moltiplicatori, e non è un dettaglio.**
La spesa passa da due fattori: `k`, con cui `spesaSostenibile` cerca per bisezione la spesa
massima, e `equiv`, la scala di equivalenza dello scenario del superstite. **Il canone di
locazione non deve passare da nessuno dei due**, e si somma dopo. Da `k` perché un affitto non è
comprimibile a scelta di chi ci abita: lasciandocelo dentro, il conto «risolverebbe» un piano
stretto facendo pagare meno di affitto, e la spesa massima uscirebbe più alta del vero proprio
per chi ha meno margine. Da `equiv` perché la scala vale sui consumi, e lo stesso appartamento
costa uguale per uno o per due.
**Le due prove sono separate, e la prima da sola non bastava**: l'invariante scritta sulla
bisezione restava verde su tutti i 4.000 piani mentre il canone finiva dentro `equiv`, perché
nessun piano generato aveva insieme la casa e il superstite. Ora ci sono un'invariante per
ciascuno e due casi di seconda implementazione che li combinano; spostando quella riga, i
controlli falliscono (provato).

**2-nonies. L'abitazione non entra nel patrimonio, ed è un evento in un anno solo.**
Non produce reddito e non è disponibile finché ci si abita: entra nel conto solo se si dichiara
di volerla cambiare. Il ricavato affluisce in un esercizio (`daCasa`, voce di flusso come le
altre, quindi dentro la quadratura di riga) e la spesa muta da lì in poi. **Il calcolo non dice
se convenga**: per la locazione pubblica il *pareggio in rendimento*, cioè sotto quale rendimento
reale la conclusione si rovescia; per la casa più piccola dichiara che una soglia non c'è, perché
non c'è nulla di ricorrente da bilanciare. Un verdetto sarebbe la restituzione di un'ipotesi
scritta da chi compila.
Il ricavato **può essere negativo** (una casa nuova più cara) e va scritto col segno: è un caso
lecito, non uno da escludere.

**3. Nel calcolatore ci sono tre tipi di testo, e solo uno può andarsene in pagina.**
I *risultati* restano (sono calcolati). Le *istruzioni per compilare* restano accanto alla
casella. Le *spiegazioni di dominio* vanno in una pagina.

Registro: **impersonale e tecnico**, ovunque. Niente domande retoriche come titolo, niente
valutazioni al posto dei fatti, niente incisi con trattino lungo dove basta un punto.

**I valori di partenza seguono una regola sola, e vale per ogni casella nuova:**

| | parte da | perché |
|---|---|---|
| i **fatti** (RAL, fondo, spesa, pensione…) | **vuoto** | non li sappiamo, e inventarli è peggio che chiederli |
| le **ipotesi** (rendimenti, inflazione, orizzonte) | un valore **prudente** | senza, il primo risultato sarebbe un piano a rendimento zero |
| le **decisioni** (quota in capitale, RITA, forma) | il **caso base della legge** | sceglierle noi è indicare un ottimo dove la pagina dichiara di non indicarne |

La terza riga è costata cara: la quota in capitale partiva dal massimo — 0,6 per il primo e 1 per
il secondo, resti della pagina privata — e quella scelta mai presa **spostava anche il punto più
alto della contribuzione**, che dipende da come il fondo verrà riscosso (31/07/2026).

**6. Una pagina per ogni domanda che la gente digita, e la vetrina sta nella cornice.**
(08/08/2026)

**La cornice**, misurata su come un risultato di ricerca viene tagliato: **titolo ≤ 60
caratteri, descrizione fra 135 e 158**, con le parole che si cercano davanti. Erano fuori misura
**cinque titoli su dieci** (fino a 81) e **dieci descrizioni su dieci** (fino a 187): si erano
allungate una parola alla volta, e nessun controllo le guardava. Adesso lo fa `anteprime.mjs`,
che controlla anche che due pagine non portino la stessa vetrina.

**Le parole sono quelle che si digitano, non quelle che suonano meglio.** `il-metodo.html` si
intitolava «Come sono fatti i conti, e cosa non sanno»: una bella frase e una vetrina cieca,
perché nessuno cerca quelle parole. E «TFR **in azienda o nel** fondo pensione» è l'ordine che
usano tutti i primi risultati, cioè l'ordine in cui la frase viene pensata.

**«Conviene» si può usare nel titolo, come domanda; mai nel testo, come verdetto.** È la parola
che tutti cercano, e tenerla fuori significava competere su una formulazione che nessuno digita.
Dentro, la risposta resta quella di sempre: *dipende da questi numeri, ed eccoli*.

**Una pagina di ricerca deve chiudere con un numero**, e il numero deve passare da `regole.mjs`
e farsi ricalcolare dal motore in `verifiche/esempi.mjs`. È la lezione di
`tfr-fondo-o-azienda.html`: chi arriva da una ricerca e trova solo una spiegazione se ne va senza
la cifra per cui era venuto. `fondo-pensione-o-etf.html` nasce così — `ESEMPIO_FONDO`, e quattro
controlli che confrontano contributi, costo in busta e aliquota con quelli del calcolatore.

**Il confronto fondo/ETF si fa a parità di rendimento.** Mettere il comparto al 3% e l'ETF al 7%
direbbe qualcosa sui mercati, che nessuno sa. Tenendoli uguali resta sul tavolo solo ciò che si
misura: quanto entra per ogni euro uscito dalla busta, l'imposta all'uscita, il costo della
forma. È anche quello che fa il cursore del calcolatore, che quasi nessuno riconosce come il
confronto fondo/ETF.

**Cosa NON si fa**: dati strutturati `FAQPage` (sarebbero una seconda copia del testo, che
diverge al primo ritocco); inseguire «calcolo pensione», che è un'altra domanda ed è presidiata;
ripetere parole per compiacere un motore.

**Restano scoperte due ricerche**, entrambe con volume e senza un presidio serio: «quanto si
deduce / risparmio fiscale del fondo pensione» e «quanti soldi servono per smettere di lavorare»
(la regola del 4%, dove nessuno tiene conto della pensione INPS). Si scrivono quando la prima
porta avrà mostrato se funziona.

**E il collo di bottiglia non è qui**: mancano i link in entrata. Tre pagine ben mirate valgono
meno di un link da un sito che conta.

**5. Il vestito ha tre regole, e stanno insieme.** (07/08/2026)

**Due caratteri, e si dividono i mestieri.** `--voce` (Georgia) dove il sito *parla*: la testata,
il verdetto, i titoli delle pagine di spiegazione. `--dati` (il sans di sistema) dove *misura*:
modulo, cifre, tabelle, etichette, pulsanti. Prima ce n'era uno solo — il sans dell'interfaccia
del sistema operativo, cioè il carattere del *software* — in ogni ruolo.

- **Sono di sistema, non scaricati**: `privacy.html` dichiara che la pagina non chiama domini
  terzi, e un font preso da fuori romperebbe quella promessa prima di ogni altra cosa.
- **Perché Georgia e non `ui-serif`**, che era la prima scelta: misurando la larghezza del
  verdetto contro quella dei singoli caratteri è venuto fuori che **basta che Georgia compaia
  nella pila perché vinca lei, anche messa dopo**. «New York su Apple, Georgia altrove» non
  succedeva: succedeva Georgia dappertutto, mentre la dichiarazione prometteva altro. Meglio
  dichiarare quello che accade.
- **Le sue cifre sono alla vecchia maniera** e non si possono allineare: Georgia non porta la
  variante `lnum`, quindi `font-variant-numeric:lining-nums` sul verdetto non faceva niente.
  Provato, non dedotto — e tolto, perché una dichiarazione che non fa nulla è peggio di una che
  manca.
- **I due segnaposto stanno in due file** (`index.html` ha il proprio `<style>`, le pagine usano
  `_stile.html`): `coerenza.mjs` confronta le due dichiarazioni nei file costruiti e fallisce se
  si separano.

**Una scala sola: `11 · 12 · 13 · 14 · 15 · 16`**, più i due corpi da display (26 e 34). Erano
**quattordici corpi**, di cui cinque fuori scala — 10 · 10,5 · 11,5 · 12,5 · 13,5 · 14,5 · 17 —
in diciassette dichiarazioni. Le mezze misure sono abolite: se una riga «non sta bene» a 13 non
si inventa 13,5, si sceglie 12 o 14.
**E la misura di lettura ha due valori**: `68ch` per la prosa, `74ch` per le note tecniche. Erano
sei (60 · 64 · 66 · 68 · 70 · 74 · 78), sedimentate.

**Il verde è il giudizio, non la ferramenta.** Resta al verdetto, al sommario, al grafico e al
cursore (che è l'oggetto che si muove). Non veste più i cerchi numerati, i bordi dei pulsanti, il
pulsante scelto, il testo del punto più alto, l'accantonamento nelle fasi. Erano **dieci ruoli**:
un colore che significa dieci cose non ne significa nessuna. **Il rosso non si tocca**, e diventa
l'unico colore che chiede attenzione — lo schema è «neutro salvo allarme».
*Le pagine di contenuto tengono i loro tre verdi dichiarati* (il richiamo `.chiave`, il pulsante
che riporta al calcolatore, la marca `legge`): lì non c'è affollamento, e il pulsante è l'unica
azione del sito.

**Cosa NON si tocca, e serve ricordarlo**: il bianco caldo di fondo, i riquadri senza ombra, i
raggi dei bordi, le micro-etichette maiuscole spaziate. Sono l'idioma «documento» e funzionano.
Niente ombre, niente icone, nessun colore d'accento nuovo: sono le quattro cose che sposterebbero
il sito verso l'aspetto di chi ha qualcosa da vendere.

**5-bis. Il risultato sta accanto al modulo, e lo segue.** (08/09/2026) Sopra i 1.100 px due
colonne, la destra appiccicata per tutta la pagina; sotto, una colonna sola nell'ordine di sempre.
Il grafico si disegna alla larghezza che ha, così le etichette restano di 11 px veri. Il perché e la
trappola dello sticky stanno nella sezione datata.

**4. Il modulo ha due strati, e nello strato aperto ci sta solo quello che il verdetto pretende
più il fondo pensione.** (07/08/2026)

Aperto: `quanti`, nascita, RAL, i due della pensione INPS, i due del fondo, le quattro classi del
patrimonio, la spesa. **Dodici controlli.** Tutto il resto sta in quattro blocchi che si aprono
con un clic: il TFR e i contributi, i dettagli sulle persone, la spesa in pensione e
l'abitazione, le ipotesi.

**Una casella non si aggiunge allo strato aperto senza toglierne un'altra.** Il tetto è misurato
da `a-schermo.mjs` sull'assetto `apertura`, e `come-parla.mjs` controlla che ogni casella stia
dalla parte giusta.

Nasce da un riscontro esterno — *«troppo completo, strozzi il soggetto con le mille domande»* — e
da una misura: **37 controlli visibili all'apertura, di cui sei necessari**, col risultato a
2.784 px su desktop e **5,3 schermate su un telefono**. Dopo: **12 controlli**, risultato a
1.881 px e **3,1 schermate**, pagina intera da 9,7 a 4,5 schermate. La seconda metà del riscontro
è il vincolo che ha deciso la forma: *«tutte quelle cose serve saperle»*, quindi non si toglie
niente, si mette in due tempi.

**LA CONDIZIONE A CUI NASCONDERE È ONESTO, e senza questa il resto non va fatto:** ogni blocco
chiuso dichiara nel titolo cosa il conto sta assumendo, e la stessa frase compare accanto al
risultato (`statoBlocchi`, `#nonContato`). Chi non apre «Il TFR e i contributi» ottiene un piano
**più basso del vero**, e deve leggerlo senza aprire niente. Due regole tengono vere quelle righe:
si nomina solo quello che è **vuoto** (uno zero scritto è una risposta), e solo quello che il
conto **ascolterebbe** (le caselle spente per chi è già in pensione non si chiedono).

**Due difetti che il secondo strato ha chiuso**, e che stavano proprio dove guarda chi arriva:
la sezione delle scelte era disegnata per intero sul modulo vuoto (sei cursori su un piano
inesistente, compresi i comandi di un secondo che con «una persona» nessuno ha chiesto), e il
grafico vuoto con la sua legenda. Ora sono pezzi del **risultato**: `mostraIlPiano()` li accende
solo quando un verdetto c'è.

**LA TRAPPOLA, misurata e non vista:** un `<details>` chiuso **non** nasconde un figlio a cui una
classe dà un `display`. È lo stesso meccanismo che la regola di stampa sfrutta al contrario per
aprirli tutti su carta. I figli qui dentro sono griglie (`.due`, `.caselle`), quindi i quattro
blocchi erano chiusi e mostravano ugualmente tutte le loro caselle: 28 controlli invece di 12,
con la pagina che sembrava a posto. Serve
`.strato:not([open]) > *:not(summary){display:none}`, e i due controlli nuovi falliscono
entrambi se sparisce.

---

## Cosa aggiornare a mano, e quando

`REVISIONE_ISO` in `regole.mjs` — **l'unica cosa che il build non fa da sé**. Si scrive in forma
ISO e basta: la stringa in italiano che compare nel piè di pagina si genera da quella.

**La scadenza non è «ogni tanto»: è il 1° gennaio.** Non è una convenzione nostra, è la data in
cui l'INPS rivaluta l'assegno sociale ed entra in vigore la legge di bilancio. `verifica.mjs`
**fallisce** se dall'ultima revisione è passato un capodanno: un sito che pubblica cifre vecchie
di un anno non fallirebbe nessun altro controllo, e in fondo a ogni pagina dichiarerebbe una data
che gli dà l'aria di essere aggiornato.

| quando | cosa | dove si verifica |
|---|---|---|
| **ogni gennaio** | `ASSEGNO_SOCIALE` **e `TRATT_MINIMO`**, rivalutati | la stessa circolare INPS di dicembre |
| **dopo la legge di bilancio** | `SCAGLIONI` (IRPEF), `TETTO_DEDUZIONE`, `QUOTA_ORDINARIA` | testo della legge, non una notizia |
| **quando esce una tavola ISTAT** | `SPERANZA_VITA` **insieme a** `MARGINE_RENDITA` | poi `verifiche/tavole-dei-fondi.mjs` |
| **ogni gennaio** | `ANNO0`: è «l'anno in corso» da cui parte il conto | — |
| **quando cambia il decreto sui coefficienti di trasformazione** (biennale; il prossimo, per il 2027-2028, è atteso a fine 2026) | `VITA_INTERA`, che segue la tavola ISTAT di quel decreto: i fondi la pubblicano «per le prestazioni richieste fino al 31/12/2026» | `demo.istat.it`, e le informative dei fondi che espongono la tavola in anni interi |
| **il 31 ottobre 2026** | la prosa al futuro sull'erogazione frazionata (`{{frazDal}}` in due pagine) si toglie; `FRAZ_DECORRENZA` resta come data storica | `verifiche/scadenze.mjs` lo pretende da quel giorno, e si spegne da sé quando è fatto |
| **il 1° gennaio 2027** | le **citazioni** delle norme fiscali, non le cifre: il D.Lgs. 117/2026 (testo unico delle imposte sui redditi) le riordina, e Normattiva mostra già i vecchi articoli come abrogati da quella data | la tavola di corrispondenza nella sezione del 2026-09-08 |
| a ogni modifica di un parametro, e a ogni rilettura completa delle fonti | `REVISIONE_ISO` | — |

Sull'ultima riga della tabella: speranza di vita e margine **si aggiornano insieme, o non si
aggiornano**. Il margine è calibrato su quella tavola: muovendone una sola il coefficiente si
sposta due volte.

**La guardia si verifica da sé.** Un controllo che dipende dalla data odierna non si può provare
aspettando: il ramo che avvisa si vedrebbe solo in ottobre, quello che blocca solo a gennaio.
`verdetto(revisione, oggi)` è una funzione pura di due date, e `scadenze.mjs` la esercita su sette
casi a ogni esecuzione prima di dare il verdetto vero.

La **seconda implementazione** va tenuta al passo del modello. Una che resta indietro è peggio di
nessuna: dà un falso «scarto zero» mentre calcola un'altra cosa (successo il 31/07/2026).

**Quando si aggiunge una casella, i fixture si aggiornano da soli — nel senso che falliscono.**
La regola era di disciplina: nei DOM finti un campo assente valeva `'0'`, la casella nuova
leggeva zero, e cinque casi diversi finivano sullo stesso numero senza che nessun controllo
fallisse — successo otto volte, e la difesa era «si scrive `campo: ''` esplicitamente», cioè la
memoria. Dal 21/08/2026 la pretende `verifiche/_armatura.mjs`: **leggere il `value` di una
casella che il caso di prova non dichiara fa cadere il controllo, per nome**
(`ARMATURA_ELENCA=1` le elenca tutte in un giro), e una chiave che la pagina **non ha più** viene
respinta da `controllaChiavi` — che al primo giro ha trovato due morti veri: `tipoFondo` nei
casi di come-parla e `patrimonio` nei moduli ostili. I casi partono dal **modulo appena
aperto** (`moduloIniziale()`, coi valori che l'HTML dichiara) e dichiarano il resto.

---

## I file

```
regole.mjs      le cifre, con nome · fonte · verificata
build.mjs       le porta ovunque servano
verifica.mjs    un comando solo per tutto
test.mjs        i controlli sul motore
verifiche/      come parla · valori ostili · tavole dei fondi · riscontri esterni ·
                seconda implementazione · invarianti · schermi · coerenza · consenso ·
                anteprime · scarica · scadenze · a-schermo · occhi · senza-scatti
                _armatura.mjs è il DOM finto di tutti, come i file con _ fra i sorgenti:
                un pezzo, non un controllo
sorgenti/       index.html + le pagine; i file con _ sono pezzi da includere
sito/           quello che si pubblica
```

**I commenti restano nei sorgenti.** Sono la memoria del progetto — perché una cosa è fatta così
e non in un altro modo — ma `build.mjs` li toglie da `sito/`: «visualizza sorgente» su un sito
pubblico è pubblico quanto la pagina, e in un commento si scrive come si scrive quando si sta
ragionando. Si tolgono solo i due casi in cui è sicuro farlo senza analizzare il linguaggio — i
commenti HTML e le righe che *cominciano* con `//` — sotto tre guardie che fermano il build invece
di pubblicare un danno. **Un commento in coda a una riga di codice esce**: quelli si leggono.

**I coefficienti di conversione non si copiano da nessun fondo.** Si ricostruiscono dalla
speranza di vita ISTAT allungata di un margine (`SPERANZA_VITA` × `MARGINE_RENDITA`): una tavola
pubblica e una stima sola, invece di dieci numeri presi da una convenzione privata che scade.
Le tavole vere di quattro fondi stanno in `verifiche/tavole-dei-fondi.mjs` e servono da
riscontro, non da parametro: **non si aggiornano per far passare il controllo**, se si spostano
loro si sposta il margine.

**L'annata della tavola ISTAT non è una cosa da inseguire.** Il margine è calibrato su quella
tavola: se la speranza di vita sale, il margine ricalibrato scende e il coefficiente non si
muove. Si aggiornano insieme, o non si aggiornano.

---

## Le pagine

| | risponde a |
|---|---|
| `index.html` | il calcolatore |
| `contributo-datore.html` | quando spetta il contributo dell'azienda e quanto vale |
| `fondo-pensione-o-etf.html` | le quattro differenze, e il confronto in cifre a parità di rendimento |
| `come-prendere-il-fondo.html` | capitale o rendita, la soglia che cambia con l'età |
| `rita.html` | requisiti e tassazione dell'erogazione anticipata |
| `tfr-fondo-o-azienda.html` | dove conviene il TFR, e perché la scelta non è simmetrica |
| `casa-e-decumulo.html` | quanto resta di una vendita, come cambia la spesa, e le due strade per restare |
| `dove-trovare-i-numeri.html` | da quale documento si ricava ciascun dato |
| `il-metodo.html` | procedimento, limiti, stato di verifica dei parametri |
| `privacy.html` | dove finiscono i dati inseriti |

Le pagine previste sono **tutte scritte** (31/07/2026). La terza che era in programma, «quanto si
può dedurre», **non è stata scritta di proposito**: il calcolatore la risponde meglio e in tempo
reale (tetto, quanto resta, sconto IRPEF, punto più alto), e una pagina ripeterebbe a parole un
risultato dato in cifre.

Ogni pagina di contenuto è **raggiungibile dal punto del modulo che la riguarda**, non solo dal
piè di pagina: è lì che serve a chi sta compilando.

**Una pagina di decisione deve chiudere con un numero** (06/08/2026). `tfr-fondo-o-azienda.html`
era l'unica che non lo faceva: esponeva bene i tre elementi del confronto e poi rimandava al
calcolatore. Misurato: `contributo-datore.html` usava dodici segnaposto `{{ex…}}`, quella del TFR
zero. Ora chiude con il caso in cifre e con la matrice comparto × orizzonte, generata da
`ESEMPIO_TFR`.

---

## Due registri, e non è un'incoerenza

Le pagine hanno **due mestieri diversi**, e chiedono due lessici.

- `il-metodo.html` è **documentazione**: serve a chi vuole controllare il conto, e il suo lettore
  vuole i termini esatti. Abbassarne il lessico la peggiorerebbe. Resta tecnica di proposito.
- le altre pagine **arrivano da una ricerca**: chi le apre non sa cosa sia un montante. Lì il
  criterio è **tecnico sui termini che sono termini, comune su tutto il resto**. «Montante» ha un
  significato preciso e si tiene, glossato; «cessazione dell'attività» non è un termine, è
  «quando si smette di lavorare».

Il **registro** invece non cambia da nessuna parte: impersonale, niente domande retoriche come
titolo, niente valutazioni al posto dei fatti. È quello che distingue il sito da chi vende.

Si misura contando i termini gergali ogni 100 parole. `rita.html` era a 5,4 ed è a 1,1; le altre
pagine divulgative stanno fra 1,2 e 2,7.

**E il calcolatore sta con le pagine divulgative, non con `il-metodo`** (02/08/2026). Chi compila
il modulo non è il lettore della documentazione: è la stessa persona che arriva da una ricerca,
solo un minuto dopo. Quindi lì valgono le parole comuni dove esistono —
**«anno», non «esercizio»** (l'esercizio è del bilancio d'impresa; qui gli anni sono di
calendario, e «anno» è altrettanto esatto); **«Anna smette di lavorare nel 2041»**, non
«cessazione dell'attività»; **«quanto c'è oggi»**, non «consistenza attuale». `il-metodo.html`
tiene «esercizio» e il resto del suo lessico: è l'unica pagina che non parla a chi compila.

**La regola per decidere, quando si esita**: la parola tecnica si tiene se chi legge la ritrova
sui propri documenti (montante, aderente, decorrenza stanno sull'estratto conto del fondo), si
sostituisce se è solo un modo più solenne di dire la stessa cosa.

## Il sito si legge anche su un telefono, e anche senza vederlo

Fino al 01/08/2026 non c'era **nessuna media query** se non quella di stampa: a 390 px le caselle
uscivano dallo schermo e il modulo non si compilava. Sotto i 600 px le due colonne diventano un
elenco e **ogni casella porta il nome della propria persona**, che il calcolo scrive in
`data-chi`: affiancarle si potrebbe, ma scorrendo non si saprebbe più di chi sia il campo.

**Ventinove campi su trentotto non avevano un'etichetta collegata**: il testo stava in un `<div>`
accanto, che si vede ma non si annuncia. Il nome accessibile lo compone `calc()` leggendo la
`.voce` della riga e aggiungendo il nome della persona. Non si duplica testo, e chi aggiunge una
casella dentro una `.cella` è coperto senza fare nulla.

**«Nascosto» vuol dire invisibile, non «ha l'attributo».** L'attributo `hidden` nasconde con una
regola del *browser*, che ha la specificità più bassa che esista: **qualunque `display` scritto su
una classe la batte**. Un elemento con `display:flex` e `hidden` resta in mezzo alla pagina, e il
codice che lo spegne non spegne niente.

È successo tre volte. A `.sommario`, e fu aggiunta la riga `[hidden]` gemella. Al **banner del
consenso**, che per ore non si è chiuso con *nessuno* dei due pulsanti. E a `.cur`, la riga del
cursore che non si è **mai** nascosta con una persona sola.

**Le prove erano verdi tutte e tre le volte**, perché guardavano `el.hidden` — cioè l'intenzione —
invece di quello che si vede. Ora ci sono due controlli: `schermi.mjs` lo verifica senza browser
(se una classe dichiara un `display` ed è di un elemento spento con `hidden`, deve esistere la sua
regola `[hidden]`), e `a-schermo.mjs` verifica in Chrome che **nessun elemento con `hidden` abbia
un `display` diverso da `none`**. *Una prova che misura l'intenzione invece dell'effetto è peggio
di nessuna prova.*

**Un `<details>` non si apre col CSS.** `details > *{display:block}` mostra i figli, ma un
dettaglio chiuso nasconde il contenuto con un meccanismo interno del browser: la tabella anno per
anno — che su carta è la parte verificabile — non veniva stampata. Ad aprirlo è `beforeprint`, e
`afterprint` richiude quello che era chiuso.

**Chrome senza finestra non scende sotto i 500 px**: chiedere 360 px dà 500 px e gli screenshot
sembrano giusti mentre misurano un'altra cosa. `a-schermo.mjs` usa degli **iframe** della
larghezza voluta, che sono viewport veri.

**E il calcolatore si rende in DUE assetti**, non uno: con un solo modulo «tutti al lavoro»
l'avviso di chi è già in pensione, le caselle disattivate e la sezione delle scelte che sparisce
non venivano mai resi, quindi nessuna misura poteva vederli. Regola generale: **un ramo di
interfaccia che nessuno scenario rende non è coperto**, per quanto verde sia il resto.

## Come il sito si presenta a chi non l'ha ancora aperto

Chi riceve il link su WhatsApp o lo trova su Google **non vede il sito**: vede una scheda fatta di
titolo, descrizione, immagine e briciole. La costruisce il build da quello che le pagine già
dichiarano, e si può rompere in silenzio: aprendo il sito è tutto giusto lo stesso. Per questo
c'è `verifiche/anteprime.mjs`.

**L'immagine è disegnata, non è un file.** `anteprima.mjs` scrive un PNG con `zlib`, che sta già
in Node: nessuna dipendenza, nessuno strumento esterno. Un'immagine messa lì a mano sarebbe
l'unica cosa in `sito/` che il build non sa rifare, e al primo cambio di colore resterebbe
indietro senza che nessuno se ne accorga. Disegna **la curva del patrimonio** che sale finché si
lavora e scende dopo, negli stessi colori del sito: chi vede l'anteprima ha già visto il prodotto.

**Due cose imparate disegnandola**, e valgono per qualunque grafica generata:
- i due rami della curva accostati e basta si incontrano con pendenze diverse, e **il colmo viene
  uno spigolo**: a 1200 px si legge come un errore di disegno. Si mescolano su una finestra;
- riempiendo l'area **per segmento**, i rettangoli adiacenti si sovrappongono di un pixel e quella
  colonna riceve la tinta due volte: nel risultato si vedono **strisce verticali**. Ogni colonna
  si riempie una volta sola.

**L'icona per iOS non è l'anteprima rimpicciolita**: dentro un quadrato salita più discesa
diventa una punta, e a 180 px si legge come un accento. Porta lo stesso segno della favicon, con
le stesse proporzioni. Un marchio è uno, in due misure.

**`og:image` vuole un indirizzo assoluto.** Relativo, la scheda resta senza immagine e nel
browser non cambia niente: è il difetto che il controllo esiste per prendere. L'origine si legge
una volta sola dal canonical della home, perché la 404 un canonical non ce l'ha.

**Le briciole sono dichiarate anche a chi indicizza** (`BreadcrumbList`), ricavandole dalla riga
che la pagina già mostra: dichiarare un percorso diverso da quello visibile sarebbe una
dichiarazione falsa a un motore di ricerca. E la sitemap porta `lastmod`, che non è la data del
file né quella di oggi: è **la revisione dei parametri**, l'unica che significhi qualcosa su una
pagina che espone cifre di legge.

---

## L'ingresso: 91 parole, non 182

Fino al 01/08/2026 prima della prima casella c'erano **182 parole**, e quasi tutte erano il
riquadro del perimetro: tre capoversi di «non si applica a…». Chi arrivava da una ricerca leggeva
avvertenze prima di qualunque valore.

Il perimetro però **non si poteva togliere**: un autonomo che compila dieci caselle e poi scopre
che il conto non fa per lui sta peggio di uno avvisato subito. È rimasta quindi **la sola cosa che
decide SE compilare**; il resto sono limiti di modello e stanno in `il-metodo.html`, dove stanno
gli altri, più nel piè di pagina di ogni pagina. Regola già applicata altrove qui dentro: *non si
avvisa tutti in anticipo di un caso che riguarda pochi*.

**E un evento solo su Analytics, `verdetto`**, mandato una volta per apertura e **senza alcun
parametro**: né l'esito né una cifra. Sapere quante visite arrivano non dice se il modulo è troppo
lungo; sapere quante arrivano a una risposta sì. La prossima decisione sull'ingresso si prende su
quel numero, non a impressione.

---

## Le forme che consumano il montante invece di convertirlo

Dal 1° luglio 2026 l'art. 11 c. 3-bis ammette, **in luogo della rendita vitalizia**, la rendita a
durata definita, i prelievi liberamente determinabili e l'erogazione frazionata. Le prime due
sono modellate; i prelievi liberi no, ed è una scelta motivata più sotto.

**Non sono una quarta forma di rendita, ed è la ragione per cui l'interfaccia le separa.** Le tre
forme classiche applicano un *coefficiente* al montante e lo convertono; queste lo **tengono nel
fondo** (art. 11 c. 3-quinquies) e lo consumano a rate. Chi converte è coperto finché vive e non
lascia nulla; chi consuma tiene i soldi e rischia di finirli. Cinque pulsanti in fila lo avrebbero
nascosto: ce ne sono due gruppi, *convertire* e *tenere e consumare*.

**Quello che la legge detta, e che quindi non si sceglie:**
- la **durata definita** dura gli anni **interi** della vita attesa (art. 11 c. 3-ter): a 67 anni,
  19. La tavola è `VITA_INTERA`: le Istruzioni COVIP del 25 giugno 2026 **non contengono nessun
  allegato** con quei numeri, ripetono il rinvio della legge alla tavola ISTAT e aggiungono la sola
  cosa che serviva, cioè che si arrotonda **per difetto**. Riscontrata quindi dove la legge manda:
  tutte e 41 le età coincidono col troncamento delle tavole di mortalità **ISTAT 2023**, Italia,
  maschi e femmine (scaricabili da `demo.istat.it`). Col 2022 non ne coincidono diciassette.
  **Non è `SPERANZA_VITA`**, che porta i decimali e serve ai coefficienti: le due
  coincidono in quindici età su ventuno, e coincidono a 67 anni, ma dove differiscono vale quella
  ufficiale, perché è quella che i fondi applicano;
- l'**erogazione frazionata** dura quello che si sceglie, **non meno di cinque anni**;
- **la rata non è fissa**: a ogni scadenza è il montante disponibile diviso le rate che restano.
  È la differenza con la RITA, che il conto fissa alla prima rata;
- **l'imposta si paga rata per rata**, non tutta alla prestazione: l'anzianità cresce durante
  l'erogazione, quindi l'aliquota scende. Tassare tutto all'inizio le avrebbe applicato
  l'anzianità di quel solo anno per vent'anni;
- **l'erogazione frazionata costa di più**: dal {{aliqFrazMax}} al {{aliqFrazMin}}, contro il
  {{aliqFondoMax}}–{{aliqFondoMin}} delle altre. Chi ha trentacinque anni di iscrizione ci arriva
  dove le altre *partono*.

**I prelievi liberi non sono modellati, di proposito.** Sono una decisione presa esercizio per
esercizio: rappresentarli vorrebbe dire attribuire a chi compila una politica di prelievo che non
ha dichiarato. Ma il loro tetto è la somma delle rate della durata definita, che il conto espone:
**lo scostamento è di profilo temporale, non di importo**, e questo si può dire.

**Come è stata fatta la modifica senza toccare i risultati esistenti.** L'incasso è stato
ristrutturato per spezzare l'imposta insieme al montante: `quota × (montante − base × aliquota)`
è esattamente il `netto × quota` di prima, quindi le tre forme classiche danno **lo stesso
risultato al centesimo** — verificato, il caso di prova non si è mosso di un euro.

**Due difetti trovati costruendola, e valgono più del codice:**
- con una durata a NaN il montante veniva **azzerato senza uscire da nessuna parte**: il piano
  perdeva trecentomila euro e nulla lo diceva. C'è ora un pavimento a una rata e un'invariante
  che lo impone sui 4.000 piani;
- la seconda implementazione ha trovato che la pagina registrava come «montante alla prestazione»
  il **residuo** invece del montante, perché lo leggeva dopo averlo ridotto. Le frasi dicevano un
  fondo più piccolo di quello che era.

**E un'invariante che era sbagliata io.** Pretendeva che dal fondo uscisse almeno metà del
montante: ma con rendimento reale molto negativo le rate valgono meno, e non è denaro perso.
Segnalava quattro piani sani su quattromila. La proprietà giusta non dipende dai rendimenti: il
residuo dev'essere **uscito o rimasto**.

---

## Portare via il piano

In fondo al calcolatore ci sono tre comandi. **«Ricomincia da zero»** era chiamato *«Rimetti i
valori di partenza»*, che faceva pensare a dei dati d'esempio: il codice cancella tutto e riapre
la pagina come nuova, ed è quello che l'etichetta adesso dice. **«Salva in PDF o stampa»** apre la
stampa del browser, che è già curata e verificata (apre da sé il dettaglio anno per anno, che su
carta è la parte verificabile). **«Scarica il piano»** scrive un `.xlsx`.

**Perché un `.xlsx` e non un CSV.** In Italia la virgola è insieme separatore decimale e
separatore di colonna, ed Excel indovina: metà delle volte esce una colonna sola. Un `.xlsx` è uno
zip con dentro qualche XML e si scrive senza librerie, come già si fa col PNG dell'anteprima. I
numeri restano **numeri**, e il file si apre giusto in Excel, Fogli Google e Numbers.

**L'archivio non è compresso**, di proposito: comprimerlo avrebbe voluto dire portarsi dentro un
deflate per risparmiare venticinque chilobyte. In cambio il contenuto si rilegge senza
decomprimere niente, e infatti il controllo lo fa.

**IL FILE SI PORTA DIETRO LE PROPRIE IPOTESI**, e non è un ornamento: un foglio con dentro una
proiezione a quarant'anni, riaperto fra sei mesi senza sapere con quali rendimenti e quale
inflazione è stato fatto, è un foglio che mente. La prima scheda porta dati inseriti, ipotesi,
verdetto e **in che valuta è la tabella**; la seconda porta la tabella e basta, pulita, così si
può ordinare e ci si può fare un grafico.

Il verdetto nel file **è quello letto dalla pagina**, non ricostruito, e il pulsante resta spento
finché un verdetto non c'è: scaricare il conto di prima è il modo silenzioso di consegnare un
documento sbagliato.

---

## La misurazione delle visite, e il consenso che la precede

Dal 01/08/2026 il sito misura le visite con **Google Analytics**. È l'unica cosa che manda dati
fuori dal browser, e in Italia richiede un consenso **preventivo**: il frammento che Google
consegna, incollato com'è, farebbe partire il tag al caricamento della pagina, prima di qualunque
scelta. Qui il tag **non sta nel documento**: lo crea il codice, e solo dopo un sì.

Tutto sta in `sorgenti/_consenso.html`, che viaggia dentro `_pie.html`: ogni pagina include già il
piè di pagina, quindi **non esiste una pagina che possa restare senza**. Per questo le inclusioni
del build sono diventate **ricorsive**: con una passata sola il banner andava aggiunto a mano su
nove file, cioè dimenticato sul decimo.

**Tre regole decidono la forma del banner, e non sono di stile:**
- **rifiutare dev'essere facile quanto accettare**: due pulsanti identici, niente «accetta» in
  evidenza e «rifiuta» come link grigio. Un consenso non libero non è un consenso;
- **il silenzio non è consenso**: non c'è crocetta per chiudere, e scorrere o navigare non vale
  come sì;
- **si revoca da dove si è dato**: il piè di pagina di ogni pagina dice lo stato e permette di
  cambiarlo, e alla revoca i cookie `_ga` già scritti vengono cancellati.

La scelta sta in `localStorage` sotto **`decumulo-it-consenso`**, distinta da `decumulo-it` che
sono i dati del modulo: azzerare il calcolatore non deve cancellare una scelta di privacy, e
revocare non deve cancellare quello che si è scritto.

**Che tutto questo regga lo controllano due file, e servono tutti e due.** `consenso.mjs` guarda
il documento (il tag non è nel markup, nessuna risorsa esterna, il banner c'è ovunque, i due
pulsanti sono uguali, l'informativa dice quello che il sito fa). Ma **nessun controllo statico
prova il comportamento**: un errore nel codice del banner lo lascerebbe muto, e il sito sembrerebbe
a posto mentre misura chi ha detto di no. Per quello `a-schermo.mjs` apre Chrome, clicca, e guarda
se il tag è arrivato. Provato rompendolo apposta: con `accendi()` chiamato senza condizione, due
controlli diventano rossi.

**Il banner ha aggiunto un secondo `<script>` alla pagina, e questo ha rotto cinque armature**:
prendevano «il primo blocco», che da quel momento era il banner invece del motore. Ora ciascuna
dice *cosa* vuole (il blocco che contiene `function simula(`) invece di fidarsi dell'ordine in cui
il build monta i pezzi. Stessa cosa per i fogli di stile, che ora si leggono tutti.

---

## I venti casi, e cosa ha trovato il confronto con l'esterno

`verifiche/casi-esterni.mjs`, del 03/08/2026. Nasce da una domanda sua — quanto c'è da fidarsi
della matematica — e da una risposta che vale come metodo: **l'aritmetica è la parte più
verificata del progetto** (326 controlli, un secondo motore riscritto dalle regole, 4.000 piani
casuali), quindi rifarla a mano sarebbe rifare peggio un lavoro già fatto meglio. **Quello che
nessuna di quelle difese può vedere è l'omissione**, e l'omissione si vede solo da fuori.

**IL DISEGNO, e il punto che lo determina: il nostro risultato finale non ha un gemello.** Nessuno
calcola «quanto durano i risparmi di due persone per 47 anni». Quindi il confronto è **per
componente**, e i casi non sono persone realistiche: sono costruiti per **isolare un pezzo alla
volta**. Con una persona intera e il 3% di scarto non si saprebbe quale dei nove ingredienti
l'ha prodotto. E stanno **sui gradini della legge** — gli scaglioni, i due tratti del cuneo, il
quindicesimo anno, le soglie di cumulo — perché le combinazioni le coprono già i piani casuali,
mentre è sulle discontinuità che un istituto dimenticato si vede.

**Quattro differenze sono nostre scelte dichiarate e vanno neutralizzate prima**, o si insegue un
fantasma: il perimetro fiscale (niente addizionali né carichi di famiglia), il reale contro il
nominale, i costi del fondo già dentro i nostri rendimenti, e la convenzione sul rendimento che
matura a inizio anno.

**LA FONTE MIGLIORE NON È UN CALCOLATORE, È UN DOCUMENTO OBBLIGATORIO.** Il *progetto
esemplificativo standardizzato* che la COVIP impone a ogni fondo dichiara le proprie ipotesi
dentro di sé, è pubblicato, e per giunta espone i valori **in termini reali**, che è la nostra
stessa convenzione. Un calcolatore interattivo vale il giorno in cui lo si interroga; questo vale
a ogni build. **Un riscontro che non si può rieseguire decade.**

**E SE NE PRENDONO TRE, NON UNO.** Non per avere la stessa conferma ripetuta: perché ciascuno
copre un tratto che gli altri non toccano. Fon.Te. e Credemprevidenza ipotizzano il pensionamento
a 67 anni; **Cooperlavoro a 65 per l'uomo e a 60 per la donna, e porta sei durate in più**. Le basi
tecniche sono di tre famiglie diverse — RG48 distinta per sesso, **IPS55U unisex delle basi COVIP**
(il riferimento più pulito che esista: nessuna media da fare fra un uomo e una donna, e tasso
tecnico 0%), e quella di Cooperlavoro. **Un fondo solo avrebbe detto se andiamo d'accordo con lui;
tre dicono se stiamo nel mondo.**

**Cosa ne è uscito:**
- **i versamenti cumulati tornano al centesimo: 27 confronti, scarto massimo mezzo centesimo**,
  su tre fondi, tre livelli di contributo e nove durate (10, 15, 17, 20, 25, 27, 30, 35, 37 anni).
  È il riscontro che vale di più, perché non dipende da rendimenti, costi o imposte: dipende solo
  dal calendario dei contributi, ed è lì che si nasconde un errore di un anno — quello che sposta
  poco e che nessuna invariante vede;
- **il coefficiente regge contro tre convenzioni**: a 67 anni sta fra donna e uomo della RG48
  (−1,9% dalla media), è a −3,3% dalle basi COVIP unisex, e a 60 anni è a +1,4% dal terzo fondo —
  quest'ultimo serve perché la curva potrebbe essere giusta in un punto e sbagliata nella
  pendenza. E lo scarto uomo/donna misurato è 14,9%, cioè il «circa 15%» che `il-metodo.html`
  afferma: **anche un numero scritto in prosa va riscontrato**;
- **sul montante siamo sotto di 0,3-1,4%, e sempre sotto**: è il costo della convenzione
  prudenziale, misurato invece che dichiarato. La banda è al 2% e **non si stringe per far
  tornare il conto**: serve a vedere un errore di struttura, non a certificare il terzo decimale
  di un'ipotesi che la fonte non dichiara;
- **un limite che non avevamo dichiarato**: con figli minori, studenti o inabili nel nucleo la
  riduzione per redditi propri della pensione ai superstiti **non si applica affatto**
  (art. 1 c. 41 L. 335/1995). Noi la applicavamo comunque. Lo scarto è prudenziale, ma taceva.

**IL NETTO IN BUSTA È STATO CHIUSO** (03/08/2026), e sembrava il buco non chiudibile: quel
numero esiste solo dentro calcolatori interattivi, che nessuno script può compilare. Lo ha risolto
una **tabella pubblicata** — «da RAL a netto» del *Commercialista Telematico* — che vale più di un
calcolatore per la stessa ragione dei progetti esemplificativi: **dichiara le proprie ipotesi**,
comprese le due aliquote di addizionale, che sono l'unica differenza di perimetro col nostro conto
e che si tolgono con le loro stesse cifre.

**Sei retribuzioni su sei a scarto ZERO** (15.000, 18.000, 20.000, 30.000, 40.000, 50.000 €), il
che riscontra in un colpo scaglioni, detrazione dell'art. 13, ulteriore detrazione del cuneo, somma
del comma 4 e trattamento integrativo.

**Per giorni la riga da 15.000 € si è discostata di 1.200,00 € esatti**, ed era il trattamento
integrativo, che il modello dichiarava di non rappresentare. Il **07/08/2026** è stato
rappresentato e la riga si è chiusa da sé: *la misura dello scarto era già la prova che mancava
quello e nient'altro*. Il controllo ora pretende anche che torni **per la ragione giusta** —
togliendo il trattamento la riga dev'essere più bassa esattamente del suo importo — perché un
riscontro che torna può tornare per due errori che si elidono, e proprio sotto quella soglia c'è
anche il salto della detrazione dell'art. 13.

**Un limite dichiarato è diventato un limite misurato**, ed è il guadagno vero: `il-metodo.html`
non dice più «il risultato è conseguentemente prudenziale» ma *di quanto*. Se un giorno quello
scarto cambiasse, vorrebbe dire che si è mosso qualcos'altro.

## La rete che non pescava (03/08/2026)

Trovato rispondendo a una domanda sua sugli scenari, non cercandolo. **`invarianti.mjs` stampava
`VIOLATA (2849x)` e usciva con codice ZERO.** `verifica.mjs` giudica un passo solo dal codice di
uscita, quindi la catena dichiarava «tutto verde» mentre l'allarme suonava — e il riepilogo, che
mostra le ultime otto righe, lo spingeva fuori dallo schermo con le dieci `ok` che seguono.
Era **l'unico dei sedici controlli senza un'uscita**: non un difetto sistematico, un file.

**Le tre violazioni nascoste erano tutte della prova, non del motore** — ed è la ragione per cui
erano rimaste lì: chi le avesse guardate avrebbe visto che il conto era giusto e sarebbe passato
oltre. Ma il costo non era zero.

- **«il datore versa anche sotto il minimo», 2.900 volte su 4.000.** Provava un centesimo sotto
  *quello che si versa*, mentre il gradino sta al *minimo del contratto*: chi versa più del minimo
  non lo attraversa affatto. **Un'invariante che spara su tre quarti dei casi non è un allarme, è
  rumore**, ed era il rumore che rendeva invisibile l'unica riga che diceva qualcosa.
- **«il canone si riduce con la scala di equivalenza», 28 volte.** L'anno del cambio casa si
  estrae fino al 2075 e molti piani finiscono prima: la prova misurava un canone che in
  quell'anno non c'era ancora. **Un'invariante che non controlla di essere applicabile misura il
  proprio fixture.**
- **«con la prova il patrimonio dura di più», una volta.** L'unica sostanziale, e resta aperta:
  vedi il registro dei dubbi.

**E il generatore non era seminato.** Con `Math.random()` i 4.000 piani cambiavano a ogni
esecuzione, e la violazione da uno su quattromila compariva e spariva. **Una catena che fallisce a
intermittenza e passa al secondo tentativo è peggio di una che non fallisce mai: insegna a
rilanciare finché è verde.** Ora c'è `SEME`, stampato a ogni esecuzione e ripetuto nel messaggio
di errore, così una violazione si riproduce.

**IL SEME HA SUBITO PAGATO, per una ragione inattesa.** Il generatore non riempiva la casella del
minimo contrattuale: l'armatura la sostituiva con `0`, quindi **il ramo «casella vuota» non era
mai stato eseguito da nessuno dei 4.000 piani**. Aggiungendola, una *seconda* invariante scaduta
ha cominciato a violare 393 volte — confrontava un punto sotto il gradino con uno sopra e chiamava
crescita quello che era il gradino. Passava solo perché quel campo era sempre zero.

**Regola: un'armatura che riempie i buchi con un valore di comodo non sta provando il caso
normale, sta provando il valore di comodo.**

## Otto persone, lette una per una (03/08/2026)

L'ultimo pezzo, e l'unico che nessun controllo può fare: **otto profili realistici, e leggere
quello che il calcolatore gli dice.** Non «i numeri tornano» — quello lo sanno già in seicento —
ma «questa frase, a questa persona, sta in piedi?».

**La regola che li rende utili: metterci i casi scomodi.** Un operaio che versa solo il TFR, una
impiegata sola senza fondo, una vedova con 950 € di pensione e 25.000 € da parte. È lì che un
calcolatore dice le cose più stupide, ed è lì che il collaudo naturale non va mai, perché si prova
sempre il caso che funziona. Dei sette difetti trovati, **cinque stavano su quei tre profili.**

| letto | cos'era |
|---|---|
| «il patrimonio si esaurisce **ai 83 anni**» | l'elisione conosceva 1, 8 e 11 — bastano alle percentuali — ma non gli **ottanta**, che nel verdetto sono l'età più frequente |
| «**com'è adesso**» e basta | la riga che spiega quanto costa la quota esiste solo per chi una quota ce l'ha: chi non versa niente vedeva due parole. È la persona a cui quella sezione serve di più |
| «Il fondo non viene riscosso dentro il piano» | detto a chi **un fondo non ce l'ha**: gliene annuncia uno che non esiste |
| «fondo **di la persona** riscosso nel 2038» | la forma articolata viaggia col nome, e due punti la ricomponevano a pezzi. **C'era già un commento che lo vietava, due righe sopra** |
| «**Consistenza** minima nel 2053» | la parola che avevamo tolto dalle etichette era rimasta nelle frasi generate |
| «il secondo **smette di lavorare nel 2025**» | chi ha la decorrenza nell'anno in corso non è «già in pensione», ma il suo ultimo anno di lavoro cade prima che il piano cominci: si annunciava un fatto che nella tabella non compare |
| «TFR **la persona**» sul grafico | l'etichetta corta non deve nominare nessuno quando la persona è una sola |

**E adesso sono controlli, in `come-parla.mjs`.** Il più generale vale da solo: **una preposizione
attaccata a un articolo** — «di la», «di il», «a le» — in italiano non esiste mai, e nasce sempre
dallo stesso gesto. Attenzione a **`con`**, che è l'unica preposizione che non si contrae per
forza: metterlo nell'elenco faceva fallire venti scenari su frasi corrette («con la rendita
reversibile»).

**LA LEZIONE PIÙ UTILE È SU DUE CONTROLLI CHE HO SCRITTO IO E CHE NON POTEVANO FALLIRE.**
Il primo cercava «agli ottanta» in un caso in cui l'età era quaranta. Il secondo cercava un piano
senza fondo in un fixture che il fondo se lo costruiva da solo, coi contributi e il TFR — «niente
fondo oggi» non vuol dire «niente fondo alla pensione». Passavano tutti e due, senza aver guardato
niente. E il controllo sulla preposizione, appena scritto, **non vedeva il difetto che l'aveva
motivato**: tutti gli scenari avevano i nomi compilati, e quel difetto vive solo coi nomi vuoti.
**Ogni difetto va rimesso e visto fallire, o si è scritta una cerimonia.** Fatto per tutti e
quattro.

## 2026-08-06 — gli esempi delle pagine avevano una rete: nessuna

`ESEMPIO` in `regole.mjs` **è una seconda implementazione** delle regole del motore, scritta per
far parlare le pagine in cifre. Fino a oggi non la confrontava niente: `grep -rn ESEMPIO test.mjs
verifiche/ build.mjs` non trovava una riga, e i dodici numeri di `contributo-datore.html` erano
pubblicati sulla fiducia. Il rischio non era teorico — il commento sopra `irpefNetta` racconta la
volta in cui «la pagina direbbe 330 € dove il conto ne dice 417».

`verifiche/esempi.mjs` ricalcola quei numeri **col motore vero**, caricato dalla pagina costruita
come fa `seconda-implementazione.mjs`. Il lato «TFR in azienda» si confronta end-to-end, perché il
motore lo espone in `liquidazioni` con montante, aliquota e imposta; il lato «nel fondo» non è
isolabile — dentro il fondo il TFR si mescola ai contributi — e lì si confronta la regola.

**Ha trovato due cose al primo giro, e nessuna delle due si vedeva da fuori.**

**1. `irpefNetta` in `regole.mjs` non applicava l'ulteriore detrazione**, che il motore applica
(art. 1 c. 6 L. 207/2024, spetta al solo reddito di lavoro). **Sul numero pubblicato non si
vedeva**, ed è la parte che vale: con la RAL dell'esempio (35.000 €) i due redditi confrontati
cadono tutti e due nella banda piatta da 1.000 €, che sparisce nella differenza. Nella banda in
cui la detrazione decresce sarebbe stato falso: a 38.000 € lo sconto vero è 247 € e la funzione
ne dava 190.
**Regola: un esempio che cade in una zona piatta non prova la formula che lo ha prodotto.**
E il difetto resisteva anche a una rilettura, perché `aliqMargEff` contava già la pendenza
dell'ulteriore detrazione: la pagina dichiarava l'aliquota effettiva giusta e lo sconto sbagliato.

**2. `ALIQ_FONDO_MAX/MIN/PASSO` erano scritte a mano nel calcolatore** (`0.15`, `0.09`, `0.003`)
mentre in `REGOLE` avevano fonte e `verificata: true`. Le tre sorelle dell'erogazione frazionata
(`ALIQ_FRAZ_*`) si generavano già; queste no. Correggere la legge in `regole.mjs` avrebbe spostato
`il-metodo.html` e **non il conto**. Ora escono da `blocco()` come tutte le altre.
Da notare: `coerenza.mjs` dichiarava «nessun parametro è cablato anche nel motore» e non le vedeva
— cercava le cifre nella forma in cui stanno in `REGOLE`, non nella forma decimale con cui erano
scritte nel codice.

## 2026-08-08 — il controllo a tappeto della matematica: sette difetti, e nessuno nelle norme

Revisione certosina di tutto il motore. **Le regole di legge erano giuste** — IRPEF, detrazioni
dell'art. 13, cuneo, art. 19 sul TFR, art. 11 sul fondo, soglia del «tutto in capitale»,
reversibilità con salvaguardia e Corte cost. 162/2022, ricontrollate una per una. I difetti stavano
tutti nell'impianto attorno, e nessuno faceva fallire niente: **è la categoria dei difetti che
lasciano la catena verde.**

### Tre cambiavano un numero che si legge in pagina

**1. Il «punto più alto» non cercava dove il piano smette di reggere.** `candidatiVersamento`
prova i vertici della spezzata, e `meglioDi` mette la tenuta prima del finale — ma **l'ottimo di
una funzione crescente sotto vincolo sta sul vincolo**, che non è un vertice della funzione.
Restava la sola rete degli interi. Misurato con la forza bruta a passo 0,1 su 300 piani:
**80 consigli non ottimi, il peggiore da 136.840 €** (35% invece di 35,9%).
Tre cause, e tutte e tre chiuse:
- la **frontiera della tenuta** → `pcTenuta`, gemella di `pcSoglia`: si guardano i due estremi e
  si biseziona solo se il segno cambia. *Aggiungere candidati non può peggiorare la risposta*,
  quindi anche una tenuta non monotona restituisce un bordo, mai un errore;
- gli **spigoli di reddito mancanti** (15.000 e 8.500 €). L'elenco era scritto a mano e ricopiava
  `ULTERIORE_DETRAZIONE`; ora lo genera `regole.mjs` dalle tabelle stesse (`SOGLIE_REDDITO`).
  **Tre cifre a mano in meno, non una in più**;
- gli **spigoli che non vale la pena nominare** — il minimo fra versato e montante, e la tenuta che
  può perdersi e ritrovarsi più volte → `affina`, venti decimi intorno al vincitore. **0,8 ms**
  sui 30 in cui il ricalcolo si sente (misurato: 14,4 → 15,2 ms).

**Risultato: 0 su 300.** E sul bordo la pagina ora lo dice: *«— oltre, il piano non arriva in fondo»*.

**2. Il nome era usato come identità della persona.** Cinque `find(v => v.chi === x.nome)`. Con
due nomi uguali — un cognome nella casella basta — la seconda persona leggeva montante, aliquota e
rate della prima, e il netto delle rate finiva tutto su una riga sola. **Il piano restava giusto,
quindi niente falliva.** Ogni record porta ora `idx`. I 4.000 piani non lo vedevano perché i nomi
erano fissi ad `Anna`/`Bruno`: ora possono coincidere, **e il cambio ha scoperto lo stesso difetto
dentro le verifiche**, che attribuivano per nome pure loro.

**3. Un rendimento reale negativo era scritto come «nessun rendimento».** Chi prova lo scenario
pessimista — il motivo per cui quella casella è scrivibile a mano — leggeva *«nessun rendimento: il
patrimonio è nullo o negativo»* con 537.157 € dentro, e la colonna «Rendim.» della tabella metteva
un trattino tutti gli anni. Il test giusto è sul **patrimonio**, non sul segno dei soldi; e `cc()`,
che il segno lo guarda, esisteva già due righe più in là. **Nessuno scenario aveva un rendimento
reale negativo: è la ragione per cui è durato.**

### Tre erano due convenzioni per la stessa grandezza

`f[i].versati /= (1 + s.infl)` dice che il modello la regola la conosce: una base imponibile è
**nominale** e va riportata a euro di oggi. Non era applicata dappertutto.

**4. La base imponibile del TFR non si sgonfiava affatto.** Su quarant'anni al 3% usciva **il 75%
sopra il vero**, cioè undici punti del TFR lordo di imposta inventata. Una riga nel ciclo, gemella
di quella del fondo, e la somma scontata al posto del conteggio secco degli anni nel seme —
**attenzione**: Σ(1+i)^−k **da k=0**, perché il fattore di accumulo parte da (1+r)^0. Scontarne uno
di troppo farebbe parlare le due somme di anni diversi.

**5. `versati` smetteva di sgonfiarsi durante l'erogazione a rate**, che tiene la posizione aperta
vent'anni dopo la prestazione. La riga è uscita dall'accumulo.

**6. La rata della RITA cresceva in euro nominali** — l'unico punto in cui il conto era ottimista.
La norma e i fondi dicono che **la rata si ricalcola** a ogni scadenza sul montante che resta,
perché il capitale non erogato continua a stare nel comparto. È la stessa legge delle forme che
consumano: ora i due blocchi la dicono allo stesso modo. **Conseguenza da gestire, non da scoprire
dopo**: una RITA portata fino alla pensione *esaurisce* la posizione, quindi non nasce più alcun
incasso, e tre frasi che davano per scontato un residuo dicevano il contrario del vero.

### E una disuguaglianza fra due punti che descrivono lo stesso flusso

**7. Lo scenario del superstite escludeva `daRata`** mentre `fasi()` la conta fra i flussi
ricorrenti. Con l'erogazione frazionata la percentuale mostrata era 71% invece di 83% — dodici
punti, sopra una soglia di verdetto che sta a 66,7%.

### Il trattamento integrativo, e perché un limite dichiarato ha smesso di bastare

Era dichiarato e **misurato al centesimo**. Ha smesso di essere innocuo non per la fascia che ne
beneficia, ma per tutte le altre: senza, il modello esponeva a 15.000 € di reddito una **perdita
secca di 1.145 €** che la disciplina non ha (la detrazione dell'art. 13 c. 1 scende lì da 3.100 a
1.955 €, e nella realtà quel salto lo colma proprio il trattamento) — e il ricercatore del punto
più alto ci si aggrappava, consigliando di fermarsi appena sopra la soglia per una ragione
inesistente. **Correggere il punto 1 senza questo avrebbe peggiorato le cose.**
Il riscontro era già in casa e ha chiuso da sé: la riga da 15.000 € è passata da −1.200 € esatti a
zero, come le altre cinque.

### Il ricontrollo, e i tre difetti che stavano nella prosa

La catena era verde e la matematica reggeva, ma **una frase di accompagnamento citava la norma
sbagliata**. Il ricontrollo che ne è seguito ha trovato tre cose, nessuna nel motore.

**La diagnosi vale più dei difetti**: tutte le cifre erano state verificate sul testo prima di
essere scritte. La citazione sbagliata sta in un paragrafo di **prosa** aggiunto alla fine, mentre
si documentava un limite che *non* si stava correggendo. **La prosa che accompagna un limite
dichiarato va verificata come il codice che lo produce** — anzi di più, perché nessun controllo la
esegue.

1. **La quota del datore non sta nell'art. 51 c. 2 lett. h TUIR.** Quella lettera copre le sole
   somme *trattenute al dipendente*, e la circolare 70/E del 18 dicembre 2007 lo dice alla lettera:
   «non concorrono a formare il reddito *(e, pertanto, il datore di lavoro deve escluderli
   direttamente dal reddito di lavoro dipendente)* gli oneri di cui all'articolo 10 … **se
   trattenuti dal datore di lavoro**». La quota del datore sta nell'**art. 8 c. 4 D.Lgs.
   252/2005**. Il commento che stava già nel motore era corretto: era la frase nuova a usare la
   norma giusta per il soggetto sbagliato.
2. **La verifica che poteva essere una catastrofe, ed è venuta pulita.** Se la quota del datore
   entrasse nel *reddito complessivo*, sarebbero sbagliate le detrazioni dell'art. 13 di
   **chiunque**, non solo di chi supera i 265.000 € di RAL. Verificato: il punto 1 della
   Certificazione Unica è già al netto (la quota è certificata a parte, al punto 412). Il motore è
   giusto. *Quando si scopre un errore in una frase, si chiede subito se la stessa confusione stia
   anche nel conto.*
3. **Il ricalcolo della rata RITA era spacciato per legge.** L'art. 11 c. 4 impone il solo
   frazionamento; il ricalcolo è **prassi dei fondi**, e ora è marcato `stima`.
4. **Il buco vero: `rita.html` dichiarava un residuo che non esiste più** — due sezioni intere.
   `coerenza.mjs` aveva fatto il suo dovere, stampando i 29 limiti dichiarati perché venissero
   riletti; a non rileggerli è stata una persona.

**Il rimedio meccanico**, in `verifiche/esempi.mjs`: **«le affermazioni delle pagine, provate sul
motore»**. Ci si mette una frase solo se il motore può contraddirla senza interpretazioni — «il
fondo è un buon investimento» no, «la posizione si esaurisce» sì. **E vale nei due versi: anche un
limite dichiarato è un'affermazione**, quindi correggendo il limite il controllo fallisce e obbliga
a riscrivere la pagina che lo dichiarava.

**Il riaudit numerico**, da principi primi e senza richiamare le funzioni del motore: 21 riscontri
su TFR, trattamento integrativo, RITA e base imponibile del fondo. Tutti tornano. Il primo giro
accusava 1.177 € di scarto: era un **off-by-one nel controllo**, non nel motore — nel primo
esercizio il seme non si sgonfia, perché è già in euro di quell'anno come l'accantonamento.
*Quando un riaudit accusa il motore, il primo sospettato è il riaudit.*

### Le regole che ne escono

- **Un ottimo vincolato non sta su un vertice della funzione, sta sul vincolo.** Nessun elenco di
  punti notevoli lo contiene, per quanto lo si completi.
- **Un elenco di soglie scritto a mano si scolla dalle tabelle da cui nasce.** Va generato.
- **Il nome di una persona non è la sua identità.** Se due record si cercano per nome, il difetto
  non tocca i totali e nessun controllo sui numeri lo vede.
- **Il segno meno non è l'assenza.** Ogni frase che dice «non è successo niente» va provata su uno
  scenario in cui il numero è negativo.
- **Una base imponibile è nominale.** In un conto tenuto in euro di oggi va sgonfiata *ovunque*: se
  in un punto lo si fa e in un altro no, il secondo è sbagliato.
- **Un limite dichiarato smette di bastare quando qualcosa comincia a ottimizzarci sopra.**
- **Un'invariante scritta per autorizzare una semplificazione fa il suo mestiere quando cade.**
  Quella sul cursore al 100% della RAL diceva «se un giorno il netto tornasse positivo, fallisce
  qui e non in pagina»: è successo, e la pagina ha guadagnato la seconda frase invece di scriverne
  una sbagliata.
- **Un test può codificare il difetto.** Tre lo facevano — «alla pensione avanza qualcosa», «quel
  che avanza sta sotto soglia», e due soglie tarate sull'imponibile gonfiato. Riscritti sul fatto,
  non ritarati sul caso.

## 2026-08-11 — la terza banda: il TFR fermo in azienda, che nessuno vedeva

La domanda era se aggiungere un **secondo grafico** con patrimonio, liquidità, fondo e TFR.
Studiando il codice la domanda si è spostata: **due di quelle serie c'erano già** (il grafico non
traccia una curva, ne impila due), **una non esiste** — la «liquidità» sarebbe una seconda via
della composizione fino al conto, e il commento accanto a `rendDaComposizione` la vieta da sempre
— **e una mancava davvero.**

`tfr[i].pot` si rivaluta anno per anno ma **non entrava in `righe`**: non stava nel grafico, non
nella tabella, e compariva solo come `daTfr`, un lampo in un anno solo. Misurata su undici
scenari, quella giacenza vale **8,9-26,5% del patrimonio totale** e resta accesa 26 anni su 56.
Il patrimonio saltava di ottantatremila euro senza che niente, prima, dicesse che stavano
arrivando.

**Il guadagno che vale più della percentuale**: il grafico non sapeva mostrare la differenza fra
«TFR al fondo» e «TFR in azienda», che è una decisione che il modulo chiede e a cui è dedicata una
pagina intera. Ora si vede, e si vede anche il caso sottile — chi ha conferito al fondo tiene
comunque il **pregresso** in azienda, che è il punto su cui il codice diceva «la pagina era più
precisa del conto».

**Il secondo grafico dei flussi è stato progettato e scartato, sui numeri**, e la decisione va
tenuta perché è costata: le una tantum valgono **0,86-9,72×** i flussi ordinari e schiaccerebbero
l'asse; i piani hanno **1-3 fasi**, quindi «Sviluppo del piano» racconta già la storia dei flussi
con le cifre; servirebbero fino a cinque tinte nuove contro la regola «nessun colore d'accento
nuovo»; e a 390 px un `font-size="11"` dentro il `viewBox` **rende 4,3 px**.

### Cosa se n'è imparato

- **La giacenza è uno STOCK, e va tenuta fuori dalla quadratura della riga.** `invarianti.mjs`
  verifica che ogni riga si rifaccia a mano (`inizio + rendimento + entrate − spesa`): aggiungerci
  `tfrAzienda` «per completezza» farebbe fallire ogni esercizio di chi lavora. C'è un commento che
  lo dice, accanto alla somma.
- **Il campo si legge DOPO la liquidazione, e la mezza riga di differenza vale un anno di doppio
  conteggio.** Leggendolo a inizio esercizio la banda si spegne un anno tardi, e in quell'anno gli
  stessi soldi si vedono due volte: dentro la banda e già dentro il patrimonio. **Provato
  rompendolo apposta**: la seconda implementazione lo prende su 4 casi su 62, e l'invariante —
  dopo averla resa più forte, «spenta *dall'*ultimo anno di lavoro» invece che «dall'anno dopo» —
  su **1.169 piani su 4.000**. Prima di irrobustirla non lo vedeva.
- **Un numero che non entra in nessun conto non ha rete.** Tutti gli altri valori sfociano nel
  `finale` e sbagliarli lo sposta; questo esce solo dal disegno. Per questo la seconda
  implementazione ha **il suo primo confronto dentro le righe** invece che sul risultato.
- **La legenda la scrive chi disegna.** Erano due copie dei colori — gli esadecimali nelle `<path>`
  e quelli a mano nei quadratini — e **divergevano da mesi**: dallo schiarimento delle aree la
  legenda mostrava due tinte (`#cfe0d6`, `#dfe6ef`) che nel disegno non esistevano più. Nessuna
  verifica poteva vederlo. Ora c'è `TINTE_GRAFICO`, e i quadratini si costruiscono da lì.
- **E un quadratino dichiara una banda solo se quella banda c'è.** Con «già in pensione» la
  legenda annunciava «i fondi pensione» per **ventidue anni in cui di fondi non ce n'era per
  nessuno**. Difetto vecchio, che la terza banda avrebbe triplicato. Ora `come-parla.mjs` tiene
  fermi i **quattro stati** della legenda (TFR in azienda · al fondo · nessuno · già in pensione)
  e rilegge le tinte **dalla stessa costante** da cui escono i riempimenti: è il controllo che la
  divergenza di prima non poteva avere, perché allora le due liste stavano in due posti.
- **Il grafico non era fotografato da nessuno.** È il pezzo che si giudica solo guardandolo, ed è
  la quarta volta che questo progetto lo impara. Ora `occhi.mjs` ne fa sei scatti: le due scelte
  del TFR, le due legende, e il telefono.
- **Una prova sullo stato «assente» va guardata, non dedotta.** Lo scatto «senza TFR» mostrava il
  quadratino, e sembrava un difetto del codice: era la prova a non descrivere il caso che diceva
  di descrivere — avevo azzerato il pregresso ma lasciato il TFR destinato in azienda, dove ne
  matura di nuovo ogni anno. Due caselle, non una.
- **`#riquadroGrafico + .legenda` prende solo la legenda.** Il `+` è il fratello, non i due
  insieme: lo scatto era sbagliato e nessuno se ne accorge finché non si apre il file che è uscito.

**Resta dichiarato, e non è stato affrontato qui**: il grafico ha ora **due gradini**. Quello
nuovo è l'imposta dell'art. 19 sul TFR (14.681 € sul caso base), ed è vero e informativo. Quello
vecchio è il fondo che diventa rendita e sparisce dallo stock senza che il patrimonio salga — un
−28% che non è una perdita. La legenda dice «non ancora riscossi», che è onesto ma non lo spiega.

## 2026-08-21 — l'armatura che pretende, e la guardia che girava solo se spinta

Una rilettura completa dall'esterno — regole, motore, testi — **non ha trovato errori nelle
cifre né nella matematica**: tutte le costanti riscontrate di nuovo su fonti esterne (IRPEF al
33% con la sterilizzazione dichiarata, tetto 5.300, capitale al 50%, frazionata al 31 ottobre,
assegno sociale e le tre soglie della Tabella F tornate all'euro). Quello che ha trovato è
roba d'impianto, e sono sei interventi:

1. **`controllo.yml`** — la guardia delle scadenze scattava solo su push: un repository fermo
   avrebbe attraversato il capodanno con le cifre vecchie online. Ora `verifica.mjs` gira
   **ogni settimana** anche da fermo, senza pubblicare. (Vedi *Pubblicare* per il limite dei
   60 giorni di GitHub.)
2. **`verifiche/_armatura.mjs`** — il DOM finto in un posto solo, e severo: la casella non
   dichiarata non vale più `'0'`, fa cadere il controllo per nome; `controllaChiavi` respinge
   le chiavi che la pagina non ha più; i casi partono dal **modulo appena aperto**. Al primo
   giro ha trovato `tipoFondo` e `patrimonio` morti nei fixture — coi moduli ostili che, senza
   patrimonio, non arrivavano quasi mai al verdetto. **Un caso di prova invecchia come una
   cifra**, e adesso c'è una guardia che se ne accorge (e si prova da sé, in `test.mjs`).
3. **`--tenue` da 3,49:1 a 4,58:1** (#8a857a → #767166) — il colore dei corpi più piccoli stava
   sotto il 4,5:1 del testo normale, misurato come i gradini della barra. Corrette anche le tre
   etichette SVG del grafico, rimaste al grigio **cablato**: un colore scritto in due posti è
   una divergenza come le altre.
4. **Le sentinelle di `build.mjs` si generano dalle regole** — scritte a mano sarebbero rimaste
   a guardia dei valori vecchi al primo cambio di parametro: la divergenza di sempre, dentro il
   file che esiste per impedirla. E la scansione ora guarda **quello che si pubblica**: l'avviso
   che scattava a ogni build su un commento è sparito, perché **un avviso fisso insegna a
   ignorare gli avvisi**.
5. **Il superstite che lavora è dichiarato** in `il-metodo.html`: retribuzione e pensione ai
   superstiti sono tassate separate mentre l'imposta vera si fa sul cumulo — netto sovrastimato,
   caso raro (serve un ampio divario d'età). Era l'unico scostamento del motore non scritto da
   nessuna parte. E la fonte del trattamento integrativo non chiama più «area esente» la soglia
   di capienza: 8.174 è la capienza, l'esenzione arriva a 8.500.
6. **`LICENSE`** — riserva dei diritti esplicita: un repository pubblico senza licenza è
   un'ambiguità, non un permesso.

## 2026-09-08 — la rilettura di settembre: un ripiego dal lato sbagliato, e il testo unico del 2027

Rilettura completa dopo diciotto giorni di fermo, con **tutti i parametri riscontrati di nuovo
sulle fonti** — Normattiva, la circolare INPS 153/2025 coi suoi allegati, la deliberazione COVIP
del 25 giugno 2026, la Relazione COVIP per l'anno 2025, Eurostat e ISTAT — e con la cronaca
normativa di agosto e settembre letta per intero (D.Lgs. 141/2026, D.Lgs. 148/2026, D.L. 144/2026,
prassi INPS e COVIP: nessuno tocca una cifra del sito). **Nessuna cifra è cambiata**; quattro fonti
sono state precisate e la revisione è portata a oggi. Quello che la rilettura ha trovato:

**1. L'anno di iscrizione lasciato vuoto valeva 1900, cioè il 9% a chiunque.** La casella passava
dal taglio `numFra(…, 1900, …)`: vuota diventava 1900, centoventi anni di iscrizione e l'aliquota
sulla prestazione al pavimento. Era l'**unico ripiego di tutta la pagina dal lato ottimista**, su
una casella dello strato aperto che nessuna guardia pretende, e mentre si scrive «2» e «20»
valevano lo stesso 1900. Misurato sul caso a una persona con 90.000 € di fondo e decorrenza 2042:
9,0% invece di 14,7%, **6.700 € di imposta in meno** e un finale migliore del vero di 8.000 €.
Nessun controllo lo vedeva perché **ogni caso di prova l'anno lo scriveva**, e i tre che lo
lasciavano vuoto non avevano un fondo. Ora vuoto vale l'anno in corso — l'anzianità *minore*
compatibile coi dati, quindi l'imposta più alta — e la regola delle quattro cifre vale anche qui.
**La casella ha guadagnato la riga sotto**: vuota dice «iscrizione dal 2026, l'ipotesi meno
favorevole», scritta dice l'aliquota che ne esce alla decorrenza, e segue la forma scelta (la
frazionata parte dal 20%). Il foglio di calcolo scrive «non indicato: si conta dal 2026» invece di
un anno che nessuno ha scritto. La seconda implementazione riceve il valore *scritto* e rifà il
ripiego da sé; i 4.000 piani casuali ora estraggono anche il vuoto, e un'invariante pretende che
lì l'aliquota sia quella di chi si iscrive oggi; `come-parla.mjs` legge la riga nuova in sei
stati. `il-metodo.html` e `dove-trovare-i-numeri.html` lo dichiarano.
**Regola: un ripiego si guarda dal lato in cui cade.** Ogni casella che può restare vuota ha un
valore di ripiego, e il taglio agli estremi è un ripiego anche quando nessuno l'ha scelto.

**2. Dal 1° gennaio 2027 le citazioni fiscali cambiano numero.** Il **D.Lgs. 19 giugno 2026,
n. 117** — testo unico delle disposizioni legislative in materia di imposte sui redditi, GU n. 152
del 3 luglio 2026, S.O. n. 26 — è in vigore dal 4 luglio e **si applica dal 1° gennaio 2027**
(art. 377). Riordina a legislazione vigente le norme che il sito cita: l'art. 376 abroga da quella
data gli artt. 1-191 del vecchio TUIR e, del D.Lgs. 252/2005, l'art. 10 c. 1, l'art. 11 c. 4-ter,
4-quater, 4-quinquies, 6, 6-bis, 6-ter, 7 e 8, l'art. 14 c. 4, 5 e 7 e l'art. 17 c. 1-9 — e
Normattiva li mostra già come «abrogati dal D.Lgs. 117/2026» nella versione vigente dal 2027. Il
tetto di 5.300 € **resta** nell'art. 8 c. 4 del D.Lgs. 252/2005, e restano fuori dal testo unico il
trattamento integrativo (D.L. 3/2020), la somma del cuneo (L. 207/2024 c. 4) e le imposte sulle
rendite finanziarie (D.L. 66/2014). **Le cifre non cambiano per questo**: cambiano i numeri degli
articoli, cioè le fonti che `regole.mjs` e le pagine dichiarano. La guardia delle scadenze, che il
1° gennaio scatta comunque, ora lo dice per esteso — e con lei `ANNO0`, `TRATT_MINIMO` e
`VITA_INTERA`, che mancavano dal suo elenco. La tavola di corrispondenza è qui sotto.

**La tavola di corrispondenza**, letta sul testo integrale del decreto (GU 3/7/2026, S.O. 26/L,
364 pagine: ogni articolo porta in sotto-rubrica la norma che assorbe, ed è quella la concordanza
ufficiale — un allegato separato non esiste) e confrontata parola per parola. Attenzione: la
numerazione dello schema di decreto (AG 398) **non coincide** con quella pubblicata dalla Parte II
in avanti; vale solo la numerazione della Gazzetta, che è questa.

| oggi | dal 1° gennaio 2027 | sostanza |
|---|---|---|
| TUIR art. 11 (scaglioni e aliquote) | D.Lgs. 117/2026 art. 11 c. 1 | uguale: 23% fino a 28.000, 33% fino a 50.000, 43% oltre |
| TUIR art. 13 c. 1, 1.1, 3, 3-bis (detrazioni lavoro e pensione) | art. 13 c. 1, 2, 3, 4 | uguale, importi identici; i rinvii al lavoro dipendente passano dall'art. 49 all'art. 51 |
| L. 207/2024 art. 1 c. 6 (ulteriore detrazione 20.000-40.000) | art. 13 c. 10 | uguale; il c. 6 della legge è abrogato (art. 376 lett. pppppp) |
| L. 207/2024 art. 1 c. 4 (somma per i redditi fino a 20.000) | **resta** nella L. 207/2024 | non abrogato, e delle sue percentuali non c'è traccia nel testo unico |
| D.L. 3/2020 art. 1 (trattamento integrativo) | **resta** nel D.L. 3/2020 | non abrogato; i suoi rinvii agli artt. 11 e 13 TUIR si leggono col rinvio mobile dell'art. 376 c. 2 |
| TUIR art. 16-ter c. 5-bis (i 440 € sopra 200.000) | art. 18 c. 6 | uguale |
| TUIR art. 17 e 19 (tassazione separata, TFR) | art. 19 e 21 | uguale: reddito di riferimento, anni di servizio, ×12 |
| TUIR art. 51 c. 2 lett. h (contributi trattenuti in busta) | art. 53 c. 2 lett. **m** | uguale (artt. 49-51 → 51-53; cambia anche la lettera) |
| TUIR art. 10 c. 1 lett. e-bis (deduzione dei contributi) | art. 10 c. 1 lett. h, che rinvia all'art. 8 D.Lgs. 252/2005 | il **tetto di 5.300 € resta nell'art. 8 c. 4 D.Lgs. 252/2005**, non abrogato: la deduzione diventa un rinvio |
| TUIR art. 67 c. 1 lett. b (plusvalenze immobiliari, i cinque anni e l'abitazione principale) | art. 76 c. 1 lett. b | uguale |
| D.Lgs. 252/2005 art. 11 c. 4-ter (RITA, 15%→9%, opzione ordinaria) | art. 258 c. 1 | uguale; il comma è abrogato (art. 376 lett. lll) |
| D.Lgs. 252/2005 art. 11 c. 6 (prestazioni, 15%→9%) | art. 258 c. 4 | uguale, testo identico |
| D.Lgs. 252/2005 art. 11 c. 6-bis (durata definita e prelievi) | art. 258 c. 5 | uguale |
| D.Lgs. 252/2005 art. 11 c. 6-ter (frazionata, 20%→15%) | art. 258 c. 6 | uguale |
| D.Lgs. 252/2005 art. 11 c. 7 (anticipazioni) e art. 14 c. 4-5 (riscatti) | art. 258 c. 7-8 e art. 259 | uguale |
| D.Lgs. 252/2005 art. 17 c. 1-9 (20% sui rendimenti) | art. 257 c. 1; i titoli di Stato al c. 10, col rapporto fra le due aliquote | uguale |
| D.Lgs. 47/2000 art. 11 c. 3 (17% sulla rivalutazione del TFR) | **non nel 117/2026**: D.Lgs. 33/2025 art. 36 (testo unico su versamenti e riscossione), anch'esso dal 1° gennaio 2027 | uguale |
| D.L. 66/2014 art. 3 (26% e 12,5% sulle rendite finanziarie) | **resta** nel D.L. 66/2014, che il testo unico richiama come vigente; il 26% sui redditi diversi sta anche nell'art. 304 | uguale |

L'art. 376 c. 2 dispone che i rinvii alle norme abrogate «si intendono» alle corrispondenti
disposizioni del testo unico: le citazioni vecchie non diventano false, diventano indirette. Il
dossier del Servizio Studi conferma che le disposizioni «sono state trasfuse senza modificarne la
formulazione». Il D.Lgs. 5 agosto 2026 n. 141 (testo unico su adempimenti e accertamento, GU
6/8/2026) e il D.Lgs. 7 agosto 2026 n. 148 (correttivo, GU 11/8/2026) non toccano nessuna cifra
del sito. **Le fonti in `regole.mjs` portano già il riferimento dal 2027 accanto a quello di
oggi**: a gennaio si toglie il primo, non si cerca il secondo.

**3. La prosa al futuro sull'erogazione frazionata ha una scadenza, e ora una guardia.** Due
pagine dicono che la frazionata «si può chiedere dal 31 ottobre 2026» e che «fino a quella data il
fondo non la eroga»: frasi vere oggi e stantie dopo, che nessun controllo sulle cifre vede.
`FRAZ_DECORRENZA_ISO` è ora una data confrontabile e `scadenze.mjs` pretende, da quel giorno, che
il segnaposto `{{frazDal}}` sparisca dalle pagine: un criterio meccanico che si spegne da sé una
volta riscritte, con `transitoria()` provata su sei casi come `verdetto()`.

**4. Quattro fonti precisate, nessun valore toccato.** La RITA è tassata dall'art. 11 **c. 4-ter**,
non dal c. 6 — che detta le stesse aliquote per le altre prestazioni; ed è nel 4-ter la facoltà di
tassazione ordinaria — la stessa svista già corretta su `ALIQ_FRAZ_*`. Il tetto di 5.300 € vale «a
decorrere dal periodo d'imposta 2026», cioè sull'intero anno, non dal 1° luglio. La
«sterilizzazione» sopra 200.000 € è un taglio di 440 € alle detrazioni del 19% (art. 16-ter
c. 5-bis TUIR), senza effetto sull'aliquota marginale: `il-metodo.html` non dice più «beneficio
sovrastimato» ma «imposta sottostimata di al più 440 €». Il bollo dello 0,2% dal 2026 sta nell'art.
9 della Tariffa allegata al D.Lgs. 123/2025, e il D.L. 38/2026 ha toccato il solo bollo fisso dei
soggetti diversi dalle persone fisiche. Aggiornata anche l'esposizione azionaria dei bilanciati che
fonda il 3% del comparto: **35,4%** a fine 2025 (Relazione COVIP 2025, Tav. 1.52) invece di 33,7% —
0,35 × 5% + 0,65 × 2% = 3,05%, che nella rotondità voluta del listino resta 3%. E `il-metodo.html`
attribuiva a «ISTAT» una speranza di vita che è la serie **Eurostat** costruita sui dati ISTAT (la
tavola nazionale dà 0,2 anni in meno): ora lo dice.

**5. Roba d'impianto.** La 404 elencava sette pagine su dieci — mancavano il TFR, l'abitazione e
dove trovare i numeri, nate dopo — e `anteprime.mjs` ora pretende che ci siano tutte. GitHub
avvisava dal run del 7 settembre che `checkout@v4` e `setup-node@v4` girano su Node 20 deprecato:
tutte e cinque le azioni sono all'ultima maggiore. Il README diceva «nove pagine» in due punti, la
sua tabella delle pagine ne aveva otto, e tre conteggi di controlli erano fermi.

**Cosa NON è cambiato, e perché**: `SPERANZA_VITA` resta sul 2023 anche se Eurostat pubblica 2024 e
2025 (+0,3 anni a 67): si aggiorna insieme al margine, o il coefficiente si sposta due volte.
`VITA_INTERA` resta sul 2023 perché è la tavola dei coefficienti 2025-2026, e i fondi la pubblicano
«per le prestazioni richieste fino al 31 dicembre 2026»: cambierà coi coefficienti 2027-2028, e la
guardia di gennaio lo elenca. Le mediane ISC di `FORME_FONDO` sono ancora quelle al 31/12/2025,
l'ultimo dato COVIP.

## 2026-09-08, secondo tempo — il risultato accanto al modulo, e le tre righe sotto il verdetto

Nato da una domanda sua: se la grafica fosse il miglior lavoro possibile, o servisse un cambiamento
radicale. **Il linguaggio visivo non si tocca**, ed è la prima conclusione: bianco caldo, i due
caratteri, il verde solo al verdetto, niente icone né ombre sono la firma che distingue un
documento da un pannello che vende. Un redesign in stile dashboard butterebbe via proprio quello.
Il problema era di **struttura e densità**, e si misura: sulla pagina compilata a due persone il
modulo pesava 1.006 parole, il risultato 339, le scelte **1.285** (più di tutto il resto insieme),
per 8,8 schermate su desktop e 12,9 su telefono. Il secondo strato aveva risolto la densità del
modulo; il risultato e le scelte no.

**1. Il risultato sta accanto al modulo, e lo segue.** Sopra i 1.100 px la pagina ha due colonne:
a sinistra il modulo e tutto quello che viene dopo (note, sviluppo, scelte, tabella), a destra
verdetto, colpo d'occhio e grafico, **appiccicati per tutta la pagina**. Si trascina un cursore in
fondo e il verdetto cambia sotto gli occhi: è la cosa che il sito fa meglio, e prima chiedeva di
risalire quattromila pixel per vederla. Lo spazio ai lati, sopra i 1.100 px, era vuoto da sempre.
Sotto quella larghezza i tre pezzi si impilano nell'ordine di prima.
*La trappola trovata costruendolo*: un elemento sticky resta fermo solo dentro il proprio
contenitore. Con la colonna del risultato alta quanto il suo contenuto, il blocco smetteva di
seguire dopo il primo schermo e la destra della pagina restava vuota per due terzi. La colonna
occupa quindi **due righe della griglia** (`grid-row:1/3`, il modulo e il dopo) ed è alta quanto la
pagina; dentro, `.appiccica` è il blocco che si ferma. E il blocco scorre da sé se lo schermo è
più basso di lui (`max-height` + `overflow`): meglio uno scorrimento interno che una legenda
tagliata.
*La seconda trappola l'ha misurata `senza-scatti.mjs`*: trascinando un cursore la pagina saltava
di 174 px, con il rimedio acceso. Chrome compensa da sé i cambi di altezza sopra la finestra
tenendo fermo un elemento «ancora», scelto fra quelli in vista nell'ordine del documento; il
blocco fisso, sempre in vista e nel documento prima delle scelte, era diventato l'ancora, e non
muovendosi mai non compensava più niente. `overflow-anchor:none` sulla colonna lo esclude dalla
scelta, e la misura è tornata a 6 px. **Un controllo che passa può passare per una ragione che
non si conosce**: quello sui sussulti era verde anche grazie all'ancoraggio del browser, e nessuno
l'aveva scritto — ora è scritto accanto alla regola CSS.
*E la terza l'ha presa `come-parla.mjs` al primo giro*: la riga della leva componeva «di» + nome e
coi nomi vuoti scriveva «di il primo». La forma articolata viaggia col nome (`DI`), come il
progetto sapeva già; il controllo sulla preposizione incollata all'articolo esiste per questo.

**2. Il grafico si disegna alla larghezza che ha.** Con la `viewBox` fissa a 880 e `width:100%`,
un'etichetta da 11 unità nella colonna da 440 px rendeva 5,5 px, e sul telefono 4,9: è la misura
che aveva fatto scartare il secondo grafico dei flussi, e valeva anche per il primo. Ora la
`viewBox` è pari ai pixel veri e cambia la porzione di disegno, non la grandezza del testo; al
ridimensionamento della finestra si ridisegna. Nelle armature `getBoundingClientRect` non esiste e
si torna a 880: i controlli non vedono differenze.

**3. Tre righe sotto il verdetto.** Fino a quando regge, la spesa sostenibile, e **la leva più
forte** fra le scelte qui sotto («portare il versamento di Anna all'11,9%: +23.287 € alla fine»).
La terza riga è nuova, e la scrive `aggiornaDecisioni`, che è l'unico posto in cui quelle leve
vengono misurate: raccolte mentre si scrivono i cursori, si prende la maggiore, e un piano che non
regge oggi ma regge al punto più alto vale più di qualunque euro. La spesa sostenibile stava in coda
al sottotitolo ed è uscita di là: due posti per lo stesso numero divergono, e `come-parla.mjs` ora
pretende che il sottotitolo non la ripeta e che la cifra della leva compaia anche sotto un cursore.
È un elenco etichetta-valore nell'idioma delle fasi, non una fila di riquadri coi numeroni.

**4. Le spiegazioni delle scelte stanno dietro «Come funziona».** Il capoverso che spiega perché
ogni scelta esiste è statico e si legge una volta: sta ripiegato, come le caselle del secondo
strato. Restano in vista le letture del cursore e il suo esito, che reagiscono. **I rimandi alle
pagine escono dal capoverso** e restano accanto al titolo (`.rimandi`), o ripiegando la spiegazione
si sarebbero nascoste due porte del sito. Su telefono l'esito del cursore viene **subito dopo il
nome**, prima del comando: stava in fondo, dopo cinque frasi, dove si arriva per ultimi.

**5. Lo stato d'attesa non è un verdetto.** «Dati incompleti.» in corpo 34 e nero suonava come un
errore prima che si fosse fatto niente. La pagina appena aperta dice «Il verdetto comparirà qui»,
poi «Mancano tre dati», in grigio e senza grassetto. E **la riga in alto compare anche senza
verdetto**, dicendo quante caselle mancano: su telefono era l'unico riscontro possibile vicino alle
dita mentre si compila. Il controllo che pretendeva il contrario («col modulo vuoto non compare
mai») è stato rovesciato, non tolto.

**6. L'unità dentro la casella**: € e % a destra della cifra, in tenue. L'involucro lo aggiunge il
codice al caricamento, così nel markup le caselle restano come sono e nessun controllo che le conta
vede qualcosa di nuovo.

**Come è stato deciso**: prima un'anteprima funzionante costruita in una copia del progetto e
guardata nel browser, poi il passaggio nei sorgenti con i controlli adeguati. `a-schermo.mjs` misura
ora anche i 1.300 px, che è l'assetto nuovo; `occhi.mjs` fotografa la colonna fissa e il colpo
d'occhio.

## 2026-10-03 — la rilettura di ottobre: dieci difetti, nessuno in una cifra di legge

Rilettura completa del motore, delle pagine costruite e di cinque cifre di legge riscontrate di
nuovo in rete (soglia del «tutto in contanti» sul 70% del montante e il 50% dell'assegno sociale,
che la L. 199/2025 lascia com'era; 546,24 € e 611,85 € della circolare INPS 153/2025; il 2,5%
minimo dei coefficienti d'usufrutto, confermato dal DM 24/12/2025 col tasso legale all'1,6%).
**Nessuna cifra di legge era sbagliata.** Erano sbagliati dieci punti in cui una frase rifaceva da
sé un conto che il motore fa già, o in cui un formato riceveva una cosa diversa da quella per cui
era scritto — e tutti e dieci passavano coi controlli verdi.

**Nel calcolatore, cinque, e stavano tutti fra il verdetto e le scelte:**

| dove | cosa diceva | cosa dice |
|---|---|---|
| i pulsanti della forma dell'assegno | l'importo della vitalizia col coefficiente dei **67 anni** per chiunque: a 63 anni 885 € sul pulsante acceso, 757 € nell'esito accanto | il coefficiente dell'età della persona |
| la prima rata della durata definita e della frazionata | partiva dal montante **già tassato** e lo ritassava: 909 € contro i 976 € che il motore paga | il montante lordo, come la riga del motore |
| «da un capo all'altro» | chiamava «al mese in meno» **la rendita intera**: col massimo al 50% il doppio del vero, e i suoi anni di pareggio non tornavano con le sue cifre | la differenza fra i due capi; e a chi consuma non parla più di un assegno a vita |
| il verdetto | contava i cali **dal secondo esercizio**: «non si riduce in nessuno dei 30 anni» sopra «il patrimonio è in riduzione già dal primo anno» | il primo esercizio si confronta col proprio inizio |
| l'accantonamento corrente | non contava le **rate della RITA**: «la spesa eccede le entrate di 2.000 € al mese» dove le fasi dicevano «accantonamento 784 €» | le rate ci sono, come nelle fasi e in `scoperti` |

Più due ritocchi: il passo 2 scriveva «convertendo…» anche a chi aveva scelto una forma che non
converte, e la finestra chiusa della RITA dava sempre la stessa ragione («smette nel … e la
pensione arriva l'anno dopo») anche a chi aveva smesso sei anni prima di una decorrenza
nell'anno in corso. Gli anni della rendita certa ora vengono da `CERTA_ANNI`.
**Sei controlli nuovi in `come-parla.mjs`** confrontano la cifra scritta con quella del piano, e
cadono tutti e sei sul codice di prima (provato).

**Nelle pagine, cinque:**

- la tabella dei parametri di `il-metodo.html` scriveva **«negoziale NaN% · aperto NaN% · PIP
  NaN%»**: `FORME_FONDO` porta quattro numeri per riga e stava sul formato del listino, che ne
  aspetta uno. Ha un formato suo (`forme`). Nella stessa tabella: la prima banda dell'ulteriore
  detrazione era una cella vuota («· fino a 20.000 €»), la maggiorazione da pensione un «50» senza
  unità, la tavola in anni interi «25,0 a 60 anni», il trattamento minimo «612 €» invece di 611,85;
- il piè di pagina di **tutte le pagine** diceva «rivisti **al 8** settembre», e
  `contributo-datore.html` «un contributo del lavoratore **del 1,2%**». Il calcolatore sa elidere
  da agosto (`perc`, `vocaleDetta`); i segnaposto delle pagine no. Ora `alData` e `delPc` in
  `regole.mjs` portano la preposizione insieme al numero;
- `contributo-datore.html` metteva **«all'aliquota marginale del 33%»** accanto a uno sconto
  calcolato al 41,7%: la riga ora dice l'aliquota effettiva, e il capoverso sopra spiega perché;
- l'esempio di `fondo-pensione-o-etf.html` tassava i versamenti **sommati secchi**, cioè con
  l'inflazione di venticinque anni contata come se non fosse passata: 3.360 € d'imposta invece di
  2.676. La regola era scritta due blocchi più su, per `ESEMPIO_TFR`; ora è la stessa riga;
- `tfr-fondo-o-azienda.html` diceva che col garantito il conferimento smette di convenire «dal
  20° anno» perché 20 era la prima colonna della tabella in cui il segno cambiava: è il **12°**,
  cercato anno per anno.

E tre frasi imprecise: `il-metodo.html` chiamava la sterilizzazione sopra i 200.000 € «l'unico
punto» favorevole a chi compila, mentre a dieci righe di distanza dichiarava l'adeguamento degli
scaglioni, che lo è anche lui; diceva che la riliquidazione del TFR «riduce l'imposta», mentre può
andare nei due versi; `casa-e-decumulo.html` dava il registro al 2% senza dire che è quello della
prima casa.

**Il controllo che avrebbe preso le pagine** sta in `coerenza.mjs`: legge il testo visibile delle
pagine costruite e fallisce su `NaN`, `undefined`, `Infinity` e su una preposizione non elisa
davanti a 1, 8, 11 o 80-89 (non «1°», che si legge «primo»). Sul sito di prima trovava i due
difetti al primo giro.

**Regola: una frase che rifà un conto del motore è una seconda implementazione senza rete.** I
cinque difetti del calcolatore avevano la stessa forma: `primaRata`, `alMese`, il coefficiente sul
pulsante, la base dell'esempio, il primo esercizio del verdetto — ciascuno una piccola copia di
una cosa che il motore sa già fare.

**Non verificato nel browser**: Chrome non c'era sulla macchina, e `a-schermo.mjs`,
`senza-scatti.mjs` e `occhi.mjs` sono rimasti fermi. La prosa nuova intorno ai cursori è una
riga dell'esito del passo 2 un po' più lunga di prima: va guardata alla prossima occasione.

**Fra 28 giorni**, il 31 ottobre, l'erogazione frazionata diventa richiedibile e la guardia
pretenderà che le frasi al futuro su `{{frazDal}}` siano riscritte (`come-prendere-il-fondo.html`
e la nota della casella in `index.html`).

## Il registro dei dubbi

**Cose sapute e non risolte.** Vivevano nelle conversazioni e sparivano con loro: qui restano.
Non sono difetti aperti — se lo fossero si chiuderebbero — sono *domande a cui non abbiamo
ancora dato una risposta verificata*, e ognuna dice cosa servirebbe per chiuderla.

| dubbio | cosa servirebbe | perché non è urgente |
|---|---|---|
| ~~L'art. 8 c. 4 D.Lgs. 252/2005 comprenda i contributi del datore **anche volontari**, oltre a quelli da accordo~~ **— chiuso l'08/09/2026** | — | letto su Normattiva: «i contributi versati dal lavoratore e dal datore di lavoro o committente, *sia volontari sia dovuti in base a contratti o accordi collettivi, anche aziendali*»: li comprende. Nessuna frase del sito ci si appoggiava, e nessuna va cambiata |
| `SPERANZA_VITA` e `VITA_INTERA` sono sul 2023 mentre ISTAT ed Eurostat hanno pubblicato il 2024 e il 2025 | il decreto sui coefficienti 2027-2028, atteso a fine 2026, dice quale tavola vale per la durata definita; la speranza di vita si aggiorna insieme al margine | la prassi dei fondi usa la 2023 «fino al 31/12/2026», e la guardia di gennaio elenca tutte e due |
| La pagina privacy indica la **durata di conservazione** dei dati Analytics rinviando alle impostazioni della proprietà, senza il numero di mesi | leggere il valore nella proprietà GA4 (2 o 14 mesi) e scriverlo | l'art. 13 par. 2 lett. a chiede il periodo «o i criteri», e il criterio c'è; il numero lo sa solo chi ha accesso alla proprietà |
| Le tre detrazioni e le mensilità sono state verificate su **fonti specializzate concordi**, non sul testo in Gazzetta | scaricare il TUIR e rileggere l'art. 13 | ora hanno un riscontro esterno a sei punti su due fonti indipendenti (`verifiche/riscontri-esterni.mjs`), che è più di quanto abbiano quasi tutte le altre |
| **La maggior parte delle regole non ha un riscontro esterno** | una cifra pubblicata da altri per ciascuna, come per i coefficienti, le detrazioni e la Tabella F | sono verificate sul testo; manca il controllo *ricorrente*, non la verifica. **Il numero non si scrive a mano, nemmeno qui**: lo dà `quanteRiscontrate()` in `regole.mjs` e lo stampa `il-metodo.html` (8 su 50 al 03/10/2026). Questa riga lo scriveva a mano — «41 su 48» — sotto la frase che diceva di non farlo, ed era di nuovo invecchiato |
| La **RITA** conta gli anni di iscrizione anteriori al 2007 **fino a un massimo di quindici** (art. 11 c. 4-ter), e il conto no | modellarlo, con l'anno di iscrizione che già c'è | morde solo chi si è iscritto prima del 1992, ed è al più 2,1 punti d'aliquota sulle sole rate RITA |
| Lo **scenario del superstite** colloca il decesso alla speranza di vita **alla decorrenza**: per chi è in pensione da molti anni quell'anno può essere già passato, e lo scenario parte allora da subito | la speranza di vita all'età di oggi, quando è più alta di quella | riguarda chi ha superato da tempo la propria speranza di vita alla decorrenza; il rapporto fra le entrate resta calcolato, cambia solo l'anno a cui è riferito |
| ~~L'oggetto finto delle armature è **copiato in otto file**~~ **— chiuso il 21/08/2026** | — | ora è `verifiche/_armatura.mjs`, importato da tutti — e severo: la casella non dichiarata non vale più un ripiego, fa cadere il controllo per nome, e `controllaChiavi` respinge le chiavi che la pagina non ha più. Al primo giro ha trovato `tipoFondo` (morto dal 03/08) nei casi di come-parla e `patrimonio` (morto con le quattro classi) nei moduli ostili: i duemila moduli giravano quasi tutti **senza patrimonio**, cioè senza mai raggiungere il verdetto |
| Chi ha usato il sito prima del 3 agosto ha in memoria un **tipo di fondo** che non esiste più, e se aveva scelto «scelto da sé» con una percentuale scritta ora quella quota **viene conteggiata** | niente: `ripristina()` scorre le caselle che trova in pagina, quindi la chiave vecchia è ignorata e sparisce al primo salvataggio | è il comportamento voluto — la percentuale scritta vale — e non è silenzioso: `notaDatore` compare proprio perché una percentuale c'è, e dice la condizione |
| La **retribuzione netta** derivata non comprende addizionali né carichi di famiglia | modellarli, o dichiararsi soddisfatti | i due effetti hanno segno opposto e si compensano in parte; è dichiarato in `il-metodo.html` |
| ~~Il **trattamento integrativo** (1.200 € sotto i 15.000 €) non è modellato~~ **— chiuso il 07/08/2026** | — | era dichiarato e misurato (−1.200 € esatti a RAL 15.000). È stato rappresentato non per la fascia che ne beneficia ma per l'effetto sugli altri: la detrazione dell'art. 13 c. 1 **scende da 3.100 a 1.955 €** sotto i 15.000 € di reddito, e nella disciplina vigente quel salto lo colma proprio quel trattamento. Senza, il modello esponeva una perdita secca di 1.145 € che la legge non ha — e il ricercatore del punto più alto ci si aggrappava. **Non è rappresentato il secondo periodo** (15.001–28.000 €), che dipende dalle detrazioni dell'art. 12 e dagli oneri dell'art. 15: senza quelle vale zero per costruzione |
| La **perequazione a fasce** delle pensioni non è modellata | le tre percentuali e le soglie lette sulla norma, non sul commento: il DM 19/11/2025 le applica *per scaglioni* | l'errore è nullo sotto 4 volte il minimo (2.447 €/mese) e piccolo sopra: 2,8% su trent'anni a 3.500 €/mese. Ora è dichiarato con la sua misura |
| Il TFR già accantonato è un **montante**, e l'imponibile va separato dalle rivalutazioni: la scomposizione usa il tasso del modello, non quelli storici | i tassi ISTAT degli anni trascorsi, per persona | opera su una frazione contenuta del montante (~6% su venticinque anni), e il ripiego cade dal lato prudente: senza anni vale 1, cioè tutto imponibile. È dichiarato in `il-metodo.html` e in `tfr-fondo-o-azienda.html` |
| Il **garantito dei PIP** è quasi sempre una gestione separata di **ramo I**: non si valuta a mercato e non ha il sottostante di un garantito negoziale. Togliergli il solo differenziale di costo presuppone un'identità che non c'è | un modello del ramo I, oppure una rilevazione dei rendimenti effettivi di quelle gestioni | è **una casella su dodici**, e ne esce 0,07% — basso ma non assurdo per un prodotto garantito e caro. Dichiarato in `il-metodo.html`; le altre undici reggono |
| Il rendimento del fondo è **uno solo per la coppia**, come lo era prima: due persone in forme diverse (una in un negoziale, l'altra in un PIP) non sono rappresentabili | una tendina per persona, come per il TFR | è il limite che `rendFondo` ha da sempre — la modifica sui costi non lo introduce, lo rende solo più visibile, perché ora le forme differiscono di due punti invece che di zero |
| Nessuno può impedire di scrivere nel TFR già accantonato **anche quello confluito nel fondo** | niente che il conto possa vedere: le due cifre stanno in due posti che non si parlano | è l'unico errore di compilazione che rende il piano **migliore** del vero, e per questo ha una frase sua (`avvisoTfr`) che compare esattamente a chi può commetterlo — chi scrive un importo e manda il TFR nuovo al fondo |
| Gli **scaglioni IRPEF sono nominali** e il conto lavora in reale: il modello assume che vengano adeguati all'inflazione | niente da verificare: è un'ipotesi sul legislatore | rappresentare l'alternativa vorrebbe dire prevedere una legge di bilancio. Dichiarata, non sostituita da una previsione |

**Come si usa.** Quando una riga si chiude, si toglie. Quando ne nasce una, si scrive qui invece
che in un messaggio: **un dubbio che vive solo in una conversazione è un dubbio perso.**

## Prima di pubblicare

**La matematica non è il punto critico.** 326 controlli, seconda implementazione indipendente
(scarto 4,5·10⁻¹⁶), 4.000 piani casuali con invarianti, la curva dei coefficienti tenuta dentro
le tavole vere. Il rischio residuo è di *modello*, ed è dichiarato in `il-metodo.html`.

Fatto: disclaimer nel calcolatore e in ogni piè di pagina, informativa privacy, perimetro
dichiarato in testa, data di revisione, navigazione.

**TUTTE LE CIFRE SONO ORA RISCONTRATE SUL TESTO** (01/08/2026). Erano rimaste nove senza riscontro
— tre aliquote dell'erogazione frazionata, la tavola della vita attesa, l'aliquota a carico del
dipendente e le quattro del TFR — e alcune avevano una `fonte` che non era una fonte ma una
descrizione. `verifiche/scadenze.mjs` controlla a ogni esecuzione che non ne ricompaiano.

**Il riscontro ha trovato quattro cose, e nessuna era il valore in sé:**

| dove | cosa non tornava |
|---|---|
| `ALIQ_FRAZ_*` | le aliquote stanno nel comma **6-ter**, non nel 6-bis. Il 6-bis dice un'altra cosa (durata definita e prelievi seguono il comma 6) |
| `VITA_INTERA` | l'allegato COVIP che la fonte prometteva **non esiste**: il riscontro è sulle tavole ISTAT 2023 |
| `TFR_SU_RAL` | lo 0,50% **non è nell'art. 2120 c.c.**: viene dall'art. 3 della L. 297/1982, che lo fa detrarre dalla quota di TFR |
| `IVS` | 9,19 non è tutta IVS: è 8,89 al Fondo pensioni **più 0,30 di CIG straordinaria**, che non tutte le aziende versano |

**Regola: una fonte sbagliata non si vede finché non la si apre.** Tutti e nove i valori numerici
erano giusti; sbagliati erano tre riferimenti su nove, cioè proprio quello che serve a chi vuole
rifare il controllo.

**`SCAGLIONI` è stato riscontrato il 01/08/2026, e la verifica è servita**: la seconda aliquota
IRPEF è **33% e non 35%**, perché la legge di bilancio 2026 l'ha ridotta dal 1° gennaio. Il valore
sembrava sbagliato e invece era giusto. Emerso nel riscontro un limite che non era dichiarato: la
riduzione è **sterilizzata sopra i 200.000 €** di reddito, e il modello non lo rappresenta. È
l'unico punto in cui l'imposizione è rappresentata in senso favorevole a chi compila, ed è scritto
in `il-metodo.html`.

**Le tre cifre della legge di bilancio sono verificate** (31/07/2026), sul testo e non su
una notizia:

- **tetto 5.300 €** — L. 199/2025 (legge di bilancio 2026) art. 1 c. 201, che modifica l'art. 8
  c. 4 del D.Lgs. 252/2005. In vigore dal 1° luglio 2026. La stessa norma riscrive la deroga del
  «tutto in capitale» nei termini esatti che il motore già usava: 70% del montante convertito,
  sotto metà assegno sociale;
- **massimo in capitale: 50%, non 60%** — ed è la correzione più grossa del 01/08/2026. La legge
  di bilancio l'aveva portato a 60; l'**art. 16-ter del D.L. 62/2026**, inserito dalla legge di
  conversione **112/2026** (in vigore dal 28 giugno 2026), l'ha riportato a 50 «a decorrere dal
  termine del 1° luglio 2026» — cioè **il 60% non si è mai applicato un giorno**. Lo stesso
  articolo differisce al {{frazDal}} la sola erogazione frazionata.
  **Regola: una cifra verificata non resta verificata. Va riletta, non ricordata**;
- **assegno sociale 7.101,12 €** — circolare INPS 153 del 19/12/2025 (546,24 € × 13).

**TRAPPOLA, e ci sono cascato**: parecchi fondi hanno documenti aggiornati *a quella legge* che
continuano a scrivere le cifre vecchie (Laborfonds, 28/07/2026, scrive ancora 50%). **Un
documento di fondo non è la legge**, e uno regionale non è nemmeno la media dei fondi. Il testo
della legge sta sul sito COVIP, in chiaro.

**Le percentuali CCNL sono state tolte, non verificate** (31/07/2026). Erano in un punto solo di
`contributo-datore.html` — Cometa 1,2% + 2%, Previdenza Cooperativa 0,55-2% + 1,5% — e non
entravano in nessun conto: le due percentuali le scrive l'utente. Verificarle sui testi
contrattuali sarebbe servito a due lettori su dieci, e sarebbe scaduto al primo rinnovo. Al loro
posto una forbice marcata `stima` senza nomi di fondi, e dove si leggono i propri numeri.
**Regola: un numero che nessun calcolo usa non merita una fonte da mantenere.**

**Il perimetro è chiuso** (31/07/2026), e i due casi aperti sono stati trattati in modo diverso
perché sono diversi:

- **più fondi → istruzione, non esclusione.** Sommare le posizioni è corretto su tutto tranne una
  cosa: la soglia del «tutto in capitale» si valuta **su ciascuna posizione** (art. 11 c. 3, e
  COVIP parla di liquidazione «della posizione individuale»), mentre l'anzianità che riduce
  l'imposta **cumula tutti i periodi** non riscattati, anche presso fondi diversi (circolare AdE
  70/E del 2007). Quindi: sommare, scrivere l'iscrizione più remota, verificare la soglia fondo
  per fondo. Sta accanto alla casella, e la spiegazione in `come-prendere-il-fondo.html`;
- **rendita già in erogazione → esclusione dichiarata.** Le due scorciatoie plausibili sono
  entrambe sbagliate: nella casella della pensione INPS verrebbe tassata con IRPEF (ha già pagato
  il sostitutivo), sottratta dalla spesa si rivaluterebbe (la rendita è nominale). Un rimedio
  sbagliato è peggio di un limite dichiarato.

Trovate mentre si scriveva: due dichiarazioni **scadute** in `il-metodo.html` («il nucleo
monocomponente non è previsto» — lo è dal 30/07). Una pagina che dichiara i limiti va riletta
quando i limiti cadono.
