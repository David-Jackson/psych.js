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
	
	background(255);
	graph.draw();
	
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	graph.resize(width, height);
	redraw();
}

function mousePressed() {
	graph.mousePressed(mouseX, mouseY);
}

function toggleUI(toggle) {
	console.log(toggle);
}

window.ondblclick = function() {
	graph.addPointFromXY(mouseX, mouseY);
}
