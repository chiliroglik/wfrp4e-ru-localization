import {effectDisplayConverter, translateActorDisplay, translateCareerArrayDisplay, translateEnterpriseDisplay, translateHighElfSceneNotes} from './effect-display-translation.mjs';
Hooks.once('init', () => {
  game.babele.registerConverters({ruOverlayHighElfSceneNotes:{translate:translateHighElfSceneNotes},ruOverlayEnterpriseField:{translate:translateEnterpriseDisplay}, ruOverlayCareerArray:{translate:translateCareerArrayDisplay, translateEnterpriseDisplay}, ruOverlayActorItems: {translate:translateActorDisplay}, ruOverlayEffects: effectDisplayConverter(() => game.babele.converterRegistry.named('convertEffects'))});
});

// Existing world copies retain their stored scripts; only sheet labels are localized.
let worldBindings,worldActorBindings,displayLabels;
Hooks.once('ready',async()=>{
 worldBindings=await(await fetch('/modules/wfrp4e-ru-overlay/data/effect-display-bindings.json')).json();
 worldActorBindings=await(await fetch('/modules/wfrp4e-ru-overlay/data/bestiary-display-bindings.json')).json();
 displayLabels=(await(await fetch('/modules/wfrp4e-ru-overlay/data/display-labels-extra.json')).json()).labels;
});
function displayWorldEffects(app,element){
 if(!worldBindings||game.i18n.lang!=='ru'||!app.actor)return;
 const root=element instanceof HTMLElement?element:element?.[0];if(!root)return;
 if(app.actor.type==='creature'&&worldActorBindings){
  for(const link of root.querySelectorAll('a[data-uuid]')){
   if(link.dataset.uuid.includes('.ActiveEffect.'))continue;
   const item=fromUuidSync(link.dataset.uuid);if(item?.documentName!=='Item')continue;
   const source=item._stats?.compendiumSource??item.flags?.core?.sourceId??'';
   const match=/^Compendium\.wfrp4e-core\.actors\.(?:Actor\.)?([A-Za-z0-9]+)\.Item\.([A-Za-z0-9]+)$/.exec(source);
   const row=match&&worldActorBindings.actors[match[1]]?.items[match[2]];
   if(row&&link.childElementCount===0&&link.textContent.startsWith(row.sourceName))link.textContent=row.name+link.textContent.slice(row.sourceName.length);
  }
  for(const button of root.querySelectorAll('button')){const key=button.textContent.trim();if(displayLabels?.[key]&&button.childElementCount===0)button.textContent=displayLabels[key];}
 }
 for(const label of root.querySelectorAll('.list-name > a.label[data-uuid]')){
  if(!label.dataset.uuid.includes('.ActiveEffect.'))continue;
  const effect=fromUuidSync(label.dataset.uuid);const item=effect?.parent;
  const id=/^Compendium\.wfrp4e-core\.items\.(?:Item\.)?([A-Za-z0-9]+)$/.exec(item?._stats?.compendiumSource??item?.flags?.core?.sourceId??'')?.[1];
  const parent=worldBindings.items[id];if(!parent)continue;
  let row=parent.effects[effect.id];
  if(!row)row=Object.values(parent.effects).find(r=>[r.sourceName,r.name].includes(effect.name)&&(r.scripts??[]).every(s=>{const actual=effect.system.scriptData?.[s.index];return actual&&(actual.script??null)===s.script&&(actual.trigger??null)===s.trigger;}));
  if(row&&[row.sourceName,row.name].includes(effect.name))label.textContent=row.name;
 }
}
Hooks.on('renderApplicationV2',displayWorldEffects);
Hooks.on('renderActorSheetWFRP4eCharacter',displayWorldEffects);
Hooks.on('renderActorSheetWFRP4eCreature',displayWorldEffects);
