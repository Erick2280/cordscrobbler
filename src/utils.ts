import SpotifyWebApi from 'spotify-web-api-node';
import { PlaybackData } from './data-providing-service';
import { Track } from './users-service';
import {
    TextChannel,
    MessageEmbed,
    Message,
    MessageReaction,
    User,
    PartialUser,
    ReactionCollector,
    Client,
} from 'discord.js';
import { readFileSync } from 'fs';
import { UsersService } from './users-service';
import { returnUserFriendlyErrorMessage } from './error-handling';

const redColorHex = '#E31B23';

export async function parseTrack(
    playbackData: PlaybackData,
    spotifyApi: SpotifyWebApi
): Promise<Track> {
    // Based on the implementation of https://github.com/web-scrobbler/web-scrobbler/blob/master/src/core/content/util.js

    const removeStrings = [
        '(official)',
        '(music video)',
        'videoclipe oficial',
        'official music video',
        '(official music)',
        '(official video)',
        'm/v',
        ' mv',
        'clipe oficial',
        'color coded',
        '…',
        'audio only',
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
    ];

    // If it has an Spotify URL, request data from Spotify
    const spotifyTrackIdMatch = playbackData?.url?.match(
        spotifyTrackIdRegExp
    )?.[0];

    if (spotifyTrackIdMatch) {
        try {
            await requestSpotifyApiToken(spotifyApi);
            const spotifyTrack = await spotifyApi.getTrack(spotifyTrackIdMatch);
            return {
                artist: spotifyTrack.body.artists[0].name,
                name: spotifyTrack.body.name,
                durationInMillis: spotifyTrack.body.duration_ms,
                album: spotifyTrack.body.album.name,
                coverArtUrl: spotifyTrack.body.album.images[0].url,
            };
        } catch {}
    }

    let filteredTitle = playbackData.title.toLowerCase();

    // Remove [genre] or 【genre】 from the beginning of the title
    filteredTitle = filteredTitle.replace(
        /^((\[[^\]]+])|(【[^】]+】))\s*-*\s*/i,
        ''
    );

    // Remove track (CD and vinyl) numbers from the beginning of the title
    filteredTitle = filteredTitle.replace(
        /^\s*([a-zA-Z]{1,2}|[0-9]{1,2})[1-9]?\.\s+/i,
        ''
    );

    // Remove common strings on title
    for (const string of removeStrings) {
        filteredTitle = filteredTitle.replace(string, '');
    }

    // Try to match one of the regexps
    for (const regExp of youtubeTitleRegExps) {
        const artistTrack = filteredTitle.match(regExp.pattern);
        if (artistTrack) {
            filteredTitle =
                artistTrack[regExp.groups.artist] +
                ' ' +
                artistTrack[regExp.groups.track];
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
                durationInMillis:
                    spotifyTrack.body.tracks.items?.[0].duration_ms,
                album: spotifyTrack.body.tracks.items?.[0].album.name,
                coverArtUrl:
                    spotifyTrack.body.tracks.items?.[0].album.images[0].url,
            };
        }
    } catch {}

    return null;

    // TODO: Better track parsing
    // TODO: Allow disable scrobbling for tracks not provided by Spotify
}

export async function sendNowScrobblingMessageEmbed(
    track: Track,
    discordChannel: TextChannel
) {
    const nowScrobblingMessageEmbed = new MessageEmbed()
        .setColor(redColorHex)
        .setTitle('Now scrobbling')
        .addField('Artist', track.artist)
        .addField('Track', track.name);

    if (track?.album) {
        nowScrobblingMessageEmbed.addField('Album', track.album);
    }

    if (track?.coverArtUrl) {
        nowScrobblingMessageEmbed.setThumbnail(track.coverArtUrl);
    }

    nowScrobblingMessageEmbed.setFooter(
        'To skip scrobbling of this track for your account, react this message with 🚫.'
    );

    const nowScrobblingMessage = await discordChannel.send(
        nowScrobblingMessageEmbed
    );
    await nowScrobblingMessage.react('🚫');

    return nowScrobblingMessage;
}

export function deleteMessage(message: Message) {
    return message.delete();
}

export function editEmbedMessageToSkipped(message: Message) {
    return message.edit(message.embeds[0].setTitle('Skipped').setFooter(''));
}

export function sendSuccessfullyScrobbledMessageEmbed(
    track: Track,
    lastfmUsers: string[],
    discordChannel: TextChannel
) {
    const successfullyScrobbledEmbed = new MessageEmbed();

    if (lastfmUsers.length > 0) {
        successfullyScrobbledEmbed.setTitle('Successfully scrobbled');
        successfullyScrobbledEmbed.description = `**Scrobbled to:**\n${lastfmUsers.join(
            '\n'
        )}`;
    } else {
        successfullyScrobbledEmbed.setTitle('Not scrobbled to anyone');
    }

    successfullyScrobbledEmbed
        .addField('Artist', track.artist)
        .addField('Track', track.name)
        .setColor(redColorHex);

    if (track?.album) {
        successfullyScrobbledEmbed.addField('Album', track.album);
    }

    if (track?.coverArtUrl) {
        successfullyScrobbledEmbed.setThumbnail(track.coverArtUrl);
    }

    return discordChannel.send(successfullyScrobbledEmbed);
}

export async function requestSpotifyApiToken(spotifyApi: SpotifyWebApi) {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body['access_token']);
}

export async function sendPrivacyPolicyMessageEmbed(message: Message) {
    const privacyPolicyMessageEmbed = new MessageEmbed();
    let privacyPolicy = readFileSync('./docs/PRIVACY_POLICY.md', 'utf8')
        .split('\n')
        .filter((filter) => {
            if (filter != '') return filter;
        });
    let privacyPolicyDescription = privacyPolicy[0];

    privacyPolicyMessageEmbed
        .setColor(redColorHex)
        .setTitle('Privacy Policy')
        .setDescription(privacyPolicyDescription)
        .setFooter('Page 1 of 3');

    let sentMessage = await message.author.send(privacyPolicyMessageEmbed);
    //await sentMessage.react("⬅️");
    await sentMessage.react('➡️');

    return;
}

export async function updatePrivacyPolicyMessageEmbed(
    reaction: MessageReaction,
    user: User | PartialUser
) {
    const privacyPolicyMessageEmbed = new MessageEmbed();
    let privacyPolicyPages = readFileSync('./docs/PRIVACY_POLICY.md', 'utf8')
        .split('\n# ')
        .map((page) => {
            let container;
            if (page.split('\n').length == 2) {
                container = { title: 'Privacy Policy', content: page };
            } else {
                let pageArray = page.split('\n');
                let reFind = /(\#\#)(.*)/;
                for (let index = 0; index < pageArray.length; index++) {
                    if (pageArray[index].match(reFind)) {
                        pageArray[index] = pageArray[index].replace(
                            reFind,
                            `**${pageArray[index].match(reFind)[2]}**`
                        );
                    }
                }
                container = {
                    title: pageArray[0],
                    content: pageArray.slice(1),
                };
            }
            return container;
        });
    let oldPage = parseInt(
        reaction.message.embeds[0].footer.text.split(' ')[1]
    );
    let newPage = oldPage;
    if (reaction.emoji.name == '➡️' && oldPage < 3) {
        newPage = oldPage + 1;
    }
    if (reaction.emoji.name == '⬅️' && oldPage > 1) {
        newPage = oldPage - 1;
    }

    privacyPolicyMessageEmbed
        .setColor(redColorHex)
        .setTitle(privacyPolicyPages[newPage - 1].title)
        .setDescription(privacyPolicyPages[newPage - 1].content)
        .setFooter(`Page ${newPage} of 3`);

    reaction.message.delete();
    let sentMessage = await user.send(privacyPolicyMessageEmbed);
    if (newPage == 3) {
        await sentMessage.react('⬅️');
        await sentMessage.react('✅');
    } else if (newPage > 1 && newPage < 3) {
        await sentMessage.react('⬅️');
        await sentMessage.react('➡️');
    } else {
        await sentMessage.react('➡️');
    }

    return;
}

export async function completeRegistration(
    reaction: MessageReaction,
    user: User | PartialUser,
    usersService: UsersService,
    client: Client
) {
    if (reaction.message.embeds[0].footer.text == 'Page 3 of 3') {
        reaction.message.delete();
        const lastStepRegistrationEmbed = new MessageEmbed();

        lastStepRegistrationEmbed
            .setColor(redColorHex)
            .setTitle('Last step')
            .addField(
                'Registration link',
                `[Click Here](${usersService.getRegistrationProcessLoginUrl(
                    user
                )})`
            )
            .setFooter('React with ✅ to confirm');

        let sentMessage = await user.send(lastStepRegistrationEmbed);
        await sentMessage.react('❌');
        await sentMessage.react('✅');

        const collector = new ReactionCollector(
            sentMessage,
            (newReaction, user) =>
                !user.bot &&
                typeof newReaction.emoji.name === 'string' &&
                (newReaction.emoji.name === '✅' ||
                    newReaction.emoji.name === '❌'),
            { time: 60000, max: 1 }
        );

        collector.on('collect', async (newReaction, user) => {
            if (newReaction.emoji.name === '✅') {
                let registrationCompletedEmbed = new MessageEmbed();
                registrationCompletedEmbed
                    .setColor(redColorHex)
                    .setTitle(
                        'Thanks! Just a second while we set everything up :)'
                    );

                sentMessage.edit(registrationCompletedEmbed);
                try {
                    const registeredUser = await usersService.completeRegistrationProcess(
                        user
                    );

                    registrationCompletedEmbed
                        .setColor(redColorHex)
                        .setTitle('Registration completed')
                        .addField(
                            'Your Last.fm login',
                            `${registeredUser.lastfmUserName}`
                        )
                        .setFooter('Scrobbles have been enabled for you :)');
                    sentMessage.edit(registrationCompletedEmbed);

                    // newReaction.message.channel.send(
                    //     `Registration complete! Your Last.fm login is ${registeredUser.lastfmUserName}. Scrobbles have been enabled for you :)`
                    // );
                } catch (error) {
                    returnUserFriendlyErrorMessage(
                        error,
                        newReaction.message,
                        usersService,
                        client
                    );
                    usersService.cancelRegistrationProcess(user);
                }
            } else {
                newReaction.message.channel.send(
                    `I canceled your registration process. You can send **${process.env.DISCORD_BOT_PREFIX}register** to try again.`
                );
                usersService.cancelRegistrationProcess(user);
            }
        });

        collector.on('end', (collected) => {
            if (
                collected.size === 0 &&
                usersService.isUserInRegistrationProcess(user)
            ) {
                usersService.cancelRegistrationProcess(user);
                reaction.message.author.send(
                    `Your registration process has expired. You can try again sending **${process.env.DISCORD_BOT_PREFIX}register**.`
                );
            }
        });

        usersService.appendCollectorOnRegistrationProcess(user, collector);
    }

    return;
}
