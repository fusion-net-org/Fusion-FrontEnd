import { useEffect, useState } from 'react';
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Edit2,
  Camera,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Folder,
  Users,
  Activity,
  Clock,
  Lock,
  LogOut,
  Settings,
  Bell,
  Shield,
  CreditCard,
  KeyRound,
  LockKeyhole,
  RotateCcwKey,
  Menu,
} from 'lucide-react';
import { toast } from 'react-toastify';
import type { User } from '@/interfaces/User/User';
import { getSelfUser, putSelfUser } from '@/services/userService.js';
import { useNavigate } from 'react-router-dom';

const UserProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState<User>({
    userName: 'Unknown',
    email: '',
    phone: '',
    address: '',
    gender: '',
    avatar: '',
  });

  const [tempData, setTempData] = useState<User>(profileData);

  const menuItems = [
    { id: 'profile', label: 'My profile', icon: UserIcon },
    { id: 'password', label: 'Change password', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const projectStats = [
    { icon: Folder, label: 'Total project', value: '24', color: 'bg-blue-500' },
    { icon: CheckCircle, label: 'Complete', value: '18', color: 'bg-green-500' },
    { icon: Clock, label: 'Ongoing', value: '4', color: 'bg-yellow-500' },
    { icon: AlertCircle, label: 'Overdue', value: '2', color: 'bg-red-500' },
  ];

  const recentActivities = [
    {
      action: 'Complete the task "Design UI Dashboard"',
      project: 'Website Management Project',
      time: '2 hours ago',
      status: 'completed',
    },
    {
      action: 'Project progress update',
      project: 'App Mobile',
      time: '5 hours ago',
      status: 'updated',
    },
    {
      action: 'Join the new project',
      project: 'Banking system',
      time: '1 day ago',
      status: 'joined',
    },
  ];

  const handleEdit = () => {
    setTempData({ ...profileData });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('Phone', profileData.phone);
      formData.append('Address', profileData.address);
      formData.append('Gender', profileData.gender);
      if (selectedAvatarFile) {
        formData.append('Avatar', selectedAvatarFile);
      }

      const response = await putSelfUser(formData);

      setProfileData(response.data);
      setSelectedAvatarFile(null);
      toast.success('Updated successfully!');
      setIsEditing(false);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Update failed!';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setProfileData({ ...tempData });
    setSelectedAvatarFile(null);
    setIsEditing(false);
  };

  const handleMenuClick = (id: string) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    toast.success('Signed out successfully!');
    navigate('/');
  };

  //Handle api:
  const fetchUserInfo = async (): Promise<void> => {
    try {
      const response = await getSelfUser();
      setProfileData(response.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error!';
      toast.error(message);
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-50">
      <div className="flex flex-col lg:flex-row">
        {/* NavLeft User Profile */}
        <div className="lg:w-72 lg:min-h-screen bg-white border-r border-gray-200 lg:sticky lg:top-0 lg:h-screen flex flex-col justify-between">
          {/* Mobile header */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
            <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* User Profile */}
          <div className="hidden lg:block p-6 border-b border-gray-100">
            <div className="flex flex-col items-center text-center">
              <div className="relative group">
                {/* Avatar */}
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white font-bold text-3xl shadow-lg border-4 border-white transition-transform duration-300 group-hover:scale-105 overflow-hidden">
                  {profileData.avatar ? (
                    <img
                      src={
                        selectedAvatarFile
                          ? URL.createObjectURL(selectedAvatarFile)
                          : profileData.avatar
                      }
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    profileData.userName.charAt(0).toUpperCase()
                  )}
                </div>

                {isEditing && (
                  <>
                    <button
                      onClick={() => document.getElementById('avatarInput')?.click()}
                      className="absolute bottom-1 right-1 bg-blue-500 text-white rounded-full p-2 shadow-md hover:bg-blue-600 hover:scale-110 border-2 border-white transition-all duration-200"
                      title="Thay đổi ảnh đại diện"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <input
                      id="avatarInput"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedAvatarFile(file);
                        }
                        e.target.value = '';
                      }}
                    />
                  </>
                )}
              </div>

              <h3 className="font-semibold text-gray-900 mt-4 text-base">{profileData.userName}</h3>
              <p className="text-xs text-gray-500 mb-2 tracking-wide">Project Manager</p>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-[11px] font-medium">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span>Online</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav
            className={`transition-all duration-300 ${
              isMobileMenuOpen ? 'block' : 'hidden'
            } lg:block flex-1 p-4 overflow-y-auto`}
          >
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
                      isActive
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 flex-shrink-0 ${
                        isActive ? 'text-white' : 'text-gray-500'
                      }`}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="border-t border-gray-200 mt-4 pt-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium text-red-600 hover:bg-red-50 active:bg-red-100"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </nav>
        </div>

        <div className="flex-1 p-4 sm:p-6 lg:p-8 lg:overflow-y-auto">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Left side: Title + Description */}
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
                {menuItems.find((item) => item.id === activeTab)?.label || 'Hồ sơ cá nhân'}
              </h1>
              <p className="text-sm text-gray-600">Manage your account information and settings</p>
            </div>
          </div>

          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex justify-end">
                {!isEditing ? (
                  <button
                    onClick={handleEdit}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-sm self-start sm:self-auto"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-3 self-start sm:self-auto">
                    <button
                      onClick={handleSave}
                      disabled={isLoading}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium shadow-sm disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {isLoading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isLoading}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium shadow-sm"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-600" />
                  Contact information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <Mail className="w-5 h-5 text-blue-600" />
                        <p className="text-sm font-medium text-gray-900">{profileData.email}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4" />
                      Phone number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <Phone className="w-5 h-5 text-green-600" />
                        <p className="text-sm font-medium text-gray-900">{profileData.phone}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4" />
                      Address
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.address}
                        onChange={(e) =>
                          setProfileData({ ...profileData, address: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                        <MapPin className="w-5 h-5 text-purple-600" />
                        <p className="text-sm font-medium text-gray-900">{profileData.address}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                      <UserIcon className="w-4 h-4" />
                      Gender
                    </label>
                    {isEditing ? (
                      <select
                        value={profileData.gender}
                        onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg">
                        <UserIcon className="w-5 h-5 text-pink-600" />
                        <p className="text-sm font-medium text-gray-900">{profileData.gender}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Project statistics
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {projectStats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                      <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${stat.color}`}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                        <p className="text-sm text-gray-600">{stat.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    Working performance
                  </h3>
                  <div className="space-y-4">
                    {[
                      { label: 'On-time completion rate', value: 85, color: 'bg-green-500' },
                      { label: 'Quality of work', value: 92, color: 'bg-blue-500' },
                      { label: 'Teamwork effectiveness', value: 88, color: 'bg-purple-500' },
                    ].map((item, i) => (
                      <div key={i}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">{item.label}</span>
                          <span className="text-sm font-semibold text-gray-900">{item.value}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`${item.color} h-2 rounded-full transition-all`}
                            style={{ width: `${item.value}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Recent activity
                  </h3>
                  <div className="space-y-4">
                    {recentActivities.map((activity, i) => (
                      <div
                        key={i}
                        className="flex gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            activity.status === 'completed'
                              ? 'bg-green-100'
                              : activity.status === 'updated'
                              ? 'bg-blue-100'
                              : 'bg-purple-100'
                          }`}
                        >
                          {activity.status === 'completed' && (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          )}
                          {activity.status === 'updated' && (
                            <Clock className="w-5 h-5 text-blue-600" />
                          )}
                          {activity.status === 'joined' && (
                            <Users className="w-5 h-5 text-purple-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            {activity.action}
                          </p>
                          <p className="text-sm text-gray-600">{activity.project}</p>
                          <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Folder className="w-5 h-5 text-blue-600" />
                  Current project
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { title: 'Project Management Website', progress: 75, color: 'bg-blue-500' },
                    { title: 'App Mobile', progress: 60, color: 'bg-purple-500' },
                  ].map((proj, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform ${proj.color}`}
                      >
                        <Folder className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 mb-1">{proj.title}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`${proj.color} h-2 rounded-full`}
                              style={{ width: `${proj.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium text-gray-600">
                            {proj.progress}%
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full whitespace-nowrap">
                        In progress
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 max-w-3xl space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Security Settings</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Manage your password and security preferences
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    label: 'Current password',
                    icon: <KeyRound className="inline w-4 h-4 mr-2 text-gray-500" />,
                    placeholder: 'Enter current password',
                  },
                  {
                    label: 'New password',
                    icon: <LockKeyhole className="inline w-4 h-4 mr-2 text-gray-500" />,
                    placeholder: 'Enter a new password',
                  },
                  {
                    label: 'Confirm new password',
                    icon: <RotateCcwKey className="inline w-4 h-4 mr-2 text-gray-500" />,
                    placeholder: 'Re-enter new password',
                  },
                ].map((field, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <label className="flex items-center text-sm font-medium text-gray-700 w-full sm:w-1/3">
                      {field.icon}
                      {field.label}
                    </label>
                    <input
                      type="password"
                      placeholder={field.placeholder}
                      className="w-full sm:w-2/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                ))}

                {/* Update button align right */}
                <div className="flex justify-end pt-4">
                  <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700 transition-all font-medium flex items-center">
                    <Save className="w-4 h-4 mr-2" />
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          )}

          {['notifications', 'security', 'billing', 'settings'].includes(activeTab) && (
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
              <div className="text-center py-12">
                <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Feature in development</h3>
                <p className="text-gray-600">The content of this tab will be updated soon</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
