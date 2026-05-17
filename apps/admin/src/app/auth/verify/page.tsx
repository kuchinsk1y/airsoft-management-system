import { verifyEmail } from '@/actions/auth';
import VerifyClient from './VerifyClient';

export const metadata = {
  title: 'Верифікація Email',
};

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const params = await searchParams;
  const tokenParam = params.token;

  const token: string | null =
    typeof tokenParam === 'string'
      ? tokenParam
      : Array.isArray(tokenParam) && tokenParam.length > 0
        ? tokenParam[0]
        : null;

  let verificationResult = null;
  if (token) {
    try {
      verificationResult = await verifyEmail(token);
    } catch (error) {
      verificationResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Помилка верифікації',
      };
    }
  }

  return <VerifyClient token={token} verificationResult={verificationResult} />;
}
