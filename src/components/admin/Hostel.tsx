import { useState } from 'react';
import { Building2, Bed, Users, Plus, Edit, Trash2, Eye } from 'lucide-react';
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

const rooms = [
  { id: 1, roomNo: 'H-101', block: 'Block A', type: 'Boys', capacity: 4, occupied: 4, warden: 'Sarah Johnson', status: 'Full' },
  { id: 2, roomNo: 'H-102', block: 'Block A', type: 'Boys', capacity: 4, occupied: 3, warden: 'Sarah Johnson', status: 'Available' },
  { id: 3, roomNo: 'H-201', block: 'Block B', type: 'Girls', capacity: 4, occupied: 4, warden: 'Emily Davis', status: 'Full' },
  { id: 4, roomNo: 'H-202', block: 'Block B', type: 'Girls', capacity: 4, occupied: 2, warden: 'Emily Davis', status: 'Available' },
  { id: 5, roomNo: 'H-301', block: 'Block C', type: 'Boys', capacity: 6, occupied: 5, warden: 'Michael Brown', status: 'Available' },
];

export function Hostel() {
  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleAddRoom = () => {
    toast.success('Room Added', {
      description: 'New hostel room has been added successfully',
    });
    setShowAddDialog(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-white mb-2">Hostel Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage hostel rooms and student allocations</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-[#0A66C2] hover:bg-[#0052A3]">
          <Plus className="w-4 h-4 mr-2" />
          Add Room
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Rooms</p>
              <p className="text-3xl text-gray-900 dark:text-white">45</p>
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
              <p className="text-3xl text-gray-900 dark:text-white">38</p>
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
              <p className="text-3xl text-gray-900 dark:text-white">7</p>
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
              <p className="text-3xl text-gray-900 dark:text-white">142</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg text-gray-900 dark:text-white mb-4">Hostel Rooms</h2>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800">
                <TableHead>Room Number</TableHead>
                <TableHead>Block</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Occupied</TableHead>
                <TableHead>Warden</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Bed className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-white">{room.roomNo}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-700 dark:text-gray-300">{room.block}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={room.type === 'Boys' ? 'border-blue-500 text-blue-700' : 'border-pink-500 text-pink-700'}>
                      {room.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-700 dark:text-gray-300">{room.capacity}</TableCell>
                  <TableCell>
                    <span className="text-gray-700 dark:text-white">{room.occupied}</span>
                    <span className="text-gray-400 text-sm"> / {room.capacity}</span>
                  </TableCell>
                  <TableCell className="text-gray-700 dark:text-gray-300">{room.warden}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={room.status === 'Available' ? 'default' : 'secondary'}
                      className={room.status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                    >
                      {room.status}
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
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Room</DialogTitle>
            <DialogDescription>Create a new hostel room allocation</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="roomNo">Room Number</Label>
              <Input id="roomNo" placeholder="e.g., H-103" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="block">Block</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select block" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a">Block A</SelectItem>
                  <SelectItem value="b">Block B</SelectItem>
                  <SelectItem value="c">Block C</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Room Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boys">Boys</SelectItem>
                  <SelectItem value="girls">Girls</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Bed Capacity</Label>
              <Input id="capacity" type="number" placeholder="4" />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="warden">Warden Name</Label>
              <Input id="warden" placeholder="Enter warden name" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button className="bg-[#0A66C2] hover:bg-[#0052A3]" onClick={handleAddRoom}>Add Room</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
