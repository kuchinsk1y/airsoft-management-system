export class BaseResponseDto<T> {
  constructor(data: T) {
    if (data) {
      Object.assign(this, data);
    }
  }
}
