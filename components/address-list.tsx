import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AddressForm } from "./address-form";
import { toast } from "sonner";
import { MapPin, Plus, Trash2 } from "lucide-react";

interface Address {
  id: string;
  type: "home" | "work" | "other";
  isDefault: boolean;
  streetAddress: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  label?: string;
}

export function AddressList() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const fetchAddresses = async () => {
    try {
      const response = await fetch("/api/addresses");
      if (!response.ok) {
        throw new Error("Failed to fetch addresses");
      }
      const data = await response.json();
      setAddresses(data);
    } catch (error) {
      toast.error("Failed to load addresses");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/addresses/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete address");
      }

      toast.success("Address deleted");
      fetchAddresses();
    } catch (error) {
      toast.error("Failed to delete address");
      console.error(error);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const address = addresses.find(addr => addr.id === id);
      if (!address) return;

      const response = await fetch(`/api/addresses/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...address,
          isDefault: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to set default address");
      }

      toast.success("Default address updated");
      fetchAddresses();
    } catch (error) {
      toast.error("Failed to update default address");
      console.error(error);
    }
  };

  if (isLoading) {
    return <div>Loading addresses...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Saved Addresses</h2>
        <Button onClick={() => setShowAddForm(true)} className="bg-[#e41e3f] hover:bg-[#c01835]">
          <Plus className="h-4 w-4 mr-2" />
          Add New Address
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Address</CardTitle>
            <CardDescription>
              Fill in your address details below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddressForm
              onSuccess={() => {
                setShowAddForm(false);
                fetchAddresses();
              }}
              onCancel={() => setShowAddForm(false)}
            />
          </CardContent>
        </Card>
      )}

      {editingAddress && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Address</CardTitle>
            <CardDescription>
              Update your address details below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddressForm
              initialData={editingAddress}
              onSuccess={() => {
                setEditingAddress(null);
                fetchAddresses();
              }}
              onCancel={() => setEditingAddress(null)}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {addresses.map((address) => (
          <Card key={address.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    {address.label || address.type.charAt(0).toUpperCase() + address.type.slice(1)}
                  </CardTitle>
                  {address.isDefault && (
                    <span className="text-sm text-green-600 font-medium">
                      Default Address
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(address.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                {address.streetAddress}
                {address.apartment && `, ${address.apartment}`}
              </p>
              <p className="text-sm text-gray-600">
                {address.city}, {address.state} {address.postalCode}
              </p>
              <p className="text-sm text-gray-600">{address.country}</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setEditingAddress(address)}
              >
                Edit
              </Button>
              {!address.isDefault && (
                <Button
                  variant="outline"
                  onClick={() => handleSetDefault(address.id)}
                >
                  Set as Default
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {addresses.length === 0 && !showAddForm && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <MapPin className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No addresses saved yet</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setShowAddForm(true)}
            >
              Add Your First Address
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 