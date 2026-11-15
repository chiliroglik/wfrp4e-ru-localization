const ID = 'wfrp4e-ru-overlay';
const SOURCE = 'module:' + ID + ':ru';
const COLLECTIONS = ['wfrp4e-wom.items','wfrp4e-wom.actors','wfrp4e-wom.tables','wfrp4e-wom.journals','wfrp4e-wom.macros','wfrp4e-helf.items','wfrp4e-helf.actors','wfrp4e-helf.tables','wfrp4e-helf.journals','wfrp4e-helf.scenes','wfrp4e-archives3.items', 'wfrp4e-archives3.tables', 'wfrp4e-archives3.actors', 'wfrp4e-archives2.items', 'wfrp4e-archives2.tables', 'wfrp4e-archives2.actors', 'wfrp4e-archives1.actors', 'wfrp4e-archives1.journals', 'wfrp4e-archives2.journals', 'wfrp4e-archives3.journals', 'wfrp4e-core.items', 'wfrp4e-dslf.items', 'wfrp4e-core.journals', 'wfrp4e-core.tables', 'wfrp4e-core.actors'];
Hooks.once('init', () => game.babele.register({module: ID, lang: 'ru', dir: 'translations'}));
Hooks.once('babele.ready', async () => {
  const mod = game.modules.get(ID);
  if (game.i18n.lang !== 'ru') { mod.translationReport = {active: false, reason: 'language-not-ru'}; return; }
  try {
    let changed = false;
    const orders = {};
    for (const collection of COLLECTIONS) {
      const priorities = game.babele.sourcePriority();
      const before = priorities.collections[collection] ?? priorities.global ?? [];
      const order = [...before.filter(s => s !== SOURCE), SOURCE];
      orders[collection] = order;
      if (JSON.stringify(before) !== JSON.stringify(order)) {
        if (!game.user.isGM) { mod.translationReport = {active: false, reason: 'gm-must-set-priority'}; return; }
        await game.babele.setSourcePriority(collection, order, {refresh: false});
        changed = true;
      }
    }
    if (changed) await game.babele.refreshTranslationSources();
    mod.translationReport = {active: true, skillNames: 151, dslfItemNames: 106, dslfDescriptions: 101, coreJournalPages: 272, coreCareerPages: 64, coreCareerRulePages: 2, coreCharacterPages: 10, coreRulesPageBodies: 10, coreDowntimePageBodies: 22, coreBestiaryPageBodies: 9, coreReligionPageBodies: 20, coreMagicPageBodies: 4, coreGMNewPageBodies: 5, coreReiklandPageBodies: 59, coreConsumersPageBodies: 19, coreJournalBodiesComplete: true, coreEffectDisplayNames: 825, coreScriptLabels: 885, coreActorNames: 62, coreSkillJournalPages: 47, coreJournalNames: 12, completeTranslation: false, priorities: orders};
  } catch (error) { mod.translationReport = {errors: [error.message]}; console.error(ID, error); ui.notifications.error(error.message); }
});

import './native-career-talent-names-main.mjs';
import './effect-display-main.mjs';
import './native-income-compat.mjs';
import './native-core-display-cache.mjs';
import './native-chargen-skill-compat.mjs';
import './subspecies-names-main.mjs';

import './package-display-main.mjs';
import './native-specialisation-main.mjs';
