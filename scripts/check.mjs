import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {validateCatalog} from '../src/engine.js';
const root=process.cwd(), data=validateCatalog(JSON.parse(fs.readFileSync('data/courses.json','utf8')));
const htmlFiles=fs.readdirSync(root).filter(file=>file.endsWith('.html'));
let links=0,scripts=0;
for(const file of htmlFiles){
 const source=fs.readFileSync(file,'utf8');
 if(!source.includes('<html lang="en"'))throw new Error(`${file}: language missing`);
 if(!/<title>[^<]+<\/title>/.test(source))throw new Error(`${file}: title missing`);
 for(const match of source.matchAll(/\b(?:href|src)="([^"]+)"/g)){
  const value=match[1];if(/^(https?:|mailto:|tel:|data:|#)/.test(value)||value.includes('${'))continue;
  const url=new URL(value,'https://local.test/'+file),target=decodeURIComponent(url.pathname).slice(1)||'index.html';
  if(!fs.existsSync(path.join(root,target)))throw new Error(`${file}: broken local link ${value}`);
  if(url.hash&&target.endsWith('.html')){let content=fs.readFileSync(target,'utf8');if(content.includes('data-page='))content+='\n'+fs.readFileSync('src/app.js','utf8');const anchor=decodeURIComponent(url.hash.slice(1));if(!new RegExp(`id=["']${anchor}["']`).test(content))throw new Error(`${file}: missing anchor ${value}`);}
  links++;
 }
 for(const match of source.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)){
  const checked=spawnSync(process.execPath,['--check','--input-type=commonjs'],{input:match[1],encoding:'utf8'});if(checked.status!==0)throw new Error(`${file}: ${checked.stderr}`);scripts++;
 }
}
for(const file of ['learning.js',...fs.readdirSync('src').filter(f=>f.endsWith('.js')).map(f=>'src/'+f)]){const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(result.status!==0)throw Error(result.stderr);}
for(const file of ['src/app.js','src/layout.js','src/static.js','src/storage.js','src/engine.js','platform.css']){
 const source=fs.readFileSync(file,'utf8');if(/https?:\/\//.test(source)&&file!=='src/app.js')throw Error(`${file}: unexpected external URL; review privacy implications`);
}
console.log(`PASS: ${data.courses.length} units, ${htmlFiles.length} HTML pages, ${links} static local links, ${scripts} inline scripts; JavaScript syntax and catalog valid.`);

const curriculum=spawnSync(process.execPath,['scripts/curriculum-report.mjs'],{stdio:'inherit'});if(curriculum.status!==0)process.exit(curriculum.status??1);
