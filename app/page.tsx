import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[var(--mc-surface)] p-8">
      <main className="max-w-lg text-center">
        <h1 className="text-2xl font-semibold text-zinc-900">MediChat</h1>
        <p className="mt-2 text-zinc-600">
          WebSocket chat UI for medicoz-api. Open the consultation workspace to
          connect with your rooms and messages.
        </p>
        <Link
          href="/chat"
          className="mt-8 inline-flex rounded-2xl bg-[var(--mc-primary)] px-8 py-3 text-sm font-medium text-white hover:opacity-95"
        >
          Open chat
        </Link>
      </main>
    </div>
  );
}
