import test from 'node:test';
import assert from 'node:assert/strict';
import {translateActorDisplay,translateCareerArrayDisplay,translateEffectDisplay,translateHighElfSceneNotes} from '../module/effect-display-translation.mjs';
test('High Elf effects translate labels but preserve script mechanics',()=>{
 const effects=[{_id:'e',name:'Old',system:{scriptData:[{label:'English',script:'return 2',trigger:'prepare'}]}}];
 const binding={collection:'wfrp4e-helf.items',item:'i',effects:{e:{name:'Русский',scripts:[{index:0,sourceLabel:'English',label:'Подпись',script:'return 2',trigger:'prepare'}]}}};
 const translated=translateEffectDisplay(effects,binding,{_id:'i'},{collection:'wfrp4e-helf.items'});
 assert.equal(translated[0].name,'Русский');assert.equal(translated[0].system.scriptData[0].label,'Подпись');assert.equal(translated[0].system.scriptData[0].script,'return 2');assert.equal(effects[0].name,'Old');
 assert.equal(translateEffectDisplay(effects,binding,{_id:'other'},{collection:'wfrp4e-helf.items'}),effects);
});
test('High Elf embedded display values retain manual edits and mismatched IDs',()=>{
 const item={_id:'i',name:'Skill',type:'skill',system:{tests:{value:'Edited'}}};
 const context={value:[item],source:{_id:'a'},translation:{actor:'a',collection:'wfrp4e-helf.actors',items:{i:{type:'skill',sourceName:'Skill',name:'Навык',displayFields:{tests:{source:'Original',translation:'Перевод'}}}}},contextCompendium:{collection:'wfrp4e-helf.actors'}};
 assert.equal(translateActorDisplay(context)[0].system.tests.value,'Edited');assert.equal(translateActorDisplay(context)[0].name,'Навык');
 assert.equal(translateActorDisplay({...context,source:{_id:'other'}}),context.value);
 const b={collection:'wfrp4e-helf.items',item:'c',field:'skills',sourceValues:['Skill'],names:['Навык']};
 assert.deepEqual(translateCareerArrayDisplay({value:['Skill'],translation:b,source:{_id:'c',type:'career'},contextCompendium:{collection:'wfrp4e-helf.items'}}),['Навык']);
});
test('Scene note translation requires pack, Scene ID, Note ID and original text',()=>{
 const value=[{_id:'n',text:'Chrace'},{_id:'edited',text:'My note'}];const context={value,source:{_id:'s'},translation:{scene:'s',notes:{n:{source:'Chrace',translation:'Крейс'},edited:{source:'Old',translation:'Перевод'}}},contextCompendium:{collection:'wfrp4e-helf.scenes'}};
 assert.deepEqual(translateHighElfSceneNotes(context),[{_id:'n',text:'Крейс'},value[1]]);assert.equal(value[0].text,'Chrace');assert.equal(translateHighElfSceneNotes({...context,source:{_id:'wrong'}}),value);
});

import {translateHighElfFolders} from '../module/high-elf-folder-display.mjs';
test('Folder display is ID-bound, memory-only, idempotent and preserves manual names',()=>{
 const make=(id,name,parent=null)=>({id,name,_source:{folder:parent},updateSource(change){this.name=change.name;}});
 const a=make('a','Book'),b=make('b','My custom name'),c=make('c','Book','wrong');const pack={collection:'wfrp4e-helf.journals',folders:[a,b,c]};
 const bindings={entries:{'wfrp4e-helf.journals':Object.fromEntries(['a','b','c'].map(id=>[id,{sourceName:'Book',name:'Книга',parent:null}]))}};
 assert.equal(translateHighElfFolders(pack,bindings),1);assert.equal(a.name,'Книга');assert.equal(b.name,'My custom name');assert.equal(c.name,'Book');assert.equal(translateHighElfFolders(pack,bindings),0);
 assert.equal(translateHighElfFolders({...pack,collection:'other.journals'},bindings),0);
});
