# Vercel 배포 후 로그인(Supabase) 설정

## 브라우저 주소창에 뭘 써야 하나요? (404가 날 때)

- **문서에 나온 `본인-프로젝트`, `coot-ai-xxxx`, `xxxx` 같은 글자는 예시입니다.**  
  특히 **`coot-ai-xxxx` 를 그대로 주소창에 넣으면 안 됩니다.** 실제 도메인이 아닙니다.
- 주소 끝의 **`/**` 는 Supabase「Redirect URLs」목록에만 넣는 패턴**이고, **브라우저에는 넣지 마세요.**
- **실제 주소는 반드시** [Vercel 대시보드](https://vercel.com/dashboard) → 프로젝트(`coot_ai` 등) 클릭 → **Visit** 또는 **Settings → Domains** 에서 **복사**합니다.  
  프로젝트마다 `https://…vercel.app` 가운데 이름이 **다릅니다.** (문서에 적어 둔 예시 URL을 따라 쓰지 마세요.)
- 더 자세한 오류 대응: [Vercel-404-해결.md](./Vercel-404-해결.md)

이 앱의 로그인·회원가입은 **Supabase Auth**를 사용합니다.  
Vercel에는 **비밀 값을 직접 넣어야** 하며, [Supabase 대시보드](https://supabase.com/dashboard)에서 **허용 URL**도 맞춰야 합니다.

---

## 1) Supabase에서 값 복사

1. [Supabase](https://supabase.com/) → 프로젝트 선택  
2. **Project Settings → API**
   - **Project URL** → 나중에 `NEXT_PUBLIC_SUPABASE_URL` 에 붙여넣기  
   - **Project API keys** 의 **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. (처음 한 번) **SQL Editor**에서 저장소의 `supabase/schema.sql` 내용을 실행해 `hub_states` 등 테이블을 만듭니다. (README 참고)

4. **Authentication → Providers → Email** 에서 이메일 로그인을 켭니다.

---

## 2) Vercel 프로젝트에 환경 변수 넣기

배포 화면의 **Environment Variables** 를 펼치거나, 배포 후 **Settings → Environment Variables** 에서 아래를 추가합니다.

| Key | Value | 비고 |
|-----|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase **Project URL** (대시보드에서 복사) | 예: `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **anon public** 키 | 공개용 anon 키 (서비스 롤 키 넣지 마세요) |
| `NEXT_PUBLIC_SITE_URL` | Vercel **Domains**에 보이는 프로덕션 URL 전체 (대시보드에서 복사) | **끝에 `/` 없이** · 문서 예시 문자열 넣지 말 것 |

- **Production**, **Preview**, **Development** 모두에 넣어두면 미리보기 URL에서도 테스트하기 쉽습니다.
- 값을 저장한 뒤 **Redeploy** 가 필요합니다. (Deployments → 해당 배포의 ⋮ → Redeploy)

`NEXT_PUBLIC_SITE_URL` 은 OG·메타데이터용이며, 회원가입/비밀번호 재설정 API는 요청 `Origin` 을 우선 사용합니다. 그래도 **배포 주소와 동일하게** 두는 것을 권장합니다.

---

## 3) Supabase에 Vercel 주소 허용 (필수)

배포가 끝나면 Vercel **Domains**에 **실제 사이트 주소**가 표시됩니다. 문서에 있던 예시 도메인을 따라 쓰지 마세요.

Supabase 대시보드:

1. **Authentication → URL Configuration**
2. **Site URL**  
   - Vercel에서 복사한 프로덕션 `https://…vercel.app` (끝 `/` 없이)
3. **Redirect URLs** 에 다음을 추가 (각 줄 하나씩). **여기만** 끝에 `/**` 를 붙입니다. (브라우저 주소 아님)

```text
http://localhost:3000/**
https://(Vercel-Domains에-보이는-호스트명).vercel.app/**
```

- 괄호 부분은 **Vercel → Settings → Domains** 에 적힌 `…vercel.app` 앞의 한 덩어리와 동일하게 넣습니다. (직접 복사해 조합하는 것이 안전합니다.)
- Preview 배포(미리보기 URL)도 쓰려면 Vercel이 주는 `*.vercel.app` 형태를 추가할 수 있습니다. (보안 정책에 맞게 필요한 만큼만 추가)

이메일 인증 링크·비밀번호 재설정 링크가 이 목록에 없으면 **로그인/콜백이 막힐 수 있습니다.**

---

## 4) 확인 순서

1. 배포 URL로 접속 → 헤더에 **로그인 / 회원가입** 표시  
2. 회원가입 → 이메일 인증을 켠 경우 메일의 링크 클릭 → `/auth/callback` 으로 돌아오는지  
3. 로그인 → 로그아웃까지 동작

문제가 있으면 브라우저 콘솔·Vercel **Functions / Logs**·Supabase **Authentication → Users** 를 확인합니다.

---

## 5) 로컬과 동시에 쓰기

- 로컬: `.env.local` 에 동일한 키 + `NEXT_PUBLIC_SITE_URL=http://localhost:3000`  
- Supabase **Redirect URLs** 에 `http://localhost:3000/**` 가 포함되어 있어야 합니다.
