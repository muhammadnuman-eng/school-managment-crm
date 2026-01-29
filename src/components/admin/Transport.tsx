import { useState, useEffect } from 'react';
import { Bus, MapPin, Plus, Clock, Users, Edit, Trash2, Eye, Loader2, MoreVertical } from 'lucide-react';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Switch } from '../ui/switch';
import { toast } from 'sonner@2.0.3';
import { adminService } from '../../services';
import { schoolStorage } from '../../utils/storage';
import type { TransportRoute, Bus as BusType, Driver, CreateTransportRouteRequest, CreateBusRequest, CreateDriverRequest, BusType as BusTypeEnum } from '../../types/transport.types';

export function Transport() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAddBusDialog, setShowAddBusDialog] = useState(false);
  const [showAddDriverDialog, setShowAddDriverDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<TransportRoute | null>(null);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [buses, setBuses] = useState<BusType[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittingBus, setSubmittingBus] = useState(false);
  const [submittingDriver, setSubmittingDriver] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Omit<CreateTransportRouteRequest, 'schoolId'>>({
    routeName: '',
    busId: '',
    driverId: '',
    status: 'ACTIVE',
    monthlyFee: undefined,
    yearlyFee: undefined,
    stops: [],
  });

  // Bus form state
  const [busFormData, setBusFormData] = useState<Omit<CreateBusRequest, 'schoolId'>>({
    registrationNumber: '',
    capacity: 0,
    busType: 'STANDARD',
    insuranceNumber: '',
    insuranceExpiry: '',
    lastMaintenanceDate: '',
    nextMaintenanceDate: '',
  });

  // Driver form state
  const [driverFormData, setDriverFormData] = useState<Omit<CreateDriverRequest, 'schoolId'>>({
    name: '',
    licenseNumber: '',
    phone: '',
    email: '',
    address: '',
    experienceYears: undefined,
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchTransportData();
  }, []);

  // Refresh buses and drivers when Add Route dialog opens
  useEffect(() => {
    if (showAddDialog) {
      const refreshData = async () => {
        try {
          const [busesResponse, driversResponse] = await Promise.all([
            adminService.getBuses(),
            adminService.getDrivers(),
          ]);
          
          if (import.meta.env.DEV) {
            console.log('Buses Response:', busesResponse);
            console.log('Drivers Response:', driversResponse);
          }
          
          setBuses(busesResponse.buses || []);
          setDrivers(driversResponse.drivers || []);
        } catch (error: any) {
          console.error('Error refreshing buses/drivers:', error);
          toast.error('Failed to load buses/drivers', {
            description: error.message || 'Please try again',
          });
        }
      };
      refreshData();
    }
  }, [showAddDialog]);

  const fetchTransportData = async () => {
    try {
      setLoading(true);
      const schoolId = schoolStorage.getSchoolId();
      
      if (!schoolId) {
        toast.error('School ID not found');
        return;
      }

      // Fetch routes, buses, and drivers in parallel
      const [routesResponse, busesResponse, driversResponse] = await Promise.all([
        adminService.getTransportRoutes(),
        adminService.getBuses(),
        adminService.getDrivers(),
      ]);

      setRoutes(routesResponse.routes || []);
      setBuses(busesResponse.buses || []);
      setDrivers(driversResponse.drivers || []);
      
      if (import.meta.env.DEV) {
        console.log('Transport Data Fetched:', {
          routes: routesResponse.routes?.length || 0,
          buses: busesResponse.buses?.length || 0,
          drivers: driversResponse.drivers?.length || 0,
        });
      }
    } catch (error: any) {
      console.error('Error fetching transport data:', error);
      toast.error('Failed to load transport data', {
        description: error.message || 'Please try again later',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoute = async () => {
    try {
      const schoolId = schoolStorage.getSchoolId();
      
      if (!schoolId) {
        toast.error('School ID not found');
        return;
      }

      if (!formData.routeName || !formData.busId || !formData.driverId) {
        toast.error('Please fill in all required fields');
        return;
      }

      setSubmitting(true);

      const request: CreateTransportRouteRequest = {
        schoolId,
        routeName: formData.routeName,
        busId: formData.busId,
        driverId: formData.driverId,
        status: formData.status,
        monthlyFee: formData.monthlyFee,
        yearlyFee: formData.yearlyFee,
        stops: formData.stops || [],
      };

      await adminService.createTransportRoute(request);

      toast.success('Route Added', {
        description: 'New bus route has been added successfully',
      });

      // Reset form
      setFormData({
        routeName: '',
        busId: '',
        driverId: '',
        status: 'ACTIVE',
        monthlyFee: undefined,
        yearlyFee: undefined,
        stops: [],
      });

      setShowAddDialog(false);
      
      // Refresh data
      await fetchTransportData();
    } catch (error: any) {
      console.error('Error creating route:', error);
      toast.error('Failed to create route', {
        description: error.message || 'Please try again later',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddBus = async () => {
    try {
      const schoolId = schoolStorage.getSchoolId();
      
      if (!schoolId) {
        toast.error('School ID not found');
        return;
      }

      if (!busFormData.registrationNumber || !busFormData.capacity || busFormData.capacity <= 0) {
        toast.error('Please fill in all required fields');
        return;
      }

      setSubmittingBus(true);

      const request: CreateBusRequest = {
        schoolId,
        registrationNumber: busFormData.registrationNumber,
        capacity: busFormData.capacity,
        busType: busFormData.busType,
        insuranceNumber: busFormData.insuranceNumber || undefined,
        insuranceExpiry: busFormData.insuranceExpiry || undefined,
        lastMaintenanceDate: busFormData.lastMaintenanceDate || undefined,
        nextMaintenanceDate: busFormData.nextMaintenanceDate || undefined,
      };

      await adminService.createBus(request);

      toast.success('Bus Added', {
        description: 'New bus has been added successfully',
      });

      // Reset form
      setBusFormData({
        registrationNumber: '',
        capacity: 0,
        busType: 'STANDARD',
        insuranceNumber: '',
        insuranceExpiry: '',
        lastMaintenanceDate: '',
        nextMaintenanceDate: '',
      });

      setShowAddBusDialog(false);
      
      // Refresh buses list
      await fetchTransportData();
    } catch (error: any) {
      console.error('Error creating bus:', error);
      toast.error('Failed to create bus', {
        description: error.message || 'Please try again later',
      });
    } finally {
      setSubmittingBus(false);
    }
  };

  const handleAddDriver = async () => {
    try {
      const schoolId = schoolStorage.getSchoolId();
      
      if (!schoolId) {
        toast.error('School ID not found');
        return;
      }

      if (!driverFormData.name || !driverFormData.licenseNumber) {
        toast.error('Please fill in all required fields');
        return;
      }

      setSubmittingDriver(true);

      const request: CreateDriverRequest = {
        schoolId,
        name: driverFormData.name,
        licenseNumber: driverFormData.licenseNumber,
        phone: driverFormData.phone || undefined,
        email: driverFormData.email || undefined,
        address: driverFormData.address || undefined,
        experienceYears: driverFormData.experienceYears || undefined,
      };

      await adminService.createDriver(request);

      toast.success('Driver Added', {
        description: 'New driver has been added successfully',
      });

      // Reset form
      setDriverFormData({
        name: '',
        licenseNumber: '',
        phone: '',
        email: '',
        address: '',
        experienceYears: undefined,
      });

      setShowAddDriverDialog(false);
      
      // Refresh drivers list
      await fetchTransportData();
    } catch (error: any) {
      console.error('Error creating driver:', error);
      toast.error('Failed to create driver', {
        description: error.message || 'Please try again later',
      });
    } finally {
      setSubmittingDriver(false);
    }
  };

  // Handle View Route
  const handleViewRoute = async (route: TransportRoute) => {
    try {
      setLoading(true);
      const routeData = await adminService.getTransportRouteById(route.id);
      setSelectedRoute(routeData);
      setShowViewDialog(true);
    } catch (error: any) {
      console.error('Error fetching route details:', error);
      toast.error('Failed to load route details', {
        description: error.message || 'Please try again later',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Edit Route
  const handleEditRoute = async (route: TransportRoute) => {
    try {
      setLoading(true);
      const routeData = await adminService.getTransportRouteById(route.id);
      setSelectedRoute(routeData);
      setFormData({
        routeName: routeData.routeName,
        busId: routeData.busId,
        driverId: routeData.driverId,
        status: routeData.status || 'ACTIVE',
        monthlyFee: routeData.monthlyFee ? Number(routeData.monthlyFee) : undefined,
        yearlyFee: routeData.yearlyFee ? Number(routeData.yearlyFee) : undefined,
        stops: routeData.stops || [],
      });
      setShowEditDialog(true);
    } catch (error: any) {
      console.error('Error fetching route details:', error);
      toast.error('Failed to load route details', {
        description: error.message || 'Please try again later',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete Route
  const handleDeleteRoute = async (route: TransportRoute) => {
    if (!confirm(`Are you sure you want to delete route "${route.routeName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(true);
      await adminService.deleteTransportRoute(route.id);
      toast.success('Route Deleted', {
        description: `Route "${route.routeName}" has been deleted successfully`,
      });
      
      // Remove from local state
      setRoutes(routes.filter(r => r.id !== route.id));
    } catch (error: any) {
      console.error('Error deleting route:', error);
      toast.error('Failed to delete route', {
        description: error.message || 'Please try again later',
      });
    } finally {
      setDeleting(false);
    }
  };

  // Handle Status Toggle
  const handleStatusToggle = async (route: TransportRoute) => {
    try {
      const newStatus = route.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await adminService.updateTransportRouteStatus(route.id, newStatus);
      toast.success('Status Updated', {
        description: `Route status updated to ${newStatus}`,
      });
      
      // Update local state
      setRoutes(routes.map(r => 
        r.id === route.id ? { ...r, status: newStatus as 'ACTIVE' | 'INACTIVE' } : r
      ));
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status', {
        description: error.message || 'Please try again later',
      });
    }
  };

  // Calculate stats
  const totalBuses = buses.length;
  const activeRoutes = routes.filter(r => r.status === 'ACTIVE').length;
  const totalStudents = routes.reduce((sum, route) => sum + (route.stops?.length || 0), 0);
  const maintenanceBuses = buses.filter(b => b.status === 'MAINTENANCE').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-white mb-2">Transport Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage buses, routes, and student transport</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowAddBusDialog(true)} variant="outline" className="border-[#0A66C2] text-[#0A66C2] hover:bg-[#0A66C2] hover:text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Bus
          </Button>
          <Button onClick={() => setShowAddDriverDialog(true)} variant="outline" className="border-[#0A66C2] text-[#0A66C2] hover:bg-[#0A66C2] hover:text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Driver
          </Button>
          <Button onClick={() => setShowAddDialog(true)} className="bg-[#0A66C2] hover:bg-[#0052A3]">
            <Plus className="w-4 h-4 mr-2" />
            Add Route
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Buses</p>
              <p className="text-3xl text-gray-900 dark:text-white">
                {loading ? '...' : totalBuses}
              </p>
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
              <p className="text-3xl text-gray-900 dark:text-white">
                {loading ? '...' : activeRoutes}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-[#10B981]" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Routes</p>
              <p className="text-3xl text-gray-900 dark:text-white">
                {loading ? '...' : routes.length}
              </p>
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
              <p className="text-3xl text-gray-900 dark:text-white">
                {loading ? '...' : maintenanceBuses}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg text-gray-900 dark:text-white mb-4">Bus Routes</h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : routes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No routes found</p>
            <p className="text-sm mt-2">Click "Add Route" to create your first route</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800">
                  <TableHead>Route Name</TableHead>
                  <TableHead>Bus Number</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Monthly Fee</TableHead>
                  <TableHead>Stops</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routes.map((route) => {
                  // Get bus registration number - try nested bus object first, then fallback
                  const busNumber = route.bus?.registrationNumber || 
                                   buses.find(b => b.id === route.busId)?.registrationNumber || 
                                   route.busRegistrationNumber || 
                                   'N/A';
                  
                  // Get driver name - try nested driver object first, then fallback
                  const driverName = route.driver?.name || 
                                   drivers.find(d => d.id === route.driverId)?.name || 
                                   route.driverName || 
                                   'N/A';
                  
                  return (
                    <TableRow key={route.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900 dark:text-white">{route.routeName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">
                        {busNumber}
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">
                        {driverName}
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">
                        {route.monthlyFee ? route.monthlyFee : 'N/A'}
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">
                        {route.stops?.length || 0}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={route.status === 'ACTIVE'}
                            onCheckedChange={() => handleStatusToggle(route)}
                          />
                          <Badge 
                            variant={route.status === 'ACTIVE' ? 'default' : 'secondary'}
                            className={route.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}
                          >
                            {route.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewRoute(route)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditRoute(route)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600" 
                              onClick={() => handleDeleteRoute(route)}
                              disabled={deleting}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
            <DialogTitle>Add New Route</DialogTitle>
            <DialogDescription>Create a new bus route with stops and schedule</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="routeName">Route Name *</Label>
              <Input 
                id="routeName" 
                placeholder="e.g., Route A - North" 
                value={formData.routeName}
                onChange={(e) => setFormData({ ...formData, routeName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="busId">Bus Registration Number *</Label>
              <Select 
                value={formData.busId} 
                onValueChange={(value) => setFormData({ ...formData, busId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select bus" />
                </SelectTrigger>
                <SelectContent>
                  {buses.length === 0 ? (
                    <div className="py-2 text-center text-sm text-gray-500">No buses available</div>
                  ) : (
                    buses.map((bus) => {
                      // Check if bus is already assigned to a route
                      const isAssigned = routes.some(
                        (route) => route.busId === bus.id || 
                                  route.bus?.id === bus.id
                      );
                      return (
                        <SelectItem 
                          key={bus.id} 
                          value={bus.id}
                          disabled={isAssigned}
                          className={isAssigned ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                          {bus.registrationNumber} (Capacity: {bus.capacity}) {isAssigned ? '(Assigned)' : ''}
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="driverId">Driver Name *</Label>
              <Select 
                value={formData.driverId} 
                onValueChange={(value) => setFormData({ ...formData, driverId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.length === 0 ? (
                    <div className="py-2 text-center text-sm text-gray-500">No drivers available</div>
                  ) : (
                    drivers.map((driver) => {
                      // Check if driver is already assigned to a route
                      const isAssigned = routes.some(
                        (route) => route.driverId === driver.id || 
                                  route.driver?.id === driver.id
                      );
                      return (
                        <SelectItem 
                          key={driver.id} 
                          value={driver.id}
                          disabled={isAssigned}
                          className={isAssigned ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                          {driver.name} ({driver.licenseNumber}) {isAssigned ? '(Assigned)' : ''}
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthlyFee">Monthly Fee</Label>
              <Input 
                id="monthlyFee" 
                type="number" 
                placeholder="e.g., 2000" 
                value={formData.monthlyFee || ''}
                onChange={(e) => setFormData({ ...formData, monthlyFee: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearlyFee">Yearly Fee</Label>
              <Input 
                id="yearlyFee" 
                type="number" 
                placeholder="e.g., 20000" 
                value={formData.yearlyFee || ''}
                onChange={(e) => setFormData({ ...formData, yearlyFee: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'ACTIVE' | 'INACTIVE') => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
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
                  routeName: '',
                  busId: '',
                  driverId: '',
                  status: 'ACTIVE',
                  monthlyFee: undefined,
                  yearlyFee: undefined,
                  stops: [],
                });
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              className="bg-[#0A66C2] hover:bg-[#0052A3]" 
              onClick={handleAddRoute}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Route'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Bus Dialog */}
      <Dialog open={showAddBusDialog} onOpenChange={setShowAddBusDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Bus</DialogTitle>
            <DialogDescription>Register a new bus for transport services</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="busRegistrationNumber">Bus Registration Number *</Label>
              <Input 
                id="busRegistrationNumber" 
                placeholder="e.g., BUS-01, BUS-05" 
                value={busFormData.registrationNumber}
                onChange={(e) => setBusFormData({ ...busFormData, registrationNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="busCapacity">Seating Capacity *</Label>
              <Input 
                id="busCapacity" 
                type="number" 
                placeholder="e.g., 40" 
                min="1"
                value={busFormData.capacity || ''}
                onChange={(e) => setBusFormData({ ...busFormData, capacity: e.target.value ? Number(e.target.value) : 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="busType">Bus Type</Label>
              <Select
                value={busFormData.busType}
                onValueChange={(value: BusTypeEnum) => setBusFormData({ ...busFormData, busType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select bus type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STANDARD">Standard</SelectItem>
                  <SelectItem value="DELUXE">Deluxe</SelectItem>
                  <SelectItem value="LUXURY">Luxury</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="insuranceNumber">Insurance Number</Label>
              <Input 
                id="insuranceNumber" 
                placeholder="e.g., INS-12345" 
                value={busFormData.insuranceNumber}
                onChange={(e) => setBusFormData({ ...busFormData, insuranceNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="insuranceExpiry">Insurance Expiry Date</Label>
              <Input 
                id="insuranceExpiry" 
                type="date"
                value={busFormData.insuranceExpiry}
                onChange={(e) => setBusFormData({ ...busFormData, insuranceExpiry: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastMaintenanceDate">Last Maintenance Date</Label>
              <Input 
                id="lastMaintenanceDate" 
                type="date"
                value={busFormData.lastMaintenanceDate}
                onChange={(e) => setBusFormData({ ...busFormData, lastMaintenanceDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextMaintenanceDate">Next Maintenance Date</Label>
              <Input 
                id="nextMaintenanceDate" 
                type="date"
                value={busFormData.nextMaintenanceDate}
                onChange={(e) => setBusFormData({ ...busFormData, nextMaintenanceDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAddBusDialog(false);
                setBusFormData({
                  registrationNumber: '',
                  capacity: 0,
                  busType: 'STANDARD',
                  insuranceNumber: '',
                  insuranceExpiry: '',
                  lastMaintenanceDate: '',
                  nextMaintenanceDate: '',
                });
              }}
              disabled={submittingBus}
            >
              Cancel
            </Button>
            <Button 
              className="bg-[#0A66C2] hover:bg-[#0052A3]" 
              onClick={handleAddBus}
              disabled={submittingBus}
            >
              {submittingBus ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Bus'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Driver Dialog */}
      <Dialog open={showAddDriverDialog} onOpenChange={setShowAddDriverDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Driver</DialogTitle>
            <DialogDescription>Register a new driver for transport services</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="driverName">Driver Name *</Label>
              <Input 
                id="driverName" 
                placeholder="e.g., John Smith" 
                value={driverFormData.name}
                onChange={(e) => setDriverFormData({ ...driverFormData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">License Number *</Label>
              <Input 
                id="licenseNumber" 
                placeholder="e.g., DL-12345" 
                value={driverFormData.licenseNumber}
                onChange={(e) => setDriverFormData({ ...driverFormData, licenseNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="driverPhone">Phone Number</Label>
              <Input 
                id="driverPhone" 
                type="tel"
                placeholder="e.g., +91 9876543210" 
                value={driverFormData.phone}
                onChange={(e) => setDriverFormData({ ...driverFormData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="driverEmail">Email</Label>
              <Input 
                id="driverEmail" 
                type="email"
                placeholder="e.g., driver@example.com" 
                value={driverFormData.email}
                onChange={(e) => setDriverFormData({ ...driverFormData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="driverAddress">Address</Label>
              <Input 
                id="driverAddress" 
                placeholder="e.g., 123 Main Street, City" 
                value={driverFormData.address}
                onChange={(e) => setDriverFormData({ ...driverFormData, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experienceYears">Experience (Years)</Label>
              <Input 
                id="experienceYears" 
                type="number" 
                placeholder="e.g., 5" 
                min="0"
                value={driverFormData.experienceYears || ''}
                onChange={(e) => setDriverFormData({ ...driverFormData, experienceYears: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAddDriverDialog(false);
                setDriverFormData({
                  name: '',
                  licenseNumber: '',
                  phone: '',
                  email: '',
                  address: '',
                  experienceYears: undefined,
                });
              }}
              disabled={submittingDriver}
            >
              Cancel
            </Button>
            <Button 
              className="bg-[#0A66C2] hover:bg-[#0052A3]" 
              onClick={handleAddDriver}
              disabled={submittingDriver}
            >
              {submittingDriver ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Driver'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Route Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Route Details</DialogTitle>
            <DialogDescription>View complete information about the route</DialogDescription>
          </DialogHeader>
          {selectedRoute && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Route Name</Label>
                  <p className="text-base text-gray-900 dark:text-white">{selectedRoute.routeName}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <Badge 
                    variant={selectedRoute.status === 'ACTIVE' ? 'default' : 'secondary'}
                    className={selectedRoute.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}
                  >
                    {selectedRoute.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Bus Number</Label>
                  <p className="text-base text-gray-900 dark:text-white">
                    {selectedRoute.bus?.registrationNumber || 
                     buses.find(b => b.id === selectedRoute.busId)?.registrationNumber || 
                     'N/A'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Driver Name</Label>
                  <p className="text-base text-gray-900 dark:text-white">
                    {selectedRoute.driver?.name || 
                     drivers.find(d => d.id === selectedRoute.driverId)?.name || 
                     'N/A'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Monthly Fee</Label>
                  <p className="text-base text-gray-900 dark:text-white">
                    {selectedRoute.monthlyFee ? `PKR ${selectedRoute.monthlyFee}` : 'N/A'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Yearly Fee</Label>
                  <p className="text-base text-gray-900 dark:text-white">
                    {selectedRoute.yearlyFee ? `PKR ${selectedRoute.yearlyFee}` : 'N/A'}
                  </p>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-sm font-medium text-gray-500">Number of Stops</Label>
                  <p className="text-base text-gray-900 dark:text-white">{selectedRoute.stops?.length || 0}</p>
                </div>
              </div>
              {selectedRoute.stops && selectedRoute.stops.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Route Stops</Label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedRoute.stops.map((stop, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <p className="font-medium text-gray-900 dark:text-white">{stop.stopName}</p>
                        {stop.stopAddress && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{stop.stopAddress}</p>
                        )}
                        <div className="flex gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                          {stop.pickupTime && <span>Pickup: {stop.pickupTime}</span>}
                          {stop.dropTime && <span>Drop: {stop.dropTime}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Route Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Route</DialogTitle>
            <DialogDescription>Update route information</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="editRouteName">Route Name *</Label>
              <Input 
                id="editRouteName" 
                placeholder="e.g., Route A - North" 
                value={formData.routeName}
                onChange={(e) => setFormData({ ...formData, routeName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editBusId">Bus Registration Number *</Label>
              <Select 
                value={formData.busId} 
                onValueChange={(value) => setFormData({ ...formData, busId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select bus" />
                </SelectTrigger>
                <SelectContent>
                  {buses.length === 0 ? (
                    <div className="py-2 text-center text-sm text-gray-500">No buses available</div>
                  ) : (
                    buses.map((bus) => {
                      const isAssigned = routes.some(
                        (r) => r.id !== selectedRoute?.id && (r.busId === bus.id || r.bus?.id === bus.id)
                      );
                      return (
                        <SelectItem 
                          key={bus.id} 
                          value={bus.id}
                          disabled={isAssigned}
                          className={isAssigned ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                          {bus.registrationNumber} (Capacity: {bus.capacity}) {isAssigned ? '(Assigned)' : ''}
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDriverId">Driver Name *</Label>
              <Select 
                value={formData.driverId} 
                onValueChange={(value) => setFormData({ ...formData, driverId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.length === 0 ? (
                    <div className="py-2 text-center text-sm text-gray-500">No drivers available</div>
                  ) : (
                    drivers.map((driver) => {
                      const isAssigned = routes.some(
                        (r) => r.id !== selectedRoute?.id && (r.driverId === driver.id || r.driver?.id === driver.id)
                      );
                      return (
                        <SelectItem 
                          key={driver.id} 
                          value={driver.id}
                          disabled={isAssigned}
                          className={isAssigned ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                          {driver.name} ({driver.licenseNumber}) {isAssigned ? '(Assigned)' : ''}
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editMonthlyFee">Monthly Fee</Label>
              <Input 
                id="editMonthlyFee" 
                type="number" 
                placeholder="e.g., 2000" 
                value={formData.monthlyFee || ''}
                onChange={(e) => setFormData({ ...formData, monthlyFee: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editYearlyFee">Yearly Fee</Label>
              <Input 
                id="editYearlyFee" 
                type="number" 
                placeholder="e.g., 20000" 
                value={formData.yearlyFee || ''}
                onChange={(e) => setFormData({ ...formData, yearlyFee: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="editStatus">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'ACTIVE' | 'INACTIVE') => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowEditDialog(false);
                setSelectedRoute(null);
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              className="bg-[#0A66C2] hover:bg-[#0052A3]" 
              onClick={async () => {
                if (!selectedRoute) return;
                try {
                  if (!formData.routeName || !formData.busId || !formData.driverId) {
                    toast.error('Please fill in all required fields');
                    return;
                  }
                  setSubmitting(true);
                  
                  const updateRequest: Partial<CreateTransportRouteRequest> = {
                    routeName: formData.routeName,
                    busId: formData.busId,
                    driverId: formData.driverId,
                    status: formData.status,
                    monthlyFee: formData.monthlyFee,
                    yearlyFee: formData.yearlyFee,
                  };
                  
                  await adminService.updateTransportRoute(selectedRoute.id, updateRequest);
                  
                  toast.success('Route Updated', {
                    description: 'Route has been updated successfully',
                  });
                  
                  setShowEditDialog(false);
                  setSelectedRoute(null);
                  
                  // Reset form
                  setFormData({
                    routeName: '',
                    busId: '',
                    driverId: '',
                    status: 'ACTIVE',
                    monthlyFee: undefined,
                    yearlyFee: undefined,
                    stops: [],
                  });
                  
                  // Refresh data
                  await fetchTransportData();
                } catch (error: any) {
                  console.error('Error updating route:', error);
                  toast.error('Failed to update route', {
                    description: error.message || 'Please try again later',
                  });
                } finally {
                  setSubmitting(false);
                }
              }}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Route'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}