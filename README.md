# Guess the Fake

A polished, playable browser game for Pollinations quest #15725. Players are shown two images side by side and must guess which one was AI-generated before a countdown timer runs out. Fun, fast, replayable, and mobile-friendly.

## Play Online

- **Cloudflare Pages**: https://newera-guessthefake.pages.dev (deployed from this repo)
- **Vercel**: Import this repo → Framework: Next.js → Build: `npm run build` → Output: `out`

## Gameplay

- **10 rounds** — all 10 images used exactly once per game (shuffled)
- **10-second timer** per round with visible countdown
- **Scoring**: base points + speed bonus (scaled by remaining time) + streak multiplier (20% per consecutive correct)
- **Streak resets** on wrong answer or timeout
- **Final results**: score, correct count, accuracy %, longest streak, and a fun rank/title
- **Share**: Copy results to clipboard or use Web Share API
- **Persisted best score** in localStorage

## Tech Stack

- **Next.js 15** App Router with TypeScript
- **Tailwind CSS** for styling (dark, modern UI)
- **Static export** (`output: 'export'`, `images: { unoptimized: true }`)
- **Vitest** + @testing-library/react for unit tests
- **Zero runtime dependencies** — fully offline/self-contained
- **Vercel-free-tier compatible**

## Local Development

```bash
npm install
npm run dev      # Start dev server at http://localhost:3000
npm run test     # Run unit tests
npm run build    # Static export to ./out
```

## Deployment

### Vercel (Free Tier)

1. Fork/clone this repository
2. Import into Vercel
3. Framework preset: **Next.js**
4. Build command: `npm run build`
5. Output directory: `out`
6. Deploy — no environment variables needed

### Cloudflare Pages

1. Connect this GitHub repository
2. Build command: `npm run build`
3. Build output directory: `out`
4. Deploy — works out of the box

## Attribution

### Real Images (5) — Unsplash License

| File | Photographer | Source |
|------|--------------|--------|
| real-1.jpg | NASA | [Unsplash](https://unsplash.com/@nasa) |
| real-2.jpg | SpaceX | [Unsplash](https://unsplash.com/@spacex) |
| real-3.jpg | NOAA | [Unsplash](https://unsplash.com/@noaa) |
| real-4.jpg | USGS | [Unsplash](https://unsplash.com/@usgs) |
| real-5.jpg | ESA | [Unsplash](https://unsplash.com/@europeanspaceagency) |

All real images are licensed under the **Unsplash License** — free for commercial and non-commercial use, no attribution required (attribution appreciated).

### AI-Generated Images (5) — Pollinations API

| File | Prompt |
|------|--------|
| ai-1.jpg | photorealistic majestic mountain landscape at golden hour, dramatic lighting, ultra detailed 8k |
| ai-2.jpg | photorealistic crystal clear mountain lake reflection, pine trees, pristine nature, 8k photography |
| ai-3.jpg | photorealistic aurora borealis over snowy mountains, vibrant green and purple lights, 8k |
| ai-4.jpg | photorealistic tropical beach at sunset, crystal turquoise water, palm trees, golden hour lighting |
| ai-5.jpg | photorealistic ancient forest with sun rays filtering through canopy, mystical atmosphere, 8k |

All AI images generated via **Pollinations AI** (https://image.pollinations.ai) and committed to `public/images/` for fully offline operation.

### Full Credits

See [public/images/CREDITS.md](./public/images/CREDITS.md) for complete license details.

## Accessibility

- Keyboard operable: `1` / `2` or `←` / `→` to pick, `Enter` to continue
- Visible focus rings on all interactive elements
- ARIA live announcements for correct/incorrect/timeout
- Respects `prefers-reduced-motion`
- Sufficient color contrast (WCAG AA)

## License

MIT — feel free to use, modify, and distribute.

---

Built for Pollinations Quest #15725 with ❤️ by NewEra AI Agent
