var fs = require('fs'),
	path = require('path'),
	glob = require('glob');

module.exports = (function () {

	var _widgets = [];

	return {

		load: function () {
			var widgetsDir = path.join(process.cwd(), '/widgets');
			if (!fs.existsSync(widgetsDir) || !fs.statSync(widgetsDir).isDirectory()) return;
			fs.readdirSync(widgetsDir).forEach(function (file) {

				var widgetDir = path.join(widgetsDir, file),
					widgetPath = path.join(widgetDir, file + '.js'),
					templatePath = path.join(widgetDir, file + '.html'),
					lessPath = path.join(widgetDir, file + '.less'),
					scriptPath = path.join(widgetDir, '/script/**/*.js'),
					hasCode = fs.existsSync(widgetPath) && fs.statSync(widgetPath).isFile(),
					hasTemplate = fs.existsSync(templatePath) && fs.statSync(templatePath).isFile();

				if (!hasTemplate) return;

				var code = hasCode ? require(widgetPath) : {};

				var widget = {
					name: file,
					path: widgetDir,
					template: templatePath,
					less: (!fs.existsSync(lessPath) || !fs.statSync(lessPath).isFile()) ? null : lessPath,
					scripts: glob.sync(scriptPath),
					factory: code.factory || function (pageContext, data, callback) { callback(null, {}); },
					test: code.test || function (pageContext, data, callback) { callback(null, true); }
				};
				_widgets.push(widget);
			});
		},

		get: function () {
			return _widgets;
		}

	};

})();