import { Limiter } from "@stompbox/limiter";
import { BindInWhenOnFluentSyntax, Container, decorate, injectable } from "inversify";

function uncapitalize<T extends string>(str: T): Uncapitalize<T> {
    if (!str) return str as Uncapitalize<T>;
    return (str.charAt(0).toLowerCase() + str.slice(1)) as Uncapitalize<T>;
}

class TapeDelayError extends Limiter({
    NOT_REGISTERED_ENTRY: 'TAPE_DELAY-NOT_REGISTERED_ENTITY'
}) {}

export class TapeDelay<Env extends string, T extends Entries<Env>, P extends TapeDelay<any, any, any> | undefined> {
    private readonly key = Math.random().toString()

    constructor(
        private readonly environmentDetector: () => Env,
        private readonly entries: T,
        private readonly parent?: P
    ) {}

    private container = (environment: Env) =>{
        const globalContainer = globalThis as any
        let container: Container;

        const containerKey = `tape-delay-${environment}-${this.key}`

        if (!globalContainer[containerKey]) {
            globalContainer[containerKey] = new Container({
                // @ts-ignore
                parent: this.parent ? this.parent.container[this.parent.environmentDetector()] : undefined
            })
            container = globalContainer[containerKey] as Container

            for (const rule in this.entries) {
                const ruleRawContent = this.entries[rule as keyof typeof this.entries]
                // @ts-ignore
                const ruleContent = ruleRawContent[environment] || ruleRawContent

                if (Array.isArray(ruleContent)) {
                    if (ruleContent[1] === 'constant') {
                        container.bind(rule).toConstantValue(ruleContent[0])
                        continue
                    }
                    const [Entry, builder] = ruleContent
                    decorate(injectable(), Entry)
                    builder(container.bind(rule).to(Entry))
                    continue
                }

                decorate(injectable(), ruleContent)
                container.bind(rule).to(ruleContent)
            }
        }

        container = globalContainer[containerKey]

        return container
    }

    private instance = <E extends EntryKeys<TapeDelay<Env, T, P>>>(entryName: E) => {
        const environment = this.environmentDetector()
        const container = this.container(environment)
        const entryNameAsString = entryName.toString()
        const result = container.get<EntryContract<TapeDelay<Env, T, P>, E & string>>(entryNameAsString)
        if (!result) {
            throw new TapeDelayError('NOT_REGISTERED_ENTRY', { entryName: entryNameAsString })
        }
        return result
    }

    resolve = (): {[key in keyof T as Uncapitalize<key & string>]: EntryContract<TapeDelay<Env, T, P>, key & string>} => {
        const allKeys = Object.keys(this.entries)
        let ctx = {}
        for (const currentKey of allKeys) {
            // @ts-ignore
            ctx[uncapitalize(currentKey)] = this.instance(currentKey)
        }

        // @ts-ignore
        return ctx
    }
    
    resolvePartial = <Keys extends EntryKeys<TapeDelay<Env, T, P>>[]>(...keys: Keys) => (): {[key in Keys[number] as Uncapitalize<key & string>]: EntryContract<TapeDelay<Env, T, P>, key & string>} => {
        let currentLevel = this
        let currentKeys = Object.keys(currentLevel.entries)
        let parent = this.parent
        let ctx = {}

        while (parent) {
            currentKeys = [...currentKeys, ...Object.keys(parent.entries)]
            parent = parent.parent
        }
        
        for (const key of currentKeys) {
            if (!keys.includes(key)) {
                continue
            }
            // @ts-ignore
            ctx[uncapitalize(key)] = this.instance(key)
        }
        
        // @ts-ignore
        return ctx

    }

    resolveWithParents = (): {[key in EntryKeys<TapeDelay<Env, T, P>> as Uncapitalize<key & string>]: EntryContract<TapeDelay<Env, T, P>, key & string>} => {
        let currentLevel = this
        let currentKeys = Object.keys(currentLevel.container)
        let parent = this.parent
        let ctx = {}

        while (parent) {
            currentKeys = [...currentKeys, ...Object.keys(parent.container)]
            parent = parent.parent
        }
        
        for (const key of currentKeys) {
            // if (keys && !keys.includes(key)) {
            //     continue
            // }
            // @ts-ignore
            ctx[uncapitalize(key)] = this.instance(key)
        }
        
        // @ts-ignore
        return ctx
    }
}

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

export type PublicFields<T> = { [k in keyof T]: T[k] }

export type EntryDescription<T> = ClassEntry<T> | ConstantValueEntry<T> | [ClassEntry<T>, (x: BindInWhenOnFluentSyntax<unknown>) => any]

export type Entry<T, Environments extends string> = EntryDescription<T> | Record<Environments, EntryDescription<T>>

export type ClassEntry<T> = new (...args: any[]) => T
export type ConstantValueEntry<T> = [T, 'constant']

export type Entries<Environments extends string> = Record<string, Entry<unknown, Environments>>

export type EntryType<T> = T extends Entry<infer G, string> ? PublicFields<G> : never 

export type EntryKeys<T, Depth extends number = 20> =
    Depth extends 0
        ? never
        : T extends undefined 
            ? never
            : T extends TapeDelay<any, infer ContainerEntries, infer ParentContainer>
                ? keyof ContainerEntries | EntryKeys<ParentContainer, Prev[Depth]>
                : never;

export type EntryContract<T, Key extends string> = 
    T extends undefined 
        ? never 
        : T extends TapeDelay<any, infer ContainerEntries, infer ParentContainer>
            ? Key extends keyof ContainerEntries
                ? EntryType<ContainerEntries[Key]>
                : Key extends keyof ParentContainer
                    ? EntryType<ParentContainer[Key]>
                    : EntryContract<ParentContainer, Key>
            : never
