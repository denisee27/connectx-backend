export function makeProfileService({ userRepository }) {
    return {
        async findProfileById(id) {
            return userRepository.findById(id);
        },
        async updateProfile(id, data) {
            return userRepository.updateProfile(id, data);
        },
    };
}