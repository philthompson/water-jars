
self.onmessage = function(msg) {
	run(msg.data);
}

var bestSolution = null;

function run(capacities) {
	let startMs = Date.now();
	// running took a while with 5 jars, so limit to 4
	if (capacities < 2 || capacities > 4) {
		solution.innerHTML = "3-4 hyphen-separated integer values are required";
		return;
	}
	bestSolution = null;
	let contents = new Array(capacities.length).fill(0);
	contents[0] = capacities[0];
	let history = [{
		m: " start",
		c: contents
	}];
	pour(history, capacities);
	endMs = Date.now();
	let solutionLines = [];
	solutionLines.push("running time: " + (endMs-startMs).toLocaleString() + "ms");
	if (bestSolution === null) {
		solutionLines.push("no solutions found");
	} else {
		solutionLines.push("finished!  moves are:");
		for (let i = 0; i < bestSolution.length; i++) {
			solutionLines.push("move " + (i) + ": " + bestSolution[i].m + " -- " + bestSolution[i].c.join("-"));
		}
	}
	self.postMessage(solutionLines.join("\n"));
	close();
}

function pour(history, capacities) {
	let contents = history[history.length-1].c;

	// check for final condition
	if (contents[0] === capacities[0]/2 && contents[1] === capacities[0]/2) {
		if (bestSolution === null || bestSolution.length > history.length) {
			bestSolution = history;
		}
		return;
	}

	// see if we can pour FROM jar a
	for (let a = 0; a < capacities.length; a++) {
		if (contents[a] === 0) {
			continue;
		}
		// TO jar b
		for (let b = 0; b < capacities.length; b++) {
			if (b === a) {
				continue;
			}
			if (contents[b] >= capacities[b]) {
				continue;
			}
			let availableCapacity = capacities[b] - contents[b];
			let pourAmount = availableCapacity;
			if (availableCapacity > contents[a]) {
				pourAmount = contents[a];
			}
			let newContents = intArrClone(contents);
			newContents[a] -= pourAmount;
			newContents[b] += pourAmount;

			let isLoop = false;
			// check that this state hasn't been reached yet in the history
			for (let i = 0; i < history.length; i++) {
				if (intArrEquals(history[i].c, newContents)) {
					isLoop = true;
					break;
				}
			}
			if (isLoop) {
				continue;
			}
			let historyClone = intArrClone(history);
			historyClone.push({
				m: String.fromCharCode(65 + a) + " -> " + String.fromCharCode(65 + b),
				c: newContents
			});
			// check that a better solution hasn't already been found
			if (bestSolution !== null && bestSolution.length < history.length) {
				continue;
			}
			pour(historyClone, capacities);
		}
	}
}

// deep equals check for arrays (for arrays of integers)
function intArrEquals(a, b) {
	if (a.length !== b.length) {
		return false;
	}
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) {
			return false;
		}
	}
	return true;
}

// clone integer array (should also work for strings)
function intArrClone(a) {
	return a.slice();
}