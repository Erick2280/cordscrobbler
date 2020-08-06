import * as Discord from 'discord.js';
import * as dotenv from 'dotenv';

import fs from 'fs';

import { DataProvidingService } from './data-providing-service';
import { UsersService } from './users-service';

import { parseTrack } from './track-parser';
import { returnExpectedCommandUsage, returnUserFriendlyErrorMessage } from './error-handling';

dotenv.config();

const client = new Discord.Client();
const dataProvidingService = new DataProvidingService();
const usersService = new UsersService();

const commands = new Discord.Collection<string, any>();
const commandsFolder = __dirname + '/commands';
const commandFiles = fs.readdirSync(commandsFolder).filter(file => file.endsWith('.js') || file.endsWith('.ts'));

for (const file of commandFiles) {
    const command = require(`${commandsFolder}/${file}`);
	commands.set(command.data.name, command);
}

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async (message) => {
    if ((message.channel instanceof Discord.DMChannel || message.channel instanceof Discord.TextChannel) &&
        !message.author.bot &&
        message.content.startsWith(process.env.DISCORD_BOT_PREFIX)) {
        
        const args: string[] = message.content.slice(process.env.DISCORD_BOT_PREFIX.length).split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = commands.get(commandName) ??
                    commands.find(cmd => cmd.data.aliases && cmd.data.aliases.includes(commandName));

        if (!command) {
            message.reply(`I didn't recognize this command. You can see all the available commands by sending **${process.env.DISCORD_BOT_PREFIX}help**.`);
            return;
        }

        if (command.data.args && args.length === 0) {
            returnExpectedCommandUsage(commandName, command.data.usage, message);
            return;
        }

        try {
            await command.execute(message, args, usersService, client);
        } catch (error) {
            returnUserFriendlyErrorMessage(error, message, usersService, client);
        }

        // TODO: Scrobble after 30 seconds, check scrobble history/queue on fail
        // TODO: See registered users for a given guild
        // TODO: Change user options
    }

    if (message.channel instanceof Discord.TextChannel && message.author.bot) {
        const playbackData = dataProvidingService.lookForPlaybackData(message);
        if (playbackData) {
            const track = parseTrack(playbackData);
            usersService.addToScrobbleQueue(track, playbackData);
        }
    }

});

client.login(process.env.DISCORD_TOKEN);
