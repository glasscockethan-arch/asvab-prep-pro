import {isAbsolute,resolve,sep} from 'node:path';
export const STAGES=['closed','signup','invited-beta'];
export function publicOrigin(value) {
 let url;try{url=new URL(value);}catch{throw Error('A fixed HTTPS public origin is required.');}
 if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash||url.port||!url.hostname.includes('.')||/^\d+\.\d+\.\d+\.\d+$/.test(url.hostname)||url.hostname.endsWith('.localhost'))throw Error('Use one HTTPS public hostname without a path, port, query or credentials.');
 return url.origin;
}
export function hostedSettings(env) {
 if(env.NODE_ENV!=='production')throw Error('The hosted entry requires explicit production runtime configuration.');
 const stage=env.BEACON_RELEASE_STAGE??'closed';if(!STAGES.includes(stage))throw Error('Unknown beta release stage.');
 if(env.STRIPE_SECRET_KEY||env.STRIPE_WEBHOOK_SECRET||env.BEACON_STRIPE_TEST_MODE==='true')throw Error('The hosted beta forbids payment configuration. Keep payment tests on the local test service.');
 const origin=publicOrigin(env.BEACON_PUBLIC_ORIGIN),storage=env.BEACON_STORAGE_ROOT??'/var/data',filename=env.BEACON_DB_PATH;
 if(!isAbsolute(storage)||storage.startsWith('/tmp')||!filename||!isAbsolute(filename)||!resolve(filename).startsWith(resolve(storage)+sep))throw Error('The hosted beta needs an absolute database path inside its approved persistent mount.');
 const port=Number(env.PORT??10000);if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid hosted port.');
 return {mode:'hosted-beta',stage,origin,filename,storage:resolve(storage),port};
}
export function deploymentMode(value) {
 if(!value)return null;
 if(value.mode!=='hosted-beta'||!STAGES.includes(value.stage))throw Error('Invalid hosted beta deployment configuration.');
 return {...value,origin:publicOrigin(value.origin)};
}
