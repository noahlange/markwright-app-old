import { ContentType } from './types';

export type ReporterFunction = (
  name: ContentType,
  clear?: boolean,
  message?: string[]
) => void;

export type SenderFunction = (name: ContentType, processed: string) => void;

abstract class Processor {
  public abstract type: ContentType;
  public content: string = '';
  public directory: () => string;
  public report: (value?: string[], clear?: boolean) => void;
  public send: (value: string) => void;

  public constructor(
    base: () => string,
    sender: SenderFunction,
    reporter: ReporterFunction
  ) {
    this.directory = base;
    this.send = (value: string) => sender(this.type, value);
    this.report = (
      value?: string[],
      // auto-clear if we've received no message
      clear: boolean = !!(value && value.length)
    ) => reporter(this.type, clear, value);
  }

  public abstract process(value: string): Promise<void>;
}

export default Processor;
