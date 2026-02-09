# Lights Out

A puzzle game built on GitHub contribution graphs. Toggle cells to match the target pattern — someone's real contribution history.

Enter any GitHub username and try to solve their graph.

## How it works

- Each cell can be **on** or **off**
- Clicking a cell **toggles** it and its 4 neighbors (up, down, left, right)
- Your goal: make your board match the **target pattern** (their actual contribution graph)
- Green cells match the target. Bright/grey cells don't
- Use **hints** if you're stuck (each costs 3 penalty points)

## Stack

- React 19 + Vite
- Tailwind CSS 4
- Deployed on Cloudflare Pages

## Running locally

```bash
npm install
npm run dev
```

## Credits

- Contribution data from [github-contributions-api](https://github.com/grubersjoe/github-contributions-api) by [@grubersjoe](https://github.com/grubersjoe) — thank you!
- Vibe coded with [Claude Code](https://claude.ai/code) by [@raymondmuller](https://x.com/raymondmuller)
