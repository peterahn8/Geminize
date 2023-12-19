const body = document.getElementsByName("body");
const canvas = document.getElementById("canvas0");
const clearBtn = document.getElementById("clearBtn");
const eraseBtn = document.getElementById("eraseBtn");
const createRoomBtn = document.getElementById("createRoomBtn");
const log = document.getElementById("log");
const inviteDiv = document.getElementById("inviteDiv");

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

    clearBtn.addEventListener("click", () => globalClear());
    eraseBtn.addEventListener("click", toggleEraseMode);

    createRoomBtn.addEventListener("click", createNewRoom);
    document.addEventListener("DOMContentLoaded", joinExistingRoom);
}

function assignBrushSettings(buttonMap, action) {
    Object.entries(buttonMap).forEach(([buttonId, value]) => {
        const button = document.getElementById(buttonId);
        button.addEventListener("click", () => action(value));
    });
}

function toggleEraseMode() {
    isErasing = !isErasing;
    eraseBtn.textContent = isErasing ? "Draw" : "Erase";
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
    inviteDiv.innerHTML = "room id: " + roomId;
    console.log("Generating a random 'roomId': " + roomId);
    socket.emit("join", roomId);
}

function joinExistingRoom() {
    const queryParams = new URLSearchParams(window.location.search);
    const roomId = queryParams.get("roomId");
    if (roomId) {
        console.log("Attempting to join on roomId: ", roomId);
        socket.emit("join", roomId);
        createRoomBtn.style.display = "none";
    }
}

// p5 stuff
var s1 = sketch => {
    sketch.setup = () => {
        sketch.createCanvas(400, 400, canvas);
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

    sendBtn.disabled = true;
    sendBtn.innerHTML = "waiting..."
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

    socket.on("guessResponse", (data) => {
        console.log("received AI guess from backend: " + data);
        sendBtn.disabled = false;
        sendBtn.innerHTML = "Send";
    })

    socket.on("showStartButton", (data) => {
        console.log("show start button message from backend: " + data);
        
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