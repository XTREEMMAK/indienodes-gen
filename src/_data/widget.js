/**
 * The IndieNodes ring widget: four independent embeddable artifacts a
 * creator page can carry in its footer. Ported near-verbatim from
 * indienodes-app's `src/lib/widgetTiers.js` and
 * `src/routes/widget/embed-snippet.js` — same tiers, same badge styles, same
 * snippet strings, minus the preview-only pieces (`widgetPreviewHtml`,
 * `MARK_DATA_URI`) that only make sense inside that app's live builder UI.
 *
 * Exposed as Eleventy global data under `widget`, so a template calls
 * `widget.embedHtmlFor({...})` directly — Nunjucks can invoke a function
 * that's present in its data context, so there's no need for a separate
 * shortcode/filter registration to reach these from `.njk` files.
 *
 * Tier choice is purely a display preference (brief section 7a / decisions.md
 * "Three independent embed tiers"). Nothing here writes to ring.json or
 * changes an entry's visibility or rotation — it only decides which markup
 * this build emits into a creator's own footer.
 */

/** @typedef {'widget' | 'widget-script' | 'badge' | 'text-link'} WidgetTierId */

/** @type {{ id: WidgetTierId, label: string, description: string }[]} */
const WIDGET_TIERS = [
	{
		id: 'widget',
		label: 'Full widget',
		description: 'Prev / Next / Random, in a sandboxed frame with no access to your page.'
	},
	{
		id: 'widget-script',
		label: 'Full widget (advanced)',
		description:
			"The same widget as a script tag instead of a frame. Runs with your page's own JavaScript privileges — most sites want the version above."
	},
	{
		id: 'badge',
		label: 'Badge',
		description: 'A small 88×31 image, the traditional webring size. Click goes to a random member.'
	},
	{
		id: 'text-link',
		label: 'Text link',
		description: 'A plain line of text, no image. For footer space too thin for even a badge.'
	}
];

/** @type {{ id: string, label: string, description: string, typesOnly?: string[] }[]} */
const BADGE_STYLES = [
	{ id: 'classic', label: 'Classic', description: 'The official IndieNodes logo on a dark ground.' },
	{
		id: 'minimal',
		label: 'Minimal',
		description: 'Official logo only, no text. The smallest visual weight.'
	},
	{
		id: 'type-coded',
		label: 'Type-coded',
		description: "Tinted with your node's own content-type color."
	},
	{
		id: 'mono',
		label: 'Mono',
		description: 'The official logo with an adaptive frame and wordmark for unusual sites.'
	}
];

/**
 * `site-id` is included so Previous/Next/Random resolve to *this* member's
 * actual ring neighbours. Pinned to the versioned `/embed.v1.js`, not the
 * bare `/embed.js` that tracks latest — a page built once and never rebuilt
 * should not silently pick up a breaking change.
 * @param {string} origin
 * @param {string} siteId
 */
function embedSnippet(origin, siteId) {
	return `<script type="module" src="${origin}/embed.v1.js"></script>\n<indienode-widget site-id="${siteId}"></indienode-widget>`;
}

/**
 * The default, recommended tier: a sandboxed iframe. No `allow-same-origin`
 * in the sandbox list — that omission is the isolation itself, forcing an
 * opaque origin regardless of which URL served the frame. `allow-popups`
 * plus `allow-popups-to-escape-sandbox` are what let Prev/Next/Random still
 * open a member's site in a real, unsandboxed tab.
 * @param {string} origin
 * @param {string} siteId
 */
function embedFrameSnippet(origin, siteId) {
	const src = `${origin}/embed-frame?site-id=${encodeURIComponent(siteId)}`;
	return `<iframe src="${src}" title="IndieNodes webring" width="260" height="150" style="border:0;" sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" loading="lazy"></iframe>`;
}

/**
 * @param {string} entryType
 */
function badgeStylesFor(entryType) {
	return BADGE_STYLES.filter((style) => !style.typesOnly || style.typesOnly.includes(entryType));
}

/**
 * @param {string} style
 * @param {string} entryType
 * @returns {string} path under the ring origin's `/badges/`
 */
function badgeAssetPath(style, entryType) {
	const file = style === 'type-coded' ? `type-coded-${entryType}.svg` : `${style}.svg`;
	return `/badges/${file}`;
}

/**
 * Where every badge and text-link click goes: a real page on IndieNodes'
 * own origin, not an inline script, since the text-link tier's markup
 * carries no script at all.
 * @param {string} origin
 */
function randomRedirectUrl(origin) {
	return `${origin}/go/random`;
}

/**
 * The copy-paste markup for a given tier — mirrors `embedFrameSnippet`/
 * `embedSnippet` exactly for the two widget tiers, so a tier switch is never
 * a second, slightly different implementation of what those already do.
 * @param {{
 *   tier: WidgetTierId,
 *   badgeStyle?: string,
 *   origin: string,
 *   siteId: string,
 *   entryType: string
 * }} options
 * @returns {string}
 */
function embedHtmlFor({ tier, badgeStyle, origin, siteId, entryType }) {
	if (tier === 'widget') return embedFrameSnippet(origin, siteId);
	if (tier === 'widget-script') return embedSnippet(origin, siteId);

	const href = randomRedirectUrl(origin);

	if (tier === 'text-link') {
		// A fixed phrase, not freely editable, so the ring stays recognizable
		// across every member site that carries it.
		return `<a href="${href}" target="_blank" rel="noopener noreferrer">&lt;&lt; Member of IndieNodes &gt;&gt;</a>`;
	}

	const style = badgeStylesFor(entryType).some((s) => s.id === badgeStyle) ? badgeStyle : 'classic';
	const src = `${origin}${badgeAssetPath(style, entryType)}`;
	return `<a href="${href}" target="_blank" rel="noopener noreferrer"><img src="${src}" width="88" height="31" alt="Member of IndieNodes" /></a>`;
}

export default {
	tiers: WIDGET_TIERS,
	badgeStyles: BADGE_STYLES,
	badgeStylesFor,
	badgeAssetPath,
	randomRedirectUrl,
	embedSnippet,
	embedFrameSnippet,
	embedHtmlFor
};
