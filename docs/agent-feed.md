# Agent News Feed Contract

The `public/data/agent-news.json` file is the hand-off point between the automated news collector and the React app. Ship the file as UTF-8 JSON with the following rules:

- Keep the top-level fields `schemaVersion`, `lastUpdated`, and `items`.
- Populate `lastUpdated` with an ISO 8601 timestamp (UTC) describing when the feed was refreshed.
- Sort `items` by `publishedAt` descending and trim the array to the newest 20 entries.
- Each item must include:
  - `id`: a stable identifier, e.g. `vendor-topic-yyyymmdd`.
  - `title`: bilingual object with `en` and `zh` strings.
  - `summary`: bilingual object with `en` and `zh` strings.
  - `source`: object containing `name` and `url`.
  - `publishedAt`: ISO 8601 timestamp (UTC) of the original announcement.
  - `tags`: 1-4 lower-case category labels (e.g. `product`, `research`, `policy`).
  - `signal` (optional): short label such as `Launch`, `Insight`, `Policy`.

Example payload:

```json
{
  "schemaVersion": "2025-01-17",
  "lastUpdated": "2025-01-17T09:30:00Z",
  "items": [
    {
      "id": "vendor-topic-yyyymmdd",
      "title": { "en": "…", "zh": "…" },
      "summary": { "en": "…", "zh": "…" },
      "source": { "name": "…", "url": "https://…" },
      "publishedAt": "2025-01-16T15:00:00Z",
      "tags": ["product", "research"],
      "signal": "Launch"
    }
  ]
}
```

Automation tips:

- Generate bilingual text upstream; the UI will not machine-translate.
- Validate JSON prior to writing to avoid breaking the static fallback.
- Consider writing to a temp file then moving into place for atomic updates.
