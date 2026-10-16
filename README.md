# GEO — videography portfolio

A static Astro + TypeScript portfolio with a separate Sanity Studio, YouTube playback, and Cloudflare Pages deployment. There is no application server or browser-side Sanity API call: published content is read at build time.

## Run locally

Use Node.js 24 LTS and npm 11 (the Node version is recorded in `.node-version`). From this directory:

```sh
npm install
npm run dev
```

Open the local address printed by Astro (normally http://localhost:4321). With no Sanity variables set, the site uses three explicitly labelled demonstration projects, original placeholder illustrations, and Big Buck Bunny sample playback. Demo pages are marked `noindex` and blocked in `robots.txt`. Replace all sample content before launch.

Dependencies use explicit versions, with a committed `package-lock.json` for reproducible installations. Use `npm ci` for a clean install from that lockfile. Sanity validates dependency ranges during startup, so avoid replacing numeric versions with tags such as `latest`.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local Astro development |
| `npm run check` | Astro / TypeScript checks, including Studio |
| `npm test` | Tests for accepted and rejected video links |
| `npm run build` | Generate the website in `dist/` |
| `npm run preview` | Preview a production website build |
| `npm run studio` | Start the editing dashboard, normally on port 3333 |
| `npm run studio:build` | Build Studio into `studio/dist/` |
| `npm run studio:deploy` | Deploy Studio to Sanity's hosting |

## Connect Sanity

1. Create a **Free** Sanity project at https://www.sanity.io/manage. Create a **public** dataset named `production`. No read or write token is needed by this website. Public dataset content must be suitable for public access; keep private client material elsewhere.
2. Copy the example environment files:

   ```sh
   cp .env.example .env
   cp studio/.env.example studio/.env
   ```

3. In the root `.env`, set `SANITY_PROJECT_ID` and `SANITY_DATASET=production`. In `studio/.env`, set `SANITY_STUDIO_PROJECT_ID` to the same project ID and `SANITY_STUDIO_DATASET=production`.
4. Run `npm run studio`. Log into the Sanity project. If necessary, add `http://localhost:3333` to its API → CORS origins with credentials allowed.
5. Open **Website settings**. Fill in your name, headline, introduction, about copy, email, location and services, then **Publish**. This singleton is saved as document ID `siteSettings`; the website reads that specific document.
6. Open **Films & projects** and add a project. Generate its page address, add its category, year, YouTube link, cover image and image description, then publish. Public or unlisted YouTube videos must have embedding enabled and be viewable outside YouTube. Unlisted links are shareable, not private.
7. Restart Astro after changing environment variables. Run `npm run check`, `npm test`, and `npm run build`.

Once either Sanity variable is supplied, **both are required**. A Sanity API failure, missing published Website settings document, or invalid published project stops the build; it never silently substitutes demo content. A connected dataset with zero projects displays an empty state.

### Client editing dashboard

Run `npm run studio:deploy`, authenticate as the project owner, and choose a unique Studio hostname when prompted. The result is a hosted `*.sanity.studio` dashboard. Add its origin to Sanity's CORS configuration if deployment has not already done so. Invite the client to the Sanity project.

Sanity Free provides Administrator and Viewer roles; the client needs Administrator to edit. A restricted Editor role requires a paid plan. Studio access is authenticated even though the published dataset is public. A developer deploys Studio again when its schema changes; ordinary client content edits need no Studio deployment.

Do not add the website's `dist` output and Studio's `dist` output to the same Cloudflare project. They are separate applications.

## Deploy the website to Cloudflare Pages

1. Push this directory to a GitHub repository, including the generated lockfile. This starter does not create a repository or external accounts automatically.
2. In Cloudflare, create a **Pages** project connected to that repository. Use these settings:

   | Setting | Value |
   | --- | --- |
   | Production branch | Your chosen main branch |
   | Root directory | Repository root |
   | Build command | `npm run build` |
   | Output directory | `dist` |
   | `NODE_VERSION` | `24` |
   | `SANITY_PROJECT_ID` | Your project ID |
   | `SANITY_DATASET` | `production` |
   | `SITE_URL` | Your final origin, e.g. `https://films.example.com` |

3. Publish Website settings and your real projects before the first connected build. Set the variables for preview builds too if you want them to use Sanity.
4. After deployment, attach your domain if desired. Set `SITE_URL` to the final public URL and rebuild to generate correct canonical links and sitemap entries. Without it, the site intentionally omits canonical links and sitemap URLs rather than guessing an origin.

No Cloudflare adapter, Worker or Functions directory is needed: `output: 'static'` creates plain files. Cloudflare serves a real `404.html` for unknown paths. The free hosting plan has build and other limits; verify the current terms before launch. Embedded YouTube traffic is served by YouTube, not your Cloudflare project.

## Automatic rebuild when the client clicks Publish

There is one small piece of account configuration to complete after both services exist:

1. Cloudflare Pages → your project → **Settings → Builds & deployments → Deploy hooks**. Create a hook named `Sanity publish` targeting your production branch. Copy its URL.
2. Sanity Manage → your project → **API → Webhooks → Create webhook**.
3. Configure:
   - **URL:** the Cloudflare deploy hook URL.
   - **Dataset:** `production`.
   - **HTTP method:** `POST`.
   - **Trigger on:** Create, Update, Delete.
   - **Drafts / versions:** keep draft and version events disabled.
   - **Filter:** the expression below.
   - **Projection:** `{ "documentId": coalesce(after()._id, before()._id) }`.
   - Enable the webhook.

   ```groq
   coalesce(after()._type, before()._type) in ["project", "siteSettings"]
   && !(coalesce(after()._id, before()._id) in path("drafts.**"))
   && !(coalesce(after()._id, before()._id) in path("versions.**"))
   ```

4. Verify it: edit a draft and confirm no build starts, then publish and confirm Cloudflare starts a build. Check the deployed page after it finishes. Also verify unpublishing a project removes its page and listing after a rebuild. The filter reads before/after state so deletion events are included.

The client now only needs **Publish**. Sanity calls the hook, Astro reads fresh published content (`useCdn: false`), and Cloudflare deploys the generated pages. Existing pages remain available while a new build runs; a failed build leaves the last successful deployment live. Content changes are not live until deployment completes, and already-open browser tabs need refreshing.

Keep the deploy hook URL private: possession of it allows triggering builds. It does not belong in source code, browser JavaScript, or a public content document. A burst of publishes can create multiple builds; avoid publishing every minor edit individually and monitor your plan's build allowance. Hook configuration and end-to-end publishing require your own Sanity and Cloudflare accounts and are not preconfigured by this scaffold.

## Project structure

```text
src/
  components/VideoPlayer.astro   Click-to-load YouTube player
  layouts/Layout.astro          Navigation, footer and metadata
  lib/content.ts                Typed build-time query and explicit demo mode
  lib/video.ts                  Shared safe YouTube link parser
  pages/index.astro             Portfolio, category filters, about and contact
  pages/work/[slug].astro       Generated project pages
  pages/404.astro               Missing-page screen
  pages/robots.txt.ts           Crawl rules
  pages/sitemap.xml.ts          Published project sitemap
  styles/global.css            Responsive styling
studio/
  sanity.config.ts              Studio and singleton settings navigation
  schemaTypes/                  Editable projects and website settings
public/
  images/                       Local demo artwork
  _headers                      Cloudflare static response headers
tests/                          Video link tests
```

## Playback and launch notes

- The iframe is created only after a visitor presses Play, using YouTube's privacy-enhanced embed origin. Loading YouTube still makes third-party requests and is subject to its policies, branding and possible advertising. Add appropriate privacy information before launch.
- Video playback still works without JavaScript through the visible YouTube link. Category controls are only shown when JavaScript is available; all projects otherwise remain visible.
- The site uses Google Fonts with system fallbacks. Self-host or replace them if you want to remove those external font requests.
- Contact is a `mailto:` link, so there is no paid form service or stored enquiry data. Replace the demo `hello@example.com` address in Website settings.
- Cover images use Sanity's image service, so image bandwidth counts against Sanity's allowance. Video files stay on YouTube.
- Changing a published slug changes its URL. Add a Cloudflare `public/_redirects` entry when renaming an existing page, e.g. `/work/old-name/ /work/new-name/ 301`.
- The static demo, TypeScript checks, Studio build, connected content build, and publish webhook should all be verified before production launch. No hosted service has been provisioned by this starter.

Official references: [Astro static rendering](https://docs.astro.build/en/guides/on-demand-rendering/), [Sanity Studio configuration](https://www.sanity.io/docs/studio/configuration), [Sanity webhook filters](https://www.sanity.io/docs/developer-guides/filters-in-groq-powered-webhooks), [Cloudflare deploy hooks](https://developers.cloudflare.com/pages/configuration/deploy-hooks/), [Sanity pricing](https://www.sanity.io/pricing).
