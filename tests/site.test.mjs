import {test, after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, cp, readFile, writeFile, rm, stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root=fileURLToPath(new URL('../',import.meta.url));
const fixture=await mkdtemp(path.join(tmpdir(),'soft-guide-test-'));
for(const dir of ['src','scripts','public','config']) await cp(path.join(root,dir),path.join(fixture,dir),{recursive:true});
after(()=>rm(fixture,{recursive:true,force:true}));
const run=(...args)=>spawnSync(process.execPath,['scripts/build.mjs',...args],{cwd:fixture,encoding:'utf8'});
const output=file=>readFile(path.join(fixture,'dist',file),'utf8');
const pages=['index.html','services.html','about.html','contact.html','cv.html','404.html'];

test('review build has real pages, working internal paths, unique IDs and metadata',async()=>{
 const built=run(); assert.equal(built.status,0,built.stderr);
 const titles=new Set();
 for(const file of pages){
  const html=await output(file);
  assert.match(html,/<html lang="en"/); assert.match(html,/<meta name="robots" content="noindex,nofollow">/);
  assert.equal((html.match(/<h1[ >]/g)||[]).length,1,file);
  assert.match(html,/<meta name="description" content="[^"]+">/);
  const title=html.match(/<title>(.*?)<\/title>/)[1]; assert.ok(!titles.has(title)); titles.add(title);
  const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(x=>x[1]); assert.equal(new Set(ids).size,ids.length,`duplicate ID in ${file}`);
  const schema=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.equal(schema.name,'Soft Guide s. r. o.'); assert.equal(schema.identifier,'56926901');
  for(const [,raw] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
   const url=new URL(raw,'https://test.invalid/'+file);
   if(url.origin!=='https://test.invalid')continue;
   const dest=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname.slice(1));
   assert.ok((await stat(path.join(fixture,'dist',dest))).isFile(),`${file}: missing ${raw}`);
   if(url.hash){const target=await output(dest);assert.ok(target.includes(`id="${url.hash.slice(1)}"`),`${file}: missing anchor ${raw}`);}
  }
 }
});

test('public checkout builds without personal review contacts and has an honest CV',async()=>{
 const contact=await output('contact.html');
 assert.match(contact,/Business email to be confirmed/);
 assert.doesNotMatch(contact,/<form|mailto:|tel:/);
 assert.match(await output('cv.html'),/Previous experience — to confirm/);
 assert.match(await output('services.html'),/does not provide penetration testing/);
 assert.match(await output('robots.txt'),/Disallow: \//);
});

test('all themes have usable direct links and original matching assets',async()=>{
 const home=await output('index.html');
 assert.match(home,/data-default-theme="blue"/);
 for(const theme of ['blue','midnight','sage']){
  assert.ok(home.includes(`href="?theme=${theme}"`));
  assert.match(await readFile(path.join(fixture,'dist','assets',`mark-${theme}.svg`),'utf8'),/<svg/);
 }
});

test('release refuses unapproved content; approved release ignores local-only data',async()=>{
 let result=run('--release'); assert.notEqual(result.status,0); assert.match(result.stderr,/Release blocked/);
 const config=JSON.parse(await readFile(path.join(fixture,'config/site.json'),'utf8'));
 Object.assign(config,{businessEmail:'contact@softguide.dev',contactsApproved:true,contentApproved:true,resumeApproved:true,allowIndexing:true,theme:'midnight'});
 await writeFile(path.join(fixture,'config/site.json'),JSON.stringify(config));
 const {mkdir}=await import('node:fs/promises');
 await mkdir(path.join(fixture,'.local'));
 await writeFile(path.join(fixture,'.local/preview.json'),JSON.stringify({businessEmail:'private@example.org',phone:'+421000000000'}));
 result=run('--release'); assert.equal(result.status,0,result.stderr);
 const home=await output('index.html'),contact=await output('contact.html');
 assert.doesNotMatch(home,/DESIGN PREVIEW/);
 assert.match(home,/<link rel="canonical" href="https:\/\/softguide.dev\/">/);
 assert.match(home,/data-default-theme="midnight"/);
 assert.match(home,/content="index,follow"/);
 assert.match(contact,/contact@softguide.dev/);
 assert.doesNotMatch(contact,/private@example.org|421000000000/);
 assert.doesNotMatch(await output('cv.html'),/\[Employer\]|Previous experience — to confirm/);
 assert.match(await output('sitemap.xml'),/https:\/\/softguide.dev\/services.html/);
 assert.match(await output('robots.txt'),/Allow: \//);
});
