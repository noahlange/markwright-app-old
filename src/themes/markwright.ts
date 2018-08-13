import * as sizes from 'paper-size';

sizes.register('letter', 216, 279);
sizes.register('legal', 216, 356);
sizes.register('tabloid', 279, 432);
sizes.register('half-letter', 140, 216);

const options = [
  'a0',
  'a1',
  'a2',
  'a3',
  'a4',
  'a5',
  'a6',
  'a7',
  'a8',
  'a9',
  'a10',
  'b0',
  'b1',
  'b2',
  'b3',
  'b4',
  'b5',
  'b6',
  'b7',
  'b8',
  'b9',
  'b10',
  'c0',
  'c1',
  'c2',
  'c3',
  'c4',
  'c5',
  'c6',
  'c7',
  'c8',
  'c9',
  'c10',
  'letter',
  'legal',
  'half-letter',
  'tabloid'
];

export const schema = {
  type: 'object',
  properties: {
    columns: {
      title: 'Column count',
      default: 2,
      type: 'integer'
    },
    manual: {
      title: 'Manual pagination',
      default: false,
      type: 'boolean'
    },
    paper: {
      title: 'Paper size',
      description: 'Common name of paper size',
      default: 'letter',
      enum: options
    }
  }
};

export const defaults = {
  columns: 2,
  paper: 'letter'
};

export function styles(metadata) {
  const o = Object.assign(defaults, metadata);
  const [width, height] = sizes.getSize(
    options.includes(o.paper) ? o.paper : 'letter',
    { unit: 'inches' }
  );

  const marginInner = 0.375;
  const marginOuter = 0.625;
  const marginTop = 1;
  const marginBottom = 1;
  const gutter = 0.5;
  const innerWidth = width - marginInner - marginOuter;

  return `
    :root {
      --page-width: ${width}in;
      --page-height: ${height}in;
      
      --inner-width: ${innerWidth}in;
    
      --col-width: ${(innerWidth - (o.columns - 1) * gutter) / o.columns}in;
      --col-height: ${height - marginTop - marginBottom}in;
      --col-gutter: ${gutter}in;

      --margin-inner: ${marginInner}in;
      --margin-outer: ${marginOuter}in;
      --margin-top: ${marginTop / 2}in;
      --margin-bottom: ${marginBottom / 2}in;
    
      --grey-light: #efefef;
    
      --font-sans: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'Segoe UI',
        Roboto, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji',
        'Segoe UI Symbol';
      --font-mono: 'Fira Code', monospace;
      --font-body: var(--font-sans);
      --font-heading: var(--font-sans);
      --font-title: var(--font-sans);
    }
    
    body {
      margin: 0;
    }
    
    .mw {
      display: table;
      clear: both;
      font-family: var(--font-sans);
      width: var(--page-width);
      height: var(--page-height);
      font-size: 13px;
    }
    
    .section {
      display: flex;
      flex-direction: column;
    }
    
    .page {
      overflow: hidden;
      position: relative;
      display: flex;
      flex-direction: column;
      height: var(--page-height);
      width: var(--page-width);
    }
    
    .odd .header,
    .odd .pagination,
    .odd .body {
      margin-right: var(--margin-inner);
      margin-left: var(--margin-outer);
    }
    
    .even .header,
    .even .pagination,
    .even .body {
      margin-left: var(--margin-inner);
      margin-right: var(--margin-outer);
    }
    
    .header {
      height: 1rem;
      margin: var(--margin-top) 0;
    }
    
    .body {
      display: flex;
      flex-direction: column;

      width: var(--inner-width);
      flex-basis: var(--col-height);
    }
    
    .pagination {
      height: 1rem;
      margin: var(--margin-bottom) 0;
    }
    
    .even .header,
    .even .pagination {
      text-align: right;
    }
    
    .odd .header,
    .odd .pagination {
      text-align: left;
    }
    
    .content {
      display: flex;
      flex-grow: 1;
      overflow: hidden;
      flex-direction: row;
    }
    
    .column {
      flex-basis: var(--col-width);
      width: var(--col-width);
      height: var(--col-height);
      min-height: var(--col-height);
      flex-grow: 0;
      flex-shrink: 0;
      word-wrap: break-word;
    }
    
    .page-display {
      display: flex;
    }
    
    .page-display > div {
      margin-right: 1rem;
    }
    
    .column-separator {
      min-width: var(--col-gutter);
      height: 100%;
    }
    
    .footnotes:not(.empty) {
      border-top: 1px solid var(--grey-light);
      margin-top: 0.5rem;
      padding-top: 0.5rem;
    }
    
    pre, code {
      font-family: var(--font-mono);
    }
    
    blockquote {
      padding-left: 0.5rem;
      margin-left: 0.5rem;
    }

    @media screen {
      .page {
        border-radius: 3px;
        border: 1px solid #efefef;
        margin: 1rem;
        background-color: white;
      }
    }
    
  `;
}
