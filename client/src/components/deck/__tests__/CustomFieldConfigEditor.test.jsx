import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CustomFieldConfigEditor, { MAX_CUSTOM_FIELDS } from '../CustomFieldConfigEditor';

// Wrapper so onChange writes are reflected back into `fields` across
// re-renders, matching how DeckManager actually wires this component up.
// Field `name` (the schema identifier) isn't itself an input in the UI, so
// it's dumped into a data attribute for assertions that need it.
function Harness({ initialFields = [] }) {
  const [fields, setFields] = useState(initialFields);
  return (
    <div data-testid="field-names" data-names={JSON.stringify(fields.map((f) => f.name))}>
      <CustomFieldConfigEditor fields={fields} onChange={setFields} />
    </div>
  );
}

describe('CustomFieldConfigEditor', () => {
  it('shows an empty state with no fields', () => {
    render(<Harness />);
    expect(screen.getByText(/No fields yet/)).toBeInTheDocument();
  });

  it('adds a field with an auto-derived identifier name', () => {
    render(<Harness />);
    fireEvent.click(screen.getByText('Add Field'));
    expect(screen.getByDisplayValue('Field 1')).toBeInTheDocument();
  });

  it('caps at MAX_CUSTOM_FIELDS and disables Add Field beyond that', () => {
    const initialFields = Array.from({ length: MAX_CUSTOM_FIELDS }, (_, i) => ({
      name: `field_${i}`,
      displayName: `Field ${i}`,
      type: 'text',
      role: 'answer',
      required: false,
      order: i,
      style: 'plain',
    }));
    render(<Harness initialFields={initialFields} />);
    expect(screen.getByText(`Fields (${MAX_CUSTOM_FIELDS}/${MAX_CUSTOM_FIELDS})`)).toBeInTheDocument();
    expect(screen.getByText('Add Field')).toBeDisabled();
  });

  it('disambiguates two fields that would derive the same identifier', () => {
    render(<Harness />);
    fireEvent.click(screen.getByText('Add Field'));
    fireEvent.click(screen.getByText('Add Field'));
    const [firstNameInput, secondNameInput] = screen.getAllByPlaceholderText('e.g. Front');
    fireEvent.change(firstNameInput, { target: { value: 'Answer' } });
    fireEvent.change(secondNameInput, { target: { value: 'Answer' } });

    // Both display names are allowed to collide; the underlying schema
    // identifiers (Deck.fieldConfig.fields[].name) must stay unique.
    expect(firstNameInput).toHaveValue('Answer');
    expect(secondNameInput).toHaveValue('Answer');
    const names = JSON.parse(screen.getByTestId('field-names').dataset.names);
    expect(names).toEqual(['Answer', 'Answer_2']);
  });

  it('removes a field and re-indexes order', () => {
    render(<Harness />);
    fireEvent.click(screen.getByText('Add Field'));
    fireEvent.click(screen.getByText('Add Field'));
    expect(screen.getByText('Fields (2/6)')).toBeInTheDocument();
    const removeButtons = screen.getAllByTitle('Remove field');
    fireEvent.click(removeButtons[0]);
    expect(screen.getByText('Fields (1/6)')).toBeInTheDocument();
  });
});
