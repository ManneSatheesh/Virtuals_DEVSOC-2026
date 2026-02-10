import { useState } from 'react';
import { Bell, Globe, Shield, Save, Settings as SettingsIcon, Check } from 'lucide-react';

export default function Settings() {
  const [notifs, setNotifs] = useState('both');
  const [lang, setLang] = useState('en');
  const [consent, setConsent] = useState(true);
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-10 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-orange-400 rounded-2xl flex items-center justify-center shadow-warm">
          <SettingsIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-text-main tracking-tight">Settings</h1>
          <p className="mt-1 text-text-muted font-medium">
            Manage your preferences and privacy.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Notifications */}
        <SettingsGroup icon={<Bell className="w-5 h-5 text-primary" />} title="Notifications">
          <div className="space-y-3">
            {[
              { value: 'morning', label: 'Morning check-in' },
              { value: 'evening', label: 'Evening check-in' },
              { value: 'both', label: 'Both' },
              { value: 'off', label: 'No reminders' },
            ].map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-4 cursor-pointer p-3 rounded-2xl transition-all ${
                  notifs === opt.value ? 'bg-accent-orange border-2 border-primary' : 'border-2 border-transparent hover:bg-orange-50'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  notifs === opt.value ? 'border-primary bg-primary' : 'border-orange-300'
                }`}>
                  {notifs === opt.value && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-base font-medium text-text-main">{opt.label}</span>
              </label>
            ))}
          </div>
        </SettingsGroup>

        {/* Language */}
        <SettingsGroup icon={<Globe className="w-5 h-5 text-primary" />} title="Language">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="border-2 border-orange-200 rounded-2xl px-4 py-3 text-base font-medium w-full focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
          >
            <option value="en">English</option>
            <option value="ta">Tamil</option>
            <option value="hi">Hindi</option>
            <option value="es">Spanish</option>
          </select>
        </SettingsGroup>

        {/* Consent */}
        <SettingsGroup icon={<Shield className="w-5 h-5 text-primary" />} title="Privacy & Consent">
          <label className={`flex items-start gap-4 cursor-pointer p-4 rounded-2xl transition-all ${
            consent ? 'bg-green-50 border-2 border-green-200' : 'bg-orange-50 border-2 border-orange-200'
          }`}>
            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 mt-0.5 ${
              consent ? 'border-green-500 bg-green-500' : 'border-orange-300'
            }`}>
              {consent && <Check className="w-4 h-4 text-white" />}
            </div>
            <span className="text-base text-text-main leading-relaxed">
              I agree to have my conversations stored securely for personalized
              support. I understand this is not a medical service.
            </span>
          </label>
          <button onClick={() => setConsent(!consent)} className="hidden" />
        </SettingsGroup>

        {/* Save */}
        <button
          onClick={save}
          className={`flex items-center gap-3 px-10 py-4 rounded-full text-base font-bold shadow-warm-lg transition-all cursor-pointer ${
            saved
              ? 'bg-green-500 text-white'
              : 'bg-gradient-to-r from-primary to-orange-400 hover:from-primary-dark hover:to-primary text-white'
          }`}
        >
          {saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

function SettingsGroup({ icon, title, children }) {
  return (
    <div className="bg-white border-2 border-orange-100 rounded-3xl p-7 shadow-warm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-accent-orange rounded-xl flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-lg font-bold text-text-main">{title}</h3>
      </div>
      {children}
    </div>
  );
}
