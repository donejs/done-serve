// jshint ignore: start
const assert = require("assert");
const helpers = require("./helpers");
const path = require('path');
const nock = require("nock");
const serve = require('../lib/index');

runTests(helpers.modes.H2);

function runTests(mode) {
	const request = helpers.makeRequest(mode);
	const createServerOptions = helpers.makeCreateServerOptions(mode);

	describe("done-serve cookie_server - " + mode, function() {
		this.timeout(10000);

		var scope;
		var server;

		before(function(done) {
			server = serve(5050, createServerOptions({
				path: path.join(__dirname, 'tests'),
				main: "cookie/index.stache!done-autorender"
			}));

			scope = nock("http://www.example.org").get( "/session" ).delay( 20 ).reply(
				function ( uri, requestBody ) {
					return [
						200,
						"request body",
						{ "set-cookie": "ajaxResDurringSSR=setsACookie" }
					];
				}
			);

			server.on('listening', done);
		});

		after(function(done) {
			nock.restore();
			server.close(done);
		});

		it('starts SSR with package.json settings and outputs page with 200 status', async function() {
			let [err, res] = await request('http://localhost:5050');
			let cookie = res.headers["set-cookie"];
			assert.equal(cookie[0], "newCookieKey=newCookieValue; Path=/");
			assert.equal(cookie[1], "ajaxResDurringSSR=setsACookie; Path=/");
		});
	});
}
