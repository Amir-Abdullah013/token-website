// Script to update user data in localStorage with correct information
export const updateUserData = () => {
  if (typeof window !== 'undefined') {
    const correctUserData = {
      id: '116615266603089085637',
      $id: '116615266603089085637',
      name: 'Amir Abdullah',
      email: 'amirabdullah2508@gmail.com',
      emailVerified: true,
      role: 'USER',
      provider: 'custom'
    };

    // Update localStorage
    localStorage.setItem('userSession', JSON.stringify(correctUserData));
    
    // Also update cookies for server-side access
    document.cookie = `userSession=${JSON.stringify(correctUserData)}; path=/; max-age=86400; SameSite=Lax`;
    
    console.log('✅ User data updated in localStorage:', correctUserData);
    return correctUserData;
  }
  return null;
};

// Auto-update on import
if (typeof window !== 'undefined') {
  updateUserData();
}


