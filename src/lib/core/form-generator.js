/**
 * Form Generator - Generate forms from JSON Schema using React (XSS-safe)
 * Migration from innerHTML to React components for security
 */

import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { DynamicForm } from '../../components/DynamicForm.jsx';

export class FormGenerator {
  static roots = new Map(); // Store React roots for cleanup

  /**
   * Generate form from JSON Schema using React
   * @param {Object} schema - JSON Schema object
   * @param {string} containerId - ID of the container element
   */
  static generateForm(schema, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container ${containerId} not found`);
      return;
    }

    // Clean up existing root if any
    if (this.roots.has(containerId)) {
      this.roots.get(containerId).unmount();
    }

    // Create new React root and render
    const root = createRoot(container);
    root.render(
      createElement(DynamicForm, {
        schema,
        onFileSelect: this.handleFileForCid.bind(this)
      })
    );

    this.roots.set(containerId, root);
  }

  /**
   * Handle file selection for CID calculation
   * @param {string} inputId - ID of the input field
   * @param {File} file - Selected file
   */
  static async handleFileForCid(inputId, file) {
    // TODO: Implement CID calculation from file
    // For now, just log the file selection
    console.log(`File selected for field ${inputId}:`, file.name);
    
    // Future: Calculate IPFS CID from file and populate input
    // const cid = await calculateCID(file);
    // document.getElementById(inputId).value = cid;
  }

  /**
   * Format field name to human-readable label
   */
  static formatLabel(name) {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
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

  /**
   * Cleanup React roots (call when unmounting)
   */
  static cleanup(containerId) {
    if (this.roots.has(containerId)) {
      this.roots.get(containerId).unmount();
      this.roots.delete(containerId);
    }
  }
}
