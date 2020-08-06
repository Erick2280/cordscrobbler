import { Message, Client, TextChannel } from 'discord.js';
import { UsersService } from '../users-service';

export const data = {
    name: 'account',
    description: 'View your registration details.',
    aliases: ['me'],
    args: false
};

export async function execute(message: Message, args: string[], usersService: UsersService, client: Client) {
    if (message.channel instanceof TextChannel) {
        message.reply('I sent a message to your DMs :)')
    }

    const registeredUser = usersService.getRegisteredUser(message.author);

    message.author.send(`Hello, ${message.author}! Your Last.fm username is **${registeredUser.lastfmUserName}** and scrobbles are turned **${registeredUser.isScrobbleOn ? 'on' : 'off'}**.`)

}