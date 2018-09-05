var DefineMap = require("can-define/map/map");

module.exports = DefineMap.extend({
	page: "string",
	param: "string",
	err: "boolean",
	statusMessage: {
		type: "string",
		serialize: false
	},
	throwError: function() {
		throw Error("Something went wrong");
	}
});
