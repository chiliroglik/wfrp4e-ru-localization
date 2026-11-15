import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {labelKey,isChoice,resolveCatalogLabel,choiceRule,missingSkillIds,matchCareerLabels,skillChoices} from '../../module/native-specialisation.mjs';
import {applyPackageDisplay} from '../../module/package-display.mjs';
const load=p=>JSON.parse(readFileSync(new URL('../../'+p,import.meta.url),'utf8'));
const catalog=load('module/data/native-core-display-catalog.json'),config=load('module/data/native-specialisation-config.json');
test('case and parenthesis whitespace do not affect canonical skill resolution',()=>{
 assert.equal(labelKey(' Концентрация  ( АКШИ ) '),labelKey('концентрация (акши)'));
 assert.equal(resolveCatalogLabel('КОНЦЕНТРАЦИЯ (акши)','skill',catalog,config).id,'gh91jaxzTBgbMoi5');
 assert.equal(resolveCatalogLabel('LANGUAGE (magick)','skill',catalog,config).id,'e3McIND4Rrsn5cE6');
 assert.equal(resolveCatalogLabel('ЯЗЫК (МАГИЧЕСКИЙ)','skill',catalog,config).id,'e3McIND4Rrsn5cE6');
});
test('skill-linked talent specialization uses canonical Russian skill, preserves variants',()=>{
 const row=resolveCatalogLabel('ЭРУДИТ (MAGICK)','talent',catalog,config);assert.equal(row.id,'580fwhKfOZJFxMID');assert.equal(row.name,'Кладезь знаний (магия)');
 assert.equal(resolveCatalogLabel('МАСТЕР-РЕМЕСЛЕННИК (SMITH)','talent',catalog,config).name,'Мастер своего дела (кузнец)');
 assert.equal(resolveCatalogLabel('unknown unknown','talent',catalog,config),null);
});
test('choice placeholders are case independent; selected specs are not placeholders',()=>{
 for(const v of [null,'','Any Arcane Lore','ANY COLOUR','любой Ветер','Любая Стихия','на выбор'])assert.equal(isChoice(v),true,v);
 for(const v of ['Огонь','Aqshy','кузнец'])assert.equal(isChoice(v),false,v);
 const data={type:'talent',name:'ШКОЛА МАГИИ (ЛЮБАЯ СТИХИЯ)',_stats:{compendiumSource:'Compendium.wfrp4e-core.items.3O9clK7LGyuLTHPW'}};assert.equal(choiceRule(data,catalog,config).mode,'school');
 assert.equal(choiceRule({...data,_stats:{compendiumSource:'Compendium.foreign.items.3O9clK7LGyuLTHPW'}},catalog,config),null);
});
test('school required skills are ID-bound and no duplicate or XP change is planned',()=>{
 for(const school of config.schools){assert.equal(catalog[school.skillId].type,'skill');assert.match(school.sourceId,/^Compendium\.wfrp4e-wom\.journals\.[A-Za-z0-9]{16}$/);}
 const ids=['gh91jaxzTBgbMoi5',...config.requiredSkillIds];assert.equal(ids.length,3);
 const owned=[{type:'skill',name:'ЯЗЫК (МАГИЧЕСКИЙ)',system:{advances:{value:12}}}];const before=JSON.stringify(owned);assert.deepEqual(missingSkillIds(owned,ids,catalog),['gh91jaxzTBgbMoi5','ZQzRZkB9JK1CveMW']);assert.equal(JSON.stringify(owned),before);
});
test('career normalization is memory-only and matches case and generic choices',()=>{
 const c={system:{skills:['ЯЗЫК (МАГИЧЕСКИЙ)'],talents:['Школа магии (любая Стихия)']},_source:{system:{talents:['unchanged']}}};const items=[{type:'skill',name:'Язык (магический)'},{type:'talent',name:'Школа магии (Огонь)',_stats:{compendiumSource:'Compendium.wfrp4e-core.items.3O9clK7LGyuLTHPW'}}];assert.equal(matchCareerLabels(c,items,catalog,config),2);assert.deepEqual(c.system.talents,['Школа магии (Огонь)']);assert.deepEqual(c._source.system.talents,['unchanged']);assert.equal(matchCareerLabels(c,items,catalog,config),0);
 assert.ok(skillChoices('Lore',catalog).some(i=>i.id==='ZQzRZkB9JK1CveMW'));
});
test('package labels survive original initialization names and preserve custom folders',()=>{
 const row={sourceTitle:'WFRP4e - High Elf Bundle',title:'WFRP4e — Высшие эльфы',folderName:'Высшие эльфы',folderSourceNames:['High Elf Bundle'],packs:{'wfrp4e-helf.scenes':{sourceLabel:'Scenes (High Elf Bundle)',label:'Сцены (Высшие эльфы)'}}};const bindings={schemaVersion:1,packages:{'wfrp4e-helf':row}};
 const mod={title:row.sourceTitle,updateSource(v){Object.assign(this,v);}},pack={collection:'wfrp4e-helf.scenes',folder:'f',metadata:{packageName:'wfrp4e-helf',label:row.packs['wfrp4e-helf.scenes'].sourceLabel}},folder={id:'f',type:'Compendium',name:'High Elf Bundle',updateSource(v){Object.assign(this,v);}};const ctx={modules:new Map([['wfrp4e-helf',mod]]),packs:[pack],folders:[folder]};
 assert.deepEqual(applyPackageDisplay(ctx,bindings),{modules:1,packs:1,folders:1});assert.equal(folder.name,'Высшие эльфы');assert.deepEqual(applyPackageDisplay(ctx,bindings),{modules:0,packs:0,folders:0});
 folder.name='High Elf Bundle';pack.metadata.label='Scenes (High Elf Bundle)';assert.equal(applyPackageDisplay(ctx,bindings).folders,1);folder.name='My custom folder';applyPackageDisplay(ctx,bindings);assert.equal(folder.name,'My custom folder');
});
