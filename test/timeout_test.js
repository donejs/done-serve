var assert = require("assert");
var path = require("path");
var request = require("request");
var isCI = require("is-ci");

var serve = require("../lib/index");

describe("done-serve timeout", function() {
	this.timeout(10000);

	var server;

	before(function(done) {
		this.timeout(30000);

		server = serve({
			path: path.join(__dirname, 'tests'),
			main: "timeout/index.stache!done-autorender",
			timeout: 50
		}).listen(5050);

		server.on('listening', function(){
			// Make an initial request so that steal is preloaded
			request("http://localhost:5050/slow", function(err, res, body){
				setTimeout(done, isCI ? 20000 : 5000);
			});
		});
	});

	after(function(done) {
		server.close(done);
	});

	it("Times out when exceeding the timeout", function(done){
		request("http://localhost:5050/slow", function(err, res, body){
			assert.ok(/failed/.test(body), "This route timed out");
			done();
		});
	});

	it("Doesn't timeout when it renders on time", function(done){
		request("http://localhost:5050/fast", function(err, res, body){
			assert.ok(/passed/.test(body), "This route timed out");
			done();
		});
	});
});
