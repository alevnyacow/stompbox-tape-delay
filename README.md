# Tape Delay

Framework-agnostic Dependency Injection container based on Inversify.

## Setup

1. Install `@stompbox/tape-delay` and `reflect-metadata`
2. Import `reflect-metadata` in entrypoint of your application
3. Enable decorators in your tsconfig.json

## Usage example

```ts
import { newContainer } from '@stompbox/tape-delay'

class A { hello = () => 'hello' }

class TestB { method = () => 'test' }
class DevB { method = () => 'dev' }
class ProdB { method = () => 'prod' }

const container = newContainer({
    // one implementation for all environments
    A,
    // test, dev and prod environment implementations
    // (based on process.env.NODE_ENV)
    B: { test: TestB, development: DevB, production: ProdB }
})

// all types and keys are infered automatically
const { a, b } = container.getCtx()

console.log(a.hello())
console.log(b.method())
```

## Custom environment detection

Environment variable `process.env.NODE_ENV` is used by default. This behaviour can be redefined.

```ts
import { newContainer } from '@stompbox/tape-delay'

const randomEnvDetector = () => {
    if (Math.random() > 0.5) {
        return 'more' as const
    }
    return 'less' as const
}

class Less { method = () => 'less' }

class More { method = () => 'more' }

const container = newContainer(randomEnvDetector, {
    testDep: { less: Less, more: More }
})

const { testDep } = container.getCtx()
console.log(testDep.method()) // randomly 'less' or 'more'
```

## Scopes

Scopes can be customized for every entry. There are four options - `Singleton`, `Transient` (default), `Request`, `ConstantValue`. 

```ts
import { newContainer, Scopes } from '@stompbox/tape-delay'

class A { }

const container = newContainer({
    A: {
        test: Scopes.Singleton(A),
        development: Scopes.Transient(A),
        production: Scopes.ConstantValue(new A())
    }
        
})
```

## Using in classes

```ts
import { newContainer, injectField, Instance } from '@stompbox/tape-delay'

class TestA { method = () => 'test' }
class DevA { method = () => 'dev' }
class ProdA { method = () => 'prod' }

class B {
    // all types and contracts are automatically infered
    constructor(
        @injectField<Container>('A')
        private readonly a: Instance<Container, 'A'>
    ) {}

    aMethod = () => this.a.method()
}

const container = newContainer({
    A: { 
        test: TestA,
        development: DevA,
        production: ProdA
    },
    B
})

type Container = typeof container

const { b } = container.getCtx()
console.log(b.aMethod())
```