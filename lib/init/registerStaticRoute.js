var path = require('path'),
	express = require('express');

module.exports = function (app, options) {

	if (!options.staticPath) return;
	app.use(express.static(path.join(process.cwd(), options.staticPath)));

};
