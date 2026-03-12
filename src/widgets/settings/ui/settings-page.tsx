'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, User, CreditCard, Trash2, Plus, ChevronRight, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/ui/dialog';
import { userApi, userQueries } from '@/entities/user/api';
import { settingPreferenceApi, settingPreferenceQueries } from '@/entities/setting-preference/api';
import { customerProfileApi, customerProfileQueries } from '@/entities/customer-profile/api';
import type { UpdateMeData } from '@/entities/user/model/types';
import type { UpdateSettingPreferenceData } from '@/entities/setting-preference/model/types';
import type { CustomerProfile } from '@/entities/customer-profile/model/types';

type Tab = 'profile' | 'settings' | 'subscription';

export function SettingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rawTab = searchParams.get('tab');
  const activeTab: Tab = (rawTab === 'settings' || rawTab === 'subscription') ? rawTab : 'profile';

  const setActiveTab = (tab: Tab) => {
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
  const queryClient = useQueryClient();

  const { data: session } = useSession();
  const isAuthenticated = !!(session as any)?.user?.accessToken;

  // Data queries
  const { data: meResponse, isLoading: meLoading } = useQuery({ ...userQueries.me(), enabled: isAuthenticated });
  const { data: settingsResponse, isLoading: settingsLoading } = useQuery({ ...settingPreferenceQueries.me(), enabled: isAuthenticated });
  const { data: profilesResponse, isLoading: profilesLoading } = useQuery({ ...customerProfileQueries.me(), enabled: isAuthenticated });

  const me = meResponse?.payload?.data;
  const settings = settingsResponse?.payload?.data;
  const profiles = profilesResponse?.payload?.data ?? [];

  // Form state for My Account
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
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

  // Hydrate form from API data
  useEffect(() => {
    if (me) {
      setProfileForm({
        firstName: me.first_name ?? '',
        lastName: me.last_name ?? '',
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

  // Mutations
  const updateMeMutation = useMutation({
    mutationFn: (data: UpdateMeData) => userApi.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueries.me().queryKey });
      setIsEditingProfile(false);
      toast.success('Profile updated successfully');
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: UpdateSettingPreferenceData) => settingPreferenceApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingPreferenceQueries.me().queryKey });
      toast.success('Settings saved');
    },
    onError: () => toast.error('Failed to save settings'),
  });

  const createProfileMutation = useMutation({
    mutationFn: (profileName: string) => customerProfileApi.create({ profile_name: profileName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerProfileQueries.me().queryKey });
      setShowAddProfile(false);
      setNewProfileName('');
      toast.success('Profile created');
    },
    onError: () => toast.error('Failed to create profile'),
  });

  const deleteProfileMutation = useMutation({
    mutationFn: (profileId: string) => customerProfileApi.delete(profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerProfileQueries.me().queryKey });
      toast.success('Profile deleted');
    },
    onError: () => toast.error('Failed to delete profile'),
  });

  const switchProfileMutation = useMutation({
    mutationFn: (profileId: string) => customerProfileApi.switchActive(profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerProfileQueries.me().queryKey });
      toast.success('Active profile switched');
    },
    onError: () => toast.error('Failed to switch profile'),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: { current_password: string; new_password: string }) =>
      userApi.changePassword(me!.user_id, data),
    onSuccess: () => {
      setIsChangingPassword(false);
      setChangePasswordForm({ current: '', next: '', confirm: '' });
      toast.success('Password changed successfully');
    },
    onError: () => toast.error('Current password is incorrect or invalid'),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => userApi.deleteAccount(me!.user_id),
    onSuccess: () => {
      toast.success('Account deleted');
      signOut({ callbackUrl: '/' });
    },
    onError: () => toast.error('Failed to delete account'),
  });

  const handleSaveProfile = () => {
    updateMeMutation.mutate({
      first_name: profileForm.firstName,
      last_name: profileForm.lastName,
      phone: profileForm.phone,
    });
  };

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate({
      in_app_enabled: notifForm.inAppEnabled,
      email_enabled: notifForm.emailEnabled,
      push_enabled: notifForm.pushEnabled,
      contact_via_email: notifForm.contactViaEmail,
      contact_via_phone: notifForm.contactViaPhone,
      hide_phone_number: notifForm.hidePhoneNumber,
      hide_email: notifForm.hideEmail,
    });
  };

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: 'profile', label: 'My Account', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
  ];

  return (
    <div className='relative min-h-screen bg-grey-100'>
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

      {/* Main content */}
      <main className='min-h-screen py-8 flex justify-center'>
        <div className='max-w-[700px] w-full px-8'>
        {activeTab === 'profile' && (
          <div className='space-y-6'>
            {/* Profile Management */}
            <section className='bg-white rounded-xl border border-border p-6'>
              <div className='flex items-center justify-between mb-2'>
                <h2 className='text-base font-semibold text-main-black'>Profile management</h2>
                {!showAddProfile && (
                  <Button
                    size='sm'
                    onClick={() => setShowAddProfile(true)}
                    className='bg-main-primary text-white hover:bg-main-primary/90 h-8 px-3 text-xs'
                  >
                    Add profile
                  </Button>
                )}
              </div>
              <p className='text-sm text-grey-500 mb-4'>
                Each profile keeps its own saved searches and preferences.
              </p>

              {profilesLoading ? (
                <div className='text-sm text-grey-400'>Loading profiles...</div>
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
                            {profile.profile_name?.trim() || 'Default Profile'}
                          </span>
                          {profile.is_active && (
                            <span className='text-xs text-main-primary font-medium bg-purple-98 px-2 py-0.5 rounded-full'>
                              Active
                            </span>
                          )}
                        </div>
                      </div>
                      <div className='flex items-center gap-2'>
                        {!profile.is_active && (
                          <>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => switchProfileMutation.mutate(profile.customer_profile_id)}
                              disabled={switchProfileMutation.isPending}
                            >
                              Switch
                            </Button>
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
                    placeholder='New profile name'
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
                    Add
                  </Button>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => { setShowAddProfile(false); setNewProfileName(''); }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </section>

            {/* My Account */}
            <section className='bg-white rounded-xl border border-border p-6'>
              <div className='flex items-center justify-between mb-6'>
                <h2 className='text-base font-semibold text-main-black'>My Account</h2>
                {!isEditingProfile && (
                  <Button
                    size='sm'
                    className='bg-main-primary text-white hover:bg-main-primary/90 h-8 px-3 text-xs'
                    onClick={() => setIsEditingProfile(true)}
                  >
                    Update Profile
                  </Button>
                )}
              </div>

              {meLoading ? (
                <div className='text-sm text-grey-400'>Loading...</div>
              ) : (
                <div className='space-y-5'>
                  {/* Avatar */}
                  <div className='flex items-start gap-6'>
                    <div className='flex flex-col gap-2'>
                      <Label className='text-sm text-grey-500'>Avatar</Label>
                      <div className='flex size-[72px] items-center justify-center rounded-full bg-grey-100'>
                        {me?.avatar_url ? (
                          <Image
                            src={me.avatar_url}
                            alt='avatar'
                            width={72}
                            height={72}
                            className='size-full rounded-full object-cover'
                          />
                        ) : (
                          <User className='h-8 w-8 text-grey-400' />
                        )}
                      </div>
                      <div className='flex gap-2'>
                        <Button variant='default' size='sm' className='bg-main-primary text-white hover:bg-main-primary/90'>
                          Upload
                        </Button>
                        <Button variant='outline' size='sm'>
                          Remove
                        </Button>
                      </div>
                    </div>

                    <div className='flex-1 grid grid-cols-2 gap-4'>
                      <div className='space-y-2'>
                        <Label htmlFor='firstName' className='text-sm text-grey-500'>
                          First Name
                        </Label>
                        <Input
                          id='firstName'
                          value={profileForm.firstName}
                          onChange={(e) => setProfileForm((p) => ({ ...p, firstName: e.target.value }))}
                          placeholder='First name'
                          readOnly={!isEditingProfile}
                          className={!isEditingProfile ? 'bg-grey-50' : ''}
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='lastName' className='text-sm text-grey-500'>
                          Last Name
                        </Label>
                        <Input
                          id='lastName'
                          value={profileForm.lastName}
                          onChange={(e) => setProfileForm((p) => ({ ...p, lastName: e.target.value }))}
                          placeholder='Last name'
                          readOnly={!isEditingProfile}
                          className={!isEditingProfile ? 'bg-grey-50' : ''}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className='space-y-2'>
                    <Label htmlFor='phone' className='text-sm text-grey-500'>
                      Phone Number
                    </Label>
                    <div className='relative'>
                      <Input
                        id='phone'
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                        placeholder='+1 000-000-0000'
                        readOnly={!isEditingProfile}
                        className={`pr-16 ${!isEditingProfile ? 'bg-grey-50' : ''}`}
                      />
                      <button
                        type='button'
                        className='absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-main-primary hover:underline'
                      >
                        Verify
                      </button>
                    </div>
                  </div>

                  {/* Email */}
                  <div className='space-y-2'>
                    <Label htmlFor='email' className='text-sm text-grey-500'>
                      Email
                    </Label>
                    <div className='relative'>
                      <Input
                        id='email'
                        value={me?.email ?? ''}
                        readOnly
                        className='pr-16 bg-grey-50'
                      />
                      <button
                        type='button'
                        className='absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-main-primary hover:underline'
                      >
                        Verify
                      </button>
                    </div>
                  </div>

                  {/* Password */}
                  <div className='space-y-2'>
                    <Label className='text-sm text-grey-500'>Password</Label>
                    <button
                      type='button'
                      onClick={() => setIsChangingPassword((v) => !v)}
                      className='flex w-full items-center justify-between rounded-lg border border-border bg-white px-4 py-3 text-sm text-main-black hover:bg-grey-50 transition-colors'
                    >
                      <span>Change Password</span>
                      {isChangingPassword
                        ? <ChevronDown className='h-4 w-4 text-grey-400' />
                        : <ChevronRight className='h-4 w-4 text-grey-400' />
                      }
                    </button>
                    {isChangingPassword && (
                      <div className='mt-2 space-y-3 rounded-lg border border-border p-4'>
                        <div className='space-y-1.5'>
                          <Label className='text-sm text-grey-500'>Current Password</Label>
                          <Input
                            type='password'
                            value={changePasswordForm.current}
                            onChange={(e) => setChangePasswordForm((f) => ({ ...f, current: e.target.value }))}
                            placeholder='Enter current password'
                          />
                        </div>
                        <div className='space-y-1.5'>
                          <Label className='text-sm text-grey-500'>New Password</Label>
                          <Input
                            type='password'
                            value={changePasswordForm.next}
                            onChange={(e) => setChangePasswordForm((f) => ({ ...f, next: e.target.value }))}
                            placeholder='Min 8 chars, uppercase, lowercase, number'
                          />
                        </div>
                        <div className='space-y-1.5'>
                          <Label className='text-sm text-grey-500'>Confirm New Password</Label>
                          <Input
                            type='password'
                            value={changePasswordForm.confirm}
                            onChange={(e) => setChangePasswordForm((f) => ({ ...f, confirm: e.target.value }))}
                            placeholder='Re-enter new password'
                          />
                        </div>
                        {changePasswordForm.next && changePasswordForm.confirm && changePasswordForm.next !== changePasswordForm.confirm && (
                          <p className='text-xs text-red-500'>Passwords do not match</p>
                        )}
                        <div className='flex justify-end gap-2 pt-1'>
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() => { setIsChangingPassword(false); setChangePasswordForm({ current: '', next: '', confirm: '' }); }}
                          >
                            Cancel
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
                            {changePasswordMutation.isPending ? 'Saving...' : 'Confirm'}
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
                          if (me) setProfileForm({ firstName: me.first_name ?? '', lastName: me.last_name ?? '', phone: me.phone ?? '' });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveProfile}
                        disabled={updateMeMutation.isPending}
                        className='bg-main-primary text-white hover:bg-main-primary/90 px-8'
                      >
                        {updateMeMutation.isPending ? 'Saving...' : 'Save changes'}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Linked Accounts */}
            <section className='bg-white rounded-xl border border-border p-6'>
              <h2 className='text-base font-semibold text-main-black mb-1'>Linked Accounts</h2>
              <p className='text-sm text-grey-500 mb-4'>We use this to let you sign in easily.</p>
              <div className='flex items-center justify-between py-3 border-b border-border'>
                <div className='flex items-center gap-3'>
                  <svg className='h-5 w-5' viewBox='0 0 24 24'>
                    <path
                      d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                      fill='#4285F4'
                    />
                    <path
                      d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                      fill='#34A853'
                    />
                    <path
                      d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                      fill='#FBBC05'
                    />
                    <path
                      d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                      fill='#EA4335'
                    />
                  </svg>
                  <span className='text-sm text-main-black'>Sign in with Google</span>
                </div>
                <Button variant='outline' size='sm'>
                  Remove
                </Button>
              </div>
            </section>

            {/* Delete Account */}
            <section className='bg-white rounded-xl border border-border p-6'>
              <h2 className='text-base font-semibold text-main-black mb-1'>Delete Account</h2>
              <p className='text-sm text-grey-500 mb-4'>Delete your account and all the data</p>
              <div className='flex justify-end'>
                <Button variant='destructive' size='sm' onClick={() => setShowDeleteDialog(true)}>
                  Delete Account
                </Button>
              </div>
            </section>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogContent className='max-w-sm'>
                <DialogHeader className='space-y-3'>
                  <DialogTitle>Delete Account</DialogTitle>
                  <DialogDescription className='leading-relaxed'>
                    This action cannot be undone. Your account and all associated data will be permanently deleted.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className='mt-2'>
                  <Button variant='ghost' onClick={() => setShowDeleteDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant='destructive'
                    onClick={() => deleteAccountMutation.mutate()}
                    disabled={deleteAccountMutation.isPending}
                  >
                    {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Account'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className='space-y-6'>
            <section className='bg-white rounded-xl border border-border p-6'>
              <h2 className='text-base font-semibold text-main-black mb-6'>Notifications</h2>

              {settingsLoading ? (
                <div className='text-sm text-grey-400'>Loading...</div>
              ) : (
                <div className='space-y-5'>
                  {[
                    { key: 'inAppEnabled' as const, label: 'In-App Notifications', desc: 'Receive notifications inside the app' },
                    { key: 'emailEnabled' as const, label: 'Email Notifications', desc: 'Receive notifications via email' },
                    { key: 'pushEnabled' as const, label: 'Push Notifications', desc: 'Receive push notifications on your device' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className='flex items-center justify-between py-3 border-b border-border last:border-0'>
                      <div>
                        <p className='text-sm font-medium text-main-black'>{label}</p>
                        <p className='text-xs text-grey-500'>{desc}</p>
                      </div>
                      <Switch
                        checked={notifForm[key]}
                        onCheckedChange={(checked) => setNotifForm((f) => ({ ...f, [key]: checked }))}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className='bg-white rounded-xl border border-border p-6'>
              <h2 className='text-base font-semibold text-main-black mb-6'>Contact Preferences</h2>
              <div className='space-y-5'>
                {[
                  { key: 'contactViaEmail' as const, label: 'Contact via Email', desc: 'Allow others to contact you via email' },
                  { key: 'contactViaPhone' as const, label: 'Contact via Phone', desc: 'Allow others to contact you via phone' },
                  { key: 'hidePhoneNumber' as const, label: 'Hide Phone Number', desc: 'Hide your phone number from other users' },
                  { key: 'hideEmail' as const, label: 'Hide Email', desc: 'Hide your email address from other users' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className='flex items-center justify-between py-3 border-b border-border last:border-0'>
                    <div>
                      <p className='text-sm font-medium text-main-black'>{label}</p>
                      <p className='text-xs text-grey-500'>{desc}</p>
                    </div>
                    <Switch
                      checked={notifForm[key]}
                      onCheckedChange={(checked) => setNotifForm((f) => ({ ...f, [key]: checked }))}
                    />
                  </div>
                ))}
              </div>
            </section>

            <div className='flex justify-end'>
              <Button
                onClick={handleSaveSettings}
                disabled={updateSettingsMutation.isPending}
                className='bg-main-primary text-white hover:bg-main-primary/90 px-8'
              >
                {updateSettingsMutation.isPending ? 'Saving...' : 'Save changes'}
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'subscription' && (
          <div className='bg-white rounded-xl border border-border p-6'>
            <h2 className='text-base font-semibold text-main-black mb-2'>Subscription</h2>
            <p className='text-sm text-grey-500'>Subscription plans coming soon.</p>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
