/**
 * Telegram Message Formatter Utility
 * Provides formatted messages for the Telegram bot with rich formatting
 */

export interface DailySummaryData {
  date: Date;
  totalEmployees: number;
  checkedIn: number;
  checkedOut: number;
  lateCheckins: number;
  earlyCheckouts: number;
  attendanceRate: number;
}

export interface EmployeeInfo {
  firstName: string;
  lastName?: string;
  username?: string;
  telegramId: string;
}

export class MessageFormatter {
  /**
   * Format welcome message for new or returning users
   */
  static formatWelcomeMessage(firstName: string, isRegistered: boolean): string {
    const name = firstName;
    
    if (!isRegistered) {
      return `👋 **Welcome to El Mansoura CIH Attendance System!**

Hello ${name}! 

This is your modern attendance tracking system with GPS verification.

🎯 **What you can do:**
• Check in/out with location sharing
• View your attendance status
• Get daily reports
• Receive automated reminders

📱 **To get started:**
Please register first by clicking the 'Register' button below.

🏢 **Office Location:** El Mansoura CIH
📍 **Radius:** 100 meters
⏰ **Work Hours:** 9:00 AM - 5:00 PM`;
    }

    return `👋 **Welcome back, ${name}!**

✅ You are registered and ready to use the system.

🎯 **Quick Actions:**
• Share location to check in/out
• Check your current status
• View attendance reports

📊 Current time: ${new Date().toLocaleTimeString('en-US', { 
      timeZone: 'Africa/Cairo',
      hour12: false 
    })}`;
  }

  /**
   * Format daily summary report for admins
   */
  static formatDailySummary(data: DailySummaryData): string {
    const dateStr = data.date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `📊 **Daily Attendance Summary**
📅 ${dateStr}

👥 **Employee Statistics:**
• Total Employees: ${data.totalEmployees}
• Checked In Today: ${data.checkedIn}
• Completed Day: ${data.checkedOut}
• Still Working: ${data.checkedIn - data.checkedOut}

⚠️ **Attention Needed:**
• Late Arrivals: ${data.lateCheckins}
• Early Departures: ${data.earlyCheckouts}

📈 **Performance:**
• Attendance Rate: ${data.attendanceRate.toFixed(1)}%
• On-time Rate: ${(((data.checkedIn - data.lateCheckins) / data.totalEmployees) * 100).toFixed(1)}%

Generated at ${new Date().toLocaleTimeString('en-US', { 
      timeZone: 'Africa/Cairo',
      hour12: false 
    })}`;
  }

  /**
   * Format location denied message
   */
  static formatLocationDeniedMessage(distance: number): string {
    return `❌ **Location Not Allowed**

You are **${distance.toFixed(0)} meters** away from the office.

🏢 **Office Location:** El Mansoura CIH
📍 **Required Distance:** Within 100 meters
📍 **Your Distance:** ${distance.toFixed(0)} meters

Please move closer to the office to check in/out.

💡 **Tip:** Make sure your GPS is accurate and you're within the office premises.`;
  }

  /**
   * Format error messages
   */
  static formatErrorMessage(errorType: string, details?: string): string {
    const messages = {
      not_registered: `❌ **Not Registered**

You need to register first before using the attendance system.

Please click the 'Register' button and share your contact information.`,

      already_checked_in: `⚠️ **Already Checked In**

You have already checked in today. 

Use the 'Check Out' button when you're ready to leave.`,

      not_checked_in: `⚠️ **Not Checked In**

You haven't checked in today yet.

Please check in first before trying to check out.`,

      invalid_location: `❌ **Invalid Location**

Please share your live location using the location button.

Manual location entry is not allowed for security reasons.`,

      system_error: `🚫 **System Error**

Something went wrong. Please try again in a moment.

If the problem persists, contact your administrator.`,

      permission_denied: `🔒 **Permission Denied**

You don't have permission to perform this action.

Contact an administrator if you believe this is an error.`
    };

    const baseMessage = messages[errorType as keyof typeof messages] || messages.system_error;
    return details ? `${baseMessage}\n\n**Details:** ${details}` : baseMessage;
  }

  /**
   * Format check-in success message
   */
  static formatCheckInSuccess(time: string, isLate: boolean, distance: number): string {
    const status = isLate ? '⚠️ **Late Check-in**' : '✅ **Check-in Successful**';
    const lateNote = isLate ? '\n\n⏰ *Note: This is recorded as a late arrival*' : '';

    return `${status}

🕐 **Time:** ${time}
📍 **Distance:** ${distance.toFixed(0)}m from office
📅 **Date:** ${new Date().toLocaleDateString('en-US')}

Have a productive day! 🎯${lateNote}`;
  }

  /**
   * Format check-out success message
   */
  static formatCheckOutSuccess(time: string, isEarly: boolean, workingHours: number): string {
    const status = isEarly ? '⚠️ **Early Check-out**' : '✅ **Check-out Successful**';
    const earlyNote = isEarly ? '\n\n⏰ *Note: This is recorded as an early departure*' : '';

    return `${status}

🕐 **Time:** ${time}
⏱️ **Working Hours:** ${workingHours.toFixed(1)} hours
📅 **Date:** ${new Date().toLocaleDateString('en-US')}

Great work today! See you tomorrow! 👋${earlyNote}`;
  }

  /**
   * Format attendance status message
   */
  static formatAttendanceStatus(
    date: Date,
    checkInTime?: Date,
    checkOutTime?: Date,
    isLate?: boolean,
    isEarly?: boolean,
    workingHours?: number
  ): string {
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });

    let message = `📊 **Attendance Status**\n📅 ${dateStr}\n\n`;

    if (!checkInTime) {
      message += '❌ **Status:** Not checked in\n\n';
      message += '💡 Share your location to check in when you arrive at the office.';
      return message;
    }

    const checkInStr = checkInTime.toLocaleTimeString('en-US', { 
      hour12: false,
      timeZone: 'Africa/Cairo'
    });
    
    message += `✅ **Check-in:** ${checkInStr}`;
    if (isLate) {
      message += ' ⚠️ (Late)';
    }
    message += '\n';

    if (checkOutTime) {
      const checkOutStr = checkOutTime.toLocaleTimeString('en-US', { 
        hour12: false,
        timeZone: 'Africa/Cairo'
      });
      message += `🏁 **Check-out:** ${checkOutStr}`;
      if (isEarly) {
        message += ' ⚠️ (Early)';
      }
      message += '\n';
      
      if (workingHours) {
        message += `⏱️ **Working Hours:** ${workingHours.toFixed(1)} hours\n`;
      }
      
      message += '\n✅ **Status:** Day completed';
    } else {
      message += '\n🟡 **Status:** Currently working';
      message += '\n\n💡 Don\'t forget to check out when you leave!';
    }

    return message;
  }

  /**
   * Format admin alert messages
   */
  static formatLateAlert(employee: EmployeeInfo, checkInTime: Date, minutesLate: number): string {
    const timeStr = checkInTime.toLocaleTimeString('en-US', { 
      hour12: false,
      timeZone: 'Africa/Cairo'
    });

    return `🕐 **Late Arrival Alert**

👤 **Employee:** ${employee.firstName} ${employee.lastName || ''}
📱 **Username:** @${employee.username || 'N/A'}
🆔 **ID:** \`${employee.telegramId}\`

⏰ **Check-in Time:** ${timeStr}
⚠️ **Minutes Late:** ${minutesLate}

📅 **Date:** ${new Date().toLocaleDateString('en-US')}`;
  }

  /**
   * Format early departure alert
   */
  static formatEarlyDepartureAlert(employee: EmployeeInfo, checkOutTime: Date, minutesEarly: number): string {
    const timeStr = checkOutTime.toLocaleTimeString('en-US', { 
      hour12: false,
      timeZone: 'Africa/Cairo'
    });

    return `🕕 **Early Departure Alert**

👤 **Employee:** ${employee.firstName} ${employee.lastName || ''}
📱 **Username:** @${employee.username || 'N/A'}
🆔 **ID:** \`${employee.telegramId}\`

⏰ **Check-out Time:** ${timeStr}
⚠️ **Minutes Early:** ${minutesEarly}

📅 **Date:** ${new Date().toLocaleDateString('en-US')}`;
  }

  /**
   * Format employee report
   */
  static formatEmployeeReport(
    employee: EmployeeInfo,
    records: Array<{
      date: Date;
      checkInTime?: Date;
      checkOutTime?: Date;
      isLate: boolean;
      isEarly: boolean;
      workingHours?: number;
    }>,
    periodDays: number
  ): string {
    const attendanceDays = records.filter(r => r.checkInTime).length;
    const lateDays = records.filter(r => r.isLate).length;
    const earlyDays = records.filter(r => r.isEarly).length;
    const avgHours = records
      .filter(r => r.workingHours)
      .reduce((sum, r) => sum + (r.workingHours || 0), 0) / attendanceDays || 0;

    let message = `📊 **Personal Attendance Report**

👤 **Employee:** ${employee.firstName} ${employee.lastName || ''}
📅 **Period:** Last ${periodDays} days

📈 **Summary:**
• Days Attended: ${attendanceDays}/${periodDays}
• Attendance Rate: ${((attendanceDays / periodDays) * 100).toFixed(1)}%
• Late Arrivals: ${lateDays}
• Early Departures: ${earlyDays}
• Avg Working Hours: ${avgHours.toFixed(1)} hrs/day

📋 **Recent Records:**\n`;

    // Show last 5 records
    const recentRecords = records.slice(-5).reverse();
    for (const record of recentRecords) {
      const dateStr = record.date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      
      if (record.checkInTime) {
        const checkIn = record.checkInTime.toLocaleTimeString('en-US', { 
          hour12: false,
          timeZone: 'Africa/Cairo'
        }).substring(0, 5);
        
        const checkOut = record.checkOutTime ? 
          record.checkOutTime.toLocaleTimeString('en-US', { 
            hour12: false,
            timeZone: 'Africa/Cairo'
          }).substring(0, 5) : 'N/A';
          
        const hours = record.workingHours ? `${record.workingHours.toFixed(1)}h` : 'N/A';
        const flags = `${record.isLate ? '⚠️' : '✅'}${record.isEarly ? '⚠️' : ''}`;
        
        message += `${dateStr}: ${checkIn}-${checkOut} (${hours}) ${flags}\n`;
      } else {
        message += `${dateStr}: ❌ Absent\n`;
      }
    }

    return message;
  }

  /**
   * Format admin dashboard
   */
  static formatAdminDashboard(summary: DailySummaryData): string {
    return `🎛️ **Admin Dashboard**

📊 **Today's Overview:**
${this.formatDailySummary(summary)}

🔧 **Quick Actions:**
• /list_employees - Manage employees
• /admin_report - Detailed reports
• /exceptional_hours - Set custom hours
• /server_status - System health

⚙️ **System Commands:**
• /set_webhook - Configure webhook
• /webhook_info - Webhook status
• /add_admin - Add administrator`;
  }
} 