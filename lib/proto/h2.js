const { Http2ServerResponse } = require("http2");
const addons = require("./response");

const res = Object.create(Http2ServerResponse.prototype, addons);

module.exports = res;
