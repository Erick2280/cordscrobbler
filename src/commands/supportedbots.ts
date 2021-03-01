import { Message, Client, TextChannel } from 'discord.js';
import { allDataProviders } from '../data-providing-service';
import { UsersService } from '../users-service';

export const data = {
    name: 'supportedbots',
    description: 'View supported bots and additional configuration help',
    aliases: ['bots'],
    args: false
};

export async function execute(message: Message, args: string[], usersService: UsersService, client: Client) {

    let messageText =
    `I support the following bots:`;

        for (const dataProvider of allDataProviders) {
            messageText += `\n\n**${dataProvider.providerName}**\n${dataProvider.providerAdditionalInfo}`;
        }
        
        if (message.channel instanceof TextChannel) {
            message.reply('I sent a message to your DMs :)')
        }
        message.author.send(messageText);

}
