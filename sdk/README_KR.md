# DITO SDK

> 재능 발견 & Soul NFT 플랫폼 DITO를 위한 JavaScript/TypeScript SDK

[![npm version](https://badge.fury.io/js/dito-sdk.svg)](https://www.npmjs.com/package/dito-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

한국어 | [English](./README.md)

## 🌟 DITO란?

DITO는 사람들이 숨겨진 재능을 발견하고 이를 솔라나 블록체인 상의 Soul NFT로 민팅할 수 있게 도와주는 혁신적인 플랫폼입니다. AI 기반 재능 분석과 블록체인 기술을 통해 인간의 잠재력을 해방시키는 것이 우리의 미션입니다.

## 🚀 주요 기능

- **🔮 Soul 관리**: 디지털 영혼 생성 및 관리
- **🎨 재능 발견**: AI 기반 재능 분석 
- **⚡ Ember 시스템**: 재능 화폐 및 보상
- **🏟️ Arena 이벤트**: 재능 경쟁 대회
- **🔐 2FA 보안**: 강화된 계정 보호
- **📊 분석**: 상세한 재능 성장 추적

## 📦 설치

```bash
npm install dito-sdk
# 또는
yarn add dito-sdk
```

## 🏃 빠른 시작

```typescript
import { DitoSDK } from 'dito-sdk';

// SDK 초기화
const dito = new DitoSDK({
  apiUrl: 'https://gateway.dito.guru',
  authToken: '당신의-인증-토큰'
});

// 사용자의 Soul 조회
const soul = await dito.souls.get('당신의-soul-id');
console.log('Soul:', soul);

// Ember 잔액 확인
const balance = await dito.ember.getBalance();
console.log('Ember 잔액:', balance);

// 재능 추천 받기
const talents = await dito.talents.discover();
console.log('추천 재능:', talents);
```

## 📖 API 참조

### 인증

```typescript
// 2FA 설정
await dito.auth.setup2FA();

// 2FA 코드 인증
await dito.auth.verify2FA('123456');

// 인증 상태 확인
const status = await dito.auth.getStatus();
```

### Soul 관리

```typescript
// Soul 정보 조회
const soul = await dito.souls.get(soulId);

// Soul 업데이트
await dito.souls.update(soulId, {
  seekerName: '새로운 이름',
  bio: '업데이트된 소개'
});

// 모든 Soul 목록 조회
const souls = await dito.souls.list();
```

### 재능 시스템

```typescript
// 재능 추천 받기
const recommendations = await dito.talents.discover();

// 재능 여정 시작
await dito.talents.startJourney('programming');

// 재능 진행상황 추가
await dito.talents.addProgress(talentId, {
  evidence: 'React 프로젝트 완료',
  hours: 10
});

// 재능 분석 데이터 조회
const analytics = await dito.talents.getAnalytics();
```

### Ember 경제

```typescript
// Ember 잔액 조회
const balance = await dito.ember.getBalance();

// Ember 전송
await dito.ember.transfer('수신자-id', 100);

// 거래 내역 조회
const history = await dito.ember.getHistory();
```

### Arena 이벤트

```typescript
// 라이브 Arena 이벤트 조회
const events = await dito.arena.getLive();

// Arena 이벤트 참가
await dito.arena.join('event-id');

// 리더보드 조회
const leaderboard = await dito.arena.getLeaderboard('event-id');
```

## 🔧 설정

```typescript
const dito = new DitoSDK({
  // 필수: API 엔드포인트
  apiUrl: 'https://gateway.dito.guru',
  
  // 필수: 인증 토큰
  authToken: '당신의-토큰',
  
  // 선택사항: 요청 타임아웃 (기본값: 30000ms)
  timeout: 30000,
  
  // 선택사항: API 버전 (기본값: 'v1')
  apiVersion: 'v1',
  
  // 선택사항: 디버그 모드 (기본값: false)
  debug: false
});
```

## 🛠️ 에러 처리

```typescript
try {
  const soul = await dito.souls.get('잘못된-id');
} catch (error) {
  if (error instanceof DitoError) {
    console.error('DITO 에러:', error.message);
    console.error('에러 코드:', error.code);
    console.error('HTTP 상태 코드:', error.statusCode);
  }
}
```

## 🔐 보안 모범 사례

1. **인증 토큰을 클라이언트 코드에 노출하지 마세요**
2. **환경 변수를 사용**하여 민감한 설정을 관리하세요
3. **2FA를 활성화**하여 보안을 강화하세요
4. **API 토큰을 정기적으로 교체**하세요

```typescript
// ❌ 하지 마세요
const dito = new DitoSDK({
  apiUrl: 'https://gateway.dito.guru',
  authToken: 'hardcoded-token-123' // 절대 안됨!
});

// ✅ 이렇게 하세요
const dito = new DitoSDK({
  apiUrl: process.env.DITO_API_URL,
  authToken: process.env.DITO_AUTH_TOKEN
});
```

## 🌐 브라우저 지원

이 SDK는 Node.js와 최신 브라우저에서 모두 작동합니다:

- **Node.js**: 14.0.0+
- **Chrome**: 80+
- **Firefox**: 75+
- **Safari**: 13+
- **Edge**: 80+

## 🤝 기여하기

기여를 환영합니다! 자세한 내용은 [기여 가이드](CONTRIBUTING.md)를 참조하세요.

1. 저장소를 포크하세요
2. 기능 브랜치를 생성하세요 (`git checkout -b feature/멋진-기능`)
3. 변경사항을 커밋하세요 (`git commit -m '멋진 기능 추가'`)
4. 브랜치에 푸시하세요 (`git push origin feature/멋진-기능`)
5. Pull Request를 열어주세요

## 📄 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다 - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🆘 지원

- **문서**: [docs.dito.guru](https://docs.dito.guru)
- **디스코드**: [커뮤니티 참가](https://discord.gg/dito)
- **이슈**: [GitHub 이슈](https://github.com/dargonne/dito-sdk/issues)
- **이메일**: support@dito.guru

## 🗺️ 로드맵

- [ ] React Native 지원
- [ ] WebSocket 실시간 이벤트
- [ ] GraphQL 클라이언트
- [ ] Flutter SDK
- [ ] 게임용 Unity SDK

## ⭐ 스타 히스토리

이 SDK가 도움이 되었다면 GitHub에서 스타를 눌러주세요!

---

[DITO 팀](https://dito.guru)이 ❤️로 만들었습니다