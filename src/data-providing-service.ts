import { Message } from 'discord.js';
import { ChipDataProvider } from './data-providers/chip';
import { HydraDataProvider } from './data-providers/hydra';
import { JockieDataProvider } from './data-providers/jockie';
import { TempoDataProvider } from './data-providers/tempo';
import { GroovyDataProvider } from './data-providers/groovy';
import { RythmDataProvider } from './data-providers/rythm';

export interface DataProvider {
    providerName: string;
    providerAdditionalInfo: string;
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

export const allDataProviders: DataProvider[] = [
        new ChipDataProvider(),
        new HydraDataProvider(),
        new JockieDataProvider(),
        new TempoDataProvider(),
        new GroovyDataProvider(),
        new RythmDataProvider(),
    ];

export class DataProvidingService {
    dataProviders: DataProvider[];

    constructor(customDataProviders?: DataProvider[]) {
        if (customDataProviders) {
            this.dataProviders = customDataProviders;
        } else {
            this.dataProviders = allDataProviders;
        }
    }

    lookForPlaybackData(message: Message): PlaybackData {
        for (const dataProvider of this.dataProviders) {
            if (dataProvider.isHandleableMessage(message)) {
                return dataProvider.getPlaybackDataFromMessage(message);
            }
        }
        return null;
    }
}
