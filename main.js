var fs = require('fs'),
	util = require('util');

var file = '1pxwhite.png';



var Png = function(filepath) {
	var headerLen = 8;
	var doneParsing;

	var palette = null;

	function throwcorrupt() {
		throw 'image data is corrupt';
	}

	return {
		pixeldata: [],

		width: null,
		height: null,
		bitdepth: null,
		colortype: null,
		compressionmode: null,
		filtermode: null,
		interlacemode: null,

		_chunkmap: {
			'IHDR': function(chunk) {
				this.width = chunk.content[0] + chunk.content[1] + chunk.content[2] + chunk.content[3];
				this.height = chunk.content[4] + chunk.content[5] + chunk.content[6] + chunk.content[7];
				this.bitdepth = chunk.content[8];
				this.colortype = chunk.content[9];
				this.compressionmode = chunk.content[10];
				this.filtermode = chunk.content[11];
				this.interlacemode = chunk.content[12];
			},
			'PLTE': function(chunk) {},
			'IDAT': function(chunk) {
				if (!this.width || !this.height)
					throwcorrupt();
				if (this.colortype === 3 && !palette)
					throwcorrupt();

				console.log('hex [ {0} ]'.format([].slice.apply(chunk.content).map(function(val) {
					return val.toString(16);
				}).join(' ')));
				console.log('dec [ {0} ]'.format([].slice.apply(chunk.content).map(function(val) {
					return val;
				}).join(' ')));
			},
			'IEND': function(chunk) {
				doneParsing = true;
			}
		},

		validateType: function(data) {
			var header = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
			return !header.some(function(val, index) {
				return data[index] !== val;
			});
		},

		parse: function(data) {
			doneParsing = false;

			if (!this.validateType(data))
				throw 'error : [ image is not png format ]';

			var index = headerLen;
			var length = data.length;
			while (!doneParsing && index < length) {
				var chunk = this.parseChunk(data, index);

				index += chunk.length;
			}
		},

		parseChunk: function(data, startindex) {
			var i = startindex;
			var chunksize = data[i] + data[i + 1] + data[i + 2] + data[i + 3];
			i += 4;
			var chunktype = String.fromCharCode.apply(String, data.slice(i, i + 4));
			i += 4;

			var chunk = {
				type: chunktype,
				content: data.slice(i, i + chunksize),
				length: chunksize + 12 // total length is 12 bytes + chunksize
			};

			if (this._chunkmap[chunktype]) {
				this._chunkmap[chunktype].call(this, chunk);
			}

			return chunk;
		}
	};
};

fs.readFile(file, function(err, data) {
	if (err) {
		throw err;
	}

	var png = new Png();
	png.parse(data);

	console.log(util.inspect(png));

});



/** Format */
if (!String.prototype.format) {
	String.prototype.format = function() {
		var args = arguments;
		return this.replace(/{(\d+)}/g, function(match, number) {
			return typeof args[number] != 'undefined' ? args[number] : match;
		});
	};
}