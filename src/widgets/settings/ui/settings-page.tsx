'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type ClipboardEvent,
} from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  Settings,
  User,
  Trash2,
  Plus,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Upload,
  X,
  MapPin,
} from 'lucide-react';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import Image from 'next/image';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Switch } from '@/shared/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/ui/dialog';
import { userApi, userQueries } from '@/entities/user/api';
import { settingPreferenceApi, settingPreferenceQueries } from '@/entities/setting-preference/api';
import { customerProfileApi, customerProfileQueries } from '@/entities/customer-profile/api';
import { agentProfileApi, agentProfileKeys, agentProfileQueries } from '@/entities/agent-profile/api';
import http from '@/shared/lib/http';
import type { ApiResponse } from '@/shared/types/api';
import { BillingReturnQueryEffects } from '@/widgets/billing/ui/billing-return-query-effects';
import type { UpdateMeData } from '@/entities/user/model/types';
import type { UpdateSettingPreferenceData } from '@/entities/setting-preference/model/types';
import type { CustomerProfile } from '@/entities/customer-profile/model/types';
import { firebaseApp } from '@/shared/config/firebase';
import { cn } from '@/shared/lib/utils';
import {
  FLAT_PROPERTY_TYPES,
  PROPERTY_TYPES,
  parseSpecialtiesToCodes,
  serializeSpecialtyLabels,
} from '@/shared/config/property-types';

interface MediaUploadResponse {
  media_url: string;
  media_type: string;
}

type Tab = 'profile' | 'settings';

function parseWorkingAreaTags(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  const parts = raw.split(/[,;\n\r|]+/).map((s) => s.trim()).filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    const key = p.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

function serializeWorkingAreaTags(tags: string[]): string {
  return tags.join(', ');
}

function mergeWorkingAreaTags(existing: string[], incoming: string[]): string[] {
  const seen = new Set(existing.map((t) => t.toLowerCase()));
  const merged = [...existing];
  for (const t of incoming) {
    const k = t.toLowerCase();
    if (!seen.has(k) && t.trim()) {
      seen.add(k);
      merged.push(t.trim());
    }
  }
  return merged;
}

/** Aligned with backend / domain: whole years, realistic career length. */
const AGENT_MIN_YEARS_EXPERIENCE = 0;
const AGENT_MAX_YEARS_EXPERIENCE = 60;

type AgentYearsExperienceIssue = 'out_of_range' | 'invalid_format' | null;

function getAgentYearsExperienceIssue(raw: string): AgentYearsExperienceIssue {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  if (!/^\d+$/.test(trimmed)) return 'invalid_format';
  const n = Number.parseInt(trimmed, 10);
  if (Number.isNaN(n)) return 'invalid_format';
  if (n < AGENT_MIN_YEARS_EXPERIENCE || n > AGENT_MAX_YEARS_EXPERIENCE) return 'out_of_range';
  return null;
}

export interface SettingsPageProps {
  /** Agent dashboard uses the same flows but hides buyer customer profiles and adds professional fields. */
  variant?: 'default' | 'agentDashboard';
}

export function SettingsPage({ variant = 'default' }: SettingsPageProps) {
  const t = useTranslations('Settings');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAgentDashboard = variant === 'agentDashboard';
  const phoneRecaptchaContainerId = isAgentDashboard
    ? 'agent-dashboard-phone-recaptcha'
    : 'settings-phone-recaptcha';

  const rawTab = searchParams?.get('tab');
  const activeTab: Tab = rawTab === 'settings' ? 'settings' : 'profile';

  const setActiveTab = (tab: Tab) => {
    if (!searchParams) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const [showAddProfile, setShowAddProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [changePasswordForm, setChangePasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Avatar upload
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [pendingRemoveAvatar, setPendingRemoveAvatar] = useState(false);

  // Email OTP
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Phone change
  const [isChangingPhone, setIsChangingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [isPhoneOtpSent, setIsPhoneOtpSent] = useState(false);
  const [phoneOtpCountdown, setPhoneOtpCountdown] = useState(0);
  const phoneCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);

  const queryClient = useQueryClient();

  const { data: session } = useSession();
  const isAuthenticated = !!(session as any)?.user?.accessToken;
  const auth = getAuth(firebaseApp);

  // Data queries
  const { data: meResponse, isLoading: meLoading } = useQuery({ ...userQueries.me(), enabled: isAuthenticated });
  const { data: settingsResponse, isLoading: settingsLoading } = useQuery({ ...settingPreferenceQueries.me(), enabled: isAuthenticated });
  const { data: profilesResponse, isLoading: profilesLoading } = useQuery({
    ...customerProfileQueries.me(),
    enabled: isAuthenticated && !isAgentDashboard,
  });
  const { data: agentProfileResponse, isLoading: agentProfileLoading } = useQuery({
    ...agentProfileQueries.me(),
    enabled: isAuthenticated && isAgentDashboard,
  });

  const me = meResponse?.payload?.data;
  const settings = settingsResponse?.payload?.data;
  const profiles = profilesResponse?.payload?.data ?? [];
  const agentProfile = agentProfileResponse?.payload?.data;

  // Form state for My Account
  const [profileForm, setProfileForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    businessName: '',
    phone: '',
  });

  // Form state for Settings
  const [notifForm, setNotifForm] = useState({
    inAppEnabled: true,
    emailEnabled: true,
    pushEnabled: true,
    contactViaEmail: true,
    contactViaPhone: false,
    hidePhoneNumber: true,
    hideEmail: true,
  });

  const [agentProfessionalForm, setAgentProfessionalForm] = useState({
    bio: '',
    years_of_experience: '',
  });
  const [agentSpecialtyCodes, setAgentSpecialtyCodes] = useState<string[]>([]);
  const [agentWorkingAreaTags, setAgentWorkingAreaTags] = useState<string[]>([]);
  const [workingAreaInput, setWorkingAreaInput] = useState('');
  const workingAreaInputRef = useRef<HTMLInputElement>(null);

  // Hydrate form from API data
  useEffect(() => {
    if (me) {
      setProfileForm({
        email: me.email ?? '',
        firstName: me.first_name ?? '',
        lastName: me.last_name ?? '',
        businessName: me.business_name ?? '',
        phone: me.phone ?? '',
      });
    }
  }, [me]);

  useEffect(() => {
    if (settings) {
      setNotifForm({
        inAppEnabled: settings.in_app_enabled,
        emailEnabled: settings.email_enabled,
        pushEnabled: settings.push_enabled,
        contactViaEmail: settings.contact_via_email,
        contactViaPhone: settings.contact_via_phone,
        hidePhoneNumber: settings.hide_phone_number,
        hideEmail: settings.hide_email,
      });
    }
  }, [settings]);

  useEffect(() => {
    if (!agentProfile) return;
    setAgentProfessionalForm({
      bio: agentProfile.bio ?? '',
      years_of_experience:
        agentProfile.years_of_experience != null ? String(agentProfile.years_of_experience) : '',
    });
    if (isAgentDashboard) {
      setAgentSpecialtyCodes(parseSpecialtiesToCodes(agentProfile.specialties));
      setAgentWorkingAreaTags(parseWorkingAreaTags(agentProfile.service_areas));
      setWorkingAreaInput('');
    }
  }, [agentProfile, isAgentDashboard]);

  const orderedSelectedSpecialties = useMemo(() => {
    const selected = new Set(agentSpecialtyCodes);
    return FLAT_PROPERTY_TYPES.filter((t) => selected.has(t.code));
  }, [agentSpecialtyCodes]);

  const yearsExperienceIssue = useMemo(
    () => getAgentYearsExperienceIssue(agentProfessionalForm.years_of_experience),
    [agentProfessionalForm.years_of_experience]
  );

  const toggleAgentSpecialty = useCallback((code: string) => {
    setAgentSpecialtyCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }, []);

  const addWorkingAreaTag = useCallback(() => {
    const next = workingAreaInput.trim();
    if (!next) return;
    setAgentWorkingAreaTags((prev) => {
      if (prev.some((t) => t.toLowerCase() === next.toLowerCase())) return prev;
      return [...prev, next];
    });
    setWorkingAreaInput('');
    queueMicrotask(() => workingAreaInputRef.current?.focus());
  }, [workingAreaInput]);

  const removeWorkingAreaTag = useCallback((tag: string) => {
    setAgentWorkingAreaTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  const onWorkingAreaPaste = useCallback((e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    if (!/[,;\n\r|]/.test(text)) return;
    e.preventDefault();
    const parsed = parseWorkingAreaTags(text);
    if (parsed.length === 0) return;
    setAgentWorkingAreaTags((prev) => mergeWorkingAreaTags(prev, parsed));
    setWorkingAreaInput('');
    queueMicrotask(() => workingAreaInputRef.current?.focus());
  }, []);

  useEffect(() => {
    if (isEditingProfile) return;
    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    setAvatarPreviewUrl(null);
    setSelectedAvatarFile(null);
    setPendingRemoveAvatar(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditingProfile]);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (phoneCountdownRef.current) clearInterval(phoneCountdownRef.current);
      if (recaptchaVerifier.current) {
        recaptchaVerifier.current.clear();
        recaptchaVerifier.current = null;
      }
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);

  // Mutations
  const updateMeMutation = useMutation({
    mutationFn: (data: UpdateMeData) => userApi.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueries.me().queryKey });
      queryClient.invalidateQueries({ queryKey: userQueries.current().queryKey });
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
      setAvatarPreviewUrl(null);
      setSelectedAvatarFile(null);
      setPendingRemoveAvatar(false);
      setIsEditingProfile(false);
      toast.success(t('toast.profileUpdated'));
    },
    onError: () => toast.error(t('toast.profileUpdateFailed')),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: UpdateSettingPreferenceData) => settingPreferenceApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingPreferenceQueries.me().queryKey });
      toast.success(t('toast.settingsSaved'));
    },
    onError: () => toast.error(t('toast.settingsFailed')),
  });

  const createProfileMutation = useMutation({
    mutationFn: (profileName: string) => customerProfileApi.create({ profile_name: profileName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerProfileQueries.me().queryKey });
      setShowAddProfile(false);
      setNewProfileName('');
      toast.success(t('toast.profileCreated'));
    },
    onError: () => toast.error(t('toast.profileCreateFailed')),
  });

  const updateAgentProfileMutation = useMutation({
    mutationFn: () => {
      const payload: {
        bio: string;
        specialties: string;
        service_areas: string;
        years_of_experience?: number;
      } = {
        bio: agentProfessionalForm.bio,
        specialties: serializeSpecialtyLabels(agentSpecialtyCodes),
        service_areas: serializeWorkingAreaTags(agentWorkingAreaTags),
      };
      const y = agentProfessionalForm.years_of_experience.trim();
      if (y !== '') {
        const n = parseInt(y, 10);
        if (!Number.isNaN(n)) {
          payload.years_of_experience = n;
        }
      }
      return agentProfileApi.updateMine(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentProfileKeys.me() });
      toast.success(t('toast.agentProfileUpdated'));
    },
    onError: () => toast.error(t('toast.agentProfileUpdateFailed')),
  });

  const saveAgentProfessionalProfile = useCallback(() => {
    const issue = getAgentYearsExperienceIssue(agentProfessionalForm.years_of_experience);
    const rangeT = {
      min: AGENT_MIN_YEARS_EXPERIENCE,
      max: AGENT_MAX_YEARS_EXPERIENCE,
    };
    if (issue === 'out_of_range') {
      toast.error(t('agentProfessional.yearsExperienceErrorOutOfRange', rangeT));
      return;
    }
    if (issue === 'invalid_format') {
      toast.error(t('agentProfessional.yearsExperienceErrorInvalid'));
      return;
    }
    updateAgentProfileMutation.mutate();
  }, [agentProfessionalForm.years_of_experience, t, updateAgentProfileMutation]);

  const deleteProfileMutation = useMutation({
    mutationFn: (profileId: string) => customerProfileApi.delete(profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerProfileQueries.me().queryKey });
      toast.success(t('toast.profileDeleted'));
    },
    onError: () => toast.error(t('toast.profileDeleteFailed')),
  });

  const switchProfileMutation = useMutation({
    mutationFn: (profileId: string) => customerProfileApi.switchActive(profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerProfileQueries.me().queryKey });
      toast.success(t('toast.profileSwitched'));
    },
    onError: () => toast.error(t('toast.profileSwitchFailed')),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: { current_password: string; new_password: string }) =>
      userApi.changePassword(me!.user_id, data),
    onSuccess: () => {
      setIsChangingPassword(false);
      setChangePasswordForm({ current: '', next: '', confirm: '' });
      toast.success(t('toast.passwordChanged'));
    },
    onError: () => toast.error(t('toast.passwordChangeFailed')),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => userApi.deleteAccount(me!.user_id),
    onSuccess: () => {
      toast.success(t('toast.accountDeleted'));
      signOut({ callbackUrl: '/' });
    },
    onError: () => toast.error(t('toast.accountDeleteFailed')),
  });

  // Countdown timer for OTP resend
  const startCountdown = useCallback((seconds: number) => {
    setOtpCountdown(seconds);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setOtpCountdown((s) => {
        if (s <= 1) {
          clearInterval(countdownRef.current!);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  const uploadAvatarToStorage = async (file: File) => {
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await http.post<ApiResponse<MediaUploadResponse>>(
        '/media/upload?folder=avatars',
        formData
      );
      const avatarUrl = res.payload.data?.media_url;
      if (!avatarUrl) throw new Error('No URL returned');
      return avatarUrl;
    } catch {
      throw new Error('Avatar upload failed');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarSelect = (file: File) => {
    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    setSelectedAvatarFile(file);
    setPendingRemoveAvatar(false);
    setAvatarPreviewUrl(URL.createObjectURL(file));
  };

  const handleAvatarRemove = () => {
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
      setAvatarPreviewUrl(null);
    }
    setSelectedAvatarFile(null);
    setPendingRemoveAvatar(true);
  };

  // Send email OTP mutation
  const sendEmailOtpMutation = useMutation({
    mutationFn: async () => {
      const trimmedEmail = newEmail.trim();
      if (!trimmedEmail) throw new Error('Email is required');
      return userApi.sendEmailOtp(trimmedEmail);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: userQueries.me().queryKey });
      queryClient.invalidateQueries({ queryKey: userQueries.current().queryKey });
      const seconds = res.payload.data?.expirySeconds ?? 300;
      startCountdown(seconds);
      toast.success(t('myAccount.otpSent'));
    },
    onError: (err: unknown) => {
      const httpErr = err as { payload?: { message?: string } };
      const msg = httpErr?.payload?.message;
      toast.error(msg || t('toast.profileUpdateFailed'));
    },
  });

  // Verify email OTP mutation
  const verifyEmailMutation = useMutation({
    mutationFn: (otp: string) => userApi.verifyEmail(otp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueries.me().queryKey });
      queryClient.invalidateQueries({ queryKey: userQueries.current().queryKey });
      setIsVerifyingEmail(false);
      setNewEmail('');
      setEmailOtp('');
      toast.success(t('toast.emailVerified') ?? 'Email đã được xác minh!');
    },
    onError: () => toast.error(t('toast.otpInvalid') ?? 'Mã OTP không hợp lệ'),
  });

  const verifyPhoneMutation = useMutation({
    mutationFn: (phone: string) => userApi.verifyPhone(phone),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueries.me().queryKey });
      queryClient.invalidateQueries({ queryKey: userQueries.current().queryKey });
      setIsChangingPhone(false);
      setNewPhone('');
      setPhoneOtp('');
      setIsPhoneOtpSent(false);
      setPhoneOtpCountdown(0);
      toast.success(t('toast.phoneVerified'));
    },
    onError: (err: unknown) => {
      const httpErr = err as { payload?: { message?: string } };
      const msg = httpErr?.payload?.message;
      toast.error(msg || t('toast.profileUpdateFailed'));
    },
  });

  // Clear stale RecaptchaVerifier when phone section is closed
  useEffect(() => {
    if (!isChangingPhone) {
      if (recaptchaVerifier.current) {
        try { recaptchaVerifier.current.clear(); } catch {}
        recaptchaVerifier.current = null;
      }
      confirmationResultRef.current = null;
    }
  }, [isChangingPhone]);

  const initRecaptcha = useCallback(() => {
    // Reuse existing verifier if available — same pattern as agent-verification-modal
    if (recaptchaVerifier.current) return recaptchaVerifier.current;
    const container = document.getElementById(phoneRecaptchaContainerId);
    if (!container) {
      console.error('[Settings] Recaptcha container not found in DOM');
      return null;
    }
    try {
      const verifier = new RecaptchaVerifier(auth, container, {
        size: 'invisible',
        callback: () => {
          console.log('[Settings] Recaptcha solved');
        },
        'expired-callback': () => {
          console.warn('[Settings] Recaptcha expired');
          if (recaptchaVerifier.current) {
            try { recaptchaVerifier.current.clear(); } catch {}
            recaptchaVerifier.current = null;
          }
          setIsPhoneOtpSent(false);
        },
      });
      recaptchaVerifier.current = verifier;
      return verifier;
    } catch (err) {
      console.error('[Settings] Failed to initialize Recaptcha:', err);
      return null;
    }
  }, [auth, phoneRecaptchaContainerId]);

  const startPhoneCountdown = useCallback((seconds: number) => {
    setPhoneOtpCountdown(seconds);
    if (phoneCountdownRef.current) clearInterval(phoneCountdownRef.current);
    phoneCountdownRef.current = setInterval(() => {
      setPhoneOtpCountdown((s) => {
        if (s <= 1) {
          clearInterval(phoneCountdownRef.current!);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  const handleSendPhoneOtp = useCallback(async () => {
    if (!newPhone.trim()) return;
    if (phoneOtpCountdown > 0) return;

    const verifier = initRecaptcha();
    if (!verifier) {
      toast.error(t('myAccount.recaptchaError') ?? 'Không thể khởi tạo reCAPTCHA. Vui lòng thử lại.');
      return;
    }

    try {
      const result = await signInWithPhoneNumber(auth, newPhone.trim(), verifier);
      confirmationResultRef.current = result;
      // @ts-expect-error – window fallback (same pattern as agent-verification-modal)
      window.phoneConfirmationResult = result;
      setIsPhoneOtpSent(true);
      startPhoneCountdown(60);
      toast.success(t('myAccount.phoneOtpSent') ?? 'Mã OTP đã được gửi đến số điện thoại của bạn!');
    } catch (err: unknown) {
      console.error('[Settings] Firebase phone auth error:', err);
      // Clear spent verifier so next attempt gets a fresh one
      if (recaptchaVerifier.current) {
        try { recaptchaVerifier.current.clear(); } catch {}
        recaptchaVerifier.current = null;
      }

      const errObj = err as { code?: string; message?: string };
      const errorStr = JSON.stringify(err);
      let errorMsg = t('toast.profileUpdateFailed');

      if (
        errorStr.includes('TOO_MANY_ATTEMPTS_TRY_LATER') ||
        errObj.code === 'auth/too-many-requests' ||
        (errObj.message ?? '').includes('TOO_MANY_ATTEMPTS_TRY_LATER')
      ) {
        errorMsg = t('myAccount.tooManyOtpAttempts') ?? 'Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.';
      } else if (errObj.code === 'auth/invalid-phone-number') {
        errorMsg = t('myAccount.invalidPhoneNumber') ?? 'Số điện thoại không hợp lệ. Vui lòng dùng định dạng +84xxxxxxxxx.';
      } else if (
        errObj.code === 'auth/captcha-check-failed' ||
        errObj.code === 'auth/invalid-app-credential'
      ) {
        errorMsg = t('myAccount.recaptchaError') ?? 'Xác minh reCAPTCHA thất bại. Vui lòng thử lại.';
      }

      toast.error(errorMsg);
    }
  }, [auth, initRecaptcha, newPhone, phoneOtpCountdown, startPhoneCountdown, t]);

  const handleVerifyPhoneOtp = useCallback(async () => {
    if (phoneOtp.length !== 6) return;
    const confirmation = confirmationResultRef.current
      // @ts-expect-error – fallback to window (same pattern as agent-verification-modal)
      ?? (window.phoneConfirmationResult as ConfirmationResult | undefined);
    if (!confirmation) {
      toast.error(t('myAccount.otpExpired') ?? 'Phiên OTP đã hết hạn. Vui lòng gửi lại mã.');
      return;
    }
    try {
      await confirmation.confirm(phoneOtp);
      verifyPhoneMutation.mutate(newPhone.trim());
      setProfileForm((f) => ({ ...f, phone: newPhone.trim() }));
    } catch {
      toast.error(t('toast.otpInvalid') ?? 'Mã OTP không hợp lệ');
    }
  }, [newPhone, phoneOtp, t, verifyPhoneMutation]);

  const handleSaveProfile = async () => {
    const payload: UpdateMeData = {
      first_name: profileForm.firstName,
      last_name: profileForm.lastName,
      business_name: profileForm.businessName,
      email: profileForm.email,
    };

    try {
      if (selectedAvatarFile) {
        const avatarUrl = await uploadAvatarToStorage(selectedAvatarFile);
        payload.avatar_url = avatarUrl;
      } else if (pendingRemoveAvatar) {
        payload.avatar_url = '';
      }
      updateMeMutation.mutate(payload);
    } catch {
      toast.error(t('toast.profileUpdateFailed'));
    }
  };

  const handleToggleSetting = (key: keyof typeof notifForm, checked: boolean) => {
    const updated = { ...notifForm, [key]: checked };
    setNotifForm(updated);
    updateSettingsMutation.mutate({
      in_app_enabled: updated.inAppEnabled,
      email_enabled: updated.emailEnabled,
      push_enabled: updated.pushEnabled,
      contact_via_email: updated.contactViaEmail,
      contact_via_phone: updated.contactViaPhone,
      hide_phone_number: updated.hidePhoneNumber,
      hide_email: updated.hideEmail,
    });
  };

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: 'profile', label: t('tabs.profile'), icon: User },
    { id: 'settings', label: t('tabs.settings'), icon: Settings },
  ];

  return (
    <div className='relative min-h-screen bg-grey-100'>
      <BillingReturnQueryEffects />
      {/* Left sidebar */}
      <aside className='absolute left-0 top-0 w-[200px] bg-transparent py-8 z-10'>
        <nav className='flex flex-col gap-1 pl-4'>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type='button'
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-r-lg text-sm font-medium transition-colors text-left w-full ${
                activeTab === tab.id
                  ? 'bg-purple-98 text-main-primary border-l-4 border-main-primary'
                  : 'text-grey-600 hover:bg-grey-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main: starts after sidebar (~200px) */}
      <main className='flex min-h-screen justify-center py-8 pl-[200px] pr-4 sm:pr-6 lg:pr-8'>
        <div className='w-full max-w-[700px] px-8'>
        {activeTab === 'profile' && (
          <div className='space-y-6'>
            {isAgentDashboard && (
              <section className='bg-white rounded-xl border border-border p-6'>
                <h2 className='text-base font-semibold text-main-black mb-1'>{t('agentProfessional.title')}</h2>
                <p className='text-sm text-grey-500 mb-4'>{t('agentProfessional.description')}</p>
                {agentProfileLoading ? (
                  <div className='text-sm text-grey-400'>{t('agentProfessional.loading')}</div>
                ) : (
                  <div className='space-y-4'>
                    <div className='flex flex-wrap gap-6 text-sm'>
                      <div>
                        <span className='text-grey-500'>{t('agentProfessional.statsRating')}: </span>
                        <span className='font-medium text-main-black'>
                          {agentProfile?.rating != null && agentProfile.rating !== ''
                            ? String(agentProfile.rating)
                            : '—'}
                        </span>
                      </div>
                      <div>
                        <span className='text-grey-500'>{t('agentProfessional.statsSold')}: </span>
                        <span className='font-medium text-main-black'>
                          {agentProfile?.properties_sold != null ? agentProfile.properties_sold : '—'}
                        </span>
                      </div>
                    </div>
                    <div className='space-y-2'>
                      <Label className='text-sm text-grey-500'>{t('agentProfessional.bio')}</Label>
                      <Textarea
                        value={agentProfessionalForm.bio}
                        onChange={(e) =>
                          setAgentProfessionalForm((f) => ({ ...f, bio: e.target.value }))
                        }
                        placeholder={t('agentProfessional.bioPlaceholder')}
                        rows={4}
                        className='resize-y min-h-[100px]'
                      />
                    </div>
                    <div className='space-y-3'>
                      <div>
                        <Label className='text-sm text-grey-500'>{t('agentProfessional.specialties')}</Label>
                        <p className='text-xs text-grey-400 mt-1 leading-relaxed'>
                          {t('agentProfessional.specialtiesHint')}
                        </p>
                      </div>
                      <div
                        className={cn(
                          'min-h-[52px] rounded-xl border border-dashed border-border bg-purple-98/30 px-3 py-2.5',
                          orderedSelectedSpecialties.length === 0 && 'flex items-center'
                        )}
                      >
                        {orderedSelectedSpecialties.length === 0 ? (
                          <span className='text-sm text-grey-400'>{t('agentProfessional.specialtiesEmpty')}</span>
                        ) : (
                          <div className='flex flex-wrap gap-2'>
                            {orderedSelectedSpecialties.map((item) => (
                              <span
                                key={item.code}
                                className='group inline-flex items-center gap-1 rounded-full border border-main-primary/25 bg-white pl-3 pr-1 py-1 text-sm font-medium text-main-primary shadow-sm ring-1 ring-purple-92/40'
                              >
                                <span className='max-w-[200px] truncate'>{item.label}</span>
                                <button
                                  type='button'
                                  onClick={() => toggleAgentSpecialty(item.code)}
                                  className='flex size-7 shrink-0 items-center justify-center rounded-full text-grey-400 transition-colors hover:bg-purple-98 hover:text-main-primary'
                                  aria-label={t('agentProfessional.specialtiesRemoveAria', { label: item.label })}
                                >
                                  <X className='size-3.5' strokeWidth={2.5} />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className='space-y-4'>
                        {PROPERTY_TYPES.map((category) => (
                          <div
                            key={category.code}
                            className='rounded-xl border border-border/80 bg-gradient-to-br from-white to-purple-98/40 p-4 shadow-sm shadow-purple-92/10'
                          >
                            <p className='mb-3 text-[11px] font-bold uppercase tracking-wider text-main-primary/80'>
                              {category.label}
                            </p>
                            <div className='flex flex-wrap gap-2'>
                              {category.types.map((type) => {
                                const isOn = agentSpecialtyCodes.includes(type.code);
                                return (
                                  <button
                                    key={type.code}
                                    type='button'
                                    onClick={() => toggleAgentSpecialty(type.code)}
                                    className={cn(
                                      'rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200',
                                      isOn
                                        ? 'bg-main-primary text-white shadow-md shadow-main-primary/25 ring-2 ring-main-primary/20'
                                        : 'border border-border bg-white text-grey-600 hover:border-main-primary/35 hover:bg-purple-98/80 hover:text-main-black'
                                    )}
                                  >
                                    {type.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className='space-y-3'>
                      <div className='flex items-start gap-3'>
                        <div className='mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-purple-98 text-main-primary ring-1 ring-purple-92/50'>
                          <MapPin className='size-4' strokeWidth={2} />
                        </div>
                        <div className='min-w-0 flex-1'>
                          <Label className='text-sm font-medium text-main-black'>
                            {t('agentProfessional.workingArea')}
                          </Label>
                          <p className='text-xs text-grey-400 mt-1 leading-relaxed'>
                            {t('agentProfessional.workingAreaHint')}
                          </p>
                        </div>
                      </div>
                      <div className='overflow-hidden rounded-xl border border-border/90 bg-gradient-to-b from-white to-purple-98/25 shadow-sm shadow-purple-92/10'>
                        <div
                          className={cn(
                            'min-h-[56px] px-3 py-2.5',
                            agentWorkingAreaTags.length === 0 && 'flex items-center'
                          )}
                        >
                          {agentWorkingAreaTags.length === 0 ? (
                            <p className='text-sm text-grey-400 pl-1'>{t('agentProfessional.workingAreaEmpty')}</p>
                          ) : (
                            <ul className='flex flex-wrap gap-2' aria-label={t('agentProfessional.workingArea')}>
                              {agentWorkingAreaTags.map((tag) => (
                                <li key={tag}>
                                  <span className='inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-white py-1 pl-2.5 pr-1 text-sm text-main-black shadow-sm ring-1 ring-purple-92/30'>
                                    <MapPin
                                      className='size-3 shrink-0 text-main-primary/70'
                                      aria-hidden
                                      strokeWidth={2.5}
                                    />
                                    <span className='max-w-[220px] truncate' title={tag}>
                                      {tag}
                                    </span>
                                    <button
                                      type='button'
                                      onClick={() => removeWorkingAreaTag(tag)}
                                      className='flex size-7 shrink-0 items-center justify-center rounded-full text-grey-400 transition-colors hover:bg-red-50 hover:text-red-600'
                                      aria-label={t('agentProfessional.workingAreaRemoveAria', { label: tag })}
                                    >
                                      <X className='size-3.5' strokeWidth={2.5} />
                                    </button>
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div className='flex flex-col gap-2 border-t border-border/80 bg-grey-50/80 p-3 sm:flex-row sm:items-center'>
                          <Input
                            ref={workingAreaInputRef}
                            value={workingAreaInput}
                            onChange={(e) => setWorkingAreaInput(e.target.value)}
                            onPaste={onWorkingAreaPaste}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addWorkingAreaTag();
                              }
                            }}
                            placeholder={t('agentProfessional.workingAreaInputPlaceholder')}
                            className='h-10 flex-1 border-border bg-white'
                            autoComplete='off'
                          />
                          <Button
                            type='button'
                            variant='outline'
                            onClick={addWorkingAreaTag}
                            disabled={!workingAreaInput.trim()}
                            className='h-10 shrink-0 border-main-primary/30 text-main-primary hover:bg-purple-98 hover:text-main-primary sm:min-w-[88px]'
                          >
                            {t('agentProfessional.workingAreaAdd')}
                          </Button>
                        </div>
                      </div>
                      <p className='text-[11px] text-grey-400 leading-relaxed'>
                        {t('agentProfessional.workingAreaPasteHint')}
                      </p>
                    </div>
                    <div className='space-y-2 max-w-xs'>
                      <Label className='text-sm text-grey-500' htmlFor='agent-years-experience'>
                        {t('agentProfessional.yearsExperience')}
                      </Label>
                      <p className='text-xs text-grey-400 leading-relaxed'>
                        {t('agentProfessional.yearsExperienceHint', {
                          min: AGENT_MIN_YEARS_EXPERIENCE,
                          max: AGENT_MAX_YEARS_EXPERIENCE,
                        })}
                      </p>
                      <Input
                        id='agent-years-experience'
                        type='text'
                        inputMode='numeric'
                        autoComplete='off'
                        aria-invalid={yearsExperienceIssue != null}
                        value={agentProfessionalForm.years_of_experience}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, '').slice(0, 2);
                          setAgentProfessionalForm((f) => ({ ...f, years_of_experience: v }));
                        }}
                        placeholder={t('agentProfessional.yearsPlaceholder')}
                        className={yearsExperienceIssue ? 'border-red-400 focus-visible:ring-red-200' : undefined}
                      />
                      {yearsExperienceIssue === 'out_of_range' && (
                        <p className='text-xs text-red-600' role='alert'>
                          {t('agentProfessional.yearsExperienceErrorOutOfRange', {
                            min: AGENT_MIN_YEARS_EXPERIENCE,
                            max: AGENT_MAX_YEARS_EXPERIENCE,
                          })}
                        </p>
                      )}
                      {yearsExperienceIssue === 'invalid_format' && (
                        <p className='text-xs text-red-600' role='alert'>
                          {t('agentProfessional.yearsExperienceErrorInvalid')}
                        </p>
                      )}
                    </div>
                    <div className='flex justify-end pt-2'>
                      <Button
                        type='button'
                        onClick={saveAgentProfessionalProfile}
                        disabled={updateAgentProfileMutation.isPending || yearsExperienceIssue != null}
                        className='bg-main-primary text-white hover:bg-main-primary/90'
                      >
                        {updateAgentProfileMutation.isPending
                          ? t('agentProfessional.savingProfessional')
                          : t('agentProfessional.saveProfessional')}
                      </Button>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Profile Management (buyer / multi-profile) — hidden on agent dashboard */}
            {!isAgentDashboard && (
            <section className='bg-white rounded-xl border border-border p-6'>
              <div className='flex items-center justify-between mb-2'>
                <h2 className='text-base font-semibold text-main-black'>{t('profileManagement.title')}</h2>
                {!showAddProfile && (
                  <Button
                    size='sm'
                    onClick={() => setShowAddProfile(true)}
                    className='bg-main-primary text-white hover:bg-main-primary/90 h-8 px-3 text-xs'
                  >
                    {t('profileManagement.addButton')}
                  </Button>
                )}
              </div>
              <p className='text-sm text-grey-500 mb-4'>
                {t('profileManagement.description')}
              </p>

              {profilesLoading ? (
                <div className='text-sm text-grey-400'>{t('profileManagement.loading')}</div>
              ) : (
                <div className='space-y-2'>
                  {profiles.map((profile: CustomerProfile) => (
                    <div
                      key={profile.customer_profile_id}
                      className='flex items-center justify-between py-3 border-b border-border last:border-0'
                    >
                      <div className='flex items-center gap-3'>
                        <div className='flex size-8 items-center justify-center rounded-full bg-grey-100 text-grey-500'>
                          <User className='h-4 w-4' />
                        </div>
                        <div className='flex items-center gap-2'>
                          <span className='text-sm font-medium text-main-black'>
                            {profile.profile_name?.trim() || t('profileManagement.defaultName')}
                          </span>
                          {profile.is_active && (
                            <span className='text-xs text-main-primary font-medium bg-purple-98 px-2 py-0.5 rounded-full'>
                              {t('profileManagement.activeBadge')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className='flex items-center gap-2'>
                        {!profile.is_active && (
                          <>
                            <button
                              type='button'
                              onClick={() => switchProfileMutation.mutate(profile.customer_profile_id)}
                              disabled={switchProfileMutation.isPending}
                              className='text-grey-400 hover:text-main-primary transition-colors disabled:opacity-50'
                              aria-label={t('profileManagement.switchButton')}
                            >
                              <RefreshCw className='h-4 w-4' />
                            </button>
                            <button
                              type='button'
                              onClick={() => deleteProfileMutation.mutate(profile.customer_profile_id)}
                              disabled={deleteProfileMutation.isPending}
                              className='text-grey-400 hover:text-red-500 transition-colors'
                              aria-label='Delete profile'
                            >
                              <Trash2 className='h-4 w-4' />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showAddProfile && (
                <div className='mt-4 flex items-center gap-2'>
                  <Input
                    placeholder={t('profileManagement.namePlaceholder')}
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newProfileName.trim()) {
                        createProfileMutation.mutate(newProfileName.trim());
                      }
                    }}
                    className='flex-1'
                    autoFocus
                  />
                  <Button
                    size='sm'
                    onClick={() => createProfileMutation.mutate(newProfileName.trim())}
                    disabled={!newProfileName.trim() || createProfileMutation.isPending}
                  >
                    <Plus className='h-4 w-4' />
                    {t('profileManagement.addConfirm')}
                  </Button>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => { setShowAddProfile(false); setNewProfileName(''); }}
                  >
                    {t('profileManagement.cancel')}
                  </Button>
                </div>
              )}
            </section>
            )}

            {/* My Account */}
            <section className='bg-white rounded-xl border border-border p-6'>
              <div className='flex items-center justify-between mb-6'>
                <h2 className='text-base font-semibold text-main-black'>{t('myAccount.title')}</h2>
                {!isEditingProfile && (
                  <Button
                    size='sm'
                    className='bg-main-primary text-white hover:bg-main-primary/90 h-8 px-3 text-xs'
                    onClick={() => setIsEditingProfile(true)}
                  >
                    {t('myAccount.updateButton')}
                  </Button>
                )}
              </div>

              {meLoading ? (
                <div className='text-sm text-grey-400'>{t('myAccount.loading')}</div>
              ) : (
                <div className='space-y-5'>
                  {/* Avatar */}
                  <div className='flex items-start gap-6'>
                    <div className='flex flex-col gap-2'>
                      <Label className='text-sm text-grey-500'>{t('myAccount.avatar')}</Label>
                      <div className='flex size-[72px] items-center justify-center rounded-full bg-grey-100 overflow-hidden'>
                        {(avatarPreviewUrl || (!pendingRemoveAvatar && me?.avatar_url)) ? (
                          <Image
                            src={avatarPreviewUrl || me?.avatar_url || ''}
                            alt='avatar'
                            width={72}
                            height={72}
                            className='size-full rounded-full object-cover'
                          />
                        ) : (
                          <User className='h-8 w-8 text-grey-400' />
                        )}
                      </div>
                      <input
                        ref={avatarInputRef}
                        type='file'
                        accept='image/*'
                        className='hidden'
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleAvatarSelect(file);
                          e.target.value = '';
                        }}
                      />
                      {isEditingProfile && (
                        <div className='flex gap-2'>
                          <Button
                            variant='default'
                            size='sm'
                            disabled={isUploadingAvatar}
                            onClick={() => avatarInputRef.current?.click()}
                            className='bg-main-primary text-white hover:bg-main-primary/90'
                          >
                            <Upload className='h-3 w-3 mr-1' />
                            {isUploadingAvatar ? t('myAccount.uploading') : t('myAccount.upload')}
                          </Button>
                          {(avatarPreviewUrl || me?.avatar_url) && (
                            <Button variant='outline' size='sm' onClick={handleAvatarRemove}>
                              {t('myAccount.remove')}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className='flex-1 space-y-4'>
                      <div className='grid grid-cols-2 gap-4'>
                        <div className='space-y-2'>
                          <Label htmlFor='firstName' className='text-sm text-grey-500'>
                            {t('myAccount.firstName')}
                          </Label>
                          <Input
                            id='firstName'
                            value={profileForm.firstName}
                            onChange={(e) => setProfileForm((p) => ({ ...p, firstName: e.target.value }))}
                            placeholder={t('myAccount.firstNamePlaceholder')}
                            readOnly={!isEditingProfile}
                            className={!isEditingProfile ? 'bg-grey-50' : ''}
                          />
                        </div>
                        <div className='space-y-2'>
                          <Label htmlFor='lastName' className='text-sm text-grey-500'>
                            {t('myAccount.lastName')}
                          </Label>
                          <Input
                            id='lastName'
                            value={profileForm.lastName}
                            onChange={(e) => setProfileForm((p) => ({ ...p, lastName: e.target.value }))}
                            placeholder={t('myAccount.lastNamePlaceholder')}
                            readOnly={!isEditingProfile}
                            className={!isEditingProfile ? 'bg-grey-50' : ''}
                          />
                        </div>
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='businessName' className='text-sm text-grey-500'>
                          {t('myAccount.businessName')}
                        </Label>
                        <Input
                          id='businessName'
                          value={profileForm.businessName}
                          onChange={(e) => setProfileForm((p) => ({ ...p, businessName: e.target.value }))}
                          placeholder={t('myAccount.businessNamePlaceholder')}
                          readOnly={!isEditingProfile}
                          className={!isEditingProfile ? 'bg-grey-50' : ''}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className='space-y-2'>
                    <Label className='text-sm text-grey-500'>{t('myAccount.phone')}</Label>
                    <button
                      type='button'
                      onClick={() => {
                        setIsChangingPhone((v) => !v);
                        setNewPhone(profileForm.phone);
                        setPhoneOtp('');
                        setIsPhoneOtpSent(false);
                      }}
                      className='flex w-full items-center justify-between rounded-lg border border-border bg-white px-4 py-3 text-sm text-main-black hover:bg-grey-50 transition-colors'
                    >
                      <span className='text-grey-600'>{profileForm.phone || t('myAccount.phonePlaceholder')}</span>
                      <span className='text-sm font-medium text-main-primary'>
                        {isChangingPhone
                          ? <ChevronDown className='h-4 w-4' />
                          : (me?.is_phone_verified ? t('myAccount.changeAction') : t('myAccount.verifyAction'))}
                      </span>
                    </button>
                    {/* Recaptcha container must always be in DOM for Firebase to work */}
                    <div id={phoneRecaptchaContainerId} />
                    {isChangingPhone && (
                      <div className='mt-2 space-y-3 rounded-lg border border-border p-4'>
                        <div className='space-y-1.5'>
                          <Label className='text-sm text-grey-500'>{t('myAccount.newPhone')}</Label>
                          <Input
                            type='tel'
                            value={newPhone}
                            onChange={(e) => setNewPhone(e.target.value)}
                            placeholder={t('myAccount.phonePlaceholder')}
                          />
                        </div>
                        {isPhoneOtpSent && (
                          <div className='space-y-1.5'>
                            <Label className='text-sm text-grey-500'>{t('myAccount.otpLabel')}</Label>
                            <Input
                              value={phoneOtp}
                              onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              placeholder={t('myAccount.otpPlaceholder')}
                              maxLength={6}
                              className='tracking-[0.25em] font-mono'
                            />
                          </div>
                        )}
                        <div className='flex justify-end gap-2 pt-1'>
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() => {
                              setIsChangingPhone(false);
                              setNewPhone('');
                              setPhoneOtp('');
                              setIsPhoneOtpSent(false);
                            }}
                          >
                            {t('myAccount.cancel')}
                          </Button>
                          <Button
                            size='sm'
                            variant='outline'
                            disabled={!newPhone.trim() || phoneOtpCountdown > 0}
                            onClick={handleSendPhoneOtp}
                          >
                            {phoneOtpCountdown > 0
                              ? t('myAccount.otpCountdown', { seconds: phoneOtpCountdown })
                              : isPhoneOtpSent
                                ? t('myAccount.resendOtp')
                                : t('myAccount.sendOtp')}
                          </Button>
                          <Button
                            size='sm'
                            disabled={phoneOtp.length !== 6 || verifyPhoneMutation.isPending}
                            onClick={handleVerifyPhoneOtp}
                            className='bg-main-primary text-white hover:bg-main-primary/90'
                          >
                            {verifyPhoneMutation.isPending ? t('myAccount.verifying') : t('myAccount.verifyOtp')}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div className='space-y-2'>
                    <Label className='text-sm text-grey-500'>{t('myAccount.email')}</Label>
                    <button
                      type='button'
                      onClick={() => {
                        setIsVerifyingEmail((v) => !v);
                        setNewEmail(profileForm.email || me?.email || '');
                      }}
                      className='flex w-full items-center justify-between rounded-lg border border-border bg-grey-50 px-4 py-3 text-sm text-main-black hover:bg-grey-100 transition-colors'
                    >
                      <span className='text-grey-600'>{profileForm.email || me?.email || ''}</span>
                      <span className='flex items-center gap-1 text-sm font-medium text-main-primary'>
                        {me?.is_email_verified
                          ? t('myAccount.changeAction')
                          : (isVerifyingEmail ? <ChevronDown className='h-4 w-4' /> : t('myAccount.verifyAction'))}
                      </span>
                    </button>
                    {isVerifyingEmail && (
                      <div className='mt-2 space-y-3 rounded-lg border border-border p-4'>
                        <div className='space-y-1.5'>
                          <Label className='text-sm text-grey-500'>{t('myAccount.email')}</Label>
                          <Input
                            type='email'
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder='example@email.com'
                          />
                        </div>
                        <p className='text-xs text-grey-500'>{t('myAccount.otpSent')}</p>
                        <div className='space-y-1.5'>
                          <Label className='text-sm text-grey-500'>{t('myAccount.otpLabel')}</Label>
                          <div className='flex gap-2'>
                            <Input
                              value={emailOtp}
                              onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              placeholder={t('myAccount.otpPlaceholder')}
                              maxLength={6}
                              className='flex-1 tracking-[0.25em] font-mono'
                            />
                            <Button
                              size='sm'
                              variant='outline'
                              disabled={otpCountdown > 0 || sendEmailOtpMutation.isPending}
                              onClick={() => sendEmailOtpMutation.mutate()}
                              className='shrink-0'
                            >
                              {sendEmailOtpMutation.isPending
                                ? '...'
                                : otpCountdown > 0
                                  ? t('myAccount.otpCountdown', { seconds: otpCountdown })
                                  : sendEmailOtpMutation.isIdle
                                    ? t('myAccount.sendOtp')
                                    : t('myAccount.resendOtp')}
                            </Button>
                          </div>
                        </div>
                        <div className='flex justify-end gap-2 pt-1'>
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() => { setIsVerifyingEmail(false); setEmailOtp(''); setNewEmail(''); }}
                          >
                            {t('myAccount.cancel')}
                          </Button>
                          <Button
                            size='sm'
                            disabled={emailOtp.length !== 6 || verifyEmailMutation.isPending}
                            onClick={() => verifyEmailMutation.mutate(emailOtp)}
                            className='bg-main-primary text-white hover:bg-main-primary/90'
                          >
                            {verifyEmailMutation.isPending ? t('myAccount.verifying') : t('myAccount.verifyOtp')}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Password */}
                  <div className='space-y-2'>
                    <Label className='text-sm text-grey-500'>{t('myAccount.password')}</Label>
                    <button
                      type='button'
                      onClick={() => setIsChangingPassword((v) => !v)}
                      className='flex w-full items-center justify-between rounded-lg border border-border bg-white px-4 py-3 text-sm text-main-black hover:bg-grey-50 transition-colors'
                    >
                      <span>{t('myAccount.changePassword')}</span>
                      {isChangingPassword
                        ? <ChevronDown className='h-4 w-4 text-grey-400' />
                        : <ChevronRight className='h-4 w-4 text-grey-400' />
                      }
                    </button>
                    {isChangingPassword && (
                      <div className='mt-2 space-y-3 rounded-lg border border-border p-4'>
                        <div className='space-y-1.5'>
                          <Label className='text-sm text-grey-500'>{t('myAccount.currentPassword')}</Label>
                          <Input
                            type='password'
                            value={changePasswordForm.current}
                            onChange={(e) => setChangePasswordForm((f) => ({ ...f, current: e.target.value }))}
                            placeholder={t('myAccount.currentPasswordPlaceholder')}
                          />
                        </div>
                        <div className='space-y-1.5'>
                          <Label className='text-sm text-grey-500'>{t('myAccount.newPassword')}</Label>
                          <Input
                            type='password'
                            value={changePasswordForm.next}
                            onChange={(e) => setChangePasswordForm((f) => ({ ...f, next: e.target.value }))}
                            placeholder={t('myAccount.newPasswordPlaceholder')}
                          />
                        </div>
                        <div className='space-y-1.5'>
                          <Label className='text-sm text-grey-500'>{t('myAccount.confirmPassword')}</Label>
                          <Input
                            type='password'
                            value={changePasswordForm.confirm}
                            onChange={(e) => setChangePasswordForm((f) => ({ ...f, confirm: e.target.value }))}
                            placeholder={t('myAccount.confirmPasswordPlaceholder')}
                          />
                        </div>
                        {changePasswordForm.next && changePasswordForm.confirm && changePasswordForm.next !== changePasswordForm.confirm && (
                          <p className='text-xs text-red-500'>{t('myAccount.passwordMismatch')}</p>
                        )}
                        <div className='flex justify-end gap-2 pt-1'>
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() => { setIsChangingPassword(false); setChangePasswordForm({ current: '', next: '', confirm: '' }); }}
                          >
                            {t('myAccount.cancel')}
                          </Button>
                          <Button
                            size='sm'
                            onClick={() => changePasswordMutation.mutate({ current_password: changePasswordForm.current, new_password: changePasswordForm.next })}
                            disabled={
                              !changePasswordForm.current ||
                              !changePasswordForm.next ||
                              changePasswordForm.next !== changePasswordForm.confirm ||
                              changePasswordMutation.isPending
                            }
                            className='bg-main-primary text-white hover:bg-main-primary/90'
                          >
                            {changePasswordMutation.isPending ? t('myAccount.saving') : t('myAccount.confirm')}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Save */}
                  {isEditingProfile && (
                    <div className='flex justify-end gap-2 pt-2'>
                      <Button
                        variant='ghost'
                        onClick={() => {
                          setIsEditingProfile(false);
                          if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
                          setAvatarPreviewUrl(null);
                          setSelectedAvatarFile(null);
                          setPendingRemoveAvatar(false);
                          if (me) setProfileForm({ email: me.email ?? '', firstName: me.first_name ?? '', lastName: me.last_name ?? '', businessName: me.business_name ?? '', phone: me.phone ?? '' });
                        }}
                      >
                        {t('myAccount.cancel')}
                      </Button>
                      <Button
                        onClick={handleSaveProfile}
                        disabled={updateMeMutation.isPending}
                        className='bg-main-primary text-white hover:bg-main-primary/90 px-8'
                      >
                        {updateMeMutation.isPending ? t('myAccount.saving') : t('myAccount.saveChanges')}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Delete Account */}
            <section className='bg-white rounded-xl border border-border p-6'>
              <h2 className='text-base font-semibold text-main-black mb-1'>{t('deleteAccount.title')}</h2>
              <p className='text-sm text-grey-500 mb-4'>{t('deleteAccount.description')}</p>
              <div className='flex justify-end'>
                <Button variant='outline' size='sm' className='border-destructive text-destructive hover:bg-destructive/5' onClick={() => setShowDeleteDialog(true)}>
                  {t('deleteAccount.button')}
                </Button>
              </div>
            </section>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogContent className='max-w-sm'>
                <DialogHeader className='space-y-3'>
                  <DialogTitle>{t('deleteAccount.dialogTitle')}</DialogTitle>
                  <DialogDescription className='leading-relaxed'>
                    {t('deleteAccount.dialogDescription')}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className='mt-2'>
                  <Button variant='ghost' onClick={() => setShowDeleteDialog(false)}>
                    {t('deleteAccount.cancel')}
                  </Button>
                  <Button
                    variant='destructive'
                    onClick={() => deleteAccountMutation.mutate()}
                    disabled={deleteAccountMutation.isPending}
                  >
                    {deleteAccountMutation.isPending ? t('deleteAccount.deleting') : t('deleteAccount.confirm')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className='space-y-6'>
            <section className='bg-white rounded-xl border border-border p-6'>
              <h2 className='text-base font-semibold text-main-black mb-6'>{t('notifications.title')}</h2>

              {settingsLoading ? (
                <div className='text-sm text-grey-400'>{t('notifications.loading')}</div>
              ) : (
                <div className='space-y-5'>
                  {[
                    { key: 'inAppEnabled' as const, label: t('notifications.inApp'), desc: t('notifications.inAppDesc') },
                    { key: 'emailEnabled' as const, label: t('notifications.email'), desc: t('notifications.emailDesc') },
                    { key: 'pushEnabled' as const, label: t('notifications.push'), desc: t('notifications.pushDesc') },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className='flex items-center justify-between py-3 border-b border-border last:border-0'>
                      <div>
                        <p className='text-sm font-medium text-main-black'>{label}</p>
                        <p className='text-xs text-grey-500'>{desc}</p>
                      </div>
                      <Switch
                        checked={notifForm[key]}
                        disabled={updateSettingsMutation.isPending}
                        onCheckedChange={(checked) => handleToggleSetting(key, checked)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className='bg-white rounded-xl border border-border p-6'>
              <h2 className='text-base font-semibold text-main-black mb-6'>{t('contactPreferences.title')}</h2>
              <div className='space-y-5'>
                {[
                  { key: 'contactViaEmail' as const, label: t('contactPreferences.viaEmail'), desc: t('contactPreferences.viaEmailDesc') },
                  { key: 'contactViaPhone' as const, label: t('contactPreferences.viaPhone'), desc: t('contactPreferences.viaPhoneDesc') },
                  { key: 'hidePhoneNumber' as const, label: t('contactPreferences.hidePhone'), desc: t('contactPreferences.hidePhoneDesc') },
                  { key: 'hideEmail' as const, label: t('contactPreferences.hideEmail'), desc: t('contactPreferences.hideEmailDesc') },
                ].map(({ key, label, desc }) => (
                  <div key={key} className='flex items-center justify-between py-3 border-b border-border last:border-0'>
                    <div>
                      <p className='text-sm font-medium text-main-black'>{label}</p>
                      <p className='text-xs text-grey-500'>{desc}</p>
                    </div>
                    <Switch
                      checked={notifForm[key]}
                      disabled={updateSettingsMutation.isPending}
                      onCheckedChange={(checked) => handleToggleSetting(key, checked)}
                    />
                  </div>
                ))}
              </div>
            </section>

          </div>
        )}
        </div>
      </main>
    </div>
  );
}
