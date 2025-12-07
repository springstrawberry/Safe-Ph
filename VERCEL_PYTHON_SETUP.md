# Vercel Python Setup Guide

## ✅ Solution: Python Serverless Function on Vercel

I've set up your code to work on Vercel by creating a Python serverless function that Vercel can execute natively!

## 📁 Files Created/Updated

1. **`api/fetch-earthquakes.py`** - Python serverless function for Vercel
2. **`requirements.txt`** - Python dependencies for Vercel
3. **`app/api/earthquakes/route.ts`** - Updated to call Python function on Vercel, or execute locally in dev

## 🚀 How It Works

### On Vercel (Production):
- Your Node.js route detects it's on Vercel
- Calls the Python serverless function via HTTP (`/api/fetch-earthquakes`)
- Vercel executes the Python function natively (with all dependencies from `requirements.txt`)
- Returns the data to your route

### Local Development:
- Your Node.js route executes the Python script directly (as before)
- Works exactly as it does now

## 📋 Setup Steps for Vercel

1. **Push your code to GitHub** (if not already)

2. **Deploy to Vercel:**
   - Connect your GitHub repo to Vercel
   - Vercel will automatically detect:
     - Next.js framework
     - Python files in `/api` directory
     - `requirements.txt` for Python dependencies

3. **Vercel Configuration:**
   - Vercel will automatically install Python dependencies from `requirements.txt`
   - The Python serverless function will be available at `/api/fetch-earthquakes`

4. **That's it!** Your code will automatically:
   - Use the Python serverless function on Vercel
   - Use local Python script execution in development

## 🔍 Testing

- **Local**: Run `npm run dev` - should work as before
- **Vercel**: Deploy and the Python function will be called automatically

## 📝 Notes

- The Python serverless function uses the same logic as your existing script
- All dependencies (pylindol, pandas, etc.) will be installed by Vercel from `requirements.txt`
- No code changes needed - it automatically detects the environment!

## 🎯 Benefits

✅ Works on Vercel (Python serverless function)  
✅ Works locally (direct Python execution)  
✅ No breaking changes  
✅ Automatic environment detection  
✅ Same data source and logic  

