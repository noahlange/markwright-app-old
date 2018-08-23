import { resolveHttpUrl, resolveLocalUrl, resolveString } from 'hercule';
import * as cache from 'js-cache';
import * as path from 'path';
import * as toString from 'stream-to-string';

/**
 * Basically, we're caching file transcludes so we don't make
 * a bajillion fs requests with every setState.
 *
 * @todo - add to some sort of fs watchlist?
 */
export default function markdown(base: string) {
  return [resolveHttpUrl, resolveLocalUrl, resolveString].map(resolve => {
    return (url: string) => {
      const has = cache.get(url);
      if (has) {
        return has;
      } else {
        const res = resolve(path.resolve(base, url), '/');
        if (res) {
          toString(res.content).then((r: string) =>
            cache.set(url, { url, content: r })
          );
          return res;
        }
      }
      return null;
    };
  });
}
