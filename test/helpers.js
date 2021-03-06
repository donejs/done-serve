/* jshint -W079 */
const fs = require("fs");
const path = require("path");
const {URL} = require("url");

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

exports.makeCreateServerOptions = function(mode) {
	return function(options) {
		if(mode === "HTTP/2") {
			return Object.assign(options, {
				key: path.join(__dirname, "config", "key.pem"),
				cert: path.join(__dirname, "config", "cert.pem")
			});
		}
		return options;
	};
};

exports.makeRequest = function(mode) {
	return function(url, callback) {
		let options = {};
		if(typeof url === "object") {
			options = url;
			url = options.url;
		}

		let urlObj = new URL(url);

		if(mode === "HTTP/2") {
			return makeH2Request(urlObj, options);
		} else {
			return makeH1Request(urlObj, options);
		}
	};
};

function makeH2Request(urlObj, options) {
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
			error = err;
		});

		let headers = options.headers || {};
		headers[":path"] = pth;
		const req = client.request(headers);

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

function makeH1Request(urlObj, options) {
	let http;
	if(urlObj.protocol === "https:") {
		http = require("https");
	} else {
		http = require("http");
	}

	let response = {body: ""};

	return new Promise(resolve => {
		let options = {
			hostname: urlObj.hostname,
			port: Number(urlObj.port),
			path: urlObj.pathname + urlObj.search,
			method: 'GET'
		};

		if(urlObj.protocol === "https:") {
			options.key = fs.readFileSync(path.join(__dirname, "config", "key.pem"));
			options.cert = fs.readFileSync(path.join(__dirname, "config", "cert.pem"));
			options.rejectUnauthorized = false;
		}

		http.get(options, res => {
			response.statusCode = res.statusCode;
			response.headers = res.headers;

			if(response.statusCode === 301) {
				let urlObj = new URL(response.headers.location);
				resolve(makeH1Request(urlObj, options));
				return;
			}

			res.setEncoding("utf8");
			res.on("data", chunk => { response.body += chunk; });
			res.on("end", () => {
				resolve([null, response]);
			});
		})
		.on("error", error => {
			resolve([error]);
		});
	});
}

exports.modes = {
	H1: "HTTP/1",
	H2: "HTTP/2"
};
