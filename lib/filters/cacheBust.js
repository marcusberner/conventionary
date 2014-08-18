var path = require('path'),
	swig = require('swig'),
	version = require(path.join(process.cwd(), 'package.json')).version,
	versionSuffix = process.env.NODE_ENV ? '' : ('-' + Math.round(Math.random()*100000));

swig.setFilter('cacheBust', function (url) {
	var busted = url + (url.indexOf('?') >= 0 ? '&' : '?');
	busted += 'v=' + version + versionSuffix;
	return busted;
});