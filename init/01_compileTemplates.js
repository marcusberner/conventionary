
module.exports = function (sandal) {

	return function(callback) {

		sandal.resolve('templates', function(err) {
			callback(err);
		});

	};

};
