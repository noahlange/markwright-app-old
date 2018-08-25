import { ipcRenderer as ipc } from 'electron';
import { homedir } from 'os';

declare var window: any;

const on = (event: string, callback: any) => ipc.on(event, callback);
const off = (events: string[]) =>
  events.forEach(event => ipc.removeAllListeners(event));
const send = (e: string, ...args: any[]) => ipc.send(e, ...args);
const home = () => homedir();

window._on = on;
window._off = off;
window._send = send;
window._home = home;