'use client';

import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  DollarSign, Package, User as UserIcon, Calendar,
  CheckCircle2, Clock, AlertCircle, TrendingUp,
  ArrowUpRight, ArrowDownRight, MoreHorizontal
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { cn, formatVND } from '@/shared/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/shared/ui/tooltip';

interface TransactionDetail {
  id: string;
  user_name: string;
  user_email: string;
  user_avatar?: string;
  type: string;
  plan_name: string;
  amount: number;
  timestamp: string;
  status: string;
}

interface RevenueTableProps {
  transactions: TransactionDetail[];
  isLoading: boolean;
}

const TableSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 animate-pulse">
        <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/4 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-2 w-1/6 bg-slate-100 dark:bg-slate-800 rounded" />
        </div>
        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    ))}
  </div>
);

const RevenueTableComponent: React.FC<RevenueTableProps> = ({ transactions, isLoading }) => {
  if (isLoading && transactions.length === 0) {
    return <TableSkeleton />;
  }

  if (transactions.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10">
        <div className="relative">
          <div className="h-24 w-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center animate-bounce duration-[3000ms]">
             <Package className="h-10 w-10 text-slate-300 dark:text-slate-600" />
          </div>
          <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center shadow-lg">
            <DollarSign className="h-5 w-5 text-emerald-500" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Không có dữ liệu giao dịch</p>
          <p className="text-xs text-slate-400">Hãy thử thay đổi bộ lọc hoặc khoảng thời gian</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900/50">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/10">
              <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Khách hàng</th>
              <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Dịch vụ & Gói</th>
              <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Thời gian giao dịch</th>
              <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thành tiền</th>
              <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800/30">
            <AnimatePresence mode="popLayout" initial={false}>
              {transactions.map((txn, idx) => (
                <motion.tr
                  key={txn.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2, delay: idx * 0.02 }}
                  className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all duration-200"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-800 shadow-sm ring-1 ring-slate-100 dark:ring-slate-800 transition-transform group-hover:scale-110">
                          <AvatarImage src={txn.user_avatar} />
                          <AvatarFallback className="bg-slate-900 text-white text-[10px] font-black">
                            {txn.user_name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center">
                           <UserIcon className="h-2 w-2 text-slate-400" />
                        </div>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-sm font-black text-slate-900 dark:text-white leading-tight truncate max-w-[150px] group-hover:text-emerald-600 transition-colors">
                                {txn.user_name}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="bg-slate-900 text-white font-bold text-[10px]">
                              {txn.user_name}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <span className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">{txn.user_email}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <Badge className={cn(
                          "px-1.5 py-0 rounded-md text-[8px] font-black uppercase tracking-tighter border-none",
                          txn.type === 'BOOST' ? 'bg-emerald-500 text-white' :
                          txn.type === 'LISTING' ? 'bg-amber-500 text-white' :
                          txn.type === '3D_TOUR' ? 'bg-blue-500 text-white' :
                          'bg-purple-500 text-white'
                        )}>
                          {txn.type.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs font-black text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                          {txn.plan_name}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <Calendar className="h-4 w-4 text-slate-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          {format(parseISO(txn.timestamp), 'dd/MM/yyyy')}
                        </span>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-300" />
                          <span className="text-[10px] text-slate-400 font-black">
                            {format(parseISO(txn.timestamp), 'HH:mm', { locale: vi })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-4 text-right">
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <span className="text-sm font-black tabular-nums">{formatVND(txn.amount)}</span>
                        <TrendingUp className="h-3 w-3" />
                      </div>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Giao dịch thành công</span>
                    </div>
                  </td>

                  <td className="py-4 px-6 text-center">
                    <div className="flex justify-center">
                      <Badge className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black border-none shadow-sm flex items-center gap-1.5",
                        txn.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-600' :
                        txn.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600' :
                        'bg-rose-500/10 text-rose-600'
                      )}>
                        {txn.status === 'COMPLETED' && <CheckCircle2 className="h-3 w-3" />}
                        {txn.status === 'PENDING' && <Clock className="h-3 w-3" />}
                        {txn.status === 'FAILED' && <AlertCircle className="h-3 w-3" />}
                        {txn.status}
                      </Badge>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {isLoading && transactions.length > 0 && (
        <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center z-10">
          <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export const RevenueTable = memo(RevenueTableComponent);
