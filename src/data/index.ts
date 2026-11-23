/**
 * BLOOMÉ FLORAL — data barrel.
 * Import catalog + content exclusively from here so components stay decoupled
 * from where the data lives. In Business PRO these exports resolve to API
 * calls (swr/react-query) instead of local modules — the component layer
 * does not change.
 */
export * from './brand';
export * from './collections';
export * from './products';
export * from './content';
export * from '../types/content';
export type { FloralVariant } from '../types/floral';