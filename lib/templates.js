var path = require('path'),
	async = require('async'),
	glob = require('glob');

module.exports = function(options, swig, logger, done) {

	var templates = {},
		compileTemplates = function (rootPath, callback) {
			logger.info('Compiling templates in ' + rootPath);
			var failed = false;
			glob(path.join(rootPath, '**/*.html'), function (err, files) {
				if (err) return callback(err);
				files.forEach(function (file) {
					if (failed) return;
					try {
						templates[file] = swig.compileFile(file);
					} catch (err) {
						logger.error('Compiling template ' + file + ' failed');
						failed = true;
						callback(err);
					}
				});
				if (!failed) callback();
			});
		};

	async.each([options.widgetPath, options.routePath], compileTemplates, function (err) {
		if (err) return done(err);
		done(null, templates);
	});

};
