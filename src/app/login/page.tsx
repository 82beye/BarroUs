import LoginButton from "./login-button";

type SearchParams = Promise<{ reason?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const { reason } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight">BarroUs</h1>
        <p className="text-sm text-neutral-400">Spotify로 로그인하면 플리를 가져올 수 있어요</p>
      </div>
      {reason === "expired" ? (
        <p className="rounded-md bg-amber-950/40 px-3 py-2 text-sm text-amber-300">
          세션이 만료되었어요. 다시 로그인해 주세요.
        </p>
      ) : null}
      <LoginButton />
    </main>
  );
}
