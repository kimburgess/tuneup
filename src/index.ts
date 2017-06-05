import * as R from 'ramda';
import * as sonos from 'sonos';

const rick = 'spotify:track:4uLU6hMCjMI75M1A2tKUQC';

interface Track {
    title: string;
    artist: string;
    album: string;
    uri: string;
}

function watch(host: string, port = 1400) {
    const player = new sonos.Sonos(host, port);

    onPlaybackUpdate(player, logTrack);

    const dontGiveUp = () => play(player, rick);

    /*player.currentTrack(errOrRun((track) => {
        logTrack(track);

        if (isALetDown(track)) {
            dontGiveUp();
        }
    }));*/
}

function onPlaybackUpdate(player, handler: (track: Track) => void) {
    const x = new sonos.Listener(player);

    x.listen((err) => {
        let id: string;

        const print = (sid: string) => console.log(`Subscribed as ${sid}`);
        const save = (sid: string) => id = sid;
        const storeSub = R.pipe(save, print);
        x.addService('/MediaRenderer/AVTransport/Event', errOrRun(storeSub));

        x.on('serviceEvent', (endpoint, sid: string, data) => {
            if (sid === id) {
                player.currentTrack(errOrRun(handler));
            }
        });
    });
}

function errOrRun(action: (payload: any) => void) {
    return (err, payload) => err ? console.error(err) : action(payload);
}

function play(player, uri: string) {
    player.play(uri, errOrRun(console.log));
}

function formatTrack(track: Track) {
    return `${track.artist} - ${track.title}`;
}

function logTrack(track: Track, logger: (msg: string) => void = console.log) {
    logger(formatTrack(track));
}

function isALetDown(track: Track) {
    return true;
}

console.log('Searching for Sonos devices...');
const search = sonos.search();

search.on('DeviceAvailable', (device, model) => {
    console.log(`Discovered Sonos device at ${device.host}`);
    watch(device.host, device.port);
});
