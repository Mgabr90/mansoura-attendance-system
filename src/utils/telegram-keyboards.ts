/**
 * Telegram Keyboard Builder Utility
 * Generates dynamic keyboard layouts for bot interactions
 */

import { InlineKeyboardMarkup, ReplyKeyboardMarkup, KeyboardButton } from 'node-telegram-bot-api';

export class KeyboardBuilder {
  /**
   * Get registration keyboard for new users
   */
  static getRegistrationKeyboard(): ReplyKeyboardMarkup {
    return {
      keyboard: [
        [
          {
            text: '📝 Register',
            request_contact: true
          }
        ]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    };
  }

  /**
   * Get contact sharing keyboard
   */
  static getContactKeyboard(): ReplyKeyboardMarkup {
    return {
      keyboard: [
        [
          {
            text: '📱 Share Contact',
            request_contact: true
          }
        ]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    };
  }

  /**
   * Get location sharing keyboard (context-aware)
   */
  static getLocationKeyboard(isCheckedIn: boolean): ReplyKeyboardMarkup {
    const buttons: KeyboardButton[][] = [];

    if (!isCheckedIn) {
      // Show check-in button
      buttons.push([
        {
          text: '📍 Check In',
          request_location: true
        }
      ]);
    } else {
      // Show check-out button
      buttons.push([
        {
          text: '📍 Check Out', 
          request_location: true
        }
      ]);
    }

    // Always show status and report buttons
    buttons.push([
      { text: '📊 My Status' },
      { text: '📈 My Report' }
    ]);

    return {
      keyboard: buttons,
      resize_keyboard: true,
      is_persistent: true
    };
  }

  /**
   * Get admin dashboard keyboard
   */
  static getAdminKeyboard(): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [
          { text: '👥 Employees', callback_data: 'admin_employees' },
          { text: '📊 Reports', callback_data: 'admin_reports' }
        ],
        [
          { text: '⚙️ Settings', callback_data: 'admin_settings' },
          { text: '🔧 System', callback_data: 'admin_system' }
        ],
        [
          { text: '📡 Webhook', callback_data: 'admin_webhook' },
          { text: '❤️ Health', callback_data: 'admin_health' }
        ]
      ]
    };
  }

  /**
   * Get employee management keyboard
   */
  static getEmployeeManagementKeyboard(): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [
          { text: '📋 List All', callback_data: 'emp_list_all' },
          { text: '👤 Search', callback_data: 'emp_search' }
        ],
        [
          { text: '➕ Add Admin', callback_data: 'emp_add_admin' },
          { text: '⏰ Set Hours', callback_data: 'emp_set_hours' }
        ],
        [
          { text: '🔙 Back', callback_data: 'admin_dashboard' }
        ]
      ]
    };
  }

  /**
   * Get employee detail keyboard
   */
  static getEmployeeDetailKeyboard(employeeId: string): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [
          { text: '📊 Report', callback_data: `emp_report_${employeeId}` },
          { text: '⏰ Exception', callback_data: `emp_exception_${employeeId}` }
        ],
        [
          { text: '👑 Make Admin', callback_data: `emp_admin_${employeeId}` },
          { text: '🚫 Deactivate', callback_data: `emp_deactivate_${employeeId}` }
        ],
        [
          { text: '🔙 Back', callback_data: 'admin_employees' }
        ]
      ]
    };
  }

  /**
   * Get webhook management keyboard
   */
  static getWebhookKeyboard(): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [
          { text: '📡 Set Webhook', callback_data: 'webhook_set' },
          { text: 'ℹ️ Info', callback_data: 'webhook_info' }
        ],
        [
          { text: '🗑️ Delete', callback_data: 'webhook_delete' },
          { text: '🔄 Update', callback_data: 'webhook_update' }
        ],
        [
          { text: '🔙 Back', callback_data: 'admin_dashboard' }
        ]
      ]
    };
  }

  /**
   * Get reports keyboard
   */
  static getReportsKeyboard(): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [
          { text: '📅 Today', callback_data: 'report_today' },
          { text: '📊 This Week', callback_data: 'report_week' }
        ],
        [
          { text: '📈 This Month', callback_data: 'report_month' },
          { text: '🗓️ Custom', callback_data: 'report_custom' }
        ],
        [
          { text: '📤 Export CSV', callback_data: 'export_csv' },
          { text: '📊 Export Excel', callback_data: 'export_excel' }
        ],
        [
          { text: '🔙 Back', callback_data: 'admin_dashboard' }
        ]
      ]
    };
  }

  /**
   * Get system settings keyboard
   */
  static getSystemKeyboard(): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [
          { text: '❤️ Health Check', callback_data: 'system_health' },
          { text: '📊 Stats', callback_data: 'system_stats' }
        ],
        [
          { text: '🔄 Restart Bot', callback_data: 'system_restart' },
          { text: '📜 Logs', callback_data: 'system_logs' }
        ],
        [
          { text: '🔙 Back', callback_data: 'admin_dashboard' }
        ]
      ]
    };
  }

  /**
   * Get confirmation keyboard
   */
  static getConfirmationKeyboard(action: string, id?: string): InlineKeyboardMarkup {
    const confirmData = id ? `confirm_${action}_${id}` : `confirm_${action}`;
    const cancelData = id ? `cancel_${action}_${id}` : `cancel_${action}`;

    return {
      inline_keyboard: [
        [
          { text: '✅ Confirm', callback_data: confirmData },
          { text: '❌ Cancel', callback_data: cancelData }
        ]
      ]
    };
  }

  /**
   * Get pagination keyboard
   */
  static getPaginationKeyboard(
    currentPage: number, 
    totalPages: number, 
    baseCallback: string
  ): InlineKeyboardMarkup {
    const buttons = [];

    // Navigation buttons
    const navButtons = [];
    
    if (currentPage > 1) {
      navButtons.push({ text: '⬅️', callback_data: `${baseCallback}_${currentPage - 1}` });
    }
    
    navButtons.push({ 
      text: `${currentPage}/${totalPages}`, 
      callback_data: 'page_info' 
    });
    
    if (currentPage < totalPages) {
      navButtons.push({ text: '➡️', callback_data: `${baseCallback}_${currentPage + 1}` });
    }

    if (navButtons.length > 0) {
      buttons.push(navButtons);
    }

    // Quick jump buttons for large sets
    if (totalPages > 5) {
      const jumpButtons = [];
      if (currentPage > 3) {
        jumpButtons.push({ text: '⏮️ First', callback_data: `${baseCallback}_1` });
      }
      if (currentPage < totalPages - 2) {
        jumpButtons.push({ text: '⏭️ Last', callback_data: `${baseCallback}_${totalPages}` });
      }
      if (jumpButtons.length > 0) {
        buttons.push(jumpButtons);
      }
    }

    return { inline_keyboard: buttons };
  }

  /**
   * Get time picker keyboard (for exceptional hours)
   */
  static getTimePickerKeyboard(type: 'start' | 'end'): InlineKeyboardMarkup {
    const hours = [];
    
    // Create time slots from 6:00 to 20:00
    for (let hour = 6; hour <= 20; hour++) {
      const timeStr = `${hour.toString().padStart(2, '0')}:00`;
      hours.push({
        text: timeStr,
        callback_data: `time_${type}_${timeStr}`
      });
    }

    // Split into rows of 3
    const rows = [];
    for (let i = 0; i < hours.length; i += 3) {
      rows.push(hours.slice(i, i + 3));
    }

    // Add custom time option
    rows.push([{ text: '⌨️ Custom Time', callback_data: `time_${type}_custom` }]);

    return { inline_keyboard: rows };
  }

  /**
   * Get reason selection keyboard
   */
  static getReasonKeyboard(type: 'late' | 'early'): InlineKeyboardMarkup {
    const reasons = type === 'late' ? [
      { text: '🚗 Traffic', callback_data: 'reason_traffic' },
      { text: '🏥 Medical', callback_data: 'reason_medical' },
      { text: '👨‍👩‍👧‍👦 Family', callback_data: 'reason_family' },
      { text: '🚌 Transport', callback_data: 'reason_transport' },
      { text: '☔ Weather', callback_data: 'reason_weather' },
      { text: '✍️ Other', callback_data: 'reason_other' }
    ] : [
      { text: '🏥 Medical', callback_data: 'reason_medical' },
      { text: '👨‍👩‍👧‍👦 Family', callback_data: 'reason_family' },
      { text: '📋 Meeting', callback_data: 'reason_meeting' },
      { text: '🚨 Emergency', callback_data: 'reason_emergency' },
      { text: '✅ Finished Work', callback_data: 'reason_finished' },
      { text: '✍️ Other', callback_data: 'reason_other' }
    ];

    // Split into rows of 2
    const rows = [];
    for (let i = 0; i < reasons.length; i += 2) {
      rows.push(reasons.slice(i, i + 2));
    }

    return { inline_keyboard: rows };
  }

  /**
   * Get main menu keyboard for employees
   */
  static getMainMenuKeyboard(isCheckedIn: boolean): ReplyKeyboardMarkup {
    const buttons: KeyboardButton[][] = [
      [
        { text: isCheckedIn ? '📍 Check Out' : '📍 Check In', request_location: true }
      ],
      [
        { text: '📊 My Status' },
        { text: '📈 My Report' }
      ],
      [
        { text: '⚙️ Settings' },
        { text: '❓ Help' }
      ]
    ];

    return {
      keyboard: buttons,
      resize_keyboard: true,
      is_persistent: true
    };
  }

  /**
   * Remove keyboard
   */
  static removeKeyboard() {
    return {
      remove_keyboard: true
    };
  }
} 