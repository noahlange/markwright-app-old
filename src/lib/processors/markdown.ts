import { transcludeString } from 'hercule';
import { promisify } from 'util';

import { ContentType } from '../components/editor';
import Processor from '../processor';
import md from '../resolvers/markdown';

export default class MarkdownProcessor extends Processor {
  public transclude = promisify(transcludeString);
  public type: ContentType = 'content';

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
