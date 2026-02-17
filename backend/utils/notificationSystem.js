import Notification from '../models/Notification.js';
import Case from '../models/Case.js';

export const notifyAllParties = async (caseData, message, type = 'info') => {
  try {
    // 1. Identify all recipients
    const recipients = [
      { id: caseData.filedBy, role: 'Citizen' },         // The Citizen
      { id: caseData.assignedLawyer, role: 'Lawyer' },   // The Lawyer
      { id: caseData.assignedPolice, role: 'Police' },   // The Police
      { id: caseData.assignedJudge, role: 'Judge' }      // The Judge
    ];

    // 2. Filter out empty IDs (e.g., if no police is assigned yet)
    const validRecipients = recipients.filter(r => r.id);

    // 3. Create Notifications
    const notifications = validRecipients.map(recipient => ({
      recipient: recipient.id,
      message: message, // You can customize this per role if needed
      type: type,
      caseId: caseData._id,
      read: false,
      createdAt: new Date()
    }));

    // 4. Save to Database
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      console.log(`🔔 Sent notifications to ${notifications.length} parties.`);
    }

  } catch (error) {
    console.error("Notification System Error:", error);
  }
};