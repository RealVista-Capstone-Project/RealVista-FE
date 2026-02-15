import { TenantApplication } from '@/entities/tenant-application/model/types';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { FileText, Download, X } from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/utils';

interface ApplicationDetailPanelProps {
    application: TenantApplication;
    onClose: () => void;
    onDelete: (id: string) => void;
}

export const ApplicationDetailPanel = ({ 
    application, 
    onClose, 
    onDelete 
}: ApplicationDetailPanelProps) => {
    return (
        <Card 
            id="application-detail-panel"
            key={application.tenantApplicationId}
            className="w-full lg:w-[380px] flex-shrink-0 border-none shadow-lg bg-white flex flex-col max-h-[calc(100vh-100px)] animate-in slide-in-from-right-4 fade-in duration-300 rounded-xl sticky top-4 overflow-hidden"
        >
            <CardHeader className="p-5 border-b border-gray-100 flex flex-row items-center justify-between bg-white flex-none">
                <CardTitle className="font-bold text-base text-gray-900">Chi tiết đơn</CardTitle>
                <div className="flex gap-2">
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            
            <CardContent className="p-0 flex-1 overflow-y-auto min-h-0">
                <div className="p-6 flex flex-col items-center border-b border-gray-50 bg-gray-50/30">
                     <Avatar className="h-24 w-24 mb-4 border-4 border-white shadow-sm ring-1 ring-gray-100">
                        <AvatarImage src={`https://ui-avatars.com/api/?name=${application.title?.substring(0, 2) || 'User'}&background=random`} />
                        <AvatarFallback>User</AvatarFallback>
                     </Avatar>
                    <h3 className="text-lg font-bold text-gray-900">Nguyễn Văn A</h3>
                    <div className="text-sm text-gray-500 mt-1">TP. Hồ Chí Minh</div>
                    
                    <div className="mt-4 flex gap-2 w-full">
                         <Button variant="outline" className="flex-1 bg-white border-gray-200 text-gray-700 h-9 text-xs font-medium hover:bg-gray-50">
                            <Download className="h-3.5 w-3.5 mr-2" />
                            Xuất PDF
                        </Button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-indigo-50 rounded-xl p-4 flex justify-between items-center ring-1 ring-indigo-100">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-100 p-2 rounded-lg">
                                <FileText className="h-4 w-4 text-indigo-600" />
                            </div>
                            <div>
                                <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Mã số thuế</div>
                                <span className="font-mono font-semibold text-indigo-900 text-sm">0301 •• ••••</span>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-xs text-indigo-600 font-bold hover:text-indigo-700 hover:bg-indigo-100 px-2 h-7">Hiện</Button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm py-1 border-b border-dashed border-gray-100">
                            <span className="text-gray-500">Ngày sinh</span>
                            <span className="font-medium text-gray-900">05/09/1995</span>
                        </div>
                        <div className="flex justify-between items-center text-sm py-1 border-b border-dashed border-gray-100">
                            <span className="text-gray-500">Tuổi</span>
                            <span className="font-medium text-gray-900">29 tuổi</span>
                        </div>
                        <div className="flex justify-between items-center text-sm py-1 border-b border-dashed border-gray-100">
                            <span className="text-gray-500">Email</span>
                            <span className="font-medium text-gray-900 truncate max-w-[180px]">nguyenvana@gmail.com</span>
                        </div>
                        <div className="flex justify-between items-center text-sm py-1 border-b border-dashed border-gray-100">
                            <span className="text-gray-500">Số điện thoại</span>
                            <span className="font-medium text-gray-900">0909 123 456</span>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                        <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                             <div>
                                <div className="text-xs text-gray-400 mb-1">Thu nhập</div>
                                <div className="font-bold text-gray-900 text-sm">
                                    {formatCurrency(application.monthlyIncome)}/th
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-400 mb-1">Tỷ lệ chi trả</div>
                                <div className="font-bold text-gray-900 text-sm">30%</div>
                            </div>
                             <div>
                                <div className="text-xs text-gray-400 mb-1">Số người</div>
                                <div className="font-bold text-gray-900 text-sm">2 người</div>
                            </div>
                             <div>
                                <div className="text-xs text-gray-400 mb-1">Ngày chuyển</div>
                                <div className="font-bold text-gray-900 text-sm">
                                    {formatDate(application.moveInDate, 'dd/MM/yyyy')}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider mb-3 ml-1">Người tham chiếu</h4>
                        <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
                            <p className="text-sm italic text-gray-500 mb-4 bg-gray-50 p-3 rounded-lg">"Anh ấy luôn trả tiền thuê nhà đúng hạn"</p>
                            <div className="flex items-center gap-3">
                                 <Avatar className="h-9 w-9 ring-2 ring-white shadow-sm">
                                    <AvatarImage src={`https://ui-avatars.com/api/?name=Tran+B&background=random`} />
                                    <AvatarFallback>TB</AvatarFallback>
                                 </Avatar>
                                <div>
                                    <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                        Trần Văn B
                                        <span className="text-[9px] font-bold text-white bg-green-500 px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">Đã xác minh</span>
                                    </div>
                                    <div className="text-xs text-gray-400">tranvanb@gmail.com</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                     <div className="pt-2">
                        <Button 
                            variant="destructive" 
                            className="w-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border-transparent transition-all shadow-none hover:shadow-md"
                            onClick={() => onDelete(application.tenantApplicationId)}
                        >
                            Xóa đơn đăng ký
                        </Button>
                     </div>
                </div>
            </CardContent>
        </Card>
    );
};
