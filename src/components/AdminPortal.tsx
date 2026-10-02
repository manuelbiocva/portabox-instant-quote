import React, { useState } from 'react';
import {
  Users,
  DollarSign,
  Tag,
  MapPin,
  ShieldBan,
  Truck,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Download,
  CheckCircle,
  Phone,
  Mail,
  Send,
  MessageSquare,
  Search,
  TrendingDown,
  Filter,
  ArrowRight,
} from 'lucide-react';
import { AppConfig, BlockedPostcode, CustomerLead, MetroHub, PromotionRule, QuoteDropOffRecord } from '../types/quote';
import { PORTABOX_DEPOTS } from '../data/australianPostcodes';
import { loadDropOffRecords } from '../services/pricingEngine';

interface AdminPortalProps {
  config: AppConfig;
  leads: CustomerLead[];
  onSaveConfig: (newConfig: AppConfig) => void;
  onUpdateLeadStatus: (leadId: string, status: CustomerLead['status']) => void;
  onAddLeadNote: (leadId: string, note: string) => void;
  onClose: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  config,
  leads,
  onSaveConfig,
  onUpdateLeadStatus,
  onAddLeadNote,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'leads' | 'dropoffs' | 'pricing' | 'zones' | 'interstate' | 'promotions' | 'blocked' | 'depots'>('leads');
  const [currentConfig, setCurrentConfig] = useState<AppConfig>(config);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [leadsSearch, setLeadsSearch] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>('All');
  const [dropOffs, setDropOffs] = useState<QuoteDropOffRecord[]>(loadDropOffRecords());
  const [dropOffPageFilter, setDropOffPageFilter] = useState<string>('All');
  const [dropOffSearch, setDropOffSearch] = useState<string>('');
  const [newNoteText, setNewNoteText] = useState<Record<string, string>>({});

  // New promo form state
  const [newPromo, setNewPromo] = useState<Partial<PromotionRule>>({
    name: '',
    code: '',
    description: '',
    type: 'percent_off_first_month',
    value: 50,
    targetPostcode: '',
    targetRadiusKm: 50,
    targetHubOrigin: undefined,
    targetHubDestination: undefined,
    minDurationMonths: 1,
    active: true,
    autoApply: false,
  });
  const [isAddingPromo, setIsAddingPromo] = useState(false);

  // New blocked postcode form state
  const [newBlocked, setNewBlocked] = useState<BlockedPostcode>({
    postcode: '',
    suburb: '',
    reason: '',
  });

  const handleSave = () => {
    onSaveConfig(currentConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleResetDefaults = () => {
    if (confirm('Reset all prices, delivery zones and promotions to default settings?')) {
      localStorage.removeItem('portabox_app_config_v2');
      window.location.reload();
    }
  };

  // Export leads to CSV
  const handleExportCSV = () => {
    if (leads.length === 0) {
      alert('No customer leads to export yet.');
      return;
    }
    const headers = ['ID', 'Date', 'First Name', 'Mobile', 'Email', 'Postcode', 'Suburb', 'Container', 'Service Type', 'First Payment', 'Status'];
    const rows = leads.map((l) => [
      l.id,
      new Date(l.createdAt).toLocaleDateString(),
      `"${l.firstName}"`,
      `"${l.mobile}"`,
      `"${l.email}"`,
      l.quote.originPostcode.postcode,
      `"${l.quote.originPostcode.suburb}"`,
      `"${l.quote.containerName}"`,
      `"${l.quote.serviceType}"`,
      l.quote.firstPaymentTotal,
      l.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `portabox_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered leads
  const filteredLeads = leads.filter((l) => {
    const matchSearch =
      l.firstName.toLowerCase().includes(leadsSearch.toLowerCase()) ||
      l.mobile.includes(leadsSearch) ||
      l.email.toLowerCase().includes(leadsSearch.toLowerCase()) ||
      l.quote.originPostcode.suburb.toLowerCase().includes(leadsSearch.toLowerCase()) ||
      l.quote.originPostcode.postcode.includes(leadsSearch);
    const matchStatus = leadStatusFilter === 'All' || l.status === leadStatusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden mb-12">
      {/* Header Bar */}
      <div className="bg-[#0b2942] text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#00c0f3] text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wide">
              ADMIN CONTROL PANEL
            </span>
            {saveSuccess && (
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded">
                <CheckCircle className="w-3.5 h-3.5" />
                Settings Saved!
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
            Portabox Management Console
          </h2>
          <p className="text-xs text-slate-300">
            Set container rates, domestic legs, delivery zones, promotions, and manage customer leads.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#00c0f3] hover:bg-[#00a7d4] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Back to App
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-slate-100/80 px-6 py-2 border-b border-slate-200 flex flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('leads')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'leads' ? 'bg-white text-[#0b2942] shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Customer Leads ({leads.length})</span>
        </button>

        <button
          onClick={() => {
            setDropOffs(loadDropOffRecords());
            setActiveTab('dropoffs');
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'dropoffs' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
          <span>Drop-Off Tracking ({dropOffs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pricing')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'pricing' ? 'bg-white text-[#0b2942] shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Container & Legs</span>
        </button>

        <button
          onClick={() => setActiveTab('zones')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'zones' ? 'bg-white text-[#0b2942] shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Delivery Zones</span>
        </button>

        <button
          onClick={() => setActiveTab('interstate')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'interstate' ? 'bg-white text-[#0b2942] shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Interstate Legs</span>
        </button>

        <button
          onClick={() => setActiveTab('promotions')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'promotions' ? 'bg-white text-[#0b2942] shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Promotions ({currentConfig.promotions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('blocked')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'blocked' ? 'bg-white text-[#0b2942] shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldBan className="w-3.5 h-3.5" />
          <span>Blocked Postcodes ({currentConfig.blockedPostcodes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('depots')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'depots' ? 'bg-white text-[#0b2942] shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Depot Locations</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="p-6 sm:p-8">
        {/* ================= TAB 1: CUSTOMER LEADS CRM ================= */}
        {activeTab === 'leads' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-extrabold text-[#0b2942]">Customer Inquiries & Quotes</h3>
                <p className="text-xs text-slate-500">
                  Collected customer leads for follow-up calls, SMS dispatch, and CRM marketing.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export to CSV</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={leadsSearch}
                  onChange={(e) => setLeadsSearch(e.target.value)}
                  placeholder="Search by customer name, mobile, email, suburb, or postcode..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00c0f3]"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">Status:</span>
                {['All', 'New', 'Contacted', 'Booked', 'Follow-up'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setLeadStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      leadStatusFilter === st
                        ? 'bg-[#0b2942] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            {filteredLeads.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">No matching customer quotes found</p>
                <p className="text-xs text-slate-400 mt-1">Quotes submitted via the app will automatically appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Container & Service</th>
                      <th className="py-3 px-4">First Payment</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Follow-up Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <div>{lead.firstName}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            {new Date(lead.createdAt).toLocaleDateString()} {new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-mono text-slate-800">{lead.mobile}</div>
                          <div className="text-slate-500 text-[11px]">{lead.email}</div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="px-1.5 py-0.5 rounded bg-sky-50 text-[#00c0f3] text-[9px] font-bold">
                              SMS Sent
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[9px] font-bold">
                              Email Sent
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">
                            {lead.quote.originPostcode.suburb}
                          </div>
                          <div className="text-slate-400 text-[11px]">
                            {lead.quote.originPostcode.state} {lead.quote.originPostcode.postcode} (Zone {lead.quote.deliveryZone})
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{lead.quote.containerName}</div>
                          <div className="text-slate-500 text-[11px]">
                            {lead.quote.serviceType.replace(/_/g, ' ')} · {lead.quote.storageDuration.replace(/_/g, ' ')}
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-slate-900 text-sm">
                          ${lead.quote.firstPaymentTotal}
                        </td>

                        <td className="py-3 px-4">
                          <select
                            value={lead.status}
                            onChange={(e) => onUpdateLeadStatus(lead.id, e.target.value as any)}
                            className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-[#00c0f3]"
                          >
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Booked">Booked</option>
                            <option value="Follow-up">Follow-up</option>
                            <option value="Archived">Archived</option>
                          </select>
                        </td>

                        <td className="py-3 px-4">
                          <div className="space-y-1 max-w-xs">
                            {lead.notes && lead.notes.length > 0 && (
                              <div className="text-[11px] text-slate-600 bg-slate-100 p-1.5 rounded">
                                {lead.notes[lead.notes.length - 1]}
                              </div>
                            )}
                            <div className="flex items-center gap-1 mt-1">
                              <input
                                type="text"
                                placeholder="Add note..."
                                value={newNoteText[lead.id] || ''}
                                onChange={(e) =>
                                  setNewNoteText({ ...newNoteText, [lead.id]: e.target.value })
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && newNoteText[lead.id]?.trim()) {
                                    onAddLeadNote(lead.id, newNoteText[lead.id]);
                                    setNewNoteText({ ...newNoteText, [lead.id]: '' });
                                  }
                                }}
                                className="w-full text-[11px] px-2 py-1 rounded border border-slate-200"
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB: DROP-OFF TRACKING & FUNNEL ================= */}
        {activeTab === 'dropoffs' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-rose-100 text-rose-700 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wide">
                    FUNNEL ANALYTICS
                  </span>
                  <span className="text-xs text-slate-400 font-bold">
                    {dropOffs.length} recorded sessions
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-[#0b2942] mt-1">
                  Quote Funnel & Page Drop-Off Analytics
                </h3>
                <p className="text-xs text-slate-500">
                  Identifies the exact page where customers stop or abandon the quote process so you can address friction and recover leads.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDropOffs(loadDropOffRecords())}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Refresh Log</span>
                </button>
              </div>
            </div>

            {/* Funnel Stage Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { step: 1, name: 'Page 1: Where', desc: 'Suburb & Postcode check', color: 'border-sky-300 bg-sky-50/50' },
                { step: 2, name: 'Page 2: What', desc: 'Service type & move destination', color: 'border-indigo-300 bg-indigo-50/50' },
                { step: 3, name: 'Page 3: Which Size', desc: 'Container size selection', color: 'border-amber-300 bg-amber-50/50' },
                { step: 4, name: 'Page 4: When', desc: 'Storage duration & billing cycle', color: 'border-purple-300 bg-purple-50/50' },
                { step: 5, name: 'Page 5: Send Quote', desc: 'Email & mobile contact capture', color: 'border-rose-300 bg-rose-50/50' },
                { step: 6, name: 'Page 6: Final Quote', desc: 'Quote viewed & completed', color: 'border-emerald-300 bg-emerald-50/50' },
              ].map((stage) => {
                const countAtStage = dropOffs.filter((d) => d.lastPageStep === stage.step).length;
                const total = dropOffs.length || 1;
                const pct = Math.round((countAtStage / total) * 100);

                return (
                  <div
                    key={stage.step}
                    className={`p-4 rounded-2xl border ${stage.color} space-y-2`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-[#0b2942]">
                        {stage.name}
                      </span>
                      <span className="text-xs font-black font-mono px-2 py-0.5 rounded-full bg-white text-slate-800 border border-slate-200 shadow-2xs">
                        {countAtStage} sessions ({pct}%)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">{stage.desc}</p>
                    <div className="w-full bg-white/80 h-2 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className={`h-full ${stage.step === 6 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        style={{ width: `${Math.max(pct, 6)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Filter and Search Bar for Drop-Offs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by suburb, postcode, email, or mobile..."
                  value={dropOffSearch}
                  onChange={(e) => setDropOffSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00c0f3]"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={dropOffPageFilter}
                  onChange={(e) => setDropOffPageFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none"
                >
                  <option value="All">All Funnel Pages</option>
                  <option value="Page 1">Page 1: Where</option>
                  <option value="Page 2">Page 2: What</option>
                  <option value="Page 3">Page 3: Which Size</option>
                  <option value="Page 4">Page 4: When</option>
                  <option value="Page 5">Page 5: Send Quote</option>
                  <option value="Page 6">Page 6: Final Quote (Completed)</option>
                </select>
              </div>
            </div>

            {/* Drop-Off Sessions Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Time / Session</th>
                      <th className="px-4 py-3">Drop-Off Page Name</th>
                      <th className="px-4 py-3">Location / Move</th>
                      <th className="px-4 py-3">Container & Qty</th>
                      <th className="px-4 py-3">Duration & Billing</th>
                      <th className="px-4 py-3">Contact Info</th>
                      <th className="px-4 py-3 text-right">Outcome</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dropOffs
                      .filter((d) => {
                        const q = dropOffSearch.toLowerCase();
                        const matchSearch =
                          !q ||
                          (d.originSuburb && d.originSuburb.toLowerCase().includes(q)) ||
                          (d.originPostcode && d.originPostcode.includes(q)) ||
                          (d.customerEmail && d.customerEmail.toLowerCase().includes(q)) ||
                          (d.customerPhone && d.customerPhone.includes(q)) ||
                          d.lastPageName.toLowerCase().includes(q);

                        const matchPage =
                          dropOffPageFilter === 'All' ||
                          d.lastPageName.toLowerCase().includes(dropOffPageFilter.toLowerCase());

                        return matchSearch && matchPage;
                      })
                      .map((session) => (
                        <tr key={session.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3.5 text-slate-500">
                            <div className="font-mono font-bold text-slate-800">
                              {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-[10px]">
                              {new Date(session.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-lg font-extrabold text-[11px] ${
                                session.completed
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : session.lastPageStep === 5
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : session.lastPageStep === 4
                                  ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                  : session.lastPageStep === 3
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-sky-100 text-sky-800 border border-sky-300'
                              }`}
                            >
                              {session.lastPageName}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-slate-700">
                            <div className="font-bold text-[#0b2942]">
                              {session.originSuburb ? `${session.originSuburb} (${session.originPostcode})` : 'Not specified'}
                            </div>
                            {session.destinationSuburb && (
                              <div className="text-[10px] text-slate-500">
                                → Moving to {session.destinationSuburb} ({session.destinationPostcode})
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-slate-700">
                            <div className="font-semibold capitalize">
                              {session.containerSize ? session.containerSize.replace(/_/g, ' ') : 'None'}
                            </div>
                            {session.containerCount && session.containerCount > 1 && (
                              <div className="text-[10px] text-sky-600 font-bold">
                                {session.containerCount} containers
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-slate-600">
                            <div>{session.storageDuration ? session.storageDuration.replace(/_/g, ' ') : '—'}</div>
                            <div className="text-[10px] text-slate-400 capitalize">{session.billingCycle || '—'}</div>
                          </td>

                          <td className="px-4 py-3.5 text-slate-700">
                            {session.customerEmail || session.customerPhone ? (
                              <div className="space-y-0.5">
                                {session.customerPhone && (
                                  <a href={`tel:${session.customerPhone}`} className="font-mono text-[11px] font-bold text-[#00c0f3] hover:underline block">
                                    {session.customerPhone}
                                  </a>
                                )}
                                {session.customerEmail && (
                                  <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                                    {session.customerEmail}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Pre-contact stage</span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            {session.completed ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                Completed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                Abandoned
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: CONTAINER & LEG PRICING ================= */}
        {activeTab === 'pricing' && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="text-lg font-extrabold text-[#0b2942]">Container Hire Rates</h3>
              <p className="text-xs text-slate-500">
                Adjust baseline monthly and weekly hire rates for each Portabox container size.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* 10 m³ Container */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <h4 className="font-extrabold text-sm text-[#0b2942]">10 m³ Container</h4>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Monthly rate ($ / month)
                  </label>
                  <input
                    type="number"
                    value={currentConfig.containerPrices.small_10m3.monthlyRate}
                    onChange={(e) =>
                      setCurrentConfig({
                        ...currentConfig,
                        containerPrices: {
                          ...currentConfig.containerPrices,
                          small_10m3: {
                            ...currentConfig.containerPrices.small_10m3,
                            monthlyRate: Number(e.target.value),
                          },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Weekly rate ($ / week)
                  </label>
                  <input
                    type="number"
                    value={currentConfig.containerPrices.small_10m3.weeklyRate}
                    onChange={(e) =>
                      setCurrentConfig({
                        ...currentConfig,
                        containerPrices: {
                          ...currentConfig.containerPrices,
                          small_10m3: {
                            ...currentConfig.containerPrices.small_10m3,
                            weeklyRate: Number(e.target.value),
                          },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold font-mono"
                  />
                </div>
              </div>

              {/* 19 m³ Container */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <h4 className="font-extrabold text-sm text-[#0b2942]">19 m³ Container</h4>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Monthly rate ($ / month)
                  </label>
                  <input
                    type="number"
                    value={currentConfig.containerPrices.medium_19m3.monthlyRate}
                    onChange={(e) =>
                      setCurrentConfig({
                        ...currentConfig,
                        containerPrices: {
                          ...currentConfig.containerPrices,
                          medium_19m3: {
                            ...currentConfig.containerPrices.medium_19m3,
                            monthlyRate: Number(e.target.value),
                          },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Weekly rate ($ / week)
                  </label>
                  <input
                    type="number"
                    value={currentConfig.containerPrices.medium_19m3.weeklyRate}
                    onChange={(e) =>
                      setCurrentConfig({
                        ...currentConfig,
                        containerPrices: {
                          ...currentConfig.containerPrices,
                          medium_19m3: {
                            ...currentConfig.containerPrices.medium_19m3,
                            weeklyRate: Number(e.target.value),
                          },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold font-mono"
                  />
                </div>
              </div>

              {/* 25 m³ Container */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <h4 className="font-extrabold text-sm text-[#0b2942]">25 m³ Container</h4>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Monthly rate ($ / month)
                  </label>
                  <input
                    type="number"
                    value={currentConfig.containerPrices.large_25m3.monthlyRate}
                    onChange={(e) =>
                      setCurrentConfig({
                        ...currentConfig,
                        containerPrices: {
                          ...currentConfig.containerPrices,
                          large_25m3: {
                            ...currentConfig.containerPrices.large_25m3,
                            monthlyRate: Number(e.target.value),
                          },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Weekly rate ($ / week)
                  </label>
                  <input
                    type="number"
                    value={currentConfig.containerPrices.large_25m3.weeklyRate}
                    onChange={(e) =>
                      setCurrentConfig({
                        ...currentConfig,
                        containerPrices: {
                          ...currentConfig.containerPrices,
                          large_25m3: {
                            ...currentConfig.containerPrices.large_25m3,
                            weeklyRate: Number(e.target.value),
                          },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Packing Supplies Pricing Settings */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4">
              <div>
                <h4 className="font-extrabold text-sm text-[#0b2942]">Packing Supplies & Blanket Rental Rates</h4>
                <p className="text-xs text-slate-500">
                  Set prices for moving cartons and protective blanket hire packages.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Boxes */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-2">
                  <h5 className="text-xs font-bold text-[#0b2942] uppercase tracking-wider">Heavy Duty Boxes</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-500 block">Single Box ($)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={currentConfig.packingSupplies.boxSinglePrice}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            packingSupplies: {
                              ...currentConfig.packingSupplies,
                              boxSinglePrice: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-2 py-1 rounded-lg border font-mono font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">10 Pack ($)</label>
                      <input
                        type="number"
                        value={currentConfig.packingSupplies.box10Price}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            packingSupplies: {
                              ...currentConfig.packingSupplies,
                              box10Price: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-2 py-1 rounded-lg border font-mono font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">50 Pack ($)</label>
                      <input
                        type="number"
                        value={currentConfig.packingSupplies.box50Price}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            packingSupplies: {
                              ...currentConfig.packingSupplies,
                              box50Price: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-2 py-1 rounded-lg border font-mono font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">100 Pack ($)</label>
                      <input
                        type="number"
                        value={currentConfig.packingSupplies.box100Price}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            packingSupplies: {
                              ...currentConfig.packingSupplies,
                              box100Price: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-2 py-1 rounded-lg border font-mono font-bold text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Blankets */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-2">
                  <h5 className="text-xs font-bold text-[#0b2942] uppercase tracking-wider">Blanket Rental</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-500 block">Single Blanket ($)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={currentConfig.packingSupplies.blanketSinglePrice}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            packingSupplies: {
                              ...currentConfig.packingSupplies,
                              blanketSinglePrice: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-2 py-1 rounded-lg border font-mono font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">10 Pack ($)</label>
                      <input
                        type="number"
                        value={currentConfig.packingSupplies.blanket10Price}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            packingSupplies: {
                              ...currentConfig.packingSupplies,
                              blanket10Price: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-2 py-1 rounded-lg border font-mono font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">50 Pack ($)</label>
                      <input
                        type="number"
                        value={currentConfig.packingSupplies.blanket50Price}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            packingSupplies: {
                              ...currentConfig.packingSupplies,
                              blanket50Price: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-2 py-1 rounded-lg border font-mono font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">100 Pack ($)</label>
                      <input
                        type="number"
                        value={currentConfig.packingSupplies.blanket100Price}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            packingSupplies: {
                              ...currentConfig.packingSupplies,
                              blanket100Price: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-2 py-1 rounded-lg border font-mono font-bold text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Domestic Leg Rate */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-white">
              <h4 className="font-extrabold text-sm text-[#0b2942] mb-1">
                Standard Domestic Transport Leg Fee
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Applies per one-way transport leg ($149 per leg: Initial delivery to A, Move A to B, Return to Portabox depot, Redelivery, Final collection).
              </p>
              <div className="max-w-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-600">$</span>
                  <input
                    type="number"
                    value={currentConfig.domesticLegFee}
                    onChange={(e) =>
                      setCurrentConfig({
                        ...currentConfig,
                        domesticLegFee: Number(e.target.value),
                      })
                    }
                    className="w-32 px-3 py-2 rounded-xl border border-slate-300 text-base font-bold font-mono"
                  />
                  <span className="text-xs text-slate-500">per domestic leg</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: DELIVERY ZONES & KM CHARGES ================= */}
        {activeTab === 'zones' && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="text-lg font-extrabold text-[#0b2942]">Delivery Zones & Moving Km Surcharges</h3>
              <p className="text-xs text-slate-500">
                Configure distance thresholds from the Portabox depots and rate per km (calculated on a one-way basis).
              </p>
            </div>

            <div className="space-y-4">
              {/* Zone 1 */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-[#00c0f3] uppercase tracking-wider">Zone 1</span>
                  <h4 className="font-bold text-sm text-[#0b2942]">Metro Base Radius</h4>
                  <p className="text-xs text-slate-500">Free delivery distance radius</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <label className="text-[10px] text-slate-400 block">Max Distance</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={currentConfig.deliveryZones.zone1MaxKm}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            deliveryZones: {
                              ...currentConfig.deliveryZones,
                              zone1MaxKm: Number(e.target.value),
                            },
                          })
                        }
                        className="w-16 px-2 py-1 rounded-lg border text-xs font-bold font-mono"
                      />
                      <span className="text-xs text-slate-500">km</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <label className="text-[10px] text-slate-400 block">Rate / Km</label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold">$</span>
                      <input
                        type="number"
                        value={currentConfig.deliveryZones.zone1RatePerKm}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            deliveryZones: {
                              ...currentConfig.deliveryZones,
                              zone1RatePerKm: Number(e.target.value),
                            },
                          })
                        }
                        className="w-16 px-2 py-1 rounded-lg border text-xs font-bold font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Zone 2 */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-[#00c0f3] uppercase tracking-wider">Zone 2</span>
                  <h4 className="font-bold text-sm text-[#0b2942]">Outer Metro & Semi-Rural</h4>
                  <p className="text-xs text-slate-500">Intermediate delivery zone</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <label className="text-[10px] text-slate-400 block">Max Distance</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={currentConfig.deliveryZones.zone2MaxKm}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            deliveryZones: {
                              ...currentConfig.deliveryZones,
                              zone2MaxKm: Number(e.target.value),
                            },
                          })
                        }
                        className="w-16 px-2 py-1 rounded-lg border text-xs font-bold font-mono"
                      />
                      <span className="text-xs text-slate-500">km</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <label className="text-[10px] text-slate-400 block">Rate / Km</label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold">$</span>
                      <input
                        type="number"
                        value={currentConfig.deliveryZones.zone2RatePerKm}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            deliveryZones: {
                              ...currentConfig.deliveryZones,
                              zone2RatePerKm: Number(e.target.value),
                            },
                          })
                        }
                        className="w-16 px-2 py-1 rounded-lg border text-xs font-bold font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Zone 3 */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-[#00c0f3] uppercase tracking-wider">Zone 3</span>
                  <h4 className="font-bold text-sm text-[#0b2942]">Regional Australia</h4>
                  <p className="text-xs text-slate-500">Longer distance regional transit</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <label className="text-[10px] text-slate-400 block">Max Distance</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={currentConfig.deliveryZones.zone3MaxKm}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            deliveryZones: {
                              ...currentConfig.deliveryZones,
                              zone3MaxKm: Number(e.target.value),
                            },
                          })
                        }
                        className="w-16 px-2 py-1 rounded-lg border text-xs font-bold font-mono"
                      />
                      <span className="text-xs text-slate-500">km</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <label className="text-[10px] text-slate-400 block">Rate / Km</label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold">$</span>
                      <input
                        type="number"
                        value={currentConfig.deliveryZones.zone3RatePerKm}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            deliveryZones: {
                              ...currentConfig.deliveryZones,
                              zone3RatePerKm: Number(e.target.value),
                            },
                          })
                        }
                        className="w-16 px-2 py-1 rounded-lg border text-xs font-bold font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Zone 4 */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Zone 4 (300+ km)</span>
                  <h4 className="font-bold text-sm text-[#0b2942]">Call for Custom Pricing</h4>
                  <p className="text-xs text-slate-500">Routes over 300km prompt user to call 1800 467 637</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentConfig.deliveryZones.zone4CallPricing}
                    onChange={(e) =>
                      setCurrentConfig({
                        ...currentConfig,
                        deliveryZones: {
                          ...currentConfig.deliveryZones,
                          zone4CallPricing: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded text-[#00c0f3]"
                  />
                  <span className="text-xs font-bold text-slate-700">Enabled</span>
                </label>
              </div>
            </div>

            {/* Fuel Surcharge Configuration ($0.50/km travelled) - Blue lettering, no yellow, only set by Portabox admin */}
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/70 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-extrabold text-blue-700">Fuel Surcharge Setting</h4>
                  <p className="text-xs text-blue-800/80">
                    Surcharge assessed per km travelled (driving distance) on road routes and moves. Only set by Portabox admin (not optional for customers).
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer self-start sm:self-auto">
                  <input
                    type="checkbox"
                    checked={currentConfig.fuelSurchargeEnabled !== false}
                    onChange={(e) =>
                      setCurrentConfig({
                        ...currentConfig,
                        fuelSurchargeEnabled: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-bold text-blue-900">Active (Included in Quotes)</span>
                </label>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-blue-900">Surcharge rate per km:</label>
                <div className="relative w-32">
                  <span className="absolute left-3 top-2 text-xs font-bold text-blue-400">$</span>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    value={currentConfig.fuelSurchargeRatePerKm || 0.50}
                    onChange={(e) =>
                      setCurrentConfig({
                        ...currentConfig,
                        fuelSurchargeRatePerKm: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full pl-6 pr-3 py-1.5 text-xs font-bold font-mono rounded-lg border border-blue-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-blue-950"
                  />
                </div>
                <span className="text-xs text-blue-700 font-medium">/ km travelled</span>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: INTERSTATE LEGS ================= */}
        {activeTab === 'interstate' && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h3 className="text-lg font-extrabold text-[#0b2942]">Interstate Freight Legs (One-way)</h3>
              <p className="text-xs text-slate-500">
                Fixed line-haul freight prices between major Australian capitals and coastal corridors.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {Object.entries(currentConfig.interstateRates).map(([route, rate]) => (
                <div
                  key={route}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#00c0f3]" />
                    <span className="text-xs font-bold text-slate-800">
                      {route.replace('->', ' → ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-600">$</span>
                    <input
                      type="number"
                      value={rate}
                      onChange={(e) =>
                        setCurrentConfig({
                          ...currentConfig,
                          interstateRates: {
                            ...currentConfig.interstateRates,
                            [route]: Number(e.target.value),
                          },
                        })
                      }
                      className="w-20 px-2 py-1 rounded-lg border text-xs font-bold font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 5: PROMOTIONS ENGINE ================= */}
        {activeTab === 'promotions' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-extrabold text-[#0b2942]">Active Promotions & Radius Rules</h3>
                <p className="text-xs text-slate-500">
                  Target promotions by postcode, radius, route (e.g. Adelaide to Brisbane), container size, or coupon code.
                </p>
              </div>

              <button
                onClick={() => setIsAddingPromo(!isAddingPromo)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#00c0f3] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingPromo ? 'Cancel' : 'Create Promotion'}</span>
              </button>
            </div>

            {/* Create Promo Card */}
            {isAddingPromo && (
              <div className="p-5 rounded-2xl bg-sky-50/80 border border-sky-200 space-y-4">
                <h4 className="font-extrabold text-sm text-[#0b2942]">New Promotional Rule</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Promo Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Free Delivery Special"
                      value={newPromo.name}
                      onChange={(e) => setNewPromo({ ...newPromo, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border bg-white text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Promo Code (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. FREEDEL"
                      value={newPromo.code}
                      onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-xl border bg-white text-xs font-semibold uppercase"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Promo Type</label>
                    <select
                      value={newPromo.type}
                      onChange={(e) => setNewPromo({ ...newPromo, type: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border bg-white text-xs font-semibold"
                    >
                      <option value="free_initial_delivery">Initial Delivery Free ($149)</option>
                      <option value="percent_off_first_month">% Off First Month Storage</option>
                      <option value="free_first_month">First Month Free</option>
                      <option value="free_third_month">Third Month Free</option>
                      <option value="percent_off_interstate">% Off Interstate Move</option>
                      <option value="free_container_upgrade">Free Upgrade to Larger Container</option>
                      <option value="fixed_discount">Fixed Dollar Discount ($)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Value (% or $)</label>
                    <input
                      type="number"
                      value={newPromo.value}
                      onChange={(e) => setNewPromo({ ...newPromo, value: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border bg-white text-xs font-semibold font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Target Postcode (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 5061 or empty for all"
                      value={newPromo.targetPostcode}
                      onChange={(e) => setNewPromo({ ...newPromo, targetPostcode: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border bg-white text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Target Radius (Km)</label>
                    <input
                      type="number"
                      placeholder="e.g. 50"
                      value={newPromo.targetRadiusKm}
                      onChange={(e) => setNewPromo({ ...newPromo, targetRadiusKm: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border bg-white text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPromo.autoApply}
                      onChange={(e) => setNewPromo({ ...newPromo, autoApply: e.target.checked })}
                      className="w-4 h-4 rounded text-[#00c0f3]"
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      Auto-apply without requiring coupon code
                    </span>
                  </label>

                  <button
                    onClick={() => {
                      if (!newPromo.name) {
                        alert('Please provide a promo name.');
                        return;
                      }
                      const created: PromotionRule = {
                        id: `promo-${Date.now()}`,
                        name: newPromo.name || 'Special Promo',
                        code: newPromo.code,
                        description: newPromo.description || newPromo.name || '',
                        type: newPromo.type || 'percent_off_first_month',
                        value: newPromo.value || 50,
                        targetPostcode: newPromo.targetPostcode || undefined,
                        targetRadiusKm: newPromo.targetRadiusKm || undefined,
                        active: true,
                        autoApply: newPromo.autoApply || false,
                      };
                      setCurrentConfig({
                        ...currentConfig,
                        promotions: [created, ...currentConfig.promotions],
                      });
                      setIsAddingPromo(false);
                    }}
                    className="px-5 py-2 bg-[#0b2942] text-white rounded-xl text-xs font-bold"
                  >
                    Save Promotion
                  </button>
                </div>
              </div>
            )}

            {/* List of existing promos */}
            <div className="space-y-3">
              {currentConfig.promotions.map((promo) => (
                <div
                  key={promo.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    promo.active ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-[#0b2942]">{promo.name}</span>
                      {promo.code && (
                        <span className="px-2 py-0.5 rounded bg-sky-50 text-[#00c0f3] font-mono font-bold text-[10px] border border-sky-100">
                          {promo.code}
                        </span>
                      )}
                      {promo.autoApply && (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                          Auto-applied
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{promo.description}</p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                      <span>Type: {promo.type.replace(/_/g, ' ')}</span>
                      {promo.targetPostcode && <span>• Target Postcode: {promo.targetPostcode} ({promo.targetRadiusKm}km)</span>}
                      {promo.targetHubOrigin && <span>• Route: {promo.targetHubOrigin} → {promo.targetHubDestination}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <button
                      onClick={() => {
                        const updated = currentConfig.promotions.map((p) =>
                          p.id === promo.id ? { ...p, active: !p.active } : p
                        );
                        setCurrentConfig({ ...currentConfig, promotions: updated });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        promo.active
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {promo.active ? 'Active' : 'Inactive'}
                    </button>

                    <button
                      onClick={() => {
                        const updated = currentConfig.promotions.filter((p) => p.id !== promo.id);
                        setCurrentConfig({ ...currentConfig, promotions: updated });
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 6: BLOCKED POSTCODES ================= */}
        {activeTab === 'blocked' && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="text-lg font-extrabold text-[#0b2942]">Blocked & Restricted Postcodes</h3>
              <p className="text-xs text-slate-500">
                Block specific postcodes not serviceable by Portabox (e.g. island ferries, inaccessible regional roads).
              </p>
            </div>

            {/* Add new blocked postcode */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Postcode (e.g. 5222)"
                value={newBlocked.postcode}
                onChange={(e) => setNewBlocked({ ...newBlocked, postcode: e.target.value })}
                className="w-full sm:w-28 px-3 py-2 rounded-xl border bg-white text-xs font-semibold"
              />
              <input
                type="text"
                placeholder="Suburb name (e.g. Kangaroo Island)"
                value={newBlocked.suburb}
                onChange={(e) => setNewBlocked({ ...newBlocked, suburb: e.target.value })}
                className="w-full sm:w-44 px-3 py-2 rounded-xl border bg-white text-xs font-semibold"
              />
              <input
                type="text"
                placeholder="Reason (e.g. Ferry required; call dispatch)"
                value={newBlocked.reason}
                onChange={(e) => setNewBlocked({ ...newBlocked, reason: e.target.value })}
                className="flex-1 px-3 py-2 rounded-xl border bg-white text-xs font-semibold"
              />
              <button
                onClick={() => {
                  if (!newBlocked.postcode.trim()) return;
                  setCurrentConfig({
                    ...currentConfig,
                    blockedPostcodes: [newBlocked, ...currentConfig.blockedPostcodes],
                  });
                  setNewBlocked({ postcode: '', suburb: '', reason: '' });
                }}
                className="px-4 py-2 bg-[#0b2942] text-white rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap"
              >
                Add Block
              </button>
            </div>

            {/* List */}
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
              {currentConfig.blockedPostcodes.map((b) => (
                <div key={b.postcode} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm font-mono text-[#0b2942]">{b.postcode}</span>
                      <span className="font-bold text-xs text-slate-700">{b.suburb}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{b.reason}</p>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentConfig({
                        ...currentConfig,
                        blockedPostcodes: currentConfig.blockedPostcodes.filter(
                          (item) => item.postcode !== b.postcode
                        ),
                      });
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 7: DEPOT LOCATIONS ================= */}
        {activeTab === 'depots' && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="text-lg font-extrabold text-[#0b2942]">Active Portabox Depot Hubs</h3>
              <p className="text-xs text-slate-500">
                Operating facilities where Portabox container trucks and customer containers are dispatched from.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PORTABOX_DEPOTS.map((depot) => (
                <div key={depot.id} className="p-5 rounded-2xl border border-slate-200 bg-white space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-sky-50 text-[#00c0f3]">
                      {depot.state} Hub
                    </span>
                    <span className="font-mono text-xs text-slate-400">{depot.postcode}</span>
                  </div>
                  <h4 className="font-extrabold text-base text-[#0b2942]">{depot.name}</h4>
                  <p className="text-xs text-slate-600">
                    {depot.address}, {depot.suburb} {depot.state} {depot.postcode}
                  </p>
                  <p className="text-xs text-slate-400 font-mono">
                    Lat: {depot.lat} · Lng: {depot.lng}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer reset button */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        <span>Portabox Instant Quote Engine v2.4</span>
        <button
          onClick={handleResetDefaults}
          className="flex items-center gap-1 text-slate-400 hover:text-slate-700 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset all to factory defaults</span>
        </button>
      </div>
    </div>
  );
};
