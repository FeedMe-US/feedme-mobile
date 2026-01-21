# Running the FeedMe App

This guide ensures you can run the app on your iPhone with Expo Go **without needing an Expo account login**.

## Quick Start

```bash
npm run dev
```

This starts Expo in **tunnel mode** (most reliable for iPhone). You'll see a QR code in the terminal within 10-20 seconds.

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with tunnel (recommended for iPhone) |
| `npm run dev:lan` | Start with LAN (faster, but may not work on all networks) |
| `npm run dev:clear` | Clear Metro cache + start with tunnel |
| `npm run ios` | Open in iOS Simulator (requires Xcode) |
| `npm run android` | Open in Android Emulator |
| `npm run web` | Open in web browser |

## Running on iPhone with Expo Go

### Step 1: Install Expo Go
- Download **Expo Go** from the App Store
- No account login required

### Step 2: Start the Dev Server
```bash
npm run dev
```

### Step 3: Scan QR Code
- Wait 10-20 seconds for Metro to finish bundling
- Look for the **QR code** in your terminal (ASCII art)
- Open **Expo Go** on your iPhone
- Tap **"Scan QR Code"** (camera icon at bottom)
- Point camera at the QR code in your terminal

### What You Should See

**In Terminal:**
```
Starting project at /Users/.../FeedMe
Starting Metro Bundler
Waiting on http://localhost:8081
› Metro waiting on exp://xxx-xxx.xxx.xxx.tunnel.exp.direct:80
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

**QR Code appears as ASCII art** - a large block of characters forming a square pattern.

## Troubleshooting

### QR Code Doesn't Appear

**Wait longer:** Metro bundling can take 30-60 seconds on first run. The QR code appears **after** bundling completes.

**Check terminal output:** Look for:
- `Metro waiting on exp://...`
- Any error messages in red

**Try clearing cache:**
```bash
npm run dev:clear
```

### "simctl" Error Messages

**You'll see:**
```
Unable to run simctl:
Error: xcrun simctl help exited with non-zero code: 72
```

**This is NORMAL and can be ignored.** It's just checking for iOS Simulator tools. It doesn't affect:
- Running on physical iPhone
- QR code generation
- Tunnel mode

**Action:** Ignore it completely.

### Port 8081 is Busy

**Error:**
```
Port 8081 is running this app in another window
```

**Solution 1: Kill the existing process**
```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9

# Or kill all Expo/Metro processes
pkill -f "expo\|metro"
```

**Solution 2: Use a different port**
```bash
# Expo will prompt you, or force a port:
PORT=8082 npx expo start --tunnel
```

### Tunnel Connection Issues

If tunnel mode fails, try LAN mode:
```bash
npm run dev:lan
```

**Note:** LAN mode requires your phone and computer to be on the same WiFi network.

### Metro Bundler Stuck

If Metro seems stuck:
1. Press `Ctrl+C` to stop
2. Clear cache: `npm run dev:clear`
3. Restart: `npm run dev`

## Environment Sanity Check

Before running, verify your setup:

### 1. Node.js Version
```bash
node --version
```
**Required:** Node.js 18+ (you have v24.11.1 ✅)

### 2. Install Dependencies
```bash
npm install
```

### 3. Verify Metro is Listening
After running `npm run dev`, check:
```bash
curl http://localhost:8081/status
```
Should return: `packager-status:running`

### 4. Check for Port Conflicts
```bash
lsof -i:8081
```
If something is using port 8081, kill it (see "Port 8081 is Busy" above).

## Development Workflow

1. **Start dev server:** `npm run dev`
2. **Wait for QR code** (10-20 seconds)
3. **Scan with Expo Go** on iPhone
4. **Make code changes** - app reloads automatically
5. **Shake phone** or press `Cmd+D` (iOS) for dev menu

## No Expo Account Required

This project is configured for **local development only**. You don't need:
- Expo account login
- EAS (Expo Application Services)
- Any cloud services

Everything runs locally on your machine.

## Common Issues

### "Unable to determine the default URI scheme"
- This is a warning, not an error
- Tunnel mode works without it
- Can be ignored

### "Development build" warnings
- These are informational
- Expo Go works fine for development
- Can be ignored

### App doesn't reload after changes
- Shake phone → "Reload"
- Or press `r` in terminal

### White screen on phone
- Check terminal for errors
- Try `npm run dev:clear`
- Restart Expo Go app

## Getting Help

If you're stuck:
1. Check terminal for error messages (red text)
2. Verify Metro is running: `curl http://localhost:8081/status`
3. Try `npm run dev:clear` to reset
4. Check this guide's troubleshooting section

---

**Remember:** The QR code appears **after** Metro finishes bundling. Be patient on first run (30-60 seconds).

