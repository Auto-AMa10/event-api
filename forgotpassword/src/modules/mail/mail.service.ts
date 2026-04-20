import fs from "fs/promises";
import handlebars from "handlebars";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createTransport, Transporter } from "nodemailer";

export class MailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER, // email
        pass: process.env.MAIL_PASS, // app password
      },
    });
  }

  sendMail = async ({
    to,
    subject,
    templateName,
    context,
  }: {
    to: string;
    subject: string;
    templateName: string;
    context: any;
  }) => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    const templateDir = path.resolve(__dirname, "./templates");
    const templatePath = path.join(templateDir, `${templateName}.hbs`);
    const templateSource = await fs.readFile(templatePath, "utf-8");
    const compiledTemplate = handlebars.compile(templateSource);

    await this.transporter.sendMail({
      to: to,
      subject: subject,
      html: compiledTemplate(context),
    });
  };
}
