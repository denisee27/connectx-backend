import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function buildSendJoiningEventEmail({ name, eventTitle, eventDate, eventLocation, eventLink }) {
    const htmlPath = path.join(__dirname, "sendJoiningEvent.html");
    let html = fs.readFileSync(htmlPath, "utf8");

    html = html.replace("{{name}}", name)
        .replace("{{eventTitle}}", eventTitle)
        .replace("{{eventDate}}", eventDate)
        .replace("{{eventLocation}}", eventLocation)
        .replace("{{eventLink}}", eventLink)
        .replace("{{year}}", new Date().getFullYear());

    return {
        subject: `You've joined ${eventTitle}! 🎉`,
        html,
    };
}
