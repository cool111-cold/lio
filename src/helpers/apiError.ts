export const extractErrorDetail = async (res: Response): Promise<string | null> => {
    try {
        const data = await res.json()
        return typeof data?.detail === 'string' ? data.detail : null
    } catch {
        return null
    }
}
