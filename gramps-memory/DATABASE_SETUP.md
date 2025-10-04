# Database Setup Guide

## Quick Setup for Gramps Memory

To fix the "Error fetching memories" issue, you need to set up the database tables in your Supabase project.

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"

### Step 2: Run the Database Schema

Copy and paste the entire contents of `database-schema.sql` into the SQL editor and click "Run".

### Step 3: Verify Tables Created

After running the schema, you should see these tables in your Supabase dashboard:
- `memories`
- `blog_posts` 
- `conversations`
- `messages`

### Step 4: Check Authentication

Make sure your Supabase project has authentication enabled:
1. Go to "Authentication" → "Settings"
2. Ensure "Enable email confirmations" is configured as needed
3. Check that your site URL is set correctly

### Step 5: Environment Variables

Make sure your `.env.local` file has the correct Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Troubleshooting

If you're still getting errors:

1. **Check the browser console** for detailed error messages
2. **Verify table creation** in Supabase dashboard under "Table Editor"
3. **Test authentication** by trying to sign up/sign in
4. **Check RLS policies** are enabled for all tables

### Alternative: Use Without Database

The app will work without the database - conversations will function but memories won't be saved. You'll see a warning message in the UI if the database isn't set up.

---

**Need help?** Check the browser console for specific error messages that will help identify the exact issue.
