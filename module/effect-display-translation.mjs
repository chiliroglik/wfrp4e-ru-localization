// Presentation-only translations bound to native Core Item and ActiveEffect IDs.
export function translateEffectDisplay(value, binding, source, compendium) {
  const collection = compendium?.metadata?.id ?? compendium?.collection;
  if (!['wfrp4e-core.items', 'wfrp4e-archives2.items', 'wfrp4e-archives3.items', 'wfrp4e-wom.items', 'wfrp4e-helf.items'].includes(collection) || !Array.isArray(value) || !binding || source?._id !== binding.item) return value;
  if (collection !== 'wfrp4e-core.items' && binding.collection !== collection) return value;
  return value.map(effect => {
    const row = binding.effects?.[effect._id];
    if (!row) return effect;
    const out = structuredClone(effect);
    out.name = row.name;
    for (const script of row.scripts ?? []) {
      const actual = out.system?.scriptData?.[script.index];
      if (!actual || (actual.trigger ?? null) !== script.trigger || (actual.script ?? null) !== script.script) continue;
      if (actual.label === script.sourceLabel || actual.label === script.label) actual.label = script.label;
    }
    return out;
  });
}
export function effectDisplayConverter(previousConverter) {
  return {translate(context) {
    // Retain the existing translator's behavior for unbound effects as well.
    const previous = previousConverter();
    const base = previous?.translate ? previous.translate({...context, value: structuredClone(context.value)}) : context.value;
    return translateEffectDisplay(base, context.translation, context.source, context.contextCompendium);
  }};
}

export function translateActorDisplay(context) {
 const {value,translation:binding,source,contextCompendium:pack}=context;
 const collection=pack?.metadata?.id??pack?.collection;
 if(!['wfrp4e-core.actors','wfrp4e-archives1.actors','wfrp4e-archives2.actors','wfrp4e-archives3.actors','wfrp4e-wom.actors','wfrp4e-helf.actors'].includes(collection)||source?._id!==binding?.actor||!Array.isArray(value))return value;
 if(collection!=='wfrp4e-core.actors'&&binding.collection!==collection)return value;
 return value.map(item=>{
  const row=binding.items?.[item._id];
  if(!row||item.type!==row.type||![row.sourceName,row.name,...(row.sourceNames??[])].includes(item.name))return item;
  const out=structuredClone(item);out.name=row.name;
  if(row.description&&out.system?.description&&(row.sourceDescription===undefined||[row.sourceDescription,row.description].includes(out.system.description.value)))out.system.description.value=row.description;
  if(Array.isArray(out.effects))out.effects=translateEffectDisplay(out.effects,{item:item._id,effects:row.effects},{_id:item._id},{collection:'wfrp4e-core.items'});
  if(['wfrp4e-wom.actors','wfrp4e-helf.actors'].includes(collection)) {
   for(const [field,b] of Object.entries(row.displayFields??{})) {
    if(!['range','target','duration','tests'].includes(field))continue;
    const current=out.system?.[field];
    if(current&&[b.source,b.translation].includes(current.value))current.value=b.translation;
   }
  }
  if(['wfrp4e-wom.actors','wfrp4e-helf.actors'].includes(collection) && out.type==='career') {
   for(const [field,b] of Object.entries(row.careerFields??{})) {
    if(['skills','talents','trappings'].includes(field)) {
     const current=out.system?.[field];
     if(Array.isArray(current)&&current.length===b.source.length&&current.length===b.translation.length)
      out.system[field]=current.map((v,n)=>[b.source[n],b.translation[n]].includes(v)?b.translation[n]:v);
    } else if(['class.value','careergroup.value'].includes(field)) {
     const key=field.split('.')[0];
     if(out.system?.[key]&&[b.source,b.translation].includes(out.system[key].value))out.system[key].value=b.translation;
    }
   }
  }
  return out;
 });
}

// Babele string fields do not translate arrays. Preserve list length/order and manual edits.
export function translateCareerArrayDisplay({value,translation:binding,source,contextCompendium:pack}) {
 const collection=pack?.metadata?.id??pack?.collection;
 if(!['wfrp4e-archives2.items','wfrp4e-archives3.items', 'wfrp4e-wom.items', 'wfrp4e-helf.items'].includes(collection)||binding?.collection!==collection||source?._id!==binding.item||source.type!=='career'||!['skills','talents','trappings'].includes(binding.field)||!Array.isArray(value)||value.length!==binding.names?.length||value.length!==binding.sourceValues?.length)return value;
 return value.map((text,index)=>text===binding.sourceValues[index]||text===binding.names[index]||(binding.sourceAliases?.[index]??[]).includes(text)?binding.names[index]:text);
}

// Exact Actor ID, type and source value guards preserve hand-edited enterprise data.
export function translateEnterpriseDisplay({value,translation:binding,source,contextCompendium:pack}) {
 const collection=pack?.metadata?.id??pack?.collection;
 if(collection!=='wfrp4e-archives3.actors'||binding?.collection!==collection||source?._id!==binding.actor||source.type!=='wfrp4e-archives3.enterprise')return value;
 if(binding.field==='eventTable') {
  if(!value||value.uuid!==binding.uuid||![binding.sourceName,binding.name].includes(value.name))return value;
  return {...structuredClone(value),name:binding.name};
 }
 if(!['income','events'].includes(binding.field)||!Array.isArray(value)||value.length!==binding.rows?.length)return value;
 return value.map((row,index)=>{
  const b=binding.rows[index];if(b.index!==index)return row;
  const out=structuredClone(row);
  if(binding.field==='income'){
   if(out.tier!==b.tier||out.standing!==b.standing)return row;
   if([b.sourceLabel,b.label].includes(out.label))out.label=b.label;
   if([b.sourceSkill,b.skill].includes(out.skill))out.skill=b.skill;
  }else if(out.low===b.low&&out.high===b.high&&[b.sourceDescription,b.description].includes(out.description))out.description=b.description;
  return out;
 });
}

// Scene notes are display-only and bound to the actual native Scene and Note IDs.
export function translateHighElfSceneNotes({value,translation:binding,source,contextCompendium:pack}) {
 const collection=pack?.metadata?.id??pack?.collection;
 if(collection!=='wfrp4e-helf.scenes'||binding?.scene!==source?._id||!Array.isArray(value))return value;
 return value.map(note=>{const b=binding.notes?.[note._id];return b&&[b.source,b.translation].includes(note.text)?{...note,text:b.translation}:note;});
}
