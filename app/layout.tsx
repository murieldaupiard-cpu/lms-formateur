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
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="fr"><head><link rel="icon" href="/icon.svg?v=am4" type="image/svg+xml"/><link rel="shortcut icon" href="/icon.svg?v=am4"/></head><body>{children}</body></html>}