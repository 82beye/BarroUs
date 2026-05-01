import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen max-w-[1280px] flex-col px-5 pb-20 md:px-10">
      {/* MASTHEAD */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-6 border-b border-line pt-6 pb-3.5 md:pt-8">
        <div className="hidden gap-4 text-[11px] uppercase tracking-[0.12em] md:flex">
          <span className="text-ink">소개</span>
          <span className="text-muted">예시</span>
        </div>
        <div className="font-serif text-3xl italic leading-none tracking-[-0.02em] md:text-4xl md:text-center">
          <em>Barro</em>
          <b className="not-italic font-sans font-semibold tracking-[-0.04em]">Us</b>
        </div>
        <div className="flex justify-end gap-3 text-[11px] uppercase tracking-[0.12em]">
          <Link href="/login" className="text-ink hover:text-accent">
            로그인
          </Link>
        </div>
      </div>

      {/* META BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-2.5 text-[11px] uppercase tracking-[0.12em]">
        <div>
          VOL.01 · 2026 SPRING <span className="text-accent">●</span> 베타
        </div>
        <div className="text-muted">플리 한 장으로 사람을 이해하는 일</div>
        <div>₩ FREE</div>
      </div>

      {/* HERO */}
      <section className="border-b border-line py-16 md:py-20">
        <div className="mb-7 flex items-baseline justify-between">
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted">
            서비스 소개 — Issue 001
          </div>
          <div className="font-serif text-2xl italic">№ 001</div>
        </div>

        <h1 className="display-type text-[clamp(48px,9vw,128px)]">
          <span className="block">
            당신의 <em>플리</em>는
          </span>
          <span className="block pl-[8vw]">
            곧 <span className="text-accent">자서전</span>이다.
          </span>
        </h1>

        <div className="mt-10 grid gap-8 border-t border-line-soft pt-8 md:grid-cols-[1.4fr_1fr_1fr]">
          <p className="font-serif text-xl font-light leading-[1.35] text-pretty">
            BarroUs는 Spotify의 플레이리스트를{" "}
            <em className="text-accent italic">한 장의 매거진</em>으로 다시 묶어, 친구에게 건네는
            종이처럼 공유하게 합니다.
          </p>
          <div>
            <div className="mb-2 text-[11px] uppercase tracking-[0.14em] text-muted">가져오기</div>
            <p className="text-sm leading-[1.55]">
              Spotify 계정으로 로그인 한 번. 좋아요 곡과 모든 플리를 그래프로 임포트합니다.
            </p>
          </div>
          <div>
            <div className="mb-2 text-[11px] uppercase tracking-[0.14em] text-muted">공유하기</div>
            <p className="text-sm leading-[1.55]">
              로그인 없이 열리는 공유 URL. 받는 사람은 한 장의 잡지처럼 읽기만 합니다.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="flex flex-wrap items-center justify-between gap-6 border-b border-line py-7">
        <div className="font-serif text-2xl font-light italic">
          시작하려면 — Spotify 계정만 있으면 됩니다.
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-3 bg-ink px-7 py-4 text-sm font-semibold text-bg"
        >
          Spotify로 시작하기 <span className="text-accent">→</span>
        </Link>
      </section>

      {/* PULLQUOTE */}
      <section className="my-16 border-y border-line py-16 text-center">
        <p className="font-serif text-[clamp(28px,5vw,64px)] font-extralight italic leading-tight tracking-[-0.03em] text-balance">
          “플리는 결국{" "}
          <b className="font-sans font-extrabold not-italic text-accent">한 사람의 일주일</b>이다.
          <br />
          무엇을 들었는가가 아니라, <em>어떤 순서</em>로.”
        </p>
        <div className="mt-6 text-[11px] uppercase tracking-[0.16em] text-muted">
          — BARROUS, 2026
        </div>
      </section>

      {/* BIG FOOTER */}
      <footer className="border-t border-line pt-6">
        <div className="display-type text-[clamp(56px,12vw,180px)]">
          매일,
          <br />
          <em>다른</em> <span className="text-accent">플리</span>를.
        </div>
        <div className="mt-8 flex justify-between text-xs text-muted">
          <div>© 2026 BarroUs</div>
          <div>editor@barrous.kr · @barrous</div>
        </div>
      </footer>
    </main>
  );
}
