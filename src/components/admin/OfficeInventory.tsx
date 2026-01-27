import { useState } from 'react';
import { Package, Search, Plus, Edit, Trash2, Eye, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner@2.0.3';

const inventoryItems = [
  { id: 1, itemName: 'HP LaserJet Printer', category: 'Electronics', quantity: 8, unit: 'Unit', location: 'Admin Office', status: 'In Stock', lastUpdated: '2024-11-01' },
  { id: 2, itemName: 'A4 Paper (Ream)', category: 'Stationery', quantity: 45, unit: 'Ream', location: 'Supply Room', status: 'In Stock', lastUpdated: '2024-11-05' },
  { id: 3, itemName: 'Whiteboard Markers', category: 'Stationery', quantity: 3, unit: 'Box', location: 'Supply Room', status: 'Low Stock', lastUpdated: '2024-11-06' },
  { id: 4, itemName: 'Office Chairs', category: 'Furniture', quantity: 25, unit: 'Unit', location: 'Classrooms', status: 'In Stock', lastUpdated: '2024-10-20' },
  { id: 5, itemName: 'Cleaning Supplies Kit', category: 'Maintenance', quantity: 0, unit: 'Kit', location: 'Storage', status: 'Out of Stock', lastUpdated: '2024-11-07' },
];

const recentTransactions = [
  { id: 1, itemName: 'A4 Paper (Ream)', type: 'Issued', quantity: 5, issuedTo: 'Ms. Sarah Mitchell', date: '2024-11-05', purpose: 'Science Department' },
  { id: 2, itemName: 'HP LaserJet Printer', type: 'Received', quantity: 2, issuedTo: 'Vendor Supply Co.', date: '2024-11-01', purpose: 'New Purchase' },
  { id: 3, itemName: 'Whiteboard Markers', type: 'Issued', quantity: 2, issuedTo: 'Mr. John Davis', date: '2024-10-28', purpose: 'Math Department' },
];

export function OfficeInventory() {
  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleAddItem = () => {
    toast.success('Item Added', {
      description: 'New item has been added to office inventory',
    });
    setShowAddDialog(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-white mb-2">Office Inventory</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage office supplies, equipment, and inventory tracking</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-[#0A66C2] hover:bg-[#0052A3]">
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Items</p>
              <p className="text-3xl text-gray-900 dark:text-white">342</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Package className="w-6 h-6 text-[#0A66C2]" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">In Stock</p>
              <p className="text-3xl text-gray-900 dark:text-white">298</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <Package className="w-6 h-6 text-[#10B981]" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Low Stock</p>
              <p className="text-3xl text-gray-900 dark:text-white">32</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Out of Stock</p>
              <p className="text-3xl text-gray-900 dark:text-white">12</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="inventory" className="space-y-6">
        <TabsList>
          <TabsTrigger value="inventory">Inventory Items</TabsTrigger>
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Search by item name, category, or location..." className="pl-10" />
              </div>
              <Select>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="stationery">Stationery</SelectItem>
                  <SelectItem value="furniture">Furniture</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800">
                    <TableHead>Item Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900 dark:text-white">{item.itemName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.category}</Badge>
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">{item.quantity}</TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300 text-sm">{item.unit}</TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">{item.location}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="default"
                          className={
                            item.status === 'In Stock' ? 'bg-green-100 text-green-700' :
                            item.status === 'Low Stock' ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300 text-sm">{item.lastUpdated}</TableCell>
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
        </TabsContent>

        <TabsContent value="transactions">
          <Card className="p-6">
            <h2 className="text-lg text-gray-900 dark:text-white mb-4">Recent Transactions</h2>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800">
                    <TableHead>Item Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Issued To / From</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((transaction) => (
                    <TableRow key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell className="text-gray-900 dark:text-white">{transaction.itemName}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={
                            transaction.type === 'Issued' ? 'border-red-500 text-red-700' :
                            'border-green-500 text-green-700'
                          }
                        >
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">{transaction.quantity}</TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">{transaction.issuedTo}</TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">{transaction.date}</TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">{transaction.purpose}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
            <DialogDescription>Add a new item to office inventory</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="itemName">Item Name</Label>
              <Input id="itemName" placeholder="Enter item name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="stationery">Stationery</SelectItem>
                  <SelectItem value="furniture">Furniture</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" type="number" placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unit">Unit</SelectItem>
                  <SelectItem value="box">Box</SelectItem>
                  <SelectItem value="ream">Ream</SelectItem>
                  <SelectItem value="kit">Kit</SelectItem>
                  <SelectItem value="set">Set</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Storage Location</Label>
              <Input id="location" placeholder="Enter location" />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" placeholder="Enter item description" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price (PKR)</Label>
              <Input id="purchasePrice" type="number" placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Input id="supplier" placeholder="Enter supplier name" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button className="bg-[#0A66C2] hover:bg-[#0052A3]" onClick={handleAddItem}>Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
