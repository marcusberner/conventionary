var fs = require('fs'),
	async = require('async'),
	swig = require('swig'),
	widgets = require('../widgets.js');

swig.setDefaults({ cache: false });

module.exports = renderTemplate;

function renderTemplate (templatePath, pageContext, model, callback) {

	var template = fs.readFileSync(templatePath, {
		encoding: 'utf8'
	}),
		widgetLoaders = {},
		widgetIterator = 0;

	model.widgets = {};

	widgets.get().forEach(function (widget) {
		model.widgets[widget.name] = function (data) {
			var identifier = 'widget-' + widget.name + '-' + ++widgetIterator;
			widgetLoaders[identifier] = function (widgetRendered) {
				widget.test(pageContext, data, function (err, result) {
					if (err) return widgetRendered(err);
					if (!result) return widgetRendered(null, '');
					widget.factory(pageContext, data, function (err, widgetModel) {
						renderTemplate(widget.template, pageContext, widgetModel, widgetRendered);
					});
				});
			}
			return '<!-' + identifier + '->';
		};
	});


	var html = swig.render(template, { locals: model, filename: templatePath });

	async.parallel(widgetLoaders, function (err, widgetHtml) {
		if (err) return callback(err);
		for (var identifier in widgetHtml) {
			html = html.replace('<!-' + identifier + '->', '<div id="' + identifier + '" class="' + identifier.replace(/-\d+$/, '') + '">' + widgetHtml[identifier] + '</div>');
		}
		callback(null, html);
	});

};