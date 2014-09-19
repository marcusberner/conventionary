
module.exports = function (app) {

	return function(callback) {

		app.post('/widgets/:type', function(req, res){

			var body = '';
			req.on('data', function(data) {
				body += data;
			});
			req.on('end', function() {
				console.log('body', body);
				res.send(req.params.type);
			});
		});

		callback();
	}

};
