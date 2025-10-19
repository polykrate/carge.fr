/**
 * DynamicForm - Secure React component for dynamic form generation from JSON Schema
 * Replaces innerHTML-based approach to prevent XSS attacks
 */

import { useState } from 'react';

/**
 * Format field name to human-readable label
 */
const formatLabel = (name) => {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};

/**
 * Check if field is a hash/CID field
 */
const isHashField = (key, prop) => {
  const lowerKey = key.toLowerCase();
  const description = (prop.description || '').toLowerCase();
  
  return lowerKey.includes('hash') || 
         lowerKey.includes('cid') || 
         description.includes('hash') || 
         description.includes('cid') ||
         prop.format === 'hash' ||
         prop.format === 'cid';
};

/**
 * Single form field component
 */
const FormField = ({ fieldName, fieldKey, prop, isRequired, onFileSelect }) => {
  const label = formatLabel(fieldKey);
  const id = `field-${fieldName.replace(/\./g, '-')}`;
  const [selectedFileName, setSelectedFileName] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    
    // Call parent handler to calculate CID
    if (onFileSelect) {
      await onFileSelect(id, file);
    }
  };

  const baseInputClasses = "w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]";
  const monoInputClasses = `${baseInputClasses} font-mono`;

  // Required mark
  const RequiredMark = () => isRequired ? <span className="text-red-500">*</span> : null;

  // Help text
  const HelpText = () => prop.description ? (
    <div className="text-xs text-gray-500 mt-1">{prop.description}</div>
  ) : null;

  // String field (enum = select dropdown)
  if (prop.type === 'string' && prop.enum) {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label} <RequiredMark />
        </label>
        <select
          id={id}
          name={fieldName}
          required={isRequired}
          className={baseInputClasses}
          defaultValue=""
        >
          <option value="">-- Select {label} --</option>
          {prop.enum.map((opt) => (
            <option key={opt} value={opt}>
              {formatLabel(opt)}
            </option>
          ))}
        </select>
        <HelpText />
      </div>
    );
  }

  // Date field
  if (prop.type === 'string' && prop.format === 'date') {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label} <RequiredMark />
        </label>
        <input
          type="date"
          id={id}
          name={fieldName}
          required={isRequired}
          className={baseInputClasses}
        />
        <HelpText />
      </div>
    );
  }

  // Email field
  if (prop.type === 'string' && prop.format === 'email') {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label} <RequiredMark />
        </label>
        <input
          type="email"
          id={id}
          name={fieldName}
          required={isRequired}
          minLength={prop.minLength}
          maxLength={prop.maxLength}
          placeholder={prop.placeholder || ''}
          className={baseInputClasses}
        />
        <HelpText />
      </div>
    );
  }

  // Textarea for long strings
  if (prop.type === 'string' && prop.maxLength && prop.maxLength > 200) {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label} <RequiredMark />
        </label>
        <textarea
          id={id}
          name={fieldName}
          rows={4}
          required={isRequired}
          minLength={prop.minLength}
          maxLength={prop.maxLength}
          placeholder={prop.placeholder || ''}
          className={baseInputClasses}
        />
        <HelpText />
        {prop.maxLength && (
          <div className="text-xs text-gray-400 mt-1">Max {prop.maxLength} characters</div>
        )}
      </div>
    );
  }

  // Hash/CID field with file picker
  if (prop.type === 'string' && isHashField(fieldKey, prop)) {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label} <RequiredMark />
        </label>
        <input
          type="text"
          id={id}
          name={fieldName}
          required={isRequired}
          minLength={prop.minLength}
          maxLength={prop.maxLength}
          pattern={prop.pattern}
          placeholder={prop.placeholder || 'CID or hash'}
          className={monoInputClasses}
        />
        <HelpText />
        <div className="mt-2 flex gap-2 items-center">
          <input
            type="file"
            id={`${id}-file`}
            className="hidden"
            onChange={handleFileChange}
          />
          <label
            htmlFor={`${id}-file`}
            className="cursor-pointer px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition inline-flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Choose File & Calculate CID
          </label>
          {selectedFileName && (
            <span className="text-xs text-gray-500">{selectedFileName}</span>
          )}
        </div>
      </div>
    );
  }

  // Regular string field
  if (prop.type === 'string') {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label} <RequiredMark />
        </label>
        <input
          type="text"
          id={id}
          name={fieldName}
          required={isRequired}
          minLength={prop.minLength}
          maxLength={prop.maxLength}
          pattern={prop.pattern}
          placeholder={prop.placeholder || ''}
          className={monoInputClasses}
        />
        <HelpText />
      </div>
    );
  }

  // Number field
  if (prop.type === 'number' || prop.type === 'integer') {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label} <RequiredMark />
        </label>
        <input
          type="number"
          id={id}
          name={fieldName}
          required={isRequired}
          min={prop.minimum}
          max={prop.maximum}
          step={prop.type === 'integer' ? 1 : undefined}
          className={baseInputClasses}
        />
        <HelpText />
      </div>
    );
  }

  // Boolean field
  if (prop.type === 'boolean') {
    return (
      <div className="mb-4 flex items-center">
        <input
          type="checkbox"
          id={id}
          name={fieldName}
          className="w-4 h-4 text-[#003399] border-gray-300 rounded focus:ring-[#003399]"
        />
        <label className="ml-2 text-sm text-gray-700">
          {label} <RequiredMark />
        </label>
        <HelpText />
      </div>
    );
  }

  // Default fallback
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} <RequiredMark />
      </label>
      <input
        type="text"
        id={id}
        name={fieldName}
        required={isRequired}
        className={baseInputClasses}
      />
      <HelpText />
    </div>
  );
};

/**
 * Recursive form fields renderer
 */
const FormFields = ({ schema, properties, prefix = '', onFileSelect }) => {
  return Object.entries(properties).map(([key, prop]) => {
    const fieldName = prefix ? `${prefix}.${key}` : key;
    const isRequired = schema.required?.includes(key) || false;

    // Nested object
    if (prop.type === 'object' && prop.properties) {
      return (
        <div
          key={fieldName}
          className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4"
        >
          <div className="font-medium text-[#003399] mb-2">
            {formatLabel(key)}
            {isRequired && <span className="text-red-500"> *</span>}
          </div>
          <FormFields
            schema={prop}
            properties={prop.properties}
            prefix={fieldName}
            onFileSelect={onFileSelect}
          />
        </div>
      );
    }

    // Regular field
    return (
      <FormField
        key={fieldName}
        fieldName={fieldName}
        fieldKey={key}
        prop={prop}
        isRequired={isRequired}
        onFileSelect={onFileSelect}
      />
    );
  });
};

/**
 * Main DynamicForm component
 */
export const DynamicForm = ({ schema, onFileSelect }) => {
  if (!schema || !schema.properties) {
    return <div className="text-red-500">Invalid schema</div>;
  }

  return (
    <div className="space-y-4">
      <FormFields
        schema={schema}
        properties={schema.properties}
        onFileSelect={onFileSelect}
      />
    </div>
  );
};

