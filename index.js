var path = require('path'),
	fs = require('fs'),
	async = require('async'),
	Sandal = require('sandal').extend(require('sandal-autowire'));

module.exports = function(options, callback) {

	if (!callback) {
		callback = options;
		options = {};
	}

	setDefaults(options);

	var sandal = new Sandal(),
		siteSandal = new Sandal(),
		express = require('express'),
		swig,
		app = express();

	// Clear swig from require cache to enable multiple instances in same app
	Object.keys(require.cache).forEach(function (cacheKey) {
		if (cacheKey.split(path.sep).indexOf('swig') >= 0) delete require.cache[cacheKey];
	});
	swig = require('swig');

	registerSiteDependencies(siteSandal, options, express, swig, app);
	registerInternalDependencies(sandal, siteSandal, options, express, swig, app);

	siteSandal.resolve('init', function (err, siteInit) {
		if (err) return callback(err);
		async.series(toSortedList(siteInit), function (err) {
			if (err) return callback(err);
			sandal.resolve(['init', 'app'], function (err, fwInit, app) {
				if (err) return callback(err);
				async.series(toSortedList(fwInit), function (err) {
					if (err) return callback(err);
					callback(null, app);
				});
			});
		});
	});

};

function setDefaults(options) {
	options.dictionaries = options.dictionaries || [];
	options.staticRoot = options.staticRoot || '/public';
	options.lessPath = toAbsolutePath(options.lessPath || './style');
	options.staticPath = toAbsolutePath(options.staticPath || './public');
	options.scriptPath = toAbsolutePath(options.scriptPath || './script');
	options.libPath = toAbsolutePath(options.libPath || './lib');
	options.initPath = toAbsolutePath(options.initPath || './init');
	options.widgetPath = toAbsolutePath(options.widgetPath || './widgets');
	options.routePath = toAbsolutePath(options.routePath || './routes');
}

function toAbsolutePath(input) {
	if (input.indexOf('./') === 0 || input.indexOf('../') === 0) return path.join(process.cwd(), input).replace(/\/$/, '');
	return input.replace(/\/$/, '');
}

function registerSiteDependencies(siteSandal, options, express, swig, app) {
	siteSandal
		.object('express', express)
		.object('swig', swig)
		.object('app', app);
	if (options.dependencies) {
		for (var name in options.dependencies) {
			siteSandal.object(name, options.dependencies[name]);
		}
	}
	if (fs.existsSync(options.initPath)) {
		siteSandal.autowire(options.initPath, { groups: ['init'] });
	}
	if (fs.existsSync(options.libPath)) {
		siteSandal.autowire(options.libPath);
	}
	if (!siteSandal.has('init')) siteSandal.object('init', {});
}

function registerInternalDependencies(sandal, siteSandal, options, express, swig, app) {
	sandal
		.object('siteSandal', siteSandal)
		.object('options', options)
		.object('express', express)
		.object('swig', swig)
		.object('app', app)
		.autowire(path.join(__dirname, '/init'), { groups: ['init'] })
		.autowire(path.join(__dirname, '/lib'));
}

function toSortedList(init) {
	return Object.keys(init).sort().map(function (key) {
		return function (done) {
			init[key](done);
		};
	});
}
