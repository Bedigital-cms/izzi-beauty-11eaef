import type { Metadata } from 'next'

import { Shell } from '@/components/Shell'
import { BlogGrid, CtaBand, PageHero } from '@/components/sections'
import { getBlogCards, getBlogIndex } from '@/content/blog'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const data = getBlogIndex(locale)
  return { title: `${data.hero.title} — IZZI Beauty`, description: data.hero.text }
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const blogIndex = getBlogIndex(locale)
  return (
    <Shell locale={locale}>
      <PageHero {...blogIndex.hero} />
      <section className="section">
        <div className="container">
          <BlogGrid posts={getBlogCards(locale)} page={1} />
        </div>
      </section>
      <CtaBand cta={blogIndex.cta} />
    </Shell>
  )
}
