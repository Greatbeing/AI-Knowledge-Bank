# Typography and Copy System Design

## Purpose

AI Knowledge Bank should read as a trustworthy public knowledge infrastructure and an open community that improves knowledge through use. The site must serve two audiences equally: people looking for verified AI methods and people contributing real-world validation.

## Taste brief

- **Aesthetic proposition:** editorial knowledge infrastructure: calm enough to trust, specific enough to use, open enough to invite contribution.
- **Primary signal:** verified methods and public knowledge, not a generic AI generator.
- **Signature move:** every major entry point pairs “use verified knowledge” with “contribute real evidence.”
- **Type roles:** Noto Serif SC for display and manifesto statements; Noto Sans SC for body and controls; JetBrains Mono for figures, evidence labels, and system state.
- **Keep:** warm paper background, ink, jade accent, existing network motif, logo, current functionality.
- **Reject:** rainbow AI headline gradients, invented growth metrics, page-wide extra-bold text, slogan stacking, literal Chinese-English translation, and dense mobile navigation.

## Content architecture

The homepage keeps the working product surfaces but removes repeated explanations. Its reading path is: value proposition → method preview → three-vault model → co-creation loop → live nodes → real dispatch → evolution/validation → dual-action close. Vision, two-engine introduction, experience map, and infrastructure copy are folded into those sections instead of repeating the same concepts.

Primary Chinese hero copy:

> 把分散的 AI 实践，变成可验证、可复用、持续演化的公共知识。

Supporting copy:

> 在知识框架、执行工具和真实案例之间找到可用方法；也把你的实践结果带回来，帮助下一版本更可靠。

Primary English hero copy:

> Turn scattered AI practice into public knowledge that can be tested, reused, and improved.

The four content pages each own one question:

- Knowledge: “为什么有效？” / Why does it work?
- Tools: “如何稳定执行？” / How can it be repeated?
- Cases: “在什么条件下有效？” / Where does it hold up?
- Community: “如何获得公共可信度？” / How does it earn shared trust?

The Dashboard becomes the contributor surface. It follows the global language preference, explains authentication in the chosen language, and describes reputation, badges, and notifications as evidence of contribution rather than gamification.

## Typography and layout

- Add one shared `assets/typography.css` loaded last on all six pages.
- Display text uses 600–700 weight, body uses 400–500, controls use 600, and data uses tabular mono figures.
- Chinese display line-height is 1.12–1.2; English display tracking is tighter than Chinese. Paragraph measure is capped around 65 Latin characters / 34 Chinese em.
- Home hero becomes an asymmetric editorial grid on desktop and a single readable column on mobile. The headline is ink-colored, not rainbow-gradient text.
- Content-page hero titles are shorter and smaller so Chinese phrases break at semantic boundaries.
- Mobile navigation, headings, search controls, and CTAs must fit at 390 px without horizontal overflow or washed-out reveal states.

## Trust and compatibility

- Never show invented fallback counts. Initial metrics render as an em dash; real vault counts replace them when Supabase responds; failure state names demo mode.
- Demo validation remains explicitly non-persisted. Real-node validation states continue to require authentication.
- Existing API contracts, Supabase calls, element IDs used by JavaScript, and legacy `#dispatch` deep links remain compatible.
- No new npm dependency, framework migration, database change, or production write.

## Acceptance

- All six pages render in Chinese and English with consistent typography and persisted language choice.
- Homepage is visibly shorter and reaches live knowledge/validation sooner while retaining working method, dispatch, and evolution demos.
- Desktop, tablet, and 390 px mobile views have no clipping, overlap, broken heading wraps, or horizontal overflow.
- Auth-required and auth-unavailable Dashboard states remain functional and clearly worded.
- Tests, text health, lint, build, six-page artifact check, and production dependency audit pass.

