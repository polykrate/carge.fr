/**
 * Form Generator - Generate HTML forms from JSON Schema
 */

export class FormGenerator {
  /**
   * Generate HTML form from JSON Schema
   * @param {Object} schema - JSON Schema object
   * @param {string} containerId - ID of the container element
   */
  static generateForm(schema, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container ${containerId} not found`);
      return;
    }

    container.innerHTML = '';
    
    if (!schema || !schema.properties) {
      container.innerHTML = '<div class="text-red-500">Invalid schema</div>';
      return;
    }

    const formHtml = this.generateFields(schema, schema.properties, '');
    container.innerHTML = formHtml;
  }

  /**
   * Generate form fields recursively
   * @param {Object} schema - Root schema
   * @param {Object} properties - Properties object
   * @param {string} prefix - Field name prefix for nested objects
   */
  static generateFields(schema, properties, prefix = '') {
    let html = '';
    
    for (const [key, prop] of Object.entries(properties)) {
      const fieldName = prefix ? `${prefix}.${key}` : key;
      const isRequired = schema.required?.includes(key) || false;
      
      if (prop.type === 'object' && prop.properties) {
        // Nested object - create a section
        html += `
          <div class="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4">
            <div class="font-medium text-[#003399] mb-2">${this.formatLabel(key)}${isRequired ? ' *' : ''}</div>
            ${this.generateFields(prop, prop.properties, fieldName)}
          </div>
        `;
      } else {
        html += this.generateField(fieldName, key, prop, isRequired);
      }
    }
    
    return html;
  }

  /**
   * Generate a single form field
   */
  static generateField(fieldName, key, prop, isRequired) {
    const label = this.formatLabel(key);
    const id = `field-${fieldName.replace(/\./g, '-')}`;
    const requiredAttr = isRequired ? 'required' : '';
    const requiredMark = isRequired ? '<span class="text-red-500">*</span>' : '';
    
    let fieldHtml = '';

    // Description/help text
    const helpText = prop.description ? 
      `<div class="text-xs text-gray-500 mt-1">${prop.description}</div>` : '';

    switch (prop.type) {
      case 'string':
        if (prop.enum) {
          // Select dropdown for enums
          fieldHtml = `
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                ${label} ${requiredMark}
              </label>
              <select 
                id="${id}" 
                name="${fieldName}"
                ${requiredAttr}
                class="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]"
              >
                <option value="">-- Select ${label} --</option>
                ${prop.enum.map(opt => `<option value="${opt}">${this.formatLabel(opt)}</option>`).join('')}
              </select>
              ${helpText}
            </div>
          `;
        } else if (prop.format === 'date') {
          // Date input
          fieldHtml = `
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                ${label} ${requiredMark}
              </label>
              <input 
                type="date" 
                id="${id}" 
                name="${fieldName}"
                ${requiredAttr}
                class="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]"
              />
              ${helpText}
            </div>
          `;
        } else if (prop.format === 'email') {
          // Email input
          fieldHtml = `
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                ${label} ${requiredMark}
              </label>
              <input 
                type="email" 
                id="${id}" 
                name="${fieldName}"
                ${requiredAttr}
                ${prop.minLength ? `minlength="${prop.minLength}"` : ''}
                ${prop.maxLength ? `maxlength="${prop.maxLength}"` : ''}
                placeholder="${prop.placeholder || ''}"
                class="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]"
              />
              ${helpText}
            </div>
          `;
        } else if (prop.maxLength && prop.maxLength > 200) {
          // Textarea for long strings
          fieldHtml = `
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                ${label} ${requiredMark}
              </label>
              <textarea 
                id="${id}" 
                name="${fieldName}"
                rows="4"
                ${requiredAttr}
                ${prop.minLength ? `minlength="${prop.minLength}"` : ''}
                ${prop.maxLength ? `maxlength="${prop.maxLength}"` : ''}
                placeholder="${prop.placeholder || ''}"
                class="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]"
              ></textarea>
              ${helpText}
              ${prop.maxLength ? `<div class="text-xs text-gray-400 mt-1">Max ${prop.maxLength} characters</div>` : ''}
            </div>
          `;
        } else if (this.isHashField(key, prop)) {
          // Hash/CID field with file picker
          fieldHtml = `
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                ${label} ${requiredMark}
              </label>
              <input 
                type="text" 
                id="${id}" 
                name="${fieldName}"
                ${requiredAttr}
                ${prop.minLength ? `minlength="${prop.minLength}"` : ''}
                ${prop.maxLength ? `maxlength="${prop.maxLength}"` : ''}
                ${prop.pattern ? `pattern="${prop.pattern}"` : ''}
                placeholder="${prop.placeholder || 'CID or hash'}"
                class="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#003399]"
              />
              ${helpText}
              <div class="mt-2 flex gap-2">
                <input 
                  type="file" 
                  id="${id}-file" 
                  class="hidden"
                  onchange="handleFileForCid('${id}', this)"
                />
                <label 
                  for="${id}-file"
                  class="cursor-pointer px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition inline-flex items-center gap-1"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Choose File & Calculate CID
                </label>
                <span id="${id}-filename" class="text-xs text-gray-500 flex items-center"></span>
              </div>
            </div>
          `;
        } else {
          // Regular text input
          fieldHtml = `
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                ${label} ${requiredMark}
              </label>
              <input 
                type="text" 
                id="${id}" 
                name="${fieldName}"
                ${requiredAttr}
                ${prop.minLength ? `minlength="${prop.minLength}"` : ''}
                ${prop.maxLength ? `maxlength="${prop.maxLength}"` : ''}
                ${prop.pattern ? `pattern="${prop.pattern}"` : ''}
                placeholder="${prop.placeholder || ''}"
                class="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#003399]"
              />
              ${helpText}
            </div>
          `;
        }
        break;

      case 'number':
      case 'integer':
        fieldHtml = `
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              ${label} ${requiredMark}
            </label>
            <input 
              type="number" 
              id="${id}" 
              name="${fieldName}"
              ${requiredAttr}
              ${prop.minimum !== undefined ? `min="${prop.minimum}"` : ''}
              ${prop.maximum !== undefined ? `max="${prop.maximum}"` : ''}
              ${prop.type === 'integer' ? 'step="1"' : ''}
              class="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]"
            />
            ${helpText}
          </div>
        `;
        break;

      case 'boolean':
        fieldHtml = `
          <div class="mb-4 flex items-center">
            <input 
              type="checkbox" 
              id="${id}" 
              name="${fieldName}"
              class="w-4 h-4 text-[#003399] border-gray-300 rounded focus:ring-[#003399]"
            />
            <label class="ml-2 text-sm text-gray-700">
              ${label} ${requiredMark}
            </label>
            ${helpText}
          </div>
        `;
        break;

      default:
        fieldHtml = `
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              ${label} ${requiredMark}
            </label>
            <input 
              type="text" 
              id="${id}" 
              name="${fieldName}"
              ${requiredAttr}
              class="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]"
            />
            ${helpText}
          </div>
        `;
    }

    return fieldHtml;
  }

  /**
   * Check if field is a hash/CID field
   */
  static isHashField(key, prop) {
    const lowerKey = key.toLowerCase();
    const description = (prop.description || '').toLowerCase();
    
    return lowerKey.includes('hash') || 
           lowerKey.includes('cid') || 
           description.includes('hash') || 
           description.includes('cid') ||
           prop.format === 'hash' ||
           prop.format === 'cid';
  }

  /**
   * Format field name to human-readable label
   */
  static formatLabel(name) {
    return name
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .trim();
  }

  /**
   * Extract form data as JSON object
   */
  static getFormData(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    const formData = {};
    const inputs = container.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
      const name = input.name;
      if (!name) return;

      let value;
      if (input.type === 'checkbox') {
        value = input.checked;
      } else if (input.type === 'number') {
        value = input.value ? parseFloat(input.value) : null;
      } else {
        value = input.value;
      }

      // Handle nested objects (e.g., "work.title" -> {work: {title: "..."}})
      const parts = name.split('.');
      let current = formData;
      
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = {};
        }
        current = current[parts[i]];
      }
      
      current[parts[parts.length - 1]] = value;
    });

    return formData;
  }

  /**
   * Validate form data against JSON Schema
   */
  static validateForm(data, schema) {
    const errors = [];

    // Simple validation - can be extended with a full JSON Schema validator
    if (schema.required) {
      for (const field of schema.required) {
        if (!data[field] || (typeof data[field] === 'object' && Object.keys(data[field]).length === 0)) {
          errors.push(`Field "${field}" is required`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

