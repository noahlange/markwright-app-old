import * as React from 'react';
import { basename, dirname } from 'path';
import * as Sass from 'sass.js/dist/sass.js';
import { autobind } from 'core-decorators';

import { ipcRenderer as ipc, remote, WebviewTag } from 'electron';
import { readFileSync, writeFileSync } from 'fs';
import { transcludeString } from 'hercule';
import * as WebView from 'react-electron-web-view';
import { parse } from 'jsonc-parser';
import { promisify } from 'util';

import { homedir } from 'os';

import { Mosaic, MosaicWindow } from 'react-mosaic-component';
const TypedMosaic = Mosaic.ofType<'e' | 'p'>();
const TypedWindow = MosaicWindow.ofType<'e' | 'p'>();

import * as r from '../lib/resolvers';
import Editor, { ContentType } from './editor';
import { version } from '../../package.json';

type AppState = {
  current: string;
  base: string;
  initial: Record<ContentType, string>;
  error: boolean;
  errorText: string;
};

const transclude = promisify(transcludeString);

export default class App extends React.Component<any, AppState> {
  protected _scss: typeof Sass = new Sass();
  protected _read: boolean = false;
  protected _preview: WebviewTag | null = null;
  protected _content: Record<ContentType & 'css', string> = {
    version,
    styles: '',
    content: '',
    metadata: '',
    css: ''
  };

  public state: AppState = {
    current: 'Untitled.mw',
    base: homedir() + '/',
    initial: {
      styles: '',
      metadata: '{}',
      content: ''
    },
    error: false,
    errorText: ''
  };

  public get initial() {
    if (!this._read) {
      this._read = true;
      return this.state.initial;
    } else {
      return null;
    }
  }

  public sass(str: string): Promise<string> {
    const t = `sass-${Date.now()}`;
    console.time(t);
    return new Promise((resolve, reject) => {
      this._scss.compile(str, (res: any) => {
        console.timeEnd(t);
        res.status ? reject(res.message) : resolve(res.text);
      });
    });
  }

  @autobind
  public openFile(_: any, file: string) {
    this._read = false;
    this.setState(
      {
        current: basename(file),
        base: dirname(file) + '/',
        initial: parse(readFileSync(file, 'utf8'))
      },
      () => {
        this.onChange('content', this.state.initial.content);
        this.onChange('metadata', this.state.initial.metadata);
        this.onChange('styles', this.state.initial.styles);
        if (this._preview) {
          this._preview.send('editor.base', this.state.base);
        }
      }
    );
  }

  @autobind
  public saveFile(_: any, file: string) {
    try {
      this.setState({ current: basename(file) });
      writeFileSync(file, JSON.stringify(this._content), 'utf8');
    } catch (e) {
      console.warn(e);
    }
  }

  public componentDidMount() {
    Sass.setWorkerUrl('../node_modules/sass.js/dist/sass.worker.js');
    this._scss.importer(r.sass(() => this.state.base));
    this._preview = document.querySelector('webview');
    ipc.on('save', this.saveFile);
    ipc.on('open', this.openFile);
    // attempt to open file on Windows
    const args = remote.process.argv.slice();
    let arg;
    while ((arg = args.pop())) {
      if (/mw$/.test(arg)) {
        this.openFile(null, arg);
      }
    }
  }

  @autobind
  public onMouseOver() {
    if (this._preview) {
      this._preview.focus();
    }
  }

  @autobind
  public async onChange(key: ContentType, value: string) {
    const preview = this._preview || {
      send: (_key: string, _value: any) => null
    };
    switch (key) {
      case 'metadata':
        try {
          const data = parse(value);
          this._content = { ...this._content, metadata: value };
          preview.send('editor.metadata', data || {});
        } catch (e) {
          console.warn('bad metadata');
        }
        break;
      case 'content':
        try {
          const markdown = await transclude(value, {
            resolvers: r.markdown(this.state.base)
          });
          this._content = { ...this._content, content: value };
          preview.send('editor.markdown', markdown);
        } catch (e) {
          preview.send('editor.markdown', value);
        }
        break;
      case 'styles':
        this.sass(value)
          .then(result => {
            this._content = { ...this._content, styles: value };
            preview.send('editor.css', result);
          })
          .catch(e => console.warn(e));
    }
  }

  public render() {
    const initial = this.initial;
    const elements = {
      e: () => <Editor onChange={this.onChange} initial={initial} />,
      p: () => (
        <div onMouseOver={this.onMouseOver}>
          <WebView
            autosize
            nodeintegration
            blinkfeatures="OverlayScrollbars"
            src={'preview.html'}
          />
        </div>
      )
    };
    const titles = {
      e: 'Editor',
      p: 'Preview'
    };
    return (
      <div>
        <div className="flex">
          <div className="editor">
            <header>{this.state.current}</header>
          </div>
          <TypedMosaic
            className=""
            renderTile={(e, path) => (
              <TypedWindow
                path={path}
                toolbarControls={[]}
                title={titles[e]}
                {...initial}
              >
                {elements[e]()}
              </TypedWindow>
            )}
            initialValue={{
              direction: 'row',
              first: 'e',
              second: 'p'
            }}
          />
        </div>
      </div>
    );
  }
}
