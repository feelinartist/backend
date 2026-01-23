import { configService } from './config-service';

export class SpotifyService {
    private token: string | null = null;
    private tokenExpiresAt: number = 0;

    private async getAccessToken(): Promise<string | null> {
        if (this.token && Date.now() < this.tokenExpiresAt) {
            return this.token;
        }

        const clientId = await configService.get('SPOTIFY_CLIENT_ID');
        const clientSecret = await configService.get('SPOTIFY_CLIENT_SECRET');

        if (!clientId || !clientSecret) {
            // Warn only once or debug log to avoid spamming
            if (process.env.NODE_ENV === 'development') {
                console.warn('Spotify credentials missing. Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in System Configuration.');
            }
            return null;
        }

        const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

        try {
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${authString}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: 'grant_type=client_credentials'
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('Spotify Auth Error:', error);
                return null;
            }

            const data = await response.json() as { access_token: string; expires_in: number };
            this.token = data.access_token;
            this.tokenExpiresAt = Date.now() + (data.expires_in * 1000) - 60000; // Expire 1 min early
            return this.token;
        } catch (error) {
            console.error('Failed to authenticate with Spotify:', error);
            return null;
        }
    }

    public async searchTracks(query: string) {
        const token = await this.getAccessToken();

        // Graceful fallback: return empty if no token (creds missing)
        if (!token) return { tracks: { items: [] } };

        try {
            const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) return { tracks: { items: [] } };

            return await response.json();
        } catch (error) {
            console.error('Spotify Search Error:', error);
            return { tracks: { items: [] } };
        }
    }

    public async getArtist(artistId: string) {
        const token = await this.getAccessToken();
        if (!token) return null;

        try {
            const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error('Spotify Get Artist Error:', error);
            return null;
        }
    }

    public async getTrack(trackId: string) {
        const token = await this.getAccessToken();
        if (!token) return null;

        try {
            const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error('Spotify Get Track Error:', error);
            return null;
        }
    }

    public async getArtistGenres(artistId: string): Promise<string[]> {
        // Try cache first
        const cacheKey = `spotify:artist:genres:${artistId}`;
        const { redisService } = await import('./redis-service');

        try {
            const cached = await redisService.get(cacheKey);
            if (cached) return JSON.parse(cached);
        } catch (err) {
            console.warn('Redis error in getArtistGenres:', err);
        }

        const artist = await this.getArtist(artistId);
        const artistData = artist as { genres?: string[] };
        const genres = artistData?.genres || [];

        // Save to cache (24 hours)
        if (genres.length > 0) {
            try {
                await redisService.set(cacheKey, JSON.stringify(genres), 86400);
            } catch (err) {
                console.warn('Redis save error in getArtistGenres:', err);
            }
        }

        return genres;
    }
}
