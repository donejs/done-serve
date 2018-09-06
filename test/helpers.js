const fs = require("fs");
const path = require("path");

function makeExpectation(name) {
	return function(expr) {
		var count = 0;
		var old = console[name];
		console[name] = function(err) {
			if(expr) {
				if(err && expr.test(err.toString())) {
					count++;
				}
			} else {
				count++;
			}
		};

		return function() {
			console[name] = old;
			return count;
		};
	};
}

exports.willError = makeExpectation('error');

exports.makeRequest = function(mode) {
	return function(url, callback) {
		let urlObj = new URL(url);

		if(mode === "HTTP/2") {
			urlObj.protocol = "https:";

			let pth = urlObj.pathname + urlObj.search;
			urlObj.pathname = "";

			let h2 = require("http2");
			let error = null;
			let response = {body: ''};

			let client = h2.connect(urlObj.toString(), {
				ca: fs.readFileSync(path.join(__dirname, "config", "cert.pem"))
			});

			return new Promise((resolve) => {
				client.on("error", err => {
					console.log("hmm",err);
					error = err;
				});

				const req = client.request({ ':path': pth });

				req.on("response", (headers) => {
					response.statusCode = headers[":status"];
					response.headers = headers;
				});

				req.on("data", chunk => { response.body += chunk; });

				req.on("end", () => {
					client.close();
					resolve([error, response]);
				});
			});
		}
	};
};
