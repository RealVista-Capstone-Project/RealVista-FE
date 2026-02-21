import { TenantApplication } from '@/shared/types/tenant-application';
import { Card, CardContent, CardFooter, CardHeader } from '@/shared/ui/card';
import { RealVistaButton } from '@/shared/ui/realvista-button';
import { Trash2, AlertCircle } from 'lucide-react';
import { Badge } from '@/shared/ui/badge'; // Assuming Badge component exists, or I will use a simple div
import { format } from 'date-fns';
import { formatCurrency } from '../lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/shared/ui/dialog';

interface ApplicationCardProps {
  application: TenantApplication;
  onDelete: (id: string) => void;
}

export const ApplicationCard = ({ application, onDelete }: ApplicationCardProps) => {
  return (
    <Card className='w-full'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <div className='font-semibold text-lg'>{application.title}</div>
        <Badge variant={application.status === 'ACTIVE' ? 'default' : 'secondary'}>
          {application.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className='grid gap-2 text-sm text-gray-500'>
             <div className='flex justify-between'>
                <span>Lease Term:</span>
                <span className='font-medium text-gray-900'>{application.leaseTermMonths} months</span>
            </div>
            <div className='flex justify-between'>
                <span>Move-in Date:</span>
                <span className='font-medium text-gray-900'>
                    {application.moveInDate ? format(new Date(application.moveInDate), 'PPP') : 'N/A'}
                </span>
            </div>
             <div className='flex justify-between'>
                <span>Monthly Income:</span>
                <span className='font-medium text-gray-900'>
                    {formatCurrency(application.monthlyIncome)}
                </span>
            </div>
        </div>
      </CardContent>
      <CardFooter className='flex justify-end'>
        <Dialog>
          <DialogTrigger asChild>
            <RealVistaButton variant='secondary' size='small' className='text-red-500 border-red-200 hover:bg-red-50 focus:ring-red-500 h-9 px-3'>
              <Trash2 className='h-4 w-4 mr-2' />
              Delete
            </RealVistaButton>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2 text-destructive'>
                <AlertCircle className='h-5 w-5 fill-red-100 text-red-600' />
                Delete Application
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <span className='font-medium text-foreground'>{application.title}</span>?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className='mt-4'>
              <DialogClose asChild>
                <RealVistaButton variant='secondary' size='small'>Cancel</RealVistaButton>
              </DialogClose>
              <DialogClose asChild>
                <RealVistaButton
                  variant='primary'
                  size='small'
                  className='bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  onClick={() => onDelete(application.tenantApplicationId)}
                >
                  Delete
                </RealVistaButton>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
};
