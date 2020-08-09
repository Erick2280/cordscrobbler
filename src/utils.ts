import SpotifyWebApi from 'spotify-web-api-node';
import { PlaybackData } from './data-providing-service';
import { Track } from './users-service';
import { TextChannel, MessageEmbed, Message } from 'discord.js';

export async function parseTrack(playbackData: PlaybackData, spotifyApi: SpotifyWebApi): Promise<Track> {
    // Based on the implementation of https://github.com/web-scrobbler/web-scrobbler/blob/master/src/core/content/util.js

    const removeStrings = [
        '(official)', '(music video)', 'videoclipe oficial', 'official music video', '(official music)', '(official video)', 'm/v', ' mv', 'clipe oficial', 'color coded', '…', 'audio only'
    ]
    const spotifyTrackIdRegExp = /(?<=spotify:track:|open\.spotify\.com\/track\/|)[a-zA-Z0-9]{22}/;
    const youtubeTitleRegExps = [
        // Artist "Track", Artist: "Track", Artist - "Track", etc.
        {
            pattern: /(.+?)([\s:—-])+\s*"(.+?)"/,
            groups: { artist: 1, track: 3 },
        },
        // Artist「Track」 (Japanese tracks)
        {
            pattern: /(.+?)「(.+?)」/,
            groups: { artist: 1, track: 2 },
        },
        // Track (... by Artist)
        {
            pattern: /(\w[\s\w]*?)\s+\([^)]*\s*by\s*([^)]+)+\)/,
            groups: { artist: 2, track: 1 },
        },
    ]

    // If it has an Spotify URL, request data from Spotify
    const spotifyTrackIdMatch = playbackData?.url?.match(spotifyTrackIdRegExp)?.[0];

    if (spotifyTrackIdMatch) {
        try {
            await requestSpotifyApiToken(spotifyApi);
            const spotifyTrack = await spotifyApi.getTrack(spotifyTrackIdMatch);
            return {
                artist: spotifyTrack.body.artists[0].name,
                name: spotifyTrack.body.name,
                album: spotifyTrack.body.album.name,
                coverArtUrl: spotifyTrack.body.album.images[0].url
            }
        } catch {}
    }

    let filteredTitle = playbackData.title.toLowerCase();

    // Remove [genre] or 【genre】 from the beginning of the title
    filteredTitle = filteredTitle.replace(/^((\[[^\]]+])|(【[^】]+】))\s*-*\s*/i, '');

    // Remove track (CD and vinyl) numbers from the beginning of the title
    filteredTitle = filteredTitle.replace(/^\s*([a-zA-Z]{1,2}|[0-9]{1,2})[1-9]?\.\s+/i, '');

    // Remove common strings on title
    for (const string of removeStrings) {
        filteredTitle = filteredTitle.replace(string, '')
    }

    // Try to match one of the regexps
    for (const regExp of youtubeTitleRegExps) {
        const artistTrack = filteredTitle.match(regExp.pattern);
        if (artistTrack) {
            filteredTitle = artistTrack[regExp.groups.artist] + ' ' + artistTrack[regExp.groups.track];
            break;
        }
    }

    try {
        await requestSpotifyApiToken(spotifyApi);
        const spotifyTrack = await spotifyApi.searchTracks(filteredTitle);
        
        if (spotifyTrack?.body?.tracks?.items[0]) {
            return {
                artist: spotifyTrack.body.tracks.items?.[0].artists?.[0].name,
                name: spotifyTrack.body.tracks.items?.[0].name,
                album: spotifyTrack.body.tracks.items?.[0].album.name,
                coverArtUrl: spotifyTrack.body.tracks.items?.[0].album.images[0].url
            }
        }
    } catch {}

    return null
        
    // TODO: Better track parsing
    // TODO: Allow disable scrobbling for tracks not provided by Spotify

}

export async function sendNowScrobblingMessageEmbed(track: Track, discordChannel: TextChannel) {
    const nowScrobblingMessageEmbed = new MessageEmbed()
    .setTitle('Now scrobbling')
    .addField('Artist', track.artist)
    .addField('Track', track.name)

    if (track?.album) {
        nowScrobblingMessageEmbed.addField('Album', track.album)
    }

    if (track?.coverArtUrl) {
        nowScrobblingMessageEmbed.setThumbnail(track.coverArtUrl)
    }

    nowScrobblingMessageEmbed.setFooter('To skip scrobbling of this track for your account, react this message with 🚫.')

    const nowScrobblingMessage = await discordChannel.send(nowScrobblingMessageEmbed);
    await nowScrobblingMessage.react('🚫')

    return nowScrobblingMessage;
}

export function deleteMessage(message: Message) {
    return message.delete()
}

export function editEmbedMessageToSkipped(message: Message) {
    return message.edit(message.embeds[0].setTitle('Skipped').setFooter(''))
}

export function sendSuccessfullyScrobbledMessageEmbed(track: Track, lastfmUsers: string[], discordChannel: TextChannel) {
    const successfullyScrobbledEmbed = new MessageEmbed()

    if (lastfmUsers.length > 0) {
        successfullyScrobbledEmbed.setTitle('Successfully scrobbled');
        successfullyScrobbledEmbed.description = `**Scrobbled to:**\n${lastfmUsers.join('\n')}`
    } else {
        successfullyScrobbledEmbed.setTitle('Not scrobbled to anyone');
    }

    successfullyScrobbledEmbed
        .addField('Artist', track.artist)
        .addField('Track', track.name)
    
    if (track?.album) {
        successfullyScrobbledEmbed.addField('Album', track.album)
    }

    if (track?.coverArtUrl) {
        successfullyScrobbledEmbed.setThumbnail(track.coverArtUrl)
    }
    
    return discordChannel.send(successfullyScrobbledEmbed);
}

export async function requestSpotifyApiToken(spotifyApi: SpotifyWebApi) {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body['access_token']);
}
