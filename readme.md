POWER BALLS
======================

Introduzione
-------------
Power Balls è un progetto realizzato per il conseguimento dell'esame finale del corso di Programmazione Web Front-End, tenuto dal Professore Shadi Lahham.  
E' stato sviluppato interamente dagli studenti del gruppo 7 del corso Backend System Integrator, presso l'istituto Fondazione ITS ICT per il Piemonte.

----
----

Descrizione del progetto
-------------------
Il progetto consiste in una simulazione del lancio di una o più palline all'interno di un'area prestabilita.  

Abbiamo tenuto in considerazione numerose variabili come la forza iniziale del lancio, la traiettoria, la velocità istantanea e l'accelerazione della pallina. Inoltre è possibile scegliere se attivare la gravità o meno.

Il nostro approccio è stato **puramente cinematico**, non abbiamo mai preso in cosiderazione le forze che agiscono sulla pallina, ma solo le leggi che ne descrivono il moto nello spazio in funzione del tempo.

Una preview permette di visualizzare la pallina da generare, potendone modificare colore e dimensione. Più la pallina sarà grande e più sarà difficile lanciarla.

E' possibile selezionare una pallina per accedere alle sue informazioni (es posizione e velocità) o per cancellarla.

La simulazione può essere fermata, ripresa, accelerata o decelerata in qualsiasi istante.

Sono stati inseriti anche degli effetti sonori in modo sperimentale, come ad esempio il suono dell'urto contro le pareti. 

E' possibile interagire interamente con l'applicativo sia con mouse che con tastiera, attraverso opportune shorcuts.

---
---

Configurazione
--------------------------------------------
L'applicativo necessita solamente di essere installato su un web server per funzionare con la configurazione di default.

E' possibile configurare a proprio piacimento alcuni parametri all'interno di script/generateBall.js, indicati con il commento "CONFIGURAZIONE", ad esempio la forza iniziale del lancio o la perdita di velocità quando le palline urtano contro una parete.

---
---

Carattertiche tecniche: traiettoria pallina
-------------------------------------------

Per implementare il lancio abbiamo innanzitutto calcolato il vettore della velocità iniziale che è composto dalle seguenti proprietà:
- intensità: quando l'utente clicca col mouse memorizziamo timestamp e posizione iniziale, quando lo rilascia memorizziamo quelle finali. L'intensità è data dal rapporto della distanza fra i due punti(spazio percorso) e il tempo trascorso (differenza fra i due timestamp)
- angolo: calcolata come -arctan(distanzaX, distanzaY). Questa proprietà contiene l'informazione sulla direzione e il verso della velocità.
- speedX: proiezione del vettore velocità iniziale su asse X
- speedY: proiezione del vettore velocità iniziale su asse Y

Una volta ottenute le componenti delle velocità su entrambi gli assi abbiamo scomposto il moto della pallina:

**asse x: moto rettilineo uniforme**, in quanto l'accelerazione gravitazionale è tutta sull'asse y.  
> x(t) = x0 + v0(t-t0)  
x0 posizione iniziale pallina su asse x  
v0 velocità inziale su asse x  
t0 tempo iniziale

**asse y: moto rettilineo uniformemente accelerato**, in quanto c'è l'accelerazione gravitazionale
> y(t) = y0 + v0(t-t0) + 0.5*a*t^2  
y0 posizione iniziale su asse y  
v0 velocità iniziale su asse y  
t0 tempo iniziale  
a accelerazione gravitazionale su asse y  

*nota: quando l'utente disabilità la gravità il moto sull'asse y diventa rettilineo uniforme*

Queste due formule descrivono la traiettoria della pallina al variare del tempo, quindi sono perfette da inserire all'interno di un setAnimationFrame().

Carattertiche tecniche: velocità istantanea
------------------------------------------
Per risalire alla velocità della pallina nel tempo abbiamo derivato le formule precedenti, in quanto la velocità è la derivata del tempo

asse x
>v(t) = v0
La velocità su asse x è costante in quanto non c'è accelerazione

asse y
>v(t) = v0 + a(t-t0)  
v0 velocità iniziale  
a accelerazione gravitazionale su asse y  
t0 tempo iniziale

*nota: la velocità su y diventa costante quando l'utente disabilita la gravità *

Con queste informazioni facciamo muovere la pallina e definiamo la sua posizione per ogni istante di tempo in cui viene caricato un frame. 

Carattertiche tecniche: urti
-----  
Quando la pallina tocca un bordo invertiamo una delle due componenti della velocità, a seconda che sia un bordo orizzontale o verticale. In questo modo otteniamo l'effetto "rimbalzo".

*Ad esempio se la pallina urta contro l'asse y allora definiamo per la pallina un altro moto con velocità su asse x opposta a quella precedente, mentre quella su y rimante invariata.*

Attraverso questo meccanismo le palline non escono mai dal loro contenitore.

Inoltre, se la gravità è impostata, facciamo perdere un po' di velocità alla componente che si inverte. In questo modo otteniamo rimbalzi sempre meno importanti, fino a vedere la pallina fermarsi.



Carattertiche tecniche: tempo trascorso (t-t0)
----------------------------------------------
Siamo riusciti ad utilizzare solo le formule cinematiche, senza passare dalla dinamica, attraverso un piccolo accorgimento: ogni volta che le condizioni del moto variano, ad esempio quando la pallina urta contro un bordo, portiamo il tempo iniziale al tempo attuale, ovvero azzeriamo (t-t0); in questo modo la pallina è come se iniziasse un altro moto, con diversa velocità iniziale.

Carattertiche tecniche: velocità simulazione
----------------------------------------------
Aggiungendo un fattore moltiplicativo a (t-t0) posso estendere o comprimere l'intervallo di tempo che è passato dall'inizio del moto, ottenendo in questo modo un effetto di accelerazione/decelerazione.
Invece per fermare la simulazione abbiamo utilizzato una variabile booleana che, se settata a false, non esegue la funzione richiamata dal setAnimationFrame ad ogni frame. Quando l'utente riprenderà l'esecuzione sarà necessatio riportare il (t-t0) a zero, usando il trucchetto visto nel punto precedente.

-----
-----



Utilizzo
-----------------------------------------------
Ci sono tre sezioni principali:
1. Modalità creazione
-----------------------------  
E' possibile accedere a questa modalità premendo il tasto 'Q' o attraverso l'apposito menu nella sidebar.  

Permette di scegliere la dimensione e il colore della pallina che si vuole generare. Una preview mostrerà la pallina che verrà creata.  
Per lanciare la pallina posizionarsi nell'area di simulazione, premere il mouse, imprimere un movimento e rilasciare. Maggiore sarà la velocità del mouse e maggiore sarà la velocità iniziale della pallina.

*nota*: la pallina può essere generata allo stesso modo anche nelle altre sezioni. La modalità di creazione serve solo per impostare colore e dimensione della pallina da lanciare

2. Modalità selezione
----------------------

E' possibile accedere a questa modalità premendo il tasto 'E' o attraverso l'apposito menu nella sidebar.

Le palline verranno selezionate in modo sequenziale, in ordine crescente di id, ogni qual volta che si preme il taso 'E'.

Posso visualizzare le caratteristiche in tempo reale di una pallina selezionata:
- id: identificatore pallina
- dimensione: dimensione in px della pallina
- colore: colore in codice esadecimale
- velocità iniziale: velocità iniziale al momento del lancio 
- velocità istantanea: sono le due componenti della velocità sugli assi
- posizione: coordinate (x,y) della pallina considerando come piano cartesiamo l'area di simulazione con origine nel vertice in basso a sinistra

E' possibile eliminare una pallina selezionata cliccando sulla 'X' vicino al suo id, oppure premendo il tasto 'Z'

3. Mostra info simulazione
-------------------------  
E' possibile accedere a questa modalità premendo il tasto 'W' o attraverso l'apposito menu nella sidebar.  

Questa sezione permette di visualizzare alcune caratteristiche della simulazione quali:
- palline generate: numero delle palline lanciate dall'inizio della simulazione
- palline eliminate: il numero di palline eliminate attraverso la Modalità Selezione
- palline correnti: le palline ancora in gioco
- palline fermate: palline che si sono fermate al suolo a causa della forza gravitazionale e la perdita di velocità degli urti
- numero di impatti: il numero di impatti di tutte le palline contro le pareti

-----
-----

Files and project structure
---------------------------

HTML
- /index.html

CSS
- /style/my-normalize.css
- /style/style.css

JS
- /script/generateBall.js

Suoni
- /sound/ball-impact.wav
- /sound/grab.wav
- /sound/gravity.wav
- /sound/launch.wav

Documentazione
- /JSDoc/doc


---
---

Autori
------------------------------------------

Gruppo 7:
- Pietro Cipriani   
- Alessio D'oria  
- Alessandro Incorvaia  
- Marco Scalenghe  

Features consegnate
-------------------
- Gravità
- Urti contro le pareti con dissipazione velocità
- Peso pallina: più è grande e più è difficile lanciarla
- Dimensione e colore pallina modificabili
- Visualizzazione proprietà simulazione
- Visualizzazione proprità pallina
- Selezione pallina e cancellazione
- Shortcut per ogni funzionalità
- Effetti sonori disattivabili
- Velocità simulazione, stop e play


Risorse esterne
-----------------------------------------------------------------------------------------

Effetti sonori  
**fonte**: https://freesound.org/  
**licenza**: Creative Commons 0

Browser testati
---------------------
- Google Chrome v.85  
- IE11  
- FireFox v.81

Licenza e contatti
-------------------------------

Quest'opera è distribuita con Licenza Creative Commons Attribuzione - Non commerciale - Condividi allo stesso modo 4.0 Internazionale.

Pietro Cipriani <pietro.cipriani@edu.itspiemonte.it>  
Alessio D'oria <alessio.doria@edu.itspiemonte.it>  
Alessandro Incorvaia <alessandro.incorvaia@edu.itspiemonte.it>  
Marco Scalenghe <marco.scalenghe@edu.itspiemonte.it>  


Changelog and version history
-----------------------------
v0.1  
Creazione parziale dell'HTML e CSS. Possibilità di creare una preview della pallina.

v0.2  
Implementazione lancio pallina senza gravità ed urti. Script lancio compatibile con IE

v0.3  
Aggiunta degli urti contro le pareti, palline non escono da container, esteso il concetto di classi aggiungendo nuove properietà per migliorare performance. Aggiungere l'overflow hidden perché compaiono le scrollbar

v0.4  
Implementate selezione, cancellazione, visualizzazione proprietà pallina

v0.5  
aggiunta feature pausta/riprendi.

v0.6  
aggiornamento della velocità istantanea

v0.7  
IE non supporta metodo assign per clonazione velocità trovare modo alternativo. Rivisto CSS ed aggiunte shortcut. Aggiunti suoni

v1.0  
quasi completo, mancano icona per mutare suoni, menu sulla sx da aggiustare, markdown e forse dividere lo script, farlo girare su IE

v1.1   
readme e compatibilità con IE. Correzione di un bug che fermava le palline sul bordo superiore

---
---

Performance
---
Le principali feature che abbiamo implementato per ottimizzare le performance sono:

1. Modalità selezione/cancellazione: non abbiamo messo un event listener su ogni pallina generata (per un numero elevato di palline poteva essere un problema), ma le selezioniamo in modo sequenziale, per indice, con un array. L'indice dell'array in cui è memorizzata la pallina corrisponde al suo id.  
Un upgrade futuro potrebbe essere quello di selezionare le palline inserendo in una text input il loro id.
2. Per l'animazione della pallina abbiamo usato il metodo requestAnimationFrame(), ottimizzato per le animazioni, piuttosto che un setInterval()
2. Quando una pallina viene cancellata o si ferma, cancelliamo la sua animazione con cancelAnimationframe(). L'id dell'animazione è una proprietà dell'oggetto ball
3. In modalità selezione usiamo un setInterval() per aggiornare le informazioni della pallina e non mettiamo questa funzionalità dentro la funzione di animazione. Questo perchè non abbiamo bisogno di aggiornare le info al caricamento di ogni frame, sarebbe solo un svantaggio computazionale dal momento he l'occhio umano non percepirebbe alcuna differenza