import { useState, useEffect, useRef } from 'react';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';
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
import { Input } from '@/shared/ui/input';
import { firebaseApp } from '@/shared/config/firebase';
import { useTranslations } from 'next-intl';
import { useVerifyPropertyByAgent } from '@/entities/property/api/use-verify-property';

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

  const verifyMutation = useVerifyPropertyByAgent();

  const auth = getAuth(firebaseApp);

  // Simplified effect for cleanup - we'll initialize on demand for robustness
  useEffect(() => {
    return () => {
      if (recaptchaVerifier.current) {
        console.log('[VerificationModal] Cleaning up Recaptcha...');
        recaptchaVerifier.current.clear();
        recaptchaVerifier.current = null;
      }
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

  const initRecaptcha = () => {
    if (recaptchaVerifier.current) return recaptchaVerifier.current;

    const container = document.getElementById('recaptcha-container');
    if (!container) {
      console.error('[VerificationModal] Recaptcha container not found in DOM!');
      setError('Internal error: Recaptcha container not found');
      return null;
    }

    console.log('[VerificationModal] Initializing Recaptcha...');
    try {
      const verifier = new RecaptchaVerifier(auth, container, {
        size: 'invisible',
        callback: () => {
          console.log('[VerificationModal] Recaptcha solved successfully');
        },
        'expired-callback': () => {
          console.error('[VerificationModal] Recaptcha expired, please try again');
          setStep('IDLE');
        },
      });
      recaptchaVerifier.current = verifier;
      return verifier;
    } catch (err) {
      console.error('[VerificationModal] Failed to initialize Recaptcha:', err);
      setError('Failed to initialize security check');
      return null;
    }
  };

  const handleSendOtp = async () => {
    if (step === 'OTP_SENT' && resendCountdown > 0) {
      return;
    }

    console.log('[VerificationModal] Attempting to send OTP to:', ownerPhone);

    setError(null);
    const verifier = initRecaptcha();

    if (!verifier) {
      console.error('[VerificationModal] Cannot proceed: Recaptcha verifier not ready');
      return;
    }

    setStep('SENDING');

    try {
      const confirmationResult: ConfirmationResult = await signInWithPhoneNumber(
        auth,
        ownerPhone,
        verifier // The verifier is guaranteed non-null here
      );

      // @ts-expect-error - Attach to window for global access in this flow
      window.confirmationResult = confirmationResult;
      setStep('OTP_SENT');
      setResendCountdown(RESEND_COOLDOWN_SECONDS);
      toast.success(t('otpSentSuccess', { default: 'OTP sent to owner successfully!' }));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send OTP';
      console.error('Firebase Auth Error:', err);
      setError(errorMessage);
      setStep('IDLE');
      toast.error(t('otpSentError', { default: 'Failed to send OTP. Please try again.' }));
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) return;

    setStep('VERIFYING');
    setError(null);

    try {
      // @ts-expect-error - Get from window
      const confirmationResult = window.confirmationResult;
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
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()} modal={false}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <ShieldCheck className='w-6 h-6 text-primary' />
            {t('verifyPropertyTitle', { default: 'Agent Verification' })}
          </DialogTitle>
          <DialogDescription>
            {t('verifyPropertyDesc', {
              default: 'To verify this property, we need to send an OTP to the owner: {name}.',
              name: ownerName,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className='py-6 space-y-4'>
          <div className='flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800'>
            <Smartphone className='w-5 h-5 text-slate-400' />
            <div className='flex-1 text-sm font-medium text-slate-700 dark:text-slate-300'>
              {ownerPhone}
            </div>
            {step === 'IDLE' && (
              <Button size='sm' onClick={handleSendOtp}>
                {t('sendOtp', { default: 'Send OTP' })}
              </Button>
            )}
            {step === 'SENDING' && (
              <Button size='sm' disabled>
                <Loader2 className='w-4 h-4 animate-spin' />
              </Button>
            )}
          </div>

          <div id='recaptcha-container' ref={recaptchaRef}></div>

          {(step === 'OTP_SENT' || step === 'SENDING') && (
            <div className='space-y-4 animate-in fade-in slide-in-from-top-2 duration-300'>
              <div className='space-y-2'>
                <Input
                  type='text'
                  placeholder='000000'
                  className='text-center text-2xl tracking-[1em] font-bold h-14'
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />
                <div className='flex flex-col gap-1'>
                  <p className='text-xs text-center text-muted-foreground'>
                    {t('otpInstruction', { default: 'Enter the 6-digit code sent to the owner' })}
                  </p>
                  <p className='text-xs text-center text-amber-600 dark:text-amber-400 font-medium'>
                    {t('otpExpiryInfo', { default: 'OTP code is valid for 5 minutes.' })}
                  </p>
                </div>
              </div>
              <Button
                className='w-full h-12 text-base'
                onClick={handleVerifyOtp}
                disabled={otp.length !== 6}
              >
                {t('confirmVerification', { default: 'Verify & Confirm' })}
              </Button>
            </div>
          )}

          {step === 'VERIFYING' && (
            <div className='flex flex-col items-center justify-center py-6 space-y-4'>
              <Loader2 className='w-10 h-10 animate-spin text-primary' />
              <p className='text-sm text-muted-foreground'>
                {t('verifying', { default: 'Verifying OTP...' })}
              </p>
            </div>
          )}

          {step === 'SUCCESS' && (
            <div className='flex flex-col items-center justify-center py-6 space-y-4 animate-in zoom-in-95 duration-300'>
              <div className='w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400'>
                <CheckCircle2 size={40} />
              </div>
              <h3 className='text-xl font-bold text-center'>
                {t('verifiedTitle', { default: 'Verified Successfully!' })}
              </h3>
            </div>
          )}

          {error && (
            <div className='p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 flex items-center gap-2 text-red-700 dark:text-red-400 text-sm'>
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
              className='text-slate-500 underline'
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
