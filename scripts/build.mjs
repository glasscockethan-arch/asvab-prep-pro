import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const checked=spawnSync(process.execPath,['scripts/check.mjs'],{stdio:'inherit'});if(checked.status!==0)process.exit(checked.status??1);
const destination=path.resolve('dist');
if(destination!==path.join(process.cwd(),'dist'))throw new Error('Unexpected output path');
fs.mkdirSync(destination,{recursive:true});
for(const entry of fs.readdirSync(destination))fs.rmSync(path.join(destination,entry),{recursive:true,force:true});
const files=fs.readdirSync('.').filter(file=>/\.(html|css|js|svg)$/.test(file));
for(const file of [...files,'robots.txt','sitemap.xml','.nojekyll'])fs.copyFileSync(file,path.join(destination,file));
for(const folder of ['src','data','assets'])fs.cpSync(folder,path.join(destination,folder),{recursive:true});
const data=JSON.parse(fs.readFileSync('data/courses.json','utf8')),base='https://glasscockethan-arch.github.io/asvab-prep-pro/';
const publicPages=files.filter(file=>file.endsWith('.html')&&!['dashboard.html','study.html','course.html','account.html','exam-pass.html'].includes(file));
const urls=[...publicPages.map(file=>base+(file==='index.html'?'':file)),...data.courses.map(course=>base+'course.html?id='+course.id)];
fs.writeFileSync(path.join(destination,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.map(url=>'<url><loc>'+url.replaceAll('&','&amp;')+'</loc></url>').join('\n')+'\n</urlset>\n');
for(const course of data.courses){
 const file=path.join(destination,'course.html');
 // Query-based routes work under a project subdirectory without SPA rewrites.
 if(!fs.existsSync(file))throw new Error('Course route missing');
}
console.log(`Static build: ${files.length} root assets/pages plus src, data and original assets. No credentials, tests, reports, dependencies or Git metadata copied.`);
