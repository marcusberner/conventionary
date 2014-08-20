var async = require('async'),
	swig = require('swig'),
	templateCache = {};

swig.setDefaults({ cache: false });

module.exports = renderTemplate;

function renderTemplate (templatePath, internalRequestContext, model, callback) {

	var templateFcn = templateCache[templatePath];
	if (!templateFcn) {
		templateCache[templatePath] = templateFcn = swig.compileFile(templatePath);
	}

	model = model || {};
	model.widgets = internalRequestContext.widgetRendererFactories;

	internalRequestContext.widgetRenderers = [];
	var html = templateFcn(model);

	async.parallel(internalRequestContext.widgetRenderers, function (err, renderedWidgets) {
		if (err) return callback(err);
		renderedWidgets.forEach(function (renderedWidget) {
			html = html.replace(renderedWidget.placeHolder, renderedWidget.html);
		});
		callback(null, html);
	});

};