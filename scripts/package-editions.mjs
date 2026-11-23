/** Build source-only commercial edition directories and ZIP archives.
 * Excludes node_modules, .venv, dist, caches, local media, credentials and temp files.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
const root=process.cwd(); const out=join(root,'release'); const stamp=new Date().toISOString().slice(0,10); rmSync(out,{recursive:true,force:true});mkdirSync(out,{recursive:true});
const ignore=new Set(['node_modules','.venv-dev','dist','release','.git','.claude','backend/media','mobile/node_modules','mobile/ios/Pods','mobile/ios/build','mobile/android/.gradle','mobile/android/build','mobile/ios/DerivedData','__pycache__','.pytest_cache','.DS_Store','.env']);
function copyTree(src,dst){mkdirSync(dst,{recursive:true});for(const entry of readdirSync(src,{withFileTypes:true})){const rel=relative(root,join(src,entry.name));if(ignore.has(rel)||[...ignore].some(x=>rel===x||rel.startsWith(`${x}/`)||rel.endsWith(`/${x}`)||rel.includes(`/${x}/`)))continue;const from=join(src,entry.name),to=join(dst,entry.name);if(entry.isDirectory()){if(ignore.has(entry.name)||ignore.has(rel))continue;copyTree(from,to);}else{if(ignore.has(entry.name))continue;cpSync(from,to);}}}
function writeReadme(dir,title,scope){writeFileSync(join(dir,'EDITION.md'),`# ${title}\n\n${scope}\n\n## Setup\n\nRead the root README, DEPLOYMENT.md, BACKUP.md and BUSINESS-PRO.md. Replace .env.example with a buyer-owned .env; never commit credentials.\n\nGenerated source-only package: ${stamp}.\n`)}
const standard=join(out,'standard');copyTree(root,standard);rmSync(join(standard,'backend'),{recursive:true,force:true});rmSync(join(standard,'mobile'),{recursive:true,force:true});writeReadme(standard,'Bloomé Floral — Standard','React/Vite storefront with 36-product demo catalog, local cart and clearly labelled demo checkout. No backend dependency.');
const pro=join(out,'business-pro');copyTree(root,pro);rmSync(join(pro,'mobile'),{recursive:true,force:true});writeReadme(pro,'Bloomé Floral — Business PRO','React storefront plus FastAPI/PostgreSQL API, migrations, CMS, inventory, delivery, orders and optional Stripe/SMTP integration.');
const full=join(out,'premium-full');copyTree(root,full);writeReadme(full,'Bloomé Floral — Premium Full System','Business PRO plus the Expo iOS/Android application under mobile/. Both clients use the same API, database and CMS. Native build requires a networked Expo toolchain.');
for(const edition of ['standard','business-pro','premium-full']){const archive=join(out,`${edition}-${stamp}.zip`);execFileSync('ditto',['-c','-k','--sequesterRsrc','--keepParent',join(out,edition),archive]);console.log(archive)}
