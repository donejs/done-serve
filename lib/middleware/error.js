
module.exports = function(error, req, res) {
	debugger;
	res.writeHead(500);
	res.end(error.toString());
};
