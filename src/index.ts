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
 * Tape Delay container. Takes entries and optional environment detector in the constructor.
 * 
 * @example
 * ```ts
 * import { TapeDelay } from '@stompbox/tape-delay'
 * import { UserService } from '@/services/user.service'
 * 
 * export const container = new TapeDelay({ UserService })
 * 
 * const userService = container.instance('UserService')
 * ```
 */
export class TapeDelay<T extends Entries> {
    private readonly key = Math.random().toString()

    constructor(
        /**
         * Entries describing DI container.
         * 
         * @example
         * ```ts
         * import { Singleton } from '@stompbox/tape-delay'
         * import { UserService } from '@/services/user.service'
         * import { UsersInMemory, UsersInPrisma } from '@/stores/user' 
         * 
         * const entries = {
         *     // One implementation for all environments
         *     UserService,
         *     UserStore: [
         *         // Implementation for test environment
         *         Singleton(UsersInMemory), 
         *         // Implementation for development environment
         *         UsersInPrisma,
         *         // Implementation for production environment
         *         UsersInPrisma
         *     ]
         * }
         * ```
         */
        private readonly entries: T,
        /**
         * Optional environment detector. `process.env.NODE_ENV` is used by default.
         * 
         * @example
         * ```ts
         * const randomEnvDetector: EnvironmentDetector = () => {
         *     if (Math.random() > 0.5) { return 'test' }
         *     if (Math.random() > 0.5) { return 'development' }
         *     return 'production'
         * }
         * ```
         */
        private readonly environmentDetector?: EnvironmentDetector
    ) {}

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
        const environment = this.environmentDetector ? this.environmentDetector() : process.env.NODE_ENV as Environment
        const container = this.container(environment)
        return container.get<EntryType<T[E]>>(entryName.toString())
    } 
}


type Keys<T> = T extends TapeDelay<infer GG> ? keyof GG : never

export const inject = <ContainerType>(entryKey: Keys<ContainerType>) => rawInject(entryKey)