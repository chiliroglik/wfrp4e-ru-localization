import {translateHighElfFolders} from './high-elf-folder-display.mjs';
// Core collections may be replaced after ready; patch their shared public methods.
const ID='wfrp4e-ru-overlay',STAMP=Symbol.for(ID+'.coreDisplayCache.v2');
export async function installCoreDisplayCache(){
 for(let n=0;n<600&&(!game.babele||!game.packs?.has('wfrp4e-core.items'));n++)await new Promise(r=>setTimeout(r,100));
 if(game.i18n.lang!=='ru'||!game.babele)return;
 const pack=game.packs.get('wfrp4e-core.items');if(!pack)return;
 const proto=Object.getPrototypeOf(pack);if(proto[STAMP])return;Object.defineProperty(proto,STAMP,{value:true});
 const collections=new Set(['wfrp4e-helf.items','wfrp4e-helf.actors','wfrp4e-helf.tables','wfrp4e-helf.journals','wfrp4e-helf.scenes','wfrp4e-wom.items','wfrp4e-wom.actors','wfrp4e-wom.tables','wfrp4e-wom.journals','wfrp4e-wom.macros','wfrp4e-core.items','wfrp4e-core.actors','wfrp4e-archives1.actors','wfrp4e-archives2.items','wfrp4e-archives2.tables','wfrp4e-archives2.actors','wfrp4e-archives1.journals','wfrp4e-archives2.journals','wfrp4e-archives3.journals','wfrp4e-archives3.items','wfrp4e-archives3.tables','wfrp4e-archives3.actors']);let refreshing,repaired=0;
 let highElfFolders;
 async function localizeFolders(pack){
  if(game.i18n.lang!=='ru'||!pack.collection.startsWith('wfrp4e-helf.'))return;
  highElfFolders??=fetch('/modules/wfrp4e-ru-overlay/data/helf-folders.json').then(r=>{if(!r.ok)throw Error('High Elf folder labels unavailable');return r.json();});
  translateHighElfFolders(pack,await highElfFolders);
 }
 async function ensure(collection){
  if(!collections.has(collection)||game.babele.isTranslated(collection))return;
  if(!refreshing)refreshing=game.babele.refreshTranslationSources().finally(()=>{refreshing=null;});
  await refreshing;
  if(!game.modules.get(ID)?.translationReport?.active)Hooks.callAll('babele.ready');
 }
 function localize(doc,collection){
  if(!collections.has(collection)||!doc||doc.getFlag('babele','translated'))return doc;
  const translated=game.babele.translate(collection,doc.toObject());
  if(translated?._id===doc.id&&translated.flags?.babele?.translated){doc.updateSource(translated);repaired++;}
  game.modules.get(ID).coreDisplayCacheReport={active:true,repaired,memoryOnly:true};return doc;
 }
 const index=proto.getIndex;
 proto.getIndex=async function(...args){const value=await index.apply(this,args);await localizeFolders(this);return value;};
 const one=proto.getDocument,many=proto.getDocuments;
 proto.getDocument=async function(...args){await ensure(this.collection);await localizeFolders(this);return localize(await one.apply(this,args),this.collection);};
 proto.getDocuments=async function(...args){await ensure(this.collection);await localizeFolders(this);return(await many.apply(this,args)).map(d=>localize(d,this.collection));};
 game.modules.get(ID).coreDisplayCacheReport={active:true,repaired,memoryOnly:true};
 await ensure('wfrp4e-core.items');
}
Hooks.once('ready',installCoreDisplayCache);
