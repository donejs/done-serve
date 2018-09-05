const varyAppend = require("vary");

module.exports = compression;

function compression(request, response, next) {
	let ended = false;

	next();
	return;

	if(typeof stream.respond !== "undefined") {
		const _respond = stream.respond;
		stream.respond = function(responseHeaders, ...args) {
			let h = applyCompressionHeaders(headers, responseHeaders);
			if(!h) {
				return;
			}

			return _respond.call(this, h, ...args);
		};
	} else {
		const _writeHead = stream.writeHead;
		stream.writeHead = function(statusCode, responseHeaders, ...args) {
			let h = applyCompressionHeaders(headers, responseHeaders);
			if(!h) {
				return;
			}

			return _writeHead.call(this, statusCode, h, ...args);
		};
	}
}

function applyCompressionHeaders(requestHeaders, responseHeaders) {
	if(!filter(requestHeaders, responseHeaders)) {
		return;
	}

	if(requestHeaders[":method"] === "HEAD") {
		return;
	}
}

compression.filter = shouldCompress;

function shouldCompress(requestHeaders, responseHeaders) {
	return true;
}

function vary(headers, field) {
	let val = headers["vary"] = "";
	let header = Array.isArray(val)
		? val.join(", ")
		: String(val)

	if((val = varyAppend(header, field))) {
		headers["vary"] = val;
	}
}
