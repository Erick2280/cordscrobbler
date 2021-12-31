import { Message, TextChannel } from 'discord.js';
import fs from 'fs';
import { composeBasicMessageEmbed } from '../utils';

export const data = {
    name: 'help',
    description: 'Show user help.',
    alias: ['about'],
    args: false
};

export async function execute(message: Message) {

    let messageText =
`**What is this bot?**

This bot scrobbles songs played by other bots on your Discord server to Last.fm. I will automatically scrobble if you are on the same audio channel as the bot, on any server that I'm added to.
To enable it for you, you'll need to send a message to me with \`${process.env.DISCORD_BOT_PREFIX}register\` and log in with your Last.fm account.

Note that I will send messages to acknowledge scrobbles every song when someone requests another bot (such as Hydra) to play music. As this may bother some, I suggest creating a text channel just for bots.

Some bots require additional configuration. Please send \`${process.env.DISCORD_BOT_PREFIX}supportedbots\` for further help on this.

**Commands**\n`;
    const commandsFolder = __dirname;
    const commandFiles = fs.readdirSync(commandsFolder).filter(file => file.endsWith('.js') || file.endsWith('.ts'));
    
    for (const file of commandFiles) {
        const command = require(`${commandsFolder}/${file}`);
            messageText += `\n\`${process.env.DISCORD_BOT_PREFIX}${command.data.name}`;
            if (command.data.usage) {
                messageText += ` ${command.data.usage}\``;
            } else {
                messageText += `\``
            }
            if (command.data.aliases) {
                messageText += `\n_it can also be called using `;
                let index = 0;
                for (const alias of command.data.aliases) {
                    messageText +=`\`${process.env.DISCORD_BOT_PREFIX}${alias}\``;
                    if (index !== command.data.aliases.length - 1) {
                        messageText += ', ';
                    }

                    index++;
                }
                messageText += `_`;
            }
            messageText += `\n• ${command.data.description}\n`;
    }

    messageText += `\nI'm open source! Visit my GitHub project page on https://github.com/Erick2280/cordscrobbler. If you're facing any issues, you can report them on [GitHub](https://github.com/Erick2280/cordscrobbler/issues) or on [Cordscrobbler Discord server](https://discord.gg/yhGhQj6cGa).`

    const versionFooter = `Cordscrobbler v${process.env.NPM_PACKAGE_VERSION ?? require('../lib/version.js')}`

    const messageEmbed = await composeBasicMessageEmbed('Help', messageText, versionFooter)

    if (message.channel instanceof TextChannel) {
        message.reply('I sent the help via DM :)')
    }

    message.author.send(messageEmbed);
}