import { PlaybackData } from './data-providing-service';
import { LastfmService } from './lastfm-service';
import { User as DiscordUser, MessageCollector } from 'discord.js';
import { DatabaseService } from './database-service';

export class UsersService {
    private registeredUsers: RegisteredUser[];
    private registeringUsers: RegisteringUser[];
    private scrobbleCandidates: Object;
    private lastfmService: LastfmService;
    private databaseService: DatabaseService;

    constructor(databaseService: DatabaseService) {
        this.registeringUsers = [];
        this.registeredUsers = [];
        this.scrobbleCandidates = {};
        this.lastfmService = new LastfmService();
        this.databaseService = databaseService;
    }

    async retrieveAllRegisteredUsersFromDatabase() {
        this.registeredUsers = await this.databaseService.retrieveAllRegisteredUsers();
    }

    async startRegistrationProcess(discordUser: DiscordUser) {
                
        if (this.registeredUsers.find(x => x.discordUserId === discordUser.id)) {
            throw new Error('UserAlreadyRegistered')
        }

        if (this.registeringUsers.find(x => x.discordUserId === discordUser.id)) {
            throw new Error('UserAlreadyInRegistrationProcess')
        }
        
        const lastfmRequestToken = await this.lastfmService.fetchRequestToken();
        const registeringUser: RegisteringUser = {
            discordUserId: discordUser.id,
            discordUserName: discordUser.username,
            lastfmRequestToken
        }
        this.registeringUsers.push(registeringUser);
    }

    getRegistrationProcessLoginUrl(discordUser: DiscordUser): string {
        const registeringUser = this.registeringUsers.find(x => x.discordUserId === discordUser.id)

        if (!registeringUser) {
            throw new Error('UserNotInRegistrationProcess')
        }

        return this.lastfmService.getUserLoginUrl(registeringUser.lastfmRequestToken)
    } 

    cancelRegistrationProcess(discordUser: DiscordUser) {
        const registeringUser = this.registeringUsers.find(x => x.discordUserId === discordUser.id)
        this.removeUserIdFromRegisteringUsersArray(discordUser.id);
        registeringUser?.messageCollector?.stop();
    }

    async completeRegistrationProcess(discordUser: DiscordUser): Promise<RegisteredUser> {
        const registeringUser = this.registeringUsers.find(x => x.discordUserId === discordUser.id)
        try {
            const lastfmSessionResponse = await this.lastfmService.getSession(registeringUser.lastfmRequestToken)
            const registeredUser: RegisteredUser = {
                discordUserId: discordUser.id,
                discordUserName: discordUser.username,
                lastfmSessionKey: lastfmSessionResponse.sessionKey,
                lastfmUserName: lastfmSessionResponse.userName,
                isScrobbleOn: true
            };
            this.registeredUsers.push(registeredUser);
            await this.databaseService.setRegisteredUser(registeredUser);
            return Object.create(registeredUser);

        } finally {
            this.removeUserIdFromRegisteringUsersArray(discordUser.id);
        }
    }

    isUserInRegistrationProcess(discordUser: DiscordUser): boolean {
        return this.registeringUsers.findIndex(x => x.discordUserId === discordUser.id) !== -1;
    }

    appendCollectorOnRegistrationProcess(discordUser: DiscordUser, messageCollector: MessageCollector) {
        const registeringUser = this.registeringUsers.find(x => x.discordUserId === discordUser.id)
        if (registeringUser) {
            registeringUser.messageCollector = messageCollector;
        }
    }

    private removeUserIdFromRegisteringUsersArray(userId: string) {
        const registeringUserIdIndex = this.registeringUsers.findIndex(x => x.discordUserId === userId);
        if (registeringUserIdIndex !== -1) {
            this.registeringUsers.splice(registeringUserIdIndex, 1);
        }
    }

    isUserRegistered(discordUser: DiscordUser) {
        return this.registeredUsers.findIndex(x => x.discordUserId === discordUser.id) !== -1;
    }

    getRegisteredUser(discordUser: DiscordUser): RegisteredUser {
        const registeredUser = this.registeredUsers.find(x => x.discordUserId === discordUser.id);
        if (!registeredUser) {
            throw new Error('UserNotRegistered')
        }
        return Object.create(registeredUser);
    }

    toggleScrobblingForUser(discordUser: DiscordUser, isScrobbledOn: boolean) {
        const registeredUser = this.registeredUsers.find(x => x.discordUserId === discordUser.id);
        if (!registeredUser) {
            throw new Error('UserNotRegistered')
        }
        registeredUser.isScrobbleOn = isScrobbledOn;
        this.databaseService.setRegisteredUser(registeredUser);
    }

    async unregisterUser(discordUser: DiscordUser) {
        const registeredUserIndex = this.registeredUsers.findIndex(x => x.discordUserId === discordUser.id);
        
        if (registeredUserIndex === -1) {
            throw new Error('UserNotRegistered')
        }

        this.registeredUsers.splice(registeredUserIndex, 1);
        await this.databaseService.deleteRegisteredUser(discordUser.id);
    }

    addToScrobbleQueue(track: Track, playbackData: PlaybackData) {
        const thirtySecondsInMillis = 30000;
        for (const userId of playbackData.listeningUsersId) {
            const registeredUser = this.registeredUsers.find(x => x.discordUserId === userId)
            if (registeredUser?.isScrobbleOn) {
                this.lastfmService.updateNowPlaying(track, registeredUser.lastfmSessionKey).catch((error) => {console.error(error)})
            }
        }
        setTimeout(() => {this.dispatchScrobble(track, playbackData)}, thirtySecondsInMillis)
        this.scrobbleCandidates[playbackData.channelId] = playbackData.timestamp;
    }

    dispatchScrobble(track: Track, playbackData: PlaybackData) {
        if (this.scrobbleCandidates[playbackData.channelId] === playbackData.timestamp) {
            for (const userId of playbackData.listeningUsersId) {
                const registeredUser = this.registeredUsers.find(x => x.discordUserId === userId)
                if (registeredUser?.isScrobbleOn) {
                    this.lastfmService.scrobble([track], [playbackData], registeredUser.lastfmSessionKey).catch((error) => {console.error(error)})
                }
            }
        }
    }

    // TODO: What happens if the user revoked permissions? Can the bot send a DM to update tokens?
}

export type RegisteredUser = {
    discordUserId: string;
    discordUserName: string;
    lastfmUserName: string;
    lastfmSessionKey: string;
    isScrobbleOn: boolean;
};

export type RegisteringUser = {
    discordUserId: string;
    discordUserName: string;
    messageCollector?: MessageCollector;
    lastfmRequestToken: string;
}

export type Track = {
    artist: string;
    name: string;
    album?: string;
};

export type ScrobbleCandidate = {
    track: Track;
    playbackData: PlaybackData;
    timer: NodeJS.Timeout;
};
