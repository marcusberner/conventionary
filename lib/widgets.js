var fs = require('fs'),
	path = require('path'),
	async = require('async'),
	glob = require('glob');

module.exports = function(options, siteSandal, logger, done) {

	logger.info('Loading widgets');

	var _widgets = [];

	loadDirectory(options.widgetPath, _widgets, [], siteSandal, function (err) {
			if (err) return done(err);
			logger.info('Loading ' + _widgets.length + ' widgets done');
			done(null, _widgets);
		});

};

function loadDirectory (dir, widgets, pathArray, sandal, callback) {

	if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return callback();

	async.each(fs.readdirSync(dir), function (file, fileCallback) {

		var pathArrayClone = clonePathArray(pathArray);
		pathArrayClone.push(file);

		var widgetDir = path.join(dir, file),
			widgetPath = path.join(widgetDir, file + '.js'),
			templatePath = path.join(widgetDir, file + '.html'),
			hasAlternativeTemplates = glob.sync(path.join(widgetDir, '*.html')).length > 0,
			lessPath = path.join(widgetDir, file + '.less'),
			themeLessFiles = glob.sync(path.join(widgetDir, file + '.*.less')),
			themes = {},
			scriptPath = path.join(widgetDir, '/script/**/*.js'),
			hasCode = fs.existsSync(widgetPath) && fs.statSync(widgetPath).isFile(),
			hasDefaultTemplate = fs.existsSync(templatePath) && fs.statSync(templatePath).isFile();

		if (themeLessFiles.length > 0) themeLessFiles.forEach(function(themeLessFile) {
			var themeName = themeLessFile.substring(path.join(widgetDir, file).length + 1, themeLessFile.length - 5);
			themes[themeName] = {
				less: themeLessFile
			};
		});

		if ((!hasDefaultTemplate && !hasAlternativeTemplates) || (!hasCode && !hasDefaultTemplate)) return loadDirectory(widgetDir, widgets, pathArrayClone, sandal, fileCallback);

		var code = hasCode ? require(widgetPath) : {};

		resolveWidget(sandal, code, function (err, resolvedCode) {

			if (err) return fileCallback(err);

			if (!resolvedCode.factory && !hasDefaultTemplate) return loadDirectory(widgetDir, widgets, pathArrayClone, sandal, fileCallback);

			var widget = {
				path: pathArrayClone,
				dir: widgetDir,
				wrap: resolvedCode.hasOwnProperty('wrap') ? resolvedCode.wrap : true,
				template: hasDefaultTemplate ? templatePath : null,
				less: (!fs.existsSync(lessPath) || !fs.statSync(lessPath).isFile()) ? null : lessPath,
				themes: themes,
				scripts: glob.sync(scriptPath),
				factory: resolvedCode.factory || function (requestContext, data, callback) { callback(null, data || {}); },
				test: resolvedCode.test || function (requestContext, data, callback) { callback(null, true); }
			};
			widgets.push(widget);

			loadDirectory(widgetDir, widgets, pathArrayClone, sandal, fileCallback);

		});

	}, callback);

}

function resolveWidget(sandal, widget, callback) {
	if (typeof widget === 'function') {
		sandal.resolveAsFactory(widget, callback);
	} else {
		callback(null, widget);
	}
}

function clonePathArray (pathArray) {
	return JSON.parse(JSON.stringify(pathArray));
}