import { useState, useMemo } from 'react';
import { Search, Filter, Plus, Download, MoreVertical, Eye, Edit, Trash2, X, CheckCircle2 } from 'lucide-react';
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

interface Student {
  id: number;
  name: string;
  rollNo: string;
  class: string;
  section: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive';
  attendance: number;
}

const initialStudents: Student[] = [
  { id: 1, name: 'Emily Rodriguez', rollNo: 'ST001', class: 'Grade 10A', section: 'A', email: 'emily.r@school.com', phone: '+1234567890', status: 'Active', attendance: 95 },
  { id: 2, name: 'James Wilson', rollNo: 'ST002', class: 'Grade 9B', section: 'B', email: 'james.w@school.com', phone: '+1234567891', status: 'Active', attendance: 92 },
  { id: 3, name: 'Sophia Lee', rollNo: 'ST003', class: 'Grade 11A', section: 'A', email: 'sophia.l@school.com', phone: '+1234567892', status: 'Active', attendance: 98 },
  { id: 4, name: 'Oliver Thompson', rollNo: 'ST004', class: 'Grade 8C', section: 'C', email: 'oliver.t@school.com', phone: '+1234567893', status: 'Active', attendance: 88 },
  { id: 5, name: 'Ava Martinez', rollNo: 'ST005', class: 'Grade 12A', section: 'A', email: 'ava.m@school.com', phone: '+1234567894', status: 'Active', attendance: 96 },
  { id: 6, name: 'Noah Garcia', rollNo: 'ST006', class: 'Grade 7B', section: 'B', email: 'noah.g@school.com', phone: '+1234567895', status: 'Inactive', attendance: 75 },
];

export function Students() {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
  
  // Class view state (default: Grade 10)
  const [currentViewClass, setCurrentViewClass] = useState<string>('Grade 10');
  
  // Filter state
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [filterType, setFilterType] = useState<'status' | null>(null);
  const [selectedFilterStatus, setSelectedFilterStatus] = useState<'Active' | 'Inactive' | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [dob, setDob] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [section, setSection] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [address, setAddress] = useState('');

  const handleViewProfile = (student: Student) => {
    setSelectedStudent(student);
    setShowProfileDialog(true);
  };

  const handleExport = () => {
    toast.success('Downloading CSV', {
      description: 'Student data exported successfully',
    });
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setIsEditMode(false);
    setEditingStudentId(null);
    // Reset form when closing
    setFirstName('');
    setLastName('');
    setRollNo('');
    setDob('');
    setSelectedClass('');
    setSection('');
    setEmail('');
    setPhone('');
    setParentPhone('');
    setAddress('');
  };

  // Get unique classes from students
  const availableClasses = useMemo(() => {
    const classes = students.map(s => {
      // Extract grade from class string (e.g., "Grade 10A" -> "Grade 10")
      const match = s.class.match(/^(Grade \d+)/);
      return match ? match[1] : s.class;
    });
    return Array.from(new Set(classes)).sort();
  }, [students]);

  // Filter students based on current view class, search and status filter
  const filteredStudents = useMemo(() => {
    let filtered = students;

    // First filter by current view class (always applied)
    filtered = filtered.filter(s => s.class.startsWith(currentViewClass));

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.rollNo.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterType === 'status' && selectedFilterStatus) {
      filtered = filtered.filter(s => s.status === selectedFilterStatus);
    }

    return filtered;
  }, [students, currentViewClass, searchQuery, filterType, selectedFilterStatus]);

  // Handle edit student
  const handleEditStudent = (student: Student) => {
    setIsEditMode(true);
    setEditingStudentId(student.id);
    setSelectedStudent(student);
    
    // Extract first and last name
    const nameParts = student.name.split(' ');
    setFirstName(nameParts[0] || '');
    setLastName(nameParts.slice(1).join(' ') || '');
    
    // Extract class and section from class string (e.g., "Grade 10A" -> "Grade 10" and "A")
    const classMatch = student.class.match(/^(Grade \d+)([A-Z])?$/);
    if (classMatch) {
      setSelectedClass(classMatch[1]);
      setSection(classMatch[2] || '');
    } else {
      setSelectedClass(student.class);
      setSection(student.section);
    }
    
    setRollNo(student.rollNo);
    setEmail(student.email);
    setPhone(student.phone);
    setDob('');
    setParentPhone('');
    setAddress('');
    
    setShowAddDialog(true);
  };

  // Handle update student
  const handleUpdateStudent = () => {
    if (!editingStudentId) return;

    // Validate required fields
    if (!firstName || !lastName || !rollNo || !selectedClass || !section || !email || !phone) {
      toast.error('Please fill all required fields', {
        description: 'First name, last name, roll number, class, section, email, and phone are required.',
      });
      return;
    }

    // Check if roll number already exists (excluding current student)
    const rollNoExists = students.some(s => s.rollNo === rollNo && s.id !== editingStudentId);
    if (rollNoExists) {
      toast.error('Roll number already exists', {
        description: 'Please use a different roll number.',
      });
      return;
    }

    // Update student
    const formattedClass = `${selectedClass}${section}`;
    const updatedStudent: Student = {
      id: editingStudentId,
      name: `${firstName} ${lastName}`,
      rollNo: rollNo,
      class: formattedClass,
      section: section,
      email: email,
      phone: phone,
      status: students.find(s => s.id === editingStudentId)?.status || 'Active',
      attendance: students.find(s => s.id === editingStudentId)?.attendance || 0,
    };

    setStudents(students.map(s => s.id === editingStudentId ? updatedStudent : s));

    // Show success toast
    toast.success('Student updated successfully', {
      description: `${updatedStudent.name} has been updated.`,
    });

    // Reset and close
    handleCloseDialog();
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

  const handleAddStudent = () => {
    // If in edit mode, call update instead
    if (isEditMode) {
      handleUpdateStudent();
      return;
    }

    // Validate required fields
    if (!firstName || !lastName || !rollNo || !selectedClass || !section || !email || !phone) {
      toast.error('Please fill all required fields', {
        description: 'First name, last name, roll number, class, section, email, and phone are required.',
      });
      return;
    }

    // Check if roll number already exists
    const rollNoExists = students.some(s => s.rollNo === rollNo);
    if (rollNoExists) {
      toast.error('Roll number already exists', {
        description: 'Please use a different roll number.',
      });
      return;
    }

    // Create new student object
    const formattedClass = `${selectedClass}${section}`; // e.g., "Grade 10A"
    const newStudent: Student = {
      id: students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1,
      name: `${firstName} ${lastName}`,
      rollNo: rollNo,
      class: formattedClass,
      section: section,
      email: email,
      phone: phone,
      status: 'Active',
      attendance: 0, // Default attendance for new student
    };

    // Add student to list
    setStudents([...students, newStudent]);

    // Show success toast with properly aligned icon and text
    toast.success(
      <div className="flex items-start gap-3 w-full">
        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <span className="font-semibold text-sm text-gray-900 dark:text-white leading-tight">Student added successfully</span>
          <span className="text-xs text-gray-600 dark:text-gray-400 leading-tight">{newStudent.name} has been added to the student list.</span>
        </div>
      </div>,
      {
        duration: 3000,
        icon: null, // Disable default icon to use our custom icon
      }
    );

    // Reset form
    handleCloseDialog();
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
                {availableClasses.map((cls) => (
                  <SelectItem key={cls} value={cls}>
                    {cls}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={() => {
              setIsEditMode(false);
              setEditingStudentId(null);
              handleCloseDialog();
              // Pre-fill class with current view class
              setSelectedClass(currentViewClass);
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
              placeholder="Search by name, roll no, or email..." 
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
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No students found
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                <TableRow key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gradient-to-br from-[#0A66C2] to-[#0052A3] text-white">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm text-gray-900 dark:text-white">{student.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{student.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-700 dark:text-gray-300">{student.rollNo}</TableCell>
                  <TableCell className="text-gray-700 dark:text-gray-300">{student.class}</TableCell>
                  <TableCell className="text-gray-700 dark:text-gray-300">{student.phone}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden max-w-[60px]">
                        <div
                          className="h-full bg-[#0A66C2]"
                          style={{ width: `${student.attendance}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{student.attendance}%</span>
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
                              <span className="text-xs text-gray-600 dark:text-gray-400 leading-tight">{student.name} is now {newStatus.toLowerCase()}.</span>
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
                        <DropdownMenuItem className="text-red-600">
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

      <Dialog open={showAddDialog} onOpenChange={handleCloseDialog}>
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
              <Label htmlFor="rollNo">Roll Number *</Label>
              <Input 
                id="rollNo" 
                placeholder="Enter roll number" 
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input 
                id="dob" 
                type="date" 
                value={dob}
                onChange={(e) => setDob(e.target.value)}
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
                  <SelectItem value="Grade 11">Grade 11</SelectItem>
                  <SelectItem value="Grade 12">Grade 12</SelectItem>
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
              <Select value={section} onValueChange={setSection}>
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                  <SelectItem value="D">D</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="email">Email *</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="student@school.com" 
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
              <Label htmlFor="parentPhone">Parent Phone</Label>
              <Input 
                id="parentPhone" 
                type="tel" 
                placeholder="+1234567890" 
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2 col-span-2">
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
    </div>
  );
}
