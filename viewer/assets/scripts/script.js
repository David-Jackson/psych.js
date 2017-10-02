
var graph;
var stationary = true;

function setup() {
	createCanvas(windowWidth, windowHeight);
	background(244, 249, 250);
	graph = new Graph(width, height);
	noLoop();
}


function draw() {
	
	background(244, 249, 250);
	graph.draw();
	
	
	/**
	if (pmouseX == mouseX && pmouseY == mouseY) {
		if (!stationary) {
			graph.mouseMoved();
			stationary = true;
		}
	} else {
		stationary = false;
	}
	**/
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	background(244, 249, 250);
	graph.resize(width, height);
	redraw();
}

function mouseMoved() {
	//graph.mouseMoved(mouseX, mouseY);
}

function mousePressed() {
	//graph.mousePressed(mouseX, mouseY);
}

window.ondblclick = function() {
	graph.addPointFromXY(mouseX, mouseY);
}