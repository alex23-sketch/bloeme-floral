import { useId, useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '../../lib/cn';

export type AccordionItem = { id: string; question: string; answer: string };

export function Accordion({ items, defaultOpen, className }: { items: AccordionItem[]; defaultOpen?: string; className?: string }) {
  const [openId, setOpenId] = useState<string | null>(defaultOpen ?? null);
  const baseId = useId();

  return (
    <div className={cn('divide-y divide-line border-y border-line', className)}>
      {items.map((item) => {
        const open = openId === item.id;
        const panelId = `${baseId}-${item.id}-panel`;
        const buttonId = `${baseId}-${item.id}-button`;
        return (
          <div key={item.id}>
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenId(open ? null : item.id)}
                className="flex w-full items-center justify-between gap-6 py-5 text-left"
              >
                <span className={cn('font-serif text-[1.15rem] transition-colors', open ? 'text-burgundy' : 'text-charcoal')}>{item.question}</span>
                <Plus
                  size={17}
                  strokeWidth={1.25}
                  aria-hidden="true"
                  className={cn('shrink-0 text-gold transition-transform duration-300', open && 'rotate-45')}
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!open}
              className="pb-6 pr-10 text-[0.88rem] leading-[1.75] text-charcoal-soft"
            >
              {item.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
}