const fs = require('node:fs');
const path = require('node:path');

const gamesDirectory = path.join(__dirname, '..', 'games');
const gameFolders = fs.readdirSync(gamesDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => fs.existsSync(path.join(gamesDirectory, entry.name, 'index.html')))
    .map((entry) => entry.name)
    .sort((first, second) => first.localeCompare(second));

fs.writeFileSync(
    path.join(gamesDirectory, 'games-list.js'),
    `window.GAMES = ${JSON.stringify(gameFolders)};\n`
);