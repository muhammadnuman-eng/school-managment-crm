import { useState, useEffect } from 'react';
import { Package, Search, Plus, Edit, Trash2, Eye, AlertCircle, Loader2, MoreVertical } from 'lucide-react';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Switch } from '../ui/switch';
import { toast } from 'sonner@2.0.3';
import { adminService } from '../../services';
import { schoolStorage } from '../../utils/storage';
import type {
  InventoryItem,
  InventoryTransaction,
  InventoryCategory,
  Supplier,
  InventoryOverview,
  CreateInventoryItemRequest,
  UpdateInventoryItemRequest,
  CreateInventoryCategoryRequest,
  CreateSupplierRequest,
  ItemStatus,
  TransactionType,
} from '../../types/inventory.types';

export function OfficeInventory() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [showAddSupplierDialog, setShowAddSupplierDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [overview, setOverview] = useState<InventoryOverview | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittingCategory, setSubmittingCategory] = useState(false);
  const [submittingSupplier, setSubmittingSupplier] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [loadingItem, setLoadingItem] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Form state for adding an item
  const [itemFormData, setItemFormData] = useState<Omit<CreateInventoryItemRequest, 'schoolId'>>({
    categoryId: '',
    itemName: '',
    description: '',
    unitOfMeasurement: '',
    quantity: 0,
    minQuantity: undefined,
    location: '',
    purchasePrice: undefined,
    supplierId: undefined,
  });

  // Form state for adding a category
  const [categoryFormData, setCategoryFormData] = useState<Omit<CreateInventoryCategoryRequest, 'schoolId'>>({
    categoryName: '',
    description: '',
  });

  // Form state for adding a supplier
  const [supplierFormData, setSupplierFormData] = useState<Omit<CreateSupplierRequest, 'schoolId'>>({
    supplierName: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
  });

  // Form state for editing an item
  const [editFormData, setEditFormData] = useState<{
    categoryId?: string;
    itemName?: string;
    description?: string;
    unitOfMeasurement?: string;
    quantity?: number;
    minQuantity?: number;
    location?: string;
    purchasePrice?: number;
    supplierId?: string;
    status?: ItemStatus;
  }>({});

  useEffect(() => {
    fetchInventoryData();
  }, []);

  useEffect(() => {
    // Refetch items when filter changes
    if (!loading) {
      fetchItems();
    }
  }, [selectedCategory, selectedStatus]);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const schoolId = schoolStorage.getSchoolId();

      if (!schoolId) {
        toast.error('School ID not found');
        return;
      }

      const [overviewResponse, itemsResponse, transactionsResponse, categoriesResponse, suppliersResponse] = await Promise.all([
        adminService.getInventoryOverview(),
        adminService.getInventoryItems(),
        adminService.getInventoryTransactions(),
        adminService.getInventoryCategories(),
        adminService.getSuppliers(),
      ]);

      setOverview(overviewResponse);
      // Transform items to include categoryName and supplierName from nested objects
      const transformedItems = (itemsResponse.items || []).map((item: any) => ({
        ...item,
        categoryName: item.category?.categoryName || item.categoryName,
        supplierName: item.supplier?.supplierName || item.supplierName,
      }));
      setItems(transformedItems);
      setTransactions(transactionsResponse.transactions || []);
      setCategories(categoriesResponse.categories || []);
      setSuppliers(suppliersResponse.suppliers || []);

      // Set initial category if available
      if (categoriesResponse.categories && categoriesResponse.categories.length > 0) {
        setItemFormData(prev => ({
          ...prev,
          categoryId: categoriesResponse.categories[0].id,
        }));
      }
    } catch (error: any) {
      console.error('Error fetching inventory data:', error);
      toast.error('Failed to load inventory data', {
        description: error.message || 'Please try again later',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const categoryId = selectedCategory === 'all' ? undefined : selectedCategory;
      const status = selectedStatus === 'all' ? undefined : selectedStatus as ItemStatus;
      const response = await adminService.getInventoryItems(categoryId, status);
      // Transform items to include categoryName and supplierName from nested objects
      const transformedItems = (response.items || []).map((item: any) => ({
        ...item,
        categoryName: item.category?.categoryName || item.categoryName,
        supplierName: item.supplier?.supplierName || item.supplierName,
      }));
      setItems(transformedItems);
    } catch (error: any) {
      console.error('Error fetching items:', error);
      toast.error('Failed to load items', {
        description: error.message || 'Please try again later',
      });
    }
  };

  const handleAddItem = async () => {
    if (!itemFormData.itemName || !itemFormData.categoryId || !itemFormData.unitOfMeasurement) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const schoolId = schoolStorage.getSchoolId();

      if (!schoolId) {
        toast.error('School ID not found');
        return;
      }

      await adminService.createInventoryItem({
        schoolId,
        ...itemFormData,
        quantity: Number(itemFormData.quantity),
        minQuantity: itemFormData.minQuantity ? Number(itemFormData.minQuantity) : undefined,
        purchasePrice: itemFormData.purchasePrice ? Number(itemFormData.purchasePrice) : undefined,
      });

      toast.success('Item added successfully');
      setShowAddDialog(false);
      await fetchInventoryData();
      // Reset form after data is fetched - use first category if available, otherwise empty string (will be handled by Select)
      const firstCategoryId = categories.length > 0 ? categories[0].id : '';
      setItemFormData({
        categoryId: firstCategoryId,
        itemName: '',
        description: '',
        unitOfMeasurement: '',
        quantity: 0,
        minQuantity: undefined,
        location: '',
        purchasePrice: undefined,
        supplierId: undefined,
      });
    } catch (error: any) {
      console.error('Error adding item:', error);
      toast.error('Failed to add item', {
        description: error.message || 'Please try again later',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCategory = async () => {
    if (!categoryFormData.categoryName) {
      toast.error('Category name is required');
      return;
    }

    try {
      setSubmittingCategory(true);
      const schoolId = schoolStorage.getSchoolId();

      if (!schoolId) {
        toast.error('School ID not found');
        return;
      }

      await adminService.createInventoryCategory({
        schoolId,
        ...categoryFormData,
      });

      toast.success('Category added successfully');
      setShowAddCategoryDialog(false);
      setCategoryFormData({
        categoryName: '',
        description: '',
      });
      await fetchInventoryData();
    } catch (error: any) {
      console.error('Error adding category:', error);
      toast.error('Failed to add category', {
        description: error.message || 'Please try again later',
      });
    } finally {
      setSubmittingCategory(false);
    }
  };

  const handleAddSupplier = async () => {
    if (!supplierFormData.supplierName) {
      toast.error('Supplier name is required');
      return;
    }

    try {
      setSubmittingSupplier(true);
      const schoolId = schoolStorage.getSchoolId();

      if (!schoolId) {
        toast.error('School ID not found');
        return;
      }

      await adminService.createSupplier({
        schoolId,
        ...supplierFormData,
      });

      toast.success('Supplier added successfully');
      setShowAddSupplierDialog(false);
      setSupplierFormData({
        supplierName: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
      });
      await fetchInventoryData();
    } catch (error: any) {
      console.error('Error adding supplier:', error);
      toast.error('Failed to add supplier', {
        description: error.message || 'Please try again later',
      });
    } finally {
      setSubmittingSupplier(false);
    }
  };

  const handleViewItem = async (itemId: string) => {
    try {
      setLoadingItem(true);
      const response = await adminService.getInventoryItemById(itemId);
      const item = response.data as any;
      // Transform item to include categoryName and supplierName from nested objects
      const transformedItem = {
        ...item,
        categoryName: item.category?.categoryName || item.categoryName,
        supplierName: item.supplier?.supplierName || item.supplierName,
      };
      setSelectedItem(transformedItem);
      setShowViewDialog(true);
    } catch (error: any) {
      console.error('Error fetching item:', error);
      toast.error('Failed to load item details', {
        description: error.message || 'Please try again later',
      });
    } finally {
      setLoadingItem(false);
    }
  };

  const handleEditItem = async (itemId: string) => {
    try {
      setLoadingItem(true);
      const response = await adminService.getInventoryItemById(itemId);
      const item = response.data as any;
      // Transform item to include categoryName and supplierName from nested objects
      const transformedItem = {
        ...item,
        categoryName: item.category?.categoryName || item.categoryName,
        supplierName: item.supplier?.supplierName || item.supplierName,
      };
      setSelectedItem(transformedItem);
      
      // Populate edit form with item data
      setEditFormData({
        categoryId: transformedItem.categoryId,
        itemName: transformedItem.itemName,
        description: transformedItem.description || '',
        unitOfMeasurement: transformedItem.unitOfMeasurement,
        quantity: transformedItem.quantity,
        minQuantity: transformedItem.minQuantity,
        location: transformedItem.location || '',
        purchasePrice: transformedItem.purchasePrice,
        supplierId: transformedItem.supplierId,
        status: transformedItem.status,
      });
      
      setShowEditDialog(true);
    } catch (error: any) {
      console.error('Error fetching item:', error);
      toast.error('Failed to load item details', {
        description: error.message || 'Please try again later',
      });
    } finally {
      setLoadingItem(false);
    }
  };

  const handleUpdateItem = async () => {
    if (!selectedItem) return;

    if (!editFormData.itemName || !editFormData.categoryId || !editFormData.unitOfMeasurement) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmittingEdit(true);
      await adminService.updateInventoryItem(selectedItem.id, {
        ...editFormData,
        quantity: editFormData.quantity ? Number(editFormData.quantity) : undefined,
        minQuantity: editFormData.minQuantity ? Number(editFormData.minQuantity) : undefined,
        purchasePrice: editFormData.purchasePrice ? Number(editFormData.purchasePrice) : undefined,
      });

      toast.success('Item updated successfully');
      setShowEditDialog(false);
      setSelectedItem(null);
      setEditFormData({});
      await fetchInventoryData();
    } catch (error: any) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item', {
        description: error.message || 'Please try again later',
      });
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Handle Delete Item
  const handleDeleteItem = async (item: InventoryItem) => {
    if (!confirm(`Are you sure you want to delete item "${item.itemName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(true);
      await adminService.deleteInventoryItem(item.id);
      toast.success('Item Deleted', {
        description: `Item "${item.itemName}" has been deleted successfully`,
      });
      
      // Remove from local state
      setItems(items.filter(i => i.id !== item.id));
      
      // Refresh overview
      const overviewResponse = await adminService.getInventoryOverview();
      setOverview(overviewResponse);
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item', {
        description: error.message || 'Please try again later',
      });
    } finally {
      setDeleting(false);
    }
  };

  // Handle Status Toggle
  const handleStatusToggle = async (item: InventoryItem) => {
    try {
      const currentStatus = item.status || 'AVAILABLE';
      // Toggle between AVAILABLE and OUT_OF_STOCK
      const newStatus: ItemStatus = (currentStatus === 'AVAILABLE' || currentStatus === 'IN_STOCK') ? 'OUT_OF_STOCK' : 'AVAILABLE';
      
      await adminService.updateInventoryItem(item.id, { status: newStatus });
      toast.success('Status Updated', {
        description: `Item status updated to ${newStatus}`,
      });
      
      // Update local state
      setItems(items.map(i => 
        i.id === item.id ? { ...i, status: newStatus } : i
      ));
      
      // Refresh overview
      const overviewResponse = await adminService.getInventoryOverview();
      setOverview(overviewResponse);
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status', {
        description: error.message || 'Please try again later',
      });
    }
  };

  // Filter items based on search query
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.categoryName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Map status for display
  const getStatusDisplay = (status?: ItemStatus) => {
    if (!status) return 'N/A';
    switch (status) {
      case 'AVAILABLE':
      case 'IN_STOCK':
        return 'In Stock';
      case 'LOW_STOCK':
        return 'Low Stock';
      case 'OUT_OF_STOCK':
        return 'Out of Stock';
      default:
        return status;
    }
  };

  // Map transaction type for display
  const getTransactionTypeDisplay = (type: TransactionType) => {
    switch (type) {
      case 'IN':
        return 'Received';
      case 'OUT':
        return 'Issued';
      case 'TRANSFER':
        return 'Transfer';
      case 'ADJUSTMENT':
        return 'Adjustment';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-white mb-2">Office Inventory</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage office supplies, equipment, and inventory tracking</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddCategoryDialog(true)} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
          <Button onClick={() => setShowAddSupplierDialog(true)} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Supplier
          </Button>
          <Button onClick={() => setShowAddDialog(true)} className="bg-[#0A66C2] hover:bg-[#0052A3]">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Items</p>
              <p className="text-3xl text-gray-900 dark:text-white">{overview?.totalItems || 0}</p>
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
              <p className="text-3xl text-gray-900 dark:text-white">{overview?.inStockItems || 0}</p>
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
              <p className="text-3xl text-gray-900 dark:text-white">{overview?.lowStockItems || 0}</p>
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
              <p className="text-3xl text-gray-900 dark:text-white">{overview?.outOfStockItems || 0}</p>
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
                <Input
                  placeholder="Search by item name, category, or location..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.categoryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="AVAILABLE">In Stock</SelectItem>
                  <SelectItem value="LOW_STOCK">Low Stock</SelectItem>
                  <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
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
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        No items found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => (
                      <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 dark:text-white">{item.itemName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.categoryName || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-300">{item.quantity}</TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-300 text-sm">{item.unitOfMeasurement}</TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-300">{item.location || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={item.status === 'AVAILABLE' || item.status === 'IN_STOCK'}
                              onCheckedChange={() => handleStatusToggle(item)}
                            />
                            <Badge
                              variant="default"
                              className={
                                item.status === 'AVAILABLE' || item.status === 'IN_STOCK'
                                  ? 'bg-green-100 text-green-700'
                                  : item.status === 'LOW_STOCK'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-red-100 text-red-700'
                              }
                            >
                              {getStatusDisplay(item.status)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-300 text-sm">
                          {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewItem(item.id)} disabled={loadingItem}>
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditItem(item.id)} disabled={loadingItem}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600" 
                                onClick={() => handleDeleteItem(item)}
                                disabled={deleting}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
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
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.slice(0, 20).map((transaction) => (
                      <TableRow key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <TableCell className="text-gray-900 dark:text-white">
                          {transaction.itemName || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              transaction.transactionType === 'OUT'
                                ? 'border-red-500 text-red-700'
                                : transaction.transactionType === 'IN'
                                ? 'border-green-500 text-green-700'
                                : 'border-blue-500 text-blue-700'
                            }
                          >
                            {getTransactionTypeDisplay(transaction.transactionType)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-300">{transaction.quantity}</TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-300">
                          {transaction.issuedTo || transaction.receivedFrom || 'N/A'}
                        </TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-300">
                          {new Date(transaction.transactionDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-300">{transaction.purpose || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Item Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
            <DialogDescription>Add a new item to office inventory</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="itemName">Item Name *</Label>
              <Input
                id="itemName"
                placeholder="Enter item name"
                value={itemFormData.itemName}
                onChange={(e) => setItemFormData({ ...itemFormData, itemName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              {categories.length === 0 ? (
                <div className="text-sm text-orange-600 dark:text-orange-400 p-2 border border-orange-200 dark:border-orange-800 rounded">
                  No categories available. Please add a category first.
                </div>
              ) : (
                <Select
                  value={itemFormData.categoryId && itemFormData.categoryId !== '' ? itemFormData.categoryId : undefined}
                  onValueChange={(value) => setItemFormData({ ...itemFormData, categoryId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.categoryName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="0"
                value={itemFormData.quantity}
                onChange={(e) => setItemFormData({ ...itemFormData, quantity: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit of Measurement *</Label>
              <Input
                id="unit"
                placeholder="e.g., Unit, Box, Ream, Kit"
                value={itemFormData.unitOfMeasurement}
                onChange={(e) => setItemFormData({ ...itemFormData, unitOfMeasurement: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Storage Location</Label>
              <Input
                id="location"
                placeholder="Enter location"
                value={itemFormData.location}
                onChange={(e) => setItemFormData({ ...itemFormData, location: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minQuantity">Minimum Quantity</Label>
              <Input
                id="minQuantity"
                type="number"
                placeholder="0"
                value={itemFormData.minQuantity || ''}
                onChange={(e) => setItemFormData({ ...itemFormData, minQuantity: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Enter item description"
                value={itemFormData.description}
                onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price</Label>
              <Input
                id="purchasePrice"
                type="number"
                placeholder="0"
                value={itemFormData.purchasePrice || ''}
                onChange={(e) => setItemFormData({ ...itemFormData, purchasePrice: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              {suppliers.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400 p-2 border border-gray-200 dark:border-gray-800 rounded">
                  No suppliers available. Optional field.
                </div>
              ) : (
                <Select
                  value={itemFormData.supplierId || '__none__'}
                  onValueChange={(value) => {
                    // Handle special "none" value
                    if (value === '__none__') {
                      setItemFormData({ ...itemFormData, supplierId: undefined });
                    } else {
                      setItemFormData({ ...itemFormData, supplierId: value });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.supplierName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              className="bg-[#0A66C2] hover:bg-[#0052A3]"
              onClick={handleAddItem}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Item'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={showAddCategoryDialog} onOpenChange={setShowAddCategoryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>Add a new inventory category</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name *</Label>
              <Input
                id="categoryName"
                placeholder="Enter category name"
                value={categoryFormData.categoryName}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, categoryName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryDescription">Description</Label>
              <Input
                id="categoryDescription"
                placeholder="Enter category description"
                value={categoryFormData.description}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCategoryDialog(false)} disabled={submittingCategory}>
              Cancel
            </Button>
            <Button
              className="bg-[#0A66C2] hover:bg-[#0052A3]"
              onClick={handleAddCategory}
              disabled={submittingCategory}
            >
              {submittingCategory ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Category'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Supplier Dialog */}
      <Dialog open={showAddSupplierDialog} onOpenChange={setShowAddSupplierDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
            <DialogDescription>Add a new supplier</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="supplierName">Supplier Name *</Label>
              <Input
                id="supplierName"
                placeholder="Enter supplier name"
                value={supplierFormData.supplierName}
                onChange={(e) => setSupplierFormData({ ...supplierFormData, supplierName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input
                id="contactPerson"
                placeholder="Enter contact person name"
                value={supplierFormData.contactPerson}
                onChange={(e) => setSupplierFormData({ ...supplierFormData, contactPerson: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="Enter phone number"
                value={supplierFormData.phone}
                onChange={(e) => setSupplierFormData({ ...supplierFormData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={supplierFormData.email}
                onChange={(e) => setSupplierFormData({ ...supplierFormData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Enter address"
                value={supplierFormData.address}
                onChange={(e) => setSupplierFormData({ ...supplierFormData, address: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSupplierDialog(false)} disabled={submittingSupplier}>
              Cancel
            </Button>
            <Button
              className="bg-[#0A66C2] hover:bg-[#0052A3]"
              onClick={handleAddSupplier}
              disabled={submittingSupplier}
            >
              {submittingSupplier ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Supplier'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Item Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Item Details</DialogTitle>
            <DialogDescription>View inventory item details</DialogDescription>
          </DialogHeader>
          {loadingItem ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
            </div>
          ) : selectedItem ? (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Item Name</Label>
                  <p className="text-gray-900 dark:text-white">{selectedItem.itemName}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Category</Label>
                  <p className="text-gray-900 dark:text-white">{selectedItem.categoryName || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Quantity</Label>
                  <p className="text-gray-900 dark:text-white">{selectedItem.quantity}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Unit of Measurement</Label>
                  <p className="text-gray-900 dark:text-white">{selectedItem.unitOfMeasurement}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Minimum Quantity</Label>
                  <p className="text-gray-900 dark:text-white">{selectedItem.minQuantity ?? 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <Badge
                    variant="default"
                    className={
                      selectedItem.status === 'AVAILABLE' || selectedItem.status === 'IN_STOCK'
                        ? 'bg-green-100 text-green-700'
                        : selectedItem.status === 'LOW_STOCK'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-red-100 text-red-700'
                    }
                  >
                    {getStatusDisplay(selectedItem.status)}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Location</Label>
                  <p className="text-gray-900 dark:text-white">{selectedItem.location || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Purchase Price</Label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedItem.purchasePrice ? `PKR ${selectedItem.purchasePrice}` : 'N/A'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Supplier</Label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedItem.supplierName || 'N/A'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Created At</Label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedItem.updatedAt ? new Date(selectedItem.updatedAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
              {selectedItem.description && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Description</Label>
                  <p className="text-gray-900 dark:text-white">{selectedItem.description}</p>
                </div>
              )}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
            <Button
              className="bg-[#0A66C2] hover:bg-[#0052A3]"
              onClick={() => {
                setShowViewDialog(false);
                if (selectedItem) {
                  handleEditItem(selectedItem.id);
                }
              }}
            >
              Edit Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>Update inventory item details</DialogDescription>
          </DialogHeader>
          {loadingItem ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="editItemName">Item Name *</Label>
                <Input
                  id="editItemName"
                  placeholder="Enter item name"
                  value={editFormData.itemName || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, itemName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCategory">Category *</Label>
                {categories.length === 0 ? (
                  <div className="text-sm text-orange-600 dark:text-orange-400 p-2 border border-orange-200 dark:border-orange-800 rounded">
                    No categories available.
                  </div>
                ) : (
                  <Select
                    value={editFormData.categoryId && editFormData.categoryId !== '' ? editFormData.categoryId : undefined}
                    onValueChange={(value) => setEditFormData({ ...editFormData, categoryId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.categoryName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="editQuantity">Quantity *</Label>
                <Input
                  id="editQuantity"
                  type="number"
                  placeholder="0"
                  value={editFormData.quantity || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, quantity: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editUnit">Unit of Measurement *</Label>
                <Input
                  id="editUnit"
                  placeholder="e.g., Unit, Box, Ream, Kit"
                  value={editFormData.unitOfMeasurement || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, unitOfMeasurement: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLocation">Storage Location</Label>
                <Input
                  id="editLocation"
                  placeholder="Enter location"
                  value={editFormData.location || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editMinQuantity">Minimum Quantity</Label>
                <Input
                  id="editMinQuantity"
                  type="number"
                  placeholder="0"
                  value={editFormData.minQuantity || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, minQuantity: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editStatus">Status</Label>
                <Select
                  value={editFormData.status || undefined}
                  onValueChange={(value) => setEditFormData({ ...editFormData, status: value as ItemStatus })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AVAILABLE">In Stock</SelectItem>
                    <SelectItem value="IN_STOCK">In Stock</SelectItem>
                    <SelectItem value="LOW_STOCK">Low Stock</SelectItem>
                    <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="editDescription">Description</Label>
                <Input
                  id="editDescription"
                  placeholder="Enter item description"
                  value={editFormData.description || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPurchasePrice">Purchase Price</Label>
                <Input
                  id="editPurchasePrice"
                  type="number"
                  placeholder="0"
                  value={editFormData.purchasePrice || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, purchasePrice: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editSupplier">Supplier</Label>
                {suppliers.length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400 p-2 border border-gray-200 dark:border-gray-800 rounded">
                    No suppliers available. Optional field.
                  </div>
                ) : (
                  <Select
                    value={editFormData.supplierId || '__none__'}
                    onValueChange={(value) => {
                      if (value === '__none__') {
                        setEditFormData({ ...editFormData, supplierId: undefined });
                      } else {
                        setEditFormData({ ...editFormData, supplierId: value });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.supplierName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={submittingEdit}>
              Cancel
            </Button>
            <Button
              className="bg-[#0A66C2] hover:bg-[#0052A3]"
              onClick={handleUpdateItem}
              disabled={submittingEdit}
            >
              {submittingEdit ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Item'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}