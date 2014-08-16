var fs = require('fs'),
	path = require('path'),
	async = require('async'),
	glob = require('glob');

module.exports = (function () {

	var _widgets = [];

	return {

		load: function (sandal, callback) {

			var widgetsDir = path.join(process.cwd(), '/widgets');
			if (!fs.existsSync(widgetsDir) || !fs.statSync(widgetsDir).isDirectory()) return callback();

			async.each(fs.readdirSync(widgetsDir), function (file, fileCallback) {

				var widgetDir = path.join(widgetsDir, file),
					widgetPath = path.join(widgetDir, file + '.js'),
					templatePath = path.join(widgetDir, file + '.html'),
					lessPath = path.join(widgetDir, file + '.less'),
					scriptPath = path.join(widgetDir, '/script/**/*.js'),
					hasCode = fs.existsSync(widgetPath) && fs.statSync(widgetPath).isFile(),
					hasTemplate = fs.existsSync(templatePath) && fs.statSync(templatePath).isFile(),
					dependencyName = 'widgets/' + file;

				if (!hasTemplate) return fileCallback();

				var code = hasCode ? require(widgetPath) : {};

				if (typeof code === 'function') sandal.factory(dependencyName, code);
				else sandal.object(dependencyName, code);

				sandal.resolve(dependencyName, function (err, resolvedCode) {

					if (err) return fileCallback(err);

					var widget = {
						name: file,
						path: widgetDir,
						template: templatePath,
						less: (!fs.existsSync(lessPath) || !fs.statSync(lessPath).isFile()) ? null : lessPath,
						scripts: glob.sync(scriptPath),
						factory: resolvedCode.factory || function (pageContext, data, callback) { callback(null, {}); },
						test: resolvedCode.test || function (pageContext, data, callback) { callback(null, true); }
					};
					_widgets.push(widget);

					fileCallback();

				});



			}, callback);

		},

		get: function () {
			return _widgets;
		}

	};

})();