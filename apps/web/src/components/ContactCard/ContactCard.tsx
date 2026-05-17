import { ContactCardProps } from '@/interfaces';
import { toSeoSafeHref } from '@/utils/seo-hide';
import Image from 'next/image';

const ContactCard = ({ ...props }: ContactCardProps) => {
  const mapHref = toSeoSafeHref(props.mapUrl);
  const cityContent = props.cityHref ? (
    <a href={props.cityHref} className="hover:underline">
      {props.city}
    </a>
  ) : (
    props.city
  );

  return (
    <div
      className="min-h-88 p-10 pt-8 flex flex-col justify-between gap-2 uppercase box-border border-l border-b border-white
        first:border-l-0 w-full min-[672px]:w-1/2 min-[1342px]:w-1/4"
    >
      <div className="flex flex-col gap-5">
        <p className="text-2xl font-normal flex items-center gap-2">
          <Image
            src="/Location.svg"
            alt="Location"
            width={24}
            height={24}
            className="inline-block"
          />
          {cityContent}
        </p>

        <div>
          <p className="font-normal text-xs">Телефон:</p>
          {props.phones.map((phone, index) => (
            <p key={index} className="font-normal text-base">
              <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} className="hover:underline">
                {phone}
              </a>
            </p>
          ))}
        </div>

        <div>
          <p className="font-normal text-xs">Адреса:</p>
          <p className="font-normal text-base">{props.address}</p>
        </div>
      </div>

      {mapHref ? (
        <a
          href={mapHref}
          target="_blank"
          rel="nofollow noopener noreferrer"
          className="mt-2 border border-gray-500 px-3 py-2 text-base font-normal hover:bg-white hover:text-black transition text-center"
        >
          Відкрити в Google Maps
        </a>
      ) : null}
    </div>
  );
};

export default ContactCard;
