import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'TFC Budget Lab | Teen Finance Club',description:'Make a plan. Try a choice. See what changes. An account-free budgeting budget planner.',icons:{icon:'/tfc-logo.png'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en-CA"><body>{children}</body></html>}
