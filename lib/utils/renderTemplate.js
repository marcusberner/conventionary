var async = require('async');;

module.exports = function (swig) {

	swig.setDefaults({ cache: false });

	var templateCache = {};
	var renderTemplate = function(templatePath, requestContext, model, callback) {

		var templateFcn = templateCache[templatePath];
		if (!templateFcn) {
			templateCache[templatePath] = templateFcn = swig.compileFile(templatePath);
		}

		model = model || {};
		model.widgets = requestContext.widgetRendererFactories;

		requestContext.widgetRenderers = [];
		var html = templateFcn(model);

		async.parallel(requestContext.widgetRenderers, function (err, renderedWidgets) {
			if (err) return callback(err);
			renderedWidgets.forEach(function (renderedWidget) {
				html = html.replace(renderedWidget.placeHolder, renderedWidget.html);
			});
			callback(null, html);
		});

	};

	return renderTemplate;

};
