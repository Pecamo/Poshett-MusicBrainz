#!/usr/bin/env node

const program = require('commander');
const NodeBrainz = require('nodebrainz');
const CoverArt = require('coverart');

const nb = new NodeBrainz({userAgent:'my-awesome-app/0.0.1 ( http://my-awesome-app.com )'});
const ca = new CoverArt({userAgent:'my-awesome-app/0.0.1 ( http://my-awesome-app.com )'});

main();

function main() {
	program
	.version('0.1.0')
	.option('-a, --artist [artist]', 'Artist')
	.option('-t, --title [title]', 'Title')
	.parse(process.argv);

//	mb.searchReleases('Seven Nation Army', { artist: 'The White Stripes', limit: 1 }, (err, recordings) => {
//		console.log(recordings);
//	});

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

	nb.search('recording', { recording: 'I\'m so sick', artist: 'Flyleaf', limit: 3 }, (err, response) => {
		if (err) {
			console.error(err);
			return;
		}

		const recordings = response.recordings;

		recordings.forEach(recording => {
			if (typeof recording.releases === 'undefined') {
				console.warn(`No release for ${recording.id}`);
			}

			console.log(new Date(recording.length));

			recording.releases.forEach(release => {
				let rgid = release['release-group'].id;
				ca.releaseGroup(rgid, (err, response) => {
					if (err) {
						console.error(err);
						return;
					}

					let images = response.images.sort(sortByTypes);

					console.log(images[0].types);
					console.log(images[0].image);
				});
			});
		});
	});
}
