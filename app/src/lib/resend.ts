import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.NOREPLY_EMAIL_ADDRESS || 'noreply@dito.guru';

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailTemplate): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('📧 [DEV] Email would be sent:', { to, subject });
      console.log('📧 [DEV] HTML content:', html);
      return true; // 개발용 fallback
    }

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      return false;
    }

    console.log('✅ Email sent successfully:', data?.id);
    return true;

  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

// OTP 이메일 템플릿
export function createOTPEmail(otpCode: string, language: 'ko' | 'en' = 'ko'): { subject: string; html: string } {
  const isKorean = language === 'ko';
  
  const subject = isKorean ? '🔥 DITO 인증코드' : '🔥 DITO Verification Code';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px;">
          <div style="font-size: 48px; margin-bottom: 16px;">🔥</div>
          <h1 style="margin: 0; color: #ff6b35; font-size: 32px; font-weight: bold;">DITO</h1>
          <p style="margin: 8px 0 0 0; color: #666; font-size: 14px;">
            ${isKorean ? 'AI와 함께하는 재능 발견 플랫폼' : 'AI-Powered Talent Discovery Platform'}
          </p>
        </div>

        <!-- Main Content -->
        <div style="background: #f8f9fa; border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 32px;">
          <h2 style="margin: 0 0 24px 0; color: #1a1a1a; font-size: 24px;">
            ${isKorean ? '보안 인증코드' : 'Security Verification Code'}
          </h2>
          
          <div style="background: white; border: 2px solid #ff6b35; border-radius: 8px; padding: 24px; margin: 24px 0; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #ff6b35; font-family: 'Courier New', monospace;">
            ${otpCode}
          </div>
          
          <p style="margin: 24px 0 0 0; color: #666; font-size: 14px;">
            ${isKorean 
              ? '이 코드는 <strong>5분 후</strong>에 만료됩니다.<br>본인이 요청하지 않았다면 이 이메일을 무시하세요.' 
              : 'This code expires in <strong>5 minutes</strong>.<br>If you didn\'t request this, please ignore this email.'}
          </p>
        </div>

        <!-- CTA Section -->
        <div style="text-align: center; margin-bottom: 32px;">
          <p style="margin: 0 0 16px 0; color: #333; font-size: 16px;">
            ${isKorean ? '재능을 발견하고 Ember와 함께 성장하세요!' : 'Discover your talent and grow with Ember!'}
          </p>
          <a href="https://dito.guru" style="display: inline-block; background: #ff6b35; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 16px;">
            ${isKorean ? '🚀 DITO 시작하기' : '🚀 Start DITO'}
          </a>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #eee; padding-top: 24px; text-align: center;">
          <p style="margin: 0 0 8px 0; color: #999; font-size: 12px;">
            ${isKorean 
              ? '이 이메일은 DITO.guru에서 발송되었습니다.' 
              : 'This email was sent by DITO.guru'}
          </p>
          <p style="margin: 0; color: #999; font-size: 12px;">
            ${isKorean 
              ? '문의사항이 있으시면 언제든 연락주세요.' 
              : 'Contact us anytime if you have questions.'}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

// 비밀번호 재설정 링크 이메일 템플릿
export function createPasswordResetEmail(resetUrl: string, language: 'ko' | 'en' = 'ko'): { subject: string; html: string } {
  const isKorean = language === 'ko';
  const subject = isKorean ? '🔥 DITO 비밀번호 재설정' : '🔥 DITO Password Reset';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px;">
          <div style="font-size: 48px; margin-bottom: 16px;">🔥</div>
          <h1 style="margin: 0; color: #ff6b35; font-size: 32px; font-weight: bold;">DITO</h1>
          <p style="margin: 8px 0 0 0; color: #666; font-size: 14px;">
            ${isKorean ? 'AI와 함께하는 재능 발견 플랫폼' : 'AI-Powered Talent Discovery Platform'}
          </p>
        </div>

        <!-- Main Content -->
        <div style="background: #f8f9fa; border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 32px;">
          <h2 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 24px;">
            ${isKorean ? '비밀번호 재설정' : 'Reset Your Password'}
          </h2>
          <p style="margin: 0 0 24px 0; color: #666; font-size: 14px;">
            ${isKorean
              ? '비밀번호 재설정을 요청하셨습니다.<br>아래 버튼을 클릭하여 새 비밀번호를 설정해주세요.'
              : 'You requested a password reset.<br>Click the button below to set a new password.'}
          </p>

          <a href="${resetUrl}" style="display: inline-block; background: #ff6b35; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);">
            ${isKorean ? '비밀번호 재설정' : 'Reset Password'}
          </a>

          <p style="margin: 24px 0 0 0; color: #666; font-size: 14px;">
            ${isKorean
              ? '이 링크는 <strong>30분 후</strong>에 만료됩니다.<br>본인이 요청하지 않았다면 이 이메일을 무시하세요.'
              : 'This link expires in <strong>30 minutes</strong>.<br>If you didn\'t request this, please ignore this email.'}
          </p>
        </div>

        <!-- Fallback URL -->
        <div style="text-align: center; margin-bottom: 32px;">
          <p style="margin: 0; color: #999; font-size: 12px;">
            ${isKorean ? '버튼이 작동하지 않으면 아래 링크를 복사하여 브라우저에 붙여넣으세요:' : 'If the button doesn\'t work, copy and paste this link:'}
          </p>
          <p style="margin: 8px 0 0 0; color: #ff6b35; font-size: 12px; word-break: break-all;">
            ${resetUrl}
          </p>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #eee; padding-top: 24px; text-align: center;">
          <p style="margin: 0 0 8px 0; color: #999; font-size: 12px;">
            ${isKorean
              ? '이 이메일은 DITO.guru에서 발송되었습니다.'
              : 'This email was sent by DITO.guru'}
          </p>
          <p style="margin: 0; color: #999; font-size: 12px;">
            ${isKorean
              ? '문의사항이 있으시면 언제든 연락주세요.'
              : 'Contact us anytime if you have questions.'}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

// 비밀번호 변경 완료 이메일 템플릿
export function createPasswordChangedEmail(language: 'ko' | 'en' = 'ko'): { subject: string; html: string } {
  const isKorean = language === 'ko';
  const subject = isKorean ? '🔥 DITO 비밀번호가 변경되었습니다' : '🔥 DITO Password Changed';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px;">
          <div style="font-size: 48px; margin-bottom: 16px;">🔥</div>
          <h1 style="margin: 0; color: #ff6b35; font-size: 32px; font-weight: bold;">DITO</h1>
          <p style="margin: 8px 0 0 0; color: #666; font-size: 14px;">
            ${isKorean ? 'AI와 함께하는 재능 발견 플랫폼' : 'AI-Powered Talent Discovery Platform'}
          </p>
        </div>

        <!-- Main Content -->
        <div style="background: #f8f9fa; border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 32px;">
          <h2 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 24px;">
            ${isKorean ? '비밀번호가 변경되었습니다' : 'Password Changed Successfully'}
          </h2>
          <p style="margin: 0; color: #666; font-size: 14px;">
            ${isKorean
              ? '계정의 비밀번호가 성공적으로 변경되었습니다.<br>새 비밀번호로 로그인해 주세요.'
              : 'Your account password has been changed successfully.<br>Please sign in with your new password.'}
          </p>
        </div>

        <!-- Security Notice -->
        <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 16px; margin-bottom: 32px;">
          <p style="margin: 0; color: #856404; font-size: 13px;">
            ${isKorean
              ? '본인이 비밀번호를 변경하지 않았다면, 즉시 비밀번호를 재설정하거나 고객지원팀에 문의해 주세요.'
              : 'If you did not change your password, please reset it immediately or contact our support team.'}
          </p>
        </div>

        <!-- CTA -->
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="https://dito.guru/auth" style="display: inline-block; background: #ff6b35; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 16px;">
            ${isKorean ? '로그인하기' : 'Sign In'}
          </a>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #eee; padding-top: 24px; text-align: center;">
          <p style="margin: 0 0 8px 0; color: #999; font-size: 12px;">
            ${isKorean
              ? '이 이메일은 DITO.guru에서 발송되었습니다.'
              : 'This email was sent by DITO.guru'}
          </p>
          <p style="margin: 0; color: #999; font-size: 12px;">
            ${isKorean
              ? '문의사항이 있으시면 언제든 연락주세요.'
              : 'Contact us anytime if you have questions.'}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

// 회원가입 환영 이메일 템플릿
export function createWelcomeEmail(username: string, language: 'ko' | 'en' = 'ko'): { subject: string; html: string } {
  const isKorean = language === 'ko';
  
  const subject = isKorean ? `🎉 ${username}님, DITO에 오신 걸 환영해요!` : `🎉 Welcome to DITO, ${username}!`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px;">
          <div style="font-size: 64px; margin-bottom: 16px;">🔥</div>
          <h1 style="margin: 0; color: #ff6b35; font-size: 32px; font-weight: bold;">DITO</h1>
          <p style="margin: 8px 0 0 0; color: #666; font-size: 14px;">
            ${isKorean ? 'AI와 함께하는 재능 발견 플랫폼' : 'AI-Powered Talent Discovery Platform'}
          </p>
        </div>

        <!-- Welcome Message -->
        <div style="background: linear-gradient(135deg, #ff6b35, #f7931e); border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 32px; color: white;">
          <h2 style="margin: 0 0 16px 0; font-size: 28px;">
            ${isKorean ? `환영합니다, ${username}님!` : `Welcome, ${username}!`}
          </h2>
          <p style="margin: 0; font-size: 16px; opacity: 0.9;">
            ${isKorean 
              ? 'DITO에 가입해 주셔서 감사해요. 이제 여러분만의 재능을 발견할 준비가 되었어요!' 
              : 'Thank you for joining DITO. You\'re now ready to discover your unique talents!'}
          </p>
        </div>

        <!-- Next Steps -->
        <div style="margin-bottom: 32px;">
          <h3 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 20px;">
            ${isKorean ? '🚀 다음 단계' : '🚀 Next Steps'}
          </h3>
          
          <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
            <div style="font-size: 24px; margin-bottom: 8px;">🔍</div>
            <h4 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">
              ${isKorean ? '1. 재능 발견하기' : '1. Discover Your Talent'}
            </h4>
            <p style="margin: 0; color: #666; font-size: 14px;">
              ${isKorean 
                ? 'AI Ember와 대화하며 숨겨진 재능을 찾아보세요.' 
                : 'Chat with AI Ember to uncover your hidden talents.'}
            </p>
          </div>

          <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
            <div style="font-size: 24px; margin-bottom: 8px;">💬</div>
            <h4 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">
              ${isKorean ? '2. Ember와 채팅' : '2. Chat with Ember'}
            </h4>
            <p style="margin: 0; color: #666; font-size: 14px;">
              ${isKorean 
                ? '매일 Ember와 대화하며 성장 과정을 기록하세요.' 
                : 'Record your growth journey through daily conversations with Ember.'}
            </p>
          </div>

          <div style="background: #f8f9fa; border-radius: 8px; padding: 20px;">
            <div style="font-size: 24px; margin-bottom: 8px;">🔥</div>
            <h4 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">
              ${isKorean ? '3. Soul 민팅하기' : '3. Mint Your Soul'}
            </h4>
            <p style="margin: 0; color: #666; font-size: 14px;">
              ${isKorean 
                ? '성장이 완료되면 나만의 Soul NFT를 만들어보세요.' 
                : 'When ready, create your unique Soul NFT as a testament to your growth.'}
            </p>
          </div>
        </div>

        <!-- CTA Button -->
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="https://dito.guru/discovery" style="display: inline-block; background: #ff6b35; color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);">
            ${isKorean ? '🔥 재능 발견 시작하기' : '🔥 Start Discovering Talents'}
          </a>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #eee; padding-top: 24px; text-align: center;">
          <p style="margin: 0 0 8px 0; color: #999; font-size: 12px;">
            ${isKorean 
              ? '궁금한 점이 있으시면 언제든 문의하세요!' 
              : 'Have questions? We\'re here to help!'}
          </p>
          <p style="margin: 0; color: #999; font-size: 12px;">
            ${isKorean 
              ? '이 이메일은 DITO.guru에서 발송되었습니다.' 
              : 'This email was sent by DITO.guru'}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}