import { useState, useEffect, useRef } from "react";
import { Bell, X, AlertTriangle, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";

export default function NotificationBell({ role = "ustaz" }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  const apiBase = role === "admin" ? "/admin" : "/ustaz";

  const fetchNotifications = async () => {
    try {
      const res = await axiosInstance.get(`${apiBase}/notifications`);
      setNotifications(res.data);
    } catch (err) {
      // Silently fail — don't interrupt the UI
    }
  };

  // Fetch on mount and every 60 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await handleMarkRead(notification._id);
    }
    if (role === "admin") {
      setIsOpen(false);
      navigate(`/admin/students/${notification.studentId}`);
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
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
        onClick={() => setIsOpen((prev) => !prev)}
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
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-emerald-600" />
              <h3 className="font-bold text-gray-800 dark:text-white text-sm">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                >
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 ml-1"
              >
                <X size={16} />
              </button>
            </div>
          </div>

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
                  className={`flex items-start gap-3 px-5 py-4 border-b border-gray-50 dark:border-gray-800 transition
                    ${!n.isRead ? "bg-red-50 dark:bg-red-900/10" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"}
                    ${role === "admin" ? "cursor-pointer" : "cursor-default"}
                  `}
                >
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    !n.isRead
                      ? "bg-red-100 dark:bg-red-900/40 text-red-500"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                  }`}>
                    <AlertTriangle size={16} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${
                      !n.isRead
                        ? "text-gray-800 dark:text-gray-100 font-semibold"
                        : "text-gray-600 dark:text-gray-400 font-medium"
                    }`}>
                      {n.message}
                    </p>
                    {role === "admin" && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                        Click to view student profile →
                      </p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {formatTime(n.createdAt)}
                    </p>
                  </div>

                  {/* Unread dot + dismiss */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {!n.isRead && (
                      <span className="w-2.5 h-2.5 bg-red-500 rounded-full mt-1" />
                    )}
                    {!n.isRead && (
                      <button
                        onClick={(e) => handleMarkRead(n._id, e)}
                        className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        title="Dismiss"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                Notifications auto-delete after 30 days
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
