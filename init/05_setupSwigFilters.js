var path = require('path'),
	swig = require('swig'),
	version = require(path.join(process.cwd(), 'package.json')).version,
	versionSuffix = process.env.NODE_ENV ? '' : ('-' + Math.round(Math.random()*100000));

module.exports = function (swig, options, translate) {

	return function(callback) {

		swig.setFilter('cacheBust', function (url) {
			var busted = url + (url.indexOf('?') >= 0 ? '&' : '?');
			busted += 'v=' + version + versionSuffix;
			return busted;
		});

		swig.setFilter('translate', translate);

		callback();

	}

};
