'use client';

import { getRegionsWithEvents } from '@/actions/regions';
import type { Region } from '@/actions/regions';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ALL_REGIONS_OPTION: Region = {
  id: 0,
  name: 'Всі області',
  slug: '',
};

let cachedRegions: Region[] | null = null;
let regionsRequest: Promise<Region[]> | null = null;

const loadRegionsCached = async (): Promise<Region[]> => {
  if (cachedRegions) {
    return cachedRegions;
  }
  if (!regionsRequest) {
    regionsRequest = getRegionsWithEvents()
      .then((data) => {
        cachedRegions = Array.isArray(data) ? data : [];
        return cachedRegions;
      })
      .catch(() => {
        cachedRegions = [];
        return cachedRegions;
      })
      .finally(() => {
        regionsRequest = null;
      });
  }

  return regionsRequest;
};

export const RegionDropdown = () => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<Region>(ALL_REGIONS_OPTION);

  useEffect(() => {
    let mounted = true;
    const loadRegions = async () => {
      const fetched = await loadRegionsCached();
      if (mounted) {
        setRegions(fetched);
      }
    };
    loadRegions();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const regionParam = searchParams?.get('region');
    if (regionParam) {
      const region = regions.find((r) => r.slug === regionParam);
      if (region) {
        setSelectedRegion(region);
      } else {
        setSelectedRegion(ALL_REGIONS_OPTION);
      }
    } else {
      setSelectedRegion(ALL_REGIONS_OPTION);
    }
  }, [searchParams, regions]);

  const handleSelectRegion = (region: Region) => {
    setSelectedRegion(region);

    const params = new URLSearchParams(searchParams?.toString() ?? '');

    if (region.id === 0) {
      params.delete('region');
    } else {
      params.set('region', region.slug);
    }

    const queryString = params.toString();
    const nextPathname = pathname || '/';
    router.push(queryString ? `${nextPathname}?${queryString}` : nextPathname);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="uppercase text-white flex items-center gap-2 cursor-pointer">
          {selectedRegion.name}
          <span>▼</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="bg-black text-white border border-white">
        <DropdownMenuItem
          onClick={() => handleSelectRegion(ALL_REGIONS_OPTION)}
          className="uppercase cursor-pointer"
        >
          {ALL_REGIONS_OPTION.name}
        </DropdownMenuItem>
        {regions.map((region: Region) => (
          <DropdownMenuItem
            key={region.id}
            onClick={() => handleSelectRegion(region)}
            className="uppercase cursor-pointer"
          >
            {region.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
