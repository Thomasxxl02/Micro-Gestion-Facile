import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AddressFields, ContactFields } from '../components/EntityFormFields';

describe('EntityFormFields Integration', () => {
  const onAddressChange = vi.fn();
  const onPostalCodeChange = vi.fn();
  const onCityChange = vi.fn();
  const onCountryChange = vi.fn();
  const onNameChange = vi.fn();
  const onEmailChange = vi.fn();
  const onPhoneChange = vi.fn();

  describe('AddressFields', () => {
    it('devrait appeler les handlers de changement', () => {
      render(
        <AddressFields
          address=""
          postalCode=""
          city=""
          onAddressChange={onAddressChange}
          onPostalCodeChange={onPostalCodeChange}
          onCityChange={onCityChange}
        />
      );

      const addrInput = screen.getByLabelText(/Adresse/i);
      fireEvent.change(addrInput, { target: { value: '123 Rue' } });
      expect(onAddressChange).toHaveBeenCalledWith('123 Rue');

      const cpInput = screen.getByLabelText(/Code postal/i);
      fireEvent.change(cpInput, { target: { value: '75000' } });
      expect(onPostalCodeChange).toHaveBeenCalledWith('75000');
    });

    it('devrait appeler onCountryChange quand le pays change', () => {
      render(
        <AddressFields
          address=""
          postalCode=""
          city=""
          onAddressChange={onAddressChange}
          onPostalCodeChange={onPostalCodeChange}
          onCityChange={onCityChange}
          onCountryChange={onCountryChange}
          country="FR"
        />
      );

      const select = screen.getByLabelText(/Pays/i);
      fireEvent.change(select, { target: { value: 'BE' } });
      expect(onCountryChange).toHaveBeenCalledWith('BE');
    });
  });

  describe('ContactFields', () => {
    it('devrait appeler les handlers de contact', () => {
      render(
        <ContactFields
          name=""
          email=""
          phone=""
          onNameChange={onNameChange}
          onEmailChange={onEmailChange}
          onPhoneChange={onPhoneChange}
        />
      );

      fireEvent.change(screen.getByLabelText(/Nom/i), { target: { value: 'Test' } });
      expect(onNameChange).toHaveBeenCalledWith('Test');

      fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@test.com' } });
      expect(onEmailChange).toHaveBeenCalledWith('test@test.com');

      fireEvent.change(screen.getByLabelText(/Téléphone/i), { target: { value: '0102030405' } });
      expect(onPhoneChange).toHaveBeenCalledWith('0102030405');
    });
  });
});
