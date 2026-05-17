import { BaseResponseDto } from '../../common/dto/base-response.dto';
import { CitiesResponse, FaqItem, RegionBrief } from '../interfaces';

export class CitiesResponseDto
  extends BaseResponseDto<CitiesResponse>
  implements CitiesResponse
{
  id: number;
  name: string;
  slug: string;
  regionId: number;
  region: RegionBrief;
  createdAt: Date;
  seoText: string | null;
  seoFaq: FaqItem[] | null;
}
