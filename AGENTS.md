<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Source lookup

Use the repo-local opensrc CLI when you need third-party package source, not just type declarations:

```bash
pnpm --silent opensrc path <package>
rg "pattern" $(pnpm --silent opensrc path <package>)
```

## Database schema workflow

When changing the Supabase database schema, update the declarative schema files in `supabase/schemas/` first. Generate migrations afterwards with the Supabase diff workflow instead of hand-writing migration files unless the user explicitly asks for a manual migration.
