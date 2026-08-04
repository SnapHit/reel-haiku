# Reel Haiku

A daily puzzle game. Each day, three new haiku about famous films. The three lines are revealed one at a time. Name the film from a searchable list. Solving on line one is the best result.

No signup, no ads, no accounts. Under five minutes.

**Live demo:** enable GitHub Pages on this repository and the demo serves from `index.html`.

## Status

**Working prototype.** 534 puzzles across 197 films, served at random. Everything here is subject to change while the format is being calibrated.

What the demo already settles:

- The three-line reveal, and how it feels to guess between lines
- Full-viewport typography, one puzzle at a time, auto-fitted to any screen
- Autocomplete guessing against a searchable pool much larger than the answer pool
- The result state and the reveal

Content loads from `puzzles.json` and `titles.json`. The searchable pool is 16,034 titles against 197 answers, so the autocomplete cannot leak an answer by omission.

What it does not yet do: daily rollover, streaks, or the archive. Puzzles are served at random rather than one per day, deliberately, so the format can be played at volume during calibration.

## How it plays

Three lines are revealed one at a time. Line one is the weakest clue, line three the strongest. You get one guess per line, so solving early is worth more.

Every haiku is its own complete puzzle. No haiku names the film, a character, or the director.

## Design notes

**Zero external requests except web fonts.** No analytics, no CDNs, no trackers. The finished game will drop the font dependency and be entirely self contained.

**Full viewport, one puzzle at a time, on every device.** The type is auto-fitted by binary search to the largest size at which all three lines fit, so the layout never moves as lines are revealed.

**No accounts, ever.** Progress lives in the browser or not at all.

## Repository

This repository is the public prototype and will become the site. The generation pipeline, the film corpus and the full haiku set live in a separate private repository and will not be published.

## Ownership

Joint project, Nathan Haslewood and Mike, 50/50. A sibling game covering written works will follow on novlr.com, sharing the same engine and a different corpus.

Copyright 2026. All rights reserved. This repository is public for collaboration and preview; it is not open source and carries no licence.
