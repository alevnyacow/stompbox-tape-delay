import { expect, test } from '@rstest/core';
import { TapeDelay, injectable } from '../src/index';

@injectable()
class A { hello = () => 'hello' }

@injectable()
class TestB { method = () => 'test' }

@injectable()
class DevB { method = () => 'dev' }

@injectable()
class ProdB { method = () => 'prod' }

const container = new TapeDelay({
    // one implementation for all environments
    A,
    // test, dev and prod environment implementations
    B: [TestB, DevB, ProdB]
})

test('happy path', () => {
  const aInstance = container.instance('A')
  expect(aInstance.hello()).toBe('hello')
  const bInstance = container.instance('B')
  expect(bInstance.method()).toBe('test')
});
