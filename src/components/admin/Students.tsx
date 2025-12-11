import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Plus, Download, MoreVertical, Eye, Edit, Trash2, X, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { toast } from 'sonner';
import { adminService } from '../../services';
import { AddStudentRequest, UpdateStudentRequest, Student as StudentType } from '../../types/student.types';
import { getUserFriendlyError } from '../../utils/errors';
import { ApiException } from '../../utils/errors';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

// Using StudentType from types to match API response
type Student = StudentType;

export function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  
  // Class view state (default: Grade 10)
  const [currentViewClass, setCurrentViewClass] = useState<string>('Grade 10');
  
  // Fetch students from API
  useEffect(() => {
    fetchStudents();
  }, [currentViewClass]); // Refetch when class view changes

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      // Extract grade from currentViewClass (e.g., "Grade 10" -> "Grade 10")
      const response = await adminService.getStudents({
        class: currentViewClass,
      });
      
      // Safety check for response
      if (!response || !response.students) {
        console.warn('Invalid API response structure:', response);
        setStudents([]);
        return;
      }
      
      // Normalize student data to match component expectations
      const normalizedStudents = (response.students || []).map((student: any) => ({
        ...student,
        id: student.id ? student.id.toString() : Math.random().toString(),
        name: student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown',
        class: student.class || currentViewClass,
        section: student.section || '',
        status: student.status || 'Active',
        attendance: typeof student.attendance === 'number' ? student.attendance : 0,
        email: student.email || '',
        phone: student.phone || '',
        rollNo: student.rollNo || '',
      }));
      
      setStudents(normalizedStudents);
      
      if (import.meta.env.DEV) {
        console.log('Fetched students:', {
          currentViewClass,
          students: normalizedStudents,
          count: normalizedStudents.length,
          rawResponse: response,
        });
      }
    } catch (error: any) {
      let errorMessage = 'Failed to load students. Please try again.';
      if (error instanceof ApiException) {
        errorMessage = getUserFriendlyError(error);
      } else if (error?.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
      console.error('Fetch students error:', error);
      setStudents([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter state
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [filterType, setFilterType] = useState<'status' | null>(null);
  const [selectedFilterStatus, setSelectedFilterStatus] = useState<'Active' | 'Inactive' | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [sectionId, setSectionId] = useState<string>('');
  const [phone, setPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [address, setAddress] = useState('');
  
  // Class and section data
  const [classUUID, setClassUUID] = useState<string | null>(null);
  const [availableSections, setAvailableSections] = useState<Array<{id: string; name: string}>>([
    { id: 'A', name: 'A' },
    { id: 'B', name: 'B' },
    { id: 'C', name: 'C' },
    { id: 'D', name: 'D' },
  ]);
  const [isLoadingClassData, setIsLoadingClassData] = useState(false);

  const handleViewProfile = async (student: Student) => {
    try {
      const response = await adminService.getStudentById(student.id);
      
      if (response.data) {
        const studentDetails: Student = {
          ...response.data,
          id: response.data.id || student.id,
          name: response.data.name || `${response.data.firstName || ''} ${response.data.lastName || ''}`.trim() || 'Unknown',
          class: response.data.class || student.class,
          section: response.data.section || student.section,
          status: response.data.status || 'Active',
          attendance: response.data.attendance || 0,
          email: response.data.email || '',
          phone: response.data.phone || '',
          rollNo: response.data.rollNo || '',
        };
        
        setSelectedStudent(studentDetails);
        setShowProfileDialog(true);
      } else {
        setSelectedStudent(student);
        setShowProfileDialog(true);
      }
    } catch (error: any) {
      console.error('Error fetching student details:', error);
      toast.error('Failed to load student details. Showing cached data.');
      setSelectedStudent(student);
      setShowProfileDialog(true);
    }
  };

  const handleExport = () => {
    toast.success('Downloading CSV', {
      description: 'Student data exported successfully',
    });
  };

  const handleCloseDialog = (open?: boolean) => {
    try {
      // Handle Dialog onOpenChange callback - only close if open is false
      if (open === false || open === undefined) {
        setShowAddDialog(false);
        setIsEditMode(false);
        setEditingStudentId(null);
        // Reset form when closing
        setFirstName('');
        setLastName('');
        setDob('');
        setSelectedClass('');
        setSectionId('');
        setPhone('');
        setParentPhone('');
        setAddress('');
        setClassUUID(null);
        setAvailableSections([
          { id: 'A', name: 'A' },
          { id: 'B', name: 'B' },
          { id: 'C', name: 'C' },
          { id: 'D', name: 'D' },
        ]);
        setIsLoadingClassData(false);
      }
    } catch (error) {
      console.error('Error closing dialog:', error);
      // Force close on error
      setShowAddDialog(false);
    }
  };
  
  const handleCloseDialogDirect = () => {
    // Direct close without callback parameter
    try {
      handleCloseDialog(false);
    } catch (error) {
      console.error('Error in handleCloseDialogDirect:', error);
      setShowAddDialog(false);
    }
  };
  
  // Fetch class UUID and sections when class is selected
  useEffect(() => {
    // Only fetch when dialog is open and class is selected
    if (!showAddDialog || !selectedClass || isEditMode) {
      return;
    }
    
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;
    
    const fetchClassData = async () => {
      if (!isMounted || !showAddDialog) return;
      
      setIsLoadingClassData(true);
      
      try {
        // Fetch class UUID immediately
        const classInfo = await adminService.getClassByName(selectedClass).catch((err) => {
          if (import.meta.env.DEV) {
            console.warn('Class API not available:', err);
          }
          return null;
        });
        
        if (!isMounted || !showAddDialog) return;
        
        if (classInfo && classInfo.uuid) {
          setClassUUID(classInfo.uuid);
          
          if (import.meta.env.DEV) {
            console.log('Class UUID fetched:', {
              className: selectedClass,
              classUUID: classInfo.uuid,
            });
          }
          
          // Fetch sections for this class
          if (classInfo.id) {
            const sections = await adminService.getSectionsByClass(classInfo.id).catch((err) => {
              if (import.meta.env.DEV) {
                console.warn('Sections API not available:', err);
              }
              return null;
            });
            
            if (isMounted && showAddDialog) {
              if (Array.isArray(sections) && sections.length > 0) {
                // Use API sections with their UUIDs
                const mappedSections = sections.map(s => ({ id: s.id, name: s.name }));
                setAvailableSections(mappedSections);
                
                if (import.meta.env.DEV) {
                  console.log('Sections loaded from API:', {
                    count: mappedSections.length,
                    sections: mappedSections,
                  });
                }
              } else {
                // If no sections from API, use default sections A, B, C, D
                setAvailableSections([
                  { id: 'A', name: 'A' },
                  { id: 'B', name: 'B' },
                  { id: 'C', name: 'C' },
                  { id: 'D', name: 'D' },
                ]);
                if (import.meta.env.DEV) {
                  console.warn('No sections from API, using defaults:', classInfo.id);
                }
              }
            }
          } else {
            // If no classInfo.id, still set default sections
            setAvailableSections([
              { id: 'A', name: 'A' },
              { id: 'B', name: 'B' },
              { id: 'C', name: 'C' },
              { id: 'D', name: 'D' },
            ]);
          }
        } else {
          // If classInfo not found, set default sections but keep trying
          setAvailableSections([
            { id: 'A', name: 'A' },
            { id: 'B', name: 'B' },
            { id: 'C', name: 'C' },
            { id: 'D', name: 'D' },
          ]);
          if (import.meta.env.DEV) {
            console.warn('Class info not found for:', selectedClass);
          }
        }
      } catch (error: any) {
        if (import.meta.env.DEV) {
          console.error('Error fetching class data:', error);
        }
        // On error, use default sections A, B, C, D
        setAvailableSections([
          { id: 'A', name: 'A' },
          { id: 'B', name: 'B' },
          { id: 'C', name: 'C' },
          { id: 'D', name: 'D' },
        ]);
      } finally {
        if (isMounted) {
          setIsLoadingClassData(false);
        }
      }
    };
    
    // Fetch immediately when class is selected (no delay)
    fetchClassData();
    
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [selectedClass, showAddDialog, isEditMode]);

  // Available classes - Grade 1 to Grade 10
  const availableClasses = useMemo(() => {
    return ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 
            'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'];
  }, []);

  // Filter students based on current view class, search and status filter
  const filteredStudents = useMemo(() => {
    // Safety check - ensure students is an array
    if (!Array.isArray(students) || students.length === 0) {
      return [];
    }

    let filtered = students;

    // First filter by current view class (always applied)
    filtered = filtered.filter(s => {
      if (!s.class) return false;
      return s.class.startsWith(currentViewClass);
    });

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => {
        const name = (s.name || '').toLowerCase();
        const rollNo = (s.rollNo || '').toLowerCase();
        const phone = (s.phone || '').toLowerCase();
        return name.includes(query) || rollNo.includes(query) || phone.includes(query);
      });
    }

    // Status filter
    if (filterType === 'status' && selectedFilterStatus) {
      filtered = filtered.filter(s => s.status === selectedFilterStatus);
    }

    return filtered;
  }, [students, currentViewClass, searchQuery, filterType, selectedFilterStatus]);

  // Handle edit student - fetch from API first
  const handleEditStudent = async (student: Student) => {
    try {
      const response = await adminService.getStudentById(student.id);
      
      if (response.data) {
        const studentData = response.data;
        
        setIsEditMode(true);
        setEditingStudentId(studentData.id || student.id);
        setSelectedStudent(studentData);
        
        setFirstName(studentData.firstName || '');
        setLastName(studentData.lastName || '');
        
        const studentClass = studentData.class || student.class;
        const classMatch = studentClass.match(/^(Grade \d+)/);
        if (classMatch) {
          setSelectedClass(classMatch[1]);
        } else {
          setSelectedClass(studentClass);
        }
        
        const sectionName = studentData.section || student.section;
        if (sectionName && availableSections.length > 0) {
          const section = availableSections.find(s => s.name === sectionName);
          if (section) {
            setSectionId(section.id);
          }
        }
        
        setPhone(studentData.phone || '');
        setDob(studentData.dateOfBirth || '');
        setParentPhone(studentData.parentPhone || '');
        setAddress(studentData.address || '');
        
        setShowAddDialog(true);
      } else {
        // Fallback to local data
        setIsEditMode(true);
        setEditingStudentId(student.id.toString());
        setSelectedStudent(student);
        
        const nameParts = (student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim()).split(' ');
        setFirstName(student.firstName || nameParts[0] || '');
        setLastName(student.lastName || nameParts.slice(1).join(' ') || '');
        
        const classMatch = student.class.match(/^(Grade \d+)([A-Z])?$/);
        if (classMatch) {
          setSelectedClass(classMatch[1]);
        } else {
          setSelectedClass(student.class);
        }
        
        setPhone(student.phone);
        setDob(student.dateOfBirth || '');
        setParentPhone(student.parentPhone || '');
        setAddress(student.address || '');
        
        setShowAddDialog(true);
      }
    } catch (error: any) {
      console.error('Error fetching student for edit:', error);
      toast.error('Failed to load student data. Using cached data.');
      
      setIsEditMode(true);
      setEditingStudentId(student.id.toString());
      setSelectedStudent(student);
      
      const nameParts = (student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim()).split(' ');
      setFirstName(student.firstName || nameParts[0] || '');
      setLastName(student.lastName || nameParts.slice(1).join(' ') || '');
      
      const classMatch = student.class.match(/^(Grade \d+)([A-Z])?$/);
      if (classMatch) {
        setSelectedClass(classMatch[1]);
      } else {
        setSelectedClass(student.class);
      }
      
      setPhone(student.phone);
      setDob(student.dateOfBirth || '');
      setParentPhone(student.parentPhone || '');
      setAddress(student.address || '');
      
      setShowAddDialog(true);
    }
  };

  // Handle delete student
  const handleDeleteStudent = (student: Student) => {
    setStudentToDelete(student);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;

    setIsDeleting(true);
    try {
      await adminService.deleteStudent(studentToDelete.id);
      
      setStudents(students.filter(s => s.id !== studentToDelete.id));
      toast.success(`Student "${studentToDelete.name}" deleted successfully`);
      setShowDeleteDialog(false);
      setStudentToDelete(null);
    } catch (error: any) {
      let errorMessage = 'Failed to delete student. Please try again.';
      
      if (error instanceof ApiException) {
        errorMessage = getUserFriendlyError(error);
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      console.error('Delete student error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle update student - call API
  const handleUpdateStudent = async () => {
    if (!editingStudentId) return;

    const missingFields: string[] = [];
    if (!firstName || firstName.trim() === '') missingFields.push('First Name');
    if (!lastName || lastName.trim() === '') missingFields.push('Last Name');
    if (!dob || dob.trim() === '') missingFields.push('Date of Birth');
    if (!selectedClass || selectedClass.trim() === '') missingFields.push('Class');
    if (!sectionId || sectionId.trim() === '') missingFields.push('Section');
    if (!phone || phone.trim() === '') missingFields.push('Phone');
    if (!address || address.trim() === '') missingFields.push('Address');
    
    if (missingFields.length > 0) {
      toast.error('Please fill all required fields', {
        description: `Missing: ${missingFields.join(', ')}`,
      });
      return;
    }

    let finalClassUUID = classUUID;
    if (!finalClassUUID && selectedClass) {
      try {
        const classInfo = await adminService.getClassByName(selectedClass);
        finalClassUUID = classInfo.uuid;
        setClassUUID(classInfo.uuid);
      } catch (error) {
        toast.error('Failed to load class information. Please try again.');
        return;
      }
    }

    if (!finalClassUUID) {
      toast.error('Class information not loaded. Please try again.');
      return;
    }

    setIsAddingOrUpdating(true);
    try {
      const requestData: UpdateStudentRequest = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: dob,
        address: address.trim(),
        phone: phone.trim(),
        sectionId: sectionId.trim(),
        parentPhone: parentPhone?.trim() || undefined,
      };

      if (import.meta.env.DEV) {
        console.log('Update Student Request:', {
          studentId: editingStudentId,
          requestData,
          classUUID: finalClassUUID,
        });
      }

      const response = await adminService.updateStudent(editingStudentId, requestData, finalClassUUID);

      if (response.data) {
        const updatedStudent: Student = {
          ...response.data,
          id: response.data.id || editingStudentId,
          name: response.data.name || `${firstName} ${lastName}`,
          class: response.data.class || selectedClass,
          section: response.data.section || availableSections.find(s => s.id === sectionId)?.name || '',
          status: response.data.status || 'Active',
          attendance: response.data.attendance || 0,
          email: response.data.email || '',
          phone: response.data.phone || phone,
          rollNo: response.data.rollNo || students.find(s => s.id === editingStudentId)?.rollNo || '',
    };

        setStudents(students.map(s => s.id === editingStudentId ? updatedStudent : s));
        toast.success(`Student "${firstName} ${lastName}" updated successfully`);
        
        setShowAddDialog(false);
        setIsEditMode(false);
        setEditingStudentId(null);
        handleCloseDialogDirect();
        
        // Refresh students list
        await fetchStudents();
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      let errorMessage = 'Failed to update student. Please try again.';
      
      if (error instanceof ApiException) {
        errorMessage = getUserFriendlyError(error);
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (Array.isArray(error?.response?.data?.errors)) {
        errorMessage = error.response.data.errors.join(', ');
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      if (import.meta.env.DEV) {
        console.error('Update student error:', {
          error,
          message: errorMessage,
          response: error?.response,
          data: error?.response?.data,
        });
      }
      
      toast.error(errorMessage);
    } finally {
      setIsAddingOrUpdating(false);
    }
  };

  // Handle filter
  const handleApplyFilter = () => {
    if (filterType === 'status' && !selectedFilterStatus) {
      toast.error('Please select a status');
      return;
    }
    setShowFilterDialog(false);
  };

  const handleClearFilter = () => {
    setFilterType(null);
    setSelectedFilterStatus('');
    toast.success('Filter cleared');
  };

  const handleAddStudent = async () => {
    // If in edit mode, call update instead
    if (isEditMode) {
      handleUpdateStudent();
      return;
    }

    // Validate required fields
    if (!firstName || !lastName || !dob || !selectedClass || !sectionId || !phone || !address) {
      toast.error('Please fill all required fields', {
        description: 'First name, last name, date of birth, class, section, phone, and address are required.',
      });
      return;
    }

    // Check if class UUID is available - if not, try to fetch it
    let finalClassUUID = classUUID;
    if (!finalClassUUID) {
      try {
        const classInfo = await adminService.getClassByName(selectedClass);
        if (classInfo && classInfo.uuid) {
          finalClassUUID = classInfo.uuid;
          setClassUUID(classInfo.uuid);
        } else {
          toast.error('Class information not loaded. Please wait or try again.');
          return;
        }
      } catch (error) {
        toast.error('Failed to load class information. Please try again.');
        return;
      }
    }

    // Final validation before API call
    if (!finalClassUUID || finalClassUUID.trim() === '') {
      toast.error('Class UUID is missing. Please try again.');
      return;
    }
    
    if (!sectionId || sectionId.trim() === '') {
      toast.error('Section is required. Please select a section.');
      return;
    }

    setIsAddingOrUpdating(true);
    try {
      // Prepare request data (without email and rollNo - auto-generated by backend)
      const requestData: AddStudentRequest = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: dob,
        address: address.trim(),
        phone: phone.trim(),
        sectionId: sectionId.trim(),
        parentPhone: parentPhone?.trim() || undefined,
      };

      if (import.meta.env.DEV) {
        console.log('Add Student Request:', {
          requestData,
          classUUID: finalClassUUID,
          allFields: {
            firstName: requestData.firstName,
            lastName: requestData.lastName,
            dateOfBirth: requestData.dateOfBirth,
            address: requestData.address,
            phone: requestData.phone,
            sectionId: requestData.sectionId,
            parentPhone: requestData.parentPhone,
          },
        });
      }

      // Call API to add student with class UUID in header
      const response = await adminService.addStudent(requestData, finalClassUUID);

      if (response.data) {
        // Show success toast
        toast.success(
          <div className="flex items-start gap-3 w-full">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <span className="font-semibold text-sm text-gray-900 dark:text-white leading-tight">Student added successfully</span>
              <span className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
                {response.data.name || `${firstName} ${lastName}`} has been added to the student list.
              </span>
            </div>
          </div>,
          {
            duration: 3000,
            icon: null, // Disable default icon to use our custom icon
          }
        );

        // Refresh students list
        await fetchStudents();
        
        // Reset form
        handleCloseDialogDirect();
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      let errorMessage = 'Failed to add student. Please try again.';
      
      // Parse error message from various possible locations
      if (error instanceof ApiException) {
        errorMessage = getUserFriendlyError(error);
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (Array.isArray(error?.response?.data?.errors)) {
        errorMessage = error.response.data.errors.join(', ');
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      if (import.meta.env.DEV) {
        console.error('Add student error:', {
          error,
          message: errorMessage,
          response: error?.response,
          data: error?.response?.data,
          requestData: {
            firstName,
            lastName,
            dob,
            address,
            phone,
            sectionId,
            classUUID: finalClassUUID,
          },
        });
      }
      
      toast.error(errorMessage);
    } finally {
      setIsAddingOrUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-white mb-2">Student Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage all student records and information</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Viewing:</span>
            <Select value={currentViewClass} onValueChange={setCurrentViewClass}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableClasses && availableClasses.length > 0 ? (
                  availableClasses.map((cls) => (
                    <SelectItem key={cls} value={cls}>
                      {cls}
                    </SelectItem>
                  ))
                ) : (
                  // Fallback options if no classes available
                  ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 
                   'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].map((cls) => (
                    <SelectItem key={cls} value={cls}>
                      {cls}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={async () => {
              // Reset form fields
              setIsEditMode(false);
              setEditingStudentId(null);
              setFirstName('');
              setLastName('');
              setDob('');
              setSectionId('');
              setPhone('');
              setParentPhone('');
              setAddress('');
              setClassUUID(null);
              setAvailableSections([
                { id: 'A', name: 'A' },
                { id: 'B', name: 'B' },
                { id: 'C', name: 'C' },
                { id: 'D', name: 'D' },
              ]);
              setIsLoadingClassData(false);
              
              // Set class first
              setSelectedClass(currentViewClass);
              
              // Open dialog
              setShowAddDialog(true);
              
              // Immediately try to fetch class UUID
              try {
                const classInfo = await adminService.getClassByName(currentViewClass);
                if (classInfo && classInfo.uuid) {
                  setClassUUID(classInfo.uuid);
                  
                  // Fetch sections
                  if (classInfo.id) {
                    const sections = await adminService.getSectionsByClass(classInfo.id).catch(() => null);
                    if (Array.isArray(sections) && sections.length > 0) {
                      setAvailableSections(sections.map(s => ({ id: s.id, name: s.name })));
                    }
                  }
                }
              } catch (error) {
                if (import.meta.env.DEV) {
                  console.warn('Failed to pre-fetch class data:', error);
                }
                // Continue anyway - useEffect will retry
              }
            }} 
            className="bg-[#0A66C2] hover:bg-[#0052A3]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Current View:</span>
            <Badge variant="outline" className="text-base px-3 py-1">
              {currentViewClass} Students
            </Badge>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'})
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search by name, roll no, or phone..." 
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
            {(filterType === 'status' && selectedFilterStatus) && (
              <span className="ml-1 w-2 h-2 bg-[#0A66C2] rounded-full"></span>
            )}
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800">
                <TableHead>Student</TableHead>
                <TableHead>Roll No</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      Loading students...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No students found for {currentViewClass}
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => {
                  // Safety checks for student data
                  const studentName = student.name || 'Unknown';
                  const studentEmail = student.email || '';
                  const studentRollNo = student.rollNo || 'N/A';
                  const studentClass = student.class || currentViewClass;
                  const studentPhone = student.phone || 'N/A';
                  const studentAttendance = typeof student.attendance === 'number' ? student.attendance : 0;
                  const initials = studentName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'ST';
                  
                  return (
                    <TableRow key={student.id || Math.random()} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-gradient-to-br from-[#0A66C2] to-[#0052A3] text-white">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm text-gray-900 dark:text-white">{studentName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{studentEmail}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">{studentRollNo}</TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">{studentClass}</TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">{studentPhone}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden max-w-[60px]">
                            <div
                              className="h-full bg-[#0A66C2]"
                              style={{ width: `${Math.min(100, Math.max(0, studentAttendance))}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-700 dark:text-gray-300">{studentAttendance}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={student.status === 'Active'}
                      onCheckedChange={(checked) => {
                        const newStatus = checked ? 'Active' : 'Inactive';
                        setStudents(students.map(s => 
                          s.id === student.id ? { ...s, status: newStatus } : s
                        ));
                        toast.success(
                          <div className="flex items-start gap-3 w-full">
                            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <div className="flex flex-col gap-1 flex-1 min-w-0">
                              <span className="font-semibold text-sm text-gray-900 dark:text-white leading-tight">Status updated</span>
                              <span className="text-xs text-gray-600 dark:text-gray-400 leading-tight">{studentName} is now {newStatus.toLowerCase()}.</span>
                            </div>
                          </div>,
                          {
                            duration: 2000,
                            icon: null,
                          }
                        );
                      }}
                      className="data-[state=checked]:bg-green-500 dark:data-[state=checked]:bg-green-600"
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
                        <DropdownMenuItem onClick={() => handleViewProfile(student)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditStudent(student)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDeleteStudent(student)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={(open) => {
        if (open === false) {
          handleCloseDialog(false);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Student' : 'Add New Student'}</DialogTitle>
            <DialogDescription>{isEditMode ? 'Update the student details below' : 'Fill in the student details below'}</DialogDescription>
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
              <Label htmlFor="dob">Date of Birth *</Label>
              <Input 
                id="dob" 
                type="date" 
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="address">Address *</Label>
              <Input 
                id="address" 
                placeholder="Enter full address" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class">Class *</Label>
              <Select 
                value={selectedClass} 
                onValueChange={setSelectedClass}
                disabled={!isEditMode && showAddDialog}
              >
                <SelectTrigger className={!isEditMode && showAddDialog ? "bg-gray-100 dark:bg-gray-800 cursor-not-allowed" : ""}>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Grade 1">Grade 1</SelectItem>
                  <SelectItem value="Grade 2">Grade 2</SelectItem>
                  <SelectItem value="Grade 3">Grade 3</SelectItem>
                  <SelectItem value="Grade 4">Grade 4</SelectItem>
                  <SelectItem value="Grade 5">Grade 5</SelectItem>
                  <SelectItem value="Grade 6">Grade 6</SelectItem>
                  <SelectItem value="Grade 7">Grade 7</SelectItem>
                  <SelectItem value="Grade 8">Grade 8</SelectItem>
                  <SelectItem value="Grade 9">Grade 9</SelectItem>
                  <SelectItem value="Grade 10">Grade 10</SelectItem>
                </SelectContent>
              </Select>
              {!isEditMode && showAddDialog && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Class is set to match current view ({currentViewClass})
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="section">Section *</Label>
              <Select 
                value={sectionId || ''} 
                onValueChange={(value) => {
                  // Set sectionId to the selected section's UUID
                  if (value && value.trim() !== '') {
                    setSectionId(value);
                    if (import.meta.env.DEV) {
                      console.log('Section selected:', {
                        sectionId: value,
                        sectionName: availableSections.find(s => s.id === value)?.name,
                      });
                    }
                  } else {
                    setSectionId('');
                  }
                }}
                disabled={isLoadingClassData}
              >
                <SelectTrigger className={isLoadingClassData ? "bg-gray-100 dark:bg-gray-800 cursor-not-allowed" : ""}>
                  <SelectValue placeholder={isLoadingClassData ? "Loading sections..." : availableSections.length === 0 ? "No sections available" : "Select section"} />
                </SelectTrigger>
                <SelectContent>
                  {availableSections.length > 0 ? (
                    availableSections.map((section) => {
                      // Ensure section.id is not empty
                      if (!section.id || section.id.trim() === '') {
                        return null;
                      }
                      return (
                        <SelectItem key={section.id} value={section.id}>
                          {section.name || section.id}
                        </SelectItem>
                      );
                    }).filter(Boolean)
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">
                      {isLoadingClassData ? "Loading sections..." : "No sections available"}
                    </div>
                  )}
                </SelectContent>
              </Select>
              {sectionId && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Selected: {availableSections.find(s => s.id === sectionId)?.name || sectionId}
                </p>
              )}
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
              <Label htmlFor="parentPhone">Parent Phone</Label>
              <Input 
                id="parentPhone" 
                type="tel" 
                placeholder="+1234567890" 
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialogDirect}>Cancel</Button>
            <Button className="bg-[#0A66C2] hover:bg-[#0052A3]" onClick={handleAddStudent}>
              {isEditMode ? 'Update Student' : 'Add Student'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Profile</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-6">
              <div className="flex items-start gap-6 pb-6 border-b border-gray-200 dark:border-gray-800">
                <Avatar className="w-24 h-24">
                  <AvatarFallback className="bg-gradient-to-br from-[#0A66C2] to-[#0052A3] text-white text-2xl">
                    {selectedStudent.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl text-gray-900 dark:text-white mb-1">{selectedStudent.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">{selectedStudent.rollNo} • {selectedStudent.class}</p>
                  <div className="flex gap-2">
                    <Badge variant={selectedStudent.status === 'Active' ? 'default' : 'secondary'} className={selectedStudent.status === 'Active' ? 'bg-green-100 text-green-700' : ''}>
                      {selectedStudent.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Email</h4>
                  <p className="text-gray-900 dark:text-white">{selectedStudent.email}</p>
                </div>
                <div>
                  <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Phone</h4>
                  <p className="text-gray-900 dark:text-white">{selectedStudent.phone}</p>
                </div>
                <div>
                  <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Attendance Rate</h4>
                  <p className="text-gray-900 dark:text-white">{selectedStudent.attendance}%</p>
                </div>
                <div>
                  <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Section</h4>
                  <p className="text-gray-900 dark:text-white">{selectedStudent.section}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4">
                <Card className="p-4 text-center">
                  <p className="text-2xl text-gray-900 dark:text-white mb-1">8.5</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">GPA</p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="text-2xl text-gray-900 dark:text-white mb-1">12</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Subjects</p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="text-2xl text-gray-900 dark:text-white mb-1">5</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Awards</p>
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
            <DialogTitle>Filter Students</DialogTitle>
            <DialogDescription>Filter students by status</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Filter By Status</Label>
              <Select 
                value={selectedFilterStatus || ''} 
                onValueChange={(value) => {
                  setFilterType('status');
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

            {selectedFilterStatus && (
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
              disabled={!selectedFilterStatus}
            >
              Apply Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the student
              <span className="font-semibold text-gray-900 dark:text-white">
                {' '}"{studentToDelete?.name}"
              </span>
              {' '}and all their associated data including attendance, grades, and records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setStudentToDelete(null)} disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
