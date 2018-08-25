import { autobind } from 'core-decorators';
import { basename, dirname } from 'path';
import * as React from 'react';

import { ipcRenderer as ipc, remote, WebviewTag } from 'electron';
import { readFileSync, writeFileSync } from 'fs';
import * as jsonc from 'jsonc-parser';
import { homedir } from 'os';
import * as WebView from 'react-electron-web-view';

import { Mosaic, MosaicWindow } from 'react-mosaic-component';

import { ContentType } from '../types';
import Editor from './editor';
import Problems from './problems';

import JSONCProcessor from '../processors/jsonc';
import MDProcessor from '../processors/markdown';
import SASSProcessor from '../processors/sass';

import { version } from '../../../package.json';

const TypedMosaic = Mosaic.ofType<'e' | 'p' | 'v'>();
const TypedWindow = MosaicWindow.ofType<'e' | 'p' | 'v'>();

type AppState = {
  current: string;
  base: string;
  initial: Record<ContentType, string>;
  problems: Record<ContentType, string[]>;
};

export default class App extends React.Component<{}, AppState> {
  public state: AppState = {
    base: homedir() + '/',
    current: 'Untitled.mw',
    initial: {
      content: '',
      metadata: '{}',
      styles: ''
    },
    problems: {
      content: [],
      metadata: [],
      styles: []
    }
  };

  protected read: boolean = false;
  protected preview: WebviewTag | null = null;

  protected processors = {
    content: new MDProcessor(() => this.state.base, this.send, this.report),
    metadata: new JSONCProcessor(() => this.state.base, this.send, this.report),
    styles: new SASSProcessor(() => this.state.base, this.send, this.report)
  };

  public get initial(): Record<ContentType, string> | null {
    if (!this.read) {
      this.read = true;
      return this.state.initial;
    } else {
      return null;
    }
  }

  @autobind
  public send(key: ContentType, value: string = ''): void {
    if (this.preview) {
      this.preview.send(`editor.${key}`, value);
    }
  }

  @autobind
  public report(
    key: ContentType,
    clear: boolean = false,
    message: string[] | null = null
  ) {
    const messages = clear ? [] : this.state.problems[key];
    const problems =
      message && message.length ? messages.slice(-5).concat(message) : messages;
    this.setState({
      problems: {
        ...this.state.problems,
        [key]: problems
      }
    });
  }

  @autobind
  public openFile(_: any, file: string) {
    this.read = false;
    this.setState(
      {
        base: dirname(file) + '/',
        current: basename(file),
        initial: jsonc.parse(readFileSync(file, 'utf8'))
      },
      () => {
        this.onChange(ContentType.CONTENT, this.state.initial.content);
        this.onChange(ContentType.METADATA, this.state.initial.metadata);
        this.onChange(ContentType.STYLES, this.state.initial.styles);
        if (this.preview) {
          this.preview.send('editor.base', this.state.base);
        }
      }
    );
  }

  @autobind
  public saveFile(_: any, file: string) {
    try {
      this.setState({ current: basename(file) });
      writeFileSync(
        file,
        JSON.stringify({
          content: this.processors.content.content,
          metadata: this.processors.metadata.content,
          styles: this.processors.styles.content,
          version
        }),
        'utf8'
      );
    } catch (e) {
      // @todo do stuff
    }
  }

  public componentDidMount() {
    this.preview = document.querySelector('webview')
    ipc.on('save', this.saveFile);
    ipc.on('open', this.openFile);
    ipc.on('error', (_: any, e: string) => {
      this.report(ContentType.CONTENT, false, [ e ])
    });
    // attempt to open file on Windows
    const args = remote.process.argv.slice();
    let arg = args.pop();
    while (arg) {
      if (/mw$/.test(arg)) {
        this.openFile(null, arg);
      }
      arg = args.pop();
    }
  }

  @autobind
  public onMouseOver() {
    if (this.preview) {
      this.preview.focus();
    }
  }

  @autobind
  public onChange(key: ContentType, value: string) {
    if (key === 'metadata') {
      this.processors[key].process(value);
      ipc.send('app.metadata', this.processors.metadata.parsed);
    } else {
      this.processors[key].process(value);
    }
  }

  public render() {
    const props = { initial: this.initial, problems: this.state.problems };
    const elements = {
      e: () => <Editor onChange={this.onChange} initial={props.initial} />,
      p: () => <Problems problems={this.state.problems} />,
      v: () => (
        <div onMouseOver={this.onMouseOver}>
          <WebView
            blinkfeatures="OverlayScrollbars"
            autosize
            src={'preview.html'}
            preload={'../lib/preload.js'}
          />
        </div>
      )
    };
    const titles = {
      e: 'Editor',
      p: 'Problems',
      v: 'Viewer'
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
                {...props}
              >
                {elements[e]()}
              </TypedWindow>
            )}
            initialValue={{
              direction: 'row',
              first: {
                direction: 'column',
                first: 'e',
                second: 'p',
                splitPercentage: 80
              },
              second: 'v'
            }}
          />
        </div>
      </div>
    );
  }
}
