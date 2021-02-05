import { DataProvider, PlaybackData } from '../data-providing-service';
import { Message } from 'discord.js';

export class HydraDataProvider implements DataProvider {
    readonly providerName = 'Hydra';

    isHandleableMessage(message: Message): boolean {
        if (
            message.author.username === 'Hydra' &&
            message?.embeds[0]?.title === 'Now playing'
        ) {
            return true;
        }
        return false;
    }

    getPlaybackDataFromMessage(message: Message): PlaybackData {
        const dataString = message.embeds[0]?.description;
        const title = dataString.slice(dataString.indexOf('[') + 1, dataString.indexOf(']'));
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
