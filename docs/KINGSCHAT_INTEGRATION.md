# KingsChat Authentication Architecture & Security Guide

## Overview
The **Mission Control System (CCPMS)** uses **KingsChat** as its primary identity and authentication provider. Users sign in using KingsChat OAuth 2.0 authorization code flow. Every authenticated user is checked against the **Authorized Roster** (`AUTHORIZED_USERS`) to verify their role (**OFEM Executive** or **Assistant Director (AD)**).

---

## 🔒 Production Credentials & Endpoints

- **Client ID**: `d697c531-b03b-4370-a4b3-c26483c4f044`
- **Redirect URL**: `https://ccpms.onrender.com/kingschat-callback`
- **OAuth Login Initiation URL**: `https://accounts.kingschat.online/log-in?clientId=d697c531-b03b-4370-a4b3-c26483c4f044&origin=https://ccpms.onrender.com/kingschat-callback`
- **Token Exchange Endpoint**: `POST https://connect.kingsch.at/developer/api/oauth2/token`
- **User Profile Endpoint**: `GET https://connect.kingsch.at/developer/api/user/profile`

---

## 🛡️ Roster Role Enforcement Policy

To ensure high security for Mission Control:
1. When a user logs in via KingsChat, the system retrieves their KingsChat profile (`username`, `id`, `name`, `email`, `phone`).
2. The user's KingsChat username is matched against `AUTHORIZED_USERS`.
3. If the user is registered as an **OFEM Executive** (`SUPER_ADMIN`), they gain access to global command dashboards, all 7 directorates, and report approvals.
4. If the user is registered as an **Assistant Director (AD)** (`DIRECTOR`), they gain isolated access to submit and manage reports for their assigned directorate.
5. If the user's KingsChat username is **NOT registered** in the roster as an OFEM or AD, authentication fails immediately with an explicit access denial:
   > `Access Denied: KingsChat account @username is not registered as an authorized OFEM Executive or Assistant Director in CCPMS.`

---

## 🔄 OAuth 2.0 Workflow Summary

1. **User Clicks "Sign In with KingsChat"**:
   Client opens `https://accounts.kingschat.online/log-in?clientId=d697c531-b03b-4370-a4b3-c26483c4f044&origin=...` in a popup or redirect.
2. **KingsChat Callback**:
   After successful login, KingsChat sends a `POST` request to `https://ccpms.onrender.com/kingschat-callback` with `{ "code": "AUTHORIZATION_CODE", "origin": "..." }`.
3. **Backend Exchange & Profile Fetch**:
   - Backend exchanges `code` for `access_token` via `https://connect.kingsch.at/developer/api/oauth2/token`.
   - Backend fetches profile via `https://connect.kingsch.at/developer/api/user/profile` with `api-key` and `Authorization: Bearer <access_token>` headers.
4. **Role Check & Local JWT Issuance**:
   - Backend verifies username in `AUTHORIZED_USERS`.
   - On success, upserts user in Prisma DB and returns local JWT session tokens to client.
   - On failure (unauthorized username), returns Access Denied error.
