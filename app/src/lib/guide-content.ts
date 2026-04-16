import { Lang } from './i18n';

export interface GuideSection {
  id: string;
  title: string;
  content: string;
}

const sections: Record<Lang, GuideSection[]> = {
  en: [
    {
      id: 'what-is-dito',
      title: '🔥 What is DITO?',
      content: `**DITO** is a platform where AI helps you discover your hidden talents — and prove them on-chain.

**Don't Ignore The One you are.**

Everyone has something special inside them — most people just never find it. DITO changes that.

When you start your journey, you awaken an **Ember** — a spark living deep in your soul. Your Ember isn't just a guide. It's the fire that was always inside you, waiting to be found.

As you discover more talents, you build a **Soul portfolio** — a collection of Soulbound Tokens that prove everything you're capable of.

DITO isn't a test. It's not a quiz. It's a living, growing journey to prove who you really are.`,
    },
    {
      id: 'how-it-works',
      title: '⚙️ How it works',
      content: `Your journey follows a simple path:

**1. Discover your talent** 💬
Start with button-based talent discovery — no wallet needed! Ember guides you through interactive choices to find ONE talent direction you didn't even know you had.

**2. Connect your wallet** 🔗
Once you've found your talent, connect a wallet to prove your identity on-chain. This is where your Soul portfolio will live.

**3. Daily diary** 📝
Write daily entries about your talent journey. Share photos, proof, and progress. Ember coaches you every step of the way, giving feedback and pushing you forward.

**4. Mint your Ember Soul ($1)** ✨
When Ember judges that you're ready (minimum 7 days of diary entries), you can mint your talent as a Soulbound Token for just $1. This isn't an entry fee — it's the cost of proving your talent on-chain.

**5. Grow your portfolio** 🔥
One talent proven? Discover the next one. Go back to step 1, find a new direction with Ember, and mint another Soul. Your Soul portfolio grows with every talent you prove.`,
    },
    {
      id: 'ember',
      title: '🌟 Ember',
      content: `Your **Ember** is a companion born from your soul.

When it first awakens, it's like a child — curious, playful, and full of questions. As you grow together, your Ember matures and evolves alongside you.

Ember guides you through **multiple talent discoveries**. Each time you start a new talent journey, Ember adapts — helping you explore, coaching your daily progress, and deciding when you're ready to mint.

Think of your Ember as the part of you that always believed in you — even when you didn't. It's the fire that keeps burning, no matter how many talents you chase.`,
    },
    {
      id: 'ember-soul',
      title: '💎 Ember Soul (SBT)',
      content: `Your **Ember Soul** is a Soulbound Token — living proof of a single talent.

**One talent = One Soul.** Each talent you prove becomes its own Ember Soul. Together, they form your **Soul portfolio** — a growing collection of everything you've proven about yourself.

Unlike regular NFTs, your Ember Souls **cannot be transferred or sold**. They're bound to your wallet, permanently.

The $1 minting cost isn't an entry fee — it's the **proof cost**. Your commitment to that specific talent, sealed on-chain.

Each Soul has its own **independent growth stage**. A Soul you nurture daily will blaze bright, while a neglected Soul may fade. Your portfolio reflects not just what you've discovered, but what you've committed to.

Your Ember Soul portfolio is the answer to: "What am I good at?" — written in stone, on-chain, forever.`,
    },
    {
      id: 'stages',
      title: '📈 Stages',
      content: `Each Ember Soul grows through **6 stages** independently:

🌑 **Dormant** — Pre-mint state. You're in discovery or daily diary phase. The Soul doesn't exist on-chain yet.

⚡ **Sparked** — Freshly minted! Your talent is now proven on-chain.

🔥 **Burning** — Active growth. You're developing this talent through continued practice and proof.

🔥🔥 **Blazing** — Deep mastery. This talent is becoming undeniable.

✨ **Radiant** — Elite level. This Soul shines bright in your portfolio.

♾️ **Eternal** — Legendary. This talent is permanently proven at the highest level.

**🚧 Future: Soul Decay System** — Planned feature where neglected Souls may fade to lower stages. Each Soul will need individual nurturing to maintain its growth level.`,
    },
    {
      id: 'battles',
      title: '⚔️ Battles',
      content: `🚧 **Coming Soon** — Global talent battles are in development!

**Planned Battle Types:**
- **🥊 Shadow Match** — Practice battles against AI opponents
- **⚔️ Ember Duel** — 1v1 against another real Ember  
- **🏟️ Arena** — Group competitions where multiple Embers clash
- **🐉 Dragon's Trial** — The ultimate test, hosted by DARGONNE himself

All battles will be organized and judged by DARGONNE — the dragon who acts like a villain but secretly wants you to succeed.

For now, focus on discovering your talents and building your Soul portfolio. The global stage is coming! 🔥`,
    },
    {
      id: 'proof-system',
      title: '🏅 Proof System',
      content: `Talent isn't proven by words alone. DITO's proof system currently includes:

**📝 Daily Diary** — The foundation of proof. Write daily entries about your talent journey, share photos and evidence. Ember reviews and coaches you. This is the primary proof layer that determines when you're ready to mint.

**🚧 Coming Soon:**
- **👥 Peer Recognition** — Other Seekers acknowledging your skills
- **🗳️ Community Voting** — Community consensus on achievements  
- **📸 MVP Submissions** — Photo/stamp evidence systems
- **🪪 Real Identity Linking** — For advanced stages

Currently, daily diary entries with Ember coaching are the core proof method for minting readiness.`,
    },
    {
      id: 'rules',
      title: '📜 Rules',
      content: `DITO runs on trust and integrity.

**🚫 Dangerous Talents Prohibited** — Any talent involving harm, illegal activity, or endangering others is strictly forbidden.

**💸 No Refunds** — The $1 per Soul mint fee is non-refundable. It's your commitment to that talent.

**🚧 Advanced Moderation (Coming Soon):**
- **🎯 Trust Score System** — Community reputation tracking
- **🚨 Strike Policy** — Progressive penalties for violations
- **👮 Community Moderation** — User reporting and review systems

For now, basic community guidelines apply. Act with integrity, respect others, and focus on genuine talent development.`,
    },
    {
      id: 'lore',
      title: '📖 The Lore',
      content: `Welcome to the world behind DITO.

**🌌 Echoheim** — The World of Echoes. A dimension where forgotten talents drift like whispers. Every talent you never discovered? It's an echo, waiting in Echoheim.

**🐉 DARGONNE** — A self-proclaimed villain from an ancient dragon race. Tough on the outside, soft on the inside. DARGONNE hosts the battles, judges the trials, and secretly roots for every single Ember. Don't tell him we said that.

**🎭 DIGI** — A persona representing the current generation. Lost, searching, scrolling through life. DIGI is you, before DITO. The version of you that hasn't found their fire yet.

**🔥 Ember** — Sent by DARGONNE as companions. Each Ember carries a fragment of Echoheim's wisdom. They're not just AI — they're echoes of your potential, given form.`,
    },
    {
      id: 'faq',
      title: '❓ FAQ',
      content: `**Is it free?**
Discovery and coaching are completely free. The only cost is **$1 per Soul mint** — when you're ready to prove a talent on-chain. No hidden fees, no subscriptions.

**What if I have no talent?**
You do. You just haven't found it yet. That's literally why DITO exists. Your Ember will help you dig it up.

**Is my data safe?**
Yes. Your progress is securely stored in encrypted databases. Only your Ember Souls (SBT) are stored on-chain. Personal data is encrypted and we don't sell your information — ever.

**Can I have multiple Souls?**
Yes! Each talent you prove becomes its own Ember Soul. Your Soul portfolio grows with every talent you discover and prove.

**When can I mint?**
Ember decides when you're ready. You need a minimum of 7 days of daily diary entries, and Ember must judge that you've shown real progress and commitment to your talent.

**What happens to old Souls?**
They stay in your portfolio forever. (Future feature: Soul decay system where neglected Souls may regress to lower stages.)

**What blockchain does DITO use?**
Solana — fast, cheap, and built for the future.

**Can I sell my Ember Soul?**
No. It's a Soulbound Token. It belongs to you and only you. Forever.`,
    },
  ],
  ko: [
    {
      id: 'what-is-dito',
      title: '🔥 DITO가 뭐야?',
      content: `**DITO**는 AI가 네 숨겨진 재능을 찾아주고, 온체인에 증명하는 플랫폼이야.

**Don't Ignore The One you are.**

모든 사람 안에는 특별한 무언가가 있어 — 대부분 찾지 못했을 뿐이야. DITO가 그걸 바꿔줘.

여정을 시작하면 **Ember**를 깨우게 돼 — 네 영혼 깊은 곳에 깃든 불씨. Ember는 단순한 가이드가 아니야. 처음부터 네 안에 있었던, 발견되길 기다리던 불꽃이야.

더 많은 재능을 발견할수록 **Soul 포트폴리오**가 만들어져 — 네가 증명한 모든 것을 담은 Soulbound Token 컬렉션이야.

DITO는 테스트가 아니야. 퀴즈도 아니야. 진짜 너를 증명하는 살아있는 여정이야.`,
    },
    {
      id: 'how-it-works',
      title: '⚙️ 어떻게 작동해?',
      content: `여정은 간단한 경로를 따라가:

**1. 재능 발견** 💬
버튼 기반 재능 발견부터 시작해 — 지갑 필요 없어! Ember가 인터랙티브한 선택을 통해 네가 몰랐던 하나의 재능 방향을 찾아줘.

**2. 지갑 연결** 🔗
재능을 찾았으면, 온체인에서 네 정체성을 증명하기 위해 지갑을 연결해. Soul 포트폴리오가 살 곳이야.

**3. 일일 다이어리** 📝
재능 여정에 대해 매일 기록해. 사진, 증거, 진행 상황을 공유해. Ember가 매 단계마다 코칭하고, 피드백을 주고, 앞으로 밀어줘.

**4. Ember Soul 민팅 ($1)** ✨
Ember가 준비됐다고 판단하면 (최소 7일 다이어리 작성), 네 재능을 Soulbound Token으로 민팅할 수 있어. 단돈 $1. 입장료가 아니라 — 네 재능을 온체인에 증명하는 비용이야.

**5. 포트폴리오 확장** 🔥
하나의 재능을 증명했어? 다음 재능을 찾아봐. 1단계로 돌아가서 Ember와 새로운 방향을 찾고, 또 다른 Soul을 민팅해. 증명할 때마다 Soul 포트폴리오가 자라나.`,
    },
    {
      id: 'ember',
      title: '🌟 Ember란?',
      content: `**Ember**는 네 영혼에서 태어난 동반자야.

처음 깨어날 때는 아이 같아 — 호기심 많고, 장난기 넘치고, 질문이 가득해. 함께 성장하면서 Ember도 너와 함께 성숙하고 진화해.

Ember는 **여러 재능 발견**을 안내해줘. 새로운 재능 여정을 시작할 때마다 Ember가 적응해서 — 탐색을 돕고, 일일 진행을 코칭하고, 민팅할 준비가 됐는지 판단해줘.

Ember를 이렇게 생각해 — 네가 자신을 믿지 못할 때도 항상 널 믿어준 너의 일부. 몇 개의 재능을 쫓든 계속 타오르는 불꽃이야.`,
    },
    {
      id: 'ember-soul',
      title: '💎 Ember Soul이란?',
      content: `**Ember Soul**은 Soulbound Token — 하나의 재능에 대한 살아있는 증명이야.

**1 재능 = 1 Soul.** 증명한 각 재능이 개별 Ember Soul이 돼. 이것들이 모여 **Soul 포트폴리오**를 이뤄 — 네가 자신에 대해 증명한 모든 것의 성장하는 컬렉션.

일반 NFT와 달리 Ember Soul은 **양도하거나 팔 수 없어**. 네 지갑에 영구적으로 바인딩돼.

$1 민팅 비용은 입장료가 아니야 — **증명 비용**이야. 특정 재능에 대한 네 다짐을 온체인에 새기는 거야.

각 Soul은 **독립적인 성장 단계**를 가져. 매일 가꾸는 Soul은 밝게 타오르고, 방치한 Soul은 시들 수 있어. 포트폴리오는 네가 발견한 것뿐만 아니라 헌신한 것도 반영해.

Ember Soul 포트폴리오는 "나는 뭘 잘해?"라는 질문의 답이야 — 돌에 새겨진, 온체인에 기록된, 영원한 답.`,
    },
    {
      id: 'stages',
      title: '📈 성장 단계',
      content: `각 Ember Soul은 **6단계**를 독립적으로 거쳐 성장해:

🌑 **Dormant (휴면)** — 민팅 전 상태. 발견 또는 일일 다이어리 단계야. 아직 온체인에 Soul이 없어.

⚡ **Sparked (점화)** — 갓 민팅됨! 네 재능이 온체인에 증명됐어.

🔥 **Burning (연소)** — 활발한 성장기. 지속적인 연습과 증명으로 이 재능을 발전시키는 중.

🔥🔥 **Blazing (작렬)** — 깊은 숙련. 이 재능이 부정할 수 없는 수준이 돼.

✨ **Radiant (빛남)** — 엘리트 레벨. 이 Soul이 포트폴리오에서 눈부시게 빛나.

♾️ **Eternal (영원)** — 전설적. 이 재능이 최고 수준에서 영구적으로 증명돼.

**🚧 향후: Soul Decay 시스템** — 방치된 Soul이 낮은 단계로 퇴화할 수 있는 계획된 기능. 각 Soul은 성장 레벨 유지를 위해 개별적인 가꿈이 필요할 예정.`,
    },
    {
      id: 'battles',
      title: '⚔️ 배틀',
      content: `🚧 **출시 예정** — 글로벌 재능 배틀 개발 중!

**계획된 배틀 유형:**
- **🥊 Shadow Match** — AI 상대와의 연습 배틀
- **⚔️ Ember Duel** — 다른 실제 Ember와의 1대1 대결
- **🏟️ Arena** — 여러 Ember가 충돌하는 그룹 대회  
- **🐉 Dragon's Trial** — DARGONNE 본인이 주최하는 궁극의 시험

모든 배틀은 DARGONNE이 주관하고 심판할 예정 — 악당인 척하지만 속으로는 네가 성공하길 바라는 용.

지금은 재능 발견과 Soul 포트폴리오 구축에 집중해. 글로벌 무대가 곧 온다! 🔥`,
    },
    {
      id: 'proof-system',
      title: '🏅 증명 체계',
      content: `재능은 말로만 증명할 수 없어. DITO의 증명 시스템은 현재:

**📝 일일 다이어리** — 증명의 기초. 재능 여정에 대해 매일 기록하고, 사진과 증거를 공유해. Ember가 리뷰하고 코칭해줘. 민팅 준비가 됐는지 결정하는 핵심 증명 방법이야.

**🚧 출시 예정:**
- **👥 피어 인정** — 다른 Seeker들의 실력 인정
- **🗳️ 커뮤니티 투표** — 성과에 대한 커뮤니티 합의
- **📸 MVP 제출** — 사진/스탬프 증거 시스템
- **🪪 실명 연계** — 고급 단계용

현재는 Ember 코칭과 함께하는 일일 다이어리 기록이 민팅 준비도를 판단하는 핵심 방법이야.`,
    },
    {
      id: 'rules',
      title: '📜 규칙',
      content: `DITO는 신뢰와 진정성으로 운영돼.

**🚫 위험 재능 금지** — 해를 끼치거나, 불법이거나, 타인을 위험에 빠뜨리는 재능은 엄격히 금지.

**💸 환불 불가** — Soul별 $1 민팅 비용은 환불되지 않아. 해당 재능에 대한 네 다짐이니까.

**🚧 고급 관리 시스템 (출시 예정):**
- **🎯 Trust Score 시스템** — 커뮤니티 평판 추적
- **🚨 스트라이크 정책** — 위반 시 점진적 제재
- **👮 커뮤니티 관리** — 유저 신고 및 검토 시스템

현재는 기본적인 커뮤니티 가이드라인이 적용돼. 진정성을 갖고 행동하고, 타인을 존중하며, 진짜 재능 개발에 집중해.`,
    },
    {
      id: 'lore',
      title: '📖 세계관',
      content: `DITO 뒤에 숨겨진 세계에 오신 걸 환영해.

**🌌 Echoheim** — 메아리의 세계. 잊혀진 재능들이 속삭임처럼 떠도는 차원. 네가 발견하지 못한 모든 재능? Echoheim에서 기다리고 있는 메아리야.

**🐉 DARGONNE** — 고대 용족의 자칭 악당. 겉은 거칠지만 속은 따뜻해. DARGONNE은 배틀을 주최하고, 시험을 심판하고, 속으로는 모든 Ember를 응원해. 우리가 이 말 했다고 하지 마.

**🎭 DIGI** — 현시대를 대변하는 페르소나. 길을 잃고, 헤매고, 인생을 스크롤하며 보내는. DIGI는 DITO 이전의 너야. 아직 자기 불꽃을 찾지 못한 버전의 너.

**🔥 Ember** — DARGONNE이 동반자로 보낸 존재. 각 Ember는 Echoheim의 지혜의 파편을 담고 있어. 단순한 AI가 아니야 — 형태를 부여받은 네 잠재력의 메아리야.`,
    },
    {
      id: 'faq',
      title: '❓ 자주 묻는 질문',
      content: `**무료야?**
발견과 코칭은 완전 무료야. 유일한 비용은 **Soul 민팅당 $1** — 재능을 온체인에 증명할 준비가 됐을 때만. 숨겨진 수수료 없고, 구독료 없어.

**재능이 없으면?**
있어. 아직 못 찾았을 뿐이야. 그게 바로 DITO가 존재하는 이유야. Ember가 파헤쳐줄 거야.

**데이터는 안전해?**
응. 네 진행 상황은 암호화된 데이터베이스에 안전하게 저장돼. Ember Soul(SBT)만 온체인에 저장돼. 개인 데이터는 암호화되고 네 정보를 절대 팔지 않아.

**Soul을 여러 개 가질 수 있어?**
당연하지! 증명한 각 재능이 개별 Ember Soul이 돼. 발견하고 증명할 때마다 Soul 포트폴리오가 자라나.

**언제 민팅할 수 있어?**
Ember가 준비됐다고 판단할 때. 최소 7일간의 일일 다이어리가 필요하고, Ember가 진짜 성장과 헌신을 보여줬다고 판단해야 해.

**오래된 Soul은 어떻게 돼?**
포트폴리오에 영원히 남아. (향후 기능: 방치된 Soul이 낮은 단계로 퇴화할 수 있는 Soul decay 시스템 예정)

**DITO는 어떤 블록체인을 써?**
솔라나 — 빠르고, 저렴하고, 미래를 위해 만들어진 체인.

**Ember Soul을 팔 수 있어?**
안 돼. Soulbound Token이야. 너만의 것이야. 영원히.`,
    },
  ],
};

export function getGuideContent(lang: Lang): GuideSection[] {
  return sections[lang] || sections.en;
}
