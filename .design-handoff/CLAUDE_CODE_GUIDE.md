# Claude Code 구현 가이드 — BarroUs 매거진 디자인 적용

이 문서는 Claude Code(또는 다른 AI 페어 프로그래머)에게 그대로 붙여 넣어 사용할 수 있는 **단일 프롬프트 패키지**입니다.

---

## 🚀 빠른 시작 (3단계)

### 1단계 — 핸드오프 폴더를 BarroUs 레포로 복사
```bash
# 이 프로젝트의 handoff/ 폴더를 다운로드한 뒤
cp -r ~/Downloads/handoff /path/to/BarroUs/.design-handoff
cd /path/to/BarroUs
```

### 2단계 — Claude Code 실행 후 아래 프롬프트 붙여넣기
```bash
claude
```

### 3단계 — 아래 "메인 프롬프트"를 그대로 붙여넣기

---

## 📋 메인 프롬프트 (복사해서 사용)

````
BarroUs 레포에 매거진 스타일 디자인 시스템을 적용하려고 합니다.
`.design-handoff/` 폴더에 모든 참고 파일이 있습니다. 다음 순서대로 작업해주세요.

# 컨텍스트
- 스택: Next.js 15.5 (App Router) + React 19 + Tailwind v4 + better-auth + drizzle
- Spotify 플레이리스트를 가져와 공유 URL로 보여주는 서비스
- 디자인 톤: 에디토리얼 매거진 (큰 한글 디스플레이 타입, 흑백 + 버밀리언 액센트, Pretendard + Newsreader + JetBrains Mono)

# 작업 순서

## Phase 1 — 디자인 토큰 (먼저 커밋)
1. `.design-handoff/globals.css`의 내용으로 `src/app/globals.css`를 교체
2. `.design-handoff/layout.tsx`의 내용으로 `src/app/layout.tsx`를 교체
3. `pnpm dev`로 빌드 확인 — 폰트 로드 + 토큰 적용 확인
4. 커밋: "feat(design): magazine tokens & fonts"

## Phase 2 — 핵심 컴포넌트 (가장 효과 큼)
5. `.design-handoff/playlist-tracks-view.tsx`로 `src/components/playlist-tracks-view.tsx` 교체
   - 기존 `PreviewButton` import 경로 유지
   - `PlaylistDetail` 타입 그대로 사용
   - 빌드 에러 시 타입 시그니처 조정 (Props에 showMastMeta?: boolean 추가됨)
6. `/dashboard/playlist/<nodeId>` 와 `/p/<shareId>` 두 페이지에서 시각적 확인
7. 커밋: "feat(design): magazine playlist view"

## Phase 3 — 페이지 단위 적용
8. `.design-handoff/share-page.tsx` → `src/app/p/[shareId]/page.tsx`
9. `.design-handoff/login-page.tsx` → `src/app/login/page.tsx`
10. `.design-handoff/login-button.tsx` → `src/app/login/login-button.tsx`
    (기존 onClick 로직은 유지하고 className만 교체)
11. `.design-handoff/dashboard-page.tsx` → `src/app/dashboard/page.tsx`
    (서버 페치 로직 모두 그대로, 마크업만 변경)
12. 각 페이지 라우트 방문해서 시각 확인
13. 커밋: "feat(design): magazine share / login / dashboard"

## Phase 4 — 선택 작업
14. (선택) `.design-handoff/landing-page.tsx`로 `src/app/page.tsx` 교체
    → 비로그인 시 매거진 랜딩, 로그인 시 dashboard로 redirect
15. (선택) `.design-handoff/theme-toggle.tsx`를 `src/components/`에 추가하고
    각 페이지 마스트헤드에 끼워 넣기

# 검증 체크리스트
- [ ] `pnpm typecheck` 통과
- [ ] `pnpm lint` 통과 (biome)
- [ ] `pnpm build` 통과
- [ ] `/login` 시각 확인
- [ ] `/dashboard` 시각 확인
- [ ] 임포트한 플리 클릭 → `/dashboard/playlist/[nodeId]` 시각 확인
- [ ] Share 버튼으로 생성한 `/p/[shareId]` 시각 확인
- [ ] 모바일 뷰 (390px) 확인
- [ ] 다크 모드 토글 확인 (theme-toggle 추가했다면)

# 주의사항
- Tailwind v4의 `@theme` 블록에 색을 정의하면 `bg-bg`, `text-ink` 같은 유틸리티가 자동 생성됩니다
- 다크 모드는 class가 아니라 `html[data-theme="dark"]` 셀렉터로 동작
- 한글 줄바꿈을 위해 모든 디스플레이 타입에 `[word-break:keep-all]` 적용 (display-type 클래스에 포함됨)
- 기존 `PreviewButton`, `ShareButton`, `ImportButton` 등 마이크로 컴포넌트의 스타일이 매거진 톤과 어긋나면, 같은 토큰(`bg-ink`, `text-bg`, `text-accent`)으로 통일해주세요
- `next.config.ts` 수정 불필요

# 참고 디자인 시안
`.design-handoff/BarroUs Magazine.html` — 4개 화면(Landing/Share/Login/Dashboard)의 풀 시안. 
구현 중 시각적 의문이 생기면 이 파일을 브라우저에서 열어 비교하세요.

작업 중 막히는 부분 있으면 질문해주세요.
````

---

## 🔧 부분 작업용 프롬프트

위 메인 프롬프트가 너무 큰 경우, 단계별로 쪼개서 사용:

### Phase 1만 (5분 작업)
```
.design-handoff/globals.css와 .design-handoff/layout.tsx 두 파일로
src/app/ 아래 같은 이름의 파일을 교체해주세요. 그 후 pnpm dev로 빌드 통과 확인.
```

### Phase 2만 (가장 임팩트 큼)
```
.design-handoff/playlist-tracks-view.tsx로 src/components/playlist-tracks-view.tsx를 
교체하고, 타입 호환성과 빌드를 확인해주세요. 기존 import 경로는 모두 유지.
```

### 특정 페이지만
```
/login 페이지를 매거진 톤으로 바꾸려고 합니다. 
.design-handoff/login-page.tsx와 login-button.tsx를 src/app/login/로 복사하고,
authClient.signIn.social 호출 로직이 보존됐는지 확인해주세요.
```

---

## 📦 제공 파일 목록

```
.design-handoff/
├── README.md                       # 토큰 표·매핑
├── BarroUs Magazine.html           # 4개 화면 풀 시안 (참고용)
├── globals.css                     # → src/app/globals.css
├── layout.tsx                      # → src/app/layout.tsx
├── playlist-tracks-view.tsx        # → src/components/playlist-tracks-view.tsx ⭐
├── share-page.tsx                  # → src/app/p/[shareId]/page.tsx
├── login-page.tsx                  # → src/app/login/page.tsx
├── login-button.tsx                # → src/app/login/login-button.tsx
├── dashboard-page.tsx              # → src/app/dashboard/page.tsx
├── landing-page.tsx                # (선택) → src/app/page.tsx
└── theme-toggle.tsx                # (선택) → src/components/theme-toggle.tsx
```

---

## 🎨 디자인 토큰 요약 (Claude Code 참조용)

### Colors (Tailwind v4 자동 유틸리티)
| Token | Light | Dark | Usage |
|---|---|---|---|
| `bg` | `#F2EFE7` | `#0C0C0C` | 본문 배경 |
| `ink` | `#0E0E0E` | `#ECE8DD` | 본문 텍스트 |
| `muted` | `#6B6B66` | `#8A8780` | 메타·보조 |
| `accent` | `#E54A28` | `#E54A28` | 강조 (한 색 고정) |
| `line` | `#1A1A1A` | `#ECE8DD` | 강한 구분선 |
| `line-soft` | `rgba(14,14,14,.18)` | `rgba(236,232,221,.18)` | 약한 구분선 |
| `card` | `#E7E2D3` | `#161614` | 커버 placeholder 배경 |

### Type
- `font-sans`: Pretendard
- `font-serif`: Newsreader (이탤릭 액센트)
- `font-mono`: JetBrains Mono (BPM·시간·ID)

### Display 타입
- 모바일: `clamp(40px, 9vw, ~)` 
- 데스크탑 최대: 128~168px
- 항상 `font-weight: 900`, `line-height: 0.9`, `letter-spacing: -0.045em`, `word-break: keep-all`

### 스페이싱·구분
- 섹션 사이: `border-y border-line` + `py-10 md:py-14`
- 섹션 내부: `border-b border-line-soft pb-3.5`

---

## ⚙️ Claude Code 사용 팁

1. **이 가이드 파일을 첨부**: Claude Code 세션 시작 시 `.design-handoff/CLAUDE_CODE_GUIDE.md`(이 파일)를 명시적으로 읽게 하세요.
2. **단계별 커밋**: Phase 1 → 2 → 3 순으로 각각 커밋. 롤백 안전성 확보.
3. **`pnpm typecheck`을 매 단계 호출**: Tailwind v4 임의값(`text-[clamp(...)]`)은 빌드 시 검증되므로 매번 확인.
4. **시각 검증**: 각 페이지를 실제로 열어 `BarroUs Magazine.html` 시안과 비교. Claude Code가 스크린샷 도구를 쓸 수 있으면 더 좋음.
5. **막히면 컴포넌트 단위로 쪼개기**: PlaylistTracksView가 너무 크면 Hero / Cover / TrackList 세 부분으로 나눠 단계 적용.

---

## 🆘 자주 나는 이슈 & 해결

| 증상 | 원인 | 해결 |
|---|---|---|
| Pretendard 폰트가 적용 안 됨 | CDN 로드 실패 | `globals.css`의 `@import url()`이 `@import "tailwindcss";` **다음에** 와야 함 |
| `bg-bg` 같은 유틸리티가 없음 | `@theme` 블록 인식 실패 | Tailwind 4.1.13 이상인지 확인 (`package.json`) |
| 다크 모드가 안 켜짐 | `data-theme` 미설정 | `<html data-theme="light">` 또는 `theme-toggle`로 설정 |
| 한글이 단어 중간에 잘림 | `word-break: keep-all` 누락 | `display-type` 클래스 사용 또는 `[word-break:keep-all]` 임의값 추가 |
| Image 컴포넌트 에러 | 도메인 미등록 | 기존 Spotify CDN(`i.scdn.co`)이 이미 등록돼 있으면 OK |

---

이 가이드를 그대로 Claude Code 세션 첫 메시지로 붙여 넣으면, 자율적으로 4단계를 모두 진행할 수 있습니다.
