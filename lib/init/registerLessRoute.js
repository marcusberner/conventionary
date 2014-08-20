var path = require('path'),
	fs = require('fs'),
	pattern = /(.*)\.css$/i,
	widgets = require('../widgets.js');

module.exports = function (app, options) {

	var lessCompiler = require('../utils/lessCompiler');

	app.get(path.join('/', options.lessPath, '*'), function (req, res, next) {
		var match = pattern.exec(req.path);
		if (!match) return next();
		var filePath = path.join(process.cwd(), match[1] + '.less');
		fs.readFile(filePath, { encoding: 'utf8' }, function (err, data) {
			if (req.query.includeWidgets === 'true') {
				widgets.get().forEach(function(widget) {
					if (!widget.less) return;
					data += ('.widget-' + widget.path.join('_') + '{ @import \''+ path.relative(path.dirname(filePath), widget.less) + '\';}');
				});
			}
			lessCompiler(filePath, data, function (err, css) {
				if (err) return next(err);
				if (!css) return next();
				sendCss(res, css);
			});

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