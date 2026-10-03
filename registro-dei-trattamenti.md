# Registro delle attività di trattamento

Art. 30 del Regolamento (UE) 2016/679. L'esenzione per chi ha meno di 250 dipendenti (art. 30
par. 5) non vale quando il trattamento **non è occasionale**, e una misurazione delle visite attiva
tutti i giorni non lo è: il registro si tiene, anche se il titolare è una persona sola. Va
aggiornato prima di attivare un trattamento nuovo, insieme a `sorgenti/privacy.html`, e deve dire
le stesse cose.

**Titolare:** Alessandro Lovato, persona fisica · recapito: ugofoscolo6278@gmail.com
**Responsabile della protezione dei dati:** non designato (art. 37: non ricorrono i casi)
**Ultimo aggiornamento:** 3 ottobre 2026

---

## 1. Misurazione delle visite

| voce | contenuto |
|---|---|
| finalità | sapere quante persone visitano il sito, quali pagine, e quante arrivano a un risultato del calcolatore (evento `verdetto`, senza parametri) |
| base giuridica | consenso (art. 6 par. 1 lett. a GDPR; art. 122 D.Lgs. 196/2003), raccolto col banner prima di qualunque invio |
| interessati | visitatori del sito che prestano il consenso |
| dati | identificativo casuale del cookie `_ga`, pagine visitate e sequenza, inizio e durata della visita, scorrimento, clic verso altri siti, provenienza, lingua, tipo di dispositivo e browser, località approssimativa ricavata dall'IP (che Google dichiara di non conservare). **Nessuna cifra inserita nel calcolatore** |
| responsabile del trattamento | Google Ireland Limited, Google Analytics 4, sulla base dei termini sul trattamento dei dati di Google Analytics (da accettare in Amministrazione → Impostazioni account) |
| trasferimenti extra UE | Stati Uniti, sulla base della decisione di adeguatezza della Commissione del 10 luglio 2023 (EU-US Data Privacy Framework), a cui Google LLC aderisce |
| conservazione | quella impostata nella proprietà GA4, al massimo 14 mesi; cookie `_ga` e `_ga_<id>`: due anni dall'ultima visita |
| misure | il tag non è nel documento e parte solo dopo il consenso; la revoca accende `ga-disable-<ID>`, toglie la funzione di invio e cancella i cookie; Google Signals e segnali pubblicitari disattivati nel codice; controlli automatici in `verifiche/consenso.mjs` e `verifiche/a-schermo.mjs` |

## 2. Corrispondenza

| voce | contenuto |
|---|---|
| finalità | rispondere a chi scrive e correggere il sito se segnala un errore |
| base giuridica | legittimo interesse a dare seguito a una richiesta (art. 6 par. 1 lett. f GDPR) |
| interessati | chi scrive al recapito |
| dati | indirizzo email, nome se indicato, contenuto del messaggio |
| responsabile del trattamento | Google (Gmail), fornitore della casella di posta |
| trasferimenti extra UE | possibili, sulla base del Data Privacy Framework |
| conservazione | fino alla conclusione della corrispondenza |
| misure | nessuna comunicazione a terzi; accesso alla casella protetto dalle credenziali del titolare |

## 3. Trattamenti che non sono del titolare, annotati perché l'informativa li nomina

- **Log del servizio di hosting.** GitHub, Inc. (GitHub Pages) registra l'IP e la data delle
  richieste per sicurezza e obblighi di legge, come **titolare autonomo** (GitHub General Privacy
  Statement), con trasferimento negli Stati Uniti sul Data Privacy Framework.
- **Dati inseriti nel calcolatore.** Restano nel `localStorage` del browser di chi li scrive e non
  arrivano mai al titolare: non sono un suo trattamento. L'informativa lo dichiara, e spiega come
  cancellarli.

## Da controllare nel pannello di Google Analytics, una volta e a ogni modifica

- termini sul trattamento dei dati accettati;
- conservazione dei dati impostata (2 o 14 mesi), e riportata qui sopra se si vuole più precisa;
- misurazione avanzata: l'informativa dichiara scorrimento e clic verso altri siti; le altre voci
  (interazioni coi moduli, download, ricerca nel sito, video) si possono spegnere, e non servono;
- condivisione dei dati con Google e Google Signals spenti anche nel pannello, oltre che nel codice.
