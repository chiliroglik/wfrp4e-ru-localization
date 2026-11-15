/** Localize only prepared career talent names bound to exact Core source IDs. */
export function normalizeNativeCareerTalentNames(career, data, catalog) {
  const source=career?._stats?.compendiumSource ?? career?.flags?.core?.sourceId;
  const match=/^Compendium\.wfrp4e-core\.items\.(?:Item\.)?([A-Za-z0-9]+)$/.exec(source??'');
  if(!match || data.schemaVersion!==1 || !Array.isArray(career.system?.talents))return 0;
  const rows=data.careers[match[1]]?.bindings??[];
  const values=career.system.talents.slice();let changed=0;
  for(const row of rows){
    const target=catalog.get(row.talentId);
    if(target?.type!=='talent'||target.name!==row.name)continue;
    if(values[row.index]!==row.original)continue;
    values[row.index]=row.name;changed++;
  }
  if(changed)career.system.talents=values;
  if(Array.isArray(career.system.skills)){
    const skills=career.system.skills.slice();let skillChanges=0;
    for(const row of data.careers[match[1]]?.skillBindings??[]){
      const target=catalog.get(row.skillId);
      if(target?.type==='skill'&&target.name===row.name&&skills[row.index]===row.original){skills[row.index]=row.name;skillChanges++;}
    }
    if(skillChanges)career.system.skills=skills;
    changed+=skillChanges;
  }
  return changed;
}
