import {test, after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, cp, readFile, writeFile, rm, stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {runInNewContext} from 'node:vm';

const root=fileURLToPath(new URL('../',import.meta.url));
const fixture=await mkdtemp(path.join(tmpdir(),'soft-guide-test-'));
for(const dir of ['src','scripts','public','config']) await cp(path.join(root,dir),path.join(fixture,dir),{recursive:true});
const fixtureConfigPath=path.join(fixture,'config/site.json');
const fixtureConfig=JSON.parse(await readFile(fixtureConfigPath,'utf8'));
Object.assign(fixtureConfig,{contactsApproved:false,contentApproved:false,resumeApproved:false,allowIndexing:false});
await writeFile(fixtureConfigPath,JSON.stringify(fixtureConfig));
after(()=>rm(fixture,{recursive:true,force:true}));
const run=(...args)=>spawnSync(process.execPath,['scripts/build.mjs',...args],{cwd:fixture,encoding:'utf8'});
const output=file=>readFile(path.join(fixture,'dist',file),'utf8');
const {caseStudies}=await import(path.join(root,'src/portfolio.mjs'));
const {notes}=await import(path.join(root,'src/notes.mjs'));
const pages=['index.html','platform.html','work.html','services.html','about.html','contact.html','cv.html','404.html',...caseStudies.map(s=>`work-${s.slug}.html`),'notes.html',...notes.map(n=>`notes-${n.slug}.html`)];

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

test('public checkout puts the approved email first, LinkedIn second, and has an honest CV',async()=>{
 const contact=await output('contact.html');
 const email=contact.indexOf('mailto:korkach.vd@gmail.com'), linkedin=contact.indexOf('LinkedIn ↗');
 assert.ok(email>0,'email link'); assert.ok(linkedin>email,'LinkedIn after email');
 assert.doesNotMatch(contact,/<form/);
 assert.match(contact,/href="mailto:korkach\.vd@gmail\.com\?subject=/);
 assert.doesNotMatch(contact,/tel:/);
 assert.match(await output('cv.html'),/Previous experience — to confirm/);
 assert.match(await output('services.html'),/does not provide penetration testing/);
 assert.match(await output('robots.txt'),/Disallow: \//);
});

test('all themes have usable direct links and original matching assets',async()=>{
 const home=await output('index.html');
 assert.match(home,/data-default-theme="blue"/);
 for(const theme of ['blue','glacier']){
  assert.ok(home.includes(`data-set-theme="${theme}"`));
  assert.match(await readFile(path.join(fixture,'dist','assets',`layers-${theme}.svg`),'utf8'),/<svg/);
 }
});

test('first visits use light and obsolete or unavailable saved themes fall back safely',async()=>{
 const script=await readFile(path.join(root,'public/assets/enhance.js'),'utf8');
 for(const [search,saved,expected] of [['',null,'blue'],['','glacier','glacier'],['','coral','blue'],['?theme=blue','glacier','blue'],['?theme=glacier',null,'glacier']]){
  const html={dataset:{defaultTheme:'blue'},classList:{add(){}}};
  runInNewContext(script,{document:{documentElement:html},location:{search},URLSearchParams,localStorage:{getItem(){return saved},setItem(){}}});
  assert.equal(html.dataset.theme,expected);
 }
 const html={dataset:{defaultTheme:'blue'},classList:{add(){}}};
 runInNewContext(script,{document:{documentElement:html},location:{search:''},URLSearchParams,localStorage:{getItem(){throw Error('Unavailable')},setItem(){throw Error('Unavailable')}}});
 assert.equal(html.dataset.theme,'blue');
});

test('release refuses unapproved content; approved release ignores local-only data',async()=>{
 let result=run('--release'); assert.notEqual(result.status,0); assert.match(result.stderr,/Release blocked/);
 const config=JSON.parse(await readFile(path.join(fixture,'config/site.json'),'utf8'));
 Object.assign(config,{businessEmail:'',contactsApproved:true,contentApproved:true,resumeApproved:true,allowIndexing:true,theme:'glacier'});
 await writeFile(path.join(fixture,'config/site.json'),JSON.stringify(config));
 const {mkdir}=await import('node:fs/promises');
 await mkdir(path.join(fixture,'.local'));
 await writeFile(path.join(fixture,'.local/preview.json'),JSON.stringify({businessEmail:'private@example.org',phone:'+421000000000'}));
 result=run('--release'); assert.equal(result.status,0,result.stderr);
 const home=await output('index.html'),contact=await output('contact.html');
 assert.doesNotMatch(home,/DESIGN PREVIEW/);
 assert.match(home,/aria-label="Color theme"/);
 assert.match(home,/data-set-theme="glacier"/);
 assert.match(home,/<link rel="canonical" href="https:\/\/softguide.dev\/">/);
 assert.match(home,/data-default-theme="glacier"/);
 assert.match(home,/content="index,follow"/);
 assert.match(contact,/Connect on LinkedIn/);
 assert.doesNotMatch(contact,/<form|mailto:|tel:/);
 assert.doesNotMatch(contact,/private@example.org|421000000000/);
 assert.doesNotMatch(await output('cv.html'),/\[Employer\]|Previous experience — to confirm/);
 assert.match(await output('sitemap.xml'),/https:\/\/softguide.dev\/services.html/);
 assert.match(await output('robots.txt'),/Allow: \//);
});

test('case studies carry no account IDs or locally listed private terms',async()=>{
 // Terms that must never appear publicly are kept outside the repository, one per line,
 // in .local/forbidden-terms.txt (git-ignored). Without the file only the generic checks run.
 let terms=[];
 try { terms=(await readFile(path.join(root,'.local/forbidden-terms.txt'),'utf8')).split('\n').map(t=>t.trim()).filter(Boolean); } catch {}
 const files=['work.html','platform.html','index.html','notes.html',...caseStudies.map(s=>`work-${s.slug}.html`),...notes.map(n=>`notes-${n.slug}.html`)];
 for(const file of files){
  const html=(await output(file)).toLowerCase();
  assert.doesNotMatch(html,/\b\d{12}\b/,`${file}: looks like an account ID`);
  for(const term of terms) assert.ok(!html.includes(term.toLowerCase()),`${file}: contains a private term`);
 }
 for(const s of caseStudies) assert.match(await output(`work-${s.slug}.html`),/<svg viewBox=/,`${s.slug}: diagram`);
});
