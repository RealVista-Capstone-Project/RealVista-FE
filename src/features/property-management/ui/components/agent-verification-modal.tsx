import { useState, useEffect, useRef, useCallback } from 'react';
import { HttpError } from '@/shared/lib/http';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { ShieldCheck, Smartphone, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/shared/ui/input-otp';
import { getFirebaseAuth } from '@/shared/config/firebase';
import { isFirebasePhoneAuthHostnameCaptchaIssue } from '@/shared/lib/firebase-phone-auth-host';
import { normalizeVietnamesePhoneForE164 } from '@/shared/lib/phone-vn';
import { useTranslations } from 'next-intl';
import { useVerifyPropertyByAgent } from '@/entities/property/api/use-verify-property';
import { usePropertyDetail } from '@/entities/property/api/use-property-detail';
import { REGEXP_ONLY_DIGITS } from 'input-otp';

const AGENT_PHONE_RECAPTCHA_HOST_ID = 'agent-phone-verification-recaptcha-host';

interface AgentVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  ownerName: string;
  ownerPhone: string;
}

/**
 * AgentVerificationModal handles the property verification flow for agents.
 * It uses Firebase Phone Authentication to send an OTP to the owner's phone number.
 * Once verified, it calls the backend to update the property status to VERIFIED.
 */
export function AgentVerificationModal({
  isOpen,
  onClose,
  propertyId,
  ownerName,
  ownerPhone,
}: AgentVerificationModalProps) {
  const RESEND_COOLDOWN_SECONDS = 60;
  const t = useTranslations('PropertyManagement');
  const [step, setStep] = useState<'IDLE' | 'SENDING' | 'OTP_SENT' | 'VERIFYING' | 'SUCCESS'>(
    'IDLE'
  );
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);
  const phoneOtpSendingRef = useRef(false);

  const { data: propertyData, isLoading: isLoadingProperty } = usePropertyDetail(propertyId);
  const verifyMutation = useVerifyPropertyByAgent();

  const auth = getFirebaseAuth();

  // Simplified effect for cleanup - we'll initialize on demand for robustness
  useEffect(() => {
    return () => {
      if (recaptchaVerifier.current) {
        console.log('[VerificationModal] Cleaning up Recaptcha...');
        try {
          recaptchaVerifier.current.clear();
        } catch {
          /* noop */
        }
        recaptchaVerifier.current = null;
      }
      document.getElementById(AGENT_PHONE_RECAPTCHA_HOST_ID)?.replaceChildren();
    };
  }, []);

  useEffect(() => {
    if (step !== 'OTP_SENT' || resendCountdown <= 0) return;

    const timer = window.setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [step, resendCountdown]);

  const resetAgentRecaptchaHost = useCallback(() => {
    document.getElementById(AGENT_PHONE_RECAPTCHA_HOST_ID)?.replaceChildren();
  }, []);

  const initRecaptcha = useCallback(() => {
    const host = document.getElementById(AGENT_PHONE_RECAPTCHA_HOST_ID);
    if (!host) {
      console.error('[VerificationModal] reCAPTCHA host not found in DOM!');
      setError('Internal error: Recaptcha container not found');
      return null;
    }

    if (recaptchaVerifier.current) {
      try { recaptchaVerifier.current.clear(); } catch { /* stale */ }
      recaptchaVerifier.current = null;
    }
    host.replaceChildren();

    const mount = document.createElement('div');
    host.appendChild(mount);

    console.log('[VerificationModal] Initializing Recaptcha...');
    try {
      const verifier = new RecaptchaVerifier(auth, mount, {
        size: 'invisible',
        callback: () => {
          console.log('[VerificationModal] Recaptcha solved successfully');
        },
        'expired-callback': () => {
          console.error('[VerificationModal] Recaptcha expired, please try again');
          if (recaptchaVerifier.current) {
            try { recaptchaVerifier.current.clear(); } catch { }
            recaptchaVerifier.current = null;
          }
          resetAgentRecaptchaHost();
          setStep('IDLE');
        },
      });
      recaptchaVerifier.current = verifier;
      return verifier;
    } catch (err) {
      console.error('[VerificationModal] Failed to initialize Recaptcha:', err);
      host.replaceChildren();
      setError('Failed to initialize security check');
      return null;
    }
  }, [auth, resetAgentRecaptchaHost]);

  const handleSendOtp = useCallback(async () => {
    if (step === 'OTP_SENT' && resendCountdown > 0) {
      return;
    }
    if (phoneOtpSendingRef.current) return;
    phoneOtpSendingRef.current = true;

    try {
      const ownerE164 = normalizeVietnamesePhoneForE164(ownerPhone);
      if (!ownerE164) {
        const msg = t('invalidOwnerPhone', {
          default: 'Owner phone format is invalid. Use +84, 84, or domestic 0… format.',
        });
        setError(msg);
        toast.error(msg);
        return;
      }

      console.log('[VerificationModal] Attempting to send OTP to:', ownerE164);

      setError(null);
      const verifier = initRecaptcha();

      if (!verifier) {
        console.error('[VerificationModal] Cannot proceed: Recaptcha verifier not ready');
        return;
      }

      if (propertyData?.status && propertyData.status !== 'PENDING') {
        const msg = `This property is ${propertyData.status.toLowerCase()} and cannot be verified.`;
        setError(msg);
        toast.error(msg);
        return;
      }

      setStep('SENDING');

      try {
        const confirmationResult: ConfirmationResult = await signInWithPhoneNumber(
          auth,
          ownerE164,
          verifier
        );

        // @ts-expect-error - Attach to window
        window.confirmationResult = confirmationResult;
        if (recaptchaVerifier.current) {
          try { recaptchaVerifier.current.clear(); } catch { /* noop */ }
          recaptchaVerifier.current = null;
        }
        resetAgentRecaptchaHost();

        setStep('OTP_SENT');
        setResendCountdown(RESEND_COOLDOWN_SECONDS);
        toast.success(t('otpSentSuccess', { default: 'OTP sent to owner successfully!' }));
      } catch (err: unknown) {
        console.error('Firebase Auth Error:', err);
        if (recaptchaVerifier.current) {
          try { recaptchaVerifier.current.clear(); } catch { /* noop */ }
          recaptchaVerifier.current = null;
        }
        resetAgentRecaptchaHost();

        let errorMessage = t('otpSentError', { default: 'Failed to send OTP. Please try again.' });

        const errorStr = JSON.stringify(err);
        const errObj = err as { code?: string; message?: string };
        const errTextLower = `${(err instanceof Error ? err.message : '')} ${errorStr}`.toLowerCase();
      if (
        errorStr.includes('TOO_MANY_ATTEMPTS_TRY_LATER') ||
        errObj.code === 'auth/too-many-requests' ||
        errObj.message?.includes('TOO_MANY_ATTEMPTS_TRY_LATER')
      ) {
        errorMessage = t('tooManyAttempts', {
          default: 'Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.',
        });
      } else if (errObj.code === 'auth/invalid-phone-number') {
        errorMessage = t('invalidOwnerPhone', {
          default: 'Owner phone format is invalid. Use +84, 84, or domestic 0… format.',
        });
      } else if (errObj.code === 'auth/invalid-app-credential') {
        errorMessage =
          typeof window !== 'undefined' && window.location.hostname === 'localhost'
            ? t('phoneAuthInvalidAppCredentialLocalhost')
            : t('phoneAuthInvalidAppCredential');
      } else if (errObj.code === 'auth/captcha-check-failed') {
        const host = typeof window !== 'undefined' ? window.location.hostname : '';
        errorMessage = isFirebasePhoneAuthHostnameCaptchaIssue(errObj.message, host)
          ? t('phoneAuthCaptchaHostname', { hostname: host })
          : t('recaptchaCheckFailed', {
              default: 'reCAPTCHA verification failed. Please try again.',
            });
      } else if (errTextLower.includes('already been rendered')) {
        errorMessage = t('recaptchaRetry', {
          default: 'Security check reset. Tap Send OTP again.',
        });
      }

        setError(errorMessage);
        setStep('IDLE');
        toast.error(errorMessage);
      }
    } finally {
      phoneOtpSendingRef.current = false;
    }
  }, [auth, initRecaptcha, ownerPhone, resetAgentRecaptchaHost, propertyData?.status, resendCountdown, step, t]);

  const handleVerifyOtp = useCallback(async () => {
    if (!otp || otp.length !== 6) return;

    setStep('VERIFYING');
    setError(null);

    try {
      // @ts-expect-error - Get from window
      const confirmationResult = window.confirmationResult as ConfirmationResult | undefined;
      if (!confirmationResult) throw new Error('No confirmation result found');

      await confirmationResult.confirm(otp);

      await verifyMutation.mutateAsync(propertyId);

      setStep('SUCCESS');
      toast.success(t('verificationSuccess', { default: 'Property verified successfully!' }));

      setTimeout(() => {
        onClose();
        setStep('IDLE');
        setOtp('');
        setResendCountdown(0);
      }, 2000);
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      console.error('OTP Verification Error:', err);

      let errorMessage = t('otpVerifyError', { default: 'Invalid OTP code. Please try again.' });

      // Map specific Firebase error codes
      if (
        firebaseError.code === 'auth/invalid-verification-code' ||
        firebaseError.message?.includes('invalid-verification-code')
      ) {
        errorMessage = t('otpVerifyError', { default: 'Nhập sai mã OTP. Vui lòng thử lại.' });
      } else if (
        firebaseError.code === 'auth/code-expired' ||
        firebaseError.message?.includes('code-expired')
      ) {
        errorMessage = t('otpExpiredError', { default: 'Mã OTP đã hết hạn. Vui lòng gửi lại.' });
      }

      setError(errorMessage);
      setStep('OTP_SENT');
      toast.error(errorMessage);

      if (err instanceof HttpError) {
        const backendMessage = err.payload.message;
        setError(backendMessage);
        toast.error(backendMessage);

        if (backendMessage.includes('Only pending properties')) {
          onClose();
        }
      }
    }
  }, [otp, propertyId, verifyMutation, t, onClose]);

  useEffect(() => {
    if (otp.length === 6 && step === 'OTP_SENT') {
      handleVerifyOtp();
    }
  }, [otp, step, handleVerifyOtp]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()} modal={false}>
      <DialogContent className='sm:max-w-md rounded-lg border-primary/20'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-foreground'>
            <div className='size-10 rounded-full bg-primary/10 flex items-center justify-center'>
              <ShieldCheck className='size-5 text-primary' />
            </div>
            {t('verifyPropertyTitle', { default: 'Agent Verification' })}
          </DialogTitle>
          <DialogDescription className='text-muted-foreground'>
            {t('verifyPropertyDesc', {
              default: 'To verify this property, we need to send an OTP to the owner: {name}.',
              name: ownerName,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className='py-6 flex flex-col gap-4'>
          <div className='flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20'>
            <div className='size-10 rounded-full bg-primary/10 flex items-center justify-center'>
              <Smartphone className='size-5 text-primary' />
            </div>
            <div className='flex-1 text-sm font-medium text-foreground'>
              {ownerPhone}
            </div>
            {step === 'IDLE' && (
              <Button
                size='sm'
                onClick={handleSendOtp}
                disabled={isLoadingProperty}
                className='rounded-lg bg-primary hover:bg-primary/90 text-white font-bold'
              >
                {isLoadingProperty ? (
                  <Loader2 className='size-4 animate-spin' />
                ) : (
                  t('sendOtp', { default: 'Send OTP' })
                )}
              </Button>
            )}
            {step === 'SENDING' && (
              <Button size='sm' disabled className='rounded-lg'>
                <Loader2 className='size-4 animate-spin' />
              </Button>
            )}
          </div>

          <div id={AGENT_PHONE_RECAPTCHA_HOST_ID} ref={recaptchaRef} aria-hidden />

          {(step === 'OTP_SENT' || step === 'SENDING') && (
            <div className='flex flex-col gap-5 animate-in fade-in slide-in-from-top-2 duration-300'>
              <div className='flex flex-col items-center gap-4'>
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                  pattern={REGEXP_ONLY_DIGITS}
                  containerClassName='justify-center'
                >
                  <InputOTPGroup>
                    <InputOTPSlot
                      index={0}
                      className='size-14 text-xl font-bold rounded-lg border-primary/20 data-[active=true]:border-primary data-[active=true]:ring-primary/30'
                    />
                    <InputOTPSlot
                      index={1}
                      className='size-14 text-xl font-bold rounded-lg border-primary/20 data-[active=true]:border-primary data-[active=true]:ring-primary/30'
                    />
                    <InputOTPSlot
                      index={2}
                      className='size-14 text-xl font-bold rounded-lg border-primary/20 data-[active=true]:border-primary data-[active=true]:ring-primary/30'
                    />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot
                      index={3}
                      className='size-14 text-xl font-bold rounded-lg border-primary/20 data-[active=true]:border-primary data-[active=true]:ring-primary/30'
                    />
                    <InputOTPSlot
                      index={4}
                      className='size-14 text-xl font-bold rounded-lg border-primary/20 data-[active=true]:border-primary data-[active=true]:ring-primary/30'
                    />
                    <InputOTPSlot
                      index={5}
                      className='size-14 text-xl font-bold rounded-lg border-primary/20 data-[active=true]:border-primary data-[active=true]:ring-primary/30'
                    />
                  </InputOTPGroup>
                </InputOTP>

                <div className='flex flex-col gap-1'>
                  <p className='text-xs text-center text-muted-foreground'>
                    {t('otpInstruction', { default: 'Enter the 6-digit code sent to the owner' })}
                  </p>
                  <p className='text-xs text-center text-amber-600 font-medium'>
                    {t('otpExpiryInfo', { default: 'OTP code is valid for 5 minutes.' })}
                  </p>
                </div>
              </div>

              <Button
                className='w-full h-12 text-base rounded-lg bg-primary hover:bg-primary/90 text-white font-bold'
                onClick={handleVerifyOtp}
                disabled={otp.length !== 6}
              >
                {t('confirmVerification', { default: 'Verify & Confirm' })}
              </Button>
            </div>
          )}

          {step === 'VERIFYING' && (
            <div className='flex flex-col items-center justify-center py-6 gap-4'>
              <Loader2 className='size-10 animate-spin text-primary' />
              <p className='text-sm text-muted-foreground'>
                {t('verifying', { default: 'Verifying OTP...' })}
              </p>
            </div>
          )}

          {step === 'SUCCESS' && (
            <div className='flex flex-col items-center justify-center py-6 gap-4 animate-in zoom-in-95 duration-300'>
              <div className='size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary'>
                <CheckCircle2 size={40} />
              </div>
              <h3 className='text-xl font-bold text-center text-foreground'>
                {t('verifiedTitle', { default: 'Verified Successfully!' })}
              </h3>
            </div>
          )}

          {error && (
            <div className='p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-destructive text-sm'>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {(step === 'OTP_SENT' || step === 'SENDING') && (
          <DialogFooter className='sm:justify-center'>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleSendOtp}
              disabled={resendCountdown > 0 || step === 'SENDING'}
              className='text-primary hover:text-primary/90 underline'
            >
              {resendCountdown > 0
                ? t('resendOtpCountdown', {
                    default: 'Resend OTP in {seconds}s',
                    seconds: resendCountdown,
                  })
                : t('resendOtp', { default: 'Resend OTP' })}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
