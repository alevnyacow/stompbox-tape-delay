import { BindInWhenOnFluentSyntax, Container } from "inversify";
import { inject as rawInject } from 'inversify'
export { injectable } from 'inversify'

type Environment = 'test' | 'development' | 'production'

type ClassEntry<T> = new (...args: any[]) => T
type ConstantValueEntry<T> = { constantValue: T }

type PublicFields<T> = { [k in keyof T]: T[k] }

type EntryDescription<T> = ClassEntry<T> | ConstantValueEntry<T> | [ClassEntry<T>, (x: BindInWhenOnFluentSyntax<unknown>) => any]

type Entry<T> = [EntryDescription<T>, EntryDescription<T>, EntryDescription<T>] | EntryDescription<T>

export type Entries = Record<string, Entry<unknown>>
export type EnvironmentDetector = () => Environment

type EntryType<T> = T extends Entry<infer G> ? PublicFields<G> : never 

const Singleton = <T>(EntryClass: ClassEntry<T>): EntryDescription<T> => [EntryClass, x => x.inSingletonScope()] as const
const Transient = <T>(EntryClass: ClassEntry<T>): EntryDescription<T> => [EntryClass, x => x.inTransientScope()] as const
const Request = <T>(EntryClass: ClassEntry<T>): EntryDescription<T> => [EntryClass, x => x.inRequestScope()] as const
const ConstantValue = <T>(value: T): ConstantValueEntry<T> => ({ constantValue: value })

export const Scope = { Singleton, Transient, Request, ConstantValue }

/**
 * Tape Delay container.
 * 
 * @example
 * ```ts
 * import { TapeDelay, injectable } from '@stompbox/tape-delay'
 * 
 * @injectable()
 * class A {}
 * 
 * const container = new TapeDelay({ A })
 * ```
 */
export class TapeDelay<T extends Entries> {
    private readonly key = Math.random().toString()

    constructor(private readonly entries: T, private readonly getEnvironment?: EnvironmentDetector) {}

    private container = (environment: Environment) =>{
        const globalContainer = globalThis as any
        let container: Container;

        const containerKey = `tape-delay-${environment}-${this.key}`

        const index = () => {
            switch (environment) {
                case 'test':
                    return 0
                case 'development':
                    return 1
                default:
                    return 2
            }
        }

        if (!globalContainer[containerKey]) {
            globalContainer[containerKey] = new Container()
            container = globalContainer[containerKey] as Container

            for (const rule in this.entries) {
                const ruleContentRaw = this.entries[rule as keyof typeof this.entries]
                if ('constantValue' in ruleContentRaw) {
                    container.bind(rule).toConstantValue(ruleContentRaw.constantValue)
                    continue
                }

                const ruleContent =
                    Array.isArray(ruleContentRaw) && ruleContentRaw.length === 3
                        ? ruleContentRaw[index()]
                        : ruleContentRaw

                if (Array.isArray(ruleContent)) {
                    const [Entry, builder] = ruleContent
                    // @ts-expect-error
                    builder(container.bind(rule).to(Entry))
                    continue
                }
                if ('constantValue' in ruleContent) {
                    container.bind(rule).toConstantValue(ruleContent.constantValue)
                    continue
                }
                container.bind(rule).to(ruleContent)
            }
        }

        container = globalContainer[containerKey]
        return container
    }

    instance = <E extends keyof T>(entryName: E) => {
        const environment = this.getEnvironment ? this.getEnvironment() : process.env.NODE_ENV as Environment
        const container = this.container(environment)
        return container.get<EntryType<T[E]>>(entryName.toString())
    } 
}


type Keys<T> = T extends TapeDelay<infer GG> ? keyof GG : never

export const inject = <ContainerType>(entryKey: Keys<ContainerType>) => rawInject(entryKey)