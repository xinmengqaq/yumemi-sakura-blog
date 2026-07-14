Edit the supplied article-list screenshot into an updated high-fidelity prototype while preserving its established anime railway visual system and nearly all existing geometry.

Binding preservation requirements:
- Preserve the full spring railway header illustration, "春日轨迹" wordmark, "首页" and "文章" navigation, large "文章" page title and subtitle, shallow white wave, sparse full-screen sakura petals, white/pink/sky-blue/green palette, typography, spacing, five alternating article rows, railway separators, cover artwork, metadata, pagination and overall tall screenshot aspect.
- Preserve the alternating article order exactly: first row text left / image right, second row image left / text right, continuing alternation.
- Do not redesign the article rows, header scene or overall art direction.

Navigation correction:
- The top-level navigation item "文章" is the active main entry and means "全部文章" when clicked. Keep it visually active with the thin pink underline.
- Add a very small downward chevron beside "文章" to communicate that real categories are available in its submenu on hover/click.
- Do not show "全部文章" as a submenu choice and do not duplicate categories anywhere in the page body.
- The submenu itself may remain closed in this screenshot; do not draw a large open dropdown over the hero.

Replace the filter area beneath the wave:
- Keep the first filter row: a light keyword search field with placeholder "搜索标题或摘要", then compact "年份" and "月份" selectors.
- Completely remove the existing category navigation row containing "全部 / 随笔 / 旅行 / 创作 / 生活". These are categories and must not appear in the article-list body.
- Replace that row with a visitor-friendly multi-select tag bubble area.
- At the left show a small label "标签".
- Show equal-size compact bubbles for example real tags: "春日", "铁路", "摄影", "治愈系", "创作手记", "雨天". They must all use consistent font size and nearly consistent height; never vary bubble size by popularity and never resemble a tag cloud.
- Demonstrate multi-selection by selecting exactly two bubbles: "铁路" and "摄影" use a soft sakura-pink selected state with crisp readable text. The other bubbles remain white with fine pale-gray outlines.
- On the right retain a quiet "更多标签" control with a small chevron, suggesting a lightweight popover for additional tag bubbles.
- Below the bubbles show a compact condition summary: "当前：全部文章 · 标签：铁路、摄影（任一匹配）". Include small removable close icons for the selected tag conditions and retain the quiet "清空条件" text action on the far right.
- Use OR semantics visually: the phrase "任一匹配" must be readable. Do not show AND, intersecting diagrams or backend terminology.

Readability and styling:
- Keep the filter composition literary and light, not an admin dashboard. Use white space and fine dividers rather than enclosing the entire filter in a large card.
- Tag bubbles may be gently rounded because they are selection chips, but avoid oversized pill buttons.
- Keep petals very faint around filters and article text so nothing is obscured.

Strict exclusions:
- No category tabs, category chips, category dropdown, category wall or "全部" category control in the page body.
- No query/reset button matrix, tag cloud sizing, fake popularity counts, author card, login, comments, sharing, Live2D, music, sidebar widgets or new functionality.
- Do not add text explaining implementation or API parameters.
- The result must look like the same finished website after a precise filter UX correction, not a new unrelated design.
