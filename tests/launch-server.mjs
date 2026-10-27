// Fictional test-only invitations. This helper is never copied to dist/.
import {Store} from '../server/store.js';
import {createLaunchServer} from '../server/app.js';
const store=new Store(process.env.BEACON_DB_PATH);
store.signup('browser-tester@example.test',null,Date.now());
const invitation=store.invite('browser-tester@example.test',Date.now());
const server=createLaunchServer({store,staticRoot:'dist'});
server.listen(0,'127.0.0.1',()=>console.log(JSON.stringify({origin:`http://127.0.0.1:${server.address().port}`,invitation})));
process.on('SIGTERM',()=>server.close(()=>{store.close();process.exit(0);}));
