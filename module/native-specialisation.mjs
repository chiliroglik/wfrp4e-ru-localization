export const labelKey=value=>String(value??'').normalize('NFKC').replace(/\s+/g,' ').replace(/\s*\(\s*/g,' (').replace(/\s*\)/g,')').trim().toLocaleLowerCase('ru');
export function splitLabel(value){const m=/^(.*?)\s*\((.*)\)\s*$/.exec(String(value??'').trim());return {base:(m?.[1]??String(value??'')).trim(),spec:m?.[2]?.trim()??null};}
export const isChoice=value=>value==null||/^(?:|any(?:\s+(?:one|colou?r|arcane lore|lore|wind))?|на выбор|люб(?:ой|ая|ое|ые)(?:\s+.*)?)$/iu.test(String(value).trim());
export function coreId(item){return /^Compendium\.wfrp4e-core\.items\.(?:Item\.)?([A-Za-z0-9]+)$/.exec(item?._stats?.compendiumSource??item?.flags?.core?.sourceId??'')?.[1]??null;}
function names(row,id,config){return [row.name,row.sourceName,...(config?.talents?.[id]?.aliases??[])];}
export function resolveCatalogLabel(label,type,catalog,config={}){
 const rows=Object.entries(catalog).filter(([,r])=>r.type===type),key=labelKey(label),parts=splitLabel(label);
 const exact=rows.filter(([id,r])=>names(r,id,config).some(n=>labelKey(n)===key));
 if(exact.length===1)return {id:exact[0][0],name:exact[0][1].name,specialized:false,spec:splitLabel(exact[0][1].name).spec};
 const bases=rows.filter(([id,r])=>names(r,id,config).some(n=>labelKey(splitLabel(n).base)===labelKey(parts.base)));
 const generic=bases.filter(([,r])=>splitLabel(r.sourceName).spec==null||splitLabel(r.sourceName).spec==='');
 const match=generic.find(([,r])=>splitLabel(r.sourceName).spec==='')??(generic.length===1?generic[0]:null);if(!match)return null;
 const [id,row]=match;let spec=parts.spec;
 if(type==='talent'&&spec&&!isChoice(spec)){
  const group=config.talents?.[id]?.group;
  if(group){const skill=resolveCatalogLabel(group+' ('+spec+')','skill',catalog,config);if(skill)spec=splitLabel(skill.name).spec;}
 }
 return {id,name:splitLabel(row.name).base+(spec!=null?' ('+spec+')':''),specialized:true,spec};
}
export function choiceRule(data,catalog,config){
 const source=data?._stats?.compendiumSource??data?.flags?.core?.sourceId;if(source&&!/^Compendium\.wfrp4e-core\.items\./.test(source))return null;
 const id=coreId(data)??(catalog[data?._id]?.type===data?.type?data._id:null);if(!id||catalog[id]?.type!==data.type)return null;
 const parsed=splitLabel(data.name),rule=config.talents?.[id];
 if(data.type==='talent'&&rule&&(isChoice(parsed.spec))&&!data.flags?.['wfrp4e-ru-overlay']?.specialisation)return {id,...rule};
 if(data.type==='skill'&&isChoice(parsed.spec)){
  const base=splitLabel(catalog[id].sourceName).base;
  if(Object.values(catalog).some(r=>r.type==='skill'&&splitLabel(r.sourceName).base===base&&!isChoice(splitLabel(r.sourceName).spec)))return {id,mode:'skill',group:base};
 }
 return null;
}
export function skillChoices(group,catalog){return Object.entries(catalog).filter(([,r])=>r.type==='skill'&&labelKey(splitLabel(r.sourceName).base)===labelKey(group)&&!isChoice(splitLabel(r.sourceName).spec)).map(([id,r])=>({id,name:r.name,spec:splitLabel(r.name).spec})).sort((a,b)=>a.name.localeCompare(b.name,'ru'));}
export function missingSkillIds(items,ids,catalog){return [...new Set(ids)].filter(id=>!items.some(i=>i.type==='skill'&&(coreId(i)===id||i.id===id||i._id===id||labelKey(i.name)===labelKey(catalog[id]?.name))));}
export function matchCareerLabels(career,items,catalog,config){
 if(!career?.system)return 0;let changed=0;
 for(const field of ['skills','talents']){
  const type=field==='skills'?'skill':'talent';if(!Array.isArray(career.system[field]))continue;
  career.system[field]=career.system[field].map(label=>{
   const parsed=resolveCatalogLabel(label,type,catalog,config);
   const owned=items.find(i=>i.type===type&&(labelKey(i.name)===labelKey(label)||(parsed&&coreId(i)===parsed.id&&isChoice(splitLabel(label).spec))));
   if(owned&&owned.name!==label){changed++;return owned.name;}return label;
  });
 }
 return changed;
}
