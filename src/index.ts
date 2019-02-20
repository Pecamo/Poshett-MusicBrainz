import { Recording, Release, ReleaseGroup, CAType, CAReleaseGroup, CAImage } from "./types";

const NodeBrainz = require('nodebrainz');
const CoverArt = require('coverart');
const PoshettWeb = require('../../Poshett-web/dist').default;
const VERSION = '0.1'

const USER_AGENT = `poshett/${VERSION} (https://github.com/Pecamo/Poshett-MusicBrainz)`;
const nb = new NodeBrainz({ userAgent: USER_AGENT });
const ca = new CoverArt({ userAgent: USER_AGENT });

const orderedTypes: CAType[] = [
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

export function getCover(title: string, artist: string): Promise<CAImage> {
	return searchRecordings(title, artist)
	.then(recordings => {
		let promises: Promise<void | CAImage>[] = [];

		recordings.forEach(recording => {
			promises = promises.concat(searchReleaseGroup(recording));
		});

		return Promise.all(promises);
	})
	.then((potentialImages: (void | CAImage)[]) => {
		let images: CAImage[] = potentialImages.filter((image): image is CAImage => !!image);

		images.forEach(image => {
			console.log(image.types);
			console.log(image.image);
		});

		return images[0];
	})
}

function sortByTypes(a, b) {
	return findHigherTypeIndex(a.types) - findHigherTypeIndex(b.types);

	function findHigherTypeIndex(types) {
		types = types.filter(type => orderedTypes.includes(type));
		return Math.min(...types.map(type => orderedTypes.indexOf(type)));
	}
}

function searchRecordings(title, artist): Promise<Recording[]> {
	let filters = {
		recording: title,
		artist: artist,
		limit: 3
	};

	return new Promise((resolve, reject) => {
		nb.search('recording', filters, (err, response) => {
			if (err) {
				reject(err);
			}

			const recordings: Recording[] = response.recordings;

			if (response.recordings.length === 0) {
				reject(`No recording found for title: ${title}, artist: ${artist}`);
			}

			// TODO Handle other recordings (i.e. _I'm so sick_ by _Flyleaf_)
			// TODO Use time to select the closest recording
			resolve(recordings);
		});
	});
}

function searchReleaseGroup(recording: Recording): Promise<void | CAImage>[] {
	if (typeof recording.releases === 'undefined') {
		console.error(`No release for ${recording.id}`);
		return [];
	}

	let promises: Promise<void | CAImage>[] = [];

	recording.releases.forEach((release: Release) => {
		let rgid = release['release-group'].id;
		let promise: Promise<void | CAImage> = new Promise<CAImage>((resolve, reject) => {
			ca.releaseGroup(rgid, (err, response: CAReleaseGroup) => {
				if (err || !response) {
					return reject(err);
				}

				let images = response.images.sort(sortByTypes);

				resolve(images[0]);
			});
		})
		.catch(err => {
			console.error(err);
		})

		promises.push(promise);
	});

	return promises;
}

if (require.main === module) {
	const poshett = new PoshettWeb();

	poshett.initServer();
	poshett.startServer();

	setTimeout(() => {
		getCover(`Breathe`, 'The Prodigy')
		.then(img => {
			console.log(img.image);
			poshett.setCurrentMusic({ imgUrl: img.image });
		})
	}, 100);
}
