const express = require('express');
const router = express.Router();
const request = require('request');
const omdb = require('imdb-api');
var imdb = require('imdb');

const Library = require('../models/library');

function parseJsonEztv(json) {
	const wordsToRemove = [
		'x264',
		'WEB',
		'h264',
		'PDTV',
		'XviD',
		'MP3',
		'avi',
		'EZTV',
		'BBC',
		'HDTV',
		'AAC',
		'mkv',
		'PROPER',
		'mp4',
		'READNFO'
	];
	let title = json.title,
		response = {};

	for (i = 0; i < wordsToRemove.length; i++) {
		title = title.replace(wordsToRemove[i], '');
	}

	const seasonBased = /S?0*(\d+)?[xE]0*(\d+)/; // Match saison / episode si existant
	const dateBased = /(\d{4}).(\d{2}.\d{2})/;
	const vtv = /(\d{1,2})[x](\d{2})/;
	const dateYearBased = /(190[0-9]|200[0-9]|201[0-7])/; // Match la date de sortie entre 1900 && 2017 si existante
	const imdbBased = /\/title\/(.*)\//; // Match imdb code si existant
	const minusWordBased = /-(.*)/;
	let titleRegex = json.title.match(/(.+) s?(\d+)[ex](\d+)(e(\d+))?(.*)/i);

	if (titleRegex) {
		response.title = titleRegex[1];
		response.season = parseInt(titleRegex[2]);
		response.episode = parseInt(titleRegex[3]);
		response.episode2 = parseInt(titleRegex[5]);
		response.episodeTitle = titleRegex[6].trim();
		response.proper = response.episodeTitle.toLowerCase().indexOf('proper') >= 0;
		response.repack = response.episodeTitle.toLowerCase().indexOf('repack') >= 0;
		for (i = 0; i < wordsToRemove.length; i++) {
			response.episodeTitle = response.episodeTitle.replace(wordsToRemove[i], '').trim();
		}
		const removeWord = response.episodeTitle.match(minusWordBased);

		if (removeWord) {
			response.episodeTitle = response.episodeTitle.replace(removeWord[0], '').trim();
		}
	}

	// Recupere et supprime la qualite du titre si existante
	response.quality = json.title.match(/(\d{3,4})p/) ? json.title.match(/(\d{3,4})p/)[0] : '480p';
	if (!titleRegex) {
		title = title.replace(response.quality, '');
	} else {
		response.episodeTitle = response.episodeTitle.replace(response.quality, '');
	}

	// Recupere l'annee si existante
	response.year = json.title.match(dateYearBased) ? json.title.match(dateYearBased)[0] : -1;
	if (!titleRegex) {
		title = title.replace(response.year, '');
	}

	// Recupere imdb code et supprime du titre si existant
	response.imdb_code = json.title.match(imdbBased) ? json.title.match(imdbBased)[0] : (response.imdb_code = '');
	if (!titleRegex) {
		title = title.replace(response.imdb_code, '');
	}

	// // Recupere l'id
	response.idEztv = json.id;

	// // Recupere images
	response.largeImage = json.large_screenshot;
	response.smallImage = json.small_screenshot;

	// Recupere le nb de seeds
	response.peers = json.peers;
	// Recupere le nb de peers
	response.seeds = json.seeds;

	// Recupere le lien magnet
	response.magnet = json.magnet_url;

	if (!titleRegex) {
		// Recupere et supprime du titre le num de Saison et le num de l'episode
		if (title.match(seasonBased) || title.match(vtv)) {
			response.season = parseInt(title.match(seasonBased)[1], 10);
			response.episode = parseInt(title.match(seasonBased)[2], 10);
			title = title.replace(title.match(/S[0-9][0-9]/i), '').replace(title.match(/E[0-9][0-9]/i), '');
		} else if (title.match(dateBased)) {
			response.season = title.match(dateBased)[1];
			response.episode = title.match(dateBased)[2].replace(/\s/g, '-');
		}

		// Recupere le titre avec la var title nettoyer de tout le reste
		response.title = title.trim();
	}

	return response;
}

function saveEztvListInCollection(json, allJson) {
	const response = parseJsonEztv(json);
	let cover = '';

	if (response.largeImage && response.largeImage.length && response.largeImage !== 'N/A') {
		cover = response.largeImage.replace('//', '');
	} else if (response.smallImage && response.smallImage.length && response.smallImage !== 'N/A') {
		cover = response.smallImage.replace('//', '');
	} else {
		cover = '/movies/not-available.png';
	}
	const movie = new Library({
		id_movie_eztv: response.idEztv,
		imdb_code: response.imdb_code,
		rating: -1,
		title: response.title.trim(),
		title_episode: response.episodeTitle ? response.episodeTitle.trim() : '',
		original_title: json.title,
		cover: cover,
		year: response.year,
		season: response.season ? response.season : -1,
		episode: response.episode ? response.episode : -1,
		quality: response.quality,
		magnet: response.magnet
	});

	Library.findOne({ id_movie_eztv: movie.id_movie_eztv }, (err, res) => {
		if (err) {
			console.error(err);
			return false;
		}
		if (res) {
			return;
		}
		omdb
			.get(movie.title, { apiKey: '7c212437' })
			.then((things) => {
				if (!things) {
					throw 'There is not imdbcode for ' + movie.title;
				}

				movie.imdb_code = things.imdbid;
				movie.year = things.year ? things.year : movie.year;
				movie.rating = things.rating !== 'N/A' ? things.rating : -1;
				movie.actors = things.actors ? things.actors : '';
				movie.country = things.country ? things.country : '';
				movie.genres = things.genres ? things.genres : '';
				movie.summary = things.plot ? things.plot : '';
				movie.cover = movie.cover === '/movies/not-available.png' ? things.poster : movie.cover;
				movie.cover = movie.cover !== 'N/A' ? movie.cover : '/movies/not-available.png';
				movie.cover2 = things.poster;

				if (movie.cover.search('ezimg.ch') != -1) {
					movie.cover = 'https://' + movie.cover;
				}
				if (movie.cover2.search('ezimg.ch') != -1) {
					movie.cover2 = 'https://' + movie.cover2;
				}
				if (!things.series) {
					return movie;
				}

				return new Promise((resolve, reject) => {
					things.episodes((err, data) => {
						if (err) {
							return reject(err);
						}
						data.map((episode) => {
							debugger;
							if (episode.season == movie.season && episode.episode == movie.episode) {
								movie.imdb_code = episode.imdbid;
								movie.rating =
									episode.rating && episode.rating !== 'N/A' ? episode.rating : movie.rating;
								if (movie.title_episode === '') {
									movie.title_episode = episode.name;
								}
								const date = new Date(episode.released);
								const year = date.getFullYear();

								if (year) {
									movie.year = year;
								}
							}
						});
						return resolve(movie);
					});
				}).then((movie) => {
					return new Promise((resolve, reject) => {
						imdb(movie.imdb_code, (err, data) => {
							if (err || !data) {
								return resolve(movie);
							}

							if (data.rating && data.rating != movie.rating && data.rating !== 'N/A') {
								movie.rating = parseInt(data.rating, 10);
							}
							if (data.description && (!movie.plot || movie.plot !== data.description)) {
								movie.summary = data.description;
							}
							if (data.poster && movie.cover === movie.cover2 && data.poster !== movie.cover) {
								movie.cover = data.poster;
							}
							movie.cover.replace('ezimg.ch', 'https://ezimg.ch');
							movie.cover2.replace('ezimg.ch', 'https://ezimg.ch');
							return resolve(movie);
						});
					});
				});
			})
			.then((movie) => movie.save())
			.catch((err) => {
				// if (err.name !== 'imdb api error' && err.name !== 'RequestError') {
				// 	console.error(err);
				// }
			});
	});
}

function saveYtsListInCollection(json) {
	const movie = new Library({
		title: json['title'],
		cover: json['medium_cover_image'],
		cover2: json['background_image'],
		year: json['year'],
		rating: json['rating'],
		imdb_code: json['imdb_code'],
		runtime: json['runtime'],
		genres: json['genres'],
		summary: json['summary'],
		torrent: json.torrents
	});
	Library.findOne({ imdb_code: movie.imdb_code }, (err, res) => {
		if (err) {
			console.error(err);
		}
		if (res) {
			return;
		}

		omdb
			.get(movie.title, { apiKey: '7c212437' })
			.then((things) => {
				if (!things) {
					throw 'There is not imdbcode for ' + movie.title;
				}

				movie.imdb_code = things.imdbid;
				movie.year = things.year ? things.year : movie.year;
				movie.rating = things.rating !== 'N/A' ? things.rating : -1;
				movie.actors = things.actors ? things.actors : 'N/A';
				movie.country = things.country ? things.country : 'N/A';
				movie.genres = things.genres ? things.genres : 'N/A';
				movie.summary = things.plot ? things.plot : 'N/A';
				movie.cover = movie.cover === '/movies/not-available.png' ? things.poster : movie.cover;
				movie.cover = movie.cover !== 'N/A' ? movie.cover : '/movies/not-available.png';
				// movie.cover2 = things.poster ? things.poster : 'N/A';

				return movie;
			})
			.then((movie) => movie.save())
			.catch((err) => {
				// if (err.name !== 'imdb api error' && err.name !== 'RequestError') {
				// 	console.error(err);
				// }
			});
	});
}

function getAndInsertListMoviesInDb(i, index, source, cb) {
	const url =
		source === 'yts'
			? 'https://yts.ag/api/v2/list_movies.json?limit=50&page=https://yts.ag/api/v2/list_movies.json?limit=50&page='
			: 'https://eztv.ag/api/get-torrents?limit=50&page=';
	let json = {};

	return request(url + i, (err, res, body) => {
		if (!res) {
			cb(true, 'Error with request dependencies');
		}
		if (!err && res.statusCode == 200) {
			try {
				json = JSON.parse(body);
			} catch (err) {
				return cb(true, 'Error with  yts = ' + err);
			}
		}

		if (source === 'yts' ? json.data.movies === undefined : json.torrents === undefined) {
			return cb(false);
		}

		const length = source === 'yts' ? json.data.movies.length : json.torrents.length;

		for (let j = 0; j < length; j++) {
			source === 'yts'
				? saveYtsListInCollection(json.data.movies[j])
				: saveEztvListInCollection(json.torrents[j], json);
			index++;
		}
		i++;

		const count = source === 'yts' ? json.data.movie_count : json.torrents_count;
		if (index >= count) {
			return cb(false);
		} else {
			getAndInsertListMoviesInDb(i, index, source, cb);
		}
	});
}

const InsertCollection = function(source) {
	getAndInsertListMoviesInDb(1, 0, source, (err, data) => {
		if (err) {
			console.error(err + ' ERROR FOR ADD MOVIES COLLECTION IN DB');
		} else {
			console.log(source + 'Movies collection downloaded');
		}
	});
};
module.exports = InsertCollection;