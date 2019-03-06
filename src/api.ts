import express from 'express';
import { CoverGetter } from './CoverGetter';
import { CAImage } from './types';

export class ApiServer {
	public launchServer() {
		const app = express();

		app.post('/chromaprint', (req, res) => {
			const chromaprint = req.param('chromaprint');
			const duration = parseInt(req.param('duration'));

			CoverGetter.getCoverByChromaprint(duration, chromaprint)
			.then((img: CAImage) => {
				res.send(img.image);
			})
			.catch(err => {
				res.sendStatus(404);
			});
		});

		app.listen(3100, function () {
			console.log('Api listening on port 3100!');
		});
	}
}
