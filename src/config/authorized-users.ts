import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export interface AuthorizedUserConfig {
  kingschatUsername: string; // KingsChat username or handle (e.g. "alex_director", "dr_peremobowei")
  name: string;
  role: 'SUPER_ADMIN' | 'DIRECTOR';
  directorateCode?: string; // TECH_DIGITAL, FINTECH, SOCIAL_MEDIA, CITIZEN_GLOBAL, RESEARCH_DATA, CONTENT_MEDIA, DIGITAL_ASSETS
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
    name: 'Directorate (OFEM Executive)',
    role: 'SUPER_ADMIN',
    email: 'admin@ccpms.org',
  },

  // 🏢 Assistant Directors (DIRECTOR — Restricted strictly to assigned Directorate)
  {
    kingschatUsername: 'pereedi',
    name: 'Technology & Digital Innovation Director',
    role: 'DIRECTOR',
    directorateCode: 'TECH_DIGITAL',
    email: 'director.tech@ccpms.org',
  },
  {
    kingschatUsername: 'fintech_ad',
    name: 'FinTech Products Director',
    role: 'DIRECTOR',
    directorateCode: 'FINTECH',
    email: 'director.fintech@ccpms.org',
  },
  {
    kingschatUsername: 'socialmedia_ad',
    name: 'Social Media & Distribution Director',
    role: 'DIRECTOR',
    directorateCode: 'SOCIAL_MEDIA',
    email: 'director.social@ccpms.org',
  },
  {
    kingschatUsername: 'citizen_ad',
    name: 'Citizen Engagement Director',
    role: 'DIRECTOR',
    directorateCode: 'CITIZEN_GLOBAL',
    email: 'director.citizen@ccpms.org',
  },
  {
    kingschatUsername: 'research_ad',
    name: 'Research & Data Intelligence Director',
    role: 'DIRECTOR',
    directorateCode: 'RESEARCH_DATA',
    email: 'director.research@ccpms.org',
  },
  {
    kingschatUsername: 'content_ad',
    name: 'Content & Media Production Director',
    role: 'DIRECTOR',
    directorateCode: 'CONTENT_MEDIA',
    email: 'director.content@ccpms.org',
  },
  {
    kingschatUsername: 'digitalassets_ad',
    name: 'Digital Assets & Language Director',
    role: 'DIRECTOR',
    directorateCode: 'DIGITAL_ASSETS',
    email: 'director.assets@ccpms.org',
  },
];

/**
 * Finds an authorized user configuration by KingsChat username / handle
 */
export function getAuthorizedUserConfig(username: string): AuthorizedUserConfig | undefined {
  if (!username) return undefined;
  const clean = username.trim().toLowerCase().replace(/^@/, '');
  return AUTHORIZED_USERS.find(
    (u) => u.kingschatUsername.toLowerCase() === clean || u.kingschatUsername.toLowerCase() === username.trim().toLowerCase()
  );
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
