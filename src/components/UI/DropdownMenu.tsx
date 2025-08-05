import React, { useRef, useEffect, useState, ReactElement } from 'react';
import { createPortal } from 'react-dom';

interface MenuItem {
  label: string;
  icon?: ReactElement;
  onClick: () => void;
  className?: string;
}

interface DropdownMenuProps {
  onClose: () => void;
  items?: MenuItem[];
  triggerRef?: React.RefObject<HTMLElement>;
  children?: React.ReactNode;
  isOpen?: boolean;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ onClose, items = [], triggerRef, children, isOpen = true }) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (triggerRef?.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.right - 160 + window.scrollX, // 160px é a largura do menu
      });
    }
  }, [triggerRef]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) && 
        (!triggerRef?.current || !triggerRef.current.contains(event.target as Node))
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, triggerRef]);

  // Don't render anything if the dropdown is not open
  if (!isOpen) return null;

  return createPortal(
    <div 
      ref={menuRef}
      className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-10 border"
      style={triggerRef ? { 
        position: 'fixed',
        top: `${position.top}px`, 
        left: `${position.left}px`,
        zIndex: 999
      } : {}}
    >
      {children ? (
        children
      ) : (
        <ul>
          {items.map((item, index) => (
            <li key={index}>
              <button 
                onClick={() => {
                  item.onClick();
                  onClose();
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center ${item.className || 'text-gray-700'}`}
              >
                {item.icon && <span className="mr-2">{item.icon}</span>}
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>,
    document.body
  );
};

export default DropdownMenu;
