(function (Scratch) {
    'use strict';

    class PerlinNoise {
        constructor() {
            this.seed = Math.random();
        }

        getInfo() {
            return {
                id: '3dnoise',
                name: '3D Perlin Noise',
                color1: '#b5074c',
                color2: '#990841',
                blocks: [
                    {
                        opcode: 'perlinNoise3D',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '3D perlin at x:[X] y:[Y] z:[Z]',
                        arguments: {
                            X: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: '0',
                            },
                            Y: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: '0',
                            },
                            Z: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: '0',
                            },
                        },
                    },
                ],
            };
        }

        perlinNoise3D(args) {
            const value = quickNoise.noise(args.X, args.Y, args.Z);

            return value;
        }
    }

    Scratch.extensions.register(new PerlinNoise());
})(window.Scratch = window.Scratch || {});
var quickNoise = (function() {
	'use strict';

	function buildTable(randFunc) {
		if (!randFunc) {
			randFunc = Math.random;
		}
		var arr = new Array(256).map(function(v, i) { return i; });
		for (var i = arr.length-1; i > 0; --i) {
			var r = Math.floor(randFunc() * (i+1));
			var t = arr[r];
			arr[r] = arr[i];
			arr[i] = t;
		}
		return arr;
	}

	var gradBasis = [ 1,1,0, -1,1,0, 1,-1,0, -1,-1,0, 1,0,1, -1,0,1, 1,0,-1, -1,0,-1, 0,1,1, 0,-1,1, 0,1,-1, 0,-1,-1 ]

	function initTables(tab, permTable, gradTable) {
		if (tab == null || typeof tab === 'function') {
			tab = buildTable(tab)
		}
		else if (tab.length !== 256) {
			console.error("create(): Expected array of length 256, got ", tab);
			tab = buildTable();
		}
		for (var i = 0; i < 256; ++i) {
			permTable[i] = tab[i];
			permTable[i+256] = tab[i];
		}
		var gradIdx = 0;
		for (var i = 0; i < permTable.length; ++i) {
			var v = (permTable[i]%12)*3;
			gradTable[gradIdx++] = gradBasis[v];
			gradTable[gradIdx++] = gradBasis[v+1];
			gradTable[gradIdx++] = gradBasis[v+2];
		}
	}

	var permTableSize = 256*2;
	var gradTableSize = permTableSize*3;
	var totalSize = permTableSize + gradTableSize;

	function create(tab) {
		var ab = new ArrayBuffer(totalSize);
		var permTable = new Uint8Array(ab, 0, permTableSize);
		var gradTable = new Int8Array(ab, permTableSize, gradTableSize);
		initTables(tab, permTable, gradTable);

		function noise(x, y, z, xWrap, yWrap, zWrap) {
			// coersce to integers and handle missing arguments
			xWrap = xWrap | 0;
			yWrap = yWrap | 0;
			zWrap = zWrap | 0;

			// type hints for vm
			x = +x;
			y = +y;
			z = +z;

			var xMask = ((xWrap-1) & 255) >>> 0;
			var yMask = ((yWrap-1) & 255) >>> 0;
			var zMask = ((zWrap-1) & 255) >>> 0;

			var px = Math.floor(x);
			var py = Math.floor(y);
			var pz = Math.floor(z);

			var x0 = (px+0) & xMask;
			var x1 = (px+1) & xMask;

			var y0 = (py+0) & yMask;
			var y1 = (py+1) & yMask;

			var z0 = (pz+0) & zMask;
			var z1 = (pz+1) & zMask;

			x -= px;
			y -= py;
			z -= pz;

			var u = ((x*6.0-15.0)*x + 10.0) * x * x * x;
			var v = ((y*6.0-15.0)*y + 10.0) * y * y * y;
			var w = ((z*6.0-15.0)*z + 10.0) * z * z * z;

			var r0 = permTable[x0];
			var r1 = permTable[x1];

			var r00 = permTable[r0+y0];
			var r01 = permTable[r0+y1];
			var r10 = permTable[r1+y0];
			var r11 = permTable[r1+y1];

			var h000 = permTable[r00+z0] * 3;
			var h001 = permTable[r00+z1] * 3;
			var h010 = permTable[r01+z0] * 3;
			var h011 = permTable[r01+z1] * 3;
			var h100 = permTable[r10+z0] * 3;
			var h101 = permTable[r10+z1] * 3;
			var h110 = permTable[r11+z0] * 3;
			var h111 = permTable[r11+z1] * 3;

			var n000 = gradTable[h000]*(x+0) + gradTable[h000+1]*(y+0) + gradTable[h000+2]*(z+0);
			var n001 = gradTable[h001]*(x+0) + gradTable[h001+1]*(y+0) + gradTable[h001+2]*(z-1);
			var n010 = gradTable[h010]*(x+0) + gradTable[h010+1]*(y-1) + gradTable[h010+2]*(z+0);
			var n011 = gradTable[h011]*(x+0) + gradTable[h011+1]*(y-1) + gradTable[h011+2]*(z-1);
			var n100 = gradTable[h100]*(x-1) + gradTable[h100+1]*(y+0) + gradTable[h100+2]*(z+0);
			var n101 = gradTable[h101]*(x-1) + gradTable[h101+1]*(y+0) + gradTable[h101+2]*(z-1);
			var n110 = gradTable[h110]*(x-1) + gradTable[h110+1]*(y-1) + gradTable[h110+2]*(z+0);
			var n111 = gradTable[h111]*(x-1) + gradTable[h111+1]*(y-1) + gradTable[h111+2]*(z-1);

			var n00 = n000 + (n001-n000) * w;
			var n01 = n010 + (n011-n010) * w;
			var n10 = n100 + (n101-n100) * w;
			var n11 = n110 + (n111-n110) * w;

			var n0 = n00 + (n01-n00) * v;
			var n1 = n10 + (n11-n10) * v;

			return n0 + (n1-n0) * u;
		}
		return noise;
	}

	var noise = create([
		23, 125, 161, 52, 103, 117, 70, 37, 247, 101, 203, 169, 124, 126, 44, 123,
		152, 238, 145, 45, 171, 114, 253, 10, 192, 136, 4, 157, 249, 30, 35, 72,
		175, 63, 77, 90, 181, 16, 96, 111, 133, 104, 75, 162, 93, 56, 66, 240,
		8, 50, 84, 229, 49, 210, 173, 239, 141, 1, 87, 18, 2, 198, 143, 57,
		225, 160, 58, 217, 168, 206, 245, 204, 199, 6, 73, 60, 20, 230, 211, 233,
		94, 200, 88, 9, 74, 155, 33, 15, 219, 130, 226, 202, 83, 236, 42, 172,
		165, 218, 55, 222, 46, 107, 98, 154, 109, 67, 196, 178, 127, 158, 13, 243,
		65, 79, 166, 248, 25, 224, 115, 80, 68, 51, 184, 128, 232, 208, 151, 122,
		26, 212, 105, 43, 179, 213, 235, 148, 146, 89, 14, 195, 28, 78, 112, 76,
		250, 47, 24, 251, 140, 108, 186, 190, 228, 170, 183, 139, 39, 188, 244, 246,
		132, 48, 119, 144, 180, 138, 134, 193, 82, 182, 120, 121, 86, 220, 209, 3,
		91, 241, 149, 85, 205, 150, 113, 216, 31, 100, 41, 164, 177, 214, 153, 231,
		38, 71, 185, 174, 97, 201, 29, 95, 7, 92, 54, 254, 191, 118, 34, 221,
		131, 11, 163, 99, 234, 81, 227, 147, 156, 176, 17, 142, 69, 12, 110, 62,
		27, 255, 0, 194, 59, 116, 242, 252, 19, 21, 187, 53, 207, 129, 64, 135,
		61, 40, 167, 237, 102, 223, 106, 159, 197, 189, 215, 137, 36, 32, 22, 5
	]);

	return {
		create: create,
		noise: noise
	};

}());

if (typeof module !== 'undefined' && module.exports) {
	module.exports = quickNoise;
}