export function makeProfileService({ userRepository }) {
    return {
        async findProfileById(id) {
            return userRepository.findById(id);
        },
        async updateProfile(id, data) {
            return userRepository.update(id, data);
        },
        async findTemporaryUser(id) {
            return userRepository.findTemporaryUser(id);
        },
    };
}