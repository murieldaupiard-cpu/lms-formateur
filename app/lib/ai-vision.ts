import {SUPABASE_URL,SUPABASE_KEY,sessionToken} from "./media";

export class AiVisionError extends Error{constructor(message:string,public code:string,public status:number){super(message)}}

async function callAiVision(body:Record<string,unknown>){
 const token=await sessionToken();
 const res=await fetch(`${SUPABASE_URL}/functions/v1/ai-vision`,{method:"POST",headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${token}`,"Content-Type":"application/json"},signal:AbortSignal.timeout(150000),body:JSON.stringify(body)});
 const data=await res.json().catch(()=>({}));
 if(!res.ok){
  const code=String(data?.error||"AI_ERROR");
  const message=code==="QUOTA"&&typeof data?.detail==="string"?data.detail:res.status===401?"Votre session a expiré. Reconnectez-vous.":code==="OPENAI_NOT_CONFIGURED"?"La lecture et l’illustration par IA ne sont pas encore activées sur la plateforme.":"Service IA momentanément indisponible.";
  throw new AiVisionError(message,code,res.status);
 }
 return data;
}

/** Transcription fidèle d’une page importée (colonnes, frises, organigrammes) + description du style graphique. */
export async function readPageWithVision(path:string){
 const data=await callAiVision({action:"read_page",path});
 return {text:String(data?.text||""),style:String(data?.style||"")};
}

export type IllustrationRequest={title:string;items:string[];style?:string;context?:string;brand?:string;fictional?:boolean};

/** Génère une illustration pour une rubrique et renvoie son chemin de stockage privé. */
export async function generateIllustration(input:IllustrationRequest){
 const data=await callAiVision({action:"illustrate",...input});
 if(typeof data?.path!=="string")throw new AiVisionError("Illustration indisponible. Réessayez.","NO_PATH",502);
 return data.path as string;
}

export function dossierStyle(proposal:any){
 const docs=Array.isArray(proposal?.documents)?proposal.documents:[];
 return [...new Set(docs.map((d:any)=>typeof d?.style==="string"?d.style.trim():"").filter(Boolean))].join(" ").slice(0,600);
}
