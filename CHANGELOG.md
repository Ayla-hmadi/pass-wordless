# Changelog

All notable changes to pass-wordless are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added

- **Finance Tracker module** — a fully offline personal finance tracker living alongside the password vault, accessible via a bottom tab bar.
- **Dashboard** — monthly overview with net balance, income/expense/investment totals, savings rate, recent transactions, budget progress, and top spending categories. Month navigator to browse history.
- **Add Transaction** — income, expense, and investment entries with category picker, date selector (prev/next day), optional payment method, notes, and recurring toggle with frequency selection.
- **Transaction History** — full chronological list with real-time search and type filter (all / income / expense / investment). Long-press to delete, tap to edit.
- **Edit Transaction** — all fields editable; includes delete action. Updates propagate instantly across the app.
- **Budgets** — per-category monthly spending limits with live progress bars, over-budget warnings, and a bulk overview of total budget vs spent. Add, edit, and remove budgets.
- **Insights** — 6-month income vs expenses bar chart, category breakdown with horizontal progress bars, smart summary (avg daily spend, savings rate, top category).
- **Recurring Payments** — track subscriptions and regular income/expenses with frequency (daily, weekly, biweekly, monthly, yearly), next-due-date badges, and pause/resume/delete controls.
- **Finance data model** — SQLite tables: `finance_categories`, `finance_payment_methods`, `finance_transactions`, `finance_budgets`, `finance_recurring`. Seeded with 23 default expense/income/investment categories and 4 payment methods on first launch.
- **Bottom tab bar** — persistent `TabBar` component switches between Vault and Finance at the home level.

---

## [0.1.0] — 2026-04-23

### Added

- **Onboarding** — welcome screen and security-type chooser (biometric or master password).
- **Biometric unlock** — Face ID, Touch ID, and Android Fingerprint via `expo-local-authentication` and `expo-secure-store` with `requireAuthentication: true`. DEK is stored in the OS keychain, gated by biometrics.
- **Master-password unlock** — PBKDF2-SHA-256 key derivation (100 000 iterations, 16-byte random salt). The password and derived key are never persisted.
- **AES-256-GCM encryption** — every entry (label, username, password) is encrypted at rest with a unique 12-byte nonce per entry. Envelope encryption: the DEK wraps entries; the KEK wraps the DEK.
- **Auto-lock** — the DEK is zeroed from memory when the app goes to background; the vault requires re-authentication on foreground.
- **Vault home** — list of entries with tap-to-expand. Expanded card shows masked password and a Copy button (clipboard auto-cleared after 30 seconds).
- **Add entry** — form with label, optional username, and password (with show/hide toggle). Encrypted and saved on submit.
- **Design system** — violet accent palette, dark/light theme, Reanimated spring animations, haptic feedback on primary interactions.
