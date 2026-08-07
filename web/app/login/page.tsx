import { Suspense } from 'react';
import LoginClient from './LoginClient';

export const metadata = {
  title: 'SecurePush | Sign in',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="login-page">Loading...</div>}>
      <LoginClient />
    </Suspense>
  );
}
