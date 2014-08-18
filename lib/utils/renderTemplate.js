var fs = require('fs'),
	async = require('async'),
	swig = require('swig'),
	widgets = require('../widgets.js');

swig.setDefaults({ cache: false });

module.exports = renderTemplate;

function renderTemplate (templatePath, pageContext, model, callback) {

	if (!pageContext.hasOwnProperty('widgetIterator')) pageContext.widgetIterator = 0;

	var template = fs.readFileSync(templatePath, {
		encoding: 'utf8'
	}),
		widgetLoaders = {};

	model.widgets = {};

	widgets.get().forEach(function (widget) {

		var nameSpace = model.widgets,
			name = widget.path[widget.path.length - 1];
		for (var i = 0; i < widget.path.length - 1; i++) {
			nameSpace[widget.path[i]] = nameSpace[widget.path[i]] || {};
			nameSpace = nameSpace[widget.path[i]];
		}
		nameSpace[name] = function (data) {
			var identifier = 'widget-' + widget.path.join('_') + '-' + ++pageContext.widgetIterator;
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
			html = html.replace('<!-' + identifier + '->', '<div id="' + identifier + '" class="' + identifier.replace(/-\d+$/, '') + '">\n' + widgetHtml[identifier] + '\n</div>');
		}
		callback(null, html);
	});

};