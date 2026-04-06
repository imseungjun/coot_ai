# Vercel 배포 후 로그인(Supabase) 설정

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
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Supabase Project URL 그대로 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (anon public) | 공개용 anon 키 (서비스 롤 키 넣지 마세요) |
| `NEXT_PUBLIC_SITE_URL` | `https://여기에-배포주소.vercel.app` | **끝에 `/` 없이** |

- **Production**, **Preview**, **Development** 모두에 넣어두면 미리보기 URL에서도 테스트하기 쉽습니다.
- 값을 저장한 뒤 **Redeploy** 가 필요합니다. (Deployments → 해당 배포의 ⋮ → Redeploy)

`NEXT_PUBLIC_SITE_URL` 은 OG·메타데이터용이며, 회원가입/비밀번호 재설정 API는 요청 `Origin` 을 우선 사용합니다. 그래도 **배포 주소와 동일하게** 두는 것을 권장합니다.

---

## 3) Supabase에 Vercel 주소 허용 (필수)

배포가 끝나면 **실제 사이트 주소**가 정해짩니다. 예:

- `https://coot-ai-xxxxx.vercel.app`

Supabase 대시보드:

1. **Authentication → URL Configuration**
2. **Site URL**  
   - 프로덕션 하나만 쓸 때: `https://coot-ai-xxxxx.vercel.app`
3. **Redirect URLs** 에 다음을 추가 (각 줄 하나씩):

```text
http://localhost:3000/**
https://coot-ai-xxxxx.vercel.app/**
```

- `coot-ai-xxxxx` 는 본인 Vercel 주소로 바꿉니다.
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
