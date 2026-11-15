import {applyPackageDisplay} from './package-display.mjs';
const ID='wfrp4e-ru-overlay';let bindings;
function apply(){if(!bindings||game.i18n.lang!=='ru')return;const result=applyPackageDisplay({modules:game.modules,packs:[...game.packs],folders:[...game.folders]},bindings);game.modules.get(ID).packageDisplayReport={active:true,...result,memoryOnly:true};}
function render(app,element){apply();const root=element instanceof HTMLElement?element:element?.[0];if(!root||!bindings||game.i18n.lang!=='ru')return;
 const swap=(node,old,value)=>{const walk=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);while(walk.nextNode())if(walk.currentNode.nodeValue.trim()===old)walk.currentNode.nodeValue=walk.currentNode.nodeValue.replace(old,value);};
 for(const row of Object.values(bindings.packages)){
  for(const [id,p]of Object.entries(row.packs))for(const entry of root.querySelectorAll('[data-pack="'+id+'"]'))for(const old of [p.sourceLabel,...(p.sourceLabels??[])])swap(entry,old,p.label);
 }
 for(const f of game.folders){if(f.type!=='Compendium')continue;for(const node of root.querySelectorAll('[data-folder-id="'+f.id+'"] > .folder-header'))for(const row of Object.values(bindings.packages))if(f.name===row.folderName)for(const old of row.folderSourceNames)swap(node,old,f.name);}
}
Hooks.once('ready',async()=>{bindings=await(await fetch('/modules/'+ID+'/data/package-display-bindings.json')).json();apply();ui.compendium?.render(false);});
for(const hook of ['babele.ready','babele.reinitialized','createFolder','updateFolder'])Hooks.on(hook,apply);
Hooks.on('renderCompendiumDirectory',render);Hooks.on('renderModuleManagement',render);
Hooks.on('renderApplicationV2',(app,element)=>{if(/Compendium|ModuleManagement/.test(app.constructor.name))render(app,element);});
