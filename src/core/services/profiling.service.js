import axios from "axios";
import jwt from "jsonwebtoken";
import { ValidationError, NotFoundError } from "../errors/httpErrors.js"; import { email } from "zod";
import crypto from "crypto";

export function makeProfilingService({ roomRepository, questionRepository, categoryRepository, userRepository, prisma, logger, env }) {
    return {
        async createTemporaryUser(body) {
            let {
                profile,
                preferences,
                answers,
                meetUpPreference,
                isAuthenticated,
            } = body;

            const userDummy = await userRepository.findDummyUser(profile.email);
            if (userDummy && !isAuthenticated) {
                await userRepository.deleteByEmail(userDummy.email);
            }

            const userExisting = await userRepository.findExistingUser(profile.email);
            if (userExisting && !isAuthenticated) {
                return { requestLogin: true };
            }
            let newUser = profile;
            if (isAuthenticated) {
                const existingUser = await userRepository.findByEmail(profile.email);
                newUser = existingUser;
                preferences = existingUser.preferences.map((p) => p.name);
            } else {
                const role = await prisma.role.findFirst({ where: { name: "User", }, });
                newUser = await prisma.user.create({
                    data: {
                        name: profile.name,
                        email: profile.email,
                        roleId: role.id,
                        gender: profile.gender,
                        occupation: profile.occupation,
                        phoneNumber: profile.phoneNumber,
                        bornDate: profile.bornDate,
                        cityId: profile.city,
                        countryId: profile.countryId,
                    }
                });
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
            }

            const payload = {
                "user_id": newUser.id,
                "preferences": preferences,
                "personalities": answers,
                "meetup_preferences": meetUpPreference,
                "city_id": newUser?.city?.id || newUser?.cityId,
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
            const matches = response.data.matches || [];

            if (!matches || matches.length === 0) {
                logger.warn("Matchmaking API returned no room IDs, falling back to random selection");

                let fallbackRooms = [];

                // 1. Try to find random rooms in the user's country
                if (newUser.countryId) {
                    fallbackRooms = await roomRepository.findRandomByCountry(newUser.countryId, 3);
                }

                // 2. If no rooms in country (or country not set), get random rooms globally
                if (fallbackRooms.length === 0) {
                    fallbackRooms = await roomRepository.findRandom(3);
                }

                return { id: newUser.id, rooms: fallbackRooms };
            }

            const roomIds = matches.map(match => match.id);
            const rooms = await roomRepository.findByIds(roomIds);
            logger.info("Operation successful");
            return { id: newUser.id, rooms };
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