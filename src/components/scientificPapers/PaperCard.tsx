/**
 * PaperCard Component
 * Google Keep style card for displaying scientific papers
 */

import React from 'react';
import {
  FileText,
  Calendar,
  Users,
  MoreVertical,
  Edit2,
  Trash2,
  File,
  Download,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Send,
  XCircle,
  ExternalLink
} from 'lucide-react';
import type {
  ScientificPaper,
  PaperStatus,
  CardColor
} from '../../types/scientificPapers';
import {
  getDeadlineInfo,
  PAPER_TYPE_LABELS,
  PAPER_STATUS_LABELS,
  PAPER_STATUS_COLORS,
  CARD_COLORS,
  PRIORITY_LABELS
} from '../../types/scientificPapers';

interface PaperCardProps {
  paper: ScientificPaper;
  onEdit: (paper: ScientificPaper) => void;
  onDelete: (paper: ScientificPaper) => void;
  onStatusChange: (paper: ScientificPaper, newStatus: PaperStatus) => void;
  onColorChange?: (paper: ScientificPaper, newColor: CardColor) => void;
  residentNames?: Record<string, string>; // email -> name mapping
}

const STATUS_ICONS: Record<PaperStatus, React.ReactNode> = {
  pending: <Clock className="w-3 h-3" />,
  in_progress: <FileText className="w-3 h-3" />,
  completed: <CheckCircle2 className="w-3 h-3" />,
  submitted: <Send className="w-3 h-3" />,
  accepted: <CheckCircle2 className="w-3 h-3" />,
  rejected: <XCircle className="w-3 h-3" />
};

export default function PaperCard({
  paper,
  onEdit,
  onDelete,
  onStatusChange,
  onColorChange,
  residentNames = {}
}: PaperCardProps) {
  const [showMenu, setShowMenu] = React.useState(false);
  const [showStatusMenu, setShowStatusMenu] = React.useState(false);
  const [showColorMenu, setShowColorMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Get deadline info
  const deadlineInfo = getDeadlineInfo(paper.deadline);

  // Get card background color
  const cardColor = CARD_COLORS[paper.color] || CARD_COLORS.default;
  const statusColors = PAPER_STATUS_COLORS[paper.status];

  // Get resident initials
  const getInitials = (email: string): string => {
    const name = residentNames[email];
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  // Close menus when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
        setShowStatusMenu(false);
        setShowColorMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Count attached files
  const fileCount = [paper.abstract_url, paper.draft_url, paper.final_url].filter(Boolean).length;

  const lastUpdateText = (() => {
    const referenceDate = paper.updated_at || paper.created_at;
    const updatedAt = new Date(referenceDate);
    if (Number.isNaN(updatedAt.getTime())) return null;
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'Actualizado hoy';
    if (diffDays === 1) return 'No has avanzado en 1 dia';
    return `No has avanzado en ${diffDays} dias`;
  })();

  return (
    <div
      className={`
        relative rounded-lg border shadow-sm hover:shadow-md transition-shadow
        ${cardColor.light} ${cardColor.dark}
        border-gray-200 dark:border-gray-700
      `}
    >
      {/* Card Content */}
      <div className="p-4">
        {/* Header: Type badge + Menu */}
        <div className="flex items-start justify-between mb-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
            {PAPER_TYPE_LABELS[paper.paper_type]}
          </span>

          {/* Menu Button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(paper);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => {
                    setShowStatusMenu(!showStatusMenu);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  Cambiar estado
                </button>
                {onColorChange && (
                  <button
                    onClick={() => setShowColorMenu(!showColorMenu)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-400 via-yellow-400 to-blue-400" />
                    Color
                  </button>
                )}
                <hr className="border-gray-200 dark:border-gray-700" />
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(paper);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>

                {/* Status submenu */}
                {showStatusMenu && (
                  <div className="absolute left-full top-8 ml-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    {(Object.keys(PAPER_STATUS_LABELS) as PaperStatus[]).map(status => (
                      <button
                        key={status}
                        onClick={() => {
                          onStatusChange(paper, status);
                          setShowMenu(false);
                          setShowStatusMenu(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${
                          paper.status === status ? 'bg-gray-100 dark:bg-gray-700' : ''
                        }`}
                      >
                        {STATUS_ICONS[status]}
                        {PAPER_STATUS_LABELS[status]}
                      </button>
                    ))}
                  </div>
                )}

                {/* Color submenu */}
                {showColorMenu && onColorChange && (
                  <div className="absolute left-full top-20 ml-1 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-3 gap-1">
                      {(Object.keys(CARD_COLORS) as CardColor[]).map(color => (
                        <button
                          key={color}
                          onClick={() => {
                            onColorChange(paper, color);
                            setShowMenu(false);
                            setShowColorMenu(false);
                          }}
                          className={`w-6 h-6 rounded-full ${CARD_COLORS[color].light} border-2 ${
                            paper.color === color ? 'border-blue-500' : 'border-transparent'
                          }`}
                          title={CARD_COLORS[color].name}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
          {paper.title}
        </h3>

        {/* Event name */}
        {paper.event_name && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-1">
            {paper.event_name}
          </p>
        )}

        {/* Description */}
        {paper.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
            {paper.description}
          </p>
        )}

        {/* Deadline + inactivity */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          {paper.deadline && (
            <div
              className={`
                flex items-center gap-1.5 text-sm font-medium
                ${deadlineInfo.color === 'red' ? 'text-red-600 dark:text-red-400' : ''}
                ${deadlineInfo.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' : ''}
                ${deadlineInfo.color === 'green' ? 'text-green-600 dark:text-green-400' : ''}
                ${deadlineInfo.color === 'gray' ? 'text-gray-500 dark:text-gray-400' : ''}
              `}
            >
              {deadlineInfo.urgent ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <Calendar className="w-4 h-4" />
              )}
              <span>{deadlineInfo.text}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                ({new Date(paper.deadline + 'T00:00:00').toLocaleDateString('es-AR', {
                  day: 'numeric',
                  month: 'short'
                })})
              </span>
            </div>
          )}

          {lastUpdateText && (
            <div className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              <Clock className="w-3 h-3" />
              {lastUpdateText}
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`
              inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium
              ${statusColors.bg} ${statusColors.text} ${statusColors.darkBg} ${statusColors.darkText}
            `}
          >
            {STATUS_ICONS[paper.status]}
            {PAPER_STATUS_LABELS[paper.status]}
          </span>

          {paper.priority !== 'medium' && (
            <span className={`text-xs font-medium ${
              paper.priority === 'urgent' ? 'text-red-600 dark:text-red-400' :
              paper.priority === 'high' ? 'text-orange-600 dark:text-orange-400' :
              'text-gray-500 dark:text-gray-400'
            }`}>
              {PRIORITY_LABELS[paper.priority]}
            </span>
          )}
        </div>

        {paper.pending_tasks && paper.pending_tasks.length > 0 && (
          <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
            <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-2">
              Pendientes
            </p>
            <ul className="space-y-1">
              {paper.pending_tasks.slice(0, 4).map((task) => (
                <li key={task} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-400" />
                  <span className="flex-1">{task}</span>
                </li>
              ))}
            </ul>
            {paper.pending_tasks.length > 4 && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                +{paper.pending_tasks.length - 4} pendientes mas
              </p>
            )}
          </div>
        )}

        {/* Footer: Assigned residents + File indicators */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          {/* Assigned Residents */}
          <div className="flex items-center">
            {paper.assigned_residents.length > 0 ? (
              <div className="flex -space-x-2">
                {paper.assigned_residents.slice(0, 3).map((email, idx) => (
                  <div
                    key={email}
                    className="w-7 h-7 rounded-full bg-blue-500 border-2 border-white dark:border-gray-800 flex items-center justify-center text-white text-xs font-medium"
                    title={residentNames[email] || email}
                  >
                    {getInitials(email)}
                  </div>
                ))}
                {paper.assigned_residents.length > 3 && (
                  <div className="w-7 h-7 rounded-full bg-gray-400 border-2 border-white dark:border-gray-800 flex items-center justify-center text-white text-xs font-medium">
                    +{paper.assigned_residents.length - 3}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                <Users className="w-3 h-3" />
                Sin asignar
              </span>
            )}
          </div>

          {/* File Indicators */}
          <div className="flex items-center gap-2">
            {fileCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <File className="w-3 h-3" />
                {fileCount}
              </span>
            )}
            {paper.abstract_url && (
              <a
                href={paper.abstract_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-200"
                title="Abrir abstract"
              >
                <ExternalLink className="w-3 h-3" />
                Abstract
              </a>
            )}
            {paper.draft_url && (
              <a
                href={paper.draft_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-200"
                title="Abrir borrador"
              >
                <ExternalLink className="w-3 h-3" />
                Borrador
              </a>
            )}
            {paper.final_url && (
              <a
                href={paper.final_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-200"
                title="Descargar version final"
              >
                <Download className="w-3 h-3" />
                Final
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
