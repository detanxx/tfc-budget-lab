import {createAnalytics,eligible,type Consent,type Screen} from '../lib/analytics';

declare global {
 interface Window {dataLayer?:unknown[];gtag?:(...args:unknown[])=>void;}
}
const env=import.meta.env||{};
const id=env.VITE_GA4_MEASUREMENT_ID||'';
export const analyticsEnabled=eligible({production:!!env.PROD,deployment:typeof __TFC_DEPLOYMENT_ENV__==='undefined'?'development':__TFC_DEPLOYMENT_ENV__,id,hostname:location.hostname,protocol:location.protocol});
const cookieName='tfc_analytics_consent_v1';
const cookieDomain=location.hostname==='tools.teenfinanceclub.com'?'; Domain=teenfinanceclub.com':'';
export function readConsent():Consent {
 const values=document.cookie.split(';').map(s=>s.trim()).filter(s=>s.startsWith(cookieName+'=')).map(s=>s.split('=')[1]);
 // A recorded refusal wins if legacy host-only and shared cookies conflict.
 return values.includes('denied')?'denied':values.includes('granted')?'granted':'unknown';
}
function command(...args:unknown[]){window.gtag?.(...args);}
let initialized=false;
let context={page_location:location.origin+'/budget-lab',page_title:'Budget Lab — Set up',page_referrer:''};
const ads={ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'};
function clearAnalyticsCookies(){
 for(const part of document.cookie.split(';')){
  const name=part.trim().split('=')[0];if(!/^_ga(?:_|$)/.test(name))continue;
  for(const domain of ['',`; Domain=${location.hostname}`,cookieDomain])document.cookie=`${name}=; Max-Age=0; Path=/${domain}; SameSite=Lax; Secure`;
 }
}
export const analytics=createAnalytics({
 initialize(screen:Screen){
  if(initialized)return true;
  // Refuse a second Google installation (including GTM) instead of double-counting.
  if(window.gtag||document.querySelector('script[src*="googletagmanager.com/"]'))return false;
  initialized=true;
  window.dataLayer=window.dataLayer||[];
  // Google’s queue expects an Arguments object (official gtag bootstrap).
  // eslint-disable-next-line prefer-rest-params
  window.gtag=function(){window.dataLayer!.push(arguments);};
  context={page_location:location.origin+screen.path,page_title:screen.title,page_referrer:''};
  command('consent','default',{analytics_storage:'denied',...ads});
  command('consent','update',{analytics_storage:'granted',...ads});
  command('js',new Date());
  command('config',id,{send_page_view:false,cookie_domain:'auto',allow_google_signals:false,allow_ad_personalization_signals:false,...context,...(env.VITE_GA4_DEBUG==='true'?{debug_mode:true}:{})});
  const script=document.createElement('script');script.id='tfc-ga4';script.async=true;script.src=`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;document.head.appendChild(script);
  return true;
 },
 consent(granted){
  (window as unknown as Record<string,unknown>)[`ga-disable-${id}`]=!granted;
  command('consent','update',{analytics_storage:granted?'granted':'denied',...ads});
  if(!granted)clearAnalyticsCookies();
 },
 send(name,params){
  if(name==='page_view'){
   const next=location.origin+params.page_path;
   context={page_location:next,page_title:params.page_title,page_referrer:context.page_location===next?'':context.page_location};
   command('set',context);
  }
  command('event',name,{...params,...context,send_to:id});
 },
},analyticsEnabled);
export function setAnalyticsConsent(choice:'granted'|'denied'){
 if(!analyticsEnabled)return;
 // Remove any host-only legacy preference before setting the shared-domain preference.
 document.cookie=`${cookieName}=; Max-Age=0; Path=/; SameSite=Lax; Secure`;
 document.cookie=`${cookieName}=${choice}; Max-Age=15552000; Path=/; SameSite=Lax; Secure${cookieDomain}`;
 analytics.setConsent(choice);window.dispatchEvent(new Event('tfc:analytics-consent'));
}
// Singleton bootstrap is outside React's render/effect lifecycle.
analytics.setConsent(readConsent());
window.addEventListener('focus',()=>{analytics.setConsent(readConsent());window.dispatchEvent(new Event('tfc:analytics-consent'));});
// Future shared shells can call analytics.page() from their router, or use these static paths.
const route=()=>{if(analyticsEnabled)analytics.page(location.pathname==='/'?'/budget-lab':location.pathname.replace(/\/$/,''));};
for(const method of ['pushState','replaceState'] as const){
 const original=history[method].bind(history);
 history[method]=(...args:Parameters<History[typeof method]>)=>{original(args[0],args[1],args[2]);route();};
}
window.addEventListener('popstate',route);
