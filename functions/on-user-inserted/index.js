const functions = require('@google-cloud/functions-framework')
const brevo = require('@getbrevo/brevo')
const admin = require('firebase-admin')

admin.initializeApp()
console.log('firebase-admin version:', require('firebase-admin/package.json').version);
console.log('admin keys:', Object.keys(admin));
console.log('typeof admin.auth:', typeof admin.auth);
console.log(brevo);
const apiInstance = new brevo.BrevoClient({apiKey : process.env.BREVO_API_KEY});

async function sendVerificationEmail(toEmail, link) {
  const email = new brevo.SendSmtpEmail();
  email.sender = { name: 'Loadframe', email: 'noreply@yourdomain.com' };
  email.to = [{ email: toEmail }];
  email.subject = 'Verify your email for Loadframe';
  email.htmlContent = `
    <p>Click the link below to verify your email:</p>
    <p><a href="${link}">Verify Email</a></p>
    <p>If you didn't request this, you can ignore this email.</p>
  `;
  await apiInstance.sendTransacEmail(email);
}


functions.cloudEvent('onUserInserted', async(cloudEvent)=>{
    const base64Data = cloudEvent.data.message.data;
    const user = JSON.parse(Buffer.from(base64Data, 'base64').toString());
    console.log('User : ' + user);
    const actionCodeSettings = {
        url: 'http://localhost:5173', // redirect after clicking
        handleCodeInApp: false,
    };
    const link = await admin.auth().generateEmailVerificationLink(user.email, actionCodeSettings);
    console.log('Link : ' + link);
    await sendVerificationEmail(user.email, link);

    console.log(`Verification link sent to ${user.email}`);
})