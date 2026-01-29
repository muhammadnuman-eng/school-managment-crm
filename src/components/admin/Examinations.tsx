import { useState } from 'react';
import { ExaminationDashboard } from './examinations/ExaminationDashboard';
import { CreateExam } from './examinations/CreateExam';
import { ExamList } from './examinations/ExamList';
import { ExamDetails } from './examinations/ExamDetails';
import { MarksEntry } from './examinations/MarksEntry';
import { GradeConfiguration } from './examinations/GradeConfiguration';
import { ReportCardPreview } from './examinations/ReportCardPreview';
import { ResultsPublication } from './examinations/ResultsPublication';
import { ExamAnalytics } from './examinations/ExamAnalytics';
import { ExamSettings } from './examinations/ExamSettings';

export type ExamView = 
  | 'dashboard' 
  | 'create' 
  | 'list' 
  | 'details' 
  | 'marks-entry' 
  | 'grade-config'
  | 'report-preview'
  | 'results-publication'
  | 'analytics'
  | 'settings';

export interface Exam {
  id: string;
  name: string;
  type: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  classes: string[];
  subjects: string[];
  status: 'Scheduled' | 'Ongoing' | 'Completed' | 'Archived';
  description?: string;
  totalStudents: number;
  marksEntryProgress: number;
  resultsPublished: number;
}

export function Examinations() {
  const [currentView, setCurrentView] = useState<ExamView>('dashboard');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleViewChange = (view: ExamView, exam?: Exam) => {
    setCurrentView(view);
    if (exam) {
      setSelectedExam(exam);
    }
  };

  const handleCreateExam = () => {
    setShowCreateDialog(true);
  };

  const handleExamCreated = () => {
    setShowCreateDialog(false);
    setCurrentView('dashboard');
    // Trigger refresh of dashboard data
    setRefreshKey(prev => prev + 1);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <ExaminationDashboard 
            key={refreshKey}
            onCreateExam={handleCreateExam}
            onViewExam={(exam) => handleViewChange('details', exam)}
            onViewList={() => handleViewChange('list')}
            onViewAnalytics={() => handleViewChange('analytics')}
          />
        );
      case 'list':
        return (
          <ExamList
            onViewExam={(exam) => handleViewChange('details', exam)}
            onCreateExam={handleCreateExam}
            onBack={() => handleViewChange('dashboard')}
          />
        );
      case 'details':
        return (
          <ExamDetails
            exam={selectedExam}
            onBack={() => handleViewChange('dashboard')}
            onEnterMarks={(exam) => handleViewChange('marks-entry', exam)}
            onPublishResults={(exam) => handleViewChange('results-publication', exam)}
            onViewReport={(exam) => handleViewChange('report-preview', exam)}
          />
        );
      case 'marks-entry':
        return (
          <MarksEntry
            exam={selectedExam}
            onBack={() => handleViewChange('details', selectedExam!)}
          />
        );
      case 'grade-config':
        return (
          <GradeConfiguration
            onBack={() => handleViewChange('settings')}
          />
        );
      case 'report-preview':
        return (
          <ReportCardPreview
            exam={selectedExam}
            onBack={() => handleViewChange('details', selectedExam!)}
          />
        );
      case 'results-publication':
        return (
          <ResultsPublication
            exam={selectedExam}
            onBack={() => handleViewChange('details', selectedExam!)}
            onPublish={() => handleViewChange('dashboard')}
          />
        );
      case 'analytics':
        return (
          <ExamAnalytics
            onBack={() => handleViewChange('dashboard')}
          />
        );
      case 'settings':
        return (
          <ExamSettings
            onBack={() => handleViewChange('dashboard')}
            onGradeConfig={() => handleViewChange('grade-config')}
          />
        );
      default:
        return (
          <ExaminationDashboard 
            key={refreshKey}
            onCreateExam={handleCreateExam}
            onViewExam={(exam) => handleViewChange('details', exam)}
            onViewList={() => handleViewChange('list')}
            onViewAnalytics={() => handleViewChange('analytics')}
          />
        );
    }
  };

  return (
    <>
      {renderView()}
      {showCreateDialog && (
        <CreateExam
          onClose={() => setShowCreateDialog(false)}
          onSuccess={handleExamCreated}
        />
      )}
    </>
  );
}
