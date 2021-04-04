import { Message, Client } from 'discord.js';
import { UsersService } from '../users-service';
import { returnExpectedCommandUsage } from '../error-handling';

export const data = {
    name: 'news',
    description: 'Toggle the option to receive news occasionally about Cordscrobbler updates and new features.',
    args: true,
    usage: '<on|off>'
};

export async function execute(message: Message, args: string[], usersService: UsersService, client: Client) {
    if (args[0] === 'on') {
        usersService.toggleNewsMessagesSendingForUser(message.author, true);
        message.reply('From now on, I **will send** news about Cordscrobbler updates and new features.');
    } else if (args[0] === 'off') {
        usersService.toggleNewsMessagesSendingForUser(message.author, false);
        message.reply('From now on, I **will not send** news about Cordscrobbler updates and new features.');
    } else {
        returnExpectedCommandUsage(data.name, data.usage, message);
    }
}
