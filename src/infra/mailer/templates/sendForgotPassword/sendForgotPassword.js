import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const htmlTemplatePath = path.join(__dirname, "sendForgotPassword.html");
const htmlTemplate = readFileSync(htmlTemplatePath, "utf8");

function interpolate(template, variables) {
    return template.replace(/{{\s*(\w+)\s*}}/g, (_, key) => variables[key] ?? "");
}

function buildResetPasswordUrl(appUrl, token) {
    const baseUrl = appUrl?.endsWith("/") ? appUrl.slice(0, -1) : appUrl;
    return `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
}

export function buildSendForgotPasswordEmail({ appUrl, token, name, username }) {
    if (!appUrl) {
        throw new Error("buildSendForgotPasswordEmail: appUrl is required");
    }
    if (!token) {
        throw new Error("buildSendForgotPasswordEmail: token is required");
    }

    const displayName = (name || username || "there").trim();
    const resetUrl = buildResetPasswordUrl(appUrl, token);

    const html = interpolate(htmlTemplate, {
        displayName,
        resetUrl,
    });

    const text = [
        `Hi ${displayName},`,
        "We heard you’re having trouble signing in. Use the link below to set a new password:",
        resetUrl,
        "",
        "If you didn’t request this, you can safely ignore the email.",
    ].join("\n");

    return {
        subject: "Reset your password",
        html,
        text,
    };
}