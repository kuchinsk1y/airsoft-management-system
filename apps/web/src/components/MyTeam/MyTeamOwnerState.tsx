'use client';

import { TeamHeader } from '@/components/MyTeam/TeamHeader';
import { TeamTabs, type TeamTab } from '@/components/MyTeam/TeamTabs';
import { TeamApplications } from '@/components/MyTeam/TeamApplications';
import { GeneralButton } from '@/components/generics/button/Button';
import Loader from '@/components/generics/loader/Loader';
import { GeneralInput } from '@/components/generics/input/Input';
import { CloseIcon } from '@/components/icons/CloseIcon';
import BackdropModal from '@/components/generics/banners/BackdropModal';
import WarningIcon from '@/components/icons/WarningIcon';
import { ArrowLeftRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDownIcon } from '@/components/icons/ChevronDownIcon';
import { FieldError } from '@/components/ui/field';
import {
  createOwnershipTransferRequest,
  createTeamInvitation,
  deleteTeam,
  getTeamDetails,
  updateTeam,
  uploadTeamLogo,
} from '@/actions/teams';
import type { TeamMember, TeamDetailsResponse } from '@/interfaces';
import { useUser } from '@/contexts/UserContext';
import { Inter } from 'next/font/google';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEventHandler,
  type ReactNode,
} from 'react';
import { searchUsersByNickName, type UserSearchResult } from '@/actions/user';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '700'],
});

const TEAM_DETAILS_CACHE_TTL_MS = 30_000;
const teamDetailsCache = new Map<
  number,
  { data: TeamDetailsResponse; ts: number }
>();
const teamDetailsInFlight = new Map<number, Promise<TeamDetailsResponse | null>>();

async function getTeamDetailsCached(teamId: number, force = false) {
  const now = Date.now();
  const cached = teamDetailsCache.get(teamId);

  if (!force && cached && now - cached.ts < TEAM_DETAILS_CACHE_TTL_MS) {
    return cached.data;
  }

  if (!force) {
    const inFlight = teamDetailsInFlight.get(teamId);
    if (inFlight) {
      return inFlight;
    }
  }

  const request = getTeamDetails(teamId)
    .then((data) => {
      if (data) {
        teamDetailsCache.set(teamId, { data, ts: Date.now() });
      }
      return data;
    })
    .finally(() => {
      teamDetailsInFlight.delete(teamId);
    });

  teamDetailsInFlight.set(teamId, request);
  return request;
}

function FieldTitle({ children }: { children: ReactNode }) {
  return (
    <p className="text-[15px] font-semibold uppercase text-white mb-3">
      {children}
    </p>
  );
}

function FormTextarea({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
}) {
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full border border-white bg-transparent px-5 py-4 rounded-none text-[16px]! font-medium! placeholder:text-white placeholder:text-[16px]! placeholder:font-medium! placeholder:uppercase placeholder:opacity-40 text-white uppercase min-h-30 resize-none focus:outline-none"
    />
  );
}

function uniqNumbers(items: Array<number | undefined | null>) {
  const out: number[] = [];
  const seen = new Set<number>();
  for (const v of items) {
    if (typeof v !== 'number' || Number.isNaN(v)) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

type TransferTargetMember = TeamMember & {
  userId?: number;
  identityKey?: string;
};

function TeamMemberRowMobile({
  member,
  action,
}: {
  member: TransferTargetMember;
  action?: ReactNode;
}) {
  const displayName = member.nickName || '';
  const logoSrc = member.logoUrl || '/team-logo-avatar.png';
  const points = member.points ?? '';
  const games = member.games ?? '';

  return (
    <div className="min991:hidden flex justify-between items-center py-3.5 px-3 border border-[#262626] last:border-b gap-2.5 mb-2.5 min-w-0">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-full">
          <img
            src={logoSrc}
            alt={`${displayName} Logo`}
            className="w-full h-full rounded-full object-cover"
          />
        </div>
        <div className="flex flex-col gap-1.5 items-start flex-1 min-w-0 overflow-hidden">
          <p className="font-semibold w-full truncate">{displayName}</p>
          <span className={`text-[#808080] ${inter.className} text-xs `}>
            Ігор: {games}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 shrink-0 min-w-32">
        <span className="text-[#FF4D1C] text-xs font-semibold whitespace-nowrap uppercase text-right w-25">
          {points} &nbsp; ОЧОК
        </span>

        <div className="w-10 flex justify-end">
          {action ? (
            action
          ) : (
              null
          )}
        </div>
      </div>
    </div>
  );
}

function TeamMemberRowDesktop({
  member,
  action,
}: {
  member: TransferTargetMember;
  action?: ReactNode;
}) {
  const displayName = member.nickName || '';
  const logoSrc = member.logoUrl || '/team-logo-avatar.png';
  const games = member.games ?? '';
  const points = member.points ?? '';

  return (
    <tr className="hidden min991:table-row">
      <td className="border-b border-l border-[#262626] px-4 py-4 align-middle">
        <div className="w-10 h-10 rounded-full">
          <img
            src={logoSrc}
            alt={`${displayName} Logo`}
            className="w-full h-full rounded-full object-cover"
          />
        </div>
      </td>
      <td className="border-b border-[#262626] pl-6 pr-4 py-4 align-middle min-w-0">
        <span className="block min-w-0 truncate text-white font-semibold text-sm">
          {displayName}
        </span>
      </td>
      <td className="border-b border-[#262626] py-4 align-middle text-center text-white text-sm">
        {games}
      </td>
      <td className="border-b border-[#262626] py-4 align-middle text-center text-white text-sm">
        {points}
      </td>
      <td className="border-b border-r border-[#262626] pr-4 align-middle">
        <div className="flex justify-center">
          {action ? (
            action
          ) : (
            null
          )}
        </div>
      </td>
    </tr>
  );
}

function TeamMemberSectionMobile({
  title,
  members,
  renderAction,
}: {
  title: string;
  members: TransferTargetMember[];
  renderAction?: (member: TransferTargetMember) => ReactNode;
}) {
  return (
    <>
      <div
        className={`min991:hidden ${inter.className} flex items-center py-2.5  text-[#FF4D1C] text-xs font-bold border border-[#262626] uppercase`}
      >
        <span className="flex-1">{title}</span>
      </div>
      {members.length > 0 ? (
        <div className="min991:hidden">
          {members.map((member, index) => (
            <TeamMemberRowMobile
              key={member.id ?? index}
              member={member}
              action={renderAction?.(member)}
            />
          ))}
        </div>
      ) : (
        <div
          className={`min991:hidden ${inter.className} flex items-center py-2.5  border-b border-x border-[#262626] text-[#999999] text-xs uppercase`}
        >
          <span className="flex-1">Немає учасників</span>
        </div>
      )}
    </>
  );
}

function TeamMemberSectionDesktop({
  title,
  members,
  renderAction,
}: {
  title: string;
  members: TransferTargetMember[];
  renderAction?: (member: TransferTargetMember) => ReactNode;
}) {
  return (
    <>
      <tr className="hidden min991:table-row bg-[#FFFFFF]/3">
        <td
          colSpan={5}
          className="border-l border-r border-b border-[#262626] px-4 py-3 text-[#FF4D1C] bg-[#0C0B0B] text-sm font-semibold uppercase"
        >
          {title}
        </td>
      </tr>
      {members.length > 0 ? (
        members.map((member, index) => (
          <TeamMemberRowDesktop
            key={member.id ?? index}
            member={member}
            action={renderAction?.(member)}
          />
        ))
      ) : (
        <tr className="hidden min991:table-row">
          <td
            colSpan={5}
            className="border-l border-r border-b border-[#262626] px-4 py-3 text-[#999999] text-sm uppercase"
          >
            Немає учасників
          </td>
        </tr>
      )}
    </>
  );
}

export function MyTeamOwnerState({ teamId }: { teamId?: number }) {
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab') as TeamTab;
  const [tab, setTab] = useState<TeamTab>(tabParam ?? 'my-team');

  const [teamData, setTeamData] = useState<TeamDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const router = useRouter();
  const logoRevokeUrlRef = useRef<string | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);
  const [deleteTeamError, setDeleteTeamError] = useState<string | null>(null);
  const [transferCandidate, setTransferCandidate] =
    useState<TransferTargetMember | null>(null);
  const [isTransferSubmitting, setIsTransferSubmitting] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);

  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editLogoPreviewUrl, setEditLogoPreviewUrl] = useState<string | null>(
    null,
  );
  const [editLogoError, setEditLogoError] = useState<string | null>(null);
  const [participantIds, setParticipantIds] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteResults, setInviteResults] = useState<UserSearchResult[]>([]);
  const [isInviteSearching, setIsInviteSearching] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [invitingUserId, setInvitingUserId] = useState<number | null>(null);
  const inviteRequestRef = useRef(0);
  const inviteFlashTimeoutRef = useRef<number | null>(null);

  const MAX_LOGO_FILE_SIZE = 10 * 1024 * 1024;
  const ALLOWED_LOGO_MIME_TYPES = useMemo(
    () => new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']),
    [],
  );

  useEffect(() => {
    if (typeof tabParam === 'string' && tab !== tabParam) {
      setTab(tabParam);
    }
  }, [tabParam]);

  const formatFileSize = useCallback((bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    const kb = bytes / 1024;
    return `${Math.max(1, Math.round(kb))} KB`;
  }, []);

  useEffect(() => {
    if (!teamId) {
      setIsLoading(false);
      return;
    }

    const fetchTeamDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getTeamDetailsCached(teamId);
        if (data) {
          setTeamData(data);
        } else {
          setError('Помилка при завантаженні команди');
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Помилка при завантаженні команди',
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamDetails();
  }, [teamId]);

  useEffect(() => {
    return () => {
      if (logoRevokeUrlRef.current) {
        URL.revokeObjectURL(logoRevokeUrlRef.current);
        logoRevokeUrlRef.current = null;
      }
      if (inviteFlashTimeoutRef.current) {
        window.clearTimeout(inviteFlashTimeoutRef.current);
        inviteFlashTimeoutRef.current = null;
      }
    };
  }, []);

  const membersIndex = useMemo(() => {
    const index = new Map<
      number,
      { id: number; nickName: string; logoUrl?: string }
    >();
    const members = teamData?.members || [];
    for (const m of members) {
      const u = m.user;
      if (!u) continue;
      index.set(u.id, {
        id: u.id,
        nickName: u.nickName,
        logoUrl: u.logoUrl || undefined,
      });
    }
    return index;
  }, [teamData?.members]);
  useEffect(() => {
    if (!teamData || tab !== 'edit') return;

    setEditName((prev) => prev || teamData.name || '');
    setEditDescription((prev) => prev || teamData.description || '');
    setSaveError(null);
    setSaveSuccess(null);

    const members = teamData.members || [];
    const ownerId = user?.id;
    const allParticipants = uniqNumbers(members.map((m) => m.user?.id)).filter(
      (id) => (ownerId ? id !== ownerId : true),
    );
    setParticipantIds((prev) => (prev.length ? prev : allParticipants));

    // intentionally do NOT reset user-selected logo state here
  }, [teamData, tab, user?.id]);

  const participantPickUsers = useMemo(() => {
    const ownerId = user?.id;
    return Array.from(membersIndex.values()).filter(
      (u) =>
        (ownerId ? u.id !== ownerId : true) && !participantIds.includes(u.id),
    );
  }, [membersIndex, participantIds, user?.id]);

  const existingMemberIds = useMemo(() => {
    return new Set<number>(Array.from(membersIndex.keys()));
  }, [membersIndex]);

  useEffect(() => {
    const q = inviteQuery.trim();
    setInviteError(null);

    if (q.length < 2) {
      setInviteResults([]);
      return;
    }

    const requestId = ++inviteRequestRef.current;
    const t = window.setTimeout(async () => {
      setIsInviteSearching(true);
      try {
        const results = await searchUsersByNickName(q);
        if (inviteRequestRef.current !== requestId) return;

        const filtered = results.filter((u) => {
          if (!u?.id) return false;
          if (user?.id && u.id === user.id) return false;
          if (existingMemberIds.has(u.id)) return false;
          return true;
        });
        setInviteResults(filtered);
      } finally {
        if (inviteRequestRef.current === requestId) {
          setIsInviteSearching(false);
        }
      }
    }, 300);

    return () => window.clearTimeout(t);
  }, [inviteQuery, user?.id, existingMemberIds]);

  const handleInvite = useCallback(
    async (inviteeId: number) => {
      if (!teamId) return;
      setInviteError(null);
      setInviteSuccess(null);
      setInvitingUserId(inviteeId);
      try {
        await createTeamInvitation({ teamId, inviteeId });
        setInviteSuccess('Запрошення успішно відправлено');
        setInviteQuery('');
        setInviteResults([]);
        if (inviteFlashTimeoutRef.current) {
          window.clearTimeout(inviteFlashTimeoutRef.current);
        }
        inviteFlashTimeoutRef.current = window.setTimeout(() => {
          setInviteSuccess(null);
        }, 7000);
      } catch (e) {
        setInviteError(
          e instanceof Error ? e.message : 'Помилка при відправці запрошення',
        );
        if (inviteFlashTimeoutRef.current) {
          window.clearTimeout(inviteFlashTimeoutRef.current);
          inviteFlashTimeoutRef.current = null;
        }
      } finally {
        setInvitingUserId(null);
      }
    },
    [teamId],
  );

  const handleDeleteTeam = useCallback(async () => {
    if (!teamId) return;
    if (isDeletingTeam) return;

    setDeleteTeamError(null);
    setIsDeletingTeam(true);
    try {
      await deleteTeam(teamId);
      setIsDeleteModalOpen(false);
      router.replace('/profile/team?state=none');
    } catch (e) {
      setDeleteTeamError(
        e instanceof Error ? e.message : 'Помилка при видаленні команди',
      );
    } finally {
      setIsDeletingTeam(false);
    }
  }, [teamId, isDeletingTeam, router]);

  const handleTransferOwnership = useCallback(async () => {
    if (!teamId || !transferCandidate?.userId || isTransferSubmitting) {
      return;
    }

    setTransferError(null);
    setTransferSuccess(null);
    setIsTransferSubmitting(true);

    try {
      await createOwnershipTransferRequest(teamId, transferCandidate.userId);
      setTransferSuccess(
        `Запит на передачу прав для ${transferCandidate.nickName || 'учасника'} відправлено`,
      );
      setTransferCandidate(null);
      window.dispatchEvent(new Event('notifications-updated'));
    } catch (e) {
      setTransferError(
        e instanceof Error
          ? e.message
          : 'Помилка при створенні запиту на передачу прав',
      );
    } finally {
      setIsTransferSubmitting(false);
    }
  }, [teamId, transferCandidate, isTransferSubmitting]);

  const handleSaveTeam = async () => {
    if (!teamId) return;

    if (editLogoError) {
      setSaveError(editLogoError);
      return;
    }
    const name = editName.trim();
    if (!name) {
      setSaveError('Введіть назву команди');
      return;
    }

    if (editLogoFile) {
      if (!ALLOWED_LOGO_MIME_TYPES.has(editLogoFile.type)) {
        setSaveError(
          'Непідтримуваний формат логотипу. Дозволено: PNG, JPEG, WebP.',
        );
        return;
      }
      if (editLogoFile.size > MAX_LOGO_FILE_SIZE) {
        setSaveError(
          `Файл завеликий. Максимальний розмір логотипу — 10 MB. Обраний файл — ${formatFileSize(
            editLogoFile.size,
          )}.`,
        );
        return;
      }
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      await updateTeam(teamId, {
        name,
        description: editDescription.trim() || undefined,
        members: participantIds,
      });

      if (editLogoFile) {
        const form = new FormData();
        form.append('file', editLogoFile);
        await uploadTeamLogo(teamId, form);
      }

      const refreshed = await getTeamDetailsCached(teamId, true);
      if (refreshed) {
        setTeamData(refreshed);
      }
      setSaveSuccess('Дані відправлено на модерацію');
      setTab('my-team');
    } catch (e) {
      setSaveError(
        e instanceof Error ? e.message : 'Помилка при оновленні команди',
      );
    } finally {
      setIsSaving(false);
    }
  };

  type ProcessedMember = TransferTargetMember & {
    userId?: number;
    identityKey: string;
  };

  const processedMembers = useMemo<ProcessedMember[]>(() => {
    if (!teamData?.members || !Array.isArray(teamData.members)) {
      return [];
    }

    const normalizeRole = (
      raw: unknown,
    ): 'owner' | 'assistant' | 'staff' | 'member' => {
      if (typeof raw !== 'string') {
        return 'member';
      }
      const v = raw.trim().toLowerCase();
      if (v === 'owner' || v.includes('owner')) return 'owner';
      if (v === 'assistant' || v.includes('assistant')) return 'assistant';
      if (v === 'staff' || v.includes('staff')) return 'staff';
      if (v === 'member' || v.includes('member')) return 'member';
      return 'member';
    };

    const priority: Record<'owner' | 'assistant' | 'staff' | 'member', number> =
      {
        owner: 3,
        assistant: 2,
        staff: 1,
        member: 0,
      };

    const mapped: ProcessedMember[] = teamData.members.map((member) => {
      const userId = member.user?.id;
      const role = normalizeRole(member.role);
      const stats = member.playerStats ?? member.user?.playerStats;

      const nick = member.user?.nickName || '';
      const identityKey =
        userId !== undefined
          ? `u:${userId}`
          : nick
            ? `n:${nick.trim().toLowerCase()}`
            : `m:${member.id}`;

      return {
        id: member.id,
        userId,
        identityKey,
        role,
        nickName: nick,
        logoUrl: member.user?.logoUrl,
        games: stats?.gamesPlayed ?? 0,
        points: stats?.totalPoints ?? stats?.points ?? 0,
        rating: stats?.rank ?? 0,
        contribution: Math.round(member.teamContribution || 0),
      };
    });

    const dedupedByUser = new Map<string, ProcessedMember>();
    for (const m of mapped) {
      const key = m.identityKey;
      const existing = dedupedByUser.get(key);
      if (!existing) {
        dedupedByUser.set(key, m);
        continue;
      }
      const nextRole = (m.role || 'member') as
        | 'owner'
        | 'assistant'
        | 'staff'
        | 'member';
      const prevRole = (existing.role || 'member') as
        | 'owner'
        | 'assistant'
        | 'staff'
        | 'member';
      if (priority[nextRole] > priority[prevRole]) {
        dedupedByUser.set(key, m);
      }
    }

    return Array.from(dedupedByUser.values());
  }, [teamData?.members, user?.id]);

  const currentUserId = user?.id;

  const owners = useMemo<ProcessedMember[]>(() => {
    const explicitOwners = processedMembers.filter((m) => m.role === 'owner');
    if (explicitOwners.length > 0) {
      return explicitOwners;
    }

    if (!currentUserId) {
      return [];
    }

    const currentUserMember = processedMembers.find(
      (member) => member.userId === currentUserId,
    );

    return currentUserMember ? [{ ...currentUserMember, role: 'owner' }] : [];
  }, [processedMembers, currentUserId]);

  const others = useMemo(() => {
    if (!currentUserId) return processedMembers;
    return processedMembers.filter((m) => m.userId !== currentUserId);
  }, [processedMembers, currentUserId]);

  const participants = others;

  if (isLoading) {
    return (
      <div className="text-center text-gray-400 py-10 text-sm uppercase">
        Завантаження команди...
      </div>
    );
  }

  if (error) {
    return (
      <FieldError
        errors={[{ message: error }]}
        className="text-[#FF4D1C] text-[10px] 375:text-xs min376:text-[10px] 1440:text-base min1441:text-sm font-normal leading-[150%]"
      />
    );
  }

  return (
    <div className="relative flex flex-col gap-10 min991:pb-3.5 ">
      {isSaving ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
          <Loader text="Збереження..." />
        </div>
      ) : null}
      <TeamTabs value={tab} onChange={setTab} userRole="owner" />

      {isDeleteModalOpen ? (
        <BackdropModal
          icon={WarningIcon}
          text="Ви впевнені, що хочете видалити команду?"
        >
          <div className="flex flex-col gap-3 w-full">
            <GeneralButton
              text="НІ"
              variant="white-border"
              className="uppercase w-full h-15 min991:h-10"
              onClick={() => {
                setDeleteTeamError(null);
                setIsDeleteModalOpen(false);
              }}
              disabled={isDeletingTeam}
            />
            <GeneralButton
              text={isDeletingTeam ? '...' : 'ТАК'}
              variant="orange-bg"
              className="uppercase w-full border-none"
              onClick={handleDeleteTeam}
              disabled={isDeletingTeam}
            />

            {deleteTeamError ? (
              <FieldError
                errors={[{ message: deleteTeamError }]}
                className="text-[#FA4616] text-[10px] 375:text-xs min376:text-[10px] 1440:text-base min1441:text-sm font-normal leading-[150%]"
              />
            ) : null}
          </div>
        </BackdropModal>
      ) : null}

      {transferCandidate ? (
        <BackdropModal
          icon={WarningIcon}
          text={`Підтвердити передачу прав власника команди користувачу ${transferCandidate.nickName || 'учаснику'}?`}
        >
          <div className="flex flex-col gap-3 w-full">
            <GeneralButton
              text="НІ"
              variant="white-border"
              className="uppercase w-full h-15 min991:h-10"
              onClick={() => {
                if (isTransferSubmitting) return;
                setTransferError(null);
                setTransferCandidate(null);
              }}
              disabled={isTransferSubmitting}
            />
            <GeneralButton
              text={isTransferSubmitting ? '...' : 'ТАК'}
              variant="orange-bg"
              className="uppercase w-full border-none"
              onClick={handleTransferOwnership}
              disabled={isTransferSubmitting}
            />

            {transferError ? (
              <FieldError
                errors={[{ message: transferError }]}
                className="text-[#FA4616] text-[10px] 375:text-xs min376:text-[10px] 1440:text-base min1441:text-sm font-normal leading-[150%]"
              />
            ) : null}
          </div>
        </BackdropModal>
      ) : null}

      {tab === 'my-team' && (
        <div className="flex flex-col gap-10">
          <TeamHeader
            logoSrc={teamData?.logoUrl || '/team-logo-avatar.png'}
            name={teamData?.name || ''}
            description={teamData?.description || ''}
            rightAction={
              <button
                type="button"
                onClick={() => {
                  setDeleteTeamError(null);
                  setIsDeleteModalOpen(true);
                }}
                disabled={isDeletingTeam}
                title="Видалити команду"
                className="inline-flex items-center justify-center border border-white/20 p-2 text-[#FA4616] hover:border-[#FA4616] hover:text-[#FA4616] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CloseIcon className="w-6 h-6" />
              </button>
            }
          />

          <div className="flex flex-col border-t border-[#262626]">
            <table className="hidden min991:table w-full table-fixed border-collapse">
              <colgroup>
                <col style={{ width: '72px' }} />
                <col />
                <col style={{ width: '80px' }} />
                <col style={{ width: '90px' }} />
                <col style={{ width: '180px' }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="border-b border-l border-[#262626] px-4 py-4 text-left text-xs text-[#999999] font-semibold uppercase">
                    ФОТО
                  </th>
                  <th className="border-b border-[#262626] pl-6 pr-4 py-4 text-left text-xs text-[#999999] font-semibold uppercase">
                    ПОЗИВНИЙ
                  </th>
                  <th className="border-b border-[#262626] px-4 py-4 text-center text-xs text-[#999999] font-semibold uppercase">
                    ІГОР
                  </th>
                  <th className="border-b border-[#262626] px-4 py-4 text-center text-xs text-[#999999] font-semibold uppercase">
                    ОЧОК
                  </th>
                  <th className="border-b border-r border-[#262626] px-2 py-4 text-center text-xs text-[#999999] font-semibold uppercase">
                    Передати&nbsp;&nbsp; командування
                  </th>
                </tr>
              </thead>
              <tbody>
                <TeamMemberSectionDesktop title="Командир" members={owners} />
                <TeamMemberSectionDesktop
                  title="Учасники"
                  members={participants}
                  renderAction={(member) => (
                    <button
                      type="button"
                      aria-label={`Передати права ${member.nickName || 'учаснику'}`}
                      title="Передати права командування"
                      className="inline-flex h-10 w-35 cursor-pointer items-center justify-center border border-white/20 hover:border-[#FF4D1C] text-[#FF4D1C] transition hover:bg-[#FF4D1C]/10 disabled:opacity-50 disabled:pointer-events-none"
                      disabled={isTransferSubmitting || !member.userId}
                      onClick={() => {
                        setTransferError(null);
                        setTransferSuccess(null);
                        setTransferCandidate(member);
                      }}
                    >
                      <ArrowLeftRight />
                    </button>
                  )}
                />
              </tbody>
            </table>

            {transferSuccess ? (
              <div className="mt-4">
                <p className="uppercase text-xs text-white/80">
                  {transferSuccess}
                </p>
              </div>
            ) : null}

            {transferError && !transferCandidate ? (
              <div className="mt-4">
                <FieldError
                  errors={[{ message: transferError }]}
                  className="text-[#FA4616] text-[10px] 375:text-xs min376:text-[10px] 1440:text-base min1441:text-sm font-normal leading-[150%]"
                />
              </div>
            ) : null}

            <TeamMemberSectionMobile title="Командир" members={owners} />
            <TeamMemberSectionMobile
              title="Учасники"
              members={participants}
              renderAction={(member) => (
                <button
                  type="button"
                  aria-label={`Передати права ${member.nickName || 'учаснику'}`}
                  title="Передати права командира"
                  className="inline-flex h-10 w-10 cursor-pointer items-center justify-center border border-white/20 hover:border-[#FF4D1C] text-[#FF4D1C] transition hover:bg-[#FF4D1C]/10 disabled:opacity-50 disabled:pointer-events-none"
                  disabled={isTransferSubmitting || !member.userId}
                  onClick={() => {
                    setTransferError(null);
                    setTransferSuccess(null);
                    setTransferCandidate(member);
                  }}
                >
                  <ArrowLeftRight />
                </button>
              )}
            />
          </div>
        </div>
      )}

      {tab === 'applications' && <TeamApplications teamId={teamId} />}

      {tab === 'edit' && (
        <div className="flex flex-col gap-10">
          <TeamHeader
            logoSrc={
              editLogoPreviewUrl || teamData?.logoUrl || '/team-logo-avatar.png'
            }
            changeLogoText="ЗМІНИТИ ЛОГОТИП"
            onLogoPick={(file) => {
              setEditLogoFile(file);
              const nextUrl = URL.createObjectURL(file);
              if (logoRevokeUrlRef.current) {
                URL.revokeObjectURL(logoRevokeUrlRef.current);
              }
              logoRevokeUrlRef.current = nextUrl;
              setEditLogoPreviewUrl(nextUrl);

              if (!ALLOWED_LOGO_MIME_TYPES.has(file.type)) {
                setEditLogoError(
                  'Непідтримуваний формат. Дозволено: PNG, JPEG, WebP.',
                );
                return;
              }
              if (file.size > MAX_LOGO_FILE_SIZE) {
                setEditLogoError(
                  `Файл завеликий. Максимальний розмір логотипу — 10 MB. Обраний файл — ${formatFileSize(
                    file.size,
                  )}.`,
                );
                return;
              }

              setEditLogoError(null);
            }}
          />

          {editLogoError ? (
            <FieldError
              errors={[{ message: editLogoError }]}
              className="text-[#FA4616] text-[10px] 375:text-xs min376:text-[10px] 1440:text-base min1441:text-sm font-normal leading-[150%] -mt-6"
            />
          ) : null}

          <div className="flex flex-col gap-8 max-w-327.5 w-full">
            <div>
              <FieldTitle>Назва команди</FieldTitle>
              <GeneralInput
                variant="form"
                placeholder="Введіть назву"
                className="text-[16px]! font-medium! placeholder:text-[16px]! placeholder:font-medium!"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>

            <div>
              <FieldTitle>Опис команди</FieldTitle>
              <FormTextarea
                placeholder="Опишіть вашу команду..."
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>

            <div>
              <FieldTitle>Додати учасників</FieldTitle>

              <div className="border border-white px-4 py-3 flex flex-wrap items-center gap-2">
                {participantIds.map((id) => {
                  const u = membersIndex.get(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setParticipantIds((prev) =>
                          prev.filter((x) => x !== id),
                        );
                      }}
                      className="flex items-center gap-2 bg-white/5 border border-white/15 px-3 py-1 text-sm uppercase"
                      title="Видалити"
                    >
                      <span>{u?.nickName || `#${id}`}</span>
                      <span className="text-white/60">×</span>
                    </button>
                  );
                })}

                <div className="ml-auto">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-2 uppercase text-sm text-white/80"
                        disabled={!teamId}
                      >
                        <span>Додати</span>
                        <ChevronDownIcon className="w-5 h-5 shrink-0" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="bg-white text-black border border-gray-200 min-w-60 max-h-70 overflow-y-auto rounded-none"
                      align="end"
                      side="bottom"
                      sideOffset={8}
                    >
                      <DropdownMenuLabel className="uppercase text-xs text-black/60">
                        Пошук юзерів (запрошення)
                      </DropdownMenuLabel>
                      <div
                        className="px-2 pb-2"
                        onKeyDown={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        <input
                          value={inviteQuery}
                          onChange={(e) => {
                            setInviteQuery(e.target.value);
                            setInviteError(null);
                            setInviteSuccess(null);
                          }}
                          placeholder="Введіть позивний (мін. 2)"
                          className="w-full border border-black/20 bg-white px-3 py-2 text-xs uppercase outline-none"
                        />
                        {isInviteSearching ? (
                          <p className="mt-2 uppercase text-[10px] text-black/50">
                            Пошук...
                          </p>
                        ) : null}
                      </div>

                      {inviteResults.length > 0 ? (
                        inviteResults.map((u) => (
                          <DropdownMenuItem
                            key={`invite-${u.id}`}
                            className="uppercase font-medium py-2 px-3 cursor-pointer text-sm hover:bg-gray-100"
                            disabled={invitingUserId === u.id}
                            onClick={() => handleInvite(u.id)}
                          >
                            {u.nickName}
                          </DropdownMenuItem>
                        ))
                      ) : inviteQuery.trim().length >= 2 ? (
                        <div className="px-3 py-2 uppercase text-xs text-black/50">
                          Нічого не знайдено
                        </div>
                      ) : null}

                      <DropdownMenuSeparator className="my-2 bg-black/10" />
                      <DropdownMenuLabel className="uppercase text-xs text-black/60">
                        Додати з учасників команди
                      </DropdownMenuLabel>
                      {participantPickUsers.length > 0 ? (
                        participantPickUsers.map((u) => (
                          <DropdownMenuItem
                            key={`member-${u.id}`}
                            className="uppercase font-medium py-2 px-3 cursor-pointer text-sm hover:bg-gray-100"
                            onClick={() =>
                              setParticipantIds((prev) =>
                                prev.includes(u.id) ? prev : [...prev, u.id],
                              )
                            }
                          >
                            {u.nickName}
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <div className="px-3 py-2 uppercase text-xs text-black/50">
                          Немає доступних
                        </div>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {inviteSuccess ? (
                <p className="mt-3 uppercase text-xs text-[#FA4616] font-semibold">
                  {inviteSuccess}
                </p>
              ) : null}

              {inviteError ? (
                <div className="mt-3">
                  <FieldError
                    errors={[{ message: inviteError }]}
                    className="text-[#FA4616] text-[10px] 375:text-xs min376:text-[10px] 1440:text-base min1441:text-sm font-normal leading-[150%]"
                  />
                </div>
              ) : null}
            </div>

            <div className="flex justify-end pt-6">
              <GeneralButton
                text="ЗБЕРЕГТИ ДАНІ"
                variant="orange-bg"
                className="uppercase"
                onClick={handleSaveTeam}
                disabled={isSaving || editLogoError !== null}
              />
            </div>

            {saveSuccess ? (
              <p className="text-white uppercase text-sm font-medium -mt-2">
                {saveSuccess}
              </p>
            ) : null}

            {saveError ? (
              <FieldError
                errors={[{ message: saveError }]}
                className="text-[#FA4616] text-[10px] 375:text-xs min376:text-[10px] 1440:text-base min1441:text-sm font-normal leading-[150%] -mt-2"
              />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
