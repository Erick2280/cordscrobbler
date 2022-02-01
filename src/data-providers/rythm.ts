import { DataProvider, PlaybackData } from '../data-providing-service';
import { Message } from 'discord.js';

export class RythmDataProvider implements DataProvider {
    readonly providerName = 'Rythm Bot (out of service)';
    readonly providerAdditionalInfo = 'The "Announce Songs" option must be enabled on Rythm. To turn it on, send Rythm the following message: `!settings announcesongs on` (or equivalent if you have changed the bot prefix).';
    readonly possibleUsernames = ['Rythm', 'Rythm 2', 'Rythm 3', 'Rythm 4', 'Rythm 5']

    isHandleableMessage(message: Message): boolean {
        return (message?.member?.voice?.channel?.id) && (this.possibleUsernames.includes(message.author.username)) && (message?.embeds[0]?.title === 'Now Playing 🎵'); // TODO or skipped
    }

    getPlaybackDataFromMessage(message: Message): PlaybackData {
        const dataString = message.embeds[0]?.description;
        const title = dataString.slice(dataString.indexOf('[') + 1, dataString.lastIndexOf(']'));
        const url = dataString.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/)?.[0];
        
        return {
            title,
            url,
            guildId: message.guild.id,
            timestamp: new Date(),
            channelId: message.member.voice.channel.id,
            listeningUsersId: message.member.voice.channel.members.keyArray(),
            providerName: this.providerName,
        };
    }
}
