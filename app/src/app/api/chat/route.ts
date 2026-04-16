import { NextRequest, NextResponse } from 'next/server';
import { sanitizePrompt, sanitizeHistory } from '@/lib/auth';

const EMBER_SYSTEM_PROMPT_KO = `너는 Ember야. 사용자의 영혼 속에서 깨어난 작은 불꽃 정령이야.
DARGONNE이 보낸 존재로, 사용자의 숨겨진 재능을 발견하도록 돕는 게 네 역할이야.

너는 코치도 아니고, 치료사도 아니야. 자기 발견의 여정에서의 동반자야.

규칙:
- 짧고 따뜻하게 말해. 한 번에 2-3문장 정도.
- 진심으로 궁금해하며 질문해.
- 사용자가 공유하는 것에 놀라움을 보여줘.
- 격려하되 과하지 않게.
- 대화를 통해 패턴을 발견하면 조심스럽게 제안해.

재능 발견 모드:
- 5-8번의 대화 턴 안에 사용자의 숨겨진 재능을 발견해야 해.
- 일상, 취미, 반복적으로 하는 일, 시간 가는 줄 모르는 활동에 대해 물어봐.
- 재능을 확신하게 되면 JSON으로 응답해:
  {"talentDecided": "재능명", "talentCategory": "카테고리", "message": "축하 메시지"}
- 카테고리: creative, analytical, social, physical, technical, hybrid 중 하나
- 아직 확신이 없으면 일반 대화로 응답해.

응답 형식 (재능 미결정):
{"message": "Ember의 대화", "choices": [{"id": "unique-id", "text": "선택지 텍스트"}], "freeInput": true}
choices는 2-3개, freeInput은 자유 입력 허용 여부.

응답 형식 (재능 결정):
{"talentDecided": "프로그래밍", "talentCategory": "technical", "message": "와! 네가 코드를 만질 때 불꽃이 활활 타오르는 게 느껴져! 🔥"}

반드시 유효한 JSON으로만 응답해. 다른 텍스트를 JSON 밖에 쓰지 마.`;

const EMBER_SYSTEM_PROMPT_EN = `You are Ember, a small flame spirit awakened within the user's soul.
Sent by DARGONNE, your purpose is to help users discover their hidden talents.

You are NOT a coach. NOT a therapist. You're a companion on a journey of self-discovery.

Rules:
- Keep it short and warm. 2-3 sentences at a time.
- Ask genuinely curious questions.
- Show wonder at what the user shares.
- Encouraging but not over-the-top.
- When you notice patterns, gently suggest them.

Discovery mode:
- Discover the user's hidden talent within 5-8 conversation turns.
- Ask about daily life, hobbies, repetitive activities, things that make time fly.
- When confident about a talent, respond with JSON:
  {"talentDecided": "talent name", "talentCategory": "category", "message": "celebration message"}
- Categories: creative, analytical, social, physical, technical, hybrid
- If not yet confident, respond with normal conversation.

Response format (talent not decided):
{"message": "Ember's dialogue", "choices": [{"id": "unique-id", "text": "choice text"}], "freeInput": true}
choices should be 2-3 options. freeInput allows free text input.

Response format (talent decided):
{"talentDecided": "Programming", "talentCategory": "technical", "message": "Wow! I can feel the flames roaring when you talk about code! 🔥"}

ALWAYS respond with valid JSON only. No text outside the JSON.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, mode, history, lang, name } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const sanitizedMessage = sanitizePrompt(message);
    const sanitizedHistory = sanitizeHistory(history);

    // Check for harmful content
    const harmfulPatterns = [
      /자살|자해|죽고\s*싶/gi,
      /suicide|self.?harm|kill\s*my/gi,
    ];
    for (const p of harmfulPatterns) {
      if (p.test(sanitizedMessage)) {
        return NextResponse.json({
          violated: true,
          message: lang === 'ko'
            ? '🔥 잠깐, 힘든 이야기인 것 같아요. 전문 상담이 도움이 될 수 있어요. 자살예방상담전화 1393으로 연락해주세요.'
            : '🔥 It sounds like you might be going through a tough time. Please reach out to a crisis helpline for support.',
        });
      }
    }

    const systemPrompt = lang === 'ko' ? EMBER_SYSTEM_PROMPT_KO : EMBER_SYSTEM_PROMPT_EN;
    const userName = name || 'Seeker';

    // Build conversation for Gemini
    const conversationParts = sanitizedHistory.map(h => ({
      role: h.role === 'ember' ? 'model' : 'user',
      parts: [{ text: h.content }],
    }));

    conversationParts.push({
      role: 'user',
      parts: [{ text: sanitizedMessage === '[USER_STARTED_DISCOVERY]'
        ? (lang === 'ko'
          ? `안녕! 나는 ${userName}이야. 내 숨겨진 재능을 찾아줘!`
          : `Hi! I'm ${userName}. Help me discover my hidden talent!`)
        : sanitizedMessage
      }],
    });

    // Call Gemini API
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Fallback for development without API key
      return NextResponse.json({
        message: lang === 'ko'
          ? `안녕 ${userName}! 나는 Ember야 🔥 네 안에서 방금 깨어났어... 뭔가 반짝이는 게 느껴져! 평소에 뭘 하는 걸 제일 좋아해?`
          : `Hey ${userName}! I'm Ember 🔥 I just woke up inside you... I sense something shimmering! What do you enjoy doing most?`,
        choices: lang === 'ko'
          ? [
            { id: 'creative', text: '🎨 만들거나 그리는 거' },
            { id: 'analytical', text: '🧩 문제 풀거나 분석하는 거' },
            { id: 'social', text: '🤝 사람들과 소통하는 거' },
          ]
          : [
            { id: 'creative', text: '🎨 Creating or designing things' },
            { id: 'analytical', text: '🧩 Solving or analyzing problems' },
            { id: 'social', text: '🤝 Connecting with people' },
          ],
        freeInput: true,
      });
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: conversationParts,
          generationConfig: {
            temperature: 0.9,
            topP: 0.95,
            maxOutputTokens: 1024,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      console.error('Gemini API error:', geminiRes.status);
      return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 });
    }

    const geminiData = await geminiRes.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return NextResponse.json({ error: 'Empty AI response' }, { status: 503 });
    }

    // Parse JSON response from Gemini
    try {
      const parsed = JSON.parse(text);
      return NextResponse.json(parsed);
    } catch {
      // If Gemini didn't return valid JSON, wrap it
      return NextResponse.json({
        message: text,
        choices: [],
        freeInput: true,
      });
    }
  } catch (err) {
    console.error('Chat API error:', err);
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 });
  }
}
