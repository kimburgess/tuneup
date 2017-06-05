import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import * as R from 'ramda';
import * as sonos from 'sonos';

const rick = 'spotify:track:4uLU6hMCjMI75M1A2tKUQC';

const blacklist = loadBlacklist('../blacklist.yml');
console.log(blacklist);

interface Track {
    title?: string;
    artist?: string;
    album?: string;
    uri?: string;
}

function loadBlacklist(file) {
    const filePath = path.join(__dirname, file);
    const tracks = yaml.safeLoad(fs.readFileSync(filePath, 'utf8'));

    // FIXME: should probably handle possible incorrect data formats here
    const convert = (t) => R.is(String, t) ? stringToTrack(t) : t;

    return R.map(convert, tracks);
}

/**
 * Bind to a Sonos device.
 */
function watch(host: string, port = 1400) {
    const player = new sonos.Sonos(host, port);

    const isALetDown = trackInList(blacklist);

    const roll = () => player.play(rick);

    const neverGiveUp = R.cond([
        [isALetDown, roll],
        [R.T, logTrack]
    ]);

    onPlaybackUpdate(player, neverGiveUp);
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
    return track;
}

function match(searchBase: Track) {
    return (track: Track) => false;
}

/**
 * Search for a track within a list of track descriptors.
 */
function trackInList(list: Track[]) {
    return (track: Track) => R.any(match(track))(list);
}

console.log('Searching for Sonos devices...');
const search = sonos.search();

search.on('DeviceAvailable', (device, model) => {
    console.log(`Discovered Sonos device at ${device.host}`);
    watch(device.host, device.port);
});
