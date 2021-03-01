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
`discord2lastfm v${process.env.NPM_PACKAGE_VERSION ?? require('../lib/version.js')}

__**What is this bot?**__
This bot scrobbles songs played by other bots on your Discord server to Last.fm. I will automatically scrobble if you are on the same audio channel as the bot, on any server that I'm added to.
To enable it for you, you'll need to send a message to me with **${process.env.DISCORD_BOT_PREFIX}register** and log in with your Last.fm account.

Some bots require additional configuration. Please send **${process.env.DISCORD_BOT_PREFIX}supportedbots** for further help on this.

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

    messageText += `\nI'm open source! Visit my GitHub project page on https://github.com/Erick2280/discord2lastfm. If you're facing any issues, you can report them on https://github.com/Erick2280/discord2lastfm/issues.`

    if (message.channel instanceof TextChannel) {
        message.reply('I sent the help via DM :)')
    }
    message.author.send(messageText);
}