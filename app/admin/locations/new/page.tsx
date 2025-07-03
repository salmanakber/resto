'use client'

import { LocationForm } from '../_components/LocationForm'

export default function NewLocationPage() {
  return (
    <div className="space-y-4 bg-white p-4 rounded-lg shadow-md mt-5">
      <h2 className="text-3xl font-bold tracking-tight text-lg">Add New Location</h2>
      <LocationForm />
    </div>
  )
} 