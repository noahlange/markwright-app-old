import { parse, ParseError, ParseErrorCode } from 'jsonc-parser';
import * as lc from 'line-column';

import Processor from '../processor';
import { ContentType } from '../types';

const ParseErrors = {
  [ParseErrorCode.InvalidSymbol]: 'Invalid symbol',
  [ParseErrorCode.InvalidNumberFormat]: 'Invalid number format',
  [ParseErrorCode.PropertyNameExpected]: 'Property name expected',
  [ParseErrorCode.ValueExpected]: 'Value expected',
  [ParseErrorCode.ColonExpected]: 'Colon expected',
  [ParseErrorCode.CommaExpected]: 'Comma expected',
  [ParseErrorCode.CloseBraceExpected]: 'Closing brace expected',
  [ParseErrorCode.CloseBracketExpected]: 'Closing bracket expected',
  [ParseErrorCode.EndOfFileExpected]: 'End-of-file expected',
  [ParseErrorCode.InvalidCommentToken]: 'Invalid comment token',
  [ParseErrorCode.UnexpectedEndOfComment]: 'Unexpected end of comment',
  [ParseErrorCode.UnexpectedEndOfString]: 'Unexpected end of string',
  [ParseErrorCode.UnexpectedEndOfNumber]: 'Unexpected end of number',
  [ParseErrorCode.InvalidUnicode]: 'Invalid unicode',
  [ParseErrorCode.InvalidEscapeCharacter]: 'Invalid escape character',
  [ParseErrorCode.InvalidCharacter]: 'Invalid character'
};

export default class JSONCProcessor extends Processor {
  public type: ContentType = ContentType.METADATA;
  public parsed: any = {};
  public async process(value: string) {
    const errors: ParseError[] = [];
    const data = parse(value, errors);
    this.send(data || {});
    if (errors.length) {
      this.report(
        errors.map(c => {
          const { line, col } = lc(value, c.offset);
          return `JSONC error: ${ParseErrors[c.error]} (${line}, ${col})`;
        })
      );
    } else {
      this.content = value;
      this.parsed = data;
      // clear messages
      this.report([], true);
    }
  }
}
