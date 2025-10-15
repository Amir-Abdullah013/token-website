'use client';

import { useState, useEffect } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from './Card';
import Button from './Button';
import Input from './Input';

const ProfileCard = ({ 
  user, 
  onUpdate, 
  onPasswordChange, 
  isEditable = true,
  showPasswordChange = true,
  className = '' 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || ''
  });

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user?.name || '',
        phone: user?.phone || '',
        email: user?.email || ''
      });
    }
  }, [user]);

  // Fetch user profile data with creation date
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        try {
          const response = await fetch(`/api/user/profile?userId=${user.id}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setUserProfile(data.user);
            }
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    fetchUserProfile();
  }, [user?.id]);

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await onUpdate(formData);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await onPasswordChange(passwordData.currentPassword, passwordData.newPassword);
      setSuccess('Password changed successfully!');
      setShowPasswordForm(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      email: user?.email || ''
    });
    setError(null);
    setSuccess(null);
  };

  const cancelPasswordChange = () => {
    setShowPasswordForm(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setError(null);
    setSuccess(null);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Profile Information Card */}
      <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Profile Information</CardTitle>
            {isEditable && !isEditing && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditing(true)}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/30"
              >
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-400/30 rounded-lg">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-400/30 rounded-lg">
              <p className="text-sm text-emerald-300">{success}</p>
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-slate-200 mb-2">
                  Full Name
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your full name"
                  className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 text-white placeholder-slate-300 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-slate-200 mb-2">
                  Phone Number
                </label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                  className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 text-white placeholder-slate-300 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-200 mb-2">
                  Email Address
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled
                  className="bg-slate-700/30 border border-slate-500/30 text-slate-400"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>

              <div className="flex space-x-3">
                <Button 
                  type="submit" 
                  variant="primary"
                  loading={loading}
                  disabled={loading}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/30"
                >
                  Save Changes
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={cancelEdit}
                  disabled={loading}
                  className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white border border-slate-400/30"
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-semibold text-slate-200 mb-3 flex items-center">
                  <span className="mr-2">👤</span>
                  Full Name
                </label>
                <div className="bg-slate-800/40 px-4 py-3 rounded-lg border border-slate-600/40 shadow-lg">
                  <p className="text-white font-medium">{user?.name || 'Not provided'}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-200 mb-3 flex items-center">
                  <span className="mr-2">📧</span>
                  Email Address
                </label>
                <div className="bg-slate-800/40 px-4 py-3 rounded-lg border border-slate-600/40 shadow-lg">
                  <p className="text-white font-medium">{user?.email || 'Not provided'}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-200 mb-3 flex items-center">
                  <span className="mr-2">📱</span>
                  Phone Number
                </label>
                <div className="bg-slate-800/40 px-4 py-3 rounded-lg border border-slate-600/40 shadow-lg">
                  <p className="text-white font-medium">{user?.phone || 'Not provided'}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-200 mb-3 flex items-center">
                  <span className="mr-2">📅</span>
                  Member Since
                </label>
                <div className="bg-slate-800/40 px-4 py-3 rounded-lg border border-slate-600/40 shadow-lg">
                  <p className="text-white font-medium">
                    {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) :
                     user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                       year: 'numeric',
                       month: 'long',
                       day: 'numeric'
                     }) : 
                     user?.$createdAt ? new Date(user.$createdAt).toLocaleDateString('en-US', {
                       year: 'numeric',
                       month: 'long',
                       day: 'numeric'
                     }) : 
                     'Loading...'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileCard;











