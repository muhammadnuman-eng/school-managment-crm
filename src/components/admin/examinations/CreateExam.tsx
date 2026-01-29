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
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
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
    setIsLoadingClasses(true);
    try {
      const response = await adminService.getClasses();
      
      if (import.meta.env.DEV) {
        console.log('Classes API Response:', {
          response,
          classes: response.classes,
          classesLength: response.classes?.length,
          firstClass: response.classes?.[0],
        });
      }
      
      // Transform classes to ensure proper field names
      const classesList = (response.classes || []).map((cls: any) => ({
        ...cls,
        // Handle both 'name' and 'className' fields
        name: cls.name || cls.className || 'Unnamed Class',
        // Transform subjects to ensure proper field names
        subjects: (cls.subjects || []).map((subj: any) => ({
          id: subj.id || subj.subjectId || '',
          name: subj.name || subj.subjectName || 'Unnamed Subject',
          code: subj.code || subj.subjectCode || '',
          teacher: subj.teacher,
          teacherId: subj.teacherId,
        })),
      }));
      
      setClasses(classesList);
      
      if (classesList.length === 0) {
        if (import.meta.env.DEV) {
          console.warn('No classes found in response');
        }
      }
    } catch (error: any) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to load classes');
      setClasses([]);
    } finally {
      setIsLoadingClasses(false);
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

    setIsSubmitting(true);
    try {
      const schoolId = schoolStorage.getSchoolId();
      const currentUser = userStorage.getUser();
      const createdBy = currentUser?.id || currentUser?.uuid || '';

      if (!schoolId || !createdBy) {
        toast.error('Unable to identify school or user');
        return;
      }

      // Helper function to get subject name by ID
      const getSubjectName = (subjectId: string): string => {
        if (!subjectId) {
          console.warn('getSubjectName called with empty subjectId');
          return 'Unknown Subject';
        }
        
        for (const cls of classes) {
          if (cls.subjects && cls.subjects.length > 0) {
            const subject = cls.subjects.find((s: any) => {
              const sId = s.id || s.subjectId || '';
              return sId === subjectId;
            });
            if (subject) {
              const name = subject.name || subject.subjectName || 'Unknown Subject';
              if (import.meta.env.DEV) {
                console.log('Found subject:', { subjectId, name, subject });
              }
              return name;
            }
          }
        }
        
        console.warn('Subject not found for ID:', subjectId);
        return 'Unknown Subject';
      };

      // Helper function to get class name by ID
      const getClassName = (classId: string): string => {
        const cls = classes.find(c => {
          const cId = c.id || c.uuid || '';
          return cId === classId;
        });
        return cls?.name || cls?.className || 'Unknown Class';
      };

      const request: CreateExaminationRequest = {
        schoolId,
        examName: formData.examName,
        examType: formData.examType as ExamType,
        academicYearId: formData.academicYearId,
        description: formData.description || undefined,
        startDate: formData.startDate,
        endDate: formData.endDate,
        examClasses: selectedClasses.map(classId => ({
          classId,
          sectionId: undefined, // Can be enhanced to select specific sections
        })),
        examSubjects: selectedSubjects.map(subjectId => {
          const subjectName = getSubjectName(subjectId);
          const subjectData: any = {
            subjectId,
            subjectName, // Backend requires this
            totalMarks: 100, // Default, can be made configurable
          };
          return subjectData;
        }),
        examSchedules: timeSlots
          .filter(slot => {
            // Only include slots with all required fields
            const isValid = slot.date && slot.startTime && slot.endTime && slot.subject && slot.class;
            if (!isValid && import.meta.env.DEV) {
              console.warn('Invalid time slot filtered out:', slot);
            }
            return isValid;
          })
          .map(slot => {
            const subjectName = getSubjectName(slot.subject);
            const className = getClassName(slot.class);
            
            if (import.meta.env.DEV) {
              console.log('Creating exam schedule:', {
                classId: slot.class,
                className,
                subjectId: slot.subject,
                subjectName,
                examDate: slot.date,
              });
            }
            
            return {
              classId: slot.class,
              className, // Include for reference
              sectionId: undefined,
              subjectId: slot.subject,
              subjectName, // Backend requires this
              examDate: slot.date,
              startTime: slot.startTime,
              endTime: slot.endTime,
              roomNumber: slot.room || undefined,
            };
          }),
        createdBy,
      };

      if (import.meta.env.DEV) {
        console.log('Creating examination with request:', {
          ...request,
          examSubjects: request.examSubjects?.map(s => ({ subjectId: s.subjectId, subjectName: s.subjectName, totalMarks: s.totalMarks })),
          examSchedules: request.examSchedules?.map(s => ({ classId: s.classId, subjectId: s.subjectId, subjectName: s.subjectName, examDate: s.examDate })),
        });
      }

      await adminService.createExamination(request);
      toast.success('Examination scheduled successfully!');
      setIsSubmitting(false);
      onSuccess();
      onClose(); // Close the dialog after successful creation
    } catch (error: any) {
      console.error('Error creating examination:', error);
      let errorMessage = 'Failed to create examination';
      if (error instanceof ApiException) {
        errorMessage = getUserFriendlyError(error);
      }
      toast.error(errorMessage);
      setIsSubmitting(false);
    }
  };

  const toggleClass = (classId: string) => {
    if (!classId) {
      console.warn('toggleClass called with empty classId');
      return;
    }

    const isCurrentlySelected = selectedClasses.includes(classId);
    
    if (isCurrentlySelected) {
      // Class is being deselected, remove its subjects from selection
      const classToRemove = classes.find(c => {
        const cId = c.id || c.uuid || '';
        return cId === classId;
      });
      
      if (classToRemove?.subjects) {
        const subjectIdsToRemove = classToRemove.subjects
          .map(s => s.id)
          .filter(id => id && id.trim() !== ''); // Filter out empty ids
        if (subjectIdsToRemove.length > 0) {
          setSelectedSubjects(prev => prev.filter(id => !subjectIdsToRemove.includes(id)));
        }
      }
      // Remove class from selection
      setSelectedClasses(prev => prev.filter(id => id !== classId));
    } else {
      // Add class to selection
      setSelectedClasses(prev => [...prev, classId]);
    }
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
                        <SelectItem value="MID_TERM">Mid-Term</SelectItem>
                        <SelectItem value="FINAL">Final</SelectItem>
                        <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
                        <SelectItem value="PROJECT">Project</SelectItem>
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
                    <div className="space-y-2 max-h-64 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      {isLoadingClasses ? (
                        <div className="text-center py-8">
                          <p className="text-sm text-gray-500">Loading classes...</p>
                        </div>
                      ) : classes.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-sm text-gray-500 mb-2">No classes available</p>
                          <p className="text-xs text-gray-400">Please create classes first in the Classes section</p>
                        </div>
                      ) : (
                        classes.map((cls) => {
                          const classId = cls.id || cls.uuid || '';
                          const className = cls.name || cls.className || 'Unnamed Class';
                          
                          if (import.meta.env.DEV && !classId) {
                            console.warn('Class missing id:', cls);
                          }
                          
                          return (
                            <div key={classId || `class-${className}`} className="flex items-center space-x-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 transition-colors">
                              <Checkbox
                                id={`class-checkbox-${classId || className}`}
                                checked={selectedClasses.includes(classId)}
                                onCheckedChange={() => {
                                  if (classId) {
                                    toggleClass(classId);
                                  } else {
                                    console.warn('Cannot toggle class without id:', cls);
                                  }
                                }}
                              />
                              <label
                                htmlFor={`class-checkbox-${classId || className}`}
                                className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer flex-1"
                              >
                                {className}
                                {(cls.grade || cls.gradeLevel) && (
                                  <span className="text-xs text-gray-500 ml-2">
                                    (Grade {cls.grade || cls.gradeLevel})
                                  </span>
                                )}
                              </label>
                            </div>
                          );
                        })
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
                    <div className="space-y-2 max-h-64 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      {(() => {
                        if (isLoadingClasses) {
                          return (
                            <div className="text-center py-8">
                              <p className="text-sm text-gray-500">Loading...</p>
                            </div>
                          );
                        }

                        if (selectedClasses.length === 0) {
                          return (
                            <div className="text-center py-8">
                              <p className="text-sm text-gray-500">Please select classes first to see subjects</p>
                            </div>
                          );
                        }

                        // Extract unique subjects from selected classes
                        const allSubjects = new Map<string, { id: string; name: string; code: string }>();
                        const selectedClassesList = classes.filter(cls => {
                          const classId = cls.id || cls.uuid || '';
                          return selectedClasses.includes(classId);
                        });

                        if (import.meta.env.DEV) {
                          console.log('Selected Classes for Subjects:', {
                            selectedClasses,
                            selectedClassesList,
                            classesWithSubjects: selectedClassesList.filter(c => c.subjects && c.subjects.length > 0),
                          });
                        }

                        selectedClassesList.forEach(cls => {
                          if (cls.subjects && cls.subjects.length > 0) {
                            cls.subjects.forEach((subject: any) => {
                              const subjectId = subject.id || subject.subjectId || '';
                              if (subjectId && !allSubjects.has(subjectId)) {
                                allSubjects.set(subjectId, {
                                  id: subjectId,
                                  name: subject.name || subject.subjectName || 'Unnamed Subject',
                                  code: subject.code || subject.subjectCode || '',
                                  subjectName: subject.subjectName, // Keep for reference
                                  subjectCode: subject.subjectCode, // Keep for reference
                                });
                              }
                            });
                          }
                        });

                        const uniqueSubjects = Array.from(allSubjects.values());
                        
                        if (uniqueSubjects.length === 0) {
                          return (
                            <div className="text-center py-8">
                              <p className="text-sm text-gray-500 mb-2">No subjects found</p>
                              <p className="text-xs text-gray-400">Selected classes don't have subjects assigned</p>
                            </div>
                          );
                        }

                        return uniqueSubjects.map((subject) => {
                          const subjectId = subject.id || '';
                          const subjectName = subject.name || subject.subjectName || 'Unnamed Subject';
                          const subjectCode = subject.code || subject.subjectCode || '';
                          
                          if (import.meta.env.DEV && !subjectId) {
                            console.warn('Subject missing id:', subject);
                          }
                          
                          return (
                            <div key={subjectId} className="flex items-center space-x-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 transition-colors">
                              <Checkbox
                                id={`subject-${subjectId}`}
                                checked={selectedSubjects.includes(subjectId)}
                                onCheckedChange={() => toggleSubject(subjectId)}
                              />
                              <label
                                htmlFor={`subject-${subjectId}`}
                                className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer flex-1"
                              >
                                {subjectName}
                                {subjectCode && (
                                  <span className="text-xs text-gray-500 ml-2">({subjectCode})</span>
                                )}
                              </label>
                            </div>
                          );
                        });
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
                    <div key={slot.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="space-y-4">
                        {/* Row 1: Date, Subject, Class */}
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Date</Label>
                            <Input
                              type="date"
                              value={slot.date}
                              onChange={(e) => updateTimeSlot(slot.id, 'date', e.target.value)}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Subject</Label>
                            <Select value={slot.subject} onValueChange={(value) => updateTimeSlot(slot.id, 'subject', value)}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select subject" />
                              </SelectTrigger>
                              <SelectContent>
                                {(() => {
                                  // Extract unique subjects from selected classes
                                  const allSubjects = new Map<string, { id: string; name: string }>();
                                  classes
                                    .filter(cls => {
                                      const classId = cls.id || cls.uuid || '';
                                      return selectedClasses.includes(classId);
                                    })
                                    .forEach(cls => {
                                      cls.subjects?.forEach((subject: any) => {
                                        const subjectId = subject.id || subject.subjectId || '';
                                        if (subjectId && !allSubjects.has(subjectId) && selectedSubjects.includes(subjectId)) {
                                          allSubjects.set(subjectId, {
                                            id: subjectId,
                                            name: subject.name || subject.subjectName || 'Unnamed Subject',
                                          });
                                        }
                                      });
                                    });
                                  return Array.from(allSubjects.values()).map(subject => (
                                    <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                                  ));
                                })()}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Class</Label>
                            <Select value={slot.class} onValueChange={(value) => updateTimeSlot(slot.id, 'class', value)}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select class" />
                              </SelectTrigger>
                              <SelectContent>
                                {classes
                                  .filter(c => {
                                    const classId = c.id || c.uuid || '';
                                    return selectedClasses.includes(classId);
                                  })
                                  .map(cls => {
                                    const classId = cls.id || cls.uuid || '';
                                    const className = cls.name || cls.className || 'Unnamed Class';
                                    return (
                                      <SelectItem key={classId} value={classId}>{className}</SelectItem>
                                    );
                                  })}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Row 2: Start Time, End Time, Room + Delete Button */}
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Start Time</Label>
                            <Input
                              type="time"
                              value={slot.startTime}
                              onChange={(e) => updateTimeSlot(slot.id, 'startTime', e.target.value)}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">End Time</Label>
                            <Input
                              type="time"
                              value={slot.endTime}
                              onChange={(e) => updateTimeSlot(slot.id, 'endTime', e.target.value)}
                              className="w-full"
                            />
                          </div>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <Label className="text-sm font-medium mb-2 block">Room</Label>
                              <Input
                                placeholder="101"
                                value={slot.room}
                                onChange={(e) => updateTimeSlot(slot.id, 'room', e.target.value)}
                                className="w-full"
                              />
                            </div>
                            <div className="flex items-end pb-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTimeSlot(slot.id)}
                                disabled={timeSlots.length === 1}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-10 w-10 p-0"
                                title="Delete slot"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
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
