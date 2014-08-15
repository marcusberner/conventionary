var path = require('path'),
	fs = require('fs'),
	glob = require('glob'),
	uglify = require('uglify-js'),
	widgets = require('../widgets.js');

module.exports = function (app, options) {

	var scriptPath = options.scriptPath ? options.scriptPath : '/',
		scriptUrl = path.join('/', scriptPath, '/all.js'),
		scriptMapUrl = scriptUrl + '.map',
		scripts = [];

	if (options.scriptPath) {
		scripts = scripts.concat(glob.sync(path.join(process.cwd(), scriptPath, '/**/*.js')).map(function (file) {
			return {
				file: file,
				url: file.substring(process.cwd().length)
			}
		}));
	}

	widgets.get().forEach(function(widget) {
		scripts = scripts.concat(widget.scripts.map(function (file) {
			return {
				file: file,
				url: path.join('/', scriptPath, file.substring(process.cwd().length))
			}
		}));
	});

	scripts.forEach(function (script) {
		app.get(script.url, function (req, res, next) {
			fs.readFile(script.file, function (err, data) {
				if (err) next(err);
				sendScript(res, data);
			});
		});
	});

	app.get(scriptUrl, function(req, res){
		sendScript(res, uglify.minify(scripts.map(function(script) { return script.file; })).code + '\n//# sourceMappingURL=' + scriptMapUrl);
	});

	app.get(scriptMapUrl, function(req, res){
		var map = uglify.minify(scripts.map(function(script) { return script.file; }), { outSourceMap: scriptMapUrl }).map;
		scripts.forEach(function (script) {
			map = map.replace('"' + script.file + '"', '"' + script.url + '"');
		});
		sendScript(res, map);
	});

};

function sendScript (res, script) {
	var etag = '"' + require('crypto').createHash('md5').update(script).digest('hex') + '"';
	res.set({
		'Content-Type': 'text/javascript',
		'ETag': etag,
		'Cache-Control': 'max-age=31536000'
	});
	res.send(script);
}