// Restore required Income skill cards lost by native chargen's zero-advance filter.
const ID='wfrp4e-ru-overlay',STAMP=Symbol.for(ID+'.incomeCompatibility.v1');
function sourceId(item){return /^Compendium\.wfrp4e-core\.items\.(?:Item\.)?([A-Za-z0-9]+)$/.exec(item?._stats?.compendiumSource??item?.flags?.core?.sourceId??'')?.[1];}
Hooks.once('ready',async()=>{
 for(let i=0;i<240&&!game.modules.get(ID)?.careerTalentNameReport?.active;i++)await new Promise(r=>setTimeout(r,250));
 if(game.i18n.lang!=='ru')return;
 const bindings=await(await fetch('/modules/'+ID+'/data/native-income-bindings.json')).json();
 async function required(career,items){
  const id=sourceId(career)??(bindings[career?._id]?career._id:null),rows=bindings[id]??[],missing=[];
  for(const row of rows){
   if(items.some(i=>i.type==='skill'&&(sourceId(i)===row.skillId||i.name===row.name||i.name===row.original)))continue;
   const doc=await game.packs.get('wfrp4e-core.items').getDocument(row.skillId);if(doc?.type!=='skill')continue;
   const data=doc.toObject();delete data._id;data.name=row.name;data.system.advances.value=0;
   data._stats={...data._stats,compendiumSource:doc.uuid};missing.push(data);
  }return missing;
 }
 const proto=CONFIG.Actor.documentClass.prototype;
 if(!proto[STAMP]){
  const original=proto.createEmbeddedDocuments;Object.defineProperty(proto,STAMP,{value:true});
  proto.createEmbeddedDocuments=async function(type,data,options={}){
   if(type==='Item'&&this.type==='character'&&this.items.size===0&&options.skipSpecialisationChoice===true){
    const career=data.find(i=>i.type==='career'&&i.system?.current?.value);
    if(career){const extra=await required(career,data);if(extra.length)data=[...data,...extra];}
   }return original.call(this,type,data,options);
  };
 }
 document.addEventListener('click',async ev=>{
  const target=ev.target.closest?.('[data-action="rollIncome"]');if(!target)return;
  const apps=[...foundry.applications.instances.values(),...Object.values(ui.windows)];
  const app=apps.find(a=>a.actor?.type==='character'&&a.element?.contains?.(target));if(!app)return;
  const career=app.actor.items.get(target.dataset.careerId)??app.actor.system.currentCareer;
  const rows=bindings[sourceId(career)]??[];
  const missing=rows.filter(row=>!app.actor.itemTypes.skill.some(i=>sourceId(i)===row.skillId||i.name===row.name||i.name===row.original));if(!missing.length)return;
  ev.preventDefault();ev.stopImmediatePropagation();
  const accepted=await foundry.applications.api.DialogV2.confirm({window:{title:'Навык заработка'},content:'<p>У персонажа отсутствует навык заработка: '+missing.map(r=>r.name).join(', ')+'. Добавить карточку с 0 повышений? Опыт не расходуется.</p>'});
  if(!accepted)return;
  const extra=await required(career,app.actor.items.contents);if(extra.length)await app.actor.createEmbeddedDocuments('Item',extra,{skipSpecialisationChoice:true});
  ui.notifications.info('Навык заработка добавлен без повышений. Нажмите заработок ещё раз.');
 },true);
 game.modules.get(ID).incomeCompatibilityReport={active:true,careers:Object.keys(bindings).length,zeroAdvancesOnly:true};
});
