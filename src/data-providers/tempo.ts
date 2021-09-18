import { DataProvider, PlaybackData } from '../data-providing-service';
import { Message } from 'discord.js';

export class TempoDataProvider implements DataProvider {
    readonly providerName = 'Tempo Bot';
    readonly providerAdditionalInfo = 'Out-of-the-box support.';
    readonly titlePaddingIndex = 9

    isHandleableMessage(message: Message): boolean {
        return (message.author.username === 'Tempo') && (message?.embeds[0]?.author?.name?.startsWith('Playing: '));
    }

    getPlaybackDataFromMessage(message: Message): PlaybackData {
        const title = message?.embeds[0]?.author?.name?.slice(this.titlePaddingIndex);

        return {
            title,
            guildId: message.guild.id,
            timestamp: new Date(),
            channelId: message.member.voice.channel.id,
            listeningUsersId: [...message.member.voice.channel.members.keys()],
            providerName: this.providerName,
        };
    }
}
