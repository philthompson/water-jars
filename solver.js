
const btn = document.getElementById("run");
const text = document.getElementById("text");
const solution = document.getElementById("solution");
let worker = null;

let workerRunning = false;
let currentJob = null;
let prevResults = null;

btn.addEventListener("click", function(e) {
	if (worker !== null) {
		worker.terminate();
		if (workerRunning) {
			solution.innerHTML = "canceled solving for " + currentJob + "\n\n" + prevResults;
		}
	}
	worker = new Worker("solver-worker.js");
	currentJob = text.value.trim();
	let capacities = currentJob.split("-").map(x => parseInt(x));
	worker.onmessage = function(msg) {
		workerRunning = false;
		solution.innerHTML = "solved " + currentJob + ":\n" + msg.data + "\n\n" + prevResults;
		btn.innerHTML = "Run";
	};
	prevResults = solution.innerHTML;
	solution.innerHTML = "solving " + currentJob + " ...\n\n" + prevResults;
	workerRunning = true;
	worker.postMessage(capacities);
	btn.innerHTML = "Cancel and Run";
});
