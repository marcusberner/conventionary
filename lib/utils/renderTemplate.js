var async = require('async'),
	path = require('path');

module.exports = function (swig, widgets, renderWidget, templates, randomString) {

	swig.setDefaults({ cache: false });

	var factories = {},
		renderWidgets = [];

	var renderTemplate = function(templatePath, model, context, callback) {

		if (!callback) {
			callback = context;
			context = {};
		}

		var templateFcn = templates[templatePath];
		if (!templateFcn) return callback(new Error('Template ' + templatePath + ' does not exist'));

		model = model || {};
		model.widgets = factories;
		renderWidgets = [];
		var html = templateFcn(model);
		async.parallel(renderWidgets.map(function (renderWidget) {
			return function (widgetRenderedCallback) {
				renderWidget(context, widgetRenderedCallback);
			}
		}), function (err, renderedWidgets) {
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

			nameSpace[name] = function (params, options) {
				params = params || {};
				options = options || {};
				var placeHolder = '<!-' + randomString() + '->';
				renderWidgets.push(function (context, widgetRenderedCallback) {
					renderWidget(widget, params, options, renderTemplate, context, function (err, html) {
						if (err) return widgetRenderedCallback(err);
						widgetRenderedCallback(null, {
							placeHolder: placeHolder,
							html: html
						})
					});
				});
				return placeHolder;
			};

		});

	return renderTemplate;

};
