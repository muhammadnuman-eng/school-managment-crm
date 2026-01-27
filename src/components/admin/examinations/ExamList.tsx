import { useState, useEffect } from 'react';
import { Search, Filter, Download, Plus, ArrowLeft, Eye, Pencil, Clipboard, Send, Trash2, MoreVertical, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/dropdown-menu';
import { Progress } from '../../ui/progress';
import { Exam } from '../Examinations';
import { adminService } from '../../../services';
import { Examination, ExamType, ExamStatus } from '../../../types/examination.types';
import { toast } from 'sonner';

interface ExamListProps {
  onViewExam: (exam: Exam) => void;
  onCreateExam: () => void;
  onBack: () => void;
}

// Helper function to convert Examination to Exam
function convertExaminationToExam(examination: Examination): Exam {
  return {
    id: examination.id,
    name: examination.examName,
    type: examination.examType,
    academicYear: examination.academicYearName || examination.academicYearId,
    startDate: examination.startDate || '',
    endDate: examination.endDate || '',
    classes: examination.examClasses?.map(ec => ec.className || ec.classId) || [],
    subjects: examination.examSubjects?.map(es => es.subjectName || es.subjectId) || [],
    status: examination.status === 'SCHEDULED' ? 'Scheduled' : 
            examination.status === 'ONGOING' ? 'Ongoing' :
            examination.status === 'COMPLETED' ? 'Completed' : 'Archived',
    totalStudents: 0, // This would need to be calculated from examClasses
    marksEntryProgress: 0, // This would need to be fetched separately
    resultsPublished: 0, // This would need to be fetched separately
  };
}

export function ExamList({ onViewExam, onCreateExam, onBack }: ExamListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterExamType, setFilterExamType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalExams, setTotalExams] = useState(0);

  useEffect(() => {
    fetchExams();
  }, [searchQuery, filterStatus, filterExamType, currentPage, itemsPerPage]);

  const fetchExams = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (searchQuery) {
        params.search = searchQuery;
      }

      if (filterStatus !== 'all') {
        params.status = filterStatus.toUpperCase() as ExamStatus;
      }

      if (filterExamType !== 'all') {
        params.examType = filterExamType as ExamType;
      }

      const response = await adminService.getExaminations(params);
      setExams(response.examinations.map(convertExaminationToExam));
      setTotalExams(response.total || response.examinations.length);
    } catch (error: any) {
      console.error('Error fetching exams:', error);
      toast.error('Failed to load examinations');
      setExams([]);
    } finally {
      setIsLoading(false);
    }
  };

  const totalPages = Math.ceil(totalExams / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;

  const removeFilter = (filter: string) => {
    setActiveFilters(activeFilters.filter(f => f !== filter));
    if (filter === 'Status') {
      setFilterStatus('all');
    } else if (filter === 'Type') {
      setFilterExamType('all');
    }
  };

  const handleDeleteExam = async (examId: string) => {
    if (!confirm('Are you sure you want to delete this examination?')) {
      return;
    }

    try {
      await adminService.deleteExamination(examId);
      toast.success('Examination deleted successfully');
      fetchExams();
    } catch (error: any) {
      console.error('Error deleting exam:', error);
      toast.error('Failed to delete examination');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Ongoing':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Completed':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Mid-Term':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Final':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Unit Test':
        return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      default:
        return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-[32px] text-gray-900 dark:text-white tracking-tight">
              All Examinations
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Dashboard &gt; Examinations &gt; All Exams
            </p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-xl">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search examinations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 dark:bg-gray-800"
            />
          </div>

          {/* Filter Dropdown - Status */}
          <Select value={filterStatus} onValueChange={(value) => {
            setFilterStatus(value);
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-full lg:w-48 bg-gray-50 dark:bg-gray-800">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter Dropdown - Exam Type */}
          <Select value={filterExamType} onValueChange={(value) => {
            setFilterExamType(value);
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-full lg:w-48 bg-gray-50 dark:bg-gray-800">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="QUIZ">Quiz</SelectItem>
              <SelectItem value="MID_TERM">Mid-Term</SelectItem>
              <SelectItem value="FINAL">Final</SelectItem>
              <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
              <SelectItem value="PROJECT">Project</SelectItem>
            </SelectContent>
          </Select>


          {/* Export */}
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>

          {/* Create */}
          <Button onClick={onCreateExam} className="bg-[#2563EB] hover:bg-[#1d4ed8] gap-2">
            <Plus className="w-4 h-4" />
            Create Exam
          </Button>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex items-center gap-2 mt-4">
            {activeFilters.map((filter) => (
              <Badge key={filter} variant="outline" className="gap-2">
                {filter}
                <button onClick={() => removeFilter(filter)}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            <Button variant="link" size="sm" onClick={() => setActiveFilters([])}>
              Clear All
            </Button>
          </div>
        )}
      </Card>

      {/* Data Table */}
      <Card className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
              <TableHead className="text-gray-700 dark:text-gray-300">Exam Name</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">Type</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">Classes</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">Date Range</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">Subjects</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">Status</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">Completion</TableHead>
              <TableHead className="text-right text-gray-700 dark:text-gray-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  Loading examinations...
                </TableCell>
              </TableRow>
            ) : exams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No examinations found
                </TableCell>
              </TableRow>
            ) : (
              exams.map((exam, index) => (
              <TableRow 
                key={exam.id} 
                className={`hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer ${
                  index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/50'
                }`}
                onClick={() => onViewExam(exam)}
              >
                <TableCell>
                  <div className="text-sm text-gray-900 dark:text-white hover:text-[#2563EB]">
                    {exam.name}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getTypeColor(exam.type)}>
                    {exam.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {exam.classes.slice(0, 2).map(cls => (
                      <Badge key={cls} variant="outline" className="text-xs bg-gray-100 text-gray-700 border-gray-200">
                        {cls}
                      </Badge>
                    ))}
                    {exam.classes.length > 2 && (
                      <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700 border-gray-200">
                        +{exam.classes.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {new Date(exam.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' - '}
                    {new Date(exam.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {exam.subjects.length}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getStatusColor(exam.status)}>
                    {exam.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="w-32">
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                      <span>Results</span>
                      <span>{exam.resultsPublished}%</span>
                    </div>
                    <Progress value={exam.resultsPublished} className="h-2" />
                  </div>
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewExam(exam)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit Exam
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Clipboard className="w-4 h-4 mr-2" />
                        Enter Marks
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Send className="w-4 h-4 mr-2" />
                        Publish Results
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="w-4 h-4 mr-2" />
                        Download Report
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteExam(exam.id);
                        }}
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
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalExams)} of {totalExams} exams
        </p>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentPage(page)}
              className={currentPage === page ? 'bg-[#2563EB] hover:bg-[#1d4ed8]' : ''}
            >
              {page}
            </Button>
          ))}
          
          {totalPages > 5 && <span className="text-gray-400">...</span>}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <Select value={itemsPerPage.toString()} onValueChange={(value) => {
          setItemsPerPage(parseInt(value));
          setCurrentPage(1);
        }}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="15">15</SelectItem>
            <SelectItem value="30">30</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
