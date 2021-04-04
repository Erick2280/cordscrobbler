import axios from 'axios';
import md5 from 'crypto-js/md5';
import getUnixTime from 'date-fns/getUnixTime';
import { Track } from './users-service';
import { PlaybackData } from './data-providing-service';

export class LastfmService {
    
    readonly apiRootUrl = 'https://ws.audioscrobbler.com/2.0'
    readonly userAgent = 'cordscrobbler/1.0.0'

    performRequest(params: URLSearchParams, type: 'get' | 'post', signed: boolean) {
      params.set('api_key', process.env.LASTFM_API_KEY)
      params.set('format', 'json');

      if (signed) {
        if (type === 'post' && !params.has('sk')) {
          throw new Error('SessionKeyNotProvidedOnRequest')
        }
        params.set('api_sig', this.getCallSignature(params))
      }
      const url = `${this.apiRootUrl}/?${params.toString()}`;

      if (type === 'get') {
        return axios.get(url, {headers: {'User-Agent': this.userAgent}});
      }

      if (type === 'post') {
        return axios.post(url, null, {headers: {'User-Agent': this.userAgent}});
      }

    }

    async fetchRequestToken(): Promise<string> {
      const params = new URLSearchParams()
      params.set('method', 'auth.gettoken')
      let request;
      try {
        request = await this.performRequest(params, 'get', true);
      } catch (error) {
        if (error?.response?.data?.error === 11 && error?.response?.data?.error === 16) {
          throw new Error('LastfmServiceUnavailable')
        } else {
          throw new Error('LastfmRequestUnknownError')
        }
      }
      return request.data.token;
    }

    getUserLoginUrl(token: string): string {
        return `http://www.last.fm/api/auth/?api_key=${process.env.LASTFM_API_KEY}&token=${token}`
    }

    async getSession(token: string): Promise<LastfmSessionResponse> {
        const params = new URLSearchParams()
        params.set('method', 'auth.getsession')
        params.set('token', token)
        let request;
        try {
           request = await this.performRequest(params, 'get', true);
        } catch (error) {
            if (error?.response?.data?.error === 14) {
              throw new Error('LastfmTokenNotAuthorized')
            } if (error?.response?.data?.error === 11 && error?.response?.data?.error === 16) {
              throw new Error('LastfmServiceUnavailable')
            } else {
              console.error(error)
              throw new Error('LastfmRequestUnknownError')
            }
        }

        const userName = request.data.session.name;
        const sessionKey = request.data.session.key;

        return {
          sessionKey,
          userName
        };

    }

    async scrobble(tracks: Track[], playbacksData: PlaybackData[], sessionKey: string) {
      const params = new URLSearchParams()
      
      params.set('method', 'track.scrobble')
      params.set('sk', sessionKey)

      for (const [i, track] of tracks.entries()) {
        params.set(`artist[${i}]`, track.artist);
        params.set(`track[${i}]`, track.name);
        params.set(`timestamp[${i}]`, getUnixTime(playbacksData[i].timestamp).toString())
        if (track.album) {
          params.set(`album[${i}]`, track.album)
        }
      }

      try {
        await this.performRequest(params, 'post', true)
      } catch (error) {
        if (error?.response?.data?.error === 9) {
          throw new Error('LastfmInvalidSessionKey')
        } else {
          console.error(error)
          throw new Error('LastfmRequestUnknownError')
        }
      }
        // TODO: Check scrobble history/queue on fail

    }

    async updateNowPlaying(track: Track, sessionKey: string, durationInSeconds?: number) {
      const params = new URLSearchParams()
      
      params.set('method', 'track.updatenowplaying')
      params.set('sk', sessionKey)

      params.set(`artist`, track.artist);
      params.set(`track`, track.name);
      if (track.album) {
        params.set(`album`, track.album)
      }
      if (durationInSeconds) {
        params.set(`duration`, durationInSeconds.toString())
      }

      try {
        await this.performRequest(params, 'post', true)
      } catch (error) {
        if (error?.response?.data?.error !== 9) {
          console.error(error)
        }
      }
    }

    getCallSignature(params: URLSearchParams) {
        // Based on the implementation of https://github.com/jammus/lastfm-node/blob/master/lib/lastfm/lastfm-request.js
        let signatureString = '';
        
        params.sort()

        for (const [key, value] of params) {
          if (key !== 'format') {
            const copiedValue = typeof value !== 'undefined' && value !== null ? value : '';
            signatureString += key + copiedValue;
          }
        }

        signatureString += process.env.LASTFM_SHARED_SECRET;
        return md5(signatureString);
    }

}

type LastfmSessionResponse = {
  sessionKey: string
  userName: string
}