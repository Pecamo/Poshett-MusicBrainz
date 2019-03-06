import { Recording, Release, CAType, CAReleaseGroup, CAImage, AcoustidRecording, AcoustidReleaseGroup, ReleaseGroupType, ReleaseGroup } from "./types";
import request from 'request';

const VERSION = '0.1'
const USER_AGENT = `poshett/${VERSION} (https://github.com/Pecamo/Poshett-MusicBrainz)`;
const ACOUSTID_URL = 'https://api.acoustid.org/v2/lookup';

const NodeBrainz = require('nodebrainz');
const CoverArt = require('coverart');

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

const orderedRGTypes: ReleaseGroupType[] = [
	'Album',
	'EP',
	'Single',
	'Broadcast',
	'Other'
];

type AcoustidData = { img: CAImage, recording: AcoustidRecording, releaseGroup: AcoustidReleaseGroup };
type MusicBrainzData = { img: CAImage, recording: Recording, releaseGroup: ReleaseGroup };

export namespace CoverGetter {
	export function getCoverByChromaprint(duration: number, chromaprint: string): Promise<CAImage> {
		return searchRecordingsByChromaprint(duration, chromaprint)
		.then((recordings: AcoustidRecording[]) => {
			let promises: Promise<[CAImage | void, AcoustidData]>[] = [];
			recordings.forEach((recording: AcoustidRecording) => {
				recording.releasegroups.forEach((releaseGroup: AcoustidReleaseGroup) => {
					promises.push(getCoverFromReleaseGroupIdWithMore<AcoustidData>(releaseGroup.id, { img: null, recording, releaseGroup }));
				});
			});
			return Promise.all(promises)
		})
		.then((potentialTuples: [CAImage | void, AcoustidData][]) => {
			let tuples: AcoustidData[] = [];

			potentialTuples.forEach(potentialTuple => {
				if (potentialTuple) {
					let [potentialImage, data] = potentialTuple;

					if (potentialImage) {
						data.img = potentialImage;
						tuples.push(data);
					}
				}
			});

			tuples = tuples.sort((a, b) => {
				const score = b.recording.sources - a.recording.sources;

				if (score === 0) {
					return orderedRGTypes.indexOf(a.releaseGroup.type) - orderedRGTypes.indexOf(b.releaseGroup.type)
				} else {
					return score;
				}
			});

			if (tuples.length === 0) {
				throw "No image found";
			}

			return tuples[0].img;
		})
	}

	export function getCoverByTitle(title: string, artist: string): Promise<CAImage> {
		return searchRecordingsByTitle(title + '~', artist + '~')
		.then((recordings: Recording[]) => {
			return getCoverFromRecordings(recordings);
		})
	}

	function getCoverFromRecordings(recordings: Recording[]): Promise<CAImage> {
		let promises: Promise<[void | CAImage, MusicBrainzData]>[] = [];

		recordings.forEach(recording => {
			promises = promises.concat(getCoverFromRecording(recording));
		});

		return Promise.all(promises)
		.then((potentialTuples: [CAImage | void, MusicBrainzData][]) => {
			let tuples: MusicBrainzData[] = [];

			potentialTuples.forEach(potentialTuple => {
				if (potentialTuple) {
					let [potentialImage, data] = potentialTuple;

					if (potentialImage) {
						data.img = potentialImage;
						tuples.push(data);
					}
				}
			});

			tuples = tuples.sort((a, b) => {
				return orderedRGTypes.indexOf(a.releaseGroup['primary-type']) - orderedRGTypes.indexOf(b.releaseGroup['primary-type']);
			});

			return tuples[0].img;
		})
	}

	function sortByTypes(a, b) {
		return findHigherTypeIndex(a.types) - findHigherTypeIndex(b.types);

		function findHigherTypeIndex(types) {
			types = types.filter(type => orderedTypes.includes(type));
			return Math.min(...types.map(type => orderedTypes.indexOf(type)));
		}
	}

	function searchRecordingsByChromaprint(duration: number, chromaprint: string): Promise<AcoustidRecording[]> {
		return new Promise((resolve, reject) => {
			const params = {
				format: "json",
				client: "9fa6T4pIVq",
				meta: "recordings recordingids releasegroups sources",
				duration: duration,
				fingerprint: chromaprint,
			};
			
			const options = {
				url: ACOUSTID_URL,
				form: params
			};

			request.post(options, (err, res, body) => {
				if (err) {
					reject(err);
				} else if (res.statusCode !== 200) {
					reject(body);
				} else {
					let results = JSON.parse(body).results;
					const recordings: AcoustidRecording[] = results[0].recordings;

					if (recordings.length === 0) {
						reject(`No recording found for duration: ${duration}, chromaprint: ${chromaprint}`);
					}

					resolve(recordings);
				}
			});
		});
	}

	function searchRecordingsByTitle(title: string, artist: string): Promise<Recording[]> {
		let filters = {
			recording: title,
			artist: artist,
			// limit: 100
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

	function getCoverFromRecording(recording: Recording): Promise<[void | CAImage, MusicBrainzData]>[] {
		if (typeof recording.releases === 'undefined') {
			console.error(`No release for ${recording.id}`);
			return [];
		}

		let promises: Promise<[void | CAImage, MusicBrainzData]>[] = [];

		recording.releases.forEach((release: Release) => {
			let releaseGroup: ReleaseGroup = release['release-group'];
			promises.push(getCoverFromReleaseGroupIdWithMore<MusicBrainzData>(releaseGroup.id, { img: null, recording, releaseGroup }));
		});

		return promises;
	}

	function getCoverFromReleaseGroupIdWithMore<T>(rgid: string, more?: T): Promise<[CAImage | void, T]> {
		return new Promise<[CAImage | void, T]>((resolve, reject) => {
			ca.releaseGroup(rgid, (err, response: CAReleaseGroup) => {
				if (err || !response) {
					return resolve(null);
				}

				let images = response.images.sort(sortByTypes);

				resolve([images[0], more]);
			});
		});
	}
}
