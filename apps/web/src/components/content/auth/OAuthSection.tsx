'use client';

import { redirectToOAuth } from '@/actions/auth';
import { GeneralButton } from '@/components/generics/button/Button';
import FacebookIcon from '@/components/icons/FacebookIcon';
import GoogleIcon from '@/components/icons/GoogleIcon';
import { useEffect, useState } from 'react';

export default function OAuthSection() {
  const [googleUrl, setGoogleUrl] = useState<string>('');
  const [facebookUrl, setFacebookUrl] = useState<string>('');

  useEffect(() => {
    redirectToOAuth('google').then(setGoogleUrl);
    redirectToOAuth('facebook').then(setFacebookUrl);
  }, []);

  return (
    <div className="375:px-5 min376:px-10 px-10 md:w-[50vw] lg:w-[40vw] mx-auto 1440:mx-0 1440:w-auto 1440:px-80 min1441:w-[40vw] min1441:px-10 min1441:mx-auto flex flex-col gap-2 pb-5">
      <a href={googleUrl} className="no-underline">
        <GeneralButton
          type="button"
          text="ПРОДОВЖИТИ З GOOGLE"
          variant="google"
          icon={GoogleIcon}
        />
      </a>
      <a href={facebookUrl} className="no-underline">
        <GeneralButton
          type="button"
          text="ПРОДОВЖИТИ З FACEBOOK"
          variant="facebook"
          icon={FacebookIcon}
        />
      </a>
    </div>
  );
}
