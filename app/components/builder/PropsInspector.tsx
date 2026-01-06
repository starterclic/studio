/**
 * Props Inspector - Ultra Premium
 *
 * Right panel for editing selected component props
 * Auto-generates forms from JSON Schema
 */

import { useMemo } from 'react';
import { useBuilderStore, selectSelectedComponent } from '~/lib/stores/builder.store';
import { getComponentBySlug } from '~/lib/components/registry';

export function PropsInspector() {
  const { panelState, togglePanel, updateComponent } = useBuilderStore();
  const selectedComponent = useBuilderStore(selectSelectedComponent);

  const componentDef = useMemo(() => {
    if (!selectedComponent) return null;
    return getComponentBySlug(selectedComponent.type);
  }, [selectedComponent]);

  if (!panelState.inspector) {
    return null;
  }

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Inspector</h2>
          <button
            onClick={() => togglePanel('inspector')}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!selectedComponent ? (
          // Empty State
          <div className="flex items-center justify-center h-full p-8">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                No Selection
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Select a component to edit its properties
              </p>
            </div>
          </div>
        ) : (
          // Selected Component
          <div className="p-4 space-y-6">
            {/* Component Info */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg p-4 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-lg">
                  {componentDef?.name[0] || '?'}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{componentDef?.name || selectedComponent.type}</h3>
                  <p className="text-sm text-white/80">{componentDef?.description || 'Component'}</p>
                </div>
              </div>
              {componentDef?.isPremium && (
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-yellow-400 text-yellow-900 text-xs font-bold">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  PREMIUM
                </div>
              )}
            </div>

            {/* Props Form */}
            {componentDef && componentDef.propsSchema && (
              <PropsForm
                schema={componentDef.propsSchema}
                values={selectedComponent.props}
                onChange={(newProps) => {
                  updateComponent(selectedComponent.id, { props: newProps });
                }}
              />
            )}

            {/* Component Actions */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Actions</h4>

              <button
                onClick={() => useBuilderStore.getState().duplicateComponent(selectedComponent.id)}
                className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Duplicate
              </button>

              <button
                onClick={() => useBuilderStore.getState().copyComponent(selectedComponent.id)}
                className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Copy
              </button>

              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this component?')) {
                    useBuilderStore.getState().removeComponent(selectedComponent.id);
                  }
                }}
                className="w-full px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Props Form Generator
// ============================================================================

interface PropsFormProps {
  schema: any;
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
}

function PropsForm({ schema, values, onChange }: PropsFormProps) {
  if (!schema.properties) return null;

  const handleChange = (key: string, value: any) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Properties</h4>

      {Object.entries(schema.properties).map(([key, propSchema]: [string, any]) => {
        // Skip id and className (internal)
        if (key === 'id' || key === 'className') return null;

        return (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {key}
              {schema.required?.includes(key) && <span className="text-red-500 ml-1">*</span>}
            </label>

            {propSchema.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{propSchema.description}</p>
            )}

            <FormField
              schema={propSchema}
              value={values[key] ?? propSchema.default}
              onChange={(value) => handleChange(key, value)}
            />
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Form Field (Based on JSON Schema type)
// ============================================================================

function FormField({ schema, value, onChange }: any) {
  // Enum (Select)
  if (schema.enum) {
    return (
      <select
        value={value || schema.default || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="">Select...</option>
        {schema.enum.map((option: string) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  // Boolean (Checkbox)
  if (schema.type === 'boolean') {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={value ?? schema.default ?? false}
          onChange={(e) => onChange(e.target.checked)}
          className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
        />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {value ? 'Enabled' : 'Disabled'}
        </span>
      </label>
    );
  }

  // Number
  if (schema.type === 'number') {
    return (
      <input
        type="number"
        value={value ?? schema.default ?? ''}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    );
  }

  // String (Text/Textarea)
  if (schema.type === 'string') {
    if (schema.format === 'uri') {
      return (
        <input
          type="url"
          value={value || schema.default || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      );
    }

    // Long text (textarea)
    if (schema.description && schema.description.length > 100) {
      return (
        <textarea
          value={value || schema.default || ''}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      );
    }

    return (
      <input
        type="text"
        value={value || schema.default || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    );
  }

  // Object (JSON editor - simplified)
  if (schema.type === 'object') {
    return (
      <textarea
        value={JSON.stringify(value || {}, null, 2)}
        onChange={(e) => {
          try {
            onChange(JSON.parse(e.target.value));
          } catch {}
        }}
        rows={6}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-900 text-green-400 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
      />
    );
  }

  // Default fallback
  return (
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
  );
}
