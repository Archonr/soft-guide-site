import {readFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
for(const file of await readdir(root)){
 if(!/\.(html|txt)$/.test(file))continue;
 const content=await readFile(path.join(root,file),'utf8');
 if(/\[Employer\]|\[Role\]|\[Dates\]|Previous experience — to confirm|Business email to be confirmed|OWNER-REVIEWED|DRAFT —|LOCAL REVIEW|gmail\.com|owner-confirmed|confirmed by owner|Formal director title not asserted/i.test(content))throw new Error(`Unfinished or local-only content in ${file}`);
 if(file.endsWith('.html')&&!content.includes('content="index,follow"'))throw new Error(`Indexing disabled in ${file}`);
}
console.log('Public output contains no unfinished history, local contacts, or review notes.');
