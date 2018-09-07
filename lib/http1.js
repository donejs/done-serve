const http1Symbol = Symbol.for("is-http/1");

function isHTTP1(req) {
	return req[http1Symbol] === true;
}

function markHTTP1(req) {
	req[http1Symbol] = true;
}

exports.is = isHTTP1;
exports.isHTTP1 = isHTTP1;

exports.mark = markHTTP1;
exports.markHTTP1 = markHTTP1;
