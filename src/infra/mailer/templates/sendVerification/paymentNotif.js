import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const htmlTemplatePath = path.join(__dirname, "paymentNotif.html");
const htmlTemplate = readFileSync(htmlTemplatePath, "utf8");

function interpolate(template, variables) {
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, key) => variables[key] ?? "");
}

export function buildPaymentNotificationEmail({ user, payment, status, roomName, frontendUrl }) {
  const primaryColor = "#FF9836";
  const secondaryColor = "#FF7A2F";
  const grayColor = "#6B7280";
  const lightGray = "#F3F4F6";

  let statusColor = "#3B82F6"; // Blue default
  let statusBgColor = "#EFF6FF"; // Blue 50
  let statusIcon = "ℹ️";
  let statusMessage = "";
  let subjectStatus = "Update";

  switch (status) {
    case "PENDING":
      statusColor = "#F59E0B";
      statusBgColor = "#FFF7ED"; // Orange 50
      statusIcon = "⏳";
      statusMessage = `Your payment for <strong>${roomName}</strong> is currently pending. Please complete it soon.`;
      subjectStatus = "Pending";
      break;
    case "PAID":
    case "SETTLED":
      statusColor = "#10B981";
      statusBgColor = "#ECFDF5"; // Emerald 50
      statusIcon = "✅";
      statusMessage = `Thank you! You have successfully registered for <strong>${roomName}</strong>. We look forward to seeing you there!`;
      subjectStatus = "Successful";
      status = "SUCCESS";
      break;
    case "EXPIRED":
      statusColor = "#EF4444";
      statusBgColor = "#FEF2F2"; // Red 50
      statusIcon = "⚠️";
      statusMessage = `The payment request for <strong>${roomName}</strong> has expired. Please create a new order.`;
      subjectStatus = "Expired";
      break;
    case "FAILED":
    case "CANCELED":
      statusColor = "#EF4444";
      statusBgColor = "#FEF2F2"; // Red 50
      statusIcon = "❌";
      statusMessage = `Your payment for <strong>${roomName}</strong> was failed or canceled.`;
      subjectStatus = status === "FAILED" ? "Failed" : "Canceled";
      break;
    default:
      statusColor = grayColor;
      statusBgColor = "#F3F4F6"; // Gray 100
      statusMessage = `Payment status for <strong>${roomName}</strong> updated to ${status}.`;
  }

  const subject = `Payment ${subjectStatus} - ConnectX`;

  const amountFormatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: payment.currency || "IDR",
  }).format(payment.amount);

  const dateFormatted = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const paymentMethod = (payment.method || "Unknown").replace(/_/g, " ");

  const html = interpolate(htmlTemplate, {
    lightGray,
    primaryColor,
    secondaryColor,
    statusColor,
    statusBgColor,
    grayColor,
    statusIcon,
    status,
    userName: user.name || "User",
    statusMessage,
    orderId: payment.orderId,
    amount: amountFormatted,
    paymentMethod,
    date: dateFormatted,
    frontendUrl: frontendUrl || "http://localhost:5173",
    year: new Date().getFullYear(),
  });

  // Simple text fallback
  const text = `
Hi ${user.name},

${statusMessage}

Order ID: ${payment.orderId}
Amount: ${amountFormatted}
Status: ${status}

Open ConnectX: ${frontendUrl || "http://localhost:5173"}/home
  `.trim();

  return {
    subject,
    html,
    text,
  };
}
