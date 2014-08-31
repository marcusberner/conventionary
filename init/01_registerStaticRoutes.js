var path = require('path');

module.exports = function (app, express, options) {

	return function(callback) {
		app.use(express.static(path.join(process.cwd(), options.staticPath)));
		callback();
	}

};
