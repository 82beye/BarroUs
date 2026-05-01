# BarroUs 매거진 적용 — 핸드오프 패키지

이 폴더의 파일들을 BarroUs 레포(`82beye/BarroUs`)에 그대로 복사하면, 매거진 시안의 디자인 시스템과 매거진화된 공유/플리 페이지가 즉시 적용됩니다.

## 적용 순서

### D. 디자인 토큰 + 폰트 셋업
1. `src/app/globals.css` ← `globals.css`
2. `src/app/layout.tsx` ← `layout.tsx`
3. (선택) `next.config.ts`의 `images.remotePatterns`에 `cdn.jsdelivr.net` 추가 — Pretendard CDN 쓸 경우 X (CSS만 import).

### A. 컴포넌트 매거진화
4. `src/components/playlist-tracks-view.tsx` ← `playlist-tracks-view.tsx`
   → `/p/[shareId]`, `/dashboard/playlist/[nodeId]` 두 페이지 동시 적용
5. `src/app/p/[shareId]/page.tsx` ← `share-page.tsx` (footer만 매거진 톤으로 교체)
6. `src/app/login/page.tsx` ← `login-page.tsx`

### B. (선택) 랜딩 페이지 신설
7. `src/app/page.tsx`를 비로그인 사용자에게 매거진 랜딩 보여주는 형태로 변경 — `landing-page.tsx` 참고

## 디자인 토큰

| Variable | Light | Dark | Tailwind |
|---|---|---|---|
| `--bg` | `#F2EFE7` | `#0C0C0C` | `bg-bg` |
| `--ink` | `#0E0E0E` | `#ECE8DD` | `text-ink` |
| `--muted` | `#6B6B66` | `#8A8780` | `text-muted` |
| `--accent` | `#E54A28` | `#E54A28` | `text-accent` / `bg-accent` |
| `--line` | `#1A1A1A` | `#ECE8DD` | `border-line` |
| `--card` | `#E7E2D3` | `#161614` | `bg-card` |

폰트:
- `--font-sans` : Pretendard (한글 본문/디스플레이)
- `--font-serif` : Newsreader (이탤릭 액센트)
- `--font-mono` : JetBrains Mono (메타·BPM·시간)

## 참고
- Tailwind v4의 `@theme` 블록에 모든 토큰을 등록하므로, `text-accent`, `bg-bg` 같은 유틸리티가 자동 생성됩니다.
- 다크 모드는 `html[data-theme="dark"]`로 제어. 토글은 클라이언트 컴포넌트에서 `document.documentElement.dataset.theme = 'dark'`.
- 한글 줄바꿈은 모든 디스플레이 타입에 `[word-break:keep-all]` 적용.
