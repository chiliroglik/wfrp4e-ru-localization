import {translateSubspeciesNames} from './subspecies-names.mjs';
const ID='wfrp4e-ru-overlay';let bindings;
function apply(){
 if(!bindings||game.i18n.lang!=='ru'||!game.wfrp4e?.config)return;
 const result=translateSubspeciesNames(game.wfrp4e.config,bindings);
 game.modules.get(ID).subspeciesNameReport={active:true,...result,namesOnly:true};
}
Hooks.once('ready',async()=>{
 const response=await fetch('/modules/'+ID+'/data/subspecies-name-bindings.json');if(!response.ok)throw Error('Не загружены названия подрас');bindings=await response.json();apply();
});
Hooks.on('babele.ready',apply);
Hooks.on('babele.reinitialized',apply);
Hooks.on('renderSpeciesStage',(app,element)=>{
 apply();const root=element instanceof HTMLElement?element:element?.[0];
 const parent=app.context?.species;if(!root||!parent)return;
 for(const link of root.querySelectorAll('[data-subspecies]')){
  const row=bindings?.subspecies[parent]?.[link.dataset.subspecies];
  if(row&&[row.sourceName,row.name].includes(link.textContent.trim()))link.textContent=row.name;
 }
});
