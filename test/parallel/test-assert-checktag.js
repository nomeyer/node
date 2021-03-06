'use strict';
const common = require('../common');
const assert = require('assert');
const util = require('util');

// Template tag function turning an error message into a RegExp
// for assert.throws()
function re(literals, ...values) {
  let result = literals[0];
  const escapeRE = /[\\^$.*+?()[\]{}|=!<>:-]/g;
  for (const [i, value] of values.entries()) {
    const str = util.inspect(value);
    // Need to escape special characters.
    result += str.replace(escapeRE, '\\$&');
    result += literals[i + 1];
  }
  return common.expectsError({
    code: 'ERR_ASSERTION',
    message: new RegExp(`^${result}$`)
  });
}

// Turn off no-restricted-properties because we are testing deepEqual!
/* eslint-disable no-restricted-properties */

// See https://github.com/nodejs/node/issues/10258
{
  const date = new Date('2016');
  function FakeDate() {}
  FakeDate.prototype = Date.prototype;
  const fake = new FakeDate();

  assert.deepEqual(date, fake);
  assert.deepEqual(fake, date);

  // For deepStrictEqual we check the runtime type,
  // then reveal the fakeness of the fake date
  assert.throws(() => assert.deepStrictEqual(date, fake),
                re`${date} deepStrictEqual Date {}`);
  assert.throws(() => assert.deepStrictEqual(fake, date),
                re`Date {} deepStrictEqual ${date}`);
}

{  // At the moment global has its own type tag
  const fakeGlobal = {};
  Object.setPrototypeOf(fakeGlobal, Object.getPrototypeOf(global));
  for (const prop of Object.keys(global)) {
    fakeGlobal[prop] = global[prop];
  }
  assert.deepEqual(fakeGlobal, global);
  // Message will be truncated anyway, don't validate
  assert.throws(() => assert.deepStrictEqual(fakeGlobal, global),
                assert.AssertionError);
}

{ // At the moment process has its own type tag
  const fakeProcess = {};
  Object.setPrototypeOf(fakeProcess, Object.getPrototypeOf(process));
  for (const prop of Object.keys(process)) {
    fakeProcess[prop] = process[prop];
  }
  assert.deepEqual(fakeProcess, process);
  // Message will be truncated anyway, don't validate
  assert.throws(() => assert.deepStrictEqual(fakeProcess, process),
                assert.AssertionError);
}
/* eslint-enable */
