/**
 * API Endpoints Index
 * ===================
 * Re-exports all endpoint modules for convenient access.
 *
 * Usage:
 *   import { auth, menu, user, recommend, log, preference, scan } from '@/src/api/endpoints';
 *   const result = await auth.checkEmail({ email: 'user@university.edu' });
 */

export * as auth from './auth';
export * as menu from './menu';
export * as user from './user';
export * as dayplan from './dayplan';
export * as recommend from './recommend';
export * as log from './log';
export * as preference from './preference';
export * as scan from './scan';
