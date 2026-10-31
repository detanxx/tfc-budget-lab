import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],define:{__TFC_DEPLOYMENT_ENV__:JSON.stringify(process.env.VERCEL_ENV||'development')},server:{host:'127.0.0.1',port:5173,strictPort:true,watch:{usePolling:true}},build:{outDir:'dist'}});
