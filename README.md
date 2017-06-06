Some music is simply not appropriate for a *serious* office environment. This tool will search for, and monitor Sonos players on the local network. If a risqué track is found it will instad auto-play some nice, wholesome Rick Astley.

# Usage

With Docker:

    git clone https://github.com/KimBurgess/tuneup.git
    cd tuneup
    docker build . -t tuneup
    docker run -it --net=host tuneup

Or, your own node invironment:

    git clone https://github.com/KimBurgess/tuneup.git
    cd tuneup
    npm install && npm start

# Blacklisitng

Any undersirable tracks can be added to [the blacklist](blacklist.yml) as [YAML](http://yaml.org/).

Entries can either be:

    <artist>

    <artist> - <track>

    uri: <spotify uri>

or, any combination of

    artist: <artist name>
    track: <track name>
    album: <album name>

For example, to prevent Nickelback from ever be played (recommended), simply list:

    - Nickelback
