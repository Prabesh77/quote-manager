'use client';

import { Car } from 'lucide-react';

interface QuoteVehicleInfoProps {
  make: string;
  model: string;
  series?: string;
  year?: string;
  vin?: string;
  rego?: string;
  auto: boolean;
  body?: string;
  className?: string;
}

export const QuoteVehicleInfo = ({ 
  make, 
  model, 
  series, 
  year, 
  vin, 
  rego, 
  auto, 
  body, 
  className = '' 
}: QuoteVehicleInfoProps) => {
  const getVehicleLogo = (make: string) => {
    const makeLower = make.toLowerCase();
    
    if (makeLower.includes('toyota')) return '/car-logos/toyota.png';
    if (makeLower.includes('honda')) return '/car-logos/honda.png';
    if (makeLower.includes('ford')) return '/car-logos/ford.png';
    if (makeLower.includes('bmw')) return '/car-logos/bmw.png';
    if (makeLower.includes('audi')) return '/car-logos/audi.png';
    if (makeLower.includes('mercedes')) return '/car-logos/mercedes.png';
    if (makeLower.includes('volkswagen')) return '/car-logos/volkswagen.png';
    if (makeLower.includes('nissan')) return '/car-logos/nissan.png';
    if (makeLower.includes('mazda')) return '/car-logos/mazda.png';
    if (makeLower.includes('subaru')) return '/car-logos/subaru.png';
    if (makeLower.includes('hyundai')) return '/car-logos/hyundai.png';
    if (makeLower.includes('kia')) return '/car-logos/kia.png';
    if (makeLower.includes('lexus')) return '/car-logos/lexus.png';
    if (makeLower.includes('volvo')) return '/car-logos/volvo.png';
    if (makeLower.includes('land rover')) return '/car-logos/landrover.png';
    if (makeLower.includes('jaguar')) return '/car-logos/jaguar.png';
    if (makeLower.includes('jeep')) return '/car-logos/jeep.png';
    if (makeLower.includes('mini')) return '/car-logos/mini.png';
    if (makeLower.includes('peugeot')) return '/car-logos/peugeot.png';
    if (makeLower.includes('renault')) return '/car-logos/renault.png';
    if (makeLower.includes('skoda')) return '/car-logos/skoda.png';
    if (makeLower.includes('chevrolet')) return '/car-logos/chevrolet.png';
    if (makeLower.includes('infiniti')) return '/car-logos/infiniti.png';
    if (makeLower.includes('mitsubishi')) return '/car-logos/mitsubisi.png';
    if (makeLower.includes('mg')) return '/car-logos/mg.png';
    if (makeLower.includes('alfa romeo')) return '/car-logos/alfaromeo.png';
    
    return null;
  };

  const logo = getVehicleLogo(make);

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Vehicle Logo */}
      {logo ? (
        <img 
          src={logo} 
          alt={`${make} logo`} 
          className="w-6 h-6 object-contain"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <Car className="w-6 h-6 text-gray-400" />
      )}
      
      {/* Vehicle Details */}
      <div className="flex flex-col">
        <div className="flex items-center space-x-1 text-sm font-medium text-gray-900">
          <span>{make}</span>
          <span>{model}</span>
          {series && <span className="text-gray-600">({series})</span>}
        </div>
        
        <div className="flex items-center space-x-1 text-xs text-gray-600">
          {year && <span>{year}</span>}
          {year && (vin || rego) && <span>•</span>}
          {vin && <span>VIN: {vin}</span>}
          {vin && rego && <span>•</span>}
          {rego && <span>Rego: {rego}</span>}
        </div>
        
        <div className="flex items-center space-x-1 text-xs text-gray-600">
          <span>{auto ? 'Auto' : 'Manual'}</span>
          {body && (
            <>
              <span>•</span>
              <span>{body}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}; 