import type { Metadata } from 'next'

import Form, { type FormDef } from '@/components/Form'
import { Shell } from '@/components/Shell'
import { CtaBand, LocationCards, PageHero } from '@/components/sections'
import { getContact } from '@/content/contact'
import { loadForm } from '@/content/load'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const data = getContact(locale)
  return { title: `${data.hero.title} — IZZI Beauty`, description: data.hero.text }
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const contact = getContact(locale)
  const contactForm = loadForm<FormDef>('contact', locale)
  return (
    <Shell locale={locale}>
      <PageHero {...contact.hero} />

      <section className="section">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-info">
              <span className="eyebrow">{contact.intro.title}</span>
              <h2>{contact.intro.title}</h2>
              <p>{contact.intro.text}</p>
            </div>
            <div className="contact-form">
              <Form slug="contact" def={contactForm} />
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--champagne)' }}>
        <div className="container">
          <div className="section-head center">
            <span className="eyebrow center">Onze locaties</span>
            <h2>Bezoek een van onze studio&rsquo;s</h2>
          </div>
          <LocationCards items={contact.locations} />
        </div>
      </section>

      <CtaBand cta={contact.cta} />
    </Shell>
  )
}
