import test from 'node:test';
import assert from 'node:assert/strict';
import {restoredJuniorProgress,juniorMissions,juniorHindi,storyCards,storyOrder} from '../junior-data.js';
test('saved child progress ignores corrupt entries and resumes the next discovery',()=>{
  assert.deepEqual(restoredJuniorProgress([0,0,2,8,'1',null]),{completed:[0,2],next:1});
  assert.deepEqual(restoredJuniorProgress(null),{completed:[],next:0});
  assert.equal(restoredJuniorProgress([0,1,2,3]).next,0);
});
test('each language covers four discoveries and story cards cover the Sun-like sequence',()=>{
  assert.equal(juniorMissions.length,4);assert.equal(juniorHindi.length,4);
  for(const data of [...juniorMissions,...juniorHindi])assert.ok(data.title&&data.say&&data.hint&&data.success);
  for(const key of storyOrder)assert.equal(storyCards.filter(card=>card.key===key).length,1);
  assert.deepEqual(storyOrder.map(key=>storyCards.find(card=>card.key===key).progress),[0,.4,.6,1]);
});
