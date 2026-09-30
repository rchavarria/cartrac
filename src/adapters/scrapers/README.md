# Scrapers / APIs (pending)

Supermarket scrapers or API clients go here. Each one implements the `ImportSource` port
(`src/ports/import-source.ts`), yielding `PriceRecord`s, so it can be used by the
`ImportPrices` use case exactly like the CSV/JSON sources.

