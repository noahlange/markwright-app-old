import * as cache from 'js-cache';
import Markwright from 'markwright';
import * as sizes from 'paper-size';
import * as React from 'react';
import { proxy } from 'workly';

import panzoom from 'panzoom';
import * as markwright from '../../themes/markwright';
import { listen, unlisten } from '../listen';

const {
  _home: home,
  _off: off,
  _on: on,
  _send: send,
  _session: session
} = window as any;

type PreviewProps = {};
type PreviewState = {
  metadata: any;
  content: string;
  styles: string;
};

export default class Preview extends React.Component<
  PreviewProps,
  PreviewState
> {
  public highlight = proxy('../lib/highlight.worker.js');
  public mouse = { x: 0, y: 0 };
  public scroller: HTMLDivElement | null = null;
  public pz: typeof panzoom | any = null;

  public $hint: Record<string, HTMLElement | null> = {
    element: null,
    tooltip: null
  };

  public state: PreviewState = {
    content: '',
    metadata: {},
    styles: ''
  };

  public get themeCSS() {
    const page = this.page;
    return markwright.styles(this.state.metadata, page.width, page.height);
  }

  public get page() {
    const paper = this.state.metadata.paper || 'letter';
    const isPortrait = this.state.metadata.orientation !== 'landscape';
    const dimensions = sizes.getSize(paper, { unit: 'inches' }) || [216, 279];
    const [width, height] = isPortrait ? dimensions : dimensions.reverse();
    return {
      height: Math.round(height * 20) / 20,
      width: Math.round(width * 20) / 20
    };
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

  public metadata(key: string, value: any) {
    return key in this.state.metadata ? this.state.metadata[key] : value;
  }

  public setBase(dir = home() + '/') {
    const base = document.head.querySelector('base');
    if (base) {
      base.setAttribute('href', dir);
    }
  }

  public componentWillUnmount() {
    if (this.pz) {
      this.pz.dispose();
    }
  }

  public onError = (e: any) => {
    const target = e.nativeEvent.target;
    send('app.error', `Image not found: "${ target.src }".`)
  }

  public componentDidMount() {
    this.registerDOMEvents();
    this.registerIPCEvents();
    sizes.register('letter', 216, 279);
    sizes.register('legal', 216, 356);
    sizes.register('tabloid', 279, 432);
    sizes.register('half-letter', 140, 216);
    this.setBase();
    send('app.ready');

    this.pz = panzoom(this.scroller as any, {
      autocenter: true,
      beforeWheel: (e: any) => {
        const stop = !e.altKey;
        if (stop) {
          if (e.shiftKey) {
            this.pz.moveBy(-e.deltaX / 10, 0);
          } else {
            this.pz.moveBy(0, -e.deltaY / 10);
          }
          e.preventDefault();
        }
        return stop;
      },
      maxZoom: 2,
      minZoom: 0.25,
      smoothScroll: false,
      zoomDoubleClickSpeed: 1
    }) as any;
  }

  public render() {
    const page = this.page;
    return (
      <main
        style={{
          alignItems: 'center',
          display: 'flex',
          height: '100vh',
          justifyContent: 'center',
          paddingTop: '2.5rem',
          width: '100vw'
        }}
      >
        <style type="text/css">{this.themeCSS}</style>
        <style type="text/css">{this.state.styles}</style>
        <style type="text/css">{this.hintCSS}</style>
        <div ref={r => (this.scroller = r)}>
          <Markwright
            config={{
              columns: this.metadata('columns', 1),
              highlight: async (str: string, lang: string) => {
                const key = `${lang}::${str}`;
                const has = cache.get(key);
                if (has) {
                  return has;
                } else {
                  const res = await this.highlight(str, lang);
                  cache.set(key, res);
                  return res;
                }
              },
              manual: this.metadata('manual', false),
              page: {
                height: page.height * 96,
                width: page.width * 96
              }
            }}
            value={this.state.content}
            page={1}
          />
        </div>
      </main>
    );
  }

  protected handleHint() {
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

  protected registerDOMEvents() {

    listen('mousemove', e => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    listen('mousewheel', e => {
      window.scrollBy({ top: -e.deltaY });
      e.preventDefault();
    });

    listen('keydown', e => {
      if (e.ctrlKey) {
        this.handleHint();
      }
    });

    listen('keyup', e => {
      if (this.$hint.tooltip) {
        document.body.removeChild(this.$hint.tooltip);
        delete this.$hint.tooltip;
      }
    });
  }

  protected unregisterDOMEvents() {
    unlisten('mousemove', 'mousewheel', 'keydown', 'keyup');
  }

  protected registerIPCEvents() {
    on('editor.metadata', (_: any, m: string) =>
      this.setState({ metadata: m })
    );
    on('editor.content', (_: any, c: string) => this.setState({ content: c }));
    on('editor.styles', (_: any, styles: string) => this.setState({ styles }));
    on('editor.base', (_: any, dir: string) => this.setBase(dir));
  }

  protected unregisterIPCEvents() {
    off('editor.metadata', 'editor.content', 'editor.styles', 'editor.base');
  }
}
