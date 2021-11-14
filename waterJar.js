
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
var resizeTimeout = null;

const glassColor = "rgba(220,220,255,1.0)";
const waterLineColor = "rgba(120,120,255,0.7)";
//const waterColor = "rgba(120,120,255,0.4)";
const waterColor = "rgba(46,84,100,0.6)";
const selectedColor = "rgba(255,30,30,1.0)";

const jarWidthHeightRatio = 1/3; // diameter over height
const verticalPaddingPct = 0.2;

const jars = [];
var gapPixels = 0;

const games = [
	{"id": "6-4-1", "minMoves": 3},
	{"id": "8-5-3", "minMoves": 1},
	{"id": "12-7-4", "minMoves": 1},
	{"id": "14-9-5", "minMoves": 1},
	{"id": "16-10-3", "minMoves": 1}
];
var selectedGameIndex = 0;
var gameOver = false;
var gameMoves = 0;

var buttonsHtml = [];
for (let i = 0; i < games.length; i++) {
	buttonsHtml.push("<button class=\"select-game\" id=\"" + games[i].id + "\">" + games[i].id + "</button>");
}
buttonsHtml = buttonsHtml.join("<br/>");

document.getElementById('select-jars-btns').innerHTML += buttonsHtml;

var selectGameBtn = function(e) {
	selectGameId(e.target.id);
};

function selectGameId(volumesStrings) {
	const jarStrings = volumesStrings.split("-");
	if (jarStrings.length != 3) {
		console.log("Unexpected number of hyphen-delimited jar volumes in \"id\" of select-game button [" + volumesStrings + "]");
		return;
	}
	selectedGameIndex = -1;
	for (let i = 0; i < games.length; i++) {
		if (games[i].id == volumesStrings) {
			selectedGameIndex = i;
			break;
		}
	}
	if (selectedGameIndex == -1) {
		console.log("Unexpected game id [" + volumesStrings + "]");
		return;
	}
	resetJars(jarStrings);
	resizeJars();
	draw();
}

var resetJars = function(jarVolumes) {
	closeMenu();
	closeHelpMenu();
	gameOver = false;
	gameMoves = 0;
	// delete any previous jars
	jars.length = 0;
	var largestJarVolume = 0;
	var largestJarIndex = 0;
	for (let i = 0; i < jarVolumes.length; i++) {
		jars[i] = {"volume": parseInt(jarVolumes[i]), "contents": 0};
		if (jars[i].volume > largestJarVolume) {
			largestJarVolume = jars[i].volume;
			largestJarIndex = i;
		}
		jars[i].clicked = false;
	}
	jars[largestJarIndex].contents = largestJarVolume;
}

var resizeJars = function() {
	var maxHeightUnscaled = 0;
	var totalWidthUnscaled = 0;
	for (let i = 0; i < jars.length; i++) {
		const proportions = calculateJarProportions(jars[i].volume);
		if (proportions.h > maxHeightUnscaled) {
			maxHeightUnscaled = proportions.h;
		}
		totalWidthUnscaled += (proportions.r * 2);
		jars[i] = Object.assign(jars[i], proportions);
	}
	const scale = calculateJarPixelScale(maxHeightUnscaled, totalWidthUnscaled);
	const totalWidth = totalWidthUnscaled * scale;
	gapPixels = (canvas.width - totalWidth) / (jars.length + 1);
	var offsetXPixels = 0;
	for (let i = 0; i < jars.length; i++) {
		offsetXPixels += gapPixels;
		const pixels = calculateJarPixelDimensions(scale, jars[i].r);
		jars[i] = Object.assign(jars[i], pixels);
		jars[i]["leftX"] = offsetXPixels;
		jars[i]["rightX"] = offsetXPixels + jars[i].wPixels;
		offsetXPixels += jars[i].wPixels;
	}
};

function calculateJarProportions(volume) {
	const radius = Math.cbrt((volume * jarWidthHeightRatio) / (2 * Math.PI));
	const height = (2 * radius) / jarWidthHeightRatio;
	return {"r": radius, "h": height};
}

function calculateJarPixelScale(maxHeightUnscaled, totalWidthUnscaled) {
	// scale everything to fit the tallest jar
	var heightScale = (canvas.height * (1.0 - verticalPaddingPct - verticalPaddingPct)) / maxHeightUnscaled;
	var heightScaleWidth = totalWidthUnscaled * heightScale;
	var scale = heightScale;
	// if width is too wide after adjusting for max height, scale everything
	//   down again
	if (heightScaleWidth/canvas.width > 0.95) {
		scale = (canvas.width * 0.95) / heightScaleWidth;
	}
	return scale;
}

function calculateJarPixelDimensions(scale, radiusUnscaled) {
	var width = radiusUnscaled * 2 * scale;
	var height = width / jarWidthHeightRatio;
	return {"wPixels": width, "hPixels": height};
}

function draw() {
	// background might just be able to be transparent
	ctx.fillStyle = "rgba(0,0,0,1.0)";
	ctx.fillRect(0,0,canvas.width, canvas.height);
	const ellipseWidthPct = 0.03;
	const ellipseWidth = canvas.height * ellipseWidthPct;
	const ellipseHalf = ellipseWidth / 2;
	const verticalPadding = canvas.height * verticalPaddingPct;
	const ellipseHeight = verticalPadding / 6;
	const textHeight = verticalPadding * 0.4;
	
	for (let i = 0; i < jars.length; i++) {
		ctx.strokeStyle = glassColor;
		ctx.lineWidth = 2;

		const jarBottomY = canvas.height - verticalPadding;
		const jarTopY = jarBottomY - jars[i].hPixels;

		ctx.beginPath();
		ctx.moveTo(jars[i].leftX, jarTopY);
		ctx.lineTo(jars[i].leftX, jarBottomY);
		ctx.moveTo(jars[i].leftX + jars[i].wPixels, jarTopY);
		ctx.lineTo(jars[i].leftX + jars[i].wPixels, jarBottomY);
		ctx.stroke();
		const jarCenterX = jars[i].leftX + (jars[i].wPixels / 2);
		// draw top ellipse as white if not full
		if (jars[i].contents < jars[i].volume) {
			ctx.beginPath();
			ctx.ellipse(jarCenterX, jarTopY, jars[i].wPixels / 2, ellipseHeight, 0, 0, 2 * Math.PI);
			ctx.stroke();
		}
		// draw water line ellipse if not empty
		if (jars[i].contents > 0) {
			const jarWaterLineY = jarBottomY - (jars[i].hPixels * jars[i].contents / jars[i].volume);
			ctx.fillStyle = waterColor;
			ctx.beginPath();
			ctx.ellipse(jarCenterX, jarWaterLineY, jars[i].wPixels / 2, ellipseHeight, 0, 0, 2 * Math.PI);
			ctx.ellipse(jarCenterX, jarBottomY, jars[i].wPixels / 2, ellipseHeight, 0, 0, 2 * Math.PI);
			ctx.rect(jars[i].leftX, jarWaterLineY, jars[i].wPixels, jarBottomY - jarWaterLineY);
			ctx.fill();
			ctx.strokeStyle = waterLineColor;
			ctx.beginPath();
			ctx.ellipse(jarCenterX, jarWaterLineY, jars[i].wPixels / 2, ellipseHeight, 0, 0, 2 * Math.PI);
			ctx.stroke();
		}
		// only draw bottom ellipse as white if empty
		if (jars[i].contents > 0) {
			ctx.strokeStyle = waterLineColor;
		} else {
			ctx.strokeStyle = glassColor;
		}
		// always draw bottom ellipse
		ctx.beginPath();
		ctx.ellipse(jarCenterX, jarBottomY, jars[i].wPixels / 2, ellipseHeight, 0, 0, 2 * Math.PI);
		ctx.stroke();
		// draw jar label
		if (jars[i].clicked) {
			ctx.fillStyle = selectedColor;
		} else {
			ctx.fillStyle = glassColor;
		}
		ctx.font = textHeight + "px sans-serif";
		ctx.fillText(String.fromCharCode(65 + i), jarCenterX - (textHeight * 0.3), jarBottomY + (verticalPadding * 0.8));
		// do DOM updates for volume/contents
		document.getElementById("capacity-" + (i+1)).innerHTML = jars[i].volume;
		document.getElementById("contents-" + (i+1)).innerHTML = jars[i].contents;
	}
	document.getElementById("moves-display").innerHTML = "" + gameMoves;
}

function pour(fromIndex, toIndex) {
	if (jars[fromIndex].contents == 0) {
		draw();
		return;
	}
	const availableCapacity = jars[toIndex].volume - jars[toIndex].contents;
	if (availableCapacity == 0) {
		draw();
		return;
	}
	gameMoves++;
	if (availableCapacity >= jars[fromIndex].contents) {
		jars[toIndex].contents += jars[fromIndex].contents;
		jars[fromIndex].contents = 0;
	} else {
		jars[toIndex].contents += availableCapacity;
		jars[fromIndex].contents -= availableCapacity;
	}
	draw();
	if (jars[0].contents == jars[1].contents) {
		gameOver = true;
		if (gameMoves < games[selectedGameIndex].minMoves) {
			document.getElementById("menu-contents").innerHTML =
				"<p>Game complete.</p>" +
				"<p>You completed the task in only " + gameMoves + " moves, faster than the known minimum of " + games[selectedGameIndex].minMoves + "!  Wow!</p>";
		} else if (gameMoves == games[selectedGameIndex].minMoves) {
			document.getElementById("menu-contents").innerHTML =
				"<p>Game complete.</p>" +
				"<p>You completed the task in the minimum of " + games[selectedGameIndex].minMoves + " moves.  Great job!</p>";
		} else if (gameMoves > games[selectedGameIndex].minMoves) {
			document.getElementById("menu-contents").innerHTML =
				"<p>Game complete.</p>" +
				"<p>It's possible to complete the task in " + games[selectedGameIndex].minMoves + " moves.  Try again!</p>";
		}
		openMenu();
	}
}

function setCanvasScaleVars() {
	if (canvas.width != canvas.offsetWidth || canvas.height != canvas.offsetHeight) {
		canvas.width = canvas.offsetWidth;
		canvas.height = canvas.offsetHeight;
		resizeJars();
		draw();
	}
}

const gameButtons = document.getElementsByClassName('select-game');
for (let i = 0; i < gameButtons.length; i++) {
	console.log(gameButtons[i].id);
	gameButtons[i].addEventListener('click', selectGameBtn);
}

// re-draw if there's been a window resize and more than 250ms has elapsed
window.addEventListener("resize", function() {
	if (resizeTimeout !== null) {
		window.clearTimeout(resizeTimeout);
	}
	resizeTimeout = window.setTimeout(setCanvasScaleVars, 250);
});

var mouseUpHandler = function(e) {
	if (gameOver) {
		return;
	}
	// this might help prevent strange ios/mobile weirdness
	e.preventDefault();
	const mouseX = e.pageX - canvas.offsetLeft;
	//const mouseY = e.pageY - canvas.offsetTop;
	for (let i = 0; i < jars.length; i++) {
		if (mouseX >= jars[i].leftX && mouseX <= jars[i].rightX) {
			console.log("clicked inside " + i);
			if (jars[i].clicked) {
				jars[i].clicked = false;
				draw();
				return;
			} else {
				for (let j = 0; j < jars.length; j++) {
					if (j == i) {
						continue;
					}
					if (jars[j].clicked) {
						jars[j].clicked = false;
						pour(j, i);
						return;
					}
				}
				jars[i].clicked = true;
				draw();
				return;
			}
			break;
		}
	}
};

canvas.addEventListener("mouseup", mouseUpHandler);
canvas.addEventListener("touchend", mouseUpHandler);

document.getElementById('menu-close').addEventListener("click", function(e) {
  closeMenu();
  closeHelpMenu();
}, true);
document.getElementById('help-menu-open').addEventListener("click", function(e) {
  openHelpMenu();
}, true);
document.getElementById('help-menu-close').addEventListener("click", function(e) {
  closeHelpMenu();
}, true);

function closeMenu() {
	menuVisible = false;
	document.getElementById('menu').style.display = 'none';
	document.getElementById('menu-open-wrap').style.display = 'block';
}

function openMenu() {
	menuVisible = true;
	closeHelpMenu();
	document.getElementById('menu').style.display = 'block';
	document.getElementById('menu-open-wrap').style.display = 'none';
}

function closeHelpMenu() {
	helpVisible = false;
	document.getElementById('help-menu').style.display = 'none';
	document.getElementById('menu-open-wrap').style.display = 'block';
}

function openHelpMenu() {
	closeMenu();
	helpVisible = true;
	document.getElementById('help-menu').style.display = 'block';
	document.getElementById('menu-open-wrap').style.display = 'none';
}

setCanvasScaleVars();
selectGameId(games[0].id);
