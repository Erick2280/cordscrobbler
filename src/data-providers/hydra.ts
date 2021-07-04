import { DataProvider, PlaybackData } from '../data-providing-service';
import { Message } from 'discord.js';

export class HydraDataProvider implements DataProvider {
    readonly providerName = 'Hydra Bot';
    readonly providerAdditionalInfo = 'Out-of-the-box support.';
    readonly possibleUsernames = ['Hydra', 'Hydra 2', 'Hydra 3', 'Hydra Staging']

    isHandleableMessage(message: Message): boolean {
        return (this.possibleUsernames.includes(message.author.username)) && (message?.embeds[0]?.title === 'Now playing');
    }

    getPlaybackDataFromMessage(message: Message): PlaybackData {
        const dataString = message.embeds[0]?.description;
        const title = dataString.slice(dataString.indexOf('[') + 1, dataString.lastIndexOf(']'));
        const url = dataString.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/)[0];
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
