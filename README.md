# COOT Ai — AI 바로가기

Next.js 기반 로컬·웹 바로가기 허브입니다.

## 다른 PC·다른 사람도 주소만으로 들어오게 하려면

**인터넷에 공개된 주소(HTTPS)** 가 필요합니다. 가장 간단한 방법은 **Vercel**에 무료로 올리는 것입니다.

### 1) GitHub에 코드 올리기

1. [GitHub](https://github.com/)에 새 저장소를 만듭니다.
2. 이 폴더(`COOT 통합`)를 그 저장소에 푸시합니다.  
   (이미 이 폴더에서 `git init`을 했다면 `git remote add` 후 `git push`만 하면 됩니다.)

### 2) Vercel로 배포

1. [Vercel](https://vercel.com/)에 가입하고 GitHub로 로그인합니다.
2. **Add New Project** → 방금 만든 저장소를 선택합니다.
3. Framework는 **Next.js**로 자동 인식됩니다. **Deploy**를 누릅니다.
4. 끝나면 **`https://프로젝트이름.vercel.app`** 같은 주소가 생깁니다.

이 주소를 **복사해서 붙여넣기만 하면** 다른 PC, 다른 사람 브라우저에서도 같은 사이트를 열 수 있습니다.

### 3) 배포 후 환경 변수 (선택)

배포된 사이트 주소가 정해지면 Vercel 프로젝트 **Settings → Environment Variables**에 다음을 넣을 수 있습니다.

| 이름 | 값 예시 |
|------|---------|
| `NEXT_PUBLIC_SITE_URL` | `https://프로젝트이름.vercel.app` |

로컬 개발용 `.env`에도 동일하게 넣으면 메타데이터(OG 등)에 쓰는 기준 URL이 맞춰집니다.

---

## 로컬에서만 쓸 때

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) (또는 `npm run dev:3001`이면 `:3001`) 로 접속합니다.

---

## 데이터(링크 목록)에 대해

- 카테고리·링크는 **각자 브라우저의 localStorage**에 저장됩니다.
- **같은 공개 URL**로 들어가도, **A 사용자와 B 사용자의 목록은 서로 다릅니다.**
- 다른 PC에 **같은 목록**을 옮기려면 앱 안의 **「백업 내보내기」→「백업 가져오기」** 또는 **「백업 병합」**을 사용하세요.
- 여러 사람이 **한 목록을 실시간으로 공유**하려면 나중에 서버·DB 연동이 필요합니다.

---

## 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 (포트 3000) |
| `npm run dev:3001` | 개발 서버 (포트 3001) |
| `npm run build` | 프로덕션 빌드 |
| `npm run clean` | `.next` 캐시 삭제 (청크 오류 시) |
