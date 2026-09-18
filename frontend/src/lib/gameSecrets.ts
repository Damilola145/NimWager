const secrets = new Map<string, string>()

export function rememberGameSecret(gameId: string, seed: string) { secrets.set(gameId, seed) }
export function getGameSecret(gameId: string) { return secrets.get(gameId) }
