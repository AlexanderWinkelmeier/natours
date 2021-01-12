const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email; /* derjenige, der sein Passwort etc. vergessen hat */
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Alexander W <${process.env.EMAIL_FROM}>`; /* Adresse des Admin etc. der API */
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Create a transporter: hier ist der Transporter sendGrid
      // Sendgrid
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD
        }
      });
    }
    // Create a transporter: hier ist der Transporter mailtrap
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // Send the actual email
  async send(template, subject) {
    // 1) Render HTML based on a pug template
    // konvertiert die jeweilige pug-Datei in eine HTML-Datei
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject
    });

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html) // kovertiert die HTML-Darstellung der Email in einfache Text-Darstellung, die man dann in der Email auch sehen kann
    };

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  // angezeigte Email, abhängig vom "Thema"
  // diese Email wird automatisch verschickt, wenn sich ein User das erste Mal anmeldet, d.h. beim Sign In
  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }
  // diese Email, wird versendet, wenn der User sein Passwort resettet
  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)'
    );
  }
};
