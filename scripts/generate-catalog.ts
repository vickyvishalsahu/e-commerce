// Generates src/mocks/data/catalog.json. Deterministic: same seed, same catalog.
// Run with `pnpm generate:catalog` after changing this file.
import { writeFileSync } from 'node:fs'
import { faker } from '@faker-js/faker'
import type { CatalogSeed, Category, Color, Product, Variant } from '../src/lib/schemas/catalog.ts'

faker.seed(20261010)
const referenceDate = new Date('2026-10-01T00:00:00Z')

const PRODUCTS_PER_CATEGORY = 25
const OUTPUT_PATH = new URL('../src/mocks/data/catalog.json', import.meta.url)

const palette = {
  charcoal: { name: 'Charcoal', hex: '#36393d' },
  cream: { name: 'Cream', hex: '#efe8da' },
  sage: { name: 'Sage', hex: '#9caf88' },
  cobalt: { name: 'Cobalt', hex: '#2f4b8a' },
  tomato: { name: 'Tomato', hex: '#c8462f' },
  oat: { name: 'Oat', hex: '#d8cbb3' },
  black: { name: 'Black', hex: '#1b1b1b' },
  natural: { name: 'Natural', hex: '#c9a77c' },
  walnut: { name: 'Walnut', hex: '#5d4030' },
  white: { name: 'White', hex: '#f7f7f5' },
  brass: { name: 'Brass', hex: '#b5974b' },
  terracotta: { name: 'Terracotta', hex: '#b5643c' },
  slate: { name: 'Slate', hex: '#5f6b73' },
  rose: { name: 'Rose', hex: '#d9a5a0' },
  olive: { name: 'Olive', hex: '#6b6b3a' },
  indigo: { name: 'Indigo', hex: '#34406b' },
} satisfies Record<string, Color>

type PaletteKey = keyof typeof palette

interface ProductTemplate {
  noun: string
  materials: string[]
  priceRange: [number, number]
  colors: PaletteKey[]
  sizes?: string[]
}

interface CategoryTemplate {
  slug: string
  name: string
  description: string
  care: string[]
  templates: ProductTemplate[]
}

const categoryTemplates: CategoryTemplate[] = [
  {
    slug: 'kitchen',
    name: 'Kitchen',
    description: 'Cookware, knives and tools for everyday cooking.',
    care: ['Hand wash recommended', 'Dry immediately after washing', 'Oven safe to 500°F'],
    templates: [
      {
        noun: 'Skillet',
        materials: ['Cast Iron', 'Carbon Steel', 'Stainless'],
        priceRange: [35, 90],
        colors: ['black', 'charcoal'],
        sizes: ['8"', '10"', '12"'],
      },
      {
        noun: 'Dutch Oven',
        materials: ['Enamel', 'Cast Iron'],
        priceRange: [60, 180],
        colors: ['tomato', 'cream', 'sage', 'cobalt'],
        sizes: ['3.5 qt', '5.5 qt', '7.25 qt'],
      },
      {
        noun: 'Saucepan',
        materials: ['Copper', 'Stainless', 'Enamel'],
        priceRange: [40, 140],
        colors: ['brass', 'charcoal', 'cream'],
        sizes: ['1.5 qt', '3 qt'],
      },
      {
        noun: "Chef's Knife",
        materials: ['Damascus', 'High Carbon', 'Stainless'],
        priceRange: [45, 220],
        colors: ['walnut', 'black'],
      },
      {
        noun: 'Cutting Board',
        materials: ['Walnut', 'Maple', 'Acacia'],
        priceRange: [30, 110],
        colors: ['natural', 'walnut'],
        sizes: ['Small', 'Medium', 'Large'],
      },
      {
        noun: 'Mixing Bowl Set',
        materials: ['Stoneware', 'Stainless', 'Glass'],
        priceRange: [28, 75],
        colors: ['cream', 'sage', 'white'],
      },
      {
        noun: 'Kettle',
        materials: ['Enamel', 'Stainless', 'Copper'],
        priceRange: [45, 130],
        colors: ['cream', 'charcoal', 'brass'],
      },
    ],
  },
  {
    slug: 'furniture',
    name: 'Furniture',
    description: 'Tables, chairs and storage built to last.',
    care: ['Wipe with a dry cloth', 'Avoid direct sunlight', 'Assembly required'],
    templates: [
      {
        noun: 'Dining Chair',
        materials: ['Oak', 'Walnut', 'Ash'],
        priceRange: [140, 380],
        colors: ['natural', 'walnut', 'black'],
      },
      {
        noun: 'Side Table',
        materials: ['Oak', 'Marble', 'Travertine'],
        priceRange: [120, 420],
        colors: ['natural', 'white', 'oat'],
      },
      {
        noun: 'Bookshelf',
        materials: ['Oak', 'Pine', 'Steel'],
        priceRange: [180, 650],
        colors: ['natural', 'black', 'white'],
        sizes: ['3-shelf', '5-shelf'],
      },
      {
        noun: 'Lounge Chair',
        materials: ['Bouclé', 'Leather', 'Linen'],
        priceRange: [450, 1400],
        colors: ['cream', 'walnut', 'olive', 'slate'],
      },
      {
        noun: 'Coffee Table',
        materials: ['Oak', 'Walnut', 'Travertine'],
        priceRange: [280, 950],
        colors: ['natural', 'walnut', 'oat'],
      },
      {
        noun: 'Bench',
        materials: ['Ash', 'Oak', 'Cane'],
        priceRange: [160, 480],
        colors: ['natural', 'black'],
        sizes: ['36"', '48"'],
      },
    ],
  },
  {
    slug: 'lighting',
    name: 'Lighting',
    description: 'Lamps and fixtures for warm, layered light.',
    care: ['Bulb not included', 'Dust with a soft cloth', 'UL listed'],
    templates: [
      {
        noun: 'Table Lamp',
        materials: ['Ceramic', 'Brass', 'Rattan'],
        priceRange: [70, 260],
        colors: ['cream', 'brass', 'terracotta', 'sage'],
      },
      {
        noun: 'Floor Lamp',
        materials: ['Brass', 'Steel', 'Linen'],
        priceRange: [160, 520],
        colors: ['brass', 'black', 'white'],
      },
      {
        noun: 'Pendant Light',
        materials: ['Glass', 'Rattan', 'Aluminum'],
        priceRange: [90, 380],
        colors: ['white', 'natural', 'black'],
        sizes: ['12"', '18"'],
      },
      {
        noun: 'Wall Sconce',
        materials: ['Brass', 'Plaster', 'Steel'],
        priceRange: [80, 240],
        colors: ['brass', 'white', 'black'],
      },
      {
        noun: 'Desk Lamp',
        materials: ['Steel', 'Aluminum', 'Brass'],
        priceRange: [60, 210],
        colors: ['black', 'white', 'cobalt'],
      },
    ],
  },
  {
    slug: 'textiles',
    name: 'Textiles',
    description: 'Bedding, throws and rugs in natural fibers.',
    care: ['Machine wash cold', 'Tumble dry low', 'OEKO-TEX certified'],
    templates: [
      {
        noun: 'Throw Blanket',
        materials: ['Linen', 'Wool', 'Cotton'],
        priceRange: [60, 180],
        colors: ['sage', 'oat', 'rose', 'charcoal'],
        sizes: ['Twin', 'Queen', 'King'],
      },
      {
        noun: 'Duvet Cover',
        materials: ['Linen', 'Percale', 'Sateen'],
        priceRange: [110, 320],
        colors: ['white', 'oat', 'sage', 'slate'],
        sizes: ['Twin', 'Queen', 'King'],
      },
      {
        noun: 'Sheet Set',
        materials: ['Linen', 'Percale', 'Sateen'],
        priceRange: [90, 260],
        colors: ['white', 'cream', 'indigo'],
        sizes: ['Twin', 'Queen', 'King'],
      },
      {
        noun: 'Pillow Cover',
        materials: ['Linen', 'Velvet', 'Wool'],
        priceRange: [28, 75],
        colors: ['terracotta', 'olive', 'cream', 'indigo'],
        sizes: ['18"', '20"', '22"'],
      },
      {
        noun: 'Area Rug',
        materials: ['Wool', 'Jute', 'Cotton'],
        priceRange: [150, 980],
        colors: ['oat', 'natural', 'slate'],
        sizes: ["5' x 8'", "8' x 10'", "9' x 12'"],
      },
    ],
  },
  {
    slug: 'bath',
    name: 'Bath',
    description: 'Towels, robes and bath accessories.',
    care: ['Machine wash warm', 'Tumble dry medium', 'Wash before first use'],
    templates: [
      {
        noun: 'Bath Towel',
        materials: ['Waffle', 'Turkish Cotton', 'Organic Cotton'],
        priceRange: [18, 48],
        colors: ['white', 'oat', 'sage', 'rose'],
        sizes: ['Hand', 'Bath', 'Sheet'],
      },
      {
        noun: 'Robe',
        materials: ['Waffle', 'Terry', 'Linen'],
        priceRange: [70, 160],
        colors: ['white', 'oat', 'slate'],
        sizes: ['S/M', 'L/XL'],
      },
      {
        noun: 'Bath Mat',
        materials: ['Cotton', 'Teak', 'Diatomite'],
        priceRange: [25, 85],
        colors: ['white', 'natural', 'charcoal'],
      },
      {
        noun: 'Soap Dish',
        materials: ['Marble', 'Ceramic', 'Teak'],
        priceRange: [14, 40],
        colors: ['white', 'terracotta', 'natural'],
      },
      {
        noun: 'Shower Curtain',
        materials: ['Linen', 'Waffle', 'Cotton'],
        priceRange: [45, 110],
        colors: ['white', 'sage', 'oat'],
      },
    ],
  },
  {
    slug: 'decor',
    name: 'Decor',
    description: 'Vases, mirrors and objects that finish a room.',
    care: ['Wipe clean', 'Handmade, variations are expected', 'Not food safe'],
    templates: [
      {
        noun: 'Vase',
        materials: ['Stoneware', 'Glass', 'Terracotta'],
        priceRange: [30, 140],
        colors: ['cream', 'terracotta', 'sage', 'black'],
        sizes: ['Small', 'Large'],
      },
      {
        noun: 'Mirror',
        materials: ['Brass', 'Oak', 'Iron'],
        priceRange: [120, 480],
        colors: ['brass', 'natural', 'black'],
        sizes: ['24"', '36"'],
      },
      {
        noun: 'Candle Holder',
        materials: ['Brass', 'Ceramic', 'Marble'],
        priceRange: [22, 80],
        colors: ['brass', 'white', 'charcoal'],
      },
      {
        noun: 'Wall Clock',
        materials: ['Oak', 'Steel', 'Walnut'],
        priceRange: [55, 160],
        colors: ['natural', 'black', 'walnut'],
      },
      {
        noun: 'Storage Basket',
        materials: ['Seagrass', 'Rattan', 'Jute'],
        priceRange: [28, 95],
        colors: ['natural', 'oat'],
        sizes: ['Small', 'Medium', 'Large'],
      },
    ],
  },
  {
    slug: 'outdoor',
    name: 'Outdoor',
    description: 'Furniture and accessories for patios and gardens.',
    care: ['Weather resistant', 'Store covered in winter', 'Rinse with water to clean'],
    templates: [
      {
        noun: 'Lounge Chair',
        materials: ['Teak', 'Aluminum', 'Rope'],
        priceRange: [240, 780],
        colors: ['natural', 'white', 'charcoal'],
      },
      {
        noun: 'Planter',
        materials: ['Terracotta', 'Concrete', 'Fiberstone'],
        priceRange: [30, 180],
        colors: ['terracotta', 'slate', 'white'],
        sizes: ['10"', '14"', '20"'],
      },
      {
        noun: 'Outdoor Rug',
        materials: ['Polypropylene', 'Recycled PET'],
        priceRange: [90, 340],
        colors: ['indigo', 'oat', 'olive'],
        sizes: ["5' x 7'", "8' x 10'"],
      },
      {
        noun: 'Lantern',
        materials: ['Iron', 'Teak', 'Glass'],
        priceRange: [40, 150],
        colors: ['black', 'natural', 'brass'],
        sizes: ['Small', 'Large'],
      },
      {
        noun: 'Dining Table',
        materials: ['Teak', 'Aluminum', 'Acacia'],
        priceRange: [480, 1600],
        colors: ['natural', 'charcoal'],
        sizes: ['4-seat', '6-seat'],
      },
    ],
  },
  {
    slug: 'stationery',
    name: 'Stationery',
    description: 'Notebooks, pens and desk goods.',
    care: ['Acid-free paper', 'Made in small batches', 'Refills available'],
    templates: [
      {
        noun: 'Notebook',
        materials: ['Linen-Bound', 'Leather', 'Recycled Paper'],
        priceRange: [12, 45],
        colors: ['cobalt', 'tomato', 'olive', 'black'],
        sizes: ['A6', 'A5', 'A4'],
      },
      {
        noun: 'Fountain Pen',
        materials: ['Brass', 'Aluminum', 'Resin'],
        priceRange: [35, 180],
        colors: ['brass', 'black', 'cobalt'],
      },
      {
        noun: 'Desk Organizer',
        materials: ['Walnut', 'Steel', 'Leather'],
        priceRange: [30, 120],
        colors: ['walnut', 'black', 'natural'],
      },
      {
        noun: 'Planner',
        materials: ['Linen-Bound', 'Leather', 'Cloth'],
        priceRange: [24, 60],
        colors: ['sage', 'indigo', 'rose'],
      },
      {
        noun: 'Card Set',
        materials: ['Letterpress', 'Cotton Paper', 'Recycled Paper'],
        priceRange: [10, 32],
        colors: ['cream', 'white'],
      },
    ],
  },
]

const namePrefixes = [
  'Everyday',
  'Heritage',
  'Studio',
  'Classic',
  'Field',
  'Harbor',
  'Atelier',
  'Coastal',
  'Meadow',
  'Nordic',
  'Canyon',
  'Willow',
]

const descriptionOpeners = [
  'Designed for daily use and made to get better with age.',
  'A quiet, well-made piece that fits into almost any room.',
  'Simple lines and honest materials, built to last for years.',
  'Made in small batches by a family-run workshop.',
  'Our best-selling design, refined over several seasons.',
]

const reviewTitles: Record<number, string[]> = {
  1: ['Disappointed', 'Not as pictured', 'Returned it'],
  2: ['Okay, not great', 'Expected more for the price', 'Quality issues'],
  3: ['Decent', 'Does the job', 'Mixed feelings'],
  4: ['Really nice', 'Very happy with it', 'Great quality', 'Would buy again'],
  5: ['Love it', 'Perfect', 'Exceeded expectations', 'Worth every penny', 'Beautiful'],
}

const reviewSentences: Record<number, string[]> = {
  1: [
    'It arrived damaged and the replacement took weeks.',
    'The color is nothing like the photos.',
    'Started falling apart within a month.',
  ],
  2: [
    'The finish is rougher than I expected.',
    'Smaller than it looks online.',
    'Shipping took longer than promised.',
  ],
  3: [
    'Solid enough, though not quite as nice as the photos.',
    'It works, but I probably would not buy it again at full price.',
    'Fine for the price.',
  ],
  4: [
    'Feels sturdy and well made.',
    'The color is lovely in person.',
    'Arrived quickly and was packed well.',
    'Gets compliments from guests.',
  ],
  5: [
    'Even better than I hoped.',
    'You can tell real care went into making it.',
    'I have already ordered a second one as a gift.',
    'Quality is outstanding for the price.',
    'Use it every single day.',
  ],
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/["']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function toDollarCents(dollars: number) {
  return Math.round(dollars) * 100
}

function pickRating() {
  return faker.helpers.weightedArrayElement([
    { weight: 5, value: 1 },
    { weight: 7, value: 2 },
    { weight: 15, value: 3 },
    { weight: 33, value: 4 },
    { weight: 40, value: 5 },
  ])
}

function buildCategory(template: CategoryTemplate, index: number): Category {
  return {
    id: `cat_${index + 1}`,
    slug: template.slug,
    name: template.name,
    description: template.description,
    imageUrl: `https://picsum.photos/seed/category-${template.slug}/800/600`,
  }
}

const categories = categoryTemplates.map(buildCategory)
const products: Product[] = []
const reviews: CatalogSeed['reviews'] = []
const usedSlugs = new Set<string>()

categoryTemplates.forEach((categoryTemplate, categoryIndex) => {
  const category = categories[categoryIndex]
  if (!category) throw new Error(`Missing category ${categoryTemplate.slug}`)

  for (let n = 0; n < PRODUCTS_PER_CATEGORY; n++) {
    const template = faker.helpers.arrayElement(categoryTemplate.templates)
    const material = faker.helpers.arrayElement(template.materials)

    let name = `${material} ${template.noun}`
    while (usedSlugs.has(slugify(name))) {
      name = `${faker.helpers.arrayElement(namePrefixes)} ${material} ${template.noun}`
    }
    const slug = slugify(name)
    usedSlugs.add(slug)

    const productId = `prod_${products.length + 1}`
    const colorCount = faker.number.int({ min: 1, max: Math.min(3, template.colors.length) })
    const colors = faker.helpers
      .arrayElements(template.colors, colorCount)
      .map((key) => palette[key])
    const sizes = template.sizes ?? []
    const basePrice = faker.number.int({ min: template.priceRange[0], max: template.priceRange[1] })
    const onSale = faker.datatype.boolean({ probability: 0.2 })
    const sizeStep = Math.max(5, Math.round(basePrice * 0.15))

    const variants: Variant[] = colors.flatMap((color, colorIndex) => {
      const sizeOptions = sizes.length > 0 ? sizes : [null]
      return sizeOptions.map((size, sizeIndex) => {
        const priceCents = toDollarCents(basePrice + sizeIndex * sizeStep)
        return {
          id: `${productId}_v${colorIndex + 1}${sizeIndex + 1}`,
          sku: `${categoryTemplate.slug.slice(0, 3).toUpperCase()}-${String(products.length + 1).padStart(4, '0')}-${colorIndex + 1}${sizeIndex + 1}`,
          color: color.name,
          size,
          priceCents,
          compareAtPriceCents: onSale ? Math.round((priceCents * 1.3) / 100) * 100 : null,
          stock: faker.datatype.boolean({ probability: 0.12 })
            ? 0
            : faker.number.int({ min: 1, max: 30 }),
        }
      })
    })

    const images = colors.flatMap((color) =>
      [1, 2, 3].map((shot) => ({
        url: `https://picsum.photos/seed/${slug}-${slugify(color.name)}-${shot}/800/1000`,
        alt: `${name} in ${color.name.toLowerCase()}, view ${shot}`,
        color: color.name,
      })),
    )

    const productReviews = Array.from({ length: faker.number.int({ min: 0, max: 24 }) }, (_, i) => {
      const rating = pickRating()
      return {
        id: `${productId}_r${i + 1}`,
        productId,
        author: `${faker.person.firstName()} ${faker.person.lastName().charAt(0)}.`,
        rating,
        title: faker.helpers.arrayElement(reviewTitles[rating] ?? []),
        body: faker.helpers
          .arrayElements(reviewSentences[rating] ?? [], { min: 1, max: 3 })
          .join(' '),
        createdAt: faker.date.past({ years: 2, refDate: referenceDate }).toISOString(),
      }
    })
    reviews.push(...productReviews)

    const ratingTotal = productReviews.reduce((sum, review) => sum + review.rating, 0)
    const ratingAverage =
      productReviews.length > 0 ? Math.round((ratingTotal / productReviews.length) * 10) / 10 : 0

    products.push({
      id: productId,
      slug,
      name,
      description: `${faker.helpers.arrayElement(descriptionOpeners)} Crafted from ${material.toLowerCase()} and finished by hand.`,
      details: [`Material: ${material}`, ...faker.helpers.arrayElements(categoryTemplate.care, 2)],
      categoryId: category.id,
      categorySlug: category.slug,
      colors,
      sizes,
      images,
      variants,
      rating: { average: ratingAverage, count: productReviews.length },
      featured: n < 2,
      createdAt: faker.date.past({ years: 2, refDate: referenceDate }).toISOString(),
    })
  }
})

const seed: CatalogSeed = { categories, products, reviews }
writeFileSync(OUTPUT_PATH, `${JSON.stringify(seed)}\n`)
console.log(
  `Wrote ${products.length} products, ${reviews.length} reviews to ${OUTPUT_PATH.pathname}`,
)
