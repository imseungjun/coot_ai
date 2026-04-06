# Vercel에서 `404: DEPLOYMENT_NOT_FOUND` 가 날 때

## 1) 주소를 문서 예시 그대로 쓴 경우 (가장 흔함)

아래는 **실제 주소가 아닙니다.** 브라우저에 넣으면 **절대 열리지 않습니다.**

- `https://본인-프로젝트.vercel.app`
- `https://coot-ai-xxxx.vercel.app` ← **`xxxx` 를 글자 그대로 쓴 경우**
- `https://coot-ai-xxxxx.vercel.app`

**올바른 주소는 Vercel이 프로젝트마다 다르게 줍니다.** 직접 복사해야 합니다.

### 실제 주소 찾는 방법

1. [vercel.com/dashboard](https://vercel.com/dashboard) 로그인  
2. **Projects** 에서 **`coot_ai`** (또는 만든 이름) 카드 클릭  
3. 프로젝트 화면 **오른쪽 위** 또는 상단의 **Visit** / **Domains** 에 보이는 주소를 복사  
   - 예시 형태만 말하면: `https://무언가.vercel.app` (중간 이름은 **프로젝트마다 다름**)  
4. 주소창에는 **복사한 것만** 넣기 (한글·`xxxx`·`/**` 없음)

---

## 2) 배포가 실패했거나 아직 없는 경우

`DEPLOYMENT_NOT_FOUND` 는 **그 URL에 성공한 배포가 없을 때**도 납니다.

1. 같은 프로젝트에서 **Deployments** 탭 열기  
2. 맨 위 배포가 **Ready**(초록) 인지 확인  
3. **Error** / **Failed** 이면 클릭해 **Build Logs** 에서 오류 확인 (대개 `npm run build` 실패, 환경 변수 누락 등)  
4. 수정 후 GitHub에 푸시하거나 **Redeploy** 로 다시 빌드

---

## 3) 정리

| 하면 안 되는 것 | 해야 하는 것 |
|----------------|--------------|
| 문서의 `xxxx`, `본인-프로젝트` 를 주소에 그대로 넣기 | Vercel 대시보드에서 **복사**한 전체 `https://…vercel.app` |
| `/**` 를 브라우저 주소 끝에 붙이기 | Supabase Redirect URLs 설정에만 `/**` 패턴 사용 |
