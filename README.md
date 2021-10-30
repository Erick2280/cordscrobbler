<div align="center">

<p>
	<img width="256" src="./assets/icon-and-name.svg" alt="Cordscrobbler"/>
</p>
<p>Last.fm scrobbler for songs played by other bots on your Discord server.</p>

![Build status](https://github.com/Erick2280/cordscrobbler/workflows/build/badge.svg)

<p>
    <a href="https://discord.com/oauth2/authorize?client_id=739266400476201061&permissions=2147994688&scope=bot" target="_blank" rel="noreferrer">
        <img width="400" src="./assets/add-to-your-server-button.svg" alt="Add to your server"/>
    </a>
</p>

</div>

---

_Looking for **discord2lastfm**? Discord does not accept bots that include "discord" in the name, so the bot is now "Cordscrobbler"._

## How it works

This bot scrobbles songs played by other bots on your Discord server to Last.fm. It will automatically scrobble if the user is on the same audio channel as the bot, on any server that this bot is added to.

To enable it for you, you'll need to send a message to the bot with `-cords register` and log in with your Last.fm account.

## Supported integrations

- [Chip Bot](https://chipbot.gg/)
- [Hydra Bot](https://hydra.bot/)
- [Jockie Music](https://jockiemusic.com/)
- [Tempo Bot](https://tempobot.net/)
- [Groovy Bot (out of service)](https://groovy.bot/)
- [Rythm Bot (out of service)](https://rythmbot.co/) (requires additional configuration)

## Adding to your server

Just [click here to add to your server](https://discord.com/oauth2/authorize?client_id=739266400476201061&permissions=2147994688&scope=bot) :)

## Running from source

This project uses [discord.js](https://discord.js.org/) and needs [Node.js](https://nodejs.org) LTS to be installed on your machine.

First, install the project dependencies running:

    npm install

Then, on the project root folder, create a new `.env` file and copy the contents of the `.env.template`.

Replace the following fields:
- `<your-discord-bot-token>`: The Discord token for your bot, which can be obtained from the [Discord developer portal](https://discordapp.com/developers/applications). 
- `<your-spotify-app-client-id>` and `<your-spotify-app-client-secret>`: Tokens from your Spotify integration, which can be obtained on the [Spotify developer dashboard](https://developer.spotify.com/dashboard/applications). This bot uses the Spotify API to look for track information.
- `<your-lastfm-api-key>` and `<your-lastfm-shared-secret>`: The tokens from Last.fm API, which can be obtained on the [Last.fm create API account form](https://www.last.fm/api/account/create).
- `<service-account-key-file-base64>`: A service account key file encoded in base64 from a Firebase project. This bot uses Firebase Firestore to store user data.
- `<your-firebase-database-url>`: The Firebase Database URL from a Firebase project.
- `<your-topgg-token>`: The token from top.gg API, to post bot usage statistics. It is optional, and statistics are only sent when `NODE_ENV` is set to `production`.

Remember to keep these tokens in a safe place.

You can also change the bot prefix by replacing `-cords `.

Finally, to start the bot, run:

    npm run build
    npm start

Alternatively, you can run `npm run watch` while testing to automatically reload on file changes.

## Contact

If you find any problems during the bot usage, please [open an issue](https://github.com/Erick2280/cordscrobbler/issues) here on GitHub. PRs are welcome too!

Feel free to [join the Cordscrobbler Discord server](https://discord.gg/yhGhQj6cGa). Feedbacks are appreciated!
