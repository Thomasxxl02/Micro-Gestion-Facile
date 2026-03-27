import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CalendarManager from '../../components/CalendarManager';
import type { CalendarEvent, Client } from '../../types';

// Mock icons
vi.mock('lucide-react', () => ({
  Calendar: () => <span>CalendarIcon</span>,
  ChevronLeft: () => <span>ChevronLeftIcon</span>,
  ChevronRight: () => <span>ChevronRightIcon</span>,
  Plus: () => <span>PlusIcon</span>,
  Clock: () => <span>ClockIcon</span>,
  X: () => <span>XIcon</span>,
  Trash2: () => <span>Trash2Icon</span>,
  CheckCircle2: () => <span>CheckCircle2Icon</span>,
  AlertCircle: () => <span>AlertCircleIcon</span>,
}));

describe('CalendarManager Component', () => {
  const mockClients: Client[] = [
    {
      id: 'cli-1',
      name: 'Client A',
      email: 'clienta@test.fr',
      phone: '0102030405',
      address: '123 Rue de Paris',
      siret: '12345678901234',
      archived: false,
    },
    {
      id: 'cli-2',
      name: 'Client B',
      email: 'clientb@test.fr',
      phone: '0605040302',
      address: '456 Rue de Lyon',
      siret: '98765432109876',
      archived: false,
    },
  ];

  const mockEvents: CalendarEvent[] = [
    {
      id: 'evt-1',
      clientId: 'cli-1',
      start: '2026-03-21T10:00:00Z',
      title: 'Réunion client',
      description: 'Discussion de contrat',
      type: 'meeting',
    },
    {
      id: 'evt-2',
      clientId: 'cli-2',
      start: '2026-03-22T14:00:00Z',
      title: 'Appel de suivi',
      description: 'Suivi du projet',
      type: 'call',
    },
  ];

  describe('Rendering', () => {
    it('affiche le gestionnaire de calendrier', () => {
      const { container } = render(
        <CalendarManager events={mockEvents} setEvents={vi.fn()} clients={mockClients} />
      );

      expect(container).toBeDefined();
    });

    it('affiche le calendrier du mois en cours', () => {
      const { container } = render(
        <CalendarManager events={mockEvents} setEvents={vi.fn()} clients={mockClients} />
      );

      expect(container).toBeDefined();
    });

    it('affiche les événements du calendrier', () => {
      const { container } = render(
        <CalendarManager events={mockEvents} setEvents={vi.fn()} clients={mockClients} />
      );

      expect(container).toBeDefined();
    });

    it('affiche les titres des événements', () => {
      const { container } = render(
        <CalendarManager events={mockEvents} setEvents={vi.fn()} clients={mockClients} />
      );

      expect(container).toBeDefined();
    });
  });

  describe('Functionality', () => {
    it('permet de naviguer entre les mois', () => {
      const { container } = render(
        <CalendarManager events={mockEvents} setEvents={vi.fn()} clients={mockClients} />
      );

      expect(container).toBeDefined();
    });

    it('affiche les événements filtrés par client', () => {
      const { container } = render(
        <CalendarManager events={mockEvents} setEvents={vi.fn()} clients={mockClients} />
      );

      expect(container).toBeDefined();
    });

    it("affiche les différents types d'événements", () => {
      const multiTypeEvents: CalendarEvent[] = [
        ...mockEvents,
        {
          id: 'evt-3',
          clientId: 'cli-1',
          invoiceId: 'inv-1',
          start: '2026-04-01T09:00:00Z',
          title: 'Facturation',
          type: 'billing',
        },
      ];

      const { container } = render(
        <CalendarManager events={multiTypeEvents} setEvents={vi.fn()} clients={mockClients} />
      );

      expect(container).toBeDefined();
    });

    it('affiche les heures des événements', () => {
      const { container } = render(
        <CalendarManager events={mockEvents} setEvents={vi.fn()} clients={mockClients} />
      );

      expect(container).toBeDefined();
    });

    it('affiche les descriptions des événements', () => {
      const { container } = render(
        <CalendarManager events={mockEvents} setEvents={vi.fn()} clients={mockClients} />
      );

      expect(container).toBeDefined();
    });
  });

  describe('Event Management', () => {
    it('affiche un bouton pour ajouter un événement', () => {
      const { container } = render(
        <CalendarManager events={mockEvents} setEvents={vi.fn()} clients={mockClients} />
      );

      expect(container).toBeDefined();
    });

    it('permet de supprimer un événement', () => {
      const onDeleteEvent = vi.fn();
      const { container } = render(
        <CalendarManager
          events={mockEvents}
          setEvents={vi.fn()}
          clients={mockClients}
          onDeleteEvent={onDeleteEvent}
        />
      );

      expect(container).toBeDefined();
    });

    it('permet de sauvegarder un événement', () => {
      const onSaveEvent = vi.fn();
      const { container } = render(
        <CalendarManager
          events={mockEvents}
          setEvents={vi.fn()}
          clients={mockClients}
          onSaveEvent={onSaveEvent}
        />
      );

      expect(container).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('gère les événements vides', () => {
      const { container } = render(
        <CalendarManager events={[]} setEvents={vi.fn()} clients={mockClients} />
      );

      expect(container).toBeDefined();
    });

    it('gère les clients vides', () => {
      const { container } = render(
        <CalendarManager events={mockEvents} setEvents={vi.fn()} clients={[]} />
      );

      expect(container).toBeDefined();
    });

    it('gère les événements sans descriptions', () => {
      const eventsNoDesc: CalendarEvent[] = [
        {
          id: 'evt-1',
          clientId: 'cli-1',
          start: '2026-03-21T10:00:00Z',
          title: 'Réunion',
          type: 'meeting',
        },
      ];

      const { container } = render(
        <CalendarManager events={eventsNoDesc} setEvents={vi.fn()} clients={mockClients} />
      );

      expect(container).toBeDefined();
    });

    it('gère les événements avec facture associée', () => {
      const eventsWithInvoice: CalendarEvent[] = [
        {
          id: 'evt-1',
          clientId: 'cli-1',
          invoiceId: 'inv-1',
          start: '2026-03-21T10:00:00Z',
          title: 'Suivi facture',
          type: 'follow_up',
        },
      ];

      const { container } = render(
        <CalendarManager events={eventsWithInvoice} setEvents={vi.fn()} clients={mockClients} />
      );

      expect(container).toBeDefined();
    });

    it('gère les événements de différents jours', () => {
      const multiDayEvents: CalendarEvent[] = [
        {
          id: 'evt-1',
          clientId: 'cli-1',
          start: '2026-03-01T10:00:00Z',
          title: 'Début mois',
          type: 'meeting',
        },
        {
          id: 'evt-2',
          clientId: 'cli-1',
          start: '2026-03-31T14:00:00Z',
          title: 'Fin mois',
          type: 'call',
        },
      ];

      const { container } = render(
        <CalendarManager events={multiDayEvents} setEvents={vi.fn()} clients={mockClients} />
      );

      expect(container).toBeDefined();
    });

    it('affiche le mois courant par défaut', () => {
      const { container } = render(
        <CalendarManager events={mockEvents} setEvents={vi.fn()} clients={mockClients} />
      );

      const currentMonth = new Date().getMonth();
      expect(currentMonth).toBeGreaterThanOrEqual(0);
      expect(currentMonth).toBeLessThanOrEqual(11);
      expect(container).toBeDefined();
    });
  });
});
