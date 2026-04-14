import { expect, test } from '@rstest/core';
import { TapeDelay } from '../src/index';

class A {
  sup = () => 'sup'
}

const a = new TapeDelay({
  A
})

test('happy path', () => {
  const aInstance = a.instance('A')
  expect(aInstance.sup()).toBe('sup')
});
