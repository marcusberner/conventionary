var path = require('path'),
	fs = require('fs');

module.exports = function (app, options, lessCompiler, widgets, siteSandal) {

	return function (callback) {

		var virtualStyleFolder = '/style';

		app.get(path.join(virtualStyleFolder, '*'), function (req, res, next) {
			getFilePathAndType(req.path, function (pathAndType) {
				if (!pathAndType) return next();
				getLess(siteSandal, req, pathAndType, function (err, data) {
					if (req.query.includeWidgets === 'true') {
						widgets.forEach(function(widget) {
							if (!widget.less) return;
							if (widget.wrap) data += ('.widget-' + widget.path.join('_') + '{');
							data += (' @import \''+ path.relative(path.dirname(pathAndType.path), widget.less) + '\'; ');
							if (widget.wrap) data += '}';
						});
					}
					lessCompiler(pathAndType.path, data, function (err, css) {
						if (err) return next(err);
						if (!css) return next();
						sendCss(res, css);
					});
				});
			});
		});

		callback();

	};

};

function getLess (siteSandal, req, pathAndType, callback) {
	if (pathAndType.type === 'less') {
		fs.readFile(pathAndType.path, { encoding: 'utf8' }, callback);
	} else {
		siteSandal.resolveAsFactory(require(pathAndType.path), function (err, getData) {
			getData(req, callback);
		});
	}
}

function getFilePathAndType (reqPath, callback) {
	var pattern = /(.*)\.css$/i,
		match = pattern.exec(reqPath);
	if (!match) return callback();
	var lessFilePath = path.join(process.cwd(), match[1] + '.less'),
		jsFilePath = path.join(process.cwd(), match[1] + '.js');
	fs.exists(lessFilePath, function (exists) {
		if (exists) return callback({ path: lessFilePath, type: 'less' });
		fs.exists(jsFilePath, function (exists) {
			if (exists) return callback({ path: jsFilePath, type: 'js' });
			callback();
		});
	});
}

function sendCss (res, css) {
	var etag = '"' + require('crypto').createHash('md5').update(css).digest('hex') + '"';
	res.set({
		'Content-Type': 'text/css',
		'ETag': etag,
		'Cache-Control': 'max-age=31536000'
	});
	res.send(css);
}