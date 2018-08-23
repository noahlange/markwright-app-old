/**
 * We need to throttle resize and mousemove events. Adapted from
 * https://developer.mozilla.org/en-US/docs/Web/Events/resize#requestAnimationFrame
 */

type Listener<T = Event> = (e: T) => void;

const callbacks: Array<Listener<any>> = [];
let running: boolean = false;

function handler(e: Event) {
  if (!running) {
    running = true;
    window.requestAnimationFrame(() => runCallbacks(e));
  }
}

// run the actual callbacks
function runCallbacks(e: MouseEvent | Event) {
  callbacks.forEach(cb => cb(e));
  running = false;
}

// adds callback to loop
function addCallback(callback: Listener) {
  if (callback) {
    callbacks.push(callback);
  }
}

function listen(event: 'mousemove', callback: Listener<MouseEvent>): void;
function listen(event: 'resize', callback: Listener): void;
function listen(event: string, callback: Listener<any>): void {
  if (!callbacks.length) {
    window.addEventListener(event, handler);
  }
  addCallback(callback);
}

export default listen;
