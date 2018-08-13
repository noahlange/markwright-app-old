import * as React from 'react';
import * as monaco from 'monaco-editor';
import MonacoEditor from 'react-monaco-editor';

monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
  allowComments: true
});

(window as any).MonacoEnvironment = {
  getWorkerUrl: function(_, label) {
    if (label === 'scss') {
      return '../lib/css.worker.js';
    }
    if (label === 'json') {
      return '../lib/json.worker.js';
    }
    return '../lib/editor.worker.js';
  }
};

type EditorState = {
  content: {
    markdown: string;
    metadata: string;
    scss: string;
  };
  tab: 'markdown' | 'scss' | 'metadata';
  loaded: boolean;
};

export default class Editor extends React.Component<any, EditorState> {
  public static getDerivedStateFromProps(props) {
    return props.initial ? { content: props.initial } : {};
  }

  public editor = null;

  public state: EditorState = {
    content: {
      scss: '',
      metadata: '',
      markdown: ''
    },
    tab: 'markdown',
    loaded: false
  };

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

  public editorDidMount = editor => {
    editor.getModel().updateOptions({
      tabSize: 2
    });
    this.editor = editor;
    this.editor.focus();
    this.editor.layout();
    this.setState({ loaded: true });
  };

  public handleResize = () => this.editor.layout();

  public componentDidMount() {
    const tabs: any[] = ['markdown', 'scss', 'metadata'];
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keypress', e => {
      if (e.ctrlKey && e.code === 'Tab') {
        const idx = (tabs.indexOf(this.state.tab) + 1) % 3;
        this.setState({ tab: tabs[idx - 1] });
      }
    });
  }

  public render() {
    return (
      <div
        id="monaco-container"
        className={this.state.loaded ? '' : 'spinner'}
        style={{ width: 'calc(100vw - 8.5in - 2rem' }}
      >
        <div className={`tabs ${this.state.tab}`}>
          <button
            className="markdown"
            onClick={() => this.setState({ tab: 'markdown' })}
          >
            Markdown
          </button>
          <button
            className="scss"
            onClick={() => this.setState({ tab: 'scss' })}
          >
            SCSS
          </button>
          <button
            className="metadata"
            onClick={() => this.setState({ tab: 'metadata' })}
          >
            Metadata
          </button>
        </div>
        <MonacoEditor
          theme="vs-light"
          language={this.state.tab === 'metadata' ? 'json' : this.state.tab}
          options={{
            wordWrap: 'bounded',
            fontFamily: 'Fira Code',
            fontLigatures: true,
            fontSize: 15
          }}
          onChange={this.onChange}
          editorDidMount={this.editorDidMount}
          value={this.state.content[this.state.tab]}
        />
      </div>
    );
  }
}
