const NodeBrainz = require('nodebrainz');
const CoverArt = require('coverart');
const PoshettWeb = require('../Poshett-web/dist').default;
const VERSION = '0.1'

const USER_AGENT = `poshett/${VERSION} (https://github.com/Pecamo/Poshett-MusicBrainz)`;
const nb = new NodeBrainz({ userAgent: USER_AGENT });
const ca = new CoverArt({ userAgent: USER_AGENT });

function getCover(title, artist) {
	const orderedTypes = [
		'Track',
		'Front',
		'Back',
		'Medium',
		'Raw/Unedited',
		'Booklet',
		'Tray',
		'Liner',
		'Poster'
	];

	function sortByTypes(a, b) {
		return findHigherTypeIndex(a.types) - findHigherTypeIndex(b.types);

		function findHigherTypeIndex(types) {
			types = types.filter(type => orderedTypes.includes(type));
			return Math.min(...types.map(type => orderedTypes.indexOf(type)));
		}
	}

	return new Promise((resolve, reject) => {
		nb.search('recording', { recording: title, artist: artist, limit: 3 }, (err, response) => {
			if (err) {
				return reject(err);
			}

			const recordings = response.recordings;

			if (response.recordings.length === 0) {
				return reject(`No recording found for title: ${title}, artist: ${artist}`);
			}

			// TODO Handle other recordings (i.e. _I'm so sick_ by _Flyleaf_)
			// TODO Use time to select the closest recording
			let recording = recordings[0];
			if (typeof recording.releases === 'undefined') {
				return reject(`No release for ${recording.id}`);
			}

			console.log(new Date(recording.length));

			recording.releases.forEach(release => {
				let rgid = release['release-group'].id;
				ca.releaseGroup(rgid, (err, response) => {
					if (err) {
						if (err.statusCode === 404) {
							console.warn(`No cover found for release-group: ${rgid}`);
						} else {
							console.log(err);
						}

						return;
					}

					let images = response.images.sort(sortByTypes);

					console.log(images[0].types);
					console.log(images[0].image);
					resolve(images[0]);
				});
			});
		});
	});
}

if (require.main === module) {
	const poshett = new PoshettWeb();

	poshett.initServer();
	poshett.startServer();

	setTimeout(() => {
		getCover(`I'm so sick`, 'Flyleaf')
		.then(img => {
			console.log(img.image);
			poshett.setCurrentMusic({ imgUrl: img.image });
		})
		.catch((err) => {
			console.error(err);
		});
	}, 5000);
}

module.exports = getCover;
