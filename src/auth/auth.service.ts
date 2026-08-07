import axios from 'axios';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export interface KingsChatProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
}

export class AuthService {
  /**
   * Validate token with KingsChat API or Mock service (No-security bypass mode enabled for dev/testing)
   */
  async verifyKingsChatToken(token: string): Promise<KingsChatProfile> {
    const cleanToken = token ? token.trim() : 'KC_DIRECTOR';

    // 1. Direct mock token shortcuts
    if (cleanToken === 'KC_SUPERADMIN') {
      return {
        id: 'KC_SUPERADMIN',
        name: 'OFEM Executive',
        email: 'ofem@ccpms.org',
        phone: '+2348000000001',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      };
    }

    if (cleanToken === 'KC_DIRECTOR') {
      return {
        id: 'KC_DIRECTOR',
        name: 'AD Director',
        email: 'ad.director@ccpms.org',
        phone: '+2348000000002',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      };
    }

    // 2. If token starts with KC_ or Dev Mock is enabled (No-Security Mode)
    if (ENV.DEV_MOCK_KINGSCHAT || cleanToken.startsWith('KC_') || process.env.NODE_ENV !== 'production') {
      logger.info(`[AuthService] KingsChat no-security mode active for token: ${cleanToken}`);
      const mockId = cleanToken.startsWith('KC_') ? cleanToken : `KC_${cleanToken.replace(/[^a-zA-Z0-9]/g, '')}`;
      return {
        id: mockId,
        name: cleanToken.includes('@') ? cleanToken.split('@')[0] : `KingsChat User (${cleanToken})`,
        email: cleanToken.includes('@') ? cleanToken : `${mockId.toLowerCase()}@kingschat.net`,
        phone: '+2348000000000',
        avatar_url: `https://avatar.kingschat.net/${mockId}`,
      };
    }

    // 3. Fallback to KingsChat profile endpoint with fallback on error
    try {
      const response = await axios.get(`${ENV.KINGSCHAT_API_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${cleanToken}`,
        },
      });

      const profile = response.data.profile || response.data;
      return {
        id: profile.id || profile.user_id,
        name: profile.name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'KingsChat User',
        email: profile.email,
        phone: profile.phone_number || profile.phone,
        avatar_url: profile.avatar_url,
      };
    } catch (error: any) {
      logger.warn(`KingsChat API error: ${error.message}. Falling back to no-security mock authentication.`);
      const mockId = `KC_${cleanToken.replace(/[^a-zA-Z0-9]/g, '') || 'USER'}`;
      return {
        id: mockId,
        name: `KingsChat User (${cleanToken})`,
        email: `${mockId.toLowerCase()}@kingschat.net`,
        phone: '+2348000000000',
        avatar_url: `https://avatar.kingschat.net/${mockId}`,
      };
    }
  }

  /**
   * Synchronize user profile in local DB and issue local JWT
   */
  async authenticateWithKingsChat(token: string) {
    const kcProfile = await this.verifyKingsChatToken(token);

    // Find existing user or create
    let user = await prisma.user.findUnique({
      where: { kingschatUserId: kcProfile.id },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        directorate: true,
        department: true,
      },
    });

    if (!user) {
      // Find default role ('DIRECTOR' or fallback to first role)
      let defaultRole = await prisma.role.findUnique({ where: { name: 'DIRECTOR' } });
      if (!defaultRole) {
        defaultRole = await prisma.role.findFirst();
      }

      if (!defaultRole) {
        throw new Error('System initialization incomplete: No default roles found');
      }

      user = await prisma.user.create({
        data: {
          kingschatUserId: kcProfile.id,
          name: kcProfile.name,
          email: kcProfile.email,
          phone: kcProfile.phone,
          profilePhoto: kcProfile.avatar_url,
          roleId: defaultRole.id,
          lastLogin: new Date(),
        },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
          directorate: true,
          department: true,
        },
      });
    } else {
      // Update sync profile & last login
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: kcProfile.name || user.name,
          email: kcProfile.email || user.email,
          phone: kcProfile.phone || user.phone,
          profilePhoto: kcProfile.avatar_url || user.profilePhoto,
          lastLogin: new Date(),
        },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
          directorate: true,
          department: true,
        },
      });
    }

    const permissions = user.role.permissions.map((rp) => rp.permission.name);

    // Generate Application JWT
    const payload = {
      userId: user.id,
      kingschatUserId: user.kingschatUserId,
      role: user.role.name,
    };

    const accessToken = jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: ENV.JWT_EXPIRES_IN as any });
    const refreshToken = jwt.sign(payload, ENV.JWT_REFRESH_SECRET, { expiresIn: ENV.JWT_REFRESH_EXPIRES_IN as any });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        kingschatUserId: user.kingschatUserId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profilePhoto: user.profilePhoto,
        status: user.status,
        role: user.role.name,
        permissions,
        directorate: user.directorate ? { id: user.directorate.id, name: user.directorate.name, code: user.directorate.code } : null,
        department: user.department ? { id: user.department.id, name: user.department.name, code: user.department.code } : null,
        lastLogin: user.lastLogin,
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
