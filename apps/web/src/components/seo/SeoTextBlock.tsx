type SeoTextBlockProps = {
  text?: string;
  title?: string;
  className?: string;
};

function splitSeoText(text: string): string[] {
  return text
    .split(/\n\s*\n/g)
    .map((part) => part.trim())
    .filter(Boolean);
}

const SeoTextBlock = ({
  text,
  title = 'Інформація для сторінки',
  className = '',
}: SeoTextBlockProps) => {
  if (!text || !text.trim()) {
    return null;
  }

  const paragraphs = splitSeoText(text.trim());
  const firstParagraph = paragraphs[0] ?? '';
  const remainingParagraphs = paragraphs.slice(1);
  const hasCollapsibleContent = remainingParagraphs.length > 0;

  return (
    <section className={`border-t border-white px-5 py-8 text-white 1440:px-14 ${className}`}>
      <div className="max-w-5xl">
        <h2 className="mb-4 text-lg font-semibold uppercase tracking-[1px] 375:text-xl">
          {title}
        </h2>
        <div className="space-y-4 text-sm leading-relaxed text-white/85 375:text-base">
          <p className="text-white/55 uppercase tracking-[0.08em] text-xs 375:text-sm">
            Коротко:
          </p>
          <p className="whitespace-pre-line">{firstParagraph}</p>

          {hasCollapsibleContent && (
            <details className="group">
              <summary className="cursor-pointer list-none text-left uppercase text-white underline underline-offset-4 transition-opacity hover:opacity-70 [&::-webkit-details-marker]:hidden">
                <span className="group-open:hidden">Розгорнути повний текст</span>
                <span className="hidden group-open:inline">Згорнути текст</span>
              </summary>

              <div className="mt-4 space-y-4">
                {remainingParagraphs.map((paragraph, index) => (
                  <p key={`${index}-${paragraph}`} className="whitespace-pre-line">
                    {paragraph}
                  </p>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>
    </section>
  );
};

export default SeoTextBlock;
