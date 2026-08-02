// ============================================================================
//  LE REGOLE, IN UN POSTO SOLO.
//
//  Ogni cifra di legge sta qui e da nessun'altra parte. Il calcolatore e le
//  pagine di spiegazione la ricevono dal build: se cambia la legge si tocca
//  questo file, si rilancia `node build.mjs`, e si è aggiornato tutto.
//
//  Nel testo delle pagine si scrive {{tetto}}, {{quota}}, {{soglia}}…
//  Nel codice del calcolatore c'è un segnaposto //@@REGOLE@@ che riceve le
//  costanti già scritte in JavaScript.
// ============================================================================

// Data dell'ultima revisione dei parametri. Va aggiornata quando si tocca una cifra qui sotto:
// compare in fondo a ogni pagina, ed è l'unico modo perché chi legge sappia se sta guardando
// valori correnti. L'assegno sociale si rivaluta ogni gennaio; l'IRPEF può cambiare a ogni
// legge di bilancio.
// SI SCRIVE IN FORMA ISO, ed è l'unica cosa da cambiare: la stringa in italiano si genera da
// questa. Tenerne due scritte a mano vuol dire vederle divergere al primo aggiornamento, ed è
// esattamente il difetto che tutto il resto del build esiste per impedire.
// La forma confrontabile serve alla guardia in `verifiche/scadenze.mjs`: una data che nessuno
// può confrontare non protegge da niente.
export const REVISIONE_ISO = '2026-08-02';
export const REVISIONE = new Date(REVISIONE_ISO + 'T00:00:00Z')
  .toLocaleDateString('it-IT', {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'});

// Le due cifre da cui esce il coefficiente di conversione stanno qui sopra la
// tabella per una ragione sola: due voci di REGOLE le usano entrambe, e scritte
// una volta sola non possono discostarsi. La spiegazione è alla voce
// SPERANZA_VITA, che è dove si va a cercarla.
// Speranza di vita residua per età, sessi congiunti, anno 2023. La tavola si
// ferma a 75 anni: oltre, il calcolatore non estrapola e resta su quel valore.
//
// L'annata non è un dettaglio da inseguire: il margine qui sotto è calibrato su
// QUESTA tavola, quindi se la speranza di vita sale di un decimo il margine
// ricalibrato scende e il coefficiente non si muove. Le due cifre si aggiornano
// insieme, e verifiche/tavole-dei-fondi.mjs controlla che il prodotto regga.
const ANNI_ISTAT = [[55,29.9],[56,29.0],[57,28.0],[58,27.1],[59,26.3],[60,25.4],[61,24.5],[62,23.6],
                    [63,22.7],[64,21.9],[65,21.0],[66,20.2],[67,19.4],[68,18.6],[69,17.7],[70,16.9],
                    [71,16.2],[72,15.4],[73,14.6],[74,13.9],[75,13.1]];
const MARGINE = 1.25;

export const REGOLE = {
  // --- IRPEF -------------------------------------------------------------
  // La seconda aliquota è 33% e NON 35%: la legge di bilancio 2026 l'ha ridotta. È la cifra che
  // pesa di più, perché entra in ogni conto di costo e di sconto, e la verifica è servita a
  // confermare un valore che sembrava sbagliato — l'aliquota storica è 35%.
  SCAGLIONI: { nome: "Aliquote IRPEF",
    val: [[28000, 0.23], [50000, 0.33], [Infinity, 0.43]],
    fonte: 'aliquote 2026: la legge di bilancio 199/2025 ha ridotto la seconda dal 35% al 33% dal 1° gennaio 2026, confermato sul sito del MEF. La riduzione è sterilizzata sopra i 200.000 € di reddito, e il modello non lo rappresenta',
    verificata: true
  },
  // LE DETRAZIONI DELL'ART. 13, e perché la forma delle bande è quella.
  // Sono due, non cumulabili, e si calcolano sul REDDITO COMPLESSIVO: una per chi lavora
  // (c. 1) e una per chi è in pensione (c. 3). Decrescono fino ad azzerarsi a 50.000 €, e
  // l'azzeramento è per limite, non per salto: a 50.000 il fattore vale zero da sé.
  // In OGNI banda il numeratore della frazione è il limite superiore della banda stessa, quindi
  // bastano quattro numeri — [fino, base, quota, denominatore] — e una formula sola:
  //     base + quota × (fino − reddito) / denominatore
  // La prima banda è piatta (quota 0). I minimi garantiti (690/1.380 € per il lavoro, 713 € per
  // la pensione) non sono rappresentati: valgono sul ragguaglio ai giorni, e qui gli esercizi
  // sono sempre interi, quindi non morderebbero mai.
  DETRAZIONE_LAV: { nome: "Detrazione per redditi di lavoro dipendente", come: 'detrazione',
    val: [[15000, 1955, 0, 0], [28000, 1910, 1190, 13000], [50000, 0, 1910, 22000]],
    fonte: 'art. 13 c. 1 D.P.R. 917/1986 (TUIR), testo vigente 2026: 1.955 € fino a 15.000; 1.910 + 1.190 × (28.000 − reddito) / 13.000 fino a 28.000; 1.910 × (50.000 − reddito) / 22.000 fino a 50.000; nulla oltre. NON è rappresentata la maggiorazione di 65 € del c. 1.1 (redditi fra 25.000 e 35.000), che entrerebbe nel beneficio MARGINALE della deduzione rendendolo discontinuo: il beneficio resta per quella parte sottostimato',
    verificata: true },
  DETRAZIONE_PENS: { nome: "Detrazione per redditi di pensione", come: 'detrazione',
    val: [[8500, 1955, 0, 0], [28000, 700, 1255, 19500], [50000, 0, 700, 22000]],
    fonte: 'art. 13 c. 3 D.P.R. 917/1986 (TUIR), testo vigente 2026: 1.955 € fino a 8.500; 700 + 1.255 × (28.000 − reddito) / 19.500 fino a 28.000; 700 × (50.000 − reddito) / 22.000 fino a 50.000; nulla oltre',
    verificata: true },
  DETRAZIONE_PENS_PIU: { nome: "Maggiorazione della detrazione da pensione", val: 50, come: 'secco',
    fonte: 'art. 13 c. 3-bis TUIR: «aumentata di un importo pari a 50 euro, se il reddito complessivo è superiore a 25.000 euro ma non a 29.000 euro»',
    verificata: true },

  // NON è tutta IVS, e il nome lo diceva male: 9,19 = 8,89 al Fondo pensioni + 0,30 alla CIG
  // straordinaria (tabelle INPS delle aliquote contributive). Chi lavora in un'azienda non
  // soggetta alla CIGS trattiene 8,89: la differenza vale 0,30 punti di RAL, e il conto la
  // ignora perché non sappiamo in che azienda sta chi legge.
  // NON RAPPRESENTATA anche l'aliquota aggiuntiva dell'1% sulla parte di retribuzione oltre la
  // prima fascia di retribuzione pensionabile (56.224 € per il 2026, circolare INPS 6/2026):
  // sopra quella soglia la trattenuta vera è più alta, quindi per le RAL alte il netto qui
  // esce un po' generoso.
  IVS: { nome: "Contributi previdenziali a carico del dipendente", val: 0.0919,
    fonte: 'quota a carico del lavoratore dipendente: 8,89% al Fondo pensioni lavoratori dipendenti più 0,30% per la CIG straordinaria — tabelle INPS delle aliquote contributive. Non è rappresentata l\'aliquota aggiuntiva dell\'1% oltre la prima fascia di retribuzione pensionabile',
    verificata: true },

  // --- previdenza complementare ------------------------------------------
  // Riscontrate sul testo della legge, non su una notizia: L. 199/2025 art. 1
  // c. 201 lett. a) n. 1 e lett. b) n. 1.1, che modificano il D.Lgs. 252/2005.
  // In vigore dal 1° luglio 2026. Attenzione: parecchi fondi hanno documenti
  // aggiornati a quella legge che continuano a scrivere le cifre vecchie —
  // vale il testo.
  TETTO_DEDUZIONE: { nome: "Tetto di deducibilità dei contributi",
    val: 5300,
    fonte: 'art. 8 c. 4 D.Lgs. 252/2005, come modificato dalla L. 199/2025 art. 1 c. 201: era 5.164,57 €',
    verificata: true
  },
  // LA CIFRA CHE È ANDATA E TORNATA, ed è il motivo per cui le fonti si rileggono invece di
  // ricordarle. La legge di bilancio l'aveva portata da 50 a 60; l'art. 16-ter del decreto
  // legge 62/2026, inserito dalla legge di conversione 112/2026 (in vigore dal 28 giugno 2026),
  // l'ha riportata a 50 «a decorrere dal termine del 1° luglio 2026», cioè prima ancora che il
  // 60% arrivasse mai ad applicarsi. Chi si è fermato alla legge di bilancio — e sono in tanti,
  // fondi compresi — scrive 60 e sbaglia di un sesto.
  QUOTA_ORDINARIA: { nome: "Massimo in capitale, ordinario",
    val: 0.50,
    fonte: 'art. 11 c. 3 D.Lgs. 252/2005: la L. 199/2025 art. 1 c. 201 l\'aveva portato al 60%, l\'art. 16-ter del D.L. 62/2026 conv. L. 112/2026 l\'ha riportato al 50% con effetto dal 1° luglio 2026',
    verificata: true
  },
  // LE MENSILITÀ DELLA PENSIONE, e perché è una costante e non un 13 sparso nel codice.
  // Il trattamento INPS si paga tredici volte l'anno: la tredicesima spetta a tutti i titolari
  // di pensione di vecchiaia, anticipata, di invalidità e all'assegno sociale. Il conto lo
  // moltiplicava per dodici, e sottostimava ogni pensione del 7% netto.
  // Il progetto lo sapeva già in un punto solo, ed è la spia che avrebbe dovuto vedersi:
  // ASSEGNO_SOCIALE qui sotto è scritto come «546,24 × 13». Due convenzioni diverse per la
  // stessa cosa, a otto righe di distanza.
  // NON vale per la rendita del fondo pensione, che è un contratto privato di rendita e non un
  // trattamento previdenziale: quella resta su dodici rate.
  MENSILITA_PENSIONE: { nome: "Mensilità del trattamento INPS in un anno", val: 13, come: 'secco',
    fonte: 'la tredicesima mensilità spetta ai titolari di pensione di vecchiaia, anzianità, anticipata e di invalidità, e all\'assegno sociale; è corrisposta con la rata di dicembre',
    verificata: true },
  ASSEGNO_SOCIALE: { nome: "Assegno sociale annuo",
    val: 7101.12,
    fonte: '546,24 € × 13 mensilità — circolare INPS 153 del 19 dicembre 2025, rivalutazione 2026 dell\'1,4%',
    verificata: true
  },
  ALIQ_FONDO_MAX: { nome: "Imposta sulla prestazione, massimo", val: 0.15, fonte: 'art. 11 c. 6 D.Lgs. 252/2005', verificata: true },
  ALIQ_FONDO_MIN: { nome: "Imposta sulla prestazione, minimo", val: 0.09, fonte: 'art. 11 c. 6 D.Lgs. 252/2005', verificata: true },
  ALIQ_FONDO_PASSO: { nome: "Riduzione per ogni anno oltre il quindicesimo", val: 0.003, fonte: '0,30 punti per ogni anno oltre il quindicesimo', verificata: true },

  // L'EROGAZIONE FRAZIONATA HA UNA TASSAZIONE PROPRIA, ed è peggiore: si parte dal 20% invece
  // che dal 15%, e la riduzione è di 0,25 punti invece di 0,30, per un massimo di 5 punti.
  // Chi ha trentacinque anni di iscrizione ci arriva al 15%, cioè dove le altre prestazioni
  // PARTONO. È la differenza che rende quella forma una scelta da guardare coi numeri e non
  // una comodità in più. La rendita a durata definita e i prelievi seguono invece l'aliquota
  // ordinaria delle prestazioni in capitale, e anche questo sta scritto: c. 6-bis.
  //
  // IL COMMA ERA SBAGLIATO: le tre aliquote stanno nel 6-TER, non nel 6-bis. Il 6-bis dice
  // un'altra cosa (rendita a durata definita e prelievi seguono il regime del comma 6), e
  // citarlo qui avrebbe mandato a leggere il pezzo giusto sotto il nome sbagliato.
  ALIQ_FRAZ_MAX: { nome: "Imposta sull'erogazione frazionata, massimo", val: 0.20,
    fonte: 'art. 11 c. 6-ter D.Lgs. 252/2005, introdotto dalla L. 199/2025 art. 1 c. 201 lett. b) n. 4: «una ritenuta a titolo d\'imposta con l\'aliquota del 20 per cento»', verificata: true },
  ALIQ_FRAZ_MIN: { nome: "Imposta sull'erogazione frazionata, minimo", val: 0.15,
    fonte: 'art. 11 c. 6-ter D.Lgs. 252/2005: «con un limite massimo di riduzione di 5 punti percentuali», raggiunto a 35 anni di partecipazione', verificata: true },
  ALIQ_FRAZ_PASSO: { nome: "Riduzione dell'imposta sull'erogazione frazionata", val: 0.0025,
    fonte: 'art. 11 c. 6-ter D.Lgs. 252/2005: «ridotta di una quota pari a 0,25 punti percentuali per ogni anno eccedente il quindicesimo anno di partecipazione»', verificata: true },
  FRAZ_ANNI_MIN: { nome: "Durata minima dell'erogazione frazionata", val: 5, come: 'anni',
    fonte: 'art. 11 c. 3-bis D.Lgs. 252/2005: «per un periodo non inferiore a cinque anni»', verificata: true },
  // LE TRE FORME NUOVE NON SONO PARTITE INSIEME. Rendita a durata definita e prelievi si possono
  // chiedere dal 1° luglio 2026; l'erogazione frazionata è stata rinviata dallo stesso decreto
  // che ha riportato la quota in capitale al 50%. Fino a quella data il calcolatore la calcola
  // ma nessun fondo la eroga, e dirlo è più utile che nasconderla.
  FRAZ_DECORRENZA: { nome: "Erogazione frazionata, da quando si può chiedere",
    val: '31 ottobre 2026', come: 'secco',
    fonte: 'art. 16-ter c. 2 del D.L. 62/2026 conv. L. 112/2026, che differisce la sola erogazione frazionata: la rendita a durata definita e i prelievi valgono dal 1° luglio 2026',
    verificata: true },

  // LA DURATA DELLA RENDITA A DURATA DEFINITA NON SI SCEGLIE: sono gli anni INTERI della
  // speranza di vita residua all'età della richiesta (art. 11 c. 3-ter). È una tavola diversa
  // da SPERANZA_VITA, che porta i decimali e serve ai coefficienti di conversione: qui la legge
  // vuole l'intero, e i fondi pubblicano proprio questa. Le due coincidono in quindici età su
  // ventuno — e coincidono a 67 anni, che è l'ancora del progetto — ma dove differiscono vale
  // questa, perché è quella che i fondi applicano.
  //
  // LE ISTRUZIONI COVIP NON HANNO L'ALLEGATO che la fonte prometteva: la deliberazione del
  // 25 giugno 2026 non pubblica nessuna tavola, ripete il rinvio della legge alla tavola ISTAT
  // e aggiunge la sola cosa che serviva davvero, cioè che si arrotonda PER DIFETTO. La tavola,
  // quindi, si riscontra dove la legge dice di guardare: sui dati ISTAT. Scaricati e confrontati
  // uno per uno (demo.istat.it, tavole di mortalità 2023, Italia, maschi e femmine): tutte e 41
  // le età coincidono col troncamento. Nessuna coincide col 2022, che era l'altra ipotesi.
  VITA_INTERA: { nome: "Vita attesa residua in anni interi, per età",
    val: [[50,34],[51,33],[52,32],[53,31],[54,30],[55,29],[56,28],[57,27],[58,26],[59,26],
          [60,25],[61,24],[62,23],[63,22],[64,21],[65,20],[66,20],[67,19],[68,18],[69,17],
          [70,16],[71,15],[72,15],[73,14],[74,13],[75,12],[76,12],[77,11],[78,10],[79,10],
          [80,9],[81,8],[82,8],[83,7],[84,7],[85,6],[86,6],[87,5],[88,5],[89,4],[90,4]],
    come: 'anni',
    fonte: 'art. 11 c. 3-ter D.Lgs. 252/2005, che rinvia alla tavola di mortalità ISTAT della popolazione generale usata per i coefficienti di trasformazione della tabella A della L. 335/1995; l\'arrotondamento per difetto è nelle Istruzioni COVIP del 25 giugno 2026. Riscontrata su tutte e 41 le età contro le tavole di mortalità ISTAT 2023, Italia, maschi e femmine', verificata: true },

  // --- TFR ---------------------------------------------------------------
  // LO 0,50% NON STA NELL'ART. 2120, e la fonte lo diceva: il codice civile dà solo il divisore
  // 13,5. La trattenuta viene dall'art. 3 della L. 297/1982, che alza il contributo del datore
  // di 0,30 punti dal luglio 1982 e di altri 0,20 dal gennaio 1983 — e nel comma dopo dispone
  // che il datore «detrae per ciascun lavoratore l'importo della contribuzione aggiuntiva
  // dall'ammontare della quota del trattamento di fine rapporto». Non è una tassa sul TFR:
  // è un contributo di previdenza pubblica pagato coi soldi del TFR.
  TFR_SU_RAL: { nome: "TFR annuo, in quota della RAL", val: 0.069074,
    fonte: 'art. 2120 c. 1 c.c., «la retribuzione dovuta per l\'anno stesso divisa per 13,5», meno lo 0,50% (0,30 + 0,20) che l\'art. 3 della L. 297/1982 fa detrarre dalla quota di TFR',
    verificata: true },
  TFR_RIV_FISSA: { nome: "Rivalutazione del TFR in azienda, parte fissa", val: 0.015,
    fonte: 'art. 2120 c. 4 c.c.: «un tasso costituito dall\'1,5 per cento in misura fissa»',
    verificata: true },
  TFR_RIV_QUOTA: { nome: 'Rivalutazione del TFR in azienda, quota dell\'inflazione', val: 0.75,
    fonte: 'art. 2120 c. 4 c.c.: «e dal 75 per cento dell\'aumento dell\'indice dei prezzi al consumo per le famiglie di operai ed impiegati, accertato dall\'ISTAT»',
    verificata: true },
  TFR_IMPOSTA_RIV: { nome: "Imposta sostitutiva sulla rivalutazione del TFR", val: 0.17,
    fonte: 'art. 11 c. 3 D.Lgs. 47/2000: «l\'imposta sostitutiva delle imposte sui redditi nella misura del 17 per cento», aliquota elevata dalla L. 190/2014 per le rivalutazioni dal 1° gennaio 2015',
    verificata: true },

  // --- coefficienti di conversione ---------------------------------------
  // NON sono legge, e nessun fondo pubblica «il» coefficiente: ogni convenzione
  // assicurativa ha la sua tavola, differenziata per età, sesso, forma della
  // rendita e rateazione, e scade insieme alla convenzione. Copiarne una
  // significherebbe mettere qui dieci numeri che nessuno può controllare.
  //
  // Quindi il coefficiente non si copia: si ricostruisce da due cose sole.
  //
  //     coefficiente(età) = 1 / (anni di vita attesi × margine)
  //
  // Gli anni sono quelli dell'ISTAT, pubblici e aggiornati ogni anno. Il margine
  // è quanto la compagnia conta in più: chi compra una rendita vive più della
  // media, e la compagnia si tiene un margine di prudenza. È l'unica stima
  // nostra rimasta, ed è misurata sulle tavole vere in
  // verifiche/tavole-dei-fondi.mjs, che tiene questa curva dentro il pubblicato.
  SPERANZA_VITA: { nome: "Speranza di vita residua, per età",
    val: ANNI_ISTAT,
    come: 'anni',
    fonte: 'Eurostat demo_mlexpec, Italia 2023, sessi congiunti: valori riscontrati uno per uno. La tavola nazionale ISTAT per lo stesso anno dà circa 0,2 anni in meno a ogni età, e il margine qui sotto è calibrato su questa',
    verificata: true
  },
  MARGINE_RENDITA: { nome: "Anni che la compagnia conta in più dell'ISTAT",
    val: MARGINE,
    come: 'volte',
    fonte: 'misurato sulle tavole pubblicate: a 67 anni l\'ISTAT ne dà 19,4, le convenzioni ne contano fra 20 e 26',
    verificata: true
  },
  // La stessa età, con la stessa legge, dà coefficienti diversi secondo la
  // convenzione del fondo, il sesso, la rateazione e l'anno di nascita. Questi
  // sono i due estremi misurati, e servono a dire quando una risposta vale per
  // chiunque e quando dipende dal fondo.
  BANDA_ALTA: { nome: "Coefficiente più alto fra quelli pubblicati", val: 1.21, come: 'volte',
    fonte: 'convenzione Generali (Cometa, Solidarietà Veneto): uomo, rate annuali',
    verificata: true },
  BANDA_BASSA: { nome: "Coefficiente più basso fra quelli pubblicati", val: 0.77, come: 'volte',
    fonte: 'tavola A62I (Multifond, Alifond): donna, rate mensili, con lo spostamento d\'età per chi è nato dopo il 1978 — le quattro condizioni sfavorevoli insieme',
    verificata: true },

  // Il motore riceve la curva già fatta: una tabella [età, coefficiente] come
  // prima, ma nessuno dei suoi numeri è scritto a mano.
  COEFF_ETA: { nome: "Coefficienti di conversione in rendita, per età",
    val: ANNI_ISTAT.map(([eta, anni]) => [eta, 1 / (anni * MARGINE)]),
    come: 'curva',
    fonte: 'derivato: 1 diviso la speranza di vita per il margine. Non è la tavola di un fondo',
    verificata: true
  },

  FATT_REV:   { nome: 'Rendita reversibile, quanto resta dell\'assegno', val: 0.80,
    fonte: 'misurato sulle stesse tavole, reversibile al 100%: da 0,93 per la donna a 0,66 per l\'uomo',
    verificata: true },
  CERTA_ANNI: { nome: 'Rendita certa, anni garantiti', val: 10, come: 'secco',
    fonte: 'forma di rendita più diffusa fra quelle con periodo garantito',
    verificata: true },
  FATT_CERTA: { nome: 'Rendita certa 10 anni, quanto resta dell\'assegno', val: 0.98,
    fonte: 'misurato sulle stesse tavole: fra 0,95 e 0,99 secondo età e sesso',
    verificata: true },

  // --- lo scenario del superstite ------------------------------------------
  // Le aliquote della pensione ai superstiti sono quattro (coniuge solo, coniuge con uno o più
  // figli, figli soli). Qui serve la PRIMA e basta: il modello rappresenta uno o due adulti e
  // non ha figli, quindi tenere le altre vorrebbe dire mantenere cifre che nessun conto usa.
  REVERSIBILITA: { nome: "Pensione ai superstiti, quota al coniuge solo", val: 0.60,
    fonte: 'aliquota per il solo coniuge, art. 1 c. 41 L. 335/1995 e tabelle INPS',
    verificata: true },
  // Il trattamento minimo esce dalla STESSA circolare INPS dell'assegno sociale: si aggiornano
  // insieme, ogni gennaio, e non aggiunge un canale di manutenzione.
  TRATT_MINIMO: { nome: "Trattamento minimo di pensione, mensile", val: 611.85,
    fonte: 'circolare INPS 153 del 19 dicembre 2025, valore provvisorio 2026',
    verificata: true },
  TRATT_MINIMO_MENS: { nome: "Mensilità del trattamento minimo annuo", val: 13, come: 'secco',
    fonte: 'la Tabella F computa il trattamento minimo annuo come 13 volte quello mensile',
    verificata: true },
  // La riduzione morde sui redditi PROPRI del superstite, non sulla pensione che eredita.
  CUMULO_SUPERSTITI: { nome: "Riduzione della pensione ai superstiti per redditi propri",
    val: [[3, 0.25], [4, 0.40], [5, 0.50]], come: 'cumulo',
    fonte: 'Tabella F, art. 1 c. 41 L. 335/1995: oltre 3, 4 e 5 volte il trattamento minimo annuo',
    verificata: true },
  // QUANTO SPENDE CHI RESTA. Non è una casella e non è una nostra invenzione: sono le due scale
  // di equivalenza pubbliche, e la distanza fra loro è l'incertezza dichiarata.
  EQUIV_BASSA: { nome: "Spesa di una persona sola, rispetto a due (scala minore)", val: 0.60,
    fonte: 'scala di equivalenza Carbonaro, usata dall\'ISTAT per la povertà relativa',
    verificata: true },
  EQUIV_ALTA: { nome: "Spesa di una persona sola, rispetto a due (scala maggiore)", val: 0.667,
    fonte: 'scala OCSE modificata: 1 per il primo adulto, 0,5 per il secondo',
    verificata: true },

  // --- l'abitazione, quando si decide di cambiarla -------------------------
  // I COSTI DI UNA COMPRAVENDITA NON SONO UNA CASELLA: chi compila sa quanto vale casa sua, non
  // quanto chiede l'agenzia della porta accanto. Sono tre, e hanno tre nature diverse — per
  // questo non stanno in un numero solo. Due scalano col prezzo, il terzo no: l'onorario del
  // notaio e l'imposta di registro (che si calcola sul valore CATASTALE, non sul prezzo di
  // mercato) restano quasi fermi mentre il prezzo sale.
  //
  // LA PROVVIGIONE NON È FISSATA DA NESSUNA LEGGE, e va detto: le fonti di settore rilevano una
  // forbice del 2-5% per ciascuna parte oltre IVA. Si adotta il 3%, che è il valore più citato.
  // Chi ha spuntato meno lo corregga alzando il valore che scrive: il conto mostra in chiaro
  // quanto sta togliendo, proprio perché questa cifra è discutibile.
  COSTI_VENDITA: { nome: "Costi a carico di chi vende, in quota del prezzo", val: 0.0366,
    fonte: 'provvigione di mediazione 3% oltre IVA al 22%: non è fissata per legge, le fonti di settore rilevano il 2-5% per ciascuna parte',
    verificata: true },
  COSTI_ACQUISTO: { nome: "Provvigione a carico di chi compra, in quota del prezzo", val: 0.0366,
    fonte: 'provvigione di mediazione 3% oltre IVA al 22%, dovuta da entrambe le parti: non è fissata per legge',
    verificata: true },
  // Registro 2% sul valore catastale con un minimo di 1.000 €, ipotecaria e catastale 50 €
  // ciascuna (Agenzia delle Entrate, acquisto prima casa da privato), più l'onorario notarile,
  // libero dal 2017 e rilevato dalle fonti di settore fra 2.000 e 5.000 €.
  // NON è una quota del prezzo: su un'abitazione da 150.000 € pesa il triplo che su una da
  // 450.000. Tenerlo fisso è meno sbagliato che farlo scalare.
  COSTI_ATTO: { nome: "Imposte d'atto e onorario notarile, in cifra fissa", val: 4500,
    fonte: "imposta di registro 2% del valore catastale (minimo 1.000 €) più ipotecaria e catastale di 50 € ciascuna, art. 1 Tariffa parte I DPR 131/1986 e agevolazione prima casa; onorario notarile libero, 2.000-5.000 € secondo le fonti di settore",
    verificata: true },

  // --- convenzioni nostre, non di legge -----------------------------------
  ANNO0:      { nome: 'Anno di partenza del conto', val: 2026, come: 'secco', fonte: 'l\'anno da cui parte il conto', verificata: true },
  // Il verdetto nasce da una traiettoria sola, e nel decumulo conta la SEQUENZA dei rendimenti,
  // non la loro media: gli stessi rendimenti in ordine diverso danno piani diversi. Invece di
  // una nuvola di scenari, che richiederebbe una distribuzione che non possiamo citare, si
  // applica una perturbazione sola, dichiarata e rifacibile a mano.
  PROVA_ANNI: { nome: "Prova di tenuta, esercizi iniziali a rendimento nullo", val: 10,
    come: 'secco',
    fonte: 'convenzione: dieci esercizi iniziali a rendimento reale nullo, per misurare quanto il verdetto dipenda dalla sequenza dei rendimenti anziché dalla loro media',
    verificata: true }
};

const V = k => REGOLE[k].val;

// --- come si scrivono le cifre nel testo delle pagine ----------------------
// STESSA FORMATTAZIONE DEL CALCOLATORE, e non è un dettaglio: in italiano toLocaleString
// non raggruppa i numeri a quattro cifre, così le pagine scrivevano «5300 €» mentre il conto
// scriveva «5.300 €». `useGrouping:'always'` è la stessa opzione usata da `fmt` nell'HTML.
const eur = n => Math.round(n).toLocaleString('it-IT', {useGrouping: 'always'}) + ' €';
const pc  = (n, dec = 0) => (n * 100).toLocaleString('it-IT',
  {useGrouping: 'always', minimumFractionDigits: dec, maximumFractionDigits: dec}) + '%';

// la soglia del «tutto in contanti» non è una costante: si ricava dal
// coefficiente, quindi cambia con l'età. Nel testo si cita quella a 67 anni.
export const soglia = coeff => (0.5 * V('ASSEGNO_SOCIALE')) / (0.7 * coeff);
const COEFF_67 = V('COEFF_ETA').find(([e]) => e === 67)[1];
const ANNI_67  = V('SPERANZA_VITA').find(([e]) => e === 67)[1];

// Le due soglie che si possono affermare per chiunque. Il coefficiente più alto
// dà la soglia più bassa: sotto quella la liquidazione integrale spetta con
// qualunque convenzione. Sopra quella che nasce dal coefficiente più basso non
// spetta con nessuna. In mezzo dipende dal fondo, e va chiesto al fondo.
const SOGLIA_CHIUNQUE = soglia(COEFF_67 * V('BANDA_ALTA'));
const SOGLIA_NESSUNO  = soglia(COEFF_67 * V('BANDA_BASSA'));

// --- L'ESEMPIO DELLE PAGINE, calcolato e non scritto a mano -----------------
// Una pagina che spiega una regola deve fare i conti con le stesse cifre del
// calcolatore, o al primo cambio di legge racconta una cosa e il conto un'altra.
const ESEMPIO = { ral: 35000, pcLav: 1.2, pcDat: 2.0 };
const irpef = y => {
  let t = 0, sotto = 0;
  for (const [tetto, al] of V('SCAGLIONI')){
    if (y <= sotto) break;
    t += (Math.min(y, tetto) - sotto) * al; sotto = tetto;
  }
  return t;
};
// LA STESSA IMPOSTA NETTA DEL CALCOLATORE, e deve restarlo: l'esempio delle pagine mostra lo
// sconto della contribuzione, che dipende dalle detrazioni dell'art. 13 esattamente come nel
// motore. Se qui restasse la sola imposta lorda, la pagina direbbe 330 € dove il conto ne dice
// 417 — la prima regola del progetto, rotta nel punto in cui è più difficile accorgersene.
const detrazione = (tab, R) => {
  for (const [fino, base, quota, den] of tab)
    if (R <= fino) return base + (den > 0 ? quota * (fino - R) / den : 0);
  return 0;
};
const irpefNetta = (reddito, pensione) => {
  const R = Math.max(0, reddito);
  const piu = pensione && R > 25000 && R <= 29000 ? V('DETRAZIONE_PENS_PIU') : 0;
  return Math.max(0, irpef(R)
    - detrazione(pensione ? V('DETRAZIONE_PENS') : V('DETRAZIONE_LAV'), R) - piu);
};
{
  const e = ESEMPIO;
  e.lav = e.ral * e.pcLav / 100;
  e.dat = e.ral * e.pcDat / 100;
  e.tfr = e.ral * V('TFR_SU_RAL');
  e.tot = e.lav + e.dat + e.tfr;
  e.dentro = e.lav + e.dat;
  const base = e.ral * (1 - V('IVS'));
  e.sconto = irpefNetta(base, false) - irpefNetta(base - Math.min(e.dentro, V('TETTO_DEDUZIONE')), false);
  // lo sconto vale sulla parte dedotta; qui si mostra quello sulla quota del lavoratore
  e.scontoLav = irpefNetta(base, false) - irpefNetta(base - Math.min(e.lav, V('TETTO_DEDUZIONE')), false);
  e.costa = e.lav - e.scontoLav;
  e.volte = e.dentro / e.costa;
  e.aliqMarg = V('SCAGLIONI').find(([t]) => base <= t)[1];
  // L'ALIQUOTA MARGINALE EFFETTIVA. La detrazione decresce di quota/denominatore per ogni euro
  // di reddito, quindi dedurne uno ne restituisce anche quella parte: la pendenza si somma
  // all'aliquota di scaglione. Ricavata dalle bande, così se la legge cambia si muove da sé.
  {
    const b = V('DETRAZIONE_LAV').find(([fino]) => base <= fino);
    e.aliqMargEff = e.aliqMarg + (b && b[3] > 0 ? b[2] / b[3] : 0);
  }
}

export const TESTI = {
  tetto:            eur(V('TETTO_DEDUZIONE')),
  quota:            pc(V('QUOTA_ORDINARIA')),
  assegnoSociale:   eur(V('ASSEGNO_SOCIALE')),
  soglia:           eur(soglia(COEFF_67)),
  sogliaChiunque:   eur(SOGLIA_CHIUNQUE),
  sogliaNessuno:    eur(SOGLIA_NESSUNO),
  coeff67:          pc(COEFF_67, 1),
  anni67:           ANNI_67.toLocaleString('it-IT', {minimumFractionDigits: 1}),
  margine:          MARGINE.toLocaleString('it-IT', {minimumFractionDigits: 2}),
  anniMargine:      (ANNI_67 * MARGINE).toLocaleString('it-IT',
                      {minimumFractionDigits: 1, maximumFractionDigits: 1}),
  bandaAlta:        pc(V('BANDA_ALTA') - 1),
  bandaBassa:       pc(1 - V('BANDA_BASSA')),
  aliqFrazMax:      pc(V('ALIQ_FRAZ_MAX')),
  aliqFrazMin:      pc(V('ALIQ_FRAZ_MIN')),
  aliqFrazPunti:    (V('ALIQ_FRAZ_PASSO') * 100).toLocaleString('it-IT',
                      {minimumFractionDigits: 2, maximumFractionDigits: 2}),
  vitaInteraEs:     String((V('VITA_INTERA').find(([e]) => e === 67) || [, ''])[1]),
  frazAnniMin:      String(V('FRAZ_ANNI_MIN')),
  // l'abitazione: le tre voci del costo di una compravendita, più il totale su un esempio, che
  // è il modo in cui la cifra si capisce davvero (una percentuale sola non dice quanto pesa)
  costiVendita:     pc(V('COSTI_VENDITA'), 2),
  costiAcquisto:    pc(V('COSTI_ACQUISTO'), 2),
  costiAtto:        eur(V('COSTI_ATTO')),
  costiEsVendita:   eur(300000 * V('COSTI_VENDITA')),
  costiEsCambio:    eur(300000 * V('COSTI_VENDITA')
                        + 180000 * V('COSTI_ACQUISTO') + V('COSTI_ATTO')),
  aliqFondoMax:     pc(V('ALIQ_FONDO_MAX')),
  aliqFondoMin:     pc(V('ALIQ_FONDO_MIN')),
  aliqFondoPasso:   pc(V('ALIQ_FONDO_PASSO'), 2),
  // «cala dello 0,30%» sarebbe falso: lo 0,30% di 15 è 0,045. Sono PUNTI percentuali.
  aliqFondoPunti:   (V('ALIQ_FONDO_PASSO') * 100).toLocaleString('it-IT',
                      {minimumFractionDigits:2, maximumFractionDigits:2}),
  tfrSuRal:         pc(V('TFR_SU_RAL'), 4),
  tfrRivFissa:      pc(V('TFR_RIV_FISSA'), 1),
  tfrRivQuota:      pc(V('TFR_RIV_QUOTA')),
  tfrImpostaRiv:    pc(V('TFR_IMPOSTA_RIV')),
  ivs:              pc(V('IVS'), 2),
  scaglioni:        V('SCAGLIONI').map(([t, a], i, tutti) =>
                      i === tutti.length - 1
                        ? `${pc(a)} sopra ${eur(tutti[i-1][0])}`
                        : `${pc(a)} fino a ${eur(t)}`).join(', '),
  irpef1:           pc(V('SCAGLIONI')[0][1]),
  irpef2:           pc(V('SCAGLIONI')[1][1]),
  irpef3:           pc(V('SCAGLIONI')[2][1]),
  scaglione1:       eur(V('SCAGLIONI')[0][0]),
  scaglione2:       eur(V('SCAGLIONI')[1][0]),
  provaAnni:        String(V('PROVA_ANNI')),
  mensPensione:     String(V('MENSILITA_PENSIONE')),
  reversibilita:    pc(V('REVERSIBILITA')),
  trattMinimo:      eur(V('TRATT_MINIMO')),
  trattMinimoAnno:  eur(V('TRATT_MINIMO') * V('TRATT_MINIMO_MENS')),
  equivBassa:       pc(V('EQUIV_BASSA')),
  equivAlta:        pc(V('EQUIV_ALTA')),
  cumuloSoglie:     V('CUMULO_SUPERSTITI')
                      .map(([n, q]) => `${pc(q)} oltre ${eur(V('TRATT_MINIMO') * V('TRATT_MINIMO_MENS') * n)}`)
                      .join(', '),
  fattRev:          pc(1 - V('FATT_REV')),
  fattCerta:        pc(1 - V('FATT_CERTA')),
  anno0:            String(V('ANNO0')),
  frazDal:          V('FRAZ_DECORRENZA'),
  revisione:        REVISIONE,

  // l'esempio, tutto calcolato
  exRal:      eur(ESEMPIO.ral),
  exPcLav:    pc(ESEMPIO.pcLav / 100, 1),
  exPcDat:    pc(ESEMPIO.pcDat / 100, 1),
  exLav:      eur(ESEMPIO.lav),
  exDat:      eur(ESEMPIO.dat),
  exTfr:      eur(ESEMPIO.tfr),
  exTot:      eur(ESEMPIO.tot),
  exDentro:   eur(ESEMPIO.dentro),
  exSconto:   eur(ESEMPIO.scontoLav),
  exCosta:    eur(ESEMPIO.costa),
  exVolte:    ESEMPIO.volte.toLocaleString('it-IT', {minimumFractionDigits:1, maximumFractionDigits:1}) + '×',
  exAliquota: pc(ESEMPIO.aliqMarg),
  exAliquotaEff: pc(ESEMPIO.aliqMargEff, 1)
};

// --- il blocco di costanti che finisce dentro il calcolatore ---------------
export function blocco(){
  const c = V('COEFF_ETA').map(([e, v]) => `[${e},${v}]`).join(',');
  const sv = V('SPERANZA_VITA').map(([e, v]) => `[${e},${v}]`).join(',');
  return `// GENERATO DA regole.mjs — non modificare qui: si tocca regole.mjs e si rilancia il build
const COEFF_ETA = [${c}];
// Serve al calcolatore per dire fino a che età il confronto capitale/rendita è misurato: è la
// stessa tavola pubblica da cui escono i coefficienti, non un secondo dato da tenere allineato.
const SPERANZA_VITA = [${sv}];
const COEFF_RENDITA = ${COEFF_67};
const ANNO0 = ${V('ANNO0')};
const ASSEGNO_SOCIALE = ${V('ASSEGNO_SOCIALE')};
const QUOTA_ORDINARIA = ${V('QUOTA_ORDINARIA')};
const TETTO_DEDUZIONE = ${V('TETTO_DEDUZIONE')};
const IVS = ${V('IVS')};
const TFR_SU_RAL = ${V('TFR_SU_RAL')};
const TFR_RIV_FISSA = ${V('TFR_RIV_FISSA')}, TFR_RIV_QUOTA = ${V('TFR_RIV_QUOTA')}, TFR_IMPOSTA_RIV = ${V('TFR_IMPOSTA_RIV')};
const SCAGLIONI = [${V('SCAGLIONI').map(([t, a]) => `[${t === Infinity ? 'Infinity' : t}, ${a}]`).join(', ')}];
const DETRAZIONE_LAV = [${V('DETRAZIONE_LAV').map(b => `[${b.join(',')}]`).join(', ')}];
const DETRAZIONE_PENS = [${V('DETRAZIONE_PENS').map(b => `[${b.join(',')}]`).join(', ')}];
const DETRAZIONE_PENS_PIU = ${V('DETRAZIONE_PENS_PIU')};
const MENS_PENS = ${V('MENSILITA_PENSIONE')};
const PROVA_ANNI = ${V('PROVA_ANNI')};
const REVERSIBILITA = ${V('REVERSIBILITA')};
const TRATT_MINIMO_ANNO = ${(V('TRATT_MINIMO') * V('TRATT_MINIMO_MENS')).toFixed(2)};
const CUMULO_SUPERSTITI = [${V('CUMULO_SUPERSTITI').map(([n,q]) => `[${n},${q}]`).join(',')}];
const EQUIV_BASSA = ${V('EQUIV_BASSA')}, EQUIV_ALTA = ${V('EQUIV_ALTA')};
const FATT_REV = ${V('FATT_REV')}, FATT_CERTA = ${V('FATT_CERTA')};
const CERTA_ANNI = ${V('CERTA_ANNI')};
const BANDA_ALTA = ${V('BANDA_ALTA')}, BANDA_BASSA = ${V('BANDA_BASSA')};
// La durata della rendita a durata definita: anni INTERI, tavola dei fondi (art. 11 c. 3-ter).
const VITA_INTERA = [${V('VITA_INTERA').map(([e, v]) => `[${e},${v}]`).join(',')}];
const ALIQ_FRAZ_MAX = ${V('ALIQ_FRAZ_MAX')}, ALIQ_FRAZ_MIN = ${V('ALIQ_FRAZ_MIN')},
      ALIQ_FRAZ_PASSO = ${V('ALIQ_FRAZ_PASSO')};
const FRAZ_ANNI_MIN = ${V('FRAZ_ANNI_MIN')};
// I costi di una compravendita: due quote del prezzo e una cifra fissa, perché l'onorario del
// notaio e l'imposta di registro sul valore catastale non scalano col prezzo di mercato.
const COSTI_VENDITA = ${V('COSTI_VENDITA')}, COSTI_ACQUISTO = ${V('COSTI_ACQUISTO')},
      COSTI_ATTO = ${V('COSTI_ATTO')};`;
}

// --- la tabella completa delle regole, per la pagina «il metodo». Generata, non scritta:
// una pagina che dichiara su cosa poggia il conto deve leggere le stesse costanti del conto.
// le curve per età sono lunghe una trentina di righe: in tabella si mostrano a
// tre età, che bastano a far vedere il verso e l'ordine di grandezza
const PUNTI = [60, 67, 75];
const aEtà = (val, come) => PUNTI
  .map(e => `${come(val.find(([x]) => x === e)[1])} a ${e} anni`).join(' · ');

const mostra = r => Array.isArray(r.val)
  ? r.come === 'anni'  ? aEtà(r.val, a => a.toLocaleString('it-IT', {minimumFractionDigits: 1}))
  : r.come === 'curva' ? aEtà(r.val, c => pc(c, 1))
  // LE BANDE DELLE DETRAZIONI hanno una forma sola — base + quota × (fino − reddito) / den — e
  // senza un formato loro finivano nel ramo delle aliquote, che le rendeva «195.500% fino a
  // 15.000 €». Il numero era giusto e la frase assurda: se ne accorge solo chi guarda la pagina.
  : r.come === 'detrazione' ? r.val.map(([fino, base, quota, den]) =>
      (base ? eur(base) : '')
      + (quota ? (base ? ' + ' : '') + `${eur(quota)} × (${eur(fino)} − reddito) / `
                 + den.toLocaleString('it-IT', {useGrouping: 'always'}) : '')
      + ` fino a ${eur(fino)}`).join(' · ') + ' · nulla oltre'
  : r.val.map(([t, a]) => `${pc(a)} ${t === Infinity ? 'oltre' : 'fino a ' + eur(t)}`).join(' · ')
  : r.come === 'cumulo' ? r.val.map(([n, q]) => `${pc(q)} oltre ${n} volte`).join(' · ')
  : r.come === 'volte'    ? r.val.toLocaleString('it-IT', {minimumFractionDigits: 2}) + ' volte'
  : r.come === 'secco'    ? String(r.val)
  : r.come === 'percento' ? r.val + '%'
  : r.val > 1 ? eur(r.val)
  : pc(r.val, 2).replace(',00', '').replace(/,(\d)0%/, ',$1%');

export function tabellaRegole(){
  const riga = ([k, r]) => `<tr><td>${r.nome}</td><td>${mostra(r)}</td><td>${r.fonte}</td>
    <td class="${r.verificata ? 'ok' : 'ko'}">${r.verificata ? 'verificata' : 'da confermare'}</td></tr>`;
  return Object.entries(REGOLE).map(riga).join('\n');
}
// le due tabelle della pagina sulla prestazione: soglie e pareggi per età, calcolati
const coeffEta = eta => {
  const C = V('COEFF_ETA'), primo = C[0], ultimo = C[C.length-1];
  if (!(eta > primo[0])) return primo[1];
  if (eta >= ultimo[0]) return ultimo[1];
  for (let i = 1; i < C.length; i++){
    const [a1,c1] = C[i-1], [a2,c2] = C[i];
    if (eta <= a2) return c1 + (c2-c1)*(eta-a1)/(a2-a1);
  }
  return ultimo[1];
};
const ETA_ESEMPIO = [60, 65, 67, 70];
export function tabellaSoglie(){
  // l'ultima colonna è la sola cosa che si possa affermare senza conoscere il
  // fondo: sotto il primo valore spetta a chiunque, sopra il secondo a nessuno
  return ETA_ESEMPIO.map(e => `<tr><td>${e} anni</td><td>${pc(coeffEta(e), 1)}</td>
    <td>${eur(soglia(coeffEta(e)))}</td>
    <td>da ${eur(soglia(coeffEta(e) * V('BANDA_ALTA')))} a ${eur(soglia(coeffEta(e) * V('BANDA_BASSA')))}</td></tr>`).join('\n');
}
export function tabellaPareggi(){
  return [60, 67, 72].map(e => `<tr><td>${e} anni</td><td>${pc(coeffEta(e), 1)}</td>
    <td>${(1/coeffEta(e)).toLocaleString('it-IT', {minimumFractionDigits:1, maximumFractionDigits:1})}</td></tr>`).join('\n');
}

// Lo stato dei parametri è un blocco intero e non un elenco, perché quando non
// c'è più niente da confermare la pagina deve dire un'altra cosa, non mostrare
// una lista vuota sotto un titolo di allarme. Se un domani una cifra torna
// scoperta — cambia una legge, scade un riscontro — l'allarme ricompare da solo.
export function statoParametri(){
  const aperte = Object.entries(REGOLE).filter(([, r]) => !r.verificata);
  if (!aperte.length) return `<div class="chiave">
  <p><b>Tutti i parametri sono stati riscontrati sulla rispettiva fonte</b>, indicata nella
  colonna «da dove viene»: il testo della disposizione per le cifre di legge, la circolare INPS
  per l'assegno sociale, le tavole pubblicate dalle convenzioni assicurative per il margine
  applicato alla speranza di vita.</p>
  <p>Resta un'approssimazione che nessun riscontro elimina: <b>il coefficiente di conversione
  applicabile è quello del proprio fondo</b>, e questo calcolatore adotta un valore centrale fra
  quelli pubblicati. La dispersione è descritta sopra e ne è dichiarata l'ampiezza.</p>
</div>`;
  return `<div class="chiave allarme">
  <p><b>I parametri seguenti non sono stati riscontrati sulla fonte</b> e vanno verificati presso
  il proprio fondo prima di fondarvi una decisione.</p>
  <ul>
${aperte.map(([, r]) => `    <li><b>${r.nome}</b> — nel conto vale ${mostra(r)}. ${r.fonte}</li>`).join('\n')}
  </ul>
</div>`;
}

// --- quali cifre non sono confermate: serve al README e alla pagina «il metodo»
export const daConfermare = () => Object.entries(REGOLE)
  .filter(([, r]) => !r.verificata)
  .map(([k, r]) => ({ nome: k, fonte: r.fonte }));
