import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('Admin123!', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@accessfinancial.com' },
    update: {},
    create: {
      email: 'admin@accessfinancial.com',
      password: hashedPassword,
      role: 'SYSTEM_ADMIN',
      emailVerified: true,
    },
  });

  console.log('Created admin user:', adminUser.email);

  // Create default settings
  const settings = [
    { key: 'default_affiliate_url', value: 'https://accessfinancial.com/referral_form', description: 'Default base URL for affiliate links' },
    { key: 'maintenance_mode', value: 'false', description: 'Enable/disable maintenance mode' },
    { key: 'require_approval', value: 'true', description: 'Require admin approval for new affiliates' },
    { key: 'manager_notification_emails', value: JSON.stringify(['marketing@accessfinancial.com']), description: 'Email addresses for internal notifications' },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value, description: setting.description },
      create: setting,
    });
  }

  console.log('Created default settings');

  // Create email templates
  const templates = [
    {
      name: 'Application Pending',
      subject: 'Verify your email address',
      body: `
        <h2>Welcome to Access Financial Affiliate Portal</h2>
        <p>Hello {name},</p>
        <p>Thank you for registering as an affiliate partner. Please verify your email address by clicking the link below:</p>
        <p><a href="{verification_url}">Verify Email</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>Best regards,<br>Access Financial Team</p>
      `,
      enabled: true,
      variables: ['{name}', '{verification_url}'],
    },
    {
      name: 'Application Accepted',
      subject: 'Your affiliate application has been approved',
      body: `
        <h2>Congratulations!</h2>
        <p>Hello {name},</p>
        <p>Your affiliate application has been approved. You can now log in to your dashboard and start referring clients.</p>
        <p><a href="{frontend_url}/login">Login to Dashboard</a></p>
        <p>Best regards,<br>Access Financial Team</p>
      `,
      enabled: true,
      variables: ['{name}', '{frontend_url}'],
    },
    {
      name: 'Application Rejected',
      subject: 'Affiliate application status',
      body: `
        <h2>Application Status</h2>
        <p>Hello {name},</p>
        <p>We regret to inform you that your affiliate application could not be approved at this time.</p>
        <p>If you have any questions, please contact us.</p>
        <p>Best regards,<br>Access Financial Team</p>
      `,
      enabled: true,
      variables: ['{name}'],
    },
    {
      name: 'Payment Done',
      subject: 'Commission payment processed',
      body: `
        <h2>Payment Notification</h2>
        <p>Hello {name},</p>
        <p>Your commission payment of {amount} has been processed.</p>
        <p>Thank you for your partnership!</p>
        <p>Best regards,<br>Access Financial Team</p>
      `,
      enabled: true,
      variables: ['{name}', '{amount}'],
    },
    {
      name: 'New Affiliate Registration',
      subject: 'New affiliate registration',
      body: `
        <h2>New Affiliate Registration</h2>
        <p>A new affiliate has registered:</p>
        <ul>
          <li>Name: {name}</li>
          <li>Email: {user_email}</li>
          <li>Account Type: {account_type}</li>
          <li>Company: {company_name}</li>
        </ul>
        <p>Please review and approve/reject the application.</p>
      `,
      enabled: true,
      variables: ['{name}', '{user_email}', '{account_type}', '{company_name}'],
    },
    {
      name: 'New Referral',
      subject: 'New referral submission',
      body: `
        <h2>New Referral</h2>
        <p>A new referral has been submitted.</p>
        <p><a href="{referral_url}">View Referral</a></p>
      `,
      enabled: true,
      variables: ['{referral_url}'],
    },
  ];

  for (const template of templates) {
    await prisma.emailTemplate.upsert({
      where: { name: template.name },
      update: {
        subject: template.subject,
        body: template.body,
        variables: template.variables,
      },
      create: template,
    });
  }

  console.log('Created email templates');

  console.log('Seeding completed!');
  console.log('Admin credentials:');
  console.log('  Email: admin@accessfinancial.com');
  console.log('  Password: Admin123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
