var fs = require('fs'),
	autoprefixer = require('autoprefixer'),
	CleanCSS = require('clean-css'),
	cleanCSS = new CleanCSS(),
	less = require('less');

module.exports = function (filePath, lessData, callback) {

	if (!callback) {
		callback = lessData;
		lessData = null;
	}

	var getLess = function (lessCallback) {
		if (lessData) return lessCallback(null, lessData);
		fs.exists(filePath, function (exists) {
			if (!exists) return lessCallback();
			fs.readFile(filePath, { encoding: 'utf8' }, lessCallback);
		});
	};

	getLess(function (err, lessData) {
		if (err) return callback(err);
		if (!lessData) return callback();
		less.render(lessData, { filename: filePath }, function (err, css) {
			if (err) return callback(err);
			css = autoprefixer.process(css).css;
			css = cleanCSS.minify(css);
			callback(null, css);
		});
	});

};