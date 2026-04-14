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
class A { 
    sayHello = () => { console.log('hello') }
}

@injectable()
class TestB {
    method = () => { console.log('Hello from test') }
}

@injectable()
class DevB {
    method = () => { console.log('Hello from dev') }
}

@injectable()
class ProdB {
    method = () => { console.log('Hello from prod') }
}

const container = new TapeDelay({
    // one implementation for all environments
    A,
    // test, dev and prod environment implementations
    B: [TestB, DevB, ProdB]
})

// all types and keys are infered automatically
const aInstance = container.instance('A')
aInstance.sayHello()
const bInstance = container.instance('B')
bInstance.method()
```