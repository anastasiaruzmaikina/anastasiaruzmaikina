import { createWorker, type Worker } from 'tesseract.js';
let engine: Promise<Worker> | null = null;
export function warmEngine(){
 if(!engine)engine=createWorker('eng',1,{workerPath:'/ocr/worker.min.js',corePath:'/ocr',langPath:'/ocr',workerBlobURL:false,cacheMethod:'none'}).then(async w=>{await w.setParameters({tessedit_pageseg_mode:'11' as never});return w;}).catch(e=>{engine=null;throw e;});
 return engine;
}
export async function resetEngine(){const previous=engine;engine=null;if(previous)await previous.then(w=>w.terminate()).catch(()=>{});}
export async function imageCanvas(blob:Blob,rotation=0){
 const bitmap=await createImageBitmap(blob);try{
 if(bitmap.width*bitmap.height>50000000)throw new Error('Image exceeds 50 megapixels. Resize it before uploading.');
 const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));
 const w=Math.round(bitmap.width*scale),h=Math.round(bitmap.height*scale),turn=rotation%180!==0;
 const canvas=document.createElement('canvas');canvas.width=turn?h:w;canvas.height=turn?w:h;
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Image processing is unavailable in this browser.');
 ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.translate(canvas.width/2,canvas.height/2);ctx.rotate(rotation*Math.PI/180);ctx.drawImage(bitmap,-w/2,-h/2,w,h);return canvas;
 }finally{bitmap.close();}
}
export async function recognize(blob:Blob,rotation=0){
 const started=performance.now();const canvas=await imageCanvas(blob,rotation);const worker=await warmEngine();
 let timeout:ReturnType<typeof setTimeout>|undefined;
 try{
 const {data}=await Promise.race([worker.recognize(canvas),new Promise<never>((_,reject)=>{timeout=setTimeout(()=>{void resetEngine();reject(new Error('Reading took longer than 20 seconds. Try a clearer or smaller image.'));},20000);})]);
 return {text:data.text,confidence:data.confidence,seconds:(performance.now()-started)/1000};
 }finally{if(timeout)clearTimeout(timeout);canvas.width=canvas.height=0;}
}
