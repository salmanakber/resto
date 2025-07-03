"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { initializeSocket, disconnectSocket } from "@/lib/socket-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Users, Plus, Trash2, CheckCircle, XCircle, Clock, BarChart3, Utensils } from "lucide-react"

interface Table {
  id: string
  number: number
  status: string
  capacity: number
  qrCode: string | null
  isActive: boolean
}

export default function TablesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tables, setTables] = useState<Table[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [socket, setSocket] = useState<any>(null)
  const [formData, setFormData] = useState({
    number: "",
    capacity: "4",
  })



  const fetchTables = async () => {
    try {
      const response = await fetch("/api/restaurant/tables")
      if (!response.ok) throw new Error("Failed to fetch tables")
      const data = await response.json()
      setTables((prevTables) => {
        const hasChanges = JSON.stringify(prevTables) !== JSON.stringify(data)
        if (hasChanges) {
          return data
        }
        return prevTables
      })
    } catch (error) {
      console.error("Error fetching tables:", error)
      toast.error("Failed to load tables")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTables()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
  
    try {
      const response = await fetch("/api/restaurant/tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number: parseInt(formData.number, 10),
          capacity: parseInt(formData.capacity, 10),
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
  
        if (response.status === 400) {
          toast.error("Table already exists");
        } else {
          toast.error(errorData.message || "Failed to create table");
        }
        return;
      }
  
      await response.json(); // You can use this if you want to display `newTable.number`, etc.
      setFormData({ number: "", capacity: "4" });
      fetchTables();
      toast.success("Table created successfully")
    } catch (error) {
      console.error("Error creating table:", error);
      toast.error("Failed to create table")
    } finally {
      setIsCreating(false);
    }
  };
  

  const handleDelete = async (tableId: string) => {
    if (!confirm("Are you sure you want to delete this table?")) return

    try {
      const response = await fetch(`/api/restaurant/tables/${tableId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete table")

      fetchTables()

      toast({
        title: "Success",
        description: "Table deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting table:", error)
      toast({
        title: "Error",
        description: "Failed to delete table",
        variant: "destructive",
      })
    }
  }

  const handleStatusChange = async (tableId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/restaurant/tables/${tableId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error("Failed to update table status")

      const updatedTable = await response.json()
      fetchTables()
    } catch (error) {
      console.error("Error updating table status:", error)
      toast({
        title: "Error",
        description: "Failed to update table status",
        variant: "destructive",
      })
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "available":
        return {
          color: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: CheckCircle,
          gradient: "from-emerald-500 to-green-600",
        }
      case "occupied":
        return {
          color: "bg-rose-50 text-rose-700 border-rose-200",
          icon: XCircle,
          gradient: "from-rose-500 to-red-600",
        }
      case "reserved":
        return {
          color: "bg-amber-50 text-amber-700 border-amber-200",
          icon: Clock,
          gradient: "from-amber-500 to-orange-600",
        }
      default:
        return {
          color: "bg-gray-50 text-gray-700 border-gray-200",
          icon: Clock,
          gradient: "from-gray-500 to-gray-600",
        }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center space-y-4 items-center justify-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-rose-200 rounded-full animate-spin"></div>
            <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-rose-600 font-medium text-center">Loading tables...</p>
        </div>
      </div>
    )
  }

  const availableTables = tables.filter((t) => t.status === "available").length
  const occupiedTables = tables.filter((t) => t.status === "occupied").length
  const reservedTables = tables.filter((t) => t.status === "reserved").length

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-rose-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-rose-500 to-red-600 rounded-full mb-4">
            <Utensils className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-red-600 bg-clip-text text-transparent mb-2">
            Table Management
          </h1>
          <p className="text-gray-600 text-lg">Manage your restaurant tables efficiently</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-rose-500 to-red-600 text-white transform hover:scale-105 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-rose-100 text-sm font-medium">Total Tables</p>
                  <p className="text-3xl font-bold">{tables.length}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-rose-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Available</p>
                  <p className="text-3xl font-bold text-emerald-600">{availableTables}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Occupied</p>
                  <p className="text-3xl font-bold text-rose-600">{occupiedTables}</p>
                </div>
                <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-rose-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Reserved</p>
                  <p className="text-3xl font-bold text-amber-600">{reservedTables}</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Table Form */}
        <Card className="border-0 shadow-xl mb-8 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-rose-500 to-red-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Table
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="number" className="text-sm font-medium text-gray-700">
                    Table Number
                  </Label>
                  <Input
                    id="number"
                    type="number"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    className="border-gray-300 focus:border-rose-500 focus:ring-rose-500"
                    placeholder="Enter table number"
                    required
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity" className="text-sm font-medium text-gray-700">
                    Capacity
                  </Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="border-gray-300 focus:border-rose-500 focus:ring-rose-500"
                    placeholder="Enter capacity"
                    required
                    min="1"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={isCreating}
                className="w-full md:w-auto bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-medium px-8 py-2 rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                {isCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Table
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Tables Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tables.map((table) => {
            const statusConfig = getStatusConfig(table.status)
            const StatusIcon = statusConfig.icon

            return (
              <Card
                key={table.id}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden group"
              >
                <div className={`h-2 bg-gradient-to-r ${statusConfig.gradient}`}></div>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-1">Table #{table.number}</h3>
                      <div className="flex items-center text-gray-600 text-sm">
                        <Users className="w-4 h-4 mr-1" />
                        Capacity: {table.capacity}
                      </div>
                    </div>
                    <Badge className={`${statusConfig.color} border font-medium px-3 py-1`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {table.status}
                    </Badge>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-3">
                    <Button
                      onClick={() =>
                        handleStatusChange(table.id, table.status === "available" ? "occupied" : "available")
                      }
                      className={`w-full font-medium transition-all duration-300 ${
                        table.status === "available"
                          ? "bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white"
                          : "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white"
                      }`}
                    >
                      {table.status === "available" ? (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          Mark as Occupied
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark as Available
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={() => handleDelete(table.id)}
                      variant="outline"
                      className="w-full border-gray-300 text-gray-700 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all duration-300"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Table
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {tables.length === 0 && (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Utensils className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Tables Found</h3>
              <p className="text-gray-600 mb-6">Get started by creating your first table</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
