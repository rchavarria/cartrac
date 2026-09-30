# cartrac

Track grocery's shopping cart over time: store purchase prices of supermarket items and compare
products, and the same product across different supermarkets.

CLI in TypeScript (Node ≥ 24, native type stripping), SQLite (`node:sqlite`), linted with Biome.

## Usage

```bash
npm install
npm start -- import examples/prices.csv     # CSV or JSON (date,store,product,brand,unit,price,currency)
npm start -- search leche --store mercadona # price history
npm start -- compare aceite -o json         # latest price per store, cheapest first
npm start -- export backup.csv              # re-importable export
```

Database: `data/cartrac.db` inside the project. It can be changed with `--db <path>` (or
`CARTRAC_DB`), always relative to the project root and inside it, regardless of the current
directory; absolute paths or paths escaping the project are rejected.

```bash
npm run check   # typecheck + biome + tests
npm run build   # compiles to dist/ (bin: cartrac)
```

## Architecture

Modular monolith following hexagonal architecture (ports & adapters). Dependencies always point
inwards: `cli → application → domain`, and adapters implement the ports. The CLI never touches
the database: commands call use cases, which only depend on port interfaces.

```
src/
├── main.ts                     # entry point
├── bootstrap.ts                # composition root: wires adapters into use cases
├── cli/                        # driving adapter
│   ├── program.ts
│   └── commands/               # import · search · compare · export
├── application/                # use cases
│   ├── import-prices.ts        # ImportPrices
│   ├── search-prices.ts        # SearchPrices
│   ├── compare-products.ts     # CompareProducts
│   ├── export-data.ts          # ExportData
│   └── price-view.ts           # read models
├── domain/                     # pure business model
│   ├── product.ts · store.ts · price-observation.ts
│   ├── money.ts                # amounts in cents
│   └── product-matcher.ts      # decides when two descriptions are the same product
├── ports/                      # interfaces
│   ├── product-repository.ts · store-repository.ts · price-repository.ts
│   ├── import-source.ts · data-exporter.ts
│   └── price-record.ts         # exchange format shared by import/export
└── adapters/                   # driven adapters
    ├── persistence/sqlite/     # SQLite repositories (node:sqlite)
    ├── persistence/in-memory/  # in-memory repositories (tests)
    ├── files/                  # CSV/JSON import sources and exporters
    ├── scrapers/               # supermarket scrapers / APIs (ImportSource)
    └── formatters/             # table / JSON output
test/                           # mirrors src/ (node:test)
```

