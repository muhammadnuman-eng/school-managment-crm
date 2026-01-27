import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar, Plus, Trash2 } from 'lucide-react';
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
      setClasses(response.classes || []);
    } catch (error: any) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to load classes');
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
        examSubjects: selectedSubjects.map(subjectId => ({
          subjectId,
          totalMarks: 100, // Default, can be made configurable
          passingMarks: 40,
          weightage: 1,
        })),
        examSchedules: timeSlots.filter(slot => slot.date && slot.startTime && slot.endTime).map(slot => ({
          classId: slot.class,
          sectionId: undefined,
          subjectId: slot.subject,
          examDate: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          roomNumber: slot.room || undefined,
        })),
        createdBy,
      };

      await adminService.createExamination(request);
      toast.success('Examination scheduled successfully!');
      onSuccess();
    } catch (error: any) {
      console.error('Error creating examination:', error);
      let errorMessage = 'Failed to create examination';
      if (error instanceof ApiException) {
        errorMessage = getUserFriendlyError(error);
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
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">Schedule New Examination</DialogTitle>
              <DialogDescription>
                Step {step} of 3
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
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
                    <div className="space-y-2 max-h-64 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      {classes.map((cls) => (
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
                            {cls.name}
                            <span className="text-xs text-gray-500 ml-2">({cls.students} students)</span>
                          </label>
                        </div>
                      ))}
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
                            cls.subjects?.forEach(subject => {
                              if (!allSubjects.has(subject.id)) {
                                allSubjects.set(subject.id, subject);
                              }
                            });
                          });
                        const uniqueSubjects = Array.from(allSubjects.values());
                        
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

                <div className="space-y-3">
                  {timeSlots.map((slot, index) => (
                    <div key={slot.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="grid grid-cols-7 gap-3">
                        <div>
                          <Label className="text-xs">Date</Label>
                          <Input
                            type="date"
                            value={slot.date}
                            onChange={(e) => updateTimeSlot(slot.id, 'date', e.target.value)}
                            className="mt-1 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Subject</Label>
                          <Select value={slot.subject} onValueChange={(value) => updateTimeSlot(slot.id, 'subject', value)}>
                            <SelectTrigger className="mt-1 text-sm">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {(() => {
                                // Extract unique subjects from selected classes
                                const allSubjects = new Map<string, { id: string; name: string }>();
                                classes
                                  .filter(cls => selectedClasses.includes(cls.id))
                                  .forEach(cls => {
                                    cls.subjects?.forEach(subject => {
                                      if (!allSubjects.has(subject.id) && selectedSubjects.includes(subject.id)) {
                                        allSubjects.set(subject.id, subject);
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
                          <Label className="text-xs">Class</Label>
                          <Select value={slot.class} onValueChange={(value) => updateTimeSlot(slot.id, 'class', value)}>
                            <SelectTrigger className="mt-1 text-sm">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {classes.filter(c => selectedClasses.includes(c.id)).map(cls => (
                                <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Start Time</Label>
                          <Input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => updateTimeSlot(slot.id, 'startTime', e.target.value)}
                            className="mt-1 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">End Time</Label>
                          <Input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => updateTimeSlot(slot.id, 'endTime', e.target.value)}
                            className="mt-1 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Room</Label>
                          <Input
                            placeholder="101"
                            value={slot.room}
                            onChange={(e) => updateTimeSlot(slot.id, 'room', e.target.value)}
                            className="mt-1 text-sm"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTimeSlot(slot.id)}
                            disabled={timeSlots.length === 1}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
