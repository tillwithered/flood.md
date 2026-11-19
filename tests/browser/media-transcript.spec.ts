import {test,expect} from '@playwright/test';

test('media transcript seeks to the selected cue and offers a way back to playback',async({page},info)=>{
  await page.goto('/components/media-transcript');
  const transcript=page.locator('.preview-stage .flood-media-transcript');
  const displayed=transcript.getByRole('button',{name:/filter the requests/i});
  const earlier=transcript.getByRole('button',{name:/main service overview/i});
  await expect(displayed).toHaveAttribute('aria-current','time');
  await earlier.press('Enter');
  await expect(earlier).toHaveAttribute('aria-current','time');
  await expect(displayed).not.toHaveAttribute('aria-current','time');
  await transcript.locator('.flood-scroll-area__viewport').hover();
  await page.mouse.wheel(0,100);
  await expect(transcript.getByRole('button',{name:'Follow playback'})).toBeVisible();
  await transcript.getByRole('button',{name:'Follow playback'}).click();
  await expect(transcript.getByRole('button',{name:'Pause following'})).toBeFocused();
  await transcript.screenshot({path:info.outputPath('media-transcript.png')});
});
