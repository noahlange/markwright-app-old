
# Markwright
Bare-bones DTP with Markdown and SASS.

```
git clone https://github.com/noahlange/markwright-app.git
cd markwright-app
yarn
yarn build
yarn start
```

If you're using NPM, the installation process is nearly identical.

```
git clone https://github.com/noahlange/markwright-app.git
cd markwright-app
npm install
npm run build
npm run start
```

## Changes
Syntax is slightly different than the Homebrewery proper. Instead of being determined with a combinations of blockquotes, line rules and other things, everything that isn't plain text
or a one-column table is enclosed in triple colons - ::: - followed by a word denoting the block type.