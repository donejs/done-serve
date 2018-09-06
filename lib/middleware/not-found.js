const chalk = require('chalk');

module.exports = function(req, res, next) {
	console.error(`${chalk.red('404')} ${chalk.yellow.bgBlackBright.bold(' ' + req.url + ' ')}`);
	res.writeHead(404);
	res.end('Not found.');
};
