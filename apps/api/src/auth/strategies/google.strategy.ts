import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Provider } from '../../generated/prisma-client';
import {
  GOOGLE_CALLBACK_URL,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
} from '../../utils/config';
import { OAuthLoginRequest } from '../interfaces';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): OAuthLoginRequest | undefined {
    const { name, emails } = profile;
    const email = emails?.[0]?.value;

    if (!email) {
      const error = new Error('EMAIL_REQUIRED_FROM_GOOGLE');
      done(error, undefined);
      return undefined;
    }

    const user: OAuthLoginRequest = {
      provider: Provider.google,
      providerId: profile.id,
      email,
      givenName: name?.givenName ?? null,
      familyName: name?.familyName ?? null,
    };
    done(null, user);
    return user;
  }
}
