# KingsChat Authentication Architecture & Security Guide

## Overview
The **Mission Control System (CCPMS)** uses **KingsChat** as its primary identity and authentication provider. This document details how KingsChat sign-in works in the current **No-Security / Developer Bypass Mode**, as well as how to transition to full **KingsChat Web OAuth 2.0 Security Integration** when client secrets are deployed.

---

## 🔓 Current Mode: No-Security / Developer Quick-Login

To allow seamless frontend development, demonstration, and end-to-end testing without external OAuth credentials, the KingsChat authentication pipeline is currently operating in **No-Security Mode**.

### How It Works:
1. **Frontend Request**: The React frontend sends a POST request to `/api/auth/kingschat-login` containing a `token` (e.g. `KC_SUPERADMIN`, `KC_DIRECTOR`, or any custom handle string).
2. **Backend Interception (`AuthService.verifyKingsChatToken`)**:
   - The backend checks for predefined test profiles:
     - `KC_SUPERADMIN` -> `Dr. Peremobowei Edi` (`SUPER_ADMIN` role).
     - `KC_DIRECTOR` -> `Alex Director` (`DIRECTOR` role).
   - If any other custom token/username is provided, the service automatically constructs a valid mock profile (`KingsChat User (<handle>)`) without failing or making external network requests.
3. **Database Sync & Local JWT Issuance**:
   - The user is upserted into the SQLite database via Prisma.
   - Standard application JWT access (`accessToken`) and refresh tokens (`refreshToken`) are generated using `JWT_SECRET`.
   - The user is returned to the client and granted full session access.

---

## 🔒 Future Integration: Production KingsChat OAuth 2.0

When moving to production or enforcing full OAuth 2.0 security:

### Step 1: Register Application on KingsChat Developer Portal
1. Register your client application on the KingsChat Developer Hub.
2. Obtain your `KINGSCHAT_CLIENT_ID` and `KINGSCHAT_CLIENT_SECRET`.
3. Set the authorized redirect URL (e.g., `https://ccpms.org/auth/kingschat/callback`).

### Step 2: Environment Configuration
Update your `.env` file:
```env
DEV_MOCK_KINGSCHAT=false
KINGSCHAT_CLIENT_ID=your_client_id_here
KINGSCHAT_CLIENT_SECRET=your_client_secret_here
KINGSCHAT_API_URL=https://api.kingschat.net
```

### Step 3: Embed KingsChat Web SDK on Frontend
Add KingsChat Web Button script in `client/index.html`:
```html
<script src="https://connect.kingschat.net/js/v1/kingschat.js"></script>
```

When the user clicks **Sign In with KingsChat**, open the OAuth consent popup/redirect, receive the authorization code, exchange it for an official access token, and pass that token to `/api/auth/kingschat-login`.

### Step 4: Toggle Backend Validation
In `src/auth/auth.service.ts`, set `DEV_MOCK_KINGSCHAT=false`. The `verifyKingsChatToken` method will make a server-to-server request to `https://api.kingschat.net/profile` with the OAuth Bearer token to verify user identity before issuing local CCPMS session tokens.
