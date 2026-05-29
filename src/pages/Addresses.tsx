import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Plus, Star, Trash2, Check, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  useUserAddresses,
  useAddAddress,
  useUpdateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
  UserAddress,
} from '@/hooks/useUserAddresses';
import BottomNavigation from '@/components/BottomNavigation';

const emptyForm = {
  first_name: '',
  last_name: '',
  phone: '',
  address: '',
  city: '',
  county: '',
  country: 'Kenya',
  is_default: false,
};

const Addresses = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const { data: addresses = [], isLoading } = useUserAddresses();
  const addAddress = useAddAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();
  const setDefault = useSetDefaultAddress();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [addressToDelete, setAddressToDelete] = useState<UserAddress | null>(null);

  React.useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  const handleField = (field: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setSheetOpen(true); };
  const openEdit = (addr: UserAddress) => {
    setEditingId(addr.id);
    setForm({
      first_name: addr.first_name,
      last_name: addr.last_name,
      phone: addr.phone,
      address: addr.address,
      city: addr.city,
      county: addr.county,
      country: addr.country,
      is_default: addr.is_default,
    });
    setSheetOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.phone || !form.address || !form.city || !form.county) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    try {
      if (editingId) {
        await updateAddress.mutateAsync({ id: editingId, ...form });
        toast({ title: 'Address updated' });
      } else {
        await addAddress.mutateAsync(form);
        toast({ title: 'Address saved' });
      }
      setSheetOpen(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch {
      toast({ title: 'Failed to save address', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!addressToDelete) return;
    try {
      await deleteAddress.mutateAsync(addressToDelete.id);
      toast({ title: 'Address deleted' });
    } catch {
      toast({ title: 'Failed to delete address', variant: 'destructive' });
    } finally {
      setAddressToDelete(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefault.mutateAsync(id);
      toast({ title: 'Default address updated' });
    } catch {
      toast({ title: 'Failed to update default', variant: 'destructive' });
    }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <button onClick={() => navigate('/profile')} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-xl">Addresses</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-3">
        {/* Add new address button */}
        <button
          onClick={openAdd}
          className="w-full flex items-center gap-3 p-4 border border-dashed border-border rounded-none hover:border-foreground/40 hover:bg-secondary/30 transition-colors group"
        >
          <Plus className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
          <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
            Add new address
          </span>
        </button>

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-8 text-sm text-muted-foreground">Loading…</div>
        )}

        {/* Empty state */}
        {!isLoading && addresses.length === 0 && (
          <div className="text-center py-12 space-y-2">
            <MapPin className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No saved addresses yet</p>
          </div>
        )}

        {/* Address cards */}
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className={`border rounded-none p-4 space-y-1 ${addr.is_default ? 'border-foreground' : 'border-border'}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{addr.first_name} {addr.last_name}</p>
                  {addr.is_default && (
                    <span className="text-[10px] uppercase tracking-wider font-semibold bg-foreground text-background px-1.5 py-0.5">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{addr.phone}</p>
                <p className="text-xs text-muted-foreground">{addr.address}</p>
                <p className="text-xs text-muted-foreground">{addr.city}, {addr.county}</p>
                <p className="text-xs text-muted-foreground">{addr.country}</p>
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0">
                {!addr.is_default && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    title="Set as default"
                    className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                )}
                {addr.is_default && (
                  <span className="p-1.5 text-foreground">
                    <Check className="w-4 h-4" />
                  </span>
                )}
                <button
                  onClick={() => openEdit(addr)}
                  title="Edit"
                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setAddressToDelete(addr)}
                  title="Delete"
                  className="p-1.5 text-muted-foreground hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* Add address sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>{editingId ? 'Edit address' : 'New address'}</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs uppercase tracking-wider">First name *</Label>
                <Input
                  className="mt-1 rounded-none h-10"
                  value={form.first_name}
                  onChange={e => handleField('first_name', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider">Last name *</Label>
                <Input
                  className="mt-1 rounded-none h-10"
                  value={form.last_name}
                  onChange={e => handleField('last_name', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider">Phone *</Label>
              <Input
                className="mt-1 rounded-none h-10"
                type="tel"
                placeholder="07XXXXXXXX"
                value={form.phone}
                onChange={e => handleField('phone', e.target.value)}
                required
              />
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider">Street address *</Label>
              <Input
                className="mt-1 rounded-none h-10"
                placeholder="House / apartment / street"
                value={form.address}
                onChange={e => handleField('address', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs uppercase tracking-wider">City *</Label>
                <Input
                  className="mt-1 rounded-none h-10"
                  value={form.city}
                  onChange={e => handleField('city', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider">County *</Label>
                <Input
                  className="mt-1 rounded-none h-10"
                  value={form.county}
                  onChange={e => handleField('county', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider">Country</Label>
              <Input
                className="mt-1 rounded-none h-10"
                value={form.country}
                onChange={e => handleField('country', e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="is_default"
                checked={form.is_default}
                onChange={e => handleField('is_default', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="is_default" className="text-sm cursor-pointer">Set as default address</Label>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-foreground text-background hover:bg-foreground/90 rounded-none text-xs uppercase tracking-wider mt-2"
              disabled={addAddress.isPending || updateAddress.isPending}
            >
              {(addAddress.isPending || updateAddress.isPending) ? 'Saving…' : editingId ? 'Update address' : 'Save address'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <AlertDialog open={!!addressToDelete} onOpenChange={open => { if (!open) setAddressToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete address?</AlertDialogTitle>
            <AlertDialogDescription>
              {addressToDelete?.address}, {addressToDelete?.city} will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNavigation />
    </div>
  );
};

export default Addresses;
