import axios from "axios";
import jwt from "jsonwebtoken";
import { ValidationError, NotFoundError } from "../errors/httpErrors.js"; import { email } from "zod";
import crypto from "crypto";

export function makeProfilingService({ roomRepository, questionRepository, categoryRepository, userRepository, prisma, logger, env }) {
    return {
        async createTemporaryUser(body) {
            const {
                profile,
                preferences,
                answers,
                meetUpPreference,
            } = body;

            if (!profile || !preferences || !answers || !meetUpPreference) {
                throw new ValidationError("Missing required fields");
            }

            logger.info("Creating temporary user with data: %o", profile);

            const city = await prisma.city.findFirst({
                where: { id: profile.city },
                include: { country: true },
            });

            if (!city) {
                throw new NotFoundError(`City '${profile.city}' not found`);
            }

            const role = await prisma.role.findFirst({
                where: { name: "User" },
            });

            if (!role) {
                throw new NotFoundError("Default 'USER' role not found.");
            }
            let newUser;
            const existingUser = await userRepository.findByEmail(profile.email);
            if (existingUser) {
                newUser = existingUser;
            } else {
                newUser = await prisma.user.create({
                    data: {
                        name: profile.name,
                        email: profile.email,
                        gender: profile.gender,
                        occupation: profile.occupation,
                        phoneNumber: profile.phoneNumber,
                        bornDate: profile.bornDate,
                        cityId: city.id,
                        countryId: city.country.id,
                        roleId: role.id,
                    }
                });
            }
            // 4. Create Preferences (ganti tx -> prisma)
            // Code logic tetap menggunakan Promise.all sesuai permintaan
            await Promise.all(
                preferences.map((preference) =>
                    prisma.preference.create({
                        data: {
                            userId: newUser.id,
                            name: preference,
                        }
                    })
                )
            );

            const payload = {
                "user_id": newUser.id,
                "preferences": preferences,
                "personalities": answers,
                "meetup_preferences": meetUpPreference,
                "city_id": city.id,
            }
            logger.info("Calling matchmaking API");
            const response = await axios.post(env.AI_AGENT_URL + "/user/generate-embedding",
                payload,
                {
                    headers: {
                        "x-api-key": env.AI_TOKEN,
                        "Content-Type": "application/json"
                    }
                });

            console.log('matches:', response.data.matches)
            const matches = response.data.matches || [];
            if (!matches || matches.length === 0) {
                logger.warn("Matchmaking API returned no room IDs");
                return { rooms: [] };
            }
            const roomIds = matches.map(match => match.id);
            const rooms = await roomRepository.findByIds(roomIds);
            console.log('rooms:', rooms)
            logger.info("Operation successful");
            return { rooms };
        },

        async getQuestions() {
            const allQuestions = await questionRepository.findAll();
            for (let i = allQuestions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
            }

            const selectedQuestions = allQuestions.slice(0, 50);
            const payload = {
                "mbti_questions": selectedQuestions,
            };

            const response = await axios.post(
                `${env.AI_AGENT_URL}/mbti/questions`,
                payload,
                {
                    headers: {
                        "x-api-key": env.AI_TOKEN,
                    }
                }
            );

            const rawNewQuestions = response.data.mbti_questions || [];
            const questionsToInsert = rawNewQuestions
                .filter(q => q.id === null)
                .map(({ id, ...rest }) => rest);
            if (questionsToInsert.length > 0) {
                await prisma.questioner.createMany({
                    data: questionsToInsert,
                    skipDuplicates: true
                });
            }
            return response.data;
        },

        async updateProfile(userId, data) {
            return prisma.$transaction(tx => tx.user.update({
                where: { id: userId },
                data,
            }));
        },

        async getProfile(userId) {
            const user = await userRepository.findById(userId, {
                include: {
                    country: true,
                    city: true,
                },
            });
            if (!user) {
                throw new NotFoundError("User not found");
            }
            return user;
        },

        async getCategories() {
            const allCategories = await categoryRepository.findAll();
            return allCategories;
        },
    };

}