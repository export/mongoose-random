function random(schema, options) {
	options = options || {};
	var randFn = options.fn || Math.random;
	var randCoords = function () { return [randFn(), randFn()] };
	var path = options.path || 'random';

	var field = {};
	field[path] = [{type: Number}];

	var index = {};
	index[path] = '2dsphere';

	schema.add(field);
	schema.index(index);

	schema.statics.qRand = function (conditions) {
		if ( ! conditions || typeof conditions === 'function')
			conditions = {};

		conditions[path] = conditions[path] || {
			$near: {
				$geometry: {
					type: 'Point',
					coordinates: randCoords()
				}
			}
		};

		return conditions;
	};

	schema.statics.syncRand = function (callback) {
		var self = this;
		var stream = self.find({}).stream({ transform: transform });
		var result = {
			attempted: 0,
			updated: 0
		};
		var left = 0;
		var streamEnd = false;

		stream.on('data', function (doc) {
			result.attempted += 1;
			left += 1;
			doc.save(function (err) {
				if (err)
					console.error(err.stack);
				else
					result.updated += 1;

				left -= 1;
				if (streamEnd && !left)
					return callback(null, result);
			});
		}).on('error', function (err) {
			console.error(err.stack);
		}).on('end', function () {
			streamEnd = true;
		});
		return stream;
	};

	function transform(doc) {
		var update = randCoords();
		doc.set(path, update);
		return doc;
	}
}

module.exports = random;