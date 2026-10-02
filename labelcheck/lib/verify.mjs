export const WARNING = 'GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.';
export const SAMPLE = {brand:'OLD TOM DISTILLERY',type:'Kentucky Straight Bourbon Whiskey',abv:'45',net:'750 mL',producer:'Bottled by Old Tom Distillery, Louisville, KY',origin:'',beverage:'spirits',imported:false,abvRequired:true};
export const flat = s => String(s ?? '').normalize('NFKC').replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/\s+/g,' ').trim();
export const normalize = s => flat(s).toLowerCase();
export function volume(value) {
 const m=flat(value).match(/^(\d+(?:\.\d+)?)\s*(ml|cl|l|liters?|litres?|fl\.?\s*oz\.?)$/i);
 if(!m)return null; const unit=m[2].toLowerCase();return Number(m[1])*(unit==='cl'?10:unit==='l'||unit.startsWith('lit')?1000:unit.startsWith('fl')?29.5735295625:1);
}
export function verify(text,app,confidence=100) {
 const n=normalize(text), rows=[];
 const add=(field,expected,observed,status,note)=>rows.push({field,expected,observed,status,note});
 const lines=text.split(/\n/).map(flat).filter(Boolean);
 const textCheck=(field,expected,required=true)=>{
   if(!flat(expected)){add(field,'Not supplied','—',required?'review':'skip',required?'Enter the application value to compare.':'Not required for this application.');return;}
   const index=n.indexOf(normalize(expected));
   const brandMatch=lines.some((_,i)=>[1,2,3].some(count=>normalize(lines.slice(i,i+count).join(' '))===normalize(expected)));
   const matched=field==='Brand name'?brandMatch:index>=0 && (index===0 || !/[a-z0-9]/i.test(n[index-1])) && (index+normalize(expected).length===n.length || !/[a-z0-9]/i.test(n[index+normalize(expected).length]));
   const tokens=normalize(expected).split(' ');
   const candidate=lines.find(l=>tokens.some(t=>t.length>3&&normalize(l).includes(t))) || 'Not located in recognized text';
   add(field,expected,matched?lines.filter(l=>normalize(l).includes(tokens[0])).join(' · ')||expected:candidate,matched?'match':'review',matched?'Matches after case, whitespace and curly-quote normalization.':'Not confidently located. Inspect the artwork; OCR may have missed it.');
 };
 textCheck('Brand name',app.brand);textCheck('Class / type',app.type);
 const abvs=[...text.matchAll(/(\d+(?:\.\d+)?)\s*%\s*(?:alc(?:ohol)?\.?\s*(?:\/|by)?\s*vol(?:ume)?\.?|abv)/gi)].map(m=>Number(m[1]));
 const proofs=[...text.matchAll(/(\d+(?:\.\d+)?)\s*proof/gi)].map(m=>Number(m[1]));
 const expected=Number(app.abv);
 if(!flat(app.abv))add('Alcohol content',app.abvRequired?'Not supplied':'Optional','—',app.abvRequired?'review':'skip','Application ABV required setting is selected by the reviewer.');
 else if(!Number.isFinite(expected)||expected<0||expected>100)add('Alcohol content',app.abv,'—','review','Enter an ABV between 0 and 100.');
 else if(!abvs.length)add('Alcohol content',`${expected}% ABV`,proofs.length?`${proofs.join(', ')} proof; ABV not located`:'Not located','review','Proof alone does not verify the ABV statement.');
 else {const pass=abvs.every(v=>v===expected)&&proofs.every(v=>v===expected*2);add('Alcohol content',`${expected}% ABV`,`${abvs.join(', ')}% ABV${proofs.length?` · ${proofs.join(', ')} proof`:''}`,pass?'match':'mismatch',pass?'Numeric ABV matches; any recognized proof is consistent.':'Recognized alcohol content differs or proof conflicts with ABV.');}
 const nets=[...text.matchAll(/\b\d+(?:\.\d+)?\s*(?:mL|cL|liters?|litres?|L|fl\.?\s*oz\.?)\b/gi)].map(m=>m[0]);
 const v=volume(app.net);
 if(v===null)add('Net contents',app.net||'Not supplied',nets.join(' · ')||'Not located','review','Use a quantity and unit, such as 750 mL or 0.75 L.');
 else {const match=nets.some(x=>Math.abs(volume(x)-v)<0.05);add('Net contents',app.net,nets.join(' · ')||'Not located',match?'match':nets.length?'mismatch':'review',match?'Equivalent units normalized to milliliters.':nets.length?'Recognized quantity differs from the application.':'OCR did not locate a volume statement.');}
 textCheck('Producer / address',app.producer);
 textCheck('Country of origin',app.origin,app.imported);
 const header=flat(text).match(/government\s+warning\s*:/i);
 const start=flat(text).search(/government\s+warning\s*:/i);
 const actual=start<0?'':flat(text).slice(start,start+WARNING.length);
 if(Number.isFinite(expected)&&flat(app.abv)&&expected<0.5) add('Warning text','Required at ≥0.5% ABV',header?.[0]||'Not located','skip','Below the federal health-warning ABV threshold; other requirements may apply.');
 else add('Warning text',WARNING,actual||'Not located',actual===WARNING?'match':header?'mismatch':'review',actual===WARNING?'Exact text and punctuation match; line wrapping is ignored.':header?'Warning wording, capitalization or punctuation differs. Verify against the artwork.':'Warning not located. Check all label panels or upload a clearer image.');
 add('Warning heading','GOVERNMENT WARNING:',header?.[0]||'Not located',header?.[0]==='GOVERNMENT WARNING:'?'match':header?'mismatch':'review','Capitalization is checked separately from visual bold formatting.');
 const mm=v===null?'appropriate':v>3000?'3':v>237?'2':'1';
 add('Warning formatting',`Bold heading; regular body; minimum ${mm} mm type`,'Human inspection required','review','Check bold heading, nonbold body, continuous paragraph, separation and contrast. Physical size needs label dimensions; OCR cannot certify it.');
 if(confidence<85)add('Image readability','Clear, legible text',`${Math.round(confidence)}% OCR confidence`,'review','Low OCR confidence can conceal errors. Rotate the image or request clearer artwork. This is not a calibrated probability.');
 return {rows,status:rows.some(r=>r.status==='mismatch')?'mismatch':'review',confidence};
}
export function csvCell(value){const s=String(value??'');return '"'+(/^[=+\-@\t\r]/.test(s)?"'":'')+s.replaceAll('"','""')+'"';}
