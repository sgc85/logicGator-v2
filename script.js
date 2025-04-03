//The circuit class holds details of all the gates
class Circuit {
  constructor() {
    //when gates are added they are pushed into this list
    this.gates = [];
    //stores the outputs - this is where evaluations will begin.
    this.outputs = [];
  }

  //Goes through every output node and uses its use method
  evaluateCircuit = () => {
    this.outputs.forEach((output) => output.use());
  };

  //filters the gate so only gates that are NOT the one to delete remain
  removeGate = (gate) => {
    this.gates = this.gates.filter((existingGate) => existingGate !== gate);
    //checks if the gate being removed is an output and removes it from this list too
    if (gate instanceof Output) {
      this.outputs = this.outputs.filter(
        (existingOutput) => existingOutput !== gate
      );
    }
    //re-evaluate the circuit to show changes due to the removal.
    this.evaluateCircuit();
  };

  //pushes the new gate into the gate list
  addGate = (gate) => {
    this.gates.push(gate);
    //also add it to the output list if it is one
    if (gate instanceof Output) {
      this.outputs.push(gate);
    }
  };

  //will be run when connections are made AND when nodes are moved
  drawConnections = () => {
    // First we need to remove all existing lines
    //This finds all elements with the class line and removes them
    document.querySelectorAll(".line").forEach((node) => node.remove());

    //We will add the new lines into the circuit division
    const circuit = document.getElementById("circuit");

    // iterate through each gate in the gate list
    for (let gate of this.gates) {
      // For each of the gates we then iterate though its inputs.
      //conn contains the object and a "port" number to which it is connected
      for (let conn of gate.inputs) {
        //For each input we need a line from where it is from
        //Lines are created using a div with the line class
        let newLine = document.createElement("div");
        newLine.className = "line";

        //currently only shows connections if the gates run left to right
        //ADD ELSE TO THIS TO DEAL WITH REVERSE CONNECTIONS
        if (gate.x > conn.outputGate.x + conn.outputGate.width) {
          // Determine the starting point for the line from the outputting gate
          let startX = conn.outputGate.x + conn.outputGate.width;
          //This will always be half way down the height
          let startY = conn.outputGate.y + conn.outputGate.height / 2;

          // Determine the ending point for the input gate.
          let endX = gate.x;
          // Default to the center of the gate as will be the case of outputs and NOT gates
          let endY = gate.y + gate.height / 2;

          // If the receiving gate is an AndGate we need to adjust endY accordingly.
          if (gate instanceof AndGate ) {
            // conn.port will either be 1 or 0 which will offset the position by 0 or 30 respectively.
            //the buttons are 16 across, so +8 will center these
            //+10 will push it away from the top
            endY = gate.y + (conn.port * 30 + 8 + 10);
          }

          // Calculate dimensions for the connection line
          let lineWidth = endX - startX;
          //abs ensures this is positive - important when gate is moved above and below other
          let lineHeight = Math.abs(endY - startY);
          //position the left hand side at the calculated start position
          newLine.style.left = `${startX}px`;
          //starts from whichever is further up the page - lower numbers are higher on y
          newLine.style.top = `${Math.min(startY, endY)}px`;
          //The div will be the width and height necessary to contain the line
          newLine.style.width = `${lineWidth}px`;
          newLine.style.height = `${lineHeight}px`;

          // Create line segments inside the line box
          //Made up for three segments each styled using CSS
          let rightLine = document.createElement("div");
          rightLine.className = "right-line";

          let leftLine = document.createElement("div");
          leftLine.className = "left-line";

          let midLine = document.createElement("div");
          midLine.className = "mid-line";

          //Flips the left and right segments to top / bottom depending on y positions
          if (startY < endY) {
            rightLine.style.bottom = "0px";
            leftLine.style.top = "0px";
          } else {
            rightLine.style.top = "0px";
            leftLine.style.bottom = "0px";
          }

          //add all three lines to the line div
          newLine.appendChild(rightLine);
          newLine.appendChild(leftLine);
          newLine.appendChild(midLine);

          //add the whole line div to the circuit div
          circuit.appendChild(newLine);
        }
      }
    }
  };
}

//parent class used for all gates AND inputs / outputs
class Gate {
  constructor() {
    //gets the circuit division from the main page
    const circuit = document.getElementById("circuit");
    //finds out the size of the circuit division
    const circuitRect = circuit.getBoundingClientRect();
    //calculates the center of the circuit division and sets the gate to be in the center
    this.x = circuitRect.width / 2 - 50; //offset to half the gate size
    this.y = circuitRect.height / 2 - 30; //same for height
    this.width = 100; //default sizes
    this.height = 60;
    //Creates a new division for the gate element
    this.element = document.createElement("div");
    //context menu is right clicking - this runs the delete on this
    this.element.oncontextmenu = (event) => this.delete(event);
    //adds the gate to the gate css class
    this.element.className = "gate";
    //sets style to default sizes
    this.element.style.width = `${this.width}px`;
    this.element.style.height = `${this.height}px`;
    //positions the new element in the middle of the circuit area
    this.element.style.left = `${this.x}px`;
    this.element.style.top = `${this.y}px`;
    //creates an empty array to store the inputs
    //must be list to handle multi-input gates e.g. AND / OR
    this.inputs = [];
    //used when moving the gate around through drag and drop
    this.isDragging = false;
    //sets the gate up to be draggable
    this.makeDraggable();
  }

  //run when gate is right clicked
  delete = (event) => {
    //avoids the right click menu popping up
    event.preventDefault();
    //removes the main element of the gate from the page
    this.element.remove();
    //removes the object from the circuit instance's gate / output lists
    circuitInstance.removeGate(this);

    // Remove this gate from all other gates' inputs
    // this avoids any 'ghost' lines being left from gates that this used to output to
    //Goes through all gates
    circuitInstance.gates.forEach((gate) => {
      // filters their input lists to remove any instances of the removed gate.
      gate.inputs = gate.inputs.filter((input) => input.outputGate !== this);
    });

    //re-draw connections to account for deleted gate
    circuitInstance.drawConnections();
    //re-evaluate circuit to account for deleted gate
    circuitInstance.evaluateCircuit();
  };

  //run when a gate is clicked
  startDrag = (event) => {
    //ensures this is false - only set to true once a drag motion is detected
    //this is very important for the input gate as it is used to avoid the "state" of the input changing on drag
    this.isDragging = false;
    //workout the initial offset from where the mouse clicks compared to the position of the element
    //avoids the element "jumping" to the mouse cursor when moved
    this.offsetX = event.clientX - this.element.offsetLeft;
    this.offsetY = event.clientY - this.element.offsetTop;
    //change the mouse cursor to a grabbing icon
    this.element.style.cursor = "grabbing";

    // Listen for mousemove on document to ensure smooth dragging
    // These listeners will be unset when the element is dropped
    document.addEventListener("mousemove", this.drag);
    document.addEventListener("mouseup", this.stopDrag);
  };

  // Use arrow function to retain 'this' in context of object
  // otherwise this refers to the event
  drag = (event) => {
    //Now this is set to true - indicates that it has been dragged more than anything
    this.isDragging = true;
    //Get the circuit element as this will be used later in calculations.
    const circuit = document.getElementById("circuit");

    //works out the new location based upon the mosue position
    //offset take into account where on the gate it was clicked
    let newX = event.clientX - this.offsetX;
    let newY = event.clientY - this.offsetY;

    // Ensure within bounds - 8px border has been left around edge
    if (newX < 8) newX = 8;
    if (newX > circuit.clientWidth - this.width - 8)
      newX = circuit.clientWidth - this.width - 8;
    if (newY < 8) newY = 8;
    if (newY > circuit.clientHeight - this.height - 8)
      newY = circuit.clientHeight - this.height - 8;

    this.x = newX;
    this.y = newY;
    this.element.style.left = `${this.x}px`;
    this.element.style.top = `${this.y}px`;

    // Update connections
    circuitInstance.drawConnections();
  };

  // Must use arrow function to retain 'this' in context of object and not the event click
  stopDrag = () => {
    //return cursor to open grab
    this.element.style.cursor = "grab";
    // Remove listeners once dragging stops
    document.removeEventListener("mousemove", this.drag);
    document.removeEventListener("mouseup", this.stopDrag);
  };

  //get each gate element to listen for when clicked and start the drag setup
  makeDraggable() {
    this.element.addEventListener("mousedown", (event) =>
      this.startDrag(event)
    );
  }
}

class AndGate extends Gate {
  constructor() {
    super();
    this.element.style.backgroundImage = "url('and.png')"; // assume 100px by 60px

    // Create two input buttons (each with a port index)
    for (let i = 0; i < 2; i++) {
      //creates a new button element to act as the input
      let button = document.createElement("button");
      //add this to the class to style it as small circular button
      button.className = "gate-btn";
      //absolute position - allows element to be placed in an absolute position relative to parent
      button.style.position = "absolute";
      //pushes the button outside the give by half the button size
      button.style.left = "-8px";
      // adjust vertical offset for each port i is 0 or 1 so will offset to 0*30 or 1*30 for the two inputs
      button.style.top = `${i * 30 + 8}px`;
      //setup the onclick to attempt a connection passing in suitable details
      button.onclick = () => attemptConnection(this, "input", i);
      //add the buttons onto the gate div
      this.element.appendChild(button);
    }

    // Output just creates one button, but is similar to inputs otherwise
    let outputButton = document.createElement("button");
    outputButton.className = "gate-btn";
    outputButton.style.position = "absolute";
    outputButton.style.right = "-8px";
    outputButton.style.top = "22px";
    outputButton.onclick = () => attemptConnection(this, "output");
    this.element.appendChild(outputButton);
    document.getElementById("circuit").appendChild(this.element);
  }

  //This is used when evaluating
  use = () => {



    //checks to see if 2 gates are connected
    if (this.inputs.length === 2) {

      //NOT GATE LOGIC
      // if (this.inputs.length === 1){
      //   if (this.input[0].outputGate.use() === 0){
      //     return 1
      //   }
      // }

      // return 0

      //Uses each of the input gates use() method
      //OR - replace && with ||

      if (this.inputs[0].outputGate.use() && this.inputs[1].outputGate.use()) {
        //returns 1 if both the use() methods returned 1
        return 1;
      }
    }
    //either one of use() methods gave 0 or there weren't two inputs to work with.
    return 0;
  };
}

class Input extends Gate {
  constructor() {
    super();
    this.width = 60;
    this.value = 1;

    // Apply styles
    this.element.style.backgroundColor = "green";
    this.element.style.width = `${this.width}px`;
    this.element.style.display = "flex";
    this.element.style.alignItems = "center";
    this.element.style.justifyContent = "center";
    this.element.style.fontSize = "24px";
    this.element.style.color = "white";

    // Create a text node for the value
    this.textNode = document.createTextNode(this.value);
    this.element.appendChild(this.textNode);

    // Output button
    let outputButton = document.createElement("button");
    outputButton.className = "gate-btn";
    outputButton.style.right = "-8px";
    outputButton.style.top = "22px";
    outputButton.onclick = (event) => {
      event.stopPropagation();
      attemptConnection(this, "output");
    };
    this.element.appendChild(outputButton);

    // Add click handler
    this.element.addEventListener("click", (event) => {
      if (!this.isDragging) {
        // this.handleClick();
        this.value = this.value ? 0 : 1;
        this.element.style.backgroundColor = this.value ? "green" : "red";

        // Update only the text node
        this.textNode.nodeValue = this.value;
        circuitInstance.evaluateCircuit();
      }
    });

    // Append it to the circuit
    document.getElementById("circuit").appendChild(this.element);
  }

  use = () => {
    return this.value;
  };
}

class Output extends Gate {
  constructor() {
    super();
    this.width = 60;
    this.height = 60;
    this.value = 0;

    // Apply styles
    this.element.style.backgroundColor = "red";
    this.element.style.width = `${this.width}px`;
    this.element.style.height = `${this.height}px`;
    this.element.style.display = "flex";
    this.element.style.alignItems = "center";
    this.element.style.justifyContent = "center";
    this.element.style.fontSize = "24px";
    this.element.style.color = "white";

    // Create a text node for the value
    this.textNode = document.createTextNode(this.value);
    this.element.appendChild(this.textNode);

    // Output button
    let inputButton = document.createElement("button");
    inputButton.className = "gate-btn";
    inputButton.style.position = "absolute";
    inputButton.style.left = "-8px";
    inputButton.style.top = "22px";
    inputButton.onclick = () => attemptConnection(this, "input");
    this.element.appendChild(inputButton);

    // Append it to the circuit
    document.getElementById("circuit").appendChild(this.element);
  }

  use = () => {
    if (this.inputs.length > 0) {
      this.value = this.inputs[0].outputGate.use();
      this.element.style.backgroundColor = this.value ? "green" : "red";

      // Update only the text node
      this.textNode.nodeValue = this.value;
    }
  };
}

var selectedInput = null;
var selectedOutput = null;

// Modified attemptConnection function accepts an optional third parameter: portIndex
function attemptConnection(gate, type, portIndex) {
  if (type === "input") {
    if (selectedInput) {
      // If something is already selected, deselect it (or you might want to allow switching)
      selectedInput.gate.element.style.border = null;
      selectedInput = null;
    } else {
      // Store the input selection along with the port index
      selectedInput = { gate: gate, port: portIndex };
      gate.element.style.border = "blue solid 2px";
    }
  } else if (type === "output") {
    if (selectedOutput) {
      selectedOutput.gate.element.style.border = null;
      selectedOutput = null;
    } else {
      selectedOutput = { gate: gate };
      gate.element.style.border = "blue solid 2px";
    }
  }

  // When both sides are selected, try to create a connection
  if (selectedInput && selectedOutput) {
    // Prevent connecting a gate to itself
    if (selectedInput.gate === selectedOutput.gate) {
      alert("Cannot connect a gate to itself!");
      selectedInput.gate.element.style.border = null;
      selectedOutput.gate.element.style.border = null;
      selectedInput = null;
      selectedOutput = null;
      return;
    }

    // Check for duplicate connection on the same input port
    if (
      selectedInput.gate.inputs.some(
        (conn) =>
          conn.port === selectedInput.port &&
          conn.outputGate === selectedOutput.gate
      )
    ) {
      alert("This connection already exists!");
      selectedInput.gate.element.style.border = null;
      selectedOutput.gate.element.style.border = null;
      selectedInput = null;
      selectedOutput = null;
      return;
    }

    // Create the connection by pushing an object containing both the output gate and the input port index.
    selectedInput.gate.inputs.push({
      outputGate: selectedOutput.gate,
      port: selectedInput.port,
    });

    // Clear the borders and reset the selections
    selectedInput.gate.element.style.border = null;
    selectedOutput.gate.element.style.border = null;
    selectedInput = null;
    selectedOutput = null;

    // Redraw connections to include the new line
    circuitInstance.drawConnections();
    circuitInstance.evaluateCircuit();
  }
}

//used by buttons in the menu to make gates in the circuit
function createGate(gateType) {
  if (gateType === "AND") {
    let gate = new AndGate();
    circuitInstance.addGate(gate);
  } else if (gateType === "INPUT") {
    let gate = new Input();
    circuitInstance.addGate(gate);
  } else if (gateType === "OUTPUT") {
    let gate = new Output();
    circuitInstance.addGate(gate);
  }
}

var connecting = false;
// var inputGate = null;
// var outputGate = null;
const circuitInstance = new Circuit();




