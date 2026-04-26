'use client';

import { LegalShell } from '@/components/layout/legal-shell';
import { useI18n } from '@/providers/i18n-provider';

export default function PrivacyPage() {
  const { lang } = useI18n();
  const isKo = lang === 'ko';

  return (
    <LegalShell
      kicker={isKo ? '개인정보 처리방침' : 'Privacy'}
      title={isKo ? '당신의 불을 비공개로 지키는 방법.' : 'How we keep your fire private.'}
      lede={
        isKo
          ? 'DITO Soul은 너 자신과 정직하게 연습할 수 있도록 존재해. 그건 네가 쓴 것이 너의 것이어야만 가능하지. 이 페이지는 우리가 무엇을, 왜 수집하는지 — 그리고 무엇을 수집하지 않는지를 솔직하게 설명해.'
          : 'DITO Soul exists so you can practice with yourself, honestly. That only works if what you write is yours. This page explains, plainly, what we collect, why, and what we don’t.'
      }
      meta={
        isKo
          ? '최종 업데이트: 2026년 4월 26일 · 시행: 2026년 4월 26일'
          : 'Last updated: April 26, 2026 · Effective: April 26, 2026'
      }
      backLabel={isKo ? '돌아가기' : 'Back'}
    >
      <section>
        <h2>{isKo ? '1. 우리가 수집하는 것' : '1. What we collect'}</h2>
        <p>
          {isKo
            ? '서비스를 운영하기 위해 필요한 최소한의 정보만 수집해:'
            : 'We collect the smallest amount of information needed to run the service:'}
        </p>
        <ul>
          <li>
            <b>{isKo ? '계정' : 'Account'}</b>
            {' — '}
            {isKo
              ? '이메일, 직접 정한 사용자명, 해시 처리된 비밀번호.'
              : 'email, a username you choose, hashed password.'}
          </li>
          <li>
            <b>{isKo ? '너의 불꽃들' : 'Your fires'}</b>
            {' — '}
            {isKo
              ? '네가 켠 ember, 쓴 entry, 그것을 돌본 날들. 저장 시 암호화돼.'
              : 'the embers you light, the entries you write, the days you tend them. Encrypted at rest.'}
          </li>
          <li>
            <b>{isKo ? '세션' : 'Session'}</b>
            {' — '}
            {isKo
              ? '로그인 상태를 유지하기 위한 세션 토큰.'
              : 'a session token so you stay logged in.'}
          </li>
          <li>
            <b>{isKo ? '선택 분석' : 'Optional analytics'}</b>
            {' — '}
            {isKo
              ? '쿠키 배너에서 동의한 경우에만 수집되는 익명화된 사용 이벤트 (예: "entry가 저장됨").'
              : 'anonymized usage events (e.g. "an entry was saved"), only if you opt in via the cookie banner.'}
          </li>
        </ul>
      </section>

      <section>
        <h2>{isKo ? '2. 우리가 수집하지 않는 것' : '2. What we don’t collect'}</h2>
        <ul>
          <li>{isKo ? '제3자 광고 추적기 없음.' : 'No third-party advertising trackers.'}</li>
          <li>
            {isKo
              ? '소셜 그래프 수집 없음. 팔로우도, 피드도 없어.'
              : 'No social-graph harvesting. There is no follow, no feed.'}
          </li>
          <li>{isKo ? '정밀 위치 정보 없음.' : 'No precise location.'}</li>
          <li>
            {isKo ? '어떤 데이터도 판매하지 않아 — 절대로.' : 'No selling of any data, ever.'}
          </li>
        </ul>
      </section>

      <section>
        <h2>{isKo ? '3. 왜 수집하는가' : '3. Why we collect it'}</h2>
        <p>
          {isKo
            ? '계정을 운영하고, 너의 entry를 저장하고 — 동의한 경우에 한해 — 어떤 부분이 사람들이 불꽃을 살리는 데 도움이 되는지 이해하기 위해. 그게 전부야.'
            : 'To run your account, save your entries, and—if you opt in—understand which parts of the practice help people keep their fires alive. That’s it.'}
        </p>
      </section>

      <section>
        <h2>{isKo ? '4. 누가 보는가' : '4. Who sees it'}</h2>
        <p>
          {isKo
            ? '기본적으로는 너만. 너의 entry는 비공개이며 저장 시 암호화돼. 우리는 개별 entry를 절대 읽지 않아. 집계된 익명 지표는 제품 결정에 참고될 수 있어 (예: "이번 주 평균 돌본 일수").'
            : 'Only you, by default. Your entries are private and encrypted at rest. We never read individual entries. Aggregated, anonymous metrics may inform product decisions (e.g. "average days tended this week").'}
        </p>
        <p>
          {isKo
            ? '플랫폼 운영을 위해 사용하는 서비스 제공자들(호스팅, 이메일, 에러 리포팅)은 다른 용도 사용을 금지하는 계약 하에 우리를 대신해 데이터를 처리해.'
            : 'Service providers we use to run the platform (hosting, email, error reporting) handle data on our behalf under contracts that forbid other use.'}
        </p>
      </section>

      <section>
        <h2>{isKo ? '5. 너의 권리' : '5. Your rights'}</h2>
        <ul>
          <li>
            <b>{isKo ? '내보내기' : 'Export'}</b>
            {' — '}
            {isKo
              ? '언제든 너의 모든 불꽃을 하나의 아카이브로 다운로드할 수 있어.'
              : 'download all your fires as a single archive at any time.'}
          </li>
          <li>
            <b>{isKo ? '삭제' : 'Delete'}</b>
            {' — '}
            {isKo
              ? '계정을 닫으면 30일 이내에 모든 것이 영구 삭제돼.'
              : 'close your account; everything is purged within 30 days.'}
          </li>
          <li>
            <b>{isKo ? '수정' : 'Correct'}</b>
            {' — '}
            {isKo
              ? '설정에서 계정 정보를 수정할 수 있어.'
              : 'edit account details from Settings.'}
          </li>
          <li>
            <b>{isKo ? '동의 철회' : 'Withdraw consent'}</b>
            {' — '}
            {isKo
              ? '쿠키 배너에서 선택 분석을 끌 수 있어.'
              : 'turn off optional analytics from the cookie banner.'}
          </li>
        </ul>
      </section>

      <section>
        <h2>{isKo ? '6. 쿠키' : '6. Cookies'}</h2>
        <p>
          {isKo ? (
            <>
              로그인 유지를 위한 필수 쿠키 하나를 사용해. 선택 분석 쿠키는 <em>모두 동의</em>를 누른 경우에만 로드돼. 언제든 사이트 데이터를 지워서 마음을 바꿀 수 있어.
            </>
          ) : (
            <>
              We use one essential cookie to keep you signed in. Optional analytics cookies load only if you press <em>Accept all</em>. You can change your mind any time by clearing site data.
            </>
          )}
        </p>
      </section>

      <section>
        <h2>{isKo ? '7. 어린이' : '7. Children'}</h2>
        <p>
          {isKo
            ? 'DITO Soul은 14세 이상을 대상으로 해. 14세 미만의 아동으로부터 의도적으로 데이터를 수집하지 않아.'
            : 'DITO Soul is for ages 14 and up. We do not knowingly collect data from children under 14.'}
        </p>
      </section>

      <section>
        <h2>{isKo ? '8. 변경' : '8. Changes'}</h2>
        <p>
          {isKo
            ? '이 정책이 변경되는 경우, 시행 전에 앱 내에서 변경 사항을 알리고 이 페이지 상단의 날짜를 업데이트할 거야.'
            : 'If we change this policy, we’ll surface the change in the app before it takes effect, and update the date at the top of this page.'}
        </p>
      </section>

      <section>
        <h2>{isKo ? '9. 문의' : '9. Contact'}</h2>
        <p>
          {isKo ? (
            <>
              <a href="mailto:privacy@dito.guru">privacy@dito.guru</a>로 연락 가능. DIGI PLANET 운영.
            </>
          ) : (
            <>
              Reach us at <a href="mailto:privacy@dito.guru">privacy@dito.guru</a>. Operated by DIGI PLANET.
            </>
          )}
        </p>
      </section>
    </LegalShell>
  );
}
