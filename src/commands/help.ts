import { Message, TextChannel } from 'discord.js';
import fs from 'fs';

export const data = {
    name: 'help',
    description: 'Show user help.',
    alias: ['about'],
    args: false
};

export function execute(message: Message) {

    let messageText =
`discord2lastfm v${process.env.NPM_PACKAGE_VERSION}

__**What is this bot?**__
This bot scrobble songs played by bots on your Discord server to Last.fm. I will automatically scrobble if you are on the same audio channel as the bot, on any server that I'm added to.
To enable it for you, you'll need to log in with your Last.fm account using **${process.env.DISCORD_BOT_PREFIX}register**.

__**Commands**__`;
    const commandsFolder = __dirname;
    const commandFiles = fs.readdirSync(commandsFolder).filter(file => file.endsWith('.js') || file.endsWith('.ts'));
    
    for (const file of commandFiles) {
        const command = require(`${commandsFolder}/${file}`);
            messageText += `\n**${process.env.DISCORD_BOT_PREFIX}${command.data.name}**`;
            if (command.data.usage) {
                messageText += ` _${command.data.usage}_`;
            }
            if (command.data.aliases) {
                messageText += `\n_it can also be called using `;
                let index = 0;
                for (const alias of command.data.aliases) {
                    messageText +=`**${process.env.DISCORD_BOT_PREFIX}${alias}**`;
                    if (index !== command.data.aliases.length - 1) {
                        messageText += ', ';
                    }

                    index++;
                }
                messageText += `_`;
            }
            messageText += `\n• ${command.data.description}\n`;
    }
    if (message.channel instanceof TextChannel) {
        message.reply('I sent the help via DM :)')
    }
    message.author.send(messageText);
}