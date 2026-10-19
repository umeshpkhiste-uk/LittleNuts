import type { Ionicons } from '@expo/vector-icons';

// Fixed, one-time editorial content for the product detail page's "Daily
// Vitality Impact" and "Tasting Tip" sections — nutrition facts and
// handling tips are general, well-known properties of each dry fruit
// (sourced from general nutrition knowledge, not live data), keyed by
// product slug so they stay tied to a specific catalog row. A product
// added later without an entry here falls back to FALLBACK_CONTENT.

type IconName = keyof typeof Ionicons.glyphMap;

export type VitalityIcon = 'heart' | 'flash' | 'body' | 'leaf' | 'eye' | 'bulb' | 'moon' | 'shield-checkmark';

export const VITALITY_ICON_STYLE: Record<VitalityIcon, { icon: IconName; bg: string; text: string }> = {
  heart: { icon: 'heart', bg: '#F6D9D3', text: '#B4432E' },
  flash: { icon: 'flash', bg: '#FBE8B8', text: '#8A6A1A' },
  body: { icon: 'body', bg: '#E7ECDD', text: '#3F4B35' },
  leaf: { icon: 'leaf', bg: '#F0E3F6', text: '#6B3F82' },
  eye: { icon: 'eye', bg: '#DCEAF0', text: '#2E6B82' },
  bulb: { icon: 'bulb', bg: '#F3E0C7', text: '#8A5A2A' },
  moon: { icon: 'moon', bg: '#E0E4F6', text: '#3F4B82' },
  'shield-checkmark': { icon: 'shield-checkmark', bg: '#DCEFE0', text: '#2E6B4A' },
};

export type VitalityFact = {
  icon: VitalityIcon;
  title: string;
  subtitle: string;
};

export type ProductDetailContent = {
  badge: string;
  originTag: string;
  facts: VitalityFact[];
  tastingTip: string;
};

export const FALLBACK_CONTENT: ProductDetailContent = {
  badge: 'HANDPICKED QUALITY',
  originTag: 'CAREFULLY SOURCED · NATURALLY DRIED',
  facts: [
    { icon: 'heart', title: 'Heart Vitality', subtitle: 'Naturally cholesterol-free' },
    { icon: 'flash', title: 'Steady Energy', subtitle: 'Wholesome, slow-release fuel' },
    { icon: 'body', title: 'Daily Protein', subtitle: 'A plant-based protein source' },
    { icon: 'leaf', title: 'Antioxidant Rich', subtitle: 'Supports overall wellness' },
  ],
  tastingTip: 'Store in an airtight container away from direct sunlight to keep it fresh and crisp for longer.',
};

export const PRODUCT_DETAIL_CONTENT: Record<string, ProductDetailContent> = {
  'california-almonds': {
    badge: 'PREMIUM GRADE A',
    originTag: 'CALIFORNIA · SUN-DRIED',
    facts: [
      { icon: 'heart', title: 'Heart Vitality', subtitle: 'Rich in monounsaturated fat' },
      { icon: 'flash', title: 'Morning Energy', subtitle: 'Slow, steady fuel' },
      { icon: 'body', title: 'Bone Strength', subtitle: 'Magnesium & calcium' },
      { icon: 'leaf', title: 'Vitamin E', subtitle: 'Skin & cell protection' },
    ],
    tastingTip:
      'Soak 6-8 almonds overnight in water and peel before eating — it softens the skin and makes the nutrients easier to absorb.',
  },
  'mamra-almonds': {
    badge: 'MAMRA GRADE A+',
    originTag: 'KHORASAN, IRAN · WILD HARVEST',
    facts: [
      { icon: 'bulb', title: 'Brain & Memory', subtitle: 'Prized in Ayurveda for focus' },
      { icon: 'heart', title: 'Healthy Fats', subtitle: 'Higher natural oil content' },
      { icon: 'body', title: 'Protein Dense', subtitle: 'More protein per gram' },
      { icon: 'leaf', title: 'Copper Rich', subtitle: 'Supports energy metabolism' },
    ],
    tastingTip:
      'Mamra almonds are naturally oilier than regular almonds — keep them refrigerated so that richness doesn’t turn rancid.',
  },
  'whole-cashews-w240': {
    badge: 'GRADE W240',
    originTag: 'KOLLAM, KERALA · GRADE W240',
    facts: [
      { icon: 'heart', title: 'Heart Health', subtitle: 'Magnesium supports blood pressure' },
      { icon: 'shield-checkmark', title: 'Immune Support', subtitle: 'A natural source of zinc' },
      { icon: 'body', title: 'Iron Boost', subtitle: 'Copper aids iron absorption' },
      { icon: 'flash', title: 'Quick Energy', subtitle: 'Easily digestible carbs & fat' },
    ],
    tastingTip:
      'Keep cashews refrigerated in an airtight jar — their higher fat content means they turn rancid faster than other nuts at room temperature.',
  },
  'roasted-salted-pistachios': {
    badge: 'IN-SHELL ROASTED',
    originTag: 'CALIFORNIA · IN-SHELL ROASTED',
    facts: [
      { icon: 'eye', title: 'Eye Health', subtitle: 'Lutein & zeaxanthin rich' },
      { icon: 'body', title: 'Protein Rich', subtitle: 'One of the highest-protein nuts' },
      { icon: 'leaf', title: 'Fiber & Digestion', subtitle: 'Supports healthy digestion' },
      { icon: 'flash', title: 'Potassium Energy', subtitle: 'Helps muscle function' },
    ],
    tastingTip:
      'Crack the shells by hand rather than with a tool — it naturally paces out how many you eat in one sitting.',
  },
  'kashmiri-walnut-kernels': {
    badge: 'LIGHT KERNEL GRADE',
    originTag: 'KASHMIR VALLEY · HAND-SHELLED',
    facts: [
      { icon: 'bulb', title: 'Brain Focus', subtitle: 'Highest plant source of omega-3' },
      { icon: 'heart', title: 'Heart Health', subtitle: 'ALA supports healthy cholesterol' },
      { icon: 'moon', title: 'Better Sleep', subtitle: 'A natural source of melatonin' },
      { icon: 'leaf', title: 'Antioxidant Rich', subtitle: 'Among the richest of all nuts' },
    ],
    tastingTip:
      'Walnuts oxidize quickly once shelled — buy only what you’ll finish in a few weeks, or freeze the extra kernels.',
  },
  'green-seedless-raisins': {
    badge: 'SEEDLESS GRADE A',
    originTag: 'SANGLI, MAHARASHTRA · SUN-DRIED',
    facts: [
      { icon: 'flash', title: 'Quick Energy', subtitle: 'Natural fruit sugars' },
      { icon: 'body', title: 'Iron Boost', subtitle: 'Helps maintain healthy blood' },
      { icon: 'leaf', title: 'Fiber & Digestion', subtitle: 'Supports gut health' },
      { icon: 'shield-checkmark', title: 'Antioxidant Support', subtitle: 'Polyphenols from the grape skin' },
    ],
    tastingTip:
      'Rinse raisins briefly before eating to wash off the thin, natural sugar coating that forms during sun-drying.',
  },
  'medjool-dates': {
    badge: 'JUMBO MEDJOOL',
    originTag: 'JORDAN VALLEY · SOFT HARVEST',
    facts: [
      { icon: 'flash', title: 'Natural Energy', subtitle: 'Fast-absorbing fruit sugars' },
      { icon: 'heart', title: 'Potassium Rich', subtitle: 'Supports healthy heart rhythm' },
      { icon: 'leaf', title: 'Fiber Rich', subtitle: 'Keeps you fuller for longer' },
      { icon: 'body', title: 'Muscle & Nerve', subtitle: 'A good source of magnesium' },
    ],
    tastingTip:
      'Pit and stuff a Medjool date with a single almond or walnut for a quick natural-sugar-and-protein snack.',
  },
  'afghani-dried-figs': {
    badge: 'SUN-DRIED PREMIUM',
    originTag: 'KANDAHAR, AFGHANISTAN · SUN-DRIED',
    facts: [
      { icon: 'body', title: 'Bone Strength', subtitle: 'One of the richest fruit sources of calcium' },
      { icon: 'leaf', title: 'Fiber & Digestion', subtitle: 'Natural, gentle relief' },
      { icon: 'heart', title: 'Potassium Rich', subtitle: 'Supports healthy blood pressure' },
      { icon: 'flash', title: 'Iron Boost', subtitle: 'Helps maintain energy levels' },
    ],
    tastingTip:
      'Soak dried figs in warm water for about 10 minutes if you find them very chewy — it also makes the calcium easier to absorb.',
  },
  'turkish-dried-apricots': {
    badge: 'SULPHUR-FREE',
    originTag: 'MALATYA, TURKEY · SULPHUR-FREE',
    facts: [
      { icon: 'eye', title: 'Eye Health', subtitle: 'Rich in vitamin A (beta-carotene)' },
      { icon: 'body', title: 'Iron Boost', subtitle: 'Helps maintain healthy blood' },
      { icon: 'flash', title: 'Potassium Energy', subtitle: 'Helps muscle function' },
      { icon: 'leaf', title: 'Fiber Rich', subtitle: 'Supports healthy digestion' },
    ],
    tastingTip:
      'Choose the deep amber ones over the bright orange — naturally sun-dried apricots are never artificially bright.',
  },
  'festive-mix': {
    badge: 'FESTIVE SPECIAL',
    originTag: 'CURATED BLEND · FESTIVE PACK',
    facts: [
      { icon: 'heart', title: 'Heart-Healthy Fats', subtitle: 'From almonds, cashews & pistachios' },
      { icon: 'flash', title: 'All-Day Energy', subtitle: 'Nuts, fruit sugars & fiber combined' },
      { icon: 'body', title: 'Protein Rich', subtitle: 'A well-rounded protein mix' },
      { icon: 'shield-checkmark', title: 'Immune Support', subtitle: 'Zinc & antioxidants from the mix' },
    ],
    tastingTip:
      'Pick out the raisins first if sharing the mix — left together for more than a week, their moisture softens the nuts.',
  },
  'roasted-pumpkin-seeds': {
    badge: 'ROASTED & SALTED',
    originTag: 'STYRIA REGION · ROASTED & SALTED',
    facts: [
      { icon: 'shield-checkmark', title: 'Immune Support', subtitle: 'One of the best plant sources of zinc' },
      { icon: 'moon', title: 'Better Sleep', subtitle: 'Natural tryptophan content' },
      { icon: 'body', title: 'Muscle Recovery', subtitle: 'High in magnesium' },
      { icon: 'flash', title: 'Protein Energy', subtitle: 'A dense, plant-based protein source' },
    ],
    tastingTip: 'A small handful (about 28g) covers your daily magnesium needs — no need to overdo the portion.',
  },
};

export function getProductDetailContent(slug: string): ProductDetailContent {
  return PRODUCT_DETAIL_CONTENT[slug] ?? FALLBACK_CONTENT;
}
