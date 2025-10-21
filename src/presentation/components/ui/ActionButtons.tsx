// مكون أزرار موحد قابل لإعادة الاستخدام
// Reusable unified button component

import type React from 'react';
import { Button } from './button';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Play, 
  Cog, 
  Calculator, 
  FileText, 
  Plus, 
  Save, 
  X, 
  Search, 
  Filter, 
  Download, 
  Upload,
  Send,
  Settings,
  User,
  Check,
  AlertCircle,
  Zap,
  RotateCw
} from 'lucide-react';
import { BUTTON_STYLES, BUTTON_TEXTS } from '@/utils/buttonStyles';

const iconMap = {
  Eye,
  Edit, 
  Trash2,
  Play,
  Cog,
  Calculator,
  FileText,
  Plus,
  Save,
  X,
  Search,
  Filter,
  Download,
  Upload,
  Send,
  Settings,
  User,
  Check,
  AlertCircle,
  Zap,
  RotateCw
};

type IconName = keyof typeof iconMap;

type ButtonClickHandler = (event: React.MouseEvent<HTMLButtonElement>) => void;

interface ActionButtonProps {
  variant?: 'view' | 'edit' | 'delete' | 'primary' | 'success' | 'warning' | 'secondary';
  icon?: IconName;
  text?: string;
  onClick: ButtonClickHandler;
  size?: "sm" | "default" | "lg";
  disabled?: boolean;
  children?: React.ReactNode;
  ariaLabel?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  variant = 'view',
  icon,
  text,
  onClick,
  size = "sm",
  disabled = false,
  children,
  ariaLabel
}) => {
  // Fallback to primary style if an unknown variant is provided to prevent runtime errors
  const style = BUTTON_STYLES[variant] ?? BUTTON_STYLES.primary;
  const IconComponent = icon ? iconMap[icon] : null;
  const displayText = children ?? text;
  
  return (
    <Button
      variant={style.variant}
      size={size}
      className={style.className}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {IconComponent && <IconComponent className={`${style.iconClass} ${displayText ? 'ml-1' : ''}`} />}
      {displayText && <span>{displayText}</span>}
    </Button>
  );
};

// مكون أزرار الإجراءات الشائعة للكيانات
interface EntityActionsProps {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPrimary?: () => void;
  primaryText?: string;
  primaryIcon?: IconName;
  primaryVariant?: 'primary' | 'success' | 'warning' | 'secondary';
  showPrimary?: boolean;
}

export const EntityActions: React.FC<EntityActionsProps> = ({
  onView,
  onEdit,
  onDelete,
  onPrimary,
  primaryText = BUTTON_TEXTS.start,
  primaryIcon = "Zap",
  primaryVariant = "primary",
  showPrimary = true
}) => {
  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    onView();
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  const handlePrimary = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPrimary?.();
  };

  return (
    <div className="flex items-center gap-2">
      <ActionButton variant="view" icon="Eye" onClick={handleView} ariaLabel="عرض تفاصيل الكيان" />
      <ActionButton variant="edit" icon="Edit" onClick={handleEdit} ariaLabel="تعديل الكيان" />
      <ActionButton variant="delete" icon="Trash2" onClick={handleDelete} ariaLabel="حذف الكيان" />
      {showPrimary && onPrimary && (
        <ActionButton 
          variant={primaryVariant} 
          icon={primaryIcon} 
          text={primaryText} 
          onClick={handlePrimary} 
        />
      )}
    </div>
  );
};

