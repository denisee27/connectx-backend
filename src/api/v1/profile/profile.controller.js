import { fileURLToPath } from "url";
import path from "path";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";


export default {
    async getProfile(req, res, next) {
        try {
            const profileService = req.scope.resolve("profileService");
            const profile = await profileService.findProfileById(req.user.userId);
            res.status(200).json({ success: true, data: profile });
        } catch (error) {
            next(error);
        }
    },
    async getTemporaryUser(req, res, next) {
        try {
            const profileService = req.scope.resolve("profileService");
            const profile = await profileService.findTemporaryUser(req.params.id);
            res.status(200).json({ success: true, data: profile });
        } catch (error) {
            next(error);
        }
    },

    async updateBankProfile(req, res, next) {
        try {
            const profileService = req.scope.resolve("profileService");
            const profile = await profileService.updateBankProfile(req.user.userId, req.body);
            res.status(200).json({ success: true, data: profile });
        } catch (error) {
            next(error);
        }
    },


    async updateProfile(req, res, next) {
        try {
            const profileService = req.scope.resolve("profileService");

            // Guard: pastikan user terautentikasi
            const userId = req.user?.userId || req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, error: "Unauthenticated" });
            }

            const {
                name, email, phoneNumber, gender, countryId, cityId, bornDate, bankAccount, bankName,
                currentPassword, newPassword, confirmPassword,
            } = req.body;

            // Proses file hanya jika ada
            let filename;
            if (req.file?.buffer) {
                const __filename = fileURLToPath(import.meta.url);
                const __dirname = path.dirname(__filename);

                const uploadsDir = path.resolve(__dirname, "../../../../../uploads");
                await fs.mkdir(uploadsDir, { recursive: true });

                // Konversi gambar ke JPEG terkompresi
                const outputExt = "jpg";
                filename = `${uuidv4()}.${outputExt}`;
                const outputPath = path.join(uploadsDir, filename);

                await sharp(req.file.buffer)
                    .rotate()
                    .resize({ width: 1280, withoutEnlargement: true })
                    .jpeg({ quality: 80 })
                    .toFile(outputPath);
            }
            function extractPreferencesFromBody(body) {
                if (Array.isArray(body.preferences)) return body.preferences;
                if (body['preferences[]']) {
                    const v = body['preferences[]'];
                    return Array.isArray(v) ? v : [v];
                }
                const keys = Object.keys(body).filter((k) => k.startsWith('preferences['));
                if (keys.length > 0) {
                    return keys.sort().map((k) => body[k]);
                }
                if (typeof body.preferences === 'string') return [body.preferences];
                return [];
            }

            // Ambil preferences dari form-data dan sanitasi
            const rawPreferences = extractPreferencesFromBody(req.body);
            const preferences = Array.isArray(rawPreferences)
                ? Array.from(new Set(rawPreferences.map(s => String(s).trim()).filter(Boolean)))
                : [];

            const dataToUpdate = {
                name,
                email,
                phoneNumber,
                gender,
                countryId,
                cityId,
                bornDate: new Date(bornDate),
                bankAccount,
                bankName,
                profilePictureUrl: filename,
                preferences,
            };

            const profile = await profileService.updateProfile(userId, dataToUpdate);
            return res.status(200).json({ success: true, data: profile });
        } catch (error) {
            next(error);
        }
    }

}