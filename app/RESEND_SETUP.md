# DITO Resend 이메일 설정 가이드

## 📧 Resend API 계정 생성 및 설정

### 1. Resend 계정 생성
1. https://resend.com 방문
2. "Get Started" 클릭하여 계정 생성
3. 이메일 인증 완료

### 2. API 키 발급
1. Resend 대시보드 로그인
2. 좌측 메뉴에서 "API Keys" 선택
3. "Create API Key" 클릭
4. 이름 입력 (예: "DITO Production")
5. API 키 복사

### 3. 도메인 설정 (선택사항)
**무료 계정 사용 시:**
- `onboarding@resend.dev` 도메인 사용 가능 (100개/일 제한)

**커스텀 도메인 사용 시:**
1. "Domains" 메뉴에서 "Add Domain" 클릭  
2. `dito.guru` 입력
3. DNS 설정 필요:
   ```
   TXT _resend  "your-verification-code"
   MX 10 feedback-smtp.resend.com
   ```

### 4. 환경변수 설정

`.env.local` 파일에 추가:
```env
# Resend API 설정
RESEND_API_KEY=re_your_actual_api_key_here
NOREPLY_EMAIL_ADDRESS=noreply@dito.guru
```

**무료 계정 사용 시:**
```env
RESEND_API_KEY=re_your_actual_api_key_here  
NOREPLY_EMAIL_ADDRESS=onboarding@resend.dev
```

### 5. 무료 계정 제한사항
- **발송량:** 100개/일, 3,000개/월
- **도메인:** onboarding@resend.dev만 사용 가능
- **기능:** 기본 이메일 전송, 실시간 전송 상태

### 6. 유료 계정 혜택
- **Pro ($20/월):** 50,000개/월
- **커스텀 도메인** 사용 가능
- **고급 분석** 제공
- **웹훅** 지원

---

## 🧪 테스트 방법

### 개발 환경 테스트
```bash
# 개발 서버 실행
npm run dev

# 회원가입 테스트
curl -X POST http://localhost:3000/api/auth/signup-temp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"123456"}'
```

### 이메일 전송 확인
1. 회원가입 완료 후 이메일 수신함 확인
2. Resend 대시보드의 "Logs" 메뉴에서 전송 상태 확인

---

## 🔧 문제 해결

### API 키 오류
```
Error: Missing API key
```
**해결:** `.env.local`에 올바른 `RESEND_API_KEY` 설정 확인

### 도메인 인증 오류
```
Error: Domain not verified
```
**해결:** 
1. Resend 대시보드에서 도메인 인증 상태 확인
2. DNS 설정 재확인
3. 무료 계정이면 `onboarding@resend.dev` 사용

### 발송량 초과
```
Error: Rate limit exceeded
```
**해결:** 
1. 무료: 100개/일 제한 확인
2. 발송량 모니터링 및 계획 수립
3. 필요시 유료 계정 업그레이드

### 스팸 폴더 문제
**해결:**
1. SPF, DKIM 레코드 설정 (유료 계정)
2. 이메일 내용 최적화
3. "Add to contacts" 안내

---

## 📊 현재 이메일 기능

### ✅ 구현됨
- 🎉 **회원가입 환영 이메일** (예쁜 HTML 템플릿)
- 🔐 **OTP 인증 이메일** (보안 코드 전송)
- 📱 **반응형 디자인** (모바일 최적화)

### 🔄 추후 추가 예정
- 🔔 **비밀번호 재설정** 이메일
- 📈 **성장 리포트** 주간 이메일
- 🏆 **챌린지 완료** 축하 이메일
- 💎 **Soul 민팅** 완료 이메일

---

## 💡 팁

1. **개발용:** 콘솔에서 OTP 확인 가능 (이메일 없어도 테스트 가능)
2. **템플릿:** `src/lib/resend.ts`에서 이메일 디자인 커스터마이징
3. **모니터링:** Resend 대시보드로 전송률, 오픈률 추적
4. **비용:** 무료로 시작해서 필요할 때 업그레이드

**DITO 런칭 초기에는 무료 계정으로도 충분합니다!** 📧✨