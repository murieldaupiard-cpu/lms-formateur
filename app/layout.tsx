import "./globals.css";
export const metadata={
 title:"LMS Formateur",
 description:"Studio de création pédagogique",
 icons:{
  icon:[{url:"/icon.svg?v=am4",type:"image/svg+xml"}],
  shortcut:"/icon.svg?v=am4",
  apple:"/icon.svg?v=am4"
 }
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="fr"><head><link rel="icon" href="/icon.svg?v=am4" type="image/svg+xml"/><link rel="shortcut icon" href="/icon.svg?v=am4"/></head><body>{children}<script dangerouslySetInnerHTML={{__html:`(()=>{const sync=()=>{document.querySelectorAll(".creation-row").forEach(row=>{if(!row.textContent?.includes("Créer le contenu de l’objectif"))return;const objective=document.querySelector(".objective-card strong")?.textContent?.trim();const preview=row.querySelector(".course-preview h4");if(preview&&objective&&objective!=="Votre objectif pédagogique")preview.textContent=objective;const recap=row.querySelector(".pedago-recap");if(recap){const blocks=[...recap.children];blocks.forEach((b,i)=>{if(i===0)(b as HTMLElement).style.display="none"});}})};new MutationObserver(sync).observe(document.body,{subtree:true,childList:true,characterData:true});sync()})()`}}/></body></html>}