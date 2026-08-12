import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export interface AuthorizedUserConfig {
  kingschatUsername: string; // KingsChat username or handle (e.g. "alex_director", "dr_peremobowei")
  aliases?: string[]; // Additional handles or base64 OAuth IDs (e.g. "pereedi", "dlNha2xlZ0...")
  name: string;
  role: 'SUPER_ADMIN' | 'DIRECTOR';
  directorateCode?: string; // TECH_DIGITAL, FINTECH, SOCIAL_MEDIA, CITIZEN_GLOBAL, RESEARCH_DATA, CONTENT_MEDIA, DIGITAL_ASSETS
  directorateRole?: string; // e.g. "Technology & Digital Innovation Director", "OFEM Executive Minister"
  email?: string;
  phone?: string;
}

/**
 * AUTHORIZED USERS ROSTER
 * Simply add or remove KingsChat usernames below for testing or production deployment.
 */
export const AUTHORIZED_USERS: AuthorizedUserConfig[] = [
  // 👑 OFEM Executive Officers (SUPER_ADMIN — Access to all 7 Directorates & Approvals)
  {
    kingschatUsername: 'pereedi3161',
    aliases: ['dlNha2xlZ0t0N1EyOExzNFhIbE1VOEl0NmU1NHA1RStmRWsxbmNzbVZlOD0', 'ODlBMmxSMmR5OTcy', 'U3lJSytYZmJoU3JIWWE1N2lac0hJZUY0aENUR0hXKyttVFZBV2ROekhwaz0'],
    name: 'pereedi3161',
    role: 'SUPER_ADMIN',
    directorateRole: 'OFEM Executive Minister',
    email: 'admin@ccpms.org',
  },
  {
    kingschatUsername: 'pst_joy',
    name: 'pst_joy',
    role: 'SUPER_ADMIN',
    directorateRole: 'OFEM Executive Minister',
    email: 'admin@ccpms.org',
  },
  {
    kingschatUsername: 'pereedi',
    aliases: ['WmpIN0pWWHBXZDYxRVFoSlIzMVlnMkFXREtPTWJwMkZnQU53RlQxaXJHaz0', 'MXZQblJZcnVSVk1udkwvWXI1VGRIL0JzUVVTSEFPNlB3SU1LOTNLbXNrTT0', 'k2o2s3c1wgp0t0pwew0yuuvvb2picezosezqywt6aenietbqsxrhy0nhqt0', 'U3lJSytYZmJoU3JIWWE1N2lac0hJZUY0aENUR0hXKyttVFZBV2ROekhwaz0'],
    name: 'pereedi',
    role: 'SUPER_ADMIN',
    directorateRole: 'OFEM Executive Minister',
    email: 'admin@ccpms.org',
  },


  // 🏢 Assistant Directors (DIRECTOR — Restricted strictly to assigned Directorate)
  {
    kingschatUsername: 'pereedi',
    aliases: ['WmpIN0pWWHBXZDYxRVFoSlIzMVlnMkFXREtPTWJwMkZnQU53RlQxaXJHaz0', 'MXZQblJZcnVSVk1udkwvWXI1VGRIL0JzUVVTSEFPNlB3SU1LOTNLbXNrTT0', 'k2o2s3c1wgp0t0pwew0yuuvvb2picezosezqywt6aenietbqsxrhy0nhqt0', 'U3lJSytYZmJoU3JIWWE1N2lac0hJZUY0aENUR0hXKyttVFZBV2ROekhwaz0'],
    name: 'pereedi',
    role: 'DIRECTOR',
    directorateCode: 'TECH_DIGITAL',
    directorateRole: 'Technology & Digital Innovation Director',
    email: 'director.tech@ccpms.org',
  },
  {
    kingschatUsername: 'alexdabest',
    name: 'alexdabest',
    role: 'DIRECTOR',
    directorateCode: 'TECH_DIGITAL',
    directorateRole: 'Technology & Digital Innovation Director',
    email: 'director.tech@ccpms.org',
  },

  {
    kingschatUsername: 'ngbadebo',
    name: 'ngbadebo',
    role: 'DIRECTOR',
    directorateCode: 'FINTECH',
    directorateRole: 'FinTech Products Director',
    email: 'director.fintech@ccpms.org',
  },
  {
    kingschatUsername: 'pastorstar',
    name: 'pastorstar',
    role: 'DIRECTOR',
    directorateCode: 'SOCIAL_MEDIA',
    directorateRole: 'Social Media & Distribution Director',
    email: 'director.social@ccpms.org',
  },
  {
    kingschatUsername: 'pst_joy',
    name: 'pst_joy',
    role: 'DIRECTOR',
    directorateCode: 'CITIZEN_GLOBAL',
    directorateRole: 'Citizen Engagement Director',
    email: 'director.citizen@ccpms.org',
  },
  {
    kingschatUsername: 'pidegr8',
    name: 'pidegr8',
    role: 'DIRECTOR',
    directorateCode: 'RESEARCH_DATA',
    directorateRole: 'Research & Data Intelligence Director',
    email: 'director.research@ccpms.org',
  },
  {
    kingschatUsername: 'pst_tope',
    name: 'pst_tope',
    role: 'DIRECTOR',
    directorateCode: 'CONTENT_MEDIA',
    directorateRole: 'Content & Media Production Director',
    email: 'director.content@ccpms.org',
  },
  {
    kingschatUsername: 'bro_princewill',
    name: 'bro_princewill',
    role: 'DIRECTOR',
    directorateCode: 'DIGITAL_ASSETS',
    directorateRole: 'Digital Assets & Language Director',
    email: 'director.assets@ccpms.org',
  },
];

/**
 * Finds all matching authorized user configurations for a KingsChat username, handle, or profile.
 * Supports base64 OAuth IDs, email/name matching, and multi-role portal selection.
 */
export function getAuthorizedUserConfigs(usernameOrId: string, profile?: any): AuthorizedUserConfig[] {
  if (!usernameOrId && !profile) return [];

  const rawInput = (usernameOrId || '').trim().toLowerCase().replace(/^@/, '');
  const profUser = (profile?.username || '').trim().toLowerCase().replace(/^@/, '');
  const profId = (profile?.id || '').trim().toLowerCase();
  const profEmail = (profile?.email || '').trim().toLowerCase();
  const profName = (profile?.name || '').trim().toLowerCase();

  // Step 1: Direct match on handle or aliases
  let matches = AUTHORIZED_USERS.filter((u) => {
    const handle = u.kingschatUsername.trim().toLowerCase().replace(/^@/, '');
    const aliases = (u.aliases || []).map((a) => a.trim().toLowerCase().replace(/^@/, ''));

    if (rawInput && (handle === rawInput || aliases.includes(rawInput))) return true;
    if (profUser && (handle === profUser || aliases.includes(profUser))) return true;
    if (profId && (handle === profId || aliases.includes(profId))) return true;
    return false;
  });

  if (matches.length > 0) return matches;

  // Step 2: Match on Email
  if (profEmail) {
    matches = AUTHORIZED_USERS.filter((u) => u.email && u.email.trim().toLowerCase() === profEmail);
    if (matches.length > 0) return matches;
  }


  // Step 3: Match on display name or handle substring
  if (profName && !profName.includes('=') && profName.length <= 40) {
    matches = AUTHORIZED_USERS.filter((u) =>
      u.name.trim().toLowerCase() === profName ||
      u.kingschatUsername.trim().toLowerCase() === profName ||
      profName.startsWith(u.kingschatUsername.trim().toLowerCase()) ||
      u.kingschatUsername.trim().toLowerCase().startsWith(profName)
    );
    if (matches.length > 0) return matches;
  }

  // No match found — caller must handle (throw Access Denied)
  return [];
}

/**
 * Finds an authorized user configuration by KingsChat username / handle and optional requestedRole
 */
export function getAuthorizedUserConfig(username: string, requestedRole?: string, profile?: any): AuthorizedUserConfig | undefined {
  const configs = getAuthorizedUserConfigs(username, profile);
  if (configs.length === 0) return undefined;
  if (requestedRole) {
    const found = configs.find((c) => c.role === requestedRole);
    if (found) return found;
  }
  return configs[0];
}

/**
 * Automatically syncs the AUTHORIZED_USERS roster into the database
 */
export async function syncAuthorizedUsersToDatabase(prisma: PrismaClient) {
  try {
    const roles = await prisma.role.findMany();
    const directorates = await prisma.directorate.findMany();

    const roleMap = new Map(roles.map((r) => [r.name, r.id]));
    const dirMap = new Map(directorates.map((d) => [d.code, d.id]));

    const superAdminRoleId = roleMap.get('SUPER_ADMIN');
    const directorRoleId = roleMap.get('DIRECTOR');

    if (!superAdminRoleId || !directorRoleId) {
      logger.warn('[UserRosterSync] Roles not initialized in database yet');
      return;
    }

    for (const config of AUTHORIZED_USERS) {
      const roleId = config.role === 'SUPER_ADMIN' ? superAdminRoleId : directorRoleId;
      const directorateId = config.directorateCode ? dirMap.get(config.directorateCode) || null : null;

      await prisma.user.upsert({
        where: { kingschatUserId: config.kingschatUsername },
        update: {
          name: config.name,
          roleId,
          directorateId,
          email: config.email || `${config.kingschatUsername.toLowerCase()}@ccpms.org`,
          phone: config.phone || '+2348000000000',
        },
        create: {
          kingschatUserId: config.kingschatUsername,
          name: config.name,
          roleId,
          directorateId,
          email: config.email || `${config.kingschatUsername.toLowerCase()}@ccpms.org`,
          phone: config.phone || '+2348000000000',
          status: 'ACTIVE',
        },
      });
    }

    logger.info(`[UserRosterSync] Synchronized ${AUTHORIZED_USERS.length} authorized users to database.`);
  } catch (error: any) {
    logger.error(`[UserRosterSync] Failed to sync users to database: ${error.message}`);
  }
}
