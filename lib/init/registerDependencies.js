var Sandal = require('sandal').extend(require('sandal-autowire')),
	fs = require('fs'),
	glob = require('glob'),
	path = require('path');

module.exports = function (app, options) {

	var sandal = new Sandal(),
		libPath = path.join(process.cwd(), options.libPath),
		initPath = path.join(process.cwd(), options.initPath, '/**/*.js'),
		initFiles = glob.sync(initPath);

	if (initFiles) {
		initFiles.forEach(function (initFile) {
			sandal.factory(initFile, require(initFile), ['init']);
		});
	} else {
		sandal.object('init', {})
	}

	sandal
		.object('app', app)
		.object('express', require('express'))
		.object('swig', require('swig'))
		.object('options', options);
	if (fs.existsSync(libPath) && fs.statSync(libPath).isDirectory()) sandal.autowire(libPath);
	return sandal;

};