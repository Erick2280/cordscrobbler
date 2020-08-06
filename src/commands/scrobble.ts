import { Message, Client } from 'discord.js';
import { UsersService } from '../users-service';
import { returnExpectedCommandUsage } from '../error-handling';

export const data = {
    name: 'scrobbling',
    description: 'Toggle the scrobbling for your account.',
    args: true,
    usage: '<on|off>'
};

export async function execute(message: Message, args: string[], usersService: UsersService, client: Client) {
    if (args[0] === 'on') {
        usersService.toggleScrobblingForUser(message.author, true);
        message.reply('I turned **on** your scrobbles.');
    } else if (args[0] === 'off') {
        usersService.toggleScrobblingForUser(message.author, false);
        message.reply('I turned **off** your scrobbles.');
    } else {
        returnExpectedCommandUsage(data.name, data.usage, message);
    }
}