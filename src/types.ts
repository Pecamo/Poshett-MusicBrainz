/**
 * This file has been copied from https://github.com/Borewit/musicbrainz-api/blob/master/src/musicbrainz.types.ts and modified.
 */

import DateTimeFormat = Intl.DateTimeFormat;

export type AcoustidRecording = {
	id: string,
	sources: number,
	releasegroups: AcoustidReleaseGroup[]
};

export type ReleaseGroupType = 'Album' | 'Single' | 'EP' | 'Broadcast' | 'Other';

export type ReleaseGroupSecondaryType = 'Compilation' | 'Soundtrack' | 'Spokenword' | 'Interview' | 'Audiobook' | 'Audio drama' | 'Live' | 'Remix' | 'DJ-mix' | 'Mixtape/Street';

export type AcoustidReleaseGroup = {
	id: string,
	title: string,
	secondarytypes: ReleaseGroupSecondaryType[],
	type: ReleaseGroupType,
	artists: [{
		id: string,
		name: string
	}],
}

export type CAReleaseGroup = {
	release: string,
	images: CAImage[];
};

export type CAType =
	'Front' |
	'Back' |
	'Booklet' |
	'Medium' |
	'Tray' |
	'Obi' |
	'Spine' |
	'Track' |
	'Liner' |
	'Sticker' |
	'Poster' |
	'Watermark' |
	'Raw/Unedited' |
	'Other';

export type CAImage = {
	edit: number,
	id: number,
	image: string;

	thumbnails: {
		250: string;
		500: string;
		1200: string;
		small: string;
		large: string;
	},

	comment: string;
	approved: boolean;
	front:false;
	types: CAType[];
	back: boolean;
}

export interface Period {
	'begin': string,
	'ended': boolean,
	'end': string
}

export interface Alias {
	name: string,
	'sort-name': string,
	ended: boolean,
	'type-id': string,
	type: string,
	locale: string,
	primary: string,
	begin: string,
	end: string
}

export interface Match {
	score: number // ToDo: provide feedback: should be a number
}

export interface Artist {
	id: string;
	name: string;
	disambiguation: string;
	'sort-name': string;
	'type-id'?: string;
	'gender-id'?;
	'life-span'?: Period;
	country?: string;
	ipis?: any[]; // ToDo
	isnis?: string[];
	aliases?: Alias[];
	gender?: null;
	type?: string;
	area?: Area;
	begin_area?: Area;
	end_area?: Area;
	relations?: Relation[];
	/**
	 * Only defined if 'releases' are includes
	 */
	releases?: Release[];
}

export interface ArtistCredit {
	artist: Artist;
	joinphrase: string;
	name: string;
}

export type ReleaseQuality = 'normal';  // ToDo

export interface Release {
	id: string;
	title: string;
	'text-representation': { 'language': 'eng', 'script': 'Latn' },
	disambiguation: string;
	asin: string,
	'status-id': string;
	packaging?: string;
	status: string;
	'packaging-id'?: string;
	'release-events'?: ReleaseEvent;
	date: string;
	media: Medium[];
	'cover-art-archive': CoverArtArchive;
	country: string;
	quality: ReleaseQuality;
	barcode: string;
	relations?: Relation[];
	'artist-credit'?: ArtistCredit[]; // Include 'artist-credits '
	'release-group'?: ReleaseGroup; // Include: 'release-groups'
}

export interface Area {
	id: string;
	name: string;
	disambiguation: string;
	'iso-3166-1-codes': string;
	'sort-name': string;
}

export interface ReleaseEvent {
	area?: Area;
}

export type MediaFormatType = 'Digital Media'; // ToDo

export interface Recording {
	id: string;
	video: boolean;
	length: number;
	title: string;
	disambiguation: string;
	isrcs?: string[];
	releases?: Release[];
	relations?: Relation[];
	'artist-credit'?: ArtistCredit[];
}

export interface Track {
	id: string;
	position: number;
	recording: Recording;
	number: number;
	length: number;
	title: string;
}

export interface Medium {
	title: string;
	format: MediaFormatType;
	'format-id': string;
	'tracks': Track[];
	'track-count': number;
	'track-offset': number;
	'position': number;
}

export interface CoverArtArchive {
	count: number;
	front: boolean;
	darkened: boolean;
	artwork: true;
	back: boolean;
}

export interface ReleaseGroup {
	id: string;
	count: number;
	title: string;
	'primary-type': ReleaseGroupType;
	'sort-name': string;
	'artist-credit': Array<{ artist: Artist }>;
	releases?: Release[];
	'secondary-types': ReleaseGroupSecondaryType[];
	'type-id': string;
}

export interface ArtistMatch extends Artist, Match {
}

export interface ReleaseGroupMatch extends ReleaseGroup, Match {
}

export interface ReleaseMatch extends Release, Match {
}

export interface AreaMatch extends Area, Match {
}

export interface SearchResult {
	created: DateTimeFormat;
	count: number;
	offset: number;
}

export interface ArtistList extends SearchResult {
	artists: ArtistMatch[]
}

export interface AreaList extends SearchResult {
	areas: AreaMatch[]
}

export interface ReleaseList extends SearchResult {
	releases: ReleaseMatch[]
}

export interface ReleaseGroupList extends SearchResult {
	'release-groups': ReleaseGroupMatch[]
}

export type RelationDirection = 'backward' | 'forward';

export interface Relation {
	'attribute-ids': {};
	direction: RelationDirection;
	'target-credit': string;
	end: null | object;
	'source-credit': string;
	ended: boolean;
	'attribute-values': object;
	attributes?: any[];
	type: string;
	begin?: null | object;
	'target-type'?: 'url';
	'type-id': string;
	url?: URL;
	release?: Release;
}

export interface URL {
	id: string;
	resource: string;
}

export interface RelationList {
	relations: Relation[];
}

export interface Work {
	id: string;
	title: string;
}

export interface Label {
	id: string;
	name: string;
}

export interface Url {
	id: '1a150a68-13b2-4bab-a96b-4966924cbc7f',
	resource: 'https://open.spotify.com/album/13bRrqlPDErhpXDUxYQCUU',
	'relation-list': RelationList[];
}

export interface UrlMatch extends Match, Url {
}

export interface UrlSearchResult extends SearchResult {
	urls?: UrlMatch[];
}

export interface srcSearchResult {
	'isrc': 'GBCVZ0802435';
	'recordings': Recording[];
}

export interface ExernalIds {
	[type: string]: string;
}

export interface ReleaseSearchResult extends SearchResult {
	releases: Release[];
}

/**
 * https://musicbrainz.org/doc/Development/XML_Web_Service/Version_2#Subqueries
 */
export type EntityType = 'area' |
	'artist' |
	'collection' |
	'event' |
	'instrument' |
	'label' |
	'place' |
	'recording' |
	'release' |
	'release-group' |
	'series' |
	'work' |
	'url';

export type Relationships = 'area-rels' |
	'artist-rels' |
	'event-rels' |
	'instrument-rels' |
	'label-rels' |
	'place-rels' |
	'recording-rels' |
	'release-rels' |
	'release-group-rels' |
	'series-rels' |
	'url-rels' |
	'work-rels';

export enum LinkType {
	license = 302,
	production = 256,
	samples_IMDb_entry = 258,
	get_the_music = 257,
	purchase_for_download = 254,
	download_for_free = 255,
	stream_for_free = 268,
	crowdfunding_page = 905,
	other_databases = 306,
	Allmusic = 285
}

/**
 * https://wiki.musicbrainz.org/Development/XML_Web_Service/Version_2/Search#Artist
 */
export interface Pagination {
	/**
	 * Return search results starting at a given offset. Used for paging through more than one page of results.
	 */
	offset?: number;
	/**
	 * An integer value defining how many entries should be returned. Only values between 1 and 100 (both inclusive) are allowed. If not given, this defaults to 25.
	 */
	limit?: number;
}

/**
 * https://wiki.musicbrainz.org/Development/XML_Web_Service/Version_2/Search#Artist
 */
export interface SearchQuery extends Pagination {
	/**
	 * Lucene search query, this is mandatory
	 */
	query: string;
}