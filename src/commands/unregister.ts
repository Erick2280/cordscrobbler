import { Message, Client, TextChannel, MessageCollector } from 'discord.js';
import { UsersService } from '../users-service';

export const data = {
    name: 'unregister',
    description: `Delete your account and clear your data.`,
    aliases: ['deleteaccount', 'cancelregistration'],
    args: false
};

export async function execute(message: Message, args: string[], usersService: UsersService, client: Client) {
    if (message.channel instanceof TextChannel) {
        message.reply('I sent a message to your DMs :)')
    }

    if (usersService.isUserRegistered(message.author)) {
        message.author.send(`Are you sure you want to delete your account? Please send **yes** to confirm; otherwise send **no**.`);
        // TODO: Delete account
    } else if (usersService.isUserInRegistrationProcess(message.author)) {
        usersService.cancelRegistrationProcess(message.author);
        message.author.send(`I canceled your registration process. You can send **${process.env.DISCORD_BOT_PREFIX}register** to try again.`)
    } else {
        message.author.send(`You don't seem to be registered. No further action was taken :)`)
    
    }
}