var fs = require('fs'),
	path = require('path'),
	async = require('async'),
	glob = require('glob');

module.exports = (function () {

	var _widgets = [];

	return {

		load: function (sandal, callback) {
			loadDirectory(
				path.join(process.cwd(), '/widgets'),
				_widgets,
				[],
				sandal,
				callback);
		},

		get: function () {
			return _widgets;
		}

	};

})();

function loadDirectory (dir, widgets, pathArray, sandal, callback) {

	if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return callback();

	async.each(fs.readdirSync(dir), function (file, fileCallback) {

		var pathArrayClone = clonePathArray(pathArray);
		pathArrayClone.push(file);

		var widgetDir = path.join(dir, file),
			widgetPath = path.join(widgetDir, file + '.js'),
			templatePath = path.join(widgetDir, file + '.html'),
			lessPath = path.join(widgetDir, file + '.less'),
			scriptPath = path.join(widgetDir, '/script/**/*.js'),
			hasCode = fs.existsSync(widgetPath) && fs.statSync(widgetPath).isFile(),
			hasTemplate = fs.existsSync(templatePath) && fs.statSync(templatePath).isFile(),
			dependencyName = 'widgets/' + pathArrayClone.join('.');

		if (!hasTemplate) return loadDirectory(widgetDir, widgets, pathArrayClone, sandal, fileCallback);

		var code = hasCode ? require(widgetPath) : {};

		if (typeof code === 'function') sandal.factory(dependencyName, code);
		else sandal.object(dependencyName, code);

		sandal.resolve(dependencyName, function (err, resolvedCode) {

			if (err) return fileCallback(err);

			var widget = {
				path: pathArrayClone,
				template: templatePath,
				less: (!fs.existsSync(lessPath) || !fs.statSync(lessPath).isFile()) ? null : lessPath,
				scripts: glob.sync(scriptPath),
				factory: resolvedCode.factory || function (requestContext, data, callback) { callback(null, data || {}); },
				test: resolvedCode.test || function (requestContext, data, callback) { callback(null, true); }
			};
			widgets.push(widget);

			loadDirectory(widgetDir, widgets, pathArrayClone, sandal, fileCallback);

		});

	}, callback);

}

function clonePathArray (pathArray) {
	return JSON.parse(JSON.stringify(pathArray));
}