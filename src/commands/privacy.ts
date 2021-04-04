import { Message, Client, TextChannel } from 'discord.js';
import { UsersService } from '../users-service';

export const data = {
    name: 'privacy',
    description: 'View the privacy policy of this bot.',
    aliases: ['privacypolicy'],
    args: false
};

export async function execute(message: Message, args: string[], usersService: UsersService, client: Client) {
    if (message.channel instanceof TextChannel) {
        message.reply('I sent a message to your DMs :)')
    }

    message.author.send(`Our privacy policy is available on https://github.com/Erick2280/cordscrobbler/tree/release/docs/PRIVACY_POLICY.md.`)

}