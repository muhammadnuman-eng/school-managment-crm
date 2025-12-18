import { useState, useEffect, useMemo } from 'react';
import { DollarSign, Download, Search, Filter, Plus, CheckCircle, XCircle, Clock, TrendingUp, TrendingDown, Edit, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { toast } from 'sonner';
import { ScrollArea } from '../ui/scroll-area';
import { adminService } from '../../services';
import { StudentFee, FeeType, Expense, CreateInvoiceRequest, CreateExpenseRequest } from '../../types/fee.types';
import { Student } from '../../types/student.types';
import { ApiException, getUserFriendlyError } from '../../utils/errors';

// Mock data - commented out, using API data instead
// const feeRecords = [
//   { 
//     id: 1, 
//     student: 'Emily Rodriguez', 
//     rollNo: 'ST001', 
//     class: 'Grade 10A', 
//     amount: 45000, 
//     paid: 45000, 
//     due: 0, 
//     status: 'Paid', 
//     dueDate: '2024-01-15',
//     paidDate: '2024-01-10',
//     paidTime: '10:30 AM',
//     createdDate: '2024-01-05',
//     createdTime: '09:15 AM'
//   },
//   { 
//     id: 2, 
//     student: 'James Wilson', 
//     rollNo: 'ST002', 
//     class: 'Grade 9B', 
//     amount: 42000, 
//     paid: 21000, 
//     due: 21000, 
//     status: 'Partial', 
//     dueDate: '2024-01-15',
//     paidDate: '2024-01-05',
//     paidTime: '02:45 PM',
//     createdDate: '2024-01-05',
//     createdTime: '09:15 AM'
//   },
//   { 
//     id: 3, 
//     student: 'Sophia Lee', 
//     rollNo: 'ST003', 
//     class: 'Grade 11A', 
//     amount: 48000, 
//     paid: 48000, 
//     due: 0, 
//     status: 'Paid', 
//     dueDate: '2024-01-15',
//     paidDate: '2024-01-12',
//     paidTime: '11:20 AM',
//     createdDate: '2024-01-05',
//     createdTime: '09:15 AM'
//   },
//   { 
//     id: 4, 
//     student: 'Oliver Thompson', 
//     rollNo: 'ST004', 
//     class: 'Grade 8C', 
//     amount: 40000, 
//     paid: 0, 
//     due: 40000, 
//     status: 'Pending', 
//     dueDate: '2024-01-15',
//     paidDate: null,
//     paidTime: null,
//     createdDate: '2024-01-05',
//     createdTime: '09:15 AM'
//   },
// ];

const expenseRecords = [
  {
    id: 1,
    category: 'Salaries',
    description: 'Teacher salaries - January 2024',
    amount: 1500000,
    date: '2024-01-01',
    time: '09:00 AM',
    status: 'Paid',
    paymentMethod: 'Bank Transfer',
    approvedBy: 'Admin',
    createdDate: '2023-12-28',
    createdTime: '03:30 PM'
  },
  {
    id: 2,
    category: 'Infrastructure',
    description: 'Classroom renovation - Science Lab',
    amount: 450000,
    date: '2024-01-05',
    time: '02:15 PM',
    status: 'Paid',
    paymentMethod: 'Cheque',
    approvedBy: 'Principal',
    createdDate: '2024-01-03',
    createdTime: '11:45 AM'
  },
  {
    id: 3,
    category: 'Utilities',
    description: 'Electricity & Water bills - December',
    amount: 125000,
    date: '2024-01-10',
    time: '10:30 AM',
    status: 'Pending',
    paymentMethod: 'Cash',
    approvedBy: 'Finance Manager',
    createdDate: '2024-01-08',
    createdTime: '04:20 PM'
  },
  {
    id: 4,
    category: 'Supplies',
    description: 'Books and stationery for library',
    amount: 285000,
    date: '2024-01-12',
    time: '03:45 PM',
    status: 'Paid',
    paymentMethod: 'Bank Transfer',
    approvedBy: 'Admin',
    createdDate: '2024-01-10',
    createdTime: '01:10 PM'
  },
  {
    id: 5,
    category: 'Maintenance',
    description: 'HVAC system repair and servicing',
    amount: 95000,
    date: '2024-01-15',
    time: '11:00 AM',
    status: 'Approved',
    paymentMethod: 'Cash',
    approvedBy: 'Principal',
    createdDate: '2024-01-13',
    createdTime: '02:50 PM'
  },
  {
    id: 6,
    category: 'Transportation',
    description: 'Bus fuel and maintenance - January',
    amount: 175000,
    date: '2024-01-08',
    time: '09:30 AM',
    status: 'Paid',
    paymentMethod: 'Bank Transfer',
    approvedBy: 'Admin',
    createdDate: '2024-01-06',
    createdTime: '10:15 AM'
  },
];

const expenseCategories = [
  'SALARIES',
  'UTILITIES',
  'MAINTENANCE',
  'SUPPLIES',
  'TRANSPORT',
  'HOSTEL',
  'OTHER'
];

// Manual Fee Types - Hardcoded values
const manualFeeTypes: FeeType[] = [
  { id: 'tuition-fee', name: 'Tuition Fee', amount: 0, description: 'Monthly tuition fee' },
  { id: 'academic-fee', name: 'Academic Fee', amount: 0, description: 'Academic year fee' },
  { id: 'transport-fee', name: 'Transport Fee', amount: 0, description: 'School transport fee' },
  { id: 'hostel-fee', name: 'Hostel Fee', amount: 0, description: 'Hostel accommodation fee' },
  { id: 'library-fee', name: 'Library Fee', amount: 0, description: 'Library membership fee' },
  { id: 'lab-fee', name: 'Lab Fee', amount: 0, description: 'Laboratory fee' },
  { id: 'sports-fee', name: 'Sports Fee', amount: 0, description: 'Sports activities fee' },
  { id: 'examination-fee', name: 'Examination Fee', amount: 0, description: 'Examination fee' },
  { id: 'admission-fee', name: 'Admission Fee', amount: 0, description: 'One-time admission fee' },
  { id: 'registration-fee', name: 'Registration Fee', amount: 0, description: 'Registration fee' },
];

export function FeeManagement() {
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [activeTab, setActiveTab] = useState('invoices');

  // API state
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Use manual fee types instead of API
  const [feeTypes, setFeeTypes] = useState<FeeType[]>(manualFeeTypes);
  const [studentFees, setStudentFees] = useState<StudentFee[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState<string | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<'Paid' | 'Partial' | 'Pending' | undefined>(undefined);

  // Invoice form state
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedFeeTypeId, setSelectedFeeTypeId] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [invoiceNotes, setInvoiceNotes] = useState('');

  // Expense form state
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [expenseTime, setExpenseTime] = useState('');
  const [expensePaymentMethod, setExpensePaymentMethod] = useState('');
  const [expenseStatus, setExpenseStatus] = useState<'Paid' | 'Pending' | 'Approved'>('Pending');
  const [expenseApprovedBy, setExpenseApprovedBy] = useState('');

  // Open edit expense dialog
  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseCategory(expense.category);
    setExpenseDescription(expense.description);
    setExpenseAmount(expense.amount.toString());
    setExpenseDate(expense.date);
    setExpenseTime(expense.time || '');
    setExpensePaymentMethod(expense.paymentMethod || '');
    setExpenseStatus(expense.status);
    setExpenseApprovedBy(expense.approvedBy || '');
    setShowExpenseDialog(true);
  };

  // Reset expense form
  const resetExpenseForm = () => {
    setEditingExpense(null);
    setExpenseCategory('');
    setExpenseDescription('');
    setExpenseAmount('');
    setExpenseDate('');
    setExpenseTime('');
    setExpensePaymentMethod('');
    setExpenseStatus('Pending');
    setExpenseApprovedBy('');
  };

  // Fetch data on mount and when tab changes
  useEffect(() => {
    fetchFeeData();
    if (activeTab === 'expenses') {
      fetchExpenses();
    }
  }, [activeTab]);

  // Ensure fee types and students are loaded when dialog opens
  useEffect(() => {
    if (showInvoiceDialog) {
      // Use manual fee types - no API call needed
      setFeeTypes(manualFeeTypes);

      // Fetch students if not already loaded
      if (students.length === 0) {
        const fetchStudentsOnly = async () => {
          try {
            const studentsResponse = await adminService.getStudents();
            setStudents(studentsResponse.students || []);

            if (import.meta.env.DEV) {
              console.log('✅ Students loaded for invoice dialog:', {
                students: studentsResponse.students || [],
                count: studentsResponse.students?.length || 0,
              });
            }
          } catch (error: any) {
            console.error('❌ Error fetching students:', error);
            let errorMessage = 'Failed to load students. Please try again.';
            if (error instanceof ApiException) {
              errorMessage = getUserFriendlyError(error);
            } else if (error?.message) {
              errorMessage = error.message;
            }
            toast.error(errorMessage);
          }
        };
        fetchStudentsOnly();
      }

      if (import.meta.env.DEV) {
        console.log('✅ Fee Types available for invoice dialog:', {
          feeTypes: manualFeeTypes,
          count: manualFeeTypes.length,
        });
      }
    }
  }, [showInvoiceDialog, students.length]);

  const fetchFeeData = async () => {
    setIsLoading(true);
    try {
      // Use manual fee types (no API call needed)
      setFeeTypes(manualFeeTypes);

      // Fetch student fees
      const feesResponse = await adminService.getStudentFees();
      setStudentFees(feesResponse.studentFees || []);

      // Fetch students for invoice form
      const studentsResponse = await adminService.getStudents();
      setStudents(studentsResponse.students || []);
    } catch (error: any) {
      console.error('Error fetching fee data:', error);
      let errorMessage = 'Failed to load fee data. Please try again.';
      if (error instanceof ApiException) {
        errorMessage = getUserFriendlyError(error);
      } else if (error?.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
      // Keep manual fee types even on error
      setFeeTypes(manualFeeTypes);
      setStudentFees([]);
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      const expensesResponse = await adminService.getExpenses();
      setExpenses(expensesResponse.expenses || []);
    } catch (error: any) {
      console.error('Error fetching expenses:', error);
      let errorMessage = 'Failed to load expenses. Please try again.';
      if (error instanceof ApiException) {
        errorMessage = getUserFriendlyError(error);
      } else if (error?.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
      setExpenses([]);
    }
  };

  // Calculate totals from API data
  const totalFees = useMemo(() => {
    return studentFees.reduce((sum, record) => sum + (record.totalAmount || 0), 0);
  }, [studentFees]);

  const totalPaid = useMemo(() => {
    return studentFees.reduce((sum, record) => sum + (record.paidAmount || 0), 0);
  }, [studentFees]);

  const totalDue = useMemo(() => {
    return studentFees.reduce((sum, record) => sum + (record.dueAmount || 0), 0);
  }, [studentFees]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  }, [expenses]);

  const paidExpenses = useMemo(() => {
    return expenses.filter(e => e.status === 'Paid').reduce((sum, expense) => sum + (expense.amount || 0), 0);
  }, [expenses]);

  const pendingExpenses = useMemo(() => {
    return expenses.filter(e => e.status === 'Pending' || e.status === 'Approved').reduce((sum, expense) => sum + (expense.amount || 0), 0);
  }, [expenses]);

  // Filter student fees
  const filteredStudentFees = useMemo(() => {
    let filtered = studentFees;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(fee =>
        fee.studentName?.toLowerCase().includes(query) ||
        fee.rollNo?.toLowerCase().includes(query) ||
        fee.class?.toLowerCase().includes(query)
      );
    }

    // Class filter
    if (filterClass && filterClass !== 'all') {
      filtered = filtered.filter(fee => fee.class === filterClass);
    }

    // Status filter
    if (filterStatus) {
      filtered = filtered.filter(fee => fee.status === filterStatus);
    }

    return filtered;
  }, [studentFees, searchQuery, filterClass, filterStatus]);

  // Get unique classes for filter
  const availableClasses = useMemo(() => {
    const classes = studentFees.map(f => f.class).filter(Boolean);
    return Array.from(new Set(classes)).sort();
  }, [studentFees]);

  const handleCreateInvoice = async () => {
    if (!selectedStudentId || !selectedFeeTypeId || !invoiceAmount) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        studentId: selectedStudentId,                    // UUID string
        feeTypeId: String(selectedFeeTypeId),             // MUST be string like "ADMISSION_FEE"
        totalAmount: parseFloat(invoiceAmount) || 0,       // number, integer ya decimal
        dueDate: dueDate || undefined,
        // academicYearId optional hai → nahi bhej rahe, backend pe auto handle hoga
      };

      console.log('Sending payload:', payload); // ← YE ZAROOR ADD KARO DEBUG KE LIYE

      await adminService.createInvoice(payload);

      toast.success('Invoice created successfully!');
      setShowInvoiceDialog(false);

      // Reset form
      setSelectedStudentId('');
      setSelectedFeeTypeId('');
      setInvoiceAmount('');
      setIssueDate('');
      setDueDate('');
      setInvoiceNotes('');

      await fetchFeeData();
    } catch (error: any) {
      console.error('Full error:', error); // ← ye bhi add karo
      let errorMessage = 'Failed to create invoice. Please try again.';
      if (error instanceof ApiException) {
        errorMessage = getUserFriendlyError(error);
      } else if (error?.response?.data) {
        errorMessage = error.response.data.message.join(', ');
      }
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddExpense = async () => {
    if (!expenseCategory || !expenseDescription || !expenseAmount || !expenseDate) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateExpenseRequest = {
        category: expenseCategory.trim(),
        description: expenseDescription.trim(),
        amount: parseFloat(expenseAmount),
        date: expenseDate,
        time: expenseTime || undefined,
        paymentMethod: expensePaymentMethod || undefined,
        status: expenseStatus,
        approvedBy: expenseApprovedBy || undefined,
      };

      if (editingExpense) {
        // Update existing expense
        await adminService.updateExpense(editingExpense.id, payload);
        toast.success('Expense updated successfully!');
      } else {
        // Create new expense
        await adminService.createExpense(payload);
        toast.success('Expense added successfully!');
      }

      setShowExpenseDialog(false);
      resetExpenseForm();

      // Refresh expenses
      await fetchExpenses();
    } catch (error: any) {
      let errorMessage = editingExpense ? 'Failed to update expense' : 'Failed to add expense';
      if (error instanceof ApiException) {
        errorMessage = getUserFriendlyError(error);
      } else if (error?.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await adminService.deleteExpense(id);
      toast.success('Expense deleted successfully!');
      await fetchExpenses();
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      let errorMessage = 'Failed to delete expense';
      if (error instanceof ApiException) {
        errorMessage = getUserFriendlyError(error);
      }
      toast.error(errorMessage);
    }
  };

  const formatCurrency = (amount: number) => {
    return `PKR ${amount.toLocaleString('en-PK')}`;
  };

  const formatDateTime = (date: string | null, time: string | null) => {
    if (!date) return 'N/A';
    const dateStr = new Date(date).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    return time ? `${dateStr} at ${time}` : dateStr;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-white mb-2">Fee Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Track payments, invoices, and expenses</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'expenses' ? (
            <Button onClick={() => setShowExpenseDialog(true)} className="bg-[#0A66C2] hover:bg-[#0052A3]">
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          ) : (
            <Button onClick={() => setShowInvoiceDialog(true)} className="bg-[#0A66C2] hover:bg-[#0052A3]">
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards - Compact Gradient Cards */}
      {activeTab === 'invoices' || activeTab === 'reminders' || activeTab === 'reports' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-purple-600 to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
            <div className="absolute inset-0 bg-white/5"></div>
            <div className="relative">
              <p className="text-white/90 text-sm mb-2 font-medium">Total Fees</p>
              <h3 className="text-white text-3xl mb-1 tracking-tight">{formatCurrency(totalFees)}</h3>
              <p className="text-white/80 text-sm font-medium">This month</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
            <div className="absolute inset-0 bg-white/5"></div>
            <div className="relative">
              <p className="text-white/90 text-sm mb-2 font-medium">Collected</p>
              <h3 className="text-white text-3xl mb-1 tracking-tight">{formatCurrency(totalPaid)}</h3>
              <p className="text-white/80 text-sm font-medium">+12%</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
            <div className="absolute inset-0 bg-white/5"></div>
            <div className="relative">
              <p className="text-white/90 text-sm mb-2 font-medium">Pending Fees</p>
              <h3 className="text-white text-3xl mb-1 tracking-tight">{formatCurrency(totalDue)}</h3>
              <p className="text-white/80 text-sm font-medium">{studentFees.filter(r => r.status !== 'Paid').length} students</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-purple-600 to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
            <div className="absolute inset-0 bg-white/5"></div>
            <div className="relative">
              <p className="text-white/90 text-sm mb-2 font-medium">Total Expenses</p>
              <h3 className="text-white text-3xl mb-1 tracking-tight">{formatCurrency(totalExpenses)}</h3>
              <p className="text-white/80 text-sm font-medium">{expenses.length} entries</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-green-500 to-green-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
            <div className="absolute inset-0 bg-white/5"></div>
            <div className="relative">
              <p className="text-white/90 text-sm mb-2 font-medium">Paid Expenses</p>
              <h3 className="text-white text-3xl mb-1 tracking-tight">{formatCurrency(paidExpenses)}</h3>
              <p className="text-white/80 text-sm font-medium">{expenses.filter(e => e.status === 'Paid').length} transactions</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
            <div className="absolute inset-0 bg-white/5"></div>
            <div className="relative">
              <p className="text-white/90 text-sm mb-2 font-medium">Pending/Approved</p>
              <h3 className="text-white text-3xl mb-1 tracking-tight">{formatCurrency(pendingExpenses)}</h3>
              <p className="text-white/80 text-sm font-medium">{expenses.filter(e => e.status !== 'Paid').length} pending</p>
            </div>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="invoices">Invoices & Payments</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="reminders">Payment Reminders</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by student name or roll number..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={filterClass || 'all'} onValueChange={(val) => setFilterClass(val === 'all' ? undefined : val)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {availableClasses.map(cls => (
                    <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus || 'all'} onValueChange={(val) => setFilterStatus(val === 'all' ? undefined : val as any)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Partial">Partial</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  setSearchQuery('');
                  setFilterClass(undefined);
                  setFilterStatus(undefined);
                }}
              >
                Clear Filters
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-gray-600 dark:text-gray-400">Loading fee data...</p>
                </div>
              ) : filteredStudentFees.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-gray-600 dark:text-gray-400">No fee records found.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-gray-800">
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Payment Date & Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudentFees.map((record) => (
                      <TableRow key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <TableCell>
                          <div>
                            <p className="text-sm text-gray-900 dark:text-white">{record.studentName}</p>
                            {record.rollNo && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">{record.rollNo}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-300">{record.class}</TableCell>
                        <TableCell className="text-gray-900 dark:text-white">{formatCurrency(record.totalAmount || 0)}</TableCell>
                        <TableCell className="text-green-600">{formatCurrency(record.paidAmount || 0)}</TableCell>
                        <TableCell className={(record.dueAmount || 0) > 0 ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'}>
                          {formatCurrency(record.dueAmount || 0)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="text-gray-700 dark:text-gray-300">{formatDateTime(record.createdAt || '', record.createdTime || null)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {record.paidDate ? (
                              <p className="text-gray-700 dark:text-gray-300">{formatDateTime(record.paidDate, record.paidTime || null)}</p>
                            ) : record.dueDate ? (
                              <p className="text-orange-600">Due: {formatDateTime(record.dueDate, null)}</p>
                            ) : (
                              <p className="text-gray-400 dark:text-gray-600">Not paid</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              record.status === 'Paid' ? 'bg-green-100 text-green-700 border-green-200' :
                                record.status === 'Partial' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                  'bg-red-100 text-red-700 border-red-200'
                            }
                          >
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">View Invoice</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          {/* Expense Summary - Compact Gradient Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-purple-600 to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
              <div className="absolute inset-0 bg-white/5"></div>
              <div className="relative">
                <p className="text-white/90 text-sm mb-2 font-medium">Total Expenses</p>
                <h3 className="text-white text-3xl mb-1 tracking-tight">{formatCurrency(totalExpenses)}</h3>
                <p className="text-white/80 text-sm font-medium">{expenses.length} entries</p>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-green-500 to-green-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
              <div className="absolute inset-0 bg-white/5"></div>
              <div className="relative">
                <p className="text-white/90 text-sm mb-2 font-medium">Paid Expenses</p>
                <h3 className="text-white text-3xl mb-1 tracking-tight">{formatCurrency(paidExpenses)}</h3>
                <p className="text-white/80 text-sm font-medium">{expenses.filter(e => e.status === 'Paid').length} transactions</p>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
              <div className="absolute inset-0 bg-white/5"></div>
              <div className="relative">
                <p className="text-white/90 text-sm mb-2 font-medium">Pending/Approved</p>
                <h3 className="text-white text-3xl mb-1 tracking-tight">{formatCurrency(pendingExpenses)}</h3>
                <p className="text-white/80 text-sm font-medium">{expenses.filter(e => e.status !== 'Paid').length} pending</p>
              </div>
            </div>
          </div>

          <Card className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <h3 className="text-lg text-gray-900 dark:text-white">Expense Log</h3>
              <div className="flex-1"></div>
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Search expenses..." className="pl-10" />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800">
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Created On</TableHead>
                    <TableHead>Approved By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No expenses found
                      </TableCell>
                    </TableRow>
                  ) : (
                    expenses.map((expense) => (
                      <TableRow key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {expense.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-300 max-w-xs">
                          {expense.description}
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-white">
                          {formatCurrency(expense.amount || 0)}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {expense.paymentMethod || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="text-gray-700 dark:text-gray-300">{formatDateTime(expense.date, expense.time || null)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="text-gray-600 dark:text-gray-400">{formatDateTime(expense.createdAt || '', expense.createdTime || null)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {expense.approvedBy || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              expense.status === 'Paid' ? 'bg-green-100 text-green-700 border-green-200' :
                                expense.status === 'Approved' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                  'bg-yellow-100 text-yellow-700 border-yellow-200'
                            }
                          >
                            {expense.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditExpense(expense)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDeleteExpense(expense.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="reminders" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg text-gray-900 dark:text-white mb-4">Pending Payment Reminders</h3>
            <div className="space-y-3">
              {studentFees.filter(r => r.status !== 'Paid').map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white mb-1">{record.studentName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {record.class} • Due: {formatCurrency(record.dueAmount || 0)} • {record.dueDate ? `Deadline: ${record.dueDate}` : 'No deadline'}
                    </p>
                    {record.createdAt && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Created: {formatDateTime(record.createdAt, record.createdTime || null)}
                      </p>
                    )}
                  </div>
                  <Button size="sm" variant="outline">Send Reminder</Button>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg text-gray-900 dark:text-white mb-4">Fee Collection Summary</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Fees Generated</span>
                  <span className="text-gray-900 dark:text-white">{formatCurrency(totalFees)}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Amount Collected</span>
                  <span className="text-green-600">{formatCurrency(totalPaid)}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Pending Collection</span>
                  <span className="text-orange-600">{formatCurrency(totalDue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Collection Rate</span>
                  <span className="text-gray-900 dark:text-white">
                    {totalFees > 0 ? ((totalPaid / totalFees) * 100).toFixed(1) : '0.0'}%
                  </span>
                </div>
              </div>
              <Button className="w-full mt-6" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </Button>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg text-gray-900 dark:text-white mb-4">Expense Summary</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Expenses</span>
                  <span className="text-gray-900 dark:text-white">{formatCurrency(totalExpenses)}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Paid Expenses</span>
                  <span className="text-green-600">{formatCurrency(paidExpenses)}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Pending/Approved</span>
                  <span className="text-orange-600">{formatCurrency(pendingExpenses)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Net Balance</span>
                  <span className={totalPaid - paidExpenses > 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(totalPaid - paidExpenses)}
                  </span>
                </div>
              </div>
              <Button className="w-full mt-6" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </Button>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="text-lg text-gray-900 dark:text-white mb-4">Expense Breakdown by Category</h3>
            <div className="space-y-3">
              {(() => {
                // Get unique categories from expenses
                const categories = Array.from(new Set(expenses.map(e => e.category).filter(Boolean)));

                return categories.map(category => {
                  const categoryTotal = expenses
                    .filter(e => e.category === category)
                    .reduce((sum, e) => sum + (e.amount || 0), 0);
                  const percentage = totalExpenses > 0 ? (categoryTotal / totalExpenses) * 100 : 0;

                  if (categoryTotal === 0) return null;

                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300">{category}</span>
                        <span className="text-gray-900 dark:text-white">{formatCurrency(categoryTotal)}</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0A66C2]"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Invoice Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="max-w-2xl overflow-visible">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
            <DialogDescription>Generate a new fee invoice for a student</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] overflow-visible">
            <div className="space-y-4 py-4 pr-4">
              <div className="space-y-2">
                <Label htmlFor="student">Select Student *</Label>
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose student" />
                  </SelectTrigger>
                  <SelectContent
                    className="max-h-[300px]"
                    position="popper"
                    sideOffset={5}
                  >
                    {students.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">
                        {isLoading ? 'Loading students...' : 'No students available'}
                      </div>
                    ) : (
                      students.map(student => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name} {student.rollNo ? `- ${student.rollNo}` : ''}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="feeType">Fee Type *</Label>
                  <Select
                    value={selectedFeeTypeId}
                    onValueChange={(val) => {
                      setSelectedFeeTypeId(val);
                      const feeType = feeTypes.find(ft => ft.id === val);
                      if (feeType) {
                        setInvoiceAmount(feeType.amount.toString());
                      }
                    }}
                  >
                    <SelectTrigger id="feeType" className="w-full">
                      <SelectValue placeholder="Select fee type" />
                    </SelectTrigger>
                    <SelectContent
                      className="max-h-[300px]"
                      position="popper"
                      sideOffset={5}
                    >
                      {feeTypes.map(feeType => (
                        <SelectItem key={feeType.id} value={feeType.id}>
                          {feeType.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (PKR) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0"
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="issueDate">Issue Date</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes..."
                  rows={3}
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowInvoiceDialog(false);
              setSelectedStudentId('');
              setSelectedFeeTypeId('');
              setInvoiceAmount('');
              setIssueDate('');
              setDueDate('');
              setInvoiceNotes('');
            }}>Cancel</Button>
            <Button
              className="bg-[#0A66C2] hover:bg-[#0052A3]"
              onClick={handleCreateInvoice}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Generate Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Expense Dialog */}
      <Dialog open={showExpenseDialog} onOpenChange={(open) => {
        setShowExpenseDialog(open);
        if (!open) resetExpenseForm();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
            <DialogDescription>{editingExpense ? 'Update expense details' : 'Record a new expense transaction'}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 py-4 pr-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0) + cat.slice(1).toLowerCase().replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expenseAmount">Amount (PKR) *</Label>
                  <Input
                    id="expenseAmount"
                    type="number"
                    placeholder="0"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Enter expense details..."
                  rows={3}
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expenseDate">Date *</Label>
                  <Input
                    id="expenseDate"
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expenseTime">Time</Label>
                  <Input
                    id="expenseTime"
                    type="time"
                    value={expenseTime}
                    onChange={(e) => setExpenseTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select value={expensePaymentMethod} onValueChange={setExpensePaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={expenseStatus} onValueChange={(val) => setExpenseStatus(val as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="approvedBy">Approved By</Label>
                <Input
                  id="approvedBy"
                  placeholder="Enter approver name"
                  value={expenseApprovedBy}
                  onChange={(e) => setExpenseApprovedBy(e.target.value)}
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowExpenseDialog(false);
              resetExpenseForm();
            }}>Cancel</Button>
            <Button
              className="bg-[#0A66C2] hover:bg-[#0052A3]"
              onClick={handleAddExpense}
              disabled={isSubmitting}
            >
              {isSubmitting ? (editingExpense ? 'Updating...' : 'Adding...') : (editingExpense ? 'Update Expense' : 'Add Expense')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}