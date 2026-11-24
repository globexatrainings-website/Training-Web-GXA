# Training Video Portal (Next.js)

A simple training-video catalogue. Admins add Google Drive video links and thumbnail image links; trainees visit one public URL, choose a part, and watch videos. No video files are uploaded to your website.

## Included

- Next.js app (App Router)
- 10 dropdown parts: Part 1–15 through Part 136–150
- Up to 15 videos displayed per part
- Responsive video thumbnail grid
- Google Drive embedded playback
- Admin login, add, edit and delete video records
- Supabase database and authentication
- Public trainee viewing; admin-only management

## 1. Create the Supabase backend

1. Create a free project at https://supabase.com/.
2. Open **SQL Editor** in the Supabase dashboard.
3. Paste and run the contents of `supabase/schema.sql`.
4. Open **Authentication → Providers / Sign In** and disable public email sign-ups.
5. Open **Authentication → Users** and create your admin email and password manually.
6. Open **Project Settings → API** and copy the Project URL and anon/public key.

The SQL policy allows public visitors to read videos. Only signed-in users can add, edit or delete. Keep public sign-ups disabled and create only trusted admin accounts.

## 2. Configure the website

1. Copy `.env.example` to `.env.local`.
2. Fill in the Supabase values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Do not use a Supabase `service_role` key in this project or expose it in browser code.

## Trainee login gate

The public homepage now redirects to `/login`. Trainees use one shared access password, configured by the administrator. After login, the browser receives a signed, HTTP-only session cookie that expires after 7 days. The Supabase admin login at `/admin` remains separate.

Add these two additional environment variables in Vercel:

```env
PORTAL_ACCESS_PASSWORD=your-strong-shared-trainee-password
PORTAL_SESSION_SECRET=a-long-random-secret-at-least-32-characters
```

Use a different value for each variable. Keep `PORTAL_SESSION_SECRET` private. Redeploy after adding them. Share the trainee password only with authorised trainees. This is a shared-password gate, not individual trainee accounts.

## 3. Run locally

Install Node.js 20.9 or newer, then run:

```bash
npm install
npm run dev
```

Open http://localhost:3000. Admin page: http://localhost:3000/admin.

## 4. Upload to GitHub and deploy

1. Create a new **public or private** GitHub repository.
2. Upload the contents of this folder (not the ZIP file itself).
3. In https://vercel.com/, import that GitHub repository.
4. In Vercel project settings, add all four environment variables from `.env.local` (the two Supabase values plus the two portal-login values).
5. Deploy. Vercel will detect Next.js automatically.
6. Open the deployed URL and test `/admin` and the trainee homepage.

**Important:** GitHub Pages does not run a Next.js server app with this setup. Use Vercel (recommended) or another host that supports Next.js.

## 5. Add a video

1. In Google Drive, open the video and choose **Share → General access → Anyone with the link → Viewer**.
2. Copy the video link.
3. Share the thumbnail image with the same Viewer access and copy its image link. A direct image URL such as `https://drive.google.com/uc?export=view&id=FILE_ID` is usually suitable.
4. Visit your deployed site at `/admin` and sign in.
5. Enter title, part, video link and thumbnail link. Click **Add video**.

The portal converts common Google Drive `/file/d/FILE_ID/view` links into an embedded `/preview` player URL.

## Notes and limitations

- Each part is intended to contain 15 videos. The public page displays up to 15 in the selected part.
- The portal stores links and metadata in Supabase; the video files remain in Google Drive.
- Anyone with the public portal URL can view the catalogue. Anyone who obtains a Drive link may also be able to access that Drive file, because Drive sharing is set to “Anyone with the link”.
- Google Drive preview playback may be affected by Google account, file-size, playback, or bandwidth restrictions. Test with an incognito browser before sharing with trainees.
- This is a lightweight video library, not an LMS. It does not include trainee accounts, course progress, attendance, quizzes or certificates.
