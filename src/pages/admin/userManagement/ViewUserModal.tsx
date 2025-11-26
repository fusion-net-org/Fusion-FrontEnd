import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Avatar,
  Chip,
  Divider,
  Stack,
} from '@mui/material';
import { X, Mail, Phone, MapPin, User, Calendar, ShieldCheck } from 'lucide-react';
import type { AdminUser } from '@/interfaces/User/User';

interface ViewUserModalProps {
  open: boolean;
  onClose: () => void;
  selected: AdminUser | null;
}

export default function ViewUserModal({ open, onClose, selected }: ViewUserModalProps) {
  if (!selected) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'grey.50',
          pb: 1,
        }}
      >
        <span className="text-lg font-semibold text-gray-800">User Details</span>
        <IconButton onClick={onClose} size="small">
          <X className="w-5 h-5 text-gray-600" />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          bgcolor: 'white',
          py: 3,
        }}
      >
        <Stack spacing={3}>
          {/* User Info Header */}
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              src={selected.avatar || undefined}
              alt={selected.userName}
              sx={{ width: 72, height: 72, bgcolor: '#3b82f6', fontSize: 28 }}
            >
              {selected.userName?.[0]?.toUpperCase() || <User />}
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{selected.userName}</h2>
              <div className="text-sm text-gray-500">{selected.email}</div>
              <Chip
                label={selected.status ? 'Active' : 'Inactive'}
                color={selected.status ? 'success' : 'default'}
                size="small"
                sx={{ mt: 1 }}
              />
            </div>
          </Stack>

          <Divider />

          {/* Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-[15px]">
            <div className="flex items-center gap-2 text-gray-700">
              <Phone size={16} className="text-gray-500" />
              <span>
                <b>Phone:</b> {selected.phone ?? '-'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-gray-700">
              <MapPin size={16} className="text-gray-500" />
              <span>
                <b>Address:</b> {selected.address ?? '-'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-gray-700">
              <User size={16} className="text-gray-500" />
              <span>
                <b>Gender:</b> {selected.gender ?? '-'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-gray-700">
              <Calendar size={16} className="text-gray-500" />
              <span>
                <b>Created:</b>{' '}
                {selected.createAt ? new Date(selected.createAt).toLocaleString('vi-VN') : '-'}
              </span>
            </div>
          </div>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined" color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
