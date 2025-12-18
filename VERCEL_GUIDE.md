# Vercel Hosting Guide - Global Hunters Association

Follow these steps to host your app for free on Vercel and enable the PWA features for mobile hunters.

## 1. Prepare Your Repository
Ensure your latest code is pushed to a GitHub repository.

## 2. Connect to Vercel
1. Go to [Vercel.com](https://vercel.com) and sign in with your GitHub account.
2. Click **"Add New..."** and select **"Project"**.
3. Import your `global-hunters-association` repository.

## 3. Configure Environment Variables
Before clicking "Deploy", you **MUST** add your Supabase environment variables. You can find these in your `.env.local` file or your Supabase Dashboard (Settings > API).

Add these two variables in the Vercel "Environment Variables" section:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 4. Deploy
Click **"Deploy"**. Vercel will build and host your app automatically. Once finished, you'll get a production URL (e.g., `global-hunters-association.vercel.app`).

## 5. Install on Mobile
Open your new Vercel URL on your mobile device:
- **iOS (Safari)**: Tap the **Share** button and select **"Add to Home Screen"**.
- **Android (Chrome)**: Tap the **three dots** and select **"Install app"** or **"Add to Home Screen"**.

---
**Note:** I've already optimized the build process and fixed all type errors to ensure this deployment is seamless! 🚀
