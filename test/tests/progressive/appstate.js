var DefineMap = require("can-define/map/map");

module.exports = DefineMap.extend({
	param: "string",
	err: "boolean",
	statusMessage: {
		type: "string",
		serialize: false
	},
	throwError: function() {
		console.log("OH NO ERROR");
		throw Error("Something went wrong");
	}
});
