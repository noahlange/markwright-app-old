import { transcludeString } from 'hercule';
import { promisify } from 'util';

import Processor from '../processor';
import md from '../resolvers/markdown';
import { ContentType } from '../types';

export default class MarkdownProcessor extends Processor {
  public transclude = promisify(transcludeString);
  public type: ContentType = ContentType.CONTENT;

  public async process(value: string) {
    this.content = value;
    try {
      const markdown = await this.transclude(value, {
        resolvers: md(this.directory())
      });
      this.send(markdown);
      this.report([], true);
    } catch (e) {
      this.report([e.message]);
    }
  }
}
