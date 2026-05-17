'use client';

import { TeamHeader } from '@/components/MyTeam/TeamHeader';
import { TeamTabs, type TeamTab } from '@/components/MyTeam/TeamTabs';
import { GeneralButton } from '@/components/generics/button/Button';
import { GeneralInput } from '@/components/generics/input/Input';
import { FieldError } from '@/components/ui/field';

import type {
  CreateTeamPayload,
  FieldTitleProps,
  FormTextareaProps,
  MyTeamEmptyStateProps,
  TeamDetailsResponse,
  TeamMember,
} from '@/interfaces';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TeamList from '@/components/MyTeam/TeamList';
import SearchTeam from '@/components/MyTeam/SearchTeam';
import {
  createTeam,
  getTeamDetails,
  leaveTeam,
  uploadTeamLogo,
} from '@/actions/teams';
import BackdropModal from '@/components/generics/banners/BackdropModal';
import WarningIcon from '@/components/icons/WarningIcon';
import { useRouter, useSearchParams } from 'next/navigation';
import { Divide } from 'lucide-react';
import Loader from '@/components/generics/loader/Loader';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '700'],
});

function FieldTitle({ children }: FieldTitleProps) {
  return (
    <p className="text-[15px] font-semibold uppercase text-white mb-3">
      {children}
    </p>
  );
}

function FormTextarea({
  placeholder,
  className,
  value,
  onChange,
}: FormTextareaProps) {
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`w-full border border-white bg-transparent px-5 py-4 rounded-none text-[16px]! font-medium! placeholder:text-white placeholder:text-[16px]! placeholder:font-medium! placeholder:uppercase placeholder:opacity-40 text-white uppercase min-h-30 resize-none focus:outline-none ${className || ''}`}
    />
  );
}

export function MyTeamEmptyState({ onCreated }: MyTeamEmptyStateProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab') as TeamTab;
  const [tab, setTab] = useState<TeamTab>(tabParam ?? 'create');
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const redirectTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof tabParam === 'string' && tab !== tabParam) {
      setTab(tabParam);
    }
  }, [tabParam]);

  const MAX_LOGO_FILE_SIZE = 10 * 1024 * 1024;
  const ALLOWED_LOGO_MIME_TYPES = useMemo(
    () => new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']),
    [],
  );
  const formatFileSize = useCallback((bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    const kb = bytes / 1024;
    return `${Math.max(1, Math.round(kb))} KB`;
  }, []);

  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const modalText =
    'Після підтвердження вступу Ви отримаєте підтвердження на пошту';

  const handleOpenModal = () => {
    setJoinError(null);
    setIsOpenModal(true);
  };

  const handleCloseModal = () => {
    setIsOpenModal(false);
  };

  const canSubmit = useMemo(() => teamName.trim().length > 0, [teamName]);

  const handleSubmit = useCallback(async () => {
    if (logoError) return;

    const name = teamName.trim();
    if (!name) {
      setNameError('Введіть назву команди');
      return;
    }

    if (logoFile) {
      if (!ALLOWED_LOGO_MIME_TYPES.has(logoFile.type)) {
        setLogoError('Непідтримуваний формат. Дозволено: PNG, JPEG, WebP.');
        return;
      }
      if (logoFile.size > MAX_LOGO_FILE_SIZE) {
        setLogoError(
          `Файл завеликий. Максимальний розмір логотипу — 10 MB. Обраний файл — ${formatFileSize(
            logoFile.size,
          )}.`,
        );
        return;
      }
    }

    setNameError(null);
    setSubmitError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      const payload: CreateTeamPayload = {
        name,
        description: teamDescription.trim() || undefined,
      };
      const created = await createTeam(payload);

      const teamId = Number((created as any)?.id);
      if (logoFile && teamId) {
        const form = new FormData();
        form.append('file', logoFile);
        await uploadTeamLogo(teamId, form);
      }

      setSuccessMessage('Команду успішно створено');

      if (redirectTimeoutRef.current) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
      redirectTimeoutRef.current = window.setTimeout(() => {
        onCreated?.();
      }, 1000);
    } catch (e) {
      setSubmitError(
        e instanceof Error ? e.message : 'Помилка при створенні команди',
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    teamName,
    teamDescription,
    onCreated,
    logoFile,
    logoError,
    ALLOWED_LOGO_MIME_TYPES,
    formatFileSize,
  ]);

  useEffect(() => {
    return () => {
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    };
  }, [logoPreviewUrl]);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className=" relative flex flex-col gap-10">
      {isSubmitting && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[1px] z-10">
          <Loader text="Створення команди..." />
        </div>
      )}
      <TeamTabs value={tab} onChange={setTab} />

      {tab === 'create' ? (
        <div className="flex flex-col gap-10">
          <TeamHeader
            logoSrc={logoPreviewUrl || '/team-logo-avatar.png'}
            onLogoPick={(file) => {
              setLogoFile(file);
              const nextUrl = URL.createObjectURL(file);
              setLogoPreviewUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return nextUrl;
              });

              if (!ALLOWED_LOGO_MIME_TYPES.has(file.type)) {
                setLogoError(
                  'Непідтримуваний формат. Дозволено: PNG, JPEG, WebP.',
                );
                return;
              }
              if (file.size > MAX_LOGO_FILE_SIZE) {
                setLogoError(
                  `Файл завеликий. Максимальний розмір логотипу — 10 MB. Обраний файл — ${formatFileSize(
                    file.size,
                  )}.`,
                );
                return;
              }

              setLogoError(null);
            }}
          />

          {logoError ? (
            <FieldError
              errors={[{ message: logoError }]}
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
                value={teamName}
                onChange={(e) => {
                  setTeamName(e.target.value);
                  setNameError(null);
                }}
              />
              {nameError ? (
                <FieldError
                  errors={[{ message: nameError }]}
                  className="text-[#FA4616] text-[10px] 375:text-xs min376:text-[10px] 1440:text-base min1441:text-sm font-normal leading-[150%] mt-2"
                />
              ) : null}
            </div>

            <div>
              <FieldTitle>Опис команди</FieldTitle>
              <FormTextarea
                placeholder="Опишіть вашу команду..."
                value={teamDescription}
                onChange={(e) => {
                  setTeamDescription(e.target.value);
                }}
              />
            </div>

            <div className="flex justify-end pt-6">
              <GeneralButton
                text="Створити команду"
                variant="orange-bg"
                className="w-full min991:w-auto"
                onClick={handleSubmit}
                disabled={
                  !canSubmit ||
                  isSubmitting ||
                  Boolean(logoError) ||
                  Boolean(nameError)
                }
              />
            </div>

            {successMessage ? (
              <p className="text-white uppercase text-sm font-medium min991:-mb-5">
                {successMessage}
              </p>
            ) : (
              <div className="h-5 min991:-mb-5"></div>
            )}

            {submitError ? (
              <FieldError
                errors={[{ message: submitError }]}
                className="text-[#FA4616] text-[10px] 375:text-xs min376:text-[10px] 1440:text-base min1441:text-sm font-normal leading-[150%] -mt-2"
              />
            ) : null}
          </div>
        </div>
      ) : (
        <>
          {isOpenModal ? (
            <BackdropModal icon={WarningIcon} text={modalText}>
              <GeneralButton
                text="ЗРОЗУМІЛО"
                variant="orange-bg"
                onClick={() => {
                  handleCloseModal();
                }}
                className="uppercase w-full max-w-50 min991:max-w-[320px] border-none"
              />
            </BackdropModal>
          ) : (
            <div className="flex flex-col gap-3 min991:gap-6">
              <SearchTeam
                value={searchInput}
                onChange={setSearchInput}
                isDisabled={isSubmitting}
                onSubmit={() => {
                  setJoinError(null);
                  setAppliedSearch(searchInput.trim());
                }}
              />
              <TeamList
                onOpenModal={handleOpenModal}
                searchQuery={appliedSearch}
                onJoinError={setJoinError}
              />

              {joinError ? (
                <FieldError
                  errors={[{ message: joinError }]}
                  className="text-[#FA4616] text-[10px] 375:text-xs min376:text-[10px] 1440:text-base min1441:text-sm font-normal leading-[150%]"
                />
              ) : null}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function MyTeamMemberState({ teamId }: { teamId?: number }) {
  const router = useRouter();
  const [teamData, setTeamData] = useState<TeamDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) {
      setIsLoading(false);
      setTeamData(null);
      setError(null);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getTeamDetails(teamId);
        if (!mounted) return;
        if (data) {
          setTeamData(data);
        } else {
          setError('Помилка при завантаженні команди');
        }
      } catch (e) {
        if (!mounted) return;
        setError(
          e instanceof Error ? e.message : 'Помилка при завантаженні команди',
        );
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [teamId]);

  const members = useMemo<TeamMember[]>(() => {
    const raw = teamData?.members || [];
    if (!Array.isArray(raw)) return [];

    const normalizeRole = (rawRole: unknown): TeamMember['role'] => {
      if (typeof rawRole !== 'string') {
        return null;
      }

      const value = rawRole.trim().toLowerCase();
      if (value === 'owner' || value.includes('owner')) return 'owner';
      if (value === 'assistant' || value.includes('assistant')) {
        return 'assistant';
      }
      if (value === 'staff' || value.includes('staff')) return 'staff';
      if (value === 'member' || value.includes('member')) return 'member';
      return null;
    };

    return raw.map((m) => {
      const stats = m.playerStats ?? m.user?.playerStats;

      return {
        id: m.id,
        role: normalizeRole(m.role),
        nickName: m.user?.nickName || '',
        logoUrl: m.user?.logoUrl,
        games: stats?.gamesPlayed ?? 0,
        points: stats?.totalPoints ?? stats?.points ?? 0,
        rating: stats?.rank ?? 0,
        contribution: Math.round(m.teamContribution || 0),
      };
    });
  }, [teamData?.members]);

  const owner = useMemo(
    () => members.find((member) => member.role === 'owner') || null,
    [members],
  );

  const participants = useMemo(() => {
    if (!owner) {
      return members;
    }

    return members.filter((member) => member.id !== owner.id);
  }, [members, owner]);

  if (isLoading) {
    return (
      <div className="text-center text-gray-400 py-10 text-sm uppercase">
        Завантаження...
      </div>
    );
  }

  if (error) {
    return (
      <FieldError
        errors={[{ message: error }]}
        className="text-[#FA4616] text-[10px] 375:text-xs min376:text-[10px] 1440:text-base min1441:text-sm font-normal leading-[150%]"
      />
    );
  }

  if (!teamData) {
    return (
      <div className="text-white/70 uppercase text-sm">Команду не знайдено</div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {isLeaveModalOpen ? (
        <BackdropModal
          icon={WarningIcon}
          text="Ви впевнені, що хочете покинути команду?"
        >
          <div className="flex flex-col gap-3 w-full">
            <GeneralButton
              text="НІ"
              variant="white-border"
              className="uppercase w-full h-15 min991:h-10"
              onClick={() => {
                setLeaveError(null);
                setIsLeaveModalOpen(false);
              }}
              disabled={isLeaving}
            />
            <GeneralButton
              text={isLeaving ? '...' : 'ТАК'}
              variant="orange-bg"
              className="uppercase w-full border-none"
              onClick={async () => {
                if (!teamId) return;
                setLeaveError(null);
                setIsLeaving(true);
                try {
                  const left = await leaveTeam(teamId);
                  setIsLeaveModalOpen(false);
                  // router.replace тільки якщо команда реально залишена
                  if (left) {
                    router.replace('/profile/team?state=none');
                  }
                } catch (e) {
                  setLeaveError(
                    e instanceof Error
                      ? e.message
                      : 'Помилка при виході з команди',
                  );
                } finally {
                  setIsLeaving(false);
                }
              }}
              disabled={isLeaving}
            />

            {leaveError ? (
              <FieldError
                errors={[{ message: leaveError }]}
                className="text-[#FA4616] text-[10px] 375:text-xs min376:text-[10px] 1440:text-base min1441:text-sm font-normal leading-[150%]"
              />
            ) : null}
          </div>
        </BackdropModal>
      ) : null}

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-4 min991:gap-6 w-full">
          <img
            src={teamData.logoUrl || '/team-logo-avatar.png'}
            alt="team logo"
            className="w-24 h-24 min375:w-32 min375:h-32 min991:w-40 min991:h-40 object-cover shrink-0"
            onError={(e) => {
              e.currentTarget.src = '/team-logo-avatar.png';
            }}
          />

          <div className="flex flex-col gap-2 min-w-0 flex-1">
            <p className="uppercase font-semibold line-clamp-2 break-all leading-tight text-white text-xl min375:text-2xl tracking-wide">
              {teamData.name || ''}
            </p>

            {teamData.description ? (
              <p className="hidden min991:block text-gray-400 text-sm max-w-180">
                {teamData.description}
              </p>
            ) : null}
          </div>

          {teamId ? (
            <div className="hidden min991:block ml-auto">
              <GeneralButton
                text="ПОКИНУТИ КОМАНДУ"
                variant="white-border"
                className="uppercase"
                onClick={() => setIsLeaveModalOpen(true)}
              />
            </div>
          ) : null}
        </div>

        {teamData.description ? (
          <p className="min991:hidden text-[#CCCCCC] text-sm w-full">
            {teamData.description}
          </p>
        ) : null}

        {teamId ? (
          <div className="min991:hidden">
            <GeneralButton
              text="ПОКИНУТИ КОМАНДУ"
              variant="white-border"
              className="uppercase w-full"
              onClick={() => setIsLeaveModalOpen(true)}
            />
          </div>
        ) : null}
      </div>

      <div className="flex flex-col border-t border-[#262626]">
        <table className="hidden min991:table w-full table-fixed border-collapse">
          <colgroup>
            <col style={{ width: '72px' }} />
            <col />
            <col style={{ width: '100px' }} />
            <col style={{ width: '100px' }} />
          </colgroup>
          <thead>
            <tr>
              <th className="border-b border-l border-[#262626] px-4 py-4 text-left text-xs text-[#999999] font-semibold uppercase">
                ФОТО
              </th>
              <th className="border-b border-[#262626] pl-6 pr-4 py-4 text-left text-xs text-[#999999] font-semibold uppercase">
                ПОЗИВНИЙ
              </th>
              <th className="border-b border-[#262626] py-4 text-center text-xs text-[#999999] font-semibold uppercase">
                ІГОР
              </th>
              <th className="border-b border-r border-[#262626] py-4 text-center text-xs text-[#999999] font-semibold uppercase">
                ОЧОК
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-[#FFFFFF]/3">
              <td
                colSpan={4}
                className="border-l border-r border-b border-[#262626] px-4 py-3 text-[#FF4D1C] bg-[#0C0B0B] text-sm font-semibold uppercase"
              >
                Командир
              </td>
            </tr>
            {owner ? (
              <tr>
                <td className="border-b border-l border-[#262626] px-4 py-4 align-middle">
                  <div className="w-10 h-10 rounded-full">
                    <img
                      src={owner.logoUrl || '/team-logo-avatar.png'}
                      alt={`${owner.nickName} Logo`}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </td>
                <td className="border-b border-[#262626] pl-6 pr-4 py-4 align-middle min-w-0">
                  <span className="block min-w-0 truncate text-white font-semibold text-sm">
                    {owner.nickName}
                  </span>
                </td>
                <td className="border-b border-[#262626] py-4 align-middle text-center text-white text-sm">
                  {owner.games}
                </td>
                <td className="border-b border-r border-[#262626] py-4 align-middle text-center text-white text-sm">
                  {owner.points}
                </td>
              </tr>
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="border-l border-r border-b border-[#262626] px-4 py-3 text-[#999999] text-sm uppercase"
                >
                  Немає учасників
                </td>
              </tr>
            )}

            <tr className="bg-[#FFFFFF]/3">
              <td
                colSpan={4}
                className="border-l border-r border-b border-[#262626] px-4 py-3 text-[#FF4D1C] bg-[#0C0B0B] text-sm font-semibold uppercase"
              >
                Учасники
              </td>
            </tr>
            {participants.length > 0 ? (
              participants.map((m, idx) => (
                <tr key={m.id ?? idx}>
                  <td className="border-b border-l border-[#262626] px-4 py-4 align-middle">
                    <div className="w-10 h-10 rounded-full">
                      <img
                        src={m.logoUrl || '/team-logo-avatar.png'}
                        alt={`${m.nickName} Logo`}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                  </td>
                  <td className="border-b border-[#262626] pl-6 pr-4 py-4 align-middle min-w-0">
                    <span className="block min-w-0 truncate text-white font-semibold text-sm">
                      {m.nickName}
                    </span>
                  </td>
                  <td className="border-b border-[#262626] py-4 align-middle text-center text-white text-sm">
                    {m.games}
                  </td>
                  <td className="border-b border-r border-[#262626] py-4 align-middle text-center text-white text-sm">
                    {m.points}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="border-l border-r border-b border-[#262626] px-4 py-3 text-[#999999] text-sm uppercase"
                >
                  Немає учасників
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div
          className={`min991:hidden ${inter.className} flex items-center py-2.5 text-[#FF4D1C] text-xs font-bold border border-[#262626] uppercase`}
        >
          <span className="flex-1 px-3">Командир</span>
        </div>
        {owner ? (
          <div className="min991:hidden flex justify-between items-center py-3.5 px-3 border border-[#262626] last:border-b gap-2.5 mb-2.5 min-w-0">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full">
                <img
                  src={owner.logoUrl || '/team-logo-avatar.png'}
                  alt={`${owner.nickName} Logo`}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <div className="flex flex-col gap-1.5 items-start flex-1 min-w-0 overflow-hidden">
                <p className="font-semibold line-clamp-1 w-full break-all leading-tight">
                  {owner.nickName}
                </p>
                <span className="text-[#808080] text-xs">
                  Ігор: {owner.games}
                </span>
              </div>
            </div>
            <span className="text-[#FF4D1C] text-xs font-semibold whitespace-nowrap uppercase text-right w-30">
              {owner.points} &nbsp;&nbsp; ОЧОК
            </span>
          </div>
        ) : (
          <div className="min991:hidden flex items-center py-2.5 px-3 border-b border-x border-[#262626] text-[#999999] text-xs uppercase">
            <span className="flex-1">Немає учасників</span>
          </div>
        )}

        <div
          className={`min991:hidden ${inter.className} flex items-center py-2.5 text-[#FF4D1C] text-xs font-bold border border-[#262626] uppercase`}
        >
          <span className="flex-1 px-3">Учасники</span>
        </div>
        {participants.length > 0 ? (
          participants.map((m, idx) => (
            <div
              key={m.id ?? idx}
              className="min991:hidden flex justify-between items-center py-3.5 px-3 border border-[#262626] last:border-b gap-2.5 mb-2.5 min-w-0"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full">
                  <img
                    src={m.logoUrl || '/team-logo-avatar.png'}
                    alt={`${m.nickName} Logo`}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <div className="flex flex-col gap-1.5 items-start flex-1 min-w-0 overflow-hidden">
                  <p className="font-semibold line-clamp-1 w-full break-all leading-tight">
                    {m.nickName}
                  </p>
                  <span className="text-[#808080] text-xs">
                    Ігор: {m.games}
                  </span>
                </div>
              </div>
              <span className="text-[#FF4D1C] text-xs font-semibold whitespace-nowrap uppercase text-right w-30">
                {m.points} &nbsp;&nbsp; ОЧОК
              </span>
            </div>
          ))
        ) : (
          <div className="min991:hidden flex items-center py-2.5 px-3 border-b border-x border-[#262626] text-[#999999] text-xs uppercase">
            <span className="flex-1">Немає учасників</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyTeamPageUiRoute() {
  return null;
}
