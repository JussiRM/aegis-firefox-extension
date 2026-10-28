// Imported JSON stays untrusted until the runtime format checks succeed.
export interface TotpInfo { secret?: unknown; algo?: unknown; digits?: number; period?: number }
export interface RawEntry { uuid?: unknown; type?: string; name?: string; issuer?: string; favorite?: boolean; groups?: unknown; group?: unknown; info?: TotpInfo }
export interface RawDatabase { version: number; groups?: { uuid?: unknown; name?: unknown }[]; entries: RawEntry[] }
export interface EncryptionParams { tag: string; nonce: string }
export interface PasswordSlot { type: number; n: number; r: number; p: number; salt: string; key: string; key_params: EncryptionParams }
export interface AegisVault { version: 1; db: RawDatabase | string; header?: { slots: PasswordSlot[]; params: EncryptionParams } }
export type StoredVault = ({ kind: 'aegis'; vault: AegisVault } | { kind: 'local'; version: 1; salt: string; iv: string; data: string }) & { revision?: string };
export interface Token { key: CryptoKey; digits: number; period: number }
export interface Entry { id: string; pinId: string; issuer: string; name: string; favorite: boolean; groups: string[]; token: Token }
export interface Database { entries: Entry[]; groups: { id: string; name: string }[]; skipped: string[] }
