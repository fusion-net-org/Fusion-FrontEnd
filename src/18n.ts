import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        settings: {
          title: "Settings",
          description: "Manage your account settings and preferences",
          general: "General",
          security: "Security",
          notifications: "Notifications",
          appearance: "Appearance",
          language: "Language",
          save: "Save",
          general_desc: "Manage your project information and preferences",
        },
      },
    },
    vi: {
      translation: {
        settings: {
          title: "Cài đặt",
          description: "Quản lý cài đặt và tuỳ chọn tài khoản của bạn",
          general: "Chung",
          security: "Bảo mật",
          notifications: "Thông báo",
          appearance: "Giao diện",
          language: "Ngôn ngữ",
          save: "Lưu",
          general_desc: "Quản lý thông tin và tuỳ chọn dự án của bạn",
        },
      },
    },
  },
  lng: "en", 
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
