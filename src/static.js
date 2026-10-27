import {mountLayout} from './layout.js';
let storage;try{storage=window.localStorage;}catch{storage={getItem(){return null;},setItem(){throw new Error('Storage unavailable');}};}
mountLayout('static',storage,message=>{const status=document.querySelector('#status');status.hidden=false;status.textContent=message;});
