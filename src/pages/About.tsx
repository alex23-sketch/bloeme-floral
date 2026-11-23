import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { aboutCraft, aboutHero, aboutStory, aboutSustainability, aboutTeam, aboutTimeline, storeLocation } from '../data';
import type { ContentBlock } from '../types/content';
import { MediaFrame } from '../components/ui/MediaFrame';
import { PageHero } from '../components/ui/PageHero';
import { useSeo } from '../lib/useSeo';

export function AboutPage() {
  useSeo({
    title: 'Our Story',
    description:
      'Since 2017, Bloomé Floral has composed hand-tied arrangements from a studio on Rue des Jardins. Meet the designers, the growers and the values behind the work.',
    path: '/about',
  });

  return (
    <>
      <PageHero
        eyebrow="Est. 2017 · Arcadia, California"
        title={<>A studio built on <em className="type-italic font-normal">slow flowers.</em></>}
        intro={aboutHero.subheading}
        image={aboutHero.media}
      />

      {/* story blocks */}
      <div className="shell py-16 md:py-24">
        <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-24">
          <aside className="h-fit lg:sticky lg:top-28">
            <p className="type-label flex items-center gap-3 text-[0.62rem] text-charcoal-faint">
              <span className="h-px w-8 bg-gold/70" aria-hidden="true" />
              Our story
            </p>
            <h2 className="type-heading mt-4 text-charcoal">Slow flowers, considered rooms.</h2>
            <p className="type-body mt-5">
              We are four designers, one grower and a wall of silk ribbon in an atelier on Rue des Jardins. This is how we work, and why.
            </p>
            <div className="mt-8 border-t border-line pt-6 text-[0.82rem] text-charcoal-soft">
              <p className="font-medium text-charcoal">{storeLocation.name}</p>
              <p className="mt-1">{storeLocation.street}</p>
              <p>{storeLocation.city}, {storeLocation.state} {storeLocation.postalCode}</p>
              <Link to="/contact" className="link-underline mt-3 inline-block text-[0.8rem]">
                Visit the atelier
              </Link>
            </div>
          </aside>

          <div className="space-y-14">
            {aboutStory.map((block, i) => (
              <StoryBlock key={i} block={block} index={i} />
            ))}
          </div>
        </div>
      </div>

      {/* craft band */}
      <section className="border-y border-line bg-ivory-deep/45 py-16 md:py-24">
        <div className="shell">
          <p className="type-label text-[0.62rem] text-charcoal-faint">The craft</p>
          <h2 className="type-heading mt-4 max-w-2xl text-charcoal">Unhurried by design.</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {aboutCraft.type === 'featureList' &&
              aboutCraft.items.map((item, i) => (
                <div key={item.title} className="border-t border-gold/45 pt-6">
                  <p className="font-serif text-[3.2rem] leading-none text-gold/70">{String(i + 1).padStart(2, '0')}</p>
                  <h3 className="mt-4 font-serif text-xl text-charcoal">{item.title}</h3>
                  <p className="mt-2 text-[0.86rem] leading-relaxed text-charcoal-soft">{item.body}</p>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* sustainability + image */}
      <section className="shell py-16 md:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="relative">
            <MediaFrame src="art://garden/garden/sustainability/arch" alt="Gathered garden foliage and seasonal stems" rounded="arch" className="aspect-[4/5] w-full shadow-[var(--shadow-lift)]" />
            <div className="absolute bottom-6 left-6 right-6 border border-gold/40 bg-ivory-paper/92 px-5 py-4 backdrop-blur">
              <p className="font-serif text-lg text-burgundy">72% of our stems grow</p>
              <p className="text-[0.72rem] text-charcoal-soft">within 120 miles of the studio</p>
            </div>
          </div>
          <div>
            <p className="type-label text-[0.62rem] text-charcoal-faint">Regenerative</p>
            <h2 className="type-heading mt-4 text-charcoal">Flowers that respect their origins.</h2>
            <div className="mt-6 space-y-4 text-[0.92rem] leading-[1.8] text-charcoal-soft">
              {aboutSustainability
                .filter((b): b is Extract<ContentBlock, { type: 'richText' }> => b.type === 'richText')
                .flatMap((b) => b.paragraphs)
                .map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
            </div>
            <ul className="mt-8 grid grid-cols-3 gap-4 border-t border-line pt-6 text-center">
              {aboutSustainability
                .filter((b): b is Extract<ContentBlock, { type: 'statRow' }> => b.type === 'statRow')
                .flatMap((b) => b.stats)
                .map((s) => (
                  <li key={s.label}>
                    <p className="font-serif text-[1.9rem] leading-none text-burgundy">{s.value}</p>
                    <p className="mt-2 text-[0.66rem] uppercase tracking-[0.12em] text-charcoal-faint">{s.label}</p>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </section>

      {/* team */}
      <section className="border-t border-line py-16 md:py-24">
        <div className="shell">
          <p className="type-label text-[0.62rem] text-charcoal-faint">The studio</p>
          <h2 className="type-heading mt-4 text-charcoal">The hands behind the room.</h2>
          <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {aboutTeam.map((member) => (
              <article key={member.id} className="group">
                <MediaFrame src={member.art.src} alt={member.art.alt} rounded="arch" className="aspect-[4/5] w-full" imgClassName="transition-transform duration-700 group-hover:scale-[1.03]" />
                <h3 className="mt-4 font-serif text-xl text-charcoal">{member.name}</h3>
                <p className="type-label mt-1 text-[0.56rem] text-gold">{member.role}</p>
                <p className="mt-2.5 text-[0.82rem] leading-relaxed text-charcoal-soft">{member.bio}</p>
              </article>
            ))}
          </div>
          <p className="mt-8 text-[0.7rem] text-charcoal-faint">Team portraits are placeholders rendered by the art system — swap in photography in the content layer.</p>
        </div>
      </section>

      {/* timeline */}
      <section className="bg-burgundy py-16 text-ivory md:py-24">
        <div className="shell">
          <p className="type-label text-[0.62rem] text-gold-soft">A short history</p>
          <h2 className="mt-4 font-serif text-3xl md:text-4xl">Nine years, one enamel table.</h2>
          <ol className="mt-12 grid gap-8 md:grid-cols-5">
            {aboutTimeline.map((item, i) => (
              <li key={item.year} className="border-t border-ivory/20 pt-5">
                <p className="font-serif text-2xl text-gold-soft">{item.year}</p>
                <p className="mt-2 text-[0.9rem] font-medium">{item.title}</p>
                <p className="mt-1.5 text-[0.78rem] leading-relaxed text-ivory/65">{item.body}</p>
                {i === 0 && <span className="sr-only">start of timeline</span>}
              </li>
            ))}
          </ol>
          <Link to="/contact" className="group mt-12 inline-flex items-center gap-2 border-b border-gold pb-1 text-[0.82rem] text-ivory">
            Come visit the atelier <ArrowRight size={14} strokeWidth={1.5} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>
    </>
  );
}

function StoryBlock({ block, index }: { block: ContentBlock; index: number }) {
  if (block.type === 'richText') {
    return (
      <div className="reveal">
        {block.heading && <h3 className="font-serif text-2xl text-charcoal">{block.heading}</h3>}
        <div className="mt-4 space-y-4 text-[0.94rem] leading-[1.85] text-charcoal-soft">
          {block.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    );
  }
  if (block.type === 'pullQuote') {
    return (
      <blockquote className="reveal border-l-2 border-gold pl-6 md:pl-8">
        <p className="font-serif text-[1.6rem] italic leading-[1.45] text-burgundy md:text-[1.8rem]">“{block.quote}”</p>
        {block.attribution && <footer className="mt-4 text-[0.72rem] uppercase tracking-[0.16em] text-charcoal-faint">— {block.attribution}</footer>}
      </blockquote>
    );
  }
  if (block.type === 'statRow') {
    return (
      <dl className="reveal grid grid-cols-2 gap-y-8 border-y border-line py-8 md:grid-cols-4">
        {block.stats.map((s) => (
          <div key={s.label}>
            <dd className="font-serif text-[2rem] leading-none text-burgundy">{s.value}</dd>
            <dt className="mt-2 text-[0.66rem] uppercase tracking-[0.14em] text-charcoal-faint">{s.label}</dt>
          </div>
        ))}
      </dl>
    );
  }
  if (block.type === 'imagePair') {
    return (
      <div className="reveal grid grid-cols-2 gap-4">
        {block.images.map((img, i) => (
          <MediaFrame key={i} src={img.src} alt={img.alt} rounded="soft" className="aspect-[3/4]" />
        ))}
        {block.caption && <p className="col-span-2 text-[0.72rem] text-charcoal-faint">{block.caption}</p>}
      </div>
    );
  }
  return <div className="reveal" data-block-index={index} />;
}