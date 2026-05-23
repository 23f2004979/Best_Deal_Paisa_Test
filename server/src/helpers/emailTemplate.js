/**
 * Reusable HTML Email Templates featuring Best Deal Paisa Branding
 */

const LOGO_URL = "https://raw.githubusercontent.com/BestDealPaisa/assets/main/logo.png"; // Placeholder path for production hosting

/**
 * 1. Welcome / Account Activation Email
 */
function welcomeEmailTemplate(name, email, tempPassword, role, empId) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to Best Deal Paisa</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        .header { background-color: #0f172a; padding: 25px; text-align: center; border-bottom: 3px solid #ea580c; }
        .header img { height: 40px; }
        .body { padding: 40px 30px; }
        .greeting { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 20px; }
        .credentials-box { background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 25px 0; border: 1px solid #cbd5e1; }
        .credentials-box p { margin: 8px 0; font-size: 14px; }
        .btn-accent { display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff !important; font-weight: 600; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-size: 15px; margin-top: 15px; box-shadow: 0 4px 10px rgba(249, 115, 22, 0.2); }
        .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${LOGO_URL}" alt="Best Deal Paisa Logo" />
        </div>
        <div class="body">
          <div class="greeting">Hello ${name},</div>
          <p>Welcome to Best Deal Paisa! An employee portal account has been successfully created for you as a <strong>${role}</strong>.</p>
          <p>You can use the following credentials to access the portal and log your daily work, verification files, and attendance details.</p>
          
          <div class="credentials-box">
            <p><strong>Employee ID:</strong> ${empId}</p>
            <p><strong>Login Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> ${tempPassword}</p>
          </div>
          
          <p style="color: #64748b; font-size: 13px;">* For security reasons, please change your password immediately after your first login via your profile settings.</p>
          
          <div style="text-align: center;">
            <a href="https://portal.bestdealpaisa.com/login" class="btn-accent" target="_blank">Access Employee Portal</a>
          </div>
        </div>
        <div class="footer">
          Best Deal Paisa Portal &bull; Delhi NCR Office &bull; Private & Confidential Notification
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * 2. Password Reset Notification
 */
function passwordResetEmailTemplate(name, resetTime) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Security Alert: Password Changed</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        .header { background-color: #0f172a; padding: 25px; text-align: center; border-bottom: 3px solid #ea580c; }
        .header img { height: 40px; }
        .body { padding: 40px 30px; }
        .alert-title { font-size: 18px; font-weight: 700; color: #b91c1c; margin-bottom: 20px; }
        .warning-box { border-left: 4px solid #ea580c; padding-left: 15px; margin: 20px 0; background: #fff7ed; padding-top: 12px; padding-bottom: 12px; border-radius: 0 8px 8px 0; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${LOGO_URL}" alt="Best Deal Paisa Logo" />
        </div>
        <div class="body">
          <div class="alert-title">Security Alert: Password Updated</div>
          <p>Hello ${name},</p>
          <p>This is to confirm that the password for your Best Deal Paisa Employee Account was changed on <strong>${resetTime}</strong>.</p>
          
          <div class="warning-box">
            <p style="margin: 0; font-size: 14px; font-weight: 500; color: #c2410c;">If you did not authorize this change:</p>
            <p style="margin: 6px 0 0; font-size: 13px; color: #7c2d12;">Please contact your supervisor or administrative support immediately to lock your account and restore access.</p>
          </div>
          
          <p>For security, active sessions on all your mobile and desktop devices have been forcefully logged out.</p>
        </div>
        <div class="footer">
          Best Deal Paisa Portal &bull; Automated Security Alert &bull; Do not reply to this email
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * 3. File Approval / Status Change Notification
 */
function reportStatusEmailTemplate(name, reportNumber, title, status, comments, approverName) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Report Update: ${reportNumber}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        .header { background-color: #0f172a; padding: 25px; text-align: center; border-bottom: 3px solid #ea580c; }
        .header img { height: 40px; }
        .body { padding: 40px 30px; }
        .title { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 20px; }
        .status-badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 13px; font-weight: 700; text-transform: uppercase; margin-bottom: 20px; }
        .APPROVED { background-color: #d1fae5; color: #065f46; }
        .REJECTED { background-color: #fee2e2; color: #991b1b; }
        .CHANGES_REQUESTED { background-color: #e0f2fe; color: #0369a1; }
        .details-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .details-table td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
        .details-table td.label { font-weight: 600; color: #64748b; width: 130px; }
        .comment-section { background: #f8fafc; border-left: 3px solid #cbd5e1; padding: 12px 15px; margin: 20px 0; border-radius: 0 6px 6px 0; font-style: italic; font-size: 13px; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${LOGO_URL}" alt="Best Deal Paisa Logo" />
        </div>
        <div class="body">
          <div class="title">Lead Verification Report Update</div>
          <p>Hello ${name},</p>
          <p>The status of your submitted verification report has been updated by <strong>${approverName}</strong>:</p>
          
          <div class="status-badge ${status}">
            ${status.replace('_', ' ')}
          </div>
          
          <table class="details-table">
            <tr>
              <td class="label">Report No:</td>
              <td style="font-weight: 600;">${reportNumber}</td>
            </tr>
            <tr>
              <td class="label">Lead Title:</td>
              <td>${title}</td>
            </tr>
          </table>
          
          ${comments ? `
            <div style="margin-top: 20px; font-weight: 600; font-size: 13px; color: #475569;">Comments from Approver:</div>
            <div class="comment-section">
              "${comments}"
            </div>
          ` : ''}
        </div>
        <div class="footer">
          Best Deal Paisa Portal &bull; Automated Status Notification
        </div>
      </div>
    </body>
    </html>
  `;
}

module.exports = {
  welcomeEmailTemplate,
  passwordResetEmailTemplate,
  reportStatusEmailTemplate
};
