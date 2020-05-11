import fs from 'fs';
import hbs from 'hbs';

const dirPath = __dirname + '/templates';

// used to send email
// render pug file to html content
export function renderTemplate(filename: string, data: any): string {
  try {
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }
    const content = fs.readFileSync(`${dirPath}/${filename}`, 'utf8').toString();
    hbs.registerPartial('mainContent', content);
    const source = fs.readFileSync(`${dirPath}/main_layout.hbs`, 'utf8').toString();
    const mailTemplate = hbs.handlebars.compile(source);
    return mailTemplate(data);
  } catch (error) {
    console.log(error);
    throw new Error(`Could not render template from ${filename}`);
  }
}
