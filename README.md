# pass-wordless

A privacy-first password manager for iOS and Android, built with React Native (Expo).

- **Fully local** — no cloud, no accounts, no telemetry.
- **AES-256-GCM encryption** — every entry (label, username, password) is encrypted before it touches storage.
- **Your choice of protection** — unlock with biometrics (Face ID / Touch ID / Fingerprint) or a master password.

---

## Getting started

**Requirements**

- Node.js 20+
- [Expo CLI](https://docs.expo.dev/get-started/installation/) — `npm install -g expo-cli`

**Install**

```bash
npm install
```

**Run**

```bash
npx expo start
```

Press **`i`** for iOS simulator, **`a`** for Android emulator, or scan the QR code with the Expo Go app.

> **Biometric note:** Biometric unlock requires a [development build](https://docs.expo.dev/develop/development-builds/introduction/) because `expo-secure-store`'s `requireAuthentication` option is not supported in Expo Go.
> Run `npx expo run:ios` or `npx expo run:android` to get a dev build, then test on a simulator/device with biometrics enrolled.
> The master-password flow works in Expo Go without any extra steps.

---

## Security model

### How it works

pass-wordless uses [envelope encryption](https://en.wikipedia.org/wiki/Key_encapsulation):

1. A random 256-bit **Data Encryption Key (DEK)** is generated at first launch using the platform's secure RNG.
2. The DEK is protected by your chosen lock method:
   - **Biometric:** the DEK is stored in the platform keychain (`expo-secure-store` with `requireAuthentication: true`). The OS enforces biometric authentication before the key can be read.
   - **Master password:** the DEK is encrypted with a **Key Encryption Key (KEK)** derived via PBKDF2-SHA-256 (100 000 iterations, 16-byte random salt). Only the wrapped DEK, salt, and nonce are persisted — the password and KEK are never stored anywhere.
3. Every password entry is encrypted with AES-256-GCM (12-byte random nonce per entry) before being written to SQLite. The label, username, and password are all part of the encrypted payload — nothing is in plaintext on disk.
4. The DEK lives **in memory only**. It is zeroed when the app goes to background.

### Threat model

**pass-wordless defends against:**

- Physical device theft when the device is locked — all stored data is opaque ciphertext.
- Pulling the SQLite database off the device — entries are indistinguishable from random bytes without the DEK.
- Brute-forcing the master password — 100 000 PBKDF2 iterations make offline dictionary attacks expensive.

**pass-wordless does NOT currently defend against:**

- On-device malware with root / superuser access.
- Screen recording or UI-level side-channel attacks.
- Jailbroken or rooted devices.
- Forgetting the master password — there is no recovery mechanism. This is intentional.
- Switching security mode after setup — currently requires a fresh install (see Roadmap).

---

## Project structure

```
pass-wordless/
├── app/                        # expo-router file-based routes
│   ├── _layout.tsx             # root stack + AuthProvider
│   ├── index.tsx               # auth state router
│   ├── lock.tsx                # lock screen
│   ├── onboarding/
│   │   ├── welcome.tsx
│   │   └── choose-security.tsx
│   └── vault/
│       ├── index.tsx           # entry list
│       └── add.tsx             # add entry form
└── src/
    ├── auth/                   # auth context + biometric helpers
    ├── crypto/                 # AES-256-GCM, PBKDF2, key manager
    ├── storage/                # SQLite DB, settings, entries CRUD
    ├── ui/                     # design tokens, theme, core components
    └── types.ts
```

---

## Roadmap

- [ ] Edit and delete entries
- [ ] Password strength indicator and generator
- [ ] Search / filter entries
- [ ] Switch security mode without reinstall
- [ ] iCloud / Google Drive backup (end-to-end encrypted)
