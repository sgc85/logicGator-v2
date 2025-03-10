class Circuit {
  constructor() {
    this.gates = [];
    this.connections = {};
  }
}

class Gate {
  constructor() {
    //gets the circuit division from the main page
    const circuit = document.getElementById("circuit");
    //finds out the size of the circuit division
    const circuitRect = circuit.getBoundingClientRect();
    //calculates the center of the circuit division and sets the gate to be in the center
    this.x = circuitRect.width / 2 - 50;
    this.y = circuitRect.height / 2 - 30;
    //creates an empty array to store the inputs
    this.inputs = [];
  }

  makeDraggable() {
    let offsetX,
      offsetY,
      isDragging = false;
    const circuit = document.getElementById("circuit");

    this.element.addEventListener("mousedown", (event) => {
      isDragging = true;
      offsetX = event.clientX - this.element.offsetLeft;
      offsetY = event.clientY - this.element.offsetTop;
      this.element.style.cursor = "grabbing";
    });

    document.addEventListener("mousemove", (event) => {
      if (isDragging) {
        let newX = event.clientX - offsetX;
        let newY = event.clientY - offsetY;
        newX = Math.max(0, Math.min(newX, circuit.clientWidth - 100));
        newY = Math.max(0, Math.min(newY, circuit.clientHeight - 60));
        this.x = newX;
        this.y = newY;
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
        circuitInstance.drawLines();
      }
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
      this.element.style.cursor = "grab";
    });
  }

  drawLines() {
    for (input of this.inputs) {
      document.querySelector(".line").remove();
    }
  }
}

class AndGate extends Gate {
  constructor() {
    super();
    this.element = document.createElement("div");
    this.element.className = "gate";
    this.element.style.position = "absolute";
    this.element.style.left = `${this.x}px`;
    this.element.style.top = `${this.y}px`;
    this.element.style.backgroundImage = "url('and.png')";
    this.element.style.width = "100px";
    this.element.style.height = "60px";
    this.element.style.cursor = "grab";

    // Input buttons
    for (let i = 0; i < 2; i++) {
      let button = document.createElement("button");
      button.className = "gate-btn input";
      button.style.position = "absolute";
      button.style.left = "-8px";
      button.style.top = `${i * 30 + 8}px`;
      button.onclick = () => attemptConnection(this, "input");
      this.element.appendChild(button);
    }

    // Output button
    let outputButton = document.createElement("button");
    outputButton.className = "gate-btn output";
    outputButton.style.position = "absolute";
    outputButton.style.right = "-8px";
    outputButton.style.top = "22px";
    outputButton.onclick = () => attemptConnection(this, "output");
    this.element.appendChild(outputButton);

    this.makeDraggable();
    document.getElementById("circuit").appendChild(this.element);
  }
}

let selectedOutput = null;
let circuitInstance = new Circuit();

function attemptConnection(gate, type) {
  if (type === "output") {
    selectedOutput = gate;
  } else if (selectedOutput && selectedOutput !== gate) {
    circuitInstance.connect(selectedOutput, gate);
    selectedOutput = null;
  }
}

function createGate(type) {
  if (type === "AND") {
    let gate = new AndGate();
    circuitInstance.addGate(gate);
    return gate;
  }
}
