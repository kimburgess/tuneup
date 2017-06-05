import * as sonos from 'sonos';

const rick = 'spotify:track:4uLU6hMCjMI75M1A2tKUQC';

console.log('Searching for Sonos devices...');
const search = sonos.search();

search.on('DeviceAvailable', (device, model) => {
    console.log(`Discovered Sonos device at ${device.host}`);
    watch(device.host, device.port);
});

function watch(host: string, port = 1400) {
    const player = new sonos.Sonos(host, port);

    const dontGiveUp = () => play(player, rick);

    player.currentTrack(alertOrRun((track) => {
        console.log(track);

        if (isALetDown(track)) {
            dontGiveUp();
        }
    }));
}

function alertOrRun(action: (payload: any) => void) {
    return (err, payload) => err ? console.error(err) : action(payload);
}

function play(player, track: string) {
    player.play(track, alertOrRun(console.log));
}

function isALetDown(track) {
    return true;
}
