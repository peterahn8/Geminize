const body = document.getElementsByName("body");
const canvas = document.getElementById("canvas0");
const wordDiv = document.getElementById("wordDiv");
const announcerDiv = document.getElementById("announcerDiv");
const copyBtn = document.getElementById("copyBtn");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");
const drawBtn = document.getElementById("drawBtn");
const eraseBtn = document.getElementById("eraseBtn");
const createRoomBtn = document.getElementById("createRoomBtn");
const startBtn = document.getElementById("startBtn");
// const logDiv = document.getElementById("logDiv");
const lobbyPanel = document.getElementById("lobbyPanel");
const guessesPanel = document.getElementById("guessesPanel");
const guessesContent = document.getElementById("guessesContent");
const playerList = document.getElementById("playerList");
const emptyLobbyMessage = document.getElementById("emptyLobbyMessage");
const inviteCopyTextBox = document.getElementById("inviteCopyTextBox");

let socket;
let globalClear;

// Default settings
let isErasing;
let strokeSize = 12;
let strokeColor = "#000000";

// Brush settings
const colorMap = {
    "blackBtn": "#000000", "redBtn": "#FF0000", "orangeBtn": "#ff9100",
    "yellowBtn": "#fcba03", "greenBtn": "#008000", "blueBtn": "#0000FF",
    "indigoBtn": "#4B0082", "tanBtn": "#fab875", "brownBtn": "#4f2800"
};
const sizeMap = {
    "strokeSmallBtn": 6, "strokeMediumBtn": 12, "strokeLargeBtn": 18
};

// Event listeners and utility functions for buttons
function setupEventListeners() {
    assignStrokeListeners(colorMap, value => strokeColor = value);
    assignStrokeListeners(sizeMap, value => strokeSize = value);

    copyBtn.addEventListener("click", copyToClipboard);

    sendBtn.addEventListener("click", send);
    clearBtn.addEventListener("click", () => globalClear());
    drawBtn.addEventListener("click", () => setDrawingMode(false));
    eraseBtn.addEventListener("click", () => setDrawingMode(true));
    startBtn.addEventListener("click", beginPropagatingCountdown);

    createRoomBtn.addEventListener("click", createNewRoom);
    document.addEventListener("DOMContentLoaded", joinExistingRoom);
}

function assignStrokeListeners(buttonMap, action) {
    Object.entries(buttonMap).forEach(([buttonId, value]) => {
        const button = document.getElementById(buttonId);
        button.addEventListener("click", () => {
            // Remove selected class from all buttons
            Object.keys(buttonMap).forEach(id => {
                document.getElementById(id).classList.remove("selected");
            });
            // Add selected class to clicked button
            button.classList.add("selected");
            action(value);
        });
    });
}

function setDrawingMode(erasing) {
    isErasing = erasing;

    // Remove the "selected" class from both buttons
    drawBtn.classList.remove("selected");
    eraseBtn.classList.remove("selected");

    // Add the "selected" class to the appropriate button
    if (isErasing) {
        eraseBtn.classList.add("selected");
    } else {
        drawBtn.classList.add("selected");
    }
}

function copyToClipboard() {
    inviteCopyTextBox.select();
    navigator.clipboard.writeText(inviteCopyTextBox.value);
}

function generateRoomId() {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let randomString = "";
    for (let i = 0; i < 8; i++) {
        randomString += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return randomString;
}

function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

function showWord(wordStr) {
    sendBtn.disabled = false;
    startBtn.disabled = true;
    wordDiv.innerHTML = wordStr;
    wordDiv.style.visibility = "visible";
}

function updatePlayerList(playerListStr) {
    const playersStrArr = playerListStr.split(",");
    playersStrArr.forEach((player) => {
        const div = document.createElement("div");
        div.innerHTML = `${player}`;
        playerList.appendChild(div);
    });
}

function hideCreateAndStartButtons() {
    createRoomBtn.style.display = "none";
    startBtn.style.display = "none";
}

// p5 stuff
var s1 = sketch => {
    sketch.setup = () => {
        sketch.createCanvas(400, 400, canvas);
        sketch.pixelDensity(1);
        sketch.background(255);
        globalClear = () => {
            sketch.clear();
            sketch.background(255);
        };
    };

    sketch.draw = () => {
        if (isErasing) {
            // sketch.cursor(WAIT)
            sketch.stroke(255);
        } else {
            sketch.stroke(strokeColor);
        }
        sketch.strokeWeight(strokeSize);

        let offsetX = -5;
        let offsetY = -5;

        // Check if left mouse button is pressed
        if (sketch.mouseIsPressed && sketch.mouseButton === sketch.LEFT) {
            sketch.line(sketch.pmouseX + offsetX, sketch.pmouseY + offsetY, sketch.mouseX + offsetX, sketch.mouseY + offsetY);
        }
    };
};

function getCanvas() {
    let w = canvas.width;
    let h = canvas.height;
    let canvasPayload = canvas.getContext("2d").getImageData(0, 0, w, h).data
    return canvasPayload;
}

// Socket emits

function createNewRoom() {
    const roomId = generateRoomId();
    inviteCopyTextBox.value = "localhost:3000/?roomid=" + roomId;
    console.log(`Attempting to join on roomid: "${roomId}" as the leader`);

    createRoomBtn.disabled = true;
    startBtn.disabled = false;

    console.log(`frontend emitting 'join'. Attempting to create room on roomid: "${roomId}" as a leader`);
    socket.emit("join", roomId);
}

function joinExistingRoom() {
    const queryParams = new URLSearchParams(window.location.search);
    const roomId = queryParams.get("roomid");
    if (roomId) {
        hideCreateAndStartButtons();
        inviteCopyTextBox.value = "localhost:3000/?roomid=" + roomId;

        console.log(`frontend emitting 'join'. Attempting to join on roomid: "${roomId}" as a follower`);
        socket.emit("join", roomId);
    }
}

function beginPropagatingCountdown() {
    startBtn.disabled = true;
    socket.emit("countdown");
}

function startCountdown(duration) {
    let timer = duration, seconds;
    let countdownInterval = setInterval(() => {
        seconds = parseInt(timer % 60, 10);
        seconds = seconds < 10 ? "0" + seconds : seconds;

        announcerDiv.innerHTML = "Game starts in: " + seconds;

        if (--timer < 0) {
            clearInterval(countdownInterval);

            // Notify backend that the game is starting
            socket.emit("startGame", "");
            announcerDiv.innerHTML = "Draw this word:";
        }
    }, 1000);
}

function send() {
    let canvasPayload = getCanvas()

    socket.emit("drawing", canvasPayload);
}

function startSocket() {
    // Create WebSocket connection
    socket = io("ws://localhost:3000");

    // Connection opened
    socket.on("connect", (event) => {
        console.log("this client has successfully connected to the server")
    });

    // Listen for messages
    socket.on("message", (event) => {
        console.log("message from server:", event);
        log.innerHTML = log.innerHTML + `<br />${event}`
    });

    // Listen for the AI's guess
    socket.on("guessResponse", (data) => {
        console.log("received AI guess from backend: " + data);
        sendBtn.disabled = false;
    })

    socket.on("updatePlayerList", (data) => {
        console.log("updating player list")

        removeAllChildNodes(playerList);

        updatePlayerList(data);
    })

    socket.on("joinError", () => {
        document.getElementById("overlay").style.display = "block";
        canvas.disabled = true;
    });

    // Listen for when the game is ready to be started
    socket.on("showStartButton", (data) => {
        console.log("show start button message from backend: " + data);

        startBtn.disabled = false;
        createRoomBtn.disabled = true;
    });

    // Listen for the countdown, which is sent to all clients
    socket.on("startClientCountdown", () => {
        wordDiv.style.visibility = "hidden";
        removeAllChildNodes(guessesContent);
        startCountdown(5);
    });

    // Listen for the word to guess
    socket.on("wordToGuess", (data) => {
        globalClear();
        showWord(data);
    });

    socket.on("updateGuessList", (data) => {
        const div = document.createElement("div");
        div.innerHTML = `I think ${data.player}'s drawing is: ${data.guess}`;
        guessesContent.appendChild(div);
    });

    // Listen for game won
    socket.on("gameWon", (data) => {
        console.log("received 'gameWon' from backend")
        sendBtn.disabled = true;
        startBtn.disabled = false;
        console.log(data);
        announcerDiv.innerHTML = "The winner is: " + data;
    })

    socket.on("finalWinner"), (data) => {
        console.log(`the actual winner of the game is: ${data}`);
    }

    // Listen for errors
    socket.on("error", (error) => {
        console.log("server encountered an error:", error);
    });

    // Listen for close
    socket.on("disconnect", (event) => {
        console.log("connection to the server was closed:", event);
    });
}

// init
setupEventListeners();
new p5(s1);
startSocket();