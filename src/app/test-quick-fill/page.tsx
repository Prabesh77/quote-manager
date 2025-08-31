'use client';

import React, { useState } from 'react';
import QuickFillInput from '../../components/ui/QuickFillInput';

export default function TestQuickFillPage() {
  const [notes, setNotes] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Quick Fill Notes Demo
          </h1>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                How to Use:
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Click on the input field below to open the quick fill options</li>
                <li>Select from 5 different categories: Location, Available In, Brands, Info, and ETA</li>
                <li>Click any option to auto-fill the input field</li>
                <li>Press Escape or click outside to close the popup</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Quick Fill Categories:
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <strong className="text-blue-600">Location:</strong> Sydney, Melbourne, Perth, Brisbane, QLD, VIC, WA, East Coast
                </div>
                <div>
                  <strong className="text-green-600">Available In:</strong> Same locations with "AVAILABLE IN" prefix
                </div>
                <div>
                  <strong className="text-purple-600">Brands:</strong> Genuine, Zilax, Koyo, Cryomax, Mahle, Delphi, Denso
                </div>
                <div>
                  <strong className="text-orange-600">Info:</strong> Stock Arriving, On Backorder
                </div>
                <div className="md:col-span-2">
                  <strong className="text-red-600">ETA:</strong> 3 Days, 4 Days, 5 Days, 1 Week, 2 Weeks, 3 Weeks, 4 Weeks, 8 Weeks, 1 Month, 2 Months
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Try It Out:
              </h2>
              <QuickFillInput
                value={notes}
                onChange={setNotes}
                placeholder="Click here to see quick fill options..."
                label="Notes"
                className="w-full"
              />
              
              {notes && (
                <div className="mt-3 p-3 bg-gray-100 rounded-md">
                  <strong className="text-gray-700">Current Notes:</strong>
                  <p className="text-gray-600 mt-1">{notes}</p>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Expected Output Examples:
              </h2>
              <div className="space-y-2 text-sm text-gray-600">
                <div><strong>Location:</strong> LOCATION SYDNEY</div>
                <div><strong>Available In:</strong> AVAILABLE IN MELBOURNE</div>
                <div><strong>Brands:</strong> GENUINE</div>
                <div><strong>Info:</strong> STOCK ARRIVING</div>
                <div><strong>ETA:</strong> ETA 3 DAYS</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
