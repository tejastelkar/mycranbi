# Syncing with the Live Shopify Store

Reference for pulling live data (products, theme code) from Shopify into this repo,
and pushing local changes back up.

**Store:** My Cranbi — `6imbm9-et.myshopify.com`

**Themes:**

| Theme | ID | Role |
|---|---|---|
| Dawn | `147126517930` | live (published) |
| Horizon | `146740904106` | unpublished |
| Development (9655aa-Tejass-MacBook-Air) | `147466059946` | development |

Confirm this list is still current before relying on it: `shopify theme list --store 6imbm9-et.myshopify.com`

---

## Pulling live data

### Theme code (Liquid, JSON templates, assets, sections, snippets)

Pull the published theme's code into a local folder to inspect or diff:

```bash
shopify theme pull --store 6imbm9-et.myshopify.com --theme 147126517930 --path ./some-folder
```

- `--theme <id>` targets a specific theme (use the IDs above). Omit it and add `--live` or `--development` to target by role instead.
- Pull into a scratch folder (not over this repo) when you just want to diff against local — `diff -rq <repo> <pulled-folder>` shows what's actually drifted.
- `--nodelete` is a push-only flag; pulling never deletes local files outside the target path.

### Product / collection / order data (GraphQL)

There's no built-in "pull products" command — use `shopify store execute` with a raw GraphQL query against the Admin API:

```bash
cat > query.graphql << 'EOF'
query {
  products(first: 100) {
    edges {
      node {
        id
        title
        handle
        status
        descriptionHtml
        featuredImage { url altText }
        variants(first: 20) {
          edges { node { id title price sku availableForSale inventoryQuantity } }
        }
        collections(first: 10) {
          edges { node { title handle } }
        }
      }
    }
  }
}
EOF

shopify store execute --store 6imbm9-et.myshopify.com --query-file query.graphql --json > result.json
```

Notes:
- The CLI sometimes prints non-JSON preamble before the actual JSON blob — find the first `{` and parse from there (see `delete_products.py`'s `get_products()` for the pattern already used in this repo).
- Swap `products` for `collections`, `orders`, `customers`, etc. per the [Admin GraphQL schema](https://shopify.dev/docs/api/admin-graphql) — same `store execute` mechanism works for any query.
- Add `--variable-file vars.json` for parameterized queries/mutations.

---

## Pushing local data

### Theme code

```bash
shopify theme push --store 6imbm9-et.myshopify.com --theme 147466059946
```

- Defaults to failing if the target is the **live** theme — pass `--allow-live` (`-a`) explicitly if you really mean to overwrite the published theme directly. Prefer pushing to the `Development` theme (`147466059946`) or a fresh `--unpublished` theme, previewing it, then publishing via the admin.
- `--nodelete` prevents the push from deleting remote files that don't exist locally (use this if the remote may have files not yet pulled down).
- `--only=<glob>` / `--ignore=<glob>` scope the push to specific files when you don't want a full-theme sync.

### Product / collection data (mutations)

Same `store execute` mechanism, with `--allow-mutations` required for any non-query operation:

```bash
cat > mutation.graphql << 'EOF'
mutation productCreate($input: ProductInput!) {
  productCreate(input: $input) {
    product { id title }
    userErrors { field message }
  }
}
EOF

cat > vars.json << 'EOF'
{ "input": { "title": "New Product", "descriptionHtml": "<p>...</p>" } }
EOF

shopify store execute \
  --store 6imbm9-et.myshopify.com \
  --query-file mutation.graphql \
  --variable-file vars.json \
  --json \
  --allow-mutations
```

This repo already has two scripts built on this pattern:
- [`add_products.py`](../add_products.py) — creates products from the local product photo set.
- [`delete_products.py`](../delete_products.py) — fetches all products then deletes them (destructive — confirm the product list before running).

---

## Safety notes

- Pushing to the **live** theme changes what customers see immediately. Push to `Development` or an unpublished theme first, preview, then publish deliberately in the admin.
- Mutations (`productCreate`, `productDelete`, etc.) are irreversible from the CLI — always inspect the query/variables and get confirmation before running anything with `--allow-mutations`, especially deletes.
- `shopify theme pull` overwrites files at `--path` without prompting — pull into a scratch directory when you only want to compare, not into this repo directly, unless you intend to accept the remote as truth.
