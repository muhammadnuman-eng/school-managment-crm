import { useState } from 'react';
import { FileText, Calendar, Upload, CheckCircle, Clock, AlertCircle, Download, Eye, Loader2, RefreshCw } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import { Progress } from '../ui/progress';
import { Skeleton } from '../ui/skeleton';
import { useAssignments, useAssignmentStatistics, useSubmitAssignment } from '../../hooks/useStudentData';

// Skeleton loader
function AssignmentsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

export function StudentAssignments() {
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  // API Hooks - Based on student-panel-apis.json
  // ASSIGNMENT_01: /student/assignments/statistics
  const { data: statistics, loading: statsLoading } = useAssignmentStatistics();
  
  // ASSIGNMENT_02: /student/assignments
  const { data: assignmentsData, loading: assignmentsLoading, error: assignmentsError, refetch } = useAssignments();
  
  // ASSIGNMENT_04: /student/assignments/submit
  const { submit: submitAssignment, loading: submitting } = useSubmitAssignment();

  const loading = statsLoading || assignmentsLoading;
  const assignments = assignmentsData?.assignments || [];

  // Filter assignments by status
  const pendingAssignments = assignments.filter(a => a.status === 'PENDING');
  const submittedAssignments = assignments.filter(a => a.status === 'SUBMITTED');
  const gradedAssignments = assignments.filter(a => a.status === 'GRADED');
  const lateAssignments = assignments.filter(a => a.status === 'LATE');

  const stats = statistics || {
    total: assignments.length,
    pending: pendingAssignments.length,
    submitted: submittedAssignments.length,
    graded: gradedAssignments.length,
    late: lateAssignments.length,
    averageScore: gradedAssignments.length > 0 
      ? Math.round(gradedAssignments.reduce((sum, a) => sum + ((a.obtainedMarks || 0) / a.totalMarks * 100), 0) / gradedAssignments.length)
      : 0,
  };

  const handleSubmitAssignment = async () => {
    if (!selectedAssignmentId) return;
    
    if (!submissionText.trim() && !fileUrl.trim()) {
      toast.error('Please provide submission text or file URL');
      return;
    }

    const result = await submitAssignment({
      assignmentId: selectedAssignmentId,
      submissionText: submissionText.trim() || undefined,
      fileUrl: fileUrl.trim() || undefined,
    });

    if (result) {
      setIsSubmitDialogOpen(false);
      setSubmissionText('');
      setFileUrl('');
      setSelectedAssignmentId(null);
      refetch();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/20 dark:text-orange-400';
      case 'SUBMITTED': return 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400';
      case 'GRADED': return 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400';
      case 'LATE': return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'SUBMITTED': return <CheckCircle className="w-4 h-4" />;
      case 'GRADED': return <CheckCircle className="w-4 h-4" />;
      case 'LATE': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getDaysRemaining = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return <AssignmentsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900 dark:text-white mb-2">My Assignments</h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and submit your assignments
          </p>
          {assignmentsError && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              Unable to load assignments. Please try again.
            </p>
          )}
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total</p>
              <p className="text-3xl text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
              <FileText className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending</p>
              <p className="text-3xl text-orange-600 dark:text-orange-400">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Submitted</p>
              <p className="text-3xl text-blue-600 dark:text-blue-400">{stats.submitted}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Graded</p>
              <p className="text-3xl text-green-600 dark:text-green-400">{stats.graded}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800">
          <div>
            <p className="text-sm text-purple-700 dark:text-purple-300 mb-1">Avg Score</p>
            <p className="text-3xl text-purple-900 dark:text-purple-100">{stats.averageScore}%</p>
          </div>
        </Card>
      </div>

      {/* Assignments Tabs */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <Tabs defaultValue="pending" className="w-full">
          <div className="border-b border-gray-200 dark:border-gray-700 px-6 pt-6">
            <TabsList className="w-full justify-start bg-transparent border-b-0 h-auto p-0 space-x-8">
              <TabsTrigger 
                value="pending"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-0 pb-3"
              >
                Pending ({pendingAssignments.length})
              </TabsTrigger>
              <TabsTrigger 
                value="submitted"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-0 pb-3"
              >
                Submitted ({submittedAssignments.length})
              </TabsTrigger>
              <TabsTrigger 
                value="graded"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-0 pb-3"
              >
                Graded ({gradedAssignments.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="pending" className="mt-0">
              <div className="space-y-4">
                {pendingAssignments.map((assignment) => {
                  const daysLeft = getDaysRemaining(assignment.dueDate);
                  return (
                    <Card key={assignment.id} className="p-6 border-2 border-gray-200 dark:border-gray-700">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg text-gray-900 dark:text-white mb-1">{assignment.title}</h3>
                            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-2">
                              <span>{assignment.subject.name}</span>
                              <span>•</span>
                              <span>{assignment.teacher.name}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <Badge variant="outline" className={getStatusColor(assignment.status)}>
                                {getStatusIcon(assignment.status)}
                                <span className="ml-1">{assignment.status}</span>
                              </Badge>
                              <span className={`flex items-center gap-1 ${daysLeft <= 2 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                <Calendar className="w-4 h-4" />
                                Due: {new Date(assignment.dueDate).toLocaleDateString()} 
                                {daysLeft >= 0 && <span className="ml-1">({daysLeft} days left)</span>}
                              </span>
                              <span className="text-gray-600 dark:text-gray-400">
                                Total Marks: {assignment.totalMarks}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 pl-16">
                        {assignment.description}
                      </p>

                      <div className="flex gap-3 pl-16">
                        <Dialog open={isSubmitDialogOpen && selectedAssignmentId === assignment.id} onOpenChange={(open) => {
                          setIsSubmitDialogOpen(open);
                          if (open) setSelectedAssignmentId(assignment.id);
                          else setSelectedAssignmentId(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                              <Upload className="w-4 h-4 mr-2" />
                              Submit Assignment
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Submit Assignment</DialogTitle>
                              <DialogDescription>
                                Submit your assignment with text or file URL.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  <strong>Assignment:</strong> {assignment.title}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  <strong>Subject:</strong> {assignment.subject.name} | <strong>Due:</strong> {new Date(assignment.dueDate).toLocaleDateString()}
                                </p>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="fileUrl">File URL (Optional)</Label>
                                <Input
                                  id="fileUrl"
                                  value={fileUrl}
                                  onChange={(e) => setFileUrl(e.target.value)}
                                  placeholder="https://example.com/my-assignment.pdf"
                                  className="h-11"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="notes">Submission Text</Label>
                                <Textarea
                                  id="notes"
                                  value={submissionText}
                                  onChange={(e) => setSubmissionText(e.target.value)}
                                  placeholder="Enter your submission or notes..."
                                  rows={4}
                                  className="resize-none"
                                />
                              </div>

                              <div className="flex gap-3 pt-4">
                                <Button 
                                  onClick={handleSubmitAssignment} 
                                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                                  disabled={submitting}
                                >
                                  {submitting ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Submitting...
                                    </>
                                  ) : (
                                    'Submit'
                                  )}
                                </Button>
                                <Button onClick={() => setIsSubmitDialogOpen(false)} variant="outline" className="flex-1">
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button variant="outline">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </Card>
                  );
                })}
                {pendingAssignments.length === 0 && (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No pending assignments</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="submitted" className="mt-0">
              <div className="space-y-4">
                {submittedAssignments.map((assignment) => (
                  <Card key={assignment.id} className="p-6 border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg text-gray-900 dark:text-white mb-1">{assignment.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{assignment.subject.name} • {assignment.teacher.name}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span>Submitted: {assignment.submittedAt && new Date(assignment.submittedAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>Awaiting Grade</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </Card>
                ))}
                {submittedAssignments.length === 0 && (
                  <div className="text-center py-12">
                    <Upload className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No submitted assignments</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="graded" className="mt-0">
              <div className="space-y-4">
                {gradedAssignments.map((assignment) => {
                  const percentage = ((assignment.obtainedMarks || 0) / assignment.totalMarks) * 100;
                  return (
                    <Card key={assignment.id} className="p-6 border-2 border-green-200 dark:border-green-800">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg text-gray-900 dark:text-white mb-1">{assignment.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{assignment.subject.name} • {assignment.teacher.name}</p>
                            <div className="flex items-center gap-4 text-sm">
                              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400">
                                GRADED
                              </Badge>
                              <span className="text-gray-600 dark:text-gray-400">
                                Submitted: {assignment.submittedAt && new Date(assignment.submittedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl text-gray-900 dark:text-white mb-1">
                            {assignment.obtainedMarks}/{assignment.totalMarks}
                          </p>
                          <Badge variant="outline" className={
                            percentage >= 90 ? 'bg-green-100 text-green-700 border-green-300' :
                            percentage >= 80 ? 'bg-blue-100 text-blue-700 border-blue-300' :
                            percentage >= 70 ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                            'bg-orange-100 text-orange-700 border-orange-300'
                          }>
                            {percentage.toFixed(0)}%
                          </Badge>
                        </div>
                      </div>

                      {assignment.feedback && (
                        <div className="pl-16 mb-4">
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                            <strong>Teacher Feedback:</strong>
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                            "{assignment.feedback}"
                          </p>
                        </div>
                      )}

                      <div className="pl-16">
                        <Progress value={percentage} className="h-2" />
                      </div>
                    </Card>
                  );
                })}
                {gradedAssignments.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No graded assignments yet</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}
