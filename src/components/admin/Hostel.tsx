import { useState, useEffect } from 'react';
import { Building2, Bed, Users, Plus, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner@2.0.3';
import { adminService } from '../../services';
import { schoolStorage } from '../../utils/storage';
import type { HostelRoom, HostelBuilding, CreateHostelRoomRequest, RoomType, HostelOverview } from '../../types/hostel.types';

export function Hostel() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAddBuildingDialog, setShowAddBuildingDialog] = useState(false);
  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [buildings, setBuildings] = useState<HostelBuilding[]>([]);
  const [overview, setOverview] = useState<HostelOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittingBuilding, setSubmittingBuilding] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateHostelRoomRequest>({
    buildingId: '',
    roomNumber: '',
    floorNumber: undefined,
    capacity: 0,
    roomType: 'DOUBLE',
    facilities: undefined,
  });

  // Building form state
  const [buildingFormData, setBuildingFormData] = useState({
    buildingName: '',
    buildingType: 'BOYS' as 'BOYS' | 'GIRLS' | 'MIXED',
    numberOfFloors: undefined as number | undefined,
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchHostelData();
  }, []);

  const fetchHostelData = async () => {
    try {
      setLoading(true);
      const schoolId = schoolStorage.getSchoolId();
      
      if (!schoolId) {
        toast.error('School ID not found');
        return;
      }

      // Fetch rooms, buildings, and overview in parallel
      const [roomsResponse, buildingsResponse, overviewResponse] = await Promise.all([
        adminService.getHostelRooms(),
        adminService.getHostelBuildings(),
        adminService.getHostelOverview(),
      ]);

      setRooms(roomsResponse.rooms || []);
      const buildingsList = buildingsResponse.buildings || [];
      setBuildings(buildingsList);
      setOverview(overviewResponse);
      
      // Set initial buildingId if buildings are available
      if (buildingsList.length > 0 && !formData.buildingId) {
        setFormData(prev => ({ ...prev, buildingId: buildingsList[0].id }));
      }
    } catch (error: any) {
      console.error('Error fetching hostel data:', error);
      toast.error('Failed to load hostel data', {
        description: error.message || 'Please try again later',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = async () => {
    try {
      const schoolId = schoolStorage.getSchoolId();
      
      if (!schoolId) {
        toast.error('School ID not found');
        return;
      }

      if (!formData.buildingId || !formData.roomNumber || !formData.capacity || formData.capacity <= 0 || !formData.roomType) {
        toast.error('Please fill in all required fields');
        return;
      }

      setSubmitting(true);

      const request: CreateHostelRoomRequest = {
        buildingId: formData.buildingId,
        roomNumber: formData.roomNumber,
        floorNumber: formData.floorNumber,
        capacity: formData.capacity,
        roomType: formData.roomType,
        facilities: formData.facilities,
      };

      await adminService.createHostelRoom(request);

      toast.success('Room Added', {
        description: 'New hostel room has been added successfully',
      });

      // Reset form
      setFormData({
        buildingId: buildings.length > 0 ? buildings[0].id : '',
        roomNumber: '',
        floorNumber: undefined,
        capacity: 0,
        roomType: 'DOUBLE',
        facilities: undefined,
      });

      setShowAddDialog(false);
      
      // Refresh data
      await fetchHostelData();
    } catch (error: any) {
      console.error('Error creating room:', error);
      toast.error('Failed to create room', {
        description: error.message || 'Please try again later',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddBuilding = async () => {
    try {
      const schoolId = schoolStorage.getSchoolId();
      
      if (!schoolId) {
        toast.error('School ID not found');
        return;
      }

      if (!buildingFormData.buildingName || !buildingFormData.buildingType) {
        toast.error('Please fill in all required fields');
        return;
      }

      setSubmittingBuilding(true);

      const request = {
        schoolId,
        buildingName: buildingFormData.buildingName,
        buildingType: buildingFormData.buildingType,
        numberOfFloors: buildingFormData.numberOfFloors,
      };

      await adminService.createHostelBuilding(request);

      toast.success('Building Added', {
        description: 'New hostel building has been added successfully',
      });

      // Reset form
      setBuildingFormData({
        buildingName: '',
        buildingType: 'BOYS',
        numberOfFloors: undefined,
      });

      setShowAddBuildingDialog(false);
      
      // Refresh data
      await fetchHostelData();
    } catch (error: any) {
      console.error('Error creating building:', error);
      toast.error('Failed to create building', {
        description: error.message || 'Please try again later',
      });
    } finally {
      setSubmittingBuilding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-white mb-2">Hostel Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage hostel rooms and student allocations</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowAddBuildingDialog(true)} variant="outline" className="border-[#0A66C2] text-[#0A66C2] hover:bg-[#0A66C2] hover:text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Building
          </Button>
          <Button onClick={() => setShowAddDialog(true)} className="bg-[#0A66C2] hover:bg-[#0052A3]">
            <Plus className="w-4 h-4 mr-2" />
            Add Room
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Rooms</p>
              <p className="text-3xl text-gray-900 dark:text-white">
                {loading ? '...' : (overview?.totalRooms || rooms.length)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-[#0A66C2]" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Occupied</p>
              <p className="text-3xl text-gray-900 dark:text-white">
                {loading ? '...' : (overview?.occupiedBeds || 0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <Bed className="w-6 h-6 text-[#10B981]" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Available</p>
              <p className="text-3xl text-gray-900 dark:text-white">
                {loading ? '...' : (overview?.availableBeds || 0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <Bed className="w-6 h-6 text-[#7C3AED]" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Students</p>
              <p className="text-3xl text-gray-900 dark:text-white">
                {loading ? '...' : (overview?.totalStudents || 0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg text-gray-900 dark:text-white mb-4">Hostel Rooms</h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Bed className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No rooms found</p>
            <p className="text-sm mt-2">Click "Add Room" to create your first room</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800">
                  <TableHead>Room Number</TableHead>
                  <TableHead>Building</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Occupied</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((room) => {
                  const occupied = room.occupiedBeds ?? room._count?.allocations ?? 0;
                  const available = room.availableBeds ?? (room.capacity - occupied);
                  const status = room.status || (available > 0 ? 'AVAILABLE' : 'OCCUPIED');
                  const buildingName = room.building?.buildingName || room.buildingName || 'N/A';
                  
                  return (
                    <TableRow key={room.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Bed className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900 dark:text-white">{room.roomNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">
                        {buildingName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-blue-500 text-blue-700">
                          {room.roomType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">{room.capacity}</TableCell>
                      <TableCell>
                        <span className="text-gray-700 dark:text-white">{occupied}</span>
                        <span className="text-gray-400 text-sm"> / {room.capacity}</span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={status === 'AVAILABLE' ? 'default' : 'secondary'}
                          className={status === 'AVAILABLE' ? 'bg-green-100 text-green-700' : status === 'OCCUPIED' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}
                        >
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Room</DialogTitle>
            <DialogDescription>Create a new hostel room</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="buildingId">Building *</Label>
              <Select
                value={formData.buildingId}
                onValueChange={(value) => setFormData({ ...formData, buildingId: value })}
                disabled={buildings.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select building" />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map((building) => (
                    <SelectItem key={building.id} value={building.id}>
                      {building.buildingName} ({building.buildingType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {buildings.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  No buildings found. Please create a building first using "Add Building" button.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="roomNumber">Room Number *</Label>
              <Input 
                id="roomNumber" 
                placeholder="e.g., H-101, R-201" 
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="floorNumber">Floor Number</Label>
              <Input 
                id="floorNumber" 
                type="number" 
                placeholder="e.g., 1, 2" 
                min="1"
                value={formData.floorNumber || ''}
                onChange={(e) => setFormData({ ...formData, floorNumber: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Bed Capacity *</Label>
              <Input 
                id="capacity" 
                type="number" 
                placeholder="e.g., 4" 
                min="1"
                value={formData.capacity || ''}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value ? Number(e.target.value) : 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roomType">Room Type *</Label>
              <Select
                value={formData.roomType}
                onValueChange={(value: RoomType) => setFormData({ ...formData, roomType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select room type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SINGLE">Single</SelectItem>
                  <SelectItem value="DOUBLE">Double</SelectItem>
                  <SelectItem value="TRIPLE">Triple</SelectItem>
                  <SelectItem value="DORMITORY">Dormitory</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAddDialog(false);
                setFormData({
                  buildingId: buildings.length > 0 ? buildings[0].id : '',
                  roomNumber: '',
                  floorNumber: undefined,
                  capacity: 0,
                  roomType: 'DOUBLE',
                  facilities: undefined,
                });
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              className="bg-[#0A66C2] hover:bg-[#0052A3]" 
              onClick={handleAddRoom}
              disabled={submitting || buildings.length === 0 || !formData.buildingId}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Room'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Building Dialog */}
      <Dialog open={showAddBuildingDialog} onOpenChange={setShowAddBuildingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Building</DialogTitle>
            <DialogDescription>Create a new hostel building</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="buildingName">Building Name *</Label>
              <Input 
                id="buildingName" 
                placeholder="e.g., Block A, Main Building" 
                value={buildingFormData.buildingName}
                onChange={(e) => setBuildingFormData({ ...buildingFormData, buildingName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buildingType">Building Type *</Label>
              <Select
                value={buildingFormData.buildingType}
                onValueChange={(value: 'BOYS' | 'GIRLS' | 'MIXED') => setBuildingFormData({ ...buildingFormData, buildingType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select building type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOYS">Boys</SelectItem>
                  <SelectItem value="GIRLS">Girls</SelectItem>
                  <SelectItem value="MIXED">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="numberOfFloors">Number of Floors</Label>
              <Input 
                id="numberOfFloors" 
                type="number" 
                placeholder="e.g., 3" 
                min="1"
                value={buildingFormData.numberOfFloors || ''}
                onChange={(e) => setBuildingFormData({ ...buildingFormData, numberOfFloors: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAddBuildingDialog(false);
                setBuildingFormData({
                  buildingName: '',
                  buildingType: 'BOYS',
                  numberOfFloors: undefined,
                });
              }}
              disabled={submittingBuilding}
            >
              Cancel
            </Button>
            <Button 
              className="bg-[#0A66C2] hover:bg-[#0052A3]" 
              onClick={handleAddBuilding}
              disabled={submittingBuilding}
            >
              {submittingBuilding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Building'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}