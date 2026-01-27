import { useState, useMemo, useEffect, useRef } from 'react';
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
  const [isAddingOrUpdating, setIsAddingOrUpdating] = useState(false);

  // Class view state - restore from localStorage or default to Class 10
  const [currentViewClass, setCurrentViewClass] = useState<string>(() => {
    const savedClass = localStorage.getItem('students_current_view_class');
    // Convert old "Grade X" format to "Class X" if needed
    if (savedClass && savedClass.startsWith('Grade ')) {
      const convertedClass = savedClass.replace(/^Grade /i, 'Class ');
      localStorage.setItem('students_current_view_class', convertedClass);
      return convertedClass;
    }
    return savedClass || 'Class 10';
  });

  // Save currentViewClass to localStorage whenever it changes
  useEffect(() => {
    if (currentViewClass) {
      localStorage.setItem('students_current_view_class', currentViewClass);
    }
  }, [currentViewClass]);

  // Helper function to normalize status - defined at component level for reuse
  const normalizeStatus = (status: string): 'Active' | 'Inactive' => {
    if (!status) return 'Active';
    const upperStatus = status.toUpperCase();
    if (upperStatus === 'ACTIVE') return 'Active';
    if (upperStatus === 'INACTIVE') return 'Inactive';
    return 'Active'; // Default
  };

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

      // Handle different response structures
      // The adminService.getStudents returns StudentsResponse which has a 'students' property
      let studentsArray: any[] = [];

      // Check if response has students array (standard StudentsResponse)
      if (response?.students && Array.isArray(response.students)) {
        studentsArray = response.students;
      }
      // Check if response itself is an array (fallback)
      else if (Array.isArray(response)) {
        studentsArray = response;
      }

      if (import.meta.env.DEV) {
        console.log('Students array extracted:', {
          studentsArrayLength: studentsArray.length,
          responseStructure: response,
          hasStudents: !!response?.students,
          isArray: Array.isArray(response),
        });
      }

      if (studentsArray.length === 0) {
        setStudents([]);
        if (import.meta.env.DEV) {
          console.log('No students found for:', currentViewClass);
        }
        return;
      }

      // Helper function to convert class name format (e.g., "class3" -> "Class 3")
      const normalizeClassName = (className: string): string => {
        if (!className) return currentViewClass;

        // If already in "Class X" format, return as is
        if (className.match(/^Class \d+$/i)) {
          return className.charAt(0).toUpperCase() + className.slice(1).toLowerCase();
        }

        // Convert "class3" or "class 3" or "grade3" or "grade 3" to "Class 3"
        const match = className.match(/(?:class|grade)\s*(\d+)/i);
        if (match) {
          return `Class ${match[1]}`;
        }

        return className;
      };

      // Normalize student data to match component expectations
      const normalizedStudents = studentsArray.map((student: any) => {
        // Extract data from nested structure or direct properties
        const userId = student.id || student.userId || '';
        const firstName = student.firstName || student.user?.firstName || '';
        const lastName = student.lastName || student.user?.lastName || '';
        const email = student.email || student.user?.email || '';
        const phone = student.phone || student.contact || student.user?.phone || '';
        const rollNo = student.rollNo || student.rollNumber || student.admissionNumber || '';
        // Extract class name - prioritize actual class data over currentViewClass
        let className = student.class || (student as any).className || (student as any).currentClass?.className;
        // Only use currentViewClass as fallback if no class data exists
        if (!className) {
          className = currentViewClass;
        }
        const sectionName = student.section || student.sectionName || student.currentSection?.sectionName || '';
        const status = normalizeStatus(student.status);
        const address = student.address || '';
        // Handle dateOfBirth - convert ISO string to date format if needed
        let dateOfBirth = student.dateOfBirth || student.dob || '';
        if (dateOfBirth && dateOfBirth.includes('T')) {
          // Convert ISO date to YYYY-MM-DD format
          dateOfBirth = dateOfBirth.split('T')[0];
        }
        const parentPhone = student.parentPhone || student.emergencyContactPhone || student.user?.parentPhone || '';

        return {
          id: userId.toString(),
          name: student.name || `${firstName} ${lastName}`.trim() || 'Unknown',
          firstName: firstName,
          lastName: lastName,
          email: email,
          phone: phone,
          rollNo: rollNo,
          class: normalizeClassName(className),
          section: sectionName,
          status: status,
          attendance: typeof student.attendance === 'number' ? student.attendance : 0,
          address: address,
          dateOfBirth: dateOfBirth,
          parentPhone: parentPhone,
        };
      });

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

  // Default sections - simple strings (A, B, C, D)
  // Backend should accept these as strings, not UUIDs
  const getDefaultSections = (): Array<{ id: string; name: string }> => [
    { id: 'A', name: 'A' },
    { id: 'B', name: 'B' },
    { id: 'C', name: 'C' },
    { id: 'D', name: 'D' },
  ];

  // Class and section data
  const [classUUID, setClassUUID] = useState<string | null>(null);
  const [availableSections, setAvailableSections] = useState<Array<{ id: string; name: string }>>(getDefaultSections());
  const [isLoadingClassData, setIsLoadingClassData] = useState(false);

  // Cache for class data to avoid redundant API calls
  const classDataCache = useRef<Map<string, { uuid: string; sections: Array<{ id: string; name: string }> }>>(new Map());
  const requestCounterRef = useRef(0);

  const handleViewProfile = async (student: Student) => {
    try {
      const response = await adminService.getStudentById(student.id);

      if (response.data) {
        const data: any = response.data;
        // Handle dateOfBirth - convert ISO string to date format if needed
        let dateOfBirth = data.dateOfBirth || data.dob || student.dateOfBirth || '';
        if (dateOfBirth && dateOfBirth.includes('T')) {
          // Convert ISO date to YYYY-MM-DD format
          dateOfBirth = dateOfBirth.split('T')[0];
        }
        
        const studentDetails: Student = {
          ...data,
          id: data.id || student.id,
          name: data.name || `${data.firstName || data.user?.firstName || ''} ${data.lastName || data.user?.lastName || ''}`.trim() || student.name || 'Unknown',
          class: data.class || data.className || data.currentClass?.className || student.class,
          section: data.section || data.sectionName || data.currentSection?.sectionName || student.section,
          status: normalizeStatus(data.status) || student.status || 'Active',
          attendance: data.attendance || student.attendance || 0,
          email: data.email || data.user?.email || student.email || '',
          phone: data.phone || data.contact || data.user?.phone || student.phone || '',
          rollNo: data.rollNo || data.rollNumber || data.admissionNumber || student.rollNo || '',
          firstName: data.firstName || data.user?.firstName || student.firstName || '',
          lastName: data.lastName || data.user?.lastName || student.lastName || '',
          dateOfBirth: dateOfBirth,
          parentPhone: data.parentPhone || data.emergencyContactPhone || data.user?.parentPhone || student.parentPhone || '',
          address: data.address || student.address || '',
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
        setAvailableSections(getDefaultSections());
        setIsLoadingClassData(false);
        // Clear cache when dialog closes to avoid stale data
        classDataCache.current.clear();
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

  // Unified class data loader with caching and race condition handling
  const loadClassData = async (className: string): Promise<{ uuid: string; sections: Array<{ id: string; name: string }> } | null> => {
    if (!className || className.trim() === '') {
      return null;
    }

    // Check cache first
    const cached = classDataCache.current.get(className);
    if (cached) {
      if (import.meta.env.DEV) {
        console.log('Using cached class data for:', className);
      }
      return cached;
    }

    // Increment request counter for this fetch
    const currentRequest = ++requestCounterRef.current;

    try {
      // Fetch class UUID
      const classInfo = await adminService.getClassByName(className).catch((err) => {
        if (import.meta.env.DEV) {
          console.warn('Class API not available:', err);
        }
        return null;
      });

      // Check if this request is still current (not stale)
      if (currentRequest !== requestCounterRef.current) {
        if (import.meta.env.DEV) {
          console.log('Ignoring stale class data response for:', className);
        }
        return null;
      }

      if (!classInfo || !classInfo.uuid) {
        return null;
      }

      let sections: Array<{ id: string; name: string }> = [];

      // First, check if sections are included in classInfo
      if (Array.isArray(classInfo.sections) && classInfo.sections.length > 0) {
        sections = classInfo.sections.map(s => ({ id: s.id, name: s.name }));
      } else if (classInfo.id) {
        // Try to fetch class details by ID to get sections
        try {
          const classDetails = await adminService.getClassById(classInfo.id);
          if (classDetails.data && Array.isArray(classDetails.data.sections) && classDetails.data.sections.length > 0) {
            sections = classDetails.data.sections.map((s: any) => ({
              id: s.id || s.uuid || s.name,
              name: s.name || s.sectionName || s.id
            }));
          }
        } catch (err) {
          if (import.meta.env.DEV) {
            console.warn('Failed to fetch class details for sections:', err);
          }
        }
      }

      // Use default sections if none from API
      if (sections.length === 0) {
        sections = getDefaultSections();
      }

      const result = {
        uuid: classInfo.uuid,
        sections: sections,
      };

      // Cache the result
      classDataCache.current.set(className, result);

      if (import.meta.env.DEV) {
        console.log('Class data loaded and cached:', {
          className,
          uuid: result.uuid,
          sectionsCount: result.sections.length,
        });
      }

      return result;
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('Error loading class data:', error);
      }
      return null;
    }
  };

  // Fetch class UUID and sections when class is selected (works for both Add and Edit)
  useEffect(() => {
    // Only fetch when dialog is open and class is selected
    if (!showAddDialog || !selectedClass) {
      return;
    }

    let isMounted = true;

    const fetchClassData = async () => {
      if (!isMounted || !showAddDialog) return;

      setIsLoadingClassData(true);

      try {
        const classData = await loadClassData(selectedClass);

        if (!isMounted || !showAddDialog) return;

        if (classData) {
          setClassUUID(classData.uuid);
          setAvailableSections(classData.sections);

          // If in edit mode and sectionId is already set, try to preserve it
          if (isEditMode && sectionId) {
            // Check if current sectionId is valid in new sections
            const isValid = classData.sections.some(s => s.id === sectionId || s.name === sectionId);
            if (!isValid) {
              // Try to find section by name from selectedStudent
              if (selectedStudent?.section) {
                const sectionByName = classData.sections.find(s => s.name === selectedStudent.section);
                if (sectionByName) {
                  setSectionId(sectionByName.id);
                } else {
                  // If section name matches a section ID, use it
                  const sectionById = classData.sections.find(s => s.id === selectedStudent.section);
                  if (sectionById) {
                    setSectionId(sectionById.id);
                  } else {
                    setSectionId('');
                  }
                }
              } else {
                setSectionId('');
              }
            }
            // If sectionId is valid, keep it
          } else {
            // Reset sectionId when class changes (validate it's still valid)
            setSectionId(prevSectionId => {
              if (prevSectionId) {
                const isValid = classData.sections.some(s => s.id === prevSectionId || s.name === prevSectionId);
                if (!isValid) {
                  if (import.meta.env.DEV) {
                    console.log('Section reset due to class change');
                  }
                  return '';
                }
              }
              return prevSectionId;
            });
          }
        } else {
          // If class data not found, use defaults
          setClassUUID(null);
          setAvailableSections(getDefaultSections());
          // Don't reset sectionId in edit mode if it's already set
          if (!isEditMode) {
            setSectionId('');
          }
        }
      } catch (error: any) {
        if (import.meta.env.DEV) {
          console.error('Error fetching class data:', error);
        }
        if (isMounted && showAddDialog) {
          setAvailableSections(getDefaultSections());
          setSectionId(''); // Reset section on error
        }
      } finally {
        if (isMounted) {
          setIsLoadingClassData(false);
        }
      }
    };

    // Fetch immediately when class is selected
    fetchClassData();

    return () => {
      isMounted = false;
    };
  }, [selectedClass, showAddDialog]);

  // Available classes - fetched from API
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);

  // Fetch classes from API when dropdown opens
  const fetchAvailableClasses = async () => {
    if (isLoadingClasses) {
      return; // Already loading
    }

    setIsLoadingClasses(true);
    try {
      const response = await adminService.getClasses();
      
      if (response && response.classes && Array.isArray(response.classes)) {
        // Extract and normalize class names from API response
        const classNames = response.classes
          .map((cls: any) => {
            // Extract class name from different possible fields
            // ClassResponse has 'name' field, but backend might return 'className' too
            const className = cls.className || cls.name || '';
            
            // Normalize to "Class X" format
            if (!className) return null;
            
            // Handle formats like "grade3", "Class 3", "Grade 3", etc.
            const match = className.match(/(?:class|grade)\s*(\d+)/i);
            if (match) {
              return `Class ${match[1]}`;
            }
            
            // If already in "Class X" format, return as is
            if (className.match(/^Class \d+$/i)) {
              return className.charAt(0).toUpperCase() + className.slice(1).toLowerCase();
            }
            
            // Return as is if no pattern matches
            return className;
          })
          .filter((name: string | null): name is string => name !== null && name.trim() !== '')
          .filter((name: string, index: number, self: string[]) => self.indexOf(name) === index) // Remove duplicates
          .sort((a: string, b: string) => {
            // Sort by class number
            const numA = parseInt(a.match(/\d+/)?.[0] || '0');
            const numB = parseInt(b.match(/\d+/)?.[0] || '0');
            return numA - numB;
          });

        if (classNames.length > 0) {
          setAvailableClasses(classNames);
          
          // If currentViewClass is not in the list, set it to the first available class
          if (!classNames.includes(currentViewClass)) {
            setCurrentViewClass(classNames[0]);
          }
        } else {
          // Fallback to default classes if API returns empty
          const defaultClasses = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6',
            'Class 7', 'Class 8', 'Class 9', 'Class 10'];
          setAvailableClasses(defaultClasses);
        }
      } else {
        // Fallback to default classes if API response is invalid
        const defaultClasses = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6',
          'Class 7', 'Class 8', 'Class 9', 'Class 10'];
        setAvailableClasses(defaultClasses);
      }
    } catch (error: any) {
      console.error('Error fetching classes:', error);
      // Fallback to default classes on error
      const defaultClasses = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6',
        'Class 7', 'Class 8', 'Class 9', 'Class 10'];
      setAvailableClasses(defaultClasses);
      
      if (import.meta.env.DEV) {
        toast.error('Failed to load classes. Using default classes.');
      }
    } finally {
      setIsLoadingClasses(false);
    }
  };

  // Filter students based on current view class, search and status filter
  const filteredStudents = useMemo(() => {
    // Safety check - ensure students is an array
    if (!Array.isArray(students) || students.length === 0) {
      return [];
    }

    let filtered = students;

    // First filter by current view class (always applied)
    // Match exact class name or class name with section (e.g., "Class 7" or "Class 7A")
    filtered = filtered.filter(s => {
      if (!s.class) return false;
      const studentClass = s.class;
      // Check if student class matches currentViewClass exactly or starts with it
      // This handles cases like "Class 7" matching "Class 7" or "Class 7A"
      return studentClass === currentViewClass || studentClass.startsWith(currentViewClass + ' ') || studentClass.startsWith(currentViewClass);
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
        const studentData: any = response.data;

        setIsEditMode(true);
        setEditingStudentId(studentData.id || student.id);
        setSelectedStudent(studentData);

        // Set first and last name
        setFirstName(studentData.firstName || student.firstName || '');
        setLastName(studentData.lastName || student.lastName || '');

        // Set class - handle both Class X and Grade X formats, and lowercase formats like "grade3"
        const studentClass = studentData.class || studentData.className || studentData.currentClass?.className || student.class || '';
        // Convert "grade3" to "Class 3" format
        let normalizedClass = studentClass;
        if (studentClass && !studentClass.match(/^(Class |Grade )/i)) {
          // Handle lowercase format like "grade3"
          const match = studentClass.match(/^(grade|class)\s*(\d+)/i);
          if (match) {
            normalizedClass = `Class ${match[2]}`;
          }
        }
        const classMatch = normalizedClass.match(/^(Class \d+|Grade \d+)/);
        if (classMatch) {
          // Convert Grade to Class if needed
          const matchedClass = classMatch[1].replace(/^Grade /i, 'Class ');
          setSelectedClass(matchedClass);
        } else if (normalizedClass) {
          setSelectedClass(normalizedClass);
        } else {
          setSelectedClass(currentViewClass);
        }

        // Set section - wait for class data to load, then set section
        const sectionName = studentData.section || studentData.sectionName || studentData.currentSection?.sectionName || student.section || '';
        if (sectionName) {
          // Try to find section in available sections first
          const section = availableSections.find(s => s.name === sectionName || s.id === sectionName);
          if (section) {
            setSectionId(section.id);
          } else {
            // If not found, set the section name as ID (might be a string like 'A', 'B', etc.)
            setSectionId(sectionName);
          }
        }

        // Set phone
        setPhone(studentData.phone || studentData.contact || studentData.user?.phone || student.phone || '');

        // Set date of birth - handle ISO date format
        let dobValue = studentData.dateOfBirth || studentData.dob || student.dateOfBirth || '';
        if (dobValue && dobValue.includes('T')) {
          // Convert ISO date to YYYY-MM-DD format for input field
          dobValue = dobValue.split('T')[0];
        }
        setDob(dobValue);

        // Set parent phone - handle different field names
        const parentPhoneValue = studentData.parentPhone || studentData.emergencyContactPhone || studentData.user?.parentPhone || student.parentPhone || '';
        setParentPhone(parentPhoneValue);

        // Set address
        setAddress(studentData.address || student.address || '');

        // Open dialog - useEffect will handle loading class data for the selected class
        setShowAddDialog(true);
      } else {
        // Fallback to local data
        setIsEditMode(true);
        setEditingStudentId(student.id.toString());
        setSelectedStudent(student);

        const nameParts = (student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim()).split(' ');
        setFirstName(student.firstName || nameParts[0] || '');
        setLastName(student.lastName || nameParts.slice(1).join(' ') || '');

        const classMatch = student.class.match(/^(Class \d+|Grade \d+)([A-Z])?$/);
        if (classMatch) {
          // Convert Grade to Class if needed
          const matchedClass = classMatch[1].replace(/^Grade /i, 'Class ');
          setSelectedClass(matchedClass);
        } else {
          setSelectedClass(student.class);
        }

        setPhone(student.phone || '');
        setDob(student.dateOfBirth || '');
        setParentPhone(student.parentPhone || '');
        setAddress(student.address || '');

        // Open dialog - useEffect will handle loading class data for the selected class
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

      const classMatch = student.class.match(/^(Class \d+|Grade \d+)([A-Z])?$/);
      if (classMatch) {
        // Convert Grade to Class if needed
        const matchedClass = classMatch[1].replace(/^Grade /i, 'Class ');
        setSelectedClass(matchedClass);
      } else {
        setSelectedClass(student.class);
      }

      setPhone(student.phone);
      setDob(student.dateOfBirth || '');
      setParentPhone(student.parentPhone || '');
      setAddress(student.address || '');

      // Open dialog - useEffect will handle loading class data for the selected class
      setShowAddDialog(true);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (student: Student, checked: boolean) => {
    const newStatus: 'Active' | 'Inactive' = checked ? 'Active' : 'Inactive';
    const previousStatus = student.status;
    
    // Optimistically update UI
    setStudents(prev => prev.map(s => 
      s.id === student.id ? { ...s, status: newStatus } : s
    ));
    
    try {
      // Get class UUID if needed
      let finalClassUUID = classUUID;
      if (!finalClassUUID && student.class) {
        try {
          const classData = await loadClassData(student.class);
          if (classData) {
            finalClassUUID = classData.uuid;
          }
        } catch (error) {
          // Continue without class UUID
        }
      }
      
      // Convert to uppercase for API (API expects ACTIVE/INACTIVE)
      const apiStatus = checked ? 'ACTIVE' : 'INACTIVE';
      await adminService.updateStudent(student.id, { status: apiStatus as any }, finalClassUUID || undefined);
      
      toast.success(
        <div className="flex items-start gap-3 w-full">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <span className="font-semibold text-sm text-gray-900 dark:text-white leading-tight">Status updated</span>
            <span className="text-xs text-gray-600 dark:text-gray-400 leading-tight">{student.name} is now {newStatus.toLowerCase()}.</span>
          </div>
        </div>,
        { duration: 2000, icon: null }
      );
    } catch (error: any) {
      // Revert on failure
      setStudents(prev => prev.map(s => 
        s.id === student.id ? { ...s, status: previousStatus } : s
      ));
      
      let errorMessage = 'Failed to update status.';
      if (error instanceof ApiException) {
        errorMessage = getUserFriendlyError(error);
      } else if (error?.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
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

      setStudents(prev => prev.filter(s => s.id !== studentToDelete.id));
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

    // Trim all fields first for validation
    const trimmedFirstName = firstName?.trim() || '';
    const trimmedLastName = lastName?.trim() || '';
    const trimmedDob = dob?.trim() || '';
    const trimmedSelectedClass = selectedClass?.trim() || '';
    const trimmedSectionId = sectionId?.trim() || '';
    const trimmedPhone = phone?.trim() || '';
    const trimmedAddress = address?.trim() || '';

    // Validate required fields - check after trim
    const missingFields: string[] = [];
    if (!trimmedFirstName) missingFields.push('First Name');
    if (!trimmedLastName) missingFields.push('Last Name');
    if (!trimmedDob) missingFields.push('Date of Birth');
    if (!trimmedSelectedClass) missingFields.push('Class');
    if (!trimmedSectionId) missingFields.push('Section');
    if (!trimmedPhone) missingFields.push('Phone');
    if (!trimmedAddress) missingFields.push('Address');

    if (missingFields.length > 0) {
      toast.error('Please fill all required fields', {
        description: `Missing: ${missingFields.join(', ')}`,
      });
      return;
    }

    // Validate sectionId
    if (!trimmedSectionId) {
      toast.error('Section is required. Please select a section.');
      return;
    }

    // Get class name for update request - use trimmed value
    const updateClassName = trimmedSelectedClass || (currentViewClass?.trim() || '');

    // Validate class name is provided when section is provided
    if (!updateClassName) {
      toast.error('Class is required when providing a section. Please select a class.');
      return;
    }

    setIsAddingOrUpdating(true);
    try {
      // Prepare request data - use trimmed values, class UUID is optional, backend will handle class lookup by name
      const requestData: UpdateStudentRequest = {
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        dateOfBirth: trimmedDob,
        address: trimmedAddress,
        phone: trimmedPhone,
        currentSectionId: trimmedSectionId, // Backend expects 'currentSectionId'
        parentPhone: parentPhone?.trim() || undefined,
        className: updateClassName, // Backend requires class name when updating section
        // classId is optional - only include if already available
        ...(classUUID && classUUID.trim() && { classId: classUUID.trim() }),
      };

      // Double-check that all required fields are present
      if (!requestData.firstName || !requestData.lastName || !requestData.dateOfBirth || 
          !requestData.address || !requestData.phone || !requestData.currentSectionId || 
          !requestData.className) {
        const missing: string[] = [];
        if (!requestData.firstName) missing.push('First Name');
        if (!requestData.lastName) missing.push('Last Name');
        if (!requestData.dateOfBirth) missing.push('Date of Birth');
        if (!requestData.address) missing.push('Address');
        if (!requestData.phone) missing.push('Phone');
        if (!requestData.currentSectionId) missing.push('Section');
        if (!requestData.className) missing.push('Class');
        
        toast.error('Please fill all required fields', {
          description: `Missing: ${missing.join(', ')}`,
        });
        setIsAddingOrUpdating(false);
        return;
      }

      if (import.meta.env.DEV) {
        console.log('Update Student Request:', {
          studentId: editingStudentId,
          requestData,
          classUUID: classUUID || 'not provided (optional)',
        });
      }

      // Call API to update student - class UUID is optional, backend will handle class lookup
      const response = await adminService.updateStudent(editingStudentId, requestData, classUUID || undefined);

      if (response.data) {
        const data: any = response.data;
        // Handle dateOfBirth format if present
        let dateOfBirth = data.dateOfBirth || '';
        if (dateOfBirth && dateOfBirth.includes('T')) {
          dateOfBirth = dateOfBirth.split('T')[0];
        }
        
        const updatedStudent: Student = {
          ...data,
          id: data.id || editingStudentId,
          name: data.name || `${data.firstName || data.user?.firstName || firstName} ${data.lastName || data.user?.lastName || lastName}`.trim() || `${firstName} ${lastName}`,
          class: data.class || data.className || data.currentClass?.className || selectedClass,
          section: data.section || data.sectionName || data.currentSection?.sectionName || availableSections.find(s => s.id === requestData.currentSectionId)?.name || '',
          status: normalizeStatus(data.status) || 'Active',
          attendance: data.attendance || 0,
          email: data.email || data.user?.email || '',
          phone: data.phone || data.contact || data.user?.phone || phone,
          rollNo: data.rollNo || data.rollNumber || data.admissionNumber || students.find(s => s.id === editingStudentId)?.rollNo || '',
          firstName: data.firstName || data.user?.firstName || firstName,
          lastName: data.lastName || data.user?.lastName || lastName,
          dateOfBirth: dateOfBirth,
          parentPhone: data.parentPhone || data.emergencyContactPhone || data.user?.parentPhone || parentPhone || '',
          address: data.address || address,
        };

        setStudents(prev => prev.map(s => s.id === editingStudentId ? updatedStudent : s));
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
    if (import.meta.env.DEV) {
      console.log('handleAddStudent called', {
        isEditMode,
        firstName,
        lastName,
        dob,
        selectedClass,
        sectionId,
        phone,
        address,
      });
    }

    // If in edit mode, call update instead
    if (isEditMode) {
      handleUpdateStudent();
      return;
    }

    // Trim all fields first for validation
    const trimmedFirstName = firstName?.trim() || '';
    const trimmedLastName = lastName?.trim() || '';
    const trimmedDob = dob?.trim() || '';
    const trimmedSelectedClass = selectedClass?.trim() || '';
    const trimmedSectionId = sectionId?.trim() || '';
    const trimmedPhone = phone?.trim() || '';
    const trimmedAddress = address?.trim() || '';

    // Validate required fields - check after trim
    const missingFields: string[] = [];
    if (!trimmedFirstName) missingFields.push('First Name');
    if (!trimmedLastName) missingFields.push('Last Name');
    if (!trimmedDob) missingFields.push('Date of Birth');
    if (!trimmedSelectedClass) missingFields.push('Class');
    if (!trimmedSectionId) missingFields.push('Section');
    if (!trimmedPhone) missingFields.push('Phone');
    if (!trimmedAddress) missingFields.push('Address');

    if (missingFields.length > 0) {
      toast.error('Please fill all required fields', {
        description: `Missing: ${missingFields.join(', ')}`,
      });
      return;
    }

    // Validate sectionId
    if (!trimmedSectionId) {
      toast.error('Section is required. Please select a section.');
      return;
    }

    // IMPORTANT: Always use selectedClass from dropdown, NOT currentViewClass
    // Backend needs the exact class that user selected in the dialog
    if (!trimmedSelectedClass) {
      toast.error('Please select a class from the dropdown.');
      return;
    }

    // Use ONLY the selected class from dropdown - don't use currentViewClass as fallback
    // Declare variables outside try block for error handling
    let finalClassUUID: string | undefined = undefined;
    let finalClassName: string = trimmedSelectedClass;

    setIsAddingOrUpdating(true);
    
    try {
      // IMPORTANT: Ensure classUUID matches the selectedClass
      // If classUUID is not loaded yet or doesn't match, reload it or let backend handle it
      
      // If class data is still loading, wait for it or proceed without UUID (backend will handle by className)
      if (isLoadingClassData) {
        // Wait a bit for class data to load (max 2 seconds)
        let attempts = 0;
        while (isLoadingClassData && attempts < 20) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
      }
      
      // Try to load class UUID, but don't fail if it's not found
      // Backend can handle student creation with just className
      if (selectedClass && selectedClass.trim() !== '') {
        try {
          // Try to load class data to get UUID
          const classData = await loadClassData(selectedClass);
          if (classData && classData.uuid) {
            finalClassUUID = classData.uuid;
            if (import.meta.env.DEV) {
              console.log('✅ Class UUID loaded for selected class:', {
                selectedClass,
                classUUID: finalClassUUID,
              });
            }
          } else {
            // If class UUID not found, that's okay - backend can handle it with className
            if (import.meta.env.DEV) {
              console.log('ℹ️ Class UUID not found for:', selectedClass, '- Backend will use className');
            }
          }
        } catch (error: any) {
          // If getClassByName fails (e.g., format not supported), that's okay
          // Backend will handle student creation with className
          if (import.meta.env.DEV) {
            console.log('ℹ️ Could not load class UUID (this is okay):', {
              selectedClass,
              error: error?.message || 'Unknown error',
              note: 'Backend will use className for student creation',
            });
          }
          // Don't throw - continue without UUID
        }
      }

      // Use the exact class name as selected by user - backend will handle format conversion if needed
      // Don't modify the class name - send it exactly as user selected
      const backendClassName = finalClassName;

      // Prepare request data - use trimmed values
      // IMPORTANT: className is REQUIRED and must be the exact class selected by user
      const requestData: AddStudentRequest = {
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        dateOfBirth: trimmedDob,
        address: trimmedAddress,
        phone: trimmedPhone,
        currentSectionId: trimmedSectionId, // Backend expects 'currentSectionId'
        parentPhone: parentPhone?.trim() || undefined,
        className: backendClassName, // REQUIRED: Exact class selected by user (e.g., "Class 4", "Class 6")
        // Include classId only if we have a valid UUID for the selected class
        ...(finalClassUUID && finalClassUUID.trim() && { classId: finalClassUUID.trim() }),
      };

      // Log the exact class being sent to backend
      if (import.meta.env.DEV) {
        console.log('🔍 Class Selection Debug:', {
          selectedClassFromDropdown: selectedClass,
          trimmedSelectedClass: trimmedSelectedClass,
          finalClassName: finalClassName,
          backendClassName: backendClassName,
          currentViewClass: currentViewClass,
          classUUID: finalClassUUID || 'not provided',
          requestClassName: requestData.className,
          requestClassId: requestData.classId || 'not provided',
        });
      }

      // Double-check that all required fields are present and not empty
      if (!requestData.firstName || !requestData.lastName || !requestData.dateOfBirth || 
          !requestData.address || !requestData.phone || !requestData.currentSectionId || 
          !requestData.className) {
        const missing: string[] = [];
        if (!requestData.firstName) missing.push('First Name');
        if (!requestData.lastName) missing.push('Last Name');
        if (!requestData.dateOfBirth) missing.push('Date of Birth');
        if (!requestData.address) missing.push('Address');
        if (!requestData.phone) missing.push('Phone');
        if (!requestData.currentSectionId) missing.push('Section');
        if (!requestData.className) missing.push('Class');
        
        toast.error('Please fill all required fields', {
          description: `Missing: ${missing.join(', ')}`,
        });
        setIsAddingOrUpdating(false);
        return;
      }

      // Log request data for debugging
      if (import.meta.env.DEV) {
        console.log('Request Data Validation:', {
          requestData,
          hasFirstName: !!requestData.firstName,
          hasLastName: !!requestData.lastName,
          hasDateOfBirth: !!requestData.dateOfBirth,
          hasAddress: !!requestData.address,
          hasPhone: !!requestData.phone,
          hasCurrentSectionId: !!requestData.currentSectionId,
          hasClassName: !!requestData.className,
          className: requestData.className,
          classNameLength: requestData.className?.length,
          selectedClass: selectedClass,
          finalClassName: finalClassName,
          backendClassName: backendClassName,
          allFields: {
            firstName: requestData.firstName,
            lastName: requestData.lastName,
            dateOfBirth: requestData.dateOfBirth,
            address: requestData.address,
            phone: requestData.phone,
            currentSectionId: requestData.currentSectionId,
            className: requestData.className,
          },
        });
      }

      if (import.meta.env.DEV) {
        console.log('Add Student Request (Final):', {
          requestData,
          selectedClass: selectedClass,
          currentViewClass: currentViewClass,
          finalClassName: finalClassName,
          classUUID: finalClassUUID || 'not provided (will use className)',
          className: requestData.className,
          allFields: {
            firstName: requestData.firstName,
            lastName: requestData.lastName,
            dateOfBirth: requestData.dateOfBirth,
            address: requestData.address,
            phone: requestData.phone,
            currentSectionId: requestData.currentSectionId,
            className: requestData.className,
            classId: requestData.classId,
            parentPhone: requestData.parentPhone,
          },
          validation: {
            firstNameValid: !!requestData.firstName && requestData.firstName.length > 0,
            lastNameValid: !!requestData.lastName && requestData.lastName.length > 0,
            dobValid: !!requestData.dateOfBirth && requestData.dateOfBirth.length > 0,
            addressValid: !!requestData.address && requestData.address.length > 0,
            phoneValid: !!requestData.phone && requestData.phone.length > 0,
            sectionValid: !!requestData.currentSectionId && requestData.currentSectionId.length > 0,
            classValid: !!requestData.className && requestData.className.length > 0,
          },
        });
        console.log('Calling adminService.addStudent...');
      }

      // Call API to add student - use selectedClass, not currentViewClass
      const response = await adminService.addStudent(requestData, finalClassUUID);

      if (import.meta.env.DEV) {
        console.log('Add Student API Response:', response);
      }

      if (response.data) {
        // Extract the created student's class from response (handle different response structures)
        const responseData: any = response.data;
        const createdStudentClass = responseData.class || responseData.className || responseData.currentClass?.className || finalClassName;
        
        // Normalize class name to match our format
        let normalizedCreatedClass = createdStudentClass;
        if (createdStudentClass && !createdStudentClass.match(/^Class \d+$/i)) {
          const match = createdStudentClass.match(/(?:class|grade)\s*(\d+)/i);
          if (match) {
            normalizedCreatedClass = `Class ${match[1]}`;
          }
        }

        // If student was created in a different class than currentViewClass, switch to that class
        if (normalizedCreatedClass && normalizedCreatedClass !== currentViewClass) {
          setCurrentViewClass(normalizedCreatedClass);
          if (import.meta.env.DEV) {
            console.log('Switching view to created student class:', normalizedCreatedClass);
          }
        }

        // Show success toast
        toast.success(
          <div className="flex items-start gap-3 w-full">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <span className="font-semibold text-sm text-gray-900 dark:text-white leading-tight">Student added successfully</span>
              <span className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
                {response.data.name || `${firstName} ${lastName}`} has been added to {normalizedCreatedClass || finalClassName}.
              </span>
            </div>
          </div>,
          {
            duration: 3000,
            icon: null, // Disable default icon to use our custom icon
          }
        );

        // Refresh students list - this will use the updated currentViewClass if we switched it
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
        // Handle 409 Conflict (duplicate email/user)
        if (error.statusCode === 409) {
          // Extract the actual error message from backend
          const backendMessage = error.message || error.details?.message || 'User already exists';
          errorMessage = backendMessage;
          
          if (import.meta.env.DEV) {
            console.error('❌ 409 Conflict Error:', {
              error,
              message: backendMessage,
              details: error.details,
              sentClassName: finalClassName,
              sentClassId: finalClassUUID,
              note: 'This error means the email already exists in the system. The student was NOT created.',
            });
          }
        }
        // Handle CORS errors specifically
        else if (error.code === 'CORS_ERROR') {
          const blockedHeader = error.details?.blockedHeader || 'x-class-uuid';
          errorMessage = `🚨 CORS Error: Header "${blockedHeader}" is not allowed by backend.\n\n✅ Quick Fix:\nBackend must add "${blockedHeader}" to Access-Control-Allow-Headers.\n\n⚠️ Important: Header name must be lowercase!\n\nExample (Express.js):\napp.use(cors({\n  allowedHeaders: ['Content-Type', 'Authorization', '${blockedHeader}']\n}));`;

          if (import.meta.env.DEV) {
            console.error('🚨 CORS Error Details:', {
              error,
              details: error.details,
              url: error.details?.url,
              blockedHeader: blockedHeader,
              customHeaders: error.details?.customHeaders,
              solution: error.details?.solution,
              note: 'Backend must add lowercase header names to Access-Control-Allow-Headers',
            });
          }
        } else {
          errorMessage = getUserFriendlyError(error);
        }
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
            selectedClass,
            classUUID: classUUID || 'not provided (optional)',
          },
        });
      }

      // Show error toast with better formatting for CORS errors
      if (error instanceof ApiException && error.code === 'CORS_ERROR') {
        toast.error(
          <div className="flex flex-col gap-2">
            <div className="font-semibold">CORS Configuration Error</div>
            <div className="text-sm">Backend server needs to configure CORS properly.</div>
            <div className="text-xs text-gray-500 mt-1">
              Required headers: X-School-UUID, X-Class-UUID
            </div>
          </div>,
          {
            duration: 8000,
          }
        );
      } else {
        toast.error(errorMessage);
      }
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
            <Select 
              value={currentViewClass} 
              onValueChange={setCurrentViewClass}
              onOpenChange={(open) => {
                // Fetch classes when dropdown opens (only if not already loaded)
                if (open && availableClasses.length === 0 && !isLoadingClasses) {
                  fetchAvailableClasses();
                }
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder={isLoadingClasses ? "Loading..." : "Select class"} />
              </SelectTrigger>
              <SelectContent>
                {isLoadingClasses ? (
                  <div className="p-2 text-center text-sm text-gray-500 dark:text-gray-400">Loading classes...</div>
                ) : availableClasses && availableClasses.length > 0 ? (
                  availableClasses.map((cls) => (
                    <SelectItem key={cls} value={cls}>
                      {cls}
                    </SelectItem>
                  ))
                ) : (
                  // Fallback options if no classes available
                  ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6',
                    'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'].map((cls) => (
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
              // Set default sections initially
              setAvailableSections(getDefaultSections());
              setIsLoadingClassData(false);

              // Set class to current view (default)
              setSelectedClass(currentViewClass);

              // Fetch classes if not already loaded
              if (availableClasses.length === 0 && !isLoadingClasses) {
                await fetchAvailableClasses();
              }

              // Open dialog - useEffect will handle loading class data
              setShowAddDialog(true);
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
                    <TableRow key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
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
                          onCheckedChange={(checked) => handleToggleStatus(student, checked)}
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
      }} modal={true}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-visible" onPointerDownOutside={(e) => {
          // Don't close when clicking on Select dropdown
          const target = e.target as HTMLElement;
          if (target.closest('[data-slot="select-content"]') || target.closest('[data-slot="select-trigger"]')) {
            e.preventDefault();
          }
        }}>
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Student' : 'Add New Student'}</DialogTitle>
            <DialogDescription>{isEditMode ? 'Update the student details below' : 'Fill in the student details below'}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4 max-h-[calc(90vh-120px)] overflow-y-auto overflow-x-visible">
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
                value={selectedClass || ''}
                onValueChange={(value) => {
                  if (import.meta.env.DEV) {
                    console.log('Class selected in dropdown:', value);
                  }
                  // Reset section when class changes
                  setSectionId('');
                  setClassUUID(null);
                  setSelectedClass(value);
                  // Fetch classes if not already loaded
                  if (availableClasses.length === 0 && !isLoadingClasses) {
                    fetchAvailableClasses();
                  }
                }}
                onOpenChange={(open) => {
                  if (import.meta.env.DEV) {
                    console.log('Class dropdown open change:', open);
                  }
                  // Fetch classes when dropdown opens (only if not already loaded)
                  if (open && availableClasses.length === 0 && !isLoadingClasses) {
                    fetchAvailableClasses();
                  }
                }}
              >
                <SelectTrigger 
                  className="w-full cursor-pointer"
                  onClick={() => {
                    if (import.meta.env.DEV) {
                      console.log('SelectTrigger clicked');
                    }
                  }}
                >
                  <SelectValue placeholder={isLoadingClasses ? "Loading classes..." : selectedClass || "Select class"} />
                </SelectTrigger>
                <SelectContent 
                  className="z-[99999] max-h-[300px]"
                  sideOffset={4}
                >
                  {isLoadingClasses ? (
                    <div className="p-2 text-center text-sm text-gray-500 dark:text-gray-400">Loading classes...</div>
                  ) : availableClasses && availableClasses.length > 0 ? (
                    availableClasses.map((cls) => (
                      <SelectItem key={cls} value={cls}>
                        {cls}
                      </SelectItem>
                    ))
                  ) : (
                    // Fallback options if no classes available
                    ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6',
                      'Class 7', 'Class 8', 'Class 9', 'Class 10'].map((cls) => (
                      <SelectItem key={cls} value={cls}>
                        {cls}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedClass && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Selected: {selectedClass}
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
                <SelectTrigger 
                  className={`w-full ${isLoadingClassData ? "bg-gray-100 dark:bg-gray-800 cursor-not-allowed" : "cursor-pointer"}`}
                  onClick={() => {
                    if (import.meta.env.DEV && !isLoadingClassData) {
                      console.log('Section SelectTrigger clicked');
                    }
                  }}
                >
                  <SelectValue placeholder={isLoadingClassData ? "Loading sections..." : availableSections.length === 0 ? "No sections available" : "Select section"} />
                </SelectTrigger>
                <SelectContent 
                  className="z-[99999] max-h-[300px]"
                  sideOffset={4}
                >
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
            <Button variant="outline" onClick={handleCloseDialogDirect} disabled={isAddingOrUpdating}>
              Cancel
            </Button>
            <Button
              className="bg-[#0A66C2] hover:bg-[#0052A3]"
              onClick={handleAddStudent}
              disabled={isAddingOrUpdating}
            >
              {isAddingOrUpdating
                ? (isEditMode ? 'Updating...' : 'Adding...')
                : (isEditMode ? 'Update Student' : 'Add Student')
              }
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
                  <p className="text-gray-900 dark:text-white">{selectedStudent.email || 'Not provided'}</p>
                </div>
                <div>
                  <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Phone</h4>
                  <p className="text-gray-900 dark:text-white">{selectedStudent.phone || 'Not provided'}</p>
                </div>
                <div>
                  <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Date of Birth</h4>
                  <p className="text-gray-900 dark:text-white">
                    {selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString() : 'Not provided'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Parent Phone</h4>
                  <p className="text-gray-900 dark:text-white">{selectedStudent.parentPhone || 'Not provided'}</p>
                </div>
                <div>
                  <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Attendance Rate</h4>
                  <p className="text-gray-900 dark:text-white">{selectedStudent.attendance || 0}%</p>
                </div>
                <div>
                  <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Section</h4>
                  <p className="text-gray-900 dark:text-white">{selectedStudent.section || 'Not assigned'}</p>
                </div>
                <div className="col-span-2">
                  <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Address</h4>
                  <p className="text-gray-900 dark:text-white">{selectedStudent.address || 'Not provided'}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4">
                <Card className="p-4 text-center">
                  <p className="text-2xl text-gray-900 dark:text-white mb-1">
                    {selectedStudent.attendance ? `${selectedStudent.attendance}%` : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Attendance</p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="text-2xl text-gray-900 dark:text-white mb-1">
                    {selectedStudent.section || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Section</p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="text-2xl text-gray-900 dark:text-white mb-1">
                    {selectedStudent.rollNo || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Roll No</p>
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

