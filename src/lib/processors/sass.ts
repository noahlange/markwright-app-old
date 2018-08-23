// tslint:disable-next-line
import * as Sass from 'sass.js/dist/sass.js';

import { ContentType } from '../components/editor';
import Processor, { ReporterFunction, SenderFunction } from '../processor';
import sass from '../resolvers/scss';

export default class SASSProcessor extends Processor {
  public type: ContentType = 'styles';
  protected scss: typeof Sass = new Sass();

  public constructor(
    directory: () => string,
    sender: SenderFunction,
    reporter: ReporterFunction
  ) {
    super(directory, sender, reporter);
    Sass.setWorkerUrl('../node_modules/sass.js/dist/sass.worker.js');
    this.scss.importer(sass(this.directory));
  }

  public sass(str: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.scss.compile(str, (res: any) => {
        res.status ? reject(res.message) : resolve(res.text);
      });
    });
  }

  public async process(value: string) {
    if (value !== '') {
      try {
        const result = await this.sass(value);
        this.content = value;
        this.send(result);
        this.report([], true);
      } catch (e) {
        this.report([e]);
      }
    } else {
      const styles = '';
      this.content = value;
      this.send(styles);
      this.report([], true);
    }
  }
}
