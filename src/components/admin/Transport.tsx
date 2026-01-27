import { useState } from 'react';
import { Bus, MapPin, Plus, Clock, Users, Edit, Trash2, Eye } from 'lucide-react';
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

const routes = [
  { id: 1, name: 'Route A - North', busNo: 'BUS-01', driver: 'John Smith', capacity: 40, students: 35, stops: 8, status: 'Active' },
  { id: 2, name: 'Route B - South', busNo: 'BUS-02', driver: 'Michael Johnson', capacity: 45, students: 42, stops: 10, status: 'Active' },
  { id: 3, name: 'Route C - East', busNo: 'BUS-03', driver: 'David Williams', capacity: 40, students: 38, stops: 9, status: 'Active' },
  { id: 4, name: 'Route D - West', busNo: 'BUS-04', driver: 'Robert Brown', capacity: 35, students: 30, stops: 7, status: 'Maintenance' },
];

export function Transport() {
  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleAddRoute = () => {
    toast.success('Route Added', {
      description: 'New bus route has been added successfully',
    });
    setShowAddDialog(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-white mb-2">Transport Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage buses, routes, and student transport</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-[#0A66C2] hover:bg-[#0052A3]">
          <Plus className="w-4 h-4 mr-2" />
          Add Route
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Buses</p>
              <p className="text-3xl text-gray-900 dark:text-white">12</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Bus className="w-6 h-6 text-[#0A66C2]" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Routes</p>
              <p className="text-3xl text-gray-900 dark:text-white">8</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-[#10B981]" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Students</p>
              <p className="text-3xl text-gray-900 dark:text-white">245</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-[#7C3AED]" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">In Maintenance</p>
              <p className="text-3xl text-gray-900 dark:text-white">2</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg text-gray-900 dark:text-white mb-4">Bus Routes</h2>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800">
                <TableHead>Route Name</TableHead>
                <TableHead>Bus Number</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Stops</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routes.map((route) => (
                <TableRow key={route.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-white">{route.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-700 dark:text-gray-300">{route.busNo}</TableCell>
                  <TableCell className="text-gray-700 dark:text-gray-300">{route.driver}</TableCell>
                  <TableCell className="text-gray-700 dark:text-gray-300">{route.capacity}</TableCell>
                  <TableCell>
                    <span className="text-gray-700 dark:text-gray-300">{route.students}</span>
                    <span className="text-gray-400 text-sm"> / {route.capacity}</span>
                  </TableCell>
                  <TableCell className="text-gray-700 dark:text-gray-300">{route.stops}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={route.status === 'Active' ? 'default' : 'secondary'}
                      className={route.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}
                    >
                      {route.status}
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
            <DialogTitle>Add New Route</DialogTitle>
            <DialogDescription>Create a new bus route with stops and schedule</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="routeName">Route Name</Label>
              <Input id="routeName" placeholder="e.g., Route A - North" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="busNumber">Bus Number</Label>
              <Input id="busNumber" placeholder="e.g., BUS-05" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="driver">Driver Name</Label>
              <Input id="driver" placeholder="Enter driver name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Seating Capacity</Label>
              <Input id="capacity" type="number" placeholder="40" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stops">Number of Stops</Label>
              <Input id="stops" type="number" placeholder="8" />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="status">Status</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button className="bg-[#0A66C2] hover:bg-[#0052A3]" onClick={handleAddRoute}>Add Route</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
