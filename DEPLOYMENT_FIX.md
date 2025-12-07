# 🔧 Deployment Fix: Runtime Error

## ❌ Error Encountered

```
Error: Function Runtimes must have a valid version, for example `now-php@1.0.0`
```

## ✅ Solution

I've **removed the `vercel.json` file** because:

1. **Vercel auto-detects Python files** in the `/api` directory for Next.js projects
2. The `vercel.json` was causing a runtime configuration error
3. No configuration file is needed - Vercel handles it automatically

## 📁 Current Setup (Correct)

- ✅ `/api/fetch-earthquakes.py` - Python serverless function (at root level)
- ✅ `/requirements.txt` - Python dependencies (at root level)
- ✅ `app/api/earthquakes/route.ts` - Updated to call Python function
- ❌ **No `vercel.json` needed** - Removed to fix the error

## 🚀 Deploy Again

1. **Push the changes:**
   ```bash
   git add .
   git commit -m "Remove vercel.json - auto-detect Python"
   git push
   ```

2. **Redeploy on Vercel** - The error should be gone!

## ✅ What Will Happen

- Vercel will auto-detect the Python file in `/api` directory
- Install dependencies from `requirements.txt`
- Your Node.js route will call the Python function
- Everything should work! 🎉

## 📝 Why This Works

Vercel's Next.js integration automatically:
- Detects `.py` files in the root `/api` directory
- Sets up the Python runtime
- Installs dependencies from `requirements.txt`
- No manual configuration needed!

