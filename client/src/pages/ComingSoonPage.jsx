export default function ComingSoonPage({ title, description }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
      <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">Coming in a later phase</p>
      <h1 className="mt-3 text-3xl font-bold">{title}</h1>
      <p className="mt-3 max-w-2xl text-slate-300">{description}</p>
    </section>
  );
}
