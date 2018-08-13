import { ipcRenderer as ipc } from 'electron';
import Markwright from 'markwright';
import * as React from 'react';
import * as cache from 'js-cache';

import { proxy } from 'workly';

import * as markwright from './themes/markwright';

export default class Preview extends React.Component<any, any> {
  public highlight = proxy('../assets/highlight.js');

  public mouse = { x: 0, y: 0 };

  public $hint: Record<string, HTMLElement> = {
    element: null,
    tooltip: null
  };

  public metadata(key: string, value: any) {
    return key in this.state.metadata ? this.state.metadata[key] : value;
  }

  public state = {
    metadata: {},
    markdown: '',
    css: ''
  };

  public get themeCSS() {
    return markwright.styles(this.state.metadata);
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
    ipc.on('editor.metadata', (e, metadata) => this.setState({ metadata }));
    ipc.on('editor.markdown', (e, markdown) => this.setState({ markdown }));
    ipc.on('editor.css', (e, css) => this.setState({ css }));
  }

  public componentDidMount() {
    this.registerIPCEvents();
    this.registerToolTipEvents();
  }

  public render() {
    return (
      <div>
        <style type="text/css">{this.state.css}</style>
        <style type="text/css">{this.themeCSS}</style>
        <style type="text/css">{this.hintCSS}</style>
        <Markwright
          config={{
            manual: this.metadata('manual', false),
            highlight: (str, lang) => {
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
        />
      </div>
    );
  }
}
