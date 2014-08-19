var fs = require('fs'),
	async = require('async'),
	swig = require('swig'),
	templateCache = {};

swig.setDefaults({ cache: false });

module.exports = renderTemplate;

function renderTemplate (templatePath, internalRequestContext, model, callback) {

	var template = templateCache[templatePath] || fs.readFileSync(templatePath, {
			encoding: 'utf8'
		});

	if (!templateCache[templatePath]) templateCache[templatePath] = template;

	model = model || {};
	model.widgets = internalRequestContext.widgetRendererFactories;

	internalRequestContext.widgetRenderers = [];
	var html = swig.render(template, { locals: model, filename: templatePath });

	async.parallel(internalRequestContext.widgetRenderers, function (err, renderedWidgets) {
		if (err) return callback(err);
		renderedWidgets.forEach(function (renderedWidget) {
			html = html.replace(renderedWidget.placeHolder, renderedWidget.html);
		});
		callback(null, html);
	});

};