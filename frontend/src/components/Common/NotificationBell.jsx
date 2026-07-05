import { useState, useEffect, useRef } from "react";
import { Bell, X, AlertTriangle, CheckCheck, Trash2, CheckSquare, Square } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";

export default function NotificationBell({ role = "ustaz" }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(new Set()); // IDs selected for bulk delete
  const [selectMode, setSelectMode] = useState(false);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  const apiBase = role === "admin" ? "/admin" : "/ustaz";

  const fetchNotifications = async () => {
    try {
      const res = await axiosInstance.get(`${apiBase}/notifications`);
      setNotifications(res.data);
    } catch (err) {
      // Silently fail
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
        setSelectMode(false);
        setSelected(new Set());
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // ── Read ──────────────────────────────────────────────────────
  const handleMarkRead = async (id, e) => {
    e?.stopPropagation();
    try {
      await axiosInstance.patch(`${apiBase}/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await axiosInstance.patch(`${apiBase}/notifications/read-all`);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  // ── Delete ────────────────────────────────────────────────────
  const handleDeleteOne = async (id, e) => {
    e.stopPropagation();
    try {
      await axiosInstance.delete(`${apiBase}/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setSelected((prev) => { const s = new Set(prev); s.delete(id); return s; });
    } catch {}
  };

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return;
    try {
      await axiosInstance.delete(`${apiBase}/notifications/bulk`, {
        data: { ids: Array.from(selected) }
      });
      setNotifications((prev) => prev.filter((n) => !selected.has(n._id)));
      setSelected(new Set());
      setSelectMode(false);
    } catch {}
  };

  // ── Select ────────────────────────────────────────────────────
  const toggleSelect = (id, e) => {
    e.stopPropagation();
    setSelected((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === notifications.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(notifications.map((n) => n._id)));
    }
  };

  // ── Navigate ──────────────────────────────────────────────────
  const handleNotificationClick = async (notification) => {
    if (selectMode) return;
    if (!notification.isRead) await handleMarkRead(notification._id);
    if (role === "admin") {
      setIsOpen(false);
      navigate(`/admin/students/${notification.studentId}`);
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const diffMs = Date.now() - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => { setIsOpen((prev) => !prev); setSelectMode(false); setSelected(new Set()); }}
        className="relative p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition text-gray-600 dark:text-gray-300"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white text-[11px] font-black rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-gray-900">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-[-60px] sm:right-0 top-14 w-[90vw] sm:w-96 max-w-[400px] max-h-[80vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 flex flex-col overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <Bell size={17} className="text-emerald-600" />
              <h3 className="font-bold text-gray-800 dark:text-white text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {/* Mark all read */}
              {unreadCount > 0 && !selectMode && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium px-1"
                  title="Mark all as read"
                >
                  <CheckCheck size={13} />
                </button>
              )}
              {/* Select / Cancel */}
              {notifications.length > 0 && (
                <button
                  onClick={() => { setSelectMode((v) => !v); setSelected(new Set()); }}
                  className={`text-xs px-2 py-1 rounded-lg font-semibold transition ${
                    selectMode
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {selectMode ? "Cancel" : "Select"}
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 ml-1">
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Select-mode toolbar */}
          {selectMode && notifications.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-700">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 font-medium"
              >
                {selected.size === notifications.length
                  ? <CheckSquare size={14} className="text-emerald-600" />
                  : <Square size={14} />}
                {selected.size === notifications.length ? "Deselect all" : "Select all"}
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={selected.size === 0}
                className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                  selected.size > 0
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                }`}
              >
                <Trash2 size={13} />
                Delete {selected.size > 0 ? `(${selected.size})` : ""}
              </button>
            </div>
          )}

          {/* Notification List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
                <Bell size={36} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  className={`flex items-start gap-3 px-4 py-3.5 border-b border-gray-50 dark:border-gray-800 transition group
                    ${!n.isRead ? "bg-red-50 dark:bg-red-900/10" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"}
                    ${role === "admin" && !selectMode ? "cursor-pointer" : "cursor-default"}
                  `}
                >
                  {/* Checkbox (select mode) or icon */}
                  {selectMode ? (
                    <button
                      onClick={(e) => toggleSelect(n._id, e)}
                      className="mt-0.5 shrink-0 text-emerald-600"
                    >
                      {selected.has(n._id)
                        ? <CheckSquare size={18} className="text-emerald-600" />
                        : <Square size={18} className="text-gray-400" />}
                    </button>
                  ) : (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      !n.isRead
                        ? "bg-red-100 dark:bg-red-900/40 text-red-500"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                    }`}>
                      <AlertTriangle size={15} />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${
                      !n.isRead
                        ? "text-gray-800 dark:text-gray-100 font-semibold"
                        : "text-gray-600 dark:text-gray-400 font-medium"
                    }`}>
                      {n.message}
                    </p>
                    {role === "admin" && !selectMode && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
                        ملف الطالب ←
                      </p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatTime(n.createdAt)}</p>
                  </div>

                  {/* Actions (non-select mode): unread dot + delete */}
                  {!selectMode && (
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {!n.isRead && (
                        <span className="w-2.5 h-2.5 bg-red-500 rounded-full mt-1" />
                      )}
                      {/* Delete button — always visible on hover */}
                      <button
                        onClick={(e) => handleDeleteOne(n._id, e)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-500 dark:hover:text-red-400 mt-0.5"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                Notifications auto-delete after 14 days
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
