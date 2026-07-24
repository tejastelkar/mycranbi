# Configurable Per-Item Mega Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the merchant configure, per top-level header menu item, whether its
desktop submenu renders as a multi-column link layout ("Columns"), a row of
image cards ("Gallery"), or the theme's existing default — via new blocks on
the Header section, with no change required to the global "Menu type" setting.

**Architecture:** A new repeatable `mega_menu` block (added to
`sections/header.liquid`'s schema) associates a style + content with a
top-level menu item by matching its title. A new dispatcher snippet
(`snippets/header-inline-menu.liquid`) replaces the current either/or render
of `header-dropdown-menu` / `header-mega-menu`, and per top-level link picks
between three render paths: the matching block's style, or today's global
`menu_type_desktop`-driven fallback (unchanged) when no block matches.

**Tech Stack:** Shopify Liquid, Shopify theme blocks/schema, CSS (existing
custom properties: `--color-foreground`, `--font-body-family`,
`--duration-default`), no new JavaScript — animation is CSS driven off the
native `<details>` `[open]` attribute, same mechanism already used by
`component-mega-menu.css` and `base.css`'s `header__submenu` animation.

## Global Constraints

- Gallery style supports exactly 6 fixed image slots per block (image, caption,
  url each) — no more, no less. Empty slots are skipped at render time.
- `mega_menu` block matches a menu item by comparing `block.settings.menu_handle`
  to `link.title`, case-insensitively. No match = fall back to existing
  behavior, unchanged.
- Mobile hamburger drawer (`snippets/header-drawer.liquid` and everything it
  renders) is not touched by this plan — it keeps rendering the plain nested
  accordion from `section.settings.menu` regardless of `mega_menu` blocks.
- Reuse existing design tokens only: `--color-foreground`, `--font-body-family`,
  `--font-heading-family`, `--duration-default`, and the existing
  `.button` / `.button--secondary` classes for the CTA button. No hardcoded
  colors or font-families in new CSS.
- No new JavaScript. All animation is CSS transitions/keyframes keyed off
  `<details>`'s native `[open]` attribute (same pattern as the existing
  `.mega-menu[open] .mega-menu__content` rule and `base.css`'s
  `details[open] > .header__submenu` rule).
- `shopify theme check` must pass (no new errors) after every task.

**Note on scope vs. the design spec:** the spec called for adding a fade+slide
transition to the plain dropdown flyout. While drafting this plan,
`assets/base.css` was found to already animate `details[open] > .header__submenu`
via an `animateMenuOpen` keyframe (with a `prefers-reduced-motion` fallback).
That requirement is already satisfied by existing code, so no task below
duplicates it — only the new Gallery cards need new animation (Task 2).

---

### Task 1: Unify inline menu rendering behind a block-aware dispatcher

**Files:**
- Modify: `sections/header.liquid:15-17` (CSS load), `sections/header.liquid:185-193` (render call), `sections/header.liquid:666-670` (schema blocks array)
- Create: `snippets/header-inline-menu.liquid`
- Create: `snippets/header-menu-dropdown.liquid`
- Create: `snippets/header-menu-mega.liquid`
- Delete: `snippets/header-dropdown-menu.liquid`
- Delete: `snippets/header-mega-menu.liquid`

**Interfaces:**
- Produces: `{% render 'header-inline-menu' %}` (no params — reads
  `section.settings.menu`, `section.settings.menu_type_desktop`,
  `section.settings.menu_color_scheme`, `section.blocks`), which Task 3's
  verification exercises directly. Produces `{% render 'header-menu-dropdown', link: link, index: index %}` and
  `{% render 'header-menu-mega', link: link, index: index, block: mega_block_or_nil %}`,
  consumed only by `header-inline-menu.liquid` itself.

- [ ] **Step 1: Add the `mega_menu` block type to the Header section schema**

  In `sections/header.liquid`, find the `"blocks"` array (currently lines
  666-670):

  ```json
    "blocks": [
      {
        "type": "@app"
      }
    ]
  ```

  Replace it with:

  ```json
    "blocks": [
      {
        "type": "@app"
      },
      {
        "type": "mega_menu",
        "name": "Mega menu item",
        "settings": [
          {
            "type": "text",
            "id": "menu_handle",
            "label": "Menu item title",
            "info": "Must exactly match the title of a top-level menu item that has sub-links (e.g. \"Pure Haircare\"). Case-insensitive."
          },
          {
            "type": "select",
            "id": "style",
            "label": "Style",
            "options": [
              {
                "value": "columns",
                "label": "Columns"
              },
              {
                "value": "gallery",
                "label": "Gallery"
              }
            ],
            "default": "columns"
          },
          {
            "type": "text",
            "id": "button_label",
            "label": "Button label",
            "default": "Discover all products"
          },
          {
            "type": "url",
            "id": "button_link",
            "label": "Button link"
          },
          {
            "type": "header",
            "content": "Gallery images"
          },
          {
            "type": "paragraph",
            "content": "Used only when Style is set to Gallery. Leave an image blank to skip that slot (up to 6)."
          },
          {
            "type": "image_picker",
            "id": "image_1",
            "label": "Image 1"
          },
          {
            "type": "text",
            "id": "image_1_caption",
            "label": "Image 1 caption"
          },
          {
            "type": "url",
            "id": "image_1_link",
            "label": "Image 1 link"
          },
          {
            "type": "image_picker",
            "id": "image_2",
            "label": "Image 2"
          },
          {
            "type": "text",
            "id": "image_2_caption",
            "label": "Image 2 caption"
          },
          {
            "type": "url",
            "id": "image_2_link",
            "label": "Image 2 link"
          },
          {
            "type": "image_picker",
            "id": "image_3",
            "label": "Image 3"
          },
          {
            "type": "text",
            "id": "image_3_caption",
            "label": "Image 3 caption"
          },
          {
            "type": "url",
            "id": "image_3_link",
            "label": "Image 3 link"
          },
          {
            "type": "image_picker",
            "id": "image_4",
            "label": "Image 4"
          },
          {
            "type": "text",
            "id": "image_4_caption",
            "label": "Image 4 caption"
          },
          {
            "type": "url",
            "id": "image_4_link",
            "label": "Image 4 link"
          },
          {
            "type": "image_picker",
            "id": "image_5",
            "label": "Image 5"
          },
          {
            "type": "text",
            "id": "image_5_caption",
            "label": "Image 5 caption"
          },
          {
            "type": "url",
            "id": "image_5_link",
            "label": "Image 5 link"
          },
          {
            "type": "image_picker",
            "id": "image_6",
            "label": "Image 6"
          },
          {
            "type": "text",
            "id": "image_6_caption",
            "label": "Image 6 caption"
          },
          {
            "type": "url",
            "id": "image_6_link",
            "label": "Image 6 link"
          }
        ]
      }
    ]
  ```

  Also find `"max_blocks": 3,` near the top of the schema and change it to
  `"max_blocks": 10,`.

- [ ] **Step 2: Always load the mega-menu stylesheet**

  In `sections/header.liquid`, find (currently lines 15-17):

  ```liquid
  {%- if section.settings.menu_type_desktop == 'mega' -%}
    <link rel="stylesheet" href="{{ 'component-mega-menu.css' | asset_url }}" media="print" onload="this.media='all'">
  {%- endif -%}
  ```

  Replace it with:

  ```liquid
  <link rel="stylesheet" href="{{ 'component-mega-menu.css' | asset_url }}" media="print" onload="this.media='all'">
  ```

  (Needed because a `mega_menu` block can now render mega-style content for
  an item even when the global setting is `dropdown`.)

- [ ] **Step 3: Create `snippets/header-menu-dropdown.liquid`**

  This is today's simple flyout markup (from the old
  `header-dropdown-menu.liquid`), extracted to render one top-level link at a
  time, with `link` and `index` passed in explicitly instead of relying on an
  ambient `forloop`.

  ```liquid
  {% comment %}
    Renders a single top-level menu item as a simple dropdown flyout.

    Accepts:
    - link: {Object} the top-level menu link (must have link.links present)
    - index: {Number} unique index for this link, used to build element ids

    Usage:
    {% render 'header-menu-dropdown', link: link, index: index %}
  {% endcomment %}

  <header-menu>
    <details id="Details-HeaderMenu-{{ index }}">
      <summary
        id="HeaderMenu-{{ link.handle }}"
        class="header__menu-item list-menu__item link focus-inset"
      >
        <span
          {%- if link.child_active %}
            class="header__active-menu-item"
          {% endif %}
        >
          {{- link.title | escape -}}
        </span>
        {{- 'icon-caret.svg' | inline_asset_content -}}
      </summary>
      <ul
        id="HeaderMenu-MenuList-{{ index }}"
        class="header__submenu list-menu list-menu--disclosure color-{{ section.settings.menu_color_scheme }} gradient caption-large motion-reduce global-settings-popup"
        role="list"
        tabindex="-1"
      >
        {%- for childlink in link.links -%}
          <li>
            {%- if childlink.links == blank -%}
              <a
                id="HeaderMenu-{{ link.handle }}-{{ childlink.handle }}"
                href="{{ childlink.url }}"
                class="header__menu-item list-menu__item link link--text focus-inset caption-large{% if childlink.current %} list-menu__item--active{% endif %}"
                {% if childlink.current %}
                  aria-current="page"
                {% endif %}
              >
                {{ childlink.title | escape }}
              </a>
            {%- else -%}
              <details id="Details-HeaderSubMenu-{{ link.handle }}-{{ childlink.handle }}">
                <summary
                  id="HeaderMenu-{{ link.handle }}-{{ childlink.handle }}"
                  class="header__menu-item link link--text list-menu__item focus-inset caption-large"
                >
                  <span>{{ childlink.title | escape }}</span>
                  {{- 'icon-caret.svg' | inline_asset_content -}}
                </summary>
                <ul
                  id="HeaderMenu-SubMenuList-{{ link.handle }}-{{ childlink.handle }}"
                  class="header__submenu list-menu motion-reduce"
                >
                  {%- for grandchildlink in childlink.links -%}
                    <li>
                      <a
                        id="HeaderMenu-{{ link.handle }}-{{ childlink.handle }}-{{ grandchildlink.handle }}"
                        href="{{ grandchildlink.url }}"
                        class="header__menu-item list-menu__item link link--text focus-inset caption-large{% if grandchildlink.current %} list-menu__item--active{% endif %}"
                        {% if grandchildlink.current %}
                          aria-current="page"
                        {% endif %}
                      >
                        {{ grandchildlink.title | escape }}
                      </a>
                    </li>
                  {%- endfor -%}
                </ul>
              </details>
            {%- endif -%}
          </li>
        {%- endfor -%}
      </ul>
    </details>
  </header-menu>
  ```

- [ ] **Step 4: Create `snippets/header-menu-mega.liquid`**

  Renders one top-level link as a mega-menu. `block` is either a matching
  `mega_menu` block (drives style + optional CTA button + gallery content) or
  `nil` (falls back to the plain columns layout with no button — identical to
  today's `header-mega-menu.liquid` output).

  ```liquid
  {% comment %}
    Renders a single top-level menu item as a mega-menu: either a multi-column
    link layout ("columns") or a row of merchant-configured image cards
    ("gallery"), each optionally followed by a CTA button.

    Accepts:
    - link: {Object} the top-level menu link (must have link.links present)
    - index: {Number} unique index for this link, used to build element ids
    - block: {Object|nil} a matching `mega_menu` section block, or nil to fall
      back to the plain columns layout with no CTA button

    Usage:
    {% render 'header-menu-mega', link: link, index: index, block: mega_block %}
  {% endcomment %}

  {%- liquid
    assign mega_style = 'columns'
    if block != nil and block.settings.style == 'gallery'
      assign mega_style = 'gallery'
    endif
  -%}

  <header-menu>
    <details id="Details-HeaderMenu-{{ index }}" class="mega-menu">
      <summary
        id="HeaderMenu-{{ link.handle }}"
        class="header__menu-item list-menu__item link focus-inset"
      >
        <span
          {%- if link.child_active %}
            class="header__active-menu-item"
          {% endif %}
        >
          {{- link.title | escape -}}
        </span>
        {{- 'icon-caret.svg' | inline_asset_content -}}
      </summary>
      <div
        id="MegaMenu-Content-{{ index }}"
        class="mega-menu__content color-{{ section.settings.menu_color_scheme }} gradient motion-reduce global-settings-popup"
        tabindex="-1"
      >
        {%- if mega_style == 'gallery' -%}
          <div class="mega-menu__gallery page-width">
            {%- for i in (1..6) -%}
              {%- liquid
                assign image_key = 'image_' | append: i
                assign caption_key = image_key | append: '_caption'
                assign link_key = image_key | append: '_link'
                assign card_image = block.settings[image_key]
                assign card_caption = block.settings[caption_key]
                assign card_link = block.settings[link_key]
                assign card_tag = 'div'
                if card_link != blank
                  assign card_tag = 'a'
                endif
              -%}
              {%- if card_image != blank -%}
                <{{ card_tag }}
                  {% if card_tag == 'a' %}
                    href="{{ card_link }}"
                  {% endif %}
                  class="mega-menu__gallery-card"
                  style="--mega-menu-card-index: {{ forloop.index0 }};"
                >
                  <span class="mega-menu__gallery-image-wrapper">
                    {{
                      card_image
                      | image_url: width: 400
                      | image_tag: loading: 'lazy', widths: '200, 300, 400', alt: card_caption
                    }}
                  </span>
                  {%- if card_caption != blank -%}
                    <span class="mega-menu__gallery-caption">{{ card_caption | escape }}</span>
                  {%- endif -%}
                </{{ card_tag }}>
              {%- endif -%}
            {%- endfor -%}
          </div>
        {%- else -%}
          <ul
            class="mega-menu__list page-width{% if link.levels == 1 %} mega-menu__list--condensed{% endif %}"
            role="list"
          >
            {%- for childlink in link.links -%}
              <li>
                <a
                  id="HeaderMenu-{{ link.handle }}-{{ childlink.handle }}"
                  href="{{ childlink.url }}"
                  class="mega-menu__link mega-menu__link--level-2 link{% if childlink.current %} mega-menu__link--active{% endif %}"
                  {% if childlink.current %}
                    aria-current="page"
                  {% endif %}
                >
                  {{ childlink.title | escape }}
                </a>
                {%- if childlink.links != blank -%}
                  <ul class="list-unstyled" role="list">
                    {%- for grandchildlink in childlink.links -%}
                      <li>
                        <a
                          id="HeaderMenu-{{ link.handle }}-{{ childlink.handle }}-{{ grandchildlink.handle }}"
                          href="{{ grandchildlink.url }}"
                          class="mega-menu__link link{% if grandchildlink.current %} mega-menu__link--active{% endif %}"
                          {% if grandchildlink.current %}
                            aria-current="page"
                          {% endif %}
                        >
                          {{ grandchildlink.title | escape }}
                        </a>
                      </li>
                    {%- endfor -%}
                  </ul>
                {%- endif -%}
              </li>
            {%- endfor -%}
          </ul>
        {%- endif -%}

        {%- if block != nil and block.settings.button_link != blank -%}
          <div class="mega-menu__cta">
            <a href="{{ block.settings.button_link }}" class="button button--secondary">
              {{ block.settings.button_label | escape }}
            </a>
          </div>
        {%- endif -%}
      </div>
    </details>
  </header-menu>
  ```

- [ ] **Step 5: Create `snippets/header-inline-menu.liquid`**

  ```liquid
  {% comment %}
    Renders the header's inline desktop menu. Each top-level link renders as:
    - a plain link, if it has no children
    - a mega-menu (columns or gallery), if a `mega_menu` block's menu_handle
      matches the link's title (case-insensitive)
    - otherwise, a plain mega-menu columns layout if
      section.settings.menu_type_desktop is 'mega', or a simple dropdown
      flyout if it's 'dropdown'

    Usage:
    {% render 'header-inline-menu' %}
  {% endcomment %}

  <nav class="header__inline-menu">
    <ul class="list-menu list-menu--inline" role="list">
      {%- for link in section.settings.menu.links -%}
        <li>
          {%- if link.links != blank -%}
            {%- liquid
              assign mega_block = nil
              for block in section.blocks
                if block.type == 'mega_menu' and block.settings.menu_handle != blank
                  if block.settings.menu_handle | downcase == link.title | downcase
                    assign mega_block = block
                  endif
                endif
              endfor
            -%}

            {%- if mega_block != nil -%}
              {%- render 'header-menu-mega', link: link, index: forloop.index, block: mega_block -%}
            {%- elsif section.settings.menu_type_desktop == 'dropdown' -%}
              {%- render 'header-menu-dropdown', link: link, index: forloop.index -%}
            {%- else -%}
              {%- render 'header-menu-mega', link: link, index: forloop.index, block: nil -%}
            {%- endif -%}
          {%- else -%}
            <a
              id="HeaderMenu-{{ link.handle }}"
              href="{{ link.url }}"
              class="header__menu-item list-menu__item link link--text focus-inset"
              {% if link.current %}
                aria-current="page"
              {% endif %}
            >
              <span
                {%- if link.current %}
                  class="header__active-menu-item"
                {% endif %}
              >
                {{- link.title | escape -}}
              </span>
            </a>
          {%- endif -%}
        </li>
      {%- endfor -%}
    </ul>
  </nav>
  ```

- [ ] **Step 6: Wire the dispatcher into `sections/header.liquid`**

  Find (currently lines 185-193):

  ```liquid
    {%- liquid
      if section.settings.menu != blank
        if section.settings.menu_type_desktop == 'dropdown'
          render 'header-dropdown-menu'
        elsif section.settings.menu_type_desktop != 'drawer'
          render 'header-mega-menu'
        endif
      endif
    %}
  ```

  Replace it with:

  ```liquid
    {%- liquid
      if section.settings.menu != blank and section.settings.menu_type_desktop != 'drawer'
        render 'header-inline-menu'
      endif
    %}
  ```

- [ ] **Step 7: Delete the two now-unused snippets**

  ```bash
  git rm "snippets/header-dropdown-menu.liquid" "snippets/header-mega-menu.liquid"
  ```

- [ ] **Step 8: Verify with theme check**

  Run: `shopify theme check --path "/Users/tejastelkar/Desktop/Shopify Projects/Cranbi"`
  Expected: no new errors (pre-existing warnings in the theme, if any, are
  unrelated and may remain).

- [ ] **Step 9: Verify unconfigured menu items are unchanged**

  With no `mega_menu` blocks added yet, the dispatcher's fallback branches
  reproduce the exact markup of the two deleted snippets. Confirm by reading
  through `header-inline-menu.liquid`'s `elsif`/`else` branches against this
  task's Step 3 and Step 4 content — the only differences should be `index`
  passed as a parameter instead of `forloop.index`, and (in the mega branch)
  the added `{%- if mega_style == 'gallery' -%}` conditional that isn't
  reachable when `block` is `nil`.

- [ ] **Step 10: Commit**

  ```bash
  git add sections/header.liquid snippets/header-inline-menu.liquid snippets/header-menu-dropdown.liquid snippets/header-menu-mega.liquid
  git add snippets/header-dropdown-menu.liquid snippets/header-mega-menu.liquid
  git commit -m "$(cat <<'EOF'
  Add per-item mega menu blocks with a unified inline-menu dispatcher

  Lets each top-level header menu item independently render as a Columns
  or Gallery mega-menu via a new mega_menu block, instead of every item
  being forced into the same global dropdown/mega style.

  Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
  EOF
  )"
  ```

---

### Task 2: Gallery grid, CTA button, and stagger animation styling

**Files:**
- Modify: `assets/component-mega-menu.css` (append to end of file)

**Interfaces:**
- Consumes: the `.mega-menu__gallery`, `.mega-menu__gallery-card`,
  `.mega-menu__gallery-image-wrapper`, `.mega-menu__gallery-caption`, and
  `.mega-menu__cta` classes, plus the `--mega-menu-card-index` inline custom
  property, all emitted by `snippets/header-menu-mega.liquid` (Task 1 Step 4).
- Produces: nothing consumed by later tasks — this is a leaf styling task.

- [ ] **Step 1: Append gallery + CTA styles**

  Add to the end of `assets/component-mega-menu.css`:

  ```css
  .mega-menu__cta {
    margin-top: 2rem;
    text-align: center;
  }

  .mega-menu__gallery {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;
    justify-content: center;
  }

  .mega-menu__gallery-card {
    color: rgb(var(--color-foreground));
    display: flex;
    flex-direction: column;
    text-decoration: none;
    width: 180px;
  }

  .mega-menu__gallery-image-wrapper {
    aspect-ratio: 3 / 4;
    display: block;
    overflow: hidden;
  }

  .mega-menu__gallery-image-wrapper img {
    display: block;
    height: 100%;
    object-fit: cover;
    transition: transform 0.25s ease;
    width: 100%;
  }

  .mega-menu__gallery-card:hover .mega-menu__gallery-image-wrapper img {
    transform: scale(1.04);
  }

  .mega-menu__gallery-caption {
    font-family: var(--font-body-family);
    font-size: 0.875rem;
    line-height: 1.4;
    margin-top: 0.75rem;
    text-align: center;
  }

  .js .mega-menu__gallery-card {
    opacity: 0;
    transform: translateY(8px);
    transition: opacity 0.25s ease, transform 0.25s ease;
    transition-delay: calc(var(--mega-menu-card-index, 0) * 0.05s);
  }

  .mega-menu[open] .mega-menu__gallery-card {
    opacity: 1;
    transform: translateY(0);
  }

  @media (prefers-reduced-motion) {
    .js .mega-menu__gallery-card {
      opacity: 1;
      transform: translateY(0);
      transition: none;
    }
  }
  ```

- [ ] **Step 2: Verify with theme check**

  Run: `shopify theme check --path "/Users/tejastelkar/Desktop/Shopify Projects/Cranbi"`
  Expected: no new errors.

- [ ] **Step 3: Commit**

  ```bash
  git add assets/component-mega-menu.css
  git commit -m "$(cat <<'EOF'
  Style the gallery mega-menu cards, CTA button spacing, and stagger animation

  Reuses existing color/font/duration tokens; adds a prefers-reduced-motion
  fallback for the gallery card stagger.

  Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
  EOF
  )"
  ```

---

### Task 3: Configure test blocks and verify end-to-end on the dev server

**Files:**
- None (theme customizer configuration + manual/browser verification only;
  no code changes in this task).

**Interfaces:**
- Consumes: everything produced by Task 1 and Task 2.

- [ ] **Step 1: Start the theme dev server**

  Run: `shopify theme dev --path "/Users/tejastelkar/Desktop/Shopify Projects/Cranbi"`
  Expected: a preview URL is printed and the store loads without Liquid
  errors in the terminal output.

- [ ] **Step 2: Add a Columns test block**

  In the theme editor (opened from the dev server preview), open the Header
  section, add a "Mega menu item" block, set:
  - Menu item title: the exact title of an existing top-level menu item that
    already has nested sub-links in Navigation (e.g. "Pure Haircare")
  - Style: Columns
  - Button label: "Discover all products"
  - Button link: pick any collection

- [ ] **Step 3: Add a Gallery test block**

  Add a second "Mega menu item" block, set:
  - Menu item title: the exact title of a different top-level menu item that
    has at least one nested sub-link (any will do — gallery style ignores the
    actual sub-links and uses the image slots instead)
  - Style: Gallery
  - Fill in 3-5 of the `image_N` / `image_N_caption` / `image_N_link` slots
    with real product images
  - Button label + button link as above

- [ ] **Step 4: Visually verify in a real browser at desktop width (≥990px)**

  For each configured item:
  - Clicking the top-level item opens its submenu
  - The Columns item shows real menu columns (header + underline + links)
    plus the CTA button below
  - The Gallery item shows the configured image cards (skipping any blank
    slots) with a staggered fade-in, plus the CTA button below
  - Colors/fonts visually match the rest of the site (no hardcoded colors)

- [ ] **Step 5: Verify the fallback path**

  Any top-level menu item with children that has **no** matching block still
  opens using the existing global `menu_type_desktop` setting (dropdown or
  plain mega columns, whichever is set), with no CTA button — i.e. looks
  exactly as it did before this feature existed.

- [ ] **Step 6: Verify mobile is unaffected**

  Resize the browser below 990px (or use device emulation). Confirm the
  hamburger drawer opens the normal nested accordion menu, with no gallery
  images or CTA button — unchanged from before this feature.

- [ ] **Step 7: Remove the test blocks (or leave configured, per user preference)**

  Ask the user whether to keep the test blocks configured as their real menu
  configuration, or remove them so the header reverts to today's appearance
  until they configure it themselves.
