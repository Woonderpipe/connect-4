import Link from 'next/link';

export const metadata = {
  title: 'Terms of use',
  description: 'Terms of use for Connect 4.',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100 sm:px-6">
      <article className="mx-auto max-w-3xl rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-2xl sm:p-8">
        <Link className="text-sm font-bold text-amber-300 hover:text-amber-200" href="/">← Back to the game</Link>
        <h1 className="mt-6 text-3xl font-black tracking-tight sm:text-4xl">Terms of use</h1>
        <p className="mt-5 leading-7 text-zinc-300">
          These terms describe general use of the application and should be adapted to the applicable operator and jurisdiction.
        </p>
        <div className="mt-8 space-y-6 text-zinc-300">
          <section>
            <h2 className="text-lg font-black text-white">Use of the game</h2>
            <p className="mt-2 leading-7">Use the web and Android versions lawfully and do not abuse online connections, invite links, infrastructure, or other players.</p>
          </section>
          <section>
            <h2 className="text-lg font-black text-white">Availability</h2>
            <p className="mt-2 leading-7">Online play depends on third-party services and network conditions. Availability and compatibility are not guaranteed.</p>
          </section>
          <section>
            <h2 className="text-lg font-black text-white">Contact and finalization</h2>
            <p className="mt-2 leading-7">The operator should provide a valid contact channel and jurisdiction-specific terms. The project software license is Apache-2.0.</p>
          </section>
        </div>
        <div className="mt-8 flex flex-wrap gap-4 text-sm text-zinc-400">
          <Link className="underline hover:text-white" href="/open-source">Open-source licenses</Link>
          <Link className="underline hover:text-white" href="/privacy">Privacy policy</Link>
        </div>
      </article>
    </main>
  );
}

