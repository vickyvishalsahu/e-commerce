export interface SearchableProduct {
  id: string
  name: string
  categoryName: string
  description: string
}

export interface SemanticSearch {
  queryVector: ArrayLike<number>
  productVectors: Record<string, ArrayLike<number>>
}

export const SEARCH_TUNING = {
  /** Added to similarity for the share of query terms found in the name or category */
  keywordWeight: 0.1,
  /** Results more than this far below the best match are dropped */
  margin: 0.08,
  /** Nothing below this counts as a match, so gibberish finds nothing */
  minScore: 0.6,
  /** Without the model, keep products matching at least this share of the best keyword match */
  keywordRelative: 0.6,
} as const

const STOPWORDS = new Set(
  `a about after all also am an and any anything are as at be but buy by can could do does
  find for from get go good have help i i'm if im in into is it its just keep like looking me
  my need of on one or our please really so some something that the their them then there
  these they thing things this those to up use very want we what when where which while who
  will with without would you your`.split(/\s+/),
)

function stem(word: string) {
  if (/(ch|sh|ss|x)es$/.test(word)) return word.slice(0, -2)
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1)
  return word
}

/** Lowercase word stems that carry meaning, without filler like "I need something to" */
export function searchTerms(text: string) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9']+/)
    .filter((word) => word.length > 1 && !STOPWORDS.has(word))
    .map(stem)
}

function termShare(terms: string[], text: string) {
  if (terms.length === 0) return 0
  const words = new Set(searchTerms(text))
  return terms.filter((term) => words.has(term)).length / terms.length
}

function dot(a: ArrayLike<number>, b: ArrayLike<number>) {
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += (a[i] ?? 0) * (b[i] ?? 0)
  return sum
}

function keepBest(
  scores: Map<string, number>,
  threshold: (top: number) => number,
  alwaysKeep: Set<string> = new Set(),
) {
  const top = Math.max(...scores.values())
  const floor = threshold(top)
  return new Map([...scores].filter(([id, score]) => score >= floor || alwaysKeep.has(id)))
}

/**
 * Scores products against a search query and keeps the relevant ones (higher is better).
 * With vectors it ranks by meaning, boosted by name matches. Without them (the model couldn't
 * load) it falls back to the share of query terms each product mentions.
 */
export function rankProducts(
  products: SearchableProduct[],
  query: string,
  semantic: SemanticSearch | null,
): Map<string, number> {
  const terms = searchTerms(query)

  if (semantic) {
    const scores = new Map<string, number>()
    // A product named for everything the shopper typed is always a match, however it scores
    const exactMatches = new Set<string>()
    for (const product of products) {
      const vector = semantic.productVectors[product.id]
      if (!vector) continue
      const nameShare = termShare(terms, `${product.name} ${product.categoryName}`)
      if (nameShare === 1) exactMatches.add(product.id)
      scores.set(
        product.id,
        dot(semantic.queryVector, vector) + SEARCH_TUNING.keywordWeight * nameShare,
      )
    }
    if (scores.size === 0) return scores
    return keepBest(
      scores,
      (top) => Math.max(SEARCH_TUNING.minScore, top - SEARCH_TUNING.margin),
      exactMatches,
    )
  }

  const scores = new Map<string, number>()
  for (const product of products) {
    const share = termShare(terms, `${product.name} ${product.categoryName} ${product.description}`)
    if (share > 0) scores.set(product.id, share)
  }
  if (scores.size === 0) return scores
  return keepBest(scores, (top) => top * SEARCH_TUNING.keywordRelative)
}
