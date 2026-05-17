import { LoginResponse } from '../interfaces';

export class LoginResponseDto implements LoginResponse {
  access_token: string;

  constructor(token: string) {
    this.access_token = token;
  }
}
