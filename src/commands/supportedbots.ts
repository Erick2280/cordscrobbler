import { Message, Client, TextChannel } from 'discord.js';
import { allDataProviders } from '../data-providing-service';
import { UsersService } from '../users-service';
import { composeBasicMessageEmbed } from '../utils';

export const data = {
    name: 'supportedbots',
    description: 'View supported bots and additional configuration help',
    aliases: ['bots'],
    args: false
};

export async function execute(message: Message, args: string[], usersService: UsersService, client: Client) {

    let messageText = '';

    for (const dataProvider of allDataProviders) {
        messageText += `\n\n**${dataProvider.providerName}**\n${dataProvider.providerAdditionalInfo}`;
    }
        
    if (message.channel instanceof TextChannel) {
        message.reply('I sent a message to your DMs :)')
    }

    let messageEmbed = await composeBasicMessageEmbed('Supported bots', messageText);

    message.author.send({
        embeds: [messageEmbed]
    });

}
