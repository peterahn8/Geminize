const body = document.getElementsByName("body");
const canvas = document.getElementById("canvas0");
const clearBtn = document.getElementById("clearBtn");
const eraseBtn = document.getElementById("eraseBtn");
const blackBtn = document.getElementById("blackBtn");
const redBtn = document.getElementById("redBtn");
const orangeBtn = document.getElementById("orangeBtn");
const yellowBtn = document.getElementById("yellowBtn");
const greenBtn = document.getElementById("greenBtn");
const blueBtn = document.getElementById("blueBtn");
const indigoBtn = document.getElementById("indigoBtn");
const violetBtn = document.getElementById("violetBtn");
const strokeSmallBtn = document.getElementById("strokeSmallBtn");
const strokeMediumBtn = document.getElementById("strokeMediumBtn");
const strokeLargeBtn = document.getElementById("strokeLargeBtn");
const log = document.getElementById("log");

const BLACK = '#000000';
const RED = '#FF0000';
const ORANGE = '#FFA500';
const YELLOW = '#FFFF00';
const GREEN = '#008000';
const BLUE = '#0000FF';
const INDIGO = '#4B0082';
const VIOLET = '#8A2BE2';

const strokeSmall = 2;
const strokeMedium = 4;
const strokeLarge = 10;

let globalClear;
let isErasing;
let strokeSize = strokeMedium; // default to medium stroke
let strokeColor = '#000000'; // default to black color

let socket;

clearBtn.addEventListener("click", function() { globalClear() });
eraseBtn.addEventListener("click", function() {
    isErasing = !isErasing;
    if (isErasing) {
        eraseBtn.textContent = "Draw";
    } else {
        eraseBtn.textContent = "Erase";
    }
});

blackBtn.addEventListener("click", function() { strokeColor = BLACK; });
redBtn.addEventListener("click", function() { strokeColor = RED; });
orangeBtn.addEventListener("click", function() { strokeColor = ORANGE; });
yellowBtn.addEventListener("click", function() { strokeColor = YELLOW; });
greenBtn.addEventListener("click", function() { strokeColor = GREEN; });
blueBtn.addEventListener("click", function() { strokeColor = BLUE; });
indigoBtn.addEventListener("click", function() { strokeColor = INDIGO; });
violetBtn.addEventListener("click", function() { strokeColor = VIOLET; });

strokeSmallBtn.addEventListener("click", function() { strokeSize = strokeSmall; });
strokeMediumBtn.addEventListener("click", function() { strokeSize = strokeMedium; });
strokeLargeBtn.addEventListener("click", function() { strokeSize = strokeLarge; });

var s1 = function(sketch) {
    sketch.setup = function() {
        sketch.createCanvas(400, 400, canvas);
        sketch.background(255);
        globalClear = function() { 
            sketch.clear();
            sketch.background(255); 
        };
    }
    sketch.draw = function() {
        if (isErasing) {
            sketch.erase();
            sketch.strokeWeight(strokeSize);
        } else {
            sketch.noErase();
            sketch.stroke(strokeColor);
            sketch.strokeWeight(strokeSize);
        }
        
        if (sketch.mouseIsPressed) {
            sketch.line(sketch.pmouseX, sketch.pmouseY, sketch.mouseX, sketch.mouseY);
        }
    };
};

function send() {
    let canvasPayload = getCanvas()

    console.log("this is gonna send");
    socket.emit("drawing", canvasPayload);
}

function clear() {
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.width);
}

function getCanvas() {
    let w = canvas.width;
    let h = canvas.height;
    let canvasPayload = canvas.getContext("2d").getImageData(0, 0, w, h).data
    return canvasPayload;
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
new p5(s1)
startSocket();