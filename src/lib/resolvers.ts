import { resolveHttpUrl, resolveLocalUrl, resolveString } from 'hercule';
import * as path from 'path';
import * as cache from 'js-cache';
import * as toString from 'stream-to-string';

/**
 * Basically, we're caching file transcludes so we don't make
 * a bajillion fs requests with every setState.
 */

export default (base: string) =>
  [resolveHttpUrl, resolveLocalUrl, resolveString].map(resolve => {
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
