'use client';

import { useEffect } from 'react';
import { useI18n } from '@/providers/i18n-provider';

const messages: Record<string, { taunt: string; warn: string; recruit: string }> = {
  ko: {
    taunt: `  ╱╲
 ╱  ╲    "콘솔 열어서 뭘 찾으려고?
╱ 🔥 ╲    니 재능은 여기 없어.
╲    ╱    dito.guru 가서 찾아."
 ╲  ╱
  ╲╱`,
    warn: '⚠️ 여기에 뭔가 붙여넣으라고 했다면, 그 사람이 너를 해킹하려는 거야.',
    recruit: '🔥 근데 개발자라면... 같이 만들 사람 찾는 중. DM @0xDARGONNE',
  },
  ja: {
    taunt: `  ╱╲
 ╱  ╲    「コンソール開いて何探してんの？
╱ 🔥 ╲    お前の才能はここにないよ。
╲    ╱    dito.guru で見つけな。」
 ╲  ╱
  ╲╱`,
    warn: '⚠️ ここに何か貼り付けろと言われたなら、それはハッキングだよ。',
    recruit: '🔥 でも開発者なら…仲間募集中。DM @0xDARGONNE',
  },
  zh: {
    taunt: `  ╱╲
 ╱  ╲    "打开控制台想找什么？
╱ 🔥 ╲    你的天赋不在这里。
╲    ╱    去 dito.guru 找吧。"
 ╲  ╱
  ╲╱`,
    warn: '⚠️ 如果有人让你在这里粘贴代码，那是在黑你。',
    recruit: '🔥 但如果你是开发者…我们在找同路人。DM @0xDARGONNE',
  },
  es: {
    taunt: `  ╱╲
 ╱  ╲    "¿Abriste la consola para buscar qué?
╱ 🔥 ╲    Tu talento no está aquí.
╲    ╱    Ve a dito.guru y encuéntralo."
 ╲  ╱
  ╲╱`,
    warn: '⚠️ Si alguien te dijo que pegues algo aquí, te están hackeando.',
    recruit: '🔥 Pero si eres dev... estamos buscando creyentes. DM @0xDARGONNE',
  },
  en: {
    taunt: `  ╱╲
 ╱  ╲    "Opening the console to find what?
╱ 🔥 ╲    Your talent isn't here.
╲    ╱    Go to dito.guru and find it."
 ╲  ╱
  ╲╱`,
    warn: '⚠️ If someone told you to paste something here, they\'re hacking you.',
    recruit: '🔥 But if you\'re a dev... we\'re hiring believers. DM @0xDARGONNE',
  },
};

export function ConsoleEasterEgg() {
  const { lang } = useI18n();

  useEffect(() => {
    const msg = messages[lang] || messages.en;

    console.log(
      `%c🐉 DARGONNE sees you.\n\n%c${msg.taunt}\n\n%c— DARGONNE (@0xDARGONNE)`,
      'color: #ff6b35; font-size: 20px; font-weight: bold;',
      'color: #ff6b35; font-size: 13px;',
      'color: #888; font-size: 11px; font-style: italic;'
    );

    console.log(`%c${msg.warn}`, 'color: red; font-size: 14px; font-weight: bold;');
    console.log(`%c${msg.recruit}`, 'color: #ff6b35; font-size: 11px;');
  }, [lang]);

  return null;
}
