import * as fs from 'fs';
import * as cache from 'js-cache';
import * as path from 'path';
import { promisify } from 'util';

type SassImportRequest = {
  current: string;
  previous: string;
  resolved: string;
  path: string;
  options: string;
};

type SassImportRequestCallback = (
  response: {
    path?: string;
    content?: string;
    error?: string;
  }
) => void;

const read = promisify(fs.readFile);
const exists = promisify(fs.exists);

/**
 * Resolve SASS imports.
 *
 * @todo ditto with the watchlist...
 */
export default function sass(base: () => string) {
  return async (
    request: SassImportRequest,
    done: SassImportRequestCallback
  ) => {
    const p = path.resolve(base(), request.current);
    const e = await exists(p);
    if (e) {
      const has = cache.get(p);
      if (has) {
        done(has);
      } else {
        const content = await read(p, 'utf8');
        cache.set(p, { content });
        done({ content });
      }
    } else {
      done({ error: 'ENOENT' });
    }
  };
}
