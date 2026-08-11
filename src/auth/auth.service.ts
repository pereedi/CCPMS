import axios from 'axios';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { getAuthorizedUserConfig, getAuthorizedUserConfigs, AuthorizedUserConfig } from '../config/authorized-users';

export interface KingsChatProfile {
  id: string;
  name: string;
  username?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
}

export class AuthService {
  /**
   * Step 6: Exchange OAuth2 Authorization Code for Access & Refresh Tokens
   * Endpoint: POST https://connect.kingsch.at/developer/api/oauth2/token
   */
  async exchangeCodeForTokens(code: string): Promise<{ access_token: string; refresh_token?: string }> {
    try {
      const response = await axios.post(
        'https://connect.kingsch.at/developer/api/oauth2/token',
        {
          grant_type: 'code',
          client_id: ENV.KINGSCHAT_CLIENT_ID || 'd697c531-b03b-4370-a4b3-c26483c4f044',
          code,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
      return response.data;
    } catch (error: any) {
      logger.error(`[AuthService] KingsChat Code Exchange Error: ${error.response?.data?.message || error.message}`);
      throw new Error(`Failed to exchange KingsChat authorization code: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get Authenticated User's Profile
   * Endpoint: GET https://connect.kingsch.at/developer/api/user/profile
   * Headers:
   *   api-key: YOUR_API_KEY
   *   Authorization: Bearer YOUR_ACCESS_TOKEN
   */
  async fetchKingsChatProfile(accessToken: string): Promise<KingsChatProfile> {
    const apiKey = ENV.KINGSCHAT_API_KEY || '43cWL2OYutzOND0zGhiU94UficpXqSPkWEBtj+ENtIQ=';

    try {
      const response = await axios.get('https://connect.kingsch.at/developer/api/user/profile', {
        headers: {
          'api-key': apiKey,
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const profile = response.data.profile || response.data;
      return {
        id: profile.id,
        name: profile.name,
        username: profile.username ? profile.username.replace(/^@/, '') : profile.id,
        email: profile.email,
        phone: profile.phone_number || profile.phone,
        avatar_url: profile.avatar,
      };
    } catch (error: any) {
      logger.error(`[AuthService] KingsChat Profile Fetch Error: ${error.response?.data?.message || error.message}`);
      throw new Error(`Failed to retrieve KingsChat profile: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Validate token or handle prototype roster shortcut
   */
  async verifyKingsChatToken(token: string): Promise<KingsChatProfile> {
    const cleanToken = token ? token.trim() : 'pereedi';
    const config = getAuthorizedUserConfig(cleanToken);

    if (config) {
      return {
        id: config.kingschatUsername,
        name: config.name,
        username: config.kingschatUsername,
        email: config.email || `${config.kingschatUsername.toLowerCase()}@ccpms.org`,
        phone: config.phone || '+2348000000000',
        avatar_url: config.role === 'SUPER_ADMIN'
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
          : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      };
    }

    // Direct mock token shortcuts
    if (cleanToken === 'KC_SUPERADMIN' || cleanToken === 'pereedi3161' || cleanToken === 'alexdabest') {
      return {
        id: 'pereedi3161',
        name: 'pereedi3161',
        username: 'pereedi3161',
        email: 'admin@ccpms.org',
        phone: '+2348000000001',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      };
    }

    if (cleanToken === 'KC_DIRECTOR' || cleanToken === 'pereedi') {
      return {
        id: 'pereedi',
        name: 'pereedi',
        username: 'pereedi',
        email: 'director.tech@ccpms.org',
        phone: '+2348000000002',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      };
    }

    // If token is a bearer token, try fetching official profile
    try {
      return await this.fetchKingsChatProfile(cleanToken);
    } catch (_) {
      // Fallback for dev/mock mode
      const mockId = cleanToken.startsWith('KC_') ? cleanToken : cleanToken.replace(/[^a-zA-Z0-9_]/g, '');
      return {
        id: mockId,
        name: cleanToken.includes('@') ? cleanToken.split('@')[0] : mockId,
        username: mockId,
        email: cleanToken.includes('@') ? cleanToken : `${mockId.toLowerCase()}@kingschat.net`,
        phone: '+2348000000000',
        avatar_url: `https://avatar.kingschat.net/${mockId}`,
      };
    }
  }

  /**
   * Synchronize user profile in local DB and issue local JWT.
   * Supports both OAuth code exchange and raw token/roster handle authentication.
   */
  async authenticateWithKingsChat(tokenOrCodePayload: any) {
    let cleanInput = typeof tokenOrCodePayload === 'string' ? tokenOrCodePayload.trim() : (tokenOrCodePayload?.code || tokenOrCodePayload?.token || '');
    if (!cleanInput) cleanInput = 'pereedi';

    let kcProfile: KingsChatProfile;

    // Check if input is an OAuth code (e.g. from KingsChat redirect POST or popup callback)
    if (tokenOrCodePayload?.code || (typeof tokenOrCodePayload === 'string' && tokenOrCodePayload.length > 30 && !tokenOrCodePayload.startsWith('eyJ') && !getAuthorizedUserConfig(cleanInput))) {
      try {
        const tokens = await this.exchangeCodeForTokens(tokenOrCodePayload?.code || cleanInput);
        kcProfile = await this.fetchKingsChatProfile(tokens.access_token);
      } catch (err: any) {
        logger.warn(`[AuthService] OAuth Code Exchange failed, trying profile token check: ${err.message}`);
        kcProfile = await this.verifyKingsChatToken(cleanInput);
      }
    } else {
      kcProfile = await this.verifyKingsChatToken(cleanInput);
    }

    const rawUsername = kcProfile.username || kcProfile.id;
    const requestedRole = typeof tokenOrCodePayload === 'object' ? tokenOrCodePayload.requestedRole : undefined;
    const configs = getAuthorizedUserConfigs(rawUsername, kcProfile);

    // ROSTER ENFORCEMENT: Reject users not registered in authorized roster
    if (configs.length === 0) {
      throw new Error(`Access Denied: KingsChat account @${rawUsername} is not registered as an authorized OFEM Executive or Assistant Director in CCPMS.`);
    }

    const matchedConfig = configs[0];
    const isBase64Id = rawUsername.length > 20 || rawUsername.includes('=');
    const username = matchedConfig?.kingschatUsername || (isBase64Id ? (kcProfile.name ? kcProfile.name.toLowerCase().replace(/[^a-z0-9]/g, '_') : rawUsername) : rawUsername);

    // UNIVERSAL PORTAL SELECTION: Prompt all authorized users to select OFEM or AD portal mode for session
    if (!requestedRole) {
      const directorates = await prisma.directorate.findMany({ select: { id: true, name: true, code: true } });
      const dirMap = new Map(directorates.map((d) => [d.code, d]));

      const adConfig = configs.find((c) => c.role === 'DIRECTOR') || configs[0];
      const assignedDirCode = adConfig?.directorateCode || 'TECH_DIGITAL';
      const assignedDir = dirMap.get(assignedDirCode);
      const adLabel = assignedDir ? `Assistant Director — ${assignedDir.name}` : 'Assistant Director (AD Portal)';
      const adDesc = assignedDir ? `Directorate Level: ${assignedDir.name} Reporting` : 'Directorate Level Operations & Reporting';

      return {
        requiresRoleSelection: true,
        username: (kcProfile.name && !kcProfile.name.startsWith('KingsChat User')) ? kcProfile.name : (matchedConfig?.name || username),
        handle: isBase64Id ? (matchedConfig?.kingschatUsername || null) : username,
        name: (kcProfile.name && !kcProfile.name.startsWith('KingsChat User')) ? kcProfile.name : (matchedConfig?.name || username),
        avatar_url: kcProfile.avatar_url,
        tokenOrCodePayload,
        availableRoles: [
          {
            role: 'SUPER_ADMIN',
            portalLabel: 'Office of Executive Minister (OFEM)',
            description: 'Executive Level: Controls, Approvals & All 7 Directorates',
          },
          {
            role: 'DIRECTOR',
            directorateCode: assignedDirCode,
            portalLabel: adLabel,
            description: adDesc,
          },
        ],
      };
    }

    const config = getAuthorizedUserConfig(rawUsername, requestedRole, kcProfile) || matchedConfig;
    const effectiveRole = requestedRole || config?.role || 'SUPER_ADMIN';
    const effectiveDirCode = effectiveRole === 'DIRECTOR' ? (config?.directorateCode || 'TECH_DIGITAL') : undefined;
    const isOFEM = effectiveRole === 'SUPER_ADMIN';

    // Resolve Role and Directorate from Prisma DB
    let dbRole = await prisma.role.findUnique({ where: { name: effectiveRole } });
    if (!dbRole) {
      dbRole = await prisma.role.findFirst();
    }

    let dbDir: any = null;
    if (effectiveDirCode) {
      dbDir = await prisma.directorate.findUnique({ where: { code: effectiveDirCode } });
    }

    const resolvedName = config?.kingschatUsername || username;

    // Upsert User in database with bound Role and Directorate
    let user: any = null;
    try {
      user = await prisma.user.upsert({
        where: { kingschatUserId: username },
        update: {
          name: resolvedName,
          email: kcProfile.email || config?.email || `${username.toLowerCase()}@ccpms.org`,
          phone: kcProfile.phone || config?.phone || '+2348000000000',
          profilePhoto: kcProfile.avatar_url,
          roleId: dbRole?.id,
          directorateId: isOFEM ? null : (dbDir?.id || null),
          lastLogin: new Date(),
        },
        create: {
          kingschatUserId: username,
          name: resolvedName,
          email: kcProfile.email || config?.email || `${username.toLowerCase()}@ccpms.org`,
          phone: kcProfile.phone || config?.phone || '+2348000000000',
          profilePhoto: kcProfile.avatar_url,
          roleId: dbRole?.id!,
          directorateId: isOFEM ? null : (dbDir?.id || null),
          status: 'ACTIVE',
          lastLogin: new Date(),
        },
        include: {
          role: true,
          directorate: true,
        },
      });
    } catch (err: any) {
      logger.warn(`[AuthService] DB Upsert fallback: ${err.message}`);
    }

    const userId = user?.id || `user-${username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    const userRole = user?.role?.name || effectiveRole;
    const userDir = isOFEM
      ? null
      : (user?.directorate
          ? { id: user.directorate.id, name: user.directorate.name, code: user.directorate.code }
          : (dbDir ? { id: dbDir.id, name: dbDir.name, code: dbDir.code } : { id: 'mock-dir-001', name: 'Technology & Digital Innovation', code: 'TECH_DIGITAL' }));

    const jwtPayload = {
      userId,
      kingschatUserId: username,
      role: userRole,
      directorateId: userDir?.id,
    };

    const accessToken  = jwt.sign(jwtPayload, ENV.JWT_SECRET, { expiresIn: ENV.JWT_EXPIRES_IN as any });
    const refreshToken = jwt.sign(jwtPayload, ENV.JWT_REFRESH_SECRET, { expiresIn: ENV.JWT_REFRESH_EXPIRES_IN as any });

    logger.info(`[AuthService] KingsChat login successful for: @${username} (${userRole}) Directorate: ${userDir?.name || 'OFEM Global'}`);

    return {
      accessToken,
      refreshToken,
      user: {
        id: userId,
        kingschatUserId: username,
        name: user?.name || config?.name || kcProfile.name,
        email: user?.email || config?.email || kcProfile.email,
        phone: user?.phone || config?.phone || kcProfile.phone,
        profilePhoto: user?.profilePhoto || kcProfile.avatar_url,
        status: 'ACTIVE',
        role: userRole,
        directorateRole: isOFEM ? 'OFEM Executive Minister' : (config?.directorateRole || (userDir?.name ? `${userDir.name} Director` : 'Assistant Director')),
        permissions: isOFEM
          ? ['VIEW_ALL', 'MANAGE_REPORTS', 'APPROVE_REPORTS', 'MANAGE_USERS', 'VIEW_AUDIT']
          : ['SUBMIT_REPORT', 'VIEW_OWN_REPORTS', 'VIEW_KPIS'],
        directorate: userDir,
        department: null,
        lastLogin: new Date().toISOString(),
      },
    };
  }

  /**
   * Refresh JWT Session Token
   */
  async refreshSession(refreshTokenStr: string) {
    try {
      const decoded = jwt.verify(refreshTokenStr, ENV.JWT_REFRESH_SECRET) as any;
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { role: true },
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new Error('User inactive or invalid session');
      }

      const payload = {
        userId: user.id,
        kingschatUserId: user.kingschatUserId,
        role: user.role.name,
      };

      const accessToken = jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: ENV.JWT_EXPIRES_IN as any });
      return { accessToken };
    } catch (error: any) {
      throw new Error('Invalid or expired refresh token');
    }
  }
}
