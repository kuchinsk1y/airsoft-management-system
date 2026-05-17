'use client';

import { getMyTeamRole, getMyTeams } from '@/actions/teams';
import { useUser } from '@/contexts/UserContext';
import { MyTeamEmptyState, MyTeamMemberState } from '@/pages/MyTeamPage.ui';
import { MyTeamOwnerState } from '@/components/MyTeam/MyTeamOwnerState';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type TeamViewState = 'none' | 'owner' | 'member';

function resolveRoleFromTeam(team: any): TeamViewState | null {
  const rawRole =
    team?.myRole ??
    team?.role ??
    team?.memberRole ??
    team?.membershipRole ??
    null;

  if (typeof rawRole !== 'string') {
    return null;
  }

  const role = rawRole.trim().toLowerCase();
  if (role === 'owner' || role.includes('owner')) return 'owner';
  if (
    role === 'assistant' ||
    role.includes('assistant') ||
    role === 'staff' ||
    role.includes('staff') ||
    role === 'member' ||
    role.includes('member')
  ) {
    return 'member';
  }

  return null;
}

export default function MyTeamPage({
  initialResolvedState = null,
  initialTeamId = null,
}: {
  initialResolvedState?: TeamViewState | null;
  initialTeamId?: number | null;
}) {
  const { user, isLoading } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();

  const overrideState = useMemo<TeamViewState | null>(() => {
    const s = searchParams?.get('state');
    return s === 'none' || s === 'owner' || s === 'member' ? s : null;
  }, [searchParams]);

  const overrideTeamId = useMemo<number | null>(() => {
    const raw = searchParams?.get('teamId');
    if (!raw) return null;
    const id = Number(raw);
    return Number.isFinite(id) && id > 0 ? id : null;
  }, [searchParams]);

  const hasPreviewState = useMemo(() => {
    const s = searchParams?.get('state');
    return s === 'none' || s === 'owner' || s === 'member';
  }, [searchParams]);

  const [resolvedState, setResolvedState] = useState<TeamViewState>(
    initialResolvedState ?? 'none',
  );
  const [teamId, setTeamId] = useState<number | null>(initialTeamId);
  const [isResolving, setIsResolving] = useState(false);
  const [hasResolvedOnce, setHasResolvedOnce] = useState(
    initialResolvedState !== null,
  );
  const resolvingRef = useRef(false);
  const lastResolveKeyRef = useRef<string | null>(null);

  const viewState = overrideState ?? resolvedState;
  const shouldShowLoading = isLoading || (!hasResolvedOnce && isResolving);

  const resolveState = useCallback(async () => {
    if (!user) return;

    const resolveKey = `${user.id ?? 'no-user'}:${overrideTeamId ?? 'no-team'}`;
    if (hasResolvedOnce && lastResolveKeyRef.current === resolveKey) {
      return;
    }

    if (resolvingRef.current) return;
    resolvingRef.current = true;
    setIsResolving(true);
    try {
      if (overrideTeamId) {
        const role = await getMyTeamRole(overrideTeamId);
        if (role) {
          setTeamId(overrideTeamId);
          setResolvedState(role === 'owner' ? 'owner' : 'member');
          return;
        }
      }

      const teams = await getMyTeams();
      if (!Array.isArray(teams) || teams.length === 0) {
        setResolvedState('none');
        setTeamId(null);
        return;
      }

      const firstTeamId = Number((teams as any[])[0]?.id);
      if (!Number.isFinite(firstTeamId) || firstTeamId <= 0) {
        setResolvedState('none');
        setTeamId(null);
        return;
      }

      setTeamId(firstTeamId);

      // If backend already returns membership role with team, avoid extra roundtrip.
      const derivedRole = resolveRoleFromTeam((teams as any[])[0]);
      if (derivedRole) {
        setResolvedState(derivedRole);
        return;
      }

      const role = await getMyTeamRole(firstTeamId);
      setResolvedState(role === 'owner' ? 'owner' : 'member');
    } finally {
      setIsResolving(false);
      resolvingRef.current = false;
      lastResolveKeyRef.current = resolveKey;
      setHasResolvedOnce(true);
    }
  }, [user, overrideTeamId, hasResolvedOnce]);

  useEffect(() => {
    if (overrideState) return;
    if (!user) return;
    if (hasResolvedOnce) return;
    resolveState();
  }, [overrideState, user, resolveState, hasResolvedOnce]);

  useEffect(() => {
    if (!hasResolvedOnce || shouldShowLoading) return;
    if (viewState !== 'none') return;

    const rawTeamId = searchParams?.get('teamId');
    const rawTab = searchParams?.get('tab');

    if (!rawTeamId && !rawTab) return;

    router.replace('/profile/team');
  }, [hasResolvedOnce, shouldShowLoading, viewState, searchParams, router]);

  // Intentionally avoid background auto-refresh on focus/visibility here:
  // it generated excessive server action POSTs in profile/team.

  const handleCreated = useCallback(() => {
    resolveState();
    router.replace('/profile/team');
  }, [router, resolveState]);

  return (
    <div className="min-h-screen bg-[#000000] text-white pt-2.5 min991:pt-0">
      <div className="">
        {shouldShowLoading ? (
          <p className="text-center text-gray-400 py-10 text-sm uppercase">
            Завантаження...
          </p>
        ) : !user && !hasPreviewState ? (
          <p className="text-gray-400 uppercase">
            Потрібна авторизація, щоб побачити “Моя команда”.
          </p>
        ) : (
          <>
            {viewState === 'none' ? (
              <MyTeamEmptyState onCreated={handleCreated} />
            ) : null}
            {viewState === 'owner' ? (
              <MyTeamOwnerState teamId={teamId ?? undefined} />
            ) : null}
            {viewState === 'member' ? (
              <MyTeamMemberState teamId={teamId ?? undefined} />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
