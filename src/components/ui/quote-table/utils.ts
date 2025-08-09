import { Quote, Part } from '../useQuotes';
import { QuoteStatus, DeadlineInfo } from './types';

export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
};

export const getVehicleLogo = (make: string) => {
  if (!make) return '/car-logos/toyota.png';
  
  const logoMap: Record<string, string> = {
    'toyota': '/car-logos/toyota.png',
    'honda': '/car-logos/honda.png',
    'mazda': '/car-logos/mazda.png',
    'nissan': '/car-logos/nissan.png',
    'subaru': '/car-logos/subaru.png',
    'mitsubishi': '/car-logos/mitsubisi.png',
    'suzuki': '/car-logos/toyota.png', // fallback
    'hyundai': '/car-logos/hyundai.png',
    'kia': '/car-logos/kia.png',
    'bmw': '/car-logos/bmw.png',
    'mercedes': '/car-logos/mercedes.png',
    'audi': '/car-logos/audi.png',
    'volkswagen': '/car-logos/volkswagen.png',
    'volvo': '/car-logos/volvo.png',
    'ford': '/car-logos/ford.png',
    'chevrolet': '/car-logos/chevrolet.png',
    'jeep': '/car-logos/jeep.png',
    'land rover': '/car-logos/landrover.png',
    'landrover': '/car-logos/landrover.png',
    'jaguar': '/car-logos/jaguar.png',
    'mini': '/car-logos/mini.png',
    'peugeot': '/car-logos/peugeot.png',
    'renault': '/car-logos/renault.png',
    'skoda': '/car-logos/skoda.png',
    'alfa romeo': '/car-logos/alfaromeo.png',
    'mg': '/car-logos/mg.png',
    'lexus': '/car-logos/lexus.png',
    'infiniti': '/car-logos/infiniti.png'
  };
  
  return logoMap[make.toLowerCase()] || '/car-logos/toyota.png';
};

export const getPartIcon = (partName: string): string | null => {
  if (!partName) return null;
  
  const name = partName.toLowerCase();
  if (name.includes('condenser')) return '/part-icons/condenser.png';
  if (name.includes('radiator')) return '/part-icons/radiator.png';
  if (name.includes('intercooler')) return '/part-icons/intercooler.png';
  if (name.includes('fan')) return '/part-icons/fan.png';
  if (name.includes('headlight') && name.includes('left')) return '/part-icons/headlight-left.png';
  if (name.includes('headlight') && name.includes('right')) return '/part-icons/headlight-right.png';
  if (name.includes('sensor')) return '/part-icons/sensor.png';
  
  return null;
};

export const getQuoteStatus = (quoteParts: Part[], quoteStatus?: string): QuoteStatus => {
  if (quoteStatus) {
    return quoteStatus as QuoteStatus;
  }
  
  if (quoteParts.length === 0) return 'unpriced';
  
  const hasPrices = quoteParts.some(part => part.price && part.price > 0);
  const allPriced = quoteParts.every(part => part.price && part.price > 0);
  
  if (!hasPrices) return 'unpriced';
  if (hasPrices && !allPriced) return 'waiting_verification';
  return 'priced';
};

export const getQuoteParts = (partRequested: string, parts: Part[]): Part[] => {
  if (!partRequested) return [];
  
  const partIds = partRequested.split(',').map(id => id.trim()).filter(id => id);
  return partIds.map(id => {
    const part = parts.find(p => p.id === id);
    return part || {
      id,
      name: 'Unknown Part',
      number: 'N/A',
      price: 0,
      note: '',
      createdAt: new Date().toISOString()
    };
  }).filter(Boolean);
};

export const getDeadlineInfo = (requiredBy: string | undefined): DeadlineInfo | null => {
  if (!requiredBy) return null;
  
  const deadline = new Date(requiredBy);
  const now = new Date();
  const diffTime = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const isOverdue = diffDays < 0;
  const isUrgent = diffDays <= 2 && diffDays >= 0;
  
  let color = 'text-gray-600';
  let bgColor = 'bg-gray-100';
  let priority = 0;
  
  if (isOverdue) {
    color = 'text-red-700';
    bgColor = 'bg-red-100';
    priority = 3;
  } else if (isUrgent) {
    color = 'text-orange-700';
    bgColor = 'bg-orange-100';
    priority = 2;
  } else if (diffDays <= 7) {
    color = 'text-yellow-700';
    bgColor = 'bg-yellow-100';
    priority = 1;
  }
  
  return {
    isOverdue,
    isUrgent,
    daysRemaining: diffDays,
    color,
    bgColor,
    priority
  };
};

export const getDeadlinePriority = (quote: Quote): number => {
  const deadlineInfo = getDeadlineInfo(quote.requiredBy);
  return deadlineInfo?.priority || 0;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}; 