import { Client, Message } from 'discord.js';
import { UsersService } from './users-service';

export function returnUserFriendlyErrorMessage(error: Error, message: Message, usersService: UsersService, client: Client) {
    switch (error.message) {
        case 'LastfmServiceUnavailable':
            message.author.send(`Sorry, seems like the Last.fm service is unavailable. Please try again later :/`);
            break;
        case 'LastfmTokenNotAuthorized':
            message.author.send(`Sorry, something went wrong while trying to log in to Last.fm. Please try again sending **${process.env.DISCORD_BOT_PREFIX}register**. Remember you need to enter the provided link, log in with your account and select *Yes, allow access*.`);
            break;
        case 'LastfmRequestUnknownError':
            message.author.send(`It looks like something went wrong with Last.fm. Sorry :/`);
            break;
        case 'UserAlreadyRegistered':
            message.author.send(`Seems like you're already registered :D`);
            message.author.send(`You can view your account details by sending **${process.env.DISCORD_BOT_PREFIX}account**.`)
            break;
        case 'UserNotRegistered':
            message.author.send(`Seems like you are not registered. To start the registration process, please send **${process.env.DISCORD_BOT_PREFIX}register**.`);
            break;
        case 'UserAlreadyInRegistrationProcess':
            message.author.send(`You already are in a registration process. Please enter ${usersService.getRegistrationProcessLoginUrl(message.author)} to proceed with login. After completing login, please send an **ok** message to me here. If you're encountering issues during registration, sending **${process.env.DISCORD_BOT_PREFIX}unregister** to clear your data might help.`);
            break;
        case 'UserNotInRegistrationProcess':
            message.author.send(`You are not in registration process. To start it, please send **${process.env.DISCORD_BOT_PREFIX}register**.`);
            break;
        default:
            console.error(error);
            message.channel.send(`An error happened and I don't know why. Sorry :/`);
            break;
    }
}

export function returnExpectedCommandUsage(commandName: string, usage: string, message: Message) {
    message.reply(`I didn't understand your command. To use this command, you need to send a message in this format: **${process.env.DISCORD_BOT_PREFIX + commandName + ' ' + usage}**.`);
}