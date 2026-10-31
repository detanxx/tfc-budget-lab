import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#FBF6EE"/>
<circle cx="1160" cy="52" r="200" fill="#F2E9DD"/>
<circle cx="39" cy="640" r="140" fill="#E2E2EB"/>
<g font-family="Arial, Helvetica, sans-serif" fill="#1A1A57">
<text x="132" y="83" font-size="27" font-weight="700">TFC Budget Lab</text>
<text x="132" y="110" font-size="17">TEEN FINANCE CLUB</text>
<text x="60" y="225" font-size="57" font-weight="700">Your money.</text>
<text x="60" y="291" font-size="57" font-weight="700">Your next move.</text>
<text x="60" y="351" font-size="24">Make a plan. Try a choice.</text>
<text x="60" y="384" font-size="24">See what changes.</text>
<rect x="60" y="427" width="257" height="56" rx="12" fill="#F9735C"/>
<text x="84" y="463" font-size="22" font-weight="700">Build your budget →</text>
<text x="60" y="561" font-size="19">No sign-up. Just possibilities.</text>
<rect x="646" y="113" width="494" height="427" rx="24" fill="white" stroke="#E2E2EB" stroke-width="2"/>
<text x="678" y="158" font-size="21" font-weight="700">A little plan. More possibilities.</text>
<rect x="674" y="183" width="438" height="80" rx="12" fill="#6ED9B3"/>
<text x="696" y="215" font-size="17">PAYDAY</text><text x="696" y="245" font-size="23" font-weight="700">Part-time job</text><text x="1090" y="235" font-size="29" font-weight="700" text-anchor="end">+$320</text>
<rect x="674" y="277" width="438" height="80" rx="12" fill="#FCD34D"/>
<text x="696" y="309" font-size="17">SAVING FOR</text><text x="696" y="339" font-size="23" font-weight="700">Concert tickets</text><text x="1090" y="329" font-size="29" font-weight="700" text-anchor="end">$80</text>
<rect x="674" y="371" width="438" height="80" rx="12" fill="#F2E9DD"/>
<text x="696" y="403" font-size="17">SPENDING</text><text x="696" y="433" font-size="23" font-weight="700">Food + getting around</text><text x="1090" y="423" font-size="29" font-weight="700" text-anchor="end">$100</text>
<text x="696" y="499" font-size="22" font-weight="700">Left for your next move</text><text x="1090" y="500" font-size="30" font-weight="700" text-anchor="end">$140</text>
<text x="1139" y="570" font-size="15" text-anchor="end">Example budget · Canadian dollars</text>
</g></svg>`;
const logo = await sharp(root + 'public/tfc-logo.png').resize(68, 68, { fit: 'inside' }).png().toBuffer();
await sharp(Buffer.from(svg)).composite([{ input: logo, left: 52, top: 48 }]).png().toFile(root + 'public/budget-lab-social.png');
console.log('Created public/budget-lab-social.png (1200 × 630)');
