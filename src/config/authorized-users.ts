import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RosterRole = 'OFEM' | 'AD' | 'BOTH';

export interface RosterEntry {
  /** KingsChat handle — lowercase, no @ prefix. This is the primary key. */
  username: string;
  /** Display name shown in the UI. */
  name: string;
  /** OFEM = executive-only, AD = directorate-only, BOTH = dual login. */
  role: RosterRole;
  /** Required for AD and BOTH users. One of the 7 official directorate codes. */
  directorate?: string;
  /** Optional dev/test shortcut — matching this value in verifyKingsChatToken
   *  triggers the mock path instead of hitting the real KingsChat API. */
  mockId?: string;
}

// ─── Roster ────────────────────────────────────────────────────────────────────
// Exactly 8 entries per Architecture Brief v2 §2.
// Only these usernames may authenticate — anyone else is rejected at the app
// layer after the KC profile fetch succeeds.

export const ROSTER: RosterEntry[] = [
  {
    username:    'alexdabest',
    name:        'Alex (Technology & Digital Innovation)',
    role:        'AD',
    directorate: 'Technology & Digital Innovation',
  },
  {
    username:    'ngbadebo',
    name:        'Ngbadebo (FinTech & Technology Products)',
    role:        'AD',
    directorate: 'FinTech & Technology Products',
  },
  {
    username:    'pastorstar',
    name:        'Pastor Star (Social Media, Platforms & Distribution)',
    role:        'AD',
    directorate: 'Social Media, Platforms & Distribution',
  },
  {
    username:    'pst_joy',
    name:        'Pst. Joy',
    role:        'BOTH',
    directorate: 'Citizen Engagement & Global Localization',
  },
  {
    username:    'pidegr8',
    name:        'Pidegr8',
    role:        'AD',
    directorate: 'Research, Data Intelligence & Governance',
  },
  {
    username:    'pst_tope',
    name:        'Pst. Tope',
    role:        'AD',
    directorate: 'Content & Media Production',
  },
  {
    username:    'bro_princewill',
    name:        'Bro. Princewill',
    role:        'AD',
    directorate: 'Digital Asset Management & Language Services',
  },
  {
    username:    'pereedi',
    name:        'Pereedi',
    role:        'BOTH',
    directorate: 'Technology & Digital Innovation',
    mockId:      'pereedi',  // dev test account — matches verifyKingsChatToken mock path
  },
   {
    username:    'godgift11',
    name:        'godgift11',
    role:        'BOTH',
    directorate: 'Technology & Digital Innovation',
    mockId:      'godgift11',  // dev test account — matches verifyKingsChatToken mock path
  },
];

// ─── Lookup helpers ────────────────────────────────────────────────────────────

/**
 * Find a single roster entry by any combination of identifiers.
 * Priority: mockId > username > email (derived from KC profile).
 * Returns `undefined` if no match — callers MUST reject the request in that case.
 */
export function findRosterEntry(args: {
  mockId?:  string;
  username?: string;
  email?:    string;
}): RosterEntry | undefined {
  const { mockId, username, email } = args;

  // 1. Exact mockId match (dev/test only)
  if (mockId) {
    const byMock = ROSTER.find((r) => r.mockId === mockId);
    if (byMock) return byMock;
  }

  // 2. Exact username match (strip leading @, lowercase)
  if (username) {
    const clean = username.trim().toLowerCase().replace(/^@/, '');
    const byUser = ROSTER.find((r) => r.username === clean);
    if (byUser) return byUser;
  }

  // 3. Email prefix match (e.g. alexdabest@kingschat.online → alexdabest)
  if (email) {
    const prefix = email.split('@')[0].trim().toLowerCase();
    const byEmail = ROSTER.find((r) => r.username === prefix);
    if (byEmail) return byEmail;
  }

  return undefined;
}

// ─── DB sync ───────────────────────────────────────────────────────────────────

/**
 * Upsert all 8 roster entries into the `AuthorizedUser` table.
 * Called at server startup and from the seed script.
 */
export async function syncRosterToDatabase(prisma: PrismaClient): Promise<void> {
  try {
    for (const entry of ROSTER) {
      await (prisma as any).authorizedUser.upsert({
        where:  { username: entry.username },
        update: {
          name:        entry.name,
          role:        entry.role,
          directorate: entry.directorate ?? null,
        },
        create: {
          username:    entry.username,
          name:        entry.name,
          role:        entry.role,
          directorate: entry.directorate ?? null,
        },
      });
    }
    logger.info(`[RosterSync] Synchronized ${ROSTER.length} authorized users to database.`);
  } catch (error: any) {
    logger.error(`[RosterSync] Failed to sync roster: ${error.message}`);
    throw error;
  }
}
