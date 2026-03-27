import { useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
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
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const allowedDomainText = useMemo(
    () => ALLOWED_SIGNUP_DOMAINS.map((item) => `@${item}`).join(', '),
    [],
  );

  if (user) {
    return <Navigate to="/" replace />;
  }

  const resetPasswordFields = () => {
    setPassword('');
    setPasswordConfirm('');
  };

  const handleModeChange = (nextMode: AuthMode) => {
    setMode(nextMode);
    resetPasswordFields();
  };

  const handleSignup = async () => {
    const normalizedEmail = normalizeEmail(email);

    if (!name.trim()) {
      toast.error('이름을 입력해 주세요.');
      return;
    }

    if (!normalizedEmail) {
      toast.error('이메일을 입력해 주세요.');
      return;
    }

    if (!isAllowedSignupEmail(normalizedEmail)) {
      toast.error(`회원가입은 회사 이메일만 가능합니다. ${allowedDomainText}`);
      return;
    }

    if (password.length < 8) {
      toast.error('비밀번호는 8자 이상 입력해 주세요.');
      return;
    }

    if (password !== passwordConfirm) {
      toast.error('비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    const response = await authApi.signupWithEmail({
      name: name.trim(),
      email: normalizedEmail,
      password,
    });

    toast.success(response.data.message);
    setMode('login');
    setPassword('');
    setPasswordConfirm('');
  };

  const handleLogin = async () => {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      toast.error('이메일을 입력해 주세요.');
      return;
    }

    if (!password) {
      toast.error('비밀번호를 입력해 주세요.');
      return;
    }

    const response = await authApi.loginWithEmail({
      email: normalizedEmail,
      password,
    });

    signIn(response.data);
    toast.success('로그인되었습니다.');
    navigate('/');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      if (mode === 'signup') {
        await handleSignup();
        return;
      }

      await handleLogin();
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
                회사 계정 전용 로그인
              </span>
              <div className="space-y-3">
                <h1 className="max-w-xl text-4xl font-bold leading-tight md:text-5xl">
                  사내 복지몰은
                  <br />
                  관리자 승인 후 이용합니다
                </h1>
                <p className="max-w-xl text-base leading-7 text-white/85">
                  회사 이메일과 비밀번호로 가입한 뒤 관리자 승인까지 완료되면 로그인할 수 있습니다.
                  별도의 이메일 인증 코드는 사용하지 않습니다.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  title: '회사 이메일 제한',
                  copy: `허용 도메인 ${allowedDomainText} 계정만 회원가입할 수 있습니다.`,
                },
                {
                  title: '관리자 승인 방식',
                  copy: '가입 직후에는 승인 대기 상태가 되며, 관리자 확인 후 로그인할 수 있습니다.',
                },
                {
                  title: '비밀번호 로그인',
                  copy: '승인 완료 후에는 이메일과 비밀번호만으로 바로 로그인할 수 있습니다.',
                },
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
                onClick={() => handleModeChange(item.key as AuthMode)}
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
              <h2>{mode === 'signup' ? '관리자 승인 회원가입' : '이메일 로그인'}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {mode === 'signup'
                  ? '회사 이메일과 비밀번호를 입력하면 가입 요청이 접수됩니다. 승인 완료 후 로그인해 주세요.'
                  : '승인 완료된 계정만 로그인할 수 있습니다.'}
              </p>
            </div>

            {mode === 'signup' && (
              <label className="block space-y-2">
                <span className="text-sm font-medium text-foreground">이름</span>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" strokeWidth={1.6} />
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="이름을 입력해 주세요"
                    className="h-12 w-full rounded-[var(--radius-button)] border border-border bg-background pl-12 pr-4 text-base outline-none transition-colors focus:border-[var(--border-highlight)] focus:ring-2 focus:ring-ring/20"
                  />
                </div>
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

            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">비밀번호</span>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" strokeWidth={1.6} />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={mode === 'signup' ? '8자 이상 비밀번호를 입력해 주세요' : '비밀번호를 입력해 주세요'}
                  className="h-12 w-full rounded-[var(--radius-button)] border border-border bg-background pl-12 pr-4 text-base outline-none transition-colors focus:border-[var(--border-highlight)] focus:ring-2 focus:ring-ring/20"
                />
              </div>
            </label>

            {mode === 'signup' && (
              <label className="block space-y-2">
                <span className="text-sm font-medium text-foreground">비밀번호 확인</span>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" strokeWidth={1.6} />
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={(event) => setPasswordConfirm(event.target.value)}
                    placeholder="비밀번호를 한 번 더 입력해 주세요"
                    className="h-12 w-full rounded-[var(--radius-button)] border border-border bg-background pl-12 pr-4 text-base outline-none transition-colors focus:border-[var(--border-highlight)] focus:ring-2 focus:ring-ring/20"
                  />
                </div>
              </label>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-12 w-full items-center justify-center rounded-[var(--radius-button)] bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? '처리 중...' : mode === 'signup' ? '가입 요청 보내기' : '로그인'}
            </button>

            <div className="rounded-[20px] bg-[var(--surface-subtle)] px-4 py-3 text-sm leading-6 text-muted-foreground">
              {mode === 'signup'
                ? '가입 신청 후 관리자 승인까지 시간이 걸릴 수 있습니다. 승인 완료 후 로그인해 주세요.'
                : '로그인이 안 되면 관리자 승인 여부와 비밀번호를 먼저 확인해 주세요.'}
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
