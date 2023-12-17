const body = document.getElementsByName("body");
const canvas = document.getElementById("canvas0");
const clearBtn = document.getElementById("clearBtn");
const log = document.getElementById("log");

let globalClear;

clearBtn.addEventListener("click", function() { globalClear() });

let socket;

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
        sketch.stroke(0); // Set the line color to black
        sketch.strokeWeight(4); // Set the thickness of the line

        if (sketch.mouseIsPressed) {
            sketch.line(sketch.pmouseX, sketch.pmouseY, sketch.mouseX, sketch.mouseY); // Draw a line from the previous mouse position to the current position
        }
    }
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