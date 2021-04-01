import { Message, Client, TextChannel, ReactionCollector, User } from 'discord.js';
import { UsersService } from '../users-service';

import { returnUserFriendlyErrorMessage } from '../error-handling';
import { EmbedPage, composeBasicMessageEmbed, parsePrivacyPolicyFile } from '../utils';

const tenMinutesInMillis = 600000;

export const data = {
    name: 'register',
    description: 'Connect your Last.fm account with this bot.',
    aliases: ['login', 'r'],
    args: false
};

export async function execute(message: Message, args: string[], usersService: UsersService, client: Client) {
    
    // TODO: Token revalidation

    if (message.channel instanceof TextChannel) {
        message.reply('I sent the steps to connect your Last.fm account via DM.');
    }

    await usersService.startRegistrationProcess(message.author);

    message.author.send(`Let's connect your Last.fm account with this bot!
First, I need you to read my Privacy Policy below (also available at https://github.com/Erick2280/cordscrobbler/tree/release/docs/PRIVACY_POLICY.md). It's short and straightforward, I promise :)
**Use the arrows to move through the pages.**
**React with ✅ on the last page to confirm that you agree with my Privacy Policy**, and I'll send you the link to complete the process on Last.fm website.
** **`);

    let privacyPolicyArray = await parsePrivacyPolicyFile();
    sendPrivacyPolicyEmbed(message.author, privacyPolicyArray, 0, usersService);

    async function sendPrivacyPolicyEmbed(user: User, privacyPolicyArray: EmbedPage[], pageIndex: number, usersService: UsersService) {
        const privacyPolicyTitle = privacyPolicyArray[pageIndex].title;
        const privacyPolicyDescription = privacyPolicyArray[pageIndex].description;
        const privacyPolicyPagination = `Page ${pageIndex + 1} of ${privacyPolicyArray.length}`;
    
        const parsedPrivacyPolicyPage = await composeBasicMessageEmbed(privacyPolicyTitle, privacyPolicyDescription, privacyPolicyPagination);
    
        const sentMessage = await user.send(parsedPrivacyPolicyPage);
    
        if (pageIndex === 0) {
            sentMessage.react('➡️');
        } else if (pageIndex < privacyPolicyArray.length - 1) {
            sentMessage.react('⬅️');
            sentMessage.react('➡️');
        } else {
            sentMessage.react('⬅️');
            sentMessage.react('❌');
            sentMessage.react('✅');
        }
    
        const collector = new ReactionCollector(
            sentMessage,
            (newReaction, user) =>
                !user.bot &&
                typeof newReaction.emoji.name === 'string' &&
                (newReaction.emoji.name === '✅' ||
                    newReaction.emoji.name === '❌'||
                    newReaction.emoji.name === '➡️'||
                    newReaction.emoji.name === '⬅️'),
            { time: tenMinutesInMillis, max: 1 }
        );
    
        collector.on('collect', async (newReaction, user) => {
            if (newReaction.emoji.name === '➡️' && pageIndex < privacyPolicyArray.length - 1) {
                await sentMessage.delete();
                sendPrivacyPolicyEmbed(user, privacyPolicyArray, pageIndex + 1, usersService);
            } else if (newReaction.emoji.name === '⬅️' && pageIndex > 0) {
                await sentMessage.delete();
                sendPrivacyPolicyEmbed(user, privacyPolicyArray, pageIndex - 1, usersService);
            } else if (newReaction.emoji.name === '✅' && pageIndex === privacyPolicyArray.length - 1) {
                await sentMessage.delete();
                sendCompleteRegistrationEmbed(user, usersService);
            } else if (newReaction.emoji.name === '❌' && pageIndex === privacyPolicyArray.length - 1) {
                await sentMessage.delete();
                user.send(`I canceled your registration process. You can send **${process.env.DISCORD_BOT_PREFIX}register** to try again.`);
                usersService.cancelRegistrationProcess(user);
            }
        });
    
        collector.on('end', (collected) => {
            if (
                collected.size === 0 &&
                usersService.isUserInRegistrationProcess(user)
            ) {
                sentMessage.delete()
                usersService.cancelRegistrationProcess(user);
                user.send(
                    `Your registration process has expired. You can try again sending **${process.env.DISCORD_BOT_PREFIX}register**.`
                );
            }
        });
    
        usersService.appendCollectorOnRegistrationProcess(user, collector);
    }
    
    
    async function sendCompleteRegistrationEmbed(user: User, usersService: UsersService) {
        const lastfmRegistrationURL = usersService.getRegistrationProcessLoginUrl(
            user
        );
        const title =  'Connect your Last.fm account';
        const description = `Please [proceed to Last.fm application connect page](${lastfmRegistrationURL}) and follow the steps on your browser.
If the link isn't working, try copying the URL: ${lastfmRegistrationURL}

**After you connect your account, react with ✅ to confirm.**`;

        const registrationEmbed = await composeBasicMessageEmbed(title, description);
        const sentMessage = await user.send(registrationEmbed);
    
        await sentMessage.react('❌');
        await sentMessage.react('✅');
        const collector = new ReactionCollector(
            sentMessage,
            (newReaction, user) =>
                !user.bot &&
                typeof newReaction.emoji.name === 'string' &&
                (newReaction.emoji.name === '✅' ||
                    newReaction.emoji.name === '❌'),
            { time: tenMinutesInMillis, max: 1 }
        );
    
        collector.on('collect', async (newReaction, user) => {
            if (newReaction.emoji.name === '✅') {
                sentMessage.delete();
                sendFinishRegistrationEmbed(user, usersService);
            } else if (newReaction.emoji.name === '❌'){
                usersService.cancelRegistrationProcess(user);
                user.send(
                    `I canceled your registration process. You can send **${process.env.DISCORD_BOT_PREFIX}register** to try again.`
                );
                sentMessage.delete();
            }
        });
    
        collector.on('end', (collected) => {
            if (
                collected.size === 0 &&
                usersService.isUserInRegistrationProcess(user)
            ) {
                usersService.cancelRegistrationProcess(user);
                user.send(
                    `Your registration process has expired. You can try again sending **${process.env.DISCORD_BOT_PREFIX}register**.`
                );
                sentMessage.delete();
            }
        });
    
        usersService.appendCollectorOnRegistrationProcess(user, collector);
    }
    
    async function sendFinishRegistrationEmbed(user: User, usersService: UsersService) {
        const title =  'Thanks! Just a second while we set everything up :)';
        let registrationEmbed = await composeBasicMessageEmbed(title);
    
        const sentMessage = await user.send(registrationEmbed);

        try {
            const registeredUser = await usersService.completeRegistrationProcess(
                user
            );
            let title = 'Registration completed';
            let description = `Your Last.fm login is **${registeredUser.lastfmUserName}**.`;
            let footer = 'Happy listening! Scrobbles have been enabled for you :)';
            registrationEmbed = await composeBasicMessageEmbed(title, description, footer);
    
            sentMessage.edit(registrationEmbed);
            sentMessage.react('🎶');
    
        } catch (error) {
            returnUserFriendlyErrorMessage(
                error,
                message,
                usersService,
                client
            );
            usersService.cancelRegistrationProcess(user);
            sentMessage.delete();
        }
    }
}