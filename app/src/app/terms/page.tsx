'use client';

import { LegalShell } from '@/components/layout/legal-shell';
import { useI18n } from '@/providers/i18n-provider';

export default function TermsPage() {
  const { lang } = useI18n();
  const isKo = lang === 'ko';

  return (
    <LegalShell
      kicker={isKo ? '이용약관' : 'Terms of Service'}
      title={isKo ? '쉬운 말로 쓴 약속.' : 'The agreement, in plain words.'}
      lede={
        isKo
          ? 'DITO Soul은 한 번에 하나의 불을 지키는 조용한 공간이야. 사용함으로써 몇 가지 간단한 약속에 동의하게 돼. 인상적이기보단 읽기 쉽게 쓰려고 했어.'
          : 'DITO Soul is a quiet place to keep one fire alive at a time. By using it, you agree to a few simple things. We tried to make this readable instead of impressive.'
      }
      meta={
        isKo
          ? '최종 업데이트: 2026년 4월 26일 · 시행: 2026년 4월 26일'
          : 'Last updated: April 26, 2026 · Effective: April 26, 2026'
      }
      backLabel={isKo ? '돌아가기' : 'Back'}
    >
      <section>
        <h2>{isKo ? '1. 서비스' : '1. The service'}</h2>
        <p>
          {isKo
            ? 'DITO Soul("서비스")은 개인 연습 도구야. 너는 ember를 켜고, 매일 그것을 돌보고, 계속 타게 두거나 보내주거나 하지. 우리는 앱과 저장소, AI 멘토(Dargonne)을 제공하고. 너는 연습을 제공해.'
            : 'DITO Soul ("the service") is a personal practice tool. You light embers, tend them daily, and either keep them burning or let them go. We provide the app, the storage, and the AI mentor (Dargonne). You provide the practice.'}
        </p>
      </section>

      <section>
        <h2>{isKo ? '2. 너의 계정' : '2. Your account'}</h2>
        <ul>
          <li>
            {isKo ? (
              <>
                DITO Soul을 사용하려면 <b>14세 이상</b>이어야 해.
              </>
            ) : (
              <>
                You must be at least <b>14 years old</b> to use DITO Soul.
              </>
            )}
          </li>
          <li>
            {isKo
              ? '비밀번호를 안전하게 보관할 책임은 너에게 있어.'
              : 'You’re responsible for keeping your password safe.'}
          </li>
          <li>
            {isKo
              ? '한 사람당 하나의 계정. 다른 사람을 사칭하지 마.'
              : 'One account per person. Don’t impersonate anyone.'}
          </li>
          <li>
            {isKo
              ? '언제든 계정을 닫을 수 있어. 우리는 서비스나 다른 사용자를 남용하는 계정은 정지시킬 수 있어.'
              : 'You can close your account at any time. We can suspend accounts that abuse the service or others.'}
          </li>
        </ul>
      </section>

      <section>
        <h2>{isKo ? '3. 너의 콘텐츠' : '3. Your content'}</h2>
        <p>
          {isKo ? (
            <>
              네가 쓴 모든 것 — entry, 회고, ember의 이름 — 은 <b>너의 것</b>이야. 우리는 그것을 소유한다고 주장하지 않아. 그걸로 모델을 학습시키지 않아. 판매하지도 않아.
            </>
          ) : (
            <>
              Everything you write — entries, reflections, ember names — belongs to <b>you</b>. We don’t claim it. We don’t train models on it. We don’t sell it.
            </>
          )}
        </p>
        <p>
          {isKo
            ? '너의 콘텐츠를 저장하고 너에게 다시 보여주기 위한 좁고 기술적인 라이선스를 우리에게 부여해 (예: 암호화, 기기 간 동기화, 앱에서 렌더링). 콘텐츠를 삭제하거나 계정을 닫으면 그 라이선스는 끝나.'
            : 'You grant us a narrow, technical license to store and display your content back to you (e.g. encrypt it, sync it across devices, render it in the app). That license ends when you delete the content or close your account.'}
        </p>
      </section>

      <section>
        <h2>{isKo ? '4. 금지 사항' : '4. What you may not do'}</h2>
        <ul>
          <li>
            {isKo
              ? '서비스를 자신이나 타인을 해치거나 누군가를 위협하는 데 사용하지 마.'
              : 'Use the service to harm yourself or others, or to threaten anyone.'}
          </li>
          <li>
            {isKo
              ? '서비스를 무너뜨리려 하지 마 — 리버스 엔지니어링, 스크래핑, API 남용, 레이트 리밋 우회 등.'
              : 'Try to break the service — reverse-engineer, scrape, abuse APIs, evade rate limits.'}
          </li>
          <li>
            {isKo
              ? '불법 콘텐츠나 타인의 권리를 침해하는 콘텐츠를 업로드하지 마.'
              : 'Upload illegal content, or content that infringes someone else’s rights.'}
          </li>
          <li>
            {isKo
              ? '서면 허가 없이 서비스를 재판매하거나, 화이트라벨링하거나, 래핑하지 마.'
              : 'Resell, white-label, or wrap the service without written permission.'}
          </li>
        </ul>
      </section>

      <section>
        <h2>{isKo ? '5. Dargonne (AI 멘토)에 대해' : '5. About Dargonne (the AI mentor)'}</h2>
        <p>
          {isKo ? (
            <>
              Dargonne은 차분한 멘토 톤으로 말하는 언어 모델이야. 치료사, 의사, 변호사, 재무 상담사가 <b>아니야</b>. 위기 상황이라면 사람 전문가나 지역 응급 전화에 연락해 줘.
            </>
          ) : (
            <>
              Dargonne is a language model speaking in a calm, mentor-like voice. It is <b>not</b> a therapist, doctor, lawyer, or financial advisor. If you’re in crisis, please reach a human professional or a local emergency line.
            </>
          )}
        </p>
        <p>
          {isKo
            ? 'Dargonne은 틀릴 수 있어. 그의 답변을 깊이 생각해볼 거리로 받아들이되, 검토 없이 행동의 근거로 삼지는 마.'
            : 'Dargonne can be wrong. Treat its replies as reflections to consider, not facts to act on without thought.'}
        </p>
      </section>

      <section>
        <h2>{isKo ? '6. 가격 및 결제' : '6. Pricing & payments'}</h2>
        <p>
          {isKo
            ? '핵심 연습 — 한 번에 하나의 불을 켜고 돌보는 일 — 은 무료야. 일부 기능은 유료 플랜이 필요할 수 있어. 가격, 청구 주기, 해지 조건은 결제 시점에 명확히 안내돼. 언제든 유료 플랜을 해지할 수 있고, 결제된 기간이 끝날 때까지 이용할 수 있어.'
            : 'The core practice — lighting and tending one fire at a time — is free. Some features may require a paid plan. Prices, billing periods, and cancellation terms will be shown clearly at the point of purchase. You can cancel a paid plan at any time; access continues until the end of the paid period.'}
        </p>
      </section>

      <section>
        <h2>{isKo ? '7. 가용성' : '7. Availability'}</h2>
        <p>
          {isKo
            ? '서비스를 원활하게 운영하려고 노력하지만, 무중단을 약속하진 않아. 서비스를 개선하기 위해 일부를 일시 중단하거나 변경할 수 있고, 중요한 부분을 제거하는 경우 합리적인 사전 통지를 줄게.'
            : 'We try to keep the service running smoothly, but we don’t promise zero downtime. We may pause or change parts of the service to improve it; if we remove something significant, we’ll give you reasonable notice.'}
        </p>
      </section>

      <section>
        <h2>{isKo ? '8. 면책' : '8. Disclaimers'}</h2>
        <p>
          {isKo ? (
            <>
              서비스는 <em>현재 상태 그대로</em> 제공돼. 법으로 허용되는 최대 범위 내에서, 우리는 상품성, 특정 목적 적합성, 비침해에 대한 묵시적 보증을 부인해. DITO Soul의 사용은 너의 책임 하에 이루어져.
            </>
          ) : (
            <>
              The service is provided <em>as is</em>. To the maximum extent permitted by law, we disclaim implied warranties of merchantability, fitness for a particular purpose, and non-infringement. Your use of DITO Soul is at your own risk.
            </>
          )}
        </p>
      </section>

      <section>
        <h2>{isKo ? '9. 책임의 한도' : '9. Limit of liability'}</h2>
        <p>
          {isKo
            ? '법으로 허용되는 최대 범위 내에서, 서비스와 관련된 모든 청구에 대한 우리의 총 책임은 청구 발생 전 12개월 동안 네가 우리에게 지불한 금액 또는 미화 50달러 중 더 큰 금액으로 제한돼.'
            : 'To the maximum extent permitted by law, our total liability for any claim arising out of or relating to the service is limited to the amount you paid us in the twelve months before the claim, or USD $50, whichever is greater.'}
        </p>
      </section>

      <section>
        <h2>{isKo ? '10. 종료' : '10. Termination'}</h2>
        <p>
          {isKo
            ? '언제든 DITO Soul 사용을 중단할 수 있어. 본 약관을 위반하거나 법적으로 요구되는 경우, 우리가 너의 계정을 정지하거나 종료할 수 있어. 종료 시 30일 동안 데이터를 내보낼 수 있고, 그 이후엔 영구 삭제돼.'
            : 'You can stop using DITO Soul any time. We can suspend or end your account if you violate these terms or if we’re required to by law. On termination, you can export your data for 30 days; after that it’s permanently deleted.'}
        </p>
      </section>

      <section>
        <h2>{isKo ? '11. 준거법' : '11. Governing law'}</h2>
        <p>
          {isKo
            ? '본 약관은 대한민국 법률에 따라 해석되며, 충돌법 원칙은 적용하지 않아. 분쟁은 서울 법원에서 해결되며, 단 너의 국가의 강행 소비자 보호법이 달리 정하는 경우에는 그에 따라.'
            : 'These terms are governed by the laws of the Republic of Korea, without regard to conflict of laws. Disputes will be resolved in the courts of Seoul, unless mandatory consumer-protection law in your country says otherwise.'}
        </p>
      </section>

      <section>
        <h2>{isKo ? '12. 변경' : '12. Changes'}</h2>
        <p>
          {isKo
            ? '본 약관이 변경되는 경우, 앱 내에서 알리고 이 페이지 상단의 날짜를 업데이트할게. 중요한 변경 사항은 시행 전 검토할 시간을 줄게.'
            : 'If we change these terms, we’ll notify you in the app and update the date at the top of this page. Material changes will give you a chance to review before they take effect.'}
        </p>
      </section>

      <section>
        <h2>{isKo ? '13. 문의' : '13. Contact'}</h2>
        <p>
          {isKo ? (
            <>
              <a href="mailto:hello@dito.guru">hello@dito.guru</a>로 연락 가능. DIGI PLANET 운영.
            </>
          ) : (
            <>
              Reach us at <a href="mailto:hello@dito.guru">hello@dito.guru</a>. Operated by DIGI PLANET.
            </>
          )}
        </p>
      </section>
    </LegalShell>
  );
}
