import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-facebook';
import { Provider } from '../../generated/prisma-client';
import {
  FACEBOOK_APP_ID,
  FACEBOOK_APP_SECRET,
  FACEBOOK_CALLBACK_URL,
} from '../../utils/config';
import { OAuthLoginRequest } from '../interfaces';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor() {
    super({
      clientID: FACEBOOK_APP_ID,
      clientSecret: FACEBOOK_APP_SECRET,
      callbackURL: FACEBOOK_CALLBACK_URL,
      profileFields: ['id', 'emails', 'name'],
      scope: ['email'],
      passReqToCallback: false,
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any) => void,
  ): OAuthLoginRequest | undefined {
    const { name, emails } = profile;
    const email = emails?.[0]?.value;

    if (!email) {
      const error = new Error('EMAIL_REQUIRED_FROM_FACEBOOK');
      done(error, undefined);
      return undefined;
    }

    const givenName = name?.givenName?.trim() || null;
    const familyName = name?.familyName?.trim() || null;

    const user: OAuthLoginRequest = {
      provider: Provider.facebook,
      providerId: profile.id,
      email,
      givenName,
      familyName,
    };
    done(null, user);
    return user;
  }
}
