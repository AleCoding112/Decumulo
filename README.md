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
| `node test.mjs` | 213 controlli sul motore, letto da `sito/index.html` |
| `node verifiche/come-parla.mjs` | esegue il calcolatore su diciotto scenari e legge le frasi che scrive |
| `node verifiche/valori-ostili.mjs` | duemila moduli con valori impossibili: non deve rompersi né dire assurdità |
| `node verifiche/tavole-dei-fondi.mjs` | tiene la curva dei coefficienti dentro le tavole vere |
| `node verifiche/seconda-implementazione.mjs` | confronta il motore con uno riscritto dalle regole, su 44 casi |
| `node verifiche/invarianti.mjs` | 4.000 piani casuali + le funzioni di legge ai punti esatti |
| `node verifiche/schermi.mjs` | che nessuna griglia esca dallo schermo di un telefono |
| `node verifiche/coerenza.mjs` | che le pagine dicano quello che il conto fa |
| `node verifiche/consenso.mjs` | che il tag di misurazione non parta senza consenso |
| `node verifiche/anteprime.mjs` | la scheda che si vede condividendo il link, e le briciole dichiarate |
| `node verifiche/scarica.mjs` | il piano portato via: che il foglio di calcolo sia un file valido e dica quello che si vede |
| `node verifiche/scadenze.mjs` | se i parametri sono ancora quelli correnti |

Fuori dalla catena, perché apre Chrome e va lanciato quando si tocca il layout o si aggiunge
una casella:

```
node verifiche/a-schermo.mjs     nove pagine × quattro larghezze in due assetti del modulo:
                                niente sborda, ogni campo ha un nome, la stampa contiene il
                                dettaglio anno per anno. E il CONSENSO provato cliccando davvero:
                                è l'unico posto dove si può vedere che il tag non parte prima
```

`sito/` **non si modifica a mano**: si rigenera. Oltre alle pagine il build scrive `sitemap.xml`
e `robots.txt`, e mette in ogni testa i metadati per le anteprime — **ricavandoli dal titolo,
dalla descrizione e dal canonical che la pagina già dichiara**, così non possono divergere. La
favicon è disegnata dentro `build.mjs` e va in linea: **senza consenso il sito non chiede un file
a nessuno**, che è la promessa scritta in `privacy.html`.

## Pubblicare

Otto pagine, un 404, tre file di servizio (`sitemap.xml`, `robots.txt`, `CNAME`). Il sito è
statico: non c'è un server da mantenere, e `sito/` si può servire da qualunque parte.

**Pubblica GitHub, e solo se i controlli passano.** `.github/workflows/pubblica.yml` esegue
`node verifica.mjs` a ogni push su `main` e carica su GitHub Pages soltanto quando è tutto verde:
se un controllo fallisce, **online resta la versione buona**. `sito/` non sta nel repository
(`.gitignore`), proprio perché non possa finire online una cartella costruita a mano che i
controlli non hanno visto.

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
| a ogni modifica di un parametro | `REVISIONE_ISO` | — |

Sull'ultima riga della tabella: speranza di vita e margine **si aggiornano insieme, o non si
aggiornano**. Il margine è calibrato su quella tavola: muovendone una sola il coefficiente si
sposta due volte.

**La guardia si verifica da sé.** Un controllo che dipende dalla data odierna non si può provare
aspettando: il ramo che avvisa si vedrebbe solo in ottobre, quello che blocca solo a gennaio.
`verdetto(revisione, oggi)` è una funzione pura di due date, e `scadenze.mjs` la esercita su sette
casi a ogni esecuzione prima di dare il verdetto vero.

La **seconda implementazione** va tenuta al passo del modello. Una che resta indietro è peggio di
nessuna: dà un falso «scarto zero» mentre calcola un'altra cosa (successo il 31/07/2026).

**Quando si aggiunge una casella in cui vuoto e zero dicono cose diverse, il primo posto da
toccare sono i fixture.** Nei DOM finti un campo assente vale `'0'`, non stringa vuota: la
casella nuova legge zero, e cinque casi diversi finiscono sullo stesso numero senza che nessun
controllo fallisca. È successo tre volte (spesa in pensione, crescita della retribuzione, ultimo
anno di lavoro). Si scrive `campo: ''` esplicitamente in ogni armatura.

---

## I file

```
regole.mjs      le cifre, con nome · fonte · verificata
build.mjs       le porta ovunque servano
verifica.mjs    un comando solo per tutto
test.mjs        204 controlli sul motore
verifiche/      come parla · valori ostili · tavole dei fondi · seconda implementazione ·
                invarianti · schermi · coerenza · consenso · scadenze · a-schermo
sorgenti/       index.html + le pagine; i file con _ sono pezzi da includere
sito/           quello che si pubblica
```

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
| `come-prendere-il-fondo.html` | capitale o rendita, la soglia che cambia con l'età |
| `rita.html` | requisiti e tassazione dell'erogazione anticipata |
| `tfr-fondo-o-azienda.html` | dove conviene il TFR, e perché la scelta non è simmetrica |
| `dove-trovare-i-numeri.html` | da quale documento si ricava ciascun dato |
| `il-metodo.html` | procedimento, limiti, stato di verifica dei parametri |
| `privacy.html` | dove finiscono i dati inseriti |

Le pagine previste sono **tutte scritte** (31/07/2026). La terza che era in programma, «quanto si
può dedurre», **non è stata scritta di proposito**: il calcolatore la risponde meglio e in tempo
reale (tetto, quanto resta, sconto IRPEF, punto più alto), e una pagina ripeterebbe a parole un
risultato dato in cifre.

Ogni pagina di contenuto è **raggiungibile dal punto del modulo che la riguarda**, non solo dal
piè di pagina: è lì che serve a chi sta compilando.

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

## Prima di pubblicare

**La matematica non è il punto critico.** 204 controlli, seconda implementazione indipendente
(scarto 4,5·10⁻¹⁶), 4.000 piani casuali con invarianti, la curva dei coefficienti tenuta dentro
le tavole vere. Il rischio residuo è di *modello*, ed è dichiarato in `il-metodo.html`.

Fatto: disclaimer nel calcolatore e in ogni piè di pagina, informativa privacy, perimetro
dichiarato in testa, data di revisione, navigazione.

**CINQUE CIFRE NON SONO CONFERMATE, e sono pubblicate** (01/08/2026). Erano marcate «verificata» ma
nessuno le aveva lette sul testo, e tre avevano una `fonte` che non era una fonte ma una
descrizione: «scaglioni 2026», «contributi previdenziali a carico del dipendente», «imposta
sostitutiva sulla rivalutazione». Con quelle diciture nessuno può rifare il riscontro.
`verifiche/scadenze.mjs` le elenca a ogni esecuzione:

| cifra | cosa serve |
|---|---|
| `IVS` | la circolare INPS sull'aliquota a carico del dipendente |
| `TFR_SU_RAL`, `TFR_RIV_FISSA`, `TFR_RIV_QUOTA` | l'art. 2120 c.c., citato ma mai letto |
| `TFR_IMPOSTA_RIV` | l'imposta sostitutiva sulla rivalutazione, sul testo |

**Non è una scoperta di errori: è una scoperta di verifiche mancanti.** I valori sono quelli
correnti secondo ogni fonte secondaria; quello che manca è il riscontro sul testo, che è lo
standard che questo progetto si è dato.

**`SCAGLIONI` è stato riscontrato il 01/08/2026, e la verifica è servita**: la seconda aliquota
IRPEF è **33% e non 35%**, perché la legge di bilancio 2026 l'ha ridotta dal 1° gennaio. Il valore
sembrava sbagliato e invece era giusto. Emerso nel riscontro un limite che non era dichiarato: la
riduzione è **sterilizzata sopra i 200.000 €** di reddito, e il modello non lo rappresenta. È
l'unico punto in cui l'imposizione è rappresentata in senso favorevole a chi compila, ed è scritto
in `il-metodo.html`.

**Le tre cifre della legge di bilancio sono verificate** (31/07/2026), sul testo e non su
una notizia:

- **tetto 5.300 €** e **massimo in capitale 60%** — L. 199/2025 (legge di bilancio 2026) art. 1
  c. 201, che modifica gli artt. 8 c. 4 e 11 c. 3 del D.Lgs. 252/2005. In vigore dal 1° luglio
  2026. La stessa norma riscrive la deroga del «tutto in capitale» nei termini esatti che il
  motore già usava: 70% del montante convertito, sotto metà assegno sociale;
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
