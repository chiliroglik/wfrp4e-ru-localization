"""Portable High Elf translation checks; no paid modules, world data or local build required."""
import json,re
from pathlib import Path
R=Path(__file__).resolve().parents[1];I=R/'translations/expansions'
def load(p):
 def unique(pairs):
  out={}
  for k,v in pairs:
   assert k not in out,('Duplicate JSON key',p,k)
   out[k]=v
  return out
 return json.loads(p.read_text('utf-8-sig'),object_pairs_hook=unique)
def validate():
 blocks={n:load(I/('helf-'+n+'.json'))for n in ['items','actor-bindings','tables','journal-nodes','journal-titles','actor-details','career-fields','display-fields','scenes']}
 hashes={v['sourceSha256']for v in blocks.values()};assert hashes=={'3ad19ce5176cd95fa5e8e9f3d0860ed5d46b864ac15aa53ddb8f3a3df8254d87'}
 assert len(blocks['items']['entries'])==153;actors=blocks['actor-bindings']['entries'];assert len(actors)==38;assert sum(len(a['items']['items'])for a in actors.values())==1190
 pages=blocks['journal-nodes']['entries'];titles=blocks['journal-titles']['entries'];assert len(pages)==149 and len(titles)==12
 for jid,j in titles.items():
  for pid,p in j['pages'].items():assert pages[pid]['journalId']==jid and re.search('[А-Яа-яЁё]',p['name'])
 for row in list(pages.values())+list(blocks['actor-details']['entries'].values()):
  old=row['source'];new=row.get('text',row.get('translation'));assert re.findall('<[^>]+>',old)==re.findall('<[^>]+>',new);assert re.findall(r'\d+',old)==re.findall(r'\d+',new);assert re.findall(r'@\w+\[[^]]+\]',old)==re.findall(r'@\w+\[[^]]+\]',new)
 assert len(blocks['actor-details']['entries'])==23
 tables=blocks['tables']['entries'];assert len(tables)==18;assert sum(len(t['results'])for t in tables.values())==521
 for row in blocks['career-fields']['entries'].values():
  for f,b in row['fields'].items():
   if isinstance(b['source'],list):assert len(b['source'])==len(b['translation'])
   assert re.findall(r'\d+',json.dumps(b['source'],ensure_ascii=False))==re.findall(r'\d+',json.dumps(b['translation'],ensure_ascii=False))
 assert len(blocks['scenes']['entries'])==3
 assert len(load(I/'helf-ui.json'))==15
 return {'pages':149,'items':153,'actors':38,'embeddedItems':1190,'actorNarrativeFields':23,'tableResults':521,'scenes':3}
if __name__=='__main__':print(json.dumps(validate()))
