import { ShareSection } from './ShareSection';

export const InfoSection = ({ shareUrl }: { shareUrl?: string }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-0 border-white md:border-t">
      <div className="flex flex-col 375:gap-5 min376:gap-2 gap-2 py-4 px-6 375:py-6 min376:py-4 1440:py-6 1440:justify-between border-b md:border-b-0 border-white md:border-r">
        <p className="text-white uppercase font-sans text-xs 375:text-base min376:text-xs 1440:text-base font-medium leading-[100%]">
          ТЕРМІНИ ТА УМОВИ
        </p>
        <a
          href="/payment-delivery"
          className="text-[#FA4616] uppercase text-xs 375:text-base min376:text-xs 1440:text-base leading-[137.5%] underline font-medium"
        >
          ДЕТАЛІ
        </a>
      </div>

      <div className="flex flex-col 375:gap-5 min376:gap-2 gap-2 1440:gap-5 py-4 px-6 375:p-6 min376:py-4 1440:py-6 border-b md:border-b-0 border-white md:border-r">
        <p className="text-white uppercase font-sans text-xs 375:text-base min376:text-xs 1440:text-base font-medium leading-[100%]">
          ГАРАНТІЯ
        </p>
        <p className="uppercase text-xs 375:text-base min376:text-xs 1440:text-base leading-[137.5%] font-medium">
          30-ДЕННА ГАРАНТІЯ ПОВЕРНЕННЯ КОШТІВ
        </p>
      </div>

      <div className="flex flex-col 375:gap-5 min376:gap-2 gap-2 px-6 py-4 375:py-6 min376:py-4 1440:py-6 1440:justify-between border-b md:border-b-0 border-white md:border-r">
        <p className="text-white uppercase font-sans text-xs 375:text-base min376:text-xs 1440:text-base font-medium leading-[100%]">
          ДОСТАВКА
        </p>
        <p className="uppercase text-xs 375:text-base min376:text-xs 1440:text-base leading-[137.5%] font-medium">
          2-3 РОБОЧИХ ДНІ
        </p>
      </div>

      <ShareSection shareUrl={shareUrl} />
    </div>
  );
};
