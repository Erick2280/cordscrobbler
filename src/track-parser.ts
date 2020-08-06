import SpotifyWebApi from 'spotify-web-api-node';
import { PlaybackData } from './data-providing-service';
import { Track } from './users-service';

this.spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

export function parseTrack(playbackData: PlaybackData): Track {
    // TODO: Better track parsing
    const split = playbackData.title.split(' - ')
    const track: Track = {
        name: split[1],
        artist: split[0],
    }
    return track;
}
