var Sandal = require('sandal').extend(require('sandal-autowire')),
	fs = require('fs'),
	path = require('path');

module.exports = function () {

	var sandal = new Sandal(),
		libPath = path.join(process.cwd(), '/lib');
	if (fs.existsSync(libPath) && fs.statSync(libPath).isDirectory()) sandal.autowire(libPath);
	return sandal;

};