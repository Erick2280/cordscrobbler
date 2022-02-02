import { promises as fs } from 'fs';
import SpotifyWebApi from 'spotify-web-api-node';
import { PlaybackData } from './data-providing-service';
import { Track } from './users-service';
import { TextChannel, MessageEmbed, Message, User } from 'discord.js';

const redColorHex = '#E31B23'

export async function parseTrack(playbackData: PlaybackData, spotifyApi: SpotifyWebApi): Promise<Track> {
    // Based on the implementation of https://github.com/web-scrobbler/web-scrobbler/blob/master/src/core/content/util.js

    const removeStrings = [
        '(official)', '(music video)', '(lyric video)', 'videoclipe oficial', 'official music video', '(official music)', '(official video)', '(official audio)', '(videoclip)', '(videoclipe)', '(video)', '(audio)', 'm/v', ' mv', 'clipe oficial', 'color coded', 'audio only', 'ft.', 'feat.', '…'
    ];
    const removeChars = [
        '-', '&', ',', '(', ')', '\"', '\''
    ];
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
                durationInMillis: spotifyTrack.body.duration_ms,
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

    // Remove certain chars after regexps matching
    for (const string of removeChars) {
        filteredTitle = filteredTitle.split(string).join(' ');
    }

    try {
        await requestSpotifyApiToken(spotifyApi);
        const spotifyTrack = await spotifyApi.searchTracks(filteredTitle);

        if (spotifyTrack?.body?.tracks?.items[0]) {
            return {
                artist: spotifyTrack.body.tracks.items?.[0].artists?.[0].name,
                name: spotifyTrack.body.tracks.items?.[0].name,
                durationInMillis: spotifyTrack.body.tracks.items?.[0].duration_ms,
                album: spotifyTrack.body.tracks.items?.[0].album.name,
                coverArtUrl: spotifyTrack.body.tracks.items?.[0].album.images[0].url
            }
        }
    } catch {}

    return null
        
    // TODO: Allow disable scrobbling for tracks not provided by Spotify

}

export async function sendNowScrobblingMessageEmbed(track: Track, discordChannel: TextChannel) {
    const nowScrobblingMessageEmbed = new MessageEmbed()
    .setColor(redColorHex)
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

    const nowScrobblingMessage = await discordChannel.send(nowScrobblingMessageEmbed).catch(() => {});

    if (nowScrobblingMessage) await nowScrobblingMessage.react('🚫')

    return nowScrobblingMessage;
}

export async function sendErrorMessageToUser(user: User, error: Error) {
    if (user == null) {
        return;
    }
    const messageText = `Something went wrong when I tried to scrobble your Last.fm account. Please try to undo your registration (sending \`${process.env.DISCORD_BOT_PREFIX}unregister\`) and connect your Last.fm account again (sending \`${process.env.DISCORD_BOT_PREFIX}register\`).
If that doesn't work, please send a report through the [official Discord server](https://discord.gg/yhGhQj6cGa) or through [GitHub](https://github.com/Erick2280/cordscrobbler/issues).`
    const errorInfo = `Error: ${error?.message ?? 'Unspecified'}` 
    const messageEmbed = await composeBasicMessageEmbed('Scrobbling error', messageText, errorInfo);

    await user.send(messageEmbed);
}

export function deleteMessage(message: Message) {
    return message.delete()
}

export function editEmbedMessageToSkipped(message: Message) {
    return message.edit(message.embeds[0].setTitle('Skipped').setFooter(''))
}

export async function composeGuildWelcomeMessageEmbed() {
    
    const messageText = `Thank you so much for adding me to this server! 😊
    
This bot scrobbles songs played by other bots to Last.fm. I will automatically scrobble to registered users that are on the same audio channel as the bot, on any server that I'm added to.

• **To enable scrobbling for you**, send \`${process.env.DISCORD_BOT_PREFIX}register\` and follow the steps to connect me with your Last.fm account.
• **If you want a list of all commands**, send \`${process.env.DISCORD_BOT_PREFIX}help\`.
• **To see which music bots are supported**, send \`${process.env.DISCORD_BOT_PREFIX}supportedbots\`.

Note that I will send messages to acknowledge scrobbles every song when someone requests another bot (such as Hydra) to play music. As this may bother some, I suggest creating a text channel just for bots.

I'm open source! Visit my [GitHub project page](https://github.com/Erick2280/cordscrobbler). Feel free to [join the Cordscrobbler Discord server](https://discord.gg/yhGhQj6cGa) too. Feedbacks are appreciated!`;
    const messageEmbed = composeBasicMessageEmbed(`Hi! I'm Cordscrobbler!`, messageText);
    return messageEmbed; 
}

export function sendSuccessfullyScrobbledMessageEmbed(track: Track, lastfmUsers: string[], discordChannel: TextChannel) {
    const successfullyScrobbledEmbed = new MessageEmbed();

    if (lastfmUsers.length > 0) {
        successfullyScrobbledEmbed.setTitle('Successfully scrobbled');
        successfullyScrobbledEmbed.description = `**Scrobbled to:**\n${lastfmUsers.join('\n')}`
    } else {
        successfullyScrobbledEmbed.setTitle('Not scrobbled to anyone');
    }

    successfullyScrobbledEmbed
        .addField('Artist', track.artist)
        .addField('Track', track.name)
        .setColor(redColorHex)
    
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

export async function composeBasicMessageEmbed(title: string, description: string = '', footer: string = '') {
    const RegistrationMessageEmbed = new MessageEmbed();
    RegistrationMessageEmbed
        .setColor(redColorHex)
        .setTitle(title)
        .setDescription(description)
        .setFooter(footer);
    
    return RegistrationMessageEmbed;   
}

export async function parsePrivacyPolicyFile() {
    const rawPrivacyPolicy = await fs.readFile('./docs/PRIVACY_POLICY.md', 'utf8');
    const privacyPolicy = rawPrivacyPolicy.split('\n# ')
        .map((page) => {
            let container;
            if (page.split('\n').length == 2) {
                container = {
                    title: 'Privacy Policy',
                    description: page
                };
            } else {
                const pageArray = page.split('\n');
                const matchSubheadings = /(\#\#)(.*)/;
                for (let index = 0; index < pageArray.length; index++) {
                    if (pageArray[index].match(matchSubheadings)) {
                        pageArray[index] = pageArray[index].replace(
                            matchSubheadings,
                            `**${pageArray[index].match(matchSubheadings)[2]}**`
                        );
                    }
                }
                container = {
                    title: pageArray[0],
                    description: pageArray.slice(1),
                };
            }
            return container;
        });

    return privacyPolicy;
}

export type EmbedPage = {
    title: string,
    description: string,
    footer?: string
}
