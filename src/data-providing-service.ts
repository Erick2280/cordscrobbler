import { Message } from 'discord.js';
import { GroovyDataProvider } from './music-providers/groovy';
import { HydraDataProvider } from './music-providers/hydra';

export interface DataProvider {
    providerName: string;
    isHandleableMessage(message: Message): boolean;
    getPlaybackDataFromMessage(message: Message): PlaybackData;
}

export type PlaybackData = {
    title: string;
    url?: string;
    listeningUsersId: string[];
    timestamp: Date;
    guildId: string;
    channelId: string;
    providerName: string;
};

export class DataProvidingService {
    availableDataProviders: DataProvider[];

    constructor(availableDataProviders?: DataProvider[]) {
        if (availableDataProviders) {
            this.availableDataProviders = availableDataProviders;
        } else {
            this.availableDataProviders = [new GroovyDataProvider(), new HydraDataProvider()];
        }
    }

    lookForPlaybackData(message: Message): PlaybackData {
        for (const dataProvider of this.availableDataProviders) {
            if (dataProvider.isHandleableMessage(message)) {
                return dataProvider.getPlaybackDataFromMessage(message);
            }
        }
        return null;
    }
}
