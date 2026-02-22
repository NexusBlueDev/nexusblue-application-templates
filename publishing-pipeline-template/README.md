# NexusBlue Publishing Pipeline Template
## Capacitor + GitHub Actions — Google Play & App Store

Reusable pipeline for publishing any NexusBlue PWA to app stores.
Set up once per app. The Android keystore and iOS certificates are reused across all apps.

---

## Files in This Template

| File | Description |
|------|-------------|
| `SETUP.md` | Complete step-by-step setup guide |
| `SECRETS_CHECKLIST.md` | All GitHub Secrets needed + how to get each one |
| `capacitor.config.json` | Capacitor config — update `appId` and `appName` |
| `package.json` | npm dependencies — update `name` |
| `.github/workflows/android.yml` | Auto-build + upload to Google Play |
| `.github/workflows/ios.yml` | Auto-build + upload to TestFlight |
| `ios/ExportOptions.plist` | iOS export config — copy as-is, no changes needed |

---

## Quick Start

1. Read `SETUP.md` fully before starting
2. Follow setup steps 1–7 in order
3. Copy the 4 files that need changes and update the `[PLACEHOLDER]` values:
   - `capacitor.config.json` → `appId`, `appName`
   - `package.json` → `name`
   - `.github/workflows/android.yml` → `packageName`
   - `.github/workflows/ios.yml` → `bundle-id`
4. Add all secrets from `SECRETS_CHECKLIST.md` to your repo
5. Push to `main` — builds trigger automatically

---

## 4 Values to Change Per App

| File | Field | Example |
|------|-------|---------|
| `capacitor.config.json` | `appId` | `com.nexusblue.juniorjarviscareer` |
| `capacitor.config.json` | `appName` | `Junior Jarvis Career` |
| `package.json` | `name` | `nexusblue-juniorjarviscareer` |
| `android.yml` | `packageName` | `com.nexusblue.juniorjarviscareer` |
| `ios.yml` | `bundle-id` | `com.nexusblue.juniorjarviscareer` |

Everything else — workflow logic, signing steps, export options — stays the same.

---

## Shared Secrets (Set Once, Copy to Each New Repo)

These secrets are the same for every NexusBlue app:

- `ANDROID_SIGNING_KEY` — same keystore for all Android apps
- `ANDROID_KEY_ALIAS` — `nexusblue`
- `ANDROID_KEY_STORE_PASSWORD` — same password
- `ANDROID_KEY_PASSWORD` — same password
- `IOS_P12_CERTIFICATE` — same distribution certificate
- `IOS_P12_PASSWORD` — same password
- `APPSTORE_ISSUER_ID` — same account-level value
- `APPSTORE_KEY_ID` — same account-level value
- `APPSTORE_PRIVATE_KEY` — same account-level value

Only `GOOGLE_PLAY_SERVICE_ACCOUNT` is app-specific if you use separate Play Console service accounts.

---

## What Each Pipeline Does

### Android (`android.yml`)
1. Checks out code
2. Installs Node.js and npm dependencies
3. Runs `npx cap sync android` to inject web assets into the Android project
4. Builds a signed Release AAB (Android App Bundle) using Gradle
5. Signs it with your keystore via `r0adkll/sign-android-release`
6. Uploads to Google Play internal track via `r0adkll/upload-google-play`

### iOS (`ios.yml`)
1. Checks out code on a macOS runner (free — no Mac needed)
2. Installs Node.js and npm dependencies
3. Runs `npx cap sync ios` to inject web assets into the iOS project
4. Installs your distribution certificate and downloads provisioning profiles
5. Archives and exports the app with `xcodebuild`
6. Uploads to TestFlight via `apple-actions/upload-testflight-build`

---

## Release Flow After Successful Pipeline

### Android
- Build lands in Google Play internal track → test it on a device
- Promote to: internal → closed testing → open testing → production

### iOS
- Build lands in TestFlight → test it via TestFlight app
- Submit for App Review → release to App Store

---

## Existing NexusBlue Apps Using This Pipeline

| App | App ID | Status |
|-----|--------|--------|
| Junior Jarvis | `com.nexusblue.juniorjarvis` | Ready to set up |
| Junior Jarvis Career | `com.nexusblue.juniorjarviscareer` | Ready to set up |
