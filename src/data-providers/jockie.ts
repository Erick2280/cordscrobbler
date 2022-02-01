import { DataProvider, PlaybackData } from '../data-providing-service';
import { Message } from 'discord.js';

export class JockieDataProvider implements DataProvider {
    readonly providerName = 'Jockie Music';
    readonly providerAdditionalInfo = 'Out-of-the-box support.';
    readonly possibleUsernames = ['Jockie Music', 'Jockie Music (1)', 'Jockie Music (2)', 'Jockie Music (3)', 'Jockie Music Premium', 'Jockie Music Premium (1)', 'Jockie Music Premium (2)', 'Jockie Music Premium (3)', 'Jockie Music Premium (4)']

    isHandleableMessage(message: Message): boolean {
        return (message?.member?.voice?.channel?.id) && (this.possibleUsernames.includes(message.author.username)) && (message?.embeds[0]?.description?.startsWith?.('Started playing '));
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
