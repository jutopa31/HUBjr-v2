# 🚀 HUBjr - Vercel Deployment Guide

## Environment Variables Configuration

To deploy HUBjr to Vercel with secure Claude Vision OCR, you need to configure the following environment variables:

### 1. Via Vercel Dashboard (Recommended)

1. Go to your project at [vercel.com](https://vercel.com)
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

#### Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

#### Anthropic API (Secure - Server-side only)
```
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key
```

4. For each variable:
   - Select environments: **Production**, **Preview**, and **Development**
   - Click **Save**

5. **Redeploy** your application to apply the new variables

### 2. Via Vercel CLI (Alternative)

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Login to Vercel
vercel login

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add ANTHROPIC_API_KEY

# You'll be prompted to enter the value and select environments
# Choose: Production, Preview, Development (all three)
```

## 🔒 Security Architecture

### Claude Vision OCR - Secure Implementation

The application uses a **secure server-side API route** to protect your Anthropic API key:

- **Client-side**: `src/evolucionador/services/claude/claudeVisionService.ts`
  - Makes requests to `/api/ocr` endpoint
  - No direct API key exposure in browser

- **Server-side**: `pages/api/ocr.ts`
  - Handles Claude API requests server-side
  - Uses `ANTHROPIC_API_KEY` environment variable (not exposed to client)
  - Returns processed OCR results to client

### Why This Matters

❌ **Old (Insecure) Approach:**
- Used `NEXT_PUBLIC_ANTHROPIC_API_KEY`
- API key visible in browser JavaScript
- Anyone could extract and abuse your API key

✅ **New (Secure) Approach:**
- Uses `ANTHROPIC_API_KEY` (no `NEXT_PUBLIC_` prefix)
- API key only exists on server
- Browser never sees the actual API key

## 📋 Deployment Checklist

Before deploying to Vercel:

- [ ] Configure `NEXT_PUBLIC_SUPABASE_URL` in Vercel
- [ ] Configure `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel
- [ ] Configure `ANTHROPIC_API_KEY` in Vercel (server-side only)
- [ ] Remove `NEXT_PUBLIC_ANTHROPIC_API_KEY` if it exists (deprecated)
- [ ] Verify `.env.local` is in `.gitignore` (never commit secrets)
- [ ] Test OCR functionality after deployment

## 🧪 Testing After Deployment

1. Navigate to the Evolucionador module
2. Click the **OCR** button (available on mobile and desktop)
3. Upload a medical document (PDF or image)
4. Verify that Claude Vision processes the document
5. Check Vercel logs for any API errors

## 🔧 Troubleshooting

### "ANTHROPIC_API_KEY not configured on server"

**Solution**: Add `ANTHROPIC_API_KEY` to Vercel environment variables and redeploy.

### OCR returns 401 error

**Solution**:
- Verify your Anthropic API key is valid
- Check that it's configured in Vercel (not just locally)
- Ensure you redeployed after adding the variable

### OCR returns 404 model error

**Solution**:
- Your API key may not have access to Claude 3 Opus
- Check `src/evolucionador/config/claude.config.ts` for correct model name
- Try a different model that your key has access to

## 📞 Support

For issues with:
- **Vercel deployment**: Check Vercel logs in dashboard
- **Supabase**: Verify URL and anon key in Supabase project settings
- **Anthropic API**: Verify key at [console.anthropic.com](https://console.anthropic.com)

## 🔐 API Key Rotation

For security, rotate your Anthropic API key every 90 days:

1. Generate new key at Anthropic Console
2. Update `ANTHROPIC_API_KEY` in Vercel
3. Redeploy application
4. Revoke old key after verifying new one works
