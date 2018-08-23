import * as React from 'react';
import { ContentType } from './editor';

type ProblemsProps = {
  problems: Record<ContentType, string[]>;
};

type ProblemsState = {
  tab: ContentType;
};

export default class Problems extends React.Component<
  ProblemsProps,
  ProblemsState
> {
  public state: ProblemsState = { tab: 'content' };

  public tab(tab: ContentType) {
    return () => this.setState({ tab });
  }

  public render() {
    return (
      <div>
        <div className={`tabs ${this.state.tab}`}>
          <button className="content" onClick={this.tab('content')}>
            Content {this.props.problems.content.length ? '⚠️' : ''}
          </button>
          <button className="styles" onClick={this.tab('styles')}>
            Styles {this.props.problems.styles.length ? '⚠️' : ''}
          </button>
          <button className="metadata" onClick={this.tab('metadata')}>
            Metadata {this.props.problems.metadata.length ? '⚠️' : ''}
          </button>
        </div>
        <pre className="problems">
          {this.props.problems[this.state.tab].map((problem, i) => (
            <div key={i}>{problem}</div>
          ))}
        </pre>
      </div>
    );
  }
}
