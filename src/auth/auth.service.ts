import axios from 'axios';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { findRosterEntry, RosterEntry, RosterRole } from '../config/authorized-users';

export interface KingsChatProfile {
  id: string;           // raw KC identifier (may be base64 on first OAuth round-trip)
  username?: string;    // real KC handle — use this for roster matching
  name: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
}

export class AuthService {
  // ─── KingsChat API ────────────────────────────────────────────────────────

  /**
   * Exchange a KingsChat OAuth2 authorization `code` for a real access token.
   * POST /developer/api/oauth2/token — grant_type = "code", no auth headers.
   */
  async exchangeCodeForTokens(code: string): Promise<string> {
    const response = await axios.post(
      ENV.KINGSCHAT_OAUTH_TOKEN_URL,
      { grant_type: 'code', client_id: ENV.KINGSCHAT_CLIENT_ID, code },
      { headers: { 'Content-Type': 'application/json' } },
    );
    const accessToken = response.data.access_token;
    if (!accessToken) throw new Error('KingsChat token exchange did not return an access_token');
    return accessToken;
  }

  /**
   * Fetch the authenticated user's KingsChat profile.
   * GET /developer/api/user/profile — requires api-key + Bearer token.
   */
  async fetchKingsChatProfile(accessToken: string): Promise<KingsChatProfile> {
    const response = await axios.get(`${ENV.KINGSCHAT_API_URL}/user/profile`, {
      headers: {
        'api-key': ENV.KINGSCHAT_API_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const p = response.data.profile || response.data;
    return {
      id:         p.id,
      username:   p.username ? p.username.replace(/^@/, '').trim().toLowerCase() : undefined,
      name:       p.name || p.username || 'KingsChat User',
      email:      p.email     || undefined,
      phone:      p.phone_number || undefined,
      avatar_url: p.avatar    || undefined,
    };
  }

  /**
   * Resolve an incoming credential to a normalized KingsChatProfile.
   * Handles three paths:
   *   1. Dev/mock  — rawInput matches a roster mockId (or DEV_MOCK_KINGSCHAT is on)
   *   2. Code      — OAuth authorization code, must be exchanged first
   *   3. Token     — raw KC access token, sent directly to /user/profile
   */
  async verifyKingsChatToken(rawInput: string, inputKind: 'code' | 'token'): Promise<KingsChatProfile> {
    // ── 1. Dev / mock path ─────────────────────────────────────────────────
    const rosterMock = findRosterEntry({ mockId: rawInput });
    if (rosterMock || (ENV.DEV_MOCK_KINGSCHAT && inputKind === 'token')) {
      logger.info(`[AuthService] Mock path: id="${rawInput}"`);
      return {
        id:         rawInput,
        username:   rosterMock?.username ?? rawInput,
        name:       rosterMock?.name     ?? `KingsChat User (${rawInput})`,
        email:      `${rawInput.toLowerCase()}@kingschat.net`,
        avatar_url: `https://avatar.kingschat.net/${rawInput}`,
      };
    }

    // ── 2 & 3. Real KingsChat path ─────────────────────────────────────────
    try {
      const token = inputKind === 'code' ? await this.exchangeCodeForTokens(rawInput) : rawInput;
      return await this.fetchKingsChatProfile(token);
    } catch (error: any) {
      logger.error('[AuthService] KC profile fetch failed:', error.response?.data ?? error.message);
      throw new Error('Failed to verify KingsChat authentication token');
    }
  }

  // ─── Main authenticate entry point ────────────────────────────────────────

  /**
   * Core login flow (Architecture Brief v2 §5):
   *  1. Resolve KC profile
   *  2. Match profile.username against ROSTER — reject anyone not on the list
   *  3. BOTH users get requiresRoleSelection before a JWT is issued
   *  4. Upsert AuthorizedUser row, issue JWT
   */
  async authenticateWithKingsChat(
    rawInput: string,
    inputKind: 'code' | 'token' = 'token',
    requestedRole?: 'OFEM' | 'AD',
  ) {
    const kcProfile = await this.verifyKingsChatToken(rawInput, inputKind);

    // ── Roster enforcement ─────────────────────────────────────────────────
    const roster = findRosterEntry({
      mockId:   rawInput,
      username: kcProfile.username,
      email:    kcProfile.email,
    });

    if (!roster) {
      throw new Error(
        `Access Denied: KingsChat account @${kcProfile.username ?? kcProfile.id} is not an authorized CCPMS user.`,
      );
    }

    // ── Portal selection for BOTH users ────────────────────────────────────
    if (roster.role === 'BOTH' && !requestedRole) {
      logger.info(`[AuthService] Dual-role user "${roster.username}" — portal selection required`);
      return {
        requiresRoleSelection: true,
        username:   roster.username,
        name:       roster.name,
        avatar_url: kcProfile.avatar_url ?? null,
        directorate: roster.directorate ?? null,
        // Pass back the raw input so the client can include it in the
        // second request (with requestedRole) without re-doing OAuth.
        rawInput,
        inputKind,
        availableRoles: [
          {
            role: 'OFEM' as const,
            portalLabel: 'Office of Executive Minister (OFEM)',
            description: 'Executive Level: Controls, Approvals & All 7 Directorates',
          },
          {
            role: 'AD' as const,
            portalLabel: `Assistant Director — ${roster.directorate ?? 'Directorate'}`,
            description: 'Directorate Level: Submissions, Records & Reporting',
          },
        ],
      };
    }

    // ── Determine effective role ────────────────────────────────────────────
    // For BOTH users, requestedRole was supplied; for single-role users use roster.role directly.
    const effectiveRole: 'OFEM' | 'AD' =
      roster.role === 'BOTH' ? requestedRole! : (roster.role as 'OFEM' | 'AD');

    // ── Upsert AuthorizedUser row ───────────────────────────────────────────
    const dbUser = await (prisma as any).authorizedUser.upsert({
      where:  { username: roster.username },
      update: {
        name:        roster.name,
        role:        roster.role,
        directorate: roster.directorate ?? null,
        email:       kcProfile.email    ?? undefined,
        profilePhoto: kcProfile.avatar_url ?? undefined,
      },
      create: {
        username:    roster.username,
        name:        roster.name,
        role:        roster.role,
        directorate: roster.directorate ?? null,
        email:       kcProfile.email    ?? undefined,
        profilePhoto: kcProfile.avatar_url ?? undefined,
      },
    });

    // ── Issue JWT ──────────────────────────────────────────────────────────
    const jwtPayload = {
      username:    roster.username,
      role:        effectiveRole,
      directorate: effectiveRole === 'AD' ? (roster.directorate ?? null) : null,
    };

    const accessToken  = jwt.sign(jwtPayload, ENV.JWT_SECRET,         { expiresIn: ENV.JWT_EXPIRES_IN as any });
    const refreshToken = jwt.sign(jwtPayload, ENV.JWT_REFRESH_SECRET,  { expiresIn: ENV.JWT_REFRESH_EXPIRES_IN as any });

    logger.info(`[AuthService] Login OK: @${roster.username} → role=${effectiveRole}, dir=${roster.directorate ?? 'OFEM'}`);

    return {
      accessToken,
      refreshToken,
      user: {
        username:    dbUser.username,
        name:        dbUser.name,
        email:       dbUser.email    ?? null,
        profilePhoto: dbUser.profilePhoto ?? null,
        role:        effectiveRole,
        directorate: effectiveRole === 'AD' ? (roster.directorate ?? null) : null,
        permissions: this.permissionsForRole(effectiveRole),
      },
    };
  }

  // ─── Session refresh ──────────────────────────────────────────────────────

  async refreshSession(refreshTokenStr: string) {
    try {
      const decoded = jwt.verify(refreshTokenStr, ENV.JWT_REFRESH_SECRET) as any;
      // Verify the user still exists in the roster
      const roster = findRosterEntry({ username: decoded.username });
      if (!roster) throw new Error('User no longer authorized');

      const payload = {
        username:    decoded.username,
        role:        decoded.role,
        directorate: decoded.directorate,
      };
      const accessToken = jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: ENV.JWT_EXPIRES_IN as any });
      return { accessToken };
    } catch {
      throw new Error('Invalid or expired refresh token');
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private permissionsForRole(role: 'OFEM' | 'AD'): string[] {
    if (role === 'OFEM') {
      return [
        'records:read_all', 'records:review',
        'reviews:create', 'reviews:update',
        'directorates:read',
        'dashboard:read', 'audit:read',
        'notifications:read',
      ];
    }
    return [
      'records:create', 'records:read_own',
      'directorates:read',
      'dashboard:read',
      'notifications:read',
    ];
  }
}