import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Checkbox } from '../../ui/checkbox';
import { toast } from 'sonner';
import { ScrollArea } from '../../ui/scroll-area';
import { adminService } from '../../../services';
import { CreateExaminationRequest, ExamType } from '../../../types/examination.types';
import { ClassResponse } from '../../../types/class.types';
import { AcademicYear } from '../../../types/academic-year.types';
import { ApiException, getUserFriendlyError } from '../../../utils/errors';
import { schoolStorage, userStorage } from '../../../utils/storage';

interface CreateExamProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface TimeSlot {
  id: string;
  date: string;
  subject: string;
  class: string;
  startTime: string;
  endTime: string;
  duration: string;
  room: string;
}

// Mock data removed - now using API data

export function CreateExam({ onClose, onSuccess }: CreateExamProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [formData, setFormData] = useState({
    examName: '',
    academicYearId: '',
    examType: '' as ExamType | '',
    startDate: '',
    endDate: '',
    description: ''
  });
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  // Map to store subjectId -> subjectName for exam creation
  const [subjectNameMap, setSubjectNameMap] = useState<Map<string, string>>(new Map());
  
  // Update subject name map when classes or selected classes change
  useEffect(() => {
    const newMap = new Map<string, string>();
    classes
      .filter(cls => selectedClasses.includes(cls.id))
      .forEach(cls => {
        const classSubjects = cls.subjects || [];
        classSubjects.forEach((subject: any) => {
          const subjectData = subject?.subject || subject;
          const subjectId = subjectData?.id || subject?.id || subjectData?.subjectId || subject?.subjectId;
          const subjectName = 
            subjectData?.name || 
            subjectData?.subjectName || 
            subject?.name || 
            subject?.subjectName || 
            '';
          
          if (subjectName) {
            const finalSubjectId = subjectId || `custom-${subjectName}`;
            newMap.set(finalSubjectId, subjectName);
          }
        });
      });
    setSubjectNameMap(newMap);
  }, [classes, selectedClasses]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    {
      id: '1',
      date: '',
      subject: '',
      class: '',
      startTime: '',
      endTime: '',
      duration: '',
      room: ''
    }
  ]);

  // Fetch classes and academic years on mount
  useEffect(() => {
    fetchClasses();
    fetchAcademicYears();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await adminService.getClasses();
      
      if (import.meta.env.DEV) {
        console.log('Raw classes response:', response);
      }
      
      // Normalize classes to handle backend response structure
      const normalizedClasses = (response.classes || []).map((cls: any) => {
        // Backend returns className, frontend expects name
        const className = cls.className || cls.name || '';
        const classId = cls.id || cls.uuid || '';
        
        // Normalize subjects - backend returns subjectName/subjectCode, frontend expects name/code
        const normalizedSubjects = (cls.subjects || []).map((subj: any) => {
          // Handle nested structure (subject.subject) or direct structure
          const subjectData = subj?.subject || subj;
          
          // Backend returns subjectName/subjectCode, frontend expects name/code
          const subjectId = 
            subjectData?.id || 
            subj?.id || 
            subjectData?.subjectId || 
            subj?.subjectId || 
            `custom-${subjectData?.subjectName || subj?.subjectName || ''}`;
          
          const subjectName = 
            subjectData?.subjectName || 
            subj?.subjectName || 
            subjectData?.name || 
            subj?.name || 
            '';
          
          const subjectCode = 
            subjectData?.subjectCode || 
            subj?.subjectCode || 
            subjectData?.code || 
            subj?.code || 
            '';
          
          return {
            id: subjectId,
            name: subjectName,
            code: subjectCode,
            teacher: subjectData?.teacher || subj?.teacher || '',
            teacherId: subjectData?.teacherId || subj?.teacherId || '',
          };
        }).filter(subj => subj.name); // Filter out subjects without names
        
        // Get total students from stats or direct field
        const totalStudents = 
          cls.totalStudents || 
          cls.stats?.students || 
          cls.enrolledStudents || 
          0;
        
        return {
          id: classId,
          name: className,
          grade: cls.grade || cls.gradeLevel || 0,
          academicYear: typeof cls.academicYear === 'string' 
            ? cls.academicYear 
            : (cls.academicYear?.yearName || cls.academicYear?.name || cls.academicYear || ''),
          sections: cls.sections || [],
          subjects: normalizedSubjects,
          totalStudents: Number(totalStudents) || 0,
          totalCapacity: cls.totalCapacity || cls.stats?.capacity || 0,
        };
      }).filter(cls => cls.id && cls.name); // Filter out invalid classes
      
      setClasses(normalizedClasses);
      
      if (import.meta.env.DEV) {
        console.log('Fetched and normalized classes:', {
          raw: response.classes,
          normalized: normalizedClasses,
          totalClasses: normalizedClasses.length,
        });
      }
    } catch (error: any) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to load classes');
      setClasses([]); // Set empty array on error
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const response = await adminService.getAcademicYears();
      setAcademicYears(response.academicYears || []);
      // Set default academic year if available
      if (response.academicYears && response.academicYears.length > 0) {
        const currentYear = response.academicYears.find(ay => ay.isActive) || response.academicYears[0];
        setFormData(prev => ({ ...prev, academicYearId: currentYear.id }));
      }
    } catch (error: any) {
      console.error('Error fetching academic years:', error);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.examName || !formData.examType || !formData.startDate || !formData.endDate) {
        toast.error('Please fill all required fields');
        return;
      }
    }
    if (step === 2) {
      if (selectedClasses.length === 0 || selectedSubjects.length === 0) {
        toast.error('Please select at least one class and subject');
        return;
      }
    }
    if (step < 3) setStep(step + 1);
  };

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!formData.examName || !formData.examType || !formData.academicYearId || !formData.startDate || !formData.endDate) {
      toast.error('Please fill all required fields');
      return;
    }

    if (selectedClasses.length === 0 || selectedSubjects.length === 0) {
      toast.error('Please select at least one class and subject');
      return;
    }

    // Validate examType matches backend enum
    const validExamTypes = ['QUIZ', 'MIDTERM', 'FINAL', 'TEST', 'ASSIGNMENT'];
    if (!validExamTypes.includes(formData.examType)) {
      toast.error('Invalid exam type selected');
      return;
    }

    // Validate time slots - all required fields must be filled
    const validTimeSlots = timeSlots.filter(slot => {
      const hasDate = slot.date && slot.date.trim() !== '';
      const hasStartTime = slot.startTime && slot.startTime.trim() !== '';
      const hasEndTime = slot.endTime && slot.endTime.trim() !== '';
      const hasClass = slot.class && slot.class.trim() !== '';
      const hasSubject = slot.subject && slot.subject.trim() !== '';
      
      // Validate time logic
      if (hasStartTime && hasEndTime) {
        const start = new Date(`2000-01-01T${slot.startTime}`);
        const end = new Date(`2000-01-01T${slot.endTime}`);
        if (end <= start) {
          toast.error(`Time slot ${timeSlots.indexOf(slot) + 1}: End time must be after start time`);
          return false;
        }
      }
      
      return hasDate && hasStartTime && hasEndTime && hasClass && hasSubject;
    });
    
    if (validTimeSlots.length === 0) {
      toast.error('Please add at least one valid time slot. Each slot must have: Date, Start Time, End Time, Class, and Subject');
      return;
    }
    
    // Check if any time slot is incomplete
    const incompleteSlots = timeSlots.filter(slot => {
      const hasDate = slot.date && slot.date.trim() !== '';
      const hasStartTime = slot.startTime && slot.startTime.trim() !== '';
      const hasEndTime = slot.endTime && slot.endTime.trim() !== '';
      const hasClass = slot.class && slot.class.trim() !== '';
      const hasSubject = slot.subject && slot.subject.trim() !== '';
      
      // If any field is filled but not all required fields, it's incomplete
      const hasAnyField = hasDate || hasStartTime || hasEndTime || hasClass || hasSubject;
      const hasAllFields = hasDate && hasStartTime && hasEndTime && hasClass && hasSubject;
      
      return hasAnyField && !hasAllFields;
    });
    
    if (incompleteSlots.length > 0) {
      toast.error(`Please complete all fields in time slot ${timeSlots.indexOf(incompleteSlots[0]) + 1}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const schoolId = schoolStorage.getSchoolId();
      const currentUser = userStorage.getUser();
      const createdBy = currentUser?.id || currentUser?.uuid || '';

      if (!schoolId || !createdBy) {
        toast.error('Unable to identify school or user');
        setIsSubmitting(false);
        return;
      }

      const request: CreateExaminationRequest = {
        schoolId,
        examName: formData.examName.trim(),
        examType: formData.examType as ExamType, // Already validated above
        academicYearId: formData.academicYearId,
        description: formData.description?.trim() || undefined,
        startDate: formData.startDate,
        endDate: formData.endDate,
        examClasses: selectedClasses.map(classId => {
          // Only include classId, omit sectionName if not provided
          return {
            classId,
            // sectionName is optional, omit if not provided
          };
        }),
        examSubjects: selectedSubjects.map(subjectId => {
          // Get subject name from map or find it from classes
          let subjectName = subjectNameMap.get(subjectId);
          
          // If not in map, try to find it from the selected classes
          if (!subjectName) {
            for (const cls of classes) {
              if (selectedClasses.includes(cls.id)) {
                const foundSubject = cls.subjects?.find((s: any) => s.id === subjectId);
                if (foundSubject) {
                  subjectName = foundSubject.name;
                  break;
                }
              }
            }
          }
          
          if (!subjectName) {
            console.warn(`Subject name not found for ID: ${subjectId}`);
            subjectName = subjectId; // Fallback
          }
          
          return {
            subjectName: subjectName.trim(), // Backend expects subjectName, ensure it's trimmed
            totalMarks: 100, // Default, can be made configurable
            passingMarks: 40,
            weightage: 1,
          };
        }),
        examSchedules: validTimeSlots.map(slot => {
          // Get subject name from map or find it from classes
          let subjectName = subjectNameMap.get(slot.subject);
          
          // If not in map, try to find it from the selected classes
          if (!subjectName) {
            for (const cls of classes) {
              if (selectedClasses.includes(cls.id)) {
                const foundSubject = cls.subjects?.find((s: any) => s.id === slot.subject);
                if (foundSubject) {
                  subjectName = foundSubject.name;
                  break;
                }
              }
            }
          }
          
          // Fallback to subjectId if name not found (shouldn't happen, but safety check)
          if (!subjectName) {
            console.warn(`Subject name not found for ID: ${slot.subject}, using ID as fallback`);
            subjectName = slot.subject;
          }
          
          if (!slot.class) {
            console.warn(`Class ID is missing for slot: ${slot.id}`);
          }
          
          // Ensure time format is HH:mm (HTML time input already returns this format)
          // Remove any AM/PM if present and convert to 24-hour format
          let startTime = slot.startTime || '';
          let endTime = slot.endTime || '';
          
          // Convert 12-hour to 24-hour format if needed (HTML time input should already be 24-hour)
          // But just in case, handle it
          if (startTime.includes('AM') || startTime.includes('PM')) {
            const [time, period] = startTime.split(' ');
            const [hours, minutes] = time.split(':');
            let hour24 = parseInt(hours);
            if (period === 'PM' && hour24 !== 12) hour24 += 12;
            if (period === 'AM' && hour24 === 12) hour24 = 0;
            startTime = `${hour24.toString().padStart(2, '0')}:${minutes}`;
          }
          
          if (endTime.includes('AM') || endTime.includes('PM')) {
            const [time, period] = endTime.split(' ');
            const [hours, minutes] = time.split(':');
            let hour24 = parseInt(hours);
            if (period === 'PM' && hour24 !== 12) hour24 += 12;
            if (period === 'AM' && hour24 === 12) hour24 = 0;
            endTime = `${hour24.toString().padStart(2, '0')}:${minutes}`;
          }
          
          // Ensure date format is YYYY-MM-DD
          const examDate = slot.date || '';
          
          // Build schedule object - only include sectionName and roomNumber if they have values
          const schedule: any = {
            classId: slot.class,
            subjectName: subjectName.trim(), // Backend expects subjectName, ensure it's trimmed
            examDate: examDate,
            startTime: startTime,
            endTime: endTime,
          };
          
          // Only add roomNumber if it has a value (omit if undefined/null/empty)
          if (slot.room && slot.room.trim()) {
            schedule.roomNumber = slot.room.trim();
          }
          
          // sectionName is optional, omit if not provided
          
          if (import.meta.env.DEV) {
            console.log(`Time Slot ${validTimeSlots.indexOf(slot) + 1}:`, {
              slot,
              subjectName,
              classId: slot.class,
              examDate,
              startTime,
              endTime,
            });
          }
          
          return schedule;
        }),
        createdBy,
      };

      if (import.meta.env.DEV) {
        console.log('Creating examination with request:', {
          ...request,
          examType: request.examType,
          examSubjectsCount: request.examSubjects?.length,
          examSchedulesCount: request.examSchedules?.length,
          examSchedules: request.examSchedules,
          examSubjects: request.examSubjects,
        });
      }

      try {
        await adminService.createExamination(request);
      } catch (apiError: any) {
        // Log detailed error for debugging
        if (import.meta.env.DEV) {
          console.error('Detailed API Error:', {
            error: apiError,
            message: apiError?.message,
            statusCode: apiError?.statusCode,
            code: apiError?.code,
            details: apiError?.details,
            response: apiError?.response,
            data: apiError?.data,
            originalData: apiError?.details?.originalData,
          });
        }
        throw apiError; // Re-throw to be caught by outer catch
      }
      toast.success('Examination scheduled successfully!');
      onSuccess();
    } catch (error: any) {
      console.error('Error creating examination:', error);
      let errorMessage = 'Failed to create examination';
      
      // Try to extract detailed error message
      if (error instanceof ApiException) {
        errorMessage = getUserFriendlyError(error);
        
        // Check for validation errors in details
        if (error.details?.originalData?.message) {
          const validationMsg = error.details.originalData.message;
          if (Array.isArray(validationMsg)) {
            errorMessage = validationMsg.join(', ');
          } else if (typeof validationMsg === 'string') {
            errorMessage = validationMsg;
          }
        } else if (error.details?.message) {
          const validationMsg = error.details.message;
          if (Array.isArray(validationMsg)) {
            errorMessage = validationMsg.join(', ');
          } else if (typeof validationMsg === 'string') {
            errorMessage = validationMsg;
          }
        }
      } else if (error?.response?.data?.message) {
        // Handle backend validation errors from response
        const backendMessage = error.response.data.message;
        if (Array.isArray(backendMessage)) {
          errorMessage = backendMessage.join(', ');
        } else if (typeof backendMessage === 'string') {
          errorMessage = backendMessage;
        }
      } else if (error?.data?.message) {
        // Handle backend validation errors from data
        const backendMessage = error.data.message;
        if (Array.isArray(backendMessage)) {
          errorMessage = backendMessage.join(', ');
        } else if (typeof backendMessage === 'string') {
          errorMessage = backendMessage;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Log full error for debugging
      if (import.meta.env.DEV) {
        console.error('Full error details:', {
          error,
          errorMessage,
          statusCode: error?.statusCode,
          details: error?.details,
        });
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleClass = (classId: string) => {
    setSelectedClasses(prev =>
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, {
      id: Date.now().toString(),
      date: '',
      subject: '',
      class: '',
      startTime: '',
      endTime: '',
      duration: '',
      room: ''
    }]);
  };

  const removeTimeSlot = (id: string) => {
    setTimeSlots(timeSlots.filter(slot => slot.id !== id));
  };

  const updateTimeSlot = (id: string, field: keyof TimeSlot, value: string) => {
    setTimeSlots(timeSlots.map(slot =>
      slot.id === id ? { ...slot, [field]: value } : slot
    ));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div>
            <DialogTitle className="text-2xl">Schedule New Examination</DialogTitle>
            <DialogDescription>
              Step {step} of 3
            </DialogDescription>
          </div>
          
          {/* Progress Indicator */}
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                  s <= step ? 'bg-[#2563EB]' : 'bg-gray-200 dark:bg-gray-800'
                }`}
              />
            ))}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)]">
          <div className="py-4">
            {/* Step 1: Exam Details */}
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg text-gray-900 dark:text-white mb-4">Exam Details</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="examName">
                      Exam Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="examName"
                      placeholder="Mid-Term Examination"
                      value={formData.examName}
                      onChange={(e) => setFormData({ ...formData, examName: e.target.value })}
                      className="mt-1 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-[#2563EB] focus:ring-[#2563EB]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="academicYear">
                      Academic Year <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.academicYearId} onValueChange={(value) => setFormData({ ...formData, academicYearId: value })}>
                      <SelectTrigger className="mt-1 bg-gray-50 dark:bg-gray-800">
                        <SelectValue placeholder="Select academic year" />
                      </SelectTrigger>
                      <SelectContent>
                        {academicYears.map(ay => (
                          <SelectItem key={ay.id} value={ay.id}>{ay.yearName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="examType">
                      Exam Type <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.examType} onValueChange={(value) => setFormData({ ...formData, examType: value as ExamType })}>
                      <SelectTrigger className="mt-1 bg-gray-50 dark:bg-gray-800">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="QUIZ">Quiz</SelectItem>
                        <SelectItem value="MIDTERM">Mid-Term</SelectItem>
                        <SelectItem value="FINAL">Final</SelectItem>
                        <SelectItem value="TEST">Test</SelectItem>
                        <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="startDate">
                      Start Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="mt-1 bg-gray-50 dark:bg-gray-800"
                    />
                  </div>

                  <div>
                    <Label htmlFor="endDate">
                      End Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="mt-1 bg-gray-50 dark:bg-gray-800"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      rows={3}
                      placeholder="Enter exam description..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-1 bg-gray-50 dark:bg-gray-800"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Select Classes & Subjects */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg text-gray-900 dark:text-white mb-4">Select Classes & Subjects</h3>
                
                <div className="grid grid-cols-2 gap-6">
                  {/* Classes */}
                  <div>
                    <Label className="mb-3 block">
                      Classes <span className="text-red-500">*</span>
                    </Label>
                    <div className="space-y-2 max-h-64 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      {classes.length > 0 ? (
                        classes.map((cls) => (
                          <div key={cls.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={cls.id}
                              checked={selectedClasses.includes(cls.id)}
                              onCheckedChange={() => toggleClass(cls.id)}
                            />
                            <label
                              htmlFor={cls.id}
                              className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex-1"
                            >
                              {cls.name || 'Unnamed Class'}
                              <span className="text-xs text-gray-500 ml-2">
                                ({cls.totalStudents || 0} students)
                              </span>
                            </label>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No classes found. Please create classes first.
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {selectedClasses.length} class{selectedClasses.length !== 1 ? 'es' : ''} selected
                    </p>
                  </div>

                  {/* Subjects */}
                  <div>
                    <Label className="mb-3 block">
                      Subjects <span className="text-red-500">*</span>
                    </Label>
                    <div className="space-y-2 max-h-64 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      {(() => {
                        // Extract unique subjects from selected classes
                        const allSubjects = new Map<string, { id: string; name: string; code: string }>();
                        classes
                          .filter(cls => selectedClasses.includes(cls.id))
                          .forEach(cls => {
                            // Subjects are already normalized in fetchClasses
                            const classSubjects = cls.subjects || [];
                            
                            if (import.meta.env.DEV) {
                              console.log(`Processing subjects for class ${cls.name}:`, {
                                classId: cls.id,
                                className: cls.name,
                                subjects: classSubjects,
                              });
                            }
                            
                            classSubjects.forEach((subject: any) => {
                              // Subjects are already normalized, so use directly
                              const subjectId = subject?.id || `custom-${subject?.name}`;
                              const subjectName = subject?.name || '';
                              const subjectCode = subject?.code || '';
                              
                              if (subjectId && subjectName && !allSubjects.has(subjectId)) {
                                allSubjects.set(subjectId, {
                                  id: subjectId,
                                  name: subjectName,
                                  code: subjectCode,
                                });
                              }
                            });
                          });
                        const uniqueSubjects = Array.from(allSubjects.values());
                        
                        if (import.meta.env.DEV) {
                          console.log('Subjects extraction:', {
                            selectedClasses,
                            classes: classes.filter(cls => selectedClasses.includes(cls.id)),
                            uniqueSubjects,
                            allSubjectsCount: allSubjects.size,
                          });
                        }
                        
                        return uniqueSubjects.length > 0 ? (
                          uniqueSubjects.map((subject) => (
                            <div key={subject.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`subject-${subject.id}`}
                                checked={selectedSubjects.includes(subject.id)}
                                onCheckedChange={() => toggleSubject(subject.id)}
                              />
                              <label
                                htmlFor={`subject-${subject.id}`}
                                className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex-1"
                              >
                                {subject.name}
                                {subject.code && (
                                  <span className="text-xs text-gray-500 ml-2">({subject.code})</span>
                                )}
                              </label>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-4">
                            {selectedClasses.length === 0 
                              ? 'Please select classes first to see subjects'
                              : 'No subjects found in selected classes'}
                          </p>
                        );
                      })()}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {selectedSubjects.length} subject{selectedSubjects.length !== 1 ? 's' : ''} selected
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Time Table */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg text-gray-900 dark:text-white">Time Table</h3>
                  <Button onClick={addTimeSlot} size="sm" className="bg-[#2563EB] hover:bg-[#1d4ed8]">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Slot
                  </Button>
                </div>

                <div className="space-y-4">
                  {timeSlots.map((slot, index) => (
                    <div key={slot.id} className="p-5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          Time Slot {index + 1}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTimeSlot(slot.id)}
                          disabled={timeSlots.length === 1}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                      
                      {/* First Row: Date, Subject, Class */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Date <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            type="date"
                            value={slot.date}
                            onChange={(e) => updateTimeSlot(slot.id, 'date', e.target.value)}
                            className="w-full text-sm h-10"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Subject <span className="text-red-500">*</span>
                          </Label>
                          <Select value={slot.subject} onValueChange={(value) => updateTimeSlot(slot.id, 'subject', value)}>
                            <SelectTrigger className="w-full text-sm h-10">
                              <SelectValue placeholder="Select subject">
                                {slot.subject && (() => {
                                  // Find subject name by ID
                                  let subjectName = '';
                                  classes
                                    .filter(cls => selectedClasses.includes(cls.id))
                                    .forEach(cls => {
                                      const found = cls.subjects?.find((s: any) => s.id === slot.subject);
                                      if (found) subjectName = found.name;
                                    });
                                  return subjectName || slot.subject;
                                })()}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              {selectedSubjects.length > 0 ? (
                                (() => {
                                  // Extract unique subjects from selected classes (already normalized)
                                  const allSubjects = new Map<string, { id: string; name: string }>();
                                  classes
                                    .filter(cls => selectedClasses.includes(cls.id))
                                    .forEach(cls => {
                                      const classSubjects = cls.subjects || [];
                                      classSubjects.forEach((subject: any) => {
                                        // Subjects are already normalized
                                        const subjectId = subject?.id || `custom-${subject?.name}`;
                                        const subjectName = subject?.name || '';
                                        
                                        if (subjectId && subjectName && !allSubjects.has(subjectId) && selectedSubjects.includes(subjectId)) {
                                          allSubjects.set(subjectId, {
                                            id: subjectId,
                                            name: subjectName,
                                          });
                                        }
                                      });
                                    });
                                  const subjectsList = Array.from(allSubjects.values());
                                  return subjectsList.length > 0 ? (
                                    subjectsList.map(subject => (
                                      <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                                    ))
                                  ) : (
                                    <SelectItem value="" disabled>No subjects available</SelectItem>
                                  );
                                })()
                              ) : (
                                <SelectItem value="" disabled>Please select subjects in Step 2</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Class <span className="text-red-500">*</span>
                          </Label>
                          <Select value={slot.class} onValueChange={(value) => updateTimeSlot(slot.id, 'class', value)}>
                            <SelectTrigger className="w-full text-sm h-10">
                              <SelectValue placeholder="Select class">
                                {slot.class && classes.find(c => c.id === slot.class)?.name}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              {selectedClasses.length > 0 ? (
                                classes
                                  .filter(c => selectedClasses.includes(c.id))
                                  .map(cls => (
                                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                                  ))
                              ) : (
                                <SelectItem value="" disabled>Please select classes in Step 2</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {/* Second Row: Start Time, End Time, Room */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Start Time <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => updateTimeSlot(slot.id, 'startTime', e.target.value)}
                            className="w-full text-sm h-10"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            End Time <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => updateTimeSlot(slot.id, 'endTime', e.target.value)}
                            className="w-full text-sm h-10"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Room Number
                          </Label>
                          <Input
                            placeholder="e.g., 101, 102"
                            value={slot.room}
                            onChange={(e) => updateTimeSlot(slot.id, 'room', e.target.value)}
                            className="w-full text-sm h-10"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <div className="flex gap-2">
              {step > 1 && (
                <Button variant="outline" onClick={handlePrevious}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
              )}
              {step < 3 ? (
                <Button onClick={handleNext} className="bg-[#2563EB] hover:bg-[#1d4ed8]">
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} className="bg-[#10B981] hover:bg-[#059669]">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Exam
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
