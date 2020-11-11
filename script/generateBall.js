/**
 * @author gruppo7 Backend System Integrator
 * @file Script che crea le palline nell'area di simulazione, definisce le leggi
 * fisiche e le traiettorie percorse dalle palline e permette all'utente di
 * interagire con le diverse modalità.
 * @version 1.4
 */


/*
 ******************************************************************************
 * ID ELEMENTI HTML NEL DOM
 * ****************************************************************************
 */

/*Zona di simulazione*/
const containerBallsDOM = document.getElementById("container-balls");
/*Sidebar laterale*/
const sidebarDOM = document.getElementById("sidebar");
/*Menu laterale delle varie modalità*/
const infoSimulation = document.getElementById("info-simulation");
const selectionMode = document.getElementById("selection-mode");
const creationMode = document.getElementById("creation-mode");
/*Modalità creazione*/
const increaseSizeDOM = document.getElementById("increase-size");
const decreaseSizeDOM = document.getElementById("decrease-size");
const boxPreviewDOM = document.getElementById("image-preview");
const ballPreviewDOM = document.getElementsByClassName("ball center")[0];
const containerInputColorDom = document.getElementById("container-input-color");
const selectColorDOM = document.querySelector("input[type='color']");
const gravityButton = document.getElementById("gravity-on-off"); 
/*Modalità selezione*/
const ballsPropertiesDOM = document.querySelectorAll("#container-ball-properties li span")
const containerBallsPropertiesDOM = document.getElementById("container-ball-properties");
const deleteBallDOM = document.getElementById("delete");
const skipDOM = document.getElementById("skipDOM");
/*Info simulazione*/
const containerSimulationInfoDOM = document.getElementById("container-simulation-info");
const infoSimulationPropertiesDOM = document.querySelectorAll("#container-simulation-info li span");
const totalBallsDOM = infoSimulationPropertiesDOM[0];
const deletedBallDOM = infoSimulationPropertiesDOM[1];
const currentBallsDOM = infoSimulationPropertiesDOM[2];
const stoppedBallsDOM = infoSimulationPropertiesDOM[3];
const numberOfImpactDOM = infoSimulationPropertiesDOM[4];
/*Inizilizzazione*/
for(let i = 0; i < infoSimulationPropertiesDOM.length; i++){
    infoSimulationPropertiesDOM[i].textContent = 0;
}

/*Menu velocità simulazione*/
const startPauseDOM = document.getElementById("simulation-start-pause");
const speedDOM = document.getElementById("speed");
const increaseSimulationSpeedDOM = document.getElementById("increase-simulation-speed");
const decreaseSimulationSpeedDOM = document.getElementById("decrease-simulation-speed");

/*Audio*/
const audioDOM = document.getElementById("audio");

/*led per effetto on/off*/
const leds = document.getElementsByClassName("led");

/*
 ******************************************************************************
 * CONFIGURAZIONE 
 * ****************************************************************************
 */

/*Forza iniziale di lancio*/
const INITIAL_FORCE = 1000;

/*Intervallo per variare velocità simulazione*/
const MAX_SIMULATION_SPEED = 8;
const MIN_SIMULATION_SPEED = -2; 
const STEP_INCREMENT_SIMULATION_SPEED = 1;

/*Perdite di velocità a causa degli urti*/
const PERDITA_VELOCITA_URTO_Y = 0.6;
const PERDITA_VELOCITA_URTO_PARETE_X = 0.8;
const PERDITA_VELOCITA_URTO_SUOLO_X = 0.8;

/*
 ******************************************************************************
 * COSTANTI STILE
 * ****************************************************************************
 */
const COLOR_RED = "rgba(197, 15, 15,1)";
const COLOR_RED_OPAC = "rgba(197, 15, 15,0.5)";
const COLOR_GREEN = "#1eff00";
const COLOR_FUCHSIA = "#da32cc";
const COLOR_GREY = "#2f2f2f";

/*
 ******************************************************************************
 * VARIABILI GLOBALI
 * ****************************************************************************
 */

/*Accelerazione gravitazionale su asse y*/
var gravity = 0;

/*Velocità della simulazione*/
var simulationSpeed = 1;

/*Dimensione e peso pallina da creare*/
var sizeNewBall = parseInt(getComputedStyle(ballPreviewDOM).getPropertyValue("width"));

/*Colore pallina da creare*/
var colorNewBall = COLOR_FUCHSIA;

/*Collezione palline*/
var balls = [];

/*id della nuova pallina da generare*/
var id = 1;

/*Posizione del mouse quando viene cliccato e rilasciato*/
var startPosition;
var endPosition;

/*timestamp click mouse e rilascio*/
var startTime;
var endTime;

/*id della pallina selezionata in modalità selezione*/
var idBallSelected;

/*id dell'intervallo per aggiornare proprietà pallina selezionata*/
var lastIntervalUpdateProperties;

/*animazione ON-OFF*/
var animation = true;

/*audio ON-OFF*/ 
var audio = false;

/*Aggiorno velocità simulazione nel DOM*/
speedDOM.textContent = 1 - simulationSpeed;

/*
 ******************************************************************************
 * FUNZIONI
 * ****************************************************************************
 */

 /**
  * Genera un oggetto pallina e ne stabilisce il moto. Crea quindi un'animazione
  * della pallina generata, definendo al suo interno la funzione di
  * aggiornamento della posizione (updatePosition) che verrà eseguita al
  * caricamento di ogni frame.
  * @param {Object} event evento che scatena la funzione 
  */
var generateNewBall = function(event){

    /*Posizione e tempo finali document.documentElement.scrollTop è la scrollY
    che però non è compatibile con IE*/
    endPosition = new Point(event.clientX, event.clientY + document.documentElement.scrollTop);
    endTime = new Date();

    /*Creazione del vettore velocita*/
    var elapsed = (endTime.getTime() - startTime.getTime());
    var initialSpeed = new VectorSpeed(startPosition, endPosition, elapsed);

    /*Creazione elemento pallina nell'HTML*/
    var newBallHtml = document.createElement("div");
    newBallHtml.classList.add("ball");
    containerBallsDOM.appendChild(newBallHtml);

    /*Calcolo coordinate pallina = posizione mouse*/
    var mousePosition = new Point(
        (endPosition.x - sizeNewBall/2 - sidebarDOM.offsetWidth),
        (containerBallsDOM.offsetHeight - endPosition.y - sizeNewBall/2)
    );

    /* Creo l'oggetto pallina e lo memorizzo in balls*/
    var newBall = new Ball(id, sizeNewBall, colorNewBall, initialSpeed, mousePosition, newBallHtml);
    id++;
    balls.push(newBall);

    /*Mouse icona mano aperta per rilascio*/
    containerBallsDOM.style.cursor = "grab";

    /*Aggiorno info simulation*/
    totalBallsDOM.textContent = parseInt(totalBallsDOM.textContent) + 1;
    currentBallsDOM.textContent = parseInt(currentBallsDOM.textContent) + 1;

    /*Audio lancio pallina solo se viene lanciata*/
    if(newBall.speed.intensity != 0 && audio && animation)
        new Audio("sound/launch.mp3").play();

    /**
     * Funzione che anima la pallina. Utilizza le forumule cinematiche della
     * poszione e velocità in funzione del tempo. Rileva quando una pallina
     * tocca un bordo e ne inverte il moto.
     * @param {Number} timestamp timestamp di esecuzione del frame corrente
     */
    function updatePosition(timestamp) {
        
        if(!animation){
            window.requestAnimationFrame(updatePosition);
            newBall.timeStampBirth = undefined;
            return 0;
        }

        //memorizzo data di creazione nell'oggetto pallina
        if (newBall.timeStampBirth === undefined){
            newBall.timeStampBirth = timestamp;
        }

        //tempo trascorso dalla creazione pallina in secondi
        var elapsed = ((timestamp - newBall.timeStampBirth) +1)/1000 / Math.pow(2,simulationSpeed);

        /*Calcolo le nuove velocità  v(t) = vo + at*/
        newSpeedX = newBall.initialSpeed.speedX;
        newSpeedY = newBall.initialSpeed.speedY + gravity * elapsed;


        /*Fermo la pallina se ha toccato y e se la vecchia velocità è simile a quella nuova*/
        if( gravity!=0 
            && Math.abs(newSpeedY - newBall.speed.speedY) < 1 
            && Math.abs(newSpeedX - newBall.speed.speedX) < 1 
            && newBall.position.y == 0){
                cancelAnimationFrame(newBall.idAnimation);
                newBall.speed.speedX = 0;
                newBall.speed.speedY = 0;
                /*Aggiorno numero di palline fermate*/
                stoppedBallsDOM.textContent = parseInt(stoppedBallsDOM.textContent) + 1;
                return;
        }

        /*Aggiorno la velocità della pallina*/
        newBall.speed.speedX = newSpeedX;
        newBall.speed.speedY = newSpeedY;

        /*COLLISIONE CON PARETI ORIZZONTALI: inverto la velocità su asse y*/
        if((newBall.position.y <= 0) || 
           (newBall.position.y >= (containerBallsDOM.offsetHeight - newBall.size))){  
            
            /*Se la gravità è settata ho una perdita di velocità dovuta all'urto*/
            if(gravity != 0){
                newBall.speed.speedY *= (PERDITA_VELOCITA_URTO_Y);
                newBall.speed.speedX *= (PERDITA_VELOCITA_URTO_SUOLO_X);
            }
   
            /*inverto direzione della velocità su y*/
            newBall.speed.speedY = -(newBall.speed.speedY);

            /*Azzero le velocità al di sotto di una soglia minima per far
            fermare la pallina al suolo, altrimenti i decrementi sarebbero infinitesimi e
            la pallina non si fermerebbe mai*/
            if(Math.abs(newBall.speed.speedX) <= 1 && newBall.position.y <= 0) newBall.speed.speedX = 0;
            if(Math.abs(newBall.speed.speedY) <= 1 && newBall.position.y <= 0) newBall.speed.speedY = 0;

            /*Aggiorno la velocità iniziale della pallina*/
            newBall.initialSpeed.speedY = newBall.speed.speedY;
            newBall.initialSpeed.speedX = newBall.speed.speedX;

            /*Modifico il tempo iniziale del moto: -250 per rendere l'animazione
            più fluida, infatti partirò da un elapsed maggiore al prossimo
            frame*/
            newBall.timeStampBirth = timestamp - 250;

            /*Incremento numero di impatti*/
            numberOfImpactDOM.textContent = parseInt(numberOfImpactDOM.textContent) + 1;
            
            /*Riproduco suono impatto pallina*/ 
            if(audio && (newBall.speed.speedY != 0 || newBall.initialSpeed.speedY == 0))
            { 
                new Audio("sound/ball-impact.mp3").play();
            }

        }

        /*COLLISIONE CON PARETI VERTICALI: inverto la velocità su asse x*/

        if((newBall.position.x <= 0) || 
        (newBall.position.x >= containerBallsDOM.offsetWidth - newBall.size)
        ){

            /*inverto direzione della velocità*/
            newBall.speed.speedX = -(newBall.speed.speedX);
           
            /*Se la gravità è settata ho una perdita di velocità dovuta all'urto*/
            if(gravity != 0){
                newBall.speed.speedY *= (PERDITA_VELOCITA_URTO_Y);
                newBall.speed.speedX *= (PERDITA_VELOCITA_URTO_PARETE_X);
            }
            
            /*Aggiorno la velocità iniziale della pallina*/
            newBall.initialSpeed.speedY = newBall.speed.speedY;
            newBall.initialSpeed.speedX = newBall.speed.speedX;

            /*Modifico il tempo iniziale del moto: -250 per rendere l'animazione
            più fluida, infatti partirò da un elapsed maggiore al prossimo
            frame*/
            newBall.timeStampBirth = timestamp - 250;

            /*Riproduco suono impatto pallina*/
            if(audio) new Audio("sound/ball-impact.mp3").play();

            /*Incremento numero di impatti*/
            numberOfImpactDOM.textContent = parseInt(numberOfImpactDOM.textContent) + 1; 
        }
        
        /*
        *Aggiorno la posizione su asse y con forumula moto rettilineo uniformemente accelerato
        * y = y0 + vo(t-to) + 0.5(accelerazione * (t-to)^2)
        */
        var newPositionY = ((newBall.position.y)) + (newBall.initialSpeed.speedY * (elapsed)) +  0.5 * (gravity * Math.pow(elapsed,2));
        
        /*la pallina NON deve uscire dal container*/
        if(newPositionY < 0){
            newPositionY = 0;
            newBall.timeStampBirth = timestamp;                
        }
        else if(newPositionY > containerBallsDOM.offsetHeight - newBall.size){
            newPositionY = containerBallsDOM.offsetHeight - newBall.size;
            newBall.timeStampBirth = timestamp;
        }
    
        /*Aggiorno la posizione su asse x con forumula moto rettilineo uniforme (no gravita')
        x = x0 + vo(t-t0)
        */
        var newPositionX = (newBall.position.x) + (newBall.initialSpeed.speedX * (elapsed));

        /*la pallina NON deve uscire dal container*/
        if(newPositionX < 0)
            newPositionX = 0;
        else if(newPositionX > containerBallsDOM.offsetWidth - newBall.size)
            newPositionX = containerBallsDOM.offsetWidth - newBall.size;

        /*Se la posizione precedente è simile a quella nuova e la pallina è sul suolo allora la fermo*/
        if( gravity!=0 
            && Math.abs(newBall.position.x-newPositionX) <= 0.1
            && Math.abs(newBall.position.y-newPositionY) <= 0.1
            &&newBall.position.y == 0){
            window.cancelAnimationFrame(newBall.idAnimation);
            newBall.speed.speedX = 0;
            newBall.speed.speedY = 0;
            /*Aggiorno numero di palline fermate*/
            stoppedBallsDOM.textContent = parseInt(stoppedBallsDOM.textContent) + 1;
            return 0;
        }

        /*aggiorno la posizione della pallina*/
        newBall.setPosition(new Point(newPositionX, newPositionY));

        /*lancio la nuova richiesta di animazione e memorizzo l'id nell'oggetto pallina*/
        newBall.idAnimation = window.requestAnimationFrame(updatePosition);
    }

    window.requestAnimationFrame(updatePosition);
}

/**
 * Memorizza nella variabile globale colorNewBall il colore della pallina da generare
 */
var changeColor = function(){
    if(trident > 0) //se sono su IE
        colorNewBall = getComputedStyle(this).getPropertyValue("background-color");
    else
        colorNewBall = selectColorDOM.value;
    updateCSS(boxPreviewDOM.firstElementChild);
}

/**
 * Aumenta la grandezza della pallina da generare e aggiorna la preview
 */
function increaseSize(){
    if(sizeNewBall<boxPreviewDOM.offsetWidth){
        sizeNewBall += 10;
        updateCSS(boxPreviewDOM.firstElementChild);
    }
}

/**
 * Diminuisce la grandezza della pallina da generare e aggiorna la preview
 */
function decreaseSize(){
    if(sizeNewBall > 10){ 
        sizeNewBall -= 10;
        updateCSS(boxPreviewDOM.firstElementChild);
    }
}

/**
 * Aggiorna il CSS della preview della pallina (colore e dimensione)
 * @param {Object} newBallHtml riferimento dell'oggetto nel DOM
 */
function updateCSS(newBallHtml){
    newBallHtml.style.width = sizeNewBall + "px";
    newBallHtml.style.height = sizeNewBall + "px";
    newBallHtml.style.backgroundColor = colorNewBall;
}

/**
 * Prende le coordinate del mouse e le memorizza nella variabile globale
 * startPosition. Questa posizione serve per calcolare la velocità iniziale
 * della pallina
 * @param {Object} event evento che richiama la funzione 
 */
var getStartPosition = function(event){
    startPosition = new Point(event.clientX, event.clientY + document.documentElement.scrollTop);
    startTime = new Date();

    /*Mouse icona mano chiusa*/
    containerBallsDOM.style.cursor = "grabbing";

    /*Audio presa pallina*/
    if(audio) new Audio("sound/grab.mp3").play();
}


/**
 * Accede alla MODALITA' SELEZIONE: seleziona progressivamente le palline,
 * scorrendo l'array e usando come indice la variabile globale idBallSelected.
 * Modifica lo stile della pallina selezionata ed inoltre definisce un
 * intervallo per aggiornare la visualizzazione delle proprietà della pallina
 */
function showSelectionMode(){

    /*Entro nella selezione solo se ci sono delle palline in balls*/
    if(balls.length == 0){
        generateMesssage("Prima crea una pallina!");
        return;
    }

    /*deseleziono altri pulsanti menu*/
    resetMenuStyle();

    /*Seleziono menu modalità selezione*/
    selectionMode.style.backgroundColor = COLOR_GREEN;
    if(idBallSelected != undefined){
    
        /*resetto stile pallina selezionata precedentemente*/    
        balls[idBallSelected].ballHTML.style.removeProperty("box-shadow")
        balls[idBallSelected].ballHTML.style.removeProperty("border");

        /*Incremento idBallSelected e lo riporto a zero all'ultima selzione*/
        idBallSelected+=1;
        if(idBallSelected == balls.length)
            idBallSelected = 0;

        /*Elimino l'ultimo intervallo che aggiorna le proprietà*/
        clearInterval(lastIntervalUpdateProperties);
    }

    else{ //prima selezione
        idBallSelected = 0;
    }

    /*Evidenzio la pallina selezionata con il CSS*/
    balls[idBallSelected].ballHTML.style.boxShadow = "0 0 0 20px hsl(360 , 100%, 90%)";
    balls[idBallSelected].ballHTML.style.border = "1px solid red";

    /*Nascondo info simulazione*/
    infoSimulation.removeAttribute("style");
    containerSimulationInfoDOM.style.display = "none";

    /*Rendo visibile Modalità simulazione*/
    containerBallsPropertiesDOM.style.display = "block";
    selectionMode.style.backgroundColor = COLOR_GREEN;

    /*Aggiorna proprietà della pallina nell'HTML Uso setInterval
    e non metto aggiornamento nell'animazione per un discorso di performance
    (meno chiamate a function)*/
    lastIntervalUpdateProperties = setInterval(function(){
        ballsPropertiesDOM[0].textContent = balls[idBallSelected].id;
        ballsPropertiesDOM[2].textContent = balls[idBallSelected].size + "px";
        ballsPropertiesDOM[3].textContent = balls[idBallSelected].color;
        ballsPropertiesDOM[4].textContent = balls[idBallSelected].initialSpeed.toString();
        ballsPropertiesDOM[5].textContent = balls[idBallSelected].speed.speedX.toFixed(2) + "," + balls[idBallSelected].speed.speedY.toFixed(2);
        ballsPropertiesDOM[6].textContent = balls[idBallSelected].position.toString();    
    },100);
}

/**
 * Cancella la pallina selezionata (in posizione idBallSelected) sia nell'array che nel DOM
 */
function deleteBall(){
    
    /*devo aver selezionato una pallina*/
    if(idBallSelected !== undefined){
        
        /*Rimuovo la pallina dal DOM*/
        containerBallsDOM.removeChild(balls[idBallSelected].ballHTML);

        /*Rimuovo intervallo per aggiornare le proprietà della pallina*/
        clearInterval(lastIntervalUpdateProperties);

        /*Rimuovo animazione della pallina*/
        window.cancelAnimationFrame(balls[idBallSelected].idAnimation);
      
        /*Messaggio di avvenuta cancellazione*/
        generateMesssage("Pallina " + balls[idBallSelected].id + " eliminata!" );

        /*Rimuovo pallina dall'array balls*/
        balls.splice(idBallSelected, 1);

        /*Resetto idBallSelected*/
        idBallSelected = undefined;

        /*Rendo invisibile tab proprietà oggetto selezionato*/
        containerBallsPropertiesDOM.style.display = "none";

        /*Aggiorno info simulazione*/
        currentBallsDOM.textContent = parseInt(currentBallsDOM.textContent) - 1;
        deletedBallDOM.textContent = parseInt(deletedBallDOM.textContent) + 1;

        /*Deseleziono menu di selezione e seleziono quello di creazione*/
        selectionMode.removeAttribute("style");
        creationMode.style.backgroundColor = COLOR_GREY;


    }

}

/**
 * Esce dalla modalità selezione
 */
function cancelSelectionMode(){
    /*se ho una pallina selezionata*/
    if(idBallSelected !== undefined){

        /*Rimuovo intervallo per aggiornare le proprietà della pallina*/
        clearInterval(lastIntervalUpdateProperties);

        /*Resetto stile pallina*/
        balls[idBallSelected].ballHTML.style.removeProperty("box-shadow")
        balls[idBallSelected].ballHTML.style.removeProperty("border");

        /*Resetto idBallSelected*/
        idBallSelected = undefined;

        /*Rendo invisibile tab proprietà oggetto selezionato*/
        containerBallsPropertiesDOM.style.display = "none";
        
    }
}

/**
 * Stampa un messaggio a schermo che svanisce dopo 1 secondo
 * @param {String} message Contenuto del messaggio  
 */
function generateMesssage(message){
    /*genero messaggio di messageDOMe*/
    var messageDOM = document.createElement("p");
    messageDOM.textContent = message;
    messageDOM.classList.add("message");
    containerBallsDOM.appendChild(messageDOM);
    /*elimino messaggio dopo 1 secondi*/
    setTimeout(function(){
        containerBallsDOM.removeChild(messageDOM);
    },1000);
}

/**
 * Inserisce o toglie la gravità
 */
function gravityOnOff(){
    
    if(gravity){
        gravity = 0;
        gravityButton.style.backgroundColor = COLOR_RED_OPAC;
        leds[0].style.backgroundColor = COLOR_RED;
        /*Messaggio di conferma*/
        generateMesssage("Gravità OFF");
    }
    else{
        gravity = -100;
        gravityButton.style.backgroundColor = COLOR_RED;
        leds[0].style.backgroundColor = COLOR_GREEN;
        /*Messaggio di conferma*/
        generateMesssage("Gravità ON");
    }
     /*Se imposto la gravità devo resettare il timestamp di nascita di ogni
     pallina, il tempo trascorso nell'equazione del moto si deve azzerare*/
     balls.forEach(function(elem){       
         elem.timeStampBirth = undefined;
    });

    /*Riproduco suono gravita*/
    if(audio) new Audio("sound/gravity.mp3").play();

}

/**
 * Visualizza info simulazione
 */
function showInfoSimulation(){

    /*esco dalla modalità selezione*/
    cancelSelectionMode();

    /*deseleziono pulsanti menu*/
    resetMenuStyle();
    
    /*Rendo visibile info simulazione*/
    containerSimulationInfoDOM.style.display = "block";
    infoSimulation.style.backgroundColor = COLOR_GREEN;
    
}


/**
 * Visuallizza la Modalità di creazione
 */
function showCreationMode(){
    /*resetto stile dei pulsanti del menu*/
    resetMenuStyle();

    /*esco dalla modalità selezione*/
    cancelSelectionMode();

    /*evidenzio pulsante modalità creazione*/
    creationMode.style.backgroundColor = COLOR_GREEN;
}

/**
 * Resetta lo stile del menu della slidebar
 */
function resetMenuStyle(){

    /*deseleziono modalità creazione*/
    creationMode.style.backgroundColor = COLOR_GREY;

    /*deseleziono info simulazione*/
    infoSimulation.removeAttribute("style");
    containerSimulationInfoDOM.removeAttribute("style");

    /*deseleziono Modalità selezione*/
    selectionMode.removeAttribute("style");
    containerBallsPropertiesDOM.removeAttribute("style");

}

/**
 * Mette la variabile animation a true per ripendere l'animazione, questa
 * variabile è utilizzata nella funzione generateNewBall() per eseguire o meno
 * l'animazione della pallina
 */
function startStopSimulation(){
    
    if(animation){
        animation = false;
        generateMesssage("Simulazione in pausa");
        
        /*aggiorno led*/
        leds[1].style.backgroundColor = COLOR_RED;
    }
    else{
        animation = true;
        generateMesssage("Ripresa simulazione"); 
     
        /*aggiorno led*/
        leds[1].style.backgroundColor = COLOR_GREEN;
    }
}

/**
 * Aumenta la velocità della simulazione modificando la variabile globale
 * simulationSpeed, questa variabile verrà usata dalla funzione updatePosition,
 * all'interno di generateNewBall 
 */
function increaseSimulationSpeed(){
    if(simulationSpeed > MIN_SIMULATION_SPEED)
    simulationSpeed -= STEP_INCREMENT_SIMULATION_SPEED;
    /*aggiorno velocità simulazione nell'HTML*/
    document.getElementById("speed").textContent = 1 - simulationSpeed;
}

/**
 * Diminuisce la velocità della simulazione modificando la variabile globale
 * simulationSpeed, questa variabile verrà usata dalla funzione updatePosition,
 * all'interno di generateNewBall 
 */
function decreaseSimulationSpeed(){
    if(simulationSpeed < MAX_SIMULATION_SPEED)
    simulationSpeed += STEP_INCREMENT_SIMULATION_SPEED;
    /*aggiorno velcità simulazione nell'HTML*/
    document.getElementById("speed").textContent = 1 - simulationSpeed;
}

/**
 * Attiva o disattiva l'audio
 */
function audioOnOff(){
    if(audio){
        audio = false;
        audioDOM.textContent = "🔈";
        generateMesssage("Audio OFF");
    }
    else{
        audio = true;
        audioDOM.textContent = "🔊";
        generateMesssage("Audio ON");
    }
}

/*
 ******************************************************************************
 * COMPATIBILITA' IE
 * ****************************************************************************
 */

/*color input for IE*/
var ua = window.navigator.userAgent;
var trident = ua.indexOf('Trident/');
//se sono su IE11
if (trident > 0) {
    
    /*elimino color input non supportato in IE*/
    containerInputColorDom.removeChild(selectColorDOM);

    /*genero i colori e li aggancio al container input color*/ 
    var color1 = document.createElement("div");
    color1.classList.add("color-IE");
    
    var color2 = document.createElement("div");
    color2.classList.add("color-IE");

    var color3 = document.createElement("div");
    color3.classList.add("color-IE");

    var color4 = document.createElement("div");
    color4.classList.add("color-IE");

    var color5 = document.createElement("div");
    color5.classList.add("color-IE");

    var colors = [color1,color2,color3,color4,color5];

    /*appendo al container*/
    colors.forEach(function(e){
        containerInputColorDom.appendChild(e);
    });

    /*imposto gli eventi listener*/
    colors.forEach(function(e){
        e.addEventListener("click", changeColor);
    });
    
}

/*
 ******************************************************************************
 * CLASSI IN ES5
 * ****************************************************************************
 */


/**
 * Pallina che viene generata dall'utente
 * @constructor
 * @param {Number} id codice identificativo della pallina
 * @param {Number} size dimensioni in px della pallina
 * @param {String} color colore della pallina in esadecimale
 * @param {Object} initialSpeed velocità iniziale, è un oggetto di tipo VectorSpeed
 * @param {Object}  position oggetto di tipo Point che indica la posizione del punto in un determinato istante
 * @param {Object} ballHTML riferimento della pallina del DOM
 */
function Ball(id, size, color, initialSpeed, position, ballHTML){
    this.id = id;
    this.size = size;
    this.color = color;
    this.initialSpeed = initialSpeed;
    /*controllo che la posizione di spawn non esca dal container, se si correggo
    per portare la pallina dentro*/
    if(position.x < 0)
        position.x = 1;
    if(position.x > containerBallsDOM.offsetWidth - size)
        position.x = containerBallsDOM.offsetWidth - size -1;
    if(position.y < 0)
        position.y = 1;
    if(position.y > containerBallsDOM.offsetHeight - size)
        position.y = containerBallsDOM.offsetHeight - size -1;
    /**
     * Posizione della pallina, oggetto Point
     * @param {Object} position
     */
    this.position = position;
    this.ballHTML = ballHTML;

    /*clonazione di initialSpeed: la faccio manualmente perchè assign non è
    compatibile con IE*/

    /**
     * velocità ad un determinato istante, alla creazione sarà uguale a quella
     * iniziale, è un oggetto VectorSpeed
     * @param {Object} speed 
     */
    this.speed = new VectorSpeed(initialSpeed.p1, initialSpeed.p2, initialSpeed.elapsed)
    
    /**
     * timestamp creazione pallina
     * @param {Number} timeStampBirth 
     */
    this.timeStampBirth;

    /**
     * id animazione della pallina
     * @param {Number} idAnimation 
     */    
    this.idAnimation;
    
    /*imposto lo stile della pallina*/
    this.ballHTML.style.width = sizeNewBall + "px";
    this.ballHTML.style.height = sizeNewBall + "px";
    this.ballHTML.style.backgroundColor = colorNewBall;
    this.ballHTML.style.left = position.x + "px";
    this.ballHTML.style.bottom = position.y + "px";

    /**
     * Setta la posizione della pallina a newPosition ed aggiorna la posizione
     * della pallina nel CSS
     * @param {Object} newPosition nuova posizione della pallina di tipo Point 
     */
    this.setPosition = function(newPosition){
        this.position = newPosition;
        
        /*aggiorno CSS*/
        this.ballHTML.style.left = this.position.x + "px";
        this.ballHTML.style.bottom = this.position.y + "px";
    } 
}

/**
 * Punto nello spazio
 * @constructor
 * @param {Number} x coordinata x del punto
 * @param {Number} y coodinata y del punto
 */
function Point(x, y){
    this.x = x;
    this.y = y;
}

/**
 * Stampa le coordinate del punto
 */
Point.prototype.toString = function() {
    return "(" + this.x.toFixed() + "," + this.y.toFixed() + ")";
}

/**
 * Vettore velocità con modulo, direzione e verso
 * @constructor
 * @param {Object} p1 Punto iniziale per calcolo della velocità iniziale, oggetto Point 
 * @param {Object} p2 Punto finale per calcolo della velocità finale, oggetto Point 
 * @param {Object} elapsed Tempo trascorso da mouse down a mouse up in ms 
 */
function VectorSpeed(p1, p2, elapsed){
    this.p1 = p1;
    this.p2 = p2;
    this.elapsed = elapsed;


    let distance = Math.sqrt(Math.pow(this.p1.x - this.p2.x, 2) + Math.pow(this.p1.y - this.p2.y, 2));

    /**
     * Modulo della velocita (spazio / tempo) tenendo conto della velocita del
     * mouse e del peso della pallina
     * @param {Number} intensity 
     */
    this.intensity = (distance/this.elapsed) * INITIAL_FORCE / (sizeNewBall);
    
    /**
     * Angolo in radianti
     * @param {Number} angle 
     */
    this.angle  = -Math.atan2(this.p2.y - this.p1.y, this.p2.x - this.p1.x);

    /**
     * Componente della velocità su asse y
     * @param {Number} speedY
     */
    this.speedY = this.intensity * Math.sin(this.angle);
    
    /**
     * Componente della velocità su asse x
     * @param {Number} speedX
     */
    this.speedX = this.intensity * Math.cos(this.angle);

}

/**
 * Stampa le componenti del vettore sugli assi
 */
VectorSpeed.prototype.toString = function() {
    return (this.intensity).toFixed(2);
}


/*
 ******************************************************************************
 * EVENT LISTENER
 * ****************************************************************************
 */


containerBallsDOM.addEventListener("mousedown", getStartPosition);
containerBallsDOM.addEventListener("mouseup", generateNewBall);
increaseSizeDOM.addEventListener("click", increaseSize);
decreaseSizeDOM.addEventListener("click", decreaseSize);
selectColorDOM.addEventListener("change", changeColor);
gravityButton.addEventListener("click", gravityOnOff);
selectionMode.addEventListener("click", showSelectionMode);
deleteBallDOM.addEventListener("click", deleteBall);
infoSimulation.addEventListener("click", showInfoSimulation);
creationMode.addEventListener("click", showCreationMode);
startPauseDOM.addEventListener("click", startStopSimulation);
increaseSimulationSpeedDOM.addEventListener("click", increaseSimulationSpeed);
decreaseSimulationSpeedDOM.addEventListener("click", decreaseSimulationSpeed);
audioDOM.addEventListener("click", audioOnOff);
document.addEventListener("keydown", function(event){
    
    /*Shortcut per IE, utilizza event.keyCode che è deprecato */
    if(trident > 0){
        switch (event.keyCode) {
            case 81: //q
                showInfoSimulation();
                break;
            case 87: //w
                showCreationMode();
                break;
            case 69: //e
                showSelectionMode();
                break;
            case 37: //freccia sinistra
                decreaseSimulationSpeed();
                break;
            case 39: //freccia destra
                increaseSimulationSpeed();
                break;
            case 32: //spazio
                /*Disabilita scroll automatico premendo barra spaziatrice*/
                event.preventDefault();
                startStopSimulation();
                break;
            case 80: //p
                audioOnOff();
                break;
            case 83: //s
                increaseSize();
                break;
            case 65: //a
                decreaseSize();
                break;
            case 71: //g
                gravityOnOff();
                break;
            case 90: //z
                deleteBall();
                break;
            default:
                break;
        }
    }
    else{ //altri browser

        switch (event.key) {
            case "q":
                showInfoSimulation();
                break;
            case "w":
                showCreationMode();
                break;
            case "e":
                showSelectionMode();
                break;
            case "ArrowLeft":
                decreaseSimulationSpeed();
                break;
            case "ArrowRight":
                increaseSimulationSpeed();
                break;
            case " ": //spazio
                /*Disabilita scroll automatico premendo barra spaziatrice*/
                event.preventDefault();
                startStopSimulation();
                break;
            case "p":
                audioOnOff();
                break;
            case "s":
                increaseSize();
                break;
            case "a":
                decreaseSize();
                break;
            case "g":
                gravityOnOff();
                break;
            case "z":
                deleteBall();
                break;
            default:
                break;
        }
    }
});
