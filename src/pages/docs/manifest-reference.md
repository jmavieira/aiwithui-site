---
layout: ../../layouts/Docs.astro
title: Manifest reference
description: The complete ai-with-ui.yaml contract.
---

# `ai-with-ui.yaml` Reference

This file is the exact contract for an AI with UI v1 manifest. It is
framework-owned: every project carries an identical copy at
`.aiui/manifest-reference.md`, and the Studio validates the manifest against a
JSON Schema that allows nothing beyond what is listed here. The Studio keeps
this copy current: when AI with UI is updated, it replaces the file with the
new version, so never edit it (project rules belong in `brain/` or AGENTS.md).

## Rules for agents

1. Read this file before changing `ai-with-ui.yaml`.
2. Use only the keys documented below. Unknown keys are rejected, and an
   invalid manifest makes the Studio fall back to the last valid copy or, if
   none exists, fail to open the project.
3. Never invent presentation metadata. Views and columns take only the keys
   documented below: no column objects, widths, sort orders or filters. How a
   field is labelled and shown (label, format such as money, date or image,
   links to other records, hiding it) is set per record type under
   `content.types.<type>.fields`, and most of it needs no setting at all.
4. Validate after every manifest edit and fix every diagnostic before you
   finish:

   ```bash
   aiui validate          # inside the Studio container or with the CLI installed
   npm run validate:trip  # from the framework repository
   ```

   If a manifest cannot be fixed, restore the last valid copy instead of leaving
   the project broken:

   ```bash
   aiui restore
   ```

   `aiui restore` backs up the invalid file as `ai-with-ui.yaml.invalid-<timestamp>.bak`
   and atomically replaces the manifest with `.aiui/runtime/recovery/last-valid-manifest.yaml`.
5. Change one thing at a time and keep the file valid YAML. Preserve existing
   comments and ordering.

## Choosing views

A project usually has a dashboard, a table per record type, and whichever of
these fits its data. When asked to improve a project's views, consider them:

| The records are… | Good view |
|---|---|
| Work moving through stages (tasks, options, applications) | `board` grouped by `status` |
| Things with a date or time (itinerary items, events, visits) | `timeline`, or a `calendar` (with `layers` to show several types together) |
| Things best recognised by a picture (places, restaurants, products, wardrobe) | `gallery` |
| Places with coordinates (`latitude`/`longitude`) | `map` |
| Things worked through and ticked off (shopping items, to-dos, chores, packing) | `checklist`, grouped by aisle, week or area |
| Things ranked two ways (importance × urgency, owner × status, aisle × status) | `matrix` |
| Short lists read top to bottom | `list` |
| Anything to compare, sort, group and total | `table` |

On a dashboard, a `countdown` metric suits the next trip or deadline, a
`targetField` metric suits spending against a budget, and a `display: cards`
section suits favourites with pictures. Values show by their type without
configuration (see `fields`); add a `fields` entry only to correct a label or
format.

## Value formats

| Name | Pattern | Examples |
|---|---|---|
| `id` | `^[a-z0-9]+(?:-[a-z0-9]+)*$` (lowercase kebab-case) | `overview`, `team-member` |
| `fieldName` | `^[a-z][A-Za-z0-9]*$` (camelCase frontmatter key) | `name`, `startAt`, `updated` |
| `path` | project-relative, no leading `/`, no `..` segments | `memory/index.md` |

## Top level

All keys are required except `actions`. No other top-level keys exist.

| Key | Type |
|---|---|
| `schemaVersion` | the number `1` |
| `id` | id |
| `name` | non-empty string |
| `agentContext` | object |
| `content` | object |
| `views` | array, may be empty |
| `actions` | array, optional |
| `agents` | object |

```yaml
schemaVersion: 1          # must be the number 1
id: my-project            # id
name: My Project          # non-empty string
agentContext: {...}       # see below
content: {...}            # see below
views: [...]              # see below, may be empty
actions: [...]            # optional, see below
agents: {...}             # see below
```

## `agentContext`

```yaml
agentContext:
  entrypoint: AGENTS.md         # path
  roots:                        # at least one
    - path: memory/index.md     # path
      load: always              # always | on-demand
```

## `content`

```yaml
content:
  roots:                        # at least one
    - path: brain               # path
      role: instructions        # instructions | records | assets | exports
      writable: false           # boolean
  types:                        # keys are ids; each value has these four keys, plus optional `fields`
    trip:
      match: memory/trips/items/*.md        # glob relative to the project root
      format: markdown-frontmatter          # markdown-frontmatter | json | yaml
      schema: .aiui/schemas/trip.schema.json # path to the JSON Schema for the frontmatter
      titleField: name                      # fieldName
      fields:                               # optional; how fields are labelled and shown
        budget: { format: money, currency: EUR }
        destination: { label: Where }
        internalNotes: { hidden: true }
```

### `fields` (optional): how values are shown

The Studio already shows most fields well without this: labels come from the
field name in words (`walkMinutesToOffice` shows as "Walk minutes to office"),
and the format is inferred from the value and the name. A `status` field is a
pill, `true`/`false` is Yes/No, ISO dates and date-times are written out, an
`https` value is a link, `image`/`photo` fields are pictures, a number in a
field like `price`/`amount`/`budget` is money when the record has a `currency`
field (or the name ends in a currency, like `amountEur`), `*Minutes` numbers
are durations, `rating` 0-5 is stars, and a value that names another record,
by its id or its title (`trip: berlin-week`, `list: weekly-shop-2026-09-15`,
`person: Dimitrios Michalakos`), is a link to that record, shown by its title,
whatever the field is called; a name two records share links to neither. A
record's page lists, under "Linked here", every record whose fields name it or
whose text links to its file, so link records to each other rather than
repeating their details. A field that takes one of a few short values
repeated across the type's records (`category`, `priority`, `sentiment`,
`confidence`) is a coloured label, like `status`: done/confirmed/positive are
green, pending/at-risk/medium are amber, blocked/overdue/negative are red,
planned/open are blue; `high` is red for priority, urgency or risk but green
for confidence. Dates that need attention are marked wherever they show: a
due date (`due`, `dueDate`, `deadline`, `targetDate`, `followUp`,
`nextReview`, `renewal`, `expires`, or any `next…` date such as
`nextOneOnOne`) is "Overdue" once passed and "Today", "Tomorrow" or "In N
days" within three days, and a `date`/`startAt` counts when the record is still
`scheduled`, `planned` or open; records that are done, cancelled, bought, paid
or otherwise closed are never flagged. Name due dates that way so they are
noticed. On a record's page, a number that has changed over the record's
history (a price, a goal's progress, a headcount) shows a small trend line from
its earlier versions, so keep such values in fields and update them in place
rather than logging each change in the text. `id` and `type` are not shown to
people.

Add a `fields` entry only to change that. Each key is optional:

| Key | Values | Meaning |
|---|---|---|
| `label` | text | Column and field label. |
| `format` | `text`, `longtext`, `number`, `money`, `percent`, `duration`, `date`, `datetime`, `boolean`, `status`, `rating`, `url`, `email`, `phone`, `image`, `ref`, `tags`, `choice` | How the value is shown (`choice`: a coloured label). |
| `hidden` | boolean | Not shown on record pages or as a column. |
| `currency` | ISO code, e.g. `EUR` | money: a fixed currency. |
| `currencyField` | fieldName | money: the field holding the currency code (default `currency`). |
| `ref` | a type id | The value (or list of values) names records of that type, by id or title, shown by title and opened on click. Only needed when the link is not found on its own. |
| `unit` | `minutes`, `hours`, `days` | duration: the unit of the number (default minutes). |
| `colors` | map of value → `green`, `amber`, `red`, `blue`, `grey`, `purple` | status and label colours for this field's values, when the usual reading is wrong. |
| `rollup` | object | The value is calculated from the records that link to this one (see below), not read from the file. |

A calculated field (`rollup`) is worked out whenever the project loads, so it
is always right and nobody maintains it: a list's item count and total, a
person's next meeting, a trip's spend. It has `from` (the type of the records
that link here), `via` (their field that names this record, by id or title),
`aggregate` (`count`, `sum`, `average`, `min`, `max`, `earliest`, `latest`),
and, except for `count`, `field` (the value to aggregate on those records; one
link may be followed, as in `product.price`). `times` multiplies each value by
another of their fields (a quantity), and `filters` (the dashboard filter
shape) limits which records count.

```yaml
content:
  types:
    shopping-list:
      fields:
        itemCount:
          rollup: { from: list-item, via: list, aggregate: count }
        total:
          rollup:
            from: list-item
            via: list
            aggregate: sum
            field: product.price
            times: quantity
            filters: [{ field: status, operator: not-equals, value: skipped }]
    team-member:
      fields:
        nextOneOnOne:
          rollup:
            from: one-on-one
            via: person
            aggregate: earliest
            field: date
            filters: [{ field: status, operator: equals, value: scheduled }]
```

When a type has a calculated field, never write that field into its records:
change the linked records instead, and the value follows.

Keep presentation in `fields`; never add display keys to records or schemas.

People can also change some values right on a record's page, without the
editor: they set a `rating` (1-5 stars), pick the `status` (from the schema's
`enum` for `status`, else the values the type already uses), switch yes/no
fields, tick `- [ ]` checklist items in the body, and log a visit (the date,
`rating`, `spent`/`cost` and `wouldReturn`) on types that have a `visitedOn`
field. So list the allowed statuses as an `enum` in the schema, keep ratings in
a `rating` field, and write checklists (packing, to-dos) as Markdown task lists.

## `views`

Each view has exactly these keys. `id`, `label`, `source`, and `renderer` are
required.

| Key | Type | Notes |
|---|---|---|
| `id` | id | Unique within `views`. |
| `label` | string | Sidebar label. |
| `icon` | id | Optional. Unknown names fall back to the renderer's icon. Known: `calendar-days`, `folder-kanban`, `layout-dashboard`, `list-checks`, `map-pin`, `message-square`, `network`, `plane`, `receipt-text`, `search`, `target`, `users`. |
| `source` | object | Exactly one of the three shapes below. No other keys. |
| `renderer` | enum | `dashboard`, `calendar`, `document`, `list`, `table`, `board`, `timeline`, `gallery`, `map`, `checklist`, `matrix`, `graph`, `agent`. |
| `columns` | array of fieldName | Optional. Plain strings only. Table columns in display order; for `board`, `list`, `gallery` and `timeline`, the fields shown on each card. |
| `groupBy` | fieldName | Optional. A single field. Ignored when `organization` is present. For `board`, the field whose values are the columns (default `status`). |
| `imageField` | fieldName | Optional. `gallery`, `board`, `list`: the field holding each card's picture (default: the first image field). |
| `board` | object | Optional, `board` only: `lanes: [values]` sets the column order (default: a workflow order for common statuses). |
| `checklist` | object | Optional, `checklist` only: `field` (default `status`), `steps: [values]` (the order a tap moves through; the last is done), `quantityField` (a +/- stepper; default `quantity` when records have one). |
| `matrix` | object | Required for `matrix`: `rows` and `columns` (fieldNames), optional `rowOrder`/`columnOrder` (values). |
| `map` | object | Optional, `map` only: `latitudeField`, `longitudeField` (default `latitude`/`lat` and `longitude`/`lng`/`lon`, or a `coordinates: "lat, lng"` field). |
| `aggregates` | array | Optional. Table subtotals; see below. |
| `organization` | object | Optional. See below. |
| `dashboard` | object | Required when `renderer: dashboard`, forbidden otherwise. |
| `calendar` | object | Required when `renderer: calendar`, forbidden otherwise. |
| `startField` | fieldName | Required when `renderer: calendar` or `timeline`. |
| `endField` | fieldName | Required when `renderer: calendar`; optional for `timeline`. |

Studio behaviour by renderer (all record views need a `source: { type }`):

- `table`: rows and columns, with search, sorting, organization and aggregates.
- `board`: a column per value of `groupBy` (default `status`), with a card per record.
- `list`: one card per record.
- `gallery`: picture cards (the record's image field), for places, products, people.
- `timeline`: records in date order under day headings (`startField`, optional
  `endField`), past days muted and today marked; good for itineraries and events.
- `map`: records with coordinates on an OpenStreetMap map, numbered and
  listed under it. Records need latitude and longitude fields (see `map`).
- `matrix`: a grid with a row per value of `matrix.rows` and a column per
  value of `matrix.columns`, a card per record in its cell (`columns` sets the
  card's fields). Rankings (critical, high, medium, low) run most pressing
  first, statuses in workflow order; `rowOrder`/`columnOrder` override. For a
  priority matrix: `matrix: { rows: importance, columns: urgency }`.
- `checklist`: rows to tick off, grouped by `groupBy`. A tap moves a record's
  `field` to its next step and saves it; done records sink to the bottom,
  struck through, and can be hidden. A yes/no field is simply ticked. Without
  `steps`, the steps are the values in use in workflow order, with the
  finishing value (`done`, `bought`, `packed`…) last; values like `skipped` or
  `cancelled` are left out. List the statuses as an `enum` in the schema.
- `calendar`, `dashboard`, `document`, `agent`: see their sections.
- `graph` is accepted by the schema but not shown yet (a warning says so); do
  not use it.

Cards and table cells show each field by its type (see `fields` under
`content`), so choose `columns` for what matters and let the Studio format it.

### `source` shapes

```yaml
source:
  type: trip            # records of one content type (id)
```

```yaml
source:
  path: memory/index.md # one Markdown document (path)
```

```yaml
source:
  kind: dashboard       # dashboard | sessions
```

A calendar view must use the `type` shape. A `source` never carries `filters`,
`sort`, `limit`, or any other key; those belong only inside dashboard sources.

### Correct and incorrect `columns`

```yaml
# Correct
columns: [name, trip, category, startAt, endAt, location, status]
```

```yaml
# Rejected: column objects are not supported
columns:
  - field: startAt
    label: Date
    kind: date
```

### `organization`

```yaml
organization:
  default: hierarchy            # must match one option id
  options:                      # at least one
    - id: hierarchy             # id
      label: Hierarchy          # string
      tree:                     # optional
        identityField: id       # fieldName
        parentField: parent     # fieldName
    - id: by-team
      label: By team
      groupBy: [team, status]   # optional, at least one fieldName, nested in order
    - id: flat
      label: Flat               # label-only option renders a flat list
```

An option may combine `groupBy` and `tree`. No other keys exist on an option.

### `aggregates`

Table subtotals (table renderer only). Each entry aggregates one column; the
table shows the value as a per-group subtotal row and a grand total.

```yaml
aggregates:
  - field: amount              # fieldName (the column to total)
    op: sum                    # count | sum | average | min | max
    format: number             # optional: number | percent
```

### `dashboard`

At least one of `metrics` or `sections` is required. Each array must be
non-empty when present.

```yaml
dashboard:
  metrics:
    - id: active-trips            # id, unique across metrics and sections
      label: Active trips         # string
      source: {...}               # dashboard source, see below
      aggregate: count            # count | sum | average | min | max | countdown
      field: progress             # fieldName, required unless aggregate is count
      format: percent             # optional: number | percent | money
      currency: EUR               # optional, money: ISO code (default: the records' currency)
      targetField: budget         # optional: shows the value "of" this field's sum, with a progress bar
      tone: attention             # optional: default | attention (amber) | positive
  sections:
    - id: upcoming                # id
      label: Upcoming trips       # string
      eyebrow: Travel             # optional string
      icon: plane                 # optional id
      span: full                  # optional: half | full
      source: {...}               # dashboard source
      item:
        titleField: name          # fieldName
        subtitle: "{destination} - {status}"   # optional, {field} placeholders
        leading:                  # optional
          kind: date              # date | initials
          field: startDate        # fieldName
        trailing:                 # optional list
          - kind: status          # date | progress | status | text
            field: status         # fieldName
      emptyMessage: Nothing planned   # optional string
      display: cards              # optional: list (rows, default) | cards (picture cards)
```

Metric behaviour:

- A `sum`, `average`, `min` or `max` of a money field (see `fields`) is shown as
  money when the records share one currency, e.g. "€1,406.05".
- `aggregate: countdown` shows the days until the soonest `field` date from
  today among the source's records ("Today", "Tomorrow", "In 9 days"), with a
  link to that record: e.g. `{ label: Next trip, source: { type: trip },
  aggregate: countdown, field: startDate }`.
- `targetField` turns a sum into progress: `{ label: Spent, aggregate: sum,
  field: spent, targetField: budget }` shows "€412 of €1,800" and a bar.

A section with `display: cards` shows each record as a picture card (its
image field), with the title, subtitle and trailing values under it: good for
favourite places, restaurants or products.

Dashboard source:

```yaml
source:
  type: trip                      # id of a content type; must exist in content.types
  filters:                        # optional
    - field: status               # fieldName
      operator: in                # equals | not-equals | in | not-in | before | after | within-days
      value: [planned, booked]    # string, number, boolean, or a non-empty list of those
  sort:                           # optional
    - field: startDate            # fieldName
      direction: asc              # asc | desc
  limit: 6                        # optional integer >= 1
```

Date filters compare a date field with today: `before`/`after` take `today`
or a date (`{ field: due, operator: before, value: today }` is overdue),
`within-days` takes a number of days ahead (`{ field: due, operator:
within-days, value: 7 }` is due this week). A record without that date never
matches. They work in `rollup` filters too. For an "Overdue" metric, count
the open records whose due date is before today, with `tone: attention`.

### `calendar`

```yaml
renderer: calendar
source:
  type: trip
startField: startDate             # fieldName holding the inclusive start
endField: endDate                 # fieldName holding the inclusive end
calendar:
  titleField: destination         # fieldName, required
  subtitleField: status           # optional fieldName
  colorField: destination         # optional fieldName
  defaultLabel: Home              # optional string shown on empty days
  weekStartsOn: monday            # optional: monday | sunday
  weekendDays: [0, 6]             # optional day indices (0=Sun..6=Sat) tinted as weekend; default [0, 6], [] to disable
  holidays:                       # optional public holidays
    - date: 2026-12-25            # ISO date YYYY-MM-DD
      name: Christmas Day         # shown after the day number; the day gets a distinct tint
  layers:                         # optional: more record types on the same calendar
    - type: itinerary-item        # a declared content type
      startField: startAt         # fieldName (date or date-time)
      endField: endAt             # optional; defaults to startField (a one-day entry)
      titleField: name            # optional; defaults to the type's titleField
      subtitleField: location     # optional
      label: Itinerary            # optional legend label and colour (default: the type in words)
```

With `layers`, one calendar shows trips, itinerary items and events together;
each entry opens its own record.

## `actions` (optional)

```yaml
actions:
  - id: archive-trip              # id
    label: Archive trip           # string
    command: scripts/archive-trip # path
    inputSchema: .aiui/schemas/archive.schema.json   # optional path
    approval: required            # never | required
    writes:                       # list of glob strings, may be empty
      - memory/trips/**
```

## `agents`

```yaml
agents:
  default: claude                 # id
  enabled: [claude, codex]        # at least one unique id
  mcpServers:                     # optional; keys are ids
    chrome-devtools:
      command: chrome-devtools-mcp          # executable on the agent host's PATH
      args: [--headless, --isolated]        # optional list of strings
      description: Headless browser for fare and booking pages   # optional
```

`mcpServers` declares Model Context Protocol servers the project's agents
should have. The Studio starts each server for every session it launches
(Claude Code through `--mcp-config`, Codex through `-c mcp_servers.*`). Only
`command`, `args`, and `description` exist; never put secrets or environment
variables in the manifest. The command must exist where the agent runs: the
container image provides `chrome-devtools-mcp` with a headless Chromium, and a
laptop needs `npm install -g chrome-devtools-mcp` and a Chrome install.

## Diagnostics you may see

| Code | Meaning |
|---|---|
| `manifest.parse` | The file is not valid YAML. |
| `manifest.schema` | A key or value violates this reference. The message names the JSON path, for example `/views/3/columns/0 must be string`. |
| `view.organization.invalid-default` | `organization.default` is not one of the option ids. |
| `view.organization.duplicate-option` | Two options share an id. |
| `view.dashboard.unknown-source` | A dashboard source names a type missing from `content.types`. |
| `view.dashboard.duplicate-id` | Two dashboard items share an id. |
| `context.missing` | An `agentContext` root does not exist. |
| `record.schema` | A record's frontmatter fails its JSON Schema. |
| `record.unreachable` | A record is not linked from any agent context root. |
| `link.broken` | A Markdown link points at a missing file. |
