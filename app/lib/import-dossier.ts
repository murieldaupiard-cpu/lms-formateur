import {storeMedia,type SourceDocument} from './media';
export async function importDossier(files:File[],connected:boolean,status:(message:string)=>void){
 if(files.length>12)throw new Error("Importez au maximum 12 documents par dossier.");
 const documents:SourceDocument[]=[];const chunks:string[]=[];const batch=crypto.randomUUID();
 let worker:any;let pageCount=0;
 const ocr=async(canvas:any)=>{if(!worker){const t=await import('tesseract.js');worker=await t.createWorker('fra+eng')}return (await worker.recognize(canvas)).data.text as string};
 try{for(let i=0;i<files.length;i++){
  const file=files[i];if(file.size>50*1024*1024)throw new Error(`${file.name} dépasse 50 Mo.`);
  const ext=file.name.split('.').pop()?.toLowerCase()||'';
  const id=`D${i+1}`;const doc:SourceDocument={id,name:file.name,original:'',pages:[]};let text='';
  status(`Lecture du document ${i+1}/${files.length} · ${file.name}`);
  if(ext==='pdf'){
   const pdfjs=await import('pdfjs-dist');pdfjs.GlobalWorkerOptions.workerSrc='/pdf.worker.min.mjs';
   const pdf=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
   try{if(pageCount+pdf.numPages>40)throw new Error("Le dossier dépasse 40 pages. Réduisez les documents importés.");
    for(let n=1;n<=pdf.numPages;n++){
     pageCount++;status(`Lecture et conservation des visuels · ${file.name} · page ${n}/${pdf.numPages}`);
     const page=await pdf.getPage(n);const viewport=page.getViewport({scale:Math.min(2.5,2000/page.getViewport({scale:1}).height)});
     const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
     await page.render({canvas,canvasContext:canvas.getContext('2d')!,viewport} as any).promise;
     const tc=await page.getTextContent();let pageText=tc.items.map((x:any)=>x.str||'').join(' ');
     if(pageText.trim().length<80){status(`Lecture OCR · ${file.name} · page ${n}/${pdf.numPages}`);pageText=await ocr(canvas)}
     const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error("Image illisible")),'image/jpeg',.85));
     const image=await storeMedia(blob,`${batch}/${id}-page-${n}.jpg`,connected);doc.pages.push({number:n,image});
     text+=`\n[${id} — page ${n}]\n${pageText.trim()||"Aucun texte lisible ; consulter le visuel original."}\n`;page.cleanup();canvas.width=0;canvas.height=0;
    }
   }finally{await pdf.destroy()}
  }else if(file.type.startsWith('image/')){
   text=await ocr(file);doc.pages.push({number:1,image:await storeMedia(file,`${batch}/${id}-image.${ext}`,connected)});
  }else if(['txt','md','csv','html'].includes(ext))text=await file.text();
  else if(ext==='docx'){const m=await import('mammoth');text=(await m.extractRawText({arrayBuffer:await file.arrayBuffer()})).value}
  else if(ext==='pptx'){const JSZip=(await import('jszip')).default;const zip=await JSZip.loadAsync(await file.arrayBuffer());for(const p of Object.keys(zip.files).filter(x=>/^ppt\/slides\/slide\d+\.xml$/.test(x)).sort((a,b)=>Number(a.match(/\d+/)?.[0])-Number(b.match(/\d+/)?.[0]))){const xml=new DOMParser().parseFromString(await zip.file(p)!.async('text'),'application/xml');text+=Array.from(xml.getElementsByTagName('a:t')).map(n=>n.textContent).join(' ')+'\n'}}
  else throw new Error(`Format non pris en charge : ${file.name}`);
  doc.original=await storeMedia(file,`${batch}/${id}-original.${ext}`,connected);
  documents.push(doc);chunks.push(`DOCUMENT ${id} : ${file.name}\n${text}`);
 }
 const text=chunks.join('\n\n');if(text.length>50000)throw new Error("Le dossier dépasse 50 000 caractères. Importez un extrait ciblé.");
 return {text,documents};
 }finally{if(worker)await worker.terminate()}
}
