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
					scriptPath = path.join(widgetDir, '/script/**/*.js');
				if (!fs.existsSync(widgetPath) || !fs.statSync(widgetPath).isFile()) return;
				var widget = {
					name: file,
					path: widgetDir,
					template: templatePath,
					less: (!fs.existsSync(lessPath) || !fs.statSync(lessPath).isFile()) ? null : lessPath,
					scripts: glob.sync(scriptPath),
					factory: require(widgetPath)
				};
				_widgets.push(widget);
			});
		},

		get: function () {
			return _widgets;
		}

	};

})();