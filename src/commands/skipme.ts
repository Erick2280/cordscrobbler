import { Message, Client } from 'discord.js';
import { UsersService } from '../users-service';

export const data = {
    name: 'skipme',
    description: 'Skip the scrobble of a track on your Last.fm account. You can do it within 30 seconds after the track has started playing.',
    args: false
};

export async function execute(message: Message, args: string[], usersService: UsersService, client: Client) {
    // TODO: Skip scrobble
}