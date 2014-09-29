
module.exports = function (app, express, options) {

	return function(callback) {
		app.use(options.staticRoot, express.static(options.staticPath));
		callback();
	}

};
