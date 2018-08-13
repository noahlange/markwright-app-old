import * as React from 'react';
import { basename } from 'path';
import * as Sass from 'sass.js/dist/sass.js';
import { autobind } from 'core-decorators';

import { ipcRenderer as ipc } from 'electron';
import { readFileSync, writeFileSync } from 'fs';
import * as WebView from 'react-electron-web-view';
import { parse } from 'jsonc-parser';
import Editor, { ContentType } from './editor';

type AppState = {
  current: string;
  initial: Record<ContentType, string>;
  content: Record<ContentType & 'css', string>;
  error: boolean;
  errorText: string;
}

export default class App extends React.Component<any, AppState> {
  protected _read: boolean = false;

  public preview: WebView;
  public state = {
    current: 'Untitled.mw',
    initial: {
      styles: '',
      metadata: '{}',
      content: ''
    },
    content: {
      styles: '',
      content: '',
      metadata: '',
      css: ''
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

  public sass = str => {
    return new Promise((resolve, reject) => {
      const scss = new Sass();
      scss.compile(str, res => {
        res.status ? reject(res.message) : resolve(res.text);
      });
    });
  };

  public componentDidMount() {
    Sass.setWorkerUrl('../node_modules/sass.js/dist/sass.worker.js');
    this.preview = document.querySelector('webview');

    ipc.on('save', (e, file) => {
      try {
        this.setState({ current: basename(file) });
        writeFileSync(file, JSON.stringify(this.state.content), 'utf8');
      } catch (e) {
        console.warn(e);
      }
    });

    ipc.on('open', (e, file) => {
      this._read = false;
      this.setState(
        {
          current: basename(file),
          initial: JSON.parse(readFileSync(file, 'utf8'))
        },
        () => {
          this.onChange('content', this.state.initial.content);
          this.onChange('metadata', this.state.initial.metadata);
          this.onChange('styles', this.state.initial.styles);
        }
      );
    });
  }

  @autobind
  public onMouseOver() {
    this.preview.focus();
  }

  @autobind
  public onChange(key: ContentType, value) {
    switch (key) {
      case 'metadata':
        try {
          const data = parse(value);
          this.setState(
            { content: { ...this.state.content, metadata: value } },
            () => {
              this.preview.send('editor.metadata', data);
            }
          );
        } catch (e) {
          console.warn('bad metadata');
        }
        break;
      case 'content':
        this.setState(
          {
            content: {
              ...this.state.content,
              markdown: value
            },
            error: false
          },
          () => {
            this.preview.send('editor.markdown', value);
          }
        );
        break;
      case 'styles':
        this.sass(value)
          .then(result => {
            this.setState(
              {
                content: {
                  ...this.state.content,
                  scss: value,
                  css: result
                }
              },
              () => {
                this.preview.send('editor.css', result);
              }
            );
          })
          .catch(e => console.warn(e));
    }
  }

  public render() {
    return (
      <div>
        <div className="flex">
          <div className="editor">
            <header>{this.state.current}</header>
            <Editor initial={this.initial} onChange={this.onChange} />
          </div>
          <div className="preview" onMouseOver={this.onMouseOver}>
            {this.state.error ? (
              <div className="bbod">
                <div>
                  <h2>Error!</h2>
                  <p>{this.state.errorText}</p>
                </div>
              </div>
            ) : null}
            <WebView
              autosize
              nodeintegration
              blinkfeatures="OverlayScrollbars"
              src={'preview.html'}
            />
          </div>
        </div>
      </div>
    );
  }
}
