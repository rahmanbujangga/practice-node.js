const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Admin natours ${process.env.EMAIL_FROM_ADMIN}`;
  }

  createTransporter() {
    if (process.env.NODE_ENV === 'production') {
      return 1;
    }

    return nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: process.env.MAILTRAP_PORT,
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PW,
      },
    });
  }

  async send(template, subject) {
    //render html based on template
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      }
    );

    //define mail options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: subject,
      html,
      text: htmlToText.fromString(html),
    };

    //call transpotrter and sending mail
    await this.createTransporter().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send(
      'welcome',
      'Congrats you are joined one of the largest tours community !'
    );
  }

  async sendResetPassword() {
    await this.send(
      'resetPassword',
      'Your password reset token valid for 10 min'
    );
  }
};
