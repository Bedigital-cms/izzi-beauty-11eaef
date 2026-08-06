/** Blog index + posts — data lives in content/<locale>/blog.json (CMS + AI editable). `posts` is
 *  keyed by slug; add a key to publish a new /blog/<slug> article. */
import type { BlogCollection, BlogIndexContent } from '@/lib/types'

import { loadContent } from './load'

type BlogFile = { index: BlogIndexContent; posts: BlogCollection }

export function getBlogIndex(locale: string): BlogIndexContent {
  return loadContent<BlogFile>('blog', locale).index
}
export function getPosts(locale: string): BlogCollection {
  return loadContent<BlogFile>('blog', locale).posts
}
export function getPostSlugs(locale: string): string[] {
  return Object.keys(getPosts(locale))
}

/** Card-shaped view of every post, as the blog index grid consumes it. */
export function getBlogCards(locale: string) {
  const posts = getPosts(locale)
  return Object.keys(posts).map((slug) => ({
    slug,
    title: posts[slug].title,
    excerpt: posts[slug].excerpt,
    image: posts[slug].image,
    date: posts[slug].date,
    category: posts[slug].category,
  }))
}
