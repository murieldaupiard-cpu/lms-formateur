export const SUPABASE_URL = "https://jfvmqfxivydihgjcyffq.supabase.co";
export const SUPABASE_KEY = "sb_publishable_dwSQTgZooCKeXxFCCQMlqw_3QgVMJ62";
export type SourceDocument = {id:string;name:string;original:string;pages:{number:number;image:string}[]};
let refresh:Promise<string>|null=null;
export async function sessionToken():Promise<string>{
 const session=JSON.parse(localStorage.getItem("trainer-session")||"null");
 if(!session?.access_token)throw new Error("Connectez-vous pour enregistrer les supports et utiliser l’IA.");
 let expires=0;
 try{expires=JSON.parse(atob(session.access_token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).exp*1000}catch{}
 if(expires>Date.now()+60000)return session.access_token;
 if(!session.refresh_token)throw new Error("Votre session a expiré. Reconnectez-vous.");
 if(!refresh)refresh=(async()=>{
  const res=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,{method:"POST",headers:{apikey:SUPABASE_KEY,"Content-Type":"application/json"},body:JSON.stringify({refresh_token:session.refresh_token})});
  if(!res.ok)throw new Error("Votre session a expiré. Reconnectez-vous.");
  const next=await res.json();localStorage.setItem("trainer-session",JSON.stringify(next));return next.access_token as string;
 })().finally(()=>{refresh=null});
 return refresh;
}
async function localDB(){return new Promise<IDBDatabase>((resolve,reject)=>{const req=indexedDB.open("trainer-source-files",1);req.onupgradeneeded=()=>req.result.createObjectStore("files");req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
export async function storeMedia(blob:Blob,path:string,connected:boolean):Promise<string>{
 if(!connected){const db=await localDB();try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction("files","readwrite");tx.objectStore("files").put(blob,path);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)});return `local:${path}`}finally{db.close()}}
 const token=await sessionToken();const user=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${token}`}});
 if(!user.ok)throw new Error("Impossible de vérifier la session pour conserver les documents.");
 const identity=await user.json();const key=`${identity.id}/dossiers/${path}`;
 const res=await fetch(`${SUPABASE_URL}/storage/v1/object/trainer-resources/${key}`,{method:"POST",headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${token}`,"Content-Type":blob.type||"application/octet-stream"},body:blob});
 if(!res.ok)throw new Error("Enregistrement du support impossible. Réessayez l’import.");return key;
}
export async function loadMedia(path:string):Promise<Blob>{
 if(path.startsWith("local:")){const db=await localDB();try{return await new Promise<Blob>((resolve,reject)=>{const r=db.transaction("files").objectStore("files").get(path.slice(6));r.onsuccess=()=>r.result?resolve(r.result):reject(new Error("Support absent de cet appareil. Réimportez-le."));r.onerror=()=>reject(r.error)})}finally{db.close()}}
 // Only resolve paths inside the existing private resource bucket.
 if(!/^[a-zA-Z0-9-]+\/dossiers\/[a-zA-Z0-9/_.-]+$/.test(path))throw new Error("Référence de support invalide.");
 const token=await sessionToken();const res=await fetch(`${SUPABASE_URL}/storage/v1/object/authenticated/trainer-resources/${path}`,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${token}`}});
 if(!res.ok)throw new Error("Support inaccessible avec cette session.");return res.blob();
}
