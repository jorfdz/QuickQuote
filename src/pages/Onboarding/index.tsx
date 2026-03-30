import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, ArrowLeft, Building2, Package, Wrench, Users, Zap } from 'lucide-react';
import { Button, Input, Textarea } from '../../components/ui';
import { useStore } from '../../store';

const STEPS = ['Shop Profile', 'Product Lines', 'Equipment', 'Team', 'Integrations', 'Done!'];

const PRODUCT_LINE_OPTIONS = [
  { id: 'digital_print', label: 'Digital Print', icon: '🖨️', desc: 'Business cards, flyers, postcards, brochures' },
  { id: 'offset_print', label: 'Offset Print', icon: '🗞️', desc: 'High-volume commercial printing' },
  { id: 'wide_format', label: 'Wide Format', icon: '🖼️', desc: 'Banners, wraps, canvas, fabric' },
  { id: 'rigid_sign', label: 'Rigid Signs', icon: '🪧', desc: 'Coroplast, aluminum, foam board, PVC' },
  { id: 'roll_sign', label: 'Roll / Vinyl', icon: '🎌', desc: 'Cut vinyl, decals, window vinyl' },
  { id: 'label', label: 'Labels & Stickers', icon: '🏷️', desc: 'Custom labels, stickers, roll labels' },
  { id: 'apparel', label: 'Apparel', icon: '👕', desc: 'Screen print, embroidery, DTG, DTF' },
  { id: 'finishing', label: 'Finishing', icon: '✂️', desc: 'Laminating, cutting, binding, folding' },
  { id: 'installation', label: 'Installation', icon: '🔧', desc: 'Sign installation, mounting, delivery' },
  { id: 'outsourced', label: 'Outsourced / Trade', icon: '🏭', desc: 'Buyout, trade items, outsourced production' },
];

const EQUIPMENT_OPTIONS = [
  { id: 'hp_indigo', label: 'HP Indigo Digital Press', category: 'Digital' },
  { id: 'hp_latex', label: 'HP Latex Wide Format', category: 'Wide Format' },
  { id: 'mimaki', label: 'Mimaki Wide Format', category: 'Wide Format' },
  { id: 'roland', label: 'Roland Print & Cut', category: 'Wide Format' },
  { id: 'epson_dye_sub', label: 'Epson Dye Sublimation', category: 'Specialty' },
  { id: 'graphtec', label: 'Graphtec Vinyl Cutter', category: 'Finishing' },
  { id: 'summa', label: 'Summa Cutter / Router', category: 'Finishing' },
  { id: 'offset_2clr', label: 'Offset Press (2-color)', category: 'Offset' },
  { id: 'offset_4clr', label: 'Offset Press (4-color)', category: 'Offset' },
  { id: 'laminator', label: 'Laminator', category: 'Finishing' },
  { id: 'embroidery', label: 'Embroidery Machine', category: 'Apparel' },
  { id: 'dtg', label: 'DTG Printer', category: 'Apparel' },
  { id: 'screen_print', label: 'Screen Print Press', category: 'Apparel' },
  { id: 'uv_flatbed', label: 'UV Flatbed Printer', category: 'Specialty' },
  { id: 'laser_cutter', label: 'Laser Cutter / Engraver', category: 'Specialty' },
];

const INTEGRATION_OPTIONS = [
  { id: 'planprophet', label: 'PlanProphet', icon: '🎯', desc: 'CRM, analytics & business intelligence', recommended: true },
  { id: 'quickbooks', label: 'QuickBooks', icon: '💚', desc: 'Accounting & financial sync', recommended: true },
  { id: 'asi', label: 'ASI / SAGE', icon: '🛍️', desc: 'Promotional products search & ordering' },
  { id: 'onprintshop', label: 'OnPrintShop', icon: '🌐', desc: 'Web-to-print storefront' },
  { id: 'presero', label: 'Presero', icon: '🔵', desc: 'B2B online print portal' },
];

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useStore();
  const [step, setStep] = useState(0);

  // Step 1: Shop Profile
  const [profile, setProfile] = useState({
    shopName: '', address: '', city: '', state: '', zip: '', phone: '', email: '', website: '',
    taxRate: '7', currency: 'USD', timezone: 'America/New_York',
  });

  // Step 2: Product Lines
  const [selectedProducts, setSelectedProducts] = useState<string[]>(['digital_print', 'wide_format']);

  // Step 3: Equipment
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);

  // Step 4: Team
  const [teamSize, setTeamSize] = useState('1-5');
  const [roles, setRoles] = useState<string[]>(['estimator', 'production']);

  // Step 5: Integrations
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>(['planprophet']);

  const toggleItem = (arr: string[], setArr: (v: string[]) => void, id: string) => {
    setArr(arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]);
  };

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep(s => Math.max(s - 1, 0));

  const equipmentByCategory = EQUIPMENT_OPTIONS.reduce<Record<string, typeof EQUIPMENT_OPTIONS>>((acc, eq) => {
    if (!acc[eq.category]) acc[eq.category] = [];
    acc[eq.category].push(eq);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow">
            <span className="text-white font-black text-sm">QQ</span>
          </div>
          <span className="font-black text-xl text-gray-900 tracking-tight">QuikQuote</span>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8 px-4">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < step ? 'bg-green-500 text-white' :
                  i === step ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-[10px] font-medium hidden sm:block ${i === step ? 'text-blue-600' : i < step ? 'text-green-600' : 'text-gray-400'}`}>
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Step Content */}
          <div className="p-8">

            {/* Step 0: Shop Profile */}
            {step === 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Welcome, {currentUser.name.split(' ')[0]}!</h2>
                    <p className="text-sm text-gray-500">Let's set up your shop profile</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <Input label="Shop / Company Name" value={profile.shopName} onChange={e => setProfile(p => ({ ...p, shopName: e.target.value }))} placeholder="Acme Print & Sign Co." />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Email" type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />
                    <Input label="Phone" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <Input label="Address" value={profile.address} onChange={e => setProfile(p => ({ ...p, address: e.target.value }))} />
                  <div className="grid grid-cols-3 gap-3">
                    <Input label="City" value={profile.city} onChange={e => setProfile(p => ({ ...p, city: e.target.value }))} />
                    <Input label="State" value={profile.state} onChange={e => setProfile(p => ({ ...p, state: e.target.value }))} />
                    <Input label="ZIP" value={profile.zip} onChange={e => setProfile(p => ({ ...p, zip: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Website" value={profile.website} onChange={e => setProfile(p => ({ ...p, website: e.target.value }))} placeholder="https://..." />
                    <Input label="Default Tax Rate (%)" type="number" value={profile.taxRate} onChange={e => setProfile(p => ({ ...p, taxRate: e.target.value }))} suffix="%" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Product Lines */}
            {step === 1 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Package className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">What do you produce?</h2>
                    <p className="text-sm text-gray-500">Select all product lines your shop offers</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {PRODUCT_LINE_OPTIONS.map(pl => (
                    <button
                      key={pl.id}
                      onClick={() => toggleItem(selectedProducts, setSelectedProducts, pl.id)}
                      className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                        selectedProducts.includes(pl.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <span className="text-2xl">{pl.icon}</span>
                      <div>
                        <div className={`text-sm font-semibold ${selectedProducts.includes(pl.id) ? 'text-blue-700' : 'text-gray-800'}`}>{pl.label}</div>
                        <div className="text-xs text-gray-500">{pl.desc}</div>
                      </div>
                      {selectedProducts.includes(pl.id) && (
                        <CheckCircle className="w-4 h-4 text-blue-600 ml-auto shrink-0 mt-0.5" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Equipment */}
            {step === 2 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Wrench className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Your Equipment</h2>
                    <p className="text-sm text-gray-500">What equipment do you have in-house?</p>
                  </div>
                </div>
                <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                  {Object.entries(equipmentByCategory).map(([cat, items]) => (
                    <div key={cat}>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{cat}</div>
                      <div className="space-y-1">
                        {items.map(eq => (
                          <button
                            key={eq.id}
                            onClick={() => toggleItem(selectedEquipment, setSelectedEquipment, eq.id)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-all text-sm ${
                              selectedEquipment.includes(eq.id)
                                ? 'border-blue-400 bg-blue-50 text-blue-800 font-medium'
                                : 'border-gray-200 hover:border-gray-300 text-gray-700'
                            }`}
                          >
                            {eq.label}
                            {selectedEquipment.includes(eq.id) && <CheckCircle className="w-4 h-4 text-blue-500" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-3">You can add custom equipment later in Settings → Equipment</p>
              </div>
            )}

            {/* Step 3: Team */}
            {step === 3 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Your Team</h2>
                    <p className="text-sm text-gray-500">Tell us about your team size and roles needed</p>
                  </div>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="label">Team Size</label>
                    <div className="grid grid-cols-4 gap-2 mt-1">
                      {['1-5', '6-15', '16-50', '50+'].map(size => (
                        <button key={size} onClick={() => setTeamSize(size)}
                          className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all ${teamSize === size ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label">Roles You Need</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {['admin', 'manager', 'csr', 'estimator', 'sales', 'production', 'accounting'].map(role => (
                        <button key={role} onClick={() => toggleItem(roles, setRoles, role)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm capitalize transition-all ${
                            roles.includes(role) ? 'border-blue-400 bg-blue-50 text-blue-800 font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}>
                          {roles.includes(role) && <CheckCircle className="w-3.5 h-3.5 text-blue-500" />}
                          {role === 'csr' ? 'CSR' : role.charAt(0).toUpperCase() + role.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Integrations */}
            {step === 4 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <Zap className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Integrations</h2>
                    <p className="text-sm text-gray-500">Connect your existing tools</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {INTEGRATION_OPTIONS.map(intg => (
                    <button
                      key={intg.id}
                      onClick={() => toggleItem(selectedIntegrations, setSelectedIntegrations, intg.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                        selectedIntegrations.includes(intg.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl">{intg.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${selectedIntegrations.includes(intg.id) ? 'text-blue-700' : 'text-gray-800'}`}>{intg.label}</span>
                          {intg.recommended && <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full uppercase">Recommended</span>}
                        </div>
                        <span className="text-xs text-gray-500">{intg.desc}</span>
                      </div>
                      {selectedIntegrations.includes(intg.id) && <CheckCircle className="w-5 h-5 text-blue-600 shrink-0" />}
                    </button>
                  ))}
                  <p className="text-xs text-gray-400 pt-2">You can configure API keys for integrations later in Settings → Integrations</p>
                </div>
              </div>
            )}

            {/* Step 5: Done */}
            {step === 5 && (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">You're all set! 🎉</h2>
                <p className="text-gray-500 mb-6 text-sm">QuikQuote is configured for your shop. Here's a summary of what we've set up:</p>
                <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 mb-6">
                  {profile.shopName && <div className="flex items-center gap-2 text-sm"><span className="text-green-500">✓</span> <span className="font-medium">{profile.shopName}</span></div>}
                  <div className="flex items-center gap-2 text-sm"><span className="text-green-500">✓</span> <span>{selectedProducts.length} product lines enabled</span></div>
                  <div className="flex items-center gap-2 text-sm"><span className="text-green-500">✓</span> <span>{selectedEquipment.length} equipment items configured</span></div>
                  <div className="flex items-center gap-2 text-sm"><span className="text-green-500">✓</span> <span>{roles.length} user roles enabled · {teamSize} team members</span></div>
                  <div className="flex items-center gap-2 text-sm"><span className="text-green-500">✓</span> <span>{selectedIntegrations.length} integrations selected</span></div>
                </div>
                <p className="text-xs text-gray-400">You can update any of these settings at any time in the Settings section.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            {step > 0 && step < 5 ? (
              <Button variant="ghost" icon={<ArrowLeft className="w-4 h-4" />} onClick={back}>Back</Button>
            ) : <div />}

            {step < 5 ? (
              <Button variant="primary" onClick={next} icon={<ArrowRight className="w-4 h-4" />} >
                {step === 4 ? 'Finish Setup' : 'Continue'}
              </Button>
            ) : (
              <Button variant="primary" onClick={() => navigate('/')} icon={<ArrowRight className="w-4 h-4" />} >
                Go to Dashboard
              </Button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">QuikQuote MIS · Built for print & sign shops · Powered by PlanProphet</p>
      </div>
    </div>
  );
};
