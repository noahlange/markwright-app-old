import { highlightAuto } from 'highlight.js';
import { expose } from 'workly';

function highlight(str, lang) {
  return highlightAuto(str, [lang]).value;
}

expose(highlight);
