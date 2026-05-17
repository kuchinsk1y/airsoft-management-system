import { BaseResponseDto } from '../../common/dto/base-response.dto';
import { StorageResponse } from '../interfaces';

export class StorageResponseDto
  extends BaseResponseDto<StorageResponse>
  implements StorageResponse
{
  url: string;
  key: string;
  filename: string;
  contentType: string;
  size: number;

  constructor(data: StorageResponse) {
    super(data);
    this.url = data.url;
    this.key = data.key;
    this.filename = data.filename;
    this.contentType = data.contentType;
    this.size = data.size;
  }
}
