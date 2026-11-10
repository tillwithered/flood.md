import {test,expect} from '@playwright/test';
import {chooseSelectOption} from './select-helpers';

test('read-only Autocomplete retains selection and visible focus without editing or opening',async({page})=>{
 await page.goto('/components/autocomplete');const stage=page.locator('.preview-stage'),field=stage.getByRole('combobox',{name:'Team',exact:true});
 await field.fill('Engineering');await field.press('Escape');
 await page.getByRole('checkbox',{name:'Autocomplete prop readOnly',exact:true}).check();
 await expect(field).toHaveAttribute('readonly','');await field.focus();await expect(field).toBeFocused();
 await field.press('ControlOrMeta+A');expect(await field.evaluate((input:HTMLInputElement)=>input.selectionEnd!-input.selectionStart!)).toBeGreaterThan(0);
 await field.pressSequentially('Changed');await expect(field).toHaveValue('Engineering');
 await field.press('ArrowDown');await field.press('Enter');await expect(field).toHaveAttribute('aria-expanded','false');await expect(page.getByRole('listbox')).toHaveCount(0);
 const focused=await field.evaluate(node=>{const group=node.closest('.flood-input-group')!;return{focus:node.matches(':focus-visible'),stroke:getComputedStyle(group).borderTopStyle}});
 expect(focused.focus).toBe(true);expect(focused.stroke).toBe('solid');
});

test('OverflowActions exposes shared shell geometry at each control size',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});await page.goto('/components/overflow-actions');
 const rail=page.locator('.preview-stage').getByRole('toolbar',{name:'Document actions',exact:true});
 for(const size of ['sm','md','lg','xl']){
  await chooseSelectOption(page.getByRole('combobox',{name:'OverflowActions prop size',exact:true}),size);await expect(rail).toHaveAttribute('data-shape','pill');
  const geometry=await rail.evaluate(node=>{const box=node.getBoundingClientRect(),child=node.querySelector('button')!.getBoundingClientRect();return{radius:parseFloat(getComputedStyle(node).borderTopLeftRadius),height:box.height,inline:child.left-box.left,block:child.top-box.top,scroll:node.scrollWidth,width:node.clientWidth}});
  expect(geometry.radius).toBeGreaterThanOrEqual(geometry.height/2);expect(Math.abs(geometry.inline-geometry.block)).toBeLessThanOrEqual(1);expect(geometry.scroll).toBeLessThanOrEqual(geometry.width+1);
 }
 await chooseSelectOption(page.getByRole('combobox',{name:'OverflowActions prop shape',exact:true}),'rounded');await expect(rail).toHaveAttribute('data-shape','rounded');
 const rounded=await rail.evaluate(node=>({radius:parseFloat(getComputedStyle(node).borderTopLeftRadius),height:node.getBoundingClientRect().height}));expect(rounded.radius).toBeLessThan(rounded.height/2);
 await page.goto('/components/toolbar');const toolbar=page.locator('.preview-stage').getByRole('toolbar',{name:'Editor actions',exact:true});await expect(toolbar).toHaveAttribute('data-shape','rounded');await chooseSelectOption(page.getByRole('combobox',{name:'Toolbar prop shape',exact:true}),'pill');await expect(toolbar).toHaveAttribute('data-shape','pill');
});
