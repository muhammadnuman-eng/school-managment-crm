import { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock,
  Download,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  MoreVertical
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Calendar } from '../ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '../ui/utils';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { toast } from 'sonner';
import { adminService } from '../../services';
import { ClassResponse } from '../../types/class.types';
import { Student } from '../../types/student.types';
import { 
  AttendanceRecord as APIAttendanceRecord,
  AttendanceStatus,
  CreateAttendanceRequest,
  AttendanceResponse,
  AttendanceReport,
  LeaveApplication,
  CreateLeaveApplicationRequest
} from '../../types/attendance.types';
import { ApiException, getUserFriendlyError } from '../../utils/errors';
import { schoolStorage, userStorage } from '../../utils/storage';

interface LocalAttendanceRecord {
  date: string;
  class: string;
  section: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
}

interface StudentWithAttendance extends Student {
  status: AttendanceStatus | null;
  attendanceId?: string;
}

export function Attendance() {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [students, setStudents] = useState<StudentWithAttendance[]>([]);
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [activeTab, setActiveTab] = useState('mark');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState<LocalAttendanceRecord[]>([]);
  const [attendanceReport, setAttendanceReport] = useState<AttendanceReport | null>(null);

  // Fetch classes on mount
  useEffect(() => {
    fetchClasses();
  }, []);

  // Fetch students when class and section are selected
  useEffect(() => {
    if (selectedClassId && selectedSectionId) {
      fetchStudents();
      fetchExistingAttendance();
    }
  }, [selectedClassId, selectedSectionId, selectedDate]);

  // Fetch attendance history when reports tab is active
  useEffect(() => {
    if (activeTab === 'reports') {
      fetchAttendanceHistory();
    }
  }, [activeTab]);

  const fetchClasses = async () => {
    try {
      const response = await adminService.getClasses();
      setClasses(response.classes || []);
    } catch (error: any) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to load classes');
    }
  };

  const fetchStudents = async () => {
    if (!selectedClassId || !selectedSectionId) return;
    
    setIsLoading(true);
    try {
      const response = await adminService.getStudents({
        class: selectedClass,
      });
      
      // Filter students by section
      const sectionStudents = (response.students || []).filter((student: any) => {
        const sectionMatch = selectedSectionId && student.currentSectionId === selectedSectionId;
        return sectionMatch;
      });

      // Normalize student data
      const normalizedStudents: StudentWithAttendance[] = sectionStudents.map((student: any) => ({
        id: student.id,
        name: student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim(),
        rollNo: student.rollNo || '',
        status: null,
        email: student.email,
        phone: student.phone,
      }));

      setStudents(normalizedStudents);
    } catch (error: any) {
      console.error('Error fetching students:', error);
      let errorMessage = 'Failed to load students';
      if (error instanceof ApiException) {
        errorMessage = getUserFriendlyError(error);
      }
      toast.error(errorMessage);
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExistingAttendance = async () => {
    if (!selectedClassId || !selectedSectionId || !selectedDate) return;

    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await adminService.getAttendance({
        classId: selectedClassId,
        sectionId: selectedSectionId,
        startDate: dateStr,
        endDate: dateStr,
      });

      // Map existing attendance to students
      if (response.attendances && response.attendances.length > 0) {
        const attendanceMap = new Map<string, APIAttendanceRecord>();
        response.attendances.forEach((att: APIAttendanceRecord) => {
          attendanceMap.set(att.studentId, att);
        });

        setStudents(prevStudents => 
          prevStudents.map(student => {
            const att = attendanceMap.get(student.id);
            return att ? {
              ...student,
              status: att.status,
              attendanceId: att.id,
            } : student;
          })
        );
      }
    } catch (error: any) {
      console.error('Error fetching existing attendance:', error);
      // Don't show error toast for this, it's okay if no attendance exists
    }
  };

  const fetchAttendanceHistory = async () => {
    try {
      // Get last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const response = await adminService.getAttendance({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        limit: 100,
      });

      // Group by date, class, section
      const grouped = new Map<string, LocalAttendanceRecord>();
      
      (response.attendances || []).forEach((att: APIAttendanceRecord) => {
        const key = `${att.attendanceDate}-${att.classId}-${att.sectionId}`;
        if (!grouped.has(key)) {
          grouped.set(key, {
            date: att.attendanceDate,
            class: att.className || '',
            section: att.sectionName || '',
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
            total: 0,
          });
        }
        
        const record = grouped.get(key)!;
        record.total++;
        if (att.status === 'PRESENT') record.present++;
        else if (att.status === 'ABSENT') record.absent++;
        else if (att.status === 'LATE') record.late++;
        else if (att.status === 'EXCUSED') record.excused++;
      });

      setAttendanceHistory(Array.from(grouped.values()));
    } catch (error: any) {
      console.error('Error fetching attendance history:', error);
      toast.error('Failed to load attendance history');
    }
  };

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    const selectedClassObj = classes.find(c => c.id === classId);
    setSelectedClassId(classId);
    setSelectedSection('');
    setSelectedSectionId('');
    setStudents([]);
  };

  const handleSectionChange = (sectionId: string) => {
    setSelectedSection(sectionId);
    setSelectedSectionId(sectionId);
  };

  const handleMarkAttendance = (studentId: string, status: AttendanceStatus) => {
    setStudents(students.map(s => 
      s.id === studentId ? { ...s, status } : s
    ));
  };

  const handleMarkAll = (status: 'PRESENT' | 'ABSENT') => {
    setStudents(students.map(s => ({ ...s, status })));
    toast.success(`All students marked as ${status.toLowerCase()}`);
  };

  const handleSubmitAttendance = async () => {
    if (!selectedClassId || !selectedSectionId || !selectedDate) {
      toast.error('Please select class, section, and date');
      return;
    }

    const unmarked = students.filter(s => !s.status).length;
    if (unmarked > 0) {
      toast.error(`Please mark attendance for all ${unmarked} students`);
      return;
    }

    setIsSubmitting(true);
    try {
      const schoolId = schoolStorage.getSchoolId();
      const currentUser = userStorage.getUser();
      const markedBy = currentUser?.id || currentUser?.uuid || '';

      if (!schoolId || !markedBy) {
        toast.error('Unable to identify school or user');
        return;
      }

      const dateStr = selectedDate.toISOString().split('T')[0];
      const promises = students.map(student => {
        const request: CreateAttendanceRequest = {
          schoolId,
          studentId: student.id,
          classId: selectedClassId,
          sectionId: selectedSectionId,
          attendanceDate: dateStr,
          status: student.status!,
          markedBy,
        };

        // If attendance already exists, update it instead
        if (student.attendanceId) {
          return adminService.updateAttendance(student.attendanceId, {
            status: student.status!,
          });
        } else {
          return adminService.createAttendance(request);
        }
      });

      await Promise.all(promises);
      toast.success('Attendance submitted successfully!');
      
      // Refresh attendance data
      await fetchExistingAttendance();
    } catch (error: any) {
      console.error('Error submitting attendance:', error);
      let errorMessage = 'Failed to submit attendance';
      if (error instanceof ApiException) {
        errorMessage = getUserFriendlyError(error);
      }
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAttendanceStats = () => {
    const present = students.filter(s => s.status === 'PRESENT').length;
    const absent = students.filter(s => s.status === 'ABSENT').length;
    const late = students.filter(s => s.status === 'LATE').length;
    const excused = students.filter(s => s.status === 'EXCUSED').length;
    const total = students.length;

    return { present, absent, late, excused, total };
  };

  const stats = getAttendanceStats();

  const filteredStudents = useMemo(() => {
    return students.filter(student =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Get sections for selected class
  const selectedClassObj = classes.find(c => c.id === selectedClassId);
  const sections = selectedClassObj?.sections || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-white mb-2">Attendance Tracking</h1>
          <p className="text-gray-600 dark:text-gray-400">Mark and monitor student attendance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="mark">Mark Attendance</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="reports">Reports & History</TabsTrigger>
        </TabsList>

        {/* Mark Attendance Tab */}
        <TabsContent value="mark" className="space-y-6">
          {/* Selection Controls */}
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-700 dark:text-gray-300">Select Class</label>
                <Select value={selectedClassId} onValueChange={handleClassChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-700 dark:text-gray-300">Select Section</label>
                <Select 
                  value={selectedSectionId} 
                  onValueChange={handleSectionChange}
                  disabled={!selectedClassId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map(section => (
                      <SelectItem key={section.id || section.uuid} value={section.id || section.uuid}>
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-700 dark:text-gray-300">Select Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? selectedDate.toLocaleDateString() : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-700 dark:text-gray-300">Quick Actions</label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkAll('PRESENT')}
                    className="flex-1"
                    disabled={!selectedClassId || !selectedSectionId}
                  >
                    <UserCheck className="w-4 h-4 mr-1" />
                    All Present
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkAll('ABSENT')}
                    className="flex-1"
                    disabled={!selectedClassId || !selectedSectionId}
                  >
                    <UserX className="w-4 h-4 mr-1" />
                    All Absent
                  </Button>
                </div>
              </div>
            </div>

            {selectedClassId && selectedSectionId && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Marking for:</span> {selectedClassObj?.name} - Section {sections.find(s => (s.id || s.uuid) === selectedSectionId)?.name} • {formatDate(selectedDate)}
                </p>
              </div>
            )}
          </Card>

          {/* Statistics */}
          {selectedClassId && selectedSectionId && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#E8F0FE] flex items-center justify-center">
                    <Users className="w-5 h-5 text-[#0A66C2]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                    <p className="text-xl text-gray-900 dark:text-white">{stats.total}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Present</p>
                    <p className="text-xl text-gray-900 dark:text-white">{stats.present}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Absent</p>
                    <p className="text-xl text-gray-900 dark:text-white">{stats.absent}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Late</p>
                    <p className="text-xl text-gray-900 dark:text-white">{stats.late}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Excused</p>
                    <p className="text-xl text-gray-900 dark:text-white">{stats.excused}</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Student List */}
          {selectedClassId && selectedSectionId && (
            <Card className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    placeholder="Search students by name or roll number..." 
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-gray-600 dark:text-gray-400">Loading students...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-gray-600 dark:text-gray-400">No students found</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-800">
                        <TableHead>Roll No</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <TableCell className="text-gray-700 dark:text-gray-300">
                            {student.rollNo || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-gradient-to-br from-[#0A66C2] to-[#0052A3] text-white">
                                  {student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-gray-900 dark:text-white">{student.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {student.status ? (
                              <Badge 
                                variant="outline"
                                className={cn(
                                  student.status === 'PRESENT' && 'bg-green-100 text-green-700 border-green-200',
                                  student.status === 'ABSENT' && 'bg-red-100 text-red-700 border-red-200',
                                  student.status === 'LATE' && 'bg-orange-100 text-orange-700 border-orange-200',
                                  student.status === 'EXCUSED' && 'bg-blue-100 text-blue-700 border-blue-200'
                                )}
                              >
                                {student.status.charAt(0) + student.status.slice(1).toLowerCase()}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">
                                Not Marked
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant={student.status === 'PRESENT' ? 'default' : 'outline'}
                                className={cn(
                                  "h-8",
                                  student.status === 'PRESENT' && 'bg-green-600 hover:bg-green-700'
                                )}
                                onClick={() => handleMarkAttendance(student.id, 'PRESENT')}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant={student.status === 'ABSENT' ? 'default' : 'outline'}
                                className={cn(
                                  "h-8",
                                  student.status === 'ABSENT' && 'bg-red-600 hover:bg-red-700'
                                )}
                                onClick={() => handleMarkAttendance(student.id, 'ABSENT')}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="outline" className="h-8">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleMarkAttendance(student.id, 'LATE')}>
                                    <Clock className="w-4 h-4 mr-2" />
                                    Mark as Late
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleMarkAttendance(student.id, 'EXCUSED')}>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Mark as Excused
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="flex justify-end mt-6">
                <Button 
                  className="bg-[#0A66C2] hover:bg-[#0052A3]"
                  onClick={handleSubmitAttendance}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Attendance'}
                </Button>
              </div>
            </Card>
          )}

          {!selectedClassId && (
            <Card className="p-12 text-center">
              <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg text-gray-900 dark:text-white mb-2">Select Class and Section</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose a class and section to start marking attendance
              </p>
            </Card>
          )}
        </TabsContent>

        {/* Calendar View Tab */}
        <TabsContent value="calendar" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 p-6">
              <h3 className="text-lg text-gray-900 dark:text-white mb-4">Select Date</h3>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
              />
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-700 dark:text-gray-300">High Attendance (&gt;90%)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-gray-700 dark:text-gray-300">Medium (75-90%)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-gray-700 dark:text-gray-300">Low (&lt;75%)</span>
                </div>
              </div>
            </Card>

            <Card className="lg:col-span-2 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg text-gray-900 dark:text-white">
                  {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                Calendar view with attendance data will be displayed here
              </p>
            </Card>
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Search by class or date..." className="pl-10" />
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
                    <TableHead>Date</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Present</TableHead>
                    <TableHead>Absent</TableHead>
                    <TableHead>Late</TableHead>
                    <TableHead>Attendance Rate</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No attendance records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    attendanceHistory.map((record, index) => {
                      const rate = record.total > 0 ? (record.present / record.total) * 100 : 0;
                      return (
                        <TableRow key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <TableCell className="text-gray-900 dark:text-white">
                            {new Date(record.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </TableCell>
                          <TableCell className="text-gray-700 dark:text-gray-300">
                            {record.class}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{record.section}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-green-600">{record.present}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-red-600">{record.absent}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-orange-600">{record.late}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden max-w-[80px]">
                                <div 
                                  className={cn(
                                    "h-full",
                                    rate > 90 ? 'bg-green-500' : 
                                    rate > 75 ? 'bg-orange-500' : 
                                    'bg-red-500'
                                  )}
                                  style={{ width: `${Math.min(rate, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {rate.toFixed(0)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">View Details</Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
