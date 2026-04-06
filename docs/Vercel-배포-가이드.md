# COOT Ai — Vercel 무료 배포 (GitHub Desktop + Vercel)

상업 목적이 아닌 개인·비상업용이면 **Vercel Hobby(무료)** 로 시작할 수 있습니다.  
**도메인 구매는 필수가 아닙니다.** 배포가 끝나면 `https://프로젝트이름.vercel.app` 주소가 생기며, 그 링크를 공유하면 됩니다.

> **에이전트가 대신 할 수 없는 일:** GitHub·Vercel 가입, 로그인, 저장소 Publish, Deploy 버튼 클릭은 **본인 PC에서** 진행해야 합니다.  
> 아래 순서대로 하시면 됩니다.

---

## 0) 사전 확인 (이 저장소)

- 로컬에서 `npm run dev` 후 `http://localhost:3000/` 이 정상인지 확인합니다.
- 프로덕션 빌드는 `npm run build` 로 검증할 수 있습니다. (Vercel도 빌드 단계를 실행합니다.)
- **비밀 정보는 GitHub에 올리지 마세요.** `.env`, `.env.local` 은 `.gitignore` 로 제외되어 있습니다.  
  배포 후에는 Vercel **Settings → Environment Variables** 에만 넣습니다.

---

## 1) GitHub 계정

- [github.com](https://github.com/) 에서 무료 계정 생성·로그인

---

## 2) GitHub Desktop 설치

- [GitHub Desktop](https://desktop.github.com/) 설치 후 GitHub 계정으로 로그인

---

## 3) 이 프로젝트 폴더를 GitHub Desktop에 추가

- **File → Add local repository…** (또는 폴더를 창에 드래그)
- 경로: `Desktop\COOT_Ai\Ai 바로가기` 폴더 선택
- 아직 Git 저장소가 아니면 “create a repository” 안내가 나올 수 있음 → 이 폴더에서 이미 `git` 을 쓰고 있다면 그대로 추가

---

## 4) GitHub에 올리기 (Publish)

- 변경 사항이 있으면 왼쪽에서 **요약 메시지** 입력 후 **Commit to master** (또는 main)
- 상단 **Publish repository** 클릭
  - 저장소 이름 예: `coot-ai-hub` (원하는 이름, 중복만 아니면 됨)
  - **Private** 추천 (코드 비공개), 공개해도 무방
- **Publish** 완료 후 GitHub 웹에서 저장소가 보이는지 확인

**주의:** 커밋 목록에 `.env` / `.env.local` 이 **포함되지 않았는지** 한 번 확인하세요.

---

## 5) Vercel 가입·GitHub 연동

- [vercel.com](https://vercel.com/) 접속 → **Sign Up**
- **Continue with GitHub** 로 로그인
- GitHub 앱 설치·권한 요청이 나오면 **이 저장소에 대한 접근**을 허용

---

## 6) Vercel에서 프로젝트 Import

- **Add New… → Project**
- 방금 만든 GitHub 저장소 선택 → **Import**
- **Framework Preset:** Next.js (자동 인식되는 경우가 많음)
- **Root Directory:** 저장소 루트 그대로 (보통 비워 둠)
- **Build Command:** `next build` (기본)
- **Output:** Next.js 기본 (별도 설정 불필요한 경우가 많음)

---

## 7) 환경 변수 (선택이지만 권장)

배포 URL이 정해지기 **전**에도 넣을 수 있고, 첫 배포 **후**에 넣고 Redeploy 해도 됩니다.

| 이름 | 설명 |
|------|------|
| `NEXT_PUBLIC_SITE_URL` | 첫 배포 후 나온 주소, 예: `https://프로젝트이름.vercel.app` (끝 `/` 없이) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase **Project URL** (로그인·동기화 쓸 때) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase **anon public** 키 |

- **허브만 쓰고 로그인·서버 동기화가 필요 없으면** Supabase 변수는 생략 가능합니다. (브라우저 localStorage만 사용)
- 값은 로컬의 `.env.local` 과 동일하게 맞추면 됩니다.  
- **공개 서버에 `HUB_BASELINE_WRITE=1` 을 넣지 마세요.** (로컬/특수 목적용)

Vercel에서 **Environment Variables** 에 넣을 때 **Production / Preview / Development** 체크는 보통 전부 켜두면 편합니다.

---

## 8) Deploy

- **Deploy** 클릭
- 빌드 로그가 **성공**하면 배포 URL이 표시됩니다 (`*.vercel.app`)

---

## 9) 배포 후 확인

- PC·휴대폰 브라우저에서 `https://…vercel.app` 접속
- 로그인 기능을 쓰는 경우: Supabase **Authentication → URL Configuration** 에 Vercel 주소(Site URL / Redirect URLs)를 추가했는지 확인

---

## 10) 이후 수정 workflow

1. Cursor에서 코드 수정  
2. GitHub Desktop → Commit → **Push**  
3. Vercel이 자동으로 새 배포(보통 1~2분 내)

---

## 11) 나중에 도메인을 쓰고 싶을 때

- 처음에는 **유료 도메인 없이** `vercel.app` 으로 충분합니다.
- 원할 때만 가비아·Cloudflare·카페24 등에서 도메인 구매 후, Vercel **Settings → Domains** 에서 연결합니다.

---

## 문제 해결

- **빌드 실패:** Vercel 배포 로그의 에러 메시지 확인. 로컬에서 `npm run build` 가 통과하는지 확인.
- **화면은 뜨는데 로그인 안 됨:** `NEXT_PUBLIC_SUPABASE_*` 와 Supabase 대시보드의 Redirect URL 설정 확인.
- **Hobby 플랜:** Vercel 공식 약관상 개인·비상업 기준 등을 확인하세요.
