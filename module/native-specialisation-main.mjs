import {chooseWind} from './paranoth-wheel.mjs';
import {labelKey,splitLabel,isChoice,coreId,resolveCatalogLabel,choiceRule,skillChoices,missingSkillIds,matchCareerLabels} from './native-specialisation.mjs';
const ID='wfrp4e-ru-overlay',STAMP=Symbol.for(ID+'.specialisations.v1');
let catalog,config;const jobs=new Map();
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function select(title,choices){return foundry.applications.api.DialogV2.input({window:{title},content:'<label>Выберите вариант<select name="choice">'+choices.map(c=>'<option value="'+escape(c.id)+'">'+escape(c.name)+'</option>').join('')+'</select></label>',ok:{label:'Выбрать',callback:(_e,b)=>b.form.elements.choice.value},rejectClose:false});}
function schoolRows(){
 const rows=config.schools.map(s=>({...s,id:s.key,loreName:game.i18n.localize(game.wfrp4e.config.magicLores[s.key]),windName:splitLabel(catalog[s.skillId].name).spec,name:game.i18n.localize(game.wfrp4e.config.magicLores[s.key])+' — '+catalog[s.skillId].name}));
 for(const key of ['hedgecraft','witchcraft','daemonology','necromancy'])if(game.wfrp4e.config.magicLores[key])rows.push({id:key,key,loreName:game.i18n.localize(game.wfrp4e.config.magicLores[key]),name:game.i18n.localize(game.wfrp4e.config.magicLores[key]),skillId:['daemonology','necromancy'].includes(key)?'dBwnAzhe0bvobgbY':null,sourceId:'Compendium.wfrp4e-core.journals.YBVrpUHEjohB1H4f'});
 return rows;
}
async function prepare(data){
 const out=foundry.utils.deepClone(data),rule=choiceRule(out,catalog,config);if(!rule)return out;
 const base=splitLabel(catalog[rule.id].name).base;let selected;
 if(rule.mode==='school'){
  const rows=schoolRows(),key=await chooseWind(rows);if(!key)return null;const school=rows.find(r=>r.id===key);if(!school)return null;
  out.name=base+' ('+game.i18n.localize(game.wfrp4e.config.magicLores[school.key])+')';
  foundry.utils.setProperty(out,'flags.'+ID+'.specialisation',{schemaVersion:1,baseId:rule.id,kind:'school',schoolKey:school.key,sourceId:school.sourceId,skillIds:[...(school.skillId?[school.skillId]:[]),...config.requiredSkillIds]});
 }else if(rule.mode==='skill'){
  const rows=skillChoices(rule.group,catalog);if(!rows.length)throw Error('Нет проверенных вариантов навыка: '+rule.group);
  const key=await select('Выберите специализацию',rows);if(!key)return null;selected=rows.find(r=>r.id===key);if(!selected)return null;
  if(out.type==='skill'){
   const doc=await game.packs.get('wfrp4e-core.items').getDocument(key);if(doc?.type!=='skill')throw Error('Не найден выбранный навык');const replacement=doc.toObject();replacement._id=out._id;replacement.system.advances.value=out.system?.advances?.value??0;replacement._stats={...replacement._stats,compendiumSource:doc.uuid};return replacement;
  }
  out.name=base+' ('+selected.spec+')';foundry.utils.setProperty(out,'system.tests.value',selected.name);
  foundry.utils.setProperty(out,'flags.'+ID+'.specialisation',{schemaVersion:1,baseId:rule.id,kind:'skill',skillSourceId:'Compendium.wfrp4e-core.items.'+selected.id});
 }else{
  const value=await foundry.applications.api.DialogV2.input({window:{title:'Специализация: '+base},content:'<label>Укажите специализацию<input type="text" name="spec" required></label>',ok:{label:'Выбрать',callback:(_e,b)=>b.form.elements.spec.value.trim()},rejectClose:false});if(!value||isChoice(value))return null;
  out.name=base+' ('+value+')';foundry.utils.setProperty(out,'flags.'+ID+'.specialisation',{schemaVersion:1,baseId:rule.id,kind:'text',value});
 }
 return out;
}
async function requiredSkills(item){
 const flag=item.flags?.[ID]?.specialisation,actor=item.actor;if(flag?.kind!=='school'||coreId(item)!==config.arcaneMagicId||!actor?.isOwner)return [];
 const ids=missingSkillIds(actor.items.contents,flag.skillIds,catalog),data=[];
 for(const id of ids){const doc=await game.packs.get('wfrp4e-core.items').getDocument(id);if(doc?.type!=='skill')throw Error('Не найден навык школы: '+id);const row=doc.toObject();delete row._id;row.system.advances.value=0;row._stats={...row._stats,compendiumSource:doc.uuid};data.push(row);}
 return data.length?actor.createEmbeddedDocuments('Item',data,{skipSpecialisationChoice:true,ruOverlaySkipChoices:true}):[];
}
function queueSkills(item){
 const actor=item.actor;if(!actor)return Promise.resolve([]);const previous=jobs.get(actor.id)??Promise.resolve();const next=previous.catch(()=>{}).then(()=>requiredSkills(item));jobs.set(actor.id,next);next.finally(()=>{if(jobs.get(actor.id)===next)jobs.delete(actor.id);}).catch(()=>{});return next;
}
function findApp(element){return [...foundry.applications.instances.values(),...Object.values(ui.windows)].find(app=>{const root=app.element instanceof HTMLElement?app.element:app.element?.[0];return app.actor?.type==='character'&&root?.contains(element);});}
async function purchase(actor,label){
 const resolved=resolveCatalogLabel(label,'talent',catalog,config);if(!resolved)return false;
 const source=await game.packs.get('wfrp4e-core.items').getDocument(resolved.id);if(source?.type!=='talent')throw Error('Не найден талант');
 const data=source.toObject();data.name=resolved.name;data._stats={...data._stats,compendiumSource:source.uuid};const selected=await prepare(data);if(!selected)return true;
 if(actor.itemTypes.talent.some(t=>labelKey(t.name)===labelKey(selected.name))){ui.notifications.info('Этот талант уже есть. Для повышения используйте его кнопку повышения.');return true;}
 const action=await foundry.applications.api.DialogV2.wait({window:{title:'Добавить талант'},content:'<p>'+escape(selected.name)+'</p><p>Покупка: 100 XP. Навыки школы добавляются с 0 повышений.</p>',buttons:[{action:'paid',label:'Купить за 100 XP'},{action:'free',label:game.i18n.localize('Free')},{action:'cancel',label:game.i18n.localize('Cancel')}],rejectClose:false});
 if(!['paid','free'].includes(action))return true;
 const exp=actor.system.details.experience;if(action==='paid'&&exp.total-exp.spent<100){ui.notifications.warn('Недостаточно опыта для покупки таланта.');return true;}
 delete selected._id;const created=await actor.createEmbeddedDocuments('Item',[selected]);if(!created.length)return true;
 await queueSkills(created[0]);
 if(action==='paid'){const fresh=actor.system.details.experience;if(fresh.total-fresh.spent<100){await created[0].delete();throw Error('Опыт изменился во время покупки. Повторите действие.');}const spent=fresh.spent+100;const log=actor.system.addToExpLog(100,created[0].name,spent);await actor.update({'system.details.experience.spent':spent,'system.details.experience.log':log});}
 return true;
}
async function configure(item){const selected=await prepare(item.toObject());if(!selected)return false;await item.update({name:selected.name,'system.tests.value':selected.system.tests.value,flags:selected.flags});await queueSkills(item);return true;}
function decorate(app,element){if(!catalog||!app.actor?.isOwner)return;const root=element instanceof HTMLElement?element:element?.[0];if(!root)return;
 for(const link of root.querySelectorAll('[data-uuid]')){const item=app.actor.items.get(link.dataset.uuid?.split('.').at(-1));if(!item||!choiceRule(item.toObject(),catalog,config)||link.parentElement.querySelector('[data-ru-specialisation]'))continue;const button=document.createElement('button');button.type='button';button.dataset.ruSpecialisation=item.id;button.textContent='Выбрать';button.title='Выбрать школу или специализацию';button.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();configure(item).catch(e=>ui.notifications.error(e.message));});link.parentElement.append(button);}
}
Hooks.once('ready',async()=>{
 for(let n=0;n<600&&(!game.modules.get(ID)?.careerTalentNameReport?.active||!game.modules.get(ID)?.chargenSkillCompatibilityReport?.active);n++)await new Promise(r=>setTimeout(r,100));
 if(game.i18n.lang!=='ru')return;
 [catalog,config]=await Promise.all(['native-core-display-catalog.json','native-specialisation-config.json'].map(f=>fetch('/modules/'+ID+'/data/'+f).then(r=>r.json())));
 const utility=game.wfrp4e.utility;if(utility[STAMP])return;Object.defineProperty(utility,STAMP,{value:true});
 for(const [method,type]of [['findTalent','talent'],['findSkill','skill']]){const original=utility[method];utility[method]=async function(label){const row=resolveCatalogLabel(label,type,catalog,config);if(!row)return original.call(this,label);const doc=await game.packs.get('wfrp4e-core.items').getDocument(row.id);if(doc?.type!==type)return original.call(this,label);if(!row.specialized)return doc;const data=doc.toObject();data.name=row.name;data._stats={...data._stats,compendiumSource:doc.uuid};return new Item.implementation(data);};}
 const proto=CONFIG.Item.documentClass.prototype,originalPre=proto._preCreate;
 proto._preCreate=async function(data,options,user){if(this.actor?.type==='character'&&this.actor.isOwner&&!options.ruOverlaySkipChoices){const selected=await prepare(this.toObject());if(!selected)return false;this.updateSource({name:selected.name,system:selected.system,flags:selected.flags,_stats:selected._stats});}return originalPre.call(this,data,options,user);};
 const actorProto=CONFIG.Actor.dataModels.character.prototype,originalCareer=actorProto.computeCareer;
 actorProto.computeCareer=function(...args){matchCareerLabels(this.currentCareer,this.parent.items.contents,catalog,config);return originalCareer.apply(this,args);};
 document.addEventListener('click',ev=>{const target=ev.target.closest?.('[data-action="clickUntrainedTalent"]');if(!target||ev.button!==0)return;const app=findApp(target);if(!app?.actor?.isOwner)return;const label=target.dataset.name??target.textContent.trim();if(!resolveCatalogLabel(label,'talent',catalog,config))return;ev.preventDefault();ev.stopImmediatePropagation();purchase(app.actor,label).catch(e=>{console.error(ID,e);ui.notifications.error(e.message);});},true);
 Hooks.on('createItem',(item,options,userId)=>{if(userId===game.user.id&&coreId(item)===config.arcaneMagicId&&item.flags?.[ID]?.specialisation)queueSkills(item).catch(e=>ui.notifications.error('Не добавлены навыки школы: '+e.message));});
 for(const hook of ['renderActorSheetWFRP4eCharacter','renderApplicationV2'])Hooks.on(hook,decorate);
 game.modules.get(ID).specialisationCompatibility={active:true,prepare,configure,purchase,queueSkills,catalog,config};
 for(const actor of game.actors)if(actor.type==='character')actor.reset();
});
