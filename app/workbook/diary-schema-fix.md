# diary_entries 스키마 충돌 분석 및 해결 방안

## 현황

`diary_entries` 테이블이 두 가지 다른 용도로 사용되고 있음:

### 용도 1: 채팅 메시지 저장 (`/api/chat/route.ts`)
```
{ profile_id, role, content, embedding }
```
- 채팅 턴마다 한 행 (user/assistant 각각)
- embedding 벡터로 의미 검색 (`match_diary_entries` RPC)

### 용도 2: 일기 저장 (`/api/diary/route.ts`)
```
{ wallet_address, entry_date, entries(JSON), summary, keywords }
```
- 날짜별 한 행 (upsert on wallet_address + entry_date)
- entries는 JSON 배열

### 충돌
- 같은 테이블에 완전히 다른 컬럼 세트로 insert/upsert
- chat은 `profile_id`로, diary는 `wallet_address`로 소유자 식별
- chat 행에는 entry_date/entries/summary가 null, diary 행에는 role/content/embedding이 null
- `match_diary_entries` RPC가 embedding 검색 시 diary 행도 반환할 수 있음 (embedding이 null이면 제외되겠지만 혼란)

---

## 옵션 A: 테이블 분리 (추천 ✅)

**chat_messages** — 채팅 전용, **diary_entries** — 일기 전용

### 마이그레이션
```sql
-- 1. chat_messages 테이블 생성
CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  role TEXT NOT NULL,          -- 'user' | 'assistant'
  content TEXT NOT NULL,
  embedding vector(768),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 기존 채팅 데이터 이동
INSERT INTO chat_messages (id, profile_id, role, content, embedding, created_at)
SELECT id, profile_id, role, content, embedding, created_at
FROM diary_entries
WHERE role IS NOT NULL;

-- 3. diary_entries에서 채팅 행 삭제
DELETE FROM diary_entries WHERE role IS NOT NULL;

-- 4. diary_entries 불필요 컬럼 정리 (선택)
ALTER TABLE diary_entries DROP COLUMN IF EXISTS role;
ALTER TABLE diary_entries DROP COLUMN IF EXISTS embedding;
-- content는 일기에서도 쓸 수 있으므로 유지 여부 판단

-- 5. match_diary_entries RPC를 match_chat_messages로 복제/수정
-- 6. RLS 정책 추가
-- 7. 인덱스: chat_messages(profile_id), chat_messages USING ivfflat(embedding)
```

### 코드 변경
- `/api/chat/route.ts`: `diary_entries` → `chat_messages`
- `match_diary_entries` RPC → `match_chat_messages`
- `/api/diary/route.ts`: 변경 없음

### 장점
- 스키마가 깔끔하고 각 테이블의 의도가 명확
- 쿼리 성능 향상 (불필요한 null 행 없음)
- embedding 검색이 채팅 메시지만 대상으로 함
- 향후 각각 독립적으로 스키마 진화 가능

### 단점
- 마이그레이션 작업 필요 (데이터 이동 + 코드 수정)
- RPC 함수 수정 필요

---

## 옵션 B: diary_entries를 채팅 전용, 일기는 새 테이블

**diary_entries** → 채팅 (기존 유지), **daily_diaries** — 일기 전용

### 마이그레이션
```sql
CREATE TABLE daily_diaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  entry_date DATE NOT NULL,
  entries JSONB,
  summary TEXT,
  keywords TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(wallet_address, entry_date)
);

-- 기존 일기 데이터 이동
INSERT INTO daily_diaries (...)
SELECT ... FROM diary_entries WHERE entry_date IS NOT NULL AND role IS NULL;

DELETE FROM diary_entries WHERE entry_date IS NOT NULL AND role IS NULL;
```

### 코드 변경
- `/api/diary/route.ts`: `diary_entries` → `daily_diaries`
- `/api/chat/route.ts`: 변경 없음

### 장점
- chat 쪽 코드 변경 없음 (match_diary_entries RPC도 그대로)
- 마이그레이션이 약간 더 간단

### 단점
- `diary_entries`라는 이름이 실제로는 채팅 메시지 → 혼란
- 나중에 이름 때문에 계속 헷갈림

---

## 추천: 옵션 A

이유:
1. **이름이 의도와 일치** — chat_messages는 채팅, diary_entries는 일기
2. **장기적으로 유지보수 용이** — 새 개발자가 봐도 바로 이해
3. **코드 변경량 차이가 크지 않음** — 어차피 한쪽은 수정해야 함
4. **채팅이 더 자주 변경될 가능성** — 독립 테이블이 유리

### 실행 순서
1. `chat_messages` 테이블 생성 + RLS
2. 데이터 마이그레이션 (INSERT INTO ... SELECT)
3. `match_chat_messages` RPC 생성
4. 코드 수정 (`/api/chat/route.ts`)
5. 테스트
6. `diary_entries`에서 채팅 행 삭제 + 불필요 컬럼 제거
