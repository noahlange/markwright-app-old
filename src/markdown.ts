import * as Markdown from 'marked';
const renderer = new Markdown.Renderer();

renderer.code = (code, language) => {
  return `<div class="block block-${ language }">${ render(code) }</div>`;
}

export default function render(text: string) {
  text = text.replace('\\col', '<div class="col-break"></div>');
  return Markdown(text, {
    renderer,
    tables: true,
    gfm: true,
    breaks: true,
    smartypants: true
  });
}
