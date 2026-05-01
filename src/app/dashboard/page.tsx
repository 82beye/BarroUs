import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ensurePersonNode } from "@/server/auth/ensure-person-node";
import LogoutButton from "./logout-button";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { nodeId: personNodeId } = await ensurePersonNode(
    session.user.id,
    session.user.name ?? session.user.email,
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">대시보드</h1>
        <LogoutButton />
      </header>
      <section className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
        <h2 className="mb-2 text-sm font-semibold text-neutral-400">로그인 정보</h2>
        <dl className="grid grid-cols-[8rem_1fr] gap-y-1 text-sm">
          <dt className="text-neutral-500">이름</dt>
          <dd>{session.user.name ?? "(이름 없음)"}</dd>
          <dt className="text-neutral-500">이메일</dt>
          <dd className="break-all">{session.user.email}</dd>
          <dt className="text-neutral-500">user.id</dt>
          <dd className="break-all font-mono text-xs text-neutral-300">{session.user.id}</dd>
          <dt className="text-neutral-500">person node</dt>
          <dd className="break-all font-mono text-xs text-neutral-300">{personNodeId}</dd>
        </dl>
      </section>
      <p className="text-sm text-neutral-500">
        D1-4(플리 임포트)와 D1-5(공유)는 다음 단계에서 추가됩니다.
      </p>
    </main>
  );
}
