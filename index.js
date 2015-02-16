var http = require('http'),
	path = require('path'),
	fs = require('fs'),
	async = require('async'),
	Sandal = require('sandal').extend(require('sandal-autowire'));

module.exports = function(options, callback) {

	if (!callback) {
		callback = options;
		options = {};
	}

	if (!(options instanceof Array)) {
		return createSite(options, function (err, app) {
			if (err) return callback(err);
			callback(null, http.createServer(function (req, res) {
				app(req, res);
			}));
		});
	}

	var error = optionsArrayError(options);
	if (error) return callback(error);

	var startedSites = 0;
	var siteCount = options.length;
	var requestQueue = [];

	var apps = options.reduce(function (apps, options) {
		createSite(options, function (err, app) {
			if (err) {
				console.error(err.stack);
				process.exit(-1);
			}
			options.hosts.forEach(function (host) {
				apps[host] = app;
			});
			startedSites++;
			if (startedSites === siteCount && requestQueue) {
				requestQueue.forEach(function (requestQueueItem) {
					requestQueueItem();
				});
				requestQueue = null;
			}
		});
		return apps;
	}, {});

	if (error) return callback(error);

	callback(null, http.createServer(function (req, res) {
		if (!req || !req.headers || !req.headers.host) {
			res.writeHead(400, {'Content-Type': 'text/plain'});
			res.end('No host header provided\n');
			return;
		}
		var requestQueueItem = function () {
			var app = apps[req.headers.host] || apps['*'];
			if (!app) {
				res.writeHead(404, {'Content-Type': 'text/plain'});
				res.end('Site with host ' + req.headers.host + ' is not available\n');
				return;
			}
			app(req, res);
		};
		if (!apps[req.headers.host] && !apps['*'] && requestQueue) requestQueue.push(requestQueueItem);
		else requestQueueItem();

	}));

};

function optionsArrayError(optionsArray) {
	var hosts = [],
		error = null;
	optionsArray.some(function (options) {
		if (!options.hosts || !(options.hosts instanceof Array) || options.hosts.length === 0) {
			error = new Error('All sites does not have host configured');
		} else {
			options.hosts.some(function (host) {
				if (hosts.indexOf(host) >= 0) {
					error = new Error('There are duplicates in the host configuration (' + host + ')');
					return true;
				}
				hosts.push(host);
			});
		}
		return !!error;
	});
	return error;
}

function createSite(options, callback) {

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
}

function setDefaults(options) {
	options.version = options.version || require(path.join(process.cwd(), 'package.json')).version;
	options.dictionaries = options.dictionaries || [];
	options.staticRoot = options.staticRoot || '/public';
	options.lessPath = toAbsolutePath(options.lessPath || './style');
	options.staticPath = toAbsolutePath(options.staticPath || './public');
	options.scriptPath = toAbsolutePath(options.scriptPath || './script');
	options.libPath = toAbsolutePath(options.libPath || './lib');
	options.initPath = toAbsolutePath(options.initPath || './init');
	options.widgetPath = toAbsolutePath(options.widgetPath || './widgets');
	options.routePath = toAbsolutePath(options.routePath || './routes');
	options.routeMap = options.routeMap || function (model, options, callback) {
		callback(null, model, options);
	};
	options.widgetMap = options.widgetMap || function (model, options, callback) {
		callback(null, model, options);
	};
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
