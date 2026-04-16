'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/providers/i18n-provider';
import { getGuideContent, GuideSection } from '@/lib/guide-content';

export default function GuidePage() {
  const { lang } = useI18n();
  const [sections, setSections] = useState<GuideSection[]>([]);
  const [tocOpen, setTocOpen] = useState(false);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    setSections(getGuideContent(lang));
  }, [lang]);

  // Track active section on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-20% 0px -60% 0px' }
    );

    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTocOpen(false);
    }
  };

  const tocTitle = lang === 'ko' ? '📖 가이드 목차' : '📖 Guide';

  return (
    <div className="guide-page">
      {/* Mobile TOC Toggle */}
      <button
        className="guide-toc-toggle"
        onClick={() => setTocOpen(!tocOpen)}
        aria-label="Toggle table of contents"
      >
        <span>{tocTitle}</span>
        <span className={`guide-toc-arrow ${tocOpen ? 'open' : ''}`}>▼</span>
      </button>

      {/* TOC */}
      <nav className={`guide-toc ${tocOpen ? 'open' : ''}`}>
        <h2 className="guide-toc-title">{tocTitle}</h2>
        <ul>
          {sections.map((s) => (
            <li key={s.id}>
              <button
                className={`guide-toc-link ${activeId === s.id ? 'active' : ''}`}
                onClick={() => scrollTo(s.id)}
              >
                {s.title}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Content */}
      <div className="guide-content">
        {sections.map((s) => (
          <section key={s.id} id={s.id} className="guide-section">
            <h2>{s.title}</h2>
            <div className="guide-text">
              {s.content.split('\n').map((line, i) => {
                if (!line.trim()) return <br key={i} />;
                // Bold text
                const parts = line.split(/(\*\*[^*]+\*\*)/g);
                return (
                  <p key={i}>
                    {parts.map((part, j) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={j}>{part.slice(2, -2)}</strong>;
                      }
                      return <span key={j}>{part}</span>;
                    })}
                  </p>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
