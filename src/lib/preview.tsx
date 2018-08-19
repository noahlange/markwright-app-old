import { ipcRenderer as ipc } from 'electron';
import * as cache from 'js-cache';
import Markwright from 'markwright';
import { homedir } from 'os';
import * as sizes from 'paper-size';
import * as React from 'react';
import { proxy } from 'workly';

import * as markwright from '../themes/markwright';

type PreviewProps = {};
type PreviewState = {
  metadata: any;
  markdown: string;
  css: string;
};

export default class Preview extends React.Component<
  PreviewProps,
  PreviewState
> {
  public highlight = proxy('../lib/highlight.worker.js');

  public mouse = { x: 0, y: 0 };

  public $hint: Record<string, HTMLElement | null> = {
    element: null,
    tooltip: null
  };

  public metadata(key: string, value: any) {
    return key in this.state.metadata ? this.state.metadata[key] : value;
  }

  public state: PreviewState = {
    metadata: {},
    markdown: '',
    css: ''
  };

  public get themeCSS() {
    const page = this.page;
    return markwright.styles(this.state.metadata, page.width, page.height);
  }

  public get hintCSS() {
    return `
      .hint {
        position: absolute;
        box-sizing: border-box;
        border: 1px solid rgba(0,0,0,0.5);
        background-color: rgba(0,0,0,0.25);
        z-index: 100;
      }
      .hint > span {
        cursor: none;
        padding: 4px;
        display: block;
        position: absolute;
        left: -1px;
        top: -1px;
        color: white;
        font-family: var(--font-mono);
        font-size: 10px;
        background-color: rgba(0,0,0,0.75);
        border-radius: 2px;
      }
    `;
  }

  protected registerToolTipEvents() {
    document.addEventListener('mousemove', e => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    document.addEventListener('keydown', e => {
      if (e.altKey) {
        if (this.$hint.tooltip) {
          document.body.removeChild(this.$hint.tooltip);
          delete this.$hint.tooltip;
        }
        this.$hint.element = document.elementFromPoint(
          this.mouse.x,
          this.mouse.y
        ) as HTMLElement;
        this.$hint.tooltip = document.createElement('div');
        const hintText = document.createElement('span');
        const classNames = this.$hint.element.className.split(' ').join('.');
        hintText.textContent = `${this.$hint.element.tagName.toLowerCase()}${
          this.$hint.element.id ? `#${this.$hint.element.id}` : ''
        }${classNames ? `.${classNames}` : classNames}`;
        const rect = this.$hint.element.getBoundingClientRect();
        this.$hint.tooltip.style.left = `${rect.left}px`;
        this.$hint.tooltip.style.top = `${rect.top + window.scrollY}px`;
        this.$hint.tooltip.style.width = `${rect.width}px`;
        this.$hint.tooltip.style.height = `${rect.height}px`;
        this.$hint.tooltip.appendChild(hintText);
        this.$hint.tooltip.classList.add('hint');
        document.body.appendChild(this.$hint.tooltip);
      }
    });

    document.addEventListener('keyup', e => {
      if (this.$hint.tooltip) {
        document.body.removeChild(this.$hint.tooltip);
        delete this.$hint.tooltip;
      }
    });
  }

  protected registerIPCEvents() {
    ipc.on('editor.metadata', (_: any, metadata: string) =>
      this.setState({ metadata })
    );
    ipc.on('editor.markdown', (_: any, markdown: string) =>
      this.setState({ markdown })
    );
    ipc.on('editor.css', (_: any, css: string) => this.setState({ css }));
    ipc.on('editor.base', (_: any, dir: string) => this.setBase(dir));
  }

  public get page() {
    const paper = this.state.metadata.paper || 'letter';
    const isPortrait = this.state.metadata.orientation !== 'landscape';
    const dimensions = sizes.getSize(paper, { unit: 'inches' }) || [216, 279];
    const [width, height] = isPortrait ? dimensions : dimensions.reverse();
    return {
      width: Math.round(width * 20) / 20,
      height: Math.round(height * 20) / 20
    };
  }

  public setBase(dir = homedir() + '/') {
    const base = document.head.querySelector('base');
    if (base) {
      base.setAttribute('href', dir);
    }
  }

  public componentDidMount() {
    this.registerToolTipEvents();
    this.registerIPCEvents();
    sizes.register('letter', 216, 279);
    sizes.register('legal', 216, 356);
    sizes.register('tabloid', 279, 432);
    sizes.register('half-letter', 140, 216);
    this.setBase();
    ipc.send('app.ready');
  }

  public render() {
    const page = this.page;
    return (
      <main
        style={{
          paddingTop: '2.5rem',
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <style type="text/css">{this.themeCSS}</style>
        <style type="text/css">{this.state.css}</style>
        <style type="text/css">{this.hintCSS}</style>
        <Markwright
          config={{
            page: {
              width: page.width * 96,
              height: page.height * 96
            },
            manual: this.metadata('manual', false),
            highlight: (str: string, lang: string) => {
              const key = `${lang}::${str}`;
              const has = cache.get(key);
              if (has) {
                return has;
              } else {
                const res = this.highlight(str, lang);
                cache.set(key, res);
                return res;
              }
            }
          }}
          value={this.state.markdown}
          page={1}
        />
      </main>
    );
  }
}
