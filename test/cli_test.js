var assert = require("assert");
var cli = require("../lib/cli");
var EventEmitter = require("events").EventEmitter;
var path = require("path");
var td = require("testdouble");

function node(args){
	return ["node", __filename].concat(args);
}

function serverExpects(opts){
	var server = td.replace("../lib/app");
	td.when(server(td.matchers.contains(opts)))
		.thenReturn({
			listen: function(){
				assert.ok("it worked");
				return new EventEmitter();
			}
		});
}

describe("done-serve cli", function(){
	describe("path", function(){
		it("Uses current directory when no path passed", function() {
			cli.program.parse(node([]));
			serverExpects({ path: process.cwd() });
			cli.run();
		});
		it("Uses path joined with current directory when passed", function() {
			cli.program.parse(node(["dist"]));
			serverExpects({ path: path.join(process.cwd(), 'dist') });
			cli.run();
		});
	});
	describe("--timeout", function(){
		it("Passes undefined when no option passed", function(){
			cli.program.parse(node([]));
			serverExpects({ timeout: undefined });
			cli.run();
		});

		it("Passes in an integer", function(){
			cli.program.parse(node([
				"--timeout",
				"4000",
				"--no-live-reload"
			]));

			serverExpects({ timeout: 4000 });
			cli.run();
		});
	});

	describe("--debug", function(){
		it("Passes true", function(){
			cli.program.parse(node(["--debug"]));
			serverExpects({ debug: true });
			cli.run();
		});
	});

	describe("auth-cookie", function(){
		it("Receives the cookie name", function(){
			cli.program.parse(node(["--auth-cookie", "feathers-jwt"]));
			serverExpects({
				auth: {
					cookie: 'feathers-jwt'
				}
			});
			cli.run();
		});
	});

	describe("auth-domains", function(){
		it("Receives the auth domains", function(){
			cli.program.parse(node(["--auth-domains", "canjs.com,bitovi.com"]));
			serverExpects({
				auth: {
					domains: [
						'canjs.com',
						'bitovi.com'
					]
				}
			});
			cli.run();
		});
	});

	describe("--develop", function(){
		it("Launches a steal-tools process", function(){
			cli.program.parse(node(["--develop"]));
			serverExpects({});

			var childProc = td.replace("child_process");

			var cmd = path.join("node_modules", ".bin", "steal-tools") +
				" live-reload";

			var execExpect = childProc.exec(cmd, {
				cwd: process.cwd()
			});

			td.when(execExpect).thenReturn({
				stdout: { pipe: function(){} },
				stderr: { pipe: function(){} }
			});

			cli.run();
		});

		it("Sets the NODE_ENV to development", function() {
			cli.program.parse(node(["--develop"]));
			cli.run();
			assert(process.env.NODE_ENV === "development");
		});

		it("Can pass in the live reload port", function(){
			cli.program.parse(node([
				"--develop",
				"--live-reload-port",
				"8787"
			]));
			serverExpects({});

			var childProc = td.replace("child_process");

			var cmd = path.join("node_modules", ".bin", "steal-tools") +
				" live-reload --live-reload-port 8787";

			var execExpect = childProc.exec(cmd, {
				cwd: process.cwd()
			});

			td.when(execExpect).thenReturn({
				stdout: { pipe: function(){} },
				stderr: { pipe: function(){} }
			});

			cli.run();
		});
	});

	describe("strategy", function(){
		it("Receives the strategy name", function(){
			cli.program.parse(node(["--strategy", "safe"]));
			serverExpects({
				strategy: "safe"
			});
			cli.run();
		});
	});

});
