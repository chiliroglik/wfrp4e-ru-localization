/** Eight Winds, clockwise from the top; native lore keys are the persisted identity. */
export const WIND_RING=Object.freeze([
 {key:'life',symbol:'ghyran',colour:'#426347'}, {key:'heavens',symbol:'azyr',colour:'#334d78'},
 {key:'shadow',symbol:'ulgu',colour:'#545958'}, {key:'death',symbol:'shyish',colour:'#633c69'},
 {key:'fire',symbol:'aqshy',colour:'#873a30'}, {key:'beasts',symbol:'ghur',colour:'#916037'},
 {key:'light',symbol:'hysh',colour:'#c6c0a4'}, {key:'metal',symbol:'chamon',colour:'#a18b35'}
].map((r,i)=>Object.freeze({...r,angle:22.5+i*45})));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function wheelContent(rows){
 const ring=WIND_RING.map(w=>{const r=rows.find(r=>r.key===w.key);if(!r)return '';const angle=w.angle*Math.PI/180,x=50+34*Math.sin(angle),y=50-34*Math.cos(angle);return `<label class="paranoth-wind" style="--x:${x}%;--y:${y}%" title="${esc(r.name)}"><input type="radio" name="wind" value="${esc(r.id)}"><span class="paranoth-wind-face"><img src="modules/wfrp4e-wom/assets/misc/symbol-${w.symbol}.webp" alt="" loading="lazy"><strong>${esc(r.loreName)}</strong><small>${esc(r.windName)}</small></span></label>`;}).join('');
 const others=rows.filter(r=>!WIND_RING.some(w=>w.key===r.key));
 return `<section class="paranoth-picker"><h2>Колесо Паранота</h2><p class="paranoth-hint">Выберите Ветер магии. Покупка подтверждается после выбора школы.</p><fieldset class="paranoth-wheel"><legend class="paranoth-sr">Восемь Ветров магии</legend><div class="paranoth-centre" aria-hidden="true"><i class="fa-solid fa-sun"></i><span>ВОСЕМЬ<br>ВЕТРОВ</span></div>${ring}</fieldset><div class="paranoth-selection" aria-live="polite">Ветер пока не выбран.</div>${others.length?`<details class="paranoth-other"><summary>Другие магические традиции</summary><div>${others.map(r=>`<label><input type="radio" name="wind" value="${esc(r.id)}">${esc(r.loreName)}</label>`).join('')}</div></details>`:''}<p class="paranoth-hint">Отсутствующие навыки школы добавятся с 0 повышений. Уже имеющиеся сохранятся.</p></section>`;
}
export async function chooseWind(rows){
 if(!document.getElementById('ru-paranoth-css')){const link=document.createElement('link');link.id='ru-paranoth-css';link.rel='stylesheet';link.href='modules/wfrp4e-ru-overlay/paranoth-wheel.css';document.head.append(link);}
 const onRender=(app,element)=>{const root=element instanceof HTMLElement?element:element?.[0];const panel=root?.querySelector('.paranoth-picker');if(!panel||panel.dataset.bound)return;panel.dataset.bound='1';const button=root.querySelector('button[data-action=choose]');if(button)button.disabled=true;
  panel.addEventListener('change',e=>{if(e.target.name!=='wind')return;const selected=rows.find(r=>r.id===e.target.value);if(!selected)return;if(button)button.disabled=false;panel.querySelector('.paranoth-selection').textContent=selected.name;});
  for(const img of panel.querySelectorAll('img'))img.addEventListener('error',()=>img.hidden=true,{once:true});
 };
 return await foundry.applications.api.DialogV2.wait({window:{title:'Колесо Паранота — выбор школы',resizable:true},position:{width:640},classes:['ru-paranoth-dialog'],content:wheelContent(rows),buttons:[{action:'choose',label:'Выбрать школу',callback:(_e,b)=>b.form.elements.wind.value||null},{action:'cancel',label:'Отмена',callback:()=>null}],default:'cancel',rejectClose:false,render:(_event,dialog)=>onRender(dialog,dialog.element)});
}
