import { ipcRenderer as ipc } from 'electron';
import { homedir } from 'os';

declare var window: any;

const on = (event: string, callback: any) => ipc.on(event, callback);
const send = (e: string) => ipc.send(e);
const home = () => homedir();

window._on = on;
window._send = send;
window._home = home;