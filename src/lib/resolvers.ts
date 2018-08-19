import { resolveHttpUrl, resolveLocalUrl, resolveString } from 'hercule';
import * as path from 'path';
import * as fs from 'fs';
import * as cache from 'js-cache';
import * as toString from 'stream-to-string';
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
 * Basically, we're caching file transcludes so we don't make
 * a bajillion fs requests with every setState.
 *
 * @todo - add to some sort of fs watchlist?
 */

export function markdown(base: string) {
  return [
    resolveHttpUrl,
    resolveLocalUrl,
    resolveString
  ].map(resolve => {
    return (url: string) => {
      const has = cache.get(url);
      if (has) {
        return has;
      } else {
        const res = resolve(path.resolve(base, url), '/');
        if (res) {
          toString(res.content).then((res: string) =>
            cache.set(url, { url, content: res })
          );
          return res;
        }
      }
      return null;
    };
  });
}

/**
 * Resolve SASS imports.
 *
 * @todo ditto with the watchlist...
 */
export function sass(base: () => string) {
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
