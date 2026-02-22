# GitHub Secrets Checklist
## Add these at: Your Repo → Settings → Secrets and variables → Actions

---

## Android Secrets (required for Google Play)

| Secret Name | Value | How to Get |
|-------------|-------|------------|
| `ANDROID_SIGNING_KEY` | Base64-encoded keystore | Run `keytool` command (see SETUP.md Step 5), then base64 encode |
| `ANDROID_KEY_ALIAS` | `nexusblue` | The alias you used when generating the keystore |
| `ANDROID_KEY_STORE_PASSWORD` | Your keystore password | Password set during `keytool` command |
| `ANDROID_KEY_PASSWORD` | Your key password | Key password set during `keytool` (can be same as above) |
| `GOOGLE_PLAY_SERVICE_ACCOUNT` | JSON key content | Google Play Console → Setup → API access → Create service account |

### Getting the Google Play Service Account JSON

1. Go to [Google Play Console](https://play.google.com/console)
2. Setup → API access → Link to a Google Cloud project
3. Create a service account → grant "Release Manager" role
4. Download the JSON key file
5. Paste the entire JSON content as the secret value (not base64)

---

## iOS Secrets (required for App Store)

| Secret Name | Value | How to Get |
|-------------|-------|------------|
| `IOS_P12_CERTIFICATE` | Base64-encoded .p12 file | Export from Keychain Access after installing the distribution certificate |
| `IOS_P12_PASSWORD` | Certificate password | Password set when exporting the .p12 |
| `APPSTORE_ISSUER_ID` | UUID | App Store Connect → Users → Keys → Issuer ID (top of page) |
| `APPSTORE_KEY_ID` | Key ID string | App Store Connect → Users → Keys → Key ID column |
| `APPSTORE_PRIVATE_KEY` | .p8 file content | App Store Connect → Users → Keys → Download (only available once!) |

### Getting the iOS Distribution Certificate

1. Go to [developer.apple.com](https://developer.apple.com) → Certificates
2. Create a new "Apple Distribution" certificate
3. Download it and double-click to install in Keychain Access
4. Open Keychain Access → Find the certificate → Right-click → Export → Save as .p12
5. Base64 encode it:
   ```bash
   base64 -i certificate.p12 | tr -d '\n'
   ```
6. Paste the result as `IOS_P12_CERTIFICATE`

### Getting the App Store Connect API Key

1. Go to [App Store Connect](https://appstoreconnect.apple.com) → Users and Access → Integrations → App Store Connect API
2. Generate a new key with "App Manager" role
3. Download the .p8 file — **you can only download it once**
4. Save: Key ID (shown in the list), Issuer ID (top of page), .p8 file contents
5. Paste the raw .p8 file content as `APPSTORE_PRIVATE_KEY`

---

## Secrets Status Tracker

Copy and use this to track which secrets are set for each app:

### [App Name] — [Repo Name]

**Android:**
- [ ] `ANDROID_SIGNING_KEY`
- [ ] `ANDROID_KEY_ALIAS`
- [ ] `ANDROID_KEY_STORE_PASSWORD`
- [ ] `ANDROID_KEY_PASSWORD`
- [ ] `GOOGLE_PLAY_SERVICE_ACCOUNT`

**iOS:**
- [ ] `IOS_P12_CERTIFICATE`
- [ ] `IOS_P12_PASSWORD`
- [ ] `APPSTORE_ISSUER_ID`
- [ ] `APPSTORE_KEY_ID`
- [ ] `APPSTORE_PRIVATE_KEY`

---

## Notes

- The Android keystore and its secrets are **reused across all NexusBlue apps** — set them once, copy to each new repo
- The iOS P12 certificate and its password are also reusable across NexusBlue apps (one developer account)
- The App Store Connect API key secrets are account-wide — same values for all NexusBlue apps
- Only `GOOGLE_PLAY_SERVICE_ACCOUNT` may need to be re-generated if permissions change
