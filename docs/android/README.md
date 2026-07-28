# Android App Guide

This project ships the Android app as a Capacitor wrapper around the static Next.js mobile build. Android is the only native target; desktop users should use the browser version.

## Requirements

- Node.js and `pnpm` from the project setup.
- Android Studio with:
  - Android SDK Platform-Tools
  - Android SDK Build-Tools
  - An emulator, or a physical Android phone
- Java 17 or newer. Android Studio's bundled JBR works. The project scripts try to use it automatically from:

```powershell
C:\Program Files\Android\Android Studio\jbr
```

If Gradle says it is using Java 8, run the native build with:

```powershell
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
```

## Useful Commands

```bash
pnpm install
pnpm mobile:build
pnpm android:sync
pnpm android:open
pnpm android:run
```

- `mobile:build` creates the static Next.js export in `out/`.
- `android:sync` copies `out/` into the Android project and syncs Capacitor plugins.
- `android:open` opens the native project in Android Studio.
- `android:run` builds and deploys to a connected device or emulator.
- `cap:telemetry:off` disables Capacitor CLI telemetry on your machine.

To build a debug APK without deploying:

```powershell
cd android
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
.\gradlew.bat assembleDebug
```

The debug APK is written to:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## Device Setup

For a physical phone:

1. Enable Developer Options.
2. Enable USB debugging.
3. Connect by USB, or enable Wireless debugging and pair/connect through Android Studio.
4. Confirm the phone is visible:

```bash
adb devices
```

If `android:run` says `No devices found`, open Android Studio Device Manager, start an emulator, or reconnect the phone and accept the USB debugging prompt.

On Xiaomi devices, also check Developer Options for MIUI-specific USB install/debug permissions if APK installation fails.

## Online Cross-Play

The Android app and browser version use the same PeerJS serverless online mode by default. That means these combinations should work without a database:

- Browser creates game, Android joins by code.
- Android creates game, browser joins by shared link.
- Android joins from a native deep link.

Invite links are built from the public site URL, not from the Capacitor local app URL. The default public origin is:

```text
https://example.com
```

Set `NEXT_PUBLIC_SITE_URL` before building if the production domain changes.

## Invite Links And Deep Links

The app supports:

- Web invite: `https://example.com/?game=<code>`
- Custom Android scheme: `connect4://join?game=<code>`

Test deep links with:

```bash
adb shell am start -a android.intent.action.VIEW -d "connect4://join?game=<code>" com.example.connect4
adb shell am start -a android.intent.action.VIEW -d "https://example.com/?game=<code>" com.example.connect4
```

The custom `connect4://` scheme works without domain verification. Verified HTTPS Android App Links require `/.well-known/assetlinks.json` on the production domain with the final release or Play App Signing SHA-256 fingerprint.

## Play Store Release

The Android project compiles and targets API 36, builds an Android App Bundle, runs release lint, enables R8/resource shrinking, blocks cleartext traffic, and excludes local WebView data from Android backup and device transfer.

Create a private upload key and copy the signing template:

```powershell
cd android
keytool -genkeypair -v -keystore connect4-upload-key.jks -alias connect4-upload -keyalg RSA -keysize 4096 -validity 10000
Copy-Item keystore.properties.example keystore.properties
```

Fill in the local passwords in `android/keystore.properties`. The keystore and real properties file are ignored by Git and must be backed up securely outside the repository.

Build a signed, upload-ready AAB with an immutable version code:

```powershell
cd ..
corepack pnpm android:bundle -- --version-code=1 --version-name=1.0.0
```

The bundle is written to:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

For an unsigned local/CI verification only:

```powershell
corepack pnpm android:bundle:check -- --version-code=1 --version-name=1.0.0
```

Never upload the unsigned verification bundle. Enroll in Play App Signing and upload to Internal testing first. After Play signing is active, deploy `assetlinks.json` with the Play app-signing SHA-256 certificate, not only the upload-key certificate.

See [Android distribution](play-store/README.md) for the public distribution overview.

## Troubleshooting

- `Dependency requires at least JVM runtime version 17`: your shell is using Java 8. Set `JAVA_HOME` to Android Studio JBR.
- `No devices found`: start an emulator or confirm `adb devices` lists the phone as `device`.
- `ERR_UNKNOWN` while installing APK: reconnect the phone, confirm USB debugging prompts, and check Xiaomi/MIUI install permissions.
- HTTPS app link opens the browser instead of the app: deploy a valid `assetlinks.json` for the final signing certificate and reinstall the app.
- Shared invite opens a browser URL: that is expected fallback behavior when verified app links are not configured or the app is not installed.
