"""Validate and package only the installable module; no private Foundry files needed."""
from pathlib import Path,PurePosixPath
import hashlib,json,re,subprocess,shutil,zipfile
ROOT=Path(__file__).resolve().parents[1];MODULE=ROOT/'module'
def load(p):return json.loads(p.read_text('utf-8-sig'))
def validate():
 m=load(MODULE/'module.json');assert m['id']=='wfrp4e-ru-overlay';assert m['url']=='https://github.com/chiliroglik/wfrp4e-ru-localization'
 assert m['manifest']==m['url']+'/releases/download/v'+m['version']+'/module.json'
 assert m['download']==m['url']+'/releases/download/v'+m['version']+'/wfrp4e-ru-overlay-'+m['version']+'.zip'
 assert m['compatibility']['minimum']=='14';assert m['compatibility']['verified']=='14.368'
 for relative in m['esmodules']+m.get('styles',[])+[v['path']for v in m.get('languages',[])]:assert(MODULE/relative).is_file(),relative
 node=shutil.which('node')or 'C:/Program Files/nodejs/node.exe'
 for p in MODULE.rglob('*'):
  if not p.is_file():continue
  rel=p.relative_to(MODULE);assert not any(x in rel.parts for x in ['worlds','systems','backups','.git','node_modules'])
  if p.suffix=='.json':load(p)
  if p.suffix in ['.js','.mjs']:
   subprocess.run([node,'--check',str(p)],check=True)
   for relative in re.findall(r"(?:from\s*|import\s*)['\"](\./[^'\"]+)['\"]",p.read_text('utf-8-sig')):assert(p.parent/relative).is_file(),(rel,relative)
 baseline=load(ROOT/'docs/EXTRACTION.json')['translationHashes'];assert len(baseline)==25
 for name,h in baseline.items():assert hashlib.sha256((MODULE/'translations'/name).read_bytes()).hexdigest()==h,name
 return m

def package():
 m=validate();out=ROOT/'dist';out.mkdir(exist_ok=True);archive=out/('wfrp4e-ru-overlay-'+m['version']+'.zip')
 with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED)as z:
  for p in sorted(MODULE.rglob('*')):
   if p.is_file():z.write(p,m['id']+'/'+p.relative_to(MODULE).as_posix())
 with zipfile.ZipFile(archive)as z:
  assert z.testzip()is None;assert json.loads(z.read(m['id']+'/module.json'))==m
 shutil.copyfile(MODULE/'module.json',out/'module.json');shutil.copyfile(ROOT/'docs/RELEASE_NOTES.md',out/'RELEASE_NOTES.md')
 assets=[archive,out/'module.json',out/'RELEASE_NOTES.md'];(out/'SHA256SUMS.txt').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name+'\n'for p in assets),encoding='utf8')
 report={'version':m['version'],'archiveBytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'repository':m['url'],'manifest':m['manifest'],'translationsPreserved':25};(out/'VALIDATION.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8');print(json.dumps(report))
if __name__=='__main__':package()
