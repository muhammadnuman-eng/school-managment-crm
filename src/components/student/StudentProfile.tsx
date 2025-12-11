import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Save, Camera, Loader2, RefreshCw } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Skeleton } from '../ui/skeleton';
import { useProfile, useUpdateProfile, usePerformanceOverview, useAttendanceSummary } from '../../hooks/useStudentData';

// Skeleton loader
function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-40 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-96" />
        <Skeleton className="lg:col-span-2 h-96" />
      </div>
    </div>
  );
}

export function StudentProfile() {
  // API Hooks - Based on student-panel-apis.json
  // PROFILE_01: /student/profile
  const { data: profileData, loading: profileLoading, error: profileError, refetch: refetchProfile } = useProfile();
  
  // PROFILE_02: /student/profile (PATCH)
  const { updateProfile, loading: updating } = useUpdateProfile();
  
  // EXAM_05: /student/exams/performance/overview (for academic stats)
  const { data: performanceData } = usePerformanceOverview();
  
  // ATTENDANCE_02: /student/attendance/summary
  const { data: attendanceData } = useAttendanceSummary();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    address: '',
    medicalInfo: '',
    phone: '',
    preferredLocale: 'en',
    timezone: 'Asia/Karachi',
  });

  // Update form data when profile loads
  useEffect(() => {
    if (profileData) {
      setFormData({
        address: profileData.address || '',
        medicalInfo: profileData.medicalInfo || '',
        phone: profileData.phone || '',
        preferredLocale: profileData.preferredLocale || 'en',
        timezone: profileData.timezone || 'Asia/Karachi',
      });
    }
  }, [profileData]);

  const handleSave = async () => {
    const result = await updateProfile(formData);
    if (result) {
      setIsEditing(false);
      refetchProfile();
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Academic stats from APIs
  const academicStats = {
    currentGPA: performanceData?.currentGPA || 0,
    attendance: attendanceData?.percentage || 0,
    rank: performanceData?.rank,
    totalStudents: performanceData?.totalStudents,
  };

  if (profileLoading) {
    return <ProfileSkeleton />;
  }

  const profile = profileData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900 dark:text-white mb-2">My Profile</h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage your profile information
          </p>
          {profileError && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              Unable to load profile. Please try again.
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetchProfile()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={updating} className="bg-blue-600 hover:bg-blue-700 text-white">
                {updating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button onClick={() => setIsEditing(false)} variant="outline">
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="relative inline-block mb-4">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-4xl mx-auto">
                {profile?.firstName?.charAt(0) || 'S'}
              </div>
              {isEditing && (
                <button className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white border-4 border-white dark:border-gray-800">
                  <Camera className="w-5 h-5" />
                </button>
              )}
            </div>
            <h2 className="text-2xl text-gray-900 dark:text-white mb-1">
              {profile?.firstName} {profile?.lastName}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {profile?.student?.class} - Section {profile?.student?.section}
            </p>
            <Badge variant="outline" className="mb-4">
              Roll No: {profile?.student?.rollNumber}
            </Badge>
            <Badge variant="outline">
              {profile?.student?.admissionNumber}
            </Badge>

            <div className="space-y-3 text-sm text-left mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{profile?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>{profile?.phone || 'Not set'}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>{profile?.address || 'Not set'}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Academic Stats */}
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
            <h3 className="text-lg text-gray-900 dark:text-white mb-4">Academic Statistics</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">GPA</p>
                <p className="text-2xl text-gray-900 dark:text-white">{academicStats.currentGPA.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Attendance</p>
                <p className="text-2xl text-gray-900 dark:text-white">{academicStats.attendance}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Class Rank</p>
                <p className="text-2xl text-gray-900 dark:text-white">
                  {academicStats.rank ? `#${academicStats.rank}` : '-'}
                </p>
              </div>
            </div>
          </Card>

          {/* Profile Information */}
          <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="w-full justify-start bg-transparent border-b border-gray-200 dark:border-gray-700 rounded-none h-auto p-0 space-x-8 mb-6">
                <TabsTrigger 
                  value="personal"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-0 pb-3"
                >
                  Personal Info
                </TabsTrigger>
                <TabsTrigger 
                  value="academic"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-0 pb-3"
                >
                  Academic Info
                </TabsTrigger>
                <TabsTrigger 
                  value="settings"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-0 pb-3"
                >
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="mt-0">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={profile?.firstName || ''}
                        disabled
                        className="h-11 bg-gray-50 dark:bg-gray-900"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profile?.lastName || ''}
                        disabled
                        className="h-11 bg-gray-50 dark:bg-gray-900"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          value={profile?.email || ''}
                          disabled
                          className="pl-10 h-11 bg-gray-50 dark:bg-gray-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleChange('phone', e.target.value)}
                          disabled={!isEditing}
                          className="pl-10 h-11"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        disabled={!isEditing}
                        rows={3}
                        className="pl-10 resize-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medical">Medical Information</Label>
                    <Textarea
                      id="medical"
                      value={formData.medicalInfo}
                      onChange={(e) => handleChange('medicalInfo', e.target.value)}
                      disabled={!isEditing}
                      rows={2}
                      className="resize-none"
                      placeholder="Any allergies or medical conditions..."
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="academic" className="mt-0">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="admissionNumber">Admission Number</Label>
                      <Input
                        id="admissionNumber"
                        value={profile?.student?.admissionNumber || ''}
                        disabled
                        className="h-11 bg-gray-50 dark:bg-gray-900"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rollNumber">Roll Number</Label>
                      <Input
                        id="rollNumber"
                        value={profile?.student?.rollNumber || ''}
                        disabled
                        className="h-11 bg-gray-50 dark:bg-gray-900"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="class">Class</Label>
                      <Input
                        id="class"
                        value={profile?.student?.class || ''}
                        disabled
                        className="h-11 bg-gray-50 dark:bg-gray-900"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="section">Section</Label>
                      <Input
                        id="section"
                        value={profile?.student?.section || ''}
                        disabled
                        className="h-11 bg-gray-50 dark:bg-gray-900"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="mt-0">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="locale">Language</Label>
                      <Select 
                        value={formData.preferredLocale} 
                        onValueChange={(value) => handleChange('preferredLocale', value)} 
                        disabled={!isEditing}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="ur">Urdu</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select 
                        value={formData.timezone} 
                        onValueChange={(value) => handleChange('timezone', value)} 
                        disabled={!isEditing}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Asia/Karachi">Pakistan (PKT)</SelectItem>
                          <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
