# About Us and Contact Us Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an About Us page and flesh out the Contact Us page for this Shopify (Dawn-based) theme, structurally inspired by Caudalie's "Our Commitments" page but using Cranbi's own Ayurvedic-skincare brand voice, colors, and existing section patterns, with placeholder imagery throughout.

**Architecture:** Two new lightweight, self-contained Liquid sections (`impact-stats`, `commitment-pillars`) following the theme's existing "custom section" convention (inline `<style>` block, plain-string schema, no locale keys — as seen in `sections/brand-story.liquid` and `sections/benefits-strip.liquid`), plus two JSON page templates (`page.about.json` new, `page.contact.json` edited) that assemble those new sections alongside existing reused sections (`image-banner`, `rich-text`, `image-with-text`, `brand-story`, `benefits-strip`, `contact-form`).

**Tech Stack:** Shopify Liquid theme (Dawn base), JSON section/template schema, Shopify CLI `theme check` for static validation (no unit test framework exists for Liquid in this repo).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-25-about-and-contact-pages-design.md`
- No new binary image assets — every image slot must render via Shopify's built-in placeholder mechanism (`placeholder_svg_tag` for custom sections; Dawn's built-in sections already fall back to their own placeholder SVGs when `image` is left blank in the template JSON).
- No fabricated real-world specifics: no named founder, no real address/phone/certifications. All contact details and stats are explicitly illustrative placeholders.
- New sections follow the existing "custom section" convention exactly: inline `<style>` block scoped by `.section-{{ section.id }}-padding`, plain-string schema `name`/`label` values (no `t:` translation keys), matching `sections/brand-story.liquid` and `sections/benefits-strip.liquid`.
- Padding CSS pattern: `padding-top: {{ section.settings.padding_top | times: 0.75 | round: 0 }}px;` below 750px, full value at/above 750px (matches `benefits-strip.liquid`, `contact-form.liquid`, `image-with-text.liquid`).
- Brand colors already established in `config/settings_data.json`: background `#FFFFFF`/`#FFF9F2`, text `#3D3935`, button/accent `#660033`, blush accent `#D98B9B`.

---

### Task 1: Create the Impact Stats section

**Files:**
- Create: `sections/impact-stats.liquid`

**Interfaces:**
- Produces: a section type named `impact-stats` usable in any page template's `sections` map with `"type": "impact-stats"`. Schema blocks are type `stat` with settings `number` (text) and `label` (text), max 4 blocks. Section-level settings: `heading` (text), `background_color` (color), `text_color` (color), `padding_top`/`padding_bottom` (range, px).

- [ ] **Step 1: Write the section file**

Create `sections/impact-stats.liquid`:

```liquid
{%- style -%}
  .section-{{ section.id }}-padding {
    padding-top: {{ section.settings.padding_top | times: 0.75 | round: 0 }}px;
    padding-bottom: {{ section.settings.padding_bottom | times: 0.75 | round: 0 }}px;
  }

  @media screen and (min-width: 750px) {
    .section-{{ section.id }}-padding {
      padding-top: {{ section.settings.padding_top }}px;
      padding-bottom: {{ section.settings.padding_bottom }}px;
    }
  }

  .impact-stats {
    background-color: {{ section.settings.background_color }};
  }

  .impact-stats__heading {
    text-align: center;
    color: {{ section.settings.text_color }};
    margin: 0 0 3rem 0;
    font-weight: 300;
    letter-spacing: 0.05em;
    font-size: 2rem;
  }

  .impact-stats__grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 3rem 2rem;
  }

  @media screen and (min-width: 750px) {
    .impact-stats__grid {
      grid-template-columns: repeat({{ section.blocks.size }}, 1fr);
      gap: 2rem;
    }
  }

  .impact-stat {
    text-align: center;
  }

  .impact-stat__number {
    font-family: var(--font-heading-family);
    font-size: 3rem;
    font-weight: 500;
    color: {{ section.settings.text_color }};
    margin: 0 0 0.5rem 0;
    line-height: 1;
  }

  .impact-stat__label {
    font-size: 1.3rem;
    color: {{ section.settings.text_color }};
    opacity: 0.8;
    margin: 0;
    letter-spacing: 0.03em;
  }

  @media screen and (min-width: 750px) {
    .impact-stat__number {
      font-size: 4rem;
    }
    .impact-stat__label {
      font-size: 1.4rem;
    }
  }
{%- endstyle -%}

<div class="impact-stats section-{{ section.id }}-padding">
  <div class="page-width">
    {%- if section.settings.heading != blank -%}
      <h2 class="impact-stats__heading">{{ section.settings.heading | escape }}</h2>
    {%- endif -%}

    <div class="impact-stats__grid">
      {%- for block in section.blocks -%}
        <div class="impact-stat" {{ block.shopify_attributes }}>
          {%- if block.settings.number != blank -%}
            <p class="impact-stat__number">{{ block.settings.number }}</p>
          {%- endif -%}
          {%- if block.settings.label != blank -%}
            <p class="impact-stat__label">{{ block.settings.label }}</p>
          {%- endif -%}
        </div>
      {%- endfor -%}
    </div>
  </div>
</div>

{% schema %}
{
  "name": "Impact Stats",
  "tag": "section",
  "class": "section",
  "settings": [
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "By The Numbers"
    },
    {
      "type": "color",
      "id": "background_color",
      "label": "Background color",
      "default": "#FFF9F2"
    },
    {
      "type": "color",
      "id": "text_color",
      "label": "Text color",
      "default": "#660033"
    },
    {
      "type": "range",
      "id": "padding_top",
      "min": 0,
      "max": 100,
      "step": 4,
      "unit": "px",
      "label": "Padding Top",
      "default": 60
    },
    {
      "type": "range",
      "id": "padding_bottom",
      "min": 0,
      "max": 100,
      "step": 4,
      "unit": "px",
      "label": "Padding Bottom",
      "default": 60
    }
  ],
  "blocks": [
    {
      "type": "stat",
      "name": "Stat",
      "limit": 4,
      "settings": [
        {
          "type": "text",
          "id": "number",
          "label": "Number",
          "default": "15+"
        },
        {
          "type": "text",
          "id": "label",
          "label": "Label",
          "default": "Years of Tradition"
        }
      ]
    }
  ],
  "presets": [
    {
      "name": "Impact Stats",
      "blocks": [
        { "type": "stat", "settings": { "number": "15+", "label": "Years of Ayurvedic Tradition" } },
        { "type": "stat", "settings": { "number": "100%", "label": "Cruelty-Free" } },
        { "type": "stat", "settings": { "number": "30+", "label": "Farming Partners" } },
        { "type": "stat", "settings": { "number": "0", "label": "Synthetic Fragrances" } }
      ]
    }
  ]
}
{% endschema %}
```

- [ ] **Step 2: Validate JSON schema block is syntactically valid**

Run:
```bash
cd "/Users/tejastelkar/Desktop/Shopify Projects/Cranbi" && awk '/{% schema %}/,/{% endschema %}/' sections/impact-stats.liquid | sed '1d;$d' | jq empty && echo "VALID"
```
Expected output: `VALID` (jq prints nothing on success, `echo` confirms).

- [ ] **Step 3: Run Theme Check scoped to this file**

Run:
```bash
cd "/Users/tejastelkar/Desktop/Shopify Projects/Cranbi" && shopify theme check --output json 2>/dev/null | jq '.[] | select(.path == "sections/impact-stats.liquid")'
```
Expected output: nothing printed (no entry for this path means zero offenses). If an entry prints, read its `offenses` array and fix before continuing.

- [ ] **Step 4: Commit**

```bash
cd "/Users/tejastelkar/Desktop/Shopify Projects/Cranbi" && git add sections/impact-stats.liquid && git commit -m "$(cat <<'EOF'
Add Impact Stats section for About page

Reusable big-number stat callout row, following the theme's existing
custom-section convention (inline style, plain schema strings).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Create the Commitment Pillars section

**Files:**
- Create: `sections/commitment-pillars.liquid`

**Interfaces:**
- Produces: a section type named `commitment-pillars`. Section-level settings: `title` (text), `heading_size` (select: h2/h1/h0), `background_color` (color), `padding_top`/`padding_bottom` (range, px). Blocks are type `pillar` with settings `image` (image_picker), `title` (text), `text` (richtext), max 4 blocks.

- [ ] **Step 1: Write the section file**

Create `sections/commitment-pillars.liquid`:

```liquid
{%- style -%}
  .section-{{ section.id }}-padding {
    padding-top: {{ section.settings.padding_top | times: 0.75 | round: 0 }}px;
    padding-bottom: {{ section.settings.padding_bottom | times: 0.75 | round: 0 }}px;
  }

  @media screen and (min-width: 750px) {
    .section-{{ section.id }}-padding {
      padding-top: {{ section.settings.padding_top }}px;
      padding-bottom: {{ section.settings.padding_bottom }}px;
    }
  }

  .commitment-pillars {
    background-color: {{ section.settings.background_color }};
  }

  .commitment-pillars__header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .commitment-pillars__heading {
    margin: 0;
    font-weight: 300;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: rgb(var(--color-foreground));
  }

  .commitment-pillars__grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2.5rem;
  }

  @media screen and (min-width: 750px) {
    .commitment-pillars__header {
      margin-bottom: 4rem;
    }
    .commitment-pillars__grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 3rem;
    }
  }

  .commitment-pillar {
    display: flex;
    flex-direction: column;
    border: 1px solid rgba(var(--color-foreground), 0.1);
    border-radius: 12px;
    overflow: hidden;
    background-color: #FFFFFF;
  }

  .commitment-pillar__media {
    width: 100%;
    position: relative;
    padding-bottom: 60%;
    background-color: #f4f4f4;
  }

  .commitment-pillar__image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .commitment-pillar__media .placeholder-svg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .commitment-pillar__content {
    padding: 2rem;
  }

  .commitment-pillar__title {
    margin: 0 0 1rem 0;
    font-family: var(--font-heading-family);
    font-size: 1.6rem;
    font-weight: 400;
    letter-spacing: 0.04em;
    color: rgb(var(--color-foreground));
  }

  .commitment-pillar__text {
    font-size: 1.4rem;
    line-height: 1.6;
    color: rgba(var(--color-foreground), 0.8);
    margin: 0;
  }

  @media screen and (min-width: 750px) {
    .commitment-pillar__content {
      padding: 2.5rem;
    }
    .commitment-pillar__title {
      font-size: 1.8rem;
    }
  }
{%- endstyle -%}

<div class="commitment-pillars section-{{ section.id }}-padding">
  <div class="page-width">
    {%- if section.settings.title != blank -%}
      <div class="commitment-pillars__header">
        <h2 class="commitment-pillars__heading {{ section.settings.heading_size }}">
          {{ section.settings.title }}
        </h2>
      </div>
    {%- endif -%}

    <div class="commitment-pillars__grid">
      {%- for block in section.blocks -%}
        <div class="commitment-pillar" {{ block.shopify_attributes }}>
          <div class="commitment-pillar__media">
            {%- if block.settings.image != blank -%}
              {{ block.settings.image | image_url: width: 700 | image_tag: loading: 'lazy', class: 'commitment-pillar__image' }}
            {%- else -%}
              {{ 'image' | placeholder_svg_tag: 'placeholder-svg' }}
            {%- endif -%}
          </div>
          <div class="commitment-pillar__content">
            {%- if block.settings.title != blank -%}
              <h3 class="commitment-pillar__title">{{ block.settings.title }}</h3>
            {%- endif -%}
            {%- if block.settings.text != blank -%}
              <div class="commitment-pillar__text rte">
                {{ block.settings.text }}
              </div>
            {%- endif -%}
          </div>
        </div>
      {%- endfor -%}
    </div>
  </div>
</div>

{% schema %}
{
  "name": "Commitment Pillars",
  "tag": "section",
  "class": "section",
  "settings": [
    {
      "type": "text",
      "id": "title",
      "default": "OUR COMMITMENTS",
      "label": "Heading"
    },
    {
      "type": "select",
      "id": "heading_size",
      "options": [
        { "value": "h2", "label": "Small" },
        { "value": "h1", "label": "Medium" },
        { "value": "h0", "label": "Large" }
      ],
      "default": "h1",
      "label": "Heading size"
    },
    {
      "type": "color",
      "id": "background_color",
      "label": "Section background color",
      "default": "#FFFFFF"
    },
    {
      "type": "range",
      "id": "padding_top",
      "min": 0,
      "max": 100,
      "step": 4,
      "unit": "px",
      "label": "Top padding",
      "default": 80
    },
    {
      "type": "range",
      "id": "padding_bottom",
      "min": 0,
      "max": 100,
      "step": 4,
      "unit": "px",
      "label": "Bottom padding",
      "default": 80
    }
  ],
  "blocks": [
    {
      "type": "pillar",
      "name": "Pillar",
      "limit": 4,
      "settings": [
        {
          "type": "image_picker",
          "id": "image",
          "label": "Image"
        },
        {
          "type": "text",
          "id": "title",
          "default": "Pillar title",
          "label": "Heading"
        },
        {
          "type": "richtext",
          "id": "text",
          "default": "<p>Describe this commitment.</p>",
          "label": "Text"
        }
      ]
    }
  ],
  "presets": [
    {
      "name": "Commitment Pillars",
      "blocks": [
        { "type": "pillar", "settings": { "title": "Ethically-Sourced Ingredients", "text": "<p>We work directly with growers to source Ayurvedic botanicals responsibly, season after season.</p>" } },
        { "type": "pillar", "settings": { "title": "Cruelty-Free Always", "text": "<p>Every formula is developed and finished without animal testing, at any stage.</p>" } },
        { "type": "pillar", "settings": { "title": "Sustainable Packaging", "text": "<p>We choose recyclable and refillable materials wherever we can, and keep working to do better.</p>" } },
        { "type": "pillar", "settings": { "title": "Community & Craft", "text": "<p>Small batches, made by hand, in partnership with the artisans who bring each ritual to life.</p>" } }
      ]
    }
  ]
}
{% endschema %}
```

- [ ] **Step 2: Validate JSON schema block is syntactically valid**

Run:
```bash
cd "/Users/tejastelkar/Desktop/Shopify Projects/Cranbi" && awk '/{% schema %}/,/{% endschema %}/' sections/commitment-pillars.liquid | sed '1d;$d' | jq empty && echo "VALID"
```
Expected output: `VALID`.

- [ ] **Step 3: Run Theme Check scoped to this file**

Run:
```bash
cd "/Users/tejastelkar/Desktop/Shopify Projects/Cranbi" && shopify theme check --output json 2>/dev/null | jq '.[] | select(.path == "sections/commitment-pillars.liquid")'
```
Expected output: nothing printed.

- [ ] **Step 4: Commit**

```bash
cd "/Users/tejastelkar/Desktop/Shopify Projects/Cranbi" && git add sections/commitment-pillars.liquid && git commit -m "$(cat <<'EOF'
Add Commitment Pillars section for About page

Image-led card grid for brand commitments, distinct from the compact
icon row used by benefits-strip elsewhere in the theme.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Create the About Us page template

**Files:**
- Create: `templates/page.about.json`

**Interfaces:**
- Consumes: section types `image-banner`, `rich-text`, `impact-stats` (Task 1), `image-with-text`, `commitment-pillars` (Task 2), `brand-story` — all already present in `sections/`.
- Produces: a page template selectable in Shopify Admin as "page.about" when a Page is assigned template suffix `about`.

- [ ] **Step 1: Write the template file**

Create `templates/page.about.json`:

```json
{
  "sections": {
    "hero": {
      "type": "image-banner",
      "settings": {
        "image_height": "large",
        "desktop_content_position": "middle-center",
        "desktop_content_alignment": "center",
        "show_text_box": true,
        "color_scheme": "scheme-2",
        "image_overlay_opacity": 0
      },
      "blocks": {
        "heading": {
          "type": "heading",
          "settings": {
            "heading": "Beauty, Rooted in Ayurveda",
            "heading_size": "hxl"
          }
        },
        "text": {
          "type": "text",
          "settings": {
            "text": "Time-honored rituals, thoughtfully reformulated for modern skin.",
            "text_style": "subtitle"
          }
        }
      },
      "block_order": ["heading", "text"]
    },
    "story-intro": {
      "type": "rich-text",
      "settings": {
        "desktop_content_position": "center",
        "content_alignment": "center",
        "color_scheme": "scheme-2",
        "full_width": true,
        "padding_top": 52,
        "padding_bottom": 36
      },
      "blocks": {
        "heading": {
          "type": "heading",
          "settings": {
            "heading": "Our Story",
            "heading_size": "h1"
          }
        },
        "text": {
          "type": "text",
          "settings": {
            "text": "<p>Cranbi began with a simple idea: that skincare should feel like a ritual, not a routine. We blend traditional Ayurvedic botanicals with modern formulation, so every step of your day can be a small act of care.</p>"
          }
        }
      },
      "block_order": ["heading", "text"]
    },
    "stats": {
      "type": "impact-stats",
      "settings": {
        "heading": "By The Numbers",
        "background_color": "#FFF9F2",
        "text_color": "#660033",
        "padding_top": 60,
        "padding_bottom": 60
      },
      "blocks": {
        "stat-1": {
          "type": "stat",
          "settings": { "number": "15+", "label": "Years of Ayurvedic Tradition" }
        },
        "stat-2": {
          "type": "stat",
          "settings": { "number": "100%", "label": "Cruelty-Free" }
        },
        "stat-3": {
          "type": "stat",
          "settings": { "number": "30+", "label": "Farming Partners" }
        },
        "stat-4": {
          "type": "stat",
          "settings": { "number": "0", "label": "Synthetic Fragrances" }
        }
      },
      "block_order": ["stat-1", "stat-2", "stat-3", "stat-4"]
    },
    "ingredients": {
      "type": "image-with-text",
      "settings": {
        "height": "medium",
        "desktop_image_width": "medium",
        "layout": "image_first",
        "content_layout": "no-overlap",
        "desktop_content_position": "middle",
        "desktop_content_alignment": "left",
        "mobile_content_alignment": "left",
        "section_color_scheme": "scheme-1",
        "color_scheme": "scheme-1",
        "padding_top": 52,
        "padding_bottom": 52
      },
      "blocks": {
        "heading": {
          "type": "heading",
          "settings": { "heading": "Our Ingredients", "heading_size": "h1" }
        },
        "text": {
          "type": "text",
          "settings": {
            "text": "<p>We source Ayurvedic botanicals directly from growers who share our respect for the land, choosing potency and purity over shortcuts. Every ingredient earns its place in the formula.</p>",
            "text_style": "body"
          }
        }
      },
      "block_order": ["heading", "text"]
    },
    "craft": {
      "type": "image-with-text",
      "settings": {
        "height": "medium",
        "desktop_image_width": "medium",
        "layout": "text_first",
        "content_layout": "no-overlap",
        "desktop_content_position": "middle",
        "desktop_content_alignment": "left",
        "mobile_content_alignment": "left",
        "section_color_scheme": "scheme-2",
        "color_scheme": "scheme-2",
        "padding_top": 52,
        "padding_bottom": 52
      },
      "blocks": {
        "heading": {
          "type": "heading",
          "settings": { "heading": "Our Craft", "heading_size": "h1" }
        },
        "text": {
          "type": "text",
          "settings": {
            "text": "<p>Every batch is made small and by hand, so nothing is rushed. It takes longer, but it means the ritual you receive is the one we set out to make.</p>",
            "text_style": "body"
          }
        }
      },
      "block_order": ["heading", "text"]
    },
    "commitments": {
      "type": "commitment-pillars",
      "settings": {
        "title": "OUR COMMITMENTS",
        "heading_size": "h1",
        "background_color": "#FFFFFF",
        "padding_top": 80,
        "padding_bottom": 80
      },
      "blocks": {
        "pillar-1": {
          "type": "pillar",
          "settings": {
            "title": "Ethically-Sourced Ingredients",
            "text": "<p>We work directly with growers to source Ayurvedic botanicals responsibly, season after season.</p>"
          }
        },
        "pillar-2": {
          "type": "pillar",
          "settings": {
            "title": "Cruelty-Free Always",
            "text": "<p>Every formula is developed and finished without animal testing, at any stage.</p>"
          }
        },
        "pillar-3": {
          "type": "pillar",
          "settings": {
            "title": "Sustainable Packaging",
            "text": "<p>We choose recyclable and refillable materials wherever we can, and keep working to do better.</p>"
          }
        },
        "pillar-4": {
          "type": "pillar",
          "settings": {
            "title": "Community & Craft",
            "text": "<p>Small batches, made by hand, in partnership with the artisans who bring each ritual to life.</p>"
          }
        }
      },
      "block_order": ["pillar-1", "pillar-2", "pillar-3", "pillar-4"]
    },
    "values": {
      "type": "brand-story",
      "settings": {
        "title": "OUR VALUES",
        "heading_size": "h1",
        "background_color": "#FFF9F2",
        "padding_top": 80,
        "padding_bottom": 80
      },
      "blocks": {
        "value-1": {
          "type": "column",
          "settings": {
            "title": "Purity",
            "text": "<p>No fillers, no shortcuts — just ingredients that earn their place.</p>"
          }
        },
        "value-2": {
          "type": "column",
          "settings": {
            "title": "Tradition",
            "text": "<p>Ayurvedic wisdom, carried forward and adapted for modern life.</p>"
          }
        },
        "value-3": {
          "type": "column",
          "settings": {
            "title": "Sustainability",
            "text": "<p>Choices made with the next season, not just the next sale, in mind.</p>"
          }
        }
      },
      "block_order": ["value-1", "value-2", "value-3"]
    },
    "closing-statement": {
      "type": "rich-text",
      "settings": {
        "desktop_content_position": "center",
        "content_alignment": "center",
        "color_scheme": "scheme-1",
        "full_width": true,
        "padding_top": 60,
        "padding_bottom": 40
      },
      "blocks": {
        "text": {
          "type": "text",
          "settings": {
            "text": "<p><em>“We believe skincare should slow you down, even for five minutes a day.”</em></p>"
          }
        }
      },
      "block_order": ["text"]
    },
    "cta": {
      "type": "image-banner",
      "settings": {
        "image_height": "small",
        "desktop_content_position": "middle-center",
        "desktop_content_alignment": "center",
        "show_text_box": true,
        "color_scheme": "scheme-3",
        "image_overlay_opacity": 0
      },
      "blocks": {
        "heading": {
          "type": "heading",
          "settings": {
            "heading": "Discover the Collection",
            "heading_size": "h1"
          }
        },
        "buttons": {
          "type": "buttons",
          "settings": {
            "button_label_1": "Shop Now",
            "button_link_1": "/collections/all",
            "button_style_secondary_1": false
          }
        }
      },
      "block_order": ["heading", "buttons"]
    }
  },
  "order": [
    "hero",
    "story-intro",
    "stats",
    "ingredients",
    "craft",
    "commitments",
    "values",
    "closing-statement",
    "cta"
  ]
}
```

- [ ] **Step 2: Validate the template is syntactically valid JSON**

Run:
```bash
cd "/Users/tejastelkar/Desktop/Shopify Projects/Cranbi" && jq empty templates/page.about.json && echo "VALID"
```
Expected output: `VALID`.

- [ ] **Step 3: Run Theme Check scoped to this file**

Run:
```bash
cd "/Users/tejastelkar/Desktop/Shopify Projects/Cranbi" && shopify theme check --output json 2>/dev/null | jq '.[] | select(.path == "templates/page.about.json")'
```
Expected output: nothing printed. If something prints (e.g. an unknown block type or setting id), cross-check the offending setting id against the section schema in `sections/<type>.liquid` and fix the template.

- [ ] **Step 4: Commit**

```bash
cd "/Users/tejastelkar/Desktop/Shopify Projects/Cranbi" && git add templates/page.about.json && git commit -m "$(cat <<'EOF'
Add About Us page template

Assembles hero, story intro, impact stats, ingredient/craft story
blocks, commitment pillars, values, closing statement, and CTA into
a page.about template. Assign a Shopify Page's template suffix to
"about" in Admin to use it.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Rebuild the Contact Us page template

**Files:**
- Modify: `templates/page.contact.json`

**Interfaces:**
- Consumes: section types `image-banner`, `benefits-strip` (repurposed with new content/icons), `contact-form` (all pre-existing, unmodified section files).

- [ ] **Step 1: Read the current file to confirm exact contents before overwriting**

Run:
```bash
cd "/Users/tejastelkar/Desktop/Shopify Projects/Cranbi" && cat templates/page.contact.json
```
Expected: the current 3-section (`main`, `form`) file matching what's already in git history — confirms nothing else has changed it since the design spec was written.

- [ ] **Step 2: Replace the template contents**

Replace the full contents of `templates/page.contact.json` with:

```json
{
  "sections": {
    "hero": {
      "type": "image-banner",
      "settings": {
        "image_height": "small",
        "desktop_content_position": "middle-center",
        "desktop_content_alignment": "center",
        "show_text_box": true,
        "color_scheme": "scheme-2",
        "image_overlay_opacity": 0
      },
      "blocks": {
        "heading": {
          "type": "heading",
          "settings": {
            "heading": "Get In Touch",
            "heading_size": "hxl"
          }
        },
        "text": {
          "type": "text",
          "settings": {
            "text": "Questions about your ritual? We're happy to help.",
            "text_style": "subtitle"
          }
        }
      },
      "block_order": ["heading", "text"]
    },
    "store-info": {
      "type": "benefits-strip",
      "settings": {
        "heading": "Reach Us",
        "background_color": "#FFF9F2",
        "text_color": "#660033",
        "padding_top": 60,
        "padding_bottom": 40
      },
      "blocks": {
        "email": {
          "type": "benefit",
          "settings": {
            "custom_svg": "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor'><rect x='3' y='5' width='18' height='14' rx='2'></rect><path d='M3 7l9 6 9-6'></path></svg>",
            "title": "Email",
            "text": "<p>hello@cranbi.com</p>"
          }
        },
        "phone": {
          "type": "benefit",
          "settings": {
            "custom_svg": "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor'><path d='M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.3 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1L6.6 10.8z'></path></svg>",
            "title": "Phone",
            "text": "<p>(555) 010-0100</p>"
          }
        },
        "address": {
          "type": "benefit",
          "settings": {
            "custom_svg": "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor'><path d='M12 22s7-7.2 7-12a7 7 0 1 0-14 0c0 4.8 7 12 7 12z'></path><circle cx='12' cy='10' r='2.5'></circle></svg>",
            "title": "Visit Us",
            "text": "<p>123 Ritual Lane, Suite 100</p>"
          }
        },
        "hours": {
          "type": "benefit",
          "settings": {
            "custom_svg": "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor'><circle cx='12' cy='12' r='9'></circle><path d='M12 7v5l3.5 2'></path></svg>",
            "title": "Hours",
            "text": "<p>Mon–Fri, 9am–5pm</p>"
          }
        }
      },
      "block_order": ["email", "phone", "address", "hours"]
    },
    "form": {
      "type": "contact-form",
      "settings": {
        "heading": "Send Us a Message",
        "heading_size": "h1",
        "color_scheme": "scheme-1",
        "padding_top": 36,
        "padding_bottom": 60
      }
    }
  },
  "order": [
    "hero",
    "store-info",
    "form"
  ]
}
```

Note: this removes the `main` (`main-page`) section that was previously first in the order, so the plain-text page title no longer renders above the new hero banner (per the spec's design decision).

- [ ] **Step 3: Validate the template is syntactically valid JSON**

Run:
```bash
cd "/Users/tejastelkar/Desktop/Shopify Projects/Cranbi" && jq empty templates/page.contact.json && echo "VALID"
```
Expected output: `VALID`.

- [ ] **Step 4: Run Theme Check scoped to this file**

Run:
```bash
cd "/Users/tejastelkar/Desktop/Shopify Projects/Cranbi" && shopify theme check --output json 2>/dev/null | jq '.[] | select(.path == "templates/page.contact.json")'
```
Expected output: nothing printed.

- [ ] **Step 5: Commit**

```bash
cd "/Users/tejastelkar/Desktop/Shopify Projects/Cranbi" && git add templates/page.contact.json && git commit -m "$(cat <<'EOF'
Rebuild Contact Us page with hero and store info

Adds an intro hero banner and a store-info row (email, phone,
address, hours — placeholder values) above the existing contact
form; drops the redundant plain-text page title.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Full-theme verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run a full Theme Check and confirm no new offenses beyond the pre-existing baseline**

Run:
```bash
cd "/Users/tejastelkar/Desktop/Shopify Projects/Cranbi" && shopify theme check --output json 2>/dev/null | jq '[.[] | select(.path == "sections/impact-stats.liquid" or .path == "sections/commitment-pillars.liquid" or .path == "templates/page.about.json" or .path == "templates/page.contact.json")] | length'
```
Expected output: `0` (none of the four new/modified files appear in the offenses list). The pre-existing baseline (25 offenses across 14 unrelated files, confirmed before this plan started) is out of scope for this task and should not be touched.

- [ ] **Step 2: Confirm both templates reference only existing section types**

Run:
```bash
cd "/Users/tejastelkar/Desktop/Shopify Projects/Cranbi" && for f in templates/page.about.json templates/page.contact.json; do
  echo "== $f =="
  jq -r '.sections[].type' "$f" | sort -u | while read -r t; do
    test -f "sections/$t.liquid" && echo "OK: $t" || echo "MISSING: $t"
  done
done
```
Expected output: every line printed as `OK: <type>`, no `MISSING:` lines.

- [ ] **Step 3: Report manual follow-up for the user**

No command — communicate to the user that this task's verification is static (Theme Check + JSON/reference validation) since there's no rendering test harness in this repo. Recommend they preview both pages via `shopify theme dev` (requires their store login) and, in Admin, create/assign two Pages with template suffixes `about` and confirm `contact` still resolves, since template JSON alone isn't visible without an assigned Page.

---
