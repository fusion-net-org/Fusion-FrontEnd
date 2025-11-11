import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  User,
  Users,
  Briefcase,
  Building2,
  FileText,
  Clock,
  Edit,
  Trash2,
} from 'lucide-react';
import type { CompanyInfo } from '@/interfaces/Admin/Admin';
import CompanyStatsModal from './CompanyStatsModal';
import { fmtDate } from '@/utils/format';

interface CompanyDetailDrawerProps {
  row: CompanyInfo | null;
  loading: boolean;
  onClose: () => void;
  onEdit?: (company: CompanyInfo) => void;
  onDelete?: (companyId: string) => void;
}

export default function CompanyDetailDrawer({
  row,
  loading,
  onClose,
  onEdit,
  onDelete,
}: CompanyDetailDrawerProps) {
  const [stats, setStats] = useState<{ open: boolean; tab: 'members' | 'projects' | 'partners' }>({
    open: false,
    tab: 'members',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!row) setStats({ open: false, tab: 'members' });
  }, [row]);

  if (!row) return null;

  const cover = row.imageCompany || 'https://placehold.co/1200x240?text=Cover';
  const avatar = row.avatarCompany || 'https://placehold.co/160x160?text=Avatar';

  const InfoItem = ({
    icon: Icon,
    label,
    value,
    link,
  }: {
    icon: any;
    label: string;
    value?: React.ReactNode;
    link?: boolean;
  }) => (
    <div className="py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-5 h-5 text-gray-400 mt-0.5">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-gray-500 mb-1">{label}</div>
          {link && value ? (
            <a
              href={value as string}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline break-all font-medium"
            >
              {(value as string).replace(/^https?:\/\//, '')}
            </a>
          ) : (
            <div className="text-sm text-gray-900 break-words font-medium">{value || '-'}</div>
          )}
        </div>
      </div>
    </div>
  );

  const handleDelete = () => {
    if (onDelete && row.id) {
      onDelete(row.id);
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

        {/* Modal */}
        <div className="relative w-full max-w-[800px] max-h-[90vh] bg-white shadow-2xl overflow-hidden rounded-xl animate-scaleIn">
          {/* Header with Cover */}
          <div className="relative">
            <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700">
              <img src={cover} alt="cover" className="w-full h-full object-cover opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
            </div>

            {/* Close Button */}
            <button
              className="absolute top-4 right-4 p-2 rounded-lg bg-white/95 hover:bg-white shadow-lg hover:shadow-xl transition-all duration-200"
              onClick={onClose}
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>

            {/* Company Avatar */}
            <div className="absolute left-6 -bottom-12">
              <div className="relative">
                <div className="w-24 h-24 rounded-xl border-4 border-white bg-white overflow-hidden shadow-lg">
                  <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="overflow-y-auto max-h-[calc(90vh-160px)]">
            <div className="pt-14 px-6 pb-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Company Name & Status */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <h1 className="text-2xl font-semibold text-gray-900 flex-1 m-0 p-0">
                        {row.name}
                      </h1>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold ${
                            row.isDeleted
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              row.isDeleted ? 'bg-red-500' : 'bg-green-500'
                            }`}
                          />
                          {row.isDeleted ? 'Deleted' : 'Active'}
                        </span>
                      </div>
                    </div>

                    {row.id && <div className="font-mono text-[10px]">ID: {row.id}</div>}

                    {row.taxCode && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700">
                        <FileText className="w-3 h-3" />
                        Tax Code: {row.taxCode}
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 py-4 border-y border-gray-200">
                    {[
                      {
                        label: 'Members',
                        count: row.totalMember ?? 0,
                        tab: 'members',
                        icon: Users,
                        color: 'text-blue-700',
                        bg: 'bg-blue-50',
                      },
                      {
                        label: 'Projects',
                        count: row.totalProject ?? 0,
                        tab: 'projects',
                        icon: Briefcase,
                        color: 'text-purple-700',
                        bg: 'bg-purple-50',
                      },
                      {
                        label: 'Partners',
                        count: row.totalPartners ?? 0,
                        tab: 'partners',
                        icon: Building2,
                        color: 'text-orange-700',
                        bg: 'bg-orange-50',
                      },
                    ].map((s) => (
                      <button
                        key={s.label}
                        className={`rounded-lg p-3 text-center hover:shadow-md transition-all duration-200 ${s.bg} ${s.color}`}
                        onClick={() => setStats({ open: true, tab: s.tab as any })}
                      >
                        <div className="flex justify-center mb-1.5">
                          <s.icon className="w-5 h-5" />
                        </div>
                        <div className="text-xl font-bold mb-0.5">{s.count}</div>
                        <div className="text-xs font-medium uppercase tracking-wide opacity-80">
                          {s.label}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Contact Information
                    </h2>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-0 border border-gray-200">
                      {row.email && <InfoItem icon={Mail} label="Email" value={row.email} />}
                      {row.phoneNumber && (
                        <InfoItem icon={Phone} label="Phone" value={row.phoneNumber} />
                      )}
                      {row.website && (
                        <InfoItem icon={Globe} label="Website" value={row.website} link />
                      )}
                      {row.address && (
                        <InfoItem icon={MapPin} label="Address" value={row.address} />
                      )}
                    </div>
                  </div>

                  {/* Company Details */}
                  <div>
                    <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Company Details
                    </h2>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-0 border border-gray-200">
                      <InfoItem
                        icon={User}
                        label="Owner"
                        value={row.ownerUserName || (row.ownerUserId ?? '').slice(0, 8)}
                      />
                      <InfoItem icon={Calendar} label="Created" value={fmtDate(row.createdAt)} />
                      <InfoItem icon={Calendar} label="Updated" value={fmtDate(row.updatedAt)} />
                    </div>
                  </div>

                  {/* Description */}
                  {row.detail && (
                    <div>
                      <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        About Company
                      </h2>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                          {row.detail}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer Action Buttons - Fixed at bottom */}
          {(onEdit || onDelete) && (
            <div className="border-t bg-white px-6 py-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                {onEdit && (
                  <button
                    onClick={() => {
                      onEdit(row);
                      onClose();
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Stats Modal */}
          {stats.open && (
            <CompanyStatsModal
              tab={stats.tab}
              row={row}
              onClose={() => setStats((s) => ({ ...s, open: false }))}
            />
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Company</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this company? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
