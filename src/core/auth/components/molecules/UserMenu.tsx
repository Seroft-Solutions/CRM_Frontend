/**
 * UserMenu component
 *
 * Displays a dropdown menu for authenticated users.
 */
import React from 'react';
import { UserAvatar } from '../atoms/UserAvatar';
import { useAuth } from '../../hooks';

export interface UserMenuItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

export interface UserMenuProps {
  items?: UserMenuItem[];
  className?: string;
}

export const UserMenu: React.FC<UserMenuProps> = ({ items = [], className = '' }) => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);

  if (!user) {
    return null;
  }

  // Toggle dropdown
  const toggleDropdown = () => setIsOpen(!isOpen);

  // Close dropdown
  const closeDropdown = () => setIsOpen(false);

  // Handle logout
  const handleLogout = async () => {
    await logout();
    closeDropdown();
  };

  // Default menu items
  const defaultItems: UserMenuItem[] = [
    {
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  // Combine custom items with default items
  const menuItems = [...items, ...defaultItems];

  return (
    <div className={`relative ${className}`}>
      {/* Menu trigger */}
      <button
        type="button"
        className="flex items-center space-x-2 focus:outline-none"
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <UserAvatar user={user} size="small" />
        <span className="hidden md:block">{user.displayName || user.email}</span>
        <svg
          className="h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Backdrop (closes menu when clicked) */}
          <div className="fixed inset-0 z-10" onClick={closeDropdown}></div>

          {/* Menu items */}
          <div className="absolute right-0 z-20 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            {menuItems.map((item, index) => (
              <button
                key={index}
                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => {
                  item.onClick();
                  closeDropdown();
                }}
              >
                {item.icon && <span className="mr-2">{item.icon}</span>}
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
