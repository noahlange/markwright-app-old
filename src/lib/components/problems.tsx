import * as React from 'react';
import { ContentType } from '../types';

type ProblemsProps = {
  problems: Record<ContentType, string[]>;
};

type ProblemsState = {
  tab: ContentType;
};

const tabs: ContentType[] = [
  ContentType.STYLES,
  ContentType.CONTENT,
  ContentType.METADATA
];

const styles = {
  [ContentType.CONTENT]: {
    color: '#818B92'
  },
  [ContentType.METADATA]: {
    color: '#cbb2b2'
  },
  [ContentType.STYLES]: {
    color: '#9FB69F'
  }
};

export default class Problems extends React.Component<
  ProblemsProps,
  ProblemsState
> {
  public state: ProblemsState = { tab: ContentType.CONTENT };

  public problems(tab: ContentType = this.state.tab): string[] {
    return this.props.problems[tab] || [];
  }

  public tab(tab: ContentType) {
    return () => this.setState({ tab });
  }

  public render() {
    const problems = tabs.reduce(
      (a, tab) => a.concat(this.problems(tab).map(str => ({ tab, str }))),
      [] as Array<{ tab: ContentType; str: string }>
    );
    return (
      <div>
        <pre className="problems">
          {problems.map(({ str, tab }) => {
            return (
              <p>
                <span style={styles[tab]}>{tab}</span>: {str}
              </p>
            );
          })}
        </pre>
      </div>
    );
  }
}
