# Tape Delay

Plug-and-play Dependency Injection container based on Inversify.

## Setup

1. Install `@stompbox/tape-delay` and `reflect-metadata`
2. Import `reflect-metadata` in entrypoint of your application
3. Enable decorators in your tsconfig.json

## Usage example

```ts
import { TapeDelay, injectable } from '@stompbox/tape-delay'

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

// all types and keys are infered automatically
const aInstance = container.instance('A')
console.log(aInstance.hello())
const bInstance = container.instance('B')
console.log(bInstance.method())
```

## Environment detection

Environment variable `process.env.NODE_ENV` is used by default. This behaviour can be redefined with optional second parameter in `TapeDelay` constructor. 

```ts
import { TapeDelay, EnvironmentDetector } from '@stompbox/tape-delay'

const randomEnvDetector: EnvironmentDetector = () => {
    if (Math.random() > 0.5) {
        return 'test'
    }
    if (Math.random() > 0.5) {
        return 'development'
    }
    return 'production'
}

const container = new TapeDelay({}, randomEnvDetector)
```

## Scopes

Scopes can be customized for every entry. There are four options - `Singleton`, `Transient` (default), `Request`, `ConstantValue`. 

```ts
import { TapeDelay, injectable, Scopes } from '@stompbox/tape-delay'

@injectable()
class A { }

@injectable()
class B { }

const container = new TapeDelay({
    A: [
        // singleton scope in test
        Scopes.Singleton(A),
        // transient scope in development
        Scopes.Transient(A),
        // request scope on production
        Scopes.Request(A)
    ],
    // constant value for all environments
    B: Scopes.ConstantValue(new B())
})
```