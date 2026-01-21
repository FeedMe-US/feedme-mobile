# Quick Start Checklist

## Step-by-Step: Run on iPhone

### ✅ Pre-flight Check
```bash
# 1. Verify Node version (need 18+)
node --version

# 2. Install dependencies (if not done)
npm install

# 3. Kill any existing Expo processes
pkill -f "expo\|metro"
```

### 🚀 Start the Server
```bash
npm run dev
```

### 👀 What to Look For

**In Terminal (within 10-20 seconds):**
```
Starting project at /Users/.../FeedMe
Starting Metro Bundler
Starting tunnel...
› Metro waiting on exp://xxx-xxx.xxx.xxx.tunnel.exp.direct:80
```

**Then you'll see:**
- A **large QR code** (ASCII art - looks like a square made of characters)
- Text: `Scan the QR code above with Expo Go`

### 📱 On Your iPhone

1. **Open Expo Go app** (download from App Store if needed)
2. **Tap "Scan QR Code"** (camera icon at bottom of home screen)
3. **Point camera at the QR code** in your terminal
4. **Wait for app to load** (may take 10-30 seconds first time)

### ✅ Success Indicators

- Terminal shows: `Metro waiting on exp://...`
- QR code is visible (ASCII art)
- Expo Go app shows "Connecting..."
- App loads on your phone

### ❌ If QR Code Doesn't Appear

1. **Wait longer** - First run takes 30-60 seconds
2. **Check for errors** - Look for red text in terminal
3. **Try clearing cache:**
   ```bash
   npm run dev:clear
   ```
4. **Check RUNNING.md** for detailed troubleshooting

### 🔧 Common Issues

**"simctl" error:**
- ✅ **IGNORE IT** - This is normal, doesn't affect iPhone

**Port 8081 busy:**
```bash
lsof -ti:8081 | xargs kill -9
npm run dev
```

**Tunnel fails:**
```bash
npm run dev:lan  # Try LAN mode instead
```

---

**Full documentation:** See [RUNNING.md](./RUNNING.md) for complete guide.

