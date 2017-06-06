import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as R from 'ramda';
import * as sonos from 'sonos';
import * as args from 'command-line-args';

interface Track {
    title?: string;
    artist?: string;
    album?: string;
    uri?: string;
}

/**
 * Load a yaml formatted blacklist for matching track / artistst / alibums to.
 */
function loadBlacklist(file: string) {
    const load = (f: string) => yaml.safeLoad(fs.readFileSync(f, 'utf8'));

    // FIXME: should probably handle possible incorrect data formats here
    const convert = (t) => R.is(String, t) ? stringToTrack(t) : t;
    const process = R.map(convert);

    return R.pipe(load, process)(file);
}

/**
 * Search for all sonos players on the local network.
 */
function watchAllPlayers(blacklist: Track[], replacementUri: string) {
    console.log('Searching for Sonos devices...');

    const watchPlayer = watch(blacklist, replacementUri);

    const search = sonos.search();

    search.on('DeviceAvailable', (device, model) => {
        console.log(`Discovered Sonos device at ${device.host}`);
        watchPlayer(device.host, device.port);
    });
}

/**
 * Bind to a Sonos device.
 */
function watch(blacklist: Track[], replacementUri: string) {
    return (host: string, port = 1400) => {
        console.log(`Attaching to Sonos device at ${host}`);

        const player = new sonos.Sonos(host, port);

        const blacklisted = trackInList(blacklist);

        const replace = () => player.play(replacementUri);

        const check = R.cond([
            [blacklisted, replace],
            [R.T, logTrack]
        ]);

        onPlaybackUpdate(player, check);
    };
}

/**
 * Subscribe to AVTransport events on a player and be notified with the track.
 */
function onPlaybackUpdate(player, handler: (track: Track) => void) {
    const x = new sonos.Listener(player);

    x.listen((err) => {
        let id: string;

        const print = (sid: string) => console.log(`Subscribed as ${sid}`);
        const save = (sid: string) => id = sid;
        const storeSub = R.pipe(save, print);
        x.addService('/MediaRenderer/AVTransport/Event', errOrRun(storeSub));

        x.on('serviceEvent', (endpoint, sid: string, data) =>
            R.when(() => sid === id, player.currentTrack(errOrRun(handler))));
    });
}

/**
 * Create a Node callback that prints the error (if any) or executes an action.
 */
function errOrRun(action: (payload: any) => void) {
    return (err, payload) => err ? console.error(err) : action(payload);
}

/**
 * Format a track into something nice and printable.
 */
function trackToString(track: Track) {
    return `${track.artist} - ${track.title}`;
}

/**
 * Build a track descriptor from it's string representation.
 */
function stringToTrack(x: string): Track {
    const [artist, title] = x.split(' - ');
    const track = { artist };
    return title
        ? R.merge(track, { title })
        : track;
}

/**
 * Print a track to a logger (default console.log).
 */
function logTrack(track: Track, logger: (msg: string) => void = console.log) {
    logger(trackToString(track));
}

/**
 * Create a predicate that will will match a partial track descriptor.
 */
function match(searchBase: Track) {
    return (queryTrack: Track) => {
        const extract = R.pipe(R.keys, R.props)(queryTrack);
        const lower = R.map(R.toLower);
        const props = R.map(R.pipe(extract, lower), [queryTrack, searchBase]);
        return R.equals(...props);
    };
}

/**
 * Search for a track within a list of track descriptors.
 */
function trackInList(list: Track[]) {
    return (track: Track) => R.any(match(track))(list);
}

const cliArgs = [
    { name: 'blacklist', alias: 'b', type: String, defaultOption: true, defaultValue: 'blacklist.yml'},
    { name: 'player', alias: 'p', type: String }
];
const options = args(cliArgs);

const rick = 'spotify:track:4uLU6hMCjMI75M1A2tKUQC';

const blacklist = loadBlacklist(options.blacklist);

const connect = R.cond([
    [R.isNil,    () => watchAllPlayers(blacklist, rick)],
    [R.T,        watch(blacklist, rick)]
]);

connect(options.player);
