import Notification from '../models/Notification.js'
import Student from '../models/Student.js'

// Helper: retrieve notifications visible to current user
// Admin sees all, ustaz sees only their own students' notifications
export const getNotifications = async (req, res) => {
  try {
    const user = req.user
    let query = {}
    if (user.role !== 'admin') {
      // Ustaz: only notifications where ustazId matches
      query = { ustazId: user.id }
    }
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .lean()
    // Attach a simple isRead flag (readBy contains user IDs)
    const formatted = notifications.map((n) => ({
      _id: n._id,
      studentId: n.studentId,
      studentName: n.studentName,
      ustazId: n.ustazId,
      ustazName: n.ustazName,
      message: n.message,
      createdAt: n.createdAt,
      isRead: n.readBy && n.readBy.some(id => id && id.toString() === user.id)
    }))
    res.json(formatted)
  } catch (err) {
    console.error('Error fetching notifications', err)
    res.status(500).json({ message: err.message })
  }
}

// Mark a single notification as read for the current user
export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    const notif = await Notification.findById(id)
    if (!notif) return res.status(404).json({ message: 'Notification not found' })
    // Only allow owner or admin to mark
    if (req.user.role !== 'admin' && String(notif.ustazId) !== String(userId)) {
      return res.status(403).json({ message: 'Forbidden' })
    }
    // Avoid duplicate entries
    if (!notif.readBy.some(id => id && id.toString() === userId)) {
      notif.readBy.push(userId)
      await notif.save()
    }
    res.json({ message: 'Marked as read' })
  } catch (err) {
    console.error('Error marking notification read', err)
    res.status(500).json({ message: err.message })
  }
}

// Mark all notifications for the current user as read
export const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.user.id
    const filter = req.user.role === 'admin' ? {} : { ustazId: userId }
    await Notification.updateMany(filter, { $addToSet: { readBy: userId } })
    res.json({ message: 'All notifications marked as read' })
  } catch (err) {
    console.error('Error marking all notifications read', err)
    res.status(500).json({ message: err.message })
  }
}
