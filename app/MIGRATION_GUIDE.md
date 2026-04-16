# DITO Email Authentication Migration Guide

## 🔄 지갑 연결 → 이메일 회원가입 시스템 전환

### 1. Supabase 테이블 생성

1. **Supabase 대시보드**에 접속: https://supabase.co/dashboard
2. **SQL Editor** 탭으로 이동
3. `migrations/001_email_auth_system.sql` 파일의 내용을 복사해서 실행

또는 터미널에서:
```bash
# Supabase CLI 설치 (없다면)
npm install -g supabase

# 프로젝트 연결
supabase link --project-ref YOUR_PROJECT_REF

# 마이그레이션 실행
supabase db push
```

### 2. 환경 변수 확인

`.env.local` 파일에 다음이 설정되어 있는지 확인:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_key  # 새로 추가
```

### 3. 기존 코드 마이그레이션

#### A. Store 사용 부분
```typescript
// 기존
import { store } from '@/lib/store';

// 새로운 방식
import { storeV2 } from '@/lib/store-v2';

// 기존 store는 그대로 사용 가능 (호환성 유지)
// 하지만 새로운 기능들은 storeV2 사용 권장
```

#### B. 인증 확인
```typescript
// 기존 (지갑 기반)
const wallet = getWalletCookie();
if (!wallet) router.push('/connect');

// 새로운 방식 (세션 기반)
const isAuthenticated = await storeV2.checkAuth();
if (!isAuthenticated) router.push('/auth/login');
```

#### C. 프로필 불러오기
```typescript
// 기존
const profile = await store.getProfileAsync(walletAddress);

// 새로운 방식 (세션 자동 인증)
const profile = await storeV2.getProfileAsync();
```

### 4. 라우팅 변경

```typescript
// 기존 플로우
Discovery → /connect → /chat

// 새로운 플로우  
Discovery → /auth → /auth/signup 또는 /auth/login → /chat
```

### 5. 내부 지갑 생성 API 추가 필요

아직 생성되지 않은 API:
- `POST /api/auth/logout` - 로그아웃
- `POST /api/wallet/create` - 내부 지갑 생성
- `PUT /api/wallet/export` - 지갑 출금 (사용자 지갑으로 전송)

### 6. 테스트 시나리오

1. **신규 가입**
   - 이메일 + 사용자명 + 비밀번호 입력
   - (선택) OTP 인증
   - 프로필 생성 확인

2. **로그인**
   - 이메일 + 비밀번호 입력
   - (선택) OTP 인증
   - 세션 생성 확인

3. **프로필 수정**
   - 재능, 관심사 등 업데이트
   - 세션 인증 확인

4. **내부 지갑**
   - 자동 생성 확인
   - Soul 민팅 테스트

### 7. 롤백 계획

문제 발생 시 기존 시스템으로 롤백:
1. 기존 `/connect` 페이지 활성화
2. `store.ts` 계속 사용
3. `wallet-cookie.ts` 기반 인증 유지

### 8. 데이터 마이그레이션 (기존 사용자가 있다면)

```sql
-- 기존 profiles 테이블 데이터를 users로 이관
INSERT INTO users (
  display_name, 
  current_talent, 
  talent_category,
  discovery_complete,
  internal_wallet_pubkey,
  email,
  username,
  password_hash
)
SELECT 
  display_name,
  current_talent,
  talent_category,
  discovery_complete,
  wallet_address,
  -- 이메일이 없으니까 더미 데이터로 생성
  wallet_address || '@imported.dito.guru' as email,
  LEFT(wallet_address, 10) as username,
  '$2a$12$dummy_hash' as password_hash -- 임시 비밀번호
FROM profiles 
WHERE deleted_at IS NULL;
```

### 9. 성능 최적화

- 세션 만료 시간: 30일 (조정 가능)
- OTP 저장소: 메모리 → Redis 권장 (운영환경)
- 인덱스: 이메일, 사용자명에 자동 생성됨

### 10. 보안 강화

- 비밀번호: bcrypt 해싱 (12 rounds)
- 세션 토큰: UUID + 타임스탬프
- RLS: 사용자별 데이터 격리
- OTP: 5분 만료, 5회 시도 제한