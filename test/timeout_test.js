// jshint ignore: start
var assert = require("assert");
var helpers = require("./helpers");
var path = require("path");
var request = require("request");
var isCI = require("is-ci");

var serve = require("../lib/index");

runTests(helpers.modes.H1);
runTests(helpers.modes.H2);

function runTests(mode) {
	const request = helpers.makeRequest(mode);
	const createServerOptions = helpers.makeCreateServerOptions(mode);

	describe("done-serve timeout", function() {
		this.timeout(10000);

		var server;

		before(function(done) {
			this.timeout(30000);

			server = serve(5050, createServerOptions({
				path: path.join(__dirname, 'tests'),
				main: "timeout/index.stache!done-autorender",
				timeout: 50
			}));

			server.on('listening', async function(){
				// Make an initial request so that steal is preloaded
				await request("http://localhost:5050/slow");
				setTimeout(done, isCI ? 20000 : 5000);
			});
		});

		after(function(done) {
			server.close(done);
		});

		it("Times out when exceeding the timeout", async function(){
			let [err, res] = await request("http://localhost:5050/slow");
			assert.ok(/failed/.test(res.body), "This route timed out");
		});

		it("Doesn't timeout when it renders on time", async function(){
			let [err, res] = await request("http://localhost:5050/fast");
			assert.ok(/passed/.test(res.body), "This route timed out");
		});
	});

}
