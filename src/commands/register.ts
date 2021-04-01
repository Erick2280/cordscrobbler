import { Message, Client, TextChannel, MessageCollector, ReactionCollector, User, MessageEmbed } from 'discord.js';
import { UsersService } from '../users-service';

import { returnUserFriendlyErrorMessage } from '../error-handling';
import { composeSimpleMessageEmbed, EmbedPage, parsePrivacyPolicy } from '../utils';

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
        message.reply('I sent the steps to connect your Last.fm account via DM.')
    }

    await usersService.startRegistrationProcess(message.author)

    message.author.send(`Let's connect your Last.fm account with this bot!
First, I need you to read my Privacy Policy below, use the arrows to move through the pages.
It's very short and straightforward, I promise :)
React with ✅ in the last page to confirm that you agree with my Privacy Policy, and i'll send you the link to complete the process.     
`);

    let privacyPolicy = await parsePrivacyPolicy();

    sendPrivacyPolicyEmbed(message.author, privacyPolicy, 0, usersService);

}

async function sendPrivacyPolicyEmbed(user: User,privacyPolicy: EmbedPage[], page: number, usersService: UsersService){

    let privacyPolicyTitle = privacyPolicy[page].title;
    let privacyPolicyDescription = privacyPolicy[page].description;
    let privacyPolicyPagination = `Page ${page+1} of 3`;


    let parsedPrivacyPolicyPage = await composeSimpleMessageEmbed(privacyPolicyTitle, privacyPolicyDescription, privacyPolicyPagination);

    let sentMessage = await user.send(parsedPrivacyPolicyPage);


    if(page == 0){
        sentMessage.react("➡️");
    }else if(page == 1) {
        sentMessage.react("⬅️");
        sentMessage.react("➡️");
    }else{
        sentMessage.react("⬅️");
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
                newReaction.emoji.name === "➡️"||
                newReaction.emoji.name === "⬅️"),
        { time: tenMinutesInMillis, max: 1 }
    );

    collector.on('collect', async (newReaction, user) => {
        if (newReaction.emoji.name === "➡️" && page < 2) {
            await sentMessage.delete();
            sendPrivacyPolicyEmbed(user, privacyPolicy, page+1, usersService);
        }else if(newReaction.emoji.name === "⬅️" && page > 0){
            await sentMessage.delete();
            sendPrivacyPolicyEmbed(user, privacyPolicy, page-1, usersService);
        }else if(newReaction.emoji.name === '✅' && page == 2){
            await sentMessage.delete();
            sendCompleteRegistrationEmbed(user, usersService);
        }else if(newReaction.emoji.name === '❌' && page == 2){
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


async function sendCompleteRegistrationEmbed(user: User, usersService: UsersService){

    let registrationEmbed: MessageEmbed;
    let sentMessage: Message;

    let lastfmRegistrationURL = usersService.getRegistrationProcessLoginUrl(
        user
    );
    let title =  "Last Step";
    let description = `[Click Here to link your lastfm account](${lastfmRegistrationURL})`;
    let footer = 'React with ✅ to confirm';
    registrationEmbed = await composeSimpleMessageEmbed(title, description, footer);
    sentMessage = await user.send(registrationEmbed);

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
            newReaction.message.channel.send(
                `I canceled your registration process. You can send **${process.env.DISCORD_BOT_PREFIX}register** to try again.`
            );
            usersService.cancelRegistrationProcess(user);
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
        }
    });

    usersService.appendCollectorOnRegistrationProcess(user, collector);
}


async function sendFinishRegistrationEmbed(user: User, usersService: UsersService) {


    let title =  'Thanks! Just a second while we set everything up :)';
    let registrationEmbed = await composeSimpleMessageEmbed(title, "", "");

    let sentMessage = await user.send(registrationEmbed);

    try {

        const registeredUser = await usersService.completeRegistrationProcess(
            user
        );
        let title =  'Registration completed';
        let description = `Your Last.fm login is **${registeredUser.lastfmUserName}**.`;
        let footer = 'Scrobbles have been enabled for you :)';
        registrationEmbed = await composeSimpleMessageEmbed(title, description, footer);

        sentMessage.edit(registrationEmbed);
        sentMessage.react("🎶");

    } catch (error) {
        returnUserFriendlyErrorMessage(
            error,
            sentMessage,
            usersService,
            null
        );
        usersService.cancelRegistrationProcess(user);
    }
}