import { UseFormSetError } from 'react-hook-form';
import { toast } from 'sonner';
import { EntityError } from '@/shared/lib/http';

// Map of backend error_code → i18n key in the "Common" namespace
const ERROR_CODE_TO_I18N_KEY: Record<string, string> = {
  // Global
  RESOURCE_NOT_FOUND: 'Common.errors.resourceNotFound',
  AUTHENTICATION_ERROR: 'Common.errors.authenticationError',
  ACCESS_DENIED: 'Common.errors.accessDenied',
  VALIDATION_ERROR: 'Common.errors.validationError',
  INVALID_REQUEST_BODY: 'Common.errors.invalidRequestBody',
  FILE_SIZE_EXCEEDED: 'Common.errors.fileSizeExceeded',
  UNSUPPORTED_MEDIA_TYPE: 'Common.errors.unsupportedMediaType',
  INTERNAL_SERVER_ERROR: 'Common.errors.internalServerError',
  // Auth
  ERROR_GOOGLE_EMAIL_MISSING: 'Common.errors.googleEmailMissing',
  ERROR_GOOGLE_AUTH_FAILED: 'Common.errors.googleAuthFailed',
  ERROR_ACCOUNT_DELETED: 'Common.errors.accountDeleted',
  // User
  ERROR_EMAIL_ALREADY_EXISTS: 'Common.errors.emailAlreadyExists',
  EMAIL_ALREADY_EXISTS: 'Common.errors.emailAlreadyExists',
  ERROR_INVALID_CURRENT_PASSWORD: 'Common.errors.invalidCurrentPassword',
  ERROR_INVALID_OTP: 'Common.errors.invalidOtp',
  // Listing
  ERROR_DUPLICATE_LISTING_PUBLISH: 'Common.errors.duplicateListingPublish',
  DUPLICATE_LISTING_PUBLISH: 'Common.errors.duplicateListingPublish',
  ERROR_PROPERTY_NOT_AVAILABLE: 'Common.errors.propertyNotAvailable',
  PROPERTY_NOT_AVAILABLE: 'Common.errors.propertyNotAvailable',
  // Lease
  ERROR_LEASE_PROPERTY_NOT_AVAILABLE: 'Common.errors.leasePropertyNotAvailable',
  ERROR_LEASE_ACTIVE_EXISTS: 'Common.errors.leaseActiveExists',
  ERROR_LEASE_DOCUSIGN_UNAVAILABLE: 'Common.errors.leaseDocusignUnavailable',
  ERROR_LEASE_TERMINATE_LANDLORD_ONLY: 'Common.errors.leaseTerminateLandlordOnly',
  ERROR_LEASE_ACCESS_DENIED: 'Common.errors.leaseAccessDenied',
  // Profile
  ERROR_PROFILE_OWNERSHIP_VIOLATION: 'Common.errors.profileOwnershipViolation',
  ERROR_CANNOT_DELETE_ACTIVE_PROFILE: 'Common.errors.cannotDeleteActiveProfile',
  // Engagement / Proposal
  ERROR_PROPOSAL_TEMPLATE_NOT_OWNED: 'Common.errors.proposalTemplateNotOwned',
  ERROR_CANNOT_PROPOSE_TO_SELF: 'Common.errors.cannotProposeToSelf',
  ERROR_PROPOSAL_ALREADY_ACTIVE: 'Common.errors.proposalAlreadyActive',
  // Billing
  ERROR_SUBSCRIPTION_NOT_ACTIVE: 'Common.errors.subscriptionNotActive',
  ERROR_BOOST_ALREADY_ACTIVE: 'Common.errors.boostAlreadyActive',
  ERROR_BOOST_PUBLISHED_ONLY: 'Common.errors.boostPublishedOnly',
  // Engagement (additional codes)
  ENGAGEMENT_NOT_OWNED: 'Common.errors.engagementNotOwned',
  CANCELLATION_REASON_REQUIRED: 'Common.errors.cancellationReasonRequired',
  REVIEW_ALREADY_EXISTS: 'Common.errors.reviewAlreadyExists',
  // Appointment
  SLOT_ALREADY_BOOKED: 'Common.errors.businessConflict',
};

export const handleErrorApi = ({
  error,
  setError,
  duration,
  t,
}: {
  error: any;
  setError?: UseFormSetError<any>;
  duration?: number;
  /** Pass the `t` function from `useTranslations()` for i18n key lookup */
  t?: (key: string) => string;
}) => {
  if (error instanceof EntityError && setError) {
    error.payload.errors.forEach((item) => {
      setError(item.field, {
        type: 'server',
        message: item.message,
      });
    });
    return;
  }

  const errorCode: string | undefined = error?.payload?.error_code;
  const serverMessage: string | undefined =
    error?.payload?.message && error.payload.message !== 'Http Error'
      ? error.payload.message
      : undefined;

  // 1. If we have a translator and a known code, use local i18n key
  if (t && errorCode && ERROR_CODE_TO_I18N_KEY[errorCode]) {
    try {
      const localizedMsg = t(ERROR_CODE_TO_I18N_KEY[errorCode]);
      toast.error(localizedMsg, { duration: duration ?? 5000 });
      return;
    } catch {
      // fall through to server message
    }
  }

  // 2. Use the server's pre-translated message (backend now returns localized messages)
  if (serverMessage) {
    toast.error(serverMessage, { duration: duration ?? 5000 });
    return;
  }

  // 3. Final fallback
  toast.error('Đã xảy ra lỗi. Vui lòng thử lại.', { duration: duration ?? 5000 });
};
