# COOT Ai — AI 바로가기

Next.js 기반 로컬·웹 바로가기 허브입니다.

> **이 폴더가 메인 작업 위치입니다.** (`Desktop\COOT_Ai\Ai 바로가기`)

## 다른 PC·다른 사람도 주소만으로 들어오게 하려면

**인터넷에 공개된 주소(HTTPS)** 가 필요합니다. 가장 간단한 방법은 **Vercel**에 무료로 올리는 것입니다.

**단계별 상세 안내:** [docs/Vercel-배포-가이드.md](docs/Vercel-배포-가이드.md) (GitHub Desktop + Vercel 순서)

### 1) GitHub에 코드 올리기

1. [GitHub](https://github.com/)에 새 저장소를 만듭니다.
2. 이 폴더(`Ai 바로가기`)를 그 저장소에 푸시합니다.  
   (이미 이 폴더에서 `git init`을 했다면 `git remote add` 후 `git push`만 하면 됩니다.)

### 2) Vercel로 배포

1. [Vercel](https://vercel.com/)에 가입하고 GitHub로 로그인합니다.
2. **Add New Project** → 방금 만든 저장소를 선택합니다.
3. Framework는 **Next.js**로 자동 인식됩니다. **Deploy**를 누릅니다.
4. 끝나면 **`https://프로젝트이름.vercel.app`** 같은 주소가 생깁니다.

이 주소를 **복사해서 붙여넣기만 하면** 다른 PC, 다른 사람 브라우저에서도 같은 사이트를 열 수 있습니다.

### 3) Supabase로 회원가입·데이터 동기화 (선택이지만 권장)

**Vercel에 올린 뒤 로그인까지 쓰려면** 반드시 [docs/Vercel-로그인-Supabase.md](docs/Vercel-로그인-Supabase.md) 순서(환경 변수 + Supabase Redirect URL)를 따라주세요.

1. [Supabase](https://supabase.com/)에서 새 프로젝트를 만듭니다.
2. **Project Settings → API**에서 `Project URL`과 `anon public` 키를 복사합니다.
3. 로컬에 `.env.local` 파일을 만들고 다음을 넣습니다.

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

4. Supabase 대시보드 **SQL Editor**에서 `supabase/schema.sql` 파일 내용을 붙여 넣고 실행합니다. (`hub_states` 테이블·RLS)
5. **Authentication → Providers → Email**에서 이메일 로그인을 켭니다. (로컬 테스트 시 이메일 인증 끄기 가능)
6. 앱을 다시 실행하면 헤더에 **로그인 / 회원가입**이 보이고, 로그인한 계정마다 링크 목록이 서버에 저장되어 **다른 PC에서 같은 계정으로 로그인**하면 이어서 쓸 수 있습니다.

### 4) 배포 후 환경 변수 (선택)

배포된 사이트 주소가 정해지면 Vercel 프로젝트 **Settings → Environment Variables**에 다음을 넣을 수 있습니다.

| 이름 | 값 예시 |
|------|---------|
| `NEXT_PUBLIC_SITE_URL` | `https://프로젝트이름.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public 키 |

로컬 개발용 `.env.local`에도 동일하게 넣으면 됩니다.

---

## 로컬에서만 쓸 때

```bash
npm install
npm run dev
```

**개발 기준 주소는 [http://localhost:3000](http://localhost:3000) 만 사용합니다.** (`127.0.0.1:3000`과는 브라우저 저장소가 갈라질 수 있습니다.)  
`npm run dev`는 **포트 3000이 비어 있을 때만** 뜹니다. 이미 쓰이면 종료하며, `run-dev-clean.bat` 또는 `kill-dev-ports.bat`으로 정리한 뒤 다시 실행하세요.  
실행 시 **기본 브라우저가 자동으로 열립니다.** (Cursor 안 미리보기 대신 시스템 브라우저 사용 권장)  
브라우저 자동 실행 없이만 쓰려면: `npm run dev:no-open`  
긴급 시 다른 포트: `npm run dev:3001` (비표준, 저장 목록이 나뉠 수 있음)

---

## 데이터(링크 목록)에 대해

- **로그인하지 않은 경우:** 카테고리·링크는 **그 브라우저 localStorage**에만 저장됩니다.
- **로그인한 경우(Supabase 설정 시):** 같은 계정으로 **서버에도 저장**되어 다른 PC에서 로그인하면 이어서 씁니다. 로컬에도 미러 저장됩니다.
- **같은 공개 URL**로 들어가도, **계정이 다르면 목록은 서로 다릅니다.**
- Supabase 없이 다른 PC에 옮기려면 **「백업 내보내기」→「백업 가져오기」** 또는 **「백업 병합」**을 사용하세요.
- **쿠트 포트폴리오**는 목록 **맨 아래**에 두며, 앱을 열면 한 번 자동으로 채워집니다. 다시 시드하려면 `localStorage` 키 `coot-koot-portfolio-seed-v3`를 삭제한 뒤 새로고침하세요. 빈 구역에 기본 링크를 다시 맞추려면 `coot-fill-empty-cats-v1`도 함께 지우면 됩니다.

---

## 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버(**localhost:3000**) + **브라우저 자동 열기** |
| `npm run dev:3001` | 개발 서버(3001, 비표준) + 브라우저 자동 열기 |
| `npm run dev:no-open` | 개발 서버(3000), 브라우저 안 열림 |
| `npm run dev:3001:no-open` | 개발 서버(3001), 브라우저 안 열림 |
| `npm run build` | 프로덕션 빌드 |
| `npm run clean` | `.next` 캐시 삭제 (청크 오류 시) |
