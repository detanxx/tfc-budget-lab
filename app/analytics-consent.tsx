import {useEffect,useState} from 'react';
import {analyticsEnabled,readConsent,setAnalyticsConsent} from './analytics';
export function AnalyticsConsent(){
 const [choice,setChoice]=useState(readConsent),[editing,setEditing]=useState(false);
 useEffect(()=>{const sync=()=>setChoice(readConsent());window.addEventListener('tfc:analytics-consent',sync);return()=>window.removeEventListener('tfc:analytics-consent',sync);},[]);
 if(!analyticsEnabled)return null;
 const choose=(value:'granted'|'denied')=>{setAnalyticsConsent(value);setChoice(value);setEditing(false);};
 return <aside className="analytics-consent" aria-label="Analytics privacy settings">{choice==='unknown'||editing?<><h2>Help us improve the tools?</h2><p>With your permission, Google Analytics measures visits and which tools you use. We don’t send your budget amounts, goal names, or written answers. The tools work either way.</p><div className="actions"><button className="secondary" onClick={()=>choose('denied')}>No thanks</button><button className="primary" onClick={()=>choose('granted')}>Allow analytics</button>{choice!=='unknown'&&<button className="text-button" onClick={()=>setEditing(false)}>Close</button>}</div><small>You can change this choice here at any time.</small></>:<button className="text-button" onClick={()=>setEditing(true)}>Analytics privacy settings</button>}</aside>;
}
