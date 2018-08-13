importScripts(
  './highlight.pack.js',
  '../node_modules/workly/dist/workly.min.js'
);

function highlight(str, lang) {
  return hljs.highlightAuto(str, [ lang ]).value;
}

workly.expose(highlight);