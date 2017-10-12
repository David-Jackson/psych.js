var canvas;
var graph;
var stationary = true;

function setup() {
	canvas = createCanvas(windowWidth, windowHeight);
	canvas.parent("sketch-holder");
	graph = new Graph(width, height);
	noLoop();
}


function draw() {
	
	background(graph.properties.defaults.backgroundColor);
	graph.draw();
	
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	background(244, 249, 250);
	graph.resize(width, height);
	redraw();
}

function mouseMoved() {
	graph.mouseMoved(mouseX, mouseY);
}

function mousePressed() {
	graph.mousePressed(mouseX, mouseY);
}

window.ondblclick = function() {
	graph.addPointFromXY(mouseX, mouseY);
}