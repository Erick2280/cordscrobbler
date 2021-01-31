import { Message, Client, TextChannel, ReactionCollector } from 'discord.js';
import { UsersService } from '../users-service';
import { returnUserFriendlyErrorMessage } from '../error-handling';
import { sendPrivacyPolicyMessageEmbed } from '../utils'

export const data = {
    name: 'register',
    description: 'Connect your Last.fm account with this bot.',
    aliases: ['login', 'r'],
    args: false,
};

export async function execute(
    message: Message,
    args: string[],
    usersService: UsersService,
    client: Client
) {
    const tenMinutesInMillis = 600000;

    // TODO: Token revalidation

    if (message.channel instanceof TextChannel) {
        message.reply(
            'I sent the steps to connect your Last.fm account via DM.'
        );
    }

    message.author.send(
        `Hi, ${message.author}! Just a sec while I contact the Last.fm servers :)`
    );
    await usersService.startRegistrationProcess(message.author);

    // Follow the steps below to complete your registration:

    // 1. Read the Privacy Policy for this service, available at https://github.com/Erick2280/discord2lastfm/tree/release/docs/PRIVACY_POLICY.md.
    // 2. Connect your Last.fm account entering ${usersService.getRegistrationProcessLoginUrl(
    // message.author
    // )}.

    // If you **agree with the Privacy Policy** and **completed these steps**, please **send an _ok_ message to me** here. If you do not agree with these terms, or want to cancel the registration process, please send a _cancel_ message to me.

    message.author.send(`Let's connect your Last.fm account with this bot!
First, I need you to read my Privacy Policy below, use the arrows to move through the pages.
It's very short and straightforward, I promise :)
React with ✅ in the last page to confirm that you agree with my Privacy Policy, and i'll send you the link to complete the process.     
`);

    sendPrivacyPolicyMessageEmbed(message);
    // const dmChannel = await message.author.createDM();
    // const collector = new MessageCollector(
    //     dmChannel,
    //     (responseMessage) =>
    //         responseMessage.author.id === message.author.id &&
    //         typeof responseMessage.content === 'string' &&
    //         (responseMessage.content.toLowerCase() === 'ok' ||
    //             responseMessage.content.toLowerCase() === 'cancel'),
    //     { time: tenMinutesInMillis, max: 1 }
    // );

    // collector.on('collect', async (responseMessage) => {
    //     if (responseMessage.content.toLowerCase() === 'ok') {
    //         responseMessage.channel.send(
    //             'Thanks! Just a second while we set everything up :)'
    //         );

    //         try {
    //             const registeredUser = await usersService.completeRegistrationProcess(
    //                 responseMessage.author
    //             );
    //             responseMessage.channel.send(
    //                 `Registration complete! Your Last.fm login is ${registeredUser.lastfmUserName}. Scrobbles have been enabled for you :)`
    //             );
    //         } catch (error) {
    //             returnUserFriendlyErrorMessage(
    //                 error,
    //                 responseMessage,
    //                 usersService,
    //                 client
    //             );
    //             usersService.cancelRegistrationProcess(message.author);
    //         }
    //     } else {
    //         responseMessage.channel.send(
    //             `I canceled your registration process. You can send **${process.env.DISCORD_BOT_PREFIX}register** to try again.`
    //         );
    //         usersService.cancelRegistrationProcess(message.author);
    //     }
    // });

    // collector.on('end', (collected) => {
    //     if (
    //         collected.size === 0 &&
    //         usersService.isUserInRegistrationProcess(message.author)
    //     ) {
    //         usersService.cancelRegistrationProcess(message.author);
    //         message.author.send(
    //             `Your registration process has expired. You can try again sending **${process.env.DISCORD_BOT_PREFIX}register**.`
    //         );
    //     }
    // });

    // usersService.appendCollectorOnRegistrationProcess(
    //     message.author,
    //     collector
    // );
}
