import {normalizeNativeCareerTalentNames} from './native-career-talent-names.mjs';
const ID='wfrp4e-ru-overlay',STAMP=Symbol.for(ID+'.nativeCareerTalentNames.v1');
let running;
async function install(){
 if(running)return running;
 running=(async()=>{
  for(let i=0;i<240&&(!globalThis.game?.ready||!game.packs.has('wfrp4e-core.items')||!game.modules.get(ID)?.translationReport?.active);i++)await new Promise(r=>setTimeout(r,250));
  if(!game.ready||game.i18n.lang!=='ru')return;
  const response=await fetch('/modules/'+ID+'/data/native-career-talent-bindings.json');if(!response.ok)throw Error('Не загружены связи карьерных талантов Core');
  const data=await response.json(),index=await game.packs.get('wfrp4e-core.items').getIndex();
  const approved=await(await fetch('/modules/'+ID+'/data/native-core-display-catalog.json')).json();
  const catalog=new Map(Array.from(index).filter(i=>approved[i._id]?.type===i.type).map(i=>[i._id,{...i,name:approved[i._id].name}]));const proto=CONFIG.Actor.dataModels.character.prototype;
  if(proto[STAMP]){proto[STAMP].data=data;proto[STAMP].catalog=catalog;}
  else{
   const state={data,catalog},original=proto.computeCareer;Object.defineProperty(proto,STAMP,{value:state});
   proto.computeCareer=function(...args){normalizeNativeCareerTalentNames(this.currentCareer,state.data,state.catalog);return original.apply(this,args);};
  }
  for(const actor of game.actors)if(actor.type==='character'){actor.reset();if(actor.sheet?.rendered)actor.sheet.render(false);}
  game.modules.get(ID).careerTalentNameReport={active:true,careerBindings:Object.keys(data.careers).length,unresolvedSpecializations:data.unresolved.length};
 })().catch(error=>{console.error(ID+' career talent names',error);game.modules.get(ID).careerTalentNameReport={active:false,error:error.message};}).finally(()=>{running=null;});
 return running;
}
Hooks.once('ready',()=>install());
Hooks.on('babele.ready',()=>{if(game.ready)install();});

Hooks.on('babele.reinitialized',()=>{if(game.ready)install();});
