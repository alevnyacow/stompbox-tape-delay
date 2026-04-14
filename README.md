# @stompbox/tape-delay

Plug-and-play DI based on Inversify.

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