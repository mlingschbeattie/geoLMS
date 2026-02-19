export function emit(state, event) {
    return {
        state,
        emitted: [event]
    };
}
export function emitMany(state, events) {
    return {
        state,
        emitted: [...events]
    };
}
