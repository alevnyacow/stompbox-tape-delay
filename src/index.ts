import { inject as rawInject } from 'inversify'
import { ClassEntry, ConstantValueEntry, Entries, EntryContract, EntryDescription, EntryKeys, TapeDelay } from "./types";

export type Instance<T extends TapeDelay<any, any, any>, Key extends EntryKeys<T>> = EntryContract<T, Key & string>

const Singleton = <T>(EntryClass: ClassEntry<T>): EntryDescription<T> => [EntryClass, x => x.inSingletonScope()] as const
const Transient = <T>(EntryClass: ClassEntry<T>): EntryDescription<T> => [EntryClass, x => x.inTransientScope()] as const
const Request = <T>(EntryClass: ClassEntry<T>): EntryDescription<T> => [EntryClass, x => x.inRequestScope()] as const
const ConstantValue = <T>(value: T): ConstantValueEntry<T> => [value, 'constant']

/**
 * Lifetime scopes.
 */
export const Scope = { 
    /**
     * Singleton scope.
     * 
     * @example
     * ```ts
     * import { Scope } from '@stompbox/tape-delay'
     * 
     * const entries = { A: Scope.Singleton(A) }
     * ```
     */ 
    Singleton, 
    /**
     * Transient scope (used by default).
     * 
     * @example
     * ```ts
     * import { Scope } from '@stompbox/tape-delay'
     * 
     * const entries = { A: Scope.Transient(A) }
     * ```
     */
    Transient, 
    /**
     * Request scope.
     * 
     * @example
     * ```ts
     * import { Scope } from '@stompbox/tape-delay'
     * 
     * const entries = { A: Scope.Request(A) }
     * ```
     */
    Request, 
    /**
     * Constant value scope.
     * 
     * @example
     * ```ts
     * import { Scope } from '@stompbox/tape-delay'
     * 
     * const instance = new A()
     * 
     * const entries = { A: Scope.ConstantValue(instance) }
     * ```
     */
    ConstantValue 
}

type DefaultEnvironment = 'test' | 'development' | 'production'

export function newContainer<
    T extends Entries<DefaultEnvironment>
>(
    entries: T
): TapeDelay<DefaultEnvironment, T, undefined>

export function newContainer<
    Env extends string, 
    T extends Entries<Env>
>(
    envObtainer: () => Env, 
    entries: Entries<Env>
): TapeDelay<Env, T, undefined>

export function newContainer<
    T extends Entries<DefaultEnvironment>, 
    ParentEnv extends string, 
    ParentEntries extends Entries<ParentEnv>, 
    ParentParent extends TapeDelay<any, any, any>
>(
    entries: T, 
    parentContainer: TapeDelay<ParentEnv, ParentEntries, ParentParent>
): TapeDelay<DefaultEnvironment, T, TapeDelay<ParentEnv, ParentEntries, ParentParent>>

export function newContainer<
    Env extends string, 
    T extends Entries<Env>,
    ParentEnv extends string, 
    ParentEntries extends Entries<ParentEnv>, 
    ParentParent extends TapeDelay<any, any, any>
>(
    envObtainer: () => Env, 
    entries: T,
    parentContainer: TapeDelay<ParentEnv, ParentEntries, ParentParent>
): TapeDelay<Env, T, TapeDelay<ParentEnv, ParentEntries, ParentParent>>

export function newContainer(a: Function | object, b: object | void, c: object | void): any {
    if (typeof a === 'function') {
        return new TapeDelay(a as () => string, b as Entries<string>, c as any)
    }
    return new TapeDelay(
        () => process.env.NODE_ENV as DefaultEnvironment, 
        a as Entries<DefaultEnvironment>, 
        b as any
    )
}

export const injectField = <T extends TapeDelay<any, any, any>>(x: EntryKeys<T>) => {
    return rawInject(x as string)
}

