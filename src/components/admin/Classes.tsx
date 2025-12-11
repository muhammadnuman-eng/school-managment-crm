import { useState, useEffect } from 'react';
import { Plus, Search, Filter, BookOpen, Users, GraduationCap, MoreVertical, Edit, Trash2, Eye, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { toast } from 'sonner';
import { adminService } from '../../services';
import { AddClassRequest, UpdateClassRequest } from '../../types/class.types';
import { ApiException, getUserFriendlyError } from '../../utils/errors';

interface Subject {
  id: string;
  name: string;
  code: string;
  teacher?: string;
  teacherId?: string;
}

interface Section {
  id: string;
  name: string;
  capacity: number;
  enrolled: number;
  classTeacher?: string;
  classTeacherId?: string;
  room?: string;
}

interface ClassData {
  id: string;
  name: string;
  grade: number;
  sections: Section[];
  subjects: Subject[];
  totalStudents: number;
  totalCapacity: number;
  academicYear: string;
}

const mockClasses: ClassData[] = [
  {
    id: '1',
    name: 'Grade 1',
    grade: 1,
    academicYear: '2024-2025',
    totalStudents: 95,
    totalCapacity: 120,
    sections: [
      { id: 's1', name: 'A', capacity: 40, enrolled: 35, classTeacher: 'Mrs. Anderson', room: '101' },
      { id: 's2', name: 'B', capacity: 40, enrolled: 32, classTeacher: 'Mr. Smith', room: '102' },
      { id: 's3', name: 'C', capacity: 40, enrolled: 28, classTeacher: 'Ms. Johnson', room: '103' },
    ],
    subjects: [
      { id: 'sub1', name: 'English', code: 'ENG101', teacher: 'Ms. Emma Wilson' },
      { id: 'sub2', name: 'Mathematics', code: 'MATH101', teacher: 'Dr. Sarah Mitchell' },
      { id: 'sub3', name: 'Science', code: 'SCI101', teacher: 'Prof. John Davis' },
      { id: 'sub4', name: 'Art', code: 'ART101', teacher: 'Ms. Lisa Brown' },
    ],
  },
  {
    id: '2',
    name: 'Grade 10',
    grade: 10,
    academicYear: '2024-2025',
    totalStudents: 128,
    totalCapacity: 160,
    sections: [
      { id: 's4', name: 'A', capacity: 40, enrolled: 38, classTeacher: 'Dr. Sarah Mitchell', room: '201' },
      { id: 's5', name: 'B', capacity: 40, enrolled: 35, classTeacher: 'Prof. Michael Chen', room: '202' },
      { id: 's6', name: 'C', capacity: 40, enrolled: 30, classTeacher: 'Ms. Emma Wilson', room: '203' },
      { id: 's7', name: 'D', capacity: 40, enrolled: 25, classTeacher: 'Mr. David Brown', room: '204' },
    ],
    subjects: [
      { id: 'sub5', name: 'English Literature', code: 'ENG1001', teacher: 'Ms. Emma Wilson' },
      { id: 'sub6', name: 'Advanced Mathematics', code: 'MATH1001', teacher: 'Dr. Sarah Mitchell' },
      { id: 'sub7', name: 'Physics', code: 'PHY1001', teacher: 'Prof. Michael Chen' },
      { id: 'sub8', name: 'Chemistry', code: 'CHEM1001', teacher: 'Mr. David Brown' },
      { id: 'sub9', name: 'Biology', code: 'BIO1001', teacher: 'Dr. Jane Cooper' },
      { id: 'sub10', name: 'History', code: 'HIST1001', teacher: 'Mr. Robert Lee' },
    ],
  },
  {
    id: '3',
    name: 'Grade 7',
    grade: 7,
    academicYear: '2024-2025',
    totalStudents: 85,
    totalCapacity: 120,
    sections: [
      { id: 's8', name: 'A', capacity: 40, enrolled: 35, classTeacher: 'Ms. Patricia White', room: '301' },
      { id: 's9', name: 'B', capacity: 40, enrolled: 28, classTeacher: 'Mr. James Taylor', room: '302' },
      { id: 's10', name: 'C', capacity: 40, enrolled: 22, classTeacher: 'Mrs. Linda Green', room: '303' },
    ],
    subjects: [
      { id: 'sub11', name: 'English', code: 'ENG701', teacher: 'Ms. Emma Wilson' },
      { id: 'sub12', name: 'Mathematics', code: 'MATH701', teacher: 'Dr. Sarah Mitchell' },
      { id: 'sub13', name: 'Science', code: 'SCI701', teacher: 'Prof. Michael Chen' },
      { id: 'sub14', name: 'Social Studies', code: 'SS701', teacher: 'Mr. Robert Lee' },
      { id: 'sub15', name: 'Physical Education', code: 'PE701', teacher: 'Coach Mark Wilson' },
    ],
  },
];

const availableTeachers = [
  { id: 't1', name: 'Dr. Sarah Mitchell', subject: 'Mathematics' },
  { id: 't2', name: 'Prof. Michael Chen', subject: 'Physics' },
  { id: 't3', name: 'Ms. Emma Wilson', subject: 'English' },
  { id: 't4', name: 'Mr. David Brown', subject: 'Chemistry' },
  { id: 't5', name: 'Dr. Jane Cooper', subject: 'Biology' },
  { id: 't6', name: 'Mr. Robert Lee', subject: 'History' },
];

const allSubjects = [
  { id: 'sub1', name: 'English', code: 'ENG' },
  { id: 'sub2', name: 'Mathematics', code: 'MATH' },
  { id: 'sub3', name: 'Science', code: 'SCI' },
  { id: 'sub4', name: 'Physics', code: 'PHY' },
  { id: 'sub5', name: 'Chemistry', code: 'CHEM' },
  { id: 'sub6', name: 'Biology', code: 'BIO' },
  { id: 'sub7', name: 'History', code: 'HIST' },
  { id: 'sub8', name: 'Geography', code: 'GEO' },
  { id: 'sub9', name: 'Computer Science', code: 'CS' },
  { id: 'sub10', name: 'Art', code: 'ART' },
  { id: 'sub11', name: 'Music', code: 'MUS' },
  { id: 'sub12', name: 'Physical Education', code: 'PE' },
];

type ApiSection = any;
type ApiSubject = any;
type ApiClass = any;

function normalizeSection(section: ApiSection): Section {
  return {
    id: section?.id || section?.uuid || crypto.randomUUID?.() || `${Date.now()}`,
    name: typeof section?.name === 'string' ? section.name : String(section?.name?.name || section?.name || ''),
    capacity: Number(section?.capacity) || 0,
    enrolled: Number(section?.enrolled) || 0,
    room: section?.room || '',
    classTeacher: typeof section?.classTeacher === 'string' ? section.classTeacher : section?.classTeacher?.name,
    classTeacherId: section?.classTeacherId,
  };
}

function normalizeSubject(subject: ApiSubject): Subject {
  return {
    id: subject?.id || subject?.uuid || crypto.randomUUID?.() || `${Date.now()}`,
    name: typeof subject?.name === 'string' ? subject.name : String(subject?.name?.name || subject?.name || ''),
    code: subject?.code || '',
    teacher: typeof subject?.teacher === 'string' ? subject.teacher : subject?.teacher?.name || '',
    teacherId: subject?.teacherId,
  };
}

function normalizeClass(cls: ApiClass): ClassData {
  const sections = Array.isArray(cls?.sections) ? cls.sections.map(normalizeSection) : [];
  const subjects = Array.isArray(cls?.subjects) ? cls.subjects.map(normalizeSubject) : [];

  const totalCapacity = Number(cls?.totalCapacity) ||
    (sections.length ? sections.reduce((sum, s) => sum + (Number(s.capacity) || 0), 0) : 0);

  return {
    id: cls?.id || cls?.uuid || `${Date.now()}`,
    name: typeof cls?.name === 'string' ? cls.name : String(cls?.name?.name || cls?.name || ''),
    grade: Number(cls?.grade) || 0,
    academicYear: typeof cls?.academicYear === 'string' ? cls.academicYear : String(cls?.academicYear || ''),
    sections,
    subjects,
    totalStudents: Number(cls?.totalStudents) || 0,
    totalCapacity,
  };
}

export function Classes() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [classToDelete, setClassToDelete] = useState<ClassData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [className, setClassName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [academicYear, setAcademicYear] = useState('2024-2025');
  const [sections, setSections] = useState<Section[]>([
    { id: '1', name: 'A', capacity: 40, enrolled: 0, room: '' }
  ]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  // Fetch classes on mount
  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setIsLoading(true);
    try {
      const response = await adminService.getClasses();

      const classesData: ClassData[] = Array.isArray(response?.classes)
        ? response.classes.map(normalizeClass)
        : [];

      setClasses(classesData);
    } catch (error: any) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to load classes. Please try again.');
      setClasses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const totalClasses = classes.length;
  const totalSections = classes.reduce((sum, cls) => sum + cls.sections.length, 0);
  const totalStudents = classes.reduce((sum, cls) => sum + cls.totalStudents, 0);
  const totalCapacity = classes.reduce((sum, cls) => sum + cls.totalCapacity, 0);

  const handleAddSection = () => {
    const newSection: Section = {
      id: `${sections.length + 1}`,
      name: String.fromCharCode(65 + sections.length), // A, B, C, etc.
      capacity: 40,
      enrolled: 0,
      room: '',
    };
    setSections([...sections, newSection]);
  };

  const handleRemoveSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
  };

  const handleUpdateSection = (id: string, field: keyof Section, value: any) => {
    setSections(sections.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleViewDetails = async (classData: ClassData) => {
    try {
      const response = await adminService.getClassById(classData.id);

      if (response.data) {
        const classDetails = normalizeClass(response.data);

        setSelectedClass(classDetails);
        setShowDetailDialog(true);
      } else {
        setSelectedClass(normalizeClass(classData));
        setShowDetailDialog(true);
      }
    } catch (error: any) {
      console.error('Error fetching class details:', error);
      toast.error('Failed to load class details. Showing cached data.');
      setSelectedClass(classData);
      setShowDetailDialog(true);
    }
  };

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleEditClass = async (classData: ClassData) => {
    try {
      const response = await adminService.getClassById(classData.id);

      if (response.data) {
        const classDetails = normalizeClass(response.data);

        setEditingClassId(classDetails.id);
        setIsEditMode(true);
        setClassName(classDetails.name);
        setGradeLevel(classDetails.grade.toString());
        setAcademicYear(classDetails.academicYear);
        setSections(classDetails.sections.map(s => ({ ...s })));
        setSelectedSubjects(classDetails.subjects.map(s => s.id));
        setActiveTab('overview');
        setShowAddDialog(true);
      } else {
        const normalized = normalizeClass(classData);
        setEditingClassId(normalized.id);
        setIsEditMode(true);
        setClassName(normalized.name);
        setGradeLevel(normalized.grade.toString());
        setAcademicYear(normalized.academicYear);
        setSections(normalized.sections.map(s => ({ ...s })));
        setSelectedSubjects(normalized.subjects.map(s => s.id));
        setActiveTab('overview');
        setShowAddDialog(true);
      }
    } catch (error: any) {
      console.error('Error fetching class for edit:', error);
      toast.error('Failed to load class data. Using cached data.');
      setEditingClassId(classData.id);
      setIsEditMode(true);
      setClassName(classData.name);
      setGradeLevel(classData.grade.toString());
      setAcademicYear(classData.academicYear);
      setSections(classData.sections.map(s => ({ ...s })));
      setSelectedSubjects(classData.subjects.map(s => s.id));
      setActiveTab('overview');
      setShowAddDialog(true);
    }
  };

  const handleDeleteClass = (classData: ClassData) => {
    setClassToDelete(classData);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!classToDelete) return;

    setIsDeleting(true);
    try {
      await adminService.deleteClass(classToDelete.id);

      setClasses(classes.filter(c => c.id !== classToDelete.id));
      toast.success(`Class "${classToDelete.name}" deleted successfully`);
      setShowDeleteDialog(false);
      setClassToDelete(null);
    } catch (error: any) {
      let errorMessage = 'Failed to delete class. Please try again.';

      if (error instanceof ApiException) {
        errorMessage = getUserFriendlyError(error);
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
      console.error('Delete class error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetForm = () => {
    setClassName('');
    setGradeLevel('');
    setAcademicYear('2024-2025');
    setSections([{ id: '1', name: 'A', capacity: 40, enrolled: 0, room: '' }]);
    setSelectedSubjects([]);
    setActiveTab('overview');
  };

  const handleSubmitClass = async () => {
    // Validate required fields
    if (!className || className.trim() === '') {
      toast.error('Class name is required');
      return;
    }

    if (!gradeLevel || gradeLevel.trim() === '') {
      toast.error('Grade level is required');
      return;
    }

    if (!sections || sections.length === 0) {
      toast.error('At least one section is required');
      return;
    }

    // Validate sections
    for (const section of sections) {
      if (!section.name || section.name.trim() === '') {
        toast.error('All sections must have a name');
        return;
      }
      if (!section.capacity || section.capacity <= 0) {
        toast.error('All sections must have a valid capacity');
        return;
      }
    }

    if (isEditMode && editingClassId) {
      // Update existing class - Call API
      setIsSubmitting(true);
      try {
        const requestData: UpdateClassRequest = {
          name: className.trim(),
          grade: parseInt(gradeLevel),
          academicYear: academicYear,
          sections: sections.map(section => ({
            name: section.name.trim(),
            capacity: section.capacity,
            room: section.room?.trim() || undefined,
            classTeacherId: section.classTeacherId || undefined,
          })),
          subjectIds: selectedSubjects.length > 0 ? selectedSubjects : undefined,
        };

        if (import.meta.env.DEV) {
          console.log('Update Class Request:', {
            classId: editingClassId,
            requestData,
          });
        }

        const response = await adminService.updateClass(editingClassId, requestData);

        if (response.data) {
        const updatedClass: ClassData = normalizeClass(response.data);

          setClasses(classes.map(c => c.id === editingClassId ? updatedClass : c));
          toast.success(`Class "${className}" updated successfully`);

          setShowAddDialog(false);
          setIsEditMode(false);
          setEditingClassId(null);
          handleResetForm();
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (error: any) {
        let errorMessage = 'Failed to update class. Please try again.';

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
          console.error('Update class error:', {
            error,
            message: errorMessage,
            response: error?.response,
            data: error?.response?.data,
          });
        }

        toast.error(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Add new class - Call API
    setIsSubmitting(true);
    try {
      // Prepare request data
      const requestData: AddClassRequest = {
        name: className.trim(),
        grade: parseInt(gradeLevel),
        academicYear: academicYear,
        sections: sections.map(section => ({
          name: section.name.trim(),
          capacity: section.capacity,
          room: section.room?.trim() || undefined,
          classTeacherId: section.classTeacherId || undefined,
        })),
        subjectIds: selectedSubjects.length > 0 ? selectedSubjects : undefined,
      };

      if (import.meta.env.DEV) {
        console.log('Add Class Request:', requestData);
      }

      // Call API
      const response = await adminService.addClass(requestData);

      if (response.data) {
        // Convert API response to ClassData format
        const newClass: ClassData = normalizeClass(response.data);

        setClasses([...classes, newClass]);
        toast.success(`Class "${className}" created successfully`);

        setShowAddDialog(false);
        handleResetForm();

        // Refresh classes list
        await fetchClasses();
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      let errorMessage = 'Failed to create class. Please try again.';

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
        console.error('Add class error:', {
          error,
          message: errorMessage,
          response: error?.response,
          data: error?.response?.data,
        });
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setIsEditMode(false);
    setEditingClassId(null);
    handleResetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-white mb-2">Classes & Sections</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage class structure and subject mapping</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-[#0A66C2] hover:bg-[#0052A3]">
          <Plus className="w-4 h-4 mr-2" />
          Add Class
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Classes</p>
              <h3 className="text-2xl text-gray-900 dark:text-white mb-2">{totalClasses}</h3>
              <p className="text-sm text-gray-600">Active this year</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-[#E8F0FE] flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-[#0A66C2]" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Sections</p>
              <h3 className="text-2xl text-gray-900 dark:text-white mb-2">{totalSections}</h3>
              <p className="text-sm text-gray-600">Across all grades</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
              <Settings className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Students</p>
              <h3 className="text-2xl text-gray-900 dark:text-white mb-2">{totalStudents}</h3>
              <p className="text-sm text-gray-600">Enrolled students</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Capacity</p>
              <h3 className="text-2xl text-gray-900 dark:text-white mb-2">{totalCapacity}</h3>
              <p className="text-sm text-green-600">{totalCapacity - totalStudents} seats available</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Classes Table */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Search classes..." className="pl-10" />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Loading classes...</p>
          </div>
        ) : classes.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No classes found. Click "Add Class" to create one.</p>
          </div>
        ) : (
          <>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800">
                    <TableHead>Class</TableHead>
                    <TableHead>Sections</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Subjects</TableHead>
                    <TableHead>Occupancy</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map((classData) => {
                    const capacity = Number(classData.totalCapacity) || 0;
                    const students = Number(classData.totalStudents) || 0;
                    const occupancy = capacity > 0 ? (students / capacity) * 100 : 0;
                    const occupancyClass = occupancy > 90
                      ? 'bg-red-500'
                      : occupancy > 75
                        ? 'bg-orange-500'
                        : 'bg-green-500';
                    const occupancyBarClasses = ['h-full', occupancyClass].join(' ');
                    return (
                      <TableRow key={classData.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <TableCell>
                          <div>
                            <p className="text-sm text-gray-900 dark:text-white">{classData.name || 'Untitled'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Academic Year: {classData.academicYear}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {classData.sections.map(section => (
                              <Badge key={section.id} variant="outline" className="text-xs">
                                {section.name}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-white">
                          {classData.totalStudents}
                        </TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-300">
                          {classData.totalCapacity}
                        </TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-300">
                          {classData.subjects.length} subjects
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden max-w-[80px]">
                              <div
                                className={occupancyBarClasses}
                                style={{ width: `${occupancy}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {occupancy.toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(classData)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditClass(classData)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDeleteClass(classData)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </Card>

      {/* Dialogs */}
      {/* Add/Edit Class Dialog */}
      <Dialog open={showAddDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Class' : 'Add New Class'}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Update class information, sections and subjects' : 'Create a new class with sections and subjects'}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden min-h-0">
            <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
              <TabsTrigger value="overview">Basic Info</TabsTrigger>
              <TabsTrigger value="sections">Sections</TabsTrigger>
              <TabsTrigger value="subjects">Subjects</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden min-h-0">
              <TabsContent value="overview" className="space-y-4 mt-4 h-full overflow-y-auto pr-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="className">Class Name</Label>
                    <Input
                      id="className"
                      placeholder="e.g., Grade 10"
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grade">Grade Level</Label>
                    <Select value={gradeLevel} onValueChange={setGradeLevel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(grade => (
                          <SelectItem key={grade} value={grade.toString()}>
                            Grade {grade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="academicYear">Academic Year</Label>
                    <Input
                      id="academicYear"
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      placeholder="e.g., 2024-2025"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="classType">Class Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regular">Regular</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="honors">Honors</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="sections" className="space-y-4 mt-4 h-full overflow-y-auto pr-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Configure sections for this class
                  </p>
                  <Button onClick={handleAddSection} size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Section
                  </Button>
                </div>

                <div className="space-y-3">
                  {sections.map((section, index) => (
                    <Card key={section.id} className="p-4">
                      <div className="grid grid-cols-5 gap-3">
                        <div className="space-y-2">
                          <Label>Section Name</Label>
                          <Input
                            value={section.name}
                            onChange={(e) => handleUpdateSection(section.id, 'name', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Capacity</Label>
                          <Input
                            type="number"
                            value={section.capacity}
                            onChange={(e) => handleUpdateSection(section.id, 'capacity', parseInt(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Room Number</Label>
                          <Input
                            placeholder="e.g., 201"
                            value={section.room}
                            onChange={(e) => handleUpdateSection(section.id, 'room', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label>Class Teacher</Label>
                          <div className="flex gap-2">
                            <Select onValueChange={(value) => handleUpdateSection(section.id, 'classTeacher', value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Assign teacher" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableTeachers.map(teacher => (
                                  <SelectItem key={teacher.id} value={teacher.name}>
                                    {teacher.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {sections.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveSection(section.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="subjects" className="mt-4 h-full flex flex-col overflow-hidden">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-shrink-0">
                  Select subjects to be taught in this class
                </p>

                <ScrollArea className="flex-1 min-h-0">
                  <div className="grid grid-cols-2 gap-4 pr-4 pb-4">
                    {allSubjects.map(subject => {
                      const isSelected = selectedSubjects.includes(subject.id);
                      const subjectClasses = [
                        'p-4',
                        'cursor-pointer',
                        'transition-all',
                        isSelected ? 'border-[#0A66C2] bg-[#E8F0FE] dark:bg-[#0A66C2]/10' : '',
                      ]
                        .filter(Boolean)
                        .join(' ');

                      return (
                        <Card
                          key={subject.id}
                          className={subjectClasses}
                          onClick={() => handleSubjectToggle(subject.id)}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleSubjectToggle(subject.id)}
                            />
                            <div className="flex-1">
                              <p className="text-sm text-gray-900 dark:text-white mb-1">
                                {subject.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Code: {subject.code}
                              </p>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>

          <Separator className="my-4" />

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            {activeTab === 'subjects' ? (
              <Button
                className="bg-[#0A66C2] hover:bg-[#0052A3]"
                onClick={handleSubmitClass}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : isEditMode ? 'Update Class' : 'Create Class'}
              </Button>
            ) : (
              <Button
                className="bg-[#0A66C2] hover:bg-[#0052A3]"
                onClick={() => {
                  if (activeTab === 'overview') setActiveTab('sections');
                  else if (activeTab === 'sections') setActiveTab('subjects');
                }}
              >
                Next Step
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Class Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedClass?.name} - Details</DialogTitle>
            <DialogDescription>Complete overview of class structure and subjects</DialogDescription>
          </DialogHeader>

          {selectedClass && (
            <ScrollArea className="flex-1">
              <div className="space-y-6 pr-4">
                {/* Overview Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <Card className="p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Sections</p>
                    <p className="text-2xl text-gray-900 dark:text-white">
                      {selectedClass.sections.length}
                    </p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Students</p>
                    <p className="text-2xl text-gray-900 dark:text-white">
                      {selectedClass.totalStudents}
                    </p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Subjects</p>
                    <p className="text-2xl text-gray-900 dark:text-white">
                      {selectedClass.subjects.length}
                    </p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Occupancy</p>
                    <p className="text-2xl text-gray-900 dark:text-white">
                      {((selectedClass.totalStudents / selectedClass.totalCapacity) * 100).toFixed(0)}%
                    </p>
                  </Card>
                </div>

                {/* Sections Detail */}
                <div>
                  <h3 className="text-lg text-gray-900 dark:text-white mb-3">Sections</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedClass.sections.map(section => (
                      <Card key={section.id} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="text-gray-900 dark:text-white mb-1">
                              Section {section.name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Room: {section.room || 'Not assigned'}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {section.enrolled}/{section.capacity}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Class Teacher</span>
                            <span className="text-gray-900 dark:text-white">
                              {section.classTeacher || 'Not assigned'}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#0A66C2]"
                              style={{ width: `${(section.enrolled / section.capacity) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Subjects Detail */}
                <div>
                  <h3 className="text-lg text-gray-900 dark:text-white mb-3">Subject Mapping</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 dark:bg-gray-800">
                          <TableHead>Subject</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead>Assigned Teacher</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedClass.subjects.map(subject => (
                          <TableRow key={subject.id}>
                            <TableCell className="text-gray-900 dark:text-white">
                              {subject.name}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{subject.code}</Badge>
                            </TableCell>
                            <TableCell className="text-gray-700 dark:text-gray-300">
                              {subject.teacher || 'Not assigned'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm">
                                Assign Teacher
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the class
              <span className="font-semibold text-gray-900 dark:text-white">
                {' '}"{classToDelete?.name}"
              </span>
              {' '}and all its associated data including sections and subject mappings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setClassToDelete(null)} disabled={isDeleting}>
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
