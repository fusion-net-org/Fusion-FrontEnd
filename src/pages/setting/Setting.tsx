import { useEffect, useState } from 'react';
import {
  Shield,
  Bell,
  Palette,
  Save,
  Languages,
  KeyRound,
  LockKeyhole,
  RotateCcwKey,
  Sliders,
  Moon,
  Sun,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { changePassword } from '@/services/userService.js';

/* ========================= GENERAL SETTINGS ========================= */
const GeneralSettings = () => {
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language || 'en');

  const handleSaveLanguage = () => {
    i18n.changeLanguage(language);
    toast.success('Language changed successfully');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {t('settings.general')}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {t('settings.general_desc')}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Languages className="inline w-4 h-4 mr-2" />
            {t('settings.language')}
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full md:w-1/3 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="en">English</option>
            <option value="vi">Tiếng Việt</option>
          </select>
        </div>

        <button
          onClick={handleSaveLanguage}
          className="mt-4 w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors"
        >
          <Save className="inline w-4 h-4 mr-2" />
          {t('settings.save')}
        </button>
      </div>
    </div>
  );
};

/* ========================= SECURITY SETTINGS ========================= */
const SecuritySettings = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }

    setIsLoading(true);
    try {
      await changePassword({
        oldPassword: currentPassword,
        newPassword,
        confirmPassword,
      });
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Change password failed';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const fields = [
    {
      label: t('settings.current_password'),
      icon: KeyRound,
      value: currentPassword,
      set: setCurrentPassword,
    },
    {
      label: t('settings.new_password'),
      icon: LockKeyhole,
      value: newPassword,
      set: setNewPassword,
    },
    {
      label: t('settings.confirm_password'),
      icon: RotateCcwKey,
      value: confirmPassword,
      set: setConfirmPassword,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {t('settings.security')}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {t('settings.security_desc')}
        </p>
      </div>

      {fields.map((field, i) => (
        <div key={i}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
            <field.icon className="inline w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
            {field.label}
          </label>
          <input
            type="password"
            value={field.value}
            onChange={(e) => field.set(e.target.value)}
            className="w-full md:w-1/2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      ))}

      <button
        onClick={handleChangePassword}
        disabled={isLoading}
        className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-500 transition-all flex items-center ${
          isLoading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <Save className="w-4 h-4 mr-2" />
        {isLoading ? t('settings.updating') : t('settings.update')}
      </button>
    </div>
  );
};

/* ========================= NOTIFICATION SETTINGS ========================= */
const NotificationSettings = () => {
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [activeNotifs, setActiveNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(false);
  const { t } = useTranslation();

  const Toggle = (value: boolean, set: any) => (
    <button
      onClick={() => set(!value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        value ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          value ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  const notifs = [
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
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {t('settings.notification')}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {t('settings.notification_desc')}
        </p>
      </div>

      {notifs.map((n, i) => (
        <div
          key={i}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/70"
        >
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{n.title}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{n.desc}</p>
          </div>
          {Toggle(n.value, n.set)}
        </div>
      ))}

      <button className="mt-4 w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors">
        <Save className="inline w-4 h-4 mr-2" />
        {t('settings.save')}
      </button>
    </div>
  );
};

/* ========================= APPEARANCE SETTINGS ========================= */
const AppearanceSettings = () => {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<'light' | 'dark'>(
    (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const themes = [
    { key: 'light', icon: Sun, color: 'text-yellow-500', label: t('settings.theme_light') },
    { key: 'dark', icon: Moon, color: 'text-indigo-400', label: t('settings.theme_dark') },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {t('settings.appearance')}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {t('settings.appearance_desc')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {themes.map(({ key, icon: Icon, color, label }) => (
          <button
            key={key}
            onClick={() => setTheme(key as 'light' | 'dark')}
            className={`p-4 rounded-lg border-2 transition-all ${
              theme === key
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/40'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
            }`}
          >
            <Icon className={`w-6 h-6 mx-auto mb-2 ${color}`} />
            <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{label}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ========================= MAIN SETTINGS PAGE ========================= */
const Settings = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('general');

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

  const activeComponent = tabs.find((tab) => tab.key === activeTab)?.component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-500 py-6 sm:py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t('settings.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            {t('settings.sub_title')}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-500">
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            <div className="flex min-w-max sm:min-w-0">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-5 py-3 font-medium transition-all whitespace-nowrap ${
                      isActive
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/40'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
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
