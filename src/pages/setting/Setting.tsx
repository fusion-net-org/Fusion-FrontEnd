import { useState } from 'react';
import {
  Shield,
  Bell,
  Palette,
  Save,
  User,
  Mail,
  Moon,
  Sun,
  Sliders,
  Languages,
  KeyRound,
  LockKeyhole,
  RotateCcwKey,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

// General Settings
const GeneralSettings = () => {
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language || 'en');

  const handleSaveLanguage = () => {
    i18n.changeLanguage(language);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('settings.general')}</h3>
        <p className="text-sm text-gray-600 mb-6">{t('settings.general_desc')}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Languages className="inline w-4 h-4 mr-2" />
            {t('settings.language')}
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full md:w-1/4 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="en">English</option>
            <option value="vi">Tiếng Việt</option>
          </select>
        </div>

        <button
          onClick={handleSaveLanguage}
          className="mt-4 w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save className="inline w-4 h-4 mr-2" />
          {t('settings.save')}
        </button>
      </div>
    </div>
  );
};

// Security Settings
const SecuritySettings = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('settings.security')}</h3>
        <p className="text-sm text-gray-600 mb-6">{t('settings.security_desc')}</p>
      </div>

      <div className="space-y-4">
        {[
          {
            label: t('settings.current_password'),
            icon: <KeyRound className="inline w-4 h-4 mr-2" />,
            value: currentPassword,
            set: setCurrentPassword,
          },
          {
            label: t('settings.new_password'),
            icon: <LockKeyhole className="inline w-4 h-4 mr-2" />,
            value: newPassword,
            set: setNewPassword,
          },
          {
            label: t('settings.confirm_password'),
            icon: <RotateCcwKey className="inline w-4 h-4 mr-2" />,
            value: confirmPassword,
            set: setConfirmPassword,
          },
        ].map((field, i) => (
          <div key={i}>
            <label className="block text-sm font-medium text-gray-700">
              {field.icon}
              {field.label}
            </label>
            <input
              type="password"
              value={field.value}
              onChange={(e) => field.set(e.target.value)}
              className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        ))}

        <button className="mt-4 w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Save className="inline w-4 h-4 mr-2" />
          {t('settings.update')}
        </button>
      </div>
    </div>
  );
};

// Notification Settings
const NotificationSettings = () => {
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [activeNotifs, setActiveNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(false);
  const { t } = useTranslation();

  const toggleSwitch = (value: boolean, set: any) => (
    <button
      onClick={() => set(!value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        value ? 'bg-blue-600' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          value ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('settings.notification')}</h3>
        <p className="text-sm text-gray-600 mb-6">{t('settings.notification_desc')}</p>
      </div>

      {[
        {
          title: t('settings.activate_notifications.title'),
          desc: t('settings.activate_notifications.desc'),
          value: activeNotifs,
          set: setActiveNotifs,
        },
        {
          title: t('settings.email_notifications.title'),
          desc: t('settings.email_notifications.desc'),
          value: emailNotifs,
          set: setEmailNotifs,
        },
        {
          title: t('settings.sms_notifications.title'),
          desc: t('settings.sms_notifications.desc'),
          value: smsNotifs,
          set: setSmsNotifs,
        },
      ].map((item, i) => (
        <div
          key={i}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg"
        >
          <div className="mb-2 sm:mb-0">
            <p className="font-medium text-gray-800">{item.title}</p>
            <p className="text-sm text-gray-600">{item.desc}</p>
          </div>
          {toggleSwitch(item.value, item.set)}
        </div>
      ))}

      <button className="mt-4 w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        <Save className="inline w-4 h-4 mr-2" />
        {t('settings.save')}
      </button>
    </div>
  );
};

// Appearance Settings
const AppearanceSettings = () => {
  const [theme, setTheme] = useState('light');
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('settings.appearance')}</h3>
        <p className="text-sm text-gray-600 mb-6">{t('settings.appearance_desc')}</p>
      </div>
      {/* Theme selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Palette className="inline w-4 h-4 mr-2" />
          {t('settings.theme')}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { key: 'light', icon: Sun, color: 'text-yellow-500', label: t('settings.theme_light') },
            { key: 'dark', icon: Moon, color: 'text-indigo-600', label: t('settings.theme_dark') },
          ].map(({ key, icon: Icon, color, label }) => (
            <button
              key={key}
              onClick={() => setTheme(key)}
              className={`p-4 border-2 rounded-lg transition-all ${
                theme === key
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Icon className={`w-6 h-6 mx-auto mb-2 ${color}`} />
              <p className="text-sm font-medium">{label}</p>
            </button>
          ))}
        </div>
      </div>

      <button className="mt-4 w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        <Save className="inline w-4 h-4 mr-2" />
        {t('settings.save')}
      </button>
    </div>
  );
};

// Settings Page
const Settings = () => {
  const { t } = useTranslation();
  const tabs = [
    {
      key: 'general',
      label: t('settings.general_title'),
      icon: Sliders,
      component: <GeneralSettings />,
    },
    {
      key: 'security',
      label: t('settings.security_title'),
      icon: Shield,
      component: <SecuritySettings />,
    },
    {
      key: 'notifications',
      label: t('settings.notification_title'),
      icon: Bell,
      component: <NotificationSettings />,
    },
    {
      key: 'appearance',
      label: t('settings.appearance_title'),
      icon: Palette,
      component: <AppearanceSettings />,
    },
  ];

  const [activeTab, setActiveTab] = useState('general');
  const activeComponent = tabs.find((t) => t.key === activeTab)?.component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 sm:py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {t('settings.title')}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">{t('settings.sub_title')}</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200 overflow-x-auto">
            <div className="flex min-w-max sm:min-w-0">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 font-medium transition-all whitespace-nowrap ${
                      activeTab === tab.key
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6 sm:p-8">{activeComponent}</div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
