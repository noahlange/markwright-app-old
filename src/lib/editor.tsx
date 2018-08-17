import * as React from 'react';
import MonacoEditor from 'react-monaco-editor';
import { autobind } from 'core-decorators';
import { debounce, throttle } from 'lodash-decorators';

import { schema } from '../themes/markwright';

(window as any).MonacoEnvironment = {
  getWorkerUrl(_, label) {
    switch (label) {
      case 'scss':
        return '../lib/css.worker.js';
      case 'json':
        return '../lib/json.worker.js';
      default:
        return '../lib/editor.worker.js';
    }
  }
};

export type ContentType = 'content' | 'styles' | 'metadata';

type EditorState = {
  initial: Record<ContentType, string>;
  content: Record<ContentType, string>;
  tab: ContentType;
};

const matches = (o1, o2, k) => {
  return o1 && o2 && o1[k] === o2[k];
};

export default class Editor extends React.Component<any, EditorState> {
  public static getDerivedStateFromProps(nextProps, prevState) {
    if (matches(nextProps.initial, prevState.initial, prevState.tab)) {
      return null;
    } else {
      return nextProps.initial
        ? {
            initial: nextProps.initial,
            content: nextProps.initial
          }
        : null;
    }
  }

  public editor = null;

  public change: Record<ContentType, (value: string) => any> = {
    styles: this.onChangeSCSS,
    metadata: this.onChangeMetadata,
    content: this.onChangeMarkdown
  };

  public languages: Record<ContentType, string> = {
    styles: 'scss',
    metadata: 'json',
    content: 'markdown'
  };

  public state: EditorState = {
    content: { styles: '', metadata: '{}', content: '' },
    initial: { styles: '', metadata: '{}', content: '' },
    tab: 'content'
  };

  @debounce(500)
  @autobind
  public onChangeSCSS(e) {
    return this.onChange(e);
  }

  @debounce(500)
  @autobind
  public onChangeMetadata(e) {
    return this.onChange(e);
  }

  @debounce(250)
  @autobind
  public onChangeMarkdown(e) {
    return this.onChange(e);
  }

  public onChange = e => {
    this.setState(
      {
        content: {
          ...this.state.content,
          [this.state.tab]: e
        }
      },
      () => {
        this.props.onChange(this.state.tab, e);
      }
    );
  };

  public editorWillMount = monaco => {
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      allowComments: true,
      schemas: [
        {
          uri: 'mw://themes/markwright.json',
          fileMatch: ['*'],
          schema
        }
      ]
    });
  };

  public editorDidMount = editor => {
    editor.getModel().updateOptions({
      tabSize: 2
    });
    this.editor = editor;
    this.editor.focus();
    this.editor.layout();
  };

  @autobind
  public focus() {
    this.editor.focus();
  }

  @throttle(16)
  @autobind
  public handleResize() {
    this.editor.layout();
  }

  public componentDidMount() {
    const tabs: ContentType[] = ['content', 'styles', 'metadata'];
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keypress', e => {
      if (e.ctrlKey && e.code === 'Tab') {
        const idx = (tabs.indexOf(this.state.tab) + 1) % 3;
        this.setState({ tab: tabs[idx] });
      }
    });
  }

  public tab(tab: ContentType) {
    return () => this.setState({ tab });
  }

  public render() {
    return (
      <div
        id="monaco-container"
        style={{ width: '100%' }}
        onMouseOver={this.focus}
      >
        <div className={`tabs ${this.state.tab}`}>
          <button className="content" onClick={this.tab('content')}>
            Content (Markdown)
          </button>
          <button className="styles" onClick={this.tab('styles')}>
            Styles (SCSS)
          </button>
          <button className="metadata" onClick={this.tab('metadata')}>
            Metadata (JSON)
          </button>
        </div>
        <MonacoEditor
          theme="vs-dark"
          options={{
            wordWrap: 'bounded',
            fontFamily: 'Fira Code',
            fontLigatures: true,
            fontSize: 15
          }}
          editorWillMount={this.editorWillMount}
          editorDidMount={this.editorDidMount}
          language={this.languages[this.state.tab]}
          onChange={this.change[this.state.tab]}
          value={this.state.content[this.state.tab]}
        />
      </div>
    );
  }
}
