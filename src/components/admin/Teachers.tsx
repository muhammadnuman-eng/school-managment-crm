import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Plus, Download, MoreVertical, Eye, Edit, Calendar, Trash2, X, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { adminService } from '../../services';
import { Teacher, AddTeacherRequest, UpdateTeacherRequest } from '../../types/teacher.types';
import { ApiException, getUserFriendlyError } from '../../utils/errors';
import { schoolStorage } from '../../utils/storage';

const normalizeTeacher = (t: any): Teacher => {
  if (!t) {
    console.warn('normalizeTeacher: Received null/undefined teacher data');
    return {
      id: `${Date.now()}`,
      name: 'Unnamed Teacher',
      employeeId: '',
      subject: '',
      qualification: '',
      experience: '',
      email: '',
      phone: '',
      classes: 0,
      performance: 0,
      status: 'Active',
      specialization: '',
      joiningDate: '',
      address: '',
    };
  }

  // Prioritize firstName/lastName from backend, fallback to name field
  const firstName = t?.firstName || '';
  const lastName = t?.lastName || '';
  const fullName = firstName && lastName 
    ? `${firstName} ${lastName}`.trim()
    : (t?.name || 'Unnamed Teacher');
  
  const normalized = {
    id: t?.id?.toString?.() || t?.uuid?.toString?.() || `${Date.now()}`,
    name: fullName,
    employeeId: t?.employeeId || '',
    subject: t?.subject || '',
    qualification: t?.qualification || '',
    experience: t?.experience || '',
    email: t?.email || '',
    phone: t?.phone || '',
    classes: typeof t?.classes === 'number' ? t.classes : 0,
    performance: typeof t?.performance === 'number' ? t.performance : 0,
    status: (t?.status as Teacher['status']) || 'Active',
    specialization: t?.specialization || '',
    joiningDate: t?.joiningDate || '',
    address: t?.address || '',
  };

  if (import.meta.env.DEV) {
    // Log first teacher normalization for debugging
    if (normalized.id && normalized.name !== 'Unnamed Teacher') {
      console.log('Normalize Teacher:', {
        raw: t,
        normalized: normalized,
        fields: {
          firstName: t?.firstName,
          lastName: t?.lastName,
          name: t?.name,
          subject: t?.subject,
          experience: t?.experience,
          employeeId: t?.employeeId,
        },
      });
    }
  }
  
  return normalized;
};

const timetable = [
  {
    day: 'Monday', periods: [
      { time: '08:00-09:00', class: 'Grade 10A', subject: 'Mathematics', teacher: 'Dr. Sarah Mitchell' },
      { time: '09:00-10:00', class: 'Grade 9B', subject: 'Physics', teacher: 'Prof. Michael Chen' },
      { time: '10:00-11:00', class: 'Grade 11A', subject: 'English', teacher: 'Ms. Emma Wilson' },
      { time: '11:00-12:00', class: 'Grade 12A', subject: 'Chemistry', teacher: 'Mr. David Brown' },
    ]
  },
  {
    day: 'Tuesday', periods: [
      { time: '08:00-09:00', class: 'Grade 9A', subject: 'Mathematics', teacher: 'Dr. Sarah Mitchell' },
      { time: '09:00-10:00', class: 'Grade 10B', subject: 'Physics', teacher: 'Prof. Michael Chen' },
      { time: '10:00-11:00', class: 'Grade 8A', subject: 'English', teacher: 'Ms. Emma Wilson' },
      { time: '11:00-12:00', class: 'Grade 11B', subject: 'Chemistry', teacher: 'Mr. David Brown' },
    ]
  },
];

export function Teachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  
  // Filter state
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [filterType, setFilterType] = useState<'status' | 'subject' | null>(null);
  const [selectedFilterStatus, setSelectedFilterStatus] = useState<'Active' | 'Inactive' | ''>('');
  const [selectedFilterSubject, setSelectedFilterSubject] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [qualification, setQualification] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [experience, setExperience] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [address, setAddress] = useState('');

  const handleDeleteTeacher = async (teacher: Teacher) => {
    const confirmed = window.confirm(`Delete ${teacher.name}? This cannot be undone.`);
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await adminService.deleteTeacher(teacher.id);
      setTeachers(teachers.filter(t => t.id !== teacher.id));
      toast.success(
        <div className="flex items-start gap-3 w-full">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <span className="font-semibold text-sm text-gray-900 dark:text-white leading-tight">Teacher deleted</span>
            <span className="text-xs text-gray-600 dark:text-gray-400 leading-tight">{teacher.name} has been removed.</span>
          </div>
        </div>,
        { duration: 3000, icon: null }
      );
    } catch (error: any) {
      let message = 'Failed to delete teacher.';
      if (error instanceof ApiException) {
        message = getUserFriendlyError(error);
      } else if (error?.message) {
        message = error.message;
      }
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (teacher: Teacher, checked: boolean) => {
    const newStatus: Teacher['status'] = checked ? 'Active' : 'Inactive';
    setTeachers(teachers.map(t => t.id === teacher.id ? { ...t, status: newStatus } : t));
    try {
      // Convert to uppercase for API (API expects ACTIVE/INACTIVE)
      const apiStatus = checked ? 'ACTIVE' : 'INACTIVE';
      await adminService.updateTeacher(teacher.id, { status: apiStatus as any });
    } catch (error: any) {
      // revert on failure
      setTeachers(teachers.map(t => t.id === teacher.id ? { ...t, status: teacher.status } : t));
      let message = 'Failed to update status.';
      if (error instanceof ApiException) {
        message = getUserFriendlyError(error);
      } else if (error?.message) {
        message = error.message;
      }
      toast.error(message);
      return;
    }

    toast.success(
      <div className="flex items-start gap-3 w-full">
        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <span className="font-semibold text-sm text-gray-900 dark:text-white leading-tight">Status updated</span>
          <span className="text-xs text-gray-600 dark:text-gray-400 leading-tight">{teacher.name} is now {newStatus?.toLowerCase()}.</span>
        </div>
      </div>,
      { duration: 2000, icon: null }
    );
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setIsLoading(true);
    try {
      const response = await adminService.getTeachers();
      
      if (import.meta.env.DEV) {
        console.log('FetchTeachers - Response from service:', {
          response,
          responseType: typeof response,
          isArray: Array.isArray(response),
          hasTeachers: !!(response as any)?.teachers,
          teachersIsArray: Array.isArray((response as any)?.teachers),
          teachersCount: Array.isArray((response as any)?.teachers) ? (response as any).teachers.length : 0,
          firstTeacherRaw: Array.isArray((response as any)?.teachers) ? (response as any).teachers[0] : null,
        });
      }
      
      // Handle different response structures
      let teachersList: any[] = [];
      
      // If response is directly an array
      if (Array.isArray(response)) {
        teachersList = response;
      } 
      // If response has teachers property
      else if (response && typeof response === 'object' && (response as any).teachers) {
        if (Array.isArray((response as any).teachers)) {
          teachersList = (response as any).teachers;
        }
      }
      // If response.data exists
      else if (response && typeof response === 'object' && (response as any).data) {
        if (Array.isArray((response as any).data)) {
          teachersList = (response as any).data;
        } else if (Array.isArray((response as any).data?.teachers)) {
          teachersList = (response as any).data.teachers;
        }
      }
      
      if (import.meta.env.DEV) {
        console.log('Fetched Teachers - After Processing:', {
          teachersList,
          count: teachersList.length,
          firstTeacherRaw: teachersList[0],
          firstTeacherNormalized: teachersList[0] ? normalizeTeacher(teachersList[0]) : null,
          allTeachersRaw: teachersList,
        });
      }
      
      // Normalize and set teachers
      const normalizedTeachers = teachersList.map((teacher, index) => {
        const normalized = normalizeTeacher(teacher);
        if (import.meta.env.DEV && index === 0) {
          console.log('Normalize Example:', {
            raw: teacher,
            normalized: normalized,
          });
        }
        return normalized;
      });
      
      setTeachers(normalizedTeachers);
      
      if (import.meta.env.DEV) {
        console.log('Final Teachers State:', {
          count: normalizedTeachers.length,
          teachers: normalizedTeachers,
        });
      }
    } catch (error: any) {
      console.error('Fetch Teachers Error:', error);
      let message = 'Failed to load teachers. Please try again.';
      if (error instanceof ApiException) {
        message = getUserFriendlyError(error);
      } else if (error?.message) {
        message = error.message;
      }
      toast.error(message);
      setTeachers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique subjects from teachers
  const availableSubjects = useMemo(() => {
    const subjects = teachers.map(t => t.subject);
    return Array.from(new Set(subjects)).sort();
  }, [teachers]);

  // Filter teachers based on search and filters
  const filteredTeachers = useMemo(() => {
    let filtered = teachers;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.employeeId.toLowerCase().includes(query) ||
        t.subject.toLowerCase().includes(query) ||
        t.email.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterType === 'status' && selectedFilterStatus) {
      filtered = filtered.filter(t => t.status === selectedFilterStatus);
    }

    // Subject filter
    if (filterType === 'subject' && selectedFilterSubject) {
      filtered = filtered.filter(t => t.subject === selectedFilterSubject);
    }

    return filtered;
  }, [teachers, searchQuery, filterType, selectedFilterStatus, selectedFilterSubject]);

  const handleViewProfile = async (teacher: Teacher) => {
    try {
      const response = await adminService.getTeacherById(teacher.id);
      
      if (import.meta.env.DEV) {
        console.log('View Profile Response:', {
          teacherId: teacher.id,
          response,
          data: response.data,
        });
      }
      
      const data = response.data ? normalizeTeacher(response.data) : teacher;
      setSelectedTeacher(data);
      setShowProfileDialog(true);
    } catch (error: any) {
      let message = 'Failed to load teacher profile.';
      if (error instanceof ApiException) {
        message = getUserFriendlyError(error);
      } else if (error?.message) {
        message = error.message;
      }
      toast.error(message);
      // Fallback to using cached teacher data
      setSelectedTeacher(teacher);
      setShowProfileDialog(true);
    }
  };

  const handleExport = () => {
    toast.success(
      <div className="flex items-start gap-3 w-full">
        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <span className="font-semibold text-sm text-gray-900 dark:text-white leading-tight">Downloading CSV</span>
          <span className="text-xs text-gray-600 dark:text-gray-400 leading-tight">Teacher data exported successfully</span>
        </div>
      </div>,
      {
        duration: 2000,
        icon: null,
      }
    );
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setIsEditMode(false);
    setEditingTeacherId(null);
    // Reset form
    setFirstName('');
    setLastName('');
    setEmployeeId('');
    setSelectedSubject('');
    setQualification('');
    setSpecialization('');
    setExperience('');
    setEmail('');
    setPhone('');
    setJoiningDate('');
    setAddress('');
  };

  const handleEditTeacher = async (teacher: Teacher) => {
    setIsEditMode(true);
    setEditingTeacherId(teacher.id);
    setSelectedTeacher(teacher);
    
    // Fetch fresh data from API to ensure we have latest data
    try {
      const response = await adminService.getTeacherById(teacher.id);
      const freshTeacher = response.data ? normalizeTeacher(response.data) : teacher;
      
      // Use firstName/lastName if available, otherwise split name
      if (response.data?.firstName && response.data?.lastName) {
        setFirstName(response.data.firstName);
        setLastName(response.data.lastName);
      } else {
        // Fallback: Extract first and last name from name field
        const nameParts = freshTeacher.name.split(' ');
        setFirstName(nameParts[0] || '');
        setLastName(nameParts.slice(1).join(' ') || '');
      }
      
      setEmployeeId(freshTeacher.employeeId);
      setSelectedSubject(freshTeacher.subject);
      setQualification(freshTeacher.qualification || '');
      setSpecialization(freshTeacher.specialization || '');
      setExperience(freshTeacher.experience || '');
      setEmail(freshTeacher.email);
      setPhone(freshTeacher.phone);
      setJoiningDate(freshTeacher.joiningDate || '');
      setAddress(freshTeacher.address || '');
      
      setShowAddDialog(true);
    } catch (error: any) {
      // Fallback to using cached teacher data if API fails
      const nameParts = teacher.name.split(' ');
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
      
      setEmployeeId(teacher.employeeId);
      setSelectedSubject(teacher.subject);
      setQualification(teacher.qualification || '');
      setSpecialization(teacher.specialization || '');
      setExperience(teacher.experience || '');
      setEmail(teacher.email);
      setPhone(teacher.phone);
      setJoiningDate(teacher.joiningDate || '');
      setAddress(teacher.address || '');
      
      setShowAddDialog(true);
      
      // Show warning but don't block editing
      if (import.meta.env.DEV) {
        console.warn('Failed to fetch fresh teacher data, using cached data:', error);
      }
    }
  };

  const handleUpdateTeacher = async () => {
    if (!editingTeacherId) return;

    if (!firstName || !lastName || !employeeId || !selectedSubject || !qualification || !email || !phone) {
      toast.error('Please fill all required fields', {
        description: 'First name, last name, employee ID, subject, qualification, email, and phone are required.',
      });
      return;
    }

    // Trim and validate fields
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedEmail = email.trim();

    // Validate firstName and lastName are non-empty strings
    if (!trimmedFirst || trimmedFirst.length === 0) {
      toast.error('Invalid first name', {
        description: 'First name must be a non-empty string.',
      });
      return;
    }

    if (!trimmedLast || trimmedLast.length === 0) {
      toast.error('Invalid last name', {
        description: 'Last name must be a non-empty string.',
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      toast.error('Invalid email format', {
        description: 'Please enter a valid email address.',
      });
      return;
    }

    const employeeIdExists = teachers.some(t => t.employeeId === employeeId && t.id !== editingTeacherId);
    if (employeeIdExists) {
      toast.error('Employee ID already exists', {
        description: 'Please use a different employee ID.',
      });
      return;
    }

    const payload: UpdateTeacherRequest = {
      name: `${trimmedFirst} ${trimmedLast}`.trim(),
      firstName: trimmedFirst,
      lastName: trimmedLast,
      employeeId: employeeId.trim(),
      subject: selectedSubject.trim(),
      qualification: qualification.trim(),
      specialization: specialization.trim(),
      experience: experience.trim(),
      email: trimmedEmail,
      phone: phone.trim(),
      joiningDate: joiningDate.trim(),
      address: address.trim(),
    };

    setIsSubmitting(true);
    try {
      const response = await adminService.updateTeacher(editingTeacherId, payload);
      
      if (import.meta.env.DEV) {
        console.log('Update Teacher Success Response:', {
          response,
          data: response.data,
          normalized: normalizeTeacher(response.data),
        });
      }
      
      const updatedTeacher = normalizeTeacher(response.data);
      
      // Refresh teachers list to get latest data from backend
      await fetchTeachers();

      toast.success(
        <div className="flex items-start gap-3 w-full">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <span className="font-semibold text-sm text-gray-900 dark:text-white leading-tight">Teacher updated successfully</span>
            <span className="text-xs text-gray-600 dark:text-gray-400 leading-tight">{updatedTeacher.name} has been updated.</span>
          </div>
        </div>,
        {
          duration: 3000,
          icon: null,
        }
      );

      handleCloseDialog();
    } catch (error: any) {
      let message = 'Failed to update teacher.';
      if (error instanceof ApiException) {
        message = getUserFriendlyError(error);
      } else if (error?.message) {
        message = error.message;
      }
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTeacher = async () => {
    if (isEditMode) {
      await handleUpdateTeacher();
      return;
    }

    // Validate required fields
    if (!firstName || !lastName || !employeeId || !selectedSubject || !qualification || !email || !phone) {
      toast.error('Please fill all required fields', {
        description: 'First name, last name, employee ID, subject, qualification, email, and phone are required.',
      });
      return;
    }

    // Trim and validate fields
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedEmail = email.trim();

    // Validate firstName and lastName are non-empty strings
    if (!trimmedFirst || trimmedFirst.length === 0) {
      toast.error('Invalid first name', {
        description: 'First name must be a non-empty string.',
      });
      return;
    }

    if (!trimmedLast || trimmedLast.length === 0) {
      toast.error('Invalid last name', {
        description: 'Last name must be a non-empty string.',
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      toast.error('Invalid email format', {
        description: 'Please enter a valid email address.',
      });
      return;
    }

    // Get schoolId from storage
    const schoolId = schoolStorage.getSchoolId();
    if (!schoolId) {
      toast.error('School ID not found', {
        description: 'Please login again or select a school.',
      });
      return;
    }

    const employeeIdExists = teachers.some(t => t.employeeId === employeeId);
    if (employeeIdExists) {
      toast.error('Employee ID already exists', {
        description: 'Please use a different employee ID.',
      });
      return;
    }

    const trimmedEmployeeId = employeeId.trim();
    const trimmedSubject = selectedSubject.trim();
    const trimmedQualification = qualification.trim();
    const trimmedSpecialization = specialization.trim();
    const trimmedExperience = experience.trim();
    const trimmedPhone = phone.trim();
    const trimmedJoining = joiningDate.trim();
    const trimmedAddress = address.trim();

    const tempPassword = trimmedPhone && trimmedPhone.length >= 6
      ? `P@${trimmedPhone.slice(-6)}`
      : 'Temp@1234';

    const payload: AddTeacherRequest = {
      name: `${trimmedFirst} ${trimmedLast}`.trim(),
      firstName: trimmedFirst,
      lastName: trimmedLast,
      employeeId: trimmedEmployeeId,
      subject: trimmedSubject,
      qualification: trimmedQualification,
      specialization: trimmedSpecialization,
      experience: trimmedExperience,
      email: trimmedEmail,
      phone: trimmedPhone,
      joiningDate: trimmedJoining,
      address: trimmedAddress,
      password: tempPassword,
      schoolId: schoolId, // Add schoolId from storage
    };

    setIsSubmitting(true);
    try {
      const response = await adminService.addTeacher(payload);
      
      if (import.meta.env.DEV) {
        console.log('Add Teacher Success Response:', {
          response,
          data: response.data,
          normalized: normalizeTeacher(response.data),
        });
      }
      
      const newTeacher = normalizeTeacher(response.data);
      
      // Refresh teachers list to get latest data from backend
      await fetchTeachers();

      toast.success(
        <div className="flex items-start gap-3 w-full">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <span className="font-semibold text-sm text-gray-900 dark:text-white leading-tight">Teacher added successfully</span>
            <span className="text-xs text-gray-600 dark:text-gray-400 leading-tight">{newTeacher.name} has been added to the teacher list.</span>
          </div>
        </div>,
        {
          duration: 3000,
          icon: null,
        }
      );

      handleCloseDialog();
    } catch (error: any) {
      let message = 'Failed to add teacher.';
      if (error instanceof ApiException) {
        message = getUserFriendlyError(error);
      } else if (error?.message) {
        message = error.message;
      }
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyFilter = () => {
    if (filterType === 'status' && !selectedFilterStatus) {
      toast.error('Please select a status');
      return;
    }
    if (filterType === 'subject' && !selectedFilterSubject) {
      toast.error('Please select a subject');
      return;
    }
    setShowFilterDialog(false);
  };

  const handleClearFilter = () => {
    setFilterType(null);
    setSelectedFilterStatus('');
    setSelectedFilterSubject('');
    toast.success('Filter cleared');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-white mb-2">Teacher Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage teachers, schedules, and performance</p>
        </div>
        <Button 
          onClick={() => {
            setIsEditMode(false);
            setEditingTeacherId(null);
            handleCloseDialog();
            setShowAddDialog(true);
          }} 
          className="bg-[#0A66C2] hover:bg-[#0052A3]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Teacher
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">Teacher List</TabsTrigger>
          <TabsTrigger value="timetable">Timetable</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="Search by name, employee ID, or subject..." 
                  className="pl-10" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => setShowFilterDialog(true)}
              >
                <Filter className="w-4 h-4" />
                Filter
                {(filterType === 'status' && selectedFilterStatus) || (filterType === 'subject' && selectedFilterSubject) ? (
                  <span className="ml-1 w-2 h-2 bg-[#0A66C2] rounded-full"></span>
                ) : null}
              </Button>
              <Button variant="outline" className="gap-2" onClick={handleExport}>
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center py-10 text-gray-500 dark:text-gray-400">
                  Loading teachers...
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-gray-800">
                      <TableHead>Teacher</TableHead>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Qualification</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>Classes</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeachers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-gray-500 dark:text-gray-400">
                          No teachers found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTeachers.map((teacher) => (
                        <TableRow key={teacher.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-gradient-to-br from-[#0A66C2] to-[#0052A3] text-white">
                                  {teacher.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm text-gray-900 dark:text-white">{teacher.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{teacher.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-700 dark:text-gray-300">{teacher.employeeId}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{teacher.subject}</Badge>
                          </TableCell>
                          <TableCell className="text-gray-700 dark:text-gray-300">{teacher.qualification}</TableCell>
                          <TableCell className="text-gray-700 dark:text-gray-300">{teacher.experience}</TableCell>
                          <TableCell className="text-gray-700 dark:text-gray-300">{teacher.classes}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden max-w-[60px]">
                                <div
                                  className="h-full bg-green-500"
                                  style={{ width: `${teacher.performance}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-700 dark:text-gray-300">{teacher.performance}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={teacher.status === 'Active'}
                              onCheckedChange={(checked) => handleToggleStatus(teacher, checked as boolean)}
                              className="status-toggle-switch"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewProfile(teacher)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditTeacher(teacher)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Calendar className="w-4 h-4 mr-2" />
                                  View Schedule
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteTeacher(teacher)}>
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
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="timetable" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg text-gray-900 dark:text-white mb-4">Weekly Timetable</h3>
            <div className="space-y-4">
              {timetable.map((day) => (
                <div key={day.day} className="border rounded-lg p-4">
                  <h4 className="text-gray-900 dark:text-white mb-3">{day.day}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {day.periods.map((period, index) => (
                      <Card key={index} className="p-3 bg-gradient-to-br from-[#E8F0FE] to-white dark:from-gray-800 dark:to-gray-900">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{period.time}</p>
                        <p className="text-sm text-gray-900 dark:text-white mb-1">{period.class}</p>
                        <p className="text-xs text-[#0A66C2]">{period.subject}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{period.teacher}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredTeachers.map((teacher) => (
              <Card key={teacher.id} className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-gradient-to-br from-[#0A66C2] to-[#0052A3] text-white">
                      {teacher.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white">{teacher.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{teacher.subject}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Performance</span>
                      <span className="text-gray-900 dark:text-white">{teacher.performance}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${teacher.performance}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Classes</span>
                    <span className="text-gray-900 dark:text-white">{teacher.classes}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Experience</span>
                    <span className="text-gray-900 dark:text-white">{teacher.experience}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Teacher Dialog */}
      <Dialog open={showAddDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Teacher' : 'Add New Teacher'}</DialogTitle>
            <DialogDescription>{isEditMode ? 'Update the teacher details below' : 'Fill in the teacher details below'}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input 
                id="firstName" 
                placeholder="Enter first name" 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input 
                id="lastName" 
                placeholder="Enter last name" 
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID *</Label>
              <Input 
                id="employeeId" 
                placeholder="Enter employee ID" 
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Physics">Physics</SelectItem>
                  <SelectItem value="Chemistry">Chemistry</SelectItem>
                  <SelectItem value="Biology">Biology</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="History">History</SelectItem>
                  <SelectItem value="Geography">Geography</SelectItem>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qualification">Qualification *</Label>
              <Select value={qualification} onValueChange={setQualification}>
                <SelectTrigger>
                  <SelectValue placeholder="Select qualification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PhD">PhD</SelectItem>
                  <SelectItem value="MSc">MSc</SelectItem>
                  <SelectItem value="MA">MA</SelectItem>
                  <SelectItem value="BSc">BSc</SelectItem>
                  <SelectItem value="BA">BA</SelectItem>
                  <SelectItem value="BEd">BEd</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialization">Specialization</Label>
              <Input 
                id="specialization" 
                placeholder="Enter specialization" 
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience">Experience *</Label>
              <Input 
                id="experience" 
                placeholder="e.g., 5 years" 
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="joiningDate">Joining Date</Label>
              <Input 
                id="joiningDate" 
                type="date" 
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="email">Email *</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="teacher@school.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input 
                id="phone" 
                type="tel" 
                placeholder="+1234567890" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input 
                id="address" 
                placeholder="Enter full address" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button
              className="bg-[#0A66C2] hover:bg-[#0052A3]"
              onClick={handleAddTeacher}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update Teacher' : 'Add Teacher'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Teacher Profile</DialogTitle>
          </DialogHeader>
          {selectedTeacher && (
            <div className="space-y-6">
              <div className="flex items-start gap-6 pb-6 border-b border-gray-200 dark:border-gray-800">
                <Avatar className="w-24 h-24">
                  <AvatarFallback className="bg-gradient-to-br from-[#0A66C2] to-[#0052A3] text-white text-2xl">
                    {selectedTeacher.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl text-gray-900 dark:text-white mb-1">{selectedTeacher.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">{selectedTeacher.employeeId} • {selectedTeacher.subject}</p>
                  <div className="flex gap-2">
                    <Badge variant={selectedTeacher.status === 'Active' ? 'default' : 'secondary'} className={selectedTeacher.status === 'Active' ? 'bg-green-100 text-green-700' : ''}>
                      {selectedTeacher.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Email</h4>
                  <p className="text-gray-900 dark:text-white">{selectedTeacher.email}</p>
                </div>
                <div>
                  <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Phone</h4>
                  <p className="text-gray-900 dark:text-white">{selectedTeacher.phone}</p>
                </div>
                <div>
                  <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Qualification</h4>
                  <p className="text-gray-900 dark:text-white">{selectedTeacher.qualification}</p>
                </div>
                <div>
                  <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Experience</h4>
                  <p className="text-gray-900 dark:text-white">{selectedTeacher.experience}</p>
                </div>
                <div>
                  <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Performance</h4>
                  <p className="text-gray-900 dark:text-white">{selectedTeacher.performance}%</p>
                </div>
                <div>
                  <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Classes</h4>
                  <p className="text-gray-900 dark:text-white">{selectedTeacher.classes}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4">
                <Card className="p-4 text-center">
                  <p className="text-2xl text-gray-900 dark:text-white mb-1">{selectedTeacher.classes}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Classes</p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="text-2xl text-gray-900 dark:text-white mb-1">{selectedTeacher.performance}%</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Performance</p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="text-2xl text-gray-900 dark:text-white mb-1">{selectedTeacher.experience}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Experience</p>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Filter Dialog */}
      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Filter Teachers</DialogTitle>
            <DialogDescription>Filter teachers by status or subject</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Filter By</Label>
              <Select 
                value={filterType || ''} 
                onValueChange={(value) => {
                  setFilterType(value as 'status' | 'subject' | null);
                  setSelectedFilterStatus('');
                  setSelectedFilterSubject('');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select filter type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="subject">Subject</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filterType === 'status' && (
              <div className="space-y-2">
                <Label>Filter By Status</Label>
                <Select 
                  value={selectedFilterStatus || ''} 
                  onValueChange={(value) => {
                    setSelectedFilterStatus(value as 'Active' | 'Inactive');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {filterType === 'subject' && (
              <div className="space-y-2">
                <Label>Filter By Subject</Label>
                <Select 
                  value={selectedFilterSubject || ''} 
                  onValueChange={setSelectedFilterSubject}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(selectedFilterStatus || selectedFilterSubject) && (
              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilter}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear Filter
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFilterDialog(false)}>Cancel</Button>
            <Button 
              className="bg-[#0A66C2] hover:bg-[#0052A3]" 
              onClick={handleApplyFilter}
              disabled={!selectedFilterStatus && !selectedFilterSubject}
            >
              Apply Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
