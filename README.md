# Real-Time Poll Rooms

A full-stack web app for creating polls and collecting votes in real time.

Built by **Asaraf Ali**.

## What it does

- Create a poll with a question and multiple options  
- Get a shareable link anyone can use to vote  
- Results update instantly for all viewers (no refresh needed)  
- Votes and polls are stored permanently in a database  

## Tech Stack

- React + TypeScript + Vite  
- Tailwind CSS + shadcn/ui  
- Supabase (PostgreSQL + realtime subscriptions)  
- Firebase Anonymous Authentication  

Supabase is used for data storage and realtime updates.  
Firebase is used to provide anonymous user identity for anti-abuse.

---

## Fairness / Anti-Abuse Mechanisms

### 1. Firebase Anonymous Authentication

Each visitor is automatically signed in anonymously using Firebase and receives a unique UID.  
This UID is stored with every vote and can be enforced server-side to prevent the same user from voting multiple times.

**What it prevents:** Repeat voting across refreshes and sessions from the same user.

**Limitation:** Clearing browser data or using a new browser creates a new UID.

---

### 2. Device-Based UUID + Database Constraint

Each browser generates a random UUID on first visit and stores it in localStorage.  
Votes are stored using this device ID, and Supabase enforces a unique constraint on `(room_id, voter_id)`.

This makes the database the source of truth even if frontend checks are bypassed.

**What it prevents:** Multiple votes from the same device, API-level abuse, and race conditions.

**Limitation:** Clearing localStorage or using incognito mode generates a new device ID.

---

## Edge Cases Handled

- Less than 2 options blocked during poll creation  
- Empty question validation  
- Invalid poll ID shows a “Poll not found” page  
- Duplicate votes handled gracefully via database error code  
- Page refresh persistence  
- Race conditions avoided by relying on database constraints  

---

## Known Limitations

- No CAPTCHA or IP-based rate limiting  
- Clearing browser data allows re-voting  
- No poll expiry or close mechanism  
- No admin dashboard  
- Anonymous voting only  

---

## What I’d Improve Next

- CAPTCHA (hCaptcha / reCAPTCHA)  
- Poll expiration and auto-close  
- Admin controls (reset / delete polls)  
- IP-based fingerprinting as an additional abuse layer  
- Optional email verification  

---

## Running Locally

```bash
git clone <repo-url>
cd <project-folder>
npm install
npm run dev
