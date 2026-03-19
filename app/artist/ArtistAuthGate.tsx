import { auth } from '@lib/auth';
import { redirect } from 'next/navigation';
import LoginForm from './LoginForm';

export default async function ArtistAuthGate() {
  const session = await auth();
  if (session?.user) redirect('/');

  return <LoginForm />;
}

