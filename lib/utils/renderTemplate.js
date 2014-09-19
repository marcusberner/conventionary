var async = require('async'),
	path = require('path');

module.exports = function (swig, widgets, wrapWidget) {

	swig.setDefaults({ cache: false });

	var factories = {},
		renderWidgets = [],
		templateCache = {};

	var renderTemplate = function(templatePath, model, callback) {

		var templateFcn = templateCache[templatePath];
		if (!templateFcn) {
			templateCache[templatePath] = templateFcn = swig.compileFile(templatePath);
		}
		model = model || {};
		model.widgets = factories;
		renderWidgets = [];
		var html = templateFcn(model);
		async.parallel(renderWidgets, function (err, renderedWidgets) {
			if (err) return callback(err);
			renderedWidgets.forEach(function (renderedWidget) {
				html = html.replace(renderedWidget.placeHolder, renderedWidget.html);
			});
			callback(null, html);
		});
	};

	widgets
		.sort(function (a, b) {
			return a.path.length - b.path.length;
		})
		.forEach(function (widget) {

			var nameSpace = factories,
				name = widget.path[widget.path.length - 1];

			for (var i = 0; i < widget.path.length - 1; i++) {
				nameSpace[widget.path[i]] = nameSpace[widget.path[i]] || {};
				nameSpace = nameSpace[widget.path[i]];
			}

			nameSpace[name] = function (params) {

				params = params || {};

				var identifier = 'widget-' + randomString(),
					placeHolder = '<!-' + identifier + '->',
					output = widget.wrap ? wrapWidget(widget, identifier, placeHolder) : placeHolder;

				renderWidgets.push(function (widgetRenderedCallback) {
					var that = {};
					widget.test.bind(that)(params, function (err, result) {
						if (err) return widgetRenderedCallback(err);
						if (!result) return widgetRenderedCallback(null, {
							placeHolder: output,
							html: ''
						});
						widget.factory.bind(that)(params, function (err, widgetModel, options) {
							if (err) return widgetRenderedCallback(err);
							options = options || {};
							var templatePath = widget.template;
							if (options.template) templatePath = path.join(widget.dir, options.template);
							renderTemplate(templatePath, widgetModel, function (err, widgetHtml) {
								if (err) return widgetRenderedCallback(err);
								widgetRenderedCallback(null, {
									placeHolder: placeHolder,
									html: widgetHtml
								});
							});
						});
					});
				});

				return output;
			};
		});

	return renderTemplate;

};
