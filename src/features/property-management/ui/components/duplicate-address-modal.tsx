'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AlertTriangle, ExternalLink, Home, Info } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox/checkbox';
import { propertyApi } from '@/entities/property/api/property.api';
import type {
  AddressDuplicateCheckResponse,
  ClaimReason,
  ConflictingPropertySummary,
  DuplicateReasonCode,
} from '@/entities/property/api/property-api.types';

export type DuplicateOverrideReason =
  | 'CONFIRMED_DIFFERENT_UNIT'
  | 'CONFIRMED_NEW_BUILD';

interface DuplicateAddressModalProps {
  open: boolean;
  onClose: () => void;
  duplicateCheckResult: AddressDuplicateCheckResponse;
  /** Called when user confirms they want to proceed despite the warning. */
  onConfirm: (overrideReason: DuplicateOverrideReason) => void;
}

function ConflictCard({ property }: { property: ConflictingPropertySummary }) {
  return (
    <div className='flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3'>
      {property.thumbnail_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={property.thumbnail_url}
          alt='Property thumbnail'
          className='h-14 w-14 rounded-md object-cover shrink-0'
        />
      ) : (
        <div className='flex h-14 w-14 items-center justify-center rounded-md bg-muted shrink-0'>
          <Home className='h-6 w-6 text-muted-foreground' />
        </div>
      )}
      <div className='min-w-0 flex-1'>
        <p className='truncate text-sm font-medium'>{property.street_address}</p>
        <span className='inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary mt-1'>
          {property.status}
        </span>
      </div>
      <a
        href={`/dashboard/property/${property.property_id}`}
        target='_blank'
        rel='noopener noreferrer'
        className='shrink-0 text-muted-foreground hover:text-foreground'
        title='Xem bất động sản'
      >
        <ExternalLink className='h-4 w-4' />
      </a>
    </div>
  );
}

/** Modal A — cùng owner, property inactive → gợi ý reactivate */
function ModalSameOwnerInactive({
  result,
  onClose,
  onCreateNew,
}: {
  result: AddressDuplicateCheckResponse;
  onClose: () => void;
  onCreateNew: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className='flex items-center gap-2'>
          <AlertTriangle className='h-5 w-5 text-yellow-500' />
          Bất động sản đã tồn tại
        </DialogTitle>
        <DialogDescription>
          Bạn đã có bất động sản ngừng hoạt động tại địa chỉ này. Bạn có muốn kích hoạt lại không?
        </DialogDescription>
      </DialogHeader>
      <div className='flex flex-col gap-2 py-2'>
        {result.conflicting_properties.map((p) => (
          <ConflictCard key={p.property_id} property={p} />
        ))}
      </div>
      <DialogFooter className='flex-col gap-2 sm:flex-row'>
        <Button type='button' variant='ghost' onClick={onClose}>
          Hủy
        </Button>
        <Button
          type='button'
          variant='outline'
          onClick={onCreateNew}
          className='border-amber-300 text-amber-700 hover:bg-amber-50'
        >
          Tạo mới hoàn toàn (xây lại)
        </Button>
        <Button
          type='button'
          onClick={() => {
            const id = result.conflicting_properties[0]?.property_id;
            if (id) window.open(`/dashboard/property/${id}`, '_blank');
            onClose();
          }}
          className='bg-primary text-white'
        >
          Khôi phục bất động sản cũ
        </Button>
      </DialogFooter>
    </>
  );
}

/** Modal B — khác owner, property active → claim flow */
function ModalDifferentOwnerActive({
  result,
  onClose,
  onClaim,
}: {
  result: AddressDuplicateCheckResponse;
  onClose: () => void;
  onClaim: (reason: ClaimReason, message: string) => void;
}) {
  const [claimMessage, setClaimMessage] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <>
      <DialogHeader>
        <DialogTitle className='flex items-center gap-2'>
          <AlertTriangle className='h-5 w-5 text-yellow-500' />
          Phát hiện bất động sản tương tự
        </DialogTitle>
        <DialogDescription>
          Có bất động sản đang hoạt động tại địa chỉ này. Nếu bạn là chủ sở hữu mới, bạn có thể
          gửi yêu cầu xác nhận quyền sở hữu.
        </DialogDescription>
      </DialogHeader>
      <div className='flex flex-col gap-3 py-2'>
        {result.conflicting_properties.map((p) => (
          <ConflictCard key={p.property_id} property={p} />
        ))}
        <div className='rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800'>
          <Info className='mb-1 inline h-4 w-4' /> Chủ sở hữu hiện tại sẽ nhận thông báo và có{' '}
          <strong>7 ngày</strong> để phản hồi. Nếu không phản hồi, Admin sẽ xem xét.
        </div>
        <textarea
          className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none'
          rows={3}
          placeholder='Mô tả lý do (ví dụ: tôi mới mua bất động sản này từ chủ cũ)...'
          value={claimMessage}
          onChange={(e) => setClaimMessage(e.target.value)}
        />
        <label className='flex items-start gap-2 text-sm cursor-pointer'>
          <Checkbox
            className='mt-0.5'
            checked={acknowledged}
            onCheckedChange={(v) => setAcknowledged(v === true)}
          />
          <span>
            Tôi xác nhận mình là chủ sở hữu hợp pháp và hiểu rằng thông tin sai sẽ bị xử lý theo
            quy định.
          </span>
        </label>
      </div>
      <DialogFooter className='flex-col gap-2 sm:flex-row'>
        <Button type='button' variant='ghost' onClick={onClose}>
          Hủy
        </Button>
        <Button
          type='button'
          disabled={!acknowledged}
          onClick={() => onClaim('NEW_OWNER', claimMessage)}
          className='bg-primary text-white disabled:opacity-50'
        >
          Gửi yêu cầu xác nhận quyền sở hữu
        </Button>
      </DialogFooter>
    </>
  );
}

/** Modal C — khác owner, property inactive → confirm khác tài sản */
function ModalDifferentOwnerInactive({
  result,
  onClose,
  onConfirm,
}: {
  result: AddressDuplicateCheckResponse;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <>
      <DialogHeader>
        <DialogTitle className='flex items-center gap-2'>
          <Info className='h-5 w-5 text-blue-500' />
          Địa chỉ tương tự đã tồn tại
        </DialogTitle>
        <DialogDescription>
          Có bất động sản cũ tại địa chỉ tương tự nhưng đã ngừng hoạt động. Vui lòng xác nhận để
          tiếp tục.
        </DialogDescription>
      </DialogHeader>
      <div className='flex flex-col gap-2 py-2'>
        {result.conflicting_properties.map((p) => (
          <ConflictCard key={p.property_id} property={p} />
        ))}
        <label className='flex items-start gap-2 text-sm cursor-pointer mt-2'>
          <Checkbox
            className='mt-0.5'
            checked={confirmed}
            onCheckedChange={(v) => setConfirmed(v === true)}
          />
          <span>
            Tôi xác nhận đây là bất động sản khác (ví dụ: căn hộ riêng, tầng khác trong cùng tòa
            nhà).
          </span>
        </label>
      </div>
      <DialogFooter>
        <Button type='button' variant='ghost' onClick={onClose}>
          Hủy
        </Button>
        <Button
          type='button'
          disabled={!confirmed}
          onClick={onConfirm}
          className='bg-primary text-white disabled:opacity-50'
        >
          Xác nhận và tiếp tục
        </Button>
      </DialogFooter>
    </>
  );
}

export function DuplicateAddressModal({
  open,
  onClose,
  duplicateCheckResult,
  onConfirm,
}: DuplicateAddressModalProps) {
  const reasonCode = duplicateCheckResult.reason_code as DuplicateReasonCode;

  const claimMutation = useMutation({
    mutationFn: ({
      propertyId,
      reason,
      message,
    }: {
      propertyId: string;
      reason: ClaimReason;
      message: string;
    }) => propertyApi.claimProperty(propertyId, { claim_reason: reason, message }),
    onSuccess: () => {
      toast.success('Yêu cầu xác nhận quyền sở hữu đã được gửi. Chủ sở hữu sẽ được thông báo.');
      onClose();
    },
    onError: () => {
      toast.error('Không thể gửi yêu cầu xác nhận quyền sở hữu. Vui lòng thử lại.');
    },
  });

  const handleClaim = (reason: ClaimReason, message: string) => {
    const propertyId = duplicateCheckResult.conflicting_properties[0]?.property_id;
    if (!propertyId) return;
    claimMutation.mutate({ propertyId, reason, message });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className='sm:max-w-[520px]'>
        {reasonCode === 'SAME_OWNER_INACTIVE' && (
          <ModalSameOwnerInactive
            result={duplicateCheckResult}
            onClose={onClose}
            onCreateNew={() => onConfirm('CONFIRMED_NEW_BUILD')}
          />
        )}
        {reasonCode === 'DIFFERENT_OWNER_ACTIVE' && (
          <ModalDifferentOwnerActive
            result={duplicateCheckResult}
            onClose={onClose}
            onClaim={handleClaim}
          />
        )}
        {(reasonCode === 'DIFFERENT_OWNER_INACTIVE' || reasonCode === 'NO_MATCH') && (
          <ModalDifferentOwnerInactive
            result={duplicateCheckResult}
            onClose={onClose}
            onConfirm={() => onConfirm('CONFIRMED_DIFFERENT_UNIT')}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
