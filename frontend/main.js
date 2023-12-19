const body = document.getElementsByName("body");
const canvas = document.getElementById("canvas0");
const wordDiv = document.getElementById("wordDiv");
const winnerDiv = document.getElementById("winnerDiv");
const copyBtn = document.getElementById("copyBtn");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");
const eraseBtn = document.getElementById("eraseBtn");
const createRoomBtn = document.getElementById("createRoomBtn");
const startBtn = document.getElementById("startBtn");
const log = document.getElementById("log");
const inviteTxtBox = document.getElementById("inviteTxtBox");

let socket;
let globalClear;

// Default settings
let isErasing;
let strokeSize = 4;
let strokeColor = "#000000";

// Brush settings
const colorMap = {
    "blackBtn": "#000000", "redBtn": "#FF0000", "orangeBtn": "#FFA500",
    "yellowBtn": "#FFFF00", "greenBtn": "#008000", "blueBtn": "#0000FF",
    "indigoBtn": "#4B0082", "violetBtn": "#8A2BE2", "brownBtn": "#A52A2A"
};
const sizeMap = {
    "strokeSmallBtn": 2, "strokeMediumBtn": 4, "strokeLargeBtn": 10
};

// Event listeners and utility functions for buttons
function setupEventListeners() {
    assignBrushSettings(colorMap, value => strokeColor = value);
    assignBrushSettings(sizeMap, value => strokeSize = value);

    copyBtn.addEventListener("click", copyToClipboard);

    sendBtn.addEventListener("click", send);
    clearBtn.addEventListener("click", () => globalClear());
    eraseBtn.addEventListener("click", toggleEraseMode);
    startBtn.addEventListener("click", startGame);

    createRoomBtn.addEventListener("click", createNewRoom);
    document.addEventListener("DOMContentLoaded", joinExistingRoom);
}

function assignBrushSettings(buttonMap, action) {
    Object.entries(buttonMap).forEach(([buttonId, value]) => {
        const button = document.getElementById(buttonId);
        button.addEventListener("click", () => action(value));
    });
}

function copyToClipboard() {
    inviteTxtBox.select();
    navigator.clipboard.writeText(inviteTxtBox.value);
}

function toggleEraseMode() {
    isErasing = !isErasing;
    eraseBtn.textContent = isErasing ? "Draw" : "Erase";
}

function startGame() {
    globalClear();
    socket.emit("start", "");
}

function generateRoomId() {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let randomString = "";
    for (let i = 0; i < 8; i++) {
        randomString += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return randomString;
}

function createNewRoom() {
    const roomId = generateRoomId();
    inviteTxtBox.value = "localhost:3000/?roomid=" + roomId;
    console.log(`Attempting to join on roomid: "${roomId}" as the leader`);
    socket.emit("join", roomId);
}

function joinExistingRoom() {
    const queryParams = new URLSearchParams(window.location.search);
    const roomId = queryParams.get("roomid");
    if (roomId) {
        console.log(`Attempting to join on roomid: "${roomId}" as a follower`);
        socket.emit("join", roomId);
        createRoomBtn.style.display = "none";
    }
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
            sketch.erase();
        } else {
            sketch.noErase();
            sketch.stroke(strokeColor);
        }
        sketch.strokeWeight(strokeSize);

        if (sketch.mouseIsPressed) {
            sketch.line(sketch.pmouseX, sketch.pmouseY, sketch.mouseX, sketch.mouseY);
        }
    };
};

function getCanvas() {
    let w = canvas.width;
    let h = canvas.height;
    let canvasPayload = canvas.getContext("2d").getImageData(0, 0, w, h).data
    return canvasPayload;
}

function send() {
    let canvasPayload = getCanvas()

    console.log("this is gonna send");
    socket.emit("drawing", canvasPayload);

    // TODO: Maybe don't disable the send button on sends, let the user send as
    // many times as they want and figure out a way to make it all play nice on
    // the backend.  Maybe a queue system?
    // sendBtn.disabled = true;
    // sendBtn.innerHTML = "waiting..."
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
        sendBtn.innerHTML = "Send";
    })

    // Listen for when the game is ready to be started
    socket.on("showStartButton", (data) => {
        console.log("show start button message from backend: " + data);
        startBtn.disabled = false;
    })

    // Listen for the word to guess
    socket.on("showWordToGuess", (data) => {
        sendBtn.disabled = false;
        startBtn.disabled = true;
        wordDiv.innerHTML = "Draw this word: " + data;
    })

    // Listen for game won
    socket.on("gameWon", (data) => {
        sendBtn.disabled = true;
        startBtn.disabled = false;
        winnerDiv.innerHTML = "The winner is: " + data;
    })

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