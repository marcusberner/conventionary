var path = require('path'),
	fs = require('fs'),
	glob = require('glob'),
	uglify = require('uglify-js');

module.exports = function (app, widgets, options) {

	return function (callback) {

		var cache = {},
			virtualScriptFolder = '/script',
			allScriptUrl = virtualScriptFolder + '/all.js',
			allScriptMapUrl = virtualScriptFolder + '/all.js.map',
			scripts;

		scripts = glob.sync(path.join(options.scriptPath, '/**/*.js')).map(function (file) {
			return {
				file: file,
				url: file.substring(options.scriptPath.length)
			}
		});

		widgets.forEach(function(widget) {
			scripts = scripts.concat(widget.scripts.map(function (file) {
				return {
					file: file,
					url: path.join(virtualScriptFolder, '/widgets', file.substring(options.widgetPath.length))
				}
			}));
		});

		app.get(allScriptUrl, function(req, res){
			if (cache[req.url]) return sendScript(res, cache[req.url]);
			if (!scripts) return sendScript(res, '');
			cache[req.url] = uglify.minify(scripts.map(function(script) { return script.file; })).code + '\n//# sourceMappingURL=' + allScriptMapUrl;
			sendScript(res, cache[req.url]);
		});

		app.get(allScriptMapUrl, function(req, res){
			if (!scripts) return sendScript(res, '');
			var map = uglify.minify(scripts.map(function(script) { return script.file; }), { outSourceMap: allScriptMapUrl }).map;
			scripts.forEach(function (script) {
				map = map.replace('"' + script.file + '"', '"' + script.url + '"');
			});
			sendScript(res, map);
		});

		// TODO: Should be one route
		scripts.forEach(function (script) {
			app.get(script.url, function (req, res, next) {
				fs.readFile(script.file, function (err, data) {
					if (err) next(err);
					sendScript(res, data);
				});
			});
		});



		callback();

	}

};

function sendScript(res, script) {
	var etag = '"' + require('crypto').createHash('md5').update(script).digest('hex') + '"';
	res.set({
		'Content-Type': 'text/javascript',
		'ETag': etag,
		'Cache-Control': 'max-age=31536000'
	});
	res.send(script);
}

