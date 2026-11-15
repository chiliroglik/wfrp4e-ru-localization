/** Display names only, addressed by native species/subspecies keys. */
export function translateSubspeciesNames(config,bindings){
 const result={covered:0,changed:0,custom:[],missing:[]};
 if(bindings?.schemaVersion!==1)return result;
 for(const [parent,rows]of Object.entries(bindings.subspecies))for(const [id,row]of Object.entries(rows)){
  const target=config.subspecies?.[parent]?.[id];if(!target){result.missing.push(parent+'.'+id);continue;}
  if(target.name!==row.sourceName&&target.name!==row.name){result.custom.push(parent+'.'+id);continue;}
  result.covered++;if(target.name!==row.name){target.name=row.name;result.changed++;}
 }
 for(const [id,row]of Object.entries(bindings.species)){
  if(config.species?.[id]===row.sourceName)config.species[id]=row.name;
 }
 return result;
}
