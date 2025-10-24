/**
 * DeliverableDisplay Component
 * Displays workflow deliverable data in a beautiful, structured format
 * Following Carge design system with #003399 brand color
 */

const getIconForKey = (key) => {
  const keyLower = key.toLowerCase();
  
  // Product/Item related
  if (keyLower.includes('product') || keyLower.includes('item')) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    );
  }
  
  // Money/Price related
  if (keyLower.includes('price') || keyLower.includes('amount') || keyLower.includes('payment') || keyLower.includes('currency')) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  
  // Location related
  if (keyLower.includes('address') || keyLower.includes('location') || keyLower.includes('gps') || keyLower.includes('route')) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    );
  }
  
  // Date/Time related
  if (keyLower.includes('date') || keyLower.includes('time') || keyLower.includes('timestamp') || keyLower.includes('validity') || keyLower.includes('deadline')) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  }
  
  // Document/File related
  if (keyLower.includes('document') || keyLower.includes('file') || keyLower.includes('note') || keyLower.includes('invoice') || keyLower.includes('po') || keyLower.includes('hash') || keyLower.includes('proof') || keyLower.includes('fingerprint')) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  }
  
  // Number/Quantity related
  if (keyLower.includes('quantity') || keyLower.includes('weight') || keyLower.includes('dimension')) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
      </svg>
    );
  }
  
  // Transport/Delivery related
  if (keyLower.includes('tracking') || keyLower.includes('vehicle') || keyLower.includes('carrier') || keyLower.includes('transport') || keyLower.includes('delivery')) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
      </svg>
    );
  }
  
  // Status/Verification related
  if (keyLower.includes('verified') || keyLower.includes('available') || keyLower.includes('accepted') || keyLower.includes('status')) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  
  // Instructions/Terms related
  if (keyLower.includes('instruction') || keyLower.includes('terms') || keyLower.includes('condition') || keyLower.includes('special')) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  
  // Photo/Image related
  if (keyLower.includes('photo') || keyLower.includes('image') || keyLower.includes('picture')) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  }
  
  // List/Packing related
  if (keyLower.includes('list') || keyLower.includes('packing')) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    );
  }
  
  // Default icon
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
};

const formatKey = (key) => {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatValue = (value) => {
  if (value === null || value === undefined) {
    return <span className="text-gray-400 italic">Not provided</span>;
  }
  
  if (typeof value === 'boolean') {
    return (
      <span className={`inline-flex items-center gap-1 font-medium ${value ? 'text-green-700' : 'text-gray-500'}`}>
        {value ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Yes
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            No
          </>
        )}
      </span>
    );
  }
  
  if (typeof value === 'string') {
    // Check if it's a hash/CID
    if (value.startsWith('0x') || value.startsWith('baf')) {
      return (
        <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-700 break-all">
          {value}
        </code>
      );
    }
    
    // Check if it looks like a URL
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return (
        <a 
          href={value} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[#003399] hover:underline break-all"
        >
          {value}
        </a>
      );
    }
    
    return <span className="text-gray-800">{value}</span>;
  }
  
  if (typeof value === 'number') {
    return <span className="font-medium text-gray-800">{value.toLocaleString()}</span>;
  }
  
  return <span className="text-gray-800">{String(value)}</span>;
};

const DataField = ({ fieldKey, value, depth = 0 }) => {
  const isNested = typeof value === 'object' && value !== null && !Array.isArray(value);
  const isArray = Array.isArray(value);
  
  if (isNested) {
    return (
      <div className={`${depth > 0 ? 'ml-4 pl-4 border-l-2 border-gray-200' : ''}`}>
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-[#003399]/10 rounded-lg text-[#003399]">
            {getIconForKey(fieldKey)}
          </div>
          <h4 className="font-semibold text-gray-900">{formatKey(fieldKey)}</h4>
        </div>
        <div className="space-y-3 ml-9">
          {Object.entries(value).map(([subKey, subValue]) => (
            <DataField key={subKey} fieldKey={subKey} value={subValue} depth={depth + 1} />
          ))}
        </div>
      </div>
    );
  }
  
  if (isArray) {
    return (
      <div className={`${depth > 0 ? 'ml-4 pl-4 border-l-2 border-gray-200' : ''}`}>
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 bg-[#003399]/10 rounded-lg text-[#003399]">
            {getIconForKey(fieldKey)}
          </div>
          <h4 className="font-semibold text-gray-900">{formatKey(fieldKey)}</h4>
        </div>
        <div className="ml-9 space-y-2">
          {value.map((item, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                {index + 1}
              </span>
              <div className="flex-1 pt-0.5">
                {typeof item === 'object' ? (
                  <div className="space-y-2">
                    {Object.entries(item).map(([subKey, subValue]) => (
                      <DataField key={subKey} fieldKey={subKey} value={subValue} depth={depth + 1} />
                    ))}
                  </div>
                ) : (
                  formatValue(item)
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Simple field
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 p-2 bg-[#003399]/10 rounded-lg text-[#003399]">
        {getIconForKey(fieldKey)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-600 mb-1">{formatKey(fieldKey)}</div>
        <div className="text-sm break-words">{formatValue(value)}</div>
      </div>
    </div>
  );
};

export const DeliverableDisplay = ({ data, title = null }) => {
  if (!data || typeof data !== 'object') {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p>No data to display</p>
      </div>
    );
  }
  
  const entries = Object.entries(data);
  
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Empty data</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {title && (
        <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
          <svg className="w-5 h-5 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      
      <div className="space-y-6">
        {entries.map(([key, value]) => (
          <DataField key={key} fieldKey={key} value={value} />
        ))}
      </div>
    </div>
  );
};

