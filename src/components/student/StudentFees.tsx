import { useState } from 'react';
import { DollarSign, CreditCard, Download, Clock, CheckCircle, AlertCircle, Receipt, RefreshCw, Loader2 } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { Skeleton } from '../ui/skeleton';
import { useFeeOverview, useFees, usePayments, usePayFee, useDownloadInvoice } from '../../hooks/useStudentData';

// Skeleton loader
function FeesSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

export function StudentFees() {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedFeeId, setSelectedFeeId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'CARD' | 'JAZZCASH' | 'EASYPAISA' | 'OTHER'>('CASH');

  // API Hooks - Based on student-panel-apis.json
  // FEE_01: /student/fees/overview
  const { data: feeOverview, loading: overviewLoading, error: overviewError, refetch: refetchOverview } = useFeeOverview();
  
  // FEE_02: /student/fees
  const { data: fees, loading: feesLoading, refetch: refetchFees } = useFees();
  
  // FEE_03: /student/fees/payments
  const { data: payments, loading: paymentsLoading } = usePayments();
  
  // FEE_06: /student/fees/:feeId/pay
  const { payFee, loading: payingFee } = usePayFee();
  
  // FEE_05: Download Invoice
  const { download: downloadInvoice, loading: downloadingInvoice } = useDownloadInvoice();

  const loading = overviewLoading || feesLoading;

  // Filter fees
  const pendingFees = fees?.filter(f => f.status === 'PENDING' || f.status === 'OVERDUE' || f.status === 'PARTIAL') || [];
  const paidFees = fees?.filter(f => f.status === 'PAID') || [];

  const stats = {
    totalPending: feeOverview?.pendingAmount || pendingFees.reduce((sum, f) => sum + (f.amount - f.paidAmount), 0),
    totalPaid: feeOverview?.paidAmount || paidFees.reduce((sum, f) => sum + f.paidAmount, 0),
    overdueAmount: feeOverview?.overdueAmount || 0,
    pendingCount: pendingFees.length,
    paidCount: paidFees.length,
    currency: feeOverview?.currency || 'PKR',
  };

  const handlePayment = async () => {
    if (!selectedFeeId || !paymentMethod) {
      toast.error('Please select payment method');
      return;
    }

    const result = await payFee(selectedFeeId, {
      amount: paymentAmount ? parseFloat(paymentAmount) : undefined,
      paymentMethod,
    });

    if (result) {
      setIsPaymentDialogOpen(false);
      setPaymentAmount('');
      setPaymentMethod('CASH');
      setSelectedFeeId(null);
      refetchFees();
      refetchOverview();
    }
  };

  const handleDownloadInvoice = async (feeId: string, invoiceNumber: string) => {
    await downloadInvoice(feeId, invoiceNumber);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400';
      case 'PENDING': return 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/20 dark:text-orange-400';
      case 'OVERDUE': return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/20 dark:text-red-400';
      case 'PARTIAL': return 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID': return <CheckCircle className="w-4 h-4" />;
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'OVERDUE': return <AlertCircle className="w-4 h-4" />;
      case 'PARTIAL': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return <FeesSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900 dark:text-white mb-2">Fee Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and pay your school fees
          </p>
          {overviewError && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              Unable to load fee data. Please try again.
            </p>
          )}
        </div>
        <Button variant="outline" onClick={() => { refetchFees(); refetchOverview(); }}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 dark:text-red-300 mb-1">Total Pending</p>
              <p className="text-3xl text-red-900 dark:text-red-100">{stats.currency} {stats.totalPending.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-red-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 dark:text-green-300 mb-1">Total Paid</p>
              <p className="text-3xl text-green-900 dark:text-green-100">{stats.currency} {stats.totalPaid.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-600 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending Items</p>
              <p className="text-3xl text-gray-900 dark:text-white">{stats.pendingCount}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Paid Items</p>
              <p className="text-3xl text-gray-900 dark:text-white">{stats.paidCount}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <Receipt className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Pending Fees */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl text-gray-900 dark:text-white">Pending Fees</h2>
        </div>
        <div className="p-6">
          {pendingFees.length > 0 ? (
            <div className="space-y-4">
              {pendingFees.map((fee) => {
                const daysUntilDue = Math.ceil((new Date(fee.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                const remainingAmount = fee.amount - fee.paidAmount;
                
                return (
                  <Card key={fee.id} className="p-6 border-2 border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                          <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg text-gray-900 dark:text-white mb-1">{fee.feeType}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{fee.description}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <Badge variant="outline" className={getStatusColor(fee.status)}>
                              {getStatusIcon(fee.status)}
                              <span className="ml-1">{fee.status}</span>
                            </Badge>
                            <span className={`text-gray-600 dark:text-gray-400 ${daysUntilDue <= 7 && daysUntilDue >= 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                              Due: {new Date(fee.dueDate).toLocaleDateString()}
                              {daysUntilDue >= 0 && daysUntilDue <= 30 && (
                                <span className="ml-1">({daysUntilDue} days left)</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl text-gray-900 dark:text-white mb-1">
                          {stats.currency} {remainingAmount.toLocaleString()}
                        </p>
                        {fee.paidAmount > 0 && (
                          <p className="text-sm text-gray-500">
                            Paid: {stats.currency} {fee.paidAmount.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 pl-16">
                      <Dialog open={isPaymentDialogOpen && selectedFeeId === fee.id} onOpenChange={(open) => {
                        setIsPaymentDialogOpen(open);
                        if (open) {
                          setSelectedFeeId(fee.id);
                          setPaymentAmount(remainingAmount.toString());
                        } else {
                          setSelectedFeeId(null);
                          setPaymentAmount('');
                          setPaymentMethod('CASH');
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                            <CreditCard className="w-4 h-4 mr-2" />
                            Pay Now
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Process Payment</DialogTitle>
                            <DialogDescription>
                              Select your payment method and complete the transaction.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                              <h4 className="text-sm text-gray-900 dark:text-white mb-2">{fee.feeType}</h4>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{fee.description}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Remaining Amount:</span>
                                <span className="text-lg text-gray-900 dark:text-white">{stats.currency} {remainingAmount.toLocaleString()}</span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="amount">Payment Amount</Label>
                              <Input
                                id="amount"
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                placeholder="Enter amount"
                                className="h-11"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="method">Payment Method</Label>
                              <Select value={paymentMethod} onValueChange={(value: typeof paymentMethod) => setPaymentMethod(value)}>
                                <SelectTrigger className="h-11">
                                  <SelectValue placeholder="Select payment method" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                                  <SelectItem value="CARD">Credit/Debit Card</SelectItem>
                                  <SelectItem value="CASH">Cash</SelectItem>
                                  <SelectItem value="JAZZCASH">JazzCash</SelectItem>
                                  <SelectItem value="EASYPAISA">Easypaisa</SelectItem>
                                  <SelectItem value="OTHER">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                              <p className="text-sm text-blue-800 dark:text-blue-200">
                                💡 You will receive a payment confirmation via email and SMS once the transaction is processed.
                              </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                              <Button 
                                onClick={handlePayment} 
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                disabled={payingFee}
                              >
                                {payingFee ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    Process Payment
                                  </>
                                )}
                              </Button>
                              <Button onClick={() => setIsPaymentDialogOpen(false)} variant="outline" className="flex-1">
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="outline"
                        onClick={() => fee.invoiceNumber && handleDownloadInvoice(fee.id, fee.invoiceNumber)}
                        disabled={downloadingInvoice || !fee.invoiceNumber}
                      >
                        {downloadingInvoice ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4 mr-2" />
                        )}
                        Download Invoice
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No pending fees</p>
            </div>
          )}
        </div>
      </Card>

      {/* Payment History */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl text-gray-900 dark:text-white">Payment History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs text-gray-600 dark:text-gray-400 uppercase">Fee</th>
                <th className="px-6 py-4 text-center text-xs text-gray-600 dark:text-gray-400 uppercase">Amount</th>
                <th className="px-6 py-4 text-center text-xs text-gray-600 dark:text-gray-400 uppercase">Payment Date</th>
                <th className="px-6 py-4 text-center text-xs text-gray-600 dark:text-gray-400 uppercase">Method</th>
                <th className="px-6 py-4 text-center text-xs text-gray-600 dark:text-gray-400 uppercase">Transaction ID</th>
                <th className="px-6 py-4 text-right text-xs text-gray-600 dark:text-gray-400 uppercase">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {payments && payments.length > 0 ? (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900 dark:text-white">Fee Payment</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-900 dark:text-white">{stats.currency} {payment.amount.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(payment.paidAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{payment.paymentMethod}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{payment.transactionId || '-'}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Receipt
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No payment history available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
