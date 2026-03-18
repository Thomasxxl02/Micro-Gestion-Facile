import React, { useState, useMemo } from 'react';
import { CalendarEvent, Client, Invoice } from '../types';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  User, 
  FileText, 
  X, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  MoreVertical,
  Edit3
} from 'lucide-react';

interface CalendarManagerProps {
  events: CalendarEvent[];
  setEvents: (events: CalendarEvent[]) => void;
  clients: Client[];
  invoices: Invoice[];
  onSaveEvent?: (event: CalendarEvent) => void;
  onDeleteEvent?: (id: string) => void;
}

const CalendarManager: React.FC<CalendarManagerProps> = ({ events, setEvents, clients, invoices, onSaveEvent, onDeleteEvent }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [formData, setFormData] = useState<Partial<CalendarEvent>>({
    title: '',
    description: '',
    start: '',
    end: '',
    type: 'meeting',
    clientId: '',
    invoiceId: ''
  });

  // Calendar Logic
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    
    // Adjust startDay to start from Monday (0: Sun -> 6: Sat)
    // We want 0: Mon -> 6: Sun
    const adjustedStartDay = startDay === 0 ? 6 : startDay - 1;

    const days = [];
    
    // Previous month days
    const prevMonthDays = daysInMonth(year, month - 1);
    for (let i = adjustedStartDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        month: month - 1,
        year: month === 0 ? year - 1 : year,
        currentMonth: false
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        day: i,
        month: month,
        year: year,
        currentMonth: true
      });
    }

    // Next month days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        month: month + 1,
        year: month === 11 ? year + 1 : year,
        currentMonth: false
      });
    }

    return days;
  }, [currentDate]);

  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEvent) {
      const updatedEvent = { ...selectedEvent, ...formData } as CalendarEvent;
      setEvents(events.map(ev => ev.id === selectedEvent.id ? updatedEvent : ev));
      if (onSaveEvent) onSaveEvent(updatedEvent);
    } else {
      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        title: formData.title || 'Nouvel événement',
        description: formData.description,
        start: formData.start || new Date().toISOString(),
        end: formData.end || new Date().toISOString(),
        type: formData.type || 'meeting',
        clientId: formData.clientId,
        invoiceId: formData.invoiceId,
        color: formData.color || '#102a43'
      };
      setEvents([...events, newEvent]);
      if (onSaveEvent) onSaveEvent(newEvent);
    }
    setIsModalOpen(false);
    setSelectedEvent(null);
    setFormData({ title: '', description: '', start: '', end: '', type: 'meeting', clientId: '', invoiceId: '' });
  };

  const deleteEvent = (id: string) => {
    if (confirm('Supprimer cet événement ?')) {
      setEvents(events.filter(ev => ev.id !== id));
      if (onDeleteEvent) onDeleteEvent(id);
      setIsModalOpen(false);
      setSelectedEvent(null);
    }
  };

  const getEventsForDay = (day: number, month: number, year: number) => {
    return events.filter(ev => {
      const d = new Date(ev.start);
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    });
  };

  const getTypeColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'meeting': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'task': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'deadline': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-brand-50 text-brand-600 border-brand-100';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold text-brand-900 tracking-tight font-display">Agenda & Planning</h2>
          <p className="text-brand-500 mt-1 text-sm">Gérez vos rendez-vous, échéances et tâches importantes.</p>
        </div>
        <button 
          onClick={() => {
            setSelectedEvent(null);
            setFormData({ 
              title: '', 
              description: '', 
              start: new Date().toISOString().slice(0, 16), 
              end: new Date(Date.now() + 3600000).toISOString().slice(0, 16), 
              type: 'meeting', 
              clientId: '', 
              invoiceId: '' 
            });
            setIsModalOpen(true);
          }}
          className="bg-brand-900 hover:bg-brand-800 text-white px-6 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-brand-900/20 font-bold text-xs uppercase tracking-widest"
        >
          <Plus size={18} />
          Nouvel Événement
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Calendar Main View */}
        <div className="lg:col-span-3 bg-white border border-brand-100 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col">
          {/* Calendar Header */}
          <div className="p-8 border-b border-brand-50 flex justify-between items-center bg-brand-50/30">
            <div className="flex items-center gap-4">
              <h3 className="text-2xl font-bold text-brand-900 font-display">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <div className="flex bg-white rounded-xl border border-brand-100 p-1 shadow-sm">
                <button onClick={prevMonth} className="p-1.5 hover:bg-brand-50 rounded-lg text-brand-500 transition-colors">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={goToToday} className="px-3 py-1 text-xs font-bold text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                  Aujourd'hui
                </button>
                <button onClick={nextMonth} className="p-1.5 hover:bg-brand-50 rounded-lg text-brand-500 transition-colors">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="flex-1 grid grid-cols-7 border-b border-brand-50">
            {dayNames.map(day => (
              <div key={day} className="py-4 text-center text-[10px] font-bold text-brand-400 uppercase tracking-[0.2em] border-r border-brand-50 last:border-0">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 grid-rows-6 flex-1">
            {calendarDays.map((date, idx) => {
              const dayEvents = getEventsForDay(date.day, date.month, date.year);
              const isToday = new Date().getDate() === date.day && 
                              new Date().getMonth() === date.month && 
                              new Date().getFullYear() === date.year;

              return (
                <div 
                  key={idx} 
                  className={`min-h-[120px] p-2 border-r border-b border-brand-50 last:border-r-0 transition-colors hover:bg-brand-50/30 group ${!date.currentMonth ? 'bg-brand-50/20' : ''}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-bold w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                      isToday ? 'bg-brand-900 text-white shadow-md' : 
                      date.currentMonth ? 'text-brand-900' : 'text-brand-300'
                    }`}>
                      {date.day}
                    </span>
                    <button 
                      onClick={() => {
                        const d = new Date(date.year, date.month, date.day, 9, 0);
                        setFormData({
                          ...formData,
                          start: d.toISOString().slice(0, 16),
                          end: new Date(d.getTime() + 3600000).toISOString().slice(0, 16)
                        });
                        setIsModalOpen(true);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-brand-400 hover:text-brand-900 transition-all"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(ev => (
                      <button 
                        key={ev.id}
                        onClick={() => {
                          setSelectedEvent(ev);
                          setFormData(ev);
                          setIsModalOpen(true);
                        }}
                        className={`w-full text-left px-2 py-1 rounded-lg text-[9px] font-bold border truncate transition-all hover:scale-[1.02] active:scale-[0.98] ${getTypeColor(ev.type)}`}
                      >
                        {ev.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[8px] font-bold text-brand-400 text-center uppercase tracking-wider">
                        + {dayEvents.length - 3} autres
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar: Upcoming Events */}
        <div className="space-y-6">
          <div className="bg-white border border-brand-100 rounded-[2rem] p-8 shadow-sm">
            <h3 className="text-lg font-bold text-brand-900 mb-6 flex items-center gap-2 font-display">
              <Clock className="text-brand-400" size={20} />
              À venir
            </h3>
            <div className="space-y-4">
              {events
                .filter(ev => new Date(ev.start) >= new Date())
                .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                .slice(0, 5)
                .map(ev => (
                  <div key={ev.id} className="p-4 bg-brand-50 rounded-2xl border border-brand-100 hover:border-brand-300 transition-all group cursor-pointer" onClick={() => { setSelectedEvent(ev); setFormData(ev); setIsModalOpen(true); }}>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${getTypeColor(ev.type)}`}>
                        {ev.type}
                      </span>
                      <span className="text-[10px] font-bold text-brand-400">{new Date(ev.start).toLocaleDateString()}</span>
                    </div>
                    <h4 className="text-sm font-bold text-brand-900 mb-1 group-hover:text-brand-700 transition-colors">{ev.title}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-brand-500 font-medium">
                      <Clock size={12} />
                      {new Date(ev.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              {events.length === 0 && (
                <div className="text-center py-10 text-brand-300 italic text-sm">
                  Aucun événement prévu.
                </div>
              )}
            </div>
          </div>

          <div className="bg-brand-900 text-white rounded-[2rem] p-8 shadow-xl shadow-brand-900/10">
            <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
              <AlertCircle className="text-accent-400" size={18} />
              Conseil Pro
            </h4>
            <p className="text-xs text-brand-200 leading-relaxed">
              Liez vos événements à des clients ou des factures pour garder une trace de vos échanges et ne jamais rater une échéance de paiement.
            </p>
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-brand-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-8 border-b border-brand-100 flex justify-between items-center bg-brand-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-900/20">
                  <CalendarIcon size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-brand-900">{selectedEvent ? 'Modifier l\'événement' : 'Nouvel événement'}</h3>
                  <p className="text-xs text-brand-500 font-medium">Détails de votre planification</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-brand-200 rounded-full text-brand-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-brand-500 uppercase tracking-wider mb-2">Titre</label>
                  <input 
                    type="text" 
                    required
                    className="w-full p-4 bg-brand-50 border border-brand-200 rounded-2xl focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 outline-none transition-all text-brand-900 font-bold"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="Ex: Réunion de cadrage"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-500 uppercase tracking-wider mb-2">Type</label>
                  <select 
                    className="w-full p-4 bg-brand-50 border border-brand-200 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all appearance-none font-bold text-brand-900"
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value as CalendarEvent['type']})}
                  >
                    <option value="meeting">Rendez-vous</option>
                    <option value="task">Tâche</option>
                    <option value="deadline">Échéance</option>
                    <option value="other">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-500 uppercase tracking-wider mb-2">Client Lié</label>
                  <select 
                    className="w-full p-4 bg-brand-50 border border-brand-200 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all appearance-none font-bold text-brand-900"
                    value={formData.clientId}
                    onChange={e => setFormData({...formData, clientId: e.target.value})}
                  >
                    <option value="">Aucun client...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-500 uppercase tracking-wider mb-2">Début</label>
                  <input 
                    type="datetime-local" 
                    required
                    className="w-full p-4 bg-brand-50 border border-brand-200 rounded-2xl focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 outline-none transition-all text-brand-900 font-bold"
                    value={formData.start}
                    onChange={e => setFormData({...formData, start: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-500 uppercase tracking-wider mb-2">Fin</label>
                  <input 
                    type="datetime-local" 
                    required
                    className="w-full p-4 bg-brand-50 border border-brand-200 rounded-2xl focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 outline-none transition-all text-brand-900 font-bold"
                    value={formData.end}
                    onChange={e => setFormData({...formData, end: e.target.value})}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-brand-500 uppercase tracking-wider mb-2">Description</label>
                  <textarea 
                    rows={3}
                    className="w-full p-4 bg-brand-50 border border-brand-200 rounded-2xl focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 outline-none transition-all resize-none text-brand-900 font-medium"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Notes additionnelles..."
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-6">
                {selectedEvent ? (
                  <button 
                    type="button"
                    onClick={() => deleteEvent(selectedEvent.id)}
                    className="p-4 text-red-500 hover:bg-red-50 rounded-2xl transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-widest"
                  >
                    <Trash2 size={18} />
                    Supprimer
                  </button>
                ) : <div />}
                
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-8 py-4 text-brand-600 font-bold text-xs uppercase tracking-widest hover:bg-brand-50 rounded-2xl transition-all"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit"
                    className="bg-brand-900 text-white px-10 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-brand-800 transition-all shadow-lg shadow-brand-900/20 flex items-center gap-2"
                  >
                    <CheckCircle2 size={18} />
                    Enregistrer
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarManager;
