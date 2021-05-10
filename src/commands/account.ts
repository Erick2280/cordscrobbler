import { Message, Client, TextChannel } from 'discord.js';
import { UsersService } from '../users-service';
import { composeBasicMessageEmbed } from '../utils';

export const data = {
    name: 'account',
    description: 'View your registration details and preferences.',
    aliases: ['me', 'preferences'],
    args: false
};

export async function execute(message: Message, args: string[], usersService: UsersService, client: Client) {
    if (message.channel instanceof TextChannel) {
        message.reply('I sent a message to your DMs :)')
    }

    const registeredUser = usersService.getRegisteredUser(message.author);
    const messageText = `**Last.fm connected account**
[${registeredUser.lastfmUserName}](https://last.fm/user/${registeredUser.lastfmUserName})

**Scrobbling**
${registeredUser.isScrobbleOn ? '🟢 Enabled' : '🔴 Disabled'}
_When this option is enabled, Cordscrobbler will scrobble songs played to your Last.fm account. To turn it ${!registeredUser.isScrobbleOn ? 'on' : 'off'}, send \`${process.env.DISCORD_BOT_PREFIX}scrobbling ${!registeredUser.isScrobbleOn ? 'on' : 'off'}\`._

**Receive news and updates from Cordscrobbler**
${registeredUser.sendNewsMessages ? '🟢 Enabled' : '🔴 Disabled'}
_When this option is enabled, I will send news about Cordscrobbler updates, new features and so on. To turn it ${!registeredUser.sendNewsMessages ? 'on' : 'off'}, send \`${process.env.DISCORD_BOT_PREFIX}news ${!registeredUser.sendNewsMessages ? 'on' : 'off'}\`._
`

    const messageEmbed = await composeBasicMessageEmbed('Registration details', messageText)

    message.author.send(`Hello, ${message.author}!`);
    message.author.send(messageEmbed);

}