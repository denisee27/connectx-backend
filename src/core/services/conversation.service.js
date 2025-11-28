import axios from "axios";
import crypto from "crypto";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleAuth } from "google-auth-library";
import { AppError } from "../errors/httpErrors.js";

const AGENT_QUERY_PATH = ":query";
const AGENT_STREAM_QUERY_PATH = ":streamQuery?alt=sse";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVICE_ACCOUNT_PATH = path.resolve(
  __dirname,
  "../../../key/strange-mind-475717-i4-7c3713d03a9c.json"
);

const jsonBlockRegex = /\^\^\^(?:\s*\S+)?\s*([\s\S]*?)\^\^\^/g;

const safeJsonParse = (maybeJson) => {
  if (typeof maybeJson !== "string") {
    return null;
  }
  try {
    return JSON.parse(maybeJson);
  } catch (error) {
    return null;
  }
};

const stripInvalidJsonEscapes = (value) => {
  if (typeof value !== "string" || value.indexOf("\\") === -1) {
    return value;
  }

  let result = "";
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (char === "\\" && value[i + 1] === "'") {
      let backslashCount = 0;
      for (let j = i - 1; j >= 0 && value[j] === "\\"; j--) {
        backslashCount++;
      }
      if (backslashCount % 2 === 0) {
        continue;
      }
    }
    result += char;
  }
  return result;
};

function cleanJsonString(raw) {
  let s = raw;
  s = s.replace(/`/g, "");
  s = s.replace(/'\s*\+\s*$/gm, "");
  s = s.replace(/^\s*'\s*\+\s*/gm, "");
  s = s.replace(/\r/g, "");
  s = s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  s = s.replace(/^\s*json\s*\n/, "");
  return s.trim();
}

function tryParseJsonSafe(str) {
  try {
    return JSON.parse(str);
  } catch (_) {
    const noTrailingCommas = str.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
    return JSON.parse(noTrailingCommas);
  }
}

const parseJsonCandidate = (candidate) => {
  if (typeof candidate !== "string") {
    return null;
  }
  const direct = safeJsonParse(candidate);
  if (direct) {
    return direct;
  }
  const sanitizedEscapes = stripInvalidJsonEscapes(candidate);
  if (sanitizedEscapes !== candidate) {
    const parsed = safeJsonParse(sanitizedEscapes);
    if (parsed) {
      return parsed;
    }
  }
  const cleaned = cleanJsonString(candidate);
  try {
    return tryParseJsonSafe(cleaned);
  } catch (_) {
    return null;
  }
};

const extractStructuredAgentPayload = (rawData) => {
  if (typeof rawData !== "string") {
    return { structuredPayload: null, plainText: "" };
  }

  jsonBlockRegex.lastIndex = 0;
  const matches = [...rawData.matchAll(jsonBlockRegex)];
  let structuredPayload = null;

  for (const match of matches) {
    const [, block] = match ?? [];
    if (!block) continue;

    let candidate = block.trim();
    if (!candidate) continue;

    const firstStructureIndex = candidate.search(/[{\[]/);
    if (firstStructureIndex > 0) {
      candidate = candidate.slice(firstStructureIndex).trim();
    }

    const openingChar = candidate[0];
    if (openingChar !== "{" && openingChar !== "[") {
      continue;
    }

    const closingChar = openingChar === "[" ? "]" : "}";
    const lastClosingIndex = candidate.lastIndexOf(closingChar);
    if (lastClosingIndex === -1) {
      continue;
    }

    const jsonSlice = candidate.slice(0, lastClosingIndex + 1);
    const parsed = parseJsonCandidate(jsonSlice);
    if (parsed) {
      structuredPayload = parsed;
      break;
    }
  }

  let plainText = rawData;
  if (matches.length) {
    for (const match of matches) {
      if (!match) continue;
      plainText = plainText.replace(match[0], "");
    }
  }
  plainText = plainText.trim();

  return { structuredPayload, plainText };
};

const extractAllJsonBlocksAndPlainText = (rawData) => {
  if (typeof rawData !== "string") {
    return { jsonBlocks: [], plainText: "" };
  }

  jsonBlockRegex.lastIndex = 0;
  const matches = [...rawData.matchAll(jsonBlockRegex)];
  const jsonBlocks = [];

  for (const match of matches) {
    const [, block] = match ?? [];
    if (!block) continue;

    let candidate = block.trim();
    if (!candidate) continue;

    const firstStructureIndex = candidate.search(/[\{\[]/);
    if (firstStructureIndex > 0) {
      candidate = candidate.slice(firstStructureIndex).trim();
    }

    const openingChar = candidate[0];
    if (openingChar !== "{" && openingChar !== "[") {
      continue;
    }

    const closingChar = openingChar === "[" ? "]" : "}";
    const lastClosingIndex = candidate.lastIndexOf(closingChar);
    if (lastClosingIndex === -1) {
      continue;
    }

    const jsonSlice = candidate.slice(0, lastClosingIndex + 1);
    const parsed = parseJsonCandidate(jsonSlice);
    if (parsed) {
      jsonBlocks.push(parsed);
    }
  }

  let plainText = rawData;
  if (matches.length) {
    for (const match of matches) {
      if (!match) continue;
      plainText = plainText.replace(match[0], "");
    }
  }
  plainText = plainText.trim();

  return { jsonBlocks, plainText };
};

const extractTitleFromStructuredPayload = (payload) => {
  const seen = new Set();
  const queue = [payload];

  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== "object") continue;
    if (seen.has(current)) continue;
    seen.add(current);

    // Look for a marker object where title === "title"
    if (typeof current.title === "string") {
      const marker = normalizeWhitespace(current.title).toLowerCase();
      if (marker === "title") {
        const candidate = normalizeWhitespace(
          typeof current.markdown === "string" ? current.markdown : current.title
        );
        if (candidate) {
          return candidate.length > 80 ? `${candidate.slice(0, 77)}...` : candidate;
        }
      }
    }

    if (Array.isArray(current)) {
      current.forEach((item) => queue.push(item));
    } else {
      Object.values(current).forEach((val) => queue.push(val));
    }
  }

  return null;
};

const extractSessionMetadata = (payload) => {
  if (!payload) return {};
  const candidateSources = [payload, payload.output, payload.session, payload.output?.session];
  for (const source of candidateSources) {
    if (!source) continue;
    const sessionId =
      source.session_id ||
      source.sessionId ||
      source.id ||
      source.session?.id ||
      source.session?.session_id;
    const name =
      source.display_name ||
      source.name ||
      source.session_name ||
      source.session?.name ||
      source.session?.display_name;
    if (sessionId) {
      return { sessionId, name };
    }
  }
  return {};
};

const makeEncryptor = (secret) => {
  const key = crypto.createHash("sha256").update(secret).digest();

  const encrypt = (plainText) => {
    if (!plainText) return plainText;
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString("base64");
  };

  const decrypt = (cipherText) => {
    if (!cipherText) return cipherText;
    const buffer = Buffer.from(cipherText, "base64");
    const iv = buffer.subarray(0, 12);
    const tag = buffer.subarray(12, 28);
    const encrypted = buffer.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
  };

  return { encrypt, decrypt };
};

const normalizeAgentStreamChunks = (responseData) => {
  const chunks = [];

  const pushTextParts = (parts) => {
    if (!Array.isArray(parts)) return;
    for (const part of parts) {
      const text = typeof part?.text === "string" ? part.text : null;
      if (text) {
        chunks.push(text);
      }
    }
  };

  const harvestFromContent = (content) => {
    if (!content || typeof content !== "object") return;
    if (Array.isArray(content)) {
      pushTextParts(content);
      return;
    }
    if (Array.isArray(content.parts)) {
      pushTextParts(content.parts);
    }
  };

  const collectFromEntry = (entry) => {
    if (!entry) return;
    if (Array.isArray(entry)) {
      entry.forEach((item) => collectFromEntry(item));
      return;
    }
    if (typeof entry !== "object") {
      if (typeof entry === "string" && entry.trim()) {
        chunks.push(entry.trim());
      }
      return;
    }

    if (entry.data && entry.data !== entry && typeof entry.data === "object") {
      collectFromEntry(entry.data);
    }

    const candidateGroups = [
      entry.candidates,
      entry.output?.candidates,
      entry.data?.candidates,
    ].filter(Array.isArray);

    for (const candidates of candidateGroups) {
      for (const candidate of candidates) {
        harvestFromContent(candidate?.content ?? candidate);
      }
    }

    if (Array.isArray(entry.output?.events)) {
      entry.output.events.forEach((evt) => collectFromEntry(evt));
    }

    const contentCandidates = [
      entry.content,
      entry.output?.content,
      entry.message,
      entry.output?.message,
      entry.data?.content,
      entry.parts,
      entry.output?.parts,
      entry.data?.parts,
    ];
    contentCandidates.forEach((content) => harvestFromContent(content));

    const textFields = [
      entry.text,
      entry.output?.text,
      entry.data?.text,
      entry.message,
      entry.output?.message,
      entry.data,
      entry.output?.data,
    ];
    textFields.forEach((value) => {
      if (typeof value === "string" && value.trim()) {
        chunks.push(value.trim());
      }
    });
  };

  if (typeof responseData === "string") {
    const parsedWhole = parseJsonCandidate(responseData);
    if (parsedWhole) {
      collectFromEntry(parsedWhole);
    } else {
      responseData
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .forEach((line) => {
          const normalizedLine = line.startsWith("data:") ? line.slice(5).trim() : line;
          if (!normalizedLine || normalizedLine === "[DONE]") {
            return;
          }
          const parsedLine = parseJsonCandidate(normalizedLine);
          if (parsedLine) {
            collectFromEntry(parsedLine);
          } else {
            chunks.push(normalizedLine);
          }
        });
    }
  } else {
    collectFromEntry(responseData);
  }

  return chunks;
};

const deriveConversationTitle = ({ userMessage, aiText, currentName, structuredTitle }) => {
  if (!isDefaultTitle(currentName)) {
    return null;
  }

  return (
    structuredTitle ??
    buildItineraryTitle(userMessage) ??
    buildTitleFromText({ userMessage, aiText })
  );
};

export function makeConversationService({
  userRepository,
  currentSessionRepository,
  logger,
  env,
}) {
  let agentToken = null;
  let agentTokenLoaded = false;
  const service = {};
  const { encrypt, decrypt } = makeEncryptor(env.JWT_SECRET ?? "temp-current-session-secret");

  const persistAgentToken = async (token) => {
    if (!token) return;
    try {
      const encrypted = encrypt(token);
      await currentSessionRepository.saveEncryptedSession(encrypted);
    } catch (err) {
      logger?.error?.(err, "Failed to persist encrypted agent token");
    }
  };

  const ensureAgentToken = async () => {
    if (agentTokenLoaded) {
      return agentToken;
    }

    try {
      const stored = await currentSessionRepository.getCurrentSession();
      if (stored?.currentSession) {
        agentToken = decrypt(stored.currentSession);
        console.log("agentToken", agentToken);
      }
    } catch (err) {
      logger?.error?.(err, "Failed to load stored agent token");
    }

    if (!agentToken && env.TOKENAGENT) {
      agentToken = env.TOKENAGENT;
      await persistAgentToken(agentToken);
    }

    agentTokenLoaded = true;
    return agentToken;
  };

  const agentClient = axios.create({
    baseURL: env.AGENTURL,
    headers: { "Content-Type": "application/json" },
  });

  const resolveAgentAuthOptions = () => {
    if (env.GCP_AGENT_CREDENTIALS) {
      try {
        return { credentials: JSON.parse(env.GCP_AGENT_CREDENTIALS) };
      } catch (error) {
        logger?.warn?.(error, "Failed to parse GCP_AGENT_CREDENTIALS secret");
      }
    }
    if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
      return { keyFilename: SERVICE_ACCOUNT_PATH };
    }
    return {};
  };

  agentClient.interceptors.request.use(async (config) => {
    const token = await ensureAgentToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  agentClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const nextToken = await service.refreshAgentToken();
          if (nextToken) {
            originalRequest.headers = originalRequest.headers ?? {};
            console.log("nextToken");
            originalRequest.headers.Authorization = `Bearer ${nextToken}`;
          }
          return agentClient(originalRequest);
        } catch (refreshError) {
          logger?.error?.(refreshError, "Failed to refresh agent token");
          throw refreshError;
        }
      }
      return Promise.reject(error);
    }
  );


  service.createConversation = async (clientContext, userId) => {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const body = {
      class_method: "create_session",
      input: {
        user_id: user.id,
      },
    };
    try {
      const { data } = await agentClient.post(AGENT_QUERY_PATH, body);
      console.log("agent123", data);
      const { sessionId, name } = extractSessionMetadata(data);
      if (!sessionId) {
        throw new AppError("Unable to determine session id from agent response", 502);
      }

      return { ok: true, sessionId };
    } catch (error) {
      logger?.error?.(error, "Failed to create agent conversation");
      throw error instanceof AppError ? error : new AppError(`Failed to create agent: ${error.message}`);
      // throw error instanceof AppError ? error : new AppError("Failed to create agent conversation");
    }
  };

  service.refreshAgentToken = async () => {
    try {
      const auth = new GoogleAuth({
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
        ...resolveAgentAuthOptions(),
      });
      const client = await auth.getClient();
      const accessTokenResponse = await client.getAccessToken();
      const token =
        typeof accessTokenResponse === "string" ? accessTokenResponse : accessTokenResponse?.token;

      if (!token) {
        throw new Error("Unable to retrieve Google access token");
      }
      agentToken = token;
      agentTokenLoaded = true;
      await persistAgentToken(agentToken);

      return token;
    } catch (error) {
      logger?.error?.(error, "Failed to refresh agent token via GoogleAuth");
      throw error;
    }
  };

  service.streamConversation = async (clientContext, userId, sessionId, message) => {
    const normalizedMessage = typeof message === "string" ? message.trim() : "";
    if (!normalizedMessage) {
      throw new AppError("Message is required", 400);
    }

    const body = {
      class_method: "async_stream_query",
      input: {
        user_id: userId,
        session_id: sessionId,
        message: normalizedMessage,
      },
    };

    try {
      const response = await agentClient.post(AGENT_STREAM_QUERY_PATH, body);
      console.log(response);
      const streamChunks = normalizeAgentStreamChunks(response?.data);
      if (!streamChunks.length && typeof response?.data === "string") {
        streamChunks.push(response.data);
      }

      console.log('streamchunks', streamChunks);

      const plainTextSegments = [];
      const jsonBlocks = [];

      for (const chunk of streamChunks) {
        const { jsonBlocks: blocks, plainText } = extractAllJsonBlocksAndPlainText(chunk);
        if (plainText) {
          plainTextSegments.push(plainText);
        }
        if (Array.isArray(blocks) && blocks.length) {
          jsonBlocks.push(...blocks);
        }
      }

      const detailSections = jsonBlocks.flatMap((payload) => {
        if (extractTitleFromStructuredPayload(payload)) return [];
        if (Array.isArray(payload?.data)) return payload.data;
        if (Array.isArray(payload)) return payload;
        return [];
      });

      const plainText = plainTextSegments.join("\n\n") || null;
      const structuredPayload = jsonBlocks.length > 1 ? jsonBlocks : (jsonBlocks[0] ?? null);

      const structuredTitle = jsonBlocks
        .map((payload) => extractTitleFromStructuredPayload(payload))
        .find(Boolean);

      return {
        structuredPayload,
        plainText,
        plainTextSegments,
      };
    } catch (error) {
      logger?.error?.(error, "Failed to stream agent conversation");
      throw error instanceof AppError ? error : new AppError("Failed to stream conversation");
    }
  };

  service.pushConversationDetail = async ({ userId, conversationId, details }) => {
    if (!conversationId) {
      throw new AppError("conversationId is required", 400);
    }
    if (!userId) {
      throw new AppError("userId is required", 400);
    }

    if (!Array.isArray(details) || details.length === 0) {
      return false;
    }

    const upsertPayloads = details
      .map((detailEntry) => {
        if (!detailEntry || typeof detailEntry !== "object") {
          return null;
        }
        const title = typeof detailEntry.title === "string" ? detailEntry.title.trim() : "";
        if (!title) {
          return null;
        }
        const markdown =
          typeof detailEntry.markdown === "string"
            ? detailEntry.markdown
            : JSON.stringify(detailEntry);

        return {
          conversationId,
          userId,
          title,
          detail: markdown,
        };
      })
      .filter(Boolean);

    if (!upsertPayloads.length) {
      return false;
    }

    return true;
  };
  return service;
}
