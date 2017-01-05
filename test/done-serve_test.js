var assert = require("assert");
var path = require("path");
var spawn = require("child_process").spawn;

describe("done-serve done-serve", function(){
	this.timeout(30000);

	var isWin = /^win/.test(process.platform);
	var platformExt = function(p) {
		return p + (isWin ? ".cmd" : "");
	};

	var doneServeBin = platformExt(path.join(__dirname, "..", "bin", "done-serve"));
	var stealToolsBin = platformExt(path.join(__dirname, "..", "node_modules",
								  ".bin", "steal-tools"));

	describe("--develop", function(){
		beforeEach(function(){
			this.pwd = process.cwd();
			process.chdir(path.join(__dirname, "tests"));
		});

		afterEach(function(){
			process.chdir(this.pwd);
		});

		it("starts up web and live-reload servers", function(done){
			var child = spawn(doneServeBin, [
				"--develop",
				"--steal-tools-path",
				stealToolsBin,
				"--port",
				"8085",
				"--live-reload-port",
				"8011"
			]);

			// Keeps track of the web server and live-reload server starting.
			var partsStarted = 0;

			child.stdout.setEncoding("utf8");

			child.stdout.on("data", checkMessage);
			child.stderr.on("data", checkMessage);

			function checkMessage(msg){
				if(/done-serve starting/.test(msg)) {
					assert(true, "web server started");
					partsStarted++;
				} else if(/Live-reload server/.test(msg)) {
					assert(true, "live-reload started");
					assert(/port 8011/.test(msg), "correct port");
					partsStarted++;
				} else {
					console.log(msg);
				}

				if(partsStarted === 2) {
					child.kill();
				}
			}

			child.on("exit", function(){
				done();
			});
		});


	});
});
