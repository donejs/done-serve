const { ServerResponse } = require("http");
const addons = require("./response");

const res = Object.create(ServerResponse.prototype, addons);
module.exports = res;
