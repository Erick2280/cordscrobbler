import { Message, Client, TextChannel, MessageCollector } from 'discord.js';
import { UsersService } from '../users-service';

export const data = {
    name: 'unregister',
    description: `Delete your account and clear your data.`,
    aliases: ['deleteaccount', 'cancelregistration'],
    args: false
};

export async function execute(message: Message, args: string[], usersService: UsersService, client: Client) {
    const twoMinutesInMillis = 120000;

    if (message.channel instanceof TextChannel) {
        message.reply('this command works only via DM.')
    } else {
        if (usersService.isUserRegistered(message.author)) {
            message.author.send(`Are you sure you want to delete your account? Please send **yes** to confirm within 2 minutes; otherwise send **no**.`);
    
            const dmChannel = await message.author.createDM();
            const collector = new MessageCollector(
                dmChannel, {
                    filter: responseMessage => (
                        responseMessage.author.id === message.author.id &&
                        typeof responseMessage.content === 'string'),
                    time: twoMinutesInMillis,
                    max: 1
                }
            );
        
            collector.on('collect', async responseMessage => {
                if (responseMessage.content.toLowerCase() === 'yes') {
                    message.author.send(`Sad to see you go :/ I'm proceeding with your account deletion.`)
                    await usersService.unregisterUser(message.author)
                    message.author.send(`Your account was successfully deleted.`)
                } else if (responseMessage.content.toLowerCase() !== process.env.DISCORD_BOT_PREFIX + data.name)  {
                    message.author.send(`Your account deletion was cancelled. No further action was taken.`)
                }
            });
    
            collector.on('end', collected => {
                if (collected.size === 0) {
                    message.author.send(`You haven't sent the confirmation message. Your account deletion was cancelled.`);
                }
            });
    
        } else if (usersService.isUserInRegistrationProcess(message.author)) {
            usersService.cancelRegistrationProcess(message.author);
            message.author.send(`I canceled your registration process. You can send \`${process.env.DISCORD_BOT_PREFIX}register\` to try again.`)
        } else {
            message.author.send(`You don't seem to be registered. No further action was taken :)`)
        
        }
    }


}