const body = document.getElementsByName("body");
const canvas = document.getElementById("canvas0");
const wordDiv = document.getElementById("wordDiv");
const winnerDiv = document.getElementById("winnerDiv");
const copyBtn = document.getElementById("copyBtn");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");
const drawBtn = document.getElementById("drawBtn");
const eraseBtn = document.getElementById("eraseBtn");
const createRoomBtn = document.getElementById("createRoomBtn");
const startBtn = document.getElementById("startBtn");
const logDiv = document.getElementById("logDiv");
const lobbyDiv = document.getElementById("lobbyDiv");
const inviteCopyTextBox = document.getElementById("inviteCopyTextBox");

let socket;
let globalClear;
let playerlist;

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
    startBtn.addEventListener("click", startGame);

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

// function toggleEraseMode() {
//     isErasing = !isErasing;
//     eraseBtn.textContent = isErasing ? "Draw" : "Erase";
// }

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
    inviteCopyTextBox.value = "localhost:3000/?roomid=" + roomId;
    console.log(`Attempting to join on roomid: "${roomId}" as the leader`);
    
    // TODO: will rework this so i dont have to keep resetting this string
    //       maybe in a separate div
    console.log("resetting the lobbyDiv string");
    lobbyDiv.innerHTML = "Players in the lobby: <br>";

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
        playerlist = data.split(",");
        playerlist.forEach((player) => lobbyDiv.innerHTML += `<br>${player}`);
        startBtn.disabled = false;
    })

    // Listen for the word to guess
    socket.on("showWordToGuess", (data) => {
        createRoomBtn.disabled = true;
        sendBtn.disabled = false;
        startBtn.disabled = true;
        wordDiv.innerHTML = "Draw this word: " + data;
    })

    // Listen for game won
    socket.on("gameWon", (data) => {
        createRoomBtn.disabled = false;
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