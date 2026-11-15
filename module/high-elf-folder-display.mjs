// Native folders retain IDs and parent relationships. updateSource is memory-only.
export function translateHighElfFolders(pack,bindings) {
 const collection=pack?.collection??pack?.metadata?.id;
 if(!collection?.startsWith('wfrp4e-helf.'))return 0;
 let count=0;
 for(const folder of pack.folders??[]) {
  const row=bindings?.entries?.[collection]?.[folder.id];
  const parent=folder.folder?.id??folder._source?.folder??null;
  if(!row||parent!==row.parent||![row.sourceName,row.name].includes(folder.name))continue;
  if(folder.name!==row.name){folder.updateSource({name:row.name});count++;}
 }
 return count;
}
