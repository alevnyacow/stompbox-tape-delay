import { expect, test } from '@rstest/core';
import { TapeDelay, injectable, inject } from '../src/index';

@injectable()
class A { hello = () => 'hello' }

@injectable()
class TestB { method = () => 'test' }

@injectable()
class DevB { method = () => 'dev' }

@injectable()
class ProdB { method = () => 'prod' }

class WithInject {
  public constructor(@inject<typeof container>('A') private readonly a: A) {

  }

  hello = () => this.a.hello()
}

const container = new TapeDelay({
    // one implementation for all environments
    A,
    // test, dev and prod environment implementations
    B: [TestB, DevB, ProdB],
    WithInject
})

test('happy path', () => {
  const aInstance = container.instance('A')
  expect(aInstance.hello()).toBe('hello')
  const bInstance = container.instance('B')
  expect(bInstance.method()).toBe('test')
  const a = container.instance('WithInject')
  expect(a.hello()).toBe('hello')
});
