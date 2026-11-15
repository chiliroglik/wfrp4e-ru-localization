// Resolve native chargen labels through the audited Core ID catalog.
const ID='wfrp4e-ru-overlay',STAMP=Symbol.for(ID+'.chargenSkillCompat.v1');
const key=s=>String(s??'').replace(/\s+/g,' ').trim().toLocaleLowerCase('ru');
export function resolveSkillLabel(label,catalog){
 const skills=Object.entries(catalog).filter(([,r])=>r.type==='skill');
 const exact=skills.filter(([,r])=>[r.sourceName,r.name].some(n=>key(n)===key(label)));
 if(exact.length===1)return {id:exact[0][0],name:exact[0][1].name,specialized:false};
 const match=/^(.*?)\s*\((.*?)\)$/.exec(label);if(!match)return null;
 const bases=skills.filter(([,r])=>[r.sourceName,r.name].some(n=>key(n?.replace(/\s*\([^)]*\)\s*$/,''))===key(match[1])));
 const generic=bases.find(([,r])=>/\(\s*\)$/.test(r.sourceName))??bases.find(([,r])=>!r.sourceName.includes('('));if(!generic)return null;
 const specs={Magic:'магия',Magick:'магический',Any:'любой','Any Color':'любой ветер','Any Colour':'любой ветер'};
 return {id:generic[0],name:generic[1].name.replace(/\s*\([^)]*\)\s*$/,'')+' ('+(specs[match[2]]??match[2])+')',specialized:true};
}
async function install(){
 for(let n=0;n<600&&(!game.wfrp4e?.apps?.CharGenWfrp4e||!game.modules.get(ID)?.careerTalentNameReport?.active);n++)await new Promise(r=>setTimeout(r,100));
 if(game.i18n.lang!=='ru'||!game.wfrp4e?.utility)return;
 const catalog=await(await fetch('/modules/'+ID+'/data/native-core-display-catalog.json')).json();
 const utility=game.wfrp4e.utility,mod=game.modules.get(ID);if(utility[STAMP])return;Object.defineProperty(utility,STAMP,{value:true});
 const originalFind=utility.findSkill;
 utility.findSkill=async function(name){
  const row=resolveSkillLabel(name,catalog);
  if(row){const item=await game.packs.get('wfrp4e-core.items').getDocument(row.id);if(item?.type==='skill'){
   if(!row.specialized)return item;
   const data=item.toObject();data.name=row.name;data.effects=[];data._stats={...data._stats,compendiumSource:item.uuid};return new Item.implementation(data);
  }}
  try{return await originalFind.call(this,name);}catch(error){mod.chargenSkillCompatibilityReport.lastMissingSkill=String(name);throw new Error('Не найден навык «'+name+'».');}
 };
 const proto=game.wfrp4e.apps.CharGenWfrp4e.prototype,original=proto._updateObject;
 proto._updateObject=async function(...args){
  const normalized={};
  for(const [name,value]of Object.entries(this.data?.skillAdvances??{})){
   let row=resolveSkillLabel(name,catalog);
   if(/^(?:Channelling|Концентрация)\s*\((?:Any Colou?r|любой ветер)\)$/i.test(name)&&Number(value)>0){
    const winds=new Set(['Aqshy','Azyr','Chamon','Ghur','Ghyran','Hysh','Shyish','Ulgu']);
    const choices=Object.entries(catalog).filter(([,r])=>r.type==='skill'&&winds.has(/^Channelling \(([^)]+)\)$/.exec(r.sourceName)?.[1]));
    const chosen=await foundry.applications.api.DialogV2.input({window:{title:'Выберите ветер магии'},content:'<select name="wind">'+choices.map(([id,r])=>'<option value="'+id+'">'+r.name+'</option>').join('')+'</select>',ok:{label:'Выбрать',callback:(_event,button)=>button.form.elements.wind.value},rejectClose:false});
    if(!chosen)return;row={id:chosen,name:catalog[chosen].name};
   }
   const translated=row?.name??name;
   normalized[translated]=Object.hasOwn(normalized,translated)?Number(normalized[translated])+Number(value):value;
  }
  this.data.skillAdvances=normalized;return original.apply(this,args);
 };
 // Archives III's Russian NoSkill string accidentally shadows the native generic error.
 foundry.utils.setProperty(game.i18n.translations,'ERROR.NoSkill','Не найден навык «{skill}».');
 mod.chargenSkillCompatibilityReport={active:true,skills:Object.values(catalog).filter(r=>r.type==='skill').length,experienceChanged:false};
}
Hooks.once('ready',install);
