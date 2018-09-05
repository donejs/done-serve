
module.exports = function(error, req, res) {
	res.writeHead(500);
	res.end(error.toString());
};
