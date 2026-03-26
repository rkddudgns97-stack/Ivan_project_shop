import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { Mail, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '../api';
import { useAuth } from '../auth/AuthProvider';

type AuthMode = 'signup' | 'login';

const ALLOWED_SIGNUP_DOMAINS = ['aeonlab.kr', 'finble.io', 'finbleventures.com', 'zerokleek.com'] as const;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isAllowedSignupEmail(email: string) {
  const domain = normalizeEmail(email).split('@')[1];
  return Boolean(domain && ALLOWED_SIGNUP_DOMAINS.includes(domain as (typeof ALLOWED_SIGNUP_DOMAINS)[number]));
}

export function AuthPage() {
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeRequested, setCodeRequested] = useState(false);
  const [debugCode, setDebugCode] = useState('');
  const [requestingCode, setRequestingCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCode('');
    setCodeRequested(false);
    setDebugCode('');
  }, [mode]);

  const allowedDomainText = useMemo(
    () => ALLOWED_SIGNUP_DOMAINS.map((item) => `@${item}`).join(', '),
    [],
  );

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleRequestCode = async () => {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      toast.error('이메일을 먼저 입력해주세요.');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      toast.error('이름을 입력해주세요.');
      return;
    }

    if (mode === 'signup' && !isAllowedSignupEmail(normalizedEmail)) {
      toast.error(`회원가입은 회사 이메일만 가능합니다. ${allowedDomainText}`);
      return;
    }

    setRequestingCode(true);
    try {
      const response = await authApi.requestEmailCode({
        email: normalizedEmail,
        purpose: mode,
      });

      setCodeRequested(true);
      setDebugCode(response.data.debugCode);
      toast.success('인증 코드를 발송했습니다.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '인증 코드 발송에 실패했습니다.');
    } finally {
      setRequestingCode(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const normalizedEmail = normalizeEmail(email);

    if (!codeRequested) {
      toast.error('먼저 이메일 인증을 요청해주세요.');
      return;
    }

    if (mode === 'signup' && !isAllowedSignupEmail(normalizedEmail)) {
      toast.error(`회원가입은 회사 이메일만 가능합니다. ${allowedDomainText}`);
      return;
    }

    setSubmitting(true);
    try {
      const response =
        mode === 'signup'
          ? await authApi.signupWithEmail({
              name: name.trim(),
              email: normalizedEmail,
              code: code.trim(),
            })
          : await authApi.loginWithEmail({
              email: normalizedEmail,
              code: code.trim(),
            });

      signIn(response.data);
      toast.success(mode === 'signup' ? '회원가입이 완료되었습니다.' : '로그인되었습니다.');
      navigate('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '인증 처리에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fdf7f2_0%,#f7f9fc_100%)] px-4 py-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)] lg:items-stretch">
        <section className="rounded-[32px] border border-[var(--border-highlight)] bg-[linear-gradient(135deg,var(--primary)_0%,#E97756_100%)] p-8 text-primary-foreground shadow-[var(--elevation-modal)] md:p-10">
          <div className="flex h-full flex-col justify-between gap-10">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/18 px-3 py-1 text-xs font-semibold tracking-[0.08em]">
                <ShieldCheck className="size-4" strokeWidth={1.7} />
                이메일 인증 로그인
              </span>
              <div className="space-y-3">
                <h1 className="max-w-xl text-4xl font-bold leading-tight md:text-5xl">
                  사내 복지몰은
                  <br />
                  이메일 인증으로 시작합니다
                </h1>
                <p className="max-w-xl text-base leading-7 text-white/85">
                  회원가입과 로그인 모두 이메일 인증 코드로 진행합니다. 허용된 회사 도메인만 가입할 수
                  있도록 가입 정책도 함께 관리합니다.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { title: '간편 가입', copy: '이메일과 인증 코드만으로 빠르게 시작할 수 있습니다.' },
                { title: '회사 계정 제한', copy: '허용된 회사 이메일만 회원가입할 수 있습니다.' },
                { title: '동일한 가입 정책', copy: '화면과 서버에 같은 가입 규칙이 적용됩니다.' },
              ].map((item) => (
                <div key={item.title} className="rounded-[24px] border border-white/16 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/78">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-border bg-card p-6 shadow-[var(--elevation-modal)] md:p-8">
          <div className="flex rounded-full bg-[var(--surface-subtle)] p-1">
            {[
              { key: 'signup', label: '회원가입' },
              { key: 'login', label: '로그인' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setMode(item.key as AuthMode)}
                className={[
                  'flex-1 rounded-full px-4 py-3 text-sm font-medium transition-colors',
                  mode === item.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
                ].join(' ')}
              >
                {item.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <h2>{mode === 'signup' ? '이메일 인증 회원가입' : '이메일 인증 로그인'}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {mode === 'signup'
                  ? '이름과 회사 이메일을 입력한 뒤 인증 코드를 받아 회원가입을 완료하세요.'
                  : '가입된 이메일로 인증 코드를 받아 로그인하세요.'}
              </p>
            </div>

            {mode === 'signup' && (
              <label className="block space-y-2">
                <span className="text-sm font-medium text-foreground">이름</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="홍길동"
                  className="h-12 w-full rounded-[var(--radius-button)] border border-border bg-background px-4 text-base outline-none transition-colors focus:border-[var(--border-highlight)] focus:ring-2 focus:ring-ring/20"
                />
              </label>
            )}

            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">이메일</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" strokeWidth={1.6} />
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@company.com"
                  className="h-12 w-full rounded-[var(--radius-button)] border border-border bg-background pl-12 pr-4 text-base outline-none transition-colors focus:border-[var(--border-highlight)] focus:ring-2 focus:ring-ring/20"
                />
              </div>
              {mode === 'signup' && (
                <p className="text-sm leading-6 text-muted-foreground">
                  가입 가능 도메인: <span className="font-medium text-foreground">{allowedDomainText}</span>
                </p>
              )}
            </label>

            <div className="rounded-[24px] border border-border bg-[var(--surface-subtle)] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-foreground">이메일 인증</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    인증 코드를 발송한 뒤 5분 안에 입력해주세요.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRequestCode}
                  disabled={requestingCode}
                  className="inline-flex h-12 items-center justify-center rounded-[var(--radius-button)] border border-border px-5 text-sm font-medium text-foreground transition-colors hover:border-[var(--border-highlight)] hover:bg-card disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {requestingCode ? '발송 중...' : '인증 코드 받기'}
                </button>
              </div>

              {codeRequested && (
                <div className="mt-4 rounded-[20px] border border-[var(--border-highlight)] bg-card px-4 py-3 text-sm text-muted-foreground">
                  개발용 인증 코드: <span className="font-semibold text-primary">{debugCode}</span>
                </div>
              )}
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">인증 코드</span>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="6자리 코드를 입력하세요"
                className="h-12 w-full rounded-[var(--radius-button)] border border-border bg-background px-4 text-base outline-none transition-colors focus:border-[var(--border-highlight)] focus:ring-2 focus:ring-ring/20"
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-12 w-full items-center justify-center rounded-[var(--radius-button)] bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? '처리 중...' : mode === 'signup' ? '회원가입 완료' : '로그인'}
            </button>

            <div className="rounded-[20px] bg-[var(--surface-subtle)] px-4 py-3 text-sm leading-6 text-muted-foreground">
              관리자 화면 확인이 필요하면 <span className="font-semibold text-foreground">admin@welfaremall.co.kr</span>
              로 로그인하고 인증 코드는 <span className="font-semibold text-primary">123456</span>을 사용하면 됩니다.
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
