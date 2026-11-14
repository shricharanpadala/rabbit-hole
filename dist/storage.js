import {validateWorkspace} from './engine.js';
import {sanitizeSaves} from './core.js';
function getStorage(){try{return globalThis.localStorage;}catch{return null;}}
export const KEYS={workspace:'rabbithole.workspace.v1',saved:'rabbithole.trails.v1'};
export function readStored(key,fallback,storage=getStorage()){try{return JSON.parse(storage.getItem(key))??fallback;}catch{return fallback;}}
export function writeStored(key,data,storage=getStorage()){try{storage.setItem(key,JSON.stringify(data));return true;}catch{return false;}}
export function readWorkspace(storage=getStorage()){try{return validateWorkspace(readStored(KEYS.workspace,null,storage));}catch{return null;}}
export function readSaves(storage=getStorage()){return sanitizeSaves(readStored(KEYS.saved,[],storage));}
