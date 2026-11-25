const getStorageKey = (): string =>
    `chat-app.hidden-chats.${localStorage.getItem('username') ?? 'guest'}`;

export const getHiddenChats = (): Set<string> => {
    try {
        const value: unknown = JSON.parse(localStorage.getItem(getStorageKey()) ?? '[]');
        if (Array.isArray(value) && value.every((name) => typeof name === 'string')) {
            return new Set(value.map((name) => name.toLowerCase()));
        }
    } catch {
        return new Set();
    }

    return new Set();
};

const saveHiddenChats = (names: Set<string>): void => {
    localStorage.setItem(getStorageKey(), JSON.stringify([...names]));
};

export const hideChat = (username: string): void => {
    const hiddenChats = getHiddenChats();
    hiddenChats.add(username.toLowerCase());
    saveHiddenChats(hiddenChats);
};

export const showChat = (username: string): void => {
    const hiddenChats = getHiddenChats();
    hiddenChats.delete(username.toLowerCase());
    saveHiddenChats(hiddenChats);
};
