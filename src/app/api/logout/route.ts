import { clearAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function POST() {
  await clearAuth();
  redirect('/login');
}
