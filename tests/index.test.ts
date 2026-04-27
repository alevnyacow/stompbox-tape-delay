import { expect, test } from '@rstest/core';
import { newContainer, injectField, Instance } from '../src/index'

class A { hello = () => 'hello' as const }

class TestB { method = () => 'test' }

class DevB { method = () => 'dev' }

class ProdB { method = () => 'prod' }

class WithInject {
  public constructor(@injectField<Container>('A') private readonly a: Instance<Container, 'A'>) {

  }

  hello = () => this.a.hello()
}


const container = newContainer({
    // one implementation for all environments
    A,
    // test, dev and prod environment implementations
    B: { test: TestB, development: DevB, production: ProdB },
    WithInject
})

type Container = typeof container

test('happy path', () => {
  const ctx = container.getCtx()
  expect(ctx.a.hello()).toBe('hello')
  expect(ctx.b.method()).toBe('test')
  expect(ctx.withInject.hello()).toBe('hello')
});
