# DITO 시스템 모드 설정 가이드

## 🔄 두 가지 운영 모드

### 🧪 임시 모드 (Temp Mode)
- **데이터 저장:** 메모리 (서버 재시작 시 초기화)
- **사용 시기:** DB 테이블 생성 전, 개발/테스트
- **API 엔드포인트:**
  - `/api/auth/signup-temp`
  - `/api/auth/login-temp` 
  - `/api/profile-temp`

### 🗄️ 실제 모드 (Real Mode)
- **데이터 저장:** Supabase PostgreSQL
- **사용 시기:** DB 테이블 생성 후, 운영 환경
- **API 엔드포인트:**
  - `/api/auth/signup-real`
  - `/api/auth/login-real`
  - `/api/profile-real`

---

## ⚙️ 모드 전환 방법

### 1. 프론트엔드에서 API 경로 변경

**회원가입 페이지 (`/auth/signup/page.tsx`):**
```typescript
// 임시 모드
const res = await fetch('/api/auth/signup-temp', { ... });

// 실제 모드로 전환
const res = await fetch('/api/auth/signup-real', { ... });
```

**로그인 페이지 (`/auth/login/page.tsx`):**
```typescript
// 임시 모드
const res = await fetch('/api/auth/login-temp', { ... });

// 실제 모드로 전환  
const res = await fetch('/api/auth/login-real', { ... });
```

**Store (`/lib/store-v2.ts`):**
```typescript
// 임시 모드
const res = await fetch('/api/profile-temp', { ... });

// 실제 모드로 전환
const res = await fetch('/api/profile-real', { ... });
```

### 2. 환경변수로 자동 전환 (권장)

**.env.local에 추가:**
```env
# 시스템 모드 설정
DITO_USE_REAL_DB=false  # true로 변경하면 실제 DB 사용
```

**자동 전환 함수 (`/lib/api-mode.ts`):**
```typescript
export function getAuthAPI(endpoint: 'signup' | 'login'): string {
  const useRealDB = process.env.DITO_USE_REAL_DB === 'true';
  
  if (useRealDB) {
    return `/api/auth/${endpoint}-real`;
  } else {
    return `/api/auth/${endpoint}-temp`;
  }
}

export function getProfileAPI(): string {
  const useRealDB = process.env.DITO_USE_REAL_DB === 'true';
  return useRealDB ? '/api/profile-real' : '/api/profile-temp';
}
```

**사용 예시:**
```typescript
import { getAuthAPI } from '@/lib/api-mode';

// 자동으로 모드에 따라 적절한 API 호출
const res = await fetch(getAuthAPI('signup'), { ... });
```

---

## 📋 전환 체크리스트

### ✅ 임시 → 실제 모드 전환 시

1. **Supabase 테이블 생성**
   - `SQL_EXECUTE_IN_SUPABASE.sql` 실행
   - 테이블 생성 확인

2. **환경변수 설정**
   ```env
   DITO_USE_REAL_DB=true
   RESEND_API_KEY=re_your_api_key
   NOREPLY_EMAIL_ADDRESS=noreply@dito.guru
   ```

3. **API 경로 변경**
   - `/auth/signup/page.tsx`
   - `/auth/login/page.tsx`  
   - `/lib/store-v2.ts`

4. **기능 테스트**
   - 회원가입 → DB 저장 확인
   - 로그인 → 세션 생성 확인
   - 프로필 → 데이터 지속성 확인
   - 이메일 → 실제 발송 확인

### ⚠️ 주의사항

**임시 모드:**
- 서버 재시작 시 모든 사용자 데이터 소실
- 세션도 메모리에 저장되므로 재시작 시 로그아웃
- 개발/테스트 목적으로만 사용

**실제 모드:**
- DB 연결 실패 시 서비스 중단
- 세션은 DB에 저장되어 서버 재시작 후에도 유지
- 운영 환경에서 사용

---

## 🚀 배포 시나리오

### Phase 1: 임시 시스템으로 런칭
```bash
# 3월 1일 런칭
DITO_USE_REAL_DB=false
# 빠른 런칭, 사용자 피드백 수집
```

### Phase 2: DB 시스템으로 전환  
```bash
# DB 테이블 생성 후
DITO_USE_REAL_DB=true
# 데이터 지속성, 확장성 확보
```

---

## 💡 권장사항

1. **개발:** 임시 모드로 빠른 프로토타이핑
2. **테스트:** 실제 모드로 DB 연동 테스트
3. **런칭:** 상황에 따라 임시/실제 선택
4. **운영:** 실제 모드로 안정성 확보

**목표: 3월 1일 런칭을 위해 현재 임시 시스템으로도 충분히 서비스 가능! 🎯**