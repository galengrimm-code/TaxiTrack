import { redirect } from 'next/navigation';
import { setAuthCookie, verifyAuth } from '@/lib/auth';
import Image from 'next/image';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // If already authenticated, redirect to dashboard
  const isAuthed = await verifyAuth();
  if (isAuthed) {
    redirect('/');
  }

  const params = await searchParams;
  const error = params.error;

  async function loginAction(formData: FormData) {
    'use server';

    const pin = formData.get('pin') as string;
    const expectedPin = process.env.AUTH_PIN;

    if (!expectedPin || pin !== expectedPin) {
      redirect('/login?error=invalid');
    }

    await setAuthCookie(pin);
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          {/* Logo & Title */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md overflow-hidden bg-white mb-4 border border-gray-100">
              <Image
                src="/logo.png"
                alt="TaxiTrack Logo"
                width={56}
                height={56}
                className="object-contain"
              />
            </div>
            <h1 className="text-xl font-bold text-gray-900">TaxiTrack</h1>
            <p className="text-sm text-gray-500 mt-1">Enter your PIN to continue</p>
          </div>

          {/* Error Message */}
          {error === 'invalid' && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 text-center">
              Invalid PIN. Please try again.
            </div>
          )}

          {/* Login Form */}
          <form action={loginAction} className="space-y-4">
            <div>
              <input
                type="password"
                name="pin"
                placeholder="Enter PIN"
                required
                autoFocus
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all text-center text-lg tracking-widest"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors shadow-sm"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
