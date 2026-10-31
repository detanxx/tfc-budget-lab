// Keep the reviewed PNG as text for source transport; restore it before Vite builds.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const source = new URL('../assets/budget-lab-social.png.base64', import.meta.url);
const output = new URL('../public/budget-lab-social.png', import.meta.url);
await mkdir(new URL('../public/', import.meta.url), { recursive: true });
await writeFile(output, Buffer.from(await readFile(source, 'utf8'), 'base64'));
