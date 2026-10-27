import test from 'node:test';
import assert from 'node:assert/strict';
import {consumerEnvironment} from '../scripts/consumer-env.mjs';
test('isolated consumer retains container browser path but no publisher credentials',()=>{
  assert.deepEqual(consumerEnvironment({PATH:'/bin',PLAYWRIGHT_BROWSERS_PATH:'/ms-playwright',NODE_AUTH_TOKEN:'secret',GITHUB_TOKEN:'secret',RAILWAY_TOKEN:'secret',NPM_CONFIG_USERCONFIG:'publisher-config'}),{PATH:'/bin',PLAYWRIGHT_BROWSERS_PATH:'/ms-playwright'});
});
