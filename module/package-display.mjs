const key=value=>String(value??'').trim().toLocaleLowerCase('ru');
export function applyPackageDisplay({modules,packs,folders},bindings){
 const changed={modules:0,packs:0,folders:0};if(bindings?.schemaVersion!==1)return changed;
 const packageForPack=p=>p.metadata?.packageName??String(p.collection??'').split('.')[0];
 for(const [id,row]of Object.entries(bindings.packages)){
  const mod=modules.get(id);if(mod&&[row.sourceTitle,row.title].includes(mod.title)&&mod.title!==row.title){mod.updateSource({title:row.title});changed.modules++;}
  for(const pack of packs){const p=row.packs[pack.collection];if(!p||packageForPack(pack)!==id)continue;if([p.sourceLabel,...(p.sourceLabels??[]),p.label].includes(pack.metadata.label)&&pack.metadata.label!==p.label){pack.metadata.label=p.label;changed.packs++;}}
 }
 const parent=f=>f.folder?.id??f._source?.folder??null;
 function packageIds(folder,seen=new Set()){
  if(seen.has(folder.id))return new Set();seen.add(folder.id);
  const ids=new Set([...packs].filter(p=>(p.folder?.id??p.folder)===folder.id).map(packageForPack));
  for(const child of folders)if(parent(child)===folder.id)for(const id of packageIds(child,seen))ids.add(id);
  return ids;
 }
 for(const f of folders){if(f.type!=='Compendium')continue;const ids=packageIds(f);if(ids.size!==1)continue;const row=bindings.packages[[...ids][0]];if(!row)continue;if([...row.folderSourceNames,row.sourceTitle,row.title,row.folderName].some(n=>key(n)===key(f.name))&&f.name!==row.folderName){f.updateSource({name:row.folderName});changed.folders++;}}
 return changed;
}
