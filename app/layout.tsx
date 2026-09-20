import "./globals.css";
export const metadata={
 title:"LMS Formateur",
 description:"Studio de création pédagogique",
 icons:{icon:"/icon.svg",shortcut:"/icon.svg",apple:"/icon.svg"}
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="fr"><body>{children}</body></html>}