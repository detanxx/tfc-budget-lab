import {mkdir,copyFile,cp,access,writeFile,rm} from 'node:fs/promises';
import {homedir} from 'node:os';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const project=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const label='ca.teenfinanceclub.budgetlab';
const domain=`gui/${process.getuid()}`;
const app=resolve(homedir(),'Library/Application Support/TFC Budget Lab');
const plist=resolve(homedir(),`Library/LaunchAgents/${label}.plist`);
const mode=process.argv[2]||'install';
const launch=(...args)=>spawnSync('/bin/launchctl',args,{encoding:'utf8'});
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
if(process.platform!=='darwin')throw new Error('This setup is for macOS.');
if(!['install','update','uninstall'].includes(mode))throw new Error('Use install, update, or uninstall.');
if(mode==='uninstall'){
 launch('bootout',`${domain}/${label}`);
 await rm(plist,{force:true});
 console.log('Automatic startup removed. Your project and preview files are kept.');
}else{
 await access(resolve(project,'dist/index.html'));
 await mkdir(app,{recursive:true});
 await mkdir(dirname(plist),{recursive:true});
 // No dependencies on Documents access or the project’s node_modules at login.
 launch('bootout',`${domain}/${label}`);
 await rm(resolve(app,'dist'),{recursive:true,force:true});
 await cp(resolve(project,'dist'),resolve(app,'dist'),{recursive:true});
 await copyFile(resolve(project,'scripts/local-preview-server.mjs'),resolve(app,'server.mjs'));
 const xml=`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>${label}</string>
<key>ProgramArguments</key><array><string>${escape(process.execPath)}</string><string>${escape(resolve(app,'server.mjs'))}</string></array>
<key>WorkingDirectory</key><string>${escape(app)}</string>
<key>RunAtLoad</key><true/><key>KeepAlive</key><true/>
<key>ThrottleInterval</key><integer>30</integer>
<key>StandardOutPath</key><string>${escape(resolve(app,'preview.log'))}</string>
<key>StandardErrorPath</key><string>${escape(resolve(app,'preview-error.log'))}</string>
</dict></plist>`;
 await writeFile(plist,xml);
 const result=launch('bootstrap',domain,plist);
 if(result.status!==0)throw new Error(result.stderr||'Could not register automatic startup.');
 console.log('Installed. Budget Lab will start at login without a Terminal window.');
 console.log('Open http://127.0.0.1:5174/');
 console.log('If a manual server is already using 5174, stop it with Control-C once. The background preview will retry within 30 seconds.');
 console.log('Logs: '+app);
}
