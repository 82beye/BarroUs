import Link from "next/link";
import LoginButton from "./login-button";

type SearchParams = Promise<{ reason?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const { reason } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-[1200px] flex-col px-5 md:px-10">
      {/* MASTHEAD */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-6 border-b border-line pt-6 pb-3.5 md:pt-8">
        <div className="hidden gap-4 text-[11px] uppercase tracking-[0.12em] md:flex">
          <Link href="/" className="text-ink hover:text-accent">
            소개
          </Link>
        </div>
        <div className="font-serif text-3xl italic leading-none tracking-[-0.02em] md:text-4xl md:text-center">
          <em>Barro</em>
          <b className="not-italic font-sans font-semibold tracking-[-0.04em]">Us</b>
        </div>
        <div className="hidden justify-end text-[11px] uppercase tracking-[0.12em] text-muted md:flex">
          ENTRY · 003
        </div>
      </div>

      {/* META BAR */}
      <div className="flex items-center justify-between border-b border-line py-2.5 text-[11px] uppercase tracking-[0.12em]">
        <div>LOG IN</div>
        <div className="text-muted">Spotify OAuth</div>
        <div>2026 SPRING</div>
      </div>

      {/* HERO */}
      <section className="grid flex-1 items-center gap-10 py-12 md:grid-cols-[1.4fr_1fr] md:gap-14 md:py-20">
        <div>
          <div className="mb-4 text-[11px] uppercase tracking-[0.14em] text-muted">
            ENTRY · ISSUE 003
          </div>
          <h1 className="display-type text-[clamp(48px,8.5vw,128px)]">
            <span className="block">
              들으셨던 <em>모든</em>
            </span>
            <span className="block">
              곡을, <span className="text-accent">한 줄</span>로.
            </span>
          </h1>
          <p className="mt-7 max-w-[46ch] font-serif text-xl font-light leading-[1.45] text-pretty">
            Spotify로 한 번 로그인하면, 좋아요 누른 곡과 모든 플리가 BarroUs로 임포트됩니다.{" "}
            <em className="text-accent">읽는 음악</em>의 시작.
          </p>
        </div>

        <div className="flex flex-col gap-5 border border-line bg-paper p-8">
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted">로그인</div>
          <div className="font-serif text-2xl font-light italic leading-snug">
            Spotify 계정만 있으면
            <br />
            바로 시작할 수 있어요.
          </div>

          {reason === "expired" ? (
            <p className="border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent">
              세션이 만료되었어요. 다시 로그인해 주세요.
            </p>
          ) : null}

          <LoginButton />

          <div className="font-mono text-[11px] leading-[1.5] text-muted">
            BarroUs는 Spotify의 읽기 권한만 사용합니다.
            <br />
            계정 정보는 저장되지 않습니다.
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <div className="mt-auto flex justify-between border-t border-line py-5 text-[11px] uppercase tracking-[0.12em] text-muted">
        <div>© BarroUs 2026</div>
        <div>BUILT IN SEOUL</div>
      </div>
    </main>
  );
}
