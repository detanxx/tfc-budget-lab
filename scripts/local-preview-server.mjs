// Dependency-free preview server, bound only to this Mac.
import http from 'node:http';
import {readFile, realpath, stat} from 'node:fs/promises';
import {resolve, sep, extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root = await realpath(fileURLToPath(new URL('./dist/', import.meta.url)));
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2'};
http.createServer(async (req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
 try {
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  let path=resolve(root,'.'+pathname);
  if(path!==root&&!path.startsWith(root+sep))throw new Error('Invalid path');
  try {if((await stat(path)).isDirectory())path=resolve(path,'index.html');}
  catch {if(extname(path))throw new Error('Not found');path=resolve(root,'index.html');}
  path=await realpath(path);
  if(!path.startsWith(root+sep))throw new Error('Invalid path');
  const data=await readFile(path);
  res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  res.end(req.method==='HEAD'?undefined:data);
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(5174,'127.0.0.1',()=>console.log('Budget Lab: http://127.0.0.1:5174/'));
