const NodeBrainz = require('nodebrainz');
const CoverArt = require('coverart');
const VERSION = '0.1'

const USER_AGENT = `poshett/${VERSION} (https://github.com/Pecamo/Poshett-MusicBrainz)`;
const nb = new NodeBrainz({ userAgent: USER_AGENT });
const ca = new CoverArt({ userAgent: USER_AGENT });

export function getCover(title, artist) {
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

	let promise = new Promise((resolve, reject) => {
		nb.search('recording', { recording: title, artist: artist, limit: 3 }, (err, response) => {
			if (err) {
				reject(err);
			}

			const recordings = response.recordings;

			if (response.recordings.length === 0) {
				reject(`No recording found for title: ${title}, artist: ${artist}`);
			}

			// TODO Handle other recordings (i.e. _I'm so sick_ by _Flyleaf_)
			// TODO Use time to select the closest recording
			let recording = recordings[0];
			if (typeof recording.releases === 'undefined') {
				reject(`No release for ${recording.id}`);
			}

			console.log(new Date(recording.length));

			recording.releases.forEach(release => {
				let rgid = release['release-group'].id;
				ca.releaseGroup(rgid, (err, response) => {
					if (err) {
						reject(err);
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

module.exports = getCover;
