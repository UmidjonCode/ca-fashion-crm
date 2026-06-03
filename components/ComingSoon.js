import { Hammer } from 'lucide-react';

// Lightweight placeholder used by routes that get built in later sections.
export default function ComingSoon({ eyebrow, title, description, note }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-teal-400">
        {eyebrow}
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
        {title}
      </h1>
      {description && (
        <p className="mt-2 max-w-2xl text-zinc-500">{description}</p>
      )}
      <div className="mt-8 grid place-items-center rounded-xl border-2 border-dashed border-[#2a2a35] bg-[#15151d] px-6 py-16 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-teal-500/10">
          <Hammer className="h-6 w-6 text-teal-400" />
        </div>
        <p className="mt-4 font-semibold text-zinc-300">{note}</p>
        <p className="mt-1 text-sm text-zinc-600">
          We&apos;re building this CRM section by section.
        </p>
      </div>
    </div>
  );
}
