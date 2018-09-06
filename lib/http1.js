const cookie = require("cookie");
const mime = require("send").mime;
const sign = require('cookie-signature').sign;
const http1Symbol = Symbol.for("is-http/1");
const charsetRegExp = /;\s*charset\s*=/;

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

function header(field, val) {
	if(arguments.length === 2) {
		var value = Array.isArray(val) ?
			val.map(String) :
			String(val);

		// add charset to content-type
		if (field.toLowerCase() === 'content-type') {
			if (Array.isArray(value)) {
				throw new TypeError('Content-Type cannot be set to an Array');
			}
			if (!charsetRegExp.test(value)) {
				var charset = mime.charsets.lookup(value.split(';')[0]);
				if (charset) {
					value += '; charset=' + charset.toLowerCase();
				}
			}
		}

		this.setHeader(field, value);
	} else {
		for (var key in field) {
			this.set(key, field[key]);
		}
	}
	return this;
}

exports.responseAddons = {
	header: header,
	set: header,
	append: function(field, val) {
		var prev = this.getHeader(field);
		var value = val;

		if (prev) {
			// concat the new and prev vals
			value = Array.isArray(prev) ? prev.concat(val)
				: Array.isArray(val) ? [prev].concat(val)
				: [prev, val];
		}

		return this.set(field, value);
	},
	cookie: function(name, value, options) {
		var opts = Object.assign({}, options);
		var secret = this.req && this.req.secret;
		var signed = opts.signed;

		if (signed && !secret) {
			throw new Error('cookieParser("secret") required for signed cookies');
		}

		var val = typeof value === 'object' ?
			'j:' + JSON.stringify(value) :
			String(value);

		if (signed) {
			val = 's:' + sign(val, secret);
		}

		if ('maxAge' in opts) {
			opts.expires = new Date(Date.now() + opts.maxAge);
			opts.maxAge /= 1000;
		}

		if (opts.path == null) {
			opts.path = '/';
		}

		this.append("Set-Cookie", cookie.serialize(name, String(val), opts));

		return this;
	}
};
