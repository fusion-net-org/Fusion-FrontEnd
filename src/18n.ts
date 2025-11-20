import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        settings: {
          title: 'Settings',
          sub_title: 'Manage settings for your account',
          //General
          general_title: 'General',
          general: 'General Settings',
          general_desc: 'Manage your project information and preferences',
          language: 'Language',
          save: 'Save',
          cancel: 'Cancel',
          //Sercurity
          security_title: 'Security',
          security: 'Security Settings',
          security_desc: 'Manage your password and security preferences',
          current_password: 'Current password',
          new_password: 'New password',
          confirm_password: 'Confirm password',
          update: 'Update',
          updating: 'Updating...',
          //Notification
          notification_title: 'Notifications',
          notification: 'Notifications Settings',
          notification_desc: 'Choose how you want to be notified',
          activate_notifications: {
            title: 'Activate Notifications',
            desc: 'Get notified every time you have a new announcement',
          },
          email_notifications: {
            title: 'Email Notifications',
            desc: 'Receive notifications via email',
          },
          sms_notifications: {
            title: 'SMS Notifications',
            desc: 'Receive notifications via SMS',
          },
          //Appearance
          appearance_title: 'Appearance',
          appearance: 'Appearance Settings',
          appearance_desc: 'Customize how the app looks and feels',
          theme: 'Theme',
          theme_light: 'Light',
          theme_dark: 'Dark',
        },
        menu_item: {
          company: 'Company',
          invitation: 'Invitation',
          analytics: 'Analytics',
          invoice: 'Invoice',
          schedule: 'Schedule',
          calendar: 'Calendar',
          setting: 'Settings',
          logout: 'Logout',
        },
        user_menu: {
          my_profile: 'My profile',
          notification: 'Notifications',
          logout: 'Logout',
        },
      },
    },
    vi: {
      translation: {
        settings: {
          title: 'Cài đặt',
          sub_title: 'Quản lý cài đặt cho tài khoản của bạn',
          //General
          general_title: 'Chung',
          general: 'Cài Đặt Chung',
          general_desc: 'Quản lý cài đặt chung cho hệ thống',
          language: 'Ngôn ngữ',
          save: 'Lưu',
          cancel: 'Huỷ',
          //Sercurity
          security_title: 'Bảo mật',
          security: 'Cài Đặt Bảo Mật',
          security_desc: 'Quản lý mật khẩu và tùy chọn bảo mật của bạn',
          current_password: 'Mật khẩu hiện tại',
          new_password: 'Mật khẩu mới',
          confirm_password: 'Xác nhận mật khẩu',
          update: 'Cập nhật',
          updating: 'Đang cập nhật...',
          //Notification
          notification_title: 'Thông báo',
          notification: 'Cài Đặt Thông Báo',
          notification_desc: 'Chọn cách bạn muốn được thông báo',
          activate_notifications: {
            title: 'Kích Hoạt Thông Báo',
            desc: 'Nhận thông báo mỗi khi có thông báo mới',
          },
          email_notifications: {
            title: 'Thông Báo Qua Email',
            desc: 'Nhận thông báo qua email của bạn',
          },
          sms_notifications: {
            title: 'Thông Báo Qua Tin Nhắn SMS',
            desc: 'Nhận thông báo qua tin nhắn SMS',
          },
          //Appearance
          appearance_title: 'Giao diện',
          appearance: 'Cài đặt giao diện',
          appearance_desc: 'Tùy chỉnh giao diện cho ứng dụng',
          theme: 'Chủ đề',
          theme_light: 'Sáng',
          theme_dark: 'Tối',
        },
        menu_item: {
          company: 'Công ty',
          analytics: 'Phân tích',
          invoice: 'Hoá đơn',
          schedule: 'Lịch trình',
          calendar: 'Lịch',
          setting: 'Cài đặt',
          logout: 'Đăng xuất',
        },
        user_menu: {
          my_profile: 'Hồ sơ của tôi',
          notification: 'Thông báo',
          logout: 'Đăng xuất',
        },
      },
    },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;