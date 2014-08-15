var path = require('path'),
	pattern = /(.*)\.css$/i,
	widgets = require('../widgets.js');

module.exports = function (app, options) {

	var lessCompiler = require('../utils/lessCompiler');

	if (options.lessPath) {
		app.get(path.join('/', options.lessPath, '*'), function (req, res, next) {
			var match = pattern.exec(req.path);
			if (!match) return next();
			var filePath = path.join(process.cwd(), match[1] + '.less');
			lessCompiler(filePath, function (err, css) {
				if (err) return next(err);
				if (!css) return next();
				sendCss(res, css);
			});
		});
	}

	var widgetLessPath = options.lessPath ? path.join('/', options.lessPath, '/widgets.css') : '/widgets.css',
		widgetLess = '';
	widgets.get().forEach(function(widget) {
		if (!widget.less) return;
		widgetLess += ('.widget-' + widget.name + '{ @import \''+ widget.less + '\';}');
	});

	app.get(widgetLessPath, function(req, res, next){
		if (widgetLess === '') return sendCss(res, '');
		lessCompiler('/widget.less', widgetLess, function (err, css) {
			if (err) return next(err);
			if (!css) return next();
			sendCss(res, css);
		});
	});

};

function sendCss (res, css) {
	var etag = '"' + require('crypto').createHash('md5').update(css).digest('hex') + '"';
	res.set({
		'Content-Type': 'text/css',
		'ETag': etag,
		'Cache-Control': 'max-age=31536000'
	});
	res.send(css);
}