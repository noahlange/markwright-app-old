import { ipcRenderer as ipc } from 'electron';
import Markwright from 'markwright';
import * as React from 'react';
import * as cache from 'js-cache';

import { proxy } from 'workly';

export default class Preview extends React.Component<any, any> {
  public highlight = proxy('../assets/highlight.js');

  public state = {
    metadata: {
      manual: false,
      styles: []
    },
    markdown: '',
    css: ''
  };

  public componentDidMount() {
    ipc.on('editor.metadata', (e, metadata) => this.setState({ metadata }));
    ipc.on('editor.markdown', (e, markdown) => this.setState({ markdown }));
    ipc.on('editor.css', (e, css) => this.setState({ css }));
  }

  public render() {
    const themes = this.state.metadata.styles;
    return (
      <div>
        {themes.map((t, i) => (
          <link key={i} rel="stylesheet" href={t} />
        ))}
        {themes.length ? null : (
          <link
            rel="stylesheet"
            href="../assets/markwright.css
        "
          />
        )}
        <style type="text/css">{this.state.css}</style>
        <Markwright
          config={{
            manual: this.state.metadata.manual,
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
