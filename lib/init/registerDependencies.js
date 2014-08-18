var Sandal = require('sandal').extend(require('sandal-autowire')),
	fs = require('fs'),
	path = require('path');

module.exports = function (options) {

	var sandal = new Sandal(),
		libPath = path.join(process.cwd(), options.libPath);
	sandal.object('options', options);
	if (fs.existsSync(libPath) && fs.statSync(libPath).isDirectory()) sandal.autowire(libPath);
	return sandal;

};