const body = document.getElementsByName("body");
const canvas = document.getElementById("canvas0");
const clearBtn = document.getElementById("clearBtn");
const eraseBtn = document.getElementById("eraseBtn");
const strokePicker = document.getElementById('strokePicker');
const colorPicker = document.getElementById('colorPicker');
const log = document.getElementById("log");

let globalClear;
let isErasing;
let strokeSize = 4;
let strokeColor = '#000000'; // default to black

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
strokePicker.addEventListener('input', function() {
    strokeSize = this.value;
});
colorPicker.addEventListener('input', function() {
    strokeColor = this.value;
});

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