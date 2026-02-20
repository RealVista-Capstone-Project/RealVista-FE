import { TenantApplication } from '@/shared/types/tenant-application';
import { Card, CardContent, CardFooter, CardHeader } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Trash2 } from 'lucide-react';
import { Badge } from '@/shared/ui/badge'; // Assuming Badge component exists, or I will use a simple div
import { format } from 'date-fns';
import { formatCurrency } from '../lib/utils';

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
        <Button
            variant='destructive'
            size='sm'
            onClick={() => {
                if (window.confirm('Are you sure you want to delete this application?')) {
                    onDelete(application.tenantApplicationId);
                }
            }}
        >
          <Trash2 className='h-4 w-4 mr-2' />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
};
